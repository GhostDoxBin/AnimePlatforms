// Ratings page functionality
class RatingsPage {
    constructor() {
        console.log('Initializing RatingsPage...');
        
        // Проверяем авторизацию перед инициализацией
        if (!this.checkAuth()) {
            return;
        }
        
        this.tableBody = document.getElementById('ratings-table-body');
        this.timeFilter = document.getElementById('time-filter');
        this.typeFilter = document.getElementById('type-filter');
        this.genreFilter = document.getElementById('genre-filter');
        this.exportBtn = document.getElementById('export-btn');
        
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentRatings = [];
        
        // Проверяем, что необходимые элементы существуют
        if (!this.tableBody) {
            console.error('Ratings table body not found');
            return;
        }
        
        this.init();
    }

    checkAuth() {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.log('User not authenticated, redirecting to login...');
            // Показываем сообщение и перенаправляем
            setTimeout(() => {
                alert('Для просмотра рейтингов необходимо войти в систему');
                window.location.href = 'login.html';
            }, 100);
            return false;
        }
        console.log('User authenticated:', currentUser.username);
        return true;
    }

    init() {
        console.log('Starting ratings page initialization...');
        this.loadRatings();
        this.setupEventListeners();
        this.setupTopAnimeInteractions();
        console.log('Ratings page initialized successfully');
    }

    setupEventListeners() {
        // Filters
        if (this.timeFilter) {
            this.timeFilter.addEventListener('change', () => this.applyFilters());
        }
        if (this.typeFilter) {
            this.typeFilter.addEventListener('change', () => this.applyFilters());
        }
        if (this.genreFilter) {
            this.genreFilter.addEventListener('change', () => this.applyFilters());
        }

        // Export button
        if (this.exportBtn) {
            this.exportBtn.addEventListener('click', () => this.exportRatings());
        }

        // Pagination
        this.setupPagination();
    }

    setupTopAnimeInteractions() {
        // Watch buttons in top section
        document.querySelectorAll('.btn-watch[data-anime-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const animeId = btn.getAttribute('data-anime-id');
                this.watchAnime(animeId);
            });
        });

        // Click on top anime titles
        document.querySelectorAll('.top-info h3').forEach(title => {
            title.style.cursor = 'pointer';
            title.addEventListener('click', () => {
                const animeItem = title.closest('.top-item');
                const animeId = this.getAnimeIdFromTopItem(animeItem);
                if (animeId) {
                    this.showAnimeDetails(animeId);
                }
            });
        });
    }

    getAnimeIdFromTopItem(topItem) {
        if (!topItem) return null;
        
        // Map top items to anime IDs
        const rankClass = Array.from(topItem.classList).find(cls => cls.startsWith('top-'));
        if (!rankClass) return null;
        
        switch(rankClass) {
            case 'top-1': return 2; // Атака титанов
            case 'top-2': return 6; // Магическая битва
            case 'top-3': return 4; // Ван Пис
            default: return null;
        }
    }

    async loadRatings() {
        console.log('Loading ratings data...');
        // Show loading indicator
        if (this.tableBody) {
            this.tableBody.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #b8c1cc;"><h3>Загрузка рейтинга...</h3></div>';
        }
        
        // Generate enhanced ratings data (async)
        this.currentRatings = await this.generateRatingsData();
        this.renderRatingsTable();
        this.updatePagination();
        console.log('Ratings data loaded:', this.currentRatings.length, 'items');
    }

    async generateRatingsData() {
        console.log('Generating ratings data...');
        
        // Пытаемся получить топ 100 аниме из интернета
        let topAnime = [];
        if (window.animeAPIService) {
            try {
                console.log('Fetching top 100 anime from API...');
                topAnime = await window.animeAPIService.fetchTopAnime(100);
                console.log('Fetched', topAnime.length, 'anime from API');
            } catch (error) {
                console.error('Error fetching top anime:', error);
            }
        }
        
        // Если не удалось получить из API, используем локальные данные
        if (topAnime.length === 0) {
            // Проверяем, что данные аниме загружены
            if (typeof window.animeData === 'undefined') {
                console.error('Anime data not loaded');
                return [];
            }

            const baseAnime = window.animeData.animeList || [];
            const ratings = [];
            
            // Enhance base anime data with additional properties for ratings
            baseAnime.forEach(anime => {
                ratings.push({
                    ...anime,
                    votes: anime.votes || Math.floor(Math.random() * 1000000) + 50000,
                    rank: Math.floor(Math.random() * 100) + 1,
                    type: anime.type || 'TV',
                    popularity: anime.popularity || Math.floor(Math.random() * 1000) + 1
                });
            });
            
            topAnime = ratings;
        }

        // Add more anime for demonstration
        const additionalAnime = [
            {
                id: 7,
                title: "Ходячий замок",
                rating: 8.9,
                year: 2004,
                episodes: 1,
                genre: "Фэнтези",
                status: "Завершено",
                studio: "Studio Ghibli",
                description: "Молодая шляпница Софи превращается в старуху и отправляется в путешествие с загадочным волшебником Хаулом.",
                poster: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=400&fit=crop",
                votes: 450000,
                rank: 4,
                type: "Movie",
                popularity: 150
            },
            {
                id: 8,
                title: "Унесенные призраками",
                rating: 9.3,
                year: 2001,
                episodes: 1,
                genre: "Фэнтези",
                status: "Завершено",
                studio: "Studio Ghibli",
                description: "Девочка Тихиро попадает в мир духов и должна спасти своих родителей, работая в бане для богов.",
                poster: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=300&h=400&fit=crop",
                votes: 680000,
                rank: 5,
                type: "Movie",
                popularity: 120
            },
            {
                id: 9,
                title: "Стальной алхимик",
                rating: 9.1,
                year: 2009,
                episodes: 64,
                genre: "Сёнен",
                status: "Завершено",
                studio: "Bones",
                description: "Братья Эдвард и Альфонс Элрих ищут философский камень, чтобы восстановить свои тела.",
                poster: "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?w=300&h=400&fit=crop",
                votes: 750000,
                rank: 6,
                type: "TV",
                popularity: 95
            },
            {
                id: 10,
                title: "Евангелион",
                rating: 8.5,
                year: 1995,
                episodes: 26,
                genre: "Драма",
                status: "Завершено",
                studio: "Gainax",
                description: "Подростки пилотируют гигантских роботов, чтобы защитить Землю от таинственных существ.",
                poster: "https://images.unsplash.com/photo-1636516449936-4ffc70b756ff?w=300&h=400&fit=crop",
                votes: 420000,
                rank: 7,
                type: "TV",
                popularity: 88
            }
        ];

        const allRatings = [...ratings, ...additionalAnime]
            .sort((a, b) => b.rating - a.rating)
            .map((anime, index) => ({
                ...anime,
                rank: index + 1
            }));

        console.log('Generated ratings:', allRatings.length, 'items');
        return allRatings;
    }

    async applyFilters() {
        console.log('Applying filters...');
        const timeFilter = this.timeFilter ? this.timeFilter.value : 'all';
        const typeFilter = this.typeFilter ? this.typeFilter.value : 'all';
        const genreFilter = this.genreFilter ? this.genreFilter.value : 'all';

        let filtered = await this.generateRatingsData();

        // Apply time filter
        if (timeFilter !== 'all') {
            filtered = filtered.filter(anime => anime.year.toString() === timeFilter);
        }

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(anime => anime.type.toLowerCase() === typeFilter.toLowerCase());
        }

        // Apply genre filter
        if (genreFilter !== 'all') {
            filtered = filtered.filter(anime => anime.genre === genreFilter);
        }

        this.currentRatings = filtered;
        this.currentPage = 1;
        this.renderRatingsTable();
        this.updatePagination();
        
        console.log('Filters applied. Results:', filtered.length);
    }

    renderRatingsTable() {
        if (!this.tableBody) {
            console.error('Table body not found');
            return;
        }

        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const ratingsToShow = this.currentRatings.slice(startIndex, endIndex);

        this.tableBody.innerHTML = '';

        if (ratingsToShow.length === 0) {
            this.showNoResults();
            return;
        }

        ratingsToShow.forEach(anime => {
            const row = this.createRatingRow(anime);
            this.tableBody.appendChild(row);
        });

        console.log('Rendered table with', ratingsToShow.length, 'items');
    }

    createRatingRow(anime) {
        const row = document.createElement('div');
        row.className = 'table-row';
        row.innerHTML = `
            <div class="rank-col">${anime.rank}</div>
            <div class="title-col">
                <img src="${anime.poster}" alt="${anime.title}" class="title-poster"
                     onerror="this.src='https://via.placeholder.com/50x70/333/fff?text=No+Image'">
                <div class="title-info">
                    <div class="title-name">${anime.title}</div>
                    <div class="title-genre">${anime.genre} • ${anime.type}</div>
                </div>
            </div>
            <div class="rating-col">${anime.rating}</div>
            <div class="votes-col">${this.formatVotes(anime.votes)}</div>
            <div class="year-col">${anime.year}</div>
            <div class="actions-col">
                <button class="btn btn-table btn-table-watch" data-anime-id="${anime.id}">
                    Смотреть
                </button>
                <button class="btn btn-table btn-table-favorite" data-anime-id="${anime.id}">
                    <span class="icon icon-star"></span>
                </button>
            </div>
        `;

        // Add event listeners
        const titleName = row.querySelector('.title-name');
        const watchBtn = row.querySelector('.btn-table-watch');
        const favoriteBtn = row.querySelector('.btn-table-favorite');

        titleName.addEventListener('click', () => this.showAnimeDetails(anime.id));
        watchBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.watchAnime(anime.id);
        });
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleFavorite(anime.id, favoriteBtn);
        });

        return row;
    }

    formatVotes(votes) {
        if (votes >= 1000000) {
            return (votes / 1000000).toFixed(1) + 'M';
        } else if (votes >= 1000) {
            return (votes / 1000).toFixed(1) + 'K';
        }
        return votes.toString();
    }

    showNoResults() {
        this.tableBody.innerHTML = `
            <div class="table-row">
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #b8c1cc;">
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить параметры фильтров</p>
                </div>
            </div>
        `;
    }

    showAnimeDetails(animeId) {
        const anime = this.currentRatings.find(a => a.id === parseInt(animeId));
        if (anime && window.animeModal) {
            window.animeModal.open(anime);
        } else {
            console.warn('Anime modal not available or anime not found');
        }
    }

    watchAnime(animeId) {
        const anime = this.currentRatings.find(a => a.id === parseInt(animeId));
        if (anime) {
            localStorage.setItem('currentAnime', JSON.stringify(anime));
            window.location.href = 'player.html';
        } else {
            console.error('Anime not found:', animeId);
        }
    }

    toggleFavorite(animeId, button) {
        if (typeof window.animeData === 'undefined') {
            console.error('Anime data not available');
            return;
        }

        const isNowFavorite = window.animeData.toggleFavorite(animeId);
        button.classList.toggle('active', isNowFavorite);
        
        // Show notification
        this.showNotification(isNowFavorite ? 'Добавлено в избранное' : 'Удалено из избранного');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(90deg, #6c8cff, #ff6b9c);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }