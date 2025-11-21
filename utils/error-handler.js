// utils/error-handler.js - Централизованная обработка ошибок
class ErrorHandler {
    constructor(config = {}) {
        this.config = {
            logToConsole: config.logToConsole !== false,
            showNotifications: config.showNotifications !== false,
            logToServer: config.logToServer || false,
            ...config
        };
    }

    /**
     * Обработка ошибки
     * @param {Error|string} error - Ошибка для обработки
     * @param {string} context - Контекст, в котором произошла ошибка
     * @param {Object} metadata - Дополнительные метаданные
     */
    handle(error, context = 'Unknown', metadata = {}) {
        const errorInfo = this._parseError(error);
        const logData = {
            message: errorInfo.message,
            stack: errorInfo.stack,
            context,
            timestamp: new Date().toISOString(),
            ...metadata
        };

        // Логирование в консоль (только в режиме отладки)
        if (this.config.logToConsole && window.Config?.debug?.enabled) {
            console.error(`[${context}]`, errorInfo.message, logData);
        }

        // Логирование на сервер (если настроено)
        if (this.config.logToServer) {
            this._logToServer(logData);
        }

        // Показ уведомления пользователю
        if (this.config.showNotifications) {
            this._showUserNotification(errorInfo.message, context);
        }

        return logData;
    }

    /**
     * Парсинг ошибки в единый формат
     * @private
     */
    _parseError(error) {
        if (error instanceof Error) {
            return {
                message: error.message,
                stack: error.stack,
                name: error.name
            };
        }
        
        if (typeof error === 'string') {
            return {
                message: error,
                stack: null,
                name: 'Error'
            };
        }
        
        return {
            message: 'Неизвестная ошибка',
            stack: null,
            name: 'UnknownError'
        };
    }

    /**
     * Показ уведомления пользователю
     * @private
     */
    _showUserNotification(message, context) {
        // Используем существующую функцию showNotification, если она есть
        if (typeof showNotification === 'function') {
            showNotification(message, 'error');
            return;
        }

        // Иначе создаем уведомление вручную
        const notification = document.createElement('div');
        notification.className = 'error-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e53e3e;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
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
        }, 5000);
    }

    /**
     * Отправка лога на сервер
     * @private
     */
    async _logToServer(logData) {
        try {
            if (window.Config?.api?.baseUrl) {
                await fetch(`${window.Config.api.baseUrl}/logs`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(logData)
                });
            }
        } catch (err) {
            // Не логируем ошибки логирования, чтобы избежать бесконечного цикла
            if (this.config.logToConsole) {
                console.warn('Не удалось отправить лог на сервер:', err);
            }
        }
    }

    /**
     * Обработка ошибок асинхронных операций
     */
    async handleAsync(operation, context, fallback = null) {
        try {
            return await operation();
        } catch (error) {
            this.handle(error, context);
            if (fallback) {
                return fallback(error);
            }
            return null;
        }
    }

    /**
     * Валидация данных с обработкой ошибок
     */
    validate(data, schema, context = 'Validation') {
        try {
            // Простая валидация (можно расширить)
            if (!data) {
                throw new Error('Данные отсутствуют');
            }
            
            if (schema && typeof schema === 'object') {
                for (const [key, validator] of Object.entries(schema)) {
                    if (validator.required && !data[key]) {
                        throw new Error(`Поле "${key}" обязательно для заполнения`);
                    }
                    
                    if (data[key] && validator.type && typeof data[key] !== validator.type) {
                        throw new Error(`Поле "${key}" должно быть типа ${validator.type}`);
                    }
                }
            }
            
            return { valid: true, errors: [] };
        } catch (error) {
            this.handle(error, context);
            return { valid: false, errors: [error.message] };
        }
    }
}

// Создаем глобальный экземпляр
const errorHandler = new ErrorHandler({
    logToConsole: true,
    showNotifications: true
});

// Экспорт
if (typeof window !== 'undefined') {
    window.errorHandler = errorHandler;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
}






