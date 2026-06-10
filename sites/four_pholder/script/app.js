(function () {
    let alternatives = [
        { id: 'X₁', f1: 800, f2: 8, f3: 20, f4: 6 },
        { id: 'X₂', f1: 850, f2: 10, f3: 25, f4: 7 },
        { id: 'X₃', f1: 900, f2: 12, f3: 22, f4: 8 },
        { id: 'X₄', f1: 1000, f2: 12, f3: 30, f4: 9 },
        { id: 'X₅', f1: 950, f2: 11, f3: 28, f4: 7 },
        { id: 'X₆', f1: 820, f2: 9, f3: 24, f4: 8 }
    ];

    // Текущие уступки (синхронизируются с полями)
    let deltas = {
        f1: 200,
        f2: 2,
        f3: 5
    };

    // Состояние алгоритма
    let currentStep = 0;                // 0-4
    let activeSet = [...alternatives];
    let excludedIds = new Set();

    // DOM элементы
    const tableBody = document.getElementById('tableBody');
    const nextStepBtn = document.getElementById('nextStepBtn');
    const resetBtn = document.getElementById('resetBtn');
    const stepDisplay = document.getElementById('stepDisplay');
    const finalResultDiv = document.getElementById('finalResult');
    const delta1Input = document.getElementById('delta1Input');
    const delta2Input = document.getElementById('delta2Input');
    const delta3Input = document.getElementById('delta3Input');

    function readTableData() {
        const rows = tableBody.querySelectorAll('tr');
        const newAlternatives = [];
        rows.forEach(row => {
            const idCell = row.querySelector('td:first-child');
            const inputs = row.querySelectorAll('input');
            if (idCell && inputs.length === 4) {
                const id = idCell.textContent.trim();
                const f1 = parseFloat(inputs[0].value) || 0;
                const f2 = parseFloat(inputs[1].value) || 0;
                const f3 = parseFloat(inputs[2].value) || 0;
                const f4 = parseFloat(inputs[3].value) || 0;
                newAlternatives.push({ id, f1, f2, f3, f4 });
            }
        });
        if (newAlternatives.length > 0) {
            alternatives = newAlternatives;
        }
    }

    // Чтение уступок из полей
    function readDeltas() {
        deltas.f1 = parseFloat(delta1Input.value) || 0;
        deltas.f2 = parseFloat(delta2Input.value) || 0;
        deltas.f3 = parseFloat(delta3Input.value) || 0;
    }

    // Синхронизация активного набора с текущими альтернативами (после редактирования)
    function syncActiveSetAfterEdit() {
        // Сначала читаем актуальные данные
        readTableData();
        readDeltas();

        // Пересобираем активный набор: оставляем только те id, которые есть в alternatives и не исключены
        const validIds = new Set(alternatives.map(a => a.id));
        // Удаляем из excludedIds те, которых больше нет в данных
        for (let id of excludedIds) {
            if (!validIds.has(id)) excludedIds.delete(id);
        }

        // Обновляем activeSet: все альтернативы, не входящие в excludedIds
        activeSet = alternatives.filter(a => !excludedIds.has(a.id));

        // Если текущий шаг был изменён пользователем вручную (редко), но пересчёт нужен.
        // Однако шаги не пересчитываются автоматически — пользователь должен нажимать "Далее".
        // Но после редактирования мы должны оставить активный набор корректным.
        // Дополнительно: если currentStep = 4, а состав изменился, результат может измениться.
        updateUI();
    }

    function renderTable() {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        const activeIds = new Set(activeSet.map(a => a.id));

        alternatives.forEach(alt => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-id', alt.id);

            if (excludedIds.has(alt.id)) {
                tr.classList.add('row-excluded');
            } else if (activeIds.has(alt.id)) {
                tr.classList.add('row-active');
            }

            tr.innerHTML = `
          <td><strong>${alt.id}</strong></td>
          <td><input type="number" value="${alt.f1}" step="10" data-field="f1" data-id="${alt.id}"></td>
          <td><input type="number" value="${alt.f2}" step="0.1" data-field="f2" data-id="${alt.id}"></td>
          <td><input type="number" value="${alt.f3}" step="1" data-field="f3" data-id="${alt.id}"></td>
          <td><input type="number" value="${alt.f4}" step="0.5" data-field="f4" data-id="${alt.id}"></td>
        `;
            tableBody.appendChild(tr);
        });

        document.querySelectorAll('#tableBody input').forEach(input => {
            input.addEventListener('input', function (e) {
                const field = this.dataset.field;
                const id = this.dataset.id;
                const value = parseFloat(this.value);
                if (isNaN(value)) return;

                // Обновляем массив alternatives
                const alt = alternatives.find(a => a.id === id);
                if (alt) {
                    alt[field] = value;
                }
                // После изменения данных пересчитываем активный набор и исключения,
                // но сохраняем текущий шаг. Пользователь может продолжить с текущего шага.
                syncActiveSetAfterEdit();
            });
        });
    }

    function updateUI() {
        renderTable();
        stepDisplay.textContent = `Шаг ${currentStep} / 4`;
        nextStepBtn.disabled = (currentStep >= 4 || activeSet.length === 0);

        if (currentStep === 4 && activeSet.length > 0) {
            const bestByF4 = activeSet.reduce((prev, curr) => (curr.f4 > prev.f4 ? curr : prev), activeSet[0]);
            finalResultDiv.innerHTML = `Выбрана: <strong style="font-size:1.5rem; margin:0 0.3rem;">${bestByF4.id}</strong> (f₄ = ${bestByF4.f4} баллов)`;
        } else if (currentStep === 4 && activeSet.length === 0) {
            finalResultDiv.innerHTML = `Все альтернативы исключены.`;
        } else if (activeSet.length === 0 && currentStep > 0) {
            finalResultDiv.innerHTML = `Нет доступных альтернатив после шага ${currentStep}.`;
        } else {
            finalResultDiv.innerHTML = `Шаг ${currentStep}: активных систем – ${activeSet.length}`;
        }
    }

    // Сброс
    function resetProcess() {
        readTableData();
        readDeltas();
        currentStep = 0;
        excludedIds.clear();
        activeSet = [...alternatives];
        updateUI();
    }

    // Выполнение шага
    function executeNextStep() {
        if (currentStep >= 4 || activeSet.length === 0) return;

        // Перед шагом убедимся, что данные свежие
        readTableData();
        readDeltas();

        currentStep++;

        if (currentStep === 1) {
            const minF1 = Math.min(...activeSet.map(a => a.f1));
            const threshold = minF1 + deltas.f1;
            const newActive = activeSet.filter(a => a.f1 <= threshold);
            const removed = activeSet.filter(a => a.f1 > threshold).map(a => a.id);
            removed.forEach(id => excludedIds.add(id));
            activeSet = newActive;
        }
        else if (currentStep === 2) {
            if (activeSet.length === 0) { updateUI(); return; }
            const maxF2 = Math.max(...activeSet.map(a => a.f2));
            const threshold = maxF2 - deltas.f2;
            const newActive = activeSet.filter(a => a.f2 >= threshold);
            const removed = activeSet.filter(a => a.f2 < threshold).map(a => a.id);
            removed.forEach(id => excludedIds.add(id));
            activeSet = newActive;
        }
        else if (currentStep === 3) {
            if (activeSet.length === 0) { updateUI(); return; }
            const maxF3 = Math.max(...activeSet.map(a => a.f3));
            const threshold = maxF3 - deltas.f3;
            const newActive = activeSet.filter(a => a.f3 >= threshold);
            const removed = activeSet.filter(a => a.f3 < threshold).map(a => a.id);
            removed.forEach(id => excludedIds.add(id));
            activeSet = newActive;
        }
        else if (currentStep === 4) {
            // Пока пусто
        }

        updateUI();
    }

    // Обработчики кнопок
    nextStepBtn.addEventListener('click', executeNextStep);
    resetBtn.addEventListener('click', resetProcess);

    // Изменение уступок в реальном времени
    [delta1Input, delta2Input, delta3Input].forEach(inp => {
        inp.addEventListener('input', () => {
            readDeltas();
            updateUI();
        });
    });

    // Первичная инициализация
    resetProcess();
})();