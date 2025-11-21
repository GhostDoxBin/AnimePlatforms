// anime-manager.js - Управление аниме данными
class AnimeManager {
    constructor() {
        this.favorites = new Set();
        this.watchHistory = [];
        this.loadUserData();
    }

    // Загрузка пользовательских данных
    loadUserData() {
        // В реальном приложении здесь бы загружались данные пользователя
        // Для демонстрации используем начальные данные
        this.favorites = new Set([1, 3]); // ID избранных аниме
        this.watchHistory = [
            { animeId: 2, episode: 1, timestamp: new Date(), progress: 100 },
            { animeId: 1, episode: 1, timestamp: new Date(), progress: 75 }
        ];
    }

    // Поиск аниме
    searchAnime(query, filters = {}) {
        if (!window.database) return [];
        return window.database.searchAnime(query, filters);
    }

    // Получение аниме по ID
    getAnimeById(id) {
        if (!window.database) return null;
        return window.database.getAnimeById(id);
    }

    // Получение популярных аниме
    getPopularAnime(limit = 6) {
        if (!window.database) return [];
        return window.database.animeList
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, limit);
    }

    // Получение новых аниме
    getNewAnime(limit = 6) {
        if (!window.database) return [];
        return window.database.animeList
            .sort((a, b) => b.year - a.year)
            .slice(0, limit);
    }

    // Избранное
    toggleFavorite(animeId) {
        if (this.favorites.has(animeId)) {
            this.favorites.delete(animeId);
            return false;
        } else {
            this.favorites.add(animeId);
            return true;
        }
    }

    isFavorite(animeId) {
        return this.favorites.has(animeId);
    }

    getFavorites() {
        if (!window.database) return [];
        return window.database.animeList.filter(anime => 
            this.favorites.has(anime.id)
        );
    }

    // История просмотров
    addToHistory(animeId, episode = 1, progress = 0) {
        const existing = this.watchHistory.find(item => 
            item.animeId === animeId && item.episode === episode
        );

        if (existing) {
            existing.timestamp = new Date();
            existing.progress = progress;
        } else {
            this.watchHistory.unshift({
                animeId,
                episode,
                timestamp: new Date(),
                progress
            });
        }

        // Ограничиваем историю 50 записями
        if (this.watchHistory.length > 50) {
            this.watchHistory = this.watchHistory.slice(0, 50);
        }
    }

    getWatchHistory() {
        if (!window.database) return [];
        return this.watchHistory.map(item => {
            const anime = window.database.getAnimeById(item.animeId);
            return { ...item, anime };
        }).filter(item => item.anime); // Фильтруем удаленные аниме
    }

    // Рейтинги
    rateAnime(animeId, rating) {
        // В реальном приложении здесь бы обновлялся рейтинг в базе данных
        console.log(`Rated anime ${animeId} with ${rating} stars`);
        return true;
    }

    // Рекомендации
    getRecommendations() {
        if (!window.database) return [];
        
        const favoriteGenres = this.getFavoriteGenres();
        return window.database.animeList
            .filter(anime => 
                favoriteGenres.some(genre => 
                    anime.genre.includes(genre)
                ) && !this.favorites.has(anime.id)
            )
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 6);
    }

    getFavoriteGenres() {
        if (!window.database) return [];
        
        const favoriteAnime = this.getFavorites();
        const genreCount = {};
        
        favoriteAnime.forEach(anime => {
            genreCount[anime.genre] = (genreCount[anime.genre] || 0) + 1;
        });

        return Object.keys(genreCount)
            .sort((a, b) => genreCount[b] - genreCount[a])
            .slice(0, 3);
    }

    // Статистика
    getStats() {
        if (!window.database) return {};
        
        return {
            totalAnime: window.database.animeList.length,
            totalWatched: this.watchHistory.length,
            totalFavorites: this.favorites.size,
            favoriteGenre: this.getFavoriteGenres()[0] || 'Не определен'
        };
    }
}

// Создаем глобальный экземпляр менеджера аниме
window.animeManager = new AnimeManager();