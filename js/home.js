// 主页/应用网格功能模块

const GRID_ROWS = 6;
const GRID_COLS = 4;
const SLOTS_PER_PAGE = GRID_ROWS * GRID_COLS;
let isEditMode = false;
let currentPage = 0;
let totalPages = 2; // 默认两页

// 长按和触摸拖拽相关变量
let longPressTimer = null;
let touchStartPos = { x: 0, y: 0 };
let touchCurrentPos = { x: 0, y: 0 };
let isTouchDragging = false;
let touchDraggedElement = null;
let touchDraggedItem = null;
let touchDragClone = null;

// 主屏幕上正在显示的图标/组件
let homeScreenData = [
    // 音乐组件 (占据前两行: Row 0-1)
    { index: 0, type: 'dom-element', elementId: 'music-widget', size: '4x2' },
    
    // 拍立得组件 (移到第3行第一个，即 Index 8，避免重叠)
    { index: 8, type: 'dom-element', elementId: 'polaroid-widget', size: '2x2' },
    
    // 其他 App (放在第4行: Index 12-15)
    { index: 24, type: 'app', name: 'icity', iconClass: 'fas fa-book', color: '#333', appId: 'icity-app' },
    { index: 25, type: 'app', name: '家园', iconClass: 'fas fa-house-chimney', color: '#F59E0B', appId: 'garden-app' },
    { index: 26, type: 'app', name: '日历', iconClass: 'fas fa-calendar-alt', color: '#FF3B30', appId: 'calendar-app' },
    { index: 28, type: 'app', name: 'LookUS', iconClass: 'fas fa-eye', color: '#FF2D55', appId: 'lookus-app' },
    { index: 10, type: 'app', name: '微信', iconClass: 'fab fa-weixin', color: '#07C160', appId: 'wechat-app' },
    { index: 11, type: 'app', name: '世界书', iconClass: 'fas fa-globe', color: '#007AFF', appId: 'worldbook-app' },
    { index: 13, type: 'app', name: '银行', iconClass: 'fas fa-building-columns', color: '#1E66F5', appId: 'bank-app' },
    { index: 14, type: 'app', name: '设置', iconClass: 'fas fa-cog', color: '#8E8E93', appId: 'settings-app' },
    { index: 15, type: 'app', name: '美化', iconClass: 'fas fa-paint-brush', color: '#5856D6', appId: 'theme-app' },
    { index: 16, type: 'app', name: '音乐', iconClass: 'fas fa-music', color: '#FF2D55', appId: 'music-app' },
];

// 系统内置组件定义 (用于从仓库恢复)
const systemWidgets = [
    { name: '音乐播放器', type: 'dom-element', elementId: 'music-widget', size: '4x2', previewColor: '#ff2d55' },
    { name: '拍立得', type: 'dom-element', elementId: 'polaroid-widget', size: '2x2', previewColor: '#ff9500' }
];

// 用户导入的 JSON 组件库
let importedWidgets = [];

// DOM 元素引用
const pagesWrapper = document.getElementById('pages-wrapper');
const pagesContainer = document.getElementById('pages-container');
const pageIndicators = document.getElementById('page-indicators');
const repository = document.getElementById('widget-repository');
const libraryModal = document.getElementById('widget-library-modal');
const widgetInput = document.getElementById('widget-file-input');

// 缓存 DOM 元素以支持 FLIP 动画和复用
let itemElementMap = new Map();

// --- 1. 初始化与渲染 ---

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function isSlotOccupied(slotIndex) {
    return homeScreenData.some(item => {
        const slots = getOccupiedSlots(item.index, item.size || '1x1');
        return slots && slots.includes(slotIndex);
    });
}

function findFirstAvailableSlot(preferredStart = 0, preferredEnd = SLOTS_PER_PAGE * totalPages, fallbackToWholeBoard = true) {
    for (let i = preferredStart; i < preferredEnd; i++) {
        if (!isSlotOccupied(i)) {
            return i;
        }
    }

    if (fallbackToWholeBoard) {
        for (let i = 0; i < SLOTS_PER_PAGE * totalPages; i++) {
            if (!isSlotOccupied(i)) {
                return i;
            }
        }
    }

    return null;
}

function initGrid() {
    // 救援行动：先把系统组件搬回仓库，防止丢失
    systemWidgets.forEach(sysWidget => {
        const el = document.getElementById(sysWidget.elementId);
        if (el && repository && el.parentNode !== repository) {
            repository.appendChild(el);
        }
    });

    // 确保每个 item 都有唯一 ID
    homeScreenData.forEach(item => {
        if (!item._internalId) item._internalId = generateId();
    });

    // 尝试读取存档
    loadLayout();

    // 强制添加 icity 应用 (如果不存在)
    if (!homeScreenData.some(item => item.appId === 'icity-app')) {
        homeScreenData.push({ 
            index: 24, 
            type: 'app', 
            name: 'icity', 
            iconClass: 'fas fa-book', 
            color: '#333', 
            appId: 'icity-app',
            _internalId: generateId()
        });
    }

    // 强制添加家园应用 (如果不存在)
    if (!homeScreenData.some(item => item.appId === 'garden-app')) {
        const targetIndex = findFirstAvailableSlot(25, SLOTS_PER_PAGE * 2);

        if (targetIndex !== null) {
            homeScreenData.push({
                index: targetIndex,
                type: 'app',
                name: '家园',
                iconClass: 'fas fa-house-chimney',
                color: '#F59E0B',
                appId: 'garden-app',
                _internalId: generateId()
            });
        }
    }

    // 强制添加 LookUS 应用 (如果不存在)
    if (!homeScreenData.some(item => item.appId === 'lookus-app')) {
        const targetIndex = findFirstAvailableSlot(28, SLOTS_PER_PAGE * 2);

        if (targetIndex !== null) {
            homeScreenData.push({ 
                index: targetIndex, 
                type: 'app', 
                name: 'LookUS', 
                iconClass: 'fas fa-eye', 
                color: '#FF2D55', 
                appId: 'lookus-app',
                _internalId: generateId()
            });
        }
    }

    // 强制添加日历应用 (如果不存在)
    if (!homeScreenData.some(item => item.appId === 'calendar-app')) {
        const targetIndex = findFirstAvailableSlot(26, SLOTS_PER_PAGE * 2);

        if (targetIndex !== null) {
            homeScreenData.push({
                index: targetIndex,
                type: 'app',
                name: '日历',
                iconClass: 'fas fa-calendar-alt',
                color: '#FF3B30',
                appId: 'calendar-app',
                _internalId: generateId()
            });
        }
    }

    // 强制添加银行应用 (如果不存在)
    if (!homeScreenData.some(item => item.appId === 'bank-app')) {
        // 查找空闲位置 (优先 index 13)
        let targetIndex = 13;
        const isOccupied = (idx) => homeScreenData.some(item => {
            const slots = getOccupiedSlots(item.index, item.size || '1x1');
            return slots && slots.includes(idx);
        });

        if (isOccupied(targetIndex)) {
            for (let i = 0; i < SLOTS_PER_PAGE * totalPages; i++) {
                if (!isOccupied(i)) {
                    targetIndex = i;
                    break;
                }
            }
        }

        homeScreenData.push({
            index: targetIndex,
            type: 'app',
            name: '银行',
            iconClass: 'fas fa-building-columns',
            color: '#1E66F5',
            appId: 'bank-app',
            _internalId: generateId()
        });
    }

    // 强制添加音乐应用 (如果不存在)
    if (!homeScreenData.some(item => item.appId === 'music-app')) {
        // 查找空闲位置 (优先 index 16)
        let targetIndex = 16;
        const isOccupied = (idx) => homeScreenData.some(item => {
            const slots = getOccupiedSlots(item.index, item.size || '1x1');
            return slots && slots.includes(idx);
        });

        if (isOccupied(targetIndex)) {
            for (let i = 0; i < SLOTS_PER_PAGE * totalPages; i++) {
                if (!isOccupied(i)) {
                    targetIndex = i;
                    break;
                }
            }
        }

        homeScreenData.push({
            index: targetIndex,
            type: 'app',
            name: '音乐',
            iconClass: 'fas fa-music',
            color: '#FF2D55',
            appId: 'music-app',
            _internalId: generateId()
        });
    }
    
    // 计算需要的总页数
    calculateTotalPages();
    
    // 渲染页面结构
    renderPages();
    
    // 渲染内容
    renderItems();
    renderLibrary();
    
    // 初始化滚动监听
    initScrollListener();

    // 检查布局更新
    checkAndShowUpdateModal();
}

function checkAndShowUpdateModal() {
    const currentVersion = '1.3'; // 布局版本号
    const savedVersion = localStorage.getItem('layout_version');
    
    // 如果没有版本号或者版本号不匹配，显示弹窗
    if (savedVersion !== currentVersion) {
        const modal = document.createElement('div');
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 9999; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(5px);';
        
        const content = document.createElement('div');
        content.style.cssText = 'background: #fff; width: 85%; max-width: 320px; padding: 25px; border-radius: 16px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);';
        
        content.innerHTML = `
            <div style="font-size: 40px; margin-bottom: 15px;">📱</div>
            <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">系统布局更新</h3>
            <p style="margin: 0 0 20px 0; color: #666; font-size: 14px; line-height: 1.5;">
                桌面布局已更新（第二页新增了家园应用）。<br>
                请点击下方按钮恢复默认布局以生效。
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button id="confirm-reset-layout" style="width: 100%; padding: 12px; background: #007AFF; color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer;">只恢复第二页布局</button>
                <button id="confirm-direct-enter" style="width: 100%; padding: 12px; background: #f2f2f7; color: #007AFF; border: none; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer;">直接进入</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        document.getElementById('confirm-reset-layout').onclick = () => {
            // Partial Reset: Keep Page 1 (indices < 24), Reset Page 2 (indices >= 24)
            // Default Page 2 items
            const defaultPage2 = [
                { index: 24, type: 'app', name: 'icity', iconClass: 'fas fa-book', color: '#333', appId: 'icity-app', _internalId: generateId() },
                { index: 25, type: 'app', name: '家园', iconClass: 'fas fa-house-chimney', color: '#F59E0B', appId: 'garden-app', _internalId: generateId() }
            ];
            
            // Filter current data to keep only Page 1
            const page1Items = homeScreenData.filter(item => item.index < 24);
            
            // Merge
            homeScreenData = [...page1Items, ...defaultPage2];
            
            saveLayout();
            localStorage.setItem('layout_version', currentVersion);
            location.reload();
        };

        document.getElementById('confirm-direct-enter').onclick = () => {
            // Check if slot 24 (Page 2, Slot 1) is occupied
            const isOccupied = homeScreenData.some(item => {
                // Check if item starts at 24
                if (item.index === 24) return true;
                // Check if item covers 24
                const slots = getOccupiedSlots(item.index, item.size || '1x1');
                return slots && slots.includes(24);
            });

            if (isOccupied) {
                if (confirm("第二页主屏幕的第一个位置（索引24）似乎被占用了，直接进入可能会导致布局错乱。确定要继续吗？")) {
                    localStorage.setItem('layout_version', currentVersion);
                    modal.remove(); // Close modal instead of reload to keep state
                }
            } else {
                localStorage.setItem('layout_version', currentVersion);
                modal.remove();
            }
        };
    }
}

function calculateTotalPages() {
    let maxIndex = -1;
    homeScreenData.forEach(item => {
        if (item.index > maxIndex) maxIndex = item.index;
    });
    // 至少两页，或者根据最大索引计算
    const neededPages = Math.floor(maxIndex / SLOTS_PER_PAGE) + 1;
    totalPages = Math.max(2, neededPages);
}

function renderPages() {
    pagesWrapper.innerHTML = '';
    pageIndicators.innerHTML = '';
    
    for (let p = 0; p < totalPages; p++) {
        // 创建页面
        const page = document.createElement('div');
        page.className = 'home-screen-page';
        
        const grid = document.createElement('div');
        grid.className = 'home-screen-grid';
        grid.id = `grid-page-${p}`;
        
        // 创建格子
        for (let i = 0; i < SLOTS_PER_PAGE; i++) {
            const globalIndex = p * SLOTS_PER_PAGE + i;
            const slot = document.createElement('div');
            slot.classList.add('grid-slot');
            slot.dataset.index = globalIndex;
            slot.dataset.page = p;
            
            // 绑定拖拽事件
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('dragleave', handleDragLeave);
            slot.addEventListener('drop', handleDrop);
            
            // 长按空白处进入编辑模式
            slot.addEventListener('touchstart', handleSlotTouchStart, { passive: false });
            slot.addEventListener('mousedown', handleSlotMouseDown);
            
            grid.appendChild(slot);
        }
        
        page.appendChild(grid);
        pagesWrapper.appendChild(page);
        
        // 创建指示器
        const dot = document.createElement('div');
        dot.className = `page-dot ${p === 0 ? 'active' : ''}`;
        pageIndicators.appendChild(dot);
    }
}

function initScrollListener() {
    pagesContainer.addEventListener('scroll', () => {
        const scrollLeft = pagesContainer.scrollLeft;
        const pageWidth = pagesContainer.clientWidth;
        const newPage = Math.round(scrollLeft / pageWidth);
        
        if (newPage !== currentPage) {
            currentPage = newPage;
            updateIndicators();
        }
    });
}

function updateIndicators() {
    const dots = pageIndicators.querySelectorAll('.page-dot');
    dots.forEach((dot, index) => {
        if (index === currentPage) dot.classList.add('active');
        else dot.classList.remove('active');
    });
}

function renderItems() {
    // 1. Cleanup orphans (items removed from data)
    itemElementMap.forEach((el, id) => {
        const exists = homeScreenData.some(i => i._internalId === id);
        if (!exists) {
            // Check if it is a system widget (dom-element)
            const isSystemWidget = systemWidgets.some(w => w.elementId === el.id);
            if (isSystemWidget && repository) {
                // Return to repository instead of destroying
                repository.appendChild(el);
            } else {
                if (el.parentNode) el.parentNode.removeChild(el);
            }
            itemElementMap.delete(id);
        }
    });

    // 2. Reset slots
    const slots = pagesWrapper.querySelectorAll('.grid-slot');
    slots.forEach(slot => {
        // Remove delete buttons only
        const delBtn = slot.querySelector('.delete-btn');
        if (delBtn) delBtn.remove();
        
        slot.className = 'grid-slot'; 
        slot.style.display = 'block'; 
        slot.style.gridColumn = 'auto';
        slot.style.gridRow = 'auto';
        slot.removeAttribute('style');
    });

    // 3. Edit mode styles
    const grids = pagesWrapper.querySelectorAll('.home-screen-grid');
    grids.forEach(grid => {
        if (isEditMode) grid.classList.add('edit-mode');
        else grid.classList.remove('edit-mode');
    });

    // 4. Hide covered slots
    let coveredIndices = [];
    homeScreenData.forEach(item => {
        if (item.size && item.size !== '1x1') {
            const occupied = getOccupiedSlots(item.index, item.size);
            if (occupied) {
                occupied.forEach(id => {
                    if (id !== item.index) coveredIndices.push(id);
                });
            }
        }
    });
    
    // 查找对应全局索引的 slot
    const getSlotByGlobalIndex = (idx) => {
        // 简单查找：所有 slot 按顺序排列
        return slots[idx];
    };

    coveredIndices.forEach(id => {
        const slot = getSlotByGlobalIndex(id);
        if (slot) slot.style.display = 'none';
    });

    // 5. Move items to new slots
    homeScreenData.forEach(item => {
        const slot = getSlotByGlobalIndex(item.index);
        if (!slot) return;

        const canDrag = isEditMode;
        let el = itemElementMap.get(item._internalId);

        if (!el) {
            if (item.type === 'dom-element') {
                el = document.getElementById(item.elementId);
                // Rescue from repository if needed
                if (!el && repository) {
                     // Try to find by ID in repository? 
                     // Actually systemWidgets logic handles this in initGrid.
                     // Here we assume it exists.
                }
            } else if (item.type === 'app') {
                el = createAppElement(item, canDrag);
            } else if (item.type === 'custom-json-widget') {
                el = createCustomJsonWidget(item, canDrag);
            }
            
            if (el) {
                itemElementMap.set(item._internalId, el);
                el.dataset.itemId = item._internalId;
            }
        }

        if (el) {
            el.setAttribute('draggable', canDrag);
            el.ondragstart = (e) => handleDragStart(e, item);
            el.ondragend = (e) => handleDragEnd(e, item);
            
            // 添加触摸事件支持
            if (canDrag) {
                el.addEventListener('touchstart', (e) => handleItemTouchStart(e, item), { passive: false });
                el.addEventListener('touchmove', handleItemTouchMove, { passive: false });
                el.addEventListener('touchend', (e) => handleItemTouchEnd(e, item), { passive: false });
            }

            // Fix: 更新 pointer-events，确保退出编辑模式后组件可交互
            if (item.type === 'custom-json-widget') {
                const content = el.firstChild;
                if (content) {
                    content.style.pointerEvents = isEditMode ? 'none' : 'auto';
                }
            }

            if (item.type === 'dom-element' || item.type === 'custom-json-widget') {
                applyWidgetSize(slot, item.size);
                slot.classList.add('widget-slot');
            }

            if (isEditMode) {
                // 只为非应用类型（即组件）添加删除按钮
                if (item.type !== 'app') {
                    addDeleteButton(slot, item);
                }
            }

            // Direct move (no detach/clear)
            if (el.parentNode !== slot) {
                slot.appendChild(el);
            }
        }
    });
}

// --- FLIP Animation Helpers ---
function capturePositions() {
    const positions = new Map();
    homeScreenData.forEach(item => {
        const el = itemElementMap.get(item._internalId);
        if (el && document.body.contains(el)) {
            positions.set(item._internalId, el.getBoundingClientRect());
        }
    });
    return positions;
}

function applyFlip(oldPositions) {
    homeScreenData.forEach(item => {
        const el = itemElementMap.get(item._internalId);
        const oldRect = oldPositions.get(item._internalId);
        
        // 跳过当前拖拽的元素
        if (item === currentDraggedItem) return;

        if (el && oldRect && document.body.contains(el)) {
            const newRect = el.getBoundingClientRect();
            const dx = oldRect.left - newRect.left;
            const dy = oldRect.top - newRect.top;
            
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                // Invert: 瞬间回到旧位置，禁用 transition
                el.style.transform = `translate(${dx}px, ${dy}px)`;
                el.style.transition = 'none';
                
                // Play: 下一帧恢复 transition 并清除 transform
                requestAnimationFrame(() => {
                    // 强制回流，确保 transition: none 生效
                    el.offsetHeight; 
                    
                    el.style.transform = '';
                    // 清除内联 transition，让 CSS 中的 transition 生效
                    el.style.transition = ''; 
                });
            }
        }
    });
}


// --- 2. 辅助创建函数 ---

function createAppElement(item, draggable) {
    const div = document.createElement('div');
    div.classList.add('draggable-item');
    div.setAttribute('draggable', draggable);
    
    // --- 适配美化功能 ---
    let finalColor = item.color || '#fff';
    if (typeof window.iphoneSimState !== 'undefined' && window.iphoneSimState.iconColors && window.iphoneSimState.iconColors[item.appId]) {
        finalColor = window.iphoneSimState.iconColors[item.appId];
    }

    let iconContent = `<i class="${item.iconClass}" style="color: ${finalColor === '#fff' ? '#000' : '#fff'};"></i>`;
    if (typeof window.iphoneSimState !== 'undefined' && window.iphoneSimState.icons && window.iphoneSimState.icons[item.appId]) {
        iconContent = `<img src="${window.iphoneSimState.icons[item.appId]}" style="width:100%; height:100%; object-fit:cover; border-radius:14px;">`;
    }

    let displayName = item.name;
    if (typeof window.iphoneSimState !== 'undefined' && window.iphoneSimState.appNames && window.iphoneSimState.appNames[item.appId]) {
        displayName = window.iphoneSimState.appNames[item.appId];
    }

    div.innerHTML = `
        <div class="app-icon-img" style="background-color: ${finalColor}">
            ${iconContent}
        </div>
        <span class="app-name">${displayName}</span>
    `;
    
    div.addEventListener('click', (e) => {
        if (!isEditMode && item.appId) {
            // 调用全局 app click 处理函数 (如果有)
            if (window.handleAppClick) {
                window.handleAppClick(item.appId, item.name);
            } else {
                const appScreen = document.getElementById(item.appId);
                if (appScreen) appScreen.classList.remove('hidden');
            }
        }
    });
    
    return div;
}

function createCustomJsonWidget(item, draggable) {
    const div = document.createElement('div');
    div.classList.add('custom-widget');
    div.setAttribute('draggable', draggable);
    div.style.width = '100%';
    div.style.height = '100%'; 
    
    const content = document.createElement('div');
    content.style.width = '100%'; content.style.height = '100%'; 
    content.style.borderRadius = '18px'; content.style.overflow = 'hidden';
    
    // Allow text selection inside widgets
    content.style.userSelect = 'text';
    content.style.webkitUserSelect = 'text';
    
    if(isEditMode) {
        content.style.pointerEvents = 'none'; 
    } else {
        content.style.pointerEvents = 'auto';
    }

    if (item.css) {
        const style = document.createElement('style');
        style.textContent = item.css;
        content.appendChild(style);
    }
    
    const htmlDiv = document.createElement('div');
    htmlDiv.innerHTML = item.html;
    htmlDiv.style.height = '100%';
    
    // 图片上传逻辑
    const silentSave = () => {
        try {
            localStorage.setItem('myIOS_HomeScreen', JSON.stringify(homeScreenData));
            localStorage.setItem('myIOS_Library', JSON.stringify(importedWidgets)); 
        } catch (e) { console.error(e); }
    };

    const processImage = (file, callback) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxDim = 600;
                let w = img.width; let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) { h *= maxDim/w; w = maxDim; }
                    else { w *= maxDim/h; h = maxDim; }
                }
                canvas.width = w; canvas.height = h;
                ctx.drawImage(img, 0, 0, w, h);
                callback(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
        reader.readAsDataURL(file);
    };
    
    const fileInputs = htmlDiv.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener('click', (e) => e.stopPropagation());
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            processImage(file, (base64) => {
                let targetImg = null;
                if (input.dataset.target) targetImg = htmlDiv.querySelector('#' + input.dataset.target);
                if (!targetImg) {
                    // Search previous siblings
                    let sibling = input.previousElementSibling;
                    while(sibling) {
                        if (sibling.tagName === 'IMG') { targetImg = sibling; break; }
                        sibling = sibling.previousElementSibling;
                    }
                }
                // Check parent (label) for img
                if (!targetImg && input.parentElement) targetImg = input.parentElement.querySelector('img');
                // Global search inside widget
                if (!targetImg) targetImg = htmlDiv.querySelector('img');

                if (targetImg) {
                    targetImg.setAttribute('src', base64);
                    targetImg.src = base64;
                    item.html = htmlDiv.innerHTML;
                    silentSave();
                }
            });
        });
    });

    // Explicitly bind click on images to find and trigger nearby file inputs
    // This fixes issues where label click might not work or be intercepted
    const images = htmlDiv.querySelectorAll('img');
    images.forEach(img => {
        // Find associated input
        let input = null;
        // 1. Check parent label
        if (img.parentElement && img.parentElement.tagName === 'LABEL') {
            input = img.parentElement.querySelector('input[type="file"]');
        }
        // 2. Check next sibling
        if (!input && img.nextElementSibling && img.nextElementSibling.tagName === 'INPUT' && img.nextElementSibling.type === 'file') {
            input = img.nextElementSibling;
        }
        
        if (input) {
            img.style.cursor = 'pointer';
            img.addEventListener('click', (e) => {
                if (!isEditMode) {
                    e.stopPropagation();
                    input.click();
                }
            });
        }
    });

    htmlDiv.addEventListener('input', () => { item.html = htmlDiv.innerHTML; });
    htmlDiv.addEventListener('blur', () => silentSave(), true);

    content.appendChild(htmlDiv);
    div.appendChild(content);
    return div;
}

function addDeleteButton(slot, item) {
    const btn = document.createElement('div');
    btn.className = 'delete-btn';
    btn.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`确定要移除 ${item.name || '这个组件'} 吗？`)) {
            removeItem(item);
        }
    };
    slot.appendChild(btn);
}

// --- 3. 核心拖拽逻辑 (iOS 风格) ---

let currentDraggedItem = null;
let lastDragTargetIndex = -1;
let dragThrottleTimer = null;
let isDropped = false;
let pageSwitchTimer = null;

function getOccupiedSlots(startIndex, size) {
    const indices = [];
    const pageIndex = Math.floor(startIndex / SLOTS_PER_PAGE);
    const localIndex = startIndex % SLOTS_PER_PAGE;
    
    const r = Math.floor(localIndex / GRID_COLS);
    const c = localIndex % GRID_COLS;
    
    let w = 1, h = 1;
    if (size === '2x2') { w = 2; h = 2; }
    if (size === '4x2') { w = 4; h = 2; }
    if (size === '4x3') { w = 4; h = 3; }
    if (size === '4x4') { w = 4; h = 4; }
    
    if (c + w > GRID_COLS) return null; // 越界
    if (r + h > GRID_ROWS) return null; // 越界

    for (let i = 0; i < h; i++) {
        for (let j = 0; j < w; j++) {
            indices.push(pageIndex * SLOTS_PER_PAGE + (r + i) * GRID_COLS + (c + j));
        }
    }
    return indices;
}

function handleDragStart(e, item) {
    currentDraggedItem = item;
    isDropped = false;
    e.dataTransfer.setData('text/plain', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    
    // 记录初始位置，用于每次重排前还原，确保“未受影响”的图标回到原位
    homeScreenData.forEach(i => i._originalIndex = i.index);
    
    // 设为完全透明，实现“不占格”的视觉效果
    setTimeout(() => {
        if (itemElementMap.has(item._internalId)) {
            itemElementMap.get(item._internalId).style.opacity = '0';
        }
    }, 0);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (!currentDraggedItem) return;

    // 自动翻页逻辑
    const containerRect = pagesContainer.getBoundingClientRect();
    const mouseX = e.clientX;
    
    // 靠近左边缘翻上一页
    if (mouseX < containerRect.left + 50) {
        if (!pageSwitchTimer && currentPage > 0) {
            pageSwitchTimer = setTimeout(() => {
                pagesContainer.scrollBy({ left: -containerRect.width, behavior: 'smooth' });
                pageSwitchTimer = null;
            }, 800);
        }
    } 
    // 靠近右边缘翻下一页
    else if (mouseX > containerRect.right - 50) {
        if (!pageSwitchTimer && currentPage < totalPages - 1) {
            pageSwitchTimer = setTimeout(() => {
                pagesContainer.scrollBy({ left: containerRect.width, behavior: 'smooth' });
                pageSwitchTimer = null;
            }, 800);
        }
    } else {
        if (pageSwitchTimer) {
            clearTimeout(pageSwitchTimer);
            pageSwitchTimer = null;
        }
    }

    // 节流
    if (dragThrottleTimer) return;
    dragThrottleTimer = setTimeout(() => { dragThrottleTimer = null; }, 50);

    const targetSlot = e.target.closest('.grid-slot');
    if (!targetSlot) return;
    
    const targetIndex = parseInt(targetSlot.dataset.index);
    
    if (targetIndex === lastDragTargetIndex) return;
    
    lastDragTargetIndex = targetIndex;

    // 1. Capture positions (current visual state)
    const oldPositions = capturePositions();

    // 2. Restore to original layout first!
    // 这步至关重要：每次计算都基于初始状态，这样当 A 离开 B 时，B 会自动回到 _originalIndex
    homeScreenData.forEach(i => {
        if (i._originalIndex !== undefined) i.index = i._originalIndex;
    });

    // 3. Reorder data (calculate new state from original state)
    reorderItems(currentDraggedItem, targetIndex);
    
    // 4. Render DOM
    renderItems(); 
    
    // 5. Animate
    applyFlip(oldPositions);
}

function handleDragLeave(e) {
    // 可选
}

function handleDrop(e) {
    e.preventDefault();
    isDropped = true;
    if (pageSwitchTimer) {
        clearTimeout(pageSwitchTimer);
        pageSwitchTimer = null;
    }
    saveLayout(); 
}

function handleDragEnd(e, item) {
    if (!isDropped) {
        // 如果取消拖拽，还原到初始状态
        homeScreenData.forEach(i => {
            if (i._originalIndex !== undefined) i.index = i._originalIndex;
        });
        renderItems();
    }

    // 清理
    homeScreenData.forEach(i => delete i._originalIndex);

    if (currentDraggedItem) {
        if (itemElementMap.has(currentDraggedItem._internalId)) {
            itemElementMap.get(currentDraggedItem._internalId).style.opacity = '';
        }
        currentDraggedItem = null;
    }
    lastDragTargetIndex = -1;
    pagesWrapper.querySelectorAll('.grid-slot').forEach(s => s.classList.remove('drag-preview'));
    
    if (pageSwitchTimer) {
        clearTimeout(pageSwitchTimer);
        pageSwitchTimer = null;
    }
}

// --- 4. 布局算法 ---

function reorderItems(draggedItem, targetIndex) {
    let newSlots = getOccupiedSlots(targetIndex, draggedItem.size || '1x1');
    if (!newSlots) return; // 越界
    
    // 找到所有与新位置冲突的 items
    let victims = homeScreenData.filter(i => i !== draggedItem && isCollision(i, newSlots));
    
    if (victims.length === 0) {
        draggedItem.index = targetIndex;
        return;
    }
    
    // 尝试交换逻辑 (Swap)
    // 如果只有一个受害者，且受害者能放入拖拽物的原位置，则交换
    if (victims.length === 1) {
        let victim = victims[0];
        let oldIndex = draggedItem.index;
        
        // 检查 victim 能否放入 oldIndex
        let victimNewSlots = getOccupiedSlots(oldIndex, victim.size || '1x1');
        if (victimNewSlots) {
            // 检查 victim 移过去后是否与其他 item (除了 draggedItem) 冲突
            let collision = homeScreenData.some(i => i !== draggedItem && i !== victim && isCollision(i, victimNewSlots));
            if (!collision) {
                // 执行交换
                victim.index = oldIndex;
                draggedItem.index = targetIndex;
                return;
            }
        }
    }
    
    // 如果无法交换（如大组件冲突，或多个受害者），回退到挤压逻辑
    draggedItem.index = targetIndex;
    // 对每个受害者进行挤压 (尝试移到下一个位置)
    // 为了避免连锁反应太乱，我们先排序，从 index 小的开始移
    victims.sort((a, b) => a.index - b.index);
    victims.forEach(victim => {
        // 尝试移到 targetIndex + 1 (或者 draggedItem 后面)
        // 简单起见，往后推
        shiftItem(victim, targetIndex + 1);
    });
}

function shiftItem(item, newIndex) {
    // 允许跨页移动，只要不超过总容量
    if (newIndex >= totalPages * SLOTS_PER_PAGE) {
        // 如果超出当前总页数，可能需要动态加页（这里简化处理，暂不动态加页，或者视为越界）
        return; 
    }
    
    // 检查新位置是否越界（对于大组件）
    let newSlots = getOccupiedSlots(newIndex, item.size || '1x1');
    if (!newSlots) {
        // 如果当前行放不下，尝试下一行开头？
        // 简单处理：尝试 +1 直到能放下
        return shiftItem(item, newIndex + 1);
    }
    
    item.index = newIndex;
    
    // 检查新位置是否有冲突
    let victims = homeScreenData.filter(i => i !== item && isCollision(i, newSlots));
    victims.forEach(v => shiftItem(v, v.index + 1));
}

function isCollision(item, targetSlots) {
    let itemSlots = getOccupiedSlots(item.index, item.size || '1x1');
    if (!itemSlots) return false;
    return targetSlots.some(s => itemSlots.includes(s));
}

// 兼容旧代码
function layoutItems(items) { return items; }

// --- 5. 添加与删除 ---

function removeItem(item) {
    const oldPositions = capturePositions();
    homeScreenData = homeScreenData.filter(d => d !== item);
    // 删除后自动重排
    // homeScreenData = layoutItems(homeScreenData.sort((a, b) => a.index - b.index));
    // 既然支持稀疏布局，删除后不需要重排，直接留空即可
    renderItems();
    applyFlip(oldPositions);
    saveLayout();
}

function addToScreen(widgetTemplate) {
    const oldPositions = capturePositions();
    // 1. 构造新 item
    const newItem = { ...widgetTemplate };
    if (!newItem._internalId) newItem._internalId = generateId();
    
    // 2. 寻找空位
    let freeIndex = -1;
    const maxSlots = totalPages * SLOTS_PER_PAGE;
    
    for(let i=0; i<maxSlots; i++) {
        let slots = getOccupiedSlots(i, newItem.size || '1x1');
        if (slots) {
            let collision = homeScreenData.some(existing => isCollision(existing, slots));
            if (!collision) {
                freeIndex = i;
                break;
            }
        }
    }
    
    if (freeIndex !== -1) {
        newItem.index = freeIndex;
        homeScreenData.push(newItem);
        libraryModal.classList.remove('show');
        renderItems();
        applyFlip(oldPositions);
        saveLayout();
    } else {
        alert("主屏幕空间不足，无法放置该组件。");
    }
}

// --- 6. 工具栏与保存 ---

function toggleEditMode() {
    isEditMode = !isEditMode;
    const toolbar = document.getElementById('edit-mode-toolbar');
    if (isEditMode) {
        toolbar.classList.remove('hidden');
    } else {
        toolbar.classList.add('hidden');
    }
    renderItems();
}

function saveLayout() {
    try {
        localStorage.setItem('myIOS_HomeScreen', JSON.stringify(homeScreenData));
        localStorage.setItem('myIOS_Library', JSON.stringify(importedWidgets));
        // toggleEditMode(); // 保存时不一定退出编辑模式
        // alert("布局保存成功！"); // 自动保存不需要弹窗
    } catch (e) {
        console.error(e);
        alert("保存失败：可能是存储空间不足。");
    }
}

function loadLayout() {
    try {
        const savedScreen = localStorage.getItem('myIOS_HomeScreen');
        const savedLib = localStorage.getItem('myIOS_Library');
        let removedLegacyWhisperApp = false;
        if (savedScreen) {
            homeScreenData = JSON.parse(savedScreen);
            if (Array.isArray(homeScreenData)) {
                const filteredScreen = homeScreenData.filter(item => item && item.appId !== 'whisper-challenge-app');
                removedLegacyWhisperApp = filteredScreen.length !== homeScreenData.length;
                homeScreenData = filteredScreen;
            }
            // 确保加载的数据有 ID
            homeScreenData.forEach(item => {
                if (!item._internalId) item._internalId = generateId();
            });
        }
        if (savedLib) importedWidgets = JSON.parse(savedLib);
        if (removedLegacyWhisperApp) {
            localStorage.setItem('myIOS_HomeScreen', JSON.stringify(homeScreenData));
        }
    } catch (e) { console.error("Load failed", e); }
}

// --- 7. 组件库界面 ---

function renderLibrary() {
    const sysRow = document.getElementById('lib-system-row');
    const custRow = document.getElementById('lib-custom-row');
    
    sysRow.innerHTML = '';
    systemWidgets.forEach(widget => {
        sysRow.appendChild(createLibraryItem(widget, false));
    });

    custRow.innerHTML = '';
    if (importedWidgets.length === 0) {
        custRow.innerHTML = '<div style="color:#888; padding:10px;">暂无导入</div>';
    } else {
        importedWidgets.forEach((widget, index) => {
            custRow.appendChild(createLibraryItem(widget, true, index));
        });
    }
}

function createLibraryItem(widget, isCustom = false, index = null) {
    const el = document.createElement('div');
    el.className = 'library-item';
    el.style.position = 'relative';
    
    let previewHtml = '';
    if (widget.type === 'dom-element') {
        previewHtml = `<div style="width:100%; height:100%; background:${widget.previewColor || '#ccc'}; display:flex; align-items:center; justify-content:center; color:white; font-size:24px;"><i class="fas fa-cube"></i></div>`;
    } else {
        previewHtml = `<div style="transform:scale(0.5); transform-origin:top left; width:200%; height:200%; overflow:hidden;">${widget.html}</div>`;
        if(widget.css) previewHtml = `<style>${widget.css}</style>` + previewHtml;
    }

    el.innerHTML = `
        <div class="library-preview-box size-${widget.size}">
            <div style="width:100%; height:100%; overflow:hidden;">${previewHtml}</div>
        </div>
        <div class="library-item-name">${widget.name}</div>
    `;

    el.onclick = (e) => {
        if (e.target.closest('.lib-delete-btn')) return;
        addToScreen(widget);
    };

    if (isCustom && index !== null) {
        const delBtn = document.createElement('div');
        delBtn.className = 'lib-delete-btn';
        delBtn.innerHTML = '&times;';
        delBtn.style.cssText = `
            position: absolute; top: 0px; right: 0; width: 20px; height: 20px;
            background: rgba(255, 59, 48, 0.9); color: white; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; font-weight: bold; line-height: 1; cursor: pointer; z-index: 10;
        `;
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteImportedWidget(index);
        };
        el.appendChild(delBtn);
    }

    return el;
}

function deleteImportedWidget(index) {
    if (confirm('确定要从库中删除此组件吗？')) {
        importedWidgets.splice(index, 1);
        localStorage.setItem('myIOS_Library', JSON.stringify(importedWidgets));
        renderLibrary();
    }
}

function applyWidgetSize(slot, size) {
    if (size === '4x2') { 
        slot.style.gridColumn = 'span 4'; 
        slot.style.gridRow = 'span 2';
        slot.style.height = '150px'; 
    }
    else if (size === '2x2') { 
        slot.style.gridColumn = 'span 2'; 
        slot.style.gridRow = 'span 2'; 
        slot.style.height = '150px';
    }
    else if (size === '4x3') { 
        slot.style.gridColumn = 'span 4'; 
        slot.style.gridRow = 'span 3'; 
        slot.style.height = '230px'; // 3行(60*3) + 2间隙(20*2) + 10px微调
    }
    else if (size === '4x4') { 
        slot.style.gridColumn = 'span 4'; 
        slot.style.gridRow = 'span 4'; 
        slot.style.height = '310px'; // 4行(60*4) + 3间隙(20*3) + 10px微调
    }
}

// --- 8. 长按和触摸拖拽功能 ---

// 处理空白格子的触摸开始（用于长按进入编辑模式）
function handleSlotTouchStart(e) {
    const slot = e.currentTarget;
    if (e.target !== slot) return; // 只处理空白格子
    
    clearTimeout(longPressTimer);
    
    const touch = e.touches[0];
    touchStartPos = { x: touch.clientX, y: touch.clientY };
    
    // 添加长按反馈效果
    slot.style.transition = 'background-color 0.5s';
    
    longPressTimer = setTimeout(() => {
        if (!isEditMode) {
            // 震动反馈（如果设备支持）
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            slot.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            toggleEditMode();
        }
    }, 500); // 500ms 长按
    
    // 监听移动和结束事件来取消长按
    const cancelLongPress = () => {
        clearTimeout(longPressTimer);
        slot.style.backgroundColor = '';
        slot.style.transition = '';
        document.removeEventListener('touchmove', checkMove);
        document.removeEventListener('touchend', cancelLongPress);
    };
    
    const checkMove = (e) => {
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchStartPos.x);
        const dy = Math.abs(touch.clientY - touchStartPos.y);
        if (dx > 10 || dy > 10) {
            cancelLongPress();
        }
    };
    
    document.addEventListener('touchmove', checkMove, { passive: true });
    document.addEventListener('touchend', cancelLongPress, { once: true });
}

// 处理空白格子的鼠标按下（用于长按进入编辑模式）
function handleSlotMouseDown(e) {
    const slot = e.currentTarget;
    if (e.target !== slot) return; // 只处理空白格子
    
    clearTimeout(longPressTimer);
    
    touchStartPos = { x: e.clientX, y: e.clientY };
    
    // 添加长按反馈效果
    slot.style.transition = 'background-color 0.5s';
    
    longPressTimer = setTimeout(() => {
        if (!isEditMode) {
            slot.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            toggleEditMode();
        }
    }, 500); // 500ms 长按
    
    // 监听移动和结束事件来取消长按
    const cancelLongPress = () => {
        clearTimeout(longPressTimer);
        slot.style.backgroundColor = '';
        slot.style.transition = '';
        document.removeEventListener('mousemove', checkMove);
        document.removeEventListener('mouseup', cancelLongPress);
    };
    
    const checkMove = (e) => {
        const dx = Math.abs(e.clientX - touchStartPos.x);
        const dy = Math.abs(e.clientY - touchStartPos.y);
        if (dx > 10 || dy > 10) {
            cancelLongPress();
        }
    };
    
    document.addEventListener('mousemove', checkMove);
    document.addEventListener('mouseup', cancelLongPress, { once: true });
}

// 处理图标的触摸开始
function handleItemTouchStart(e, item) {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    // 清理之前可能残留的克隆元素
    if (touchDragClone && touchDragClone.parentNode) {
        touchDragClone.parentNode.removeChild(touchDragClone);
        touchDragClone = null;
    }
    
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    
    touchStartPos = {
        x: touch.clientX,
        y: touch.clientY,
        offsetX: touch.clientX - rect.left,
        offsetY: touch.clientY - rect.top
    };
    touchCurrentPos = { x: touch.clientX, y: touch.clientY };
    
    touchDraggedElement = e.currentTarget;
    touchDraggedItem = item;
    isTouchDragging = false;
    
    // 记录初始位置
    homeScreenData.forEach(i => i._originalIndex = i.index);
    
    // 创建拖拽克隆
    touchDragClone = touchDraggedElement.cloneNode(true);
    touchDragClone.style.cssText = `
        position: fixed;
        pointer-events: none;
        z-index: 10000;
        opacity: 0.8;
        transform: scale(1.1);
        transition: none;
        width: ${rect.width}px;
        height: ${rect.height}px;
        left: ${rect.left}px;
        top: ${rect.top}px;
    `;
    touchDragClone.classList.add('touch-drag-clone'); // 添加标识类
    
    document.body.appendChild(touchDragClone);
    
    // 隐藏原始元素
    touchDraggedElement.style.opacity = '0';
    touchDraggedElement.style.visibility = 'hidden';
}

// 处理图标的触摸移动
function handleItemTouchMove(e) {
    if (!touchDraggedItem || !touchDragClone) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    touchCurrentPos = { x: touch.clientX, y: touch.clientY };
    
    const dx = touchCurrentPos.x - touchStartPos.x;
    const dy = touchCurrentPos.y - touchStartPos.y;
    
    // 开始拖拽
    if (!isTouchDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        isTouchDragging = true;
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }
    
    if (isTouchDragging) {
        // 更新克隆位置 - 使用触摸点减去偏移量
        touchDragClone.style.left = (touchCurrentPos.x - touchStartPos.offsetX) + 'px';
        touchDragClone.style.top = (touchCurrentPos.y - touchStartPos.offsetY) + 'px';
        
        // 查找当前触摸位置下的格子
        const targetSlot = document.elementFromPoint(touchCurrentPos.x, touchCurrentPos.y)?.closest('.grid-slot');
        
        if (targetSlot) {
            const targetIndex = parseInt(targetSlot.dataset.index);
            
            if (targetIndex !== lastDragTargetIndex && !isNaN(targetIndex)) {
                lastDragTargetIndex = targetIndex;
                
                // 自动翻页逻辑
                const containerRect = pagesContainer.getBoundingClientRect();
                if (touchCurrentPos.x < containerRect.left + 50 && currentPage > 0) {
                    if (!pageSwitchTimer) {
                        pageSwitchTimer = setTimeout(() => {
                            pagesContainer.scrollBy({ left: -containerRect.width, behavior: 'smooth' });
                            pageSwitchTimer = null;
                        }, 800);
                    }
                } else if (touchCurrentPos.x > containerRect.right - 50 && currentPage < totalPages - 1) {
                    if (!pageSwitchTimer) {
                        pageSwitchTimer = setTimeout(() => {
                            pagesContainer.scrollBy({ left: containerRect.width, behavior: 'smooth' });
                            pageSwitchTimer = null;
                        }, 800);
                    }
                } else {
                    if (pageSwitchTimer) {
                        clearTimeout(pageSwitchTimer);
                        pageSwitchTimer = null;
                    }
                }
                
                // 重新排列
                const oldPositions = capturePositions();
                
                homeScreenData.forEach(i => {
                    if (i._originalIndex !== undefined) i.index = i._originalIndex;
                });
                
                reorderItems(touchDraggedItem, targetIndex);
                
                // 手动移动其他元素，不重新渲染拖拽中的元素
                const slots = document.querySelectorAll('.grid-slot');
                homeScreenData.forEach(item => {
                    if (item === touchDraggedItem) return;
                    
                    const el = itemElementMap.get(item._internalId);
                    const targetSlot = slots[item.index];
                    
                    if (el && targetSlot && el.parentNode !== targetSlot) {
                        targetSlot.appendChild(el);
                    }
                });
                
                applyFlip(oldPositions);
            }
        }
    }
}

// 处理图标的触摸结束
function handleItemTouchEnd(e, item) {
    if (!touchDraggedItem) return;
    
    e.preventDefault();
    
    // 清理所有可能的拖拽克隆元素（包括可能残留的）
    document.querySelectorAll('.touch-drag-clone').forEach(clone => {
        if (clone.parentNode) {
            clone.parentNode.removeChild(clone);
        }
    });
    touchDragClone = null;
    
    // 恢复所有元素的可见性（防止有元素被遗漏）
    document.querySelectorAll('.draggable-item, .custom-widget, #music-widget, #polaroid-widget').forEach(el => {
        if (el.style.opacity === '0' || el.style.visibility === 'hidden') {
            el.style.opacity = '';
            el.style.visibility = '';
        }
    });
    
    // 保存布局或还原
    if (isTouchDragging) {
        // 清理状态
        homeScreenData.forEach(i => delete i._originalIndex);
        // 完整重新渲染以确保状态正确
        renderItems();
        saveLayout();
    } else {
        // 如果没有拖拽，还原位置
        homeScreenData.forEach(i => {
            if (i._originalIndex !== undefined) i.index = i._originalIndex;
        });
        homeScreenData.forEach(i => delete i._originalIndex);
        renderItems();
    }
    
    // 清理状态
    touchDraggedItem = null;
    touchDraggedElement = null;
    isTouchDragging = false;
    lastDragTargetIndex = -1;
    
    if (pageSwitchTimer) {
        clearTimeout(pageSwitchTimer);
        pageSwitchTimer = null;
    }
}

// 初始化监听器
function setupHomeListeners() {
    document.getElementById('add-widget-btn').onclick = () => {
        libraryModal.classList.add('show');
        renderLibrary();
    };
    document.getElementById('close-library-btn').onclick = () => libraryModal.classList.remove('show');
    document.getElementById('exit-edit-btn').onclick = toggleEditMode;
    document.getElementById('save-layout-btn').onclick = () => {
        saveLayout();
        toggleEditMode();
        alert("布局保存成功！");
    };
    document.getElementById('import-json-btn').onclick = () => widgetInput.click();

    widgetInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                if(data.html && data.size) {
                    importedWidgets.push({
                        name: data.name || '未命名组件',
                        type: 'custom-json-widget',
                        size: data.size,
                        html: data.html,
                        css: data.css
                    });
                    renderLibrary();
                    alert("导入成功！");
                } else {
                    alert("文件格式不正确");
                }
            } catch(err) { alert("解析失败"); }
        };
        reader.readAsText(file);
        widgetInput.value = '';
    };
}

if (window.appInitFunctions) {
    window.appInitFunctions.push(setupHomeListeners);
}

window.initGrid = initGrid;
window.renderItems = renderItems;
window.createCustomJsonWidget = createCustomJsonWidget;
window.createAppElement = createAppElement;
window.getOccupiedSlots = getOccupiedSlots;
window.isCollision = isCollision;
window.applyWidgetSize = applyWidgetSize;
