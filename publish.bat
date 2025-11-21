@echo off
echo ========================================
echo Публикация Аниме-платформы на GitHub
echo ========================================
echo.

echo Шаг 1: Добавление файлов...
git add .
echo.

echo Шаг 2: Создание коммита...
git commit -m "Publish Anime Platform"
echo.

echo Шаг 3: Проверка удаленного репозитория...
git remote -v
echo.

echo ========================================
echo ВАЖНО: Перед продолжением:
echo 1. Создайте репозиторий на GitHub.com
echo 2. Замените URL в следующей команде:
echo    git remote add origin https://github.com/ВАШ_USERNAME/ВАШ_РЕПОЗИТОРИЙ.git
echo.
echo Затем выполните:
echo    git push -u origin main
echo.
echo После публикации включите GitHub Pages в настройках репозитория
echo ========================================
pause

