// 通话记录功能模块

// 打开通话记录列表
function openCallHistoryScreen() {
    const screen = document.getElementById('call-history-screen');
    const list = document.getElementById('call-history-list');
    const emptyState = document.getElementById('call-history-empty');
    
    if (!screen || !list) return;

    // 关闭视频通话弹窗
    document.getElementById('video-call-modal').classList.add('hidden');
    
    screen.classList.remove('hidden');
    renderCallHistoryList();
}

// 渲染通话记录列表
function renderCallHistoryList() {
    const list = document.getElementById('call-history-list');
    const emptyState = document.getElementById('call-history-empty');
    
    if (!list) return;
    
    list.innerHTML = '';
    
    // 获取当前联系人的通话记录
    // 我们需要遍历聊天记录，找出所有 type 为 'voice_call_text' 的消息，并按时间分组或作为单独的通话记录
    // 但为了简化，我们假设每次通话结束时会生成一条总结性的消息，或者我们可以解析连续的通话消息
    // 这里我们采用一种更健壮的方法：查找所有通话相关的消息，并按时间聚类
    
    if (!window.iphoneSimState.currentChatContactId) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    
    // 筛选出通话相关的消息
    // 1. 语音/视频通话时长消息 (作为通话结束的标志)
    // 2. 通话内容消息 (type: 'voice_call_text')
    
    const callSessions = [];
    let currentSession = null;
    
    // 按时间顺序遍历
    history.forEach(msg => {
        const isCallContent = msg.type === 'voice_call_text';
        const isCallEnd = msg.type === 'text' && (msg.content.includes('通话时长：') || msg.content.includes('视频通话时长：'));
        const isCallStart = msg.type === 'text' && (msg.content === 'ACTION: START_VOICE_CALL' || msg.content === 'ACTION: START_VIDEO_CALL'); // 虽然这些通常不显示，但作为逻辑参考
        
        // 如果是通话内容，且当前没有会话，或者与上一个会话间隔太久（比如5分钟），则视为新会话
        if (isCallContent) {
            if (!currentSession || (msg.time - currentSession.endTime > 5 * 60 * 1000)) {
                if (currentSession) callSessions.push(currentSession);
                currentSession = {
                    id: msg.id, // 使用第一条消息ID作为会话ID
                    startTime: msg.time,
                    endTime: msg.time,
                    type: 'voice', // 默认为语音，稍后检测
                    messages: [msg],
                    summary: ''
                };
            } else {
                currentSession.messages.push(msg);
                currentSession.endTime = msg.time;
            }
            
            // 检测是否包含视频通话特征
            if (msg.content.includes('{{DESC}}') || msg.content.includes('{{DIALOGUE}}')) {
                currentSession.type = 'video';
            }
        } else if (isCallEnd) {
            if (currentSession && (msg.time - currentSession.endTime < 5 * 60 * 1000)) {
                currentSession.endTime = msg.time;
                currentSession.summary = msg.content; // "通话时长：00:12"
                if (msg.content.includes('视频通话')) {
                    currentSession.type = 'video';
                }
                callSessions.push(currentSession);
                currentSession = null;
            }
        }
    });
    
    if (currentSession) {
        callSessions.push(currentSession);
    }
    
    // 倒序排列（最新的在最前）
    callSessions.reverse();
    
    if (callSessions.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    callSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'meeting-item'; // 复用见面记录的卡片样式
        
        const date = new Date(session.startTime);
        const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        const iconClass = session.type === 'video' ? 'fas fa-video' : 'fas fa-phone-alt';
        const iconColor = session.type === 'video' ? '#007AFF' : '#34C759';
        const title = session.type === 'video' ? '视频通话' : '语音通话';
        
        // 提取摘要：显示前两条对话
        let preview = '';
        if (session.messages.length > 0) {
            const firstMsg = session.messages[0];
            let content = firstMsg.content;
            try {
                const data = JSON.parse(content);
                if (typeof data.text === 'string') content = data.text;
            } catch(e) {}
            
            // 清理视频通话标签
            content = content.replace(/{{DESC}}[\s\S]*?{{\/DESC}}/gi, '')
                             .replace(/{{DIALOGUE}}/gi, '')
                             .replace(/{{\/DIALOGUE}}/gi, '')
                             .trim();
                             
            preview = content;
        }
        
        item.innerHTML = `
            <div class="meeting-item-header">
                <span style="display: flex; align-items: center; gap: 5px; color: #000; font-weight: 600;">
                    <i class="${iconClass}" style="color: ${iconColor};"></i> ${title}
                </span>
                <span>${timeStr}</span>
            </div>
            <div class="meeting-item-summary" style="color: #666; font-size: 14px; margin-top: 5px;">
                ${preview || '无对话内容'}
            </div>
            <div style="font-size: 12px; color: #999; margin-top: 5px; text-align: right;">
                ${session.summary || '通话结束'}
            </div>
        `;
        
        item.onclick = () => openCallDetailScreen(session);
        list.appendChild(item);
    });
}

// 打开通话详情页
function openCallDetailScreen(session) {
    const screen = document.getElementById('call-detail-screen');
    const content = document.getElementById('call-detail-content');
    const title = document.getElementById('call-detail-title');
    
    if (!screen || !content) return;
    
    title.textContent = session.type === 'video' ? '视频通话详情' : '语音通话详情';
    content.innerHTML = '';
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    const aiName = contact ? (contact.remark || contact.name) : 'AI';
    
    session.messages.forEach(msg => {
        let rawContent = msg.content;
        let audioUrl = null;
        let descContent = '';
        
        try {
            const data = JSON.parse(rawContent);
            if (typeof data.text === 'string') rawContent = data.text;
            if (typeof data.description === 'string') descContent = data.description;
            if (data.audio) audioUrl = data.audio;
        } catch(e) {}
        
        const card = document.createElement('div');
        card.className = 'meeting-card'; // 复用见面记录的卡片样式
        card.style.marginBottom = '15px';
        
        const isUser = msg.role === 'user';
        const avatar = isUser ? (contact.myAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User') : contact.avatar;
        const name = isUser ? '我' : aiName;
        const roleClass = isUser ? 'meeting-card-role-user' : 'meeting-card-role-ai';
        
        let displayContent = '';
        
        if (session.type === 'video') {
            // 解析视频通话格式 (兼容旧数据或原始标签格式)
            const descMatch = rawContent.match(/{{DESC}}([\s\S]*?){{\/DESC}}/i);
            const dialogueMatch = rawContent.match(/{{DIALOGUE}}([\s\S]*?){{\/DIALOGUE}}/i);
            
            if (descMatch) {
                descContent = descMatch[1].trim();
            }
            
            if (dialogueMatch) {
                displayContent = dialogueMatch[1].trim();
            } else {
                // 如果没有标签，尝试清理后显示
                displayContent = rawContent.replace(/{{DESC}}[\s\S]*?{{\/DESC}}/gi, '')
                                           .replace(/{{.*?}}/g, '')
                                           .trim();
            }
        } else {
            displayContent = rawContent;
        }
        
        let html = `
            <div class="meeting-card-header">
                <img src="${avatar}" class="meeting-card-avatar">
                <span class="meeting-card-name ${roleClass}">${name}</span>
            </div>
        `;
        
        if (descContent) {
            html += `
                <div class="meeting-card-content" style="font-style: italic; color: #666; margin-bottom: 8px; font-size: 14px;">
                    ${descContent}
                </div>
            `;
        }
        
        if (displayContent) {
            html += `
                <div class="meeting-card-content">
                    ${displayContent}
                </div>
            `;
        }
        
        // 如果有音频，添加播放按钮
        if (audioUrl) {
            const audioId = `audio-${msg.id}`;
            html += `
                <div class="meeting-card-actions">
                    <i class="fas fa-volume-up meeting-action-icon" onclick="playHistoryAudio('${audioUrl}', this)"></i>
                </div>
            `;
        }
        
        card.innerHTML = html;
        content.appendChild(card);
    });
    
    screen.classList.remove('hidden');
}

// 播放历史音频
window.playHistoryAudio = function(url, btn) {
    if (window.currentHistoryAudio) {
        window.currentHistoryAudio.pause();
        if (window.currentHistoryBtn) {
            window.currentHistoryBtn.classList.remove('active');
            window.currentHistoryBtn.style.color = '';
        }
    }
    
    const audio = new Audio(url);
    window.currentHistoryAudio = audio;
    window.currentHistoryBtn = btn;
    
    btn.classList.add('active');
    btn.style.color = '#007AFF';
    
    audio.onended = () => {
        btn.classList.remove('active');
        btn.style.color = '';
        window.currentHistoryAudio = null;
    };
    
    audio.play().catch(e => {
        console.error('Play failed', e);
        alert('播放失败');
        btn.classList.remove('active');
        btn.style.color = '';
    });
};

// 初始化监听器
function setupCallHistoryListeners() {
    const viewHistoryBtn = document.getElementById('view-call-history-btn');
    const closeHistoryBtn = document.getElementById('close-call-history');
    const closeDetailBtn = document.getElementById('close-call-detail');
    
    if (viewHistoryBtn) {
        viewHistoryBtn.addEventListener('click', openCallHistoryScreen);
    }
    
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', () => {
            document.getElementById('call-history-screen').classList.add('hidden');
        });
    }
    
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
            document.getElementById('call-detail-screen').classList.add('hidden');
        });
    }
}

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupCallHistoryListeners);
} else {
    window.appInitFunctions = [setupCallHistoryListeners];
}
