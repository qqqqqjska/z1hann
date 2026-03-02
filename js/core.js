
const state = {
    amapSettings: {
        key: '',
        securityCode: ''
    },
    fonts: [],
    wallpapers: [],
    icons: {},
    iconColors: {}, // { appId: '#ffffff' }
    appNames: {}, // { appId: 'Custom Name' }
    iconPresets: [], // { name, icons, iconColors, appNames }
    showStatusBar: true,
    css: '',
    currentFont: 'default',
    currentMeetingFont: 'default',
    currentWallpaper: null,
    fontPresets: [],
    cssPresets: [],
    meetingCss: '',
    meetingCssPresets: [],
    meetingIcons: {
        edit: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTExIDRINFYyMmgxNFYxMSIvPjxwYXRoIGQ9Ik0xOC41IDIuNWEyLjEyMSAyLjEyMSAwIDAgMSAzIDNMMTIgMTVIOHYtNGw5LjUtOS41eiIvPjwvc3ZnPg==',
        delete: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iMyA2IDUgNiAyMSA2Ii8+PHBhdGggZD0iTTE5IDZ2MTRhMiAyIDAgMCAxLTIgMkg3YTIgMiAwIDAgMS0yLTJWNm0zIDBUNGEyIDIgMCAwIDEgMi0yaDRhMiAyIDAgMCAxIDIgMnYyIi8+PGxpbmUgeDE9IjEwIiB5MT0iMTEiIHgyPSIxMCIgeTI9IjE3Ii8+PGxpbmUgeDE9IjE0IiB5MT0iMTEiIHgyPSIxNCIgeTI9IjE3Ii8+PC9zdmc+',
        end: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTkgMjFIMWMtMS4xIDAtMi0uOS0yLTJWMWMwLTEuMS45LTIgMi0yaDhNMjEgMTJsLTUtNW01IDVsLTUgNW01LTVoLTEzIi8+PC9zdmc+',
        continue: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE1IDRWMiIvPjxwYXRoIGQ9Ik0xNSAxNnYtMiIvPjxwYXRoIGQ9Ik04IDloMiIvPjxwYXRoIGQ9Ik0yMCA5aDIiLz48cGF0aCBkPSJNMTcuOCAxMS44TDE5IDEzIi8+PHBhdGggZD0iTTEwLjYgNi42TDEyIDgiLz48cGF0aCBkPSJNNC44IDExLjhMNiAxMyIvPjxwYXRoIGQ9Ik0xMiA0LjhMMTAuNiA2Ii8+PHBhdGggZD0iTTE5IDQuOEwxNy44IDYiLz48cGF0aCBkPSJNMTIgMTMuMkw0LjggMjAuNGEyLjggMi44IDAgMCAwIDQgNEwxNiAxNy4yIi8+PC9zdmc+'
    },
    aiSettings: {
        url: '',
        key: '',
        model: '',
        temperature: 0.7
    },
    aiPresets: [],
    aiSettings2: {
        url: '',
        key: '',
        model: '',
        temperature: 0.7
        
    },
    aiPresets2: [],
    whisperSettings: {
        url: '',
        key: '',
        model: 'whisper-1'
    },
    minimaxSettings: {
        url: 'https://api.minimax.chat/v1/t2a_v2',
        key: '',
        groupId: '',
        model: 'speech-01-turbo'
    },
    novelaiSettings: {
        url: 'https://api.novelai.net',
        key: '',
        model: 'nai-diffusion-3',
        size: '832x1216',
        steps: 28,
        cfg: 5,
        sampler: 'k_euler_ancestral',
        seed: -1,
        ucPreset: 0,
        addQualityTags: true,
        smea: false,
        smeaDyn: false,
        defaultPrompt: '((full body shot:1.6)), (solo character:1.5), dynamic pose, 1boy, ((manly))',
        negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
        corsProxy: 'corsproxy.io'
    },
    chatWallpapers: [], // { id, data }
    tempSelectedChatBg: null,
    tempSelectedGroup: null,
    contacts: [], // { id, name, remark, avatar, persona, style, myAvatar, chatBg, group }
    contactGroups: [],
    currentChatContactId: null,
    chatHistory: {}, // { contactId: [{ role: 'user'|'assistant', content: '...' }] }
    itineraries: {}, // { contactId: { generatedDate: 'YYYY-MM-DD', events: [] } }
    meetings: {}, // { contactId: [{ id, time, title, content: [{role, text}], style, linkedWorldbooks }] }
    currentMeetingId: null,
    worldbook: [], // { id, categoryId, keys: [], content: '', enabled: true, remark: '' }
    wbCategories: [], // { id, name, desc }
    currentWbCategoryId: null,
    userPersonas: [], // { id, title, aiPrompt, name }
    currentUserPersonaId: null,
    userProfile: {
        name: 'User Name',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        bgImage: '',
        momentsBgImage: '',
        desc: 'Click to edit signature',
        wxid: 'wxid_123456'
    },
    moments: [], // { id, contactId, content, images: [], time, likes: [], comments: [] }
    memories: [], // { id, contactId, content, time }
    defaultVirtualImageUrl: '',
    wallet: {
        balance: 0.00,
        transactions: [] // { id, type: 'income'|'expense', amount, title, time, relatedId }
    },
    bankApp: {
        initialized: false,
        cashBalance: 0.00,
        transactions: [],
        familyCardUsage: {},
        familyCardUsageMonthKey: '',
        unboundFamilyCards: []
    },
    music: {
        playing: false,
        cover: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        src: '',
        title: 'Happy Together',
        artist: 'Maximillian',
        lyricsData: [
            { time: 0, text: "So fast, I almost missed it" },
            { time: 3, text: "I spill another glass of wine" },
            { time: 6, text: "Kill the lights to pass the time" }
        ],
        lyricsFile: '',
        widgetBg: '',
        playlist: [], // { id, title, artist, src, lyricsData, lyricsFile }
        currentSongId: null
    },
    polaroid: {
        img1: 'https://placehold.co/300x300/eee/999?text=Photo',
        text1: 'Rainy day mood',
        img2: 'https://placehold.co/300x300/eee/999?text=Photo',
        text2: 'Good memory'
    },
    icityProfile: {
        avatar: '',
        bgImage: ''
    },
    icityDiaries: [], // { id, content, visibility, time, likes, comments }
    stickerCategories: [], // { id, name, list: [{ url, desc }] }
    currentStickerCategoryId: 'all',
    isStickerManageMode: false,
    selectedStickers: new Set(),
    replyingToMsg: null,
    wechatFriendRequests: [], // { id, name, avatar, reason, status: 'pending'|'accepted'|'rejected', icityContext: {} }
    isMultiSelectMode: false,
    selectedMessages: new Set(),
    enableSystemNotifications: false,
    enableBackgroundAudio: false,
    shoppingProducts: []
};

window.iphoneSimState = state;

window.appInitFunctions = [];

let currentEditingChatMsgId = null;

const knownApps = {
    'wechat-app': { name: 'WeChat', icon: 'fab fa-weixin', color: '#07C160' },
    'worldbook-app': { name: 'Worldbook', icon: 'fas fa-globe', color: '#007AFF' },
    'settings-app': { name: 'Settings', icon: 'fas fa-cog', color: '#8E8E93' },
    'theme-app': { name: 'Theme', icon: 'fas fa-paint-brush', color: '#5856D6' },
    'shopping-app': { name: 'Shop', icon: 'fas fa-shopping-bag', color: '#FF9500' },
    'forum-app': { name: 'Forum', icon: 'fas fa-comments', color: '#30B0C7' },
    'phone-app': { name: 'Phone', icon: 'fas fa-mobile-alt', color: '#34C759' },
    'bank-app': { name: 'Bank', icon: 'fas fa-building-columns', color: '#1E66F5' },
    'icity-app': { name: 'iCity', icon: 'fas fa-city', color: '#000000' },
    'lookus-app': { name: 'LookUS', icon: 'fas fa-eye', color: '#FF2D55' },
    'music-app': { name: 'Music', icon: 'fas fa-music', color: '#FF2D55' }
};

function compressImage(file, maxWidth = 1024, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

function compressBase64(base64, maxWidth = 1024, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = Math.round(height * (maxWidth / width));
                width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        img.onerror = (err) => resolve(base64);
    });
}

window.optimizeStorage = async function() {
    if (!confirm('Are you sure?')) return;

    showNotification('', 0);

    try {
        const tasks = [];

        if (state.contacts) {
            for (const c of state.contacts) {
                if (c.avatar && c.avatar.startsWith('data:image')) tasks.push(compressBase64(c.avatar, 300, 0.7).then(d => c.avatar = d));
                if (c.profileBg && c.profileBg.startsWith('data:image')) tasks.push(compressBase64(c.profileBg, 800, 0.7).then(d => c.profileBg = d));
                if (c.chatBg && c.chatBg.startsWith('data:image')) tasks.push(compressBase64(c.chatBg, 800, 0.7).then(d => c.chatBg = d));
                if (c.aiSettingBg && c.aiSettingBg.startsWith('data:image')) tasks.push(compressBase64(c.aiSettingBg, 800, 0.7).then(d => c.aiSettingBg = d));
                if (c.userSettingBg && c.userSettingBg.startsWith('data:image')) tasks.push(compressBase64(c.userSettingBg, 800, 0.7).then(d => c.userSettingBg = d));
                if (c.myAvatar && c.myAvatar.startsWith('data:image')) tasks.push(compressBase64(c.myAvatar, 300, 0.7).then(d => c.myAvatar = d));
                if (c.voiceCallBg && c.voiceCallBg.startsWith('data:image')) tasks.push(compressBase64(c.voiceCallBg, 800, 0.7).then(d => c.voiceCallBg = d));
                if (c.videoCallBgImage && c.videoCallBgImage.startsWith('data:image')) tasks.push(compressBase64(c.videoCallBgImage, 800, 0.7).then(d => c.videoCallBgImage = d));
            }
        }

        if (state.moments) {
            for (const m of state.moments) {
                if (!m.images) continue;
                for (let i = 0; i < m.images.length; i++) {
                    const img = m.images[i];
                    if (typeof img === 'string' && img.startsWith('data:image')) {
                        tasks.push(compressBase64(img, 800, 0.7).then(d => m.images[i] = d));
                    } else if (img && typeof img === 'object' && img.src && img.src.startsWith('data:image')) {
                        tasks.push(compressBase64(img.src, 800, 0.7).then(d => img.src = d));
                    }
                }
            }
        }

        if (state.chatHistory) {
            for (const contactId in state.chatHistory) {
                const msgs = state.chatHistory[contactId] || [];
                for (const msg of msgs) {
                    if ((msg.type === 'image' || msg.type === 'sticker') && msg.content && msg.content.startsWith('data:image')) {
                        tasks.push(compressBase64(msg.content, 800, 0.7).then(d => msg.content = d));
                    }
                }
            }
        }

        if (state.userProfile) {
            if (state.userProfile.avatar && state.userProfile.avatar.startsWith('data:image')) tasks.push(compressBase64(state.userProfile.avatar, 300, 0.7).then(d => state.userProfile.avatar = d));
            if (state.userProfile.bgImage && state.userProfile.bgImage.startsWith('data:image')) tasks.push(compressBase64(state.userProfile.bgImage, 800, 0.7).then(d => state.userProfile.bgImage = d));
            if (state.userProfile.momentsBgImage && state.userProfile.momentsBgImage.startsWith('data:image')) tasks.push(compressBase64(state.userProfile.momentsBgImage, 800, 0.7).then(d => state.userProfile.momentsBgImage = d));
        }

        if (state.music) {
            if (state.music.cover && state.music.cover.startsWith('data:image')) tasks.push(compressBase64(state.music.cover, 300, 0.7).then(d => state.music.cover = d));
            if (state.music.widgetBg && state.music.widgetBg.startsWith('data:image')) tasks.push(compressBase64(state.music.widgetBg, 800, 0.7).then(d => state.music.widgetBg = d));
        }

        if (state.polaroid) {
            if (state.polaroid.img1 && state.polaroid.img1.startsWith('data:image')) tasks.push(compressBase64(state.polaroid.img1, 600, 0.7).then(d => state.polaroid.img1 = d));
            if (state.polaroid.img2 && state.polaroid.img2.startsWith('data:image')) tasks.push(compressBase64(state.polaroid.img2, 600, 0.7).then(d => state.polaroid.img2 = d));
        }

        if (state.icons) {
            for (const appId in state.icons) {
                const icon = state.icons[appId];
                if (icon && icon.startsWith('data:image')) tasks.push(compressBase64(icon, 100, 0.7).then(d => state.icons[appId] = d));
            }
        }

        await Promise.all(tasks);
        await saveConfig();

        showNotification('', 'success');
        alert('Operation completed.');
    } catch (e) {
        console.error('Compression failed:', e);
        showNotification('', 'error');
        alert('Operation completed.');
    }
};

function handleAppClick(appId, appName) {
    console.log('Config migration completed.');
    const screen = document.getElementById(appId);
    if (screen) {
        screen.classList.remove('hidden');
        if (appId === 'wechat-app') {
            const chatScreen = document.getElementById('chat-screen');
            if (chatScreen) chatScreen.classList.add('hidden');

            const tabItems = screen.querySelectorAll('.wechat-tab-item');
            tabItems.forEach(item => item.classList.remove('active'));
            const contactsTab = screen.querySelector('.wechat-tab-item[data-tab="contacts"]');
            if (contactsTab) contactsTab.classList.add('active');

            const tabContents = screen.querySelectorAll('.wechat-tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.classList.remove('fade-out');
                content.style.opacity = '';
            });
            const contactsContent = document.getElementById('wechat-tab-contacts');
            if (contactsContent) contactsContent.classList.add('active');

            if (window.updateWechatHeader) {
                window.updateWechatHeader('contacts');
            }
            if (window.renderContactList && window.iphoneSimState) {
                window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
            }
        }
        if (appId === 'bank-app' && window.initBankAppView) {
            window.initBankAppView();
        }
    } else {
        alert((appName || 'App') + ' is under development...');
    }
}
function showChatToast(message, duration = 2000) {
    const toast = document.getElementById('chat-toast');
    const text = document.getElementById('chat-toast-text');
    if (!toast || !text) return;

    text.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

function showNotification(message, duration = 0, type = 'info') {
    const notification = document.getElementById('summary-notification');
    const textEl = document.getElementById('summary-notification-text');
    const iconEl = notification.querySelector('i');

    if (!notification || !textEl) return;

    textEl.textContent = message;
    notification.classList.remove('hidden');
    
    notification.classList.remove('success');
    iconEl.className = 'fas fa-spinner fa-spin';

    if (type === 'success') {
        notification.classList.add('success');
        iconEl.className = 'fas fa-check-circle';
    }

    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('hidden');
        }, duration);
    }
}

let itineraryNotificationTimeout;
function showItineraryNotification(message, duration = 0, type = 'info') {
    const notification = document.getElementById('itinerary-notification');
    const textEl = document.getElementById('itinerary-notification-text');
    const iconEl = notification.querySelector('i');

    if (!notification || !textEl) return;

    if (itineraryNotificationTimeout) {
        clearTimeout(itineraryNotificationTimeout);
        itineraryNotificationTimeout = null;
    }

    textEl.textContent = message;
    notification.classList.remove('hidden');
    
    notification.classList.remove('success');
    notification.classList.remove('error');
    iconEl.className = 'fas fa-spinner fa-spin';

    if (type === 'success') {
        notification.classList.add('success');
        iconEl.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        notification.classList.add('error');
        iconEl.className = 'fas fa-exclamation-circle';
    }

    if (duration > 0) {
        itineraryNotificationTimeout = setTimeout(() => {
            notification.classList.add('hidden');
        }, duration);
    }
}

function setupIOSFullScreen() {
    function isInStandaloneMode() {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone ||
            document.referrer.includes('android-app://')
        );
    }

    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    if (isIOS() && isInStandaloneMode()) {
        document.body.classList.add('ios-standalone');
        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            const meta = document.createElement('meta');
            meta.name = 'apple-mobile-web-app-capable';
            meta.content = 'yes';
            document.head.appendChild(meta);
        }
    }

    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

window.analyzeStorageUsage = function() {
    if (!state) return;

    let totalSize = 0;
    const breakdown = [];

    for (const key in state) {
        if (!Object.prototype.hasOwnProperty.call(state, key)) continue;
        try {
            const jsonStr = JSON.stringify(state[key]);
            const size = jsonStr ? jsonStr.length : 0;
            totalSize += size;
            breakdown.push({ key, size });
        } catch (e) {
            console.error(`Error calculating size for ${key}:`, e);
        }
    }

    breakdown.sort((a, b) => b.size - a.size);

    let msg = "[Storage Usage]\n\n";
    msg += `Total (estimated): ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`;
    msg += "----------------\n";

    breakdown.slice(0, 15).forEach(item => {
        const sizeMB = (item.size / 1024 / 1024).toFixed(2);
        const percent = totalSize > 0 ? ((item.size / totalSize) * 100).toFixed(1) : "0.0";
        msg += `${item.key}: ${sizeMB} MB (${percent}%)\n`;
    });

    alert(msg);
    console.table(breakdown);
};

function saveConfig() {
    try {
        const persistState = Object.assign({}, state);
        try { delete persistState.selectedMessages; } catch (e) {}
        try { delete persistState.isMultiSelectMode; } catch (e) {}
        try { delete persistState.selectedStickers; } catch (e) {}
        
        return localforage.setItem('iphoneSimConfig', persistState).catch(err => {
            console.error('Operation failed. See details below.', err);
            if (err.name === 'QuotaExceededError') {
                alert('Operation completed.');
            }
        });
    } catch (e) {
        console.error('Operation failed. See details below.', e);
        return Promise.reject(e);
    }
}

async function loadConfig() {
    try {
        let loadedState = await localforage.getItem('iphoneSimConfig');
        
        if (!loadedState) {
            const localSaved = localStorage.getItem('iphoneSimConfig');
            if (localSaved) {
                try {
                    loadedState = JSON.parse(localSaved);
                    console.log('Config migration completed.');
                    await localforage.setItem('iphoneSimConfig', loadedState);
                    localStorage.removeItem('iphoneSimConfig');
                    console.log('Config migration completed.');
                } catch (e) {
                    console.error('Operation failed. See details below.', e);
                }
            }
        }

        if (loadedState) {
            Object.assign(state, loadedState);
            
            if (!state.fontPresets) state.fontPresets = [];
            if (!state.cssPresets) state.cssPresets = [];
            if (!state.aiSettings) state.aiSettings = { url: '', key: '', model: '', temperature: 0.7 };
            if (!state.aiPresets) state.aiPresets = [];
            if (!state.aiSettings2) state.aiSettings2 = { url: '', key: '', model: '', temperature: 0.7 };
            if (!state.aiPresets2) state.aiPresets2 = [];
            if (!state.whisperSettings) state.whisperSettings = { url: '', key: '', model: 'whisper-1' };
            if (!state.minimaxSettings) state.minimaxSettings = { url: 'https://api.minimax.chat/v1/t2a_v2', key: '', groupId: '', model: 'speech-01-turbo' };
            if (!state.novelaiSettings) state.novelaiSettings = { 
                url: 'https://api.novelai.net', 
                key: '', 
                model: 'nai-diffusion-3', 
                size: '832x1216',
                steps: 28,
                cfg: 5,
                sampler: 'k_euler_ancestral',
                seed: -1,
                ucPreset: 0,
                addQualityTags: true,
                smea: false,
                smeaDyn: false,
                defaultPrompt: '((full body shot:1.6)), (solo character:1.5), dynamic pose, 1boy, ((manly))',
                negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
                corsProxy: 'corsproxy.io'
            };
            if (!state.amapSettings) state.amapSettings = { key: '', securityCode: '' };
            if (!state.chatWallpapers) state.chatWallpapers = [];
            if (!state.contacts) state.contacts = [];
            if (!state.chatHistory) state.chatHistory = {};
            if (!state.worldbook) state.worldbook = [];
            if (!state.userPersonas) state.userPersonas = [];
            if (!state.moments) state.moments = [];
            if (!state.memories) state.memories = [];
            if (!state.defaultVirtualImageUrl) state.defaultVirtualImageUrl = '';
            if (state.showStatusBar === undefined) state.showStatusBar = true;
            if (!state.iconColors) state.iconColors = {};
            if (!state.appNames) state.appNames = {};
            if (!state.iconPresets) state.iconPresets = [];
            if (!state.stickerCategories) state.stickerCategories = [];
            if (!state.contactGroups) state.contactGroups = [];
            if (!state.itineraries) state.itineraries = {};
            if (!state.music) state.music = {
                playing: false,
                cover: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                src: '',
                title: 'Happy Together',
                artist: 'Maximillian',
                lyricsData: [
                    { time: 0, text: "So fast, I almost missed it" },
                    { time: 3, text: "I spill another glass of wine" },
                    { time: 6, text: "Kill the lights to pass the time" }
                ],
                lyricsFile: ''
            };
            if (!state.bankApp) state.bankApp = {
                initialized: false,
                cashBalance: 0.00,
                transactions: [],
                familyCardUsage: {},
                familyCardUsageMonthKey: '',
                unboundFamilyCards: []
            };
            const bankApp = state.bankApp;
            const migratedCash = Number.isFinite(Number(bankApp.cashBalance))
                ? Number(bankApp.cashBalance)
                : (Number.isFinite(Number(bankApp.balance))
                    ? Number(bankApp.balance)
                    : (Number.isFinite(Number(bankApp.totalBalance)) ? Number(bankApp.totalBalance) : 0));
            bankApp.cashBalance = migratedCash;
            if (!Array.isArray(bankApp.transactions)) bankApp.transactions = [];
            if (!bankApp.familyCardUsage || typeof bankApp.familyCardUsage !== 'object') bankApp.familyCardUsage = {};
            if (typeof bankApp.familyCardUsageMonthKey !== 'string') bankApp.familyCardUsageMonthKey = '';
            const unboundOld = Array.isArray(bankApp.unboundFamilyCardIds) ? bankApp.unboundFamilyCardIds : [];
            const unboundNew = Array.isArray(bankApp.unboundFamilyCards) ? bankApp.unboundFamilyCards : [];
            bankApp.unboundFamilyCards = Array.from(new Set([...unboundOld, ...unboundNew].map(String)));
            if (!state.polaroid) state.polaroid = {
                img1: 'https://placehold.co/300x300/eee/999?text=Photo',
                text1: 'Rainy day mood',
                img2: 'https://placehold.co/300x300/eee/999?text=Photo',
                text2: 'Good memory'
            };
            
            if (typeof state.music.lyrics === 'string') {
                state.music.lyricsData = [
                    { time: 0, text: state.music.lyrics.split('\n')[0] || 'No lyrics' }
                ];
                delete state.music.lyrics;
            }

            state.isMultiSelectMode = false;
            state.selectedMessages = new Set();
            state.selectedStickers = new Set();
            
            if (state.currentStickerCategoryId !== 'all' && !state.stickerCategories.find(c => c.id === state.currentStickerCategoryId)) {
                state.currentStickerCategoryId = 'all';
            }
        }
    } catch (e) {
        console.error('Operation failed. See details below.', e);
    }
}

window.updateAudioSession = function() {
    try {
        if (window.iphoneSimState.enableBackgroundAudio) {
            if (navigator.audioSession) {
                navigator.audioSession.type = 'play-and-record';
            }
            
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
                if (!navigator.mediaSession.metadata && window.iphoneSimState.music) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: window.iphoneSimState.music.title || 'Background Audio',
                        artist: window.iphoneSimState.music.artist || 'iPhone Simulator',
                        artwork: [
                            { src: window.iphoneSimState.music.cover || 'https://placehold.co/512x512', sizes: '512x512', type: 'image/png' }
                        ]
                    });
                }
            }
        } else {
            if (navigator.audioSession) {
                navigator.audioSession.type = 'auto';
            }
        }
    } catch (e) {
        console.warn('Audio Session configuration failed:', e);
    }
};

function handleClearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localforage.clear().then(() => {
            localStorage.removeItem('iphoneSimConfig');
            alert('Operation completed.');
            location.reload();
        }).catch(err => {
            console.error('Operation failed. See details below.', err);
            alert('Operation completed.');
        });
    }
}

function exportJSON() {
    const exportAsZip = document.getElementById('export-as-zip');
    if (exportAsZip && exportAsZip.checked) {
        exportZIP();
    } else {
        const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'iphone-sim-config.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

function exportZIP() {
    if (typeof JSZip === 'undefined') {
        alert('Operation completed.');
        const exportAsZip = document.getElementById('export-as-zip');
        if (exportAsZip) exportAsZip.checked = false;
        exportJSON();
        return;
    }

    const zip = new JSZip();
    zip.file("iphone-sim-config.json", JSON.stringify(state));

    zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
            level: 9
        }
    })
        .then(function(content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'iphone-sim-config.zip';
            a.click();
            URL.revokeObjectURL(url);
        })
        .catch(function(err) {
            console.error('Operation failed. See details below.', err);
            alert('Operation completed.');
        });
}

function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const loadedState = JSON.parse(event.target.result);
            Object.assign(state, loadedState);
            
            saveConfig().then(() => {
                alert('Operation completed.');
                location.reload();
            });
        } catch (err) {
            alert('Operation completed.');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

function applyConfig() {
    if (window.applyFont) applyFont(state.currentFont);
    if (window.applyMeetingFont && state.currentMeetingFont) {
        applyMeetingFont(state.currentMeetingFont);
    }
    if (window.applyWallpaper) applyWallpaper(state.currentWallpaper);
    if (window.applyIcons) applyIcons();
    if (window.applyCSS) applyCSS(state.css);
    if (window.applyMeetingCss) applyMeetingCss(state.meetingCss);
    if (window.toggleStatusBar) toggleStatusBar(state.showStatusBar);
}

function checkScheduledDiaries() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    if (!window.iphoneSimState.contacts) return;

    window.iphoneSimState.contacts.forEach(contact => {
        if (contact.icityData && contact.icityData.autoDiaryEnabled && contact.icityData.autoDiaryTime) {
            if (contact.icityData.autoDiaryTime === currentTimeStr) {
                if (contact.icityData.lastAutoDiaryDate !== todayStr) {
                    console.log(`Triggering scheduled diary for ${contact.name} at ${currentTimeStr}`);
                    contact.icityData.lastAutoDiaryDate = todayStr;
                    saveConfig();
                    
                    if (window.generateScheduledContactDiary) {
                        window.generateScheduledContactDiary(contact);
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Config migration completed.');
    init();
    
    setInterval(checkScheduledDiaries, 60000);
    setTimeout(checkScheduledDiaries, 5000);
});

async function init() {
    setupIOSFullScreen();
    
    document.querySelectorAll('.dock-item').forEach(item => {
        item.addEventListener('click', () => {
            const appId = item.dataset.appId;
            const appName = item.querySelector('.app-label')?.textContent;
            handleAppClick(appId, appName);
        });
    });

    const closeBtn = document.getElementById('close-theme-app');
    const appScreen = document.getElementById('theme-app');
    if (closeBtn) closeBtn.addEventListener('click', () => appScreen.classList.add('hidden'));
    
    const closeSettingsBtn = document.getElementById('close-settings-app');
    const settingsAppScreen = document.getElementById('settings-app');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsAppScreen.classList.add('hidden'));

    const exportJsonBtn = document.getElementById('export-json');
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
    
    const importJsonInput = document.getElementById('import-json');
    if (importJsonInput) importJsonInput.addEventListener('change', importJSON);

    const clearAllDataBtn = document.getElementById('clear-all-data');
    if (clearAllDataBtn) clearAllDataBtn.addEventListener('click', handleClearAllData);

    const optimizeStorageBtn = document.getElementById('optimize-storage');
    if (optimizeStorageBtn) optimizeStorageBtn.addEventListener('click', window.optimizeStorage);

    const analyzeStorageBtn = document.getElementById('analyze-storage');
    if (analyzeStorageBtn) analyzeStorageBtn.addEventListener('click', window.analyzeStorageUsage);

    window.appInitFunctions.forEach(func => {
        if (typeof func === 'function') func();
    });

    try {
        await loadConfig();
    } catch (e) {
        console.error('Operation failed. See details below.', e);
    }

    if (window.updateLookusUi) window.updateLookusUi();

    if (window.initShoppingUI) window.initShoppingUI();

    if (window.renderIcityProfile) window.renderIcityProfile();
    if (window.renderIcityDiaryList) window.renderIcityDiaryList();
    if (window.renderIcityWorld) window.renderIcityWorld(); // Initialize world view content

    if (window.updateThemeUi) window.updateThemeUi();

    try {
        if (window.renderWallpaperGallery) renderWallpaperGallery();
    } catch (e) { console.error('Operation failed. See details below.', e); }

    try {
        if (window.renderChatWallpaperGallery) renderChatWallpaperGallery();
    } catch (e) { console.error('Operation failed. See details below.', e); }

    try {
        if (window.renderIconSettings) renderIconSettings();
    } catch (e) { console.error('Operation failed. See details below.', e); }

    try {
        applyConfig();
    } catch (e) { console.error('Operation failed. See details below.', e); }
    
    if (window.initMusicWidget) initMusicWidget();
    if (window.initPolaroidWidget) initPolaroidWidget();
    if (window.initMeetingTheme) initMeetingTheme();

    if (window.renderIconPresets) renderIconPresets();
    if (window.renderFontPresets) renderFontPresets();
    if (window.renderCssPresets) renderCssPresets();
    if (window.renderMeetingCssPresets) renderMeetingCssPresets();
    if (window.renderAiPresets) {
        renderAiPresets();
        renderAiPresets(true);
    }
    if (window.updateAiUi) {
        updateAiUi();
        updateAiUi(true);
    }
    if (window.updateWhisperUi) updateWhisperUi();
    if (window.updateMinimaxUi) updateMinimaxUi();
    if (window.updateNovelAiUi) window.updateNovelAiUi();
    if (window.updateSystemSettingsUi) updateSystemSettingsUi();
    if (window.updateAudioSession) window.updateAudioSession();
    if (window.renderContactList) renderContactList();
    if (window.migrateWorldbookData) migrateWorldbookData();
    if (window.renderWorldbookCategoryList) renderWorldbookCategoryList();
    if (window.renderMeTab) renderMeTab();
    if (window.renderMoments) renderMoments();
    if (window.applyChatMultiSelectClass) applyChatMultiSelectClass();
    
    if (window.initGrid) window.initGrid();
    
    const refreshButtons = ['close-theme-app', 'close-theme-icons', 'close-theme-wallpaper', 'reset-icons'];
    refreshButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                setTimeout(() => {
                    if (window.renderItems) window.renderItems(); 
                }, 50);
            });
        }
    });
}

