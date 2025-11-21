// Profile management
class ProfileManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        if (!requireAuth()) return;
        
        this.currentUser = getCurrentUser();
        this.loadProfileData();
        this.setupEventListeners();
    }

    loadProfileData() {
        if (!this.currentUser) {
            window.location.href = 'login.html';
            return;
        }

        this.fillFormData(this.currentUser);
    }

    fillFormData(user) {
        const elements = {
            'profile-username': user.username,
            'profile-display-name': user.displayName || user.username,
            'profile-email': user.email,
            'profile-bio': user.bio || ''
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = elements[id];
            }
        });

        const avatar = document.getElementById('avatar-image');
        if (avatar && user.avatar) {
            avatar.src = user.avatar;
        }

        this.loadPreferences(user);
    }

    loadPreferences(user) {
        if (!user.preferences) return;

        const elements = {
            'profile-language': user.preferences.language,
            'profile-theme': user.preferences.theme,
            'profile-notifications-email': user.preferences.notifications.email,
            'profile-notifications-push': user.preferences.notifications.push,
            'profile-notifications-newsletter': user.preferences.notifications.newsletter
        };

        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = elements[id];
                } else {
                    element.value = elements[id];
                }
            }
        });
    }

    setupEventListeners() {
        const profileForm = document.getElementById('profile-info-form');
        const securityForm = document.getElementById('profile-security-form');
        const preferencesForm = document.getElementById('profile-preferences-form');

        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.saveProfile(e));
        }

        if (securityForm) {
            securityForm.addEventListener('submit', (e) => this.changePassword(e));
        }

        if (preferencesForm) {
            preferencesForm.addEventListener('submit', (e) => this.savePreferences(e));
        }

        // Смена аватара
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const avatarInput = document.getElementById('avatar-input');
        const avatarImage = document.getElementById('avatar-image');

        if (changeAvatarBtn && avatarInput && avatarImage) {
            changeAvatarBtn.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', (e) => this.handleAvatarChange(e));
        }

        // Навигация по разделам
        this.setupProfileNavigation();
    }

    setupProfileNavigation() {
        const menuLinks = document.querySelectorAll('.profile-menu-link');
        const sections = document.querySelectorAll('.profile-section');

        menuLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('data-section');
                
                menuLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                sections.forEach(section => {
                    section.classList.remove('active');
                });
                document.getElementById(sectionId).classList.add('active');
            });
        });
    }

    async saveProfile(e) {
        e.preventDefault();
        
        if (!this.currentUser) return;

        const updates = {
            displayName: document.getElementById('profile-display-name').value,
            bio: document.getElementById('profile-bio').value,
            email: document.getElementById('profile-email').value
        };

        // Validate email
        if (!this.validateEmail(updates.email)) {
            this.showNotification('Пожалуйста, введите корректный email', 'error');
            return;
        }

        const success = this.updateUserProfile(updates);

        if (success) {
            this.showNotification('Профиль успешно обновлен!', 'success');
        } else {
            this.showNotification('Ошибка обновления профиля!', 'error');
        }
    }

    async changePassword(e) {
        e.preventDefault();
        
        if (!this.currentUser) return;

        const currentPassword = document.getElementById('profile-current-password').value;
        const newPassword = document.getElementById('profile-new-password').value;
        const confirmPassword = document.getElementById('profile-confirm-password').value;

        if (newPassword !== confirmPassword) {
            this.showNotification('Пароли не совпадают!', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('Пароль должен содержать не менее 6 символов!', 'error');
            return;
        }

        // In a real app, you would verify current password with server
        // For demo, we'll just update it
        const success = this.updateUserProfile({ password: newPassword });

        if (success) {
            this.showNotification('Пароль успешно изменен!', 'success');
            e.target.reset();
        } else {
            this.showNotification('Ошибка изменения пароля!', 'error');
        }
    }

    async savePreferences(e) {
        e.preventDefault();
        
        if (!this.currentUser) return;

        const updates = {
            preferences: {
                language: document.getElementById('profile-language').value,
                theme: document.getElementById('profile-theme').value,
                notifications: {
                    email: document.getElementById('profile-notifications-email').checked,
                    push: document.getElementById('profile-notifications-push').checked,
                    newsletter: document.getElementById('profile-notifications-newsletter').checked
                }
            }
        };

        const success = this.updateUserProfile(updates);

        if (success) {
            this.showNotification('Настройки сохранены!', 'success');
            
            // Apply theme immediately
            if (window.themeManager) {
                window.themeManager.applyTheme(updates.preferences.theme);
            }
        } else {
            this.showNotification('Ошибка сохранения настроек!', 'error');
        }
    }

    updateUserProfile(updates) {
        try {
            // Update current user
            Object.assign(this.currentUser, updates);
            setCurrentUser(this.currentUser);
            
            // Update in users database
            const users = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                Object.assign(users[userIndex], updates);
                localStorage.setItem('animePlatformUsers', JSON.stringify(users));
            }
            
            return true;
        } catch (error) {
            console.error('Error updating user profile:', error);
            return false;
        }
    }

    handleAvatarChange(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Check if file is an image
        if (!file.type.match('image.*')) {
            this.showNotification('Пожалуйста, выберите изображение', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const avatarImage = document.getElementById('avatar-image');
            if (avatarImage) {
                avatarImage.src = event.target.result;
                
                // Save new avatar
                this.updateUserProfile({ avatar: event.target.result });
                this.showNotification('Аватар успешно обновлен!', 'success');
            }
        };
        reader.readAsDataURL(file);
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.background = type === 'error' ? '#ff6b9c' : '#6c8cff';
        
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.profile-container')) {
        new ProfileManager();
    }
});