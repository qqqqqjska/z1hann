// 见面功能模块

let currentEditingMeetingMsgIndex = null;
let isMeetingSelectionMode = false;
let selectedMeetingIds = new Set();

function toRomanNumeral(number) {
    const numerals = [
        ['M', 1000], ['CM', 900], ['D', 500], ['CD', 400],
        ['C', 100], ['XC', 90], ['L', 50], ['XL', 40],
        ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]
    ];

    let remaining = Math.max(1, Number(number) || 1);
    let result = '';

    numerals.forEach(([symbol, value]) => {
        while (remaining >= value) {
            result += symbol;
            remaining -= value;
        }
    });

    return result;
}

function getMeetingChapterTitle(meeting, indexFromOldest) {
    const chapterNumber = indexFromOldest + 1;
    return `Chapter ${toRomanNumeral(chapterNumber)}`;
}

function getMeetingDateLabel(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const sameYear = date.getFullYear() === now.getFullYear();
    const sameMonth = date.getMonth() === now.getMonth();
    const sameDay = date.getDate() === now.getDate();

    if (sameYear && sameMonth && sameDay) {
        return 'TODAY';
    }

    const monthLabels = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${monthLabels[date.getMonth()]} ${date.getDate()}`;
}

function getMeetingSummaryText(meeting) {
    if (!meeting.content || meeting.content.length === 0) {
        return '暂无内容';
    }

    const text = meeting.content
        .map(entry => (entry && entry.text ? String(entry.text).trim() : ''))
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ');

    if (!text) {
        return '暂无内容';
    }

    return text.substring(0, 68) + (text.length > 68 ? '…' : '');
}

// 1. 打开见面列表页
function openMeetingsScreen(contactId) {
    if (!contactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    // 隐藏资料卡，显示见面列表
    document.getElementById('ai-profile-screen').classList.add('hidden');
    document.getElementById('meetings-screen').classList.remove('hidden');
    
    renderMeetingsList(contactId);
}

// 2. 渲染见面列表
function renderMeetingsList(contactId) {
    const list = document.getElementById('meetings-list');
    const emptyState = document.getElementById('meetings-empty');
    if (!list) return;

    list.innerHTML = '';
    
    if (!window.iphoneSimState.meetings) window.iphoneSimState.meetings = {};
    if (!window.iphoneSimState.meetings[contactId]) window.iphoneSimState.meetings[contactId] = [];

    const meetings = window.iphoneSimState.meetings[contactId];

    // 处理空状态
    if (meetings.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        updateMeetingSelectionUI();
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    // 倒序排列渲染
    [...meetings].reverse().forEach(meeting => {
        const item = document.createElement('div');
        item.className = 'meeting-item';
        item.style.cursor = 'pointer';
        item.dataset.meetingId = String(meeting.id);
        
        const originalIndex = meetings.findIndex(m => m.id === meeting.id);
        const chapterTitle = getMeetingChapterTitle(meeting, originalIndex);
        const timeLabel = getMeetingDateLabel(meeting.time);
        
        const summary = getMeetingSummaryText(meeting);

        // HTML 结构：按 demo 的 editorial 列表结构输出
        item.innerHTML = `
            <div class="meeting-item-content" style="width:100%;padding-right:${isMeetingSelectionMode ? '38px' : '0'};box-sizing:border-box;position:relative;">
                <div class="meeting-item-header" style="display:flex;align-items:baseline;justify-content:space-between;gap:16px;width:100%;">
                    <span class="meeting-item-title" style="font-size:18px;color:#111;font-weight:700;font-family:'Palatino Linotype','Book Antiqua',Palatino,'Times New Roman',serif;line-height:1.3;">${chapterTitle}</span>
                    <span class="meeting-item-time" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;color:#999;letter-spacing:.5px;white-space:nowrap;flex-shrink:0;">${timeLabel}</span>
                </div>
                <div class="meeting-item-summary" style="margin-top:8px;font-size:14px;color:#555;line-height:1.6;text-align:justify;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${summary}</div>
            </div>
            ${isMeetingSelectionMode ? `<div class="meeting-select-indicator" style="position:absolute;top:24px;right:0;display:flex;align-items:center;justify-content:center;width:22px;height:22px;border:1px solid ${selectedMeetingIds.has(meeting.id) ? '#111' : '#cfcfcf'};border-radius:50%;background:${selectedMeetingIds.has(meeting.id) ? '#111' : '#fff'};color:#fff;z-index:2;transition:all .15s ease;">${selectedMeetingIds.has(meeting.id) ? '<i class="fas fa-check" style="font-size:11px;"></i>' : ''}</div>` : ''}
        `;
        
        item.addEventListener('click', () => {
            if (isMeetingSelectionMode) {
                if (selectedMeetingIds.has(meeting.id)) {
                    selectedMeetingIds.delete(meeting.id);
                } else {
                    selectedMeetingIds.add(meeting.id);
                }
                updateMeetingSelectionIndicator(item, meeting.id);
                updateMeetingSelectionUI();
                return;
            }

            openMeetingDetail(meeting.id);
        });

        list.appendChild(item);
    });

    updateMeetingSelectionUI();
}

function updateMeetingSelectionIndicator(item, meetingId) {
    if (!item) return;

    let indicator = item.querySelector('.meeting-select-indicator');
    const isSelected = selectedMeetingIds.has(meetingId);

    if (!isMeetingSelectionMode) {
        if (indicator) indicator.remove();
        return;
    }

    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'meeting-select-indicator';
        indicator.style.position = 'absolute';
        indicator.style.top = '24px';
        indicator.style.right = '0';
        indicator.style.display = 'flex';
        indicator.style.alignItems = 'center';
        indicator.style.justifyContent = 'center';
        indicator.style.width = '22px';
        indicator.style.height = '22px';
        indicator.style.borderRadius = '50%';
        indicator.style.color = '#fff';
        indicator.style.zIndex = '2';
        indicator.style.transition = 'all .15s ease';
        item.appendChild(indicator);
    }

    indicator.style.border = `1px solid ${isSelected ? '#111' : '#cfcfcf'}`;
    indicator.style.background = isSelected ? '#111' : '#fff';
    indicator.innerHTML = isSelected ? '<i class="fas fa-check" style="font-size:11px;"></i>' : '';
}

function updateMeetingSelectionUI() {
    const selectBtn = document.getElementById('meeting-select-btn');
    const footerNewMeetingBtn = document.getElementById('meetings-footer-new-btn');
    if (selectBtn) {
        const icon = selectBtn.querySelector('i');
        selectBtn.setAttribute('aria-label', isMeetingSelectionMode ? '删除已选记录' : '进入多选模式');
        selectBtn.style.color = isMeetingSelectionMode ? '#111' : '#777';
        if (icon) {
            icon.className = isMeetingSelectionMode
                ? (selectedMeetingIds.size > 0 ? 'ri-delete-bin-line' : 'ri-check-line')
                : 'ri-menu-line';
        }
    }

    if (footerNewMeetingBtn) {
        footerNewMeetingBtn.style.display = isMeetingSelectionMode ? 'none' : 'inline-flex';
    }
}

function toggleMeetingSelectionMode() {
    if (!window.iphoneSimState.currentChatContactId) return;

    if (isMeetingSelectionMode && selectedMeetingIds.size > 0) {
        const confirmed = confirm(`确定删除已选中的 ${selectedMeetingIds.size} 条见面记录吗？`);
        if (!confirmed) return;

        const contactId = window.iphoneSimState.currentChatContactId;
        const meetings = window.iphoneSimState.meetings[contactId] || [];
        window.iphoneSimState.meetings[contactId] = meetings.filter(meeting => !selectedMeetingIds.has(meeting.id));
        selectedMeetingIds.clear();
        isMeetingSelectionMode = false;
        saveConfig();
        renderMeetingsList(contactId);
        return;
    }

    isMeetingSelectionMode = !isMeetingSelectionMode;
    if (!isMeetingSelectionMode) {
        selectedMeetingIds.clear();
    }

    const listItems = document.querySelectorAll('#meetings-list .meeting-item');
    listItems.forEach(item => {
        const meetingId = Number(item.dataset.meetingId);
        updateMeetingSelectionIndicator(item, meetingId);
    });

    updateMeetingSelectionUI();
}

// 删除单条见面记录
function deleteMeeting(contactId, meetingId) {
    if (!confirm('确定要彻底删除这条见面记录吗？删除后无法恢复。')) return;

    const meetings = window.iphoneSimState.meetings[contactId];
    // 过滤掉要删除的这条
    window.iphoneSimState.meetings[contactId] = meetings.filter(m => m.id !== meetingId);
    
    saveConfig(); // 保存到本地存储
    renderMeetingsList(contactId); // 重新渲染列表
}

// 3. 新建见面
function createNewMeeting() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    const newId = Date.now();
    
    // 获取当前已有见面次数，生成标题
    const count = (window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId]?.length || 0) + 1;
    
    const newMeeting = {
        id: newId,
        time: Date.now(),
        title: `第 ${count} 次见面`,
        content: [], // 结构: { role: 'user'|'ai', text: '...' }
        style: contact.meetingStyle || '正常',
        isFinished: false
    };

    if (!window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId]) window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId] = [];
    window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId].push(newMeeting);
    
    saveConfig();
    
    // 直接进入详情页
    openMeetingDetail(newId);
}

// 4. 进入详情页
function openMeetingDetail(meetingId) {
    window.iphoneSimState.currentMeetingId = meetingId;
    const meetings = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId];
    const meeting = meetings.find(m => m.id === meetingId);
    
    if (!meeting) return;

    // 检查是否已设置同步选项 (仅针对未完成或新进入的)
    if (meeting.syncWithChat === undefined) {
        // 使用 setTimeout 避免阻塞 UI 渲染
        setTimeout(() => {
            if (confirm('是否将此次见面剧情与线上聊天互通？\n\n选择“确定”：\n1. 见面结束时会自动将剧情摘要同步给AI。\n2. 回到聊天时，AI会记得刚才发生的事并自然接话。\n\n选择“取消”：\n此次见面将是独立的平行宇宙，不影响线上聊天。')) {
                meeting.syncWithChat = true;
            } else {
                meeting.syncWithChat = false;
            }
            saveConfig();
        }, 100);
    }

    document.getElementById('meeting-detail-title').textContent = meeting.title;

    // 更新静态图标
    const endIconUrl = (window.iphoneSimState.meetingIcons && window.iphoneSimState.meetingIcons.end) ? window.iphoneSimState.meetingIcons.end : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTkgMjFIMWMtMS4xIDAtMi0uOS0yLTJWMWMwLTEuMS45LTIgMi0yaDhNMjEgMTJsLTUtNW01IDVsLTUgNW01LTVoLTEzIi8+PC9zdmc+';
    const continueIconUrl = (window.iphoneSimState.meetingIcons && window.iphoneSimState.meetingIcons.continue) ? window.iphoneSimState.meetingIcons.continue : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE1IDRINFYyMmgxNFYxMSIvPjxwYXRoIGQ9Ik0xNSAxNnYtMiIvPjxwYXRoIGQ9Ik04IDloMiIvPjxwYXRoIGQ9Ik0yMCA5aDIiLz48cGF0aCBkPSJNMTcuOCAxMS44TDE5IDEzIi8+PHBhdGggZD0iTTEwLjYgNi42TDEyIDgiLz48cGF0aCBkPSJNNC44IDExLjhMNiAxMyIvPjxwYXRoIGQ9Ik0xMiA0LjhMMTAuNiA2Ii8+PHBhdGggZD0iTTE5IDQuOEwxNy44IDYiLz48cGF0aCBkPSJNMTIgMTMuMkw0LjggMjAuNGEyLjggMi44IDAgMCAwIDQgNEwxNiAxNy4yIi8+PC9zdmc+';

    const endIcon = document.getElementById('meeting-end-icon');
    if (endIcon) endIcon.src = endIconUrl;
    
    const continueIcon = document.getElementById('meeting-continue-icon');
    if (continueIcon) continueIcon.src = continueIconUrl;

    // 应用自定义壁纸
    const contactId = window.iphoneSimState.currentChatContactId;
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    const detailScreen = document.getElementById('meeting-detail-screen');
    
    if (contact && contact.meetingWallpaper) {
        detailScreen.style.backgroundImage = `url(${contact.meetingWallpaper})`;
        detailScreen.style.backgroundSize = 'cover';
        detailScreen.style.backgroundPosition = 'center';
    } else {
        detailScreen.style.backgroundImage = '';
        detailScreen.style.backgroundSize = '';
        detailScreen.style.backgroundPosition = '';
    }

    document.getElementById('meeting-detail-screen').classList.remove('hidden');
    
    renderMeetingCards(meeting);
}

// 5. 渲染详情页卡片流
function renderMeetingCards(meeting) {
    const container = document.getElementById('meeting-card-container');
    container.innerHTML = '';
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    
    // 获取图标 URL，如果 state 中没有则使用默认值
    const editIconUrl = (window.iphoneSimState.meetingIcons && window.iphoneSimState.meetingIcons.edit) ? window.iphoneSimState.meetingIcons.edit : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTExIDRINFYyMmgxNFYxMSIvPjxwYXRoIGQ9Ik0xOC41IDIuNWEyLjEyMSAyLjEyMSAwIDAgMSAzIDNMMTIgMTVIOHYtNGw5LjUtOS41eiIvPjwvc3ZnPg==';
    const deleteIconUrl = (window.iphoneSimState.meetingIcons && window.iphoneSimState.meetingIcons.delete) ? window.iphoneSimState.meetingIcons.delete : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iMyA2IDUgNiAyMSA2Ii8+PHBhdGggZD0iTTE5IDZ2MTRhMiAyIDAgMCAxLTIgMkg3YTIgMiAwIDAgMS0yLTJWNm0zIDBUNGEyIDIgMCAwIDEgMi0yaDRhMiAyIDAgMCAxIDIgMnYyIi8+PGxpbmUgeDE9IjEwIiB5MT0iMTEiIHgyPSIxMCIgeTI9IjE3Ii8+PGxpbmUgeDE9IjE0IiB5MT0iMTEiIHgyPSIxNCIgeTI9IjE3Ii8+PC9zdmc+';

    meeting.content.forEach((msg, index) => {
        const card = document.createElement('div');
        card.className = `meeting-card meeting-editorial-block ${msg.role === 'user' ? 'user' : 'ai'}`;
        
        let avatar = '';
        let name = '';
        let roleClass = '';
        
        if (msg.role === 'user') {
            avatar = window.iphoneSimState.userProfile.avatar;
            name = '我';
            roleClass = 'meeting-card-role-user';
        } else {
            avatar = contact.avatar;
            name = contact.name; // 使用 AI 人设名
            roleClass = 'meeting-card-role-ai';
        }

        const roleLabel = msg.role === 'user' ? 'YOU' : 'CHARACTER';

        card.innerHTML = `
            <div class="meeting-editorial-role-tag ${roleClass}" style="font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${msg.role === 'user' ? '#222' : '#b0b0b0'};display:flex;align-items:center;gap:10px;justify-content:${msg.role === 'user' ? 'flex-end' : 'flex-start'};">
                ${msg.role === 'user' ? '' : '<span style="display:block;width:24px;height:1px;background:#ddd;"></span>'}
                <span>${roleLabel}</span>
                ${msg.role === 'user' ? '<span style="display:block;width:24px;height:1px;background:#222;"></span>' : ''}
            </div>
            <div class="meeting-card-content" style="font-size:16px;line-height:1.92;letter-spacing:.2px;color:${msg.role === 'user' ? '#666' : '#2c2c2c'};text-align:${msg.role === 'user' ? 'right' : 'justify'};font-style:${msg.role === 'user' ? 'italic' : 'normal'};">${formatMeetingStoryHtml(msg.text)}</div>
            <div class="meeting-card-actions" style="position:absolute;top:0;${msg.role === 'user' ? 'left:0;padding-right:12px;' : 'right:0;padding-left:12px;'}display:flex;gap:16px;opacity:0;transition:opacity .25s;background:#fdfdfc;">
                <img src="${editIconUrl}" class="meeting-action-icon" onclick="window.editMeetingMsg(${index})" title="编辑" style="width:15px;height:15px;object-fit:contain;opacity:.7;">
                <img src="${deleteIconUrl}" class="meeting-action-icon danger" onclick="window.deleteMeetingMsg(${index})" title="删除" style="width:15px;height:15px;object-fit:contain;opacity:.7;">
            </div>
        `;
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.gap = '14px';
        card.style.position = 'relative';
        container.appendChild(card);
    });
    
    // 应用字体大小
    if (contact.meetingFontSize) {
        container.style.fontSize = `${contact.meetingFontSize}px`;
    } else {
        container.style.fontSize = '';
    }

    // 应用字体大小
    if (contact.meetingFontSize) {
        container.style.fontSize = `${contact.meetingFontSize}px`;
    } else {
        container.style.fontSize = '';
    }

    // 自动滚动到底部
    container.scrollTop = container.scrollHeight;
}

// 6. 发送剧情文本
function handleSendMeetingText() {
    const input = document.getElementById('meeting-input');
    const text = input.value.trim();
    
    if (!text) return;
    if (!window.iphoneSimState.currentMeetingId || !window.iphoneSimState.currentChatContactId) return;

    const meetings = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId];
    const meeting = meetings.find(m => m.id === window.iphoneSimState.currentMeetingId);
    
    if (meeting) {
        meeting.content.push({
            role: 'user',
            text: text
        });
        meeting.suggestedActions = [];
        saveConfig();
        renderMeetingCards(meeting);
        
        // 重置输入框
        input.value = '';
        input.style.height = '24px'; 
    }
}

function getCurrentMeetingRecord() {
    if (!window.iphoneSimState.currentChatContactId || !window.iphoneSimState.currentMeetingId) return null;
    const meetings = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId] || [];
    return meetings.find(m => m.id === window.iphoneSimState.currentMeetingId) || null;
}

function sanitizeMeetingSuggestionText(text) {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    return normalized.length > 50 ? normalized.slice(0, 50) : normalized;
}

function escapeMeetingHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function splitMeetingStoryParagraphs(text) {
    const source = String(text || '').replace(/\r\n/g, '\n').trim();
    if (!source) return [];

    const explicitParagraphs = source.split(/\n{2,}/).map(item => item.trim()).filter(Boolean);
    if (explicitParagraphs.length >= 2) return explicitParagraphs;

    const normalized = source.replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
    const sentenceChunks = normalized.match(/[^。！？!?]+[。！？!?”』）)]*|[^。！？!?]+$/g) || [normalized];
    const paragraphs = [];
    let bucket = [];

    sentenceChunks.forEach((sentence, index) => {
        const cleanSentence = sentence.trim();
        if (!cleanSentence) return;
        bucket.push(cleanSentence);
        const shouldBreak = bucket.length >= 3 || cleanSentence.length >= 42 || index === sentenceChunks.length - 1;
        if (shouldBreak) {
            paragraphs.push(bucket.join(''));
            bucket = [];
        }
    });

    return paragraphs.length > 0 ? paragraphs : [normalized];
}

function formatMeetingStoryHtml(text) {
    const paragraphs = splitMeetingStoryParagraphs(text);
    if (paragraphs.length === 0) return '';
    return paragraphs.map(paragraph => `<p style="margin:0 0 1.15em 0;">${escapeMeetingHtml(paragraph)}</p>`).join('');
}

function buildMeetingSuggestionFallbacks(meeting) {
    const contactId = window.iphoneSimState.currentChatContactId;
    const contact = (window.iphoneSimState.contacts || []).find(item => item.id === contactId) || {};
    const contactName = contact.name || '对方';
    const history = Array.isArray(meeting && meeting.content) ? meeting.content : [];
    const hasAiReply = history.some(item => item && item.role === 'ai' && item.text);
    return [
        sanitizeMeetingSuggestionText(hasAiReply ? `${contactName}抬眼看向你，语气放轻了一些，把眼前的气氛继续往更深处推。` : `${contactName}停顿了一瞬，指尖轻轻收紧，让这段剧情出现新的呼吸感。`),
        sanitizeMeetingSuggestionText(`${contactName}像突然意识到了什么，目光沉下来，让原本平稳的气氛拐进新的转折。`),
        sanitizeMeetingSuggestionText(`${contactName}忽然靠近了些，呼吸和体温都压了过来，让暧昧意味一点点变浓。`)
    ];
}

function normalizeMeetingSuggestions(rawSuggestions, meeting) {
    const fallbacks = buildMeetingSuggestionFallbacks(meeting);
    const normalized = [];
    const seen = new Set();
    (Array.isArray(rawSuggestions) ? rawSuggestions : []).forEach(item => {
        const text = sanitizeMeetingSuggestionText(item);
        if (!text || seen.has(text)) return;
        seen.add(text);
        normalized.push(text);
    });
    for (let i = 0; i < fallbacks.length && normalized.length < 3; i += 1) {
        const text = sanitizeMeetingSuggestionText(fallbacks[i]);
        if (!text || seen.has(text)) continue;
        seen.add(text);
        normalized.push(text);
    }
    return normalized.slice(0, 3);
}

function parseMeetingAiResponse(rawText, meeting) {
    const trimmed = String(rawText || '').trim();
    if (!trimmed) return { reply: '', suggestions: buildMeetingSuggestionFallbacks(meeting) };

    let content = trimmed.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
    try {
        const jsonStart = content.indexOf('{');
        const jsonEnd = content.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd >= jsonStart) {
            content = content.substring(jsonStart, jsonEnd + 1);
        }
        const parsed = JSON.parse(content);
        return {
            reply: String(parsed.reply || parsed.text || parsed.content || '').trim() || trimmed,
            suggestions: normalizeMeetingSuggestions(parsed.suggestions, meeting)
        };
    } catch (e) {
        return {
            reply: trimmed,
            suggestions: buildMeetingSuggestionFallbacks(meeting)
        };
    }
}

window.renderMeetingActionSuggestionMenu = function() {
    const meeting = getCurrentMeetingRecord();
    const list = document.getElementById('meeting-action-suggestion-list');
    if (!list || !meeting) return;
    const items = Array.isArray(meeting.suggestedActions) ? meeting.suggestedActions.filter(Boolean) : [];
    if (items.length === 0) {
        list.innerHTML = '<div style="padding:16px;color:#666;font-size:13px;line-height:1.5;">先输入一段剧情片段并点击一次“续写剧情”，系统会生成本轮的 3 条剧情推进建议。</div>';
        return;
    }
    list.innerHTML = items.map((text, index) => `
        <div class="create-menu-item" style="border-bottom:1px solid #f0f0f0;" onclick="window.pickMeetingActionSuggestion('${encodeURIComponent(text).replace(/'/g, '%27')}')">
            <div class="create-menu-text" style="font-size:12px;color:#999;margin-bottom:4px;">${index === 0 ? '自然剧情行动' : index === 1 ? '转折剧情行动' : 'NSFW剧情行动'}</div>
            <div class="create-menu-text" style="font-size:14px;line-height:1.45;">${text}</div>
        </div>
    `).join('');
};

window.toggleMeetingActionSuggestionMenu = function(forceOpen = null) {
    const menu = document.getElementById('meeting-action-suggestion-menu');
    if (!menu) return;
    const shouldOpen = forceOpen === null ? !menu.classList.contains('active') : !!forceOpen;
    menu.classList.toggle('active', shouldOpen);
    if (shouldOpen) window.renderMeetingActionSuggestionMenu();
};

window.pickMeetingActionSuggestion = function(encodedText) {
    const input = document.getElementById('meeting-input');
    if (!input) return;
    const text = decodeURIComponent(encodedText || '').trim();
    if (!text) return;
    input.value = text;
    input.focus();
    window.toggleMeetingActionSuggestionMenu(false);
};

// 7. 保存文风
function saveMeetingStyle() {
    const style = document.getElementById('meeting-style-input').value.trim();
    const minWords = document.getElementById('meeting-min-words').value;
    const maxWords = document.getElementById('meeting-max-words').value;

    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (contact) {
        contact.meetingStyle = style;
        contact.meetingMinWords = minWords;
        contact.meetingMaxWords = maxWords;
        saveConfig();
        document.getElementById('meeting-style-modal').classList.add('hidden');
    }
}

// 8. 结束见面
function endMeeting() {
    if (!confirm('确定结束这次见面吗？这将保存当前进度并返回见面列表。')) return;
    
    const contactId = window.iphoneSimState.currentChatContactId;
    const meetingId = window.iphoneSimState.currentMeetingId;
    const meetings = window.iphoneSimState.meetings[contactId];
    const meeting = meetings.find(m => m.id === meetingId);

    document.getElementById('meeting-detail-screen').classList.add('hidden');
    
    window.iphoneSimState.currentMeetingId = null;
    renderMeetingsList(contactId); // 刷新列表

    // 如果开启了同步，自动总结并注入聊天
    if (meeting && meeting.content && meeting.content.length > 0) {
        if (meeting.syncWithChat) {
            showNotification('正在同步见面剧情...');
            generateMeetingSummary(contactId, meeting, true); // true = inject into chat
        } else {
            // 原有逻辑：手动询问是否生成回忆
            if (confirm('是否要对本次见面剧情进行总结生成回忆？')) {
                showNotification('正在总结见面剧情...');
                generateMeetingSummary(contactId, meeting, false);
            }
        }
    }
}

async function generateMeetingSummary(contactId, meeting, injectIntoChat = false) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) {
        showNotification('联系人不存在', 2000, 'error');
        return;
    }

    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings; // 优先使用副API
    if (!settings.url || !settings.key) {
        console.log('未配置API，无法自动总结见面');
        showNotification('未配置API', 2000, 'error');
        return;
    }

    let userName = '用户';
    if (contact.userPersonaId) {
        const p = Array.isArray(window.iphoneSimState.userPersonas)
            ? window.iphoneSimState.userPersonas.find(item => item.id === contact.userPersonaId)
            : null;
        if (p && p.name) userName = p.name;
    } else if (window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name) {
        userName = window.iphoneSimState.userProfile.name;
    }
    const actorNames = typeof resolveSummaryActorNames === 'function'
        ? resolveSummaryActorNames(contact, userName)
        : { userLabel: userName || '用户', contactLabel: contact.name || '联系人' };
    userName = actorNames.userLabel;
    const contactLabel = actorNames.contactLabel;

    const meetingMessages = (Array.isArray(meeting && meeting.content) ? meeting.content : [])
        .map((m, idx) => ({
            role: m && m.role === 'user' ? 'user' : 'ai',
            time: (meeting && Number.isFinite(Number(meeting.time)) ? Number(meeting.time) : Date.now()) + idx * 60000,
            content: String(m && m.text ? m.text : '').trim(),
            type: 'meeting_text'
        }))
        .filter(item => item.content);
    const totalMessageCount = meetingMessages.length;
    const lengthRange = typeof getSummaryLengthRangeByCount === 'function'
        ? getSummaryLengthRangeByCount(totalMessageCount, 'meeting')
        : { count: Math.max(1, totalMessageCount), target: 220, min: 140, max: 420 };
    console.log('[summary-length-meeting]', {
        count: lengthRange.count,
        target: lengthRange.target,
        min: lengthRange.min,
        max: lengthRange.max,
        source: injectIntoChat ? 'meeting_sync' : 'meeting_summary'
    });

    // 提取剧情文本
    const storyText = meetingMessages.map(m => {
        const role = m.role === 'user' ? userName : contactLabel;
        return `${role}: ${m.content}`;
    }).join('\n');

    if (!storyText) {
        showNotification('见面内容为空', 2000);
        return;
    }

    let summary = '';
    try {
        if (typeof window.generateChannelNaturalSummary !== 'function') {
            throw new Error('summary helper unavailable');
        }
        const generated = await window.generateChannelNaturalSummary(contact, meetingMessages, {
            channel: 'meeting',
            source: injectIntoChat ? 'meeting_sync' : 'meeting_summary',
            rangeLabel: meeting && meeting.title ? meeting.title : '见面剧情',
            detailModeHint: '当前是见面总结，重点写线下关键动作、情绪变化、承诺或分歧以及后续动作。',
            summaryPromptMode: 'manual',
            rangeLabel: meeting && meeting.title ? meeting.title : '见面剧情',
            detailModeHint: '',
            totalMessageCount,
            sourceMessageCount: totalMessageCount,
            rangeOverride: Object.assign({}, lengthRange, { maxTokens: 1100 }),
            settings
        });
        summary = String(generated && generated.summary || '').trim();
        if (!summary) throw new Error('empty summary');
    } catch (error) {
        console.error('见面总结API请求失败:', error);
        const rawRecord = meetingMessages
            .slice(0, 14)
            .map(msg => `${msg.role === 'user' ? userName : contactLabel}: ${msg.content}`)
            .join('；');
        summary = rawRecord ? `【见面原始记录】${rawRecord}` : '';
        if (!summary) {
            showNotification('见面总结失败', 2000, 'error');
            return;
        }
        showNotification('AI总结失败，已使用原始记录兜底', 2000, 'warning');
    }

    if (false) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const systemPrompt = typeof buildStructuredSummaryPrompt === 'function'
        ? buildStructuredSummaryPrompt({
            channel: 'meeting',
            userLabel: userName,
            contactLabel,
            range: lengthRange,
            dateStr,
            timeStr,
            totalMessageCount,
            detailModeHint: '当前是见面总结，请输出全信息纪要：具体事件、结论状态、原因/情绪、风险卡点与后续动作。'
        })
        : `你是见面总结助手。请返回严格JSON，包含 context/key_events/decision_state/causes_and_emotions/risks_and_differences/next_steps/time_points。`;

    let summary = '';
    let structuredPayload = null;

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

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
                    { role: 'user', content: storyText }
                ],
                temperature: 0.35,
                max_tokens: 420
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let rawSummary = typeof extractChatResponseText === 'function'
            ? extractChatResponseText(data)
            : '';
        if (!rawSummary && data && Array.isArray(data.choices) && data.choices[0] && data.choices[0].message) {
            rawSummary = String(data.choices[0].message.content || '').trim();
        }
        if (!rawSummary) {
            const apiErrorMsg = typeof extractApiErrorMessage === 'function'
                ? extractApiErrorMessage(data)
                : '';
            if (apiErrorMsg) throw new Error(`见面总结接口异常: ${apiErrorMsg}`);
            throw new Error('见面总结接口返回为空或格式不兼容');
        }

        if (typeof buildNarrativeSummaryFromStructuredResponse === 'function') {
            const structured = buildNarrativeSummaryFromStructuredResponse(
                rawSummary,
                contact,
                meetingMessages,
                lengthRange,
                userName,
                {
                    channel: 'meeting',
                    rangeLabel: meeting && meeting.title ? meeting.title : '见面剧情',
                    totalMessageCount,
                    dateStr,
                    timeStr,
                    detailModeHint: '当前是见面总结，请输出全信息纪要：具体事件、结论状态、原因/情绪、风险卡点与后续动作。'
                }
            );
            structuredPayload = structured.payload;
            summary = structured.paragraph || rawSummary;
        } else {
            summary = rawSummary;
        }

    } catch (error) {
        console.error('见面总结API请求失败:', error);
        const localFallback = typeof buildDetailedSummaryFallbackParagraph === 'function'
            ? buildDetailedSummaryFallbackParagraph(contact, meetingMessages, lengthRange, userName, '', {
                channel: 'meeting',
                rangeLabel: meeting && meeting.title ? meeting.title : '见面剧情',
                totalMessageCount
            })
            : `见面过程中，${userName}与${contactLabel}围绕本次剧情进行了沟通，并形成了后续待确认事项。`;
        summary = localFallback;
        showNotification('AI总结失败，已使用本地纪要兜底', 2000, 'warning');
    }

    if (typeof ensureDetailedSummaryText === 'function') {
        summary = ensureDetailedSummaryText(summary, contact, meetingMessages, lengthRange, userName, {
            channel: 'meeting',
            rangeLabel: meeting && meeting.title ? meeting.title : '见面剧情',
            totalMessageCount,
            structuredPayload
        });
    }
    summary = String(summary || '').trim();
    }

    if (summary && summary !== '无' && summary !== '无。') {
        // 1. 添加到记忆
        window.iphoneSimState.memories.push({
            id: Date.now(),
            contactId: contact.id,
            content: `【见面回忆】(${meeting.title}) ${summary}`,
            time: Date.now(),
            range: '见面剧情'
        });

        // 2. 如果需要同步到聊天 (Inject into chat history)
        if (injectIntoChat) {
            if (!window.iphoneSimState.chatHistory[contactId]) {
                window.iphoneSimState.chatHistory[contactId] = [];
            }
            
            const systemMsg = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                time: Date.now(),
                role: 'system',
                content: `[系统事件]: 用户刚刚结束了与你的线下见面（${meeting.title}）。\n见面剧情摘要：${summary}。\n请注意：你们刚刚分开，回到了线上聊天状态。请根据见面的情况，自然地继续话题，或者对见面进行回味/吐槽/关心。`,
                type: 'system_event' // 特殊类型，不直接显示给用户，但包含在上下文
            };
            
            window.iphoneSimState.chatHistory[contactId].push(systemMsg);
            
            // 触发 AI 主动回复（模拟刚分开后的消息）
            setTimeout(() => {
            if (window.generateAiReply) {
                    window.generateAiReply(`（系统提示：见面结束了，用户现在回到了线上。请根据刚才的见面摘要"${summary}"，主动给用户发一条消息，自然地过渡到线上聊天。）`, contactId);
                }
            }, 2000);
        }

        saveConfig();
        
        console.log('见面剧情同步完成:', summary.substring(0, 20) + '...');
        if (!document.querySelector('.notification-banner:not(.hidden)')) {
             showNotification(injectIntoChat ? '已同步见面剧情' : '见面总结完成', 2000, 'success');
        }
    } else {
        showNotification('未生成有效内容', 2000);
    }
}

// 9. 全局工具函数：编辑和删除剧情
window.deleteMeetingMsg = function(index) {
    if (!confirm('确定删除这段剧情？')) return;
    if (!window.iphoneSimState.currentChatContactId || !window.iphoneSimState.currentMeetingId) return;

    const meeting = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId].find(m => m.id === window.iphoneSimState.currentMeetingId);
    if (meeting) {
        meeting.content.splice(index, 1);
        saveConfig();
        renderMeetingCards(meeting);
    }
}

window.editMeetingMsg = function(index) {
    if (!window.iphoneSimState.currentChatContactId || !window.iphoneSimState.currentMeetingId) return;

    const meeting = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId].find(m => m.id === window.iphoneSimState.currentMeetingId);
    if (meeting) {
        currentEditingMeetingMsgIndex = index;
        const content = meeting.content[index].text;
        document.getElementById('edit-meeting-msg-content').value = content;
        document.getElementById('edit-meeting-msg-modal').classList.remove('hidden');
    }
}

/**
 * 2. 构造见面模式的专用 Prompt
 */
function constructMeetingPrompt(contactId, newUserInput) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    const meetingId = window.iphoneSimState.currentMeetingId;
    const meetings = window.iphoneSimState.meetings[contactId];
    const currentMeeting = meetings.find(m => m.id === meetingId);
    
    // 获取线上聊天背景摘要（不直接拼接聊天原文，避免串回消息语境）
    let chatContext = '';
    const chatHistory = window.iphoneSimState.chatHistory[contactId] || [];
    if (chatHistory.length > 0) {
        const recentChats = chatHistory
            .filter(msg => msg && msg.type !== 'system_event' && msg.content)
            .slice(-12);
        const userCount = recentChats.filter(msg => msg.role === 'user').length;
        const contactCount = recentChats.filter(msg => msg.role !== 'user').length;
        const latestFacts = recentChats.slice(-3).map(msg => {
            let content = String(msg.content || '').trim();
            if (content.length > 24) content = `${content.slice(0, 24)}…`;
            return msg.role === 'user' ? `- 用户近期提过：${content}` : `- ${contact.name}近期表现为：${content}`;
        }).join('\n');
        chatContext = [
            `你与用户在线上已有一定互动基础。`,
            `最近聊天中，用户主动表达约 ${userCount} 次，${contact.name}主动表达约 ${contactCount} 次。`,
            latestFacts
        ].filter(Boolean).join('\n');
    }

    // 基础设定
    let prompt = `你现在不是联系人本人，而是一个酒馆式 RP 的旁白写手 / 共创剧情引擎。\n`;
    prompt += `角色：${contact.name}。\n`;
    prompt += `联系人设：${contact.persona || '无特定人设'}。\n`;
    
    // 添加用户人设
    if (contact.userPersonaPromptOverride) {
        prompt += `用户人设：${contact.userPersonaPromptOverride}。\n`;
    } else if (contact.userPersonaId) {
        // 如果没有覆盖，尝试查找预设人设
        const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
        if (p && p.aiPrompt) {
            prompt += `用户人设：${p.aiPrompt}。\n`;
        }
    }

    prompt += `当前场景/文风/地点：${currentMeeting.style || '默认场景'}。\n\n`;
    
    if (chatContext) {
        prompt += `【关系背景摘要】(仅作人物关系和熟悉度参考，不代表当前仍在线上聊天)\n${chatContext}\n\n`;
    }

    prompt += `【规则】\n`;
    prompt += `1. 这是一次线下见面的酒馆式 RP 共写，不是聊天软件对话。你不是${contact.name}本人，也不是在替他回复消息。\n`;
    prompt += `2. 用户当前输入默认应被视为“设定补充、剧情素材、情境假设、关系假设、动作草稿、氛围关键词、片段化灵感”，优先作为世界设定或剧情条件处理，而不是直接当成角色已经说出口的话。\n`;
    prompt += `3. 只有当用户输入本身明确带有说话标记、引号、明确台词动作，或上下文清楚要求“某角色把这句话说出口”时，你才能把其中部分内容落地为角色对白；否则默认不要把整段输入直接写成‘你用气声说出口’、‘你对他说’、‘你发给他’之类行为。\n`;
    prompt += `4. 你的任务是把这些素材转化为“下一段剧情正文”，继续创作双方互动、场景氛围、心理活动、动作和环境变化，并优先表现“设定成立后会怎样”，而不是“用户说了这句话后对方怎么回”。\n`;
    prompt += `5. 除非用户输入里明确出现手机、发消息、聊天框、收到消息等设定，否则不要主动把用户输入解释成角色之间的线上消息；除非用户明确要求说出口，否则也不要主动把输入解释成当面对白。\n`;
    prompt += `6. 必须保持第三人称叙事和沉浸感，不要输出规则说明，不要分析用户，不要总结成提纲。\n`;
    prompt += `7. 只返回 JSON，不要返回 Markdown，不要加代码块。\n`;
    prompt += `8. JSON 格式固定为 {"reply":"下一段剧情正文","suggestions":["建议1","建议2","建议3"]}。\n`;
    prompt += `9. reply 表示你写出的下一段剧情，不是对用户文本的“回复消息”。\n`;
    prompt += `10. suggestions 必须恰好 3 条，每条不超过 50 个汉字，且必须写成“用户下一步可以继续喂给你”的第三人称剧情片段，明确写出角色名。不要写成“你可以回复”“你可以说”“他回你”这种消息建议。顺序固定为：最自然延续剧情 / 推动剧情转折 / 推向 NSFW。\n`;
    prompt += `11. reply 默认分成 2 到 4 段，每段 1 到 4 句；动作、心理、环境变化或关键转折尽量另起一段，避免整段文字挤成一坨。\n\n`;
    
    prompt += `【剧情回顾】\n`;
    
    // 拼接历史记录 (最近 10 条)
    const recentContent = currentMeeting.content.slice(-10);
    recentContent.forEach(card => {
        if (card.role === 'user') {
            prompt += `【用户给出的剧情素材】${card.text}\n`;
        } else {
            prompt += `【你写出的上一段正文】${card.text}\n`;
        }
    });

    if (newUserInput) {
        prompt += `【用户刚追加的剧情素材】${newUserInput}\n`;
    }

    // 添加字数要求
    let lengthInstruction = "";
    if (contact.meetingMinWords || contact.meetingMaxWords) {
        const min = contact.meetingMinWords || '50'; // 默认给个下限
        const max = contact.meetingMaxWords || '不限';
        lengthInstruction = `\n【重要限制】\n请务必将剧情正文控制在 ${min} 到 ${max} 字之间。不要过短也不要过长。\n`;
    }
    
    prompt += `\n请根据以上内容，像酒馆 RP 一样继续创作“下一段剧情正文”。默认把用户输入当成设定或素材，而不是已经对${contact.name}说出口的话。除非用户明确要求落地成台词，否则优先写“这个设定成立后，现场气氛、关系、动作与心理如何变化”。并按指定 JSON 格式返回剧情正文与 3 条可继续喂给你的剧情片段建议。`;
    prompt += lengthInstruction; // 将字数限制放在最后，增强权重
    
    return prompt;
}

/**
 * 3. 执行 AI 请求并流式输出
 */
async function handleMeetingAI(type) {
    const inputEl = document.getElementById('meeting-input');
    const draftInput = inputEl.value.trim();
    const contactId = window.iphoneSimState.currentChatContactId;
    const meetingId = window.iphoneSimState.currentMeetingId;
    const container = document.getElementById('meeting-card-container');

    const meetings = window.iphoneSimState.meetings[contactId];
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    if (meeting.isGeneratingAi) return;

    const lastUserStory = [...(meeting.content || [])].reverse().find(item => item && item.role === 'user' && String(item.text || '').trim());
    const effectiveUserInput = draftInput || (lastUserStory ? String(lastUserStory.text || '').trim() : '');
    if (!effectiveUserInput) {
        inputEl.focus();
        return;
    }

    meeting.isGeneratingAi = true;

    // 1. 用户写入剧情片段并上屏
    if (draftInput) {
        meeting.content.push({
            role: 'user',
            text: draftInput
        });
        saveConfig();
        renderMeetingCards(meeting); // 重绘显示用户剧情片段
        inputEl.value = ''; 
        inputEl.style.height = 'auto';
    }

    // 2. UI 准备：添加一个临时的 AI 卡片（与新版详情页一致）
    const aiCard = document.createElement('div');
    aiCard.className = 'meeting-card meeting-editorial-block ai';
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);

    aiCard.innerHTML = `
        <div class="meeting-editorial-role-tag meeting-card-role-ai" style="font-family:-apple-system,sans-serif;font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:#b0b0b0;display:flex;align-items:center;gap:10px;justify-content:flex-start;">
            <span style="display:block;width:24px;height:1px;background:#ddd;"></span>
            <span>角色反应</span>
        </div>
        <div class="meeting-card-content loading-dots" style="font-size:16px;line-height:1.92;letter-spacing:.2px;color:#2c2c2c;text-align:justify;">......</div>
        <div class="meeting-card-actions" style="position:absolute;top:0;right:0;padding-left:12px;display:flex;gap:16px;opacity:0;transition:opacity .25s;background:#fdfdfc;"></div>
    `;
    aiCard.style.display = 'flex';
    aiCard.style.flexDirection = 'column';
    aiCard.style.gap = '14px';
    aiCard.style.position = 'relative';
    container.appendChild(aiCard);
    
    // 滚动到底部
    container.scrollTop = container.scrollHeight;

    // 锁定按钮
    const continueBtn = document.getElementById('meeting-ai-continue-btn');
    if(continueBtn) continueBtn.disabled = true;
    inputEl.disabled = true; 

    try {
        const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
        if (!settings.url || !settings.key) {
            throw new Error("请先在设置中配置 AI API");
        }

        const fullPrompt = constructMeetingPrompt(contactId, effectiveUserInput);
        
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'user', content: fullPrompt }
                ],
                temperature: 0.7,
                stream: false
            })
        });

        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        const rawResponse = data.choices[0].message.content.trim();
        const parsedResult = parseMeetingAiResponse(rawResponse, meeting);
        const finalTezt = parsedResult.reply;
        
        const contentEl = aiCard.querySelector('.meeting-card-content');
        
        // 移除 loading 样式并显示内容
        contentEl.classList.remove('loading-dots');
        contentEl.innerHTML = formatMeetingStoryHtml(finalTezt);
        
        // 保存
        meeting.content.push({
            role: 'ai',
            text: finalTezt
        });
        meeting.suggestedActions = normalizeMeetingSuggestions(parsedResult.suggestions, meeting);
        saveConfig();
        
        // 重新渲染以确保状态一致（添加操作按钮等）
        renderMeetingCards(meeting); 

    } catch (error) {
        console.error(error);
        const contentEl = aiCard.querySelector('.meeting-card-content');
        contentEl.classList.remove('loading-dots');
        contentEl.innerHTML = `<span style="color:red">生成失败: ${error.message}</span>`;
    } finally {
        meeting.isGeneratingAi = false;
        if(continueBtn) continueBtn.disabled = false;
        inputEl.disabled = false;
        inputEl.focus(); 
    }
}

// 初始化监听器
function setupMeetingListeners() {
    const closeMeetingsScreenBtn = document.getElementById('close-meetings-screen');
    const meetingSelectBtn = document.getElementById('meeting-select-btn');
    const meetingStyleBtn = document.getElementById('meeting-style-btn');
    const meetingStyleModal = document.getElementById('meeting-style-modal');
    const closeMeetingStyleBtn = document.getElementById('close-meeting-style');
    const saveMeetingStyleBtn = document.getElementById('save-meeting-style-btn');

    // 预设相关元素
    const saveMeetingStylePresetBtn = document.getElementById('save-meeting-style-preset');
    const deleteMeetingStylePresetBtn = document.getElementById('delete-meeting-style-preset');
    const meetingStylePresetSelect = document.getElementById('meeting-style-preset-select');

    if (closeMeetingsScreenBtn) closeMeetingsScreenBtn.addEventListener('click', () => {
        document.getElementById('meetings-screen').classList.add('hidden');
    });

    const footerNewMeetingBtn = document.getElementById('meetings-footer-new-btn');
    if (footerNewMeetingBtn) footerNewMeetingBtn.addEventListener('click', createNewMeeting);
    if (meetingSelectBtn) meetingSelectBtn.addEventListener('click', toggleMeetingSelectionMode);

    // 加载文风预设
    function loadMeetingStylePresets() {
        if (!meetingStylePresetSelect) return;
        meetingStylePresetSelect.innerHTML = '<option value="">-- 选择预设 --</option>';
        
        if (!window.iphoneSimState.meetingStylePresets) window.iphoneSimState.meetingStylePresets = [];
        
        window.iphoneSimState.meetingStylePresets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = preset.name;
            meetingStylePresetSelect.appendChild(option);
        });
    }

    // 保存文风预设
    if (saveMeetingStylePresetBtn) {
        saveMeetingStylePresetBtn.addEventListener('click', () => {
            const style = document.getElementById('meeting-style-input').value.trim();
            const minWords = document.getElementById('meeting-min-words').value;
            const maxWords = document.getElementById('meeting-max-words').value;
            
            if (!style) {
                alert('请先输入描写风格内容');
                return;
            }

            const name = prompt('请输入预设名称：');
            if (name) {
                if (!window.iphoneSimState.meetingStylePresets) window.iphoneSimState.meetingStylePresets = [];
                window.iphoneSimState.meetingStylePresets.push({
                    name: name,
                    style: style,
                    minWords: minWords,
                    maxWords: maxWords
                });
                saveConfig();
                loadMeetingStylePresets();
                alert('预设保存成功');
            }
        });
    }

    // 删除文风预设
    if (deleteMeetingStylePresetBtn) {
        deleteMeetingStylePresetBtn.addEventListener('click', () => {
            const index = meetingStylePresetSelect.value;
            if (index === '') {
                alert('请先选择一个预设');
                return;
            }
            
            if (confirm('确定删除该预设吗？')) {
                window.iphoneSimState.meetingStylePresets.splice(index, 1);
                saveConfig();
                loadMeetingStylePresets();
            }
        });
    }

    // 应用文风预设
    if (meetingStylePresetSelect) {
        meetingStylePresetSelect.addEventListener('change', (e) => {
            const index = e.target.value;
            if (index !== '') {
                const preset = window.iphoneSimState.meetingStylePresets[index];
                if (preset) {
                    document.getElementById('meeting-style-input').value = preset.style || '';
                    document.getElementById('meeting-min-words').value = preset.minWords || '';
                    document.getElementById('meeting-max-words').value = preset.maxWords || '';
                }
            }
        });
    }

    if (meetingStyleBtn) meetingStyleBtn.addEventListener('click', () => {
        const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        if(contact) {
            document.getElementById('meeting-style-input').value = contact.meetingStyle || '';
            document.getElementById('meeting-min-words').value = contact.meetingMinWords || '';
            document.getElementById('meeting-max-words').value = contact.meetingMaxWords || '';
        }
        loadMeetingStylePresets(); // 加载预设列表
        meetingStyleModal.classList.remove('hidden');
    });

    const meetingThemeBtn = document.getElementById('meeting-theme-btn');
    const meetingThemeModal = document.getElementById('meeting-theme-modal');
    const closeMeetingThemeBtn = document.getElementById('close-meeting-theme');

    if (meetingThemeBtn) meetingThemeBtn.addEventListener('click', () => {
        const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        if (contact) {
            // 初始化字体大小滑块
            const fontSizeSlider = document.getElementById('meeting-font-size-slider');
            const fontSizeValue = document.getElementById('meeting-font-size-value');
            if (fontSizeSlider && fontSizeValue) {
                const currentSize = contact.meetingFontSize || 16;
                fontSizeSlider.value = currentSize;
                fontSizeValue.textContent = `${currentSize}px`;
                
                fontSizeSlider.oninput = (e) => {
                    const size = e.target.value;
                    fontSizeValue.textContent = `${size}px`;
                    // 实时预览
                    const container = document.getElementById('meeting-card-container');
                    if (container) {
                        container.style.fontSize = `${size}px`;
                    }
                };
                
                fontSizeSlider.onchange = (e) => {
                    contact.meetingFontSize = parseInt(e.target.value);
                    saveConfig();
                };
            }
        }

        // 初始化图标预览
        if (!window.iphoneSimState.meetingIcons) window.iphoneSimState.meetingIcons = {};
        
        const icons = {
            edit: window.iphoneSimState.meetingIcons.edit || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTExIDRINFYyMmgxNFYxMSIvPjxwYXRoIGQ9Ik0xOC41IDIuNWEyLjEyMSAyLjEyMSAwIDAgMSAzIDNMMTIgMTVIOHYtNGw5LjUtOS41eiIvPjwvc3ZnPg==',
            delete: window.iphoneSimState.meetingIcons.delete || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iMyA2IDUgNiAyMSA2Ii8+PHBhdGggZD0iTTE5IDZ2MTRhMiAyIDAgMCAxLTIgMkg3YTIgMiAwIDAgMS0yLTJWNm0zIDBUNGEyIDIgMCAwIDEgMi0yaDRhMiAyIDAgMCAxIDIgMnYyIi8+PGxpbmUgeDE9IjEwIiB5MT0iMTEiIHgyPSIxMCIgeTI9IjE3Ii8+PGxpbmUgeDE9IjE0IiB5MT0iMTEiIHgyPSIxNCIgeTI9IjE3Ii8+PC9zdmc+',
            end: window.iphoneSimState.meetingIcons.end || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTkgMjFIMWMtMS4xIDAtMi0uOS0yLTJWMWMwLTEuMS45LTIgMi0yaDhNMjEgMTJsLTUtNW01IDVsLTUgNW01LTVoLTEzIi8+PC9zdmc+',
            continue: window.iphoneSimState.meetingIcons.continue || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE1IDRINFYyMmgxNFYxMSIvPjxwYXRoIGQ9Ik0xNSAxNnYtMiIvPjxwYXRoIGQ9Ik04IDloMiIvPjxwYXRoIGQ9Ik0yMCA5aDIiLz48cGF0aCBkPSJNMTcuOCAxMS44TDE5IDEzIi8+PHBhdGggZD0iTTEwLjYgNi42TDEyIDgiLz48cGF0aCBkPSJNNC44IDExLjhMNiAxMyIvPjxwYXRoIGQ9Ik0xMiA0LjhMMTAuNiA2Ii8+PHBhdGggZD0iTTE5IDQuOEwxNy44IDYiLz48cGF0aCBkPSJNMTIgMTMuMkw0LjggMjAuNGEyLjggMi44IDAgMCAwIDQgNEwxNiAxNy4yIi8+PC9zdmc+'
        };

        const editPreview = document.getElementById('meeting-edit-icon-preview');
        if(editPreview) editPreview.src = icons.edit;
        
        const deletePreview = document.getElementById('meeting-delete-icon-preview');
        if(deletePreview) deletePreview.src = icons.delete;
        
        const endPreview = document.getElementById('meeting-end-icon-preview');
        if(endPreview) endPreview.src = icons.end;
        
        const continuePreview = document.getElementById('meeting-continue-icon-preview');
        if(continuePreview) continuePreview.src = icons.continue;

        meetingThemeModal.classList.remove('hidden');
    });

    if (closeMeetingThemeBtn) closeMeetingThemeBtn.addEventListener('click', () => meetingThemeModal.classList.add('hidden'));

    if (closeMeetingStyleBtn) closeMeetingStyleBtn.addEventListener('click', () => meetingStyleModal.classList.add('hidden'));
    if (saveMeetingStyleBtn) saveMeetingStyleBtn.addEventListener('click', saveMeetingStyle);

    const endMeetingBtn = document.getElementById('end-meeting-btn');
    const meetingSendBtn = document.getElementById('meeting-send-btn');
    const meetingAiContinueBtn = document.getElementById('meeting-ai-continue-btn');
    const meetingDetailStyleBtn = document.getElementById('meeting-detail-style-btn');
    const meetingDetailMagicBtn = document.getElementById('meeting-detail-magic-btn');
    const closeMeetingActionSuggestionMenuBtn = document.getElementById('close-meeting-action-suggestion-menu');

    if (endMeetingBtn) endMeetingBtn.addEventListener('click', endMeeting);
    if (meetingSendBtn) meetingSendBtn.addEventListener('click', handleSendMeetingText);
    if (meetingAiContinueBtn) meetingAiContinueBtn.addEventListener('click', () => handleMeetingAI('continue'));
    if (meetingDetailStyleBtn) meetingDetailStyleBtn.addEventListener('click', () => meetingStyleModal.classList.remove('hidden'));
    if (meetingDetailMagicBtn) meetingDetailMagicBtn.addEventListener('click', () => window.toggleMeetingActionSuggestionMenu());
    if (closeMeetingActionSuggestionMenuBtn) closeMeetingActionSuggestionMenuBtn.addEventListener('click', () => window.toggleMeetingActionSuggestionMenu(false));

    const meetingInput = document.getElementById('meeting-input');
    if (meetingInput) {
        meetingInput.addEventListener('input', function() {
            this.style.height = '24px';
        });
        
        meetingInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMeetingText();
            }
        });
    }

    // 绑定编辑弹窗事件
    const closeEditMeetingMsgBtn = document.getElementById('close-edit-meeting-msg');
    const saveEditMeetingMsgBtn = document.getElementById('save-edit-meeting-msg-btn');

    if (closeEditMeetingMsgBtn) {
        const newCloseBtn = closeEditMeetingMsgBtn.cloneNode(true);
        closeEditMeetingMsgBtn.parentNode.replaceChild(newCloseBtn, closeEditMeetingMsgBtn);
        
        newCloseBtn.addEventListener('click', () => {
            document.getElementById('edit-meeting-msg-modal').classList.add('hidden');
            currentEditingMeetingMsgIndex = null;
        });
    }

    if (saveEditMeetingMsgBtn) {
        const newSaveBtn = saveEditMeetingMsgBtn.cloneNode(true);
        saveEditMeetingMsgBtn.parentNode.replaceChild(newSaveBtn, saveEditMeetingMsgBtn);

        newSaveBtn.addEventListener('click', () => {
            if (currentEditingMeetingMsgIndex === null || !window.iphoneSimState.currentChatContactId || !window.iphoneSimState.currentMeetingId) return;

            const newText = document.getElementById('edit-meeting-msg-content').value.trim();
            if (!newText) {
                alert('内容不能为空');
                return;
            }

            const meeting = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId].find(m => m.id === window.iphoneSimState.currentMeetingId);
            if (meeting) {
                meeting.content[currentEditingMeetingMsgIndex].text = newText;
                saveConfig();
                renderMeetingCards(meeting);
                document.getElementById('edit-meeting-msg-modal').classList.add('hidden');
                currentEditingMeetingMsgIndex = null;
            }
        });
    }

    // 图标上传监听
    // 壁纸上传监听
    const wallpaperInput = document.getElementById('meeting-wallpaper-upload');
    const resetWallpaperBtn = document.getElementById('reset-meeting-wallpaper-btn');

    if (wallpaperInput) {
        wallpaperInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const result = e.target.result;
                const contactId = window.iphoneSimState.currentChatContactId;
                const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
                
                if (contact) {
                    contact.meetingWallpaper = result;
                    saveConfig();
                    
                    // 实时预览 (如果当前在详情页)
                    const detailScreen = document.getElementById('meeting-detail-screen');
                    if (!detailScreen.classList.contains('hidden')) {
                        detailScreen.style.backgroundImage = `url(${result})`;
                        detailScreen.style.backgroundSize = 'cover';
                        detailScreen.style.backgroundPosition = 'center';
                    }
                    alert('壁纸设置成功');
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (resetWallpaperBtn) {
        resetWallpaperBtn.addEventListener('click', () => {
            if (confirm('确定要重置为默认背景吗？')) {
                const contactId = window.iphoneSimState.currentChatContactId;
                const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
                if (contact) {
                    delete contact.meetingWallpaper;
                    saveConfig();
                    
                    const detailScreen = document.getElementById('meeting-detail-screen');
                    if (!detailScreen.classList.contains('hidden')) {
                        detailScreen.style.backgroundImage = '';
                        detailScreen.style.backgroundSize = '';
                        detailScreen.style.backgroundPosition = '';
                    }
                    alert('壁纸已重置');
                }
            }
        });
    }

    const iconUploads = [
        { id: 'meeting-edit-icon-upload', key: 'edit', previewId: 'meeting-edit-icon-preview' },
        { id: 'meeting-delete-icon-upload', key: 'delete', previewId: 'meeting-delete-icon-preview' },
        { id: 'meeting-end-icon-upload', key: 'end', previewId: 'meeting-end-icon-preview' },
        { id: 'meeting-continue-icon-upload', key: 'continue', previewId: 'meeting-continue-icon-preview' }
    ];

    iconUploads.forEach(item => {
        const input = document.getElementById(item.id);
        if (input) {
            input.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function(e) {
                    const result = e.target.result;
                    
                    // 更新状态
                    if (!window.iphoneSimState.meetingIcons) window.iphoneSimState.meetingIcons = {};
                    window.iphoneSimState.meetingIcons[item.key] = result;
                    saveConfig();

                    // 更新预览
                    const preview = document.getElementById(item.previewId);
                    if (preview) preview.src = result;

                    // 实时更新界面
                    if (item.key === 'end') {
                        const endIcon = document.getElementById('meeting-end-icon');
                        if (endIcon) endIcon.src = result;
                    } else if (item.key === 'continue') {
                        const continueIcon = document.getElementById('meeting-continue-icon');
                        if (continueIcon) continueIcon.src = result;
                    } else {
                        // 编辑和删除图标在卡片列表中，需要重新渲染
                        if (window.iphoneSimState.currentMeetingId && window.iphoneSimState.currentChatContactId) {
                            const meetings = window.iphoneSimState.meetings[window.iphoneSimState.currentChatContactId];
                            const meeting = meetings.find(m => m.id === window.iphoneSimState.currentMeetingId);
                            if (meeting) renderMeetingCards(meeting);
                        }
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    });
}

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupMeetingListeners);
}


