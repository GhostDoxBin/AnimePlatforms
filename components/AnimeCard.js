// components/AnimeCard.js - Компонент карточки аниме
class AnimeCard {
    constructor(anime, options = {}) {
        this.anime = anime;
        this.options = {
            showDescription: options.showDescription !== false,
            showWatchButton: options.showWatchButton !== false,
            showFavoriteButton: options.showFavoriteButton || false,
            maxDescriptionLength: options.maxDescriptionLength || 100,
            ...options
        };
    }

    /**
     * Рендеринг карточки
     * @returns {HTMLElement} Элемент карточки
     */
    render() {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.setAttribute('data-anime-id', this.anime.id);
        
        // Используем Helpers если доступен
        const generateStars = window.Helpers?.generateStars || this._generateStarsFallback;
        const truncateText = window.Helpers?.truncateText || this._truncateTextFallback;
        
        card.innerHTML = `
            <div class="anime-image">
                <img src="${this.anime.poster || ''}" alt="${this.anime.title || ''}">
            </div>
            <div class="anime-info">
                <h3 class="anime-title">${this.anime.title || ''}</h3>
                <div class="anime-rating">
                    <div class="rating-stars">${generateStars(this.anime.rating || 0)}</div>
                    <div class="rating-value">${this.anime.rating || 0}/10</div>
                </div>
                ${this.options.showDescription ? `
                    <p class="anime-description">${truncateText(this.anime.description || '', this.options.maxDescriptionLength)}</p>
                ` : ''}
                <div class="anime-actions">
                    ${this.options.showWatchButton ? `
                        <button class="btn btn-watch" data-anime-id="${this.anime.id}">Смотреть сейчас</button>
                    ` : ''}
                    ${this.options.showFavoriteButton ? `
                        <button class="btn btn-favorite" data-anime-id="${this.anime.id}">
                            ${this._isFavorite() ? '★' : '☆'} Избранное
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        // Обработка ошибок изображения
        const img = card.querySelector('img');
        if (img) {
            if (window.Helpers && window.Helpers.handleImageError) {
                window.Helpers.handleImageError(img);
            } else {
                this._handleImageError(img);
            }
        }

        // Настройка обработчиков событий
        this._setupEventListeners(card);

        return card;
    }

    /**
     * Настройка обработчиков событий
     * @private
     */
    _setupEventListeners(card) {
        // Обработка клика по карточке (открытие модального окна)
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn-watch') && 
                !e.target.classList.contains('btn-favorite') &&
                !e.target.closest('.btn-watch') &&
                !e.target.closest('.btn-favorite')) {
                if (window.animeModal && typeof window.animeModal.open === 'function') {
                    window.animeModal.open(this.anime);
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
                localStorage.setItem('currentAnime', JSON.stringify(this.anime));
                localStorage.setItem('currentEpisode', '1');
                
                // Переходим на страницу плеера
                window.location.href = `player.html?anime=${this.anime.id}&episode=1`;
            });
        }

        // Обработка кнопки "Избранное"
        const favoriteBtn = card.querySelector('.btn-favorite');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this._toggleFavorite(favoriteBtn);
            });
        }
    }

    /**
     * Переключение избранного
     * @private
     */
    _toggleFavorite(button) {
        try {
            if (window.animeService) {
                const isFavorite = window.animeService.toggleFavorite(this.anime.id);
                button.innerHTML = `${isFavorite ? '★' : '☆'} Избранное`;
                
                if (window.Helpers && window.Helpers.showNotification) {
                    window.Helpers.showNotification(
                        isFavorite ? 'Добавлено в избранное' : 'Удалено из избранного',
                        'success'
                    );
                }
            } else if (window.animeData && window.animeData.toggleFavorite) {
                const isFavorite = window.animeData.toggleFavorite(this.anime.id);
                button.innerHTML = `${isFavorite ? '★' : '☆'} Избранное`;
            }
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AnimeCard._toggleFavorite');
            }
        }
    }

    /**
     * Проверка, находится ли аниме в избранном
     * @private
     */
    _isFavorite() {
        if (window.animeService) {
            return window.animeService.isFavorite(this.anime.id);
        } else if (window.animeData && window.animeData.isFavorite) {
            return window.animeData.isFavorite(this.anime.id);
        }
        return false;
    }

    /**
     * Обработка ошибок изображения
     * @private
     */
    _handleImageError(img) {
        img.onerror = function() {
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #8a99b3;
                background: #2a3a52;
                border-radius: 8px;
            `;
            placeholder.textContent = 'Нет изображения';
            if (this.parentElement) {
                this.parentElement.appendChild(placeholder);
            }
        };
    }

    /**
     * Fallback для генерации звезд
     * @private
     */
    _generateStarsFallback(rating) {
        const fullStars = Math.floor(rating / 2);
        const halfStar = rating % 2 >= 1;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    }

    /**
     * Fallback для обрезки текста
     * @private
     */
    _truncateTextFallback(text, maxLength) {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + '...';
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.AnimeCard = AnimeCard;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimeCard;
}






