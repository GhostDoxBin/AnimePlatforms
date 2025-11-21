// Modal functionality
class AnimeModal {
    constructor() {
        this.modal = document.getElementById('anime-modal');
        this.closeBtn = document.getElementById('close-modal');
        this.watchBtn = document.getElementById('watch-btn');
        this.favoriteBtn = document.getElementById('favorite-btn');
        
        this.currentAnime = null;
        
        if (this.modal) {
            this.init();
        }
    }

    init() {
        console.log('Initializing anime modal');
        
        // Close modal events
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.close();
            });
        }

        // Watch button event
        if (this.watchBtn) {
            this.watchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('Watch button clicked in modal');
                this.watchAnime();
            });
        }

        // Favorite button event
        if (this.favoriteBtn) {
            this.favoriteBtn.addEventListener('click', () => {
                console.log('Favorite button clicked');
                this.toggleFavorite();
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal && this.modal.classList.contains('active')) {
                this.close();
            }
        });
        
        console.log('Anime modal initialized successfully');
    }

    open(anime) {
        if (!this.modal) {
            console.error('Modal element not found');
            return;
        }
        
        console.log('Opening modal for:', anime.title);
        this.currentAnime = anime;
        this.updateModalContent(anime);
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    close() {
        if (!this.modal) return;
        
        console.log('Closing modal');
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentAnime = null;
    }

    updateModalContent(anime) {
        console.log('Updating modal content for:', anime.title);
        
        const elements = {
            title: document.getElementById('modal-title'),
            rating: document.getElementById('modal-rating'),
            year: document.getElementById('modal-year'),
            episodes: document.getElementById('modal-episodes'),
            genre: document.getElementById('modal-genre'),
            description: document.getElementById('modal-description'),
            poster: document.getElementById('modal-poster')
        };

        // Update all elements
        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                switch(key) {
                    case 'title':
                        elements[key].textContent = anime.title;
                        break;
                    case 'rating':
                        elements[key].innerHTML = `<span class="icon">★</span> Рейтинг: ${anime.rating}`;
                        break;
                    case 'year':
                        elements[key].innerHTML = `<span class="icon">📅</span> Год: ${anime.year}`;
                        break;
                    case 'episodes':
                        elements[key].innerHTML = `<span class="icon">🎬</span> Эпизоды: ${anime.episodes}`;
                        break;
                    case 'genre':
                        elements[key].innerHTML = `<span class="icon">🏷️</span> Жанр: ${anime.genre}`;
                        break;
                    case 'description':
                        elements[key].textContent = anime.description;
                        break;
                    case 'poster':
                        elements[key].src = anime.poster;
                        elements[key].alt = anime.title;
                        break;
                }
            }
        });

        // Update favorite button
        this.updateFavoriteButton(anime.id);
        
        // Update watch button
        if (this.watchBtn) {
            this.watchBtn.setAttribute('data-anime-id', anime.id);
        }
    }

    updateFavoriteButton(animeId) {
        if (!this.favoriteBtn) return;
        
        const isFavorite = window.animeData.isFavorite(animeId);
        this.favoriteBtn.innerHTML = `<span class="icon">★</span> ${isFavorite ? 'В избранном' : 'В избранное'}`;
        this.favoriteBtn.classList.toggle('active', isFavorite);
    }

    toggleFavorite() {
        if (this.currentAnime && this.favoriteBtn) {
            const isNowFavorite = window.animeData.toggleFavorite(this.currentAnime.id);
            this.updateFavoriteButton(this.currentAnime.id);
            this.showNotification(isNowFavorite ? 'Добавлено в избранное' : 'Удалено из избранного');
        }
    }

    watchAnime() {
        if (this.currentAnime) {
            console.log('Watching anime from modal:', this.currentAnime.title);
            this.close();
            
            // Сохраняем аниме в localStorage
            localStorage.setItem('currentAnime', JSON.stringify(this.currentAnime));
            localStorage.setItem('currentEpisode', '1');
            
            // Переходим на страницу плеера
            window.location.href = `player.html?anime=${this.currentAnime.id}&episode=1`;
        }
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
            z-index: 3000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize modal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('anime-modal')) {
        window.animeModal = new AnimeModal();
        console.log('Anime modal created globally');
    }
});