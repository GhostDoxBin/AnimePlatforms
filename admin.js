// Admin panel functionality
class AdminPanel {
    constructor() {
        // Используем authService если доступен
        if (window.authService) {
            this.currentUser = window.authService.getCurrentUser();
        } else {
            this.currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        }
        
        // Используем animeService если доступен
        this.animeService = window.animeService || null;
        this.animeData = window.animeData || null;
        
        this.users = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
        
        this.init();
    }

    init() {
        if (!this.checkAdminAccess()) {
            window.location.href = 'index.html';
            return;
        }

        try {
            this.setupEventListeners();
            this.loadAnimeList();
            this.loadUsersList();
            this.updateAdminInfo();
            // Update statistics when switching tabs
            this.setupTabSwitching();
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AdminPanel.init');
            }
        }
    }
    
    setupTabSwitching() {
        // Update statistics when stats tab is opened
        const statsTab = document.getElementById('stats-tab');
        if (statsTab) {
            statsTab.addEventListener('click', () => {
                setTimeout(() => this.updateStatistics(), 100);
            });
        }
    }

    checkAdminAccess() {
        if (!this.currentUser) {
            if (window.Helpers && window.Helpers.showNotification) {
                window.Helpers.showNotification('Доступ запрещен. Пожалуйста, войдите в систему.', 'error');
            } else {
                alert('Доступ запрещен. Пожалуйста, войдите в систему.');
            }
            return false;
        }

        // Используем authService для проверки прав
        if (window.authService) {
            if (!window.authService.isAdmin(1)) {
                if (window.Helpers && window.Helpers.showNotification) {
                    window.Helpers.showNotification('У вас недостаточно прав для доступа к админ-панели.', 'error');
                } else {
                    alert('У вас недостаточно прав для доступа к админ-панели.');
                }
                return false;
            }
        } else {
            if (!this.currentUser.isAdmin || this.currentUser.adminLevel < 1) {
                if (window.Helpers && window.Helpers.showNotification) {
                    window.Helpers.showNotification('У вас недостаточно прав для доступа к админ-панели.', 'error');
                } else {
                    alert('У вас недостаточно прав для доступа к админ-панели.');
                }
                return false;
            }
        }

        return true;
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.getAttribute('data-tab'));
            });
        });

        // Anime management
        const addAnimeBtn = document.getElementById('add-anime-btn');
        if (addAnimeBtn) {
            addAnimeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showAnimeForm();
            });
        }

        const saveAnimeBtn = document.getElementById('save-anime-btn');
        if (saveAnimeBtn) {
            saveAnimeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.saveAnime();
            });
        }

        const cancelAnimeBtn = document.getElementById('cancel-anime-btn');
        const closeAnimeFormBtn = document.getElementById('close-anime-form-btn');
        
        if (cancelAnimeBtn) {
            cancelAnimeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideAnimeForm();
            });
        }
        
        if (closeAnimeFormBtn) {
            closeAnimeFormBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.hideAnimeForm();
            });
        }
        
        // Закрытие модального окна при клике вне его
        const animeForm = document.getElementById('anime-form');
        if (animeForm) {
            animeForm.addEventListener('click', (e) => {
                if (e.target === animeForm) {
                    this.hideAnimeForm();
                }
            });
        }
        
        // Auto-generate episodes when episodes count changes (only for new anime)
        const episodesInput = document.getElementById('anime-episodes');
        if (episodesInput) {
            episodesInput.addEventListener('change', (e) => {
                const animeIdInput = document.getElementById('anime-id');
                const isNewAnime = !animeIdInput || !animeIdInput.value || animeIdInput.value === '';
                if (isNewAnime) {
                    const episodesCount = parseInt(e.target.value) || 12;
                    const titleInput = document.getElementById('anime-title');
                    const title = titleInput ? titleInput.value || 'Новое аниме' : 'Новое аниме';
                    this.generateEpisodesFields(episodesCount, title);
                }
            });
        }
        
        // Auto-generate episodes when title changes (only for new anime)
        const titleInput = document.getElementById('anime-title');
        if (titleInput) {
            titleInput.addEventListener('blur', (e) => {
                const animeIdInput = document.getElementById('anime-id');
                const isNewAnime = !animeIdInput || !animeIdInput.value || animeIdInput.value === '';
                if (isNewAnime && e.target.value) {
                    const episodesCount = parseInt(document.getElementById('anime-episodes').value) || 12;
                    this.generateEpisodesFields(episodesCount, e.target.value);
                }
            });
        }

        // User management
        document.getElementById('search-users').addEventListener('input', (e) => {
            this.searchUsers(e.target.value);
        });

        // Export/Import data
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        const importBtn = document.getElementById('import-data-btn');
        const importInput = document.getElementById('import-file-input');
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => importInput.click());
            importInput.addEventListener('change', (e) => this.importData(e));
        }

    }

    switchTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Deactivate all tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        // Activate selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.getElementById(`${tabName}-content`).classList.add('active');
    }

    loadAnimeList() {
        const animeList = document.getElementById('anime-list');
        if (!animeList) return;
        
        animeList.innerHTML = '';

        // Получаем список аниме из сервиса
        let animeListData = [];
        if (this.animeService) {
            animeListData = this.animeService.getAllAnime();
        } else if (this.animeData && this.animeData.animeList) {
            const list = this.animeData.animeList;
            animeListData = Array.isArray(list) ? list : [];
        }

        if (animeListData.length === 0) {
            animeList.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 15px;">📭</div>
                        <h3 style="margin-bottom: 10px; color: var(--text-primary);">Каталог пуст</h3>
                        <p>Добавьте первое аниме, нажав кнопку "Добавить аниме"</p>
                    </td>
                </tr>
            `;
            return;
        }

        animeListData.forEach(anime => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${anime.id}</td>
                <td>${anime.title || 'Без названия'}</td>
                <td>${anime.rating || 0}</td>
                <td>${anime.year || 'Не указан'}</td>
                <td>${anime.genre || 'Не указан'}</td>
                <td>${anime.status || 'Не указан'}</td>
                <td>
                    <button class="btn-edit" data-id="${anime.id}" title="Редактировать">✏️</button>
                    <button class="btn-delete" data-id="${anime.id}" title="Удалить">🗑️</button>
                </td>
            `;

            // Add event listeners
            const editBtn = row.querySelector('.btn-edit');
            const deleteBtn = row.querySelector('.btn-delete');
            
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.editAnime(parseInt(anime.id));
                });
            }

            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.deleteAnime(parseInt(anime.id));
                });
            }

            animeList.appendChild(row);
        });
    }

    showAnimeForm(animeId = null) {
        const form = document.getElementById('anime-form');
        if (!form) {
            console.error('Anime form not found');
            return;
        }
        form.classList.add('active');

        if (animeId) {
            // Edit mode - используем animeService если доступен
            let anime = null;
            if (this.animeService) {
                anime = this.animeService.getAnimeById(parseInt(animeId));
            } else if (this.animeData && this.animeData.getAnimeById) {
                anime = this.animeData.getAnimeById(parseInt(animeId));
            }
            
            if (!anime) {
                this.showNotification('Аниме не найдено', 'error');
                return;
            }
            document.getElementById('anime-id').value = anime.id;
            document.getElementById('anime-title').value = anime.title;
            document.getElementById('anime-rating').value = anime.rating;
            document.getElementById('anime-year').value = anime.year;
            document.getElementById('anime-episodes').value = anime.episodes;
            document.getElementById('anime-genre').value = anime.genre;
            document.getElementById('anime-status').value = anime.status;
            document.getElementById('anime-studio').value = anime.studio;
            document.getElementById('anime-description').value = anime.description;
            document.getElementById('anime-poster').value = anime.poster;
            document.getElementById('anime-video').value = anime.videoUrl;

            // Загрузка эпизодов
            this.loadEpisodesForEdit(anime);

            document.getElementById('form-title').textContent = 'Редактировать аниме';
        } else {
            // Add mode - сбрасываем форму и готовим к добавлению
            const form = document.getElementById('anime-form-data');
            if (form) {
                form.reset();
            }
            document.getElementById('anime-id').value = '';
            
            // Генерируем эпизоды на основе количества
            const episodesInput = document.getElementById('anime-episodes');
            const titleInput = document.getElementById('anime-title');
            const episodesCount = episodesInput ? parseInt(episodesInput.value) || 12 : 12;
            const title = titleInput ? titleInput.value || 'Новое аниме' : 'Новое аниме';
            
            // Генерируем поля для эпизодов
            this.generateEpisodesFields(episodesCount, title);

            document.getElementById('form-title').textContent = 'Добавить аниме';
        }
    }

    loadEpisodesForEdit(anime) {
        const episodesContainer = document.getElementById('episodes-container');
        if (!episodesContainer) return;
        
        const episodes = anime.episodesList || this.generateEpisodes(anime.episodes || 12, anime.title);
        
        // Используем общий метод для генерации полей
        this.generateEpisodesFields(episodes.length, anime.title, episodes);
    }

    addNewEpisode() {
        const episodesContainer = document.getElementById('episodes-container');
        const currentEpisodes = document.querySelectorAll('.episode-edit');
        const newEpisodeNumber = currentEpisodes.length + 1;
        
        const episodeDiv = document.createElement('div');
        episodeDiv.className = 'episode-edit';
        episodeDiv.innerHTML = `
            <div class="episode-header">
                <strong>Эпизод ${newEpisodeNumber}</strong>
                <button type="button" class="btn-remove-episode" data-index="${newEpisodeNumber - 1}">🗑️</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Название эпизода</label>
                    <input type="text" class="form-input episode-title" 
                           value="Новый эпизод ${newEpisodeNumber}" data-index="${newEpisodeNumber - 1}">
                </div>
                <div class="form-group">
                    <label>Длительность</label>
                    <input type="text" class="form-input episode-duration" value="24:00" 
                           data-index="${newEpisodeNumber - 1}">
                </div>
            </div>
            <div class="form-group">
                <label>Ссылка на видео</label>
                <input type="url" class="form-input episode-video" 
                       data-index="${newEpisodeNumber - 1}" placeholder="https://example.com/video.mp4">
            </div>
            <div class="form-group">
                <label>Превью (URL)</label>
                <input type="url" class="form-input episode-thumbnail" 
                       value="https://via.placeholder.com/300x169/333/fff?text=Эпизод+${newEpisodeNumber}" 
                       data-index="${newEpisodeNumber - 1}">
            </div>
        `;
        
        // Вставляем перед кнопкой добавления
        const addBtn = episodesContainer.querySelector('.btn');
        episodesContainer.insertBefore(episodeDiv, addBtn);

        // Добавляем обработчик удаления
        episodeDiv.querySelector('.btn-remove-episode').addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            this.removeEpisode(index);
        });
    }

    removeEpisode(index) {
        if (confirm('Вы уверены, что хотите удалить этот эпизод?')) {
            const episodeDiv = document.querySelector(`.episode-edit .btn-remove-episode[data-index="${index}"]`)?.closest('.episode-edit');
            if (episodeDiv) {
                episodeDiv.remove();
                // Перенумеровываем оставшиеся эпизоды
                this.renumberEpisodes();
            }
        }
    }

    renumberEpisodes() {
        const episodes = document.querySelectorAll('.episode-edit');
        episodes.forEach((episodeDiv, index) => {
            const episodeNumber = index + 1;
            episodeDiv.querySelector('.episode-header strong').textContent = `Эпизод ${episodeNumber}`;
            
            // Обновляем data-index атрибуты
            const inputs = episodeDiv.querySelectorAll('input[data-index]');
            inputs.forEach(input => {
                input.setAttribute('data-index', index);
            });
            
            const removeBtn = episodeDiv.querySelector('.btn-remove-episode');
            removeBtn.setAttribute('data-index', index);
        });
    }

    saveAnime() {
        try {
            const animeIdInput = document.getElementById('anime-id');
            const existingId = animeIdInput ? animeIdInput.value : '';
            const isNewAnime = !existingId || existingId === '';
            
            const formData = {
                title: document.getElementById('anime-title').value.trim(),
                rating: parseFloat(document.getElementById('anime-rating').value),
                year: parseInt(document.getElementById('anime-year').value),
                episodes: parseInt(document.getElementById('anime-episodes').value),
                genre: document.getElementById('anime-genre').value,
                status: document.getElementById('anime-status').value,
                studio: document.getElementById('anime-studio').value.trim() || '',
                description: document.getElementById('anime-description').value.trim() || '',
                poster: document.getElementById('anime-poster').value.trim() || '',
                videoUrl: document.getElementById('anime-video').value.trim() || '',
                episodesList: this.collectEpisodesData(),
                type: 'TV',
                duration: '24 мин',
                popularity: 50,
                votes: 0
            };

            // Validation
            if (!this.validateAnimeForm(formData)) {
                return;
            }

            let savedAnime = null;

            // Используем animeService если доступен
            if (this.animeService) {
                if (isNewAnime) {
                    // Add new anime
                    savedAnime = this.animeService.addAnime(formData);
                } else {
                    // Update existing anime
                    formData.id = parseInt(existingId);
                    savedAnime = this.animeService.updateAnime(parseInt(existingId), formData);
                }
            } else if (this.animeData) {
                // Fallback на старую реализацию
                if (isNewAnime) {
                    if (this.animeData.addAnime) {
                        savedAnime = this.animeData.addAnime(formData);
                    } else {
                        formData.id = Date.now();
                        this.animeData.animeList.push(formData);
                        if (this.animeData.saveAnimeData) {
                            this.animeData.saveAnimeData();
                        }
                        savedAnime = formData;
                    }
                } else {
                    formData.id = parseInt(existingId);
                    if (this.animeData.updateAnime) {
                        savedAnime = this.animeData.updateAnime(formData);
                    } else {
                        const index = this.animeData.animeList.findIndex(a => a.id == formData.id);
                        if (index !== -1) {
                            this.animeData.animeList[index] = { ...this.animeData.animeList[index], ...formData };
                            if (this.animeData.saveAnimeData) {
                                this.animeData.saveAnimeData();
                            }
                            savedAnime = this.animeData.animeList[index];
                        } else {
                            throw new Error('Аниме не найдено для обновления');
                        }
                    }
                }
            }

            // Синхронизация со всеми источниками для обеспечения доступности на всех устройствах
            if (window.database && window.database.animeList) {
                if (isNewAnime) {
                    const exists = window.database.animeList.findIndex(a => a.id == savedAnime.id) !== -1;
                    if (!exists) {
                        window.database.animeList.push(savedAnime);
                    }
                } else {
                    const index = window.database.animeList.findIndex(a => a.id == savedAnime.id);
                    if (index !== -1) {
                        window.database.animeList[index] = savedAnime;
                    } else {
                        window.database.animeList.push(savedAnime);
                    }
                }
                if (window.database.saveAnime) {
                    window.database.saveAnime();
                }
            }
            
            // Синхронизация с animeData
            if (window.animeData && window.animeData.animeList) {
                if (isNewAnime) {
                    const exists = window.animeData.animeList.findIndex(a => a.id == savedAnime.id) !== -1;
                    if (!exists) {
                        window.animeData.animeList.push(savedAnime);
                    }
                } else {
                    const index = window.animeData.animeList.findIndex(a => a.id == savedAnime.id);
                    if (index !== -1) {
                        window.animeData.animeList[index] = savedAnime;
                    } else {
                        window.animeData.animeList.push(savedAnime);
                    }
                }
                if (window.animeData.saveAnimeData) {
                    window.animeData.saveAnimeData();
                }
            }

            this.hideAnimeForm();
            this.loadAnimeList();
            this.showNotification('Аниме успешно сохранено!');
        } catch (error) {
            console.error('Error saving anime:', error);
            this.showNotification(error.message || 'Ошибка при сохранении аниме', 'error');
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AdminPanel.saveAnime');
            }
        }
    }

    collectEpisodesData() {
        const episodes = [];
        const episodeElements = document.querySelectorAll('.episode-edit');
        
        episodeElements.forEach((episodeDiv, index) => {
            const episodeNumber = index + 1;
            const titleInput = episodeDiv.querySelector('.episode-title');
            const durationInput = episodeDiv.querySelector('.episode-duration');
            const videoInput = episodeDiv.querySelector('.episode-video');
            const thumbnailInput = episodeDiv.querySelector('.episode-thumbnail');
            
            episodes.push({
                number: episodeNumber,
                title: titleInput ? titleInput.value : `Эпизод ${episodeNumber}`,
                duration: durationInput ? durationInput.value : '24:00',
                videoUrl: videoInput ? videoInput.value : '',
                thumbnail: thumbnailInput ? thumbnailInput.value : `https://via.placeholder.com/300x169/333/fff?text=Эпизод+${episodeNumber}`
            });
        });
        
        return episodes;
    }

    validateAnimeForm(data) {
        if (!data.title || !data.rating || !data.year) {
            this.showNotification('Пожалуйста, заполните все обязательные поля', 'error');
            return false;
        }

        if (data.rating < 0 || data.rating > 10) {
            this.showNotification('Рейтинг должен быть от 0 до 10', 'error');
            return false;
        }

        return true;
    }

    editAnime(animeId) {
        if (this.currentUser && this.currentUser.adminLevel < 2) {
            this.showNotification('Недостаточно прав для редактирования аниме', 'error');
            return;
        }
        
        const id = parseInt(animeId);
        if (isNaN(id)) {
            this.showNotification('Неверный ID аниме', 'error');
            return;
        }
        
        this.showAnimeForm(id);
    }

    deleteAnime(animeId) {
        // Проверка прав
        const minLevel = 3;
        if (window.authService) {
            if (!window.authService.isAdmin(minLevel)) {
                this.showNotification('Недостаточно прав для удаления аниме', 'error');
                return;
            }
        } else if (this.currentUser && this.currentUser.adminLevel < minLevel) {
            this.showNotification('Недостаточно прав для удаления аниме', 'error');
            return;
        }

        if (confirm('Вы уверены, что хотите удалить это аниме?')) {
            try {
                const id = parseInt(animeId);
                let deleted = false;
                let foundInAnySource = false;

                // Функция для сравнения ID (поддерживает строки и числа)
                const compareId = (animeObj, targetId) => {
                    if (!animeObj) return false;
                    const animeId = typeof animeObj === 'object' && animeObj !== null 
                        ? (parseInt(animeObj.id) || animeObj.id) 
                        : parseInt(animeObj);
                    const target = parseInt(targetId);
                    return animeId === target || String(animeId) === String(target);
                };

                // Пытаемся удалить из animeService
                if (this.animeService && this.animeService.animeList) {
                    const index = this.animeService.animeList.findIndex(a => compareId(a, id));
                    if (index !== -1) {
                        this.animeService.animeList.splice(index, 1);
                        if (this.animeService.saveAnimeList) {
                            this.animeService.saveAnimeList();
                        }
                        deleted = true;
                        foundInAnySource = true;
                    }
                }

                // Пытаемся удалить из animeData
                if (this.animeData && this.animeData.animeList) {
                    const index = this.animeData.animeList.findIndex(a => compareId(a, id));
                    if (index !== -1) {
                        this.animeData.animeList.splice(index, 1);
                        if (this.animeData.saveAnimeData) {
                            this.animeData.saveAnimeData();
                        }
                        deleted = true;
                        foundInAnySource = true;
                    }
                }

                // Синхронизация с database.js
                if (window.database && window.database.animeList) {
                    const index = window.database.animeList.findIndex(a => compareId(a, id));
                    if (index !== -1) {
                        window.database.animeList.splice(index, 1);
                        if (window.database.saveAnime) {
                            window.database.saveAnime();
                        }
                        deleted = true;
                        foundInAnySource = true;
                    }
                }

                // Также проверяем через методы deleteAnime если они доступны
                if (!foundInAnySource) {
                    // Пытаемся через animeService.deleteAnime
                    if (this.animeService && typeof this.animeService.deleteAnime === 'function') {
                        try {
                            deleted = this.animeService.deleteAnime(id);
                            foundInAnySource = deleted;
                        } catch (e) {
                            // Игнорируем ошибку, пробуем другие источники
                        }
                    }
                    
                    // Пытаемся через animeData.deleteAnime
                    if (!foundInAnySource && this.animeData && typeof this.animeData.deleteAnime === 'function') {
                        try {
                            deleted = this.animeData.deleteAnime(id);
                            foundInAnySource = deleted;
                        } catch (e) {
                            // Игнорируем ошибку
                        }
                    }
                    
                    // Пытаемся через database.deleteAnime
                    if (!foundInAnySource && window.database && typeof window.database.deleteAnime === 'function') {
                        try {
                            deleted = window.database.deleteAnime(id);
                            foundInAnySource = deleted;
                        } catch (e) {
                            // Игнорируем ошибку
                        }
                    }
                }

                if (deleted || foundInAnySource) {
                    this.loadAnimeList();
                    this.showNotification('Аниме успешно удалено!');
                } else {
                    this.showNotification('Аниме не найдено', 'error');
                }
            } catch (error) {
                console.error('Error deleting anime:', error);
                this.showNotification(error.message || 'Ошибка при удалении аниме', 'error');
                if (window.errorHandler) {
                    window.errorHandler.handle(error, 'AdminPanel.deleteAnime');
                }
            }
        }
    }

    generateEpisodes(count, title) {
        const episodes = [];
        for (let i = 1; i <= count; i++) {
            episodes.push({
                number: i,
                title: `${title} - Эпизод ${i}`,
                duration: "24:00",
                thumbnail: `https://via.placeholder.com/300x169/333/fff?text=Эпизод+${i}`,
                videoUrl: ""
            });
        }
        return episodes;
    }
    
    generateEpisodesFields(count, title, existingEpisodes = null) {
        const episodesContainer = document.getElementById('episodes-container');
        if (!episodesContainer) return;
        
        const episodes = existingEpisodes || this.generateEpisodes(count, title);
        episodesContainer.innerHTML = '<h4 style="margin-bottom: 20px; color: var(--text-primary);">Управление эпизодами</h4>';
        
        episodes.forEach((episode, index) => {
            const episodeDiv = document.createElement('div');
            episodeDiv.className = 'episode-edit';
            episodeDiv.innerHTML = `
                <div class="episode-header">
                    <strong>Эпизод ${episode.number || (index + 1)}</strong>
                    <button type="button" class="btn-remove-episode" data-index="${index}">🗑️</button>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Название эпизода</label>
                        <input type="text" class="form-input episode-title" value="${episode.title || `${title} - Эпизод ${index + 1}`}" 
                               data-index="${index}">
                    </div>
                    <div class="form-group">
                        <label>Длительность</label>
                        <input type="text" class="form-input episode-duration" value="${episode.duration || '24:00'}" 
                               data-index="${index}" placeholder="24:00">
                    </div>
                </div>
                <div class="form-group">
                    <label>Ссылка на видео</label>
                    <input type="url" class="form-input episode-video" value="${episode.videoUrl || ''}" 
                           data-index="${index}" placeholder="https://example.com/video.mp4 или YouTube ссылка">
                </div>
                <div class="form-group">
                    <label>Превью (URL)</label>
                    <input type="url" class="form-input episode-thumbnail" value="${episode.thumbnail || `https://via.placeholder.com/300x169/333/fff?text=Эпизод+${index + 1}`}" 
                           data-index="${index}">
                </div>
            `;
            episodesContainer.appendChild(episodeDiv);
        });
        
        // Кнопка добавления нового эпизода
        const addEpisodeBtn = document.createElement('button');
        addEpisodeBtn.type = 'button';
        addEpisodeBtn.className = 'btn btn-secondary';
        addEpisodeBtn.textContent = '+ Добавить эпизод';
        addEpisodeBtn.addEventListener('click', () => this.addNewEpisode());
        episodesContainer.appendChild(addEpisodeBtn);
        
        // Обработчики удаления эпизодов
        document.querySelectorAll('.btn-remove-episode').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const index = parseInt(e.target.getAttribute('data-index'));
                this.removeEpisode(index);
            });
        });
    }

    loadUsersList() {
        const usersList = document.getElementById('users-list');
        usersList.innerHTML = '';

        this.users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.isAdmin ? `Уровень ${user.adminLevel}` : 'Пользователь'}</td>
                <td>
                    ${this.currentUser.adminLevel >= 4 ? `
                    <select class="admin-level-select" data-user-id="${user.id}">
                        <option value="0" ${!user.isAdmin ? 'selected' : ''}>Пользователь</option>
                        <option value="1" ${user.adminLevel === 1 ? 'selected' : ''}>Уровень 1</option>
                        <option value="2" ${user.adminLevel === 2 ? 'selected' : ''}>Уровень 2</option>
                        <option value="3" ${user.adminLevel === 3 ? 'selected' : ''}>Уровень 3</option>
                        <option value="4" ${user.adminLevel === 4 ? 'selected' : ''}>Уровень 4</option>
                        <option value="5" ${user.adminLevel === 5 ? 'selected' : ''}>Уровень 5</option>
                    </select>
                    ` : user.isAdmin ? `Уровень ${user.adminLevel}` : 'Пользователь'}
                </td>
                <td>
                    ${this.currentUser.adminLevel >= 3 ? `
                    <button class="btn-delete-user" data-user-id="${user.id}">🗑️</button>
                    ` : ''}
                </td>
            `;

            // Add event listeners
            if (this.currentUser.adminLevel >= 4) {
                const select = row.querySelector('.admin-level-select');
                select.addEventListener('change', (e) => {
                    this.changeUserLevel(user.id, parseInt(e.target.value));
                });
            }

            if (this.currentUser.adminLevel >= 3) {
                const deleteBtn = row.querySelector('.btn-delete-user');
                deleteBtn.addEventListener('click', (e) => {
                    this.deleteUser(user.id);
                });
            }

            usersList.appendChild(row);
        });
    }

    changeUserLevel(userId, newLevel) {
        if (this.currentUser.adminLevel < 4) {
            this.showNotification('Недостаточно прав для изменения уровня администратора', 'error');
            return;
        }

        if (newLevel >= this.currentUser.adminLevel) {
            this.showNotification('Вы не можете назначить уровень администратора выше или равный вашему', 'error');
            return;
        }

        const user = this.users.find(u => u.id == userId);
        if (user) {
            user.isAdmin = newLevel > 0;
            user.adminLevel = newLevel;
            localStorage.setItem('animePlatformUsers', JSON.stringify(this.users));
            this.loadUsersList();
            this.showNotification('Уровень администратора успешно изменен!');
        }
    }

    deleteUser(userId) {
        if (this.currentUser.adminLevel < 3) {
            this.showNotification('Недостаточно прав для удаления пользователей', 'error');
            return;
        }

        if (userId === this.currentUser.id) {
            this.showNotification('Вы не можете удалить свой собственный аккаунт', 'error');
            return;
        }

        if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
            this.users = this.users.filter(u => u.id != userId);
            localStorage.setItem('animePlatformUsers', JSON.stringify(this.users));
            this.loadUsersList();
            this.showNotification('Пользователь успешно удален!');
        }
    }

    searchUsers(query) {
        const rows = document.querySelectorAll('#users-list tr');
        rows.forEach(row => {
            const username = row.cells[1].textContent.toLowerCase();
            const email = row.cells[2].textContent.toLowerCase();
            const searchTerm = query.toLowerCase();

            if (username.includes(searchTerm) || email.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }

    updateAdminInfo() {
        document.getElementById('admin-name').textContent = this.currentUser.username;
        document.getElementById('admin-level').textContent = `Уровень ${this.currentUser.adminLevel}`;
        document.getElementById('admin-email').textContent = this.currentUser.email;

        // Update permissions display
        const permissions = this.getAdminPermissions();
        document.getElementById('admin-permissions').innerHTML = permissions.map(p => `<li>${p}</li>`).join('');
        
        // Update profile controls in header
        this.updateAdminHeaderControls();
        
        // Update statistics
        this.updateStatistics();
    }
    
    updateAdminHeaderControls() {
        // Скрываем auth-buttons в админке, чтобы избежать дублирования
        const authButtons = document.querySelector('.auth-buttons');
        if (authButtons) {
            authButtons.style.display = 'none';
        }
        
        const profileControls = document.getElementById('admin-profile-controls');
        const adminAvatar = document.getElementById('admin-avatar');
        const adminUsername = document.getElementById('admin-username');
        const adminLogoutBtn = document.getElementById('admin-logout-btn');
        
        if (profileControls && this.currentUser) {
            profileControls.style.display = 'flex';
            profileControls.style.gap = '10px';
            profileControls.style.alignItems = 'center';
            
            if (adminAvatar) {
                adminAvatar.src = this.currentUser.avatar || 'https://i.pravatar.cc/150?img=1';
                adminAvatar.onerror = function() {
                    this.src = 'https://i.pravatar.cc/150?img=1';
                };
            }
            
            if (adminUsername) {
                adminUsername.textContent = this.currentUser.username || 'Профиль';
            }
            
            // Удаляем старые обработчики перед добавлением нового
            const newLogoutBtn = adminLogoutBtn.cloneNode(true);
            if (adminLogoutBtn && adminLogoutBtn.parentNode) {
                adminLogoutBtn.parentNode.replaceChild(newLogoutBtn, adminLogoutBtn);
            }
            
            if (newLogoutBtn) {
                newLogoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.authService && window.authService.logout) {
                        window.authService.logout();
                    } else if (typeof logout === 'function') {
                        logout();
                    } else {
                        localStorage.removeItem('currentUser');
                        window.location.href = 'index.html';
                    }
                });
            }
        }
    }
    
    updateStatistics() {
        // Update anime count
        let animeCount = 0;
        if (this.animeService) {
            animeCount = this.animeService.getAllAnime().length;
        } else if (this.animeData && this.animeData.animeList) {
            animeCount = this.animeData.animeList.length;
        }
        const totalAnimeEl = document.getElementById('total-anime');
        if (totalAnimeEl) {
            totalAnimeEl.textContent = animeCount;
        }
        
        // Update users count
        const totalUsersEl = document.getElementById('total-users');
        if (totalUsersEl) {
            totalUsersEl.textContent = this.users.length;
        }
        
        // Update admins count
        const totalAdminsEl = document.getElementById('total-admins');
        if (totalAdminsEl) {
            const adminsCount = this.users.filter(u => u.isAdmin && u.adminLevel >= 1).length;
            totalAdminsEl.textContent = adminsCount;
        }

        // Update average rating
        const avgRatingEl = document.getElementById('avg-rating');
        if (avgRatingEl) {
            let animeList = [];
            if (this.animeService) {
                animeList = this.animeService.getAllAnime();
            } else if (this.animeData && this.animeData.animeList) {
                animeList = this.animeData.animeList;
            }
            
            if (animeList.length > 0) {
                const avgRating = animeList.reduce((sum, a) => sum + (a.rating || 0), 0) / animeList.length;
                avgRatingEl.textContent = avgRating.toFixed(1);
            } else {
                avgRatingEl.textContent = '0.0';
            }
        }
    }

    exportData() {
        try {
            if (!window.syncService) {
                this.showNotification('Сервис синхронизации не загружен', 'error');
                return;
            }

            const result = window.syncService.exportToFile();
            
            if (result.success) {
                this.showNotification(result.message, 'success');
            } else {
                this.showNotification('Ошибка при экспорте данных: ' + (result.error || 'Неизвестная ошибка'), 'error');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showNotification('Ошибка при экспорте данных: ' + error.message, 'error');
        }
    }

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!window.syncService) {
            this.showNotification('Сервис синхронизации не загружен', 'error');
            return;
        }

        try {
            const result = await window.syncService.importFromFile(file);
            
            if (result.success) {
                // Обновляем список пользователей для отображения
                this.users = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
                
                this.loadAnimeList();
                this.loadUsersList();
                this.updateStatistics();
                
                let message = `Успешно импортировано ${result.animeCount} аниме`;
                if (result.usersCount > 0) {
                    message += ` и ${result.usersCount} пользователей`;
                }
                this.showNotification(message + '!', 'success');
            }
        } catch (error) {
            console.error('Error importing data:', error);
            this.showNotification('Ошибка при импорте данных: ' + error.message, 'error');
        }

        // Сброс input для возможности повторного выбора того же файла
        event.target.value = '';
    }

    getAdminPermissions() {
        const level = this.currentUser.adminLevel;
        const permissions = [];

        if (level >= 1) permissions.push('Просмотр админ-панели');
        if (level >= 2) permissions.push('Редактирование аниме');
        if (level >= 3) permissions.push('Удаление аниме', 'Удаление пользователей');
        if (level >= 4) permissions.push('Назначение администраторов');
        if (level >= 5) permissions.push('Полный доступ');

        return permissions;
    }

    showNotification(message, type = 'success') {
        // Используем Helpers если доступен
        if (window.Helpers && window.Helpers.showNotification) {
            window.Helpers.showNotification(message, type);
            return;
        }
        
        // Fallback реализация
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.background = type === 'error' ? '#e53e3e' : '#38a169';

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

    hideAnimeForm() {
        document.getElementById('anime-form').classList.remove('active');
    }

}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('admin-panel')) {
        window.adminPanel = new AdminPanel();
    }
});