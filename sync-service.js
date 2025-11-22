// Автоматическая синхронизация данных между устройствами через файлы
class SyncService {
    constructor() {
        this.syncKey = 'anime_platform_sync';
        this.storageKey = 'anime_platform_data';
        this.lastSyncKey = 'anime_platform_last_sync';
        this.setupAutoSync();
        this.autoSaveInterval = null;
        this.fileHandle = null; // Для File System Access API
        this.startAutoSave();
        this.checkAndLoadData();
        this.setupStorageListener();
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

    // Проверка и автоматическая загрузка данных при старте
    checkAndLoadData() {
        try {
            const storedData = this.loadStoredData();
            if (!storedData) return;

            const localData = this.getAllData();
            const storedTimestamp = new Date(storedData.timestamp);
            const localTimestamp = localData.timestamp ? new Date(localData.timestamp) : new Date(0);

            // Если сохраненные данные новее - загружаем их
            if (storedTimestamp > localTimestamp) {
                console.log('Обнаружены новые данные для синхронизации, загружаю...');
                this.importData(storedData, true); // true = автоматический импорт
            }
        } catch (error) {
            console.error('Ошибка проверки данных:', error);
        }
    }

    // Автоматический импорт данных (без подтверждения)
    importData(data, silent = false) {
        if (!data.anime || !Array.isArray(data.anime)) {
            if (!silent) {
                throw new Error('Неверный формат данных: отсутствует список аниме');
            }
            return;
        }

        try {
            // Импортируем аниме
            if (window.animeService) {
                window.animeService.animeList = data.anime;
                if (window.animeService.saveAnimeList) {
                    window.animeService.saveAnimeList();
                }
            } else if (window.animeData) {
                window.animeData.animeList = data.anime;
                if (window.animeData.saveAnimeData) {
                    window.animeData.saveAnimeData();
                }
            }

            // Импортируем в database.js
            if (window.database) {
                window.database.animeList = data.anime;
                if (window.database.saveAnime) {
                    window.database.saveAnime();
                }
            }

            // Импортируем пользователей (объединяем, не заменяем)
            if (data.users && Array.isArray(data.users)) {
                const currentUsers = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
                const mergedUsers = this.mergeUsers(currentUsers, data.users);
                localStorage.setItem('animePlatformUsers', JSON.stringify(mergedUsers));
                
                // Обновляем текущего пользователя если нужно
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
                if (currentUser) {
                    const updatedUser = mergedUsers.find(u => u.id === currentUser.id);
                    if (updatedUser) {
                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                    }
                }
            }

            // Сохраняем метку последней синхронизации
            this.saveLastSync(data.timestamp);

            // Перезагружаем страницу только если это не автоматический импорт
            if (!silent) {
                if (window.location.pathname.includes('admin.html') && window.adminPanel) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else if (window.location.pathname.includes('catalog.html')) {
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            } else {
                // При автоматическом импорте обновляем интерфейс если нужно
                if (window.adminPanel && window.adminPanel.loadAnimeList) {
                    setTimeout(() => {
                        window.adminPanel.loadAnimeList();
                        window.adminPanel.updateStatistics();
                    }, 500);
                }
            }

            return {
                success: true,
                animeCount: data.anime.length,
                usersCount: (data.users || []).length
            };
        } catch (error) {
            console.error('Ошибка автоматического импорта:', error);
            return {
                success: false,
                error: error.message
            };
        }
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

                    const result = this.importData(importData, false);

                    if (result.success) {
                        // Сохраняем в localStorage для синхронизации
                        this.saveToStorage(this.getAllData());
                        resolve(result);
                    } else {
                        reject(new Error(result.error || 'Ошибка импорта'));
                    }
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

        // Обновляем или добавляем импортированных пользователей
        importedUsers.forEach(user => {
            const existingUser = userMap.get(user.id);
            if (existingUser) {
                // Объединяем данные, предпочитая более новые
                const existingTime = existingUser.lastModified || 0;
                const importedTime = user.lastModified || 0;
                if (importedTime > existingTime) {
                    userMap.set(user.id, { ...existingUser, ...user });
                }
            } else {
                userMap.set(user.id, user);
            }
        });

        return Array.from(userMap.values());
    }

    // Сохранение данных в localStorage для синхронизации
    saveToStorage(data) {
        try {
            const dataToSave = {
                ...data,
                lastModified: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
            localStorage.setItem(this.syncKey, JSON.stringify({
                lastSync: new Date().toISOString(),
                version: data.version || '2.0'
            }));
            
            // Триггерим событие для других вкладок
            this.triggerStorageEvent(this.storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.error('Ошибка сохранения в localStorage:', error);
            // Если localStorage переполнен, пытаемся очистить старые данные
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldData();
            }
        }
    }

    // Сохранение метки последней синхронизации
    saveLastSync(timestamp) {
        try {
            localStorage.setItem(this.lastSyncKey, timestamp);
        } catch (e) {
            console.error('Ошибка сохранения метки синхронизации:', e);
        }
    }

    // Очистка старых данных
    cleanupOldData() {
        try {
            // Удаляем самые старые данные, оставляя только последние
            const keys = Object.keys(localStorage);
            const syncKeys = keys.filter(k => k.startsWith('anime_platform_'));
            
            if (syncKeys.length > 10) {
                // Удаляем старые ключи синхронизации
                const oldKeys = syncKeys.slice(0, syncKeys.length - 10);
                oldKeys.forEach(key => {
                    if (key !== this.storageKey && key !== this.syncKey && key !== this.lastSyncKey) {
                        localStorage.removeItem(key);
                    }
                });
            }
        } catch (e) {
            console.error('Ошибка очистки данных:', e);
        }
    }

    // Триггер события storage для других вкладок
    triggerStorageEvent(key, value) {
        try {
            // Создаем кастомное событие для текущей вкладки
            const event = new CustomEvent('animePlatformSync', {
                detail: { key, value, timestamp: new Date().toISOString() }
            });
            window.dispatchEvent(event);
        } catch (e) {
            // Игнорируем ошибки
        }
    }

    // Настройка слушателя изменений localStorage
    setupStorageListener() {
        // Слушаем изменения в других вкладках
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey && e.newValue) {
                try {
                    const newData = JSON.parse(e.newValue);
                    const localData = this.getAllData();
                    
                    const newTimestamp = new Date(newData.timestamp || newData.lastModified || 0);
                    const localTimestamp = new Date(localData.timestamp || 0);
                    
                    // Если новые данные новее - синхронизируем
                    if (newTimestamp > localTimestamp) {
                        console.log('Обнаружены изменения в другой вкладке, синхронизирую...');
                        this.importData(newData, true);
                        
                        if (window.Helpers && window.Helpers.showNotification) {
                            window.Helpers.showNotification('Данные синхронизированы с другого устройства', 'success');
                        }
                    }
                } catch (error) {
                    console.error('Ошибка обработки изменений storage:', error);
                }
            }
        });

        // Слушаем кастомные события в текущей вкладке
        window.addEventListener('animePlatformSync', (e) => {
            if (e.detail && e.detail.key === this.storageKey) {
                // Данные были изменены в этой же вкладке
                // Можно добавить логику обновления UI
            }
        });
    }

    // Автоматическое сохранение данных
    startAutoSave() {
        // Сохраняем сразу при старте
        const data = this.getAllData();
        this.saveToStorage(data);

        // Сохраняем каждые 30 секунд
        this.autoSaveInterval = setInterval(() => {
            const data = this.getAllData();
            this.saveToStorage(data);
        }, 30000); // 30 секунд

        // Сохраняем при закрытии страницы
        window.addEventListener('beforeunload', () => {
            const data = this.getAllData();
            this.saveToStorage(data);
            
            // Пытаемся сохранить в файл через File System Access API
            this.autoSaveToFile();
        });

        // Сохраняем при потере фокуса окна
        window.addEventListener('blur', () => {
            const data = this.getAllData();
            this.saveToStorage(data);
        });

        // Сохраняем при видимости страницы
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // При возврате на страницу проверяем новые данные
                this.checkAndLoadData();
            } else {
                // При уходе со страницы сохраняем
                const data = this.getAllData();
                this.saveToStorage(data);
            }
        });
    }

    // Автоматическое сохранение в файл (через File System Access API)
    async autoSaveToFile() {
        // Проверяем поддержку File System Access API
        if (!('showSaveFilePicker' in window)) {
            return; // API не поддерживается
        }

        try {
            if (!this.fileHandle) {
                // Пытаемся получить существующий файл
                const handles = await window.showOpenFilePicker({
                    types: [{
                        description: 'JSON файлы',
                        accept: { 'application/json': ['.json'] }
                    }],
                    multiple: false
                });
                
                if (handles.length > 0) {
                    this.fileHandle = handles[0];
                } else {
                    return;
                }
            }

            // Сохраняем данные в файл
            const data = this.getAllData();
            const dataStr = JSON.stringify(data, null, 2);
            const writable = await this.fileHandle.createWritable();
            await writable.write(dataStr);
            await writable.close();
        } catch (error) {
            // Игнорируем ошибки (пользователь мог отменить выбор файла)
            console.log('Автосохранение в файл не выполнено:', error.message);
        }
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
            const self = this;
            window.animeService.saveAnimeList = function() {
                originalSave();
                setTimeout(() => {
                    const data = self.getAllData();
                    self.saveToStorage(data);
                }, 100);
            };
        }

        // Перехватываем изменения в database
        if (window.database && window.database.saveAnime) {
            const originalSave = window.database.saveAnime.bind(window.database);
            const self = this;
            window.database.saveAnime = function() {
                originalSave();
                setTimeout(() => {
                    const data = self.getAllData();
                    self.saveToStorage(data);
                }, 100);
            };
        }

        // Перехватываем изменения пользователей через MutationObserver
        this.observeStorageChanges();
    }

    // Наблюдение за изменениями в localStorage
    observeStorageChanges() {
        const self = this;
        
        // Создаем прокси для отслеживания изменений
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            
            if (key === 'animePlatformUsers' || key === 'currentUser' || 
                key === 'anime_platform_anime' || key === 'anime_platform_sync') {
                // Отложенное сохранение для избежания множественных вызовов
                if (self.saveTimeout) {
                    clearTimeout(self.saveTimeout);
                }
                self.saveTimeout = setTimeout(() => {
                    const data = self.getAllData();
                    self.saveToStorage(data);
                }, 500);
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

    // Синхронизация данных вручную (для кнопки)
    async syncNow() {
        try {
            // Загружаем данные из всех источников
            const data = this.getAllData();
            
            // Сохраняем в localStorage
            this.saveToStorage(data);
            
            // Проверяем наличие более новых данных
            this.checkAndLoadData();
            
            return {
                success: true,
                message: 'Данные синхронизированы'
            };
        } catch (error) {
            console.error('Ошибка синхронизации:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Создаем глобальный экземпляр
if (typeof window !== 'undefined') {
    window.syncService = new SyncService();
    
    // Автоматическая синхронизация при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (window.syncService) {
                    window.syncService.checkAndLoadData();
                }
            }, 2000); // Даем время для загрузки всех сервисов
        });
    } else {
        setTimeout(() => {
            if (window.syncService) {
                window.syncService.checkAndLoadData();
            }
        }, 2000);
    }
}