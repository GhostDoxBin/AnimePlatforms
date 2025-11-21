// Search functionality with Pinterest images
class AnimeSearch {
    constructor() {
        this.animeData = this.getAnimeData();
        this.pinterestCache = new Map(); // Кэш для изображений
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.preloadImages();
    }

    // Данные аниме с Pinterest поисковыми запросами
    getAnimeData() {
        return [
            {
                id: 1,
                title: 'Атака Титанов',
                originalTitle: 'Shingeki no Kyojin',
                rating: 9.1,
                episodes: 75,
                year: 2013,
                genres: ['Экшен', 'Драма', 'Фэнтези'],
                description: 'После того как его родной город разрушен, а мать убита, юный Эрен Йегер клянется очистить землю от гигантских гуманоидных титанов.',
                pinterestQuery: 'attack on titan anime poster',
                image: null
            },
            {
                id: 2,
                title: 'Истребитель Демонов',
                originalTitle: 'Kimetsu no Yaiba',
                rating: 8.7,
                episodes: 26,
                year: 2019,
                genres: ['Экшен', 'Сверхъестественное', 'Исторический'],
                description: 'Танджиро Камадо становится истребителем демонов после того, как его семья была убита, а сестра превращена в демона.',
                pinterestQuery: 'demon slayer anime poster',
                image: null
            },
            {
                id: 3,
                title: 'Магическая Битва',
                originalTitle: 'Jujutsu Kaisen',
                rating: 8.6,
                episodes: 24,
                year: 2020,
                genres: ['Экшен', 'Сверхъестественное', 'Ужасы'],
                description: 'Юджи Итадори съедает проклятый палец и становится сосудом могущественного проклятия по имени Сукуна.',
                pinterestQuery: 'jujutsu kaisen anime poster',
                image: null
            },
            {
                id: 4,
                title: 'Моя Геройская Академия',
                originalTitle: 'Boku no Hero Academia',
                rating: 8.3,
                episodes: 113,
                year: 2016,
                genres: ['Экшен', 'Комедия', 'Школа'],
                description: 'В мире, где люди со сверхспособностями стали обычным явлением, Изуку Мидория мечтает стать героем.',
                pinterestQuery: 'my hero academia anime poster',
                image: null
            },
            {
                id: 5,
                title: 'Ван-Пис',
                originalTitle: 'One Piece',
                rating: 8.7,
                episodes: 1100,
                year: 1999,
                genres: ['Экшен', 'Приключения', 'Комедия'],
                description: 'Монки Д. Луффи и его команда пиратов ищут величайшее сокровище мира - Ван-Пис.',
                pinterestQuery: 'one piece anime poster',
                image: null
            },
            {
                id: 6,
                title: 'Наруто',
                originalTitle: 'Naruto',
                rating: 8.3,
                episodes: 220,
                year: 2002,
                genres: ['Экшен', 'Приключения', 'Комедия'],
                description: 'Наруто Узумаки - молодой ниндзя, который мечтает стать Хокаге, лидером своей деревни.',
                pinterestQuery: 'naruto anime poster',
                image: null
            },
            {
                id: 7,
                title: 'Стальной Алхимик: Братство',
                originalTitle: 'Fullmetal Alchemist: Brotherhood',
                rating: 9.1,
                episodes: 64,
                year: 2009,
                genres: ['Экшен', 'Приключения', 'Драма'],
                description: 'Братья Эдвард и Альфонс Элрих ищут философский камень, чтобы восстановить свои тела.',
                pinterestQuery: 'fullmetal alchemist brotherhood poster',
                image: null
            },
            {
                id: 8,
                title: 'Токийский Гуль',
                originalTitle: 'Tokyo Ghoul',
                rating: 7.8,
                episodes: 12,
                year: 2014,
                genres: ['Ужасы', 'Драма', 'Сверхъестественное'],
                description: 'Студент Кэн Канеки становится полу-гулем после встречи с загадочной девушкой.',
                pinterestQuery: 'tokyo ghoul anime poster',
                image: null
            },
            {
                id: 9,
                title: 'Самурай Чамплу',
                originalTitle: 'Samurai Champloo',
                rating: 8.5,
                episodes: 26,
                year: 2004,
                genres: ['Экшен', 'Приключения', 'Комедия'],
                description: 'Путешествие трех необычных персонажей по феодальной Японии в поисках самурая.',
                pinterestQuery: 'samurai champloo anime poster',
                image: null
            },
            {
                id: 10,
                title: 'Ковбой Бибоп',
                originalTitle: 'Cowboy Bebop',
                rating: 8.9,
                episodes: 26,
                year: 1998,
                genres: ['Экшен', 'Приключения', 'Научная фантастика'],
                description: 'Приключения команды охотников за головами в космосе.',
                pinterestQuery: 'cowboy bebop anime poster',
                image: null
            },
            {
                id: 11,
                title: 'Ходячий замок',
                originalTitle: 'Howl\'s Moving Castle',
                rating: 8.9,
                episodes: 1,
                year: 2004,
                genres: ['Фэнтези', 'Приключения', 'Романтика'],
                description: 'Молодая шляпница Софи превращается в старуху и отправляется в путешествие с загадочным волшебником Хаулом.',
                pinterestQuery: 'howl moving castle ghibli poster',
                image: null
            },
            {
                id: 12,
                title: 'Унесенные призраками',
                originalTitle: 'Spirited Away',
                rating: 9.3,
                episodes: 1,
                year: 2001,
                genres: ['Фэнтези', 'Приключения', 'Драма'],
                description: 'Девочка Тихиро попадает в мир духов и должна спасти своих родителей.',
                pinterestQuery: 'spirited away ghibli poster',
                image: null
            }
        ];
    }

    // Предзагрузка изображений для популярных аниме
    async preloadImages() {
        const popularAnime = this.animeData.slice(0, 4); // Первые 4 популярных аниме
        for (const anime of popularAnime) {
            await this.loadImageFromPinterest(anime);
        }
        this.updateAnimeCards();
    }

    // Загрузка изображения из Pinterest (эмуляция)
    async loadImageFromPinterest(anime) {
        // В реальном приложении здесь был бы API запрос к Pinterest
        // Для демонстрации используем статические ссылки на изображения аниме
        
        const imageUrls = {
            1: 'https://i.pinimg.com/736x/4a/7a/2a/4a7a2a8c8e8e8e8e8e8e8e8e8e8e8e8e.jpg',
            2: 'https://i.pinimg.com/736x/5b/8c/75/5b8c7575e5e5e5e5e5e5e5e5e5e5e5e5.jpg',
            3: 'https://i.pinimg.com/736x/6c/9d/86/6c9d8686e6e6e6e6e6e6e6e6e6e6e6e.jpg',
            4: 'https://i.pinimg.com/736x/7d/ae/97/7dae9797e7e7e7e7e7e7e7e7e7e7e7e.jpg',
            5: 'https://i.pinimg.com/736x/8e/bf/a8/8ebfa8a8e8e8e8e8e8e8e8e8e8e8e8e.jpg',
            6: 'https://i.pinimg.com/736x/9f/d0/b9/9fd0b9b9e9e9e9e9e9e9e9e9e9e9e9e9.jpg',
            7: 'https://i.pinimg.com/736x/a0/e1/ca/a0e1cacacacacacacacacacacacacaca.jpg',
            8: 'https://i.pinimg.com/736x/b1/f2/db/b1f2dbdbdbdbdbdbdbdbdbdbdbdbdbdb.jpg',
            9: 'https://i.pinimg.com/736x/c2/03/ec/c203ecececececececececececececec.jpg',
            10: 'https://i.pinimg.com/736x/d3/14/fd/d314fdfdfdfdfdfdfdfdfdfdfdfdfdfd.jpg',
            11: 'https://i.pinimg.com/736x/e4/25/0e/e4250e0e0e0e0e0e0e0e0e0e0e0e0e0e.jpg',
            12: 'https://i.pinimg.com/736x/f5/36/1f/f5361f1f1f1f1f1f1f1f1f1f1f1f1f1f.jpg'
        };

        // Эмуляция задержки загрузки
        await new Promise(resolve => setTimeout(resolve, 100));

        // Используем реальные изображения аниме (запасные ссылки)
        const fallbackImages = [
            'https://images.unsplash.com/photo-1578632749014-ca77efd052eb?w=400',
            'https://images.unsplash.com/photo-1541560052-77ec1bbc09f7?w=400',
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
            'https://images.unsplash.com/photo-1636516449936-4ffc70b756ff?w=400'
        ];

        // Случайное изображение из fallback
        const randomImage = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
        
        anime.image = imageUrls[anime.id] || randomImage;
        this.pinterestCache.set(anime.id, anime.image);
        
        return anime.image;
    }

    // Обновление карточек аниме с изображениями
    updateAnimeCards() {
        const animeCards = document.querySelectorAll('.anime-card');
        animeCards.forEach((card, index) => {
            if (index < this.animeData.length) {
                const anime = this.animeData[index];
                const imageContainer = card.querySelector('.anime-image');
                
                if (anime.image && imageContainer) {
                    imageContainer.innerHTML = '';
                    imageContainer.style.backgroundImage = `url(${anime.image})`;
                    imageContainer.style.backgroundSize = 'cover';
                    imageContainer.style.backgroundPosition = 'center';
                    imageContainer.style.backgroundRepeat = 'no-repeat';
                }
            }
        });
    }

    setupEventListeners() {
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');

        if (searchForm && searchInput) {
            // Поиск при вводе
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });

            // Поиск при отправке формы
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSearch(searchInput.value);
            });

            // Закрытие результатов при клике вне поиска
            document.addEventListener('click', (e) => {
                if (!searchForm.contains(e.target)) {
                    searchResults.classList.remove('active');
                }
            });

            // Обработка клавиш
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchResults.classList.remove('active');
                    searchInput.blur();
                }
            });
        }
    }

    handleSearch(query) {
        const searchResults = document.getElementById('search-results');
        
        if (!query.trim()) {
            searchResults.classList.remove('active');
            return;
        }

        const results = this.searchAnime(query);
        this.displayResults(results);
        searchResults.classList.add('active');
    }

    searchAnime(query) {
        const searchTerm = query.toLowerCase().trim();
        
        return this.animeData.filter(anime => {
            const titleMatch = anime.title.toLowerCase().includes(searchTerm);
            const originalTitleMatch = anime.originalTitle.toLowerCase().includes(searchTerm);
            const genreMatch = anime.genres.some(genre => 
                genre.toLowerCase().includes(searchTerm)
            );
            
            return titleMatch || originalTitleMatch || genreMatch;
        });
    }

    async displayResults(results) {
        const searchResults = document.getElementById('search-results');
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    Ничего не найдено. Попробуйте другой запрос.
                </div>
            `;
            return;
        }

        // Загружаем изображения для результатов поиска
        for (const anime of results) {
            if (!anime.image) {
                await this.loadImageFromPinterest(anime);
            }
        }

        searchResults.innerHTML = results.map(anime => `
            <div class="search-result-item" data-anime-id="${anime.id}">
                <div class="search-result-image" style="background-image: url('${anime.image}'); background-size: cover; background-position: center;">
                    ${!anime.image ? 'Загрузка...' : ''}
                </div>
                <div class="search-result-info">
                    <div class="search-result-title">${anime.title}</div>
                    <div class="search-result-meta">
                        <span class="search-result-rating">★ ${anime.rating}</span>
                        <span>${anime.year}</span>
                        <span>${anime.episodes} эп.</span>
                    </div>
                    <div class="search-result-genres">
                        ${anime.genres.slice(0, 2).join(', ')}
                    </div>
                </div>
            </div>
        `).join('');

        // Добавляем обработчики кликов на результаты
        this.addResultClickHandlers();
    }

    addResultClickHandlers() {
        const resultItems = document.querySelectorAll('.search-result-item');
        
        resultItems.forEach(item => {
            item.addEventListener('click', () => {
                const animeId = item.getAttribute('data-anime-id');
                this.openAnimeDetails(animeId);
            });
        });
    }

    openAnimeDetails(animeId) {
        const anime = this.animeData.find(a => a.id == animeId);
        if (anime) {
            alert(`Открываем: ${anime.title}\n\nРейтинг: ${anime.rating}\nГод: ${anime.year}\nЭпизоды: ${anime.episodes}\n\n${anime.description}`);
            
            // Закрываем результаты поиска
            const searchResults = document.getElementById('search-results');
            const searchInput = document.getElementById('search-input');
            
            searchResults.classList.remove('active');
            searchInput.value = '';
        }
    }
}

// Инициализация поиска
document.addEventListener('DOMContentLoaded', function() {
    window.animeSearch = new AnimeSearch();
});