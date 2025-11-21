// services/auth-service.js - Единый сервис авторизации
class AuthService {
    constructor(config = {}) {
        // Безопасная загрузка конфигурации
        const defaultConfig = {
            keys: {
                currentUser: 'currentUser',
                loginTime: 'loginTime'
            }
        };
        this.config = config.storage || (window.Config?.storage || defaultConfig);
        this.sessionTimeout = config.sessionTimeout || (window.Config?.auth?.sessionTimeout || 24 * 60 * 60 * 1000);
        this.storage = this._getStorage();
    }

    /**
     * Получение объекта хранилища
     * @private
     */
    _getStorage() {
        if (typeof Storage === 'undefined') {
            // Fallback для старых браузеров
            return {
                _data: {},
                setItem: function(key, value) { this._data[key] = value; },
                getItem: function(key) { return this._data[key] || null; },
                removeItem: function(key) { delete this._data[key]; }
            };
        }
        return localStorage;
    }

    /**
     * Получение текущего пользователя
     * @returns {Object|null} Объект пользователя или null
     */
    getCurrentUser() {
        try {
            const userData = this.storage.getItem(this.config.keys?.currentUser || 'currentUser');
            const loginTime = this.storage.getItem(this.config.keys?.loginTime || 'loginTime');
            
            if (!userData) {
                return null;
            }

            // Проверка истечения сессии
            if (loginTime) {
                const timeDiff = new Date().getTime() - parseInt(loginTime);
                if (timeDiff > this.sessionTimeout) {
                    this.logout();
                    return null;
                }
            }

            return JSON.parse(userData);
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AuthService.getCurrentUser');
            }
            return null;
        }
    }

    /**
     * Установка текущего пользователя
     * @param {Object} user - Объект пользователя
     */
    setCurrentUser(user) {
        try {
            if (!user) {
                throw new Error('Пользователь не может быть null');
            }

            this.storage.setItem(
                this.config.keys?.currentUser || 'currentUser',
                JSON.stringify(user)
            );
            this.storage.setItem(
                this.config.keys?.loginTime || 'loginTime',
                new Date().getTime().toString()
            );
            this.storage.setItem('isLoggedIn', 'true');
            
            return true;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AuthService.setCurrentUser');
            }
            return false;
        }
    }

    /**
     * Выход из системы
     */
    logout() {
        try {
            this.storage.removeItem(this.config.keys?.currentUser || 'currentUser');
            this.storage.removeItem('isLoggedIn');
            this.storage.removeItem(this.config.keys?.loginTime || 'loginTime');
            
            // Перенаправление на главную страницу
            if (window.location.pathname.includes('admin.html') || 
                window.location.pathname.includes('profile.html')) {
                window.location.href = 'index.html';
            }
            
            return true;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AuthService.logout');
            }
            return false;
        }
    }

    /**
     * Проверка авторизации
     * @returns {boolean} true если пользователь авторизован
     */
    isAuthenticated() {
        return this.getCurrentUser() !== null;
    }

    /**
     * Проверка прав администратора
     * @param {number} minLevel - Минимальный уровень администратора
     * @returns {boolean} true если пользователь имеет достаточные права
     */
    isAdmin(minLevel = 1) {
        const user = this.getCurrentUser();
        return user && user.isAdmin && user.adminLevel >= minLevel;
    }

    /**
     * Обновление интерфейса авторизации
     * @param {HTMLElement} authButtonsContainer - Контейнер для кнопок авторизации
     * @param {HTMLElement} adminLink - Ссылка на админ-панель
     */
    updateAuthUI(authButtonsContainer, adminLink = null) {
        if (!authButtonsContainer) return;

        const currentUser = this.getCurrentUser();

        if (currentUser) {
            // Пользователь авторизован
            const avatarUrl = currentUser.avatar || 'https://i.pravatar.cc/150?img=1';
            authButtonsContainer.innerHTML = `
                <a href="profile.html" class="btn btn-profile">
                    <img src="${avatarUrl}" alt="Аватар" class="profile-avatar" onerror="this.src='https://i.pravatar.cc/150?img=1'">
                    <span class="profile-username">${currentUser.username || currentUser.displayName || 'Профиль'}</span>
                </a>
                <a href="#" class="btn btn-login" id="logout-btn">Выйти</a>
            `;

            // Обработчик выхода
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
            }

            // Показ ссылки на админ-панель
            if (adminLink && this.isAdmin(1)) {
                adminLink.style.display = 'block';
                adminLink.innerHTML = `<a href="admin.html" class="admin-god">Админ</a>`;
            }
        } else {
            // Пользователь не авторизован
            authButtonsContainer.innerHTML = `
                <a href="login.html" class="btn btn-login">Войти</a>
                <a href="signup.html" class="btn btn-signup">Регистрация</a>
            `;

            // Скрытие ссылки на админ-панель
            if (adminLink) {
                adminLink.style.display = 'none';
            }
        }
    }

    /**
     * Требование авторизации (редирект на страницу входа)
     * @param {string} redirectUrl - URL для редиректа после входа
     * @returns {boolean} true если пользователь авторизован
     */
    requireAuth(redirectUrl = 'login.html') {
        if (!this.isAuthenticated()) {
            window.location.href = redirectUrl;
            return false;
        }
        return true;
    }

    /**
     * Обновление времени сессии
     */
    refreshSession() {
        const user = this.getCurrentUser();
        if (user) {
            this.storage.setItem(
                this.config.keys?.loginTime || 'loginTime',
                new Date().getTime().toString()
            );
        }
    }

    /**
     * Настройка автообновления сессии
     */
    setupSessionAutoRefresh() {
        // Обновление при активности пользователя
        const refreshSession = () => {
            this.refreshSession();
        };

        document.addEventListener('click', refreshSession);
        document.addEventListener('keypress', refreshSession);
        document.addEventListener('scroll', refreshSession);

        // Автоматическое обновление каждые 10 минут
        const interval = window.Config?.security?.sessionRefreshInterval || 10 * 60 * 1000;
        setInterval(refreshSession, interval);
    }
}

// Создаем глобальный экземпляр
const authService = new AuthService();

// Экспорт для обратной совместимости
if (typeof window !== 'undefined') {
    window.authService = authService;
    
    // Глобальные функции для обратной совместимости
    window.getCurrentUser = () => authService.getCurrentUser();
    window.setCurrentUser = (user) => authService.setCurrentUser(user);
    window.logout = () => authService.logout();
    window.requireAuth = () => authService.requireAuth();
    window.checkAuth = () => {
        const authButtons = document.querySelector('.auth-buttons');
        const adminLink = document.getElementById('admin-link');
        authService.updateAuthUI(authButtons, adminLink);
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthService;
}

