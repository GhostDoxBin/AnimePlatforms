# Аниме-платформа

Веб-приложение для просмотра и управления аниме контентом.

## Технологии

- HTML, CSS, JavaScript
- LocalStorage для хранения данных
- Модульная архитектура

## Функционал

- Каталог аниме
- Плеер для просмотра
- Система авторизации
- Админ-панель
- Рейтинги и избранное

## Установка и запуск

1. Клонируйте репозиторий
2. Откройте `index.html` в браузере
3. Или используйте локальный сервер (например, Live Server в VS Code)

## Публикация на GitHub Pages

1. Создайте репозиторий на GitHub
2. Загрузите файлы:
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/ВАШ_USERNAME/ВАШ_РЕПОЗИТОРИЙ.git
   git push -u origin main
   ```
3. В настройках репозитория включите GitHub Pages
4. Выберите ветку `main` и папку `/ (root)`
5. Сайт будет доступен по адресу: `https://ВАШ_USERNAME.github.io/ВАШ_РЕПОЗИТОРИЙ/`

## Структура проекта

- `index.html` - Главная страница
- `catalog.html` - Каталог аниме
- `player.html` - Плеер
- `admin.html` - Админ-панель
- `login.html` / `signup.html` - Авторизация
- `services/` - Сервисы (auth, anime)
- `components/` - Компоненты
- `utils/` - Утилиты

## Лицензия

MIT

