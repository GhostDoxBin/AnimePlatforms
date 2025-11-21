// app.js - Основной файл инициализации приложения
class AnimePlatform {
    constructor() {
        this.initialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing Anime Platform...');
            
            // Инициализация систем
            await this.initializeSystems();
            
            // Загрузка данных для текущей страницы
            await this.loadPageData();
            
            // Настройка глобальных обработчиков
            this.setupGlobalHandlers();
            
            this.initialized = true;
            console.log('✅ Anime Platform initialized successfully');
            
        } catch (error) {
            console.error('❌ Error initializing Anime Platform:', error);
            this.showError('Ошибка инициализации приложения');
        }
    }

    async initializeSystems() {
        // Проверяем наличие необходимых глобальных объектов
        if (!window.database) {
            throw new Error('Database not found');
        }
        
        if (!window.authSystem) {
            throw new Error('Auth system not found');
        }
        
        if (!window.animeManager) {
            throw new Error('Anime manager not found');
        }

        // Обновляем UI системы аутентификации
        window.authSystem.updateUI();
    }

    async loadPageData() {
        const path = window.location.pathname;
        
        if (path.includes('index.html') || path === '/') {
            await this.loadHomePage();
        } else if (path.includes('catalog.html')) {
            await this.loadCatalogPage();
        } else if (path.includes('player.html')) {
            await this.loadPlayerPage();
        } else if (path.includes('profile.html')) {
            await this.loadProfilePage();
        } else if (path.includes('admin-panel.html')) {
            await this.loadAdminPanel();
        } else if (path.includes('ratings.html')) {
            await this.loadRatingsPage();
        }
    }

    async loadHomePage() {
        const popularGrid = document.getElementById('popular-anime');
        const newGrid = document.getElementById('new-anime');
        
        if (popularGrid) {
            this.renderAnimeGrid(popularGrid, window.animeManager.getPopularAnime());
        }
        
        if (newGrid) {
            this.renderAnimeGrid(newGrid, window.animeManager.getNewAnime());
        }
    }

    async loadCatalogPage() {
        // Инициализация каталога
        if (typeof Catalog !== 'undefined') {
            window.catalog = new Catalog();
        }
    }

    async loadPlayerPage() {
        // Инициализация плеера
        if (typeof PlayerPage !== 'undefined') {
            window.playerPage = new PlayerPage();
        }
    }

    async loadProfilePage() {
        // Загрузка данных профиля
        if (window.authSystem.currentUser) {
            this.loadProfileData(window.authSystem.currentUser);
        }
    }

    async loadAdminPanel() {
        // Проверка прав администратора
        if (!window.authSystem.isAdmin()) {
            window.location.href = 'index.html';
            return;
        }
        
        // Инициализация админ-панели
        if (typeof AdminPanel !== 'undefined') {
            window.adminPanel = new AdminPanel();
        }
    }

    async loadRatingsPage() {
        // Инициализация страницы рейтингов
        if (typeof RatingsPage !== 'undefined') {
            window.ratingsPage = new RatingsPage();
        }
    }

    renderAnimeGrid(container, animeList) {
        if (!container) return;
        
        container.innerHTML = '';
        
        animeList.forEach(anime => {
            const card = this.createAnimeCard(anime);
            container.appendChild(card);
        });
    }

    createAnimeCard(anime) {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.setAttribute('data-anime-id', anime.id);
        
        card.innerHTML = `
            <div class="anime-image">
                <img src="${anime.poster}" alt="${anime.title}" 
                     onerror="this.src='https://via.placeholder.com/400x600/333/fff?text=No+Image'">
            </div>
            <div class="anime-info">
                <h3 class="anime-title">${anime.title}</h3>
                <div class="anime-rating">
                    <div class="rating-stars">${this.generateStars(anime.rating)}</div>
                    <div class="rating-value">${anime.rating}/10</div>
                </div>
                <p class="anime-description">${anime.description}</p>
                <button class="btn btn-watch" onclick="openPlayer(${anime.id})">Смотреть сейчас</button>
            </div>
        `;

        // Добавляем обработчик клика для открытия модального окна
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-watch')) {
                this.openAnimeModal(anime.id);
            }
        });

        return card;
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating / 2);
        const halfStar = rating % 2 >= 1;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    }

    openAnimeModal(animeId) {
        const anime = window.database.getAnimeById(animeId);
        if (!anime) return;

        if (window.animeModal) {
            window.animeModal.open(anime);
        } else {
            // Fallback: открываем страницу аниме
            window.location.href = `anime.html?id=${animeId}`;
        }
    }

    loadProfileData(user) {
        // Заполнение данных профиля
        const elements = {
            'profile-username': user.username,
            'profile-display-name': user.displayName,
            'profile-email': user.email,
            'profile-bio': user.bio || ''
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = elements[id];
            }
        });

        // Установка аватара
        const avatar = document.getElementById('avatar-image');
        if (avatar) {
            avatar.src = user.avatar;
        }

        // Загрузка статистики
        this.loadProfileStats();
    }

    loadProfileStats() {
        const stats = window.animeManager.getStats();
        const statsContainer = document.getElementById('profile-stats');
        
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <div class="stat-value">${stats.totalWatched}</div>
                    <div class="stat-label">Просмотрено</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.totalFavorites}</div>
                    <div class="stat-label">В избранном</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.favoriteGenre}</div>
                    <div class="stat-label">Любимый жанр</div>
                </div>
            `;
        }
    }

    setupGlobalHandlers() {
        // Глобальный обработчик ошибок
        window.addEventListener('error', (e) => {
            console.error('Global error:', e.error);
            this.showError('Произошла ошибка в приложении');
        });

        // Обработчик для кнопки "Назад"
        window.addEventListener('popstate', () => {
            this.loadPageData();
        });

        // Плавные переходы между страницами
        this.setupSmoothTransitions();
    }

    setupSmoothTransitions() {
        // Добавляем класс для плавных переходов
        document.body.classList.add('page-transition');
        
        // Плавная прокрутка для якорей
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'notification';
        errorDiv.style.background = '#ff6b9c';
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'notification';
        successDiv.style.background = '#6c8cff';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// Глобальные функции для использования в HTML
function openPlayer(animeId) {
    const anime = window.database.getAnimeById(animeId);
    if (anime) {
        if (window.animePlayer) {
            window.animePlayer.open(anime);
        } else {
            window.location.href = `player.html?anime=${animeId}`;
        }
    }
}

function toggleFavorite(animeId) {
    if (!window.animeManager) return false;
    
    const isNowFavorite = window.animeManager.toggleFavorite(animeId);
    
    if (window.app) {
        const message = isNowFavorite ? 'Добавлено в избранное' : 'Удалено из избранного';
        window.app.showSuccess(message);
    }
    
    return isNowFavorite;
}

// Инициализация приложения при загрузке
document.addEventListener('DOMContentLoaded', function() {
    window.app = new AnimePlatform();
});