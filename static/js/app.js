// Глобальные переменные
let sitesConfig = window.sitesConfig || {};
let currentEditTab = null;
let nextTabId = Object.keys(sitesConfig).length + 1;

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    loadSitesContent();
});

// Инициализация вкладок
function initializeTabs() {
    const tabsHeader = document.getElementById('tabsHeader');
    const tabContent = document.getElementById('tabContent');
    
    tabsHeader.innerHTML = '';
    tabContent.innerHTML = '';
    
    for (let tabId in sitesConfig) {
        const site = sitesConfig[tabId];
        
        // Добавляем кнопку вкладки
        const button = document.createElement('button');
        button.className = 'tab-button';
        if (tabId === 'tab1') button.classList.add('active');
        button.setAttribute('data-tab', tabId);
        button.textContent = tabId === 'tab1' ? ' ' + site.name : ' ' + site.name;
        button.onclick = () => switchTab(tabId);
        tabsHeader.appendChild(button);
        
        // Добавляем содержимое вкладки
        const pane = document.createElement('div');
        pane.className = 'tab-pane';
        if (tabId === 'tab1') pane.classList.add('active');
        pane.id = tabId;
        pane.innerHTML = `
            <div class="iframe-container">
                <div class="loading-overlay" id="loading-${tabId}">
                    <div class="spinner"></div>
                </div>
                <div class="error-message hidden" id="error-${tabId}">
                    <div>
                        <h3>Ошибка загрузки!!!</h3>
                        <p>Не удалось загрузить содержимое</p>
                        <button onclick="loadTabContent('${tabId}')">Повторить</button>
                    </div>
                </div>
                <iframe id="frame-${tabId}" title="${site.name}" style="width:100%;height:100%;border:none;"></iframe>
            </div>
        `;
        tabContent.appendChild(pane);
    }
    
    // Добавляем кнопку "Добавить сайт"
    const addButton = document.createElement('button');
    addButton.className = 'add-site-btn';
    addButton.textContent = '+ Добавить сайт';
    addButton.onclick = () => openModal();
    tabsHeader.appendChild(addButton);
}

// Загрузка содержимого сайтов
async function loadSitesContent() {
    for (let tabId in sitesConfig) {
        await loadTabContent(tabId);
    }
}

// Загрузка содержимого конкретной вкладки
async function loadTabContent(tabId) {
    const loadingEl = document.getElementById(`loading-${tabId}`);
    const errorEl = document.getElementById(`error-${tabId}`);
    const iframe = document.getElementById(`frame-${tabId}`);
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    
    try {
        const response = await fetch(`/site/${tabId}`);
        const data = await response.json();
        
        if (data.content) {
            iframe.srcdoc = data.content;
            if (loadingEl) loadingEl.classList.add('hidden');
        } else {
            throw new Error('No content');
        }
    } catch (error) {
        console.error('Error loading tab:', error);
        if (loadingEl) loadingEl.classList.add('hidden');
        if (errorEl) errorEl.classList.remove('hidden');
    }
}

// Переключение вкладок
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Показываем выбранную
    document.getElementById(tabId).classList.add('active');
    
    // Обновляем активное состояние кнопок
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    const activeButton = document.querySelector(`[data-tab = "${tabId}"]`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

// Загрузка файла в текущую вкладку
async function uploadFileToCurrentTab(input) {
    const file = input.files[0];
    if (!file) return;
    
    const activeTab = document.querySelector('.tab-pane.active').id;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tab_id', activeTab);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        
        if (data.success) {
            const iframe = document.getElementById(`frame-${activeTab}`);
            iframe.srcdoc = data.content;
            alert('Файл успешно загружен!');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Ошибка при загрузке файла');
    }
}

// Редактирование сайта
function editSite(tabId) {
    currentEditTab = tabId;
    const site = sitesConfig[tabId];
    
    document.getElementById('editTitle').value = site.name;
    
    // Загружаем текущий контент
    const iframe = document.getElementById(`frame-${tabId}`);
    // Получаем srcdoc или загружаем с сервера
    if (iframe.srcdoc) {
        document.getElementById('editHtml').value = iframe.srcdoc;
    }
    
    document.getElementById('editModal').classList.add('active');
}

// Сохранение редактирования
async function saveEdit() {
    if (!currentEditTab) return;
    
    const newTitle = document.getElementById('editTitle').value;
    const newHtml = document.getElementById('editHtml').value;
    
    try {
        const response = await fetch(`/api/sites/${currentEditTab}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newTitle,
                content: newHtml
            })
        });
        const data = await response.json();
        
        if (data.success) {
            // Обновляем название вкладки
            const button = document.querySelector(`[data-tab="${currentEditTab}"]`);
            button.textContent = currentEditTab === 'tab1' ? ' ' + newTitle : ' ' + newTitle;
            
            // Обновляем контент
            const iframe = document.getElementById(`frame-${currentEditTab}`);
            iframe.srcdoc = newHtml;
            
            sitesConfig[currentEditTab].name = newTitle;
            
            closeModal('editModal');
            alert('Сайт сохранен!');
        }
    } catch (error) {
        console.error('Save error:', error);
        alert('Ошибка при сохранении');
    }
}

// Добавление нового сайта
async function addNewSite() {
    const name = document.getElementById('siteName').value;
    const type = document.getElementById('siteType').value;
    const path = document.getElementById('sitePath').value;
    const html = document.getElementById('siteHtml').value;
    
    const siteData = {
        name: name,
        type: type,
        path: type === 'folder' ? path : null,
        content: type === 'embedded' ? html : null
    };
    
    try {
        const response = await fetch('/api/sites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(siteData)
        });
        const data = await response.json();
        
        if (data.success) {
            // Перезагружаем страницу для отображения новой вкладки
            location.reload();
        }
    } catch (error) {
        console.error('Add site error:', error);
        alert('Ошибка при добавлении сайта');
    }
}

// Экспорт всех сайтов
async function exportAllSites() {
    try {
        const response = await fetch('/api/export');
        const data = await response.json();
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sites_backup.json';
        a.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Export error:', error);
        alert('Ошибка при экспорте');
    }
}

// Импорт сайтов
function importSites() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async function(ev) {
                try {
                    const data = JSON.parse(ev.target.result);
                    const response = await fetch('/api/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    
                    if (result.success) {
                        alert('Сайты успешно импортированы!');
                        location.reload();
                    }
                } catch(err) {
                    alert('Ошибка при импорте: ' + err.message);
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Вспомогательные функции
function hideLoading(siteId) {
    const loadingEl = document.getElementById(`loading-${siteId}`);
    if (loadingEl) loadingEl.classList.add('hidden');
}

function showError(siteId) {
    const errorEl = document.getElementById(`error-${siteId}`);
    if (errorEl) errorEl.classList.remove('hidden');
}

function openModal() {
    document.getElementById('addSiteModal').classList.add('active');
}

function closeModal(modalId = 'addSiteModal') {
    document.getElementById(modalId).classList.remove('active');
}

// Обработчик изменения типа сайта
document.addEventListener('DOMContentLoaded', () => {
    const siteTypeSelect = document.getElementById('siteType');
    if (siteTypeSelect) {
        siteTypeSelect.addEventListener('change', (e) => {
            const pathInput = document.getElementById('sitePath');
            const htmlInput = document.getElementById('siteHtml');
            
            if (e.target.value === 'folder') {
                pathInput.style.display = 'block';
                htmlInput.style.display = 'none';
            } else {
                pathInput.style.display = 'none';
                htmlInput.style.display = 'block';
            }
        });
    }
    
    // Закрытие модалок по клику вне
    window.onclick = (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('active');
        }
    };
});