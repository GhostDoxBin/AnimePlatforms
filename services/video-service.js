// Video Service - получение видео из открытых источников
class VideoService {
    constructor() {
        this.sources = [
            'https://anime-api.com',
            'https://api.consumet.org/anime',
            'https://api.anify.tv'
        ];
    }

    /**
     * Получение видео для эпизода аниме
     */
    async getVideoUrl(animeTitle, episodeNumber) {
        try {
            // Пытаемся получить из Consumet API (AniWatch)
            const consumetUrl = `https://api.consumet.org/anime/gogoanime/${encodeURIComponent(animeTitle)}`;
            
            try {
                const response = await fetch(consumetUrl);
                if (response.ok) {
                    const data = await response.json();
                    if (data.results && data.results.length > 0) {
                        const animeId = data.results[0].id;
                        return await this.getEpisodeVideo(animeId, episodeNumber);
                    }
                }
            } catch (error) {
                console.log('Consumet API error, trying alternatives...');
            }

            // Альтернативный источник - Anify API
            try {
                const anifyUrl = `https://api.anify.tv/search?query=${encodeURIComponent(animeTitle)}`;
                const response = await fetch(anifyUrl);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.length > 0) {
                        const animeId = data[0].id;
                        return await this.getAnifyEpisode(animeId, episodeNumber);
                    }
                }
            } catch (error) {
                console.log('Anify API error, using fallback...');
            }

            // Fallback - возвращаем YouTube поиск или placeholder
            return this.getFallbackVideo(animeTitle, episodeNumber);
        } catch (error) {
            console.error('Error getting video URL:', error);
            return this.getFallbackVideo(animeTitle, episodeNumber);
        }
    }

    /**
     * Получение видео эпизода из Gogoanime через Consumet
     */
    async getEpisodeVideo(animeId, episodeNumber) {
        try {
            const url = `https://api.consumet.org/anime/gogoanime/watch/${animeId}-episode-${episodeNumber}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data.sources && data.sources.length > 0) {
                    // Возвращаем лучшее качество
                    const bestQuality = data.sources.sort((a, b) => {
                        const qualityA = parseInt(a.quality) || 0;
                        const qualityB = parseInt(b.quality) || 0;
                        return qualityB - qualityA;
                    })[0];
                    return bestQuality.url;
                }
            }
        } catch (error) {
            console.error('Error getting episode video:', error);
        }
        return null;
    }

    /**
     * Получение видео из Anify API
     */
    async getAnifyEpisode(animeId, episodeNumber) {
        try {
            const url = `https://api.anify.tv/episodes/${animeId}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const episode = data.find(ep => ep.number === episodeNumber);
                    if (episode && episode.sources && episode.sources.length > 0) {
                        return episode.sources[0].url;
                    }
                }
            }
        } catch (error) {
            console.error('Error getting Anify episode:', error);
        }
        return null;
    }

    /**
     * Fallback - поиск на YouTube или возврат placeholder
     */
    getFallbackVideo(animeTitle, episodeNumber) {
        // Генерируем поисковый запрос для YouTube
        const searchQuery = `${animeTitle} episode ${episodeNumber} full`;
        const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`;
        
        // Возвращаем информацию для поиска или placeholder
        return {
            type: 'youtube_search',
            searchUrl: youtubeSearchUrl,
            searchQuery: searchQuery,
            placeholder: true
        };
    }

    /**
     * Получение iframe для YouTube видео
     */
    getYouTubeEmbed(videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
    }

    /**
     * Поиск YouTube видео по запросу
     */
    async searchYouTube(query) {
        try {
            // Используем YouTube Data API v3 через прокси
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
            
            // Для демо возвращаем информацию о поиске
            return {
                type: 'youtube_search',
                searchUrl: youtubeUrl,
                query: query
            };
        } catch (error) {
            console.error('Error searching YouTube:', error);
            return null;
        }
    }

    /**
     * Получение прямого URL видео (если доступен)
     */
    async getDirectVideoUrl(animeTitle, episodeNumber) {
        // Пытаемся получить из различных источников
        const videoUrl = await this.getVideoUrl(animeTitle, episodeNumber);
        
        if (videoUrl && typeof videoUrl === 'string') {
            return videoUrl;
        }
        
        return null;
    }
}

// Создаем глобальный экземпляр
if (typeof window !== 'undefined') {
    window.videoService = new VideoService();
}

