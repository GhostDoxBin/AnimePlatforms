// Player functionality
class AnimePlayer {
    constructor() {
        this.overlay = document.getElementById('player-overlay');
        this.closeBtn = document.getElementById('close-player');
        this.title = document.getElementById('player-title');
        this.frame = document.getElementById('player-frame');
        this.videoPlaceholder = document.getElementById('video-placeholder');
        
        this.currentAnime = null;
        this.currentEpisode = 1;
        
        this.init();
    }

    init() {
        console.log('Initializing player');
        
        // Close player events
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        
        if (this.overlay) {
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });
        }

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay && this.overlay.classList.contains('active')) {
                this.close();
            }
        });
        
        console.log('Player initialized successfully');
    }

    open(anime, episode = 1) {
        console.log('Opening player for:', anime.title, 'episode:', episode);
        
        this.currentAnime = anime;
        this.currentEpisode = episode;
        
        if (this.overlay && this.title && this.frame) {
            // Update player title
            this.title.textContent = `${anime.title} - Эпизод ${episode}`;
            
            // Hide placeholder and show video
            if (this.videoPlaceholder) {
                this.videoPlaceholder.style.display = 'none';
            }
            
            // Create video element
            this.createVideoPlayer(anime, episode);
            
            // Show overlay
            this.overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            console.log('Player opened successfully');
        } else {
            console.error('Player elements not found');
        }
    }

    createVideoPlayer(anime, episode) {
        // Clear existing content
        this.frame.innerHTML = '';
        
        // Create video container
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-player-container';
        videoContainer.style.cssText = `
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000;
            position: relative;
            min-height: 500px;
        `;
        
        // Get episode video URL
        const episodeData = anime.episodesList?.find(ep => ep.number === episode);
        const videoUrl = episodeData?.videoUrl || anime.videoUrl;
        
        // Create video wrapper with better styling
        const videoWrapper = document.createElement('div');
        videoWrapper.style.cssText = `
            width: 100%;
            max-width: 100%;
            height: 100%;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Create video element
        const video = document.createElement('video');
        video.controls = true;
        video.autoplay = false;
        video.style.cssText = `
            width: 100%;
            max-width: 100%;
            height: auto;
            max-height: 100%;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        `;
        
        // Add video source
        if (videoUrl) {
            // Check if it's a YouTube URL
            if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                const videoId = this.extractYouTubeId(videoUrl);
                if (videoId) {
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
                    iframe.style.cssText = `
                        width: 100%;
                        height: 100%;
                        min-height: 500px;
                        border: none;
                        border-radius: 10px;
                    `;
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    videoWrapper.appendChild(iframe);
                    this.frame.appendChild(videoWrapper);
                    return;
                }
            }
            
            // Regular video URL
            const source = document.createElement('source');
            source.src = videoUrl;
            source.type = 'video/mp4';
            video.appendChild(source);
        }
        
        // Add error message
        video.innerHTML += 'Ваш браузер не поддерживает видео тег.';
        
        // Fallback for demo - show message if video fails to load
        video.addEventListener('error', () => {
            videoWrapper.innerHTML = `
                <div style="color: white; text-align: center; padding: 40px; max-width: 600px;">
                    <div style="font-size: 64px; margin-bottom: 20px;">🎬</div>
                    <h3 style="font-size: 24px; margin-bottom: 15px;">${anime.title}</h3>
                    <p style="font-size: 18px; margin-bottom: 10px; color: #b8c1cc;">Эпизод ${episode}</p>
                    <p style="font-size: 16px; margin-bottom: 20px; color: #8a99b3;">Длительность: ${episodeData?.duration || '24:00'}</p>
                    ${videoUrl ? `<p style="font-size: 14px; color: #6c8cff; word-break: break-all;">Источник: ${videoUrl}</p>` : ''}
                    <p style="font-size: 14px; margin-top: 20px; color: #8a99b3;">В демо-версии видео воспроизведение эмулируется.</p>
                </div>
            `;
        });
        
        videoWrapper.appendChild(video);
        videoContainer.appendChild(videoWrapper);
        this.frame.appendChild(videoContainer);
        
        // Try to play the video
        video.play().catch(error => {
            console.log('Auto-play was prevented:', error);
        });
    }
    
    extractYouTubeId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    close() {
        if (this.overlay && this.frame) {
            this.overlay.classList.remove('active');
            this.frame.innerHTML = '';
            
            // Show placeholder again
            if (this.videoPlaceholder) {
                this.videoPlaceholder.style.display = 'flex';
            }
            
            document.body.style.overflow = '';
            console.log('Player closed');
        }
    }
}

// Global function to open player
function openPlayer(anime, episode = 1) {
    if (window.animePlayer) {
        window.animePlayer.open(anime, episode);
    } else {
        console.error('Player not initialized');
        // Fallback: redirect to player page
        localStorage.setItem('currentAnime', JSON.stringify(anime));
        localStorage.setItem('currentEpisode', episode);
        window.location.href = `player.html?anime=${anime.id}&episode=${episode}`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.animePlayer = new AnimePlayer();
    console.log('Global animePlayer created');
});