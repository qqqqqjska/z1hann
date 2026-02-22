// 购物应用功能模块

// 状态
let isShoppingManageMode = false;
let selectedShoppingProducts = new Set();
let currentShoppingProduct = null;
let currentShoppingCategory = 'All';
let currentOrderTab = 'all';

// 日志调试功能
let shoppingDebugLogs = [];

window.addShoppingLog = function(msg, data = null) {
    const time = new Date().toLocaleTimeString();
    let logEntry = `[${time}] ${msg}`;
    if (data !== null) {
        if (typeof data === 'object') {
            try {
                logEntry += '\n' + JSON.stringify(data, null, 2);
            } catch (e) {
                logEntry += '\n' + String(data);
            }
        } else {
            logEntry += '\n' + String(data);
        }
    }
    shoppingDebugLogs.push(logEntry);
    console.log('[Shopping]', msg, data);
};

window.showShoppingDebugLog = function() {
    let modal = document.getElementById('shopping-debug-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'shopping-debug-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        modal.innerHTML = `
            <div style="background: #fff; width: 90%; height: 80%; border-radius: 10px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="padding: 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; background: #f8f8f8;">
                    <h3 style="margin: 0; font-size: 16px;">购物应用诊断日志</h3>
                    <button id="close-debug-log" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer;">关闭</button>
                </div>
                <pre id="shopping-debug-content" style="flex: 1; overflow: auto; padding: 15px; font-size: 12px; white-space: pre-wrap; word-break: break-all; background: #282c34; color: #abb2bf; margin: 0; font-family: monospace;"></pre>
                <div style="padding: 15px; border-top: 1px solid #eee; text-align: right; background: #f8f8f8;">
                    <button onclick="shoppingDebugLogs=[]; document.getElementById('shopping-debug-content').textContent='';" style="padding: 8px 15px; border: 1px solid #ddd; border-radius: 4px; background: #fff; cursor: pointer; margin-right: 10px;">清空</button>
                    <button onclick="window.copyShoppingDebugLog()" style="padding: 8px 15px; background: #007AFF; color: #fff; border: none; border-radius: 4px; cursor: pointer;">复制日志</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('#close-debug-log').onclick = () => {
            modal.style.display = 'none';
        };
        
        window.copyShoppingDebugLog = function() {
            const content = shoppingDebugLogs.join('\n\n');
            navigator.clipboard.writeText(content).then(() => alert('已复制到剪贴板')).catch(err => alert('复制失败: ' + err));
        };
    }
    
    const contentEl = modal.querySelector('#shopping-debug-content');
    contentEl.textContent = shoppingDebugLogs.join('\n\n');
    modal.style.display = 'flex';
};

// 切换 Tab
window.switchShoppingTab = function(tabName) {
    // 1. Update Tab Bar
    const tabs = document.querySelectorAll('#shopping-app .nav-item');
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
            content.classList.add('shopping-animate-enter');
        } else {
            content.style.display = 'none';
            content.classList.remove('shopping-animate-enter');
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
    
    // Update Header Title based on Tab
    const appTitle = document.querySelector('#shopping-app .app-title');
    if (appTitle) {
        if (tabName === 'home') appTitle.textContent = "Møde.";
        else if (tabName === 'cart') appTitle.textContent = "Cart";
        else if (tabName === 'delivery') appTitle.textContent = "Food";
        else if (tabName === 'orders') appTitle.textContent = "Orders";
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

    let gridContainer = container.querySelector('.shopping-product-grid');
    if (!gridContainer) {
        container.innerHTML = `
            <div class="shopping-hero shopping-animate-enter">
                <p>Autumn Collection</p>
                <h2>Minimalist <br>Essence</h2>
                <a href="#" class="shopping-hero-btn">EXPLORE</a>
            </div>
            
            <div class="shopping-section-header shopping-animate-enter">
                <span class="shopping-section-title">Categories</span>
                <a href="#" class="shopping-see-all">Show all</a>
            </div>
            <div class="shopping-categories shopping-animate-enter" id="shopping-category-list">
                <!-- Categories will be rendered here -->
            </div>
        `;

        gridContainer = document.createElement('div');
        gridContainer.className = 'shopping-product-grid shopping-animate-enter';
        container.appendChild(gridContainer);
        
        renderShoppingCategories();
    }
    return true;
}

// 确保外卖页面容器存在
function ensureDeliveryContainer() {
    const container = document.getElementById('shopping-tab-delivery');
    if (!container) return false;

    let listContainer = container.querySelector('.shopping-restaurant-list');
    if (!listContainer) {
        container.innerHTML = `
            <div class="shopping-food-search" style="margin-top: 10px;">
                <svg viewBox="0 0 24 24" style="width:18px;height:18px;color:#8e8e93;">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span>Crave something?</span>
            </div>
            
            <div class="shopping-section-header" style="padding-top: 10px; padding-bottom: 10px;">
                <span class="shopping-section-title" style="font-size:18px;">Popular Near You</span>
            </div>
        `;

        listContainer = document.createElement('div');
        listContainer.className = 'shopping-restaurant-list';
        listContainer.style.marginTop = '0';
        
        container.appendChild(listContainer);
    }
    return true;
}

// 初始化监听器
function setupShoppingListeners() {
    // 启动订单状态检查定时器
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
            const currentTab = document.querySelector('#shopping-app .nav-item.active');
            const optGenerate = document.getElementById('shopping-opt-generate');
            const optAdd = document.getElementById('shopping-opt-add');
            const optManage = document.getElementById('shopping-opt-manage');
            
            if (currentTab && currentTab.dataset.tab === 'delivery') {
                if (optGenerate) optGenerate.querySelector('span').textContent = '生成外卖';
                if (optManage) optManage.querySelector('span').textContent = '管理外卖';
                if (optAdd) optAdd.classList.add('hidden');
            } else {
                if (optGenerate) optGenerate.querySelector('span').textContent = '生成商品';
                if (optManage) optManage.querySelector('span').textContent = '管理商品';
                if (optAdd) optAdd.classList.remove('hidden');
            }
            document.getElementById('shopping-options-modal').classList.remove('hidden');
        });
    }

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

    const closeAddBtn = document.getElementById('close-shopping-add-product');
    const saveAddBtn = document.getElementById('save-shopping-product-btn');
    const addModal = document.getElementById('shopping-add-product-modal');

    if (closeAddBtn) closeAddBtn.addEventListener('click', () => addModal.classList.add('hidden'));
    if (saveAddBtn) saveAddBtn.addEventListener('click', handleSaveShoppingProduct);

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
        updateLinkButtonState();
    }

    // Detail View Back Buttons
    window.closeDetail = function(type) {
        if (type === 'product') {
            document.getElementById('product-detail').classList.remove('active');
        } else if (type === 'food') {
            document.getElementById('food-detail').classList.remove('active');
        }
    };

    // Tab Clicks
    const tabs = document.querySelectorAll('#shopping-app .nav-item');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            if (tabName) {
                window.switchShoppingTab(tabName);
            }
        });
    });
    
    const orderTabs = document.querySelectorAll('.shopping-order-tab');
    orderTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            orderTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
    
    // Spec Modal Listeners
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
    
    // Share Button
    const shareBtn = document.getElementById('shopping-share-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            if (currentShoppingProduct) {
                openProductShareContactPicker(currentShoppingProduct);
            }
        });
    }
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
    const imageDesc = desc ? desc.substring(0, 5) : title.substring(0, 5);
    
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
        aiImage: null,
        bgColor: bgColor,
        imgHeight: height
    };

    if (!window.iphoneSimState.shoppingProducts) {
        window.iphoneSimState.shoppingProducts = [];
    }
    window.iphoneSimState.shoppingProducts.unshift(product);
    saveConfig();

    ensureShoppingContainer();
    renderShoppingProducts(window.iphoneSimState.shoppingProducts);
    
    document.getElementById('shopping-add-title').value = '';
    document.getElementById('shopping-add-price').value = '';
    document.getElementById('shopping-add-shop').value = '';
    document.getElementById('shopping-add-paid').value = '';
    document.getElementById('shopping-add-desc').value = '';
    
    document.getElementById('shopping-add-product-modal').classList.add('hidden');
    
    if (desc) {
        (async () => {
            const url = await generateAiImage(desc);
            if (url) {
                product.aiImage = url;
                saveConfig();
                renderShoppingProducts(window.iphoneSimState.shoppingProducts);
            }
        })();
    }
}

function enterShoppingManageMode() {
    isShoppingManageMode = true;
    selectedShoppingProducts.clear();
    document.getElementById('shopping-manage-header').classList.remove('hidden');
    updateDeleteButton();
    const currentTab = document.querySelector('#shopping-app .nav-item.active');
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
    const currentTab = document.querySelector('#shopping-app .nav-item.active');
    if (currentTab && currentTab.dataset.tab === 'delivery') {
        renderDeliveryItems();
    } else if (window.iphoneSimState.shoppingProducts) {
        renderShoppingProducts(window.iphoneSimState.shoppingProducts);
    }
}

function toggleProductSelection(id, cardElement) {
    if (selectedShoppingProducts.has(id)) {
        selectedShoppingProducts.delete(id);
        cardElement.classList.remove('selected');
    } else {
        selectedShoppingProducts.add(id);
        cardElement.classList.add('selected');
    }
    updateDeleteButton();
}

function toggleSelectAllShoppingItems() {
    const currentTab = document.querySelector('#shopping-app .nav-item.active');
    let allItems = [];
    
    if (currentTab && currentTab.dataset.tab === 'delivery') {
        allItems = window.iphoneSimState.deliveryItems || [];
    } else {
        allItems = window.iphoneSimState.shoppingProducts || [];
    }

    if (allItems.length === 0) return;

    if (selectedShoppingProducts.size === allItems.length) {
        selectedShoppingProducts.clear();
    } else {
        selectedShoppingProducts.clear();
        allItems.forEach(p => selectedShoppingProducts.add(p.id));
    }
    
    updateDeleteButton();
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
        const currentTab = document.querySelector('#shopping-app .nav-item.active');
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
        const currentTab = document.querySelector('#shopping-app .nav-item.active');
        
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
    
    let linkedIds = window.iphoneSimState.shoppingLinkedContactIds || [];
    if (window.iphoneSimState.shoppingLinkedContactId && !linkedIds.includes(window.iphoneSimState.shoppingLinkedContactId)) {
        linkedIds.push(window.iphoneSimState.shoppingLinkedContactId);
    }
    
    if (linkedIds.length > 0) {
        btn.style.color = '#007AFF';
    } else {
        btn.style.color = '#333';
    }
}

function openShoppingContactPicker() {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = '选择关联联系人 / 世界书';
    
    if (sendBtn) {
        sendBtn.textContent = '确定';
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        newSendBtn.onclick = () => {
            const selected = list.querySelectorAll('input[type="checkbox"][name="shopping-contact"]:checked');
            const ids = Array.from(selected).map(cb => parseInt(cb.value)).filter(id => id !== 0);
            
            window.iphoneSimState.shoppingLinkedContactIds = ids;
            delete window.iphoneSimState.shoppingLinkedContactId;
            
            const selectedWb = list.querySelectorAll('input[type="checkbox"][name="shopping-wb"]:checked');
            const wbIds = Array.from(selectedWb).map(cb => parseInt(cb.value));
            window.iphoneSimState.shoppingLinkedWbIds = wbIds;
            
            saveConfig(); 
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
    
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.onclick = () => modal.classList.add('hidden');
    }

    list.innerHTML = '';
    
    let currentIds = window.iphoneSimState.shoppingLinkedContactIds || [];
    if (window.iphoneSimState.shoppingLinkedContactId && currentIds.length === 0) {
        currentIds = [window.iphoneSimState.shoppingLinkedContactId];
    }
    
    let currentWbIds = window.iphoneSimState.shoppingLinkedWbIds || [];

    const contactHeader = document.createElement('div');
    contactHeader.textContent = '联系人';
    contactHeader.style.padding = '10px 15px 5px';
    contactHeader.style.fontSize = '12px';
    contactHeader.style.color = '#999';
    contactHeader.style.background = '#f5f5f5';
    list.appendChild(contactHeader);

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
                if (e.target.type !== 'checkbox') {
                    const checkbox = item.querySelector('input');
                    if (checkbox) checkbox.checked = !checkbox.checked;
                }
            };
            list.appendChild(item);
        });
    }

    const wbHeader = document.createElement('div');
    wbHeader.textContent = '世界书 (将作为背景设定发送给AI)';
    wbHeader.style.padding = '10px 15px 5px';
    wbHeader.style.fontSize = '12px';
    wbHeader.style.color = '#999';
    wbHeader.style.background = '#f5f5f5';
    list.appendChild(wbHeader);

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

window.initShoppingUI = function() {
    ensureShoppingContainer();
    renderShoppingCategories();
    
    if (window.iphoneSimState.shoppingProducts && window.iphoneSimState.shoppingProducts.length > 0) {
        renderShoppingProducts();
    }

    if (window.iphoneSimState.deliveryItems && window.iphoneSimState.deliveryItems.length > 0) {
        ensureDeliveryContainer();
        renderDeliveryItems();
    }

    updateLinkButtonState();
};

function renderShoppingCategories() {
    const listEl = document.getElementById('shopping-category-list');
    if (!listEl) return;
    
    const categories = ['All', ...(window.iphoneSimState.shoppingCategories || [])];
    
    listEl.innerHTML = '';
    categories.forEach(cat => {
        const chip = document.createElement('div');
        chip.className = `shopping-cat-chip ${cat === currentShoppingCategory ? 'active' : ''}`;
        chip.textContent = cat;
        chip.onclick = () => {
            currentShoppingCategory = cat;
            renderShoppingCategories(); // Re-render to update active class
            renderShoppingProducts();
        };
        listEl.appendChild(chip);
    });
}

async function generateShoppingProducts() {
    const currentTab = document.querySelector('#shopping-app .nav-item.active');
    if (currentTab && currentTab.dataset.tab === 'delivery') {
        return generateDeliveryItems();
    }

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        alert('请先在设置中配置 AI API');
        return;
    }
    
    shoppingDebugLogs = [];
    addShoppingLog('开始生成商品任务');

    const container = document.getElementById('shopping-tab-home');
    ensureShoppingContainer();
    
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'shopping-loading';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.color = '#999';
    loadingDiv.textContent = '正在生成推荐商品...';
    
    const gridContainer = container.querySelector('.shopping-product-grid');
    if (gridContainer) {
        container.insertBefore(loadingDiv, gridContainer);
    } else {
        container.appendChild(loadingDiv);
    }

    let userContext = '';
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
                const history = window.iphoneSimState.chatHistory[id] || [];
                if (history.length > 0) {
                    const recentMsgs = history.slice(-15).map(m => {
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

    let linkedWbIds = window.iphoneSimState.shoppingLinkedWbIds || [];
    if (linkedWbIds.length > 0 && window.iphoneSimState.worldbook) {
        userContext += `\n【关联世界书/背景设定】\n以下是相关的世界观设定，请生成符合这些设定的商品：\n`;
        let wbContentFound = false;
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

    const systemPrompt = `你是一个电商推荐助手。请生成 3-4 个商品分类，以及每个分类下 4-7 个虚构的商品信息。
请直接返回 JSON 对象格式，包含 categories 数组和 products 数组。不要包含任何 Markdown 标记或其他文本。
【重要】必须输出标准的JSON格式。所有字符串内的换行符必须转义(使用 \\n)，禁止在字符串值中使用实际的换行符。
格式如下：
{
  "categories": ["分类1", "分类2", ...],
  "products": [
    {
      "title": "商品标题",
      "price": 99.9,
      "category": "分类1",
      "paid_count": "100+",
      "shop_name": "店铺名",
      "image_desc": "图片描述(短)",
      "detail_desc": "详情描述",
      "specifications": {"规格名": ["选项1", "选项2"]}
    },
    ...
  ]
}

${userContext ? userContext : '商品种类要丰富，包括但不限于：服饰、数码、美食、家居、美妆等。'}`;

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }
        
        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
        const requestBody = {
            model: settings.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '生成推荐商品' }
            ],
            temperature: 0.7
        };

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errText.substring(0, 100)}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;
        
        let result = {};
        try {
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            result = JSON.parse(cleanContent);
        } catch(e) {
            console.error('JSON Parse Failed:', e);
            try {
                // Try to capture the main object structure
                const objectMatch = content.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                    // Attempt to fix common bad control character issues (newlines in strings)
                    // This is a naive heuristic: assume " followed by newline is bad if not followed by whitespace/comma/brace
                    let fixedContent = objectMatch[0];
                    // Very basic cleanup: remove unprintable control chars except newlines/tabs
                    fixedContent = fixedContent.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ""); 
                    
                    result = JSON.parse(fixedContent);
                } else {
                    // Fallback to array if AI returned array instead of object
                    const arrayMatch = content.match(/\[[\s\S]*\]/);
                    if (arrayMatch) {
                        const arr = JSON.parse(arrayMatch[0]);
                        result = { categories: [], products: arr };
                    }
                }
            } catch (e2) {
                console.error('JSON Rescue Failed:', e2);
                alert('生成数据格式有误，请重试');
                return;
            }
        }

        const products = result.products || [];
        const categories = result.categories || [];

        if (products.length > 0) {
            products.forEach((p, index) => {
                p.id = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9) + '_' + index;
            });

            if (!window.iphoneSimState.shoppingProducts) window.iphoneSimState.shoppingProducts = [];
            window.iphoneSimState.shoppingProducts = products;
            window.iphoneSimState.shoppingCategories = categories;
            currentShoppingCategory = 'All';
            
            saveConfig();
            
            renderShoppingCategories();
            renderShoppingProducts();

            (async () => {
                for (const p of products) {
                    if (p.image_desc) {
                        const url = await generateAiImage(p.image_desc);
                        if (url) {
                            p.aiImage = url;
                            saveConfig();
                            renderShoppingProducts(); 
                        }
                    }
                }
            })();
        } else {
            alert('未生成有效商品数据');
        }
    } catch (error) {
        console.error('Gen Error', error);
        alert('生成失败: ' + error.message);
    } finally {
        const loading = document.getElementById('shopping-loading');
        if (loading) loading.remove();
    }
}

function renderShoppingProducts() {
    const container = document.getElementById('shopping-tab-home');
    ensureShoppingContainer();
    const gridContainer = container.querySelector('.shopping-product-grid');
    
    if (!gridContainer) return;

    gridContainer.innerHTML = '';

    let products = window.iphoneSimState.shoppingProducts || [];
    
    // Filter by category
    if (currentShoppingCategory !== 'All') {
        products = products.filter(p => p.category === currentShoppingCategory);
    }

    if (products.length === 0) {
        gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 20px;">暂无该分类商品</div>';
        return;
    }

    products.forEach((p, index) => {
        const card = document.createElement('div');
        card.className = 'shopping-product-card shopping-animate-enter';
        card.style.animationDelay = `${index * 0.05}s`;
        card.dataset.id = p.id;
        
        if (isShoppingManageMode) {
            card.onclick = () => toggleProductSelection(p.id, card);
        } else {
            card.onclick = () => openShoppingProductDetail(p);
        }

        const isSelected = selectedShoppingProducts.has(p.id);
        if (isSelected && isShoppingManageMode) {
            card.classList.add('selected');
        }

        if (!p.bgColor) p.bgColor = window.getRandomPastelColor();
        let validBgColor = p.bgColor;
        if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl')) validBgColor = '#' + validBgColor;

        const shapes = ['circle', 'rect', 'tri'];
        const shape = shapes[index % 3];
        
        let imgHtml = '';
        let shapeStyle = '';
        
        if (p.aiImage) {
            imgHtml = `<img id="product-img-${p.id}" src="${p.aiImage}" style="position: absolute; width: 80%; height: 80%; object-fit: contain; z-index: 1;">`;
        } else {
            // Use colored shape if no AI image
            shapeStyle = `background: linear-gradient(135deg, ${validBgColor} 0%, #ffffff 100%)`;
        }

        card.innerHTML = `
            <div class="shopping-img-box">
                <div class="shopping-shape ${shape}" style="${shapeStyle}"></div>
                ${imgHtml}
                <div class="shopping-selection-check"><i class="fas fa-check"></i></div>
                <button class="shopping-fav-btn">
                    <svg viewBox="0 0 24 24" stroke-width="1.5" style="width:18px;height:18px;fill:none;stroke:currentColor;">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                </button>
            </div>
            <div class="shopping-product-info">
                <h3>${p.title}</h3>
                <p>${p.shop_name}</p>
                <div class="shopping-price">¥${p.price}</div>
            </div>
        `;
        
        gridContainer.appendChild(card);
    });
}

function openShoppingProductDetail(product) {
    currentShoppingProduct = product;
    const detailView = document.getElementById('product-detail');
    if (!detailView) return;

    // Populate Data
    const imgContainer = detailView.querySelector('.shopping-pd-image');
    const imgEl = document.getElementById('shopping-detail-img');
    
    // Clear previous shapes
    if (imgContainer) {
        const existingShape = imgContainer.querySelector('.shopping-shape');
        if (existingShape) existingShape.remove();
    }

    if (product.aiImage) {
        if (imgEl) {
            imgEl.src = product.aiImage;
            imgEl.style.display = 'block';
        }
    } else {
        if (imgEl) imgEl.style.display = 'none';
        
        // Add shape if no image
        if (imgContainer) {
            let validBgColor = product.bgColor || window.getRandomPastelColor();
            if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl')) validBgColor = '#' + validBgColor;
            
            const shapeDiv = document.createElement('div');
            shapeDiv.className = 'shopping-shape circle';
            shapeDiv.style.width = '70%';
            shapeDiv.style.height = '70%';
            shapeDiv.style.background = `linear-gradient(135deg, ${validBgColor} 0%, #ffffff 100%)`;
            imgContainer.appendChild(shapeDiv);
        }
    }

    document.getElementById('shopping-detail-title').textContent = product.title;
    document.getElementById('shopping-detail-price').textContent = '¥' + product.price;
    document.getElementById('shopping-detail-desc').textContent = product.detail_desc || product.title;

    const addBtn = document.getElementById('detail-add-to-cart-btn');
    if (addBtn) {
        const newBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newBtn, addBtn);
        
        newBtn.onclick = () => {
            if (product.specifications && Object.keys(product.specifications).length > 0) {
                openShoppingSpecModal(product, (productWithSpec) => {
                    addToCart(productWithSpec);
                    const toast = document.getElementById('shopping-success-toast');
                    if (toast) {
                        toast.classList.remove('hidden');
                        setTimeout(() => toast.classList.add('hidden'), 1500);
                    }
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
    }

    detailView.classList.add('active');
}

function openShoppingSpecModal(product, callback) {
    pendingSpecProduct = product;
    pendingSpecCallback = callback;
    selectedSpecs = {}; 

    const modal = document.getElementById('shopping-spec-modal');
    const container = document.getElementById('shopping-spec-container');
    const imgEl = document.getElementById('shopping-spec-img');
    const priceEl = document.getElementById('shopping-spec-price');
    const selectedTextEl = document.getElementById('shopping-spec-selected-text');

    if (!modal || !container) return;

    if (imgEl) {
        let validBgColor = product.bgColor || 'cccccc';
        if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl')) validBgColor = '#' + validBgColor;
        const imgUrl = product.aiImage || generatePlaceholderImage(300, product.imgHeight || 300, product.image_desc || product.title, validBgColor);
        imgEl.src = imgUrl;
    }
    if (priceEl) priceEl.textContent = product.price;
    if (selectedTextEl) selectedTextEl.textContent = '请选择规格';

    container.innerHTML = '';
    
    if (product.specifications) {
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
                    Array.from(optionsDiv.children).forEach(c => c.classList.remove('selected'));
                    btn.classList.add('selected');
                    selectedSpecs[specName] = option;
                    updateSpecSelectedText();
                };
                optionsDiv.appendChild(btn);
            });
            
            group.appendChild(optionsDiv);
            container.appendChild(group);
        }
    }

    modal.classList.remove('hidden');
}

function updateSpecSelectedText() {
    const el = document.getElementById('shopping-spec-selected-text');
    if (!el || !pendingSpecProduct) return;
    
    const specs = pendingSpecProduct.specifications || {};
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
    
    const specs = pendingSpecProduct.specifications || {};
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
    
    const productWithSpec = {
        ...pendingSpecProduct,
        selectedSpec: specString,
        selectedSpecsMap: { ...selectedSpecs },
        cartId: pendingSpecProduct.id + '_' + Object.values(selectedSpecs).join('_')
    };
    
    document.getElementById('shopping-spec-modal').classList.add('hidden');
    
    if (pendingSpecCallback) {
        pendingSpecCallback(productWithSpec);
    }
}

function addToCart(product) {
    if (!window.iphoneSimState.shoppingCart) {
        window.iphoneSimState.shoppingCart = [];
    }
    
    const identifyId = product.cartId || product.id;
    const existing = window.iphoneSimState.shoppingCart.find(item => (item.cartId || item.id) === identifyId);
    
    if (existing) {
        existing.count = (existing.count || 1) + 1;
    } else {
        window.iphoneSimState.shoppingCart.push({
            ...product,
            count: 1,
            selected: true 
        });
    }
    saveConfig();
}

function renderShoppingCart(animate = false) {
    const container = document.getElementById('shopping-tab-cart');
    if (!container) return;

    const cart = window.iphoneSimState.shoppingCart || [];
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999; margin-top: 50px;">
                <p>购物车空空如也</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    const listDiv = document.createElement('div');
    if (animate) listDiv.className = 'shopping-animate-enter';
    listDiv.style.padding = '10px';
    
    cart.forEach(item => {
        let validBgColor = item.bgColor || 'cccccc'; 
        if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl')) validBgColor = '#' + validBgColor;
        const imgUrl = item.aiImage || generatePlaceholderImage(300, 300, item.image_desc || '商品', validBgColor);

        const itemDiv = document.createElement('div');
        itemDiv.className = 'shopping-cart-item';
        itemDiv.innerHTML = `
            <div class="shopping-cart-img">
                 <img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">
            </div>
            <div class="shopping-cart-details">
                <div>
                    <div class="shopping-cart-title">${item.title}</div>
                    <div class="shopping-cart-variant">默认规格</div>
                </div>
                <div class="shopping-cart-price">¥${item.price}</div>
            </div>
            <div class="shopping-cart-actions">
                <button class="shopping-remove-btn">
                    <svg viewBox="0 0 24 24" style="width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div class="shopping-qty-control">
                    <button class="shopping-qty-btn minus">-</button>
                    <span class="shopping-qty-val">${item.count}</span>
                    <button class="shopping-qty-btn plus">+</button>
                </div>
            </div>
        `;
        
        // Attach listeners
        itemDiv.querySelector('.shopping-remove-btn').onclick = () => deleteCartItem(item.id);
        
        const minusBtn = itemDiv.querySelector('.shopping-qty-btn.minus');
        const plusBtn = itemDiv.querySelector('.shopping-qty-btn.plus');
        
        minusBtn.onclick = () => {
            if (item.count > 1) {
                item.count--;
                saveConfig();
                renderShoppingCart(false);
            } else {
                if(confirm('Delete this item?')) {
                    deleteCartItem(item.id);
                }
            }
        };
        
        plusBtn.onclick = () => {
            item.count++;
            saveConfig();
            renderShoppingCart(false);
        };
        
        listDiv.appendChild(itemDiv);
    });

    container.appendChild(listDiv);

    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.count), 0).toFixed(2);

    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'shopping-cart-summary';
    summaryDiv.innerHTML = `
        <div class="shopping-summary-row">
            <span>Subtotal</span>
            <span>¥${totalPrice}</span>
        </div>
        <div class="shopping-summary-row total">
            <span>Total</span>
            <span>¥${totalPrice}</span>
        </div>
        <button class="shopping-checkout-btn">Proceed to Checkout</button>
    `;
    summaryDiv.querySelector('.shopping-checkout-btn').onclick = () => handleCartBuy();
    
    container.appendChild(summaryDiv);
}

window.toggleCartItemSelection = function(id) {
    // Simplified
};

window.toggleSelectAllCart = function() {
};

let pendingPaymentItems = [];
let pendingPaymentAmount = 0;

window.handleCartBuy = function() {
    const cart = window.iphoneSimState.shoppingCart || [];
    const selected = cart; 
    if (selected.length === 0) {
        alert('购物车为空');
        return;
    }
    
    const totalStr = selected.reduce((s, i) => s + i.price * i.count, 0).toFixed(2);
    openPaymentChoice(parseFloat(totalStr), selected, true);
};

window.handleBuyNow = function(product) {
    openPaymentChoice(product.price, [product]);
};

function openPaymentChoice(amount, items, isCart = false) {
    pendingPaymentAmount = amount;
    pendingPaymentItems = items.map(item => {
        let validBgColor = item.bgColor || 'cccccc';
        if (!validBgColor.startsWith('#') && !validBgColor.startsWith('hsl')) validBgColor = '#' + validBgColor;
        return {
            ...item,
            count: item.count || 1,
            image: item.image || item.aiImage || generatePlaceholderImage(300, item.imgHeight || 300, item.image_desc || item.title || '商品', validBgColor)
        };
    });
    pendingPaymentItems.isCart = isCart;

    const modal = document.getElementById('shopping-payment-choice-modal');
    if (!modal) return;

    const totalEl = document.getElementById('payment-choice-total');
    if (totalEl) totalEl.textContent = '¥' + amount.toFixed(2);

    const selfBtn = document.getElementById('payment-choice-self');
    const giftBtn = document.getElementById('payment-choice-gift');
    const closeBtn = document.getElementById('close-payment-choice');

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
    
    if (!window.iphoneSimState.wallet) {
        window.iphoneSimState.wallet = { balance: 0, transactions: [] };
    }
    const wallet = window.iphoneSimState.wallet;
    
    if (wallet.balance < totalAmount) {
        alert(`余额不足，无法支付\n需支付: ¥${totalStr}\n当前余额: ¥${wallet.balance.toFixed(2)}`);
        return;
    }
    
    if (confirm(`确定要使用钱包余额支付 ¥${totalStr} 购买吗？`)) {
        if (!window.iphoneSimState.shoppingOrders) {
            window.iphoneSimState.shoppingOrders = [];
        }
        
        const orderItems = pendingPaymentItems.map(item => ({
            title: item.title,
            price: item.price,
            image: item.image,
            count: item.count,
            isDelivery: item.isDelivery,
            selectedSpec: item.selectedSpec,
            shop_name: item.shop_name
        }));

        const newOrder = {
            id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 5),
            items: orderItems,
            total: totalStr,
            time: Date.now(),
            status: '待发货'
        };
        
        const hour = 3600000;
        newOrder.shipDelay = Math.floor(2 * hour + Math.random() * (22 * hour));
        newOrder.deliverDelay = Math.floor(48 * hour + Math.random() * (24 * hour));
        
        window.iphoneSimState.shoppingOrders.unshift(newOrder);

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

        if (pendingPaymentItems.isCart) {
            if (window.iphoneSimState.shoppingCart) {
                // Clear cart or selected items (here all cart)
                window.iphoneSimState.shoppingCart = [];
                renderShoppingCart();
            }
        }
        
        saveConfig();
        
        // Close details if open
        document.getElementById('product-detail').classList.remove('active');
        document.getElementById('food-detail').classList.remove('active');
        
        window.switchShoppingTab('orders');
        alert('支付成功！已生成订单');
    }
}

window.handleCartPayByFriend = function() {
    const cart = window.iphoneSimState.shoppingCart || [];
    const selected = cart; 
    if (selected.length === 0) {
        alert('购物车为空');
        return;
    }
    openShoppingContactPickerForPay(selected);
};

window.handleCartTouchStart = function() {};
window.handleCartTouchMove = function() {};
window.handleCartTouchEnd = function() {};
window.handleCartContextMenu = function() {};

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
    
    if (sendBtn) {
        sendBtn.textContent = '支付并发送';
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        newSendBtn.onclick = () => {
            const selectedContact = list.querySelectorAll('input[type="checkbox"]:checked');
            const ids = Array.from(selectedContact).map(cb => parseInt(cb.value)).filter(id => id !== 0);
            
            if (ids.length > 0) {
                const totalAmount = pendingPaymentAmount * ids.length;
                if (ids.length > 1 && !confirm(`你选择了 ${ids.length} 位好友，将购买 ${ids.length} 份商品，总计 ¥${(totalAmount).toFixed(2)}。确定吗？`)) {
                    return;
                }
                
                if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0, transactions: [] };
                const wallet = window.iphoneSimState.wallet;
                if (wallet.balance < totalAmount) {
                    alert('余额不足');
                    return;
                }
                
                wallet.balance -= totalAmount;
                
                ids.forEach(contactId => {
                    // Send message logic (simplified)
                    const msgData = {
                        items: items.map(i => ({ title: i.title, price: i.price, image: i.image })),
                        total: pendingPaymentAmount.toFixed(2)
                    };
                    if (typeof sendMessage !== 'undefined') sendMessage(JSON.stringify(msgData), true, 'shopping_gift', null, contactId);
                });
                
                saveConfig();
                modal.classList.add('hidden');
                document.getElementById('product-detail').classList.remove('active');
                window.switchShoppingTab('orders');
                alert('支付成功！礼物已发送');
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
            item.innerHTML = `<span style="font-size: 16px;">${c.remark || c.name}</span><input type="checkbox" value="${c.id}" style="width: 20px; height: 20px;">`;
            item.onclick = (e) => { if (e.target.type !== 'checkbox') item.querySelector('input').click(); };
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
    if (header) header.textContent = '请谁代付';
    
    if (sendBtn) {
        sendBtn.textContent = '发送请求';
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        newSendBtn.onclick = () => {
            const selectedContact = list.querySelectorAll('input[type="checkbox"]:checked');
            const ids = Array.from(selectedContact).map(cb => parseInt(cb.value)).filter(id => id !== 0);
            
            if (ids.length > 0) {
                const totalPrice = items.reduce((s, i) => s + i.price * i.count, 0).toFixed(2);
                const payData = { type: 'pay_request', total: totalPrice, items: items.map(i => ({ title: i.title })) };
                ids.forEach(id => {
                    if (typeof sendMessage !== 'undefined') sendMessage(JSON.stringify(payData), true, 'pay_request', null, id);
                });
                modal.classList.add('hidden');
                alert('代付请求已发送');
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
            item.innerHTML = `<span style="font-size: 16px;">${c.remark || c.name}</span><input type="checkbox" value="${c.id}" style="width: 20px; height: 20px;">`;
            item.onclick = (e) => { if (e.target.type !== 'checkbox') item.querySelector('input').click(); };
            list.appendChild(item);
        });
    }
    modal.classList.remove('hidden');
}

window.getRandomPastelColor = function() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 85%)`; 
};

window.getRandomPaleColor = function() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 30%, 92%)`; 
};

function generatePlaceholderImage(width, height, text, bgColor) {
    const scale = 2; 
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    const baseFontSize = Math.max(16, Math.min(32, width / (text.length || 1)));
    const fontSize = baseFontSize * scale;
    
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
}

async function generateAiImage(prompt) {
    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) return null;

    try {
        let baseUrl = settings.url;
        if (baseUrl.endsWith('/v1')) {
            baseUrl = baseUrl + '/images/generations';
        } else if (baseUrl.endsWith('/chat/completions')) {
            baseUrl = baseUrl.replace('/chat/completions', '/images/generations');
        } else if (baseUrl.endsWith('/')) {
            baseUrl = baseUrl + 'images/generations';
        } else {
            baseUrl = baseUrl + '/v1/images/generations';
        }

        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
        
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                prompt: prompt,
                n: 1,
                size: "256x256",
                response_format: "url"
            })
        });

        if (!response.ok) return null;

        const data = await response.json();
        if (data.data && data.data.length > 0) {
            return data.data[0].url;
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
    if (header) header.textContent = '分享商品';
    
    if (sendBtn) {
        sendBtn.textContent = '发送';
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        newSendBtn.onclick = () => {
            const selectedContact = list.querySelectorAll('input[type="checkbox"]:checked');
            const ids = Array.from(selectedContact).map(cb => parseInt(cb.value)).filter(id => id !== 0);
            
            if (ids.length > 0) {
                ids.forEach(id => {
                    const msgData = {
                        type: 'product_share',
                        product: {
                            title: product.title,
                            price: product.price,
                            image: product.aiImage || product.image, // Ensure image is passed
                            desc: product.detail_desc
                        }
                    };
                    // Use generic message sending if available, or simulate
                    if (typeof sendMessage !== 'undefined') {
                        sendMessage(JSON.stringify(msgData), true, 'product_share', null, id);
                    } else {
                        // Fallback or log
                        console.log('Sending product share to', id, msgData);
                    }
                });
                modal.classList.add('hidden');
                alert('已分享');
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
                <input type="checkbox" value="${c.id}" style="width: 20px; height: 20px;">
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
        list.innerHTML = '<div style="padding:20px;text-align:center;color:#999;">暂无联系人</div>';
    }
    
    modal.classList.remove('hidden');
}

function updateShoppingOrderStatuses() {
    if (!window.iphoneSimState.shoppingOrders) return;

    let hasChanges = false;
    const now = Date.now();
    const hour = 3600000;

    window.iphoneSimState.shoppingOrders.forEach(order => {
        let isDeliveryOrder = order.items && order.items.some(i => i.isDelivery);

        if (isDeliveryOrder) {
             if (!order.shipDelay || order.shipDelay > 2 * 3600000) {
                 order.shipDelay = Math.floor(5 * 60000 + Math.random() * (5 * 60000));
                 hasChanges = true;
             }
             if (!order.deliverDelay || order.deliverDelay > 3 * 3600000) {
                 order.deliverDelay = Math.floor(30 * 60000 + Math.random() * (10 * 60000));
                 hasChanges = true;
             }
        } else {
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
        const currentTab = document.querySelector('#shopping-app .nav-item.active');
        if (currentTab && currentTab.dataset.tab === 'orders') {
            renderShoppingOrders();
        }
    }
}

function renderShoppingOrders() {
    const container = document.getElementById('shopping-tab-orders');
    if (!container) return;

    let orders = window.iphoneSimState.shoppingOrders || [];
    orders.sort((a, b) => b.time - a.time);

    // Filter based on tab
    if (currentOrderTab === 'active') {
        orders = orders.filter(o => o.status !== '已完成' && o.status !== 'DELIVERED');
    } else if (currentOrderTab === 'history') {
        orders = orders.filter(o => o.status === '已完成' || o.status === 'DELIVERED');
    }

    // Check if tabs already exist
    let tabsDiv = container.querySelector('.shopping-order-tabs');
    if (!tabsDiv) {
        // Initial Render
        container.innerHTML = '';
        
        tabsDiv = document.createElement('div');
        tabsDiv.className = 'shopping-order-tabs';
        
        const indicator = document.createElement('div');
        indicator.className = 'shopping-tab-indicator';
        tabsDiv.appendChild(indicator);
        
        ['all', 'active', 'history'].forEach(tab => {
            const tabEl = document.createElement('div');
            tabEl.className = 'shopping-order-tab';
            tabEl.dataset.tab = tab;
            tabEl.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
            tabEl.onclick = () => {
                currentOrderTab = tab;
                renderShoppingOrders();
            };
            tabsDiv.appendChild(tabEl);
        });
        container.appendChild(tabsDiv);
    }

    // Update Tab State & Indicator
    const indicator = tabsDiv.querySelector('.shopping-tab-indicator');
    const tabs = ['all', 'active', 'history'];
    const activeIndex = tabs.indexOf(currentOrderTab);
    
    if (indicator) {
        indicator.style.left = `${activeIndex * 33.33}%`;
    }
    
    tabsDiv.querySelectorAll('.shopping-order-tab').forEach(el => {
        if (el.dataset.tab === currentOrderTab) {
            el.classList.add('active');
        } else {
            el.classList.remove('active');
        }
    });

    // Update List Content
    let listDiv = container.querySelector('.shopping-order-list');
    if (!listDiv) {
        listDiv = document.createElement('div');
        listDiv.className = 'shopping-order-list';
        container.appendChild(listDiv);
    }
    listDiv.innerHTML = ''; // Clear previous items
    
    if (orders.length === 0) {
        listDiv.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #999; margin-top: 50px;">
                <p>暂无订单</p>
            </div>
        `;
        return;
    }

    const formatTime = (ts) => {
        const d = new Date(ts);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2,'0')}`;
    };

    orders.forEach(order => {
        const isDelivery = order.items && order.items.some(i => i.isDelivery);
        const icon = isDelivery ? '🍔' : '📦';
        const storeName = isDelivery ? (order.items[0].shop_name || '外卖商家') : (order.items[0].shop_name || '购物商家');
        const itemsText = order.items.map(i => i.title).join(', ');
        
        let badgeClass = 'shopping-status-done';
        let statusText = 'DELIVERED';
        
        if (order.status === '待发货') {
            badgeClass = 'shopping-status-active';
            statusText = 'PREPARING';
        } else if (order.status === '已发货') {
            badgeClass = 'shopping-status-active';
            statusText = 'ON DELIVERY';
        } else if (order.status === '已完成') {
            statusText = 'DELIVERED';
        } else {
            statusText = order.status;
        }

        // Calculate approximate times for display
        const timeOrdered = formatTime(order.time);
        
        // Prep time ~ 20-30 mins after order
        const prepTimeTs = order.time + (25 * 60 * 1000);
        const timePrepared = formatTime(prepTimeTs);
        
        // Ship time
        const shipTimeTs = order.time + (order.shipDelay || 3600000);
        const timeShipped = formatTime(shipTimeTs);
        
        // Deliver time
        const deliverTimeTs = order.time + (order.deliverDelay || 7200000);
        const timeDelivered = formatTime(deliverTimeTs);
        
        let tlHtml = '';
        if (order.status === '待发货') {
            tlHtml = `
                <div class="shopping-timeline-item">
                    <div class="shopping-tl-dot active"></div>
                    <span class="shopping-tl-label">Ordered</span>
                    <span class="shopping-tl-time">${timeOrdered}</span>
                </div>
                <div class="shopping-timeline-item">
                    <div class="shopping-tl-dot active pulse"></div>
                    <span class="shopping-tl-label">Preparing</span>
                    <span class="shopping-tl-time">~ ${timePrepared}</span>
                </div>
                <div class="shopping-timeline-item">
                    <div class="shopping-tl-dot"></div>
                    <span class="shopping-tl-label">Shipped</span>
                    <span class="shopping-tl-time" style="opacity:0.5">~ ${timeShipped}</span>
                </div>
            `;
        } else if (order.status === '已发货') {
             tlHtml = `
                <div class="shopping-timeline-item">
                    <div class="shopping-tl-dot active"></div>
                    <span class="shopping-tl-label">Ordered</span>
                    <span class="shopping-tl-time">${timeOrdered}</span>
                </div>
                <div class="shopping-timeline-item">
                    <div class="shopping-tl-dot active"></div>
                    <span class="shopping-tl-label">Shipped</span>
                    <span class="shopping-tl-time">${timeShipped}</span>
                </div>
                <div class="shopping-timeline-item">
                    <div class="shopping-tl-dot active pulse"></div>
                    <span class="shopping-tl-label">Arriving</span>
                    <span class="shopping-tl-time">~ ${timeDelivered}</span>
                </div>
            `;
        } else { // 已完成
             tlHtml = `
                <div class="shopping-timeline-item">
                    <div class="shopping-tl-dot active"></div>
                    <span class="shopping-tl-label">Ordered</span>
                    <span class="shopping-tl-time">${timeOrdered}</span>
                </div>
                <div class="shopping-timeline-item">
                    <div class="shopping-tl-dot active"></div>
                    <span class="shopping-tl-label">Shipped</span>
                    <span class="shopping-tl-time">${timeShipped}</span>
                </div>
                <div class="shopping-timeline-item">
                    <div class="shopping-tl-dot active"></div>
                    <span class="shopping-tl-label">Delivered</span>
                    <span class="shopping-tl-time">${timeDelivered}</span>
                </div>
            `;
        }

        const card = document.createElement('div');
        card.className = 'shopping-order-card shopping-animate-enter';
        card.onclick = () => window.openShoppingOrderProgress(order.id);
        card.innerHTML = `
            <div class="shopping-order-top">
                <div class="shopping-order-store-info">
                    <div class="shopping-order-store-icon">${icon}</div>
                    <div>
                        <div class="shopping-order-store-name">${storeName}</div>
                        <div class="shopping-order-items-text">${itemsText}</div>
                    </div>
                </div>
                <div class="shopping-order-status-badge ${badgeClass}">${statusText}</div>
            </div>
            <div class="shopping-timeline">
                ${tlHtml}
            </div>
        `;
        listDiv.appendChild(card);
    });

    container.appendChild(listDiv);
}

window.openShoppingOrderProgress = function(orderId) {
    const order = window.iphoneSimState.shoppingOrders.find(o => o.id === orderId);
    if (!order) return;

    let modal = document.getElementById('shopping-order-progress-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'shopping-order-progress-modal';
        modal.className = 'modal hidden';
        modal.style.zIndex = '250';
        modal.innerHTML = `
            <div class="modal-content" style="padding: 0; background: #f2f2f7; max-height: 80vh; overflow: hidden; display: flex; flex-direction: column;">
                <div class="modal-header" style="background: #fff;">
                    <h3>订单详情</h3>
                    <button class="close-btn" onclick="document.getElementById('shopping-order-progress-modal').classList.add('hidden')">&times;</button>
                </div>
                <div class="modal-body" style="padding: 20px; overflow-y: auto;">
                    <div id="shopping-progress-content"></div>
                    <button id="shopping-progress-share-btn" class="ios-btn-block" style="margin-top: 20px;">分享给朋友</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    const contentEl = document.getElementById('shopping-progress-content');
    const shareBtn = document.getElementById('shopping-progress-share-btn');
    
    // Generate card HTML reuse
    const isDelivery = order.items && order.items.some(i => i.isDelivery);
    const icon = isDelivery ? '🍔' : '📦';
    const storeName = isDelivery ? (order.items[0].shop_name || '外卖商家') : (order.items[0].shop_name || '购物商家');
    const itemsText = order.items.map(i => `${i.title} x${i.count}`).join('<br>');
    
    // Timeline reuse (simplified for modal)
    let statusText = order.status;
    let eta = '未知';
    if (order.status === '待发货') eta = '预计明天发货';
    if (order.status === '已发货') eta = '预计2天内送达';
    if (order.status === '已完成') eta = '已送达';

    contentEl.innerHTML = `
        <div style="background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 15px;">
            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px;">
                <div style="font-size: 24px;">${icon}</div>
                <div>
                    <div style="font-weight: bold; font-size: 16px;">${storeName}</div>
                    <div style="font-size: 12px; color: #999;">${new Date(order.time).toLocaleString()}</div>
                </div>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 10px; margin-top: 10px; font-size: 14px; color: #333; line-height: 1.5;">
                ${itemsText}
            </div>
            <div style="margin-top: 15px; font-weight: bold; text-align: right;">
                合计: ¥${order.total}
            </div>
        </div>
        
        <div style="background: #fff; border-radius: 12px; padding: 20px;">
            <div style="font-weight: bold; margin-bottom: 10px;">当前状态: ${statusText}</div>
            <div style="color: #666; font-size: 14px;">${eta}</div>
        </div>
    `;

    shareBtn.onclick = () => {
        modal.classList.add('hidden');
        openShoppingProgressSharePicker(order, eta);
    };

    modal.classList.remove('hidden');
};

function openShoppingProgressSharePicker(order, eta) {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    const header = modal.querySelector('.modal-header h3');
    if (header) header.textContent = '分享订单进度';
    
    if (sendBtn) {
        sendBtn.textContent = '发送';
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        
        newSendBtn.onclick = () => {
            const selectedContact = list.querySelectorAll('input[type="checkbox"]:checked');
            const ids = Array.from(selectedContact).map(cb => parseInt(cb.value)).filter(id => id !== 0);
            
            if (ids.length > 0) {
                ids.forEach(id => {
                    const msgData = {
                        type: 'order_share',
                        orderId: order.id,
                        status: order.status,
                        eta: eta,
                        items: order.items.map(i => i.title).join(', ')
                    };
                    if (typeof sendMessage !== 'undefined') sendMessage(JSON.stringify(msgData), true, 'order_share', null, id);
                });
                modal.classList.add('hidden');
                alert('已分享');
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
            item.innerHTML = `<span style="font-size: 16px;">${c.remark || c.name}</span><input type="checkbox" value="${c.id}" style="width: 20px; height: 20px;">`;
            item.onclick = (e) => { if (e.target.type !== 'checkbox') item.querySelector('input').click(); };
            list.appendChild(item);
        });
    }
    modal.classList.remove('hidden');
}

window.handlePayForRequest = function(requestId, payerName, requestData) {
    // Keep
    return true;
};

async function generateDeliveryItems() {
    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        alert('请先在设置中配置 AI API');
        return;
    }

    const container = document.getElementById('shopping-tab-delivery');
    ensureDeliveryContainer();
    const listContainer = container.querySelector('.shopping-restaurant-list');

    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'delivery-loading';
    loadingDiv.style.textAlign = 'center';
    loadingDiv.style.padding = '20px';
    loadingDiv.style.color = '#999';
    loadingDiv.textContent = '正在搜索附近美食...';
    
    if (listContainer) {
        container.insertBefore(loadingDiv, listContainer);
    } else {
        container.appendChild(loadingDiv);
    }

    const systemPrompt = `你是一个外卖推荐助手。请生成 5-8 个虚构的外卖商品信息。
请直接返回 JSON 数组格式。不要包含任何 Markdown 标记或其他文本。
【重要】必须输出标准的JSON格式。所有字符串内的换行符必须转义(使用 \\n)，禁止在字符串值中使用实际的换行符。
每个商品包含以下字段：
- title: 菜品名称
- price: 价格 (数字)
- shop_name: 店铺名称
- delivery_time: 配送时间 (例如 "30分钟")
- delivery_fee: 配送费 (例如 "免配送" 或 "¥3")
- rating: 评分 (例如 "4.8")
- image_desc: 图片描述 (用于生成图片)
- detail_desc: 菜品详情描述

示例：
[{"title": "香辣鸡腿堡", "price": 25, "shop_name": "汉堡王", "delivery_time": "30分钟", "delivery_fee": "免配送", "rating": "4.8", "image_desc": "汉堡", "detail_desc": "美味多汁"}]`;

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }
        
        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
        const requestBody = {
            model: settings.model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: '生成外卖推荐' }
            ],
            temperature: 0.7
        };

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errText.substring(0, 100)}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;
        
        let items = [];
        try {
            const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
            items = JSON.parse(cleanContent);
        } catch(e) {
            console.error('JSON Parse Failed:', e);
            try {
                // Try to find the JSON array
                const arrayMatch = content.match(/\[[\s\S]*\]/);
                if (arrayMatch) {
                    let fixedContent = arrayMatch[0];
                    // Basic cleanup for control characters
                    fixedContent = fixedContent.replace(/[\x00-\x09\x0B-\x1F\x7F]/g, ""); 
                    items = JSON.parse(fixedContent);
                }
            } catch (e2) {
                console.error('JSON Rescue Failed:', e2);
                alert('生成数据格式有误，请重试');
                return;
            }
        }

        if (items.length > 0) {
            items.forEach((p, index) => {
                p.id = 'del_' + Date.now() + '_' + index;
                p.isDelivery = true;
            });

            if (!window.iphoneSimState.deliveryItems) window.iphoneSimState.deliveryItems = [];
            window.iphoneSimState.deliveryItems.unshift(...items);
            saveConfig();
            
            renderDeliveryItems();

            (async () => {
                for (const p of items) {
                    if (p.image_desc) {
                        const url = await generateAiImage(p.image_desc);
                        if (url) {
                            p.aiImage = url;
                            saveConfig();
                            renderDeliveryItems();
                        }
                    }
                }
            })();
        } else {
            alert('未生成有效商品数据');
        }
    } catch (error) {
        console.error('Gen Error', error);
        alert('生成失败: ' + error.message);
    } finally {
        const loading = document.getElementById('delivery-loading');
        if (loading) loading.remove();
    }
}

function renderDeliveryItems() {
    const container = document.getElementById('shopping-tab-delivery');
    ensureDeliveryContainer();
    const listContainer = container.querySelector('.shopping-restaurant-list');
    
    if (!window.iphoneSimState.deliveryItems || window.iphoneSimState.deliveryItems.length === 0) {
        return;
    }

    listContainer.innerHTML = '';
    
    window.iphoneSimState.deliveryItems.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'shopping-restaurant-card shopping-animate-enter';
        card.style.animationDelay = `${index * 0.05}s`;
        
        if (isShoppingManageMode) {
            card.onclick = () => toggleProductSelection(item.id, card);
        } else {
            card.onclick = () => openShoppingDeliveryDetail(item);
        }

        const isSelected = selectedShoppingProducts.has(item.id);
        if (isSelected && isShoppingManageMode) {
            card.classList.add('selected');
        }

        const shapes = ['rect', 'circle', 'tri'];
        const shape = shapes[index % 3];
        
        // Use pale color and no text for cover
        let validBgColor = window.getRandomPaleColor ? window.getRandomPaleColor() : window.getRandomPastelColor();
        
        // If no AI image, generate a plain colored background without text
        const imgUrl = item.aiImage || generatePlaceholderImage(300, 200, '', validBgColor);

        card.innerHTML = `
            <div class="shopping-rest-img">
                 <div class="shopping-shape ${shape}" style="width:100%; height:100%; opacity: 0.5;"></div>
                 <img src="${imgUrl}" style="position: absolute; width: 100%; height: 100%; object-fit: cover; z-index: 1; opacity: 1;">
                 <div style="position:absolute; font-family:'Playfair Display'; font-size:24px; color:#fff; font-style:italic; z-index: 2; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${item.shop_name}</div>
                 <div class="shopping-selection-check"><i class="fas fa-check"></i></div>
            </div>
            <div class="shopping-rest-info">
                <div class="shopping-rest-header">
                    <div class="shopping-rest-name">${item.title}</div>
                    <div class="shopping-rest-rating">★ ${item.rating || '4.8'}</div>
                </div>
                <div class="shopping-rest-meta">
                    <div class="shopping-meta-item">
                        <svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        ${item.delivery_time || '30分钟'}
                    </div>
                    <div class="shopping-meta-item">
                        <svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
                        ${item.delivery_fee || '免配送'}
                    </div>
                </div>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

function openShoppingDeliveryDetail(item) {
    const detailView = document.getElementById('food-detail');
    if (!detailView) return;

    const titleEl = document.getElementById('food-detail-title');
    if (titleEl) titleEl.textContent = item.shop_name;

    const listEl = document.getElementById('food-detail-menu-list');
    if (listEl) {
        listEl.innerHTML = '';
        const menuItems = [
            { name: item.title, price: item.price, desc: item.detail_desc || '招牌美味' },
            { name: '超值套餐', price: (item.price * 1.2).toFixed(1), desc: item.title + ' + 饮料' },
            { name: '单人餐', price: (item.price * 0.8).toFixed(1), desc: '分量适中' }
        ];

        menuItems.forEach(m => {
            const div = document.createElement('div');
            div.className = 'shopping-menu-item';
            div.innerHTML = `
                <div style="flex: 1; padding-right: 10px;">
                    <div style="font-weight:600;">${m.name}</div>
                    <div style="font-size:13px; color:#8e8e93; margin-top: 2px;">${m.desc}</div>
                    <div style="font-weight:600; margin-top:4px;">¥${m.price}</div>
                </div>
                <button class="shopping-menu-add">+</button>
            `;
            
            const addBtn = div.querySelector('.shopping-menu-add');
            addBtn.onclick = (e) => {
                e.stopPropagation();
                // Add to cart/order logic simulation
                const toast = document.getElementById('shopping-success-toast');
                if (toast) {
                    toast.querySelector('span').textContent = `已添加 ${m.name}`;
                    toast.classList.remove('hidden');
                    setTimeout(() => toast.classList.add('hidden'), 1500);
                }
                
                // Add to global cart
                addToCart({
                    id: 'food_' + Date.now(),
                    title: m.name,
                    price: parseFloat(m.price),
                    shop_name: item.shop_name,
                    isDelivery: true,
                    image_desc: 'Food',
                    bgColor: window.getRandomPaleColor()
                });
            };
            
            listEl.appendChild(div);
        });
    }

    const actionBtn = document.getElementById('food-detail-action-btn');
    if (actionBtn) {
        // Clone to remove old listeners
        const newBtn = actionBtn.cloneNode(true);
        actionBtn.parentNode.replaceChild(newBtn, actionBtn);
        newBtn.onclick = () => {
            detailView.classList.remove('active');
            window.switchShoppingTab('cart'); // Go to cart to checkout food
        };
    }

    detailView.classList.add('active');
}

function showOrderNotification(title, message) {
    // Keep
}

if (window.appInitFunctions) {
    window.appInitFunctions.push(setupShoppingListeners);
}
