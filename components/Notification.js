// components/Notification.js - Компонент для уведомлений
class NotificationComponent {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = 5;
        this.defaultDuration = 3000;
        this.init();
    }

    /**
     * Инициализация компонента
     */
    init() {
        // Создаем контейнер для уведомлений
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        this.container.id = 'notification-container';
        document.body.appendChild(this.container);

        // Добавляем стили, если их еще нет
        this.injectStyles();
    }

    /**
     * Инъекция стилей для уведомлений
     */
    injectStyles() {
        if (document.getElementById('notification-styles')) {
            return; // Стили уже добавлены
        }

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
                pointer-events: none;
            }

            .notification-item {
                background: #3182ce;
                color: white;
                padding: 14px 20px;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: notificationSlideIn 0.3s ease forwards;
                pointer-events: auto;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 250px;
                max-width: 400px;
                word-wrap: break-word;
                position: relative;
            }

            .notification-item.success {
                background: linear-gradient(135deg, #38a169, #2f855a);
            }

            .notification-item.error {
                background: linear-gradient(135deg, #e53e3e, #c53030);
            }

            .notification-item.warning {
                background: linear-gradient(135deg, #d69e2e, #b7791f);
            }

            .notification-item.info {
                background: linear-gradient(135deg, #3182ce, #2c5282);
            }

            .notification-icon {
                font-size: 20px;
                flex-shrink: 0;
            }

            .notification-content {
                flex: 1;
                font-size: 14px;
                line-height: 1.5;
            }

            .notification-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
                transition: all 0.2s ease;
                padding: 0;
            }

            .notification-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }

            @keyframes notificationSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes notificationSlideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }

            .notification-item.slide-out {
                animation: notificationSlideOut 0.3s ease forwards;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Показ уведомления
     * @param {string} message - Сообщение
     * @param {string} type - Тип ('success', 'error', 'info', 'warning')
     * @param {number} duration - Длительность в миллисекундах (0 = бесконечно)
     * @returns {string} ID уведомления
     */
    show(message, type = 'info', duration = this.defaultDuration) {
        // Удаляем старые уведомления, если их слишком много
        if (this.notifications.length >= this.maxNotifications) {
            const oldest = this.notifications.shift();
            this.remove(oldest.id);
        }

        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const notification = this.createNotification(id, message, type);
        
        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification, timer: null });

        // Автоматическое удаление
        if (duration > 0) {
            const timer = setTimeout(() => {
                this.remove(id);
            }, duration);
            this.notifications[this.notifications.length - 1].timer = timer;
        }

        return id;
    }

    /**
     * Создание элемента уведомления
     * @param {string} id - ID уведомления
     * @param {string} message - Сообщение
     * @param {string} type - Тип
     * @returns {HTMLElement} Элемент уведомления
     */
    createNotification(id, message, type) {
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification-item ${type}`;

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };

        notification.innerHTML = `
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-content">${this.escapeHtml(message)}</span>
            <button class="notification-close" aria-label="Закрыть">×</button>
        `;

        // Обработчик закрытия
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.remove(id);
        });

        return notification;
    }

    /**
     * Удаление уведомления
     * @param {string} id - ID уведомления
     */
    remove(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;

        const notification = this.notifications[index];
        
        // Очищаем таймер
        if (notification.timer) {
            clearTimeout(notification.timer);
        }

        // Анимация удаления
        notification.element.classList.add('slide-out');
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            this.notifications.splice(index, 1);
        }, 300);
    }

    /**
     * Удаление всех уведомлений
     */
    clear() {
        this.notifications.forEach(notification => {
            if (notification.timer) {
                clearTimeout(notification.timer);
            }
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
        });
        this.notifications = [];
    }

    /**
     * Экранирование HTML
     * @param {string} text - Текст для экранирования
     * @returns {string} Экранированный текст
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Успешное уведомление
     * @param {string} message - Сообщение
     * @param {number} duration - Длительность
     */
    success(message, duration = this.defaultDuration) {
        return this.show(message, 'success', duration);
    }

    /**
     * Уведомление об ошибке
     * @param {string} message - Сообщение
     * @param {number} duration - Длительность
     */
    error(message, duration = this.defaultDuration) {
        return this.show(message, 'error', duration);
    }

    /**
     * Информационное уведомление
     * @param {string} message - Сообщение
     * @param {number} duration - Длительность
     */
    info(message, duration = this.defaultDuration) {
        return this.show(message, 'info', duration);
    }

    /**
     * Предупреждение
     * @param {string} message - Сообщение
     * @param {number} duration - Длительность
     */
    warning(message, duration = this.defaultDuration) {
        return this.show(message, 'warning', duration);
    }
}

// Создаем глобальный экземпляр
if (typeof window !== 'undefined') {
    // Инициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.notificationComponent = new NotificationComponent();
        });
    } else {
        window.notificationComponent = new NotificationComponent();
    }

    // Обновляем Helpers.showNotification для использования нового компонента
    if (window.Helpers) {
        const originalShowNotification = window.Helpers.showNotification;
        window.Helpers.showNotification = function(message, type = 'info', duration = 3000) {
            if (window.notificationComponent) {
                window.notificationComponent.show(message, type, duration);
            } else {
                originalShowNotification.call(this, message, type, duration);
            }
        };
    }
}

// Экспорт для модульных систем
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationComponent;
}

