require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');

if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 16) {
    console.error('ОШИБКА: в файле .env задайте SESSION_SECRET (минимум 16 символов)');
    process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // сайт работает за nginx (reverse proxy)

const smallJson = express.json({ limit: '100kb' });
const bigJson = express.json({ limit: '5mb' });
const BIG_ROUTES = ['/api/questions', '/api/results', '/api/results/import', '/api/manual'];
app.use((req, res, next) => (BIG_ROUTES.includes(req.path) ? next() : smallJson(req, res, next)));

const TZ = process.env.TZ_NAME || 'Asia/Almaty';
// DATA_DIR — где хранятся база и видео. По умолчанию рядом с кодом.
// На сервере удобно вынести отдельно, например DATA_DIR=/var/lib/mysite
const DATA_DIR = path.resolve(process.env.DATA_DIR || __dirname);
const VIDEO_DIR = path.join(DATA_DIR, 'videos');
fs.mkdirSync(VIDEO_DIR, { recursive: true });
// Лимит должен быть не больше client_max_body_size в конфиге nginx
const MAX_VIDEO_MB = Number(process.env.MAX_VIDEO_MB) || 95;
// Картинки для инструкции по МИС
const IMG_DIR = path.join(DATA_DIR, 'manual-images');
fs.mkdirSync(IMG_DIR, { recursive: true });
const MAX_IMAGE_MB = 5;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

// Заголовки безопасности
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
});

// Сессии (вход хранится в защищённом cookie)
app.use(session({
    name: 'mamka.sid',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: 'auto',
        maxAge: 8 * 60 * 60 * 1000
    }
}));

// Отдаём ТОЛЬКО эти файлы. database.db, .env, server.js и остальное недоступно из интернета.
const PUBLIC_FILES = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/app.js': 'app.js',
    '/styles.css': 'styles.css',
    '/robots.txt': 'robots.txt',
    '/sitemap.xml': 'sitemap.xml'
};
app.get(Object.keys(PUBLIC_FILES), (req, res) => {
    res.sendFile(path.join(__dirname, PUBLIC_FILES[req.path]), err => {
        if (err && !res.headersSent) res.status(404).end();
    });
});

const db = new sqlite3.Database(path.join(DATA_DIR, 'database.db'));
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA busy_timeout = 5000');

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    if (!stored || !stored.includes(':')) return false;
    try {
        const [salt, key] = stored.split(':');
        const hash = crypto.scryptSync(password, salt, 64).toString('hex');
        return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(hash, 'hex'));
    } catch (e) {
        return false;
    }
}

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )
    `);

    db.run('CREATE TABLE IF NOT EXISTS app_data (key TEXT PRIMARY KEY, value TEXT)');
    db.run(`
        CREATE TABLE IF NOT EXISTS results (
            id TEXT PRIMARY KEY,
            username TEXT,
            theme TEXT,
            date TEXT,
            earnedScore REAL,
            maxScore REAL,
            correctCount INTEGER,
            totalCount INTEGER,
            percentage INTEGER,
            passed INTEGER,
            created_at INTEGER,
            details TEXT
        )
    `);
    // Для старых баз: добавляем колонку с разбором ответов
    db.all('PRAGMA table_info(results)', [], (err, cols) => {
        if (!err && cols && !cols.some(c => c.name === 'details')) {
            db.run('ALTER TABLE results ADD COLUMN details TEXT');
        }
    });
    db.run(`
        CREATE TABLE IF NOT EXISTS videos (
            id TEXT PRIMARY KEY,
            title TEXT,
            description TEXT,
            fileName TEXT,
            file TEXT,
            size INTEGER,
            addedAt TEXT,
            ready INTEGER DEFAULT 0,
            created_at INTEGER
        )
    `);
    // Недогруженные видео (обрыв загрузки) удаляем
    db.all('SELECT id, file FROM videos WHERE ready = 0', [], (err, rows) => {
        if (err || !rows) return;
        rows.forEach(r => {
            fs.unlink(path.join(VIDEO_DIR, r.file), () => {});
            db.run('DELETE FROM videos WHERE id = ?', [r.id]);
        });
    });

    // Удаляем дубли аккаунтов (оставляем самый первый с таким именем)
    db.run('DELETE FROM users WHERE id NOT IN (SELECT MIN(id) FROM users GROUP BY LOWER(username))');

    // Старые пароли в открытом виде переводим в хэш
    db.all('SELECT id, password FROM users', [], (err, rows) => {
        if (err) return console.error('Ошибка чтения пользователей:', err.message);
        rows.forEach(r => {
            if (r.password && !r.password.includes(':')) {
                db.run('UPDATE users SET password = ? WHERE id = ?', [hashPassword(r.password), r.id]);
            }
        });
    });

    // Пароль администратора берётся из .env (ADMIN_PASSWORD)
    const adminPass = process.env.ADMIN_PASSWORD;
    if (adminPass) {
        db.get("SELECT id FROM users WHERE LOWER(username) = 'admin'", [], (err, row) => {
            if (err) return console.error(err.message);
            const hashed = hashPassword(adminPass);
            if (row) {
                db.run('UPDATE users SET password = ?, role = ? WHERE id = ?', [hashed, 'admin', row.id]);
            } else {
                db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', hashed, 'admin']);
            }
        });
    } else {
        console.warn('ВНИМАНИЕ: ADMIN_PASSWORD не задан в .env');
    }

    // Предупреждение о слабых паролях
    setTimeout(() => {
        db.all('SELECT username, password FROM users', [], (err, rows) => {
            if (err) return;
            const weak = ['123', 'admin', '1234', '12345', '123456', 'password'];
            rows.forEach(r => {
                if (weak.some(w => verifyPassword(w, r.password))) {
                    console.warn(`ВНИМАНИЕ: у пользователя "${r.username}" слабый пароль. Смените его в панели администратора.`);
                }
            });
        });
    }, 1500);

    console.log('База данных подключена');
});

// --- Проверка доступа ---
function requireAuth(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'Требуется вход' });
    next();
}
function requireAdmin(req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'Требуется вход' });
    if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'Недостаточно прав' });
    next();
}

// --- Ограничение попыток входа (защита от подбора пароля) ---
const MIN_PASSWORD = 8;
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
function clientKey(req) {
    // req.ip берётся из X-Forwarded-For, который выставляет nginx (trust proxy)
    return req.ip;
}
function isBlocked(key) {
    const a = attempts.get(key);
    if (!a) return false;
    if (Date.now() - a.first > WINDOW_MS) { attempts.delete(key); return false; }
    return a.count >= MAX_ATTEMPTS;
}
function addFail(key) {
    const a = attempts.get(key);
    if (!a || Date.now() - a.first > WINDOW_MS) attempts.set(key, { count: 1, first: Date.now() });
    else a.count++;
}

function serverError(res, err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
}

// --- Вход / выход ---
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
        return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    }

    const key = clientKey(req);
    if (isBlocked(key)) {
        return res.status(429).json({ error: 'Слишком много попыток. Попробуйте через 15 минут' });
    }

    db.get('SELECT * FROM users WHERE LOWER(username) = LOWER(?)', [username.trim()], (err, user) => {
        if (err) return serverError(res, err);

        if (!user || !verifyPassword(password, user.password)) {
            addFail(key);
            return res.status(401).json({ error: 'Неверное имя пользователя или пароль' });
        }

        attempts.delete(key);
        req.session.regenerate(regenErr => {
            if (regenErr) return serverError(res, regenErr);
            req.session.user = { id: user.id, username: user.username, role: user.role };
            res.json({ success: true, user: req.session.user });
        });
    });
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('mamka.sid');
        res.json({ success: true });
    });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
    res.json({ user: req.session.user });
});

// --- Пользователи (только администратор) ---
app.get('/api/users', requireAdmin, (req, res) => {
    db.all('SELECT id, username, role FROM users ORDER BY id ASC', [], (err, rows) => {
        if (err) return serverError(res, err);
        res.json(rows);
    });
});

app.post('/api/users', requireAdmin, (req, res) => {
    const { username, password, role } = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
        return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
    }
    if (password.length < MIN_PASSWORD) {
        return res.status(400).json({ error: 'Пароль слишком короткий (минимум ' + MIN_PASSWORD + ' символов)' });
    }

    const trimmedUsername = username.trim();
    const userRole = role === 'admin' ? 'admin' : 'user';

    db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?)', [trimmedUsername], (err, row) => {
        if (err) return serverError(res, err);
        if (row) return res.status(409).json({ error: 'Пользователь с таким именем уже существует' });

        db.run(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            [trimmedUsername, hashPassword(password), userRole],
            function (insertErr) {
                if (insertErr) return serverError(res, insertErr);
                res.status(201).json({
                    success: true,
                    user: { id: this.lastID, username: trimmedUsername, role: userRole }
                });
            }
        );
    });
});

function countOtherAdmins(excludeId, cb) {
    db.get("SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND id != ?", [excludeId], (err, row) => {
        cb(err, row ? row.c : 0);
    });
}

app.put('/api/users/:username', requireAdmin, (req, res) => {
    const { password, role } = req.body || {};

    db.get('SELECT id, password, role FROM users WHERE LOWER(username) = LOWER(?)', [req.params.username], (err, user) => {
        if (err) return serverError(res, err);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

        const newRole = role ? (role === 'admin' ? 'admin' : 'user') : user.role;
        let newPasswordHash = user.password;
        if (typeof password === 'string' && password.trim().length > 0) {
            if (password.trim().length < MIN_PASSWORD) {
                return res.status(400).json({ error: 'Пароль слишком короткий (минимум ' + MIN_PASSWORD + ' символов)' });
            }
            newPasswordHash = hashPassword(password.trim());
        }

        const save = () => {
            db.run('UPDATE users SET password = ?, role = ? WHERE id = ?', [newPasswordHash, newRole, user.id], err2 => {
                if (err2) return serverError(res, err2);
                res.json({ success: true });
            });
        };

        if (user.role === 'admin' && newRole !== 'admin') {
            return countOtherAdmins(user.id, (e, c) => {
                if (e) return serverError(res, e);
                if (c === 0) return res.status(400).json({ error: 'Нельзя убрать права у последнего администратора' });
                save();
            });
        }
        save();
    });
});

app.delete('/api/users/:username', requireAdmin, (req, res) => {
    db.get('SELECT id, role FROM users WHERE LOWER(username) = LOWER(?)', [req.params.username], (err, user) => {
        if (err) return serverError(res, err);
        if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
        if (user.id === req.session.user.id) {
            return res.status(400).json({ error: 'Нельзя удалить самого себя' });
        }

        const remove = () => {
            db.run('DELETE FROM users WHERE id = ?', [user.id], err2 => {
                if (err2) return serverError(res, err2);
                res.json({ success: true });
            });
        };

        if (user.role === 'admin') {
            return countOtherAdmins(user.id, (e, c) => {
                if (e) return serverError(res, e);
                if (c === 0) return res.status(400).json({ error: 'Нельзя удалить последнего администратора' });
                remove();
            });
        }
        remove();
    });
});


// ============================================================
// Вопросы (общие для всех пользователей)
// ============================================================
app.get('/api/questions', requireAuth, (req, res) => {
    db.get("SELECT value FROM app_data WHERE key = 'questions'", [], (err, row) => {
        if (err) return serverError(res, err);
        let questions = null;
        if (row) { try { questions = JSON.parse(row.value); } catch (e) { questions = null; } }
        res.json({ questions });
    });
});

app.put('/api/questions', requireAdmin, bigJson, (req, res) => {
    const q = req.body && req.body.questions;
    if (!Array.isArray(q) || q.length > 5000) {
        return res.status(400).json({ error: 'Неверный формат вопросов' });
    }
    db.run(
        "INSERT INTO app_data (key, value) VALUES ('questions', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [JSON.stringify(q)],
        err => {
            if (err) return serverError(res, err);
            res.json({ success: true });
        }
    );
});

// ============================================================
// Результаты тестирования
// ============================================================
function formatDate(d) {
    const date = d.toLocaleDateString('ru-RU', { timeZone: TZ });
    const time = d.toLocaleTimeString('ru-RU', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
}

function rowToResult(r) {
    return {
        id: r.id,
        username: r.username,
        theme: r.theme,
        date: r.date,
        earnedScore: r.earnedScore,
        maxScore: r.maxScore,
        correctCount: r.correctCount,
        totalCount: r.totalCount,
        percentage: r.percentage,
        passed: !!r.passed,
        hasDetails: !!r.hasDetails
    };
}

// Разбор ответов по вопросам: проверяем формат и ограничиваем размер
function cleanDetails(d) {
    if (!Array.isArray(d) || d.length === 0 || d.length > 500) return null;
    const out = [];
    for (const q of d) {
        if (!q || typeof q !== 'object' || !Array.isArray(q.options) || q.options.length > 30) return null;
        const options = q.options.map(o => ({
            text: String((o && o.text) || '').slice(0, 1000),
            correct: !!(o && o.correct),
            chosen: !!(o && o.chosen)
        }));
        out.push({
            id: String(q.id || '').slice(0, 100),
            text: String(q.text || '').slice(0, 2000),
            points: cleanNumber(q.points, 100000) || 0,
            isCorrect: options.every(o => o.correct === o.chosen),
            videoId: typeof q.videoId === 'string' && VIDEO_ID_RE.test(q.videoId) ? q.videoId : null,
            options
        });
    }
    const json = JSON.stringify(out);
    return json.length <= 500000 ? json : null;
}

function cleanNumber(v, max) {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 && n <= max ? n : null;
}

// Проверяет числа результата, пересчитывает процент и статус на сервере
function buildResult(b) {
    const earned = cleanNumber(b.earnedScore, 100000);
    const maxScore = cleanNumber(b.maxScore, 100000);
    const correct = cleanNumber(b.correctCount, 10000);
    const total = cleanNumber(b.totalCount, 10000);
    if ([earned, maxScore, correct, total].includes(null) || earned > maxScore || correct > total) return null;
    const percentage = maxScore > 0 ? Math.round((earned / maxScore) * 100) : 0;
    return {
        theme: String(b.theme || '').slice(0, 200),
        earnedScore: earned,
        maxScore,
        correctCount: correct,
        totalCount: total,
        percentage,
        passed: percentage >= 70 ? 1 : 0
    };
}

app.get('/api/results', requireAuth, (req, res) => {
    const isAdmin = req.session.user.role === 'admin';
    const cols = 'id, username, theme, date, earnedScore, maxScore, correctCount, totalCount, percentage, passed, created_at, (details IS NOT NULL) AS hasDetails';
    const sql = isAdmin
        ? `SELECT ${cols} FROM results ORDER BY created_at ASC`
        : `SELECT ${cols} FROM results WHERE LOWER(username) = LOWER(?) ORDER BY created_at ASC`;
    db.all(sql, isAdmin ? [] : [req.session.user.username], (err, rows) => {
        if (err) return serverError(res, err);
        res.json(rows.map(rowToResult));
    });
});

app.post('/api/results', requireAuth, bigJson, (req, res) => {
    const r = buildResult(req.body || {});
    if (!r) return res.status(400).json({ error: 'Неверные данные результата' });

    const now = new Date();
    const id = 'res_' + now.getTime() + '_' + crypto.randomBytes(3).toString('hex');
    const username = req.session.user.username; // имя берётся из сессии, а не от клиента
    const date = formatDate(now);
    const details = cleanDetails(req.body.details);

    db.run(
        `INSERT INTO results (id, username, theme, date, earnedScore, maxScore, correctCount, totalCount, percentage, passed, created_at, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, username, r.theme, date, r.earnedScore, r.maxScore, r.correctCount, r.totalCount, r.percentage, r.passed, now.getTime(), details],
        err => {
            if (err) return serverError(res, err);
            res.status(201).json({ success: true, result: rowToResult({ id, username, date, ...r, hasDetails: !!details }) });
        }
    );
});

// Один результат с разбором ответов: видит владелец или администратор
app.get('/api/results/:id', requireAuth, (req, res) => {
    if (!/^[a-z0-9_]{1,80}$/i.test(req.params.id)) return res.status(400).json({ error: 'Неверный id' });
    db.get('SELECT * FROM results WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return serverError(res, err);
        if (!row) return res.status(404).json({ error: 'Результат не найден' });
        const isAdmin = req.session.user.role === 'admin';
        if (!isAdmin && String(row.username).toLowerCase() !== req.session.user.username.toLowerCase()) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }
        let details = null;
        if (row.details) { try { details = JSON.parse(row.details); } catch (e) { details = null; } }
        res.json({ result: rowToResult({ ...row, hasDetails: !!row.details }), details });
    });
});

// Однократный перенос старых результатов из браузера администратора
app.post('/api/results/import', requireAdmin, bigJson, (req, res) => {
    const list = req.body && req.body.results;
    if (!Array.isArray(list) || list.length > 5000) {
        return res.status(400).json({ error: 'Неверный формат' });
    }
    const base = Date.now() - list.length;
    let imported = 0;
    db.serialize(() => {
        list.forEach((b, i) => {
            const r = buildResult(b || {});
            if (!r || typeof b.username !== 'string' || !b.username.trim()) return;
            const id = 'imp_' + base + '_' + i + '_' + crypto.randomBytes(2).toString('hex');
            imported++;
            db.run(
                `INSERT INTO results (id, username, theme, date, earnedScore, maxScore, correctCount, totalCount, percentage, passed, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, b.username.trim().slice(0, 100), r.theme, String(b.date || '').slice(0, 40),
                 r.earnedScore, r.maxScore, r.correctCount, r.totalCount, r.percentage, r.passed, base + i]
            );
        });
        db.run('SELECT 1', [], () => res.json({ success: true, imported }));
    });
});

app.delete('/api/results', requireAdmin, (req, res) => {
    db.run('DELETE FROM results', [], err => {
        if (err) return serverError(res, err);
        res.json({ success: true });
    });
});

// ============================================================
// Видеотека (файлы лежат в папке videos рядом с сайтом)
// ============================================================
const VIDEO_ID_RE = /^vid_[a-z0-9_]+$/i;
const VIDEO_EXT = ['mp4', 'webm', 'mov', 'm4v', 'ogv'];

function rowToVideo(r) {
    return { id: r.id, title: r.title, desc: r.description || '', fileName: r.fileName, size: r.size, addedAt: r.addedAt };
}

app.get('/api/videos', requireAuth, (req, res) => {
    db.all('SELECT * FROM videos WHERE ready = 1 ORDER BY created_at ASC', [], (err, rows) => {
        if (err) return serverError(res, err);
        res.json(rows.map(rowToVideo));
    });
});

// Шаг 1: создаём запись о видео
app.post('/api/videos', requireAdmin, (req, res) => {
    const b = req.body || {};
    const title = typeof b.title === 'string' ? b.title.trim().slice(0, 200) : '';
    if (!title) return res.status(400).json({ error: 'Укажите название видео' });
    const size = cleanNumber(b.size, Number.MAX_SAFE_INTEGER);
    if (size === null) return res.status(400).json({ error: 'Неверный размер файла' });
    if (size > MAX_VIDEO_BYTES) {
        return res.status(413).json({ error: `Файл больше ${MAX_VIDEO_MB} МБ. Сожмите видео` });
    }

    const fileName = String(b.fileName || 'video.mp4').slice(0, 255);
    let ext = (fileName.split('.').pop() || '').toLowerCase();
    if (!VIDEO_EXT.includes(ext)) ext = 'mp4';

    const now = new Date();
    const id = 'vid_' + now.getTime() + '_' + crypto.randomBytes(3).toString('hex');
    const row = {
        id,
        title,
        description: String(b.desc || '').slice(0, 1000),
        fileName,
        file: `${id}.${ext}`,
        size,
        addedAt: now.toLocaleDateString('ru-RU', { timeZone: TZ })
    };
    db.run(
        'INSERT INTO videos (id, title, description, fileName, file, size, addedAt, ready, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)',
        [row.id, row.title, row.description, row.fileName, row.file, row.size, row.addedAt, now.getTime()],
        err => {
            if (err) return serverError(res, err);
            res.status(201).json({ success: true, video: rowToVideo(row) });
        }
    );
});

// Шаг 2: загрузка самого файла
app.put('/api/videos/:id/file', requireAdmin, (req, res) => {
    const id = req.params.id;
    if (!VIDEO_ID_RE.test(id)) return res.status(400).json({ error: 'Неверный id' });

    db.get('SELECT * FROM videos WHERE id = ? AND ready = 0', [id], (err, row) => {
        if (err) return serverError(res, err);
        if (!row) return res.status(404).json({ error: 'Видео не найдено' });

        const filePath = path.join(VIDEO_DIR, row.file);
        let failed = false;
        let received = 0;

        const fail = (code, msg) => {
            if (failed) return;
            failed = true;
            req.unpipe(out);
            // файл удаляем только после закрытия потока, иначе он может создаться заново
            const removeFile = () => fs.unlink(filePath, () => {});
            if (out.closed) removeFile(); else out.once('close', removeFile);
            out.destroy();
            db.run('DELETE FROM videos WHERE id = ?', [id]);
            req.resume(); // дочитываем и отбрасываем остаток запроса
            if (!res.headersSent) res.status(code).json({ error: msg });
        };

        const declared = Number(req.headers['content-length']);
        const out = fs.createWriteStream(filePath);

        if (declared > MAX_VIDEO_BYTES) {
            return fail(413, `Файл больше ${MAX_VIDEO_MB} МБ. Сожмите видео`);
        }

        req.on('data', chunk => {
            received += chunk.length;
            if (received > MAX_VIDEO_BYTES) fail(413, `Файл больше ${MAX_VIDEO_MB} МБ. Сожмите видео`);
        });
        req.on('error', () => fail(400, 'Ошибка загрузки'));
        req.on('aborted', () => fail(400, 'Загрузка прервана'));
        out.on('error', () => fail(500, 'Ошибка записи файла'));
        out.on('finish', () => {
            if (failed) return;
            if (received === 0) return fail(400, 'Пустой файл');
            db.run('UPDATE videos SET ready = 1, size = ? WHERE id = ?', [received, id], err2 => {
                if (err2) return serverError(res, err2);
                res.json({ success: true });
            });
        });
        req.pipe(out);
    });
});

app.get('/api/videos/:id/file', requireAuth, (req, res) => {
    if (!VIDEO_ID_RE.test(req.params.id)) return res.status(400).end();
    db.get('SELECT file FROM videos WHERE id = ? AND ready = 1', [req.params.id], (err, row) => {
        if (err) return serverError(res, err);
        if (!row) return res.status(404).end();
        res.sendFile(path.join(VIDEO_DIR, row.file), { headers: { 'Cache-Control': 'private, max-age=3600' } }, e => {
            if (e && !res.headersSent) res.status(404).end();
        });
    });
});

app.delete('/api/videos/:id', requireAdmin, (req, res) => {
    if (!VIDEO_ID_RE.test(req.params.id)) return res.status(400).json({ error: 'Неверный id' });
    db.get('SELECT file FROM videos WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return serverError(res, err);
        if (!row) return res.status(404).json({ error: 'Видео не найдено' });
        fs.unlink(path.join(VIDEO_DIR, row.file), () => {});
        db.run('DELETE FROM videos WHERE id = ?', [req.params.id], err2 => {
            if (err2) return serverError(res, err2);
            res.json({ success: true });
        });
    });
});

// ============================================================
// Инструкция по МИС и схема связи (редактирует администратор)
// ============================================================
const SECTION_ID_RE = /^[a-z0-9_-]{1,60}$/i;
const IMAGE_FILE_RE = /^img_[a-z0-9_]{1,80}\.(png|jpg|gif|webp)$/;

function cleanManual(m) {
    if (!m || !Array.isArray(m.sections) || m.sections.length > 200) return null;
    const sections = [];
    const seen = new Set();
    for (const s of m.sections) {
        if (!s || typeof s.id !== 'string' || !SECTION_ID_RE.test(s.id) || seen.has(s.id)) return null;
        if (!Array.isArray(s.blocks) || s.blocks.length > 100) return null;
        seen.add(s.id);
        const blocks = [];
        for (const b of s.blocks) {
            if (!b || typeof b !== 'object') return null;
            if (b.type === 'text') {
                blocks.push({ type: 'text', text: String(b.text || '').slice(0, 20000) });
            } else if (b.type === 'image') {
                if (typeof b.file !== 'string' || !IMAGE_FILE_RE.test(b.file)) return null;
                blocks.push({ type: 'image', file: b.file, caption: String(b.caption || '').slice(0, 300) });
            } else if (b.type === 'diagram') {
                blocks.push({ type: 'diagram' });
            } else {
                return null;
            }
        }
        const tags = Array.isArray(s.tags)
            ? s.tags.filter(t => typeof t === 'string').map(t => t.trim().slice(0, 40)).filter(Boolean).slice(0, 20)
            : [];
        sections.push({ id: s.id, title: String(s.title || '').trim().slice(0, 200), tags, blocks });
    }
    return { sections };
}

app.get('/api/manual', requireAuth, (req, res) => {
    db.get("SELECT value FROM app_data WHERE key = 'manual'", [], (err, row) => {
        if (err) return serverError(res, err);
        let manual = null;
        if (row) { try { manual = JSON.parse(row.value); } catch (e) { manual = null; } }
        res.json({ manual });
    });
});

app.put('/api/manual', requireAdmin, bigJson, (req, res) => {
    const manual = cleanManual(req.body);
    if (!manual) return res.status(400).json({ error: 'Неверный формат инструкции' });
    db.run(
        "INSERT INTO app_data (key, value) VALUES ('manual', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [JSON.stringify(manual)],
        err => {
            if (err) return serverError(res, err);
            res.json({ success: true });
            cleanupManualImages(manual);
        }
    );
});

// Удаляем картинки, которых больше нет в инструкции (свежие файлы не трогаем)
function cleanupManualImages(manual) {
    const used = new Set();
    manual.sections.forEach(s => s.blocks.forEach(b => { if (b.type === 'image') used.add(b.file); }));
    fs.readdir(IMG_DIR, (err, files) => {
        if (err) return;
        files.forEach(f => {
            if (used.has(f)) return;
            const full = path.join(IMG_DIR, f);
            fs.stat(full, (e, st) => {
                if (!e && Date.now() - st.mtimeMs > 60 * 60 * 1000) fs.unlink(full, () => {});
            });
        });
    });
}

function detectImageExt(buf) {
    if (!Buffer.isBuffer(buf) || buf.length < 12) return null;
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
    if (buf.toString('ascii', 0, 4) === 'GIF8') return 'gif';
    if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'webp';
    return null;
}

const imageBody = express.raw({
    type: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
    limit: MAX_IMAGE_MB + 'mb'
});

app.post('/api/manual/images', requireAdmin, imageBody, (req, res) => {
    const ext = detectImageExt(req.body);
    if (!ext) return res.status(400).json({ error: 'Допустимы только картинки PNG, JPG, GIF, WebP' });
    const file = 'img_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex') + '.' + ext;
    fs.writeFile(path.join(IMG_DIR, file), req.body, err => {
        if (err) return serverError(res, err);
        res.status(201).json({ success: true, file });
    });
});

app.get('/api/manual/images/:file', requireAuth, (req, res) => {
    if (!IMAGE_FILE_RE.test(req.params.file)) return res.status(400).end();
    res.sendFile(path.join(IMG_DIR, req.params.file), { headers: { 'Cache-Control': 'private, max-age=86400' } }, e => {
        if (e && !res.headersSent) res.status(404).end();
    });
});

// Ошибки разбора запросов (слишком большой файл, неверный JSON) возвращаем в JSON
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status = err.status || err.statusCode || 500;
    if (status === 413) return res.status(413).json({ error: 'Слишком большой файл или запрос' });
    if (status >= 400 && status < 500) return res.status(status).json({ error: 'Неверный запрос' });
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
});

const PORT = process.env.PORT || 3000;
// Слушаем только localhost: наружу сайт отдаёт nginx
const HOST = process.env.HOST || '127.0.0.1';
const server = app.listen(PORT, HOST, () => {
    console.log(`Server started: http://${HOST}:${PORT}`);
});

// Корректная остановка при `systemctl restart/stop`
function shutdown() {
    server.close(() => db.close(() => process.exit(0)));
    setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
