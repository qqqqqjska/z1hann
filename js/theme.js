// 美化/主题功能模块

// --- 字体功能 ---

function handleFontUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const fontName = `CustomFont_${Date.now()}`;
        const fontFace = new FontFace(fontName, `url(${event.target.result})`);
        
        fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            addFontToState(fontName, event.target.result, 'local');
        }).catch(err => {
            console.error('字体加载失败:', err);
            alert('字体加载失败，请检查文件格式');
        });
    };
    reader.readAsDataURL(file);
}

function handleFontUrl() {
    const url = document.getElementById('font-url').value.trim();
    if (!url) return;
    addWebFont(url);
    // document.getElementById('font-url').value = '';
}

function addWebFont(url) {
    const fontName = `WebFont_${Date.now()}`;
    const style = document.createElement('style');
    style.textContent = `@font-face { font-family: '${fontName}'; src: url('${url}'); }`;
    document.head.appendChild(style);
    addFontToState(fontName, url, 'url');
}

function resetFont() {
    window.iphoneSimState.currentFont = 'default';
    applyFont('default');
    saveConfig();
    alert('已重置为系统默认字体');
}

function addFontToState(name, source, type) {
    window.iphoneSimState.fonts.push({ name, source, type });
    window.iphoneSimState.currentFont = name;
    applyFont(name);
    saveConfig();
}

function applyFont(fontName) {
    const state = window.iphoneSimState;
    if (fontName === 'default') {
        document.documentElement.style.setProperty('--font-family', '-apple-system, BlinkMacSystemFont, "San Francisco", "Helvetica Neue", Helvetica, Arial, sans-serif');
    } else {
        const font = state.fonts.find(f => f.name === fontName);
        if (font) {
            if (font.type === 'local') {
                const fontFace = new FontFace(font.name, `url(${font.source})`);
                fontFace.load().then(loadedFace => {
                    document.fonts.add(loadedFace);
                    document.documentElement.style.setProperty('--font-family', fontName);
                }).catch(() => {
                    document.documentElement.style.setProperty('--font-family', fontName);
                });
            } else {
                if (!document.getElementById(`style-${font.name}`)) {
                    const style = document.createElement('style');
                    style.id = `style-${font.name}`;
                    style.textContent = `@font-face { font-family: '${font.name}'; src: url('${font.source}'); }`;
                    document.head.appendChild(style);
                }
                document.documentElement.style.setProperty('--font-family', fontName);
            }
        }
    }
}

function handleDeleteFont() {
    const state = window.iphoneSimState;
    if (state.currentFont === 'default') return;
    state.fonts = state.fonts.filter(f => f.name !== state.currentFont);
    state.currentFont = 'default';
    applyFont('default');
    saveConfig();
}

// --- 字体预设功能 ---

function handleSaveFontPreset() {
    const name = prompt('请输入字体预设名称：');
    if (!name) return;
    
    const preset = {
        name: name,
        font: window.iphoneSimState.currentFont
    };
    
    window.iphoneSimState.fontPresets.push(preset);
    saveConfig();
    renderFontPresets();
    document.getElementById('font-preset-select').value = name;
    alert('字体预设已保存');
}

function handleDeleteFontPreset() {
    const select = document.getElementById('font-preset-select');
    const name = select.value;
    if (!name) return;
    
    if (confirm(`确定要删除预设 "${name}" 吗？`)) {
        window.iphoneSimState.fontPresets = window.iphoneSimState.fontPresets.filter(p => p.name !== name);
        saveConfig();
        renderFontPresets();
    }
}

function handleApplyFontPreset(e) {
    const name = e.target.value;
    if (!name) return;
    
    const preset = window.iphoneSimState.fontPresets.find(p => p.name === name);
    if (preset) {
        window.iphoneSimState.currentFont = preset.font;
        applyFont(window.iphoneSimState.currentFont);
        saveConfig();
    }
}

function renderFontPresets() {
    const selects = [
        document.getElementById('font-preset-select'),
        document.getElementById('meeting-font-preset-select')
    ];
    
    selects.forEach(select => {
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- 选择预设 --</option>';
        
        if (window.iphoneSimState.fontPresets) {
            window.iphoneSimState.fontPresets.forEach(preset => {
                const option = document.createElement('option');
                option.value = preset.name;
                option.textContent = preset.name;
                select.appendChild(option);
            });
        }
        
        if (currentValue && window.iphoneSimState.fontPresets.some(p => p.name === currentValue)) {
            select.value = currentValue;
        }
    });
}

// --- 壁纸功能 ---

function handleWallpaperUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 1024, 0.7).then(base64 => {
        const wallpaper = {
            id: Date.now(),
            data: base64
        };
        window.iphoneSimState.wallpapers.push(wallpaper);
        window.iphoneSimState.currentWallpaper = wallpaper.id;
        applyWallpaper(wallpaper.id);
        renderWallpaperGallery();
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
}

function renderWallpaperGallery() {
    const gallery = document.getElementById('wallpaper-gallery');
    if (!gallery) return;
    
    gallery.innerHTML = '';
    
    window.iphoneSimState.wallpapers.forEach(wp => {
        const item = document.createElement('div');
        item.className = `gallery-item ${window.iphoneSimState.currentWallpaper === wp.id ? 'selected' : ''}`;
        item.innerHTML = `
            <img src="${wp.data}" alt="Wallpaper">
            <button class="delete-wp-btn" data-id="${wp.id}">&times;</button>
        `;
        
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-wp-btn')) {
                deleteWallpaper(wp.id);
            } else {
                window.iphoneSimState.currentWallpaper = wp.id;
                applyWallpaper(wp.id);
                renderWallpaperGallery();
                saveConfig();
            }
        });
        
        gallery.appendChild(item);
    });
}

function deleteWallpaper(id) {
    window.iphoneSimState.wallpapers = window.iphoneSimState.wallpapers.filter(wp => wp.id !== id);
    if (window.iphoneSimState.currentWallpaper === id) {
        window.iphoneSimState.currentWallpaper = null;
        applyWallpaper(null);
    }
    renderWallpaperGallery();
    saveConfig();
}

function handleChatWallpaperUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        const wallpaper = {
            id: Date.now(),
            data: base64
        };
        if (!window.iphoneSimState.chatWallpapers) window.iphoneSimState.chatWallpapers = [];
        window.iphoneSimState.chatWallpapers.push(wallpaper);
        window.iphoneSimState.tempSelectedChatBg = wallpaper.data;
        renderChatWallpaperGallery();
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function renderChatWallpaperGallery() {
    const gallery = document.getElementById('chat-bg-gallery');
    if (!gallery) return;
    
    gallery.innerHTML = '';
    
    if (!window.iphoneSimState.chatWallpapers) window.iphoneSimState.chatWallpapers = [];
    
    window.iphoneSimState.chatWallpapers.forEach(wp => {
        const item = document.createElement('div');
        const isSelected = window.iphoneSimState.tempSelectedChatBg === wp.data;
        item.className = `gallery-item ${isSelected ? 'selected' : ''}`;
        item.innerHTML = `
            <img src="${wp.data}" alt="Wallpaper">
            <button class="delete-wp-btn" data-id="${wp.id}">&times;</button>
        `;
        
        item.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-wp-btn')) {
                deleteChatWallpaper(wp.id);
            } else {
                window.iphoneSimState.tempSelectedChatBg = wp.data;
                renderChatWallpaperGallery();
            }
        });
        
        gallery.appendChild(item);
    });
}

function deleteChatWallpaper(id) {
    const wp = window.iphoneSimState.chatWallpapers.find(w => w.id === id);
    if (wp && window.iphoneSimState.tempSelectedChatBg === wp.data) {
        window.iphoneSimState.tempSelectedChatBg = '';
    }
    window.iphoneSimState.chatWallpapers = window.iphoneSimState.chatWallpapers.filter(w => w.id !== id);
    renderChatWallpaperGallery();
    saveConfig();
}

function applyWallpaper(id) {
    if (!id) {
        document.documentElement.style.setProperty('--wallpaper', 'none');
        return;
    }
    const wp = window.iphoneSimState.wallpapers.find(w => w.id === id);
    if (wp) {
        document.documentElement.style.setProperty('--wallpaper', `url(${wp.data})`);
    }
}

function toggleStatusBar(show) {
    const statusBar = document.querySelector('.status-bar');
    if (statusBar) {
        if (show) {
            statusBar.classList.remove('hidden');
        } else {
            statusBar.classList.add('hidden');
        }
    }
}

// --- 图标功能 ---

function renderIconSettings() {
    const list = document.getElementById('icon-setting-list');
    if (!list) return;
    
    list.innerHTML = '';

    const appsToShow = new Set(Object.keys(knownApps));
    
    if (typeof homeScreenData !== 'undefined') {
        homeScreenData.forEach(item => {
            if (item.type === 'app' && item.appId) {
                appsToShow.add(item.appId);
            }
        });
    }

    appsToShow.forEach(appId => {
        const appInfo = knownApps[appId] || { name: '未知应用', icon: 'fas fa-question', color: '#ccc' };
        
        const item = document.createElement('div');
        item.className = 'list-item';
        
        const currentIcon = window.iphoneSimState.icons[appId];
        const currentColor = window.iphoneSimState.iconColors[appId] || appInfo.color;
        const currentName = window.iphoneSimState.appNames[appId] || appInfo.name;
        let previewContent = '';
        
        if (currentIcon) {
            previewContent = `<img src="${currentIcon}" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            previewContent = `<i class="${appInfo.icon}" style="color: ${currentColor === '#ffffff' ? '#000' : '#fff'}"></i>`;
        }

        item.innerHTML = `
            <div class="icon-row">
                <div class="icon-preview-small" id="preview-${appId}" style="background-color: ${currentColor};">
                    ${previewContent}
                </div>
                <div class="icon-info column">
                    <input type="text" class="app-name-input" value="${currentName}" data-id="${appId}" placeholder="${appInfo.name}" style="border: none; background: transparent; font-size: 16px; width: 100%; margin-bottom: 5px; font-weight: 500;">
                    <div class="color-picker-row" style="margin-top: 5px; display: flex; align-items: center; gap: 5px;">
                        <span style="font-size: 12px; color: #888;">背景色:</span>
                        <input type="color" class="color-picker-input" value="${currentColor}" data-id="${appId}" style="width: 30px; height: 20px; padding: 0; border: none;">
                    </div>
                </div>
                <div class="icon-actions">
                    <input type="file" id="upload-${appId}" accept="image/*" class="file-input-hidden">
                    <label for="upload-${appId}" class="ios-btn">更换</label>
                    ${currentIcon || window.iphoneSimState.iconColors[appId] || window.iphoneSimState.appNames[appId] ? `<button class="ios-btn-small danger" onclick="resetAppIcon('${appId}')">还原</button>` : ''}
                </div>
            </div>
        `;

        const input = item.querySelector('input[type="file"]');
        input.addEventListener('change', (e) => handleIconUpload(e, appId));
        
        const colorInput = item.querySelector('input[type="color"]');
        colorInput.addEventListener('input', (e) => handleIconColorChange(e, appId));

        const nameInput = item.querySelector('.app-name-input');
        nameInput.addEventListener('change', (e) => handleAppNameChange(e, appId));
        
        list.appendChild(item);
    });
}

function handleAppNameChange(e, appId) {
    const name = e.target.value.trim();
    if (name) {
        window.iphoneSimState.appNames[appId] = name;
    } else {
        delete window.iphoneSimState.appNames[appId];
    }
    applyIcons();
    saveConfig();
    renderIconSettings();
}

function handleIconUpload(e, appId) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 300, 0.7).then(base64 => {
        window.iphoneSimState.icons[appId] = base64;
        applyIcons();
        renderIconSettings();
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
}

function handleIconColorChange(e, appId) {
    const color = e.target.value;
    window.iphoneSimState.iconColors[appId] = color;
    
    const preview = document.getElementById(`preview-${appId}`);
    if (preview) {
        preview.style.backgroundColor = color;
        const icon = preview.querySelector('i');
        if (icon) {
            icon.style.color = color === '#ffffff' ? '#000' : '#fff';
        }
    }
    
    applyIcons();
    saveConfig();
}

window.resetAppIcon = function(appId) {
    delete window.iphoneSimState.icons[appId];
    delete window.iphoneSimState.iconColors[appId];
    delete window.iphoneSimState.appNames[appId];
    applyIcons();
    renderIconSettings();
    saveConfig();
};

function applyIcons() {
    // 清除应用类型项目的缓存元素，强制重新创建以反映新图标
    if (typeof itemElementMap !== 'undefined' && typeof homeScreenData !== 'undefined') {
        homeScreenData.forEach(item => {
            if (item.type === 'app' && item._internalId) {
                const el = itemElementMap.get(item._internalId);
                if (el && el.parentNode) {
                    el.parentNode.removeChild(el);
                }
                itemElementMap.delete(item._internalId);
            }
        });
    }
    
    if (typeof renderItems === 'function') {
        renderItems();
    }

    const dockItems = document.querySelectorAll('.dock-item');
    dockItems.forEach(item => {
        const appId = item.dataset.appId;
        if (!appId) return;

        const iconContainer = item.querySelector('.app-icon');
        if (!iconContainer) return;

        const appInfo = knownApps[appId] || { icon: 'fas fa-question', color: '#ccc' };
        const customIcon = window.iphoneSimState.icons[appId];
        const customColor = window.iphoneSimState.iconColors[appId];
        const finalColor = customColor || appInfo.color;

        iconContainer.style.backgroundColor = finalColor;

        if (customIcon) {
            iconContainer.innerHTML = `<img src="${customIcon}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--icon-radius);">`;
        } else {
            iconContainer.innerHTML = `<i class="${appInfo.icon}" style="color: ${finalColor === '#ffffff' ? '#000' : '#fff'}"></i>`;
        }
    });
}

// --- 图标预设功能 ---

function handleSaveIconPreset() {
    const name = prompt('请输入图标预设名称：');
    if (!name) return;
    
    const preset = {
        name: name,
        icons: { ...window.iphoneSimState.icons },
        iconColors: { ...window.iphoneSimState.iconColors },
        appNames: { ...window.iphoneSimState.appNames }
    };
    
    window.iphoneSimState.iconPresets.push(preset);
    saveConfig();
    renderIconPresets();
    document.getElementById('icon-preset-select').value = name;
    alert('图标预设已保存');
}

function handleDeleteIconPreset() {
    const select = document.getElementById('icon-preset-select');
    const name = select.value;
    if (!name) return;
    
    if (confirm(`确定要删除预设 "${name}" 吗？`)) {
        window.iphoneSimState.iconPresets = window.iphoneSimState.iconPresets.filter(p => p.name !== name);
        saveConfig();
        renderIconPresets();
    }
}

function handleApplyIconPreset(e) {
    const name = e.target.value;
    if (!name) return;
    
    const preset = window.iphoneSimState.iconPresets.find(p => p.name === name);
    if (preset) {
        window.iphoneSimState.icons = { ...preset.icons };
        window.iphoneSimState.iconColors = { ...preset.iconColors };
        window.iphoneSimState.appNames = { ...preset.appNames || {} };
        applyIcons();
        renderIconSettings();
        saveConfig();
    }
}

function renderIconPresets() {
    const select = document.getElementById('icon-preset-select');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- 选择预设 --</option>';
    
    if (window.iphoneSimState.iconPresets) {
        window.iphoneSimState.iconPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            select.appendChild(option);
        });
    }
    
    if (currentValue && window.iphoneSimState.iconPresets.some(p => p.name === currentValue)) {
        select.value = currentValue;
    }
}

// --- CSS功能 ---

function applyCSS(cssContent) {
    let styleEl = document.getElementById('custom-user-css');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'custom-user-css';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = cssContent;
}

function exportCSS() {
    const blob = new Blob([window.iphoneSimState.css], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'custom-theme.css';
    a.click();
    URL.revokeObjectURL(url);
}

// --- CSS预设功能 ---

function handleSaveCssPreset() {
    const name = prompt('请输入CSS预设名称：');
    if (!name) return;
    
    const cssContent = document.getElementById('css-editor').value;
    
    const preset = {
        name: name,
        css: cssContent
    };
    
    window.iphoneSimState.cssPresets.push(preset);
    saveConfig();
    renderCssPresets();
    document.getElementById('css-preset-select').value = name;
    alert('CSS预设已保存');
}

function handleDeleteCssPreset() {
    const select = document.getElementById('css-preset-select');
    const name = select.value;
    if (!name) return;
    
    if (confirm(`确定要删除预设 "${name}" 吗？`)) {
        window.iphoneSimState.cssPresets = window.iphoneSimState.cssPresets.filter(p => p.name !== name);
        saveConfig();
        renderCssPresets();
    }
}

function handleApplyCssPreset(e) {
    const name = e.target.value;
    if (!name) return;
    
    const preset = window.iphoneSimState.cssPresets.find(p => p.name === name);
    if (preset) {
        window.iphoneSimState.css = preset.css;
        document.getElementById('css-editor').value = window.iphoneSimState.css;
        applyCSS(window.iphoneSimState.css);
        saveConfig();
    }
}

function renderCssPresets() {
    const select = document.getElementById('css-preset-select');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- 选择预设 --</option>';
    
    if (window.iphoneSimState.cssPresets) {
        window.iphoneSimState.cssPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            select.appendChild(option);
        });
    }
    
    if (currentValue && window.iphoneSimState.cssPresets.some(p => p.name === currentValue)) {
        select.value = currentValue;
    }
}

// --- 聊天设置 CSS 预设功能 ---

function handleSaveChatCssPreset() {
    const name = prompt('请输入CSS预设名称：');
    if (!name) return;
    
    const cssContent = document.getElementById('chat-setting-custom-css').value;
    
    const preset = {
        name: name,
        css: cssContent
    };
    
    window.iphoneSimState.cssPresets.push(preset);
    saveConfig();
    renderChatCssPresets();
    renderCssPresets();
    document.getElementById('chat-css-preset-select').value = name;
    alert('CSS预设已保存');
}

function handleDeleteChatCssPreset() {
    const select = document.getElementById('chat-css-preset-select');
    const name = select.value;
    if (!name) return;
    
    if (confirm(`确定要删除预设 "${name}" 吗？`)) {
        window.iphoneSimState.cssPresets = window.iphoneSimState.cssPresets.filter(p => p.name !== name);
        saveConfig();
        renderChatCssPresets();
        renderCssPresets();
    }
}

function handleApplyChatCssPreset(e) {
    const name = e.target.value;
    if (!name) return;
    
    const preset = window.iphoneSimState.cssPresets.find(p => p.name === name);
    if (preset) {
        document.getElementById('chat-setting-custom-css').value = preset.css;
    }
}

function renderChatCssPresets() {
    const select = document.getElementById('chat-css-preset-select');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- 选择预设 --</option>';
    
    if (window.iphoneSimState.cssPresets) {
        window.iphoneSimState.cssPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            select.appendChild(option);
        });
    }
    
    if (currentValue && window.iphoneSimState.cssPresets.some(p => p.name === currentValue)) {
        select.value = currentValue;
    }
}

// --- 见面模式美化功能 ---

function initMeetingTheme() {
    const btn = document.getElementById('meeting-theme-btn');
    const modal = document.getElementById('meeting-theme-modal');
    const closeBtn = document.getElementById('close-meeting-theme');
    
    if (btn) {
        btn.addEventListener('click', () => {
            const editor = document.getElementById('meeting-css-editor');
            if (editor) editor.value = window.iphoneSimState.meetingCss || '';
            modal.classList.remove('hidden');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    const fontUpload = document.getElementById('meeting-font-upload');
    if (fontUpload) {
        const newUpload = fontUpload.cloneNode(true);
        fontUpload.parentNode.replaceChild(newUpload, fontUpload);
        newUpload.addEventListener('change', handleMeetingFontUploadAction);
    }

    const fontPresetSelect = document.getElementById('meeting-font-preset-select');
    if (fontPresetSelect) {
        const newSelect = fontPresetSelect.cloneNode(true);
        fontPresetSelect.parentNode.replaceChild(newSelect, fontPresetSelect);
        newSelect.addEventListener('change', handleApplyMeetingFontPreset);
    }

    const resetFontBtn = document.getElementById('reset-meeting-font-btn');
    if (resetFontBtn) {
        const newReset = resetFontBtn.cloneNode(true);
        resetFontBtn.parentNode.replaceChild(newReset, resetFontBtn);
        newReset.addEventListener('click', resetMeetingFontAction);
    }

    const mainResetFontBtn = document.getElementById('reset-font-btn');
    if (mainResetFontBtn) mainResetFontBtn.addEventListener('click', resetFont);

    const saveCssBtn = document.getElementById('save-meeting-css-preset');
    if (saveCssBtn) saveCssBtn.addEventListener('click', handleSaveMeetingCssPreset);
    
    const deleteCssBtn = document.getElementById('delete-meeting-css-preset');
    if (deleteCssBtn) deleteCssBtn.addEventListener('click', handleDeleteMeetingCssPreset);
    
    const cssSelect = document.getElementById('meeting-css-preset-select');
    if (cssSelect) cssSelect.addEventListener('change', handleApplyMeetingCssPreset);
    
    const applyCssBtn = document.getElementById('apply-meeting-css-btn');
    if (applyCssBtn) applyCssBtn.addEventListener('click', () => {
        const css = document.getElementById('meeting-css-editor').value;
        window.iphoneSimState.meetingCss = css;
        applyMeetingCss(css);
        saveConfig();
        alert('见面模式 CSS 已应用');
    });

    const meetingEditIconUpload = document.getElementById('meeting-edit-icon-upload');
    if (meetingEditIconUpload) {
        const newUpload = meetingEditIconUpload.cloneNode(true);
        meetingEditIconUpload.parentNode.replaceChild(newUpload, meetingEditIconUpload);
        newUpload.addEventListener('change', (e) => handleMeetingIconUpload(e, 'edit'));
    }

    const meetingDeleteIconUpload = document.getElementById('meeting-delete-icon-upload');
    if (meetingDeleteIconUpload) {
        const newUpload = meetingDeleteIconUpload.cloneNode(true);
        meetingDeleteIconUpload.parentNode.replaceChild(newUpload, meetingDeleteIconUpload);
        newUpload.addEventListener('change', (e) => handleMeetingIconUpload(e, 'delete'));
    }

    if (window.iphoneSimState.meetingIcons) {
        const editPreview = document.getElementById('meeting-edit-icon-preview');
        const deletePreview = document.getElementById('meeting-delete-icon-preview');
        if (editPreview && window.iphoneSimState.meetingIcons.edit) editPreview.src = window.iphoneSimState.meetingIcons.edit;
        if (deletePreview && window.iphoneSimState.meetingIcons.delete) deletePreview.src = window.iphoneSimState.meetingIcons.delete;
    }
}

function handleMeetingIconUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 100, 0.7).then(base64 => {
        if (!window.iphoneSimState.meetingIcons) window.iphoneSimState.meetingIcons = {};
        window.iphoneSimState.meetingIcons[type] = base64;
        saveConfig();
        
        const preview = document.getElementById(`meeting-${type}-icon-preview`);
        if (preview) preview.src = base64;
        
        if (window.iphoneSimState.currentMeetingId && window.iphoneSimState.currentChatContactId) {
             const meetings = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId];
             const meeting = meetings.find(m => m.id === window.iphoneSimState.currentMeetingId);
             if (meeting && window.renderMeetingCards) window.renderMeetingCards(meeting);
        }
        alert('图标已更新');
    }).catch(err => {
        console.error('图标处理失败', err);
        alert('图标处理失败');
    });
    e.target.value = '';
}

function applyMeetingCss(cssContent) {
    let styleEl = document.getElementById('meeting-custom-css');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'meeting-custom-css';
        document.head.appendChild(styleEl);
    }
    styleEl.textContent = cssContent || '';
}

function handleSaveMeetingCssPreset() {
    const name = prompt('请输入见面模式 CSS 预设名称：');
    if (!name) return;
    
    const cssContent = document.getElementById('meeting-css-editor').value;
    
    const preset = {
        name: name,
        css: cssContent
    };
    
    if (!window.iphoneSimState.meetingCssPresets) window.iphoneSimState.meetingCssPresets = [];
    window.iphoneSimState.meetingCssPresets.push(preset);
    saveConfig();
    renderMeetingCssPresets();
    document.getElementById('meeting-css-preset-select').value = name;
    alert('预设已保存');
}

function handleDeleteMeetingCssPreset() {
    const select = document.getElementById('meeting-css-preset-select');
    const name = select.value;
    if (!name) return;
    
    if (confirm(`确定要删除预设 "${name}" 吗？`)) {
        window.iphoneSimState.meetingCssPresets = window.iphoneSimState.meetingCssPresets.filter(p => p.name !== name);
        saveConfig();
        renderMeetingCssPresets();
    }
}

function handleApplyMeetingCssPreset(e) {
    const name = e.target.value;
    if (!name) return;
    
    const preset = window.iphoneSimState.meetingCssPresets.find(p => p.name === name);
    if (preset) {
        document.getElementById('meeting-css-editor').value = preset.css;
    }
}

function renderMeetingCssPresets() {
    const select = document.getElementById('meeting-css-preset-select');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">-- 选择预设 --</option>';
    
    if (window.iphoneSimState.meetingCssPresets) {
        window.iphoneSimState.meetingCssPresets.forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            select.appendChild(option);
        });
    }
    
    if (currentValue && window.iphoneSimState.meetingCssPresets.some(p => p.name === currentValue)) {
        select.value = currentValue;
    }
}

function applyMeetingFont(fontName) {
    if (fontName === 'default') {
        document.documentElement.style.setProperty('--meeting-font-family', 'var(--font-family)');
    } else {
        const font = window.iphoneSimState.fonts.find(f => f.name === fontName);
        if (font) {
            if (font.type === 'url' && !document.getElementById(`style-${font.name}`)) {
                const style = document.createElement('style');
                style.id = `style-${font.name}`;
                style.textContent = `@font-face { font-family: '${font.name}'; src: url('${font.source}'); }`;
                document.head.appendChild(style);
            }
            document.documentElement.style.setProperty('--meeting-font-family', fontName);
        }
    }
}

function handleMeetingFontUploadAction(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const fontName = `MeetingFont_${Date.now()}`;
        const fontFace = new FontFace(fontName, `url(${event.target.result})`);
        
        fontFace.load().then((loadedFace) => {
            document.fonts.add(loadedFace);
            addFontToState(fontName, event.target.result, 'local'); 
            
            window.iphoneSimState.currentMeetingFont = fontName;
            applyMeetingFont(fontName);
            saveConfig();
            
            alert('字体已应用到见面详情页');
        }).catch(err => {
            console.error('字体加载失败:', err);
            alert('字体文件无效');
        });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function handleApplyMeetingFontPreset(e) {
    const name = e.target.value;
    if (!name) return;
    
    const preset = window.iphoneSimState.fontPresets.find(p => p.name === name);
    if (preset) {
        window.iphoneSimState.currentMeetingFont = preset.font;
        applyMeetingFont(preset.font);
        saveConfig();
    }
}

function resetMeetingFontAction() {
    window.iphoneSimState.currentMeetingFont = 'default';
    applyMeetingFont('default');
    saveConfig();
    alert('见面字体已重置为跟随系统');
}

// --- 初始化监听器 ---
function setupThemeListeners() {

    const themeFontScreen = document.getElementById('theme-font-screen');
    const themeWallpaperScreen = document.getElementById('theme-wallpaper-screen');
    const themeIconsScreen = document.getElementById('theme-icons-screen');

    const openThemeFontBtn = document.getElementById('open-theme-font');
    const openThemeWallpaperBtn = document.getElementById('open-theme-wallpaper');
    const openThemeIconsBtn = document.getElementById('open-theme-icons');

    const closeThemeFontBtn = document.getElementById('close-theme-font');
    const closeThemeWallpaperBtn = document.getElementById('close-theme-wallpaper');
    const closeThemeIconsBtn = document.getElementById('close-theme-icons');

    if (openThemeFontBtn) openThemeFontBtn.addEventListener('click', () => themeFontScreen.classList.remove('hidden'));
    if (closeThemeFontBtn) closeThemeFontBtn.addEventListener('click', () => themeFontScreen.classList.add('hidden'));

    if (openThemeWallpaperBtn) openThemeWallpaperBtn.addEventListener('click', () => themeWallpaperScreen.classList.remove('hidden'));
    if (closeThemeWallpaperBtn) closeThemeWallpaperBtn.addEventListener('click', () => themeWallpaperScreen.classList.add('hidden'));

    if (openThemeIconsBtn) openThemeIconsBtn.addEventListener('click', () => themeIconsScreen.classList.remove('hidden'));
    if (closeThemeIconsBtn) closeThemeIconsBtn.addEventListener('click', () => themeIconsScreen.classList.add('hidden'));

    const fontUpload = document.getElementById('font-upload');
    if (fontUpload) fontUpload.addEventListener('change', handleFontUpload);
    
    const applyFontUrlBtn = document.getElementById('apply-font-url');
    if (applyFontUrlBtn) applyFontUrlBtn.addEventListener('click', handleFontUrl);
    
    const saveFontPresetBtn = document.getElementById('save-font-preset');
    if (saveFontPresetBtn) saveFontPresetBtn.addEventListener('click', handleSaveFontPreset);
    
    const deleteFontPresetBtn = document.getElementById('delete-font-preset');
    if (deleteFontPresetBtn) deleteFontPresetBtn.addEventListener('click', handleDeleteFontPreset);
    
    const fontPresetSelect = document.getElementById('font-preset-select');
    if (fontPresetSelect) fontPresetSelect.addEventListener('change', handleApplyFontPreset);

    const wallpaperUpload = document.getElementById('wallpaper-upload');
    if (wallpaperUpload) wallpaperUpload.addEventListener('change', handleWallpaperUpload);
    
    const resetWallpaperBtn = document.getElementById('reset-wallpaper');
    if (resetWallpaperBtn) {
        resetWallpaperBtn.addEventListener('click', () => {
            window.iphoneSimState.currentWallpaper = null;
            applyWallpaper(null);
            saveConfig();
            renderWallpaperGallery();
        });
    }

    const resetIconsBtn = document.getElementById('reset-icons');
    if (resetIconsBtn) {
        resetIconsBtn.addEventListener('click', () => {
            if (confirm('确定要重置所有图标和颜色吗？')) {
                window.iphoneSimState.icons = {};
                window.iphoneSimState.iconColors = {};
                window.iphoneSimState.appNames = {};
                applyIcons();
                saveConfig();
                renderIconSettings();
                alert('已重置所有图标');
            }
        });
    }

    const saveIconsBtn = document.getElementById('save-icons-btn');
    if (saveIconsBtn) {
        saveIconsBtn.addEventListener('click', () => {
            saveConfig();
            applyIcons();
            alert('图标配置已保存并应用');
        });
    }

    const saveCssBtn = document.getElementById('save-css');
    if (saveCssBtn) {
        saveCssBtn.addEventListener('click', () => {
            window.iphoneSimState.css = document.getElementById('css-editor').value;
            applyCSS(window.iphoneSimState.css);
            saveConfig();
            alert('CSS配置已保存');
        });
    }
    
    const exportCssBtn = document.getElementById('export-css');
    if (exportCssBtn) exportCssBtn.addEventListener('click', exportCSS);

    const saveCssPresetBtn = document.getElementById('save-css-preset');
    if (saveCssPresetBtn) saveCssPresetBtn.addEventListener('click', handleSaveCssPreset);
    
    const deleteCssPresetBtn = document.getElementById('delete-css-preset');
    if (deleteCssPresetBtn) deleteCssPresetBtn.addEventListener('click', handleDeleteCssPreset);
    
    const cssPresetSelect = document.getElementById('css-preset-select');
    if (cssPresetSelect) cssPresetSelect.addEventListener('change', handleApplyCssPreset);

    const defaultVirtualImageUrlInput = document.getElementById('default-virtual-image-url');
    if (defaultVirtualImageUrlInput) {
        defaultVirtualImageUrlInput.addEventListener('change', (e) => {
            window.iphoneSimState.defaultVirtualImageUrl = e.target.value;
        });
    }

    const defaultMomentVirtualImageUrlInput = document.getElementById('default-moment-virtual-image-url');
    if (defaultMomentVirtualImageUrlInput) {
        defaultMomentVirtualImageUrlInput.addEventListener('change', (e) => {
            window.iphoneSimState.defaultMomentVirtualImageUrl = e.target.value;
        });
    }

    const statusBarToggle = document.getElementById('show-status-bar-toggle');
    if (statusBarToggle) {
        statusBarToggle.addEventListener('change', (e) => {
            window.iphoneSimState.showStatusBar = e.target.checked;
            toggleStatusBar(window.iphoneSimState.showStatusBar);
            saveConfig();
        });
    }

    const chatLoadingLimitInput = document.getElementById('chat-loading-limit');
    if (chatLoadingLimitInput) {
        // Initialize value if state exists
        if (window.iphoneSimState) {
            chatLoadingLimitInput.value = window.iphoneSimState.chatLoadingLimit !== undefined ? window.iphoneSimState.chatLoadingLimit : 20;
        }
        
        chatLoadingLimitInput.addEventListener('change', (e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 0) val = 0;
            window.iphoneSimState.chatLoadingLimit = val;
            saveConfig();
        });
    }

    const saveIconPresetBtn = document.getElementById('save-icon-preset');
    if (saveIconPresetBtn) saveIconPresetBtn.addEventListener('click', handleSaveIconPreset);
    
    const deleteIconPresetBtn = document.getElementById('delete-icon-preset');
    if (deleteIconPresetBtn) deleteIconPresetBtn.addEventListener('click', handleDeleteIconPreset);
    
    const iconPresetSelect = document.getElementById('icon-preset-select');
    if (iconPresetSelect) iconPresetSelect.addEventListener('change', handleApplyIconPreset);

    const saveAllSettingsBtn = document.getElementById('save-all-settings');
    if (saveAllSettingsBtn) {
        saveAllSettingsBtn.addEventListener('click', () => {
            saveConfig();
            alert('所有配置已保存');
        });
    }
    
    // 聊天设置 CSS 预设相关
    const saveChatCssPresetBtn = document.getElementById('save-chat-css-preset');
    if (saveChatCssPresetBtn) saveChatCssPresetBtn.addEventListener('click', handleSaveChatCssPreset);

    const deleteChatCssPresetBtn = document.getElementById('delete-chat-css-preset');
    if (deleteChatCssPresetBtn) deleteChatCssPresetBtn.addEventListener('click', handleDeleteChatCssPreset);

    const chatCssPresetSelect = document.getElementById('chat-css-preset-select');
    if (chatCssPresetSelect) chatCssPresetSelect.addEventListener('change', handleApplyChatCssPreset);

    // 绑定新的保存按钮
    const saveThemeConfigBtn = document.getElementById('save-theme-config-btn');
    if (saveThemeConfigBtn) {
        saveThemeConfigBtn.addEventListener('click', () => {
            const defaultVirtualImageUrlInput = document.getElementById('default-virtual-image-url');
            const defaultMomentVirtualImageUrlInput = document.getElementById('default-moment-virtual-image-url');
            const cssEditor = document.getElementById('css-editor');

            if (defaultVirtualImageUrlInput) {
                window.iphoneSimState.defaultVirtualImageUrl = defaultVirtualImageUrlInput.value.trim();
            }
            if (defaultMomentVirtualImageUrlInput) {
                window.iphoneSimState.defaultMomentVirtualImageUrl = defaultMomentVirtualImageUrlInput.value.trim();
            }
            if (cssEditor) {
                window.iphoneSimState.css = cssEditor.value;
                applyCSS(window.iphoneSimState.css);
            }
            
            saveConfig();
            alert('美化配置已保存');
        });
    }

    // 还原按钮事件绑定
    const restoreGlobalBtn = document.getElementById('restore-global-css-btn');
    if (restoreGlobalBtn) restoreGlobalBtn.addEventListener('click', restoreGlobalCSS);

    const restoreMeetingBtn = document.getElementById('restore-meeting-css-btn');
    if (restoreMeetingBtn) restoreMeetingBtn.addEventListener('click', restoreMeetingCSS);

    const restoreChatBtn = document.getElementById('restore-chat-css-btn');
    if (restoreChatBtn) restoreChatBtn.addEventListener('click', openContactSelectorForRestore);
}

// --- 还原功能 ---

function restoreGlobalCSS() {
    if (confirm('确定要还原全局CSS为默认状态吗？这将清空所有自定义的全局CSS代码。')) {
        window.iphoneSimState.css = '';
        applyCSS('');
        const cssEditor = document.getElementById('css-editor');
        if (cssEditor) cssEditor.value = '';
        saveConfig();
        alert('全局CSS已还原');
    }
}

function restoreMeetingCSS() {
    if (confirm('确定要还原见面页CSS为默认状态吗？这将清空所有自定义的见面页CSS代码。')) {
        window.iphoneSimState.meetingCss = '';
        applyMeetingCss('');
        const meetingEditor = document.getElementById('meeting-css-editor');
        if (meetingEditor) meetingEditor.value = '';
        saveConfig();
        alert('见面页CSS已还原');
    }
}

function openContactSelectorForRestore() {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    const headerTitle = modal.querySelector('h3');
    const originalTitle = headerTitle ? headerTitle.textContent : '选择联系人';
    if (headerTitle) headerTitle.textContent = '选择要还原CSS的联系人';
    
    if (sendBtn) sendBtn.style.display = 'none';
    
    list.innerHTML = '';
    
    if (window.iphoneSimState.contacts.length === 0) {
        list.innerHTML = '<div class="list-item center-content" style="color:#999;">暂无联系人</div>';
    } else {
        window.iphoneSimState.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-item';
            // 添加点击反馈样式
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="list-content" style="display:flex; align-items:center; width:100%; padding: 10px;">
                    <img src="${c.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; object-fit: cover;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${c.remark || c.name}</div>
                        <div style="font-size: 12px; color: #888;">${c.customCss ? '已设置自定义CSS' : '默认CSS'}</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #ccc;"></i>
                </div>
            `;
            item.onclick = () => {
                restoreChatCSS(c.id);
                // 关闭弹窗
                modal.classList.add('hidden');
                // 恢复原始状态
                if (sendBtn) sendBtn.style.display = '';
                if (headerTitle) headerTitle.textContent = originalTitle;
            };
            list.appendChild(item);
        });
    }
    
    modal.classList.remove('hidden');
    
    const closeHandler = () => {
        modal.classList.add('hidden');
        if (sendBtn) sendBtn.style.display = '';
        if (headerTitle) headerTitle.textContent = originalTitle;
        closeBtn.removeEventListener('click', closeHandler);
    };
    closeBtn.addEventListener('click', closeHandler);
}

function restoreChatCSS(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (contact) {
        if (!contact.customCss) {
            alert('该联系人当前没有设置自定义CSS。');
            return;
        }
        
        if (confirm(`确定要还原 "${contact.remark || contact.name}" 的聊天页面CSS吗？`)) {
            contact.customCss = '';
            saveConfig();
            
            // 如果当前正好在编辑这个联系人的设置，更新输入框
            if (window.iphoneSimState.currentChatContactId === contactId) {
                 const cssInput = document.getElementById('chat-setting-custom-css');
                 if (cssInput) cssInput.value = '';
                 
                 // 如果聊天窗口开着，移除样式
                 const styleEl = document.getElementById('chat-custom-css');
                 if (styleEl) styleEl.remove();
            }
            alert('已还原该联系人的聊天页面CSS');
        }
    }
}

// --- 状态栏时间同步功能 ---

function updateStatusBarTime() {
    const now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes();
    
    // 补零
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    const timeString = `${hours}:${minutes}`;
    
    // 更新所有状态栏时间元素 (可能有多个)
    const timeElements = document.querySelectorAll('.status-bar .time');
    timeElements.forEach(el => {
        el.textContent = timeString;
    });
}

// 导出 UI 更新函数给 core.js 使用
window.updateThemeUi = function() {
    const defaultVirtualImageUrlInput = document.getElementById('default-virtual-image-url');
    if (defaultVirtualImageUrlInput && window.iphoneSimState.defaultVirtualImageUrl) {
        defaultVirtualImageUrlInput.value = window.iphoneSimState.defaultVirtualImageUrl;
    }

    const defaultMomentVirtualImageUrlInput = document.getElementById('default-moment-virtual-image-url');
    if (defaultMomentVirtualImageUrlInput && window.iphoneSimState.defaultMomentVirtualImageUrl) {
        defaultMomentVirtualImageUrlInput.value = window.iphoneSimState.defaultMomentVirtualImageUrl;
    }

    const cssEditor = document.getElementById('css-editor');
    if (cssEditor && window.iphoneSimState.css) {
        cssEditor.value = window.iphoneSimState.css;
    }
};

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupThemeListeners);
    window.appInitFunctions.push(() => {
        updateStatusBarTime();
        // 每秒更新一次，确保时间准确（也可以每分钟，但每秒能更快响应分钟变化）
        setInterval(updateStatusBarTime, 1000);
    });
}
