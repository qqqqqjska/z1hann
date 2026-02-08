// 世界书功能模块

let currentEditingEntryId = null;
let currentEditingCategoryId = null;

function migrateWorldbookData() {
    const state = window.iphoneSimState;
    if (state.worldbook && state.worldbook.length > 0 && (!state.wbCategories || state.wbCategories.length === 0)) {
        const defaultCatId = Date.now();
        state.wbCategories = [{
            id: defaultCatId,
            name: '默认分类',
            desc: '自动迁移的旧条目'
        }];
        state.worldbook.forEach(entry => {
            if (!entry.categoryId) {
                entry.categoryId = defaultCatId;
            }
        });
        saveConfig();
    }
    if (!state.wbCategories) state.wbCategories = [];
}

// 渲染分类列表
function renderWorldbookCategoryList() {
    const list = document.getElementById('worldbook-category-list');
    const emptyState = document.getElementById('worldbook-empty');
    if (!list) return;

    list.innerHTML = '';

    if (!window.iphoneSimState.wbCategories || window.iphoneSimState.wbCategories.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    window.iphoneSimState.wbCategories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-content column">
                <div style="font-weight: bold; font-size: 16px;">${cat.name}</div>
                <div style="font-size: 12px; color: #888;">${cat.desc || '无描述'}</div>
            </div>
            <i class="fas fa-chevron-right" style="color: #ccc;"></i>
        `;
        item.addEventListener('click', () => openWorldbookCategory(cat.id));
        list.appendChild(item);
    });
}

// 打开分类详情
function openWorldbookCategory(categoryId) {
    const cat = window.iphoneSimState.wbCategories.find(c => c.id === categoryId);
    if (!cat) return;

    window.iphoneSimState.currentWbCategoryId = categoryId;
    document.getElementById('wb-category-title').textContent = cat.name;
    document.getElementById('worldbook-detail-screen').classList.remove('hidden');
    
    renderWorldbookEntryList(categoryId);
}

// 渲染条目列表
function renderWorldbookEntryList(categoryId) {
    const list = document.getElementById('worldbook-entry-list');
    const emptyState = document.getElementById('worldbook-entry-empty');
    if (!list) return;

    list.innerHTML = '';

    const entries = window.iphoneSimState.worldbook.filter(e => e.categoryId === categoryId);

    if (entries.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    entries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'wb-entry';
        const title = entry.remark || (entry.keys && entry.keys.length > 0 ? entry.keys.join(', ') : '无标题');
        
        const toggleIcon = entry.enabled ? 'fa-toggle-on' : 'fa-toggle-off';
        const toggleColor = entry.enabled ? '#34C759' : '#8E8E93';

        item.innerHTML = `
            <div class="wb-header">
                <span class="wb-keys" style="font-weight: bold;">${title}</span>
                <i class="fas ${toggleIcon}" style="font-size: 24px; color: ${toggleColor}; cursor: pointer;" onclick="event.stopPropagation(); window.toggleWorldbookEntry(${entry.id})"></i>
            </div>
            ${entry.remark ? `<div style="font-size: 12px; color: #666; margin-bottom: 4px;">关键字: ${entry.keys.join(', ')}</div>` : ''}
            <div class="wb-content">${entry.content}</div>
        `;
        item.addEventListener('click', () => openWorldbookEdit(entry.id));
        list.appendChild(item);
    });
}

window.toggleWorldbookEntry = function(id) {
    const entry = window.iphoneSimState.worldbook.find(e => e.id === id);
    if (entry) {
        entry.enabled = !entry.enabled;
        saveConfig();
        renderWorldbookEntryList(window.iphoneSimState.currentWbCategoryId);
    }
};

// 打开分类编辑
function openCategoryEdit(categoryId = null) {
    currentEditingCategoryId = categoryId;
    const modal = document.getElementById('category-edit-modal');
    const title = document.getElementById('category-modal-title');
    const nameInput = document.getElementById('cat-name');
    const descInput = document.getElementById('cat-desc');
    const deleteBtn = document.getElementById('delete-category-btn');

    if (categoryId) {
        const cat = window.iphoneSimState.wbCategories.find(c => c.id === categoryId);
        if (cat) {
            title.textContent = '编辑分类';
            nameInput.value = cat.name;
            descInput.value = cat.desc || '';
            deleteBtn.style.display = 'block';
        }
    } else {
        title.textContent = '新建分类';
        nameInput.value = '';
        descInput.value = '';
        deleteBtn.style.display = 'none';
    }

    modal.classList.remove('hidden');
}

// 保存分类
function handleSaveCategory() {
    const name = document.getElementById('cat-name').value.trim();
    const desc = document.getElementById('cat-desc').value.trim();

    if (!name) {
        alert('请输入分类名称');
        return;
    }

    if (currentEditingCategoryId) {
        const cat = window.iphoneSimState.wbCategories.find(c => c.id === currentEditingCategoryId);
        if (cat) {
            cat.name = name;
            cat.desc = desc;
            if (window.iphoneSimState.currentWbCategoryId === currentEditingCategoryId) {
                document.getElementById('wb-category-title').textContent = name;
            }
        }
    } else {
        const newCat = {
            id: Date.now(),
            name,
            desc
        };
        if (!window.iphoneSimState.wbCategories) window.iphoneSimState.wbCategories = [];
        window.iphoneSimState.wbCategories.push(newCat);
    }

    saveConfig();
    renderWorldbookCategoryList();
    document.getElementById('category-edit-modal').classList.add('hidden');
}

// 删除分类
function handleDeleteCategory() {
    if (!currentEditingCategoryId) return;

    if (confirm('确定要删除此分类吗？分类下的所有条目也会被删除！')) {
        window.iphoneSimState.worldbook = window.iphoneSimState.worldbook.filter(e => e.categoryId !== currentEditingCategoryId);
        window.iphoneSimState.wbCategories = window.iphoneSimState.wbCategories.filter(c => c.id !== currentEditingCategoryId);
        
        saveConfig();
        renderWorldbookCategoryList();
        
        if (window.iphoneSimState.currentWbCategoryId === currentEditingCategoryId) {
            document.getElementById('worldbook-detail-screen').classList.add('hidden');
            window.iphoneSimState.currentWbCategoryId = null;
        }
        
        document.getElementById('category-edit-modal').classList.add('hidden');
    }
}

// 打开条目编辑
function openWorldbookEdit(entryId = null) {
    if (!window.iphoneSimState.currentWbCategoryId) return;

    currentEditingEntryId = entryId;
    const modal = document.getElementById('worldbook-edit-modal');
    const title = document.getElementById('worldbook-modal-title');
    const remarkInput = document.getElementById('wb-remark');
    const keysInput = document.getElementById('wb-keys');
    const contentInput = document.getElementById('wb-content');
    const deleteBtn = document.getElementById('delete-worldbook-btn');

    if (entryId) {
        const entry = window.iphoneSimState.worldbook.find(e => e.id === entryId);
        if (entry) {
            title.textContent = '编辑条目';
            remarkInput.value = entry.remark || '';
            keysInput.value = entry.keys ? entry.keys.join(', ') : '';
            contentInput.value = entry.content;
            deleteBtn.style.display = 'block';
        }
    } else {
        title.textContent = '新建条目';
        remarkInput.value = '';
        keysInput.value = '';
        contentInput.value = '';
        deleteBtn.style.display = 'none';
    }

    modal.classList.remove('hidden');
}

// 保存条目
function handleSaveWorldbookEntry() {
    if (!window.iphoneSimState.currentWbCategoryId) return;

    const remark = document.getElementById('wb-remark').value.trim();
    const keysInput = document.getElementById('wb-keys');
    const contentInput = document.getElementById('wb-content');

    const keys = keysInput.value.split(/[,，]/).map(k => k.trim()).filter(k => k);
    const content = contentInput.value.trim();
    
    if (!content) {
        alert('请输入内容');
        return;
    }

    if (currentEditingEntryId) {
        const entry = window.iphoneSimState.worldbook.find(e => e.id === currentEditingEntryId);
        if (entry) {
            entry.remark = remark;
            entry.keys = keys;
            entry.content = content;
        }
    } else {
        const newEntry = {
            id: Date.now(),
            categoryId: window.iphoneSimState.currentWbCategoryId,
            remark: remark,
            keys: keys,
            content: content,
            enabled: true
        };
        if (!window.iphoneSimState.worldbook) window.iphoneSimState.worldbook = [];
        window.iphoneSimState.worldbook.push(newEntry);
    }

    saveConfig();
    renderWorldbookEntryList(window.iphoneSimState.currentWbCategoryId);
    document.getElementById('worldbook-edit-modal').classList.add('hidden');
}

// 删除条目
function handleDeleteWorldbookEntry() {
    if (!currentEditingEntryId) return;

    if (confirm('确定要删除此条目吗？')) {
        window.iphoneSimState.worldbook = window.iphoneSimState.worldbook.filter(e => e.id !== currentEditingEntryId);
        saveConfig();
        renderWorldbookEntryList(window.iphoneSimState.currentWbCategoryId);
        document.getElementById('worldbook-edit-modal').classList.add('hidden');
    }
}

// 初始化监听器
function setupWorldbookListeners() {
    const worldbookAppScreen = document.getElementById('worldbook-app');
    const closeWorldbookBtn = document.getElementById('close-worldbook-app');
    
    if (closeWorldbookBtn) closeWorldbookBtn.addEventListener('click', () => worldbookAppScreen.classList.add('hidden'));

    const addWorldbookCategoryBtn = document.getElementById('add-worldbook-category');
    const addWorldbookEntryBtn = document.getElementById('add-worldbook-entry');
    
    const worldbookEditModal = document.getElementById('worldbook-edit-modal');
    const closeWorldbookEditBtn = document.getElementById('close-worldbook-edit');
    const saveWorldbookBtn = document.getElementById('save-worldbook-btn');
    const deleteWorldbookBtn = document.getElementById('delete-worldbook-btn');

    const categoryEditModal = document.getElementById('category-edit-modal');
    const closeCategoryEditBtn = document.getElementById('close-category-edit');
    const saveCategoryBtn = document.getElementById('save-category-btn');
    const deleteCategoryBtn = document.getElementById('delete-category-btn');
    const editCategoryBtn = document.getElementById('edit-category-btn');
    
    const worldbookDetailScreen = document.getElementById('worldbook-detail-screen');
    const backToWorldbookListBtn = document.getElementById('back-to-worldbook-list');

    if (addWorldbookCategoryBtn) addWorldbookCategoryBtn.addEventListener('click', () => openCategoryEdit());
    if (backToWorldbookListBtn) backToWorldbookListBtn.addEventListener('click', () => {
        worldbookDetailScreen.classList.add('hidden');
        window.iphoneSimState.currentWbCategoryId = null;
    });

    if (addWorldbookEntryBtn) addWorldbookEntryBtn.addEventListener('click', () => openWorldbookEdit());
    
    if (closeWorldbookEditBtn) closeWorldbookEditBtn.addEventListener('click', () => worldbookEditModal.classList.add('hidden'));
    if (saveWorldbookBtn) saveWorldbookBtn.addEventListener('click', handleSaveWorldbookEntry);
    if (deleteWorldbookBtn) deleteWorldbookBtn.addEventListener('click', handleDeleteWorldbookEntry);

    if (closeCategoryEditBtn) closeCategoryEditBtn.addEventListener('click', () => categoryEditModal.classList.add('hidden'));
    if (saveCategoryBtn) saveCategoryBtn.addEventListener('click', handleSaveCategory);
    if (deleteCategoryBtn) deleteCategoryBtn.addEventListener('click', handleDeleteCategory);
    if (editCategoryBtn) editCategoryBtn.addEventListener('click', () => openCategoryEdit(window.iphoneSimState.currentWbCategoryId));
}

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupWorldbookListeners);
}
