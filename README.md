# FOTUR VPN Landing

Готовый статический сайт под GitHub Pages.

## Страницы
- `index.html` — главная
- `features.html` — возможности
- `tariffs.html` — тарифы + форма заявки
- `download.html` — скачать
- `dashboard.html` — личный кабинет

## Как деплоить с телефона
1. Создай репозиторий на GitHub.
2. Нажми Add file → Upload files.
3. Загрузи все файлы из архива.
4. Settings → Pages → Deploy from branch → main → /root.

## API
Форма находится в `tariffs.html`, логика в `script.js`.
Замени `https://api.example.com/subscriptions/create` на реальный endpoint.
На сервере нужно разрешить CORS для домена GitHub Pages или твоего домена.
