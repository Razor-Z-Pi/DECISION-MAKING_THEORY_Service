// Хранилище для встроенных сайтов (работает без сервера)
let embeddedSites = {
    tab1: {
        type: 'embedded',
        content: `<div style="padding: 40px; text-align: center;">
            <h1 style="color: #667eea; margin-bottom: 20px;">Добро пожаловать!!!</h1>
            <p style="margin-bottom: 20px; line-height: 1.6;">Это локальный навигатор, который работает без веб-сервера.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-top: 20px;">
                <h3 style="color: #333; margin-bottom: 15px;">Возможности:</h3>
                <ul style="text-align: left; display: inline-block;">
                    <li>Загружать HTML файлы с компьютера</li>
                    <li>Редактировать код в реальном времени</li>
                    <li>Сохранять сайты в браузере</li>
                    <li>Импортировать/экспортировать сайты</li>
                    <li>+ Создавать неограниченное количество вкладок</li>
                </ul>
            </div>
            <div class="file-upload-area" style="margin-top: 20px;">
                <p><strong>Загрузить HTML файл для этой вкладки:</strong></p>
                <input type="file" accept=".html,.htm" onchange="uploadFileToCurrentTab(this)">
            </div>
        </div>`
    },
    tab2: {
        type: 'embedded',
        content: `<div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea20, #764ba220); min-height: 100%;">
            <h1 style="color: #667eea;">Сайт 1</h1>
            <p style="margin: 20px 0; color: #666;">Содержимое из папки one_pholder</p>
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px auto; max-width: 600px;">
                <p>Это демонстрационный контент</p>
                <p>Вы можете:</p>
                <ul style="text-align: left; margin-top: 15px;">
                    <li>Загрузить свой HTML файл</li>
                    <li>Редактировать код вручную</li>
                    <li>Сохранить изменения</li>
                </ul>
            </div>
            <button onclick="editCurrentSite()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">Редактировать</button>
        </div>`
    },
    tab3: {
        type: 'embedded',
        content: `<div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea20, #764ba220); min-height: 100%;">
            <h1 style="color: #667eea;">Сайт 2</h1>
            <p style="margin: 20px 0; color: #666;">Содержимое из папки two_pholder</p>
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px auto; max-width: 600px;">
                <p>Это демонстрационный контент</p>
                <p>Вы можете:</p>
                <ul style="text-align: left; margin-top: 15px;">
                    <li>Загрузить свой HTML файл</li>
                    <li>Редактировать код вручную</li>
                    <li>Сохранить изменения</li>
                </ul>
            </div>
            <button onclick="editCurrentSite()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">Редактировать</button>
        </div>`
    },
    tab4: {
        type: 'embedded',
        content: `<div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea20, #764ba220); min-height: 100%;">
            <h1 style="color: #667eea;">Сайт 3</h1>
            <p style="margin: 20px 0; color: #666;">Содержимое из папки three_pholder</p>
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px auto; max-width: 600px;">
                <p>Это демонстрационный контент</p>
                <p>Вы можете:</p>
                <ul style="text-align: left; margin-top: 15px;">
                    <li>Загрузить свой HTML файл</li>
                    <li>Редактировать код вручную</li>
                    <li>Сохранить изменения</li>
                </ul>
            </div>
            <button onclick="editCurrentSite()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">Редактировать</button>
        </div>`
    }
};

let currentEditTab = null;
let nextTabId = 5;

// Загрузка сохраненных сайтов из localStorage
function loadSavedSites() {
    const saved = localStorage.getItem('localSitesV2');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(embeddedSites, parsed);
        } catch (e) {
            console.error('Ошибка загрузки:', e);
        }
    }

    // Отображаем все сайты
    for (let tabId in embeddedSites) {
        if (embeddedSites[tabId].type === 'embedded') {
            displayEmbeddedContent(tabId);
        }
    }
}

// Сохранение всех сайтов
function saveAllSites() {
    localStorage.setItem('localSitesV2', JSON.stringify(embeddedSites));
}

// Отображение встроенного контента
function displayEmbeddedContent(tabId) {
    const tabPane = document.getElementById(tabId);
    if (!tabPane) return;

    const iframeContainer = tabPane.querySelector('.iframe-container');
    if (!iframeContainer) return;

    const site = embeddedSites[tabId];
    if (!site || site.type !== 'embedded') return;

    const iframe = iframeContainer.querySelector('iframe');
    if (iframe) {
        iframe.srcdoc = site.content;
        iframe.onload = () => {
            hideLoading(tabId.replace('tab', ''));
        };
    }

    // Скрываем загрузку
    hideLoading(tabId.replace('tab', ''));
}

// Функции для управления загрузкой
function hideLoading(siteId) {
    const loadingEl = document.getElementById(`loading-${siteId}`);
    if (loadingEl) {
        loadingEl.classList.add('hidden');
    }
}

function showError(siteId) {
    const loadingEl = document.getElementById(`loading-${siteId}`);
    const errorEl = document.getElementById(`error-${siteId}`);
    if (loadingEl) {
        loadingEl.classList.add('hidden');
    }
    if (errorEl) {
        errorEl.classList.remove('hidden');
    }
}

// Загрузка вкладки
function loadTab(tabId) {
    const tabPane = document.getElementById(tabId);
    const iframe = tabPane.querySelector('iframe');
    const siteId = tabId.replace('tab', '');

    // Показываем загрузку
    const loadingEl = document.getElementById(`loading-${siteId}`);
    if (loadingEl) {
        loadingEl.classList.remove('hidden');
    }

    // Скрываем ошибку
    const errorEl = document.getElementById(`error-${siteId}`);
    if (errorEl) {
        errorEl.classList.add('hidden');
    }

    if (embeddedSites[tabId] && embeddedSites[tabId].type === 'embedded') {
        displayEmbeddedContent(tabId);
    } else {
        const src = iframe.getAttribute('src');
        if (src && src !== 'about:blank') {
            iframe.src = src;
        }
    }
}

// Переключение вкладок
function switchTab(tabId) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // Показываем выбранную
    document.getElementById(tabId).classList.add('active');

    // Обновляем активное состояние кнопок
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });

    const activeButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }

    loadTab(tabId);
}

// Загрузка файла в текущую вкладку
function uploadFileToCurrentTab(input) {
    const file = input.files[0];
    if (!file) return;

    const activeTab = document.querySelector('.tab-pane.active').id;
    const reader = new FileReader();

    reader.onload = function (e) {
        // Сохраняем в embeddedSites
        embeddedSites[activeTab] = {
            type: 'embedded',
            content: e.target.result
        };

        // Отображаем
        displayEmbeddedContent(activeTab);
        saveAllSites();

        alert('Файл успешно загружен!');
    };

    reader.readAsText(file);
}

// Редактирование текущего сайта
function editCurrentSite() {
    const activeTab = document.querySelector('.tab-pane.active').id;
    currentEditTab = activeTab;

    const site = embeddedSites[activeTab];
    if (site && site.type === 'embedded') {
        document.getElementById('editTitle').value = `Сайт ${activeTab.replace('tab', '')}`;
        document.getElementById('editHtml').value = site.content;
        document.getElementById('editModal').classList.add('active');
    }
}

// Сохранение редактирования
function saveEdit() {
    if (currentEditTab && embeddedSites[currentEditTab]) {
        embeddedSites[currentEditTab].content = document.getElementById('editHtml').value;
        displayEmbeddedContent(currentEditTab);
        saveAllSites();
        closeModal('editModal');
    }
}

// Добавление нового сайта
function addNewSite() {
    const siteName = document.getElementById('siteName').value || `Сайт ${nextTabId - 3}`;
    const sitePath = document.getElementById('sitePath').value || `site${nextTabId}/`;
    const siteHtml = document.getElementById('siteHtml') ? document.getElementById('siteHtml').value : '';

    const newTabId = `tab${nextTabId}`;

    // Сохраняем сайт
    embeddedSites[newTabId] = {
        type: 'embedded',
        content: siteHtml || `<div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea20, #764ba220); min-height: 100%;">
            <h1 style="color: #667eea;">📄 ${siteName}</h1>
            <p style="margin: 20px 0; color: #666;">Сайт из папки ${sitePath}</p>
            <div style="background: white; padding: 20px; border-radius: 12px; margin: 20px auto; max-width: 600px;">
                <p>Это новый сайт</p>
                <p>Вы можете:</p>
                <ul style="text-align: left; margin-top: 15px;">
                    <li>Загрузить свой HTML файл</li>
                    <li>Редактировать код вручную</li>
                    <li>Сохранить изменения</li>
                </ul>
            </div>
            <button onclick="editCurrentSite()" style="padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer;">Редактировать</button>
        </div>`
    };

    // Добавляем кнопку
    const tabsHeader = document.querySelector('.tabs-header');
    const addBtn = document.querySelector('.add-site-btn');
    const newButton = document.createElement('button');
    newButton.className = 'tab-button';
    newButton.setAttribute('data-tab', newTabId);
    newButton.textContent = siteName;
    newButton.onclick = () => switchTab(newTabId);
    tabsHeader.insertBefore(newButton, addBtn);

    // Добавляем вкладку
    const tabContent = document.querySelector('.tab-content');
    const newPane = document.createElement('div');
    newPane.className = 'tab-pane';
    newPane.id = newTabId;
    newPane.innerHTML = `
        <div class="iframe-container">
            <div class="loading-overlay" id="loading-${nextTabId}">
                <div class="spinner"></div>
            </div>
            <div class="error-message hidden" id="error-${nextTabId}">
                <div>
                    <h3>Ошибка загрузки</h3>
                    <p>Не удалось загрузить сайт</p>
                    <button onclick="loadTab('${newTabId}')">Повторить</button>
                </div>
            </div>
            <iframe title="${siteName}" style="width:100%;height:100%;border:none;"></iframe>
        </div>
    `;
    tabContent.appendChild(newPane);

    // Отображаем контент
    displayEmbeddedContent(newTabId);
    saveAllSites();

    // Переключаемся
    switchTab(newTabId);
    closeModal('addSiteModal');

    // Очищаем поля
    document.getElementById('siteName').value = '';
    document.getElementById('sitePath').value = '';
    if (document.getElementById('siteHtml')) {
        document.getElementById('siteHtml').value = '';
    }

    nextTabId++;
}

// Экспорт всех сайтов
function exportAllSites() {
    const data = JSON.stringify(embeddedSites, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'all_sites_backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

// Импорт сайтов
function importSites() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (ev) {
                try {
                    const imported = JSON.parse(ev.target.result);
                    Object.assign(embeddedSites, imported);

                    // Обновляем отображение
                    for (let tabId in imported) {
                        if (document.getElementById(tabId)) {
                            displayEmbeddedContent(tabId);
                        }
                    }

                    saveAllSites();
                    alert('Сайты успешно импортированы!');
                } catch (err) {
                    alert('Ошибка при импорте: ' + err.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Открыть модальное окно
function openModal() {
    document.getElementById('addSiteModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
    loadSavedSites();

    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            if (tabId) switchTab(tabId);
        });
    });

    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    };

    const siteInfo = document.querySelector('.site-info');
    if (siteInfo) {
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.marginTop = '10px';
        buttonsDiv.style.display = 'flex';
        buttonsDiv.style.gap = '10px';
        buttonsDiv.innerHTML = `
            <button onclick="exportAllSites()" style="padding: 5px 12px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Экспорт всех</button>
            <button onclick="importSites()" style="padding: 5px 12px; background: #764ba2; color: white; border: none; border-radius: 6px; cursor: pointer;">Импорт</button>
        `;
        siteInfo.appendChild(buttonsDiv);
    }
});