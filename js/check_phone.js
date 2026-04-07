// 查手机功能模块 (Phone Check App)

// 配置常量
const PHONE_GRID_ROWS = 6;
const PHONE_GRID_COLS = 4;
const PHONE_SLOTS_PER_PAGE = PHONE_GRID_ROWS * PHONE_GRID_COLS;
const PHONE_DOCK_APP_IDS = ['phone-messages', 'phone-health', 'phone-browser', 'phone-notes'];
const PHONE_DOCK_APPS = [
    { appId: 'phone-messages', name: '短信', iconClass: 'fas fa-comment-alt', color: '#34C759', type: 'app' },
    { appId: 'phone-health', name: '健康', iconClass: 'fas fa-heartbeat', color: '#FF2D55', type: 'app' },
    { appId: 'phone-browser', name: '浏览器', iconClass: 'fab fa-safari', color: '#007AFF', type: 'app' },
    { appId: 'phone-notes', name: '备忘录', iconClass: 'fas fa-sticky-note', color: '#FFD60A', type: 'app' }
];
const PHONE_THEME_APP = { appId: 'phone-theme', name: '美化', iconClass: 'fas fa-paint-brush', color: '#5856D6', type: 'app' };
const PHONE_THEME_TEMPLATE_VERSION = '2026-04-04-v1';

// 状态变量
let isPhoneEditMode = false;
let currentPhonePage = 0;
let totalPhonePages = 2;
let phoneScreenData = []; // 当前显示的查手机页面数据

// DOM 元素引用
let phonePagesWrapper;
let phonePagesContainer;
let phonePageIndicators;
let phoneLibraryModal;
let phoneDockBar;
let phoneDockContainer;

// 缓存 DOM 元素
let phoneItemElementMap = new Map();

// 拖拽相关
let phoneDragItem = null;
let lastPhoneDragTargetIndex = -1;
let phoneDragThrottleTimer = null;
let isPhoneDropped = false;
let phonePageSwitchTimer = null;

// 长按相关
let phoneLongPressTimer = null;
let phoneTouchStartPos = { x: 0, y: 0 };
let phoneTouchCurrentPos = { x: 0, y: 0 };
let isPhoneTouchDragging = false;
let phoneTouchDragClone = null;
let phoneTouchDraggedElement = null;
let phoneTouchDraggedItem = null;

// 查手机当前联系人
let currentCheckPhoneContactId = null;

function phoneIsDockApp(item) {
    return !!(item && item.appId && PHONE_DOCK_APP_IDS.includes(item.appId));
}

function getPhoneGridItems() {
    return phoneScreenData.filter(item => !phoneIsDockApp(item));
}

function getPhoneDockItems() {
    return PHONE_DOCK_APPS.map(dockApp => {
        const existing = phoneScreenData.find(item => item.appId === dockApp.appId) || {};
        return { ...dockApp, ...existing };
    });
}

function createEmptyPhoneThemeData() {
    return {
        wallpapers: [],
        currentWallpaper: null,
        icons: {},
        iconColors: {},
        appNames: {}
    };
}

function normalizePhoneThemeData(themeData) {
    const source = themeData && typeof themeData === 'object' ? themeData : {};
    const normalized = createEmptyPhoneThemeData();

    normalized.wallpapers = Array.isArray(source.wallpapers)
        ? source.wallpapers
            .map((wallpaper, index) => {
                if (!wallpaper || typeof wallpaper !== 'object' || !wallpaper.data) return null;
                const id = wallpaper.id != null ? wallpaper.id : `phone-theme-wallpaper-${Date.now()}-${index}`;
                return { id, data: String(wallpaper.data) };
            })
            .filter(Boolean)
        : [];

    normalized.currentWallpaper = source.currentWallpaper != null ? source.currentWallpaper : null;
    if (!normalized.wallpapers.some(wallpaper => wallpaper.id === normalized.currentWallpaper)) {
        normalized.currentWallpaper = null;
    }

    normalized.icons = source.icons && typeof source.icons === 'object' ? { ...source.icons } : {};
    normalized.iconColors = source.iconColors && typeof source.iconColors === 'object' ? { ...source.iconColors } : {};
    normalized.appNames = source.appNames && typeof source.appNames === 'object' ? { ...source.appNames } : {};

    return normalized;
}

function getPhoneThemeStore(contactId) {
    if (!contactId) return createEmptyPhoneThemeData();
    const state = window.iphoneSimState || {};
    if (!state.phoneContent) state.phoneContent = {};
    if (!state.phoneContent[contactId]) state.phoneContent[contactId] = {};
    state.phoneContent[contactId].phoneTheme = normalizePhoneThemeData(state.phoneContent[contactId].phoneTheme);
    return state.phoneContent[contactId].phoneTheme;
}

function getCurrentPhoneThemeStore() {
    return currentCheckPhoneContactId ? getPhoneThemeStore(currentCheckPhoneContactId) : createEmptyPhoneThemeData();
}

function persistPhoneThemeState() {
    if (window.saveConfig) window.saveConfig();
    else if (typeof saveConfig === 'function') saveConfig();
}

function getPhoneThemeAppCatalog() {
    const apps = [];
    const seen = new Set();
    const pushApp = (item) => {
        if (!item || item.type !== 'app' || !item.appId || seen.has(item.appId)) return;
        seen.add(item.appId);
        apps.push({
            appId: item.appId,
            name: item.name || '应用',
            iconClass: item.iconClass || 'fas fa-mobile-alt',
            color: item.color || '#8E8E93',
            dock: !!item.dock
        });
    };

    getPhoneGridItems()
        .slice()
        .sort((a, b) => (a.index || 0) - (b.index || 0))
        .forEach(pushApp);

    getPhoneDockItems().forEach(pushApp);
    return apps;
}

function getPhoneThemeAppInfo(appId) {
    return getPhoneThemeAppCatalog().find(app => app.appId === appId)
        || { appId, name: '应用', iconClass: 'fas fa-mobile-alt', color: '#8E8E93' };
}

function createPhoneAppElement(item, draggable) {
    const div = document.createElement('div');
    div.classList.add('draggable-item');
    div.setAttribute('draggable', draggable);

    const themeStore = getCurrentPhoneThemeStore();
    const finalColor = (themeStore.iconColors && themeStore.iconColors[item.appId]) || item.color || '#fff';
    const customIcon = themeStore.icons && themeStore.icons[item.appId];
    const displayName = (themeStore.appNames && themeStore.appNames[item.appId]) || item.name || '应用';

    const iconContent = customIcon
        ? `<img src="${customIcon}" style="width:100%; height:100%; object-fit:cover; border-radius:14px;">`
        : `<i class="${item.iconClass}" style="color: ${finalColor === '#fff' || finalColor === '#ffffff' ? '#000' : '#fff'};"></i>`;

    div.innerHTML = `
        <div class="app-icon-img" style="background-color: ${finalColor}; overflow: hidden;">
            ${iconContent}
        </div>
        <span class="app-name" title="${phoneFilesEscapeHtml(displayName)}">${phoneFilesEscapeHtml(displayName)}</span>
    `;

    div.addEventListener('click', () => {
        if (!isPhoneEditMode && item.appId) {
            if (window.handleAppClick) {
                window.handleAppClick(item.appId, item.name || displayName);
            } else {
                const appScreen = document.getElementById(item.appId);
                if (appScreen) appScreen.classList.remove('hidden');
            }
        }
    });

    return div;
}

function applyPhoneWallpaper() {
    const app = document.getElementById('phone-app');
    const mainContent = app ? app.querySelector('.main-content') : null;
    if (!mainContent) return;

    const themeStore = getCurrentPhoneThemeStore();
    const wallpaper = themeStore.wallpapers.find(item => item.id === themeStore.currentWallpaper);

    if (wallpaper && wallpaper.data) {
        const wallpaperUrl = String(wallpaper.data).replace(/"/g, '\\"');
        mainContent.style.backgroundColor = '#111';
        mainContent.style.backgroundImage = `url("${wallpaperUrl}")`;
        mainContent.style.backgroundSize = 'cover';
        mainContent.style.backgroundPosition = 'center';
        mainContent.style.backgroundRepeat = 'no-repeat';
    } else {
        mainContent.style.backgroundColor = '#f2f2f7';
        mainContent.style.backgroundImage = '';
        mainContent.style.backgroundSize = '';
        mainContent.style.backgroundPosition = '';
        mainContent.style.backgroundRepeat = '';
    }
}

function applyPhoneIcons() {
    if (Array.isArray(phoneScreenData)) {
        phoneScreenData.forEach(item => {
            if (item && item.type === 'app' && item._internalId) {
                const element = phoneItemElementMap.get(item._internalId);
                if (element && element.parentNode) element.parentNode.removeChild(element);
                phoneItemElementMap.delete(item._internalId);
            }
        });
    }
    renderPhoneItems();
}

function compactPhoneGridItems(items) {
    const sorted = [...items].sort((a, b) => (a.index || 0) - (b.index || 0));
    const placed = [];

    sorted.forEach(item => {
        let targetIndex = 0;
        const size = item.size || '1x1';
        const maxSearch = 200;
        while (targetIndex < maxSearch) {
            const slots = window.getOccupiedSlots ? window.getOccupiedSlots(targetIndex, size) : [targetIndex];
            if (!slots) {
                targetIndex += 1;
                continue;
            }
            const collision = placed.some(existing => {
                if (window.isCollision) return window.isCollision(existing, slots);
                return slots.includes(existing.index);
            });
            if (!collision) {
                item.index = targetIndex;
                placed.push(item);
                return;
            }
            targetIndex += 1;
        }
    });
}

function normalizePhoneDockLayout() {
    phoneScreenData.forEach(item => {
        if (phoneIsDockApp(item)) item.dock = true;
        else delete item.dock;
    });
    compactPhoneGridItems(getPhoneGridItems());
}

function ensurePhoneDockShell() {
    const app = document.getElementById('phone-app');
    const mainContent = app ? app.querySelector('.main-content') : null;
    if (!mainContent) return null;

    phoneDockBar = document.getElementById('phone-dock-bar');
    if (!phoneDockBar) {
        phoneDockBar = document.createElement('div');
        phoneDockBar.id = 'phone-dock-bar';
        phoneDockBar.className = 'dock-bar';
        phoneDockBar.innerHTML = '<div id="phone-dock-container" class="dock-container"></div>';
        const toolbar = document.getElementById('phone-edit-mode-toolbar');
        if (toolbar && toolbar.parentNode === mainContent) mainContent.insertBefore(phoneDockBar, toolbar);
        else mainContent.appendChild(phoneDockBar);
    }

    phoneDockContainer = document.getElementById('phone-dock-container');
    return phoneDockBar;
}

function createPhoneDockElement(item) {
    const div = document.createElement('div');
    div.className = 'app-item dock-item phone-dock-item';
    div.dataset.appId = item.appId || '';

    const themeStore = getCurrentPhoneThemeStore();
    let finalColor = item.color || '#fff';
    if (themeStore.iconColors && themeStore.iconColors[item.appId]) {
        finalColor = themeStore.iconColors[item.appId];
    }

    let iconContent = `<i class="${item.iconClass}" style="color: ${finalColor === '#fff' || finalColor === '#ffffff' ? '#000' : '#fff'};"></i>`;
    if (themeStore.icons && themeStore.icons[item.appId]) {
        iconContent = `<img src="${themeStore.icons[item.appId]}" style="width:100%;height:100%;object-fit:cover;border-radius:18px;">`;
    }

    let displayName = item.name || '';
    if (themeStore.appNames && themeStore.appNames[item.appId]) {
        displayName = themeStore.appNames[item.appId];
    }

    div.innerHTML = `
        <div class="app-icon" style="background-color:${finalColor};overflow:hidden;">
            ${iconContent}
        </div>
        <span class="app-label">${phoneFilesEscapeHtml(displayName)}</span>
    `;

    div.addEventListener('click', () => {
        if (isPhoneEditMode || !item.appId) return;
        if (window.handleAppClick) window.handleAppClick(item.appId, item.name || displayName);
    });

    return div;
}

function renderPhoneDock() {
    ensurePhoneDockShell();
    if (!phoneDockBar || !phoneDockContainer) return;

    phoneDockBar.classList.toggle('hidden', isPhoneEditMode);
    if (phonePageIndicators) {
        phonePageIndicators.style.bottom = isPhoneEditMode ? '40px' : '118px';
    }

    phoneDockContainer.innerHTML = '';
    getPhoneDockItems().forEach(item => {
        phoneDockContainer.appendChild(createPhoneDockElement(item));
    });
}

const PHONE_THEME_TEMPLATE_HTML = `
    <header class="theme-nav-header">
        <button class="theme-nav-btn" id="phone-theme-back-btn"><i class="fas fa-arrow-left"></i></button>
        <div class="theme-nav-title">查手机美化</div>
        <button class="theme-nav-btn" style="visibility: hidden;"><i class="fas fa-ellipsis-h"></i></button>
    </header>

    <div class="app-body" style="padding: 0; background: transparent; overflow-y: auto;">
        <section class="theme-hero-section">
            <h1 class="theme-hero-title">Style This<br>Phone.</h1>
            <p class="theme-hero-subtitle">只美化查手机里的桌面：支持壁纸和应用图标，不会影响外面的主屏幕。</p>
        </section>

        <main class="theme-gallery-container" style="padding-bottom: 120px;">
            <div class="theme-gallery-item theme-item-tall" id="open-phone-theme-wallpaper">
                <div class="theme-decor-circle"></div>
                <div class="theme-category-tag">Visuals</div>
                <i class="fas fa-image theme-item-icon"></i>
                <h3 class="theme-item-title">壁纸设置</h3>
                <p class="theme-item-desc">上传或切换这台手机主屏幕使用的壁纸。</p>
                <div class="theme-item-arrow"><i class="fas fa-arrow-right"></i></div>
            </div>

            <div class="theme-gallery-item theme-item-large" id="open-phone-theme-icons">
                <div class="theme-typographic-decor">I</div>
                <i class="fas fa-shapes theme-item-icon"></i>
                <div class="theme-item-content">
                    <div class="theme-category-tag">Icons</div>
                    <h3 class="theme-item-title">应用图标</h3>
                    <p class="theme-item-desc">修改主屏与 Dock 中应用的图标、底色和显示名称。</p>
                </div>
                <div class="theme-item-arrow"><i class="fas fa-arrow-right"></i></div>
            </div>
        </main>
    </div>

    <div id="phone-theme-wallpaper-screen" class="theme-sub-page-overlay hidden">
        <div class="theme-sub-page-container">
            <div class="theme-sub-page-header">
                <h2 class="theme-sub-page-title">壁纸设置</h2>
                <button class="theme-close-sub-page" id="close-phone-theme-wallpaper"><i class="fas fa-times"></i></button>
            </div>
            <div class="theme-sub-page-content">
                <div class="theme-form-group">
                    <label class="theme-form-label">当前壁纸</label>
                    <div style="display:flex; gap:10px; margin-bottom:16px;">
                        <label class="theme-action-btn" style="flex:1; justify-content:center; background:#000; color:#fff; cursor:pointer;">
                            <i class="fas fa-image"></i> 上传壁纸
                            <input type="file" id="phone-theme-wallpaper-upload" accept="image/*" class="file-input-hidden">
                        </label>
                        <button class="theme-action-btn" id="phone-theme-reset-wallpaper" style="flex:1; justify-content:center; background:#ffebee; color:#d32f2f;">恢复默认</button>
                    </div>
                    <span class="theme-form-hint">只会作用在查手机主屏，不会影响外层桌面。</span>
                </div>

                <div class="theme-form-group">
                    <label class="theme-form-label">壁纸图库</label>
                    <span class="theme-form-hint" style="margin-bottom:12px;">点击切换；右上角可删除已上传壁纸。</span>
                    <div id="phone-theme-wallpaper-gallery" class="gallery-scroll" style="display:flex; gap:16px; overflow-x:auto; padding-bottom:12px; scroll-snap-type:x mandatory; -webkit-overflow-scrolling:touch; background:transparent; padding-left:0; padding-right:0;"></div>
                </div>
            </div>
        </div>
    </div>

    <div id="phone-theme-icons-screen" class="theme-sub-page-overlay hidden">
        <div class="theme-sub-page-container">
            <div class="theme-sub-page-header">
                <h2 class="theme-sub-page-title">应用图标</h2>
                <button class="theme-close-sub-page" id="close-phone-theme-icons"><i class="fas fa-times"></i></button>
            </div>
            <div class="theme-sub-page-content">
                <div class="theme-form-group">
                    <label class="theme-form-label">自定义图标</label>
                    <span class="theme-form-hint" style="margin-bottom:12px;">支持桌面图标、Dock 图标和显示名称，修改后会立即同步到查手机主屏。</span>
                    <div class="ios-list-group" id="phone-theme-icon-setting-list" style="background:transparent; box-shadow:none; padding:0;"></div>
                </div>

                <div style="margin-top:24px;">
                    <button class="theme-action-btn" id="phone-theme-reset-icons" style="width:100%; justify-content:center; background:#ffebee; color:#d32f2f;">重置所有自定义图标</button>
                </div>
            </div>
        </div>
    </div>
`;

function phoneThemeEnsureShell() {
    let screen = document.getElementById('phone-theme-app');
    if (!screen) {
        const host = document.getElementById('phone-notes')?.parentNode || document.body;
        screen = document.createElement('div');
        screen.id = 'phone-theme-app';
        screen.className = 'sub-screen hidden';
        host.appendChild(screen);
    }

    screen.style.cssText = `
        z-index: 220;
        background-color: #f5f5f7;
        overflow-y: auto;
        --theme-bg-color: #f5f5f7;
        --theme-surface-color: #ffffff;
        --theme-text-primary: #1d1d1f;
        --theme-text-secondary: #86868b;
        --theme-accent-color: #000000;
        --theme-border-color: rgba(0,0,0,0.08);
        --theme-shadow-sm: 0 4px 20px rgba(0,0,0,0.04);
        --theme-shadow-md: 0 10px 30px rgba(0,0,0,0.08);
        --theme-shadow-hover: 0 20px 40px rgba(0,0,0,0.12);
        --theme-radius-lg: 24px;
        --theme-radius-md: 16px;
        --theme-radius-sm: 10px;
        --theme-transition-bounce: cubic-bezier(0.175, 0.885, 0.32, 1.275);
        --theme-transition-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
        color: #1d1d1f;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
    `;

    if (screen.dataset.templateVersion !== PHONE_THEME_TEMPLATE_VERSION) {
        screen.innerHTML = PHONE_THEME_TEMPLATE_HTML;
        screen.dataset.templateVersion = PHONE_THEME_TEMPLATE_VERSION;
        delete screen.dataset.bound;
    }

    bindPhoneThemeInteractions(screen);
    return screen;
}

function closePhoneThemeApp() {
    const screen = document.getElementById('phone-theme-app');
    if (!screen) return;
    screen.classList.add('hidden');
    const wallpaperScreen = screen.querySelector('#phone-theme-wallpaper-screen');
    const iconsScreen = screen.querySelector('#phone-theme-icons-screen');
    if (wallpaperScreen) wallpaperScreen.classList.add('hidden');
    if (iconsScreen) iconsScreen.classList.add('hidden');
}

function bindPhoneThemeInteractions(screen) {
    if (!screen || screen.dataset.bound === 'true') return;

    const backBtn = screen.querySelector('#phone-theme-back-btn');
    const openWallpaperBtn = screen.querySelector('#open-phone-theme-wallpaper');
    const openIconsBtn = screen.querySelector('#open-phone-theme-icons');
    const wallpaperScreen = screen.querySelector('#phone-theme-wallpaper-screen');
    const iconsScreen = screen.querySelector('#phone-theme-icons-screen');
    const closeWallpaperBtn = screen.querySelector('#close-phone-theme-wallpaper');
    const closeIconsBtn = screen.querySelector('#close-phone-theme-icons');
    const wallpaperUpload = screen.querySelector('#phone-theme-wallpaper-upload');
    const resetWallpaperBtn = screen.querySelector('#phone-theme-reset-wallpaper');
    const resetIconsBtn = screen.querySelector('#phone-theme-reset-icons');

    if (backBtn) backBtn.addEventListener('click', closePhoneThemeApp);
    if (openWallpaperBtn && wallpaperScreen) openWallpaperBtn.addEventListener('click', () => wallpaperScreen.classList.remove('hidden'));
    if (openIconsBtn && iconsScreen) openIconsBtn.addEventListener('click', () => iconsScreen.classList.remove('hidden'));
    if (closeWallpaperBtn && wallpaperScreen) closeWallpaperBtn.addEventListener('click', () => wallpaperScreen.classList.add('hidden'));
    if (closeIconsBtn && iconsScreen) closeIconsBtn.addEventListener('click', () => iconsScreen.classList.add('hidden'));
    if (wallpaperUpload) wallpaperUpload.addEventListener('change', handlePhoneThemeWallpaperUpload);

    if (resetWallpaperBtn) {
        resetWallpaperBtn.addEventListener('click', () => {
            const themeStore = getCurrentPhoneThemeStore();
            themeStore.currentWallpaper = null;
            applyPhoneWallpaper();
            persistPhoneThemeState();
            renderPhoneThemeWallpaperGallery();
        });
    }

    if (resetIconsBtn) {
        resetIconsBtn.addEventListener('click', () => {
            if (!confirm('确定要重置查手机里所有自定义图标吗？')) return;
            const themeStore = getCurrentPhoneThemeStore();
            themeStore.icons = {};
            themeStore.iconColors = {};
            themeStore.appNames = {};
            applyPhoneIcons();
            persistPhoneThemeState();
            renderPhoneThemeIconSettings();
        });
    }

    screen.dataset.bound = 'true';
}

function renderPhoneThemeWallpaperGallery() {
    const gallery = document.getElementById('phone-theme-wallpaper-gallery');
    if (!gallery) return;

    const themeStore = getCurrentPhoneThemeStore();
    gallery.innerHTML = '';

    const defaultItem = document.createElement('div');
    defaultItem.className = `gallery-item ${themeStore.currentWallpaper == null ? 'selected' : ''}`;
    defaultItem.innerHTML = `
        <div style="width:100%; height:100%; display:flex; align-items:flex-end; padding:10px; background:linear-gradient(160deg, #c7ceda 0%, #eef2f7 55%, #f9fbff 100%); color:#1d1d1f; font-size:12px; font-weight:600;">
            默认
        </div>
    `;
    defaultItem.addEventListener('click', () => {
        themeStore.currentWallpaper = null;
        applyPhoneWallpaper();
        persistPhoneThemeState();
        renderPhoneThemeWallpaperGallery();
    });
    gallery.appendChild(defaultItem);

    themeStore.wallpapers.forEach(wallpaper => {
        const item = document.createElement('div');
        item.className = `gallery-item ${themeStore.currentWallpaper === wallpaper.id ? 'selected' : ''}`;
        item.innerHTML = `
            <img src="${wallpaper.data}" alt="Wallpaper">
            <button type="button" class="delete-wp-btn" aria-label="删除壁纸">&times;</button>
        `;

        item.addEventListener('click', (event) => {
            if (event.target.closest('.delete-wp-btn')) {
                event.preventDefault();
                event.stopPropagation();
                const nextWallpapers = themeStore.wallpapers.filter(item => item.id !== wallpaper.id);
                themeStore.wallpapers = nextWallpapers;
                if (themeStore.currentWallpaper === wallpaper.id) {
                    themeStore.currentWallpaper = null;
                    applyPhoneWallpaper();
                }
                persistPhoneThemeState();
                renderPhoneThemeWallpaperGallery();
                return;
            }

            themeStore.currentWallpaper = wallpaper.id;
            applyPhoneWallpaper();
            persistPhoneThemeState();
            renderPhoneThemeWallpaperGallery();
        });

        gallery.appendChild(item);
    });
}

function handlePhoneThemeWallpaperUpload(event) {
    const input = event.target;
    const file = input && input.files ? input.files[0] : null;
    if (!file) return;

    compressImage(file, 1024, 0.7).then(base64 => {
        const themeStore = getCurrentPhoneThemeStore();
        const wallpaper = {
            id: Date.now(),
            data: base64
        };
        themeStore.wallpapers.push(wallpaper);
        themeStore.currentWallpaper = wallpaper.id;
        applyPhoneWallpaper();
        persistPhoneThemeState();
        renderPhoneThemeWallpaperGallery();
    }).catch(error => {
        console.error('查手机壁纸压缩失败', error);
    }).finally(() => {
        if (input) input.value = '';
    });
}

function resetPhoneThemeAppCustomization(appId) {
    const themeStore = getCurrentPhoneThemeStore();
    delete themeStore.icons[appId];
    delete themeStore.iconColors[appId];
    delete themeStore.appNames[appId];
    applyPhoneIcons();
    persistPhoneThemeState();
    renderPhoneThemeIconSettings();
}

function handlePhoneThemeAppNameChange(event, appId) {
    const input = event.target;
    const name = input ? String(input.value || '').trim() : '';
    const themeStore = getCurrentPhoneThemeStore();

    if (name) themeStore.appNames[appId] = name;
    else delete themeStore.appNames[appId];

    applyPhoneIcons();
    persistPhoneThemeState();
    renderPhoneThemeIconSettings();
}

function handlePhoneThemeIconUpload(event, appId) {
    const input = event.target;
    const file = input && input.files ? input.files[0] : null;
    if (!file) return;

    compressImage(file, 300, 0.7).then(base64 => {
        const themeStore = getCurrentPhoneThemeStore();
        themeStore.icons[appId] = base64;
        applyPhoneIcons();
        persistPhoneThemeState();
        renderPhoneThemeIconSettings();
    }).catch(error => {
        console.error('查手机图标压缩失败', error);
    }).finally(() => {
        if (input) input.value = '';
    });
}

function handlePhoneThemeIconColorChange(event, appId) {
    const input = event.target;
    const color = input ? input.value : '';
    const themeStore = getCurrentPhoneThemeStore();

    if (color) themeStore.iconColors[appId] = color;
    else delete themeStore.iconColors[appId];

    const preview = document.getElementById(`phone-theme-preview-${appId}`);
    if (preview) {
        preview.style.backgroundColor = color || '#f2f2f7';
        const icon = preview.querySelector('i');
        if (icon) icon.style.color = color === '#ffffff' || color === '#fff' ? '#000' : '#fff';
    }

    applyPhoneIcons();
    persistPhoneThemeState();
}

function renderPhoneThemeIconSettings() {
    const list = document.getElementById('phone-theme-icon-setting-list');
    if (!list) return;

    const themeStore = getCurrentPhoneThemeStore();
    const apps = getPhoneThemeAppCatalog();
    list.innerHTML = '';

    if (!apps.length) {
        list.innerHTML = '<div class="list-item" style="justify-content:center; color:#8e8e93;">当前没有可美化的应用</div>';
        return;
    }

    apps.forEach(appInfo => {
        const currentIcon = themeStore.icons[appInfo.appId];
        const currentColor = themeStore.iconColors[appInfo.appId] || appInfo.color;
        const currentName = themeStore.appNames[appInfo.appId] || appInfo.name;
        const hasCustomization = !!(themeStore.icons[appInfo.appId] || themeStore.iconColors[appInfo.appId] || themeStore.appNames[appInfo.appId]);
        const safeAppId = phoneFilesEscapeHtml(appInfo.appId);
        const safeCurrentName = phoneFilesEscapeHtml(currentName);
        const safeDefaultName = phoneFilesEscapeHtml(appInfo.name);
        const badgeText = appInfo.dock ? 'Dock 应用' : '桌面应用';

        const item = document.createElement('div');
        item.className = 'list-item';

        const previewContent = currentIcon
            ? `<img src="${currentIcon}" style="width:100%; height:100%; object-fit:cover;">`
            : `<i class="${appInfo.iconClass}" style="color:${currentColor === '#ffffff' || currentColor === '#fff' ? '#000' : '#fff'}"></i>`;

        item.innerHTML = `
            <div class="icon-row">
                <div class="icon-preview-small" id="phone-theme-preview-${safeAppId}" style="background-color:${currentColor};">
                    ${previewContent}
                </div>
                <div class="icon-info" style="display:flex; flex-direction:column; align-items:flex-start; gap:6px;">
                    <input type="text" class="app-name-input" value="${safeCurrentName}" data-id="${safeAppId}" placeholder="${safeDefaultName}" style="border:none; background:transparent; font-size:16px; width:100%; font-weight:500; padding:0;">
                    <div style="font-size:12px; color:#8e8e93;">${badgeText}</div>
                    <div class="color-picker-row" style="display:flex; align-items:center; gap:6px;">
                        <span style="font-size:12px; color:#888;">底色</span>
                        <input type="color" class="color-picker-input" value="${currentColor}" data-id="${safeAppId}" style="width:30px; height:20px; padding:0; border:none; background:none;">
                    </div>
                </div>
                <div class="icon-actions">
                    <input type="file" id="phone-theme-upload-${safeAppId}" accept="image/*" class="file-input-hidden">
                    <label for="phone-theme-upload-${safeAppId}" class="ios-btn">更换</label>
                    ${hasCustomization ? `<button type="button" class="ios-btn-small danger" data-action="reset-app" data-id="${safeAppId}">还原</button>` : ''}
                </div>
            </div>
        `;

        const uploadInput = item.querySelector('input[type="file"]');
        const colorInput = item.querySelector('input[type="color"]');
        const nameInput = item.querySelector('.app-name-input');
        const resetBtn = item.querySelector('[data-action="reset-app"]');

        if (uploadInput) uploadInput.addEventListener('change', (event) => handlePhoneThemeIconUpload(event, appInfo.appId));
        if (colorInput) colorInput.addEventListener('input', (event) => handlePhoneThemeIconColorChange(event, appInfo.appId));
        if (nameInput) nameInput.addEventListener('change', (event) => handlePhoneThemeAppNameChange(event, appInfo.appId));
        if (resetBtn) resetBtn.addEventListener('click', () => resetPhoneThemeAppCustomization(appInfo.appId));

        list.appendChild(item);
    });
}

function openPhoneThemeApp() {
    if (!currentCheckPhoneContactId) return;
    const screen = phoneThemeEnsureShell();
    if (!screen) return;

    renderPhoneThemeWallpaperGallery();
    renderPhoneThemeIconSettings();
    applyPhoneWallpaper();
    screen.scrollTop = 0;
    screen.classList.remove('hidden');
}

// 改进的JSON提取函数
function extractValidJson(content) {
    console.log('开始提取JSON，原始内容长度:', content.length);
    
    // 首先移除markdown代码块标记
    let jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // 移除可能的前后文本说明
    jsonStr = jsonStr.replace(/^[^{\[]*/, '').replace(/[^}\]]*$/, '');
    
    // 尝试找到JSON的开始和结束位置
    const firstBrace = jsonStr.indexOf('{');
    const lastBrace = jsonStr.lastIndexOf('}');
    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');
    
    let extractedJson = '';
    
    // 判断JSON类型：看大括号还是方括号在前面
    let isObject = false;
    let isArray = false;

    if (firstBrace !== -1) {
        if (firstBracket === -1 || firstBrace < firstBracket) {
            isObject = true;
        }
    }
    
    // 如果没有判定为对象，且存在方括号，则判定为数组
    if (!isObject && firstBracket !== -1) {
        isArray = true;
    }

    // 提取对象格式
    if (isObject && lastBrace !== -1 && firstBrace < lastBrace) {
        // 检查是否有嵌套的大括号，确保提取完整的JSON对象
        let braceCount = 0;
        let startPos = firstBrace;
        let endPos = -1;
        
        for (let i = firstBrace; i < jsonStr.length; i++) {
            if (jsonStr[i] === '{') {
                braceCount++;
            } else if (jsonStr[i] === '}') {
                braceCount--;
                if (braceCount === 0) {
                    endPos = i;
                    break;
                }
            }
        }
        
        if (endPos !== -1) {
            extractedJson = jsonStr.substring(startPos, endPos + 1);
        } else {
            extractedJson = jsonStr.substring(firstBrace, lastBrace + 1);
        }
    }
    // 提取数组格式
    else if (isArray && lastBracket !== -1 && firstBracket < lastBracket) {
        // 检查是否有嵌套的方括号，确保提取完整的JSON数组
        let bracketCount = 0;
        let startPos = firstBracket;
        let endPos = -1;
        
        for (let i = firstBracket; i < jsonStr.length; i++) {
            if (jsonStr[i] === '[') {
                bracketCount++;
            } else if (jsonStr[i] === ']') {
                bracketCount--;
                if (bracketCount === 0) {
                    endPos = i;
                    break;
                }
            }
        }
        
        if (endPos !== -1) {
            extractedJson = jsonStr.substring(startPos, endPos + 1);
        } else {
            extractedJson = jsonStr.substring(firstBracket, lastBracket + 1);
        }
    }
    
    // 清理可能的多余字符和控制字符
    extractedJson = extractedJson
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
        .replace(/\r\n/g, '\n') // 统一换行符
        .trim();
    
    console.log('提取的JSON长度:', extractedJson.length);
    console.log('JSON前100字符:', extractedJson.substring(0, 100));
    
    return extractedJson;
}

// 改进的JSON解析函数，带有多重修复策略
function parseJsonWithFallback(jsonStr) {
    console.log('尝试解析JSON，长度:', jsonStr.length);
    
    // 第一次尝试：直接解析
    try {
        const result = JSON.parse(jsonStr);
        console.log('JSON解析成功 - 直接解析');
        return result;
    } catch (e) {
        console.warn('直接解析失败:', e.message);
    }
    
    // 第二次尝试：修复常见的JSON格式问题
    try {
        let fixedJson = jsonStr
            // 修复未加引号的键
            .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
            // 修复未加引号的字符串值（但不影响数字、布尔值、null）
            .replace(/:\s*([a-zA-Z_$][a-zA-Z0-9_$\s]*?)(?=\s*[,}\]])/g, (match, value) => {
                const trimmedValue = value.trim();
                if (trimmedValue === 'true' || trimmedValue === 'false' ||
                    trimmedValue === 'null' || /^\d+(\.\d+)?$/.test(trimmedValue)) {
                    return ': ' + trimmedValue;
                }
                return ': "' + trimmedValue + '"';
            })
            // 移除多余的逗号
            .replace(/,(\s*[}\]])/g, '$1')
            // 移除注释
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\/\/.*$/gm, '');
        
        const result = JSON.parse(fixedJson);
        console.log('JSON解析成功 - 修复后解析');
        return result;
    } catch (e) {
        console.warn('修复后解析失败:', e.message);
    }
    
    // 第三次尝试：更激进的修复
    try {
        let aggressiveFixed = jsonStr
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除所有控制字符
            .replace(/\n/g, ' ') // 移除换行符
            .replace(/\s+/g, ' ') // 压缩空格
            .replace(/,(\s*[}\]])/g, '$1') // 移除多余逗号
            .trim();
        
        const result = JSON.parse(aggressiveFixed);
        console.log('JSON解析成功 - 激进修复后解析');
        return result;
    } catch (e) {
        console.error('所有JSON修复尝试都失败了:', e.message);
        console.error('最终JSON字符串:', jsonStr);
        throw new Error(`JSON解析失败: ${e.message}。请检查AI返回的内容格式是否正确。`);
    }
}

// --- 辅助函数：生成本地头像和图片 ---
window.getSmartAvatar = function(name) {
    const initial = (name || 'U').charAt(0).toUpperCase();
    const colors = [
        ['#FF9A9E', '#FECFEF'], ['#a18cd1', '#fbc2eb'], ['#84fab0', '#8fd3f4'],
        ['#cfd9df', '#e2ebf0'], ['#fccb90', '#d57eeb'], ['#e0c3fc', '#8ec5fc']
    ];
    const colorPair = colors[(name ? name.length : 0) % colors.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colorPair[0]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colorPair[1]};stop-opacity:1" />
        </linearGradient></defs>
        <rect width="100" height="100" fill="url(#grad)"/>
        <text x="50" y="55" text-anchor="middle" fill="white" font-size="45" font-family="sans-serif" font-weight="bold">${initial}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
};
// 兼容旧调用
function getSmartAvatar(name) { return window.getSmartAvatar(name); }

window.getSmartImage = function(text) {
    // 根据文本生成随机渐变色
    const str = text || 'Image';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 60) % 360; // 增加色彩对比度
    
    // 根据文本内容选择更合适的颜色主题
    const lowerText = str.toLowerCase();
    let colorScheme = { hue1, hue2, saturation: 70, lightness: 75 };
    
    if (lowerText.includes('sunset') || lowerText.includes('日落')) {
        colorScheme = { hue1: 25, hue2: 45, saturation: 85, lightness: 70 };
    } else if (lowerText.includes('ocean') || lowerText.includes('sea') || lowerText.includes('海')) {
        colorScheme = { hue1: 200, hue2: 240, saturation: 80, lightness: 70 };
    } else if (lowerText.includes('forest') || lowerText.includes('tree') || lowerText.includes('森林')) {
        colorScheme = { hue1: 100, hue2: 130, saturation: 75, lightness: 65 };
    } else if (lowerText.includes('food') || lowerText.includes('美食') || lowerText.includes('burger')) {
        colorScheme = { hue1: 30, hue2: 50, saturation: 80, lightness: 70 };
    } else if (lowerText.includes('cat') || lowerText.includes('dog') || lowerText.includes('宠物')) {
        colorScheme = { hue1: 280, hue2: 320, saturation: 60, lightness: 80 };
    }
    
    // 添加简单的图标元素
    let iconSvg = '';
    if (lowerText.includes('cat') || lowerText.includes('猫')) {
        iconSvg = `<circle cx="180" cy="120" r="8" fill="rgba(255,255,255,0.8)"/>
                   <circle cx="220" cy="120" r="8" fill="rgba(255,255,255,0.8)"/>
                   <path d="M190 140 Q200 150 210 140" stroke="rgba(255,255,255,0.8)" stroke-width="2" fill="none"/>`;
    } else if (lowerText.includes('sun') || lowerText.includes('日落')) {
        iconSvg = `<circle cx="200" cy="100" r="25" fill="rgba(255,255,255,0.6)"/>
                   <path d="M200 60 L200 80 M200 120 L200 140 M160 100 L180 100 M220 100 L240 100 M170 70 L180 80 M220 80 L230 70 M170 130 L180 120 M220 120 L230 130" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>`;
    } else if (lowerText.includes('heart') || lowerText.includes('?')) {
        iconSvg = `<path d="M200 120 C190 110, 170 110, 170 130 C170 150, 200 170, 200 170 C200 170, 230 150, 230 130 C230 110, 210 110, 200 120 Z" fill="rgba(255,255,255,0.7)"/>`;
    }
    
    // 智能文本换行与截断
    let textSvg = '';
    const MAX_LINE_CHARS = 10; // 每行最大字符数
    
    if (str.length <= MAX_LINE_CHARS) {
        // 单行情况
        textSvg = `<text x="50%" y="75%" dy=".3em" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="24" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-weight="500" style="text-shadow: 0 2px 8px rgba(0,0,0,0.3);">${str}</text>`;
    } else {
        // 多行情况
        let line1 = str.substring(0, MAX_LINE_CHARS);
        let line2 = str.substring(MAX_LINE_CHARS);
        
        if (line2.length > MAX_LINE_CHARS) {
            line2 = line2.substring(0, MAX_LINE_CHARS - 1) + '...';
        }
        
        textSvg = `<text x="50%" y="70%" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="20" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-weight="500" style="text-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            <tspan x="50%" dy="0">${line1}</tspan>
            <tspan x="50%" dy="1.2em">${line2}</tspan>
        </text>`;
    }
    
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <defs>
            <linearGradient id="grad${hash}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:hsl(${colorScheme.hue1}, ${colorScheme.saturation}%, ${colorScheme.lightness}%);stop-opacity:1" />
                <stop offset="50%" style="stop-color:hsl(${(colorScheme.hue1 + colorScheme.hue2) / 2}, ${colorScheme.saturation - 10}%, ${colorScheme.lightness + 5}%);stop-opacity:1" />
                <stop offset="100%" style="stop-color:hsl(${colorScheme.hue2}, ${colorScheme.saturation}%, ${colorScheme.lightness}%);stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="400" height="300" fill="url(#grad${hash})"/>
        ${iconSvg}
        ${textSvg}
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
};
function getSmartImage(text) { return window.getSmartImage(text); }

// --- 初始化 ---

function initPhoneGrid() {
    phonePagesWrapper = document.getElementById('phone-pages-wrapper');
    phonePagesContainer = document.getElementById('phone-pages-container');
    phonePageIndicators = document.getElementById('phone-page-indicators');
    phoneLibraryModal = document.getElementById('phone-widget-library-modal');
    ensurePhoneDockShell();

    // 初始化全局状态
    if (!window.iphoneSimState.phoneLayouts) window.iphoneSimState.phoneLayouts = {};
    if (!window.iphoneSimState.phoneContent) window.iphoneSimState.phoneContent = {};

    // 绑定按钮事件
    setupPhoneListeners();

    // 注入查手机专用样式，修复底部空隙问题
    const style = document.createElement('style');
    style.innerHTML = `
        /* 查手机-微信 悬浮Dock栏适配 */
        #phone-wechat .wechat-tab-bar {
            position: absolute !important;
            width: auto !important;
            min-width: 220px !important;
            height: 64px !important;
            min-height: 0 !important;
            left: 50% !important;
            right: auto !important;
            bottom: max(30px, env(safe-area-inset-bottom)) !important;
            transform: translateX(-50%) !important;
            
            border-radius: 32px !important;
            margin: 0 !important;
            padding: 0 20px !important;
            
            background-color: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border-top: none !important;
            box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
            
            align-items: center !important;
            justify-content: space-around !important;
            z-index: 999 !important;
        }

        /* 调整图标位置 - 恢复居中 */
        #phone-wechat .wechat-tab-item {
            justify-content: center !important;
            align-items: center !important;
            margin-top: 0 !important;
            flex: 1 !important;
            height: 100% !important;
            color: #b0b0b0 !important;
        }
        
        #phone-wechat .wechat-tab-item.active {
            color: #007AFF !important;
        }
        
        /* 查手机-微信背景色调整 (灰底) */
        #phone-wechat {
            background-color: #f2f2f7 !important;
        }
        
        /* 隐藏微信原生标题栏背景，使其透明 */
        #phone-wechat-header {
            background-color: transparent !important;
            border-bottom: none !important;
        }
        
        /* 查手机-联系人选择弹窗半屏高度优化 */
        #phone-contact-select-modal .modal-content {
            min-height: 60vh !important;
            padding-bottom: max(20px, env(safe-area-inset-bottom)) !important;
        }

        /* 查手机-主屏幕高度适配 */
        #phone-pages-container {
            height: 100% !important;
            padding-bottom: env(safe-area-inset-bottom) !important;
        }

        /* 查手机-主屏幕图标下移 */
        #phone-app .home-screen-grid {
            padding-top: 92px !important;
            padding-bottom: 170px !important;
        }

        #phone-app .dock-bar {
            z-index: 120 !important;
            bottom: max(34px, env(safe-area-inset-bottom)) !important;
        }

        #phone-app .dock-container {
            max-width: 340px !important;
        }

        #phone-app .phone-dock-item .app-icon {
            overflow: hidden !important;
        }

        /* 强制修复查手机页面布局 (覆盖所有潜在偏移) */
        #phone-app {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            bottom: 0 !important;
            z-index: 200 !important;
            background-color: #f2f2f7 !important;
            transform: none !important; /* 防止位移 */
            margin: 0 !important;
        }

        /* 修复顶部过高问题 (增加内边距) */
        #phone-app .app-header {
            padding-top: max(50px, env(safe-area-inset-top)) !important;
            height: auto !important;
            min-height: 90px !important;
        }

        /* 修复查手机内App底部漏出问题 - 其他应用 (白底) */
        #phone-weibo, #phone-icity, #phone-browser, #phone-notes, #phone-files, #phone-health, #phone-delivery {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            height: 100vh !important; /* 强制使用 vh */
            bottom: 0 !important;
            z-index: 210 !important;
            background-color: #fff !important; /* 强制背景色，防止透出 */
            overflow: hidden !important;
        }

        #phone-parcel {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            height: 100vh !important;
            bottom: 0 !important;
            z-index: 210 !important;
            background-color: #eef2f5 !important;
            overflow: hidden !important;
        }

        /* 闲鱼 (灰底) */
        #phone-xianyu {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            height: 100vh !important; /* 强制使用 vh */
            bottom: 0 !important;
            z-index: 210 !important;
            background-color: #f6f6f6 !important; /* 灰底 */
            overflow: hidden !important;
        }

        /* 修复查手机内App底部漏出问题 - 微信 (灰底) */
        #phone-wechat {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            height: 100vh !important; /* 强制使用 vh */
            bottom: 0 !important;
            z-index: 210 !important;
            background-color: #f2f2f7 !important; /* 灰底，适配圆角卡片 */
            overflow: hidden !important;
        }
        
        #phone-contact-select-modal {
            z-index: 220 !important;
        }
    `;
    document.head.appendChild(style);

    // 覆盖全局 handleAppClick 以拦截查手机应用
    if (window.handleAppClick) {
        const originalHandleAppClick = window.handleAppClick;
        window.handleAppClick = function(appId, appName) {
            if (appId === 'phone-app') {
                openPhoneCheckContactModal();
            } else if (appId === 'phone-wechat') {
                document.getElementById('phone-wechat').classList.remove('hidden');
                // 初始化 Tab 和按钮状态
                window.switchPhoneWechatTab('contacts');
                
                // 打开微信时，如果有缓存数据，自动渲染
                if (currentCheckPhoneContactId) {
                    if (window.iphoneSimState.phoneContent && window.iphoneSimState.phoneContent[currentCheckPhoneContactId]) {
                        // 渲染两个页面
                        renderPhoneWechatContacts(currentCheckPhoneContactId);
                        renderPhoneWechatMoments(currentCheckPhoneContactId);
                    }
                }
            } else if (appId === 'phone-notes') {
                openPhoneNotesApp();
            } else if (appId === 'phone-delivery') {
                openPhoneDeliveryApp();
            } else if (appId === 'phone-parcel') {
                openPhoneParcelApp();
            } else if (appId === 'phone-files') {
                openPhoneFilesApp();
            } else if (appId === 'phone-theme') {
                openPhoneThemeApp();
            } else if (appId === 'phone-messages') {
                if (window.PhoneMessagesApp && typeof window.PhoneMessagesApp.open === 'function') {
                    window.PhoneMessagesApp.open(currentCheckPhoneContactId);
                } else {
                    const phoneMessagesScreen = document.getElementById('phone-messages');
                    if (phoneMessagesScreen) phoneMessagesScreen.classList.remove('hidden');
                }
            } else if (appId === 'phone-health') {
                if (window.openPhoneHealthApp) window.openPhoneHealthApp(currentCheckPhoneContactId);
            } else if (appId === 'phone-browser') {
                document.getElementById('phone-browser').classList.remove('hidden');
                if (currentCheckPhoneContactId) {
                    if (window.renderPhoneBrowser) window.renderPhoneBrowser(currentCheckPhoneContactId);
                    if (window.renderBrowserSearchRecords) window.renderBrowserSearchRecords(currentCheckPhoneContactId);
                    if (window.renderBrowserBookmarks) window.renderBrowserBookmarks(currentCheckPhoneContactId);
                    if (window.renderBrowserDownloads) window.renderBrowserDownloads(currentCheckPhoneContactId);
                    if (window.renderBrowserShare) window.renderBrowserShare(currentCheckPhoneContactId);
                }
            } else if (appId === 'phone-xianyu') {
                document.getElementById('phone-xianyu').classList.remove('hidden');
                window.switchXianyuTab('messages'); // Default to messages to show the list
            } else {
                originalHandleAppClick(appId, appName);
            }
        };
    }
}

function openPhoneCheckContactModal() {
    const modal = document.getElementById('phone-contact-select-modal');
    if (modal) {
        renderPhoneContactList();
        modal.classList.remove('hidden');
    }
}

// 处理查手机-微信朋友圈背景上传

const PHONE_NOTES_V1_STYLE_TEXT = ":root {\n            --bg-color: #f2f2f7;\n            --card-bg: #ffffff;\n            --text-main: #000000;\n            --text-secondary: #8a8a8e;\n            --accent: #d0a331; /* iOS Notes classic yellow/gold */\n            --divider: rgba(60, 60, 67, 0.1);\n            --safe-area-top: 44px;\n        }\n\n        * {\n            box-sizing: border-box;\n            margin: 0;\n            padding: 0;\n            -webkit-tap-highlight-color: transparent;\n        }\n\n        body {\n            font-family: -apple-system, BlinkMacSystemFont, \"SF Pro Text\", \"Helvetica Neue\", Arial, sans-serif;\n            background-color: var(--bg-color);\n            color: var(--text-main);\n            overflow: hidden;\n            user-select: none;\n        }\n\n        #app {\n            position: relative;\n            width: 100vw;\n            height: 100vh;\n            overflow: hidden;\n            perspective: 1000px;\n        }\n\n        .page {\n            position: absolute;\n            top: 0;\n            left: 0;\n            width: 100%;\n            height: 100%;\n            background-color: var(--bg-color);\n            transition: transform 0.4s cubic-bezier(0.36, 0.66, 0.04, 1), opacity 0.4s ease;\n            overflow-y: auto;\n            overflow-x: hidden;\n            padding-top: var(--safe-area-top);\n        }\n\n        /* Page Transitions */\n        #main-page {\n            z-index: 1;\n            transform: translateX(0);\n        }\n        #main-page.nav-out {\n            transform: translateX(-30%);\n            opacity: 0;\n        }\n\n        #detail-page {\n            z-index: 2;\n            transform: translateX(100%);\n            background-color: var(--bg-color);\n            box-shadow: -5px 0 15px rgba(0,0,0,0.05);\n        }\n        #detail-page.nav-in {\n            transform: translateX(0);\n        }\n\n        /* Header */\n        header {\n            padding: 10px 20px;\n            display: flex;\n            justify-content: space-between;\n            align-items: flex-end;\n            margin-bottom: 20px;\n        }\n\n        .header-title {\n            font-size: 34px;\n            font-weight: 700;\n            letter-spacing: -0.5px;\n        }\n\n        .header-subtitle {\n            font-size: 12px;\n            color: var(--text-secondary);\n            text-transform: uppercase;\n            letter-spacing: 1px;\n            margin-top: 4px;\n        }\n\n        .header-actions i {\n            font-size: 24px;\n            color: var(--accent);\n            cursor: pointer;\n            transition: opacity 0.2s;\n        }\n        .header-actions i:active {\n            opacity: 0.5;\n        }\n\n        /* Search Bar */\n        .search-container {\n            padding: 0 20px;\n            margin-bottom: 24px;\n        }\n        .search-bar {\n            background-color: rgba(118, 118, 128, 0.12);\n            border-radius: 10px;\n            padding: 8px 12px;\n            display: flex;\n            align-items: center;\n            gap: 8px;\n            transition: transform 0.2s;\n        }\n        .search-bar i {\n            color: var(--text-secondary);\n            font-size: 18px;\n        }\n        .search-bar input {\n            border: none;\n            background: transparent;\n            font-size: 17px;\n            width: 100%;\n            outline: none;\n            color: var(--text-main);\n        }\n        .search-bar input::placeholder {\n            color: var(--text-secondary);\n        }\n\n        /* Folders */\n        .folder-group {\n            background-color: var(--card-bg);\n            border-radius: 12px;\n            margin: 0 20px 24px;\n            overflow: hidden;\n        }\n\n        .folder-item {\n            display: flex;\n            align-items: center;\n            padding: 12px 16px;\n            background-color: var(--card-bg);\n            transition: background-color 0.2s;\n            cursor: pointer;\n            position: relative;\n        }\n\n        .folder-item:active {\n            background-color: rgba(0,0,0,0.05);\n        }\n\n        .folder-item:not(:last-child)::after {\n            content: '';\n            position: absolute;\n            bottom: 0;\n            left: 52px;\n            right: 0;\n            height: 1px;\n            background-color: var(--divider);\n        }\n\n        .folder-icon {\n            width: 30px;\n            height: 30px;\n            border-radius: 8px;\n            display: flex;\n            justify-content: center;\n            align-items: center;\n            margin-right: 14px;\n            font-size: 18px;\n            color: #fff;\n        }\n\n        .icon-pinned { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%); }\n        .icon-locked { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }\n        .icon-todo { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); color: #fff; }\n        .icon-drafts { background: linear-gradient(135deg, #fccb90 0%, #d57eeb 100%); }\n        .icon-ramblings { background: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%); color: #fff;}\n        .icon-deleted { background: var(--text-secondary); }\n\n        .folder-info {\n            flex: 1;\n        }\n\n        .folder-name {\n            font-size: 17px;\n            font-weight: 500;\n        }\n        .folder-en {\n            font-size: 11px;\n            color: var(--text-secondary);\n            margin-top: 2px;\n            letter-spacing: 0.5px;\n        }\n\n        .folder-count {\n            font-size: 16px;\n            color: var(--text-secondary);\n            margin-right: 8px;\n        }\n\n        .folder-arrow {\n            color: #c7c7cc;\n            font-size: 20px;\n        }\n\n        /* Detail Page */\n        .detail-header {\n            display: flex;\n            align-items: center;\n            padding: 10px 20px;\n            justify-content: space-between;\n            background: rgba(242, 242, 247, 0.8);\n            backdrop-filter: blur(20px);\n            -webkit-backdrop-filter: blur(20px);\n            position: sticky;\n            top: 0;\n            z-index: 10;\n            border-bottom: 1px solid var(--divider);\n        }\n\n        .back-btn {\n            color: var(--accent);\n            display: flex;\n            align-items: center;\n            font-size: 17px;\n            cursor: pointer;\n            transition: opacity 0.2s;\n        }\n        .back-btn i {\n            font-size: 24px;\n            margin-right: -4px;\n        }\n        .back-btn:active {\n            opacity: 0.5;\n        }\n\n        .detail-title {\n            font-size: 30px;\n            font-weight: 700;\n            padding: 20px;\n            margin-top: 10px;\n        }\n        .detail-subtitle {\n            font-size: 13px;\n            color: var(--text-secondary);\n            padding: 0 20px;\n            margin-top: -10px;\n            margin-bottom: 20px;\n            text-transform: uppercase;\n            letter-spacing: 1px;\n        }\n\n        .notes-list {\n            padding: 0 20px;\n        }\n\n        .note-card {\n            background-color: var(--card-bg);\n            border-radius: 12px;\n            padding: 16px;\n            margin-bottom: 16px;\n            box-shadow: 0 2px 8px rgba(0,0,0,0.02);\n            transition: transform 0.2s, box-shadow 0.2s;\n            cursor: pointer;\n        }\n        .note-card:active {\n            transform: scale(0.97);\n            box-shadow: 0 1px 4px rgba(0,0,0,0.02);\n        }\n\n        .note-title {\n            font-size: 17px;\n            font-weight: 600;\n            margin-bottom: 6px;\n            white-space: nowrap;\n            overflow: hidden;\n            text-overflow: ellipsis;\n        }\n        \n        .note-preview {\n            font-size: 15px;\n            color: var(--text-secondary);\n            display: -webkit-box;\n            -webkit-line-clamp: 2;\n            -webkit-box-orient: vertical;\n            overflow: hidden;\n            line-height: 1.4;\n        }\n\n        .note-meta {\n            display: flex;\n            justify-content: space-between;\n            align-items: center;\n            margin-top: 12px;\n            font-size: 12px;\n            color: #aeaeb2;\n        }\n\n        /* Float Add Button */\n        .fab {\n            position: fixed;\n            bottom: 30px;\n            right: 30px;\n            width: 50px;\n            height: 50px;\n            border-radius: 25px;\n            background-color: var(--accent);\n            color: white;\n            display: flex;\n            justify-content: center;\n            align-items: center;\n            font-size: 24px;\n            box-shadow: 0 4px 12px rgba(208, 163, 49, 0.4);\n            cursor: pointer;\n            transition: transform 0.2s;\n            z-index: 100;\n        }\n        .fab:active {\n            transform: scale(0.9);\n        }\n\n        /* Glass Decoration */\n        .glass-blob {\n            position: absolute;\n            width: 200px;\n            height: 200px;\n            border-radius: 50%;\n            background: linear-gradient(135deg, rgba(208,163,49,0.1), rgba(255,255,255,0));\n            top: -50px;\n            right: -50px;\n            filter: blur(30px);\n            z-index: 0;\n            pointer-events: none;\n        }\n\n@keyframes slideUp {\n        to {\n            opacity: 1;\n            transform: translateY(0);\n        }\n    }";

const PHONE_NOTES_V1_TEMPLATE_HTML = "<div id=\"app\">\n    <!-- Main Page -->\n    <div id=\"main-page\" class=\"page active\">\n        <div class=\"glass-blob\"></div>\n        <header>\n            <div>\n                <div class=\"header-title\">备忘录</div>\n                <div class=\"header-subtitle\">iCloud Notes</div>\n            </div>\n            <div class=\"header-actions\">\n                <i class=\"ri-more-2-fill\"></i>\n            </div>\n        </header>\n\n        <div class=\"search-container\">\n            <div class=\"search-bar\">\n                <i class=\"ri-search-line\"></i>\n                <input type=\"text\" placeholder=\"搜索 / Search\">\n            </div>\n        </div>\n\n        <div class=\"folder-group\">\n            <div class=\"folder-item\" onclick=\"openFolder('Pinned', '置顶便签')\">\n                <div class=\"folder-icon icon-pinned\"><i class=\"ri-pushpin-2-fill\"></i></div>\n                <div class=\"folder-info\">\n                    <div class=\"folder-name\">置顶便签</div>\n                    <div class=\"folder-en\">PINNED NOTES</div>\n                </div>\n                <div class=\"folder-count\">3</div>\n                <i class=\"ri-arrow-right-s-line folder-arrow\"></i>\n            </div>\n            <div class=\"folder-item\" onclick=\"openFolder('Locked', '锁定笔记')\">\n                <div class=\"folder-icon icon-locked\"><i class=\"ri-lock-2-fill\"></i></div>\n                <div class=\"folder-info\">\n                    <div class=\"folder-name\">锁定笔记</div>\n                    <div class=\"folder-en\">LOCKED</div>\n                </div>\n                <div class=\"folder-count\">1</div>\n                <i class=\"ri-arrow-right-s-line folder-arrow\"></i>\n            </div>\n            <div class=\"folder-item\" onclick=\"openFolder('Tasks', '待办清单')\">\n                <div class=\"folder-icon icon-todo\"><i class=\"ri-checkbox-circle-fill\"></i></div>\n                <div class=\"folder-info\">\n                    <div class=\"folder-name\">待办清单</div>\n                    <div class=\"folder-en\">TO-DO LIST</div>\n                </div>\n                <div class=\"folder-count\">5</div>\n                <i class=\"ri-arrow-right-s-line folder-arrow\"></i>\n            </div>\n        </div>\n\n        <div class=\"folder-group\">\n            <div class=\"folder-item\" onclick=\"openFolder('Drafts', '草稿')\">\n                <div class=\"folder-icon icon-drafts\"><i class=\"ri-draft-fill\"></i></div>\n                <div class=\"folder-info\">\n                    <div class=\"folder-name\">草稿</div>\n                    <div class=\"folder-en\">DRAFTS</div>\n                </div>\n                <div class=\"folder-count\">12</div>\n                <i class=\"ri-arrow-right-s-line folder-arrow\"></i>\n            </div>\n            <div class=\"folder-item\" onclick=\"openFolder('Ramblings', '碎碎念')\">\n                <div class=\"folder-icon icon-ramblings\"><i class=\"ri-bubble-chart-fill\"></i></div>\n                <div class=\"folder-info\">\n                    <div class=\"folder-name\">碎碎念</div>\n                    <div class=\"folder-en\">RAMBLINGS</div>\n                </div>\n                <div class=\"folder-count\">42</div>\n                <i class=\"ri-arrow-right-s-line folder-arrow\"></i>\n            </div>\n        </div>\n\n        <div class=\"folder-group\">\n            <div class=\"folder-item\" onclick=\"openFolder('Deleted', '已删除')\">\n                <div class=\"folder-icon icon-deleted\"><i class=\"ri-delete-bin-7-fill\"></i></div>\n                <div class=\"folder-info\">\n                    <div class=\"folder-name\">已删除</div>\n                    <div class=\"folder-en\">RECENTLY DELETED</div>\n                </div>\n                <div class=\"folder-count\">8</div>\n                <i class=\"ri-arrow-right-s-line folder-arrow\"></i>\n            </div>\n        </div>\n        \n        <div class=\"fab\">\n            <i class=\"ri-add-line\"></i>\n        </div>\n    </div>\n\n    <!-- Detail Page -->\n    <div id=\"detail-page\" class=\"page\">\n        <div class=\"detail-header\">\n            <div class=\"back-btn\" onclick=\"goBack()\">\n                <i class=\"ri-arrow-left-s-line\"></i>\n                <span>文件夹</span>\n            </div>\n            <i class=\"ri-more-2-fill\" style=\"color: var(--accent); font-size: 24px;\"></i>\n        </div>\n        \n        <div class=\"detail-title\" id=\"dt-title\">文件夹</div>\n        <div class=\"detail-subtitle\" id=\"dt-subtitle\">FOLDER</div>\n\n        <div class=\"notes-list\" id=\"notes-container\">\n            <!-- Notes injected via JS -->\n        </div>\n\n        <div class=\"fab\">\n            <i class=\"ri-edit-box-line\"></i>\n        </div>\n    </div>\n</div>";

const PHONE_NOTES_V1_DUMMY_DATA = [
        { title: "Design Inspiration", preview: "Minimalist interfaces, clean typography, frosted glass effects, subtle shadows...", date: "10:42 AM", tag: "Design" },
        { title: "Meeting Notes", preview: "Discussed the new UI architecture. Need to refactor the navigation flow.", date: "Yesterday", tag: "Work" },
        { title: "Grocery List", preview: "Milk, Eggs, Bread, Avocados, Coffee beans (light roast)", date: "Sunday", tag: "Life" },
        { title: "Random Thoughts", preview: "The sky was exceptionally clear today. I wonder if it will rain tomorrow...", date: "Oct 12", tag: "Personal" }
    ];

function prefixPhoneNotesV1Selectors(selectorText) {
    return selectorText
        .split(',')
        .map(selector => {
            const value = selector.trim();
            if (!value) return '';
            if (value === ':root' || value === 'html') return '#phone-notes';
            if (value === 'body') return '#phone-notes-content';
            if (value === '*') return '#phone-notes-content, #phone-notes-content *';
            if (value.startsWith('body ')) return `#phone-notes-content ${value.slice(5)}`;
            return `#phone-notes-content ${value}`;
        })
        .filter(Boolean)
        .join(', ');
}

function buildScopedPhoneNotesV1Css(styleText) {
    const css = String(styleText || '');
    const keyframes = [];
    const keyframePattern = /@keyframes[\s\S]*?\}\s*\}/g;
    const baseCss = css.replace(keyframePattern, match => {
        keyframes.push(match.trim());
        return '';
    });

    const scopedRules = [];
    const rulePattern = /([^{}]+)\{([^{}]*)\}/g;
    let match = null;
    while ((match = rulePattern.exec(baseCss)) !== null) {
        const selectorText = match[1].trim();
        const declarationText = match[2].trim();
        if (!selectorText || !declarationText) continue;

        const scopedSelector = prefixPhoneNotesV1Selectors(selectorText);
        if (!scopedSelector) continue;
        scopedRules.push(`${scopedSelector} {
${declarationText}
}`);
    }

    return [...keyframes, ...scopedRules].join('\n\n');
}

function ensurePhoneNotesV1Styles() {
    let styleEl = document.getElementById('phone-notes-v1-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'phone-notes-v1-style';
        document.head.appendChild(styleEl);
    }

    const scopedCss = buildScopedPhoneNotesV1Css(PHONE_NOTES_V1_STYLE_TEXT);
    if (styleEl.textContent !== scopedCss) {
        styleEl.textContent = scopedCss;
    }
}

function renderPhoneNotesV1FolderDetail(container, enTitle, cnTitle) {
    const notesContainer = container.querySelector('#notes-container');
    const dtTitle = container.querySelector('#dt-title');
    const dtSubtitle = container.querySelector('#dt-subtitle');
    if (!notesContainer || !dtTitle || !dtSubtitle) return;

    dtTitle.textContent = cnTitle || 'Folder';
    dtSubtitle.textContent = (enTitle || 'Folder').toUpperCase();
    notesContainer.innerHTML = '';

    PHONE_NOTES_V1_DUMMY_DATA.forEach((note, index) => {
        const delay = index * 0.05;
        const card = document.createElement('div');
        card.className = 'note-card';
        card.style.animation = `slideUp 0.4s ease forwards ${delay}s`;
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.innerHTML = `
            <div class="note-title">${note.title}</div>
            <div class="note-preview">${note.preview}</div>
            <div class="note-meta">
                <span>${note.date}</span>
                <span><i class="ri-price-tag-3-line"></i> ${note.tag}</span>
            </div>
        `;
        notesContainer.appendChild(card);
    });
}

function bindPhoneNotesV1Interactions(container) {
    if (!container || container.dataset.notesBound === 'true') return;

    const screen = document.getElementById('phone-notes');
    const mainPage = container.querySelector('#main-page');
    const detailPage = container.querySelector('#detail-page');
    const detailBackBtn = detailPage ? detailPage.querySelector('.back-btn') : null;
    const headerTitle = container.querySelector('.header-title');
    const headerActionIcon = container.querySelector('.header-actions i');
    const detailActionIcon = detailPage ? detailPage.querySelector('.detail-header > i') : null;
    const folderItems = Array.from(container.querySelectorAll('.folder-item'));

    container.querySelectorAll('[onclick]').forEach(node => node.removeAttribute('onclick'));

    const attachTapAnimation = el => {
        if (!el || el.dataset.tapBound === 'true') return;
        el.dataset.tapBound = 'true';
        el.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    };

    const closeScreen = () => {
        if (screen) screen.classList.add('hidden');
    };

    const goBack = () => {
        if (mainPage) mainPage.classList.remove('nav-out');
        if (detailPage) detailPage.classList.remove('nav-in');
        if (mainPage) mainPage.scrollTop = 0;
        if (detailPage) detailPage.scrollTop = 0;
    };

    const handleGenerate = event => {
        event.preventDefault();
        event.stopPropagation();
        console.log('Phone notes generate button clicked');
    };

    const setupGenerateButton = button => {
        if (!button) return;
        button.className = 'ri-more-fill';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Generate');
        button.style.cursor = 'pointer';
        attachTapAnimation(button);
        button.addEventListener('click', handleGenerate);
    };

    folderItems.forEach(item => {
        attachTapAnimation(item);
        item.addEventListener('click', () => {
            const cnTitle = item.querySelector('.folder-name')?.textContent?.trim() || 'Folder';
            const enTitle = item.querySelector('.folder-en')?.textContent?.trim() || 'Folder';
            renderPhoneNotesV1FolderDetail(container, enTitle, cnTitle);
            if (mainPage) mainPage.classList.add('nav-out');
            if (detailPage) detailPage.classList.add('nav-in');
            if (detailPage) detailPage.scrollTop = 0;
        });
    });

    if (headerTitle) {
        headerTitle.style.cursor = 'pointer';
        headerTitle.setAttribute('role', 'button');
        headerTitle.setAttribute('title', 'Exit Notes');
        headerTitle.addEventListener('click', closeScreen);
    }

    if (detailBackBtn) {
        attachTapAnimation(detailBackBtn);
        detailBackBtn.addEventListener('click', event => {
            event.preventDefault();
            goBack();
        });
    }

    setupGenerateButton(headerActionIcon);
    setupGenerateButton(detailActionIcon);
    container.querySelectorAll('.fab').forEach(attachTapAnimation);

    container.__resetPhoneNotesView = goBack;
    container.dataset.notesBound = 'true';
}

function ensurePhoneNotesV1Content() {
    const container = document.getElementById('phone-notes-content');
    if (!container) return null;

    container.style.overflow = 'hidden';
    container.style.background = '#f2f2f7';
    container.style.height = '100%';

    if (container.dataset.notesTemplateReady !== 'true') {
        container.innerHTML = PHONE_NOTES_V1_TEMPLATE_HTML;
        container.dataset.notesTemplateReady = 'true';
    }

    bindPhoneNotesV1Interactions(container);
    if (typeof container.__resetPhoneNotesView === 'function') {
        container.__resetPhoneNotesView();
    }
    return container;
}

function openPhoneNotesApp() {
    const screen = document.getElementById('phone-notes');
    const content = ensurePhoneNotesV1Content();
    if (!screen || !content) return;

    ensurePhoneNotesV1Styles();
    content.scrollTop = 0;
    screen.classList.remove('hidden');
}

const PHONE_DELIVERY_PAGE_META = {
    home: { title: 'Delivery', subtitle: 'Current Status' },
    discover: { title: 'Discover', subtitle: 'Explore Shops' },
    orders: { title: 'Orders', subtitle: 'Recent Activity' }
};

const PHONE_DELIVERY_STATUS_META = {
    on_the_way: { badge: 'On the Way', hero: 'Arriving Soon', delivery: '骑手配送中', eta: '10 mins away', active: true },
    preparing: { badge: 'Preparing', hero: 'Preparing', delivery: '商家出餐中', eta: '18 mins away', active: true },
    confirmed: { badge: 'Confirmed', hero: 'Order Confirmed', delivery: '商家已接单', eta: '25 mins away', active: true },
    completed: { badge: 'Completed', hero: 'Delivered', delivery: 'Delivered On Time', eta: 'Delivered', active: false }
};

const PHONE_DELIVERY_STICKER_LEVELS = ['very_bad', 'bad', 'neutral', 'good', 'very_good'];

const PHONE_DELIVERY_NOTE_STICKERS = {
    very_bad: [
        'https://i.postimg.cc/gkd0CVvq/wu-biao-ti129-20260406011214.png',
        'https://i.postimg.cc/m2RrvYQY/wu-biao-ti129-20260406011238.png',
        'https://i.postimg.cc/gkd0CVvX/wu-biao-ti129-20260406011319.png',
        'https://i.postimg.cc/QxsM2QpC/wu-biao-ti129-20260406011707.png',
        'https://i.postimg.cc/xjLCpxbd/wu-biao-ti129-20260406011720.png'
    ],
    bad: [
        'https://i.postimg.cc/tggZL3G3/wu-biao-ti129-20260406011134.png',
        'https://i.postimg.cc/255bPQNT/wu-biao-ti129-20260406011428.png',
        'https://i.postimg.cc/g2sLSMQv/wu-biao-ti129-20260406011628.png',
        'https://i.postimg.cc/s22QtYCW/wu-biao-ti129-20260406011649.png',
        'https://i.postimg.cc/qvw6bmSk/wu-biao-ti129-20260406011811.png'
    ],
    neutral: [
        'https://i.postimg.cc/Qtkb0ggL/wu-biao-ti129-20260406010839.png',
        'https://i.postimg.cc/Ss7rDL6w/wu-biao-ti129-20260406011226.png',
        'https://i.postimg.cc/50q3n5BT/wu-biao-ti129-20260406011402.png',
        'https://i.postimg.cc/LXBTNkt7/wu-biao-ti129-20260406011753.png',
        'https://i.postimg.cc/nzYk0K4R/wu-biao-ti129-20260406011828.png'
    ],
    good: [
        'https://i.postimg.cc/LsZRY5zW/wu-biao-ti129-20260406010819.png',
        'https://i.postimg.cc/7LTDGhgj/wu-biao-ti129-20260406011306.png',
        'https://i.postimg.cc/bw5pwk25/wu-biao-ti129-20260406011329.png'
    ],
    very_good: [
        'https://i.postimg.cc/7YYk1m3s/wu-biao-ti129-20260406011052.png',
        'https://i.postimg.cc/zXXrw0CP/wu-biao-ti129-20260406011106.png',
        'https://i.postimg.cc/fTTN7BcK/wu-biao-ti129-20260406011415.png',
        'https://i.postimg.cc/Y2x7mJWR/wu-biao-ti129-20260406011734.png'
    ]
};

const PHONE_DELIVERY_REVIEW_STYLE_CLASS_MAP = {
    grid: 'note-grid',
    ruled: 'note-ruled',
    'plain-yellow': 'note-plain-yellow'
};

const PHONE_DELIVERY_ALLOWED_REVIEW_STYLES = Object.keys(PHONE_DELIVERY_REVIEW_STYLE_CLASS_MAP);

const PHONE_DELIVERY_ALLOWED_RATING_LEVELS = ['\u975e\u5e38\u4e0d\u6ee1\u610f', '\u4e0d\u6ee1\u610f', '\u4e00\u822c', '\u6ee1\u610f', '\u975e\u5e38\u6ee1\u610f'];

const PHONE_DELIVERY_RATING_LEVEL_MAP = {
    '\u975e\u5e38\u4e0d\u6ee1\u610f': 'very_bad',
    '\u4e0d\u6ee1\u610f': 'bad',
    '\u4e00\u822c': 'neutral',
    '\u6ee1\u610f': 'good',
    '\u975e\u5e38\u6ee1\u610f': 'very_good'
};

const PHONE_DELIVERY_PRESET_SHOPS = [
    {
        name: 'Wagas',
        icon: 'ri-restaurant-2-line',
        keywords: ['wagas', '轻食', '沙拉', 'pesto'],
        category: '健康轻食',
        note: '无接触配送，多放葱花',
        courier: 'Li Ming',
        preview: '骑手已取餐，预计 10 分钟内送达。',
        items: [
            { name: 'Chicken Pesto Penne', price: 42, count: 1 },
            { name: 'Iced Americano', price: 18, count: 1 }
        ]
    },
    {
        name: 'Blue Bottle Coffee',
        icon: 'ri-cup-line',
        keywords: ['blue bottle', 'coffee', '咖啡', '拿铁'],
        category: '咖啡提神',
        note: '少冰，纸吸管',
        courier: 'Wang Lei',
        preview: '咖啡已制作完成，请留意骑手来电。',
        items: [
            { name: 'Iced Latte', price: 34, count: 1 },
            { name: 'Cold Brew', price: 34, count: 1 }
        ]
    },
    {
        name: 'Alimentari',
        icon: 'ri-goblet-line',
        keywords: ['alimentari', '意面', '意式', 'toast'],
        category: '意式精选',
        note: '酱汁分装',
        courier: 'Chen Yu',
        preview: '商家正在出餐，预计 18 分钟送达。',
        items: [
            { name: 'Truffle Toastie', price: 48, count: 1 },
            { name: 'Sparkling Lemonade', price: 20, count: 1 }
        ]
    },
    {
        name: 'Fasciné Bakery',
        icon: 'ri-cake-line',
        keywords: ['bakery', '面包', '甜点', '可颂'],
        category: '烘焙甜点',
        note: '靠近门口存放',
        courier: 'Sun Hao',
        preview: '订单已完成，感谢你的耐心等待。',
        items: [
            { name: 'Butter Croissant', price: 16, count: 2 },
            { name: 'Sea Salt Roll', price: 14, count: 1 }
        ]
    },
    {
        name: 'Shake Shack',
        icon: 'ri-hamburger-line',
        keywords: ['shake shack', '汉堡', 'burger', '薯条'],
        category: '美式汉堡',
        note: '番茄酱另装',
        courier: 'Zhao Jun',
        preview: '商家已接单，正在安排制作。',
        items: [
            { name: 'Cheeseburger', price: 39, count: 1 },
            { name: 'Crinkle Fries', price: 18, count: 1 }
        ]
    },
    {
        name: 'Manner Coffee',
        icon: 'ri-cup-line',
        keywords: ['manner', '美式', 'dirty', '浓缩'],
        category: '通勤咖啡',
        note: '到店前电话联系',
        courier: 'Xu Mo',
        preview: '骑手已到楼下，请尽快取餐。',
        items: [
            { name: 'Dirty Coffee', price: 24, count: 1 },
            { name: 'Iced Americano', price: 20, count: 1 }
        ]
    }
];

const phoneDeliveryRuntime = {
    bound: false,
    activePage: 'home',
    orders: [],
    featuredOrderId: '',
    activeShop: null
};

function normalizePhoneDeliveryText(value, fallback = '') {
    const text = String(value == null ? '' : value).trim();
    return text || fallback;
}

function normalizePhoneDeliveryTextList(value, fallback = '') {
    if (Array.isArray(value)) {
        const items = value
            .map(entry => normalizePhoneDeliveryText(entry, ''))
            .filter(Boolean);
        return items.length ? items.join('、') : fallback;
    }
    return normalizePhoneDeliveryText(value, fallback);
}

function normalizePhoneDeliveryBoolean(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    const text = String(value == null ? '' : value).trim().toLowerCase();
    if (!text) return !!fallback;
    if (['true', '1', 'yes', 'y', 'default'].includes(text)) return true;
    if (['false', '0', 'no', 'n'].includes(text)) return false;
    return !!fallback;
}

function normalizePhoneDeliveryNumber(value, fallback = 0) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    const match = String(value == null ? '' : value).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : fallback;
}

function normalizePhoneDeliveryCurrency(value, fallback = 0) {
    const number = normalizePhoneDeliveryNumber(value, fallback);
    return Number.isFinite(number) ? Number(number.toFixed(2)) : fallback;
}

function createEmptyPhoneDeliveryData() {
    return {
        delivery_addresses: [],
        taste_notes: [],
        active_order: null,
        frequent_shops: [],
        favorite_shops: [],
        recent_orders: [],
        gift_orders: [],
        pickup_orders: []
    };
}

function getPhoneDeliveryStoreBucket(contactId) {
    const state = window.iphoneSimState || {};
    if (!state.phoneContent) state.phoneContent = {};
    if (!state.phoneContent[contactId]) state.phoneContent[contactId] = {};
    return state.phoneContent[contactId];
}

function phoneDeliveryExtractAddressText(value) {
    if (typeof value === 'string') {
        const text = value.trim();
        return text && text !== '[object Object]' ? text : '';
    }
    if (value && typeof value === 'object') {
        const directKeys = ['address', 'full_address', 'fullAddress', 'detail', 'text', 'location'];
        for (const key of directKeys) {
            const candidate = normalizePhoneDeliveryText(value[key], '');
            if (candidate && candidate !== '[object Object]') return candidate;
        }
        const fragments = ['province', 'city', 'district', 'street', 'community', 'building', 'room']
            .map(key => normalizePhoneDeliveryText(value[key], ''))
            .filter(Boolean);
        if (fragments.length) return fragments.join('');
    }
    return '';
}

function phoneDeliveryFormatAddressEntry(entry) {
    const source = entry && typeof entry === 'object' ? entry : {};
    const label = normalizePhoneDeliveryText(source.label, '');
    const address = phoneDeliveryExtractAddressText(source.address || source);
    if (label && address) return `${label} · ${address}`;
    return address || label || '';
}

function phoneDeliveryBuildItemsFromPreview(preview, itemCount = 0, subtotal = 0) {
    const text = normalizePhoneDeliveryText(preview, '');
    let names = text
        ? text.split(/[\,\uFF0C\u3001+/]/).map(part => part.trim()).filter(Boolean)
        : [];
    if (!names.length) {
        const fallbackCount = Math.max(1, Math.round(normalizePhoneDeliveryNumber(itemCount, 1)) || 1);
        names = Array.from({ length: fallbackCount }, (_, index) => `Item ${index + 1}`);
    }
    const count = names.length || 1;
    const average = count ? Number((subtotal / count).toFixed(2)) : 0;
    return names.slice(0, Math.max(1, count)).map((name, index) => ({
        name,
        count: 1,
        price: index === count - 1
            ? Number(Math.max(0, subtotal - average * (count - 1)).toFixed(2))
            : average
    }));
}

function normalizePhoneDeliveryOrderItem(item, index, subtotalHint = 0, totalCount = 1) {
    const source = item && typeof item === 'object' ? item : {};
    const name = normalizePhoneDeliveryText(source.name || source.title || item, `Item ${index + 1}`);
    const count = Math.max(1, Math.round(normalizePhoneDeliveryNumber(source.count || source.qty || source.quantity, 1)) || 1);
    const fallbackPrice = totalCount > 0 ? Number((subtotalHint / totalCount).toFixed(2)) : 0;
    const price = Math.max(0, normalizePhoneDeliveryCurrency(source.price || source.amount || source.unit_price || source.total_price, fallbackPrice));
    return { name, count, price };
}

function phoneDeliveryParseTimeValue(value) {
    const text = normalizePhoneDeliveryText(value, '');
    if (!text) return null;
    const isoLike = text.replace(/\//g, '-').replace(/\.(?=\d)/g, '-').replace(' ', 'T');
    const isoTs = Date.parse(isoLike);
    if (!Number.isNaN(isoTs)) return isoTs;
    const relativeMatch = text.match(/^(\u4eca\u5929|\u6628\u5929|\u524d\u5929)\s*(\d{1,2}):(\d{2})$/);
    if (relativeMatch) {
        const date = new Date();
        if (relativeMatch[1] === '\u6628\u5929') date.setDate(date.getDate() - 1);
        if (relativeMatch[1] === '\u524d\u5929') date.setDate(date.getDate() - 2);
        date.setHours(Number(relativeMatch[2]), Number(relativeMatch[3]), 0, 0);
        return date.getTime();
    }
    const monthDayMatch = text.match(/^(\d{1,2})[-/.\u6708](\d{1,2})[\u65e5]?\s*(\d{1,2}):(\d{2})$/);
    if (monthDayMatch) {
        const date = new Date();
        date.setMonth(Number(monthDayMatch[1]) - 1, Number(monthDayMatch[2]));
        date.setHours(Number(monthDayMatch[3]), Number(monthDayMatch[4]), 0, 0);
        return date.getTime();
    }
    return null;
}

function normalizePhoneDeliveryAddressEntry(item, index, contact) {
    const source = item && typeof item === 'object' ? item : {};
    return {
        label: normalizePhoneDeliveryText(source.label, index === 0 ? 'Home' : `Address ${index + 1}`),
        recipient: normalizePhoneDeliveryText(source.recipient, getPhoneDeliveryRecipient(contact)),
        recipient_phone: maskPhoneDeliveryPhone(source.recipient_phone || source.phone || source.recipientPhone || getPhoneDeliveryRecipientPhone(contact)),
        address: phoneDeliveryExtractAddressText(source.address || source) || getPhoneDeliveryAddress(contact),
        is_default: normalizePhoneDeliveryBoolean(source.is_default, index === 0),
        used_count: Math.max(0, Math.round(normalizePhoneDeliveryNumber(source.used_count, Math.max(1, 6 - index)))),
        note: normalizePhoneDeliveryText(source.note, ''),
        related_to_user: normalizePhoneDeliveryBoolean(source.related_to_user, false),
        hidden_tension: normalizePhoneDeliveryText(source.hidden_tension, '')
    };
}

function normalizePhoneDeliveryTasteNoteEntry(item, index) {
    const source = item && typeof item === 'object' ? item : {};
    return {
        text: normalizePhoneDeliveryText(source.text, `Saved note ${index + 1}`),
        used_count: Math.max(0, Math.round(normalizePhoneDeliveryNumber(source.used_count, Math.max(1, 5 - index)))),
        last_used_at: normalizePhoneDeliveryText(source.last_used_at, index === 0 ? '2026-04-06 20:18' : '2026-04-05 13:20'),
        scene: normalizePhoneDeliveryText(source.scene, 'Delivery'),
        related_to_user: normalizePhoneDeliveryBoolean(source.related_to_user, false),
        hidden_tension: normalizePhoneDeliveryText(source.hidden_tension, '')
    };
}

function normalizePhoneDeliveryShopEntry(item, index, kind = 'frequent') {
    const source = item && typeof item === 'object' ? item : {};
    return {
        store_name: normalizePhoneDeliveryText(source.store_name, `Store ${index + 1}`),
        category: normalizePhoneDeliveryText(source.category, 'Food'),
        tag: normalizePhoneDeliveryText(source.tag, kind === 'favorite' ? 'Favorite' : 'Frequent'),
        avg_spend: Math.max(0, normalizePhoneDeliveryCurrency(source.avg_spend, 38 + index * 6)),
        order_count: Math.max(1, Math.round(normalizePhoneDeliveryNumber(source.order_count, Math.max(1, 5 - index))) || 1),
        last_ordered_at: normalizePhoneDeliveryText(source.last_ordered_at, index === 0 ? '2026-04-05 21:44' : '2026-04-04 18:20'),
        common_address: normalizePhoneDeliveryText(source.common_address || source.usual_address || source.address_hint, ''),
        common_items: normalizePhoneDeliveryTextList(source.common_items || source.usual_items || source.top_items, ''),
        popup_summary: normalizePhoneDeliveryText(
            source.popup_summary || source.popup_note || source.meta_note || source.shop_summary,
            kind === 'favorite'
                ? '最近总会想起这家，像是会专门留着反复点。'
                : '最近点这家的频率挺高，像是已经变成固定选项。'
        ),
        reason: normalizePhoneDeliveryText(source.reason, kind === 'favorite' ? 'Saved and revisited often.' : 'Ordered here repeatedly.'),
        related_to_user: normalizePhoneDeliveryBoolean(source.related_to_user, false),
        hidden_tension: normalizePhoneDeliveryText(source.hidden_tension, '')
    };
}

function normalizePhoneDeliveryOrderEntry(item, index, deliveryType, contact) {
    const source = item && typeof item === 'object' ? item : {};
    const storeName = normalizePhoneDeliveryText(source.store_name, `Store ${index + 1}`);
    const normalizedDeliveryType = normalizePhoneDeliveryText(source.delivery_type, deliveryType === 'pickup' ? 'pickup' : (deliveryType === 'gift' ? 'gift' : 'delivery'));
    const defaultFee = deliveryType === 'pickup' ? 0 : 3;
    let subtotal = Math.max(0, normalizePhoneDeliveryCurrency(source.subtotal, 0));
    const deliveryFee = Math.max(0, normalizePhoneDeliveryCurrency(source.delivery_fee, defaultFee));
    let total = Math.max(0, normalizePhoneDeliveryCurrency(source.total, 0));
    const rawItems = Array.isArray(source.items) ? source.items : [];
    let itemCount = Math.max(1, Math.round(normalizePhoneDeliveryNumber(source.item_count, 0)) || 0);
    let items = rawItems.length
        ? rawItems.map((entry, itemIndex) => normalizePhoneDeliveryOrderItem(entry, itemIndex, subtotal, rawItems.length))
        : [];
    if (!subtotal && total) {
        subtotal = Math.max(0, Number((total - deliveryFee).toFixed(2)));
    }
    if (!items.length) {
        items = phoneDeliveryBuildItemsFromPreview(source.items_preview, itemCount || 1, subtotal);
    }
    if (!subtotal) {
        subtotal = Number(items.reduce((sum, entry) => sum + entry.price * entry.count, 0).toFixed(2));
    }
    if (!itemCount) {
        itemCount = Math.max(1, items.reduce((sum, entry) => sum + entry.count, 0));
    }
    if (!total) {
        total = Number((subtotal + deliveryFee).toFixed(2));
    }
    const itemsPreview = normalizePhoneDeliveryText(source.items_preview, items.map(entry => entry.name).join(', '));
    const ratingLevelSource = normalizePhoneDeliveryText(source.rating_level, PHONE_DELIVERY_ALLOWED_RATING_LEVELS[index % PHONE_DELIVERY_ALLOWED_RATING_LEVELS.length]);
    const reviewStyleSource = normalizePhoneDeliveryText(source.review_style, PHONE_DELIVERY_ALLOWED_REVIEW_STYLES[index % PHONE_DELIVERY_ALLOWED_REVIEW_STYLES.length]);
    return {
        store_name: storeName,
        status: normalizePhoneDeliveryText(source.status, deliveryType === 'pickup' ? 'Ready for pickup' : 'Delivered'),
        ordered_at: normalizePhoneDeliveryText(source.ordered_at, index === 0 ? '2026-04-06 20:18' : '2026-04-05 13:42'),
        delivery_type: normalizedDeliveryType,
        item_count: itemCount,
        items_preview: itemsPreview,
        items,
        subtotal,
        delivery_fee: deliveryFee,
        total,
        courier_name: normalizePhoneDeliveryText(source.courier_name, deliveryType === 'pickup' ? 'Self Pickup' : 'Courier'),
        eta_text: normalizePhoneDeliveryText(source.eta_text, deliveryType === 'pickup' ? 'Ready for pickup' : PHONE_DELIVERY_STATUS_META.completed.eta),
        recipient: normalizePhoneDeliveryText(source.recipient, getPhoneDeliveryRecipient(contact)),
        recipient_phone: maskPhoneDeliveryPhone(source.recipient_phone || source.phone || source.recipientPhone || getPhoneDeliveryRecipientPhone(contact)),
        address_label: normalizePhoneDeliveryText(source.address_label, deliveryType === 'pickup' ? 'Pickup Store' : 'Saved Address'),
        address: phoneDeliveryExtractAddressText(source.address) || (deliveryType === 'pickup' ? `${storeName} Store` : getPhoneDeliveryAddress(contact)),
        remark: normalizePhoneDeliveryText(source.remark, deliveryType === 'pickup' ? 'Show pickup code at store' : getPhoneDeliveryNote(contact)),
        order_id: normalizePhoneDeliveryText(source.order_id, buildPhoneDeliveryOrderId(contact && contact.id, index)),
        delivery_status: normalizePhoneDeliveryText(source.delivery_status, deliveryType === 'pickup' ? 'Awaiting pickup' : PHONE_DELIVERY_STATUS_META.completed.delivery),
        rating_level: PHONE_DELIVERY_RATING_LEVEL_MAP[ratingLevelSource] ? ratingLevelSource : PHONE_DELIVERY_ALLOWED_RATING_LEVELS[index % PHONE_DELIVERY_ALLOWED_RATING_LEVELS.length],
        review_text: normalizePhoneDeliveryText(source.review_text, ''),
        review_style: PHONE_DELIVERY_REVIEW_STYLE_CLASS_MAP[reviewStyleSource] ? reviewStyleSource : PHONE_DELIVERY_ALLOWED_REVIEW_STYLES[index % PHONE_DELIVERY_ALLOWED_REVIEW_STYLES.length],
        related_to_user: normalizePhoneDeliveryBoolean(source.related_to_user, false),
        hidden_tension: normalizePhoneDeliveryText(source.hidden_tension, '')
    };
}

function normalizePhoneDeliveryActiveOrder(item, contact) {
    if (!item || typeof item !== 'object') return null;
    const source = item;
    const runtimeOrder = normalizePhoneDeliveryOrderEntry({
        ...source,
        ordered_at: source.ordered_at || 'Just now',
        subtotal: source.subtotal || source.total,
        delivery_fee: source.delivery_fee || 0,
        total: source.total,
        order_id: source.order_id || buildPhoneDeliveryOrderId(contact && contact.id, 99),
        delivery_status: source.track_hint || source.delivery_status || source.status || 'See tracking',
        rating_level: source.rating_level || PHONE_DELIVERY_ALLOWED_RATING_LEVELS[2],
        review_style: source.review_style || 'grid',
        review_text: source.review_text || ''
    }, 0, 'delivery', contact);
    return {
        store_name: normalizePhoneDeliveryText(source.store_name, runtimeOrder.store_name),
        status: normalizePhoneDeliveryText(source.status, 'On the way'),
        eta_text: normalizePhoneDeliveryText(source.eta_text, PHONE_DELIVERY_STATUS_META.on_the_way.eta),
        items_preview: normalizePhoneDeliveryText(source.items_preview, runtimeOrder.items_preview),
        courier_name: normalizePhoneDeliveryText(source.courier_name, runtimeOrder.courier_name),
        track_hint: normalizePhoneDeliveryText(source.track_hint, runtimeOrder.delivery_status || 'See tracking'),
        recipient: runtimeOrder.recipient,
        recipient_phone: runtimeOrder.recipient_phone,
        address: runtimeOrder.address,
        remark: runtimeOrder.remark,
        total: runtimeOrder.total,
        related_to_user: runtimeOrder.related_to_user,
        hidden_tension: runtimeOrder.hidden_tension,
        runtime_order: runtimeOrder
    };
}

function normalizePhoneDeliveryData(raw, contact) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const normalized = createEmptyPhoneDeliveryData();
    normalized.delivery_addresses = Array.isArray(source.delivery_addresses)
        ? source.delivery_addresses.map((item, index) => normalizePhoneDeliveryAddressEntry(item, index, contact))
        : [];
    normalized.taste_notes = Array.isArray(source.taste_notes)
        ? source.taste_notes.map((item, index) => normalizePhoneDeliveryTasteNoteEntry(item, index))
        : [];
    normalized.active_order = normalizePhoneDeliveryActiveOrder(source.active_order, contact);
    normalized.frequent_shops = Array.isArray(source.frequent_shops)
        ? source.frequent_shops.map((item, index) => normalizePhoneDeliveryShopEntry(item, index, 'frequent'))
        : [];
    normalized.favorite_shops = Array.isArray(source.favorite_shops)
        ? source.favorite_shops.map((item, index) => normalizePhoneDeliveryShopEntry(item, index, 'favorite'))
        : [];
    normalized.recent_orders = Array.isArray(source.recent_orders)
        ? source.recent_orders.map((item, index) => normalizePhoneDeliveryOrderEntry(item, index, 'delivery', contact))
        : [];
    normalized.gift_orders = Array.isArray(source.gift_orders)
        ? source.gift_orders.map((item, index) => normalizePhoneDeliveryOrderEntry(item, index, 'gift', contact))
        : [];
    normalized.pickup_orders = Array.isArray(source.pickup_orders)
        ? source.pickup_orders.map((item, index) => normalizePhoneDeliveryOrderEntry(item, index, 'pickup', contact))
        : [];
    return normalized;
}

function normalizePhoneDeliveryAiPayload(raw, contact) {
    if (raw && typeof raw === 'object' && raw.deliveryData && typeof raw.deliveryData === 'object') {
        return normalizePhoneDeliveryData(raw.deliveryData, contact);
    }
    return normalizePhoneDeliveryData(raw, contact);
}

function getPhoneDeliveryData(contactId) {
    if (!contactId) return createEmptyPhoneDeliveryData();
    const bucket = getPhoneDeliveryStoreBucket(contactId);
    bucket.deliveryData = normalizePhoneDeliveryData(bucket.deliveryData, getPhoneDeliveryContact(contactId));
    return bucket.deliveryData;
}

function setPhoneDeliveryData(contactId, deliveryData) {
    const bucket = getPhoneDeliveryStoreBucket(contactId);
    bucket.deliveryData = normalizePhoneDeliveryData(deliveryData, getPhoneDeliveryContact(contactId));
    return bucket.deliveryData;
}

function phoneDeliveryHasData(deliveryData) {
    if (!deliveryData || typeof deliveryData !== 'object') return false;
    if (deliveryData.active_order) return true;
    return ['delivery_addresses', 'taste_notes', 'frequent_shops', 'favorite_shops', 'recent_orders', 'gift_orders', 'pickup_orders']
        .some(key => Array.isArray(deliveryData[key]) && deliveryData[key].length);
}

function getPhoneDeliveryPrimaryAddressEntry(deliveryData) {
    if (!deliveryData || !Array.isArray(deliveryData.delivery_addresses) || !deliveryData.delivery_addresses.length) return null;
    return [...deliveryData.delivery_addresses].sort((left, right) => {
        return Number(right.is_default) - Number(left.is_default)
            || (right.used_count || 0) - (left.used_count || 0);
    })[0] || null;
}

function getPhoneDeliveryPrimaryTasteNote(deliveryData) {
    if (!deliveryData || !Array.isArray(deliveryData.taste_notes) || !deliveryData.taste_notes.length) return null;
    return [...deliveryData.taste_notes].sort((left, right) => {
        return (right.used_count || 0) - (left.used_count || 0)
            || (phoneDeliveryParseTimeValue(right.last_used_at) || 0) - (phoneDeliveryParseTimeValue(left.last_used_at) || 0);
    })[0] || null;
}

function createPhoneDeliveryRuntimeOrder(record, index, contactId, overrides = {}) {
    const preset = getPhoneDeliveryPreset(record && record.store_name, index);
    const statusKey = inferPhoneDeliveryStatusKey(`${record && record.status ? record.status : ''} ${record && record.delivery_status ? record.delivery_status : ''} ${record && record.eta_text ? record.eta_text : ''}`);
    const runtimeOrder = createPhoneDeliveryOrderFromPreset(preset, {
        id: overrides.id || `phone_delivery_generated_${contactId || 'default'}_${index}`,
        shopName: normalizePhoneDeliveryText(record && record.store_name, preset.name),
        statusKey,
        statusLabel: normalizePhoneDeliveryText(record && record.status, PHONE_DELIVERY_STATUS_META[statusKey].badge),
        heroStatus: normalizePhoneDeliveryText(record && record.status, PHONE_DELIVERY_STATUS_META[statusKey].hero),
        deliveryStatus: normalizePhoneDeliveryText(record && record.delivery_status, PHONE_DELIVERY_STATUS_META[statusKey].delivery),
        eta: normalizePhoneDeliveryText(record && record.eta_text, PHONE_DELIVERY_STATUS_META[statusKey].eta),
        items: Array.isArray(record && record.items) ? record.items : [],
        itemCount: record && record.item_count,
        subtotal: record && record.subtotal,
        deliveryFee: record && record.delivery_fee,
        total: record && record.total,
        summary: normalizePhoneDeliveryText(record && record.items_preview, Array.isArray(record && record.items) ? record.items.map(entry => entry.name).join(', ') : preset.items.map(entry => entry.name).join(', ')),
        time: normalizePhoneDeliveryText(record && record.ordered_at, '2026-04-06 20:18'),
        note: normalizePhoneDeliveryText(record && record.remark, getPhoneDeliveryNote(getPhoneDeliveryContact(contactId))),
        preview: normalizePhoneDeliveryText(record && record.review_text, normalizePhoneDeliveryText(record && record.delivery_status, PHONE_DELIVERY_STATUS_META[statusKey].delivery)),
        courier: normalizePhoneDeliveryText(record && record.courier_name, record && record.delivery_type === 'pickup' ? 'Self Pickup' : preset.courier),
        recipient: normalizePhoneDeliveryText(record && record.recipient, getPhoneDeliveryRecipient(getPhoneDeliveryContact(contactId))),
        recipientPhone: normalizePhoneDeliveryText(record && record.recipient_phone, getPhoneDeliveryRecipientPhone(getPhoneDeliveryContact(contactId))),
        address: normalizePhoneDeliveryText(record && record.address, getPhoneDeliveryAddress(getPhoneDeliveryContact(contactId))),
        orderId: normalizePhoneDeliveryText(record && record.order_id, buildPhoneDeliveryOrderId(contactId, index)),
        stickerLevel: PHONE_DELIVERY_RATING_LEVEL_MAP[record && record.rating_level] || 'neutral'
    });
    return {
        ...runtimeOrder,
        reviewText: normalizePhoneDeliveryText(record && record.review_text, ''),
        reviewStyle: normalizePhoneDeliveryText(record && record.review_style, 'grid'),
        ratingLevel: normalizePhoneDeliveryText(record && record.rating_level, PHONE_DELIVERY_ALLOWED_RATING_LEVELS[2]),
        deliveryType: normalizePhoneDeliveryText(record && record.delivery_type, 'delivery'),
        relatedToUser: normalizePhoneDeliveryBoolean(record && record.related_to_user, false),
        hiddenTension: normalizePhoneDeliveryText(record && record.hidden_tension, ''),
        trackHint: normalizePhoneDeliveryText(overrides.trackHint || (record && record.track_hint), ''),
        addressLabel: normalizePhoneDeliveryText(record && record.address_label, '')
    };
}

function buildPhoneDeliveryOrdersFromData(deliveryData, contactId) {
    if (!phoneDeliveryHasData(deliveryData)) return [];
    const orders = [];
    const pushRuntimeOrder = (record, sourceKey, index) => {
        if (!record) return;
        const runtimeOrder = createPhoneDeliveryRuntimeOrder(record, orders.length + index, contactId, {
            id: `phone_delivery_${sourceKey}_${contactId || 'default'}_${orders.length + index}`,
            trackHint: record.track_hint || ''
        });
        const duplicate = orders.some(existing => {
            if (existing.orderId && runtimeOrder.orderId && existing.orderId === runtimeOrder.orderId) return true;
            return existing.shopName === runtimeOrder.shopName
                && existing.time === runtimeOrder.time
                && existing.summary === runtimeOrder.summary;
        });
        if (!duplicate) orders.push(runtimeOrder);
    };
    if (deliveryData.active_order && deliveryData.active_order.runtime_order) {
        const activeRuntimeRecord = {
            ...deliveryData.active_order.runtime_order,
            status: deliveryData.active_order.status,
            eta_text: deliveryData.active_order.eta_text,
            courier_name: deliveryData.active_order.courier_name,
            delivery_status: deliveryData.active_order.track_hint || deliveryData.active_order.runtime_order.delivery_status,
            remark: deliveryData.active_order.remark,
            total: deliveryData.active_order.total,
            address: deliveryData.active_order.address,
            recipient: deliveryData.active_order.recipient,
            recipient_phone: deliveryData.active_order.recipient_phone
        };
        pushRuntimeOrder(activeRuntimeRecord, 'active', 0);
    }
    deliveryData.recent_orders.forEach((record, index) => pushRuntimeOrder(record, 'recent', index));
    deliveryData.gift_orders.forEach((record, index) => pushRuntimeOrder(record, 'gift', index));
    deliveryData.pickup_orders.forEach((record, index) => pushRuntimeOrder(record, 'pickup', index));
    return orders.sort((left, right) => {
        return Number(right.active) - Number(left.active)
            || (phoneDeliveryParseTimeValue(right.time) || 0) - (phoneDeliveryParseTimeValue(left.time) || 0);
    });
}

function escapePhoneDeliveryHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getPhoneDeliveryContact(contactId) {
    const state = window.iphoneSimState || {};
    const contacts = Array.isArray(state.contacts) ? state.contacts : [];
    return contacts.find(contact => contact.id === contactId) || null;
}

function maskPhoneDeliveryPhone(value) {
    const digits = String(value == null ? '' : value).replace(/\D/g, '');
    if (digits.length >= 7) {
        return `${digits.slice(0, 3)}****${digits.slice(-4)}`;
    }
    return '138****8888';
}

function getPhoneDeliveryRecipient(contact) {
    return normalizePhoneDeliveryText(contact && (contact.remark || contact.name), 'Current Contact');
}

function getPhoneDeliveryRecipientPhone(contact) {
    return maskPhoneDeliveryPhone(contact && (contact.phone || contact.mobile || contact.phoneNumber || contact.tel || contact.phone_number));
}

function getPhoneDeliveryAddress(contact) {
    const candidates = [
        phoneDeliveryExtractAddressText(contact && contact.address),
        phoneDeliveryExtractAddressText(contact && contact.homeAddress),
        phoneDeliveryExtractAddressText(contact && contact.location),
        contact && contact.city ? `${contact.city} 常用收货地址` : '',
        contact && contact.school ? `${contact.school} 宿舍楼下` : '',
        contact && contact.company ? `${contact.company} 前台` : ''
    ];
    for (const candidate of candidates) {
        const value = normalizePhoneDeliveryText(candidate, '');
        if (value) return value;
    }
    return 'Jing\'an District, Yuyuan Rd 120 8F';
}

function getPhoneDeliveryNote(contact) {
    const candidates = [
        contact && contact.deliveryNote,
        contact && contact.foodNote,
        contact && contact.foodPreference,
        contact && contact.note
    ];
    for (const candidate of candidates) {
        const value = normalizePhoneDeliveryText(candidate, '');
        if (value) return value;
    }
    return 'No-contact delivery, extra scallions';
}

function normalizePhoneDeliveryShopName(value) {
    const normalized = String(value == null ? '' : value)
        .replace(/[【】\[\]()（）]/g, ' ')
        .replace(/(美团|饿了么|外卖|订单|服务|通知|平台|商家版|配送|骑手|官方|闪送|达达|蜂鸟|系统消息)/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return normalized.length > 24 ? normalized.slice(0, 24).trim() : normalized;
}

function getPhoneDeliveryPreset(shopName, index = 0) {
    const lowerShopName = String(shopName || '').toLowerCase();
    const matched = PHONE_DELIVERY_PRESET_SHOPS.find(preset => {
        if (lowerShopName.includes(String(preset.name).toLowerCase())) return true;
        return Array.isArray(preset.keywords) && preset.keywords.some(keyword => lowerShopName.includes(String(keyword).toLowerCase()));
    });
    return matched || PHONE_DELIVERY_PRESET_SHOPS[index % PHONE_DELIVERY_PRESET_SHOPS.length];
}

function inferPhoneDeliveryStatusKey(text) {
    const value = String(text || '').toLowerCase();
    if (!value) return 'preparing';
    if (/(已取餐|配送中|派送|骑手|送餐|即将送达|快送达|正在赶来|还有.*分钟|预计.*分钟|到楼下)/.test(value)) return 'on_the_way';
    if (/(已送达|送达|已完成|完成订单|已签收|感谢你的耐心等待|请及时取餐|已放在)/.test(value)) return 'completed';
    if (/(出餐|备餐|制作中|准备中|打包中|商家已出餐)/.test(value)) return 'preparing';
    if (/(已接单|接单|确认订单|已确认|下单成功)/.test(value)) return 'confirmed';
    return 'preparing';
}

function formatPhoneDeliveryPrice(amount) {
    const value = Number(amount || 0);
    if (!Number.isFinite(value)) return '¥0';
    return `¥${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)}`;
}

function buildPhoneDeliveryOrderId(contactId, index) {
    const digits = String(contactId == null ? '' : contactId).replace(/\D/g, '');
    const blockA = (digits.slice(-4) || '8892').padStart(4, '8');
    const blockB = String(1204 + index).padStart(4, '0');
    const blockC = String(43 + index).padStart(2, '0');
    return `${blockA} ${blockB} ${blockC}`;
}

function createPhoneDeliveryOrderFromPreset(preset, options = {}) {
    const statusKey = PHONE_DELIVERY_STATUS_META[options.statusKey] ? options.statusKey : 'preparing';
    const statusMeta = PHONE_DELIVERY_STATUS_META[statusKey];
    const itemsSource = Array.isArray(options.items) && options.items.length ? options.items : (Array.isArray(preset.items) ? preset.items : []);
    const items = itemsSource.map(item => ({
        name: String(item && item.name ? item.name : 'Item').trim() || 'Item',
        price: Number(item && item.price ? item.price : 0) || 0,
        count: Math.max(1, Number(item && item.count ? item.count : 1) || 1)
    }));
    const explicitSubtotal = Number(options.subtotal);
    const subtotal = Number.isFinite(explicitSubtotal)
        ? explicitSubtotal
        : items.reduce((sum, item) => sum + item.price * item.count, 0);
    const fallbackFee = statusKey === 'completed' ? 0 : 4;
    const deliveryFeeValue = Number(options.deliveryFee);
    const deliveryFee = Number.isFinite(deliveryFeeValue) ? deliveryFeeValue : fallbackFee;
    const explicitTotal = Number(options.total);
    const total = Number.isFinite(explicitTotal) ? explicitTotal : subtotal + deliveryFee;
    const explicitItemCount = Number(options.itemCount);
    const itemCount = Number.isFinite(explicitItemCount) && explicitItemCount > 0
        ? Math.round(explicitItemCount)
        : items.reduce((sum, item) => sum + item.count, 0);
    const shopName = String(options.shopName || preset.name || '外卖商家').trim() || '外卖商家';
    const time = String(options.time || '今天 12:18').trim() || '今天 12:18';
    const note = String(options.note || preset.note || '无接触配送').trim() || '无接触配送';
    const preview = String(options.preview || preset.preview || `${shopName} 订单状态已更新。`).trim() || `${shopName} 订单状态已更新。`;
    const summary = String(options.summary || items.map(item => item.name).join(', ')).trim() || '订单详情';

    return {
        id: String(options.id || `${shopName}-${time}`).replace(/\s+/g, '_'),
        shopName,
        icon: options.icon || preset.icon || 'ri-restaurant-2-line',
        category: preset.category || '精选餐饮',
        items,
        itemCount,
        subtotal,
        deliveryFee,
        total,
        statusKey,
        statusLabel: options.statusLabel || statusMeta.badge,
        heroStatus: options.heroStatus || statusMeta.hero,
        deliveryStatus: options.deliveryStatus || statusMeta.delivery,
        eta: options.eta || statusMeta.eta,
        summary,
        courier: String(options.courier || preset.courier || '配送员').trim() || '配送员',
        time,
        note,
        recipient: String(options.recipient || '当前联系人').trim() || '当前联系人',
        recipientPhone: String(options.recipientPhone || '138****8888').trim() || '138****8888',
        address: String(options.address || '静安区愚园路 120 号 8F').trim() || '静安区愚园路 120 号 8F',
        preview,
        orderId: String(options.orderId || '8892 1204 43').trim() || '8892 1204 43',
        active: !!statusMeta.active,
        stickerLevel: PHONE_DELIVERY_NOTE_STICKERS[options.stickerLevel] ? options.stickerLevel : 'neutral'
    };
}

function buildPhoneDeliveryFallbackOrders(contact) {
    const recipient = getPhoneDeliveryRecipient(contact);
    const recipientPhone = getPhoneDeliveryRecipientPhone(contact);
    const address = getPhoneDeliveryAddress(contact);
    const baseNote = getPhoneDeliveryNote(contact);

    return [
        createPhoneDeliveryOrderFromPreset(getPhoneDeliveryPreset('Wagas', 0), {
            id: 'phone_delivery_fallback_0',
            statusKey: 'on_the_way',
            time: '今天 12:18',
            recipient,
            recipientPhone,
            address,
            note: baseNote,
            orderId: buildPhoneDeliveryOrderId(contact && contact.id, 0),
            stickerLevel: 'good'
        }),
        createPhoneDeliveryOrderFromPreset(getPhoneDeliveryPreset('Blue Bottle Coffee', 1), {
            id: 'phone_delivery_fallback_1',
            statusKey: 'completed',
            time: '昨天 14:30',
            recipient,
            recipientPhone,
            address,
            note: '少冰，纸吸管',
            deliveryFee: 0,
            orderId: buildPhoneDeliveryOrderId(contact && contact.id, 1),
            stickerLevel: 'very_good'
        }),
        createPhoneDeliveryOrderFromPreset(getPhoneDeliveryPreset('Fasciné Bakery', 2), {
            id: 'phone_delivery_fallback_2',
            statusKey: 'completed',
            time: '周五 09:12',
            recipient,
            recipientPhone,
            address,
            note: '放前台即可',
            deliveryFee: 0,
            orderId: buildPhoneDeliveryOrderId(contact && contact.id, 2),
            stickerLevel: 'neutral'
        }),
        createPhoneDeliveryOrderFromPreset(getPhoneDeliveryPreset('Alimentari', 3), {
            id: 'phone_delivery_fallback_3',
            statusKey: 'preparing',
            time: '今天 18:02',
            recipient,
            recipientPhone,
            address,
            note: '酱汁分装',
            orderId: buildPhoneDeliveryOrderId(contact && contact.id, 3),
            stickerLevel: 'bad'
        }),
        createPhoneDeliveryOrderFromPreset(getPhoneDeliveryPreset('Shake Shack', 4), {
            id: 'phone_delivery_fallback_4',
            statusKey: 'confirmed',
            time: '今天 20:16',
            recipient,
            recipientPhone,
            address,
            note: '番茄酱另装',
            orderId: buildPhoneDeliveryOrderId(contact && contact.id, 4),
            stickerLevel: 'very_bad'
        })
    ];
}

function getPhoneDeliveryMessageSource(contactId) {
    const state = window.iphoneSimState || {};
    const phoneContent = state.phoneContent && state.phoneContent[contactId] ? state.phoneContent[contactId] : null;
    const messagesData = phoneContent && phoneContent.messagesData ? phoneContent.messagesData : null;
    return Array.isArray(messagesData && messagesData.food_delivery_notifications) ? messagesData.food_delivery_notifications : [];
}

function buildPhoneDeliveryOrders(contactId) {
    const contact = getPhoneDeliveryContact(contactId);
    const deliveryData = getPhoneDeliveryData(contactId);
    if (phoneDeliveryHasData(deliveryData)) {
        const generatedOrders = buildPhoneDeliveryOrdersFromData(deliveryData, contactId);
        if (generatedOrders.length) {
            return generatedOrders;
        }
    }

    const messages = getPhoneDeliveryMessageSource(contactId);
    if (!messages.length) {
        return buildPhoneDeliveryFallbackOrders(contact);
    }

    const recipient = getPhoneDeliveryRecipient(contact);
    const recipientPhone = getPhoneDeliveryRecipientPhone(contact);
    const address = getPhoneDeliveryAddress(contact);
    const baseNote = getPhoneDeliveryNote(contact);
    const courierNames = ['Li Ming', 'Wang Lei', 'Chen Yu', 'Sun Hao', 'Xu Mo', 'Zhao Jun'];

    const orders = messages.slice(0, 6).map((entry, index) => {
        const rawShopName = normalizePhoneDeliveryShopName(entry && (entry.remark || entry.sender));
        const preset = getPhoneDeliveryPreset(rawShopName, index);
        const shopName = rawShopName || preset.name;
        const statusKey = inferPhoneDeliveryStatusKey(`${entry && entry.content ? entry.content : ''} ${entry && entry.owner_reply ? entry.owner_reply : ''}`);
        const time = String(entry && (entry.time || entry.last_time) ? (entry.time || entry.last_time) : (index === 0 ? 'Today 12:18' : 'Yesterday 14:30')).trim() || (index === 0 ? 'Today 12:18' : 'Yesterday 14:30');
        const preview = String(entry && (entry.owner_reply || entry.content) ? (entry.owner_reply || entry.content) : preset.preview).trim() || preset.preview;
        const courier = statusKey === 'completed' ? 'Completed' : courierNames[index % courierNames.length];

        return createPhoneDeliveryOrderFromPreset(preset, {
            id: `phone_delivery_${contactId || 'default'}_${index}`,
            shopName,
            statusKey,
            time,
            preview,
            recipient,
            recipientPhone,
            address,
            note: baseNote,
            courier,
            orderId: buildPhoneDeliveryOrderId(contactId, index),
            stickerLevel: PHONE_DELIVERY_STICKER_LEVELS[index % PHONE_DELIVERY_STICKER_LEVELS.length]
        });
    }).filter(Boolean);

    if (!orders.length) {
        return buildPhoneDeliveryFallbackOrders(contact);
    }

    if (orders.length < PHONE_DELIVERY_STICKER_LEVELS.length) {
        const fallbackOrders = buildPhoneDeliveryFallbackOrders(contact);
        fallbackOrders.forEach(fallbackOrder => {
            if (orders.length >= PHONE_DELIVERY_STICKER_LEVELS.length) return;
            if (orders.some(existing => existing.shopName === fallbackOrder.shopName)) return;
            orders.push({
                ...fallbackOrder,
                id: `${fallbackOrder.id}_preview_${orders.length}`,
                stickerLevel: PHONE_DELIVERY_STICKER_LEVELS[orders.length % PHONE_DELIVERY_STICKER_LEVELS.length]
            });
        });
    }

    return orders.sort((left, right) => Number(right.active) - Number(left.active));
}

function getPhoneDeliveryOrderById(orderId) {
    return phoneDeliveryRuntime.orders.find(order => order.id === orderId) || null;
}

function findPhoneDeliveryPresetMatch(shopName) {
    const lowerShopName = String(shopName || '').toLowerCase();
    if (!lowerShopName) return null;
    return PHONE_DELIVERY_PRESET_SHOPS.find(preset => {
        if (lowerShopName.includes(String(preset.name).toLowerCase())) return true;
        return Array.isArray(preset.keywords) && preset.keywords.some(keyword => lowerShopName.includes(String(keyword).toLowerCase()));
    }) || null;
}

function getPhoneDeliveryShopMatchKey(shopName) {
    const normalizedName = normalizePhoneDeliveryShopName(shopName);
    if (!normalizedName) return '';
    const matchedPreset = findPhoneDeliveryPresetMatch(normalizedName);
    const baseName = matchedPreset ? matchedPreset.name : normalizedName;
    return String(baseName || '').trim().toLowerCase();
}

function getPhoneDeliveryOrderTimeValue(order) {
    return phoneDeliveryParseTimeValue(order && order.time) || 0;
}

function getPhoneDeliveryOrdersForShop(shopName) {
    const shopKey = getPhoneDeliveryShopMatchKey(shopName);
    if (!shopKey) return [];
    return [...phoneDeliveryRuntime.orders]
        .filter(order => getPhoneDeliveryShopMatchKey(order && order.shopName) === shopKey)
        .sort((left, right) => getPhoneDeliveryOrderTimeValue(right) - getPhoneDeliveryOrderTimeValue(left));
}

function phoneDeliveryShortenShopText(value, limit = 18, fallback = '') {
    const text = normalizePhoneDeliveryText(value, fallback);
    if (!text) return fallback;
    return text.length > limit ? `${text.slice(0, limit).trim()}…` : text;
}

function buildPhoneDeliveryPopupTimeHtml(value) {
    const text = normalizePhoneDeliveryText(value, '');
    if (!text) return '12:18 <span>Today</span>';
    const todayMatch = text.match(/^今天\s*(\d{1,2}:\d{2})$/);
    if (todayMatch) return `${todayMatch[1]} <span>Today</span>`;
    const yesterdayMatch = text.match(/^昨天\s*(\d{1,2}:\d{2})$/);
    if (yesterdayMatch) return `${yesterdayMatch[1]} <span>Yesterday</span>`;
    const beforeMatch = text.match(/^前天\s*(\d{1,2}:\d{2})$/);
    if (beforeMatch) return `${beforeMatch[1]} <span>2 days ago</span>`;
    const monthDayMatch = text.match(/^(\d{1,2}[月\/-]\d{1,2}[日]?)\s*(\d{1,2}:\d{2})$/);
    if (monthDayMatch) return `${monthDayMatch[2]} <span>${monthDayMatch[1]}</span>`;
    return escapePhoneDeliveryHtml(text);
}

function buildPhoneDeliveryPopupItemsHtml(value) {
    const text = normalizePhoneDeliveryText(value, '暂无常点内容');
    const parts = text.split(/[、,，/&＋+]/g).map(item => normalizePhoneDeliveryText(item, '')).filter(Boolean);
    if (!parts.length) return escapePhoneDeliveryHtml(text);
    if (parts.length === 1) return escapePhoneDeliveryHtml(parts[0]);
    const first = escapePhoneDeliveryHtml(parts[0]);
    const remaining = escapePhoneDeliveryHtml(parts.slice(1).join(' & '));
    return `${first}<br><span>&amp; ${remaining}</span>`;
}

function buildPhoneDeliveryPopupNoteText(shop) {
    const raw = normalizePhoneDeliveryText(shop && (shop.modalMeta || shop.reason), '最近总能翻到这家，像是忙的时候会顺手下单，已经有点变成固定选项了。');
    const cleaned = raw.replace(/^[“"']+|[”"']+$/g, '').trim();
    return `“${cleaned}”`;
}

function getPhoneDeliveryShopCommonAddress(orders) {
    if (!Array.isArray(orders) || !orders.length) return '';
    const counts = new Map();
    orders.forEach(order => {
        const value = normalizePhoneDeliveryText(order && (order.addressLabel || order.address), '');
        if (!value) return;
        counts.set(value, (counts.get(value) || 0) + 1);
    });
    if (!counts.size) return '';
    const [topAddress] = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].length - right[0].length)[0];
    return phoneDeliveryShortenShopText(topAddress, 18, '');
}

function getPhoneDeliveryShopCommonItems(orders) {
    if (!Array.isArray(orders) || !orders.length) return '';
    const itemStats = new Map();
    orders.forEach((order, orderIndex) => {
        const sourceItems = Array.isArray(order && order.items) && order.items.length
            ? order.items.map(item => item && item.name)
            : String(order && order.summary || '').split(/[、,，/]/g);
        sourceItems.forEach((rawName, itemIndex) => {
            const name = normalizePhoneDeliveryText(rawName, '');
            if (!name) return;
            const current = itemStats.get(name) || { count: 0, rank: Number.MAX_SAFE_INTEGER };
            current.count += 1;
            current.rank = Math.min(current.rank, orderIndex * 10 + itemIndex);
            itemStats.set(name, current);
        });
    });
    if (!itemStats.size) return '';
    return [...itemStats.entries()]
        .sort((left, right) => right[1].count - left[1].count || left[1].rank - right[1].rank)
        .slice(0, 3)
        .map(entry => entry[0])
        .join('、');
}

function getPhoneDeliveryShopOrderCount(entry, matchedOrders) {
    const entryCount = Math.round(normalizePhoneDeliveryNumber(entry && entry.order_count, 0)) || 0;
    if (entryCount > 0) return entryCount;
    return Array.isArray(matchedOrders) && matchedOrders.length ? matchedOrders.length : 1;
}

function getPhoneDeliveryShopAverageSpend(entry, matchedOrders) {
    const entrySpend = normalizePhoneDeliveryCurrency(entry && entry.avg_spend, 0);
    if (entrySpend > 0) return entrySpend;
    if (!Array.isArray(matchedOrders) || !matchedOrders.length) return 0;
    const total = matchedOrders.reduce((sum, order) => sum + Math.max(0, Number(order && order.total) || 0), 0);
    return Number((total / matchedOrders.length).toFixed(2));
}

function getPhoneDeliveryShopLastOrderedAt(entry, matchedOrders) {
    const explicit = normalizePhoneDeliveryText(entry && entry.last_ordered_at, '');
    if (explicit) return explicit;
    const latestOrder = Array.isArray(matchedOrders) ? matchedOrders[0] : null;
    return normalizePhoneDeliveryText(latestOrder && latestOrder.time, '暂无记录');
}

function buildPhoneDeliveryShopReason(entry, matchedOrders, sourceType) {
    const explicitReason = normalizePhoneDeliveryText(entry && entry.reason, '');
    if (explicitReason) return explicitReason;
    if (Array.isArray(matchedOrders) && matchedOrders.length) {
        const latestOrder = matchedOrders[0];
        if (sourceType === 'favorite') {
            return `最近一次点的是${normalizePhoneDeliveryText(latestOrder && latestOrder.summary, '熟悉的那几样')}，像是会专门留着反复回点的店。`;
        }
        if (sourceType === 'frequent') {
            return `最近总能翻到这家，像是忙的时候会顺手下单，已经有点变成固定选项了。`;
        }
        return `订单里反复出现这家，口味和节奏应该都比较对得上，不然不会一再点到它。`;
    }
    if (sourceType === 'favorite') return '会专门留着的一家店，像是稳妥时就会想起它。';
    if (sourceType === 'frequent') return '下单记录比较密，像是最近常常顺手会点到它。';
    return '最近订单里出现过，像是开始形成固定偏好。';
}

function buildPhoneDeliveryShopMetaLine(shop) {
    if (shop.orderCount > 1 && shop.commonAddress && shop.commonAddress !== '常用地址未显示') {
        return `最近点了 ${shop.orderCount} 次，常送到 ${shop.commonAddress}。`;
    }
    if (shop.lastOrderedAt && shop.lastOrderedAt !== '暂无记录') {
        return `最近一次下单是 ${shop.lastOrderedAt}，看起来这家还挺常出现。`;
    }
    if (shop.sourceType === 'favorite') return '像是会专门留着、想吃时就会翻出来的店。';
    if (shop.sourceType === 'frequent') return '最近点得比较勤，像是顺手就会下单的固定选择。';
    return '最近订单里露面过，像是正在变成新的常点。';
}

function createPhoneDeliveryShopCardData(shopName, entry = null, sourceType = 'recommendation', index = 0) {
    const matchedOrders = getPhoneDeliveryOrdersForShop(shopName);
    const latestOrder = matchedOrders[0] || null;
    const preset = getPhoneDeliveryPreset(shopName, index);
    const sourceLabelCnMap = {
        frequent: '常点',
        favorite: '收藏',
        recommendation: '推荐'
    };
    const sourceLabelCn = sourceLabelCnMap[sourceType] || sourceLabelCnMap.recommendation;
    const orderCount = getPhoneDeliveryShopOrderCount(entry, matchedOrders);
    const presetDefaultSpend = Array.isArray(preset.items) && preset.items.length
        ? Number(preset.items.reduce((sum, item) => {
            const price = Math.max(0, Number(item && item.price) || 0);
            const count = Math.max(1, Number(item && item.count) || 1);
            return sum + price * count;
        }, 0).toFixed(2))
        : 0;
    const avgSpend = getPhoneDeliveryShopAverageSpend(entry, matchedOrders) || presetDefaultSpend;
    const lastOrderedAt = getPhoneDeliveryShopLastOrderedAt(entry, matchedOrders);
    const commonAddress = normalizePhoneDeliveryText(entry && entry.common_address, '')
        || getPhoneDeliveryShopCommonAddress(matchedOrders)
        || '常用地址未显示';
    const commonItems = normalizePhoneDeliveryTextList(entry && entry.common_items, '')
        || getPhoneDeliveryShopCommonItems(matchedOrders)
        || normalizePhoneDeliveryText(Array.isArray(preset.items) ? preset.items.map(item => item.name).join('、') : '', '暂无常点内容');
    const reason = buildPhoneDeliveryShopReason(entry, matchedOrders, sourceType);
    const displayName = normalizePhoneDeliveryText(shopName, preset.name);
    const category = normalizePhoneDeliveryText(entry && entry.category, normalizePhoneDeliveryText(latestOrder && latestOrder.category, preset.category));
    const rawMetaTag = normalizePhoneDeliveryText(entry && (entry.tag || entry.category), category);
    const metaTag = /^(favorite|frequent)$/i.test(rawMetaTag) ? category : rawMetaTag;
    const shop = {
        name: displayName,
        icon: normalizePhoneDeliveryText(latestOrder && latestOrder.icon, preset.icon),
        category,
        eta: normalizePhoneDeliveryText(latestOrder && latestOrder.eta, PHONE_DELIVERY_STATUS_META.preparing.eta),
        meta: `${sourceLabelCn} · ${metaTag || category}`,
        sourceType,
        sourceLabelCn,
        orderCount,
        avgSpend,
        lastOrderedAt,
        commonAddress,
        commonItems,
        reason,
        latestOrderId: latestOrder ? latestOrder.id : '',
        latestOrderSummary: normalizePhoneDeliveryText(latestOrder && latestOrder.summary, ''),
        modalMeta: normalizePhoneDeliveryText(entry && entry.popup_summary, '')
    };
    if (!shop.modalMeta) {
        shop.modalMeta = buildPhoneDeliveryShopMetaLine(shop);
    }
    return shop;
}

function buildPhoneDeliveryShopCollections(orders, deliveryData = null) {
    if (phoneDeliveryHasData(deliveryData) && ((deliveryData.frequent_shops || []).length || (deliveryData.favorite_shops || []).length)) {
        const favorites = [];
        const recommendations = [];
        const seen = new Set();
        const pushShop = (entry, sourceType, target) => {
            const name = normalizePhoneDeliveryText(entry && entry.store_name, '');
            if (!name) return;
            const key = getPhoneDeliveryShopMatchKey(name) || name.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            target.push(createPhoneDeliveryShopCardData(name, entry, sourceType, target.length));
        };

        deliveryData.frequent_shops.forEach(entry => pushShop(entry, 'frequent', favorites));
        deliveryData.favorite_shops.forEach(entry => {
            if (favorites.length < 6) pushShop(entry, 'favorite', favorites);
            else pushShop(entry, 'favorite', recommendations);
        });

        orders.forEach((order, index) => {
            const key = getPhoneDeliveryShopMatchKey(order && order.shopName) || normalizePhoneDeliveryText(order && order.shopName, '').toLowerCase();
            if (!key || seen.has(key)) return;
            seen.add(key);
            recommendations.push(createPhoneDeliveryShopCardData(order.shopName, null, 'recommendation', recommendations.length + index));
        });

        if (favorites.length || recommendations.length) {
            return {
                favorites: favorites.slice(0, 6),
                recommendations: recommendations.slice(0, 6)
            };
        }
    }

    const merged = [];
    const seen = new Set();
    const appendShop = (shopName, index) => {
        const preset = getPhoneDeliveryPreset(shopName, index);
        const key = getPhoneDeliveryShopMatchKey(shopName) || String(preset.name || shopName).toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        merged.push(normalizePhoneDeliveryText(shopName, preset.name));
    };

    orders.forEach((order, index) => appendShop(order.shopName, index));
    PHONE_DELIVERY_PRESET_SHOPS.forEach((preset, index) => appendShop(preset.name, index));

    return {
        favorites: merged.slice(0, 4).map((item, index) => createPhoneDeliveryShopCardData(item, null, 'frequent', index)),
        recommendations: merged.slice(4, 8).map((item, index) => createPhoneDeliveryShopCardData(item, null, 'recommendation', index))
    };
}

function phoneDeliveryAddRipple(event, target) {
    const btn = target || event.currentTarget;
    if (!btn) return;

    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    const rect = btn.getBoundingClientRect();
    const clientX = typeof event.clientX === 'number' ? event.clientX : rect.left + rect.width / 2;
    const clientY = typeof event.clientY === 'number' ? event.clientY : rect.top + rect.height / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${clientX - rect.left - radius}px`;
    circle.style.top = `${clientY - rect.top - radius}px`;
    circle.style.position = 'absolute';
    circle.style.borderRadius = '50%';
    circle.style.backgroundColor = 'rgba(0, 0, 0, 0.08)';
    circle.style.transform = 'scale(0)';
    circle.style.animation = 'phoneDeliveryRipple 0.6s cubic-bezier(0.25, 1, 0.5, 1)';
    circle.style.pointerEvents = 'none';
    circle.classList.add('phone-delivery-ripple-effect');

    if (getComputedStyle(btn).position === 'static') {
        btn.style.position = 'relative';
    }
    btn.style.overflow = 'hidden';

    const ripple = btn.querySelector('.phone-delivery-ripple-effect');
    if (ripple) ripple.remove();

    btn.appendChild(circle);
    setTimeout(() => circle.remove(), 600);
}

function phoneDeliveryRestartAnimations(target) {
    if (!target) return;
    const elements = [];
    if (target.classList && target.classList.contains('animate-enter')) {
        elements.push(target);
    }
    elements.push(...target.querySelectorAll('.animate-enter'));
    elements.forEach(element => {
        element.style.animation = 'none';
        element.offsetHeight;
        element.style.animation = null;
    });
}

function phoneDeliverySyncNavIcons() {
    document.querySelectorAll('#phone-delivery .bottom-nav .nav-item').forEach(item => {
        const icon = item.querySelector('i');
        if (!icon) return;
        const isActive = item.classList.contains('active');
        if (isActive && icon.className.includes('-line')) {
            icon.className = icon.className.replace('-line', '-fill');
        } else if (!isActive && icon.className.includes('-fill')) {
            icon.className = icon.className.replace('-fill', '-line');
        }
    });
}

function hashPhoneDeliverySeed(value) {
    const text = String(value || '');
    let hash = 0;
    for (let index = 0; index < text.length; index += 1) {
        hash = ((hash << 5) - hash + text.charCodeAt(index)) >>> 0;
    }
    return hash >>> 0;
}

function phoneDeliverySeedRatio(seedKey, salt) {
    return (hashPhoneDeliverySeed(`${seedKey}|${salt}`) % 1000) / 1000;
}

function pickPhoneDeliveryNoteStickers(order) {
    const level = PHONE_DELIVERY_NOTE_STICKERS[order && order.stickerLevel] ? order.stickerLevel : 'neutral';
    const pool = PHONE_DELIVERY_NOTE_STICKERS[level] || [];
    if (!pool.length) return [];

    const seed = hashPhoneDeliverySeed(`${order && order.id ? order.id : ''}|${level}|${order && order.shopName ? order.shopName : ''}`);
    const count = pool.length > 1 ? 1 + (seed % 2) : 1;
    const selected = [];

    for (let index = 0; index < count; index += 1) {
        let pickIndex = (seed + index * 7) % pool.length;
        let candidate = pool[pickIndex];
        let guard = 0;
        while (selected.includes(candidate) && guard < pool.length) {
            pickIndex = (pickIndex + 1) % pool.length;
            candidate = pool[pickIndex];
            guard += 1;
        }
        if (candidate && !selected.includes(candidate)) {
            selected.push(candidate);
        }
    }

    return selected;
}

function renderPhoneDeliveryNoteStickers(order) {
    const container = document.getElementById('phone-delivery-detail-stickers');
    if (!container) return;

    container.innerHTML = '';
    const stickers = pickPhoneDeliveryNoteStickers(order);
    if (!stickers.length) return;

    const seedKey = `${order && order.id ? order.id : ''}|stickers|${stickers.length}`;
    let layouts = [];

    if (stickers.length === 1) {
        layouts = [{
            width: 54 + Math.round(phoneDeliverySeedRatio(seedKey, 'width') * 24),
            top: -2 + Math.round(phoneDeliverySeedRatio(seedKey, 'top') * 16),
            right: -4 + Math.round(phoneDeliverySeedRatio(seedKey, 'right') * 18),
            rotate: -18 + Math.round(phoneDeliverySeedRatio(seedKey, 'rotate') * 36),
            zIndex: 2
        }];
    } else {
        const mode = Math.floor(phoneDeliverySeedRatio(seedKey, 'mode') * 3);
        const largeWidth = 58 + Math.round(phoneDeliverySeedRatio(seedKey, 'largeWidth') * 24);
        const smallWidth = 42 + Math.round(phoneDeliverySeedRatio(seedKey, 'smallWidth') * 22);

        if (mode === 0) {
            const first = {
                width: largeWidth,
                top: -2 + Math.round(phoneDeliverySeedRatio(seedKey, 'm0_t1') * 10),
                right: 2 + Math.round(phoneDeliverySeedRatio(seedKey, 'm0_r1') * 10),
                rotate: -10 + Math.round(phoneDeliverySeedRatio(seedKey, 'm0_rot1') * 24),
                zIndex: 1
            };
            const overlapShift = Math.round(first.width * 0.42);
            const second = {
                width: smallWidth,
                top: first.top + 18 + Math.round(phoneDeliverySeedRatio(seedKey, 'm0_t2') * 14),
                right: first.right + overlapShift - 8,
                rotate: -22 + Math.round(phoneDeliverySeedRatio(seedKey, 'm0_rot2') * 34),
                zIndex: 2
            };
            layouts = [first, second];
        } else if (mode === 1) {
            const back = {
                width: smallWidth + 8,
                top: 6 + Math.round(phoneDeliverySeedRatio(seedKey, 'm1_t1') * 12),
                right: 34 + Math.round(phoneDeliverySeedRatio(seedKey, 'm1_r1') * 14),
                rotate: -28 + Math.round(phoneDeliverySeedRatio(seedKey, 'm1_rot1') * 18),
                zIndex: 1
            };
            const front = {
                width: largeWidth,
                top: -4 + Math.round(phoneDeliverySeedRatio(seedKey, 'm1_t2') * 8),
                right: 0 + Math.round(phoneDeliverySeedRatio(seedKey, 'm1_r2') * 8),
                rotate: 4 + Math.round(phoneDeliverySeedRatio(seedKey, 'm1_rot2') * 18),
                zIndex: 2
            };
            layouts = [back, front];
        } else {
            const first = {
                width: largeWidth - 2,
                top: 0 + Math.round(phoneDeliverySeedRatio(seedKey, 'm2_t1') * 12),
                right: 8 + Math.round(phoneDeliverySeedRatio(seedKey, 'm2_r1') * 8),
                rotate: 8 + Math.round(phoneDeliverySeedRatio(seedKey, 'm2_rot1') * 18),
                zIndex: 2
            };
            const overlapShift = Math.round(first.width * 0.48);
            const second = {
                width: smallWidth,
                top: first.top + 22 + Math.round(phoneDeliverySeedRatio(seedKey, 'm2_t2') * 10),
                right: first.right + overlapShift - 4,
                rotate: -18 + Math.round(phoneDeliverySeedRatio(seedKey, 'm2_rot2') * 22),
                zIndex: 1
            };
            layouts = [first, second];
        }
    }

    stickers.forEach((url, index) => {
        const layout = layouts[index] || layouts[layouts.length - 1];
        const image = document.createElement('img');
        image.className = 'phone-delivery-note-sticker';
        image.src = url;
        image.alt = '';
        image.loading = 'lazy';
        image.referrerPolicy = 'no-referrer';
        image.style.width = `${layout.width}px`;
        image.style.top = `${layout.top}px`;
        image.style.right = `${layout.right}px`;
        image.style.transform = `rotate(${layout.rotate}deg)`;
        image.style.zIndex = String(layout.zIndex || index + 1);
        container.appendChild(image);
    });
}

function renderPhoneDeliveryFeatured(order) {
    const featuredCard = document.getElementById('phone-delivery-featured-card');
    const featuredStatus = document.getElementById('phone-delivery-featured-status');
    const featuredIcon = document.getElementById('phone-delivery-featured-icon');
    const featuredName = document.getElementById('phone-delivery-featured-name');
    const featuredSummary = document.getElementById('phone-delivery-featured-summary');
    const featuredCourier = document.querySelector('#phone-delivery-featured-courier span');
    if (!featuredCard || !order) return;

    featuredCard.dataset.orderId = order.id;
    if (featuredStatus) featuredStatus.textContent = order.heroStatus;
    if (featuredIcon) featuredIcon.innerHTML = `<i class="${escapePhoneDeliveryHtml(order.icon)}"></i>`;
    if (featuredName) featuredName.innerHTML = `${escapePhoneDeliveryHtml(order.shopName)}<br>${escapePhoneDeliveryHtml(order.eta)}`;
    if (featuredSummary) featuredSummary.textContent = order.summary;
    if (featuredCourier) featuredCourier.textContent = order.courier;
}

function renderPhoneDeliveryShopCardList(containerId, shops) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!Array.isArray(shops) || !shops.length) {
        container.innerHTML = '<div class="phone-delivery-empty">还没有可展示的商家记录。</div>';
        return;
    }

    container.innerHTML = '';
    shops.forEach(shop => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'list-card interactive';
        button.setAttribute('style', 'background: var(--surface); padding: 16px; border-radius: 20px; border: 1px solid var(--border); border-bottom: none;');
        button.innerHTML = `
            <div class="card-image" style="background: var(--bg-color); width: 60px; height: 60px;"><i class="${escapePhoneDeliveryHtml(shop.icon)}"></i></div>
            <div class="card-info" style="justify-content: center;">
                <div class="card-head">
                    <div class="card-title">${escapePhoneDeliveryHtml(shop.name)}</div>
                </div>
                <div class="card-meta">${escapePhoneDeliveryHtml(shop.meta)}</div>
            </div>
        `;

        button.addEventListener('click', event => {
            phoneDeliveryAddRipple(event, button);
            openPhoneDeliveryShopInfoModal(shop);
        });

        container.appendChild(button);
    });
}

function renderPhoneDeliveryOrderList(orders) {
    const container = document.getElementById('phone-delivery-order-list');
    if (!container) return;

    if (!Array.isArray(orders) || !orders.length) {
        container.innerHTML = '<div class="phone-delivery-empty">当前联系人还没有外卖订单记录。</div>';
        return;
    }

    container.innerHTML = '';
    orders.forEach(order => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'list-card interactive';
        button.innerHTML = `
            <div class="card-image"><i class="${escapePhoneDeliveryHtml(order.icon)}"></i></div>
            <div class="card-info">
                <div class="card-head">
                    <div class="card-title">${escapePhoneDeliveryHtml(order.shopName)}</div>
                    <div class="card-status">${escapePhoneDeliveryHtml(order.statusLabel)}</div>
                </div>
                <div class="card-meta">${escapePhoneDeliveryHtml(`${order.itemCount} 件 · ${order.time}`)}</div>
                <div class="card-footer">
                    <div class="card-price">${escapePhoneDeliveryHtml(formatPhoneDeliveryPrice(order.total))}</div>
                    <div class="card-action interactive">${escapePhoneDeliveryHtml(order.active ? 'Track Progress' : 'Reorder')}</div>
                </div>
            </div>
        `;
        button.addEventListener('click', event => {
            phoneDeliveryAddRipple(event, button);
            openPhoneDeliveryOrderDetail(order.id);
        });
        container.appendChild(button);
    });
}

function renderPhoneDeliveryDetail(order) {
    if (!order) return;

    const noteCard = document.querySelector('#phone-delivery .phone-delivery-note-card');
    const detailNoteTitle = document.getElementById('phone-delivery-detail-note-title');
    const detailIcon = document.getElementById('phone-delivery-detail-icon');
    const detailShopName = document.getElementById('phone-delivery-detail-shop-name');
    const detailStatus = document.getElementById('phone-delivery-detail-status');
    const detailPreview = document.getElementById('phone-delivery-detail-preview');
    const detailItems = document.getElementById('phone-delivery-detail-items');
    const detailSubtotal = document.getElementById('phone-delivery-detail-subtotal');
    const detailFee = document.getElementById('phone-delivery-detail-fee');
    const detailTotal = document.getElementById('phone-delivery-detail-total');
    const detailRecipient = document.getElementById('phone-delivery-detail-recipient');
    const detailAddress = document.getElementById('phone-delivery-detail-address');
    const detailDeliveryStatus = document.getElementById('phone-delivery-detail-delivery-status');
    const detailOrderId = document.getElementById('phone-delivery-detail-order-id');
    const detailTime = document.getElementById('phone-delivery-detail-time');
    const detailNote = document.getElementById('phone-delivery-detail-note');
    const detailAction = document.getElementById('phone-delivery-detail-action');

    if (noteCard) {
        noteCard.classList.remove('note-grid', 'note-ruled', 'note-plain-yellow');
        noteCard.classList.add(PHONE_DELIVERY_REVIEW_STYLE_CLASS_MAP[order.reviewStyle] || 'note-grid');
    }

    if (detailIcon) detailIcon.innerHTML = `<i class="${escapePhoneDeliveryHtml(order.icon)}"></i>`;
    if (detailShopName) detailShopName.textContent = order.shopName;
    if (detailStatus) detailStatus.textContent = order.statusLabel;
    if (detailNoteTitle) detailNoteTitle.textContent = order.reviewText ? `${order.ratingLevel || '订单'}评价` : 'Order Update';
    if (detailPreview) detailPreview.textContent = order.reviewText || order.preview || order.trackHint || order.deliveryStatus || 'Order status updated.';
    if (detailSubtotal) detailSubtotal.textContent = formatPhoneDeliveryPrice(order.subtotal);
    if (detailFee) detailFee.textContent = formatPhoneDeliveryPrice(order.deliveryFee);
    if (detailTotal) detailTotal.textContent = formatPhoneDeliveryPrice(order.total);
    if (detailRecipient) detailRecipient.textContent = order.recipientPhone ? `${order.recipient} · ${order.recipientPhone}` : order.recipient;
    if (detailAddress) detailAddress.textContent = order.address;
    if (detailDeliveryStatus) detailDeliveryStatus.textContent = order.deliveryStatus;
    if (detailOrderId) detailOrderId.textContent = order.orderId;
    if (detailTime) detailTime.textContent = order.time;
    if (detailNote) detailNote.textContent = order.note;
    if (detailAction) detailAction.textContent = order.statusKey === 'completed' ? 'Reorder' : 'Track Progress';
    renderPhoneDeliveryNoteStickers(order);

    if (detailItems) {
        detailItems.innerHTML = '';
        order.items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'detail-item-row';
            row.innerHTML = `
                <div>
                    <div class="item-name">${escapePhoneDeliveryHtml(item.name)}</div>
                    <div class="item-qty">x ${escapePhoneDeliveryHtml(item.count)}</div>
                </div>
                <div class="item-price">${escapePhoneDeliveryHtml(formatPhoneDeliveryPrice(item.price * item.count))}</div>
            `;
            detailItems.appendChild(row);
        });
    }
}

function closePhoneDeliveryShopInfoModal() {
    const modal = document.getElementById('phone-delivery-shop-modal');
    const actionBtn = document.getElementById('phone-delivery-shop-modal-action');
    if (actionBtn) actionBtn.dataset.orderId = '';
    phoneDeliveryRuntime.activeShop = null;
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
}

function openPhoneDeliveryShopInfoModal(shop) {
    const modal = document.getElementById('phone-delivery-shop-modal');
    if (!modal || !shop) return;

    const icon = document.getElementById('phone-delivery-shop-modal-icon');
    const name = document.getElementById('phone-delivery-shop-modal-name');
    const category = document.getElementById('phone-delivery-shop-modal-category');
    const badge = document.getElementById('phone-delivery-shop-modal-badge');
    const meta = document.getElementById('phone-delivery-shop-modal-meta');
    const orderCount = document.getElementById('phone-delivery-shop-modal-order-count');
    const avgSpend = document.getElementById('phone-delivery-shop-modal-avg-spend');
    const lastOrder = document.getElementById('phone-delivery-shop-modal-last-order');
    const address = document.getElementById('phone-delivery-shop-modal-address');
    const items = document.getElementById('phone-delivery-shop-modal-items');
    const reason = document.getElementById('phone-delivery-shop-modal-reason');
    const actionBtn = document.getElementById('phone-delivery-shop-modal-action');
    const card = modal.querySelector('.shop-info-card');

    if (icon) icon.innerHTML = `<i class="${escapePhoneDeliveryHtml(shop.icon || 'ri-store-2-line')}"></i>`;
    if (name) name.textContent = normalizePhoneDeliveryText(shop.name, '店铺信息');
    if (category) category.textContent = normalizePhoneDeliveryText(shop.category, '健康轻食');
    if (address) address.textContent = normalizePhoneDeliveryText(shop.commonAddress, '上海市静安区');
    if (badge) {
        const badgeText = normalizePhoneDeliveryText(shop.sourceLabelCn, '常点');
        badge.textContent = badgeText.endsWith('店铺') ? badgeText : `${badgeText}店铺`;
        badge.dataset.source = normalizePhoneDeliveryText(shop.sourceType, 'recommendation');
    }
    if (meta) meta.textContent = '';
    if (orderCount) orderCount.textContent = `${Math.max(1, Math.round(Number(shop.orderCount) || 1))} 次`;
    if (avgSpend) avgSpend.textContent = formatPhoneDeliveryPrice(Math.max(0, Number(shop.avgSpend) || 0));
    if (lastOrder) lastOrder.innerHTML = buildPhoneDeliveryPopupTimeHtml(shop.lastOrderedAt);
    if (items) items.innerHTML = buildPhoneDeliveryPopupItemsHtml(shop.commonItems);
    if (reason) reason.textContent = buildPhoneDeliveryPopupNoteText(shop);
    if (actionBtn) {
        actionBtn.dataset.orderId = normalizePhoneDeliveryText(shop.latestOrderId, '');
        actionBtn.textContent = shop.latestOrderId ? '查看完整订单' : '前往订单页';
    }
    if (card) card.scrollTop = 0;

    phoneDeliveryRuntime.activeShop = shop;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function closePhoneDeliveryOrderDetail() {
    const detail = document.getElementById('phone-delivery-detail');
    if (!detail) return;
    detail.classList.remove('show');
    detail.setAttribute('aria-hidden', 'true');
}

function openPhoneDeliveryOrderDetail(orderId) {
    const order = getPhoneDeliveryOrderById(orderId);
    const detail = document.getElementById('phone-delivery-detail');
    if (!order || !detail) return;
    closePhoneDeliveryShopInfoModal();
    renderPhoneDeliveryDetail(order);
    detail.classList.add('show');
    detail.setAttribute('aria-hidden', 'false');
}

function switchPhoneDeliveryPage(page) {
    const pageKey = PHONE_DELIVERY_PAGE_META[page] ? page : 'home';
    phoneDeliveryRuntime.activePage = pageKey;
    closePhoneDeliveryShopInfoModal();

    document.querySelectorAll('#phone-delivery .page-view').forEach(view => {
        view.classList.toggle('active', view.dataset.page === pageKey);
    });
    document.querySelectorAll('#phone-delivery .bottom-nav .nav-item').forEach(button => {
        button.classList.toggle('active', button.dataset.page === pageKey);
    });
    phoneDeliverySyncNavIcons();

    const headerTitle = document.getElementById('phone-delivery-header-title');
    const headerSubtitle = document.getElementById('phone-delivery-header-subtitle');
    const headerBox = document.getElementById('phone-delivery-page-header');
    const pageMeta = PHONE_DELIVERY_PAGE_META[pageKey];
    if (headerTitle) headerTitle.textContent = pageMeta.title;
    if (headerSubtitle) headerSubtitle.textContent = pageMeta.subtitle;

    const targetPage = document.querySelector(`#phone-delivery .page-view[data-page="${pageKey}"]`);
    phoneDeliveryRestartAnimations(targetPage);
    phoneDeliveryRestartAnimations(headerBox);
}

function bindPhoneDeliveryApp() {
    if (phoneDeliveryRuntime.bound) return;

    const screen = document.getElementById('phone-delivery');
    const pageHeaderBack = document.getElementById('phone-delivery-page-header');
    const detailBackBtn = document.getElementById('phone-delivery-detail-back');
    const detailTitleBack = document.getElementById('phone-delivery-detail-title');
    const detailActionBtn = document.getElementById('phone-delivery-detail-action');
    const featuredCard = document.getElementById('phone-delivery-featured-card');
    const shopModalBackdrop = document.getElementById('phone-delivery-shop-modal-backdrop');
    const shopModalClose = document.getElementById('phone-delivery-shop-modal-close');
    const shopModalDismiss = document.getElementById('phone-delivery-shop-modal-dismiss');
    const shopModalAction = document.getElementById('phone-delivery-shop-modal-action');
    if (!screen) return;

    if (pageHeaderBack) {
        const closeScreen = event => {
            phoneDeliveryAddRipple(event, pageHeaderBack);
            closePhoneDeliveryShopInfoModal();
            closePhoneDeliveryOrderDetail();
            screen.classList.add('hidden');
        };
        pageHeaderBack.addEventListener('click', closeScreen);
        pageHeaderBack.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                closeScreen(event);
            }
        });
    }

    if (detailBackBtn) {
        detailBackBtn.addEventListener('click', event => {
            phoneDeliveryAddRipple(event, detailBackBtn);
            closePhoneDeliveryOrderDetail();
        });
    }

    if (detailTitleBack) {
        const closeDetail = event => {
            phoneDeliveryAddRipple(event, detailTitleBack);
            closePhoneDeliveryOrderDetail();
        };
        detailTitleBack.addEventListener('click', closeDetail);
        detailTitleBack.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                closeDetail(event);
            }
        });
    }

    if (detailActionBtn) {
        detailActionBtn.addEventListener('click', event => {
            phoneDeliveryAddRipple(event, detailActionBtn);
            closePhoneDeliveryOrderDetail();
            switchPhoneDeliveryPage('orders');
        });
    }

    if (shopModalBackdrop) {
        shopModalBackdrop.addEventListener('click', () => {
            closePhoneDeliveryShopInfoModal();
        });
    }

    if (shopModalClose) {
        shopModalClose.addEventListener('click', event => {
            phoneDeliveryAddRipple(event, shopModalClose);
            closePhoneDeliveryShopInfoModal();
        });
    }

    if (shopModalDismiss) {
        shopModalDismiss.addEventListener('click', event => {
            phoneDeliveryAddRipple(event, shopModalDismiss);
            closePhoneDeliveryShopInfoModal();
        });
    }

    if (shopModalAction) {
        shopModalAction.addEventListener('click', event => {
            phoneDeliveryAddRipple(event, shopModalAction);
            const orderId = normalizePhoneDeliveryText(shopModalAction.dataset.orderId, '');
            closePhoneDeliveryShopInfoModal();
            switchPhoneDeliveryPage('orders');
            if (orderId) openPhoneDeliveryOrderDetail(orderId);
        });
    }

    if (featuredCard) {
        featuredCard.addEventListener('click', event => {
            phoneDeliveryAddRipple(event, featuredCard);
            const orderId = featuredCard.dataset.orderId;
            if (orderId) openPhoneDeliveryOrderDetail(orderId);
        });
    }

    document.querySelectorAll('#phone-delivery .bottom-nav .nav-item').forEach(button => {
        button.addEventListener('click', event => {
            phoneDeliveryAddRipple(event, button);
            switchPhoneDeliveryPage(button.dataset.page);
            closePhoneDeliveryOrderDetail();
        });
    });

    document.querySelectorAll('#phone-delivery .nav-pills .pill').forEach(button => {
        button.addEventListener('click', event => {
            phoneDeliveryAddRipple(event, button);
            document.querySelectorAll('#phone-delivery .nav-pills .pill').forEach(item => item.classList.remove('active'));
            button.classList.add('active');
        });
    });

    document.querySelectorAll('#phone-delivery .utility-item').forEach(item => {
        item.addEventListener('click', event => phoneDeliveryAddRipple(event, item));
    });

    document.querySelectorAll('#phone-delivery .profile-btn').forEach(item => {
        item.addEventListener('click', event => phoneDeliveryAddRipple(event, item));
    });

    document.querySelectorAll('#phone-delivery .featured-card .btn-track').forEach(item => {
        item.addEventListener('click', event => {
            event.stopPropagation();
            phoneDeliveryAddRipple(event, item);
            const orderId = featuredCard && featuredCard.dataset ? featuredCard.dataset.orderId : '';
            if (orderId) openPhoneDeliveryOrderDetail(orderId);
        });
    });

    phoneDeliveryRuntime.bound = true;
}

function refreshPhoneDeliveryApp(contactId = currentCheckPhoneContactId) {
    const screen = document.getElementById('phone-delivery');
    if (!screen) return;

    bindPhoneDeliveryApp();

    const contact = getPhoneDeliveryContact(contactId);
    const deliveryData = getPhoneDeliveryData(contactId);
    const orders = buildPhoneDeliveryOrders(contactId);
    const featuredOrder = orders.find(order => order.active) || orders[0] || null;
    phoneDeliveryRuntime.orders = orders;
    phoneDeliveryRuntime.featuredOrderId = featuredOrder ? featuredOrder.id : '';

    const addressValue = document.getElementById('phone-delivery-address-value');
    const noteValue = document.getElementById('phone-delivery-note-value');
    const primaryAddress = phoneDeliveryFormatAddressEntry(getPhoneDeliveryPrimaryAddressEntry(deliveryData));
    const primaryTasteNote = getPhoneDeliveryPrimaryTasteNote(deliveryData);
    if (addressValue) addressValue.textContent = primaryAddress || getPhoneDeliveryAddress(contact);
    if (noteValue) noteValue.textContent = (primaryTasteNote && primaryTasteNote.text) || getPhoneDeliveryNote(contact);

    renderPhoneDeliveryFeatured(featuredOrder);
    renderPhoneDeliveryOrderList(orders);

    const collections = buildPhoneDeliveryShopCollections(orders, deliveryData);
    renderPhoneDeliveryShopCardList('phone-delivery-favorites-list', collections.favorites);
    renderPhoneDeliveryShopCardList('phone-delivery-recommend-list', collections.recommendations);

    closePhoneDeliveryShopInfoModal();
    closePhoneDeliveryOrderDetail();
}

function openPhoneDeliveryApp() {
    const screen = document.getElementById('phone-delivery');
    if (!screen) return;

    bindPhoneDeliveryApp();
    phoneDeliveryRuntime.activePage = 'home';
    refreshPhoneDeliveryApp(currentCheckPhoneContactId);
    switchPhoneDeliveryPage('home');
    phoneDeliverySyncNavIcons();
    screen.classList.remove('hidden');
}

function phoneParcelEscapeHtml(value) {
    return phoneFilesEscapeHtml(value == null ? '' : String(value));
}

function normalizePhoneParcelStatusColor(value, fallback = 'green') {
    const raw = normalizePhoneDeliveryText(value, fallback).toLowerCase();
    if (['green', 'orange', 'red'].includes(raw)) return raw;
    if (/已签收|已送达|delivered|signed/.test(raw)) return 'green';
    if (/异常|退回|拒收|exception|failed/.test(raw)) return 'red';
    if (/运输|在途|派送|transit|shipping|delivery/.test(raw)) return 'orange';
    return fallback;
}

function normalizePhoneParcelTags(value, fallback = []) {
    const defaults = Array.isArray(fallback) ? fallback.filter(Boolean).map(item => normalizePhoneDeliveryText(item, '')).filter(Boolean) : [];
    if (Array.isArray(value)) {
        const tags = value.map(item => normalizePhoneDeliveryText(item, '')).filter(Boolean);
        return tags.length ? tags.slice(0, 4) : defaults;
    }
    const text = normalizePhoneDeliveryText(value, '');
    if (!text) return defaults;
    const tags = text.split(/[、,，|/]/).map(item => item.trim()).filter(Boolean);
    return tags.length ? tags.slice(0, 4) : defaults;
}

function createDefaultPhoneParcelData(contact) {
    const recipient = getPhoneDeliveryRecipient(contact);
    const recipientPhone = maskPhoneDeliveryPhone(getPhoneDeliveryRecipientPhone(contact));
    const address = getPhoneDeliveryAddress(contact) || '玫瑰公寓 2201室';
    return {
        featured_card: {
            status_label: 'DELIVERED',
            status_meta: '03:15 AM',
            status_color: 'green',
            title: '配件 (Accessories)',
            receiver: recipient || 'Q女士',
            address: `${address} (物业代收)`,
            tags: ['深夜签收', '非默认地址', '隐私面单']
        },
        list_items: [
            {
                status_label: 'TRANSIT',
                status_meta: 'ZTO',
                status_color: 'orange',
                title: '生活用品',
                subtitle: `送至：${address}`,
                badge: '已改址'
            },
            {
                status_label: 'EXCEPTION',
                status_meta: 'SF',
                status_color: 'red',
                title: '高端礼盒',
                subtitle: '拒收退回中',
                badge: '退回'
            }
        ],
        detail: {
            hero_icon: 'ri-box-3-line',
            hero_status: '已签收',
            hero_track: 'SF EXPRESS · SF20984***',
            note: '“直接塞消防栓里，别按门铃，别打电话。”',
            timeline: [
                { time: '03:15 AM', title: '已签收', desc: `${address} 物业夜间值班室代收`, active: true },
                { time: '02:30 AM', title: '派送中', desc: '深夜特派员 正在为您派件', active: false },
                { time: 'YEST', title: '离开转运中心', desc: `发往 ${address}`, active: false }
            ],
            info: {
                receiver: `${recipient || 'Q女士'} (${recipientPhone})`,
                address,
                content: '配件 (模糊化)',
                sender: '隐私发件人'
            }
        },
        addresses: [
            { title: address, count_label: '15 TIMES', common_receiver: recipient || 'Q女士', last_seen: 'Today, 03:15 AM', tags: ['Late Night', 'Hidden Item'] },
            { title: '南区 丰巢快递柜', count_label: '28 TIMES', common_receiver: '李先生', last_seen: 'Last Week', tags: ['Self Pickup', 'Timeout Frequent'] },
            { title: '中心医院 住院部代收', count_label: '3 TIMES', common_receiver: '家属代收', last_seen: '2 Months Ago', tags: ['Others Signed'] }
        ]
    };
}

function normalizePhoneParcelListItem(item, index, fallback) {
    const source = item && typeof item === 'object' ? item : {};
    const defaults = fallback && typeof fallback === 'object' ? fallback : {};
    return {
        status_label: normalizePhoneDeliveryText(source.status_label || source.status || defaults.status_label, index === 0 ? 'TRANSIT' : 'DELIVERED').toUpperCase(),
        status_meta: normalizePhoneDeliveryText(source.status_meta || source.courier || source.meta || defaults.status_meta, index === 0 ? 'ZTO' : 'SF'),
        status_color: normalizePhoneParcelStatusColor(source.status_color || source.status || defaults.status_color, index === 0 ? 'orange' : 'green'),
        title: normalizePhoneDeliveryText(source.title || source.content || source.package_title || defaults.title, `包裹 ${index + 1}`),
        subtitle: normalizePhoneDeliveryText(source.subtitle || source.address_hint || source.desc || defaults.subtitle, '送至：常用地址'),
        badge: normalizePhoneDeliveryText(source.badge || source.tag || defaults.badge, '')
    };
}

function normalizePhoneParcelTimelineEntry(item, index, fallback) {
    const source = item && typeof item === 'object' ? item : {};
    const defaults = fallback && typeof fallback === 'object' ? fallback : {};
    return {
        time: normalizePhoneDeliveryText(source.time || defaults.time, index === 0 ? '03:15 AM' : 'YEST'),
        title: normalizePhoneDeliveryText(source.title || defaults.title, index === 0 ? '已签收' : `物流节点 ${index + 1}`),
        desc: normalizePhoneDeliveryText(source.desc || source.description || defaults.desc, '物流已更新'),
        active: normalizePhoneDeliveryBoolean(source.active, !!defaults.active && index === 0)
    };
}

function normalizePhoneParcelAddressEntry(item, index, fallback) {
    const source = item && typeof item === 'object' ? item : {};
    const defaults = fallback && typeof fallback === 'object' ? fallback : {};
    return {
        title: normalizePhoneDeliveryText(source.title || source.address || defaults.title, `地址 ${index + 1}`),
        count_label: normalizePhoneDeliveryText(source.count_label || source.count || source.used_count || defaults.count_label, `${Math.max(2, 12 - index * 4)} TIMES`).toUpperCase(),
        common_receiver: normalizePhoneDeliveryText(source.common_receiver || source.receiver || defaults.common_receiver, '代收人'),
        last_seen: normalizePhoneDeliveryText(source.last_seen || source.last_time || defaults.last_seen, 'Recently'),
        tags: normalizePhoneParcelTags(source.tags, defaults.tags || [])
    };
}

function normalizePhoneParcelData(raw, contact) {
    const defaults = createDefaultPhoneParcelData(contact);
    const source = raw && typeof raw === 'object' ? raw : {};
    const featuredSource = source.featured_card && typeof source.featured_card === 'object' ? source.featured_card : {};
    const detailSource = source.detail && typeof source.detail === 'object' ? source.detail : {};
    const infoSource = detailSource.info && typeof detailSource.info === 'object' ? detailSource.info : {};

    const featured = {
        status_label: normalizePhoneDeliveryText(featuredSource.status_label || featuredSource.status, defaults.featured_card.status_label).toUpperCase(),
        status_meta: normalizePhoneDeliveryText(featuredSource.status_meta || featuredSource.time || featuredSource.meta, defaults.featured_card.status_meta),
        status_color: normalizePhoneParcelStatusColor(featuredSource.status_color || featuredSource.status, defaults.featured_card.status_color),
        title: normalizePhoneDeliveryText(featuredSource.title, defaults.featured_card.title),
        receiver: normalizePhoneDeliveryText(featuredSource.receiver || featuredSource.recipient, defaults.featured_card.receiver),
        address: normalizePhoneDeliveryText(featuredSource.address, defaults.featured_card.address),
        tags: normalizePhoneParcelTags(featuredSource.tags, defaults.featured_card.tags)
    };

    const listDefaults = Array.isArray(defaults.list_items) ? defaults.list_items : [];
    const listItems = (Array.isArray(source.list_items) ? source.list_items : listDefaults)
        .slice(0, 4)
        .map((item, index) => normalizePhoneParcelListItem(item, index, listDefaults[index] || listDefaults[0] || null));

    const detailDefaults = defaults.detail;
    const timelineDefaults = Array.isArray(detailDefaults.timeline) ? detailDefaults.timeline : [];
    const detail = {
        hero_icon: normalizePhoneDeliveryText(detailSource.hero_icon, detailDefaults.hero_icon),
        hero_status: normalizePhoneDeliveryText(detailSource.hero_status, detailDefaults.hero_status),
        hero_track: normalizePhoneDeliveryText(detailSource.hero_track, detailDefaults.hero_track),
        note: normalizePhoneDeliveryText(detailSource.note, detailDefaults.note),
        timeline: (Array.isArray(detailSource.timeline) ? detailSource.timeline : timelineDefaults)
            .slice(0, 5)
            .map((item, index) => normalizePhoneParcelTimelineEntry(item, index, timelineDefaults[index] || timelineDefaults[0] || null)),
        info: {
            receiver: normalizePhoneDeliveryText(infoSource.receiver, detailDefaults.info.receiver),
            address: normalizePhoneDeliveryText(infoSource.address, detailDefaults.info.address),
            content: normalizePhoneDeliveryText(infoSource.content, detailDefaults.info.content),
            sender: normalizePhoneDeliveryText(infoSource.sender, detailDefaults.info.sender)
        }
    };

    const addressDefaults = Array.isArray(defaults.addresses) ? defaults.addresses : [];
    const addresses = (Array.isArray(source.addresses) ? source.addresses : addressDefaults)
        .slice(0, 5)
        .map((item, index) => normalizePhoneParcelAddressEntry(item, index, addressDefaults[index] || addressDefaults[0] || null));

    return {
        featured_card: featured,
        list_items: listItems.length ? listItems : listDefaults,
        detail,
        addresses: addresses.length ? addresses : addressDefaults
    };
}

function normalizePhoneParcelAiPayload(raw, contact) {
    return normalizePhoneParcelData(raw, contact);
}

function getPhoneParcelStoreBucket(contactId) {
    const state = window.iphoneSimState || {};
    if (!state.phoneContent) state.phoneContent = {};
    if (!state.phoneContent[contactId]) state.phoneContent[contactId] = {};
    return state.phoneContent[contactId];
}

function getPhoneParcelData(contactId) {
    if (!contactId) return createDefaultPhoneParcelData(null);
    const bucket = getPhoneParcelStoreBucket(contactId);
    bucket.parcelData = normalizePhoneParcelData(bucket.parcelData, getPhoneDeliveryContact(contactId));
    return bucket.parcelData;
}

function setPhoneParcelData(contactId, parcelData) {
    const bucket = getPhoneParcelStoreBucket(contactId);
    bucket.parcelData = normalizePhoneParcelData(parcelData, getPhoneDeliveryContact(contactId));
    return bucket.parcelData;
}

function phoneParcelMatchesTab(item, tabIndex) {
    const status = normalizePhoneDeliveryText(item && item.status_label, '').toLowerCase();
    if (tabIndex === 1) return /transit|在途|运输|派送/.test(status);
    if (tabIndex === 2) return /delivered|已签收|已送达/.test(status);
    return true;
}

function renderPhoneParcelHome(parcelData) {
    const container = document.getElementById('phone-parcel-home-content');
    if (!container) return;

    const featured = parcelData.featured_card || createDefaultPhoneParcelData(null).featured_card;
    const items = (parcelData.list_items || []).filter(item => phoneParcelMatchesTab(item, phoneParcelRuntime.activeTabIndex));
    const listHtml = items.map(item => `
        <div class="glass-card" style="padding: 16px 20px;">
            <div class="meta-text" style="margin-bottom: 4px;">
                <span class="status-dot ${phoneParcelEscapeHtml(item.status_color)}"></span> ${phoneParcelEscapeHtml(item.status_label)} · ${phoneParcelEscapeHtml(item.status_meta)}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
                <div>
                    <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${phoneParcelEscapeHtml(item.title)}</div>
                    <div style="font-size: 13px; color: var(--text-sec);">${phoneParcelEscapeHtml(item.subtitle)}</div>
                </div>
                ${item.badge ? `<div class="mini-tag">${phoneParcelEscapeHtml(item.badge)}</div>` : ''}
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div id="phone-parcel-open-detail" class="glass-card" role="button" tabindex="0" aria-label="查看快递详情">
            <div class="meta-text">
                <span class="status-dot ${phoneParcelEscapeHtml(featured.status_color)}"></span> ${phoneParcelEscapeHtml(featured.status_label)} · ${phoneParcelEscapeHtml(featured.status_meta)}
            </div>
            <div class="pkg-title">${phoneParcelEscapeHtml(featured.title)}</div>
            <div class="pkg-desc">
                <i class="ri-user-smile-line"></i> 收件：${phoneParcelEscapeHtml(featured.receiver)}<br>
                <i class="ri-map-pin-line"></i> ${phoneParcelEscapeHtml(featured.address)}
            </div>
            <div class="tag-row">
                ${(featured.tags || []).map((tag, index) => `<div class="mini-tag${index === 0 ? ' dark' : ''}">${phoneParcelEscapeHtml(tag)}</div>`).join('')}
            </div>
        </div>
        ${listHtml}
    `;

    bindPhoneParcelClickable(document.getElementById('phone-parcel-open-detail'), () => {
        switchPhoneParcelView('detail');
    });
}

function renderPhoneParcelDetail(parcelData) {
    const container = document.getElementById('phone-parcel-detail-content');
    if (!container) return;
    const detail = parcelData.detail || createDefaultPhoneParcelData(null).detail;
    const timelineHtml = (detail.timeline || []).map(item => `
        <div class="mt-item${item.active ? ' active' : ''}">
            <div class="mt-time">${phoneParcelEscapeHtml(item.time)}</div>
            <div class="mt-dot"></div>
            <div class="mt-line"></div>
            <div class="mt-content">
                <div class="mt-title">${phoneParcelEscapeHtml(item.title)}</div>
                <div class="mt-desc">${phoneParcelEscapeHtml(item.desc)}</div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="detail-hero">
            <div class="hero-circle"><i class="${phoneParcelEscapeHtml(detail.hero_icon || 'ri-box-3-line')}"></i></div>
            <div class="hero-status">${phoneParcelEscapeHtml(detail.hero_status)}</div>
            <div class="hero-track">${phoneParcelEscapeHtml(detail.hero_track)}</div>
        </div>

        <div class="sticky-note">
            <i class="ri-chat-quote-line note-icon"></i>
            <div style="font-size: 12px; font-weight: 600; color: var(--text-sec); margin-bottom: 8px;">CONTACT NOTE</div>
            <div style="font-size: 15px; font-weight: 600; color: var(--text-main); line-height: 1.5;">${phoneParcelEscapeHtml(detail.note)}</div>
        </div>

        <div class="glass-card" style="padding: 24px 20px;">
            <div class="min-timeline">${timelineHtml}</div>
        </div>

        <div class="title-xl" style="font-size: 20px; margin: 32px 0 16px;">Information</div>

        <div class="glass-card info-list" style="padding: 12px 20px;">
            <div class="info-row">
                <div class="info-label">Receiver</div>
                <div class="info-val">${phoneParcelEscapeHtml(detail.info.receiver)}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Address</div>
                <div class="info-val">${phoneParcelEscapeHtml(detail.info.address)}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Content</div>
                <div class="info-val">${phoneParcelEscapeHtml(detail.info.content)}</div>
            </div>
            <div class="info-row" style="border: none;">
                <div class="info-label">Sender</div>
                <div class="info-val">${phoneParcelEscapeHtml(detail.info.sender)}</div>
            </div>
        </div>
    `;
}

function renderPhoneParcelAddresses(parcelData) {
    const container = document.getElementById('phone-parcel-address-list');
    if (!container) return;
    const addresses = parcelData.addresses || [];
    container.innerHTML = addresses.map(entry => `
        <div class="glass-card">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; gap: 12px;">
                <div style="font-size: 18px; font-weight: 700;">${phoneParcelEscapeHtml(entry.title)}</div>
                <div style="font-size: 12px; font-weight: 700; color: var(--text-sec); white-space: nowrap;">${phoneParcelEscapeHtml(entry.count_label)}</div>
            </div>
            <div style="font-size: 14px; color: var(--text-sec); margin-bottom: 16px; line-height: 1.5;">
                Common Receiver: ${phoneParcelEscapeHtml(entry.common_receiver)}<br>
                Last seen: ${phoneParcelEscapeHtml(entry.last_seen)}
            </div>
            <div class="tag-row">
                ${(entry.tags || []).map((tag, index) => `<div class="mini-tag${index === 0 ? ' dark' : ''}">${phoneParcelEscapeHtml(tag)}</div>`).join('')}
            </div>
        </div>
    `).join('');
}

function refreshPhoneParcelApp(contactId = currentCheckPhoneContactId) {
    const screen = document.getElementById('phone-parcel');
    if (!screen) return;
    const parcelData = getPhoneParcelData(contactId);
    renderPhoneParcelHome(parcelData);
    renderPhoneParcelDetail(parcelData);
    renderPhoneParcelAddresses(parcelData);
}

const phoneParcelRuntime = {
    bound: false,
    activeView: 'home',
    activeTabIndex: 0,
    resizeBound: false
};

function setPhoneParcelActiveTab(index = 0) {
    const screen = document.getElementById('phone-parcel');
    if (!screen) return;

    const tabs = Array.from(screen.querySelectorAll('.tab'));
    const indicator = document.getElementById('phone-parcel-tab-line');
    if (!tabs.length || !indicator) return;

    const safeIndex = Math.max(0, Math.min(index, tabs.length - 1));
    const activeTab = tabs[safeIndex];
    phoneParcelRuntime.activeTabIndex = safeIndex;

    tabs.forEach((tab, tabIndex) => {
        const isActive = tabIndex === safeIndex;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    renderPhoneParcelHome(getPhoneParcelData(currentCheckPhoneContactId));

    indicator.style.width = `${activeTab.offsetWidth}px`;
    indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
}

function switchPhoneParcelView(view = 'home') {
    const nextView = ['home', 'detail', 'address'].includes(view) ? view : 'home';
    const screen = document.getElementById('phone-parcel');
    if (!screen) return;

    phoneParcelRuntime.activeView = nextView;
    screen.querySelectorAll('.page').forEach(panel => {
        panel.classList.toggle('active', panel.id === `phone-parcel-view-${nextView}`);
    });

    if (nextView === 'home') {
        window.requestAnimationFrame(() => setPhoneParcelActiveTab(phoneParcelRuntime.activeTabIndex));
    }
}

function bindPhoneParcelClickable(element, handler) {
    if (!element) return;
    element.addEventListener('click', handler);
    element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handler(event);
        }
    });
}

function bindPhoneParcelApp() {
    const screen = document.getElementById('phone-parcel');
    if (!screen || phoneParcelRuntime.bound) return;

    const closeBtn = document.getElementById('phone-parcel-home-close');

    bindPhoneParcelClickable(closeBtn, () => {
        switchPhoneParcelView('home');
        screen.classList.add('hidden');
    });

    screen.querySelectorAll('[data-parcel-back]').forEach(button => {
        bindPhoneParcelClickable(button, () => {
            switchPhoneParcelView(button.dataset.parcelBack || 'home');
        });
    });

    screen.querySelectorAll('.tab').forEach(button => {
        bindPhoneParcelClickable(button, () => {
            setPhoneParcelActiveTab(Number(button.dataset.tabIndex || 0));
        });
    });

    if (!phoneParcelRuntime.resizeBound) {
        window.addEventListener('resize', () => {
            const parcelScreen = document.getElementById('phone-parcel');
            if (parcelScreen && !parcelScreen.classList.contains('hidden')) {
                setPhoneParcelActiveTab(phoneParcelRuntime.activeTabIndex);
            }
        });
        phoneParcelRuntime.resizeBound = true;
    }

    phoneParcelRuntime.bound = true;
}

function openPhoneParcelApp() {
    const screen = document.getElementById('phone-parcel');
    if (!screen) return;

    bindPhoneParcelApp();
    phoneParcelRuntime.activeView = 'home';
    phoneParcelRuntime.activeTabIndex = 0;
    refreshPhoneParcelApp(currentCheckPhoneContactId);
    switchPhoneParcelView('home');
    screen.classList.remove('hidden');
    window.requestAnimationFrame(() => setPhoneParcelActiveTab(0));
}

const PHONE_FILES_TEMPLATE_VERSION = 'v4';
const PHONE_FILES_V1_STYLE_TEXT = `
#phone-files,
#phone-files-content {
    background: #F2F2F7;
}
#phone-files-content {
    --ios-bg: #F2F2F7;
    --ios-list-bg: #FFFFFF;
    --ios-text: #000000;
    --ios-text-secondary: #8E8E93;
    --ios-blue: #007AFF;
    --ios-separator: rgba(60, 60, 67, 0.29);
    --ios-gray-bg: rgba(118, 118, 128, 0.12);
    --header-blur: rgba(242, 242, 247, 0.85);
    --icon-recent: #007AFF;
    --icon-scan: #34C759;
    --icon-download: #5856D6;
    --icon-zip: #FFCC00;
    --icon-hidden: #8E8E93;
    --icon-fav: #FF2D55;
    --icon-lock: #FF9500;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", sans-serif;
    color: var(--ios-text);
    width: 100%;
    height: 100%;
    overflow: hidden;
}
#phone-files-content,
#phone-files-content * {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
}
#phone-files-content .phone-files-app {
    width: 100%;
    height: 100%;
    background: var(--ios-bg);
    position: relative;
    overflow: hidden;
}
#phone-files-content .view-stack {
    width: 100%;
    height: 100%;
    position: relative;
}
#phone-files-content .view {
    position: absolute;
    inset: 0;
    background: var(--ios-bg);
    transition: transform 0.4s cubic-bezier(0.36, 0.66, 0.04, 1);
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 1;
    -ms-overflow-style: none;
    scrollbar-width: none;
}
#phone-files-content .view::-webkit-scrollbar {
    display: none;
}
#phone-files-content .view-main {
    transform: translateX(0);
    z-index: 1;
}
#phone-files-content .view-main.bg {
    transform: translateX(-30%);
}
#phone-files-content .view-detail {
    transform: translateX(100%);
    z-index: 5;
    box-shadow: -10px 0 20px rgba(0,0,0,0.05);
}
#phone-files-content .view-detail.active {
    transform: translateX(0);
}
#phone-files-content .view-detail.bg {
    transform: translateX(-30%);
}
#phone-files-content .view-folder {
    transform: translateX(100%);
    z-index: 8;
    box-shadow: -10px 0 20px rgba(0,0,0,0.05);
}
#phone-files-content .view-folder.active {
    transform: translateX(0);
}
#phone-files-content .view-folder.bg {
    transform: translateX(-30%);
}
#phone-files-content .view-file {
    transform: translateX(100%);
    z-index: 11;
    box-shadow: -10px 0 20px rgba(0,0,0,0.05);
}
#phone-files-content .view-file.active {
    transform: translateX(0);
}
#phone-files-content .header {
    position: sticky;
    top: 0;
    background: var(--header-blur);
    backdrop-filter: saturate(180%) blur(20px);
    -webkit-backdrop-filter: saturate(180%) blur(20px);
    z-index: 10;
    padding-bottom: 8px;
    border-bottom: 0.5px solid transparent;
    transition: border-bottom 0.2s;
}
#phone-files-content .header.scrolled {
    border-bottom: 0.5px solid var(--ios-separator);
}
#phone-files-content .nav-bar {
    height: 44px;
    display: flex;
    position: relative;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 16px;
    margin-top: max(40px, env(safe-area-inset-top));
    font-size: 17px;
}
#phone-files-content .nav-btn {
    color: var(--ios-blue);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    max-width: calc(50% - 34px);
    flex-shrink: 1;
    white-space: nowrap;
}
#phone-files-content .nav-btn span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
#phone-files-content .nav-btn.circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--ios-gray-bg);
    justify-content: center;
    flex-shrink: 0;
}
#phone-files-content .nav-title {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    max-width: calc(100% - 132px);
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    pointer-events: none;
}
#phone-files-content .header.scrolled .nav-title {
    opacity: 1;
}
#phone-files-content .large-title-container {
    padding: 4px 16px 8px;
    transition: transform 0.2s, opacity 0.2s, height 0.2s, padding 0.2s;
}
#phone-files-content .header.scrolled .large-title-container {
    transform: translateY(-10px);
    opacity: 0;
    pointer-events: none;
    height: 0;
    padding: 0 16px;
}
#phone-files-content .large-title {
    font-size: 34px;
    font-weight: 700;
    letter-spacing: 0.3px;
    line-height: 1.12;
    word-break: break-word;
    overflow-wrap: anywhere;
}
#phone-files-content #phone-files-file-big-title {
    font-size: clamp(28px, 7vw, 34px);
    letter-spacing: -0.02em;
}
#phone-files-content .large-title-en {
    font-size: 14px;
    font-weight: 400;
    color: var(--ios-text-secondary);
    vertical-align: middle;
}
#phone-files-content .search-container {
    padding: 0 16px;
    margin-top: 4px;
}
#phone-files-content .header.scrolled .search-container {
    display: none;
}
#phone-files-content .search-bar {
    background: var(--ios-gray-bg);
    border-radius: 10px;
    height: 36px;
    display: flex;
    align-items: center;
    padding: 0 8px;
    color: var(--ios-text-secondary);
}
#phone-files-content .search-bar i {
    font-size: 17px;
    margin-right: 6px;
}
#phone-files-content .search-bar input {
    border: none;
    background: transparent;
    font-size: 17px;
    width: 100%;
    outline: none;
    color: var(--ios-text);
}
#phone-files-content .search-bar input::placeholder {
    color: var(--ios-text-secondary);
}
#phone-files-content .files-main-content {
    padding-bottom: max(36px, env(safe-area-inset-bottom));
}
#phone-files-content .list-section {
    margin: 16px 16px 24px;
}
#phone-files-content .list-header {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 10px 16px;
    color: var(--ios-text);
}
#phone-files-content .list-block {
    background: var(--ios-list-bg);
    border-radius: 10px;
    overflow: hidden;
}
#phone-files-content .list-item {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    min-height: 44px;
    position: relative;
    cursor: pointer;
    background: var(--ios-list-bg);
}
#phone-files-content .list-item:active {
    background: #E5E5EA;
}

#phone-files-content .list-icon {
    width: 24px;
    font-size: 24px;
    margin-right: 14px;
    display: flex;
    justify-content: center;
}
#phone-files-content .list-text {
    flex: 1;
    font-size: 17px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}
#phone-files-content .list-value {
    color: var(--ios-text-secondary);
    display: flex;
    align-items: center;
    font-size: 17px;
}
#phone-files-content .list-value .chevron {
    font-size: 20px;
    color: #C7C7CC;
    margin-left: 6px;
}
#phone-files-content .detail-content {
    padding: 0 16px max(36px, env(safe-area-inset-bottom));
}
#phone-files-content .file-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px 12px;
    margin-top: 16px;
}
#phone-files-content .file-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    cursor: pointer;
}
#phone-files-content .file-box:active {
    opacity: 0.7;
}
#phone-files-content .file-box-icon {
    width: 70px;
    height: 70px;
    background: #fff;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    margin-bottom: 6px;
}
#phone-files-content .file-box-name {
    font-size: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-all;
}
#phone-files-content .file-box-hint {
    margin-top: 4px;
    font-size: 11px;
    line-height: 1.35;
    color: var(--ios-text-secondary);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-word;
}
#phone-files-content .file-detail-card {
    margin-top: 16px;
    background: rgba(255,255,255,0.96);
    border-radius: 22px;
    padding: 20px 18px;
    box-shadow: 0 12px 28px rgba(0,0,0,0.05);
}
#phone-files-content .file-detail-pill {
    display: inline-flex;
    align-items: center;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(0,122,255,0.1);
    color: var(--ios-blue);
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 12px;
}
#phone-files-content .file-detail-name {
    font-size: 24px;
    font-weight: 700;
    line-height: 1.2;
    word-break: break-word;
}
#phone-files-content .file-detail-meta {
    margin-top: 10px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--ios-text-secondary);
}
#phone-files-content .file-detail-summary {
    margin-top: 16px;
    font-size: 15px;
    line-height: 1.7;
    color: #3a3a3c;
}
#phone-files-content .file-detail-section-title {
    margin-top: 18px;
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.3px;
    color: var(--ios-text-secondary);
    text-transform: uppercase;
}
#phone-files-content .file-detail-content {
    font-size: 15px;
    line-height: 1.8;
    color: var(--ios-text);
    white-space: normal;
    word-break: break-word;
}
#phone-files-content .file-detail-content p,
#phone-files-content .file-detail-content ul,
#phone-files-content .file-detail-content ol,
#phone-files-content .file-detail-content blockquote,
#phone-files-content .file-detail-content table,
#phone-files-content .file-detail-content pre {
    margin: 0;
}
#phone-files-content .file-html-shell {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
#phone-files-content .file-html-card {
    background: #fff;
    border: 1px solid rgba(15,23,42,0.06);
    border-radius: 16px;
    padding: 14px;
    box-shadow: 0 6px 18px rgba(15,23,42,0.04);
}
#phone-files-content .file-html-card p + p,
#phone-files-content .file-html-card p + blockquote,
#phone-files-content .file-html-card ul + blockquote,
#phone-files-content .file-html-card table + p {
    margin-top: 10px;
}
#phone-files-content .file-html-card ul,
#phone-files-content .file-html-card ol {
    padding-left: 18px;
    line-height: 1.7;
}
#phone-files-content .file-html-card blockquote {
    padding: 10px 12px;
    border-left: 3px solid rgba(0,122,255,0.3);
    background: rgba(0,122,255,0.06);
    border-radius: 12px;
    color: #334155;
}
#phone-files-content .file-html-card table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    line-height: 1.6;
}
#phone-files-content .file-html-card th,
#phone-files-content .file-html-card td {
    text-align: left;
    padding: 10px 8px;
    border-bottom: 1px solid rgba(15,23,42,0.08);
    vertical-align: top;
}
#phone-files-content .file-html-card th {
    width: 84px;
    color: var(--ios-text-secondary);
    font-weight: 600;
}
#phone-files-content .file-html-note {
    padding: 14px 15px;
    border-radius: 16px;
    background: rgba(255,149,0,0.1);
    color: #7C4A03;
    line-height: 1.7;
}
#phone-files-content .file-visual-stage {
    min-height: 160px;
    border-radius: 14px;
    padding: 16px;
    display: flex;
    align-items: flex-end;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
}
#phone-files-content .status-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 60vh;
    text-align: center;
    padding: 40px;
}
#phone-files-content .status-icon {
    font-size: 60px;
    color: var(--ios-text-secondary);
    margin-bottom: 16px;
}
#phone-files-content .status-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
}
#phone-files-content .status-desc {
    font-size: 15px;
    color: var(--ios-text-secondary);
    line-height: 1.35;
}
#phone-files-content .auth-btn {
    color: var(--ios-blue);
    font-size: 17px;
    margin-top: 20px;
    cursor: pointer;
}
#phone-files-content .auth-btn:active {
    opacity: 0.5;
}
#phone-files-content button.nav-btn {
    border: none;
    background: transparent;
    font: inherit;
    padding: 0;
}
#phone-files-content .phone-files-generate-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
}
#phone-files-content .phone-files-generate-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 148px;
    background: rgba(255,255,255,0.96);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(60,60,67,0.1);
    border-radius: 12px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    overflow: hidden;
    z-index: 20;
}
#phone-files-content .phone-files-generate-menu.hidden {
    display: none;
}
#phone-files-content .phone-files-generate-menu button {
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
    font-size: 14px;
    color: var(--ios-text);
    padding: 12px 14px;
    cursor: pointer;
}
#phone-files-content .phone-files-generate-menu button + button {
    border-top: 0.5px solid var(--ios-separator);
}
#phone-files-content .phone-files-generate-menu button:active {
    background: rgba(0,0,0,0.05);
}
#phone-files-content .phone-files-generate-wrap.is-hidden {
    display: none;
}
#phone-files-content .files-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--ios-text-secondary);
    font-size: 15px;
    text-align: center;
    line-height: 1.5;
    min-height: 42vh;
    padding: 32px 20px;
}
#phone-files-content .hidden-folder-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 16px;
}
#phone-files-content .hidden-folder-card {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-radius: 16px;
    background: rgba(255,255,255,0.92);
    box-shadow: 0 10px 24px rgba(0,0,0,0.05);
    cursor: pointer;
}
#phone-files-content .hidden-folder-card:active {
    opacity: 0.72;
}
#phone-files-content .hidden-folder-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(0,122,255,0.12);
    color: #007AFF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 26px;
    flex-shrink: 0;
}
#phone-files-content .hidden-folder-main {
    min-width: 0;
    flex: 1;
}
#phone-files-content .hidden-folder-name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}
#phone-files-content .hidden-folder-name {
    min-width: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--ios-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
#phone-files-content .hidden-folder-lock {
    flex-shrink: 0;
    color: var(--icon-lock);
    font-size: 15px;
}
#phone-files-content .hidden-folder-count {
    margin-top: 4px;
    font-size: 13px;
    color: var(--ios-text-secondary);
}
#phone-files-content .hidden-folder-chevron {
    color: #C7C7CC;
    font-size: 22px;
    flex-shrink: 0;
}
`;

const PHONE_FILES_V1_TEMPLATE_HTML = `
<div class="phone-files-app">
    <div class="view-stack">
        <div class="view view-main" id="phone-files-main-view">
            <div class="header" id="phone-files-main-header">
                <div class="nav-bar">
                    <div class="nav-btn" data-action="close-files-app"><i class="ri-arrow-left-s-line" style="font-size:24px; vertical-align:middle; margin-left:-8px;"></i> 文件夹</div>
                    <div class="nav-title">浏览</div>
                    <button type="button" class="nav-btn circle phone-files-main-generate-btn" aria-label="生成文件内容"><i class="ri-more-fill"></i></button>
                </div>
                <div class="large-title-container">
                    <div class="large-title">浏览 <span class="large-title-en">Browse</span></div>
                </div>
                <div class="search-container">
                    <div class="search-bar">
                        <i class="ri-search-line"></i>
                        <input type="text" placeholder="搜索" readonly>
                        <i class="ri-mic-fill" style="color: var(--ios-text-secondary); margin-right:0; margin-left:auto;"></i>
                    </div>
                </div>
            </div>
            <div class="files-main-content" id="phone-files-main-sections"></div>
        </div>
        <div class="view view-detail" id="phone-files-detail-view">
            <div class="header" id="phone-files-detail-header">
                <div class="nav-bar">
                    <div class="nav-btn" data-action="back-to-files-main"><i class="ri-arrow-left-s-line" style="font-size:24px; vertical-align:middle; margin-left:-8px;"></i> 浏览</div>
                    <div class="nav-title" id="phone-files-small-title">目录</div>
                    <div class="phone-files-generate-wrap" id="phone-files-detail-generate-wrap">
                        <button type="button" class="nav-btn circle phone-files-detail-generate-btn" aria-label="生成当前分区"><i class="ri-more-fill"></i></button>
                        <div class="phone-files-generate-menu hidden" data-role="files-detail-generate-menu">
                            <button type="button" data-mode="replace">覆盖当前分区</button>
                            <button type="button" data-mode="merge">新增合并</button>
                        </div>
                    </div>
                </div>
                <div class="large-title-container">
                    <div class="large-title" id="phone-files-big-title">目录</div>
                </div>
            </div>
            <div class="detail-content" id="phone-files-detail-content"></div>
        </div>
        <div class="view view-folder" id="phone-files-folder-view">
            <div class="header" id="phone-files-folder-header">
                <div class="nav-bar">
                    <div class="nav-btn" data-action="back-to-files-detail"><i class="ri-arrow-left-s-line" style="font-size:24px; vertical-align:middle; margin-left:-8px;"></i> <span id="phone-files-folder-back-label">隐藏文件夹</span></div>
                    <div class="nav-title" id="phone-files-folder-small-title">文件夹</div>
                    <div class="nav-btn circle" style="opacity:0; pointer-events:none;"><i class="ri-more-fill"></i></div>
                </div>
                <div class="large-title-container">
                    <div class="large-title" id="phone-files-folder-big-title">文件夹</div>
                </div>
            </div>
            <div class="detail-content" id="phone-files-folder-content"></div>
        </div>
        <div class="view view-file" id="phone-files-file-view">
            <div class="header" id="phone-files-file-header">
                <div class="nav-bar">
                    <div class="nav-btn" data-action="back-to-files-file-prev"><i class="ri-arrow-left-s-line" style="font-size:24px; vertical-align:middle; margin-left:-8px;"></i> <span id="phone-files-file-back-label">目录</span></div>
                    <div class="nav-title" id="phone-files-file-small-title">文件</div>
                    <div class="nav-btn circle" style="opacity:0; pointer-events:none;"><i class="ri-more-fill"></i></div>
                </div>
                <div class="large-title-container">
                    <div class="large-title" id="phone-files-file-big-title">文件</div>
                </div>
            </div>
            <div class="detail-content" id="phone-files-file-content"></div>
        </div>
    </div>
</div>`;

const PHONE_FILES_BROWSE_SECTIONS = [
    {
        title: '位置',
        items: [
            { key: 'recent', label: '最近打开', en: 'Recent', icon: 'ri-time-line', color: 'var(--icon-recent)' },
            { key: 'downloads', label: '下载文件', en: 'Downloads', icon: 'ri-download-cloud-line', color: 'var(--icon-download)' }
        ]
    },
    {
        title: '分类',
        items: [
            { key: 'archives', label: '压缩包', en: 'Archives', icon: 'ri-file-zip-line', color: 'var(--icon-zip)' },
            { key: 'scans', label: '扫描件', en: 'Scans', icon: 'ri-scan-line', color: 'var(--icon-scan)' },
            { key: 'favorites', label: '收藏文件', en: 'Favorites', icon: 'ri-heart-fill', color: 'var(--icon-fav)' }
        ]
    },
    {
        title: '安全与隐私',
        items: [
            { key: 'hidden', label: '隐藏文件夹', en: 'Hidden', icon: 'ri-eye-off-line', color: 'var(--icon-hidden)' },
            { key: 'encrypted', label: '加密文档', en: 'Encrypted', icon: 'ri-shield-keyhole-fill', color: 'var(--icon-lock)', secure: true }
        ]
    }
];

const PHONE_FILES_SAMPLE_FILES = {
    recent: ['项目清单.pdf', '会议纪要.docx', '封面草图.png', '报价单.xlsx', '合同扫描件.pdf', '旅行照片.jpg', '演示稿.key', '素材打包.zip', '采访录音.m4a'],
    downloads: ['安装包.zip', '课程资料.pdf', '需求说明.docx', '样张图片.png', '字幕文件.srt', '表格模板.xlsx', '视频素材.mov', '导出文档.pdf', '清单.txt'],
    archives: ['旧资料_01.zip', '源文件备份.zip', '发票归档.zip', '照片合集.zip', '聊天记录.zip', '导出压缩包.zip'],
    scans: ['身份证扫描.pdf', '合同扫描.pdf', '发票扫描.jpg', '签字页.pdf', '收据扫描.jpg', '证件照片.png'],
    favorites: ['灵感板.jpg', '收藏配色.png', '论文摘录.pdf', '常用模板.docx', '旅行计划.pdf', '配乐片段.m4a']
};
const PHONE_FILES_SAMPLE_HIDDEN_FOLDERS = [
    {
        name: '_cache',
        type: 'folder',
        time: '2026-03-29 00:43',
        locked: false,
        file_count: 4,
        summary: '看起来像普通缓存目录',
        related_to_user: false,
        hidden_tension: '',
        items: [
            { name: '图层缓存_03.png', type: 'image', size: '3.2 MB', time: '2026-03-29 00:40', source: '相册整理', summary: '像是临时缓存图。', related_to_user: false, hidden_tension: '' },
            { name: '导出草图_v2.pdf', type: 'pdf', size: '1.1 MB', time: '2026-03-28 23:18', source: '手动创建', summary: '像是改过几轮的文件。', related_to_user: false, hidden_tension: '' },
            { name: '截图整理_0328.zip', type: 'zip', size: '8.4 MB', time: '2026-03-28 22:44', source: '手动压缩', summary: '看起来像一包临时截图。', related_to_user: false, hidden_tension: '' },
            { name: '记录一下.jpg', type: 'image', size: '2.6 MB', time: '2026-03-28 21:15', source: '微信保存', summary: '像是随手存下来的图片。', related_to_user: false, hidden_tension: '' }
        ]
    },
    {
        name: 'archive2',
        type: 'folder',
        time: '2026-03-30 22:17',
        locked: true,
        file_count: 7,
        summary: '低调命名的归档目录',
        related_to_user: false,
        hidden_tension: '',
        items: [
            { name: '整理后删.zip', type: 'zip', size: '18.2 MB', time: '2026-03-30 22:11', source: '手动压缩', summary: '像是特地归档的资料。', related_to_user: false, hidden_tension: '' },
            { name: '备份_不要同步.pdf', type: 'pdf', size: '2.1 MB', time: '2026-03-30 21:56', source: '备忘录导出', summary: '像是刻意留底。', related_to_user: false, hidden_tension: '' }
        ]
    },
    {
        name: 'private_save',
        type: 'folder',
        time: '2026-03-31 18:26',
        locked: true,
        file_count: 5,
        summary: '像是刻意留着不想删的内容',
        related_to_user: true,
        hidden_tension: '',
        items: [
            { name: '先留着再看.mp4', type: 'video', size: '62.3 MB', time: '2026-03-31 18:22', source: '浏览器下载', summary: '像是留着之后再看的东西。', related_to_user: false, hidden_tension: '' },
            { name: '解释稿_v2.docx', type: 'docx', size: '288 KB', time: '2026-03-31 17:48', source: '手动创建', summary: '像是准备过又没发出去的说明。', related_to_user: true, hidden_tension: '' }
        ]
    }
];
const PHONE_FILES_DATA_SECTION_ORDER = ['recent_opened', 'downloads', 'archives', 'scans', 'hidden_folders', 'favorite_files'];
const PHONE_FILES_UI_KEY_TO_DATA_KEY = {
    recent: 'recent_opened',
    downloads: 'downloads',
    archives: 'archives',
    scans: 'scans',
    hidden: 'hidden_folders',
    favorites: 'favorite_files'
};
const PHONE_FILES_DATA_KEY_TO_UI_KEY = Object.fromEntries(Object.entries(PHONE_FILES_UI_KEY_TO_DATA_KEY).map(([uiKey, dataKey]) => [dataKey, uiKey]));
const PHONE_FILES_ALLOWED_HTML_TAGS = new Set([
    'div', 'section', 'article', 'header', 'footer', 'p', 'span', 'b', 'strong', 'i', 'em', 'u', 'small',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot',
    'tr', 'td', 'th', 'blockquote', 'pre', 'code'
]);
const PHONE_FILES_ALLOWED_STYLE_PROPS = new Set([
    'color', 'background', 'background-color', 'background-image', 'padding', 'padding-top', 'padding-right',
    'padding-bottom', 'padding-left', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-radius', 'box-shadow',
    'font-size', 'font-weight', 'font-style', 'line-height', 'letter-spacing', 'text-align', 'text-transform',
    'display', 'flex', 'flex-direction', 'justify-content', 'align-items', 'gap', 'grid-template-columns',
    'place-items', 'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height', 'aspect-ratio',
    'opacity', 'overflow', 'white-space'
]);
const PHONE_FILES_SECTION_META = {
    recent_opened: { key: 'recent_opened', uiKey: 'recent', cnTitle: '最近打开', enTitle: 'Recent' },
    downloads: { key: 'downloads', uiKey: 'downloads', cnTitle: '下载文件', enTitle: 'Downloads' },
    archives: { key: 'archives', uiKey: 'archives', cnTitle: '压缩包', enTitle: 'Archives' },
    scans: { key: 'scans', uiKey: 'scans', cnTitle: '扫描件', enTitle: 'Scans' },
    hidden_folders: { key: 'hidden_folders', uiKey: 'hidden', cnTitle: '隐藏文件夹', enTitle: 'Hidden' },
    favorite_files: { key: 'favorite_files', uiKey: 'favorites', cnTitle: '收藏文件', enTitle: 'Favorites' }
};
const PHONE_FILES_SECTION_AI_TYPE_MAP = {
    recent_opened: 'files_recent',
    downloads: 'files_downloads',
    archives: 'files_archives',
    scans: 'files_scans',
    hidden_folders: 'files_hidden',
    favorite_files: 'files_favorites'
};
const PHONE_FILES_AI_TYPE_SECTION_MAP = Object.fromEntries(Object.entries(PHONE_FILES_SECTION_AI_TYPE_MAP).map(([sectionKey, aiType]) => [aiType, sectionKey]));

function phoneFilesEscapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function phoneFilesEnsureShell() {
    let screen = document.getElementById('phone-files');
    if (screen) return screen;

    const host = document.getElementById('phone-notes')?.parentNode || document.body;
    screen = document.createElement('div');
    screen.id = 'phone-files';
    screen.className = 'sub-screen hidden';
    screen.style.cssText = 'z-index: 200; background-color: #f2f2f7; overflow: hidden;';
    screen.innerHTML = '<div id="phone-files-content" style="width: 100%; height: 100%; overflow: hidden; background: #f2f2f7;"></div>';
    host.appendChild(screen);
    return screen;
}

function createEmptyPhoneFilesData() {
    return {
        recent_opened: [],
        downloads: [],
        archives: [],
        scans: [],
        hidden_folders: [],
        favorite_files: []
    };
}

function phoneFilesNormalizeText(value, fallback = '') {
    const text = value == null ? '' : String(value).trim();
    return text || fallback;
}

function phoneFilesNormalizeBoolean(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
        if (['false', '0', 'no', 'n'].includes(normalized)) return false;
    }
    return fallback;
}

function phoneFilesNormalizeNumber(value, fallback = 0) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
    const matched = String(value == null ? '' : value).match(/\d+/);
    return matched ? Number(matched[0]) : fallback;
}

function phoneFilesGetTypeDisplayName(type) {
    const normalized = phoneFilesNormalizeText(type, '').toLowerCase();
    if (normalized.includes('pdf')) return 'PDF';
    if (normalized.includes('doc') || normalized.includes('word')) return '文档';
    if (normalized.includes('sheet') || normalized.includes('xls') || normalized.includes('csv')) return '表格';
    if (normalized.includes('image') || normalized.includes('jpg') || normalized.includes('png')) return '图片';
    if (normalized.includes('zip') || normalized.includes('rar') || normalized.includes('archive')) return '压缩包';
    if (normalized.includes('scan')) return '扫描件';
    if (normalized.includes('video')) return '视频';
    if (normalized.includes('audio')) return '音频';
    if (normalized.includes('text')) return '文本';
    if (normalized.includes('export') || normalized.includes('note')) return '导出文件';
    return '文件';
}

function phoneFilesBuildFallbackFileContent(file) {
    const source = file && typeof file === 'object' ? file : {};
    const name = phoneFilesNormalizeText(source.name || source.filename || source.title, '未命名文件');
    const typeLabel = phoneFilesGetTypeDisplayName(source.type || phoneFilesInferTypeFromName(name));
    const summary = phoneFilesNormalizeText(source.summary, '这份文件里留着一些没有删掉的内容。');
    const sourceLabel = phoneFilesNormalizeText(source.source, '手动创建');
    const sizeLabel = phoneFilesNormalizeText(source.size, '—');
    const timeLabel = phoneFilesNormalizeText(source.time || source.updated_at, '2026-04-01 22:13');
    const tension = phoneFilesNormalizeText(source.hidden_tension, '留在这里，本身就说明它还没被真正放下。');
    const escapedName = phoneFilesEscapeHtml(name);
    const escapedSummary = phoneFilesEscapeHtml(summary);
    const escapedTension = phoneFilesEscapeHtml(tension);
    const escapedSource = phoneFilesEscapeHtml(sourceLabel);
    const escapedSize = phoneFilesEscapeHtml(sizeLabel);
    const escapedTime = phoneFilesEscapeHtml(timeLabel);
    const escapedType = phoneFilesEscapeHtml(typeLabel);
    const fileStem = phoneFilesEscapeHtml(name.replace(/\.[^.]+$/, '') || name);

    let previewBlock = `
        <div class="file-html-card">
            <div style="font-size:12px; font-weight:600; color:#8E8E93; text-transform:uppercase; letter-spacing:.4px;">文档摘要</div>
            <p>${escapedSummary}</p>
            <blockquote>${escapedTension}</blockquote>
        </div>
    `;

    if (typeLabel === '压缩包') {
        previewBlock = `
            <div class="file-html-card">
                <div style="font-size:12px; font-weight:600; color:#8E8E93; text-transform:uppercase; letter-spacing:.4px;">压缩包预览</div>
                <ul>
                    <li>${fileStem}_截图整理.png</li>
                    <li>${fileStem}_说明.pdf</li>
                    <li>${fileStem}_备份副本.txt</li>
                </ul>
                <blockquote>${escapedTension}</blockquote>
            </div>
        `;
    } else if (typeLabel === '表格') {
        previewBlock = `
            <div class="file-html-card">
                <div style="font-size:12px; font-weight:600; color:#8E8E93; text-transform:uppercase; letter-spacing:.4px;">表格片段</div>
                <table>
                    <thead>
                        <tr><th>项目</th><th>状态</th><th>备注</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>最近整理</td><td>已保存</td><td>${escapedSummary}</td></tr>
                        <tr><td>相关备注</td><td>待确认</td><td>${escapedTension}</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    } else if (typeLabel === '图片') {
        previewBlock = `
            <div class="file-html-card">
                <div class="file-visual-stage" style="background:linear-gradient(145deg, #7B61FF, #4CC9F0); color:#fff;">
                    <div>
                        <div style="font-size:12px; opacity:.82; letter-spacing:.4px; text-transform:uppercase;">图片内容描述</div>
                        <div style="margin-top:8px; font-size:18px; font-weight:700; line-height:1.45;">${escapedSummary}</div>
                    </div>
                </div>
                <p>${escapedTension}</p>
            </div>
        `;
    } else if (typeLabel === '视频') {
        previewBlock = `
            <div class="file-html-card">
                <div class="file-visual-stage" style="background:linear-gradient(145deg, #111827, #334155); color:#fff;">
                    <div>
                        <div style="font-size:12px; opacity:.75; text-transform:uppercase; letter-spacing:.4px;">视频预览</div>
                        <div style="margin-top:8px; font-size:18px; font-weight:700;">${escapedSummary}</div>
                        <div style="margin-top:10px; font-size:13px; opacity:.82;">像是被单独保存下来，后面还会再点开。</div>
                    </div>
                </div>
            </div>
        `;
    } else if (typeLabel === '音频') {
        previewBlock = `
            <div class="file-html-card">
                <div style="font-size:12px; font-weight:600; color:#8E8E93; text-transform:uppercase; letter-spacing:.4px;">音频备注</div>
                <div style="display:flex; gap:4px; align-items:flex-end; height:40px; margin:14px 0 12px;">
                    <span style="display:block; width:6px; height:12px; background:#AF52DE; border-radius:999px;"></span>
                    <span style="display:block; width:6px; height:28px; background:#AF52DE; border-radius:999px;"></span>
                    <span style="display:block; width:6px; height:18px; background:#AF52DE; border-radius:999px;"></span>
                    <span style="display:block; width:6px; height:34px; background:#AF52DE; border-radius:999px;"></span>
                    <span style="display:block; width:6px; height:22px; background:#AF52DE; border-radius:999px;"></span>
                    <span style="display:block; width:6px; height:14px; background:#AF52DE; border-radius:999px;"></span>
                </div>
                <p>${escapedSummary}</p>
                <blockquote>${escapedTension}</blockquote>
            </div>
        `;
    } else if (typeLabel === '扫描件') {
        previewBlock = `
            <div class="file-html-card">
                <div style="font-size:12px; font-weight:600; color:#8E8E93; text-transform:uppercase; letter-spacing:.4px;">扫描页摘录</div>
                <p>${escapedSummary}</p>
                <div style="margin-top:12px; padding:12px; border-radius:14px; background:#F6F7FB; border:1px dashed rgba(0,0,0,0.08); color:#4B5563; line-height:1.7;">扫描件看起来像被特意留档的材料，字里行间没有明说，但会让人想继续翻下去。</div>
            </div>
        `;
    }

    return `
        <div class="file-html-shell">
            <div class="file-html-card" style="background:linear-gradient(145deg, rgba(0,122,255,0.12), rgba(94,92,230,0.08)); border-color:rgba(0,122,255,0.12);">
                <div style="font-size:12px; font-weight:700; color:#4F46E5; text-transform:uppercase; letter-spacing:.5px;">${escapedType}</div>
                <div style="margin-top:8px; font-size:20px; font-weight:700; line-height:1.35; color:#111827;">${escapedName}</div>
                <div style="margin-top:10px; color:#374151; line-height:1.75;">${escapedSummary}</div>
            </div>
            ${previewBlock}
            <div class="file-html-card">
                <div style="font-size:12px; font-weight:600; color:#8E8E93; text-transform:uppercase; letter-spacing:.4px; margin-bottom:10px;">文件信息</div>
                <table>
                    <tbody>
                        <tr><th>文件名</th><td>${escapedName}</td></tr>
                        <tr><th>类型</th><td>${escapedType}</td></tr>
                        <tr><th>来源</th><td>${escapedSource}</td></tr>
                        <tr><th>大小</th><td>${escapedSize}</td></tr>
                        <tr><th>时间</th><td>${escapedTime}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="file-html-note">
                <strong style="display:block; margin-bottom:6px; color:#1F2937;">查看备注</strong>
                ${escapedTension}
            </div>
        </div>
    `;
}

function phoneFilesFormatMultilineText(value) {
    return phoneFilesEscapeHtml(value || '').replace(/\r?\n/g, '<br>');
}

function phoneFilesLooksLikeHtml(value) {
    return /<\s*[a-z][^>]*>/i.test(String(value == null ? '' : value));
}

function phoneFilesSanitizeStyle(styleText) {
    return String(styleText == null ? '' : styleText)
        .split(';')
        .map(chunk => chunk.trim())
        .filter(Boolean)
        .map(rule => {
            const dividerIndex = rule.indexOf(':');
            if (dividerIndex === -1) return '';
            const property = rule.slice(0, dividerIndex).trim().toLowerCase();
            const value = rule.slice(dividerIndex + 1).trim();
            if (!PHONE_FILES_ALLOWED_STYLE_PROPS.has(property)) return '';
            if (!value || /(javascript:|expression\s*\(|url\s*\()/i.test(value)) return '';
            return `${property}: ${value}`;
        })
        .filter(Boolean)
        .join('; ');
}

function phoneFilesSanitizeClassName(classText) {
    return String(classText == null ? '' : classText)
        .split(/\s+/)
        .map(name => name.trim())
        .filter(name => /^file-[a-z0-9_-]+$/i.test(name) || /^phone-files-[a-z0-9_-]+$/i.test(name))
        .join(' ');
}

function phoneFilesSanitizeHtml(html) {
    const template = document.createElement('template');
    template.innerHTML = String(html == null ? '' : html);
    const dropTags = new Set(['script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'form', 'input', 'button', 'textarea', 'select', 'option', 'svg', 'math']);

    const sanitizeNode = node => {
        if (node.nodeType === Node.TEXT_NODE) {
            return document.createTextNode(node.textContent || '');
        }

        if (node.nodeType !== Node.ELEMENT_NODE) {
            return document.createDocumentFragment();
        }

        const tag = String(node.tagName || '').toLowerCase();
        if (dropTags.has(tag)) {
            return document.createDocumentFragment();
        }

        if (!PHONE_FILES_ALLOWED_HTML_TAGS.has(tag)) {
            const fragment = document.createDocumentFragment();
            Array.from(node.childNodes).forEach(child => fragment.appendChild(sanitizeNode(child)));
            return fragment;
        }

        const cleanEl = document.createElement(tag);
        Array.from(node.attributes || []).forEach(attr => {
            const attrName = String(attr.name || '').toLowerCase();
            const attrValue = String(attr.value || '');
            if (!attrName || attrName.startsWith('on')) return;

            if (attrName === 'style') {
                const safeStyle = phoneFilesSanitizeStyle(attrValue);
                if (safeStyle) cleanEl.setAttribute('style', safeStyle);
                return;
            }

            if (attrName === 'class') {
                const safeClass = phoneFilesSanitizeClassName(attrValue);
                if (safeClass) cleanEl.setAttribute('class', safeClass);
                return;
            }

            if (attrName === 'colspan' || attrName === 'rowspan') {
                const safeSpan = Math.max(1, phoneFilesNormalizeNumber(attrValue, 1));
                cleanEl.setAttribute(attrName, String(safeSpan));
                return;
            }

            if (attrName === 'title' || attrName === 'aria-label') {
                cleanEl.setAttribute(attrName, attrValue);
            }
        });

        Array.from(node.childNodes).forEach(child => cleanEl.appendChild(sanitizeNode(child)));
        return cleanEl;
    };

    const wrapper = document.createElement('div');
    Array.from(template.content.childNodes).forEach(child => wrapper.appendChild(sanitizeNode(child)));
    return wrapper.innerHTML.trim();
}

function phoneFilesBuildPlainTextContentHtml(content, file) {
    const text = phoneFilesNormalizeText(content, phoneFilesNormalizeText(file && file.summary, '这份文件里没有留下更多文字。'));
    return `
        <div class="file-html-shell">
            <div class="file-html-card">
                <div style="font-size:12px; font-weight:600; color:#8E8E93; text-transform:uppercase; letter-spacing:.4px;">内容摘录</div>
                <div style="margin-top:12px; line-height:1.85; color:#1F2937;">${phoneFilesFormatMultilineText(text)}</div>
            </div>
        </div>
    `;
}

function phoneFilesResolveContentHtml(file) {
    const rawContent = phoneFilesNormalizeText(file && file.content, '');
    if (!rawContent) {
        return phoneFilesBuildFallbackFileContent(file);
    }
    if (phoneFilesLooksLikeHtml(rawContent)) {
        const sanitizedHtml = phoneFilesSanitizeHtml(rawContent);
        return sanitizedHtml || phoneFilesBuildFallbackFileContent(file);
    }
    return phoneFilesBuildPlainTextContentHtml(rawContent, file);
}

function phoneFilesResolveDataKey(sectionKey) {
    if (!sectionKey) return null;
    if (PHONE_FILES_SECTION_META[sectionKey]) return sectionKey;
    return PHONE_FILES_UI_KEY_TO_DATA_KEY[sectionKey] || null;
}

function getPhoneFilesContactById(contactId) {
    const state = window.iphoneSimState || {};
    const contacts = Array.isArray(state.contacts) ? state.contacts : [];
    return contacts.find(contact => contact.id === contactId) || null;
}

function getActivePhoneFilesContact() {
    return currentCheckPhoneContactId ? getPhoneFilesContactById(currentCheckPhoneContactId) : null;
}

function getPhoneFilesStoreBucket(contactId) {
    const state = window.iphoneSimState || {};
    if (!state.phoneContent) state.phoneContent = {};
    if (!state.phoneContent[contactId]) state.phoneContent[contactId] = {};
    return state.phoneContent[contactId];
}

function phoneFilesInferTypeFromName(name) {
    const lower = String(name || '').toLowerCase();
    if (lower.endsWith('.pdf')) return 'pdf';
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) return 'docx';
    if (lower.endsWith('.xls') || lower.endsWith('.xlsx') || lower.endsWith('.csv')) return 'sheet';
    if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.heic') || lower.endsWith('.gif')) return 'image';
    if (lower.endsWith('.zip') || lower.endsWith('.rar') || lower.endsWith('.7z')) return 'zip';
    if (lower.endsWith('.mov') || lower.endsWith('.mp4') || lower.endsWith('.mkv')) return 'video';
    if (lower.endsWith('.m4a') || lower.endsWith('.mp3') || lower.endsWith('.wav')) return 'audio';
    if (lower.endsWith('.txt') || lower.endsWith('.md')) return 'text';
    if (lower.endsWith('.noteexport') || lower.includes('导出')) return 'export';
    return 'file';
}

function normalizePhoneFilesFileItem(item, index, fallbackName = '') {
    const source = item && typeof item === 'object' ? item : {};
    const name = phoneFilesNormalizeText(source.name || source.filename || source.title, fallbackName || `文件${index + 1}`);
    const type = phoneFilesNormalizeText(source.type, phoneFilesInferTypeFromName(name));
    const size = phoneFilesNormalizeText(source.size, '1.8 MB');
    const time = phoneFilesNormalizeText(source.time || source.updated_at, '2026-04-01 22:13');
    const sourceLabel = phoneFilesNormalizeText(source.source, '手动创建');
    const summary = phoneFilesNormalizeText(source.summary, '看起来像一份普通文件。');
    return {
        name,
        type,
        size,
        time,
        source: sourceLabel,
        summary,
        content: phoneFilesNormalizeText(source.content, phoneFilesBuildFallbackFileContent({ name, type, size, time, source: sourceLabel, summary })),
        related_to_user: phoneFilesNormalizeBoolean(source.related_to_user, false),
        hidden_tension: phoneFilesNormalizeText(source.hidden_tension, '')
    };
}

function phoneFilesBuildFallbackFolderItems(folderName, count = 4) {
    const baseNames = ['先留着.pdf', '记录一下.jpg', '导出备份(1).zip', '说清楚之前别删.txt', '临时保存_0329.pdf', '截图整理.zip', '扫描文件_0328.pdf', '解释稿_v2.docx'];
    const normalizedCount = Math.max(1, Math.min(8, Number(count) || 4));
    let seed = 0;
    for (const ch of String(folderName || 'folder')) seed += ch.charCodeAt(0);
    const items = [];
    for (let i = 0; i < normalizedCount; i += 1) {
        const name = baseNames[(seed + i) % baseNames.length];
        items.push(normalizePhoneFilesFileItem({
            name,
            type: phoneFilesInferTypeFromName(name),
            size: `${1 + ((seed + i) % 8)}.${(seed + i) % 10} MB`,
            time: `2026-03-${String(31 - (i % 6)).padStart(2, '0')} ${String(12 + (i % 8)).padStart(2, '0')}:1${i % 6}`,
            source: i % 3 === 0 ? '浏览器下载' : (i % 3 === 1 ? '微信保存' : '手动创建'),
            summary: '像是被放进文件夹里单独留着的文件。',
            related_to_user: i === 0,
            hidden_tension: ''
        }, i, name));
    }
    return phoneFilesSortByTime(items);
}

function normalizePhoneFilesEntry(sectionKey, item, index) {
    const source = item && typeof item === 'object' ? item : {};
    const meta = PHONE_FILES_SECTION_META[sectionKey] || { cnTitle: '文件' };
    const defaultName = sectionKey === 'hidden_folders' ? `目录_${index + 1}` : `${meta.cnTitle}${index + 1}`;
    const name = phoneFilesNormalizeText(source.name || source.filename || source.title, defaultName);
    const relatedToUser = phoneFilesNormalizeBoolean(source.related_to_user, false);

    if (sectionKey === 'hidden_folders') {
        const normalizedItems = Array.isArray(source.items)
            ? source.items.map((child, childIndex) => normalizePhoneFilesFileItem(child, childIndex, `文件${childIndex + 1}`))
            : [];
        const fallbackItems = normalizedItems.length
            ? normalizedItems
            : phoneFilesBuildFallbackFolderItems(name, phoneFilesNormalizeNumber(source.file_count, 4));
        const sortedItems = phoneFilesSortByTime(fallbackItems);
        return {
            name,
            type: 'folder',
            time: phoneFilesNormalizeText(source.time || source.updated_at, '2026-04-01 22:13'),
            locked: phoneFilesNormalizeBoolean(source.locked, false),
            file_count: sortedItems.length || phoneFilesNormalizeNumber(source.file_count, 0),
            summary: phoneFilesNormalizeText(source.summary, '看起来像一个被刻意放低存在感的目录。'),
            related_to_user: relatedToUser,
            hidden_tension: phoneFilesNormalizeText(source.hidden_tension, ''),
            items: sortedItems
        };
    }

    return normalizePhoneFilesFileItem(source, index, defaultName);
}

function normalizePhoneFilesData(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const normalized = createEmptyPhoneFilesData();
    PHONE_FILES_DATA_SECTION_ORDER.forEach(sectionKey => {
        const list = Array.isArray(source[sectionKey]) ? source[sectionKey] : [];
        normalized[sectionKey] = list.map((item, index) => normalizePhoneFilesEntry(sectionKey, item, index));
    });
    return normalized;
}

function normalizePhoneFilesAiPayload(type, raw) {
    if (type === 'files_all') {
        if (raw && typeof raw === 'object' && raw.filesData && typeof raw.filesData === 'object') {
            return normalizePhoneFilesData(raw.filesData);
        }
        return normalizePhoneFilesData(raw);
    }
    const sectionKey = PHONE_FILES_AI_TYPE_SECTION_MAP[type];
    if (!sectionKey) return raw;
    let payload = raw;
    if (!Array.isArray(payload) && payload && typeof payload === 'object') {
        if (Array.isArray(payload[sectionKey])) {
            payload = payload[sectionKey];
        } else {
            const firstArrayKey = Object.keys(payload).find(key => Array.isArray(payload[key]));
            if (firstArrayKey) payload = payload[firstArrayKey];
        }
    }
    if (!Array.isArray(payload)) return [];
    return payload.map((item, index) => normalizePhoneFilesEntry(sectionKey, item, index));
}

function getPhoneFilesSectionKeyByAiType(type) {
    return PHONE_FILES_AI_TYPE_SECTION_MAP[type] || null;
}

function getPhoneFilesAiTypeBySectionKey(sectionKey) {
    const dataKey = phoneFilesResolveDataKey(sectionKey);
    return dataKey ? (PHONE_FILES_SECTION_AI_TYPE_MAP[dataKey] || null) : null;
}

function getPhoneFilesData(contactId) {
    if (!contactId) return createEmptyPhoneFilesData();
    const bucket = getPhoneFilesStoreBucket(contactId);
    bucket.filesData = normalizePhoneFilesData(bucket.filesData);
    return bucket.filesData;
}

function setPhoneFilesData(contactId, filesData) {
    const bucket = getPhoneFilesStoreBucket(contactId);
    bucket.filesData = normalizePhoneFilesData(filesData);
    return bucket.filesData;
}

function phoneFilesParseTimeValue(value) {
    const text = phoneFilesNormalizeText(value, '');
    if (!text) return null;

    const isoLike = text.replace(/\//g, '-').replace(/\.(?=\d)/g, '-').replace(' ', 'T');
    const isoTs = Date.parse(isoLike);
    if (!Number.isNaN(isoTs)) return isoTs;

    const relativeMatch = text.match(/^(今天|昨天)\s*(\d{1,2}):(\d{2})$/);
    if (relativeMatch) {
        const date = new Date();
        if (relativeMatch[1] === '昨天') {
            date.setDate(date.getDate() - 1);
        }
        date.setHours(Number(relativeMatch[2]), Number(relativeMatch[3]), 0, 0);
        return date.getTime();
    }

    return null;
}

function phoneFilesSortByTime(list) {
    return (Array.isArray(list) ? list : [])
        .map((item, index) => ({ item, index, ts: phoneFilesParseTimeValue(item && item.time) }))
        .sort((a, b) => {
            const aHas = Number.isFinite(a.ts);
            const bHas = Number.isFinite(b.ts);
            if (aHas && bHas) return b.ts - a.ts;
            if (aHas) return -1;
            if (bHas) return 1;
            return a.index - b.index;
        })
        .map(entry => entry.item);
}

function phoneFilesGetRuntime(container) {
    if (!container.__phoneFilesRuntime) {
        container.__phoneFilesRuntime = {
            currentKey: null,
            currentView: 'main',
            currentFolderIndex: null,
            currentFolderName: '',
            currentFileIndex: null,
            currentFileSource: null
        };
    }
    return container.__phoneFilesRuntime;
}

function phoneFilesGetItemMeta(itemKey) {
    for (const section of PHONE_FILES_BROWSE_SECTIONS) {
        const found = section.items.find(item => item.key === itemKey);
        if (found) return found;
    }
    return PHONE_FILES_BROWSE_SECTIONS[0].items[0];
}

function phoneFilesInferVisual(entryOrName) {
    const name = typeof entryOrName === 'string'
        ? entryOrName
        : phoneFilesNormalizeText(entryOrName && (entryOrName.name || entryOrName.filename), '');
    const type = phoneFilesNormalizeText(
        typeof entryOrName === 'object' && entryOrName ? entryOrName.type : '',
        phoneFilesInferTypeFromName(name)
    ).toLowerCase();

    if (type === 'folder') return { icon: 'ri-folder-5-fill', color: '#007AFF' };
    if (type.includes('pdf')) return { icon: 'ri-file-pdf-line', color: '#FF3B30' };
    if (type.includes('doc') || type.includes('word')) return { icon: 'ri-file-word-line', color: '#007AFF' };
    if (type.includes('sheet') || type.includes('xls') || type.includes('csv')) return { icon: 'ri-file-excel-line', color: '#34C759' };
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return { icon: 'ri-image-line', color: '#5856D6' };
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return { icon: 'ri-file-zip-line', color: '#FFCC00' };
    if (type.includes('scan')) return { icon: 'ri-file-paper-2-line', color: '#34C759' };
    if (type.includes('export') || type.includes('note')) return { icon: 'ri-sticky-note-line', color: '#FF9500' };
    if (type.includes('video')) return { icon: 'ri-video-line', color: '#FF9500' };
    if (type.includes('audio')) return { icon: 'ri-music-2-line', color: '#AF52DE' };
    if (type.includes('text')) return { icon: 'ri-file-text-line', color: '#8E8E93' };

    const inferred = phoneFilesInferTypeFromName(name);
    if (inferred && inferred !== type) {
        return phoneFilesInferVisual({ name, type: inferred });
    }
    return { icon: 'ri-file-line', color: '#8E8E93' };
}

function phoneFilesBuildSampleFiles(itemKey) {
    if (itemKey === 'hidden') {
        return phoneFilesSortByTime(PHONE_FILES_SAMPLE_HIDDEN_FOLDERS.map((item, index) => normalizePhoneFilesEntry('hidden_folders', item, index)));
    }

    const dataKey = phoneFilesResolveDataKey(itemKey) || 'recent_opened';
    const sampleKey = itemKey in PHONE_FILES_SAMPLE_FILES ? itemKey : 'recent';
    const names = PHONE_FILES_SAMPLE_FILES[sampleKey] || PHONE_FILES_SAMPLE_FILES.recent;
    const sampleItems = names.map((name, index) => normalizePhoneFilesEntry(dataKey, {
        name,
        type: phoneFilesInferTypeFromName(name),
        size: `${Math.max(1, (index % 5) + 1)}.${(index * 3) % 10} MB`,
        time: `2026-04-${String(Math.max(1, 9 - index)).padStart(2, '0')} ${String(10 + (index % 8)).padStart(2, '0')}:1${index % 6}`,
        source: '手动创建',
        summary: '看起来像一份普通文件。',
        related_to_user: false,
        hidden_tension: ''
    }, index));
    return phoneFilesSortByTime(sampleItems);
}

function phoneFilesGetSectionItems(contactId, itemKey) {
    const dataKey = phoneFilesResolveDataKey(itemKey);
    if (!dataKey) return [];
    if (!contactId) return phoneFilesBuildSampleFiles(itemKey);
    const bucket = getPhoneFilesStoreBucket(contactId);
    const hasStoredFilesData = !!bucket.filesData;
    const filesData = getPhoneFilesData(contactId);
    const generatedItems = Array.isArray(filesData[dataKey]) ? filesData[dataKey] : [];
    if (generatedItems.length) return phoneFilesSortByTime(generatedItems);
    if (hasStoredFilesData) return [];
    return phoneFilesBuildSampleFiles(itemKey);
}

function phoneFilesBuildFileGridHtml(files, source = 'section') {
    return `
        <div class="file-grid">
            ${files.map((file, index) => {
                const visual = phoneFilesInferVisual(file);
                const hint = phoneFilesNormalizeText(file && file.summary, `${phoneFilesGetTypeDisplayName(file && file.type)} · ${phoneFilesNormalizeText(file && file.time, '刚刚')}`);
                return `
                    <div class="file-box" data-file-index="${index}" data-file-source="${phoneFilesEscapeHtml(source)}">
                        <div class="file-box-icon" style="color:${visual.color}"><i class="${visual.icon}"></i></div>
                        <div class="file-box-name">${phoneFilesEscapeHtml(file.name || file.filename || '')}</div>
                        <div class="file-box-hint">${phoneFilesEscapeHtml(hint)}</div>
                    </div>
                `;
            }).join('')}
        </div>
        <div style="height: 40px"></div>
    `;
}

function phoneFilesBuildHiddenFoldersHtml(folders) {
    return `
        <div class="hidden-folder-list">
            ${folders.map((folder, index) => `
                <div class="hidden-folder-card" data-folder-index="${index}">
                    <div class="hidden-folder-icon"><i class="ri-folder-5-fill"></i></div>
                    <div class="hidden-folder-main">
                        <div class="hidden-folder-name-row">
                            <div class="hidden-folder-name">${phoneFilesEscapeHtml(folder.name)}</div>
                            ${folder.locked ? '<i class="ri-lock-fill hidden-folder-lock"></i>' : ''}
                        </div>
                        <div class="hidden-folder-count">${phoneFilesEscapeHtml(String(folder.file_count || 0))} 个项目</div>
                    </div>
                    <i class="ri-arrow-right-s-line hidden-folder-chevron"></i>
                </div>
            `).join('')}
        </div>
        <div style="height: 40px"></div>
    `;
}

function phoneFilesRenderMainSections(container) {
    const sectionsEl = container.querySelector('#phone-files-main-sections');
    if (!sectionsEl) return;
    sectionsEl.innerHTML = PHONE_FILES_BROWSE_SECTIONS.map(section => `
        <div class="list-section">
            <div class="list-header">${phoneFilesEscapeHtml(section.title)}</div>
            <div class="list-block">
                ${section.items.map(item => `
                    <div class="list-item" data-item-key="${phoneFilesEscapeHtml(item.key)}">
                        <div class="list-icon" style="color: ${item.color}"><i class="${item.icon}"></i></div>
                        <div class="list-text">
                            <span>${phoneFilesEscapeHtml(item.label)}</span>
                            <div class="list-value">${item.secure ? '<i class="ri-lock-fill" style="font-size: 14px;"></i>' : ''}<i class="ri-arrow-right-s-line chevron"></i></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function phoneFilesUpdateHeaderScroll(scrollEl, headerEl) {
    if (!scrollEl || !headerEl) return;
    headerEl.classList.toggle('scrolled', scrollEl.scrollTop > 20);
}

function phoneFilesHideMenus(container) {
    container.querySelectorAll('.phone-files-generate-menu').forEach(menu => menu.classList.add('hidden'));
}

function phoneFilesToggleMenu(container, menuRole) {
    const targetMenu = container.querySelector(`[data-role="${menuRole}"]`);
    if (!targetMenu) return;
    const shouldShow = targetMenu.classList.contains('hidden');
    phoneFilesHideMenus(container);
    if (shouldShow) targetMenu.classList.remove('hidden');
}

function phoneFilesSetDetailGenerateVisible(container, visible) {
    const wrap = container.querySelector('#phone-files-detail-generate-wrap');
    if (!wrap) return;
    wrap.classList.toggle('is-hidden', !visible);
    if (!visible) phoneFilesHideMenus(container);
}


function phoneFilesBuildFileDetailHtml(file) {
    const typeLabel = phoneFilesGetTypeDisplayName(file && file.type);
    const metaParts = [typeLabel];
    if (file && file.size) metaParts.push(file.size);
    if (file && file.source) metaParts.push(file.source);
    if (file && file.time) metaParts.push(file.time);
    const contentHtml = phoneFilesResolveContentHtml(file);
    
    return `
        <div class="file-detail-card">
            <div class="file-detail-pill">${phoneFilesEscapeHtml(typeLabel)}</div>
            <div class="file-detail-name">${phoneFilesEscapeHtml(file && file.name ? file.name : '文件')}</div>
            <div class="file-detail-meta">${phoneFilesEscapeHtml(metaParts.join(' · '))}</div>
            ${file && file.summary ? `<div class="file-detail-summary">${phoneFilesEscapeHtml(file.summary)}</div>` : ''}
            <div class="file-detail-section-title">内容</div>
            <div class="file-detail-content" style="background:#f9f9fb; padding:15px; border-radius:12px; margin-top:10px;">${contentHtml}</div>
        </div>
        <div style="height: 40px"></div>
    `;
}

function phoneFilesGetCurrentFileCollection(container, source = 'section') {
    const runtime = phoneFilesGetRuntime(container);
    const contact = getActivePhoneFilesContact();
    if (source === 'folder') {
        const folders = phoneFilesGetSectionItems(contact && contact.id, 'hidden');
        const folder = folders[runtime.currentFolderIndex];
        return phoneFilesGetFolderItems(folder);
    }
    return phoneFilesGetSectionItems(contact && contact.id, runtime.currentKey);
}

function phoneFilesRenderFileDetail(container, fileIndex, source = 'section') {
    const runtime = phoneFilesGetRuntime(container);
    const fileContent = container.querySelector('#phone-files-file-content');
    const smallTitle = container.querySelector('#phone-files-file-small-title');
    const bigTitle = container.querySelector('#phone-files-file-big-title');
    const backLabel = container.querySelector('#phone-files-file-back-label');
    if (!fileContent) return;

    const files = phoneFilesGetCurrentFileCollection(container, source);
    const file = files[fileIndex];
    if (!file) {
        phoneFilesRenderEmptyState(container, '这个文件不存在了。', 'phone-files-file-content');
        return;
    }

    runtime.currentFileIndex = fileIndex;
    runtime.currentFileSource = source;
    if (smallTitle) smallTitle.textContent = file.name || '文件';
    if (bigTitle) bigTitle.textContent = file.name || '文件';
    if (backLabel) {
        backLabel.textContent = source === 'folder'
            ? (runtime.currentFolderName || '文件夹')
            : ((phoneFilesGetItemMeta(runtime.currentKey || 'recent').label) || '目录');
    }
    fileContent.innerHTML = phoneFilesBuildFileDetailHtml(file);
}

function phoneFilesRenderEmptyState(container, message, contentId = 'phone-files-detail-content') {
    const content = container.querySelector(`#${contentId}`);
    if (!content) return;
    content.innerHTML = `<div class="files-empty">${phoneFilesEscapeHtml(message || '这里还没有内容')}</div>`;
}

function phoneFilesGetFolderItems(folder) {
    if (!folder || !Array.isArray(folder.items) || !folder.items.length) {
        return phoneFilesBuildFallbackFolderItems(folder && folder.name, folder && folder.file_count);
    }
    return phoneFilesSortByTime(folder.items);
}

function phoneFilesRenderFolderDetail(container, folderIndex) {
    const runtime = phoneFilesGetRuntime(container);
    const folderContent = container.querySelector('#phone-files-folder-content');
    const smallTitle = container.querySelector('#phone-files-folder-small-title');
    const bigTitle = container.querySelector('#phone-files-folder-big-title');
    const backLabel = container.querySelector('#phone-files-folder-back-label');
    if (!folderContent) return;

    const contact = getActivePhoneFilesContact();
    const folders = phoneFilesGetSectionItems(contact && contact.id, 'hidden');
    const folder = folders[folderIndex];
    if (!folder) {
        phoneFilesRenderEmptyState(container, '这个文件夹不存在了。', 'phone-files-folder-content');
        return;
    }

    runtime.currentFolderIndex = folderIndex;
    runtime.currentFolderName = folder.name || '';
    if (smallTitle) smallTitle.textContent = folder.name || '文件夹';
    if (bigTitle) bigTitle.textContent = folder.name || '文件夹';
    if (backLabel) backLabel.textContent = '隐藏文件夹';

    if (folder.locked) {
        folderContent.innerHTML = `
            <div class="status-page">
                <i class="ri-lock-fill status-icon"></i>
                <div class="status-title">此文件夹已锁定</div>
                <div class="status-desc">需要验证 Face ID 或触控 ID 才能查看此文件夹中的内容。</div>
                <div class="auth-btn">查看内容</div>
            </div>
        `;
        return;
    }

    const folderItems = phoneFilesGetFolderItems(folder);
    if (!folderItems.length) {
        phoneFilesRenderEmptyState(container, '文件夹里还没有内容。', 'phone-files-folder-content');
        return;
    }

    folderContent.innerHTML = phoneFilesBuildFileGridHtml(folderItems, 'folder');
}

function phoneFilesRenderDetail(container, itemKey) {
    const runtime = phoneFilesGetRuntime(container);
    const meta = phoneFilesGetItemMeta(itemKey);
    const smallTitle = container.querySelector('#phone-files-small-title');
    const bigTitle = container.querySelector('#phone-files-big-title');
    const detailContent = container.querySelector('#phone-files-detail-content');
    const folderView = container.querySelector('#phone-files-folder-view');
    const detailView = container.querySelector('#phone-files-detail-view');
    if (smallTitle) smallTitle.textContent = meta.label;
    if (bigTitle) bigTitle.innerHTML = `${phoneFilesEscapeHtml(meta.label)} <span class="large-title-en">${phoneFilesEscapeHtml(meta.en)}</span>`;
    if (!detailContent) return;

    runtime.currentFolderIndex = null;
    runtime.currentFolderName = '';
    if (detailView) detailView.classList.remove('bg');
    if (folderView) folderView.classList.remove('active');

    if (meta.key === 'encrypted' || meta.secure) {
        phoneFilesSetDetailGenerateVisible(container, false);
        detailContent.innerHTML = `
            <div class="status-page">
                <i class="ri-lock-fill status-icon"></i>
                <div class="status-title">此文件夹已锁定</div>
                <div class="status-desc">需要验证 Face ID 或触控 ID 才能查看此文件夹中的内容。</div>
                <div class="auth-btn">查看内容</div>
            </div>
        `;
        return;
    }

    const contact = getActivePhoneFilesContact();
    const files = phoneFilesGetSectionItems(contact && contact.id, itemKey);
    phoneFilesSetDetailGenerateVisible(container, true);
    if (!files.length) {
        phoneFilesRenderEmptyState(container, '还没有文件，点击右上角按钮试试生成。');
        return;
    }

    if (itemKey === 'hidden') {
        detailContent.innerHTML = phoneFilesBuildHiddenFoldersHtml(files);
        return;
    }

    detailContent.innerHTML = phoneFilesBuildFileGridHtml(files, 'section');
}

function phoneFilesShowMain(container) {
    const runtime = phoneFilesGetRuntime(container);
    const mainView = container.querySelector('#phone-files-main-view');
    const detailView = container.querySelector('#phone-files-detail-view');
    const folderView = container.querySelector('#phone-files-folder-view');
    const fileView = container.querySelector('#phone-files-file-view');
    if (mainView) mainView.classList.remove('bg');
    if (detailView) {
        detailView.classList.remove('active');
        detailView.classList.remove('bg');
    }
    if (folderView) folderView.classList.remove('active');
    if (folderView) folderView.classList.remove('bg');
    if (fileView) fileView.classList.remove('active');
    runtime.currentView = 'main';
    runtime.currentKey = null;
    runtime.currentFolderIndex = null;
    runtime.currentFolderName = '';
    runtime.currentFileIndex = null;
    runtime.currentFileSource = null;
    phoneFilesHideMenus(container);
}

function phoneFilesShowDetail(container) {
    const runtime = phoneFilesGetRuntime(container);
    const detailView = container.querySelector('#phone-files-detail-view');
    const folderView = container.querySelector('#phone-files-folder-view');
    const fileView = container.querySelector('#phone-files-file-view');
    if (detailView) detailView.classList.remove('bg');
    if (folderView) folderView.classList.remove('active');
    if (folderView) folderView.classList.remove('bg');
    if (fileView) fileView.classList.remove('active');
    runtime.currentView = 'detail';
    runtime.currentFolderIndex = null;
    runtime.currentFolderName = '';
    runtime.currentFileIndex = null;
    runtime.currentFileSource = null;
}

function phoneFilesOpenDetail(container, itemKey) {
    const runtime = phoneFilesGetRuntime(container);
    const mainView = container.querySelector('#phone-files-main-view');
    const detailView = container.querySelector('#phone-files-detail-view');
    const detailHeader = container.querySelector('#phone-files-detail-header');
    const folderView = container.querySelector('#phone-files-folder-view');
    const fileView = container.querySelector('#phone-files-file-view');
    phoneFilesRenderDetail(container, itemKey);
    if (mainView) mainView.classList.add('bg');
    if (detailView) {
        detailView.classList.add('active');
        detailView.classList.remove('bg');
        detailView.scrollTop = 0;
    }
    if (folderView) folderView.classList.remove('active');
    if (folderView) folderView.classList.remove('bg');
    if (fileView) fileView.classList.remove('active');
    if (detailHeader) detailHeader.classList.remove('scrolled');
    runtime.currentView = 'detail';
    runtime.currentKey = itemKey;
    runtime.currentFolderIndex = null;
    runtime.currentFolderName = '';
    runtime.currentFileIndex = null;
    runtime.currentFileSource = null;
}

function phoneFilesOpenFolder(container, folderIndex) {
    const runtime = phoneFilesGetRuntime(container);
    const detailView = container.querySelector('#phone-files-detail-view');
    const folderView = container.querySelector('#phone-files-folder-view');
    const folderHeader = container.querySelector('#phone-files-folder-header');
    const fileView = container.querySelector('#phone-files-file-view');
    phoneFilesRenderFolderDetail(container, folderIndex);
    if (detailView) detailView.classList.add('bg');
    if (folderView) {
        folderView.classList.add('active');
        folderView.classList.remove('bg');
        folderView.scrollTop = 0;
    }
    if (fileView) fileView.classList.remove('active');
    if (folderHeader) folderHeader.classList.remove('scrolled');
    runtime.currentView = 'folder';
    runtime.currentFileIndex = null;
    runtime.currentFileSource = null;
}

function phoneFilesOpenFile(container, fileIndex, source = 'section') {
    const runtime = phoneFilesGetRuntime(container);
    const detailView = container.querySelector('#phone-files-detail-view');
    const folderView = container.querySelector('#phone-files-folder-view');
    const fileView = container.querySelector('#phone-files-file-view');
    const fileHeader = container.querySelector('#phone-files-file-header');

    phoneFilesRenderFileDetail(container, fileIndex, source);

    if (source === 'folder') {
        if (folderView) folderView.classList.add('bg');
    } else if (detailView) {
        detailView.classList.add('bg');
    }

    if (fileView) {
        fileView.classList.add('active');
        fileView.scrollTop = 0;
    }
    if (fileHeader) fileHeader.classList.remove('scrolled');
    runtime.currentView = 'file';
}

function phoneFilesCloseFile(container) {
    const runtime = phoneFilesGetRuntime(container);
    const detailView = container.querySelector('#phone-files-detail-view');
    const folderView = container.querySelector('#phone-files-folder-view');
    const fileView = container.querySelector('#phone-files-file-view');

    if (fileView) fileView.classList.remove('active');

    if (runtime.currentFileSource === 'folder') {
        if (folderView) folderView.classList.remove('bg');
        runtime.currentView = 'folder';
    } else {
        if (detailView) detailView.classList.remove('bg');
        runtime.currentView = 'detail';
    }

    runtime.currentFileIndex = null;
    runtime.currentFileSource = null;
}

function bindPhoneFilesV1Interactions(container) {
    if (!container || container.dataset.phoneFilesBound === 'true') return;

    const screen = document.getElementById('phone-files');
    const runtime = phoneFilesGetRuntime(container);
    const mainView = container.querySelector('#phone-files-main-view');
    const detailView = container.querySelector('#phone-files-detail-view');
    const folderView = container.querySelector('#phone-files-folder-view');
    const fileView = container.querySelector('#phone-files-file-view');
    const mainHeader = container.querySelector('#phone-files-main-header');
    const detailHeader = container.querySelector('#phone-files-detail-header');
    const folderHeader = container.querySelector('#phone-files-folder-header');
    const fileHeader = container.querySelector('#phone-files-file-header');

    if (mainView && mainHeader) {
        mainView.addEventListener('scroll', () => phoneFilesUpdateHeaderScroll(mainView, mainHeader));
    }
    if (detailView && detailHeader) {
        detailView.addEventListener('scroll', () => phoneFilesUpdateHeaderScroll(detailView, detailHeader));
    }
    if (folderView && folderHeader) {
        folderView.addEventListener('scroll', () => phoneFilesUpdateHeaderScroll(folderView, folderHeader));
    }
    if (fileView && fileHeader) {
        fileView.addEventListener('scroll', () => phoneFilesUpdateHeaderScroll(fileView, fileHeader));
    }

    container.addEventListener('click', event => {
        const target = event.target;
        if (!target.closest('.phone-files-generate-wrap')) {
            phoneFilesHideMenus(container);
        }

        const closeBtn = target.closest('[data-action="close-files-app"]');
        if (closeBtn) {
            event.preventDefault();
            if (screen) screen.classList.add('hidden');
            phoneFilesShowMain(container);
            return;
        }

        const backBtn = target.closest('[data-action="back-to-files-main"]');
        if (backBtn) {
            event.preventDefault();
            phoneFilesShowMain(container);
            return;
        }

        const backToDetailBtn = target.closest('[data-action="back-to-files-detail"]');
        if (backToDetailBtn) {
            event.preventDefault();
            phoneFilesShowDetail(container);
            return;
        }

        const backToFilePrevBtn = target.closest('[data-action="back-to-files-file-prev"]');
        if (backToFilePrevBtn) {
            event.preventDefault();
            phoneFilesCloseFile(container);
            return;
        }

        const mainGenerateBtn = target.closest('.phone-files-main-generate-btn');
        if (mainGenerateBtn) {
            event.preventDefault();
            const contact = getActivePhoneFilesContact();
            if (!contact) {
                alert('请先选择联系人');
                return;
            }
            generatePhoneFilesAll(contact, mainGenerateBtn);
            return;
        }

        const detailGenerateBtn = target.closest('.phone-files-detail-generate-btn');
        if (detailGenerateBtn) {
            event.preventDefault();
            event.stopPropagation();
            phoneFilesToggleMenu(container, 'files-detail-generate-menu');
            return;
        }

        const menuAction = target.closest('.phone-files-generate-menu [data-mode]');
        if (menuAction) {
            event.preventDefault();
            event.stopPropagation();
            const contact = getActivePhoneFilesContact();
            if (!contact) {
                alert('请先选择联系人');
                return;
            }
            const mode = menuAction.dataset.mode;
            const menu = menuAction.closest('.phone-files-generate-menu');
            const triggerBtn = menu && menu.previousElementSibling;
            phoneFilesHideMenus(container);
            generatePhoneFilesSection(contact, runtime.currentKey, mode, triggerBtn);
            return;
        }

        const folderCard = target.closest('.hidden-folder-card[data-folder-index]');
        if (folderCard && runtime.currentKey === 'hidden') {
            event.preventDefault();
            phoneFilesOpenFolder(container, Number(folderCard.dataset.folderIndex));
            return;
        }

        const fileBox = target.closest('.file-box[data-file-index]');
        if (fileBox) {
            event.preventDefault();
            const source = fileBox.dataset.fileSource === 'folder' ? 'folder' : 'section';
            phoneFilesOpenFile(container, Number(fileBox.dataset.fileIndex), source);
            return;
        }

        const item = target.closest('.list-item[data-item-key]');
        if (item) {
            event.preventDefault();
            phoneFilesOpenDetail(container, item.dataset.itemKey);
            return;
        }
    });

    container.__resetPhoneFilesView = () => {
        runtime.currentView = 'main';
        runtime.currentKey = null;
        runtime.currentFolderIndex = null;
        runtime.currentFolderName = '';
        phoneFilesRenderMainSections(container);
        phoneFilesShowMain(container);
        if (mainView) {
            mainView.scrollTop = 0;
        }
        if (detailView) {
            detailView.scrollTop = 0;
        }
        if (folderView) {
            folderView.scrollTop = 0;
        }
        if (fileView) {
            fileView.scrollTop = 0;
        }
        if (mainHeader) mainHeader.classList.remove('scrolled');
        if (detailHeader) detailHeader.classList.remove('scrolled');
        if (folderHeader) folderHeader.classList.remove('scrolled');
        if (fileHeader) fileHeader.classList.remove('scrolled');
    };

    container.dataset.phoneFilesBound = 'true';
}

function ensurePhoneFilesV1Styles() {
    let styleEl = document.getElementById('phone-files-v1-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'phone-files-v1-style';
        document.head.appendChild(styleEl);
    }
    if (styleEl.textContent !== PHONE_FILES_V1_STYLE_TEXT) {
        styleEl.textContent = PHONE_FILES_V1_STYLE_TEXT;
    }
}

function ensurePhoneFilesV1Content() {
    const screen = phoneFilesEnsureShell();
    const container = screen.querySelector('#phone-files-content');
    if (!container) return null;

    container.style.background = '#F2F2F7';
    container.style.height = '100%';
    container.style.overflow = 'hidden';

    if (container.dataset.phoneFilesTemplateVersion !== PHONE_FILES_TEMPLATE_VERSION) {
        container.innerHTML = PHONE_FILES_V1_TEMPLATE_HTML;
        container.dataset.phoneFilesTemplateVersion = PHONE_FILES_TEMPLATE_VERSION;
        delete container.dataset.phoneFilesBound;
        delete container.__phoneFilesRuntime;
    }

    phoneFilesRenderMainSections(container);
    bindPhoneFilesV1Interactions(container);
    return container;
}

function openPhoneFilesApp() {
    const screen = phoneFilesEnsureShell();
    const content = ensurePhoneFilesV1Content();
    if (!screen || !content) return;

    ensurePhoneFilesV1Styles();
    if (typeof content.__resetPhoneFilesView === 'function') {
        content.__resetPhoneFilesView();
    }
    screen.classList.remove('hidden');
}

function refreshPhoneFilesApp(contactId, options = {}) {
    const container = document.getElementById('phone-files-content');
    if (!container) return;
    phoneFilesRenderMainSections(container);
    if (currentCheckPhoneContactId !== contactId) return;

    if (options.scope === 'section' && options.sectionKey) {
        const dataKey = phoneFilesResolveDataKey(options.sectionKey);
        const uiKey = PHONE_FILES_DATA_KEY_TO_UI_KEY[dataKey] || options.sectionKey;
        if (uiKey) {
            phoneFilesOpenDetail(container, uiKey);
            return;
        }
    }

    phoneFilesShowMain(container);
}

window.refreshPhoneFilesApp = refreshPhoneFilesApp;

async function generatePhoneFilesAll(contact, btn) {
    if (!contact || !btn) return;
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('generating-pulse');
    window.__phoneFilesGenerationContext = {
        contactId: contact.id,
        scope: 'all'
    };
    const systemPrompt = buildPhoneFilesSystemPrompt(contact, 'files_all');
    await callAiGeneration(contact, systemPrompt, 'files_all', btn, originalContent);
}

async function generatePhoneFilesSection(contact, sectionKey, mode, btn) {
    if (!contact || !sectionKey || !btn) return;
    const aiType = getPhoneFilesAiTypeBySectionKey(sectionKey);
    if (!aiType) return;
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('generating-pulse');
    window.__phoneFilesGenerationContext = {
        contactId: contact.id,
        scope: 'section',
        sectionKey: phoneFilesResolveDataKey(sectionKey),
        mode: mode === 'merge' ? 'merge' : 'replace'
    };
    const systemPrompt = buildPhoneFilesSystemPrompt(contact, aiType);
    await callAiGeneration(contact, systemPrompt, aiType, btn, originalContent);
}

const PHONE_FILES_PROMPT_TEMPLATES = {
    COMMON_CONTEXT: ({ contact, userName, userPersona, recentChatContext }) => `请你扮演“手机文件应用内容生成器”，为角色【${contact.name}】生成“文件 App”里的私人内容。

【角色设定】
姓名：${contact.name}
人设：${contact.persona || '无'}

【用户信息】
用户名称：${userName}
用户人设：${userPersona || '未填写'}

【与用户最近聊天上下文】
${recentChatContext || '暂无最近聊天记录'}

【生成目标】
这些内容应该像真实手机文件系统里会出现的文件和文件夹，而不是小说情节。重点不是直接给出结论，而是通过文件名、最近打开记录、下载记录、压缩包、扫描件、隐藏文件夹、收藏文件等细节，让人产生“这个东西不该翻到”“这里面像是有事”的感觉。

【整体要求】
1. 所有内容都必须像真实手机里会存在的文件，命名自然，不要太戏剧化，不要直接写成结论式名字。
2. 文件名要真实、有生活感，可以包含 PDF、Word、图片截图压缩包、备忘录导出文件、扫描件、加密文档、临时命名文件、含糊但让人想点开的命名。
3. 整体要有“查岗张力”，但不能全部都是重锤，应该是正常文件和微妙文件混合，真实感优先。
4. 至少 30%—40% 的内容要和“用户”有关，或者能让人联想到与用户的关系状态，但必须间接表达。
5. 文件来源要自然，比如：微信保存、浏览器下载、备忘录导出、扫描生成、相册整理、手动新建。
6. 时间分布要真实：最近打开更近，下载和收藏可以跨越更长时间。
7. 每个条目都要给出一句 hidden_tension，说明这个文件为什么容易让人多想。
8. 允许少量“私人资源 / 成人向 / 限制级”条目，但只能通过模糊文件名、来源、收藏/隐藏痕迹暗示，不要露骨，不要占多数。
9. 不要涉及未成年人、偷拍、暴力血腥、违法内容。
10. 【重要要求】：必须为每个文件生成具体的 \`content\` 字段，不能只写一两句纯文本。
11. \`content\` 必须使用 HTML 小模块排版，建议使用 1 到 3 个信息卡片组合（如 <div>, <b>, <ul>, <p>, <span style='color:xx'>, <table> 等），根据文件类型模拟真实的票据、便签、聊天记录文本、证明材料、下载清单、扫描摘录等排版。
12. 图片和视频类型不要只写“这是一张图片/视频”，而要用有背景色或渐变的 div 模拟预览画面，并补一小段说明文字；表格类文件尽量使用 table；压缩包尽量列出内部文件名片段。
13. 输出严格为 JSON，不要附加解释。`,
    files_all: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
请生成完整的文件 App 数据，包含以下 6 个模块：
- recent_opened：最近打开文件，6 到 10 条
- downloads：下载文件，6 到 10 条
- archives：压缩包文件，4 到 6 条
- scans：扫描件，4 到 6 条
- hidden_folders：隐藏文件夹，3 到 5 条
- favorite_files：收藏文件，4 到 6 条

【额外约束】
1. recent_opened 要体现“最近刚点开过”的感觉。
2. downloads 要让人觉得“为什么要下载这个”。
3. archives 要让人产生“为什么要特地压缩这个”的感觉。
4. scans 要有一点正式感、整理感、存档感。
5. hidden_folders 命名要低调、含糊、像故意不起眼，不要做成黑客感。
6. favorite_files 要体现“舍不得删”或“后面还会再看”。
7. 少量私人资源内容可以分布在 recent_opened、downloads、archives、hidden_folders、favorite_files 中，但只占小部分，正常文件仍是多数。
8. hidden_tension 必须生成，但不要在文本里直接下结论。

【字段要求】
普通文件条目字段：
- name
- type
- size
- time
- source
- summary
- content (必须是包含HTML标签的具体内容)
- related_to_user
- hidden_tension

隐藏文件夹条目字段：
- name
- type
- time
- locked
- file_count
- summary
- related_to_user
- hidden_tension
- items（数组，3 到 8 条，字段与普通文件条目一致）

其中 hidden_folders 中每个文件夹都需要生成内部文件 items，file_count 要和 items 数量一致。

【返回格式】
必须返回纯 JSON 对象：
{
  "recent_opened": [],
  "downloads": [],
  "archives": [],
  "scans": [],
  "hidden_folders": [],
  "favorite_files": []
}`,
    files_recent: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成 recent_opened 数组，6 到 10 条。

【要求】
1. 时间必须比较近，像最近 1 到 5 天内打开过。
2. 文件类型自然混合：pdf、docx、jpg、png、txt、note-export、zip、video、audio 等。
3. 至少 2 到 3 条带有关系张力，但不要写成直接实锤。
4. 可以包含少量私人资源相关记录，但命名必须自然、非露骨。

【返回格式】
返回纯 JSON 数组，字段为：name、type、size、time、source、summary、content(HTML格式)、related_to_user、hidden_tension。`,
    files_downloads: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成 downloads 数组，6 到 10 条。

【要求】
1. 来源自然，如：浏览器、微信、聊天、备忘录导出、手动保存。
2. 文件命名要真实，像手机里常见下载内容。
3. 可以混合普通资料、截图、导出文字、PDF、图片合集、临时存档，以及少量私人资源下载记录。
4. 私人资源条目必须非露骨，只通过命名、来源、保存行为暗示。

【返回格式】
返回纯 JSON 数组，字段为：name、type、size、time、source、summary、content(HTML格式)、related_to_user、hidden_tension。`,
    files_archives: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成 archives 数组，4 到 6 条。

【要求】
1. 压缩包命名必须真实，像手机用户会自己取的名字。
2. 可以包含截图合集压缩包、导出备份压缩包、聊天记录相关备份、图片整理包、临时归档包。
3. 至少 2 条应具备“想删又没删”或“想藏起来”的感觉。
4. 可以少量加入私人资源压缩包，但要低调命名、非露骨。

【返回格式】
返回纯 JSON 数组，字段为：name、type、size、time、source、summary、content(HTML格式)、related_to_user、hidden_tension。`,
    files_scans: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成 scans 数组，4 到 6 条。

【要求】
1. 文件类型统一偏向 pdf / scan。
2. 命名要像扫描 App 自动生成后又被轻微修改过。
3. 可以包括手写页扫描、便签扫描、打印页扫描、解释材料、整理材料、确认材料。
4. 一部分和用户有关，但要间接表达。

【返回格式】
返回纯 JSON 数组，字段为：name、type、size、time、source、summary、content(HTML格式)、related_to_user、hidden_tension。`,
    files_hidden: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成 hidden_folders 数组，3 到 5 条。

【要求】
1. 文件夹命名要低调、含糊、像故意不起眼，例如 _cache、temp_new、archive2、已整理、misc、private_save 这种气质，但不要机械照抄。
2. 不要直接命名成“秘密”“不能看”这类太假的名字。
3. 可以部分上锁，部分不上锁。
4. 可以有 1 到 2 个目录与私人资源有关，但命名必须低调，不能露骨。
5. 每个文件夹都要带一个 items 数组，里面生成 3 到 8 个文件，供用户点进去查看。
6. file_count 要和 items 数量一致。

【返回格式】
返回纯 JSON 数组，字段为：name、type、time、locked、file_count、summary、related_to_user、hidden_tension、items。items 里每一项字段为：name、type、size、time、source、summary、content(HTML格式)、related_to_user、hidden_tension。`,
    files_favorites: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成 favorite_files 数组，4 到 6 条。

【要求】
1. 文件类型自然混合：pdf、图片、导出笔记、文档、压缩包、视频或音频。
2. 至少 2 条要让人感觉“舍不得删”“留着以后解释/回看”“和用户有关但不想明说”。
3. 可以出现 1 到 2 个被反复保留的私人资源文件，但要保持非露骨、真实、低调。

【返回格式】
返回纯 JSON 数组，字段为：name、type、size、time、source、summary、content(HTML格式)、related_to_user、hidden_tension。`
};

function buildPhoneFilesSystemPrompt(contact, type) {
    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: '暂无最近聊天记录',
        userPersonaFallback: '未填写'
    });
    const userName = phoneFilesNormalizeText(sharedContext.userName, '用户');
    const userPersona = phoneFilesNormalizeText(sharedContext.userPersona, '');
    const recentChatContext = sharedContext.recentChatContext;
    const COMMON_CONTEXT = PHONE_FILES_PROMPT_TEMPLATES.COMMON_CONTEXT({
        contact,
        userName,
        userPersona,
        recentChatContext
    });
    const builder = PHONE_FILES_PROMPT_TEMPLATES[type] || PHONE_FILES_PROMPT_TEMPLATES.files_all;
    return builder({ COMMON_CONTEXT, contact, userName, userPersona, recentChatContext });
}

function handlePhoneWechatBgUpload(e) {
    if (!currentCheckPhoneContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
    if (!contact) return;

    const file = e.target.files[0];
    if (!file) return;

    // 复用 core.js 中的 compressImage
    if (window.compressImage) {
        window.compressImage(file, 800, 0.7).then(base64 => {
            contact.momentsBg = base64;
            const coverEl = document.getElementById('phone-wechat-cover');
            if (coverEl) {
                coverEl.style.backgroundImage = `url('${base64}')`;
                coverEl.style.backgroundColor = 'transparent';
            }
            // 保存配置
            if (window.saveConfig) window.saveConfig();
        }).catch(err => {
            console.error('图片压缩失败', err);
        });
    }
    e.target.value = '';
}

function renderPhoneContactList() {
    const list = document.getElementById('phone-contact-list');
    if (!list) return;
    list.innerHTML = '';

    const contacts = window.iphoneSimState.contacts || [];
    if (contacts.length === 0) {
        list.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">暂无联系人</div>';
        return;
    }

    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.style.cursor = 'pointer';
        
        const avatar = contact.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown';
        const name = contact.remark || contact.name || '未知';

        item.innerHTML = `
            <div class="list-content">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
                    <span style="font-size: 17px; color: #000;">${name}</span>
                </div>
                <i class="fas fa-chevron-right" style="color: #ccc;"></i>
            </div>
        `;
        item.onclick = () => enterPhoneCheck(contact.id);
        list.appendChild(item);
    });
}

function enterPhoneCheck(contactId) {
    currentCheckPhoneContactId = contactId;
    const modal = document.getElementById('phone-contact-select-modal');
    if (modal) modal.classList.add('hidden');
    
    // 打开查手机应用
    const app = document.getElementById('phone-app');
    if (app) app.classList.remove('hidden');
    
    // 加载特定联系人的布局
    loadPhoneLayout(contactId);
    calculateTotalPhonePages();
    renderPhonePages();
    renderPhoneItems();
    applyPhoneWallpaper();
    refreshPhoneDeliveryApp(contactId);
    refreshPhoneParcelApp(contactId);

    // 加载并设置朋友圈背景
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (contact) {
        const coverEl = document.getElementById('phone-wechat-cover');
        const bg = contact.momentsBg || contact.profileBg || '';
        if (coverEl) {
            if (bg) {
                coverEl.style.backgroundImage = `url('${bg}')`;
                coverEl.style.backgroundColor = 'transparent';
            } else {
                coverEl.style.backgroundImage = '';
                coverEl.style.backgroundColor = '#333';
            }
            
            // 绑定点击更换背景事件
            coverEl.onclick = () => {
                const input = document.getElementById('phone-wechat-bg-input');
                if (input) input.click();
            };
        }
    }
}

function calculateTotalPhonePages() {
    let maxIndex = -1;
    getPhoneGridItems().forEach(item => {
        if (item.index > maxIndex) maxIndex = item.index;
    });
    const neededPages = Math.floor(maxIndex / PHONE_SLOTS_PER_PAGE) + 1;
    totalPhonePages = Math.max(2, neededPages);
}

function loadPhoneLayout(contactId) {
    // 确保初始化
    if (!window.iphoneSimState.phoneLayouts) window.iphoneSimState.phoneLayouts = {};
    
    // 尝试获取该联系人的布局
    let layout = window.iphoneSimState.phoneLayouts[contactId];
    
    if (layout && Array.isArray(layout) && layout.length > 0) {
        phoneScreenData = JSON.parse(JSON.stringify(layout)); // Deep copy
        // 补丁：确保必有的应用存在
        const requiredApps = [
            { appId: 'phone-browser', name: '浏览器', iconClass: 'fab fa-safari', color: '#007AFF', type: 'app' },
            { appId: 'phone-xianyu', name: '闲鱼', iconClass: 'fas fa-fish', color: '#FFDA44', type: 'app' },
            { appId: 'phone-notes', name: '备忘录', iconClass: 'fas fa-sticky-note', color: '#FFD60A', type: 'app' },
            { appId: 'phone-messages', name: '短信', iconClass: 'fas fa-comment-alt', color: '#34C759', type: 'app' },
            { appId: 'phone-delivery', name: '外卖', iconClass: 'fas fa-utensils', color: '#FF9500', type: 'app' },
            { appId: 'phone-files', name: '文件', iconClass: 'fas fa-folder-open', color: '#007AFF', type: 'app' },
            { ...PHONE_THEME_APP },
            { appId: 'phone-health', name: '健康', iconClass: 'fas fa-heartbeat', color: '#FF2D55', type: 'app' },
            { appId: 'phone-parcel', name: '快递', iconClass: 'fas fa-box', color: '#8E8E93', type: 'app' }
        ];

        requiredApps.forEach(app => {
            if (!phoneScreenData.some(item => item.appId === app.appId)) {
                // 寻找空位
                let freeIndex = -1;
                const maxSearch = 100; // 搜索范围
                for (let i = 0; i < maxSearch; i++) {
                    let occupied = false;
                    // 尝试使用全局检测函数
                    if (window.getOccupiedSlots && window.isCollision) {
                        const slots = window.getOccupiedSlots(i, '1x1');
                        if (slots) {
                            occupied = getPhoneGridItems().some(existing => window.isCollision(existing, slots));
                        }
                    } else {
                        occupied = getPhoneGridItems().some(item => item.index === i);
                    }
                    
                    if (!occupied) {
                        freeIndex = i;
                        break;
                    }
                }

                if (freeIndex !== -1) {
                    phoneScreenData.push({
                        index: freeIndex,
                        ...app,
                        _internalId: Math.random().toString(36).substr(2, 9)
                    });
                }
            }
        });

    } else {
        // 如果没有，使用默认布局
        phoneScreenData = [
            { index: 0, type: 'app', name: '微信', iconClass: 'fab fa-weixin', color: '#07C160', appId: 'phone-wechat' },
            { index: 1, type: 'app', name: '微博', iconClass: 'fab fa-weibo', color: '#E6162D', appId: 'phone-weibo' },
            { index: 2, type: 'app', name: 'iCity', iconClass: 'fas fa-building', color: '#FF9500', appId: 'phone-icity' },
            { index: 3, type: 'app', name: '浏览器', iconClass: 'fab fa-safari', color: '#007AFF', appId: 'phone-browser' },
            { index: 4, type: 'app', name: '闲鱼', iconClass: 'fas fa-fish', color: '#FFDA44', appId: 'phone-xianyu' },
            { index: 5, type: 'app', name: '备忘录', iconClass: 'fas fa-sticky-note', color: '#FFD60A', appId: 'phone-notes' },
            { index: 6, type: 'app', name: '短信', iconClass: 'fas fa-comment-alt', color: '#34C759', appId: 'phone-messages' },
            { index: 7, type: 'app', name: '外卖', iconClass: 'fas fa-utensils', color: '#FF9500', appId: 'phone-delivery' },
            { index: 8, type: 'app', name: '文件', iconClass: 'fas fa-folder-open', color: '#007AFF', appId: 'phone-files' },
            { index: 9, type: 'app', name: '健康', iconClass: 'fas fa-heartbeat', color: '#FF2D55', appId: 'phone-health' },
            { index: 10, type: 'app', name: '快递', iconClass: 'fas fa-box', color: '#8E8E93', appId: 'phone-parcel' },
            { index: 11, type: 'app', name: '美化', iconClass: 'fas fa-paint-brush', color: '#5856D6', appId: 'phone-theme' }
        ];
    }
    
    normalizePhoneDockLayout();

    // 确保有内部 ID
    phoneScreenData.forEach(item => {
        if (!item._internalId) item._internalId = Math.random().toString(36).substr(2, 9);
    });
}

function savePhoneLayout() {
    if (!currentCheckPhoneContactId) return;
    
    // 保存到全局状态
    window.iphoneSimState.phoneLayouts[currentCheckPhoneContactId] = phoneScreenData;
    
    // 持久化保存
    if (window.saveConfig) window.saveConfig();
}

// --- 渲染 (复用之前的逻辑，略微调整) ---

function renderPhonePages() {
    if (!phonePagesWrapper) return;
    phonePagesWrapper.innerHTML = '';
    phonePageIndicators.innerHTML = '';
    
    for (let p = 0; p < totalPhonePages; p++) {
        const page = document.createElement('div');
        page.className = 'home-screen-page';
        
        const grid = document.createElement('div');
        grid.className = 'home-screen-grid';
        if (isPhoneEditMode) grid.classList.add('edit-mode');
        
        for (let i = 0; i < PHONE_SLOTS_PER_PAGE; i++) {
            const globalIndex = p * PHONE_SLOTS_PER_PAGE + i;
            const slot = document.createElement('div');
            slot.classList.add('grid-slot');
            slot.dataset.index = globalIndex;
            slot.dataset.page = p;
            
            slot.addEventListener('dragover', handlePhoneDragOver);
            slot.addEventListener('drop', handlePhoneDrop);
            slot.addEventListener('touchstart', handlePhoneSlotTouchStart, { passive: false });
            slot.addEventListener('mousedown', handlePhoneSlotMouseDown);
            
            grid.appendChild(slot);
        }
        
        page.appendChild(grid);
        phonePagesWrapper.appendChild(page);
        
        const dot = document.createElement('div');
        dot.className = `page-dot ${p === 0 ? 'active' : ''}`;
        phonePageIndicators.appendChild(dot);
    }
}

function updatePhoneIndicators() {
    if (!phonePageIndicators) return;
    const dots = phonePageIndicators.querySelectorAll('.page-dot');
    dots.forEach((dot, index) => {
        if (index === currentPhonePage) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function renderPhoneItems() {
    const gridItems = getPhoneGridItems();
    applyPhoneWallpaper();

    phoneItemElementMap.forEach((el, id) => {
        if (!gridItems.some(i => i._internalId === id)) {
            if (el.parentNode) el.parentNode.removeChild(el);
            phoneItemElementMap.delete(id);
        }
    });

    if (!phonePagesWrapper) return;
    const slots = phonePagesWrapper.querySelectorAll('.grid-slot');
    
    slots.forEach(slot => {
        const delBtn = slot.querySelector('.delete-btn');
        if (delBtn) delBtn.remove();
        
        slot.className = 'grid-slot';
        slot.style.display = 'block';
        slot.style.gridColumn = 'auto';
        slot.style.gridRow = 'auto';
        slot.removeAttribute('style');
    });

    const grids = phonePagesWrapper.querySelectorAll('.home-screen-grid');
    grids.forEach(grid => {
        if (isPhoneEditMode) grid.classList.add('edit-mode');
        else grid.classList.remove('edit-mode');
    });

    let coveredIndices = [];
    gridItems.forEach(item => {
        if (item.size && item.size !== '1x1') {
            const occupied = window.getOccupiedSlots(item.index, item.size);
            if (occupied) {
                occupied.forEach(id => {
                    if (id !== item.index) coveredIndices.push(id);
                });
            }
        }
    });

    coveredIndices.forEach(id => {
        if (slots[id]) slots[id].style.display = 'none';
    });

    gridItems.forEach(item => {
        const slot = slots[item.index];
        if (!slot) return;

        const canDrag = isPhoneEditMode;
        let el = phoneItemElementMap.get(item._internalId);

        if (!el) {
            if (item.type === 'custom-json-widget' && window.createCustomJsonWidget) {
                el = window.createCustomJsonWidget(item, canDrag);
            } else if (item.type === 'app') {
                el = createPhoneAppElement(item, canDrag);
            }

            if (el) {
                phoneItemElementMap.set(item._internalId, el);
                el.dataset.itemId = item._internalId;
            }
        }

        if (el) {
            el.setAttribute('draggable', canDrag);
            el.ondragstart = (e) => handlePhoneDragStart(e, item);
            el.ondragend = (e) => handlePhoneDragEnd(e, item);
            
            if (canDrag) {
                el.addEventListener('touchstart', (e) => handlePhoneItemTouchStart(e, item), { passive: false });
                el.addEventListener('touchmove', handlePhoneItemTouchMove, { passive: false });
                el.addEventListener('touchend', (e) => handlePhoneItemTouchEnd(e, item), { passive: false });
            }

            if (item.size && window.applyWidgetSize) {
                window.applyWidgetSize(slot, item.size);
                slot.classList.add('widget-slot');
            }

            if (isPhoneEditMode) {
                addPhoneDeleteButton(slot, item);
            }

            if (el.parentNode !== slot) {
                slot.appendChild(el);
            }
        }
    });

    renderPhoneDock();
}

function addPhoneDeleteButton(slot, item) {
    if (!item || item.type === 'app') return;
    const btn = document.createElement('div');
    btn.className = 'delete-btn';
    btn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`确定要移除 ${item.name || '这个组件'} 吗？`)) {
            removePhoneItem(item);
        }
    };
    slot.appendChild(btn);
}

function removePhoneItem(item) {
    phoneScreenData = phoneScreenData.filter(i => i !== item);
    savePhoneLayout();
    renderPhoneItems();
}

// --- 拖拽逻辑 (保持不变) ---
function handlePhoneDragStart(e, item) {
    phoneDragItem = item;
    isPhoneDropped = false;
    e.dataTransfer.effectAllowed = 'move';
    phoneScreenData.forEach(i => i._originalIndex = i.index);
    setTimeout(() => {
        if (phoneItemElementMap.has(item._internalId)) {
            phoneItemElementMap.get(item._internalId).style.opacity = '0';
        }
    }, 0);
}

function handlePhoneDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!phoneDragItem) return;
    if (phoneDragThrottleTimer) return;
    phoneDragThrottleTimer = setTimeout(() => { phoneDragThrottleTimer = null; }, 50);
    const targetSlot = e.target.closest('.grid-slot');
    if (!targetSlot) return;
    const targetIndex = parseInt(targetSlot.dataset.index);
    if (targetIndex === lastPhoneDragTargetIndex) return;
    lastPhoneDragTargetIndex = targetIndex;
    phoneScreenData.forEach(i => {
        if (i._originalIndex !== undefined) i.index = i._originalIndex;
    });
    reorderPhoneItems(phoneDragItem, targetIndex);
    renderPhoneItems();
}

function handlePhoneDrop(e) {
    e.preventDefault();
    isPhoneDropped = true;
    savePhoneLayout();
}

function handlePhoneDragEnd(e, item) {
    if (!isPhoneDropped) {
        phoneScreenData.forEach(i => {
            if (i._originalIndex !== undefined) i.index = i._originalIndex;
        });
        renderPhoneItems();
    }
    phoneScreenData.forEach(i => delete i._originalIndex);
    if (phoneDragItem && phoneItemElementMap.has(phoneDragItem._internalId)) {
        phoneItemElementMap.get(phoneDragItem._internalId).style.opacity = '';
    }
    phoneDragItem = null;
    lastPhoneDragTargetIndex = -1;
}

function reorderPhoneItems(draggedItem, targetIndex) {
    let newSlots = window.getOccupiedSlots(targetIndex, draggedItem.size || '1x1');
    if (!newSlots) return;
    let victims = getPhoneGridItems().filter(i => i !== draggedItem && window.isCollision(i, newSlots));
    if (victims.length === 0) {
        draggedItem.index = targetIndex;
        return;
    }
    draggedItem.index = targetIndex;
    victims.sort((a, b) => a.index - b.index);
    victims.forEach(victim => {
        shiftPhoneItem(victim, targetIndex + 1);
    });
}

function shiftPhoneItem(item, newIndex) {
    if (newIndex >= totalPhonePages * PHONE_SLOTS_PER_PAGE) return;
    let newSlots = window.getOccupiedSlots(newIndex, item.size || '1x1');
    if (!newSlots) {
        return shiftPhoneItem(item, newIndex + 1);
    }
    item.index = newIndex;
    let victims = getPhoneGridItems().filter(i => i !== item && window.isCollision(i, newSlots));
    victims.forEach(v => shiftPhoneItem(v, v.index + 1));
}

// --- 触摸拖拽逻辑 (保持不变) ---
function handlePhoneSlotTouchStart(e) {
    const slot = e.currentTarget;
    if (e.target !== slot) return;
    clearTimeout(phoneLongPressTimer);
    const touch = e.touches[0];
    phoneTouchStartPos = { x: touch.clientX, y: touch.clientY };
    slot.style.transition = 'background-color 0.5s';
    phoneLongPressTimer = setTimeout(() => {
        if (!isPhoneEditMode) {
            if (navigator.vibrate) navigator.vibrate(50);
            slot.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            togglePhoneEditMode();
        }
    }, 500);
    const cancel = () => {
        clearTimeout(phoneLongPressTimer);
        slot.style.backgroundColor = '';
        slot.style.transition = '';
        document.removeEventListener('touchmove', checkMove);
        document.removeEventListener('touchend', cancel);
    };
    const checkMove = (e) => {
        const touch = e.touches[0];
        if (Math.abs(touch.clientX - phoneTouchStartPos.x) > 10 || Math.abs(touch.clientY - phoneTouchStartPos.y) > 10) {
            cancel();
        }
    };
    document.addEventListener('touchmove', checkMove, { passive: true });
    document.addEventListener('touchend', cancel, { once: true });
}

function handlePhoneSlotMouseDown(e) {
    const slot = e.currentTarget;
    if (e.target !== slot) return;
    clearTimeout(phoneLongPressTimer);
    phoneTouchStartPos = { x: e.clientX, y: e.clientY };
    slot.style.transition = 'background-color 0.5s';
    phoneLongPressTimer = setTimeout(() => {
        if (!isPhoneEditMode) {
            slot.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            togglePhoneEditMode();
        }
    }, 500);
    const cancel = () => {
        clearTimeout(phoneLongPressTimer);
        slot.style.backgroundColor = '';
        slot.style.transition = '';
        document.removeEventListener('mousemove', checkMove);
        document.removeEventListener('mouseup', cancel);
    };
    const checkMove = (e) => {
        if (Math.abs(e.clientX - phoneTouchStartPos.x) > 10 || Math.abs(e.clientY - phoneTouchStartPos.y) > 10) {
            cancel();
        }
    };
    document.addEventListener('mousemove', checkMove);
    document.addEventListener('mouseup', cancel, { once: true });
}

function handlePhoneItemTouchStart(e, item) {
    if (!isPhoneEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    if (phoneTouchDragClone) {
        phoneTouchDragClone.remove();
        phoneTouchDragClone = null;
    }
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    phoneTouchStartPos = {
        x: touch.clientX, y: touch.clientY,
        offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top
    };
    phoneTouchCurrentPos = { ...phoneTouchStartPos };
    phoneTouchDraggedElement = e.currentTarget;
    phoneTouchDraggedItem = item;
    isPhoneTouchDragging = false;
    phoneScreenData.forEach(i => i._originalIndex = i.index);
    phoneTouchDragClone = phoneTouchDraggedElement.cloneNode(true);
    phoneTouchDragClone.style.cssText = `
        position: fixed; pointer-events: none; z-index: 10000; opacity: 0.8;
        transform: scale(1.1); transition: none;
        width: ${rect.width}px; height: ${rect.height}px;
        left: ${rect.left}px; top: ${rect.top}px;
    `;
    phoneTouchDragClone.classList.add('touch-drag-clone');
    document.body.appendChild(phoneTouchDragClone);
    phoneTouchDraggedElement.style.opacity = '0';
    phoneTouchDraggedElement.style.visibility = 'hidden';
}

function handlePhoneItemTouchMove(e) {
    if (!phoneTouchDraggedItem || !phoneTouchDragClone) return;
    e.preventDefault();
    const touch = e.touches[0];
    phoneTouchCurrentPos = { x: touch.clientX, y: touch.clientY };
    const dx = phoneTouchCurrentPos.x - phoneTouchStartPos.x;
    const dy = phoneTouchCurrentPos.y - phoneTouchStartPos.y;
    if (!isPhoneTouchDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isPhoneTouchDragging = true;
        if (navigator.vibrate) navigator.vibrate(10);
    }
    if (isPhoneTouchDragging) {
        phoneTouchDragClone.style.left = (phoneTouchCurrentPos.x - phoneTouchStartPos.offsetX) + 'px';
        phoneTouchDragClone.style.top = (phoneTouchCurrentPos.y - phoneTouchStartPos.offsetY) + 'px';
        const targetSlot = document.elementFromPoint(phoneTouchCurrentPos.x, phoneTouchCurrentPos.y)?.closest('.grid-slot');
        if (targetSlot) {
            const targetIndex = parseInt(targetSlot.dataset.index);
            if (!isNaN(targetIndex) && targetIndex !== lastPhoneDragTargetIndex) {
                lastPhoneDragTargetIndex = targetIndex;
                phoneScreenData.forEach(i => {
                    if (i._originalIndex !== undefined) i.index = i._originalIndex;
                });
                reorderPhoneItems(phoneTouchDraggedItem, targetIndex);
                renderPhoneItems();
            }
        }
    }
}

function handlePhoneItemTouchEnd(e, item) {
    if (!phoneTouchDraggedItem) return;
    e.preventDefault();
    if (phoneTouchDragClone) {
        phoneTouchDragClone.remove();
        phoneTouchDragClone = null;
    }
    const all = phonePagesWrapper.querySelectorAll('.draggable-item, .custom-widget');
    all.forEach(el => {
        el.style.opacity = '';
        el.style.visibility = '';
    });
    if (isPhoneTouchDragging) {
        phoneScreenData.forEach(i => delete i._originalIndex);
        renderPhoneItems();
        savePhoneLayout();
    } else {
        phoneScreenData.forEach(i => {
            if (i._originalIndex !== undefined) i.index = i._originalIndex;
        });
        phoneScreenData.forEach(i => delete i._originalIndex);
        renderPhoneItems();
    }
    phoneTouchDraggedItem = null;
    phoneTouchDraggedElement = null;
    isPhoneTouchDragging = false;
    lastPhoneDragTargetIndex = -1;
}

// --- 工具栏与组件库 ---

function togglePhoneEditMode() {
    isPhoneEditMode = !isPhoneEditMode;
    const toolbar = document.getElementById('phone-edit-mode-toolbar');
    if (toolbar) {
        if (isPhoneEditMode) toolbar.classList.remove('hidden');
        else toolbar.classList.add('hidden');
    }
    renderPhoneItems();
}

function renderPhoneLibrary() {
    if (!phoneLibraryModal) return;
    const scrollRow = phoneLibraryModal.querySelector('.library-scroll-row');
    if (!scrollRow) return;
    scrollRow.innerHTML = '';
    let importedWidgets = [];
    try {
        const savedLib = localStorage.getItem('myIOS_Library');
        if (savedLib) importedWidgets = JSON.parse(savedLib);
    } catch (e) {}
    if (importedWidgets.length === 0) {
        scrollRow.innerHTML = '<div style="padding: 20px; color: #888;">暂无导入的组件</div>';
    } else {
        importedWidgets.forEach(widget => {
            const el = document.createElement('div');
            el.className = 'library-item';
            el.innerHTML = `
                <div class="library-preview-box size-${widget.size}">
                    <div style="transform:scale(0.5); transform-origin:top left; width:200%; height:200%; overflow:hidden;">
                        ${widget.css ? `<style>${widget.css}</style>` : ''}
                        ${widget.html}
                    </div>
                </div>
                <div class="library-item-name">${widget.name}</div>
            `;
            el.onclick = () => addToPhoneScreen(widget);
            scrollRow.appendChild(el);
        });
    }
}

function addToPhoneScreen(widgetTemplate) {
    const newItem = { ...widgetTemplate };
    newItem._internalId = Math.random().toString(36).substr(2, 9);
    let freeIndex = -1;
    const maxSlots = totalPhonePages * PHONE_SLOTS_PER_PAGE;
    for (let i = 0; i < maxSlots; i++) {
        let slots = window.getOccupiedSlots(i, newItem.size || '1x1');
        if (slots) {
            let collision = getPhoneGridItems().some(existing => window.isCollision(existing, slots));
            if (!collision) {
                freeIndex = i;
                break;
            }
        }
    }
    if (freeIndex !== -1) {
        newItem.index = freeIndex;
        phoneScreenData.push(newItem);
        if (phoneLibraryModal) phoneLibraryModal.classList.remove('show');
        renderPhoneItems();
        savePhoneLayout();
    } else {
        alert("查手机页面空间不足");
    }
}

function setupPhoneListeners() {
    const addBtn = document.getElementById('phone-add-widget-btn');
    const saveBtn = document.getElementById('phone-save-layout-btn');
    const exitBtn = document.getElementById('phone-exit-edit-btn');
    const closeLibBtn = document.getElementById('phone-close-library-btn');
    const closeAppBtn = document.getElementById('close-phone-app');
    
    if (addBtn) addBtn.onclick = () => {
        renderPhoneLibrary();
        if (phoneLibraryModal) phoneLibraryModal.classList.add('show');
    };
    if (saveBtn) saveBtn.onclick = () => {
        savePhoneLayout();
        togglePhoneEditMode();
    };
    if (exitBtn) exitBtn.onclick = togglePhoneEditMode;
    if (closeLibBtn && phoneLibraryModal) {
        closeLibBtn.onclick = () => phoneLibraryModal.classList.remove('show');
    }
    if (closeAppBtn) {
        closeAppBtn.addEventListener('click', () => {
            closePhoneThemeApp();
            document.getElementById('phone-app').classList.add('hidden');
        });
    }
    const closeContactSelectBtn = document.getElementById('close-phone-contact-select');
    if (closeContactSelectBtn) {
        closeContactSelectBtn.onclick = () => {
            document.getElementById('phone-contact-select-modal').classList.add('hidden');
        };
    }
    
    // 绑定朋友圈背景上传事件
    const bgInput = document.getElementById('phone-wechat-bg-input');
    if (bgInput) {
        bgInput.addEventListener('change', handlePhoneWechatBgUpload);
    }

    setupPhoneAppListeners();
}

function setupPhoneAppListeners() {
    const btnWechat = document.getElementById('generate-wechat-btn');
    const btnWeibo = document.getElementById('generate-weibo-btn');
    const btnIcity = document.getElementById('generate-icity-btn');
    const btnBrowser = document.getElementById('generate-browser-btn');
    const btnXianyu = document.getElementById('generate-xianyu-btn');
    const btnDelivery = document.getElementById('generate-phone-delivery-btn');
    const btnParcel = document.getElementById('generate-phone-parcel-btn');

    if (btnWechat) btnWechat.onclick = () => handlePhoneAppGenerate('wechat');
    if (btnWeibo) btnWeibo.onclick = () => handlePhoneAppGenerate('weibo');
    if (btnIcity) btnIcity.onclick = () => handlePhoneAppGenerate('icity');
    if (btnBrowser) btnBrowser.onclick = () => handlePhoneAppGenerate('browser');
    if (btnXianyu) btnXianyu.onclick = () => handlePhoneAppGenerate('xianyu');
    if (btnDelivery) btnDelivery.onclick = () => handlePhoneAppGenerate('delivery');
    if (btnParcel) btnParcel.onclick = () => handlePhoneAppGenerate('parcel');
}

window.switchPhoneWechatTab = function(tabName) {
    const tabs = document.querySelectorAll('#phone-wechat .wechat-tab-item');
    const contents = document.querySelectorAll('.phone-wechat-tab-content');
    const header = document.getElementById('phone-wechat-header');
    const backBtn = document.getElementById('phone-wechat-back-btn');
    const title = document.getElementById('phone-wechat-title');
    const generateBtn = document.getElementById('generate-wechat-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.style.display = 'none');
    
    if (generateBtn) {
        // 重置按钮样式
        generateBtn.style.display = 'block';
        generateBtn.onclick = (e) => showPhoneWechatGenerateMenu(e);
    }

    if (tabName === 'contacts') {
        tabs[0].classList.add('active');
        document.getElementById('phone-wechat-tab-contacts').style.display = 'block';
        
        // Header style for Contacts (Chats)
        if (header) header.style.backgroundColor = '#ededed';
        if (backBtn) {
            backBtn.style.color = '#000';
            backBtn.style.textShadow = 'none';
        }
        if (title) {
            title.style.display = 'block';
            title.style.color = '#000';
            title.textContent = '微信'; // Ensure title is WeChat
        }
        if (generateBtn) {
            generateBtn.innerHTML = '<i class="fas fa-plus"></i>';
            generateBtn.style.color = '#000';
            generateBtn.style.textShadow = 'none';
            // 确保切换回来时重新绑定菜单事件
            generateBtn.onclick = (e) => showPhoneWechatGenerateMenu(e);
        }
        
        // 渲染聊天列表
        if (currentCheckPhoneContactId) {
            renderPhoneWechatContacts(currentCheckPhoneContactId);
        }

    } else {
        tabs[1].classList.add('active');
        document.getElementById('phone-wechat-tab-moments').style.display = 'block';
        
        // Header style for Moments
        if (header) header.style.backgroundColor = 'transparent';
        if (backBtn) {
            backBtn.style.color = '#fff';
            backBtn.style.textShadow = '0 1px 3px rgba(0,0,0,0.5)';
        }
        if (title) title.style.display = 'none';
        if (generateBtn) {
            generateBtn.innerHTML = '<i class="fas fa-camera"></i>';
            generateBtn.style.color = '#fff';
            generateBtn.style.textShadow = '0 1px 3px rgba(0,0,0,0.5)';
            // 确保切换回来时重新绑定菜单事件
            generateBtn.onclick = (e) => showPhoneWechatGenerateMenu(e);
        }
    }
};

function showPhoneWechatGenerateMenu(event) {
    event.stopPropagation();
    
    const existingMenu = document.getElementById('phone-generate-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.id = 'phone-generate-menu';
    menu.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 5}px;
        right: 10px;
        background: #4c4c4c;
        border-radius: 6px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        overflow: hidden;
    `;

    const options = [
        { text: '只生成聊天', icon: 'fas fa-comments', action: 'chat' },
        { text: '只生成动态', icon: 'fas fa-star', action: 'moments' },
        { text: '全部生成', icon: 'fas fa-magic', action: 'all' }
    ];

    options.forEach(opt => {
        const item = document.createElement('div');
        item.style.cssText = `
            padding: 12px 15px;
            color: #fff;
            font-size: 14px;
            border-bottom: 1px solid #5f5f5f;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            white-space: nowrap;
        `;
        if (opt === options[options.length - 1]) item.style.borderBottom = 'none';
        
        item.innerHTML = `<i class="${opt.icon}" style="width: 20px; text-align: center;"></i> ${opt.text}`;
        
        item.onclick = async () => {
            menu.remove();
            if (!currentCheckPhoneContactId) return;
            const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
            if (!contact) return;

            if (opt.action === 'chat') {
                await generatePhoneWechatChats(contact);
            } else if (opt.action === 'moments') {
                await generatePhoneWechatMoments(contact);
            } else if (opt.action === 'all') {
                await generatePhoneWechatAll(contact);
            }
        };
        
        menu.appendChild(item);
    });

    document.body.appendChild(menu);

    // 点击其他地方关闭
    const closeMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== event.target) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    // 延迟绑定，防止当前点击立即触发
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

async function handlePhoneAppGenerate(appType) {
    if (!currentCheckPhoneContactId) {
        alert('No contact selected');
        return;
    }
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
    if (!contact) {
        alert('Contact data error');
        return;
    }

    if (appType === 'wechat') {
        await generatePhoneWechatMoments(contact);
    } else if (appType === 'messages') {
        await generatePhoneMessagesAll(contact);
    } else if (appType === 'browser') {
        await generatePhoneBrowserHistory(contact);
    } else if (appType === 'xianyu') {
        await generatePhoneXianyuAll(contact);
    } else if (appType === 'health') {
        await generatePhoneHealthAll(contact);
    } else if (appType === 'delivery') {
        await generatePhoneDeliveryAll(contact);
    } else if (appType === 'parcel') {
        await generatePhoneParcelAll(contact);
    } else {
        alert(`Generating ${contact.name}'s ${appType} content...\n(Feature in progress)`);
    }
}

function buildPhoneDeliverySystemPrompt(contact) {
    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: 'No recent chat context.',
        userPersonaFallback: 'Not provided'
    });
    const userName = normalizePhoneDeliveryText(sharedContext.userName, '用户');
    const userPersona = normalizePhoneDeliveryText(sharedContext.userPersona, 'Not provided');
    const recentChatContext = sharedContext.recentChatContext;

    return `You are generating a fake-but-highly-believable food delivery / errand app dataset for a mobile phone inspection scenario.

Current contact: ${contact.name}
Contact persona: ${sharedContext.contactPersona || 'None'}
User name: ${userName}
User persona: ${userPersona}
Recent chat context (only for subtle indirect tension, never copy wording, never state conclusions directly):
${recentChatContext}

Task:
Act as a "mobile delivery / errand app content generator" and output one strict JSON object for a realistic delivery app.
This is NOT chat history. It should feel like everyday platform residue: repeated late-night orders, frequently used addresses, terse delivery notes, occasional orders for someone else, favorite stores, repeated reorders, and a few subtle emotionally-loaded details.

Hard requirements:
- The output must be STRICT JSON only. No markdown, no explanation.
- All visible content values should be in natural Simplified Chinese unless the field is naturally a brand name or mixed-language store name.
- Do not write direct conclusions. Create implication through address reuse, order timing, notes, review text, recipient names, and order rhythm.
- Most records should look normal. Only a minority should feel subtly loaded.
- Use desensitized or fictional phone numbers, order IDs, amounts, and addresses.
- Keep all requested fields; do not omit fields.

Generate these modules:
- delivery_addresses: 3 to 5 items
- taste_notes: 4 to 8 items
- active_order: 1 item
- frequent_shops: 4 to 6 items
- favorite_shops: 4 to 6 items
- recent_orders: 6 to 10 items
- gift_orders: 3 to 5 items
- pickup_orders: 2 to 4 items

Field schema:
- delivery_addresses item fields:
  label, recipient, recipient_phone, address, is_default, used_count, note, related_to_user, hidden_tension
- taste_notes item fields:
  text, used_count, last_used_at, scene, related_to_user, hidden_tension
- active_order fields:
  store_name, status, eta_text, items_preview, courier_name, track_hint, recipient, recipient_phone, address, remark, total, related_to_user, hidden_tension
- frequent_shops / favorite_shops item fields:
  store_name, category, tag, avg_spend, order_count, last_ordered_at, common_address, common_items, popup_summary, reason, related_to_user, hidden_tension
- recent_orders / gift_orders / pickup_orders item fields:
  store_name, status, ordered_at, delivery_type, item_count, items_preview, items, subtotal, delivery_fee, total, courier_name, eta_text, recipient, recipient_phone, address_label, address, remark, order_id, delivery_status, rating_level, review_text, review_style, related_to_user, hidden_tension

Constraints:
- rating_level must be exactly one of: \u975e\u5e38\u4e0d\u6ee1\u610f, \u4e0d\u6ee1\u610f, \u4e00\u822c, \u6ee1\u610f, \u975e\u5e38\u6ee1\u610f
- review_style must be exactly one of: grid, ruled, plain-yellow
- review_text must be exactly one short sentence
- gift order recipient can be someone else such as a friend, coworker, or a recurring contact
- pickup orders should show life-like pickup timing or pickup status
- A repeated fixed address should appear often enough to feel suspiciously habitual, but not on every order
- Mix ordinary notes with more suggestive ones, for example: no calls, leave at door, message on arrival, less ice, extra spicy, do not ring, front desk pickup
- common_address should be a short address label or abbreviated place description suitable for direct popup display, such as “公司前台”, “公寓楼下”, “静安寺附近”
- common_items should be 2 to 4 commonly ordered items in one natural Chinese string separated by “、”, suitable for direct popup display
- popup_summary should be one natural Chinese sentence for the shop popup card, like a private observation about why this store keeps appearing; about 16 to 32 Chinese characters, not formal, not a system notice
- reason should also be natural Chinese and feel like a personal usage reason, not a platform tag or generic marketing copy
- At least 30% to 40% of the content should be indirectly related to the user, but never written as a direct conclusion
- Make the subtle tension come from details like late-night ordering, note changes, a recurring address, help-order traces, favorite stores, and short reviews

Output one legal JSON object and nothing else.`;
}

async function generatePhoneDeliveryAll(contact) {
    const btn = document.getElementById('generate-phone-delivery-btn');
    const originalContent = btn ? btn.innerHTML : null;
    if (btn) {
        btn.classList.add('phone-delivery-generating');
        btn.disabled = true;
    }

    const systemPrompt = buildPhoneDeliverySystemPrompt(contact);
    await callAiGeneration(contact, systemPrompt, 'delivery_all', btn, originalContent);
}

function buildPhoneParcelSystemPrompt(contact) {
    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: '无最近聊天上下文',
        userPersonaFallback: '未填写'
    });
    const userName = normalizePhoneDeliveryText(sharedContext.userName, '用户');
    const userPersona = normalizePhoneDeliveryText(sharedContext.userPersona, '未填写');
    const recentChatContext = sharedContext.recentChatContext;

    return `你是一个“恋爱场景下查手机”的虚拟快递应用内容生成器。

当前手机主人：${contact.name}
人设：${sharedContext.contactPersona || '无'}
用户名称：${userName}
用户人设：${userPersona}
最近聊天上下文（只能用于间接影响生活痕迹，不能照抄聊天原句，不能直接下结论）：
${recentChatContext}

你的任务：生成一个看起来真实、克制、但能让人隐约感觉“不太对劲”的快递应用页面数据。

生成原则：
1. 输出必须是严格 JSON 对象，不要 markdown，不要解释。
2. 所有可见文案默认使用简体中文，品牌名可中英混合。
3. 不要直接写“出轨”“暧昧对象”“给别人买礼物”这类结论。
4. 通过收件人、地址复用、深夜签收、隐私面单、备注、退回记录、地址页频率这些细节制造张力。
5. 大多数内容必须正常，只有少部分细节微妙可疑。
6. 时间必须真实分布，能和“查手机”场景匹配。

请输出以下结构：
{
  "featured_card": {
    "status_label": "DELIVERED / TRANSIT / EXCEPTION 之一",
    "status_meta": "如 03:15 AM / SF / ZTO",
    "status_color": "green 或 orange 或 red",
    "title": "包裹标题",
    "receiver": "收件人",
    "address": "地址 + 代收信息",
    "tags": ["标签1", "标签2", "标签3"]
  },
  "list_items": [
    {
      "status_label": "DELIVERED / TRANSIT / EXCEPTION",
      "status_meta": "承运商或时间",
      "status_color": "green / orange / red",
      "title": "包裹标题",
      "subtitle": "一句副标题，如 送至：XX 或 拒收退回中",
      "badge": "右侧小标签，可为空字符串"
    }
  ],
  "detail": {
    "hero_icon": "Remix Icon 类名，如 ri-box-3-line",
    "hero_status": "详情页主状态",
    "hero_track": "快递公司 + 单号缩写",
    "note": "一句会让人多想的收件备注",
    "timeline": [
      { "time": "时间", "title": "节点标题", "desc": "节点描述", "active": true }
    ],
    "info": {
      "receiver": "收件人 + 脱敏手机号",
      "address": "详细地址",
      "content": "模糊内容",
      "sender": "发件人信息"
    }
  },
  "addresses": [
    {
      "title": "地址名称",
      "count_label": "如 15 TIMES",
      "common_receiver": "常见收件人",
      "last_seen": "最近一次时间",
      "tags": ["标签1", "标签2"]
    }
  ]
}

数量要求：
- list_items: 2 到 4 条
- timeline: 3 到 5 条
- addresses: 3 到 5 条

额外要求：
- featured_card 必须比其他项更“有信息量”，适合放在首页最上方。
- 至少 30% 的内容与“用户关系”间接相关，但只能通过生活痕迹体现。
- 可以出现：非默认地址、酒店/公寓/快递柜、代收、深夜签收、拒收退回、隐私发件人、不要打电话、放门口等。
- 不要把所有内容都做得很可疑，要像真实生活记录。

只输出合法 JSON。`;
}

async function generatePhoneParcelAll(contact) {
    const btn = document.getElementById('generate-phone-parcel-btn');
    const originalContent = btn ? btn.innerHTML : null;
    if (btn) {
        btn.classList.add('generating-pulse');
        btn.disabled = true;
        btn.innerHTML = '<i class="ri-loader-4-line"></i>';
    }

    const systemPrompt = buildPhoneParcelSystemPrompt(contact);
    await callAiGeneration(contact, systemPrompt, 'parcel_all', btn, originalContent);
}

async function generatePhoneWechatAll(contact) {
    const btn = document.getElementById('generate-wechat-btn');
    if (btn) {
        btn.disabled = true;
        btn.classList.add('generating-pulse');
    }

    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: '暂无最近聊天记录可供参考。',
        userPersonaFallback: '未填写'
    });
    const recentChatContext = sharedContext.recentChatContext;

    const systemPrompt = `你是一个虚拟手机内容生成器。请为角色【${contact.name}】生成微信内容（包含聊天列表和朋友圈）。
角色设定：${sharedContext.contactPersona || '无'}
用户名称：${sharedContext.userName}
用户人设：${sharedContext.userPersonaText}

${recentChatContext}

【关联原则】
1. 你可以让一部分内容受到最近与用户聊天状态的影响，例如：吵架、冷战、准备见面、答应哄用户、为了用户推掉邀约、因为用户而情绪波动等。
2. 这些影响应当主要体现在【与其他NPC的聊天】、【${contact.name}自己发的朋友圈】、以及【其他人对${contact.name}近况的评论】里。
3. 允许少量出现对“用户/对象/她/他”的间接提及，但【绝对不要】直接生成与用户本人的微信会话。
4. 不要照抄最近聊天原句，只能做自然改写、侧面映射或延伸。

【任务要求 1：聊天列表 (chats)】
1. 生成 6-10 个聊天会话。
2. 包含好友、群聊、工作联系人。
3. 【重要】绝不要生成与"我"、"玩家"、"User"、"{{user}}"或当前手机持有者自己的聊天。只生成与其他NPC（虚构人物）的聊天。
4. 每个会话包含 "messages" 数组 (5-10条记录)。
   - role: "friend" 或 "me"。
   - type: "text", "image", "voice"。

【任务要求 2：朋友圈 (moments)】
1. 生成 8-12 条动态。
2. 【关键】必须包含大量其他好友（NPC）的动态。
   - 只有 3-4 条是【${contact.name}】自己发的。
   - 剩余 6-7 条必须是【${contact.name}】的好友、同事、家人等发的。
3. 【图片生成规则】：images数组请使用【英文关键词|中文描述】格式
   - 正确示例："cute cat|可爱小猫", "sunset beach|海滩日落", "delicious pizza|美味披萨"
   - 英文要简单明确，中文是备用显示文本
4. 设置可见性(visibility)：请随机包含 1-2 条【仅自己可见】的动态（visibility: {type: "private"}），通常是emo或深夜感悟。

【返回格式】
必须是合法的 JSON 对象：
{
  "chats": [ { "name": "...", "avatar": "...", "lastMessage": "...", "time": "...", "unread": 0, "messages": [...] }, ... ],
  "moments": [ { "isSelf": true, "name": "...", "content": "...", "images": [...], "time": "...", "likes": [...], "comments": [...], "visibility": {...} }, ... ]
}`;

    await callAiGeneration(contact, systemPrompt, 'all', btn);
}

function buildPhoneWechatRecentChatContext(contact) {
    const state = window.iphoneSimState || {};
    const historyMap = state.chatHistory || {};
    const rawHistory = Array.isArray(historyMap[contact.id]) ? historyMap[contact.id] : [];
    const { userName } = resolvePhonePromptUserIdentity(contact);

    const recentMessages = rawHistory
        .filter(msg => {
            if (!msg || typeof msg !== 'object') return false;
            if (msg.type === 'system_event' || msg.type === 'live_sync_hidden' || msg.type === 'voice_call_text') return false;

            const content = typeof msg.content === 'string' ? msg.content.trim() : '';
            if (!content) return false;
            if (content.startsWith('ACTION:')) return false;
            return true;
        })
        .slice(-12)
        .map(msg => {
            const role = String(msg.role || '').toLowerCase();
            let speaker = contact.name;
            if (role === 'user') speaker = userName;
            else if (role === 'assistant' || role === 'ai') speaker = contact.name;
            else if (role) speaker = role;

            let typePrefix = '';
            if (msg.type === 'image' || msg.type === 'virtual_image') typePrefix = '[图片] ';
            else if (msg.type === 'voice') typePrefix = '[语音] ';
            else if (msg.type === 'transfer') typePrefix = '[转账] ';
            else if (msg.type && msg.type !== 'text') typePrefix = `[${msg.type}] `;

            const content = String(msg.content || '')
                .replace(/\s+/g, ' ')
                .trim()
                .slice(0, 120);

            return `- ${speaker}: ${typePrefix}${content}`;
        });

    if (recentMessages.length === 0) {
        return `【与用户最近聊天上下文】
暂无最近聊天记录可供参考。

【使用方式】
- 若无上下文，就按角色设定正常生成。
- 不要强行让所有内容都与用户有关。`;
    }

    return `【与用户最近聊天上下文】
以下是【${contact.name}】与【${userName}】最近的聊天片段，仅用于理解近期关系、情绪、事件和承诺：
${recentMessages.join('\n')}

【使用方式】
- 可以让部分与其他人的聊天、其他应用内容、状态文案或系统痕迹，间接体现这些近况。
- 例如：若近期和用户吵架、冷战、准备见面、答应哄用户、准备礼物、为了用户拒绝邀约，可以自然映射到其他内容里。
- 可以少量出现对“用户/对象/她/他”的间接提及，但不要直接改写成与用户本人的正面聊天窗口。
- 相关性要自然克制，不要每条都围绕用户展开，约20%-40%的内容受到影响即可。
- 不要照抄聊天原句，请改写后再融入内容。`;
}

function resolvePhonePromptUserIdentity(contact) {
    const state = window.iphoneSimState || {};
    const userPersonas = Array.isArray(state.userPersonas) ? state.userPersonas : [];
    const resolvedUserPersonaId = (contact && contact.userPersonaId) || state.currentUserPersonaId || null;
    const matchedPersona = resolvedUserPersonaId
        ? userPersonas.find(item => String(item && item.id) === String(resolvedUserPersonaId))
        : null;
    const userName = String(
        (matchedPersona && matchedPersona.name)
        || (state.userProfile && state.userProfile.name)
        || '用户'
    ).trim() || '用户';
    const userPersona = String(
        (contact && contact.userPersonaPromptOverride)
        || (matchedPersona && matchedPersona.aiPrompt)
        || ''
    ).trim();

    return {
        userName,
        userPersona,
        matchedPersona,
        resolvedUserPersonaId
    };
}

function buildPhoneSharedPromptContext(contact, options = {}) {
    const {
        recentChatFallback = '暂无最近聊天记录可供参考。',
        userPersonaFallback = '未填写'
    } = options;
    const identity = resolvePhonePromptUserIdentity(contact);

    return {
        contactPersona: String(contact && contact.persona ? contact.persona : '无').trim() || '无',
        userName: identity.userName,
        userPersona: identity.userPersona,
        userPersonaText: identity.userPersona || userPersonaFallback,
        recentChatContext: buildPhoneWechatRecentChatContext(contact) || recentChatFallback
    };
}

const PHONE_MESSAGES_DATA_KEYS = [
    'verification_codes',
    'delivery_notifications',
    'food_delivery_notifications',
    'unknown_numbers',
    'carrier_messages',
    'bank_alerts',
    'deleted_threads'
];

function normalizePhoneMessagesString(value) {
    return String(value == null ? '' : value).trim();
}

function normalizePhoneMessagesBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    const text = normalizePhoneMessagesString(value).toLowerCase();
    return text === 'true' || text === '1' || text === 'yes';
}

function normalizePhoneMessagesCount(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) return 0;
    return Math.floor(num);
}

function normalizePhoneMessagesIdentity(value) {
    return normalizePhoneMessagesString(value)
        .toLowerCase()
        .replace(/[\s（）()【】\[\]{}<>《》「」『』'"`~!@#$%^&*_+=|\\/:;,.?-]/g, '');
}

function getForbiddenPhoneMessageCounterparties(contact) {
    const { userName } = resolvePhonePromptUserIdentity(contact);
    const labels = ['用户', '玩家', '{{user}}', '我'];
    if (userName) labels.push(userName);
    if (contact && contact.name) labels.push(contact.name);
    return Array.from(new Set(labels.map(normalizePhoneMessagesIdentity).filter(Boolean)));
}

function isForbiddenPhoneConversationThread(sender, remark, contact) {
    const forbidden = getForbiddenPhoneMessageCounterparties(contact);
    const senderKey = normalizePhoneMessagesIdentity(sender);
    const remarkKey = normalizePhoneMessagesIdentity(remark);
    if (!forbidden.length) return false;

    return forbidden.includes(senderKey) || forbidden.includes(remarkKey);
}

function isPhoneMessagesRomanceAllowed(contact) {
    const persona = normalizePhoneMessagesString(contact && contact.persona ? contact.persona : '');
    if (!persona) return false;

    return /(暧昧|恋爱|感情经历|感情复杂|多线|海王|花心|渣|对象|前任|现任|追求者|追求中|喜欢多人|约会|秘密恋情|地下恋|桃花|恋人|男朋友|女朋友|伴侣|情史)/.test(persona);
}

function containsPhoneMessagesFlirtyContent(value) {
    const text = normalizePhoneMessagesString(value);
    if (!text) return false;

    return /(想你|想见你|昨晚想你|昨晚梦到你|喜欢你|我喜欢你|想抱你|抱抱|亲亲|亲你|吻你|宝贝|宝宝|老婆|老公|乖一点|想和你待在一起|想和你在一起|今晚陪你|昨晚陪你|下次还来你家|到你家楼下|别让他知道|别告诉别人|只给你看|还想你|想你了|你最好看|和你睡|等你来抱|今晚来吗|要不要见一面|有点想你|想你想得睡不着|想跟你单独待会|下次单独见|别删我|别不理我)/.test(text);
}

function normalizePhoneMessagesEntry(item, sourceType = '', contact = null) {
    if (!item || typeof item !== 'object') return null;

    const sender = normalizePhoneMessagesString(item.sender);
    const content = normalizePhoneMessagesString(item.content || item.preview || item.last_preview);
    if (!sender || !content) return null;
    const remark = normalizePhoneMessagesString(item.remark);
    if (isForbiddenPhoneConversationThread(sender, remark, contact)) return null;
    const romanceAllowed = isPhoneMessagesRomanceAllowed(contact);
    if (!romanceAllowed && containsPhoneMessagesFlirtyContent(content)) return null;

    const ownerReply = normalizePhoneMessagesString(item.owner_reply);
    const sanitizedOwnerReply = !romanceAllowed && containsPhoneMessagesFlirtyContent(ownerReply) ? '' : ownerReply;

    return {
        sender,
        remark,
        time: normalizePhoneMessagesString(item.time),
        content,
        unread: normalizePhoneMessagesBoolean(item.unread),
        source_type: normalizePhoneMessagesString(item.source_type) || sourceType,
        related_to_user: normalizePhoneMessagesBoolean(item.related_to_user),
        hidden_tension: normalizePhoneMessagesString(item.hidden_tension),
        owner_reply: sanitizedOwnerReply,
        owner_reply_time: sanitizedOwnerReply ? normalizePhoneMessagesString(item.owner_reply_time) : ''
    };
}

function normalizePhoneDeletedThreadEntry(item, contact = null) {
    if (!item || typeof item !== 'object') return null;

    const sender = normalizePhoneMessagesString(item.sender);
    const lastPreview = normalizePhoneMessagesString(item.last_preview);
    if (!sender || !lastPreview) return null;
    const remark = normalizePhoneMessagesString(item.remark);
    if (isForbiddenPhoneConversationThread(sender, remark, contact)) return null;
    const romanceAllowed = isPhoneMessagesRomanceAllowed(contact);
    if (!romanceAllowed && containsPhoneMessagesFlirtyContent(lastPreview)) return null;

    const ownerReply = normalizePhoneMessagesString(item.owner_reply);
    const sanitizedOwnerReply = !romanceAllowed && containsPhoneMessagesFlirtyContent(ownerReply) ? '' : ownerReply;

    return {
        sender,
        remark,
        last_time: normalizePhoneMessagesString(item.last_time),
        last_preview: lastPreview,
        unread_count: normalizePhoneMessagesCount(item.unread_count),
        deleted_at: normalizePhoneMessagesString(item.deleted_at),
        related_to_user: normalizePhoneMessagesBoolean(item.related_to_user),
        hidden_tension: normalizePhoneMessagesString(item.hidden_tension),
        owner_reply: sanitizedOwnerReply,
        owner_reply_time: sanitizedOwnerReply ? normalizePhoneMessagesString(item.owner_reply_time) : ''
    };
}

function normalizePhoneMessagesAiPayload(raw, generatedAt = '', contact = null) {
    const source = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    const normalized = {
        verification_codes: [],
        delivery_notifications: [],
        food_delivery_notifications: [],
        unknown_numbers: [],
        carrier_messages: [],
        bank_alerts: [],
        deleted_threads: [],
        generated_at: normalizePhoneMessagesString(source.generated_at) || generatedAt || buildPhoneGenerationTimeContext(new Date()).localDateTime
    };

    normalized.verification_codes = Array.isArray(source.verification_codes)
        ? source.verification_codes.map((item) => normalizePhoneMessagesEntry(item, '验证码', contact)).filter(Boolean)
        : [];
    normalized.delivery_notifications = Array.isArray(source.delivery_notifications)
        ? source.delivery_notifications.map((item) => normalizePhoneMessagesEntry(item, '快递', contact)).filter(Boolean)
        : [];
    normalized.food_delivery_notifications = Array.isArray(source.food_delivery_notifications)
        ? source.food_delivery_notifications.map((item) => normalizePhoneMessagesEntry(item, '外卖', contact)).filter(Boolean)
        : [];
    normalized.unknown_numbers = Array.isArray(source.unknown_numbers)
        ? source.unknown_numbers.map((item) => normalizePhoneMessagesEntry(item, '陌生号码', contact)).filter(Boolean)
        : [];
    normalized.carrier_messages = Array.isArray(source.carrier_messages)
        ? source.carrier_messages.map((item) => normalizePhoneMessagesEntry(item, '运营商', contact)).filter(Boolean)
        : [];
    normalized.bank_alerts = Array.isArray(source.bank_alerts)
        ? source.bank_alerts.map((item) => normalizePhoneMessagesEntry(item, '银行', contact)).filter(Boolean)
        : [];
    normalized.deleted_threads = Array.isArray(source.deleted_threads)
        ? source.deleted_threads.map((item) => normalizePhoneDeletedThreadEntry(item, contact)).filter(Boolean)
        : [];

    return normalized;
}

window.normalizePhoneMessagesAiPayload = normalizePhoneMessagesAiPayload;

function buildPhoneMessagesSystemPrompt(contact) {
    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: '暂无最近聊天记录可供参考。',
        userPersonaFallback: '未填写'
    });
    const userName = String(sharedContext.userName || '用户').trim() || '用户';
    const persona = String(sharedContext.contactPersona || '无').trim() || '无';
    const userPersona = String(sharedContext.userPersona || '').trim();
    const recentChatContext = sharedContext.recentChatContext;
    const romanceAllowed = isPhoneMessagesRomanceAllowed(contact);
    const romanceRule = romanceAllowed
        ? '15. Since this persona explicitly includes romance or ambiguous relationship traits, a small amount of subtle third-party flirtation is allowed, but it must stay restrained, low-frequency, and consistent with the persona.'
        : '15. Since this persona does not explicitly include romance or ambiguous relationship traits, do not generate flirtation, suggestive intimacy, pet names, romantic invitations, or messages that imply a romantic relationship with third parties; if subtle tension is needed, create it only through timing, remarks, unread states, and deletion traces, not through flirtatious content.';

    return `请你扮演“手机短信 / 信息应用内容生成器”，生成一组用于剧情展示的虚构短信内容。

【角色信息】
- 角色姓名：${contact.name}
- 角色人设：${persona}
- 用户名称：${userName}
- 用户人设：${userPersona || '未填写'}

${recentChatContext}

【核心风格】
- 这不是微信式熟人聊天，而是更像系统短信、通知短信、陌生号码短信、已删除会话等内容。
- 整体必须有很强的“手机系统痕迹”和“真实生活记录感”，让人一眼觉得这就是手机里真的会收到的短信。
- 重点来源：验证码、快递、外卖、银行、运营商、陌生号码、已删除会话。
- 正常内容占大多数，微妙内容只占一部分，真实感优先。

【总体要求】
1. 所有内容都必须像真实短信，不要写成小说对话，不要太像微信聊天。
2. 文风偏系统、模板化、通知化、生活化，语言简短。
3. 张力重点来自：半夜验证码、某个备注奇怪的号码、连续几条未读通知、某些短信时间点异常、某个已删除会话留下的痕迹。
4. 不要直接写出明确结论，不要写成“证据”，而要通过时间、备注、未读状态、删除行为制造联想空间。
5. 至少 30% 的内容要能和“用户”产生间接关系，但不能写成直接实锤。
6. 银行卡号、手机号、订单号、验证码等要做部分脱敏或虚构，不要使用真实敏感信息。
7. 短信正文尽量短，像系统模板或真实通知预览，不要长段抒情。
8. 不同来源语气必须区分：
   - 验证码：标准模板、时效提醒
   - 快递：物流节点、取件码、派送提醒
   - 外卖：接单、出餐、送达、骑手联系
   - 银行：消费提醒、验证码、账单提醒
   - 运营商：套餐流量、欠费、活动通知
   - 陌生号码：短促、含糊、容易让人误会
9. 部分线程需要包含“联系人本人”的短信回复；这些回复必须符合【${contact.name}】的人设、近期状态和说话习惯。
10. 我方回复不要平均分布到所有系统通知里，应主要出现在：陌生号码、外卖/骑手、快递沟通、已删除会话这几类里；验证码、运营商、银行这几类大多不需要回复。
11. 我方回复必须像真实短信，简短克制，不要写成长对话；整体仍以“对方发来内容”为主，少部分线程出现 1 到 2 句我方回复即可。
12. 绝对禁止生成【${userName}】与【${contact.name}】之间的直接短信对话。
13. sender、remark 都不能是【${userName}】、用户、玩家、{{user}}、我，或任何明显代表用户本人的称呼。
14. owner_reply 只允许表示【${contact.name}】回复第三方号码、平台、骑手、快递员、陌生联系人，不允许是在回复用户本人。
${romanceRule}

【输出模块】
- verification_codes：6到10条
- delivery_notifications：5到8条
- food_delivery_notifications：4到7条
- unknown_numbers：5到8条
- carrier_messages：4到6条
- bank_alerts：4到6条
- deleted_threads：3到5条

【普通短信字段】
- sender
- remark
- time
- content
- unread
- source_type
- related_to_user
- hidden_tension
- owner_reply（可为空；若该条没有我方回复就留空字符串）
- owner_reply_time（可为空；若有我方回复则提供时间）

【已删除会话字段】
- sender
- remark
- last_time
- last_preview
- unread_count
- deleted_at
- related_to_user
- hidden_tension
- owner_reply（可为空）
- owner_reply_time（可为空）

【deleted_threads 额外要求】
1. last_preview 必须非常短，像短信最后一句预览。
2. 不要所有 deleted_threads 都显得可疑，混合正常删除和微妙删除。
3. 至少 1 到 2 条要有较强张力，例如：删除时间很近、还有未读、备注不清不楚、最后一句预览很短但意味不明。
4. deleted_threads 中允许少量出现联系人本人曾回过的一句短回复，但不要每条都带回复。

【返回格式】
输出严格为 JSON 对象，不要附加解释、注释或 Markdown。
返回结构必须是：
{
  "verification_codes": [],
  "delivery_notifications": [],
  "food_delivery_notifications": [],
  "unknown_numbers": [],
  "carrier_messages": [],
  "bank_alerts": [],
  "deleted_threads": []
}`;
}

async function generatePhoneMessagesAll(contact) {
    const btn = document.getElementById('phone-messages-generate-btn');
    const originalContent = btn ? btn.innerHTML : null;

    if (btn) {
        btn.disabled = true;
        btn.classList.add('generating-pulse');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    const systemPrompt = buildPhoneMessagesSystemPrompt(contact);
    await callAiGeneration(contact, systemPrompt, 'messages_all', btn, originalContent);
}

// 检查AI API配置
function buildPhoneHealthSystemPrompt(contact) {
    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: '暂无最近聊天记录可供参考。',
        userPersonaFallback: '未填写'
    });
    const userName = String(sharedContext.userName || '用户').trim() || '用户';
    const persona = String(sharedContext.contactPersona || '无').trim() || '无';
    const userPersona = String(sharedContext.userPersona || '').trim();
    const recentChatContext = sharedContext.recentChatContext;

    return `请你扮演“手机健康/睡眠应用内容生成器”，为角色【${contact.name}】生成一组用于“翻手机”剧情展示的虚构健康数据。注意：这些数据不是设备真实采集，而是为了剧情展示服务的健康应用内容，因此必须同时具备真实感、生活感和克制的情绪张力。

【角色信息】
- 角色姓名：${contact.name}
- 角色人设：${persona}
- 用户名称：${userName}
- 用户人设：${userPersona || '未填写'}

${recentChatContext}

【总体目标】
让这些内容看起来像 iPhone 健康 / 睡眠 / 习惯追踪类 App 中留下的正常记录。表面上普通，但连起来看会让人觉得最近状态有点乱，比如连续熬夜、情绪波动、某天步数异常高、深夜私密记录增加、作息和肠胃节律被打乱等。

【严格要求】
1. 输出内容必须像真实手机健康记录，不要写成小说、独白或医疗报告。
2. 正常记录与异常记录要混合，不能全部健康，也不能全部有剧情味。
3. 只生成以下 6 个模块，不要输出 fitness_plan 和 health_insights：sleep_records、mood_records、step_records、cycle_records、self_relief_records、bathroom_records。
4. 至少 30%-40% 的记录可以和“用户”有间接关联，但只能通过数据和简短描述侧面体现，不能直接下结论。
5. 张力要来自数据组合后的感觉，不要把每条都写得很刻意。
6. cycle_records 只有当角色设定明显适用于“会有经期”的人物时才生成；若不适用，直接返回空数组 []。
7. self_relief_records 必须克制表达，只能作为压力、失眠、情绪管理相关的私密记录来处理，禁止露骨描写。
8. bathroom_records 要像习惯追踪，不要恶心夸张。
9. 时间分布主要集中在最近 7 到 30 天内。
10. 输出必须严格为 JSON 对象，不要附加任何解释、注释或 Markdown。

【返回结构】
{
  "sleep_records": [],
  "mood_records": [],
  "step_records": [],
  "cycle_records": [],
  "self_relief_records": [],
  "bathroom_records": []
}

【字段要求】
sleep_records 每条包含：date、bedtime、wake_time、duration、quality、tag、summary、related_to_user、hidden_tension。
mood_records 每条包含：date、time、mood、intensity、trigger、summary、related_to_user、hidden_tension。
step_records 每条包含：date、steps、distance、calories、tag、summary、related_to_user、hidden_tension。
cycle_records 每条包含：date、phase、symptoms、mood_tag、summary、related_to_user、hidden_tension。
self_relief_records 每条包含：date、time、duration_minutes、frequency_tag、mood_before、mood_after、aid_type、aid_summary、privacy_level、state_curve、private_reflection、after_note、summary、related_to_user、hidden_tension。
bathroom_records 每条包含：date、time、type、status、summary、related_to_user、hidden_tension。

【数量要求】
- sleep_records：6到10条
- mood_records：6到10条
- step_records：7到14条
- cycle_records：3到6条；若不适用则返回 []
- self_relief_records：4到8条
- bathroom_records：5到10条

【补充约束】
- 睡眠、心情、步数、私密记录、如厕记录之间可以互相呼应，例如熬夜后第二天情绪差、步数低，或步数异常高后情绪复杂。
- self_relief_records 的 aid_type 要写得更具体，除了通用来源，也允许写与用户有关的内容，例如：无辅助、模糊回忆、混合分散注意、用户照片、用户语音、聊天记录、聊天截图、共同回忆、对方主页内容。
- self_relief_records 的 aid_summary 需要比 aid_type 更细一层，说明当时怎样借助这些方式安抚情绪，表达必须详细露骨；如果来源和用户有关，也可以写成“翻到对方某张旧照片后停留了一会儿”“点开一段对方的语音反复听了两遍”“把聊天记录往上翻了一截，情绪更难平下来”“看了一眼和对方有关的内容，像是在给自己找一个熟悉的落点”，但不要出现露骨内容，也不要把语气写成小说段落。
- 如果 aid_type 是“无辅助”，aid_summary 也要写清楚当时没有借助外部内容，只是靠发呆、放空、关灯、躺着等方式慢慢缓下来。
- 与用户有关的 aid_type 不必只限于照片或语音，也可以是聊天、收藏、转账备注、共同歌单、社交主页、旧定位、一起拍过的视频等任何会让人联想到用户的手机内容，表达必须详细露骨。
- 不要把所有情绪都归因于经期，也不要把所有异常都和用户有关。
- self_relief_records 可以额外写 state_curve、private_reflection、after_note，用于描述开始到结束的情绪变化、缓解过程与结束后的状态，但只能是克制的健康记录口径，禁止具体行为、身体细节或露骨描写。
- related_to_user 不能全是 true。

请直接返回严格 JSON。`;
}

async function generatePhoneHealthAll(contact) {
    const btn = document.getElementById('generate-phone-health-btn');
    const originalContent = btn ? btn.innerHTML : null;
    if (btn) {
        btn.disabled = true;
        btn.classList.add('generating-pulse');
        btn.innerHTML = '<i class="ri-loader-4-line"></i>';
    }

    const systemPrompt = buildPhoneHealthSystemPrompt(contact);
    await callAiGeneration(contact, systemPrompt, 'health_all', btn, originalContent);
}

function buildPhoneGenerationTimeContext(now = new Date()) {
    const pad = value => String(value).padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const timeZone = (Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().timeZone) || '';
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    const seconds = pad(now.getSeconds());

    return {
        iso: now.toISOString(),
        localDate: `${year}-${month}-${day}`,
        localTime: `${hours}:${minutes}:${seconds}`,
        localDateTime: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
        weekday: weekdays[now.getDay()],
        timeZone
    };
}

function buildPhoneGenerationTimeInstruction(now = new Date()) {
    const context = buildPhoneGenerationTimeContext(now);
    const zoneText = context.timeZone ? `（${context.timeZone}）` : '';
    return `【时间基准】
- 用户点击“生成”按钮时的当前本地时间是：${context.localDateTime} ${context.weekday}${zoneText}
- 你生成的所有日期、时间、星期、月份，以及“今天 / 昨天 / 明天 / 本周 / 上周 / 近7天 / 近30天 / 30天前”等相对时间，都必须严格以这个时间为唯一基准。
- 不要自行假设别的月份或年份，也不要生成与当前基准矛盾的时间表达；例如当前基准在 3 月，就不能出现“30天前是 6 月”这种错误。
- 如果同时出现绝对日期和相对时间，它们必须彼此一致。
- 如果任务没有特别要求，请优先生成与当前基准时间接近且前后自洽的时间分布。`;
}

function validateAiSettings(settings) {
    const errors = [];
    
    if (!settings.url) {
        errors.push('缺少API URL');
    } else {
        try {
            new URL(settings.url);
        } catch (e) {
            errors.push('API URL格式无效');
        }
    }
    
    if (!settings.key) {
        errors.push('缺少API密钥');
    } else if (settings.key.length < 10) {
        errors.push('API密钥长度过短');
    }
    
    if (!settings.model) {
        errors.push('缺少模型名称');
    }
    
    return errors;
}

async function callAiGeneration(contact, systemPrompt, type, btn, originalContent = null) {
    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    const settingsSource = window.iphoneSimState.aiSettings.url ? 'aiSettings' : 'aiSettings2';
    const generationNow = new Date();
    const generationTimeContext = buildPhoneGenerationTimeContext(generationNow);
    const finalSystemPrompt = `${systemPrompt}\n\n${buildPhoneGenerationTimeInstruction(generationNow)}`;
    
    // 验证AI设置
    const configErrors = validateAiSettings(settings);
    if (configErrors.length > 0) {
        const errorMsg = 'AI配置错误：\n' + configErrors.join('\n') + '\n\n请在设置中检查AI配置';
        alert(errorMsg);
        if (btn) {
            btn.classList.remove('generating-pulse');
            btn.classList.remove('phone-delivery-generating');
            btn.disabled = false;
            if (originalContent) {
                btn.innerHTML = originalContent;
            }
        }
        return;
    }

    try {
        console.log('=== 开始AI生成流程 ===');
        console.log('联系人:', contact.name, 'ID:', contact.id);
        console.log('生成类型:', type);
        console.log('生成基准时间:', generationTimeContext.localDateTime, generationTimeContext.weekday, generationTimeContext.timeZone || '');
        console.log('按钮元素:', btn);
        
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }
        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, '').trim() : '';
        const requestTemperature = typeof settings.temperature === 'number' ? settings.temperature : 0.7;

        console.log('开始AI生成请求:', {
            url: fetchUrl,
            settingsSource,
            model: settings.model,
            type: type,
            contactName: contact.name,
            temperature: requestTemperature,
            keyLength: cleanKey.length
        });

        // 创建带超时的fetch请求
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort('Request timed out after 180 seconds');
        }, 180000); // 180秒超时

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: finalSystemPrompt },
                    { role: 'user', content: `开始生成，并严格以 ${generationTimeContext.localDateTime} ${generationTimeContext.weekday} 为时间基准。` }
                ],
                temperature: requestTemperature
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('AI API响应状态:', response.status, response.statusText);

        const responseText = await response.text();
        const responsePreview = String(responseText || '').trim().slice(0, 200);
        console.log('AI API响应预览:', responsePreview || '[empty]');

        if (!response.ok) {
            let errorMsg = `API请求失败 (${response.status})`;
            if (responsePreview) {
                console.error('API错误响应:', responsePreview);
                errorMsg += `: ${responsePreview}`;
            }
            throw new Error(errorMsg);
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (responseParseError) {
            console.error('AI API返回了非JSON内容:', responseText);

            let friendlyMessage = 'AI接口返回了非 JSON 内容';
            if (/offline mode/i.test(responseText)) {
                friendlyMessage = 'AI接口返回了“Offline mode”，说明请求没有拿到真实模型响应，可能被离线状态、代理网关或中转服务拦截了';
            } else if (/<html|<!doctype/i.test(responseText)) {
                friendlyMessage = 'AI接口返回了 HTML 页面而不是 JSON，通常是 URL 配置错误，或被登录页 / 网关错误页拦截了';
            } else if (!responsePreview) {
                friendlyMessage = 'AI接口返回了空响应';
            }

            throw new Error(`${friendlyMessage}${responsePreview ? `：${responsePreview}` : ''}`);
        }

        console.log('AI API响应数据结构:', {
            hasChoices: !!data.choices,
            choicesLength: data.choices?.length,
            hasMessage: !!data.choices?.[0]?.message,
            hasContent: !!data.choices?.[0]?.message?.content
        });

        if (data && data.error) {
            const apiErrorText = typeof data.error === 'string'
                ? data.error
                : (data.error.message || JSON.stringify(data.error));
            throw new Error(`AI接口返回错误：${apiErrorText}`);
        }
        
        // 验证响应数据结构
        if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
            throw new Error('AI响应格式错误：缺少choices数组');
        }
        
        if (!data.choices[0].message || !data.choices[0].message.content) {
            throw new Error('AI响应格式错误：缺少message内容');
        }
        
        let content = data.choices[0].message.content.trim();
        console.log('AI响应内容长度:', content.length);
        console.log('AI响应内容预览:', content.substring(0, 200) + (content.length > 200 ? '...' : ''));
        
        if (!content) {
            throw new Error('AI返回了空内容');
        }
        
        // 改进的JSON提取逻辑
        let jsonStr = extractValidJson(content);
        
        console.log('开始JSON提取，原始内容长度:', content.length);
        console.log('提取后JSON字符串长度:', jsonStr.length);
        console.log('JSON字符串前100字符:', jsonStr.substring(0, 100));
        
        // 使用改进的JSON解析逻辑
        let result;
        try {
            console.log('尝试解析JSON，类型:', type);
            result = parseJsonWithFallback(jsonStr);
            console.log('JSON解析成功，结果类型:', typeof result, '是否为数组:', Array.isArray(result));
            console.log('解析结果的键:', Object.keys(result));
            if (result.chats) console.log('chats数组长度:', result.chats.length);
            if (result.moments) console.log('moments数组长度:', result.moments.length);
        } catch (parseError) {
            console.error('JSON解析完全失败');
            console.error('原始AI响应内容:', content);
            console.error('提取的JSON字符串:', jsonStr);
            console.error('解析错误详情:', parseError);
            
            // 提供更有用的错误信息
            let errorDetails = `JSON解析失败: ${parseError.message}`;
            if (parseError.message.includes('Unexpected token') || parseError.message.includes('Unexpected non-whitespace')) {
                errorDetails += '\n\n可能原因：AI返回的内容在JSON后包含额外字符';
            } else if (parseError.message.includes('Unexpected end')) {
                errorDetails += '\n\n可能原因：JSON内容不完整';
            }
            
            errorDetails += '\n\n建议解决方案：';
            errorDetails += '\n1. 在AI设置中降低Temperature值（建议0.3-0.7）';
            errorDetails += '\n2. 检查网络连接是否稳定';
            errorDetails += '\n3. 尝试重新生成';
            errorDetails += '\n4. 如果问题持续，请检查AI模型是否支持JSON格式输出';
            
            throw new Error(errorDetails);
        }

        if (!window.iphoneSimState.phoneContent[contact.id]) {
            window.iphoneSimState.phoneContent[contact.id] = {};
        }

        console.log('开始处理解析结果，类型:', type);
        
        // 尝试自动解包 (Handle wrapped responses like { "chats": [...] } when we expected array)
        if (type === 'moments' && !Array.isArray(result) && result.moments && Array.isArray(result.moments)) {
            console.log('自动解包 moments 数组');
            result = result.moments;
        }
        if (type === 'chats' && !Array.isArray(result) && result.chats && Array.isArray(result.chats)) {
            console.log('自动解包 chats 数组');
            result = result.chats;
        }
        
        const filesSectionKey = getPhoneFilesSectionKeyByAiType(type);
        if (type === 'files_all' || filesSectionKey) {
            result = normalizePhoneFilesAiPayload(type, result);
        }

        const notesSectionKey = getPhoneNotesSectionKeyByAiType(type);
        if (type === 'notes_all' || notesSectionKey) {
            result = normalizePhoneNotesAiPayload(type, result);
        }

        if (type === 'health_all' && window.normalizePhoneHealthData) {
            result = window.normalizePhoneHealthData(result);
        }

        if (type === 'messages_all') {
            result = normalizePhoneMessagesAiPayload(result, generationTimeContext.localDateTime, contact);
        }

        if (type === 'delivery_all') {
            result = normalizePhoneDeliveryAiPayload(result, contact);
        }

        if (type === 'parcel_all') {
            result = normalizePhoneParcelAiPayload(result, contact);
        }

        if (type === 'moments' && Array.isArray(result)) {
            console.log('处理moments类型，数组长度:', result.length);
            window.iphoneSimState.phoneContent[contact.id].wechatMoments = result;
            renderPhoneWechatMoments(contact.id);
            window.switchPhoneWechatTab('moments');
        } else if (type === 'chats' && Array.isArray(result)) {
            console.log('处理chats类型，数组长度:', result.length);
            window.iphoneSimState.phoneContent[contact.id].wechatChats = result;
            renderPhoneWechatContacts(contact.id);
            window.switchPhoneWechatTab('contacts');
        } else if (type === 'all' && result.chats && result.moments) {
            console.log('处理all类型，chats长度:', result.chats.length, 'moments长度:', result.moments.length);
            window.iphoneSimState.phoneContent[contact.id].wechatChats = result.chats;
            window.iphoneSimState.phoneContent[contact.id].wechatMoments = result.moments;
            // 渲染并保持当前 Tab (或者默认去微信页)
            console.log('开始渲染联系人和朋友圈');
            renderPhoneWechatContacts(contact.id);
            renderPhoneWechatMoments(contact.id);
            // 刷新当前页面状态
            const currentTab = document.getElementById('phone-wechat-tab-contacts').style.display === 'block' ? 'contacts' : 'moments';
            console.log('切换到标签页:', currentTab);
            window.switchPhoneWechatTab(currentTab);
        } else if (type === 'delivery_all') {
            const normalizedDeliveryData = normalizePhoneDeliveryData(result, contact);
            const totalDeliveryCount = (normalizedDeliveryData.active_order ? 1 : 0)
                + ['delivery_addresses', 'taste_notes', 'frequent_shops', 'favorite_shops', 'recent_orders', 'gift_orders', 'pickup_orders']
                    .reduce((sum, key) => sum + ((normalizedDeliveryData[key] || []).length), 0);
            if (!totalDeliveryCount) {
                throw new Error('Delivery app generation returned empty data');
            }
            setPhoneDeliveryData(contact.id, normalizedDeliveryData);
            const currentPage = phoneDeliveryRuntime.activePage || 'home';
            refreshPhoneDeliveryApp(contact.id);
            switchPhoneDeliveryPage(currentPage);
            if (window.showChatToast) window.showChatToast('Generated delivery content for ' + contact.name);
            else alert('Generated delivery content for ' + contact.name);
        } else if (type === 'parcel_all') {
            const normalizedParcelData = normalizePhoneParcelData(result, contact);
            const totalParcelCount = (normalizedParcelData.featured_card && normalizedParcelData.featured_card.title ? 1 : 0)
                + ((normalizedParcelData.list_items || []).length)
                + ((normalizedParcelData.detail && normalizedParcelData.detail.timeline || []).length)
                + ((normalizedParcelData.addresses || []).length);
            if (!totalParcelCount) {
                throw new Error('快递应用生成结果为空');
            }
            setPhoneParcelData(contact.id, normalizedParcelData);
            const currentView = phoneParcelRuntime.activeView || 'home';
            refreshPhoneParcelApp(contact.id);
            switchPhoneParcelView(currentView);
            if (window.showChatToast) window.showChatToast('已为 ' + contact.name + ' 生成快递内容');
            else alert('已为 ' + contact.name + ' 生成快递内容');
        } else if (type === 'notes_all') {
            const normalizedNotesData = normalizePhoneNotesData(result);
            const totalNotesCount = PHONE_NOTES_SECTION_ORDER.reduce((sum, sectionKey) => sum + (normalizedNotesData[sectionKey] || []).length, 0);
            if (!totalNotesCount) {
                throw new Error('备忘录生成结果为空');
            }
            window.iphoneSimState.phoneContent[contact.id].notesData = normalizedNotesData;
            if (window.refreshPhoneNotesApp) {
                window.refreshPhoneNotesApp(contact.id, { scope: 'all' });
            }
            if (window.showChatToast) window.showChatToast('已为 ' + contact.name + ' 生成备忘录内容');
            else alert('已为 ' + contact.name + ' 生成备忘录内容');
        } else if (notesSectionKey) {
            const generatedItems = Array.isArray(result) ? result : normalizePhoneNotesAiPayload(type, result);
            if (!generatedItems.length) {
                throw new Error('备忘录分区生成结果为空：' + notesSectionKey);
            }
            const currentNotesData = normalizePhoneNotesData(window.iphoneSimState.phoneContent[contact.id].notesData);
            const generationContext = window.__phoneNotesGenerationContext || {};
            const mergeMode = generationContext.mode === 'merge';
            currentNotesData[notesSectionKey] = mergeMode
                ? [...generatedItems, ...(currentNotesData[notesSectionKey] || [])]
                : generatedItems;
            window.iphoneSimState.phoneContent[contact.id].notesData = currentNotesData;
            if (window.refreshPhoneNotesApp) {
                window.refreshPhoneNotesApp(contact.id, { scope: 'section', sectionKey: notesSectionKey, mode: mergeMode ? 'merge' : 'replace' });
            }
            const sectionMeta = PHONE_NOTES_SECTION_META[notesSectionKey] || { cnTitle: notesSectionKey };
            if (window.showChatToast) window.showChatToast(sectionMeta.cnTitle + '已更新');
            else alert(sectionMeta.cnTitle + '已更新');
        } else if (type === 'files_all') {
            const normalizedFilesData = normalizePhoneFilesData(result);
            const totalFilesCount = PHONE_FILES_DATA_SECTION_ORDER.reduce((sum, sectionKey) => sum + (normalizedFilesData[sectionKey] || []).length, 0);
            if (!totalFilesCount) {
                throw new Error('文件应用生成结果为空');
            }
            setPhoneFilesData(contact.id, normalizedFilesData);
            if (window.refreshPhoneFilesApp) {
                window.refreshPhoneFilesApp(contact.id, { scope: 'all' });
            }
            if (window.showChatToast) window.showChatToast('已为 ' + contact.name + ' 生成文件内容');
            else alert('已为 ' + contact.name + ' 生成文件内容');
        } else if (filesSectionKey) {
            const generatedItems = Array.isArray(result) ? result : normalizePhoneFilesAiPayload(type, result);
            if (!generatedItems.length) {
                throw new Error('文件分区生成结果为空：' + filesSectionKey);
            }
            const currentFilesData = normalizePhoneFilesData(getPhoneFilesData(contact.id));
            const generationContext = window.__phoneFilesGenerationContext || {};
            const mergeMode = generationContext.mode === 'merge';
            currentFilesData[filesSectionKey] = mergeMode
                ? [...generatedItems, ...(currentFilesData[filesSectionKey] || [])]
                : generatedItems;
            setPhoneFilesData(contact.id, currentFilesData);
            if (window.refreshPhoneFilesApp) {
                window.refreshPhoneFilesApp(contact.id, { scope: 'section', sectionKey: filesSectionKey, mode: mergeMode ? 'merge' : 'replace' });
            }
            const sectionMeta = PHONE_FILES_SECTION_META[filesSectionKey] || { cnTitle: filesSectionKey };
            if (window.showChatToast) window.showChatToast(sectionMeta.cnTitle + '已更新');
            else alert(sectionMeta.cnTitle + '已更新');
        } else if (type === 'health_all') {
            const normalizedHealthData = window.normalizePhoneHealthData ? window.normalizePhoneHealthData(result) : result;
            const healthRecordCount = normalizedHealthData
                ? ['sleep_records', 'mood_records', 'step_records', 'self_relief_records', 'bathroom_records', 'cycle_records']
                    .reduce((sum, key) => sum + (Array.isArray(normalizedHealthData[key]) ? normalizedHealthData[key].length : 0), 0)
                : 0;
            if (!healthRecordCount) {
                throw new Error('健康应用生成结果为空');
            }
            if (window.setPhoneHealthData) {
                window.setPhoneHealthData(contact.id, normalizedHealthData);
            } else {
                window.iphoneSimState.phoneContent[contact.id].healthData = normalizedHealthData;
            }
            if (window.refreshPhoneHealthApp) {
                window.refreshPhoneHealthApp(contact.id);
            }
            if (window.showChatToast) window.showChatToast('已为 ' + contact.name + ' 生成健康内容');
            else alert('已为 ' + contact.name + ' 生成健康内容');
        } else if (type === 'browser' && Array.isArray(result)) {
            window.iphoneSimState.phoneContent[contact.id].browserHistory = result;
            renderPhoneBrowser(contact.id);
        } else if (type === 'messages_all') {
            const totalMessagesCount = PHONE_MESSAGES_DATA_KEYS.reduce((sum, key) => {
                if (key === 'deleted_threads') return sum + ((result.deleted_threads || []).length);
                return sum + ((result[key] || []).length);
            }, 0);

            if (!totalMessagesCount) {
                throw new Error('短信应用生成结果为空');
            }

            window.iphoneSimState.phoneContent[contact.id].messagesData = result;

            if (window.PhoneMessagesApp && typeof window.PhoneMessagesApp.refresh === 'function') {
                window.PhoneMessagesApp.refresh(contact.id);
            }

            if (window.showChatToast) window.showChatToast('已为 ' + contact.name + ' 生成短信内容');
            else alert('已为 ' + contact.name + ' 生成短信内容');
        } else if (type === 'browser_all') {
            if (!window.iphoneSimState.phoneContent[contact.id].browserData) {
                window.iphoneSimState.phoneContent[contact.id].browserData = {};
            }
            window.iphoneSimState.phoneContent[contact.id].browserData = result;
            
            if (window.renderBrowserSearchRecords) window.renderBrowserSearchRecords(contact.id);
            if (window.renderPhoneBrowser) window.renderPhoneBrowser(contact.id);
            if (window.renderBrowserBookmarks) window.renderBrowserBookmarks(contact.id);
            if (window.renderBrowserDownloads) window.renderBrowserDownloads(contact.id);
            if (window.renderBrowserShare) window.renderBrowserShare(contact.id);
            
            if (window.showChatToast) window.showChatToast('浏览器内容生成完成');
            else alert('浏览器内容生成完成');
        } else if (type === 'xianyu_all') {
             // 保存生成的闲鱼数据到联系人
            if (!contact.xianyuData) contact.xianyuData = {};
            
            // 处理图片关键词和价格
            // Helper to process item
            const processItem = (item) => {
                // Process Image
                if (item.image && item.image.includes('|')) {
                    const [keyword, desc] = item.image.split('|');
                    // 使用中文描述生成图片
                    item.img = window.getSmartImage(desc.trim());
                    item.imageDesc = desc.trim();
                } else if (item.image) {
                    item.img = window.getSmartImage(item.image);
                } else if (item.title) {
                    item.img = window.getSmartImage(item.title);
                }
                
                // Process Price - Remove currency symbols
                if (item.price) {
                    item.price = item.price.toString().replace(/[￥￥元\s]/g, '');
                }
            };

            if (result.published) result.published.forEach(processItem);
            if (result.sold) result.sold.forEach(processItem);
            if (result.bought) result.bought.forEach(processItem);
            if (result.favorites) result.favorites.forEach(processItem);
            if (result.messages) result.messages.forEach(processItem);
            
            contact.xianyuData = result;
            if (window.saveConfig) window.saveConfig();
            
            // 刷新当前显示的内容
            if (currentCheckPhoneContactId === contact.id) {
                window.renderXianyuMe(contact.id);
                window.renderXianyuMessages(contact.id);
                // 如果收藏页面正在显示，也刷新它
                const favoritesPage = document.getElementById('xianyu-page-favorites');
                if (favoritesPage && !favoritesPage.classList.contains('hidden')) {
                    window.renderXianyuFavoritesList();
                }
            }
            
            alert(`已为 ${contact.name} 生成闲鱼内容！\n包含：${result.published?.length || 0}个发布商品，${result.sold?.length || 0}个卖出记录，${result.bought?.length || 0}个购买记录，${result.favorites?.length || 0}个收藏商品，${result.messages?.length || 0}条消息`);
        } else {
            console.error('未知的生成类型或格式不正确:', {
                type,
                resultType: typeof result,
                isArray: Array.isArray(result),
                hasChats: !!result.chats,
                hasMoments: !!result.moments,
                resultKeys: Object.keys(result || {})
            });
            throw new Error(`返回格式不正确。类型: ${type}, 结果类型: ${typeof result}, 是否为数组: ${Array.isArray(result)}, 包含的键: ${Object.keys(result || {}).join(', ')}`);
        }

        if (window.saveConfig) window.saveConfig();

    } catch (error) {
        console.error('=== AI生成过程中发生错误 ===');
        console.error('错误对象:', error);
        console.error('错误详情:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            type: type,
            contactId: contact.id,
            contactName: contact.name,
            timestamp: new Date().toISOString()
        });
        
        // 检查是否是网络错误
        if (error.name === 'AbortError') {
            console.error('请求被中止（可能是超时）');
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.error('网络请求失败');
        }
        
        // 显示更详细的错误信息
        let errorMsg = '生成失败：' + error.message;
        if (error.message.includes('JSON')) {
            errorMsg += '\n\n建议：\n1. 检查AI设置中的Temperature是否过高\n2. 尝试重新生成\n3. 检查网络连接';
        } else if (error.message.includes('API')) {
            errorMsg += '\n\n建议：\n1. 检查AI API配置\n2. 检查网络连接\n3. 确认API密钥有效';
        } else if (error.message.includes('Offline mode')) {
            errorMsg += '\n\n建议：\n1. 检查AI接口地址是否可直连\n2. 检查代理/中转服务是否在线\n3. 打开浏览器开发者工具 Network，查看 /chat/completions 的原始响应\n4. 确认当前页面或浏览器不在离线模式';
        } else if (error.message.includes('非 JSON 内容') || error.message.includes('HTML 页面')) {
            errorMsg += '\n\n建议：\n1. 检查AI URL是否填写到正确的 /v1 或网关地址\n2. 确认接口返回的是 OpenAI 兼容 JSON，不是网页\n3. 检查是否被登录页、CDN 或反代错误页拦截';
        }
        alert(errorMsg);
    } finally {
        if (btn) {
            btn.classList.remove('generating-pulse');
            btn.classList.remove('phone-delivery-generating');
            btn.disabled = false;
            
            if (originalContent) {
                 btn.innerHTML = originalContent;
            }

            // 根据生成类型重新绑定事件
            if (type === 'moments' || type === 'chats' || type === 'all') {
                // 微信相关生成，重新绑定微信Tab事件
                try {
                    const currentTab = document.getElementById('phone-wechat-tab-contacts').style.display === 'block' ? 'contacts' : 'moments';
                    window.switchPhoneWechatTab(currentTab);
                } catch (tabError) {
                    console.warn('重新绑定微信Tab事件失败:', tabError);
                }
            } else if (type === 'browser' || type === 'browser_all') {
                // 浏览器相关生成，重新绑定浏览器按钮事件
                try {
                    btn.onclick = () => handlePhoneAppGenerate('browser');
                } catch (browserError) {
                    console.warn('重新绑定浏览器按钮事件失败:', browserError);
                }
            } else if (type === 'messages_all') {
                try {
                    btn.onclick = () => handlePhoneAppGenerate('messages');
                } catch (messagesError) {
                    console.warn('Failed to rebind messages generate button:', messagesError);
                }
            } else if (type === 'delivery_all') {
                try {
                    btn.onclick = () => handlePhoneAppGenerate('delivery');
                } catch (deliveryError) {
                    console.warn('Failed to rebind delivery generate button:', deliveryError);
                }
            } else if (type === 'parcel_all') {
                try {
                    btn.onclick = () => handlePhoneAppGenerate('parcel');
                } catch (parcelError) {
                    console.warn('Failed to rebind parcel generate button:', parcelError);
                }
            }
        }
        if (type.indexOf('notes_') === 0) {
            window.__phoneNotesGenerationContext = null;
        }
        if (type.indexOf('files_') === 0) {
            window.__phoneFilesGenerationContext = null;
        }
    }
}

async function generatePhoneWechatMoments(contact) {
    const btn = document.getElementById('generate-wechat-btn');
    if (btn) {
        btn.classList.add('generating-pulse');
        btn.disabled = true;
    }

    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: '暂无最近聊天记录可供参考。',
        userPersonaFallback: '未填写'
    });
    const recentChatContext = sharedContext.recentChatContext;

    const systemPrompt = `你是一个虚拟手机内容生成器。请为角色【${contact.name}】生成微信朋友圈【信息流/Timeline】。
！！！重要！！！：你生成的是${contact.name}【看到的】朋友圈列表，而不是他/她【发的】列表。所以大部分内容应该来自【别人】。

角色设定：${sharedContext.contactPersona || '无'}
用户名称：${sharedContext.userName}
用户人设：${sharedContext.userPersonaText}

${recentChatContext}

【与用户的关联要求】
- 可以让其中 2-4 条动态或评论，间接反映${contact.name}和用户最近的关系状态或近期事件。
- 这种关联可以体现在：${contact.name}自己的文案、深夜仅自己可见动态、好友对${contact.name}状态的评论、好友对${contact.name}行程/情绪的打趣。
- 允许少量提到“对象/她/他/那位”，但不要把用户本人直接放进微信会话或写成正面解释说明。
- 不要生硬植入，要像真实生活痕迹。

【严格执行以下规则】
1. 总共生成 10 条动态。
2. 【必须】包含 6-7 条由【其他好友/NPC】发布的动态 (isSelf: false)。
3. 【最多】包含 3-5 条由【${contact.name}】自己发布的动态 (isSelf: true)。
4. 如果生成的动态全部是${contact.name}发的，将被视为任务失败。
5. 【图片生成重要规则】：
   - images 数组必须使用【英文关键词|中文描述】格式
   - 英文关键词要简单明确，如："cute cat|可爱的猫"、"sunset sky|日落天空"、"delicious food|美味食物"
   - 避免复杂句子，用简单的名词组合
   - 常用关键词：cat, dog, sunset, food, flower, city, beach, coffee, happy, smile, nature
   - 示例："beautiful flower|美丽的花朵"、"city night|城市夜景"、"coffee time|咖啡时光"

【好友内容要求】
- 创造多样化的好友身份：微商、亲戚、同事、甚至陌生人。
- 昵称要真实：如"A01修电脑王哥"、"小柠檬"、"AAA建材"、"沉默是金"等。
- 内容风格：晒娃、抱怨加班、心灵鸡汤、微商广告、旅游打卡等。

【返回格式示例】
必须是严谨的 JSON 数组。所有Key和String Value必须用双引号包裹。
[
  {
    "isSelf": false,
    "name": "AAA建材-老张",
    "content": "今日特价，欢迎咨询！",
    "time": "10分钟前",
    "images": [],
    "likes": ["${contact.name}"],
    "comments": []
  },
  {
    "isSelf": true,
    "name": "${contact.name}",
    "content": "今天天气真好。",
    "time": "1小时前",
    "images": [],
    "likes": ["好友A"],
    "comments": [{"user": "好友B", "content": "羡慕"}]
  },
  {
    "isSelf": false,
    "name": "七大姑",
    "content": "转发：震惊！这三种食物不能一起吃...",
    "time": "2小时前",
    "images": [],
    "likes": [],
    "comments": []
  }
]

【特别规则 - 可见性设置】
请随机生成 0-3 条带有特殊可见性设置的动态（必须是本人发的 isSelf=true）。
1. 仅自己可见：visibility = { "type": "private" }
   - 内容：吐槽、emo、深夜感悟。
2. 部分可见：visibility = { "type": "include", "labels": ["分组名"] }
   - 必须提供 labels 数组，例如：["家人"], ["大学同学"], ["公司同事"]。
3. 不给谁看：visibility = { "type": "exclude", "labels": ["分组名"] }
   - 必须提供 labels 数组，例如：["老板"], ["前任"]。
4. 公开：默认，不需要 visibility 字段，或者 visibility = { "type": "public" }。
`;

    await callAiGeneration(contact, systemPrompt, 'moments', btn);
}

// 渲染指定联系人的朋友圈内容
function renderPhoneWechatMoments(contactId) {
    // 确保有数据
    if (!window.iphoneSimState.phoneContent) window.iphoneSimState.phoneContent = {};
    const content = window.iphoneSimState.phoneContent[contactId];
    const moments = content ? content.wechatMoments : [];
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const list = document.getElementById('phone-wechat-moments-list');
    const userNameEl = document.getElementById('phone-wechat-user-name');
    const userAvatarEl = document.getElementById('phone-wechat-user-avatar');
    
    if (userNameEl) userNameEl.textContent = contact.name;
    if (userAvatarEl) userAvatarEl.src = contact.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown';
    
    if (!list) return;
    list.innerHTML = '';

    if (!moments || moments.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">点击右上角生成动态</div>';
        return;
    }

    moments.forEach(moment => {
        const item = document.createElement('div');
        item.className = 'moment-item';
        
        let avatar;
        if (moment.isSelf) {
            let selfAvatar = contact.avatar;
            if (selfAvatar && (selfAvatar.includes('pravatar') || selfAvatar.includes('placehold') || selfAvatar.includes('dicebear'))) {
                selfAvatar = null;
            }
            avatar = selfAvatar || window.getSmartAvatar(contact.name);
        } else {
            avatar = window.getSmartAvatar(moment.name);
        }

        let imagesHtml = '';
        if (moment.images && moment.images.length > 0) {
            const gridClass = moment.images.length === 1 ? 'single' : 'grid';
            imagesHtml = `<div class="moment-images ${gridClass}">
                ${moment.images.map((src, i) => {
                    let imgSrc = src;
                    let fallbackText = src || ('图 ' + (i+1));

                    // 解析 "English|Chinese" 格式
                    if (src && !src.startsWith('http') && !src.startsWith('data:') && src.includes('|')) {
                        const parts = src.split('|');
                        const prompt = parts[0].trim().replace(/[^a-zA-Z0-9\s-]/g, ''); // 清理特殊字符
                        fallbackText = parts[1].trim(); // Chinese part
                        
                        // 直接使用本地生成，确保图片一定能显示
                        imgSrc = window.getSmartImage(fallbackText);
                    }
                    // 只有英文关键词的情况
                    else if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                        const prompt = src.replace(/[^a-zA-Z0-9\s-]/g, ''); // 清理特殊字符
                        fallbackText = src;
                        
                        // 直接使用本地生成，确保图片一定能显示
                        imgSrc = window.getSmartImage(fallbackText);
                    }
                    // 占位符处理
                    else if (!src || src.includes('placehold') || src.includes('dicebear')) {
                        imgSrc = window.getSmartImage('图 ' + (i+1));
                    }
                    
                    // 简化错误处理，直接使用本地生成的图片
                    return `<img src="${imgSrc}" class="moment-img" onerror="this.onerror=null;this.src=window.getSmartImage('${fallbackText}')">`;
                }).join('')}
            </div>`;
        }

        let visibilityHtml = '';
        // 仅在是本人发的动态且包含可见性设置时显示
        if (moment.isSelf && moment.visibility && moment.visibility.type && moment.visibility.type !== 'public') {
            let iconClass = 'fas fa-user';
            if (moment.visibility.type === 'private') {
                iconClass = 'fas fa-lock';
            }
            // 添加 position: relative 以便气泡跟随定位
            visibilityHtml = `<span class="moment-visibility-icon" style="margin-left: 10px; color: #858585; cursor: pointer; position: relative; display: inline-block;">
                <i class="${iconClass}" style="font-size: 14px;"></i>
            </span>`;
        }

        let likesHtml = '';
        if (moment.likes && moment.likes.length > 0) {
            likesHtml = `<div class="moment-likes"><i class="far fa-heart"></i> ${moment.likes.join(', ')}</div>`;
        }

        let commentsHtml = '';
        if (moment.comments && moment.comments.length > 0) {
            commentsHtml = `<div class="moment-comments">
                ${moment.comments.map(c => {
                    const cName = c.name || c.user || '好友';
                    const cContent = c.content || '...';
                    return `
                    <div class="comment-item">
                        <span class="comment-user">${cName}</span>：<span class="comment-content">${cContent}</span>
                    </div>
                `}).join('')}
            </div>`;
        }

        let footerHtml = '';
        if (likesHtml || commentsHtml) {
            footerHtml = `<div class="moment-likes-comments">${likesHtml}${commentsHtml}</div>`;
        }

        item.innerHTML = `
            <img src="${avatar}" class="moment-avatar" onerror="this.onerror=null;this.src=window.getSmartAvatar('${moment.name || 'User'}')">
            <div class="moment-content">
                <div class="moment-name">${moment.name}</div>
                <div class="moment-text">${moment.content}</div>
                ${imagesHtml}
                <div class="moment-info">
                    <div style="display: flex; align-items: center;">
                        <span class="moment-time">${moment.time}</span>
                        ${visibilityHtml}
                    </div>
                    <div style="position: relative;">
                        <button class="moment-action-btn"><i class="fas fa-ellipsis-h"></i></button>
                    </div>
                </div>
                ${footerHtml}
            </div>
        `;
        
        // 绑定可见性按钮点击事件
        const visBtn = item.querySelector('.moment-visibility-icon');
        if (visBtn && moment.visibility) {
            visBtn.onclick = (e) => {
                e.stopPropagation();
                
                // 如果已经有显示的 toast，先移除
                const existingToast = visBtn.querySelector('.visibility-toast');
                if (existingToast) {
                    existingToast.remove();
                    return;
                }

                let iconHtml = '<i class="fas fa-user"></i>';
                let contentText = '';

                if (moment.visibility.type === 'private') {
                    contentText = '仅自己可见';
                    iconHtml = '<i class="fas fa-lock"></i>';
                } else {
                    const typeText = moment.visibility.type === 'include' ? '部分可见' : '不给谁看';
                    
                    // 支持多个标签 (labels) 或单个标签 (label - 兼容旧数据)
                    let labelsText = '';
                    if (moment.visibility.labels && Array.isArray(moment.visibility.labels) && moment.visibility.labels.length > 0) {
                        labelsText = moment.visibility.labels.join(', ');
                    } else if (moment.visibility.label) {
                        labelsText = moment.visibility.label;
                    } else if (moment.visibility.list && moment.visibility.list.length > 0) {
                        labelsText = moment.visibility.list.join(', ');
                    } else {
                        labelsText = '未指定';
                    }
                    
                    if (moment.visibility.type === 'exclude') {
                        iconHtml = '<i class="fas fa-user-slash"></i>';
                        contentText = `不给看: ${labelsText}`;
                    } else {
                        contentText = labelsText;
                    }
                }

                // 创建气泡提示，append 到按钮内部实现跟随移动
                const toast = document.createElement('div');
                toast.className = 'visibility-toast';
                toast.style.cssText = `
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%);
                    margin-bottom: 8px;
                    background-color: rgba(0, 0, 0, 0.7);
                    color: #fff;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    z-index: 10;
                    white-space: nowrap;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s;
                `;
                
                // 小三角
                const arrow = document.createElement('div');
                arrow.style.cssText = `
                    position: absolute;
                    top: 100%;
                    left: 50%;
                    margin-left: -5px;
                    border-width: 5px;
                    border-style: solid;
                    border-color: rgba(0, 0, 0, 0.7) transparent transparent transparent;
                `;
                toast.appendChild(arrow);
                
                const textSpan = document.createElement('span');
                textSpan.innerHTML = `${iconHtml} ${contentText}`;
                toast.appendChild(textSpan);
                
                visBtn.appendChild(toast);
                
                // 动画显示
                requestAnimationFrame(() => {
                    toast.style.opacity = '1';
                });

                // 2秒后消失
                setTimeout(() => {
                    toast.style.opacity = '0';
                    setTimeout(() => {
                        toast.remove();
                    }, 200);
                }, 2000);
            };
        }

        list.appendChild(item);
    });
}

async function generatePhoneWechatChats(contact) {
    const btn = document.getElementById('generate-wechat-btn');
    if (btn) {
        btn.disabled = true;
        btn.classList.add('generating-pulse');
    }

    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: '暂无最近聊天记录可供参考。',
        userPersonaFallback: '未填写'
    });
    const recentChatContext = sharedContext.recentChatContext;

    const systemPrompt = `你是一个虚拟手机内容生成器。请为角色【${contact.name}】生成微信消息列表（聊天会话）及详细聊天记录。
角色设定：${sharedContext.contactPersona || '无'}
用户名称：${sharedContext.userName}
用户人设：${sharedContext.userPersonaText}

${recentChatContext}

【与用户的关联要求】
1. 可以让其中 2-4 个聊天会话，间接体现${contact.name}近期与用户的关系状态或事件进展。
2. 例如：对朋友说“今晚不去了，要去哄她/他”、对同事说“最近状态不好”、在群聊里推掉安排、和闺蜜讨论用户、为用户准备礼物或见面安排等。
3. 允许少量间接提及“对象/她/他/那位”，但【绝对不要】直接生成与用户本人的微信聊天窗口。
4. 不要照抄最近聊天原句，要像真实衍生出来的生活聊天。

【任务要求】
1. 生成 6-10 个聊天会话。
2. 包含好友、群聊（可选）、工作/生活相关联系人。
3. 【重要】绝不要生成与“我”、“玩家”、“User”、“{{user}}”或当前手机持有者自己的聊天。只生成与其他NPC（虚构人物）的聊天。
4. "lastMessage" 应简短真实，符合该联系人与主角的关系。
5. "time" 应是最近的时间。
6. "unread" (未读数) 随机生成，大部分为 0，少数为 1-5。
7. 必须包含 "messages" 数组，生成最近 5-10 条聊天记录。
   - role: "friend" (对方) 或 "me" (主角)。
   - content: 聊天内容。
   - type: "text" (默认), "image", "voice" (可选)。

【重要：返回格式】
1. 必须是纯 JSON 数组。
2. 不要包含任何开场白（如“好的”、“这是...”）。
3. 不要包含 Markdown 代码块标记。
4. 严格遵守 JSON 语法，所有字符串必须用双引号包裹。

JSON 格式示例：
[
  {
    "name": "好友名",
    "avatar": "url...",
    "lastMessage": "消息内容...",
    "time": "10:00",
    "unread": 2,
    "messages": [
       {"role": "friend", "content": "你好", "type": "text"},
       {"role": "me", "content": "你好呀", "type": "text"}
    ]
  }
]`;

    await callAiGeneration(contact, systemPrompt, 'chats', btn);
}

function renderPhoneWechatContacts(contactId) {
    const container = document.getElementById('phone-wechat-tab-contacts');
    if (!container) return;

    // 强制修复背景色，确保圆角卡片可见
    const appEl = document.getElementById('phone-wechat');
    if (appEl) appEl.style.backgroundColor = '#f2f2f7';
    
    // 获取数据
    const content = window.iphoneSimState.phoneContent && window.iphoneSimState.phoneContent[contactId];
    let chats = content ? content.wechatChats : [];
    
    // 过滤掉不应出现的聊天
    if (chats && chats.length > 0) {
        chats = chats.filter(c => {
            const name = c.name ? c.name.toLowerCase() : '';
            return !['user', '{{user}}', 'me', '玩家', '我'].includes(name);
        });
    }

    // 更新 Header 标题
    const titleEl = document.getElementById('phone-wechat-title');
    if (titleEl) {
        titleEl.textContent = `微信(${chats ? chats.length : 0})`;
        titleEl.style.fontSize = '17px';
        titleEl.style.fontWeight = '600';
    }

    // 构建 HTML
    let html = `
        <!-- 搜索框 -->
        <div style="padding: 20px 16px 16px 16px;">
            <div style="background: #e3e3e8; border-radius: 10px; height: 36px; display: flex; align-items: center; justify-content: center; color: #8e8e93;">
                <i class="fas fa-search" style="font-size: 14px; margin-right: 6px;"></i>
                <span style="font-size: 16px;">搜索</span>
            </div>
        </div>
    `;

    if (!chats || chats.length === 0) {
        html += `
            <div style="padding: 0 16px;">
                <div style="background: #fff; border-radius: 18px; padding: 20px; text-align: center; color: #999;">
                    点击右上角生成聊天
                </div>
            </div>`;
    } else {
        html += `<div style="padding: 0 16px 100px 16px;">
            <div style="background: #fff; border-radius: 18px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">`;
        
        chats.forEach((chat, index) => {
            // 预处理头像 URL，避免 404 和 403
            let avatar = chat.avatar;
            if (!avatar || (!avatar.startsWith('http') && !avatar.startsWith('data:')) || 
                avatar.includes('placehold') || avatar.includes('dicebear') || avatar.includes('pravatar')) {
                 avatar = window.getSmartAvatar(chat.name);
            }

            const unreadHtml = chat.unread > 0 
                ? `<div class="unread-badge" style="position: absolute; top: -5px; right: -5px;">${chat.unread}</div>` 
                : '';

            // 最后一项不显示下划线
            const borderStyle = index === chats.length - 1 ? 'border: none;' : 'border-bottom: 1px solid #f0f0f0;';

            html += `
                <div onclick="window.openPhoneWechatChat(${index}, '${contactId}')" style="display: flex; align-items: center; padding: 12px 16px; cursor: pointer; background: #fff;">
                    <div style="position: relative; margin-right: 12px; flex-shrink: 0;">
                        <img src="${avatar}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;" onerror="this.onerror=null;this.src=window.getSmartAvatar('${chat.name || 'User'}')">
                        ${unreadHtml}
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; height: 48px; ${borderStyle}">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                            <span style="font-size: 16px; font-weight: 500; color: #000;">${chat.name}</span>
                            <span style="font-size: 12px; color: #8e8e93;">${chat.time || ''}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 14px; color: #8e8e93; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;">${chat.lastMessage || ''}</span>
                            <i class="fas fa-chevron-right" style="font-size: 12px; color: #d1d1d6; opacity: 0.5;"></i>
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `</div></div>`;
    }
    
    container.innerHTML = html;
}

window.openPhoneWechatChat = function(index, contactId) {
    const content = window.iphoneSimState.phoneContent && window.iphoneSimState.phoneContent[contactId];
    const chats = content ? content.wechatChats : [];
    const chat = chats[index];
    
    if (!chat) return;

    let detailScreen = document.getElementById('phone-wechat-chat-detail');
    if (!detailScreen) {
        detailScreen = document.createElement('div');
        detailScreen.id = 'phone-wechat-chat-detail';
        detailScreen.className = 'sub-screen';
        detailScreen.style.zIndex = '1000'; // Above floating dock (z-index 999)
        detailScreen.style.backgroundColor = '#f2f2f7';
        document.getElementById('phone-wechat').appendChild(detailScreen);
    }

    detailScreen.innerHTML = `
        <div class="wechat-header" style="background: #ededed; color: #000; position: absolute; top: 0; width: 100%; height: calc(44px + max(47px, env(safe-area-inset-top))); padding-top: max(47px, env(safe-area-inset-top)); box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; z-index: 10;">
            <div class="header-left" style="height: 44px; display: flex; align-items: center;">
                <button class="wechat-icon-btn" onclick="window.closePhoneWechatChat()"><i class="fas fa-chevron-left"></i></button>
            </div>
            <span class="wechat-title" style="line-height: 44px;">${chat.name}</span>
            <div class="header-right" style="height: 44px; display: flex; align-items: center;">
                <button class="wechat-icon-btn"><i class="fas fa-ellipsis-h"></i></button>
            </div>
        </div>
        <div class="wechat-body" style="padding: 15px; padding-top: calc(80px + max(47px, env(safe-area-inset-top))); padding-bottom: calc(70px + env(safe-area-inset-bottom)); overflow-y: auto; height: 100%; box-sizing: border-box;">
            <div class="chat-messages-container"></div>
        </div>
        <div class="chat-input-area" style="position: absolute; bottom: 0; width: 100%; box-sizing: border-box; padding-bottom: max(10px, env(safe-area-inset-bottom)); background: #f7f7f7; border-top: 1px solid #dcdcdc;">
            <button class="chat-icon-btn"><i class="fas fa-plus-circle"></i></button>
            <input type="text" placeholder="发送消息..." disabled style="background-color: #fff; height: 36px; border-radius: 6px; padding: 0 10px; border: none; flex: 1;">
            <button class="chat-icon-btn"><i class="far fa-smile"></i></button>
            <button class="chat-icon-btn"><i class="fas fa-plus"></i></button>
        </div>
    `;

    const container = detailScreen.querySelector('.chat-messages-container');
    
    if (chat.messages && Array.isArray(chat.messages)) {
        chat.messages.forEach(msg => {
            const isMe = msg.role === 'me';
            const row = document.createElement('div');
            row.className = `chat-message ${isMe ? 'user' : 'other'}`;
            
            // 如果是对方，显示聊天对象的头像；如果是"我"，隐藏头像（或使用透明）
            // 用户反馈：直接隐藏聊天页面中的右侧这一方的头像
            let avatarHtml = '';
            if (!isMe) {
                let avatar = chat.avatar;
                if (!avatar || avatar.includes('placehold') || avatar.includes('dicebear')) {
                     avatar = window.getSmartAvatar(chat.name);
                }
                avatarHtml = `<img src="${avatar}" class="chat-avatar" onerror="this.onerror=null;this.src=window.getSmartAvatar('${chat.name || 'User'}')">`;
            }

            // Simple text rendering, ignoring types for now or basic support
            let contentHtml = msg.content;
            if (msg.type === 'image') {
                contentHtml = '[图片]'; // Placeholder if no real image
            } else if (msg.type === 'voice') {
                contentHtml = '[语音]';
            }

            row.innerHTML = `
                ${avatarHtml}
                <div class="message-content">${contentHtml}</div>
            `;
            container.appendChild(row);
        });
    } else {
        container.innerHTML = '<div style="text-align: center; color: #999; margin-top: 20px;">无聊天记录</div>';
    }

    detailScreen.classList.remove('hidden');
};

window.closePhoneWechatChat = function() {
    const detailScreen = document.getElementById('phone-wechat-chat-detail');
    if (detailScreen) {
        detailScreen.classList.add('hidden');
        // Optional: remove after transition
        setTimeout(() => detailScreen.remove(), 300);
    }
};

// 浏览器菜单和历史页面动画函数
function openBrowserMenu() {
    const modal = document.getElementById('browser-menu-modal');
    const panel = document.getElementById('browser-menu-panel');
    
    if (modal && panel) {
        modal.classList.remove('hidden');
        // 强制重绘，然后添加动画
        requestAnimationFrame(() => {
            panel.style.transform = 'translateY(0)';
        });
    }
}

function closeBrowserMenu() {
    const modal = document.getElementById('browser-menu-modal');
    const panel = document.getElementById('browser-menu-panel');
    
    if (modal && panel) {
        panel.style.transform = 'translateY(100%)';
        // 等待动画完成后隐藏
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

function openBrowserHistory() {
    // 先关闭菜单
    closeBrowserMenu();
    
    // 延迟打开历史页面，让菜单先关闭
    setTimeout(() => {
        const modal = document.getElementById('browser-history-modal');
        const panel = document.getElementById('browser-history-panel');
        
        if (modal && panel) {
            modal.classList.remove('hidden');
            // 强制重绘，然后添加动画
            requestAnimationFrame(() => {
                panel.style.transform = 'translateY(0)';
            });
        }
    }, 150);
}

function closeBrowserHistory() {
    const modal = document.getElementById('browser-history-modal');
    const panel = document.getElementById('browser-history-panel');
    
    if (modal && panel) {
        panel.style.transform = 'translateY(100%)';
        // 等待动画完成后隐藏
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

function openBrowserBookmarks() {
    closeBrowserMenu();
    setTimeout(() => {
        const modal = document.getElementById('browser-bookmarks-modal');
        const panel = document.getElementById('browser-bookmarks-panel');
        if (modal && panel) {
            modal.classList.remove('hidden');
            requestAnimationFrame(() => {
                panel.style.transform = 'translateY(0)';
            });
        }
    }, 150);
}

function closeBrowserBookmarks() {
    const modal = document.getElementById('browser-bookmarks-modal');
    const panel = document.getElementById('browser-bookmarks-panel');
    if (modal && panel) {
        panel.style.transform = 'translateY(100%)';
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

function openBrowserDownloads() {
    closeBrowserMenu();
    setTimeout(() => {
        const modal = document.getElementById('browser-downloads-modal');
        const panel = document.getElementById('browser-downloads-panel');
        if (modal && panel) {
            modal.classList.remove('hidden');
            requestAnimationFrame(() => {
                panel.style.transform = 'translateY(0)';
            });
        }
    }, 150);
}

function closeBrowserDownloads() {
    const modal = document.getElementById('browser-downloads-modal');
    const panel = document.getElementById('browser-downloads-panel');
    if (modal && panel) {
        panel.style.transform = 'translateY(100%)';
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

function openBrowserShare() {
    closeBrowserMenu();
    setTimeout(() => {
        const modal = document.getElementById('browser-share-modal');
        const panel = document.getElementById('browser-share-panel');
        if (modal && panel) {
            modal.classList.remove('hidden');
            requestAnimationFrame(() => {
                panel.style.transform = 'translateY(0)';
            });
        }
    }, 150);
}

function closeBrowserShare() {
    const modal = document.getElementById('browser-share-modal');
    const panel = document.getElementById('browser-share-panel');
    if (modal && panel) {
        panel.style.transform = 'translateY(100%)';
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
}

// 渲染浏览器搜索记录
function renderBrowserSearchRecords(contactId) {
    const list = document.getElementById('browser-search-records-list');
    if (!list) return;
    
    const content = window.iphoneSimState.phoneContent && window.iphoneSimState.phoneContent[contactId];
    const records = content && content.browserData ? content.browserData.search_history : [];
    
    list.innerHTML = '';
    
    const items = records && records.length > 0 ? records : [
        "搜索记录1", "搜索记录2", "搜索记录3", "搜索记录4",
        "搜索记录5", "搜索记录6", "搜索记录7", "搜索记录8", "搜索记录9"
    ];

    items.forEach(text => {
        const div = document.createElement('div');
        div.className = 'record-item';
        div.style.cssText = 'font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer;';
        div.textContent = text;
        list.appendChild(div);
    });
}

// 渲染浏览器历史记录
function renderPhoneBrowser(contactId) {
    const historyList = document.getElementById('browser-history-list');
    if (!historyList) return;
    
    const content = window.iphoneSimState.phoneContent && window.iphoneSimState.phoneContent[contactId];
    const historyData = (content && content.browserData && content.browserData.browser_history) || (content && content.browserHistory) || [];
    
    if (!historyData || historyData.length === 0) {
        historyList.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: #999;"><i class="far fa-clock" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i><p>暂无历史记录</p></div>`;
        return;
    }
    
    let html = '';
    historyData.forEach((item, index) => {
        const title = item.title || item.url || '未知页面';
        const borderStyle = index === historyData.length - 1 ? 'border: none;' : 'border-bottom: 1px solid #f0f0f0;';
        
        html += `
            <div onclick='openBrowserPageDetail(${JSON.stringify(item).replace(/'/g, "'")}, "history")' style="padding: 15px 20px; background: #fff; ${borderStyle}; cursor: pointer;">
                <div style="font-size: 16px; color: #000; margin-bottom: 4px; font-weight: 500;">${title}</div>
                <div style="font-size: 12px; color: #8e8e93;">${item.time || '刚刚'}</div>
            </div>
        `;
    });
    
    historyList.innerHTML = html;
}

// 渲染书签
function renderBrowserBookmarks(contactId) {
    const list = document.querySelector('#browser-bookmarks-panel .history-content > div');
    if (!list) return;
    
    const content = window.iphoneSimState.phoneContent && window.iphoneSimState.phoneContent[contactId];
    const bookmarks = content && content.browserData ? content.browserData.bookmarks : [];
    
    if (!bookmarks || bookmarks.length === 0) {
        list.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: #999;"><i class="far fa-star" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i><p>暂无书签</p></div>`;
        return;
    }

    let html = '';
    bookmarks.forEach((item, index) => {
        const borderStyle = index === bookmarks.length - 1 ? 'border: none;' : 'border-bottom: 1px solid #f0f0f0;';
        html += `
            <div onclick='openBrowserPageDetail(${JSON.stringify(item).replace(/'/g, "'")}, "bookmark")' style="padding: 15px 20px; background: #fff; ${borderStyle}; cursor: pointer; display: flex; align-items: center;">
                <i class="fas fa-star" style="color: #FFD700; margin-right: 10px;"></i>
                <div style="flex: 1;">
                    <div style="font-size: 16px; color: #000; font-weight: 500;">${item.title}</div>
                </div>
                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
            </div>
        `;
    });
    list.innerHTML = html;
}

// 渲染下载
function renderBrowserDownloads(contactId) {
    const list = document.querySelector('#browser-downloads-panel .history-content > div');
    if (!list) return;
    
    const content = window.iphoneSimState.phoneContent && window.iphoneSimState.phoneContent[contactId];
    const downloads = content && content.browserData ? content.browserData.downloads : [];
    
    if (!downloads || downloads.length === 0) {
        list.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: #999;"><i class="fas fa-arrow-down" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i><p>暂无下载</p></div>`;
        return;
    }

    let html = '';
    downloads.forEach((item, index) => {
        const borderStyle = index === downloads.length - 1 ? 'border: none;' : 'border-bottom: 1px solid #f0f0f0;';
        const icon = item.icon || '??';
        html += `
            <div style="padding: 15px 20px; background: #fff; ${borderStyle}; display: flex; align-items: center;">
                <div style="font-size: 24px; margin-right: 15px;">${icon}</div>
                <div style="flex: 1;">
                    <div style="font-size: 16px; color: #000; font-weight: 500;">${item.filename}</div>
                    <div style="font-size: 12px; color: #8e8e93;">已完成 ? 2.5MB</div>
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// 渲染分享
function renderBrowserShare(contactId) {
    const list = document.querySelector('#browser-share-panel .history-content > div');
    if (!list) return;
    
    const content = window.iphoneSimState.phoneContent && window.iphoneSimState.phoneContent[contactId];
    const shares = content && content.browserData ? content.browserData.share_history : [];
    
    if (!shares || shares.length === 0) {
        list.innerHTML = `<div style="text-align: center; padding: 40px 20px; color: #999;"><i class="fas fa-share-alt" style="font-size: 48px; margin-bottom: 15px; opacity: 0.5;"></i><p>暂无分享</p></div>`;
        return;
    }

    let html = '';
    shares.forEach((item, index) => {
        const borderStyle = index === shares.length - 1 ? 'border: none;' : 'border-bottom: 1px solid #f0f0f0;';
        html += `
            <div onclick='openBrowserPageDetail(${JSON.stringify(item).replace(/'/g, "'")}, "share")' style="padding: 15px 20px; background: #fff; ${borderStyle}; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1; margin-right: 10px;">
                    <div style="font-size: 16px; color: #000; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.title}</div>
                </div>
                <div style="font-size: 14px; color: #8e8e93;">
                    分享给: ${item.target}
                </div>
            </div>
        `;
    });
    list.innerHTML = html;
}

// 打开详情页
window.openBrowserPageDetail = function(item, type) {
    const modal = document.getElementById('browser-page-detail');
    const titleEl = document.getElementById('browser-detail-title');
    const contentEl = document.getElementById('browser-detail-content');
    const footerEl = document.getElementById('browser-detail-footer');
    
    if (!modal) return;
    
    titleEl.textContent = item.title || '详情';
    
    // 内容部分
    if (type === 'share') {
        contentEl.innerHTML = `<p><strong>分享内容：</strong>${item.title}</p><p><strong>分享给：</strong>${item.target}</p>`;
    } else {
        contentEl.innerHTML = item.content || '（无详细内容）';
    }
    
    // 底部部分
    let footerText = '';
    if (type === 'history') {
        footerText = `<i>?? ${item.thoughts || ''}</i>`;
    } else if (type === 'bookmark') {
        footerText = `<i>?? ${item.thoughts || ''}</i><br><br>?? ${item.reason || ''}`;
    } else if (type === 'share') {
        footerText = `[配文] "${item.comment || ''}"`;
    }
    
    footerEl.innerHTML = footerText;
    
    modal.classList.remove('hidden');
}

window.closeBrowserPageDetail = function() {
    document.getElementById('browser-page-detail').classList.add('hidden');
}

// 生成浏览器所有内容
async function generatePhoneBrowserHistory(contact) {
    const btn = document.getElementById('generate-browser-btn');
    if (btn) {
        btn.disabled = true;
        btn.classList.add('generating-pulse');
    }

    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: '暂无最近聊天记录可供参考。',
        userPersonaFallback: '未填写'
    });

    let worldbookInfo = '';
    if (window.iphoneSimState.worldbook) {
        const activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled);
        if (contact.linkedWbCategories) {
             const linked = activeEntries.filter(e => contact.linkedWbCategories.includes(e.categoryId));
             if (linked.length > 0) worldbookInfo = '相关世界书设定：\n' + linked.map(e => e.content).join('\n');
        }
    }

    const systemPrompt = `你是一个虚拟手机内容生成器。请为角色【${contact.name}】生成浏览器相关的所有数据。

【角色设定】
联系人信息：${sharedContext.contactPersona || '无'}
用户名称：${sharedContext.userName}
用户人设：${sharedContext.userPersonaText}

【背景信息】
${worldbookInfo}
${sharedContext.recentChatContext}

【任务要求】
请生成一个 JSON 对象，包含以下 5 个部分的真实数据 (数据要符合角色人设和生活习惯)：

1. "search_history" (搜索记录): 9 个字符串。
   - 模拟真人搜索时的关键词或问题。
   
2. "browser_history" (浏览历史): 5 个对象。
   - { "title": "网页标题", "content": "网页详细内容摘要(100字左右)", "thoughts": "角色浏览时的心理活动(斜体)", "time": "10:30" }
   
3. "bookmarks" (书签/收藏): 5 个对象。
   - { "title": "网页标题", "content": "网页内容简介", "thoughts": "角色想法", "reason": "收藏原因" }
   
4. "downloads" (下载记录): 5 个对象。
   - { "filename": "文件名(包含后缀)", "icon": "文件类型的Emoji图标" }
   - 包含文件、资源、APP等。
   
5. "share_history" (分享记录): 5 个对象。
   - { "title": "分享的内容标题", "target": "分享给谁(名字)", "comment": "分享时的配文/吐槽(简单一句话)" }

【返回格式】
必须是纯 JSON 对象。
不要包含 Markdown 标记。`;

    await callAiGeneration(contact, systemPrompt, 'browser_all', btn);
}

// 注册
if (window.appInitFunctions) {
    window.appInitFunctions.push(initPhoneGrid);
}

// 生成浏览器内容的包装函数
function generateBrowserContent() {
    if (!currentCheckPhoneContactId) {
        alert('请先选择一个联系人');
        return;
    }
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
    if (!contact) {
        alert('联系人不存在');
        return;
    }
    
    generatePhoneBrowserHistory(contact);
}

function enterBrowserSearchMode() {
    if (currentCheckPhoneContactId) {
        renderBrowserSearchRecords(currentCheckPhoneContactId);
    }

    const logo = document.getElementById('browser-logo');
    const records = document.getElementById('browser-search-records');
    const searchBar = document.getElementById('browser-search-bar');
    const searchInput = document.getElementById('browser-search-input');
    const searchIcon = document.getElementById('browser-search-icon');
    const content = document.getElementById('phone-browser-content');

    if (logo) {
        logo.style.opacity = '0';
        // 使用 visibility: hidden 保持占位，防止下方元素(搜索框)位置跳动
        setTimeout(() => logo.style.visibility = 'hidden', 300);
    }
    
    if (content) content.style.opacity = '0'; // 同样渐隐内容

    if (records) {
        records.classList.remove('hidden');
        // 简单的淡入效果
        records.style.opacity = '0';
        requestAnimationFrame(() => {
            records.style.transition = 'opacity 0.3s ease';
            records.style.opacity = '1';
        });
    }

    if (searchBar) {
        // 不需要调整 marginBottom，因为位置应该保持不变
    }

    if (searchInput) {
        searchInput.style.textAlign = 'left';
        searchInput.value = ''; // 清空
        searchInput.placeholder = '|'; // 模拟光标
    }

    if (searchIcon) {
        searchIcon.style.display = 'block';
    }
}

function exitBrowserSearchMode() {
    const logo = document.getElementById('browser-logo');
    const records = document.getElementById('browser-search-records');
    const searchBar = document.getElementById('browser-search-bar');
    const searchInput = document.getElementById('browser-search-input');
    const searchIcon = document.getElementById('browser-search-icon');
    const content = document.getElementById('phone-browser-content');

    if (records) {
        records.style.opacity = '0';
        setTimeout(() => {
            records.classList.add('hidden');
            if (logo) {
                logo.style.visibility = 'visible'; // 恢复可见
                requestAnimationFrame(() => logo.style.opacity = '1');
            }
            if (content) content.style.opacity = '1';
        }, 300);
    }

    if (searchInput) {
        searchInput.style.textAlign = 'center';
        searchInput.placeholder = '搜索或输入网址';
        searchInput.value = '';
    }

    if (searchIcon) {
        searchIcon.style.display = 'none';
    }
}

// 全局函数注册
window.openBrowserMenu = openBrowserMenu;
window.closeBrowserMenu = closeBrowserMenu;
window.openBrowserHistory = openBrowserHistory;
window.closeBrowserHistory = closeBrowserHistory;
window.openBrowserBookmarks = openBrowserBookmarks;
window.closeBrowserBookmarks = closeBrowserBookmarks;
window.openBrowserDownloads = openBrowserDownloads;
window.closeBrowserDownloads = closeBrowserDownloads;
window.openBrowserShare = openBrowserShare;
window.closeBrowserShare = closeBrowserShare;
window.renderPhoneBrowser = renderPhoneBrowser;
window.renderBrowserSearchRecords = renderBrowserSearchRecords;
window.renderBrowserBookmarks = renderBrowserBookmarks;
window.renderBrowserDownloads = renderBrowserDownloads;
window.renderBrowserShare = renderBrowserShare;
window.generatePhoneBrowserHistory = generatePhoneBrowserHistory;
window.generateBrowserContent = generateBrowserContent;

// 调试函数：检查生成功能状态
window.debugPhoneGeneration = function() {
    console.log('=== 查手机生成功能调试信息 ===');
    console.log('当前联系人ID:', currentCheckPhoneContactId);
    
    if (currentCheckPhoneContactId) {
        const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
        console.log('当前联系人:', contact);
    }
    
    // 检查AI设置
    const settings1 = window.iphoneSimState.aiSettings;
    const settings2 = window.iphoneSimState.aiSettings2;
    console.log('AI设置1:', settings1);
    console.log('AI设置2:', settings2);
    
    const activeSettings = settings1.url ? settings1 : settings2;
    console.log('当前使用的AI设置:', activeSettings);
    
    const configErrors = validateAiSettings(activeSettings);
    console.log('AI配置验证结果:', configErrors.length === 0 ? '通过' : configErrors);
    
    // 检查按钮状态
    const wechatBtn = document.getElementById('generate-wechat-btn');
    const browserBtn = document.getElementById('generate-browser-btn');
    
    console.log('微信生成按钮状态:', {
        exists: !!wechatBtn,
        disabled: wechatBtn?.disabled,
        hasGeneratingClass: wechatBtn?.classList.contains('generating-pulse'),
        onclick: typeof wechatBtn?.onclick
    });
    
    console.log('浏览器生成按钮状态:', {
        exists: !!browserBtn,
        disabled: browserBtn?.disabled,
        hasGeneratingClass: browserBtn?.classList.contains('generating-pulse'),
        onclick: typeof browserBtn?.onclick
    });
    
    // 检查网络连接
    console.log('网络状态:', navigator.onLine ? '在线' : '离线');
    
    console.log('=== 调试信息结束 ===');
    
    return {
        contactId: currentCheckPhoneContactId,
        aiConfigValid: configErrors.length === 0,
        networkOnline: navigator.onLine,
        buttonsReady: !!wechatBtn && !!browserBtn
    };
};

// 重置按钮状态的函数
window.resetGenerationButtons = function() {
    const wechatBtn = document.getElementById('generate-wechat-btn');
    const browserBtn = document.getElementById('generate-browser-btn');
    
    if (wechatBtn) {
        wechatBtn.classList.remove('generating-pulse');
        wechatBtn.disabled = false;
        console.log('微信生成按钮状态已重置');
    }
    
    if (browserBtn) {
        browserBtn.classList.remove('generating-pulse');
        browserBtn.disabled = false;
        console.log('浏览器生成按钮状态已重置');
    }
};
window.enterBrowserSearchMode = enterBrowserSearchMode;
window.exitBrowserSearchMode = exitBrowserSearchMode;

// --- 闲鱼应用逻辑 ---

window.switchXianyuTab = function(tabName) {
    const messagesTab = document.getElementById('xianyu-tab-messages');
    const meTab = document.getElementById('xianyu-tab-me');
    // 获取 tab items: 0=首页, 1=位置, 2=卖闲置, 3=消息, 4=我的
    const tabs = document.querySelectorAll('.xianyu-tab-bar .tab-item');
    
    if (!tabs || tabs.length < 5) return;

    const tabMsgBtn = tabs[3]; 
    const tabMeBtn = tabs[4];

    if (tabName === 'messages') {
        if (messagesTab) messagesTab.style.display = 'block';
        if (meTab) meTab.style.display = 'none';
        
        tabMsgBtn.classList.add('active');
        tabMsgBtn.style.color = '#333';
        tabMeBtn.classList.remove('active');
        tabMeBtn.style.color = '#999';
        
        if (currentCheckPhoneContactId) window.renderXianyuMessages(currentCheckPhoneContactId);
    } else if (tabName === 'me') {
        if (messagesTab) messagesTab.style.display = 'none';
        if (meTab) meTab.style.display = 'block';
        
        tabMsgBtn.classList.remove('active');
        tabMsgBtn.style.color = '#999';
        tabMeBtn.classList.add('active');
        tabMeBtn.style.color = '#333';
        
        if (currentCheckPhoneContactId) window.renderXianyuMe(currentCheckPhoneContactId);
    }
};

window.renderXianyuMe = function(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    const avatarEl = document.getElementById('xianyu-me-avatar');
    const nameEl = document.getElementById('xianyu-me-name');
    
    if (avatarEl) {
        let avatar = contact.avatar;
        if (!avatar || (!avatar.startsWith('http') && !avatar.startsWith('data:'))) {
             avatar = window.getSmartAvatar(contact.name);
        }
        avatarEl.src = avatar;
    }
    
    if (nameEl) {
        // 使用AI生成的闲鱼昵称，如果没有则使用默认
        let nickname = "昵称";
        if (contact.xianyuData && contact.xianyuData.profile && contact.xianyuData.profile.nickname) {
            nickname = contact.xianyuData.profile.nickname;
        }
        nameEl.textContent = nickname;
    }
    
    // 更新统计数据
    if (contact.xianyuData && contact.xianyuData.profile) {
        const profile = contact.xianyuData.profile;
        
        // 更新收藏数
        const favoritesEl = document.querySelector('[onclick="openXianyuFavorites()"] span:first-child');
        if (favoritesEl) {
            const favoritesCount = contact.xianyuData.favorites ? contact.xianyuData.favorites.length : (profile.favorites || 280);
            favoritesEl.textContent = favoritesCount;
        }
        
        // 更新历史浏览数
        const viewsEl = document.querySelector('div:nth-child(2) > span:first-child');
        if (viewsEl && profile.views) {
            viewsEl.textContent = profile.views;
        }
        
        // 更新关注数
        const followingEl = document.querySelector('div:nth-child(3) > span:first-child');
        if (followingEl && profile.following) {
            followingEl.textContent = profile.following;
        }
        
        // 更新红包卡券数
        const couponsEl = document.querySelector('div:nth-child(4) > span:first-child');
        if (couponsEl && profile.coupons) {
            couponsEl.textContent = profile.coupons;
        }
        
        // 更新鱼力值
        const fishPowerEl = document.querySelector('[style*="鱼力值"]');
        if (fishPowerEl && profile.fishPower) {
            fishPowerEl.textContent = `鱼力值 ${profile.fishPower}`;
        }
        
        // 更新发布数量
        const publishedCountEl = document.querySelector('[onclick="openXianyuPublished()"] span');
        if (publishedCountEl && contact.xianyuData.published) {
            publishedCountEl.textContent = `我发布的 ${contact.xianyuData.published.length}`;
        }
        
        // 更新卖出数量
        const soldCountEl = document.querySelector('[onclick="openXianyuSold()"] span');
        if (soldCountEl && contact.xianyuData.sold) {
            soldCountEl.textContent = `我卖出的 ${contact.xianyuData.sold.length}`;
        }
        
        // 更新买到数量
        const boughtCountEl = document.querySelector('[onclick="openXianyuBought()"] span');
        if (boughtCountEl && contact.xianyuData.bought) {
            boughtCountEl.textContent = `我买到的 ${contact.xianyuData.bought.length}`;
        }
    }
};

window.renderXianyuMessages = function(contactId) {
    const list = document.getElementById('xianyu-messages-list');
    if (!list) return;
    
    // 获取当前联系人的闲鱼数据
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    let mockChats = [];
    
    if (contact && contact.xianyuData && contact.xianyuData.messages) {
        // 使用AI生成的数据
        mockChats = contact.xianyuData.messages.map(item => ({
            name: item.name,
            tag: item.tag || "",
            tagColor: item.tag ? (item.tag === "交易成功" ? "#00CC66" : "#FF6600") : "",
            msg: item.message,
            time: item.time,
            img: item.img || window.getSmartImage(item.name.substring(0, 3))
        }));
        
        // 添加一个官方消息
        mockChats.splice(2, 0, {
            name: "热门活动",
            isOfficial: true,
            msg: "?? 本周热门商品排行榜出炉！",
            time: "18小时前"
        });
    } else {
        // 使用默认Mock数据
        mockChats = [
            { name: "快乐小狗", tag: "等待买家收货", tagColor: "#FF6600", msg: "[卖家已发货] 亲，这边已经帮您发货了哦", time: "13小时前", img: window.getSmartImage("闲置书籍") },
            { name: "数码爱好者", tag: "等待买家发货", tagColor: "#FF6600", msg: "好的，我明天寄出", time: "14小时前", img: window.getSmartImage("鼠标") },
            { name: "闲置清理", tag: "", tagColor: "", msg: "还在吗？诚心要", time: "14小时前", img: window.getSmartImage("自行车") },
            { name: "橘子汽水", tag: "交易成功", tagColor: "#00CC66", msg: "东西收到了，很喜欢！", time: "17小时前", img: window.getSmartImage("帆布包") },
            { name: "热门活动", isOfficial: true, msg: "?? 本周热门商品排行榜出炉！", time: "18小时前" },
            { name: "VintageShop", tag: "等待买家发货", tagColor: "#FF6600", msg: "已付款，请尽快发货", time: "01-25", img: window.getSmartImage("外套") },
            { name: "好运连连", tag: "交易成功", tagColor: "#00CC66", msg: "[系统] 交易成功", time: "01-25", img: window.getSmartImage("手机") },
            { name: "手工达人", tag: "等待买家发货", tagColor: "#FF6600", msg: "这个可以定制颜色吗？", time: "01-23", img: window.getSmartImage("手工艺品") }
        ];
    }

    let html = '';
    mockChats.forEach(chat => {
        if (chat.isOfficial) {
            html += `
            <div style="display: flex; padding: 12px 15px; background: #fff; margin-bottom: 1px;">
                <div style="margin-right: 12px; position: relative;">
                    <div style="width: 48px; height: 48px; background: #FF4400; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold; font-size: 14px;">HOT</div>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span style="font-size: 16px; font-weight: 700; color: #000;">${chat.name}</span>
                            <span style="background: #f0f0f0; color: #999; font-size: 10px; padding: 1px 4px; border-radius: 4px;">服务号</span>
                        </div>
                        <i class="far fa-bell-slash" style="color: #ccc; font-size: 12px;"></i>
                    </div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 4px;">${chat.msg}</div>
                    <div style="font-size: 11px; color: #999;">${chat.time}</div>
                </div>
            </div>`;
        } else {
            let tagHtml = '';
            if (chat.tag) {
                const color = chat.tagColor || '#999';
                let icon = 'fa-clock';
                if (chat.tag === '交易成功') icon = 'fa-check-circle';
                
                tagHtml = `<span style="color: ${color}; font-size: 12px; margin-left: 6px; font-weight: 400; display: flex; align-items: center;"><i class="far ${icon}" style="font-size: 11px; margin-right: 3px;"></i> ${chat.tag}</span>`;
            }

            // 使用本地生成图片作为fallback
            const fallbackImg = window.getSmartImage(chat.name);

            html += `
            <div style="display: flex; padding: 12px 15px; background: #fff; margin-bottom: 1px;">
                <div style="margin-right: 12px;">
                    <img src="${window.getSmartAvatar(chat.name)}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover;">
                </div>
                <div style="flex: 1; margin-right: 10px; display: flex; flex-direction: column; justify-content: center;">
                    <div style="margin-bottom: 4px; display: flex; align-items: center;">
                        <span style="font-size: 16px; font-weight: 700; color: #000; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 140px;">${chat.name}</span>
                        ${tagHtml}
                    </div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${chat.msg}</div>
                    <div style="font-size: 11px; color: #999;">${chat.time}</div>
                </div>
                <div>
                    <img src="${chat.img}" onerror="this.src='${fallbackImg}'" style="width: 48px; height: 48px; border-radius: 4px; object-fit: cover;">
                </div>
            </div>`;
        }
    });
    
    list.innerHTML = html;
    
    // 增强消息列表，添加点击聊天功能
    setTimeout(() => {
        window.enhanceXianyuMessagesList();
    }, 100);
};

window.openXianyuSold = function() {
    const page = document.getElementById('xianyu-page-sold');
    if (page) {
        page.classList.remove('hidden');
        renderXianyuSoldList();
    }
};

window.renderXianyuSoldList = function() {
    const list = document.getElementById('xianyu-sold-list');
    if (!list) return;

    // 获取当前联系人的闲鱼数据
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
    let items = [];
    
    if (contact && contact.xianyuData && contact.xianyuData.sold) {
        // 使用AI生成的数据
        items = contact.xianyuData.sold.map(item => ({
            ...item,
            img: item.img || window.getSmartImage(item.title.substring(0, 6)),
            statusColor: "#FF6600",
            actions: item.status === "交易成功" ? ["联系买家", "查看评价"] : ["联系买家", "催评价"],
            isSold: true
        }));
    } else {
        // 使用默认Mock数据
        items = [
            {
                buyer: "FilmFanatic", status: "交易成功", statusColor: "#FF6600",
                title: "Canon AE-1 胶片相机 银色机身", price: "1500",
                img: window.getSmartImage("胶片相机"),
                actions: ["联系买家", "查看评价", "删除订单"],
                isSold: true
            },
            {
                buyer: "CoffeeLover", status: "交易成功", statusColor: "#FF6600",
                title: "星巴克星礼卡 面值100元", price: "80",
                img: window.getSmartImage("星礼卡"),
                actions: ["联系买家", "查看评价"],
                isSold: true
            },
            {
                buyer: "WinterIsComing", status: "等待买家评价", statusColor: "#FF6600",
                title: "手工编织围巾 羊毛 红色", price: "120",
                img: window.getSmartImage("红围巾"),
                actions: ["联系买家", "催评价"],
                isSold: true
            }
        ];
    }

    let html = '';
    items.forEach(item => {
        let actionsHtml = item.actions.map((action, idx) => {
            const isHighlight = idx === item.actions.length - 1 && action !== "删除订单";
            const style = isHighlight 
                ? "background: #FFDA44; border: 1px solid #FFDA44; padding: 6px 14px; border-radius: 18px; font-size: 13px; color: #333; font-weight: bold;"
                : "background: #fff; border: 1px solid #ccc; padding: 6px 14px; border-radius: 18px; font-size: 13px; color: #333;";
            return `<button style="${style}">${action}</button>`;
        }).join('');

        // 详情页使用的是当前联系人（卖家）的信息，所以这里不传递 seller 属性给 openXianyuDetail
        html += `
        <div onclick='openXianyuDetail(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="background: #fff; border-radius: 12px; padding: 15px; margin-bottom: 10px; cursor: pointer;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="display: flex; align-items: center;">
                    <img src="${window.getSmartAvatar(item.buyer)}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">
                    <span style="font-weight: bold; font-size: 14px;">${item.buyer}</span>
                </div>
                <span style="color: ${item.statusColor}; font-size: 14px;">${item.status}</span>
            </div>
            
            <!-- Content -->
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <img src="${item.img}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 2px 0;">
                    <div style="font-size: 15px; font-weight: bold; color: #333; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${item.title}</div>
                    <div style="text-align: right; color: #000; font-weight: bold; font-size: 14px;">￥${item.price}</div>
                </div>
            </div>
            
            <!-- Actions -->
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #999; font-size: 12px;">更多</span>
                <div style="display: flex; gap: 8px;" onclick="event.stopPropagation();">
                    ${actionsHtml}
                </div>
            </div>
        </div>
        `;
    });

    list.innerHTML = html;
};

// --- 闲鱼子页面逻辑 ---

window.openXianyuPublished = function() {
    const page = document.getElementById('xianyu-page-published');
    if (page) {
        page.classList.remove('hidden');
        renderXianyuPublishedList();
    }
};

window.renderXianyuPublishedList = function() {
    const list = document.getElementById('xianyu-published-list');
    if (!list) return;

    // 获取当前联系人的闲鱼数据
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
    let items = [];
    
    if (contact && contact.xianyuData && contact.xianyuData.published) {
        // 使用AI生成的数据
        items = contact.xianyuData.published.map(item => ({
            ...item,
            img: item.img || window.getSmartImage(item.title.substring(0, 6)),
            isPublished: true
        }));
    } else {
        // 使用默认Mock数据
        items = [
            { title: "Switch 日版续航版 灰色手柄", price: "850", exposure: 419, views: 34, want: 0, tag: "闲鱼币抵扣", img: window.getSmartImage("游戏机"), isPublished: true },
            { title: "宜家书桌 白色 九成新 需自提", price: "120", exposure: "1.8万", views: 687, want: 5, tag: "", img: window.getSmartImage("书桌"), isPublished: true },
            { title: "JBL GO3 蓝牙音箱 红色", price: "150", exposure: 2315, views: 155, want: 1, tag: "", img: window.getSmartImage("音箱"), isPublished: true }
        ];
    }

    let html = '';
    items.forEach((item, index) => {
        let tagHtml = '';
        if (item.tag) {
            tagHtml = `<span style="background: #FFF5E0; color: #FF6600; font-size: 10px; padding: 1px 4px; border-radius: 4px; margin-right: 5px;">${item.tag}</span>`;
        }

        html += `
        <div onclick='openXianyuDetail(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="background: #fff; border-radius: 12px; padding: 15px; margin-bottom: 10px; cursor: pointer;">
            <!-- 顶部提示条 (模拟) -->
            ${index === 0 ? `<div style="background: #F5F7FA; padding: 8px; border-radius: 8px; margin-bottom: 10px; font-size: 12px; color: #333; display: flex; align-items: center;"><i class="fas fa-lightbulb" style="color: #FF6600; margin-right: 5px;"></i> 解锁提效包，分析商品流量变化... <i class="fas fa-chevron-right" style="margin-left: auto; color: #ccc;"></i></div>` : ''}
            
            <div style="display: flex; gap: 10px;">
                <img src="${item.img}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="font-size: 15px; font-weight: bold; color: #333; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${item.title}</div>
                    <div style="font-size: 11px; color: #999;">曝光${item.exposure} 浏览${item.views} 想要${item.want}</div>
                    <div style="color: #FF3B30; font-weight: bold; font-size: 16px;">￥${item.price}</div>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; margin-top: 10px;">
                <i class="fas fa-ellipsis-h" style="color: #999; margin-right: 10px;"></i>
                ${tagHtml}
                <div style="margin-left: auto; display: flex; gap: 8px;">
                    <button style="background: #fff; border: 1px solid #eee; padding: 4px 12px; border-radius: 16px; font-size: 12px; color: #333;">次元优惠</button>
                    <button style="background: #fff; border: 1px solid #eee; padding: 4px 12px; border-radius: 16px; font-size: 12px; color: #333;">降价</button>
                    <button style="background: #fff; border: 1px solid #eee; padding: 4px 12px; border-radius: 16px; font-size: 12px; color: #333;">编辑</button>
                </div>
            </div>
        </div>
        `;
    });

    list.innerHTML = html;
};

// 生成个性化商品描述
function generateItemDescription(item) {
    const title = item.title.toLowerCase();
    let description = "";
    
    // 根据商品类型生成不同的描述
    if (title.includes('手机') || title.includes('phone') || title.includes('iphone') || title.includes('华为') || title.includes('小米')) {
        const conditions = ['九成新', '八成新', '九五成新', '几乎全新'];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        description = `${condition}，功能完好，无拆无修。屏幕无划痕，电池健康度良好。配件齐全，包装盒说明书都在。`;
        description += `\n\n使用感受：手感很好，性能流畅，日常使用完全没问题。因为换新机了所以出售。`;
        description += `\n\n发货说明：顺丰包邮，当天发货。支持验货，不满意可退。`;
    } else if (title.includes('电脑') || title.includes('笔记本') || title.includes('laptop') || title.includes('macbook')) {
        description = `配置还很不错，日常办公、学习、轻度游戏都没问题。外观有轻微使用痕迹，但不影响使用。`;
        description += `\n\n硬件状态：CPU、内存、硬盘都正常，散热良好，运行稳定。已重装系统，激活正版。`;
        description += `\n\n包装：原装充电器，包装盒还在。同城可面交，外地走闲鱼担保。`;
    } else if (title.includes('衣服') || title.includes('裙子') || title.includes('外套') || title.includes('鞋') || title.includes('包')) {
        description = `基本没怎么穿，尺码不合适所以出售。面料质感很好，做工精细。`;
        description += `\n\n尺码信息：请仔细看图片中的尺码标签，不接受因尺码问题退换。`;
        description += `\n\n发货：48小时内发货，包装仔细。介意二手勿拍。`;
    } else if (title.includes('书') || title.includes('教材') || title.includes('小说')) {
        description = `内容完整，无缺页。有少量笔记和划线，不影响阅读。适合学习或收藏。`;
        description += `\n\n保存状态：书页干净，封面有轻微磨损。存放在干燥环境，无异味。`;
        description += `\n\n邮费：重量较轻，邮费便宜。支持合并邮寄多本书籍。`;
    } else if (title.includes('游戏') || title.includes('switch') || title.includes('ps') || title.includes('xbox')) {
        description = `成色如图，功能正常。手柄无漂移，按键灵敏。游戏运行流畅。`;
        description += `\n\n配件：原装手柄、充电线、说明书等都在。部分游戏卡带一起出。`;
        description += `\n\n使用情况：平时爱护使用，无摔无进水。因为工作忙没时间玩了。`;
    } else if (title.includes('家具') || title.includes('桌子') || title.includes('椅子') || title.includes('柜子')) {
        description = `实物比图片好看，质量很好。因为搬家/换新所以出售。`;
        description += `\n\n尺寸：请看图片中的详细尺寸，购买前请确认家里空间。`;
        description += `\n\n自提：比较重，建议同城自提。可以帮忙搬到楼下。`;
    } else {
        // 通用描述
        const conditions = ['九成新', '八成新', '九五成新', '成色很好'];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        description = `${condition}，功能正常，使用感良好。因为闲置所以出售。`;
        description += `\n\n物品状态：保存完好，无明显瑕疵。实物与图片一致。`;
        description += `\n\n交易说明：支持验货，不满意可退。诚心出售，价格可小刀。`;
    }
    
    // 添加通用结尾
    description += `\n\n? 不退不换，看好再拍\n? 急用钱，诚心出售\n?? 包装仔细，放心购买`;
    
    return description;
}

window.openXianyuDetail = function(item) {
    console.log('打开闲鱼商品详情页，商品信息:', item);
    const page = document.getElementById('xianyu-page-detail');
    if (!page) {
        console.error('找不到闲鱼详情页元素');
        return;
    }

    window.currentXianyuDetailItem = item;
    console.log('设置全局商品信息:', window.currentXianyuDetailItem);

    // Populate data
    document.getElementById('xianyu-detail-price').textContent = item.price;
    
    // 使用AI生成的描述或生成个性化描述
    let description = item.title;
    if (item.description) {
        description = item.description;
    } else {
        // 生成个性化的宝贝描述
        description += "\n\n宝贝描述：\n" + generateItemDescription(item);
    }
    document.getElementById('xianyu-detail-desc').textContent = description;
    
    // Image
    const imgContainer = document.getElementById('xianyu-detail-images');
    if (imgContainer) {
        imgContainer.innerHTML = `<img src="${item.img}" style="width: 100%; border-radius: 8px; margin-bottom: 10px;">`;
    }

    // User Info (Seller)
    let locationInfo = "刚刚来过 | 位置"; // 默认位置
    let sellerNameForId = "昵称"; // 用于显示闲鱼号
    
    if (item.seller) {
        // If item has specific seller info (e.g. from Bought list), use it
        document.getElementById('xianyu-detail-avatar').src = window.getSmartAvatar(item.seller);
        document.getElementById('xianyu-detail-username').textContent = item.seller;
        sellerNameForId = item.seller;
    } else if (currentCheckPhoneContactId) {
        // Otherwise (e.g. from Published/Sold list), use current contact as seller
        const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
        if (contact) {
            const avatar = contact.avatar || window.getSmartAvatar(contact.name);
            document.getElementById('xianyu-detail-avatar').src = avatar;
            
            // 使用AI生成的闲鱼昵称和位置信息
            let nickname = "昵称";
            if (contact.xianyuData && contact.xianyuData.profile) {
                if (contact.xianyuData.profile.nickname) {
                    nickname = contact.xianyuData.profile.nickname;
                }
                if (contact.xianyuData.profile.location) {
                    locationInfo = `刚刚来过 | ${contact.xianyuData.profile.location}`;
                }
            }
            document.getElementById('xianyu-detail-username').textContent = nickname;
            sellerNameForId = nickname;
        }
    }

    // 更新闲鱼号
    const idTextEl = document.getElementById('xianyu-detail-id-text');
    if (idTextEl) {
        idTextEl.textContent = `闲鱼号：${sellerNameForId}`;
    }
    
    // 更新位置信息
    const locationEl = document.getElementById('xianyu-detail-location');
    if (locationEl) {
        locationEl.textContent = locationInfo;
    }

    // Handle Sold Out state - 使用更精确的选择器
    let targetBottomBar = page.querySelector('div[style*="position: fixed"][style*="bottom: 0"]');
    
    // 备用选择器 - 如果第一个选择器失败，尝试其他方法
    if (!targetBottomBar) {
        // 尝试通过类名或其他属性查找
        targetBottomBar = page.querySelector('div[style*="position: fixed"]');
        console.log('使用备用选择器找到底部栏:', targetBottomBar);
    }
    
    console.log('闲鱼详情页底部栏元素:', targetBottomBar);
    console.log('商品信息:', item);

    if (targetBottomBar) {
        if (item.isSold) {
            targetBottomBar.innerHTML = `
                <div style="flex: 1;"></div>
                <button style="background: #e0e0e0; color: #999; border: none; padding: 10px 30px; border-radius: 20px; font-weight: bold; cursor: default;">卖掉了</button>
            `;
        } else if (item.isPublished) {
            targetBottomBar.innerHTML = `
                <div style="display: flex; gap: 20px; margin-left: 10px;">
                    <div style="display: flex; flex-direction: column; align-items: center; font-size: 10px; color: #666;">
                        <i class="far fa-star" style="font-size: 20px;"></i> 0
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; font-size: 10px; color: #666;">
                        <i class="far fa-eye" style="font-size: 20px;"></i> 35
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; font-size: 10px; color: #666;">
                        <i class="fas fa-user-slash" style="font-size: 20px;"></i> 无人在蹲
                    </div>
                </div>
                <button style="background: #f0f0f0; border: none; padding: 10px 30px; border-radius: 20px; font-weight: bold; color: #333;">管理</button>
            `;
        } else {
            // Restore default bottom bar
            targetBottomBar.innerHTML = `
                <div style="display: flex; gap: 20px; margin-left: 10px;">
                    <div style="display: flex; flex-direction: column; align-items: center; font-size: 10px; color: #666;">
                        <i class="far fa-star" style="font-size: 20px;"></i> 10
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; font-size: 10px; color: #666;">
                        <i class="far fa-eye" style="font-size: 20px;"></i> 156
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; font-size: 10px; color: #666;">
                        <i class="fas fa-user-slash" style="font-size: 20px;"></i> 无人在蹲
                    </div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button style="background: #FFDA44; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; color: #333;">聊一聊</button>
                    <button onclick="window.handleXianyuPurchase(window.currentXianyuDetailItem)" style="background: #FF3B30; border: none; padding: 10px 20px; border-radius: 20px; font-weight: bold; color: #fff;">立即购买</button>
                </div>
            `;
        }
    }

    page.classList.remove('hidden');
};

window.openXianyuFavorites = function() {
    const page = document.getElementById('xianyu-page-favorites');
    if (page) {
        page.classList.remove('hidden');
        renderXianyuFavoritesList();
    }
};

window.renderXianyuFavoritesList = function() {
    const list = document.getElementById('xianyu-favorites-list');
    if (!list) return;

    // 获取当前联系人的闲鱼数据
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
    let items = [];
    
    if (contact && contact.xianyuData && contact.xianyuData.favorites) {
        // 使用AI生成的数据
        items = contact.xianyuData.favorites.map(item => ({
            ...item,
            img: item.img || window.getSmartImage(item.title.substring(0, 6))
        }));
    } else {
        // 使用默认Mock数据
        items = [
            {
                title: "猫咪围巾",
                price: "38",
                seller: "Lucky",
                img: window.getSmartImage("围巾"),
                isSold: false
            },
            {
                title: "大衣",
                price: "1120",
                seller: "芒果",
                img: window.getSmartImage("大衣"),
                isSold: true,
                want: 2
            },
            {
                title: "徽章",
                price: "85",
                seller: "adam",
                img: window.getSmartImage("徽章"),
                isSold: true,
                want: 6
            },
            {
                title: "azone",
                price: "2999",
                seller: "天天开心",
                img: window.getSmartImage("娃娃"),
                isSold: true,
                want: 4
            },
            {
                title: "全新azone2代3代体 白肌手组a+b 一对",
                price: "120",
                seller: "小红",
                img: window.getSmartImage("配件"),
                isSold: true,
                want: 1
            },
            {
                title: "包邮 截单——",
                price: "999",
                seller: "小9",
                img: window.getSmartImage("套装"),
                isSold: false,
                want: 168
            }
        ];
    }

    let html = '';
    items.forEach(item => {
        let overlay = '';
        if (item.isSold) {
            overlay = `<div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); color: #fff; font-size: 12px; padding: 2px 6px; border-radius: 4px;">卖掉了</div>`;
        }

        let actionBtn = '';
        if (item.isSold) {
            actionBtn = `<div style="color: #999; font-size: 12px; display: flex; align-items: center;"><i class="fas fa-expand" style="margin-right: 4px;"></i> 找相似</div>`;
        } else {
            actionBtn = `
                <div style="display: flex; gap: 8px;" onclick="event.stopPropagation();">
                    <button style="border: 1px solid #ddd; background: #fff; padding: 4px 12px; border-radius: 14px; font-size: 12px;">聊一聊</button>
                    <button onclick="window.handleXianyuPurchase(${JSON.stringify(item).replace(/"/g, '&quot;')})" style="background: #FFDA44; border: none; padding: 4px 12px; border-radius: 14px; font-size: 12px; font-weight: bold;">立即购买</button>
                </div>
            `;
        }

        let infoLine = '';
        if (item.want) {
            infoLine = `<div style="font-size: 11px; color: #999; margin-top: 4px;">${item.want}人想要</div>`;
        }

        html += `
        <div onclick='openXianyuDetail(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="background: #fff; border-radius: 12px; padding: 15px; margin-bottom: 10px; display: flex; gap: 12px; cursor: pointer;">
            <div style="position: relative; width: 100px; height: 100px; flex-shrink: 0;">
                <img src="${item.img}" style="width: 100%; height: 100%; border-radius: 8px; object-fit: cover;" onerror="this.src=window.getSmartImage('${item.title}')">
                ${overlay}
            </div>
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="font-size: 15px; font-weight: 500; color: #000; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${item.isSold ? '<span style="color: #999;">[失效] </span>' : '<span style="background: #FF4400; color: #fff; font-size: 10px; padding: 0 2px; border-radius: 2px; margin-right: 4px;">包邮</span>'}${item.title}
                    </div>
                    <div style="font-size: 16px; font-weight: bold; color: #FF3B30; margin-top: 6px;">￥${item.price}</div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                        <img src="${window.getSmartAvatar(item.seller)}" style="width: 16px; height: 16px; border-radius: 50%;">
                        <span style="font-size: 11px; color: #666;">${item.seller}</span>
                        ${infoLine ? '' : ''}
                    </div>
                    ${actionBtn}
                </div>
                ${infoLine}
            </div>
        </div>
        `;
    });

    list.innerHTML = html;
};

window.openXianyuBought = function() {
    const page = document.getElementById('xianyu-page-bought');
    if (page) {
        page.classList.remove('hidden');
        renderXianyuBoughtList();
    }
};

window.renderXianyuBoughtList = function() {
    const list = document.getElementById('xianyu-bought-list');
    if (!list) return;

    // 获取当前联系人的闲鱼数据
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
    let items = [];
    
    if (contact && contact.xianyuData && contact.xianyuData.bought) {
        // 使用AI生成的数据
        items = contact.xianyuData.bought.map(item => {
            let actions = ["联系卖家"];
            if (item.status === "交易成功") {
                actions.push("去评价", "卖了换钱");
            } else if (item.status === "等待卖家发货") {
                actions.push("再次购买", "提醒发货");
            } else {
                actions.push("查看物流", "确认收货");
            }
            
            return {
                ...item,
                img: item.img || window.getSmartImage(item.title.substring(0, 6)),
                statusColor: "#FF6600",
                actions: actions,
                isSold: true
            };
        });
    } else {
        // 使用默认Mock数据
        items = [
            {
                seller: "TechGeek", sellerTag: "鱼小铺", status: "等待卖家发货", statusColor: "#FF6600",
                title: "Sony WH-1000XM5 无线降噪耳机 黑色", price: "1800",
                img: window.getSmartImage("耳机"),
                actions: ["联系卖家", "再次购买", "提醒发货"],
                isSold: true
            },
            {
                seller: "KeyboardFan", status: "交易成功", statusColor: "#FF6600",
                title: "PBT热升华键帽 机械键盘通用", price: "99",
                img: window.getSmartImage("键帽"),
                actions: ["联系卖家", "去评价", "卖了换钱"],
                isSold: true
            },
            {
                seller: "MoveOutSale", status: "等待见面交易", statusColor: "#FF6600",
                title: "宜家落地灯 九成新 自提", price: "50",
                img: window.getSmartImage("落地灯"),
                actions: ["联系卖家", "再次购买", "确认收货"],
                isSold: true
            },
            {
                seller: "ClosetClear", status: "等待买家收货", statusColor: "#FF6600",
                title: "优衣库纯棉T恤 白色 L码", price: "30",
                img: window.getSmartImage("T恤"),
                actions: ["联系卖家", "查看物流", "延长收货"],
                isSold: true
            }
        ];
    }

    let html = '';
    items.forEach(item => {
        let sellerTagHtml = item.sellerTag ? `<span style="background: #E0F0FF; color: #007AFF; font-size: 10px; padding: 1px 4px; border-radius: 4px; margin-left: 5px;">${item.sellerTag}</span>` : '';
        
        let actionsHtml = item.actions.map((action, idx) => {
            // Highlight the last action
            const isHighlight = idx === item.actions.length - 1;
            const style = isHighlight 
                ? "background: #fff; border: 1px solid #FFDA44; padding: 6px 14px; border-radius: 18px; font-size: 13px; color: #333; font-weight: bold; background-color: #FFDA44;"
                : "background: #fff; border: 1px solid #ccc; padding: 6px 14px; border-radius: 18px; font-size: 13px; color: #333;";
            return `<button style="${style}">${action}</button>`;
        }).join('');

        html += `
        <div onclick='openXianyuDetail(${JSON.stringify(item).replace(/'/g, "&#39;")})' style="background: #fff; border-radius: 12px; padding: 15px; margin-bottom: 10px; cursor: pointer;">
            <!-- Header -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div style="display: flex; align-items: center;">
                    <img src="${window.getSmartAvatar(item.seller)}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;">
                    <span style="font-weight: bold; font-size: 14px;">${item.seller}</span>
                    ${sellerTagHtml}
                    <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px; margin-left: 5px;"></i>
                </div>
                <span style="color: ${item.statusColor}; font-size: 14px;">${item.status}</span>
            </div>
            
            <!-- Content -->
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <img src="${item.img}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 2px 0;">
                    <div style="font-size: 15px; font-weight: bold; color: #000; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${item.title}</div>
                    <div style="text-align: right; color: #000; font-weight: bold; font-size: 14px;">￥${item.price}</div>
                </div>
            </div>
            
            <!-- Actions -->
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="color: #999; font-size: 12px;">更多</span>
                <div style="display: flex; gap: 8px;" onclick="event.stopPropagation();">
                    ${actionsHtml}
                </div>
            </div>
        </div>
        `;
    });

    list.innerHTML = html;
};

// --- 闲鱼AI生成功能 ---

async function generatePhoneXianyuAll(contact) {
    const btn = document.getElementById('generate-xianyu-btn');
    // 不再替换内容，只添加动画类
    if (btn) {
        btn.disabled = true;
        btn.classList.add('generating-pulse');
    }

    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: '暂无最近聊天记录可供参考。',
        userPersonaFallback: '未填写'
    });
    const worldBook = window.iphoneSimState.worldBook || '';

    const systemPrompt = `你是一个虚拟手机内容生成器。请为角色【${contact.name}】生成闲鱼应用的完整内容。

【角色设定】
联系人信息：${sharedContext.contactPersona || '无特殊设定'}
用户名称：${sharedContext.userName}
用户人设：${sharedContext.userPersonaText}
世界书背景：${worldBook}

【参考资料：最近微信聊天记录】
${sharedContext.recentChatContext}
(注意：此聊天记录仅用于判断用户是否提到过"想要"、"喜欢"某样物品。如果用户明确表达了想要某个东西，请让角色在闲鱼"我买到的"或"消息"中体现正在购买该物品作为礼物。除此之外，闲鱼的聊天内容绝不能与微信聊天内容相似或模仿，必须是完全独立的二手交易对话。)

【任务要求】
生成一个完整的闲鱼用户档案，包含以下内容：

1. **我发布的商品** (published) - 3-6个商品
   - 根据角色设定生成符合其身份的二手商品
   - 每个商品包含：标题、价格、描述、图片关键词、曝光数、浏览数、想要数
   - 价格要合理，符合二手市场行情
   - 价格字段请只返回纯数字，不要包含"￥"、"￥"或"元"等符号

2. **我卖出的商品** (sold) - 2-4个已售商品
   - 包含买家信息、交易状态、商品信息
   - 状态可以是：交易成功、等待买家评价等

3. **我买到的商品** (bought) - 2-5个购买记录
   - 包含卖家信息、交易状态、商品信息
   - 状态可以是：等待卖家发货、等待买家收货、交易成功等

4. **我收藏的商品** (favorites) - 4-8个收藏商品
   - 包含卖家信息、商品信息、价格、收藏状态
   - 部分商品可能已经卖掉了（isSold: true）
   - 包含想要人数等信息

5. **消息列表** (messages) - 5-8条聊天记录
   - 包含与买家/卖家的对话
   - 显示交易状态标签（等待买家收货、等待卖家发货、交易成功等）
   - 包含最近的聊天消息
   - 【重要】每条消息必须包含对应的商品信息（title, price）用于聊天页面显示
   - 【重要】每条消息必须包含详细的聊天记录数组（chatMessages）
   - 【重要】每条消息必须包含交易方向信息（isBuying: true表示${contact.name}是买家，false表示${contact.name}是卖家）
   - 【重要】每条聊天记录需要包含 "isRead" (boolean) 字段，表示对方是否已读（主要是针对我方发出的消息）。
   - 【重要】交易流程必须完整且符合逻辑：通常"已拍下"后面会紧跟"已付款"。
     - 如果是交易成功的状态，聊天记录应包含：咨询 -> 拍下(卡片) -> 付款(卡片) -> 发货(系统) -> 收货(系统/评价)。
     - 拍下消息示例："我已拍下，等待付款"
     - 付款消息示例："我已付款，等待你发货"

6. **用户信息** (profile)
   - 闲鱼昵称（有趣且符合角色特点）
   - 位置信息（随机生成中国城市）
   - 鱼力值、收藏数等统计数据

【重要规则】
- 【严禁】闲鱼聊天列表中的消息绝不能出现和用户在微信聊天上下文相似的对话。
- 【严禁】不要生成任何与"用户"、"玩家"、"你"相关的对话，只生成与其他NPC角色的对话。
- 仅当用户在微信聊天中明确表达想要某物时，才可以在闲鱼中生成购买该物品的记录（作为送给用户的礼物），除此之外，闲鱼内容必须与微信聊天完全隔离。
- 所有商品和对话都要符合角色设定和世界书背景
- 价格要现实合理，不要过高或过低
- 商品描述要生动有趣，体现闲鱼用户的特色
- 聊天消息要自然，包含买卖双方的真实对话
- 图片使用英文关键词格式，如："laptop computer|笔记本电脑"
- 每个消息条目必须包含完整的聊天记录，确保聊天页面内容与列表显示一致
- 在chatMessages中，使用"me"表示${contact.name}，"other"表示对话的另一方
- 付款相关的特殊消息需要标记：isPayment: true（我已拍下/我已付款），isShipping: true（发货相关）

【返回格式】
必须返回合法的JSON对象：
{
  "profile": {
    "nickname": "闲鱼昵称",
    "location": "城市名",
    "fishPower": 数字,
    "favorites": 数字,
    "views": 数字,
    "following": 数字,
    "coupons": 数字
  },
  "published": [
    {
      "title": "商品标题",
      "price": "价格",
      "description": "详细描述",
      "image": "image keyword|中文描述",
      "exposure": 曝光数,
      "views": 浏览数,
      "want": 想要数,
      "tag": "标签（可选）"
    }
  ],
  "sold": [
    {
      "buyer": "买家昵称",
      "status": "交易状态",
      "title": "商品标题",
      "price": "价格",
      "image": "image keyword|中文描述"
    }
  ],
  "bought": [
    {
      "seller": "卖家昵称",
      "status": "交易状态",
      "title": "商品标题",
      "price": "价格",
      "image": "image keyword|中文描述"
    }
  ],
  "favorites": [
    {
      "title": "商品标题",
      "price": "价格",
      "seller": "卖家昵称",
      "image": "image keyword|中文描述",
      "isSold": false,
      "want": 想要人数（可选）
    }
  ],
  "messages": [
    {
      "name": "对话者昵称",
      "tag": "交易状态标签（可选）",
      "message": "最新消息内容",
      "time": "时间描述",
      "image": "商品图片关键词|中文描述",
      "title": "对应商品标题",
      "price": "对应商品价格",
      "isBuying": false,
      "chatMessages": [
        {
          "type": "me|other|system",
          "content": "消息内容",
          "time": "时间",
          "isPayment": false,
          "isShipping": false,
          "isRead": true
        }
      ]
    }
  ]
}`;

    await callAiGeneration(contact, systemPrompt, 'xianyu_all', btn, null);
}


// --- 闲鱼聊天功能 ---

window.openXianyuChat = function(chatData) {
    const page = document.getElementById('xianyu-page-chat');
    if (!page) return;
    
    // 设置聊天对象信息
    document.getElementById('xianyu-chat-username').textContent = chatData.name;
    document.getElementById('xianyu-chat-status').textContent = chatData.tag || '在线';
    
    // 显示交易卡片（如果有商品信息）
    const tradeCard = document.getElementById('xianyu-chat-trade-card');
    if (chatData.img && chatData.title && chatData.price) {
        tradeCard.style.display = 'block';
        document.getElementById('xianyu-chat-trade-img').src = chatData.img;
        document.getElementById('xianyu-chat-trade-title').textContent = chatData.title || '商品标题';
        document.getElementById('xianyu-chat-trade-price').textContent = `￥${chatData.price || '0'}`;
        
        // 设置交易状态
        const statusEl = document.getElementById('xianyu-chat-trade-status');
        if (chatData.tag) {
            statusEl.textContent = chatData.tag;
            if (chatData.tag === '交易成功') {
                statusEl.style.background = '#E8F5E8';
                statusEl.style.color = '#00CC66';
            } else {
                statusEl.style.background = '#FFF5E0';
                statusEl.style.color = '#FF6600';
            }
        } else {
            statusEl.textContent = '商品咨询中';
        }
    } else {
        tradeCard.style.display = 'none';
    }
    
    // 生成聊天消息
    renderXianyuChatMessages(chatData);
    
    page.classList.remove('hidden');
};

function renderXianyuChatMessages(chatData) {
    const container = document.getElementById('xianyu-chat-messages');
    if (!container) return;
    
    // 优先使用AI生成的聊天记录
    let messages = [];
    
    if (chatData.chatMessages && Array.isArray(chatData.chatMessages) && chatData.chatMessages.length > 0) {
        // 使用AI生成的聊天记录
        messages = chatData.chatMessages;
    } else {
        // 根据交易状态生成默认的聊天内容
        if (chatData.tag === '等待买家收货') {
            messages = [
                { type: 'other', content: '你好，这个还在吗？', time: '昨天 14:32' },
                { type: 'me', content: '在的，成色如图，功能正常', time: '昨天 14:35', isRead: true },
                { type: 'other', content: '好的，我要了', time: '昨天 14:36' },
                { type: 'system', content: '我已拍下，等待付款', time: '昨天 14:36' },
                { type: 'me', content: '我已付款，等待你发货', time: '昨天 14:37', isPayment: true, isRead: true },
                { type: 'other', content: '好的，我今天就发货', time: '昨天 15:20' },
                { type: 'system', content: '卖家已发货', time: '今天 09:15' },
                { type: 'other', content: '请包装好商品，并按我在闲鱼上提供的地址发货', time: '今天 09:15', isShipping: true }
            ];
        } else if (chatData.tag === '等待卖家发货') {
            messages = [
                { type: 'me', content: '你好，请问这个商品还在吗？', time: '2小时前', isRead: true },
                { type: 'other', content: '在的，全新未拆封', time: '2小时前' },
                { type: 'me', content: '好的，我要了', time: '2小时前', isRead: true },
                { type: 'system', content: '我已拍下，等待付款', time: '2小时前' },
                { type: 'me', content: '我已付款，等待你发货', time: '2小时前', isPayment: true, isRead: false },
                { type: 'other', content: '好的，我明天寄出', time: '1小时前' }
            ];
        } else if (chatData.tag === '交易成功') {
            messages = [
                { type: 'other', content: '你好，这个多少钱？', time: '3天前' },
                { type: 'me', content: `${chatData.price || '100'}元，包邮`, time: '3天前', isRead: true },
                { type: 'other', content: '好的，我要了', time: '3天前' },
                { type: 'system', content: '交易成功', time: '2天前' },
                { type: 'other', content: '东西收到了，很喜欢！', time: '2天前' },
                { type: 'me', content: '好的，记得给个好评哦', time: '2天前', isRead: true }
            ];
        } else {
            // 普通咨询
            messages = [
                { type: 'other', content: '你好，请问这个还在吗？', time: '30分钟前' },
                { type: 'me', content: '在的，有什么问题可以问我', time: '25分钟前', isRead: true },
                { type: 'other', content: chatData.message || '还在吗？诚心要', time: '10分钟前' }
            ];
        }
    }
    
    let html = '';
    messages.forEach(msg => {
        const content = msg.content || "";
        
        // 逻辑：判断显示类型 (normal, system, card)
        let displayType = 'normal';
        
        // 强制显示为系统通知的类型
        if (content.includes("已发货") || content.includes("已确认收货") || content.includes("交易成功")) {
            displayType = 'system';
        } 
        // 强制显示为卡片的类型 (已拍下、已付款)
        else if (content.includes("已拍下") || content.includes("已付款") || msg.isPayment || msg.isShipping) {
            displayType = 'card';
        }
        // 如果没有特定关键词，但类型是system，则显示为系统
        else if (msg.type === 'system') {
            displayType = 'system';
        }

        if (displayType === 'system') {
            html += `
            <div style="text-align: center; margin: 15px 0;">
                <span style="background: #f0f0f0; color: #666; font-size: 12px; padding: 4px 8px; border-radius: 12px;">${content}</span>
                <div style="font-size: 10px; color: #999; margin-top: 2px;">${msg.time}</div>
            </div>`;
        } else if (displayType === 'card') {
            // 判断是"我"还是"对方"
            let isMe = false;
            if (msg.type === 'me') {
                isMe = true;
            } else if (msg.type === 'other') {
                isMe = false;
            } else {
                // 如果是 system 类型但被当作卡片显示 (如 AI 生成的 '买家已付款')
                if (chatData.isBuying) isMe = true; // 我是买家 -> 是我做的
                else isMe = false; // 我是卖家 -> 是对方做的
            }

            const cardColor = isMe ? '#FFDA44' : '#fff';
            const justifyContent = isMe ? 'flex-end' : 'flex-start';
            const borderStyle = isMe ? 'none' : '1px solid #eee';
            
            // 卡片标题和描述
            let cardTitle = "交易状态";
            let cardDesc = content;
            
            if (content.includes("已拍下")) {
                cardTitle = "已拍下";
                cardDesc = "等待付款";
            } else if (content.includes("已付款")) {
                cardTitle = "已付款";
                cardDesc = "等待发货";
            }

            // 状态显示 (仅当我方发送时显示已读/未读)
            let statusHtml = '';
            if (isMe) {
                const isRead = msg.isRead !== false; // 默认为已读
                const statusText = isRead ? '已读' : '未读';
                statusHtml = `
                    <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; margin-right: 5px; height: 100%;">
                        <div style="font-size: 10px; color: #999;">${statusText}</div>
                        <div style="font-size: 10px; color: #999;">${msg.time}</div>
                    </div>`;
            } else {
                statusHtml = `
                    <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; margin-left: 5px; height: 100%;">
                        <div style="font-size: 10px; color: #999;">${msg.time}</div>
                    </div>`;
            }

            // 布局：对方：[Avatar] [Bubble] [Time] | 我方：[Status+Time] [Bubble]
            if (!isMe) {
                html += `
                <div style="display: flex; justify-content: flex-start; margin: 10px 0; align-items: flex-end;">
                    <img src="${window.getSmartAvatar(chatData.name)}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">
                    <div style="background: ${cardColor}; border-radius: 12px; padding: 10px 14px; max-width: 85%; position: relative; border: ${borderStyle}; min-width: 240px;">
                        <div style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">${cardTitle}</div>
                        <div style="font-size: 12px; color: #333;">${cardDesc}</div>
                        <div style="border-top: 1px solid rgba(0,0,0,0.05); margin-top: 8px; padding-top: 8px; font-size: 12px; color: #666; display: flex; justify-content: space-between;">
                            <span>查看详情</span>
                            <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
                        </div>
                    </div>
                    ${statusHtml}
                </div>`;
            } else {
                html += `
                <div style="display: flex; justify-content: flex-end; margin: 10px 0; align-items: flex-end;">
                    ${statusHtml}
                    <div style="background: ${cardColor}; border-radius: 12px; padding: 10px 14px; max-width: 85%; position: relative; border: ${borderStyle}; min-width: 240px;">
                        <div style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">${cardTitle}</div>
                        <div style="font-size: 12px; color: #333;">${cardDesc}</div>
                        <div style="border-top: 1px solid rgba(0,0,0,0.05); margin-top: 8px; padding-top: 8px; font-size: 12px; color: #666; display: flex; justify-content: space-between;">
                            <span>查看详情</span>
                            <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
                        </div>
                    </div>
                </div>`;
            }

        } else {
            // 普通消息
            const isMe = msg.type === 'me';
            
            // 状态显示 (仅当我方发送时显示已读/未读)
            let statusHtml = '';
            if (isMe) {
                const isRead = msg.isRead !== false; // 默认为已读
                const statusText = isRead ? '已读' : '未读';
                statusHtml = `
                    <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; margin-right: 5px; height: 100%;">
                        <div style="font-size: 10px; color: #999;">${statusText}</div>
                        <div style="font-size: 10px; color: #999;">${msg.time}</div>
                    </div>`;
            } else {
                statusHtml = `
                    <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: flex-end; margin-left: 5px; height: 100%;">
                        <div style="font-size: 10px; color: #999;">${msg.time}</div>
                    </div>`;
            }

            if (!isMe) {
                html += `
                <div style="display: flex; justify-content: flex-start; margin: 10px 0; align-items: flex-end;">
                    <img src="${window.getSmartAvatar(chatData.name)}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 8px;">
                    <div style="background: #fff; border-radius: 12px; padding: 10px; max-width: 70%;">
                        <div style="font-size: 14px; line-height: 1.4;">${content}</div>
                    </div>
                    ${statusHtml}
                </div>`;
            } else {
                html += `
                <div style="display: flex; justify-content: flex-end; margin: 10px 0; align-items: flex-end;">
                    ${statusHtml}
                    <div style="background: #FFDA44; border-radius: 12px; padding: 10px; max-width: 70%;">
                        <div style="font-size: 14px; line-height: 1.4;">${content}</div>
                    </div>
                </div>`;
            }
        }
    });
    
    container.innerHTML = html;
    
    // 滚动到底部
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

// 修改消息列表点击事件，添加聊天功能
function enhanceXianyuMessagesList() {
    const messageItems = document.querySelectorAll('#xianyu-messages-list > div');
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
    
    messageItems.forEach((item, index) => {
        if (!item.onclick && !item.querySelector('.fa-bell-slash')) { // 不是官方消息
            item.style.cursor = 'pointer';
            item.onclick = function() {
                // 从消息项中提取信息
                const nameEl = item.querySelector('span[style*="font-weight: 700"]');
                const msgEl = item.querySelector('div[style*="font-size: 14px"][style*="color: #666"]');
                const imgEl = item.querySelector('img[style*="width: 48px"][style*="border-radius: 4px"]');
                const tagEl = item.querySelector('span[style*="margin-left: 6px"]');
                
                if (nameEl && msgEl) {
                    let chatData = {
                        name: nameEl.textContent,
                        message: msgEl.textContent,
                        img: imgEl ? imgEl.src : '',
                        tag: tagEl ? tagEl.textContent.replace(/.*\s/, '') : '',
                        title: '商品标题', // 默认值
                        price: '100' // 默认值
                    };
                    
                    // 尝试从AI生成的数据中获取完整的聊天信息
                    if (contact && contact.xianyuData && contact.xianyuData.messages) {
                        const messageData = contact.xianyuData.messages.find(msg =>
                            msg.name === chatData.name ||
                            msg.message === chatData.message
                        );
                        
                        if (messageData) {
                            chatData = {
                                ...chatData,
                                ...messageData,
                                // 确保有这些必要字段
                                title: messageData.title || chatData.title,
                                price: messageData.price || chatData.price,
                                img: messageData.img || chatData.img
                            };
                        }
                    }
                    
                    window.openXianyuChat(chatData);
                }
            };
        }
    });
}

let lastXianyuPaymentMeta = null;

function mapXianyuPaymentError(reason) {
    if (reason === 'wallet_insufficient') return '微信余额不足';
    if (reason === 'bank_cash_insufficient') return '银行卡余额不足';
    if (reason === 'family_card_insufficient') return '亲属卡额度不足';
    if (reason === 'cancelled') return '';
    return '支付失败，请稍后重试';
}

// 处理闲鱼购买逻辑
window.handleXianyuPurchase = function(item) {
    console.log('立即购买按钮被点击，商品信息:', item);
    if (!item) {
        console.error('商品信息为空');
        alert('商品信息错误');
        return;
    }
    
    // Check wallet - 初始化钱包并给予一些初始余额
    if (!window.iphoneSimState.wallet) {
        window.iphoneSimState.wallet = { balance: 5000, transactions: [] };
        console.log('初始化钱包，余额: ￥5000');
    }
    
    // Parse price (handle potential non-numeric characters just in case)
    const priceStr = item.price.toString().replace(/[^\d.]/g, '');
    const price = parseFloat(priceStr);
    
    console.log('商品价格:', price, '钱包余额:', window.iphoneSimState.wallet.balance);
    
    if (isNaN(price)) {
        console.error('价格解析失败:', item.price);
        alert('商品价格无效');
        return;
    }
    
    showXianyuPaymentModal(item, price);
};

function showXianyuPaymentModal(item, price) {
    console.log('显示支付模态框，商品:', item, '价格:', price);
    const modal = document.getElementById('xianyu-payment-modal');
    if (!modal) {
        console.error('找不到支付模态框元素');
        return;
    }
    
    // 确保模态框在body的根级别
    if (modal.parentNode !== document.body) {
        console.log('将模态框移动到body根级别');
        document.body.appendChild(modal);
    }
    
    const amountEl = document.getElementById('xianyu-payment-amount');
    const balanceEl = document.getElementById('xianyu-payment-balance');
    
    console.log('支付模态框元素检查:');
    console.log('- 模态框:', modal);
    console.log('- 金额元素:', amountEl);
    console.log('- 余额元素:', balanceEl);
    
    if (amountEl) amountEl.textContent = price.toFixed(2);
    if (balanceEl) balanceEl.textContent = `(￥${window.iphoneSimState.wallet.balance.toFixed(2)})`;
    
    const confirmBtn = document.getElementById('confirm-xianyu-payment-btn');
    const closeBtn = document.getElementById('close-xianyu-payment-btn');
    
    console.log('- 确认按钮:', confirmBtn);
    console.log('- 关闭按钮:', closeBtn);
    
    // Remove old listeners to prevent multiple bindings
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    
    newConfirmBtn.onclick = () => {
        handleXianyuPaymentConfirm(item, price);
    };
    
    newCloseBtn.onclick = () => {
        modal.classList.add('hidden');
    };
    
    console.log('准备显示支付模态框...');
    console.log('模态框当前类名:', modal.className);
    console.log('模态框当前样式:', modal.style.cssText);
    
    modal.classList.remove('hidden');
    
    console.log('移除hidden类后的类名:', modal.className);
    console.log('移除hidden类后的样式:', modal.style.cssText);
    
    // 强制显示模态框
    modal.style.display = 'flex';
    
    console.log('强制设置display:flex后的样式:', modal.style.cssText);
}

async function handleXianyuPaymentConfirm(item, price) {
    if (!window.resolvePurchasePayment) {
        alert('支付能力不可用');
        return;
    }

    const contact = currentCheckPhoneContactId
        ? window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId)
        : null;
    const recipientName = contact ? (contact.remark || contact.name || `联系人${currentCheckPhoneContactId}`) : '当前联系人';
    const payResult = await window.resolvePurchasePayment({
        amount: price,
        scene: 'xianyu_favorite',
        itemSummary: `闲鱼收藏代购(收货人: ${recipientName}): ${item.title || '商品'}`
    });
    if (!payResult || !payResult.ok) {
        const msg = mapXianyuPaymentError(payResult && payResult.reason);
        if (msg) alert(msg);
        return;
    }

    lastXianyuPaymentMeta = {
        paymentAmount: Number(price).toFixed(2),
        paymentMethodLabel: payResult.sourceLabel || (payResult.method === 'wallet' ? '微信余额' : (payResult.method === 'bank_cash' ? '银行卡余额' : '亲属卡')),
        recipientName
    };

    // Update item status to "Sold Out"
    if (currentCheckPhoneContactId) {
        const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
        if (contact && contact.xianyuData && contact.xianyuData.favorites) {
            const foundItem = contact.xianyuData.favorites.find(fav => 
                fav.title === item.title && 
                parseFloat(fav.price) === parseFloat(item.price)
            );
            
            if (foundItem) {
                foundItem.isSold = true;
                // Also update the current detail item object to reflect the change immediately if used elsewhere
                if (window.currentXianyuDetailItem) {
                    window.currentXianyuDetailItem.isSold = true;
                }
                
                // Refresh favorites list if it's open underneath
                const favoritesPage = document.getElementById('xianyu-page-favorites');
                if (favoritesPage && !favoritesPage.classList.contains('hidden')) {
                    renderXianyuFavoritesList();
                }
                
                // Update Detail Page UI if open
                const detailPage = document.getElementById('xianyu-page-detail');
                if (detailPage && !detailPage.classList.contains('hidden')) {
                    // Re-render detail page button area
                    // We can reuse openXianyuDetail but we need to pass the updated item
                    // Or just manually update the button for smoother experience
                    const bottomBar = detailPage.querySelector('div[style*="position: fixed"]');
                    if (bottomBar) {
                        bottomBar.innerHTML = `
                            <div style="flex: 1;"></div>
                            <button style="background: #e0e0e0; color: #999; border: none; padding: 10px 30px; border-radius: 20px; font-weight: bold; cursor: default;">卖掉了</button>
                        `;
                    }
                }
            }
        }
    }

    if (window.saveConfig) window.saveConfig();
    
    document.getElementById('xianyu-payment-modal').classList.add('hidden');
    
    // Show Success Modal
    showXianyuPurchaseSuccessModal(item);
}

function showXianyuPurchaseSuccessModal(item) {
    console.log('显示购买成功模态框，商品:', item);
    const modal = document.getElementById('xianyu-purchase-modal');
    if (!modal) {
        console.error('找不到购买成功模态框元素');
        return;
    }
    
    // 确保模态框在body的根级别
    if (modal.parentNode !== document.body) {
        console.log('将购买成功模态框移动到body根级别');
        document.body.appendChild(modal);
    }
    
    // Bind "Tell TA" button
    const tellBtn = document.getElementById('xianyu-tell-ta-btn');
    if (tellBtn) {
        tellBtn.onclick = () => {
            notifyContactAboutGift(item, lastXianyuPaymentMeta || {});
            modal.classList.add('hidden');
        };
    }
    
    // Bind Close button
    const closeBtn = document.getElementById('close-xianyu-purchase-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.classList.add('hidden');
        };
    }
    
    modal.classList.remove('hidden');
}

function notifyContactAboutGift(item, paymentMeta = {}) {
    console.log('告诉TA功能被调用，商品:', item, '联系人ID:', currentCheckPhoneContactId);
    if (!currentCheckPhoneContactId) {
        console.error('没有当前联系人ID');
        return;
    }
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
    if (!contact) {
        console.error('找不到联系人:', currentCheckPhoneContactId);
        return;
    }
    console.log('找到联系人:', contact.name);
    
    // Switch to WeChat Chat
    document.getElementById('phone-app').classList.add('hidden');
    document.getElementById('wechat-app').classList.remove('hidden');
    
    // Ensure "WeChat" tab is active in WeChat app
    const contactsTab = document.querySelector('.wechat-tab-item[data-tab="contacts"]');
    if (contactsTab) contactsTab.click();
    
    // Open specific chat
    if (window.openChat) {
        window.openChat(contact.id);
        
        // Send gift card message
        setTimeout(() => {
            const giftData = {
                title: item.title,
                price: item.price,
                recipientName: paymentMeta.recipientName || (contact.remark || contact.name),
                paymentAmount: paymentMeta.paymentAmount || item.price,
                paymentMethodLabel: paymentMeta.paymentMethodLabel || ''
            };
            // Send as 'gift_card' type
            if (window.sendMessage) {
                window.sendMessage(JSON.stringify(giftData), true, 'gift_card');
            }
        }, 500);
    }
}

// 导出函数供全局使用
window.generatePhoneXianyuAll = generatePhoneXianyuAll;
window.openXianyuChat = openXianyuChat;
window.enhanceXianyuMessagesList = enhanceXianyuMessagesList;
window.handleXianyuPurchase = handleXianyuPurchase;
window.notifyContactAboutGift = notifyContactAboutGift;
window.notifyContactAboutGift = notifyContactAboutGift;

const PHONE_NOTES_TEMPLATE_VERSION = 'ai-v4';
const PHONE_NOTES_SECTION_ORDER = ['pinned_notes', 'locked_notes', 'todo_lists', 'drafts', 'ramblings', 'deleted_notes'];
const PHONE_NOTES_SECTION_GROUPS = [
    ['pinned_notes', 'locked_notes', 'todo_lists'],
    ['drafts', 'ramblings'],
    ['deleted_notes']
];
const PHONE_NOTES_SECTION_META = {
    pinned_notes: {
        key: 'pinned_notes',
        cnTitle: '置顶便签',
        enTitle: 'PINNED NOTES',
        iconClass: 'icon-pinned',
        icon: 'ri-pushpin-2-fill',
        emptyText: '还没有置顶便签'
    },
    locked_notes: {
        key: 'locked_notes',
        cnTitle: '锁定笔记',
        enTitle: 'LOCKED',
        iconClass: 'icon-locked',
        icon: 'ri-lock-2-fill',
        emptyText: '还没有锁定笔记'
    },
    todo_lists: {
        key: 'todo_lists',
        cnTitle: '待办清单',
        enTitle: 'TO-DO LIST',
        iconClass: 'icon-todo',
        icon: 'ri-checkbox-circle-fill',
        emptyText: '还没有待办清单'
    },
    drafts: {
        key: 'drafts',
        cnTitle: '草稿',
        enTitle: 'DRAFTS',
        iconClass: 'icon-drafts',
        icon: 'ri-draft-fill',
        emptyText: '还没有草稿'
    },
    ramblings: {
        key: 'ramblings',
        cnTitle: '碎碎念',
        enTitle: 'RAMBLINGS',
        iconClass: 'icon-ramblings',
        icon: 'ri-bubble-chart-fill',
        emptyText: '还没有碎碎念'
    },
    deleted_notes: {
        key: 'deleted_notes',
        cnTitle: '已删除',
        enTitle: 'RECENTLY DELETED',
        iconClass: 'icon-deleted',
        icon: 'ri-delete-bin-7-fill',
        emptyText: '还没有已删除内容'
    }
};
const PHONE_NOTES_SECTION_AI_TYPE_MAP = {
    pinned_notes: 'notes_pinned',
    locked_notes: 'notes_locked',
    deleted_notes: 'notes_deleted',
    todo_lists: 'notes_todo',
    drafts: 'notes_drafts',
    ramblings: 'notes_ramblings'
};
const PHONE_NOTES_AI_TYPE_SECTION_MAP = Object.fromEntries(Object.entries(PHONE_NOTES_SECTION_AI_TYPE_MAP).map(([sectionKey, aiType]) => [aiType, sectionKey]));
const PHONE_NOTES_EXTRA_STYLE_TEXT = `
#detail-page.nav-sub-out {
    transform: translateX(-30%);
    opacity: 0;
}
#note-page {
    z-index: 3;
    transform: translateX(100%);
    background-color: #ffffff;
    box-shadow: -5px 0 15px rgba(0,0,0,0.05);
}
#detail-page {
    padding-top: 0;
}
#detail-page .detail-header {
    padding-top: calc(var(--safe-area-top) + 10px);
}
#note-page.nav-in {
    transform: translateX(0);
}
.header-actions {
    display: flex;
    align-items: center;
}
.notes-icon-btn {
    border: none;
    background: none;
    color: var(--accent);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
}
.notes-icon-btn i {
    font-size: 24px;
    pointer-events: none;
}
#note-page .detail-header {
    position: sticky;
    top: 0;
    z-index: 20;
    padding: 12px 14px 4px;
    background: transparent;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border-bottom: none;
}
#note-page .back-btn {
    width: 44px;
    height: 44px;
    justify-content: center;
    border-radius: 999px;
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(255,255,255,0.92);
    box-shadow: 0 12px 28px rgba(0,0,0,0.08);
    color: #202127;
    flex-shrink: 0;
}
#note-page .back-btn span {
    display: none;
}
#note-page .back-btn i {
    margin-right: 0;
    font-size: 24px;
}
#note-page .notes-generate-wrap {
    min-height: 44px;
    padding: 0 10px 0 14px;
    gap: 11px;
    border-radius: 999px;
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(255,255,255,0.92);
    box-shadow: 0 12px 28px rgba(0,0,0,0.08);
}
#note-page .note-page-share-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    color: #202127;
    pointer-events: none;
}
#note-page .note-page-share-ghost i {
    font-size: 22px;
}
#note-page .notes-note-generate-btn {
    width: 32px;
    height: 32px;
    color: #202127;
}
#note-page .notes-note-generate-btn i {
    font-size: 18px;
}
#note-page .notes-generate-menu {
    top: calc(100% + 10px);
    border-radius: 18px;
}
.notes-icon-btn:disabled {
    opacity: 0.5;
    cursor: default;
}
.notes-generate-wrap {
    position: relative;
    display: flex;
    align-items: center;
}
.notes-generate-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    min-width: 148px;
    background: rgba(255,255,255,0.96);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
    border: 1px solid rgba(60,60,67,0.1);
    border-radius: 12px;
    box-shadow: 0 12px 30px rgba(0,0,0,0.08);
    overflow: hidden;
    z-index: 30;
}
.notes-generate-menu.hidden {
    display: none;
}
.notes-generate-menu button {
    width: 100%;
    border: none;
    background: transparent;
    text-align: left;
    font-size: 14px;
    color: var(--text-main);
    padding: 12px 14px;
    cursor: pointer;
}
.notes-generate-menu button + button {
    border-top: 1px solid var(--divider);
}
.notes-generate-menu button:active {
    background: rgba(0,0,0,0.05);
}
.notes-search-empty {
    display: none;
    color: var(--text-secondary);
    font-size: 14px;
    padding: 0 20px 18px;
}
.notes-empty {
    background: var(--card-bg);
    border-radius: 12px;
    padding: 22px 18px;
    text-align: center;
    color: var(--text-secondary);
    font-size: 15px;
    line-height: 1.6;
}
.note-card {
    position: relative;
}
.note-card.has-corner-tags {
    padding-top: 16px;
}
.note-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}
.note-card-header .note-title {
    flex: 1;
    min-width: 0;
    margin-bottom: 0;
}
.note-card .note-preview {
    flex: 1;
    min-width: 0;
    font-size: 14px;
    line-height: 1.4;
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.note-preview-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
}
.note-inline-time {
    flex-shrink: 0;
    font-size: 12px;
    color: #aeaeb2;
}
.note-time {
    flex-shrink: 0;
    font-size: 12px;
    color: #aeaeb2;
}
.note-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 10px;
}
.note-card-tags {
    margin-top: 0;
    margin-left: 12px;
    max-width: 58%;
    justify-content: flex-end;
    flex-shrink: 0;
}
.note-card-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 10px;
    color: #aeaeb2;
    font-size: 12px;
}
.note-card-meta-right {
    text-align: right;
}
.note-tag {
    display: inline-flex;
    align-items: center;
    height: 24px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(208,163,49,0.12);
    color: var(--accent);
    font-size: 12px;
}
.note-card.is-locked {
    border: 1px solid rgba(118,118,128,0.12);
}
.note-card.is-locked .note-title::before {
    content: '🔒 ';
}
.todo-progress {
    margin-top: 10px;
    color: #aeaeb2;
    font-size: 12px;
}
.note-page-body {
    padding: 18px 20px 40px;
}
.note-detail-card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}
.note-detail-title {
    font-size: 28px;
    line-height: 1.15;
    font-weight: 700;
    letter-spacing: -0.4px;
    margin-bottom: 12px;
}
.note-detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    color: var(--text-secondary);
    font-size: 13px;
    margin-bottom: 14px;
}
.note-detail-content {
    font-size: 16px;
    line-height: 1.72;
    white-space: pre-wrap;
    color: var(--text-main);
}
.todo-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.todo-item {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 28px;
}
.todo-check {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1.5px solid rgba(60,60,67,0.18);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: transparent;
    flex-shrink: 0;
}
.todo-item.done .todo-check {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
}
.todo-item.done .todo-text {
    color: var(--text-secondary);
    text-decoration: line-through;
}
.rambling-chip {
    display: inline-flex;
    align-items: center;
    height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 12px;
    color: var(--accent);
    background: rgba(142,197,252,0.18);
}
.locked-placeholder {
    border-radius: 16px;
    padding: 36px 18px;
    text-align: center;
    background: linear-gradient(180deg, rgba(118,118,128,0.08), rgba(208,163,49,0.08));
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}
.locked-placeholder i {
    font-size: 36px;
    color: var(--accent);
}
.note-detail-hint {
    color: var(--text-secondary);
    font-size: 14px;
    line-height: 1.6;
}
#note-page .note-page-body {
    position: relative;
    padding: 18px 28px 150px;
}
#note-page .note-detail-card {
    background: transparent;
    border-radius: 0;
    padding: 8px 0 0;
    box-shadow: none;
}
#note-page .note-detail-title {
    font-size: 34px;
    line-height: 1.08;
    letter-spacing: -0.8px;
    margin-bottom: 14px;
    color: #35363d;
}
#note-page .note-detail-meta {
    gap: 6px 10px;
    font-size: 12px;
    color: #b8b8be;
    margin-bottom: 18px;
}
#note-page .note-detail-content,
#note-page .note-detail-hint,
#note-page .todo-text {
    font-size: 18px;
    line-height: 1.68;
    color: #4d4e56;
}
#note-page .todo-list {
    gap: 16px;
}
#note-page .todo-item {
    align-items: flex-start;
    gap: 14px;
}
#note-page .todo-check {
    width: 26px;
    height: 26px;
    margin-top: 2px;
}
#note-page .locked-placeholder {
    padding: 34px 22px;
    background: #f7f7fa;
    border: 1px solid rgba(60,60,67,0.08);
    box-shadow: none;
}
#note-page .note-secondary-block {
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid rgba(60,60,67,0.08);
}
#note-page .note-page-toolbar {
    position: absolute;
    left: 24px;
    bottom: 24px;
    display: inline-flex;
    align-items: center;
    gap: 24px;
    height: 54px;
    padding: 0 24px;
    border-radius: 999px;
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(255,255,255,0.92);
    box-shadow: 0 14px 32px rgba(0,0,0,0.08);
    pointer-events: none;
    z-index: 12;
}
#note-page .note-page-toolbar i {
    font-size: 23px;
    color: #17181c;
}
#note-page .note-page-compose-ghost {
    position: absolute;
    right: 24px;
    bottom: 24px;
    width: 54px;
    height: 54px;
    border-radius: 999px;
    background: rgba(255,255,255,0.94);
    border: 1px solid rgba(255,255,255,0.92);
    box-shadow: 0 14px 32px rgba(0,0,0,0.08);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 12;
}
#note-page .note-page-compose-ghost i {
    font-size: 23px;
    color: #17181c;
}
#notes-lock-modal {
    position: absolute;
    inset: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
}
#notes-lock-modal.hidden {
    display: none;
}
.notes-lock-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(12, 12, 18, 0.18);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
}
.notes-lock-card {
    position: relative;
    width: 100%;
    max-width: 360px;
    padding: 24px 22px 20px;
    border-radius: 26px;
    background: rgba(255,255,255,0.96);
    border: 1px solid rgba(255,255,255,0.92);
    box-shadow: 0 24px 60px rgba(0,0,0,0.14);
}
.notes-lock-badge {
    width: 48px;
    height: 48px;
    border-radius: 16px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(102,126,234,0.16), rgba(118,75,162,0.16));
    color: #6f63d8;
    margin-bottom: 14px;
}
.notes-lock-badge i {
    font-size: 24px;
}
.notes-lock-title {
    font-size: 24px;
    line-height: 1.15;
    font-weight: 700;
    color: #2b2c34;
    letter-spacing: -0.4px;
}
.notes-lock-note-title {
    margin-top: 6px;
    color: #8f8f97;
    font-size: 13px;
}
.notes-lock-question {
    margin-top: 18px;
    padding: 16px 16px 15px;
    border-radius: 18px;
    background: rgba(118,118,128,0.08);
    color: #44454d;
    font-size: 16px;
    line-height: 1.6;
}
.notes-lock-input {
    width: 100%;
    height: 48px;
    margin-top: 16px;
    border: 1px solid rgba(60,60,67,0.12);
    border-radius: 16px;
    background: #fff;
    padding: 0 16px;
    outline: none;
    font-size: 16px;
    color: #2b2c34;
}
.notes-lock-input:focus {
    border-color: rgba(208,163,49,0.45);
    box-shadow: 0 0 0 4px rgba(208,163,49,0.12);
}
.notes-lock-helper {
    margin-top: 10px;
    color: #9a9aa1;
    font-size: 12px;
    line-height: 1.5;
}
.notes-lock-error {
    margin-top: 10px;
    min-height: 20px;
    color: #d24a43;
    font-size: 13px;
    line-height: 1.5;
}
.notes-lock-tip {
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: 14px;
    background: rgba(208,163,49,0.12);
    color: #8d641d;
    font-size: 13px;
    line-height: 1.5;
}
.notes-lock-reveal {
    margin-top: 10px;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(111,99,216,0.08);
    color: #554aa8;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.6;
}
.notes-lock-force {
    margin-top: 12px;
    padding: 14px;
    border-radius: 18px;
    background: rgba(60,60,67,0.06);
}
.notes-lock-force-text {
    color: #44454d;
    font-size: 13px;
    line-height: 1.5;
}
.notes-lock-force-actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;
}
.notes-lock-mini-btn {
    flex: 1;
    height: 38px;
    border: none;
    border-radius: 12px;
    background: rgba(118,118,128,0.12);
    color: #4d4e56;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
}
.notes-lock-mini-btn.is-primary {
    background: rgba(208,163,49,0.14);
    color: #8b6419;
}
.notes-lock-actions {
    display: flex;
    gap: 10px;
    margin-top: 18px;
}
.notes-lock-btn {
    flex: 1;
    height: 44px;
    border: none;
    border-radius: 16px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
}
.notes-lock-btn.is-secondary {
    background: rgba(118,118,128,0.1);
    color: #4d4e56;
}
.notes-lock-btn.is-primary {
    background: var(--accent);
    color: #fff;
}
.note-secondary-block {
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid var(--divider);
}
.note-secondary-label {
    color: var(--text-secondary);
    font-size: 12px;
    margin-bottom: 8px;
    letter-spacing: 0.4px;
    text-transform: uppercase;
}
.phone-notes-hidden {
    display: none !important;
}
`;

function buildPhoneNotesFolderGroupsHtml() {
    return PHONE_NOTES_SECTION_GROUPS.map(group => `
        <div class="folder-group">
            ${group.map(sectionKey => {
                const meta = PHONE_NOTES_SECTION_META[sectionKey];
                return `
                <div class="folder-item" data-section-key="${meta.key}">
                    <div class="folder-icon ${meta.iconClass}"><i class="${meta.icon}"></i></div>
                    <div class="folder-info">
                        <div class="folder-name">${meta.cnTitle}</div>
                        <div class="folder-en">${meta.enTitle}</div>
                    </div>
                    <div class="folder-count" data-role="folder-count">0</div>
                    <i class="ri-arrow-right-s-line folder-arrow"></i>
                </div>`;
            }).join('')}
        </div>
    `).join('');
}

const PHONE_NOTES_APP_TEMPLATE_HTML = `<div id="app">
    <div id="main-page" class="page active">
        <div class="glass-blob"></div>
        <header>
            <div>
                <div class="header-title">备忘录</div>
                <div class="header-subtitle">iCloud Notes</div>
            </div>
            <div class="header-actions">
                <button type="button" class="notes-icon-btn notes-main-generate-btn" aria-label="生成备忘录">
                    <i class="ri-more-fill"></i>
                </button>
            </div>
        </header>
        <div class="search-container">
            <div class="search-bar">
                <i class="ri-search-line"></i>
                <input type="text" id="phone-notes-search" placeholder="搜索 / Search">
            </div>
        </div>
        <div class="notes-search-empty" id="phone-notes-search-empty">没有匹配的分区</div>
        ${buildPhoneNotesFolderGroupsHtml()}
    </div>
    <div id="detail-page" class="page">
        <div class="detail-header">
            <div class="back-btn" data-action="back-to-main">
                <i class="ri-arrow-left-s-line"></i>
                <span>文件夹</span>
            </div>
            <div class="notes-generate-wrap">
                <button type="button" class="notes-icon-btn notes-section-generate-btn" aria-label="生成当前分区">
                    <i class="ri-more-fill"></i>
                </button>
                <div class="notes-generate-menu hidden" data-role="section-generate-menu">
                    <button type="button" data-mode="replace">覆盖当前分区</button>
                    <button type="button" data-mode="merge">新增合并</button>
                </div>
            </div>
        </div>
        <div class="detail-title" id="dt-title">文件夹</div>
        <div class="detail-subtitle" id="dt-subtitle">FOLDER</div>
        <div class="notes-list" id="notes-container"></div>
    </div>
    <div id="note-page" class="page">
        <div class="detail-header">
            <div class="back-btn" data-action="back-to-section">
                <i class="ri-arrow-left-s-line"></i>
                <span>列表</span>
            </div>
            <div class="notes-generate-wrap">
                <span class="note-page-share-ghost" aria-hidden="true"><i class="ri-upload-2-line"></i></span>
                <button type="button" class="notes-icon-btn notes-note-generate-btn" aria-label="生成当前分区">
                    <i class="ri-more-fill"></i>
                </button>
                <div class="notes-generate-menu hidden" data-role="note-generate-menu">
                    <button type="button" data-mode="replace">覆盖当前分区</button>
                    <button type="button" data-mode="merge">新增合并</button>
                </div>
            </div>
        </div>
        <div class="note-page-body" id="note-detail-container"></div>
        <div class="note-page-toolbar" aria-hidden="true">
            <i class="ri-list-check-2"></i>
            <i class="ri-attachment-line"></i>
            <i class="ri-mark-pen-line"></i>
        </div>
        <div class="note-page-compose-ghost" aria-hidden="true">
            <i class="ri-edit-box-line"></i>
        </div>
    </div>
    <div id="notes-lock-modal" class="hidden" aria-hidden="true">
        <div class="notes-lock-backdrop" data-action="close-lock-modal"></div>
        <div class="notes-lock-card" role="dialog" aria-modal="true" aria-labelledby="notes-lock-title">
            <div class="notes-lock-badge"><i class="ri-question-answer-line"></i></div>
            <div class="notes-lock-title" id="notes-lock-title">回答问题</div>
            <div class="notes-lock-note-title" id="notes-lock-note-title"></div>
            <div class="notes-lock-question" id="notes-lock-question"></div>
            <input type="text" id="notes-lock-answer-input" class="notes-lock-input" placeholder="输入答案" autocomplete="off" spellcheck="false">
            <div class="notes-lock-helper">答案会比较短，通常是日期、称呼、地点或一个名词。</div>
            <div class="notes-lock-error" id="notes-lock-error"></div>
            <div class="notes-lock-tip phone-notes-hidden" id="notes-lock-tip"></div>
            <div class="notes-lock-reveal phone-notes-hidden" id="notes-lock-reveal"></div>
            <div class="notes-lock-force phone-notes-hidden" id="notes-lock-force">
                <div class="notes-lock-force-text">已连续输错 5 次，是否强制进入？</div>
                <div class="notes-lock-force-actions">
                    <button type="button" class="notes-lock-mini-btn" data-action="decline-force-enter">再试试</button>
                    <button type="button" class="notes-lock-mini-btn is-primary" data-action="force-enter-note">是，强制进入</button>
                </div>
            </div>
            <div class="notes-lock-actions">
                <button type="button" class="notes-lock-btn is-secondary" data-action="close-lock-modal">取消</button>
                <button type="button" class="notes-lock-btn is-primary" data-action="submit-lock-answer">查看内容</button>
            </div>
        </div>
    </div>
</div>`;

const PHONE_NOTES_PROMPT_TEMPLATES = {
    COMMON_CONTEXT: ({ contact, userName, userPersona, recentChatContext }) => `你是一个虚拟手机内容生成器。你要为角色【${contact.name}】生成“备忘录 App”里的私人内容。

【角色设定】
姓名：${contact.name}
人设：${contact.persona || '无'}

【用户信息】
用户名称：${userName}
用户人设：${userPersona || '未填写'}

【与用户最近聊天上下文】
${recentChatContext || '暂无最近聊天记录'}

【生成目标】
你生成的是“手机备忘录里的私人痕迹”，不是聊天记录，不是日记平台，也不是小说。
内容要像真实人会写下来的零碎内容：提醒、半句情绪、待办、备忘、删掉的东西、没写完的草稿、上锁标题。

【风格要求】
1. 要自然、克制、像真人会写的，不要写成文艺小说。
2. 允许出现“她 / 他 / 那位 / 对象 / 你”这类模糊指代，但不要每条都围绕用户展开。
3. 约 30%—40% 的内容可以和用户最近关系状态有关，比如：
   - 吵架后想说的话
   - 想哄对方的提醒
   - 因为用户取消别的安排
   - 准备见面 / 礼物 / 解释
   - 情绪波动后的自我备忘
4. 其余内容必须是角色自己的真实生活碎片，比如工作、日程、购物、习惯、情绪、灵感、随手记录。
5. 不要直接复制最近聊天原句，要自然改写成“备忘录语气”。
6. 不要生成违法、暴力、极端、露骨内容。
7. 内容可以带一点暧昧和隐私感，但要像日常痕迹，不要像悬疑推理证据。`,
    notes_all: ({ COMMON_CONTEXT, contact }) => `${COMMON_CONTEXT}

【任务】
请为【${contact.name}】生成一套完整的“备忘录 App”内容，包含以下 6 个分区：

1. pinned_notes（置顶便签）2-4 条
2. locked_notes（锁定笔记）1-3 条
3. deleted_notes（已删除）2-4 条
4. todo_lists（待办清单）2-4 条
5. drafts（草稿）2-3 条
6. ramblings（碎碎念）6-10 条

【必须出现的张力点】
1. 至少 1 条“没发出去的话”出现在 drafts 里
   - 要像本来想发给某个人，但最后没有发
   - 语气可以犹豫、嘴硬、委屈、想解释、想和好
   - 可以写一半戛然而止

2. 至少 1 条“删掉又恢复感很强”的清单出现在 deleted_notes 或 todo_lists 里
   - 例如“别忘了道歉 / 记得解释 / 见面前准备 / 不要再提那件事”
   - 可以有部分已完成、部分未完成

3. 至少 1 条“看标题就很想点开”的 locked_notes
   - 标题要克制但有意味，比如：
     - “不要再翻出来看”
     - “这次别搞砸”
     - “如果还是想她”
     - “见面前”
     - “别在情绪上头的时候发出去”
   - 不要写得太悬疑或太夸张

【额外氛围要求】
- 让人一眼看过去觉得“没有明确越界内容，但能感觉到这个人最近心里有事”
- 不要生成明确出轨、违法、极端反转
- 要多写“模糊但有意味”的内容，比如：
  - 一句没发出去的话
  - 一个不想再看的标题
  - 一个删了又像是后悔的清单
  - 一个看起来只是日常提醒、但能读出关系状态的条目

【内容要求】
- 置顶便签更偏日常、重要事项、近期反复提醒
- 锁定笔记更偏情绪、秘密、不能公开的想法，并且每条都要附带一个解锁问题和标准答案
- lock_answer 必须简短，优先使用日期、地点、昵称、称呼、学校名、餐厅名这类短答案，不要写成长句
- 已删除内容更像一时冲动写下后又删掉的东西
- 待办清单要有真实执行感，包含勾选状态
- 草稿要明显带“没写完 / 不敢发 / 想发又删”的感觉
- 碎碎念要短、碎、像突然记下的一句想法，带一点生活和情绪余温

【写作细节】
1. 标题长度尽量控制在 3-16 字
2. preview 要像列表里看到的一小段摘要
3. content 可以比 preview 更完整，但仍然要像备忘录，不是长篇文章
4. 时间要真实，像：
   - “今天 09:12”
   - “昨天 23:48”
   - “周二 18:05”
   - “3月28日 01:14”
5. 可以适度使用：
   - 短句
   - 换行
   - 简短列表
   - 半句话
   - 省略号
6. 不要每条都苦情，要混合：
   - 普通生活
   - 情绪波动
   - 关系线索
   - 实用提醒

【返回格式】
必须返回纯 JSON，不要 Markdown，不要解释，不要代码块。

JSON 结构如下：
{
  "pinned_notes": [
    {
      "title": "标题",
      "preview": "列表摘要",
      "content": "正文",
      "updated_at": "今天 09:12",
      "tags": ["生活", "提醒"],
      "related_to_user": true
    }
  ],
  "locked_notes": [
    {
      "title": "标题",
      "preview": "列表摘要",
      "content": "正文",
      "updated_at": "昨天 23:48",
      "is_locked": true,
      "lock_hint": "回答问题",
      "lock_question": "问题",
      "lock_answer": "3月18日",
      "tags": ["私密", "情绪"],
      "related_to_user": true
    }
  ],
  "deleted_notes": [
    {
      "title": "标题",
      "preview": "列表摘要",
      "content": "正文",
      "updated_at": "周二 18:05",
      "deleted_at": "周二 18:30",
      "tags": ["已删"],
      "related_to_user": false
    }
  ],
  "todo_lists": [
    {
      "title": "标题",
      "preview": "列表摘要",
      "updated_at": "今天 11:26",
      "items": [
        { "text": "条目内容", "done": true },
        { "text": "条目内容", "done": false }
      ],
      "tags": ["待办"],
      "related_to_user": true
    }
  ],
  "drafts": [
    {
      "title": "标题",
      "preview": "列表摘要",
      "content": "正文",
      "updated_at": "昨天 01:07",
      "is_draft": true,
      "unfinished": true,
      "tags": ["草稿"],
      "related_to_user": true
    }
  ],
  "ramblings": [
    {
      "title": "标题",
      "content": "正文",
      "time": "今天 22:11",
      "related_to_user": true
    }
  ]
}`,
    notes_pinned: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成【置顶便签 pinned_notes】2-4 条。

【要求】
1. 置顶便签是角色最近最常看、最重要、最想提醒自己的内容。
2. 大部分偏生活和现实事务，例如：
   - 日程安排
   - 工作提醒
   - 购物 / 证件 / 出行
   - 情绪提醒
3. 可以有 1 条和用户有关，但不要全都是感情内容。
4. 语气要像“自己给自己看的备忘”，不是发给别人看的。

【返回格式】
返回纯 JSON 数组：
[
  {
    "title": "标题",
    "preview": "列表摘要",
    "content": "正文",
    "updated_at": "今天 09:12",
    "tags": ["生活", "提醒"],
    "related_to_user": false
  }
]`,
    notes_locked: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成【锁定笔记 locked_notes】1-3 条。

【要求】
1. 锁定笔记必须有“标题就有味道”的感觉，但不能过度戏剧化。
2. 内容更偏：
   - 不能公开的情绪
   - 不想被人看到的想法
   - 关于用户但不想明说的内容
   - 反复告诫自己的话
3. 至少 1 条与用户有关，但要克制、自然。
4. 可以写得更碎片化、更私人。
5. 不要写成长篇日记。
6. 每条都要同时生成一个用于解锁的问题和标准答案。
7. lock_answer 必须是短答案，适合日期、地点、昵称、称呼、学校名、餐厅名这类 2-8 个字左右的内容，不要写成长句。
8. 问题要自然，像这个人真的会拿来锁住这条笔记，而不是谜语或脑筋急转弯。

【返回格式】
返回纯 JSON 数组：
[
  {
    "title": "标题",
    "preview": "列表摘要",
    "content": "正文",
    "updated_at": "昨天 23:48",
    "is_locked": true,
    "lock_hint": "回答问题",
    "lock_question": "问题",
    "lock_answer": "乌冬面",
    "tags": ["私密", "情绪"],
    "related_to_user": true
  }
]`,
    notes_deleted: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成【已删除 deleted_notes】2-4 条。

【要求】
1. 已删除内容要有“冲动写下又删掉”的感觉。
2. 常见类型：
   - 没想好要不要说的话
   - 一时情绪上头写下的句子
   - 删掉的购物/准备清单
   - 临时记下又不想留痕迹的标题
3. 至少 1 条要让人感觉“和用户最近关系状态有关”。
4. 允许有一点嘴硬、委屈、后悔、拉扯感。
5. 不要写得太明显像“证据”，要像真实人会删掉的东西。

【返回格式】
返回纯 JSON 数组：
[
  {
    "title": "标题",
    "preview": "列表摘要",
    "content": "正文",
    "updated_at": "周二 18:05",
    "deleted_at": "周二 18:30",
    "tags": ["已删"],
    "related_to_user": true
  }
]`,
    notes_todo: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成【待办清单 todo_lists】2-4 条。

【要求】
1. 每条清单都要有 4-8 个事项，done 状态混合。
2. 要像真实生活待办，不要全是情绪化内容。
3. 至少 1 条清单和用户有关，例如：
   - 见面前准备
   - 记得解释
   - 不要再提某件事
   - 买东西 / 改签 / 安排时间
4. 至少 1 条清单完全和用户无关，偏日常生活。
5. 清单要有“执行痕迹感”，例如已经勾掉一半。

【返回格式】
返回纯 JSON 数组：
[
  {
    "title": "标题",
    "preview": "列表摘要",
    "updated_at": "今天 11:26",
    "items": [
      { "text": "条目内容", "done": true },
      { "text": "条目内容", "done": false }
    ],
    "tags": ["待办"],
    "related_to_user": true
  }
]`,
    notes_drafts: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成【草稿 drafts】2-3 条。

【要求】
1. 草稿必须有“本来想发出去，但最后没发”的感觉。
2. 至少 1 条草稿明显和用户有关。
3. 草稿内容可以：
   - 解释但没发出去
   - 嘴硬的话写到一半
   - 想和好但拉不下脸
   - 想问但最后删掉
   - 想发提醒又觉得没必要
4. 至少 1 条草稿要有“没写完”的感觉，停在一句中间或结尾省略。
5. 不要把草稿写成正式信件，要像手机里临时打下来的文本。

【返回格式】
返回纯 JSON 数组：
[
  {
    "title": "标题",
    "preview": "列表摘要",
    "content": "正文",
    "updated_at": "昨天 01:07",
    "is_draft": true,
    "unfinished": true,
    "tags": ["草稿"],
    "related_to_user": true
  }
]`,
    notes_ramblings: ({ COMMON_CONTEXT }) => `${COMMON_CONTEXT}

【任务】
只生成【碎碎念 ramblings】6-10 条。0

【要求】
1. 每条都要短、碎、像临时记在手机里的念头，不要写成长篇。
2. 内容可以是：
   - 一闪而过的情绪
   - 生活里很小的观察
   - 说不出口的话只留半句
   - 突然记下来的感受
   - 看似日常但隐约能看出关系状态的痕迹
3. 至少 2 条和用户有关，但不要全部围绕用户。
4. 气质要像“没有明确越界内容，但能感觉到最近心里有事”。
5. 不要写得太戏剧化，不要明确出轨、违法、极端反转。

【返回格式】
返回纯 JSON 数组：
[
  {
    "title": "标题",
    "content": "正文",
    "time": "今天 22:11",
    "related_to_user": true
  }
]`
};

function createEmptyPhoneNotesData() {
    return {
        pinned_notes: [],
        locked_notes: [],
        deleted_notes: [],
        todo_lists: [],
        drafts: [],
        ramblings: []
    };
}

function phoneNotesEscapeHtml(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function phoneNotesNormalizeText(value, fallback = '') {
    if (value == null) return fallback;
    const text = String(value).trim();
    return text || fallback;
}

function phoneNotesNormalizeTags(value, fallback = []) {
    if (!Array.isArray(value)) return [...fallback];
    return value.map(tag => phoneNotesNormalizeText(tag)).filter(Boolean).slice(0, 6);
}

function phoneNotesNormalizeBoolean(value, fallback = false) {
    return typeof value === 'boolean' ? value : fallback;
}

function phoneNotesNormalizeListItems(items) {
    if (!Array.isArray(items)) return [];
    return items.map(item => ({
        text: phoneNotesNormalizeText(item && item.text, '未命名事项'),
        done: !!(item && item.done)
    })).filter(item => item.text);
}

function phoneNotesBuildPreviewFromContent(content) {
    return phoneNotesNormalizeText(content).replace(/\s+/g, ' ').trim();
}

function phoneNotesBuildTodoPreview(items) {
    return items.slice(0, 2).map(item => `${item.done ? '✓' : '○'} ${item.text}`).join('  ·  ');
}

function phoneNotesDefaultTitle(sectionKey, index) {
    const meta = PHONE_NOTES_SECTION_META[sectionKey] || { cnTitle: '笔记' };
    return `${meta.cnTitle} ${index + 1}`;
}

function normalizePhoneNotesEntry(sectionKey, item, index) {
    const source = item && typeof item === 'object' ? item : {};
    const title = phoneNotesNormalizeText(source.title, phoneNotesDefaultTitle(sectionKey, index));
    const relatedToUser = phoneNotesNormalizeBoolean(source.related_to_user, false);

    if (sectionKey === 'todo_lists') {
        const items = phoneNotesNormalizeListItems(source.items);
        return {
            title,
            preview: phoneNotesNormalizeText(source.preview, phoneNotesBuildTodoPreview(items)),
            updated_at: phoneNotesNormalizeText(source.updated_at, '今天 09:12'),
            items,
            tags: phoneNotesNormalizeTags(source.tags, ['待办']),
            related_to_user: relatedToUser
        };
    }

    if (sectionKey === 'ramblings') {
        const content = phoneNotesNormalizeText(source.content, source.preview || '记下了一点没说出口的心事。');
        return {
            title,
            content,
            time: phoneNotesNormalizeText(source.time || source.updated_at, '今天 22:11'),
            mood: phoneNotesNormalizeText(source.mood, ''),
            related_to_user: relatedToUser
        };
    }

    const content = phoneNotesNormalizeText(source.content, source.preview || '');
    const preview = phoneNotesNormalizeText(source.preview, phoneNotesBuildPreviewFromContent(content).slice(0, 80));
    const updatedAt = phoneNotesNormalizeText(source.updated_at || source.time, '今天 09:12');
    const base = {
        title,
        preview,
        content,
        updated_at: updatedAt,
        tags: phoneNotesNormalizeTags(source.tags),
        related_to_user: relatedToUser
    };

    if (sectionKey === 'locked_notes') {
        return {
            ...base,
            is_locked: true,
            lock_hint: phoneNotesNormalizeText(source.lock_hint, '回答问题'),
            lock_question: phoneNotesNormalizeText(source.lock_question || source.unlock_question || source.question, ''),
            lock_answer: phoneNotesNormalizeText(source.lock_answer || source.unlock_answer || source.answer, '')
        };
    }

    if (sectionKey === 'deleted_notes') {
        return {
            ...base,
            deleted_at: phoneNotesNormalizeText(source.deleted_at, '刚刚删除')
        };
    }

    if (sectionKey === 'drafts') {
        return {
            ...base,
            is_draft: true,
            unfinished: phoneNotesNormalizeBoolean(source.unfinished, true)
        };
    }

    return base;
}

function normalizePhoneNotesData(raw) {
    const source = raw && typeof raw === 'object' ? raw : {};
    const normalized = createEmptyPhoneNotesData();
    PHONE_NOTES_SECTION_ORDER.forEach(sectionKey => {
        const list = Array.isArray(source[sectionKey]) ? source[sectionKey] : [];
        normalized[sectionKey] = list.map((item, index) => normalizePhoneNotesEntry(sectionKey, item, index));
    });
    return normalized;
}

function normalizePhoneNotesAiPayload(type, raw) {
    if (type === 'notes_all') {
        if (raw && typeof raw === 'object' && raw.notesData && typeof raw.notesData === 'object') {
            return normalizePhoneNotesData(raw.notesData);
        }
        return normalizePhoneNotesData(raw);
    }
    const sectionKey = PHONE_NOTES_AI_TYPE_SECTION_MAP[type];
    if (!sectionKey) return raw;
    let payload = raw;
    if (!Array.isArray(payload) && payload && typeof payload === 'object') {
        if (Array.isArray(payload[sectionKey])) {
            payload = payload[sectionKey];
        } else {
            const firstArrayKey = Object.keys(payload).find(key => Array.isArray(payload[key]));
            if (firstArrayKey) payload = payload[firstArrayKey];
        }
    }
    if (!Array.isArray(payload)) return [];
    return payload.map((item, index) => normalizePhoneNotesEntry(sectionKey, item, index));
}

function getPhoneNotesSectionKeyByAiType(type) {
    return PHONE_NOTES_AI_TYPE_SECTION_MAP[type] || null;
}

function getPhoneNotesAiTypeBySectionKey(sectionKey) {
    return PHONE_NOTES_SECTION_AI_TYPE_MAP[sectionKey] || null;
}

function getPhoneNotesContactById(contactId) {
    const state = window.iphoneSimState || {};
    const contacts = Array.isArray(state.contacts) ? state.contacts : [];
    return contacts.find(contact => contact.id === contactId) || null;
}

function getActivePhoneNotesContact() {
    return currentCheckPhoneContactId ? getPhoneNotesContactById(currentCheckPhoneContactId) : null;
}

function getPhoneNotesStoreBucket(contactId) {
    const state = window.iphoneSimState || {};
    if (!state.phoneContent) state.phoneContent = {};
    if (!state.phoneContent[contactId]) state.phoneContent[contactId] = {};
    return state.phoneContent[contactId];
}

function getPhoneNotesData(contactId) {
    if (!contactId) return createEmptyPhoneNotesData();
    const bucket = getPhoneNotesStoreBucket(contactId);
    bucket.notesData = normalizePhoneNotesData(bucket.notesData);
    return bucket.notesData;
}

function setPhoneNotesData(contactId, notesData) {
    const bucket = getPhoneNotesStoreBucket(contactId);
    bucket.notesData = normalizePhoneNotesData(notesData);
    return bucket.notesData;
}

function buildPhoneNotesSystemPrompt(contact, type) {
    const sharedContext = buildPhoneSharedPromptContext(contact, {
        recentChatFallback: '暂无最近聊天记录',
        userPersonaFallback: '未填写'
    });
    const recentChatContext = sharedContext.recentChatContext;
    const userName = phoneNotesNormalizeText(sharedContext.userName, '用户');
    const userPersona = phoneNotesNormalizeText(sharedContext.userPersona, '');
    const COMMON_CONTEXT = PHONE_NOTES_PROMPT_TEMPLATES.COMMON_CONTEXT({
        contact,
        userName,
        userPersona,
        recentChatContext
    });
    const builder = PHONE_NOTES_PROMPT_TEMPLATES[type] || PHONE_NOTES_PROMPT_TEMPLATES.notes_all;
    return builder({ COMMON_CONTEXT, contact, userName, userPersona, recentChatContext });
}

function phoneNotesGetRuntime(container) {
    if (!container.__phoneNotesRuntime) {
        container.__phoneNotesRuntime = {
            currentView: 'main',
            currentSectionKey: null,
            currentNoteIndex: null,
            searchTerm: '',
            unlockedNoteKey: null,
            unlockModalSectionKey: null,
            unlockModalNoteIndex: null,
            unlockFailedCount: 0,
            unlockDirectEntryEnabled: false
        };
    }
    return container.__phoneNotesRuntime;
}

function phoneNotesBuildRuntimeNoteKey(sectionKey, noteIndex) {
    return `${sectionKey}::${noteIndex}`;
}

function phoneNotesNormalizeLockAnswer(value) {
    const text = phoneNotesNormalizeText(value, '');
    if (!text) return '';
    return text.normalize('NFKC').replace(/\s+/g, '').toLowerCase();
}

function phoneNotesHasLockChallenge(note) {
    return !!(note && phoneNotesNormalizeText(note.lock_question, '') && phoneNotesNormalizeText(note.lock_answer, ''));
}

function phoneNotesGetLockHintText(note) {
    if (!note) return '';
    const customHint = phoneNotesNormalizeText(note.lock_hint, '');
    const questionText = phoneNotesNormalizeText(note.lock_question, '');
    const answerText = phoneNotesNormalizeText(note.lock_answer, '');
    if (customHint && customHint !== '回答问题' && customHint !== questionText && customHint !== answerText) {
        return `提示：${customHint}`;
    }
    const answerLength = Array.from(answerText.replace(/\s+/g, '')).length;
    if (answerLength > 0) {
        return `提示：答案一共 ${answerLength} 个字。`;
    }
    return '提示：换个更具体的细节再试试。';
}

function phoneNotesSetLockPrimaryButton(container, directEnterEnabled) {
    const primaryButton = container.querySelector('[data-action="submit-lock-answer"]');
    if (!primaryButton) return;
    primaryButton.textContent = directEnterEnabled ? '直接进入' : '查看内容';
}

function phoneNotesResetLockModalState(container) {
    const runtime = phoneNotesGetRuntime(container);
    const input = container.querySelector('#notes-lock-answer-input');
    const error = container.querySelector('#notes-lock-error');
    const tip = container.querySelector('#notes-lock-tip');
    const reveal = container.querySelector('#notes-lock-reveal');
    const forcePanel = container.querySelector('#notes-lock-force');

    runtime.unlockFailedCount = 0;
    runtime.unlockDirectEntryEnabled = false;

    if (input) {
        input.disabled = false;
        input.value = '';
        input.placeholder = '输入答案';
    }
    if (error) error.textContent = '';
    if (tip) {
        tip.textContent = '';
        tip.classList.add('phone-notes-hidden');
    }
    if (reveal) {
        reveal.textContent = '';
        reveal.classList.add('phone-notes-hidden');
    }
    if (forcePanel) {
        forcePanel.classList.add('phone-notes-hidden');
    }
    phoneNotesSetLockPrimaryButton(container, false);
}

function phoneNotesEnableDirectEntry(container, note) {
    const runtime = phoneNotesGetRuntime(container);
    const input = container.querySelector('#notes-lock-answer-input');
    const error = container.querySelector('#notes-lock-error');
    const reveal = container.querySelector('#notes-lock-reveal');
    const forcePanel = container.querySelector('#notes-lock-force');

    runtime.unlockDirectEntryEnabled = true;

    if (error) error.textContent = '';
    if (forcePanel) {
        forcePanel.classList.add('phone-notes-hidden');
    }
    if (reveal) {
        reveal.textContent = `正确答案：${phoneNotesNormalizeText(note && note.lock_answer, '')}`;
        reveal.classList.remove('phone-notes-hidden');
    }
    if (input) {
        input.disabled = true;
        input.value = phoneNotesNormalizeText(note && note.lock_answer, '');
        input.placeholder = '已显示正确答案';
    }
    phoneNotesSetLockPrimaryButton(container, true);
}

function phoneNotesUnlockCurrentNote(container, sectionKey, noteIndex) {
    const runtime = phoneNotesGetRuntime(container);
    runtime.unlockedNoteKey = phoneNotesBuildRuntimeNoteKey(sectionKey, noteIndex);
    phoneNotesCloseLockModal(container);
    phoneNotesRenderNoteDetail(container, sectionKey, noteIndex);
    phoneNotesShowNotePage(container);
}

function phoneNotesCloseLockModal(container) {
    const runtime = phoneNotesGetRuntime(container);
    const modal = container.querySelector('#notes-lock-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
    }
    phoneNotesResetLockModalState(container);
    runtime.unlockModalSectionKey = null;
    runtime.unlockModalNoteIndex = null;
}

function phoneNotesOpenLockModal(container, noteIndex) {
    const runtime = phoneNotesGetRuntime(container);
    const sectionKey = runtime.currentSectionKey;
    const contact = getActivePhoneNotesContact();
    const notes = getPhoneNotesData(contact && contact.id)[sectionKey] || [];
    const note = notes[noteIndex];
    if (!note) return;

    if (!phoneNotesHasLockChallenge(note)) {
        runtime.unlockedNoteKey = phoneNotesBuildRuntimeNoteKey(sectionKey, noteIndex);
        phoneNotesRenderNoteDetail(container, sectionKey, noteIndex);
        phoneNotesShowNotePage(container);
        return;
    }

    const modal = container.querySelector('#notes-lock-modal');
    const title = container.querySelector('#notes-lock-title');
    const noteTitle = container.querySelector('#notes-lock-note-title');
    const question = container.querySelector('#notes-lock-question');
    const input = container.querySelector('#notes-lock-answer-input');
    const error = container.querySelector('#notes-lock-error');
    if (!modal || !noteTitle || !question || !input || !error) return;

    runtime.unlockModalSectionKey = sectionKey;
    runtime.unlockModalNoteIndex = noteIndex;
    phoneNotesResetLockModalState(container);
    if (title) {
        title.textContent = phoneNotesNormalizeText(note.lock_hint, '回答问题');
    }
    noteTitle.textContent = note.title || '锁定笔记';
    question.textContent = note.lock_question;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
        if (!input.disabled) input.focus();
    }, 0);
}

function phoneNotesSubmitLockAnswer(container) {
    const runtime = phoneNotesGetRuntime(container);
    const sectionKey = runtime.unlockModalSectionKey;
    const noteIndex = runtime.unlockModalNoteIndex;
    const contact = getActivePhoneNotesContact();
    const input = container.querySelector('#notes-lock-answer-input');
    const error = container.querySelector('#notes-lock-error');
    const tip = container.querySelector('#notes-lock-tip');
    const forcePanel = container.querySelector('#notes-lock-force');
    if (!sectionKey || noteIndex == null || !input || !error) return;

    const note = (getPhoneNotesData(contact && contact.id)[sectionKey] || [])[noteIndex];
    if (!note) {
        phoneNotesCloseLockModal(container);
        return;
    }

    if (runtime.unlockDirectEntryEnabled) {
        phoneNotesUnlockCurrentNote(container, sectionKey, noteIndex);
        return;
    }

    const typedAnswer = phoneNotesNormalizeLockAnswer(input.value);
    const expectedAnswer = phoneNotesNormalizeLockAnswer(note.lock_answer);
    if (!typedAnswer) {
        error.textContent = '先输入答案。';
        input.focus();
        return;
    }

    if (!expectedAnswer || typedAnswer !== expectedAnswer) {
        runtime.unlockFailedCount = Number(runtime.unlockFailedCount || 0) + 1;
        error.textContent = '答案不对，再想想。';

        if (runtime.unlockFailedCount >= 3 && tip) {
            tip.textContent = phoneNotesGetLockHintText(note);
            tip.classList.remove('phone-notes-hidden');
        }

        if (runtime.unlockFailedCount >= 5 && forcePanel) {
            forcePanel.classList.remove('phone-notes-hidden');
        }

        input.focus();
        input.select();
        return;
    }

    phoneNotesUnlockCurrentNote(container, sectionKey, noteIndex);
}

function phoneNotesResolveSectionKey(primaryValue, secondaryValue) {
    const candidates = [primaryValue, secondaryValue].filter(Boolean).map(value => String(value).trim());
    for (const candidate of candidates) {
        if (PHONE_NOTES_SECTION_META[candidate]) return candidate;
        const matched = PHONE_NOTES_SECTION_ORDER.find(sectionKey => {
            const meta = PHONE_NOTES_SECTION_META[sectionKey];
            return meta.cnTitle === candidate || meta.enTitle === candidate || meta.enTitle.toLowerCase() === candidate.toLowerCase();
        });
        if (matched) return matched;
    }
    return 'pinned_notes';
}

function phoneNotesGetDisplayTime(sectionKey, note) {
    if (sectionKey === 'ramblings') return phoneNotesNormalizeText(note.time, '刚刚');
    return phoneNotesNormalizeText(note.updated_at, '刚刚');
}

function phoneNotesBuildTagHtml(tags, extraClass = '') {
    if (!Array.isArray(tags) || !tags.length) return '';
    const className = extraClass ? `note-tags ${extraClass}` : 'note-tags';
    return `<div class="${className}">${tags.map(tag => `<span class="note-tag">${phoneNotesEscapeHtml(tag)}</span>`).join('')}</div>`;
}

function phoneNotesBuildTodoProgress(items) {
    const total = Array.isArray(items) ? items.length : 0;
    const completed = Array.isArray(items) ? items.filter(item => item.done).length : 0;
    return { completed, total };
}

function phoneNotesBuildListCardHtml(sectionKey, note) {
    const time = phoneNotesGetDisplayTime(sectionKey, note);
    const cardTagsHtml = sectionKey === 'ramblings'
        ? ''
        : phoneNotesBuildTagHtml(note.tags, 'note-card-tags');

    if (sectionKey === 'todo_lists') {
        return `
            <div class="note-card-header">
                <div class="note-title">${phoneNotesEscapeHtml(note.title)}</div>
                ${cardTagsHtml}
            </div>
            <div class="note-preview-row">
                <span class="note-inline-time">${phoneNotesEscapeHtml(time)}</span>
                <div class="note-preview">${phoneNotesEscapeHtml(note.preview || '待办清单')}</div>
            </div>
        `;
    }

    if (sectionKey === 'ramblings') {
        return `
            <div class="note-card-header">
                <div class="note-title">${phoneNotesEscapeHtml(note.title)}</div>
                ${cardTagsHtml}
            </div>
            <div class="note-preview-row">
                <span class="note-inline-time">${phoneNotesEscapeHtml(time)}</span>
                <div class="note-preview">${phoneNotesEscapeHtml(phoneNotesBuildPreviewFromContent(note.content).slice(0, 90))}</div>
            </div>
        `;
    }

    return `
        <div class="note-card-header">
            <div class="note-title">${phoneNotesEscapeHtml(note.title)}</div>
            ${cardTagsHtml}
        </div>
        <div class="note-preview-row">
            <span class="note-inline-time">${phoneNotesEscapeHtml(time)}</span>
            <div class="note-preview">${phoneNotesEscapeHtml(note.preview || '未填写内容')}</div>
        </div>
    `;
}
function phoneNotesRenderMainPage(container, contactId) {
    const runtime = phoneNotesGetRuntime(container);
    const notesData = getPhoneNotesData(contactId);
    const searchTerm = phoneNotesNormalizeText(runtime.searchTerm).toLowerCase();
    const items = Array.from(container.querySelectorAll('.folder-item[data-section-key]'));
    const groups = Array.from(container.querySelectorAll('.folder-group'));
    let visibleCount = 0;

    items.forEach(item => {
        const sectionKey = item.dataset.sectionKey;
        const meta = PHONE_NOTES_SECTION_META[sectionKey];
        const countEl = item.querySelector('[data-role="folder-count"]');
        if (countEl) countEl.textContent = String((notesData[sectionKey] || []).length);
        const matched = !searchTerm || meta.cnTitle.toLowerCase().includes(searchTerm) || meta.enTitle.toLowerCase().includes(searchTerm);
        item.classList.toggle('phone-notes-hidden', !matched);
        if (matched) visibleCount += 1;
    });

    groups.forEach(group => {
        const hasVisibleChild = Array.from(group.querySelectorAll('.folder-item[data-section-key]')).some(item => !item.classList.contains('phone-notes-hidden'));
        group.classList.toggle('phone-notes-hidden', !hasVisibleChild);
    });

    const emptyEl = container.querySelector('#phone-notes-search-empty');
    if (emptyEl) {
        emptyEl.style.display = searchTerm && visibleCount === 0 ? 'block' : 'none';
    }
}

function phoneNotesHideMenus(container) {
    container.querySelectorAll('.notes-generate-menu').forEach(menu => menu.classList.add('hidden'));
}

function phoneNotesToggleMenu(container, menuRole) {
    const targetMenu = container.querySelector(`[data-role="${menuRole}"]`);
    if (!targetMenu) return;
    const shouldShow = targetMenu.classList.contains('hidden');
    phoneNotesHideMenus(container);
    if (shouldShow) targetMenu.classList.remove('hidden');
}

function phoneNotesShowMainPage(container) {
    const runtime = phoneNotesGetRuntime(container);
    const mainPage = container.querySelector('#main-page');
    const detailPage = container.querySelector('#detail-page');
    const notePage = container.querySelector('#note-page');
    if (mainPage) mainPage.classList.remove('nav-out');
    if (detailPage) {
        detailPage.classList.remove('nav-in');
        detailPage.classList.remove('nav-sub-out');
    }
    if (notePage) notePage.classList.remove('nav-in');
    runtime.currentView = 'main';
    runtime.currentNoteIndex = null;
    runtime.unlockedNoteKey = null;
    phoneNotesCloseLockModal(container);
    phoneNotesHideMenus(container);
}

function phoneNotesShowSectionPage(container) {
    const runtime = phoneNotesGetRuntime(container);
    const mainPage = container.querySelector('#main-page');
    const detailPage = container.querySelector('#detail-page');
    const notePage = container.querySelector('#note-page');
    if (mainPage) mainPage.classList.add('nav-out');
    if (detailPage) {
        detailPage.classList.add('nav-in');
        detailPage.classList.remove('nav-sub-out');
        detailPage.scrollTop = 0;
    }
    if (notePage) notePage.classList.remove('nav-in');
    runtime.currentView = 'section';
    runtime.currentNoteIndex = null;
    runtime.unlockedNoteKey = null;
    phoneNotesCloseLockModal(container);
    phoneNotesHideMenus(container);
}

function phoneNotesShowNotePage(container) {
    const runtime = phoneNotesGetRuntime(container);
    const detailPage = container.querySelector('#detail-page');
    const notePage = container.querySelector('#note-page');
    if (detailPage) detailPage.classList.add('nav-sub-out');
    if (notePage) {
        notePage.classList.add('nav-in');
        notePage.scrollTop = 0;
    }
    runtime.currentView = 'note';
    phoneNotesHideMenus(container);
}

function phoneNotesRenderEmptyState(container, sectionKey) {
    const notesContainer = container.querySelector('#notes-container');
    const meta = PHONE_NOTES_SECTION_META[sectionKey];
    if (!notesContainer) return;
    notesContainer.innerHTML = `<div class="notes-empty">${phoneNotesEscapeHtml(meta.emptyText)}<br>点击右上角按钮试试生成。</div>`;
}

function renderPhoneNotesV1FolderDetail(container, enTitle, cnTitle) {
    if (!container) return;
    const sectionKey = phoneNotesResolveSectionKey(enTitle, cnTitle);
    const meta = PHONE_NOTES_SECTION_META[sectionKey];
    const runtime = phoneNotesGetRuntime(container);
    const notesContainer = container.querySelector('#notes-container');
    const dtTitle = container.querySelector('#dt-title');
    const dtSubtitle = container.querySelector('#dt-subtitle');
    const contact = getActivePhoneNotesContact();
    const notesData = getPhoneNotesData(contact && contact.id);
    const notes = notesData[sectionKey] || [];

    runtime.currentSectionKey = sectionKey;
    runtime.currentNoteIndex = null;

    if (dtTitle) dtTitle.textContent = meta.cnTitle;
    if (dtSubtitle) dtSubtitle.textContent = meta.enTitle;
    const noteBackLabel = container.querySelector('[data-action="back-to-section"] span');
    if (noteBackLabel) noteBackLabel.textContent = meta.cnTitle;

    if (!notesContainer) return;
    if (!notes.length) {
        phoneNotesRenderEmptyState(container, sectionKey);
        return;
    }

    notesContainer.innerHTML = '';
    notes.forEach((note, index) => {
        const card = document.createElement('div');
        const hasCornerTags = Array.isArray(note.tags) && note.tags.length;
        card.className = `note-card${sectionKey === 'locked_notes' ? ' is-locked' : ''}${hasCornerTags ? ' has-corner-tags' : ''}`;
        card.dataset.noteIndex = String(index);
        card.style.animation = `slideUp 0.4s ease forwards ${index * 0.04}s`;
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.innerHTML = phoneNotesBuildListCardHtml(sectionKey, note);
        notesContainer.appendChild(card);
    });
}

function phoneNotesBuildDetailMeta(sectionKey, note) {
    const metaBits = [];
    metaBits.push(`<span>${phoneNotesEscapeHtml(phoneNotesGetDisplayTime(sectionKey, note))}</span>`);
    if (sectionKey === 'deleted_notes' && note.deleted_at) metaBits.push(`<span>删除于 ${phoneNotesEscapeHtml(note.deleted_at)}</span>`);
    return metaBits.join('');
}

function phoneNotesRenderNoteDetail(container, sectionKey, noteIndex) {
    const runtime = phoneNotesGetRuntime(container);
    const contact = getActivePhoneNotesContact();
    const notesData = getPhoneNotesData(contact && contact.id);
    const notes = notesData[sectionKey] || [];
    const note = notes[noteIndex];
    const detailContainer = container.querySelector('#note-detail-container');
    if (!detailContainer || !note) return;

    runtime.currentSectionKey = sectionKey;
    runtime.currentNoteIndex = noteIndex;
    const isUnlockedLockedNote = sectionKey === 'locked_notes' && runtime.unlockedNoteKey === phoneNotesBuildRuntimeNoteKey(sectionKey, noteIndex);
    let bodyHtml = '';

    if (sectionKey === 'locked_notes') {
        bodyHtml = isUnlockedLockedNote || !phoneNotesHasLockChallenge(note)
            ? `<div class="note-detail-content">${phoneNotesEscapeHtml(note.content || note.preview || '')}</div>`
            : `
                <div class="locked-placeholder">
                    <i class="ri-lock-fill"></i>
                    <div class="note-title">这条笔记已锁定</div>
                    <div class="note-detail-hint">请先回答问题，再查看完整内容。</div>
                </div>
            `;
    } else if (sectionKey === 'todo_lists') {
        bodyHtml = `
            <div class="todo-list">
                ${(note.items || []).map(item => `
                    <div class="todo-item${item.done ? ' done' : ''}">
                        <span class="todo-check"><i class="ri-check-line"></i></span>
                        <span class="todo-text">${phoneNotesEscapeHtml(item.text)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    } else if (sectionKey === 'ramblings') {
        bodyHtml = `<div class="note-detail-content">${phoneNotesEscapeHtml(note.content)}</div>`;
    } else {
        bodyHtml = `<div class="note-detail-content">${phoneNotesEscapeHtml(note.content || note.preview || '')}</div>`;
    }

    detailContainer.innerHTML = `
        <div class="note-detail-card">
            <div class="note-detail-title">${phoneNotesEscapeHtml(note.title)}</div>
            <div class="note-detail-meta">${phoneNotesBuildDetailMeta(sectionKey, note)}</div>
            ${bodyHtml}
        </div>
    `;
}

function phoneNotesOpenSection(container, sectionKey) {
    renderPhoneNotesV1FolderDetail(container, sectionKey, sectionKey);
    phoneNotesShowSectionPage(container);
}

function phoneNotesOpenNote(container, noteIndex) {
    const runtime = phoneNotesGetRuntime(container);
    if (!runtime.currentSectionKey && runtime.currentSectionKey !== '') return;
    if (runtime.currentSectionKey === 'locked_notes') {
        runtime.unlockedNoteKey = null;
        phoneNotesOpenLockModal(container, noteIndex);
        return;
    }
    runtime.unlockedNoteKey = null;
    phoneNotesRenderNoteDetail(container, runtime.currentSectionKey, noteIndex);
    phoneNotesShowNotePage(container);
}

function refreshPhoneNotesApp(contactId, options = {}) {
    const container = document.getElementById('phone-notes-content');
    if (!container) return;
    const runtime = phoneNotesGetRuntime(container);
    phoneNotesRenderMainPage(container, contactId);
    if (currentCheckPhoneContactId !== contactId) return;

    if (options.scope === 'section' && options.sectionKey) {
        runtime.currentSectionKey = options.sectionKey;
        runtime.currentNoteIndex = null;
        renderPhoneNotesV1FolderDetail(container, options.sectionKey, options.sectionKey);
        phoneNotesShowSectionPage(container);
        return;
    }

    runtime.currentSectionKey = null;
    runtime.currentNoteIndex = null;
    phoneNotesShowMainPage(container);
}

window.refreshPhoneNotesApp = refreshPhoneNotesApp;

async function generatePhoneNotesAll(contact, btn) {
    if (!contact || !btn) return;
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('generating-pulse');
    window.__phoneNotesGenerationContext = {
        contactId: contact.id,
        scope: 'all'
    };
    const systemPrompt = buildPhoneNotesSystemPrompt(contact, 'notes_all');
    await callAiGeneration(contact, systemPrompt, 'notes_all', btn, originalContent);
}

async function generatePhoneNotesSection(contact, sectionKey, mode, btn, fromNoteDetail = false) {
    if (!contact || !sectionKey || !btn) return;
    const aiType = getPhoneNotesAiTypeBySectionKey(sectionKey);
    if (!aiType) return;
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('generating-pulse');
    window.__phoneNotesGenerationContext = {
        contactId: contact.id,
        scope: 'section',
        sectionKey,
        mode: mode === 'merge' ? 'merge' : 'replace',
        fromNoteDetail: !!fromNoteDetail
    };
    const systemPrompt = buildPhoneNotesSystemPrompt(contact, aiType);
    await callAiGeneration(contact, systemPrompt, aiType, btn, originalContent);
}

function bindPhoneNotesV1Interactions(container) {
    if (!container || container.dataset.notesAiBound === 'true') return;

    const screen = document.getElementById('phone-notes');
    const runtime = phoneNotesGetRuntime(container);
    const searchInput = container.querySelector('#phone-notes-search');

    const closeScreen = () => {
        phoneNotesHideMenus(container);
        phoneNotesCloseLockModal(container);
        if (screen) screen.classList.add('hidden');
    };

    container.addEventListener('click', event => {
        const target = event.target;
        if (!target.closest('.notes-generate-wrap')) {
            phoneNotesHideMenus(container);
        }

        const titleBtn = target.closest('.header-title');
        if (titleBtn) {
            event.preventDefault();
            closeScreen();
            return;
        }

        const mainGenerateBtn = target.closest('.notes-main-generate-btn');
        if (mainGenerateBtn) {
            event.preventDefault();
            const contact = getActivePhoneNotesContact();
            if (!contact) {
                alert('请先选择联系人');
                return;
            }
            generatePhoneNotesAll(contact, mainGenerateBtn);
            return;
        }

        const sectionGenerateBtn = target.closest('.notes-section-generate-btn');
        if (sectionGenerateBtn) {
            event.preventDefault();
            event.stopPropagation();
            phoneNotesToggleMenu(container, 'section-generate-menu');
            return;
        }

        const noteGenerateBtn = target.closest('.notes-note-generate-btn');
        if (noteGenerateBtn) {
            event.preventDefault();
            event.stopPropagation();
            phoneNotesToggleMenu(container, 'note-generate-menu');
            return;
        }

        const menuAction = target.closest('.notes-generate-menu [data-mode]');
        if (menuAction) {
            event.preventDefault();
            event.stopPropagation();
            const contact = getActivePhoneNotesContact();
            if (!contact) {
                alert('请先选择联系人');
                return;
            }
            const mode = menuAction.dataset.mode;
            const menu = menuAction.closest('.notes-generate-menu');
            const triggerBtn = menu && menu.previousElementSibling;
            const fromNoteDetail = runtime.currentView === 'note';
            phoneNotesHideMenus(container);
            generatePhoneNotesSection(contact, runtime.currentSectionKey, mode, triggerBtn, fromNoteDetail);
            return;
        }

        const folderItem = target.closest('.folder-item[data-section-key]');
        if (folderItem) {
            event.preventDefault();
            phoneNotesOpenSection(container, folderItem.dataset.sectionKey);
            return;
        }

        const noteCard = target.closest('.note-card[data-note-index]');
        if (noteCard) {
            event.preventDefault();
            phoneNotesOpenNote(container, Number(noteCard.dataset.noteIndex));
            return;
        }

        const closeLockModal = target.closest('[data-action="close-lock-modal"]');
        if (closeLockModal) {
            event.preventDefault();
            phoneNotesCloseLockModal(container);
            return;
        }

        const declineForceEnter = target.closest('[data-action="decline-force-enter"]');
        if (declineForceEnter) {
            event.preventDefault();
            const forcePanel = container.querySelector('#notes-lock-force');
            const input = container.querySelector('#notes-lock-answer-input');
            if (forcePanel) forcePanel.classList.add('phone-notes-hidden');
            if (input && !input.disabled) {
                input.focus();
                input.select();
            }
            return;
        }

        const forceEnterNote = target.closest('[data-action="force-enter-note"]');
        if (forceEnterNote) {
            event.preventDefault();
            const sectionKey = runtime.unlockModalSectionKey;
            const noteIndex = runtime.unlockModalNoteIndex;
            const contact = getActivePhoneNotesContact();
            const note = sectionKey && noteIndex != null ? (getPhoneNotesData(contact && contact.id)[sectionKey] || [])[noteIndex] : null;
            if (!note) {
                phoneNotesCloseLockModal(container);
                return;
            }
            phoneNotesEnableDirectEntry(container, note);
            return;
        }

        const submitLockAnswer = target.closest('[data-action="submit-lock-answer"]');
        if (submitLockAnswer) {
            event.preventDefault();
            phoneNotesSubmitLockAnswer(container);
            return;
        }

        const backToMain = target.closest('[data-action="back-to-main"]');
        if (backToMain) {
            event.preventDefault();
            phoneNotesShowMainPage(container);
            return;
        }

        const backToSection = target.closest('[data-action="back-to-section"]');
        if (backToSection) {
            event.preventDefault();
            phoneNotesShowSectionPage(container);
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            runtime.searchTerm = searchInput.value || '';
            phoneNotesRenderMainPage(container, currentCheckPhoneContactId);
        });
    }

    const lockAnswerInput = container.querySelector('#notes-lock-answer-input');
    if (lockAnswerInput) {
        lockAnswerInput.addEventListener('keydown', event => {
            if (event.key === 'Enter') {
                event.preventDefault();
                phoneNotesSubmitLockAnswer(container);
            }
        });
    }

    container.__resetPhoneNotesView = () => {
        runtime.currentView = 'main';
        runtime.currentSectionKey = null;
        runtime.currentNoteIndex = null;
        runtime.unlockedNoteKey = null;
        phoneNotesHideMenus(container);
        phoneNotesCloseLockModal(container);
        if (searchInput) searchInput.value = runtime.searchTerm || '';
        phoneNotesRenderMainPage(container, currentCheckPhoneContactId);
        phoneNotesShowMainPage(container);
    };

    container.dataset.notesAiBound = 'true';
}

function ensurePhoneNotesV1Styles() {
    let styleEl = document.getElementById('phone-notes-v1-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'phone-notes-v1-style';
        document.head.appendChild(styleEl);
    }
    const scopedCss = buildScopedPhoneNotesV1Css(`${PHONE_NOTES_V1_STYLE_TEXT}\n${PHONE_NOTES_EXTRA_STYLE_TEXT}`);
    if (styleEl.textContent !== scopedCss) {
        styleEl.textContent = scopedCss;
    }
}

function ensurePhoneNotesV1Content() {
    const container = document.getElementById('phone-notes-content');
    if (!container) return null;

    container.style.overflow = 'hidden';
    container.style.background = '#f2f2f7';
    container.style.height = '100%';

    if (container.dataset.notesTemplateVersion !== PHONE_NOTES_TEMPLATE_VERSION) {
        container.innerHTML = PHONE_NOTES_APP_TEMPLATE_HTML;
        container.dataset.notesTemplateVersion = PHONE_NOTES_TEMPLATE_VERSION;
        delete container.dataset.notesAiBound;
        delete container.__phoneNotesRuntime;
    }

    bindPhoneNotesV1Interactions(container);
    phoneNotesRenderMainPage(container, currentCheckPhoneContactId);
    return container;
}

function openPhoneNotesApp() {
    const screen = document.getElementById('phone-notes');
    const content = ensurePhoneNotesV1Content();
    if (!screen || !content) return;

    ensurePhoneNotesV1Styles();
    if (typeof content.__resetPhoneNotesView === 'function') {
        content.__resetPhoneNotesView();
    }
    content.scrollTop = 0;
    screen.classList.remove('hidden');
}


