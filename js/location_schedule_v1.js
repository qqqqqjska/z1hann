(function () {
    const HOST_ID = 'location-app';
    const SOURCE_URL = 'schedule_v1.html';

    const eventsData = {
        1: [{ title: 'Sleep', type: 'pink' }],
        2: [{ title: 'Deep Work', type: 'blue' }],
        3: [{ title: 'Coffee Chat', type: 'purple' }],
        4: [{ title: 'Workout', type: 'green' }],
        5: [{ title: 'Commute', type: 'orange' }],
        6: [{ title: 'Movie', type: 'pink' }],
        7: [{ title: 'Lunch', type: 'yellow' }],
        8: [{ title: 'Sleep', type: 'orange' }],
        9: [{ title: 'Deep Work', type: 'blue' }],
        10: [{ title: 'Coffee Chat', type: 'purple' }],
        11: [{ title: 'Workout', type: 'green' }],
        12: [{ title: 'Commute', type: 'orange' }],
        13: [{ title: 'Movie', type: 'pink' }],
        14: [{ title: 'Lunch', type: 'yellow' }],
        15: [{ title: 'Sleep', type: 'orange' }],
        16: [{ title: 'Deep Work', type: 'blue' }],
        17: [{ title: 'Coffee Chat', type: 'purple' }],
        18: [{ title: 'Workout', type: 'green' }],
        19: [{ title: 'Commute', type: 'orange' }],
        20: [
            { title: 'Commute', type: 'orange', time: '08:30', desc: 'Morning drive to the city center.' },
            { title: 'Deep Work', type: 'blue', time: '09:30', desc: 'Focus time on the new project UI/UX design.' },
            { title: 'Lunch', type: 'yellow', time: '12:30', desc: 'Salad and coffee.' },
            { title: 'Workout', type: 'green', time: '18:00', desc: 'Evening run in the park.' }
        ],
        21: [
            { title: 'Coffee Chat', type: 'purple', time: '10:00', desc: 'Catch up with Sarah.' },
            { title: 'Meeting', type: 'blue', time: '14:00', desc: 'Weekly sync with the team.' }
        ],
        22: [{ title: 'Sleep', type: 'pink' }],
        23: [{ title: 'Reading', type: 'green' }],
        24: [{ title: 'Deep Work', type: 'blue' }],
        25: [{ title: 'Shower', type: 'yellow' }, { title: '+3 MORE', type: 'dots' }],
        26: [{ title: 'Phone Scroll', type: 'pink' }, { title: '+4 MORE', type: 'dots' }],
        30: [{ title: 'Deep Work', type: 'blue' }]
    };

    const state = {
        host: null,
        shadowRoot: null,
        phone: null,
        tabs: [],
        views: {},
        ui: {},
        currentTabIndex: 2,
        currentTabName: 'monthly',
        currentDailyDateKey: '',
        generatedPlan: null,
        planGenerating: false,
        dailyRevealTimer: null,
        autoAdjustTimer: null,
        autoAdjustInFlight: false,
        autoAdjustSettings: null,
        autoAdjustContactId: '',
        planModeOverlay: null,
        planModeClose: null,
        planModeDailyButton: null,
        planModeFullButton: null,
        planModeCancelButton: null,
        initPromise: null,
        ready: false
    };

    function stripInlineHandlers(root) {
        root.querySelectorAll('script').forEach((node) => node.remove());
        root.querySelectorAll('*').forEach((node) => {
            Array.from(node.attributes || []).forEach((attr) => {
                if (attr.name.startsWith('on')) {
                    node.removeAttribute(attr.name);
                }
            });
        });
    }

    function rewriteStyles(styleText) {
        return String(styleText || '')
            .replace(/:root\s*\{/g, ':host {')
            .replace(/\bbody\s*\{/g, ':host {');
    }

    function getDaySuffix(day) {
        let suffix = 'th';
        if (day % 10 === 1 && day !== 11) suffix = 'st';
        if (day % 10 === 2 && day !== 12) suffix = 'nd';
        if (day % 10 === 3 && day !== 13) suffix = 'rd';
        return suffix;
    }

    function formatMonthDayLabel(day) {
        return `${day}<sup>${getDaySuffix(day)}</sup>`;
    }

    const MONTH_NAMES_EN = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const MONTH_NAMES_ZH = [
        '一月', '二月', '三月', '四月', '五月', '六月',
        '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    const MONTH_NAMES_ABBR = [
        'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
        'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
    ];
    const WEEKDAY_NAMES_LONG = [
        'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY',
        'THURSDAY', 'FRIDAY', 'SATURDAY'
    ];
    const WEEKDAY_NAMES_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const WEEKDAY_NAMES_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const PLANNER_STORAGE_PREFIX = 'location-schedule-v1';
    const PLANNER_ALLOWED_TYPES = ['blue', 'purple', 'orange', 'green', 'pink', 'yellow'];
    const PLANNER_ALLOWED_TYPE_SET = new Set(PLANNER_ALLOWED_TYPES);
    const PLANNER_AUTO_ADJUST_DEFAULT_LIMIT = 5;
    const PLANNER_DAILY_TWIST_PROBABILITY = 0.18;
    const PLANNER_AMAP_VENUE_CACHE_TTL = 10 * 60 * 1000;
    const plannerAmapVenueSearchCache = new Map();

    function padPlannerNumber(value) {
        return String(value).padStart(2, '0');
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatPlannerDateKey(date = new Date()) {
        const value = new Date(date);
        if (Number.isNaN(value.getTime())) return '';
        return `${value.getFullYear()}-${padPlannerNumber(value.getMonth() + 1)}-${padPlannerNumber(value.getDate())}`;
    }

    function formatPlannerMonthKey(context = getPlannerDateContext()) {
        return `${context.year}-${padPlannerNumber(context.monthNumber)}`;
    }

    function formatPlannerWeekKey(context = getPlannerDateContext()) {
        return `${formatPlannerDateKey(context.weekStart)}_${formatPlannerDateKey(context.weekEnd)}`;
    }

    function formatPlannerClockTime(date = new Date()) {
        const value = new Date(date);
        if (Number.isNaN(value.getTime())) return '00:00';
        return `${padPlannerNumber(value.getHours())}:${padPlannerNumber(value.getMinutes())}`;
    }

    function resolvePlannerDateInput(value, context = getPlannerDateContext()) {
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
            return new Date(value);
        }

        const text = String(value || '').trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
            const parsed = new Date(`${text}T00:00:00`);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed;
            }
        }

        const dayNumber = Number(value);
        if (Number.isFinite(dayNumber)) {
            return new Date(context.year, context.monthIndex, dayNumber);
        }

        return new Date(context.date);
    }

    function normalizePlannerTimeLabel(value) {
        const text = String(value || '').trim();
        const match = text.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
        if (!match) return '';
        const hours = Math.max(0, Math.min(23, Number(match[1]) || 0));
        const minutes = Math.max(0, Math.min(59, Number(match[2] || '0') || 0));
        return `${padPlannerNumber(hours)}:${padPlannerNumber(minutes)}`;
    }

    function getPlannerTimeMinutes(timeLabel) {
        const normalized = normalizePlannerTimeLabel(timeLabel);
        if (!normalized) return -1;
        const [hours, minutes] = normalized.split(':').map((part) => Number(part) || 0);
        return (hours * 60) + minutes;
    }

    function getPlannerStorageContactId(contact = getPlannerTargetContact()) {
        const contactId = contact && contact.id !== undefined && contact.id !== null && String(contact.id).trim() !== ''
            ? String(contact.id)
            : '';
        return contactId || 'default';
    }

    function getPlannerStorageKey(kind, scopeKey, contact = getPlannerTargetContact()) {
        const safeKind = String(kind || 'plan').trim() || 'plan';
        const safeScope = String(scopeKey || 'default').trim() || 'default';
        return `${PLANNER_STORAGE_PREFIX}:${getPlannerStorageContactId(contact)}:${safeKind}:${safeScope}`;
    }

    function getPlannerAutoAdjustStorageKey(contact = getPlannerTargetContact()) {
        return getPlannerStorageKey('auto-adjust', 'settings', contact);
    }

    function readPlannerStorage(key) {
        try {
            if (!key || typeof localStorage === 'undefined') return null;
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch (error) {
            console.warn('[location-schedule-v1] failed to read planner storage:', error);
            return null;
        }
    }

    function writePlannerStorage(key, value) {
        try {
            if (!key || typeof localStorage === 'undefined') return false;
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('[location-schedule-v1] failed to write planner storage:', error);
            return false;
        }
    }

    function removePlannerStorage(key) {
        try {
            if (!key || typeof localStorage === 'undefined') return false;
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('[location-schedule-v1] failed to remove planner storage:', error);
            return false;
        }
    }

    function getPlannerChatHistory(contact) {
        if (!contact) return [];
        const stateRoot = window.iphoneSimState || {};
        const history = stateRoot.chatHistory && stateRoot.chatHistory[contact.id];
        return Array.isArray(history) ? history : [];
    }

    function getPlannerCurrentDateKey(date = new Date()) {
        return formatPlannerDateKey(date);
    }

    function getPlannerMonthlyPhotoStorageKey(contact = getPlannerTargetContact()) {
        return getPlannerStorageKey('photo', 'monthly-cover', contact);
    }

    function applyPlannerMonthlyPhoto(photoDataUrl = '', options = {}) {
        const src = String(photoDataUrl || '').trim();
        const shouldShow = Boolean(src);

        if (state.ui.uploadedPhoto) {
            state.ui.uploadedPhoto.src = shouldShow ? src : '';
            state.ui.uploadedPhoto.style.display = shouldShow ? 'block' : 'none';
        }
        if (state.ui.uploadPlaceholder) {
            state.ui.uploadPlaceholder.style.display = shouldShow ? 'none' : 'block';
        }
        if (state.ui.photoUploadArea) {
            state.ui.photoUploadArea.classList.toggle('has-image', shouldShow);
        }

        if (options.persist) {
            const contact = getPlannerTargetContact();
            const storageKey = getPlannerMonthlyPhotoStorageKey(contact);
            if (shouldShow) {
                writePlannerStorage(storageKey, {
                    version: 1,
                    updatedAt: Date.now(),
                    dataUrl: src
                });
            } else {
                removePlannerStorage(storageKey);
            }
        }

        return src;
    }

    function restorePlannerMonthlyPhoto() {
        const contact = getPlannerTargetContact();
        const storageKey = getPlannerMonthlyPhotoStorageKey(contact);
        const record = readPlannerStorage(storageKey);
        const photoDataUrl = typeof record === 'string'
            ? record
            : String(record && (record.dataUrl || record.src) || '').trim();
        applyPlannerMonthlyPhoto(photoDataUrl, { persist: false });
    }

    function resolvePlannerContactLike(contactLike) {
        if (contactLike && typeof contactLike === 'object' && contactLike.id !== undefined && contactLike.id !== null) {
            return contactLike;
        }

        const contactId = String(contactLike || '').trim();
        if (!contactId) return getPlannerTargetContact();

        const stateRoot = window.iphoneSimState || {};
        const contacts = Array.isArray(stateRoot.contacts) ? stateRoot.contacts : [];
        return contacts.find((contact) => String(contact.id) === contactId) || null;
    }

    function normalizePlannerAutoAdjustSettings(rawSettings, contact = getPlannerTargetContact()) {
        const history = getPlannerChatHistory(contact);
        const currentDateKey = getPlannerCurrentDateKey(getPlannerDateContext().date);
        const raw = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
        const enabled = Boolean(raw.enabled);
        const limitValue = Number(raw.limit);
        const limit = Math.max(1, Number.isFinite(limitValue) ? Math.floor(limitValue) : PLANNER_AUTO_ADJUST_DEFAULT_LIMIT);
        const storedDateKey = String(raw.baselineDateKey || '').trim();
        const storedCountValue = Number(raw.baselineCount);
        const baselineDateKey = storedDateKey === currentDateKey ? storedDateKey : currentDateKey;
        const baselineCount = storedDateKey === currentDateKey && Number.isFinite(storedCountValue)
            ? Math.max(0, Math.min(history.length, Math.floor(storedCountValue)))
            : history.length;

        return {
            enabled,
            limit,
            baselineDateKey,
            baselineCount,
            lastTriggeredAt: Number(raw.lastTriggeredAt) || 0,
            updatedAt: Number(raw.updatedAt) || Date.now(),
            contactId: String(contact && contact.id !== undefined && contact.id !== null ? contact.id : '').trim()
        };
    }

    function loadPlannerAutoAdjustSettings(contact = getPlannerTargetContact()) {
        const raw = readPlannerStorage(getPlannerAutoAdjustStorageKey(contact));
        return normalizePlannerAutoAdjustSettings(raw, contact);
    }

    function savePlannerAutoAdjustSettings(settings, contact = getPlannerTargetContact()) {
        const normalized = normalizePlannerAutoAdjustSettings(settings, contact);
        normalized.updatedAt = Date.now();
        writePlannerStorage(getPlannerAutoAdjustStorageKey(contact), normalized);
        return normalized;
    }

    function getPlannerDateContext(baseDate = new Date()) {
        const date = new Date(baseDate);
        const year = date.getFullYear();
        const monthIndex = date.getMonth();
        const monthNumber = monthIndex + 1;
        const monthDays = new Date(year, monthIndex + 1, 0).getDate();
        const weekStart = new Date(date);
        const weekOffset = (date.getDay() + 6) % 7;
        weekStart.setDate(date.getDate() - weekOffset);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        const firstOfMonth = new Date(year, monthIndex, 1);
        const gridStartOffset = (firstOfMonth.getDay() + 6) % 7;
        const gridStartDate = new Date(year, monthIndex, 1 - gridStartOffset);

        return {
            date,
            year,
            monthIndex,
            monthNumber,
            monthDays,
            monthNameEn: MONTH_NAMES_EN[monthIndex],
            monthNameZh: MONTH_NAMES_ZH[monthIndex],
            monthAbbr: MONTH_NAMES_ABBR[monthIndex],
            weekStart,
            weekEnd,
            gridStartDate,
            gridStartOffset
        };
    }

    function formatPlannerWeekRange(startDate, endDate) {
        const sameYear = startDate.getFullYear() === endDate.getFullYear();
        const sameMonth = sameYear && startDate.getMonth() === endDate.getMonth();
        const startMonth = MONTH_NAMES_ABBR[startDate.getMonth()];
        const endMonth = MONTH_NAMES_ABBR[endDate.getMonth()];
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();

        if (sameMonth) {
            return `${startMonth} ${startDay} - ${endDay}`;
        }

        if (sameYear) {
            return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
        }

        return `${startMonth} ${startDay}, ${startDate.getFullYear()} - ${endMonth} ${endDay}, ${endDate.getFullYear()}`;
    }

    function getISOWeekNumber(date) {
        const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = target.getUTCDay() || 7;
        target.setUTCDate(target.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
        return Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
    }

    function syncPlannerDateLabels(context = getPlannerDateContext()) {
        if (!state.shadowRoot) return;

        const monthLabel = state.shadowRoot.querySelector('.header-top > div:first-child > .text-xs');
        if (monthLabel) {
            monthLabel.textContent = `MONTH · ${padPlannerNumber(context.monthNumber)} OF 12`;
        }

        const monthTitle = state.shadowRoot.querySelector('.month-title');
        if (monthTitle) monthTitle.textContent = context.monthNameEn;

        const monthZh = state.shadowRoot.querySelector('.month-zh');
        if (monthZh) monthZh.textContent = context.monthNameZh;

        const subTitle = state.shadowRoot.querySelector('.sub-title');
        if (subTitle) {
            const generatedSummary = state.generatedPlan && state.generatedPlan.month && state.generatedPlan.month.summary
                ? String(state.generatedPlan.month.summary).trim()
                : '';
            subTitle.textContent = generatedSummary || `latest — ${WEEKDAY_NAMES_LONG[context.date.getDay()]} in ${context.monthNameEn}.`;
        }

        const yearTitle = state.shadowRoot.querySelector('.year-title');
        if (yearTitle) yearTitle.textContent = String(context.year);

        const weeklyRange = state.shadowRoot.querySelector('#view-weekly .weekly-view > div > div:last-child');
        if (weeklyRange) {
            weeklyRange.textContent = formatPlannerWeekRange(context.weekStart, context.weekEnd).toUpperCase();
        }
    }

    function buildPlannerDailyEntries(context, monthEvents, weekGoalGroups, generatedAt = new Date()) {
        const cutoffTime = formatPlannerClockTime(generatedAt);
        const activeEvents = Array.isArray(monthEvents)
            ? monthEvents.filter((event) => event && Number(context.date.getDate()) >= Number(event.startDay) && Number(context.date.getDate()) <= Number(event.endDay))
            : [];
        const primaryEvent = activeEvents[0] || monthEvents[0] || null;
        const secondaryEvent = activeEvents[1] || monthEvents[1] || null;
        const importantItems = Array.isArray(weekGoalGroups && weekGoalGroups[0] && weekGoalGroups[0].items) ? weekGoalGroups[0].items : [];
        const habitItems = Array.isArray(weekGoalGroups && weekGoalGroups[1] && weekGoalGroups[1].items) ? weekGoalGroups[1].items : [];
        const optionalItems = Array.isArray(weekGoalGroups && weekGoalGroups[2] && weekGoalGroups[2].items) ? weekGoalGroups[2].items : [];
        const mainFocus = primaryEvent ? primaryEvent.title : (importantItems[0] || '今日重点');
        const secondaryFocus = secondaryEvent ? secondaryEvent.title : (importantItems[1] || importantItems[0] || '第二优先级');
        const habitFocus = habitItems[0] || '习惯养成';
        const optionalFocus = optionalItems[0] || '自选事项';
        const entryType = (event, fallbackType) => {
            const type = String(event && event.type ? event.type : fallbackType || 'blue').toLowerCase();
            return PLANNER_ALLOWED_TYPE_SET.has(type) ? type : 'blue';
        };
        const random = createPlannerRandom([
            formatPlannerDateKey(context.date),
            cutoffTime,
            mainFocus,
            secondaryFocus,
            habitFocus,
            optionalFocus,
            ...(Array.isArray(monthEvents) ? monthEvents.map((event) => String(event && event.title ? event.title : '').trim()) : [])
        ].join('||'));
        const buildTime = (hour, minute, spread = 5) => {
            const base = (Number(hour) * 60) + (Number(minute) || 0);
            const offset = Math.round((random() * 2 - 1) * spread);
            const safeMinutes = Math.max(0, Math.min(23 * 60 + 59, base + offset));
            return `${padPlannerNumber(Math.floor(safeMinutes / 60))}:${padPlannerNumber(safeMinutes % 60)}`;
        };
        const buildEntry = (time, title, desc, type) => ({
            time: normalizePlannerTimeLabel(time),
            title: String(title || '事项').trim() || '事项',
            desc: String(desc || '').trim(),
            type: PLANNER_ALLOWED_TYPE_SET.has(String(type || '').toLowerCase()) ? String(type || '').toLowerCase() : 'blue'
        });

        const candidates = [
            buildEntry('00:00', '夜间收尾', `把白天剩下的事情收一收，给 ${mainFocus} 留一点余地。`, 'yellow'),
            buildEntry(buildTime(7, 20, 6), '晨间收拾', `慢慢进入状态，先把今天要出门和要做的事理一遍。`, 'blue'),
            buildEntry(buildTime(9, 10, 6), primaryEvent ? primaryEvent.title : '推进重点', primaryEvent && primaryEvent.note
                ? primaryEvent.note
                : `先处理 ${importantItems[1] || mainFocus}，再看看中午有没有空。`, entryType(primaryEvent, 'purple')),
            buildEntry(buildTime(11, 30, 6), secondaryEvent ? secondaryEvent.title : '出门吃饭', secondaryEvent && secondaryEvent.note
                ? secondaryEvent.note
                : `顺手确认 ${habitFocus}，顺便吃点东西或者见个朋友。`, entryType(secondaryEvent, 'orange')),
            buildEntry(buildTime(13, 20, 6), '午间补给', `留一点缓冲，吃点东西，顺手把下午的节奏重新排一下。`, 'green'),
            buildEntry(buildTime(15, 40, 6), optionalItems[0] ? optionalItems[0] : '临时办事', optionalItems[0]
                ? `把 ${optionalItems[0]} 往前推一点。`
                : `如果临时有安排，就先把 ${importantItems[2] || optionalFocus} 往后挪。`, 'orange'),
            buildEntry(buildTime(18, 10, 6), '傍晚收尾', `看看要不要顺路吃饭、见朋友或者直接回家，把今天的尾巴收好。`, 'purple'),
            buildEntry(buildTime(21, 20, 6), '夜间整理', `整理明天要带走的东西，给 ${secondaryFocus} 留个尾巴。`, 'pink')
        ];

        if (random() < PLANNER_DAILY_TWIST_PROBABILITY) {
            const luckyTwist = random() < 0.6;
            const twistTimeOptions = ['10:20', '14:45', '17:05', '20:05'];
            const twistTime = twistTimeOptions[Math.floor(random() * twistTimeOptions.length)] || '14:45';
            const twistType = luckyTwist
                ? (random() < 0.5 ? 'green' : 'yellow')
                : (random() < 0.5 ? 'orange' : 'pink');
            candidates.push(buildEntry(
                twistTime,
                luckyTwist ? '小惊喜' : '临时插曲',
                luckyTwist
                    ? `顺手收获一点额外好运，刚好把 ${mainFocus} 往前推了一步。`
                    : `临时遇到一点小波折，先把节奏拉稳，再继续处理 ${optionalFocus}。`,
                twistType
            ));
        }

        const dedupedEntries = [];
        const seenTimes = new Set();
        candidates
            .filter((item) => item && normalizePlannerTimeLabel(item.time))
            .sort((a, b) => getPlannerTimeMinutes(a.time) - getPlannerTimeMinutes(b.time))
            .forEach((entry) => {
                if (seenTimes.has(entry.time)) return;
                seenTimes.add(entry.time);
                dedupedEntries.push(entry);
            });

        return {
            dateKey: formatPlannerDateKey(context.date),
            cutoffTime,
            summary: `今天的行程围绕 ${mainFocus} 展开，中间会穿插出门、吃饭和缓冲时间，一路推进到夜间收尾。`,
            chips: [
                '全天行程',
                mainFocus,
                `${dedupedEntries.length} 个节点`
            ],
            entries: dedupedEntries
        };
    }

    function createGeneratedPlan() {
        const context = getPlannerDateContext();
        const generatedAt = new Date();
        const monthEvents = [
            { title: '考试', type: 'blue', startDay: Math.max(1, Math.min(context.monthDays, 3)), endDay: Math.max(1, Math.min(context.monthDays, 3)), note: '上午考试，提前一天把复习和材料收好。' },
            { title: '朋友聚餐', type: 'pink', startDay: Math.max(1, Math.min(context.monthDays, 5)), endDay: Math.max(1, Math.min(context.monthDays, 5)), note: '晚上和朋友吃饭，顺便聊聊最近的近况。' },
            { title: '短途出行', type: 'green', startDay: Math.max(1, Math.min(context.monthDays, 8)), endDay: Math.max(1, Math.min(context.monthDays, 9)), note: '周末出去走走，记得预留路上时间。' },
            { title: '会议', type: 'purple', startDay: Math.max(1, Math.min(context.monthDays, 13)), endDay: Math.max(1, Math.min(context.monthDays, 13)), note: '团队对齐进度，确认接下来怎么推进。' },
            { title: 'DDL', type: 'orange', startDay: Math.max(1, Math.min(context.monthDays, 17)), endDay: Math.max(1, Math.min(context.monthDays, 19)), note: '把该交的内容收尾，留一点缓冲。' },
            { title: '家里安排', type: 'yellow', startDay: Math.max(1, Math.min(context.monthDays, 22)), endDay: Math.max(1, Math.min(context.monthDays, 23)), note: '处理家里事情，节奏别排太满。' },
            { title: '复盘', type: 'blue', startDay: Math.max(1, Math.min(context.monthDays, 28)), endDay: Math.max(1, Math.min(context.monthDays, 30)), note: '月末整理、复盘和下月预留。' }
        ];
        const primaryMonthEvent = monthEvents[0];
        const secondaryMonthEvent = monthEvents[1];
        const tertiaryMonthEvent = monthEvents[2];
        const dailyTemplates = [
            [`整理 ${primaryMonthEvent.title} 的材料`, '吃早餐', '喝 800ml 水'],
            [`完成 ${secondaryMonthEvent.title} 的准备`, '午间散步 20 分钟'],
            [`推进 ${tertiaryMonthEvent.title} 的出行/安排`],
            ['复查细节与遗漏', '给自己留半小时空档'],
            [`完成 ${monthEvents[3].title} 的阶段确认`, '去买点东西', '记账整理'],
            ['补漏和归档', '和朋友聊两句', '晚间拉伸'],
            ['下周预览与资料备份', '收拾包里东西']
        ];
        const weekDates = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(context.weekStart);
            date.setDate(context.weekStart.getDate() + index);
            return date;
        });
        const crossDayCount = monthEvents.filter((event) => Number(event.endDay) > Number(event.startDay)).length;
        const weekGoalGroups = [
            {
                title: '重要必做',
                items: [
                    `完成 ${primaryMonthEvent.title} 前的资料整理`,
                    `推进 ${secondaryMonthEvent.title} 的准备`,
                    `收尾 ${tertiaryMonthEvent.title} 相关事项`
                ]
            },
            {
                title: '习惯养成',
                items: ['每日喝 800ml 水', '阅读 20 分钟', '晚间拉伸 10 分钟']
            },
            {
                title: '自选事项',
                items: ['爬坡运动 30 分钟', '每周存钱 200 元', '整理灵感板']
            }
        ];
        const daily = buildPlannerDailyEntries(context, monthEvents, weekGoalGroups, generatedAt);

        return {
            month: {
                summary: `月计划围绕 ${monthEvents.slice(0, 4).map((event) => event.title).join('、')} 展开，工作、生活和出行会一起排进来，先看清本月节奏，再安排每天的执行顺序。`,
                chips: [
                    `${monthEvents.length} 个重要标注`,
                    `${crossDayCount} 个跨天事项`,
                    '按优先级排序'
                ],
                events: monthEvents
            },
            week: {
                rangeLabel: formatPlannerWeekRange(context.weekStart, context.weekEnd),
                summary: `本周先围绕 ${primaryMonthEvent.title} 和 ${secondaryMonthEvent.title} 展开，再把推进节奏拆到每天，并留出吃饭、见面和休息的空档。`,
                chips: ['月度重点下钻', '按日拆解', '三类目标'],
                goalGroups: weekGoalGroups,
                dailyPlans: weekDates.map((date, index) => ({
                    dayNum: date.getDate(),
                    weekday: WEEKDAY_NAMES_ZH[date.getDay()],
                    dateKey: formatPlannerDateKey(date),
                    items: dailyTemplates[index].slice()
                }))
            },
            daily: {
                dateKey: daily.dateKey,
                cutoffTime: daily.cutoffTime,
                summary: daily.summary,
                chips: daily.chips,
                entries: daily.entries
            }
        };
    }

    function createGeneratedDailyPlan(basePlan = state.generatedPlan) {
        const context = getPlannerDateContext();
        const generatedAt = new Date();
        const fallbackPlan = createGeneratedPlan();
        const sourceMonthEvents = basePlan && basePlan.month && Array.isArray(basePlan.month.events) && basePlan.month.events.length
            ? basePlan.month.events
            : (fallbackPlan.month && Array.isArray(fallbackPlan.month.events) ? fallbackPlan.month.events : []);
        const sourceWeekGoalGroups = basePlan && basePlan.week && Array.isArray(basePlan.week.goalGroups) && basePlan.week.goalGroups.length
            ? basePlan.week.goalGroups
            : (fallbackPlan.week && Array.isArray(fallbackPlan.week.goalGroups) ? fallbackPlan.week.goalGroups : []);

        return buildPlannerDailyEntries(context, sourceMonthEvents, sourceWeekGoalGroups, generatedAt);
    }

    function getPlannerAiSettings() {
        const stateRoot = window.iphoneSimState || {};
        const primary = stateRoot.aiSettings;
        const secondary = stateRoot.aiSettings2;
        if (primary && primary.url && primary.key) return primary;
        if (secondary && secondary.url && secondary.key) return secondary;
        return null;
    }

    function getPlannerTargetContact() {
        const stateRoot = window.iphoneSimState || {};
        const contactId = stateRoot.currentChatContactId || stateRoot.currentAiProfileContactId || null;
        if (contactId === null || contactId === undefined || contactId === '') return null;
        const contacts = Array.isArray(stateRoot.contacts) ? stateRoot.contacts : [];
        return contacts.find((contact) => String(contact.id) === String(contactId)) || null;
    }

    function clampPlannerText(value, maxLength = 180) {
        const text = String(value || '').replace(/\r\n/g, '\n').trim();
        if (text.length <= maxLength) return text;
        return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
    }

    function formatPlannerTimeLabel(timeValue) {
        const time = new Date(Number(timeValue) || Date.now());
        if (Number.isNaN(time.getTime())) return '';
        const year = time.getFullYear();
        const month = String(time.getMonth() + 1).padStart(2, '0');
        const day = String(time.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getPlannerWorldbookContext(contact) {
        if (!contact) return '';
        const stateRoot = window.iphoneSimState || {};
        const worldbook = Array.isArray(stateRoot.worldbook) ? stateRoot.worldbook : [];
        const linkedCategories = Array.isArray(contact.linkedWbCategories) ? contact.linkedWbCategories : [];
        if (!worldbook.length || !linkedCategories.length) return '';
        const linkedCategorySet = new Set(linkedCategories.map((item) => String(item)));

        return worldbook
            .filter((entry) => entry && entry.enabled && linkedCategorySet.has(String(entry.categoryId)))
            .slice(0, 6)
            .map((entry, index) => {
                const title = String(entry.title || entry.name || entry.categoryName || entry.categoryId || `世界书条目${index + 1}`).trim();
                const content = clampPlannerText(entry.content || '', 220);
                if (!content) return '';
                return `- ${title}：${content}`;
            })
            .filter(Boolean)
            .join('\n');
    }

    function getPlannerMemoryContext(contact) {
        if (!contact) return '';
        const stateRoot = window.iphoneSimState || {};
        const memorySource = typeof getContactMemories === 'function'
            ? getContactMemories(contact.id)
            : (Array.isArray(stateRoot.memories)
                ? stateRoot.memories.filter((memory) => String(memory && memory.contactId) === String(contact.id) && (memory.reviewStatus || 'approved') === 'approved')
                : []);
        const memories = Array.isArray(memorySource)
            ? memorySource.slice().sort((a, b) => Number(b && b.time ? b.time : 0) - Number(a && a.time ? a.time : 0))
            : [];
        const importantStates = Array.isArray(contact.importantStates) ? contact.importantStates.slice(0, 5) : [];
        const lines = [];

        if (importantStates.length) {
            lines.push(`- 重要状态：${importantStates.map((item) => String(item || '').trim()).filter(Boolean).join('；')}`);
        }

        memories.slice(0, 8).forEach((memory, index) => {
            const content = clampPlannerText(memory && memory.content ? memory.content : '', 180);
            if (!content) return;
            const tags = Array.isArray(memory.memoryTags) ? memory.memoryTags.map((tag) => String(tag || '').trim()).filter(Boolean) : [];
            const tagText = tags.length ? ` [${tags.join(', ')}]` : '';
            const timeLabel = formatPlannerTimeLabel(memory && memory.time);
            const timePrefix = timeLabel ? `${timeLabel} ` : '';
            lines.push(`- 记忆${index + 1}${tagText}：${timePrefix}${content}`);
        });

        return lines.join('\n');
    }

    function getPlannerRecentChatContext(contact, userPersona = null, limit = 12) {
        if (!contact) return '';
        const stateRoot = window.iphoneSimState || {};
        const history = Array.isArray(stateRoot.chatHistory && stateRoot.chatHistory[contact.id]) ? stateRoot.chatHistory[contact.id] : [];
        if (!history.length) return '';
        const contactLabel = String(contact.remark || contact.name || '联系人').trim() || '联系人';
        const userLabel = String(userPersona && userPersona.name ? userPersona.name : '用户').trim() || '用户';

        return history
            .slice(-Math.max(1, limit))
            .map((message) => {
                const role = message && message.role === 'user' ? userLabel : contactLabel;
                const content = clampPlannerText(message && message.content ? message.content : '', 160);
                return content ? `${role}：${content}` : '';
            })
            .filter(Boolean)
            .join('\n');
    }

    function getPlannerResolvedUserPersonaContext(contact) {
        const stateRoot = window.iphoneSimState || {};
        const personas = Array.isArray(stateRoot.userPersonas) ? stateRoot.userPersonas : [];
        const userProfile = stateRoot.userProfile && typeof stateRoot.userProfile === 'object' ? stateRoot.userProfile : {};
        const resolvedPersonaId = contact && contact.userPersonaId
            ? contact.userPersonaId
            : stateRoot.currentUserPersonaId;
        let matchedPersona = null;

        if (resolvedPersonaId !== null && resolvedPersonaId !== undefined && resolvedPersonaId !== '') {
            matchedPersona = personas.find((item) => String(item && item.id) === String(resolvedPersonaId)) || null;
        }

        return {
            name: String((matchedPersona && matchedPersona.name) || userProfile.name || '用户').trim() || '用户',
            prompt: clampPlannerText(
                (contact && contact.userPersonaPromptOverride) || (matchedPersona && matchedPersona.aiPrompt) || '',
                1800
            )
        };
    }

    function normalizePlannerLocationText(location) {
        if (!location) return '';
        if (typeof location === 'string') return String(location).trim();
        const formattedAddress = String(location.formattedAddress || '').trim();
        if (formattedAddress) return formattedAddress;
        return [
            location.country,
            location.province,
            location.city,
            location.district,
            location.detail,
            location.query
        ]
            .map((part) => String(part || '').trim())
            .filter(Boolean)
            .filter((part, index, list) => list.indexOf(part) === index)
            .join(' ');
    }

    function formatPlannerVenueDistance(distanceMeters) {
        const value = Number(distanceMeters);
        if (!Number.isFinite(value) || value <= 0) return '';
        if (value >= 1000) {
            const km = value / 1000;
            return km >= 10 ? `${km.toFixed(0)}km` : `${km.toFixed(1)}km`;
        }
        return `${Math.round(value)}m`;
    }

    async function fetchPlannerAmapJson(path, params = {}) {
        const settings = window.iphoneSimState && window.iphoneSimState.amapSettings;
        const webKey = String((settings && (settings.webKey || settings.key)) || '').trim();
        if (!webKey) {
            throw new Error('AMap Web 服务 Key 未配置');
        }

        const url = new URL(`https://restapi.amap.com${path}`);
        url.searchParams.set('key', webKey);
        url.searchParams.set('output', 'json');
        Object.keys(params).forEach((key) => {
            const value = params[key];
            if (value !== undefined && value !== null && value !== '') {
                url.searchParams.set(key, String(value));
            }
        });

        const response = await fetch(url.toString(), { method: 'GET' });
        const rawText = await response.text().catch(() => '');
        if (!response.ok) {
            throw new Error(`AMap HTTP ${response.status}`);
        }

        let data = null;
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch (error) {
            throw new Error('AMap 返回非 JSON');
        }

        if (String(data.status || '') !== '1') {
            throw new Error(String(data.info || 'AMap 调用失败'));
        }

        return data;
    }

    async function searchPlannerAmapNearbyVenues(contactLocation, options = {}) {
        if (!contactLocation) return [];
        const lng = Number(contactLocation.lng);
        const lat = Number(contactLocation.lat);
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return [];

        const keywordList = Array.isArray(options.keywords) ? options.keywords : [];
        const keywords = [
            ...keywordList,
            String(options.keyword || '').trim(),
            String(options.fallbackKeyword || '').trim()
        ].map((item) => String(item || '').trim()).filter(Boolean);
        const uniqueKeywords = keywords.filter((item, index, list) => list.indexOf(item) === index);
        const radius = Math.max(1000, Math.min(8000, Number(options.radius) || 4000));
        const limit = Math.max(2, Math.min(6, Number(options.limit) || 4));
        const typeValue = String(options.types || '').trim();
        const cacheKey = [
            lng.toFixed(4),
            lat.toFixed(4),
            uniqueKeywords.join(','),
            typeValue,
            radius,
            limit
        ].join('|');
        const cached = plannerAmapVenueSearchCache.get(cacheKey);
        if (cached && Date.now() - cached.updateTime < PLANNER_AMAP_VENUE_CACHE_TTL) {
            return Array.isArray(cached.items) ? cached.items : [];
        }

        const requestBase = {
            location: `${lng},${lat}`,
            radius,
            sortrule: 'distance',
            offset: limit,
            page: 1,
            extensions: 'all'
        };
        if (typeValue) {
            requestBase.types = typeValue;
        }

        let pois = [];
        for (let i = 0; i < uniqueKeywords.length; i += 1) {
            const keyword = uniqueKeywords[i];
            const data = await fetchPlannerAmapJson('/v3/place/around', {
                ...requestBase,
                keywords: keyword
            }).catch(() => null);
            pois = data && Array.isArray(data.pois) ? data.pois : [];
            if (pois.length) break;
        }

        const items = pois
            .map((poi) => {
                const bizExt = poi && poi.biz_ext && typeof poi.biz_ext === 'object' ? poi.biz_ext : {};
                const distanceMeters = Number(poi && poi.distance);
                const businessArea = String((poi && (poi.business_area || poi.businessArea)) || '').trim();
                const address = [
                    businessArea,
                    poi && poi.address
                ].map((part) => String(part || '').trim()).filter(Boolean).join(' ');

                return {
                    id: String((poi && poi.id) || '').trim(),
                    name: String((poi && poi.name) || '').trim(),
                    typeLabel: String(options.label || '').trim(),
                    distanceMeters: Number.isFinite(distanceMeters) ? distanceMeters : null,
                    distanceText: formatPlannerVenueDistance(distanceMeters),
                    rating: String(bizExt.rating || '').trim(),
                    cost: String(bizExt.cost || '').trim() ? `¥${String(bizExt.cost || '').trim()}` : '',
                    businessArea,
                    shortAddress: String(address || '').trim().length > 30 ? `${String(address || '').trim().slice(0, 30)}…` : String(address || '').trim()
                };
            })
            .filter((item) => item.name)
            .slice(0, limit);

        plannerAmapVenueSearchCache.set(cacheKey, {
            updateTime: Date.now(),
            items
        });

        return items;
    }

    function formatPlannerVenueCandidateLines(items, emptyText = '暂无稳定结果') {
        if (!Array.isArray(items) || !items.length) {
            return [`- ${emptyText}`];
        }

        return items.flatMap((item, index) => {
            const meta = [];
            if (item.distanceText) meta.push(`距离约 ${item.distanceText}`);
            if (item.rating) meta.push(`评分 ${item.rating}`);
            if (item.cost) meta.push(`人均 ${item.cost}`);
            if (item.typeLabel) meta.push(item.typeLabel);
            if (item.businessArea) meta.push(item.businessArea);
            const lines = [`${index + 1}. ${item.name}${meta.length ? `｜${meta.join('｜')}` : ''}`];
            if (item.shortAddress) lines.push(`   位置：${item.shortAddress}`);
            return lines;
        });
    }

    async function buildPlannerAmapVenueContext(contact) {
        const settings = window.iphoneSimState && window.iphoneSimState.amapSettings;
        const hasAmapKey = !!String((settings && (settings.webKey || settings.key)) || '').trim();
        if (!hasAmapKey || !contact || typeof window.getAmapContactLocation !== 'function') return '';

        const contactLocation = await window.getAmapContactLocation(contact.id).catch(() => null);
        if (!contactLocation || !Number.isFinite(Number(contactLocation.lng)) || !Number.isFinite(Number(contactLocation.lat))) {
            return '';
        }

        const locationLabel = normalizePlannerLocationText(contactLocation) || normalizePlannerLocationText(contact.location) || '未知位置';
        const [foodItems, cinemaItems] = await Promise.all([
            searchPlannerAmapNearbyVenues(contactLocation, {
                keyword: '美食',
                fallbackKeyword: '餐厅',
                types: '050000',
                radius: 4000,
                limit: 4,
                label: '餐饮'
            }).catch(() => []),
            searchPlannerAmapNearbyVenues(contactLocation, {
                keyword: '电影院',
                fallbackKeyword: '影城',
                radius: 8000,
                limit: 3,
                label: '影院'
            }).catch(() => [])
        ]);

        return [
            '【高德附近真实候选】',
            `- 联系人所在地：${locationLabel}`,
            '- 如果计划里出现出门、吃饭、看电影等内容，请优先使用下面的真实地点候选，不要写成“随便吃点”“出去看看”“看个电影”这种笼统表达。',
            '- 餐饮候选：',
            ...formatPlannerVenueCandidateLines(foodItems),
            '- 看电影候选：',
            ...formatPlannerVenueCandidateLines(cinemaItems, '暂无稳定结果'),
            '- 具体化要求：出门要写去哪里，吃饭要写具体吃什么或去哪家店，看电影要写影院名和具体片名，不能只给抽象动作。'
        ].join('\n');
    }

    function buildPlannerPromptContext(contact) {
        const contactLabel = String(contact && (contact.remark || contact.name) || '联系人').trim() || '联系人';
        const persona = String(contact && contact.persona ? contact.persona : '无').trim() || '无';
        const userPersona = getPlannerResolvedUserPersonaContext(contact);
        const locationText = normalizePlannerLocationText(contact && (contact.locationResolved || contact.location));
        const worldbookContext = getPlannerWorldbookContext(contact);
        const memoryContext = getPlannerMemoryContext(contact);
        const chatContext = getPlannerRecentChatContext(contact, userPersona);

        return [
            `【联系人信息】`,
            `- 姓名：${contactLabel}`,
            `- 人设：${persona}`,
            locationText ? `- 地点：${locationText}` : '',
            `【用户人设】`,
            `- 用户名：${userPersona.name || '用户'}`,
            `- 人设：${userPersona.prompt || '无'}`,
            worldbookContext ? `\n【关联世界书】\n${worldbookContext}` : '',
            memoryContext ? `\n【记忆内容】\n${memoryContext}` : '',
            chatContext ? `\n【最近聊天上下文】\n${chatContext}` : ''
        ].filter(Boolean).join('\n');
    }

    function normalizeStringList(value, fallback) {
        const list = Array.isArray(value)
            ? value.map((item) => String(item || '').trim()).filter(Boolean)
            : [];
        return list.length ? list : fallback.slice();
    }

    const PLANNER_TAG_CLASSES = ['pink', 'blue', 'purple', 'green'];

    function hashPlannerSeed(value) {
        const text = String(value || '');
        let hash = 2166136261;

        for (let i = 0; i < text.length; i += 1) {
            hash ^= text.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }

        return hash >>> 0;
    }

    function createPlannerRandom(seedText) {
        let seed = hashPlannerSeed(seedText) || 1;

        return () => {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 4294967296;
        };
    }

    function createPlannerColorPicker(seedText) {
        const random = createPlannerRandom(seedText);
        let previousIndex = -1;

        return () => {
            let candidates = PLANNER_TAG_CLASSES
                .map((_, index) => index)
                .filter((index) => index !== previousIndex);

            if (!candidates.length) {
                candidates = PLANNER_TAG_CLASSES.map((_, index) => index);
            }

            const nextIndex = candidates[Math.floor(random() * candidates.length)] || 0;
            previousIndex = nextIndex;
            return PLANNER_TAG_CLASSES[nextIndex];
        };
    }

    function decorateMonthlyPlanColors(plan) {
        const events = plan && plan.month && Array.isArray(plan.month.events) ? plan.month.events : [];
        if (!events.length) return;

        const seedText = events
            .map((event) => `${String(event && event.title ? event.title : '').trim()}|${Number(event && event.startDay ? event.startDay : 0)}|${Number(event && event.endDay ? event.endDay : 0)}`)
            .join('||');
        const pickColor = createPlannerColorPicker(`month:${seedText}`);

        events.forEach((event) => {
            if (!event || typeof event !== 'object') return;
            event.displayColor = pickColor();
        });
    }

    function normalizePlanObject(rawPlan, options = {}) {
        const fillFallback = options.fillFallback !== false;
        const fallback = fillFallback ? createGeneratedPlan() : null;
        const plan = rawPlan && typeof rawPlan === 'object' ? rawPlan : {};
        const month = plan.month && typeof plan.month === 'object' ? plan.month : null;
        const week = plan.week && typeof plan.week === 'object' ? plan.week : null;
        const daily = plan.daily && typeof plan.daily === 'object' ? plan.daily : null;

        const normalizedEvents = month && Array.isArray(month.events)
            ? month.events.map((event) => {
                if (!event || typeof event !== 'object') return null;
                const startDay = Math.max(1, Math.min(30, Number(event.startDay ?? event.day ?? event.date ?? 1) || 1));
                const endDay = Math.max(startDay, Math.min(30, Number(event.endDay ?? event.end ?? startDay) || startDay));
                const type = String(event.type || 'blue').toLowerCase();
                return {
                    title: String(event.title || event.name || '事项').trim().slice(0, 20) || '事项',
                    type: PLANNER_ALLOWED_TYPE_SET.has(type) ? type : 'blue',
                    startDay,
                    endDay,
                    note: String(event.note || event.desc || event.description || '重要事项标注。').trim()
                };
            }).filter(Boolean)
            : [];

        const normalizedGoalGroups = week && Array.isArray(week.goalGroups)
            ? week.goalGroups.map((group) => {
                if (!group || typeof group !== 'object') return null;
                return {
                    title: String(group.title || group.name || '').trim() || '目标',
                    items: normalizeStringList(group.items, fillFallback && fallback ? ['待补充'] : [])
                };
            }).filter(Boolean)
            : [];

        const normalizedDailyPlans = week && Array.isArray(week.dailyPlans)
            ? week.dailyPlans.map((day, index) => {
                if (!day || typeof day !== 'object') return null;
                const dayNum = Number(day.dayNum ?? day.day ?? 20 + index);
                const explicitItems = Array.isArray(day.items)
                    ? normalizeStringList(day.items, [])
                    : [];
                const fallbackItems = [
                    String(day.mustDo || day.important || '').trim(),
                    String(day.habit || day.habitItem || '').trim(),
                    String(day.optional || day.choose || '').trim()
                ].filter(Boolean);
                return {
                    dayNum: Number.isFinite(dayNum) ? dayNum : 20 + index,
                    weekday: String(day.weekday || ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][index] || '周日'),
                    dateKey: String(day.dateKey || '').trim(),
                    items: explicitItems.length ? explicitItems : fallbackItems
                };
            }).filter(Boolean)
            : [];

        const normalizedDailyEntries = daily && Array.isArray(daily.entries)
            ? daily.entries.map((entry) => {
                if (!entry || typeof entry !== 'object') return null;
                const time = normalizePlannerTimeLabel(entry.time ?? entry.startTime ?? entry.clock ?? '');
                if (!time) return null;
                const type = String(entry.type || 'blue').toLowerCase();
                return {
                    time,
                    title: String(entry.title || entry.name || '事项').trim().slice(0, 24) || '事项',
                    desc: String(entry.desc || entry.description || entry.note || '').trim(),
                    type: PLANNER_ALLOWED_TYPE_SET.has(type) ? type : 'blue'
                };
            }).filter(Boolean)
                .sort((a, b) => getPlannerTimeMinutes(a.time) - getPlannerTimeMinutes(b.time))
                .reduce((list, entry) => {
                    if (list.some((item) => item.time === entry.time)) return list;
                    list.push(entry);
                    return list;
                }, [])
            : [];

        const monthResult = month
            ? {
                summary: String(month.summary || (fillFallback && fallback ? fallback.month.summary : '')).trim(),
                chips: normalizeStringList(month.chips, fillFallback && fallback ? fallback.month.chips : []),
                events: normalizedEvents.length
                    ? normalizedEvents
                    : (fillFallback && fallback ? fallback.month.events : [])
            }
            : (fillFallback && fallback ? fallback.month : null);

        const weekResult = week
            ? {
                rangeLabel: String(week.rangeLabel || (fillFallback && fallback ? fallback.week.rangeLabel : '')).trim(),
                summary: String(week.summary || (fillFallback && fallback ? fallback.week.summary : '')).trim(),
                chips: normalizeStringList(week.chips, fillFallback && fallback ? fallback.week.chips : []),
                goalGroups: normalizedGoalGroups.length
                    ? normalizedGoalGroups
                    : (fillFallback && fallback ? fallback.week.goalGroups : []),
                dailyPlans: normalizedDailyPlans.length
                    ? normalizedDailyPlans
                    : (fillFallback && fallback ? fallback.week.dailyPlans : [])
            }
            : (fillFallback && fallback ? fallback.week : null);

        const dailyResult = daily
            ? {
                dateKey: String(daily.dateKey || (fillFallback && fallback ? fallback.daily.dateKey : '')).trim(),
                cutoffTime: normalizePlannerTimeLabel(daily.cutoffTime || (fillFallback && fallback ? fallback.daily.cutoffTime : '')) || (fillFallback && fallback ? fallback.daily.cutoffTime : ''),
                summary: String(daily.summary || (fillFallback && fallback ? fallback.daily.summary : '')).trim(),
                chips: normalizeStringList(daily.chips, fillFallback && fallback ? fallback.daily.chips : []),
                entries: normalizedDailyEntries.length
                    ? normalizedDailyEntries
                    : (fillFallback && fallback ? fallback.daily.entries : [])
            }
            : (fillFallback && fallback ? fallback.daily : null);

        return {
            month: monthResult,
            week: weekResult,
            daily: dailyResult
        };
    }

    function getPlannerStoredSection(record, kind) {
        if (!record || typeof record !== 'object') return null;
        if (record[kind] && typeof record[kind] === 'object') return record[kind];
        if (record.data && typeof record.data === 'object') return record.data;
        if (record.plan && typeof record.plan === 'object' && record.plan[kind] && typeof record.plan[kind] === 'object') {
            return record.plan[kind];
        }

        if (kind === 'month' && Array.isArray(record.events)) return record;
        if (kind === 'week' && (Array.isArray(record.goalGroups) || Array.isArray(record.dailyPlans))) return record;
        if (kind === 'daily' && Array.isArray(record.entries)) return record;

        return null;
    }

    function loadPersistedGeneratedPlan(contact = getPlannerTargetContact(), baseDate = new Date()) {
        const context = getPlannerDateContext(baseDate);
        const monthKey = formatPlannerMonthKey(context);
        const weekKey = formatPlannerWeekKey(context);
        const dateKey = formatPlannerDateKey(context.date);
        const monthRecord = readPlannerStorage(getPlannerStorageKey('month', monthKey, contact));
        const weekRecord = readPlannerStorage(getPlannerStorageKey('week', weekKey, contact));
        const dailyRecord = readPlannerStorage(getPlannerStorageKey('daily', dateKey, contact));
        const rawPlan = {};

        const monthSection = getPlannerStoredSection(monthRecord, 'month');
        const weekSection = getPlannerStoredSection(weekRecord, 'week');
        const dailySection = getPlannerStoredSection(dailyRecord, 'daily');

        if (monthSection) rawPlan.month = monthSection;
        if (weekSection) rawPlan.week = weekSection;
        if (dailySection) rawPlan.daily = dailySection;

        if (!rawPlan.month && !rawPlan.week && !rawPlan.daily) return null;

        return normalizePlanObject(rawPlan, { fillFallback: false });
    }

    function buildPlannerHumanLifeGuidance() {
        return [
            '活人感要求：',
            '1. 联系人要像真实的人，不要像纯任务执行器。',
            '2. 计划里可以自然出现吃饭、和朋友见面、聚餐、临时约饭、出门散步、逛街、看电影、看展、买东西、取快递、买菜、做饭、通勤、赶车、坐地铁、打车、出差、旅行、住酒店、返程、回家、整理房间、遛宠物、健身、午睡、休息、补觉、临时插曲、临时改期等生活内容。',
            '3. 学习、工作、考试、会议、DDL 当然可以有，但不要让每一天都像硬塞的待办清单，也不要把人写成只会执行任务的机器。',
            '4. 月计划、周计划、今日行程要彼此呼应，像同一个真实人从这个月活到今天，而不是三套互相无关的文案。',
            '5. 如果某几天本来就比较空，可以只放少量事项，甚至留出缓冲、空白和休息时间，让节奏像真人。',
            '6. 生活里的小变化可以有，比如本来要去办事但顺路先吃饭、临时被朋友叫走、天气不好改了安排、路上耽误了一会儿。',
            '7. 幸运或小麻烦可以有一点，但要克制、自然，不要戏剧化。'
        ].join('\n');
    }

    function getPlannerPlanContextForContact(contactLike, options = {}) {
        const contact = resolvePlannerContactLike(contactLike);
        if (!contact) return '';
        const now = options.now instanceof Date && !Number.isNaN(options.now.getTime()) ? new Date(options.now) : new Date();
        const plan = loadPersistedGeneratedPlan(contact, now);
        if (!plan) return '';

        const snapshot = buildPlannerPlanSnapshot(plan, now);
        if (!snapshot) return '';

        return [
            '【日程上下文】',
            '这是一位真实的人，请把下面的计划当作本人接下来真的会做的事来理解；回复时可以自然提到吃饭、见朋友、出门、旅行、赶路、休息、临时变动或小插曲，不要把它写成死板的任务表。',
            snapshot
        ].join('\n');
    }

    window.getPlannerPlanContextForContact = getPlannerPlanContextForContact;

    function persistGeneratedPlan(plan) {
        if (!plan) return;
        const contact = getPlannerTargetContact();
        const context = getPlannerDateContext();
        const generatedAt = Date.now();
        const monthKey = formatPlannerMonthKey(context);
        const weekKey = formatPlannerWeekKey(context);
        const dateKey = formatPlannerDateKey(context.date);

        if (plan.month) {
            writePlannerStorage(getPlannerStorageKey('month', monthKey, contact), {
                version: 2,
                kind: 'month',
                generatedAt,
                monthKey,
                weekKey,
                dateKey,
                month: plan.month
            });
        }

        if (plan.week) {
            writePlannerStorage(getPlannerStorageKey('week', weekKey, contact), {
                version: 2,
                kind: 'week',
                generatedAt,
                monthKey,
                weekKey,
                dateKey,
                week: plan.week
            });
        }

        if (plan.daily) {
            writePlannerStorage(getPlannerStorageKey('daily', dateKey, contact), {
                version: 2,
                kind: 'daily',
                generatedAt,
                monthKey,
                weekKey,
                dateKey,
                daily: plan.daily
            });
        }
    }

    function refreshPersistedGeneratedPlan() {
        state.generatedPlan = loadPersistedGeneratedPlan();
        if (state.generatedPlan) {
            decorateMonthlyPlanColors(state.generatedPlan);
        }
    }

    function extractJsonPayload(content) {
        const text = String(content || '').trim();
        const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fenced && fenced[1]) {
            return fenced[1].trim();
        }
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            return text.slice(firstBrace, lastBrace + 1);
        }
        return text;
    }

    function buildPlannerMessageContextFromHistory(messages, contactLabel, userPersona = null) {
        if (!Array.isArray(messages) || !messages.length) return '';
        const userLabel = String(userPersona && userPersona.name ? userPersona.name : '用户').trim() || '用户';
        return messages
            .map((message, index) => {
                const role = message && message.role === 'user' ? userLabel : contactLabel;
                const content = clampPlannerText(message && message.content ? message.content : '', 180);
                return content ? `${index + 1}. ${role}：${content}` : '';
            })
            .filter(Boolean)
            .join('\n');
    }

    function buildPlannerPlanSnapshot(plan, now = new Date(), options = {}) {
        if (!plan || typeof plan !== 'object') return '当前没有已生成的计划。';

        const includeDaily = options.includeDaily !== false;
        const lines = [];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        if (plan.month && typeof plan.month === 'object') {
            const monthSummary = String(plan.month.summary || '').trim();
            const monthEvents = Array.isArray(plan.month.events) ? plan.month.events : [];
            lines.push(`【月计划】${monthSummary || '无'}`);
            if (monthEvents.length) {
                lines.push(`- 事件：${monthEvents.slice(0, 8).map((event) => {
                    const range = `${Number(event.startDay || 0)}-${Number(event.endDay || event.startDay || 0)}`;
                    const title = String(event && event.title ? event.title : '').trim() || '事项';
                    const note = String(event && event.note ? event.note : '').trim();
                    return note ? `${range} ${title}（${clampPlannerText(note, 48)}）` : `${range} ${title}`;
                }).join('；')}`);
            }
        }

        if (plan.week && typeof plan.week === 'object') {
            const weekSummary = String(plan.week.summary || '').trim();
            const goalGroups = Array.isArray(plan.week.goalGroups) ? plan.week.goalGroups : [];
            const dailyPlans = Array.isArray(plan.week.dailyPlans) ? plan.week.dailyPlans : [];
            lines.push(`【周计划】${weekSummary || '无'}`);
            if (goalGroups.length) {
                lines.push(`- 目标：${goalGroups.map((group) => {
                    const title = String(group && group.title ? group.title : '目标').trim();
                    const items = Array.isArray(group && group.items) ? group.items : [];
                    return `${title}=${items.slice(0, 3).map((item) => clampPlannerText(item, 20)).join('、')}`;
                }).join('；')}`);
            }
            if (dailyPlans.length) {
                lines.push(`- 拆分：${dailyPlans.slice(0, 7).map((day) => {
                    const dayNum = Number(day && day.dayNum ? day.dayNum : 0);
                    const weekday = String(day && day.weekday ? day.weekday : '').trim();
                    const items = Array.isArray(day && day.items) ? day.items : [];
                    const itemText = items.slice(0, 3).map((item) => clampPlannerText(item, 20)).join('、');
                    return `${dayNum}${weekday ? `(${weekday})` : ''}=${itemText}`;
                }).join('；')}`);
            }
        }

        if (includeDaily && plan.daily && typeof plan.daily === 'object') {
            const dailySummary = String(plan.daily.summary || '').trim();
            const dailyChips = normalizeStringList(plan.daily.chips, []);
            const dailyEntries = Array.isArray(plan.daily.entries) ? plan.daily.entries.slice().sort((a, b) => getPlannerTimeMinutes(a.time) - getPlannerTimeMinutes(b.time)) : [];
            const visibleEntries = dailyEntries.filter((entry) => getPlannerTimeMinutes(entry && entry.time) <= currentMinutes);
            const futureEntries = dailyEntries.filter((entry) => getPlannerTimeMinutes(entry && entry.time) > currentMinutes);
            lines.push(`【今日行程】截至 ${formatPlannerClockTime(now)}`);
            if (dailySummary) {
                lines.push(`- 概要：${clampPlannerText(dailySummary, 140)}`);
            }
            if (dailyChips.length) {
                lines.push(`- 标签：${dailyChips.slice(0, 4).map((chip) => clampPlannerText(chip, 24)).join('、')}`);
            }
            lines.push(`- 已发生：${visibleEntries.length ? visibleEntries.map((entry) => {
                const title = clampPlannerText(entry.title || '事项', 24);
                const desc = clampPlannerText(entry.desc || entry.note || entry.description || '', 48);
                return desc ? `${entry.time} ${title}｜${desc}` : `${entry.time} ${title}`;
            }).join('；') : '无'}`);
            lines.push(`- 后续待调整：${futureEntries.length ? futureEntries.map((entry) => {
                const title = clampPlannerText(entry.title || '事项', 24);
                const desc = clampPlannerText(entry.desc || entry.note || entry.description || '', 48);
                return desc ? `${entry.time} ${title}｜${desc}` : `${entry.time} ${title}`;
            }).join('；') : '无'}`);
        }

        return lines.join('\n');
    }

    async function requestPlanGenerationFromApi() {
        const settings = getPlannerAiSettings();
        if (!settings) {
            console.warn('[location-schedule-v1] AI settings missing, using local fallback plan.');
            return createGeneratedPlan();
        }

        const apiUrl = String(settings.url || '').trim();
        const apiKey = String(settings.key || '').trim();
        const fetchUrl = apiUrl.endsWith('/chat/completions')
            ? apiUrl
            : (apiUrl.endsWith('/') ? `${apiUrl}chat/completions` : `${apiUrl}/chat/completions`);
        const contact = getPlannerTargetContact();
        const contactLabel = String(contact && (contact.remark || contact.name) || '当前联系人').trim() || '当前联系人';
        const contactContext = buildPlannerPromptContext(contact);
        const amapVenueContext = await buildPlannerAmapVenueContext(contact);
        const dateContext = getPlannerDateContext();
        const now = new Date();
        const currentMonthLabel = `${dateContext.monthNameEn} ${dateContext.year}`;
        const currentWeekRange = formatPlannerWeekRange(dateContext.weekStart, dateContext.weekEnd);
        const currentDateLabel = formatPlannerDateKey(now);
        const currentTimeLabel = formatPlannerClockTime(now);
        const humanLifeGuidance = buildPlannerHumanLifeGuidance();

        const messages = [
            {
                role: 'system',
                content: '你是一个中文日程规划助手。你会根据联系人设定、用户人设、世界书、记忆和最近聊天上下文，为位置页一次性生成月计划、周计划和整天行程。三者必须共享同一主题和节奏，不能像彼此无关的三块内容。请把联系人写成一个真实生活中的人，计划里要体现社交、出行、吃饭、休息、临时变动和日常琐事，不要像模板化排班。请只输出严格 JSON，不要输出 Markdown、解释、代码块或额外文本。'
            },
            {
                role: 'user',
                content: [
                    '请为手账风的日程页面一次性生成“月计划”、“周计划”和“整天行程”。',
                    `目标联系人：${contactLabel}`,
                    `当前页面月份：${currentMonthLabel}。`,
                    `当前周范围：${currentWeekRange}。`,
                    `当前日期：${currentDateLabel}。`,
                    `当前生成时刻：${currentTimeLabel}。`,
                    '',
                    contactContext ? `上下文：\n${contactContext}` : '上下文：无',
                    '',
                    amapVenueContext ? `高德真实候选：\n${amapVenueContext}` : '高德真实候选：无',
                    '',
                    `活人感要求：\n${humanLifeGuidance}`,
                    '',
                    '月计划规则：',
                    '1. 只保留这个月中的重要事件标注，比如考试、会议、DDL、面试、评审、里程碑、复盘，也可以是旅行、聚餐、朋友见面、出差、办事、家里安排等现实生活事件。',
                    '2. 一天可以没有事项，也可以有一个或多个事项。',
                    '3. 某些事项可以持续几天，请用 startDay / endDay 表示日期范围。',
                    '4. 事件类型只能使用 blue、purple、orange、green、pink、yellow 其中之一。',
                    '周计划规则：',
                    '1. 必须包含“每周目标”和“拆分每日具体计划”两部分。',
                    '2. 每周目标分为三类：重要必做、习惯养成、自选事项。',
                    '3. 周目标必须和月计划里的重要事件有联系，优先从本月事件中提炼本周重点；同时也要保留真实生活感，不要只写学习和工作。',
                    '4. 每日具体计划要结合当周实际情况拆分到周一到周日，内容要具体、可执行、简洁，可以自然出现吃饭、见朋友、出门、旅行准备、购物、散步、休息等内容。',
                    '5. 每天可以有 0 到 3 个事项，使用 items 数组表示，顺序按重要性或当天节奏排列，不要强行每天都放满三类。',
                    '6. 不要输出任何解释性说明、背景句、总结句、铺垫句、basis、focus、description 之类的文本。',
                    '7. 重要必做示例：上课、完成作业、工作任务、赶车、去办事。',
                    '8. 习惯养成示例：每日喝800ml水、吃水果、散步10分钟。',
                    '9. 自选事项示例：爬坡运动30分钟、和朋友约饭、整理旅行清单。',
                    '今日行程规则：',
                    '1. daily.entries 必须覆盖当天 00:00 到 23:59 的完整行程，前端会按时间逐步显示。',
                    '2. cutoffTime 仍填当前生成时刻，格式为 HH:MM，用作最后一次生成时间记录。',
                    '3. entries 必须按时间正序排列，建议 6 到 10 条。',
                    '4. 可以自然加入一条轻微幸运事件或轻微波折事件，但概率不要太高，不要戏剧化。',
                    '5. 今日行程需要和本月事件、当周目标保持一致，尽量复用同一批关键词，不要另起一套内容。',
                    '6. 今日行程也可以有真实生活里的动作，比如出门吃饭、见朋友、通勤、路上、回家、休息、临时改时间。',
                    '7. 每条 entries 项包含 time、title、desc、type，其中 type 只能使用 blue、purple、orange、green、pink、yellow 之一。',
                    '只输出下面这个 JSON 对象结构，不要输出任何额外字段：',
                    '{',
                    '  "month": {',
                    '    "summary": "一句话概括本月节奏",',
                    '    "chips": ["3 个左右的短标签"],',
                    '    "events": [',
                    '      {"title":"考试","type":"blue","startDay":3,"endDay":3,"note":"说明"}',
                    '    ]',
                    '  },',
                    '  "week": {',
                    `    "rangeLabel": "${currentWeekRange}",`,
                    '    "summary": "一句话概括本周节奏",',
                    '    "chips": ["3 个左右的短标签"],',
                    '    "goalGroups": [',
                    '      {"title":"重要必做","items":["...","..."]},',
                    '      {"title":"习惯养成","items":["...","..."]},',
                    '      {"title":"自选事项","items":["...","..."]}',
                    '    ],',
                    '    "dailyPlans": [',
                    '      {"dayNum":20,"weekday":"周一","items":["...","..."]}',
                    '    ]',
                    '  },',
                    '  "daily": {',
                    `    "dateKey": "${currentDateLabel}",`,
                    `    "cutoffTime": "${currentTimeLabel}",`,
                    '    "summary": "一句话概括今日全天的行程",',
                    '    "chips": ["3 个左右的短标签"],',
                    '    "entries": [',
                    '      {"time":"08:00","title":"晨间收整","desc":"...","type":"blue"}',
                    '    ]',
                    '  }',
                    '}'
                ].join('\n')
            }
        ];

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: String(settings.model || 'gpt-4o-mini').trim() || 'gpt-4o-mini',
                messages,
                temperature: 0.6
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data && data.choices && data.choices[0] && data.choices[0].message
            ? String(data.choices[0].message.content || '').trim()
            : '';
        if (!content) {
            throw new Error('API returned empty content');
        }

        const jsonText = extractJsonPayload(content);
        const parsed = JSON.parse(jsonText);
        return normalizePlanObject(parsed, { fillFallback: false });
    }

    async function requestPlannerDailyGenerationFromApi() {
        const settings = getPlannerAiSettings();
        if (!settings) {
            console.warn('[location-schedule-v1] AI settings missing, using local fallback daily plan.');
            return normalizePlanObject({
                daily: createGeneratedDailyPlan()
            }, { fillFallback: false });
        }

        const apiUrl = String(settings.url || '').trim();
        const apiKey = String(settings.key || '').trim();
        const fetchUrl = apiUrl.endsWith('/chat/completions')
            ? apiUrl
            : (apiUrl.endsWith('/') ? `${apiUrl}chat/completions` : `${apiUrl}/chat/completions`);
        const contact = getPlannerTargetContact();
        const contactLabel = String(contact && (contact.remark || contact.name) || '当前联系人').trim() || '当前联系人';
        const contactContext = buildPlannerPromptContext(contact);
        const amapVenueContext = await buildPlannerAmapVenueContext(contact);
        const dateContext = getPlannerDateContext();
        const now = new Date();
        const currentMonthLabel = `${dateContext.monthNameEn} ${dateContext.year}`;
        const currentWeekRange = formatPlannerWeekRange(dateContext.weekStart, dateContext.weekEnd);
        const currentDateLabel = formatPlannerDateKey(now);
        const currentTimeLabel = formatPlannerClockTime(now);
        const alignmentPlan = state.generatedPlan || loadPersistedGeneratedPlan(contact, now) || createGeneratedPlan();
        const currentPlanSnapshot = buildPlannerPlanSnapshot(alignmentPlan, now, { includeDaily: false });
        const humanLifeGuidance = buildPlannerHumanLifeGuidance();

        const messages = [
            {
                role: 'system',
                content: '你是一个中文“今日行程”生成助手。你会根据联系人设定、用户人设、世界书、记忆、最近聊天上下文，以及现有月计划和周计划，为位置页只生成当天的完整行程。现有月计划和周计划是硬约束，今日行程必须与它们一致，不得出现明显冲突或跳脱。请把联系人写成一个真实生活中的人，行程里要体现社交、出门、吃饭、通勤、休息、临时变动和日常琐事，不要像模板化排班。请只输出严格 JSON，不要输出 Markdown、解释、代码块或额外文本。'
            },
            {
                role: 'user',
                content: [
                    '请只生成“今日行程”部分，不要生成月计划和周计划。今日行程必须优先服从下面给出的现有月计划和周计划，日计划只可作为参考，不可与月/周计划冲突。',
                    `目标联系人：${contactLabel}`,
                    `当前页面月份：${currentMonthLabel}。`,
                    `当前周范围：${currentWeekRange}。`,
                    `当前日期：${currentDateLabel}。`,
                    `当前生成时刻：${currentTimeLabel}。`,
                    '',
                    contactContext ? `上下文：\n${contactContext}` : '上下文：无',
                    '',
                    amapVenueContext ? `高德真实候选：\n${amapVenueContext}` : '高德真实候选：无',
                    '',
                    `现有月/周计划快照：\n${currentPlanSnapshot || '无'}`,
                    '',
                    `活人感要求：\n${humanLifeGuidance}`,
                    '',
                    '今日行程规则：',
                    '1. daily.entries 必须覆盖当天 00:00 到 23:59 的完整行程，前端会按时间逐步显示。',
                    '2. cutoffTime 仍填当前生成时刻，格式为 HH:MM，用作最后一次生成时间记录。',
                    '3. entries 必须按时间正序排列，建议 6 到 10 条。',
                    '4. 可以自然加入一条轻微幸运事件或轻微波折事件，但概率不要太高，不要戏剧化。',
                    '5. 今日行程必须从现有月计划和周计划中提炼，不要生成与它们无关的全新主题。',
                    '6. 如果月计划里有考试、会议、DDL、出行、朋友见面、旅行、家里安排等事项，今日行程要体现对应的准备、执行、路上、收尾或缓冲。',
                    '7. 如果周计划里有本周重点或每日拆分，今日行程要对齐这些重点，尽量复用相同关键词和同一节奏。',
                    '8. 今日行程也可以有真实生活里的动作，比如出门吃饭、见朋友、通勤、路上、回家、休息、临时改时间。',
                    '9. 每条 entries 项包含 time、title、desc、type，其中 type 只能使用 blue、purple、orange、green、pink、yellow 之一。',
                    '10. 不要输出任何解释性说明、背景句、总结句、铺垫句、basis、focus、description 之类的文本。',
                    '只输出下面这个 JSON 对象结构，不要输出任何额外字段：',
                    '{',
                    '  "daily": {',
                    `    "dateKey": "${currentDateLabel}",`,
                    `    "cutoffTime": "${currentTimeLabel}",`,
                    '    "summary": "一句话概括今日全天的行程",',
                    '    "chips": ["3 个左右的短标签"],',
                    '    "entries": [',
                    '      {"time":"08:00","title":"晨间收整","desc":"...","type":"blue"}',
                    '    ]',
                    '  }',
                    '}'
                ].join('\n')
            }
        ];

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: String(settings.model || 'gpt-4o-mini').trim() || 'gpt-4o-mini',
                messages,
                temperature: 0.6
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data && data.choices && data.choices[0] && data.choices[0].message
            ? String(data.choices[0].message.content || '').trim()
            : '';
        if (!content) {
            throw new Error('API returned empty content');
        }

        const jsonText = extractJsonPayload(content);
        const parsed = JSON.parse(jsonText);
        return normalizePlanObject(parsed, { fillFallback: false });
    }

    async function requestPlannerAdjustmentFromApi(options = {}) {
        const settings = getPlannerAiSettings();
        if (!settings) {
            console.warn('[location-schedule-v1] AI settings missing, skipping planner adjustment.');
            return null;
        }

        const apiUrl = String(settings.url || '').trim();
        const apiKey = String(settings.key || '').trim();
        const fetchUrl = apiUrl.endsWith('/chat/completions')
            ? apiUrl
            : (apiUrl.endsWith('/') ? `${apiUrl}chat/completions` : `${apiUrl}/chat/completions`);
        const contact = getPlannerTargetContact();
        const contactLabel = String(contact && (contact.remark || contact.name) || '当前联系人').trim() || '当前联系人';
        const userPersona = getPlannerResolvedUserPersonaContext(contact);
        const contactContext = buildPlannerPromptContext(contact);
        const amapVenueContext = await buildPlannerAmapVenueContext(contact);
        const dateContext = getPlannerDateContext();
        const now = options.now instanceof Date && !Number.isNaN(options.now.getTime()) ? new Date(options.now) : new Date();
        const currentMonthLabel = `${dateContext.monthNameEn} ${dateContext.year}`;
        const currentWeekRange = formatPlannerWeekRange(dateContext.weekStart, dateContext.weekEnd);
        const currentDateLabel = formatPlannerDateKey(now);
        const currentTimeLabel = formatPlannerClockTime(now);
        const currentPlanSnapshot = buildPlannerPlanSnapshot(options.basePlan || state.generatedPlan, now);
        const adjustmentContext = buildPlannerMessageContextFromHistory(Array.isArray(options.adjustmentMessages) ? options.adjustmentMessages : [], contactLabel, userPersona);
        const humanLifeGuidance = buildPlannerHumanLifeGuidance();

        const messages = [
            {
                role: 'system',
                content: '你是一个中文日程调整助手。你会根据联系人设定、用户人设、世界书、记忆、最近聊天和当前计划快照，为位置页调整月计划、周计划和整天行程。请把联系人写成一个真实生活中的人，计划里要体现社交、出门、吃饭、路上、休息、临时改期和真实的生活节奏，不要像模板化排班。请只输出严格 JSON，不要输出 Markdown、解释、代码块或额外文本。'
            },
            {
                role: 'user',
                content: [
                    '请基于当前计划和新增聊天内容，调整“月计划”、“周计划”和“整天行程”。',
                    `目标联系人：${contactLabel}`,
                    `当前页面月份：${currentMonthLabel}。`,
                    `当前周范围：${currentWeekRange}。`,
                    `当前日期：${currentDateLabel}。`,
                    `当前调整时刻：${currentTimeLabel}。`,
                    '',
                    contactContext ? `上下文：\n${contactContext}` : '上下文：无',
                    '',
                    amapVenueContext ? `高德真实候选：\n${amapVenueContext}` : '高德真实候选：无',
                    '',
                    `活人感要求：\n${humanLifeGuidance}`,
                    '',
                    currentPlanSnapshot ? `当前计划快照：\n${currentPlanSnapshot}` : '当前计划快照：无',
                    '',
                    adjustmentContext ? `新增聊天内容：\n${adjustmentContext}` : '新增聊天内容：无',
                    '',
                    '调整规则：',
                    '1. 月计划、周计划、今日行程必须继续共享同一主题和节奏。',
                    '2. 如果聊天内容提到突发状况、延迟、临时安排、情绪波动、额外任务、吃饭、见朋友、出门、旅行或临时变更等，请合理调整后续行程。',
                    '3. 今日行程必须保留当前时刻之前已经发生的 entries，不要修改这些条目的 time、title、desc、type。',
                    '4. 只调整当前时刻之后的 entries；可以延后、压缩、替换、取消或新增后续行程。',
                    '5. 如果确实不需要调整某部分，请保持该部分原有结构并仅轻微优化描述。',
                    '6. 可以以很小概率加入一条轻微幸运事件或轻微波折事件，保持生活感，不要戏剧化。',
                    '7. 月计划只保留本月重要事件标注，比如考试、会议、DDL、面试、评审、里程碑、复盘，也可以是旅行、聚餐、朋友见面、出差、办事、家里安排等现实生活事件。',
                    '8. 周计划必须包含“每周目标”和“拆分每日具体计划”两部分。',
                    '9. 周目标分为重要必做、习惯养成、自选事项三类，并结合最新情况做合理调整，同时保持真实生活感。',
                    '10. 今日行程仍然是完整全天的行程记录，前端会按时间逐步显示。',
                    '11. cutoffTime 仍填当前调整时刻，格式为 HH:MM。',
                    '12. 不要输出任何解释性说明、背景句、总结句、铺垫句、basis、focus、description 之类的文本。',
                    '只输出下面这个 JSON 对象结构，不要输出任何额外字段：',
                    '{',
                    '  "month": {',
                    '    "summary": "一句话概括本月节奏",',
                    '    "chips": ["3 个左右的短标签"],',
                    '    "events": [',
                    '      {"title":"考试","type":"blue","startDay":3,"endDay":3,"note":"说明"}',
                    '    ]',
                    '  },',
                    '  "week": {',
                    `    "rangeLabel": "${currentWeekRange}",`,
                    '    "summary": "一句话概括本周节奏",',
                    '    "chips": ["3 个左右的短标签"],',
                    '    "goalGroups": [',
                    '      {"title":"重要必做","items":["...","..."]},',
                    '      {"title":"习惯养成","items":["...","..."]},',
                    '      {"title":"自选事项","items":["...","..."]}',
                    '    ],',
                    '    "dailyPlans": [',
                    '      {"dayNum":20,"weekday":"周一","items":["...","..."]}',
                    '    ]',
                    '  },',
                    '  "daily": {',
                    `    "dateKey": "${currentDateLabel}",`,
                    `    "cutoffTime": "${currentTimeLabel}",`,
                    '    "summary": "一句话概括今日行程的调整结果",',
                    '    "chips": ["3 个左右的短标签"],',
                    '    "entries": [',
                    '      {"time":"08:00","title":"晨间收整","desc":"...","type":"blue"}',
                    '    ]',
                    '  }',
                    '}'
                ].join('\n')
            }
        ];

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: String(settings.model || 'gpt-4o-mini').trim() || 'gpt-4o-mini',
                messages,
                temperature: 0.55
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data && data.choices && data.choices[0] && data.choices[0].message
            ? String(data.choices[0].message.content || '').trim()
            : '';
        if (!content) {
            throw new Error('API returned empty content');
        }

        const jsonText = extractJsonPayload(content);
        const parsed = JSON.parse(jsonText);
        return normalizePlanObject(parsed);
    }

    function buildMonthlyPlanLookup(events) {
        const lookup = new Map();
        events.forEach((event) => {
            for (let day = event.startDay; day <= event.endDay; day += 1) {
                if (!lookup.has(day)) lookup.set(day, []);
                lookup.get(day).push({
                    ...event,
                    day,
                    isStart: day === event.startDay,
                    isEnd: day === event.endDay,
                    isMiddle: day > event.startDay && day < event.endDay
                });
            }
        });
        return lookup;
    }

    function buildPlanStyles() {
        return `
            .tool-btn.loading {
                opacity: 0.45;
                pointer-events: none;
            }
            .plan-section {
                margin-bottom: 24px;
            }
            .plan-section-head {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                align-items: flex-end;
                margin-bottom: 12px;
            }
            .plan-section-title {
                font-size: 24px;
                font-weight: 400;
            }
            .plan-section-sub {
                font-size: 10px;
                letter-spacing: 2px;
                color: var(--text-light);
                text-transform: uppercase;
            }
            .plan-summary-box {
                border: 1px solid var(--border-color);
                border-radius: 18px;
                background: #ffffff;
                padding: 14px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
                margin-bottom: 14px;
            }
            .plan-summary-text {
                font-size: 13px;
                color: var(--text-sub);
                line-height: 1.7;
            }
            .plan-summary-chip-row {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .plan-summary-chip {
                display: inline-flex;
                align-items: center;
                border: 1px solid var(--border-color);
                background: #fafafa;
                color: #111111;
                border-radius: 999px;
                padding: 6px 10px;
                font-size: 11px;
                letter-spacing: 0.2px;
            }
            .plan-month-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .plan-month-card {
                border: 1px solid var(--border-color);
                border-radius: 18px;
                background: #ffffff;
                padding: 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
            }
            .plan-month-card-top {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
                margin-bottom: 8px;
            }
            .plan-month-date strong {
                display: block;
                font-family: var(--font-serif);
                font-size: 22px;
                font-weight: 400;
                line-height: 1;
            }
            .plan-month-date span {
                display: block;
                font-size: 10px;
                color: var(--text-light);
                letter-spacing: 2px;
                text-transform: uppercase;
                margin-top: 6px;
            }
            .plan-month-pill {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                padding: 5px 10px;
                font-size: 10px;
                font-weight: 600;
                color: #111111;
                white-space: nowrap;
            }
            .plan-month-event-title {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 6px;
            }
            .plan-month-event-note {
                font-size: 12px;
                color: var(--text-sub);
                line-height: 1.6;
            }
            .plan-goal-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 10px;
            }
            .plan-goal-card {
                border: 1px solid var(--border-color);
                border-radius: 18px;
                background: #ffffff;
                padding: 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
            }
            .plan-goal-label {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
                margin-bottom: 10px;
            }
            .plan-goal-label strong {
                font-size: 14px;
                font-weight: 600;
            }
            .plan-goal-label span {
                font-size: 11px;
                color: var(--text-light);
                line-height: 1.5;
                text-align: right;
            }
            .plan-goal-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .plan-goal-item {
                border-radius: 12px;
                background: #fafafa;
                padding: 9px 10px;
                font-size: 12px;
                line-height: 1.6;
            }
            .plan-day-grid {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .plan-day-card {
                border: 1px solid var(--border-color);
                border-radius: 18px;
                background: #ffffff;
                padding: 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
            }
            .plan-day-head {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
                margin-bottom: 10px;
            }
            .plan-day-head strong {
                font-family: var(--font-serif);
                font-size: 18px;
                font-weight: 400;
                line-height: 1.05;
            }
            .plan-day-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 999px;
                padding: 5px 10px;
                font-size: 10px;
                font-weight: 600;
                color: #111111;
                background: var(--tag-blue);
            }
            .plan-day-row {
                display: grid;
                grid-template-columns: 74px 1fr;
                gap: 10px;
                align-items: flex-start;
                padding: 8px 0;
                border-top: 1px solid var(--border-color);
            }
            .plan-day-row:first-of-type {
                border-top: none;
                padding-top: 0;
            }
            .plan-day-kind {
                font-size: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
                color: var(--text-light);
                padding-top: 1px;
            }
            .plan-day-value {
                font-size: 12px;
                color: var(--text-main);
                line-height: 1.6;
            }
            .week-plan-card {
                flex: 1;
                border: 1px solid var(--border-color);
                border-radius: 18px;
                background: #ffffff;
                padding: 12px 14px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
            }
            .week-plan-item {
                display: grid;
                grid-template-columns: 72px 1fr;
                gap: 10px;
                align-items: flex-start;
                padding: 7px 0;
                border-top: 1px solid var(--border-color);
            }
            .week-plan-item:first-of-type {
                border-top: none;
                padding-top: 0;
            }
            .week-plan-item-label {
                font-size: 10px;
                letter-spacing: 1px;
                text-transform: uppercase;
                color: var(--text-light);
                padding-top: 1px;
            }
            .week-plan-item-value {
                font-size: 12px;
                color: var(--text-main);
                line-height: 1.6;
            }
            .plan-month-marker {
                display: block;
                font-size: 8px;
                line-height: 1.2;
                padding: 3px 4px;
                transform: none;
                margin-bottom: 2px;
                color: #111111;
            }
            .plan-month-marker.plan-start {
                font-weight: 600;
            }
            .plan-month-marker.plan-continue {
                opacity: 0.9;
            }
            .week-day-row.plan-week-row {
                align-items: flex-start;
                padding: 16px 0;
            }
            .week-day-row.plan-week-row .week-day-info {
                padding-top: 6px;
            }
            .week-day-row.plan-generated-row {
                align-items: center;
                padding: 16px 0;
            }
            .week-day-row.plan-generated-row .week-day-info {
                padding-top: 0;
            }
            .week-day-row.plan-generated-row .week-events {
                align-items: center;
            }
            .plan-generated-row .event-pill {
                white-space: normal;
                line-height: 1.45;
            }
            .day-preview-overlay {
                position: fixed;
                inset: 0;
                z-index: 180;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 18px;
                background: transparent;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.22s ease;
                will-change: opacity;
                transform: translateZ(0);
                isolation: isolate;
                contain: paint;
            }
            .day-preview-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .day-preview-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(255, 255, 255, 0.36);
                backdrop-filter: blur(12px) saturate(120%);
                -webkit-backdrop-filter: blur(12px) saturate(120%);
                opacity: 0;
                transition: opacity 0.22s ease;
                will-change: opacity, backdrop-filter;
                transform: translateZ(0);
            }
            .day-preview-overlay.active .day-preview-backdrop {
                opacity: 1;
            }
            .day-preview-card {
                position: relative;
                z-index: 1;
                width: min(100%, 420px);
                max-height: min(78vh, 640px);
                overflow: auto;
                border: 1px solid var(--border-color);
                border-radius: 24px;
                background: rgba(255, 255, 255, 0.98);
                box-shadow: 0 18px 70px rgba(0, 0, 0, 0.16);
                padding: 18px;
                transform: translate3d(0, 10px, 0) scale(0.98);
                opacity: 0;
                transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
                will-change: transform, opacity;
                backface-visibility: hidden;
                -webkit-font-smoothing: antialiased;
            }
            .day-preview-overlay.active .day-preview-card {
                transform: translate3d(0, 0, 0) scale(1);
                opacity: 1;
            }
            .day-preview-head {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
                margin-bottom: 14px;
            }
            .day-preview-title {
                font-size: 30px;
                font-weight: 400;
                line-height: 1;
                margin-top: 6px;
            }
            .day-preview-meta {
                font-size: 10px;
                letter-spacing: 2px;
                color: var(--text-light);
                text-transform: uppercase;
            }
            .day-preview-close {
                width: 34px;
                height: 34px;
                border: 1px solid var(--border-color);
                border-radius: 50%;
                background: #ffffff;
                color: var(--text-main);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: 0.2s;
                flex-shrink: 0;
            }
            .day-preview-close:active {
                transform: scale(0.94);
                background: #fafafa;
            }
            .day-preview-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .day-preview-item {
                border: 1px solid var(--border-color);
                background: #ffffff;
                border-radius: 18px;
                padding: 12px 14px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
            }
            .day-preview-item-top {
                display: flex;
                align-items: flex-start;
                gap: 8px;
            }
            .day-preview-pill {
                flex-shrink: 0;
                font-size: 11px;
                padding: 4px 10px;
                border-radius: 999px;
                line-height: 1.2;
                color: #111111;
            }
            .day-preview-item-title {
                font-size: 14px;
                font-weight: 500;
                color: var(--text-main);
                line-height: 1.5;
            }
            .day-preview-item-note {
                margin-top: 6px;
                font-size: 12px;
                line-height: 1.6;
                color: var(--text-sub);
            }
            .day-preview-empty {
                padding: 18px 0 4px;
                color: var(--text-light);
                font-size: 13px;
                text-align: center;
                letter-spacing: 1px;
            }
            .plan-mode-overlay {
                position: fixed;
                inset: 0;
                z-index: 190;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                padding: 18px 18px calc(18px + env(safe-area-inset-bottom));
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.22s ease;
            }
            .plan-mode-overlay.active {
                opacity: 1;
                pointer-events: auto;
            }
            .plan-mode-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(18, 18, 18, 0.24);
                opacity: 0;
                transition: opacity 0.22s ease;
            }
            .plan-mode-overlay.active .plan-mode-backdrop {
                opacity: 1;
            }
            .plan-mode-sheet {
                position: relative;
                z-index: 1;
                width: min(100%, 420px);
                border: 1px solid var(--border-color);
                border-radius: 26px;
                background: rgba(255, 255, 255, 0.98);
                box-shadow: 0 18px 70px rgba(0, 0, 0, 0.18);
                padding: 16px;
                transform: translate3d(0, 18px, 0) scale(0.98);
                opacity: 0;
                transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s cubic-bezier(0.16, 1, 0.3, 1);
                will-change: transform, opacity;
            }
            .plan-mode-overlay.active .plan-mode-sheet {
                transform: translate3d(0, 0, 0) scale(1);
                opacity: 1;
            }
            .plan-mode-head {
                display: flex;
                justify-content: space-between;
                gap: 12px;
                align-items: flex-start;
                margin-bottom: 14px;
            }
            .plan-mode-meta {
                font-size: 10px;
                letter-spacing: 2px;
                color: var(--text-light);
                text-transform: uppercase;
            }
            .plan-mode-title {
                font-size: 28px;
                font-weight: 400;
                line-height: 1.05;
                margin-top: 6px;
            }
            .plan-mode-close {
                width: 34px;
                height: 34px;
                border: 1px solid var(--border-color);
                border-radius: 50%;
                background: #ffffff;
                color: var(--text-main);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: 0.2s;
                flex-shrink: 0;
            }
            .plan-mode-close:active {
                transform: scale(0.94);
                background: #fafafa;
            }
            .plan-mode-list {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .plan-mode-option {
                width: 100%;
                border: 1px solid var(--border-color);
                border-radius: 18px;
                background: #ffffff;
                padding: 14px 15px;
                text-align: left;
                cursor: pointer;
                transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
            }
            .plan-mode-option:active {
                transform: scale(0.985);
                box-shadow: 0 1px 6px rgba(0, 0, 0, 0.05);
            }
            .plan-mode-option strong {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: var(--text-main);
                line-height: 1.35;
            }
            .plan-mode-option span {
                display: block;
                margin-top: 4px;
                font-size: 12px;
                line-height: 1.6;
                color: var(--text-sub);
            }
            .plan-mode-cancel {
                margin-top: 12px;
                width: 100%;
                border: 1px solid var(--border-color);
                border-radius: 16px;
                background: #fafafa;
                color: var(--text-main);
                font-size: 13px;
                padding: 12px 14px;
                cursor: pointer;
                transition: 0.2s;
            }
            .plan-mode-cancel:active {
                transform: scale(0.985);
                background: #f4f4f4;
            }
        `;
    }

    function buildDayPreviewMarkup() {
        return `
            <div class="day-preview-overlay" id="day-preview-overlay" aria-hidden="true">
                <div class="day-preview-backdrop" data-preview-dismiss></div>
                <div class="day-preview-card" role="dialog" aria-modal="true" aria-labelledby="day-preview-title">
                    <div class="day-preview-head">
                        <div>
                            <div class="day-preview-meta" id="day-preview-meta">DAY PREVIEW</div>
                            <h3 class="day-preview-title serif" id="day-preview-title"></h3>
                        </div>
                        <button type="button" class="day-preview-close" id="day-preview-close" aria-label="关闭">×</button>
                    </div>
                    <div class="day-preview-list" id="day-preview-list"></div>
                </div>
            </div>
        `;
    }

    function buildPlanModeMarkup() {
        return `
            <div class="plan-mode-overlay" id="plan-mode-overlay" aria-hidden="true">
                <div class="plan-mode-backdrop" data-plan-mode-dismiss></div>
                <div class="plan-mode-sheet" role="dialog" aria-modal="true" aria-labelledby="plan-mode-title">
                    <div class="plan-mode-head">
                        <div>
                            <div class="plan-mode-meta">PLAN OPTIONS</div>
                            <h3 class="plan-mode-title serif" id="plan-mode-title">生成行程</h3>
                        </div>
                        <button type="button" class="plan-mode-close" id="plan-mode-close" aria-label="关闭">×</button>
                    </div>
                    <div class="plan-mode-list">
                        <button type="button" class="plan-mode-option" id="plan-mode-daily">
                            <strong>仅生成今日行程</strong>
                            <span>只更新今天的行程记录，保留现有日/周/月内容不动。</span>
                        </button>
                        <button type="button" class="plan-mode-option" id="plan-mode-full">
                            <strong>同时生成日、周、月</strong>
                            <span>一次性重做三套计划，并覆盖之前的内容。</span>
                        </button>
                    </div>
                    <button type="button" class="plan-mode-cancel" id="plan-mode-cancel">取消</button>
                </div>
            </div>
        `;
    }

    function closeMonthlyDayPreview() {
        if (!state.ui.dayPreviewOverlay) return;
        state.ui.dayPreviewOverlay.classList.remove('active');
        state.ui.dayPreviewOverlay.setAttribute('aria-hidden', 'true');
    }

    function openPlanModeChoice() {
        if (!state.ui.planModeOverlay || state.planGenerating) return;
        state.ui.planModeOverlay.classList.add('active');
        state.ui.planModeOverlay.setAttribute('aria-hidden', 'false');
    }

    function closePlanModeChoice() {
        if (!state.ui.planModeOverlay) return;
        state.ui.planModeOverlay.classList.remove('active');
        state.ui.planModeOverlay.setAttribute('aria-hidden', 'true');
    }

    function getMonthlyDayEvents(day) {
        const normalizedDay = Number(day);
        if (!Number.isFinite(normalizedDay)) return [];

        const sourceEvents = state.generatedPlan && state.generatedPlan.month && Array.isArray(state.generatedPlan.month.events) && state.generatedPlan.month.events.length
            ? (() => {
                const lookup = buildMonthlyPlanLookup(state.generatedPlan.month.events || []);
                return lookup.get(normalizedDay) || [];
            })()
            : (eventsData[normalizedDay] || []);

        return sourceEvents.filter((event) => event && event.type !== 'dots');
    }

    function openMonthlyDayPreview(day) {
        if (!state.ui.dayPreviewOverlay || !state.ui.dayPreviewTitle || !state.ui.dayPreviewList) return;

        const context = getPlannerDateContext();
        const selectedDay = Math.max(1, Math.min(context.monthDays, Number(day) || context.date.getDate()));
        const selectedDate = new Date(context.year, context.monthIndex, selectedDay);
        const events = getMonthlyDayEvents(selectedDay);

        state.ui.dayPreviewMeta.textContent = `WEEK ${getISOWeekNumber(selectedDate)} · ${WEEKDAY_NAMES_LONG[selectedDate.getDay()]}`;
        state.ui.dayPreviewTitle.innerHTML = `${formatMonthDayLabel(selectedDay)} <span style="font-size: 18px; color: var(--text-sub)">of ${context.monthNameEn}</span>`;

        if (!events.length) {
            state.ui.dayPreviewList.innerHTML = '<div class="day-preview-empty">当天暂无事项</div>';
        } else {
            state.ui.dayPreviewList.innerHTML = events.map((event) => {
                const colorClass = event.displayColor || event.type || 'blue';
                const itemNote = String(event.note || event.desc || event.description || '').trim();
                const extraMeta = String(event.time || '').trim() || (event.endDay > event.startDay ? `持续 ${event.endDay - event.startDay + 1} 天` : '');

                return `
                    <div class="day-preview-item">
                        <div class="day-preview-item-top">
                            <div class="event-pill c-${colorClass} day-preview-pill">${escapeHtml(event.title)}</div>
                            ${extraMeta ? `<div class="day-preview-item-title">${escapeHtml(extraMeta)}</div>` : ''}
                        </div>
                        ${itemNote ? `<div class="day-preview-item-note">${escapeHtml(itemNote)}</div>` : ''}
                    </div>
                `;
            }).join('');
        }

        state.ui.dayPreviewOverlay.classList.add('active');
        state.ui.dayPreviewOverlay.setAttribute('aria-hidden', 'false');
    }

    function mergePlannerPlans(basePlan, patchPlan, options = {}) {
        const base = normalizePlanObject(basePlan || {}, { fillFallback: false }) || {};
        const patch = normalizePlanObject(patchPlan || {}, { fillFallback: false }) || {};
        const now = options.now instanceof Date && !Number.isNaN(options.now.getTime()) ? new Date(options.now) : new Date();
        const currentMinutes = (now.getHours() * 60) + now.getMinutes();

        const baseDaily = base.daily && typeof base.daily === 'object' ? base.daily : null;
        const patchDaily = patch.daily && typeof patch.daily === 'object' ? patch.daily : null;
        const baseEntries = Array.isArray(baseDaily && baseDaily.entries) ? baseDaily.entries.slice() : [];
        const patchEntries = Array.isArray(patchDaily && patchDaily.entries) ? patchDaily.entries.slice() : [];
        const patchFutureEntries = patchEntries.filter((entry) => getPlannerTimeMinutes(entry && entry.time) > currentMinutes);
        const basePastEntries = baseEntries.filter((entry) => getPlannerTimeMinutes(entry && entry.time) <= currentMinutes);
        const baseDailyEntries = baseEntries.slice().sort((a, b) => getPlannerTimeMinutes(a.time) - getPlannerTimeMinutes(b.time));
        const mergedDailyEntries = patchFutureEntries.length
            ? [
                ...basePastEntries,
                ...patchFutureEntries
            ]
            : baseDailyEntries;

        const dedupedDailyEntries = [];
        const seenTimes = new Set();
        mergedDailyEntries
            .filter((entry) => entry && normalizePlannerTimeLabel(entry.time))
            .sort((a, b) => getPlannerTimeMinutes(a.time) - getPlannerTimeMinutes(b.time))
            .forEach((entry) => {
                if (seenTimes.has(entry.time)) return;
                seenTimes.add(entry.time);
                dedupedDailyEntries.push(entry);
            });

        const patchMonth = patch.month && typeof patch.month === 'object' ? patch.month : null;
        const patchWeek = patch.week && typeof patch.week === 'object' ? patch.week : null;
        const patchMonthHasContent = Boolean(patchMonth && (
            (Array.isArray(patchMonth.events) && patchMonth.events.length)
            || (Array.isArray(patchMonth.chips) && patchMonth.chips.length)
            || String(patchMonth.summary || '').trim()
        ));
        const patchWeekHasContent = Boolean(patchWeek && (
            (Array.isArray(patchWeek.goalGroups) && patchWeek.goalGroups.length)
            || (Array.isArray(patchWeek.dailyPlans) && patchWeek.dailyPlans.length)
            || (Array.isArray(patchWeek.chips) && patchWeek.chips.length)
            || String(patchWeek.summary || '').trim()
        ));

        return {
            month: patchMonthHasContent ? patchMonth : (base.month || null),
            week: patchWeekHasContent ? patchWeek : (base.week || null),
            daily: (patchDaily || baseDaily)
                ? {
                    dateKey: String((patchDaily && patchDaily.dateKey) || (baseDaily && baseDaily.dateKey) || getPlannerCurrentDateKey(now)).trim(),
                    cutoffTime: String((patchDaily && patchDaily.cutoffTime) || (baseDaily && baseDaily.cutoffTime) || formatPlannerClockTime(now)).trim(),
                    summary: String((patchDaily && patchDaily.summary) || (baseDaily && baseDaily.summary) || '').trim(),
                    chips: Array.isArray((patchDaily && patchDaily.chips)) && (patchDaily && patchDaily.chips.length)
                        ? patchDaily.chips.slice()
                        : (Array.isArray(baseDaily && baseDaily.chips) ? baseDaily.chips.slice() : []),
                    entries: dedupedDailyEntries
                }
                : null
        };
    }

    function clearPlannerDailyRevealTimer() {
        if (state.dailyRevealTimer) {
            clearTimeout(state.dailyRevealTimer);
            state.dailyRevealTimer = null;
        }
    }

    function schedulePlannerDailyRevealTimer(selectedDateKey, dailyEntries, now = new Date()) {
        clearPlannerDailyRevealTimer();

        const currentDateKey = formatPlannerDateKey(now);
        if (String(selectedDateKey || '') !== currentDateKey) {
            return;
        }

        const entries = Array.isArray(dailyEntries)
            ? dailyEntries.slice().sort((a, b) => getPlannerTimeMinutes(a.time) - getPlannerTimeMinutes(b.time))
            : [];
        const nextEntry = entries.find((entry) => getPlannerTimeMinutes(entry && entry.time) > ((now.getHours() * 60) + now.getMinutes()));
        if (!nextEntry) return;

        const nextTimeMinutes = getPlannerTimeMinutes(nextEntry.time);
        if (nextTimeMinutes < 0) return;
        const nextDate = new Date(now);
        nextDate.setHours(Math.floor(nextTimeMinutes / 60), nextTimeMinutes % 60, 0, 200);
        const delay = Math.max(500, nextDate.getTime() - now.getTime());

        state.dailyRevealTimer = setTimeout(() => {
            if (state.currentDailyDateKey !== selectedDateKey) return;
            renderDaily(selectedDateKey, { activate: false });
        }, delay);
    }

    function syncPlannerAutoAdjustUi(settings = state.autoAdjustSettings || loadPlannerAutoAdjustSettings()) {
        if (!state.ui.autoAdjustSwitch || !state.ui.autoAdjustSubrow) return;
        const normalized = normalizePlannerAutoAdjustSettings(settings, getPlannerTargetContact());
        state.autoAdjustSettings = normalized;
        state.autoAdjustContactId = String(normalized.contactId || '');
        state.ui.autoAdjustSwitch.classList.toggle('active', Boolean(normalized.enabled));
        state.ui.autoAdjustSubrow.classList.toggle('active', Boolean(normalized.enabled));
        const input = state.ui.autoAdjustInput || state.shadowRoot.querySelector('#auto-adjust-subrow input[type="number"]');
        if (input) {
            input.value = String(normalized.limit || PLANNER_AUTO_ADJUST_DEFAULT_LIMIT);
        }
    }

    function refreshPlannerAutoAdjustState() {
        const contact = getPlannerTargetContact();
        const settings = loadPlannerAutoAdjustSettings(contact);
        state.autoAdjustSettings = settings;
        state.autoAdjustContactId = String(settings.contactId || '');
        syncPlannerAutoAdjustUi(settings);
        return settings;
    }

    function notifyPlanner(message, duration = 2200) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(String(message || ''), duration);
        }
    }

    function toggleAutoAdjust() {
        const contact = getPlannerTargetContact();
        const currentSettings = loadPlannerAutoAdjustSettings(contact);
        const historyLength = getPlannerChatHistory(contact).length;
        const nextEnabled = !currentSettings.enabled;
        const nextSettings = {
            ...currentSettings,
            enabled: nextEnabled,
            baselineDateKey: getPlannerCurrentDateKey(getPlannerDateContext().date),
            baselineCount: nextEnabled ? historyLength : currentSettings.baselineCount
        };
        state.autoAdjustSettings = savePlannerAutoAdjustSettings(nextSettings, contact);
        state.autoAdjustContactId = String(state.autoAdjustSettings.contactId || '');
        syncPlannerAutoAdjustUi(state.autoAdjustSettings);
    }

    function handleAutoAdjustLimitChange() {
        const contact = getPlannerTargetContact();
        const currentSettings = loadPlannerAutoAdjustSettings(contact);
        const input = state.ui.autoAdjustInput || state.shadowRoot.querySelector('#auto-adjust-subrow input[type="number"]');
        const rawValue = input ? Number(input.value) : currentSettings.limit;
        const nextLimit = Math.max(1, Number.isFinite(rawValue) ? Math.floor(rawValue) : PLANNER_AUTO_ADJUST_DEFAULT_LIMIT);
        const nextSettings = {
            ...currentSettings,
            limit: nextLimit
        };
        state.autoAdjustSettings = savePlannerAutoAdjustSettings(nextSettings, contact);
        state.autoAdjustContactId = String(state.autoAdjustSettings.contactId || '');
        syncPlannerAutoAdjustUi(state.autoAdjustSettings);
    }

    async function runPlannerAutoAdjustCheck() {
        const contact = getPlannerTargetContact();
        if (!contact) return;
        if (state.planGenerating || state.autoAdjustInFlight) return;
        if (!state.generatedPlan) return;

        const settings = refreshPlannerAutoAdjustState();
        if (!settings.enabled) return;

        const history = getPlannerChatHistory(contact);
        if (!history.length) return;

        const currentDateKey = getPlannerCurrentDateKey(getPlannerDateContext().date);
        if (settings.baselineDateKey !== currentDateKey) {
            const resetSettings = {
                ...settings,
                baselineDateKey: currentDateKey,
                baselineCount: history.length
            };
            state.autoAdjustSettings = savePlannerAutoAdjustSettings(resetSettings, contact);
            state.autoAdjustContactId = String(state.autoAdjustSettings.contactId || '');
            syncPlannerAutoAdjustUi(state.autoAdjustSettings);
            return;
        }

        const newMessagesCount = history.length - settings.baselineCount;
        if (newMessagesCount < settings.limit) return;

        const aiSettings = getPlannerAiSettings();
        if (!aiSettings) return;

        const messagesToAdjust = history.slice(settings.baselineCount);
        const nextSettings = {
            ...settings,
            baselineDateKey: currentDateKey,
            baselineCount: history.length,
            lastTriggeredAt: Date.now()
        };
        state.autoAdjustSettings = savePlannerAutoAdjustSettings(nextSettings, contact);
        state.autoAdjustContactId = String(state.autoAdjustSettings.contactId || '');
        syncPlannerAutoAdjustUi(state.autoAdjustSettings);

        state.autoAdjustInFlight = true;
        notifyPlanner('正在调整行程...', 1800);

        try {
            const adjustedPlan = await requestPlannerAdjustmentFromApi({
                basePlan: state.generatedPlan,
                adjustmentMessages: messagesToAdjust,
                now: new Date()
            });

            if (!adjustedPlan) return;

            const mergedPlan = mergePlannerPlans(state.generatedPlan || createGeneratedPlan(), adjustedPlan, { now: new Date() });
            applyGeneratedPlan(mergedPlan);
            notifyPlanner('行程已自动调整', 1800);
        } catch (error) {
            console.error('[location-schedule-v1] planner auto-adjust failed:', error);
            notifyPlanner('行程调整失败', 1800);
        } finally {
            state.autoAdjustInFlight = false;
        }
    }

    function startPlannerAutoAdjustMonitor() {
        if (state.autoAdjustTimer) return;
        state.autoAdjustTimer = setInterval(() => {
            void runPlannerAutoAdjustCheck();
        }, 5000);
        void runPlannerAutoAdjustCheck();
    }

    function stopPlannerAutoAdjustMonitor() {
        if (state.autoAdjustTimer) {
            clearInterval(state.autoAdjustTimer);
            state.autoAdjustTimer = null;
        }
    }

    function applyGeneratedPlan(plan, options = {}) {
        state.generatedPlan = normalizePlanObject(plan, {
            fillFallback: options.fillFallback !== false
        });
        decorateMonthlyPlanColors(state.generatedPlan);
        persistGeneratedPlan(state.generatedPlan);
        renderMonthly();
        renderWeekly();
        renderDaily(getPlannerDateContext().date.getDate(), { activate: false });
    }

    function setPlanGenerationButtonLoading(isLoading) {
        if (!state.ui.planToggleButton) return;
        state.ui.planToggleButton.classList.toggle('loading', Boolean(isLoading));
        if (isLoading) {
            state.ui.planToggleButton.setAttribute('aria-busy', 'true');
        } else {
            state.ui.planToggleButton.removeAttribute('aria-busy');
        }
    }

    async function runPlanGeneration(mode = 'full') {
        if (state.planGenerating) return;
        const normalizedMode = String(mode || 'full').toLowerCase() === 'daily' ? 'daily' : 'full';
        state.planGenerating = true;
        closePlanModeChoice();
        setPlanGenerationButtonLoading(true);

        try {
            const plan = normalizedMode === 'daily'
                ? await requestPlannerDailyGenerationFromApi()
                : await requestPlanGenerationFromApi();
            if (normalizedMode === 'daily' && (!plan || !plan.daily)) {
                throw new Error('API returned empty daily plan');
            }
            if (normalizedMode === 'daily') {
                const basePlan = state.generatedPlan && typeof state.generatedPlan === 'object' ? state.generatedPlan : null;
                const nextPlan = basePlan
                    ? {
                        ...basePlan,
                        daily: plan && plan.daily ? plan.daily : (plan && plan.daily === null ? null : basePlan.daily)
                    }
                    : plan;
                applyGeneratedPlan(nextPlan, { fillFallback: false });
            } else {
                applyGeneratedPlan(plan);
            }
        } catch (error) {
            console.error('[location-schedule-v1] plan generation failed, using fallback:', error);
            if (normalizedMode === 'daily') {
                const basePlan = state.generatedPlan && typeof state.generatedPlan === 'object' ? state.generatedPlan : null;
                const fallbackDailyPlan = normalizePlanObject({
                    daily: createGeneratedDailyPlan(basePlan)
                }, { fillFallback: false });
                const nextPlan = basePlan
                    ? {
                        ...basePlan,
                        daily: fallbackDailyPlan.daily || basePlan.daily || null
                    }
                    : fallbackDailyPlan;
                applyGeneratedPlan(nextPlan, { fillFallback: false });
            } else {
                applyGeneratedPlan(createGeneratedPlan());
            }
        } finally {
            state.planGenerating = false;
            setPlanGenerationButtonLoading(false);
        }
    }

    function cacheElements() {
        const root = state.shadowRoot;
        state.phone = root.querySelector('.phone');
        state.tabs = Array.from(root.querySelectorAll('.tab'));
        state.views = {
            daily: root.getElementById('view-daily'),
            weekly: root.getElementById('view-weekly'),
            monthly: root.getElementById('view-monthly')
        };
        state.ui = {
            calendarGrid: root.getElementById('calendar-grid'),
            weeklyList: root.getElementById('weekly-list'),
            dailyTimeline: root.getElementById('daily-timeline'),
            dailyWeekday: root.getElementById('daily-weekday'),
            dailyDay: root.getElementById('daily-day'),
            tabIndicator: root.getElementById('tab-indicator'),
            settingsOverlay: root.getElementById('settings-overlay'),
            settingsPopup: root.getElementById('settings-popup'),
            settingsClose: root.querySelector('.settings-close'),
            settingsToggleButton: root.querySelector('.tools-bar .tool-btn:last-child'),
            planToggleButton: root.querySelector('.tools-bar .tool-btn:first-child'),
            autoAdjustSwitch: root.getElementById('auto-adjust-switch'),
            autoAdjustSubrow: root.getElementById('auto-adjust-subrow'),
            autoAdjustInput: root.querySelector('#auto-adjust-subrow input[type="number"]'),
            customPaletteArea: root.getElementById('custom-palette-area'),
            paletteItems: Array.from(root.querySelectorAll('.palette-item')),
            photoUploadArea: root.getElementById('photo-upload-area'),
            photoInput: root.getElementById('photo-input'),
            uploadedPhoto: root.getElementById('uploaded-photo'),
            uploadPlaceholder: root.getElementById('upload-placeholder'),
            headerCloseTarget: root.querySelector('.header-top > div:first-child'),
            dayPreviewOverlay: root.getElementById('day-preview-overlay'),
            dayPreviewMeta: root.getElementById('day-preview-meta'),
            dayPreviewTitle: root.getElementById('day-preview-title'),
            dayPreviewList: root.getElementById('day-preview-list'),
            dayPreviewClose: root.getElementById('day-preview-close'),
            planModeOverlay: root.getElementById('plan-mode-overlay'),
            planModeClose: root.getElementById('plan-mode-close'),
            planModeDailyButton: root.getElementById('plan-mode-daily'),
            planModeFullButton: root.getElementById('plan-mode-full'),
            planModeCancelButton: root.getElementById('plan-mode-cancel')
        };
    }

    function setThemeClasses(type) {
        if (!state.phone) return;
        state.phone.classList.remove('theme-mono', 'theme-custom');
        state.ui.customPaletteArea.classList.remove('active');

        if (type === 'mono') {
            state.phone.classList.add('theme-mono');
        } else if (type === 'custom') {
            state.phone.classList.add('theme-custom');
            state.ui.customPaletteArea.classList.add('active');
            updateCustomColors();
        }
    }

    function updateCustomColors() {
        if (!state.phone) return;
        const mappings = [
            ['cp-dashed-1', '--custom-dashed-1'],
            ['cp-dashed-2', '--custom-dashed-2'],
            ['cp-dashed-3', '--custom-dashed-3'],
            ['cp-dashed-4', '--custom-dashed-4'],
            ['cp-dot-1', '--custom-dot-1'],
            ['cp-dot-2', '--custom-dot-2'],
            ['cp-dot-3', '--custom-dot-3'],
            ['cp-dot-4', '--custom-dot-4'],
            ['cp-vline-1', '--custom-vline-1'],
            ['cp-vline-2', '--custom-vline-2'],
            ['cp-vline-3', '--custom-vline-3'],
            ['cp-vline-4', '--custom-vline-4'],
            ['cp-card-bg-1', '--custom-card-bg-1'],
            ['cp-card-bg-2', '--custom-card-bg-2'],
            ['cp-card-bg-3', '--custom-card-bg-3'],
            ['cp-card-bg-4', '--custom-card-bg-4'],
            ['cp-tag-1', '--custom-tag-1'],
            ['cp-tag-2', '--custom-tag-2'],
            ['cp-tag-3', '--custom-tag-3'],
            ['cp-tag-4', '--custom-tag-4']
        ];

        mappings.forEach(([id, variableName]) => {
            const input = state.shadowRoot.getElementById(id);
            if (!input) return;
            state.phone.style.setProperty(variableName, input.value);
        });
    }

    function toggleSettings(forceOpen = null) {
        if (!state.ui.settingsOverlay || !state.ui.settingsPopup) return;
        const shouldOpen = typeof forceOpen === 'boolean'
            ? forceOpen
            : !state.ui.settingsOverlay.classList.contains('active');

        state.ui.settingsOverlay.classList.toggle('active', shouldOpen);
        state.ui.settingsPopup.classList.toggle('active', shouldOpen);
    }

    function renderDaily(day, options = {}) {
        if (!state.ui.dailyTimeline) return;
        const shouldActivate = options.activate !== false;
        const context = getPlannerDateContext();
        const now = new Date();
        const selectedDate = resolvePlannerDateInput(day, context);
        const selectedContext = getPlannerDateContext(selectedDate);
        const selectedDay = selectedDate.getDate() || context.date.getDate();
        const selectedDateKey = formatPlannerDateKey(selectedDate);
        const currentDateKey = formatPlannerDateKey(context.date);
        const dailyPlan = state.generatedPlan && state.generatedPlan.daily && state.generatedPlan.daily.dateKey === selectedDateKey
            ? state.generatedPlan.daily
            : (state.generatedPlan && state.generatedPlan.daily && !state.generatedPlan.daily.dateKey && selectedDateKey === currentDateKey
                ? state.generatedPlan.daily
                : null);

        let evts = dailyPlan && Array.isArray(dailyPlan.entries) && dailyPlan.entries.length
            ? dailyPlan.entries.slice()
            : eventsData[selectedDay];
        if (!evts || !evts[0] || !evts[0].time) {
            evts = [
                { title: 'Morning Routine', type: 'yellow', time: '08:00', desc: 'Breakfast and reading.' },
                { title: 'Deep Work', type: 'blue', time: '10:00', desc: 'Focused project time.' },
                { title: 'Break', type: 'pink', time: '15:00', desc: 'Coffee and stretch.' }
            ];
        }

        const normalizedEvents = evts
            .map((event) => {
                if (!event || typeof event !== 'object') return null;
                const time = normalizePlannerTimeLabel(event.time || '00:00');
                if (!time) return null;
                return {
                    time,
                    title: String(event.title || '事项').trim() || '事项',
                    desc: String(event.desc || event.note || event.description || '').trim(),
                    type: PLANNER_ALLOWED_TYPE_SET.has(String(event.type || 'blue').toLowerCase()) ? String(event.type || 'blue').toLowerCase() : 'blue'
                };
            })
            .filter(Boolean)
            .sort((a, b) => getPlannerTimeMinutes(a.time) - getPlannerTimeMinutes(b.time))
            .reduce((list, entry) => {
                if (list.some((item) => item.time === entry.time)) return list;
                list.push(entry);
                return list;
            }, []);

        const currentMinutes = (now.getHours() * 60) + now.getMinutes();
        const isToday = selectedDateKey === currentDateKey;
        const visibleEntries = isToday
            ? normalizedEvents.filter((entry) => getPlannerTimeMinutes(entry.time) <= currentMinutes)
            : normalizedEvents;

        state.currentDailyDateKey = selectedDateKey;
        schedulePlannerDailyRevealTimer(selectedDateKey, normalizedEvents, now);

        state.ui.dailyTimeline.innerHTML = visibleEntries.map((event, index) => {
            const delay = index * 0.1;
            const timeParts = String(event.time || '00:00').split(':');
            const titleText = String(event.title || '事项').trim() || '事项';
            const descText = String(event.desc || event.note || event.description || '').trim();
            const colorClass = String(event.type || 'blue').toLowerCase();
            return `
                <div class="time-slot type-${colorClass}" style="animation: fadeInScale 0.4s ${delay}s both;">
                    <div class="time-label">${timeParts[0]}<span>${timeParts[1] || '00'}</span></div>
                    <div class="timeline-event c-${colorClass}">
                        <div class="event-title">
                            <span>${escapeHtml(titleText)}</span>
                            <span class="event-time">${escapeHtml(event.time || '00:00')}</span>
                        </div>
                        <div class="event-desc">${escapeHtml(descText)}</div>
                    </div>
                </div>
            `;
        }).join('');

        if (state.ui.dailyDay) {
            state.ui.dailyDay.innerHTML = `${formatMonthDayLabel(selectedDay)} <span style="font-size: 20px; color: var(--text-sub)">of ${selectedContext.monthNameEn}</span>`;
        }
        if (state.ui.dailyWeekday) {
            state.ui.dailyWeekday.innerText = WEEKDAY_NAMES_LONG[selectedDate.getDay()];
        }
        const dailyWeekLabel = state.shadowRoot.querySelector('#view-daily .daily-header > div:last-child');
        if (dailyWeekLabel) {
            dailyWeekLabel.textContent = `WEEK ${getISOWeekNumber(selectedDate)}`;
        }

        if (shouldActivate) {
            activateTab('daily', 0, true);
        }
    }

    function renderMonthly() {
        if (!state.ui.calendarGrid) return;
        const context = getPlannerDateContext();
        syncPlannerDateLabels(context);
        state.ui.calendarGrid.innerHTML = '';
        const monthlyPlanLookup = state.generatedPlan && state.generatedPlan.month && Array.isArray(state.generatedPlan.month.events) && state.generatedPlan.month.events.length
            ? buildMonthlyPlanLookup(state.generatedPlan.month.events)
            : null;
        const leadingDays = context.gridStartOffset;
        const previousMonthDays = new Date(context.year, context.monthIndex, 0).getDate();
        const totalCells = 42;
        const trailingDays = Math.max(0, totalCells - leadingDays - context.monthDays);

        for (let offset = leadingDays - 1; offset >= 0; offset -= 1) {
            const dayNum = previousMonthDays - offset;
            state.ui.calendarGrid.insertAdjacentHTML('beforeend', `<div class="day-cell inactive"><div class="day-num">${dayNum}</div></div>`);
        }

        for (let i = 1; i <= context.monthDays; i += 1) {
            const evts = monthlyPlanLookup ? (monthlyPlanLookup.get(i) || []) : (eventsData[i] || []);
            const pillsHtml = evts.map((event) => {
                if (!monthlyPlanLookup && event.type === 'dots') {
                    return '<div class="event-dots"><div class="event-dot c-pink"></div><div class="event-dot c-blue"></div><div class="event-dot c-green"></div></div>';
                }

                if (monthlyPlanLookup) {
                    const spanClass = event.isStart ? 'plan-start' : 'plan-continue';
                    const colorClass = event.displayColor || 'blue';
                    return `<div class="event-pill-tiny plan-month-marker c-${colorClass} ${spanClass}">${escapeHtml(event.title)}</div>`;
                }

                return `<div class="event-pill-tiny c-${event.type}">${escapeHtml(event.title)}</div>`;
            }).join('');
            const cls = i === context.date.getDate() ? 'day-cell today' : 'day-cell';
            state.ui.calendarGrid.insertAdjacentHTML(
                'beforeend',
                `<div class="${cls}" data-day="${i}"><div class="day-num">${i}</div>${pillsHtml}</div>`
            );
        }

        for (let i = 1; i <= trailingDays; i += 1) {
            state.ui.calendarGrid.insertAdjacentHTML('beforeend', `<div class="day-cell inactive"><div class="day-num">${i}</div></div>`);
        }

        state.ui.calendarGrid.querySelectorAll('[data-day]').forEach((cell) => {
            cell.addEventListener('click', () => openMonthlyDayPreview(Number(cell.dataset.day)));
        });
    }

    function renderWeekly() {
        if (!state.ui.weeklyList) return;
        const context = getPlannerDateContext();
        syncPlannerDateLabels(context);
        state.ui.weeklyList.innerHTML = '';
        if (state.generatedPlan && state.generatedPlan.week && (
            (Array.isArray(state.generatedPlan.week.goalGroups) && state.generatedPlan.week.goalGroups.length)
            || (Array.isArray(state.generatedPlan.week.dailyPlans) && state.generatedPlan.week.dailyPlans.length)
        )) {
            const { week } = state.generatedPlan;
            const goalGroups = Array.isArray(week.goalGroups) ? week.goalGroups : [];
            const dailyPlans = Array.isArray(week.dailyPlans) ? week.dailyPlans : [];
            const weeklyRange = state.shadowRoot.querySelector('#view-weekly .weekly-view > div > div:last-child');
            if (weeklyRange) {
                weeklyRange.textContent = String(week.rangeLabel || formatPlannerWeekRange(context.weekStart, context.weekEnd)).toUpperCase();
            }
            const weekSeedText = [
                week.rangeLabel || '',
                week.summary || '',
                ...(Array.isArray(week.chips) ? week.chips : []),
                ...goalGroups.map((group) => `${String(group && group.title ? group.title : '').trim()}|${Array.isArray(group && group.items) ? group.items.join('|') : ''}`),
                ...dailyPlans.map((day) => `${String(day && day.dayNum ? day.dayNum : '').trim()}|${String(day && day.weekday ? day.weekday : '').trim()}|${Array.isArray(day && day.items) ? day.items.join('|') : ''}`)
            ].join('||');
            const pickWeekColor = createPlannerColorPicker(`week:${weekSeedText}`);
            const goalGroupsHtml = goalGroups.map((group, index) => {
                const itemsHtml = group.items.map((item) => {
                    const colorClass = pickWeekColor();
                    return `<div class="event-pill c-${colorClass}">${escapeHtml(item)}</div>`;
                }).join('');

                return `
                    <div class="week-day-row plan-generated-row">
                        <div class="week-day-info">
                            <div class="week-day-num">${index + 1}</div>
                            <div class="week-day-name">${escapeHtml(group.title)}</div>
                        </div>
                        <div class="week-events">
                            ${itemsHtml}
                        </div>
                    </div>
                `;
            }).join('');

            const dailyPlansHtml = dailyPlans.map((day) => `
                <div class="week-day-row plan-generated-row" data-day="${day.dayNum}" data-date-key="${escapeHtml(day.dateKey || '')}">
                    <div class="week-day-info">
                        <div class="week-day-num">${day.dayNum}</div>
                        <div class="week-day-name">${escapeHtml(day.weekday)}</div>
                    </div>
                    <div class="week-events">
                        ${(Array.isArray(day.items) && day.items.length
                            ? day.items
                            : [day.mustDo, day.habit, day.optional])
                            .filter((item) => String(item || '').trim())
                            .map((item) => {
                                const colorClass = pickWeekColor();
                                return `<div class="event-pill c-${colorClass}">${escapeHtml(item)}</div>`;
                            })
                            .join('')}
                    </div>
                </div>
            `).join('');

            state.ui.weeklyList.innerHTML = `
                <div style="padding: 4px 0 12px; border-bottom: 1px solid var(--border-color); margin-bottom: 10px;">
                    <div class="text-xs">一、每周目标</div>
                </div>
                ${goalGroupsHtml}
                <div style="padding: 14px 0 8px; border-bottom: 1px solid var(--border-color); margin: 2px 0 10px;">
                    <div class="text-xs">二、拆分每日具体计划</div>
                </div>
                ${dailyPlansHtml}
            `;

            state.ui.weeklyList.querySelectorAll('[data-day]').forEach((row) => {
                row.addEventListener('click', () => openDay(Number(row.dataset.day), row.dataset.dateKey || null));
            });
            return;
        }

        const weekDates = Array.from({ length: 7 }, (_, index) => {
            const date = new Date(context.weekStart);
            date.setDate(context.weekStart.getDate() + index);
            return date;
        });

        weekDates.forEach((date) => {
            const dayNum = date.getDate();
            const evts = (eventsData[dayNum] || [{ title: '待安排', type: 'yellow' }]).filter((event) => event && event.type !== 'dots');
            const pillsHtml = evts.map((event) => `<div class="event-pill c-${event.type}">${escapeHtml(event.title)}</div>`).join('');
            state.ui.weeklyList.insertAdjacentHTML(
                'beforeend',
                `
                    <div class="week-day-row" data-day="${dayNum}" data-date-key="${formatPlannerDateKey(date)}">
                        <div class="week-day-info">
                            <div class="week-day-num">${dayNum}</div>
                            <div class="week-day-name">${WEEKDAY_NAMES_SHORT[date.getDay()]}</div>
                        </div>
                        <div class="week-events">${pillsHtml}</div>
                    </div>
                `
            );
        });

        state.ui.weeklyList.querySelectorAll('[data-day]').forEach((row) => {
            row.addEventListener('click', () => openDay(Number(row.dataset.day), row.dataset.dateKey || null));
        });
    }

    function updateTabIndicator(index) {
        if (!state.ui.tabIndicator) return;
        state.ui.tabIndicator.style.left = `calc(6px + (100% - 12px) / 3 * ${index})`;
    }

    function activateTab(tabName, index, skipAnimation = false) {
        const nextView = state.views[tabName];
        const oldView = state.views[state.currentTabName];

        if (!nextView) return;
        if (!skipAnimation && state.currentTabIndex === index && state.currentTabName === tabName) return;

        state.tabs.forEach((tab) => tab.classList.remove('active'));
        if (state.tabs[index]) state.tabs[index].classList.add('active');
        updateTabIndicator(index);

        if (oldView && oldView !== nextView) {
            oldView.className = 'view ' + (index < state.currentTabIndex ? 'right' : 'left');
        }

        nextView.className = 'view active ' + (index < state.currentTabIndex ? 'left' : 'right');
        setTimeout(() => nextView.classList.remove('left', 'right'), 50);

        Array.from(nextView.children).forEach((child) => {
            child.classList.remove('animate-in');
            void child.offsetWidth;
            child.classList.add('animate-in');
        });

        state.currentTabIndex = index;
        state.currentTabName = tabName;
    }

    function openDay(day, dateKey = null) {
        renderDaily(dateKey || day);
    }

    function handlePhotoUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            applyPlannerMonthlyPhoto(String(e.target && e.target.result ? e.target.result : ''), { persist: true });
        };
        reader.onerror = () => {
            console.warn('[location-schedule-v1] photo upload read failed');
        };
        reader.readAsDataURL(file);
    }

    function bindEvents() {
        if (!state.shadowRoot) return;

        state.tabs.forEach((tab, index) => {
            const tabNames = ['daily', 'weekly', 'monthly'];
            tab.dataset.tab = tabNames[index] || 'monthly';
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                activateTab(tabName, index);
            });
        });

        if (state.ui.settingsOverlay) {
            state.ui.settingsOverlay.addEventListener('click', () => toggleSettings(false));
        }
        if (state.ui.settingsClose) {
            state.ui.settingsClose.addEventListener('click', () => toggleSettings(false));
        }
        if (state.ui.settingsToggleButton) {
            state.ui.settingsToggleButton.addEventListener('click', () => toggleSettings());
        }
        if (state.ui.planToggleButton) {
            state.ui.planToggleButton.addEventListener('click', openPlanModeChoice);
        }
        if (state.ui.autoAdjustSwitch) {
            state.ui.autoAdjustSwitch.addEventListener('click', toggleAutoAdjust);
        }
        if (state.ui.autoAdjustInput) {
            state.ui.autoAdjustInput.addEventListener('change', handleAutoAdjustLimitChange);
        }
        if (state.ui.dayPreviewOverlay) {
            state.ui.dayPreviewOverlay.addEventListener('click', (event) => {
                if (event.target === state.ui.dayPreviewOverlay || event.target.hasAttribute('data-preview-dismiss')) {
                    closeMonthlyDayPreview();
                }
            });
        }
        if (state.ui.dayPreviewClose) {
            state.ui.dayPreviewClose.addEventListener('click', closeMonthlyDayPreview);
        }
        if (state.ui.planModeOverlay) {
            state.ui.planModeOverlay.addEventListener('click', (event) => {
                if (event.target === state.ui.planModeOverlay || event.target.hasAttribute('data-plan-mode-dismiss')) {
                    closePlanModeChoice();
                }
            });
        }
        if (state.ui.planModeClose) {
            state.ui.planModeClose.addEventListener('click', closePlanModeChoice);
        }
        if (state.ui.planModeCancelButton) {
            state.ui.planModeCancelButton.addEventListener('click', closePlanModeChoice);
        }
        if (state.ui.planModeDailyButton) {
            state.ui.planModeDailyButton.addEventListener('click', () => runPlanGeneration('daily'));
        }
        if (state.ui.planModeFullButton) {
            state.ui.planModeFullButton.addEventListener('click', () => runPlanGeneration('full'));
        }
        state.ui.paletteItems.forEach((item) => {
            const paletteNames = ['default', 'mono', 'custom'];
            item.dataset.palette = paletteNames[state.ui.paletteItems.indexOf(item)] || 'default';
            item.addEventListener('click', () => {
                state.ui.paletteItems.forEach((node) => node.classList.remove('active'));
                item.classList.add('active');
                const type = item.getAttribute('data-palette');
                setThemeClasses(type);
            });
        });
        if (state.ui.photoUploadArea && state.ui.photoInput) {
            state.ui.photoUploadArea.addEventListener('click', () => state.ui.photoInput.click());
            state.ui.photoInput.addEventListener('change', handlePhotoUpload);
        }
        if (state.ui.headerCloseTarget) {
            state.ui.headerCloseTarget.classList.add('location-exit-target');
            state.ui.headerCloseTarget.setAttribute('role', 'button');
            state.ui.headerCloseTarget.setAttribute('tabindex', '0');
            state.ui.headerCloseTarget.setAttribute('aria-label', '退出位置页面');
            state.ui.headerCloseTarget.addEventListener('click', closeLocationApp);
            state.ui.headerCloseTarget.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    closeLocationApp();
                }
            });
        }
    }

    async function buildLocationApp() {
        if (state.ready) return;
        state.host = document.getElementById(HOST_ID);
        if (!state.host) return;

        if (!state.host.shadowRoot) {
            state.shadowRoot = state.host.attachShadow({ mode: 'open' });
        } else {
            state.shadowRoot = state.host.shadowRoot;
        }

        const response = await fetch(SOURCE_URL, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Failed to load ${SOURCE_URL}: ${response.status}`);
        }

        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        const styleEl = parsed.querySelector('style');
        if (!styleEl || !parsed.body) {
            throw new Error('schedule_v1.html is missing expected style/body content');
        }

        stripInlineHandlers(parsed.body);

        const styleText = rewriteStyles(styleEl.textContent) + `
            .location-exit-target {
                cursor: pointer;
                user-select: none;
                -webkit-user-select: none;
                touch-action: manipulation;
            }
            .location-exit-target:active { opacity: 0.78; }
        ` + buildPlanStyles();

        state.shadowRoot.innerHTML = `
            <style>${styleText}</style>
            ${parsed.body.innerHTML}
            ${buildDayPreviewMarkup()}
            ${buildPlanModeMarkup()}
        `;

        cacheElements();
        bindEvents();
        restorePlannerMonthlyPhoto();
        refreshPersistedGeneratedPlan();
        refreshPlannerAutoAdjustState();
        startPlannerAutoAdjustMonitor();
        const initialDateContext = getPlannerDateContext();
        syncPlannerDateLabels(initialDateContext);
        renderDaily(initialDateContext.date.getDate(), { activate: false });
        renderMonthly();
        renderWeekly();
        setTimeout(() => activateTab('monthly', 2, true), 100);
        setThemeClasses('default');

        state.ready = true;
    }

    function closeLocationApp() {
        if (!state.host) return;
        closeMonthlyDayPreview();
        closePlanModeChoice();
        clearPlannerDailyRevealTimer();
        state.host.classList.add('hidden');
        toggleSettings(false);
    }

    async function openLocationApp() {
        try {
            if (!state.initPromise) {
                state.initPromise = buildLocationApp().catch((error) => {
                    console.error('[location-schedule-v1] init failed:', error);
                    state.initPromise = null;
                    throw error;
                });
            }
            await state.initPromise;
            if (state.host) {
                state.host.classList.remove('hidden');
            }
            closePlanModeChoice();
            if (state.ready) {
                restorePlannerMonthlyPhoto();
                refreshPersistedGeneratedPlan();
                refreshPlannerAutoAdjustState();
                startPlannerAutoAdjustMonitor();
                const currentDateContext = getPlannerDateContext();
                renderDaily(currentDateContext.date.getDate(), { activate: false });
                renderMonthly();
                renderWeekly();
                if (state.currentTabName !== 'monthly') {
                    setTimeout(() => activateTab('monthly', 2, true), 100);
                }
            }
        } catch (error) {
            console.error('[location-schedule-v1] open failed:', error);
        }
    }

    function bootstrap() {
        state.initPromise = buildLocationApp().catch((error) => {
            console.error('[location-schedule-v1] boot failed:', error);
            state.initPromise = null;
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (state.ui.dayPreviewOverlay && state.ui.dayPreviewOverlay.classList.contains('active')) {
            closeMonthlyDayPreview();
            return;
        }
        if (state.ui.planModeOverlay && state.ui.planModeOverlay.classList.contains('active')) {
            closePlanModeChoice();
            return;
        }
        if (state.host && !state.host.classList.contains('hidden')) {
            closeLocationApp();
        }
    });

    window.openLocationApp = openLocationApp;
    window.closeLocationApp = closeLocationApp;
    window.locationScheduleV1Ready = () => state.initPromise || Promise.resolve();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
    } else {
        bootstrap();
    }
})();
