// 购物应用功能模块

// 状态
let isShoppingManageMode = false;
let selectedShoppingProducts = new Set();
let currentShoppingProduct = null;

// 切换 Tab
window.switchShoppingTab = function(tabName) {
    // 1. Update Tab Bar
    const tabs = document.querySelectorAll('#shopping-app .wechat-tab-item');
    tabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // 2. Update Content
    const contents = document.querySelectorAll('#shopping-app .shopping-tab-content');
    contents.forEach(content => {
        if (content.id === `shopping-tab-${tabName}`) {
            content.style.display = 'block';
            // 添加自然过渡动画 (仅针对购物车和订单页)
            // 购物车页面单独在 renderShoppingCart 中处理动画，避免父容器transform影响fixed定位
            if (tabName === 'orders') {
                content.classList.remove('shopping-tab-enter');
                void content.offsetWidth; // Trigger reflow
                content.classList.add('shopping-tab-enter');
            } else if (tabName === 'cart') {
                content.classList.remove('shopping-tab-enter');
            }
        } else {
            content.style.display = 'none';
            content.classList.remove('shopping-tab-enter');
        }
    });

    // 3. Update Header Buttons
    const linkBtn = document.getElementById('shopping-link-contact-btn');
    const menuBtn = document.getElementById('shopping-menu-btn');
    if (tabName === 'cart' || tabName === 'orders') {
        if (linkBtn) linkBtn.classList.add('hidden');
        if (menuBtn) menuBtn.classList.add('hidden');
    } else {
        if (linkBtn) linkBtn.classList.remove('hidden');
        if (menuBtn) menuBtn.classList.remove('hidden');
    }

    if (tabName === 'cart') {
        renderShoppingCart(true);
    } else if (tabName === 'orders') {
        updateShoppingOrderStatuses();
        renderShoppingOrders();
    } else if (tabName === 'delivery') {
        renderDeliveryItems();
    }
};

// 确保购物页面容器存在
function ensureShoppingContainer() {
    const container = document.getElementById('shopping-tab-home');
    if (!container) return false;

    let waterfallContainer = container.querySelector('.shopping-waterfall-container');
    if (!waterfallContainer) {
        // 清除初始的空状态/默认内容
        if (!window.iphoneSimState.shoppingProducts || window.iphoneSimState.shoppingProducts.length === 0) {
             container.innerHTML = '';
        } else {
             // 如果有数据但没容器，可能是重新渲染，清空一下比较安全
             container.innerHTML = '';
        }

        waterfallContainer = document.createElement('div');
        waterfallContainer.className = 'shopping-waterfall-container';
        waterfallContainer.style.display = 'flex';
        waterfallContainer.style.gap = '10px';
        waterfallContainer.style.padding = '10px';
        waterfallContainer.style.alignItems = 'flex-start';
        
        const col1 = document.createElement('div');
        col1.id = 'shopping-col-1';
        col1.style.flex = '1';
        col1.style.display = 'flex';
        col1.style.flexDirection = 'column';
        col1.style.gap = '10px';
        
        const col2 = document.createElement('div');
        col2.id = 'shopping-col-2';
        col2.style.flex = '1';
        col2.style.display = 'flex';
        col2.style.flexDirection = 'column';
        col2.style.gap = '10px';
        
        waterfallContainer.appendChild(col1);
        waterfallContainer.appendChild(col2);
        container.appendChild(waterfallContainer);
    }
    return true;
}

// 确保外卖页面容器存在
function ensureDeliveryContainer() {
    const container = document.getElementById('shopping-tab-delivery');
    if (!container) return false;

    let deliveryContainer = container.querySelector('.delivery-container');
    if (!deliveryContainer) {
        // 清除初始状态
        if (!window.iphoneSimState.deliveryItems || window.iphoneSimState.deliveryItems.length === 0) {
             container.innerHTML = '';
        } else {
             container.innerHTML = '';
        }

        deliveryContainer = document.createElement('div');
        deliveryContainer.className = 'delivery-container';
        deliveryContainer.style.padding = '10px';
        deliveryContainer.style.display = 'flex';
        deliveryContainer.style.flexDirection = 'column';
        deliveryContainer.style.gap = '10px';
        
        container.appendChild(deliveryContainer);
    }
    return true;
}

// 注入样式
function injectShoppingStyles() {
    if (document.getElementById('shopping-styles')) return;
    const style = document.createElement('style');
    style.id = 'shopping-styles';
    style.textContent = `
        :root {
            --shopping-bg: #f2f2f7;
            --shopping-card-bg: #ffffff;
            --shopping-text-primary: #000000;
            --shopping-text-secondary: #8e8e93;
            --shopping-accent: #000000; /* Minimalist Black */
            --shopping-accent-blue: #007AFF;
            --shopping-price: #000000; /* Minimalist Black for price too, or keep subtle */
            --shopping-shadow: 0 4px 12px rgba(0,0,0,0.08);
            --shopping-radius: 16px;
        }

        #shopping-app {
            background-color: var(--shopping-bg) !important;
            font-family: -apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", sans-serif;
        }

        /* 简约卡片样式 */
        .shopping-card {
            position: relative;
            background: var(--shopping-card-bg);
            border-radius: var(--shopping-radius);
            overflow: hidden;
            box-shadow: var(--shopping-shadow);
            transition: transform 0.2s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.2s;
            border: none;
        }
        
        .shopping-card:active {
            transform: scale(0.96);
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .shopping-card.manage-active {
            transform: scale(0.95);
            box-shadow: 0 0 0 2px var(--shopping-accent-blue);
        }

        .shopping-card-content {
            padding: 12px;
        }

        .shopping-card-title {
            font-size: 15px;
            font-weight: 600;
            color: var(--shopping-text-primary);
            margin-bottom: 6px;
            line-height: 1.3;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .shopping-card-meta {
            display: flex;
            align-items: baseline;
            justify-content: space-between;
            margin-top: 8px;
        }

        .shopping-card-price {
            font-size: 17px;
            font-weight: 700;
            color: var(--shopping-text-primary);
        }
        
        .shopping-card-price::before {
            content: '¥';
            font-size: 12px;
            margin-right: 1px;
            font-weight: 500;
        }

        .shopping-card-shop {
            font-size: 11px;
            color: var(--shopping-text-secondary);
            display: flex;
            align-items: center;
        }

        /* 复选框样式 */
        .shopping-checkbox {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 24px;
            height: 24px;
            background: rgba(255,255,255,0.9);
            border: 1px solid rgba(0,0,0,0.1);
            border-radius: 50%;
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .shopping-checkbox.checked {
            background: var(--shopping-accent-blue);
            border-color: transparent;
        }
        .shopping-checkbox.checked::after {
            content: '';
            width: 10px;
            height: 5px;
            border-left: 2px solid #fff;
            border-bottom: 2px solid #fff;
            transform: rotate(-45deg);
            margin-top: -2px;
        }
        .manage-mode .shopping-checkbox {
            display: flex;
        }

        /* 详情页样式 */
        .shopping-detail-modal {
            background: #fff;
            border-radius: 20px 20px 0 0;
            box-shadow: 0 -10px 30px rgba(0,0,0,0.1);
        }
        
        .shopping-btn-primary {
            background: #000;
            color: #fff;
            border: none;
            border-radius: 25px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: opacity 0.2s;
        }
        
        .shopping-btn-primary:active {
            opacity: 0.8;
        }

        .shopping-btn-secondary {
            background: #f2f2f7;
            color: #000;
            border: none;
            border-radius: 25px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 600;
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        
        .shopping-btn-secondary:active {
            background: #e5e5ea;
        }

        /* 购物车列表 */
        .cart-item-modern {
            background: #fff;
            border-radius: 16px;
            padding: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            position: relative;
            overflow: hidden;
            transition: transform 0.2s;
        }

        .cart-item-modern:active {
            transform: scale(0.98);
        }

        /* 订单列表 */
        .order-card-modern {
            background: #fff;
            border-radius: 16px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }

        .order-status-badge {
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 12px;
            background: #f2f2f7;
            color: #000;
            font-weight: 500;
        }
        
        .order-status-badge.active {
            background: #000;
            color: #fff;
        }

        /* 外卖卡片 */
        .delivery-card-modern {
            background: #fff;
            border-radius: 16px;
            padding: 12px;
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.04);
            transition: transform 0.2s;
            position: relative;
        }
        
        .delivery-card-modern:active {
            transform: scale(0.98);
        }
        
        .delivery-card-modern.manage-active {
            box-shadow: 0 0 0 2px var(--shopping-accent-blue);
        }

        /* 隐藏的消息样式覆盖 */
        .message-content.pay-request-msg,
        .message-content.shopping-gift-msg,
        .message-content.delivery-share-msg {
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
        }
        .message-content.pay-request-msg::before,
        .message-content.pay-request-msg::after,
        .message-content.shopping-gift-msg::before,
        .message-content.shopping-gift-msg::after,
        .message-content.delivery-share-msg::before,
        .message-content.delivery-share-msg::after {
            display: none !important;
        }

        /* 动画定义 */
        @keyframes shoppingFadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @keyframes shoppingScaleIn {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        .shopping-anim-item {
            opacity: 0; /* 初始隐藏，等待动画执行 */
            animation: shoppingFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        /* 页面切换动画 - 移除导致fixed定位异常的scale变换 */
        .shopping-tab-content {
            /* animation: shoppingScaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); */
        }

        /* 自然过渡动画 */
        @keyframes shoppingPageEnter {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .shopping-tab-enter {
            animation: shoppingPageEnter 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }

        /* 规格选择样式 */
        .spec-group {
            margin-bottom: 15px;
        }
        .spec-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }
        .spec-options {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        .spec-option-btn {
            padding: 6px 12px;
            border-radius: 16px;
            background: #f5f5f5;
            color: #333;
            font-size: 13px;
            border: 1px solid transparent;
            cursor: pointer;
            transition: all 0.2s;
        }
        .spec-option-btn.selected {
            background: #FFF0E6;
            color: #FF5000;
            border-color: #FF5000;
            font-weight: 500;
        }

        /* 订单进度条样式 */
        .order-progress-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            display: flex;
            align-items: flex-end;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }
        .order-progress-modal.active {
            opacity: 1;
            pointer-events: auto;
        }
        .order-progress-content {
            background: #fff;
            width: 100%;
            border-radius: 20px 20px 0 0;
            padding: 25px 20px;
            transform: translateY(100%);
            transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
            padding-bottom: calc(30px + env(safe-area-inset-bottom));
        }
        .order-progress-modal.active .order-progress-content {
            transform: translateY(0);
        }
        
        .progress-timeline {
            display: flex;
            justify-content: space-between;
            position: relative;
            margin: 40px 10px 50px;
        }
        /* Connecting Line Background */
        .progress-timeline::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            height: 3px;
            background: #f2f2f7;
            z-index: 0;
            border-radius: 2px;
        }
        /* Active Line - set width via JS */
        .progress-line-active {
            position: absolute;
            top: 10px;
            left: 10px;
            height: 3px;
            background: #000;
            z-index: 1;
            transition: width 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
            border-radius: 2px;
        }
        
        .progress-step {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 10px;
            width: 40px; 
        }
        .progress-dot {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: #fff;
            border: 3px solid #f2f2f7;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s;
            box-sizing: border-box;
        }
        .progress-dot.active {
            border-color: #000;
            background: #000;
        }
        .progress-dot.active::after {
            content: '';
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #fff;
        }
        .progress-label {
            font-size: 13px;
            color: #8e8e93;
            font-weight: 500;
            white-space: nowrap;
        }
        .progress-label.active {
            color: #000;
            font-weight: 600;
        }
        .progress-time {
            font-size: 11px;
            color: #8e8e93;
            position: absolute;
            top: 55px;
            width: 120px;
            text-align: center;
            line-height: 1.2;
        }
        
        /* 订单进度消息卡片 */
        .order-progress-msg {
            background: transparent !important;
            padding: 0 !important;
            box-shadow: none !important;
        }
        .order-progress-card {
            background: #fff;
            border-radius: 12px;
            padding: 15px;
            width: 260px;
            /* height: 100px; */ /* Let content define height, but keep it roughly 4:1 aspect ratio visually if needed, though width 260 height ~100 is close to 2.6:1 */
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }
    `;
    document.head.appendChild(style);
}

// 初始化监听器
function setupShoppingListeners() {
    injectShoppingStyles();

    // 启动订单状态检查定时器 (每10秒检查一次)
    setInterval(updateShoppingOrderStatuses, 10000);

    const closeBtn = document.getElementById('close-shopping-app');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('shopping-app').classList.add('hidden');
        });
    }

    const menuBtn = document.getElementById('shopping-menu-btn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            const currentTab = document.querySelector('#shopping-app .wechat-tab-item.active');
            const optGenerate = document.getElementById('shopping-opt-generate');
            const optAdd = document.getElementById('shopping-opt-add');
            const optManage = document.getElementById('shopping-opt-manage');
            
            if (currentTab && currentTab.dataset.tab === 'delivery') {
                // 外卖页选项
                if (optGenerate) optGenerate.querySelector('span').textContent = '生成外卖';
                if (optManage) optManage.querySelector('span').textContent = '管理外卖';
                if (optAdd) optAdd.classList.add('hidden');
            } else {
                // 商品页选项
                if (optGenerate) optGenerate.querySelector('span').textContent = '生成商品';
                if (optManage) optManage.querySelector('span').textContent = '管理商品';
                if (optAdd) optAdd.classList.remove('hidden');
            }
            document.getElementById('shopping-options-modal').classList.remove('hidden');
        });
    }

    // 选项菜单
    const optGenerate = document.getElementById('shopping-opt-generate');
    const optAdd = document.getElementById('shopping-opt-add');
    const optManage = document.getElementById('shopping-opt-manage');
    const optCancel = document.getElementById('shopping-opt-cancel');
    const modal = document.getElementById('shopping-options-modal');

    if (optGenerate) optGenerate.addEventListener('click', () => {
        modal.classList.add('hidden');
        generateShoppingProducts();
    });

    if (optAdd) optAdd.addEventListener('click', () => {
        modal.classList.add('hidden');
        document.getElementById('shopping-add-product-modal').classList.remove('hidden');
    });

    if (optManage) optManage.addEventListener('click', () => {
        modal.classList.add('hidden');
        enterShoppingManageMode();
    });

    if (optCancel) optCancel.addEventListener('click', () => modal.classList.add('hidden'));

    // 新增商品
    const closeAddBtn = document.getElementById('close-shopping-add-product');
    const saveAddBtn = document.getElementById('save-shopping-product-btn');
    const addModal = document.getElementById('shopping-add-product-modal');

    if (closeAddBtn) closeAddBtn.addEventListener('click', () => addModal.classList.add('hidden'));
    if (saveAddBtn) saveAddBtn.addEventListener('click', handleSaveShoppingProduct);

    // 管理模式
    const exitManageBtn = document.getElementById('exit-shopping-manage-btn');
    const deleteItemsBtn = document.getElementById('delete-shopping-items-btn');
    const selectAllBtn = document.getElementById('shopping-select-all-btn');

    if (exitManageBtn) exitManageBtn.addEventListener('click', exitShoppingManageMode);
    if (deleteItemsBtn) deleteItemsBtn.addEventListener('click', deleteSelectedShoppingItems);
    if (selectAllBtn) selectAllBtn.addEventListener('click', toggleSelectAllShoppingItems);

    const linkContactBtn = document.getElementById('shopping-link-contact-btn');
    if (linkContactBtn) {
        linkContactBtn.addEventListener('click', () => {
            openShoppingContactPicker();
        });
        // 初始化按钮状态
        updateLinkButtonState();
    }

    const shareBtn = document.getElementById('shopping-share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            console.log('Share button clicked', currentShoppingProduct);
            if (currentShoppingProduct) {
                openProductShareContactPicker(currentShoppingProduct);
            } else {
                alert('当前没有选中的商品');
            }
        });
    }

    // 详情页关闭按钮
    const closeDetailBtn = document.getElementById('close-shopping-detail');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
            document.getElementById('shopping-detail-screen').classList.add('hidden');
        });
    }

// 规格弹窗关闭
    const closeSpecBtn = document.getElementById('close-shopping-spec');
    if (closeSpecBtn) {
        closeSpecBtn.addEventListener('click', () => {
            document.getElementById('shopping-spec-modal').classList.add('hidden');
        });
    }

    const confirmSpecBtn = document.getElementById('confirm-shopping-spec-btn');
    if (confirmSpecBtn) {
        confirmSpecBtn.addEventListener('click', handleConfirmShoppingSpec);
    }

    // Bind Tab Clicks
    const tabs = document.querySelectorAll('#shopping-app .wechat-tab-item');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            if (tabName) {
                window.switchShoppingTab(tabName);
            }
        });
    });
}

function handleSaveShoppingProduct() {
    const title = document.getElementById('shopping-add-title').value.trim();
    const price = document.getElementById('shopping-add-price').value.trim();
    const shop = document.getElementById('shopping-add-shop').value.trim();
    const paid = document.getElementById('shopping-add-paid').value.trim();
    const desc = document.getElementById('shopping-add-desc').value.trim();

    if (!title || !price) {
        alert('请至少输入商品标题和价格');
        return;
    }

    const bgColor = window.getRandomPastelColor();
    // 如果没有输入图片描述，使用标题
    const imageDesc = desc ? desc.substring(0, 5) : title.substring(0, 5);
    
    // 生成图片
    const height = Math.floor(Math.random() * (250 - 150 + 1)) + 150;
    const imgUrl = generatePlaceholderImage(300, height, imageDesc, bgColor);

    const product = {
        id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
        title: title,
        price: parseFloat(price),
        paid_count: paid || '0',
        shop_name: shop || '个人小店',
        image_desc: imageDesc,
        detail_desc: desc || title,
        aiImage: null 
    };

    if (!window.iphoneSimState.shoppingProducts) {
        window.iphoneSimState.shoppingProducts = [];
    }
    // 新增商品显示在最前面
    window.iphoneSimState.shoppingProducts.unshift(product);
    saveConfig();

    ensureShoppingContainer();
    renderShoppingProducts(window.iphoneSimState.shoppingProducts);
    
    // 清空输入框
    document.getElementById('shopping-add-title').value = '';
    document.getElementById('shopping-add-price').value = '';
    document.getElementById('shopping-add-shop').value = '';
    document.getElementById('shopping-add-paid').value = '';
    document.getElementById('shopping-add-desc').value = '';
    
    document.getElementById('shopping-add-product-modal').classList.add('hidden');
    
    // 尝试为新商品生成AI图片
    if (desc) {
        (async () => {
            const url = await generateAiImage(desc);
            if (url) {
                product.aiImage = url;
                saveConfig();
                const imgEl = document.getElementById(`product-img-${product.id}`);
                if (imgEl) imgEl.src = url;
            }
        })();
    }
}

function enterShoppingManageMode() {
    isShoppingManageMode = true;
    selectedShoppingProducts.clear();
    
    document.getElementById('shopping-manage-header').classList.remove('hidden');
    
    const container = document.querySelector('.shopping-waterfall-container');
    if (container) container.classList.add('manage-mode');
    
    const deliveryContainer = document.querySelector('.delivery-container');
    if (deliveryContainer) deliveryContainer.classList.add('manage-mode');
    
    updateDeleteButton();
    
    // Check active tab
    const currentTab = document.querySelector('#shopping-app .wechat-tab-item.active');
    if (currentTab && currentTab.dataset.tab === 'delivery') {
        renderDeliveryItems();
    } else if (window.iphoneSimState.shoppingProducts) {
        renderShoppingProducts(window.iphoneSimState.shoppingProducts);
    }
}

function exitShoppingManageMode() {
    isShoppingManageMode = false;
    selectedShoppingProducts.clear();
    
    document.getElementById('shopping-manage-header').classList.add('hidden');
    
    const container = document.querySelector('.shopping-waterfall-container');
    if (container) container.classList.remove('manage-mode');
    
    const deliveryContainer = document.querySelector('.delivery-container');
    if (deliveryContainer) deliveryContainer.classList.remove('manage-mode');
    
    // Check active tab
    const currentTab = document.querySelector('#shopping-app .wechat-tab-item.active');
    if (currentTab && currentTab.dataset.tab === 'delivery') {
        renderDeliveryItems();
    } else if (window.iphoneSimState.shoppingProducts) {
        renderShoppingProducts(window.iphoneSimState.shoppingProducts);
    }
}

function toggleProductSelection(id, cardElement) {
    if (selectedShoppingProducts.has(id)) {
        selectedShoppingProducts.delete(id);
        cardElement.classList.remove('manage-active');
        cardElement.querySelector('.shopping-checkbox').classList.remove('checked');
    } else {
        selectedShoppingProducts.add(id);
        cardElement.classList.add('manage-active');
        cardElement.querySelector('.shopping-checkbox').classList.add('checked');
    }
    updateDeleteButton();
}

function toggleSelectAllShoppingItems() {
    const currentTab = document.querySelector('#shopping-app .wechat-tab-item.active');
    let allItems = [];
    
    if (currentTab && currentTab.dataset.tab === 'delivery') {
        allItems = window.iphoneSimState.deliveryItems || [];
    } else {
        allItems = window.iphoneSimState.shoppingProducts || [];
    }

    if (allItems.length === 0) return;

    if (selectedShoppingProducts.size === allItems.length) {
        // Deselect all
        selectedShoppingProducts.clear();
    } else {
        // Select all
        selectedShoppingProducts.clear();
        allItems.forEach(p => selectedShoppingProducts.add(p.id));
    }
    
    updateDeleteButton();
    // Re-render to update UI state
    if (currentTab && currentTab.dataset.tab === 'delivery') {
        renderDeliveryItems();
    } else {
        renderShoppingProducts(allItems);
    }
}

function updateDeleteButton() {
    const btn = document.getElementById('delete-shopping-items-btn');
    if (btn) {
        btn.textContent = `删除(${selectedShoppingProducts.size})`;
    }
    const selectAllBtn = document.getElementById('shopping-select-all-btn');
    if (selectAllBtn) {
        const currentTab = document.querySelector('#shopping-app .wechat-tab-item.active');
        let allCount = 0;
        if (currentTab && currentTab.dataset.tab === 'delivery') {
            allCount = window.iphoneSimState.deliveryItems ? window.iphoneSimState.deliveryItems.length : 0;
        } else {
            allCount = window.iphoneSimState.shoppingProducts ? window.iphoneSimState.shoppingProducts.length : 0;
        }

        if (allCount > 0 && selectedShoppingProducts.size === allCount) {
            selectAllBtn.textContent = '取消全选';
        } else {
            selectAllBtn.textContent = '全选';
        }
    }
}

function deleteSelectedShoppingItems() {
    if (selectedShoppingProducts.size === 0) return;
    
    if (confirm(`确定要删除选中的 ${selectedShoppingProducts.size} 个商品吗？`)) {
        const currentTab = document.querySelector('#shopping-app .wechat-tab-item.active');
        
        if (currentTab && currentTab.dataset.tab === 'delivery') {
            window.iphoneSimState.deliveryItems = window.iphoneSimState.deliveryItems.filter(p => !selectedShoppingProducts.has(p.id));
            saveConfig();
            renderDeliveryItems();
        } else {
            window.iphoneSimState.shoppingProducts = window.iphoneSimState.shoppingProducts.filter(p => !selectedShoppingProducts.has(p.id));
            saveConfig();
            renderShoppingProducts(window.iphoneSimState.shoppingProducts);
        }
        exitShoppingManageMode();
    }
}

function updateLinkButtonState() {
    const btn = document.getElementById('shopping-link-contact-btn');
    if (!btn) return;
    
    // 兼容旧的单选数据
    let linkedIds = window.iphoneSimState.shoppingLinkedContactIds || [];
    if (window.iphoneSimState.shoppingLinkedContactId && !linkedIds.includes(window.iphoneSimState.shoppingLinkedContactId)) {
        linkedIds.push(window.iphoneSimState.shoppingLinkedContactId);
    }
    
    if (linkedIds.length > 0) {
        btn.style.color = '#007AFF'; // Active color
    } else {
        btn.style.color = '#333'; // Default color
    }
}

function openShoppingContactPicker() {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    // 修改标题和按钮文本以适应当前上下文
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = '选择关联联系人 / 世界书';
    
    if (sendBtn) {
        sendBtn.textContent = '确定';
        // 移除旧的监听器 (cloneNode trick)
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        newSendBtn.onclick = () => {
            const selected = list.querySelectorAll('input[type="checkbox"][name="shopping-contact"]:checked');
            const ids = Array.from(selected).map(cb => parseInt(cb.value)).filter(id => id !== 0);
            
            window.iphoneSimState.shoppingLinkedContactIds = ids;
            // 清除旧的单选数据以避免混淆
            delete window.iphoneSimState.shoppingLinkedContactId;
            
            // 保存选中的世界书
            const selectedWb = list.querySelectorAll('input[type="checkbox"][name="shopping-wb"]:checked');
            const wbIds = Array.from(selectedWb).map(cb => parseInt(cb.value));
            window.iphoneSimState.shoppingLinkedWbIds = wbIds;
            
            saveConfig(); // Assume saveConfig is global
            updateLinkButtonState();
            modal.classList.add('hidden');
            
            let msg = '';
            if (ids.length > 0) msg += `已关联 ${ids.length} 位联系人`;
            if (wbIds.length > 0) msg += (msg ? '，' : '') + `已关联 ${wbIds.length} 个世界书`;
            
            if (msg) {
                alert(msg);
            } else {
                alert('已取消关联');
            }
        };
    }
    
    // 绑定关闭按钮
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.onclick = () => modal.classList.add('hidden');
    }

    list.innerHTML = '';
    
    // 获取当前选中的ID列表
    let currentIds = window.iphoneSimState.shoppingLinkedContactIds || [];
    if (window.iphoneSimState.shoppingLinkedContactId && currentIds.length === 0) {
        currentIds = [window.iphoneSimState.shoppingLinkedContactId];
    }
    
    let currentWbIds = window.iphoneSimState.shoppingLinkedWbIds || [];

    // 添加联系人列表标题
    const contactHeader = document.createElement('div');
    contactHeader.textContent = '联系人';
    contactHeader.style.padding = '10px 15px 5px';
    contactHeader.style.fontSize = '12px';
    contactHeader.style.color = '#999';
    contactHeader.style.background = '#f5f5f5';
    list.appendChild(contactHeader);

    // 添加联系人列表
    if (window.iphoneSimState.contacts) {
        window.iphoneSimState.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-item';
            const isChecked = currentIds.includes(c.id);
            
            item.innerHTML = `
                <div class="list-content" style="display: flex; align-items: center; justify-content: flex-start;">
                    <img src="${c.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; object-fit: cover; flex-shrink: 0;">
                    <span style="font-size: 16px;">${c.remark || c.name}</span>
                </div>
                <input type="checkbox" name="shopping-contact" value="${c.id}" ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px;">
            `;
            item.onclick = (e) => {
                // 如果点击的是 checkbox 本身，不处理
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('input');
                    if (checkbox) checkbox.checked = !checkbox.checked;
                }
            };
            list.appendChild(item);
        });
    }

    // 添加世界书列表标题
    const wbHeader = document.createElement('div');
    wbHeader.textContent = '世界书 (将作为背景设定发送给AI)';
    wbHeader.style.padding = '10px 15px 5px';
    wbHeader.style.fontSize = '12px';
    wbHeader.style.color = '#999';
    wbHeader.style.background = '#f5f5f5';
    list.appendChild(wbHeader);

    // 添加世界书列表
    if (window.iphoneSimState.wbCategories && window.iphoneSimState.wbCategories.length > 0) {
        window.iphoneSimState.wbCategories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'list-item';
            const isChecked = currentWbIds.includes(cat.id);
            
            item.innerHTML = `
                <div class="list-content" style="display: flex; align-items: center; justify-content: flex-start;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: #FF9500; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #fff;">
                        <i class="fas fa-book"></i>
                    </div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 16px;">${cat.name}</span>
                        <span style="font-size: 12px; color: #999;">${cat.desc || '无描述'}</span>
                    </div>
                </div>
                <input type="checkbox" name="shopping-wb" value="${cat.id}" ${isChecked ? 'checked' : ''} style="width: 20px; height: 20px;">
            `;
            item.onclick = (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('input');
                    if (checkbox) checkbox.checked = !checkbox.checked;
                }
            };
            list.appendChild(item);
        });
    } else {
        const emptyItem = document.createElement('div');
        emptyItem.style.padding = '15px';
        emptyItem.style.textAlign = 'center';
        emptyItem.style.color = '#999';
        emptyItem.textContent = '暂无世界书分类';
        list.appendChild(emptyItem);
    }
    
    modal.classList.remove('hidden');
}

// 初始化购物UI (在加载配置后调用)
window.initShoppingUI = function() {
    // 恢复已保存的商品
    if (window.iphoneSimState.shoppingProducts && window.iphoneSimState.shoppingProducts.length > 0) {
        // 确保所有商品都有ID (修复旧数据)
        let needSave = false;
        window.iphoneSimState.shoppingProducts.forEach((p, index) => {
            if (!p.id) {
                p.id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9) + '_' + index;
                needSave = true;
            }
        });
        if (needSave) saveConfig();

        ensureShoppingContainer();
        renderShoppingProducts(window.iphoneSimState.shoppingProducts);
    }

    // 恢复外卖商品
    if (window.iphoneSimState.deliveryItems && window.iphoneSimState.deliveryItems.length > 0) {
        ensureDeliveryContainer();
        renderDeliveryItems();
    }

    updateLinkButtonState();
};

// 生成商品数据
async function generateShoppingProducts() {
    // 检查当前 Tab
    const currentTab = document.querySelector('#shopping-app .wechat-tab-item.active');
    if (currentTab && currentTab.dataset.tab === 'delivery') {
        return generateDeliveryItems();
    }

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        alert('请先在设置中配置 AI API');
        return;
    }

    // 显示加载状态
    const container = document.getElementById('shopping-tab-home');
    
    // 确保容器存在，以免 loading 没地方放或者把默认内容挤乱
    ensureShoppingContainer();
    const waterfallContainer = container.querySelector('.shopping-waterfall-container');

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'shopping-loading';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.color = '#999';
    loadingDiv.textContent = '正在生成推荐商品...';
    
    // 清除可能存在的旧加载提示
    const oldLoading = document.getElementById('shopping-loading');
    if (oldLoading) oldLoading.remove();
    
    if (waterfallContainer) {
        container.insertBefore(loadingDiv, waterfallContainer);
    } else {
        container.appendChild(loadingDiv);
    }

    let userContext = '';
    
    // 获取关联联系人ID列表 (兼容单选和多选)
    let linkedIds = window.iphoneSimState.shoppingLinkedContactIds || [];
    if (window.iphoneSimState.shoppingLinkedContactId && !linkedIds.includes(window.iphoneSimState.shoppingLinkedContactId)) {
        linkedIds.push(window.iphoneSimState.shoppingLinkedContactId);
    }

    if (linkedIds.length > 0) {
        userContext += `\n【关联联系人信息】\n你现在需要根据以下 ${linkedIds.length} 位联系人的人设和与用户的聊天记录，推荐他们可能会感兴趣，或者用户可能会买给他们，或者符合你们聊天话题的商品。\n`;
        
        linkedIds.forEach((id, index) => {
            const contact = window.iphoneSimState.contacts.find(c => c.id === id);
            if (contact) {
                const name = contact.remark || contact.name;
                userContext += `\n--- 联系人 ${index + 1}: ${name} ---\n`;
                userContext += `人设: ${contact.persona || '无'}\n`;
                
                // 获取最近聊天记录
                const history = window.iphoneSimState.chatHistory[id] || [];
                if (history.length > 0) {
                    const recentMsgs = history.slice(-15).map(m => { // 每个联系人取最近15条
                        const role = m.role === 'user' ? '用户' : name;
                        let content = m.content;
                        if (m.type === 'image') content = '[图片]';
                        if (m.type === 'sticker') content = '[表情包]';
                        return `${role}: ${content}`;
                    }).join('\n');
                    userContext += `最近聊天记录:\n${recentMsgs}\n`;
                }
            }
        });
    }

    // 获取关联的世界书
    let linkedWbIds = window.iphoneSimState.shoppingLinkedWbIds || [];
    if (linkedWbIds.length > 0 && window.iphoneSimState.worldbook) {
        userContext += `\n【关联世界书/背景设定】\n以下是相关的世界观设定，请生成符合这些设定的商品：\n`;
        
        let wbContentFound = false;
        // 查找属于这些分类且启用的条目
        window.iphoneSimState.worldbook.forEach(entry => {
            if (linkedWbIds.includes(entry.categoryId) && entry.enabled) {
                const title = entry.remark || (entry.keys ? entry.keys.join(', ') : '无标题');
                userContext += `\n--- 设定: ${title} ---\n${entry.content}\n`;
                wbContentFound = true;
            }
        });
        
        if (!wbContentFound) {
            userContext += `(选中的世界书分类下暂无启用的条目)\n`;
        }
    }

    const systemPrompt = `你是一个电商推荐助手。请生成 6-8 个虚构的商品信息，用于模拟淘宝/电商APP的首页推荐流。
请直接返回 JSON 数组格式，不要包含任何 Markdown 标记或其他文本。
每个商品包含以下字段：
- title: 商品标题 (简短有力，类似淘宝标题)
- price: 价格 (数字，可以是整数或小数)
- paid_count: 付款人数 (例如 "100+", "2.5万+", "5000+")
- shop_name: 店铺名称
- image_desc: 商品图片的简短中文描述 (不超过5个字，用于生成占位图文字)
- detail_desc: 商品详情页的详细描述 (一段话，描述商品卖点、材质、规格等，50-100字)
- specifications: 可选规格 (Object, key为规格名, value为选项数组). 请根据商品类型生成合理的规格选项。例如服饰生成尺码/颜色，食品生成口味/规格，数码生成颜色/存储容量等。

${userContext ? userContext : '商品种类要丰富，包括但不限于：服饰、数码、美食、家居、美妆等。'}

示例：
[
  {"title": "2025新款纯棉白色T恤男女同款宽松", "price": 39.9, "paid_count": "1万+", "shop_name": "优选服饰", "image_desc": "白色T恤", "detail_desc": "精选优质新疆长绒棉，亲肤透气，不易变形。宽松版型设计，遮肉显瘦，男女同款。", "specifications": {"尺码": ["S", "M", "L", "XL"], "颜色": ["白色", "黑色", "灰色"]}},
  {"title": "网红爆款芝士半熟光头蛋糕", "price": 28.8, "paid_count": "5000+", "shop_name": "美味烘焙", "image_desc": "芝士蛋糕", "detail_desc": "进口安佳芝士，奶香浓郁，入口即化。现烤现发，日期新鲜，早餐下午茶首选。", "specifications": {"口味": ["原味", "巧克力味"], "规格": ["4个装", "8个装"]}}
]`;

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
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
                    { role: 'user', content: '生成推荐商品' }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;
        
        // 尝试解析 JSON
        let products = [];
        try {
            // 清理可能存在的 markdown 标记
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            
            // 尝试直接解析
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                products = parsed;
            } else if (parsed.products && Array.isArray(parsed.products)) {
                products = parsed.products;
            } else {
                // 如果返回的是对象但没有 products 字段，尝试找第一个数组字段
                for (let key in parsed) {
                    if (Array.isArray(parsed[key])) {
                        products = parsed[key];
                        break;
                    }
                }
            }
        } catch (e) {
            console.error('JSON Parse Error:', e);
            alert('生成数据格式错误，请重试');
        }

        if (products.length > 0) {
            // 为每个商品添加唯一ID (Robuster ID generation)
            products.forEach((p, index) => {
                p.id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9) + '_' + index;
            });

            // 保存到状态
            if (!window.iphoneSimState.shoppingProducts) {
                window.iphoneSimState.shoppingProducts = [];
            }
            window.iphoneSimState.shoppingProducts.push(...products);
            saveConfig();
            
            // 渲染新商品
            renderShoppingProducts(products);

            // 尝试异步生成图片
            (async () => {
                for (const p of products) {
                    if (p.image_desc) {
                        const url = await generateAiImage(p.image_desc);
                        if (url) {
                            p.aiImage = url;
                            saveConfig();
                            
                            // 更新界面
                            const imgEl = document.getElementById(`product-img-${p.id}`);
                            if (imgEl) {
                                imgEl.src = url;
                            }
                        }
                    }
                }
            })();
        } else {
            alert('未生成有效商品数据');
        }

    } catch (error) {
        console.error('生成商品失败:', error);
        alert(`生成失败: ${error.message}`);
    } finally {
        const loading = document.getElementById('shopping-loading');
        if (loading) loading.remove();
    }
}

function renderShoppingProducts(products) {
    const col1 = document.getElementById('shopping-col-1');
    const col2 = document.getElementById('shopping-col-2');
    
    if (!col1 || !col2) return;

    // 如果 products 是全部商品（从 init/manage mode调用），我们需要先清空。
    if (products === window.iphoneSimState.shoppingProducts) {
        col1.innerHTML = '';
        col2.innerHTML = '';
    }

    products.forEach((p, index) => {
        const card = document.createElement('div');
        card.className = 'shopping-card shopping-anim-item';
        card.style.animationDelay = `${index * 0.05}s`;
        card.dataset.id = p.id;
        
        if (isShoppingManageMode) {
            card.style.cursor = 'pointer';
            card.onclick = () => toggleProductSelection(p.id, card);
            card.classList.add('manage-active-style'); // Just a hook for CSS if needed, but styling is via class on container
        } else {
            // 正常模式点击打开详情
            card.style.cursor = 'pointer';
            card.onclick = () => openShoppingProductDetail(p);
        }

        // Check if selected
        const isSelected = selectedShoppingProducts.has(p.id);
        if (isSelected && isShoppingManageMode) {
            card.classList.add('manage-active'); // Re-apply visual selection state
        }

        // 确保有固定的背景色和高度 (持久化)
        if (!p.bgColor) {
            p.bgColor = window.getRandomPastelColor();
        }
        if (!p.imgHeight) {
            p.imgHeight = Math.floor(Math.random() * (250 - 150 + 1)) + 150;
        }

        let validBgColor = p.bgColor;
        if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl') && !validBgColor.startsWith('rgb')) {
             validBgColor = '#' + validBgColor;
        }

        const height = p.imgHeight;

        // 优先使用AI生成的图片
        const imgUrl = p.aiImage || generatePlaceholderImage(300, height, p.image_desc || '商品', validBgColor);

        // 使用新定义的CSS类
        card.innerHTML = `
            <div class="shopping-checkbox ${isSelected ? 'checked' : ''}"></div>
            <img id="product-img-${p.id}" src="${imgUrl}" style="width: 100%; display: block; object-fit: cover; aspect-ratio: 300/${height};">
            <div class="shopping-card-content">
                <div class="shopping-card-title">${p.title}</div>
                <div class="shopping-card-meta">
                    <div class="shopping-card-price">${p.price}</div>
                    <div style="font-size: 11px; color: var(--shopping-text-secondary);">${p.paid_count}付款</div>
                </div>
                <div class="shopping-card-shop" style="margin-top: 4px;">
                   <span>${p.shop_name}</span>
                   <i class="fas fa-chevron-right" style="font-size: 9px; margin-left: 2px; opacity: 0.6;"></i>
                </div>
            </div>
        `;

        // 简单的瀑布流算法：添加到较短的一列
        if (col1.offsetHeight <= col2.offsetHeight) {
            col1.appendChild(card);
        } else {
            col2.appendChild(card);
        }
    });
}

function openShoppingProductDetail(product) {
    currentShoppingProduct = product;
    
    const screen = document.getElementById('shopping-detail-screen');
    if (!screen) return;

    // 1. 设置图片和内容
    const imgEl = document.getElementById('shopping-detail-img');
    const bodyEl = screen.querySelector('.app-body');
    
    // 如果没有图片元素，说明结构被破坏，尝试修复（或者基于现有结构）
    // 这里我们直接操作现有的DOM结构，利用CSS变量优化样式
    
    if (imgEl) {
        if (product.aiImage) {
            imgEl.src = product.aiImage;
        } else {
            let validBgColor = product.bgColor || window.getRandomPastelColor();
            if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl') && !validBgColor.startsWith('rgb')) {
                 validBgColor = '#' + validBgColor;
            }
            imgEl.src = generatePlaceholderImage(600, 600, product.image_desc || product.title, validBgColor); 
        }
    }

    const priceEl = document.getElementById('shopping-detail-price');
    const titleEl = document.getElementById('shopping-detail-title');
    const paidEl = document.getElementById('shopping-detail-paid');
    const shopEl = document.getElementById('shopping-detail-shop');
    const descEl = document.getElementById('shopping-detail-desc');

    if (priceEl) {
        priceEl.textContent = product.price;
        priceEl.parentElement.style.color = 'var(--shopping-text-primary)';
    }
    if (titleEl) {
        titleEl.textContent = product.title;
        titleEl.style.color = 'var(--shopping-text-primary)';
    }
    if (paidEl) {
        if (product.paid_count && (product.paid_count.toString().includes('月售') || product.paid_count.toString().includes('人付款'))) {
            paidEl.textContent = product.paid_count;
        } else {
            paidEl.textContent = product.paid_count + '人付款';
        }
    }
    if (shopEl) shopEl.textContent = product.shop_name;
    
    if (descEl) {
        if (product.detail_desc) {
             descEl.textContent = product.detail_desc;
        } else {
             descEl.textContent = product.title + '\n\n' + (product.image_desc || '暂无详情描述');
        }
        descEl.style.color = 'var(--shopping-text-secondary)';
    }

    // 2. 优化底部按钮样式
    const addToCartBtn = document.getElementById('detail-add-to-cart-btn');
    const buyNowBtn = document.getElementById('detail-buy-now-btn');

    if (addToCartBtn) {
        // 重置样式为新风格
        addToCartBtn.className = 'shopping-btn-secondary';
        addToCartBtn.style = ''; // 清除内联样式
        addToCartBtn.style.marginRight = '10px';
        addToCartBtn.textContent = '加入购物车';
        
        // 绑定事件
        const newBtn = addToCartBtn.cloneNode(true);
        addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);
        newBtn.onclick = () => {
            if (product.specifications && Object.keys(product.specifications).length > 0) {
                openShoppingSpecModal(product, (productWithSpec) => {
                    addToCart(productWithSpec);
                    const toast = document.getElementById('shopping-success-toast');
                    if (toast) {
                        toast.classList.remove('hidden');
                        setTimeout(() => toast.classList.add('hidden'), 1500);
                    }
                    // Close details after adding? Or keep open? Usually keep open or show toast.
                    // Spec modal closes automatically in handleConfirm
                });
            } else {
                addToCart(product);
                const toast = document.getElementById('shopping-success-toast');
                if (toast) {
                    toast.classList.remove('hidden');
                    setTimeout(() => toast.classList.add('hidden'), 1500);
                }
            }
        };
        
        // 外卖隐藏购物车按钮
        if (product.isDelivery) newBtn.classList.add('hidden');
        else newBtn.classList.remove('hidden');
    }

    if (buyNowBtn) {
        buyNowBtn.className = 'shopping-btn-primary';
        buyNowBtn.style = '';
        buyNowBtn.textContent = '立即购买';
        
        const newBtn = buyNowBtn.cloneNode(true);
        buyNowBtn.parentNode.replaceChild(newBtn, buyNowBtn);
        newBtn.onclick = () => {
            if (product.specifications && Object.keys(product.specifications).length > 0) {
                openShoppingSpecModal(product, (productWithSpec) => {
                    openPaymentChoice(productWithSpec.price, [productWithSpec]);
                });
            } else {
                openPaymentChoice(product.price, [product]);
            }
        };
    }

    // 3. 分享按钮
    const shareBtn = document.getElementById('shopping-share-btn');
    if (shareBtn) {
        shareBtn.onclick = () => openProductShareContactPicker(product);
    }

    screen.classList.remove('hidden');
}

// 规格选择逻辑
let pendingSpecProduct = null;
let pendingSpecCallback = null;
let selectedSpecs = {};

function openShoppingSpecModal(product, callback) {
    pendingSpecProduct = product;
    pendingSpecCallback = callback;
    selectedSpecs = {}; // Clear previous selections

    const modal = document.getElementById('shopping-spec-modal');
    const container = document.getElementById('shopping-spec-container');
    const imgEl = document.getElementById('shopping-spec-img');
    const priceEl = document.getElementById('shopping-spec-price');
    const selectedTextEl = document.getElementById('shopping-spec-selected-text');

    if (!modal || !container) return;

    // Set Header Info
    if (imgEl) {
        let validBgColor = product.bgColor || 'cccccc';
        if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl') && !validBgColor.startsWith('rgb')) {
             validBgColor = '#' + validBgColor;
        }
        const imgUrl = product.aiImage || generatePlaceholderImage(300, product.imgHeight || 300, product.image_desc || product.title, validBgColor);
        imgEl.src = imgUrl;
    }
    if (priceEl) priceEl.textContent = product.price;
    if (selectedTextEl) selectedTextEl.textContent = '请选择规格';

    // Generate Options
    container.innerHTML = '';
    
    for (const [specName, options] of Object.entries(product.specifications)) {
        const group = document.createElement('div');
        group.className = 'spec-group';
        
        const title = document.createElement('div');
        title.className = 'spec-title';
        title.textContent = specName;
        group.appendChild(title);
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'spec-options';
        
        options.forEach(option => {
            const btn = document.createElement('div');
            btn.className = 'spec-option-btn';
            btn.textContent = option;
            btn.onclick = () => {
                // Deselect siblings
                Array.from(optionsDiv.children).forEach(c => c.classList.remove('selected'));
                // Select clicked
                btn.classList.add('selected');
                selectedSpecs[specName] = option;
                updateSpecSelectedText();
            };
            optionsDiv.appendChild(btn);
        });
        
        group.appendChild(optionsDiv);
        container.appendChild(group);
    }

    modal.classList.remove('hidden');
}

function updateSpecSelectedText() {
    const el = document.getElementById('shopping-spec-selected-text');
    if (!el || !pendingSpecProduct) return;
    
    const specs = pendingSpecProduct.specifications;
    const missing = [];
    const selected = [];
    
    for (const key of Object.keys(specs)) {
        if (selectedSpecs[key]) {
            selected.push(selectedSpecs[key]);
        } else {
            missing.push(key);
        }
    }
    
    if (missing.length > 0) {
        el.textContent = '请选择 ' + missing.join(' ');
        el.style.color = '#666';
    } else {
        el.textContent = '已选: ' + selected.join(', ');
        el.style.color = '#333';
    }
}

function handleConfirmShoppingSpec() {
    if (!pendingSpecProduct) return;
    
    const specs = pendingSpecProduct.specifications;
    const missing = [];
    for (const key of Object.keys(specs)) {
        if (!selectedSpecs[key]) {
            missing.push(key);
        }
    }
    
    if (missing.length > 0) {
        alert('请选择 ' + missing.join(' '));
        return;
    }
    
    const specString = Object.values(selectedSpecs).join('; ');
    
    // Clone product and add spec info
    const productWithSpec = {
        ...pendingSpecProduct,
        selectedSpec: specString,
        selectedSpecsMap: { ...selectedSpecs },
        // Create a unique ID for cart differentiation
        cartId: pendingSpecProduct.id + '_' + Object.values(selectedSpecs).join('_')
    };
    
    document.getElementById('shopping-spec-modal').classList.add('hidden');
    
    if (pendingSpecCallback) {
        pendingSpecCallback(productWithSpec);
    }
}

// 加入购物车
function addToCart(product) {
    if (!window.iphoneSimState.shoppingCart) {
        window.iphoneSimState.shoppingCart = [];
    }
    
    // Identify by cartId if available (for specs), otherwise id
    const identifyId = product.cartId || product.id;
    
    // Check if already in cart
    const existing = window.iphoneSimState.shoppingCart.find(item => (item.cartId || item.id) === identifyId);
    
    if (existing) {
        existing.count = (existing.count || 1) + 1;
    } else {
        window.iphoneSimState.shoppingCart.push({
            ...product,
            count: 1,
            selected: true // Default selected
        });
    }
    saveConfig();
}

// 渲染购物车
function renderShoppingCart(animate = false) {
    const container = document.getElementById('shopping-tab-cart');
    if (!container) return;

    const cart = window.iphoneSimState.shoppingCart || [];
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999; margin-top: 50px;">
                <i class="fas fa-shopping-cart" style="font-size: 48px; margin-bottom: 15px; color: #ccc;"></i>
                <p>购物车空空如也</p>
            </div>
        `;
        return;
    }

    const animClass = animate ? 'shopping-tab-enter' : '';
    let html = `<div class="${animClass}" style="padding: 10px;">`;
    
    cart.forEach((item, index) => {
        // Ensure image properties exist (fallback for old data)
        let validBgColor = item.bgColor || 'cccccc'; 
        if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl') && !validBgColor.startsWith('rgb')) {
             validBgColor = '#' + validBgColor;
        }
        const height = item.imgHeight || 300;
        const imgUrl = item.aiImage || generatePlaceholderImage(300, height, item.image_desc || '商品', validBgColor);

        html += `
            <div class="cart-item-wrapper" style="position: relative; margin-bottom: 15px; overflow: hidden; border-radius: 16px;">
                <div class="cart-item-delete" onclick="deleteCartItem('${item.id}')" style="position: absolute; top: 0; right: 0; bottom: 0; width: 80px; background: #FF3B30; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer;">删除</div>
                <div class="cart-item-modern" id="cart-item-${item.id}" 
                     style="position: relative; z-index: 1; transition: transform 0.2s ease-out; margin-bottom: 0;"
                     ontouchstart="handleCartTouchStart(event, '${item.id}')"
                     ontouchmove="handleCartTouchMove(event, '${item.id}')"
                     ontouchend="handleCartTouchEnd(event, '${item.id}')"
                     oncontextmenu="handleCartContextMenu(event, '${item.id}')">
                    <div class="shopping-checkbox ${item.selected ? 'checked' : ''}" onclick="toggleCartItemSelection('${item.id}')" style="position: relative; top: auto; right: auto; display: flex; margin-right: 5px;"></div>
                    <img src="${imgUrl}" style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover; flex-shrink: 0; background: #f2f2f7;">
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-size: 15px; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 500;">${item.title}</div>
                        <div style="background: #f2f2f7; color: #8e8e93; font-size: 12px; padding: 2px 8px; border-radius: 6px; display: inline-block; margin-bottom: 8px;">默认规格</div>
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="color: var(--shopping-text-primary); font-weight: 700; font-size: 16px;">¥${item.price}</div>
                            <div style="font-size: 13px; color: #8e8e93;">x${item.count}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    // Bottom Action Bar for Cart
    const totalPrice = cart.filter(i => i.selected).reduce((sum, item) => sum + (item.price * item.count), 0).toFixed(2);
    const totalCount = cart.filter(i => i.selected).reduce((sum, item) => sum + item.count, 0);

    html += `</div>
        <div class="${animClass}" style="position: fixed; bottom: calc(50px + env(safe-area-inset-bottom)); left: 0; width: 100%; background: #fff; border-top: 1px solid rgba(0,0,0,0.05); padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 90;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div onclick="toggleSelectAllCart()" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                    <div class="shopping-checkbox ${cart.every(i => i.selected) ? 'checked' : ''}" style="position: relative; top: auto; right: auto; display: flex;"></div>
                    <span style="font-size: 14px; color: #666;">全选</span>
                </div>
                <div style="margin-left: 15px;">
                    <span style="font-size: 14px;">合计:</span>
                    <span style="color: var(--shopping-text-primary); font-weight: 700; font-size: 18px;">¥${totalPrice}</span>
                </div>
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="handleCartPayByFriend()" class="shopping-btn-secondary" style="padding: 10px 20px; font-size: 14px;">找人付</button>
                <button onclick="handleCartBuy()" class="shopping-btn-primary" style="padding: 10px 20px; font-size: 14px;">结算(${totalCount})</button>
            </div>
        </div>
    `;

    // Add extra padding to container bottom to avoid overlap with fixed bottom bar
    container.style.paddingBottom = '120px';
    container.innerHTML = html;
}

window.toggleCartItemSelection = function(id) {
    const cart = window.iphoneSimState.shoppingCart;
    const item = cart.find(i => i.id === id);
    if (item) {
        item.selected = !item.selected;
        saveConfig();
        renderShoppingCart();
    }
};

window.toggleSelectAllCart = function() {
    const cart = window.iphoneSimState.shoppingCart;
    if (!cart || cart.length === 0) return;
    
    const allSelected = cart.every(i => i.selected);
    cart.forEach(i => i.selected = !allSelected);
    saveConfig();
    renderShoppingCart();
};

// 支付方式选择相关
let pendingPaymentItems = [];
let pendingPaymentAmount = 0;

window.handleCartBuy = function() {
    const cart = window.iphoneSimState.shoppingCart || [];
    const selected = cart.filter(i => i.selected);
    if (selected.length === 0) {
        alert('请至少选择一件商品');
        return;
    }
    
    const totalStr = selected.reduce((s, i) => s + i.price * i.count, 0).toFixed(2);
    openPaymentChoice(parseFloat(totalStr), selected, true);
};

window.handleBuyNow = function(product) {
    // This is now just a wrapper if called directly, but usually we use openPaymentChoice
    openPaymentChoice(product.price, [product]);
};

function openPaymentChoice(amount, items, isCart = false) {
    pendingPaymentAmount = amount;
    // Normalize items structure
    pendingPaymentItems = items.map(item => {
        let validBgColor = item.bgColor || 'cccccc';
        if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl') && !validBgColor.startsWith('rgb')) {
             validBgColor = '#' + validBgColor;
        }
        return {
            ...item,
            count: item.count || 1,
            // Ensure image properties exist
            image: item.image || item.aiImage || generatePlaceholderImage(300, item.imgHeight || 300, item.image_desc || item.title || '商品', validBgColor)
        };
    });
    pendingPaymentItems.isCart = isCart; // Flag to know if we need to clear cart later

    const modal = document.getElementById('shopping-payment-choice-modal');
    if (!modal) return;

    const totalEl = document.getElementById('payment-choice-total');
    if (totalEl) totalEl.textContent = '¥' + amount.toFixed(2);

    // Bind buttons
    const selfBtn = document.getElementById('payment-choice-self');
    const giftBtn = document.getElementById('payment-choice-gift');
    const closeBtn = document.getElementById('close-payment-choice');

    // Clone to remove old listeners
    if (selfBtn) {
        const newSelf = selfBtn.cloneNode(true);
        selfBtn.parentNode.replaceChild(newSelf, selfBtn);
        newSelf.onclick = () => {
            modal.classList.add('hidden');
            processSelfPayment();
        };
    }

    if (giftBtn) {
        const newGift = giftBtn.cloneNode(true);
        giftBtn.parentNode.replaceChild(newGift, giftBtn);
        newGift.onclick = () => {
            modal.classList.add('hidden');
            openShoppingGiftContactPicker(pendingPaymentItems);
        };
    }

    if (closeBtn) {
        const newClose = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newClose, closeBtn);
        newClose.onclick = () => modal.classList.add('hidden');
    }

    modal.classList.remove('hidden');
}

function processSelfPayment() {
    const totalAmount = pendingPaymentAmount;
    const totalStr = totalAmount.toFixed(2);
    
    // Check wallet balance
    if (!window.iphoneSimState.wallet) {
        window.iphoneSimState.wallet = { balance: 0, transactions: [] };
    }
    const wallet = window.iphoneSimState.wallet;
    
    if (wallet.balance < totalAmount) {
        alert(`余额不足，无法支付\n需支付: ¥${totalStr}\n当前余额: ¥${wallet.balance.toFixed(2)}`);
        return;
    }
    
    if (confirm(`确定要使用钱包余额支付 ¥${totalStr} 购买吗？`)) {
        // Create Order
        if (!window.iphoneSimState.shoppingOrders) {
            window.iphoneSimState.shoppingOrders = [];
        }
        
        // Prepare order items
        const orderItems = pendingPaymentItems.map(item => ({
            title: item.title,
            price: item.price,
            image: item.image,
            count: item.count,
            isDelivery: item.isDelivery,
            selectedSpec: item.selectedSpec
        }));

        const newOrder = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
            items: orderItems,
            total: totalStr,
            time: Date.now(),
            status: '待发货'
        };
        
        // Set realistic delays
        const hour = 3600000;
        newOrder.shipDelay = Math.floor(2 * hour + Math.random() * (22 * hour));
        newOrder.deliverDelay = Math.floor(48 * hour + Math.random() * (24 * hour));
        
        window.iphoneSimState.shoppingOrders.unshift(newOrder);

        // Deduct balance
        wallet.balance -= totalAmount;
        if (!wallet.transactions) wallet.transactions = [];
        wallet.transactions.unshift({
            id: Date.now().toString() + '_trans',
            type: 'expense',
            amount: totalAmount,
            title: '购物消费',
            time: Date.now(),
            relatedId: newOrder.id
        });

        // Clean up cart if needed
        if (pendingPaymentItems.isCart) {
            if (window.iphoneSimState.shoppingCart) {
                window.iphoneSimState.shoppingCart = window.iphoneSimState.shoppingCart.filter(i => !i.selected);
                renderShoppingCart();
            }
        }
        
        saveConfig();
        
        // Close details if open
        const detailScreen = document.getElementById('shopping-detail-screen');
        if (detailScreen && !detailScreen.classList.contains('hidden')) {
            detailScreen.classList.add('hidden');
        }
        
        window.switchShoppingTab('orders');
        alert('支付成功！已生成订单');
    }
}

window.handleCartPayByFriend = function() {
    const cart = window.iphoneSimState.shoppingCart || [];
    const selected = cart.filter(i => i.selected);
    if (selected.length === 0) {
        alert('请至少选择一件商品');
        return;
    }
    
    // Check contact picker availability
    openShoppingContactPickerForPay(selected);
};

// 购物车滑动删除逻辑
let cartTouchStartX = 0;
let cartCurrentItemId = null;

window.handleCartTouchStart = function(e, id) {
    cartTouchStartX = e.touches[0].clientX;
    cartCurrentItemId = id;
};

window.handleCartTouchMove = function(e, id) {
    if (cartCurrentItemId !== id) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - cartTouchStartX;
    const element = document.getElementById(`cart-item-${id}`);
    
    // 只允许左滑
    if (diff < 0) {
        // Limit swipe distance
        const translateX = Math.max(diff, -80);
        element.style.transform = `translateX(${translateX}px)`;
        // Prevent vertical scrolling while swiping horizontally
        if (Math.abs(diff) > 10) e.preventDefault();
    }
};

window.handleCartTouchEnd = function(e, id) {
    if (cartCurrentItemId !== id) return;
    const currentX = e.changedTouches[0].clientX;
    const diff = currentX - cartTouchStartX;
    const element = document.getElementById(`cart-item-${id}`);
    
    if (diff < -40) { // Threshold to open
        element.style.transform = 'translateX(-80px)';
    } else {
        element.style.transform = 'translateX(0)';
    }
    cartCurrentItemId = null;
};

window.handleCartContextMenu = function(e, id) {
    e.preventDefault();
    if (confirm('确定要删除这个商品吗？')) {
        deleteCartItem(id);
    }
};

window.deleteCartItem = function(id) {
    if (!window.iphoneSimState.shoppingCart) return;
    window.iphoneSimState.shoppingCart = window.iphoneSimState.shoppingCart.filter(i => i.id !== id);
    saveConfig();
    renderShoppingCart();
};

function openShoppingGiftContactPicker(items) {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = '送给谁';
    
    // 清除可能存在的旧备注输入框
    const oldInput = document.getElementById('gift-remark-input');
    if (oldInput) oldInput.remove();

    // 插入备注输入框到按钮容器中
    const btnContainer = sendBtn ? sendBtn.parentNode : null;
    let remarkInput = null;
    
    if (btnContainer) {
        remarkInput = document.createElement('input');
        remarkInput.id = 'gift-remark-input';
        remarkInput.type = 'text';
        remarkInput.placeholder = '给TA留个言 (可选)';
        remarkInput.style.width = '100%';
        remarkInput.style.marginBottom = '15px';
        remarkInput.style.padding = '10px';
        remarkInput.style.border = '1px solid #ddd';
        remarkInput.style.borderRadius = '8px';
        remarkInput.style.fontSize = '14px';
        
        btnContainer.insertBefore(remarkInput, sendBtn);
    }
    
    if (sendBtn) {
        sendBtn.textContent = '支付并发送';
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        newSendBtn.onclick = () => {
            try {
                // Check both checkbox types (shopping-contact or generic gift-contact)
                const selectedContact = list.querySelectorAll('input[type="checkbox"]:checked');
                const ids = Array.from(selectedContact).map(cb => parseInt(cb.value)).filter(id => id !== 0);
                
                const remark = remarkInput ? remarkInput.value.trim() : '';

                if (ids.length > 0) {
                    const totalAmount = pendingPaymentAmount * ids.length;
                    
                    if (ids.length > 1 && !confirm(`你选择了 ${ids.length} 位好友，将购买 ${ids.length} 份商品，总计 ¥${(totalAmount).toFixed(2)}。确定吗？`)) {
                        return;
                    }
                    
                    if (!window.iphoneSimState.wallet) {
                        window.iphoneSimState.wallet = { balance: 0, transactions: [] };
                    }
                    const wallet = window.iphoneSimState.wallet;
                    if (wallet.balance < totalAmount) {
                        alert(`余额不足，无法支付\n需支付: ¥${totalAmount.toFixed(2)}\n当前余额: ¥${wallet.balance.toFixed(2)}`);
                        return;
                    }
                    
                    // Process payment
                    wallet.balance -= totalAmount;
                    
                    ids.forEach(contactId => {
                        const orderItems = items.map(item => ({
                            title: item.title,
                            price: item.price,
                            image: item.image,
                            count: item.count,
                            isDelivery: item.isDelivery,
                            selectedSpec: item.selectedSpec
                        }));
                        
                        const newOrder = {
                            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
                            items: orderItems,
                            total: (pendingPaymentAmount).toFixed(2),
                            time: Date.now(),
                            status: '待发货',
                            giftTo: contactId
                        };
                        
                    const hour = 3600000;
                    newOrder.shipDelay = Math.floor(2 * hour + Math.random() * (22 * hour));
                    newOrder.deliverDelay = Math.floor(48 * hour + Math.random() * (24 * hour));
                    
                    if (!window.iphoneSimState.shoppingOrders) {
                        window.iphoneSimState.shoppingOrders = [];
                    }
                    window.iphoneSimState.shoppingOrders.unshift(newOrder);
                    
                    if (!wallet.transactions) wallet.transactions = [];
                    wallet.transactions.unshift({
                            id: Date.now().toString() + '_trans',
                            type: 'expense',
                            amount: pendingPaymentAmount,
                            title: '赠送礼物',
                            time: Date.now(),
                            relatedId: newOrder.id
                        });
                        
                        // 区分外卖分享和礼物分享
                        let msgType = 'shopping_gift';
                        const isDelivery = items.some(i => i.isDelivery);
                        if (isDelivery) {
                            msgType = 'delivery_share';
                        }

                        const msgData = {
                            items: items.map(i => ({
                                title: i.title,
                                price: i.price,
                                image: i.image,
                                isDelivery: i.isDelivery,
                                selectedSpec: i.selectedSpec
                            })),
                            total: (pendingPaymentAmount).toFixed(2),
                            remark: remark 
                        };
                        
                        // Robust sendMessage call
                        if (typeof sendMessage !== 'undefined') {
                            sendMessage(JSON.stringify(msgData), true, msgType, null, contactId);
                        } else if (window.sendMessage) {
                            window.sendMessage(JSON.stringify(msgData), true, msgType, null, contactId);
                        } else {
                            console.error('sendMessage not found');
                        }
                    });
                    
                    if (items.isCart && window.iphoneSimState.shoppingCart) {
                        window.iphoneSimState.shoppingCart = window.iphoneSimState.shoppingCart.filter(i => !i.selected);
                        renderShoppingCart();
                    }
                    saveConfig();
                    
                    modal.classList.add('hidden');
                    // 清理
                    if (remarkInput) remarkInput.remove();
                    
                    const detailScreen = document.getElementById('shopping-detail-screen');
                    if (detailScreen) detailScreen.classList.add('hidden');
                    window.switchShoppingTab('orders');
                    alert('支付成功！礼物已发送');
                } else {
                    alert('请选择联系人');
                }
            } catch (e) {
                console.error('Payment error:', e);
                alert('支付出错: ' + e.message);
            }
        };
    }
    
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.onclick = () => {
            modal.classList.add('hidden');
            const inp = document.getElementById('gift-remark-input');
            if (inp) inp.remove();
        };
    }

    list.innerHTML = '';
    if (window.iphoneSimState.contacts) {
        window.iphoneSimState.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-content" style="display: flex; align-items: center; justify-content: flex-start;">
                    <img src="${c.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; object-fit: cover; flex-shrink: 0;">
                    <span style="font-size: 16px;">${c.remark || c.name}</span>
                </div>
                <input type="checkbox" name="gift-contact" value="${c.id}" style="width: 20px; height: 20px;">
            `;
            item.onclick = (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('input');
                    if (checkbox) checkbox.checked = !checkbox.checked;
                }
            };
            list.appendChild(item);
        });
    }
    
    modal.classList.remove('hidden');
}

function openShoppingContactPickerForPay(items) {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = '请谁代付 / 送给谁';
    
    if (sendBtn) {
        sendBtn.textContent = '发送请求';
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        newSendBtn.onclick = () => {
            const selectedContact = list.querySelectorAll('input[type="checkbox"]:checked');
            const ids = Array.from(selectedContact).map(cb => parseInt(cb.value)).filter(id => id !== 0);
            
            if (ids.length > 0) {
                const totalPrice = items.reduce((s, i) => s + i.price * i.count, 0).toFixed(2);
                const itemList = items.map(i => i.title).join(', ');
                const requestId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                // Construct message
                const payData = {
                    type: 'pay_request',
                    id: requestId,
                    total: totalPrice,
                    status: 'pending',
                    items: items.map(i => ({
                        title: i.title,
                        price: i.price,
                        image: i.aiImage || generatePlaceholderImage(300, 300, i.image_desc, '#ccc'),
                        isDelivery: i.isDelivery,
                        selectedSpec: i.selectedSpec
                    }))
                };

                ids.forEach(id => {
                    if (typeof sendMessage !== 'undefined') {
                        // Send pay request card
                        sendMessage(JSON.stringify(payData), true, 'pay_request', null, id);
                    } else if (window.sendMessage) {
                        window.sendMessage(JSON.stringify(payData), true, 'pay_request', null, id);
                    }
                });
                modal.classList.add('hidden');
                alert('代付请求已发送');
            } else {
                alert('请选择联系人');
            }
        };
    }
    
    // Reuse existing contact picker logic
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.onclick = () => modal.classList.add('hidden');
    }

    list.innerHTML = '';
    if (window.iphoneSimState.contacts) {
        window.iphoneSimState.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-content" style="display: flex; align-items: center; justify-content: flex-start;">
                    <img src="${c.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; object-fit: cover; flex-shrink: 0;">
                    <span style="font-size: 16px;">${c.remark || c.name}</span>
                </div>
                <input type="checkbox" name="pay-contact" value="${c.id}" style="width: 20px; height: 20px;">
            `;
            item.onclick = (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('input');
                    if (checkbox) checkbox.checked = !checkbox.checked;
                }
            };
            list.appendChild(item);
        });
    }
    modal.classList.remove('hidden');
}

// 生成随机低饱和度淡色背景
window.getRandomPastelColor = function() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`; // High lightness, moderate saturation
};

// 生成占位图 (支持中文) - 高清版
function generatePlaceholderImage(width, height, text, bgColor) {
    const scale = 2; // 2x 分辨率
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    // 填充背景
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制文字
    ctx.fillStyle = '#ffffff';
    // 根据宽度动态调整字号 (基准大小 * 缩放)
    const baseFontSize = Math.max(16, Math.min(32, width / (text.length || 1)));
    const fontSize = baseFontSize * scale;
    
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png'); // 使用PNG防止文字模糊
}

// 调用 AI 生成图片
async function generateAiImage(prompt) {
    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) return null;

    try {
        let baseUrl = settings.url;
        // 尝试推断图片生成地址
        if (baseUrl.endsWith('/v1')) {
            baseUrl = baseUrl + '/images/generations';
        } else if (baseUrl.endsWith('/chat/completions')) {
            baseUrl = baseUrl.replace('/chat/completions', '/images/generations');
        } else if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl + 'images/generations';
        } else {
            // 默认假设它是 host，追加 /v1/...
            baseUrl = baseUrl + '/v1/images/generations';
        }

        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
        
        console.log('Generating image with prompt:', prompt);
        
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                prompt: prompt,
                n: 1,
                size: "256x256", // 使用小尺寸
                response_format: "url" // 或 b64_json
            })
        });

        if (!response.ok) {
            console.warn('Image generation failed status:', response.status);
            return null;
        }

        const data = await response.json();
        if (data.data && data.data.length > 0) {
            return data.data[0].url; // 或 b64_json
        }
    } catch (e) {
        console.error('Image generation error:', e);
    }
    return null;
}

function openProductShareContactPicker(product) {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = '分享商品给';
    
    if (sendBtn) {
        sendBtn.textContent = '发送';
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        newSendBtn.onclick = () => {
            const selected = list.querySelectorAll('input[type="checkbox"]:checked');
            const ids = Array.from(selected).map(cb => parseInt(cb.value)).filter(id => id !== 0);
            
            if (ids.length > 0) {
                // 构建商品数据
                let imgUrl = product.aiImage;
                if (!imgUrl) {
                     let bgColor = window.getRandomPastelColor();
                     // Use product background if available and valid
                     if (product.bgColor) {
                         bgColor = product.bgColor;
                         if (!bgColor.startsWith('#') && !bgColor.startsWith('hsl') && !bgColor.startsWith('rgb')) {
                             bgColor = '#' + bgColor;
                         }
                     }
                     imgUrl = generatePlaceholderImage(300, 300, product.image_desc || product.title, bgColor);
                }

                const productData = {
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: imgUrl,
                    shop_name: product.shop_name
                };
                
                ids.forEach(id => {
                    // 调用 chat.js 中的 sendMessage (假设它是全局的)
                    if (typeof sendMessage !== 'undefined') {
                        sendMessage(JSON.stringify(productData), true, 'product_share', null, id);
                    } else if (window.sendMessage) {
                        window.sendMessage(JSON.stringify(productData), true, 'product_share', null, id);
                    } else {
                        console.error('sendMessage function not found');
                    }
                });
                modal.classList.add('hidden');
                if (window.showChatToast) window.showChatToast('已发送');
                else alert('已发送');
            } else {
                alert('请选择至少一个联系人');
            }
        };
    }
    
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.onclick = () => modal.classList.add('hidden');
    }

    list.innerHTML = '';
    
    if (window.iphoneSimState.contacts) {
        window.iphoneSimState.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            item.innerHTML = `
                <div class="list-content" style="display: flex; align-items: center; justify-content: flex-start;">
                    <img src="${c.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; object-fit: cover; flex-shrink: 0;">
                    <span style="font-size: 16px;">${c.remark || c.name}</span>
                </div>
                <input type="checkbox" name="share-contact" value="${c.id}" style="width: 20px; height: 20px;">
            `;
            item.onclick = (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('input');
                    if (checkbox) checkbox.checked = !checkbox.checked;
                }
            };
            list.appendChild(item);
        });
    }
    
    modal.classList.remove('hidden');
}

// 更新订单状态
function updateShoppingOrderStatuses() {
    if (!window.iphoneSimState.shoppingOrders) return;

    let hasChanges = false;
    const now = Date.now();
    const hour = 3600000;

    // 收集所有外卖商品标题，用于识别旧数据
    const deliveryTitles = new Set();
    if (window.iphoneSimState.deliveryItems) {
        window.iphoneSimState.deliveryItems.forEach(i => deliveryTitles.add(i.title));
    }

    window.iphoneSimState.shoppingOrders.forEach(order => {
        // Check if it's a delivery order (contains delivery items)
        let isDeliveryOrder = order.items && order.items.some(i => i.isDelivery);

        // 尝试通过标题识别旧的外卖订单
        if (!isDeliveryOrder && order.items && deliveryTitles.size > 0) {
            const hasDeliveryItem = order.items.some(i => deliveryTitles.has(i.title));
            if (hasDeliveryItem) {
                isDeliveryOrder = true;
                // 标记 items 以便后续不需要再次匹配
                order.items.forEach(i => {
                    if (deliveryTitles.has(i.title)) i.isDelivery = true;
                });
                hasChanges = true;
            }
        }

        // Initialize or Fix delays
        // 如果是外卖订单，且延迟设置过大（超过2小时），则重置为外卖的时间标准
        if (isDeliveryOrder) {
             if (!order.shipDelay || order.shipDelay > 2 * 3600000) {
                 // 外卖：5-10分钟 接单/备餐完成
                 order.shipDelay = Math.floor(5 * 60000 + Math.random() * (5 * 60000));
                 hasChanges = true;
             }
             if (!order.deliverDelay || order.deliverDelay > 3 * 3600000) {
                 // 外卖：30-40分钟送达
                 order.deliverDelay = Math.floor(30 * 60000 + Math.random() * (10 * 60000));
                 hasChanges = true;
             }
        } else {
             // 普通商品初始化
             if (!order.shipDelay) {
                 order.shipDelay = Math.floor(2 * hour + Math.random() * (22 * hour)); 
                 hasChanges = true; 
             }
             if (!order.deliverDelay) {
                order.deliverDelay = Math.floor(48 * hour + Math.random() * (24 * hour));
                hasChanges = true;
             }
        }

        const elapsed = now - order.time;
        
        if (order.status === '待发货' && elapsed > order.shipDelay) {
            order.status = '已发货';
            hasChanges = true;
        }
        
        if (order.status === '已发货' && elapsed > order.deliverDelay) {
            order.status = '已完成';
            hasChanges = true;
            
            // 订单完成提示
            const isDelivery = order.items && order.items.some(i => i.isDelivery);
            if (isDelivery) {
                showOrderNotification('外卖已送达', '您的外卖已准时送达，祝您用餐愉快');
            } else {
                showOrderNotification('商品已送达', '您的快递已送达，请及时查收');
            }
        }
    });

    if (hasChanges) {
        saveConfig();
        // 如果当前正在查看订单页，则刷新
        const currentTab = document.querySelector('#shopping-app .wechat-tab-item.active');
        if (currentTab && currentTab.dataset.tab === 'orders') {
            renderShoppingOrders();
        }
    }
}

// 渲染订单页面
function renderShoppingOrders() {
    const container = document.getElementById('shopping-tab-orders');
    if (!container) return;

    const orders = window.iphoneSimState.shoppingOrders || [];
    
    // Sort by time desc
    orders.sort((a, b) => b.time - a.time);

    if (orders.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999; margin-top: 50px;">
                <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 15px; color: #ccc;"></i>
                <p>暂无订单</p>
            </div>
        `;
        return;
    }

    let html = '<div style="padding: 10px;">';
    
    orders.forEach((order, index) => {
        const date = new Date(order.time);
        const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        let statusClass = '';
        let statusText = order.status;
        let logisticsInfo = '';

        const isDeliveryOrder = order.items && order.items.some(i => i.isDelivery);

        if (statusText === '待发货') {
            statusClass = 'active'; // Black bg
            logisticsInfo = isDeliveryOrder ? '商家已接单，正在制作...' : '商家正在打包中...';
        } else if (statusText === '已发货') {
            statusClass = ''; // Gray bg
            logisticsInfo = isDeliveryOrder ? '骑手正在火速配送中' : '包裹正在运输途中';
        } else if (statusText === '已完成') {
            statusClass = ''; // Gray bg
            logisticsInfo = isDeliveryOrder ? '订单已送达' : '订单已签收';
        }

        html += `
            <div class="order-card-modern" onclick="openShoppingOrderProgress('${order.id}')">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-size: 13px; color: var(--shopping-text-secondary); font-weight: 500;">${dateStr}</span>
                    <span class="order-status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="order-items">
        `;

        order.items.forEach(item => {
            html += `
                <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                    <img src="${item.image}" style="width: 60px; height: 60px; border-radius: 10px; object-fit: cover; background: #f2f2f7;">
                    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 15px; color: var(--shopping-text-primary); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">${item.title}</div>
                        <div style="font-size: 12px; color: #8e8e93; margin-bottom: 2px;">${item.selectedSpec || ''}</div>
                        <div style="font-size: 13px; color: var(--shopping-text-secondary);">数量: ${item.count || 1}</div>
                    </div>
                    <div style="font-size: 15px; font-weight: 600; color: var(--shopping-text-primary);">¥${item.price}</div>
                </div>
            `;
        });

        html += `
                </div>
                <div style="border-top: 1px solid rgba(0,0,0,0.05); padding-top: 12px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="font-size: 12px; color: var(--shopping-text-secondary);">${logisticsInfo}</div>
                    <div style="font-size: 14px;">实付: <span style="font-weight: 700; font-size: 16px;">¥${order.total}</span></div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

// 订单进度查看
window.openShoppingOrderProgress = function(orderId) {
    const orders = window.iphoneSimState.shoppingOrders || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let modal = document.getElementById('shopping-order-progress-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'shopping-order-progress-modal';
        modal.className = 'order-progress-modal';
        modal.innerHTML = `
            <div class="order-progress-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="font-size: 18px; font-weight: 700;">订单进度</div>
                    <div onclick="document.getElementById('shopping-order-progress-modal').classList.remove('active')" style="padding: 5px; cursor: pointer;">
                        <i class="fas fa-times" style="font-size: 18px; color: #999;"></i>
                    </div>
                </div>
                
                <div class="progress-timeline">
                    <div class="progress-line-active" id="progress-line"></div>
                    
                    <div class="progress-step" id="step-1">
                        <div class="progress-dot"></div>
                        <div class="progress-label">已下单</div>
                        <div class="progress-time" id="time-1"></div>
                    </div>
                    
                    <div class="progress-step" id="step-2">
                        <div class="progress-dot"></div>
                        <div class="progress-label">已发货</div>
                        <div class="progress-time" id="time-2"></div>
                    </div>
                    
                    <div class="progress-step" id="step-3">
                        <div class="progress-dot"></div>
                        <div class="progress-label">已送达</div>
                        <div class="progress-time" id="time-3"></div>
                    </div>
                </div>
                
                <div style="text-align: center; margin-bottom: 25px;">
                    <div style="font-size: 13px; color: #8e8e93; margin-bottom: 5px;">预计送达时间</div>
                    <div style="font-size: 20px; font-weight: 600; color: #000;" id="progress-eta"></div>
                </div>
                
                <button id="share-progress-btn" class="shopping-btn-secondary" style="width: 100%;">
                    <i class="fas fa-share-alt" style="margin-right: 8px;"></i>分享给好友
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        
        // 点击遮罩关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    }

    // Update Content
    const step1 = modal.querySelector('#step-1');
    const step2 = modal.querySelector('#step-2');
    const step3 = modal.querySelector('#step-3');
    const line = modal.querySelector('#progress-line');
    const etaEl = modal.querySelector('#progress-eta');
    
    // Reset classes
    [step1, step2, step3].forEach(s => {
        s.querySelector('.progress-dot').classList.remove('active');
        s.querySelector('.progress-label').classList.remove('active');
        s.querySelector('.progress-time').textContent = '';
    });
    
    // Format helpers
    const formatDate = (ts) => {
        const d = new Date(ts);
        return `${d.getMonth()+1}-${d.getDate()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    };

    // Calculate times
    const time1 = order.time;
    const time2 = order.time + (order.shipDelay || 0);
    const time3 = order.time + (order.deliverDelay || 0);
    
    modal.querySelector('#time-1').textContent = formatDate(time1);
    
    let activeStep = 1;
    if (order.status === '已发货') activeStep = 2;
    if (order.status === '已完成') activeStep = 3;
    
    // Apply state
    if (activeStep >= 1) {
        step1.querySelector('.progress-dot').classList.add('active');
        step1.querySelector('.progress-label').classList.add('active');
    }
    if (activeStep >= 2) {
        step2.querySelector('.progress-dot').classList.add('active');
        step2.querySelector('.progress-label').classList.add('active');
        modal.querySelector('#time-2').textContent = formatDate(time2);
    } else {
        modal.querySelector('#time-2').textContent = '预计 ' + formatDate(time2);
    }
    if (activeStep >= 3) {
        step3.querySelector('.progress-dot').classList.add('active');
        step3.querySelector('.progress-label').classList.add('active');
        modal.querySelector('#time-3').textContent = formatDate(time3);
    } else {
        modal.querySelector('#time-3').textContent = '预计 ' + formatDate(time3);
    }
    
    // Line width
    if (activeStep === 1) line.style.width = '0%';
    else if (activeStep === 2) line.style.width = '50%';
    else if (activeStep === 3) line.style.width = '100%';
    
    // ETA Display
    if (activeStep === 3) {
        etaEl.textContent = '订单已完成';
        etaEl.style.color = '#34C759';
    } else {
        etaEl.textContent = formatDate(time3);
        etaEl.style.color = '#000';
    }
    
    // Share Button
    const shareBtn = document.getElementById('share-progress-btn');
    // Remove old listeners
    const newShareBtn = shareBtn.cloneNode(true);
    shareBtn.parentNode.replaceChild(newShareBtn, shareBtn);
    
    newShareBtn.onclick = () => {
        openShoppingProgressSharePicker(order, formatDate(time3));
        modal.classList.remove('active');
    };

    // Show modal
    // Force reflow
    void modal.offsetWidth;
    modal.classList.add('active');
};

function openShoppingProgressSharePicker(order, eta) {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = '分享进度给';
    
    if (sendBtn) {
        sendBtn.textContent = '发送';
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        newSendBtn.onclick = () => {
            const selected = list.querySelectorAll('input[type="checkbox"]:checked');
            const ids = Array.from(selected).map(cb => parseInt(cb.value)).filter(id => id !== 0);
            
            if (ids.length > 0) {
                const title = order.items[0].title + (order.items.length > 1 ? ` 等${order.items.length}件` : '');
                const status = order.status;
                
                // Construct card data
                const msgData = {
                    title: title,
                    status: status,
                    eta: eta,
                    orderId: order.id
                };
                const jsonStr = JSON.stringify(msgData);
                
                ids.forEach(id => {
                    if (typeof sendMessage !== 'undefined') {
                        sendMessage(jsonStr, true, 'order_progress', null, id);
                    } else if (window.sendMessage) {
                        window.sendMessage(jsonStr, true, 'order_progress', null, id);
                    }
                });
                modal.classList.add('hidden');
                alert('已分享进度');
            } else {
                alert('请选择联系人');
            }
        };
    }
    
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.onclick = () => modal.classList.add('hidden');
    }

    list.innerHTML = '';
    
    if (window.iphoneSimState.contacts) {
        window.iphoneSimState.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            item.innerHTML = `
                <div class="list-content" style="display: flex; align-items: center; justify-content: flex-start;">
                    <img src="${c.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; object-fit: cover; flex-shrink: 0;">
                    <span style="font-size: 16px;">${c.remark || c.name}</span>
                </div>
                <input type="checkbox" name="share-contact" value="${c.id}" style="width: 20px; height: 20px;">
            `;
            item.onclick = (e) => {
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('input');
                    if (checkbox) checkbox.checked = !checkbox.checked;
                }
            };
            list.appendChild(item);
        });
    }
    
    modal.classList.remove('hidden');
}

// 处理代付请求支付
window.handlePayForRequest = function(requestId, payerName, requestData) {
    if (!requestId || !requestData) return false;

    if (!window.iphoneSimState.shoppingOrders) {
        window.iphoneSimState.shoppingOrders = [];
    }

    // 检查是否已经存在 (防止重复支付)
    if (window.iphoneSimState.shoppingOrders.some(o => o.requestId === requestId)) {
        return false;
    }

    const newOrder = {
        id: Date.now().toString(),
        requestId: requestId,
        payer: payerName,
        items: requestData.items || [],
        total: requestData.total || '0.00',
        time: Date.now(),
        status: '待发货' // 默认状态
    };

    window.iphoneSimState.shoppingOrders.unshift(newOrder);
    saveConfig();
    
    // 如果当前在订单页面，刷新
    const currentTab = document.querySelector('#shopping-app .wechat-tab-item.active');
    if (currentTab && currentTab.dataset.tab === 'orders') {
        renderShoppingOrders();
    }
    
    return true;
};

// 生成外卖数据
async function generateDeliveryItems() {
    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        alert('请先在设置中配置 AI API');
        return;
    }

    const container = document.getElementById('shopping-tab-delivery');
    ensureDeliveryContainer();
    const listContainer = container.querySelector('.delivery-container');

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'delivery-loading';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.color = '#999';
    loadingDiv.textContent = '正在搜索附近美食...';
    
    const oldLoading = document.getElementById('delivery-loading');
    if (oldLoading) oldLoading.remove();
    
    if (listContainer) {
        container.insertBefore(loadingDiv, listContainer);
    } else {
        container.appendChild(loadingDiv);
    }

    let userContext = '';
    // 复用关联联系人逻辑
    let linkedIds = window.iphoneSimState.shoppingLinkedContactIds || [];
    if (window.iphoneSimState.shoppingLinkedContactId && !linkedIds.includes(window.iphoneSimState.shoppingLinkedContactId)) {
        linkedIds.push(window.iphoneSimState.shoppingLinkedContactId);
    }

    if (linkedIds.length > 0) {
        userContext += `\n【用餐偏好参考】\n请根据以下用户的口味偏好（如果有提及）推荐外卖：\n`;
        linkedIds.forEach((id) => {
            const contact = window.iphoneSimState.contacts.find(c => c.id === id);
            if (contact) {
                userContext += `- ${contact.remark || contact.name}: ${contact.persona || ''}\n`;
            }
        });
    }

    const systemPrompt = `你是一个外卖APP推荐助手。请生成 6-8 个虚构的外卖商品信息。
请直接返回 JSON 数组格式，不要包含任何 Markdown 标记。
每个商品包含以下字段：
- title: 菜品名称
- price: 价格 (数字)
- shop_name: 商家名称
- paid_count: 月售数量 (例如 "月售1000+")
- delivery_time: 配送时间 (例如 "30分钟")
- delivery_fee: 配送费 (例如 "¥0", "¥2")
- rating: 评分 (例如 "4.8分")
- image_desc: 菜品图片的简短描述 (不超过5个字)
- detail_desc: 菜品详细描述
- specifications: 可选规格 (Object, key为规格名, value为选项数组). 必须根据具体的商品类型生成合理的规格！例如：奶茶生成甜度/冰度，烧烤生成辣度，米饭套餐生成配菜，蛋糕生成口味等。不要所有商品都生成辣度！

${userContext ? userContext : '菜品种类要极度丰富和随机！不要局限于常见的快餐。请生成各种不同的美食，例如：地方特色菜（川菜/粤菜/湘菜等）、异国料理（日料/韩料/西餐/泰餐等）、网红小吃、轻食沙拉、烘焙甜品、特色饮品、夜宵烧烤、火锅食材等。请发挥想象力，生成一些有趣或诱人的菜名。'}

请不要只生成示例中的商品，要完全随机和多样化！

示例：
[
  {"title": "香辣鸡腿堡套餐", "price": 25.9, "shop_name": "快乐汉堡店", "paid_count": "月售2000+", "delivery_time": "25分钟", "delivery_fee": "¥0", "rating": "4.9分", "image_desc": "汉堡套餐", "detail_desc": "香辣鸡腿堡+中薯+可乐，快乐加倍！", "specifications": {"饮料": ["可乐", "雪碧", "橙汁"], "辣度": ["正常辣", "不辣"]}},
  {"title": "招牌杨枝甘露", "price": 18, "shop_name": "七分甜", "paid_count": "月售500+", "delivery_time": "35分钟", "delivery_fee": "¥3", "rating": "4.7分", "image_desc": "杨枝甘露", "detail_desc": "精选芒果，口感浓郁，清凉解暑。", "specifications": {"甜度": ["常规糖", "七分糖", "三分糖"], "温度": ["冰", "去冰", "常温"]}},
  {"title": "草莓奶油蛋糕", "price": 35, "shop_name": "甜蜜时光", "paid_count": "月售300+", "delivery_time": "45分钟", "delivery_fee": "¥5", "rating": "4.9分", "image_desc": "草莓蛋糕", "detail_desc": "新鲜草莓，动物奶油，口感细腻。", "specifications": {"口味": ["原味", "巧克力底"], "蜡烛": ["不需要", "需要"]}}
]`;

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }
        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
        
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
                    { role: 'user', content: '生成外卖推荐' }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        let content = data.choices[0].message.content;
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let products = [];
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) products = parsed;
            else if (parsed.products) products = parsed.products;
            else {
                 for (let key in parsed) {
                    if (Array.isArray(parsed[key])) {
                        products = parsed[key];
                        break;
                    }
                }
            }
        } catch (e) {
            console.error('JSON Parse Error:', e);
        }

        if (products.length > 0) {
            products.forEach((p, index) => {
                p.id = 'del_' + Date.now() + '_' + index;
                p.isDelivery = true; // 标记为外卖
            });

            if (!window.iphoneSimState.deliveryItems) {
                window.iphoneSimState.deliveryItems = [];
            }
            // 外卖通常是刷新式的，这里我们可以选择追加或者覆盖。考虑到推荐流，追加比较好，但为了演示方便，这里覆盖或追加？
            // 模仿 generateShoppingProducts 是追加。
            window.iphoneSimState.deliveryItems.unshift(...products);
            saveConfig();

            renderDeliveryItems();

            // 异步生成图片
            (async () => {
                for (const p of products) {
                    if (p.image_desc) {
                        const url = await generateAiImage(p.image_desc);
                        if (url) {
                            p.aiImage = url;
                            saveConfig();
                            const imgEl = document.getElementById(`delivery-img-${p.id}`);
                            if (imgEl) imgEl.src = url;
                        }
                    }
                }
            })();
        } else {
            alert('未生成有效数据');
        }

    } catch (error) {
        console.error('生成外卖失败:', error);
        alert(`生成失败: ${error.message}`);
    } finally {
        const loading = document.getElementById('delivery-loading');
        if (loading) loading.remove();
    }
}

function renderDeliveryItems() {
    const container = document.getElementById('shopping-tab-delivery');
    if (!container) return;
    ensureDeliveryContainer();
    const listContainer = container.querySelector('.delivery-container');
    
    // 如果没有数据
    if (!window.iphoneSimState.deliveryItems || window.iphoneSimState.deliveryItems.length === 0) {
        listContainer.innerHTML = ''; // Keep empty or show placeholder logic in ensure
        return;
    }

    listContainer.innerHTML = '';
    
    window.iphoneSimState.deliveryItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'delivery-card-modern shopping-anim-item';
        card.style.animationDelay = `${index * 0.05}s`;
        card.dataset.id = item.id;
        
        if (isShoppingManageMode) {
            card.style.cursor = 'pointer';
            card.onclick = () => toggleProductSelection(item.id, card);
        } else {
            // 点击直接购买/送礼
            card.onclick = () => {
                if (item.specifications && Object.keys(item.specifications).length > 0) {
                    openShoppingSpecModal(item, (itemWithSpec) => {
                        openPaymentChoice(itemWithSpec.price, [itemWithSpec]);
                    });
                } else {
                    openPaymentChoice(item.price, [item]);
                }
            };
        }

        const isSelected = selectedShoppingProducts.has(item.id);
        if (isSelected && isShoppingManageMode) {
            card.classList.add('manage-active');
        }

        let validBgColor = window.getRandomPastelColor();
        if (item.bgColor) { // If delivery items start saving color later
             validBgColor = item.bgColor;
             if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl') && !validBgColor.startsWith('rgb')) {
                 validBgColor = '#' + validBgColor;
             }
        }
        const imgUrl = item.aiImage || generatePlaceholderImage(100, 100, item.image_desc || '美食', validBgColor);

        card.innerHTML = `
            <div class="shopping-checkbox ${isSelected ? 'checked' : ''}"></div>
            <img id="delivery-img-${item.id}" src="${imgUrl}" style="width: 90px; height: 90px; border-radius: 12px; object-fit: cover; flex-shrink: 0; background: #f2f2f7;">
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; padding: 2px 0;">
                <div>
                    <div style="font-size: 16px; font-weight: 600; color: var(--shopping-text-primary); margin-bottom: 4px; line-height: 1.3;">${item.title}</div>
                    <div style="font-size: 12px; color: var(--shopping-text-secondary); display: flex; align-items: center; gap: 8px;">
                        <span style="color: #FF9500; font-weight: 600;">${item.rating || '4.8分'}</span>
                        <span>${item.paid_count || '月售100+'}</span>
                    </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div style="display: flex; flex-direction: column; gap: 2px;">
                         <div style="font-size: 11px; color: var(--shopping-text-secondary);">
                             <span>${item.delivery_time || '30分钟'}</span> 
                             <span style="margin: 0 4px;">|</span>
                             <span>${item.delivery_fee || '免配送费'}</span>
                         </div>
                         <div style="font-size: 11px; color: var(--shopping-text-secondary); opacity: 0.8;">${item.shop_name}</div>
                    </div>
                    <div style="color: var(--shopping-text-primary); font-size: 18px; font-weight: 700;">¥${item.price}</div>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

function showOrderNotification(title, message) {
    let container = document.getElementById('order-notification-banner');
    if (!container) {
        container = document.createElement('div');
        container.id = 'order-notification-banner';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 12px 20px;
            border-radius: 25px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 220px;
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            pointer-events: none;
        `;
        
        const icon = document.createElement('div');
        icon.id = 'order-notif-icon';
        icon.style.cssText = `
            width: 36px;
            height: 36px;
            background: #000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 16px;
            flex-shrink: 0;
        `;
        
        const textDiv = document.createElement('div');
        textDiv.style.cssText = `display: flex; flex-direction: column;`;
        
        const titleSpan = document.createElement('span');
        titleSpan.id = 'order-notif-title';
        titleSpan.style.cssText = `font-weight: 600; font-size: 15px; color: #000; margin-bottom: 2px;`;
        
        const msgSpan = document.createElement('span');
        msgSpan.id = 'order-notif-msg';
        msgSpan.style.cssText = `font-size: 13px; color: #666;`;
        
        textDiv.appendChild(titleSpan);
        textDiv.appendChild(msgSpan);
        
        container.appendChild(icon);
        container.appendChild(textDiv);
        
        document.body.appendChild(container);
    }
    
    const icon = container.querySelector('#order-notif-icon');
    const titleSpan = container.querySelector('#order-notif-title');
    const msgSpan = container.querySelector('#order-notif-msg');
    
    if (title.includes('外卖')) {
        icon.innerHTML = '<i class="fas fa-utensils"></i>';
        icon.style.background = '#FF9500'; // Orange for food
    } else {
        icon.innerHTML = '<i class="fas fa-box-open"></i>';
        icon.style.background = '#007AFF'; // Blue for package
    }
    
    titleSpan.textContent = title;
    msgSpan.textContent = message;
    
    // Show animation
    requestAnimationFrame(() => {
        container.style.opacity = '1';
        container.style.transform = 'translateX(-50%) translateY(0)';
    });
    
    // Hide after delay
    if (window.orderNotifTimeout) clearTimeout(window.orderNotifTimeout);
    window.orderNotifTimeout = setTimeout(() => {
        container.style.opacity = '0';
        container.style.transform = 'translateX(-50%) translateY(-100px)';
    }, 4000);
}

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupShoppingListeners);
}
