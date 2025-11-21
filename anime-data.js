// Anime data and management
class AnimeData {
    constructor() {
        this.animeList = this.loadAnimeData();
        this.favorites = JSON.parse(localStorage.getItem('animeFavorites')) || [];
    }

    loadAnimeData() {
        // Используем единый ключ для всех устройств
        const storageKey = 'anime_platform_anime';
        
        // Пытаемся загрузить из основного ключа
        let savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                return JSON.parse(savedData);
            } catch (e) {
                console.error('Ошибка парсинга данных из', storageKey, e);
            }
        }
        
        // Миграция: если есть старые данные в 'animeData', переносим их
        const oldData = localStorage.getItem('animeData');
        if (oldData) {
            try {
                const parsed = JSON.parse(oldData);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Сохраняем в новый ключ
                    localStorage.setItem(storageKey, oldData);
                    // Удаляем старый ключ
                    localStorage.removeItem('animeData');
                    console.log('Данные мигрированы из animeData в anime_platform_anime');
                    return parsed;
                }
            } catch (e) {
                console.error('Ошибка миграции данных', e);
            }
        }
        
        return this.getInitialAnimeData();
    }

    getInitialAnimeData() {
        // Пустой массив - админ добавляет аниме через админ панель
        return [];
    }

    generateEpisodes(count, title) {
        const episodes = [];
        for (let i = 1; i <= count; i++) {
            episodes.push({
                number: i,
                title: `${title} - Эпизод ${i}`,
                duration: "24:00",
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
                thumbnail: `https://via.placeholder.com/300x169/333/fff?text=Эпизод+${i}`
            });
        }
        return episodes;
    }

    getAnimeById(id) {
        return this.animeList.find(anime => anime.id === parseInt(id));
    }

    searchAnime(query, filters = {}) {
        let results = this.animeList.filter(anime => {
            const matchesSearch = anime.title.toLowerCase().includes(query.toLowerCase()) ||
                                anime.description.toLowerCase().includes(query.toLowerCase());
            
            const matchesGenre = !filters.genre || anime.genre === filters.genre;
            const matchesYear = !filters.year || anime.year.toString() === filters.year;
            const matchesRating = !filters.rating || anime.rating >= parseFloat(filters.rating);
            
            return matchesSearch && matchesGenre && matchesYear && matchesRating;
        });

        // Sort results
        if (filters.sort) {
            results.sort((a, b) => {
                switch (filters.sort) {
                    case 'rating':
                        return b.rating - a.rating;
                    case 'year':
                        return b.year - a.year;
                    case 'title':
                        return a.title.localeCompare(b.title);
                    default:
                        return 0;
                }
            });
        }

        return results;
    }

    toggleFavorite(animeId) {
        const index = this.favorites.indexOf(animeId);
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(animeId);
        }
        localStorage.setItem('animeFavorites', JSON.stringify(this.favorites));
        return !this.isFavorite(animeId);
    }

    isFavorite(animeId) {
        return this.favorites.includes(animeId);
    }

    getFavorites() {
        return this.animeList.filter(anime => this.favorites.includes(anime.id));
    }

    saveAnimeData() {
        // Используем единый ключ для всех устройств
        const storageKey = 'anime_platform_anime';
        localStorage.setItem(storageKey, JSON.stringify(this.animeList));
        
        // Синхронизация с database.js если он существует
        if (window.database && window.database.animeList) {
            window.database.animeList = this.animeList;
            if (window.database.saveAnime) {
                window.database.saveAnime();
            }
        }
        
        // Синхронизация с animeService если он существует
        if (window.animeService && window.animeService.animeList) {
            window.animeService.animeList = this.animeList;
            if (window.animeService.saveAnimeList) {
                window.animeService.saveAnimeList();
            }
        }
    }

    addAnime(anime) {
        anime.id = Date.now();
        anime.episodesList = this.generateEpisodes(anime.episodes, anime.title);
        this.animeList.push(anime);
        this.saveAnimeData();
        return anime;
    }

    updateAnime(updatedAnime) {
        const index = this.animeList.findIndex(a => a.id === updatedAnime.id);
        if (index !== -1) {
            this.animeList[index] = updatedAnime;
            this.saveAnimeData();
            return true;
        }
        return false;
    }

    deleteAnime(animeId) {
        const index = this.animeList.findIndex(a => a.id === animeId);
        if (index !== -1) {
            this.animeList.splice(index, 1);
            this.saveAnimeData();
            return true;
        }
        return false;
    }
}

// Create global instance
window.animeData = new AnimeData();