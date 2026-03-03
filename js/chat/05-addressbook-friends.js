window.renderAddressBook = function() {
    const list = document.getElementById('addressbook-list');
    if (!list) {
        console.error('addressbook-list container not found');
        return;
    }
    list.innerHTML = '';
    
    if (!window.iphoneSimState || !window.iphoneSimState.contacts) {
        list.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">暂无联系人数据</div>';
        return;
    }

    // Update the static New Friends item in the UI (outside the list)
    if (window.updateNewFriendsBadge) window.updateNewFriendsBadge();

    // Sort contacts by name/pinyin (simplified: just name)
    const contacts = [...window.iphoneSimState.contacts].sort((a, b) => {
        return (a.remark || a.name).localeCompare(b.remark || b.name, 'zh-Hans-CN');
    });

    if (contacts.length === 0) {
        // Just append a message if no real contacts, but keep "New Friends"
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'padding: 20px; text-align: center; color: #999;';
        emptyMsg.textContent = '暂无联系人';
        list.appendChild(emptyMsg);
        return;
    }

    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'list-item addressbook-contact-item';
        item.style.paddingTop = '12px';
        item.style.paddingBottom = '12px';
        item.style.minHeight = '64px';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.boxSizing = 'border-box';
        
        const name = contact.remark || contact.nickname || contact.name;
        
        item.innerHTML = `
            <div class="list-content addressbook-contact-content">
                <img src="${contact.avatar}" class="addressbook-contact-avatar">
                <span class="addressbook-contact-name">${name}</span>
            </div>
        `;

        const avatarEl = item.querySelector('.addressbook-contact-avatar');
        const nameEl = item.querySelector('.addressbook-contact-name');
        if (avatarEl) avatarEl.style.display = 'block';
        if (nameEl) {
            nameEl.style.marginTop = '0';
            nameEl.style.marginBottom = '0';
            nameEl.style.lineHeight = '1.2';
        }
        
        item.onclick = () => {
            window.iphoneSimState.currentChatContactId = contact.id;
            window.openAiProfile();
        };
        list.appendChild(item);
    });
    
    // Total count footer
    const footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.padding = '20px';
    footer.style.color = '#999';
    footer.style.fontSize = '14px';
    footer.textContent = `${contacts.length} 位联系人`;
    list.appendChild(footer);
};

window.openNewFriendsScreen = function() {
    let screen = document.getElementById('new-friends-screen');
    if (!screen) {
        screen = document.createElement('div');
        screen.id = 'new-friends-screen';
        screen.className = 'app-screen';
        screen.style.zIndex = '300'; // Above contacts
        screen.style.backgroundColor = '#FFFFFF'; // iOS background color
        screen.innerHTML = `
            <div class="app-header" style="background: #fff; border-bottom: 0; box-shadow: none;">
                <div class="header-left">
                    <button class="back-btn" onclick="document.getElementById('new-friends-screen').classList.add('hidden')" style="color: #181818; font-weight: 500;">
                        <i class="fas fa-chevron-left" style="font-size: 20px; margin-right: 5px;"></i>
                    </button>
                </div>
                <div class="header-right"></div>
            </div>
            <div class="app-body" style="padding: 0; padding-bottom: 20px; overflow-y: auto;">
                <div class="ios-list-group" style="margin-top: 0; background: transparent;">
                    <div class="list-item" style="padding: 12px 16px; background: transparent; color: #666; font-size: 13px; text-transform: uppercase; font-weight: 500;">近三天</div>
                </div>
                <div id="new-friends-list" style="padding: 0 16px;"></div>
            </div>
        `;
        document.getElementById('wechat-app').appendChild(screen);
    }
    
    renderNewFriendsList();
    screen.classList.remove('hidden');
};

function renderNewFriendsList() {
    const list = document.getElementById('new-friends-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    const requests = window.iphoneSimState.wechatFriendRequests || [];
    
    if (requests.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #8e8e93;">
                <i class="fas fa-user-friends" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                <div style="font-size: 15px;">暂无好友申请</div>
            </div>
        `;
        return;
    }
    
    // Sort by pending first, then by time
    const sorted = [...requests].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return b.time - a.time;
    });
    
    sorted.forEach(req => {
        const item = document.createElement('div');
        item.className = 'new-friend-item';
        item.style.cssText = `
            background: #fff;
            padding: 12px 16px;
            border-bottom: 0.5px solid #e5e5ea;
            display: flex;
            align-items: center;
            margin-bottom: 0;
        `;
        
        // Status Text or Button
        let statusHtml = '';
        if (req.status === 'pending') {
            statusHtml = `<button class="accept-btn" style="background: #007AFF; color: #fff; border: none; padding: 6px 16px; border-radius: 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;">接受</button>`;
        } else if (req.status === 'accepted') {
            statusHtml = `<span style="color: #8e8e93; font-size: 14px; font-weight: 500;">已添加</span>`;
        } else {
            statusHtml = `<span style="color: #8e8e93; font-size: 14px;">已拒绝</span>`;
        }
        
        const avatarUrl = req.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + req.name;
        
        item.innerHTML = `
            <div style="width: 48px; height: 48px; border-radius: 8px; margin-right: 10px; background: #f2f2f7; background-image: url('${avatarUrl}'); background-size: cover; background-position: center; flex-shrink: 0;"></div>
            <div style="flex: 1; overflow: hidden; margin-right: 10px;">
                <div style="font-size: 17px; font-weight: 600; color: #000; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${req.name}</div>
                <div style="font-size: 14px; color: #8e8e93; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${req.reason || '请求添加你为朋友'}</div>
            </div>
            <div style="flex-shrink: 0;">${statusHtml}</div>
        `;
        
        const btn = item.querySelector('.accept-btn');
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                // Show Accept Modal
                showAcceptFriendModal(req);
            };
            btn.onmousedown = () => btn.style.opacity = '0.7';
            btn.onmouseup = () => btn.style.opacity = '1';
        }
        
        // Click item to view details (simplified: just show modal if pending)
        item.onclick = () => {
            if (req.status === 'pending') {
                showAcceptFriendModal(req);
            }
        };
        
        // Add subtle hover effect
        item.onmouseenter = () => item.style.backgroundColor = '#f5f5f5';
        item.onmouseleave = () => item.style.backgroundColor = '#fff';
        
        list.appendChild(item);
    });
}

function showAcceptFriendModal(req) {
    let modal = document.getElementById('accept-friend-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'accept-friend-modal';
        modal.className = 'modal';
        modal.style.cssText = 'display: flex; opacity: 1; pointer-events: auto; z-index: 2000; align-items: center; justify-content: center;'; 
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.width = '300px';
        content.style.height = 'auto';
        content.style.maxHeight = '80%';
        content.style.borderRadius = '12px';
        
        content.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <div id="accept-avatar" style="width: 60px; height: 60px; border-radius: 6px; background: #ccc; margin: 0 auto 10px auto; background-size: cover; background-position: center;"></div>
                <h3 id="accept-name" style="margin: 0 0 5px 0;">Name</h3>
                <p id="accept-reason" style="color: #999; font-size: 14px; margin: 0 0 20px 0;">Reason</p>
                
                <div style="text-align: left; background: #f9f9f9; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
                    <div style="font-size: 12px; color: #999; margin-bottom: 5px;">设置备注</div>
                    <input type="text" id="accept-remark" placeholder="添加备注名" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                
                <button id="confirm-accept-btn" style="width: 100%; padding: 10px; background: #07C160; color: #fff; border: none; border-radius: 6px; font-size: 16px; margin-bottom: 10px;">完成</button>
                <button onclick="document.getElementById('accept-friend-modal').classList.add('hidden')" style="width: 100%; padding: 10px; background: #f2f2f7; color: #000; border: none; border-radius: 6px; font-size: 16px;">取消</button>
            </div>
        `;
        modal.appendChild(content);
        document.body.appendChild(modal);
    }
    
    document.getElementById('accept-avatar').style.backgroundImage = `url('${req.avatar || ''}')`;
    document.getElementById('accept-name').textContent = req.name;
    document.getElementById('accept-reason').textContent = req.reason;
    document.getElementById('accept-remark').value = req.name;
    
    document.getElementById('confirm-accept-btn').onclick = async () => {
        const remark = document.getElementById('accept-remark').value.trim();
        await handleAcceptFriend(req, remark);
        modal.classList.add('hidden');
    };
    
    modal.classList.remove('hidden');
}

async function safeCallAiApi(messages) {
    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        console.warn("AI Settings missing");
        return null;
    }

    let fetchUrl = settings.url;
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
    }

    const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
    
    try {
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: settings.model || 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        }
    } catch (e) {
        console.error("AI Call failed", e);
    }
    return null;
}

async function handleAcceptFriend(req, remark) {
    // 1. Generate Persona using AI (if available)
    let persona = "普通朋友";
    
    // Check if persona is already pre-generated
    if (req.preGeneratedPersona) {
        persona = req.preGeneratedPersona;
    } else if (req.icityContext && req.icityContext.msgId) {
        // Try to fetch context from iCity chat history
        const icityMsg = window.iphoneSimState.icityMessages ? window.iphoneSimState.icityMessages.find(m => m.id === req.icityContext.msgId) : null;
        if (icityMsg && icityMsg.history) {
            const contextText = icityMsg.history.map(h => `${h.role === 'me' ? '我' : 'TA'}: ${h.content}`).join('\n');
            
            // Try to generate persona
            try {
                const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
                if (settings.url && settings.key) {
                    const prompt = `根据以下聊天记录，为"TA"生成一个详细的人物设定，要求极度详细且具有“活人感”。
    请包含以下内容：
    1. 真实姓名（**请务必随机生成一个富有特色的名字，绝对不要使用'小明'、'李华'、'王伟'等常见名，尝试使用有深意的名字**）
    2. 性别
    3. 外貌描写（详细描述五官、发型、穿搭风格等，具有画面感）
    4. 爱好与特长
    5. 生活习惯（作息、饮食口味、口头禅、常用表情包风格）
    6. 讨厌的东西或雷点
    7. 成长经历（简述）
    8. 性格深度解析
    9. 隐藏设定（亲密关系）：XP/癖好、经验、敏感点（**必须以纯文本描述，严禁使用嵌套对象**）
    
    请直接输出人设描述，确保鲜活生动。persona 字段必须是一个长字符串，不要嵌套 JSON 对象。
                    
                    ${contextText}`;
                    
                    const messages = [{ role: 'user', content: prompt }];
                    persona = await safeCallAiApi(messages); 
                }
            } catch (e) {
                console.error("Failed to generate persona", e);
            }
        }
    }

    // 2. Create Contact
    const newContact = {
        id: Date.now(),
        name: req.name,
        nickname: req.name,
        remark: remark || req.name,
        avatar: req.avatar,
        persona: persona,
        style: '正常',
        activeReplyEnabled: false,
        autoItineraryEnabled: false,
        userPerception: [],
        thoughtDisplayMode: 'title',
        thoughtPetImage: '',
        thoughtPetSize: 88,
        thoughtPetPosition: { xRatio: 0.86, yRatio: 0.72 },
        group: 'iCity', // Automatically group
        source: 'icity'
    };
    
    window.iphoneSimState.contacts.push(newContact);

    // Transfer Chat History from iCity
    if (req.icityContext && req.icityContext.msgId) {
        const icityMsg = window.iphoneSimState.icityMessages ? window.iphoneSimState.icityMessages.find(m => m.id === req.icityContext.msgId) : null;
        if (icityMsg && icityMsg.history) {
            if (!window.iphoneSimState.chatHistory) window.iphoneSimState.chatHistory = {};
            if (!window.iphoneSimState.chatHistory[newContact.id]) window.iphoneSimState.chatHistory[newContact.id] = [];
            
            // Map icity history to chat history
            const transferredMessages = icityMsg.history.map(h => ({
                id: Date.now() + Math.random(), 
                role: (h.role === 'me' || h.role === 'user') ? 'user' : 'assistant',
                content: h.content,
                time: h.time,
                type: 'text' // Assume text for simplicity
            }));
            
            // Add a divider
            transferredMessages.push({
                id: Date.now(),
                role: 'system',
                content: '[系统消息]: 以上是来自 iCity 的历史对话',
                time: Date.now(),
                type: 'text'
            });

            window.iphoneSimState.chatHistory[newContact.id] = transferredMessages;
        }
    }
    
    // 3. Update Request Status
    req.status = 'accepted';
    
    // 4. Save
    saveConfig();
    
    // 5. Update UI
    renderNewFriendsList();
    if (window.renderContactList) window.renderContactList();
    
    // 6. Navigate to Chat
    document.getElementById('new-friends-screen').classList.add('hidden');
    openChat(newContact.id);
    
    // 7. Initial Greeting (Optional)
    setTimeout(() => {
        // Generate a greeting based on context?
        // Or just let AI handle it naturally when user says hello
        sendMessage(`[系统消息]: 你已添加了 ${remark}，现在可以开始聊天了。`, false, 'text', null, newContact.id);
    }, 500);
}
