// Theme management
class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('theme') || 'dark';
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.setupEventListeners();
    }

    setupEventListeners() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(this.currentTheme);
        localStorage.setItem('theme', this.currentTheme);
        
        // Update user preferences if logged in
        const currentUser = getCurrentUser();
        if (currentUser) {
            currentUser.preferences.theme = this.currentTheme;
            setCurrentUser(currentUser);
            
            // Update in users database
            const users = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
            const userIndex = users.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].preferences.theme = this.currentTheme;
                localStorage.setItem('animePlatformUsers', JSON.stringify(users));
            }
        }
    }

    applyTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        
        // Update theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.textContent = theme === 'dark' ? '🌙' : '☀️';
        }
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f1419' : '#f5f7fa');
        }
    }

    getCurrentTheme() {
        return this.currentTheme;
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
    
    // Apply user's preferred theme if logged in
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.preferences && currentUser.preferences.theme) {
        window.themeManager.applyTheme(currentUser.preferences.theme);
        localStorage.setItem('theme', currentUser.preferences.theme);
    }
});