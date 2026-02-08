// 见面功能模块

let currentEditingMeetingMsgIndex = null;

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
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    // 倒序排列渲染
    [...meetings].reverse().forEach(meeting => {
        const item = document.createElement('div');
        item.className = 'meeting-item';
        
        const date = new Date(meeting.time);
        const timeStr = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        // 获取摘要
        let summary = '暂无内容';
        if (meeting.content && meeting.content.length > 0) {
            const lastContent = meeting.content[meeting.content.length - 1];
            summary = lastContent.text.substring(0, 20) + (lastContent.text.length > 20 ? '...' : '');
        }

        // HTML 结构：包含一个删除图标
        item.innerHTML = `
            <div class="meeting-item-content" style="width: 100%;">
                <div class="meeting-item-header">
                    <span style="font-weight:600; color:#000;">${meeting.title || '未命名见面'}</span>
                    <span style="font-size: 12px; color: #999;">${timeStr}</span>
                </div>
                <div class="meeting-item-summary" style="color: #666; font-size: 13px; margin-top: 4px;">${summary}</div>
            </div>
            <div class="meeting-delete-btn" title="删除记录">
                <i class="fas fa-trash-alt"></i>
            </div>
        `;
        
        // 绑定点击跳转事件 (点击整个卡片)
        item.addEventListener('click', () => openMeetingDetail(meeting.id));

        // 绑定删除事件 (只点击垃圾桶)
        const deleteBtn = item.querySelector('.meeting-delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // 阻止冒泡，防止触发卡片点击
            deleteMeeting(contactId, meeting.id);
        });

        list.appendChild(item);
    });
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
        card.className = 'meeting-card';
        
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

        card.innerHTML = `
            <div class="meeting-card-header">
                <img src="${avatar}" class="meeting-card-avatar">
                <span class="meeting-card-name ${roleClass}">${name}</span>
            </div>
            <div class="meeting-card-content">${msg.text}</div>
            <div class="meeting-card-actions">
                <img src="${editIconUrl}" class="meeting-action-icon" onclick="window.editMeetingMsg(${index})" title="编辑">
                <img src="${deleteIconUrl}" class="meeting-action-icon danger" onclick="window.deleteMeetingMsg(${index})" title="删除">
            </div>
        `;
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
        saveConfig();
        renderMeetingCards(meeting);
        
        // 重置输入框
        input.value = '';
        input.style.height = 'auto'; 
    }
}

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

    // 提取剧情文本
    const storyText = meeting.content.map(m => {
        const role = m.role === 'user' ? '用户' : contact.name;
        return `${role}: ${m.text}`;
    }).join('\n');

    if (!storyText) {
        showNotification('见面内容为空', 2000);
        return;
    }

    const systemPrompt = `你是一个小说剧情总结助手。
请阅读以下一段角色扮演的剧情对话，并生成一段简练的剧情摘要。
摘要应该是陈述句，概括发生了什么主要事件。
不要包含“剧情显示”、“用户说”等前缀，直接陈述事实。
请将摘要控制在 100 字以内。`;

    let summary = '';

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
                temperature: 0.5
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        summary = data.choices[0].message.content.trim();

    } catch (error) {
        console.error('见面总结API请求失败:', error);
        
        // 失败回退逻辑：如果需要同步，则使用原始内容作为"总结"
        if (injectIntoChat) {
            summary = `(由于网络原因，AI未能生成总结，以下是见面原始内容)\n${storyText}`;
            // 截断过长内容以防 Token 溢出，保留前 1000 字和后 500 字
            if (summary.length > 1500) {
                summary = summary.substring(0, 1000) + '\n...[中间内容省略]...\n' + summary.substring(summary.length - 500);
            }
            showNotification('AI总结失败，使用原始内容同步', 2000, 'warning');
        } else {
            showNotification('总结出错: ' + error.message, 2000, 'error');
            return;
        }
    }

    if (summary) {
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
    
    // 获取线上聊天上下文
    let chatContext = '';
    const chatHistory = window.iphoneSimState.chatHistory[contactId] || [];
    if (chatHistory.length > 0) {
        // 取最近 15 条聊天记录
        const recentChats = chatHistory.slice(-15);
        chatContext = recentChats.map(msg => {
            const role = msg.role === 'user' ? '用户' : contact.name;
            let content = msg.content;
            if (msg.type === 'image') content = '[图片]';
            else if (msg.type === 'sticker') content = '[表情包]';
            return `${role}: ${content}`;
        }).join('\n');
    }

    // 基础设定
    let prompt = `你现在是一个小说家，正在进行一场角色扮演描写。\n`;
    prompt += `角色：${contact.name}。\n`;
    prompt += `人设：${contact.persona || '无特定人设'}。\n`; // 修正：使用 persona 字段
    prompt += `当前场景/文风/地点：${currentMeeting.style || '默认场景'}。\n\n`;
    
    if (chatContext) {
        prompt += `【线上聊天背景】(你们之前的聊天记录，供参考)\n${chatContext}\n\n`;
    }

    prompt += `【规则】\n`;
    prompt += `1. 请以第三人称视角描写，重点描写${contact.name}的神态、动作、语言以及环境氛围。\n`;
    prompt += `2. 不要出现"用户："或"AI："这样的剧本格式，直接写正文。\n`;
    prompt += `3. 沉浸在场景中，不要跳出人设。\n\n`;
    
    prompt += `【剧情回顾】\n`;
    
    // 拼接历史记录 (最近 10 条)
    const recentContent = currentMeeting.content.slice(-10);
    recentContent.forEach(card => {
        if (card.role === 'user') {
            prompt += `(用户动作/语言): ${card.text}\n`;
        } else {
            prompt += `(剧情发展): ${card.text}\n`;
        }
    });

    if (newUserInput) {
        prompt += `(用户动作/语言): ${newUserInput}\n`;
    }

    // 添加字数要求
    let lengthInstruction = "";
    if (contact.meetingMinWords || contact.meetingMaxWords) {
        const min = contact.meetingMinWords || '50'; // 默认给个下限
        const max = contact.meetingMaxWords || '不限';
        lengthInstruction = `\n【重要限制】\n请务必将回复字数严格控制在 ${min} 到 ${max} 字之间。不要过短也不要过长。\n`;
    }
    
    prompt += `\n请根据以上内容，续写接下来的剧情（描写${contact.name}的反应）。`;
    prompt += lengthInstruction; // 将字数限制放在最后，增强权重
    
    return prompt;
}

/**
 * 3. 执行 AI 请求并流式输出
 */
async function handleMeetingAI(type) {
    const inputEl = document.getElementById('meeting-input');
    const userInput = inputEl.value.trim();
    const contactId = window.iphoneSimState.currentChatContactId;
    const meetingId = window.iphoneSimState.currentMeetingId;
    const container = document.getElementById('meeting-card-container');

    if (type === 'user' && !userInput) return;

    const meetings = window.iphoneSimState.meetings[contactId];
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    // 1. 用户发送上屏 (如果是用户触发)
    if (type === 'user') {
        meeting.content.push({
            role: 'user',
            text: userInput
        });
        saveConfig();
        renderMeetingCards(meeting); // 重绘显示用户消息
        inputEl.value = ''; 
        inputEl.style.height = 'auto';
    }

    // 2. UI 准备：添加一个临时的 AI 卡片
    const aiCard = document.createElement('div');
    aiCard.className = 'meeting-card';
    // 获取 AI 头像和名字
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    const avatar = contact.avatar;
    const name = contact.name;
    
    aiCard.innerHTML = `
        <div class="meeting-card-header">
            <img src="${avatar}" class="meeting-card-avatar">
            <span class="meeting-card-name meeting-card-role-ai">${name}</span>
        </div>
        <div class="meeting-card-content loading-dots">...</div>
        <div class="meeting-card-actions">
            <!-- 占位，生成完再显示操作按钮 -->
        </div>
    `;
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

        const fullPrompt = constructMeetingPrompt(contactId, type === 'user' ? userInput : null);
        
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
        const finalTezt = data.choices[0].message.content.trim();
        
        const contentEl = aiCard.querySelector('.meeting-card-content');
        
        // 移除 loading 样式并显示内容
        contentEl.classList.remove('loading-dots');
        contentEl.innerText = finalTezt;
        
        // 保存
        meeting.content.push({
            role: 'ai',
            text: finalTezt
        });
        saveConfig();
        
        // 重新渲染以确保状态一致（添加操作按钮等）
        renderMeetingCards(meeting); 

    } catch (error) {
        console.error(error);
        const contentEl = aiCard.querySelector('.meeting-card-content');
        contentEl.classList.remove('loading-dots');
        contentEl.innerHTML = `<span style="color:red">生成失败: ${error.message}</span>`;
    } finally {
        if(continueBtn) continueBtn.disabled = false;
        inputEl.disabled = false;
        inputEl.focus(); 
    }
}

// 初始化监听器
function setupMeetingListeners() {
    const closeMeetingsScreenBtn = document.getElementById('close-meetings-screen');
    const newMeetingBtn = document.getElementById('new-meeting-btn');
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

    if (newMeetingBtn) newMeetingBtn.addEventListener('click', createNewMeeting);

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

    if (endMeetingBtn) endMeetingBtn.addEventListener('click', endMeeting);
    if (meetingSendBtn) meetingSendBtn.addEventListener('click', handleSendMeetingText);
    if (meetingAiContinueBtn) meetingAiContinueBtn.addEventListener('click', () => handleMeetingAI('continue'));

    const meetingInput = document.getElementById('meeting-input');
    if (meetingInput) {
        meetingInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            if(this.value === '') this.style.height = 'auto';
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
