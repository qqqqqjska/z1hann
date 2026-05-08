(function () {



    const ORDINARY_PATHS = ['bgColor','textColor','useIndependentPadding','paddingUnified','paddingTop','paddingRight','paddingBottom','paddingLeft','borderEnabled','borderColor','borderAlpha','borderWidth','radiusUnified','radiusSingle.tl','radiusSingle.tr','radiusSingle.br','radiusSingle.bl','radiusContinuous.first.tl','radiusContinuous.first.tr','radiusContinuous.first.br','radiusContinuous.first.bl','radiusContinuous.middle.tl','radiusContinuous.middle.tr','radiusContinuous.middle.br','radiusContinuous.middle.bl','radiusContinuous.last.tl','radiusContinuous.last.tr','radiusContinuous.last.br','radiusContinuous.last.bl','blur','opacity','shadowEnabled','shadowColor','shadowAlpha','shadowBlur','shadowSpread','fontSize','backgroundImage','deco1.enabled','deco1.url','deco1.size','deco1.x','deco1.y','deco1.lastOnly','deco2.enabled','deco2.url','deco2.size','deco2.x','deco2.y','deco2.lastOnly'];



    const VOICE_PATHS = ['bgColor','waveColor','timeColor','lengthRatio','iconSize','useIndependentPadding','paddingUnified','paddingTop','paddingRight','paddingBottom','paddingLeft','borderEnabled','borderColor','borderAlpha','borderWidth','radiusUnified','radiusSingle.tl','radiusSingle.tr','radiusSingle.br','radiusSingle.bl','radiusContinuous.first.tl','radiusContinuous.first.tr','radiusContinuous.first.br','radiusContinuous.first.bl','radiusContinuous.middle.tl','radiusContinuous.middle.tr','radiusContinuous.middle.br','radiusContinuous.middle.bl','radiusContinuous.last.tl','radiusContinuous.last.tr','radiusContinuous.last.br','radiusContinuous.last.bl','blur','opacity','shadowEnabled','shadowColor','shadowAlpha','shadowBlur','shadowSpread','fontSize','backgroundImage','deco1.enabled','deco1.url','deco1.size','deco1.x','deco1.y','deco1.lastOnly','deco2.enabled','deco2.url','deco2.size','deco2.x','deco2.y','deco2.lastOnly'];



    const QUOTED_PATHS = ['lineColor','textColor','lineWidth','bgOpacity','radius','fontSize','topMargin'];



    const TOPBAR_PATHS = ['bgColor','textColor','iconColor','bgOpacity','blur','height','dividerColor','dividerOpacity','dividerWidth','backgroundImage','backIconUrl','fireIconUrl','settingsIconUrl','shadowEnabled','shadowColor','shadowOpacity','shadowBlur'];



    const BOTTOMBAR_PATHS = ['barBgColor','inputBgColor','iconColor','barOpacity','blur','inputRadius','inputHeight','inputBorderColor','inputBorderWidth','dividerColor','dividerOpacity','dividerWidth','backgroundImage','menuIconUrl','stickerIconUrl','replyIconUrl'];







    const uiState = { ordinaryRole: 'other', voiceRole: 'other', quotedRole: 'other', avatarRole: 'other' };



    const styleState = createDefaultState();



    let previewStyleEl = null;



    let wechatStyleEl = null;



    let wechatAppliedState = null;



    let wechatAppliedCssText = '';



    let wechatObserver = null;



    let wechatSyncQueued = false;



    const STUDIO_APPEARANCE_SECTION_IDS = { ordinary: 'sec-ordinary', voice: 'sec-voice', quoted: 'sec-quoted', avatar: 'sec-avatar', topbar: 'sec-topbar', bottombar: 'sec-bottombar' };



    const STUDIO_APPEARANCE_LOCK_GROUPS = [



        { key: 'ordinaryBase', sectionKey: 'ordinary', sectionId: 'sec-ordinary', label: '基础样式', exportLabel: '普通气泡 / 基础样式' },



        { key: 'ordinaryPadding', sectionKey: 'ordinary', sectionId: 'sec-ordinary', label: '内边距', exportLabel: '普通气泡 / 内边距' },



        { key: 'ordinaryBorder', sectionKey: 'ordinary', sectionId: 'sec-ordinary', label: '边框', exportLabel: '普通气泡 / 边框' },



        { key: 'ordinaryRadius', sectionKey: 'ordinary', sectionId: 'sec-ordinary', label: '圆角', exportLabel: '普通气泡 / 圆角' },



        { key: 'ordinaryShadow', sectionKey: 'ordinary', sectionId: 'sec-ordinary', label: '阴影', exportLabel: '普通气泡 / 阴影' },



        { key: 'ordinaryDecoration', sectionKey: 'ordinary', sectionId: 'sec-ordinary', label: '贴图装饰', exportLabel: '普通气泡 / 贴图装饰' },



        { key: 'ordinaryTimestamp', sectionKey: 'ordinary', sectionId: 'sec-ordinary', label: '时间戳', exportLabel: '普通气泡 / 时间戳' },



        { key: 'ordinaryLayout', sectionKey: 'ordinary', sectionId: 'sec-ordinary', label: '气泡间距', exportLabel: '普通气泡 / 气泡间距' },



        { key: 'voiceBase', sectionKey: 'voice', sectionId: 'sec-voice', label: '基础样式', exportLabel: '语音气泡 / 基础样式' },



        { key: 'voicePadding', sectionKey: 'voice', sectionId: 'sec-voice', label: '内边距', exportLabel: '语音气泡 / 内边距' },



        { key: 'voiceBorder', sectionKey: 'voice', sectionId: 'sec-voice', label: '边框', exportLabel: '语音气泡 / 边框' },



        { key: 'voiceRadius', sectionKey: 'voice', sectionId: 'sec-voice', label: '圆角', exportLabel: '语音气泡 / 圆角' },



        { key: 'voiceShadow', sectionKey: 'voice', sectionId: 'sec-voice', label: '阴影', exportLabel: '语音气泡 / 阴影' },



        { key: 'voiceDecoration', sectionKey: 'voice', sectionId: 'sec-voice', label: '贴图装饰', exportLabel: '语音气泡 / 贴图装饰' },



        { key: 'voiceTimestamp', sectionKey: 'voice', sectionId: 'sec-voice', label: '时间戳', exportLabel: '语音气泡 / 时间戳' },



        { key: 'voiceLayout', sectionKey: 'voice', sectionId: 'sec-voice', label: '气泡间距', exportLabel: '语音气泡 / 气泡间距' },



        { key: 'quotedBase', sectionKey: 'quoted', sectionId: 'sec-quoted', label: '引用样式', exportLabel: '引用消息 / 整体样式' },



        { key: 'avatarBase', sectionKey: 'avatar', sectionId: 'sec-avatar', label: '基础样式', exportLabel: '消息头像 / 基础样式' },



        { key: 'avatarBorder', sectionKey: 'avatar', sectionId: 'sec-avatar', label: '边框', exportLabel: '消息头像 / 边框' },



        { key: 'avatarShadow', sectionKey: 'avatar', sectionId: 'sec-avatar', label: '阴影', exportLabel: '消息头像 / 阴影' },



        { key: 'avatarSeries', sectionKey: 'avatar', sectionId: 'sec-avatar', label: '连发显示', exportLabel: '消息头像 / 连发显示' },



        { key: 'avatarFrame', sectionKey: 'avatar', sectionId: 'sec-avatar', label: '头像框', exportLabel: '消息头像 / 头像框' },



        { key: 'topbarBase', sectionKey: 'topbar', sectionId: 'sec-topbar', label: '背景与分隔线', exportLabel: '顶栏 / 背景与分隔线' },



        { key: 'topbarAvatar', sectionKey: 'topbar', sectionId: 'sec-topbar', label: '头像显示与位置', exportLabel: '顶栏 / 头像显示与位置' },



        { key: 'topbarText', sectionKey: 'topbar', sectionId: 'sec-topbar', label: '名字与状态', exportLabel: '顶栏 / 名字与状态' },



        { key: 'topbarBackButton', sectionKey: 'topbar', sectionId: 'sec-topbar', label: '返回按钮', exportLabel: '顶栏 / 返回按钮' },



        { key: 'topbarSettingsButton', sectionKey: 'topbar', sectionId: 'sec-topbar', label: '右侧按钮', exportLabel: '顶栏 / 右侧按钮' },



        { key: 'topbarIcons', sectionKey: 'topbar', sectionId: 'sec-topbar', label: '图标贴图', exportLabel: '顶栏 / 图标贴图' },



        { key: 'bottombarBase', sectionKey: 'bottombar', sectionId: 'sec-bottombar', label: '底栏与输入框', exportLabel: '底栏 / 底栏与输入框' },



        { key: 'bottombarMenuButton', sectionKey: 'bottombar', sectionId: 'sec-bottombar', label: '加号按钮', exportLabel: '底栏 / 加号按钮' },



        { key: 'bottombarStickerButton', sectionKey: 'bottombar', sectionId: 'sec-bottombar', label: '贴纸按钮', exportLabel: '底栏 / 贴纸按钮' },



        { key: 'bottombarReplyButton', sectionKey: 'bottombar', sectionId: 'sec-bottombar', label: '语音按钮', exportLabel: '底栏 / 语音按钮' },



        { key: 'bottombarIcons', sectionKey: 'bottombar', sectionId: 'sec-bottombar', label: '按钮图标贴图', exportLabel: '底栏 / 按钮图标贴图' }



    ];



    const STUDIO_APPEARANCE_SCOPE_KEYS = STUDIO_APPEARANCE_LOCK_GROUPS.map(function (item) { return item.key; });



    const STUDIO_APPEARANCE_SECTION_GROUPS = STUDIO_APPEARANCE_LOCK_GROUPS.reduce(function (map, item) { if (!map[item.sectionKey]) map[item.sectionKey] = []; map[item.sectionKey].push(item.key); return map; }, {});



    let toolbarShadowRoot = null;



    let toolbarBindings = null;



    let editableScopesState = createDefaultEditableScopes();



    let currentAppearancePresetMeta = null;







    function clone(value) { return JSON.parse(JSON.stringify(value)); }



    function mergeDeep(target, source) { Object.keys(source || {}).forEach(function (key) { const next = source[key]; if (next && typeof next === 'object' && !Array.isArray(next)) { if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {}; mergeDeep(target[key], next); } else target[key] = next; }); return target; }



    function createBubble(overrides) { return mergeDeep({ bgColor: '#ffffff', textColor: '#1c1c1e', useIndependentPadding: true, paddingUnified: 12, paddingTop: 12, paddingRight: 16, paddingBottom: 12, paddingLeft: 16, borderEnabled: false, borderColor: '#d1d1d6', borderAlpha: 18, borderWidth: 1, radiusMode: 'single', radiusUnified: 20, radiusSingle: { tl: 20, tr: 20, br: 20, bl: 4 }, radiusContinuous: { first: { tl: 20, tr: 20, br: 20, bl: 4 }, middle: { tl: 20, tr: 20, br: 20, bl: 20 }, last: { tl: 20, tr: 20, br: 20, bl: 4 } }, blur: 0, opacity: 100, shadowEnabled: false, shadowColor: '#000000', shadowAlpha: 8, shadowBlur: 10, shadowSpread: 0, fontSize: 16, timestampMode: 'outside', timestampFontSize: 10, timestampOffsetX: 0, timestampOffsetY: 0, backgroundImage: '', deco1: { enabled: false, url: '', size: 36, x: 0, y: 0, lastOnly: false }, deco2: { enabled: false, url: '', size: 36, x: 0, y: 0, lastOnly: false } }, overrides || {}); }



    function createVoice(overrides) { return mergeDeep(createBubble({ waveColor: '#1c1c1e', timeColor: '#1c1c1e', lengthRatio: 60, iconSize: 20, fontSize: 14 }), overrides || {}); }



    function createDefaultState() {



        return {



            ordinary: { other: createBubble({ shadowEnabled: true, shadowAlpha: 5, shadowBlur: 2 }), user: createBubble({ bgColor: '#333333', textColor: '#ffffff', radiusSingle: { tl: 20, tr: 20, br: 4, bl: 20 }, radiusContinuous: { first: { tl: 20, tr: 20, br: 4, bl: 20 }, middle: { tl: 20, tr: 20, br: 20, bl: 20 }, last: { tl: 20, tr: 20, br: 4, bl: 20 } } }) },



            voice: { other: createVoice({ shadowEnabled: true, shadowAlpha: 5, shadowBlur: 2 }), user: createVoice({ bgColor: '#333333', textColor: '#ffffff', waveColor: '#ffffff', timeColor: '#ffffff', radiusSingle: { tl: 20, tr: 20, br: 4, bl: 20 }, radiusContinuous: { first: { tl: 20, tr: 20, br: 4, bl: 20 }, middle: { tl: 20, tr: 20, br: 20, bl: 20 }, last: { tl: 20, tr: 20, br: 4, bl: 20 } } }) },



            quoted: { other: { lineColor: '#ccaa44', textColor: '#999999', lineWidth: 0, bgOpacity: 0, radius: 0, fontSize: 12, topMargin: 4 }, user: { lineColor: '#ccaa44', textColor: '#999999', lineWidth: 0, bgOpacity: 0, radius: 0, fontSize: 12, topMargin: 4 } },



            layout: { bubbleGap: 12 },



            avatar: { shared: { size: 34, radius: 17, borderColor: '#ffffff', borderOpacity: 0, borderWidth: 0, shadowColor: '#000000', shadowOpacity: 0, shadowBlur: 0, shadowSpread: 0, gap: 8, offsetY: 0 }, other: { seriesMode: 'always', frameUrl: '' }, user: { seriesMode: 'always', frameUrl: '' } },



            topbar: { bgColor: '#ffffff', textColor: '#1c1c1e', iconColor: '#1c1c1e', bgOpacity: 75, blur: 20, height: 44, dividerColor: '#000000', dividerOpacity: 8, dividerWidth: 1, backgroundImage: '', backIconUrl: '', fireIconUrl: '', settingsIconUrl: '', shadowEnabled: true, shadowColor: '#000000', shadowOpacity: 3, shadowBlur: 8, avatarVisible: false, avatarPosition: 'left', statusVisible: false, statusText: '', titleFontSize: 17, titleOffsetX: 0, titleOffsetY: 0, statusFontSize: 11, statusOffsetX: 0, statusOffsetY: 0, backButtonSize: 28, backButtonOffsetX: 0, backButtonOffsetY: 0, backButtonBgColor: '#ffffff', backButtonBgOpacity: 0, backButtonRadius: 999, backButtonShadowColor: '#000000', backButtonShadowOpacity: 0, backButtonShadowBlur: 0, backButtonShadowSpread: 0, avatarButtonSize: 34, avatarButtonOffsetX: 0, avatarButtonOffsetY: 0, avatarButtonBgColor: '#1c1c1e', avatarButtonBgOpacity: 8, avatarButtonRadius: 999, avatarButtonShadowColor: '#000000', avatarButtonShadowOpacity: 0, avatarButtonShadowBlur: 0, avatarButtonShadowSpread: 0, settingsButtonSize: 28, settingsButtonOffsetX: 0, settingsButtonOffsetY: 0, settingsButtonBgColor: '#ffffff', settingsButtonBgOpacity: 0, settingsButtonRadius: 999, settingsButtonShadowColor: '#000000', settingsButtonShadowOpacity: 0, settingsButtonShadowBlur: 0, settingsButtonShadowSpread: 0 },



            bottombar: { barBgColor: '#ffffff', inputBgColor: '#ffffff', iconColor: '#8f8f96', barOpacity: 75, blur: 20, height: 83, inputRadius: 18, inputHeight: 36, inputWidth: 0, inputOffsetX: 0, inputOffsetY: 0, inputBorderColor: '#d3d3da', inputBorderWidth: 1.5, inputOpacity: 100, inputBlur: 0, inputBackgroundImage: '', inputTextColor: '#1c1c1e', inputPlaceholderText: 'iMessage', inputPlaceholderColor: '#9a9aa2', inputPlaceholderFontSize: 15, inputShadowColor: '#000000', inputShadowOpacity: 0, inputShadowBlur: 0, inputShadowSpread: 0, dividerColor: '#000000', dividerOpacity: 8, dividerWidth: 1, backgroundImage: '', menuIconUrl: '', stickerIconUrl: '', replyIconUrl: '', menuButtonVisible: true, menuButtonSize: 34, menuButtonOffsetX: 0, menuButtonOffsetY: 0, menuButtonBgColor: '#8f8f96', menuButtonBgOpacity: 10, menuButtonRadius: 999, menuButtonShadowColor: '#000000', menuButtonShadowOpacity: 0, menuButtonShadowBlur: 0, menuButtonShadowSpread: 0, stickerButtonVisible: true, stickerButtonSize: 28, stickerButtonOffsetX: 0, stickerButtonOffsetY: 0, stickerButtonBgColor: '#8f8f96', stickerButtonBgOpacity: 0, stickerButtonRadius: 999, stickerButtonShadowColor: '#000000', stickerButtonShadowOpacity: 0, stickerButtonShadowBlur: 0, stickerButtonShadowSpread: 0, replyButtonVisible: true, replyButtonSize: 28, replyButtonOffsetX: 0, replyButtonOffsetY: 0, replyButtonBgColor: '#8f8f96', replyButtonBgOpacity: 0, replyButtonRadius: 999, replyButtonShadowColor: '#000000', replyButtonShadowOpacity: 0, replyButtonShadowBlur: 0, replyButtonShadowSpread: 0 }



        };



    }



    function createDefaultEditableScopes() { return STUDIO_APPEARANCE_SCOPE_KEYS.reduce(function (result, key) { result[key] = true; return result; }, {}); }



    function getStudioAppearanceLockGroupMeta(key) { return STUDIO_APPEARANCE_LOCK_GROUPS.find(function (item) { return item.key === key; }) || null; }



    function normalizeEditableScopes(value) {



        const normalized = createDefaultEditableScopes();



        const source = value && typeof value === 'object' ? value : {};



        Object.keys(STUDIO_APPEARANCE_SECTION_IDS).forEach(function (sectionKey) {



            if (!Object.prototype.hasOwnProperty.call(source, sectionKey)) return;



            const enabled = source[sectionKey] !== false;



            (STUDIO_APPEARANCE_SECTION_GROUPS[sectionKey] || []).forEach(function (groupKey) {



                normalized[groupKey] = enabled;



            });



        });



        STUDIO_APPEARANCE_SCOPE_KEYS.forEach(function (key) {



            if (Object.prototype.hasOwnProperty.call(source, key)) normalized[key] = source[key] !== false;



        });



        return normalized;



    }



    function normalizePresetId(value) { return String(value || '').trim().replace(/^studio:/i, '').replace(/[^a-z0-9\-_]+/gi, '-').replace(/^-+|-+$/g, ''); }



    function slugifyPresetName(value) { const normalized = String(value || '').trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-').replace(/^-+|-+$/g, ''); return normalized || ('preset-' + Date.now().toString(36)); }



    function buildStudioPresetKey(id) { const normalized = normalizePresetId(id); return normalized ? ('studio:' + normalized) : ''; }



    function createStudioPresetId(name) { return normalizePresetId(slugifyPresetName(name) + '-' + Date.now().toString(36)); }



    function cloneMergedStudioState(source) { return mergeDeep(createDefaultState(), clone(source || {})); }



    function replaceStyleState(nextState) { const fresh = cloneMergedStudioState(nextState); Object.keys(styleState).forEach(function (key) { delete styleState[key]; }); mergeDeep(styleState, fresh); }



    function replaceEditableScopes(nextScopes) { editableScopesState = normalizeEditableScopes(nextScopes); }



    function normalizeStudioAppearancePresetRecord(input, fallbackName) { const source = input && typeof input === 'object' ? input : {}; const rawName = String(source.name || fallbackName || '未命名外观').trim() || '未命名外观'; const existingId = normalizePresetId(source.id || source.presetId || source.presetKey || rawName); const id = existingId || createStudioPresetId(rawName); const now = new Date().toISOString(); return { type: 'studio-chat-appearance-preset', version: 1, id: id, presetKey: buildStudioPresetKey(id), name: rawName, state: cloneMergedStudioState(source.state || source.styleState || source.style || {}), editableScopes: normalizeEditableScopes(source.editableScopes || source.allowedScopes || source.permissions), createdAt: source.createdAt || now, updatedAt: source.updatedAt || now }; }



    function getStudioAppearancePresetStore() { const runtime = window.iphoneSimState; if (!runtime || typeof runtime !== 'object') return []; if (!Array.isArray(runtime.studioAppearancePresets)) runtime.studioAppearancePresets = []; return runtime.studioAppearancePresets; }



    function listStoredStudioAppearancePresets() { return getStudioAppearancePresetStore().map(function (entry) { return normalizeStudioAppearancePresetRecord(entry, entry && entry.name); }).sort(function (a, b) { return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')); }); }



    function getStoredStudioAppearancePresetByKey(key) { const target = String(key || '').trim(); if (!target) return null; const store = getStudioAppearancePresetStore(); for (let index = 0; index < store.length; index += 1) { const normalized = normalizeStudioAppearancePresetRecord(store[index], store[index] && store[index].name); if (normalized.presetKey === target || normalized.id === normalizePresetId(target)) return normalized; } return null; }



    function notifyStudioAppearancePresetListChanged() { if (typeof window.renderChatAppearancePresetOptions === 'function') window.renderChatAppearancePresetOptions(); if (typeof window.syncChatAppearancePresetDeleteButton === 'function') window.syncChatAppearancePresetDeleteButton(); }



    function saveStoredStudioAppearancePreset(name) { const trimmedName = String(name || '').trim(); if (!trimmedName) return null; const store = getStudioAppearancePresetStore(); const lowerName = trimmedName.toLowerCase(); const currentKey = currentAppearancePresetMeta && currentAppearancePresetMeta.presetKey ? currentAppearancePresetMeta.presetKey : ''; let existingIndex = -1; for (let index = 0; index < store.length; index += 1) { const normalized = normalizeStudioAppearancePresetRecord(store[index], store[index] && store[index].name); if ((currentKey && normalized.presetKey === currentKey) || String(normalized.name || '').trim().toLowerCase() === lowerName) { existingIndex = index; break; } } const previous = existingIndex > -1 ? normalizeStudioAppearancePresetRecord(store[existingIndex], trimmedName) : null; const record = normalizeStudioAppearancePresetRecord({ id: previous ? previous.id : '', name: trimmedName, createdAt: previous ? previous.createdAt : new Date().toISOString(), updatedAt: new Date().toISOString(), state: clone(styleState), editableScopes: clone(editableScopesState) }, trimmedName); if (existingIndex > -1) store[existingIndex] = record; else store.push(record); currentAppearancePresetMeta = { id: record.id, presetKey: record.presetKey, name: record.name }; if (typeof window.saveConfig === 'function') window.saveConfig(); notifyStudioAppearancePresetListChanged(); return { preset: record, updated: existingIndex > -1 }; }



    function deleteStoredStudioAppearancePresetByKey(key) { const target = String(key || '').trim(); if (!target) return false; const store = getStudioAppearancePresetStore(); const nextStore = []; let removed = null; store.forEach(function (entry) { const normalized = normalizeStudioAppearancePresetRecord(entry, entry && entry.name); if (!removed && normalized.presetKey === target) { removed = normalized; return; } nextStore.push(entry); }); if (!removed) return false; window.iphoneSimState.studioAppearancePresets = nextStore; if (Array.isArray(window.iphoneSimState.contacts)) { window.iphoneSimState.contacts.forEach(function (contact) { if (contact && String(contact.chatAppearancePreset || '').trim() === removed.presetKey) contact.chatAppearancePreset = 'default'; }); } if (currentAppearancePresetMeta && currentAppearancePresetMeta.presetKey === removed.presetKey) currentAppearancePresetMeta = null; if (typeof window.saveConfig === 'function') window.saveConfig(); notifyStudioAppearancePresetListChanged(); return true; }



    function getCurrentStudioAppearanceSnapshot() { return { meta: currentAppearancePresetMeta ? clone(currentAppearancePresetMeta) : null, state: clone(styleState), editableScopes: clone(editableScopesState) }; }



    function getByPath(obj, path) { return String(path).split('.').reduce(function (current, key) { return current == null ? undefined : current[key]; }, obj); }



    function setByPath(obj, path, value) { const parts = String(path).split('.'); let current = obj; for (let i = 0; i < parts.length - 1; i += 1) { if (!current[parts[i]] || typeof current[parts[i]] !== 'object') current[parts[i]] = {}; current = current[parts[i]]; } current[parts[parts.length - 1]] = value; }



    function clamp(value, min, max) { const number = Number(value); if (!Number.isFinite(number)) return min; return Math.min(max, Math.max(min, number)); }



    function rgba(color, opacity) { const raw = String(color || '').trim(); if (!raw) return 'rgba(0,0,0,' + (clamp(opacity, 0, 100) / 100) + ')'; if (/^rgba?\(/i.test(raw)) return raw; let hex = raw.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(function (ch) { return ch + ch; }).join(''); const parsed = parseInt(hex, 16); if (Number.isNaN(parsed)) return raw; return 'rgba(' + ((parsed >> 16) & 255) + ', ' + ((parsed >> 8) & 255) + ', ' + (parsed & 255) + ', ' + (clamp(opacity, 0, 100) / 100) + ')'; }



    function normalizeUrl(value) { return String(value == null ? '' : value).trim(); }



    function cssUrl(value) { const normalized = normalizeUrl(value); return normalized ? 'url("' + normalized.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")' : 'none'; }



    function bgStack(color, opacity, imageUrl) { const tint = rgba(color, opacity); const image = cssUrl(imageUrl); return image === 'none' ? 'linear-gradient(' + tint + ',' + tint + ')' : 'linear-gradient(' + tint + ',' + tint + '), ' + image; }



    function padValue(state) { return state.useIndependentPadding ? [state.paddingTop, state.paddingRight, state.paddingBottom, state.paddingLeft].map(function (value) { return Math.round(value) + 'px'; }).join(' ') : Math.round(state.paddingUnified) + 'px'; }



    function padValueWithExtraRight(state, extraRight) { const extra = Math.max(0, Number(extraRight) || 0); if (state.useIndependentPadding) return [state.paddingTop, state.paddingRight + extra, state.paddingBottom, state.paddingLeft].map(function (value) { return Math.round(value) + 'px'; }).join(' '); return [state.paddingUnified, state.paddingUnified + extra, state.paddingUnified, state.paddingUnified].map(function (value) { return Math.round(value) + 'px'; }).join(' '); }



    function borderValue(enabled, width, color, alpha) { return !enabled || Number(width) <= 0 ? 'none' : Number(width) + 'px solid ' + rgba(color, alpha); }



    function shadowValue(enabled, color, alpha, blur, spread) { return enabled ? '0 0 ' + Number(blur) + 'px ' + Number(spread) + 'px ' + rgba(color, alpha) : 'none'; }



    function radiusValue(radius) { return [radius.tl, radius.tr, radius.br, radius.bl].map(function (value) { return Math.round(value) + 'px'; }).join(' '); }



    function ensurePreviewStyle() { if (!previewStyleEl) { previewStyleEl = document.getElementById('studio-toolbar-live-preview'); if (!previewStyleEl) { previewStyleEl = document.createElement('style'); previewStyleEl.id = 'studio-toolbar-live-preview'; document.head.appendChild(previewStyleEl); } } return previewStyleEl; }



    function ensureWechatStyle() { if (!wechatStyleEl) { wechatStyleEl = document.getElementById('studio-toolbar-wechat-style'); if (!wechatStyleEl) { wechatStyleEl = document.createElement('style'); wechatStyleEl.id = 'studio-toolbar-wechat-style'; document.head.appendChild(wechatStyleEl); } } return wechatStyleEl; }



    function getScreen() { return document.getElementById('studio-chat-screen'); }



    function setVars(screen, stateOverride) { const currentState = stateOverride || styleState; screen.style.setProperty('--studio-topbar-height', clamp(currentState.topbar.height, 28, 88) + 'px'); screen.style.setProperty('--studio-topbar-blur', clamp(currentState.topbar.blur, 0, 50) + 'px'); screen.style.setProperty('--studio-bottombar-blur', clamp(currentState.bottombar.blur, 0, 50) + 'px'); screen.style.setProperty('--studio-bottom-bar-height', clamp(currentState.bottombar.height, 60, 160) + 'px'); screen.style.setProperty('--studio-bottom-input-height', clamp(currentState.bottombar.inputHeight, 24, 72) + 'px'); screen.style.setProperty('--studio-bottom-input-radius', clamp(currentState.bottombar.inputRadius, 0, 40) + 'px'); screen.style.setProperty('--studio-bubble-gap', clamp(currentState.layout.bubbleGap, 0, 40) + 'px'); screen.style.setProperty('--studio-avatar-size', clamp(currentState.avatar.shared.size, 20, 88) + 'px'); }



    function normalizeTopbarAvatarPosition(value) { const normalized = String(value || 'left').toLowerCase(); return normalized === 'center' || normalized === 'right' ? normalized : 'left'; }



    function normalizeTimestampMode(value) { const normalized = String(value || 'outside').toLowerCase(); return normalized === 'inside' || normalized === 'hidden' || normalized === 'avatar-below' ? normalized : 'outside'; }



    function normalizeAvatarSeriesMode(value) { const normalized = String(value || 'always').toLowerCase(); return normalized === 'first' || normalized === 'last' ? normalized : 'always'; }



    function getDefaultStudioStatusText() { const statusEl = document.getElementById('studio-chat-status'); const raw = statusEl ? String(statusEl.dataset.defaultText || statusEl.textContent || '').trim() : ''; return raw || '5G Online'; }



    function radiusRules(rowSelector, bubbleSelector, state) { const base = '#studio-chat-screen ' + rowSelector + ' ' + bubbleSelector; if (state.radiusMode === 'unified') return base + '{border-radius:' + Math.round(state.radiusUnified) + 'px !important;}'; if (state.radiusMode === 'single') return base + '{border-radius:' + radiusValue(state.radiusSingle) + ' !important;}'; return [ base + '{border-radius:' + radiusValue(state.radiusSingle) + ' !important;}', '#studio-chat-screen ' + rowSelector + '[data-series-slot="first"] ' + bubbleSelector + '{border-radius:' + radiusValue(state.radiusContinuous.first) + ' !important;}', '#studio-chat-screen ' + rowSelector + '[data-series-slot="middle"] ' + bubbleSelector + '{border-radius:' + radiusValue(state.radiusContinuous.middle) + ' !important;}', '#studio-chat-screen ' + rowSelector + '[data-series-slot="last"] ' + bubbleSelector + '{border-radius:' + radiusValue(state.radiusContinuous.last) + ' !important;}', '#studio-chat-screen ' + rowSelector + '[data-series-count="1"] ' + bubbleSelector + '{border-radius:' + Math.round(state.radiusContinuous.first.tl) + 'px ' + Math.round(state.radiusContinuous.first.tr) + 'px ' + Math.round(state.radiusContinuous.last.br) + 'px ' + Math.round(state.radiusContinuous.last.bl) + 'px !important;}' ].join('\n'); }



    function decoRules(rowSelector, bubbleSelector, decoClass, deco) { const base = '#studio-chat-screen ' + rowSelector + ' ' + bubbleSelector + ' .' + decoClass; const url = normalizeUrl(deco.url); if (!deco.enabled || !url) return base + '{display:none !important; background-image:none !important;}'; const target = deco.lastOnly ? '#studio-chat-screen ' + rowSelector + '[data-series-slot="last"] ' + bubbleSelector + ' .' + decoClass + ', #studio-chat-screen ' + rowSelector + '[data-series-count="1"] ' + bubbleSelector + ' .' + decoClass : base; const anchor = decoClass === 'deco-1' ? 'top:0 !important; right:0 !important;' : 'left:0 !important; bottom:0 !important;'; return base + '{display:none !important; background-image:none !important;}\n' + target + '{display:block !important; width:' + clamp(deco.size, 10, 220) + 'px !important; height:' + clamp(deco.size, 10, 220) + 'px !important; ' + anchor + ' transform:translate(' + (Number(deco.x) || 0) + 'px,' + (Number(deco.y) || 0) + 'px) !important; background-image:' + cssUrl(url) + ' !important; background-repeat:no-repeat !important; background-position:center !important; background-size:contain !important; pointer-events:none !important; z-index:2 !important;}'; }



    function bubbleRules(rowSelector, bubbleSelector, state, voice) { const base = '#studio-chat-screen ' + rowSelector + ' ' + bubbleSelector; const lines = [ base + '{background-image:' + bgStack(state.bgColor, state.opacity, state.backgroundImage) + ' !important; background-color:transparent !important; background-size:cover !important; background-position:center !important; background-repeat:no-repeat !important; color:' + state.textColor + ' !important; padding:' + padValue(state) + ' !important; border:' + borderValue(state.borderEnabled, state.borderWidth, state.borderColor, state.borderAlpha) + ' !important; box-shadow:' + shadowValue(state.shadowEnabled, state.shadowColor, state.shadowAlpha, state.shadowBlur, state.shadowSpread) + ' !important; -webkit-backdrop-filter:blur(' + clamp(state.blur, 0, 50) + 'px) !important; backdrop-filter:blur(' + clamp(state.blur, 0, 50) + 'px) !important; font-size:' + clamp(state.fontSize, 10, 24) + 'px !important;}', radiusRules(rowSelector, bubbleSelector, state), decoRules(rowSelector, bubbleSelector, 'deco-1', state.deco1), decoRules(rowSelector, bubbleSelector, 'deco-2', state.deco2) ]; if (voice) { lines.push('#studio-chat-screen ' + rowSelector + ' .voice-bar-top{min-width:' + Math.round(72 + clamp(state.lengthRatio, 10, 100) * 1.2) + 'px !important;}'); lines.push('#studio-chat-screen ' + rowSelector + ' .voice-bar{background:' + state.waveColor + ' !important; opacity:0.82 !important;}'); lines.push('#studio-chat-screen ' + rowSelector + ' .voice-icon-box i{color:' + state.timeColor + ' !important; font-size:' + clamp(state.iconSize, 12, 40) + 'px !important;}'); lines.push('#studio-chat-screen ' + rowSelector + ' .voice-dur-text, #studio-chat-screen ' + rowSelector + ' .voice-time{color:' + state.timeColor + ' !important; font-size:' + clamp(state.fontSize, 10, 22) + 'px !important;}'); lines.push('#studio-chat-screen ' + rowSelector + ' .voice-text-bottom, #studio-chat-screen ' + rowSelector + ' .transcription{color:' + state.timeColor + ' !important; font-size:' + clamp(state.fontSize, 10, 22) + 'px !important; border-top-color:' + rgba(state.timeColor, rowSelector.indexOf('.user') > -1 ? 24 : 16) + ' !important;}'); } return lines.join('\n'); }



    function timestampRules(rowSelector, bubbleSelector, state) { const mode = normalizeTimestampMode(state.timestampMode); const base = '#studio-chat-screen ' + rowSelector; const timeBase = base + ' .msg-time'; const inlineBase = base + ' ' + bubbleSelector + ' .bubble-inline-time'; const bubbleBase = base + ' ' + bubbleSelector; const isUser = rowSelector.indexOf('.user') > -1; const fontSize = clamp(state.timestampFontSize, 8, 22); const offsetX = clamp(state.timestampOffsetX, -180, 180); const offsetY = clamp(state.timestampOffsetY, -120, 120); if (mode === 'hidden') return timeBase + '{display:none !important;}\n' + inlineBase + '{display:none !important;}'; if (mode === 'inside') return [ timeBase + '{display:none !important;}', bubbleBase + '{position:relative !important; padding:' + padValueWithExtraRight(state, fontSize + 26) + ' !important;}', inlineBase + '{display:block !important; position:absolute !important; right:10px !important; top:calc(50% + ' + offsetY + 'px) !important; font-size:' + fontSize + 'px !important; line-height:1 !important; white-space:nowrap !important; color:' + rgba(state.textColor, isUser ? 72 : 58) + ' !important; transform:translate(' + offsetX + 'px,-50%) !important; pointer-events:none !important; z-index:3 !important;}' ].join('\n'); if (mode === 'avatar-below') return [ inlineBase + '{display:none !important;}', base + '{position:relative !important; padding-bottom:' + (fontSize + 10) + 'px !important;}', timeBase + '{display:block !important; position:absolute !important; ' + (isUser ? 'right:8px !important;' : 'left:8px !important;') + ' bottom:0 !important; width:max(32px, var(--studio-avatar-size, 34px)) !important; margin:0 !important; text-align:center !important; font-size:' + fontSize + 'px !important; line-height:1 !important; white-space:nowrap !important; color:#b4b4bb !important; transform:translate(' + offsetX + 'px,' + offsetY + 'px) !important; pointer-events:none !important; z-index:3 !important;}' ].join('\n'); return [ inlineBase + '{display:none !important;}', timeBase + '{display:block !important; position:relative !important; font-size:' + fontSize + 'px !important; line-height:1 !important; white-space:nowrap !important; color:#b4b4bb !important; transform:translate(' + offsetX + 'px,' + offsetY + 'px) !important;}' ].join('\n'); }



    function quoteRules(role, state) { const lineWidth = clamp(state.lineWidth, 0, 10); const radius = clamp(state.radius, 0, 24); const topMargin = clamp(state.topMargin, 0, 24); const fontSize = clamp(state.fontSize, 10, 18); const bgOpacity = clamp(state.bgOpacity, 0, 100); const hasPanel = lineWidth > 0 || bgOpacity > 0 || radius > 0; const padding = hasPanel ? '3px 6px' : '0 2px'; const borderCss = lineWidth > 0 ? (lineWidth + 'px solid ' + state.lineColor) : 'none'; const background = bgOpacity > 0 ? rgba(role === 'user' ? '#000000' : '#ffffff', bgOpacity) : 'transparent'; const align = role === 'user' ? 'right' : 'left'; const selfAlign = role === 'user' ? 'flex-end' : 'flex-start'; return '#studio-chat-screen .chat-message.' + role + '[data-has-reply="true"] .quote-container{margin-top:' + topMargin + 'px !important; padding:' + padding + ' !important; border-left:' + borderCss + ' !important; border-radius:' + radius + 'px !important; background:' + background + ' !important; color:' + state.textColor + ' !important; font-size:' + fontSize + 'px !important; line-height:1.3 !important; text-align:' + align + ' !important; align-self:' + selfAlign + ' !important; white-space:nowrap !important; word-break:normal !important; overflow:hidden !important; text-overflow:ellipsis !important; max-width:100% !important;}'; }



    function topbarRules(state) {

        return [

            '#studio-chat-screen .chat-header{height:calc(max(47px, env(safe-area-inset-top, 0px)) + var(--studio-topbar-height)) !important; background-image:' + bgStack(state.bgColor, state.bgOpacity, state.backgroundImage) + ' !important; background-color:transparent !important; -webkit-backdrop-filter:blur(var(--studio-topbar-blur)) !important; backdrop-filter:blur(var(--studio-topbar-blur)) !important; border-bottom:' + borderValue(Number(state.dividerWidth) > 0, state.dividerWidth, state.dividerColor, state.dividerOpacity) + ' !important; box-shadow:' + (state.shadowEnabled ? ('0 1px ' + clamp(state.shadowBlur, 0, 40) + 'px ' + rgba(state.shadowColor, state.shadowOpacity)) : 'none') + ' !important;}',

            '#studio-chat-screen .chat-header-main{top:calc(max(47px, env(safe-area-inset-top, 0px)) + ' + (clamp(state.height, 28, 88) / 2) + 'px) !important;}',

            '#studio-chat-screen #studio-chat-messages.chat-body{padding-top:calc(max(47px, env(safe-area-inset-top, 0px)) + ' + (clamp(state.height, 28, 88) + 12) + 'px) !important;}',

            '#studio-chat-screen #studio-chat-title{color:' + state.textColor + ' !important;}',

            '#studio-chat-screen .chat-topbar-status{color:' + rgba(state.textColor, 55) + ' !important;}',

            '#studio-chat-screen .chat-header .back-btn, #studio-chat-screen .chat-header .wechat-icon-btn, #studio-chat-screen .chat-header .multi-select-cancel, #studio-chat-screen .chat-topbar-avatar{color:' + state.iconColor + ' !important;}'

        ].join('\n');

    }



    function topbarButtonBoxRule(selector, size, offsetX, offsetY, bgColor, bgOpacity, radius, shadowColor, shadowOpacity, shadowBlur, shadowSpread) {

        return selector + '{width:' + size + 'px !important; height:' + size + 'px !important; min-width:' + size + 'px !important; flex-basis:' + size + 'px !important; padding:0 !important; justify-content:center !important; align-items:center !important; background-color:' + (Number(bgOpacity) > 0 ? rgba(bgColor, bgOpacity) : 'transparent') + ' !important; border-radius:' + clamp(radius, 0, 999) + 'px !important; box-shadow:' + shadowValue(Number(shadowOpacity) > 0, shadowColor, shadowOpacity, clamp(shadowBlur, 0, 40), clamp(shadowSpread, -16, 24)) + ' !important; overflow:hidden !important; transform:translate(' + clamp(offsetX, -180, 180) + 'px,' + clamp(offsetY, -120, 120) + 'px) !important;}';

    }



    function bottomButtonBoxRule(selector, visible, size, offsetX, offsetY, bgColor, bgOpacity, radius, shadowColor, shadowOpacity, shadowBlur, shadowSpread) {

        return selector + '{display:' + (visible === false ? 'none' : 'flex') + ' !important; width:' + size + 'px !important; height:' + size + 'px !important; min-width:' + size + 'px !important; flex-basis:' + size + 'px !important; padding:0 !important; justify-content:center !important; align-items:center !important; background-color:' + (Number(bgOpacity) > 0 ? rgba(bgColor, bgOpacity) : 'transparent') + ' !important; border-radius:' + clamp(radius, 0, 999) + 'px !important; box-shadow:' + shadowValue(Number(shadowOpacity) > 0, shadowColor, shadowOpacity, clamp(shadowBlur, 0, 40), clamp(shadowSpread, -16, 24)) + ' !important; overflow:hidden !important; transform:translate(' + clamp(offsetX, -180, 180) + 'px,' + clamp(offsetY, -120, 120) + 'px) !important;}';

    }



    function topbarDetailRules(state) {

        const backSize = clamp(state.backButtonSize, 18, 72);
        const avatarSize = clamp(state.avatarButtonSize, 20, 88);
        const settingsSize = clamp(state.settingsButtonSize, 18, 72);

        return [

            '#studio-chat-screen #studio-chat-title{font-size:' + clamp(state.titleFontSize, 10, 30) + 'px !important; position:relative !important; left:' + clamp(state.titleOffsetX, -180, 180) + 'px !important; top:' + clamp(state.titleOffsetY, -120, 120) + 'px !important;}',

            '#studio-chat-screen .chat-topbar-status{font-size:' + clamp(state.statusFontSize, 8, 24) + 'px !important; position:relative !important; left:' + clamp(state.statusOffsetX, -180, 180) + 'px !important; top:' + clamp(state.statusOffsetY, -120, 120) + 'px !important;}',

            topbarButtonBoxRule('#studio-chat-screen #close-studio-app', backSize, state.backButtonOffsetX, state.backButtonOffsetY, state.backButtonBgColor, state.backButtonBgOpacity, state.backButtonRadius, state.backButtonShadowColor, state.backButtonShadowOpacity, state.backButtonShadowBlur, state.backButtonShadowSpread),

            '#studio-chat-screen #close-studio-app i{font-size:' + clamp(Math.round(backSize * 0.62), 12, 42) + 'px !important;}',

            topbarButtonBoxRule('#studio-chat-screen #studio-chat-topbar-avatar-main, #studio-chat-screen #studio-chat-topbar-avatar-right', avatarSize, state.avatarButtonOffsetX, state.avatarButtonOffsetY, state.avatarButtonBgColor, state.avatarButtonBgOpacity, state.avatarButtonRadius, state.avatarButtonShadowColor, state.avatarButtonShadowOpacity, state.avatarButtonShadowBlur, state.avatarButtonShadowSpread),

            '#studio-chat-screen #studio-chat-topbar-avatar-main i, #studio-chat-screen #studio-chat-topbar-avatar-right i{font-size:' + clamp(Math.round(avatarSize * 0.52), 12, 42) + 'px !important;}',

            topbarButtonBoxRule('#studio-chat-screen #studio-chat-settings-btn', settingsSize, state.settingsButtonOffsetX, state.settingsButtonOffsetY, state.settingsButtonBgColor, state.settingsButtonBgOpacity, state.settingsButtonRadius, state.settingsButtonShadowColor, state.settingsButtonShadowOpacity, state.settingsButtonShadowBlur, state.settingsButtonShadowSpread),

            '#studio-chat-screen #studio-chat-settings-btn i{font-size:' + clamp(Math.round(settingsSize * 0.62), 12, 42) + 'px !important;}'

        ].join('\n');

    }



    function bottomRules(state) {

        const placeholderFontSize = clamp(state.inputPlaceholderFontSize, 10, 28);

        return [

            '#studio-chat-screen #studio-chat-messages.chat-body{padding-bottom:calc(var(--studio-bottom-bar-height) + 12px) !important;}',

            '#studio-chat-screen .chat-input-area{min-height:var(--studio-bottom-bar-height) !important; background-image:' + bgStack(state.barBgColor, state.barOpacity, state.backgroundImage) + ' !important; background-color:transparent !important; -webkit-backdrop-filter:blur(var(--studio-bottombar-blur)) !important; backdrop-filter:blur(var(--studio-bottombar-blur)) !important; border-top:' + borderValue(Number(state.dividerWidth) > 0, state.dividerWidth, state.dividerColor, state.dividerOpacity) + ' !important;}',

            '#studio-chat-screen .chat-input-shell{background-image:' + bgStack(state.inputBgColor, state.inputOpacity, state.inputBackgroundImage) + ' !important; background-color:transparent !important; background-size:cover !important; background-position:center !important; background-repeat:no-repeat !important; -webkit-backdrop-filter:blur(' + clamp(state.inputBlur, 0, 40) + 'px) !important; backdrop-filter:blur(' + clamp(state.inputBlur, 0, 40) + 'px) !important; border:' + clamp(state.inputBorderWidth, 0, 6) + 'px solid ' + state.inputBorderColor + ' !important; border-radius:var(--studio-bottom-input-radius) !important; height:var(--studio-bottom-input-height) !important; box-shadow:' + shadowValue(Number(state.inputShadowOpacity) > 0, state.inputShadowColor, state.inputShadowOpacity, clamp(state.inputShadowBlur, 0, 40), clamp(state.inputShadowSpread, -16, 24)) + ' !important;}',

            '#studio-chat-screen #studio-chat-input{color:' + state.inputTextColor + ' !important; -webkit-text-fill-color:' + state.inputTextColor + ' !important;}',

            '#studio-chat-screen #studio-chat-input::placeholder{color:' + state.inputPlaceholderColor + ' !important; font-size:' + placeholderFontSize + 'px !important; opacity:1 !important;}',

            '#studio-chat-screen .chat-icon-btn, #studio-chat-screen .chat-input-inline-btn, #studio-chat-screen #studio-trigger-ai-reply-btn, #studio-chat-screen #studio-sticker-btn{color:' + state.iconColor + ' !important;}'

        ].join('\n');

    }



    function bottomDetailRules(state) {

        const inputWidth = clamp(state.inputWidth, 0, 480);
        const inputLayout = inputWidth > 0 ? 'flex:0 0 auto !important; width:' + inputWidth + 'px !important; max-width:' + inputWidth + 'px !important;' : 'flex:1 1 auto !important; width:auto !important; max-width:none !important;';
        const menuSize = clamp(state.menuButtonSize, 20, 88);
        const stickerSize = clamp(state.stickerButtonSize, 20, 88);
        const replySize = clamp(state.replyButtonSize, 20, 88);

        return [

            '#studio-chat-screen .chat-input-shell{' + inputLayout + ' transform:translate(' + clamp(state.inputOffsetX, -180, 180) + 'px,' + clamp(state.inputOffsetY, -120, 120) + 'px) !important;}',

            bottomButtonBoxRule('#studio-chat-screen #studio-chat-more-btn', state.menuButtonVisible, menuSize, state.menuButtonOffsetX, state.menuButtonOffsetY, state.menuButtonBgColor, state.menuButtonBgOpacity, state.menuButtonRadius, state.menuButtonShadowColor, state.menuButtonShadowOpacity, state.menuButtonShadowBlur, state.menuButtonShadowSpread),

            '#studio-chat-screen #studio-chat-more-btn i{font-size:' + clamp(Math.round(menuSize * 0.59), 12, 42) + 'px !important;}',

            bottomButtonBoxRule('#studio-chat-screen #studio-sticker-btn', state.stickerButtonVisible, stickerSize, state.stickerButtonOffsetX, state.stickerButtonOffsetY, state.stickerButtonBgColor, state.stickerButtonBgOpacity, state.stickerButtonRadius, state.stickerButtonShadowColor, state.stickerButtonShadowOpacity, state.stickerButtonShadowBlur, state.stickerButtonShadowSpread),

            '#studio-chat-screen #studio-sticker-btn i{font-size:' + clamp(Math.round(stickerSize * 0.79), 12, 48) + 'px !important;}',

            bottomButtonBoxRule('#studio-chat-screen #studio-trigger-ai-reply-btn', state.replyButtonVisible, replySize, state.replyButtonOffsetX, state.replyButtonOffsetY, state.replyButtonBgColor, state.replyButtonBgOpacity, state.replyButtonRadius, state.replyButtonShadowColor, state.replyButtonShadowOpacity, state.replyButtonShadowBlur, state.replyButtonShadowSpread),

            '#studio-chat-screen #studio-trigger-ai-reply-btn i{font-size:' + clamp(Math.round(replySize * 0.86), 12, 48) + 'px !important;}'

        ].join('\n');

    }



    function avatarRules(currentState) {



        const shared = currentState.avatar.shared;



        const size = clamp(shared.size, 20, 88);



        const radius = clamp(shared.radius, 0, 44);



        const gap = clamp(shared.gap, 0, 40);



        const offsetY = clamp(shared.offsetY, -60, 60);



        const border = borderValue(Number(shared.borderWidth) > 0 && Number(shared.borderOpacity) > 0, shared.borderWidth, shared.borderColor, shared.borderOpacity);



        const shadow = shadowValue(Number(shared.shadowOpacity) > 0, shared.shadowColor, shared.shadowOpacity, clamp(shared.shadowBlur, 0, 40), clamp(shared.shadowSpread, -16, 24));



        const lines = [



            '#studio-chat-screen .chat-message > .chat-avatar-shell{position:relative !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; width:' + size + 'px !important; height:' + size + 'px !important; min-width:' + size + 'px !important; flex-basis:' + size + 'px !important; overflow:visible !important; border-radius:' + radius + 'px !important; transform:translateY(' + offsetY + 'px) !important;}',



            '#studio-chat-screen .chat-message > .chat-avatar-shell .chat-avatar-img{display:block !important; width:100% !important; height:100% !important; object-fit:cover !important; box-sizing:border-box !important; border-radius:inherit !important; border:' + border + ' !important; box-shadow:' + shadow + ' !important;}',



            '#studio-chat-screen .chat-message > .chat-avatar-shell .chat-avatar-frame{position:absolute !important; inset:0 !important; display:none !important; border-radius:inherit !important; background-repeat:no-repeat !important; background-position:center !important; background-size:100% 100% !important; pointer-events:none !important; z-index:2 !important;}',



            '#studio-chat-screen .chat-message.other > .chat-avatar-shell{margin:0 ' + gap + 'px 2px 8px !important; display:inline-flex !important; visibility:visible !important;}',



            '#studio-chat-screen .chat-message.user > .chat-avatar-shell{margin:0 8px 2px ' + gap + 'px !important; display:inline-flex !important; visibility:visible !important;}'



        ];



        [{ role: 'other', state: currentState.avatar.other }, { role: 'user', state: currentState.avatar.user }].forEach(function (entry) {



            const frameUrl = normalizeUrl(entry.state.frameUrl);



            const seriesMode = normalizeAvatarSeriesMode(entry.state.seriesMode);



            lines.push('#studio-chat-screen .chat-message.' + entry.role + ' > .chat-avatar-shell .chat-avatar-frame{display:' + (frameUrl ? 'block' : 'none') + ' !important; background-image:' + (frameUrl ? cssUrl(frameUrl) : 'none') + ' !important;}');



            if (seriesMode === 'first') lines.push('#studio-chat-screen .chat-message.' + entry.role + '[data-avatar-series-slot="middle"] > .chat-avatar-shell, #studio-chat-screen .chat-message.' + entry.role + '[data-avatar-series-slot="last"] > .chat-avatar-shell{visibility:hidden !important; opacity:0 !important; pointer-events:none !important;}');



            else if (seriesMode === 'last') lines.push('#studio-chat-screen .chat-message.' + entry.role + '[data-avatar-series-slot="first"] > .chat-avatar-shell, #studio-chat-screen .chat-message.' + entry.role + '[data-avatar-series-slot="middle"] > .chat-avatar-shell{visibility:hidden !important; opacity:0 !important; pointer-events:none !important;}');



        });



        return lines.join('\n');



    }



    function buildCssForState(currentState) { return [ bubbleRules('.chat-message.other[data-preview-group="ordinary"]', '.message-content', currentState.ordinary.other, false), bubbleRules('.chat-message.user[data-preview-group="ordinary"]', '.message-content', currentState.ordinary.user, false), bubbleRules('.chat-message.other[data-preview-group="voice"]', '.message-content.voice-msg', currentState.voice.other, true), bubbleRules('.chat-message.user[data-preview-group="voice"]', '.message-content.voice-msg', currentState.voice.user, true), timestampRules('.chat-message.other:not([data-preview-group="voice"])', '.message-content', currentState.ordinary.other), timestampRules('.chat-message.user:not([data-preview-group="voice"])', '.message-content', currentState.ordinary.user), timestampRules('.chat-message.other[data-preview-group="voice"]', '.message-content.voice-msg', currentState.voice.other), timestampRules('.chat-message.user[data-preview-group="voice"]', '.message-content.voice-msg', currentState.voice.user), quoteRules('other', currentState.quoted.other), quoteRules('user', currentState.quoted.user), avatarRules(currentState), topbarRules(currentState.topbar), topbarDetailRules(currentState.topbar), bottomRules(currentState.bottombar), bottomDetailRules(currentState.bottombar) ].join('\n'); }



    function buildCss() { return buildCssForState(styleState); }



    function clearIcon(element, hideWhenEmpty) { if (!element) return; delete element.dataset.studioCustomIcon; element.style.backgroundImage = ''; element.style.backgroundRepeat = ''; element.style.backgroundPosition = ''; element.style.backgroundSize = ''; if (hideWhenEmpty) element.classList.add('hidden'); }



    function applyIcon(element, url, hideWhenEmpty, size) { if (!element) return; const normalized = normalizeUrl(url); if (!normalized) { clearIcon(element, hideWhenEmpty); return; } element.dataset.studioCustomIcon = 'true'; element.style.backgroundImage = 'url("' + normalized.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")'; element.style.backgroundRepeat = 'no-repeat'; element.style.backgroundPosition = 'center'; element.style.backgroundSize = size || '68% auto'; if (hideWhenEmpty) element.classList.remove('hidden'); }



    function setTopbarAvatarButton(button, imageUrl, visible) { if (!button) return; const shouldShow = !!visible; button.classList.toggle('hidden', !shouldShow); button.classList.toggle('has-image', shouldShow && !!imageUrl); button.dataset.studioAvatarRole = shouldShow ? 'contact-avatar' : ''; if (shouldShow && imageUrl) { delete button.dataset.studioCustomIcon; button.style.backgroundImage = 'url("' + imageUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '")'; button.style.backgroundRepeat = 'no-repeat'; button.style.backgroundPosition = 'center'; button.style.backgroundSize = 'cover'; button.innerHTML = ''; } else { if (!button.dataset.studioCustomIcon) { button.style.backgroundImage = ''; button.style.backgroundRepeat = ''; button.style.backgroundPosition = ''; button.style.backgroundSize = ''; } if (!button.innerHTML) button.innerHTML = '<i class="ri-user-line"></i>'; } }



    function getStudioTopbarAvatarUrl() { const main = document.getElementById('studio-chat-topbar-avatar-main'); const right = document.getElementById('studio-chat-topbar-avatar-right'); return (main && main.dataset.avatarUrl) || (right && right.dataset.avatarUrl) || ''; }



    function resetRightTopbarAvatarButton(button) { if (!button) return; const hasCustomIcon = button.dataset.studioCustomIcon === 'true'; button.classList.remove('has-image'); button.dataset.studioAvatarRole = ''; if (hasCustomIcon) return; button.classList.add('hidden'); button.style.backgroundImage = ''; button.style.backgroundRepeat = ''; button.style.backgroundPosition = ''; button.style.backgroundSize = ''; button.innerHTML = '<i class="ri-user-line"></i>'; }



    function applyTopbarAvatarLayout() { const screen = getScreen(); const header = screen ? screen.querySelector('.chat-header') : null; const mainAvatarButton = document.getElementById('studio-chat-topbar-avatar-main'); const rightAvatarButton = document.getElementById('studio-chat-topbar-avatar-right'); const settingsButton = document.getElementById('studio-chat-settings-btn'); const statusText = document.getElementById('studio-chat-status'); const avatarUrl = getStudioTopbarAvatarUrl(); const position = normalizeTopbarAvatarPosition(styleState.topbar.avatarPosition); ['show-topbar-avatar', 'topbar-avatar-left', 'topbar-avatar-center', 'topbar-avatar-right', 'show-topbar-status'].forEach(function (className) { if (header) header.classList.remove(className); if (screen) screen.classList.remove(className); }); setTopbarAvatarButton(mainAvatarButton, avatarUrl, false); resetRightTopbarAvatarButton(rightAvatarButton); if (settingsButton) settingsButton.classList.remove('hidden'); if (statusText) { statusText.textContent = ''; statusText.classList.add('hidden'); } if (!screen || !header || !styleState.topbar.avatarVisible) return; header.classList.add('show-topbar-avatar', 'topbar-avatar-' + position); screen.classList.add('topbar-avatar-' + position); if (styleState.topbar.statusVisible && position !== 'center' && statusText) { statusText.textContent = String(styleState.topbar.statusText || '').trim() || getDefaultStudioStatusText(); statusText.classList.remove('hidden'); header.classList.add('show-topbar-status'); } if (position === 'right') { if (settingsButton) settingsButton.classList.add('hidden'); setTopbarAvatarButton(rightAvatarButton, avatarUrl, true); return; } setTopbarAvatarButton(mainAvatarButton, avatarUrl, true); }



    function applyBottomBarRuntimeState(options) {

        const currentState = options && options.state ? options.state : createDefaultState().bottombar;

        const input = document.getElementById(options && options.inputId);

        const placeholderText = Object.prototype.hasOwnProperty.call(currentState, 'inputPlaceholderText') ? String(currentState.inputPlaceholderText == null ? '' : currentState.inputPlaceholderText) : 'iMessage';

        if (input) input.setAttribute('placeholder', placeholderText);

        [

            [options && options.menuId, currentState.menuButtonVisible !== false],

            [options && options.stickerId, currentState.stickerButtonVisible !== false],

            [options && options.replyId, currentState.replyButtonVisible !== false]

        ].forEach(function (item) {

            const element = document.getElementById(item[0]);

            if (!element) return;

            element.style.display = item[1] ? '' : 'none';

            element.setAttribute('aria-hidden', item[1] ? 'false' : 'true');

        });

    }



    function applyPreview() { const screen = getScreen(); if (!screen) return; setVars(screen); ensurePreviewStyle().textContent = buildCss(); applyIcon(document.getElementById('close-studio-app'), styleState.topbar.backIconUrl, false); applyIcon(document.getElementById('studio-chat-settings-btn'), styleState.topbar.settingsIconUrl, false); applyIcon(document.getElementById('studio-chat-topbar-avatar-right'), styleState.topbar.fireIconUrl, true, '100% 100%'); applyIcon(document.getElementById('studio-chat-more-btn'), styleState.bottombar.menuIconUrl, false); applyIcon(document.getElementById('studio-sticker-btn'), styleState.bottombar.stickerIconUrl, false); applyIcon(document.getElementById('studio-trigger-ai-reply-btn'), styleState.bottombar.replyIconUrl, false); applyBottomBarRuntimeState({ state: styleState.bottombar, inputId: 'studio-chat-input', menuId: 'studio-chat-more-btn', stickerId: 'studio-sticker-btn', replyId: 'studio-trigger-ai-reply-btn' }); applyTopbarAvatarLayout(); }



    function translateStudioCssToWechat(cssText) { return String(cssText || '').replace(/#studio-chat-screen/g, '#chat-screen').replace(/#studio-chat-title/g, '#chat-title').replace(/#close-studio-app/g, '#back-to-contacts').replace(/#studio-chat-settings-btn/g, '#chat-settings-btn').replace(/#studio-chat-topbar-avatar-main/g, '#chat-topbar-avatar-main').replace(/#studio-chat-topbar-avatar-right/g, '#chat-topbar-avatar-right').replace(/#studio-chat-more-btn/g, '#chat-more-btn').replace(/#studio-sticker-btn/g, '#sticker-btn').replace(/#studio-trigger-ai-reply-btn/g, '#trigger-ai-reply-btn').replace(/#studio-chat-input/g, '#chat-input').replace(/#studio-chat-messages/g, '#chat-messages'); }



    function getWechatDecorationBaseCss() { return '#chat-screen .chat-message[data-preview-group="ordinary"] .studio-bubble-deco, #chat-screen .chat-message[data-preview-group="voice"] .studio-bubble-deco{display:none;position:absolute;width:0;height:0;background-repeat:no-repeat;background-position:center;background-size:contain;pointer-events:none;z-index:2;}\n#chat-screen .chat-message[data-preview-group="ordinary"] .bubble-inline-time, #chat-screen .chat-message[data-preview-group="voice"] .bubble-inline-time{display:none;position:absolute;pointer-events:none;z-index:3;white-space:nowrap;line-height:1;}\n#chat-screen .chat-message[data-has-reply="true"] .msg-wrapper{gap:0;}'; }



    function clearSeriesData(row) { if (!row || !row.dataset) return; delete row.dataset.seriesSlot; delete row.dataset.seriesIndex; delete row.dataset.seriesCount; }



    function clearAvatarSeriesData(row) { if (!row || !row.dataset) return; delete row.dataset.avatarSeriesSlot; delete row.dataset.avatarSeriesIndex; delete row.dataset.avatarSeriesCount; }



    function removeWechatBubbleDecos(content) { if (!content) return; content.querySelectorAll('.studio-bubble-deco').forEach(function (node) { node.remove(); }); }



    function removeWechatInlineTime(content) { if (!content) return; content.querySelectorAll('.bubble-inline-time').forEach(function (node) { node.remove(); }); }



    function ensureWechatBubbleDecos(content) { if (!content) return; ['deco-1', 'deco-2'].forEach(function (className) { let node = content.querySelector('.' + className + '.studio-bubble-deco'); if (!node) { node = document.createElement('span'); node.className = 'studio-bubble-deco ' + className; node.setAttribute('aria-hidden', 'true'); content.appendChild(node); } }); }



    function ensureWechatInlineTime(content, text) { if (!content) return; let node = content.querySelector('.bubble-inline-time'); if (!node) { node = document.createElement('span'); node.className = 'bubble-inline-time'; node.setAttribute('aria-hidden', 'true'); content.appendChild(node); } node.textContent = String(text || '').trim(); }



    function ensureWechatAvatarShell(row) {



        if (!row) return null;



        const directChildren = Array.from(row.children || []);



        let shell = directChildren.find(function (node) { return node && node.classList && node.classList.contains('chat-avatar-shell'); }) || null;



        if (!shell) {



            const avatarImage = directChildren.find(function (node) { return node && node.tagName === 'IMG' && node.classList && node.classList.contains('chat-avatar'); }) || null;



            if (!avatarImage) return null;



            shell = document.createElement('span');



            shell.className = 'chat-avatar chat-avatar-shell';



            shell.dataset.studioAvatarShell = 'true';



            row.insertBefore(shell, avatarImage);



            avatarImage.classList.remove('chat-avatar');



            avatarImage.classList.add('chat-avatar-img');



            shell.appendChild(avatarImage);



        }



        shell.classList.add('chat-avatar');



        shell.classList.add('chat-avatar-shell');



        if (!shell.dataset.studioAvatarShell) shell.dataset.studioAvatarShell = 'true';



        const image = shell.querySelector('img');



        if (image) {



            image.classList.remove('chat-avatar');



            image.classList.add('chat-avatar-img');



        }



        let frame = shell.querySelector('.chat-avatar-frame');



        if (!frame) {



            frame = document.createElement('span');



            frame.className = 'chat-avatar-frame';



            frame.setAttribute('aria-hidden', 'true');



            shell.appendChild(frame);



        }



        return shell;



    }



    function unwrapWechatAvatarShell(row) {



        if (!row) return;



        const shell = Array.from(row.children || []).find(function (node) { return node && node.classList && node.classList.contains('chat-avatar-shell') && node.dataset && node.dataset.studioAvatarShell === 'true'; }) || null;



        if (!shell) return;



        const image = shell.querySelector('img.chat-avatar-img, img');



        if (image) {



            image.classList.remove('chat-avatar-img');



            image.classList.add('chat-avatar');



            row.insertBefore(image, shell);



        }



        shell.remove();



    }



    function flushSeriesRun(run) { if (!run || !run.length) return; const count = run.length; run.forEach(function (row, index) { row.dataset.seriesIndex = String(index); row.dataset.seriesCount = String(count); row.dataset.seriesSlot = count === 1 ? 'first' : (index === 0 ? 'first' : (index === count - 1 ? 'last' : 'middle')); }); }



    function flushAvatarSeriesRun(run) { if (!run || !run.length) return; const count = run.length; run.forEach(function (row, index) { let slot = 'single'; if (count >= 3) slot = index === 0 ? 'first' : (index === count - 1 ? 'last' : 'middle'); else if (count === 2) slot = index === 0 ? 'first' : 'last'; row.dataset.avatarSeriesIndex = String(index + 1); row.dataset.avatarSeriesCount = String(count); row.dataset.avatarSeriesSlot = slot; }); }



    function annotateWechatMessageRows() {



        const container = document.getElementById('chat-messages');



        if (!container) return;



        const rows = Array.from(container.querySelectorAll('.chat-message'));



        const blockedClasses = ['no-bubble', 'sticker-msg', 'image-msg', 'virtual-image-msg', 'description-msg', 'transfer-msg', 'gift-card-msg', 'shopping-gift-msg', 'delivery-share-msg', 'order-progress-msg', 'family-card-msg', 'food-invite-msg', 'music-listen-invite-msg', 'savings-invite-msg', 'savings-withdraw-msg', 'savings-progress-msg'];



        let bubbleRun = [];



        let previousBubbleKey = '';



        let avatarRun = [];



        let previousAvatarRole = '';



        rows.forEach(function (row) {



            const role = row.classList.contains('user') ? 'user' : (row.classList.contains('other') ? 'other' : '');



            const content = row.querySelector('.message-content');



            const hasReply = !!row.querySelector('.quote-container');



            if (row.dataset) row.dataset.hasReply = hasReply ? 'true' : 'false';



            if (!role) {



                delete row.dataset.previewGroup;



                clearSeriesData(row);



                clearAvatarSeriesData(row);



                if (content) {



                    removeWechatBubbleDecos(content);



                    removeWechatInlineTime(content);



                }



                unwrapWechatAvatarShell(row);



                flushSeriesRun(bubbleRun);



                bubbleRun = [];



                previousBubbleKey = '';



                flushAvatarSeriesRun(avatarRun);



                avatarRun = [];



                previousAvatarRole = '';



                return;



            }



            const avatarShell = ensureWechatAvatarShell(row);



            if (avatarShell) {



                avatarShell.dataset.role = role;



                if (previousAvatarRole && previousAvatarRole !== role) {



                    flushAvatarSeriesRun(avatarRun);



                    avatarRun = [];



                }



                avatarRun.push(row);



                previousAvatarRole = role;



            } else {



                clearAvatarSeriesData(row);



                flushAvatarSeriesRun(avatarRun);



                avatarRun = [];



                previousAvatarRole = '';



            }



            if (!content) {



                delete row.dataset.previewGroup;



                clearSeriesData(row);



                flushSeriesRun(bubbleRun);



                bubbleRun = [];



                previousBubbleKey = '';



                return;



            }



            const isVoice = content.classList.contains('voice-msg');



            const isBlocked = blockedClasses.some(function (className) { return content.classList.contains(className); });



            const group = isVoice ? 'voice' : (isBlocked ? '' : 'ordinary');



            if (!group) {



                delete row.dataset.previewGroup;



                clearSeriesData(row);



                removeWechatBubbleDecos(content);



                removeWechatInlineTime(content);



                flushSeriesRun(bubbleRun);



                bubbleRun = [];



                previousBubbleKey = '';



                return;



            }



            row.dataset.previewGroup = group;



            ensureWechatBubbleDecos(content);



            ensureWechatInlineTime(content, (row.querySelector('.msg-time') && row.querySelector('.msg-time').textContent) || '');



            const currentBubbleKey = role + '|' + group;



            if (previousBubbleKey && currentBubbleKey !== previousBubbleKey) {



                flushSeriesRun(bubbleRun);



                bubbleRun = [];



            }



            bubbleRun.push(row);



            previousBubbleKey = currentBubbleKey;



        });



        flushSeriesRun(bubbleRun);



        flushAvatarSeriesRun(avatarRun);



    }



    function getCurrentWechatContact() { const state = window.iphoneSimState; const contactId = state && state.currentChatContactId; const contacts = state && Array.isArray(state.contacts) ? state.contacts : []; return contacts.find(function (item) { return item && item.id === contactId; }) || null; }



    function getWechatTopbarAvatarUrl() { const contact = getCurrentWechatContact(); return contact ? String(contact.avatar || '').trim() : ''; }



    function getDefaultWechatStatusText() { const statusEl = document.getElementById('chat-topbar-status'); const raw = statusEl ? String(statusEl.dataset.defaultText || statusEl.textContent || '').trim() : ''; return raw || '5G Online'; }



    function applyWechatTopbarAvatarLayout() {



        if (!wechatAppliedState) return;



        const screen = document.getElementById('chat-screen');



        const header = screen ? screen.querySelector('.chat-header') : null;



        const mainAvatarButton = document.getElementById('chat-topbar-avatar-main');



        const rightAvatarButton = document.getElementById('chat-topbar-avatar-right');



        const settingsButton = document.getElementById('chat-settings-btn');



        const statusText = document.getElementById('chat-topbar-status');



        const avatarUrl = getWechatTopbarAvatarUrl();



        const position = normalizeTopbarAvatarPosition(wechatAppliedState.topbar.avatarPosition);



        ['show-topbar-avatar', 'topbar-avatar-left', 'topbar-avatar-center', 'topbar-avatar-right', 'show-topbar-status'].forEach(function (className) { if (header) header.classList.remove(className); if (screen) screen.classList.remove(className); });



        setTopbarAvatarButton(mainAvatarButton, avatarUrl, false);



        resetRightTopbarAvatarButton(rightAvatarButton);



        if (settingsButton) settingsButton.classList.remove('hidden');



        if (statusText) {



            if (!statusText.dataset.defaultText) statusText.dataset.defaultText = String(statusText.textContent || '').trim() || '5G Online';



            statusText.textContent = '';



            statusText.classList.add('hidden');



        }



        if (!screen || !header || !wechatAppliedState.topbar.avatarVisible) return;



        header.classList.add('show-topbar-avatar', 'topbar-avatar-' + position);



        screen.classList.add('topbar-avatar-' + position);



        if (wechatAppliedState.topbar.statusVisible && position !== 'center' && statusText) {



            statusText.textContent = String(wechatAppliedState.topbar.statusText || '').trim() || getDefaultWechatStatusText();



            statusText.classList.remove('hidden');



            header.classList.add('show-topbar-status');



        }



        if (position === 'right') {



            if (settingsButton) settingsButton.classList.add('hidden');



            setTopbarAvatarButton(rightAvatarButton, avatarUrl, true);



            return;



        }



        setTopbarAvatarButton(mainAvatarButton, avatarUrl, true);



    }



    function syncAppliedWechatStyles() {

        if (!wechatAppliedState) return;

        const screen = document.getElementById('chat-screen');

        if (!screen) return;

        setVars(screen, wechatAppliedState);

        ensureWechatStyle().textContent = wechatAppliedCssText;

        applyIcon(document.getElementById('back-to-contacts'), wechatAppliedState.topbar.backIconUrl, false);

        applyIcon(document.getElementById('chat-settings-btn'), wechatAppliedState.topbar.settingsIconUrl, false);

        applyIcon(document.getElementById('chat-topbar-avatar-right'), wechatAppliedState.topbar.fireIconUrl, true, '100% 100%');

        applyIcon(document.getElementById('chat-more-btn'), wechatAppliedState.bottombar.menuIconUrl, false);

        applyIcon(document.getElementById('sticker-btn'), wechatAppliedState.bottombar.stickerIconUrl, false);

        applyIcon(document.getElementById('trigger-ai-reply-btn'), wechatAppliedState.bottombar.replyIconUrl, false);

        applyBottomBarRuntimeState({ state: wechatAppliedState.bottombar, inputId: 'chat-input', menuId: 'chat-more-btn', stickerId: 'sticker-btn', replyId: 'trigger-ai-reply-btn' });

        annotateWechatMessageRows();

        applyWechatTopbarAvatarLayout();

    }



    function queueWechatStyleSync() { if (!wechatAppliedState || wechatSyncQueued) return; wechatSyncQueued = true; requestAnimationFrame(function () { wechatSyncQueued = false; syncAppliedWechatStyles(); }); }



    function ensureWechatObserver() {



        const container = document.getElementById('chat-messages');



        if (!container) return false;



        if (wechatObserver && wechatObserver.__target === container) return true;



        if (wechatObserver) wechatObserver.disconnect();



        wechatObserver = new MutationObserver(function () { queueWechatStyleSync(); });



        wechatObserver.observe(container, { childList: true, subtree: true });



        wechatObserver.__target = container;



        return true;



    }



    function hookWechatRenderHistory() {



        if (window.__studioWechatRenderHistoryHooked) return true;



        if (typeof window.renderChatHistory !== 'function') return false;



        const original = window.renderChatHistory;



        window.renderChatHistory = function () {



            const result = original.apply(this, arguments);



            queueWechatStyleSync();



            return result;



        };



        window.__studioWechatRenderHistoryHooked = true;



        return true;



    }



    function waitForWechatHooks() {



        const hooked = hookWechatRenderHistory();



        const observing = ensureWechatObserver();



        if (!hooked || !observing) {



            setTimeout(waitForWechatHooks, 220);



            return;



        }



        queueWechatStyleSync();



    }



    function applyWechatState(nextState) {



        wechatAppliedState = cloneMergedStudioState(nextState);



        wechatAppliedCssText = getWechatDecorationBaseCss() + '\n' + translateStudioCssToWechat(buildCssForState(wechatAppliedState));



        ensureWechatStyle().textContent = wechatAppliedCssText;



        ensureWechatObserver();



        queueWechatStyleSync();



        return true;



    }



    function clearStudioStylesFromWechat() {

        wechatAppliedState = null;

        wechatAppliedCssText = '';

        if (wechatStyleEl) wechatStyleEl.textContent = '';

        const screen = document.getElementById('chat-screen');

        if (screen) {

            ['--studio-topbar-height', '--studio-topbar-blur', '--studio-bottombar-blur', '--studio-bottom-bar-height', '--studio-bottom-input-height', '--studio-bottom-input-radius', '--studio-bubble-gap'].forEach(function (name) { screen.style.removeProperty(name); });

        }

        clearIcon(document.getElementById('back-to-contacts'), false);

        clearIcon(document.getElementById('chat-settings-btn'), false);

        clearIcon(document.getElementById('chat-topbar-avatar-right'), true);

        clearIcon(document.getElementById('chat-more-btn'), false);

        clearIcon(document.getElementById('sticker-btn'), false);

        clearIcon(document.getElementById('trigger-ai-reply-btn'), false);

        applyBottomBarRuntimeState({ state: createDefaultState().bottombar, inputId: 'chat-input', menuId: 'chat-more-btn', stickerId: 'sticker-btn', replyId: 'trigger-ai-reply-btn' });

        const rows = document.querySelectorAll('#chat-messages .chat-message');

        rows.forEach(function (row) {

            delete row.dataset.previewGroup;

            clearSeriesData(row);

            clearAvatarSeriesData(row);

            unwrapWechatAvatarShell(row);

            const content = row.querySelector('.message-content');

            removeWechatBubbleDecos(content);

            removeWechatInlineTime(content);

        });

        return true;

    }



    function applyStoredStudioAppearancePresetToWechat(presetLike) { const normalized = normalizeStudioAppearancePresetRecord(presetLike, presetLike && presetLike.name); return applyWechatState(normalized.state) && normalized; }



    function applyStudioStylesToWechat() { return applyWechatState(styleState); }



    function loadStudioAppearanceIntoToolbar(presetLike) {



        const normalized = normalizeStudioAppearancePresetRecord(presetLike, presetLike && presetLike.name);



        currentAppearancePresetMeta = { id: normalized.id, presetKey: normalized.presetKey, name: normalized.name };



        replaceStyleState(normalized.state);



        replaceEditableScopes(normalized.editableScopes);



        refreshToolbarUi();



        applyPreview();



        return normalized;



    }



    function exportCurrentStudioAppearanceAsFile(options) {



        const scopes = normalizeEditableScopes(options && options.editableScopes ? options.editableScopes : editableScopesState);



        const requestedName = String((options && (options.name || options.fileName)) || (currentAppearancePresetMeta && currentAppearancePresetMeta.name) || 'studio-appearance').trim() || 'studio-appearance';



        const payload = normalizeStudioAppearancePresetRecord({ name: requestedName, state: clone(styleState), editableScopes: scopes }, requestedName);



        payload.exportedAt = new Date().toISOString();



        const safeName = requestedName.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'studio-appearance';



        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });



        const url = URL.createObjectURL(blob);



        const link = document.createElement('a');



        link.href = url;



        link.download = /\.json$/i.test(safeName) ? safeName : (safeName + '.json');



        document.body.appendChild(link);



        link.click();



        link.remove();



        setTimeout(function () { URL.revokeObjectURL(url); }, 800);



        return payload;



    }



    function importStudioAppearanceFromFile(file) {



        return new Promise(function (resolve, reject) {



            if (!file) { reject(new Error('未选择文件')); return; }



            const reader = new FileReader();



            reader.onload = function () {



                try {



                    const payload = JSON.parse(String(reader.result || '{}'));



                    const normalized = loadStudioAppearanceIntoToolbar(payload);



                    resolve(normalized);



                } catch (error) {



                    reject(error);



                }



            };



            reader.onerror = function () { reject(reader.error || new Error('读取文件失败')); };



            reader.readAsText(file, 'UTF-8');



        });



    }



    function findDisplay(input) { if (!input) return null; if (input.type === 'color' && input.parentElement) return input.parentElement.querySelector('.value-display'); let current = input.previousElementSibling; while (current) { if (current.classList && current.classList.contains('control-label')) return current.querySelector('.value-display'); current = current.previousElementSibling; } return null; }



    function detectUnit(text) { if (!text) return ''; if (/%\s*$/.test(text)) return '%'; if (/px\s*$/.test(text)) return 'px'; return ''; }



    function formatNumber(value) { const number = Number(value); if (!Number.isFinite(number)) return '0'; if (Number.isInteger(number)) return String(number); return String(Math.round(number * 100) / 100).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1'); }



    function updateDisplay(binding) { if (!binding.display) return; if (binding.input.type === 'color') binding.display.textContent = String(binding.input.value || '').toUpperCase(); else if (binding.input.type === 'range') binding.display.textContent = formatNumber(binding.input.value) + binding.unit; }



    function readValue(input) { if (input.type === 'checkbox') return !!input.checked; if (input.type === 'range') return Number(input.value); return input.value; }



    function writeValue(binding, value) { if (binding.input.type === 'checkbox') binding.input.checked = !!value; else binding.input.value = value == null ? '' : String(value); updateDisplay(binding); }



    function ensureBubbleGapControls(root) {



        [



            { sectionId: 'sec-ordinary', suffix: 'ordinary' },



            { sectionId: 'sec-voice', suffix: 'voice' }



        ].forEach(function (entry) {



            const section = root.getElementById(entry.sectionId);



            const container = section && section.querySelector('.settings-container');



            if (!container || container.querySelector('[data-studio-bubble-gap-group="' + entry.suffix + '"]')) return;



            const group = document.createElement('div');



            group.className = 'control-group';



            group.setAttribute('data-studio-bubble-gap-group', entry.suffix);



            group.innerHTML = '<div class="control-label"><span>\u6bcf\u6761\u6c14\u6ce1\u95f4\u8ddd</span><span class="value-display" data-studio-bubble-gap-display="true">12px</span></div><input type="range" min="0" max="32" value="12" data-studio-bubble-gap-input="true">';



            container.appendChild(group);



        });



    }



    function syncBubbleGapControls(root) {



        const value = clamp(styleState.layout.bubbleGap, 0, 40);



        root.querySelectorAll('[data-studio-bubble-gap-input="true"]').forEach(function (input) { input.value = String(value); });



        root.querySelectorAll('[data-studio-bubble-gap-display="true"]').forEach(function (display) { display.textContent = formatNumber(value) + 'px'; });



    }



    function bindBubbleGapControls(root) {



        root.querySelectorAll('[data-studio-bubble-gap-input="true"]').forEach(function (input) {



            if (input.dataset.studioBubbleGapBound === 'true') return;



            input.dataset.studioBubbleGapBound = 'true';



            const handler = function () {



                styleState.layout.bubbleGap = clamp(input.value, 0, 40);



                syncBubbleGapControls(root);



                applyPreview();



            };



            input.addEventListener('input', handler);



            input.addEventListener('change', handler);



        });



        syncBubbleGapControls(root);



    }



    function resolveBubbleTimestampState(groupKey) { return groupKey === 'voice' ? styleState.voice[uiState.voiceRole] : styleState.ordinary[uiState.ordinaryRole]; }



    function ensureBubbleTimestampControls(root) {



        [



            { sectionId: 'sec-ordinary', groupKey: 'ordinary', title: '普通气泡时间戳' },



            { sectionId: 'sec-voice', groupKey: 'voice', title: '语音气泡时间戳' }



        ].forEach(function (entry) {



            const section = root.getElementById(entry.sectionId);



            const container = section && section.querySelector('.settings-container');



            if (!container || root.getElementById('studio-' + entry.groupKey + '-timestamp-mode-segments')) return;



            const group = document.createElement('div');



            group.className = 'control-group';



            group.setAttribute('data-studio-bubble-timestamp-group', entry.groupKey);



            group.innerHTML = '' +



                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-time-line"></i> ' + entry.title + '</span></div>' +



                '<div class="control-label" style="margin-top: 8px;"><span>显示位置</span></div>' +



                '<div id="studio-' + entry.groupKey + '-timestamp-mode-segments" class="segmented-control" style="margin-top: 8px;">' +



                    '<div class="segment" data-mode="outside">气泡外</div>' +



                    '<div class="segment" data-mode="inside">气泡内</div>' +



                    '<div class="segment" data-mode="avatar-below">\u5934\u50cf\u4e0b\u65b9</div>' +



                    '<div class="segment" data-mode="hidden">不显示</div>' +



                '</div>' +



                '<div class="collapsible-panel" id="studio-' + entry.groupKey + '-timestamp-detail-panel" style="border-top: none; padding-top: 8px; margin-top: 0;">' +



                    '<div class="control-label"><span>文字大小</span><span class="value-display" id="studio-' + entry.groupKey + '-timestamp-size-display">10px</span></div><input type="range" id="studio-' + entry.groupKey + '-timestamp-size" min="8" max="22" value="10" style="margin-bottom: 8px;">' +



                    '<div class="control-label"><span>横向位置</span><span class="value-display" id="studio-' + entry.groupKey + '-timestamp-offset-x-display">0px</span></div><input type="range" id="studio-' + entry.groupKey + '-timestamp-offset-x" min="-180" max="180" value="0" style="margin-bottom: 8px;">' +



                    '<div class="control-label"><span>纵向位置</span><span class="value-display" id="studio-' + entry.groupKey + '-timestamp-offset-y-display">0px</span></div><input type="range" id="studio-' + entry.groupKey + '-timestamp-offset-y" min="-120" max="120" value="0">' +



                '</div>';



            container.appendChild(group);



        });



    }



    function syncBubbleTimestampControls(root, groupKey) {



        const state = resolveBubbleTimestampState(groupKey);



        const mode = normalizeTimestampMode(state.timestampMode);



        const segments = root.getElementById('studio-' + groupKey + '-timestamp-mode-segments');



        const panel = root.getElementById('studio-' + groupKey + '-timestamp-detail-panel');



        if (segments) {



            segments.querySelectorAll('.segment').forEach(function (segment) {



                segment.classList.toggle('active', segment.getAttribute('data-mode') === mode);



            });



        }



        if (panel) panel.classList.toggle('open', mode !== 'hidden');



        [



            ['studio-' + groupKey + '-timestamp-size', 'studio-' + groupKey + '-timestamp-size-display', state.timestampFontSize],



            ['studio-' + groupKey + '-timestamp-offset-x', 'studio-' + groupKey + '-timestamp-offset-x-display', state.timestampOffsetX],



            ['studio-' + groupKey + '-timestamp-offset-y', 'studio-' + groupKey + '-timestamp-offset-y-display', state.timestampOffsetY]



        ].forEach(function (item) {



            const input = root.getElementById(item[0]);



            const display = root.getElementById(item[1]);



            if (input) input.value = String(item[2]);



            if (display) display.textContent = formatNumber(item[2]) + 'px';



        });



    }



    function bindBubbleTimestampControls(root) {



        ['ordinary', 'voice'].forEach(function (groupKey) {



            const segments = root.getElementById('studio-' + groupKey + '-timestamp-mode-segments');



            if (!segments || segments.dataset.studioTimestampBound === 'true') return;



            segments.dataset.studioTimestampBound = 'true';



            segments.querySelectorAll('.segment').forEach(function (segment) {



                segment.addEventListener('click', function () {



                    resolveBubbleTimestampState(groupKey).timestampMode = normalizeTimestampMode(segment.getAttribute('data-mode'));



                    syncBubbleTimestampControls(root, groupKey);



                    applyPreview();



                });



            });



            [



                ['studio-' + groupKey + '-timestamp-size', 'timestampFontSize'],



                ['studio-' + groupKey + '-timestamp-offset-x', 'timestampOffsetX'],



                ['studio-' + groupKey + '-timestamp-offset-y', 'timestampOffsetY']



            ].forEach(function (pair) {



                const input = root.getElementById(pair[0]);



                if (!input) return;



                const handler = function () {



                    resolveBubbleTimestampState(groupKey)[pair[1]] = Number(input.value);



                    syncBubbleTimestampControls(root, groupKey);



                    applyPreview();



                };



                input.addEventListener('input', handler);



                input.addEventListener('change', handler);



            });



            syncBubbleTimestampControls(root, groupKey);



        });



    }



    function ensureTopbarAvatarControls(root) {



        const section = root.getElementById('sec-topbar');



        const container = section && section.querySelector('.settings-container');



        if (!container || root.getElementById('studio-topbar-avatar-visible-toggle')) return;



        const group = document.createElement('div');



        group.className = 'control-group';



        group.setAttribute('data-studio-topbar-avatar-group', 'true');



        group.innerHTML = '<div class="control-label" style="margin-bottom: 0;"><span style="font-weight: 600; color: var(--text-main);"><i class="ri-user-3-line"></i> 顶栏显示对方头像</span><label class="switch"><input type="checkbox" id="studio-topbar-avatar-visible-toggle"><span class="slider"></span></label></div><div class="collapsible-panel" id="studio-topbar-avatar-position-panel" style="border-top: none; padding-top: 8px; margin-top: 0;"><div class="control-label"><span>头像位置</span></div><div id="studio-topbar-avatar-position-segments" class="segmented-control" style="margin-top: 8px;"><div class="segment" data-position="left">左</div><div class="segment" data-position="center">中</div><div class="segment" data-position="right">右</div></div></div>';



        container.appendChild(group);



    }



    function syncTopbarAvatarControls(root) {



        const toggle = root.getElementById('studio-topbar-avatar-visible-toggle');



        const panel = root.getElementById('studio-topbar-avatar-position-panel');



        const segments = root.getElementById('studio-topbar-avatar-position-segments');



        if (!toggle || !panel || !segments) return;



        const visible = !!styleState.topbar.avatarVisible;



        const position = normalizeTopbarAvatarPosition(styleState.topbar.avatarPosition);



        toggle.checked = visible;



        panel.classList.toggle('open', visible);



        segments.querySelectorAll('.segment').forEach(function (segment) {



            segment.classList.toggle('active', segment.getAttribute('data-position') === position);



        });



    }



    function bindTopbarAvatarControls(root) {



        const toggle = root.getElementById('studio-topbar-avatar-visible-toggle');



        const segments = root.getElementById('studio-topbar-avatar-position-segments');



        if (!toggle || !segments || toggle.dataset.studioTopbarAvatarBound === 'true') return;



        toggle.dataset.studioTopbarAvatarBound = 'true';



        toggle.addEventListener('change', function () {



            styleState.topbar.avatarVisible = !!toggle.checked;



            syncTopbarAvatarControls(root);



            applyPreview();



        });



        segments.querySelectorAll('.segment').forEach(function (segment) {



            segment.addEventListener('click', function () {



                styleState.topbar.avatarPosition = normalizeTopbarAvatarPosition(segment.getAttribute('data-position'));



                syncTopbarAvatarControls(root);



                applyPreview();



            });



        });



        syncTopbarAvatarControls(root);



    }



    function ensureTopbarAdvancedControls(root) {

        const section = root.getElementById('sec-topbar');
        const container = section && section.querySelector('.settings-container');
        if (!container || root.getElementById('studio-topbar-status-visible-toggle')) return;

        const labels = {
            status: '\u72b6\u6001\u6587\u5b57',
            statusContent: '\u72b6\u6001\u6587\u5b57\u5185\u5bb9',
            statusPlaceholder: '\u8f93\u5165\u72b6\u6001\u6587\u5b57...',
            titleStatus: '\u540d\u5b57\u4e0e\u72b6\u6001',
            titleSize: '\u540d\u5b57\u5927\u5c0f',
            titleOffsetX: '\u540d\u5b57\u6a2a\u5411\u4f4d\u7f6e',
            titleOffsetY: '\u540d\u5b57\u7eb5\u5411\u4f4d\u7f6e',
            statusSize: '\u72b6\u6001\u5927\u5c0f',
            statusOffsetX: '\u72b6\u6001\u6a2a\u5411\u4f4d\u7f6e',
            statusOffsetY: '\u72b6\u6001\u7eb5\u5411\u4f4d\u7f6e',
            backButton: '\u8fd4\u56de\u6309\u94ae',
            avatarButton: '\u5934\u50cf\u6309\u94ae',
            settingsButton: '\u8bbe\u7f6e\u6309\u94ae',
            buttonSize: '\u6309\u94ae\u5927\u5c0f',
            offsetX: '\u6a2a\u5411\u4f4d\u7f6e',
            offsetY: '\u7eb5\u5411\u4f4d\u7f6e',
            bgColor: '\u6309\u94ae\u80cc\u666f\u989c\u8272',
            bgOpacity: '\u80cc\u666f\u900f\u660e\u5ea6',
            radius: '\u5706\u89d2',
            shadowColor: '\u9634\u5f71\u989c\u8272',
            shadowOpacity: '\u9634\u5f71\u900f\u660e\u5ea6',
            shadowBlur: '\u6a21\u7cca\u534a\u5f84',
            shadowSpread: '\u6269\u6563'
        };

        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-studio-topbar-advanced', 'true');
        wrapper.innerHTML = '' +
            '<div class="control-group">' +
                '<div class="control-label" style="margin-bottom: 0;"><span style="font-weight: 600; color: var(--text-main);"><i class="ri-chat-smile-3-line"></i> ' + labels.status + '</span><label class="switch"><input type="checkbox" id="studio-topbar-status-visible-toggle"><span class="slider"></span></label></div>' +
                '<div class="collapsible-panel" id="studio-topbar-status-text-panel" style="border-top: none; padding-top: 8px; margin-top: 0;">' +
                    '<div class="control-label"><span>' + labels.statusContent + '</span></div>' +
                    '<div class="url-input-wrapper"><i class="ri-edit-2-line"></i><input type="text" id="studio-topbar-status-text-input" placeholder="' + labels.statusPlaceholder + '"></div>' +
                '</div>' +
            '</div>' +
            '<div class="control-group">' +
                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-font-size-2"></i> ' + labels.titleStatus + '</span></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.titleSize + '</span><span class="value-display" id="studio-topbar-title-size-display">17px</span></div><input type="range" id="studio-topbar-title-size" min="10" max="30" value="17" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.titleOffsetX + '</span><span class="value-display" id="studio-topbar-title-offset-x-display">0px</span></div><input type="range" id="studio-topbar-title-offset-x" min="-180" max="180" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.titleOffsetY + '</span><span class="value-display" id="studio-topbar-title-offset-y-display">0px</span></div><input type="range" id="studio-topbar-title-offset-y" min="-80" max="80" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.statusSize + '</span><span class="value-display" id="studio-topbar-status-size-display">11px</span></div><input type="range" id="studio-topbar-status-size" min="8" max="24" value="11" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.statusOffsetX + '</span><span class="value-display" id="studio-topbar-status-offset-x-display">0px</span></div><input type="range" id="studio-topbar-status-offset-x" min="-180" max="180" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.statusOffsetY + '</span><span class="value-display" id="studio-topbar-status-offset-y-display">0px</span></div><input type="range" id="studio-topbar-status-offset-y" min="-80" max="80" value="0">' +
            '</div>' +
            '<div class="control-group">' +
                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-arrow-left-line"></i> ' + labels.backButton + '</span></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.buttonSize + '</span><span class="value-display" id="studio-topbar-back-size-display">28px</span></div><input type="range" id="studio-topbar-back-size" min="18" max="72" value="28" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetX + '</span><span class="value-display" id="studio-topbar-back-offset-x-display">0px</span></div><input type="range" id="studio-topbar-back-offset-x" min="-180" max="180" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetY + '</span><span class="value-display" id="studio-topbar-back-offset-y-display">0px</span></div><input type="range" id="studio-topbar-back-offset-y" min="-80" max="80" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.bgColor + '</span><div class="color-val-wrap"><input type="color" id="studio-topbar-back-bg-color" value="#ffffff"><span class="value-display" id="studio-topbar-back-bg-color-display">#FFFFFF</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.bgOpacity + '</span><span class="value-display" id="studio-topbar-back-bg-opacity-display">0%</span></div><input type="range" id="studio-topbar-back-bg-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.radius + '</span><span class="value-display" id="studio-topbar-back-radius-display">999px</span></div><input type="range" id="studio-topbar-back-radius" min="0" max="999" value="999" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowColor + '</span><div class="color-val-wrap"><input type="color" id="studio-topbar-back-shadow-color" value="#000000"><span class="value-display" id="studio-topbar-back-shadow-color-display">#000000</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.shadowOpacity + '</span><span class="value-display" id="studio-topbar-back-shadow-opacity-display">0%</span></div><input type="range" id="studio-topbar-back-shadow-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowBlur + '</span><span class="value-display" id="studio-topbar-back-shadow-blur-display">0px</span></div><input type="range" id="studio-topbar-back-shadow-blur" min="0" max="40" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowSpread + '</span><span class="value-display" id="studio-topbar-back-shadow-spread-display">0px</span></div><input type="range" id="studio-topbar-back-shadow-spread" min="-16" max="24" value="0">' +
            '</div>' +
            '<div class="control-group">' +
                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-user-3-line"></i> ' + labels.avatarButton + '</span></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.buttonSize + '</span><span class="value-display" id="studio-topbar-avatar-size-display">34px</span></div><input type="range" id="studio-topbar-avatar-size" min="20" max="88" value="34" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetX + '</span><span class="value-display" id="studio-topbar-avatar-offset-x-display">0px</span></div><input type="range" id="studio-topbar-avatar-offset-x" min="-180" max="180" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetY + '</span><span class="value-display" id="studio-topbar-avatar-offset-y-display">0px</span></div><input type="range" id="studio-topbar-avatar-offset-y" min="-80" max="80" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.bgColor + '</span><div class="color-val-wrap"><input type="color" id="studio-topbar-avatar-bg-color" value="#1c1c1e"><span class="value-display" id="studio-topbar-avatar-bg-color-display">#1C1C1E</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.bgOpacity + '</span><span class="value-display" id="studio-topbar-avatar-bg-opacity-display">8%</span></div><input type="range" id="studio-topbar-avatar-bg-opacity" min="0" max="100" value="8" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.radius + '</span><span class="value-display" id="studio-topbar-avatar-radius-display">999px</span></div><input type="range" id="studio-topbar-avatar-radius" min="0" max="999" value="999" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowColor + '</span><div class="color-val-wrap"><input type="color" id="studio-topbar-avatar-shadow-color" value="#000000"><span class="value-display" id="studio-topbar-avatar-shadow-color-display">#000000</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.shadowOpacity + '</span><span class="value-display" id="studio-topbar-avatar-shadow-opacity-display">0%</span></div><input type="range" id="studio-topbar-avatar-shadow-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowBlur + '</span><span class="value-display" id="studio-topbar-avatar-shadow-blur-display">0px</span></div><input type="range" id="studio-topbar-avatar-shadow-blur" min="0" max="40" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowSpread + '</span><span class="value-display" id="studio-topbar-avatar-shadow-spread-display">0px</span></div><input type="range" id="studio-topbar-avatar-shadow-spread" min="-16" max="24" value="0">' +
            '</div>' +
            '<div class="control-group">' +
                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-settings-3-line"></i> ' + labels.settingsButton + '</span></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.buttonSize + '</span><span class="value-display" id="studio-topbar-settings-size-display">28px</span></div><input type="range" id="studio-topbar-settings-size" min="18" max="72" value="28" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetX + '</span><span class="value-display" id="studio-topbar-settings-offset-x-display">0px</span></div><input type="range" id="studio-topbar-settings-offset-x" min="-180" max="180" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetY + '</span><span class="value-display" id="studio-topbar-settings-offset-y-display">0px</span></div><input type="range" id="studio-topbar-settings-offset-y" min="-80" max="80" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.bgColor + '</span><div class="color-val-wrap"><input type="color" id="studio-topbar-settings-bg-color" value="#ffffff"><span class="value-display" id="studio-topbar-settings-bg-color-display">#FFFFFF</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.bgOpacity + '</span><span class="value-display" id="studio-topbar-settings-bg-opacity-display">0%</span></div><input type="range" id="studio-topbar-settings-bg-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.radius + '</span><span class="value-display" id="studio-topbar-settings-radius-display">999px</span></div><input type="range" id="studio-topbar-settings-radius" min="0" max="999" value="999" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowColor + '</span><div class="color-val-wrap"><input type="color" id="studio-topbar-settings-shadow-color" value="#000000"><span class="value-display" id="studio-topbar-settings-shadow-color-display">#000000</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.shadowOpacity + '</span><span class="value-display" id="studio-topbar-settings-shadow-opacity-display">0%</span></div><input type="range" id="studio-topbar-settings-shadow-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowBlur + '</span><span class="value-display" id="studio-topbar-settings-shadow-blur-display">0px</span></div><input type="range" id="studio-topbar-settings-shadow-blur" min="0" max="40" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowSpread + '</span><span class="value-display" id="studio-topbar-settings-shadow-spread-display">0px</span></div><input type="range" id="studio-topbar-settings-shadow-spread" min="-16" max="24" value="0">' +
            '</div>';
        container.appendChild(wrapper);

    }



    function syncTopbarAdvancedControls(root) {

        const visibleToggle = root.getElementById('studio-topbar-status-visible-toggle');
        const textPanel = root.getElementById('studio-topbar-status-text-panel');
        const textInput = root.getElementById('studio-topbar-status-text-input');
        if (visibleToggle) visibleToggle.checked = !!styleState.topbar.statusVisible;
        if (textPanel) textPanel.classList.toggle('open', !!styleState.topbar.statusVisible);
        if (textInput) textInput.value = styleState.topbar.statusText || '';

        [
            ['studio-topbar-title-size', 'studio-topbar-title-size-display', styleState.topbar.titleFontSize],
            ['studio-topbar-title-offset-x', 'studio-topbar-title-offset-x-display', styleState.topbar.titleOffsetX],
            ['studio-topbar-title-offset-y', 'studio-topbar-title-offset-y-display', styleState.topbar.titleOffsetY],
            ['studio-topbar-status-size', 'studio-topbar-status-size-display', styleState.topbar.statusFontSize],
            ['studio-topbar-status-offset-x', 'studio-topbar-status-offset-x-display', styleState.topbar.statusOffsetX],
            ['studio-topbar-status-offset-y', 'studio-topbar-status-offset-y-display', styleState.topbar.statusOffsetY],
            ['studio-topbar-back-size', 'studio-topbar-back-size-display', styleState.topbar.backButtonSize],
            ['studio-topbar-back-offset-x', 'studio-topbar-back-offset-x-display', styleState.topbar.backButtonOffsetX],
            ['studio-topbar-back-offset-y', 'studio-topbar-back-offset-y-display', styleState.topbar.backButtonOffsetY],
            ['studio-topbar-back-bg-opacity', 'studio-topbar-back-bg-opacity-display', styleState.topbar.backButtonBgOpacity],
            ['studio-topbar-back-radius', 'studio-topbar-back-radius-display', styleState.topbar.backButtonRadius],
            ['studio-topbar-back-shadow-opacity', 'studio-topbar-back-shadow-opacity-display', styleState.topbar.backButtonShadowOpacity],
            ['studio-topbar-back-shadow-blur', 'studio-topbar-back-shadow-blur-display', styleState.topbar.backButtonShadowBlur],
            ['studio-topbar-back-shadow-spread', 'studio-topbar-back-shadow-spread-display', styleState.topbar.backButtonShadowSpread],
            ['studio-topbar-avatar-size', 'studio-topbar-avatar-size-display', styleState.topbar.avatarButtonSize],
            ['studio-topbar-avatar-offset-x', 'studio-topbar-avatar-offset-x-display', styleState.topbar.avatarButtonOffsetX],
            ['studio-topbar-avatar-offset-y', 'studio-topbar-avatar-offset-y-display', styleState.topbar.avatarButtonOffsetY],
            ['studio-topbar-avatar-bg-opacity', 'studio-topbar-avatar-bg-opacity-display', styleState.topbar.avatarButtonBgOpacity],
            ['studio-topbar-avatar-radius', 'studio-topbar-avatar-radius-display', styleState.topbar.avatarButtonRadius],
            ['studio-topbar-avatar-shadow-opacity', 'studio-topbar-avatar-shadow-opacity-display', styleState.topbar.avatarButtonShadowOpacity],
            ['studio-topbar-avatar-shadow-blur', 'studio-topbar-avatar-shadow-blur-display', styleState.topbar.avatarButtonShadowBlur],
            ['studio-topbar-avatar-shadow-spread', 'studio-topbar-avatar-shadow-spread-display', styleState.topbar.avatarButtonShadowSpread],
            ['studio-topbar-settings-size', 'studio-topbar-settings-size-display', styleState.topbar.settingsButtonSize],
            ['studio-topbar-settings-offset-x', 'studio-topbar-settings-offset-x-display', styleState.topbar.settingsButtonOffsetX],
            ['studio-topbar-settings-offset-y', 'studio-topbar-settings-offset-y-display', styleState.topbar.settingsButtonOffsetY],
            ['studio-topbar-settings-bg-opacity', 'studio-topbar-settings-bg-opacity-display', styleState.topbar.settingsButtonBgOpacity],
            ['studio-topbar-settings-radius', 'studio-topbar-settings-radius-display', styleState.topbar.settingsButtonRadius],
            ['studio-topbar-settings-shadow-opacity', 'studio-topbar-settings-shadow-opacity-display', styleState.topbar.settingsButtonShadowOpacity],
            ['studio-topbar-settings-shadow-blur', 'studio-topbar-settings-shadow-blur-display', styleState.topbar.settingsButtonShadowBlur],
            ['studio-topbar-settings-shadow-spread', 'studio-topbar-settings-shadow-spread-display', styleState.topbar.settingsButtonShadowSpread]
        ].forEach(function (item) {
            const input = root.getElementById(item[0]);
            const display = root.getElementById(item[1]);
            if (input) input.value = String(item[2]);
            if (display) display.textContent = formatNumber(item[2]) + (item[1].indexOf('opacity') > -1 ? '%' : 'px');
        });

        [
            ['studio-topbar-back-bg-color', 'studio-topbar-back-bg-color-display', styleState.topbar.backButtonBgColor],
            ['studio-topbar-back-shadow-color', 'studio-topbar-back-shadow-color-display', styleState.topbar.backButtonShadowColor],
            ['studio-topbar-avatar-bg-color', 'studio-topbar-avatar-bg-color-display', styleState.topbar.avatarButtonBgColor],
            ['studio-topbar-avatar-shadow-color', 'studio-topbar-avatar-shadow-color-display', styleState.topbar.avatarButtonShadowColor],
            ['studio-topbar-settings-bg-color', 'studio-topbar-settings-bg-color-display', styleState.topbar.settingsButtonBgColor],
            ['studio-topbar-settings-shadow-color', 'studio-topbar-settings-shadow-color-display', styleState.topbar.settingsButtonShadowColor]
        ].forEach(function (item) {
            const input = root.getElementById(item[0]);
            const display = root.getElementById(item[1]);
            if (input) input.value = String(item[2] || '');
            if (display) display.textContent = String(item[2] || '').toUpperCase();
        });

    }



    function bindTopbarAdvancedControls(root) {

        const statusToggle = root.getElementById('studio-topbar-status-visible-toggle');
        const statusInput = root.getElementById('studio-topbar-status-text-input');
        if (!statusToggle || statusToggle.dataset.studioTopbarAdvancedBound === 'true') return;

        statusToggle.dataset.studioTopbarAdvancedBound = 'true';
        statusToggle.addEventListener('change', function () {
            styleState.topbar.statusVisible = !!statusToggle.checked;
            syncTopbarAdvancedControls(root);
            applyPreview();
        });

        if (statusInput) {
            const statusHandler = function () {
                styleState.topbar.statusText = statusInput.value;
                applyPreview();
            };
            statusInput.addEventListener('input', statusHandler);
            statusInput.addEventListener('change', statusHandler);
        }

        [
            ['studio-topbar-title-size', 'titleFontSize'],
            ['studio-topbar-title-offset-x', 'titleOffsetX'],
            ['studio-topbar-title-offset-y', 'titleOffsetY'],
            ['studio-topbar-status-size', 'statusFontSize'],
            ['studio-topbar-status-offset-x', 'statusOffsetX'],
            ['studio-topbar-status-offset-y', 'statusOffsetY'],
            ['studio-topbar-back-size', 'backButtonSize'],
            ['studio-topbar-back-offset-x', 'backButtonOffsetX'],
            ['studio-topbar-back-offset-y', 'backButtonOffsetY'],
            ['studio-topbar-back-bg-opacity', 'backButtonBgOpacity'],
            ['studio-topbar-back-radius', 'backButtonRadius'],
            ['studio-topbar-back-shadow-opacity', 'backButtonShadowOpacity'],
            ['studio-topbar-back-shadow-blur', 'backButtonShadowBlur'],
            ['studio-topbar-back-shadow-spread', 'backButtonShadowSpread'],
            ['studio-topbar-avatar-size', 'avatarButtonSize'],
            ['studio-topbar-avatar-offset-x', 'avatarButtonOffsetX'],
            ['studio-topbar-avatar-offset-y', 'avatarButtonOffsetY'],
            ['studio-topbar-avatar-bg-opacity', 'avatarButtonBgOpacity'],
            ['studio-topbar-avatar-radius', 'avatarButtonRadius'],
            ['studio-topbar-avatar-shadow-opacity', 'avatarButtonShadowOpacity'],
            ['studio-topbar-avatar-shadow-blur', 'avatarButtonShadowBlur'],
            ['studio-topbar-avatar-shadow-spread', 'avatarButtonShadowSpread'],
            ['studio-topbar-settings-size', 'settingsButtonSize'],
            ['studio-topbar-settings-offset-x', 'settingsButtonOffsetX'],
            ['studio-topbar-settings-offset-y', 'settingsButtonOffsetY'],
            ['studio-topbar-settings-bg-opacity', 'settingsButtonBgOpacity'],
            ['studio-topbar-settings-radius', 'settingsButtonRadius'],
            ['studio-topbar-settings-shadow-opacity', 'settingsButtonShadowOpacity'],
            ['studio-topbar-settings-shadow-blur', 'settingsButtonShadowBlur'],
            ['studio-topbar-settings-shadow-spread', 'settingsButtonShadowSpread']
        ].forEach(function (pair) {
            const input = root.getElementById(pair[0]);
            if (!input) return;
            const handler = function () {
                styleState.topbar[pair[1]] = Number(input.value);
                syncTopbarAdvancedControls(root);
                applyPreview();
            };
            input.addEventListener('input', handler);
            input.addEventListener('change', handler);
        });

        [
            ['studio-topbar-back-bg-color', 'backButtonBgColor'],
            ['studio-topbar-back-shadow-color', 'backButtonShadowColor'],
            ['studio-topbar-avatar-bg-color', 'avatarButtonBgColor'],
            ['studio-topbar-avatar-shadow-color', 'avatarButtonShadowColor'],
            ['studio-topbar-settings-bg-color', 'settingsButtonBgColor'],
            ['studio-topbar-settings-shadow-color', 'settingsButtonShadowColor']
        ].forEach(function (pair) {
            const input = root.getElementById(pair[0]);
            if (!input) return;
            const handler = function () {
                styleState.topbar[pair[1]] = String(input.value || '').trim() || '#000000';
                syncTopbarAdvancedControls(root);
                applyPreview();
            };
            input.addEventListener('input', handler);
            input.addEventListener('change', handler);
        });

        syncTopbarAdvancedControls(root);

    }



    function ensureBottomAdvancedControls(root) {

        const section = root.getElementById('sec-bottombar');
        const container = section && section.querySelector('.settings-container');
        if (!container || root.getElementById('studio-bottombar-height')) return;

        const labels = {
            barHeight: '\u5e95\u680f\u9ad8\u5ea6',
            inputLayout: '\u8f93\u5165\u6846\u5e03\u5c40',
            inputWidth: '\u8f93\u5165\u6846\u5bbd\u5ea6',
            auto: '\u81ea\u9002\u5e94',
            menuButton: '\u52a0\u53f7\u6309\u94ae',
            stickerButton: '\u8d34\u7eb8\u6309\u94ae',
            replyButton: '\u8bed\u97f3\u6309\u94ae',
            buttonSize: '\u6309\u94ae\u5927\u5c0f',
            offsetX: '\u6a2a\u5411\u4f4d\u7f6e',
            offsetY: '\u7eb5\u5411\u4f4d\u7f6e',
            bgColor: '\u6309\u94ae\u80cc\u666f\u989c\u8272',
            bgOpacity: '\u80cc\u666f\u900f\u660e\u5ea6',
            radius: '\u5706\u89d2',
            shadowColor: '\u9634\u5f71\u989c\u8272',
            shadowOpacity: '\u9634\u5f71\u900f\u660e\u5ea6',
            shadowBlur: '\u6a21\u7cca\u534a\u5f84',
            shadowSpread: '\u6269\u6563'
        };

        const wrapper = document.createElement('div');
        wrapper.setAttribute('data-studio-bottom-advanced', 'true');
        wrapper.innerHTML = '' +
            '<div class="control-group">' +
                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-layout-bottom-line"></i> ' + labels.barHeight + '</span></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.barHeight + '</span><span class="value-display" id="studio-bottombar-height-display">83px</span></div><input type="range" id="studio-bottombar-height" min="60" max="160" value="83">' +
            '</div>' +
            '<div class="control-group">' +
                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-input-field"></i> ' + labels.inputLayout + '</span></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.inputWidth + '</span><span class="value-display" id="studio-bottombar-input-width-display">' + labels.auto + '</span></div><input type="range" id="studio-bottombar-input-width" min="0" max="480" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetX + '</span><span class="value-display" id="studio-bottombar-input-offset-x-display">0px</span></div><input type="range" id="studio-bottombar-input-offset-x" min="-180" max="180" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetY + '</span><span class="value-display" id="studio-bottombar-input-offset-y-display">0px</span></div><input type="range" id="studio-bottombar-input-offset-y" min="-120" max="120" value="0">' +
            '</div>' +
            '<div class="control-group">' +
                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-add-circle-line"></i> ' + labels.menuButton + '</span><label class="switch"><input type="checkbox" id="studio-bottombar-menu-visible-toggle" checked><span class="slider"></span></label></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.buttonSize + '</span><span class="value-display" id="studio-bottombar-menu-size-display">34px</span></div><input type="range" id="studio-bottombar-menu-size" min="20" max="88" value="34" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetX + '</span><span class="value-display" id="studio-bottombar-menu-offset-x-display">0px</span></div><input type="range" id="studio-bottombar-menu-offset-x" min="-180" max="180" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetY + '</span><span class="value-display" id="studio-bottombar-menu-offset-y-display">0px</span></div><input type="range" id="studio-bottombar-menu-offset-y" min="-120" max="120" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.bgColor + '</span><div class="color-val-wrap"><input type="color" id="studio-bottombar-menu-bg-color" value="#8f8f96"><span class="value-display" id="studio-bottombar-menu-bg-color-display">#8F8F96</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.bgOpacity + '</span><span class="value-display" id="studio-bottombar-menu-bg-opacity-display">10%</span></div><input type="range" id="studio-bottombar-menu-bg-opacity" min="0" max="100" value="10" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.radius + '</span><span class="value-display" id="studio-bottombar-menu-radius-display">999px</span></div><input type="range" id="studio-bottombar-menu-radius" min="0" max="999" value="999" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowColor + '</span><div class="color-val-wrap"><input type="color" id="studio-bottombar-menu-shadow-color" value="#000000"><span class="value-display" id="studio-bottombar-menu-shadow-color-display">#000000</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.shadowOpacity + '</span><span class="value-display" id="studio-bottombar-menu-shadow-opacity-display">0%</span></div><input type="range" id="studio-bottombar-menu-shadow-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowBlur + '</span><span class="value-display" id="studio-bottombar-menu-shadow-blur-display">0px</span></div><input type="range" id="studio-bottombar-menu-shadow-blur" min="0" max="40" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowSpread + '</span><span class="value-display" id="studio-bottombar-menu-shadow-spread-display">0px</span></div><input type="range" id="studio-bottombar-menu-shadow-spread" min="-16" max="24" value="0">' +
            '</div>' +
            '<div class="control-group">' +
                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-sticker-line"></i> ' + labels.stickerButton + '</span><label class="switch"><input type="checkbox" id="studio-bottombar-sticker-visible-toggle" checked><span class="slider"></span></label></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.buttonSize + '</span><span class="value-display" id="studio-bottombar-sticker-size-display">28px</span></div><input type="range" id="studio-bottombar-sticker-size" min="20" max="88" value="28" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetX + '</span><span class="value-display" id="studio-bottombar-sticker-offset-x-display">0px</span></div><input type="range" id="studio-bottombar-sticker-offset-x" min="-180" max="180" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetY + '</span><span class="value-display" id="studio-bottombar-sticker-offset-y-display">0px</span></div><input type="range" id="studio-bottombar-sticker-offset-y" min="-120" max="120" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.bgColor + '</span><div class="color-val-wrap"><input type="color" id="studio-bottombar-sticker-bg-color" value="#8f8f96"><span class="value-display" id="studio-bottombar-sticker-bg-color-display">#8F8F96</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.bgOpacity + '</span><span class="value-display" id="studio-bottombar-sticker-bg-opacity-display">0%</span></div><input type="range" id="studio-bottombar-sticker-bg-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.radius + '</span><span class="value-display" id="studio-bottombar-sticker-radius-display">999px</span></div><input type="range" id="studio-bottombar-sticker-radius" min="0" max="999" value="999" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowColor + '</span><div class="color-val-wrap"><input type="color" id="studio-bottombar-sticker-shadow-color" value="#000000"><span class="value-display" id="studio-bottombar-sticker-shadow-color-display">#000000</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.shadowOpacity + '</span><span class="value-display" id="studio-bottombar-sticker-shadow-opacity-display">0%</span></div><input type="range" id="studio-bottombar-sticker-shadow-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowBlur + '</span><span class="value-display" id="studio-bottombar-sticker-shadow-blur-display">0px</span></div><input type="range" id="studio-bottombar-sticker-shadow-blur" min="0" max="40" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowSpread + '</span><span class="value-display" id="studio-bottombar-sticker-shadow-spread-display">0px</span></div><input type="range" id="studio-bottombar-sticker-shadow-spread" min="-16" max="24" value="0">' +
            '</div>' +
            '<div class="control-group">' +
                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-mic-line"></i> ' + labels.replyButton + '</span><label class="switch"><input type="checkbox" id="studio-bottombar-reply-visible-toggle" checked><span class="slider"></span></label></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.buttonSize + '</span><span class="value-display" id="studio-bottombar-reply-size-display">28px</span></div><input type="range" id="studio-bottombar-reply-size" min="20" max="88" value="28" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetX + '</span><span class="value-display" id="studio-bottombar-reply-offset-x-display">0px</span></div><input type="range" id="studio-bottombar-reply-offset-x" min="-180" max="180" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.offsetY + '</span><span class="value-display" id="studio-bottombar-reply-offset-y-display">0px</span></div><input type="range" id="studio-bottombar-reply-offset-y" min="-120" max="120" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.bgColor + '</span><div class="color-val-wrap"><input type="color" id="studio-bottombar-reply-bg-color" value="#8f8f96"><span class="value-display" id="studio-bottombar-reply-bg-color-display">#8F8F96</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.bgOpacity + '</span><span class="value-display" id="studio-bottombar-reply-bg-opacity-display">0%</span></div><input type="range" id="studio-bottombar-reply-bg-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.radius + '</span><span class="value-display" id="studio-bottombar-reply-radius-display">999px</span></div><input type="range" id="studio-bottombar-reply-radius" min="0" max="999" value="999" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowColor + '</span><div class="color-val-wrap"><input type="color" id="studio-bottombar-reply-shadow-color" value="#000000"><span class="value-display" id="studio-bottombar-reply-shadow-color-display">#000000</span></div></div>' +
                '<div class="control-label" style="margin-top: 8px;"><span>' + labels.shadowOpacity + '</span><span class="value-display" id="studio-bottombar-reply-shadow-opacity-display">0%</span></div><input type="range" id="studio-bottombar-reply-shadow-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowBlur + '</span><span class="value-display" id="studio-bottombar-reply-shadow-blur-display">0px</span></div><input type="range" id="studio-bottombar-reply-shadow-blur" min="0" max="40" value="0" style="margin-bottom: 8px;">' +
                '<div class="control-label"><span>' + labels.shadowSpread + '</span><span class="value-display" id="studio-bottombar-reply-shadow-spread-display">0px</span></div><input type="range" id="studio-bottombar-reply-shadow-spread" min="-16" max="24" value="0">' +
            '</div>';
        container.appendChild(wrapper);

    }



    function syncBottomAdvancedControls(root) {

        [
            ['studio-bottombar-height', 'studio-bottombar-height-display', styleState.bottombar.height],
            ['studio-bottombar-menu-size', 'studio-bottombar-menu-size-display', styleState.bottombar.menuButtonSize],
            ['studio-bottombar-menu-offset-x', 'studio-bottombar-menu-offset-x-display', styleState.bottombar.menuButtonOffsetX],
            ['studio-bottombar-menu-offset-y', 'studio-bottombar-menu-offset-y-display', styleState.bottombar.menuButtonOffsetY],
            ['studio-bottombar-menu-bg-opacity', 'studio-bottombar-menu-bg-opacity-display', styleState.bottombar.menuButtonBgOpacity],
            ['studio-bottombar-menu-radius', 'studio-bottombar-menu-radius-display', styleState.bottombar.menuButtonRadius],
            ['studio-bottombar-menu-shadow-opacity', 'studio-bottombar-menu-shadow-opacity-display', styleState.bottombar.menuButtonShadowOpacity],
            ['studio-bottombar-menu-shadow-blur', 'studio-bottombar-menu-shadow-blur-display', styleState.bottombar.menuButtonShadowBlur],
            ['studio-bottombar-menu-shadow-spread', 'studio-bottombar-menu-shadow-spread-display', styleState.bottombar.menuButtonShadowSpread],
            ['studio-bottombar-sticker-size', 'studio-bottombar-sticker-size-display', styleState.bottombar.stickerButtonSize],
            ['studio-bottombar-sticker-offset-x', 'studio-bottombar-sticker-offset-x-display', styleState.bottombar.stickerButtonOffsetX],
            ['studio-bottombar-sticker-offset-y', 'studio-bottombar-sticker-offset-y-display', styleState.bottombar.stickerButtonOffsetY],
            ['studio-bottombar-sticker-bg-opacity', 'studio-bottombar-sticker-bg-opacity-display', styleState.bottombar.stickerButtonBgOpacity],
            ['studio-bottombar-sticker-radius', 'studio-bottombar-sticker-radius-display', styleState.bottombar.stickerButtonRadius],
            ['studio-bottombar-sticker-shadow-opacity', 'studio-bottombar-sticker-shadow-opacity-display', styleState.bottombar.stickerButtonShadowOpacity],
            ['studio-bottombar-sticker-shadow-blur', 'studio-bottombar-sticker-shadow-blur-display', styleState.bottombar.stickerButtonShadowBlur],
            ['studio-bottombar-sticker-shadow-spread', 'studio-bottombar-sticker-shadow-spread-display', styleState.bottombar.stickerButtonShadowSpread],
            ['studio-bottombar-reply-size', 'studio-bottombar-reply-size-display', styleState.bottombar.replyButtonSize],
            ['studio-bottombar-reply-offset-x', 'studio-bottombar-reply-offset-x-display', styleState.bottombar.replyButtonOffsetX],
            ['studio-bottombar-reply-offset-y', 'studio-bottombar-reply-offset-y-display', styleState.bottombar.replyButtonOffsetY],
            ['studio-bottombar-reply-bg-opacity', 'studio-bottombar-reply-bg-opacity-display', styleState.bottombar.replyButtonBgOpacity],
            ['studio-bottombar-reply-radius', 'studio-bottombar-reply-radius-display', styleState.bottombar.replyButtonRadius],
            ['studio-bottombar-reply-shadow-opacity', 'studio-bottombar-reply-shadow-opacity-display', styleState.bottombar.replyButtonShadowOpacity],
            ['studio-bottombar-reply-shadow-blur', 'studio-bottombar-reply-shadow-blur-display', styleState.bottombar.replyButtonShadowBlur],
            ['studio-bottombar-reply-shadow-spread', 'studio-bottombar-reply-shadow-spread-display', styleState.bottombar.replyButtonShadowSpread],
            ['studio-bottombar-input-offset-x', 'studio-bottombar-input-offset-x-display', styleState.bottombar.inputOffsetX],
            ['studio-bottombar-input-offset-y', 'studio-bottombar-input-offset-y-display', styleState.bottombar.inputOffsetY]
        ].forEach(function (item) {
            const input = root.getElementById(item[0]);
            const display = root.getElementById(item[1]);
            if (input) input.value = String(item[2]);
            if (display) display.textContent = formatNumber(item[2]) + (item[1].indexOf('opacity') > -1 ? '%' : 'px');
        });

        const inputWidth = root.getElementById('studio-bottombar-input-width');
        const inputWidthDisplay = root.getElementById('studio-bottombar-input-width-display');
        if (inputWidth) inputWidth.value = String(styleState.bottombar.inputWidth);
        if (inputWidthDisplay) inputWidthDisplay.textContent = Number(styleState.bottombar.inputWidth) <= 0 ? '\u81ea\u9002\u5e94' : formatNumber(styleState.bottombar.inputWidth) + 'px';

        [
            ['studio-bottombar-menu-bg-color', 'studio-bottombar-menu-bg-color-display', styleState.bottombar.menuButtonBgColor],
            ['studio-bottombar-menu-shadow-color', 'studio-bottombar-menu-shadow-color-display', styleState.bottombar.menuButtonShadowColor],
            ['studio-bottombar-sticker-bg-color', 'studio-bottombar-sticker-bg-color-display', styleState.bottombar.stickerButtonBgColor],
            ['studio-bottombar-sticker-shadow-color', 'studio-bottombar-sticker-shadow-color-display', styleState.bottombar.stickerButtonShadowColor],
            ['studio-bottombar-reply-bg-color', 'studio-bottombar-reply-bg-color-display', styleState.bottombar.replyButtonBgColor],
            ['studio-bottombar-reply-shadow-color', 'studio-bottombar-reply-shadow-color-display', styleState.bottombar.replyButtonShadowColor]
        ].forEach(function (item) {
            const input = root.getElementById(item[0]);
            const display = root.getElementById(item[1]);
            if (input) input.value = String(item[2] || '');
            if (display) display.textContent = String(item[2] || '').toUpperCase();
        });

        [
            ['studio-bottombar-menu-visible-toggle', styleState.bottombar.menuButtonVisible !== false],
            ['studio-bottombar-sticker-visible-toggle', styleState.bottombar.stickerButtonVisible !== false],
            ['studio-bottombar-reply-visible-toggle', styleState.bottombar.replyButtonVisible !== false]
        ].forEach(function (item) {
            const input = root.getElementById(item[0]);
            if (input) input.checked = !!item[1];
        });

    }



    function bindBottomAdvancedControls(root) {

        const anchor = root.getElementById('studio-bottombar-height');
        if (!anchor || anchor.dataset.studioBottomAdvancedBound === 'true') return;
        anchor.dataset.studioBottomAdvancedBound = 'true';

        [
            ['studio-bottombar-height', 'height'],
            ['studio-bottombar-menu-size', 'menuButtonSize'],
            ['studio-bottombar-menu-offset-x', 'menuButtonOffsetX'],
            ['studio-bottombar-menu-offset-y', 'menuButtonOffsetY'],
            ['studio-bottombar-menu-bg-opacity', 'menuButtonBgOpacity'],
            ['studio-bottombar-menu-radius', 'menuButtonRadius'],
            ['studio-bottombar-menu-shadow-opacity', 'menuButtonShadowOpacity'],
            ['studio-bottombar-menu-shadow-blur', 'menuButtonShadowBlur'],
            ['studio-bottombar-menu-shadow-spread', 'menuButtonShadowSpread'],
            ['studio-bottombar-sticker-size', 'stickerButtonSize'],
            ['studio-bottombar-sticker-offset-x', 'stickerButtonOffsetX'],
            ['studio-bottombar-sticker-offset-y', 'stickerButtonOffsetY'],
            ['studio-bottombar-sticker-bg-opacity', 'stickerButtonBgOpacity'],
            ['studio-bottombar-sticker-radius', 'stickerButtonRadius'],
            ['studio-bottombar-sticker-shadow-opacity', 'stickerButtonShadowOpacity'],
            ['studio-bottombar-sticker-shadow-blur', 'stickerButtonShadowBlur'],
            ['studio-bottombar-sticker-shadow-spread', 'stickerButtonShadowSpread'],
            ['studio-bottombar-reply-size', 'replyButtonSize'],
            ['studio-bottombar-reply-offset-x', 'replyButtonOffsetX'],
            ['studio-bottombar-reply-offset-y', 'replyButtonOffsetY'],
            ['studio-bottombar-reply-bg-opacity', 'replyButtonBgOpacity'],
            ['studio-bottombar-reply-radius', 'replyButtonRadius'],
            ['studio-bottombar-reply-shadow-opacity', 'replyButtonShadowOpacity'],
            ['studio-bottombar-reply-shadow-blur', 'replyButtonShadowBlur'],
            ['studio-bottombar-reply-shadow-spread', 'replyButtonShadowSpread'],
            ['studio-bottombar-input-width', 'inputWidth'],
            ['studio-bottombar-input-offset-x', 'inputOffsetX'],
            ['studio-bottombar-input-offset-y', 'inputOffsetY']
        ].forEach(function (pair) {
            const input = root.getElementById(pair[0]);
            if (!input) return;
            const handler = function () {
                styleState.bottombar[pair[1]] = Number(input.value);
                syncBottomAdvancedControls(root);
                applyPreview();
            };
            input.addEventListener('input', handler);
            input.addEventListener('change', handler);
        });

        [
            ['studio-bottombar-menu-visible-toggle', 'menuButtonVisible'],
            ['studio-bottombar-sticker-visible-toggle', 'stickerButtonVisible'],
            ['studio-bottombar-reply-visible-toggle', 'replyButtonVisible']
        ].forEach(function (pair) {
            const input = root.getElementById(pair[0]);
            if (!input) return;
            input.addEventListener('change', function () {
                styleState.bottombar[pair[1]] = !!input.checked;
                syncBottomAdvancedControls(root);
                applyPreview();
            });
        });

        [
            ['studio-bottombar-menu-bg-color', 'menuButtonBgColor'],
            ['studio-bottombar-menu-shadow-color', 'menuButtonShadowColor'],
            ['studio-bottombar-sticker-bg-color', 'stickerButtonBgColor'],
            ['studio-bottombar-sticker-shadow-color', 'stickerButtonShadowColor'],
            ['studio-bottombar-reply-bg-color', 'replyButtonBgColor'],
            ['studio-bottombar-reply-shadow-color', 'replyButtonShadowColor']
        ].forEach(function (pair) {
            const input = root.getElementById(pair[0]);
            if (!input) return;
            const handler = function () {
                styleState.bottombar[pair[1]] = String(input.value || '').trim() || '#000000';
                syncBottomAdvancedControls(root);
                applyPreview();
            };
            input.addEventListener('input', handler);
            input.addEventListener('change', handler);
        });

        syncBottomAdvancedControls(root);

    }



    function ensureBottomInputStyleControls(root) {

        const section = root.getElementById('sec-bottombar');

        const container = section && section.querySelector('.settings-container');

        if (!container || root.getElementById('studio-bottombar-input-opacity')) return;

        const wrapper = document.createElement('div');

        wrapper.setAttribute('data-studio-bottombar-input-styles', 'true');

        wrapper.innerHTML = '' +

            '<div class="control-group">' +

                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-input-field"></i> \u8f93\u5165\u6846\u80cc\u666f</span></div>' +

                '<div class="control-label" style="margin-top: 8px;"><span>\u80cc\u666f\u900f\u660e\u5ea6</span><span class="value-display" id="studio-bottombar-input-opacity-display">100%</span></div><input type="range" id="studio-bottombar-input-opacity" min="0" max="100" value="100" style="margin-bottom: 8px;">' +

                '<div class="control-label"><span>\u80cc\u666f\u6a21\u7cca</span><span class="value-display" id="studio-bottombar-input-blur-display">0px</span></div><input type="range" id="studio-bottombar-input-blur" min="0" max="40" value="0" style="margin-bottom: 8px;">' +

                '<div class="control-label"><span>\u80cc\u666f\u56fe\u94fe\u63a5</span></div>' +

                '<div class="url-input-wrapper"><i class="ri-image-2-line"></i><input type="text" id="studio-bottombar-input-bg-url" placeholder="\u8f93\u5165\u8f93\u5165\u6846\u80cc\u666f\u56fe\u94fe\u63a5..."></div>' +

            '</div>' +

            '<div class="control-group">' +

                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-font-size-2"></i> \u8f93\u5165\u6846\u6587\u5b57</span></div>' +

                '<div class="control-label" style="margin-top: 8px;"><span>\u5360\u4f4d\u6587\u5b57\u5185\u5bb9</span></div>' +

                '<div class="url-input-wrapper" style="margin-bottom: 8px;"><i class="ri-edit-2-line"></i><input type="text" id="studio-bottombar-input-placeholder-text" placeholder="\u8f93\u5165\u5360\u4f4d\u6587\u5b57..."></div>' +

                '<div class="control-label"><span>\u6587\u5b57\u989c\u8272</span><div class="color-val-wrap"><input type="color" id="studio-bottombar-input-text-color" value="#1c1c1e"><span class="value-display" id="studio-bottombar-input-text-color-display">#1C1C1E</span></div></div>' +

                '<div class="control-label" style="margin-top: 8px;"><span>\u5360\u4f4d\u989c\u8272</span><div class="color-val-wrap"><input type="color" id="studio-bottombar-input-placeholder-color" value="#9a9aa2"><span class="value-display" id="studio-bottombar-input-placeholder-color-display">#9A9AA2</span></div></div>' +

                '<div class="control-label" style="margin-top: 8px;"><span>\u5360\u4f4d\u5b57\u53f7</span><span class="value-display" id="studio-bottombar-input-placeholder-size-display">15px</span></div><input type="range" id="studio-bottombar-input-placeholder-size" min="10" max="28" value="15">' +

            '</div>' +

            '<div class="control-group">' +

                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-shadow-line"></i> \u8f93\u5165\u6846\u9634\u5f71</span></div>' +

                '<div class="control-label" style="margin-top: 8px;"><span>\u9634\u5f71\u989c\u8272</span><div class="color-val-wrap"><input type="color" id="studio-bottombar-input-shadow-color" value="#000000"><span class="value-display" id="studio-bottombar-input-shadow-color-display">#000000</span></div></div>' +

                '<div class="control-label" style="margin-top: 8px;"><span>\u9634\u5f71\u900f\u660e\u5ea6</span><span class="value-display" id="studio-bottombar-input-shadow-opacity-display">0%</span></div><input type="range" id="studio-bottombar-input-shadow-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +

                '<div class="control-label"><span>\u6a21\u7cca\u534a\u5f84</span><span class="value-display" id="studio-bottombar-input-shadow-blur-display">0px</span></div><input type="range" id="studio-bottombar-input-shadow-blur" min="0" max="40" value="0" style="margin-bottom: 8px;">' +

                '<div class="control-label"><span>\u6269\u6563</span><span class="value-display" id="studio-bottombar-input-shadow-spread-display">0px</span></div><input type="range" id="studio-bottombar-input-shadow-spread" min="-16" max="24" value="0">' +

            '</div>';

        container.appendChild(wrapper);

    }



    function syncBottomInputStyleControls(root) {

        [

            ['studio-bottombar-input-opacity', 'studio-bottombar-input-opacity-display', styleState.bottombar.inputOpacity, '%'],

            ['studio-bottombar-input-blur', 'studio-bottombar-input-blur-display', styleState.bottombar.inputBlur, 'px'],

            ['studio-bottombar-input-placeholder-size', 'studio-bottombar-input-placeholder-size-display', styleState.bottombar.inputPlaceholderFontSize, 'px'],

            ['studio-bottombar-input-shadow-opacity', 'studio-bottombar-input-shadow-opacity-display', styleState.bottombar.inputShadowOpacity, '%'],

            ['studio-bottombar-input-shadow-blur', 'studio-bottombar-input-shadow-blur-display', styleState.bottombar.inputShadowBlur, 'px'],

            ['studio-bottombar-input-shadow-spread', 'studio-bottombar-input-shadow-spread-display', styleState.bottombar.inputShadowSpread, 'px']

        ].forEach(function (item) {

            const input = root.getElementById(item[0]);

            const display = root.getElementById(item[1]);

            if (input) input.value = String(item[2]);

            if (display) display.textContent = formatNumber(item[2]) + item[3];

        });

        [

            ['studio-bottombar-input-text-color', 'studio-bottombar-input-text-color-display', styleState.bottombar.inputTextColor],

            ['studio-bottombar-input-placeholder-color', 'studio-bottombar-input-placeholder-color-display', styleState.bottombar.inputPlaceholderColor],

            ['studio-bottombar-input-shadow-color', 'studio-bottombar-input-shadow-color-display', styleState.bottombar.inputShadowColor]

        ].forEach(function (item) {

            const input = root.getElementById(item[0]);

            const display = root.getElementById(item[1]);

            if (input) input.value = String(item[2] || '');

            if (display) display.textContent = String(item[2] || '').toUpperCase();

        });

        const bgUrlInput = root.getElementById('studio-bottombar-input-bg-url');

        if (bgUrlInput) bgUrlInput.value = styleState.bottombar.inputBackgroundImage || '';

        const placeholderTextInput = root.getElementById('studio-bottombar-input-placeholder-text');

        if (placeholderTextInput) placeholderTextInput.value = String(styleState.bottombar.inputPlaceholderText == null ? '' : styleState.bottombar.inputPlaceholderText);

    }



    function bindBottomInputStyleControls(root) {

        const anchor = root.getElementById('studio-bottombar-input-opacity');

        if (!anchor || anchor.dataset.studioBottomInputStylesBound === 'true') return;

        anchor.dataset.studioBottomInputStylesBound = 'true';

        [

            ['studio-bottombar-input-opacity', 'inputOpacity'],

            ['studio-bottombar-input-blur', 'inputBlur'],

            ['studio-bottombar-input-placeholder-size', 'inputPlaceholderFontSize'],

            ['studio-bottombar-input-shadow-opacity', 'inputShadowOpacity'],

            ['studio-bottombar-input-shadow-blur', 'inputShadowBlur'],

            ['studio-bottombar-input-shadow-spread', 'inputShadowSpread']

        ].forEach(function (pair) {

            const input = root.getElementById(pair[0]);

            if (!input) return;

            const handler = function () {

                styleState.bottombar[pair[1]] = Number(input.value);

                syncBottomInputStyleControls(root);

                applyPreview();

            };

            input.addEventListener('input', handler);

            input.addEventListener('change', handler);

        });

        [

            ['studio-bottombar-input-text-color', 'inputTextColor'],

            ['studio-bottombar-input-placeholder-color', 'inputPlaceholderColor'],

            ['studio-bottombar-input-shadow-color', 'inputShadowColor']

        ].forEach(function (pair) {

            const input = root.getElementById(pair[0]);

            if (!input) return;

            const handler = function () {

                styleState.bottombar[pair[1]] = String(input.value || '').trim() || '#000000';

                syncBottomInputStyleControls(root);

                applyPreview();

            };

            input.addEventListener('input', handler);

            input.addEventListener('change', handler);

        });

        const bgUrlInput = root.getElementById('studio-bottombar-input-bg-url');

        if (bgUrlInput) {

            const handler = function () {

                styleState.bottombar.inputBackgroundImage = String(bgUrlInput.value || '').trim();

                applyPreview();

            };

            bgUrlInput.addEventListener('input', handler);

            bgUrlInput.addEventListener('change', handler);

        }

        const placeholderTextInput = root.getElementById('studio-bottombar-input-placeholder-text');

        if (placeholderTextInput) {

            const handler = function () {

                styleState.bottombar.inputPlaceholderText = String(placeholderTextInput.value || '');

                syncBottomInputStyleControls(root);

                applyPreview();

            };

            placeholderTextInput.addEventListener('input', handler);

            placeholderTextInput.addEventListener('change', handler);

        }

        syncBottomInputStyleControls(root);

    }



    function resolveAvatarRoleState() { return styleState.avatar[uiState.avatarRole]; }



    function ensureAvatarControls(root) {



        const section = root.getElementById('sec-avatar');



        const container = section && section.querySelector('.settings-container');



        if (!section || !container) return;



        if (!root.getElementById('studio-avatar-role-segments')) {



            const roleSegments = document.createElement('div');



            roleSegments.id = 'studio-avatar-role-segments';



            roleSegments.className = 'segmented-control';



            roleSegments.style.margin = '12px 0 16px';



            roleSegments.innerHTML = '<div class="segment active">对方头像</div><div class="segment">我方头像</div>';



            section.insertBefore(roleSegments, container);



        }



        if (root.getElementById('studio-avatar-size')) return;



        const wrapper = document.createElement('div');



        wrapper.setAttribute('data-studio-avatar-controls', 'true');



        wrapper.innerHTML = '' +



            '<div class="control-group">' +



                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-user-3-line"></i> 基础样式</span></div>' +



                '<div class="control-label" style="margin-top: 8px;"><span>头像大小</span><span class="value-display" id="studio-avatar-size-display">34px</span></div><input type="range" id="studio-avatar-size" min="20" max="88" value="34" style="margin-bottom: 8px;">' +



                '<div class="control-label"><span>圆角</span><span class="value-display" id="studio-avatar-radius-display">17px</span></div><input type="range" id="studio-avatar-radius" min="0" max="44" value="17" style="margin-bottom: 8px;">' +



                '<div class="control-label"><span>头像与气泡间距</span><span class="value-display" id="studio-avatar-gap-display">8px</span></div><input type="range" id="studio-avatar-gap" min="0" max="40" value="8" style="margin-bottom: 8px;">' +



                '<div class="control-label"><span>上下偏移</span><span class="value-display" id="studio-avatar-offset-y-display">0px</span></div><input type="range" id="studio-avatar-offset-y" min="-60" max="60" value="0">' +



            '</div>' +



            '<div class="control-group">' +



                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-layout-line"></i> 边框</span></div>' +



                '<div class="control-label" style="margin-top: 8px;"><span>颜色</span><div class="color-val-wrap"><input type="color" id="studio-avatar-border-color" value="#ffffff"><span class="value-display" id="studio-avatar-border-color-display">#FFFFFF</span></div></div>' +



                '<div class="control-label" style="margin-top: 8px;"><span>透明度</span><span class="value-display" id="studio-avatar-border-opacity-display">0%</span></div><input type="range" id="studio-avatar-border-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +



                '<div class="control-label"><span>宽度</span><span class="value-display" id="studio-avatar-border-width-display">0px</span></div><input type="range" id="studio-avatar-border-width" min="0" max="8" value="0">' +



            '</div>' +



            '<div class="control-group">' +



                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-sparkling-line"></i> 阴影</span></div>' +



                '<div class="control-label" style="margin-top: 8px;"><span>颜色</span><div class="color-val-wrap"><input type="color" id="studio-avatar-shadow-color" value="#000000"><span class="value-display" id="studio-avatar-shadow-color-display">#000000</span></div></div>' +



                '<div class="control-label" style="margin-top: 8px;"><span>透明度</span><span class="value-display" id="studio-avatar-shadow-opacity-display">0%</span></div><input type="range" id="studio-avatar-shadow-opacity" min="0" max="100" value="0" style="margin-bottom: 8px;">' +



                '<div class="control-label"><span>模糊半径</span><span class="value-display" id="studio-avatar-shadow-blur-display">0px</span></div><input type="range" id="studio-avatar-shadow-blur" min="0" max="40" value="0" style="margin-bottom: 8px;">' +



                '<div class="control-label"><span>扩散</span><span class="value-display" id="studio-avatar-shadow-spread-display">0px</span></div><input type="range" id="studio-avatar-shadow-spread" min="-16" max="24" value="0">' +



            '</div>' +



            '<div class="control-group">' +



                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-stack-line"></i> 连发显示</span></div>' +



                '<div id="studio-avatar-series-mode-segments" class="segmented-control" style="margin-top: 8px;"><div class="segment" data-mode="always">全部</div><div class="segment" data-mode="first">首条</div><div class="segment" data-mode="last">末条</div></div>' +



            '</div>' +



            '<div class="control-group">' +



                '<div class="control-label" style="color: var(--text-main); font-weight: 600;"><span><i class="ri-frame-line"></i> 头像框</span></div>' +



                '<div class="url-input-wrapper" style="margin-top: 8px;"><i class="ri-links-line"></i><input type="text" id="studio-avatar-frame-url" placeholder="输入头像框链接..."></div>' +



            '</div>';



        container.appendChild(wrapper);



    }



    function syncAvatarControls(root) {



        const section = root.getElementById('sec-avatar');



        const shared = styleState.avatar.shared;



        const roleState = resolveAvatarRoleState();



        if (section) setRoleSegments(section, uiState.avatarRole);



        [['studio-avatar-size', 'studio-avatar-size-display', shared.size, 'px'], ['studio-avatar-radius', 'studio-avatar-radius-display', shared.radius, 'px'], ['studio-avatar-gap', 'studio-avatar-gap-display', shared.gap, 'px'], ['studio-avatar-offset-y', 'studio-avatar-offset-y-display', shared.offsetY, 'px'], ['studio-avatar-border-opacity', 'studio-avatar-border-opacity-display', shared.borderOpacity, '%'], ['studio-avatar-border-width', 'studio-avatar-border-width-display', shared.borderWidth, 'px'], ['studio-avatar-shadow-opacity', 'studio-avatar-shadow-opacity-display', shared.shadowOpacity, '%'], ['studio-avatar-shadow-blur', 'studio-avatar-shadow-blur-display', shared.shadowBlur, 'px'], ['studio-avatar-shadow-spread', 'studio-avatar-shadow-spread-display', shared.shadowSpread, 'px']].forEach(function (item) {



            const input = root.getElementById(item[0]);



            const display = root.getElementById(item[1]);



            if (input) input.value = String(item[2]);



            if (display) display.textContent = formatNumber(item[2]) + item[3];



        });



        [['studio-avatar-border-color', 'studio-avatar-border-color-display', shared.borderColor], ['studio-avatar-shadow-color', 'studio-avatar-shadow-color-display', shared.shadowColor]].forEach(function (item) {



            const input = root.getElementById(item[0]);



            const display = root.getElementById(item[1]);



            if (input) input.value = String(item[2] || '');



            if (display) display.textContent = String(item[2] || '').toUpperCase();



        });



        const frameInput = root.getElementById('studio-avatar-frame-url');



        if (frameInput) frameInput.value = roleState.frameUrl || '';



        const seriesSegments = root.getElementById('studio-avatar-series-mode-segments');



        if (seriesSegments) {



            const mode = normalizeAvatarSeriesMode(roleState.seriesMode);



            seriesSegments.querySelectorAll('.segment').forEach(function (segment) { segment.classList.toggle('active', segment.getAttribute('data-mode') === mode); });



        }



    }



    function bindAvatarControls(root) {



        const roleSegments = root.getElementById('studio-avatar-role-segments');



        if (!roleSegments || roleSegments.dataset.studioAvatarBound === 'true') return;



        roleSegments.dataset.studioAvatarBound = 'true';



        roleSegments.querySelectorAll('.segment').forEach(function (segment, index) {



            segment.addEventListener('click', function () {



                uiState.avatarRole = index === 0 ? 'other' : 'user';



                syncAvatarControls(root);



            });



        });



        [['studio-avatar-size', 'size'], ['studio-avatar-radius', 'radius'], ['studio-avatar-gap', 'gap'], ['studio-avatar-offset-y', 'offsetY'], ['studio-avatar-border-opacity', 'borderOpacity'], ['studio-avatar-border-width', 'borderWidth'], ['studio-avatar-shadow-opacity', 'shadowOpacity'], ['studio-avatar-shadow-blur', 'shadowBlur'], ['studio-avatar-shadow-spread', 'shadowSpread']].forEach(function (pair) {



            const input = root.getElementById(pair[0]);



            if (!input) return;



            const handler = function () {



                styleState.avatar.shared[pair[1]] = Number(input.value);



                syncAvatarControls(root);



                applyPreview();



            };



            input.addEventListener('input', handler);



            input.addEventListener('change', handler);



        });



        [['studio-avatar-border-color', 'borderColor'], ['studio-avatar-shadow-color', 'shadowColor']].forEach(function (pair) {



            const input = root.getElementById(pair[0]);



            if (!input) return;



            const handler = function () {



                styleState.avatar.shared[pair[1]] = String(input.value || '').trim() || '#000000';



                syncAvatarControls(root);



                applyPreview();



            };



            input.addEventListener('input', handler);



            input.addEventListener('change', handler);



        });



        const seriesSegments = root.getElementById('studio-avatar-series-mode-segments');



        if (seriesSegments) {



            seriesSegments.querySelectorAll('.segment').forEach(function (segment) {



                segment.addEventListener('click', function () {



                    resolveAvatarRoleState().seriesMode = normalizeAvatarSeriesMode(segment.getAttribute('data-mode'));



                    syncAvatarControls(root);



                    applyPreview();



                });



            });



        }



        const frameInput = root.getElementById('studio-avatar-frame-url');



        if (frameInput) {



            const handler = function () {



                resolveAvatarRoleState().frameUrl = String(frameInput.value || '').trim();



                applyPreview();



            };



            frameInput.addEventListener('input', handler);



            frameInput.addEventListener('change', handler);



        }



        syncAvatarControls(root);



    }



    function attachBindings(root, sectionId, paths, resolveTarget) { const section = root.getElementById(sectionId); if (!section) return []; const inputs = Array.from(section.querySelectorAll('input')); return paths.map(function (path, index) { const input = inputs[index]; if (!input) return null; const binding = { path: path, input: input, display: findDisplay(input), unit: detectUnit((findDisplay(input) && findDisplay(input).textContent) || '') }; const handler = function () { setByPath(resolveTarget(), path, readValue(input)); updateDisplay(binding); applyPreview(); }; if (input.type === 'checkbox') input.addEventListener('change', handler); else { input.addEventListener('input', handler); if (input.type === 'text') input.addEventListener('change', handler); } updateDisplay(binding); return binding; }).filter(Boolean); }



    function loadBindings(bindings, state) { bindings.forEach(function (binding) { writeValue(binding, getByPath(state, binding.path)); }); }



    function setRoleSegments(section, role) { const control = section && section.querySelector('.segmented-control'); if (!control) return; control.querySelectorAll('.segment').forEach(function (segment, index) { segment.classList.toggle('active', index === (role === 'other' ? 0 : 1)); }); }



    function syncToggle(root, checkboxId, panelId, checked) { const checkbox = root.getElementById(checkboxId); const panel = root.getElementById(panelId); if (!checkbox || !panel) return; checkbox.checked = !!checked; panel.classList.toggle('open', !!checked); }



    function syncMutex(root, checkboxId, unifiedId, independentId, checked) { const checkbox = root.getElementById(checkboxId); const unified = root.getElementById(unifiedId); const independent = root.getElementById(independentId); if (!checkbox || !unified || !independent) return; checkbox.checked = !!checked; unified.classList.toggle('open', !checked); independent.classList.toggle('open', !!checked); }



    function syncMode(root, tabsId, unifiedId, singleId, continuousId, mode) { const tabs = root.getElementById(tabsId); const unified = root.getElementById(unifiedId); const single = root.getElementById(singleId); const continuous = root.getElementById(continuousId); if (!tabs || !unified || !single || !continuous) return; tabs.querySelectorAll('.segment').forEach(function (segment) { segment.classList.toggle('active', segment.getAttribute('data-mode') === mode); }); unified.classList.toggle('open', mode === 'unified'); single.classList.toggle('open', mode === 'single'); continuous.classList.toggle('open', mode === 'continuous'); }



    function syncOrdinary(root, bindings) { const section = root.getElementById('sec-ordinary'); const state = styleState.ordinary[uiState.ordinaryRole]; setRoleSegments(section, uiState.ordinaryRole); loadBindings(bindings, state); syncMutex(root, 'togglePadding', 'panelUnifiedPadding', 'panelIndependentPadding', state.useIndependentPadding); syncToggle(root, 'toggleBorder', 'panelBorder', state.borderEnabled); syncToggle(root, 'toggleShadow', 'panelShadow', state.shadowEnabled); syncToggle(root, 'toggleDeco1', 'panelDeco1', state.deco1.enabled); syncToggle(root, 'toggleDeco2', 'panelDeco2', state.deco2.enabled); syncMode(root, 'radiusModeTabsOrd', 'panelRadiusUnifiedOrd', 'panelRadiusSingleOrd', 'panelRadiusContinuousOrd', state.radiusMode); syncBubbleTimestampControls(root, 'ordinary'); }



    function syncVoice(root, bindings) { const section = root.getElementById('sec-voice'); const state = styleState.voice[uiState.voiceRole]; setRoleSegments(section, uiState.voiceRole); loadBindings(bindings, state); syncMutex(root, 'togglePaddingVoice', 'panelUnifiedPaddingVoice', 'panelIndependentPaddingVoice', state.useIndependentPadding); syncToggle(root, 'toggleBorderVoice', 'panelBorderVoice', state.borderEnabled); syncToggle(root, 'toggleShadowVoice', 'panelShadowVoice', state.shadowEnabled); syncToggle(root, 'toggleDeco1Voice', 'panelDeco1Voice', state.deco1.enabled); syncToggle(root, 'toggleDeco2Voice', 'panelDeco2Voice', state.deco2.enabled); syncMode(root, 'radiusModeTabsVoice', 'panelRadiusUnifiedVoice', 'panelRadiusSingleVoice', 'panelRadiusContinuousVoice', state.radiusMode); syncBubbleTimestampControls(root, 'voice'); }



    function syncQuoted(root, bindings) { const section = root.getElementById('sec-quoted'); setRoleSegments(section, uiState.quotedRole); loadBindings(bindings, styleState.quoted[uiState.quotedRole]); }



    function syncAvatar(root) { syncAvatarControls(root); }



    function syncTopbar(root, bindings) { loadBindings(bindings, styleState.topbar); syncToggle(root, 'toggleTopbarShadow', 'panelTopbarShadow', styleState.topbar.shadowEnabled); syncTopbarAvatarControls(root); syncTopbarAdvancedControls(root); }



    function syncBottom(root, bindings) { loadBindings(bindings, styleState.bottombar); syncBottomAdvancedControls(root); syncBottomInputStyleControls(root); }



    function bindRoleTabs(root, sectionId, key, sync) { const section = root.getElementById(sectionId); const control = section && section.querySelector('.segmented-control'); if (!control) return; control.querySelectorAll('.segment').forEach(function (segment, index) { segment.addEventListener('click', function () { uiState[key] = index === 0 ? 'other' : 'user'; sync(root); }); }); }



    function bindModeTabs(root, tabsId, resolveState, sync) { const tabs = root.getElementById(tabsId); if (!tabs) return; tabs.querySelectorAll('.segment').forEach(function (segment) { segment.addEventListener('click', function () { resolveState().radiusMode = segment.getAttribute('data-mode') || 'unified'; sync(root); applyPreview(); }); }); }



    function markLockKey(group, key) {



        if (!group || !key) return;



        group.dataset.studioLockKey = key;



    }



    function annotateGranularLockGroups(root) {



        if (!root) return;



        if (root.__studioLockGroupsBound === true) return;



        root.__studioLockGroupsBound = true;







        function tagSectionGroups(sectionId, resolver) {



            const section = root.getElementById(sectionId);



            if (!section) return;



            Array.from(section.querySelectorAll('.control-group')).forEach(function (group) {



                const key = resolver(group);



                if (key) markLockKey(group, key);



            });



        }







        tagSectionGroups('sec-ordinary', function (group) {



            if (group.querySelector('#togglePadding')) return 'ordinaryPadding';



            if (group.querySelector('#toggleBorder')) return 'ordinaryBorder';



            if (group.querySelector('#radiusModeTabsOrd')) return 'ordinaryRadius';



            if (group.querySelector('#toggleShadow')) return 'ordinaryShadow';



            if (group.querySelector('#toggleDeco1') || group.querySelector('#toggleDeco2')) return 'ordinaryDecoration';



            if (group.querySelector('[data-studio-bubble-time-group="ordinary"]')) return 'ordinaryTimestamp';



            if (group.querySelector('[data-studio-bubble-gap-group="ordinary"]')) return 'ordinaryLayout';



            return 'ordinaryBase';



        });







        tagSectionGroups('sec-voice', function (group) {



            if (group.querySelector('#togglePaddingVoice')) return 'voicePadding';



            if (group.querySelector('#toggleBorderVoice')) return 'voiceBorder';



            if (group.querySelector('#radiusModeTabsVoice')) return 'voiceRadius';



            if (group.querySelector('#toggleShadowVoice')) return 'voiceShadow';



            if (group.querySelector('#toggleDeco1Voice') || group.querySelector('#toggleDeco2Voice')) return 'voiceDecoration';



            if (group.querySelector('[data-studio-bubble-time-group="voice"]')) return 'voiceTimestamp';



            if (group.querySelector('[data-studio-bubble-gap-group="voice"]')) return 'voiceLayout';



            return 'voiceBase';



        });







        tagSectionGroups('sec-quoted', function () { return 'quotedBase'; });







        tagSectionGroups('sec-avatar', function (group) {



            if (group.querySelector('#studio-avatar-size')) return 'avatarBase';



            if (group.querySelector('#studio-avatar-border-color') || group.querySelector('#studio-avatar-border-width') || group.querySelector('#studio-avatar-border-opacity')) return 'avatarBorder';



            if (group.querySelector('#studio-avatar-shadow-color') || group.querySelector('#studio-avatar-shadow-opacity') || group.querySelector('#studio-avatar-shadow-blur') || group.querySelector('#studio-avatar-shadow-spread')) return 'avatarShadow';



            if (group.querySelector('#studio-avatar-series-mode-segments')) return 'avatarSeries';



            if (group.querySelector('#studio-avatar-frame-url')) return 'avatarFrame';



            return 'avatarBase';



        });







        tagSectionGroups('sec-topbar', function (group) {



            if (group.querySelector('#studio-topbar-avatar-visible-toggle') || group.querySelector('#studio-topbar-avatar-size')) return 'topbarAvatar';



            if (group.querySelector('#studio-topbar-status-visible-toggle') || group.querySelector('#studio-topbar-title-size') || group.querySelector('#studio-topbar-status-size')) return 'topbarText';



            if (group.querySelector('#studio-topbar-back-size')) return 'topbarBackButton';



            if (group.querySelector('#studio-topbar-settings-size')) return 'topbarSettingsButton';



            if (group.querySelector('input[type="text"][placeholder*="图标"]')) return 'topbarIcons';



            return 'topbarBase';



        });







        tagSectionGroups('sec-bottombar', function (group) {



            if (group.querySelector('#studio-bottombar-menu-size')) return 'bottombarMenuButton';



            if (group.querySelector('#studio-bottombar-sticker-size')) return 'bottombarStickerButton';



            if (group.querySelector('#studio-bottombar-reply-size')) return 'bottombarReplyButton';



            if (group.querySelector('input[type="text"][placeholder*="图标链接"]')) return 'bottombarIcons';



            return 'bottombarBase';



        });



    }



    function ensureLockGroupNote(group) {



        if (!group) return null;



        let note = group.querySelector('.studio-group-lock-note');



        if (!note) {



            note = document.createElement('div');



            note.className = 'studio-group-lock-note';



            group.appendChild(note);



        }



        return note;



    }



    function applyScopeLocks(root) {



        if (!root) return;



        annotateGranularLockGroups(root);



        root.querySelectorAll('.control-group[data-studio-lock-key]').forEach(function (group) {



            const key = group.dataset.studioLockKey;



            const locked = editableScopesState[key] === false;



            const meta = getStudioAppearanceLockGroupMeta(key);



            const note = ensureLockGroupNote(group);



            group.classList.toggle('studio-locked-control-group', locked);



            if (note) {



                note.textContent = (meta && meta.exportLabel ? meta.exportLabel : '此项') + ' 已被锁定，当前不可编辑。';



                note.style.display = locked ? 'block' : 'none';



            }



        });



        Object.keys(STUDIO_APPEARANCE_SECTION_IDS).forEach(function (sectionKey) {



            const section = root.getElementById(STUDIO_APPEARANCE_SECTION_IDS[sectionKey]);



            const navItem = root.querySelector('.nav-item[data-target="' + STUDIO_APPEARANCE_SECTION_IDS[sectionKey] + '"]');



            const allLocked = (STUDIO_APPEARANCE_SECTION_GROUPS[sectionKey] || []).every(function (groupKey) { return editableScopesState[groupKey] === false; });



            if (section) section.classList.toggle('studio-locked-section', allLocked);



            if (navItem) navItem.classList.toggle('studio-nav-locked', allLocked);



        });



    }



    function refreshToolbarUi() {



        if (!toolbarShadowRoot || !toolbarBindings) return;



        syncOrdinary(toolbarShadowRoot, toolbarBindings.ordinaryBindings);



        syncVoice(toolbarShadowRoot, toolbarBindings.voiceBindings);



        syncQuoted(toolbarShadowRoot, toolbarBindings.quotedBindings);



        syncAvatar(toolbarShadowRoot);



        syncTopbar(toolbarShadowRoot, toolbarBindings.topbarBindings);



        syncBottom(toolbarShadowRoot, toolbarBindings.bottombarBindings);



        syncBubbleGapControls(toolbarShadowRoot);



        applyScopeLocks(toolbarShadowRoot);



        if (typeof window.refreshStudioToolbarLayout === 'function') {



            setTimeout(function () { window.refreshStudioToolbarLayout(false); }, 0);



        }



    }



    function bindShadow(root) {



        if (!root || root.__studioPreviewBound) return;



        root.__studioPreviewBound = true;



        let helperStyle = root.getElementById('studio-toolbar-preview-helper');



        if (!helperStyle) {



            helperStyle = document.createElement('style');



            helperStyle.id = 'studio-toolbar-preview-helper';



            helperStyle.textContent = '.studio-toolbar-panel-backdrop{display:none !important;} .studio-toolbar-stage{overflow:visible !important;} .studio-locked-control-group{position:relative; opacity:0.46 !important; filter:saturate(0.42);} .studio-locked-control-group .segmented-control,.studio-locked-control-group .switch,.studio-locked-control-group .url-input-wrapper,.studio-locked-control-group .collapsible-panel,.studio-locked-control-group input,.studio-locked-control-group button,.studio-locked-control-group textarea,.studio-locked-control-group select{pointer-events:none !important;} .studio-group-lock-note{display:none; margin-top:10px; padding:9px 11px; border-radius:12px; background:rgba(255,170,0,0.14); color:#8a5c00; font-size:12px; font-weight:600; line-height:1.4;} .studio-nav-locked{opacity:0.72 !important;}';



            root.appendChild(helperStyle);



        }



        ensureBubbleGapControls(root);



        ensureBubbleTimestampControls(root);



        ensureTopbarAvatarControls(root);



        ensureTopbarAdvancedControls(root);



        ensureBottomAdvancedControls(root);



        ensureBottomInputStyleControls(root);



        ensureAvatarControls(root);



        bindBubbleGapControls(root);



        bindBubbleTimestampControls(root);



        bindTopbarAvatarControls(root);



        bindTopbarAdvancedControls(root);



        bindBottomAdvancedControls(root);



        bindBottomInputStyleControls(root);



        bindAvatarControls(root);



        const ordinaryBindings = attachBindings(root, 'sec-ordinary', ORDINARY_PATHS, function () { return styleState.ordinary[uiState.ordinaryRole]; });



        const voiceBindings = attachBindings(root, 'sec-voice', VOICE_PATHS, function () { return styleState.voice[uiState.voiceRole]; });



        const quotedBindings = attachBindings(root, 'sec-quoted', QUOTED_PATHS, function () { return styleState.quoted[uiState.quotedRole]; });



        const topbarBindings = attachBindings(root, 'sec-topbar', TOPBAR_PATHS, function () { return styleState.topbar; });



        const bottombarBindings = attachBindings(root, 'sec-bottombar', BOTTOMBAR_PATHS, function () { return styleState.bottombar; });



        bindRoleTabs(root, 'sec-ordinary', 'ordinaryRole', function (currentRoot) { syncOrdinary(currentRoot, ordinaryBindings); });



        bindRoleTabs(root, 'sec-voice', 'voiceRole', function (currentRoot) { syncVoice(currentRoot, voiceBindings); });



        bindRoleTabs(root, 'sec-quoted', 'quotedRole', function (currentRoot) { syncQuoted(currentRoot, quotedBindings); });



        bindModeTabs(root, 'radiusModeTabsOrd', function () { return styleState.ordinary[uiState.ordinaryRole]; }, function (currentRoot) { syncOrdinary(currentRoot, ordinaryBindings); });



        bindModeTabs(root, 'radiusModeTabsVoice', function () { return styleState.voice[uiState.voiceRole]; }, function (currentRoot) { syncVoice(currentRoot, voiceBindings); });



        toolbarShadowRoot = root;



        toolbarBindings = { ordinaryBindings: ordinaryBindings, voiceBindings: voiceBindings, quotedBindings: quotedBindings, topbarBindings: topbarBindings, bottombarBindings: bottombarBindings };



        syncOrdinary(root, ordinaryBindings); syncVoice(root, voiceBindings); syncQuoted(root, quotedBindings); syncAvatar(root); syncTopbar(root, topbarBindings); syncBottom(root, bottombarBindings); syncBubbleGapControls(root); applyScopeLocks(root); applyPreview();



    }



    function waitForShadow() { const host = document.getElementById('studio-toolbar-host'); if (!host || !host.shadowRoot) { requestAnimationFrame(waitForShadow); return; } bindShadow(host.shadowRoot); }



    window.STUDIO_APPEARANCE_LOCK_GROUPS = STUDIO_APPEARANCE_LOCK_GROUPS.map(function (item) { return clone(item); });



    window.applyStudioToolbarPreview = applyPreview;



    window.applyStudioStylesToWechat = applyStudioStylesToWechat;



    window.clearStudioStylesFromWechat = clearStudioStylesFromWechat;



    window.applyStoredStudioAppearancePresetToWechat = applyStoredStudioAppearancePresetToWechat;



    window.getStoredStudioAppearancePresetByKey = getStoredStudioAppearancePresetByKey;



    window.listStoredStudioAppearancePresets = listStoredStudioAppearancePresets;



    window.isStoredStudioAppearancePresetKey = function (value) { return !!getStoredStudioAppearancePresetByKey(value); };



    window.saveCurrentStudioAppearancePreset = saveStoredStudioAppearancePreset;



    window.deleteStoredStudioAppearancePresetByKey = deleteStoredStudioAppearancePresetByKey;



    window.exportCurrentStudioAppearanceAsFile = exportCurrentStudioAppearanceAsFile;



    window.importStudioAppearanceFromFile = importStudioAppearanceFromFile;



    window.loadStudioAppearanceIntoToolbar = loadStudioAppearanceIntoToolbar;



    window.getCurrentStudioAppearanceSnapshot = getCurrentStudioAppearanceSnapshot;



    window.getCurrentStudioAppearanceName = function () { return currentAppearancePresetMeta && currentAppearancePresetMeta.name ? currentAppearancePresetMeta.name : ''; };



    if (document.readyState === 'loading') {



        document.addEventListener('DOMContentLoaded', function () { waitForShadow(); waitForWechatHooks(); });



    } else {



        waitForShadow();



        waitForWechatHooks();



    }



})();














