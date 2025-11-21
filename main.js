// Main page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация с использованием новых сервисов
    initializeMain();
});

function initializeMain() {
    try {
        // Проверяем авторизацию на всех страницах
        if (window.authService) {
            const authButtons = document.querySelector('.auth-buttons');
            const adminLink = document.getElementById('admin-link');
            window.authService.updateAuthUI(authButtons, adminLink);
            
            // Настройка авто-обновления сессии
            window.authService.setupSessionAutoRefresh();
        } else {
            // Fallback на старые функции для обратной совместимости
            if (typeof checkAuth === 'function') {
                checkAuth();
            }
            setupSessionAutoRefresh();
        }
        
        // Загружаем популярные аниме только на главной
        if (document.getElementById('popular-anime')) {
            loadPopularAnime();
        }
        
        // Настройка навигации
        if (window.Helpers) {
            window.Helpers.setupNavigation();
        } else {
            setupNavigation();
        }
    } catch (error) {
        if (window.errorHandler) {
            window.errorHandler.handle(error, 'main.js.initializeMain');
        } else {
            console.error('Error initializing main:', error);
        }
    }
}

// Fallback функция для обратной совместимости
function setupSessionAutoRefresh() {
    if (window.authService) {
        window.authService.setupSessionAutoRefresh();
        return;
    }
    
    // Старая реализация (fallback)
    const refreshSession = () => {
        const user = getCurrentUser ? getCurrentUser() : null;
        if (user) {
            localStorage.setItem('loginTime', new Date().getTime().toString());
        }
    };
    
    document.addEventListener('click', refreshSession);
    document.addEventListener('keypress', refreshSession);
    document.addEventListener('scroll', refreshSession);
    
    const interval = window.Config?.security?.sessionRefreshInterval || 10 * 60 * 1000;
    setInterval(refreshSession, interval);
}

// Fallback функция для обратной совместимости
function setupNavigation() {
    if (window.Helpers) {
        window.Helpers.setupNavigation();
        return;
    }
    
    // Старая реализация (fallback)
    const navLinks = document.querySelectorAll('nav a');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function loadPopularAnime() {
    const popularGrid = document.getElementById('popular-anime');
    if (!popularGrid) return;

    // Используем animeService если доступен, иначе fallback на animeData
    const getPopularAnime = () => {
        if (window.animeService) {
            return window.animeService.getPopularAnime(6);
        } else if (window.animeData && window.animeData.animeList) {
            const list = Array.isArray(window.animeData.animeList) ? window.animeData.animeList : [];
            return list.slice(0, 6);
        }
        return [];
    };

    // Ждем загрузки данных аниме (максимум 10 попыток)
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryLoad = () => {
        attempts++;
        const popularAnime = getPopularAnime();
        
        if (popularAnime.length > 0) {
            popularGrid.innerHTML = '';
            popularAnime.forEach(anime => {
                const card = createAnimeCard(anime);
                popularGrid.appendChild(card);
            });
        } else if (attempts < maxAttempts) {
            setTimeout(tryLoad, 100);
        } else {
            // Показываем пустое состояние
            popularGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-secondary);">
                    <div style="font-size: 64px; margin-bottom: 20px;">🎌</div>
                    <h3 style="font-size: 24px; margin-bottom: 15px; color: var(--text-primary);">Каталог пуст</h3>
                    <p style="font-size: 16px; margin-bottom: 30px; max-width: 500px; margin-left: auto; margin-right: auto;">
                        Администратор еще не добавил аниме в каталог. 
                        Пожалуйста, войдите в админ-панель для добавления контента.
                    </p>
                </div>
            `;
        }
    };
    
    tryLoad();
}

/**
 * Создание карточки аниме
 * @param {Object} anime - Объект аниме
 * @returns {HTMLElement} Элемент карточки
 */
function createAnimeCard(anime) {
    const card = document.createElement('div');
    card.className = 'anime-card';
    card.setAttribute('data-anime-id', anime.id);
    
    // Используем Helpers если доступен
    const generateStars = window.Helpers?.generateStars || generateStarsFallback;
    const truncateText = window.Helpers?.truncateText || ((text, len) => text.substring(0, len) + '...');
    
    card.innerHTML = `
        <div class="anime-image">
            <img src="${anime.poster || ''}" alt="${anime.title || ''}">
        </div>
        <div class="anime-info">
            <h3 class="anime-title">${anime.title || ''}</h3>
            <div class="anime-rating">
                <div class="rating-stars">${generateStars(anime.rating || 0)}</div>
                <div class="rating-value">${anime.rating || 0}/10</div>
            </div>
            <p class="anime-description">${truncateText(anime.description || '', 100)}</p>
            <button class="btn btn-watch" data-anime-id="${anime.id}">Смотреть сейчас</button>
        </div>
    `;

    // Обработка ошибок изображения
    const img = card.querySelector('img');
    if (img && window.Helpers) {
        window.Helpers.handleImageError(img);
    } else if (img) {
        img.onerror = function() {
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100%; color: #8a99b3; background: #2a3a52; border-radius: 8px;';
            placeholder.textContent = 'Нет изображения';
            if (this.parentElement) {
                this.parentElement.appendChild(placeholder);
            }
        };
    }

    // Обработка клика по карточке (открытие модального окна)
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-watch')) {
            if (window.animeModal && typeof window.animeModal.open === 'function') {
                window.animeModal.open(anime);
            }
        }
    });

    // Обработка кнопки "Смотреть сейчас"
    const watchBtn = card.querySelector('.btn-watch');
    if (watchBtn) {
        watchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Сохраняем аниме в localStorage
            localStorage.setItem('currentAnime', JSON.stringify(anime));
            localStorage.setItem('currentEpisode', '1');
            
            // Переходим на страницу плеера
            window.location.href = `player.html?anime=${anime.id}&episode=1`;
        });
    }

    return card;
}

// Fallback функция для генерации звезд
function generateStarsFallback(rating) {
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
}

// ============================================================================
// ОБРАТНАЯ СОВМЕСТИМОСТЬ - Глобальные функции
// Эти функции используют новые сервисы, но сохраняют старый API
// ============================================================================

// Универсальная функция для работы с хранилищем (fallback)
function getStorage() {
    if (typeof(Storage) !== "undefined") {
        return localStorage;
    } else {
        if (!window.fallbackStorage) {
            window.fallbackStorage = {};
        }
        return {
            setItem: function(key, value) {
                window.fallbackStorage[key] = value;
            },
            getItem: function(key) {
                return window.fallbackStorage[key] || null;
            },
            removeItem: function(key) {
                delete window.fallbackStorage[key];
            }
        };
    }
}

// Получить текущего пользователя (использует authService если доступен)
function getCurrentUser() {
    if (window.authService) {
        return window.authService.getCurrentUser();
    }
    
    // Fallback реализация
    const userData = getStorage().getItem('currentUser');
    const loginTime = getStorage().getItem('loginTime');
    
    if (!userData) return null;
    
    // Проверяем, не истекла ли сессия (24 часа)
    const sessionTimeout = window.Config?.auth?.sessionTimeout || 24 * 60 * 60 * 1000;
    if (loginTime && (new Date().getTime() - parseInt(loginTime)) > sessionTimeout) {
        logout();
        return null;
    }
    
    try {
        return JSON.parse(userData);
    } catch (error) {
        if (window.errorHandler) {
            window.errorHandler.handle(error, 'getCurrentUser');
        }
        return null;
    }
}

// Проверка авторизации и обновление интерфейса (использует authService если доступен)
function checkAuth() {
    if (window.authService) {
        const authButtons = document.querySelector('.auth-buttons');
        const adminLink = document.getElementById('admin-link');
        window.authService.updateAuthUI(authButtons, adminLink);
        return window.authService.isAuthenticated();
    }
    
    // Fallback реализация
    const currentUser = getCurrentUser();
    const authButtons = document.querySelector('.auth-buttons');
    const adminLink = document.getElementById('admin-link');
    
    if (currentUser && authButtons) {
        const avatarUrl = currentUser.avatar || 'https://i.pravatar.cc/150?img=1';
        authButtons.innerHTML = `
            <a href="profile.html" class="btn btn-profile">
                <img src="${avatarUrl}" alt="Аватар" class="profile-avatar" onerror="this.src='https://i.pravatar.cc/150?img=1'">
                <span class="profile-username">${currentUser.username || currentUser.displayName || 'Профиль'}</span>
            </a>
            <a href="#" class="btn btn-login" id="logout-btn">Выйти</a>
        `;
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }

        if (adminLink && currentUser.isAdmin && currentUser.adminLevel >= 1) {
            adminLink.style.display = 'block';
            adminLink.innerHTML = `<a href="admin.html" class="admin-god">Админ</a>`;
        }
        
        return true;
    } else if (authButtons) {
        authButtons.innerHTML = `
            <a href="login.html" class="btn btn-login">Войти</a>
            <a href="signup.html" class="btn btn-signup">Регистрация</a>
        `;
        
        if (adminLink) {
            adminLink.style.display = 'none';
        }
        
        return false;
    }
    return false;
}

// Выход из системы (использует authService если доступен)
function logout() {
    if (window.authService) {
        return window.authService.logout();
    }
    
    // Fallback реализация
    getStorage().removeItem('currentUser');
    getStorage().removeItem('isLoggedIn');
    getStorage().removeItem('loginTime');
    window.location.href = 'index.html';
}

// Установка текущего пользователя (использует authService если доступен)
function setCurrentUser(user) {
    if (window.authService) {
        return window.authService.setCurrentUser(user);
    }
    
    // Fallback реализация
    const storage = getStorage();
    if (storage && user) {
        storage.setItem('currentUser', JSON.stringify(user));
        storage.setItem('isLoggedIn', 'true');
        storage.setItem('loginTime', new Date().getTime().toString());
    }
}

// Проверка доступа к странице (использует authService если доступен)
function requireAuth() {
    if (window.authService) {
        return window.authService.requireAuth('login.html');
    }
    
    // Fallback реализация
    const currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Экспорт глобальных функций для обратной совместимости
window.getCurrentUser = getCurrentUser;
window.checkAuth = checkAuth;
window.logout = logout;
window.setCurrentUser = setCurrentUser;
window.requireAuth = requireAuth;