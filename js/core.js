// 核心状态与工具模块

// 状态管理
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
    meetingCss: '', // 见面模式自定义CSS
    meetingCssPresets: [], // 见面模式CSS预设
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
    chatWallpapers: [], // { id, data }
    tempSelectedChatBg: null, // 临时存储聊天设置中选中的背景
    tempSelectedGroup: null, // 临时存储聊天设置中选中的分组
    contacts: [], // { id, name, remark, avatar, persona, style, myAvatar, chatBg, group }
    contactGroups: [], // ['分组1', '分组2']
    currentChatContactId: null,
    chatHistory: {}, // { contactId: [{ role: 'user'|'assistant', content: '...' }] }
    itineraries: {}, // { contactId: { generatedDate: 'YYYY-MM-DD', events: [] } }
    meetings: {}, // { contactId: [{ id, time, title, content: [{role, text}], style, linkedWorldbooks }] }
    currentMeetingId: null, // 当前正在进行的见面ID
    worldbook: [], // { id, categoryId, keys: [], content: '', enabled: true, remark: '' }
    wbCategories: [], // { id, name, desc }
    currentWbCategoryId: null,
    userPersonas: [], // { id, title, aiPrompt, name }
    currentUserPersonaId: null,
    userProfile: { // 全局资料卡信息
        name: 'User Name',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        bgImage: '',
        momentsBgImage: '',
        desc: '点击此处添加个性签名',
        wxid: 'wxid_123456'
    },
    moments: [], // { id, contactId, content, images: [], time, likes: [], comments: [] }
    memories: [], // { id, contactId, content, time }
    defaultVirtualImageUrl: '', // 默认虚拟图片URL
    wallet: {
        balance: 0.00,
        transactions: [] // { id, type: 'income'|'expense', amount, title, time, relatedId }
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
        text1: '讨厌坏天气',
        img2: 'https://placehold.co/300x300/eee/999?text=Photo',
        text2: '美好回忆'
    },
    icityProfile: {
        avatar: '',
        bgImage: ''
    },
    icityDiaries: [], // { id, content, visibility, time, likes, comments }
    stickerCategories: [], // { id, name, list: [{ url, desc }] }
    currentStickerCategoryId: 'all',
    isStickerManageMode: false,
    selectedStickers: new Set(), // 存储选中的表情包标识 (catId-index)
    replyingToMsg: null, // 当前正在引用的消息 { content, name, type }
    wechatFriendRequests: [], // { id, name, avatar, reason, status: 'pending'|'accepted'|'rejected', icityContext: {} }
    isMultiSelectMode: false,
    selectedMessages: new Set(), // 存储选中的消息ID
    enableSystemNotifications: false, // 系统后台通知开关
    enableBackgroundAudio: false, // 允许后台音频混音播放
    shoppingProducts: [] // 购物商品列表
};

// 暴露 state 给全局
window.iphoneSimState = state;

// 模块初始化函数队列
window.appInitFunctions = [];

// 全局变量
let currentEditingChatMsgId = null;

// 已知应用配置
const knownApps = {
    'wechat-app': { name: '微信', icon: 'fab fa-weixin', color: '#07C160' },
    'worldbook-app': { name: '世界书', icon: 'fas fa-globe', color: '#007AFF' },
    'settings-app': { name: '设置', icon: 'fas fa-cog', color: '#8E8E93' },
    'theme-app': { name: '美化', icon: 'fas fa-paint-brush', color: '#5856D6' },
    'shopping-app': { name: '购物', icon: 'fas fa-shopping-bag', color: '#FF9500' },
    'forum-app': { name: '论坛', icon: 'fas fa-comments', color: '#30B0C7' },
    'phone-app': { name: '查手机', icon: 'fas fa-mobile-alt', color: '#34C759' },
    'icity-app': { name: 'iCity', icon: 'fas fa-city', color: '#000000' },
    'lookus-app': { name: 'LookUS', icon: 'fas fa-eye', color: '#FF2D55' }
};

// 获取查手机功能中，当前显示的"我"的头像
// 在查手机的微信聊天中，"我"的头像应该是被查手机的机主的头像
window.getCheckPhoneMyAvatar = function(contactId) {
    if (!contactId) return 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown';
    // Use loose equality to handle string/number mismatch
    const contact = window.iphoneSimState.contacts.find(c => c.id == contactId);
    if (contact) {
        return contact.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(contact.name || 'Unknown');
    }
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown';
};

// 图片压缩工具
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
                // 填充白色背景以防止 PNG 转 JPEG 变黑
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                // 强制转换为 JPEG 以减小体积
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
        img.onerror = (err) => resolve(base64); // 如果加载失败，保留原图
    });
}

window.optimizeStorage = async function() {
    if (!confirm('这将压缩所有图片以减小文件体积，可能会降低部分图片清晰度。确定继续吗？')) return;
    
    showNotification('正在压缩数据，请稍候...', 0);
    
    try {
        const tasks = [];

        // 1. 联系人头像和背景
        if (state.contacts) {
            for (const c of state.contacts) {
                if (c.avatar && c.avatar.startsWith('data:image')) {
                    tasks.push(compressBase64(c.avatar, 300, 0.7).then(d => c.avatar = d));
                }
                if (c.profileBg && c.profileBg.startsWith('data:image')) {
                    tasks.push(compressBase64(c.profileBg, 800, 0.7).then(d => c.profileBg = d));
                }
                if (c.chatBg && c.chatBg.startsWith('data:image')) {
                    tasks.push(compressBase64(c.chatBg, 800, 0.7).then(d => c.chatBg = d));
                }
                if (c.aiSettingBg && c.aiSettingBg.startsWith('data:image')) {
                    tasks.push(compressBase64(c.aiSettingBg, 800, 0.7).then(d => c.aiSettingBg = d));
                }
                if (c.userSettingBg && c.userSettingBg.startsWith('data:image')) {
                    tasks.push(compressBase64(c.userSettingBg, 800, 0.7).then(d => c.userSettingBg = d));
                }
                if (c.myAvatar && c.myAvatar.startsWith('data:image')) {
                    tasks.push(compressBase64(c.myAvatar, 300, 0.7).then(d => c.myAvatar = d));
                }
                if (c.voiceCallBg && c.voiceCallBg.startsWith('data:image')) {
                    tasks.push(compressBase64(c.voiceCallBg, 800, 0.7).then(d => c.voiceCallBg = d));
                }
                if (c.videoCallBgImage && c.videoCallBgImage.startsWith('data:image')) {
                    tasks.push(compressBase64(c.videoCallBgImage, 800, 0.7).then(d => c.videoCallBgImage = d));
                }
            }
        }

        // 2. 朋友圈图片
        if (state.moments) {
            for (const m of state.moments) {
                if (m.images) {
                    for (let i = 0; i < m.images.length; i++) {
                        let img = m.images[i];
                        // 兼容旧格式（字符串）和新格式（对象）
                        if (typeof img === 'string' && img.startsWith('data:image')) {
                            tasks.push(compressBase64(img, 800, 0.7).then(d => m.images[i] = d));
                        } else if (typeof img === 'object' && img.src && img.src.startsWith('data:image')) {
                            tasks.push(compressBase64(img.src, 800, 0.7).then(d => img.src = d));
                        }
                    }
                }
            }
        }

        // 3. 聊天记录图片
        if (state.chatHistory) {
            for (const contactId in state.chatHistory) {
                const msgs = state.chatHistory[contactId];
                for (const msg of msgs) {
                    if ((msg.type === 'image' || msg.type === 'sticker') && msg.content && msg.content.startsWith('data:image')) {
                        // 表情包也压缩，虽然可能丢透明度，但为了解决体积问题
                        tasks.push(compressBase64(msg.content, 800, 0.7).then(d => msg.content = d));
                    }
                }
            }
        }

        // 4. 个人资料
        if (state.userProfile) {
            if (state.userProfile.avatar && state.userProfile.avatar.startsWith('data:image')) {
                tasks.push(compressBase64(state.userProfile.avatar, 300, 0.7).then(d => state.userProfile.avatar = d));
            }
            if (state.userProfile.bgImage && state.userProfile.bgImage.startsWith('data:image')) {
                tasks.push(compressBase64(state.userProfile.bgImage, 800, 0.7).then(d => state.userProfile.bgImage = d));
            }
            if (state.userProfile.momentsBgImage && state.userProfile.momentsBgImage.startsWith('data:image')) {
                tasks.push(compressBase64(state.userProfile.momentsBgImage, 800, 0.7).then(d => state.userProfile.momentsBgImage = d));
            }
        }

        // 5. 音乐
        if (state.music) {
            if (state.music.cover && state.music.cover.startsWith('data:image')) {
                tasks.push(compressBase64(state.music.cover, 300, 0.7).then(d => state.music.cover = d));
            }
            if (state.music.widgetBg && state.music.widgetBg.startsWith('data:image')) {
                tasks.push(compressBase64(state.music.widgetBg, 800, 0.7).then(d => state.music.widgetBg = d));
            }
        }

        // 6. 拍立得
        if (state.polaroid) {
            if (state.polaroid.img1 && state.polaroid.img1.startsWith('data:image')) {
                tasks.push(compressBase64(state.polaroid.img1, 600, 0.7).then(d => state.polaroid.img1 = d));
            }
            if (state.polaroid.img2 && state.polaroid.img2.startsWith('data:image')) {
                tasks.push(compressBase64(state.polaroid.img2, 600, 0.7).then(d => state.polaroid.img2 = d));
            }
        }

        // 7. 自定义图标
        if (state.icons) {
            for (const appId in state.icons) {
                const icon = state.icons[appId];
                if (icon && icon.startsWith('data:image')) {
                    tasks.push(compressBase64(icon, 100, 0.7).then(d => state.icons[appId] = d));
                }
            }
        }

        await Promise.all(tasks);
        await saveConfig();
        
        showNotification('压缩完成！', 2000, 'success');
        alert('数据压缩完成，现在导出文件应该会小很多。');
        
    } catch (e) {
        console.error('Compression failed:', e);
        showNotification('压缩失败', 2000, 'error');
        alert('压缩过程中出现错误');
    }
};

// 处理应用点击
function handleAppClick(appId, appName) {
    console.log('App clicked:', appName, appId);
    const screen = document.getElementById(appId);
    if (screen) {
        screen.classList.remove('hidden');
    } else {
        alert(`${appName || '应用'} 功能开发中...`);
    }
}

// 显示临时提示
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

// iOS全屏适配逻辑
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

    // 计算每个主要模块的大小
    for (const key in state) {
        if (Object.prototype.hasOwnProperty.call(state, key)) {
            try {
                // 将对象转换为JSON字符串来估算大小
                const jsonStr = JSON.stringify(state[key]);
                const size = jsonStr ? jsonStr.length : 0;
                totalSize += size;
                breakdown.push({ key, size });
            } catch (e) {
                console.error(`Error calculating size for ${key}:`, e);
            }
        }
    }

    // 按大小降序排序
    breakdown.sort((a, b) => b.size - a.size);

    // 格式化显示
    let msg = "【存储占用分析】\n\n";
    msg += `总计 (估算): ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`;
    msg += "----------------\n";
    
    // 只显示前 15 个占用最大的模块
    breakdown.slice(0, 15).forEach(item => {
        const sizeMB = (item.size / 1024 / 1024).toFixed(2);
        const percent = ((item.size / totalSize) * 100).toFixed(1);
        let alias = item.key;
        
        if (item.key === 'chatHistory') alias = '聊天记录 (chatHistory)';
        if (item.key === 'moments') alias = '朋友圈 (moments)';
        if (item.key === 'music') alias = '音乐 (music)';
        if (item.key === 'contacts') alias = '联系人 (contacts)';
        if (item.key === 'wallpapers') alias = '壁纸 (wallpapers)';
        if (item.key === 'fonts') alias = '字体 (fonts)';
        
        msg += `${alias}: ${sizeMB} MB (${percent}%)\n`;
    });

    msg += "\n提示：\n";
    msg += "1. 如果 'music' 很大，可能是因为上传了完整的音乐文件。\n";
    msg += "2. 如果 'contacts' 或 'moments' 很大，可能是图片未压缩。\n";
    msg += "3. 建议使用'压缩图片数据'功能，或手动删除不必要的大文件。";

    alert(msg);
    console.table(breakdown);
};

// 数据管理
function saveConfig() {
    try {
        const persistState = Object.assign({}, state);
        try { delete persistState.selectedMessages; } catch (e) {}
        try { delete persistState.isMultiSelectMode; } catch (e) {}
        try { delete persistState.selectedStickers; } catch (e) {}
        
        return localforage.setItem('iphoneSimConfig', persistState).catch(err => {
            console.error('保存数据失败:', err);
            if (err.name === 'QuotaExceededError') {
                alert('存储空间不足，无法保存数据。请尝试清理一些图片或聊天记录。');
            }
        });
    } catch (e) {
        console.error('保存配置时发生错误:', e);
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
                    console.log('检测到旧数据，正在迁移到 IndexedDB...');
                    await localforage.setItem('iphoneSimConfig', loadedState);
                    localStorage.removeItem('iphoneSimConfig');
                    console.log('数据迁移完成');
                } catch (e) {
                    console.error('迁移旧数据失败:', e);
                }
            }
        }

        if (loadedState) {
            Object.assign(state, loadedState);
            
            // 确保预设数组存在
            if (!state.fontPresets) state.fontPresets = [];
            if (!state.cssPresets) state.cssPresets = [];
            if (!state.aiSettings) state.aiSettings = { url: '', key: '', model: '', temperature: 0.7 };
            if (!state.aiPresets) state.aiPresets = [];
            if (!state.aiSettings2) state.aiSettings2 = { url: '', key: '', model: '', temperature: 0.7 };
            if (!state.aiPresets2) state.aiPresets2 = [];
            if (!state.whisperSettings) state.whisperSettings = { url: '', key: '', model: 'whisper-1' };
            if (!state.minimaxSettings) state.minimaxSettings = { url: 'https://api.minimax.chat/v1/t2a_v2', key: '', groupId: '', model: 'speech-01-turbo' };
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
            if (!state.polaroid) state.polaroid = {
                img1: 'https://placehold.co/300x300/eee/999?text=Photo',
                text1: '讨厌坏天气',
                img2: 'https://placehold.co/300x300/eee/999?text=Photo',
                text2: '美好回忆'
            };
            
            if (typeof state.music.lyrics === 'string') {
                state.music.lyricsData = [
                    { time: 0, text: state.music.lyrics.split('\n')[0] || "暂无歌词" }
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
        console.error('加载配置失败:', e);
    }
}

// 更新音频会话配置
window.updateAudioSession = function() {
    try {
        if (window.iphoneSimState.enableBackgroundAudio) {
            // 使用 'play-and-record' 类型并设置 'mix' 选项，这通常允许与后台音频共存
            // 注意：这需要 HTTPS 环境才能完全生效
            if (navigator.audioSession) {
                navigator.audioSession.type = 'play-and-record';
            }
            
            // 尝试使用 Media Session API 保持活跃
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
                // 设置元数据有助于某些系统保持后台活跃
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
            // 恢复默认
            if (navigator.audioSession) {
                navigator.audioSession.type = 'auto';
            }
        }
    } catch (e) {
        console.warn('Audio Session configuration failed:', e);
    }
};

function handleClearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！所有设置、聊天记录、图片等都将丢失。')) {
        localforage.clear().then(() => {
            localStorage.removeItem('iphoneSimConfig');
            alert('所有数据已清空，页面将刷新。');
            location.reload();
        }).catch(err => {
            console.error('清空数据失败:', err);
            alert('清空数据失败');
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
        alert('JSZip 库加载失败，无法导出 ZIP。将回退到 JSON 导出。');
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
            console.error('导出 ZIP 失败:', err);
            alert('导出 ZIP 失败');
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
                alert('配置导入成功，页面即将刷新');
                location.reload();
            });
        } catch (err) {
            alert('配置文件格式错误');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

// 应用所有配置
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

// 定时写日记检查逻辑
function checkScheduledDiaries() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    if (!window.iphoneSimState.contacts) return;

    window.iphoneSimState.contacts.forEach(contact => {
        if (contact.icityData && contact.icityData.autoDiaryEnabled && contact.icityData.autoDiaryTime) {
            // 检查时间是否匹配
            if (contact.icityData.autoDiaryTime === currentTimeStr) {
                // 检查今天是否已经生成过（避免重复生成）
                if (contact.icityData.lastAutoDiaryDate !== todayStr) {
                    console.log(`Triggering scheduled diary for ${contact.name} at ${currentTimeStr}`);
                    contact.icityData.lastAutoDiaryDate = todayStr;
                    saveConfig(); // 立即保存状态防止重复触发
                    
                    if (window.generateScheduledContactDiary) {
                        window.generateScheduledContactDiary(contact);
                    }
                }
            }
        }
    });
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('Script loaded');
    init();
    
    // 启动分钟级定时器
    setInterval(checkScheduledDiaries, 60000);
    // 立即检查一次（防止刚好错过这一分钟的开头）
    setTimeout(checkScheduledDiaries, 5000);
});

async function init() {
    setupIOSFullScreen();
    
    // 绑定 Dock 栏应用点击事件
    document.querySelectorAll('.dock-item').forEach(item => {
        item.addEventListener('click', () => {
            const appId = item.dataset.appId;
            const appName = item.querySelector('.app-label')?.textContent;
            handleAppClick(appId, appName);
        });
    });

    // 绑定通用关闭按钮
    const closeBtn = document.getElementById('close-theme-app');
    const appScreen = document.getElementById('theme-app');
    if (closeBtn) closeBtn.addEventListener('click', () => appScreen.classList.add('hidden'));
    
    const closeSettingsBtn = document.getElementById('close-settings-app');
    const settingsAppScreen = document.getElementById('settings-app');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsAppScreen.classList.add('hidden'));

    // 数据管理事件
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

    // 执行各模块的初始化监听器
    window.appInitFunctions.forEach(func => {
        if (typeof func === 'function') func();
    });

    try {
        await loadConfig();
    } catch (e) {
        console.error('加载配置失败:', e);
    }

    // 初始化购物UI
    if (window.initShoppingUI) window.initShoppingUI();

    // 更新 icity 资料卡
    if (window.renderIcityProfile) window.renderIcityProfile();
    if (window.renderIcityDiaryList) window.renderIcityDiaryList();
    if (window.renderIcityWorld) window.renderIcityWorld(); // Initialize world view content

    // 调用美化中心的UI更新（确保输入框显示当前值）
    if (window.updateThemeUi) window.updateThemeUi();

    try {
        if (window.renderWallpaperGallery) renderWallpaperGallery();
    } catch (e) { console.error('渲染壁纸画廊失败:', e); }

    try {
        if (window.renderChatWallpaperGallery) renderChatWallpaperGallery();
    } catch (e) { console.error('渲染聊天壁纸画廊失败:', e); }

    try {
        if (window.renderIconSettings) renderIconSettings();
    } catch (e) { console.error('渲染图标设置失败:', e); }

    try {
        applyConfig();
    } catch (e) { console.error('应用配置失败:', e); }
    
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
    if (window.updateSystemSettingsUi) updateSystemSettingsUi();
    if (window.updateAudioSession) window.updateAudioSession();
    if (window.renderContactList) renderContactList();
    if (window.migrateWorldbookData) migrateWorldbookData();
    if (window.renderWorldbookCategoryList) renderWorldbookCategoryList();
    if (window.renderMeTab) renderMeTab();
    if (window.renderMoments) renderMoments();
    if (window.applyChatMultiSelectClass) applyChatMultiSelectClass();
    
    // 初始化网格
    if (window.initGrid) window.initGrid();
    
    // 自动刷新适配
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
