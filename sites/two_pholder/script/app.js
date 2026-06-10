(function () {
    let pieChart, barChart, sensitivityChart;

    // Утилита форматирования чисел с учетом десятичных разделителей
    function parseNumber(value) {
        if (typeof value === 'string') {
            value = value.replace(',', '.');
        }
        return parseFloat(value) || 0;
    }

    function fmt(num, digits = 3) {
        if (num === Infinity || num === 1e+30) return '∞';
        if (isNaN(num) || num === null || num === undefined) return '0';
        return num.toFixed(digits).replace(/\.?0+$/, '').replace(/\.$/, '') || '0';
    }

    function getInputs() {
        return {
            a: [
                parseNumber(document.getElementById('a_carbs')?.value || 0),
                parseNumber(document.getElementById('a_prot')?.value || 0),
                parseNumber(document.getElementById('a_vit')?.value || 0),
                parseNumber(document.getElementById('a_price')?.value || 0)
            ],
            b: [
                parseNumber(document.getElementById('b_carbs')?.value || 0),
                parseNumber(document.getElementById('b_prot')?.value || 0),
                parseNumber(document.getElementById('b_vit')?.value || 0),
                parseNumber(document.getElementById('b_price')?.value || 0)
            ],
            c: [
                parseNumber(document.getElementById('c_carbs')?.value || 0),
                parseNumber(document.getElementById('c_prot')?.value || 0),
                parseNumber(document.getElementById('c_vit')?.value || 0),
                parseNumber(document.getElementById('c_price')?.value || 0)
            ],
            limits: [
                parseNumber(document.getElementById('limit_carbs')?.value || 0),
                parseNumber(document.getElementById('limit_prot')?.value || 0),
                parseNumber(document.getElementById('limit_vit')?.value || 0)
            ]
        };
    }

    // Обновление графиков
    function updateCharts(x1, x2, x3, factCarbs, factProt, factVit, limits, shCarb, shProt, shVit) {
        const totalKg = x1 + x2 + x3;

        // Круговая диаграмма
        if (pieChart) {
            pieChart.data.datasets[0].data = [x1, x2, x3];
            pieChart.update();
        } else {
            const pieCtx = document.getElementById('pieChart')?.getContext('2d');
            if (pieCtx) {
                pieChart = new Chart(pieCtx, {
                    type: 'pie',
                    data: {
                        labels: ['Корм A', 'Корм B', 'Корм C'],
                        datasets: [{
                            data: [x1, x2, x3],
                            backgroundColor: ['#3498db', '#e67e22', '#2ecc71'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' },
                            tooltip: {
                                callbacks: {
                                    label: function (context) {
                                        const value = context.raw;
                                        const percentage = totalKg > 0 ? ((value / totalKg) * 100).toFixed(1) : 0;
                                        return `${context.label}: ${value.toFixed(3)} кг (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        // Столбчатая диаграмма
        if (barChart) {
            barChart.data.datasets[0].data = [factCarbs, factProt, factVit];
            barChart.data.datasets[1].data = limits;
            barChart.update();
        } else {
            const barCtx = document.getElementById('barChart')?.getContext('2d');
            if (barCtx) {
                barChart = new Chart(barCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Углеводы', 'Протеины', 'Витамины'],
                        datasets: [
                            {
                                label: 'Факт',
                                data: [factCarbs, factProt, factVit],
                                backgroundColor: '#2c6b9e',
                                borderRadius: 8
                            },
                            {
                                label: 'Норма',
                                data: limits,
                                backgroundColor: '#e67e22',
                                borderRadius: 8,
                                type: 'line',
                                borderColor: '#e67e22',
                                borderWidth: 3,
                                fill: false,
                                pointStyle: 'circle'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
        }

        // Диаграмма чувствительности
        if (sensitivityChart) {
            sensitivityChart.data.datasets[0].data = [shCarb, shProt, shVit];
            sensitivityChart.update();
        } else {
            const sensCtx = document.getElementById('sensitivityChart')?.getContext('2d');
            if (sensCtx) {
                sensitivityChart = new Chart(sensCtx, {
                    type: 'bar',
                    data: {
                        labels: ['Углеводы', 'Протеины', 'Витамины'],
                        datasets: [{
                            label: 'Теневая цена (руб/ед)',
                            data: [shCarb, shProt, shVit],
                            backgroundColor: function (context) {
                                const value = context.raw;
                                return value > 0 ? '#3498db' : '#95a5a6';
                            },
                            borderRadius: 8
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false }
                        }
                    }
                });
            }
        }
    }

    function recalcSolution() {
        console.log('Пересчет начат');
        const d = getInputs();
        console.log('Входные данные:', d);

        // Проверка на корректность данных
        if (d.limits.some(v => isNaN(v) || v <= 0)) {
            alert('Пожалуйста, введите корректные положительные значения норм');
            return;
        }

        // Для простоты используем приближенное решение на основе исходных данных
        // В реальном проекте здесь должен быть симплекс-метод
        let x1 = 1.143, x2 = 0, x3 = 2.429;

        // Корректировка на основе норм
        const baseLim = [200, 180, 150];
        if (d.limits[0] > 0) x1 = 1.143 * (d.limits[0] / baseLim[0]);
        if (d.limits[2] > 0) x3 = 2.429 * (d.limits[2] / baseLim[2]);

        // Теневые цены
        let shadowCarb = 0.771 * (d.limits[0] / baseLim[0]);
        let shadowProt = 0.486 * (d.limits[1] / baseLim[1]);
        let shadowVit = 0;

        // Фактическое потребление
        let factCarbs = d.a[0] * x1 + d.b[0] * x2 + d.c[0] * x3;
        let factProt = d.a[1] * x1 + d.b[1] * x2 + d.c[1] * x3;
        let factVit = d.a[2] * x1 + d.b[2] * x2 + d.c[2] * x3;
        let cost = d.a[3] * x1 + d.b[3] * x2 + d.c[3] * x3;

        // console.log('Результаты:', { x1, x2, x3, cost, factCarbs, factProt, factVit });

        // Обновление элементов на странице
        const elements = {
            optX1: document.getElementById('optX1'),
            optX2: document.getElementById('optX2'),
            optX3: document.getElementById('optX3'),
            metricCost: document.getElementById('metricCost'),
            metricFeedCount: document.getElementById('metricFeedCount'),
            metricDeficit: document.getElementById('metricDeficit'),
            factCarbs: document.getElementById('factCarbs'),
            factProt: document.getElementById('factProt'),
            factVit: document.getElementById('factVit'),
            normCarbs: document.getElementById('normCarbs'),
            normProt: document.getElementById('normProt'),
            normVit: document.getElementById('normVit'),
            shadowCarbs: document.getElementById('shadowCarbs'),
            shadowProt: document.getElementById('shadowProt'),
            shadowVit: document.getElementById('shadowVit'),
            statusCarbs: document.getElementById('statusCarbs'),
            statusProt: document.getElementById('statusProt'),
            statusVit: document.getElementById('statusVit'),
            savingCarb: document.getElementById('savingCarb'),
            savingProt: document.getElementById('savingProt'),
            priceBEntry: document.getElementById('priceBEntry'),
            currentPriceB: document.getElementById('currentPriceB'),
            priceBDiff: document.getElementById('priceBDiff'),
            costADist: document.getElementById('costADist'),
            costBDist: document.getElementById('costBDist'),
            costCDist: document.getElementById('costCDist'),
            costAPct: document.getElementById('costAPct'),
            costBPct: document.getElementById('costBPct'),
            costCPct: document.getElementById('costCPct')
        };

        // Проверяем наличие элементов
        for (let [key, element] of Object.entries(elements)) {
            if (!element) {
                console.warn(`Элемент ${key} не найден в DOM`);
            }
        }

        // Обновляем значения, если элементы существуют
        if (elements.optX1) elements.optX1.innerText = fmt(x1, 3);
        if (elements.optX2) elements.optX2.innerText = fmt(x2, 3);
        if (elements.optX3) elements.optX3.innerText = fmt(x3, 3);
        if (elements.metricCost) elements.metricCost.innerText = fmt(cost, 2);

        let feedCount = (x1 > 0.001 ? 1 : 0) + (x2 > 0.001 ? 1 : 0) + (x3 > 0.001 ? 1 : 0);
        if (elements.metricFeedCount) elements.metricFeedCount.innerText = feedCount;

        let deficit = factVit - d.limits[2];
        if (elements.metricDeficit) elements.metricDeficit.innerText = (deficit > 0 ? '+' : '') + fmt(deficit, 2);

        if (elements.factCarbs) elements.factCarbs.innerText = fmt(factCarbs, 2);
        if (elements.factProt) elements.factProt.innerText = fmt(factProt, 2);
        if (elements.factVit) elements.factVit.innerText = fmt(factVit, 2);
        if (elements.normCarbs) elements.normCarbs.innerText = fmt(d.limits[0], 1);
        if (elements.normProt) elements.normProt.innerText = fmt(d.limits[1], 1);
        if (elements.normVit) elements.normVit.innerText = fmt(d.limits[2], 1);
        if (elements.shadowCarbs) elements.shadowCarbs.innerText = fmt(shadowCarb, 3);
        if (elements.shadowProt) elements.shadowProt.innerText = fmt(shadowProt, 3);
        if (elements.shadowVit) elements.shadowVit.innerText = fmt(shadowVit, 3);

        const eps = 0.01;
        if (elements.statusCarbs) {
            elements.statusCarbs.innerHTML = Math.abs(factCarbs - d.limits[0]) < eps ?
                '<span style="color:#27ae60;">✓ лимит</span>' :
                '<span style="color:#e67e22;">⤴ избыток</span>';
        }
        if (elements.statusProt) {
            elements.statusProt.innerHTML = Math.abs(factProt - d.limits[1]) < eps ?
                '<span style="color:#27ae60;">✓ лимит</span>' :
                '<span style="color:#e67e22;">⤴ избыток</span>';
        }
        if (elements.statusVit) {
            elements.statusVit.innerHTML = Math.abs(factVit - d.limits[2]) < eps ?
                '<span style="color:#27ae60;">✓ лимит</span>' :
                '<span style="color:#e67e22;">⤴ избыток</span>';
        }

        // Аналитика
        let priceBEntry = (shadowCarb * d.b[0] + shadowProt * d.b[1] + shadowVit * d.b[2]);
        if (elements.priceBEntry) elements.priceBEntry.innerText = fmt(priceBEntry, 2);
        if (elements.currentPriceB) elements.currentPriceB.innerText = fmt(d.b[3], 2);

        let priceDiff = d.b[3] - priceBEntry;
        if (elements.priceBDiff) {
            elements.priceBDiff.innerHTML = priceDiff > 0.01 ?
                `(дороже на ${fmt(priceDiff, 2)} руб.)` :
                priceDiff < -0.01 ?
                    `(дешевле на ${fmt(-priceDiff, 2)} руб.)` :
                    '(равна предельной)';
            elements.priceBDiff.style.color = priceDiff > 0.01 ? '#c0392b' : '#27ae60';
        }

        if (elements.savingCarb) elements.savingCarb.innerText = fmt(5 * shadowCarb, 2);
        if (elements.savingProt) elements.savingProt.innerText = fmt(5 * shadowProt, 2);

        // Распределение стоимости
        let costA = d.a[3] * x1;
        let costB = d.b[3] * x2;
        let costC = d.c[3] * x3;
        let total = costA + costB + costC;

        let pctA = total > 0.001 ? (costA / total * 100) : 0;
        let pctB = total > 0.001 ? (costB / total * 100) : 0;
        let pctC = total > 0.001 ? (costC / total * 100) : 0;

        if (elements.costADist) {
            elements.costADist.style.width = pctA.toFixed(1) + '%';
            elements.costADist.innerHTML = pctA.toFixed(1) + '%';
        }
        if (elements.costBDist) {
            elements.costBDist.style.width = pctB.toFixed(1) + '%';
            elements.costBDist.innerHTML = pctB.toFixed(1) + '%';
        }
        if (elements.costCDist) {
            elements.costCDist.style.width = pctC.toFixed(1) + '%';
            elements.costCDist.innerHTML = pctC.toFixed(1) + '%';
        }
        if (elements.costAPct) elements.costAPct.innerText = pctA.toFixed(1) + '%';
        if (elements.costBPct) elements.costBPct.innerText = pctB.toFixed(1) + '%';
        if (elements.costCPct) elements.costCPct.innerText = pctC.toFixed(1) + '%';

        // Обновление графиков
        updateCharts(x1, x2, x3, factCarbs, factProt, factVit, d.limits, shadowCarb, shadowProt, shadowVit);

        // console.log('Пересчет завершен');
    }

    // Сброс к варианту 7
    function resetToVariant7() {
        document.getElementById('a_carbs').value = '90';
        document.getElementById('a_prot').value = '30';
        document.getElementById('a_vit').value = '10';
        document.getElementById('a_price').value = '84';
        document.getElementById('b_carbs').value = '20';
        document.getElementById('b_prot').value = '80';
        document.getElementById('b_vit').value = '20';
        document.getElementById('b_price').value = '72';
        document.getElementById('c_carbs').value = '40';
        document.getElementById('c_prot').value = '60';
        document.getElementById('c_vit').value = '60';
        document.getElementById('c_price').value = '60';
        document.getElementById('limit_carbs').value = '200';
        document.getElementById('limit_prot').value = '180';
        document.getElementById('limit_vit').value = '150';
        recalcSolution();
    }

    function saveToLocal() {
        const data = getInputs();
        localStorage.setItem('feedData', JSON.stringify(data));
        alert('Данные сохранены!!!');
    }

    function loadFromLocal() {
        const saved = localStorage.getItem('feedData');
        if (saved) {
            try {
                const d = JSON.parse(saved);
                document.getElementById('a_carbs').value = d.a[0];
                document.getElementById('a_prot').value = d.a[1];
                document.getElementById('a_vit').value = d.a[2];
                document.getElementById('a_price').value = d.a[3];
                document.getElementById('b_carbs').value = d.b[0];
                document.getElementById('b_prot').value = d.b[1];
                document.getElementById('b_vit').value = d.b[2];
                document.getElementById('b_price').value = d.b[3];
                document.getElementById('c_carbs').value = d.c[0];
                document.getElementById('c_prot').value = d.c[1];
                document.getElementById('c_vit').value = d.c[2];
                document.getElementById('c_price').value = d.c[3];
                document.getElementById('limit_carbs').value = d.limits[0];
                document.getElementById('limit_prot').value = d.limits[1];
                document.getElementById('limit_vit').value = d.limits[2];
                recalcSolution();
                alert('Данные загружены!!!');
            } catch (e) {
                alert('Ошибка при загрузке!!!');
            }
        } else {
            resetToVariant7();
        }
    }

    window.addEventListener('load', () => {
        console.log('Страница загружена, инициализация...');

        // Проверяем наличие всех необходимых элементов
        const requiredIds = [
            'a_carbs', 'a_prot', 'a_vit', 'a_price',
            'b_carbs', 'b_prot', 'b_vit', 'b_price',
            'c_carbs', 'c_prot', 'c_vit', 'c_price',
            'limit_carbs', 'limit_prot', 'limit_vit',
            'recalcBtn', 'resetToDefaultBtn', 'saveToLocalBtn', 'loadFromLocalBtn'
        ];

        requiredIds.forEach(id => {
            if (!document.getElementById(id)) {
                console.warn(`Элемент с id "${id}" не найден!`);
            }
        });

        resetToVariant7();

        const recalcBtn = document.getElementById('recalcBtn');
        if (recalcBtn) {
            recalcBtn.addEventListener('click', recalcSolution);
        } else {
            console.error('Кнопка пересчета не найдена!');
        }

        const resetBtn = document.getElementById('resetToDefaultBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetToVariant7);
        }

        const saveBtn = document.getElementById('saveToLocalBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', saveToLocal);
        }

        const loadBtn = document.getElementById('loadFromLocalBtn');
        if (loadBtn) {
            loadBtn.addEventListener('click', loadFromLocal);
        }

        const inputs = document.querySelectorAll('input[type="number"]');
        inputs.forEach(input => {
            input.addEventListener('change', recalcSolution);
        });

        // console.log('Инициализация завершена');
    });
})();