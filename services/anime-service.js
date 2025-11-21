// services/anime-service.js - Единый сервис для работы с аниме
class AnimeService {
    constructor(config = {}) {
        // Безопасная загрузка конфигурации
        const defaultConfig = {
            keys: {
                anime: 'anime_platform_anime',
                favorites: 'animeFavorites'
            }
        };
        this.config = config.storage || (window.Config?.storage || defaultConfig);
        this.storage = this._getStorage();
        this.animeList = [];
        this.favorites = new Set();
        this.loadData();
    }

    /**
     * Получение объекта хранилища
     * @private
     */
    _getStorage() {
        if (typeof Storage === 'undefined') {
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
     * Загрузка данных из хранилища
     */
    loadData() {
        try {
            // Загрузка списка аниме
            const animeData = this.storage.getItem(this.config.keys?.anime || 'anime_platform_anime');
            if (animeData) {
                this.animeList = JSON.parse(animeData);
            } else {
                this.animeList = this.getInitialAnimeData();
                this.saveAnimeList();
            }

            // Загрузка избранного
            const favoritesData = this.storage.getItem(this.config.keys?.favorites || 'animeFavorites');
            if (favoritesData) {
                const favoritesArray = JSON.parse(favoritesData);
                this.favorites = new Set(favoritesArray);
            }

            // Синхронизация: объединяем данные из всех источников
            const allAnime = [...this.animeList];
            
            // Добавляем из database.js
            if (window.database && window.database.animeList) {
                window.database.animeList.forEach(anime => {
                    if (!allAnime.find(a => a.id === anime.id)) {
                        allAnime.push(anime);
                    }
                });
            }
            
            // Добавляем из anime-data.js
            if (window.animeData && window.animeData.animeList) {
                window.animeData.animeList.forEach(anime => {
                    if (!allAnime.find(a => a.id === anime.id)) {
                        allAnime.push(anime);
                    }
                });
            }
            
            // Если нашли новые данные, сохраняем объединенный список
            if (allAnime.length > this.animeList.length) {
                this.animeList = allAnime;
                this.saveAnimeList();
            }
            
            // Обновление обратной совместимости после загрузки
            this._updateCompatibility();
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AnimeService.loadData');
            }
            this.animeList = this.getInitialAnimeData();
        }
    }

    /**
     * Сохранение списка аниме
     */
    saveAnimeList() {
        try {
            this.storage.setItem(
                this.config.keys?.anime || 'anime_platform_anime',
                JSON.stringify(this.animeList)
            );
            
            // Синхронизация с database.js если он существует
            if (window.database) {
                window.database.animeList = this.animeList;
                if (window.database.saveAnime) {
                    window.database.saveAnime();
                }
            }
            
            // Синхронизация с anime-data.js если он существует
            // Не пытаемся установить animeList напрямую, так как это getter
            if (window.animeData && window.animeData.saveAnimeData) {
                // Обновляем через метод сохранения, который обновит внутреннее состояние
                window.animeData.saveAnimeData();
            }
            
            // Обновление обратной совместимости
            this._updateCompatibility();
            
            return true;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AnimeService.saveAnimeList');
            }
            return false;
        }
    }
    
    /**
     * Обновление обратной совместимости
     * @private
     */
    _updateCompatibility() {
        if (window.animeData && typeof window.animeData === 'object') {
            // Обновляем animeList для обратной совместимости
            Object.defineProperty(window.animeData, 'animeList', {
                get: () => this.animeList,
                enumerable: true,
                configurable: true
            });
        }
    }

    /**
     * Получение аниме по ID
     * @param {number|string} id - ID аниме
     * @returns {Object|null} Объект аниме или null
     */
    getAnimeById(id) {
        return this.animeList.find(anime => anime.id === parseInt(id)) || null;
    }

    /**
     * Получение всех аниме
     * @returns {Array} Массив всех аниме
     */
    getAllAnime() {
        return [...this.animeList];
    }

    /**
     * Поиск аниме
     * @param {string} query - Поисковый запрос
     * @param {Object} filters - Фильтры поиска
     * @returns {Array} Массив найденных аниме
     */
    searchAnime(query = '', filters = {}) {
        let results = this.animeList.filter(anime => {
            // Поиск по тексту
            const matchesSearch = !query || 
                anime.title.toLowerCase().includes(query.toLowerCase()) ||
                anime.originalTitle?.toLowerCase().includes(query.toLowerCase()) ||
                anime.description?.toLowerCase().includes(query.toLowerCase());
            
            // Фильтры
            const matchesGenre = !filters.genre || anime.genre === filters.genre;
            const matchesYear = !filters.year || anime.year.toString() === filters.year;
            const matchesRating = !filters.rating || anime.rating >= parseFloat(filters.rating);
            const matchesType = !filters.type || anime.type === filters.type;
            const matchesStatus = !filters.status || anime.status === filters.status;
            
            return matchesSearch && matchesGenre && matchesYear && matchesRating && 
                   matchesType && matchesStatus;
        });

        // Сортировка
        if (filters.sort) {
            results.sort((a, b) => {
                switch (filters.sort) {
                    case 'rating':
                        return b.rating - a.rating;
                    case 'year':
                        return b.year - a.year;
                    case 'popularity':
                        return (b.popularity || 0) - (a.popularity || 0);
                    case 'title':
                        return a.title.localeCompare(b.title);
                    case 'episodes':
                        return b.episodes - a.episodes;
                    default:
                        return 0;
                }
            });
        }

        return results;
    }

    /**
     * Получение популярных аниме
     * @param {number} limit - Количество аниме
     * @returns {Array} Массив популярных аниме
     */
    getPopularAnime(limit = 6) {
        return this.animeList
            .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
            .slice(0, limit);
    }

    /**
     * Получение новых аниме
     * @param {number} limit - Количество аниме
     * @returns {Array} Массив новых аниме
     */
    getNewAnime(limit = 6) {
        return this.animeList
            .sort((a, b) => b.year - a.year)
            .slice(0, limit);
    }

    /**
     * Добавление аниме
     * @param {Object} animeData - Данные аниме
     * @returns {Object} Созданное аниме
     */
    addAnime(animeData) {
        try {
            // Проверка уникальности
            const existing = this.animeList.find(a => 
                a.title.toLowerCase() === animeData.title.toLowerCase()
            );
            
            if (existing) {
                throw new Error('Аниме с таким названием уже существует');
            }

            const newAnime = {
                id: Date.now(),
                ...animeData,
                episodesList: this.generateEpisodes(
                    animeData.episodes || 12,
                    animeData.title
                ),
                votes: animeData.votes || 0,
                popularity: animeData.popularity || 50,
                createdAt: new Date().toISOString()
            };

            this.animeList.push(newAnime);
            this.saveAnimeList();
            
            return newAnime;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AnimeService.addAnime');
            }
            throw error;
        }
    }

    /**
     * Обновление аниме
     * @param {number} animeId - ID аниме
     * @param {Object} updates - Обновления
     * @returns {Object|null} Обновленное аниме или null
     */
    updateAnime(animeId, updates) {
        try {
            const index = this.animeList.findIndex(a => a.id === parseInt(animeId));
            if (index === -1) {
                throw new Error('Аниме не найдено');
            }

            // Проверка уникальности названия
            if (updates.title) {
                const existing = this.animeList.find(a => 
                    a.title.toLowerCase() === updates.title.toLowerCase() && 
                    a.id !== parseInt(animeId)
                );
                
                if (existing) {
                    throw new Error('Аниме с таким названием уже существует');
                }
            }

            this.animeList[index] = {
                ...this.animeList[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            this.saveAnimeList();
            return this.animeList[index];
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AnimeService.updateAnime');
            }
            throw error;
        }
    }

    /**
     * Удаление аниме
     * @param {number} animeId - ID аниме
     * @returns {boolean} true если удалено успешно
     */
    deleteAnime(animeId) {
        try {
            const index = this.animeList.findIndex(a => a.id === parseInt(animeId));
            if (index === -1) {
                throw new Error('Аниме не найдено');
            }

            this.animeList.splice(index, 1);
            this.saveAnimeList();
            return true;
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AnimeService.deleteAnime');
            }
            throw error;
        }
    }

    /**
     * Генерация списка эпизодов
     * @param {number} count - Количество эпизодов
     * @param {string} title - Название аниме
     * @returns {Array} Массив эпизодов
     */
    generateEpisodes(count, title) {
        const episodes = [];
        for (let i = 1; i <= count; i++) {
            episodes.push({
                number: i,
                title: `${title} - Эпизод ${i}`,
                duration: "24:00",
                thumbnail: `https://via.placeholder.com/300x169/333/fff?text=Эпизод+${i}`,
                description: `Эпизод ${i} аниме "${title}". Захватывающее продолжение истории.`,
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
            });
        }
        return episodes;
    }

    /**
     * Работа с избранным
     */
    toggleFavorite(animeId) {
        if (this.favorites.has(animeId)) {
            this.favorites.delete(animeId);
        } else {
            this.favorites.add(animeId);
        }
        this.saveFavorites();
        return this.isFavorite(animeId);
    }

    isFavorite(animeId) {
        return this.favorites.has(animeId);
    }

    getFavorites() {
        return this.animeList.filter(anime => this.favorites.has(anime.id));
    }

    saveFavorites() {
        try {
            this.storage.setItem(
                this.config.keys?.favorites || 'animeFavorites',
                JSON.stringify([...this.favorites])
            );
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'AnimeService.saveFavorites');
            }
        }
    }

    /**
     * Начальные данные аниме (пустой массив - админ добавляет через админ панель)
     */
    getInitialAnimeData() {
        return [];
    }
}

// Создаем глобальный экземпляр
const animeService = new AnimeService();

// Экспорт для обратной совместимости
if (typeof window !== 'undefined') {
    window.animeService = animeService;
    
    // Обратная совместимость с animeData
    if (!window.animeData) {
        // Используем геттер для динамического доступа к animeList
        Object.defineProperty(window, 'animeData', {
            value: {
                get animeList() {
                    return animeService.animeList;
                },
                getAnimeById: (id) => animeService.getAnimeById(id),
                searchAnime: (query, filters) => animeService.searchAnime(query, filters),
                toggleFavorite: (id) => animeService.toggleFavorite(id),
                isFavorite: (id) => animeService.isFavorite(id),
                getFavorites: () => animeService.getFavorites(),
                addAnime: (anime) => {
                    const result = animeService.addAnime(anime);
                    animeService._updateCompatibility();
                    return result;
                },
                updateAnime: (anime) => {
                    const result = animeService.updateAnime(anime.id, anime);
                    animeService._updateCompatibility();
                    return result;
                },
                deleteAnime: (id) => {
                    const result = animeService.deleteAnime(id);
                    animeService._updateCompatibility();
                    return result;
                },
                saveAnimeData: () => animeService.saveAnimeList()
            },
            writable: false,
            configurable: true
        });
    } else {
        // Если animeData уже существует, обновляем его методы
        const originalAnimeData = window.animeData;
        window.animeData.getAnimeById = (id) => animeService.getAnimeById(id);
        window.animeData.searchAnime = (query, filters) => animeService.searchAnime(query, filters);
        window.animeData.toggleFavorite = (id) => animeService.toggleFavorite(id);
        window.animeData.isFavorite = (id) => animeService.isFavorite(id);
        window.animeData.getFavorites = () => animeService.getFavorites();
        window.animeData.addAnime = (anime) => {
            const result = animeService.addAnime(anime);
            animeService._updateCompatibility();
            return result;
        };
        window.animeData.updateAnime = (anime) => {
            const result = animeService.updateAnime(anime.id, anime);
            animeService._updateCompatibility();
            return result;
        };
        window.animeData.deleteAnime = (id) => {
            const result = animeService.deleteAnime(id);
            animeService._updateCompatibility();
            return result;
        };
        
        // Обновляем animeList для динамического доступа
        Object.defineProperty(window.animeData, 'animeList', {
            get: () => animeService.animeList,
            enumerable: true,
            configurable: true
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimeService;
}

