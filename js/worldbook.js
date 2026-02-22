// 世界书功能模块 (New Archive UI)

let wbNavHistory = [];
let wbCurrentCategory = null;
let wbCurrentEntry = null;

// DOM Elements cache
let wbElements = {};

function initWbElements() {
    wbElements = {
        app: document.getElementById('worldbook-app'),
        titleGroup: document.getElementById('wb-title-group'),
        pageTitle: document.getElementById('wb-page-title'),
        pageSubtitle: document.getElementById('wb-page-subtitle'),
        actionBtn: document.getElementById('wb-action-btn'),
        iconPlus: document.getElementById('wb-icon-plus'),
        iconEdit: document.getElementById('wb-icon-edit'),
        
        pageCategories: document.getElementById('wb-page-categories'),
        categoryGrid: document.getElementById('wb-category-grid'),
        
        pageEntries: document.getElementById('wb-page-entries'),
        entriesList: document.getElementById('wb-entries-list'),
        
        pageDetail: document.getElementById('wb-page-detail'),
        detailTitle: document.getElementById('wb-detail-title'),
        detailTags: document.getElementById('wb-detail-tags'),
        detailId: document.getElementById('wb-detail-id'),
        detailDate: document.getElementById('wb-detail-date'),
        detailContent: document.getElementById('wb-detail-content'),
        
        modalOverlay: document.getElementById('wb-modal-overlay'),
        modalTitle: document.getElementById('wb-modal-title'),
        modalContent: document.getElementById('wb-modal-content'),
        modalCancel: document.getElementById('wb-modal-cancel'),
        modalSave: document.getElementById('wb-modal-save'),
        modalDelete: document.getElementById('wb-modal-delete')
    };
}

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

// ---------------------------------------------------------
// Rendering
// ---------------------------------------------------------

function renderWbCategories() {
    if (!wbElements.categoryGrid) return;
    wbElements.categoryGrid.innerHTML = '';
    
    if (!window.iphoneSimState.wbCategories || window.iphoneSimState.wbCategories.length === 0) {
        wbElements.categoryGrid.innerHTML = '<div style="grid-column: span 2; text-align: center; color: var(--wb-text-secondary); padding: 40px;">暂无分类</div>';
        return;
    }

    window.iphoneSimState.wbCategories.forEach(cat => {
        // Count entries
        const count = window.iphoneSimState.worldbook 
            ? window.iphoneSimState.worldbook.filter(e => e.categoryId === cat.id).length 
            : 0;

        const el = document.createElement('div');
        el.className = 'wb-folder-card';
        el.innerHTML = `
            <div class="wb-folder-tab"></div>
            <div class="wb-card-inner">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <div class="wb-folder-meta">REF-${cat.id.toString().slice(-4)}</div>
                        <div class="wb-folder-icon">📂</div>
                    </div>
                    <div class="wb-folder-edit-btn" style="padding: 4px; opacity: 0.5;">
                        <svg viewBox="0 0 24 24" style="width: 16px; height: 16px; fill: var(--wb-text-secondary);">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                        </svg>
                    </div>
                </div>
                <div>
                    <div class="wb-folder-name">${cat.name}</div>
                    <div class="wb-folder-meta">${count} FILES</div>
                </div>
            </div>
        `;
        
        // Handle click on the card to open category
        el.addEventListener('click', (e) => {
            // Prevent if clicked on edit button
            if (e.target.closest('.wb-folder-edit-btn')) return;
            openWbCategory(cat);
        });

        // Handle edit button click
        const editBtn = el.querySelector('.wb-folder-edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                wbCurrentCategory = cat; // Set context for edit
                openWbModal('edit_category');
            });
        }
        
        wbElements.categoryGrid.appendChild(el);
    });
}

function renderWbEntries(categoryId) {
    if (!wbElements.entriesList) return;
    wbElements.entriesList.innerHTML = '';
    
    const entries = window.iphoneSimState.worldbook 
        ? window.iphoneSimState.worldbook.filter(e => e.categoryId === categoryId)
        : [];

    if (entries.length === 0) {
        wbElements.entriesList.innerHTML = '<div style="text-align: center; color: var(--wb-text-secondary); padding: 40px;">暂无文档</div>';
        return;
    }

    entries.forEach(entry => {
        const el = document.createElement('div');
        el.className = 'wb-file-item';
        const title = entry.remark || (entry.keys && entry.keys.length > 0 ? entry.keys.join(', ') : '无标题');
        
        el.innerHTML = `
            <div class="wb-file-icon">DOC</div>
            <div class="wb-file-info">
                <div class="wb-file-title">${title}</div>
                <div class="wb-file-desc">${entry.content}</div>
            </div>
            <div style="font-family: var(--wb-font-mono); font-size: 10px; color: var(--wb-text-secondary);">#${entry.id.toString().slice(-4)}</div>
        `;
        el.addEventListener('click', () => openWbEntryDetail(entry));
        wbElements.entriesList.appendChild(el);
    });
}

// ---------------------------------------------------------
// Navigation & Logic
// ---------------------------------------------------------

function openWbCategory(cat) {
    wbNavHistory.push('categories');
    wbCurrentCategory = cat;
    renderWbEntries(cat.id);
    
    // Update Header
    wbElements.pageTitle.textContent = cat.name;
    updateWbHeaderState();
    updateWbActionBtn('plus'); // Create Entry

    // Transition
    wbTransition(wbElements.pageCategories, wbElements.pageEntries);
}

function openWbEntryDetail(entry) {
    wbNavHistory.push('entries');
    wbCurrentEntry = entry;
    
    // Populate Detail
    const title = entry.remark || (entry.keys && entry.keys.length > 0 ? entry.keys.join(', ') : '无标题');
    wbElements.detailTitle.textContent = title;
    wbElements.detailContent.textContent = entry.content;
    wbElements.detailId.textContent = `ID: ${entry.id}`;
    wbElements.detailDate.textContent = `DATE: ${new Date(entry.id).toISOString().split('T')[0]}`;
    
    wbElements.detailTags.innerHTML = '';
    if (entry.keys && entry.keys.length > 0) {
        entry.keys.forEach(key => {
            const tag = document.createElement('span');
            tag.className = 'wb-tag';
            tag.textContent = key.toUpperCase();
            wbElements.detailTags.appendChild(tag);
        });
    }

    // Update Header
    wbElements.pageTitle.textContent = "DOCUMENT";
    updateWbHeaderState();
    updateWbActionBtn('edit'); // Edit Entry
    
    // Transition
    wbTransition(wbElements.pageEntries, wbElements.pageDetail);
}

function wbGoBack() {
    const previous = wbNavHistory.pop();
    
    if (previous === 'entries') {
         // Back to Entries list
         wbElements.pageTitle.textContent = wbCurrentCategory ? wbCurrentCategory.name : "FILES";
         updateWbActionBtn('plus');
         updateWbHeaderState();
         wbCurrentEntry = null;
         wbTransition(wbElements.pageDetail, wbElements.pageEntries, true);
    } else if (previous === 'categories') {
        // Back to Categories (Home)
        wbElements.pageTitle.textContent = "ARCHIVES";
        wbCurrentCategory = null;
        updateWbActionBtn('plus');
        updateWbHeaderState();
        renderWbCategories(); // Refresh grid in case of changes
        wbTransition(wbElements.pageEntries, wbElements.pageCategories, true);
    }
}

function wbTransition(fromEl, toEl, isBack = false) {
    fromEl.classList.add('exit');
    fromEl.classList.remove('active');
    
    setTimeout(() => {
        fromEl.classList.remove('exit');
        toEl.classList.add('active');
    }, 300);
}

function updateWbHeaderState() {
    if (wbNavHistory.length === 0) {
        wbElements.pageSubtitle.textContent = "SYSTEM DATABASE";
        wbElements.titleGroup.classList.remove('clickable');
    } else if (wbNavHistory.length === 1) { // Inside Category
        wbElements.pageSubtitle.textContent = "← ARCHIVES";
        wbElements.titleGroup.classList.add('clickable');
    } else if (wbNavHistory.length === 2) { // Inside Detail
        wbElements.pageSubtitle.textContent = `← ${wbCurrentCategory ? wbCurrentCategory.name.toUpperCase() : 'FILES'}`;
        wbElements.titleGroup.classList.add('clickable');
    }
}

function updateWbActionBtn(type) {
    if (type === 'plus') {
        wbElements.iconPlus.style.display = 'block';
        wbElements.iconEdit.style.display = 'none';
    } else {
        wbElements.iconPlus.style.display = 'none';
        wbElements.iconEdit.style.display = 'block';
    }
}

// ---------------------------------------------------------
// Modal & CRUD
// ---------------------------------------------------------

function handleWbAction() {
    // Context determined by history
    if (wbNavHistory.length === 0) {
        // Root: Create Category
        openWbModal('create_category');
    } else if (wbNavHistory[wbNavHistory.length - 1] === 'categories') {
        // Inside Category: Create Entry
        openWbModal('create_entry');
    } else if (wbNavHistory[wbNavHistory.length - 1] === 'entries') {
        // Inside Entry: Edit Entry
        openWbModal('edit_entry');
    }
}

function openWbModal(type) {
    wbElements.modalOverlay.classList.add('active');
    wbElements.modalDelete.style.display = 'none'; // Default hide delete
    
    // Clear previous event listeners on Save/Delete
    const newSaveBtn = wbElements.modalSave.cloneNode(true);
    wbElements.modalSave.parentNode.replaceChild(newSaveBtn, wbElements.modalSave);
    wbElements.modalSave = newSaveBtn;

    const newDeleteBtn = wbElements.modalDelete.cloneNode(true);
    wbElements.modalDelete.parentNode.replaceChild(newDeleteBtn, wbElements.modalDelete);
    wbElements.modalDelete = newDeleteBtn;

    if (type === 'create_category') {
        wbElements.modalTitle.textContent = "NEW FOLDER";
        wbElements.modalContent.innerHTML = `
            <div class="wb-form-group">
                <label class="wb-form-label">Folder Name</label>
                <input type="text" id="wb-input-cat-name" class="wb-form-input" placeholder="Category Name">
            </div>
            <div class="wb-form-group">
                <label class="wb-form-label">Description</label>
                <input type="text" id="wb-input-cat-desc" class="wb-form-input" placeholder="Optional description">
            </div>
        `;
        wbElements.modalSave.textContent = "CREATE";
        wbElements.modalSave.addEventListener('click', () => {
            const name = document.getElementById('wb-input-cat-name').value.trim();
            const desc = document.getElementById('wb-input-cat-desc').value.trim();
            if (name) {
                const newCat = { id: Date.now(), name, desc };
                window.iphoneSimState.wbCategories.push(newCat);
                saveConfig();
                renderWbCategories();
                closeWbModal();
            }
        });

    } else if (type === 'edit_category') {
        if (!wbCurrentCategory) return;
        wbElements.modalTitle.textContent = "EDIT FOLDER";
        wbElements.modalDelete.style.display = 'block';
        
        wbElements.modalContent.innerHTML = `
            <div class="wb-form-group">
                <label class="wb-form-label">Folder Name</label>
                <input type="text" id="wb-input-cat-name" class="wb-form-input" value="${wbCurrentCategory.name}">
            </div>
            <div class="wb-form-group">
                <label class="wb-form-label">Description</label>
                <input type="text" id="wb-input-cat-desc" class="wb-form-input" value="${wbCurrentCategory.desc || ''}">
            </div>
        `;
        
        wbElements.modalSave.textContent = "SAVE";
        wbElements.modalSave.addEventListener('click', () => {
            const name = document.getElementById('wb-input-cat-name').value.trim();
            const desc = document.getElementById('wb-input-cat-desc').value.trim();
            if (name) {
                wbCurrentCategory.name = name;
                wbCurrentCategory.desc = desc;
                saveConfig();
                renderWbCategories();
                closeWbModal();
                wbCurrentCategory = null; // Clear selection after edit
            }
        });

        wbElements.modalDelete.addEventListener('click', () => {
            if (confirm("Delete this folder and ALL its files? This cannot be undone.")) {
                // Delete entries in this category
                if (window.iphoneSimState.worldbook) {
                    window.iphoneSimState.worldbook = window.iphoneSimState.worldbook.filter(e => e.categoryId !== wbCurrentCategory.id);
                }
                // Delete category
                window.iphoneSimState.wbCategories = window.iphoneSimState.wbCategories.filter(c => c.id !== wbCurrentCategory.id);
                
                saveConfig();
                renderWbCategories();
                closeWbModal();
                wbCurrentCategory = null;
            }
        });

    } else if (type === 'create_entry') {
        wbElements.modalTitle.textContent = "NEW FILE";
        wbElements.modalContent.innerHTML = `
            <div class="wb-form-group">
                <label class="wb-form-label">Title / Remark</label>
                <input type="text" id="wb-input-entry-title" class="wb-form-input" placeholder="Entry Title">
            </div>
            <div class="wb-form-group">
                <label class="wb-form-label">Keywords</label>
                <input type="text" id="wb-input-entry-keys" class="wb-form-input" placeholder="Comma separated">
            </div>
            <div class="wb-form-group">
                <label class="wb-form-label">Content</label>
                <textarea id="wb-input-entry-content" class="wb-form-textarea" placeholder="Entry content..."></textarea>
            </div>
        `;
        wbElements.modalSave.textContent = "CREATE";
        wbElements.modalSave.addEventListener('click', () => {
            const title = document.getElementById('wb-input-entry-title').value.trim();
            const keys = document.getElementById('wb-input-entry-keys').value.split(/[,，]/).map(k => k.trim()).filter(k => k);
            const content = document.getElementById('wb-input-entry-content').value.trim();
            
            if (content) {
                const newEntry = {
                    id: Date.now(),
                    categoryId: wbCurrentCategory.id,
                    remark: title,
                    keys: keys,
                    content: content,
                    enabled: true
                };
                if (!window.iphoneSimState.worldbook) window.iphoneSimState.worldbook = [];
                window.iphoneSimState.worldbook.push(newEntry);
                saveConfig();
                renderWbEntries(wbCurrentCategory.id);
                closeWbModal();
            }
        });

    } else if (type === 'edit_entry') {
        if (!wbCurrentEntry) return;
        wbElements.modalTitle.textContent = "EDIT FILE";
        wbElements.modalDelete.style.display = 'block'; // Show delete for edit
        
        wbElements.modalContent.innerHTML = `
            <div class="wb-form-group">
                <label class="wb-form-label">Title / Remark</label>
                <input type="text" id="wb-input-entry-title" class="wb-form-input" value="${wbCurrentEntry.remark || ''}">
            </div>
            <div class="wb-form-group">
                <label class="wb-form-label">Keywords</label>
                <input type="text" id="wb-input-entry-keys" class="wb-form-input" value="${wbCurrentEntry.keys ? wbCurrentEntry.keys.join(', ') : ''}">
            </div>
            <div class="wb-form-group">
                <label class="wb-form-label">Content</label>
                <textarea id="wb-input-entry-content" class="wb-form-textarea">${wbCurrentEntry.content || ''}</textarea>
            </div>
        `;
        
        wbElements.modalSave.textContent = "SAVE";
        wbElements.modalSave.addEventListener('click', () => {
            const title = document.getElementById('wb-input-entry-title').value.trim();
            const keys = document.getElementById('wb-input-entry-keys').value.split(/[,，]/).map(k => k.trim()).filter(k => k);
            const content = document.getElementById('wb-input-entry-content').value.trim();
            
            if (content) {
                wbCurrentEntry.remark = title;
                wbCurrentEntry.keys = keys;
                wbCurrentEntry.content = content;
                saveConfig();
                
                // Update detail view immediately
                wbElements.detailTitle.textContent = title || '无标题';
                wbElements.detailContent.textContent = content;
                wbElements.detailTags.innerHTML = '';
                keys.forEach(key => {
                    const tag = document.createElement('span');
                    tag.className = 'wb-tag';
                    tag.textContent = key.toUpperCase();
                    wbElements.detailTags.appendChild(tag);
                });
                
                closeWbModal();
            }
        });
        
        wbElements.modalDelete.addEventListener('click', () => {
            if (confirm("Delete this entry?")) {
                window.iphoneSimState.worldbook = window.iphoneSimState.worldbook.filter(e => e.id !== wbCurrentEntry.id);
                saveConfig();
                closeWbModal();
                wbGoBack(); // Return to list
            }
        });
    }
}

function closeWbModal() {
    wbElements.modalOverlay.classList.remove('active');
}

// ---------------------------------------------------------
// Init
// ---------------------------------------------------------

function setupWorldbookListeners() {
    initWbElements();
    
    // Re-bind listeners
    if (wbElements.titleGroup) {
        wbElements.titleGroup.addEventListener('click', () => {
            if (wbNavHistory.length > 0) {
                wbGoBack();
            } else {
                // Close app if at root
                wbElements.app.classList.add('hidden');
            }
        });
    }
    
    if (wbElements.actionBtn) {
        wbElements.actionBtn.addEventListener('click', handleWbAction);
    }
    
    if (wbElements.modalCancel) {
        wbElements.modalCancel.addEventListener('click', closeWbModal);
    }
    
    // Initial Render
    renderWbCategories();
    updateWbHeaderState();
    updateWbActionBtn('plus');
}

// 暴露给 core.js 调用
window.renderWorldbookCategoryList = renderWbCategories;
window.migrateWorldbookData = migrateWorldbookData;

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupWorldbookListeners);
}
