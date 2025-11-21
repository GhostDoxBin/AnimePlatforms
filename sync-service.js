// Автоматическая синхронизация данных между устройствами
class SyncService {
    constructor() {
        this.syncKey = 'anime_platform_sync';
        this.checkForSyncData();
        this.setupAutoSync();
    }

    // Проверка данных синхронизации из URL
    checkForSyncData() {
        const urlParams = new URLSearchParams(window.location.search);
        const syncData = urlParams.get('sync');
        
        if (syncData) {
            try {
                const decoded = decodeURIComponent(syncData);
                const data = JSON.parse(atob(decoded));
                this.importSyncData(data);
                // Убираем параметр из URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            } catch (error) {
                console.error('Ошибка синхронизации:', error);
            }
        }
    }

    // Импорт синхронизированных данных
    importSyncData(data) {
        if (!data.anime || !Array.isArray(data.anime)) return;

        // Импортируем в animeService
        if (window.animeService) {
            window.animeService.animeList = data.anime;
            window.animeService.saveAnimeList();
        }

        // Импортируем в animeData
        if (window.animeData) {
            window.animeData.animeList = data.anime;
            window.animeData.saveAnimeData();
        }

        // Импортируем в database
        if (window.database) {
            window.database.animeList = data.anime;
            if (window.database.saveAnime) {
                window.database.saveAnime();
            }
        }

        // Показываем уведомление
        if (window.Helpers && window.Helpers.showNotification) {
            window.Helpers.showNotification(`Синхронизировано ${data.anime.length} аниме!`, 'success');
        }

        // Перезагружаем страницу если это админ-панель
        if (window.location.pathname.includes('admin.html') && window.adminPanel) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else if (window.location.pathname.includes('catalog.html') && window.catalog) {
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    // Генерация ссылки для синхронизации
    generateSyncLink() {
        let animeList = [];
        
        if (window.animeService) {
            animeList = window.animeService.getAllAnime();
        } else if (window.animeData && window.animeData.animeList) {
            animeList = window.animeData.animeList;
        } else if (window.database && window.database.animeList) {
            animeList = window.database.animeList;
        }

        const syncData = {
            anime: animeList,
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        const encoded = btoa(JSON.stringify(syncData));
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?sync=${encodeURIComponent(encoded)}`;
    }

    // Генерация QR кода
    generateQRCode() {
        const syncLink = this.generateSyncLink();
        
        // Используем API для генерации QR кода
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(syncLink)}`;
        
        return {
            url: syncLink,
            qrUrl: qrUrl
        };
    }

    // Настройка автоматической синхронизации
    setupAutoSync() {
        // Автоматическая синхронизация при изменении данных
        if (window.animeService) {
            const originalSave = window.animeService.saveAnimeList.bind(window.animeService);
            window.animeService.saveAnimeList = () => {
                originalSave();
                this.updateSyncData();
            };
        }
    }

    // Обновление данных синхронизации
    updateSyncData() {
        let animeList = [];
        
        if (window.animeService) {
            animeList = window.animeService.getAllAnime();
        } else if (window.animeData && window.animeData.animeList) {
            animeList = window.animeData.animeList;
        }

        const syncData = {
            anime: animeList,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem(this.syncKey, JSON.stringify(syncData));
    }
}

// Создаем глобальный экземпляр
if (typeof window !== 'undefined') {
    window.syncService = new SyncService();
}

