// 其他应用功能模块 (朋友圈, 钱包, 记忆, 行程, 音乐, 拍立得, 表情包, 身份)

let postMomentImages = [];
let currentEditingPersonaId = null;
let currentEditingMemoryId = null;

// --- 朋友圈功能 ---

function renderMoments() {
    const container = document.getElementById('moments-container');
    if (!container) return;

    if (!window.iphoneSimState.userProfile) {
        window.iphoneSimState.userProfile = {
            name: 'User Name',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            bgImage: '',
            momentsBgImage: '',
            desc: '点击此处添加个性签名',
            wxid: 'wxid_123456'
        };
    }

    const { name, avatar, momentsBgImage } = window.iphoneSimState.userProfile;
    const bg = momentsBgImage || '';

    const coverEl = document.getElementById('moments-cover-trigger');
    if (coverEl) {
        coverEl.style.backgroundImage = `url('${bg}')`;
        coverEl.style.backgroundColor = '';
        
        document.getElementById('moments-user-name').textContent = name;
        document.getElementById('moments-user-avatar').src = avatar;
    } else {
        container.innerHTML = `
            <div class="moments-header">
                <div class="moments-cover" id="moments-cover-trigger" style="background-image: url('${bg}');">
                    <div class="moments-user-info">
                        <span class="moments-user-name" id="moments-user-name">${name}</span>
                        <img class="moments-user-avatar" id="moments-user-avatar" src="${avatar}">
                    </div>
                </div>
            </div>
            <div class="moments-list" id="moments-list-content">
                <!-- 朋友圈列表内容 -->
            </div>
        `;
        
        document.getElementById('moments-cover-trigger').addEventListener('click', () => {
            document.getElementById('moments-bg-input').click();
        });
    }

    renderMomentsList();
}

function renderMomentsList() {
    const listContainer = document.getElementById('moments-list-content');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (!window.iphoneSimState.moments) window.iphoneSimState.moments = [];

    const sortedMoments = [...window.iphoneSimState.moments].sort((a, b) => b.time - a.time);

    sortedMoments.forEach(moment => {
        let avatar, name;
        
        if (moment.contactId === 'me') {
            avatar = window.iphoneSimState.userProfile.avatar;
            name = window.iphoneSimState.userProfile.name;
        } else {
            const contact = window.iphoneSimState.contacts.find(c => c.id === moment.contactId);
            if (contact) {
                avatar = contact.avatar;
                name = contact.remark || contact.nickname || contact.name;
            } else {
                avatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown';
                name = '未知用户';
            }
        }

        const item = document.createElement('div');
        item.className = 'moment-item';
        
        let imagesHtml = '';
        if (moment.images && moment.images.length > 0) {
            const gridClass = moment.images.length === 1 ? 'single' : 'grid';
            imagesHtml = `<div class="moment-images ${gridClass}">
                ${moment.images.map((img, imgIndex) => {
                    const isVirtual = (typeof img === 'object' && img.isVirtual);
                    
                    if (isVirtual) {
                        const uniqueId = `moment-virtual-${moment.id}-${imgIndex}`;
                        const overlayId = `overlay-${uniqueId}`;
                        const cleanDesc = (img.desc || '').replace(/^\[图片描述\][:：]?\s*/, '');
                        
                        let displaySrc = window.iphoneSimState.defaultMomentVirtualImageUrl;
                        if (!displaySrc) {
                             // Fallback to stored src (placeholder) or default chat virtual image url or hardcoded
                             displaySrc = img.src || window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                        }
                        
                        return `
                        <div class="virtual-image-container" style="position: relative; cursor: pointer; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; overflow: hidden; background-color: #f2f2f7;">
                            <img src="${displaySrc}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                            <div class="virtual-image-overlay" style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px 10px 5px; box-sizing: border-box; pointer-events: none;">
                                <div style="font-size: 12px; color: #fff; line-height: 1.4; word-wrap: break-word; white-space: pre-wrap; text-align: left;">${cleanDesc}</div>
                            </div>
                        </div>
                        `;
                    } else {
                        const src = typeof img === 'string' ? img : img.src;
                        return `<img src="${src}" class="moment-img">`;
                    }
                }).join('')}
            </div>`;
        }

        let likesHtml = '';
        if (moment.likes && moment.likes.length > 0) {
            likesHtml = `<div class="moment-likes"><i class="far fa-heart"></i> ${moment.likes.join(', ')}</div>`;
        }

        let commentsHtml = '';
        if (moment.comments && moment.comments.length > 0) {
            commentsHtml = `<div class="moment-comments">
                ${moment.comments.map((c, index) => {
                    let displayName = c.user;
                    if (moment.contactId !== 'me') {
                        const contact = window.iphoneSimState.contacts.find(cnt => cnt.id === moment.contactId);
                        if (contact && contact.remark) {
                            if (c.user === contact.name || c.user === contact.nickname) {
                                displayName = contact.remark;
                            }
                        }
                    }

                    let userHtml = `<span class="comment-user">${displayName}</span>`;
                    if (c.replyTo) {
                        userHtml += `回复<span class="comment-user">${c.replyTo}</span>`;
                    }
                    return `<div class="comment-item" onclick="event.stopPropagation(); window.handleCommentClick(this, ${moment.id}, ${index}, '${c.user}')" style="display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; padding: 2px 4px; border-radius: 2px;">
                        <span style="flex: 1;">${userHtml}：<span class="comment-content">${c.content}</span></span>
                        <span class="comment-delete-btn" style="display: none; color: #576b95; margin-left: 8px; font-size: 12px; padding: 0 4px;">✕</span>
                    </div>`;
                }).join('')}
            </div>`;
        }

        let footerHtml = '';
        if (likesHtml || commentsHtml) {
            footerHtml = `<div class="moment-likes-comments">${likesHtml}${commentsHtml}</div>`;
        }

        const date = new Date(moment.time);
        const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

        item.innerHTML = `
            <img src="${avatar}" class="moment-avatar">
            <div class="moment-content">
                <div class="moment-name">${name}</div>
                <div class="moment-text">${moment.content}</div>
                ${imagesHtml}
                <div class="moment-info">
                    <div style="display: flex; align-items: center;">
                        <span class="moment-time">${timeStr}</span>
                        <span class="moment-delete" onclick="window.deleteMoment(${moment.id})">删除</span>
                    </div>
                    <div style="position: relative;">
                        <button class="moment-action-btn" onclick="window.toggleActionMenu(this, ${moment.id})"><i class="fas fa-ellipsis-h"></i></button>
                        <div class="action-menu" id="action-menu-${moment.id}">
                            <button class="action-menu-btn" onclick="window.toggleLike(${moment.id})"><i class="far fa-heart"></i> 赞</button>
                            <button class="action-menu-btn" onclick="window.showCommentInput(${moment.id})"><i class="far fa-comment"></i> 评论</button>
                        </div>
                    </div>
                </div>
                ${footerHtml}
            </div>
        `;
        
        listContainer.appendChild(item);
    });
}

function addMoment(contactId, content, images = []) {
    if (!window.iphoneSimState.moments) window.iphoneSimState.moments = [];
    
    const newMoment = {
        id: Date.now(),
        contactId,
        content,
        images,
        time: Date.now(),
        likes: [],
        comments: []
    };
    
    window.iphoneSimState.moments.unshift(newMoment);
    saveConfig();
    renderMomentsList();
}

function handlePostMoment() {
    const content = document.getElementById('post-moment-text').value.trim();
    
    if (!content && postMomentImages.length === 0) {
        alert('请输入内容或选择图片');
        return;
    }

    addMoment('me', content, [...postMomentImages]);

    const momentSummary = content || '[图片动态]';
    let imageTag = postMomentImages.length > 0 ? ` [包含${postMomentImages.length}张图片]` : '';
    
    // Add image descriptions and hidden data for AI
    if (postMomentImages.length > 0) {
        postMomentImages.forEach(img => {
            let desc = typeof img === 'string' ? '' : img.desc;
            if (desc) {
                imageTag += ` [图片描述: ${desc}]`;
            }
            
            let src = typeof img === 'string' ? img : img.src;
            if (src && (src.startsWith('data:image') || src.startsWith('http'))) {
                // Embed image data for AI to see (will be parsed by chat.js)
                imageTag += ` <hidden_img>${src}</hidden_img>`;
            }
        });
    }

    const hiddenMsg = `[发布了动态]: ${momentSummary}${imageTag}`;

    window.iphoneSimState.contacts.forEach(contact => {
        if (!window.iphoneSimState.chatHistory[contact.id]) {
            window.iphoneSimState.chatHistory[contact.id] = [];
        }
        window.iphoneSimState.chatHistory[contact.id].push({
            role: 'user',
            content: hiddenMsg
        });
    });
    
    saveConfig();

    document.getElementById('post-moment-modal').classList.add('hidden');
}

function openPostMoment(isTextOnly) {
    const modal = document.getElementById('post-moment-modal');
    const textInput = document.getElementById('post-moment-text');
    const imageContainer = document.getElementById('post-moment-images');
    
    textInput.value = '';
    postMomentImages = [];
    renderPostMomentImages();
    
    if (isTextOnly) {
        imageContainer.style.display = 'none';
        textInput.placeholder = '这一刻的想法...';
    } else {
        imageContainer.style.display = 'grid';
        textInput.placeholder = '这一刻的想法...';
    }
    
    modal.classList.remove('hidden');
}

function handlePostMomentImages(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(file => {
        compressImage(file, 800, 0.7).then(base64 => {
            if (postMomentImages.length < 9) {
                // Change to store object with desc
                postMomentImages.push({
                    src: base64,
                    desc: '',
                    isVirtual: false
                });
                renderPostMomentImages();
            }
        }).catch(err => {
            console.error('图片压缩失败', err);
        });
    });
    e.target.value = '';
}

function handleVirtualImage() {
    if (postMomentImages.length >= 9) {
        alert('最多只能添加9张图片');
        return;
    }
    const desc = prompt('请输入图片描述');
    if (desc) {
        const bg = 'eee';
        const fg = '333';
        // Use part of desc as placeholder text
        const text = encodeURIComponent(desc.substring(0, 6)); 
        const src = `https://placehold.co/600x600/${bg}/${fg}?text=${text}`;
        
        postMomentImages.push({
            src: src,
            desc: desc,
            isVirtual: true
        });
        renderPostMomentImages();
    }
}

function handleEditImageDesc(index) {
    if (!postMomentImages[index]) return;
    const imgObj = postMomentImages[index];
    // Backward compatibility if it's a string
    const currentDesc = typeof imgObj === 'string' ? '' : (imgObj.desc || '');
    
    const newDesc = prompt('编辑图片描述：', currentDesc);
    if (newDesc !== null) {
        if (typeof imgObj === 'string') {
            postMomentImages[index] = {
                src: imgObj,
                desc: newDesc,
                isVirtual: false
            };
        } else {
            imgObj.desc = newDesc;
            if (imgObj.isVirtual) {
                 const bg = 'eee';
                 const fg = '333';
                 const text = encodeURIComponent(newDesc.substring(0, 6));
                 imgObj.src = `https://placehold.co/600x600/${bg}/${fg}?text=${text}`;
            }
        }
        renderPostMomentImages();
    }
}

function renderPostMomentImages() {
    const container = document.getElementById('post-moment-images');
    const addBtn = document.getElementById('add-moment-image-btn');
    const virtualBtn = document.getElementById('add-virtual-image-btn');
    
    const oldItems = container.querySelectorAll('.post-image-item');
    oldItems.forEach(item => item.remove());
    
    postMomentImages.forEach((imgData, index) => {
        const item = document.createElement('div');
        item.className = 'post-image-item';
        
        const src = typeof imgData === 'string' ? imgData : imgData.src;
        item.innerHTML = `<img src="${src}">`;
        
        // Click to edit desc
        item.addEventListener('click', () => handleEditImageDesc(index));
        
        // Insert before add buttons
        container.insertBefore(item, addBtn);
    });

    if (postMomentImages.length >= 9) {
        addBtn.style.display = 'none';
        if (virtualBtn) virtualBtn.style.display = 'none';
    } else {
        addBtn.style.display = 'flex';
        if (virtualBtn) virtualBtn.style.display = 'flex';
    }
}

window.deleteMoment = function(id) {
    if (confirm('确定删除这条动态吗？')) {
        window.iphoneSimState.moments = window.iphoneSimState.moments.filter(m => m.id !== id);
        saveConfig();
        renderMomentsList();
    }
};

window.handleCommentClick = function(el, momentId, index, user) {
    const deleteBtn = el.querySelector('.comment-delete-btn');
    
    if (deleteBtn.style.display !== 'none') {
        window.replyToComment(momentId, user);
    } else {
        document.querySelectorAll('.comment-delete-btn').forEach(btn => btn.style.display = 'none');
        document.querySelectorAll('.comment-item').forEach(item => item.style.backgroundColor = '');
        
        deleteBtn.style.display = 'inline-block';
        el.style.backgroundColor = '#e5e5e5';
        
        deleteBtn.onclick = function(e) {
            e.stopPropagation();
            window.deleteComment(momentId, index);
        };
        
        const closeDelete = () => {
            deleteBtn.style.display = 'none';
            el.style.backgroundColor = '';
            document.removeEventListener('click', closeDelete);
        };
        setTimeout(() => document.addEventListener('click', closeDelete), 0);
    }
};

window.deleteComment = function(momentId, commentIndex) {
    if (confirm('确定删除这条评论吗？')) {
        const moment = window.iphoneSimState.moments.find(m => m.id === momentId);
        if (moment && moment.comments) {
            moment.comments.splice(commentIndex, 1);
            saveConfig();
            renderMomentsList();
        }
    }
};

window.toggleActionMenu = function(btn, id) {
    document.querySelectorAll('.action-menu.show').forEach(el => {
        if (el.id !== `action-menu-${id}`) el.classList.remove('show');
    });
    
    const menu = document.getElementById(`action-menu-${id}`);
    menu.classList.toggle('show');
    
    const closeMenu = (e) => {
        if (!btn.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
};

window.toggleLike = function(id, userName = null) {
    const moment = window.iphoneSimState.moments.find(m => m.id === id);
    if (!moment) return;

    if (!moment.likes) moment.likes = [];
    
    const likerName = userName || window.iphoneSimState.userProfile.name;
    const index = moment.likes.indexOf(likerName);
    
    if (index > -1) {
        moment.likes.splice(index, 1);
    } else {
        moment.likes.push(likerName);
    }
    
    saveConfig();
    renderMomentsList();
};

window.showCommentInput = function(id) {
    const content = prompt('请输入评论内容：');
    if (content) {
        window.submitComment(id, content);
    }
    const menu = document.getElementById(`action-menu-${id}`);
    if (menu) menu.classList.remove('show');
};

window.replyToComment = function(momentId, toUser) {
    if (toUser === window.iphoneSimState.userProfile.name) {
        alert('不能回复自己');
        return;
    }
    const content = prompt(`回复 ${toUser}：`);
    if (content) {
        window.submitComment(momentId, content, toUser);
    }
};

window.submitComment = function(id, content, replyTo = null, userName = null) {
    const moment = window.iphoneSimState.moments.find(m => m.id === id);
    if (!moment) return;

    if (!moment.comments) moment.comments = [];
    
    const commenterName = userName || window.iphoneSimState.userProfile.name;

    moment.comments.push({
        user: commenterName,
        content: content,
        replyTo: replyTo
    });

    if (moment.contactId !== 'me' && !userName) {
        const contactId = moment.contactId;
        let momentText = moment.content;
        if (momentText.length > 50) momentText = momentText.substring(0, 50) + '...';
        
        let chatMsg = `[评论了你的动态: "${momentText}"] ${content}`;
        if (replyTo) {
            chatMsg = `[评论了你的动态: "${momentText}"] (回复 ${replyTo}) ${content}`;
        }
        
        if (!window.iphoneSimState.chatHistory[contactId]) {
            window.iphoneSimState.chatHistory[contactId] = [];
        }
        window.iphoneSimState.chatHistory[contactId].push({
            role: 'user',
            content: chatMsg
        });
        
        if (window.iphoneSimState.currentChatContactId === contactId) {
            if (window.appendMessageToUI) window.appendMessageToUI(chatMsg, true);
            if (window.scrollToBottom) window.scrollToBottom();
        }
    }
    
    saveConfig();
    renderMomentsList();

    if (moment.contactId !== 'me' && !userName) {
        setTimeout(() => {
            generateAiCommentReply(moment, { user: window.iphoneSimState.userProfile.name, content: content, replyTo: replyTo });
        }, 2000);
    }
};

async function generateAiCommentReply(moment, userComment) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === moment.contactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) return;

    try {
        let contextDesc = `你的朋友 ${userComment.user} 在下面评论说：“${userComment.content}”`;
        if (userComment.replyTo) {
            contextDesc = `你的朋友 ${userComment.user} 回复了 ${userComment.replyTo} 说：“${userComment.content}”`;
        }

        // Prepare System Prompt (Text context)
        // Keep explicit text descriptions in system prompt as fallback/context
        let imageDescText = '';
        if (moment.images && moment.images.length > 0) {
            moment.images.forEach((img, idx) => {
                let desc = typeof img === 'string' ? '' : img.desc;
                if (desc) {
                    imageDescText += `\n[图片${idx + 1}描述: ${desc}]`;
                }
            });
        }

        let systemPrompt = `你现在扮演 ${contact.name}。
人设：${contact.persona || '无'}

【当前情境】
你发了一条朋友圈：“${moment.content}”${imageDescText}
${contextDesc}

【任务】
请回复 ${userComment.user}。
回复要求：
1. 简短自然，像微信朋友圈回复。
2. 符合你的人设。
3. 直接返回回复内容，不要包含任何解释。`;

        // Construct User Message with Vision capabilities
        let userContent = [];
        userContent.push({ type: 'text', text: '请回复' });

        if (moment.images && moment.images.length > 0) {
            moment.images.forEach(img => {
                let src = typeof img === 'string' ? img : img.src;
                // If it's a real image (Base64) or URL, add to payload for Vision models
                if (src && (src.startsWith('data:image') || src.startsWith('http'))) {
                    userContent.push({
                        type: 'image_url',
                        image_url: {
                            url: src
                        }
                    });
                }
            });
        }

        let messages = [
            { role: 'system', content: systemPrompt }
        ];

        // Determine if we send array content (Vision) or simple string
        const hasImages = userContent.some(c => c.type === 'image_url');
        if (hasImages) {
            messages.push({ role: 'user', content: userContent });
        } else {
            messages.push({ role: 'user', content: '请回复' });
        }

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
                messages: messages,
                temperature: 0.7,
                max_tokens: 300 // Optional limit
            })
        });

        if (!response.ok) {
            console.error('AI Request Failed', response.status);
            return;
        }

        const data = await response.json();
        let replyContent = data.choices[0].message.content.trim();
        
        if ((replyContent.startsWith('"') && replyContent.endsWith('"')) || (replyContent.startsWith('“') && replyContent.endsWith('”'))) {
            replyContent = replyContent.slice(1, -1);
        }

        if (!moment.comments) moment.comments = [];
        moment.comments.push({
            user: contact.remark || contact.name,
            content: replyContent,
            replyTo: userComment.user
        });
        
        saveConfig();
        renderMomentsList();

    } catch (error) {
        console.error('AI回复评论失败:', error);
    }
}

async function generateAiMoment(isSilent = false) {
    if (!window.iphoneSimState.currentChatContactId) {
        if (!isSilent) alert('请先进入一个聊天窗口');
        return;
    }
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        if (!isSilent) alert('请先在设置中配置AI API');
        return;
    }

    const btn = document.getElementById('trigger-ai-moment-btn');
    let originalText = '';
    if (btn) {
        originalText = btn.textContent;
        btn.textContent = '生成中...';
        btn.disabled = true;
    }

    try {
        let systemPrompt = `你现在扮演 ${contact.name}。
人设：${contact.persona || '无'}
请生成一条朋友圈动态内容。
内容要求：
1. 符合你的人设。
2. 像真实的朋友圈，可以是心情、生活分享、吐槽等。
3. 不要太长，通常在100字以内。
4. 直接返回内容文本，不要包含任何解释、引号或前缀后缀。`;

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
                    { role: 'user', content: '发一条朋友圈' }
                ],
                temperature: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content.trim();
        
        if ((content.startsWith('"') && content.endsWith('"')) || (content.startsWith('“') && content.endsWith('”'))) {
            content = content.slice(1, -1);
        }

        addMoment(contact.id, content);
        
        if (!isSilent) {
            alert('动态发布成功！');
            document.getElementById('chat-settings-screen').classList.add('hidden');
        }

    } catch (error) {
        console.error('AI生成动态失败:', error);
        if (!isSilent) alert('生成失败，请检查配置');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

function openAiMoments() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    renderPersonalMoments(window.iphoneSimState.currentChatContactId);
    document.getElementById('personal-moments-screen').classList.remove('hidden');
}

function handlePersonalMomentsBgUpload(e) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        contact.momentsBg = base64;
        const cover = document.getElementById('personal-moments-cover');
        if (cover) {
            cover.style.backgroundImage = `url(${contact.momentsBg})`;
        }
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function renderPersonalMoments(contactId) {
    const container = document.getElementById('personal-moments-container');
    if (!container) return;

    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const bg = contact.momentsBg || contact.profileBg || '';
    const name = contact.remark || contact.name;
    const avatar = contact.avatar;

    container.innerHTML = `
        <div class="moments-header">
            <div class="moments-cover" id="personal-moments-cover" style="background-image: url('${bg}'); background-color: ${bg ? 'transparent' : '#333'}; cursor: pointer;">
                <div class="moments-user-info">
                    <span class="moments-user-name">${name}</span>
                    <img class="moments-user-avatar" src="${avatar}">
                </div>
            </div>
        </div>
        <div class="moments-list" id="personal-moments-list-content">
            <!-- 动态列表 -->
        </div>
    `;

    document.getElementById('personal-moments-cover').addEventListener('click', () => {
        document.getElementById('personal-moments-bg-input').click();
    });

    const listContainer = document.getElementById('personal-moments-list-content');
    
    const personalMoments = window.iphoneSimState.moments.filter(m => m.contactId === contactId);
    
    const sortedMoments = [...personalMoments].sort((a, b) => b.time - a.time);

    if (sortedMoments.length === 0) {
        listContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">暂无动态</div>';
        return;
    }

    sortedMoments.forEach(moment => {
        const item = document.createElement('div');
        item.className = 'moment-item';
        
        let imagesHtml = '';
        if (moment.images && moment.images.length > 0) {
            const gridClass = moment.images.length === 1 ? 'single' : 'grid';
            imagesHtml = `<div class="moment-images ${gridClass}">
                ${moment.images.map((img, imgIndex) => {
                    const isVirtual = (typeof img === 'object' && img.isVirtual);
                    
                    if (isVirtual) {
                        const uniqueId = `moment-virtual-${moment.id}-${imgIndex}`;
                        const overlayId = `overlay-${uniqueId}`;
                        const cleanDesc = (img.desc || '').replace(/^\[图片描述\][:：]?\s*/, '');
                        
                        let displaySrc = window.iphoneSimState.defaultMomentVirtualImageUrl;
                        if (!displaySrc) {
                             displaySrc = img.src || window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                        }
                        
                        return `
                        <div class="virtual-image-container" style="position: relative; cursor: pointer; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; overflow: hidden; background-color: #f2f2f7;">
                            <img src="${displaySrc}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
                            <div class="virtual-image-overlay" style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px 10px 5px; box-sizing: border-box; pointer-events: none;">
                                <div style="font-size: 12px; color: #fff; line-height: 1.4; word-wrap: break-word; white-space: pre-wrap; text-align: left;">${cleanDesc}</div>
                            </div>
                        </div>
                        `;
                    } else {
                        const src = typeof img === 'string' ? img : img.src;
                        return `<img src="${src}" class="moment-img">`;
                    }
                }).join('')}
            </div>`;
        }

        let likesHtml = '';
        if (moment.likes && moment.likes.length > 0) {
            likesHtml = `<div class="moment-likes"><i class="far fa-heart"></i> ${moment.likes.join(', ')}</div>`;
        }

        let commentsHtml = '';
        if (moment.comments && moment.comments.length > 0) {
            commentsHtml = `<div class="moment-comments">
                ${moment.comments.map((c, index) => {
                    let displayName = c.user;
                    if (contactId !== 'me') {
                        const contact = window.iphoneSimState.contacts.find(cnt => cnt.id === contactId);
                        if (contact && contact.remark) {
                            if (c.user === contact.name || c.user === contact.nickname) {
                                displayName = contact.remark;
                            }
                        }
                    }

                    let userHtml = `<span class="comment-user">${displayName}</span>`;
                    if (c.replyTo) {
                        userHtml += `回复<span class="comment-user">${c.replyTo}</span>`;
                    }
                    return `<div class="comment-item" onclick="event.stopPropagation(); window.handleCommentClick(this, ${moment.id}, ${index}, '${c.user}')" style="display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; padding: 2px 4px; border-radius: 2px;">
                        <span style="flex: 1;">${userHtml}：<span class="comment-content">${c.content}</span></span>
                        <span class="comment-delete-btn" style="display: none; color: #576b95; margin-left: 8px; font-size: 12px; padding: 0 4px;">✕</span>
                    </div>`;
                }).join('')}
            </div>`;
        }

        let footerHtml = '';
        if (likesHtml || commentsHtml) {
            footerHtml = `<div class="moment-likes-comments">${likesHtml}${commentsHtml}</div>`;
        }

        const date = new Date(moment.time);
        const timeStr = `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;

        item.innerHTML = `
            <div style="width: 50px; font-size: 20px; font-weight: bold; text-align: right; margin-right: 10px; display: flex; flex-direction: row; align-items: baseline; justify-content: flex-end; line-height: 1.1; margin-top: -4px;">
                <div style="font-size: 24px; margin-right: 2px;">${date.getDate()}</div>
                <div style="font-size: 12px;">${date.getMonth() + 1}月</div>
            </div>
            <div class="moment-content">
                <div class="moment-text">${moment.content}</div>
                ${imagesHtml}
                <div class="moment-info">
                    <div style="display: flex; align-items: center;">
                        <span class="moment-time" style="display: none;">${timeStr}</span>
                    </div>
                    <div style="position: relative;">
                        <button class="moment-action-btn" onclick="window.toggleActionMenu(this, ${moment.id})"><i class="fas fa-ellipsis-h"></i></button>
                        <div class="action-menu" id="action-menu-${moment.id}">
                            <button class="action-menu-btn" onclick="window.toggleLike(${moment.id})"><i class="far fa-heart"></i> 赞</button>
                            <button class="action-menu-btn" onclick="window.showCommentInput(${moment.id})"><i class="far fa-comment"></i> 评论</button>
                        </div>
                    </div>
                </div>
                ${footerHtml}
            </div>
        `;
        
        listContainer.appendChild(item);
    });
}

// --- 个人资料功能 ---

function renderMeTab() {
    const container = document.getElementById('me-profile-container');
    if (!container) return;

    if (!window.iphoneSimState.userProfile) {
        window.iphoneSimState.userProfile = {
            name: 'User Name',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            bgImage: '',
            desc: '点击此处添加个性签名',
            wxid: 'wxid_123456'
        };
    }

    const { name, wxid, avatar, bgImage, desc } = window.iphoneSimState.userProfile;
    const bg = bgImage || '';

    container.innerHTML = `
        <div class="me-profile-card">
            <div class="me-bg" id="me-bg-trigger" style="background-image: url('${bg}'); background-color: ${bg ? 'transparent' : '#ccc'};"></div>
            <div class="me-info">
                <div class="me-avatar-row">
                    <img class="me-avatar" id="me-avatar-trigger" src="${avatar}">
                </div>
                <div class="me-name" id="me-name-trigger">${name}</div>
                <div class="me-id">微信号：<span id="me-id-trigger">${wxid}</span></div>
                <div class="me-desc" id="me-desc-trigger">${desc}</div>
            </div>
        </div>
        
        <div class="ios-list-group">
            <div class="list-item" id="open-wallet-btn" style="cursor: pointer;">
                <div class="list-content">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <i class="fas fa-wallet" style="color: #FF9500; font-size: 20px; width: 24px; text-align: center;"></i>
                        <label style="cursor: pointer;">钱包</label>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #ccc;"></i>
                </div>
            </div>
        </div>
    `;

    const avatarInput = document.getElementById('me-avatar-input');
    const bgInput = document.getElementById('me-bg-input');

    document.getElementById('me-avatar-trigger').addEventListener('click', () => avatarInput.click());
    document.getElementById('me-bg-trigger').addEventListener('click', () => bgInput.click());
    
    document.getElementById('open-wallet-btn').addEventListener('click', () => {
        renderWallet();
        document.getElementById('wallet-screen').classList.remove('hidden');
    });

    avatarInput.onchange = (e) => handleMeImageUpload(e, 'avatar');
    bgInput.onchange = (e) => handleMeImageUpload(e, 'bgImage');

    makeEditable('me-name-trigger', 'name');
    makeEditable('me-id-trigger', 'wxid');
    makeEditable('me-desc-trigger', 'desc');
}

function handleMeImageUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    
    const maxWidth = type === 'avatar' ? 300 : 800;
    compressImage(file, maxWidth, 0.7).then(base64 => {
        updateUserProfile(type, base64);
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function makeEditable(elementId, field) {
    const el = document.getElementById(elementId);
    el.addEventListener('click', () => {
        const currentText = el.textContent;
        const input = document.createElement(field === 'desc' ? 'textarea' : 'input');
        input.value = currentText === '点击此处添加个性签名' ? '' : currentText;
        input.className = 'editable-input';
        input.style.width = '100%';
        input.style.fontSize = 'inherit';
        input.style.fontFamily = 'inherit';
        
        el.replaceWith(input);
        input.focus();

        const save = () => {
            const newValue = input.value.trim();
            updateUserProfile(field, newValue);
        };

        input.addEventListener('blur', save);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && field !== 'desc') {
                save();
            }
        });
    });
}

function updateUserProfile(field, value) {
    if (!window.iphoneSimState.userProfile) {
        window.iphoneSimState.userProfile = {
            name: 'User Name',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            bgImage: '',
            momentsBgImage: '',
            desc: '点击此处添加个性签名',
            wxid: 'wxid_123456'
        };
    }
    
    if (field === 'desc' && !value) {
        value = '点击此处添加个性签名';
    }
    
    window.iphoneSimState.userProfile[field] = value;
    saveConfig();
    renderMeTab();
    renderMoments();
}

// --- 钱包功能 ---

function renderWallet() {
    const balanceEl = document.getElementById('wallet-balance');
    const transactionsEl = document.getElementById('wallet-transactions');
    
    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
    
    balanceEl.textContent = `¥${parseFloat(window.iphoneSimState.wallet.balance).toFixed(2)}`;
    
    transactionsEl.innerHTML = '';
    
    if (window.iphoneSimState.wallet.transactions.length === 0) {
        transactionsEl.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无交易记录</div>';
        return;
    }
    
    window.iphoneSimState.wallet.transactions.forEach(t => {
        const item = document.createElement('div');
        item.className = 'transaction-item';
        
        const date = new Date(t.time);
        const timeStr = `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        const isIncome = t.type === 'income';
        const amountClass = isIncome ? 'income' : 'expense';
        const amountPrefix = isIncome ? '+' : '-';
        
        item.innerHTML = `
            <div class="transaction-icon-simple">
                <i class="fas ${isIncome ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
            </div>
            <div class="transaction-details">
                <div class="transaction-title">${t.title}</div>
                <div class="transaction-time">${timeStr}</div>
            </div>
            <div class="transaction-amount ${amountClass}">${amountPrefix}${parseFloat(t.amount).toFixed(2)}</div>
        `;
        transactionsEl.appendChild(item);
    });
}

function handleRecharge() {
    let amount = 0;
    const inputAmount = document.getElementById('recharge-amount').value;
    
    if (inputAmount) {
        amount = parseFloat(inputAmount);
    }
    
    if (!amount || amount <= 0) {
        alert('请输入有效的充值金额');
        return;
    }
    
    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
    
    window.iphoneSimState.wallet.balance += amount;
    window.iphoneSimState.wallet.transactions.unshift({
        id: Date.now(),
        type: 'income',
        amount: amount,
        title: '余额充值',
        time: Date.now(),
        relatedId: null
    });
    
    saveConfig();
    renderWallet();
    document.getElementById('wallet-recharge-modal').classList.add('hidden');
    alert(`成功充值 ¥${amount.toFixed(2)}`);
}

function handleAiReturnTransfer(transferId) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    let amount = 0;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.type === 'transfer') {
            try {
                const data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                if (data.id === transferId) {
                    amount = parseFloat(data.amount);
                    break;
                }
            } catch (e) {}
        }
    }

    if (amount > 0) {
        if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
        window.iphoneSimState.wallet.balance += amount;
        window.iphoneSimState.wallet.transactions.unshift({
            id: Date.now(),
            type: 'income',
            amount: amount,
            title: '转账退回',
            time: Date.now(),
            relatedId: transferId
        });
        saveConfig();
    }
}

window.handleTransferClick = function(transferId, role) {
    if (!transferId) {
        alert('转账数据无效');
        return;
    }

    if (!window.iphoneSimState.currentChatContactId || !window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) return;
    
    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    let transferData = null;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.type === 'transfer') {
            try {
                const data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                if (data.id == transferId) {
                    transferData = data;
                    break;
                }
            } catch (e) {}
        }
    }

    if (!transferData) {
        console.error('未找到转账数据', transferId);
        alert('未找到该转账记录');
        return;
    }

    const status = (transferData.status || 'pending').toLowerCase();

    if (status !== 'pending') {
        let statusText = status;
        if (status === 'accepted') statusText = '已收款';
        if (status === 'returned') statusText = '已退还';
        
        alert(`该转账状态为: ${statusText}`);
        return;
    }

    const isMe = role === 'user';
    const actionSheet = document.createElement('div');
    actionSheet.className = 'modal';
    actionSheet.style.zIndex = '300';
    actionSheet.style.alignItems = 'flex-end';
    
    const amount = parseFloat(transferData.amount).toFixed(2);
    
    actionSheet.innerHTML = `
        <div class="modal-content" style="height: auto; border-radius: 12px 12px 0 0;">
            <div style="padding: 20px; text-align: center;">
                <div style="font-size: 14px; color: #666; margin-bottom: 5px;">${isMe ? '等待对方收款' : '收到转账'}</div>
                <div style="font-size: 32px; font-weight: bold; margin-bottom: 20px;">¥${amount}</div>
                <div style="font-size: 14px; color: #999; margin-bottom: 20px;">${transferData.remark}</div>
                
                ${!isMe ? `<button onclick="window.acceptTransfer(${transferData.id})" class="ios-btn-block" style="background-color: #07C160; margin-bottom: 10px;">确认收款</button>` : ''}
                ${!isMe ? `<button onclick="window.returnTransfer(${transferData.id})" class="ios-btn-block secondary" style="color: #FF3B30; margin-bottom: 10px;">退还转账</button>` : ''}
                <button onclick="this.closest('.modal').remove()" class="ios-btn-block secondary">取消</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(actionSheet);
    
    actionSheet.addEventListener('click', (e) => {
        if (e.target === actionSheet) actionSheet.remove();
    });
};

window.acceptTransfer = function(transferId) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    let amount = 0;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.type === 'transfer') {
            try {
                const data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                if (data.id === transferId) {
                    amount = parseFloat(data.amount);
                    break;
                }
            } catch (e) {}
        }
    }

    if (amount > 0) {
        if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
        window.iphoneSimState.wallet.balance += amount;
        window.iphoneSimState.wallet.transactions.unshift({
            id: Date.now(),
            type: 'income',
            amount: amount,
            title: '转账收款',
            time: Date.now(),
            relatedId: transferId
        });
        saveConfig();
    }

    updateTransferStatus(transferId, 'accepted');
    document.querySelector('.modal[style*="z-index: 300"]').remove();
    
    if (window.sendMessage) window.sendMessage('[系统消息]: 用户已收款', true, 'text'); 
};

window.returnTransfer = function(transferId) {
    updateTransferStatus(transferId, 'returned');
    document.querySelector('.modal[style*="z-index: 300"]').remove();
    
    if (window.sendMessage) window.sendMessage('[系统消息]: 转账已退还', true, 'text');
};

function updateTransferStatus(transferId, status) {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    let found = false;
    
    for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i];
        if (msg.type === 'transfer') {
            try {
                const data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                if (data.id === transferId) {
                    data.status = status;
                    msg.content = JSON.stringify(data);
                    found = true;
                    break;
                }
            } catch (e) {}
        }
    }
    
    if (found) {
        saveConfig();
        if (window.renderChatHistory) window.renderChatHistory(window.iphoneSimState.currentChatContactId);
    }
}

// --- 记忆功能 ---

function openMemoryApp() {
    if (!window.iphoneSimState.currentChatContactId) {
        alert('请先进入一个聊天窗口');
        return;
    }
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const memoryApp = document.getElementById('memory-app');
    
    renderMemoryList();
    memoryApp.classList.remove('hidden');
}

function handleSaveManualMemory() {
    const content = document.getElementById('manual-memory-content').value.trim();
    if (!content) {
        alert('请输入记忆内容');
        return;
    }

    if (!window.iphoneSimState.currentChatContactId) return;

    window.iphoneSimState.memories.push({
        id: Date.now(),
        contactId: window.iphoneSimState.currentChatContactId,
        content: content,
        time: Date.now()
    });
    saveConfig();
    renderMemoryList();
    document.getElementById('add-memory-modal').classList.add('hidden');
}

function openManualSummary() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    document.getElementById('total-chat-count').textContent = history.length;
    document.getElementById('summary-start-index').value = '';
    document.getElementById('summary-end-index').value = '';
    
    document.getElementById('manual-summary-modal').classList.remove('hidden');
}

async function handleManualSummary() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const start = parseInt(document.getElementById('summary-start-index').value);
    const end = parseInt(document.getElementById('summary-end-index').value);
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    
    if (isNaN(start) || isNaN(end) || start < 1 || end > history.length || start > end) {
        alert('请输入有效的楼层范围');
        return;
    }

    const messagesToSummarize = history.slice(start - 1, end);
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    const range = `${start}-${end}`;
    
    document.getElementById('manual-summary-modal').classList.add('hidden');
    showNotification('正在手动总结...');
    
    await generateSummary(contact, messagesToSummarize, range);
}

function openMemorySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    
    document.getElementById('modal-memory-send-limit').value = contact.memorySendLimit || '';
    document.getElementById('memory-settings-modal').classList.remove('hidden');
}

function handleSaveMemorySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    
    const limit = parseInt(document.getElementById('modal-memory-send-limit').value);
    contact.memorySendLimit = isNaN(limit) ? 0 : limit;
    
    saveConfig();
    document.getElementById('memory-settings-modal').classList.add('hidden');
    alert('设置已保存');
}

function renderMemoryList() {
    const list = document.getElementById('memory-list');
    const emptyState = document.getElementById('memory-empty');
    if (!list) return;

    list.innerHTML = '';
    
    if (!window.iphoneSimState.currentChatContactId) return;

    const contactMemories = window.iphoneSimState.memories.filter(m => m.contactId === window.iphoneSimState.currentChatContactId);
    
    if (contactMemories.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';

    const sortedMemories = [...contactMemories].sort((a, b) => b.time - a.time);

    sortedMemories.forEach(memory => {
        const item = document.createElement('div');
        item.className = 'memory-card';
        
        const date = new Date(memory.time);
        const timeStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        
        item.innerHTML = `
            <div class="memory-header">
                <span class="memory-time">${timeStr}</span>
                <div class="memory-actions">
                    <button class="memory-btn" onclick="window.editMemory(${memory.id})"><i class="fas fa-pen"></i></button>
                    <button class="memory-btn" onclick="window.deleteMemory(${memory.id})"><i class="fas fa-ellipsis-h"></i></button>
                </div>
            </div>
            <div class="memory-content">${memory.content}</div>
            ${memory.range ? `<div style="text-align: right; margin-top: 8px; font-size: 12px; color: #999;">${memory.range}</div>` : ''}
        `;
        list.appendChild(item);
    });
}

window.editMemory = function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;

    currentEditingMemoryId = id;
    document.getElementById('edit-memory-content').value = memory.content;
    document.getElementById('edit-memory-modal').classList.remove('hidden');
};

function handleSaveEditedMemory() {
    if (!currentEditingMemoryId) return;

    const content = document.getElementById('edit-memory-content').value.trim();
    if (!content) {
        alert('记忆内容不能为空');
        return;
    }

    const memory = window.iphoneSimState.memories.find(m => m.id === currentEditingMemoryId);
    if (memory) {
        memory.content = content;
        saveConfig();
        renderMemoryList();
        document.getElementById('edit-memory-modal').classList.add('hidden');
    }
    currentEditingMemoryId = null;
}

window.deleteMemory = function(id) {
    if (confirm('确定要删除这条记忆吗？')) {
        window.iphoneSimState.memories = window.iphoneSimState.memories.filter(m => m.id !== id);
        saveConfig();
        renderMemoryList();
    }
};

async function checkAndSummarize(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact || !contact.summaryLimit || contact.summaryLimit <= 0) return;

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    
    if (!contact.lastSummaryIndex) contact.lastSummaryIndex = 0;
    
    const newMessagesCount = history.length - contact.lastSummaryIndex;
    
    if (newMessagesCount >= contact.summaryLimit) {
        const messagesToSummarize = history.slice(contact.lastSummaryIndex);
        
        const startFloor = contact.lastSummaryIndex + 1;
        const endFloor = history.length;
        const range = `${startFloor}-${endFloor}`;

        contact.lastSummaryIndex = history.length;
        saveConfig();

        showNotification('正在总结...');
        await generateSummary(contact, messagesToSummarize, range);
    }
}

async function generateSummary(contact, messages, range) {
    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings;
    if (!settings.url || !settings.key) {
        console.log('未配置副API，无法自动总结');
        showNotification('未配置API', 2000);
        return;
    }

    const textMessages = messages.filter(m => m.type === 'text' && !m.content.startsWith('['));
    if (textMessages.length === 0) {
        document.getElementById('summary-notification').classList.add('hidden');
        return;
    }

    let userName = '用户';
    if (contact.userPersonaId) {
        const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
        if (p) userName = p.name;
    } else if (window.iphoneSimState.userProfile) {
        userName = window.iphoneSimState.userProfile.name;
    }

    const chatText = textMessages.map(m => `${m.role === 'user' ? userName : contact.name}: ${m.content}`).join('\n');

    const systemPrompt = `你是一个即时通讯软件的聊天记录总结助手。
请阅读以下聊天记录，并提取出其中重要的信息、事实、用户偏好或发生的事件，生成一条简练的“记忆”。
记忆应该是陈述句，包含关键信息。
请务必总结 ${userName} 和 ${contact.name} 聊天的具体内容，不要只总结重要信息。
如果聊天记录中没有值得记忆的重要信息（例如只是简单的问候或无意义的对话），请返回 "无"。
不要包含“聊天记录显示”、“用户说”等前缀，直接陈述事实。`;

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
                    { role: 'user', content: chatText }
                ],
                temperature: 0.5
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let summary = data.choices[0].message.content.trim();

        if (summary && summary !== '无' && summary !== '无。') {
            window.iphoneSimState.memories.push({
                id: Date.now(),
                contactId: contact.id,
                content: summary,
                time: Date.now(),
                range: range
            });
            saveConfig();
            
            if (!document.getElementById('memory-app').classList.contains('hidden')) {
                renderMemoryList();
            }
            
            showNotification('总结完成', 2000, 'success');
        } else {
            showNotification('未提取到重要信息', 2000);
        }

    } catch (error) {
        console.error('自动总结失败:', error);
        showNotification('总结出错', 2000);
    }
}

// --- 行程功能 ---

async function generateDailyItinerary(forceRefresh = false) {
    if (!window.iphoneSimState.currentChatContactId) {
        alert('请先进入一个聊天窗口');
        return;
    }

    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const today = new Date().toISOString().split('T')[0];
    
    if (!window.iphoneSimState.itineraries) window.iphoneSimState.itineraries = {};
    const storedItinerary = window.iphoneSimState.itineraries[contact.id];
    
    if (!forceRefresh) {
        if (storedItinerary && storedItinerary.generatedDate === today) {
            renderItinerary(storedItinerary.events);
            return;
        }
    }

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        alert('请先在设置中配置AI API');
        return;
    }

    const container = document.querySelector('.timeline-container');
    container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;"><i class="fas fa-spinner fa-spin"></i> 正在生成行程...</div>';
    
    const refreshBtn = document.getElementById('refresh-location-btn');
    if (refreshBtn) refreshBtn.classList.add('fa-spin');

    let worldbookContext = '';
    if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0 && contact.linkedWbCategories) {
        const activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled && contact.linkedWbCategories.includes(e.categoryId));
        if (activeEntries.length > 0) {
            worldbookContext = activeEntries.map(e => e.content).join('\n');
        }
    }

    let chatContext = '';
    const history = window.iphoneSimState.chatHistory[contact.id] || [];
    if (history.length > 0) {
        chatContext = history.slice(-10).map(m => `${m.role === 'user' ? '用户' : contact.name}: ${m.content}`).join('\n');
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const systemPrompt = `你是一个行程生成助手。请根据以下信息，生成${contact.name}今天从起床到现在的日常行程。`;
    const userPrompt = `角色设定：${contact.persona || '无'}
关联背景：${worldbookContext || '无'}
最近的对话：${chatContext || '无'}

请生成5-8个行程事件，每个事件包含时间段（如08:00-09:00）、地点（如家中、公司）和描述（约50字，第三人称叙述）。
重要要求：
1. 行程必须是连续的。
2. 最后一条行程的结束时间必须完全准确地是 ${currentTime} (现在的时间)。

请直接返回JSON数组格式，不要包含Markdown代码块标记。
JSON格式示例：
[
  {
    "time": "08:00-08:30",
    "location": "家中",
    "description": "起床洗漱..."
  }
]`;

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
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content.trim();
        
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let events = [];
        try {
            events = JSON.parse(content);
            if (!Array.isArray(events)) {
                if (events.events && Array.isArray(events.events)) {
                    events = events.events;
                } else {
                    throw new Error('返回格式不是数组');
                }
            }
        } catch (e) {
            console.error('JSON解析失败', e);
            alert('生成的数据格式有误，请重试');
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff3b30;">生成失败，请重试</div>';
            return;
        }

        const itineraryData = {
            generatedDate: today,
            events: events
        };
        window.iphoneSimState.itineraries[contact.id] = itineraryData;
        saveConfig();

        renderItinerary(events);

    } catch (error) {
        console.error('生成行程失败:', error);
        alert(`生成失败: ${error.message}`);
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff3b30;">生成失败，请检查网络或配置</div>';
    } finally {
        if (refreshBtn) refreshBtn.classList.remove('fa-spin');
    }
}

async function generateNewItinerary(contact) {
    if (!contact) return;
    if (contact.isGeneratingItinerary) return;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) return;

    contact.isGeneratingItinerary = true;
    showItineraryNotification('正在生成行程...');

    const today = new Date().toISOString().split('T')[0];
    
    if (!window.iphoneSimState.itineraries) window.iphoneSimState.itineraries = {};
    const storedItinerary = window.iphoneSimState.itineraries[contact.id];
    
    let existingEvents = [];
    if (storedItinerary && storedItinerary.generatedDate === today) {
        existingEvents = storedItinerary.events || [];
    }

    let worldbookContext = '';
    if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0 && contact.linkedWbCategories) {
        const activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled && contact.linkedWbCategories.includes(e.categoryId));
        if (activeEntries.length > 0) {
            worldbookContext = activeEntries.map(e => e.content).join('\n');
        }
    }

    let chatContext = '';
    const history = window.iphoneSimState.chatHistory[contact.id] || [];
    const newMessages = history.slice(contact.lastItineraryIndex || 0);
    if (newMessages.length > 0) {
        chatContext = newMessages.map(m => `${m.role === 'user' ? '用户' : contact.name}: ${m.content}`).join('\n');
    } else {
        chatContext = history.slice(-5).map(m => `${m.role === 'user' ? '用户' : contact.name}: ${m.content}`).join('\n');
    }

    let lastEventTime = "09:00";
    if (existingEvents.length > 0) {
        const sortedEvents = [...existingEvents].sort((a, b) => {
            const timeA = a.time.split('-')[0];
            const timeB = b.time.split('-')[0];
            return timeA.localeCompare(timeB);
        });
        const lastEvent = sortedEvents[sortedEvents.length - 1];
        if (lastEvent && lastEvent.time) {
            lastEventTime = lastEvent.time.split('-')[1] || lastEvent.time.split('-')[0];
        }
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const systemPrompt = `你是一个行程生成助手。请根据以下信息，为${contact.name}生成一条新的行程事件。`;
    const userPrompt = `角色设定：${contact.persona || '无'}
关联背景：${worldbookContext || '无'}
最近的对话：${chatContext || '无'}
上一条行程结束时间：${lastEventTime}
现在时间：${currentTime}

请生成 1 条新的行程事件，接续在上一条行程之后。
包含时间段（如${lastEventTime}-${currentTime}）、地点和描述（约30字，第三人称叙述）。
重要要求：结束时间必须完全准确地是 ${currentTime}。

请直接返回JSON对象格式（不是数组），不要包含Markdown代码块标记。
JSON格式示例：
{
  "time": "10:00-10:30",
  "location": "公司",
  "description": "到达公司开始工作..."
}`;

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
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content.trim();
        
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let newEvent = null;
        try {
            newEvent = JSON.parse(content);
            if (Array.isArray(newEvent)) {
                newEvent = newEvent[0];
            }
        } catch (e) {
            console.error('JSON解析失败', e);
            return;
        }

        if (newEvent) {
            newEvent.generatedAt = Date.now();
            
            existingEvents.push(newEvent);
            
            window.iphoneSimState.itineraries[contact.id] = {
                generatedDate: today,
                events: existingEvents
            };

            contact.lastItineraryIndex = history.length;
            contact.messagesSinceLastItinerary = 0;
            saveConfig();

            if (window.iphoneSimState.currentChatContactId === contact.id && !document.getElementById('location-app').classList.contains('hidden')) {
                renderItinerary(existingEvents);
            }
            
            showItineraryNotification('行程生成成功', 2000, 'success');
        }

    } catch (error) {
        console.error('生成新行程失败:', error);
        showItineraryNotification('生成失败', 2000, 'error');
    } finally {
        contact.isGeneratingItinerary = false;
    }
}

function renderItinerary(events) {
    const container = document.querySelector('.timeline-container');
    if (!container) return;

    container.innerHTML = '';

    if (!events || events.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无行程</div>';
        return;
    }

    events.sort((a, b) => {
        const timeA = a.time.split('-')[0];
        const timeB = b.time.split('-')[0];
        return timeA.localeCompare(timeB);
    });

    events.reverse().forEach(event => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        
        const startTime = event.time.split('-')[0].trim();
        
        let generatedTimeHtml = '';
        if (event.generatedAt) {
            const genDate = new Date(event.generatedAt);
            const genTimeStr = `${genDate.getHours()}:${genDate.getMinutes().toString().padStart(2, '0')}`;
            generatedTimeHtml = `<div style="font-size: 10px; color: #ccc; margin-top: 5px; text-align: right;">生成于 ${genTimeStr}</div>`;
        }

        item.innerHTML = `
            <div class="timeline-time">${startTime}</div>
            <div class="timeline-content">
                <div class="timeline-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</div>
                <div style="font-size: 12px; color: #888; margin-bottom: 5px;">${event.time}</div>
                <div class="timeline-desc">${event.description}</div>
                ${generatedTimeHtml}
            </div>
        `;
        container.appendChild(item);
    });
}

function openLocationApp() {
    const locationApp = document.getElementById('location-app');
    locationApp.classList.remove('hidden');
    document.getElementById('chat-more-panel').classList.add('hidden');
    
    generateDailyItinerary();
}

function openItinerarySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    document.getElementById('auto-itinerary-toggle').checked = contact.autoItineraryEnabled || false;
    document.getElementById('auto-itinerary-interval').value = contact.autoItineraryInterval || 10;
    
    document.getElementById('itinerary-settings-modal').classList.remove('hidden');
}

function handleSaveItinerarySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const enabled = document.getElementById('auto-itinerary-toggle').checked;
    const interval = parseInt(document.getElementById('auto-itinerary-interval').value);

    contact.autoItineraryEnabled = enabled;
    contact.autoItineraryInterval = isNaN(interval) || interval < 1 ? 10 : interval;

    saveConfig();
    document.getElementById('itinerary-settings-modal').classList.add('hidden');
    alert('行程设置已保存');
}

async function getCurrentItineraryInfo(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return '';
    
    const today = new Date().toISOString().split('T')[0];
    
    try {
        if (!window.iphoneSimState.itineraries) return '';
        const itinerary = window.iphoneSimState.itineraries[contactId];
        
        if (!itinerary || itinerary.generatedDate !== today || !itinerary.events || !Array.isArray(itinerary.events) || itinerary.events.length === 0) {
            return '';
        }
        
        const sortedEvents = [...itinerary.events].sort((a, b) => {
            const timeA = a.time.split('-')[0].trim();
            const timeB = b.time.split('-')[0].trim();
            return timeA.localeCompare(timeB);
        });
        
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        
        let currentEvent = null;
        let nextEvent = null;
        let allEventsText = '';
        
        for (let i = 0; i < sortedEvents.length; i++) {
            const event = sortedEvents[i];
            const [startStr, endStr] = event.time.split('-');
            const [startHour, startMinute] = startStr.trim().split(':').map(Number);
            const [endHour, endMinute] = endStr.trim().split(':').map(Number);
            
            const startTimeInMinutes = startHour * 60 + startMinute;
            const endTimeInMinutes = endHour * 60 + endMinute;
            
            allEventsText += `${event.time} ${event.location}：${event.description}\n`;
            
            if (currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes <= endTimeInMinutes) {
                currentEvent = event;
            }
            
            if (currentTimeInMinutes < startTimeInMinutes && !nextEvent) {
                nextEvent = event;
            }
        }
        
        let info = '【今日行程安排】\n';
        info += allEventsText;
        
        if (currentEvent) {
            info += `\n【当前状态】\n根据时间安排，我现在（${currentHour}:${currentMinute.toString().padStart(2, '0')}）正在${currentEvent.location}，进行：${currentEvent.description}\n`;
        } else if (nextEvent) {
            const [nextHour, nextMinute] = nextEvent.time.split('-')[0].trim().split(':').map(Number);
            const timeUntilNext = nextHour * 60 + nextMinute - currentTimeInMinutes;
            
            if (timeUntilNext > 0) {
                info += `\n【当前状态】\n现在时间是${currentHour}:${currentMinute.toString().padStart(2, '0')}，距离下一个行程（${nextEvent.time} ${nextEvent.location}）还有大约${Math.floor(timeUntilNext/60)}小时${timeUntilNext%60}分钟。\n`;
            }
        } else {
            info += `\n【当前状态】\n今天的行程已经全部结束了。\n`;
        }
        
        return info;
    } catch (error) {
        console.error('解析行程信息失败:', error);
        return '';
    }
}

// --- 音乐功能 ---

function initMusicWidget() {
    const bgMusicAudio = document.getElementById('bg-music');
    if (window.iphoneSimState.music) {
        updateMusicUI();
        if (window.iphoneSimState.music.src) {
            bgMusicAudio.src = window.iphoneSimState.music.src;
        }
    }
    
    bgMusicAudio.addEventListener('timeupdate', syncLyrics);
    bgMusicAudio.addEventListener('ended', () => {
        window.iphoneSimState.music.playing = false;
        updateMusicUI();
    });
}

function openMusicSettings() {
    const coverPreview = document.getElementById('music-cover-preview');
    if (coverPreview && window.iphoneSimState.music.cover) {
        coverPreview.innerHTML = `<img src="${window.iphoneSimState.music.cover}" style="width: 100%; height: 100%; object-fit: cover;">`;
    }

    const bgPreview = document.getElementById('music-widget-bg-preview');
    if (bgPreview) {
        if (window.iphoneSimState.music.widgetBg) {
            bgPreview.innerHTML = `<img src="${window.iphoneSimState.music.widgetBg}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } else {
            bgPreview.innerHTML = '<i class="fas fa-image"></i>';
        }
    }

    resetMusicUploadForm();
    renderMusicPlaylist();
    switchMusicTab('list');

    document.getElementById('music-settings-modal').classList.remove('hidden');
}

function switchMusicTab(tab) {
    const listTab = document.getElementById('tab-music-list');
    const uploadTab = document.getElementById('tab-music-upload');
    const listView = document.getElementById('music-view-list');
    const uploadView = document.getElementById('music-view-upload');
    const indicator = document.getElementById('music-nav-indicator');

    if (tab === 'list') {
        listTab.classList.add('active');
        uploadTab.classList.remove('active');
        
        listView.style.display = 'block';
        uploadView.style.display = 'none';
        
        void listView.offsetWidth;
        
        listView.classList.add('active');
        uploadView.classList.remove('active');
        
        indicator.style.transform = 'translateX(0)';
    } else {
        listTab.classList.remove('active');
        uploadTab.classList.add('active');
        
        listView.style.display = 'none';
        uploadView.style.display = 'block';
        
        void uploadView.offsetWidth;
        
        listView.classList.remove('active');
        uploadView.classList.add('active');
        
        indicator.style.transform = 'translateX(100%)';
    }
}

function resetMusicUploadForm() {
    document.getElementById('input-song-title').value = '';
    document.getElementById('input-artist-name').value = '';
    document.getElementById('music-url-input').value = '';
    document.getElementById('music-file-upload').value = '';
    document.getElementById('lyrics-file-upload').value = '';
    document.getElementById('lyrics-status').textContent = '未选择文件';
    
    window.iphoneSimState.tempMusicSrc = null;
    window.iphoneSimState.tempLyricsData = null;
    window.iphoneSimState.tempLyricsFile = null;
}

function handleMusicCoverUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 300, 0.7).then(base64 => {
        const preview = document.getElementById('music-cover-preview');
        if (preview) {
            preview.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
        window.iphoneSimState.tempMusicCover = base64;
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
}

function handleMusicWidgetBgUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        const preview = document.getElementById('music-widget-bg-preview');
        if (preview) {
            preview.innerHTML = `<img src="${base64}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
        window.iphoneSimState.tempMusicWidgetBg = base64;
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
}

function handleMusicFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        window.iphoneSimState.tempMusicSrc = event.target.result;
        alert('音乐文件已选择，点击保存生效');
    };
    reader.readAsDataURL(file);
}

function handleLyricsUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const lrcContent = event.target.result;
        const parsedLyrics = parseLRC(lrcContent);
        
        if (parsedLyrics.length > 0) {
            window.iphoneSimState.tempLyricsData = parsedLyrics;
            window.iphoneSimState.tempLyricsFile = file.name;
            document.getElementById('lyrics-status').textContent = `已选择: ${file.name}`;
        } else {
            alert('歌词解析失败，请检查文件格式');
        }
    };
    reader.readAsText(file);
}

function parseLRC(lrc) {
    const lines = lrc.split('\n');
    const result = [];
    const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/;

    lines.forEach(line => {
        const match = timeRegex.exec(line);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0;
            const time = minutes * 60 + seconds + milliseconds / 1000;
            const text = line.replace(timeRegex, '').trim();
            
            if (text) {
                result.push({ time, text });
            }
        }
    });

    return result.sort((a, b) => a.time - b.time);
}

function saveMusicAppearance() {
    if (window.iphoneSimState.tempMusicCover) {
        window.iphoneSimState.music.cover = window.iphoneSimState.tempMusicCover;
        delete window.iphoneSimState.tempMusicCover;
    }

    if (window.iphoneSimState.tempMusicWidgetBg) {
        window.iphoneSimState.music.widgetBg = window.iphoneSimState.tempMusicWidgetBg;
        delete window.iphoneSimState.tempMusicWidgetBg;
    }

    updateMusicUI();
    saveConfig();
    alert('外观设置已保存');
}

function saveNewSong() {
    const title = document.getElementById('input-song-title').value.trim();
    const artist = document.getElementById('input-artist-name').value.trim();
    const urlInput = document.getElementById('music-url-input').value.trim();

    if (!title) {
        alert('请输入歌名');
        return;
    }

    let src = '';
    if (window.iphoneSimState.tempMusicSrc) {
        src = window.iphoneSimState.tempMusicSrc;
    } else if (urlInput) {
        src = urlInput;
    } else {
        alert('请上传音乐文件或输入URL');
        return;
    }

    const newSong = {
        id: Date.now(),
        title: title,
        artist: artist || '未知歌手',
        src: src,
        lyricsData: window.iphoneSimState.tempLyricsData || [],
        lyricsFile: window.iphoneSimState.tempLyricsFile || ''
    };

    if (!window.iphoneSimState.music.playlist) window.iphoneSimState.music.playlist = [];
    window.iphoneSimState.music.playlist.push(newSong);
    
    playSong(newSong.id);
    
    saveConfig();
    
    resetMusicUploadForm();
    switchMusicTab('list');
    renderMusicPlaylist();
}

function renderMusicPlaylist() {
    const list = document.getElementById('music-playlist');
    const emptyState = document.getElementById('music-empty-state');
    if (!list) return;

    list.innerHTML = '';

    if (!window.iphoneSimState.music.playlist || window.iphoneSimState.music.playlist.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    window.iphoneSimState.music.playlist.forEach(song => {
        const item = document.createElement('div');
        item.className = 'list-item';
        const isPlaying = window.iphoneSimState.music.currentSongId === song.id;
        
        item.innerHTML = `
            <div class="list-content column" style="flex: 1;">
                <div style="font-weight: bold; font-size: 16px; ${isPlaying ? 'color: #007AFF;' : ''}">${song.title}</div>
                <div style="font-size: 12px; color: #888;">${song.artist}</div>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button class="ios-btn-small" onclick="window.playSong(${song.id})" style="${isPlaying ? 'background-color: #007AFF;' : ''}">${isPlaying ? '播放中' : '播放'}</button>
                <button class="ios-btn-small danger" onclick="window.deleteSong(${song.id})">删除</button>
            </div>
        `;
        list.appendChild(item);
    });
}

window.playSong = function(id) {
    const song = window.iphoneSimState.music.playlist.find(s => s.id === id);
    if (!song) return;

    window.iphoneSimState.music.currentSongId = id;
    window.iphoneSimState.music.title = song.title;
    window.iphoneSimState.music.artist = song.artist;
    window.iphoneSimState.music.src = song.src;
    window.iphoneSimState.music.lyricsData = song.lyricsData;
    window.iphoneSimState.music.lyricsFile = song.lyricsFile;
    
    const bgMusicAudio = document.getElementById('bg-music');
    bgMusicAudio.src = song.src;
    
    bgMusicAudio.play().then(() => {
        window.iphoneSimState.music.playing = true;
        updateMusicUI();
        renderMusicPlaylist();
    }).catch(err => {
        console.error('播放失败:', err);
        alert('播放失败');
    });
    
    saveConfig();
};

window.deleteSong = function(id) {
    if (confirm('确定要删除这首歌吗？')) {
        window.iphoneSimState.music.playlist = window.iphoneSimState.music.playlist.filter(s => s.id !== id);
        if (window.iphoneSimState.music.currentSongId === id) {
            window.iphoneSimState.music.currentSongId = null;
        }
        saveConfig();
        renderMusicPlaylist();
    }
};

function toggleMusicPlay() {
    if (!window.iphoneSimState.music.src) {
        alert('请先设置音乐源');
        return;
    }

    const bgMusicAudio = document.getElementById('bg-music');
    if (bgMusicAudio.paused) {
        bgMusicAudio.play().then(() => {
            window.iphoneSimState.music.playing = true;
            updateMusicUI();
        }).catch(err => {
            console.error('播放失败:', err);
            alert('播放失败，可能是浏览器限制自动播放，请尝试手动点击播放。');
        });
    } else {
        bgMusicAudio.pause();
        window.iphoneSimState.music.playing = false;
        updateMusicUI();
    }
}

function updateMusicUI() {
    const widget = document.getElementById('music-widget');
    const cover = document.getElementById('vinyl-cover');
    const disk = document.getElementById('vinyl-disk');
    const title = document.getElementById('song-title');
    const artist = document.getElementById('artist-name');
    const lyricsContainer = document.getElementById('lyrics-display');
    const playIcon = document.getElementById('play-icon');

    if (widget && window.iphoneSimState.music.widgetBg) {
        widget.style.backgroundImage = `url('${window.iphoneSimState.music.widgetBg}')`;
        widget.style.backgroundSize = 'cover';
        widget.style.backgroundPosition = 'center';
    } else if (widget) {
        widget.style.backgroundImage = '';
    }

    if (cover) cover.style.backgroundImage = `url('${window.iphoneSimState.music.cover}')`;
    if (title) title.textContent = window.iphoneSimState.music.title;
    if (artist) artist.textContent = window.iphoneSimState.music.artist;
    
    if (lyricsContainer) {
        let html = '<div class="lyrics-scroll-container" id="lyrics-scroll">';
        if (window.iphoneSimState.music.lyricsData && window.iphoneSimState.music.lyricsData.length > 0) {
            window.iphoneSimState.music.lyricsData.forEach((line, index) => {
                html += `<div class="lyric-line" data-time="${line.time}" data-index="${index}">${line.text}</div>`;
            });
        } else {
            html += '<div class="lyric-line">暂无歌词</div>';
        }
        html += '</div>';
        lyricsContainer.innerHTML = html;
    }

    if (window.iphoneSimState.music.playing) {
        if (disk) disk.classList.add('playing');
        if (playIcon) {
            playIcon.className = 'fas fa-pause';
        }
    } else {
        if (disk) disk.classList.remove('playing');
        if (playIcon) {
            playIcon.className = 'fas fa-play';
        }
    }
}

function syncLyrics() {
    const bgMusicAudio = document.getElementById('bg-music');
    const currentTime = bgMusicAudio.currentTime;
    const lyricsData = window.iphoneSimState.music.lyricsData;
    
    if (!lyricsData || lyricsData.length === 0) return;

    let activeIndex = -1;
    for (let i = 0; i < lyricsData.length; i++) {
        if (currentTime >= lyricsData[i].time) {
            activeIndex = i;
        } else {
            break;
        }
    }

    if (activeIndex !== -1) {
        const scrollContainer = document.getElementById('lyrics-scroll');
        const lines = document.querySelectorAll('.lyric-line');
        
        lines.forEach(line => line.classList.remove('active'));
        
        if (lines[activeIndex]) {
            lines[activeIndex].classList.add('active');
            
            const lineHeight = 20;
            if (scrollContainer) {
                scrollContainer.style.transform = `translateY(-${activeIndex * lineHeight}px)`;
            }
        }
    }
}

// --- 拍立得功能 ---

function initPolaroidWidget() {
    const polaroidImg1 = document.getElementById('polaroid-img-1');
    const polaroidText1 = document.getElementById('polaroid-text-1');
    const polaroidImg2 = document.getElementById('polaroid-img-2');
    const polaroidText2 = document.getElementById('polaroid-text-2');

    if (window.iphoneSimState.polaroid) {
        if (polaroidImg1) polaroidImg1.src = window.iphoneSimState.polaroid.img1;
        if (polaroidText1) polaroidText1.textContent = window.iphoneSimState.polaroid.text1;
        if (polaroidImg2) polaroidImg2.src = window.iphoneSimState.polaroid.img2;
        if (polaroidText2) polaroidText2.textContent = window.iphoneSimState.polaroid.text2;
    }
}

function handlePolaroidImageUpload(e, index) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 600, 0.7).then(base64 => {
        if (index === 1) {
            window.iphoneSimState.polaroid.img1 = base64;
            document.getElementById('polaroid-img-1').src = base64;
        } else {
            window.iphoneSimState.polaroid.img2 = base64;
            document.getElementById('polaroid-img-2').src = base64;
        }
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function handlePolaroidTextEdit(index) {
    const currentText = index === 1 ? window.iphoneSimState.polaroid.text1 : window.iphoneSimState.polaroid.text2;
    const newText = prompt('请输入文字：', currentText);
    
    if (newText !== null) {
        if (index === 1) {
            window.iphoneSimState.polaroid.text1 = newText;
            document.getElementById('polaroid-text-1').textContent = newText;
        } else {
            window.iphoneSimState.polaroid.text2 = newText;
            document.getElementById('polaroid-text-2').textContent = newText;
        }
        saveConfig();
    }
}

// --- 表情包系统 ---

function initStickerSystem() {
    const stickerBtn = document.getElementById('sticker-btn');
    if (stickerBtn) {
        const newBtn = stickerBtn.cloneNode(true);
        stickerBtn.parentNode.replaceChild(newBtn, stickerBtn);
        
        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleStickerPanel();
        });
    }

    const manageBtn = document.getElementById('sticker-manage-btn');
    if (manageBtn) {
        const newManageBtn = manageBtn.cloneNode(true);
        manageBtn.parentNode.replaceChild(newManageBtn, manageBtn);
        newManageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (window.iphoneSimState.isStickerManageMode) {
                toggleStickerManageMode();
            } else {
                document.getElementById('sticker-options-modal').classList.remove('hidden');
            }
        });
    }

    const optionsModal = document.getElementById('sticker-options-modal');

    if (optionsModal) {
        const newOptionsModal = optionsModal.cloneNode(true);
        optionsModal.parentNode.replaceChild(newOptionsModal, optionsModal);
        
        const optManage = newOptionsModal.querySelector('#sticker-opt-manage');
        const optImport = newOptionsModal.querySelector('#sticker-opt-import');
        const optCancel = newOptionsModal.querySelector('#sticker-opt-cancel');

        newOptionsModal.addEventListener('click', (e) => {
            if (e.target === newOptionsModal) {
                newOptionsModal.classList.add('hidden');
            }
            e.stopPropagation();
        });

        if (optManage) {
            optManage.addEventListener('click', (e) => {
                e.stopPropagation();
                newOptionsModal.classList.add('hidden');
                toggleStickerManageMode();
            });
        }

        if (optImport) {
            optImport.addEventListener('click', (e) => {
                e.stopPropagation();
                newOptionsModal.classList.add('hidden');
                document.getElementById('sticker-category-name').value = '';
                document.getElementById('sticker-import-text').value = '';
                
                // Clear stale JSON data
                window.iphoneSimState.tempStickerJson = null;
                document.getElementById('sticker-import-json').value = '';
                const status = document.getElementById('sticker-json-status');
                if (status) status.textContent = '未选择文件';

                document.getElementById('import-sticker-modal').classList.remove('hidden');
            });
        }

        const optDeleteCats = newOptionsModal.querySelector('#sticker-opt-deletecats');
        if (optDeleteCats) {
            optDeleteCats.addEventListener('click', (e) => {
                e.stopPropagation();
                newOptionsModal.classList.add('hidden');
                renderStickerCategoryDeleteModal();
            });
        }

        if (optCancel) {
            optCancel.addEventListener('click', (e) => {
                e.stopPropagation();
                newOptionsModal.classList.add('hidden');
            });
        }
    }

    const importBtn = document.getElementById('sticker-import-btn-action');
    if (importBtn) {
        const newImportBtn = importBtn.cloneNode(true);
        importBtn.parentNode.replaceChild(newImportBtn, importBtn);

        newImportBtn.addEventListener('click', () => {
            document.getElementById('sticker-category-name').value = '';
            document.getElementById('sticker-import-text').value = '';
            
            // Clear stale JSON data
            window.iphoneSimState.tempStickerJson = null;
            document.getElementById('sticker-import-json').value = '';
            const status = document.getElementById('sticker-json-status');
            if (status) status.textContent = '未选择文件';

            document.getElementById('import-sticker-modal').classList.remove('hidden');
        });
    }

    const selectAllBtn = document.getElementById('sticker-select-all-btn');
    if (selectAllBtn) {
        const newSelectAllBtn = selectAllBtn.cloneNode(true);
        selectAllBtn.parentNode.replaceChild(newSelectAllBtn, selectAllBtn);
        newSelectAllBtn.addEventListener('click', toggleSelectAllStickers);
    }

    const deleteBtn = document.getElementById('sticker-delete-btn');
    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        newDeleteBtn.addEventListener('click', deleteSelectedStickers);
    }

    const exportBtn = document.getElementById('sticker-export-btn');
    if (exportBtn) {
        const newExportBtn = exportBtn.cloneNode(true);
        exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
        newExportBtn.addEventListener('click', handleExportStickers);
    }

    const closeImportBtn = document.getElementById('close-import-sticker');
    if (closeImportBtn) {
        const newCloseImportBtn = closeImportBtn.cloneNode(true);
        closeImportBtn.parentNode.replaceChild(newCloseImportBtn, closeImportBtn);
        newCloseImportBtn.addEventListener('click', () => {
            document.getElementById('import-sticker-modal').classList.add('hidden');
        });
    }

    const saveImportBtn = document.getElementById('save-sticker-import-btn');
    if (saveImportBtn) {
        const newSaveImportBtn = saveImportBtn.cloneNode(true);
        saveImportBtn.parentNode.replaceChild(newSaveImportBtn, saveImportBtn);
        newSaveImportBtn.addEventListener('click', handleImportStickers);
    }

    const searchInput = document.getElementById('sticker-search-input');
    if (searchInput) {
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        newSearchInput.addEventListener('input', (e) => {
            renderStickerList(e.target.value);
        });
    }

    const stickerJsonInput = document.getElementById('sticker-import-json');
    if (stickerJsonInput) {
        const newStickerJsonInput = stickerJsonInput.cloneNode(true);
        stickerJsonInput.parentNode.replaceChild(newStickerJsonInput, stickerJsonInput);
        newStickerJsonInput.addEventListener('change', handleStickerJsonUpload);
    }

    renderStickerTabs();
    renderStickerList();
}

function handleStickerJsonUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            window.iphoneSimState.tempStickerJson = data;
            const status = document.getElementById('sticker-json-status');
            if (status) status.textContent = `已加载: ${file.name}`;
            
            // Auto-fill category name if present in JSON and input is empty
            const nameInput = document.getElementById('sticker-category-name');
            if (nameInput && !nameInput.value && data.name) {
                nameInput.value = data.name;
            }
        } catch (err) {
            console.error('JSON Parse Error:', err);
            alert('JSON 文件格式错误');
            const status = document.getElementById('sticker-json-status');
            if (status) status.textContent = '解析失败';
            window.iphoneSimState.tempStickerJson = null;
        }
    };
    reader.readAsText(file);
}

function toggleStickerPanel() {
    const panel = document.getElementById('sticker-panel');
    const chatMorePanel = document.getElementById('chat-more-panel');
    const chatInputArea = document.querySelector('.chat-input-area');
    
    if (panel.classList.contains('slide-in')) {
        panel.classList.remove('slide-in');
        if (chatInputArea) chatInputArea.classList.remove('push-up');
        
        if (window.iphoneSimState.isStickerManageMode) {
            toggleStickerManageMode();
        }
    } else {
        panel.classList.remove('hidden');
        panel.classList.add('slide-in');
        
        if (chatMorePanel) chatMorePanel.classList.remove('slide-in');
        
        if (chatInputArea) chatInputArea.classList.add('push-up');
        
        if (window.scrollToBottom) window.scrollToBottom();
        renderStickerTabs();
        renderStickerList();
    }
}

function handleImportStickers() {
    const name = document.getElementById('sticker-category-name').value.trim();
    const text = document.getElementById('sticker-import-text').value.trim();
    const jsonData = window.iphoneSimState.tempStickerJson;

    let stickers = [];
    let catName = name;

    if (jsonData) {
        let rawStickers = [];
        if (Array.isArray(jsonData)) {
            rawStickers = jsonData;
        } else if (jsonData.list && Array.isArray(jsonData.list)) {
            rawStickers = jsonData.list;
            if (!catName && jsonData.name) catName = jsonData.name;
        }

        stickers = rawStickers.filter(s => s.url && s.desc).map(s => ({ desc: s.desc, url: s.url }));
        
        if (stickers.length === 0) {
            alert('JSON中未找到有效的表情包数据 (需包含 url 和 desc)');
            return;
        }
    } else {
        if (!text) {
            alert('请输入表情包数据');
            return;
        }

        const lines = text.split('\n');
        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            let parts = line.split(/[:：]/);
            if (parts.length >= 2) {
                const desc = parts[0].trim();
                const url = parts.slice(1).join(':').trim();
                if (url) {
                    stickers.push({ desc, url });
                }
            }
        });

        if (stickers.length === 0) {
            alert('未能解析出有效的表情包数据，请检查格式');
            return;
        }
    }

    if (!catName) {
        alert('请输入分类名称');
        return;
    }

    const existingCategory = window.iphoneSimState.stickerCategories.find(c => c.name === catName);

    if (existingCategory) {
        existingCategory.list.push(...stickers);
        window.iphoneSimState.currentStickerCategoryId = existingCategory.id;
        alert(`已合并到现有分类 "${catName}"，新增 ${stickers.length} 个表情`);
    } else {
        const newCategory = {
            id: Date.now(),
            name: catName,
            list: stickers
        };
        window.iphoneSimState.stickerCategories.push(newCategory);
        window.iphoneSimState.currentStickerCategoryId = newCategory.id;
        alert(`成功导入 ${stickers.length} 个表情包`);
    }
    
    saveConfig();
    renderStickerTabs();
    renderStickerList();
    
    document.getElementById('import-sticker-modal').classList.add('hidden');
    
    if (jsonData) {
        window.iphoneSimState.tempStickerJson = null;
        document.getElementById('sticker-import-json').value = '';
        const status = document.getElementById('sticker-json-status');
        if (status) status.textContent = '未选择文件';
    }
}

function renderStickerTabs() {
    const container = document.getElementById('sticker-tabs-container');
    if (!container) return;

    let indicator = container.querySelector('.tab-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'tab-indicator';
        container.appendChild(indicator);
    }

    const oldTabs = container.querySelectorAll('.sticker-tab');
    oldTabs.forEach(t => t.remove());

    const allTab = document.createElement('div');
    allTab.className = `sticker-tab ${window.iphoneSimState.currentStickerCategoryId === 'all' ? 'active' : ''}`;
    allTab.textContent = '全部';
    allTab.onclick = (e) => {
        e.stopPropagation();
        window.iphoneSimState.currentStickerCategoryId = 'all';
        updateTabState(container, allTab);
    };
    container.appendChild(allTab);

    window.iphoneSimState.stickerCategories.forEach(cat => {
        const tab = document.createElement('div');
        tab.className = `sticker-tab ${window.iphoneSimState.currentStickerCategoryId === cat.id ? 'active' : ''}`;
        tab.textContent = cat.name;
        tab.onclick = (e) => {
            e.stopPropagation();
            window.iphoneSimState.currentStickerCategoryId = cat.id;
            updateTabState(container, tab);
        };
        container.appendChild(tab);
    });

    setTimeout(() => updateTabIndicator(), 50);
}

function updateTabState(container, activeTab) {
    const tabs = container.querySelectorAll('.sticker-tab');
    tabs.forEach(t => t.classList.remove('active'));
    activeTab.classList.add('active');
    
    updateTabIndicator();
    document.getElementById('sticker-search-input').value = '';
    if (window.iphoneSimState.isStickerManageMode) {
        toggleStickerManageMode();
    }
    renderStickerList();
}

function updateTabIndicator() {
    const container = document.getElementById('sticker-tabs-container');
    if (!container) return;
    
    const activeTab = container.querySelector('.sticker-tab.active');
    const indicator = container.querySelector('.tab-indicator');
    
    if (activeTab && indicator) {
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.left = `${activeTab.offsetLeft}px`;
        indicator.style.opacity = '1';
    } else if (indicator) {
        indicator.style.opacity = '0';
    }
}

function renderStickerList(filterText = '') {
    const container = document.getElementById('sticker-content');
    if (!container) return;

    container.innerHTML = '';

    let stickers = [];
    
    if (window.iphoneSimState.currentStickerCategoryId === 'all') {
        window.iphoneSimState.stickerCategories.forEach(cat => {
            cat.list.forEach((s, index) => {
                stickers.push({ ...s, _catId: cat.id, _index: index });
            });
        });
    } else {
        const category = window.iphoneSimState.stickerCategories.find(c => c.id === window.iphoneSimState.currentStickerCategoryId);
        if (category) {
            stickers = category.list.map((s, index) => ({ ...s, _catId: category.id, _index: index }));
        }
    }

    if (stickers.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 20px;">暂无表情包</div>';
        return;
    }

    if (filterText) {
        stickers = stickers.filter(s => s.desc.toLowerCase().includes(filterText.toLowerCase()));
    }

    if (stickers.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; padding: 20px;">没有找到匹配的表情</div>';
        return;
    }

    stickers.forEach((sticker) => {
        const key = `${sticker._catId}-${sticker._index}`;
        const item = document.createElement('div');
        item.className = `sticker-item ${window.iphoneSimState.isStickerManageMode && window.iphoneSimState.selectedStickers.has(key) ? 'selected' : ''}`;
        
        let innerHTML = `
            <img src="${sticker.url}" loading="lazy" onerror="this.src='https://placehold.co/60x60?text=Error'">
            <span>${sticker.desc}</span>
        `;

        if (window.iphoneSimState.isStickerManageMode) {
            innerHTML += `<div class="sticker-checkbox"><i class="fas fa-check"></i></div>`;
            item.onclick = (e) => {
                e.stopPropagation();
                toggleSelectSticker(sticker._catId, sticker._index);
            };
        } else {
            item.onclick = (e) => {
                e.stopPropagation();
                sendSticker(sticker);
            };
        }

        item.innerHTML = innerHTML;
        container.appendChild(item);
    });
}

function sendSticker(sticker) {
    if (window.sendMessage) window.sendMessage(sticker.url, true, 'sticker', sticker.desc);
    
    const panel = document.getElementById('sticker-panel');
    const chatInputArea = document.querySelector('.chat-input-area');
    
    if (panel) panel.classList.remove('slide-in');
    if (chatInputArea) chatInputArea.classList.remove('push-up');
}

function toggleStickerManageMode() {
    window.iphoneSimState.isStickerManageMode = !window.iphoneSimState.isStickerManageMode;
    window.iphoneSimState.selectedStickers.clear();
    
    const manageBtn = document.getElementById('sticker-manage-btn');
    const actionsPanel = document.getElementById('sticker-manage-actions');
    const topBar = document.querySelector('.sticker-top-bar');
    
    if (window.iphoneSimState.isStickerManageMode) {
        manageBtn.innerHTML = '<span style="font-size: 14px; color: #007AFF;">完成</span>';
        actionsPanel.classList.remove('hidden');
        if (topBar) topBar.style.display = 'none';
    } else {
        manageBtn.innerHTML = '<i class="fas fa-cog"></i>';
        actionsPanel.classList.add('hidden');
        if (topBar) topBar.style.display = 'flex';
    }
    
    updateSelectCount();
    renderStickerList();
}

function toggleSelectSticker(catId, index) {
    const key = `${catId}-${index}`;
    if (window.iphoneSimState.selectedStickers.has(key)) {
        window.iphoneSimState.selectedStickers.delete(key);
    } else {
        window.iphoneSimState.selectedStickers.add(key);
    }
    updateSelectCount();
    renderStickerList();
}

function updateSelectCount() {
    document.getElementById('sticker-select-count').textContent = `已选 ${window.iphoneSimState.selectedStickers.size}`;
}

function toggleSelectAllStickers() {
    let targetStickers = [];
    
    if (window.iphoneSimState.currentStickerCategoryId === 'all') {
        window.iphoneSimState.stickerCategories.forEach(cat => {
            cat.list.forEach((_, index) => {
                targetStickers.push(`${cat.id}-${index}`);
            });
        });
    } else {
        const category = window.iphoneSimState.stickerCategories.find(c => c.id === window.iphoneSimState.currentStickerCategoryId);
        if (category) {
            category.list.forEach((_, index) => {
                targetStickers.push(`${category.id}-${index}`);
            });
        }
    }
    
    if (targetStickers.length === 0) return;

    let allSelected = true;
    for (const key of targetStickers) {
        if (!window.iphoneSimState.selectedStickers.has(key)) {
            allSelected = false;
            break;
        }
    }

    if (allSelected) {
        for (const key of targetStickers) {
            window.iphoneSimState.selectedStickers.delete(key);
        }
    } else {
        for (const key of targetStickers) {
            window.iphoneSimState.selectedStickers.add(key);
        }
    }
    
    updateSelectCount();
    renderStickerList();
}

function handleExportStickers() {
    if (window.iphoneSimState.selectedStickers.size === 0) {
        alert('请先选择要导出的表情包');
        return;
    }

    const selectedKeys = Array.from(window.iphoneSimState.selectedStickers);
    const exportList = [];

    selectedKeys.forEach(key => {
        const [catId, index] = key.split('-');
        const category = window.iphoneSimState.stickerCategories.find(c => c.id == catId);
        if (category && category.list[index]) {
            exportList.push(category.list[index]);
        }
    });

    if (exportList.length === 0) {
        alert('导出失败：未找到有效数据');
        return;
    }

    const exportData = {
        list: exportList,
        exportedAt: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stickers_export_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function deleteSelectedStickers() {
    if (window.iphoneSimState.selectedStickers.size === 0) {
        if (window.iphoneSimState.currentStickerCategoryId && window.iphoneSimState.currentStickerCategoryId !== 'all') {
            if (confirm('未选择表情。是否删除当前整个分类？')) {
                window.iphoneSimState.stickerCategories = window.iphoneSimState.stickerCategories.filter(c => c.id !== window.iphoneSimState.currentStickerCategoryId);
                window.iphoneSimState.currentStickerCategoryId = 'all';
                saveConfig();
                toggleStickerManageMode();
                renderStickerTabs();
                renderStickerList();
            }
        }
        return;
    }

    if (confirm(`确定删除选中的 ${window.iphoneSimState.selectedStickers.size} 个表情吗？`)) {
        const toDelete = {};
        
        window.iphoneSimState.selectedStickers.forEach(key => {
            const [catId, index] = key.split('-');
            if (!toDelete[catId]) toDelete[catId] = [];
            toDelete[catId].push(parseInt(index));
        });

        Object.keys(toDelete).forEach(catId => {
            const category = window.iphoneSimState.stickerCategories.find(c => c.id == catId);
            if (category) {
                const indexes = toDelete[catId].sort((a, b) => b - a);
                indexes.forEach(idx => {
                    category.list.splice(idx, 1);
                });
            }
        });

        window.iphoneSimState.selectedStickers.clear();
        saveConfig();
        updateSelectCount();
        renderStickerList();
    }
}

function renderStickerCategoryDeleteModal() {
    const modal = document.getElementById('sticker-delete-cats-modal');
    if (!modal) return;
    const list = modal.querySelector('#sticker-delete-cats-list');
    list.innerHTML = '';

    if (!window.iphoneSimState.stickerCategories || window.iphoneSimState.stickerCategories.length === 0) {
        list.innerHTML = '<div class="list-item"><div class="list-content">暂无表情包分类</div></div>';
    } else {
        window.iphoneSimState.stickerCategories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.innerHTML = `
                <div class="list-content" style="justify-content: space-between; align-items: center; width: 100%;">
                    <span>${cat.name}</span>
                    <input type="checkbox" class="sticker-delete-cat-checkbox" data-id="${cat.id}">
                </div>
            `;
            list.appendChild(item);
        });
    }

    const closeBtn = document.getElementById('close-delete-sticker-cats');
    const confirmBtn = document.getElementById('confirm-delete-sticker-cats');

    if (closeBtn) {
        closeBtn.onclick = (e) => {
            e.stopPropagation();
            modal.classList.add('hidden');
        };
    }

    if (confirmBtn) {
        confirmBtn.onclick = (e) => {
            e.stopPropagation();
            handleDeleteSelectedStickerCategories();
        };
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });

    modal.classList.remove('hidden');
}

function handleDeleteSelectedStickerCategories() {
    const modal = document.getElementById('sticker-delete-cats-modal');
    if (!modal) return;
    const checked = modal.querySelectorAll('.sticker-delete-cat-checkbox:checked');
    if (!checked || checked.length === 0) {
        alert('未选择任何分类');
        return;
    }

    const ids = Array.from(checked).map(cb => cb.dataset.id);
    if (!confirm(`确定删除选中的 ${ids.length} 个分类及其中的所有表情包吗？此操作不可恢复。`)) return;

    window.iphoneSimState.stickerCategories = window.iphoneSimState.stickerCategories.filter(c => !ids.includes(String(c.id)));

    if (window.iphoneSimState.contacts && window.iphoneSimState.contacts.length > 0) {
        window.iphoneSimState.contacts.forEach(contact => {
            if (contact.linkedStickerCategories && contact.linkedStickerCategories.length > 0) {
                contact.linkedStickerCategories = contact.linkedStickerCategories.filter(id => !ids.includes(String(id)) && !ids.includes(id));
            }
        });
    }

    if (ids.includes(String(window.iphoneSimState.currentStickerCategoryId))) {
        window.iphoneSimState.currentStickerCategoryId = 'all';
    }

    saveConfig();
    renderStickerTabs();
    renderStickerList();
    modal.classList.add('hidden');
    alert('已删除所选分类');
}

// --- 身份管理功能 ---

function openPersonaManage() {
    const list = document.getElementById('persona-list');
    list.innerHTML = '';

    if (!window.iphoneSimState.userProfile) {
        window.iphoneSimState.userProfile = {
            name: 'User Name',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            bgImage: '',
            desc: '点击此处添加个性签名',
            wxid: 'wxid_123456'
        };
    }

    window.iphoneSimState.userPersonas.forEach(p => {
        const item = document.createElement('div');
        item.className = `persona-item`;
        item.innerHTML = `
            <div class="persona-info">
                <div class="persona-name">${p.name || '未命名身份'}</div>
            </div>
            <button class="ios-btn-small" style="margin-left: 10px;" onclick="event.stopPropagation(); window.editPersona('${p.id}')">设置</button>
        `;
        list.appendChild(item);
    });

    document.getElementById('persona-manage-modal').classList.remove('hidden');
}

window.editPersona = function(id) {
    document.getElementById('persona-manage-modal').classList.add('hidden');
    openPersonaEdit(parseInt(id));
}

function switchPersona(id) {
    window.iphoneSimState.currentUserPersonaId = id;
    saveConfig();
    renderMeTab();
    document.getElementById('persona-manage-modal').classList.add('hidden');
}

function openPersonaEdit(id = null) {
    currentEditingPersonaId = id;
    const modal = document.getElementById('persona-edit-modal');
    const title = document.getElementById('persona-modal-title');
    const deleteBtn = document.getElementById('delete-persona-btn');
    
    if (id) {
        const p = window.iphoneSimState.userPersonas.find(p => p.id === id);
        if (p) {
            title.textContent = '编辑身份信息';
            document.getElementById('persona-name').value = p.name || '';
            document.getElementById('persona-ai-prompt').value = p.aiPrompt || '';
            deleteBtn.style.display = 'block';
        }
    } else {
        title.textContent = '新建身份';
        document.getElementById('persona-name').value = '';
        document.getElementById('persona-ai-prompt').value = '';
        deleteBtn.style.display = 'none';
    }
    
    modal.classList.remove('hidden');
}

function handleSavePersona() {
    const name = document.getElementById('persona-name').value;
    const aiPrompt = document.getElementById('persona-ai-prompt').value;

    if (currentEditingPersonaId) {
        const p = window.iphoneSimState.userPersonas.find(p => p.id === currentEditingPersonaId);
        if (p) {
            p.name = name;
            p.title = name;
            p.aiPrompt = aiPrompt;
        }
    } else {
        const newId = Date.now();
        const newPersona = {
            id: newId,
            title: name || '未命名身份',
            name: name || '未命名身份',
            aiPrompt,
            personaId: '',
            desc: '',
            avatar: '',
            bgImage: ''
        };
        window.iphoneSimState.userPersonas.push(newPersona);
        window.iphoneSimState.currentUserPersonaId = newId;
    }
    
    saveConfig();
    document.getElementById('persona-edit-modal').classList.add('hidden');
}

function handleDeletePersona() {
    if (!currentEditingPersonaId) return;
    if (confirm('确定要删除此身份吗？')) {
        window.iphoneSimState.userPersonas = window.iphoneSimState.userPersonas.filter(p => p.id !== currentEditingPersonaId);
        if (window.iphoneSimState.currentUserPersonaId === currentEditingPersonaId) {
            window.iphoneSimState.currentUserPersonaId = window.iphoneSimState.userPersonas.length > 0 ? window.iphoneSimState.userPersonas[0].id : null;
        }
        saveConfig();
        renderMeTab();
        document.getElementById('persona-edit-modal').classList.add('hidden');
    }
}

// 初始化监听器
function setupAppsListeners() {
    const closeWalletBtn = document.getElementById('close-wallet-screen');
    const walletRechargeBtn = document.getElementById('wallet-recharge-btn');
    const walletRechargeModal = document.getElementById('wallet-recharge-modal');
    const closeWalletRechargeBtn = document.getElementById('close-recharge-modal');
    const doRechargeBtn = document.getElementById('do-recharge-btn');

    if (closeWalletBtn) closeWalletBtn.addEventListener('click', () => document.getElementById('wallet-screen').classList.add('hidden'));
    if (walletRechargeBtn) walletRechargeBtn.addEventListener('click', () => {
        walletRechargeModal.classList.remove('hidden');
        const input = document.getElementById('recharge-amount');
        if (input) input.value = '';
    });
    if (closeWalletRechargeBtn) closeWalletRechargeBtn.addEventListener('click', () => walletRechargeModal.classList.add('hidden'));
    if (doRechargeBtn) doRechargeBtn.addEventListener('click', handleRecharge);

    const addMemoryBtn = document.getElementById('add-memory-btn');
    const manualSummaryBtn = document.getElementById('manual-summary-btn');
    const memorySettingsBtn = document.getElementById('memory-settings-btn');
    const addMemoryModal = document.getElementById('add-memory-modal');
    const closeAddMemoryBtn = document.getElementById('close-add-memory');
    const saveManualMemoryBtn = document.getElementById('save-manual-memory-btn');
    const manualSummaryModal = document.getElementById('manual-summary-modal');
    const closeManualSummaryBtn = document.getElementById('close-manual-summary');
    const doManualSummaryBtn = document.getElementById('do-manual-summary-btn');
    const memorySettingsModal = document.getElementById('memory-settings-modal');
    const closeMemorySettingsBtn = document.getElementById('close-memory-settings');
    const saveMemorySettingsBtn = document.getElementById('save-memory-settings-btn');
    const editMemoryModal = document.getElementById('edit-memory-modal');
    const closeEditMemoryBtn = document.getElementById('close-edit-memory');
    const saveEditedMemoryBtn = document.getElementById('save-edited-memory-btn');
    const closeMemoryBtn = document.getElementById('close-memory-app');

    if (closeMemoryBtn) closeMemoryBtn.addEventListener('click', () => document.getElementById('memory-app').classList.add('hidden'));
    if (closeEditMemoryBtn) closeEditMemoryBtn.addEventListener('click', () => editMemoryModal.classList.add('hidden'));
    if (saveEditedMemoryBtn) saveEditedMemoryBtn.addEventListener('click', handleSaveEditedMemory);

    if (addMemoryBtn) addMemoryBtn.addEventListener('click', () => {
        document.getElementById('manual-memory-content').value = '';
        addMemoryModal.classList.remove('hidden');
    });
    if (closeAddMemoryBtn) closeAddMemoryBtn.addEventListener('click', () => addMemoryModal.classList.add('hidden'));
    if (saveManualMemoryBtn) saveManualMemoryBtn.addEventListener('click', handleSaveManualMemory);

    if (manualSummaryBtn) manualSummaryBtn.addEventListener('click', openManualSummary);
    if (closeManualSummaryBtn) closeManualSummaryBtn.addEventListener('click', () => manualSummaryModal.classList.add('hidden'));
    if (doManualSummaryBtn) doManualSummaryBtn.addEventListener('click', handleManualSummary);

    if (memorySettingsBtn) memorySettingsBtn.addEventListener('click', openMemorySettings);
    if (closeMemorySettingsBtn) closeMemorySettingsBtn.addEventListener('click', () => memorySettingsModal.classList.add('hidden'));
    if (saveMemorySettingsBtn) saveMemorySettingsBtn.addEventListener('click', handleSaveMemorySettings);

    const closeLocationBtn = document.getElementById('close-location-app');
    const itinerarySettingsBtn = document.getElementById('itinerary-settings-btn');
    const itinerarySettingsModal = document.getElementById('itinerary-settings-modal');
    const closeItinerarySettingsBtn = document.getElementById('close-itinerary-settings');
    const saveItinerarySettingsBtn = document.getElementById('save-itinerary-settings-btn');
    const refreshLocationBtn = document.getElementById('refresh-location-btn');

    if (closeLocationBtn) closeLocationBtn.addEventListener('click', () => document.getElementById('location-app').classList.add('hidden'));
    if (refreshLocationBtn) refreshLocationBtn.addEventListener('click', () => generateDailyItinerary(true));
    if (itinerarySettingsBtn) itinerarySettingsBtn.addEventListener('click', openItinerarySettings);
    if (closeItinerarySettingsBtn) closeItinerarySettingsBtn.addEventListener('click', () => itinerarySettingsModal.classList.add('hidden'));
    if (saveItinerarySettingsBtn) saveItinerarySettingsBtn.addEventListener('click', handleSaveItinerarySettings);

    const musicWidget = document.getElementById('music-widget');
    const musicSettingsModal = document.getElementById('music-settings-modal');
    const closeMusicSettingsBtn = document.getElementById('close-music-settings');
    const saveMusicAppearanceBtn = document.getElementById('save-music-appearance');
    const saveNewSongBtn = document.getElementById('save-new-song');
    const tabMusicList = document.getElementById('tab-music-list');
    const tabMusicUpload = document.getElementById('tab-music-upload');
    const musicCoverUpload = document.getElementById('music-cover-upload');
    const musicWidgetBgUpload = document.getElementById('music-widget-bg-upload');
    const musicFileUpload = document.getElementById('music-file-upload');
    const uploadMusicBtn = document.getElementById('upload-music-btn');
    const lyricsFileUpload = document.getElementById('lyrics-file-upload');
    const uploadLyricsBtn = document.getElementById('upload-lyrics-btn');

    if (musicWidget) {
        musicWidget.addEventListener('click', (e) => {
            if (e.target.id === 'play-icon' || e.target.closest('.music-controls-mini')) {
                e.stopPropagation();
                toggleMusicPlay();
            } else {
                openMusicSettings();
            }
        });
    }

    if (closeMusicSettingsBtn) closeMusicSettingsBtn.addEventListener('click', () => musicSettingsModal.classList.add('hidden'));
    if (saveMusicAppearanceBtn) saveMusicAppearanceBtn.addEventListener('click', saveMusicAppearance);
    if (saveNewSongBtn) saveNewSongBtn.addEventListener('click', saveNewSong);
    if (tabMusicList) tabMusicList.addEventListener('click', () => switchMusicTab('list'));
    if (tabMusicUpload) tabMusicUpload.addEventListener('click', () => switchMusicTab('upload'));
    
    if (uploadMusicBtn && musicFileUpload) {
        uploadMusicBtn.addEventListener('click', () => musicFileUpload.click());
        musicFileUpload.addEventListener('change', handleMusicFileUpload);
    }

    if (musicCoverUpload) {
        const preview = document.getElementById('music-cover-preview');
        if (preview) preview.addEventListener('click', () => musicCoverUpload.click());
        musicCoverUpload.addEventListener('change', handleMusicCoverUpload);
    }

    if (musicWidgetBgUpload) {
        const preview = document.getElementById('music-widget-bg-preview');
        if (preview) preview.addEventListener('click', () => musicWidgetBgUpload.click());
        musicWidgetBgUpload.addEventListener('change', handleMusicWidgetBgUpload);
    }

    if (uploadLyricsBtn && lyricsFileUpload) {
        uploadLyricsBtn.addEventListener('click', () => lyricsFileUpload.click());
        lyricsFileUpload.addEventListener('change', handleLyricsUpload);
    }

    const polaroidWidget = document.getElementById('polaroid-widget');
    const polaroidImg1 = document.getElementById('polaroid-img-1');
    const polaroidText1 = document.getElementById('polaroid-text-1');
    const polaroidInput1 = document.getElementById('polaroid-input-1');
    const polaroidImg2 = document.getElementById('polaroid-img-2');
    const polaroidText2 = document.getElementById('polaroid-text-2');
    const polaroidInput2 = document.getElementById('polaroid-input-2');

    if (polaroidWidget) {
        if (polaroidImg1) {
            polaroidImg1.parentElement.addEventListener('click', (e) => {
                e.stopPropagation();
                polaroidInput1.click();
            });
        }
        if (polaroidImg2) {
            polaroidImg2.parentElement.addEventListener('click', (e) => {
                e.stopPropagation();
                polaroidInput2.click();
            });
        }
        if (polaroidText1) {
            polaroidText1.addEventListener('click', (e) => {
                e.stopPropagation();
                handlePolaroidTextEdit(1);
            });
        }
        if (polaroidText2) {
            polaroidText2.addEventListener('click', (e) => {
                e.stopPropagation();
                handlePolaroidTextEdit(2);
            });
        }
        if (polaroidInput1) polaroidInput1.addEventListener('change', (e) => handlePolaroidImageUpload(e, 1));
        if (polaroidInput2) polaroidInput2.addEventListener('change', (e) => handlePolaroidImageUpload(e, 2));
    }

    const switchPersonaBtn = document.getElementById('switch-persona-btn');
    const closePersonaManageBtn = document.getElementById('close-persona-manage');
    const addPersonaBtn = document.getElementById('add-persona-btn');
    const closePersonaEditBtn = document.getElementById('close-persona-edit');
    const savePersonaBtn = document.getElementById('save-persona-btn');
    const deletePersonaBtn = document.getElementById('delete-persona-btn');

    if (switchPersonaBtn) switchPersonaBtn.addEventListener('click', openPersonaManage);
    if (closePersonaManageBtn) closePersonaManageBtn.addEventListener('click', () => document.getElementById('persona-manage-modal').classList.add('hidden'));
    if (addPersonaBtn) addPersonaBtn.addEventListener('click', () => {
        document.getElementById('persona-manage-modal').classList.add('hidden');
        openPersonaEdit(null);
    });
    if (closePersonaEditBtn) closePersonaEditBtn.addEventListener('click', () => document.getElementById('persona-edit-modal').classList.add('hidden'));
    if (savePersonaBtn) savePersonaBtn.addEventListener('click', handleSavePersona);
    if (deletePersonaBtn) deletePersonaBtn.addEventListener('click', handleDeletePersona);

    const momentsBgInput = document.getElementById('moments-bg-input');
    if (momentsBgInput) momentsBgInput.addEventListener('change', (e) => handleMeImageUpload(e, 'momentsBgImage'));

    const postMomentModal = document.getElementById('post-moment-modal');
    const closePostMomentBtn = document.getElementById('close-post-moment');
    const doPostMomentBtn = document.getElementById('do-post-moment');
    const addMomentImageBtn = document.getElementById('add-moment-image-btn');
    const postMomentFileInput = document.getElementById('post-moment-file-input');
    const addVirtualImageBtn = document.getElementById('add-virtual-image-btn');

    if (closePostMomentBtn) closePostMomentBtn.addEventListener('click', () => postMomentModal.classList.add('hidden'));
    if (doPostMomentBtn) doPostMomentBtn.addEventListener('click', handlePostMoment);
    if (addMomentImageBtn) addMomentImageBtn.addEventListener('click', () => postMomentFileInput.click());
    if (addVirtualImageBtn) addVirtualImageBtn.addEventListener('click', handleVirtualImage);
    if (postMomentFileInput) postMomentFileInput.addEventListener('change', handlePostMomentImages);

    const personalMomentsScreen = document.getElementById('personal-moments-screen');
    const closePersonalMomentsBtn = document.getElementById('close-personal-moments');
    const personalMomentsBgInput = document.getElementById('personal-moments-bg-input');
    
    if (closePersonalMomentsBtn) closePersonalMomentsBtn.addEventListener('click', () => personalMomentsScreen.classList.add('hidden'));
    if (personalMomentsBgInput) personalMomentsBgInput.addEventListener('change', handlePersonalMomentsBgUpload);

    const transferModal = document.getElementById('transfer-modal');
    const closeTransferBtn = document.getElementById('close-transfer-modal');
    const doTransferBtn = document.getElementById('do-transfer-btn');

    if (closeTransferBtn) closeTransferBtn.addEventListener('click', () => transferModal.classList.add('hidden'));
    // doTransferBtn listener moved to chat.js to avoid duplicate handling

    initStickerSystem();
}

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupAppsListeners);
}
