// Функция для обновления URL с параметрами фильтров
function updateUrlParams() {
    const form = document.querySelector('.filters-form');
    const formData = new FormData(form);
    const params = new URLSearchParams(formData);
    
    // Обновляем URL без перезагрузки страницы
    window.history.replaceState({}, '', `${location.pathname}?${params}`);
}

// Добавляем обработчики событий для фильтров
document.addEventListener('DOMContentLoaded', function() {
    const filterSelects = document.querySelectorAll('.filter-select');
    
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            // Можно добавить анимацию загрузки здесь
            this.form.submit();
        });
    });
    
    // Инициализация текущих параметров URL
    updateUrlParams();
});

// Функция для отображения/скрытия loading состояния
function toggleLoading(show) {
    const loadingElement = document.getElementById('loading') || createLoadingElement();
    loadingElement.style.display = show ? 'block' : 'none';
}

function createLoadingElement() {
    const loading = document.createElement('div');
    loading.id = 'loading';
    loading.innerHTML = 'Загрузка...';
    loading.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(30, 41, 59, 0.9);
        padding: 20px 40px;
        border-radius: 10px;
        color: white;
        z-index: 1000;
        display: none;
    `;
    document.body.appendChild(loading);
    return loading;
}