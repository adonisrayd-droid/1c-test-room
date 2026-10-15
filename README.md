# 1ctestusers

Сайт для тестирования сотрудников с видеотекой. Node.js, Express, SQLite.

## Локальный запуск

```bash
npm install
cp .env.example .env     # заполните SESSION_SECRET и ADMIN_PASSWORD
npm start
```

Откройте http://localhost:3000. Вход: пользователь `admin`, пароль из `ADMIN_PASSWORD`.

## Возможности

- **Тестируемые:** прохождение тестов, раздел «Мои результаты», разбор ответов по каждому тесту (верные и неверные ответы, видео по ошибкам), «Инструкция МИС», видеотека.
- **Администратор:** база вопросов, пользователи, все результаты с разбором, видеотека.
- **Редактирование инструкции (администратор):** раздел «Инструкция МИС» — добавление, изменение, удаление и перестановка разделов, в том числе «Визуальной схемы связи документов». В разделе можно использовать текст и картинки (PNG, JPG, GIF, WebP до 5 МБ). Жирный текст: `**текст**`.

## Переменные окружения (.env)

См. файл `.env.example`. Обязательные: `SESSION_SECRET` (не короче 16 символов), `ADMIN_PASSWORD`.

## Установка на Ubuntu VPS (nginx + systemd)

Нужен Node.js 20.17 или новее (рекомендуется 22 LTS).

```bash
sudo apt update && sudo apt install -y nginx git
sudo git clone https://github.com/ВАШ_ЛОГИН/1ctestusers.git /var/www/mysite
cd /var/www/mysite
sudo npm install --omit=dev

# Данные (база и видео) хранятся отдельно от кода
sudo mkdir -p /var/lib/mysite
sudo chown -R www-data:www-data /var/lib/mysite

# Настройки
sudo cp .env.example .env
sudo nano .env            # SESSION_SECRET, ADMIN_PASSWORD, DATA_DIR=/var/lib/mysite
sudo chown root:www-data .env && sudo chmod 640 .env

# Автозапуск
sudo cp deploy/mysite.service /etc/systemd/system/mysite.service
sudo systemctl daemon-reload
sudo systemctl enable --now mysite
sudo systemctl status mysite

# nginx
sudo cp deploy/nginx-mysite.conf /etc/nginx/sites-available/mysite
sudo nano /etc/nginx/sites-available/mysite     # впишите свой домен
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# HTTPS
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

## Обновление

```bash
cd /var/www/mysite
sudo git pull
sudo npm install --omit=dev
sudo systemctl restart mysite
```

## Резервная копия

Сохраняйте папку `DATA_DIR`: файл `database.db`, папки `videos/` и `manual-images/` (картинки инструкции).
Пример копии базы без остановки сайта:

```bash
sudo sqlite3 /var/lib/mysite/database.db ".backup '/root/backup-$(date +%F).db'"
```
