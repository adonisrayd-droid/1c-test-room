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
app.set('trust proxy', 1); // сайт работает за Cloudflare Tunnel

const smallJson = express.json({ limit: '100kb' });
const bigJson = express.json({ limit: '5mb' });
const BIG_ROUTES = ['/api/questions', '/api/results/import'];
app.use((req, res, next) => (BIG_ROUTES.includes(req.path) ? next() : smallJson(req, res, next)));

const TZ = process.env.TZ_NAME || 'Asia/Almaty';
const VIDEO_DIR = path.join(__dirname, 'videos');
fs.mkdirSync(VIDEO_DIR, { recursive: true });
const MAX_VIDEO_MB = 95; // у Cloudflare Tunnel лимит загрузки 100 МБ
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

const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

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
            created_at INTEGER
        )
    `);
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
const attempts = new Map();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60 * 1000;
function clientKey(req) {
    return req.headers['cf-connecting-ip'] || req.ip;
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
    if (password.length < 4) {
        return res.status(400).json({ error: 'Пароль слишком короткий (минимум 4 символа)' });
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
            if (password.trim().length < 4) {
                return res.status(400).json({ error: 'Пароль слишком короткий (минимум 4 символа)' });
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
        passed: !!r.passed
    };
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
    const sql = isAdmin
        ? 'SELECT * FROM results ORDER BY created_at ASC'
        : 'SELECT * FROM results WHERE LOWER(username) = LOWER(?) ORDER BY created_at ASC';
    db.all(sql, isAdmin ? [] : [req.session.user.username], (err, rows) => {
        if (err) return serverError(res, err);
        res.json(rows.map(rowToResult));
    });
});

app.post('/api/results', requireAuth, (req, res) => {
    const r = buildResult(req.body || {});
    if (!r) return res.status(400).json({ error: 'Неверные данные результата' });

    const now = new Date();
    const id = 'res_' + now.getTime() + '_' + crypto.randomBytes(3).toString('hex');
    const username = req.session.user.username; // имя берётся из сессии, а не от клиента
    const date = formatDate(now);

    db.run(
        `INSERT INTO results (id, username, theme, date, earnedScore, maxScore, correctCount, totalCount, percentage, passed, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, username, r.theme, date, r.earnedScore, r.maxScore, r.correctCount, r.totalCount, r.percentage, r.passed, now.getTime()],
        err => {
            if (err) return serverError(res, err);
            res.status(201).json({ success: true, result: rowToResult({ id, username, date, ...r }) });
        }
    );
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started: http://localhost:${PORT}`);
});
