// Автоматическая синхронизация данных между устройствами через файлы
class SyncService {
    constructor() {
        this.syncKey = 'anime_platform_sync';
        this.storageKey = 'anime_platform_data';
        this.setupAutoSync();
        this.autoSaveInterval = null;
        this.startAutoSave();
    }

    // Получить все данные для синхронизации
    getAllData() {
        let animeList = [];
        let users = [];
        
        // Получаем аниме
        if (window.animeService) {
            animeList = window.animeService.getAllAnime();
        } else if (window.animeData && window.animeData.animeList) {
            animeList = window.animeData.animeList;
        } else if (window.database && window.database.animeList) {
            animeList = window.database.animeList;
        }

        // Получаем пользователей
        try {
            users = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
        } catch (e) {
            console.error('Ошибка чтения пользователей:', e);
        }

        return {
            anime: animeList,
            users: users,
            timestamp: new Date().toISOString(),
            version: '2.0'
        };
    }

    // Экспорт данных в файл
    exportToFile() {
        try {
            const data = this.getAllData();
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `anime-platform-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            // Сохраняем в localStorage для автоматической синхронизации
            this.saveToStorage(data);

            return {
                success: true,
                message: `Экспортировано ${data.anime.length} аниме и ${data.users.length} пользователей`
            };
        } catch (error) {
            console.error('Ошибка экспорта данных:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Импорт данных из файла
    importFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error('Файл не выбран'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);
                    
                    if (!importData.anime || !Array.isArray(importData.anime)) {
                        throw new Error('Неверный формат файла: отсутствует список аниме');
                    }

                    // Импортируем аниме
                    if (window.animeService) {
                        window.animeService.animeList = importData.anime;
                        if (window.animeService.saveAnimeList) {
                            window.animeService.saveAnimeList();
                        }
                    } else if (window.animeData) {
                        window.animeData.animeList = importData.anime;
                        if (window.animeData.saveAnimeData) {
                            window.animeData.saveAnimeData();
                        }
                    }

                    // Импортируем в database.js
                    if (window.database) {
                        window.database.animeList = importData.anime;
                        if (window.database.saveAnime) {
                            window.database.saveAnime();
                        }
                    }

                    // Импортируем пользователей (опционально)
                    if (importData.users && Array.isArray(importData.users)) {
                        const currentUsers = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
                        const mergedUsers = this.mergeUsers(currentUsers, importData.users);
                        localStorage.setItem('animePlatformUsers', JSON.stringify(mergedUsers));
                    }

                    // Сохраняем в localStorage для синхронизации
                    this.saveToStorage(this.getAllData());

                    resolve({
                        success: true,
                        animeCount: importData.anime.length,
                        usersCount: (importData.users || []).length
                    });
                } catch (error) {
                    console.error('Ошибка импорта данных:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('Ошибка чтения файла'));
            };

            reader.readAsText(file);
        });
    }

    // Объединение пользователей при импорте
    mergeUsers(currentUsers, importedUsers) {
        const userMap = new Map();
        
        // Добавляем текущих пользователей
        currentUsers.forEach(user => {
            userMap.set(user.id, user);
        });

        // Добавляем или обновляем импортированных пользователей
        importedUsers.forEach(user => {
            if (!userMap.has(user.id)) {
                userMap.set(user.id, user);
            }
        });

        return Array.from(userMap.values());
    }

    // Сохранение данных в localStorage для синхронизации
    saveToStorage(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            localStorage.setItem(this.syncKey, JSON.stringify({
                lastSync: new Date().toISOString(),
                version: data.version || '2.0'
            }));
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
        }
    }

    // Автоматическое сохранение данных
    startAutoSave() {
        // Сохраняем каждые 30 секунд или при изменениях
        this.autoSaveInterval = setInterval(() => {
            const data = this.getAllData();
            this.saveToStorage(data);
        }, 30000); // 30 секунд

        // Сохраняем при закрытии страницы
        window.addEventListener('beforeunload', () => {
            const data = this.getAllData();
            this.saveToStorage(data);
        });
    }

    // Остановка автоматического сохранения
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
    }

    // Настройка автоматической синхронизации при изменениях
    setupAutoSync() {
        // Перехватываем сохранение аниме
        if (window.animeService && window.animeService.saveAnimeList) {
            const originalSave = window.animeService.saveAnimeList.bind(window.animeService);
            window.animeService.saveAnimeList = () => {
                originalSave();
                const data = this.getAllData();
                this.saveToStorage(data);
            };
        }

        // Перехватываем изменения в database
        if (window.database && window.database.saveAnime) {
            const originalSave = window.database.saveAnime.bind(window.database);
            window.database.saveAnime = () => {
                originalSave();
                const data = this.getAllData();
                this.saveToStorage(data);
            };
        }

        // Перехватываем изменения пользователей
        const originalSetItem = Storage.prototype.setItem;
        const self = this;
        Storage.prototype.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            if (key === 'animePlatformUsers' || key === 'currentUser') {
                const data = self.getAllData();
                self.saveToStorage(data);
            }
        };
    }

    // Получить последнюю дату синхронизации
    getLastSyncDate() {
        try {
            const syncInfo = JSON.parse(localStorage.getItem(this.syncKey) || '{}');
            return syncInfo.lastSync || null;
        } catch (e) {
            return null;
        }
    }

    // Проверка наличия сохраненных данных
    hasStoredData() {
        return localStorage.getItem(this.storageKey) !== null;
    }

    // Загрузка сохраненных данных из localStorage
    loadStoredData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error('Ошибка загрузки сохраненных данных:', e);
        }
        return null;
    }
}

// Создаем глобальный экземпляр
if (typeof window !== 'undefined') {
    window.syncService = new SyncService();
}