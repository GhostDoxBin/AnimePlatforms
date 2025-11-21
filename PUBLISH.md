# Инструкция по публикации сайта на GitHub Pages

## Быстрая публикация

### Шаг 1: Создайте репозиторий на GitHub
1. Перейдите на https://github.com/new
2. Создайте новый репозиторий (например, `anime-platform`)
3. НЕ добавляйте README, .gitignore или лицензию (они уже есть)

### Шаг 2: Загрузите код
Выполните в терминале (в папке проекта):

```bash
git add .
git commit -m "Initial commit - Anime Platform"
git branch -M main
git remote add origin https://github.com/ВАШ_USERNAME/ВАШ_РЕПОЗИТОРИЙ.git
git push -u origin main
```

**Замените:**
- `ВАШ_USERNAME` на ваш GitHub username
- `ВАШ_РЕПОЗИТОРИЙ` на название репозитория

### Шаг 3: Включите GitHub Pages
1. Перейдите в Settings репозитория
2. Найдите раздел "Pages" в левом меню
3. В "Source" выберите:
   - Branch: `main`
   - Folder: `/ (root)`
4. Нажмите "Save"

### Шаг 4: Получите ссылку
Ваш сайт будет доступен по адресу:
```
https://ВАШ_USERNAME.github.io/ВАШ_РЕПОЗИТОРИЙ/
```

Обычно публикация занимает 1-2 минуты.

## Альтернатива: Netlify Drop
1. Перейдите на https://app.netlify.com/drop
2. Перетащите папку проекта
3. Получите мгновенную ссылку

## Альтернатива: Vercel
1. Установите Vercel CLI: `npm i -g vercel`
2. Выполните: `vercel`
3. Следуйте инструкциям

