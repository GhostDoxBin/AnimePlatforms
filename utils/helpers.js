// utils/helpers.js - Вспомогательные функции
class Helpers {
    /**
     * Генерация звездного рейтинга
     * @param {number} rating - Рейтинг от 0 до 10
     * @returns {string} HTML строка со звездами
     */
    static generateStars(rating) {
        const fullStars = Math.floor(rating / 2);
        const halfStar = rating % 2 >= 1;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);
    }

    /**
     * Валидация email
     * @param {string} email - Email для проверки
     * @returns {boolean} true если email валиден
     */
    static validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    /**
     * Обрезка текста до указанной длины
     * @param {string} text - Текст для обрезки
     * @param {number} maxLength - Максимальная длина
     * @param {string} suffix - Суффикс (по умолчанию '...')
     * @returns {string} Обрезанный текст
     */
    static truncateText(text, maxLength = 100, suffix = '...') {
        if (!text || text.length <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength) + suffix;
    }

    /**
     * Безопасное получение элемента
     * @param {string} selector - CSS селектор
     * @param {HTMLElement} context - Контекст поиска (по умолчанию document)
     * @returns {HTMLElement|null} Найденный элемент или null
     */
    static getElement(selector, context = document) {
        try {
            return context.querySelector(selector);
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'Helpers.getElement');
            }
            return null;
        }
    }

    /**
     * Безопасное получение всех элементов
     * @param {string} selector - CSS селектор
     * @param {HTMLElement} context - Контекст поиска (по умолчанию document)
     * @returns {NodeList|Array} Найденные элементы
     */
    static getElements(selector, context = document) {
        try {
            return context.querySelectorAll(selector);
        } catch (error) {
            if (window.errorHandler) {
                window.errorHandler.handle(error, 'Helpers.getElements');
            }
            return [];
        }
    }

    /**
     * Показ уведомления
     * @param {string} message - Сообщение
     * @param {string} type - Тип ('success', 'error', 'info', 'warning')
     * @param {number} duration - Длительность в миллисекундах
     */
    static showNotification(message, type = 'info', duration = 3000) {
        const colors = {
            success: '#38a169',
            error: '#e53e3e',
            info: '#3182ce',
            warning: '#d69e2e'
        };

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.info};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    /**
     * Дебаунс функции
     * @param {Function} func - Функция для дебаунса
     * @param {number} wait - Время ожидания в миллисекундах
     * @returns {Function} Дебаунсированная функция
     */
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Форматирование даты
     * @param {Date|string|number} date - Дата для форматирования
     * @param {string} format - Формат ('ru', 'en', 'iso')
     * @returns {string} Отформатированная дата
     */
    static formatDate(date, format = 'ru') {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            return 'Неверная дата';
        }

        if (format === 'iso') {
            return d.toISOString();
        }

        if (format === 'ru') {
            return d.toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        return d.toLocaleDateString('en-US');
    }

    /**
     * Настройка активных ссылок в навигации
     * @param {string} currentPage - Текущая страница
     */
    static setupNavigation(currentPage = null) {
        const navLinks = Helpers.getElements('nav a');
        if (!currentPage) {
            currentPage = window.location.pathname.split('/').pop() || 'index.html';
        }

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === 'index.html' && href === '/')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    /**
     * Обработка ошибок изображений
     * @param {HTMLImageElement} img - Элемент изображения
     * @param {string} fallbackText - Текст для замены
     */
    static handleImageError(img, fallbackText = 'Нет изображения') {
        img.onerror = function() {
            this.style.display = 'none';
            const placeholder = document.createElement('div');
            placeholder.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: #8a99b3;
                background: #2a3a52;
                border-radius: 8px;
            `;
            placeholder.textContent = fallbackText;
            if (this.parentElement) {
                this.parentElement.appendChild(placeholder);
            }
        };
    }
}

// Экспорт
if (typeof window !== 'undefined') {
    window.Helpers = Helpers;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Helpers;
}






