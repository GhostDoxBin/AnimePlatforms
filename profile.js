// Profile management
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        if (!requireAuth()) return;
        
        this.currentUser = getCurrentUser();
        this.loadProfileData();
        this.setupEventListeners();
    }

    loadProfileData() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        this.fillFormData(this.currentUser);
    }

    fillFormData(user) {
        const elements = {
            'profile-username': user.username,
            'profile-display-name': user.displayName || user.username,
            'profile-email': user.email,
            'profile-bio': user.bio || ''
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = elements[id];
            }
        });

        const avatar = document.getElementById('avatar-image');
        if (avatar && user.avatar) {
            avatar.src = user.avatar;
        }

        this.loadPreferences(user);
    }

    loadPreferences(user) {
        if (!user.preferences) return;

        const elements = {
            'profile-language': user.preferences.language,
            'profile-theme': user.preferences.theme,
            'profile-notifications-email': user.preferences.notifications.email,
            'profile-notifications-push': user.preferences.notifications.push,
            'profile-notifications-newsletter': user.preferences.notifications.newsletter
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = elements[id];
                } else {
                    element.value = elements[id];
                }
            }
        });
    }

    setupEventListeners() {
        const profileForm = document.getElementById('profile-info-form');
        const securityForm = document.getElementById('profile-security-form');
        const preferencesForm = document.getElementById('profile-preferences-form');

        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.saveProfile(e));
        }

        if (securityForm) {
            securityForm.addEventListener('submit', (e) => this.changePassword(e));
        }

        if (preferencesForm) {
            preferencesForm.addEventListener('submit', (e) => this.savePreferences(e));
        }

        // Смена аватара
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const avatarInput = document.getElementById('avatar-input');
        const avatarImage = document.getElementById('avatar-image');

        if (changeAvatarBtn && avatarInput && avatarImage) {
            changeAvatarBtn.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', (e) => this.handleAvatarChange(e));
        }

        // Навигация по разделам
        this.setupProfileNavigation();

        // Избранное
        this.setupFavorites();

        // Синхронизация устройств из профиля
        this.setupProfileSync();
    }

    setupProfileSync() {
        if (!window.syncService) return;

        const syncNowBtn = document.getElementById('profile-sync-now-btn');
        const exportBtn = document.getElementById('profile-export-btn');
        const importBtn = document.getElementById('profile-import-btn');
        const importInput = document.getElementById('profile-import-file-input');

        // Кнопка синхронизации сейчас
        if (syncNowBtn) {
            syncNowBtn.addEventListener('click', async () => {
                try {
                    this.showNotification('Синхронизация начата...', 'success');
                    const result = await window.syncService.syncNow();
                    if (result.success) {
                        this.showNotification(result.message || 'Данные синхронизированы!', 'success');
                        this.updateProfileSyncInfo();
                        // Перезагружаем страницу для обновления данных
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    } else {
                        this.showNotification('Ошибка синхронизации: ' + (result.error || 'Неизвестная ошибка'), 'error');
                    }
                } catch (error) {
                    console.error('Error syncing:', error);
                    this.showNotification('Ошибка синхронизации: ' + error.message, 'error');
                }
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                try {
                    const result = window.syncService.exportToFile();
                    if (result.success) {
                        this.showNotification(result.message, 'success');
                    } else {
                        this.showNotification('Ошибка экспорта: ' + (result.error || 'Неизвестная ошибка'), 'error');
                    }
                } catch (error) {
                    console.error('Error exporting data:', error);
                    this.showNotification('Ошибка экспорта данных: ' + error.message, 'error');
                }
            });
        }

        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => {
                importInput.click();
            });

            importInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const result = await window.syncService.importFromFile(file);
                    if (result.success) {
                        let message = `Успешно импортировано ${result.animeCount} аниме`;
                        if (result.usersCount > 0) {
                            message += ` и ${result.usersCount} пользователей`;
                        }
                        this.showNotification(message + '!', 'success');
                        this.updateProfileSyncInfo();
                        
                        // Перезагружаем страницу для обновления данных
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                    }
                } catch (error) {
                    console.error('Error importing data:', error);
                    this.showNotification('Ошибка импорта данных: ' + error.message, 'error');
                }

                // Сброс input для возможности повторного выбора
                e.target.value = '';
            });
        }

        // Обновление информации о синхронизации
        this.updateProfileSyncInfo();
        setInterval(() => this.updateProfileSyncInfo(), 60000); // Обновляем каждую минуту
    }

    updateProfileSyncInfo() {
        const syncInfoEl = document.getElementById('profile-sync-info');
        if (!syncInfoEl || !window.syncService) return;

        try {
            const lastSyncDate = window.syncService.getLastSyncDate();
            if (lastSyncDate) {
                const date = new Date(lastSyncDate);
                const now = new Date();
                const diffMs = now - date;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMs / 3600000);
                const diffDays = Math.floor(diffMs / 86400000);

                let timeText = '';
                if (diffMins < 1) {
                    timeText = 'только что';
                } else if (diffMins < 60) {
                    timeText = `${diffMins} минут назад`;
                } else if (diffHours < 24) {
                    timeText = `${diffHours} часов назад`;
                } else {
                    timeText = `${diffDays} дней назад`;
                }

                syncInfoEl.textContent = `⏱️ Последняя синхронизация: ${timeText} (${date.toLocaleString('ru-RU')})`;
            } else {
                syncInfoEl.textContent = '⏱️ Синхронизация еще не выполнялась';
            }
        } catch (error) {
            console.error('Error updating sync info:', error);
            syncInfoEl.textContent = '⏱️ Не удалось получить информацию о синхронизации';
        }
    }

    setupProfileNavigation() {
        const menuLinks = document.querySelectorAll('.profile-menu-link');
        const sections = document.querySelectorAll('.profile-section');

        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                
                menuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                sections.forEach(section => {
                    section.classList.remove('active');
                });
                
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.add('active');
                    
                    // Загружаем избранное при переходе на вкладку
                    if (sectionId === 'profile-favorites') {
                        this.loadFavorites();
                    }
                }
            });
        });
    }

    setupFavorites() {
        // Загружаем избранное сразу если вкладка активна
        const favoritesSection = document.getElementById('profile-favorites');
        if (favoritesSection && favoritesSection.classList.contains('active')) {
            this.loadFavorites();
        }

        // Слушаем изменения избранного
        window.addEventListener('storage', (e) => {
            if (e.key === 'animeFavorites') {
                const favoritesSection = document.getElementById('profile-favorites');
                if (favoritesSection && favoritesSection.classList.contains('active')) {
                    this.loadFavorites();
                }
            }
        });
    }

    loadFavorites() {
        const favoritesGrid = document.getElementById('favorites-grid');
        const favoritesEmpty = document.getElementById('favorites-empty');
        
        if (!favoritesGrid || !favoritesEmpty) return;

        let favorites = [];
        let animeList = [];

        // Получаем список ID избранных
        try {
            if (window.animeService && window.animeService.favorites) {
                favorites = Array.from(window.animeService.favorites);
            } else {
                const favoritesData = localStorage.getItem('animeFavorites');
                if (favoritesData) {
                    favorites = JSON.parse(favoritesData);
                }
            }
        } catch (e) {
            console.error('Ошибка загрузки избранного:', e);
        }

        // Получаем список всех аниме
        if (window.animeService) {
            animeList = window.animeService.getAllAnime();
        } else if (window.animeData && window.animeData.animeList) {
            animeList = window.animeData.animeList;
        } else if (window.database && window.database.animeList) {
            animeList = window.database.animeList;
        }

        // Фильтруем избранные аниме
        const favoriteAnime = animeList.filter(anime => {
            const animeId = typeof anime.id === 'string' ? parseInt(anime.id) : anime.id;
            return favorites.some(favId => {
                const favIdNum = typeof favId === 'string' ? parseInt(favId) : favId;
                return animeId === favIdNum;
            });
        });

        if (favoriteAnime.length === 0) {
            favoritesGrid.style.display = 'none';
            favoritesEmpty.style.display = 'block';
            return;
        }

        favoritesGrid.style.display = 'grid';
        favoritesEmpty.style.display = 'none';
        favoritesGrid.innerHTML = '';

        // Создаем карточки для избранных аниме
        favoriteAnime.forEach(anime => {
            const card = this.createFavoriteCard(anime);
            favoritesGrid.appendChild(card);
        });
    }

    createFavoriteCard(anime) {
        const card = document.createElement('div');
        card.className = 'anime-card';
        card.style.cursor = 'pointer';

        const poster = anime.poster || 'https://via.placeholder.com/300x450/333/fff?text=' + encodeURIComponent(anime.title || 'Аниме');
        const rating = anime.rating || 0;
        const year = anime.year || 'Не указан';
        const episodes = anime.episodes || 0;
        const genre = anime.genre || 'Не указан';

        card.innerHTML = `
            <div class="anime-image">
                <img src="${poster}" alt="${anime.title}" loading="lazy">
            </div>
            <div class="anime-info">
                <h3 class="anime-title">${anime.title || 'Без названия'}</h3>
                <div class="anime-rating">
                    <span class="rating-stars">★</span>
                    <span class="rating-value">${rating.toFixed(1)}</span>
                </div>
                <div class="anime-description">
                    ${anime.description || 'Описание отсутствует'}
                </div>
                <div style="margin-top: auto; display: flex; gap: 8px; flex-direction: column;">
                    <button class="btn-watch" data-anime-id="${anime.id}">Смотреть</button>
                    <button class="btn-favorite active" data-anime-id="${anime.id}" style="background: rgba(255, 107, 156, 0.1); color: var(--accent-primary); border: 1px solid var(--accent-primary);">
                        ★ Удалить из избранного
                    </button>
                </div>
            </div>
        `;

        // Обработчики событий
        const watchBtn = card.querySelector('.btn-watch');
        const favoriteBtn = card.querySelector('.btn-favorite');

        if (watchBtn) {
            watchBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.watchAnime(anime);
            });
        }

        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromFavorites(anime.id, card);
            });
        }

        // Клик на карточку открывает детали
        card.addEventListener('click', (e) => {
            if (!e.target.closest('button')) {
                this.openAnimeDetails(anime);
            }
        });

        return card;
    }

    watchAnime(anime) {
        // Сохраняем аниме для плеера
        localStorage.setItem('currentAnime', JSON.stringify(anime));
        localStorage.setItem('currentEpisode', '1');
        
        // Переходим на страницу плеера
        window.location.href = `player.html?anime=${anime.id}&episode=1`;
    }

    removeFromFavorites(animeId, cardElement) {
        try {
            let removed = false;

            if (window.animeService && window.animeService.toggleFavorite) {
                removed = window.animeService.toggleFavorite(animeId);
            } else if (window.animeData && window.animeData.toggleFavorite) {
                removed = window.animeData.toggleFavorite(animeId);
            }

            if (removed) {
                // Анимация удаления
                if (cardElement) {
                    cardElement.style.transition = 'opacity 0.3s, transform 0.3s';
                    cardElement.style.opacity = '0';
                    cardElement.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        cardElement.remove();
                        this.loadFavorites(); // Перезагружаем список
                    }, 300);
                }
                this.showNotification('Удалено из избранного', 'success');

                // Сохраняем изменения в sync-service
                if (window.syncService) {
                    const data = window.syncService.getAllData();
                    window.syncService.saveToStorage(data);
                }
            }
        } catch (error) {
            console.error('Ошибка удаления из избранного:', error);
            this.showNotification('Ошибка удаления из избранного', 'error');
        }
    }

    openAnimeDetails(anime) {
        // Открываем модальное окно с деталями аниме
        if (window.animeModal && window.animeModal.open) {
            window.animeModal.open(anime);
        } else {
            // Fallback - переходим на страницу каталога
            window.location.href = `catalog.html#anime-${anime.id}`;
        }
    }

    async saveProfile(e) {
        e.preventDefault();
        
        if (!this.currentUser) return;

        const updates = {
            displayName: document.getElementById('profile-display-name').value,
            bio: document.getElementById('profile-bio').value,
            email: document.getElementById('profile-email').value
        };

        // Validate email
        if (!this.validateEmail(updates.email)) {
            this.showNotification('Пожалуйста, введите корректный email', 'error');
            return;
        }

        const success = this.updateUserProfile(updates);

        if (success) {
            this.showNotification('Профиль успешно обновлен!', 'success');
        } else {
            this.showNotification('Ошибка обновления профиля!', 'error');
        }
    }

    async changePassword(e) {
        e.preventDefault();
        
        if (!this.currentUser) return;

        const currentPassword = document.getElementById('profile-current-password').value;
        const newPassword = document.getElementById('profile-new-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;

        if (newPassword !== confirmPassword) {
            this.showNotification('Пароли не совпадают!', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('Пароль должен содержать не менее 6 символов!', 'error');
            return;
        }

        // In a real app, you would verify current password with server
        // For demo, we'll just update it
        const success = this.updateUserProfile({ password: newPassword });

        if (success) {
            this.showNotification('Пароль успешно изменен!', 'success');
            e.target.reset();
        } else {
            this.showNotification('Ошибка изменения пароля!', 'error');
        }
    }

    async savePreferences(e) {
        e.preventDefault();
        
        if (!this.currentUser) return;

        const updates = {
            preferences: {
                language: document.getElementById('profile-language').value,
                theme: document.getElementById('profile-theme').value,
                notifications: {
                    email: document.getElementById('profile-notifications-email').checked,
                    push: document.getElementById('profile-notifications-push').checked,
                    newsletter: document.getElementById('profile-notifications-newsletter').checked
                }
            }
        };

        const success = this.updateUserProfile(updates);

        if (success) {
            this.showNotification('Настройки сохранены!', 'success');
            
            // Apply theme immediately
            if (window.themeManager) {
                window.themeManager.applyTheme(updates.preferences.theme);
            }
        } else {
            this.showNotification('Ошибка сохранения настроек!', 'error');
        }
    }

    updateUserProfile(updates) {
        try {
            // Update current user
            Object.assign(this.currentUser, updates);
            setCurrentUser(this.currentUser);
            
            // Update in users database
            const users = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                Object.assign(users[userIndex], updates);
                localStorage.setItem('animePlatformUsers', JSON.stringify(users));
            }
            
            return true;
        } catch (error) {
            console.error('Error updating user profile:', error);
            return false;
        }
    }

    handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Check if file is an image
        if (!file.type.match('image.*')) {
            this.showNotification('Пожалуйста, выберите изображение', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const avatarImage = document.getElementById('avatar-image');
            if (avatarImage) {
                avatarImage.src = event.target.result;
                
                // Save new avatar
                this.updateUserProfile({ avatar: event.target.result });
                this.showNotification('Аватар успешно обновлен!', 'success');
            }
        };
        reader.readAsDataURL(file);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.background = type === 'error' ? '#ff6b9c' : '#6c8cff';
        
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.profile-container')) {
        new ProfileManager();
    }
});