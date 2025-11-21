// Catalog page functionality
class Catalog {
    constructor() {
        this.grid = document.getElementById('catalog-grid');
        this.searchInput = document.getElementById('catalog-search');
        this.searchBtn = document.getElementById('catalog-search-btn');
        this.genreFilter = document.getElementById('genre-filter');
        this.yearFilter = document.getElementById('year-filter');
        this.ratingFilter = document.getElementById('rating-filter');
        this.sortFilter = document.getElementById('sort-filter');
        this.loadMoreBtn = document.getElementById('load-more');
        
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentResults = [];
        
        // Используем animeService если доступен
        this.animeService = window.animeService || null;
        
        this.init();
    }

    init() {
        try {
            this.loadAnime();
            this.setupEventListeners();
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'Catalog.init');
            }
        }
    }

    setupEventListeners() {
        console.log('Setting up catalog event listeners');
        
        // Search
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        }

        // Filters
        if (this.genreFilter) {
            this.genreFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (this.yearFilter) {
            this.yearFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (this.ratingFilter) {
            this.ratingFilter.addEventListener('change', () => this.applyFilters());
        }
        
        if (this.sortFilter) {
            this.sortFilter.addEventListener('change', () => this.applyFilters());
        }

        // Load more
        if (this.loadMoreBtn) {
            this.loadMoreBtn.addEventListener('click', () => this.loadMore());
        }
        
        // Делегирование событий для карточек
        if (this.grid) {
            this.grid.addEventListener('click', (e) => {
                // Обработка кнопки "Смотреть сейчас"
                if (e.target.classList.contains('btn-watch') || e.target.closest('.btn-watch')) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const button = e.target.classList.contains('btn-watch') ? e.target : e.target.closest('.btn-watch');
                    const card = button.closest('.anime-card');
                    const animeId = card ? card.getAttribute('data-anime-id') : null;
                    
                    console.log('Catalog watch button clicked for anime ID:', animeId);
                    
                    if (animeId) {
                        let anime = null;
                        if (this.animeService) {
                            anime = this.animeService.getAnimeById(parseInt(animeId));
                        } else if (window.animeData && window.animeData.getAnimeById) {
                            anime = window.animeData.getAnimeById(parseInt(animeId));
                        }
                        
                        if (anime) {
                            // Сохраняем аниме в localStorage
                            localStorage.setItem('currentAnime', JSON.stringify(anime));
                            localStorage.setItem('currentEpisode', '1');
                            
                            // Переходим на страницу плеера
                            window.location.href = `player.html?anime=${anime.id}&episode=1`;
                        } else {
                            console.error('Anime not found for ID:', animeId);
                            if (window.Helpers && window.Helpers.showNotification) {
                                window.Helpers.showNotification('Аниме не найдено', 'error');
                            }
                        }
                    }
                }
                
                // Обработка клика по карточке
                if (e.target.closest('.anime-card') && !e.target.classList.contains('btn-watch')) {
                    const card = e.target.closest('.anime-card');
                    const animeId = card.getAttribute('data-anime-id');
                    
                    if (animeId) {
                        let anime = null;
                        if (this.animeService) {
                            anime = this.animeService.getAnimeById(parseInt(animeId));
                        } else if (window.animeData && window.animeData.getAnimeById) {
                            anime = window.animeData.getAnimeById(parseInt(animeId));
                        }
                        
                        if (anime && window.animeModal && typeof window.animeModal.open === 'function') {
                            window.animeModal.open(anime);
                        }
                    }
                }
            });
        }
    }

    performSearch() {
        this.currentPage = 1;
        this.applyFilters();
    }

    applyFilters() {
        try {
            const searchTerm = this.searchInput ? this.searchInput.value.trim() : '';
            const filters = {
                genre: this.genreFilter ? this.genreFilter.value : '',
                year: this.yearFilter ? this.yearFilter.value : '',
                rating: this.ratingFilter ? this.ratingFilter.value : '',
                sort: this.sortFilter ? this.sortFilter.value : 'rating'
            };

            // Используем animeService если доступен
            if (this.animeService) {
                this.currentResults = this.animeService.searchAnime(searchTerm, filters);
            } else if (window.animeData && window.animeData.searchAnime) {
                this.currentResults = window.animeData.searchAnime(searchTerm, filters);
            } else {
                this.currentResults = [];
            }

            this.currentPage = 1;
            this.renderAnime();
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'Catalog.applyFilters');
            }
        }
    }

    loadAnime() {
        try {
            // Используем animeService если доступен
            if (this.animeService) {
                this.currentResults = this.animeService.getAllAnime();
            } else if (window.animeData && window.animeData.animeList) {
                this.currentResults = [...window.animeData.animeList];
            } else {
                this.currentResults = [];
            }
            this.renderAnime();
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'Catalog.loadAnime');
            }
        }
    }

    renderAnime() {
        if (!this.grid) return;
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const animeToShow = this.currentResults.slice(0, endIndex);

        this.grid.innerHTML = '';

        if (animeToShow.length === 0) {
            this.showNoResults();
            return;
        }

        animeToShow.forEach(anime => {
            // Используем компонент AnimeCard если доступен
            let card;
            if (window.AnimeCard) {
                const animeCard = new window.AnimeCard(anime, {
                    showDescription: true,
                    showWatchButton: true,
                    showFavoriteButton: false
                });
                card = animeCard.render();
            } else {
                card = this.createAnimeCard(anime);
            }
            this.grid.appendChild(card);
        });

        // Show/hide load more button
        if (this.loadMoreBtn) {
            this.loadMoreBtn.style.display = 
                endIndex < this.currentResults.length ? 'block' : 'none';
        }
    }

    createAnimeCard(anime) {
        // Fallback реализация, если компонент AnimeCard недоступен
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.setAttribute('data-anime-id', anime.id);
        
        const generateStars = window.Helpers?.generateStars || this.generateStars;
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
        if (img) {
            if (window.Helpers && window.Helpers.handleImageError) {
                window.Helpers.handleImageError(img);
            } else {
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
        }

        return card;
    }

    generateStars(rating) {
        // Fallback функция
        const fullStars = Math.floor(rating / 2);
        const halfStar = rating % 2 >= 1;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    }

    showNoResults() {
        const hasSearchOrFilters = (this.searchInput && this.searchInput.value.trim()) ||
                                   (this.genreFilter && this.genreFilter.value) ||
                                   (this.yearFilter && this.yearFilter.value) ||
                                   (this.ratingFilter && this.ratingFilter.value);
        
        if (hasSearchOrFilters) {
            // Показываем сообщение о том, что ничего не найдено по фильтрам
            this.grid.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🔍</div>
                    <h3 style="font-size: 24px; margin-bottom: 15px; color: var(--text-primary);">Ничего не найдено</h3>
                    <p style="font-size: 16px; margin-bottom: 30px; color: var(--text-secondary);">
                        Попробуйте изменить параметры поиска или фильтры
                    </p>
                    <button class="btn btn-primary" onclick="window.catalog.resetFilters()">Сбросить фильтры</button>
                </div>
            `;
        } else {
            // Показываем сообщение о пустом каталоге
            this.grid.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🎌</div>
                    <h3 style="font-size: 24px; margin-bottom: 15px; color: var(--text-primary);">Каталог пуст</h3>
                    <p style="font-size: 16px; margin-bottom: 30px; color: var(--text-secondary); max-width: 500px; margin-left: auto; margin-right: auto;">
                        Администратор еще не добавил аниме в каталог. 
                        Пожалуйста, войдите в админ-панель для добавления контента.
                    </p>
                </div>
            `;
        }
        
        if (this.loadMoreBtn) {
            this.loadMoreBtn.style.display = 'none';
        }
    }

    resetFilters() {
        if (this.searchInput) this.searchInput.value = '';
        if (this.genreFilter) this.genreFilter.value = '';
        if (this.yearFilter) this.yearFilter.value = '';
        if (this.ratingFilter) this.ratingFilter.value = '';
        if (this.sortFilter) this.sortFilter.value = 'rating';
        this.loadAnime();
    }

    loadMore() {
        this.currentPage++;
        this.renderAnime();
    }
}

// Initialize catalog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('catalog-grid')) {
        window.catalog = new Catalog();
        console.log('Catalog initialized');
    }
});