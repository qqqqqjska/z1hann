(function () {
    'use strict';

    const PHONE_HEALTH_STYLE_ID = 'phone-health-v2-style';
    const PHONE_HEALTH_DATA_KEYS = ['sleep_records', 'mood_records', 'step_records', 'cycle_records', 'self_relief_records', 'bathroom_records'];
    const PHONE_HEALTH_ORDER = ['step_records', 'sleep_records', 'mood_records', 'cycle_records', 'self_relief_records', 'bathroom_records'];
    const PHONE_HEALTH_META = {
        step_records: { title: '步数', icon: 'ri-footprint-fill', accent: '#FF3B30' },
        sleep_records: { title: '睡眠时长', icon: 'ri-moon-clear-fill', accent: '#32ADE6' },
        mood_records: { title: '情绪记录', detailTitle: '心情记录', icon: 'ri-emotion-2-fill', accent: '#5E5CE6' },
        cycle_records: { title: '经期记录', icon: 'ri-drop-fill', accent: '#FF2D55' },
        self_relief_records: { title: '私密记录', icon: 'ri-shield-keyhole-fill', accent: '#FF9500' },
        bathroom_records: { title: '如厕记录', icon: 'ri-heart-pulse-fill', accent: '#34C759' }
    };
    const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

    function getCurrentContactId() {
        try {
            return typeof currentCheckPhoneContactId !== 'undefined' ? currentCheckPhoneContactId : '';
        } catch (error) {
            return '';
        }
    }

    function normalizeText(value, fallback) {
        const text = value == null ? '' : String(value).trim();
        return text || (fallback || '');
    }

    function escapeHtml(value) {
        return normalizeText(value, '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toBool(value) {
        if (typeof value === 'boolean') return value;
        const text = normalizeText(value, '').toLowerCase();
        return ['true', '1', 'yes', 'y', '是'].indexOf(text) !== -1;
    }

    function toInt(value) {
        const match = normalizeText(value, '').replace(/,/g, '').match(/-?\d+(\.\d+)?/);
        return match ? Math.round(Number(match[0])) : 0;
    }

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function getIsoToday() {
        const now = new Date();
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    }

    function sanitizeTimeText(value) {
        const match = normalizeText(value, '').match(/(\d{1,2}):(\d{2})/);
        return match ? `${match[1].padStart(2, '0')}:${match[2]}` : '00:00';
    }

    function formatHeaderDate() {
        const now = new Date();
        return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;
    }

    function parseDateTime(dateText, timeText) {
        const datePart = normalizeText(dateText, '');
        if (!datePart) return null;
        const parsed = new Date(`${datePart.replace(/-/g, '/')} ${sanitizeTimeText(timeText)}`);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    function formatShortDate(dateText) {
        const date = parseDateTime(dateText, '00:00');
        return date ? `${date.getMonth() + 1}/${date.getDate()}` : '未记录';
    }

    function formatDateLabel(dateText) {
        const date = parseDateTime(dateText, '00:00');
        return date ? `${date.getMonth() + 1}月${date.getDate()}日` : '未记录';
    }

    function formatDateTimeLabel(dateText, timeText) {
        const dateLabel = formatDateLabel(dateText);
        const timeLabel = normalizeText(timeText, '');
        return timeLabel ? `${dateLabel} ${timeLabel}` : dateLabel;
    }

    function formatRelativeDayLabel(dateText) {
        const date = parseDateTime(dateText, '00:00');
        if (!date) return formatDateLabel(dateText);
        const today = parseDateTime(getIsoToday(), '00:00');
        if (!today) return formatDateLabel(dateText);
        const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
        if (diff == 0) return '今天';
        if (diff == -1) return '昨天';
        if (diff == -2) return '前天';
        if (diff >= -6 && diff <= 6) return WEEKDAYS[date.getDay()];
        return formatDateLabel(dateText);
    }

    function formatChineseHalfDayTime(timeText) {
        const safe = sanitizeTimeText(timeText);
        const parts = safe.split(':');
        const hour = Number(parts[0] || 0);
        const minute = parts[1] || '00';
        const period = hour < 12 ? '上午' : '下午';
        const displayHour = hour % 12 || 12;
        return `${period} ${pad(displayHour)}:${minute}`;
    }

    function formatMoodListTime(item) {
        const dayLabel = formatRelativeDayLabel(item.date);
        const timeLabel = normalizeText(item.time, '');
        return timeLabel ? `${dayLabel}, ${formatChineseHalfDayTime(timeLabel)}` : dayLabel;
    }

    function getMoodVisualIndex(item) {
        const mood = normalizeText(item && item.mood, '');
        const intensity = toInt(item && item.intensity);
        if (/(?:\u5f00\u5fc3|\u6109\u60a6|\u8f7b\u677e|\u653e\u677e|\u6ee1\u8db3)/.test(mood)) return 4;
        if (/(?:\u5e73\u9759|\u5e73\u7a33|\u8fd8\u597d|\u653e\u7a7a)/.test(mood)) return 2;
        if (/(?:\u70e6\u8e81|\u4f4e\u843d|\u538b\u6291|\u59d4\u5c48|\u7a7a|\u7d2f|\u5fc3\u865a|\u5931\u843d)/.test(mood)) return 1;
        if (intensity >= 4) return 4;
        if (intensity == 3) return 2;
        if (intensity > 0 && intensity <= 2) return 1;
        return 2;
    }

    function buildMoodVisual(item, accent) {
        const activeIndex = getMoodVisualIndex(item);
        return `<div class="phone-health-mood-visual">${Array.from({ length: 5 }).map((_, index) => `<div class="phone-health-mood-dot${index === activeIndex ? ' active' : ''}"${index === activeIndex ? ` style="--mood-accent:${accent};"` : ''}>${index === activeIndex ? '<i class="ri-check-line"></i>' : ''}</div>`).join('')}</div>`;
    }

    function buildMoodDetail(list, meta) {
        if (!list.length) return `<div class="phone-health-detail-body">${buildRows('mood_records', { mood_records: [] })}</div>`;
        const latest = list[0];
        const rows = list.slice(0, 5).map(item => `<div class="phone-health-data-row"><div class="row-left">${escapeHtml(formatMoodListTime(item))}</div><div class="row-right"><i class="ri-arrow-right-s-line"></i></div></div>`).join('');
        return `<div class="phone-health-detail-body mood-detail"><div class="phone-health-detail-head mood"><i class="${meta.icon} mood-large-icon"></i><div class="phone-health-detail-title mood">${meta.detailTitle || meta.title}</div></div><div class="phone-health-mood-card"><div class="phone-health-mood-current">${escapeHtml(latest.mood || '--')}</div><div class="phone-health-mood-current-sub">${escapeHtml(formatRelativeDayLabel(latest.date))}</div>${buildMoodVisual(latest, meta.accent)}</div><div class="phone-health-section-title">近期记录</div><div class="phone-health-data-list">${rows}</div><div class="phone-health-data-list"><div class="phone-health-data-row"><div class="row-left">显示所有数据</div><div class="row-right"><i class="ri-arrow-right-s-line"></i></div></div><div class="phone-health-data-row"><div class="row-left">数据源与访问权限</div><div class="row-right"><i class="ri-arrow-right-s-line"></i></div></div></div><div class="phone-health-about-block"><div class="phone-health-about-title">关于${meta.detailTitle || meta.title}</div><div class="phone-health-about-text">这些记录用于回看最近的情绪波动与触发场景，保持健康 App 的记录口径，不直接下结论。</div></div></div>`;
    }

    function getRecordTimestamp(type, record) {
        const timeText = type === 'sleep_records' ? (record.bedtime || '') : (record.time || '');
        const parsed = parseDateTime(record.date, timeText);
        return parsed ? parsed.getTime() : 0;
    }

    function parseDurationMinutes(value) {
        const text = normalizeText(value, '');
        if (!text) return 0;
        let total = 0;
        const hourCn = text.match(/(\d+(?:\.\d+)?)\s*小时/);
        const minCn = text.match(/(\d+)\s*分/);
        const hourEn = text.match(/(\d+(?:\.\d+)?)\s*h/i);
        const minEn = text.match(/(\d+)\s*m/i);
        if (hourCn) total += Math.round(Number(hourCn[1]) * 60);
        if (minCn) total += Number(minCn[1]);
        if (!total && hourEn) total += Math.round(Number(hourEn[1]) * 60);
        if (!total && minEn) total += Number(minEn[1]);
        if (!total) total = toInt(text);
        return total;
    }

    function formatDurationHours(minutes) {
        if (!minutes) return '0h';
        const hours = minutes / 60;
        const text = hours >= 10 ? hours.toFixed(0) : hours.toFixed(1);
        return `${text.replace(/\.0$/, '')}h`;
    }

    function createEmptyPhoneHealthData() {
        return {
            sleep_records: [],
            mood_records: [],
            step_records: [],
            cycle_records: [],
            self_relief_records: [],
            bathroom_records: []
        };
    }

    function getPhoneHealthStoreBucket(contactId) {
        const state = window.iphoneSimState = window.iphoneSimState || {};
        if (!state.phoneContent) state.phoneContent = {};
        if (!state.phoneContent[contactId]) state.phoneContent[contactId] = {};
        return state.phoneContent[contactId];
    }

    function getPhoneHealthContactById(contactId) {
        const state = window.iphoneSimState || {};
        const contacts = Array.isArray(state.contacts) ? state.contacts : [];
        return contacts.find(item => item.id === contactId) || null;
    }

    function normalizeSleepRecord(item) {
        return {
            date: normalizeText(item && item.date, getIsoToday()),
            bedtime: normalizeText(item && item.bedtime, ''),
            wake_time: normalizeText(item && item.wake_time, ''),
            duration: normalizeText(item && item.duration, '未记录'),
            quality: normalizeText(item && item.quality, '一般'),
            tag: normalizeText(item && item.tag, '正常'),
            summary: normalizeText(item && item.summary, ''),
            related_to_user: toBool(item && item.related_to_user),
            hidden_tension: normalizeText(item && item.hidden_tension, '')
        };
    }

    function normalizeMoodRecord(item) {
        return {
            date: normalizeText(item && item.date, getIsoToday()),
            time: normalizeText(item && item.time, ''),
            mood: normalizeText(item && item.mood, '平静'),
            intensity: normalizeText(item && item.intensity, '中'),
            trigger: normalizeText(item && item.trigger, '未记录'),
            summary: normalizeText(item && item.summary, ''),
            related_to_user: toBool(item && item.related_to_user),
            hidden_tension: normalizeText(item && item.hidden_tension, '')
        };
    }

    function normalizeStepRecord(item) {
        return {
            date: normalizeText(item && item.date, getIsoToday()),
            steps: normalizeText(item && item.steps, '0'),
            distance: normalizeText(item && item.distance, ''),
            calories: normalizeText(item && item.calories, ''),
            tag: normalizeText(item && item.tag, '正常'),
            summary: normalizeText(item && item.summary, ''),
            related_to_user: toBool(item && item.related_to_user),
            hidden_tension: normalizeText(item && item.hidden_tension, '')
        };
    }
    function normalizeCycleRecord(item) {
        return {
            date: normalizeText(item && item.date, getIsoToday()),
            phase: normalizeText(item && item.phase, '未记录'),
            symptoms: normalizeText(item && item.symptoms, ''),
            mood_tag: normalizeText(item && item.mood_tag, ''),
            summary: normalizeText(item && item.summary, ''),
            related_to_user: toBool(item && item.related_to_user),
            hidden_tension: normalizeText(item && item.hidden_tension, '')
        };
    }

    function normalizeSelfReliefRecord(item) {
        const source = item && typeof item === 'object' ? item : {};
        return {
            date: normalizeText(source.date, getIsoToday()),
            time: normalizeText(source.time, ''),
            duration_minutes: toInt(source.duration_minutes || source.duration || source.value),
            frequency_tag: normalizeText(source.frequency_tag, '偶发'),
            mood_before: normalizeText(source.mood_before || source.mood_tag, '未记录'),
            mood_after: normalizeText(source.mood_after, '未记录'),
            aid_type: normalizeText(source.aid_type || source.aid_mode, '无辅助'),
            aid_summary: normalizeText(source.aid_summary || source.aid_detail || source.aid_note, ''),
            privacy_level: normalizeText(source.privacy_level, '普通'),
            state_curve: normalizeText(source.state_curve || source.process_note, ''),
            private_reflection: normalizeText(source.private_reflection || source.detail_note, ''),
            after_note: normalizeText(source.after_note || source.followup_note, ''),
            summary: normalizeText(source.summary, ''),
            related_to_user: toBool(source.related_to_user),
            hidden_tension: normalizeText(source.hidden_tension, '')
        };
    }

    function normalizeBathroomRecord(item) {
        return {
            date: normalizeText(item && item.date, getIsoToday()),
            time: normalizeText(item && item.time, ''),
            type: normalizeText(item && item.type, '排便'),
            status: normalizeText(item && item.status, '正常'),
            summary: normalizeText(item && item.summary, ''),
            related_to_user: toBool(item && item.related_to_user),
            hidden_tension: normalizeText(item && item.hidden_tension, '')
        };
    }

    function sortModuleRecords(moduleKey, list) {
        return list.sort((a, b) => getRecordTimestamp(moduleKey, b) - getRecordTimestamp(moduleKey, a));
    }

    function normalizePhoneHealthData(raw) {
        const source = raw && typeof raw === 'object' ? (raw.healthData && typeof raw.healthData === 'object' ? raw.healthData : raw) : {};
        const normalized = createEmptyPhoneHealthData();
        normalized.sleep_records = sortModuleRecords('sleep_records', (Array.isArray(source.sleep_records) ? source.sleep_records : []).map(normalizeSleepRecord));
        normalized.mood_records = sortModuleRecords('mood_records', (Array.isArray(source.mood_records) ? source.mood_records : []).map(normalizeMoodRecord));
        normalized.step_records = sortModuleRecords('step_records', (Array.isArray(source.step_records) ? source.step_records : []).map(normalizeStepRecord));
        normalized.cycle_records = sortModuleRecords('cycle_records', (Array.isArray(source.cycle_records) ? source.cycle_records : []).map(normalizeCycleRecord));
        normalized.self_relief_records = sortModuleRecords('self_relief_records', (Array.isArray(source.self_relief_records) ? source.self_relief_records : []).map(normalizeSelfReliefRecord));
        normalized.bathroom_records = sortModuleRecords('bathroom_records', (Array.isArray(source.bathroom_records) ? source.bathroom_records : []).map(normalizeBathroomRecord));
        return normalized;
    }

    function getPhoneHealthData(contactId) {
        if (!contactId) return createEmptyPhoneHealthData();
        const bucket = getPhoneHealthStoreBucket(contactId);
        bucket.healthData = normalizePhoneHealthData(bucket.healthData);
        return bucket.healthData;
    }

    function setPhoneHealthData(contactId, data) {
        const bucket = getPhoneHealthStoreBucket(contactId);
        bucket.healthData = normalizePhoneHealthData(data);
        return bucket.healthData;
    }

    function countHealthRecords(data) {
        return PHONE_HEALTH_DATA_KEYS.reduce((sum, key) => sum + ((data && Array.isArray(data[key])) ? data[key].length : 0), 0);
    }

    function hasMeaningfulPhoneHealthData(input) {
        const data = typeof input === 'string' ? getPhoneHealthData(input) : normalizePhoneHealthData(input);
        return countHealthRecords(data) > 0;
    }

    function getPhoneHealthRuntime(container) {
        if (!container.__phoneHealthRuntime) {
            container.__phoneHealthRuntime = { activeContactId: '', activeDetailKey: '', privateModalIndex: null };
        }
        return container.__phoneHealthRuntime;
    }

    function buildMetricMarkup(value, unit, textMode) {
        if (textMode) return `<div class="phone-health-display"><span class="text">${escapeHtml(value || '--')}</span></div>`;
        return `<div class="phone-health-display"><span class="value">${escapeHtml(value || '--')}</span>${unit ? `<span class="unit">${escapeHtml(unit)}</span>` : ''}</div>`;
    }

    function getSummaryPayload(moduleKey, data) {
        const list = data[moduleKey] || [];
        const latest = list[0];
        if (!latest) return { value: '--', unit: '', subtitle: '点击右侧生成', textMode: true };
        if (moduleKey === 'step_records') return { value: toInt(latest.steps).toLocaleString(), unit: '步', subtitle: `${formatDateLabel(latest.date)} · ${latest.tag || '最近记录'}` };
        if (moduleKey === 'sleep_records') return { value: latest.duration || '--', unit: '', subtitle: `${latest.bedtime || '--'} - ${latest.wake_time || '--'}`, textMode: true };
        if (moduleKey === 'mood_records') return { value: latest.mood || '--', unit: '', subtitle: latest.trigger || latest.summary || formatDateTimeLabel(latest.date, latest.time), textMode: true };
        if (moduleKey === 'cycle_records') return { value: latest.phase || '--', unit: '', subtitle: latest.mood_tag || latest.symptoms || formatDateLabel(latest.date), textMode: true };
        if (moduleKey === 'self_relief_records') return { value: latest.frequency_tag || '已记录', unit: '', subtitle: formatDateTimeLabel(latest.date, latest.time), textMode: true };
        const todayCount = list.filter(item => item.date === getIsoToday()).length;
        if (todayCount) return { value: String(todayCount), unit: '次', subtitle: '今天已记录如厕次数' };
        return { value: latest.status || latest.type || '--', unit: '', subtitle: formatDateTimeLabel(latest.date, latest.time), textMode: true };
    }

    function buildChart(items, getValue, getValueText, accent) {
        const recent = items.slice(0, 7).reverse();
        if (!recent.length) return '';
        const values = recent.map(item => Math.max(getValue(item), 0));
        const max = Math.max.apply(null, values.concat([1]));
        return `<div class="phone-health-chart">${recent.map((item, index) => {
            const height = Math.max(12, Math.round(values[index] / max * 100));
            return `<div class="phone-health-bar-col"><div class="phone-health-bar-wrap"><div class="phone-health-bar" style="height:${height}%;background:${accent};"></div></div><div class="phone-health-bar-value">${escapeHtml(getValueText(item))}</div><div class="phone-health-bar-label">${escapeHtml(formatShortDate(item.date))}</div></div>`;
        }).join('')}</div>`;
    }

    function buildBathroomChart(records) {
        const counter = {};
        records.forEach(item => { counter[item.date] = (counter[item.date] || 0) + 1; });
        const days = Object.keys(counter).sort().slice(-7).reverse().map(date => ({ date: date, count: counter[date] })).reverse();
        if (!days.length) return '';
        const max = Math.max.apply(null, days.map(item => item.count).concat([1]));
        return `<div class="phone-health-chart">${days.map(item => `<div class="phone-health-bar-col"><div class="phone-health-bar-wrap"><div class="phone-health-bar" style="height:${Math.max(12, Math.round(item.count / max * 100))}%;background:${PHONE_HEALTH_META.bathroom_records.accent};"></div></div><div class="phone-health-bar-value">${item.count}</div><div class="phone-health-bar-label">${escapeHtml(formatShortDate(item.date))}</div></div>`).join('')}</div>`;
    }

    function buildMoodGrid(records) {
        const recent = records.slice(0, 8);
        return `<div class="phone-health-mood-grid">${recent.map(item => `<div class="phone-health-mood-chip"><strong>${escapeHtml(item.mood)}</strong><span>${escapeHtml(item.intensity || '中')} · ${escapeHtml(item.trigger || '未记录')}</span><em>${escapeHtml(formatDateTimeLabel(item.date, item.time))}</em></div>`).join('')}</div>`;
    }





    function buildPrivateProcessText(item) {
        return [item.state_curve, item.private_reflection].filter(Boolean).join('\n\n')
            || item.summary
            || item.aid_summary
            || '这次记录更像是在压力和失眠之间给自己找一点缓冲。';
    }

    function buildPrivateAidText(item) {
        const aidType = normalizeText(item && item.aid_type, '无辅助');
        const looksUserLinked = /(用户|对方|聊天|语音|照片|截图|共同|主页|歌单|视频|定位|备注)/.test(aidType);
        return item.aid_summary
            || (aidType === '无辅助'
                ? '这次没有借助外部内容，更多是靠放空、安静待一会儿让情绪慢慢降下来。'
                : looksUserLinked
                    ? `这次翻到一些和对方有关的内容，主要是借“${aidType}”让情绪先有个落点。`
                    : `这次主要借助“${aidType}”来分散注意力，让自己先别继续陷在情绪里。`);
    }

    function buildPrivateModal(records, runtime) {
        const index = typeof runtime.privateModalIndex === 'number' ? runtime.privateModalIndex : -1;
        const item = index >= 0 ? records[index] : null;
        if (!item) return '';
        const timeLabel = formatDateTimeLabel(item.date, item.time);
        const summaryText = item.summary || item.aid_summary || '这次记录更像是在给情绪找一个缓冲点。';
        const aidText = buildPrivateAidText(item);
        const processText = buildPrivateProcessText(item);
        const afterText = item.after_note || item.mood_after || '结束后稍微安静一点。';
        return `<div class="phone-health-modal-backdrop"><div class="phone-health-modal" role="dialog" aria-modal="true" aria-label="私密记录详情"><div class="phone-health-modal-header"><div class="phone-health-modal-title">私密记录详情</div></div><div class="phone-health-modal-time">${escapeHtml(timeLabel)}</div><div class="phone-health-modal-grid"><div class="phone-health-modal-item"><label>时长</label><strong>${escapeHtml(item.duration_minutes ? `${item.duration_minutes} 分钟` : '未记录')}</strong></div><div class="phone-health-modal-item"><label>频率</label><strong>${escapeHtml(item.frequency_tag || '未记录')}</strong></div><div class="phone-health-modal-item"><label>开始状态</label><strong>${escapeHtml(item.mood_before || '未记录')}</strong></div><div class="phone-health-modal-item"><label>结束状态</label><strong>${escapeHtml(item.mood_after || '未记录')}</strong></div><div class="phone-health-modal-item"><label>辅助方式</label><strong>${escapeHtml(item.aid_type || '无辅助')}</strong></div><div class="phone-health-modal-item"><label>隐私等级</label><strong>${escapeHtml(item.privacy_level || '普通')}</strong></div></div><div class="phone-health-modal-block"><h4>记录摘要</h4><p>${escapeHtml(summaryText)}</p></div><div class="phone-health-modal-block"><h4>辅助说明</h4><p>${escapeHtml(aidText)}</p></div><div class="phone-health-modal-block"><h4>状态过程</h4><p>${escapeHtml(processText)}</p></div><div class="phone-health-modal-block"><h4>结束备注</h4><p>${escapeHtml(afterText)}</p></div></div></div>`;
    }

    function buildRows(moduleKey, data) {
        const list = data[moduleKey] || [];
        if (!list.length) {
            return `<div class="phone-health-empty"><i class="${PHONE_HEALTH_META[moduleKey].icon}"></i><h3>还没有内容</h3><p>点击“健康”右侧蓝色按钮后，这里会显示该联系人的健康记录。</p></div>`;
        }

        return `<div class="phone-health-records">${list.map((item, index) => {
            if (moduleKey === 'step_records') {
                return `<div class="phone-health-row"><div><h4>${escapeHtml(formatDateLabel(item.date))}</h4><p>${escapeHtml(item.summary || item.tag || '最近活动记录')}</p></div><div class="side"><strong>${toInt(item.steps).toLocaleString()} 步</strong><span>${escapeHtml([item.distance, item.calories].filter(Boolean).join(' / ') || item.tag || '')}</span></div></div>`;
            }

            if (moduleKey === 'sleep_records') {
                return `<div class="phone-health-row"><div><h4>${escapeHtml(formatDateLabel(item.date))}</h4><p>${escapeHtml(item.summary || item.tag || '睡眠记录')}</p></div><div class="side"><strong>${escapeHtml(item.duration || '--')}</strong><span>${escapeHtml(`${item.bedtime || '--'} - ${item.wake_time || '--'}`)}</span></div></div>`;
            }

            if (moduleKey === 'mood_records') {
                return `<div class="phone-health-row"><div><h4>${escapeHtml(formatDateTimeLabel(item.date, item.time))}</h4><p>${escapeHtml(item.summary || item.trigger || '情绪记录')}</p></div><div class="side"><strong>${escapeHtml(item.mood || '未记录')}</strong><span>${escapeHtml(item.intensity || '中等')}</span></div></div>`;
            }

            if (moduleKey === 'cycle_records') {
                return `<div class="phone-health-row"><div><h4>${escapeHtml(formatDateLabel(item.date))}</h4><p>${escapeHtml(item.summary || item.symptoms || '经期状态记录')}</p></div><div class="side"><strong>${escapeHtml(item.phase || '未记录')}</strong><span>${escapeHtml(item.mood_tag || item.symptoms || '')}</span></div></div>`;
            }

            if (moduleKey === 'self_relief_records') {
                const moodFlow = [item.mood_before, item.mood_after].filter(Boolean).join(' → ');
                const subtitle = [item.frequency_tag, moodFlow].filter(Boolean).join(' / ');
                const meta = [item.privacy_level, item.aid_type].filter(Boolean).join(' / ');
                return `<button type="button" class="phone-health-row is-clickable" data-action="open-private-detail" data-private-index="${index}"><div><h4>${escapeHtml(formatDateTimeLabel(item.date, item.time))}</h4><p>${escapeHtml(subtitle || item.summary || '私密记录')}</p></div><div class="side"><strong>${escapeHtml(item.duration_minutes ? `${item.duration_minutes} 分钟` : '未记录')}</strong><span>${escapeHtml(meta || '点击查看详情')}</span><span class="open-hint"><i class="ri-arrow-right-s-line"></i></span></div></button>`;
            }

            return `<div class="phone-health-row"><div><h4>${escapeHtml(formatDateTimeLabel(item.date, item.time))}</h4><p>${escapeHtml(item.summary || item.type || '如厕记录')}</p></div><div class="side"><strong>${escapeHtml(item.status || '未记录')}</strong><span>${escapeHtml(item.type || '')}</span></div></div>`;
        }).join('')}</div>`;
    }

    function buildDetailBody(moduleKey, data) {
        const list = data[moduleKey] || [];
        const meta = PHONE_HEALTH_META[moduleKey];
        if (moduleKey === 'mood_records') {
            return buildMoodDetail(list, meta);
        }
        let hero = '<div class="phone-health-hero-sub">点击“健康”右侧蓝色按钮生成健康内容。</div>';
        let chart = '';
        if (moduleKey === 'step_records' && list[0]) {
            hero = `<div class="phone-health-hero-num">${toInt(list[0].steps).toLocaleString()}<span>步</span></div><div class="phone-health-hero-sub">${escapeHtml(list[0].summary || list[0].tag || '最近活动记录')}</div>`;
            chart = buildChart(list, item => toInt(item.steps), item => `${Math.round(toInt(item.steps) / 1000) || 0}k`, meta.accent);
        } else if (moduleKey === 'sleep_records' && list[0]) {
            hero = `<div class="phone-health-hero-num text">${escapeHtml(list[0].duration || '--')}</div><div class="phone-health-hero-sub">${escapeHtml(`${list[0].bedtime || '--'} - ${list[0].wake_time || '--'}`)}</div>`;
            chart = buildChart(list, item => parseDurationMinutes(item.duration), item => formatDurationHours(parseDurationMinutes(item.duration)), meta.accent);
        } else if (moduleKey === 'cycle_records' && list[0]) {
            hero = `<div class="phone-health-hero-num text">${escapeHtml(list[0].phase || '--')}</div><div class="phone-health-hero-sub">${escapeHtml(list[0].symptoms || list[0].mood_tag || '最近经期状态')}</div>`;
        } else if (moduleKey === 'self_relief_records' && list[0]) {
            hero = `<div class="phone-health-hero-num text">${escapeHtml(list[0].frequency_tag || '已记录')}</div><div class="phone-health-hero-sub">${escapeHtml([list[0].mood_before, list[0].mood_after && `→ ${list[0].mood_after}`].filter(Boolean).join(' '))}</div>`;
        } else if (moduleKey === 'bathroom_records' && list[0]) {
            const todayCount = list.filter(item => item.date === getIsoToday()).length;
            hero = `<div class="phone-health-hero-num">${todayCount || list.length}<span>${todayCount ? '次' : '条'}</span></div><div class="phone-health-hero-sub">${todayCount ? '今天如厕记录次数' : escapeHtml(list[0].status || list[0].type || '最近记录')}</div>`;
            chart = buildBathroomChart(list);
        }
        return `<div class="phone-health-detail-body"><div class="phone-health-detail-head"><div class="phone-health-detail-icon" style="background:${meta.accent};"><i class="${meta.icon}"></i></div><div><div class="phone-health-detail-title">${meta.detailTitle || meta.title || meta.title}</div><div class="phone-health-detail-note">最近 30 天内的联系人健康记录</div></div></div><div class="phone-health-hero">${hero}</div>${chart}${buildRows(moduleKey, data)}</div>`;
    }

    function buildMainMarkup(contact, data, runtime) {
        const hasData = hasMeaningfulPhoneHealthData(data);
        const activeDetail = runtime.activeDetailKey;
        const visibleKeys = PHONE_HEALTH_ORDER.filter(key => key !== 'cycle_records' || (data.cycle_records && data.cycle_records.length));
        const cards = visibleKeys.map(key => {
            const meta = PHONE_HEALTH_META[key];
            const summary = getSummaryPayload(key, data);
            return `<button type="button" class="phone-health-card${hasData ? '' : ' is-placeholder'}" data-action="open-health-detail" data-health-key="${key}" style="--accent:${meta.accent};"><div class="card-head"><div class="card-title"><i class="${meta.icon}"></i><span>${meta.title}</span></div><i class="ri-arrow-right-s-line chevron"></i></div>${buildMetricMarkup(summary.value, summary.unit, summary.textMode)}<div class="card-sub">${escapeHtml(summary.subtitle)}</div></button>`;
        }).join('');
        const tip = '';
        const detailMarkup = activeDetail ? buildDetailBody(activeDetail, data) : '<div class="phone-health-detail-body"></div>';
        const modalMarkup = activeDetail === 'self_relief_records' ? buildPrivateModal(data.self_relief_records || [], runtime) : '';
        return `<div class="phone-health-app"><div class="phone-health-view main${activeDetail ? ' shifted' : ''}"><div class="phone-health-header"><div class="top"><div class="date">${formatHeaderDate()}</div></div><div class="title-row"><button type="button" class="health-home-btn" data-action="close-health-app" aria-label="退出健康应用">健康</button><div class="actions"><button type="button" id="generate-phone-health-btn" class="generate" data-action="generate-health" aria-label="生成内容"><i class="ri-ai-generate"></i></button></div></div></div><div class="phone-health-scroll">${tip}<div class="phone-health-cards">${cards}</div></div></div><div class="phone-health-view detail${activeDetail ? ' active' : ''}"><div class="phone-health-nav"><button type="button" class="back" data-action="back-health-main"><i class="ri-arrow-left-s-line"></i><span>摘要</span></button><div class="nav-title">${escapeHtml(activeDetail ? (PHONE_HEALTH_META[activeDetail].detailTitle || PHONE_HEALTH_META[activeDetail].title) : '')}</div></div>${detailMarkup}</div>${modalMarkup}</div>`;
    }

    function ensureStyles() {
        let style = document.getElementById(PHONE_HEALTH_STYLE_ID);
        if (!style) {
            style = document.createElement('style');
            style.id = PHONE_HEALTH_STYLE_ID;
            document.head.appendChild(style);
        }
        style.textContent = `#phone-health,#phone-health-content{background:#F2F2F7;}#phone-health-content{height:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Helvetica Neue",Arial,sans-serif;color:#111827;}#phone-health-content *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}#phone-health-content button{font:inherit;border:none;}#phone-health-content .phone-health-app{position:relative;height:100%;overflow:hidden;}#phone-health-content .phone-health-view{position:absolute;inset:0;background:#F2F2F7;transition:transform .45s cubic-bezier(.32,.72,0,1),opacity .25s ease;}#phone-health-content .phone-health-view.main{z-index:1;}#phone-health-content .phone-health-view.main.shifted{transform:translateX(-28%);opacity:.82;}#phone-health-content .phone-health-view.detail{z-index:2;transform:translateX(100%);overflow-y:auto;box-shadow:-12px 0 32px rgba(15,23,42,.08);}#phone-health-content .phone-health-view.detail.active{transform:translateX(0);}#phone-health-content .phone-health-header{position:sticky;top:0;z-index:5;padding:20px 20px 16px;padding-top:max(58px,env(safe-area-inset-top));background:rgba(242,242,247,.82);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);}#phone-health-content .top,#phone-health-content .title-row,#phone-health-content .actions,#phone-health-content .card-head,#phone-health-content .card-title,#phone-health-content .phone-health-nav,#phone-health-content .phone-health-detail-head{display:flex;align-items:center;}#phone-health-content .top{justify-content:flex-start;gap:12px;}#phone-health-content .date{font-size:14px;font-weight:600;color:#6B7280;}#phone-health-content .actions{gap:10px;margin-left:auto;}#phone-health-content .generate{width:38px;height:38px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;}#phone-health-content .generate{background:#007AFF;color:#fff;font-size:19px;}#phone-health-content .title-row{justify-content:space-between;margin-top:10px;gap:12px;}#phone-health-content .health-home-btn{margin:0;padding:0;background:transparent;color:#111827;font-size:34px;line-height:1.1;font-weight:700;cursor:pointer;}#phone-health-content .health-home-btn:active{opacity:.65;}#phone-health-content .contact{padding:8px 12px;border-radius:999px;background:#fff;color:#6B7280;font-size:13px;font-weight:600;}#phone-health-content .phone-health-scroll{height:calc(100% - 122px);overflow-y:auto;padding:0 20px calc(34px + env(safe-area-inset-bottom));}#phone-health-content .phone-health-tip{margin:8px 0 14px;padding:14px 16px;border-radius:18px;background:#fff;color:#374151;font-size:14px;line-height:1.45;}#phone-health-content .phone-health-tip.empty{color:#2563EB;background:rgba(0,122,255,.08);}#phone-health-content .phone-health-cards{display:flex;flex-direction:column;gap:14px;}#phone-health-content .phone-health-card{background:#fff;border-radius:22px;padding:16px 18px;text-align:left;cursor:pointer;box-shadow:0 1px 0 rgba(17,24,39,.02);}#phone-health-content .phone-health-card.is-placeholder{opacity:.96;}#phone-health-content .card-title{gap:8px;color:var(--accent);}#phone-health-content .card-title i{font-size:22px;}#phone-health-content .card-title span{color:#111827;font-size:15px;font-weight:600;}#phone-health-content .chevron{margin-left:auto;font-size:20px;color:#C7C7CC;}#phone-health-content .phone-health-display{display:flex;align-items:baseline;gap:4px;margin-top:10px;line-height:1.1;}#phone-health-content .phone-health-display .value,#phone-health-content .phone-health-display .text{font-size:30px;font-weight:700;color:#111827;}#phone-health-content .phone-health-display .unit{font-size:15px;font-weight:600;color:#6B7280;}#phone-health-content .card-sub{margin-top:6px;font-size:13px;color:#6B7280;}#phone-health-content .phone-health-nav{position:sticky;top:0;z-index:5;justify-content:flex-start;gap:10px;padding:calc(48px + env(safe-area-inset-top)) 12px 12px;background:rgba(242,242,247,.84);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);}#phone-health-content .back{background:none;color:#007AFF;padding:8px;cursor:pointer;display:inline-flex;align-items:center;gap:2px;font-size:17px;position:relative;z-index:1;}#phone-health-content .back i{font-size:24px;}#phone-health-content .nav-title{position:absolute;left:50%;transform:translateX(-50%);font-size:17px;font-weight:600;color:#111827;pointer-events:none;}#phone-health-content .phone-health-detail-body{padding:0 20px calc(34px + env(safe-area-inset-bottom));}#phone-health-content .phone-health-detail-head{gap:12px;margin:8px 0 16px;}#phone-health-content .phone-health-detail-icon{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px;}#phone-health-content .phone-health-detail-title{font-size:28px;font-weight:700;line-height:1.1;}#phone-health-content .phone-health-detail-note{margin-top:4px;font-size:13px;color:#6B7280;}#phone-health-content .phone-health-hero{padding:18px;border-radius:22px;background:#fff;margin-bottom:16px;}#phone-health-content .phone-health-hero-num{font-size:34px;font-weight:700;line-height:1;}#phone-health-content .phone-health-hero-num.text{font-size:28px;line-height:1.2;}#phone-health-content .phone-health-hero-num span{margin-left:6px;font-size:15px;font-weight:600;color:#6B7280;}#phone-health-content .phone-health-hero-sub{margin-top:8px;font-size:14px;color:#6B7280;line-height:1.5;}#phone-health-content .phone-health-chart{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;padding:16px 14px 12px;border-radius:22px;background:#fff;margin-bottom:16px;align-items:end;min-height:170px;}#phone-health-content .phone-health-bar-col{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0;}#phone-health-content .phone-health-bar-wrap{width:100%;height:88px;display:flex;align-items:flex-end;}#phone-health-content .phone-health-bar{width:100%;border-radius:12px 12px 6px 6px;min-height:12px;}#phone-health-content .phone-health-bar-value{font-size:12px;font-weight:600;color:#374151;}#phone-health-content .phone-health-bar-label{font-size:11px;color:#9CA3AF;}#phone-health-content .phone-health-mood-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:16px;}#phone-health-content .phone-health-mood-chip{background:#fff;border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:6px;}#phone-health-content .phone-health-mood-chip strong{font-size:16px;}#phone-health-content .phone-health-mood-chip span,#phone-health-content .phone-health-mood-chip em{font-size:12px;color:#6B7280;font-style:normal;}#phone-health-content .phone-health-detail-head.mood{display:block;margin:12px 0 18px;color:var(--mood-accent,#5E5CE6);}#phone-health-content .phone-health-detail-title.mood{font-size:32px;color:#5E5CE6;}#phone-health-content .mood-large-icon{display:inline-flex;font-size:42px;color:#5E5CE6;margin-bottom:8px;}#phone-health-content .phone-health-mood-card{background:#fff;border-radius:22px;padding:24px 26px;margin-bottom:20px;}#phone-health-content .phone-health-mood-current{font-size:34px;font-weight:700;line-height:1.1;color:#111827;}#phone-health-content .phone-health-mood-current-sub{margin-top:8px;font-size:15px;color:#8E8E93;}#phone-health-content .phone-health-mood-visual{padding:28px 0 8px;display:flex;justify-content:center;gap:10px;}#phone-health-content .phone-health-mood-dot{width:42px;height:42px;border-radius:50%;background:#E5E5EA;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;}#phone-health-content .phone-health-mood-dot.active{background:var(--mood-accent,#5E5CE6);box-shadow:0 4px 12px rgba(94,92,230,.3);}#phone-health-content .phone-health-section-title{margin:0 0 10px;font-size:18px;font-weight:700;color:#111827;}#phone-health-content .phone-health-data-list{background:#fff;border-radius:22px;overflow:hidden;margin-bottom:18px;}#phone-health-content .phone-health-data-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 24px;font-size:15px;color:#111827;}#phone-health-content .phone-health-data-row + .phone-health-data-row{border-top:1px solid #E5E7EB;}#phone-health-content .phone-health-data-row .row-left{font-size:15px;color:#111827;}#phone-health-content .phone-health-data-row .row-right{display:flex;align-items:center;gap:8px;color:#C7C7CC;font-size:22px;}#phone-health-content .phone-health-about-block{padding:4px 2px 24px;}#phone-health-content .phone-health-about-title{font-size:16px;font-weight:700;color:#111827;margin-bottom:6px;}#phone-health-content .phone-health-about-text{font-size:13px;line-height:1.6;color:#6B7280;}#phone-health-content .phone-health-records{display:flex;flex-direction:column;gap:12px;}#phone-health-content .phone-health-row{background:#fff;border-radius:20px;padding:15px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}#phone-health-content .phone-health-row h4{margin:0 0 6px;font-size:15px;}#phone-health-content .phone-health-row p{margin:0;font-size:13px;color:#6B7280;line-height:1.5;}#phone-health-content .phone-health-row .side{min-width:102px;text-align:right;display:flex;flex-direction:column;gap:6px;}#phone-health-content .phone-health-row .side strong{font-size:14px;color:#111827;}#phone-health-content .phone-health-row .side span{font-size:12px;color:#6B7280;}#phone-health-content .phone-health-row.is-clickable{cursor:pointer;border:none;width:100%;text-align:left;}#phone-health-content .phone-health-row.is-clickable:active{transform:scale(.995);}#phone-health-content .phone-health-row .open-hint{display:inline-flex;align-items:center;justify-content:flex-end;color:#C7C7CC;font-size:18px;line-height:1;}#phone-health-content .phone-health-modal-backdrop{position:absolute;inset:0;z-index:30;background:rgba(17,24,39,.28);display:flex;align-items:flex-end;justify-content:center;padding:24px 16px calc(20px + env(safe-area-inset-bottom));}#phone-health-content .phone-health-modal{width:100%;max-width:420px;background:#fff;border-radius:26px;padding:18px 18px 20px;box-shadow:0 20px 50px rgba(15,23,42,.22);}#phone-health-content .phone-health-modal-header{display:flex;align-items:center;gap:12px;margin-bottom:12px;}#phone-health-content .phone-health-modal-title{font-size:18px;font-weight:700;color:#111827;}#phone-health-content .phone-health-modal-time{font-size:13px;color:#6B7280;margin-bottom:14px;}#phone-health-content .phone-health-modal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:14px;}#phone-health-content .phone-health-modal-item{background:#F8F9FB;border-radius:16px;padding:12px 14px;}#phone-health-content .phone-health-modal-item label{display:block;font-size:11px;color:#9CA3AF;margin-bottom:6px;}#phone-health-content .phone-health-modal-item strong{display:block;font-size:15px;color:#111827;line-height:1.45;}#phone-health-content .phone-health-modal-block{background:#F8F9FB;border-radius:18px;padding:14px 15px;margin-top:10px;}#phone-health-content .phone-health-modal-block h4{margin:0 0 6px;font-size:14px;color:#111827;}#phone-health-content .phone-health-modal-block p{margin:0;font-size:13px;line-height:1.7;color:#4B5563;white-space:pre-wrap;}#phone-health-content .phone-health-empty{background:#fff;border-radius:22px;padding:28px 20px;text-align:center;color:#6B7280;}#phone-health-content .phone-health-empty i{display:inline-flex;font-size:34px;color:#9CA3AF;margin-bottom:10px;}#phone-health-content .phone-health-empty h3{margin:0 0 8px;font-size:18px;color:#111827;}#phone-health-content .phone-health-empty p{margin:0;font-size:14px;line-height:1.5;}#phone-health-content .generate.generating-pulse i{animation:phone-health-spin 1s linear infinite;}@keyframes phone-health-spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}`;
    }
    function ensureShell() {
        let screen = document.getElementById('phone-health');
        if (screen) return screen;
        const notesScreen = document.getElementById('phone-notes');
        const host = notesScreen && notesScreen.parentNode ? notesScreen.parentNode : document.body;
        screen = document.createElement('div');
        screen.id = 'phone-health';
        screen.className = 'sub-screen hidden';
        screen.style.cssText = 'z-index:200;background-color:#F2F2F7;overflow:hidden;';
        screen.innerHTML = '<div id="phone-health-content" style="width:100%;height:100%;overflow:hidden;background:#F2F2F7;"></div>';
        host.appendChild(screen);
        return screen;
    }

    function renderPhoneHealth(container, contactId) {
        const runtime = getPhoneHealthRuntime(container);
        const targetId = contactId || runtime.activeContactId || getCurrentContactId() || '';
        runtime.activeContactId = targetId;
        const data = getPhoneHealthData(targetId);
        if (runtime.activeDetailKey === 'cycle_records' && !data.cycle_records.length) runtime.activeDetailKey = '';
        container.innerHTML = buildMainMarkup(getPhoneHealthContactById(targetId), data, runtime);
    }

    function showHealthMain(container) {
        const runtime = getPhoneHealthRuntime(container);
        runtime.activeDetailKey = '';
        runtime.privateModalIndex = null;
        renderPhoneHealth(container);
        const detail = container.querySelector('.phone-health-view.detail');
        if (detail) detail.scrollTop = 0;
    }

    function openHealthDetail(container, moduleKey) {
        const runtime = getPhoneHealthRuntime(container);
        runtime.activeDetailKey = moduleKey;
        runtime.privateModalIndex = null;
        renderPhoneHealth(container);
        const detail = container.querySelector('.phone-health-view.detail');
        if (detail) detail.scrollTop = 0;
    }

    function bindHealthInteractions(container) {
        if (!container || container.dataset.phoneHealthBound === 'true') return;
        container.addEventListener('click', function (event) {
            const target = event.target;
            const runtime = getPhoneHealthRuntime(container);
            const closeBtn = target.closest('[data-action="close-health-app"]');
            if (closeBtn) {
                const screen = document.getElementById('phone-health');
                if (screen) screen.classList.add('hidden');
                return;
            }
            const backBtn = target.closest('[data-action="back-health-main"]');
            if (backBtn) {
                showHealthMain(container);
                return;
            }
            const generateBtn = target.closest('[data-action="generate-health"]');
            if (generateBtn && !generateBtn.disabled) {
                if (typeof handlePhoneAppGenerate === 'function') handlePhoneAppGenerate('health');
                else if (typeof window.showChatToast === 'function') window.showChatToast('生成入口暂不可用');
                else alert('生成入口暂不可用');
                return;
            }
            const closePrivateDetail = target.closest('[data-action="close-private-detail"]');
            if (closePrivateDetail || (target.classList && target.classList.contains('phone-health-modal-backdrop'))) {
                runtime.privateModalIndex = null;
                renderPhoneHealth(container, runtime.activeContactId);
                return;
            }
            const openPrivateDetail = target.closest('[data-action="open-private-detail"][data-private-index]');
            if (openPrivateDetail) {
                runtime.privateModalIndex = Number(openPrivateDetail.dataset.privateIndex);
                renderPhoneHealth(container, runtime.activeContactId);
                return;
            }
            const card = target.closest('[data-action="open-health-detail"][data-health-key]');
            if (card) openHealthDetail(container, card.dataset.healthKey);
        });
        container.__resetPhoneHealthView = function (contactId) {
            const runtime = getPhoneHealthRuntime(container);
            runtime.activeContactId = contactId || getCurrentContactId() || runtime.activeContactId || '';
            runtime.activeDetailKey = '';
            runtime.privateModalIndex = null;
            renderPhoneHealth(container, runtime.activeContactId);
        };
        container.dataset.phoneHealthBound = 'true';
    }

    function ensureContent() {
        const screen = ensureShell();
        const container = screen.querySelector('#phone-health-content');
        if (!container) return null;
        ensureStyles();
        bindHealthInteractions(container);
        return container;
    }

    function refreshPhoneHealthApp(contactId) {
        const container = document.getElementById('phone-health-content');
        if (!container) return;
        renderPhoneHealth(container, contactId || getCurrentContactId());
    }

    function openPhoneHealthApp(contactId) {
        const screen = ensureShell();
        const container = ensureContent();
        if (!screen || !container) return;
        if (typeof container.__resetPhoneHealthView === 'function') {
            container.__resetPhoneHealthView(contactId || getCurrentContactId());
        }
        screen.classList.remove('hidden');
    }

    window.normalizePhoneHealthData = normalizePhoneHealthData;
    window.getPhoneHealthData = getPhoneHealthData;
    window.setPhoneHealthData = setPhoneHealthData;
    window.hasMeaningfulPhoneHealthData = hasMeaningfulPhoneHealthData;
    window.refreshPhoneHealthApp = refreshPhoneHealthApp;
    window.openPhoneHealthApp = openPhoneHealthApp;
})();





