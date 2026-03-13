// Переменные для отслеживания количества вкладок
let tabCounter = 4;

// Функция для переключения вкладок
function switchTab(tabId) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // Показываем выбранную вкладку
    document.getElementById(tabId).classList.add('active');

    // Обновляем активное состояние кнопок
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    // Находим кнопку с соответствующим data-tab атрибутом
    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    // Загружаем содержимое вкладки при необходимости
    loadTab(tabId);
}

// Функция для загрузки содержимого вкладки
function loadTab(tabId) {
    const tabPane = document.getElementById(tabId);
    const iframe = tabPane.querySelector('iframe');
    const loadingId = tabId.replace('tab', '');
    const siteId = loadingId === '1' ? 'home' : `site${loadingId}`;

    // Показываем загрузку
    showLoading(siteId);

    // Определяем путь к сайту
    let src = '';
    if (tabId === 'tab1') {
        src = 'about:blank';
    } else {
        const siteNumber = tabId.replace('tab', '');
        src = `site${siteNumber}/index.html`;
    }

    // Устанавливаем новый src для перезагрузки
    iframe.src = src;
}

// Функции для управления загрузкой
function showLoading(siteId) {
    const loadingEl = document.getElementById(`loading-${siteId}`);
    const errorEl = document.getElementById(`error-${siteId}`);
    if (loadingEl) {
        loadingEl.classList.add('active');
    }
    if (errorEl) {
        errorEl.classList.remove('active');
    }
}

function hideLoading(siteId) {
    const loadingEl = document.getElementById(`loading-${siteId}`);
    const errorEl = document.getElementById(`error-${siteId}`);
    if (loadingEl) {
        loadingEl.classList.remove('active');
    }
    if (errorEl) {
        errorEl.classList.remove('active');
    }
}

function showError(siteId) {
    const loadingEl = document.getElementById(`loading-${siteId}`);
    const errorEl = document.getElementById(`error-${siteId}`);
    if (loadingEl) {
        loadingEl.classList.remove('active');
    }
    if (errorEl) {
        errorEl.classList.add('active');
    }
}

// Функции для модального окна
function openModal() {
    document.getElementById('addSiteModal').classList.add('active');
}

function closeModal() {
    document.getElementById('addSiteModal').classList.remove('active');
}

// Функция для добавления нового сайта
function addNewSite() {
    const siteName = document.getElementById('siteName').value || 'Новый сайт';
    const sitePath = document.getElementById('sitePath').value || `site${tabCounter + 1}/`;

    // Увеличиваем счетчик
    tabCounter++;
    const newTabId = `tab${tabCounter}`;
    const siteId = `site${tabCounter}`;

    // Добавляем новую кнопку вкладки
    const tabsHeader = document.querySelector('.tabs-header');
    const addButton = document.querySelector('.add-site-btn');

    const newButton = document.createElement('button');
    newButton.className = 'tab-button';
    newButton.setAttribute('data-tab', newTabId);
    newButton.textContent = siteName;

    // Вставляем перед кнопкой добавления
    tabsHeader.insertBefore(newButton, addButton);

    // Добавляем новую вкладку
    const tabContent = document.querySelector('.tab-content');

    const newPane = document.createElement('div');
    newPane.className = 'tab-pane';
    newPane.id = newTabId;

    newPane.innerHTML = `
                <div class="iframe-container">
                    <div class="loading-overlay active" id="loading-${siteId}">
                        <div class="spinner"></div>
                    </div>
                    <div class="error-message" id="error-${siteId}">
                        <h3>Ошибка загрузки!!!</h3>
                        <p>Не удалось загрузить сайт из папки ${sitePath}</p>
                        <button onclick="loadTab('${newTabId}')">Повторить</button>
                    </div>
                    <iframe src="${sitePath}index.html" title="${siteName}" onload="hideLoading('${siteId}')" onerror="showError('${siteId}')"></iframe>
                </div>
            `;

    tabContent.appendChild(newPane);

    // Обновляем информацию о папках
    updateSiteInfo();

    // Переключаемся на новую вкладку
    switchTab(newTabId);

    // Закрываем модальное окно
    closeModal();

    // Очищаем поля ввода
    document.getElementById('siteName').value = '';
    document.getElementById('sitePath').value = '';
}

// Функция для обновления информации о папках
function updateSiteInfo() {
    const siteInfo = document.querySelector('.site-info p');
    const folders = [];

    // Собираем все пути из вкладок (кроме главной)
    document.querySelectorAll('.tab-pane').forEach((pane, index) => {
        if (index > 0) { // Пропускаем главную
            const iframe = pane.querySelector('iframe');
            if (iframe) {
                const src = iframe.src;
                const pathMatch = src.match(/\/\/[^\/]+\/([^\/]+)\//);
                if (pathMatch && pathMatch[1]) {
                    folders.push(pathMatch[1] + '/');
                }
            }
        }
    });

    if (folders.length > 0) {
        siteInfo.innerHTML = `📁 <strong>Папки с сайтами:</strong> ${folders.join(', ')}`;
    }
}

// Добавляем обработчики событий для кнопок вкладок
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        switchTab(tabId);
    });
});

// Закрытие модального окна при клике вне его
window.onclick = function (event) {
    const modal = document.getElementById('addSiteModal');
    if (event.target === modal) {
        closeModal();
    }
};

// Инициализация: загружаем первую вкладку
document.addEventListener('DOMContentLoaded', () => {
    hideLoading('home');
});