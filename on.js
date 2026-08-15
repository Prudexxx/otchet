
    (function() {
        const ADMIN_PASSWORD = "1234"; 

        // ⚠️ ВСТАВЬТЕ СЮДА ДАННЫЕ ВАШЕГО GITHUB РЕПОЗИТОРИЯ
        const REPO_OWNER = "prudexxx";
        const REPO_NAME = "otchet";
        // ⚠️ ЗАМЕНИТЕ ЭТОТ ТЕКСТ НА ВАШ НОВЫЙ ТОКЕН (внутри кавычек)
        const GITHUB_TOKEN = "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"; 
        const DATA_FILE_PATH = "data.json";
        // ============================================

        const SERVICE_KEYS = [
            "Ведущий", "Чайханщик", "Уборщик", "Закупщик", "Спикерхантер",
            "ПБУ", "ПГО", "ПСО", "Литком", "КАЗНАЧЕй", "ПРЕДСЕДАТЕЛь",
            "замПГО", "РС", "Водовоз", "Админ сайта"
        ];
        const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

        let servicesData = {};
        let dayTiles = [];
        let notices = [];
        let openRoles = {};
        let isUnlocked = false;

        function loadLocalData() {
            try {
                const s = localStorage.getItem('mir_services_backup');
                if (s) servicesData = JSON.parse(s);
                const t = localStorage.getItem('mir_daytiles_backup');
                if (t) dayTiles = JSON.parse(t);
                const n = localStorage.getItem('mir_notices_backup');
                if (n) notices = JSON.parse(n);
            } catch(e) {}
        }
        function saveLocalData() {
            localStorage.setItem('mir_services_backup', JSON.stringify(servicesData));
            localStorage.setItem('mir_daytiles_backup', JSON.stringify(dayTiles));
            localStorage.setItem('mir_notices_backup', JSON.stringify(notices));
        }

        function getThursdays() {
            const now = new Date();
            let startDate = new Date(2026, 7, 6); 
            while (startDate.getDay() !== 4) startDate.setDate(startDate.getDate() + 1);

            const results = []; let current = new Date(startDate);
            const oneMonthAgo = new Date(now); oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
            const endDate = new Date(now.getFullYear() + 5, 11, 31);

            while (current <= endDate) {
                const y = current.getFullYear(); const m = String(current.getMonth() + 1).padStart(2, '0');
                const day = String(current.getDate()).padStart(2, '0');
                results.push({ dateObj: new Date(current), label: `${day}.${m}`, full: `${y}-${m}-${day}` });
                current.setDate(current.getDate() + 7);
            }
            return results.filter(t => t.dateObj >= oneMonthAgo);
        }

        function renderTable() {
            const thead = document.getElementById('tableHead');
            const tbody = document.getElementById('tableBody');
            const thursdays = getThursdays();

            if (thursdays.length === 0) {
                thead.innerHTML = '<tr><th>Служение</th></tr>';
                tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px; color:#888;">Нет актуальных четвергов</td></tr>';
                return;
            }

            let headerRow = '<tr><th>Служение</th>';
            thursdays.forEach(t => { headerRow += `<th class="th-date">${t.label}<small>чт</small></th>`; });
            headerRow += '</tr>';
            thead.innerHTML = headerRow;

            let bodyHtml = '';
            
            SERVICE_KEYS.forEach(key => {
                const isClickable = (key === "Ведущий" || key === "Чайханщик" || key === "Уборщик");
                const classAttr = isClickable ? 'class="clickable-header" data-role="' + key + '"' : '';
                
                bodyHtml += `<tr><td ${classAttr}>${key}</td>`;

                thursdays.forEach(t => {
                    const full = t.full;
                    let value = servicesData[key]?.[full] || '—';
                    let isFree = (value === '—');
                    const cls = isFree ? 'cell-free' : 'cell-occupied';

                    if (isUnlocked) {
                        bodyHtml += `<td class="editable-cell">
                            <select data-role="${key}" data-date="${full}">
                                <option value="—" ${value === '—' ? 'selected' : ''}>—</option>
                                <option value="П" class="status-P" ${value === 'П' ? 'selected' : ''}>П (Присутствовал)</option>
                                <option value="О" class="status-O" ${value === 'О' ? 'selected' : ''}>О (Отсутствовал)</option>
                                <option value="У" class="status-U" ${value === 'У' ? 'selected' : ''}>У (Уважительная)</option>
                            </select>
                        </td>`;
                    } else {
                        let displayValue = value;
                        if (value === 'П') displayValue = '✅ П';
                        else if (value === 'О') displayValue = '❌ О';
                        else if (value === 'У') displayValue = '⚠️ У';
                        
                        bodyHtml += `<td><span class="${cls}">${displayValue}</span></td>`;
                    }
                });
                bodyHtml += '</tr>';

                if (isClickable) {
                    const isOpen = openRoles[key] || false;
                    DAYS.forEach(day => {
                        const rowKey = `${key} ${day}`;
                        const visibilityClass = isOpen ? 'visible' : '';
                        bodyHtml += `<tr class="sub-row ${visibilityClass}"><td>${rowKey}</td>`;

                        thursdays.forEach(t => {
                            const full = t.full;
                            let value = servicesData[rowKey]?.[full] || '—';
                            let isFree = (value === '—');
                            const cls = isFree ? 'cell-free' : 'cell-occupied';

                            if (isUnlocked) {
                                bodyHtml += `<td class="editable-cell">
                                    <select data-role="${rowKey}" data-date="${full}">
                                        <option value="—" ${value === '—' ? 'selected' : ''}>—</option>
                                        <option value="П" class="status-P" ${value === 'П' ? 'selected' : ''}>П (Присутствовал)</option>
                                        <option value="О" class="status-O" ${value === 'О' ? 'selected' : ''}>О (Отсутствовал)</option>
                                        <option value="У" class="status-U" ${value === 'У' ? 'selected' : ''}>У (Уважительная)</option>
                                    </select>
                                </td>`;
                            } else {
                                let displayValue = value;
                                if (value === 'П') displayValue = '✅ П';
                                else if (value === 'О') displayValue = '❌ О';
                                else if (value === 'У') displayValue = '⚠️ У';
                                bodyHtml += `<td><span class="${cls}">${displayValue}</span></td>`;
                            }
                        });
                        bodyHtml += '</tr>';
                    });
                }
            });
            tbody.innerHTML = bodyHtml;

            document.querySelectorAll('.editable-cell select').forEach(select => {
                select.addEventListener('change', function() {
                    const role = this.dataset.role;
                    const date = this.dataset.date;
                    const value = this.value;
                    if (!servicesData[role]) servicesData[role] = {};
                    servicesData[role][date] = value;
                    saveLocalData();
                });
            });

            document.querySelectorAll('.clickable-header').forEach(td => {
                td.addEventListener('click', function() {
                    const role = this.dataset.role;
                    openRoles[role] = !openRoles[role];
                    renderTable(); 
                });
            });
            
            setTimeout(() => {
                const wrap = document.getElementById('tableWrap');
                const ths = wrap.querySelectorAll('thead th');
                let idx = -1;
                ths.forEach((th, i) => { if(th.innerText.includes('30.09')) idx = i; });
                if(idx !== -1 && wrap.querySelector('tbody tr')) {
                    const cell = wrap.querySelector('tbody tr').querySelectorAll('td')[idx];
                    if(cell) wrap.scrollLeft = cell.offsetLeft + cell.offsetWidth - wrap.clientWidth + 50;
                }
            }, 100);
        }

        function renderDayTiles() {
            const container = document.getElementById('dayTilesContainer');
            if (!dayTiles.length) {
                container.innerHTML = `<div style="color:#888; text-align:center; width:100%; padding:20px;">Нет добавленных дней</div>`;
                return;
            }
            let html = '';
            dayTiles.forEach((item, index) => {
                html += `
                    <div class="day-tile" data-index="${index}">
                        <span>${item.date || '—'}</span>
                        <span class="small-date">отчет</span>
                    </div>
                `;
            });
            container.innerHTML = html;
            container.querySelectorAll('.day-tile').forEach(tile => {
                tile.addEventListener('click', function() {
                    const idx = parseInt(this.dataset.index);
                    if (!isNaN(idx) && dayTiles[idx]) {
                        document.getElementById('reportDate').innerText = dayTiles[idx].date || '—';
                        document.getElementById('reportContent').innerText = dayTiles[idx].report || 'Нет текста';
                        document.getElementById('reportModal').classList.add('active');
                    }
                });
            });
        }

        function renderNotices() {
            const container = document.getElementById('noticeList');
            if (!notices.length) {
                container.innerHTML = `<div class="empty-notice">📭 Пока нет заметок.</div>`;
                return;
            }
            let html = '';
            notices.forEach((item, index) => {
                html += `
                    <div class="notice-item">
                        <span class="notice-date">${item.date || '—'}</span>
                        <span class="notice-text">${item.text || ''}</span>
                        <span class="notice-del" data-index="${index}">✖ удалить</span>
                    </div>
                `;
            });
            container.innerHTML = html;
            container.querySelectorAll('.notice-del').forEach(btn => {
                btn.addEventListener('click', function() {
                    const idx = parseInt(this.dataset.index, 10);
                    if (!isNaN(idx) && idx >= 0 && idx < notices.length) {
                        notices.splice(idx, 1);
                        saveLocalData();
                        renderNotices();
                    }
                });
            });
        }

        function refreshAll() {
            loadLocalData();
            renderTable();
            renderDayTiles();
            renderNotices();
        }

        const lockBtn = document.getElementById('lockBtn');
        const adminActions = document.getElementById('adminActions');

        lockBtn.addEventListener('click', function() {
            if (!isUnlocked) {
                const pass = prompt("Введите код доступа для редактирования:");
                if (pass === ADMIN_PASSWORD) {
                    isUnlocked = true;
                    lockBtn.innerHTML = "🔓 Редактирование открыто";
                    lockBtn.classList.add('unlocked');
                    adminActions.classList.add('active');
                    renderTable();
                } else {
                    alert("Неверный код!");
                }
            } else {
                isUnlocked = false;
                lockBtn.innerHTML = "🔒 Редактировать";
                lockBtn.classList.remove('unlocked');
                adminActions.classList.remove('active');
                renderTable();
            }
        });

        // ================= GitHub API ЛОГИКА =================

        async function fetchFromGitHub() {
            try {
                const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE_PATH}`;
                const response = await fetch(url, {
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
                });
                
                // Если ошибка 401 или 404, просто выбрасываем исключение
                if (!response.ok) {
                    throw new Error(`GitHub API Error: ${response.status}`);
                }
                
                const data = await response.json();
                const content = atob(data.content);
                return JSON.parse(content);
            } catch (error) {
                // Прокидываем ошибку наверх, чтобы loadFromGitHub её поймал
                throw error;
            }
        }

        async function saveToGitHub(dataObj) {
            try {
                const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${DATA_FILE_PATH}`;
                
                // 1. Получаем текущий файл, чтобы узнать SHA
                const getResponse = await fetch(url, {
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
                });
                if (!getResponse.ok) {
                    throw new Error(`GitHub API Error (GET): ${getResponse.status}`);
                }
                const fileData = await getResponse.json();
                const sha = fileData.sha;

                // 2. Перезаписываем файл
                const contentString = JSON.stringify(dataObj, null, 2);
                const putResponse = await fetch(url, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: "Update table data via web app",
                        content: btoa(contentString),
                        sha: sha
                    })
                });
                if (!putResponse.ok) {
                    const errDetail = await putResponse.json();
                    throw new Error(`GitHub API Error (PUT): ${putResponse.status} - ${errDetail.message}`);
                }
                return await putResponse.json();
            } catch (error) {
                throw error;
            }
        }

        document.getElementById('saveCloudBtn').addEventListener('click', async function() {
            if(!REPO_OWNER || REPO_OWNER === "ваш_логин" || !GITHUB_TOKEN || GITHUB_TOKEN.length < 10) {
                alert("Сначала настройте переменные REPO_OWNER, REPO_NAME и GITHUB_TOKEN в коде!");
                return;
            }

            const btn = this;
            btn.innerText = "⏳ Сохраняем...";
            btn.disabled = true;

            try {
                const dataToSave = {
                    services: servicesData,
                    dayTiles: dayTiles,
                    notices: notices
                };

                await saveToGitHub(dataToSave);
                alert("✅ Данные успешно сохранены в репозиторий GitHub!");
                
            } catch (err) {
                alert("❌ Ошибка при сохранении в GitHub (код 401). Проверьте токен.\nДанные сохранены локально.");
            } finally {
                btn.innerText = "☁️ Сохранить в облако";
                btn.disabled = false;
            }
        });

        document.getElementById('resetLocalBtn').addEventListener('click', function() {
            if(confirm("Вы уверены, что хотите очистить все локальные данные?")) {
                localStorage.removeItem('mir_services_backup');
                localStorage.removeItem('mir_daytiles_backup');
                localStorage.removeItem('mir_notices_backup');
                servicesData = {}; dayTiles = []; notices = [];
                renderTable(); renderDayTiles(); renderNotices();
                alert("Локальные данные очищены.");
            }
        });

        // Загрузка при старте
        async function loadFromGitHub() {
            if(!REPO_OWNER || REPO_OWNER === "ваш_логин" || !GITHUB_TOKEN || GITHUB_TOKEN.length < 10) {
                refreshAll(); 
                return;
            }

            try {
                const data = await fetchFromGitHub();
                if (data.services) servicesData = data.services;
                if (data.dayTiles) dayTiles = data.dayTiles;
                if (data.notices) notices = data.notices;
                
                saveLocalData();
                renderTable(); renderDayTiles(); renderNotices();
                console.log("✅ Данные успешно подгружены из GitHub!");
            } catch (err) {
                console.warn("⚠️ Не удалось загрузить из GitHub. Ошибка:", err.message);
                refreshAll();
            }
        }

        const modal = document.getElementById('dayModal');
        document.getElementById('addDayBtn').addEventListener('click', function() {
            document.getElementById('modalDayInput').value = '';
            document.getElementById('modalTextInput').value = '';
            modal.classList.add('active');
        });
        document.getElementById('modalCancelBtn').addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('active'); });
        document.getElementById('modalSaveBtn').addEventListener('click', function() {
            const date = document.getElementById('modalDayInput').value.trim();
            const text = document.getElementById('modalTextInput').value.trim();
            if (!date) { alert('Введите дату'); return; }
            if (!text) { alert('Введите текст отчета'); return; }
            dayTiles.push({ date, report: text });
            saveLocalData();
            renderDayTiles();
            modal.classList.remove('active');
        });

        document.getElementById('reportCloseBtn').addEventListener('click', function() {
            document.getElementById('reportModal').classList.remove('active');
        });
        document.getElementById('reportModal').addEventListener('click', function(e) {
            if (e.target === this) this.classList.remove('active');
        });

        loadLocalData(); 
        loadFromGitHub(); 
    })();
