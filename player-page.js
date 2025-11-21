// Player page functionality
class PlayerPage {
    constructor() {
        this.videoContainer = document.getElementById('video-page-player');
        this.videoPlaceholder = document.getElementById('video-placeholder');
        this.episodeSelect = document.getElementById('episode-select');
        this.playBtn = document.getElementById('play-btn');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.episodesGrid = document.getElementById('episodes-grid');
        
        this.currentAnime = null;
        this.currentEpisode = 1;
        this.currentVideo = null;
        this.playerSettings = new PlayerSettings();
        
        this.init();
    }

    init() {
        console.log('Initializing player page');
        this.loadAnime();
        this.setupEventListeners();
        this.playerSettings.init();
    }

    setupEventListeners() {
        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => this.playVideo());
        }
        
        if (this.fullscreenBtn) {
            this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        }
        
        if (this.episodeSelect) {
            this.episodeSelect.addEventListener('change', (e) => {
                this.currentEpisode = parseInt(e.target.value);
                this.updatePlayerInfo();
                this.playVideo();
            });
        }
    }

    async loadAnime() {
        // Get anime ID and episode from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const animeId = urlParams.get('anime');
        const episodeParam = urlParams.get('episode');
        
        let anime = null;
        
        if (animeId) {
            // Load by ID from URL
            if (window.animeService) {
                anime = window.animeService.getAnimeById(parseInt(animeId));
            } else if (window.animeData && window.animeData.getAnimeById) {
                anime = window.animeData.getAnimeById(parseInt(animeId));
            }
            
            // Если не найдено локально, пытаемся получить из API
            if (!anime && window.animeAPIService) {
                try {
                    anime = await window.animeAPIService.getAnimeById(parseInt(animeId));
                } catch (error) {
                    console.error('Error loading anime from API:', error);
                }
            }
        } else {
            // Load from storage
            const storedAnime = localStorage.getItem('currentAnime');
            anime = storedAnime ? JSON.parse(storedAnime) : null;
        }
        
        // Устанавливаем эпизод из URL или localStorage
        if (episodeParam) {
            this.currentEpisode = parseInt(episodeParam);
            localStorage.setItem('currentEpisode', this.currentEpisode.toString());
        } else {
            const storedEpisode = localStorage.getItem('currentEpisode');
            if (storedEpisode) {
                this.currentEpisode = parseInt(storedEpisode);
            }
        }
        
        if (anime) {
            this.currentAnime = anime;
            this.updatePlayerInfo(anime);
            this.loadEpisodes();
            this.loadVideo();
            this.hidePlaceholder();
        } else {
            this.showPlaceholder();
            if (window.Helpers && window.Helpers.showNotification) {
                window.Helpers.showNotification('Аниме не найдено. Пожалуйста, выберите аниме из каталога.', 'error');
            }
        }
    }

    updatePlayerInfo(anime = this.currentAnime) {
        if (!anime) return;

        console.log('Updating player page info for:', anime.title);
        
        const elements = {
            mainTitle: document.getElementById('player-main-title'),
            title: document.getElementById('player-title'),
            description: document.getElementById('player-description'),
            rating: document.getElementById('player-rating'),
            year: document.getElementById('player-year'),
            episodes: document.getElementById('player-episodes'),
            genre: document.getElementById('player-genre'),
            status: document.getElementById('player-status'),
            studio: document.getElementById('player-studio')
        };

        // Update all elements
        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                switch(key) {
                    case 'mainTitle':
                        elements[key].textContent = anime.title;
                        break;
                    case 'title':
                        elements[key].textContent = `${anime.title} - Эпизод ${this.currentEpisode}`;
                        break;
                    case 'description':
                        elements[key].textContent = anime.description;
                        break;
                    case 'rating':
                        elements[key].textContent = anime.rating;
                        break;
                    case 'year':
                        elements[key].textContent = anime.year;
                        break;
                    case 'episodes':
                        elements[key].textContent = `${anime.episodes} эп.`;
                        break;
                    case 'genre':
                        elements[key].textContent = anime.genre;
                        break;
                    case 'status':
                        elements[key].textContent = anime.status;
                        break;
                    case 'studio':
                        elements[key].textContent = anime.studio || 'Не указана';
                        break;
                }
            }
        });
    }

    hidePlaceholder() {
        if (this.videoPlaceholder) {
            this.videoPlaceholder.style.display = 'none';
        }
    }

    showPlaceholder() {
        if (this.videoPlaceholder) {
            this.videoPlaceholder.style.display = 'flex';
        }
    }

    loadEpisodes() {
        if (!this.currentAnime) return;

        // Clear existing options
        if (this.episodeSelect) {
            this.episodeSelect.innerHTML = '<option value="">Выберите эпизод</option>';
        }
        
        if (this.episodesGrid) {
            this.episodesGrid.innerHTML = '';
        }

        const episodesToShow = this.currentAnime.episodesList || this.generateEpisodes(this.currentAnime.episodes, this.currentAnime.title);

        episodesToShow.forEach(episode => {
            // Add to dropdown
            if (this.episodeSelect) {
                const option = document.createElement('option');
                option.value = episode.number;
                option.textContent = `Эпизод ${episode.number} - ${episode.title}`;
                if (episode.number === this.currentEpisode) {
                    option.selected = true;
                }
                this.episodeSelect.appendChild(option);
            }

            // Add to episodes grid
            if (this.episodesGrid) {
                const episodeCard = document.createElement('div');
                episodeCard.className = 'episode-card';
                if (episode.number === this.currentEpisode) {
                    episodeCard.classList.add('active');
                }
                episodeCard.innerHTML = `
                    <div class="episode-number">Эпизод ${episode.number}</div>
                    <div class="episode-title">${episode.title}</div>
                    <div class="episode-duration">${episode.duration}</div>
                `;

                episodeCard.addEventListener('click', () => {
                    this.selectEpisode(episode.number);
                });

                this.episodesGrid.appendChild(episodeCard);
            }
        });

        // Select first episode by default if not set
        if (episodesToShow.length > 0 && !this.currentEpisode) {
            this.selectEpisode(1);
        }
    }

    generateEpisodes(count, title) {
        const episodes = [];
        for (let i = 1; i <= count; i++) {
            episodes.push({
                number: i,
                title: `${title} - Эпизод ${i}`,
                duration: "24:00",
                videoUrl: "",
                thumbnail: `https://via.placeholder.com/300x169/333/fff?text=Эпизод+${i}`
            });
        }
        return episodes;
    }

    selectEpisode(episodeNumber) {
        this.currentEpisode = episodeNumber;
        
        if (this.episodeSelect) {
            this.episodeSelect.value = episodeNumber;
        }
        
        // Update active episode in grid
        if (this.episodesGrid) {
            document.querySelectorAll('.episode-card').forEach(card => {
                card.classList.remove('active');
            });
            
            const selectedCard = this.episodesGrid.children[episodeNumber - 1];
            if (selectedCard) {
                selectedCard.classList.add('active');
            }
        }
        
        // Update title
        const titleElement = document.getElementById('player-title');
        if (titleElement && this.currentAnime) {
            titleElement.textContent = `${this.currentAnime.title} - Эпизод ${episodeNumber}`;
        }
        
        // Save episode to localStorage
        localStorage.setItem('currentEpisode', episodeNumber.toString());
        
        // Play the selected episode
        this.playVideo();
    }

    async playVideo() {
        if (!this.currentAnime) {
            alert('Пожалуйста, выберите аниме для воспроизведения');
            return;
        }

        if (!this.currentEpisode) {
            alert('Пожалуйста, выберите эпизод для воспроизведения');
            return;
        }

        // Clear video container
        if (this.videoContainer) {
            // Remove placeholder if still visible
            if (this.videoPlaceholder && this.videoPlaceholder.style.display !== 'none') {
                this.videoPlaceholder.style.display = 'none';
            }
            
            // Show loading
            this.videoContainer.innerHTML = '<div style="color: white; text-align: center; padding: 40px;"><div style="font-size: 48px; margin-bottom: 20px;">⏳</div><h3>Загрузка видео...</h3></div>';
            
            // Create video player container
            const videoContainer = document.createElement('div');
            videoContainer.className = 'video-player-container';
            videoContainer.style.cssText = 'width: 100%; height: 100%; background: #000; display: flex; align-items: center; justify-content: center; min-height: 500px;';
            
            // Get episode data
            const episodeData = this.currentAnime.episodesList?.find(ep => ep.number === this.currentEpisode);
            let videoUrl = episodeData?.videoUrl || this.currentAnime.videoUrl;
            
            // Если нет URL, пытаемся получить из открытых источников
            if (!videoUrl && window.videoService) {
                try {
                    const fetchedUrl = await window.videoService.getDirectVideoUrl(
                        this.currentAnime.title || this.currentAnime.originalTitle,
                        this.currentEpisode
                    );
                    if (fetchedUrl) {
                        videoUrl = fetchedUrl;
                    }
                } catch (error) {
                    console.error('Error fetching video from service:', error);
                }
            }
            
            // Проверяем тип URL
            if (videoUrl) {
                // YouTube URL
                if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                    const videoId = this.extractYouTubeId(videoUrl);
                    if (videoId) {
                        const iframe = document.createElement('iframe');
                        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
                        iframe.style.cssText = 'width: 100%; height: 100%; min-height: 500px; border: none; border-radius: 10px;';
                        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                        iframe.allowFullscreen = true;
                        videoContainer.appendChild(iframe);
                        this.videoContainer.innerHTML = '';
                        this.videoContainer.appendChild(videoContainer);
                        return;
                    }
                }
                
                // Прямой видео URL
                const video = document.createElement('video');
                video.controls = true;
                video.autoplay = false;
                video.style.cssText = 'width: 100%; max-width: 100%; height: auto; max-height: 100%; border-radius: 10px;';
                video.crossOrigin = 'anonymous';
                
                const source = document.createElement('source');
                source.src = videoUrl;
                source.type = this.getVideoType(videoUrl);
                video.appendChild(source);
                
                video.innerHTML += 'Ваш браузер не поддерживает видео тег.';
                
                video.addEventListener('error', () => {
                    console.error('Video load error, showing fallback');
                    this.showVideoFallback(videoContainer, videoUrl);
                });
                
                video.addEventListener('loadeddata', () => {
                    console.log('Video loaded successfully');
                });
                
                videoContainer.appendChild(video);
                this.currentVideo = video;
                
                // Apply player settings if available
                if (this.playerSettings && this.playerSettings.applyToVideo) {
                    this.playerSettings.applyToVideo(video);
                }
                
                // Try to play
                video.play().catch(error => {
                    console.log('Auto-play was prevented:', error);
                });
            } else {
                // Show fallback if no video URL
                this.showVideoFallback(videoContainer);
            }
            
            this.videoContainer.innerHTML = '';
            this.videoContainer.appendChild(videoContainer);
        }
    }
    
    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    
    getVideoType(url) {
        if (url.includes('.mp4')) return 'video/mp4';
        if (url.includes('.webm')) return 'video/webm';
        if (url.includes('.ogg')) return 'video/ogg';
        return 'video/mp4';
    }
    
    showVideoFallback(container, videoUrl = null) {
        container.innerHTML = `
            <div style="color: white; text-align: center; padding: 40px; max-width: 600px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎬</div>
                <h3 style="font-size: 24px; margin-bottom: 15px;">${this.currentAnime.title}</h3>
                <p style="font-size: 18px; margin-bottom: 10px; color: #b8c1cc;">Эпизод ${this.currentEpisode}</p>
                <p style="font-size: 16px; margin-bottom: 20px; color: #8a99b3;">Длительность: ${this.currentAnime.episodesList?.find(ep => ep.number === this.currentEpisode)?.duration || '24:00'}</p>
                ${videoUrl ? `<p style="font-size: 14px; color: #6c8cff; word-break: break-all; margin-bottom: 20px;">Источник: ${videoUrl}</p>` : ''}
                <p style="font-size: 14px; color: #8a99b3; margin-top: 20px;">
                    Видео загружается из открытых источников. Если видео не воспроизводится, 
                    попробуйте выбрать другой эпизод или обновить страницу.
                </p>
            </div>
        `;
    }

    showVideoFallback(container, videoUrl = null) {
        container.innerHTML = `
            <div style="color: white; text-align: center; padding: 40px; max-width: 600px;">
                <div style="font-size: 64px; margin-bottom: 20px;">🎬</div>
                <h3 style="font-size: 24px; margin-bottom: 15px;">${this.currentAnime.title}</h3>
                <p style="font-size: 18px; margin-bottom: 10px; color: #b8c1cc;">Эпизод ${this.currentEpisode}</p>
                <p style="font-size: 16px; margin-bottom: 20px; color: #8a99b3;">Длительность: ${this.currentAnime.episodesList?.find(ep => ep.number === this.currentEpisode)?.duration || '24:00'}</p>
                ${videoUrl ? `<p style="font-size: 14px; color: #6c8cff; word-break: break-all; margin-bottom: 20px;">Источник: ${videoUrl}</p>` : ''}
                <p style="font-size: 14px; color: #8a99b3; margin-top: 20px;">
                    Видео загружается из открытых источников. Если видео не воспроизводится, 
                    попробуйте выбрать другой эпизод или обновить страницу.
                </p>
                <div style="margin-top: 30px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <h4>Функциональность плеера:</h4>
                    <ul style="text-align: left; display: inline-block;">
                        <li>Управление громкостью</li>
                        <li>Изменение скорости воспроизведения</li>
                        <li>Настройка качества видео</li>
                        <li>Субтитры</li>
                        <li>Полноэкранный режим</li>
                    </ul>
                </div>
            </div>
        `;
    }

    toggleFullscreen() {
        if (!this.videoContainer) return;

        if (!document.fullscreenElement) {
            if (this.videoContainer.requestFullscreen) {
                this.videoContainer.requestFullscreen();
            } else if (this.videoContainer.webkitRequestFullscreen) {
                this.videoContainer.webkitRequestFullscreen();
            } else if (this.videoContainer.msRequestFullscreen) {
                this.videoContainer.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
}

// Player settings functionality
class PlayerSettings {
    constructor() {
        this.settings = this.loadSettings();
    }

    init() {
        this.setupEventListeners();
        this.applyCurrentSettings();
    }

    setupEventListeners() {
        // Quality selector
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setQuality(e.target.getAttribute('data-quality'));
            });
        });

        // Speed selector
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setSpeed(parseFloat(e.target.getAttribute('data-speed')));
            });
        });

        // Volume slider
        const volumeSlider = document.querySelector('.volume-slider');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                this.setVolume(parseInt(e.target.value));
            });
        }

        // Subtitle settings
        const subtitleSelect = document.querySelector('.subtitle-select');
        if (subtitleSelect) {
            subtitleSelect.addEventListener('change', (e) => {
                this.setSubtitles(e.target.value);
            });
        }

        // Size slider
        const sizeSlider = document.querySelector('.size-slider');
        if (sizeSlider) {
            sizeSlider.addEventListener('input', (e) => {
                this.setSubtitleSize(parseInt(e.target.value));
            });
        }

        // Toggle switches
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const setting = e.target.closest('.setting-item').querySelector('.setting-label').textContent;
                this.toggleSetting(setting, e.target.checked);
            });
        });

        // Reset button
        const resetBtn = document.getElementById('reset-settings');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Apply button
        const applyBtn = document.getElementById('apply-settings');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applySettings();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcut(e);
        });
    }

    setQuality(quality) {
        console.log('Setting quality to:', quality);
        
        // Update UI
        document.querySelectorAll('.quality-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.quality-btn[data-quality="${quality}"]`).classList.add('active');
        
        // Update settings
        this.settings.videoQuality = quality;
    }

    setSpeed(speed) {
        console.log('Setting speed to:', speed);
        
        // Update UI
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.speed-btn[data-speed="${speed}"]`).classList.add('active');
        
        // Update settings
        this.settings.playbackSpeed = speed;
    }

    setVolume(volume) {
        console.log('Setting volume to:', volume);
        
        // Update UI
        const volumeValue = document.querySelector('.volume-value');
        if (volumeValue) {
            volumeValue.textContent = volume + '%';
        }
        
        const volumeSlider = document.querySelector('.volume-slider');
        if (volumeSlider) {
            volumeSlider.value = volume;
        }
        
        // Update settings
        this.settings.volume = volume;
    }

    setSubtitles(language) {
        console.log('Setting subtitles to:', language);
        this.settings.subtitles = language;
    }

    setSubtitleSize(size) {
        console.log('Setting subtitle size to:', size);
        
        // Update UI
        const sizeValue = document.querySelector('.size-value');
        if (sizeValue) {
            sizeValue.textContent = size + 'px';
        }
        
        const sizeSlider = document.querySelector('.size-slider');
        if (sizeSlider) {
            sizeSlider.value = size;
        }
        
        // Update settings
        this.settings.subtitleSize = size;
    }

    toggleSetting(setting, enabled) {
        console.log('Toggling', setting, 'to:', enabled);
        
        switch(setting) {
            case 'Автовоспроизведение':
                this.settings.autoPlay = enabled;
                break;
            case 'Мини-плеер':
                this.settings.miniPlayer = enabled;
                break;
            case 'Темная тема':
                this.settings.darkTheme = enabled;
                break;
            case 'Кадрирование':
                this.settings.autoCrop = enabled;
                break;
        }
    }

    handleKeyboardShortcut(e) {
        // Don't trigger if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
            return;
        }

        switch(e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayPause();
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                this.toggleFullscreen();
                break;
            case 'm':
            case 'M':
                e.preventDefault();
                this.toggleMute();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.seek(-10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.seek(10);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.changeVolume(10);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.changeVolume(-10);
                break;
        }
    }

    togglePlayPause() {
        if (window.playerPage && window.playerPage.currentVideo) {
            if (window.playerPage.currentVideo.paused) {
                window.playerPage.currentVideo.play();
            } else {
                window.playerPage.currentVideo.pause();
            }
        }
    }

    toggleFullscreen() {
        if (window.playerPage) {
            window.playerPage.toggleFullscreen();
        }
    }

    toggleMute() {
        if (window.playerPage && window.playerPage.currentVideo) {
            window.playerPage.currentVideo.muted = !window.playerPage.currentVideo.muted;
        }
    }

    seek(seconds) {
        if (window.playerPage && window.playerPage.currentVideo) {
            window.playerPage.currentVideo.currentTime += seconds;
        }
    }

    changeVolume(change) {
        const newVolume = Math.max(0, Math.min(100, this.settings.volume + change));
        this.setVolume(newVolume);
    }

    applyToVideo(video) {
        if (!video) return;
        
        // Apply volume
        video.volume = this.settings.volume / 100;
        
        // Apply playback speed
        video.playbackRate = this.settings.playbackSpeed;
        
        // Apply autoplay
        video.autoplay = this.settings.autoPlay;
    }

    resetSettings() {
        if (confirm('Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?')) {
            this.settings = this.getDefaultSettings();
            this.applyCurrentSettings();
            this.saveSettings();
            this.showNotification('Настройки сброшены');
        }
    }

    applySettings() {
        this.saveSettings();
        this.showNotification('Настройки применены');
    }

    applyCurrentSettings() {
        // Apply quality
        this.setQuality(this.settings.videoQuality);
        
        // Apply speed
        this.setSpeed(this.settings.playbackSpeed);
        
        // Apply volume
        this.setVolume(this.settings.volume);
        
        // Apply subtitles
        const subtitleSelect = document.querySelector('.subtitle-select');
        if (subtitleSelect) {
            subtitleSelect.value = this.settings.subtitles;
        }
        
        // Apply subtitle size
        this.setSubtitleSize(this.settings.subtitleSize);
        
        // Apply toggle switches
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            const setting = toggle.closest('.setting-item').querySelector('.setting-label').textContent;
            switch(setting) {
                case 'Автовоспроизведение':
                    toggle.checked = this.settings.autoPlay;
                    break;
                case 'Мини-плеер':
                    toggle.checked = this.settings.miniPlayer;
                    break;
                case 'Темная тема':
                    toggle.checked = this.settings.darkTheme;
                    break;
                case 'Кадрирование':
                    toggle.checked = this.settings.autoCrop;
                    break;
            }
        });
    }

    loadSettings() {
        const saved = localStorage.getItem('playerSettings');
        if (saved) {
            return { ...this.getDefaultSettings(), ...JSON.parse(saved) };
        }
        return this.getDefaultSettings();
    }

    saveSettings() {
        localStorage.setItem('playerSettings', JSON.stringify(this.settings));
    }

    getDefaultSettings() {
        return {
            videoQuality: 'auto',
            playbackSpeed: 1,
            volume: 80,
            subtitles: 'none',
            subtitleSize: 16,
            autoPlay: true,
            miniPlayer: false,
            darkTheme: true,
            autoCrop: true
        };
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

// Initialize player page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('video-page-player')) {
        window.playerPage = new PlayerPage();
        console.log('Player page initialized');
    }
});