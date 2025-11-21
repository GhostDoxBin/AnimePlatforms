// Player settings functionality
class PlayerSettings {
    constructor() {
        this.settings = this.loadSettings();
        this.init();
    }

    init() {
        console.log('Initializing player settings');
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
        
        // Apply to video (in real app, this would change the video source)
        if (window.playerPage && window.playerPage.currentVideo) {
            // Here you would typically change the video source based on quality
            console.log('Quality changed to:', quality);
        }
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
        
        // Apply to video
        if (window.playerPage && window.playerPage.currentVideo) {
            window.playerPage.currentVideo.playbackRate = speed;
        }
    }

    setVolume(volume) {
        console.log('Setting volume to:', volume);
        
        // Update UI
        const volumeValue = document.querySelector('.volume-value');
        if (volumeValue) {
            volumeValue.textContent = volume + '%';
        }
        
        // Update settings
        this.settings.volume = volume;
        
        // Apply to video
        if (window.playerPage && window.playerPage.currentVideo) {
            window.playerPage.currentVideo.volume = volume / 100;
        }
    }

    setSubtitles(language) {
        console.log('Setting subtitles to:', language);
        this.settings.subtitles = language;
        
        // In a real app, you would load subtitle tracks here
        if (language !== 'none') {
            console.log('Loading subtitles for language:', language);
        }
    }

    setSubtitleSize(size) {
        console.log('Setting subtitle size to:', size);
        
        // Update UI
        const sizeValue = document.querySelector('.size-slider').nextElementSibling;
        if (sizeValue && sizeValue.classList.contains('volume-value')) {
            sizeValue.textContent = size + 'px';
        }
        
        // Update settings
        this.settings.subtitleSize = size;
        
        // Apply to subtitles
        const subtitleElement = document.querySelector('.subtitle-track');
        if (subtitleElement) {
            subtitleElement.style.fontSize = size + 'px';
        }
    }

    toggleSetting(setting, enabled) {
        console.log('Toggling', setting, 'to:', enabled);
        
        switch(setting) {
            case 'Автовоспроизведение':
                this.settings.autoPlay = enabled;
                break;
            case 'Мини-плеер':
                this.settings.miniPlayer = enabled;
                this.toggleMiniPlayer(enabled);
                break;
            case 'Темная тема':
                this.settings.darkTheme = enabled;
                document.body.setAttribute('data-theme', enabled ? 'dark' : 'light');
                break;
            case 'Кадрирование':
                this.settings.autoCrop = enabled;
                break;
        }
    }

    toggleMiniPlayer(enabled) {
        const miniPlayer = document.querySelector('.mini-player');
        if (miniPlayer) {
            if (enabled) {
                miniPlayer.classList.add('active');
            } else {
                miniPlayer.classList.remove('active');
            }
        }
    }

    handleKeyboardShortcut(e) {
        // Don't trigger if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
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
                this.toggleMiniPlayer(!this.settings.miniPlayer);
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
            case 'n':
            case 'N':
                e.preventDefault();
                this.nextEpisode();
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

    seek(seconds) {
        if (window.playerPage && window.playerPage.currentVideo) {
            window.playerPage.currentVideo.currentTime += seconds;
        }
    }

    changeVolume(change) {
        const newVolume = Math.max(0, Math.min(100, this.settings.volume + change));
        this.setVolume(newVolume);
    }

    nextEpisode() {
        if (window.playerPage && window.playerPage.currentAnime) {
            const nextEpisode = window.playerPage.currentEpisode + 1;
            const maxEpisodes = window.playerPage.currentAnime.episodesList.length;
            
            if (nextEpisode <= maxEpisodes) {
                window.playerPage.selectEpisode(nextEpisode);
                window.playerPage.playVideo();
            }
        }
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
        const sizeSlider = document.querySelector('.size-slider');
        if (sizeSlider) {
            sizeSlider.value = this.settings.subtitleSize;
            this.setSubtitleSize(this.settings.subtitleSize);
        }
        
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('player-settings')) {
        window.playerSettings = new PlayerSettings();
        console.log('Player settings initialized');
    }
});