// config.js - Централизованная конфигурация приложения
const Config = {
    // Настройки API
    api: {
        baseUrl: '/api',
        timeout: 5000
    },
    
    // Настройки хранилища
    storage: {
        type: 'localStorage', // 'localStorage' | 'indexedDB' | 'api'
        prefix: 'anime_platform_',
        keys: {
            users: 'anime_platform_users',
            anime: 'anime_platform_anime',
            currentUser: 'currentUser',
            favorites: 'animeFavorites',
            settings: 'anime_platform_settings',
            loginTime: 'loginTime'
        }
    },
    
    // Настройки авторизации
    auth: {
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 часа в миллисекундах
        tokenKey: 'auth_token',
        userKey: 'currentUser'
    },
    
    // Настройки функций
    features: {
        ratings: true,
        comments: true,
        favorites: true,
        adminPanel: true,
        userRegistration: true,
        darkMode: true
    },
    
    // Лимиты
    limits: {
        maxFileSize: 10, // MB
        maxUsers: 1000,
        maxAnime: 5000,
        watchHistoryLimit: 50,
        favoritesLimit: 100
    },
    
    // Настройки безопасности
    security: {
        passwordMinLength: 6,
        requireStrongPassword: false,
        sessionRefreshInterval: 10 * 60 * 1000 // 10 минут
    },
    
    // Режим разработки
    debug: {
        enabled: false, // Установить в true для отладки
        logLevel: 'error' // 'debug' | 'info' | 'warn' | 'error'
    }
};

// Экспорт для использования в других файлах
if (typeof window !== 'undefined') {
    window.Config = Config;
}

// Для Node.js окружения
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Config;
}





