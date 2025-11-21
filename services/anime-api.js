// Anime API Service - получение данных из внешних источников
class AnimeAPIService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 60 * 60 * 1000; // 1 час
    }

    /**
     * Получение данных аниме из Jikan API (MyAnimeList)
     */
    async fetchAnimeFromJikan(query, limit = 10) {
        try {
            const cacheKey = `jikan_${query}_${limit}`;
            const cached = this.getCached(cacheKey);
            if (cached) return cached;

            // Используем публичный прокси для обхода CORS
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const apiUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=${limit}`;
            
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
            const data = await response.json();
            
            if (data.contents) {
                const parsed = JSON.parse(data.contents);
                const results = this.formatJikanData(parsed.data || []);
                this.setCached(cacheKey, results);
                return results;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching from Jikan API:', error);
            return [];
        }
    }

    /**
     * Получение топ аниме из Jikan API
     */
    async fetchTopAnime(limit = 100) {
        try {
            const cacheKey = `top_anime_${limit}`;
            const cached = this.getCached(cacheKey);
            if (cached) return cached;

            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const apiUrl = `https://api.jikan.moe/v4/top/anime?limit=${limit}`;
            
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
            const data = await response.json();
            
            if (data.contents) {
                const parsed = JSON.parse(data.contents);
                const results = this.formatJikanData(parsed.data || []);
                this.setCached(cacheKey, results);
                return results;
            }
            
            return [];
        } catch (error) {
            console.error('Error fetching top anime:', error);
            return [];
        }
    }

    /**
     * Форматирование данных из Jikan API в формат приложения
     */
    formatJikanData(jikanData) {
        return jikanData.map(item => ({
            id: item.mal_id || Date.now() + Math.random(),
            title: item.title || item.title_english || 'Без названия',
            originalTitle: item.title_japanese || item.title,
            rating: (item.score || 0) / 10, // Jikan использует 0-10, мы тоже
            year: item.year || new Date().getFullYear(),
            episodes: item.episodes || 0,
            genre: item.genres && item.genres.length > 0 ? item.genres[0].name : 'Неизвестно',
            status: this.mapStatus(item.status),
            studio: item.studios && item.studios.length > 0 ? item.studios[0].name : 'Неизвестно',
            description: item.synopsis || 'Описание отсутствует',
            poster: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
            videoUrl: item.trailer?.url || '',
            type: item.type || 'TV',
            duration: item.duration || '24 мин',
            popularity: item.popularity || 0,
            votes: item.scored_by || 0,
            episodesList: this.generateEpisodesFromJikan(item),
            createdAt: new Date().toISOString()
        }));
    }

    /**
     * Генерация списка эпизодов из данных Jikan
     */
    generateEpisodesFromJikan(item) {
        const episodes = [];
        const episodeCount = item.episodes || 12;
        
        for (let i = 1; i <= Math.min(episodeCount, 50); i++) {
            episodes.push({
                number: i,
                title: `${item.title} - Эпизод ${i}`,
                duration: item.duration || "24:00",
                thumbnail: item.images?.jpg?.large_image_url || '',
                description: `Эпизод ${i} аниме "${item.title}".`,
                videoUrl: item.trailer?.url || ''
            });
        }
        
        return episodes;
    }

    /**
     * Маппинг статуса из Jikan в формат приложения
     */
    mapStatus(jikanStatus) {
        const statusMap = {
            'Finished Airing': 'Завершено',
            'Currently Airing': 'Онгоинг',
            'Not yet aired': 'Анонсировано'
        };
        return statusMap[jikanStatus] || 'Неизвестно';
    }

    /**
     * Получение данных из кэша
     */
    getCached(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    /**
     * Сохранение в кэш
     */
    setCached(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Поиск аниме по названию
     */
    async searchAnime(query) {
        if (!query || query.length < 2) return [];
        return await this.fetchAnimeFromJikan(query, 20);
    }

    /**
     * Получение информации об аниме по ID
     */
    async getAnimeById(id) {
        try {
            const cacheKey = `anime_${id}`;
            const cached = this.getCached(cacheKey);
            if (cached) return cached;

            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const apiUrl = `https://api.jikan.moe/v4/anime/${id}`;
            
            const response = await fetch(proxyUrl + encodeURIComponent(apiUrl));
            const data = await response.json();
            
            if (data.contents) {
                const parsed = JSON.parse(data.contents);
                const formatted = this.formatJikanData([parsed.data])[0];
                this.setCached(cacheKey, formatted);
                return formatted;
            }
            
            return null;
        } catch (error) {
            console.error('Error fetching anime by ID:', error);
            return null;
        }
    }
}

// Создаем глобальный экземпляр
if (typeof window !== 'undefined') {
    window.animeAPIService = new AnimeAPIService();
}

