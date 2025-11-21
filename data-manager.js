// data-manager.js - Менеджер данных с эмуляцией файлов TXT
class DataManager {
    constructor() {
        this.files = {
            'users.txt': 'users_data',
            'anime.txt': 'anime_data', 
            'logs.txt': 'system_logs',
            'settings.txt': 'app_settings'
        };
        this.init();
    }

    init() {
        this.ensureFilesExist();
        this.setupAutoSave();
    }

    // Создание файлов если их нет
    ensureFilesExist() {
        Object.values(this.files).forEach(fileKey => {
            if (!localStorage.getItem(fileKey)) {
                localStorage.setItem(fileKey, '');
            }
        });
    }

    // Запись в файл
    writeToFile(filename, data) {
        const fileKey = this.files[filename];
        if (!fileKey) {
            console.error(`File ${filename} not found`);
            return false;
        }

        try {
            const timestamp = new Date().toISOString();
            let fileContent = localStorage.getItem(fileKey) || '';
            
            if (filename === 'logs.txt') {
                // Для логов добавляем новую запись
                fileContent += `[${timestamp}] ${data}\n`;
                
                // Ограничиваем размер логов (последние 1000 строк)
                const lines = fileContent.split('\n').filter(line => line.trim());
                if (lines.length > 1000) {
                    fileContent = lines.slice(-1000).join('\n') + '\n';
                }
            } else {
                // Для других файлов перезаписываем содержимое
                fileContent = `${timestamp}\n${JSON.stringify(data, null, 2)}`;
            }
            
            localStorage.setItem(fileKey, fileContent);
            return true;
        } catch (error) {
            console.error(`Error writing to ${filename}:`, error);
            return false;
        }
    }

    // Чтение из файла
    readFromFile(filename) {
        const fileKey = this.files[filename];
        if (!fileKey) {
            console.error(`File ${filename} not found`);
            return null;
        }

        try {
            return localStorage.getItem(fileKey) || '';
        } catch (error) {
            console.error(`Error reading from ${filename}:`, error);
            return null;
        }
    }

    // Экспорт файла как скачивание
    exportFile(filename) {
        const content = this.readFromFile(filename);
        if (!content) return false;

        try {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error(`Error exporting ${filename}:`, error);
            return false;
        }
    }

    // Импорт файла
    importFile(filename, content) {
        const fileKey = this.files[filename];
        if (!fileKey) return false;

        try {
            localStorage.setItem(fileKey, content);
            return true;
        } catch (error) {
            console.error(`Error importing ${filename}:`, error);
            return false;
        }
    }

    // Очистка файла
    clearFile(filename) {
        const fileKey = this.files[filename];
        if (!fileKey) return false;

        try {
            localStorage.setItem(fileKey, '');
            return true;
        } catch (error) {
            console.error(`Error clearing ${filename}:`, error);
            return false;
        }
    }

    // Автосохранение каждые 30 секунд
    setupAutoSave() {
        setInterval(() => {
            this.autoSave();
        }, 30000);

        // Сохранение при закрытии страницы
        window.addEventListener('beforeunload', () => {
            this.autoSave();
        });
    }

    autoSave() {
        if (window.database) {
            this.saveUsers();
            this.saveAnime();
            this.writeToFile('logs.txt', 'AUTO_SAVE: Автоматическое сохранение данных');
        }
    }

    // Сохранение пользователей
    saveUsers() {
        if (!window.database) return;
        
        const usersData = {
            timestamp: new Date().toISOString(),
            users: window.database.users.filter(user => !user.protected),
            totalUsers: window.database.users.length,
            adminUsers: window.database.users.filter(user => user.role === 'admin').length
        };

        this.writeToFile('users.txt', JSON.stringify(usersData, null, 2));
    }

    // Сохранение аниме
    saveAnime() {
        if (!window.database) return;
        
        const animeData = {
            timestamp: new Date().toISOString(),
            anime: window.database.animeList,
            totalAnime: window.database.animeList.length,
            genres: [...new Set(window.database.animeList.map(a => a.genre))],
            studios: [...new Set(window.database.animeList.map(a => a.studio).filter(s => s))]
        };

        this.writeToFile('anime.txt', JSON.stringify(animeData, null, 2));
    }

    // Сохранение настроек
    saveSettings(settings) {
        const settingsData = {
            timestamp: new Date().toISOString(),
            ...settings
        };

        this.writeToFile('settings.txt', JSON.stringify(settingsData, null, 2));
    }

    // Добавление лога
    addLog(message, type = 'INFO') {
        const logMessage = `${type}: ${message}`;
        this.writeToFile('logs.txt', logMessage);
    }

    // Получение статистики файлов
    getFileStats() {
        const stats = {};
        
        Object.keys(this.files).forEach(filename => {
            const content = this.readFromFile(filename);
            const lines = content ? content.split('\n').filter(line => line.trim()) : [];
            
            stats[filename] = {
                size: content ? content.length : 0,
                lines: lines.length,
                lastModified: this.getLastModified(filename)
            };
        });
        
        return stats;
    }

    getLastModified(filename) {
        const fileKey = this.files[filename];
        if (!fileKey) return 'Unknown';
        
        const content = localStorage.getItem(fileKey);
        if (!content) return 'Never';
        
        // Пытаемся найти timestamp в содержимом
        const firstLine = content.split('\n')[0];
        if (firstLine && !firstLine.includes('[')) {
            return firstLine;
        }
        
        return 'Recently';
    }
}

// Создаем глобальный экземпляр менеджера данных
window.dataManager = new DataManager();