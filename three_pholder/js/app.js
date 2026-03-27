const rawSuppliers = [
    { name: "Global Chips Co.", price: 120, delivery: 30, rating: 4.9, minLot: 1000 },
    { name: "Fast Delivery Inc.", price: 150, delivery: 5, rating: 4.2, minLot: 100 },
    { name: "Cheap & Small Ltd.", price: 95, delivery: 45, rating: 3.5, minLot: 500 },
    { name: "Standard Trade", price: 130, delivery: 20, rating: 4.0, minLot: 250 },
    { name: "Reliable Partner", price: 140, delivery: 15, rating: 4.8, minLot: 200 },
    { name: "Bad Logistics", price: 160, delivery: 40, rating: 3.0, minLot: 1200 },
    { name: "High Cost Ltd.", price: 180, delivery: 10, rating: 4.1, minLot: 150 },
    { name: "Local Startup", price: 110, delivery: 12, rating: 3.8, minLot: 50 },
    { name: "Old Mill Corp.", price: 125, delivery: 35, rating: 3.2, minLot: 1100 },
    { name: "Express Components", price: 145, delivery: 7, rating: 4.5, minLot: 300 },
    { name: "Микросхемы Экстра-класса", price: 200, delivery: 3, rating: 5.0, minLot: 10 },
    { name: "Bulk Basic", price: 85, delivery: 60, rating: 3.1, minLot: 5000 },
    { name: "Road Supply", price: 125, delivery: 22, rating: 4.1, minLot: 400 },
    { name: "Slow & Expensive", price: 190, delivery: 50, rating: 2.5, minLot: 2000 },
    { name: "Прямые Авиапоставки", price: 170, delivery: 2, rating: 4.4, minLot: 150 },
    { name: "Green Components", price: 135, delivery: 25, rating: 4.7, minLot: 100 },
    { name: "ПосредникТорг", price: 130, delivery: 21, rating: 3.9, minLot: 410 },
    { name: "Азия-Экспорт", price: 105, delivery: 38, rating: 3.9, minLot: 3000 },
    { name: "Скандинавская Точность", price: 155, delivery: 14, rating: 4.9, minLot: 80 },
    { name: "ООО «Ржавые Детали»", price: 115, delivery: 45, rating: 2.0, minLot: 500 },
    { name: "МикроТехно Групп", price: 8500, delivery: 4, rating: 4.6, minLot: 20 },
    { name: "Сибирский Ресурс", price: 6200, delivery: 12, rating: 3.9, minLot: 1000 },
    { name: "Зеленоград-Чип", price: 7100, delivery: 7, rating: 4.9, minLot: 50 },
    { name: "Урал-Поставка", price: 9000, delivery: 15, rating: 3.5, minLot: 500 },
    { name: "ТехноСклад МСК", price: 7800, delivery: 2, rating: 4.2, minLot: 10 },
    { name: "Волжские Компоненты", price: 6800, delivery: 10, rating: 4.3, minLot: 200 },
    { name: "Крым-Трейд", price: 8200, delivery: 20, rating: 3.0, minLot: 300 },
    { name: "Прогресс-ИТ", price: 7400, delivery: 8, rating: 4.5, minLot: 5 },
    { name: "Байкал Электроникс", price: 8900, delivery: 5, rating: 4.8, minLot: 100 },
    { name: "Юг-Снабжение", price: 7500, delivery: 14, rating: 3.8, minLot: 400 }
];

// Направления: price v, delivery v, rating ^, minLot v
// Функция доминирования: a доминирует b, если a не хуже по всем и строго лучше хотя бы по одному
function dominates(a, b) { // a - объект поставщика, b - другой
    const betterPrice = a.price < b.price;
    const betterDelivery = a.delivery < b.delivery;
    const betterRating = a.rating > b.rating;
    const betterLot = a.minLot < b.minLot;

    const notWorsePrice = a.price <= b.price;
    const notWorseDelivery = a.delivery <= b.delivery;
    const notWorseRating = a.rating >= b.rating;
    const notWorseLot = a.minLot <= b.minLot;

    const allNotWorse = notWorsePrice && notWorseDelivery && notWorseRating && notWorseLot;
    const strictlyBetter = betterPrice || betterDelivery || betterRating || betterLot;
    return allNotWorse && strictlyBetter;
}

// Поиск множества Парето (недоминируемые)
function getParetoSet(suppliers) {
    const n = suppliers.length;
    const dominatedFlags = new Array(n).fill(false);
    for (let i = 0; i < n; i++) {
        if (dominatedFlags[i]) continue;
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            if (dominates(suppliers[i], suppliers[j])) {
                dominatedFlags[j] = true;
            }
        }
    }
    return suppliers.filter((_, idx) => !dominatedFlags[idx]);
}

let paretoSuppliers = [];
let allSuppliers = [...rawSuppliers];
let chartInstance = null;

// рендер таблицы (все + выделение Парето)
function renderTable() {
    const tbody = document.getElementById('supplierTableBody');
    tbody.innerHTML = '';
    const paretoNames = new Set(paretoSuppliers.map(s => s.name));
    allSuppliers.forEach(sup => {
        const isPareto = paretoNames.has(sup.name);
        const rowClass = isPareto ? 'pareto-row' : 'dominated-row';
        const statusText = isPareto ? 'Парето' : 'Доминируемый';
        const tr = document.createElement('tr');
        tr.className = rowClass;
        tr.innerHTML = `
                <td class="supplier-name">${sup.name}</td>
                <td>$${sup.price}</td>
                <td>${sup.delivery} дн</td>
                <td>${sup.rating.toFixed(1)}</td>
                <td>${sup.minLot} шт</td>
                <td>${statusText}</td>
            `;
        tbody.appendChild(tr);
    });
    document.getElementById('paretoCountBadge').innerText = `Парето: ${paretoSuppliers.length} / ${allSuppliers.length}`;
}

// Обновление графика (цена vs срок, цветом выделяем Парето)
function updateChart() {
    const ctx = document.getElementById('paretoChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();

    const paretoNamesSet = new Set(paretoSuppliers.map(p => p.name));
    const nonParetoPoints = allSuppliers.filter(s => !paretoNamesSet.has(s.name));
    const paretoPoints = [...paretoSuppliers];

    const datasets = [
        {
            label: 'Доминируемые поставщики',
            data: nonParetoPoints.map(s => ({ x: s.price, y: s.delivery, supplier: s })),
            backgroundColor: '#cbd5e1',
            borderColor: '#94a3b8',
            pointRadius: 5,
            pointHoverRadius: 8,
            type: 'scatter',
            order: 2
        },
        {
            label: 'Парето-фронт (эффективные)',
            data: paretoPoints.map(s => ({ x: s.price, y: s.delivery, supplier: s })),
            backgroundColor: '#1e8f8f',
            borderColor: '#0f5e5e',
            pointRadius: 7,
            pointHoverRadius: 10,
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            type: 'scatter',
            order: 1
        }
    ];

    chartInstance = new Chart(ctx, {
        type: 'scatter',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const sup = context.raw.supplier;
                            return `${sup.name}: $${sup.price}, ${sup.delivery} дн, рейтинг ${sup.rating}, мин.партия ${sup.minLot}`;
                        }
                    }
                },
                legend: { position: 'top' }
            },
            scales: {
                x: { title: { display: true, text: 'Цена за единицу ($) → минимизация' }, type: 'linear' },
                y: { title: { display: true, text: '⏱Срок доставки (дни) → минимизация' }, reversed: false }
            },
            onClick: (event, activeElements) => {
                if (activeElements.length === 0) return;
                const dataIndex = activeElements[0].datasetIndex;
                const rawIndex = activeElements[0].index;
                const dataset = chartInstance.data.datasets[dataIndex];
                const point = dataset.data[rawIndex];
                if (point && point.supplier) {
                    showSupplierCard(point.supplier);
                }
            }
        }
    });
}

// детальная карточка поставщика (всплывающее уведомление или заменяем блок информации)
function showSupplierCard(supplier) {
    const infoDiv = document.getElementById('clickInfo');
    const isPareto = paretoSuppliers.some(p => p.name === supplier.name);
    infoDiv.innerHTML = `
            <div style="background:#f0f9f9; border-radius:1rem; padding:0.8rem; margin-top:0.2rem;">
                <strong>* ${supplier.name}</strong><br/>
                Цена: $${supplier.price} &nbsp;| Срок: ${supplier.delivery} дн<br/>
                Рейтинг надёжности: ${supplier.rating} / 5 &nbsp;| Мин. партия: ${supplier.minLot} шт<br/>
                ${isPareto ? '<span style="color:#1e8f8f;">Входит во множество Парето (оптимальный компромисс)</span>' : '<span style="color:#b34e4e;">Доминируемый — есть поставщик лучше по всем параметрам</span>'}
            </div>
        `;
}

// Нормализованная оценка (чем меньше цена/срок/партия и больше рейтинг - тем выше скор)
function computeScore(supplier, weights) {
    // Для минимизации: цена, срок, партия -> чем меньше, тем выше скор. Преобразуем через инверсию с учётом максимумов по парето-множеству!!!  Получаем min/max среди парето-множества.
    const paretoArray = paretoSuppliers;
    if (paretoArray.length === 0) return 0;
    const minPrice = Math.min(...paretoArray.map(s => s.price));
    const maxPrice = Math.max(...paretoArray.map(s => s.price));
    const minDelivery = Math.min(...paretoArray.map(s => s.delivery));
    const maxDelivery = Math.max(...paretoArray.map(s => s.delivery));
    const minLot = Math.min(...paretoArray.map(s => s.minLot));
    const maxLot = Math.max(...paretoArray.map(s => s.minLot));
    const maxRating = Math.max(...paretoArray.map(s => s.rating));
    const minRating = Math.min(...paretoArray.map(s => s.rating));

    const normPrice = maxPrice === minPrice ? 1 : 1 - (supplier.price - minPrice) / (maxPrice - minPrice);
    const normDelivery = maxDelivery === minDelivery ? 1 : 1 - (supplier.delivery - minDelivery) / (maxDelivery - minDelivery);
    const normRating = maxRating === minRating ? 0.5 : (supplier.rating - minRating) / (maxRating - minRating);
    const normLot = maxLot === minLot ? 1 : 1 - (supplier.minLot - minLot) / (maxLot - minLot);

    return (normPrice * weights.price + normDelivery * weights.delivery + normRating * weights.rating + normLot * weights.lot);
}

// Рекомендация на основе весов (лучший среди парето)
function updateRecommendation() {
    if (!paretoSuppliers.length) {
        document.getElementById('recommendationBox').innerHTML = 'Нет парето-поставщиков для анализа.';
        return;
    }
    const priceW = parseFloat(document.getElementById('weightPrice').value);
    const timeW = parseFloat(document.getElementById('weightTime').value);
    const ratingW = parseFloat(document.getElementById('weightRating').value);
    const lotW = parseFloat(document.getElementById('weightLot').value);
    const sum = priceW + timeW + ratingW + lotW;
    // нормализуем веса, чтобы сумма = 1
    const weights = {
        price: priceW / sum,
        delivery: timeW / sum,
        rating: ratingW / sum,
        lot: lotW / sum
    };
    let bestSupplier = null;
    let bestScore = -Infinity;
    for (const sup of paretoSuppliers) {
        const score = computeScore(sup, weights);
        if (score > bestScore) {
            bestScore = score;
            bestSupplier = sup;
        }
    }
    if (bestSupplier) {
        const recDiv = document.getElementById('recommendationBox');
        recDiv.innerHTML = `
                <strong>Оптимальный выбор с учётом ваших весов:</strong><br/>
                ${bestSupplier.name} | Цена $${bestSupplier.price} | Срок ${bestSupplier.delivery} дн | Рейтинг ${bestSupplier.rating} | Партия ${bestSupplier.minLot} шт<br/>
                <span style="font-size:0.75rem;">Интегральная оценка: ${bestScore.toFixed(3)} (макс. 1). Веса: цена ${weights.price.toFixed(2)}, срок ${weights.delivery.toFixed(2)}, рейтинг ${weights.rating.toFixed(2)}, партия ${weights.lot.toFixed(2)}</span>
            `;
    } else {
        document.getElementById('recommendationBox').innerHTML = 'Не удалось вычислить рекомендацию.';
    }
}

function syncSlidersAndRec() {
    document.getElementById('weightPriceVal').innerText = document.getElementById('weightPrice').value;
    document.getElementById('weightTimeVal').innerText = document.getElementById('weightTime').value;
    document.getElementById('weightRatingVal').innerText = document.getElementById('weightRating').value;
    document.getElementById('weightLotVal').innerText = document.getElementById('weightLot').value;
    updateRecommendation();
}

// пресеты
function setPreset(preset) {
    let pw = 0.25, tw = 0.25, rw = 0.25, lw = 0.25;
    if (preset === 'speed') { pw = 0.1; tw = 0.7; rw = 0.1; lw = 0.1; }
    else if (preset === 'price') { pw = 0.7; tw = 0.1; rw = 0.1; lw = 0.1; }
    else if (preset === 'quality') { pw = 0.1; tw = 0.1; rw = 0.7; lw = 0.1; }
    else if (preset === 'smallLot') { pw = 0.1; tw = 0.1; rw = 0.1; lw = 0.7; }
    else if (preset === 'balanced') { pw = 0.25; tw = 0.25; rw = 0.25; lw = 0.25; }
    document.getElementById('weightPrice').value = pw;
    document.getElementById('weightTime').value = tw;
    document.getElementById('weightRating').value = rw;
    document.getElementById('weightLot').value = lw;
    syncSlidersAndRec();
}

function refreshAll() {
    paretoSuppliers = getParetoSet(allSuppliers);
    renderTable();
    updateChart();
    syncSlidersAndRec();
    document.getElementById('clickInfo').innerHTML = 'Нажмите на точку поставщика для подробной карточки.';
}

// Инициализация событий
function bindEvents() {
    document.getElementById('weightPrice').addEventListener('input', syncSlidersAndRec);
    document.getElementById('weightTime').addEventListener('input', syncSlidersAndRec);
    document.getElementById('weightRating').addEventListener('input', syncSlidersAndRec);
    document.getElementById('weightLot').addEventListener('input', syncSlidersAndRec);
    const presetBtns = document.querySelectorAll('[data-preset]');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const preset = btn.getAttribute('data-preset');
            setPreset(preset);
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    // дефолтный активный - balanced
    document.querySelector('[data-preset="balanced"]').classList.add('active');
}

refreshAll();
bindEvents();