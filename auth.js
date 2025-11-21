// Authentication functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    // Check if we're on auth pages
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    if (loginForm) {
        setupLoginForm();
    }
    
    if (signupForm) {
        setupSignupForm();
    }
    
    // Check auth status on all pages
    checkAuthStatus();
}

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    
    if (!loginForm || !emailInput || !passwordInput) {
        console.warn('Login form elements not found');
        return;
    }
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        let isValid = true;

        // Reset errors
        hideError('login-email-error');
        hideError('login-password-error');
        emailInput.classList.remove('error');
        passwordInput.classList.remove('error');

        // Validation
        if (!validateEmail(email)) {
            showError('login-email-error', 'Пожалуйста, введите корректный email');
            emailInput.classList.add('error');
            isValid = false;
        }

        if (password.length < 1) {
            showError('login-password-error', 'Пожалуйста, введите пароль');
            passwordInput.classList.add('error');
            isValid = false;
        }

        if (isValid) {
            // Authentication with user database
            const users = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                // Используем authService если доступен
                if (window.authService) {
                    window.authService.setCurrentUser(user);
                } else if (window.setCurrentUser) {
                    window.setCurrentUser(user);
                } else if (typeof setCurrentUser === 'function') {
                    setCurrentUser(user);
                }
                
                showNotification('Вход выполнен успешно!', 'success');
                setTimeout(() => {
                    // Redirect based on user role
                    if (user.isAdmin && user.adminLevel >= 1) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'index.html';
                    }
                }, 1000);
            } else {
                showNotification('Неверный email или пароль!', 'error');
            }
        }
    });
}

function setupSignupForm() {
    const signupForm = document.getElementById('signup-form');
    const usernameInput = document.getElementById('signup-username');
    const emailInput = document.getElementById('signup-email');
    const passwordInput = document.getElementById('signup-password');
    const confirmPasswordInput = document.getElementById('signup-confirm-password');
    
    if (!signupForm || !usernameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
        console.warn('Signup form elements not found');
        return;
    }
    
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        let isValid = true;

        // Reset errors
        resetSignupErrors();

        // Validation
        if (username.length < 3) {
            showError('signup-username-error', 'Имя пользователя должно содержать минимум 3 символа');
            usernameInput.classList.add('error');
            isValid = false;
        }

        if (!validateEmail(email)) {
            showError('signup-email-error', 'Пожалуйста, введите корректный email');
            emailInput.classList.add('error');
            isValid = false;
        }

        if (password.length < 6) {
            showError('signup-password-error', 'Пароль должен содержать не менее 6 символов');
            passwordInput.classList.add('error');
            isValid = false;
        }

        if (password !== confirmPassword) {
            showError('signup-confirm-password-error', 'Пароли не совпадают');
            confirmPasswordInput.classList.add('error');
            isValid = false;
        }

        // Check if user exists
        const users = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
        if (users.find(u => u.email === email)) {
            showError('signup-email-error', 'Этот email уже зарегистрирован');
            emailInput.classList.add('error');
            isValid = false;
        }

        if (users.find(u => u.username === username)) {
            showError('signup-username-error', 'Это имя пользователя уже занято');
            usernameInput.classList.add('error');
            isValid = false;
        }

        if (isValid) {
            const newUser = {
                id: Date.now(),
                username: username,
                email: email,
                password: password,
                displayName: username,
                avatar: 'https://via.placeholder.com/150',
                bio: '',
                joinDate: new Date().toISOString(),
                isAdmin: false,
                adminLevel: 0,
                preferences: {
                    language: 'ru',
                    theme: 'dark',
                    notifications: {
                        email: true,
                        push: true,
                        newsletter: false
                    }
                }
            };

            users.push(newUser);
            localStorage.setItem('animePlatformUsers', JSON.stringify(users));
            
            // Используем authService если доступен
            if (window.authService) {
                window.authService.setCurrentUser(newUser);
            } else if (window.setCurrentUser) {
                window.setCurrentUser(newUser);
            } else if (typeof setCurrentUser === 'function') {
                setCurrentUser(newUser);
            }
            
            showNotification('Регистрация прошла успешно!', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    });
}

function resetSignupErrors() {
    const errors = [
        'signup-username-error',
        'signup-email-error',
        'signup-password-error',
        'signup-confirm-password-error'
    ];
    
    errors.forEach(id => hideError(id));
    
    const inputs = [
        'signup-username',
        'signup-email',
        'signup-password',
        'signup-confirm-password'
    ];
    
    inputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.classList.remove('error');
    });
}

function validateEmail(email) {
    // Используем Helpers если доступен
    if (window.Helpers && window.Helpers.validateEmail) {
        return window.Helpers.validateEmail(email);
    }
    
    // Fallback реализация
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

function checkAuthStatus() {
    // Используем authService если доступен
    if (window.authService) {
        const authButtons = document.querySelector('.auth-buttons');
        const adminLink = document.getElementById('admin-link');
        window.authService.updateAuthUI(authButtons, adminLink);
        return;
    }
    
    // Fallback реализация
    let currentUser = null;
    if (window.getCurrentUser && typeof window.getCurrentUser === 'function') {
        currentUser = window.getCurrentUser();
    } else if (typeof getCurrentUser === 'function') {
        currentUser = getCurrentUser();
    }
    const authButtons = document.querySelector('.auth-buttons');
    const adminLink = document.getElementById('admin-link');
    
    if (authButtons) {
        if (currentUser) {
            const avatarUrl = currentUser.avatar || 'https://i.pravatar.cc/150?img=1';
            authButtons.innerHTML = `
                <a href="profile.html" class="btn btn-profile">
                    <img src="${avatarUrl}" alt="Аватар" class="profile-avatar" onerror="this.src='https://i.pravatar.cc/150?img=1'">
                    <span class="profile-username">${currentUser.username || currentUser.displayName || 'Профиль'}</span>
                </a>
                <a href="#" class="btn btn-login" id="logout-btn">Выйти</a>
            `;
            
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (typeof logout === 'function') {
                        logout();
                    } else if (window.logout) {
                        window.logout();
                    }
                });
            }

            if (adminLink && currentUser.isAdmin && currentUser.adminLevel >= 1) {
                adminLink.style.display = 'block';
                adminLink.innerHTML = `<a href="admin.html" class="admin-god">Админ</a>`;
            }
        } else {
            authButtons.innerHTML = `
                <a href="login.html" class="btn btn-login">Войти</a>
                <a href="signup.html" class="btn btn-signup">Регистрация</a>
            `;
            
            if (adminLink) {
                adminLink.style.display = 'none';
            }
        }
    }
}

function showNotification(message, type = 'info') {
    // Используем Helpers если доступен
    if (window.Helpers && window.Helpers.showNotification) {
        window.Helpers.showNotification(message, type);
        return;
    }
    
    // Fallback реализация
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#e53e3e' : type === 'success' ? '#38a169' : '#3182ce'};
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

// Initialize default admin user if not exists
function initializeDefaultAdmin() {
    const users = JSON.parse(localStorage.getItem('animePlatformUsers') || '[]');
    
    // Check if admin user already exists
    const adminExists = users.some(user => user.isAdmin && user.adminLevel === 5);
    
    if (!adminExists) {
        const adminUser = {
            id: 1,
            username: 'admin',
            email: 'admin@anime.ru',
            password: 'admin123',
            displayName: 'Администратор',
            avatar: 'https://via.placeholder.com/150',
            bio: 'Главный администратор платформы',
            joinDate: new Date().toISOString(),
            isAdmin: true,
            adminLevel: 5,
            preferences: {
                language: 'ru',
                theme: 'dark',
                notifications: {
                    email: true,
                    push: true,
                    newsletter: true
                }
            }
        };
        
        users.push(adminUser);
        localStorage.setItem('animePlatformUsers', JSON.stringify(users));
        console.log('Default admin user created: admin@anime.ru / admin123');
    }
}

// Initialize default admin on first load
document.addEventListener('DOMContentLoaded', initializeDefaultAdmin);