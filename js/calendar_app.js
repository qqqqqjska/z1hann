(function () {
    const CALENDAR_VIEW_ID = 'calendar-v1-view-calendar';
    const SCHEDULE_VIEW_ID = 'calendar-v1-view-schedule';
    const MIN_MONTH_KEY = '2023-01';
    const MAX_MONTH_KEY = '2029-12';
    const MIN_YEAR = 2023;
    const MAX_YEAR = 2029;
    const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const MONTH_SHORT_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const SCHEDULE_DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const SCHEDULE_TIME_LABELS = Array.from({ length: 14 }, (_, index) => `${pad(index + 8)}:00`);
    const SCHEDULE_COLOR_OPTIONS = ['blue', 'green', 'pink', 'gray'];
    const TEXT = {
        newYear: '\u5143\u65e6',
        valentine: '\u60c5\u4eba\u8282',
        womensDay: '\u5987\u5973\u8282',
        youthDay: '\u9752\u5e74\u8282',
        childrensDay: '\u513f\u7ae5\u8282',
        teachersDay: '\u6559\u5e08\u8282',
        halloween: '\u4e07\u5723\u591c',
        singlesDay: '\u53cc\u5341\u4e00',
        christmasEve: '\u5e73\u5b89\u591c',
        christmas: '\u5723\u8bde\u8282',
        newYearsEve: '\u8de8\u5e74\u591c',
        springFestival: '\u6625\u8282',
        qingming: '\u6e05\u660e',
        laborDay: '\u52b3\u52a8\u8282',
        laborShort: '\u52b3\u52a8',
        dragonBoat: '\u7aef\u5348',
        midAutumn: '\u4e2d\u79cb',
        nationalDay: '\u56fd\u5e86',
        midAutumnNational: '\u4e2d\u79cb\u56fd\u5e86',
        nationalMidAutumn: '\u56fd\u5e86\u4e2d\u79cb',
        rest: '\u4f11',
        workday: '\u8865\u73ed',
        adjustedWorkday: '\u8c03\u4f11\u8865\u73ed',
        statutoryHoliday: '\u6cd5\u5b9a\u8282\u5047\u65e5',
        adjustedHoliday: '\u8282\u5047\u65e5\u8c03\u4f11\u5b89\u6392',
        stateCouncilSchedule: '\u56fd\u52a1\u9662\u529e\u516c\u5385\u8282\u5047\u65e5\u5b89\u6392'
    };

    const COMMON_FESTIVALS = {
        '01-01': TEXT.newYear,
        '02-14': TEXT.valentine,
        '03-08': TEXT.womensDay,
        '05-04': TEXT.youthDay,
        '06-01': TEXT.childrensDay,
        '09-10': TEXT.teachersDay,
        '10-31': TEXT.halloween,
        '11-11': TEXT.singlesDay,
        '12-24': TEXT.christmasEve,
        '12-25': TEXT.christmas,
        '12-31': TEXT.newYearsEve
    };

    const OFFICIAL_HOLIDAY_SCHEDULE = {
        '2023': {
            periods: [
                { name: TEXT.newYear, dates: ['2022-12-31', '2023-01-01', '2023-01-02'], labels: { '2023-01-01': TEXT.newYear } },
                { name: TEXT.springFestival, dates: ['2023-01-21', '2023-01-22', '2023-01-23', '2023-01-24', '2023-01-25', '2023-01-26', '2023-01-27'], labels: { '2023-01-22': TEXT.springFestival } },
                { name: TEXT.qingming, dates: ['2023-04-05'], labels: { '2023-04-05': TEXT.qingming } },
                { name: TEXT.laborDay, dates: ['2023-04-29', '2023-04-30', '2023-05-01', '2023-05-02', '2023-05-03'], labels: { '2023-05-01': TEXT.laborShort } },
                { name: TEXT.dragonBoat, dates: ['2023-06-22', '2023-06-23', '2023-06-24'], labels: { '2023-06-22': TEXT.dragonBoat } },
                { name: TEXT.midAutumnNational, dates: ['2023-09-29', '2023-09-30', '2023-10-01', '2023-10-02', '2023-10-03', '2023-10-04', '2023-10-05', '2023-10-06'], labels: { '2023-09-29': TEXT.midAutumn, '2023-10-01': TEXT.nationalDay } }
            ],
            workdays: ['2023-01-28', '2023-01-29', '2023-04-23', '2023-05-06', '2023-06-25', '2023-10-07', '2023-10-08']
        },
        '2024': {
            periods: [
                { name: TEXT.newYear, dates: ['2023-12-30', '2023-12-31', '2024-01-01'], labels: { '2024-01-01': TEXT.newYear } },
                { name: TEXT.springFestival, dates: ['2024-02-10', '2024-02-11', '2024-02-12', '2024-02-13', '2024-02-14', '2024-02-15', '2024-02-16', '2024-02-17'], labels: { '2024-02-10': TEXT.springFestival } },
                { name: TEXT.qingming, dates: ['2024-04-04', '2024-04-05', '2024-04-06'], labels: { '2024-04-04': TEXT.qingming } },
                { name: TEXT.laborDay, dates: ['2024-05-01', '2024-05-02', '2024-05-03', '2024-05-04', '2024-05-05'], labels: { '2024-05-01': TEXT.laborShort } },
                { name: TEXT.dragonBoat, dates: ['2024-06-08', '2024-06-09', '2024-06-10'], labels: { '2024-06-10': TEXT.dragonBoat } },
                { name: TEXT.midAutumn, dates: ['2024-09-15', '2024-09-16', '2024-09-17'], labels: { '2024-09-17': TEXT.midAutumn } },
                { name: TEXT.nationalDay, dates: ['2024-10-01', '2024-10-02', '2024-10-03', '2024-10-04', '2024-10-05', '2024-10-06', '2024-10-07'], labels: { '2024-10-01': TEXT.nationalDay } }
            ],
            workdays: ['2024-02-04', '2024-02-18', '2024-04-07', '2024-04-28', '2024-05-11', '2024-09-14', '2024-09-29', '2024-10-12']
        },
        '2025': {
            periods: [
                { name: TEXT.newYear, dates: ['2025-01-01'], labels: { '2025-01-01': TEXT.newYear } },
                { name: TEXT.springFestival, dates: ['2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03', '2025-02-04'], labels: { '2025-01-29': TEXT.springFestival } },
                { name: TEXT.qingming, dates: ['2025-04-04', '2025-04-05', '2025-04-06'], labels: { '2025-04-04': TEXT.qingming } },
                { name: TEXT.laborDay, dates: ['2025-05-01', '2025-05-02', '2025-05-03', '2025-05-04', '2025-05-05'], labels: { '2025-05-01': TEXT.laborShort } },
                { name: TEXT.dragonBoat, dates: ['2025-05-31', '2025-06-01', '2025-06-02'], labels: { '2025-05-31': TEXT.dragonBoat } },
                { name: TEXT.nationalMidAutumn, dates: ['2025-10-01', '2025-10-02', '2025-10-03', '2025-10-04', '2025-10-05', '2025-10-06', '2025-10-07', '2025-10-08'], labels: { '2025-10-01': TEXT.nationalDay, '2025-10-06': TEXT.midAutumn } }
            ],
            workdays: ['2025-01-26', '2025-02-08', '2025-04-27', '2025-09-28', '2025-10-11']
        },
        '2026': {
            periods: [
                { name: TEXT.newYear, dates: ['2026-01-01', '2026-01-02', '2026-01-03'], labels: { '2026-01-01': TEXT.newYear } },
                { name: TEXT.springFestival, dates: ['2026-02-15', '2026-02-16', '2026-02-17', '2026-02-18', '2026-02-19', '2026-02-20', '2026-02-21', '2026-02-22', '2026-02-23'], labels: { '2026-02-17': TEXT.springFestival } },
                { name: TEXT.qingming, dates: ['2026-04-04', '2026-04-05', '2026-04-06'], labels: { '2026-04-05': TEXT.qingming } },
                { name: TEXT.laborDay, dates: ['2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04', '2026-05-05'], labels: { '2026-05-01': TEXT.laborShort } },
                { name: TEXT.dragonBoat, dates: ['2026-06-19', '2026-06-20', '2026-06-21'], labels: { '2026-06-19': TEXT.dragonBoat } },
                { name: TEXT.midAutumn, dates: ['2026-09-25', '2026-09-26', '2026-09-27'], labels: { '2026-09-25': TEXT.midAutumn } },
                { name: TEXT.nationalDay, dates: ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07'], labels: { '2026-10-01': TEXT.nationalDay } }
            ],
            workdays: ['2026-01-04', '2026-02-14', '2026-02-28', '2026-05-09', '2026-09-20', '2026-10-10']
        },
        '2027': { periods: [], workdays: [] },
        '2028': { periods: [], workdays: [] },
        '2029': { periods: [], workdays: [] }
    };

    const OFFICIAL_DAY_MAP = buildOfficialDayMap();

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function formatDateKey(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    }

    function getTodayKey() {
        return formatDateKey(new Date());
    }

    function parseDateKey(dateKey) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateKey || ''));
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        return { year, month, day, date };
    }

    function parseMonthKey(monthKey) {
        const match = /^(\d{4})-(\d{2})$/.exec(String(monthKey || ''));
        if (!match) return null;
        const year = Number(match[1]);
        const month = Number(match[2]);
        if (month < 1 || month > 12) return null;
        return { year, month };
    }

    function dateKeyFromParts(year, month, day) {
        return `${year}-${pad(month)}-${pad(day)}`;
    }

    function monthKeyFromParts(year, month) {
        return `${year}-${pad(month)}`;
    }

    function monthKeyFromDateKey(dateKey) {
        return String(dateKey || '').slice(0, 7);
    }

    function daysInMonth(year, month) {
        return new Date(year, month, 0).getDate();
    }

    function compareMonthKeys(a, b) {
        return String(a).localeCompare(String(b));
    }

    function isMonthKeyInRange(monthKey) {
        return compareMonthKeys(monthKey, MIN_MONTH_KEY) >= 0 && compareMonthKeys(monthKey, MAX_MONTH_KEY) <= 0;
    }

    function clampMonthKey(monthKey) {
        if (!isMonthKeyInRange(monthKey)) {
            if (compareMonthKeys(monthKey, MIN_MONTH_KEY) < 0) return MIN_MONTH_KEY;
            return MAX_MONTH_KEY;
        }
        return monthKey;
    }

    function shiftMonthKey(monthKey, delta) {
        const parsed = parseMonthKey(monthKey);
        if (!parsed || !Number.isFinite(Number(delta))) {
            return clampMonthKey(monthKey || MIN_MONTH_KEY);
        }
        const shifted = new Date(parsed.year, parsed.month - 1 + Number(delta), 1);
        return clampMonthKey(monthKeyFromParts(shifted.getFullYear(), shifted.getMonth() + 1));
    }

    function buildOfficialDayMap() {
        const map = {};
        Object.values(OFFICIAL_HOLIDAY_SCHEDULE).forEach((yearSchedule) => {
            (yearSchedule.periods || []).forEach((period) => {
                (period.dates || []).forEach((dateKey) => {
                    map[dateKey] = {
                        type: 'rest',
                        label: TEXT.rest,
                        name: period.name,
                        source: 'official'
                    };
                });
                Object.entries(period.labels || {}).forEach(([dateKey, label]) => {
                    map[dateKey] = {
                        type: 'holiday',
                        label,
                        name: label,
                        periodName: period.name,
                        source: 'official'
                    };
                });
            });
            (yearSchedule.workdays || []).forEach((dateKey) => {
                map[dateKey] = {
                    type: 'workday',
                    label: TEXT.workday,
                    name: TEXT.adjustedWorkday,
                    source: 'official'
                };
            });
        });
        return map;
    }

    function getDateMeta(dateKey) {
        if (OFFICIAL_DAY_MAP[dateKey]) {
            return OFFICIAL_DAY_MAP[dateKey];
        }
        const festivalLabel = COMMON_FESTIVALS[String(dateKey || '').slice(5)];
        if (festivalLabel) {
            return {
                type: 'festival',
                label: festivalLabel,
                name: festivalLabel,
                source: 'festival'
            };
        }
        return null;
    }

    function createSeedEvents(dateKey) {
        return [
            {
                id: `seed-${dateKey}-ui-review`,
                date: dateKey,
                time: '10:00',
                allDay: false,
                title: 'UI Design Review',
                location: 'Design Studio A',
                icon: 'ri-map-pin-line',
                source: 'seed',
                type: 'event'
            },
            {
                id: `seed-${dateKey}-project-sync`,
                date: dateKey,
                time: '14:30',
                allDay: false,
                title: 'Project Sync',
                location: 'Zoom Meeting',
                icon: 'ri-video-chat-line',
                source: 'seed',
                type: 'event'
            },
            {
                id: `seed-${dateKey}-gym-session`,
                date: dateKey,
                time: '16:00',
                allDay: false,
                title: 'Gym Session',
                location: 'City Fitness',
                icon: 'ri-heart-pulse-line',
                source: 'seed',
                type: 'event'
            }
        ];
    }

    function normalizeEvent(raw) {
        if (!raw || typeof raw !== 'object') return null;
        const dateKey = parseDateKey(raw.date) ? raw.date : '';
        if (!dateKey) return null;
        const inferredSource = raw.source === 'holiday'
            ? 'holiday'
            : raw.source === 'user'
                ? 'user'
                : 'seed';
        const type = raw.type === 'holiday' || raw.type === 'workday' ? raw.type : 'event';
        const allDay = !!raw.allDay;
        return {
            id: String(raw.id || `event-${dateKey}-${Math.random().toString(36).slice(2, 8)}`),
            date: dateKey,
            time: allDay ? '' : (typeof raw.time === 'string' ? raw.time : ''),
            allDay,
            title: String(raw.title || 'Untitled Event'),
            location: String(raw.location || ''),
            icon: String(raw.icon || 'ri-calendar-event-line'),
            source: inferredSource,
            type
        };
    }

    function ensureCalendarState() {
        const todayKey = getTodayKey();
        const defaultMonthKey = monthKeyFromDateKey(todayKey);
        const state = window.iphoneSimState || (window.iphoneSimState = {});
        if (!state.calendarApp || typeof state.calendarApp !== 'object') {
            state.calendarApp = {
                selectedDate: todayKey,
                visibleMonth: defaultMonthKey,
                events: [],
                schedule: {
                    termName: '',
                    termStartDate: '',
                    courses: []
                }
            };
        }

        if (typeof state.calendarApp.demoSeeded !== 'boolean') {
            state.calendarApp.demoSeeded = false;
        }

        if (!parseDateKey(state.calendarApp.selectedDate)) {
            state.calendarApp.selectedDate = todayKey;
        }

        if (!parseMonthKey(state.calendarApp.visibleMonth)) {
            state.calendarApp.visibleMonth = monthKeyFromDateKey(state.calendarApp.selectedDate);
        }

        state.calendarApp.visibleMonth = clampMonthKey(state.calendarApp.visibleMonth);

        if (!isMonthKeyInRange(monthKeyFromDateKey(state.calendarApp.selectedDate))) {
            state.calendarApp.selectedDate = todayKey;
            state.calendarApp.visibleMonth = defaultMonthKey;
        }

        if (monthKeyFromDateKey(state.calendarApp.selectedDate) !== state.calendarApp.visibleMonth) {
            const parsedVisible = parseMonthKey(state.calendarApp.visibleMonth);
            if (parsedVisible) {
                const selected = parseDateKey(state.calendarApp.selectedDate);
                const day = Math.min(selected ? selected.day : 1, daysInMonth(parsedVisible.year, parsedVisible.month));
                state.calendarApp.selectedDate = dateKeyFromParts(parsedVisible.year, parsedVisible.month, day);
            }
        }

        const normalizedEvents = Array.isArray(state.calendarApp.events)
            ? state.calendarApp.events.map(normalizeEvent).filter(Boolean)
            : [];

        state.calendarApp.schedule = normalizeScheduleConfig(state.calendarApp.schedule);

        state.calendarApp.events = normalizedEvents;

        if (!state.calendarApp.demoSeeded && state.calendarApp.events.length === 0) {
            state.calendarApp.events = createSeedEvents(state.calendarApp.selectedDate);
            state.calendarApp.demoSeeded = true;
        }

        return state.calendarApp;
    }

    function saveCalendarState() {
        if (typeof window.saveConfig === 'function') {
            window.saveConfig();
        }
    }

    function formatFullDate(dateKey) {
        const parsed = parseDateKey(dateKey);
        if (!parsed) return '';
        return `${MONTH_LABELS[parsed.month - 1]} ${parsed.day}, ${parsed.year}`;
    }

    function formatDayAccessibilityLabel(dateKey, meta) {
        const parsed = parseDateKey(dateKey);
        if (!parsed) return dateKey;
        const suffix = meta ? `, ${meta.name || meta.label}` : '';
        return `${MONTH_LABELS[parsed.month - 1]} ${parsed.day}, ${parsed.year}${suffix}`;
    }

    function buildVisibleDays(monthKey) {
        const parsed = parseMonthKey(monthKey);
        if (!parsed) return [];
        const firstDay = new Date(parsed.year, parsed.month - 1, 1);
        const startOffset = firstDay.getDay();
        const startDate = new Date(parsed.year, parsed.month - 1, 1 - startOffset);
        const days = [];
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i);
            days.push({
                dateKey: formatDateKey(date),
                dayNumber: date.getDate(),
                inCurrentMonth: date.getMonth() === parsed.month - 1,
                monthKey: monthKeyFromParts(date.getFullYear(), date.getMonth() + 1)
            });
        }
        return days;
    }

    function createDerivedEvents(dateKey) {
        const meta = OFFICIAL_DAY_MAP[dateKey];
        if (!meta) return [];
        if (meta.type === 'workday') {
            return [{
                id: `official-${dateKey}-workday`,
                date: dateKey,
                time: '',
                allDay: true,
                title: TEXT.adjustedWorkday,
                location: TEXT.stateCouncilSchedule,
                icon: 'ri-briefcase-4-line',
                source: 'holiday',
                type: 'workday'
            }];
        }
        return [{
            id: `official-${dateKey}-${meta.label}`,
            date: dateKey,
            time: '',
            allDay: true,
            title: meta.name,
            location: meta.type === 'holiday' ? TEXT.statutoryHoliday : TEXT.adjustedHoliday,
            icon: 'ri-calendar-event-line',
            source: 'holiday',
            type: 'holiday'
        }];
    }

    function getEventsForDate(state, dateKey) {
        const storedEvents = (state.events || []).filter((event) => event.date === dateKey);
        const derived = createDerivedEvents(dateKey);
        const scheduleEvents = getScheduleEventsForDate(state, dateKey);
        return [...derived, ...scheduleEvents, ...storedEvents].sort((a, b) => {
            if (a.allDay && !b.allDay) return -1;
            if (!a.allDay && b.allDay) return 1;
            return String(a.time || '').localeCompare(String(b.time || ''));
        });
    }

    function getStoredEventsForDate(state, dateKey) {
        return (state.events || []).filter((event) => event.date === dateKey && event.type === 'event');
    }

    function getPersonalEventsForDate(state, dateKey) {
        return (state.events || [])
            .filter((event) => event.date === dateKey && event.type === 'event' && event.source === 'user')
            .sort((a, b) => {
                if (a.allDay && !b.allDay) return -1;
                if (!a.allDay && b.allDay) return 1;
                return String(a.time || '').localeCompare(String(b.time || ''));
            })
            .map((event) => ({
                title: String(event.title || ''),
                time: String(event.time || ''),
                location: String(event.location || ''),
                allDay: !!event.allDay
            }));
    }

    function getScheduleMaxWeek(schedule) {
        if (!schedule || !Array.isArray(schedule.courses) || schedule.courses.length === 0) return null;
        let maxWeek = 0;
        schedule.courses.forEach((course) => {
            if (Array.isArray(course.weeks) && course.weeks.length > 0) {
                course.weeks.forEach((week) => {
                    if (Number.isInteger(week) && week > maxWeek) {
                        maxWeek = week;
                    }
                });
                return;
            }
            if (Number.isInteger(course.endWeek) && course.endWeek > maxWeek) {
                maxWeek = course.endWeek;
                return;
            }
            if (Number.isInteger(course.startWeek) && course.startWeek > maxWeek) {
                maxWeek = course.startWeek;
            }
        });
        return maxWeek > 0 ? maxWeek : null;
    }

    function getHolidayInfoForDate(dateKey) {
        const meta = getDateMeta(dateKey);
        if (!meta) return null;
        return {
            type: String(meta.type || ''),
            name: String(meta.name || meta.label || ''),
            label: String(meta.label || meta.name || ''),
            dateKey,
            dateLabel: formatMonthDay(dateKey)
        };
    }

    function getUpcomingHolidayInfo(referenceDateKey, maxDays = 7) {
        for (let offset = 1; offset <= maxDays; offset += 1) {
            const candidateDateKey = shiftDateKey(referenceDateKey, offset);
            const meta = OFFICIAL_DAY_MAP[candidateDateKey];
            if (!meta) continue;
            return {
                type: String(meta.type || ''),
                name: String(meta.name || meta.label || ''),
                label: String(meta.label || meta.name || ''),
                dateKey: candidateDateKey,
                dateLabel: formatMonthDay(candidateDateKey),
                daysAway: offset
            };
        }
        return null;
    }

    function buildWeeklyScheduleForChatContext(referenceDateKey) {
        const state = ensureCalendarState();
        const schedule = normalizeScheduleConfig(state.schedule);
        if (!schedule.termStartDate || !Array.isArray(schedule.courses) || schedule.courses.length === 0) {
            return null;
        }

        const weekNumber = getScheduleWeekNumber(schedule, referenceDateKey);
        const maxWeek = getScheduleMaxWeek(schedule);
        if (!Number.isInteger(weekNumber) || weekNumber < 1 || !Number.isInteger(maxWeek) || weekNumber > maxWeek) {
            return null;
        }

        const weekDates = getWeekDates(referenceDateKey);
        const todayWeekday = getDayOfWeekValue(referenceDateKey);
        const courses = (schedule.courses || [])
            .filter((course) => isCourseInWeek(course, weekNumber))
            .sort((a, b) => {
                if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
            });

        const todayCourses = courses
            .filter((course) => course.dayOfWeek === todayWeekday)
            .map((course) => ({
                title: course.title,
                startTime: course.startTime,
                endTime: course.endTime,
                location: course.location || ''
            }));

        const otherDaySummaries = weekDates.map((dateKey, index) => {
            const dayOfWeek = index + 1;
            if (dayOfWeek === todayWeekday) return null;
            const dayCourses = courses.filter((course) => course.dayOfWeek === dayOfWeek);
            if (dayCourses.length === 0) return null;
            return {
                dayOfWeek,
                dayLabel: SCHEDULE_DAY_LABELS[index],
                dateKey,
                dateLabel: formatMonthDay(dateKey),
                courseCount: dayCourses.length,
                courseTitles: dayCourses.map((course) => course.title),
                courses: dayCourses.map((course) => ({
                    title: course.title,
                    startTime: course.startTime,
                    endTime: course.endTime,
                    location: course.location || ''
                }))
            };
        }).filter(Boolean);

        return {
            termName: schedule.termName || '',
            weekNumber,
            weekRangeLabel: `${formatMonthDay(weekDates[0])} - ${formatMonthDay(weekDates[6])}`,
            todayCourses,
            otherDaySummaries
        };
    }

    function buildCalendarChatContext(referenceDateKey) {
        const state = ensureCalendarState();
        const todayDateKey = parseDateKey(referenceDateKey) ? referenceDateKey : getTodayKey();
        return {
            todayDateKey,
            todayDateLabel: formatMonthDay(todayDateKey),
            todayPersonalEvents: getPersonalEventsForDate(state, todayDateKey),
            todayHoliday: getHolidayInfoForDate(todayDateKey),
            upcomingHoliday: getUpcomingHolidayInfo(todayDateKey, 7),
            weeklySchedule: buildWeeklyScheduleForChatContext(todayDateKey)
        };
    }

    function isEditableEvent(event) {
        return !!event && event.type === 'event';
    }

    function countVisibleEventDots(state, dateKey) {
        const totalCount = getStoredEventsForDate(state, dateKey).length + getScheduleEventsForDate(state, dateKey).length;
        return Math.min(3, totalCount);
    }

    function createDayDotsHtml(count) {
        if (!count) {
            return '<span class="calendar-v1-day-dots placeholder"><span class="calendar-v1-day-dot"></span></span>';
        }
        return `<span class="calendar-v1-day-dots">${Array.from({ length: count }, () => '<span class="calendar-v1-day-dot"></span>').join('')}</span>`;
    }

    function buildEventDraft(dateKey, event) {
        return {
            id: event && event.id ? String(event.id) : '',
            date: parseDateKey(dateKey) ? dateKey : getTodayKey(),
            title: event && event.title ? String(event.title) : '',
            location: event && event.location ? String(event.location) : '',
            allDay: !!(event && event.allDay),
            time: event && typeof event.time === 'string' && event.time ? event.time : '09:00',
            icon: event && event.icon ? String(event.icon) : 'ri-calendar-event-line',
            source: event && event.source === 'seed' ? 'seed' : 'user'
        };
    }

    function normalizeScheduleCourse(raw, index = 0) {
        if (!raw || typeof raw !== 'object') return null;
        const title = String(raw.title || raw.name || '').trim();
        const location = String(raw.location || raw.room || raw.note || '').trim();
        const dayOfWeek = Number(raw.dayOfWeek || raw.weekday || raw.day);
        const startTime = String(raw.startTime || '').trim();
        const endTime = String(raw.endTime || '').trim();
        const startWeek = Number(raw.startWeek);
        const endWeek = Number(raw.endWeek);
        const weekValue = Number(raw.week);
        const weeks = Array.isArray(raw.weeks)
            ? Array.from(new Set(raw.weeks.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item > 0))).sort((a, b) => a - b)
            : (Number.isInteger(weekValue) && weekValue > 0 ? [weekValue] : []);
        const color = SCHEDULE_COLOR_OPTIONS.includes(String(raw.color || '').trim())
            ? String(raw.color || '').trim()
            : SCHEDULE_COLOR_OPTIONS[index % SCHEDULE_COLOR_OPTIONS.length];

        if (!title) return null;
        if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) return null;
        if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) return null;
        if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) return null;
        if (weeks.length === 0 && (!Number.isInteger(startWeek) || !Number.isInteger(endWeek) || startWeek <= 0 || endWeek < startWeek)) return null;

        return {
            id: String(raw.id || `course-${index + 1}`),
            title,
            location,
            dayOfWeek,
            startTime,
            endTime,
            startWeek: weeks.length ? null : startWeek,
            endWeek: weeks.length ? null : endWeek,
            weeks,
            color
        };
    }

    function normalizeScheduleConfig(raw) {
        const src = raw && typeof raw === 'object' ? raw : {};
        const termStartDate = parseDateKey(src.termStartDate) ? String(src.termStartDate) : '';
        const termName = String(src.termName || '').trim();
        const courses = Array.isArray(src.courses)
            ? src.courses.map((course, index) => normalizeScheduleCourse(course, index)).filter(Boolean)
            : [];
        return {
            termName,
            termStartDate,
            courses
        };
    }

    function parseTimeToMinutes(time) {
        const match = /^(\d{2}):(\d{2})$/.exec(String(time || ''));
        if (!match) return null;
        const hour = Number(match[1]);
        const minute = Number(match[2]);
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
        return hour * 60 + minute;
    }

    function shiftDateKey(dateKey, deltaDays) {
        const parsed = parseDateKey(dateKey);
        if (!parsed) return getTodayKey();
        const shifted = new Date(parsed.year, parsed.month - 1, parsed.day + Number(deltaDays || 0));
        return formatDateKey(shifted);
    }

    function getWeekStartDate(dateKey) {
        const parsed = parseDateKey(dateKey);
        if (!parsed) return new Date();
        const date = new Date(parsed.year, parsed.month - 1, parsed.day);
        const day = date.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        date.setDate(date.getDate() + diff);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    function getWeekDates(dateKey) {
        const start = getWeekStartDate(dateKey);
        return Array.from({ length: 7 }, (_, index) => {
            const current = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
            return formatDateKey(current);
        });
    }

    function formatMonthDay(dateKey) {
        const parsed = parseDateKey(dateKey);
        if (!parsed) return '';
        return `${parsed.month}/${parsed.day}`;
    }

    function getScheduleWeekNumber(schedule, dateKey) {
        if (!schedule || !parseDateKey(schedule.termStartDate)) return null;
        const target = parseDateKey(dateKey);
        const start = parseDateKey(schedule.termStartDate);
        if (!target || !start) return null;
        const startDate = getWeekStartDate(schedule.termStartDate);
        const targetDate = getWeekStartDate(dateKey);
        const diffDays = Math.round((targetDate.getTime() - startDate.getTime()) / 86400000);
        return Math.floor(diffDays / 7) + 1;
    }

    function isCourseInWeek(course, weekNumber) {
        if (!course || !Number.isInteger(weekNumber) || weekNumber < 1) return false;
        if (Array.isArray(course.weeks) && course.weeks.length > 0) {
            return course.weeks.includes(weekNumber);
        }
        return Number.isInteger(course.startWeek) && Number.isInteger(course.endWeek)
            ? weekNumber >= course.startWeek && weekNumber <= course.endWeek
            : false;
    }

    function getCoursesForWeek(schedule, dateKey) {
        const weekNumber = getScheduleWeekNumber(schedule, dateKey);
        if (!schedule || !Array.isArray(schedule.courses) || !Number.isInteger(weekNumber) || weekNumber < 1) {
            return { weekNumber: null, courses: [] };
        }
        const courses = schedule.courses
            .filter((course) => isCourseInWeek(course, weekNumber))
            .sort((a, b) => {
                if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
                return parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime);
            });
        return { weekNumber, courses };
    }

    function getDayOfWeekValue(dateKey) {
        const parsed = parseDateKey(dateKey);
        if (!parsed) return null;
        const nativeDay = parsed.date.getDay();
        return nativeDay === 0 ? 7 : nativeDay;
    }

    function getScheduleEventsForDate(state, dateKey) {
        const schedule = normalizeScheduleConfig(state && state.schedule);
        const weekday = getDayOfWeekValue(dateKey);
        const weekNumber = getScheduleWeekNumber(schedule, dateKey);
        if (!weekday || !Number.isInteger(weekNumber) || weekNumber < 1) return [];
        return (schedule.courses || [])
            .filter((course) => course.dayOfWeek === weekday && isCourseInWeek(course, weekNumber))
            .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime))
            .map((course) => ({
                id: `schedule-${dateKey}-${course.id}-${weekNumber}`,
                date: dateKey,
                time: course.startTime,
                allDay: false,
                title: course.title,
                location: course.location || '上课地点待定',
                icon: 'ri-book-open-line',
                source: 'schedule',
                type: 'schedule',
                endTime: course.endTime
            }));
    }

    function getSchedulePeriods(courses) {
        const periodMap = new Map();
        (Array.isArray(courses) ? courses : []).forEach((course) => {
            const startTime = String(course && course.startTime || '').trim();
            const endTime = String(course && course.endTime || '').trim();
            const startMinutes = parseTimeToMinutes(startTime);
            const endMinutes = parseTimeToMinutes(endTime);
            if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
                return;
            }
            const key = `${startTime}-${endTime}`;
            if (!periodMap.has(key)) {
                periodMap.set(key, {
                    key,
                    startTime,
                    endTime,
                    startMinutes,
                    endMinutes
                });
            }
        });

        const allPeriods = Array.from(periodMap.values())
            .sort((a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes);

        const basePeriods = allPeriods.filter((period) => {
            const hasEarlierPart = allPeriods.some((other) => (
                other.key !== period.key
                && other.startMinutes === period.startMinutes
                && other.endMinutes < period.endMinutes
            ));
            const hasLaterPart = allPeriods.some((other) => (
                other.key !== period.key
                && other.endMinutes === period.endMinutes
                && other.startMinutes > period.startMinutes
            ));
            return !(hasEarlierPart && hasLaterPart);
        });

        return basePeriods.map((period, index) => ({
            ...period,
            index: index + 1
        }));
    }

    function getCoursePeriodPlacement(course, periods) {
        const validPeriods = Array.isArray(periods) ? periods : [];
        if (!course || validPeriods.length === 0) return null;

        const exactKey = `${course.startTime}-${course.endTime}`;
        const exactIndex = validPeriods.findIndex((period) => period.key === exactKey);
        if (exactIndex >= 0) {
            return { startIndex: exactIndex, span: 1 };
        }

        const startIndex = validPeriods.findIndex((period) => period.startTime === course.startTime);
        let endIndex = -1;
        for (let index = validPeriods.length - 1; index >= 0; index -= 1) {
            if (validPeriods[index].endTime === course.endTime) {
                endIndex = index;
                break;
            }
        }
        if (startIndex >= 0 && endIndex >= startIndex) {
            return {
                startIndex,
                span: endIndex - startIndex + 1
            };
        }

        const courseStart = parseTimeToMinutes(course.startTime);
        const courseEnd = parseTimeToMinutes(course.endTime);
        if (!Number.isFinite(courseStart) || !Number.isFinite(courseEnd)) return null;

        const overlappedRows = validPeriods
            .map((period, index) => ({ period, index }))
            .filter(({ period }) => period.startMinutes < courseEnd && period.endMinutes > courseStart)
            .map(({ index }) => index);

        if (!overlappedRows.length) return null;

        return {
            startIndex: overlappedRows[0],
            span: overlappedRows[overlappedRows.length - 1] - overlappedRows[0] + 1
        };
    }

    function getEmptySchedulePeriods(count = 6) {
        return Array.from({ length: count }, (_, index) => ({
            key: `placeholder-${index + 1}`,
            startTime: '',
            endTime: '',
            placeholder: true,
            index: index + 1
        }));
    }

    function createStoredEventFromDraft(draft) {
        return normalizeEvent({
            id: draft.id || `user-${draft.date}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
            date: draft.date,
            time: draft.allDay ? '' : draft.time,
            allDay: draft.allDay,
            title: draft.title,
            location: draft.location,
            icon: draft.icon || 'ri-calendar-event-line',
            source: draft.source === 'seed' ? 'seed' : 'user',
            type: 'event'
        });
    }

    function formatEventTime(time) {
        if (!time) return { main: 'All Day', suffix: '' };
        const hour = Number(String(time).split(':')[0]);
        return {
            main: time,
            suffix: Number.isFinite(hour) && hour < 12 ? 'AM' : 'PM'
        };
    }

    function getEventBorderColor(event) {
        if (event.type === 'holiday') return '#8faac7';
        if (event.type === 'workday') return '#b9cade';
        if (event.type === 'schedule' || event.source === 'schedule') return '#8abf9a';
        if (event.title === 'Project Sync') return '#d1e2f3';
        if (event.title === 'Gym Session') return '#e0e0e0';
        return '#a3c2de';
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function createEventCardHtml(event) {
        const timeInfo = formatEventTime(event.time);
        const timeClass = event.allDay ? 'calendar-v1-event-time is-all-day' : 'calendar-v1-event-time';
        const editableClass = isEditableEvent(event) ? 'editable' : 'readonly';
        const eventIdAttr = isEditableEvent(event) ? ` data-event-id="${escapeHtml(event.id)}"` : '';
        return `
            <div class="calendar-v1-event-item ${editableClass}"${eventIdAttr}>
                <div class="${timeClass}">${escapeHtml(timeInfo.main)}${timeInfo.suffix ? `<br>${escapeHtml(timeInfo.suffix)}` : ''}</div>
                <div class="calendar-v1-event-details" style="border-left-color: ${getEventBorderColor(event)};">
                    <div class="calendar-v1-event-title">${escapeHtml(event.title)}</div>
                    <div class="calendar-v1-event-loc"><i class="${escapeHtml(event.icon)}"></i> ${escapeHtml(event.location || 'No location')}</div>
                </div>
            </div>
        `;
    }

    function initCalendarApp() {
        const calendarApp = document.getElementById('calendar-app');
        if (!calendarApp || calendarApp.dataset.initialized === 'true') {
            return;
        }

        calendarApp.dataset.initialized = 'true';

        const navItems = Array.from(calendarApp.querySelectorAll('.calendar-v1-nav-item'));
        const views = Array.from(calendarApp.querySelectorAll('.calendar-v1-view'));
        const titleEl = document.getElementById('calendar-v1-page-title');
        const subtitleEl = document.getElementById('calendar-v1-page-subtitle');
        const backBtn = document.getElementById('calendar-v1-back-btn');
        const dateTrigger = document.getElementById('calendar-v1-date-trigger');
        const monthCard = document.getElementById('calendar-v1-month-card');
        const daysContainer = document.getElementById('calendar-v1-days');
        const upcomingList = document.getElementById('calendar-v1-upcoming-list');
        const eventAddBtn = document.getElementById('calendar-v1-event-add-btn');
        const monthSheet = document.getElementById('calendar-v1-month-sheet');
        const monthSheetBackdrop = document.getElementById('calendar-v1-month-sheet-backdrop');
        const monthSheetYear = document.getElementById('calendar-v1-month-sheet-year');
        const monthSheetGrid = document.getElementById('calendar-v1-month-sheet-grid');
        const prevYearBtn = document.getElementById('calendar-v1-month-prev-year');
        const nextYearBtn = document.getElementById('calendar-v1-month-next-year');
        const todayBtn = document.getElementById('calendar-v1-month-back-today');
        const cancelBtn = document.getElementById('calendar-v1-month-sheet-cancel');
        const eventSheet = document.getElementById('calendar-v1-event-sheet');
        const eventSheetBackdrop = document.getElementById('calendar-v1-event-sheet-backdrop');
        const eventSheetTitle = document.getElementById('calendar-v1-event-sheet-title');
        const eventSheetSubtitle = document.getElementById('calendar-v1-event-sheet-subtitle');
        const eventSheetCloseBtn = document.getElementById('calendar-v1-event-sheet-close');
        const eventForm = document.getElementById('calendar-v1-event-form');
        const eventTitleInput = document.getElementById('calendar-v1-event-title-input');
        const eventLocationInput = document.getElementById('calendar-v1-event-location-input');
        const eventAllDayInput = document.getElementById('calendar-v1-event-all-day-input');
        const eventTimeField = document.getElementById('calendar-v1-event-time-field');
        const eventTimeInput = document.getElementById('calendar-v1-event-time-input');
        const eventFormError = document.getElementById('calendar-v1-event-form-error');
        const eventDeleteBtn = document.getElementById('calendar-v1-event-delete-btn');
        const eventCancelBtn = document.getElementById('calendar-v1-event-cancel-btn');
        const headerActionBtn = document.getElementById('calendar-v1-header-action-btn');
        const headerActionIcon = document.getElementById('calendar-v1-header-action-icon');
        const scheduleImportInput = document.getElementById('calendar-v1-schedule-import-input');
        const scheduleWeekLabel = document.getElementById('calendar-v1-schedule-week-label');
        const schedulePrevWeekBtn = document.getElementById('calendar-v1-schedule-prev-week');
        const scheduleNextWeekBtn = document.getElementById('calendar-v1-schedule-next-week');
        const scheduleMeta = document.getElementById('calendar-v1-schedule-meta');
        const timetableDays = document.getElementById('calendar-v1-tt-days');
        const timetableTimes = document.getElementById('calendar-v1-tt-times');
        const timetableGrid = document.getElementById('calendar-v1-tt-grid');
        const timetableWrapper = calendarApp.querySelector('.calendar-v1-tt-wrapper');
        const courseSheet = document.getElementById('calendar-v1-course-sheet');
        const courseSheetBackdrop = document.getElementById('calendar-v1-course-sheet-backdrop');
        const courseSheetTitle = document.getElementById('calendar-v1-course-sheet-title');
        const courseSheetSubtitle = document.getElementById('calendar-v1-course-sheet-subtitle');
        const courseSheetBody = document.getElementById('calendar-v1-course-sheet-body');
        const courseSheetCloseBtn = document.getElementById('calendar-v1-course-sheet-close');

        let activeViewId = CALENDAR_VIEW_ID;
        let pickerYear = 2026;
        let headerTimer = null;
        let touchGesture = null;
        let activeEventDraft = null;
        let activeScheduleCourse = null;
        let renderedScheduleCourseMap = new Map();

        function blurIfFocusedWithin(container) {
            const activeElement = document.activeElement;
            if (container && activeElement && container.contains(activeElement) && typeof activeElement.blur === 'function') {
                activeElement.blur();
            }
        }

        function formatCourseWeekHint(course) {
            if (!course) return '';
            return Array.isArray(course.weeks) && course.weeks.length > 0
                ? `第 ${course.weeks.join('、')} 周`
                : `第 ${course.startWeek}-${course.endWeek} 周`;
        }

        function renderCourseSheet() {
            if (!activeScheduleCourse || !courseSheetBody) return;
            if (courseSheetTitle) {
                courseSheetTitle.textContent = activeScheduleCourse.title || '课程详情';
            }
            if (courseSheetSubtitle) {
                courseSheetSubtitle.textContent = `${SCHEDULE_DAY_LABELS[(activeScheduleCourse.dayOfWeek || 1) - 1] || '本周课程'} · ${activeScheduleCourse.dateLabel || ''}`;
            }
            courseSheetBody.innerHTML = `
                <div class="calendar-v1-course-detail-row">
                    <div class="calendar-v1-course-detail-label">地点</div>
                    <div class="calendar-v1-course-detail-value">${escapeHtml(activeScheduleCourse.location || '地点待定')}</div>
                </div>
                <div class="calendar-v1-course-detail-row">
                    <div class="calendar-v1-course-detail-label">时间</div>
                    <div class="calendar-v1-course-detail-value">${escapeHtml(activeScheduleCourse.startTime)} - ${escapeHtml(activeScheduleCourse.endTime)}</div>
                </div>
                <div class="calendar-v1-course-detail-row">
                    <div class="calendar-v1-course-detail-label">上课周次</div>
                    <div class="calendar-v1-course-detail-value">${escapeHtml(formatCourseWeekHint(activeScheduleCourse))}</div>
                </div>
                <div class="calendar-v1-course-detail-row">
                    <div class="calendar-v1-course-detail-label">当前周</div>
                    <div class="calendar-v1-course-detail-value">第 ${escapeHtml(String(activeScheduleCourse.weekNumber || ''))} 周</div>
                </div>
            `;
        }

        function openCourseSheet(course) {
            if (!course) return;
            closeMonthSheet();
            closeEventSheet();
            activeScheduleCourse = course;
            renderCourseSheet();
            if (courseSheet) {
                courseSheet.classList.add('is-open');
                courseSheet.setAttribute('aria-hidden', 'false');
            }
        }

        function closeCourseSheet() {
            blurIfFocusedWithin(courseSheet);
            if (courseSheet) {
                courseSheet.classList.remove('is-open');
                courseSheet.setAttribute('aria-hidden', 'true');
            }
            if (courseSheetBody) courseSheetBody.innerHTML = '';
            activeScheduleCourse = null;
        }

        function renderEventSheet() {
            if (!activeEventDraft) return;
            if (eventSheetTitle) {
                eventSheetTitle.textContent = activeEventDraft.id ? '改改安排' : '新建安排';
            }
            if (eventSheetSubtitle) {
                eventSheetSubtitle.textContent = formatFullDate(activeEventDraft.date);
            }
            if (eventTitleInput) eventTitleInput.value = activeEventDraft.title || '';
            if (eventLocationInput) eventLocationInput.value = activeEventDraft.location || '';
            if (eventAllDayInput) eventAllDayInput.checked = !!activeEventDraft.allDay;
            if (eventTimeInput) eventTimeInput.value = activeEventDraft.allDay ? '' : (activeEventDraft.time || '09:00');
            if (eventTimeField) {
                eventTimeField.classList.toggle('is-hidden', !!activeEventDraft.allDay);
            }
            if (eventDeleteBtn) {
                eventDeleteBtn.style.display = activeEventDraft.id ? '' : 'none';
            }
            if (eventFormError) {
                eventFormError.textContent = '';
            }
        }

        function openEventSheet(dateKey, event) {
            closeMonthSheet();
            const state = ensureCalendarState();
            activeEventDraft = buildEventDraft(dateKey || state.selectedDate, event || null);
            renderEventSheet();
            if (eventSheet) {
                eventSheet.classList.add('is-open');
                eventSheet.setAttribute('aria-hidden', 'false');
            }
            window.setTimeout(() => {
                if (eventTitleInput) eventTitleInput.focus();
            }, 50);
        }

        function closeEventSheet() {
            blurIfFocusedWithin(eventSheet);
            if (eventSheet) {
                eventSheet.classList.remove('is-open');
                eventSheet.setAttribute('aria-hidden', 'true');
            }
            if (eventForm) eventForm.reset();
            if (eventTimeField) eventTimeField.classList.remove('is-hidden');
            if (eventFormError) eventFormError.textContent = '';
            if (eventDeleteBtn) eventDeleteBtn.style.display = 'none';
            activeEventDraft = null;
        }

        function upsertStoredEvent(event) {
            const state = ensureCalendarState();
            const nextEvent = normalizeEvent(event);
            if (!nextEvent) return;
            const index = state.events.findIndex((item) => item.id === nextEvent.id);
            if (index >= 0) {
                state.events[index] = nextEvent;
            } else {
                state.events.push(nextEvent);
            }
            state.demoSeeded = true;
            saveCalendarState();
        }

        function deleteStoredEvent(eventId) {
            if (!eventId) return;
            const state = ensureCalendarState();
            state.events = (state.events || []).filter((item) => item.id !== eventId);
            state.demoSeeded = true;
            saveCalendarState();
        }

        function showCalendarNotice(message) {
            if (typeof window.showChatToast === 'function') {
                window.showChatToast(message, 2200);
                return;
            }
            window.alert(message);
        }

        function renderHeaderAction() {
            if (!headerActionBtn || !headerActionIcon) return;
            const isScheduleView = activeViewId === SCHEDULE_VIEW_ID;
            headerActionBtn.classList.remove('is-import-mode');
            headerActionBtn.setAttribute('aria-label', isScheduleView ? '导入课表 JSON' : '日历小助手');
            headerActionBtn.title = isScheduleView ? '导入课表 JSON' : '日历小助手';
            headerActionIcon.className = 'ri-user-smile-line';
        }

        function applyScheduleTransition(direction) {
            if (!direction) return;
            const className = direction === 'next'
                ? 'calendar-v1-schedule-slide-next'
                : direction === 'prev'
                    ? 'calendar-v1-schedule-slide-prev'
                    : '';
            if (!className) return;
            [scheduleWeekLabel, scheduleMeta, timetableWrapper].forEach((node) => {
                if (!node) return;
                node.classList.remove('calendar-v1-schedule-slide-next', 'calendar-v1-schedule-slide-prev');
                void node.offsetWidth;
                node.classList.add(className);
                window.setTimeout(() => {
                    node.classList.remove(className);
                }, 280);
            });
        }

        function renderScheduleView(transitionDirection = '') {
            const state = ensureCalendarState();
            const schedule = normalizeScheduleConfig(state.schedule);
            const weekDates = getWeekDates(state.selectedDate);
            const selectedWeekdayIndex = weekDates.indexOf(state.selectedDate);
            const { weekNumber, courses } = getCoursesForWeek(schedule, state.selectedDate);
            const activeWeekNumber = Number.isInteger(weekNumber) && weekNumber > 0 ? weekNumber : null;
            const schedulePeriods = getSchedulePeriods(schedule.courses);
            const displayPeriods = schedulePeriods.length ? schedulePeriods : getEmptySchedulePeriods();
            renderedScheduleCourseMap = new Map();

            if (timetableWrapper) {
                timetableWrapper.style.setProperty('--calendar-v1-tt-row-count', String(displayPeriods.length || 1));
            }

            renderHeader(false);
            renderHeaderAction();

            if (scheduleWeekLabel) {
                scheduleWeekLabel.textContent = activeWeekNumber ? `第 ${activeWeekNumber} 周` : '课表未就绪';
            }

            if (scheduleMeta) {
                if (!schedule.termStartDate || schedule.courses.length === 0) {
                    scheduleMeta.textContent = '还没导入课表哦，点右上角按钮把 JSON 课表塞进来吧～';
                } else if (!activeWeekNumber || activeWeekNumber < 1) {
                    scheduleMeta.textContent = `${schedule.termName || '这学期'} 还没开始呢，先等等呀～`;
                } else {
                    scheduleMeta.textContent = `${schedule.termName || '这学期'} · ${formatMonthDay(weekDates[0])} - ${formatMonthDay(weekDates[6])} · 本周 ${courses.length} 节课`;
                }
            }

            if (timetableDays) {
                timetableDays.innerHTML = weekDates.map((dateKey, index) => {
                    const classes = ['calendar-v1-tt-day'];
                    if (index === selectedWeekdayIndex) classes.push('active');
                    return `
                        <div class="${classes.join(' ')}">
                            <span class="calendar-v1-tt-day-label">${SCHEDULE_DAY_LABELS[index]}</span>
                            <span class="calendar-v1-tt-day-date">${escapeHtml(formatMonthDay(dateKey))}</span>
                        </div>
                    `;
                }).join('');
            }

            if (timetableTimes) {
                timetableTimes.innerHTML = displayPeriods.map((period) => {
                    const orderText = period.placeholder ? '' : String(period.index).padStart(2, '0');
                    const classes = ['calendar-v1-tt-time'];
                    if (period.placeholder) classes.push('is-placeholder');
                    return `
                        <div class="${classes.join(' ')}">
                            <span class="calendar-v1-tt-time-order">${escapeHtml(orderText)}</span>
                            <div class="calendar-v1-tt-time-main">
                                <span class="calendar-v1-tt-time-start">${escapeHtml(period.startTime || '')}</span>
                                <span class="calendar-v1-tt-time-end">${escapeHtml(period.endTime || '')}</span>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            if (timetableGrid) {
                const courseHtmlByDay = Array.from({ length: 7 }, () => []);
                courses.forEach((course) => {
                    const dayIndex = course.dayOfWeek - 1;
                    const placement = getCoursePeriodPlacement(course, displayPeriods);
                    if (dayIndex < 0 || dayIndex > 6 || !placement) return;
                    const detailKey = `${course.id}-${activeWeekNumber || 0}-${dayIndex}`;
                    renderedScheduleCourseMap.set(detailKey, {
                        ...course,
                        weekNumber: activeWeekNumber,
                        dateKey: weekDates[dayIndex],
                        dateLabel: formatMonthDay(weekDates[dayIndex])
                    });
                    courseHtmlByDay[dayIndex].push(`
                        <div class="calendar-v1-tt-course ${escapeHtml(course.color)}" data-course-key="${escapeHtml(detailKey)}" style="grid-row: ${placement.startIndex + 1} / span ${placement.span};">
                            <div class="calendar-v1-tt-c-title">${escapeHtml(course.title)}</div>
                            <div class="calendar-v1-tt-c-loc"><span class="calendar-v1-tt-c-loc-text">${escapeHtml(course.location || '地点待定')}</span></div>
                        </div>
                    `);
                });

                timetableGrid.innerHTML = courseHtmlByDay.map((items, dayIndex) => {
                    const colClasses = ['calendar-v1-tt-col'];
                    if (dayIndex === selectedWeekdayIndex) colClasses.push('active');
                    return `
                    <div class="${colClasses.join(' ')}">${displayPeriods.map((period) => {
                        const slotClasses = ['calendar-v1-tt-slot'];
                        if (dayIndex === selectedWeekdayIndex) slotClasses.push('active');
                        if (period.placeholder) slotClasses.push('is-placeholder');
                        return `<div class="${slotClasses.join(' ')}"></div>`;
                    }).join('')}${items.join('')}</div>
                `;
                }).join('');
            }

            applyScheduleTransition(transitionDirection);
        }

        function importScheduleFromObject(rawConfig) {
            const normalized = normalizeScheduleConfig(rawConfig);
            if (!normalized.termStartDate) {
                throw new Error('缺少有效的 termStartDate');
            }
            if (!normalized.courses.length) {
                throw new Error('courses 不能为空');
            }
            const state = ensureCalendarState();
            state.schedule = normalized;
            saveCalendarState();
            renderScheduleView();
        }

        function renderHeader(animate) {
            const state = ensureCalendarState();
            const parsedVisibleMonth = parseMonthKey(state.visibleMonth);
            const scheduleWeekNumber = getScheduleWeekNumber(state.schedule, state.selectedDate);
            const nextTitle = activeViewId === SCHEDULE_VIEW_ID
                ? 'Schedule'
                : MONTH_LABELS[(parsedVisibleMonth ? parsedVisibleMonth.month : 1) - 1];
            const nextSubtitle = activeViewId === SCHEDULE_VIEW_ID
                ? (Number.isInteger(scheduleWeekNumber) && scheduleWeekNumber > 0
                    ? `第 ${scheduleWeekNumber} 周课表`
                    : '导入课表后这里会动起来哦～')
                : formatFullDate(state.selectedDate);

            if (dateTrigger) {
                dateTrigger.disabled = activeViewId !== CALENDAR_VIEW_ID;
            }

            renderHeaderAction();

            if (!titleEl || !subtitleEl) return;

            if (!animate) {
                titleEl.textContent = nextTitle;
                subtitleEl.textContent = nextSubtitle;
                titleEl.style.opacity = '1';
                subtitleEl.style.opacity = '1';
                return;
            }

            titleEl.style.opacity = '0';
            subtitleEl.style.opacity = '0';
            if (headerTimer) window.clearTimeout(headerTimer);
            headerTimer = window.setTimeout(() => {
                titleEl.textContent = nextTitle;
                subtitleEl.textContent = nextSubtitle;
                titleEl.style.opacity = '1';
                subtitleEl.style.opacity = '1';
            }, 180);
        }

        function renderMonthSheet() {
            if (!monthSheetYear || !monthSheetGrid) return;
            const state = ensureCalendarState();
            const visibleMonth = parseMonthKey(state.visibleMonth);
            const todayMonth = parseMonthKey(monthKeyFromDateKey(getTodayKey()));

            monthSheetYear.textContent = String(pickerYear);
            if (prevYearBtn) prevYearBtn.disabled = pickerYear <= MIN_YEAR;
            if (nextYearBtn) nextYearBtn.disabled = pickerYear >= MAX_YEAR;

            monthSheetGrid.innerHTML = MONTH_SHORT_LABELS.map((label, index) => {
                const month = index + 1;
                const monthKey = monthKeyFromParts(pickerYear, month);
                const isActive = visibleMonth && visibleMonth.year === pickerYear && visibleMonth.month === month;
                const isTodayMonth = todayMonth && todayMonth.year === pickerYear && todayMonth.month === month;
                const classes = ['calendar-v1-month-sheet-month'];
                if (isActive) classes.push('active');
                if (isTodayMonth) classes.push('today');
                return `<button class="${classes.join(' ')}" type="button" data-month="${month}" ${isMonthKeyInRange(monthKey) ? '' : 'disabled'}>${label}</button>`;
            }).join('');
        }

        function openMonthSheet() {
            closeEventSheet();
            const state = ensureCalendarState();
            const visibleMonth = parseMonthKey(state.visibleMonth);
            pickerYear = visibleMonth ? visibleMonth.year : MIN_YEAR;
            renderMonthSheet();
            if (monthSheet) {
                monthSheet.classList.add('is-open');
                monthSheet.setAttribute('aria-hidden', 'false');
            }
        }

        function closeMonthSheet() {
            blurIfFocusedWithin(monthSheet);
            if (monthSheet) {
                monthSheet.classList.remove('is-open');
                monthSheet.setAttribute('aria-hidden', 'true');
            }
        }

        function syncCalendarState(nextDateKey, shouldSave, options = {}) {
            const state = ensureCalendarState();
            state.selectedDate = nextDateKey;
            state.visibleMonth = monthKeyFromDateKey(nextDateKey);
            if (activeViewId === SCHEDULE_VIEW_ID) {
                renderScheduleView(options.scheduleTransitionDirection || '');
            } else {
                renderCalendarView(false);
            }
            if (shouldSave) saveCalendarState();
        }

        function jumpToMonth(targetMonthKey) {
            const state = ensureCalendarState();
            const clampedMonthKey = clampMonthKey(targetMonthKey);
            const parsedTarget = parseMonthKey(clampedMonthKey);
            if (!parsedTarget) return;

            const todayKey = getTodayKey();
            const todayMonthKey = monthKeyFromDateKey(todayKey);
            const selected = parseDateKey(state.selectedDate);
            let nextDateKey;

            if (clampedMonthKey === todayMonthKey) {
                nextDateKey = todayKey;
            } else {
                const desiredDay = selected ? selected.day : 1;
                const day = Math.min(desiredDay, daysInMonth(parsedTarget.year, parsedTarget.month));
                nextDateKey = dateKeyFromParts(parsedTarget.year, parsedTarget.month, day);
            }

            syncCalendarState(nextDateKey, true);
        }

        function goToToday() {
            syncCalendarState(getTodayKey(), true);
            closeMonthSheet();
        }

        function renderCalendarGrid() {
            if (!daysContainer) return;
            const state = ensureCalendarState();
            const todayKey = getTodayKey();
            const days = buildVisibleDays(state.visibleMonth);

            daysContainer.innerHTML = days.map((item) => {
                const meta = getDateMeta(item.dateKey);
                const dotCount = countVisibleEventDots(state, item.dateKey);
                const isSelected = item.dateKey === state.selectedDate;
                const isToday = item.dateKey === todayKey;
                const isInRange = isMonthKeyInRange(item.monthKey);
                const classes = ['calendar-v1-day'];
                if (!item.inCurrentMonth) classes.push('muted');
                if (isSelected) classes.push('selected');
                if (isToday) classes.push('today');
                if (!isInRange) classes.push('out-of-range');
                const metaClass = meta ? meta.type : 'placeholder';
                const metaText = meta ? escapeHtml(meta.label) : '&nbsp;';
                return `
                    <button class="${classes.join(' ')}" type="button" data-date="${item.dateKey}" ${isInRange ? '' : 'disabled'} aria-label="${escapeHtml(formatDayAccessibilityLabel(item.dateKey, meta))}">
                        <span class="calendar-v1-day-number">${item.dayNumber}</span>
                        <span class="calendar-v1-day-meta ${metaClass}">${metaText}</span>
                        ${createDayDotsHtml(dotCount)}
                    </button>
                `;
            }).join('');
        }

        function renderUpcoming() {
            if (!upcomingList) return;
            const state = ensureCalendarState();
            const events = getEventsForDate(state, state.selectedDate);
            if (!events.length) {
                upcomingList.innerHTML = `<div class="calendar-v1-empty-state">No events for ${escapeHtml(formatFullDate(state.selectedDate))}.</div>`;
                return;
            }
            upcomingList.innerHTML = events.map(createEventCardHtml).join('');
        }

        function renderCalendarView(animateHeader) {
            renderHeader(animateHeader);
            if (activeViewId !== CALENDAR_VIEW_ID) return;
            renderCalendarGrid();
            renderUpcoming();
            renderMonthSheet();
        }

        function switchView(targetId, animateHeader) {
            activeViewId = targetId;
            navItems.forEach((item) => {
                item.classList.toggle('active', item.dataset.target === targetId);
            });
            views.forEach((view) => {
                if (view.id === targetId) {
                    view.classList.remove('prev');
                    view.classList.add('active');
                    view.style.transform = 'translateX(0)';
                    return;
                }
                view.classList.remove('active');
                if (targetId === SCHEDULE_VIEW_ID && view.id === CALENDAR_VIEW_ID) {
                    view.classList.add('prev');
                    view.style.transform = 'translateX(-50px)';
                } else if (targetId === CALENDAR_VIEW_ID && view.id === SCHEDULE_VIEW_ID) {
                    view.classList.remove('prev');
                    view.style.transform = 'translateX(50px)';
                }
            });
            if (targetId !== CALENDAR_VIEW_ID) {
                closeMonthSheet();
                closeEventSheet();
            } else {
                closeCourseSheet();
            }
            renderHeader(animateHeader);
            if (targetId === CALENDAR_VIEW_ID) {
                renderCalendarGrid();
                renderUpcoming();
            } else if (targetId === SCHEDULE_VIEW_ID) {
                renderScheduleView();
            }
        }

        navItems.forEach((item) => {
            item.addEventListener('click', () => {
                const targetId = item.dataset.target;
                if (targetId) {
                    switchView(targetId, true);
                }
            });
        });

        if (backBtn) {
            backBtn.addEventListener('click', () => {
                closeMonthSheet();
                closeEventSheet();
                closeCourseSheet();
                calendarApp.classList.add('hidden');
            });
        }

        if (dateTrigger) {
            dateTrigger.addEventListener('click', () => {
                if (activeViewId === CALENDAR_VIEW_ID) {
                    openMonthSheet();
                }
            });
        }

        if (daysContainer) {
            daysContainer.addEventListener('click', (event) => {
                const dayButton = event.target.closest('.calendar-v1-day');
                if (!dayButton || dayButton.disabled) return;
                const dateKey = dayButton.dataset.date;
                if (!parseDateKey(dateKey) || !isMonthKeyInRange(monthKeyFromDateKey(dateKey))) return;
                syncCalendarState(dateKey, true);
            });
        }

        if (upcomingList) {
            upcomingList.addEventListener('click', (event) => {
                const eventCard = event.target.closest('.calendar-v1-event-item.editable');
                if (!eventCard) return;
                const eventId = String(eventCard.dataset.eventId || '');
                if (!eventId) return;
                const state = ensureCalendarState();
                const matchedEvent = (state.events || []).find((item) => item.id === eventId);
                if (!matchedEvent) return;
                openEventSheet(matchedEvent.date, matchedEvent);
            });
        }

        if (timetableGrid) {
            timetableGrid.addEventListener('click', (event) => {
                const courseNode = event.target.closest('.calendar-v1-tt-course[data-course-key]');
                if (!courseNode) return;
                const courseKey = String(courseNode.dataset.courseKey || '');
                const matchedCourse = renderedScheduleCourseMap.get(courseKey);
                if (!matchedCourse) return;
                openCourseSheet(matchedCourse);
            });
        }

        if (eventAddBtn) {
            eventAddBtn.addEventListener('click', () => {
                const state = ensureCalendarState();
                openEventSheet(state.selectedDate, null);
            });
        }

        if (headerActionBtn) {
            headerActionBtn.addEventListener('click', () => {
                if (activeViewId !== SCHEDULE_VIEW_ID || !scheduleImportInput) return;
                scheduleImportInput.click();
            });
        }

        if (monthSheetBackdrop) monthSheetBackdrop.addEventListener('click', closeMonthSheet);
        if (cancelBtn) cancelBtn.addEventListener('click', closeMonthSheet);
        if (todayBtn) todayBtn.addEventListener('click', goToToday);

        if (eventSheetBackdrop) eventSheetBackdrop.addEventListener('click', closeEventSheet);
        if (eventSheetCloseBtn) eventSheetCloseBtn.addEventListener('click', closeEventSheet);
        if (eventCancelBtn) eventCancelBtn.addEventListener('click', closeEventSheet);
        if (courseSheetBackdrop) courseSheetBackdrop.addEventListener('click', closeCourseSheet);
        if (courseSheetCloseBtn) courseSheetCloseBtn.addEventListener('click', closeCourseSheet);

        if (eventAllDayInput) {
            eventAllDayInput.addEventListener('change', () => {
                if (eventTimeField) {
                    eventTimeField.classList.toggle('is-hidden', !!eventAllDayInput.checked);
                }
            });
        }

        if (eventDeleteBtn) {
            eventDeleteBtn.addEventListener('click', () => {
                if (!activeEventDraft || !activeEventDraft.id) return;
                deleteStoredEvent(activeEventDraft.id);
                closeEventSheet();
                renderCalendarView(false);
            });
        }

        if (scheduleImportInput) {
            scheduleImportInput.addEventListener('change', async () => {
                const file = scheduleImportInput.files && scheduleImportInput.files[0];
                if (!file) return;
                try {
                    const rawText = await file.text();
                    const parsed = JSON.parse(rawText);
                    importScheduleFromObject(parsed);
                    showCalendarNotice('课表导入好啦～ (๑•̀ㅂ•́)و✧');
                } catch (error) {
                    console.error('[calendar] failed to import schedule json:', error);
                    showCalendarNotice('这个 JSON 好像不太对哦，按模板改改再试试～');
                } finally {
                    scheduleImportInput.value = '';
                }
            });
        }

        if (eventForm) {
            eventForm.addEventListener('submit', (event) => {
                event.preventDefault();
                if (!activeEventDraft) return;

                const nextTitle = String(eventTitleInput && eventTitleInput.value || '').trim();
                const nextLocation = String(eventLocationInput && eventLocationInput.value || '').trim();
                const isAllDay = !!(eventAllDayInput && eventAllDayInput.checked);
                const nextTime = String(eventTimeInput && eventTimeInput.value || '').trim();

                if (!nextTitle) {
                    if (eventFormError) eventFormError.textContent = '先写个标题呀～';
                    if (eventTitleInput) eventTitleInput.focus();
                    return;
                }

                if (!isAllDay && !/^\d{2}:\d{2}$/.test(nextTime)) {
                    if (eventFormError) eventFormError.textContent = '时间还没选哦～';
                    if (eventTimeInput) eventTimeInput.focus();
                    return;
                }

                const nextEvent = createStoredEventFromDraft({
                    ...activeEventDraft,
                    title: nextTitle,
                    location: nextLocation,
                    allDay: isAllDay,
                    time: isAllDay ? '' : nextTime,
                    source: activeEventDraft.id ? activeEventDraft.source : 'user'
                });

                upsertStoredEvent(nextEvent);
                closeEventSheet();
                renderCalendarView(false);
            });
        }

        if (prevYearBtn) {
            prevYearBtn.addEventListener('click', () => {
                if (pickerYear <= MIN_YEAR) return;
                pickerYear -= 1;
                renderMonthSheet();
            });
        }

        if (nextYearBtn) {
            nextYearBtn.addEventListener('click', () => {
                if (pickerYear >= MAX_YEAR) return;
                pickerYear += 1;
                renderMonthSheet();
            });
        }

        if (monthSheetGrid) {
            monthSheetGrid.addEventListener('click', (event) => {
                const monthButton = event.target.closest('[data-month]');
                if (!monthButton || monthButton.disabled) return;
                const month = Number(monthButton.dataset.month);
                if (!Number.isFinite(month)) return;
                jumpToMonth(monthKeyFromParts(pickerYear, month));
                closeMonthSheet();
            });
        }

        if (monthCard) {
            monthCard.addEventListener('touchstart', (event) => {
                if (activeViewId !== CALENDAR_VIEW_ID) return;
                if ((monthSheet && monthSheet.classList.contains('is-open')) || (eventSheet && eventSheet.classList.contains('is-open'))) return;
                const touch = event.changedTouches && event.changedTouches[0];
                if (!touch) return;
                touchGesture = {
                    x: touch.clientX,
                    y: touch.clientY,
                    time: Date.now()
                };
            }, { passive: true });

            monthCard.addEventListener('touchend', (event) => {
                const touch = event.changedTouches && event.changedTouches[0];
                if (!touchGesture || !touch) return;
                const deltaX = touch.clientX - touchGesture.x;
                const deltaY = touch.clientY - touchGesture.y;
                const elapsed = Date.now() - touchGesture.time;
                touchGesture = null;

                if (elapsed > 700) return;
                if (Math.abs(deltaX) < 36) return;
                if (Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;

                const state = ensureCalendarState();
                const nextMonthKey = shiftMonthKey(state.visibleMonth, deltaX < 0 ? 1 : -1);
                if (nextMonthKey !== state.visibleMonth) {
                    jumpToMonth(nextMonthKey);
                }
            }, { passive: true });

            monthCard.addEventListener('touchcancel', () => {
                touchGesture = null;
            }, { passive: true });
        }

        if (schedulePrevWeekBtn) {
            schedulePrevWeekBtn.addEventListener('click', () => {
                const state = ensureCalendarState();
                syncCalendarState(shiftDateKey(state.selectedDate, -7), true, { scheduleTransitionDirection: 'prev' });
            });
        }

        if (scheduleNextWeekBtn) {
            scheduleNextWeekBtn.addEventListener('click', () => {
                const state = ensureCalendarState();
                syncCalendarState(shiftDateKey(state.selectedDate, 7), true, { scheduleTransitionDirection: 'next' });
            });
        }

        window.initCalendarAppView = function () {
            closeMonthSheet();
            closeEventSheet();
            ensureCalendarState();
            saveCalendarState();
            switchView(CALENDAR_VIEW_ID, false);
            views.forEach((view) => {
                view.scrollTop = 0;
            });
            renderCalendarView(false);
        };
    }

    window.getCalendarChatContext = buildCalendarChatContext;

    if (window.appInitFunctions) {
        window.appInitFunctions.push(initCalendarApp);
    } else {
        document.addEventListener('DOMContentLoaded', initCalendarApp);
    }
})();




