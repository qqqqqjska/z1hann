
// LookUS 应用功能模块

let currentLookusContactId = null;
let lookusUpdateTimer = null;
let amapInstance = null;
let amapMarker = null;
let amapContactMarker = null;
let amapPolyline = null;
let currentUserLocation = null; // { lat, lng, address }
const DEVICE_USAGE_SYNC_DEFAULTS = {
    enabled: false,
    apiBaseUrl: '',
    userId: 'default-user',
    deviceId: 'phone-main',
    secret: '',
    sharedContactIds: [],
    lastFetchedAt: 0,
    cacheTtlMs: 60000
};
let deviceUsageSummaryCache = null;
let deviceUsageSummaryCacheKey = '';

window.getLookusCurrentUserLocation = function() {
    if (!currentUserLocation) return null;
    return {
        lat: Number(currentUserLocation.lat),
        lng: Number(currentUserLocation.lng),
        address: currentUserLocation.address || ''
    };
};

function escapeLookusHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getDeviceUsageSyncState() {
    if (!window.iphoneSimState) window.iphoneSimState = {};
    const merged = Object.assign({}, DEVICE_USAGE_SYNC_DEFAULTS, window.iphoneSimState.deviceUsageSync || {});
    merged.apiBaseUrl = String(merged.apiBaseUrl || '').trim().replace(/\/$/, '');
    merged.userId = String(merged.userId || DEVICE_USAGE_SYNC_DEFAULTS.userId).trim() || DEVICE_USAGE_SYNC_DEFAULTS.userId;
    merged.deviceId = String(merged.deviceId || DEVICE_USAGE_SYNC_DEFAULTS.deviceId).trim() || DEVICE_USAGE_SYNC_DEFAULTS.deviceId;
    merged.secret = String(merged.secret || '').trim();
    merged.sharedContactIds = Array.from(new Set(
        (Array.isArray(merged.sharedContactIds) ? merged.sharedContactIds : [])
            .map((item) => String(item || '').trim())
            .filter(Boolean)
    ));
    merged.lastFetchedAt = Number(merged.lastFetchedAt || 0) || 0;
    merged.cacheTtlMs = Math.max(5000, Number(merged.cacheTtlMs || DEVICE_USAGE_SYNC_DEFAULTS.cacheTtlMs) || DEVICE_USAGE_SYNC_DEFAULTS.cacheTtlMs);
    window.iphoneSimState.deviceUsageSync = merged;
    return merged;
}

function persistDeviceUsageSyncState() {
    if (typeof window.saveConfig === 'function') {
        try {
            window.saveConfig();
        } catch (error) {
            console.error('[device-usage] saveConfig failed', error);
        }
    }
}

function invalidateDeviceUsageSummaryCache() {
    deviceUsageSummaryCache = null;
    deviceUsageSummaryCacheKey = '';
    const state = getDeviceUsageSyncState();
    state.lastFetchedAt = 0;
}

function isDeviceUsageSharedWithContact(contactId) {
    const state = getDeviceUsageSyncState();
    const safeContactId = String(contactId || '').trim();
    if (!safeContactId) return false;
    return state.sharedContactIds.includes(safeContactId);
}

function setDeviceUsageSharedWithContact(contactId, enabled, options = {}) {
    const state = getDeviceUsageSyncState();
    const safeContactId = String(contactId || '').trim();
    if (!safeContactId) return state.sharedContactIds.slice();
    const next = new Set(state.sharedContactIds);
    if (enabled) next.add(safeContactId);
    else next.delete(safeContactId);
    state.sharedContactIds = Array.from(next.values());
    if (options.persist !== false) persistDeviceUsageSyncState();
    return state.sharedContactIds.slice();
}

function formatDeviceUsageDuration(durationMs) {
    const safeMs = Math.max(0, Number(durationMs || 0));
    const totalMinutes = Math.floor(safeMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0 && minutes > 0) return `${hours}小时${minutes}分钟`;
    if (hours > 0) return `${hours}小时`;
    if (minutes > 0) return `${minutes}分钟`;
    const seconds = Math.max(0, Math.floor(safeMs / 1000));
    return `${seconds}秒`;
}

function getDeviceUsageTimezoneOffsetMinutes() {
    try {
        return Number(new Date().getTimezoneOffset()) || 0;
    } catch (error) {
        return 0;
    }
}

function buildDeviceUsageShortcutTemplate(state, appName = '微信') {
    const syncState = state || getDeviceUsageSyncState();
    const base = String(syncState.apiBaseUrl || '').trim().replace(/\/$/, '');
    if (!base) return '请先填写后端地址，保存后这里会生成 iPhone / Android 自动化 URL 模板。';
    const safeAppName = encodeURIComponent(String(appName || '微信').trim() || '微信');
    const params = new URLSearchParams({
        userId: syncState.userId || DEVICE_USAGE_SYNC_DEFAULTS.userId,
        deviceId: syncState.deviceId || DEVICE_USAGE_SYNC_DEFAULTS.deviceId,
        secret: syncState.secret || 'YOUR_SECRET',
        tzOffsetMinutes: String(getDeviceUsageTimezoneOffsetMinutes())
    });
    return `${base}/api/screentime/toggle/${safeAppName}?${params.toString()}`;
}

function buildDeviceUsageAndroidTemplate(state, appName = '{app_name}') {
    const syncState = state || getDeviceUsageSyncState();
    const base = String(syncState.apiBaseUrl || '').trim().replace(/\/$/, '');
    if (!base) return '请先填写后端地址，保存后这里会生成 iPhone / Android 自动化 URL 模板。';
    const params = new URLSearchParams({
        userId: syncState.userId || DEVICE_USAGE_SYNC_DEFAULTS.userId,
        deviceId: syncState.deviceId || DEVICE_USAGE_SYNC_DEFAULTS.deviceId,
        secret: syncState.secret || 'YOUR_SECRET',
        tzOffsetMinutes: String(getDeviceUsageTimezoneOffsetMinutes())
    });
    const rawAppName = String(appName || '{app_name}').trim() || '{app_name}';
    const safeAppName = /^\{.+\}$/.test(rawAppName) ? rawAppName : encodeURIComponent(rawAppName);
    return `${base}/api/screentime/toggle?appName=${safeAppName}&${params.toString()}`;
}

function buildDeviceUsageTemplatePreviewMarkup(state) {
    const iosTemplate = buildDeviceUsageShortcutTemplate(state);
    const androidTemplate = buildDeviceUsageAndroidTemplate(state);
    return `
        <div style="margin-top: 12px; display:flex; flex-direction:column; gap:10px;">
            <div>
                <div style="font-size: 12px; color: #777; margin-bottom: 6px;">iPhone 快捷指令</div>
                <div style="padding: 12px; border-radius: 12px; background: #f6f7fb; font-size: 12px; color: #555; line-height: 1.6; white-space: pre-wrap; word-break: break-all;">${escapeLookusHtml(iosTemplate)}</div>
            </div>
            <div>
                <div style="font-size: 12px; color: #777; margin-bottom: 6px;">Android MacroDroid</div>
                <div style="padding: 12px; border-radius: 12px; background: #f6f7fb; font-size: 12px; color: #555; line-height: 1.6; white-space: pre-wrap; word-break: break-all;">${escapeLookusHtml(androidTemplate)}</div>
            </div>
        </div>
    `;
}

function buildDeviceUsageSummaryCacheKey(state) {
    const syncState = state || getDeviceUsageSyncState();
    return [syncState.apiBaseUrl, syncState.userId, syncState.deviceId, syncState.secret].join('|');
}

function buildDeviceUsageApiUrl(pathname, state) {
    const syncState = state || getDeviceUsageSyncState();
    const base = String(syncState.apiBaseUrl || '').trim().replace(/\/$/, '');
    if (!base) throw new Error('请先配置真实手机使用同步的后端地址');
    const url = new URL(`${base}${pathname}`);
    url.searchParams.set('userId', syncState.userId || DEVICE_USAGE_SYNC_DEFAULTS.userId);
    url.searchParams.set('deviceId', syncState.deviceId || DEVICE_USAGE_SYNC_DEFAULTS.deviceId);
    url.searchParams.set('secret', syncState.secret || '');
    url.searchParams.set('tzOffsetMinutes', String(getDeviceUsageTimezoneOffsetMinutes()));
    return url;
}

function isDeviceUsageSyncConfigured(state) {
    const syncState = state || getDeviceUsageSyncState();
    return !!(syncState.enabled && syncState.apiBaseUrl && syncState.userId && syncState.deviceId && syncState.secret);
}

async function fetchDeviceUsageSummary(forceRefresh = false) {
    const state = getDeviceUsageSyncState();
    if (!isDeviceUsageSyncConfigured(state)) {
        throw new Error('真实手机使用同步尚未配置完成');
    }

    const now = Date.now();
    const cacheKey = buildDeviceUsageSummaryCacheKey(state);
    if (!forceRefresh && deviceUsageSummaryCache && deviceUsageSummaryCacheKey === cacheKey && (now - Number(state.lastFetchedAt || 0)) < state.cacheTtlMs) {
        return deviceUsageSummaryCache;
    }

    const url = buildDeviceUsageApiUrl('/api/screentime/summary', state);
    const response = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
        throw new Error(String(data && data.error ? data.error : `HTTP ${response.status}`));
    }

    deviceUsageSummaryCache = data;
    deviceUsageSummaryCacheKey = cacheKey;
    state.lastFetchedAt = now;
    return data;
}

async function resetDeviceUsageRemoteState() {
    const state = getDeviceUsageSyncState();
    if (!isDeviceUsageSyncConfigured(state)) {
        throw new Error('真实手机使用同步尚未配置完成');
    }
    const url = buildDeviceUsageApiUrl('/api/screentime/reset-all', state);
    const response = await fetch(url.toString(), { method: 'GET', cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
        throw new Error(String(data && data.error ? data.error : `HTTP ${response.status}`));
    }
    invalidateDeviceUsageSummaryCache();
    return data;
}

function buildDeviceUsagePromptContextText(summary) {
    if (!summary || typeof summary !== 'object') return '';
    const lines = [];
    const topApps = Array.isArray(summary.apps) ? summary.apps.slice(0, 5) : [];
    const recentEvents = Array.isArray(summary.recentEvents) ? summary.recentEvents.slice(0, 5) : [];
    lines.push('【用户真实手机使用】');
    lines.push('以下内容是用户主动授权给你查看的真实设备使用摘要；只在相关时自然引用，不要编造未出现的数据。');
    lines.push(`- 今日总屏幕使用：${formatDeviceUsageDuration(summary.totalScreenTimeMs || 0)}`);
    if (summary.currentApp && summary.currentApp.appName) {
        lines.push(`- 用户现在可能正在使用：${summary.currentApp.appName}（已持续 ${formatDeviceUsageDuration(summary.currentApp.durationMs || 0)}）`);
    }
    if (topApps.length > 0) {
        lines.push('- 今日按 App 汇总：');
        topApps.forEach((item) => {
            lines.push(`  - ${item.appName}：${Number(item.openCount || 0)} 次，共 ${formatDeviceUsageDuration(item.totalDurationMs || 0)}`);
        });
    }
    if (recentEvents.length > 0) {
        lines.push('- 最近行为：');
        recentEvents.forEach((event) => {
            const eventTime = event && event.at ? new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
            if (String(event.type || '') === 'close') {
                lines.push(`  - ${eventTime} 关闭了 ${event.appName}（本次约 ${formatDeviceUsageDuration(event.durationMs || 0)}）`);
            } else {
                lines.push(`  - ${eventTime} 打开了 ${event.appName}`);
            }
        });
    }
    lines.push('如果用户问“我今天微信用了多久/刚刚去干嘛了/哪个 App 用得最多”，优先依据这里的真实数据回答。');
    return lines.join('\n');
}

async function getUserDeviceUsagePromptContext(contactId) {
    if (!isDeviceUsageSharedWithContact(contactId)) return '';
    const state = getDeviceUsageSyncState();
    if (!isDeviceUsageSyncConfigured(state)) return '';
    try {
        const summary = await fetchDeviceUsageSummary(false);
        return buildDeviceUsagePromptContextText(summary);
    } catch (error) {
        console.warn('[device-usage] prompt context unavailable', error);
        return '';
    }
}

function buildDeviceUsageCardMarkup(summary, options = {}) {
    const state = getDeviceUsageSyncState();
    const errorMessage = String(options.error || '').trim();
    const templatePreviewMarkup = buildDeviceUsageTemplatePreviewMarkup(state);
    if (!isDeviceUsageSyncConfigured(state)) {
        return `
            <div class="lookus-card-title">你的真实手机使用</div>
            <div style="font-size: 13px; color: #666; line-height: 1.7; margin-top: 12px;">
                还没有接入真实手机使用同步。配置 iPhone 快捷指令或 Android MacroDroid 后，这里会显示今日总时长、Top App 和最近行为。
            </div>
            ${templatePreviewMarkup}
        `;
    }

    if (errorMessage) {
        return `
            <div class="lookus-card-title">你的真实手机使用</div>
            <div style="font-size: 13px; color: #d32f2f; line-height: 1.7; margin-top: 12px;">同步失败：${escapeLookusHtml(errorMessage)}</div>
            ${templatePreviewMarkup}
        `;
    }

    const topApps = Array.isArray(summary && summary.apps) ? summary.apps.slice(0, 3) : [];
    const recentEvents = Array.isArray(summary && summary.recentEvents) ? summary.recentEvents.slice(0, 3) : [];
    const currentText = summary && summary.currentApp && summary.currentApp.appName
        ? `${escapeLookusHtml(summary.currentApp.appName)} · ${escapeLookusHtml(formatDeviceUsageDuration(summary.currentApp.durationMs || 0))}`
        : '当前未检测到打开中的 App';

    return `
        <div class="lookus-card-title">你的真实手机使用</div>
        <div style="display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 14px;">
            <div style="padding: 12px; border-radius: 14px; background: #f7f7fa;">
                <div style="font-size: 12px; color: #777;">今日总时长</div>
                <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">${escapeLookusHtml(formatDeviceUsageDuration(summary && summary.totalScreenTimeMs || 0))}</div>
            </div>
            <div style="padding: 12px; border-radius: 14px; background: #f7f7fa;">
                <div style="font-size: 12px; color: #777;">当前正在使用</div>
                <div style="font-size: 14px; font-weight: 700; margin-top: 4px; line-height: 1.4;">${currentText}</div>
            </div>
        </div>
        <div style="margin-top: 14px; font-size: 12px; color: #777;">今日 Top App</div>
        <div style="margin-top: 8px; display:flex; flex-direction:column; gap:8px;">
            ${topApps.length > 0 ? topApps.map((item, index) => `
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding: 10px 12px; border-radius: 12px; background: #fafafa;">
                    <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                        <div style="width:24px; height:24px; border-radius:999px; background:#111; color:#fff; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700;">${index + 1}</div>
                        <div style="min-width:0;">
                            <div style="font-size:14px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeLookusHtml(item.appName)}</div>
                            <div style="font-size:12px; color:#888; margin-top:2px;">${Number(item.openCount || 0)} 次打开</div>
                        </div>
                    </div>
                    <div style="font-size:13px; font-weight:600; color:#111; white-space:nowrap;">${escapeLookusHtml(formatDeviceUsageDuration(item.totalDurationMs || 0))}</div>
                </div>
            `).join('') : '<div style="color:#999; font-size:13px;">今天还没有同步到任何 App 使用记录。</div>'}
        </div>
        <div style="margin-top: 14px; font-size: 12px; color: #777;">最近行为</div>
        <div style="margin-top: 8px; display:flex; flex-direction:column; gap:8px;">
            ${recentEvents.length > 0 ? recentEvents.map((event) => {
                const eventTime = event && event.at ? new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                const eventText = String(event.type || '') === 'close'
                    ? `关闭了 ${event.appName} · ${formatDeviceUsageDuration(event.durationMs || 0)}`
                    : `打开了 ${event.appName}`;
                return `
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 12px; border-radius:12px; background:#fafafa;">
                        <div style="font-size:13px; color:#222; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeLookusHtml(eventText)}</div>
                        <div style="font-size:12px; color:#999; white-space:nowrap;">${escapeLookusHtml(eventTime)}</div>
                    </div>
                `;
            }).join('') : '<div style="color:#999; font-size:13px;">暂时没有最近行为。</div>'}
        </div>
    `;
}

function buildDeviceUsageReportMarkup(summary, options = {}) {
    const state = getDeviceUsageSyncState();
    const errorMessage = String(options.error || '').trim();
    const templatePreviewMarkup = buildDeviceUsageTemplatePreviewMarkup(state);
    if (!isDeviceUsageSyncConfigured(state)) {
        return `
            <div class="lookus-report-item" style="display:block; margin-bottom: 18px; background: #f7f7fa;">
                <div style="font-size: 15px; font-weight: 700; color: #111; margin-bottom: 8px;">真实手机使用</div>
                <div style="font-size: 13px; color: #666; line-height: 1.7;">未配置真实手机使用同步。保存后可在 iPhone 快捷指令或 Android MacroDroid 里直接使用下面的 URL 模板。</div>
                ${templatePreviewMarkup}
            </div>
        `;
    }
    if (errorMessage) {
        return `
            <div class="lookus-report-item" style="display:block; margin-bottom: 18px; background: rgba(255,59,48,0.08); border: 1px solid rgba(255,59,48,0.12);">
                <div style="font-size: 15px; font-weight: 700; color: #111; margin-bottom: 8px;">真实手机使用</div>
                <div style="font-size: 13px; color: #d32f2f; line-height: 1.7;">同步失败：${escapeLookusHtml(errorMessage)}</div>
                ${templatePreviewMarkup}
            </div>
        `;
    }
    const recentEvents = Array.isArray(summary && summary.recentEvents) ? summary.recentEvents.slice(0, 10) : [];
    return `
        <div class="lookus-report-item" style="display:block; margin-bottom: 18px; background: #f7f7fa;">
            <div style="font-size: 15px; font-weight: 700; color: #111; margin-bottom: 8px;">真实手机使用</div>
            <div style="font-size: 13px; color: #666; line-height: 1.7;">今日总使用 ${escapeLookusHtml(formatDeviceUsageDuration(summary && summary.totalScreenTimeMs || 0))}${summary && summary.currentApp && summary.currentApp.appName ? `，当前停留在 ${escapeLookusHtml(summary.currentApp.appName)}` : ''}。</div>
            <div style="margin-top: 10px; display:flex; flex-direction:column; gap:8px;">
                ${recentEvents.length > 0 ? recentEvents.map((event) => {
                    const eventTime = event && event.at ? new Date(event.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                    const eventText = String(event.type || '') === 'close'
                        ? `${eventTime} 关闭 ${event.appName}（${formatDeviceUsageDuration(event.durationMs || 0)}）`
                        : `${eventTime} 打开 ${event.appName}`;
                    return `<div style="padding:10px 12px; border-radius: 12px; background:#fff; font-size:13px; color:#222;">${escapeLookusHtml(eventText)}</div>`;
                }).join('') : '<div style="padding:10px 12px; border-radius: 12px; background:#fff; font-size:13px; color:#999;">今天还没有可展示的最近行为。</div>'}
            </div>
        </div>
    `;
}

async function refreshLookusDeviceUsageUi(forceRefresh = false) {
    const cardHost = document.getElementById('lookus-device-usage-card-host');
    let reportHost = document.getElementById('lookus-device-usage-report-block');
    if (!reportHost) {
        const reportView = document.getElementById('lookus-report-view');
        if (reportView) {
            reportHost = document.createElement('div');
            reportHost.id = 'lookus-device-usage-report-block';
            reportView.insertBefore(reportHost, reportView.firstChild || null);
        }
    }
    if (cardHost) {
        cardHost.innerHTML = '<div class="lookus-card-title">你的真实手机使用</div><div style="font-size:13px;color:#888;margin-top:10px;">正在同步…</div>';
    }
    if (reportHost) {
        reportHost.innerHTML = '<div class="lookus-report-item" style="display:block; margin-bottom:18px; background:#f7f7fa;">正在同步真实手机使用记录…</div>';
    }

    const state = getDeviceUsageSyncState();
    if (!isDeviceUsageSyncConfigured(state)) {
        if (cardHost) cardHost.innerHTML = buildDeviceUsageCardMarkup(null);
        if (reportHost) reportHost.innerHTML = buildDeviceUsageReportMarkup(null);
        return null;
    }

    try {
        const summary = await fetchDeviceUsageSummary(forceRefresh);
        if (cardHost) cardHost.innerHTML = buildDeviceUsageCardMarkup(summary);
        if (reportHost) reportHost.innerHTML = buildDeviceUsageReportMarkup(summary);
        return summary;
    } catch (error) {
        const message = error && error.message ? error.message : '同步失败';
        if (cardHost) cardHost.innerHTML = buildDeviceUsageCardMarkup(null, { error: message });
        if (reportHost) reportHost.innerHTML = buildDeviceUsageReportMarkup(null, { error: message });
        return null;
    }
}

window.getDeviceUsageSyncState = getDeviceUsageSyncState;
window.isDeviceUsageSharedWithContact = isDeviceUsageSharedWithContact;
window.setDeviceUsageSharedWithContact = setDeviceUsageSharedWithContact;
window.getUserDeviceUsagePromptContext = getUserDeviceUsagePromptContext;

// 城市坐标映射表 (经度, 纬度)
const CITY_COORDINATES = {
    // 中国主要城市
    "东城区": [116.416357, 39.928353], "西城区": [116.365868, 39.912289], "朝阳区": [116.443108, 39.921469],
    "丰台区": [116.286968, 39.863642], "石景山区": [116.222982, 39.906611], "海淀区": [116.298056, 39.959912],
    "通州区": [116.656435, 39.909946], "顺义区": [116.654561, 40.130347], "昌平区": [116.231204, 40.220660],
    "大兴区": [116.341395, 39.726929], "怀柔区": [116.631706, 40.316053], "平谷区": [117.121383, 40.140701],
    "密云区": [116.843177, 40.376834], "延庆区": [115.974848, 40.456951], "门头沟区": [116.101719, 39.940338],
    "房山区": [116.143267, 39.747672],
    "黄浦区": [121.469240, 31.229860], "徐汇区": [121.436525, 31.188523], "长宁区": [121.424624, 31.220367],
    "静安区": [121.447453, 31.227906], "普陀区": [121.395555, 31.249840], "虹口区": [121.505133, 31.264600],
    "杨浦区": [121.526077, 31.259541], "闵行区": [121.381709, 31.112813], "宝山区": [121.489612, 31.405457],
    "嘉定区": [121.265300, 31.375602], "浦东新区": [121.544379, 31.221517], "金山区": [121.341970, 30.741991],
    "松江区": [121.227747, 31.032243], "青浦区": [121.124178, 31.150681], "奉贤区": [121.474042, 30.917795],
    "崇明区": [121.397516, 31.622860],
    "广州市": [113.264385, 23.129112], "深圳市": [114.057868, 22.543099], "珠海市": [113.576726, 22.270715],
    "汕头市": [116.681972, 23.354091], "佛山市": [113.121416, 23.021548], "东莞市": [113.751765, 23.020536],
    "中山市": [113.392782, 22.517646], "惠州市": [114.416196, 23.111847],
    "杭州市": [120.153576, 30.287459], "宁波市": [121.549792, 29.868388], "温州市": [120.672111, 28.000575],
    "嘉兴市": [120.750865, 30.762653], "湖州市": [120.102398, 30.867198], "绍兴市": [120.580232, 30.029752],
    "金华市": [119.649506, 29.089524], "台州市": [121.420757, 28.656386],
    "南京市": [118.767413, 32.041544], "无锡市": [120.301663, 31.574729], "徐州市": [117.184811, 34.261792],
    "常州市": [119.946973, 31.772752], "苏州市": [120.619585, 31.299379], "南通市": [120.864608, 32.016212],
    "扬州市": [119.421003, 32.393159],
    "成都市": [104.065735, 30.659462], "重庆市": [106.504962, 29.533155], "武汉市": [114.298572, 30.584355],
    "长沙市": [112.982279, 28.19409], "郑州市": [113.665412, 34.757975], "西安市": [108.948024, 34.263161],
    "济南市": [117.000923, 36.675807], "青岛市": [120.355173, 36.082982], "大连市": [121.618622, 38.914590],
    "沈阳市": [123.429096, 41.796767], "哈尔滨市": [126.642464, 45.756967], "长春市": [125.324501, 43.886841],
    "福州市": [119.306239, 26.075302], "厦门市": [118.11022, 24.490474], "昆明市": [102.712251, 25.040609],
    "贵阳市": [106.713478, 26.578343], "南宁市": [108.320004, 22.82402], "海口市": [110.353899, 20.017120],
    "三亚市": [109.508268, 18.247872], "拉萨市": [91.132212, 29.660361], "乌鲁木齐市": [87.617733, 43.792818],
    "兰州市": [103.823557, 36.058039], "西宁市": [101.778916, 36.623178], "银川市": [106.278179, 38.46637],
    "呼和浩特市": [111.670801, 40.818311], "石家庄市": [114.502461, 38.045474], "太原市": [112.549248, 37.857014],
    "合肥市": [117.283042, 31.86119], "南昌市": [115.892151, 28.676493],
    // 港澳台
    "中西区": [114.154374, 22.281981], "湾仔区": [114.182847, 22.276547], "油尖旺区": [114.173334, 22.311704],
    "台北市": [121.565418, 25.032969], "高雄市": [120.311922, 22.620856],
    // 日本
    "东京都": [139.691706, 35.689487], "神奈川县": [139.642514, 35.447507], "大阪府": [135.502165, 34.693738],
    "京都府": [135.768163, 35.011636], "札幌市": [141.354376, 43.062096], "福冈县": [130.401716, 33.590355],
    "冲绳县": [127.681107, 26.335249], "爱知县": [136.906565, 35.180188],
    // 美国
    "洛杉矶": [-118.243685, 34.052234], "旧金山": [-122.419416, 37.774929], "纽约市": [-74.005941, 40.712784],
    "芝加哥": [-87.629798, 41.878114], "休斯顿": [-95.369803, 29.760427], "西雅图": [-122.332071, 47.606209],
    "波士顿": [-71.058880, 42.360082], "迈阿密": [-80.191790, 25.761680],
    // 韩国
    "首尔特别市": [126.977969, 37.566535], "釜山广域市": [129.075642, 35.179554], "仁川广域市": [126.705206, 37.456256],
    "济州市": [126.531188, 33.499621],
    // 英国
    "伦敦": [-0.127758, 51.507351], "曼彻斯特": [-2.244644, 53.483959], "爱丁堡": [-3.188267, 55.953252],
    // 法国
    "巴黎": [2.352222, 48.856614], "马赛": [5.369780, 43.296482], "里昂": [4.835659, 45.764043],
    // 德国
    "慕尼黑": [11.581981, 48.135125], "柏林": [13.404954, 52.520007], "法兰克福": [8.682127, 50.110922],
    // 澳大利亚
    "悉尼": [151.209296, -33.868820], "墨尔本": [144.963058, -37.813628], "布里斯班": [153.025131, -27.469771],
    // 加拿大
    "多伦多": [-79.383184, 43.653226], "温哥华": [-123.120738, 49.282729], "蒙特利尔": [-73.567256, 45.501689],
    // 俄罗斯
    "莫斯科": [37.617300, 55.755826], "圣彼得堡": [30.315868, 59.939095]
};

// Haversine 公式计算两点间真实距离 (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径 km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 根据联系人位置设置获取坐标
function getContactCoordinates(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact || !contact.location) return null;
    
    const loc = contact.location;
    // 优先按城市查找，再按省份查找
    if (loc.city && CITY_COORDINATES[loc.city]) {
        return CITY_COORDINATES[loc.city];
    }
    if (loc.province && CITY_COORDINATES[loc.province]) {
        return CITY_COORDINATES[loc.province];
    }
return null;
}

function getLookusSeed(contact) {
    const basis = `${contact?.id || ''}::${contact?.remark || ''}::${contact?.name || ''}::${contact?.persona || ''}`;
    let seed = 0;
    for (let i = 0; i < basis.length; i++) {
        seed = ((seed << 5) - seed) + basis.charCodeAt(i);
        seed |= 0;
    }
    return Math.abs(seed);
}

function pickSeededLookusModel(models, seed) {
    if (!Array.isArray(models) || models.length === 0) return '未知型号';
    return models[seed % models.length];
}

const LOOKUS_DEVICE_MODEL_MATCHERS = [
    { model: 'iPhone 16 Pro Max', regex: /(?:iphone|苹果)\s*16\s*pro\s*max/i },
    { model: 'iPhone 16 Pro', regex: /(?:iphone|苹果)\s*16\s*pro(?!\s*max)/i },
    { model: 'iPhone 16 Plus', regex: /(?:iphone|苹果)\s*16\s*plus/i },
    { model: 'iPhone 16', regex: /(?:iphone|苹果)\s*16(?!\s*(?:pro|max|plus))/i },
    { model: 'iPhone 15 Pro Max', regex: /(?:iphone|苹果)\s*15\s*pro\s*max/i },
    { model: 'iPhone 15 Pro', regex: /(?:iphone|苹果)\s*15\s*pro(?!\s*max)/i },
    { model: 'iPhone 15 Plus', regex: /(?:iphone|苹果)\s*15\s*plus/i },
    { model: 'iPhone 15', regex: /(?:iphone|苹果)\s*15(?!\s*(?:pro|max|plus))/i },
    { model: 'iPhone 14 Pro Max', regex: /(?:iphone|苹果)\s*14\s*pro\s*max/i },
    { model: 'iPhone 14 Pro', regex: /(?:iphone|苹果)\s*14\s*pro(?!\s*max)/i },
    { model: 'iPhone 14 Plus', regex: /(?:iphone|苹果)\s*14\s*plus/i },
    { model: 'iPhone 14', regex: /(?:iphone|苹果)\s*14(?!\s*(?:pro|max|plus))/i },
    { model: 'iPhone 13 mini', regex: /(?:iphone|苹果)\s*13\s*mini/i },
    { model: 'iPhone 13 Pro Max', regex: /(?:iphone|苹果)\s*13\s*pro\s*max/i },
    { model: 'iPhone 13 Pro', regex: /(?:iphone|苹果)\s*13\s*pro(?!\s*max)/i },
    { model: 'iPhone 13', regex: /(?:iphone|苹果)\s*13(?!\s*(?:pro|max|mini))/i },
    { model: 'iPhone SE 3', regex: /(?:iphone|苹果)\s*se\s*(?:3|第三代)?/i },
    { model: 'Huawei Mate 70 Pro', regex: /(?:huawei|华为)\s*mate\s*70\s*pro/i },
    { model: 'Huawei Mate 60 Pro', regex: /(?:huawei|华为)\s*mate\s*60\s*pro/i },
    { model: 'Huawei Pura 70 Ultra', regex: /(?:huawei|华为)\s*(?:pura|p)\s*70\s*ultra/i },
    { model: 'Huawei Pura 70 Pro', regex: /(?:huawei|华为)\s*(?:pura|p)\s*70\s*pro/i },
    { model: 'Huawei nova 12 Ultra', regex: /(?:huawei|华为)\s*nova\s*12\s*ultra/i },
    { model: 'Huawei nova 12 Pro', regex: /(?:huawei|华为)\s*nova\s*12\s*pro/i },
    { model: 'Huawei nova 12', regex: /(?:huawei|华为)\s*nova\s*12(?!\s*(?:pro|ultra))/i },
    { model: 'Samsung Galaxy S24 Ultra', regex: /(?:samsung|三星)(?:\s*galaxy)?\s*s\s*24\s*ultra/i },
    { model: 'Samsung Galaxy S24+', regex: /(?:samsung|三星)(?:\s*galaxy)?\s*s\s*24\s*(?:\+|plus)/i },
    { model: 'Samsung Galaxy S24', regex: /(?:samsung|三星)(?:\s*galaxy)?\s*s\s*24(?!\s*(?:ultra|\+|plus))/i },
    { model: 'Xiaomi 15 Ultra', regex: /(?:xiaomi|小米)\s*15\s*ultra/i },
    { model: 'Xiaomi 15 Pro', regex: /(?:xiaomi|小米)\s*15\s*pro/i },
    { model: 'Xiaomi 15', regex: /(?:xiaomi|小米)\s*15(?!\s*(?:pro|ultra))/i },
    { model: 'Xiaomi 14 Ultra', regex: /(?:xiaomi|小米)\s*14\s*ultra/i },
    { model: 'Xiaomi 14 Pro', regex: /(?:xiaomi|小米)\s*14\s*pro/i },
    { model: 'Xiaomi 14', regex: /(?:xiaomi|小米)\s*14(?!\s*(?:pro|ultra))/i },
    { model: 'Xiaomi Civi 4 Pro', regex: /(?:xiaomi|小米)\s*civi\s*4\s*pro/i },
    { model: 'Redmi K70 Pro', regex: /(?:redmi|红米)\s*k\s*70\s*pro/i },
    { model: 'Redmi K70', regex: /(?:redmi|红米)\s*k\s*70(?!\s*pro)/i },
    { model: 'Redmi Note 13 Pro', regex: /(?:redmi|红米)\s*note\s*13\s*pro(?:\+)?/i },
    { model: 'Redmi Note 13', regex: /(?:redmi|红米)\s*note\s*13(?!\s*pro)/i },
    { model: 'OnePlus 13', regex: /(?:oneplus|一加)\s*13(?!\s*(?:pro|r))/i },
    { model: 'OnePlus 12', regex: /(?:oneplus|一加)\s*12(?!\s*(?:pro|r))/i },
    { model: 'OnePlus Ace 5 Pro', regex: /(?:oneplus|一加)\s*ace\s*5\s*pro/i },
    { model: 'OnePlus Ace 5', regex: /(?:oneplus|一加)\s*ace\s*5(?!\s*pro)/i },
    { model: 'OnePlus Ace 3 Pro', regex: /(?:oneplus|一加)\s*ace\s*3\s*pro/i },
    { model: 'OnePlus Ace 3', regex: /(?:oneplus|一加)\s*ace\s*3(?!\s*pro)/i },
    { model: 'OPPO Find X8 Ultra', regex: /oppo\s*find\s*x\s*8\s*ultra/i },
    { model: 'OPPO Find X8 Pro', regex: /oppo\s*find\s*x\s*8\s*pro/i },
    { model: 'OPPO Find X8', regex: /oppo\s*find\s*x\s*8(?!\s*(?:pro|ultra))/i },
    { model: 'OPPO Find X7 Ultra', regex: /oppo\s*find\s*x\s*7\s*ultra/i },
    { model: 'OPPO Find X7', regex: /oppo\s*find\s*x\s*7(?!\s*ultra)/i },
    { model: 'OPPO Reno13 Pro', regex: /oppo\s*reno\s*13\s*pro/i },
    { model: 'OPPO Reno13', regex: /oppo\s*reno\s*13(?!\s*pro)/i },
    { model: 'OPPO Reno12 Pro', regex: /oppo\s*reno\s*12\s*pro/i },
    { model: 'OPPO Reno12', regex: /oppo\s*reno\s*12(?!\s*pro)/i },
    { model: 'OPPO A3 Pro', regex: /oppo\s*a\s*3\s*pro/i },
    { model: 'vivo X200 Pro', regex: /vivo\s*x\s*200\s*pro/i },
    { model: 'vivo X100 Pro', regex: /vivo\s*x\s*100\s*pro/i },
    { model: 'vivo S18 Pro', regex: /vivo\s*s\s*18\s*pro/i },
    { model: 'vivo S18', regex: /vivo\s*s\s*18(?!\s*pro)/i },
    { model: 'iQOO 13', regex: /(?:iqoo|爱酷)\s*13/i },
    { model: 'iQOO 12', regex: /(?:iqoo|爱酷)\s*12/i },
    { model: 'iQOO Neo9 Pro', regex: /(?:iqoo|爱酷)\s*neo\s*9\s*pro/i },
    { model: 'iQOO Neo9', regex: /(?:iqoo|爱酷)\s*neo\s*9(?!\s*pro)/i },
    { model: 'Honor 200 Pro', regex: /(?:honor|荣耀)\s*200\s*pro/i },
    { model: 'Honor 200', regex: /(?:honor|荣耀)\s*200(?!\s*pro)/i },
    { model: 'Honor 90 GT', regex: /(?:honor|荣耀)\s*90\s*gt/i },
    { model: 'Honor X50', regex: /(?:honor|荣耀)\s*x\s*50/i },
    { model: 'RedMagic 9 Pro', regex: /(?:redmagic|红魔)\s*9\s*pro/i },
    { model: 'ROG Phone 8', regex: /rog\s*phone\s*8/i },
    { model: 'realme GT5 Pro', regex: /(?:realme|真我)\s*gt\s*5\s*pro/i }
];

function normalizeLookusDeviceModel(model) {
    return String(model || '')
        .replace(/[“”"'`]/g, '')
        .replace(/[（(][^()（）]{0,20}[)）]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getLookusHistoryMessageText(msg) {
    if (!msg) return '';

    const type = String(msg.type || 'text');
    if (type === 'image' || type === 'virtual_image' || type === 'sticker' || type === 'transfer') {
        return '';
    }

    if (type === 'voice' || type === 'voice_call_text') {
        try {
            const data = JSON.parse(msg.content);
            return String(data && data.text ? data.text : '').trim();
        } catch (e) {
            return '';
        }
    }

    return typeof msg.content === 'string' ? msg.content.trim() : '';
}

function findLookusDeviceModelCandidates(text) {
    const source = normalizeLookusDeviceModel(text);
    if (!source) return [];

    const matches = [];
    LOOKUS_DEVICE_MODEL_MATCHERS.forEach(({ model, regex }) => {
        const flags = regex.flags.includes('g') ? regex.flags : `${regex.flags}g`;
        const globalRegex = new RegExp(regex.source, flags);
        let match;
        while ((match = globalRegex.exec(source)) !== null) {
            matches.push({
                model,
                index: match.index,
                length: match[0].length
            });
            if (!match[0]) break;
        }
    });

    const seen = new Set();
    return matches
        .sort((a, b) => a.index - b.index || b.length - a.length)
        .filter(match => {
            const key = `${match.index}:${match.model}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

function extractLookusDeviceModelFromText(text) {
    const matches = findLookusDeviceModelCandidates(text);
    return matches.length ? matches[matches.length - 1].model : null;
}

function isExplicitLookusDeviceStatement(text) {
    const source = String(text || '').trim();
    if (!source) return false;

    const positivePatterns = [
        /(我|我的|我这|我现在|我最近|我刚|本人).{0,12}(换了|换成|刚换|买了|刚买|入手|现在用|目前用|用的是|手机是|拿的是|在用|机型|型号)/i,
        /(新手机|这手机|现在这台|目前用的|手机型号).{0,8}(是|换成|用了|用的是|就是)/i,
        /^(换成|刚换成|刚换了|刚买了|刚入手了|现在用的是|目前用的是|手机是|机型是|型号是)/i,
        /(最近|前两天|这两天).{0,8}(换了|换成|买了|入手)/i
    ];
    const negativePatterns = [
        /(你|给你|帮你|让你|叫你).{0,12}(换成|买|入手|用|拿)/i,
        /(推荐|安利|建议).{0,12}(给你|你|你们)?/i
    ];

    if (negativePatterns.some(regex => regex.test(source))) return false;
    return positivePatterns.some(regex => regex.test(source));
}

function isLookusDeviceChangeStatement(text) {
    const source = String(text || '').trim();
    if (!source) return false;

    const positivePatterns = [
        /(我|我的|我这|我现在|我最近|我刚|本人).{0,12}(换了手机|换手机|刚换机|换机了|换新机|换新手机|买了新手机|刚买新手机|入手了新手机)/i,
        /(最近|前两天|这两天).{0,8}(换了手机|换机|换新机|买了新手机|入手了新手机)/i,
        /^(刚换了手机|刚换机|换机了|换新手机了|买了新手机|入手了新手机)/i
    ];
    const negativePatterns = [
        /(你|给你|帮你|让你|叫你).{0,12}(换成|买|入手|用|拿)/i,
        /(推荐|安利|建议).{0,12}(给你|你|你们)?/i
    ];

    if (negativePatterns.some(regex => regex.test(source))) return false;
    return positivePatterns.some(regex => regex.test(source));
}

function extractExplicitLookusDeviceModelFromHistory(history) {
    if (!Array.isArray(history) || history.length === 0) return null;

    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (!msg || String(msg.role || '').toLowerCase() !== 'assistant') continue;

        const text = getLookusHistoryMessageText(msg);
        if (!text || !isExplicitLookusDeviceStatement(text)) continue;

        const model = extractLookusDeviceModelFromText(text);
        if (!model) continue;

        return {
            model,
            text,
            time: Number(msg.time) || 0,
            index: i,
            messageId: msg.id || null
        };
    }

    return null;
}

function extractLookusDeviceChangeSignalFromHistory(history) {
    if (!Array.isArray(history) || history.length === 0) return null;

    for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (!msg || String(msg.role || '').toLowerCase() !== 'assistant') continue;

        const text = getLookusHistoryMessageText(msg);
        if (!text || !isLookusDeviceChangeStatement(text)) continue;

        return {
            text,
            time: Number(msg.time) || 0,
            index: i,
            messageId: msg.id || null
        };
    }

    return null;
}

function syncLookusDeviceModelFromChatHistory(contact, history, explicitEvidence) {
    if (!contact) return false;

    const evidence = explicitEvidence || extractExplicitLookusDeviceModelFromHistory(history);
    if (!evidence || !evidence.model) return false;

    const nextModel = normalizeLookusDeviceModel(evidence.model);
    const currentModel = normalizeLookusDeviceModel(contact.deviceModel);
    const sameModel = currentModel && currentModel.toLowerCase() === nextModel.toLowerCase();

    if (sameModel && contact.lookusDeviceModelVersion >= 3) return false;

    contact.deviceModel = nextModel;
    contact.lookusDeviceModelVersion = 3;
    if (contact.lookusData) {
        contact.lookusData.device = nextModel;
    }
    return true;
}

function inferLookusDeviceModel(contact) {
    const personaText = String([
        contact?.persona || '',
        contact?.remark || '',
        contact?.name || '',
        contact?.occupation || '',
        contact?.identity || ''
    ].join(' ')).toLowerCase();
    const seed = getLookusSeed(contact);

    const luxuryKeywords = /(富二代|豪门|总裁|ceo|老板|财阀|千金|少爷|富有|有钱|名媛|高管|明星|艺人|投资人)/i;
    const businessKeywords = /(律师|医生|商务|金融|白领|总监|经理|老师|教授|精英|成熟|稳重|职业)/i;
    const gamerKeywords = /(游戏|电竞|二次元|宅|数码控|发烧友|geek|极客|程序员|开发|代码)/i;
    const studentKeywords = /(学生|大学|高中|研究生|实习|打工|穷|拮据|省钱|节俭|校园)/i;
    const appleKeywords = /(苹果|iphone|ios|果粉)/i;
    const lifestyleKeywords = /(博主|摄影|拍照|时尚|穿搭|美妆|vlog|旅行|生活方式)/i;

    let modelPool = [
        'Xiaomi 14',
        'OnePlus 12',
        'Huawei nova 12',
        'OPPO Reno12',
        'vivo S18',
        'Honor 90 GT'
    ];

    if (luxuryKeywords.test(personaText)) {
        modelPool = [
            'iPhone 16 Pro Max',
            'iPhone 15 Pro Max',
            'Huawei Mate 70 Pro',
            'Samsung Galaxy S24 Ultra',
            'Xiaomi 15 Ultra',
            'vivo X200 Pro'
        ];
    } else if (businessKeywords.test(personaText)) {
        modelPool = [
            'Huawei Mate 60 Pro',
            'iPhone 15 Pro',
            'Samsung Galaxy S24',
            'Xiaomi 14 Pro',
            'OPPO Find X7',
            'vivo X100 Pro'
        ];
    } else if (studentKeywords.test(personaText)) {
        modelPool = [
            'Redmi K70',
            'Redmi Note 13 Pro',
            'iQOO Neo9',
            'OnePlus Ace 3',
            'Honor X50',
            'OPPO A3 Pro'
        ];
    } else if (gamerKeywords.test(personaText)) {
        modelPool = [
            'RedMagic 9 Pro',
            'ROG Phone 8',
            'iQOO 12',
            'OnePlus Ace 3 Pro',
            'Redmi K70 Pro',
            'realme GT5 Pro'
        ];
    } else if (lifestyleKeywords.test(personaText)) {
        modelPool = [
            'Xiaomi Civi 4 Pro',
            'vivo S18 Pro',
            'OPPO Reno12 Pro',
            'iPhone 15',
            'Huawei nova 12 Ultra',
            'Honor 200 Pro'
        ];
    } else if (appleKeywords.test(personaText)) {
        modelPool = [
            'iPhone 15',
            'iPhone 15 Pro',
            'iPhone 14',
            'iPhone 13 mini',
            'iPhone SE 3',
            'iPhone 16'
        ];
    }

    return pickSeededLookusModel(modelPool, seed);
}

function shouldRefreshLegacyLookusDeviceModel(contact) {
    if (!contact) return false;
    if (!contact.deviceModel) return true;
    if (contact.lookusDeviceModelVersion >= 2) return false;

    const model = String(contact.deviceModel || '').trim();
    return /^(iPhone|iPhone 15|iPhone 15 Pro|iPhone 15 Pro Max)(?:\b|$)/i.test(model);
}

function ensureLookusDeviceModel(contact, history, explicitEvidence) {
    if (!contact) return false;

    let changed = false;
    if (shouldRefreshLegacyLookusDeviceModel(contact)) {
        contact.deviceModel = inferLookusDeviceModel(contact);
        contact.lookusDeviceModelVersion = 2;
        if (contact.lookusData) {
            contact.lookusData.device = contact.deviceModel;
        }
        changed = true;
    }

    if (syncLookusDeviceModelFromChatHistory(
        contact,
        Array.isArray(history)
            ? history
            : ((window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contact.id]) || []),
        explicitEvidence
    )) {
        changed = true;
    }

    if (contact.deviceModel && contact.lookusData && contact.lookusData.device !== contact.deviceModel) {
        contact.lookusData.device = contact.deviceModel;
        changed = true;
    }

    return changed;
}

function initLookusApp() {
    let deviceModelChanged = false;
    (window.iphoneSimState.contacts || []).forEach(contact => {
        if (ensureLookusDeviceModel(contact)) deviceModelChanged = true;
    });
    if (deviceModelChanged && typeof saveConfig === 'function') {
        saveConfig();
    }
    // 绑定顶部点击事件
    const headerBadge = document.getElementById('lookus-header-time-badge');
    if (headerBadge) {
        headerBadge.addEventListener('click', openLookusContactPicker);
    }

    // Initial check for current contact
    if (currentLookusContactId) {
        const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
        if (contact) {
            checkAndRefreshLookusData(contact);
        }
    }

    setupAmapSettings();
    loadAmap();

    renderLookusApp();
    updateLookusTime();
    setupLookusTimers();
    
    // Update time display every second (if using live time)
    setInterval(updateLookusTime, 1000);
}

function setupAmapSettings() {
    const jsKeyInput = document.getElementById('amap-js-key');
    const webKeyInput = document.getElementById('amap-web-key');
    const codeInput = document.getElementById('amap-security-code');
    const settings = window.iphoneSimState.amapSettings || {};
    const legacyKey = String(settings.key || '').trim();

    if (jsKeyInput) {
        jsKeyInput.value = String(settings.jsKey || legacyKey || '').trim();
        jsKeyInput.addEventListener('change', (e) => {
            if (!window.iphoneSimState.amapSettings) window.iphoneSimState.amapSettings = {};
            window.iphoneSimState.amapSettings.jsKey = e.target.value.trim();
            saveConfig();
            loadAmap(); // Reload if key changes
            renderLookusApp(); // Re-render to show/hide map container
        });
    }

    if (webKeyInput) {
        webKeyInput.value = String(settings.webKey || legacyKey || '').trim();
        webKeyInput.addEventListener('change', (e) => {
            if (!window.iphoneSimState.amapSettings) window.iphoneSimState.amapSettings = {};
            window.iphoneSimState.amapSettings.webKey = e.target.value.trim();
            saveConfig();
        });
    }

    if (codeInput) {
        codeInput.value = settings.securityCode || '';
        codeInput.addEventListener('change', (e) => {
            if (!window.iphoneSimState.amapSettings) window.iphoneSimState.amapSettings = {};
            window.iphoneSimState.amapSettings.securityCode = e.target.value.trim();
            saveConfig();
        });
    }
}

function loadAmap() {
    const settings = window.iphoneSimState.amapSettings;
    const jsKey = String((settings && (settings.jsKey || settings.key)) || '').trim();
    if (!jsKey) return;

    if (window.AMap) {
        return;
    }

    if (settings.securityCode) {
        window._AMapSecurityConfig = {
            securityJsCode: settings.securityCode,
        };
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${jsKey}&plugin=AMap.Geolocation,AMap.Geocoder`;
    script.async = true;
    script.onload = () => {
        console.log('AMap loaded');
        if (!document.getElementById('lookus-app').classList.contains('hidden')) {
            initRealMap();
        }
    };
    document.head.appendChild(script);
}

function initRealMap() {
    const container = document.getElementById('lookus-map-container');
    if (!container || !window.AMap) return;

    if (amapInstance) {
        getCurrentLocation();
        return;
    }

    try {
        amapInstance = new AMap.Map('lookus-map-container', {
            resizeEnable: true,
            zoom: 15,
            center: [116.397428, 39.90923]
        });

        getCurrentLocation();
    } catch (e) {
        console.error('Map init error:', e);
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">地图加载失败</div>';
    }
}

function getCurrentLocation() {
    if (!amapInstance || !window.AMap) return;

    const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        zoomToAccuracy: true
    });

    geolocation.getCurrentPosition((status, result) => {
        if (status === 'complete') {
            onLocationSuccess(result);
        } else {
            console.error('Geolocation failed:', result);
        }
    });
}

function onLocationSuccess(data) {
    const position = data.position;
    currentUserLocation = {
        lat: position.lat,
        lng: position.lng,
        address: data.formattedAddress
    };

    if (amapInstance) {
        amapInstance.setCenter(position);
        
        if (amapMarker) {
            amapMarker.setPosition(position);
        } else {
            amapMarker = new AMap.Marker({
                position: position,
                map: amapInstance,
                icon: new AMap.Icon({
                    size: new AMap.Size(25, 34),
                    image: '//a.amap.com/jsapi_demos/static/demo-center/icons/dir-marker.png',
                    imageSize: new AMap.Size(135, 40),
                    imageOffset: new AMap.Pixel(-9, -3)
                })
            });
        }
        
        // Show contact marker and connection line if contact location is available
        showContactOnMap();
    }
    
    // Re-render to update distance
    renderLookusApp();
}

// Show contact's location marker and connection line on the map
function showContactOnMap() {
    if (!amapInstance || !window.AMap) {
        console.log('[LookUs Map] showContactOnMap: map not ready');
        return;
    }
    if (!currentLookusContactId) {
        console.log('[LookUs Map] showContactOnMap: no contact selected');
        return;
    }
    
    // Debug: check contact location data
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    if (contact) {
        console.log('[LookUs Map] Contact:', contact.remark || contact.name, 'Location:', JSON.stringify(contact.location));
    }
    
    const contactCoords = getContactCoordinates(currentLookusContactId);
    if (!contactCoords) {
        console.log('[LookUs Map] No coordinates found for contact. Make sure the contact has a location set in chat settings (国家/省份/城市)');
        return;
    }
    console.log('[LookUs Map] Contact coordinates:', contactCoords);
    
    const contactLng = contactCoords[0];
    const contactLat = contactCoords[1];
    
    // Remove old contact marker and polyline
    if (amapContactMarker) {
        amapContactMarker.setMap(null);
        amapContactMarker = null;
    }
    if (amapPolyline) {
        amapPolyline.setMap(null);
        amapPolyline = null;
    }
    
    // Add contact marker (red)
    const contactName = contact ? (contact.remark || contact.name) : '联系人';
    
    amapContactMarker = new AMap.Marker({
        position: [contactLng, contactLat],
        map: amapInstance,
        label: {
            content: `<div style="background:#000;color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;white-space:nowrap;border:none;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${contactName}</div>`,
            direction: 'top',
            offset: new AMap.Pixel(0, -5)
        }
    });
    
    // Draw connection line between user and contact if user location is available
    if (currentUserLocation) {
        amapPolyline = new AMap.Polyline({
            path: [
                [currentUserLocation.lng, currentUserLocation.lat],
                [contactLng, contactLat]
            ],
            strokeColor: '#000000',
            strokeWeight: 2,
            strokeStyle: 'dashed',
            strokeOpacity: 0.4,
            map: amapInstance
        });
        
        // Fit map to show both markers
        amapInstance.setFitView([amapMarker, amapContactMarker], false, [50, 50, 50, 50]);
    } else {
        // Center on contact location if no user location
        amapInstance.setCenter([contactLng, contactLat]);
        amapInstance.setZoom(12);
    }
}

function isSameDay(timestamp) {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
           date.getMonth() === now.getMonth() &&
           date.getDate() === now.getDate();
}

async function checkAndRefreshLookusData(contact) {
    const deviceModelChanged = ensureLookusDeviceModel(contact);
    if (deviceModelChanged && contact.lookusData && isSameDay(contact.lookusData.lastUpdateTime)) {
        saveConfig();
    }

    if (!contact.lookusData || !isSameDay(contact.lookusData.lastUpdateTime)) {
        console.log(`Resetting Lookus data for ${contact.name} (New Day or First Load)`);
        
        // Reset to initial state (Zeroed out)
        contact.lookusData = {
            distance: '--',
            battery: '--%',
            network: '未知',
            // Use existing device model if available, otherwise keep unknown until inferred
            device: contact.deviceModel || '未知型号', 
            screenTimeH: 0,
            screenTimeM: 0,
            unlockCount: '0次',
            lastUnlock: '未知',
            stops: 0,
            stopList: [],
            appList: [],
            netLog: [],
            reportLog: [],
            lastUpdateTime: 0 // Mark as 0 so we know it's pending update
        };
        saveConfig();
        renderLookusApp(); // Will show 0 values
        
        // Trigger AI update
        await updateLookusStatusWithAI(contact.id);
    }
}

function updateLookusTime() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    const timeEl = document.getElementById('lookus-update-time');
    
    if (timeEl) {
        if (contact && contact.lookusData && contact.lookusData.lastUpdateTime > 0) {
            const date = new Date(contact.lookusData.lastUpdateTime);
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            timeEl.textContent = timeStr;
        } else {
            // Fallback to current time if no update data or pending
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            timeEl.textContent = timeStr;
        }
    }
}

function setupLookusTimers() {
    if (lookusUpdateTimer) clearInterval(lookusUpdateTimer);
    
    lookusUpdateTimer = setInterval(() => {
        if (!currentLookusContactId) return;
        const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
        if (!contact) return;
        
        // Check for day change
        if (contact.lookusData && contact.lookusData.lastUpdateTime > 0 && !isSameDay(contact.lookusData.lastUpdateTime)) {
            checkAndRefreshLookusData(contact);
            return; 
        }
        
        const now = Date.now();
        if (contact.lookusNextUpdateTime && now >= contact.lookusNextUpdateTime) {
            console.log('Triggering auto update for Lookus:', contact.name);
            updateLookusStatusWithAI(contact.id);
            
            // Schedule next
            const mode = contact.lookusUpdateMode;
            if (mode === 'random') {
                scheduleNextRandomUpdate(contact);
            } else if (mode === 'fixed') {
                const interval = contact.lookusUpdateMin || 30;
                contact.lookusNextUpdateTime = now + interval * 60 * 1000;
            } else {
                contact.lookusNextUpdateTime = null;
            }
            saveConfig();
        }
    }, 10000); // Check every 10s
}

function scheduleNextRandomUpdate(contact) {
    const min = contact.lookusUpdateMin || 30;
    const max = contact.lookusUpdateMax || 60;
    // Ensure max >= min
    const validMax = Math.max(max, min);
    
    const randomMinutes = Math.floor(Math.random() * (validMax - min + 1)) + min;
    contact.lookusNextUpdateTime = Date.now() + randomMinutes * 60 * 1000;
}

function openLookusSettings() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    if (!contact) {
        alert('请先选择一个联系人');
        return;
    }
    
    // Load current settings
    const mode = contact.lookusUpdateMode || 'manual';
    const modeSelect = document.getElementById('lookus-update-mode');
    const minInput = document.getElementById('lookus-update-min');
    const maxInput = document.getElementById('lookus-update-max');
    const timeGroup = document.getElementById('lookus-time-input-group');
    const timeLabel = document.getElementById('lookus-time-label');
    const timeHint = document.getElementById('lookus-time-hint');
    const separator = document.getElementById('lookus-time-separator');
    const syncState = getDeviceUsageSyncState();
    const enabledInput = document.getElementById('lookus-device-usage-enabled');
    const apiBaseUrlInput = document.getElementById('lookus-device-usage-api-base-url');
    const userIdInput = document.getElementById('lookus-device-usage-user-id');
    const deviceIdInput = document.getElementById('lookus-device-usage-device-id');
    const secretInput = document.getElementById('lookus-device-usage-secret');
    const templateInput = document.getElementById('lookus-device-usage-shortcut-template');
    const androidTemplateInput = document.getElementById('lookus-device-usage-android-template');
    const updateShortcutPreview = () => {
        const draftState = Object.assign({}, getDeviceUsageSyncState(), {
            enabled: !!(enabledInput && enabledInput.checked),
            apiBaseUrl: apiBaseUrlInput ? String(apiBaseUrlInput.value || '').trim().replace(/\/$/, '') : syncState.apiBaseUrl,
            userId: userIdInput ? (String(userIdInput.value || '').trim() || DEVICE_USAGE_SYNC_DEFAULTS.userId) : syncState.userId,
            deviceId: deviceIdInput ? (String(deviceIdInput.value || '').trim() || DEVICE_USAGE_SYNC_DEFAULTS.deviceId) : syncState.deviceId,
            secret: secretInput ? String(secretInput.value || '').trim() : syncState.secret
        });
        if (templateInput) templateInput.value = buildDeviceUsageShortcutTemplate(draftState);
        if (androidTemplateInput) androidTemplateInput.value = buildDeviceUsageAndroidTemplate(draftState);
    };

    if (modeSelect) modeSelect.value = mode;
    if (minInput) minInput.value = contact.lookusUpdateMin || 30;
    if (maxInput) maxInput.value = contact.lookusUpdateMax || 60;
    if (enabledInput) enabledInput.checked = !!syncState.enabled;
    if (apiBaseUrlInput) apiBaseUrlInput.value = syncState.apiBaseUrl || '';
    if (userIdInput) userIdInput.value = syncState.userId || DEVICE_USAGE_SYNC_DEFAULTS.userId;
    if (deviceIdInput) deviceIdInput.value = syncState.deviceId || DEVICE_USAGE_SYNC_DEFAULTS.deviceId;
    if (secretInput) secretInput.value = syncState.secret || '';
    [enabledInput, apiBaseUrlInput, userIdInput, deviceIdInput, secretInput].forEach((el) => {
        if (!el) return;
        el.oninput = updateShortcutPreview;
        el.onchange = updateShortcutPreview;
    });
    updateShortcutPreview();

    // Toggle UI state
    if (mode === 'manual') {
        timeGroup.classList.add('hidden');
    } else {
        timeGroup.classList.remove('hidden');
        if (mode === 'random') {
            timeLabel.textContent = '时间范围 (分钟)';
            timeHint.textContent = '将在最小和最大时间之间随机更新';
            maxInput.classList.remove('hidden');
            separator.classList.remove('hidden');
            minInput.placeholder = '最小';
        } else if (mode === 'fixed') {
            timeLabel.textContent = '固定间隔 (分钟)';
            timeHint.textContent = '每隔设定时间更新一次';
            maxInput.classList.add('hidden');
            separator.classList.add('hidden');
            minInput.placeholder = '分钟';
        }
    }
    
    document.getElementById('lookus-settings-modal').classList.remove('hidden');
    
    // Bind Force Update button
    const forceBtn = document.getElementById('lookus-force-update-btn');
    if (forceBtn) {
        const newForceBtn = forceBtn.cloneNode(true);
        forceBtn.parentNode.replaceChild(newForceBtn, forceBtn);
        newForceBtn.onclick = () => {
            updateLookusStatusWithAI(contact.id);
            document.getElementById('lookus-settings-modal').classList.add('hidden');
        };
    }

    const bindTemplateCopyButton = (buttonId, getText, successMessage) => {
        const button = document.getElementById(buttonId);
        if (!button) return;
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        newButton.onclick = async () => {
            updateShortcutPreview();
            const text = String(getText() || '');
            if (!text) return;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const tempInput = document.createElement('textarea');
                    tempInput.value = text;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    tempInput.remove();
                }
                if (typeof window.showChatToast === 'function') window.showChatToast(successMessage);
            } catch (error) {
                console.warn('[device-usage] copy template failed', error);
                alert('复制失败，请手动复制');
            }
        };
    };

    bindTemplateCopyButton('lookus-copy-shortcut-template-btn', () => templateInput ? templateInput.value : '', 'iPhone 模板已复制');
    bindTemplateCopyButton('lookus-copy-android-template-btn', () => androidTemplateInput ? androidTemplateInput.value : '', '安卓模板已复制');

    const resetBtn = document.getElementById('lookus-reset-device-usage-btn');
    if (resetBtn) {
        const newResetBtn = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(newResetBtn, resetBtn);
        newResetBtn.onclick = async () => {
            try {
                await resetDeviceUsageRemoteState();
                await refreshLookusDeviceUsageUi(true);
                if (typeof window.showChatToast === 'function') window.showChatToast('真实手机使用状态已重置');
            } catch (error) {
                alert(error && error.message ? error.message : '重置失败');
            }
        };
    }
}

window.toggleLookusTimeInput = function() {
    const mode = document.getElementById('lookus-update-mode').value;
    const timeGroup = document.getElementById('lookus-time-input-group');
    const timeLabel = document.getElementById('lookus-time-label');
    const timeHint = document.getElementById('lookus-time-hint');
    const minInput = document.getElementById('lookus-update-min');
    const maxInput = document.getElementById('lookus-update-max');
    const separator = document.getElementById('lookus-time-separator');

    if (mode === 'manual') {
        timeGroup.classList.add('hidden');
    } else {
        timeGroup.classList.remove('hidden');
        if (mode === 'random') {
            timeLabel.textContent = '时间范围 (分钟)';
            timeHint.textContent = '将在最小和最大时间之间随机更新';
            maxInput.classList.remove('hidden');
            separator.classList.remove('hidden');
            minInput.placeholder = '最小';
        } else if (mode === 'fixed') {
            timeLabel.textContent = '固定间隔 (分钟)';
            timeHint.textContent = '每隔设定时间更新一次';
            maxInput.classList.add('hidden');
            separator.classList.add('hidden');
            minInput.placeholder = '分钟';
        }
    }
}

window.saveLookusSettings = function() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    if (!contact) return;
    
    const mode = document.getElementById('lookus-update-mode').value;
    const minVal = parseInt(document.getElementById('lookus-update-min').value) || 30;
    const maxVal = parseInt(document.getElementById('lookus-update-max').value) || 60;
    const syncState = getDeviceUsageSyncState();
    const previousSyncSignature = [syncState.apiBaseUrl, syncState.userId, syncState.deviceId, syncState.secret].join('|');

    contact.lookusUpdateMode = mode;
    contact.lookusUpdateMin = minVal;
    contact.lookusUpdateMax = maxVal;
    syncState.enabled = !!(document.getElementById('lookus-device-usage-enabled') && document.getElementById('lookus-device-usage-enabled').checked);
    syncState.apiBaseUrl = document.getElementById('lookus-device-usage-api-base-url')
        ? String(document.getElementById('lookus-device-usage-api-base-url').value || '').trim().replace(/\/$/, '')
        : syncState.apiBaseUrl;
    syncState.userId = document.getElementById('lookus-device-usage-user-id')
        ? (String(document.getElementById('lookus-device-usage-user-id').value || '').trim() || DEVICE_USAGE_SYNC_DEFAULTS.userId)
        : syncState.userId;
    syncState.deviceId = document.getElementById('lookus-device-usage-device-id')
        ? (String(document.getElementById('lookus-device-usage-device-id').value || '').trim() || DEVICE_USAGE_SYNC_DEFAULTS.deviceId)
        : syncState.deviceId;
    syncState.secret = document.getElementById('lookus-device-usage-secret')
        ? String(document.getElementById('lookus-device-usage-secret').value || '').trim()
        : syncState.secret;
    const nextSyncSignature = [syncState.apiBaseUrl, syncState.userId, syncState.deviceId, syncState.secret].join('|');
    if (previousSyncSignature !== nextSyncSignature) {
        invalidateDeviceUsageSummaryCache();
    }
    
    if (mode === 'random') {
        scheduleNextRandomUpdate(contact);
    } else if (mode === 'fixed') {
        contact.lookusNextUpdateTime = Date.now() + minVal * 60 * 1000;
    } else {
        contact.lookusNextUpdateTime = null;
    }
    
    saveConfig();
    document.getElementById('lookus-settings-modal').classList.add('hidden');
    setupLookusTimers();
    refreshLookusDeviceUsageUi(true).catch((error) => console.warn('[device-usage] refresh after save failed', error));
}

window.openLookusSettings = openLookusSettings; // Expose global

function getItineraryText(contactId) {
    if (!window.iphoneSimState.itineraries || !window.iphoneSimState.itineraries[contactId]) return '';
    const data = window.iphoneSimState.itineraries[contactId];
    if (data.events && Array.isArray(data.events)) {
        return data.events.join('\n');
    }
    return '';
}

async function updateLookusStatusWithAI(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    const history = window.iphoneSimState.chatHistory[contactId] || [];
    const explicitDeviceEvidence = extractExplicitLookusDeviceModelFromHistory(history);
    const deviceChangeEvidence = explicitDeviceEvidence ? null : extractLookusDeviceChangeSignalFromHistory(history);
    const allowAIDeviceModelUpdate = !explicitDeviceEvidence && !!deviceChangeEvidence;
    const deviceModelChanged = ensureLookusDeviceModel(contact, history, explicitDeviceEvidence);
    if (deviceModelChanged) {
        saveConfig();
    }
    
    const timeEl = document.getElementById('lookus-update-time');
    if (timeEl) timeEl.textContent = "更新中...";

    const currentData = getLookusData(contactId);
    
    // 获取最近聊天记录，用于上下文感知
    const recentHistory = history.slice(-30).map(m => {
        let content = m.content;
        // 处理非文本类型
        if (m.type === 'image') content = '[图片]';
        else if (m.type === 'sticker') content = '[表情包]';
        else if (m.type === 'voice') {
            try {
                const d = JSON.parse(m.content);
                content = d.text || '[语音]';
            } catch(e) { content = '[语音]'; }
        } else if (m.type === 'transfer') content = '[转账]';
        else if (m.type === 'voice_call_text') {
            try {
                const d = JSON.parse(m.content);
                content = d.text || '[通话]';
            } catch(e) { content = '[通话]'; }
        }
        
        // 添加时间戳以帮助AI理解时间线
        let timeStr = '';
        if (m.time) {
            const d = new Date(m.time);
            timeStr = `[${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}] `;
        }
        return `${timeStr}${m.role === 'user' ? '用户' : '你(角色)'}: ${content}`;
    }).join('\n');
    
    const itineraryText = getItineraryText(contactId);
    
    const fixedDeviceModel = contact.deviceModel || inferLookusDeviceModel(contact);
    const deviceInstruction = explicitDeviceEvidence
        ? `\n- 最近聊天里你明确提到现在使用的手机型号是 "${fixedDeviceModel}"，LookUs 必须沿用这个型号并与聊天内容保持一致。`
        : (allowAIDeviceModelUpdate
            ? `\n- 最近聊天里你明确提到自己刚换了手机，但没有说具体型号。请结合人设、近期聊天和使用场景，为 LookUs 选择一个合理的新手机型号，并通过 deviceModel 字段返回；不要继续沿用旧型号 "${fixedDeviceModel}"。`
            : `\n- 当前已知手机型号是 "${fixedDeviceModel}"。除非最近聊天里有你本人明确说自己换了手机，或直接说明现在在用的具体型号，否则不要改成别的型号。`);

    // Calculate time elapsed
    let timeElapsedStr = "首次生成或新的一天";
    let lastTime = 0;
    if (contact.lookusData && contact.lookusData.lastUpdateTime > 0 && isSameDay(contact.lookusData.lastUpdateTime)) {
        lastTime = contact.lookusData.lastUpdateTime;
        const diffMs = Date.now() - lastTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours > 0) {
            timeElapsedStr = `${diffHours}小时${diffMins % 60}分钟`;
        } else {
            timeElapsedStr = `${diffMins}分钟`;
        }
    }

    // 构建已有数据上下文，用于增量更新
    let existingStopsContext = '';
    if (currentData.stopList && currentData.stopList.length > 0) {
        existingStopsContext = '\n已有停留记录（请在此基础上新增，不要删除已有记录）：\n' + 
            currentData.stopList.map((s, i) => `  ${i+1}. ${s.location} - ${s.duration} (${s.startTime}开始)`).join('\n');
    }
    
    let existingAppsContext = '';
    if (currentData.appList && currentData.appList.length > 0) {
        existingAppsContext = '\n已有APP使用记录（请在此基础上更新时长或新增，不要删除已有记录）：\n' + 
            currentData.appList.map(a => `  - ${a.name} (${a.cat}) ${a.time}`).join('\n');
    }
    
    let existingNetContext = '';
    if (currentData.netLog && currentData.netLog.length > 0) {
        existingNetContext = '\n已有网络记录（请在此基础上新增，不要删除已有记录，只更新isCurrent标记）：\n' + 
            currentData.netLog.map(n => `  - ${n.type} ${n.name} ${n.time}${n.isCurrent ? ' (当前)' : ''}`).join('\n');
    }

    const systemPrompt = `你现在扮演 ${contact.name}。
人设：${contact.persona || '无'}

请根据你的人设、最近的聊天记录以及【行程安排】，更新你在"LookUs"中的状态数据。

【⚠️ 最重要原则：与聊天上下文保持一致 ⚠️】
你必须仔细阅读下面的【最近聊天记录】，确保生成的LookUs状态与聊天内容完全一致，绝对不能矛盾！
例如：
- 如果你在聊天中说"我在家里"，LookUs就必须显示你在家里，不能显示在外面
- 如果你在聊天中说"我在上班"，LookUs就必须显示你在公司/办公室
- 如果你在聊天中说"我在打游戏"，APP使用记录里必须有游戏
- 如果你在聊天中说"我要睡了"或"晚安"，之后的状态应该是手机锁屏、无新解锁
- 如果你们正在线上聊天，说明你的手机是解锁状态，正在使用微信

【最近聊天记录】
${recentHistory || '暂无聊天记录'}

【时间逻辑 (关键)】
- 现在的真实时间是：${new Date().toLocaleTimeString()}
- **距离上次更新已过去：${timeElapsedStr}**
- 请务必根据这个时间间隔来合理推演状态变化：
  1. **电量**：根据间隔时间和使用强度扣减电量。
  2. **屏幕使用时间**：增加量**绝对不能超过**逝去的时间 (${timeElapsedStr})。
  3. **位置/行程**：如果间隔很短，位置通常不变；如果间隔较长，可能已经移动到了下一个地点。
  4. **报备事件**：请根据逝去的时间生成 1-3 ��在此期间发生的状态变更事件（系统提示消息）。如果时间间隔很短，可以没有事件。事件应简短，例如"对方刚刚解锁了手机"、"对方电量低于20%"、"对方离开了[地点]"等。事件内容也必须与聊天上下文一致。

【增量更新原则 (关键)】
⚠️ 停留地点(stopList)、APP使用记录(appList)、网络记录(netLog) 必须采用增量更新：
- **不要删除**已有的记录，只能新增或更新已有项的时长
- 已有记录的数据请原样保留，可以更新最后一项的时长
- 如果有新的地点/APP/网络，请追加到列表中
- stops 数字应该 >= 已有停留数
${existingStopsContext}
${existingAppsContext}
${existingNetContext}

【其他重要原则】
1. **连续性**：必须基于上次数据演变。
2. **上下文感知**：
   - 睡觉/忙碌 -> 手机未解锁。
   - 打游戏 -> 屏幕使用增加，正在使用游戏APP。
   - 正在聊天 -> 微信使用时间增加。
3. **行程同步**：
   - 参考行程信息生成停留地点。
${deviceInstruction}

【参考信息】
当前状态：
- 电量: ${currentData.battery}
- 屏幕使用: ${currentData.screenTimeH}小时${currentData.screenTimeM}分
- 解锁次数: ${currentData.unlockCount}
- 停留��点数: ${currentData.stops}

今日行程：
${itineraryText || "暂无具体行程"}

请返回 JSON (字段名必须一致):
{
  "battery": "数字 (0-100)",
  "network": "WiFi名称 或 5G",
  ${allowAIDeviceModelUpdate ? '"deviceModel": "如果最近聊天明确提到刚换手机，请返回一个新的合理手机型号",' : ''}
  "screenTimeH": "数字 (小时)",
  "screenTimeM": "数字 (分钟)",
  "unlockCount": "数字 (次数，应 >= 已有次数)",
  "lastUnlock": "HH:MM",
  "stops": "数字 (停留数，应 >= 已有停留数)",
  "stopList": [ {"location": "地点", "duration": "时长", "startTime": "HH:MM"} ],
  "appList": [ {"name": "应用名", "cat": "分类", "time": "时长"} ],
  "netLog": [ {"type": "WiFi/5G", "name": "名称", "time": "时间段", "isCurrent": true/false} ],
  "reportEvents": [ {"text": "事件描述", "type": "unlock/charge/move/app/other", "timeOffsetMin": "距离上次更新过去多少分钟(数字)"} ]
}`;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    
    if (!settings.url || !settings.key) {
        alert("请先在设置中配置 AI API");
        return;
    }
    
    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }
        const cleanKey = settings.key.replace(/[^\x00-\x7F]/g, "").trim();
        
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: '请只返回JSON，不要包含任何其他文字或markdown格式。' }
                ],
                temperature: 0.7
            })
        });
        
        if (response.ok) {
            const resData = await response.json();
            const content = resData.choices[0].message.content;
            let newData;
            try {
                newData = JSON.parse(content);
            } catch (e) {
                // Try to extract JSON from markdown code blocks or other wrapping
                let jsonStr = content;
                
                // Remove markdown code block markers (```json ... ``` or ``` ... ```)
                const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (codeBlockMatch) {
                    jsonStr = codeBlockMatch[1].trim();
                }
                
                try {
                    newData = JSON.parse(jsonStr);
                } catch (e2) {
                    // Last resort: find the outermost { ... } 
                    const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
                    if (braceMatch) {
                        try {
                            newData = JSON.parse(braceMatch[0]);
                        } catch (e3) {
                            console.error("Failed to parse AI response:", content);
                            throw new Error("Invalid JSON response");
                        }
                    } else {
                        console.error("No JSON found in AI response:", content);
                        throw new Error("Invalid JSON response");
                    }
                }
            }
            
            // Allow AI to refresh the model only when chat explicitly says the contact changed phones.
            if (newData.deviceModel) {
                const aiDeviceModel = normalizeLookusDeviceModel(newData.deviceModel);
                const currentDeviceModel = normalizeLookusDeviceModel(contact.deviceModel);
                if (!currentDeviceModel && aiDeviceModel) {
                    contact.deviceModel = aiDeviceModel;
                    contact.lookusDeviceModelVersion = 3;
                } else if (
                    allowAIDeviceModelUpdate &&
                    aiDeviceModel &&
                    aiDeviceModel.toLowerCase() !== currentDeviceModel.toLowerCase()
                ) {
                    contact.deviceModel = aiDeviceModel;
                    contact.lookusDeviceModelVersion = 3;
                }
            }

            // Fix: Ensure battery consistency with report events
            // 如果报备中有"电量低于20%"的事件，强制将当前电量修正为低于20，避免首页显示高电量造成矛盾
            if (newData.reportEvents && Array.isArray(newData.reportEvents)) {
                newData.reportEvents.forEach(evt => {
                    if (evt.text.includes('电量低于') && evt.text.includes('20%')) {
                        let currentBat = parseInt(newData.battery);
                        // If battery is high but report says low, force it down
                        if (!isNaN(currentBat) && currentBat >= 20) {
                            newData.battery = 19;
                        }
                    }
                });
            }

            // Process Report Events
            let newReports = [];
            if (newData.reportEvents && Array.isArray(newData.reportEvents)) {
                const now = Date.now();
                const lastTime = (contact.lookusData && contact.lookusData.lastUpdateTime > 0) ? contact.lookusData.lastUpdateTime : (now - 60000);
                
                newReports = newData.reportEvents.map(evt => {
                    let icon = 'fas fa-info-circle';
                    let color = '#999';
                    
                    // Simple Icon Logic
                    if (evt.type === 'unlock' || evt.text.includes('解锁')) { icon = 'fas fa-mobile-alt'; color = '#4CAF50'; }
                    else if (evt.type === 'charge' || evt.text.includes('充电')) { icon = 'fas fa-bolt'; color = '#FF9500'; }
                    else if (evt.type === 'move' || evt.text.includes('离开') || evt.text.includes('到达')) { icon = 'fas fa-map-marker-alt'; color = '#007AFF'; }
                    else if (evt.type === 'app' || evt.text.includes('使用')) { icon = 'fas fa-layer-group'; color = '#9C27B0'; }
                    
                    // Calculate timestamp
                    let offset = parseInt(evt.timeOffsetMin) || 0;
                    let timestamp = lastTime + (offset * 60 * 1000);
                    // Ensure timestamp is not in future
                    if (timestamp > now) timestamp = now;
                    // Ensure timestamp is after last update
                    if (timestamp < lastTime) timestamp = lastTime;

                    const date = new Date(timestamp);
                    const timeStr = `${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
                    
                    return {
                        time: timeStr,
                        timestamp: timestamp,
                        icon: icon,
                        iconColor: color,
                        text: evt.text
                    };
                });
            }

            // Merge Reports
            let currentReports = (contact.lookusData && contact.lookusData.reportLog) ? contact.lookusData.reportLog : [];
            const allReports = [...newReports, ...currentReports];
            
            // Sort by timestamp desc
            allReports.sort((a, b) => b.timestamp - a.timestamp);
            
            // Limit history size (e.g. keep last 50)
            const limitedReports = allReports.slice(0, 50);

            // ====== 增量合并逻辑 ======
            // stopList: 保留已有记录，追加新的
            let mergedStopList = [...(currentData.stopList || [])];
            if (newData.stopList && Array.isArray(newData.stopList)) {
                newData.stopList.forEach(newStop => {
                    const existIdx = mergedStopList.findIndex(s => 
                        s.location === newStop.location && s.startTime === newStop.startTime
                    );
                    if (existIdx >= 0) {
                        // 更新已有记录的时长
                        mergedStopList[existIdx].duration = newStop.duration;
                    } else {
                        // 检查是否只是时长更新（同地点，不同开始时间视为新记录）
                        const sameLocIdx = mergedStopList.findIndex(s => s.location === newStop.location);
                        if (sameLocIdx >= 0 && sameLocIdx === mergedStopList.length - 1) {
                            // 最后一个同地点记录，更新时长
                            mergedStopList[sameLocIdx].duration = newStop.duration;
                        } else {
                            mergedStopList.push(newStop);
                        }
                    }
                });
            }

            // appList: 保留已有记录，更新时长或追加新的
            let mergedAppList = [...(currentData.appList || [])];
            if (newData.appList && Array.isArray(newData.appList)) {
                newData.appList.forEach(newApp => {
                    const existIdx = mergedAppList.findIndex(a => a.name === newApp.name);
                    if (existIdx >= 0) {
                        // 更新已有APP的使用时长
                        mergedAppList[existIdx].time = newApp.time;
                        if (newApp.cat) mergedAppList[existIdx].cat = newApp.cat;
                    } else {
                        mergedAppList.push(newApp);
                    }
                });
            }

            // netLog: 保留已有记录，追加新的，更新isCurrent
            let mergedNetLog = [...(currentData.netLog || [])];
            if (newData.netLog && Array.isArray(newData.netLog)) {
                // 先将所有已有记录的isCurrent设为false
                mergedNetLog.forEach(n => n.isCurrent = false);
                
                newData.netLog.forEach(newNet => {
                    const existIdx = mergedNetLog.findIndex(n => 
                        n.name === newNet.name && n.type === newNet.type && n.time === newNet.time
                    );
                    if (existIdx >= 0) {
                        mergedNetLog[existIdx].isCurrent = newNet.isCurrent || false;
                        mergedNetLog[existIdx].time = newNet.time;
                    } else {
                        mergedNetLog.push(newNet);
                    }
                });
            }

            // 确保 stops/unlockCount 只增不减
            const oldStops = parseInt(currentData.stops) || 0;
            const newStops = Math.max(parseInt(newData.stops) || 0, oldStops, mergedStopList.length);
            
            const oldUnlock = parseInt(currentData.unlockCount) || 0;
            const newUnlock = Math.max(parseInt(newData.unlockCount) || 0, oldUnlock);

            contact.lookusData = {
                distance: '--', // Always reset to placeholder, let renderLookusApp calculate it
                battery: (newData.battery || 80) + '%',
                network: newData.network || '5G',
                device: contact.deviceModel || newData.deviceModel || '未知型号', 
                screenTimeH: newData.screenTimeH || 0,
                screenTimeM: newData.screenTimeM || 0,
                unlockCount: newUnlock + '次',
                lastUnlock: newData.lastUnlock || '未知',
                stops: newStops,
                stopList: mergedStopList,
                appList: mergedAppList,
                netLog: mergedNetLog,
                reportLog: limitedReports,
                lastUpdateTime: Date.now()
            };
            
            saveConfig();
            renderLookusApp();
            renderLookusReport(); // Update report view if open
            updateLookusTime();

            // Show notification banner for new report events (only if not in LookUs app)
            if (newReports.length > 0) {
                const latestReport = newReports[0];
                showLookusNotification(contact.name || '对方', latestReport.text, latestReport.icon);
            }
        } else {
            throw new Error(`API Error: ${response.status}`);
        }
    } catch (e) {
        console.error("AI Update Failed", e);
        if (timeEl) timeEl.textContent = "更新失败";
    }
}

function openLookusContactPicker() {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    const headerTitle = modal.querySelector('h3');
    const originalTitle = headerTitle ? headerTitle.textContent : '选择联系人';
    if (headerTitle) headerTitle.textContent = '选择查看对象';
    
    if (sendBtn) sendBtn.style.display = 'none';
    
    list.innerHTML = '';
    
    if (!window.iphoneSimState.contacts || window.iphoneSimState.contacts.length === 0) {
        list.innerHTML = '<div class="list-item center-content" style="color:#999;">暂无联系人</div>';
    } else {
        window.iphoneSimState.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="list-content" style="display:flex; align-items:center; width:100%; padding: 10px;">
                    <img src="${c.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; object-fit: cover;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${c.remark || c.name}</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #ccc;"></i>
                </div>
            `;
            item.onclick = () => {
                currentLookusContactId = c.id;
                modal.classList.add('hidden');
                if (headerTitle) headerTitle.textContent = originalTitle;
                if (sendBtn) sendBtn.style.display = '';
                
                checkAndRefreshLookusData(c);
                // Ensure render happens
                renderLookusApp();
            };
            list.appendChild(item);
        });
    }
    
    modal.classList.remove('hidden');
    
    const closeHandler = () => {
        modal.classList.add('hidden');
        if (sendBtn) sendBtn.style.display = '';
        if (headerTitle) headerTitle.textContent = originalTitle;
        closeBtn.removeEventListener('click', closeHandler);
    };
    closeBtn.addEventListener('click', closeHandler);
}

function getLookusData(contactId) {
    if (!contactId) return null; // Return null if no contact

    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    const name = contact ? (contact.remark || contact.name) : '未知用户';
    
    // Restore pseudo-random generation for stable fallbacks
    let seed = 0;
    const str = String(contactId) + name;
    for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed) + str.charCodeAt(i);
        seed |= 0;
    }
    seed = Math.abs(seed);
    
    // const randomDistance = ((seed % 900) / 10 + 0.1).toFixed(1);
    // const deviceModels = ['iPhone 15 Pro', 'iPhone 14', 'iPhone 13 mini', 'iPhone 15 Pro Max', 'iPhone SE'];
    // const randomDevice = deviceModels[seed % deviceModels.length];

    if (contact && contact.lookusData) {
        return {
            name: name,
            distance: (contact.lookusData.distance && contact.lookusData.distance !== '--') ? contact.lookusData.distance : '--',
            // Prefer permanent device model if set, else fallback to daily data or random
            device: contact.deviceModel || contact.lookusData.device || '未知型号',
            network: contact.lookusData.network,
            battery: contact.lookusData.battery,
            stops: contact.lookusData.stops,
            screenTimeH: contact.lookusData.screenTimeH || 0,
            screenTimeM: contact.lookusData.screenTimeM || 0,
            unlockCount: contact.lookusData.unlockCount,
            lastUnlock: contact.lookusData.lastUnlock,
            appList: contact.lookusData.appList || [],
            netLog: contact.lookusData.netLog || [],
            stopList: contact.lookusData.stopList || []
        };
    }

    // Default Fallback
    return {
        name: name,
        distance: '--',
        device: contact && contact.deviceModel ? contact.deviceModel : '未知型号',
        network: '未知',
        battery: '--%',
        stops: 0,
        screenTimeH: 0,
        screenTimeM: 0,
        unlockCount: '0次',
        lastUnlock: '未知',
        appList: [],
        netLog: [],
        stopList: []
    };
}

function renderLookusApp() {
    const container = document.getElementById('lookus-content');
    if (!container) return;

    if (!currentLookusContactId) {
        container.innerHTML = '<div style="text-align:center; padding: 50px; color: #999;">请先选择联系人</div>';
        return;
    }

    const data = getLookusData(currentLookusContactId);

    // Calculate real distance if both user and contact locations are available
    const contactCoords = getContactCoordinates(currentLookusContactId);
    if (currentUserLocation && contactCoords) {
        const realDist = haversineDistance(
            currentUserLocation.lat, currentUserLocation.lng,
            contactCoords[1], contactCoords[0] // CITY_COORDINATES is [lng, lat]
        );
        data.distance = realDist.toFixed(1);
    }

    // Calculate Screen Time Percentage
    const h = parseInt(data.screenTimeH) || 0;
    const m = parseInt(data.screenTimeM) || 0;
    const totalMinutes = h * 60 + m;
    const percentage = Math.min(100, (totalMinutes / 1440) * 100).toFixed(1);
    const screenTimeStr = `${h}小时${m}分`;

    // Clear container
    container.innerHTML = '';

    // --- Top Section ---
    const topSection = document.createElement('div');
    topSection.className = 'lookus-section';
    
    topSection.innerHTML = `
        <div class="lookus-status-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div class="lookus-distance">我们相距 ${data.distance} km</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <i class="fas fa-heart" style="color: #000;"></i>
                    <i class="fas fa-comment-dots" style="color: #000;"></i>
                </div>
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">${data.name} 在这里</div>
            <div class="lookus-device-info">
                <div class="lookus-device-item">
                    <i class="fas fa-mobile-alt lookus-device-icon"></i>
                    <span>${data.device}</span>
                </div>
                <div class="lookus-device-item">
                    <i class="fas fa-wifi lookus-device-icon"></i>
                    <span>${data.network} <i class="far fa-question-circle"></i></span>
                </div>
                <div class="lookus-device-item">
                    <i class="fas fa-battery-three-quarters lookus-device-icon"></i>
                    <span>${data.battery}</span>
                </div>
            </div>
        </div>
    `;

    // Stops Section
    let stopListHtml = '';
    if (data.stopList && data.stopList.length > 0) {
        data.stopList.forEach((stop, index) => {
             stopListHtml += `
                <div style="display: flex; gap: 15px; align-items: center; padding-top: 10px; margin-bottom: 10px;">
                    <div style="width: 80px; height: 80px; border-radius: 12px; overflow: hidden; position: relative; flex-shrink: 0;">
                        <img src="https://placehold.co/100x100/3e4c63/3e4c63?text=${index+1}" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: #FF9500; border-radius: 50%; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; border: 2px solid #fff;">${index + 1}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                            <i class="fas fa-map-pin" style="color: #FF9500; margin-right: 5px;"></i>
                            停留${stop.duration}
                        </div>
                        <div style="color: #666; font-size: 13px; display: flex; align-items: center; gap: 5px;">
                            <span style="color: #FF9500; font-size: 20px;">•</span> ${stop.startTime}
                            <div style="background: #e0e0e0; height: 10px; width: 60px; border-radius: 2px;"></div>
                            <div style="font-size: 12px; color: #999; margin-left: 5px;">${stop.location}</div>
                        </div>
                    </div>
                </div>
             `;
        });
    } else {
        stopListHtml = '<div style="text-align: center; color: #999; padding: 10px;">暂无停留记录</div>';
    }

    const stopsCard = document.createElement('div');
    stopsCard.className = 'lookus-card';
    stopsCard.innerHTML = `
        <div class="lookus-card-title" style="border-bottom: none; padding-bottom: 0;">
            <span><i class="fas fa-map-marker-alt" style="color: #8BC34A;"></i> 对方今天停留${data.stops}个地方</span>
        </div>
        ${stopListHtml}
    `;
    topSection.appendChild(stopsCard);
    
    container.appendChild(topSection);

    // --- Middle Section ---
    const middleSection = document.createElement('div');
    middleSection.className = 'lookus-section';
    
    middleSection.innerHTML = `
        <div class="lookus-card">
            <div class="lookus-card-title">今日手机使用记录</div>
            <div style="display: flex; gap: 15px;">
                <div style="flex: 1; background: #f9f9f9; border-radius: 12px; padding: 20px; text-align: center;">
                    <div id="lookus-usage-ring" class="lookus-usage-circle"></div>
                    <div style="margin-top: 15px; font-weight: bold;">屏幕使用时间</div>
                    <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">${screenTimeStr}</div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 15px;">
                    <div class="lookus-stat-box" style="flex: 1;">
                        <div class="lookus-stat-label"><span style="color: #000;">●</span> 解锁手机次数</div>
                        <div class="lookus-stat-value">${data.unlockCount}</div>
                        <i class="fas fa-lock lookus-lock-icon"></i>
                    </div>
                    <div class="lookus-stat-box" style="flex: 1;">
                        <div class="lookus-stat-label"><span style="color: #000;">●</span> 最近解锁手机</div>
                        <div class="lookus-stat-value">${data.lastUnlock}</div>
                        <i class="far fa-clock lookus-lock-icon"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
    container.appendChild(middleSection);

    // --- Bottom Section ---
    const bottomSection = document.createElement('div');
    bottomSection.className = 'lookus-section';
    
    // Generate App List HTML
    let appListHtml = '';
    if (data.appList && data.appList.length > 0) {
        data.appList.forEach(app => {
            // Simple mapping for icons/colors based on common app names, fallback to random/default
            let iconClass = 'fas fa-mobile-alt';
            let bg = '#333';
            if (app.name.includes('微信')) { iconClass = 'fab fa-weixin'; bg = '#07C160'; }
            else if (app.name.includes('抖音')) { iconClass = 'fab fa-tiktok'; bg = '#000'; }
            else if (app.name.includes('游戏') || app.name.includes('荣耀')) { iconClass = 'fas fa-gamepad'; bg = '#FF9500'; }
            
            appListHtml += `
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="width: 40px; height: 40px; background: ${bg}; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="${iconClass}" style="color: #fff; font-size: 22px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 15px;">${app.name}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 2px;">${app.cat || '应用'}</div>
                    </div>
                    <div style="font-weight: 600; font-size: 14px;">${app.time}</div>
                </div>
            `;
        });
    } else {
        appListHtml = '<div style="text-align: center; color: #999; padding: 10px;">暂无记录</div>';
    }

    // Generate Net Log HTML
    let netLogHtml = '';
    if (data.netLog && data.netLog.length > 0) {
        data.netLog.forEach(log => {
            let iconClass = log.type === 'WiFi' ? 'fas fa-wifi' : 'fas fa-signal';
            let iconColor = log.type === 'WiFi' ? '#007AFF' : '#666';
            let bg = log.type === 'WiFi' ? '#E3F2FD' : '#F5F5F5';
            let tagHtml = log.isCurrent ? `<div style="color: #007AFF; font-size: 12px; background: #E3F2FD; padding: 4px 8px; border-radius: 10px; font-weight: 600;">当前</div>` : '';
            
            netLogHtml += `
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="width: 36px; height: 36px; background: ${bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="${iconClass}" style="color: ${iconColor}; font-size: 16px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 15px;">${log.name}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 2px;">${log.time}</div>
                    </div>
                    ${tagHtml}
                </div>
            `;
        });
    } else {
        netLogHtml = '<div style="text-align: center; color: #999; padding: 10px;">暂无记录</div>';
    }

    bottomSection.innerHTML = `
        <div class="lookus-card" id="lookus-device-usage-card-host">
            <div class="lookus-card-title">你的真实手机使用</div>
            <div style="font-size:13px;color:#888;margin-top:10px;">正在同步…</div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">
                手机APP使用记录 <span class="lookus-new-badge">NEW!</span>
                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
            </div>
            <div class="lookus-app-list" style="margin-top: 15px;">
                ${appListHtml}
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">
                网络记录
                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
            </div>
            <div class="lookus-net-list" style="margin-top: 15px;">
                ${netLogHtml}
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">
                <span>锁Ta手机 <span class="lookus-new-badge">NEW!</span></span>
                <span style="font-size: 12px; color: #999;">iOS锁定说明 <i class="far fa-question-circle"></i></span>
            </div>
            <div style="text-align: center; color: #666; font-size: 14px; margin: 20px 0;">对方未开启相关权限，还不能锁机</div>
            <button class="lookus-lock-phone-btn">去提醒Ta</button>
        </div>
    `;
    container.appendChild(bottomSection);
    refreshLookusDeviceUsageUi(false).catch((error) => console.warn('[device-usage] home refresh failed', error));

    // Animate Ring
    setTimeout(() => {
        const ring = document.getElementById('lookus-usage-ring');
        if (ring) {
            // Trigger reflow
            void ring.offsetWidth;
            ring.style.setProperty('--progress', `${percentage}%`);
        }
    }, 100);
}

function closeLookusApp() {
    const app = document.getElementById('lookus-app');
    if (app) {
        app.style.opacity = '0';
        app.style.transform = 'scale(0.95)';
        app.style.transition = 'opacity 0.2s, transform 0.2s';
        
        setTimeout(() => {
            app.classList.add('hidden');
            // Reset styles for next open
            app.style.opacity = '';
            app.style.transform = '';
            app.style.transition = '';
        }, 200);
    }
}

function switchLookusTab(tabName) {
    const homeView = document.getElementById('lookus-content');
    const reportView = document.getElementById('lookus-report-view');
    const tabs = document.querySelectorAll('.lookus-tab-bar .tab-item');
    const homeBtn = tabs[0];
    const reportBtn = tabs[1];

    const showView = (viewToShow, viewToHide) => {
        if (viewToHide) {
            viewToHide.style.opacity = '0';
            viewToHide.style.transform = 'scale(0.98)';
            viewToHide.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            
            setTimeout(() => {
                viewToHide.style.display = 'none';
                viewToHide.style.opacity = '';
                viewToHide.style.transform = '';
                viewToHide.style.transition = '';
                
                if (viewToShow) {
                    if (tabName === 'report') {
                        viewToShow.style.display = 'flex';
                    } else {
                        viewToShow.style.display = 'block';
                    }
                    viewToShow.style.opacity = '0';
                    viewToShow.style.transform = 'scale(1.02)';
                    viewToShow.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                    
                    // Trigger reflow
                    void viewToShow.offsetWidth;
                    
                    viewToShow.style.opacity = '1';
                    viewToShow.style.transform = 'scale(1)';
                    
                    if (tabName === 'home') {
                        // Re-trigger ring animation if returning to home
                        const ring = document.getElementById('lookus-usage-ring');
                        if (ring) {
                            const currentP = ring.style.getPropertyValue('--progress');
                            ring.style.setProperty('--progress', '0%');
                            setTimeout(() => {
                                ring.style.setProperty('--progress', currentP);
                            }, 50);
                        }
                    }
                }
            }, 200);
        } else if (viewToShow) {
             // Initial show if nothing to hide (shouldn't happen usually but safe to handle)
             if (tabName === 'report') viewToShow.style.display = 'flex';
             else viewToShow.style.display = 'block';
        }
    };

    if (tabName === 'home') {
        if (homeBtn.classList.contains('active')) return;
        
        showView(homeView, reportView);
        
        homeBtn.classList.add('active');
        homeBtn.style.color = '#000';
        reportBtn.classList.remove('active');
        reportBtn.style.color = '#999';
        
    } else if (tabName === 'report') {
        if (reportBtn.classList.contains('active')) return;
        
        showView(reportView, homeView);
        
        homeBtn.classList.remove('active');
        homeBtn.style.color = '#999';
        reportBtn.classList.add('active');
        reportBtn.style.color = '#000';
        
        renderLookusReport(); 
        setTimeout(() => {
            refreshLookusDeviceUsageUi(false).catch((error) => console.warn('[device-usage] report refresh failed', error));
        }, 0);
    }
}

function renderLookusReport() {
    const container = document.getElementById('lookus-report-view');
    if (!container) return;
    
    if (!currentLookusContactId) {
        container.innerHTML = '<div style="text-align:center; padding: 50px; color: #999;">请先选择联系人</div>';
        return;
    }

    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    let events = [];
    if (contact && contact.lookusData && contact.lookusData.reportLog) {
        events = contact.lookusData.reportLog;
    }

    container.innerHTML = '';
    container.className = 'lookus-report-view';

    const deviceUsageBlock = document.createElement('div');
    deviceUsageBlock.id = 'lookus-device-usage-report-block';
    deviceUsageBlock.innerHTML = '<div class="lookus-report-item" style="display:block; margin-bottom:18px; background:#f7f7fa;">正在同步真实手机使用记录…</div>';
    container.appendChild(deviceUsageBlock);
    refreshLookusDeviceUsageUi(false).catch((error) => console.warn('[device-usage] report refresh failed', error));

    if (events.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 50px; color: #999;">暂无报备记录</div>';
        return;
    }

    events.forEach(event => {
        // Time
        const timeEl = document.createElement('div');
        timeEl.className = 'lookus-report-time';
        timeEl.textContent = event.time;
        container.appendChild(timeEl);

        // Bubble
        const itemEl = document.createElement('div');
        itemEl.className = 'lookus-report-item';
        
        // User events get a distinct style
        if (event.isUserEvent) {
            itemEl.style.background = 'rgba(0, 122, 255, 0.08)';
            itemEl.style.border = '1px solid rgba(0, 122, 255, 0.15)';
        }
        
        // Icon
        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = `<i class="${event.icon || 'fas fa-info-circle'}" style="color: ${event.iconColor || '#999'};"></i>`;
        iconSpan.className = 'lookus-report-icon';
        itemEl.appendChild(iconSpan);

        // Text content
        const textSpan = document.createElement('span');
        let processedText = event.text;
        
        if (event.boldText) {
             processedText = processedText.replace(event.boldText, `<b>${event.boldText}</b>`);
        }
        
        textSpan.innerHTML = processedText;
        itemEl.appendChild(textSpan);

        // Link (Optional)
        if (event.link) {
            const linkSpan = document.createElement('span');
            linkSpan.className = 'lookus-report-link';
            linkSpan.textContent = event.link;
            itemEl.appendChild(linkSpan);
        }

        container.appendChild(itemEl);
    });
    
    // Bottom padding
    const spacer = document.createElement('div');
    spacer.style.height = '50px';
    container.appendChild(spacer);
}

// 测试高德地图 API
function testAmapAPI() {
    const statusEl = document.getElementById('lookus-map-status');
    const mapContainer = document.getElementById('lookus-map-container');
    const btn = document.getElementById('lookus-test-map-btn');
    
    if (!statusEl || !mapContainer) return;
    
    statusEl.style.display = 'block';
    
    // Check if API key is configured
    const settings = window.iphoneSimState.amapSettings;
    const jsKey = String((settings && (settings.jsKey || settings.key)) || '').trim();
    if (!jsKey) {
        statusEl.style.color = '#FF3B30';
        statusEl.textContent = '❌ 未配置高德 JS 地图 Key，请在设置中填写';
        mapContainer.style.display = 'none';
        console.error('[Amap Test] No JS map key configured');
        return;
    }
    
    statusEl.style.color = '#FF9500';
    statusEl.textContent = '⏳ 正在加载高德地图 SDK...';
    console.log('[Amap Test] JS Map Key:', jsKey.substring(0, 6) + '***');
    console.log('[Amap Test] Security Code:', settings.securityCode ? '已配置' : '未配置');
    
    // Set security config
    if (settings.securityCode) {
        window._AMapSecurityConfig = {
            securityJsCode: settings.securityCode,
        };
        console.log('[Amap Test] Security config set');
    }
    
    // Check if AMap is already loaded
    if (window.AMap) {
        console.log('[Amap Test] AMap SDK already loaded, initializing map...');
        statusEl.style.color = '#34C759';
        statusEl.textContent = '✅ SDK 已加载，正在初始化地图...';
        initTestMap(statusEl, mapContainer);
        return;
    }
    
    // Load script
    btn.disabled = true;
    btn.textContent = '加载中...';
    
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${jsKey}&plugin=AMap.Geolocation,AMap.Geocoder`;
    script.async = true;
    
    script.onload = () => {
        console.log('[Amap Test] SDK loaded successfully!');
        statusEl.style.color = '#34C759';
        statusEl.textContent = '✅ SDK 加载成功，正在初始化地图...';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-map-marked-alt"></i> 加载地图 API';
        initTestMap(statusEl, mapContainer);
    };
    
    script.onerror = (e) => {
        console.error('[Amap Test] SDK load failed:', e);
        statusEl.style.color = '#FF3B30';
        statusEl.textContent = '❌ SDK 加载失败，请检查网络和 API Key';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-map-marked-alt"></i> 重新测试';
        mapContainer.style.display = 'none';
    };
    
    document.head.appendChild(script);
}

function initTestMap(statusEl, mapContainer) {
    try {
        mapContainer.style.display = 'block';
        
        // Clear any previous content
        mapContainer.innerHTML = '';
        
        const map = new AMap.Map(mapContainer, {
            resizeEnable: true,
            zoom: 13,
            center: [116.397428, 39.90923] // 北京天安门
        });
        
        // Add a marker
        const marker = new AMap.Marker({
            position: [116.397428, 39.90923],
            map: map
        });
        
        // Store for later use
        amapInstance = map;
        amapMarker = marker;
        
        map.on('complete', () => {
            console.log('[Amap Test] Map rendered successfully!');
            statusEl.style.color = '#34C759';
            statusEl.textContent = '✅ 地图加载成功！默认显示北京天安门';
        });
        
        // Try geolocation
        try {
            const geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,
                timeout: 10000,
                zoomToAccuracy: true
            });
            
            geolocation.getCurrentPosition((status, result) => {
                if (status === 'complete') {
                    const pos = result.position;
                    const addr = result.formattedAddress || '已获取';
                    console.log('[Amap Test] Geolocation success:', addr, 'lat:', pos.lat, 'lng:', pos.lng);
                    statusEl.textContent = '✅ 地图加载成功！当前位置: ' + addr;
                    map.setCenter(pos);
                    map.setZoom(15);
                    marker.setPosition(pos);
                    
                    // Store user location for distance calculation
                    currentUserLocation = {
                        lat: pos.lat,
                        lng: pos.lng,
                        address: addr
                    };
                    
                    // Show contact marker on the map
                    showContactOnMap();
                    
                    // Re-render to update distance display
                    renderLookusApp();
                } else {
                    console.warn('[Amap Test] Geolocation failed:', result);
                    statusEl.textContent = '✅ 地图加载成功！(定位失败，显示默认位置)';
                    
                    // Even without user geolocation, try to show contact on map
                    showContactOnMap();
                }
            });
        } catch (geoErr) {
            console.warn('[Amap Test] Geolocation error:', geoErr);
        }
        
    } catch (e) {
        console.error('[Amap Test] Map init error:', e);
        statusEl.style.color = '#FF3B30';
        statusEl.textContent = '❌ 地图初始化失败: ' + e.message;
        mapContainer.style.display = 'none';
    }
}

window.testAmapAPI = testAmapAPI;

// ==========================================
// 用户端报备事件监听 (User-side Report Events)
// ==========================================

// 添加用户端报备事件到当前联系人的 reportLog
function addUserReportEvent(text, type = 'other') {
    if (!currentLookusContactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    if (!contact) return;
    
    // Ensure lookusData exists
    if (!contact.lookusData) {
        contact.lookusData = { reportLog: [] };
    }
    if (!contact.lookusData.reportLog) {
        contact.lookusData.reportLog = [];
    }
    
    // Icon mapping
    let icon = 'fas fa-info-circle';
    let color = '#999';
    
    if (type === 'charge') { icon = 'fas fa-bolt'; color = '#FF9500'; }
    else if (type === 'battery_low') { icon = 'fas fa-battery-quarter'; color = '#FF3B30'; }
    else if (type === 'battery_full') { icon = 'fas fa-battery-full'; color = '#34C759'; }
    else if (type === 'screen_off') { icon = 'fas fa-moon'; color = '#8E8E93'; }
    else if (type === 'screen_on') { icon = 'fas fa-sun'; color = '#FFCC00'; }
    else if (type === 'offline') { icon = 'fas fa-wifi-slash'; color = '#FF3B30'; }
    else if (type === 'online') { icon = 'fas fa-wifi'; color = '#34C759'; }
    else if (type === 'unlock') { icon = 'fas fa-mobile-alt'; color = '#4CAF50'; }
    
    const now = new Date();
    const timeStr = `${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    
    const event = {
        time: timeStr,
        timestamp: Date.now(),
        icon: icon,
        iconColor: color,
        text: '📱 ' + text, // Prefix with phone emoji to distinguish user events
        isUserEvent: true
    };
    
    // Add to front of report log
    contact.lookusData.reportLog.unshift(event);
    
    // Limit to 50 entries
    if (contact.lookusData.reportLog.length > 50) {
        contact.lookusData.reportLog = contact.lookusData.reportLog.slice(0, 50);
    }
    
    saveConfig();
    
    // Update report view if it's currently visible
    const reportView = document.getElementById('lookus-report-view');
    if (reportView && reportView.style.display !== 'none') {
        renderLookusReport();
    }
    
    console.log('[LookUs User Event]', text);
}

// 监听电池状态变化
function setupBatteryMonitor() {
    if (!navigator.getBattery) {
        console.log('[LookUs] Battery API not available');
        return;
    }
    
    navigator.getBattery().then(battery => {
        let lastCharging = battery.charging;
        let lastLevel = battery.level;
        let reportedLow = false;
        let reportedFull = false;
        
        // 充电状态变化
        battery.addEventListener('chargingchange', () => {
            if (battery.charging && !lastCharging) {
                addUserReportEvent('你开始给手机充电了', 'charge');
            } else if (!battery.charging && lastCharging) {
                const pct = Math.round(battery.level * 100);
                addUserReportEvent(`你拔掉了充电器 (当前电量 ${pct}%)`, 'charge');
            }
            lastCharging = battery.charging;
        });
        
        // 电量变化
        battery.addEventListener('levelchange', () => {
            const pct = Math.round(battery.level * 100);
            
            // 电量低于 20% 提醒 (只提醒一次)
            if (pct <= 20 && !reportedLow) {
                addUserReportEvent(`你的手机电量不足 (${pct}%)`, 'battery_low');
                reportedLow = true;
            }
            if (pct > 20) reportedLow = false;
            
            // 充满电提醒 (只提醒一次)
            if (pct >= 100 && battery.charging && !reportedFull) {
                addUserReportEvent('你的手机已充满电', 'battery_full');
                reportedFull = true;
            }
            if (pct < 100) reportedFull = false;
            
            lastLevel = battery.level;
        });
        
        console.log('[LookUs] Battery monitor started. Charging:', battery.charging, 'Level:', Math.round(battery.level * 100) + '%');
    }).catch(err => {
        console.warn('[LookUs] Battery API error:', err);
    });
}

// 监听页面可见性变化 (锁屏/切换标签)
function setupVisibilityMonitor() {
    let lastHiddenTime = null;
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            lastHiddenTime = Date.now();
            // Don't report immediately on hide - wait to see if they come back quickly
        } else {
            if (lastHiddenTime) {
                const awayMs = Date.now() - lastHiddenTime;
                const awayMin = Math.floor(awayMs / 60000);
                
                if (awayMin >= 1) {
                    // Only report if away for more than 1 minute
                    if (awayMin >= 60) {
                        const awayHours = Math.floor(awayMin / 60);
                        const remainMin = awayMin % 60;
                        addUserReportEvent(`你离开了 ${awayHours}小时${remainMin}分钟后回来了`, 'screen_on');
                    } else {
                        addUserReportEvent(`你离开了 ${awayMin} 分钟后回来了`, 'screen_on');
                    }
                }
            }
            lastHiddenTime = null;
        }
    });
    
    console.log('[LookUs] Visibility monitor started');
}

// 监听网络状态变化
function setupNetworkMonitor() {
    window.addEventListener('online', () => {
        addUserReportEvent('你的网络已恢复连接', 'online');
    });
    
    window.addEventListener('offline', () => {
        addUserReportEvent('你的网络已断开', 'offline');
    });
    
    console.log('[LookUs] Network monitor started');
}

// 初始化所有用户端监听器
function setupUserEventMonitors() {
    setupBatteryMonitor();
    setupVisibilityMonitor();
    setupNetworkMonitor();
    console.log('[LookUs] All user event monitors initialized');
}

// 在 initLookusApp 之外也可调用，确保监听器尽早启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUserEventMonitors);
} else {
    setupUserEventMonitors();
}

// ==========================================
// LookUS 通知弹窗 (Notification Banner)
// ==========================================

let lookusNotificationTimer = null;

function showLookusNotification(contactName, message, iconClass) {
    // Don't show if LookUs app is currently open and visible
    const lookusApp = document.getElementById('lookus-app');
    if (lookusApp && !lookusApp.classList.contains('hidden')) {
        return;
    }

    const banner = document.getElementById('lookus-notification');
    const titleEl = document.getElementById('lookus-notification-title');
    const msgEl = document.getElementById('lookus-notification-message');
    const iconEl = document.getElementById('lookus-notification-icon');
    const timeEl = document.getElementById('lookus-notification-time');

    if (!banner) return;

    // Set content
    if (titleEl) titleEl.textContent = contactName + ' 状态更新';
    if (msgEl) msgEl.textContent = message;
    if (iconEl && iconClass) {
        iconEl.className = iconClass;
        iconEl.style.fontSize = '20px';
    }
    if (timeEl) timeEl.textContent = '现在';

    // Clear any existing timer
    if (lookusNotificationTimer) {
        clearTimeout(lookusNotificationTimer);
        lookusNotificationTimer = null;
    }

    // Show banner with animation
    banner.classList.remove('hidden');

    // Auto-hide after 5 seconds
    lookusNotificationTimer = setTimeout(() => {
        hideLookusNotification();
    }, 5000);

    console.log('[LookUs Notification]', contactName, message);
}

function hideLookusNotification() {
    const banner = document.getElementById('lookus-notification');
    if (banner) {
        banner.classList.add('hidden');
    }
    if (lookusNotificationTimer) {
        clearTimeout(lookusNotificationTimer);
        lookusNotificationTimer = null;
    }
}

// Click handler: open LookUs app and navigate to report tab
window.handleLookusNotificationClick = function() {
    hideLookusNotification();

    // Open LookUs app
    const lookusApp = document.getElementById('lookus-app');
    if (lookusApp) {
        lookusApp.classList.remove('hidden');
        lookusApp.style.opacity = '1';
        lookusApp.style.transform = 'scale(1)';
    }

    // Switch to report tab
    setTimeout(() => {
        switchLookusTab('report');
    }, 100);
};

// Expose for external use
window.showLookusNotification = showLookusNotification;
window.hideLookusNotification = hideLookusNotification;

// 导出 UI 更新函数
window.updateLookusUi = function() {
    setupAmapSettings();
    const settings = window.iphoneSimState.amapSettings || {};
    if (String(settings.jsKey || settings.key || '').trim()) {
        loadAmap();
        // 延迟渲染以确保状态已更新
        setTimeout(() => {
            renderLookusApp();
        }, 100);
    }
};

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(initLookusApp);
}
