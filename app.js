// --- MIS Manual Data ---
const MANUAL_SECTIONS = [
    {
        id: "sec1",
        title: "1. Общее правило: связка документов",
        text: `Работа в МИС строится на трёх связанных документах:
1. <b>Заявка</b> — факт того, что пациента записали.
2. <b>Приём</b> — факт того, что врач принял пациента.
3. <b>Продажа (Оказание услуг)</b> — факт того, что пациент оплатил.

Во всех трёх документах должны строго совпадать: <b>пациент, врач, филиал, услуга и её количество</b>. Если что-то из этого расходится — деньги не попадут в выработку сотрудника, даже если он всё сделал правильно на своём этапе.

⚠️ <b>Важно:</b> если вы не уверены, что заявка уже существует — сначала проверьте карточку пациента, а не создавайте новую.`,
        tags: ["связка", "документы", "выработка", "ошибка"]
    },
    {
        id: "sec2",
        title: "2. Если у врача или медсестры не рассчитывается выработка",
        text: `Порядок проверки при отсутствии выработки:
1. Создан ли документ Приёма на эту услугу? Без приёма выработка не считается никогда.
2. Приём проведён? (нажата кнопка «Провести», а не просто «Записать»).
3. В приёме заполнен состав услуг? Поле не должно быть пустым.
4. Услуга и её количество одинаковые в заявке, приёме и продаже?
5. Заявка не отменена и не помечена на удаление?
6. Продажа (оплата) проведена?

<b>Поменяли дату в приёме, а выработка всё равно считается по старой дате:</b>
Выработка в отчёте считается по дате продажи (оплаты), а не по дате приёма. Чтобы изменить месяц в отчёте — меняйте дату в документе продажи, а не в приёме.

<b>Продажа оформлена на одного врача, а приём — на другого:</b>
Порядок исправления:
1. Открыть заявку, поменять врача, нажать «Записать».
2. Открыть оказание услуг, поменять врача, нажать «Провести».
Именно в этом порядке — от заявки к продаже, а не наоборот.

<b>Новый сотрудник — ничего не падает в выработку, хотя всё верно:</b>
Для нового врача или медсестры ответственный сотрудник должен создать документ «Установка выработки». Без этого документа деньги не будут считаться.`,
        tags: ["выработка", "ошибка", "прием", "новый сотрудник", "дата"]
    },
    {
        id: "sec3",
        title: "3. Возврат оплаты",
        text: `<b>Нужно вернуть деньги за лишнюю/ошибочную услугу:</b>
1. Открыть исходный документ продажи (не создавать новый!).
2. Нажать «Создать» → «Оформить возврат».
3. Провести документ возврата.
4. Нажать «Оформить возврат».
⚠️ <b>Важно:</b> если предыдущая попытка не удалась — редактируйте тот же документ возврата, не создавайте новый.

<b>Возврат наличными не проходит:</b>
Проверьте сумму, наработанную по кассе за смену (Х-отчёт) — возврат не пройдёт, если сумма возврата больше этой величины.`,
        tags: ["возврат", "касса", "деньги", "ошибка"]
    },
    {
        id: "sec4",
        title: "4. Лабораторные заявки, штрихкоды и отмена заявки",
        text: `<b>Забыли отсканировать штрихкод:</b>
1. Открыть лабораторную заявку.
2. Присвоить штрихкод.
3. Нажать «Произвести забор биоматериалов».

<b>Нужно пересдать анализ с новым штрихкодом:</b>
1. Удалить документ-основание в лабораторной заявке.
2. В документе оказания услуг нажать «Принять в лабораторию».
3. Присвоить новый штрихкод, отправить заявку.

<b>Если сделали возврат оказания услуг:</b>
После возврата средств нужно обязательно зайти в лабораторную заявку ЛИС и отменить заявку.`,
        tags: ["лаборатория", "штрихкод", "анализы", "возврат"]
    },
    {
        id: "sec5",
        title: "5. Заявки: правила для регистраторов",
        text: `Регистратор может создавать собственную заявку, если пациент пришёл без предварительной записи.
⚠️ <b>Важно:</b> перед созданием новой заявки обязательно проверьте, нет ли уже заявки оператора на этого пациента. Если создать вторую параллельную заявку — оператору не упадёт зарплата за его работу.

<b>Как проверить:</b> открыть карточку пациента и посмотреть список всех его заявок, прежде чем создавать новую.`,
        tags: ["регистратор", "заявка", "дубли", "зарплата"]
    },
    {
        id: "sec6",
        title: "6. Двойные карточки пациентов",
        text: `<b>Причина создания дублей:</b> при поиске не нашли существующую карточку (например, из-за разного написания ФИО) и создали новую.
⚠️ <b>Важно:</b> всегда ищите пациента по <b>ИИН</b>, а не по ФИО — это полностью исключает создание дублей.

Если карточки уже задвоились — объединить их может только поддержка, самостоятельно это не делается.`,
        tags: ["карточка", "дубли", "пациент", "иин", "поддержка"]
    },
    {
        id: "sec7",
        title: "7. Касса и чек",
        text: `<b>Оплату приняли одним способом, а в МИС провели другим:</b>
Например, оплата прошла по терминалу, а в системе оформлена как наличные.
1. Оформить возврат по документу с неверным способом оплаты.
2. Создать новую продажу с правильным способом оплаты.
«Переключить» способ оплаты в уже пробитом чеке нельзя.

<b>Чек не пробивается:</b>
Проверьте по порядку:
• Есть ли услуга в заявке? If нет — добавить её туда, провести.
• Проведён ли документ оказания услуг?`,
        tags: ["касса", "чек", "ошибка", "оплата", "терминал"]
    },
    {
        id: "sec8",
        title: "8. Доступы, пароли и периоды",
        text: `<b>Забыли пароль:</b>
Поддержка не видит старый пароль и может только сбросить его на новый. Новый пароль сообщается лично сотруднику.

<b>Нужно изменить права доступа:</b>
Права выдаются только через официальную заявку (через систему Элма), которую подаёт ответственный сотрудник филиала. Напрямую через поддержку МИС права не меняются.

<b>Период закрыт, нужно исправить документ:</b>
Для открытия периода нужно письмо на почту бухгалтеру с указанием: периода, ответственного (кому нужно открыть права) и причины. Татьяну или Екатерину — в копию, чтобы они открыли доступ после согласования всеми ответственными.
📧 <i>Татьяна:</i> t.tazhibayeva@divera.kz
📧 <i>Екатерина:</i> e.vilizhanina@divera.kz`,
        tags: ["пароль", "права", "период", "бухгалтер", "элма"]
    },
    {
        id: "sec9",
        title: "9. Технические неполадки",
        text: `<b>Программа зависает или не грузится:</b>
В первую очередь проверьте интернет-провайдера — часто дело именно в нём, а не в МИС.`,
        tags: ["зависает", "интернет", "ошибка", "поддержка"]
    }
];

// --- Custom MIS Testing Questions (Derived from Manual) ---
const DEFAULT_QUESTIONS = [
    {
        id: "mis_q1",
        text: "Какие три документа образуют обязательную связку для корректного расчета выработки сотрудника в МИС?",
        theme: "Связи документов",
        points: 1,
        options: [
            { text: "Заявка, Приём, Продажа (Оказание услуг)", correct: true },
            { text: "Карточка пациента, Лабораторный штрихкод, Кассовый чек", correct: false },
            { text: "Установка выработки, Приём, Отчёт кассира", correct: false },
            { text: "Заявка, Лабораторная заявка, Письмо бухгалтеру", correct: false }
        ]
    },
    {
        id: "mis_q2",
        text: "Какие параметры должны строго совпадать во всех трех документах (заявке, приеме и продаже), чтобы врачу начислилась выработка? (Выберите все подходящие)",
        theme: "Связи документов",
        points: 2,
        options: [
            { text: "Филиал", correct: true },
            { text: "Врач", correct: true },
            { text: "Пациент", correct: true },
            { text: "Способ оплаты (наличные/карта)", correct: false },
            { text: "Услуга и её количество", correct: true }
        ]
    },
    {
        id: "mis_q3",
        text: "Что из перечисленного НЕ препятствует расчету выработки врача по оказанной услуге?",
        theme: "Выработка и зарплата",
        points: 1,
        options: [
            { text: "Документ приема записан, но не проведен", correct: false },
            { text: "В приеме заполнен состав услуг", correct: true },
            { text: "Заявка помечена на удаление или отменена", correct: false },
            { text: "Документ оказания услуг (продажи) не проведен", correct: false }
        ]
    },
    {
        id: "mis_q4",
        text: "Вы поменяли дату в документе «Прием» на прошлый месяц, но в отчетах выработка все равно считается по старой дате текущего месяца. Как изменить месяц расчета?",
        theme: "Выработка и зарплата",
        points: 1,
        options: [
            { text: "Поменять дату в документе продажи (оплаты), так как выработка считается по дате продажи", correct: true },
            { text: "Написать письмо Татьяне или Екатерине для ручного исправления отчета", correct: false },
            { text: "Создать документ «Установка выработки» с новой датой", correct: false },
            { text: "Пометить прием на удаление и создать новый прием верной датой", correct: false }
        ]
    },
    {
        id: "mis_q5",
        text: "Продажа (оплата) оформлена на одного врача, а прием — на другого. Каков правильный порядок действий для исправления врача?",
        theme: "Связи документов",
        points: 2,
        options: [
            { text: "Сначала открыть заявку, сменить врача, нажать «Записать». Затем открыть оказание услуг, поменять врача и нажать «Провести»", correct: true },
            { text: "Сначала открыть оказание услуг, поменять врача. Затем поменять врача в заявке", correct: false },
            { text: "Оформить возврат продажи, после чего отредактировать врача в документе приема", correct: false },
            { text: "Удалить продажу и прием, затем создать их заново", correct: false }
        ]
    },
    {
        id: "mis_q6",
        text: "В систему устроен новый врач. Все его документы оформляются верно, но деньги не попадают в его выработку. Что забыл сделать ответственный сотрудник?",
        theme: "Выработка и зарплата",
        points: 1,
        options: [
            { text: "Создать документ «Установка выработки» для этого сотрудника", correct: true },
            { text: "Запросить новые права доступа через систему Элма", correct: false },
            { text: "Отправить письмо бухгалтеру с копией Татьяне для открытия периода", correct: false },
            { text: "Присвоить врачу индивидуальный штрихкод в лабораторной заявке", correct: false }
        ]
    },
    {
        id: "mis_q7",
        text: "Как правильно оформить возврат денежных средств за ошибочно проведенную услугу?",
        theme: "Возвраты и касса",
        points: 1,
        options: [
            { text: "Открыть исходный документ продажи, нажать «Создать» -> «Оформить возврат» и провести его", correct: true },
            { text: "Создать новый пустой документ продажи и выбрать операцию «Сторно»", correct: false },
            { text: "Удалить ошибочный документ продажи из системы вручную", correct: false },
            { text: "Просто создать новый документ оказания услуг с отрицательной суммой", correct: false }
        ]
    },
    {
        id: "mis_q8",
        text: "Какое основное правило должен соблюдать регистратор при поиске пациента, чтобы избежать создания двойных карточек (дублей)?",
        theme: "Регистратура и доступы",
        points: 1,
        options: [
            { text: "Всегда осуществлять поиск пациента по ИИН, а не по ФИО", correct: true },
            { text: "Искать пациента по полному имени и дате рождения", correct: false },
            { text: "Искать пациента по номеру его мобильного телефона", correct: false },
            { text: "Создавать новую карточку каждый раз, если ФИО не найдено с первого раза", correct: false }
        ]
    },
    {
        id: "mis_q9",
        text: "В чеке ошибочно провели оплату наличными вместо оплаты картой по терминалу. Как исправить способ оплаты?",
        theme: "Возвраты и касса",
        points: 2,
        options: [
            { text: "Оформить возврат по документу с неверной оплатой, после чего создать новую продажу с правильным способом оплаты", correct: true },
            { text: "Просто переключить способ оплаты в исходном пробитом чеке", correct: false },
            { text: "Написать письмо бухгалтеру с просьбой перепровести платеж в кассе", correct: false },
            { text: "Удалить лабораторную заявку и пересканировать штрихкод с верной оплатой", correct: false }
        ]
    },
    {
        id: "mis_q10",
        text: "Какой порядок согласования открытия закрытого периода для исправления проведенного документа?",
        theme: "Регистратура и доступы",
        points: 1,
        options: [
            { text: "Отправить письмо бухгалтеру с указанием периода, ответственного и причины, добавив в копию Татьяну и Екатерину", correct: true },
            { text: "Подать заявку через систему Элма на изменение пароля", correct: false },
            { text: "Обратиться напрямую к интернет-провайдеру для сброса настроек", correct: false },
            { text: "Удалить документ возврата и создать его заново в открытом периоде", correct: false }
        ]
    }
];

// --- State Variables ---
let questions = [];
let results = [];
let users = [];
let currentUser = null;

// Active quiz state
let activeQuiz = {
    theme: "",
    questions: [],
    currentIndex: 0,
    userAnswers: {}, 
    timeRemaining: 0, 
    timerInterval: null,
    totalSeconds: 300 
};

// Editing entities state
let editingQuestionId = null;
let editingUserUsername = null;

// Video library state (metadata in localStorage, blobs in IndexedDB)
let videoMeta = []; // [{id, title, desc, fileName, size}]
let videoDB = null; // IndexedDB instance
let pendingVideoBlob = null; // temp blob while filling add form

// --- Helper Functions ---
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        if (response.ok) {
            users = await response.json();
        } else {
            console.error("Не удалось загрузить пользователей с сервера");
        }
    } catch (err) {
        console.error("Ошибка подключения к серверу при загрузке пользователей:", err);
    }
}

// --- Загрузка и сохранение общих данных на сервере ---
async function jsonOrNull(response) {
    try { return await response.json(); } catch (e) { return null; }
}

async function loadServerData() {
    try {
        const [qRes, rRes, vRes] = await Promise.all([
            fetch('/api/questions'),
            fetch('/api/results'),
            fetch('/api/videos')
        ]);

        if (qRes.status === 401) {
            showToast("Сессия истекла. Войдите снова", "warning");
            logout();
            return;
        }

        if (qRes.ok) {
            const data = await jsonOrNull(qRes);
            if (data && Array.isArray(data.questions)) {
                questions = data.questions;
            } else {
                questions = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
                await migrateOldBrowserData();
            }
        }
        if (rRes.ok) {
            const data = await jsonOrNull(rRes);
            if (Array.isArray(data)) results = data;
        }
        if (vRes.ok) {
            const data = await jsonOrNull(vRes);
            if (Array.isArray(data)) videoMeta = data;
        }
        if (currentUser && currentUser.role === 'admin') {
            await loadUsers();
        }
    } catch (err) {
        console.error("Ошибка загрузки данных:", err);
        showToast("Не удалось загрузить данные с сервера", "error");
    }
}

// Однократный перенос старых вопросов и результатов из браузера администратора на сервер
async function migrateOldBrowserData() {
    if (!currentUser || currentUser.role !== 'admin') return;
    try {
        const oldQ = JSON.parse(localStorage.getItem("1c_sim_questions") || "null");
        if (Array.isArray(oldQ) && oldQ.length > 0) {
            questions = oldQ;
            await saveQuestions();
        }
        const oldR = JSON.parse(localStorage.getItem("1c_sim_results") || "null");
        if (Array.isArray(oldR) && oldR.length > 0) {
            const r = await fetch('/api/results/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: oldR })
            });
            if (r.ok) {
                const rr = await fetch('/api/results');
                if (rr.ok) results = await rr.json();
            }
        }
        if ((Array.isArray(oldQ) && oldQ.length) || (Array.isArray(oldR) && oldR.length)) {
            showToast("Старые вопросы и результаты перенесены на сервер", "success");
        }
    } catch (err) {
        console.error("Ошибка переноса старых данных:", err);
    }
}

async function saveQuestions() {
    try {
        const r = await fetch('/api/questions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questions })
        });
        if (r.status === 401) {
            showToast("Сессия истекла. Войдите снова", "warning");
            logout();
            return;
        }
        if (!r.ok) throw new Error("save failed");
    } catch (err) {
        console.error(err);
        showToast("Не удалось сохранить вопросы на сервере", "error");
    }
}

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", async () => {

    questions = JSON.parse(JSON.stringify(DEFAULT_QUESTIONS));
    results = [];

    // Восстанавливаем вход, если сессия на сервере ещё действует
    const storedUser = sessionStorage.getItem("1c_sim_user");
    if (storedUser) {
        try {
            const meRes = await fetch('/api/auth/me');
            if (meRes.ok) {
                const me = await meRes.json();
                currentUser = { name: me.user.username, role: me.user.role };
                sessionStorage.setItem("1c_sim_user", JSON.stringify(currentUser));
                await loadServerData();
                if (currentUser) initUserSession();
            } else {
                sessionStorage.removeItem("1c_sim_user");
            }
        } catch (err) {
            console.error("Ошибка проверки сессии:", err);
        }
    }

    // Draw manual contents
    renderManual();


});

// --- Auth logic ---
async function login() {
    const usernameInput = document.getElementById("auth-username");
    const passwordInput = document.getElementById("auth-password");
    
    const name = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!name || !password) {
        showToast("Пожалуйста, введите имя пользователя и пароль", "error");
        return;
    }
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: name,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            showToast(data.error || "Неверное имя пользователя или пароль!", "error");
            return;
        }

        currentUser = {
            name: data.user.username,
            role: data.user.role
        };
        
        sessionStorage.setItem("1c_sim_user", JSON.stringify(currentUser));
        await loadServerData();
        passwordInput.value = ""; // clear password field
        initUserSession();
        showToast(`Успешный вход! Добро пожаловать, ${currentUser.name}`, "success");
    } catch (err) {
        console.error("Ошибка при входе:", err);
        showToast("Ошибка связи с сервером", "error");
    }
}

function initUserSession() {
    document.getElementById("screen-auth").classList.remove("active");
    document.getElementById("app-sidebar").style.display = "flex";
    document.getElementById("top-header").style.display = "flex";
    
    const avatar = document.getElementById("widget-avatar");
    const nameEl = document.getElementById("widget-username");
    const roleEl = document.getElementById("widget-role");
    
    avatar.textContent = currentUser.name.charAt(0).toUpperCase();
    nameEl.textContent = currentUser.name;
    
    if (currentUser.role === 'admin') {
        roleEl.textContent = "Администратор";
        roleEl.style.color = "var(--accent-orange)";
        avatar.style.borderColor = "var(--accent-orange)";
        
        document.getElementById("nav-questions").style.display = "flex";
        document.getElementById("nav-users").style.display = "flex";
        document.getElementById("nav-results").style.display = "flex";
        document.getElementById("video-admin-toolbar").style.display = "flex";
        document.getElementById("video-empty-hint").textContent = "Нажмите «Загрузить видео» выше, чтобы добавить первый ролик.";
    } else {
        roleEl.textContent = "Тестируемый";
        roleEl.style.color = "var(--accent-gold)";
        avatar.style.borderColor = "var(--accent-gold)";
        
        document.getElementById("nav-questions").style.display = "none";
        document.getElementById("nav-users").style.display = "none";
        document.getElementById("nav-results").style.display = "none";
    }
    
    // Default screen: instructions
    switchScreen('instructions');
}

function logout() {
    if (activeQuiz.timerInterval) {
        clearInterval(activeQuiz.timerInterval);
    }
    
    currentUser = null;
    sessionStorage.removeItem("1c_sim_user");
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    
    document.getElementById("app-sidebar").style.display = "none";
    document.getElementById("top-header").style.display = "none";
    document.getElementById("auth-username").value = "";
    
    const screens = document.querySelectorAll(".screen");
    screens.forEach(s => s.classList.remove("active"));
    document.getElementById("screen-auth").classList.add("active");
    
    showToast("Вы вышли из системы", "success");
}

// --- Navigation ---
function switchScreen(screenId) {
    if (document.getElementById("screen-quiz").classList.contains("active") && screenId !== 'quiz') {
        if (!confirm("Вы действительно хотите прервать тестирование? Результаты не будут сохранены.")) {
            return;
        }
        clearInterval(activeQuiz.timerInterval);
    }
    
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => item.classList.remove("active"));
    
    const activeNavItem = document.getElementById(`nav-${screenId}`);
    if (activeNavItem) {
        activeNavItem.classList.add("active");
    }
    
    const screens = document.querySelectorAll(".screen");
    screens.forEach(s => s.classList.remove("active"));
    
    const targetScreen = document.getElementById(`screen-${screenId}`);
    targetScreen.classList.add("active");
    
    const titles = {
        'dashboard': 'Личный кабинет',
        'instructions': 'Инструкция по работе в МИС',
        'quiz': 'Прохождение теста',
        'result': 'Итоги тестирования',
        'questions': 'База вопросов и тем',
        'users': 'Управление пользователями (Администрирование)',
        'results': 'Все результаты тестирования',
        'videos': 'Видеотека — Обучающие материалы'
    };
    document.getElementById("screen-title").textContent = titles[screenId] || '';
    
    if (screenId === 'dashboard') {
        renderDashboard();
    } else if (screenId === 'questions') {
        renderQuestionsList();
    } else if (screenId === 'users') {
        renderUsersList();
    } else if (screenId === 'results') {
        renderResultsList();
    } else if (screenId === 'videos') {
        renderVideoLibrary();
    }

    // Подтягиваем свежие данные с сервера (чтобы все видели одно и то же)
    if (currentUser && ['dashboard', 'questions', 'users', 'results', 'videos'].includes(screenId)) {
        loadServerData().then(() => {
            if (!currentUser) return;
            const el = document.getElementById(`screen-${screenId}`);
            if (!el || !el.classList.contains('active')) return;
            if (screenId === 'dashboard') renderDashboard();
            else if (screenId === 'questions') renderQuestionsList();
            else if (screenId === 'users') renderUsersList();
            else if (screenId === 'results') renderResultsList();
            else if (screenId === 'videos') renderVideoLibrary();
        });
    }
}

// --- Theme ---
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById("theme-icon");
    
    if (body.classList.contains("light-theme")) {
        body.classList.remove("light-theme");
        icon.className = "fa-solid fa-moon";
        showToast("Включена темная тема", "success");
    } else {
        body.classList.add("light-theme");
        icon.className = "fa-solid fa-sun";
        showToast("Включена светлая тема", "success");
    }
}

// --- Render MIS Manual ---
function renderManual() {
    const container = document.getElementById("manual-sections-container");
    container.innerHTML = "";
    
    MANUAL_SECTIONS.forEach(sec => {
        const card = document.createElement("div");
        card.className = "panel-card manual-section-card";
        card.id = `manual-${sec.id}`;
        card.dataset.tags = sec.tags.join(" ");
        
        let formattedText = sec.text.replace(/\n/g, "<br>");
        
        // Highlight warning markers
        formattedText = formattedText.replace(/⚠️/g, '<span style="color: var(--warning);"><i class="fa-solid fa-triangle-exclamation"></i></span>');
        
        card.innerHTML = `
            <div class="panel-header" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 12px;">
                <h3 class="panel-title" style="color: var(--accent-gold); font-size: 17px;">
                    <i class="fa-solid fa-circle-info" style="color: var(--accent-orange);"></i>
                    ${sec.title}
                </h3>
            </div>
            <div style="font-size: 14px; line-height: 1.6; color: var(--text-primary);">
                ${formattedText}
            </div>
            <div style="display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap;">
                ${sec.tags.map(t => `<span class="badge" style="background: rgba(255,255,255,0.05); color: var(--text-secondary); font-size: 9px;">#${t}</span>`).join("")}
            </div>
        `;
        container.appendChild(card);
    });
}

function filterManual() {
    const searchVal = document.getElementById("search-manual-input").value.trim().toLowerCase();
    const cards = document.querySelectorAll(".manual-section-card");
    
    cards.forEach(card => {
        const titleText = card.querySelector(".panel-title").textContent.toLowerCase();
        const contentText = card.querySelector("div").textContent.toLowerCase();
        const tagsText = card.dataset.tags.toLowerCase();
        
        if (titleText.includes(searchVal) || contentText.includes(searchVal) || tagsText.includes(searchVal)) {
            card.style.display = "flex";
        } else {
            card.style.display = "none";
        }
    });
}

// --- Dashboard ---
function renderDashboard() {
    const userResults = results.filter(r => r.username === currentUser.name);
    
    document.getElementById("stat-completed").textContent = userResults.length;
    
    let avgScore = 0;
    let passedCount = 0;
    if (userResults.length > 0) {
        const sum = userResults.reduce((acc, curr) => acc + curr.percentage, 0);
        avgScore = Math.round(sum / userResults.length);
        passedCount = userResults.filter(r => r.passed).length;
    }
    
    document.getElementById("stat-avg-score").textContent = `${avgScore}%`;
    
    const successRate = userResults.length > 0 ? Math.round((passedCount / userResults.length) * 100) : 0;
    document.getElementById("stat-success-rate").textContent = `${successRate}%`;
    
    // Render Themes list
    const themesMap = {};
    questions.forEach(q => {
        themesMap[q.theme] = (themesMap[q.theme] || 0) + 1;
    });
    
    const themeListEl = document.getElementById("available-themes-list");
    themeListEl.innerHTML = "";
    
    if (Object.keys(themesMap).length === 0) {
        themeListEl.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 20px;">Нет доступных тестов в базе вопросов. Добавьте вопросы как администратор!</div>`;
    } else {
        Object.entries(themesMap).forEach(([themeName, questionCount]) => {
            const card = document.createElement("div");
            card.className = "theme-card";
            card.onclick = () => startQuiz(themeName);
            
            const themeAttempts = userResults.filter(r => r.theme === themeName);
            let scoreLabel = "Нет попыток";
            if (themeAttempts.length > 0) {
                const maxAttempt = themeAttempts.reduce((max, c) => c.percentage > max.percentage ? c : max, themeAttempts[0]);
                scoreLabel = `Рекорд: ${maxAttempt.percentage}% (${maxAttempt.passed ? 'Сдан' : 'Не сдан'})`;
            }
            
            card.innerHTML = `
                <div class="theme-info">
                    <span class="theme-name">${themeName}</span>
                    <div class="theme-stats">
                        <span><i class="fa-solid fa-list-ol"></i> ${questionCount} вопр.</span>
                        <span><i class="fa-solid fa-clock"></i> 5 мин.</span>
                        <span style="color: var(--accent-orange); font-weight: 500;">${scoreLabel}</span>
                    </div>
                </div>
                <button class="btn btn-icon"><i class="fa-solid fa-play"></i></button>
            `;
            themeListEl.appendChild(card);
        });
    }
    
    renderChart(userResults);
}

function renderChart(userResults) {
    const chartContainer = document.getElementById("stats-chart");
    chartContainer.innerHTML = "";
    
    const last5 = userResults.slice(-5);
    
    if (last5.length === 0) {
        chartContainer.innerHTML = `<div style="color: var(--text-muted); text-align: center; width: 100%; margin-bottom: 50px;">Пройдите первый тест для отображения динамики!</div>`;
        return;
    }
    
    last5.forEach((res, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "chart-bar-wrapper";
        
        const bar = document.createElement("div");
        bar.className = "chart-bar";
        
        if (res.passed) {
            bar.style.background = "linear-gradient(to top, var(--success), #a7ffeb)";
            bar.style.boxShadow = "0 4px 10px rgba(46, 196, 182, 0.25)";
        } else {
            bar.style.background = "linear-gradient(to top, var(--error), #ff8a80)";
            bar.style.boxShadow = "0 4px 10px rgba(230, 57, 70, 0.25)";
        }
        
        const label = document.createElement("span");
        label.className = "chart-label";
        label.textContent = `${res.percentage}%`;
        
        const title = document.createElement("span");
        title.className = "chart-label";
        title.style.fontSize = "9px";
        title.textContent = `Поп. ${index + 1}`;
        
        wrapper.appendChild(label);
        wrapper.appendChild(bar);
        wrapper.appendChild(title);
        
        chartContainer.appendChild(wrapper);
        
        setTimeout(() => {
            bar.style.height = `${res.percentage}%`;
        }, 100);
    });
}

// --- Interactive Quiz ---
function startQuiz(themeName) {
    const themeQuestions = questions.filter(q => q.theme === themeName);
    
    if (themeQuestions.length === 0) {
        showToast("В этой теме нет вопросов!", "error");
        return;
    }
    
    const shuffled = [...themeQuestions].sort(() => Math.random() - 0.5);
    
    activeQuiz.theme = themeName;
    activeQuiz.questions = shuffled;
    activeQuiz.currentIndex = 0;
    activeQuiz.userAnswers = {};
    activeQuiz.timeRemaining = activeQuiz.totalSeconds;
    
    if (activeQuiz.timerInterval) {
        clearInterval(activeQuiz.timerInterval);
    }
    
    updateTimerDisplay();
    activeQuiz.timerInterval = setInterval(() => {
        activeQuiz.timeRemaining--;
        updateTimerDisplay();
        if (activeQuiz.timeRemaining <= 0) {
            submitQuiz(true);
        }
    }, 1000);
    
    switchScreen('quiz');
    renderCurrentQuestion();
    renderQuestionNavigationDots();
}

function updateTimerDisplay() {
    const minutes = Math.floor(activeQuiz.timeRemaining / 60);
    const seconds = activeQuiz.timeRemaining % 60;
    const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const timerVal = document.getElementById("quiz-timer-val");
    const timerBox = document.getElementById("quiz-timer-box");
    
    timerVal.textContent = timeString;
    
    if (activeQuiz.timeRemaining <= 60) {
        timerBox.classList.add("timer-warning");
    } else {
        timerBox.classList.remove("timer-warning");
    }
}

function renderQuestionNavigationDots() {
    const dotsContainer = document.getElementById("quiz-question-dots");
    dotsContainer.innerHTML = "";
    
    activeQuiz.questions.forEach((q, idx) => {
        const dot = document.createElement("div");
        dot.className = "q-dot";
        dot.textContent = idx + 1;
        
        if (idx === activeQuiz.currentIndex) {
            dot.classList.add("active");
        }
        
        if (activeQuiz.userAnswers[q.id] && activeQuiz.userAnswers[q.id].length > 0) {
            dot.classList.add("answered");
        }
        
        dot.onclick = () => {
            activeQuiz.currentIndex = idx;
            renderCurrentQuestion();
            renderQuestionNavigationDots();
        };
        
        dotsContainer.appendChild(dot);
    });
}

function renderCurrentQuestion() {
    const q = activeQuiz.questions[activeQuiz.currentIndex];
    
    const qNumEl = document.getElementById("quiz-question-number");
    const qPctEl = document.getElementById("quiz-percent");
    const progressFill = document.getElementById("quiz-progress-bar");
    
    const percent = Math.round((activeQuiz.currentIndex / activeQuiz.questions.length) * 100);
    qNumEl.textContent = `Вопрос ${activeQuiz.currentIndex + 1} из ${activeQuiz.questions.length} (Баллов: ${q.points})`;
    qPctEl.textContent = `${percent}% пройдено`;
    progressFill.style.width = `${percent}%`;
    
    document.getElementById("quiz-question-text").textContent = q.text;
    
    const answersList = document.getElementById("quiz-answers-list");
    answersList.innerHTML = "";
    
    const correctCount = q.options.filter(o => o.correct).length;
    const isMultiple = correctCount > 1;
    
    q.options.forEach((opt, idx) => {
        const card = document.createElement("div");
        card.className = "answer-card";
        if (isMultiple) card.classList.add("multiple");
        
        const selectedList = activeQuiz.userAnswers[q.id] || [];
        const isSelected = selectedList.includes(idx);
        
        if (isSelected) {
            card.classList.add("selected");
        }
        
        card.onclick = () => selectAnswer(idx, isMultiple);
        
        card.innerHTML = `
            <div class="selector-circle">
                <div class="selector-inner"></div>
            </div>
            <span style="font-size: 15px; font-weight: 500;">${opt.text}</span>
        `;
        answersList.appendChild(card);
    });
    
    const btnPrev = document.getElementById("quiz-btn-prev");
    const btnNext = document.getElementById("quiz-btn-next");
    
    if (activeQuiz.currentIndex === 0) {
        btnPrev.style.visibility = "hidden";
    } else {
        btnPrev.style.visibility = "visible";
    }
    
    if (activeQuiz.currentIndex === activeQuiz.questions.length - 1) {
        btnNext.innerHTML = `Завершить <i class="fa-solid fa-circle-check"></i>`;
    } else {
        btnNext.innerHTML = `Далее <i class="fa-solid fa-chevron-right"></i>`;
    }
}

function selectAnswer(optIdx, isMultiple) {
    const q = activeQuiz.questions[activeQuiz.currentIndex];
    
    if (!activeQuiz.userAnswers[q.id]) {
        activeQuiz.userAnswers[q.id] = [];
    }
    
    const currentSelections = activeQuiz.userAnswers[q.id];
    
    if (isMultiple) {
        const existingIdx = currentSelections.indexOf(optIdx);
        if (existingIdx > -1) {
            currentSelections.splice(existingIdx, 1);
        } else {
            currentSelections.push(optIdx);
        }
    } else {
        activeQuiz.userAnswers[q.id] = [optIdx];
    }
    
    renderCurrentQuestion();
    renderQuestionNavigationDots();
}

// Navigation helpers
function prevQuestion() {
    if (activeQuiz.currentIndex > 0) {
        activeQuiz.currentIndex--;
        renderCurrentQuestion();
        renderQuestionNavigationDots();
    }
}

function nextQuestion() {
    if (activeQuiz.currentIndex < activeQuiz.questions.length - 1) {
        activeQuiz.currentIndex++;
        renderCurrentQuestion();
        renderQuestionNavigationDots();
    } else {
        submitQuiz(false);
    }
}

function submitQuiz(isTimeout = false) {
    clearInterval(activeQuiz.timerInterval);
    
    if (isTimeout) {
        showToast("Время вышло! Тестирование завершено автоматически.", "warning");
    }
    
    let totalMaxScore = 0;
    let earnedScore = 0;
    let correctQuestionsCount = 0;
    
    activeQuiz.questions.forEach(q => {
        totalMaxScore += q.points;
        const selected = activeQuiz.userAnswers[q.id] || [];
        let isCorrect = true;
        
        q.options.forEach((opt, idx) => {
            const isSelected = selected.includes(idx);
            if ((opt.correct && !isSelected) || (!opt.correct && isSelected)) {
                isCorrect = false;
            }
        });
        
        if (isCorrect) {
            earnedScore += q.points;
            correctQuestionsCount++;
        }
    });
    
    const percentage = totalMaxScore > 0 ? Math.round((earnedScore / totalMaxScore) * 100) : 0;
    const passed = percentage >= 70;
    
    const newResult = {
        id: "res_" + Date.now(),
        username: currentUser.name,
        theme: activeQuiz.theme,
        date: new Date().toLocaleDateString("ru-RU") + " " + new Date().toLocaleTimeString("ru-RU", {hour: '2-digit', minute:'2-digit'}),
        earnedScore: earnedScore,
        maxScore: totalMaxScore,
        correctCount: correctQuestionsCount,
        totalCount: activeQuiz.questions.length,
        percentage: percentage,
        passed: passed
    };
    
    results.push(newResult);
    displayResultSummary(newResult);

    fetch('/api/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResult)
    })
        .then(r => r.ok ? r.json() : Promise.reject(new Error("save failed")))
        .then(data => { if (data && data.result) Object.assign(newResult, data.result); })
        .catch(() => showToast("Не удалось сохранить результат на сервере", "error"));
}

function displayResultSummary(result) {
    switchScreen('result');
    
    const iconBox = document.getElementById("result-icon-box");
    const icon = document.getElementById("result-icon");
    const statusTitle = document.getElementById("result-status-title");
    const subtitle = document.getElementById("result-subtitle");
    const scoreVal = document.getElementById("result-score");
    const detailedScore = document.getElementById("result-detailed-score");
    
    scoreVal.innerHTML = `${result.percentage}<span>%</span>`;
    detailedScore.textContent = `Вопросов верно: ${result.correctCount} из ${result.totalCount} (набрано баллов: ${result.earnedScore} из ${result.maxScore})`;
    
    if (result.passed) {
        iconBox.className = "result-icon-circle result-success";
        icon.className = "fa-solid fa-check";
        statusTitle.textContent = "Тест успешно пройден!";
        subtitle.textContent = `Вы набрали достаточный балл для успешной сдачи темы «${result.theme}».`;
    } else {
        iconBox.className = "result-icon-circle result-failed";
        icon.className = "fa-solid fa-xmark";
        statusTitle.textContent = "Тест не сдан";
        subtitle.textContent = `Для прохождения теста необходимо набрать не менее 70%. Попробуйте еще раз!`;
    }

    // Show wrong answers with video links
    const wrongSection = document.getElementById("result-wrong-answers-section");
    wrongSection.innerHTML = "";
    const wrongQuestions = activeQuiz.questions.filter(q => {
        const selected = activeQuiz.userAnswers[q.id] || [];
        return !q.options.every((opt, idx) => opt.correct === selected.includes(idx));
    });
    const withVideo = wrongQuestions.filter(q => q.linkedVideoId && videoMeta.find(v => v.id === q.linkedVideoId));
    if (withVideo.length > 0) {
        wrongSection.innerHTML = `
            <div style="width:100%; border-top: 1px solid var(--border-color); padding-top: 20px; text-align: left;">
                <p style="font-size: 14px; color: var(--accent-orange); font-weight: 600; margin-bottom: 12px;">
                    <i class="fa-solid fa-film"></i> Обучающие видео по неверно отвеченным вопросам:
                </p>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${withVideo.map(q => {
                        const vm = videoMeta.find(v => v.id === q.linkedVideoId);
                        return `
                            <div class="video-result-card">
                                <div style="flex:1;">
                                    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Вопрос:</p>
                                    <p style="font-size: 13px; color: var(--text-primary); font-weight: 500;">${q.text.length > 90 ? q.text.substring(0,90)+'...' : q.text}</p>
                                </div>
                                <button class="btn btn-video-link" onclick="openVideoPlayer('${vm.id}')">
                                    <i class="fa-solid fa-circle-play"></i> ${escapeHtml(vm.title)}
                                </button>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}

// --- Admin Section: Questions ---
function renderQuestionsList() {
    const listEl = document.getElementById("admin-questions-list");
    listEl.innerHTML = "";
    
    const searchVal = document.getElementById("search-questions-input").value.trim().toLowerCase();
    const filtered = questions.filter(q => 
        q.text.toLowerCase().includes(searchVal) || 
        q.theme.toLowerCase().includes(searchVal)
    );
    
    if (filtered.length === 0) {
        listEl.innerHTML = `<div style="color: var(--text-muted); text-align: center; padding: 40px;">Вопросы не найдены</div>`;
        return;
    }
    
    // Reset select-all checkbox state
    const selectAllCb = document.getElementById("select-all-questions");
    if (selectAllCb) selectAllCb.checked = false;
    updateExportCount();

    filtered.forEach(q => {
        const card = document.createElement("div");
        card.className = "question-card";
        
        const correctCount = q.options.filter(o => o.correct).length;
        const typeLabel = correctCount > 1 ? "Мульти-выбор" : "Один выбор";
        
        let optionsHtml = "";
        q.options.forEach(opt => {
            optionsHtml += `
                <div class="question-option-item ${opt.correct ? 'correct' : ''}">
                    <i class="fa-solid ${opt.correct ? 'fa-circle-check' : 'fa-circle'}"></i>
                    <span>${escapeHtml(opt.text)}</span>
                </div>
            `;
        });
        
        card.innerHTML = `
            <div class="question-card-header">
                <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
                    <input type="checkbox" class="question-select-cb" data-id="${escapeHtml(q.id)}"
                        onchange="updateExportCount()"
                        style="width: 18px; height: 18px; margin-top: 3px; flex-shrink: 0; cursor: pointer; accent-color: var(--accent-orange);">
                    <div style="display: flex; flex-direction: column; gap: 8px; flex: 1;">
                        <div class="question-tags">
                            <span class="badge badge-orange">${escapeHtml(q.theme)}</span>
                            <span class="badge badge-gold">${escapeHtml(q.points)} Б.</span>
                            <span class="badge badge-green">${typeLabel}</span>
                        </div>
                        <span class="question-text-title">${escapeHtml(q.text)}</span>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-icon" onclick="openQuestionModal('${escapeHtml(q.id)}')" title="Редактировать"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon btn-icon-danger" onclick="deleteQuestion('${escapeHtml(q.id)}')" title="Удалить"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>
            
            <div class="question-options-list">
                ${optionsHtml}
            </div>
        `;
        listEl.appendChild(card);
    });
}

function openQuestionModal(questionId = null) {
    editingQuestionId = questionId;
    const modal = document.getElementById("modal-question-overlay");
    const modalTitle = document.getElementById("question-modal-title");
    
    const textEl = document.getElementById("q-text");
    const themeEl = document.getElementById("q-theme");
    const pointsEl = document.getElementById("q-points");
    const optContainer = document.getElementById("q-options-container");
    const linkedVideoEl = document.getElementById("q-linked-video");

    // Populate video dropdown
    linkedVideoEl.innerHTML = '<option value="">— Не привязывать видео —</option>';
    videoMeta.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.textContent = v.title;
        linkedVideoEl.appendChild(opt);
    });

    optContainer.innerHTML = "";
    
    if (questionId) {
        modalTitle.textContent = "Редактирование вопроса";
        const q = questions.find(item => item.id === questionId);
        
        textEl.value = q.text;
        themeEl.value = q.theme;
        pointsEl.value = q.points;
        linkedVideoEl.value = q.linkedVideoId || "";
        
        q.options.forEach(opt => {
            addOptionRow(opt.text, opt.correct);
        });
    } else {
        modalTitle.textContent = "Создание нового вопроса";
        textEl.value = "";
        themeEl.value = "";
        pointsEl.value = "1";
        linkedVideoEl.value = "";
        
        addOptionRow("", false);
        addOptionRow("", false);
    }
    
    modal.classList.add("active");
}

function closeQuestionModal() {
    document.getElementById("modal-question-overlay").classList.remove("active");
    editingQuestionId = null;
}

function addOptionRow(text = "", correct = false) {
    const container = document.getElementById("q-options-container");
    const row = document.createElement("div");
    row.className = "option-row";
    
    row.innerHTML = `
        <input type="checkbox" class="option-checkbox" ${correct ? 'checked' : ''} title="Верный ответ">
        <input type="text" class="form-input option-input" style="padding-left: 16px;" placeholder="Вариант ответа..." value="${text}">
        <button class="btn-icon btn-icon-danger" onclick="this.parentElement.remove()" style="height: 40px; width: 40px;" title="Удалить вариант"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function saveQuestion() {
    const text = document.getElementById("q-text").value.trim();
    const theme = document.getElementById("q-theme").value.trim();
    const points = parseInt(document.getElementById("q-points").value);
    
    if (!text || !theme) {
        showToast("Заполните текст вопроса и тему!", "error");
        return;
    }
    
    if (isNaN(points) || points <= 0) {
        showToast("Укажите корректный балл за вопрос!", "error");
        return;
    }
    
    const optionRows = document.querySelectorAll("#q-options-container .option-row");
    const options = [];
    let correctCount = 0;
    
    for (let i = 0; i < optionRows.length; i++) {
        const row = optionRows[i];
        const optText = row.querySelector(".option-input").value.trim();
        const optCorrect = row.querySelector(".option-checkbox").checked;
        
        if (!optText) {
            showToast("Заполните тексты всех вариантов ответов!", "error");
            return;
        }
        
        options.push({ text: optText, correct: optCorrect });
        if (optCorrect) correctCount++;
    }
    
    if (options.length < 2) {
        showToast("Добавьте минимум 2 варианта ответа!", "error");
        return;
    }
    
    if (correctCount === 0) {
        showToast("Отметьте хотя бы один правильный ответ!", "error");
        return;
    }
    
    if (editingQuestionId) {
        const idx = questions.findIndex(q => q.id === editingQuestionId);
        questions[idx] = {
            id: editingQuestionId,
            text,
            theme,
            points,
            options,
            linkedVideoId: document.getElementById("q-linked-video").value || null
        };
        showToast("Вопрос успешно обновлен", "success");
    } else {
        const newQ = {
            id: "q_" + Date.now(),
            text,
            theme,
            points,
            options,
            linkedVideoId: document.getElementById("q-linked-video").value || null
        };
        questions.push(newQ);
        showToast("Вопрос успешно добавлен в базу", "success");
    }
    
    saveQuestions();
    closeQuestionModal();
    renderQuestionsList();
}

function deleteQuestion(id) {
    if (confirm("Вы действительно хотите удалить этот вопрос?")) {
        questions = questions.filter(q => q.id !== id);
        saveQuestions();
        renderQuestionsList();
        showToast("Вопрос удален", "success");
    }
}

// --- Select / Export selected questions ---
function toggleSelectAllQuestions(checkbox) {
    const cbs = document.querySelectorAll(".question-select-cb");
    cbs.forEach(cb => { cb.checked = checkbox.checked; });
    updateExportCount();
}

function updateExportCount() {
    const cbs = document.querySelectorAll(".question-select-cb:checked");
    const label = document.getElementById("export-count-label");
    const btn = document.getElementById("btn-export-questions");
    if (label) {
        label.textContent = cbs.length > 0 ? `(${cbs.length})` : "";
    }
    if (btn) {
        btn.style.opacity = cbs.length > 0 ? "1" : "0.55";
    }
    // Keep select-all in sync
    const allCbs = document.querySelectorAll(".question-select-cb");
    const selectAllCb = document.getElementById("select-all-questions");
    if (selectAllCb && allCbs.length > 0) {
        selectAllCb.checked = cbs.length === allCbs.length;
        selectAllCb.indeterminate = cbs.length > 0 && cbs.length < allCbs.length;
    }
}

function exportSelectedQuestions() {
    const cbs = document.querySelectorAll(".question-select-cb:checked");
    if (cbs.length === 0) {
        showToast("Выберите хотя бы один вопрос для выгрузки!", "warning");
        return;
    }

    const selectedIds = Array.from(cbs).map(cb => cb.dataset.id);
    const selectedQuestions = questions.filter(q => selectedIds.includes(q.id));

    const headers = [
        "Тема", "Текст вопроса", "Баллы",
        "Вариант 1", "Верный 1",
        "Вариант 2", "Верный 2",
        "Вариант 3", "Верный 3",
        "Вариант 4", "Верный 4",
        "Вариант 5", "Верный 5",
        "Вариант 6", "Верный 6",
        "Вариант 7", "Верный 7",
        "Вариант 8", "Верный 8",
        "Вариант 9", "Верный 9",
        "Вариант 10", "Верный 10"
    ];

    const rows = selectedQuestions.map(q => {
        const row = {
            "Тема": q.theme,
            "Текст вопроса": q.text,
            "Баллы": q.points
        };
        for (let i = 1; i <= 10; i++) {
            const opt = q.options[i - 1];
            row[`Вариант ${i}`] = opt ? opt.text : "";
            row[`Верный ${i}`] = opt && opt.correct ? "Да" : "";
        }
        return row;
    });

    try {
        const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Вопросы");
        const fileName = `Вопросы_МИС_${new Date().toLocaleDateString("ru-RU").replace(/\./g, "-")}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        showToast(`Выгружено вопросов: ${selectedQuestions.length}`, "success");
    } catch (err) {
        console.error(err);
        showToast("Ошибка при выгрузке Excel!", "error");
    }
}

// --- Admin Section: User Management ---
function renderUsersList() {
    const tableBody = document.getElementById("admin-users-table-body");
    tableBody.innerHTML = "";
    
    const searchVal = document.getElementById("search-users-input").value.trim().toLowerCase();
    const filtered = users.filter(u => u.username.toLowerCase().includes(searchVal));
    
    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 30px;">Пользователи не найдены</td></tr>`;
        return;
    }
    
    filtered.forEach(u => {
        const row = document.createElement("tr");
        const roleLabel = u.role === 'admin' ? 'Администратор' : 'Тестируемый';
        const badgeClass = u.role === 'admin' ? 'badge-orange' : 'badge-gold';
        
        row.innerHTML = `
            <td style="font-weight: 600;">${escapeHtml(u.username)}</td>
            <td><span class="badge ${badgeClass}">${roleLabel}</span></td>
            <td style="font-family: monospace; font-weight: 600; color: var(--text-muted);" title="Пароль защищен и хранится в виде криптографического хэша">••••••••</td>
            <td>
                <div class="card-actions">
                    <button class="btn-icon" onclick="openUserModal('${escapeHtml(u.username)}')" title="Изменить пароль/роль"><i class="fa-solid fa-user-pen"></i></button>
                    <button class="btn-icon btn-icon-danger" onclick="deleteUser('${escapeHtml(u.username)}')" title="Удалить пользователя"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function openUserModal(username = null) {
    editingUserUsername = username;
    const modal = document.getElementById("modal-user-overlay");
    const title = document.getElementById("user-modal-title");
    const usernameInput = document.getElementById("u-username");
    const passwordInput = document.getElementById("u-password");
    const roleSelect = document.getElementById("u-role");
    
    if (username) {
        title.textContent = "Редактирование пользователя";
        const user = users.find(u => u.username === username);
        usernameInput.value = user ? user.username : username;
        usernameInput.disabled = true; // Login name is read-only when editing
        passwordInput.value = "";
        passwordInput.placeholder = "Оставьте пустым, если не меняется...";
        passwordInput.required = false;
        roleSelect.value = user ? user.role : "user";
    } else {
        title.textContent = "Создание пользователя";
        usernameInput.value = "";
        usernameInput.disabled = false;
        passwordInput.value = "";
        passwordInput.placeholder = "Введите пароль...";
        passwordInput.required = true;
        roleSelect.value = "user";
    }
    modal.classList.add("active");
}

function closeUserModal() {
    document.getElementById("modal-user-overlay").classList.remove("active");
    editingUserUsername = null;
}

async function saveUser() {
    const usernameInput = document.getElementById("u-username");
    const passwordInput = document.getElementById("u-password");
    const roleSelect = document.getElementById("u-role");
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const role = roleSelect.value;
    
    if (!username) {
        showToast("Заполните имя пользователя!", "error");
        return;
    }

    if (!editingUserUsername && !password) {
        showToast("Заполните пароль пользователя!", "error");
        return;
    }
    
    try {
        if (editingUserUsername) {
            // Editing existing user
            const response = await fetch(`/api/users/${encodeURIComponent(editingUserUsername)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password: password || undefined,
                    role: role
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                showToast(data.error || "Ошибка при обновлении пользователя!", "error");
                return;
            }

            await loadUsers();
            showToast(`Настройки пользователя "${editingUserUsername}" успешно сохранены`, "success");
        } else {
            // Creating new user
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password,
                    role
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                showToast(data.error || "Ошибка при создании пользователя!", "error");
                return;
            }

            await loadUsers();
            showToast(`Пользователь "${username}" успешно создан`, "success");
        }

        closeUserModal();
        renderUsersList();
    } catch (err) {
        console.error("Ошибка при сохранении пользователя:", err);
        showToast("Ошибка сети при сохранении пользователя", "error");
    }
}

async function deleteUser(username) {
    if (currentUser && username === currentUser.name) {
        showToast("Вы не можете удалить самого себя из системы!", "error");
        return;
    }
    
    if (confirm(`Вы действительно хотите удалить пользователя "${username}"?`)) {
        try {
            const response = await fetch(`/api/users/${encodeURIComponent(username)}`, {
                method: 'DELETE'
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                showToast(data.error || "Ошибка при удалении пользователя!", "error");
                return;
            }

            await loadUsers();
            renderUsersList();
            showToast(`Пользователь "${username}" удален`, "success");
        } catch (err) {
            console.error("Ошибка при удалении пользователя:", err);
            showToast("Ошибка сети при удалении пользователя", "error");
        }
    }
}

// --- Admin Section: Results Table ---
function renderResultsList() {
    const tableBody = document.getElementById("admin-results-table-body");
    tableBody.innerHTML = "";
    
    const searchVal = document.getElementById("search-results-input").value.trim().toLowerCase();
    const filtered = results.filter(r => 
        r.username.toLowerCase().includes(searchVal)
    );
    
    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">Результаты тестирования пока отсутствуют</td></tr>`;
        return;
    }
    
    const sorted = [...filtered].reverse();
    sorted.forEach(res => {
        const row = document.createElement("tr");
        const badgeClass = res.passed ? 'badge-green' : 'badge-orange';
        const resultLabel = res.passed ? 'Пройден' : 'Не сдан';
        
        row.innerHTML = `
            <td style="font-weight: 600;">${escapeHtml(res.username)}</td>
            <td>${escapeHtml(res.theme)}</td>
            <td style="font-size: 13px; color: var(--text-secondary);">${escapeHtml(res.date)}</td>
            <td><span style="font-weight: 600; color: ${res.passed ? 'var(--success)' : 'var(--accent-orange)'}">${res.percentage}%</span> (${res.earnedScore}/${res.maxScore} б.)</td>
            <td>${res.correctCount} из ${res.totalCount}</td>
            <td><span class="badge ${badgeClass}">${resultLabel}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function clearAllResults() {
    if (confirm("Вы действительно хотите полностью очистить историю тестирования?")) {
        fetch('/api/results', { method: 'DELETE' })
            .then(r => {
                if (!r.ok) throw new Error("delete failed");
                results = [];
                renderResultsList();
                showToast("История очищена", "success");
            })
            .catch(() => showToast("Не удалось очистить историю", "error"));
    }
}

// --- Toast Notification ---
function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let iconClass = "fa-circle-check";
    if (type === "error") iconClass = "fa-circle-exclamation";
    if (type === "warning") iconClass = "fa-triangle-exclamation";
    
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) reverse forwards";
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 4000);
}

// --- Excel Import/Export via SheetJS ---
function downloadExcelTemplate() {
    const headers = [
        "Тема", "Текст вопроса", "Баллы",
        "Вариант 1", "Верный 1",
        "Вариант 2", "Верный 2",
        "Вариант 3", "Верный 3",
        "Вариант 4", "Верный 4",
        "Вариант 5", "Верный 5"
    ];
    
    const sampleData = [
        {
            "Тема": "Связи документов",
            "Текст вопроса": "Какое ключевое правило связки трех документов (заявка, прием, продажа) в МИС?",
            "Баллы": 1,
            "Вариант 1": "В них должны полностью совпадать: пациент, врач, филиал, услуга и её количество",
            "Верный 1": "Да",
            "Вариант 2": "Достаточно совпадения только пациента и врача",
            "Верный 2": "",
            "Вариант 3": "Каждый документ может создаваться независимо",
            "Верный 3": "",
            "Вариант 4": "Связка не обязательна для начисления зарплаты",
            "Верный 4": ""
        },
        {
            "Тема": "Возвраты и касса",
            "Текст вопроса": "Какие способы оплаты поддерживает кассовый аппарат в МИС? (Выберите все верные)",
            "Баллы": 2,
            "Вариант 1": "Наличные",
            "Верный 1": "Да",
            "Вариант 2": "Банковская карта (терминал)",
            "Верный 2": "Да",
            "Вариант 3": "Оплата криптовалютой Bitcoin",
            "Верный 3": "",
            "Вариант 4": "Взаимозачет",
            "Верный 4": ""
        }
    ];
    
    try {
        const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Шаблон Вопросов");
        
        // Generate and download
        XLSX.writeFile(workbook, "Шаблон_Вопросов_МИС.xlsx");
        showToast("Шаблон Excel успешно скачан!", "success");
    } catch (err) {
        console.error(err);
        showToast("Не удалось сгенерировать шаблон!", "error");
    }
}

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            const rows = XLSX.utils.sheet_to_json(worksheet);
            
            if (rows.length === 0) {
                showToast("Файл Excel пуст или не распознан!", "error");
                return;
            }
            
            let importCount = 0;
            const newQuestions = [];
            
            rows.forEach((row, idx) => {
                const text = row["Текст вопроса"] || row["Вопрос"] || row["Question"] || row["text"];
                const theme = row["Раздел"] || row["Тема"] || row["Theme"] || row["theme"];
                const points = parseInt(row["Баллы"] || row["Балл"] || row["Points"] || row["points"] || 1);
                
                if (!text || !theme) {
                    console.warn(`Строка ${idx + 2} пропущена: отсутствует текст вопроса или тема.`);
                    return;
                }
                
                const options = [];
                for (let i = 1; i <= 10; i++) {
                    const optText = row[`Вариант ${i}`] || row[`Вариант${i}`] || row[`Option ${i}`] || row[`Option${i}`];
                    if (optText === undefined || optText === null) continue;
                    
                    const optCorrectVal = row[`Верный ${i}`] || row[`Верный${i}`] || row[`Correct ${i}`] || row[`Correct${i}`];
                    const isCorrect = (optCorrectVal !== undefined && optCorrectVal !== null && 
                                        (String(optCorrectVal).toLowerCase().trim() === 'да' || 
                                         String(optCorrectVal).toLowerCase().trim() === 'yes' || 
                                         String(optCorrectVal).toLowerCase().trim() === 'true' || 
                                         String(optCorrectVal).trim() === '1'));
                    
                    options.push({
                        text: String(optText).trim(),
                        correct: isCorrect
                    });
                }
                
                if (options.length < 2) {
                    console.warn(`Строка ${idx + 2} пропущена: количество вариантов ответов меньше 2.`);
                    return;
                }
                
                const correctCount = options.filter(o => o.correct).length;
                if (correctCount === 0) {
                    console.warn(`Строка ${idx + 2} пропущена: не указан ни один верный ответ.`);
                    return;
                }
                
                newQuestions.push({
                    id: "q_xls_" + Date.now() + "_" + Math.floor(Math.random() * 1000) + "_" + idx,
                    text: String(text).trim(),
                    theme: String(theme).trim(),
                    points: isNaN(points) || points <= 0 ? 1 : points,
                    options: options
                });
                importCount++;
            });
            
            if (newQuestions.length > 0) {
                questions = [...questions, ...newQuestions];
                saveQuestions();
                renderQuestionsList();
                showToast(`Успешно загружено вопросов: ${importCount}`, "success");
            } else {
                showToast("Не удалось импортировать вопросы. Проверьте формат строк!", "error");
            }
            
        } catch (error) {
            console.error(error);
            showToast("Ошибка при обработке Excel-файла!", "error");
        } finally {
            document.getElementById('excel-import-input').value = "";
        }
    };
    reader.readAsArrayBuffer(file);
}


// ============================================================
// --- VIDEO LIBRARY (IndexedDB + metadata in localStorage) ---
// ============================================================

function initVideoDB() {
    // Видео теперь хранятся на сервере, локальная база не нужна
}

function saveVideoMeta() {
    // Список видео хранится на сервере
}

// Called when admin selects a video file
function handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    event.target.value = '';

    if (!file.type.startsWith('video/')) {
        showToast('Выберите видеофайл (MP4, WebM, MOV)', 'error');
        return;
    }

    pendingVideoBlob = file;

    // Show preview
    const previewWrap = document.getElementById('video-add-preview-wrap');
    const previewEl = document.getElementById('video-add-preview');
    previewEl.src = URL.createObjectURL(file);
    previewWrap.style.display = 'block';

    // Pre-fill title from filename
    document.getElementById('v-title').value = file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
    document.getElementById('v-desc').value = '';

    document.getElementById('modal-video-add-overlay').classList.add('active');
}

function closeVideoAddModal() {
    document.getElementById('modal-video-add-overlay').classList.remove('active');
    const previewEl = document.getElementById('video-add-preview');
    previewEl.pause();
    const src = previewEl.src;
    previewEl.src = '';
    if (src && src.startsWith('blob:')) URL.revokeObjectURL(src);
    document.getElementById('video-add-preview-wrap').style.display = 'none';
    pendingVideoBlob = null;
}

async function saveVideoToLibrary() {
    const title = document.getElementById('v-title').value.trim();
    const desc = document.getElementById('v-desc').value.trim();
    const MAX_MB = 95;

    if (!title) { showToast('Укажите название видео!', 'error'); return; }
    if (!pendingVideoBlob) { showToast('Файл не выбран', 'error'); return; }
    if (pendingVideoBlob.size > MAX_MB * 1024 * 1024) {
        showToast(`Файл больше ${MAX_MB} МБ. Сожмите видео и загрузите снова`, 'error');
        return;
    }

    showToast('Идёт загрузка видео на сервер, подождите...', 'warning');
    try {
        const r1 = await fetch('/api/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, desc, fileName: pendingVideoBlob.name, size: pendingVideoBlob.size })
        });
        const d1 = await jsonOrNull(r1);
        if (!r1.ok || !d1 || !d1.video) throw new Error((d1 && d1.error) || 'Ошибка сохранения!');

        const r2 = await fetch(`/api/videos/${encodeURIComponent(d1.video.id)}/file`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: pendingVideoBlob
        });
        if (!r2.ok) {
            const d2 = await jsonOrNull(r2);
            throw new Error((d2 && d2.error) || 'Не удалось загрузить файл');
        }

        videoMeta.push(d1.video);
        closeVideoAddModal();
        renderVideoLibrary();
        showToast(`Видео «${title}» сохранено в библиотеку!`, 'success');
    } catch (err) {
        showToast(err.message || 'Ошибка сохранения!', 'error');
    }
}

async function deleteVideo(id) {
    if (!confirm('Удалить видео из библиотеки?')) return;
    try {
        const r = await fetch(`/api/videos/${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (!r.ok) throw new Error('delete failed');
        videoMeta = videoMeta.filter(v => v.id !== id);
        let changed = false;
        questions.forEach(q => { if (q.linkedVideoId === id) { q.linkedVideoId = null; changed = true; } });
        if (changed) saveQuestions();
        renderVideoLibrary();
        showToast('Видео удалено', 'success');
    } catch (err) {
        showToast('Не удалось удалить видео', 'error');
    }
}

function renderVideoLibrary() {
    const grid = document.getElementById('video-grid');
    const emptyState = document.getElementById('video-empty-state');
    grid.innerHTML = '';

    if (videoMeta.length === 0) {
        emptyState.style.display = 'block';
        grid.style.display = 'none';
        return;
    }
    emptyState.style.display = 'none';
    grid.style.display = 'grid';

    const isAdmin = currentUser && currentUser.role === 'admin';

    videoMeta.forEach(vm => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.innerHTML = `
            <div class="video-thumb" onclick="openVideoPlayer('${vm.id}')">
                <i class="fa-solid fa-circle-play video-play-icon"></i>
                <div class="video-thumb-overlay">Нажмите для просмотра</div>
            </div>
            <div class="video-card-body">
                <h4 class="video-card-title">${escapeHtml(vm.title)}</h4>
                <p class="video-card-desc">${escapeHtml(vm.desc) || '<span style="color:var(--text-muted)">Описание не заполнено</span>'}</p>
                <div class="video-card-footer">
                    <span style="font-size:11px; color:var(--text-muted);">
                        <i class="fa-solid fa-calendar-days"></i> ${vm.addedAt}
                        &nbsp;•&nbsp;
                        <i class="fa-solid fa-file-video"></i> ${(vm.size / 1024 / 1024).toFixed(1)} МБ
                    </span>
                    <div style="display:flex; gap:8px; align-items:center;">
                        <button class="btn btn-secondary" style="padding:6px 14px; font-size:12px;" onclick="openVideoPlayer('${vm.id}')">
                            <i class="fa-solid fa-play"></i> Смотреть
                        </button>
                        ${isAdmin ? `<button class="btn-icon btn-icon-danger" title="Удалить" onclick="deleteVideo('${vm.id}')">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>` : ''}
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openVideoPlayer(videoId) {
    const vm = videoMeta.find(v => v.id === videoId);
    if (!vm) { showToast('Видео не найдено', 'error'); return; }

    document.getElementById('video-player-title').innerHTML = `<i class="fa-solid fa-circle-play"></i> ${escapeHtml(vm.title)}`;
    document.getElementById('video-player-desc').textContent = vm.desc || '';
    const playerEl = document.getElementById('video-player-el');
    playerEl.src = `/api/videos/${encodeURIComponent(videoId)}/file`;
    document.getElementById('modal-video-player-overlay').classList.add('active');
}

function closeVideoPlayer(event) {
    // If called from overlay click, only close if user clicked the backdrop itself
    if (event && event.target !== document.getElementById('modal-video-player-overlay')) return;
    const playerEl = document.getElementById('video-player-el');
    playerEl.pause();
    const src = playerEl.src;
    playerEl.src = '';
    if (src && src.startsWith('blob:')) URL.revokeObjectURL(src);
    document.getElementById('modal-video-player-overlay').classList.remove('active');
}
