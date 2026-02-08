// 查手机功能模块 (Phone Check App)

// 配置常量
const PHONE_GRID_ROWS = 6;
const PHONE_GRID_COLS = 4;
const PHONE_SLOTS_PER_PAGE = PHONE_GRID_ROWS * PHONE_GRID_COLS;

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
    } else if (lowerText.includes('heart') || lowerText.includes('❤')) {
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
            padding-top: 160px !important;
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
        #phone-weibo, #phone-icity, #phone-browser {
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
    phoneScreenData.forEach(item => {
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

        // 补丁：确保必有的应用（如闲鱼）存在
        const requiredApps = [
            { appId: 'phone-xianyu', name: '闲鱼', iconClass: 'fas fa-fish', color: '#FFDA44', type: 'app' }
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
                            occupied = phoneScreenData.some(existing => window.isCollision(existing, slots));
                        }
                    } else {
                        occupied = phoneScreenData.some(item => item.index === i);
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
            { index: 4, type: 'app', name: '闲鱼', iconClass: 'fas fa-fish', color: '#FFDA44', appId: 'phone-xianyu' }
        ];
    }
    
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
    phoneItemElementMap.forEach((el, id) => {
        if (!phoneScreenData.some(i => i._internalId === id)) {
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
    phoneScreenData.forEach(item => {
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

    phoneScreenData.forEach(item => {
        const slot = slots[item.index];
        if (!slot) return;

        const canDrag = isPhoneEditMode;
        let el = phoneItemElementMap.get(item._internalId);

        if (!el) {
            if (item.type === 'custom-json-widget' && window.createCustomJsonWidget) {
                el = window.createCustomJsonWidget(item, canDrag);
            } else if (item.type === 'app' && window.createAppElement) {
                el = window.createAppElement(item, canDrag);
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
}

function addPhoneDeleteButton(slot, item) {
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
    let victims = phoneScreenData.filter(i => i !== draggedItem && window.isCollision(i, newSlots));
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
    let victims = phoneScreenData.filter(i => i !== item && window.isCollision(i, newSlots));
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
            let collision = phoneScreenData.some(existing => window.isCollision(existing, slots));
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

    if (btnWechat) btnWechat.onclick = () => handlePhoneAppGenerate('wechat');
    if (btnWeibo) btnWeibo.onclick = () => handlePhoneAppGenerate('weibo');
    if (btnIcity) btnIcity.onclick = () => handlePhoneAppGenerate('icity');
    if (btnBrowser) btnBrowser.onclick = () => handlePhoneAppGenerate('browser');
    if (btnXianyu) btnXianyu.onclick = () => handlePhoneAppGenerate('xianyu');
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
        alert('未选择联系人');
        return;
    }
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentCheckPhoneContactId);
    if (!contact) {
        alert('联系人数据错误');
        return;
    }

    if (appType === 'wechat') {
        // 先尝试加载已有内容（如果有缓存，这里可以优化）
        // 但用户点击生成，通常意味着强制生成。
        // 读取内容逻辑移到打开应用时，这里只负责生成。
        await generatePhoneWechatMoments(contact);
    } else if (appType === 'browser') {
        await generatePhoneBrowserHistory(contact);
    } else if (appType === 'xianyu') {
        await generatePhoneXianyuAll(contact);
    } else {
        alert(`正在生成 ${contact.name} 的 ${appType} 内容...\n(功能开发中)`);
    }
}

async function generatePhoneWechatAll(contact) {
    const btn = document.getElementById('generate-wechat-btn');
    if (btn) {
        btn.disabled = true;
        btn.classList.add('generating-pulse');
    }

    const systemPrompt = `你是一个虚拟手机内容生成器。请为角色【${contact.name}】生成微信内容（包含聊天列表和朋友圈）。
角色设定：${contact.persona || '无'}

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

// 检查AI API配置
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
    
    // 验证AI设置
    const configErrors = validateAiSettings(settings);
    if (configErrors.length > 0) {
        const errorMsg = 'AI配置错误：\n' + configErrors.join('\n') + '\n\n请在设置中检查AI配置';
        alert(errorMsg);
        if (btn) {
            btn.classList.remove('generating-pulse');
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
        console.log('按钮元素:', btn);
        
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        console.log('开始AI生成请求:', {
            url: fetchUrl,
            model: settings.model,
            type: type,
            contactName: contact.name
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
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: '开始生成' }
                ],
                temperature: 0.7
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        console.log('AI API响应状态:', response.status, response.statusText);

        if (!response.ok) {
            let errorMsg = `API请求失败 (${response.status})`;
            try {
                const errorData = await response.text();
                console.error('API错误响应:', errorData);
                errorMsg += `: ${errorData}`;
            } catch (e) {
                console.error('无法读取错误响应:', e);
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();
        console.log('AI API响应数据结构:', {
            hasChoices: !!data.choices,
            choicesLength: data.choices?.length,
            hasMessage: !!data.choices?.[0]?.message,
            hasContent: !!data.choices?.[0]?.message?.content
        });
        
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
        } else if (type === 'browser' && Array.isArray(result)) {
            window.iphoneSimState.phoneContent[contact.id].browserHistory = result;
            renderPhoneBrowser(contact.id);
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
                    item.price = item.price.toString().replace(/[¥￥元\s]/g, '');
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
        }
        alert(errorMsg);
    } finally {
        if (btn) {
            btn.classList.remove('generating-pulse');
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
            }
        }
    }
}

async function generatePhoneWechatMoments(contact) {
    const btn = document.getElementById('generate-wechat-btn');
    if (btn) {
        btn.classList.add('generating-pulse');
        btn.disabled = true;
    }

    const systemPrompt = `你是一个虚拟手机内容生成器。请为角色【${contact.name}】生成微信朋友圈【信息流/Timeline】。
！！！重要！！！：你生成的是${contact.name}【看到的】朋友圈列表，而不是他/她【发的】列表。所以大部分内容应该来自【别人】。

角色设定：${contact.persona || '无'}

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

    const systemPrompt = `你是一个虚拟手机内容生成器。请为角色【${contact.name}】生成微信消息列表（聊天会话）及详细聊天记录。
角色设定：${contact.persona || '无'}

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
        const icon = item.icon || '📄';
        html += `
            <div style="padding: 15px 20px; background: #fff; ${borderStyle}; display: flex; align-items: center;">
                <div style="font-size: 24px; margin-right: 15px;">${icon}</div>
                <div style="flex: 1;">
                    <div style="font-size: 16px; color: #000; font-weight: 500;">${item.filename}</div>
                    <div style="font-size: 12px; color: #8e8e93;">已完成 • 2.5MB</div>
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
        footerText = `<i>💭 ${item.thoughts || ''}</i>`;
    } else if (type === 'bookmark') {
        footerText = `<i>💭 ${item.thoughts || ''}</i><br><br>⭐️ ${item.reason || ''}`;
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

    let userPersonaInfo = '';
    if (contact.userPersonaId) {
        const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
        if (p) userPersonaInfo = `用户(我)的设定：${p.name} - ${p.aiPrompt || ''}`;
    } else if (window.iphoneSimState.userProfile) {
        userPersonaInfo = `用户(我)的昵称：${window.iphoneSimState.userProfile.name}`;
    }

    const history = window.iphoneSimState.chatHistory[contact.id] || [];
    const recentChat = history.slice(-20).map(m => `${m.role === 'user' ? '用户' : contact.name}: ${m.content}`).join('\n');

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
人设：${contact.persona || '无'}
${userPersonaInfo}

【背景信息】
${worldbookInfo}
最近聊天：
${recentChat}

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
            msg: "🔥 本周热门商品排行榜出炉！",
            time: "18小时前"
        });
    } else {
        // 使用默认Mock数据
        mockChats = [
            { name: "快乐小狗", tag: "等待买家收货", tagColor: "#FF6600", msg: "[卖家已发货] 亲，这边已经帮您发货了哦", time: "13小时前", img: window.getSmartImage("闲置书籍") },
            { name: "数码爱好者", tag: "等待买家发货", tagColor: "#FF6600", msg: "好的，我明天寄出", time: "14小时前", img: window.getSmartImage("鼠标") },
            { name: "闲置清理", tag: "", tagColor: "", msg: "还在吗？诚心要", time: "14小时前", img: window.getSmartImage("自行车") },
            { name: "橘子汽水", tag: "交易成功", tagColor: "#00CC66", msg: "东西收到了，很喜欢！", time: "17小时前", img: window.getSmartImage("帆布包") },
            { name: "热门活动", isOfficial: true, msg: "🔥 本周热门商品排行榜出炉！", time: "18小时前" },
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
                    <div style="text-align: right; color: #000; font-weight: bold; font-size: 14px;">¥${item.price}</div>
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
                    <div style="color: #FF3B30; font-weight: bold; font-size: 16px;">¥${item.price}</div>
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
    description += `\n\n❌ 不退不换，看好再拍\n⚡ 急用钱，诚心出售\n📦 包装仔细，放心购买`;
    
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
                    <div style="font-size: 16px; font-weight: bold; color: #FF3B30; margin-top: 6px;">¥${item.price}</div>
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
                    <div style="text-align: right; color: #000; font-weight: bold; font-size: 14px;">¥${item.price}</div>
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

    // 获取用户设定和世界书信息
    const userPersona = window.iphoneSimState.userProfile?.persona || '';
    const worldBook = window.iphoneSimState.worldBook || '';
    const chatHistory = window.iphoneSimState.chatHistory[contact.id] || [];
    const recentChats = chatHistory.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');

    const systemPrompt = `你是一个虚拟手机内容生成器。请为角色【${contact.name}】生成闲鱼应用的完整内容。

【角色设定】
联系人信息：${contact.persona || '无特殊设定'}
用户身份：${userPersona}
世界书背景：${worldBook}

【参考资料：最近微信聊天记录】
${recentChats}
(注意：此聊天记录仅用于判断用户是否提到过"想要"、"喜欢"某样物品。如果用户明确表达了想要某个东西，请让角色在闲鱼"我买到的"或"消息"中体现正在购买该物品作为礼物。除此之外，闲鱼的聊天内容绝不能与微信聊天内容相似或模仿，必须是完全独立的二手交易对话。)

【任务要求】
生成一个完整的闲鱼用户档案，包含以下内容：

1. **我发布的商品** (published) - 3-6个商品
   - 根据角色设定生成符合其身份的二手商品
   - 每个商品包含：标题、价格、描述、图片关键词、曝光数、浏览数、想要数
   - 价格要合理，符合二手市场行情
   - 价格字段请只返回纯数字，不要包含"¥"、"￥"或"元"等符号

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
        document.getElementById('xianyu-chat-trade-price').textContent = `¥${chatData.price || '0'}`;
        
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
        console.log('初始化钱包，余额: ¥5000');
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
    
    if (window.iphoneSimState.wallet.balance < price) {
        console.log('余额不足，当前余额:', window.iphoneSimState.wallet.balance, '需要:', price);
        alert(`余额不足，当前余额: ¥${window.iphoneSimState.wallet.balance.toFixed(2)}，需要: ¥${price.toFixed(2)}\n请去微信-我-钱包充值`);
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
    if (balanceEl) balanceEl.textContent = `(¥${window.iphoneSimState.wallet.balance.toFixed(2)})`;
    
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

function handleXianyuPaymentConfirm(item, price) {
    // Deduct balance
    window.iphoneSimState.wallet.balance -= price;
    window.iphoneSimState.wallet.transactions.unshift({
        id: Date.now(),
        type: 'expense',
        amount: price,
        title: '闲鱼购物',
        time: Date.now(),
        relatedId: null
    });

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
            notifyContactAboutGift(item);
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

function notifyContactAboutGift(item) {
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
                price: item.price
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
