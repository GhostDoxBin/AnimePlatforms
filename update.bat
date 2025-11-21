@echo off
chcp 65001 >nul
echo ========================================
echo Обновление сайта на GitHub Pages
echo ========================================
echo.

echo Шаг 1: Проверка статуса...
git status
echo.

echo Шаг 2: Добавление всех изменений...
git add .
echo.

echo Шаг 3: Введите описание изменений:
set /p commit_message="Описание: "

if "%commit_message%"=="" (
    set commit_message=Обновление сайта
)

echo.
echo Создание коммита: %commit_message%
git commit -m "%commit_message%"
echo.

echo Шаг 4: Отправка на GitHub...
git push origin main
echo.

echo ========================================
echo ✅ Готово! Сайт обновится через 1-2 минуты
echo ========================================
echo.
echo Ваш сайт: https://ghostdoxbin.github.io/AnimePlatforms/
echo.
pause

