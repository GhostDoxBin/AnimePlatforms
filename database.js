// database.js - Полная база данных с файловой системой и защитой администратора
class AnimeDatabase {
    constructor() {
        this.users = this.loadUsers();
        this.animeList = this.loadAnime();
        this.userSessions = {};
        this.settings = this.loadSettings();
        this.adminAccount = this.getAdminAccount();
        
        this.init();
    }

    init() {
        console.log('🚀 Инициализация базы данных...');
        
        // Сохраняем начальные данные в файлы
        setTimeout(() => {
            if (window.dataManager) {
                window.dataManager.saveUsers();
                window.dataManager.saveAnime();
                window.dataManager.saveSettings(this.settings);
                window.dataManager.addLog('DATABASE_INIT', 'База данных инициализирована');
            }
        }, 1000);
    }

    // 🔒 Защищенный аккаунт администратора (неизменяемый)
    getAdminAccount() {
        return {
            id: 0,
            username: 'superadmin',
            email: 'admin@anime.ru',
            password: 'Admin123!',
            displayName: 'Системный Администратор',
            avatar: 'https://i.pravatar.cc/150?img=1',
            bio: 'Главный администратор платформы. Аккаунт защищен от изменений.',
            joinDate: '2024-01-01',
            role: 'admin',
            protected: true,
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
    }

    // 📥 Загрузка пользователей
    loadUsers() {
        try {
            const usersData = localStorage.getItem('anime_platform_users');
            if (usersData) {
                const users = JSON.parse(usersData);
                console.log(`📊 Загружено ${users.length} пользователей из хранилища`);
                return [this.adminAccount, ...users];
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки пользователей:', error);
        }
        
        // Начальные данные
        console.log('📝 Создание начальных данных пользователей...');
        return [
            this.adminAccount,
            {
                id: 2,
                username: 'animefan',
                email: 'user@anime.ru',
                password: 'User123!',
                displayName: 'АнимеФан',
                avatar: 'https://i.pravatar.cc/150?img=2',
                bio: 'Любитель аниме и манги. Исследую мир японской анимации.',
                joinDate: '2024-01-15',
                role: 'user',
                preferences: {
                    language: 'ru',
                    theme: 'dark',
                    notifications: {
                        email: true,
                        push: false,
                        newsletter: true
                    }
                }
            },
            {
                id: 3,
                username: 'otaku',
                email: 'otaku@anime.ru',
                password: 'Otaku123!',
                displayName: 'Отаку',
                avatar: 'https://i.pravatar.cc/150?img=3',
                bio: 'Настоящий отаку с более чем 10-летним опытом просмотра аниме.',
                joinDate: '2024-01-20',
                role: 'user',
                preferences: {
                    language: 'ru',
                    theme: 'dark',
                    notifications: {
                        email: true,
                        push: true,
                        newsletter: true
                    }
                }
            }
        ];
    }

    // 💾 Сохранение пользователей
    saveUsers() {
        try {
            // Исключаем защищенного администратора из сохранения
            const usersToSave = this.users.filter(user => !user.protected);
            localStorage.setItem('anime_platform_users', JSON.stringify(usersToSave));
            
            if (window.dataManager) {
                window.dataManager.saveUsers();
            }
            
            console.log(`💾 Сохранено ${usersToSave.length} пользователей`);
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения пользователей:', error);
            return false;
        }
    }

    // 📥 Загрузка аниме
    loadAnime() {
        try {
            const animeData = localStorage.getItem('anime_platform_anime');
            if (animeData) {
                const anime = JSON.parse(animeData);
                console.log(`🎬 Загружено ${anime.length} аниме из хранилища`);
                return anime;
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки аниме:', error);
        }
        
        console.log('📝 Создание начального каталога аниме...');
        return this.getInitialAnimeData();
    }

    // 💾 Сохранение аниме
    saveAnime() {
        try {
            localStorage.setItem('anime_platform_anime', JSON.stringify(this.animeList));
            
            if (window.dataManager) {
                window.dataManager.saveAnime();
            }
            
            console.log(`💾 Сохранено ${this.animeList.length} аниме`);
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения аниме:', error);
            return false;
        }
    }

    // ⚙️ Загрузка настроек
    loadSettings() {
        try {
            const settingsData = localStorage.getItem('anime_platform_settings');
            if (settingsData) {
                return JSON.parse(settingsData);
            }
        } catch (error) {
            console.error('❌ Ошибка загрузки настроек:', error);
        }
        
        return this.getDefaultSettings();
    }

    // 💾 Сохранение настроек
    saveSettings() {
        try {
            localStorage.setItem('anime_platform_settings', JSON.stringify(this.settings));
            
            if (window.dataManager) {
                window.dataManager.saveSettings(this.settings);
            }
            
            console.log('⚙️ Настройки сохранены');
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения настроек:', error);
            return false;
        }
    }

    // 📝 Логирование в файл
    saveToLog(type, message) {
        try {
            if (window.dataManager) {
                window.dataManager.addLog(message, type);
            }
            
            // Дублируем в консоль для отладки
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}] ${type}: ${message}`);
        } catch (error) {
            console.error('❌ Ошибка сохранения лога:', error);
        }
    }

    // 📤 Экспорт всех данных
    exportData() {
        const data = {
            exportDate: new Date().toISOString(),
            version: '2.0.0',
            users: this.users.filter(user => !user.protected),
            anime: this.animeList,
            settings: this.settings,
            stats: {
                totalUsers: this.users.length,
                totalAnime: this.animeList.length,
                totalSessions: Object.keys(this.userSessions).length,
                adminUsers: this.users.filter(user => user.role === 'admin').length,
                protectedUsers: this.users.filter(user => user.protected).length
            }
        };
        
        this.saveToLog('DATA_EXPORT', 'Экспорт всех данных платформы');
        return data;
    }

    // 📥 Импорт данных
    importData(data) {
        try {
            if (!data || !data.users || !data.anime) {
                throw new Error('Некорректный формат данных');
            }

            // Сохраняем старые данные для бэкапа
            const backup = {
                users: this.users.filter(user => !user.protected),
                anime: this.animeList,
                settings: this.settings
            };

            // Импортируем новые данные
            this.users = [this.adminAccount, ...data.users];
            this.animeList = data.anime;
            this.settings = data.settings || this.getDefaultSettings();

            // Сохраняем изменения
            this.saveUsers();
            this.saveAnime();
            this.saveSettings();

            this.saveToLog('DATA_IMPORT', `Успешный импорт: ${data.users.length} пользователей, ${data.anime.length} аниме`);
            
            return {
                success: true,
                message: `Импортировано: ${data.users.length} пользователей, ${data.anime.length} аниме`,
                backup: backup
            };
        } catch (error) {
            console.error('❌ Ошибка импорта данных:', error);
            this.saveToLog('DATA_IMPORT_ERROR', `Ошибка импорта: ${error.message}`);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    // 📋 Получение логов
    getLogs() {
        if (window.dataManager) {
            return window.dataManager.readFromFile('logs.txt') || 'Логи отсутствуют';
        }
        return 'Менеджер данных не загружен';
    }

    // 🗑️ Очистка логов
    clearLogs() {
        if (window.dataManager) {
            window.dataManager.clearFile('logs.txt');
            this.saveToLog('LOGS_CLEARED', 'Очистка системных логов');
        }
    }

    // 👥 МЕТОДЫ ДЛЯ РАБОТЫ С ПОЛЬЗОВАТЕЛЯМИ

    findUserByEmail(email) {
        return this.users.find(user => user.email === email);
    }

    findUserByUsername(username) {
        return this.users.find(user => user.username === username);
    }

    getUserById(id) {
        return this.users.find(user => user.id === parseInt(id));
    }

    createUser(userData) {
        // Проверка уникальности
        if (this.findUserByEmail(userData.email)) {
            throw new Error('Пользователь с таким email уже существует');
        }

        if (this.findUserByUsername(userData.username)) {
            throw new Error('Пользователь с таким именем уже существует');
        }

        const newUser = {
            id: Date.now(),
            ...userData,
            joinDate: new Date().toISOString().split('T')[0],
            role: 'user',
            preferences: userData.preferences || {
                language: 'ru',
                theme: 'dark',
                notifications: {
                    email: true,
                    push: true,
                    newsletter: false
                }
            }
        };
        
        this.users.push(newUser);
        this.saveUsers();
        
        this.saveToLog('USER_CREATED', `Создан пользователь: ${newUser.username} (${newUser.email})`);
        
        return newUser;
    }

    updateUser(userId, updates) {
        const userIndex = this.users.findIndex(user => user.id === parseInt(userId));
        if (userIndex === -1) {
            throw new Error('Пользователь не найден');
        }

        const user = this.users[userIndex];
        
        // 🔒 Защита администратора от изменений
        if (user.protected) {
            this.saveToLog('ADMIN_PROTECTED', `Попытка изменения защищенного администратора: ${user.username}`);
            throw new Error('Защищенный аккаунт администратора нельзя изменять');
        }

        // Проверка уникальности email
        if (updates.email && updates.email !== user.email) {
            const existingUser = this.findUserByEmail(updates.email);
            if (existingUser && existingUser.id !== parseInt(userId)) {
                throw new Error('Пользователь с таким email уже существует');
            }
        }

        // Проверка уникальности username
        if (updates.username && updates.username !== user.username) {
            const existingUser = this.findUserByUsername(updates.username);
            if (existingUser && existingUser.id !== parseInt(userId)) {
                throw new Error('Пользователь с таким именем уже существует');
            }
        }

        this.users[userIndex] = { ...user, ...updates };
        this.saveUsers();
        
        this.saveToLog('USER_UPDATED', `Обновлен пользователь: ${user.username}`);
        return this.users[userIndex];
    }

    deleteUser(userId) {
        const userIndex = this.users.findIndex(user => user.id === parseInt(userId));
        if (userIndex === -1) {
            throw new Error('Пользователь не найден');
        }

        const user = this.users[userIndex];
        
        // 🔒 Защита администратора от удаления
        if (user.protected) {
            this.saveToLog('ADMIN_PROTECTED', `Попытка удаления защищенного администратора: ${user.username}`);
            throw new Error('Защищенный аккаунт администратора нельзя удалять');
        }

        this.users.splice(userIndex, 1);
        this.saveUsers();
        
        this.saveToLog('USER_DELETED', `Удален пользователь: ${user.username}`);
        return true;
    }

    changePassword(userId, currentPassword, newPassword) {
        const user = this.getUserById(userId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        if (user.password !== currentPassword) {
            throw new Error('Неверный текущий пароль');
        }

        // 🔒 Защита администратора от смены пароля
        if (user.protected) {
            this.saveToLog('ADMIN_PROTECTED', `Попытка смены пароля защищенного администратора: ${user.username}`);
            throw new Error('Пароль защищенного администратора нельзя изменять');
        }

        return this.updateUser(userId, { password: newPassword });
    }

    // 🎬 МЕТОДЫ ДЛЯ РАБОТЫ С АНИМЕ

    getAnimeById(id) {
        return this.animeList.find(anime => anime.id === parseInt(id));
    }

    searchAnime(query, filters = {}) {
        let results = this.animeList.filter(anime => {
            const matchesSearch = !query || 
                anime.title.toLowerCase().includes(query.toLowerCase()) ||
                anime.originalTitle?.toLowerCase().includes(query.toLowerCase()) ||
                anime.description.toLowerCase().includes(query.toLowerCase());
            
            const matchesGenre = !filters.genre || anime.genre === filters.genre;
            const matchesYear = !filters.year || anime.year.toString() === filters.year;
            const matchesRating = !filters.rating || anime.rating >= parseFloat(filters.rating);
            const matchesType = !filters.type || anime.type === filters.type;
            const matchesStatus = !filters.status || anime.status === filters.status;
            
            return matchesSearch && matchesGenre && matchesYear && matchesRating && matchesType && matchesStatus;
        });

        // Сортировка
        if (filters.sort) {
            results.sort((a, b) => {
                switch (filters.sort) {
                    case 'rating': return b.rating - a.rating;
                    case 'year': return b.year - a.year;
                    case 'popularity': return b.popularity - a.popularity;
                    case 'title': return a.title.localeCompare(b.title);
                    case 'episodes': return b.episodes - a.episodes;
                    default: return 0;
                }
            });
        }

        return results;
    }

    addAnime(animeData) {
        // Проверка уникальности названия
        const existingAnime = this.animeList.find(anime => 
            anime.title.toLowerCase() === animeData.title.toLowerCase()
        );
        
        if (existingAnime) {
            throw new Error('Аниме с таким названием уже существует');
        }

        const newAnime = {
            id: Date.now(),
            ...animeData,
            episodesList: this.generateEpisodes(animeData.episodes || 12, animeData.title),
            votes: animeData.votes || 0,
            popularity: animeData.popularity || 50,
            createdAt: new Date().toISOString()
        };
        
        this.animeList.push(newAnime);
        this.saveAnime();
        
        this.saveToLog('ANIME_ADDED', `Добавлено аниме: "${newAnime.title}"`);
        
        return newAnime;
    }

    updateAnime(animeId, updates) {
        const animeIndex = this.animeList.findIndex(anime => anime.id === parseInt(animeId));
        if (animeIndex === -1) {
            throw new Error('Аниме не найдено');
        }

        // Проверка уникальности названия
        if (updates.title) {
            const existingAnime = this.animeList.find(anime => 
                anime.title.toLowerCase() === updates.title.toLowerCase() && 
                anime.id !== parseInt(animeId)
            );
            
            if (existingAnime) {
                throw new Error('Аниме с таким названием уже существует');
            }
        }

        this.animeList[animeIndex] = { 
            ...this.animeList[animeIndex], 
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        this.saveAnime();
        
        this.saveToLog('ANIME_UPDATED', `Обновлено аниме: "${this.animeList[animeIndex].title}"`);
        
        return this.animeList[animeIndex];
    }

    deleteAnime(animeId) {
        const animeIndex = this.animeList.findIndex(anime => anime.id === parseInt(animeId));
        if (animeIndex === -1) {
            throw new Error('Аниме не найдено');
        }

        const animeTitle = this.animeList[animeIndex].title;
        this.animeList.splice(animeIndex, 1);
        this.saveAnime();
        
        this.saveToLog('ANIME_DELETED', `Удалено аниме: "${animeTitle}"`);
        
        return true;
    }

    generateEpisodes(count, title) {
        const episodes = [];
        for (let i = 1; i <= count; i++) {
            episodes.push({
                number: i,
                title: `${title} - Эпизод ${i}`,
                duration: "24:00",
                thumbnail: `https://via.placeholder.com/300x169/333/fff?text=Эпизод+${i}`,
                description: `Эпизод ${i} аниме "${title}". Захватывающее продолжение истории.`,
                videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
            });
        }
        return episodes;
    }

    // 🎯 НАЧАЛЬНЫЕ ДАННЫЕ АНИМЕ
    getInitialAnimeData() {
        // Пустой массив - админ добавляет аниме через админ панель
        return [];
    }

    // ⚙️ НАСТРОЙКИ ПО УМОЛЧАНИЮ
    getDefaultSettings() {
        return {
            siteName: "АнимеПлатформа",
            version: "2.0.0",
            maintenance: false,
            features: {
                ratings: true,
                comments: true,
                favorites: true,
                adminPanel: true,
                userRegistration: true,
                darkMode: true
            },
            limits: {
                maxFileSize: 10, // MB
                maxUsers: 1000,
                maxAnime: 5000
            },
            security: {
                sessionTimeout: 24, // hours
                passwordMinLength: 6,
                requireStrongPassword: false
            }
        };
    }

    // 🔐 СЕССИИ ПОЛЬЗОВАТЕЛЕЙ
    createSession(user) {
        const sessionId = 'session_' + Date.now();
        this.userSessions[sessionId] = {
            userId: user.id,
            user: user,
            createdAt: new Date(),
            lastActive: new Date(),
            ip: 'local' // В реальном приложении здесь был бы реальный IP
        };
        
        this.saveToLog('SESSION_CREATED', `Создана сессия для: ${user.username}`);
        return sessionId;
    }

    getSession(sessionId) {
        const session = this.userSessions[sessionId];
        if (session) {
            session.lastActive = new Date();
        }
        return session;
    }

    destroySession(sessionId) {
        const session = this.userSessions[sessionId];
        if (session) {
            this.saveToLog('SESSION_DESTROYED', `Завершена сессия для: ${session.user.username}`);
            delete this.userSessions[sessionId];
        }
    }

    // 📊 СТАТИСТИКА
    getStats() {
        return {
            users: {
                total: this.users.length,
                admins: this.users.filter(user => user.role === 'admin').length,
                protected: this.users.filter(user => user.protected).length,
                activeSessions: Object.keys(this.userSessions).length
            },
            anime: {
                total: this.animeList.length,
                byGenre: this.getAnimeByGenre(),
                byStatus: this.getAnimeByStatus(),
                byYear: this.getAnimeByYear()
            },
            system: {
                version: this.settings.version,
                maintenance: this.settings.maintenance,
                uptime: this.getUptime()
            }
        };
    }

    getAnimeByGenre() {
        const genres = {};
        this.animeList.forEach(anime => {
            genres[anime.genre] = (genres[anime.genre] || 0) + 1;
        });
        return genres;
    }

    getAnimeByStatus() {
        const statuses = {};
        this.animeList.forEach(anime => {
            statuses[anime.status] = (statuses[anime.status] || 0) + 1;
        });
        return statuses;
    }

    getAnimeByYear() {
        const years = {};
        this.animeList.forEach(anime => {
            years[anime.year] = (years[anime.year] || 0) + 1;
        });
        return years;
    }

    getUptime() {
        // В реальном приложении здесь было бы реальное время работы
        return {
            days: 1,
            hours: 5,
            minutes: 23
        };
    }
}

// Создаем глобальный экземпляр базы данных
window.database = new AnimeDatabase();

console.log('✅ База данных AnimePlatform загружена!');
console.log('🔐 Защищенный администратор: admin@anime.ru / Admin123!');
console.log('👤 Тестовый пользователь: user@anime.ru / User123!');