// 其他应用功能模块 (朋友圈, 钱包, 记忆, 行程, 音乐, 拍立得, 表情包, 身份)

let postMomentImages = [];
let currentEditingPersonaId = null;
let currentEditingMemoryId = null;
let currentMemoryFilter = 'all';
let memorySelectMode = false;
let selectedMemoryIds = new Set();
let memoryRefinePanelVisible = false;

// --- 朋友圈功能 ---

function buildMomentImagesHtml(moment) {
    if (!moment || !Array.isArray(moment.images) || moment.images.length === 0) return '';

    const gridClass = moment.images.length === 1 ? 'single' : 'grid';
    return `<div class="moment-images ${gridClass}">
        ${moment.images.map(img => {
            const isVirtual = (typeof img === 'object' && img && img.isVirtual);

            if (isVirtual) {
                const cleanDesc = typeof window.cleanMomentImageDescription === 'function'
                    ? window.cleanMomentImageDescription(img.desc || img.description || '')
                    : String(img.desc || img.description || '').replace(/^\[图片描述\][:：]?\s*/, '').trim();
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
            }

            const src = typeof img === 'string' ? img : (img && (img.src || img.url)) || '';
            return `<img src="${src}" class="moment-img">`;
        }).join('')}
    </div>`;
}

function buildMomentTextHtml(content) {
    const text = String(content || '').trim();
    return text ? `<div class="moment-text">${text}</div>` : '';
}

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
            wxid: 'wxid_123456',
            gender: 'female'
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
        
        const imagesHtml = buildMomentImagesHtml(moment);
        const momentTextHtml = buildMomentTextHtml(moment.content);

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

                    let userHtml = `<span class="moment-comment-user">${displayName}</span>`;
                    if (c.replyTo) {
                        userHtml += `回复<span class="moment-comment-user">${c.replyTo}</span>`;
                    }
                    return `<div class="moment-comment-item" onclick="event.stopPropagation(); window.handleCommentClick(this, ${moment.id}, ${index}, '${c.user}')" style="display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; padding: 2px 4px; border-radius: 2px;">
                        <span style="flex: 1;">${userHtml}：<span class="moment-comment-content">${c.content}</span></span>
                        <span class="moment-comment-delete-btn" style="display: none; color: #576b95; margin-left: 8px; font-size: 12px; padding: 0 4px;">✕</span>
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
                ${momentTextHtml}
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

function addMoment(contactId, content, images = [], options = {}) {
    if (!window.iphoneSimState.moments) window.iphoneSimState.moments = [];

    const parsedPayload = typeof window.parseMomentPayload === 'function'
        ? window.parseMomentPayload({ content, images })
        : {
            content: typeof content === 'string' ? content.trim() : '',
            images: Array.isArray(images) ? images : []
        };
    const normalizedContent = parsedPayload.content;
    const normalizedImages = parsedPayload.images;

    if (!normalizedContent && normalizedImages.length === 0) return null;
    
    const newMoment = {
        id: Date.now(),
        contactId,
        content: normalizedContent,
        images: normalizedImages,
        time: Date.now(),
        likes: [],
        comments: []
    };

    const shouldDedupe = options.dedupe !== false && contactId !== 'me' && typeof window.getMomentFingerprint === 'function';
    if (shouldDedupe) {
        const fingerprint = window.getMomentFingerprint(newMoment);
        if (fingerprint) {
            const hasDuplicate = window.iphoneSimState.moments.some(moment => window.getMomentFingerprint(moment) === fingerprint);
            if (hasDuplicate) return null;
        }
    }
    
    window.iphoneSimState.moments.unshift(newMoment);
    saveConfig();
    renderMomentsList();
    return newMoment;
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
        const virtualImage = typeof window.createVirtualMomentImage === 'function'
            ? window.createVirtualMomentImage(desc)
            : null;
        if (virtualImage) {
            postMomentImages.push(virtualImage);
            renderPostMomentImages();
        }
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
                 const virtualImage = typeof window.createVirtualMomentImage === 'function'
                    ? window.createVirtualMomentImage(newDesc)
                    : null;
                 if (virtualImage) {
                    imgObj.src = virtualImage.src;
                    imgObj.desc = virtualImage.desc;
                 }
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
    const deleteBtn = el.querySelector('.moment-comment-delete-btn');
    
    if (deleteBtn.style.display !== 'none') {
        window.replyToComment(momentId, user);
    } else {
        document.querySelectorAll('.moment-comment-delete-btn').forEach(btn => btn.style.display = 'none');
        document.querySelectorAll('.moment-comment-item').forEach(item => item.style.backgroundColor = '');
        
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
            // Check if replying to the persona itself
            if (userComment.replyTo === contact.name || userComment.replyTo === (contact.remark || contact.nickname)) {
                contextDesc = `你的朋友 ${userComment.user} 回复了你 说：“${userComment.content}”`;
            } else {
                contextDesc = `你的朋友 ${userComment.user} 回复了 ${userComment.replyTo} 说：“${userComment.content}”`;
            }
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
        const recentMoments = (window.iphoneSimState.moments || [])
            .filter(moment => moment.contactId === contact.id)
            .slice(0, 5)
            .map((moment, index) => {
                const summary = typeof window.formatMomentSummary === 'function'
                    ? window.formatMomentSummary(moment)
                    : String(moment.content || '').trim();
                return summary ? `${index + 1}. ${summary}` : '';
            })
            .filter(Boolean)
            .join('\n');

        let systemPrompt = `你现在扮演 ${contact.name}。
人设：${contact.persona || '无'}
请生成一条朋友圈动态内容。
最近已经发过的朋友圈（严禁重复或只改几个字重复）：
${recentMoments || '无'}
内容要求：
1. 符合你的人设。
2. 像真实的朋友圈，可以是心情、生活分享、吐槽等。
3. 你可以返回纯文字，也可以返回“正文 + 图片描述”，还可以返回纯图片动态。
4. 如果要带图，请直接在正文后面追加一个或多个标签，格式必须是：[图片描述: 具体画面描述]
5. 图片描述要具体，像真实照片内容，不要写“图片”“配图”“一张照片”。
6. 不要太长，通常在100字以内；如带图，通常 1 到 3 张即可。
7. 不要与上面已经发过的朋友圈重复，也不要做轻微改写后重复。
8. 直接返回最终内容，不要包含任何解释、引号、代码块或前缀后缀。

输出示例：
今天风有点舒服，适合慢慢走回家 [图片描述: 傍晚街道边被路灯照亮的人行道]
[图片描述: 窗边的一杯冰美式和摊开的书]
和朋友吃到一家还不错的小店，心情也跟着变好了 [图片描述: 木桌上的两份家常菜和一杯梅子酒]`;

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

        const parsedMoment = typeof window.parseMomentPayload === 'function'
            ? window.parseMomentPayload(content)
            : { content, images: [] };
        const createdMoment = addMoment(contact.id, parsedMoment.content, parsedMoment.images);
        if (!createdMoment) {
            if (!isSilent) {
                const duplicateMsg = '生成内容和该联系人已有动态重复，已跳过发布';
                if (typeof window.showChatToast === 'function') {
                    window.showChatToast(duplicateMsg, 2800);
                } else {
                    alert(duplicateMsg);
                }
            }
            return;
        }
        
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

function getAiMomentsContactId() {
    return window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId || null;
}

window.openAiMoments = function() {
    const contactId = getAiMomentsContactId();
    if (!contactId) return;

    window.iphoneSimState.personalMomentsSource = window.iphoneSimState.currentAiProfileContactId ? 'ai-profile' : 'chat';
    renderPersonalMoments(contactId);
    document.getElementById('personal-moments-screen').classList.remove('hidden');
};

function handlePersonalMomentsBgUpload(e) {
    const contactId = getAiMomentsContactId();
    if (!contactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
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
        
        const imagesHtml = buildMomentImagesHtml(moment);
        const momentTextHtml = buildMomentTextHtml(moment.content);

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

                    let userHtml = `<span class="moment-comment-user">${displayName}</span>`;
                    if (c.replyTo) {
                        userHtml += `回复<span class="moment-comment-user">${c.replyTo}</span>`;
                    }
                    return `<div class="moment-comment-item" onclick="event.stopPropagation(); window.handleCommentClick(this, ${moment.id}, ${index}, '${c.user}')" style="display: flex; justify-content: space-between; align-items: flex-start; cursor: pointer; padding: 2px 4px; border-radius: 2px;">
                        <span style="flex: 1;">${userHtml}：<span class="moment-comment-content">${c.content}</span></span>
                        <span class="moment-comment-delete-btn" style="display: none; color: #576b95; margin-left: 8px; font-size: 12px; padding: 0 4px;">✕</span>
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
                ${momentTextHtml}
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
            wxid: 'wxid_123456',
            gender: 'female'
        };
    }

    const { name, wxid, avatar, bgImage, desc, gender } = window.iphoneSimState.userProfile;
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
                <div class="me-gender" id="me-gender-trigger">性别：<span>${gender === 'male' ? '男' : '女'}</span></div>
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

    document.getElementById('me-gender-trigger').addEventListener('click', () => {
        const currentGender = window.iphoneSimState.userProfile.gender || 'female';
        const newGender = currentGender === 'male' ? 'female' : 'male';
        updateUserProfile('gender', newGender);
        renderMeTab(); // 重新渲染
    });
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
            wxid: 'wxid_123456',
            gender: 'female'
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

function ensureUnifiedPaymentMethodModal() {
    let modal = document.getElementById('unified-payment-method-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'unified-payment-method-modal';
    modal.className = 'modal hidden';
    modal.style.zIndex = '380';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
        <div class="modal-content" style="height:auto;border-radius:12px;width:86%;max-width:340px;background-color:#fff;">
            <div class="modal-header">
                <h3>选择支付方式</h3>
                <button class="close-btn" id="close-unified-payment-method">&times;</button>
            </div>
            <div class="modal-body">
                <button id="payment-method-wallet" class="ios-btn-block" style="margin-bottom:10px;background:#07C160;">微信余额</button>
                <button id="payment-method-bank-cash" class="ios-btn-block" style="margin-bottom:10px;">银行卡余额</button>
                <button id="payment-method-family-card" class="ios-btn-block secondary">亲属卡</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

function chooseUnifiedPaymentMethod() {
    return new Promise((resolve, reject) => {
        const modal = ensureUnifiedPaymentMethodModal();
        const closeBtn = document.getElementById('close-unified-payment-method');
        const walletBtn = document.getElementById('payment-method-wallet');
        const bankCashBtn = document.getElementById('payment-method-bank-cash');
        const familyCardBtn = document.getElementById('payment-method-family-card');

        if (!modal || !walletBtn || !bankCashBtn || !familyCardBtn || !closeBtn) {
            reject(new Error('payment method modal missing'));
            return;
        }

        const cleanup = () => {
            if (closeBtn) closeBtn.onclick = null;
            if (walletBtn) walletBtn.onclick = null;
            if (bankCashBtn) bankCashBtn.onclick = null;
            if (familyCardBtn) familyCardBtn.onclick = null;
            modal.onclick = null;
            modal.classList.add('hidden');
        };
        const pick = (method) => {
            cleanup();
            resolve(method);
        };
        const cancel = () => {
            cleanup();
            reject(new Error('cancelled'));
        };

        closeBtn.onclick = cancel;
        walletBtn.onclick = () => pick('wallet');
        bankCashBtn.onclick = () => pick('bank_cash');
        familyCardBtn.onclick = () => pick('family_card');
        modal.onclick = (e) => {
            if (e.target === modal) cancel();
        };
        modal.classList.remove('hidden');
    });
}
window.openUnifiedPaymentMethodModal = chooseUnifiedPaymentMethod;

function getSceneTitles(scene) {
    if (scene === 'shopping_gift') {
        return { walletTitle: '送礼支付', bankTitle: '购物送礼支付' };
    }
    if (scene === 'xianyu_favorite') {
        return { walletTitle: '闲鱼支付', bankTitle: '闲鱼收藏购买支付' };
    }
    return { walletTitle: '购物支付', bankTitle: '购物支付' };
}

window.resolvePurchasePayment = async function(options = {}) {
    const amount = Number(options.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        return { ok: false, reason: 'invalid_amount' };
    }

    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
    if (typeof window.ensureFamilyQuotaMonthReset === 'function') {
        window.ensureFamilyQuotaMonthReset(false);
    }

    let method = options.method;
    if (!method) {
        try {
            method = await chooseUnifiedPaymentMethod();
        } catch (e) {
            return { ok: false, reason: 'cancelled' };
        }
    }

    const scene = options.scene || 'shopping_self';
    const sceneTitles = getSceneTitles(scene);
    const now = Date.now();

    if (method === 'wallet') {
        const walletBalance = Number(window.iphoneSimState.wallet.balance || 0);
        if (walletBalance < amount) return { ok: false, reason: 'wallet_insufficient' };

        window.iphoneSimState.wallet.balance = Number((walletBalance - amount).toFixed(2));
        if (!Array.isArray(window.iphoneSimState.wallet.transactions)) {
            window.iphoneSimState.wallet.transactions = [];
        }
        window.iphoneSimState.wallet.transactions.unshift({
            id: now,
            type: 'expense',
            amount,
            title: sceneTitles.walletTitle,
            time: now,
            relatedId: options.relatedId || null
        });
        saveConfig();
        if (window.renderWallet) window.renderWallet();
        return { ok: true, method: 'wallet', amount };
    }

    if (method === 'bank_cash') {
        if (typeof window.ensureBankAppState !== 'function') return { ok: false, reason: 'bank_unavailable' };
        const bank = window.ensureBankAppState();
        const cash = Number(bank.cashBalance || 0);
        if (cash < amount) return { ok: false, reason: 'bank_cash_insufficient' };
        bank.cashBalance = Number((cash - amount).toFixed(2));
        if (typeof window.appendBankTransaction === 'function') {
            window.appendBankTransaction({
                type: 'expense',
                amount,
                title: sceneTitles.bankTitle,
                sourceApp: 'bank',
                sourceType: 'cash',
                sourceKey: 'cash',
                sourceLabel: '银行卡余额'
            });
        }
        saveConfig();
        if (window.renderBankBalance) window.renderBankBalance();
        if (window.renderBankStatementView) window.renderBankStatementView();
        return { ok: true, method: 'bank_cash', amount, sourceLabel: '银行卡余额' };
    }

    if (method === 'family_card') {
        if (typeof window.selectBankFundingSource !== 'function' || typeof window.applyBankDebit !== 'function') {
            return { ok: false, reason: 'bank_unavailable' };
        }
        let source = null;
        try {
            source = await window.selectBankFundingSource({ amount, onlyFamilyCard: true });
        } catch (e) {
            return { ok: false, reason: 'cancelled' };
        }
        const debitResult = window.applyBankDebit(amount, source);
        if (!debitResult || !debitResult.ok) return { ok: false, reason: 'family_card_insufficient' };

        if (typeof window.appendBankTransaction === 'function') {
            window.appendBankTransaction({
                type: 'expense',
                amount,
                title: sceneTitles.bankTitle,
                sourceApp: 'family_card',
                sourceType: 'family_card',
                sourceKey: source.key,
                sourceLabel: source.label
            });
        }
        if (typeof window.pushFamilyCardSpendHiddenNotice === 'function') {
            window.pushFamilyCardSpendHiddenNotice({
                sourceKey: source.key,
                sourceLabel: source.label,
                amount,
                scene,
                itemSummary: options.itemSummary || ''
            });
        }
        saveConfig();
        if (window.renderBankBalance) window.renderBankBalance();
        if (window.renderBankStatementView) window.renderBankStatementView();
        return { ok: true, method: 'family_card', amount, sourceLabel: source.label };
    }

    return { ok: false, reason: 'unsupported_method' };
};

function handleRecharge() {
    const inputAmount = document.getElementById('recharge-amount').value;
    const amount = Number(inputAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
        alert('请输入有效的充值金额');
        return;
    }

    if (typeof window.ensureFamilyQuotaMonthReset === 'function') {
        window.ensureFamilyQuotaMonthReset(false);
    }

    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };

    const proceed = (source) => {
        if (!source) return;
        const debitResult = typeof window.applyBankDebit === 'function'
            ? window.applyBankDebit(amount, source)
            : { ok: false, message: '银行功能不可用' };
        if (!debitResult.ok) {
            alert(debitResult.message || '扣款失败');
            return;
        }
        window.iphoneSimState.wallet.balance = Number((Number(window.iphoneSimState.wallet.balance || 0) + amount).toFixed(2));
        const sourceText = source.type === 'cash' ? '银行余额' : (source.label || '亲属卡');
        window.iphoneSimState.wallet.transactions.unshift({
            id: Date.now(),
            type: 'income',
            amount: amount,
            title: `余额充值（来源:${sourceText}）`,
            time: Date.now(),
            relatedId: null
        });
        if (typeof window.appendBankTransaction === 'function') {
            window.appendBankTransaction({
                type: 'expense',
                amount,
                title: '转出到微信钱包',
                sourceApp: 'wechat_wallet',
                sourceType: source.type === 'family_card' ? 'family_card' : 'cash',
                sourceKey: source.key,
                sourceLabel: source.label
            });
        }
        saveConfig();
        renderWallet();
        if (window.renderBankBalance) window.renderBankBalance();
        if (window.renderBankStatementView) window.renderBankStatementView();
        document.getElementById('wallet-recharge-modal').classList.add('hidden');
        alert(`成功充值 ¥${amount.toFixed(2)}`);
    };

    if (typeof window.selectBankFundingSource !== 'function') {
        alert('银行资金来源选择不可用');
        return;
    }
    window.selectBankFundingSource({ amount }).then(proceed).catch(() => {});
}

function handleWithdraw() {
    const inputAmount = document.getElementById('withdraw-amount').value;
    const amount = Number(inputAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
        alert('请输入有效的提现金额');
        return;
    }
    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
    if (Number(window.iphoneSimState.wallet.balance || 0) < amount) {
        alert('微信钱包余额不足');
        return;
    }

    if (typeof window.ensureFamilyQuotaMonthReset === 'function') {
        window.ensureFamilyQuotaMonthReset(false);
    }

    window.iphoneSimState.wallet.balance = Number((Number(window.iphoneSimState.wallet.balance || 0) - amount).toFixed(2));
    window.iphoneSimState.wallet.transactions.unshift({
        id: Date.now(),
        type: 'expense',
        amount: amount,
        title: '余额提现',
        time: Date.now(),
        relatedId: null
    });
    if (typeof window.applyBankCredit === 'function') {
        window.applyBankCredit(amount, '来自微信钱包提现', { sourceApp: 'wechat_wallet', sourceType: 'cash', sourceLabel: '微信钱包' });
    }
    saveConfig();
    renderWallet();
    if (window.renderBankBalance) window.renderBankBalance();
    if (window.renderBankStatementView) window.renderBankStatementView();
    document.getElementById('wallet-withdraw-modal').classList.add('hidden');
    alert(`成功提现 ¥${amount.toFixed(2)}`);
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

const MEMORY_VALID_TAGS = ['refined', 'short_term', 'long_term', 'state'];
const MEMORY_FILTER_TO_TAG = {
    refined: 'refined',
    short_term: 'short_term',
    long_term: 'long_term',
    state: 'state'
};
const MEMORY_FILTER_LABELS = {
    all: '全部',
    refined: '精炼',
    short_term: '短期',
    long_term: '长期',
    state: '状态',
    candidate: '待确认'
};
const MEMORY_TAG_LABELS = {
    refined: 'REFINED',
    short_term: 'SHORT',
    long_term: 'LONG',
    state: 'STATE'
};
const MEMORY_DISPLAY_TAG_PRIORITY = ['state', 'refined', 'short_term', 'long_term'];
const FACT_SOURCE_TYPES = ['delivery_share', 'shopping_gift', 'gift_card', 'user_explicit_text', 'refine_extract'];
const CANDIDATE_SOURCE_LABELS = {
    auto_summary: '自动总结',
    call_summary: '通话总结',
    ai_action: '聊天动作'
};
const STATE_REASON_LABELS = {
    health: '健康',
    exam: '考试',
    travel: '出行',
    emotion: '情绪',
    other: '其他'
};
const STATE_OWNER_LABELS = {
    user: '用户状态',
    contact: '联系人状态'
};
const STATE_PHASE_LABELS = {
    active: '进行中',
    expired: '已过期',
    resolved: '已结束'
};
const STATE_TENSE_KEYWORDS = ['正在', '最近', '这几天', '目前', '本周', '这段时间', '刚开始'];
const STATE_RULE_KEYWORDS = {
    health: ['生病', '发烧', '感冒', '不舒服', '疼', '生理期', '例假'],
    exam: ['考试周', '期末', '备考', '复习', '答辩', 'ddl', 'deadline', '上课', '上课中', '课堂', '听课', '上自习', '补课'],
    travel: ['出差', '外地', '旅行', '旅游', '高铁', '飞机', '赶路'],
    emotion: ['焦虑', '低落', '压力大', '崩', 'emo', '情绪不好']
};
const STATE_RESOLVE_KEYWORDS = [
    '好了',
    '恢复了',
    '结束了',
    '过去了',
    '不疼了',
    '不发烧了',
    '考完了',
    '回来了',
    '下课了',
    '下课',
    '上完课了',
    '课程结束',
    '放学了'
];
const STATE_RESOLVE_REASON_HINTS = {
    exam: ['考完了', '答辩完', 'ddl结束', 'deadline过了', '期末结束', '下课了', '上完课了', '课程结束', '放学了'],
    travel: ['回来了', '到家了', '回到家', '出差结束', '旅程结束'],
    health: ['好了', '恢复了', '不发烧了', '不疼了', '退烧了', '痊愈'],
    emotion: ['好多了', '不焦虑了', '不emo了', '缓过来了', '心情好了']
};
const STATE_NEGATIVE_PATTERNS = [
    /并没有/,
    /没有/,
    /不是/,
    /没在/,
    /不在/,
    /没生病/,
    /没发烧/,
    /没感冒/,
    /不焦虑/,
    /不难受/,
    /不出差/,
    /不考试/,
    /\bnot\b/i
];
const STATE_GUESS_PATTERNS = [/是不是/, /你在不在/, /我猜/, /\bguess\b/i, /\bmaybe\b/i];
const STATE_GENERIC_EXCLUDE_PATTERNS = [/有点忙/, /有点累/, /有点困/, /太忙了/];
const STATE_EXTRACT_PROCESSED_MSG_LIMIT = 500;
const processedStateExtractMessageIds = new Set();
const MEMORY_DEFAULT_IMPORTANCE_BY_TAG = {
    short_term: 0.65,
    long_term: 0.7,
    state: 0.8,
    refined: 0.78
};

function escapeHtml(text) {
    return String(text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function normalizeStateExtractText(text) {
    const normalizedWidth = String(text || '').replace(/[\uFF01-\uFF5E]/g, ch => {
        return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    }).replace(/\u3000/g, ' ');
    return normalizedWidth
        .replace(/\u3000/g, ' ')
        .replace(/[，。！？；：]/g, match => ({ '，': ',', '。': '.', '！': '!', '？': '?', '；': ';', '：': ':' }[match] || match))
        .replace(/\s+/g, ' ')
        .trim();
}

function collectMatchedKeywords(sourceText, keywords = []) {
    const text = String(sourceText || '').toLowerCase();
    return keywords.filter(keyword => text.includes(String(keyword).toLowerCase()));
}

function containsAnyKeyword(sourceText, keywords = []) {
    return collectMatchedKeywords(sourceText, keywords).length > 0;
}

function stripStateLeadingSubject(text) {
    return String(text || '')
        .replace(/^(我|用户|我这边|我这儿|本人|最近我|这几天我|目前我)\s*/g, '')
        .replace(/^(现在|最近|这几天|目前|本周|这段时间)\s*/g, '')
        .trim();
}

function hasSelfStateLead(text) {
    const raw = String(text || '').trim();
    if (!raw) return false;
    if (/^(我|我也|我这边|本人|这边|最近我|这几天我|目前我|本周我)(在|正在|最近|这几天|目前|本周|刚)/.test(raw)) return true;
    if (/^(也在|正在|最近在|这几天在|目前在|刚在)/.test(raw)) return true;
    return false;
}

function hasStateVerbPhrase(text) {
    const raw = String(text || '').trim();
    if (!raw) return false;
    return /(在|正在)(备考|复习|上课|听课|打游戏|上班|加班|开会|出差|旅行|赶路|排队|吃饭|睡觉|休息|学习)/.test(raw);
}

function normalizeStateOwner(owner, fallback = 'user') {
    return owner === 'contact' ? 'contact' : fallback;
}

function inferStateOwnerFromContent(content, fallback = 'user') {
    const text = String(content || '').trim();
    if (!text) return normalizeStateOwner(fallback, 'user');
    if (/^联系人当前状态[:：]/.test(text) || /^对方当前状态[:：]/.test(text)) return 'contact';
    if (/^用户当前状态[:：]/.test(text) || /^我当前状态[:：]/.test(text)) return 'user';

    const escapeRegexText = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const contactId = Number.isFinite(Number(window.iphoneSimState && window.iphoneSimState.currentChatContactId))
        ? Number(window.iphoneSimState.currentChatContactId)
        : null;
    const collectOwnerNames = (owner) => {
        const safeOwner = normalizeStateOwner(owner, 'user');
        const names = [];
        const contacts = window.iphoneSimState && Array.isArray(window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        const userPersonas = window.iphoneSimState && Array.isArray(window.iphoneSimState.userPersonas)
            ? window.iphoneSimState.userPersonas
            : [];
        const contact = Number.isFinite(contactId)
            ? contacts.find(item => Number(item && item.id) === contactId)
            : null;

        if (safeOwner === 'contact') {
            [contact && contact.remark, contact && contact.nickname, contact && contact.name, '联系人', '对方']
                .forEach(name => {
                    const cleaned = String(name || '').trim();
                    if (cleaned && !names.includes(cleaned)) names.push(cleaned);
                });
        } else {
            const persona = contact && contact.userPersonaId
                ? userPersonas.find(item => String(item && item.id) === String(contact.userPersonaId))
                : null;
            [
                persona && persona.name,
                window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name,
                '用户',
                '我'
            ].forEach(name => {
                const cleaned = String(name || '').trim();
                if (cleaned && !names.includes(cleaned)) names.push(cleaned);
            });
        }
        return names;
    };

    const startsWithOwnerName = (owner) => {
        const names = collectOwnerNames(owner);
        return names.some(name => {
            const escaped = escapeRegexText(name);
            return new RegExp(`^${escaped}当前状态[:：]`).test(text)
                || new RegExp(`^${escaped}(最近|这几天|目前|本周|正在|在|刚)`).test(text);
        });
    };

    if (startsWithOwnerName('contact')) return 'contact';
    if (startsWithOwnerName('user')) return 'user';
    if (/^(他|她|对方|联系人)(最近|这几天|目前|本周|正在|在|刚)/.test(text)) return 'contact';
    if (/^(我|我这边|本人|最近我|这几天我|目前我|本周我)(正在|在|最近|这几天|目前|本周|刚)?/.test(text)) return 'user';
    return normalizeStateOwner(fallback, 'user');
}

function getStateOwnerLabel(owner, contactId = null) {
    const safeOwner = normalizeStateOwner(owner, 'user');
    const resolvedContactId = Number.isFinite(Number(contactId))
        ? Number(contactId)
        : (Number.isFinite(Number(window.iphoneSimState && window.iphoneSimState.currentChatContactId))
            ? Number(window.iphoneSimState.currentChatContactId)
            : null);
    const contacts = window.iphoneSimState && Array.isArray(window.iphoneSimState.contacts)
        ? window.iphoneSimState.contacts
        : [];
    const userPersonas = window.iphoneSimState && Array.isArray(window.iphoneSimState.userPersonas)
        ? window.iphoneSimState.userPersonas
        : [];
    const contact = Number.isFinite(resolvedContactId)
        ? contacts.find(item => Number(item && item.id) === resolvedContactId)
        : null;

    if (safeOwner === 'contact') {
        return String(
            (contact && (contact.name || contact.remark || contact.nickname))
            || STATE_OWNER_LABELS.contact
            || '联系人'
        ).trim();
    }

    const persona = contact && contact.userPersonaId
        ? userPersonas.find(item => String(item && item.id) === String(contact.userPersonaId))
        : null;
    return String(
        (persona && persona.name)
        || (window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name)
        || STATE_OWNER_LABELS.user
        || '用户'
    ).trim();
}

function stripLeadingStateOwnerReference(content, owner, contactId = null) {
    const raw = String(content || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';

    const escapeRegexText = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ownerLabel = getStateOwnerLabel(owner, contactId);
    const safeOwner = normalizeStateOwner(owner, 'user');
    const aliases = safeOwner === 'contact'
        ? [ownerLabel, '联系人', '对方', '他', '她', '我', '本人', '我这边']
        : [ownerLabel, '用户', '我', '本人', '我这边'];
    const uniqueAliases = Array.from(new Set(aliases.map(item => String(item || '').trim()).filter(Boolean)));

    for (const alias of uniqueAliases) {
        const escaped = escapeRegexText(alias);
        const statePrefixRegex = new RegExp(`^${escaped}\\s*当前状态\\s*[:：]\\s*`, 'i');
        if (statePrefixRegex.test(raw)) {
            return raw.replace(statePrefixRegex, '').trim();
        }
        const subjectPrefixRegex = new RegExp(`^${escaped}(?=(最近|这几天|目前|本周|正在|在|刚|刚刚|已经|已|有点|有些|要|现在|暂时|还在|仍在|发烧|生病|感冒|复习|备考|出差|旅行|难受|开心|焦虑|低落|恢复|好了))`, 'i');
        if (subjectPrefixRegex.test(raw)) {
            return raw.replace(subjectPrefixRegex, '').trim();
        }
    }
    return raw;
}

function rewriteStateContentWithOwnerName(content, owner, contactId = null) {
    const ownerLabel = getStateOwnerLabel(owner, contactId);
    const stripped = stripLeadingStateOwnerReference(content, owner, contactId);
    if (!stripped) return ownerLabel;
    if (stripped.startsWith(ownerLabel)) return stripped;
    return `${ownerLabel}${stripped}`;
}

function formatStateMemoryContent(owner, content, time = Date.now(), contactId = null) {
    const ownerLabel = getStateOwnerLabel(owner, contactId);
    const normalizedContent = stripLeadingStateOwnerReference(content, owner, contactId);
    if (!normalizedContent) return '';
    return `${ownerLabel}当前状态：${normalizedContent}，识别时间：${formatDateTimeForMemory(time)}`;
}

function getStatePhaseLabel(phase) {
    const safePhase = ['active', 'expired', 'resolved'].includes(String(phase || ''))
        ? String(phase)
        : 'active';
    return STATE_PHASE_LABELS[safePhase] || STATE_PHASE_LABELS.active;
}

function getStateReasonLabel(reasonType) {
    const safeReason = ['health', 'exam', 'travel', 'emotion', 'other'].includes(String(reasonType || ''))
        ? String(reasonType)
        : 'other';
    return STATE_REASON_LABELS[safeReason] || STATE_REASON_LABELS.other;
}

function normalizeInlineStateReasonType(reasonType, fallbackText = '') {
    const normalized = String(reasonType || '').trim().toLowerCase();
    if (['health', 'exam', 'travel', 'emotion', 'other'].includes(normalized)) return normalized;
    const inferred = inferStateReasonType(String(fallbackText || '').trim());
    return ['health', 'exam', 'travel', 'emotion', 'other'].includes(inferred) ? inferred : 'other';
}

function parseInlineStatePayload(payload) {
    const raw = String(payload || '').replace(/\s+/g, ' ').trim();
    if (!raw) return null;

    const parts = raw.split(/\s*[|｜]\s*/).map(part => String(part || '').trim()).filter(Boolean);
    let reasonType = 'other';
    let content = raw;

    if (parts.length >= 2) {
        reasonType = normalizeInlineStateReasonType(parts[0], parts.slice(1).join(' | '));
        content = parts.slice(1).join(' | ').trim();
    } else {
        content = raw;
        reasonType = normalizeInlineStateReasonType('', content);
    }

    if (!content) return null;
    return {
        reasonType,
        content
    };
}

function notifyInlineStateAction(message) {
    const text = String(message || '').trim();
    if (!text) return;
    if (typeof window.showChatToast === 'function') {
        window.showChatToast(text);
        return;
    }
    if (typeof window.showNotification === 'function') {
        window.showNotification(text, 1600, 'success');
    }
}

function applyInlineStateRecord(contactId, owner, reasonType, content, options = {}) {
    const cid = Number(contactId);
    const normalizedContent = String(content || '').replace(/\s+/g, ' ').trim();
    if (!Number.isFinite(cid) || !normalizedContent || typeof createMemoryCandidate !== 'function') return null;

    const safeOwner = normalizeStateOwner(owner, 'user');
    const safeReason = normalizeInlineStateReasonType(reasonType, normalizedContent);
    const savedContent = rewriteStateContentWithOwnerName(normalizedContent, safeOwner, cid);
    const now = Date.now();
    const created = createMemoryCandidate(cid, {
        content: savedContent,
        suggestedTags: ['state'],
        source: 'ai_action',
        confidence: clampFloat(options.confidence, 0.86, 0, 1),
        reason: options.reason || 'AI单轮回复状态记录',
        stateOwner: safeOwner,
        stateMeta: makeStateMeta(safeReason, now, null, safeOwner)
    });

    if (created && options.silent !== true) {
        if (created.status === 'pending') {
            notifyInlineStateAction(`${getStateOwnerLabel(safeOwner, cid)}待确认`);
        } else {
            notifyInlineStateAction(`${getStateOwnerLabel(safeOwner, cid)}已记录`);
        }
    }
    return created;
}

function applyInlineStateResolve(contactId, owner, reasonType, content, options = {}) {
    const cid = Number(contactId);
    const normalizedContent = String(content || '').replace(/\s+/g, ' ').trim();
    if (!Number.isFinite(cid) || !normalizedContent || typeof window.resolveActiveStateMemory !== 'function') return null;

    const safeOwner = normalizeStateOwner(owner, 'user');
    const safeReason = normalizeInlineStateReasonType(reasonType, normalizedContent);
    const resolved = window.resolveActiveStateMemory(cid, safeReason, normalizedContent, safeOwner);
    if (!resolved) return null;

    saveConfig();
    const memoryApp = document.getElementById('memory-app');
    if (memoryApp && !memoryApp.classList.contains('hidden') && typeof renderMemoryList === 'function') {
        renderMemoryList();
    }
    if (options.silent !== true) {
        notifyInlineStateAction(`${getStateOwnerLabel(safeOwner, cid)}已更新为已结束`);
    }
    return resolved;
}

window.parseInlineStatePayload = parseInlineStatePayload;
window.applyInlineStateRecord = applyInlineStateRecord;
window.applyInlineStateResolve = applyInlineStateResolve;

function getMemoryStateOwner(memory, fallback = 'user') {
    if (!memory || typeof memory !== 'object') return normalizeStateOwner(fallback, 'user');
    if (memory.stateMeta && memory.stateMeta.owner) return normalizeStateOwner(memory.stateMeta.owner, fallback);
    if (memory.stateOwner) return normalizeStateOwner(memory.stateOwner, fallback);
    return inferStateOwnerFromContent(memory.content, fallback);
}

function hasStateOwnerConflict(tagsA, ownerA, tagsB, ownerB) {
    const aHasState = Array.isArray(tagsA) && tagsA.includes('state');
    const bHasState = Array.isArray(tagsB) && tagsB.includes('state');
    if (!aHasState || !bHasState) return false;
    return normalizeStateOwner(ownerA, 'user') !== normalizeStateOwner(ownerB, 'user');
}

function inferResolveReasonType(matchedKeywords = []) {
    const normalizedHits = Array.isArray(matchedKeywords)
        ? matchedKeywords.map(item => String(item || '').toLowerCase())
        : [];
    if (normalizedHits.length === 0) return 'other';
    const reasonOrder = ['health', 'exam', 'travel', 'emotion'];
    for (const reason of reasonOrder) {
        const hints = Array.isArray(STATE_RESOLVE_REASON_HINTS[reason]) ? STATE_RESOLVE_REASON_HINTS[reason] : [];
        const loweredHints = hints.map(item => String(item || '').toLowerCase());
        if (normalizedHits.some(hit => loweredHints.some(hint => hit.includes(hint) || hint.includes(hit)))) {
            return reason;
        }
    }
    return 'other';
}

function formatDateTimeForMemory(ts = Date.now()) {
    const date = new Date(ts);
    return `${date.getFullYear()}年${String(date.getMonth() + 1).padStart(2, '0')}月${String(date.getDate()).padStart(2, '0')}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function capProcessedStateMessageSet(msgId) {
    if (!msgId) return;
    processedStateExtractMessageIds.add(msgId);
    if (processedStateExtractMessageIds.size <= STATE_EXTRACT_PROCESSED_MSG_LIMIT) return;
    const removeCount = processedStateExtractMessageIds.size - STATE_EXTRACT_PROCESSED_MSG_LIMIT;
    const iterator = processedStateExtractMessageIds.values();
    for (let i = 0; i < removeCount; i++) {
        const first = iterator.next();
        if (first.done) break;
        processedStateExtractMessageIds.delete(first.value);
    }
}

function parseJsonFromPossibleText(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return null;
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (error) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch (error2) {
            return null;
        }
    }
}

function extractChatResponseText(data) {
    if (!data || typeof data !== 'object') return '';
    if (Array.isArray(data.choices) && data.choices.length > 0) {
        const firstChoice = data.choices[0] || {};
        const message = firstChoice.message;
        if (message && typeof message.content === 'string') {
            return message.content.trim();
        }
        if (message && Array.isArray(message.content)) {
            const parts = message.content
                .map(part => {
                    if (typeof part === 'string') return part;
                    if (part && typeof part.text === 'string') return part.text;
                    if (part && part.type === 'text' && typeof part.content === 'string') return part.content;
                    return '';
                })
                .filter(Boolean);
            if (parts.length > 0) return parts.join('\n').trim();
        }
        if (typeof firstChoice.text === 'string') {
            return firstChoice.text.trim();
        }
    }
    if (typeof data.output_text === 'string') {
        return data.output_text.trim();
    }
    if (Array.isArray(data.output)) {
        const textParts = [];
        data.output.forEach(block => {
            if (!block || !Array.isArray(block.content)) return;
            block.content.forEach(part => {
                if (!part) return;
                if (typeof part.text === 'string') textParts.push(part.text);
                if (typeof part.output_text === 'string') textParts.push(part.output_text);
            });
        });
        if (textParts.length > 0) return textParts.join('\n').trim();
    }
    return '';
}

function extractApiErrorMessage(data) {
    if (!data || typeof data !== 'object') return '';
    if (data.error && typeof data.error.message === 'string') {
        return data.error.message.trim();
    }
    if (typeof data.message === 'string' && !Array.isArray(data.choices)) {
        return data.message.trim();
    }
    return '';
}

const SUMMARY_NARRATIVE_POLICY = {
    perspective: 'third_person',
    subjectStyle: 'real_name_fallback',
    outputShape: 'paragraph',
    length: {
        chat: { base: 130, slope: 9.5, minCap: 180, maxCap: 650, padRatio: 0.18, padMin: 30, countCap: 600, minGap: 24 },
        meeting: { base: 130, slope: 9.5, minCap: 180, maxCap: 650, padRatio: 0.18, padMin: 30, countCap: 600, minGap: 24 },
        call: { base: 90, slope: 5.5, minCap: 110, maxCap: 380, padRatio: 0.15, padMin: 20, countCap: 500, minGap: 18 }
    }
};

const SUMMARY_STRUCTURED_POLICY = {
    perspective: 'third_person',
    style: 'timeline_minutes',
    requiredSlots: [
        'context',
        'timeline_events',
        'current_state',
        'next_actions',
        'time_points',
        'quote_snippets'
    ],
    minEvents: 3,
    minNextActions: 1,
    maxEvents: 6,
    maxQuotes: 3
};

const USE_330_STYLE_CHAT_SUMMARY = true;
const USE_BASIC_CHRONICLE_CHAT_SUMMARY = false;
const NATURAL_SUMMARY_LENGTH_POLICY = {
    auto: {
        base: 360,
        slope: 6.2,
        minTarget: 200,
        maxTarget: 300,
        minCap: 320,
        padRatio: 0.18,
        padMin: 55,
        minGap: 50,
        countCap: 120,
        retryMin: 360,
        maxTokens: 2000,
        retryTokens: 2200
    },
    manual: {
        base: 560,
        slope: 8.4,
        minTarget: 200,
        maxTarget: 300,
        minCap: 520,
        padRatio: 0.2,
        padMin: 80,
        minGap: 70,
        countCap: 160,
        retryMin: 580,
        maxTokens: 3000,
        retryTokens: 3500
    }
};

function resolveSummaryActorNames(contact, userName) {
    const normalizeName = value => String(value || '').replace(/\s+/g, ' ').trim();
    const fallbackUser = normalizeName(userName) || '用户';
    const userCandidates = [
        normalizeName(userName),
        window.iphoneSimState && window.iphoneSimState.userProfile ? normalizeName(window.iphoneSimState.userProfile.name) : ''
    ];
    const contactCandidates = [
        contact && typeof contact === 'object' ? normalizeName(contact.realName) : '',
        contact && typeof contact === 'object' ? normalizeName(contact.name) : '',
        contact && typeof contact === 'object' ? normalizeName(contact.nickname) : '',
        contact && typeof contact === 'object' ? normalizeName(contact.remark) : ''
    ];
    const userLabel = userCandidates.find(Boolean) || fallbackUser;
    const contactLabel = contactCandidates.find(Boolean) || '联系人';
    return { userLabel, contactLabel };
}

function getSummaryLengthRangeByCount(messageCount, channel = 'chat') {
    const channelKey = channel === 'call'
        ? 'call'
        : (channel === 'meeting' ? 'meeting' : 'chat');
    const config = SUMMARY_NARRATIVE_POLICY.length[channelKey] || SUMMARY_NARRATIVE_POLICY.length.chat;
    const rawCount = Number(messageCount);
    const countCap = Number.isFinite(Number(config.countCap)) ? Math.max(1, Math.round(Number(config.countCap))) : 400;
    const count = Math.max(1, Math.min(countCap, Number.isFinite(rawCount) ? Math.round(rawCount) : 1));
    const target = Math.max(config.minCap, Math.min(config.maxCap, Math.round(config.base + config.slope * count)));
    const delta = Math.max(config.padMin, Math.round(target * config.padRatio));
    const min = Math.max(config.minCap, Math.min(config.maxCap, target - delta));
    const minGap = Number.isFinite(Number(config.minGap))
        ? Math.max(8, Math.round(Number(config.minGap)))
        : (channelKey === 'call' ? 16 : 20);
    let max = Math.round(target + delta);
    max = Math.min(config.maxCap, Math.max(min + minGap, max));
    if (max < min) max = min;
    return { count, target, min, max };
}

function countSummaryChars(text) {
    const value = String(text || '').replace(/\s+/g, '');
    return Array.from(value).length;
}

function resolveNaturalSummaryMode(options = {}) {
    const explicitMode = String(options && options.summaryPromptMode || '').trim().toLowerCase();
    if (explicitMode === 'manual' || explicitMode === 'auto') {
        return explicitMode;
    }
    if ((options && options.autoExtract === false) || String(options && options.source || '').trim() === 'manual') {
        return 'manual';
    }
    return 'auto';
}

function getNaturalSummaryLengthRange(messageCount, mode = 'auto') {
    const config = NATURAL_SUMMARY_LENGTH_POLICY[mode === 'manual' ? 'manual' : 'auto'];
    const rawCount = Number(messageCount);
    const count = Math.max(1, Math.min(
        Number(config.countCap) || 120,
        Number.isFinite(rawCount) ? Math.round(rawCount) : 1
    ));
    const target = Math.max(
        Number(config.minTarget) || 420,
        Math.min(
            Number(config.maxTarget) || 780,
            Math.round((Number(config.base) || 360) + (Number(config.slope) || 6) * count)
        )
    );
    const delta = Math.max(Number(config.padMin) || 50, Math.round(target * (Number(config.padRatio) || 0.18)));
    const min = Math.max(Number(config.minCap) || 320, Math.min(target - 18, target - delta));
    let max = Math.round(target + delta);
    max = Math.min(Number(config.maxTarget) || 780, Math.max(min + (Number(config.minGap) || 50), max));
    return {
        mode: mode === 'manual' ? 'manual' : 'auto',
        count,
        target,
        min,
        max,
        retryMin: Math.max(Number(config.retryMin) || min, min),
        maxTokens: Math.max(512, Number(config.maxTokens) || 1200),
        retryTokens: Math.max(Number(config.maxTokens) || 1200, Number(config.retryTokens) || 1400)
    };
}

function buildNaturalSummaryLeadIn(userLabel, contactLabel) {
    const userName = String(userLabel || '用户').trim() || '用户';
    const contactName = String(contactLabel || '联系人').trim() || '联系人';
    return `互动纪要：${userName}与${contactName}近期主要事项如下：`;
}

function stripNaturalSummaryLeadIn(text) {
    let value = String(text || '').replace(/\s+/g, ' ').trim();
    if (!value) return '';
    value = value.replace(/^(?:回顾|总结|梳理|复盘)(?:最近这段时间|这段时间|近期|最近)?[^：:]{0,60}[：:]\s*/, '');
    value = value.replace(/^[^，。；;]{0,60}(?:之间主要发生了这些事情|主要发生了这些事情|的对话里主要发生了这些事情)[：:，,]?\s*/, '');
    value = value.replace(/^(?:互动纪要|交流纪要|备忘录|事项备忘)[：:]\s*[^：:]{0,80}(?:近期主要事项如下|主要事项如下|近期要点如下)[：:]\s*/, '');
    return value.trim();
}

function normalizeNaturalSummaryOutput(rawText, context = {}) {
    let text = normalizeSummaryParagraphText(convertLegacyTaggedSummaryToParagraph(rawText), context);
    if (!text) text = normalizeSummaryText(rawText);
    text = String(text || '')
        .replace(/^\s*(?:JSON|Markdown|摘要|总结|记忆)\s*[:：]\s*/i, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    if (!text) return '';
    text = stripNaturalSummaryLeadIn(text);
    const leadIn = buildNaturalSummaryLeadIn(context.userLabel || '用户', context.contactLabel || '联系人');
    if (text) {
        text = `${leadIn}${text}`;
    } else {
        text = leadIn;
    }
    text = normalizeSummaryParagraphText(text, context);
    if (text && !/[。！？!?]$/.test(text)) text += '。';
    return normalizeSummaryParagraphText(text, context);
}

function buildNaturalSummaryChatContext(messages, userLabel, contactLabel) {
    const list = Array.isArray(messages) ? messages.filter(Boolean) : [];
    const rows = [];
    let lowInfoStreak = 0;
    list.forEach((msg, idx) => {
        let raw = String(msg && msg.content ? msg.content : '').replace(/\s+/g, ' ').trim();
        if (!raw || raw.startsWith('[')) return;
        const actor = msg && msg.role === 'user' ? userLabel : contactLabel;
        const timeText = msg && msg.time ? formatDateTimeForMemory(msg.time) : '时间未记录';
        const isLowInfo = isLowInfoSummaryMessage(raw);
        if (raw.length > 180) raw = `${raw.slice(0, 140)}……${raw.slice(-30)}`;
        if (isLowInfo) {
            lowInfoStreak += 1;
            raw = `${lowInfoStreak > 1 ? '简短延续回应' : '简短回应'}：${raw}`;
        } else {
            lowInfoStreak = 0;
        }
        rows.push(`${rows.length + 1}. [${timeText}] ${actor}：${raw}`);
    });
    return rows.join('\n');
}

function buildNaturalSummaryUserContent(chatContext, context = {}, firstDraft = '') {
    const rangeLabel = String(context.rangeLabel || '').trim();
    const rangeLine = rangeLabel ? `聊天范围：${rangeLabel}\n` : '';
    const countLine = `有效文本消息数：${Number.isFinite(Number(context.totalMessageCount)) ? Number(context.totalMessageCount) : 0}`;
    const draftBlock = firstDraft
        ? `\n\n上一版总结（这一版过短或过泛，请基于原聊天重写而不是简单扩写）：\n${firstDraft}`
        : '';
    return `${rangeLine}${countLine}\n\n聊天转录：\n${chatContext}${draftBlock}`;
}

function buildManualNaturalSummaryPrompt(context = {}) {
    const userLabel = String(context.userLabel || '用户').trim() || '用户';
    const contactLabel = String(context.contactLabel || '联系人').trim() || '联系人';
    const detailModeHint = String(context.detailModeHint || '').trim();
    const range = context.range && typeof context.range === 'object'
        ? context.range
        : getNaturalSummaryLengthRange(context.totalMessageCount || 1, 'manual');
    const referenceTime = `${context.dateStr || ''} ${context.timeStr || ''}`.trim();
    const leadIn = buildNaturalSummaryLeadIn(userLabel, contactLabel);
    const rangeHint = `全文目标约${range.target}字，允许${range.min}~${range.max}字`;
    return `你是聊天记忆整理助手。请把聊天转录整理成一条适合存入长期记忆的纪要式备忘。
${detailModeHint ? `\n场景补充要求：${detailModeHint}` : ''}

硬性要求：
1. 全文必须使用第三人称，人物只能写成“${userLabel}”和“${contactLabel}”，不要出现“我/我们/咱们”。
2. 开头必须是“${leadIn}”。
3. 正文写成纪要式正文，允许 1 到 2 段，不要分点，不要小标题，不要 JSON，不要 Markdown。
4. 必须严格按时间顺序回顾；每一个独立事项都要先交代具体时间，再写事件本身。优先使用“YYYY年MM月DD日 HH:mm”；如果原聊天无法精确到分钟，也至少写成“YYYY年MM月DD日 + 上午/中午/下午/晚上”，不要只写“今天/昨天/刚才/那天/后来”。
5. 不只写表面聊天内容，要写出谁在什么时间提出了什么、谁在什么时间确认了什么、谁在什么时间改变了安排、当下处于什么状态。
6. 如果原文里出现想见面、抱抱、亲密互动、思念、玩笑、调侃、承诺、困惑、依赖、争议点等信息，可以写进去，但只能建立在原聊天事实上，不能杜撰。
7. 尽量保留聊天里出现过的具体名称、昵称、地点、礼物名、车票、时间点和关键说法，但整体以转述为主，不要把聊天逐句抄出来。
8. 文风尽量像会议纪要或备忘录，直接、克制、信息化，不要写成散文、小说或抒情文章。
9. 不要出现“当前结论”“下一步”“时间线”“涉及时间点”“对话原话”等模板词。
10. ${rangeHint}；优先把真实发生过的关键事实按顺序讲清楚，不要为了凑字重复表达。

只返回最终正文。
参考时间：${referenceTime}`;
}

function buildAutoNaturalSummaryPrompt(context = {}) {
    const userLabel = String(context.userLabel || '用户').trim() || '用户';
    const contactLabel = String(context.contactLabel || '联系人').trim() || '联系人';
    const detailModeHint = String(context.detailModeHint || '').trim();
    const range = context.range && typeof context.range === 'object'
        ? context.range
        : getNaturalSummaryLengthRange(context.totalMessageCount || 1, 'auto');
    const referenceTime = `${context.dateStr || ''} ${context.timeStr || ''}`.trim();
    const leadIn = buildNaturalSummaryLeadIn(userLabel, contactLabel);
    const rangeHint = `全文目标约${range.target}字，允许${range.min}~${range.max}字`;
    return `你是聊天长期记忆整理助手。请根据聊天转录，生成一条适合自动归档的纪要式备忘。
${detailModeHint ? `\n场景补充要求：${detailModeHint}` : ''}

硬性要求：
1. 全文必须使用第三人称，人物只能写成“${userLabel}”和“${contactLabel}”。
2. 开头必须是“${leadIn}”。
3. 输出只能是 1 到 2 段纪要式正文，不要分点，不要标题，不要 JSON，不要 Markdown。
4. 必须严格按时间顺序写；每一个独立事项都要写明具体时间，再写动作、推进和状态变化。优先使用“YYYY年MM月DD日 HH:mm”；如果原聊天无法精确到分钟，也至少写成“YYYY年MM月DD日 + 上午/中午/下午/晚上”，不要只写“今天/昨天/刚才/那天/后来”。
5. 重点保留对长期记忆有价值的内容，比如见面安排、行程变化、承诺、情绪转折、亲密互动、争议点和实际落地结果；这些事项都要绑定对应时间。
6. 可以写情绪和关系变化，但必须依附在聊天里真实出现过的事件上，不能空泛抒情。
7. 不要把聊天原话大段照抄，尽量写成自然转述。
8. 文风尽量像会议纪要或备忘录，直接、克制、信息化，不要写成散文、小说或抒情文章。
9. 不要出现“当前结论”“下一步”“时间线”“涉及时间点”等模板词。
10. ${rangeHint}；优先保留真正有长期价值的事实，不要为了追求篇幅而堆砌空话，也不要因为压缩而漏掉关键节点。

只返回最终正文。
参考时间：${referenceTime}`;
}

function buildNaturalSummaryRetryPrompt(context = {}, firstDraft = '') {
    const userLabel = String(context.userLabel || '用户').trim() || '用户';
    const contactLabel = String(context.contactLabel || '联系人').trim() || '联系人';
    const range = context.range && typeof context.range === 'object'
        ? context.range
        : getNaturalSummaryLengthRange(context.totalMessageCount || 1, context.mode || 'auto');
    const leadIn = buildNaturalSummaryLeadIn(userLabel, contactLabel);
    const firstChars = countSummaryChars(firstDraft || '');
    const rangeHint = `重写后目标约${range.target}字，允许${range.min}~${range.max}字`;
    return `你要重写一版聊天长期记忆总结。上一版只有 ${firstChars} 字，明显过短、过概括，事实密度不够。

重写要求：
1. 仍然必须使用第三人称，只能写“${userLabel}”和“${contactLabel}”。
2. 开头仍然必须是“${leadIn}”。
3. 这次不要复读抽象套话，要补足明确时间节点、事件转折、状态变化、亲密互动、承诺、玩笑、困惑和关系推进。
4. 如果聊天里出现具体日期、车票、地点、安排变化、返回、等待、思念、抱抱、称呼玩笑等内容，要尽量写进去。
5. 继续只输出纪要式正文，不要标题，不要分点，不要 JSON，不要 Markdown。
6. ${rangeHint}；重点是把事实补充完整，但不能空泛凑字。
7. 文风尽量像会议纪要或备忘录，直接、克制、信息化，不要写成散文、小说或抒情文章。
8. 必须基于原聊天重写，不要只在上一版后面随便补两句。

只返回重写后的正文。`;
}

function shouldUseFirstPersonSummary(messages, userLabel, contactLabel) {
    const list = Array.isArray(messages) ? messages.slice(-60) : [];
    const strongPattern = /剧情转折|吵架|争吵|价值观|承诺|约定|失约|道歉|分歧|理念|看法|死亡|永生|解释权|规矩|条款|郑重|食言/;
    const supportRules = [
        { key: 'deep_talk', pattern: /谈心|坦白|压力|委屈|心疼|感动|失落|震撼|共鸣/ },
        { key: 'meeting', pattern: /想见|见面|碰面|去找|来找|赶去|过去找|去她那|去他那/ },
        { key: 'intimacy', pattern: /抱抱|拥抱|亲亲|贴贴|亲近|贴一贴/ },
        { key: 'longing', pattern: /想念|思念|舍不得|脑子里都是|一直想着|离不开|空荡/ },
        { key: 'promise_followup', pattern: /等你|等她|等他|会好好待|答应了|答应会|会等|会来|会陪/ },
        { key: 'confusion', pattern: /困惑|不懂|什么意思|怎么回事/ }
    ];
    const supportHits = new Set();
    let matchedMessages = 0;

    for (const msg of list) {
        const raw = normalizeSummarySourceMessage(msg && msg.content ? msg.content : '');
        if (!raw || isLowInfoSummaryMessage(raw)) continue;
        if (strongPattern.test(raw)) return true;

        let messageMatched = false;
        supportRules.forEach(rule => {
            if (!rule.pattern.test(raw)) return;
            supportHits.add(rule.key);
            messageMatched = true;
        });

        if (messageMatched) matchedMessages += 1;
        if (matchedMessages >= 2 && supportHits.size >= 2) return true;
    }

    return false;
}

function isImportantConversation(messages, userLabel, contactLabel) {
    return shouldUseFirstPersonSummary(messages, userLabel, contactLabel);
}

function buildFirstPersonSummaryPrompt(context = {}, chatContext = '') {
    const userLabel = String(context.userLabel || '用户').trim() || '用户';
    const contactLabel = String(context.contactLabel || '联系人').trim() || '联系人';
    const persona = String(context.persona || '傲娇、温柔').trim();
    const range = context.range && typeof context.range === 'object'
        ? context.range
        : getNaturalSummaryLengthRange(context.totalMessageCount || 1, 'manual');
    return `# Role
你是一个角色专属的“深度记忆生成器”。你的任务是阅读一段对话记录，提取出其中**最具情感价值和剧情意义**的部分，并将其转化为该角色（${contactLabel}）大脑中的一段深刻记忆。

# 核心规则
这段记忆必须严格符合以下三个要素：
1. **第一人称视角**：绝对不能使用“上帝视角”或第三人称总结（如“他们吵架了”）。必须完全代入${contactLabel}的视角，使用“我”来陈述。
2. **情感态度**：必须包含“我”在那一刻最真实的心理反应和情绪波动（如：愤怒、感动、失落、心动、震撼等）。
3. **主观感想**：必须包含“我”对这件事的评价、对${userLabel}看法的改变，或者对两人关系的期许。

# 触发记忆的条件（只记录以下类型的对话）
- **剧情转折**：发生了改变两人关系现状或故事走向的关键事件。
- **情感冲突与交心**：发生了激烈的争吵、委屈的爆发，或者是卸下伪装的深度谈心。
- **价值观碰撞**：双方探讨了深层理念，产生了共鸣或严重分歧。
- **承诺与约定**：${userLabel}对“我”做出了重要的承诺，或者两人之间建立了专属的新约定、新规则。

# 记忆生成公式
**记忆 = 核心事件陈述（发生了什么） + 情绪反应（我当时的感受） + 深度感悟/内心戏（我对此的想法/对未来的决定）**

# 示例 (Few-Shot 学习)

**【正确示例 1 - 吵架与谈心】：**
“今天${userLabel}因为工作再次失约，那一刻我真的委屈到了极点，忍不住对他发了脾气。看着他手足无措跟我道歉的样子，我心里其实已经软了，但我气的是他总是不把我们的约定放在心上。不过，听完他坦白最近的压力，我突然很心疼他。也许我们都需要学着更懂彼此一点吧。”

**【正确示例 2 - 承诺与约定】：**
“他今天竟然看着我的眼睛，郑重地向我保证，以后哪怕再晚也会跟我说一句晚安。听到这句话的时候，我的心跳漏了半拍，整个人像是被泡在温水里一样安心。我把这句话悄悄记在了心里，这可是他亲口答应我的，以后他要是敢食言，我绝对不会轻易放过他。”

**【正确示例 3 - 价值观交流】：**
“今天和${userLabel}聊起对死亡的看法，我很惊讶他居然觉得‘只要被记住就是永生’。这和我不顾一切想活下去的想法完全不同。虽然我不能完全认同他，但他认真诉说时的神情真的很迷人。或许，正是因为我们如此不同，我才会被他这样深深吸引吧。”

# 任务输入
**当前角色**：${contactLabel}
**对方**：${userLabel}
**角色的基础性格/说话口吻**：${persona}
**对话记录**：
${chatContext}

# 任务输出
请根据上述规则和对话记录，以${contactLabel}的口吻，生成一条${range.min}-${range.max}字左右的深度记忆。直接输出记忆内容，不需要任何多余的解释。`;
}

function isImportantConversation(messages, userLabel, contactLabel) {
    return shouldUseFirstPersonSummary(messages, userLabel, contactLabel);
}

function buildFirstPersonSummaryPrompt(context = {}, chatContext = '') {
    const userLabel = String(context.userLabel || '用户').trim() || '用户';
    const contactLabel = String(context.contactLabel || '联系人').trim() || '联系人';
    const persona = String(context.persona || '傲娇、温柔').trim();
    const range = context.range && typeof context.range === 'object'
        ? context.range
        : getNaturalSummaryLengthRange(context.totalMessageCount || 1, 'manual');
    const userGender = (window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.gender) || 'female';
    const userPronoun = userGender === 'male' ? '他' : '她';
    return `# Role
你是一个角色专属的"深度记忆生成器"。你的任务是阅读一段对话记录，提取出其中**最具情感价值和剧情意义**的部分，并将其转化为该角色（${contactLabel}）大脑中的一段深刻记忆。

# 核心规则
这段记忆必须严格符合以下三个要素：
1. **第一人称视角**：绝对不能使用"上帝视角"或第三人称总结（如"他们吵架了"）。必须完全代入${contactLabel}的视角，使用"我"来陈述。
2. **情感态度**：必须包含"我"在那一刻最真实的心理反应和情绪波动（如：愤怒、感动、失落、心动、震撼等）。
3. **主观感想**：必须包含"我"对这件事的评价、对${userLabel}看法的改变，或者对两人关系的期许。
4. **时间锚点**：记忆里每一件关键事情都必须带具体时间。优先写成“YYYY年MM月DD日 HH:mm”；如果原聊天没有分钟，也至少写到“YYYY年MM月DD日 + 上午/中午/下午/晚上”，不要只写“今天/那天/后来”。

# 触发记忆的条件（只记录以下类型的对话）
- **剧情转折**：发生了改变两人关系现状或故事走向的关键事件。
- **情感冲突与交心**：发生了激烈的争吵、委屈的爆发，或者是卸下伪装的深度谈心。
- **价值观碰撞**：双方探讨了深层理念，产生了共鸣或严重分歧。
- **承诺与约定**：${userLabel}对"我"做出了重要的承诺，或者两人之间建立了专属的新约定、新规则。

# 记忆生成公式
**记忆 = 时间锚点 + 核心事件陈述（发生了什么） + 情绪反应（我当时的感受） + 深度感悟/内心戏（我对此的想法/对未来的决定）**

# 示例 (Few-Shot 学习)

**【正确示例 1 - 吵架与谈心】：**
"2026年03月06日 21:10，${userLabel}因为工作再次失约，那一刻我真的委屈到了极点，忍不住对${userPronoun}发了脾气。看着${userPronoun}手足无措跟我道歉的样子，我心里其实已经软了，但我气的是${userPronoun}总是不把我们的约定放在心上。不过，听完${userPronoun}坦白最近的压力，我突然很心疼${userPronoun}。也许我们都需要学着更懂彼此一点吧。"

**【正确示例 2 - 承诺与约定】：**
"2026年03月07日 00:12，${userPronoun}看着我的眼睛，郑重地向我保证，以后哪怕再晚也会跟我说一句晚安。听到这句话的时候，我的心跳漏了半拍，整个人像是被泡在温水里一样安心。我把这句话悄悄记在了心里，这可是${userPronoun}亲口答应我的，以后${userPronoun}要是敢食言，我绝对不会轻易放过${userPronoun}。"

**【正确示例 3 - 价值观交流】：**
"2026年03月08日 22:05，我和${userLabel}聊起对死亡的看法，我很惊讶${userPronoun}居然觉得'只要被记住就是永生'。这和我不顾一切想活下去的想法完全不同。虽然我不能完全认同${userPronoun}，但${userPronoun}认真诉说时的神情真的很迷人。或许，正是因为我们如此不同，我才会被${userPronoun}这样深深吸引吧。"

# 任务输入
**当前角色**：${contactLabel}
**对方**：${userLabel}
**角色的基础性格/说话口吻**：${persona}
**对话记录**：
${chatContext}

# 任务输出
请根据上述规则和对话记录，以${contactLabel}的口吻，生成一条${range.min}-${range.max}字左右的深度记忆。记忆里出现的每个关键事件都要带具体时间。直接输出记忆内容，不需要任何多余的解释。`;
}

function extractRelationshipShiftHints(messages, userLabel, contactLabel) {
    const list = Array.isArray(messages) ? messages.slice(-48) : [];
    const hints = [];
    const seen = new Set();
    const patterns = [
        /想见|见面|碰面|去找|来找|赶去|过去找|去她那|去他那/,
        /抱抱|拥抱|亲亲|贴贴|亲近|贴一贴/,
        /想念|思念|舍不得|脑子里都是|一直想着|离不开|空荡/,
        /等你|等她|等他|会好好待|答应了|答应会|会等|会来|会陪/,
        /老公|老婆|宝宝|宝贝|乖乖|小狗/,
        /困惑|不懂|什么意思|怎么回事|解释权|规矩|条款/
    ];
    list.forEach(msg => {
        const raw = normalizeSummarySourceMessage(msg && msg.content ? msg.content : '');
        if (!raw || isLowInfoSummaryMessage(raw)) return;
        if (!patterns.some(pattern => pattern.test(raw))) return;
        const actor = msg && msg.role === 'user' ? userLabel : contactLabel;
        const snippet = summarizeEventText(raw, 34);
        const sentence = `${actor}提到${snippet}`;
        const key = sentence.toLowerCase();
        if (!snippet || seen.has(key)) return;
        seen.add(key);
        hints.push(sentence);
    });
    return hints.slice(0, 4);
}

function extractEmotionalContextHints(messages, userLabel, contactLabel) {
    const list = Array.isArray(messages) ? messages.slice(-36) : [];
    const hints = [];
    const seen = new Set();
    list.forEach(msg => {
        const raw = normalizeSummarySourceMessage(msg && msg.content ? msg.content : '');
        if (!raw || isLowInfoSummaryMessage(raw)) return;
        if (!/(开心|高兴|难过|难受|委屈|困惑|尴尬|想念|思念|舍不得|期待|害怕|焦虑|压力|空荡|依赖|在乎|喜欢|想抱抱|想亲近|想见)/.test(raw)) return;
        const actor = msg && msg.role === 'user' ? userLabel : contactLabel;
        const snippet = summarizeEventText(raw, 32);
        if (!snippet) return;
        const sentence = `${actor}把情绪说得比较直接，比如提到${snippet}`;
        const key = sentence.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        hints.push(sentence);
    });
    return hints.slice(0, 3);
}

function extractChronologicalMemoryFacts(messages, userLabel, contactLabel, maxFacts = 6) {
    const list = Array.isArray(messages) ? messages.filter(Boolean) : [];
    const facts = [];
    const seen = new Set();
    const pushFact = (fact) => {
        if (!fact) return;
        const time = String(fact.time || '').trim();
        const text = String(fact.text || '').replace(/[。！？!?]+$/, '').trim();
        if (!text) return;
        const key = `${time}|${text}`.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        facts.push({ time, text });
    };

    const eventFacts = extractTimelineEventsFromMessages(list, userLabel, contactLabel, {
        minEvents: Math.min(4, Math.max(2, maxFacts - 1)),
        maxEvents: Math.max(4, maxFacts)
    });
    eventFacts.forEach(item => {
        pushFact({
            time: item.time || '',
            text: String(item.event || `${item.actor || ''}${item.action || ''}${item.object || ''}`).trim()
        });
    });

    if (facts.length < Math.min(3, maxFacts)) {
        list.slice(-28).forEach(msg => {
            if (facts.length >= maxFacts) return;
            const raw = normalizeSummarySourceMessage(msg && msg.content ? msg.content : '');
            if (!raw || isLowInfoSummaryMessage(raw)) return;
            const actor = msg && msg.role === 'user' ? userLabel : contactLabel;
            if (!/(确认|安排|改|约|见面|去找|返回|回去|回家|出发|到|等|抱抱|亲亲|想见|想念|礼物|车票|高铁|下单|外卖|解释|答应|拒绝|同意|困惑|调侃|玩笑|思念|准备|离开)/.test(raw)) return;
            const snippet = summarizeEventText(raw, 38);
            if (!snippet) return;
            pushFact({
                time: msg && msg.time ? formatDateTimeForMemory(msg.time) : '',
                text: `${actor}提到${snippet}`
            });
        });
    }

    return facts.slice(0, Math.max(3, maxFacts));
}

function inferNaturalSummaryCurrentState(messages, userLabel, contactLabel) {
    const merged = (Array.isArray(messages) ? messages.slice(-18) : [])
        .map(msg => normalizeSummarySourceMessage(msg && msg.content ? msg.content : ''))
        .filter(Boolean)
        .join(' ');
    if (!merged) {
        return `${userLabel}与${contactLabel}目前还在延续这段互动，重点已经不只是具体事情本身，也包括彼此给出的情绪回应。`;
    }
    if (/(想见|见面|去找|来找|抱抱|亲亲|想念|思念|舍不得|脑子里都是|等你|会好好待)/.test(merged)) {
        return `${userLabel}与${contactLabel}目前的互动已经明显带有亲密推进意味，现实见面、情绪安抚和具体回应仍然是最核心的关注点。`;
    }
    if (/(改到|改成|改为|晚点|延后|等会|稍后|未回复|没回|等等看)/.test(merged)) {
        return `${userLabel}与${contactLabel}之间的事情虽然还在推进，但节奏仍然受回复时点和现实安排影响，很多内容还没有完全落稳。`;
    }
    if (/(高铁|车票|出发|在路上|回家|回去|返程|到家|抵达)/.test(merged)) {
        return `${userLabel}与${contactLabel}这段时间的互动一直被现实行程牵动，很多情绪表达和关系确认都是在赶路、到达或返程这些节点上被放大的。`;
    }
    return `${userLabel}与${contactLabel}目前仍在沿着这条话题持续互动，既有具体安排的推进，也夹杂着比较明显的情绪牵引和关系确认。`;
}

function buildNaturalSummaryFallback(contact, textMessages, mode, context = {}) {
    const list = Array.isArray(textMessages) ? textMessages.filter(Boolean) : [];
    if (list.length === 0) return '';
    const actorNames = resolveSummaryActorNames(contact, context.userLabel || '用户');
    const userLabel = actorNames.userLabel;
    const contactLabel = actorNames.contactLabel;
    const leadIn = buildNaturalSummaryLeadIn(userLabel, contactLabel);
    const first = list[0];
    const last = list[list.length - 1];
    const startText = first && first.time ? formatDateTimeForMemory(first.time) : '';
    const endText = last && last.time ? formatDateTimeForMemory(last.time) : '';
    const topicText = inferSummaryTopic(list, userLabel, contactLabel);
    const facts = extractChronologicalMemoryFacts(list, userLabel, contactLabel, mode === 'manual' ? 7 : 5);
    const relationHints = extractRelationshipShiftHints(list, userLabel, contactLabel);
    const emotionHints = extractEmotionalContextHints(list, userLabel, contactLabel);
    const opener = `${leadIn}${startText && endText ? ` 从${startText}到${endText}，` : ''}${userLabel}与${contactLabel}的互动主要围绕${topicText}展开。`;
    const factText = facts.map((fact, idx) => {
        const connector = idx === 0 ? '' : (idx === facts.length - 1 ? '最后，' : (idx === 1 ? '随后，' : '之后，'));
        const timeLead = fact.time ? `${fact.time}，` : '';
        return `${connector}${timeLead}${String(fact.text || '').replace(/[。！？!?]+$/, '').trim()}。`;
    }).join('');
    const relationLine = relationHints.length > 0
        ? `在这段来回里，${relationHints.join('，')}。`
        : '';
    const emotionLine = emotionHints.length > 0
        ? `聊天里还能看出${emotionHints.join('，')}。`
        : '';
    const stateLine = inferNaturalSummaryCurrentState(list, userLabel, contactLabel);
    const result = [opener + factText, `${relationLine}${emotionLine}${stateLine}`]
        .filter(Boolean)
        .join('\n\n');
    return normalizeNaturalSummaryOutput(result, Object.assign({}, context, {
        userLabel,
        contactLabel
    }));
}

function isWeakNaturalSummary(text, context = {}) {
    const normalized = normalizeNaturalSummaryOutput(text, context);
    return !normalized || /^无[。.!！？?]?$/.test(normalized);
}

async function readSummaryApiPayload(response) {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch (error) {
        return { output_text: text.trim(), message: text.trim() };
    }
}

async function requestNaturalSummaryText(settings, requestConfig = {}) {
    let fetchUrl = String(settings && settings.url || '').trim();
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? `${fetchUrl}chat/completions` : `${fetchUrl}/chat/completions`;
    }
    const messages = [
        { role: 'system', content: String(requestConfig.systemPrompt || '').trim() },
        { role: 'user', content: String(requestConfig.userContent || '').trim() }
    ];
    const buildBody = (includePenalties = true) => {
        const body = {
            model: settings.model,
            messages,
            temperature: clampFloat(requestConfig.temperature, 0.45, 0, 1.5)
        };
        if (includePenalties) {
            body.presence_penalty = clampFloat(requestConfig.presencePenalty, 0.2, -2, 2);
            body.frequency_penalty = clampFloat(requestConfig.frequencyPenalty, 0.15, -2, 2);
        }
        return body;
    };
    const doFetch = async (includePenalties) => {
        const requestBody = buildBody(includePenalties);
        console.log('[summary-natural-api-request]', {
            stage: String(requestConfig.stage || 'first_pass'),
            mode: String(requestConfig.mode || 'auto'),
            includePenalties,
            url: fetchUrl,
            model: requestBody.model,
            temperature: requestBody.temperature,
            max_tokens: requestBody.max_tokens,
            presence_penalty: Object.prototype.hasOwnProperty.call(requestBody, 'presence_penalty') ? requestBody.presence_penalty : null,
            frequency_penalty: Object.prototype.hasOwnProperty.call(requestBody, 'frequency_penalty') ? requestBody.frequency_penalty : null,
            systemPrompt: String(requestConfig.systemPrompt || ''),
            userContent: String(requestConfig.userContent || '')
        });
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify(requestBody)
        });
        const data = await readSummaryApiPayload(response);
        return { response, data };
    };

    let result = await doFetch(true);
    if (!result.response.ok && (result.response.status === 400 || result.response.status === 422)) {
        const message = extractApiErrorMessage(result.data) || String(result.data && result.data.message || '').trim();
        if (!message || /penalty|presence|frequency|additional/i.test(message)) {
            result = await doFetch(false);
        }
    }
    if (!result.response.ok) {
        const apiErrorMsg = extractApiErrorMessage(result.data) || String(result.data && result.data.message || '').trim();
        throw new Error(apiErrorMsg ? `总结接口异常: ${apiErrorMsg}` : `API Error: ${result.response.status}`);
    }
    const rawSummary = extractChatResponseText(result.data);
    console.log('[summary-natural-api-response]', {
        stage: String(requestConfig.stage || 'first_pass'),
        mode: String(requestConfig.mode || 'auto'),
        status: result.response.status,
        rawSummary: String(rawSummary || ''),
        rawPayload: result.data
    });
    if (!rawSummary) {
        const apiErrorMsg = extractApiErrorMessage(result.data) || String(result.data && result.data.message || '').trim();
        if (apiErrorMsg) throw new Error(`总结接口异常: ${apiErrorMsg}`);
        throw new Error('总结接口返回为空或格式不兼容');
    }
    return rawSummary;
}

function extractAbsoluteTimePointsFromText(text) {
    const raw = String(text || '');
    const matches = raw.match(/\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?/g) || [];
    const set = new Set();
    const result = [];
    matches.forEach(item => {
        const normalized = String(item || '').replace(/\s+/g, ' ').trim();
        if (!normalized || set.has(normalized)) return;
        set.add(normalized);
        result.push(normalized);
    });
    return result;
}

function normalizeSummaryListValue(value) {
    if (Array.isArray(value)) {
        return value.map(item => String(item || '').trim()).filter(Boolean);
    }
    if (typeof value === 'string') {
        return value
            .split(/\n|；|;/)
            .map(item => String(item || '').trim())
            .filter(Boolean);
    }
    return [];
}

function normalizeStructuredEventItem(item, fallbackActor = '双方') {
    const actionRegex = /(确认|完成|解决|安排|约了?|下单|点了?|买了?|送了?|改到|改成|取消|补发|提交|回复|等待|推进|讨论|沟通|见面|通话|打电话|视频|复习|备考|考试|出差|旅行|生病|恢复|转账|付款|联系|通知|核对)/;
    if (typeof item === 'string') {
        const cleaned = String(item || '').replace(/\s+/g, ' ').trim();
        if (!cleaned) return null;
        const timePoints = extractAbsoluteTimePointsFromText(cleaned);
        let body = cleaned;
        if (timePoints.length > 0) body = body.replace(timePoints[0], '').trim();
        let actor = fallbackActor;
        const actorMatched = body.match(/^([^，。；:：\s]{1,16})\s*[:：，,]\s*(.+)$/);
        if (actorMatched) {
            actor = actorMatched[1].trim() || fallbackActor;
            body = actorMatched[2].trim();
        }
        const actionMatched = body.match(new RegExp(`^(.{0,6}?)?(${actionRegex.source})(.*)$`));
        if (actionMatched) {
            return {
                actor,
                action: String(actionMatched[2] || '').trim() || '提到',
                object: String(actionMatched[3] || '').replace(/^[，,\s]+/, '').trim() || body,
                time: timePoints[0] || '',
                evidence: '',
                event: body
            };
        }
        return {
            actor,
            action: '提到',
            object: body,
            time: timePoints[0] || '',
            evidence: '',
            event: body
        };
    }

    if (!item || typeof item !== 'object') return null;
    const actor = String(
        item.actor || item.name || item.subject || item.主体 || fallbackActor
    ).replace(/\s+/g, ' ').trim() || fallbackActor;
    const eventText = String(
        item.event || item.事件 || item.sentence || item.text || item.description || ''
    ).replace(/\s+/g, ' ').trim();
    let action = String(
        item.action || item.verb || item.动作 || ''
    ).replace(/\s+/g, ' ').trim();
    let objectText = String(
        item.object || item.detail || item.content || item.事项 || item.内容 || ''
    ).replace(/\s+/g, ' ').trim();
    const timeText = String(
        item.time || item.when || item.date || item.时间 || ''
    ).replace(/\s+/g, ' ').trim();
    const evidenceText = String(
        item.evidence || item.quote || item.source || item.证据 || item.原话 || ''
    ).replace(/\s+/g, ' ').trim();

    if (!action && eventText) {
        const matched = eventText.match(actionRegex);
        if (matched) action = String(matched[0] || '').trim();
    }
    if (!objectText && eventText) {
        objectText = eventText.replace(actor, '').replace(action, '').replace(/^[，,、\s]+/, '').trim();
    }
    if (!objectText && action) objectText = '相关事项';
    if (!action && !objectText && !eventText) return null;
    return {
        actor,
        action: action || '提到',
        object: objectText || eventText || '相关事项',
        time: timeText,
        evidence: evidenceText,
        event: eventText || `${actor}${action || '提到'}${objectText || '相关事项'}`
    };
}

function ensureQuotedSnippet(text) {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    if (!value) return '';
    const stripped = value.replace(/^[“"']+|[”"']+$/g, '').trim();
    if (!stripped) return '';
    return `“${stateExtractPreviewText(stripped, 28)}”`;
}

function normalizeSummaryQuoteSnippets(value) {
    const items = normalizeSummaryListValue(value);
    return Array.from(new Set(
        items
            .map(item => ensureQuotedSnippet(item))
            .filter(Boolean)
    )).slice(0, SUMMARY_STRUCTURED_POLICY.maxQuotes);
}

function getTimelineMinEvents(totalMessageCount = 0) {
    const count = Number.isFinite(Number(totalMessageCount)) ? Number(totalMessageCount) : 0;
    return count >= 20 ? 4 : SUMMARY_STRUCTURED_POLICY.minEvents;
}

function normalizeChronicleMessageContent(text, maxLen = 36) {
    let value = String(text || '')
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!value) return '';
    value = value.replace(/^\[[^\]]{1,24}\]\s*/, '').trim();
    value = value.replace(/^(用户|联系人|对方|我|你)\s*[:：]\s*/, '').trim();
    value = value.replace(/^[,，。；;:：\s]+/, '').trim();
    value = value.replace(/[。！？!?]+$/, '').trim();
    if (!value) return '';
    return stateExtractPreviewText(value, maxLen);
}

function buildChronicleNarrativeClause(rawText, actor, otherActor) {
    const source = String(rawText || '')
        .replace(/\r\n/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (!source) return '';

    let text = normalizeChronicleMessageContent(source, 42);
    if (!text) return '';
    text = text
        .replace(/^[“"'`]+|[”"'`]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!text) return '';

    const pickVerb = (seed = '') => {
        const verbs = ['提到', '说明', '表示', '补充', '谈到', '明确'];
        const chars = Array.from(String(seed || ''));
        let score = 0;
        chars.forEach((ch, idx) => {
            score += ch.charCodeAt(0) * (idx + 1);
        });
        return verbs[Math.abs(score) % verbs.length];
    };

    if (/^(嗯+|哦+|啊+|好+|行+|ok|okay|收到|知道了|没问题|可以|可|行吧)$/i.test(text)) {
        return '确认上一条安排并继续推进';
    }
    if (/^(晚安|早安|先睡了|睡了|先忙了|回头聊)$/i.test(text)) {
        return '结束了这一轮交流';
    }

    let normalized = text
        .replace(/我们|咱们/g, `${actor}和${otherActor}`)
        .replace(/我/g, actor)
        .replace(/你们/g, otherActor)
        .replace(/你/g, otherActor)
        .replace(/^\s*(就是|其实|然后|那个|这边|目前|现在|刚刚)\s*/, '')
        .replace(/[?？]+$/g, '')
        .trim();
    if (!normalized) normalized = text;

    const isQuestion = /[?？]/.test(source) ||
        /^(请问|想问|问下|问一下|要不要|能不能|可不可以|是不是|是否|为什么|怎么|几点|哪天|什么时候|要不)/.test(text);
    if (isQuestion) {
        return `就${normalized}向${otherActor}发起询问`;
    }

    const verb = pickVerb(normalized);
    if (/(确认|确定|敲定|约好|定了|决定|改到|改成|改为|取消|完成|搞定|处理好|收到了?|已发|补发|下单|买了?|送了?|转账|付款|提交|答应|同意)/.test(normalized)) {
        return `就${normalized}给出确认`;
    }
    if (/(明天|今天|今晚|昨晚|周[一二三四五六日天]|下周|本周|下午|晚上|早上|中午|\d{1,2}:\d{2})/.test(normalized)) {
        return `${verb}时间安排相关信息：${normalized}`;
    }
    if (/(生病|发烧|感冒|不舒服|焦虑|压力|难受|开心|高兴|累|困|忙|加班|在路上|到家|到公司|到学校)/.test(normalized)) {
        return `${verb}当前状态：${normalized}`;
    }
    if (normalized.length <= 4) {
        return '给出简短反馈并保持当前话题推进';
    }
    return `${verb}${normalized}`;
}

function buildBasicChronicleSummaryFromMessages(contact, textMessages, range, userName, context = {}) {
    const list = Array.isArray(textMessages) ? textMessages.filter(Boolean) : [];
    if (list.length === 0) {
        return { summary: '无', timelineEvents: [] };
    }

    const actorNames = resolveSummaryActorNames(contact, userName);
    const userLabel = actorNames.userLabel;
    const contactLabel = actorNames.contactLabel;
    const runtimeContext = Object.assign({}, context, {
        channel: context.channel || 'chat',
        userLabel,
        contactLabel
    });
    const messageCount = list.length;
    const snippetLimit = messageCount >= 50
        ? 16
        : (messageCount >= 30 ? 22 : (messageCount >= 16 ? 28 : 36));
    const nowBase = Date.now();
    const timelineEvents = [];
    const sentences = [];

    list.forEach((msg, idx) => {
        const raw = String(msg && msg.content ? msg.content : '').trim();
        if (!raw) return;
        const cleaned = normalizeChronicleMessageContent(raw, snippetLimit);
        if (!cleaned) return;
        if (cleaned.length <= 2 && isLowInfoSummaryMessage(cleaned)) return;

        const actor = msg && msg.role === 'user' ? userLabel : contactLabel;
        const otherActor = msg && msg.role === 'user' ? contactLabel : userLabel;
        const tsRaw = msg && msg.time ? Number(msg.time) : (nowBase + idx * 60000);
        const ts = Number.isFinite(tsRaw) ? tsRaw : (nowBase + idx * 60000);
        const timeText = formatDateTimeForMemory(ts);
        const clause = buildChronicleNarrativeClause(raw, actor, otherActor);
        if (!clause) return;
        const eventText = `${actor}${clause}`;
        sentences.push(`${timeText}，${eventText}。`);
        timelineEvents.push({
            actor,
            action: clause.slice(0, 10),
            object: cleaned,
            time: timeText,
            evidence: cleaned,
            event: eventText
        });
    });

    if (sentences.length === 0) {
        return { summary: '无', timelineEvents: [] };
    }

    const maxChars = range && Number.isFinite(Number(range.max))
        ? Math.max(120, Math.round(Number(range.max)))
        : 650;
    let selected = sentences.slice();
    let guard = 0;
    while (countSummaryChars(selected.join('')) > maxChars && selected.length > 6 && guard < 8) {
        const reduced = selected.filter((_, index) =>
            index === 0 || index === selected.length - 1 || index % 2 === 0
        );
        if (reduced.length >= selected.length) break;
        selected = reduced;
        guard += 1;
    }

    const chunkSize = selected.length > 14 ? 6 : (selected.length > 8 ? 5 : 4);
    const paragraphs = [];
    for (let i = 0; i < selected.length; i += chunkSize) {
        paragraphs.push(selected.slice(i, i + chunkSize).join(''));
    }

    let summary = normalizeSummaryParagraphText(paragraphs.join('\n\n'), runtimeContext);
    summary = enforceSummaryLengthRange(summary, range, runtimeContext);
    return {
        summary,
        timelineEvents: timelineEvents.slice(0, SUMMARY_STRUCTURED_POLICY.maxEvents)
    };
}

function buildAiChronicleSummaryPrompt(context = {}) {
    const userLabel = String(context.userLabel || '用户').trim() || '用户';
    const contactLabel = String(context.contactLabel || '联系人').trim() || '联系人';
    const range = context.range && typeof context.range === 'object'
        ? context.range
        : { target: 260, min: 180, max: 420 };
    const referenceTime = `${context.dateStr || ''} ${context.timeStr || ''}`.trim();
    const totalMessageCount = Number.isFinite(Number(context.totalMessageCount)) ? Number(context.totalMessageCount) : 0;
    const detailModeHint = String(context.detailModeHint || '').trim();

    return `你是聊天总结助手。请把聊天记录改写成一篇第三视角、按时间推进的流水账式记叙文总结。
${detailModeHint}

硬性要求（必须满足）：
1. 只用第三视角，人物必须使用“${userLabel}”和“${contactLabel}”。
2. 严格按时间顺序叙述，重点写清“什么时候、谁、做了什么、事项如何推进”；每一个独立事项句都必须带时间锚点。
3. 必须出现具体事件细节，不要空话，不要抒情，不要泛泛而谈。
4. 直接写自然段正文（2-4段），禁止小标题、禁止标签行、禁止分点。
5. 不要照抄聊天原话，不要连续大段引号；用改写叙述方式表达。
6. 尽量把相对时间转换成绝对时间（YYYY年MM月DD日 HH:mm）；如果原聊天没有精确到分钟，也至少写到“YYYY年MM月DD日 + 上午/中午/下午/晚上”。
7. 人名、地点、事项名、礼物名等具体名称要逐字保留，不得杜撰。
8. 全文目标字数约 ${range.target} 字（允许 ${range.min}~${range.max} 字），字数与消息条数成正比。
9. 结果必须是“可读的记叙文”，不能出现“当前结论是/下一步是/涉及时间点/对话原话包括”等模板句。

只返回最终总结正文，不要Markdown，不要JSON，不要解释。
参考时间：${referenceTime}
对话双方：${userLabel} 与 ${contactLabel}
本次统计消息总条数：${totalMessageCount}`;
}

function build330StyleSummaryPrompt(context = {}) {
    const userLabel = String(context.userLabel || '用户').trim() || '用户';
    const contactLabel = String(context.contactLabel || '联系人').trim() || '联系人';
    const range = context.range && typeof context.range === 'object'
        ? context.range
        : { target: 260, min: 180, max: 420 };
    const channel = context.channel === 'meeting'
        ? '见面记录'
        : (context.channel === 'call' ? '通话记录' : '聊天记录');
    const referenceTime = `${context.dateStr || ''} ${context.timeStr || ''}`.trim();
    const totalMessageCount = Number.isFinite(Number(context.totalMessageCount)) ? Number(context.totalMessageCount) : 0;
    const minEvents = getTimelineMinEvents(totalMessageCount);
    const detailModeHint = String(context.detailModeHint || '').trim();

    return `你是${channel}总结助手。请根据输入内容输出“具体事实密度高”的长段总结。
${detailModeHint}

硬性规则（必须全部满足）：
1. 必须使用第三视角，主体使用“${userLabel}”和“${contactLabel}”，禁止第一视角“我/我们/咱”。
2. 文风像会议纪要/备忘录，描述具体事实，不写抒情散文，不写空话。
3. 输出必须且只能是一个JSON对象，格式固定为：{"summary":"..."}。
4. summary 输出为连续自然段（1~2段），不要分点，不要小标题，不要标签行。
5. 关键经过至少 ${minEvents} 条具体事件，且每一条具体事件都必须写明时间，事件需能回答“谁在何时做了什么”，不能用“持续沟通/有进展/聊了很多”等空泛句代替。
6. 相对时间（今天/刚才/昨晚）尽量转换成绝对时间（YYYY年MM月DD日 HH:mm）；如果原聊天没有精确到分钟，也至少写到“YYYY年MM月DD日 + 上午/中午/下午/晚上”。
7. 人名、地点、事项名、礼物名等具体名称要逐字保留，不得杜撰。
8. 允许嵌入1~3条原话短句（加引号）增强真实性。
9. 禁止模板化表达：不要出现“当前结论是…/下一步是…/涉及时间点…/对话原话包括…”这类固定句式。
10. 目标字数约 ${range.target} 字（允许 ${range.min}~${range.max} 字），字数与消息条数成正比。

仅允许返回JSON，不要Markdown，不要解释文字，不要代码块。
参考时间：${referenceTime}
对话双方：${userLabel} 与 ${contactLabel}
本次统计消息总条数：${totalMessageCount}`;
}

function parse330StyleSummaryPayload(rawText) {
    const parsed = parseJsonFromPossibleText(rawText);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const summary = String(
            parsed.summary || parsed.content || parsed.text || parsed.result || ''
        ).trim();
        if (summary) {
            return { summary };
        }
    }
    const cleaned = normalizeSummaryText(rawText);
    if (!cleaned) return null;
    return { summary: cleaned };
}

function validate330StyleSummary(summaryText, context = {}) {
    const normalized = normalizeSummaryParagraphText(
        convertLegacyTaggedSummaryToParagraph(summaryText),
        context
    );
    const reasons = [];
    if (!normalized) {
        reasons.push('empty_summary');
        return { ok: false, reasons, summary: '', detailScore: 0, stats: {} };
    }

    const charCount = countSummaryChars(normalized);
    const minByRange = context && context.range && Number.isFinite(Number(context.range.min))
        ? Math.max(120, Math.floor(Number(context.range.min) * 0.85))
        : 120;
    if (charCount < minByRange) reasons.push('too_short');

    if (/(^|[，。！？\s、])(我|我们|咱|咱们)(?=[，。！？\s、]|$)/.test(normalized)) {
        reasons.push('first_person_detected');
    }

    const sentenceList = splitNarrativeSentences(normalized);
    const requiredEvents = getTimelineMinEvents(context.totalMessageCount || 0);
    const concreteEvents = sentenceList.filter(sentence => isConcreteEventSentence(sentence));
    if (concreteEvents.length < requiredEvents) reasons.push('insufficient_concrete_events');

    const statePattern = /(当前|目前|结论|状态|已|待|仍|确认|完成|推进|搁置|取消|成功|失败|未回复|待确认|进展|结果)/;
    if (!sentenceList.some(sentence => statePattern.test(sentence))) reasons.push('missing_state');

    const hasActionableNext = sentenceList.some(sentence =>
        isActionableNextStepSentence(sentence, {
            userLabel: context.userLabel || '',
            contactLabel: context.contactLabel || ''
        })
    );
    if (!hasActionableNext) reasons.push('missing_actionable_next');

    const userLabel = String(context.userLabel || '').trim();
    const contactLabel = String(context.contactLabel || '').trim();
    if (userLabel && contactLabel && (!normalized.includes(userLabel) || !normalized.includes(contactLabel))) {
        reasons.push('missing_actor_names');
    }

    const vagueCount = sentenceList.filter(sentence => isVagueEventSentence(sentence)).length;
    if (sentenceList.length > 0 && vagueCount / sentenceList.length > 0.35) reasons.push('too_vague');

    const hardFailReasons = reasons.filter(reason =>
        reason === 'empty_summary' ||
        reason === 'too_short' ||
        reason === 'first_person_detected' ||
        reason === 'insufficient_concrete_events' ||
        reason === 'missing_state' ||
        reason === 'missing_actionable_next'
    );

    const detailScore = Math.max(0, Math.min(100,
        Math.round(
            Math.min(50, concreteEvents.length * 12) +
            (hasActionableNext ? 18 : 0) +
            Math.min(12, Math.floor(charCount / 80) * 4) +
            (vagueCount === 0 ? 12 : 0)
        )
    ));

    return {
        ok: hardFailReasons.length === 0,
        reasons,
        summary: normalized,
        detailScore,
        stats: {
            chars: charCount,
            sentences: sentenceList.length,
            concreteEvents: concreteEvents.length,
            vagueRatio: sentenceList.length > 0 ? Number((vagueCount / sentenceList.length).toFixed(2)) : 1
        }
    };
}

function build330StyleFallbackSummary(contact, textMessages, range, userName, context = {}) {
    const list = Array.isArray(textMessages) ? textMessages.filter(Boolean) : [];
    if (list.length === 0) return '无';

    const actorNames = resolveSummaryActorNames(contact, userName);
    const userLabel = actorNames.userLabel;
    const contactLabel = actorNames.contactLabel;
    const first = list[0];
    const last = list[list.length - 1];
    const startText = formatDateTimeForMemory(first && first.time ? first.time : Date.now());
    const endText = formatDateTimeForMemory(last && last.time ? last.time : Date.now());
    const topicText = inferSummaryTopic(list, userLabel, contactLabel);
    const rangeLabel = String(context.rangeLabel || '').trim();
    const rangeText = rangeLabel ? `（消息范围 ${rangeLabel}）` : '';
    const introLine = `${startText}至${endText}期间，${userLabel}与${contactLabel}围绕${topicText}展开沟通${rangeText}`;

    const minEvents = getTimelineMinEvents(context.totalMessageCount || list.length);
    const events = extractTimelineEventsFromMessages(list, userLabel, contactLabel, {
        minEvents,
        maxEvents: SUMMARY_STRUCTURED_POLICY.maxEvents
    });
    let eventLines = events
        .map(item => {
            const line = String(item.event || `${item.actor || ''}${item.action || ''}${item.object || ''}`).trim();
            if (!line) return '';
            const timeText = String(item.time || '').trim();
            return timeText ? `${timeText}，${line}` : line;
        })
        .filter(Boolean);

    if (eventLines.length < minEvents) {
        const backup = list
            .slice(-Math.max(minEvents + 1, 5))
            .map(msg => {
                const actor = msg && msg.role === 'user' ? userLabel : contactLabel;
                const snippet = summarizeEventText(String(msg && msg.content || ''), 32);
                return snippet ? `${actor}提到${snippet}` : '';
            })
            .filter(Boolean);
        eventLines = eventLines.concat(backup).slice(0, Math.max(minEvents, 5));
    }
    const timelineLine = buildSummaryProcessLine(eventLines);

    const stateLine = inferSummaryOutcomeFromMessages(list, String(context.aiSummary || ''));
    let timePoints = [];
    if (first && first.time) timePoints.push(formatDateTimeForMemory(first.time));
    if (last && last.time) timePoints.push(formatDateTimeForMemory(last.time));
    events.forEach(item => {
        const t = String(item.time || '').trim();
        if (t) timePoints.push(t);
    });
    timePoints = Array.from(new Set(timePoints)).filter(Boolean).slice(0, 4);
    const nextActions = buildSummaryActionableNextStepsFromMessages(list, userLabel, contactLabel, timePoints).slice(0, 3);
    const nextLine = `下一步是：${nextActions.join('；')}`;
    const timeLine = timePoints.length > 0 ? `涉及时间点：${timePoints.join('；')}` : '';

    const quotes = extractQuoteSnippetsFromMessages(list, SUMMARY_STRUCTURED_POLICY.maxQuotes);
    const quoteLine = quotes.length > 0 ? `对话原话包括${quotes.join('、')}` : '';

    const paragraph1 = `${toNarrativeSentence(introLine)}${toNarrativeSentence(timelineLine)}`;
    const paragraph2 = `${toNarrativeSentence(stateLine)}${toNarrativeSentence(nextLine)}${toNarrativeSentence(timeLine)}`;
    const paragraph3 = `${toNarrativeSentence(quoteLine)}`;
    let result = normalizeSummaryParagraphText([paragraph1, paragraph2, paragraph3].filter(Boolean).join('\n\n'), context);
    result = enforceSummaryLengthRange(result, range, context);
    return result;
}

function ensure330StyleSummaryText(rawSummary, contact, textMessages, range, userName, context = {}) {
    const normalizedRaw = normalizeSummaryText(rawSummary);
    const totalCount = Number.isFinite(Number(context.totalMessageCount))
        ? Number(context.totalMessageCount)
        : (Array.isArray(textMessages) ? textMessages.length : 0);
    const safeRange = range && typeof range === 'object'
        ? range
        : getSummaryLengthRangeByCount(totalCount, 'chat');
    const actorNames = resolveSummaryActorNames(contact, userName);
    const runtimeContext = Object.assign({}, context, {
        channel: 'chat',
        range: safeRange,
        userLabel: actorNames.userLabel,
        contactLabel: actorNames.contactLabel,
        totalMessageCount: totalCount
    });

    const payload = parse330StyleSummaryPayload(normalizedRaw);
    let summary = payload && payload.summary ? payload.summary : normalizedRaw;
    summary = normalizeSummaryParagraphText(convertLegacyTaggedSummaryToParagraph(summary), runtimeContext);
    summary = enforceSummaryLengthRange(summary, safeRange, runtimeContext);

    const validation = validate330StyleSummary(summary, runtimeContext);
    if (validation.ok) {
        console.log('[summary330_parse_ok]', {
            count: totalCount,
            detailScore: validation.detailScore,
            events: validation.stats && validation.stats.concreteEvents ? validation.stats.concreteEvents : 0
        });
        return validation.summary.trim();
    }

    console.warn('[summary330_validate_fail]', {
        reasons: validation.reasons,
        detailScore: validation.detailScore,
        stats: validation.stats
    });
    const fallback = build330StyleFallbackSummary(
        contact,
        textMessages,
        safeRange,
        actorNames.userLabel,
        Object.assign({}, runtimeContext, { aiSummary: summary })
    );
    console.log('[summary330_fallback_used]', {
        count: totalCount,
        reasons: validation.reasons
    });
    return enforceSummaryLengthRange(fallback, safeRange, runtimeContext).trim();
}

function normalizeStructuredSummaryPayload(rawPayload, context = {}) {
    if (!rawPayload || typeof rawPayload !== 'object') return null;
    const payload = Array.isArray(rawPayload)
        ? rawPayload.find(item => item && typeof item === 'object') || null
        : rawPayload;
    if (!payload) return null;

    const pickAny = (obj, keys = []) => {
        for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
        }
        return undefined;
    };

    const userLabel = String(context.userLabel || '').trim() || '用户';
    const contactLabel = String(context.contactLabel || '').trim() || '联系人';
    const fallbackActor = `${userLabel}与${contactLabel}`;

    const contextRaw = pickAny(payload, ['context', 'background', '时间与背景', '背景', '场景', 'summary_context']);
    const eventsRaw = pickAny(payload, ['timeline_events', 'timeline', 'event_timeline', 'key_events', 'events', '关键事件', '重要事件', 'event_list', 'summary_events']);
    const currentStateRaw = pickAny(payload, ['current_state', 'state', 'decision_state', 'decision', 'result', '结论', '结果', '状态', 'decisionState']);
    const nextActionsRaw = pickAny(payload, ['next_actions', 'next_steps', 'follow_ups', '后续', '后续关注', '待办', 'next', 'todo']);
    const timePointsRaw = pickAny(payload, ['time_points', 'times', '时间点', '重要时间点', 'date_points']);
    const quoteRaw = pickAny(payload, ['quote_snippets', 'quotes', 'quote_list', '原话', '引用']);
    const summaryHintRaw = pickAny(payload, ['summary_hint', 'hint', '提示', '总结提示']);
    const causesRaw = pickAny(payload, ['causes_and_emotions', 'causes', 'emotion', '原因与情绪', '原因', '情绪', 'cause_emotion']);
    const risksRaw = pickAny(payload, ['risks_and_differences', 'risks', 'differences', 'risk_points', '问题卡点', '分歧风险', '风险', '分歧', '卡点']);

    let eventList = [];
    if (Array.isArray(eventsRaw)) {
        eventList = eventsRaw.map(item => normalizeStructuredEventItem(item, fallbackActor)).filter(Boolean);
    } else if (typeof eventsRaw === 'string') {
        eventList = normalizeSummaryListValue(eventsRaw).map(item => normalizeStructuredEventItem(item, fallbackActor)).filter(Boolean);
    } else if (eventsRaw && typeof eventsRaw === 'object') {
        eventList = [normalizeStructuredEventItem(eventsRaw, fallbackActor)].filter(Boolean);
    }

    const timelineEvents = eventList
        .map(item => Object.assign({}, item, {
            event: String(item.event || `${item.actor || fallbackActor}${item.action || '提到'}${item.object || '相关事项'}`).replace(/\s+/g, ' ').trim()
        }))
        .filter(item => item.event);

    let currentState = String(currentStateRaw || '').replace(/\s+/g, ' ').trim();
    if (!currentState && typeof payload.summary === 'string') {
        currentState = String(payload.summary || '').replace(/\s+/g, ' ').trim();
    }
    const summaryContext = String(contextRaw || '').replace(/\s+/g, ' ').trim();
    const causesAndEmotions = String(causesRaw || '').replace(/\s+/g, ' ').trim();
    const risksAndDifferences = String(risksRaw || '').replace(/\s+/g, ' ').trim();

    const nextActions = normalizeSummaryListValue(nextActionsRaw)
        .map(item => item.replace(/^[\-*\d.)、\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 5);

    const extractedFromState = extractAbsoluteTimePointsFromText(currentState);
    const extractedFromContext = extractAbsoluteTimePointsFromText(summaryContext);
    const timePoints = Array.from(new Set([
        ...normalizeSummaryListValue(timePointsRaw),
        ...timelineEvents.map(item => String(item.time || '').trim()).filter(Boolean),
        ...extractedFromState,
        ...extractedFromContext
    ])).slice(0, 8);

    let quoteSnippets = normalizeSummaryQuoteSnippets(quoteRaw);
    if (quoteSnippets.length === 0 && timelineEvents.length > 0) {
        quoteSnippets = timelineEvents
            .map(item => ensureQuotedSnippet(item.evidence))
            .filter(Boolean)
            .slice(0, SUMMARY_STRUCTURED_POLICY.maxQuotes);
    }

    const summaryHint = String(summaryHintRaw || '').replace(/\s+/g, ' ').trim();
    const prunedEvents = timelineEvents.slice(0, SUMMARY_STRUCTURED_POLICY.maxEvents);
    const prunedActions = nextActions.slice(0, 4);
    return {
        context: summaryContext,
        timeline_events: prunedEvents,
        current_state: currentState,
        next_actions: prunedActions,
        time_points: timePoints,
        quote_snippets: quoteSnippets,
        summary_hint: summaryHint,
        // backward compatibility for old call sites
        key_events: prunedEvents,
        decision_state: currentState,
        next_steps: prunedActions,
        causes_and_emotions: causesAndEmotions,
        risks_and_differences: risksAndDifferences,
        decision: currentState
    };
}

function isVagueEventSentence(text) {
    const value = String(text || '').replace(/\s+/g, '');
    if (!value) return true;
    if (value.length < 6) return true;
    const vaguePatterns = [
        /双方.*沟通/,
        /进行了.*沟通/,
        /交换了.*信息/,
        /保持联系/,
        /有进展/,
        /持续推进/,
        /讨论了一下/,
        /聊了很多/,
        /沟通了很多/,
        /情况复杂/,
        /继续跟进/,
        /后续关注/
    ];
    return vaguePatterns.some(pattern => pattern.test(value));
}

function isConcreteEventSentence(text) {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    if (!value || isVagueEventSentence(value)) return false;
    const actionPattern = /(点了|下单|买了|送了|安排|约了|通话|打电话|视频|见面|生病|发烧|感冒|复习|备考|考试|出差|旅行|外地|焦虑|低落|道歉|确认|完成|取消|失败|成功|转账|付款|礼物|外卖|礼品卡|睡觉|下课|上课|回家|赶路|请假|加班|讨论|沟通|推进|回复|等待|准备|提交|修改|上传|核对|支付)/;
    if (!actionPattern.test(value)) return false;
    if (countSummaryChars(value) < 10) return false;
    const objectPattern = /(礼物|餐|外卖|花束|礼品卡|地点|时间|计划|事项|问题|订单|进度|回复|考试|复习|出差|旅行|通话|视频|消息|资料|文件|任务|付款|转账|状态|安排|结论|待办|关注点|名称)/;
    if (objectPattern.test(value)) return true;
    return /(确认|完成|解决|安排|推进|等待|回复).{2,18}/.test(value);
}

function isActionableNextStepSentence(text, context = {}) {
    const value = String(text || '').replace(/\s+/g, ' ').trim();
    if (!value) return false;
    const userLabel = String(context.userLabel || '').trim();
    const contactLabel = String(context.contactLabel || '').trim();
    const subjectPattern = new RegExp(
        [userLabel, contactLabel, '用户', '联系人', '双方', '对方', '他', '她', '由', '需', '将']
            .map(escapeRegexForSummary)
            .filter(Boolean)
            .join('|')
    );
    const actionPattern = /(后续|下一步|待办|需要|建议|计划|安排|跟进|确认|完成|回复|提交|准备|联系|通知|发送|回传|处理|推进|核对|购买|下单)/;
    const timeOrConditionPattern = /(\d{4}年\d{1,2}月\d{1,2}日|今天|明天|今晚|本周|下周|前|后|尽快|完成后|收到后|确认后)/;
    return subjectPattern.test(value) && actionPattern.test(value) && timeOrConditionPattern.test(value);
}

function inferSummaryCauseAndEmotionFromMessages(messages, userLabel, contactLabel, decisionState = '') {
    const list = Array.isArray(messages) ? messages.slice(-24) : [];
    const topicText = inferSummaryTopic(list, userLabel, contactLabel);
    let causeSnippet = '';
    let causeActor = `${userLabel}与${contactLabel}`;
    let emotionSnippet = '';
    let emotionActor = `${userLabel}与${contactLabel}`;
    list.forEach(msg => {
        const raw = normalizeSummarySourceMessage(msg && msg.content ? msg.content : '');
        if (!raw || isLowInfoSummaryMessage(raw)) return;
        const actor = msg && msg.role === 'user' ? userLabel : contactLabel;
        if (!causeSnippet && /(因为|所以|导致|担心|怕|压力|忙|加班|生病|考试|出差|没回|未回复|延迟|冲突|分歧|误会|预算|时间|安排|卡住|来不及)/.test(raw)) {
            causeSnippet = summarizeEventText(raw, 30);
            causeActor = actor;
        }
        if (!emotionSnippet && /(生气|焦虑|担心|难受|失落|开心|高兴|不安|紧张|疲惫|烦|委屈|感动|期待|抱歉|道歉|谨慎)/.test(raw)) {
            emotionSnippet = summarizeEventText(raw, 26);
            emotionActor = actor;
        }
    });

    const causeText = causeSnippet
        ? `${causeActor}提到${causeSnippet}`
        : `双方在${topicText}上的时间安排与信息同步节奏不一致`;
    const emotionText = emotionSnippet
        ? `${emotionActor}表现出${emotionSnippet}`
        : `${userLabel}与${contactLabel}在推进节奏上存在情绪压力与期待落差`;
    const decisionHint = decisionState && !isVagueEventSentence(decisionState)
        ? `，这直接影响了“${stateExtractPreviewText(decisionState, 24)}”的形成`
        : '';
    return `导致当前状态的主要原因是${causeText}；沟通过程中${emotionText}${decisionHint}。`;
}

function inferSummaryRiskFromMessages(messages, userLabel, contactLabel) {
    const list = Array.isArray(messages) ? messages.slice(-24) : [];
    const merged = list.map(msg => normalizeSummarySourceMessage(msg && msg.content || '')).join(' ');
    if (/没回|未回复|没有回应|稍后|晚点|回头再说|先这样|等等看|改天|待定|不确定/.test(merged)) {
        return `当前卡点是回复与确认时点不稳定，若${contactLabel}未在约定时间内回传信息，将影响后续执行。`;
    }
    if (/预算|太贵|没钱|付款|转账|价格|费用/.test(merged)) {
        return `当前风险集中在预算与支付安排，若双方未统一金额区间，事项可能继续延后。`;
    }
    if (/出差|旅行|赶路|考试|复习|加班|请假|生病|发烧|不舒服/.test(merged)) {
        return `当前分歧点在行程与精力窗口，若时间继续冲突，既定安排可能无法按期落地。`;
    }
    if (/生气|吵|误会|不理解|分歧|争执|冷战/.test(merged)) {
        return `当前风险在沟通分歧尚未完全对齐，若没有明确确认机制，容易再次引发误解。`;
    }
    const topicText = inferSummaryTopic(list, userLabel, contactLabel);
    return `当前卡点是${topicText}仍缺少最终确认节点，若关键细节不闭环，执行会继续拖延。`;
}

function buildSummaryActionableNextStepsFromMessages(messages, userLabel, contactLabel, timePoints = []) {
    const result = [];
    const baseTime = Array.isArray(timePoints) && timePoints.length > 0
        ? String(timePoints[timePoints.length - 1] || '').trim()
        : '';
    const deadline = baseTime || '明天20:00前';
    result.push(`${userLabel}需在${deadline}整理并发送本轮最终确认项（时间、地点、对象/事项）给${contactLabel}。`);
    result.push(`${contactLabel}需在收到后30分钟内回复可执行结果或阻塞原因，避免事项悬而未决。`);

    const exactNames = extractExactNamesFromMessages(messages);
    if (exactNames.length > 0) {
        result.push(`双方后续执行时需逐字核对具体名称：${exactNames.join(' / ')}。`);
    }
    return result.slice(0, 4);
}

function buildStructuredSummaryPrompt(context = {}) {
    const userLabel = String(context.userLabel || '用户').trim() || '用户';
    const contactLabel = String(context.contactLabel || '联系人').trim() || '联系人';
    const range = context.range && typeof context.range === 'object' ? context.range : { target: 280, min: 180, max: 420 };
    const detailModeHint = String(context.detailModeHint || '').trim();
    const referenceTime = `${context.dateStr || ''} ${context.timeStr || ''}`.trim();
    const channel = context.channel === 'call'
        ? '通话'
        : (context.channel === 'meeting' ? '见面' : '聊天');
    const totalMessageCount = Number.isFinite(Number(context.totalMessageCount)) ? Number(context.totalMessageCount) : 0;
    const minEvents = getTimelineMinEvents(totalMessageCount);
    const minNextActions = SUMMARY_STRUCTURED_POLICY.minNextActions;
    const requiredSlots = SUMMARY_STRUCTURED_POLICY.requiredSlots.join(', ');

    return `你是一个${channel}记录总结助手。请把记录内容总结为“第三视角时间线事实草稿(JSON)”，用于后续渲染成长段自然段。
${detailModeHint}

输出必须严格遵守以下规则：
1. 使用第三视角，主体名称必须使用“${userLabel}”与“${contactLabel}”。
2. 禁止第一视角（不要出现“我/我们/咱”）。
3. 风格必须像“会议纪要/备忘录/要点记录”，禁止空话，禁止抒情散文。
4. 只能输出一个 JSON 对象；禁止输出 Markdown、解释文字、代码块、自然段。
5. JSON 必须包含并填充以下字段：${requiredSlots}。
6. timeline_events 至少 ${minEvents} 条，最多 ${SUMMARY_STRUCTURED_POLICY.maxEvents} 条；每条必须包含 actor、event（完整事件句）、time，可选 action/object/evidence；event 必须能回答“谁在何时做了什么”，且每条 time 都必须是明确时间，不能留空、不能只写“后来/当时/那天”。
7. current_state 必须写清当前进展或结论；next_actions 至少 ${minNextActions} 条，且每条可执行（责任人 + 动作 + 时间/条件）。
8. time_points 至少 1 条绝对时间（YYYY年MM月DD日 HH:mm）；将“今天/刚才/昨天”等相对时间换算为绝对时间。若原记录里已有精确消息时间，优先保留到分钟。
9. quote_snippets 允许 0~${SUMMARY_STRUCTURED_POLICY.maxQuotes} 条，优先抽取原话短句（有助于还原细节）。
10. 涉及具体名称（礼物、餐品、地点、人名）逐字保留，禁止杜撰。
11. 禁止使用“持续沟通/有进展/聊了很多/保持联系/情况复杂”这类空泛句作为核心事件。
12. 目标字数约 ${range.target} 字（允许 ${range.min}~${range.max} 字），用于 summary_hint 与后续渲染控制。

JSON 格式示例（键名必须一致）：
{
  "context":"2026年03月06日晚，${userLabel}与${contactLabel}围绕周末见面安排沟通。",
  "timeline_events": [
    {"time":"2026年03月06日 20:30","actor":"${userLabel}","action":"提出","object":"周六19:30在XX商场见面","event":"${userLabel}提出周六19:30在XX商场见面。","evidence":"周六晚上七点半在商场碰面吧"},
    {"time":"2026年03月06日 20:36","actor":"${contactLabel}","action":"调整","object":"将见面时间改到20:00","event":"${contactLabel}将见面时间调整到20:00。","evidence":"我下课晚一点，8点到可以吗"},
    {"time":"2026年03月06日 20:40","actor":"${userLabel}","action":"确认","object":"礼物改为礼品卡并保留花束","event":"${userLabel}确认礼物改为礼品卡并保留花束。","evidence":"那就礼品卡+花束，我来买"}
  ],
  "current_state":"当前已确认见面时间窗口与礼物方案，地点仍待最终敲定。",
  "next_actions":["${userLabel}在2026年03月07日 19:00前发送最终地点","${contactLabel}在收到后30分钟内确认是否可执行"],
  "time_points":["2026年03月06日 20:30","2026年03月07日 19:00"],
  "quote_snippets":["“我下课晚一点，8点到可以吗”","“那就礼品卡+花束，我来买”"],
  "summary_hint":"可选：用于渲染时的补充提示"
}

参考时间：${referenceTime}
对话双方：${userLabel} 与 ${contactLabel}
本次统计消息总条数：${totalMessageCount}`;
}

function parseStructuredSummaryPayload(rawText, context = {}) {
    const parsed = parseJsonFromPossibleText(rawText);
    if (!parsed) return null;
    return normalizeStructuredSummaryPayload(parsed, context);
}

function validateStructuredSummaryPayload(payload, context = {}) {
    const normalized = normalizeStructuredSummaryPayload(payload, context);
    const reasons = [];
    if (!normalized) {
        reasons.push('payload_not_object');
        return { ok: false, reasons, payload: null, detailScore: 0 };
    }

    const eventList = Array.isArray(normalized.timeline_events) ? normalized.timeline_events : [];
    const concreteEvents = eventList.filter(item => {
        const actor = String(item.actor || '').trim();
        const event = String(item.event || '').trim();
        const fallback = `${actor}${String(item.action || '').trim()}${String(item.object || '').trim()}`;
        const sentence = event || fallback;
        return sentence && isConcreteEventSentence(sentence);
    });
    const requiredEvents = getTimelineMinEvents(context.totalMessageCount);
    if (concreteEvents.length < requiredEvents) reasons.push('insufficient_concrete_events');

    const contextLine = String(normalized.context || '').trim();
    if (contextLine && isVagueEventSentence(contextLine)) reasons.push('vague_context');

    const currentState = String(normalized.current_state || normalized.decision_state || normalized.decision || '').trim();
    if (!currentState || currentState.length < 8 || isVagueEventSentence(currentState)) reasons.push('invalid_current_state');
    if (/(^|[，。！？\s、])(我|我们|咱|咱们)(?=[，。！？\s、]|$)/.test(currentState)) reasons.push('first_person_detected');

    const nextActions = Array.isArray(normalized.next_actions)
        ? normalized.next_actions.filter(Boolean)
        : (Array.isArray(normalized.next_steps) ? normalized.next_steps.filter(Boolean) : []);
    const userLabel = String(context.userLabel || '').trim();
    const contactLabel = String(context.contactLabel || '').trim();
    const subjectRegexSource = [
        [userLabel, contactLabel, '用户', '联系人', '双方', '对方', '他', '她', '由', '需', '将']
            .map(escapeRegexForSummary).filter(Boolean).join('|')
    ].join('|');
    const subjectPattern = new RegExp(subjectRegexSource || '用户|联系人|双方');
    const actionableNext = nextActions.filter(step => {
        const value = String(step || '').trim();
        return /(后续|下一步|待办|需要|建议|计划|安排|跟进|确认|完成|回复|提交|准备|联系|通知|发送|回传|处理|推进|核对|改为|补充)/.test(value) &&
            subjectPattern.test(value) &&
            /(\d{4}年\d{1,2}月\d{1,2}日|今天|明天|今晚|本周|下周|前|后|尽快|完成后|收到后|确认后|若|如果)/.test(value);
    });
    if (nextActions.length < SUMMARY_STRUCTURED_POLICY.minNextActions || actionableNext.length < SUMMARY_STRUCTURED_POLICY.minNextActions) {
        reasons.push('insufficient_next_actions');
    }

    const hasEventTime = concreteEvents.some(item => String(item.time || '').trim());
    const hasTimePoint = Array.isArray(normalized.time_points) && normalized.time_points.some(Boolean);
    if (!hasEventTime && !hasTimePoint) reasons.push('missing_time_points');

    const quoteSnippets = Array.isArray(normalized.quote_snippets) ? normalized.quote_snippets.filter(Boolean) : [];
    const nameCandidates = Array.isArray(context.textMessages)
        ? extractExactNamesFromMessages(context.textMessages)
        : [];
    const eventTextJoined = concreteEvents
        .map(item => String(item.event || `${item.actor || ''}${item.action || ''}${item.object || ''}`))
        .join(' ');
    const nameHits = nameCandidates.filter(name => eventTextJoined.includes(name)).length;

    const hardFailReasons = reasons.filter(reason =>
        reason === 'payload_not_object' ||
        reason === 'insufficient_concrete_events' ||
        reason === 'invalid_current_state' ||
        reason === 'insufficient_next_actions' ||
        reason === 'first_person_detected'
    );
    const detailScore = Math.max(0, Math.min(100,
        Math.round(
            Math.min(45, concreteEvents.length * 12) +
            (hasEventTime || hasTimePoint ? 15 : 0) +
            Math.min(15, quoteSnippets.length * 6) +
            (actionableNext.length > 0 ? 15 : 0) +
            Math.min(10, nameHits * 5)
        )
    ));

    return {
        ok: hardFailReasons.length === 0,
        reasons,
        payload: normalized,
        detailScore,
        stats: {
            events: eventList.length,
            concreteEvents: concreteEvents.length,
            contextLength: contextLine.length,
            currentStateLength: currentState.length,
            nextActions: nextActions.length,
            actionableNext: actionableNext.length,
            timePoints: Array.isArray(normalized.time_points) ? normalized.time_points.length : 0,
            quotes: quoteSnippets.length,
            nameHits
        }
    };
}

function extractExactNamesFromMessages(messages = []) {
    let exactNames = [];
    const list = Array.isArray(messages) ? messages.filter(Boolean) : [];
    list.forEach(msg => {
        const content = String(msg && msg.content ? msg.content : '');
        if (typeof window.extractSpecificNamesFromUserText === 'function') {
            const extracted = window.extractSpecificNamesFromUserText(content);
            if (Array.isArray(extracted) && extracted.length > 0) exactNames = exactNames.concat(extracted);
        }
        const quoted = extractQuoteNames(content);
        if (quoted.length > 0) exactNames = exactNames.concat(quoted);
    });
    return normalizeExactNames(exactNames).slice(0, 8);
}

function repairStructuredPayloadFromMessages(contact, textMessages, payload, context = {}) {
    const actorNames = resolveSummaryActorNames(contact, context.userLabel || '用户');
    const userLabel = actorNames.userLabel;
    const contactLabel = actorNames.contactLabel;
    const list = Array.isArray(textMessages) ? textMessages.filter(Boolean) : [];
    const normalized = normalizeStructuredSummaryPayload(payload || {}, { userLabel, contactLabel }) || {
        context: '',
        timeline_events: [],
        current_state: '',
        next_actions: [],
        time_points: [],
        quote_snippets: [],
        summary_hint: '',
        key_events: [],
        decision_state: '',
        next_steps: [],
        decision: '',
        causes_and_emotions: '',
        risks_and_differences: ''
    };

    const requiredEvents = getTimelineMinEvents(context.totalMessageCount || list.length);
    const rawEvents = Array.isArray(normalized.timeline_events) ? normalized.timeline_events.filter(Boolean) : [];
    let events = rawEvents.filter(item => {
        const line = String(item.event || `${item.actor || ''}${item.action || ''}${item.object || ''}`).trim();
        return line && isConcreteEventSentence(line);
    });
    if (rawEvents.length > events.length) {
        console.log('[minutes_vague_drop]', {
            channel: context.channel || 'chat',
            dropped: rawEvents.length - events.length
        });
    }

    if (events.length < requiredEvents) {
        const extracted = extractTimelineEventsFromMessages(list, userLabel, contactLabel, {
            minEvents: requiredEvents,
            maxEvents: SUMMARY_STRUCTURED_POLICY.maxEvents
        });
        extracted.forEach(item => {
            if (events.length >= SUMMARY_STRUCTURED_POLICY.maxEvents) return;
            const line = String(item.event || `${item.actor || ''}${item.action || ''}${item.object || ''}`).trim();
            if (!line || !isConcreteEventSentence(line)) return;
            events.push(item);
        });
    }

    if (events.length < requiredEvents) {
        list.slice(-14).forEach(msg => {
            if (events.length >= requiredEvents) return;
            const raw = String(msg && msg.content ? msg.content : '').trim();
            if (!raw || isLowInfoSummaryMessage(raw)) return;
            const actor = msg && msg.role === 'user' ? userLabel : contactLabel;
            const eventLine = summarizeEventText(raw, 34) || raw.slice(0, 34);
            if (!isConcreteEventSentence(eventLine)) return;
            events.push({
                actor,
                action: '提到',
                object: eventLine,
                time: msg && msg.time ? formatDateTimeForMemory(msg.time) : '',
                evidence: stateExtractPreviewText(raw, 22),
                event: `${actor}提到${eventLine}`
            });
        });
    }

    events = events
        .filter(item => {
            const line = String(item.event || `${item.actor || ''}${item.action || ''}${item.object || ''}`).trim();
            return line && isConcreteEventSentence(line);
        })
        .sort((a, b) => {
            const aTime = Date.parse(String(a.time || '').replace(/年|月/g, '-').replace(/日/g, '')) || 0;
            const bTime = Date.parse(String(b.time || '').replace(/年|月/g, '-').replace(/日/g, '')) || 0;
            return aTime - bTime;
        })
        .slice(0, SUMMARY_STRUCTURED_POLICY.maxEvents);

    let timePoints = Array.isArray(normalized.time_points) ? normalized.time_points.filter(Boolean) : [];
    if (list.length > 0) {
        const first = list[0];
        const last = list[list.length - 1];
        if (first && first.time) timePoints.push(formatDateTimeForMemory(first.time));
        if (last && last.time) timePoints.push(formatDateTimeForMemory(last.time));
    }
    events.forEach(item => {
        const t = String(item.time || '').trim();
        if (t) timePoints.push(t);
    });
    timePoints = Array.from(new Set(timePoints)).filter(Boolean).slice(0, 6);

    const topicText = inferSummaryTopic(list, userLabel, contactLabel);
    const rangeLabel = String(context.rangeLabel || '').trim();
    const rangeText = rangeLabel ? `（消息范围 ${rangeLabel}）` : '';
    if (!normalized.context || isVagueEventSentence(normalized.context)) {
        const first = list[0];
        const last = list[list.length - 1];
        const startText = first && first.time ? formatDateTimeForMemory(first.time) : '';
        const endText = last && last.time ? formatDateTimeForMemory(last.time) : '';
    if (startText && endText) {
            normalized.context = `${startText}至${endText}期间，${userLabel}与${contactLabel}围绕${topicText}展开沟通${rangeText}。`;
        } else {
            normalized.context = `${userLabel}与${contactLabel}围绕${topicText}展开沟通${rangeText}。`;
        }
    }

    const fallbackState = inferSummaryOutcomeFromMessages(list, String(context.aiSummary || ''));
    if (!normalized.current_state || isVagueEventSentence(normalized.current_state)) {
        normalized.current_state = fallbackState;
    }
    normalized.decision_state = normalized.current_state;
    normalized.decision = normalized.current_state;

    let nextActions = Array.isArray(normalized.next_actions) ? normalized.next_actions.filter(Boolean) : [];
    nextActions = nextActions.filter(step => !isVagueEventSentence(step));
    let actionable = nextActions.filter(step => isActionableNextStepSentence(step, { userLabel, contactLabel }));
    if (actionable.length < SUMMARY_STRUCTURED_POLICY.minNextActions) {
        const generated = buildSummaryActionableNextStepsFromMessages(list, userLabel, contactLabel, timePoints);
        nextActions = nextActions.concat(generated);
        actionable = nextActions.filter(step => isActionableNextStepSentence(step, { userLabel, contactLabel }));
    }
    if (actionable.length === 0) {
        nextActions.unshift(`${userLabel}需在明天20:00前发出最终确认清单，${contactLabel}在收到后30分钟内确认执行状态。`);
    }
    nextActions = Array.from(new Set(nextActions.map(item => String(item || '').trim()).filter(Boolean))).slice(0, 4);

    let quoteSnippets = Array.isArray(normalized.quote_snippets) ? normalized.quote_snippets.filter(Boolean) : [];
    quoteSnippets = quoteSnippets
        .map(item => ensureQuotedSnippet(item))
        .filter(Boolean)
        .slice(0, SUMMARY_STRUCTURED_POLICY.maxQuotes);
    if (quoteSnippets.length === 0) {
        quoteSnippets = extractQuoteSnippetsFromMessages(list, SUMMARY_STRUCTURED_POLICY.maxQuotes);
    }

    return {
        context: String(normalized.context || '').trim(),
        timeline_events: events,
        current_state: String(normalized.current_state || '').trim(),
        next_actions: nextActions.slice(0, 4),
        time_points: timePoints,
        quote_snippets: quoteSnippets,
        summary_hint: String(normalized.summary_hint || '').trim(),
        key_events: events,
        decision_state: String(normalized.current_state || '').trim(),
        next_steps: nextActions.slice(0, 4),
        decision: String(normalized.current_state || '').trim(),
        causes_and_emotions: String(normalized.causes_and_emotions || '').trim(),
        risks_and_differences: String(normalized.risks_and_differences || '').trim()
    };
}

function renderStructuredSummaryToParagraph(payload, context = {}) {
    const normalized = normalizeStructuredSummaryPayload(payload, context);
    if (!normalized) return '';
    const actorNames = resolveSummaryActorNames(context.contact || null, context.userLabel || '用户');
    const userLabel = String(context.userLabel || actorNames.userLabel || '用户').trim() || '用户';
    const contactLabel = String(context.contactLabel || actorNames.contactLabel || '联系人').trim() || '联系人';
    const list = Array.isArray(context.textMessages) ? context.textMessages.filter(Boolean) : [];
    const fallbackEvents = extractTimelineEventsFromMessages(list, userLabel, contactLabel, {
        minEvents: getTimelineMinEvents(context.totalMessageCount || list.length),
        maxEvents: SUMMARY_STRUCTURED_POLICY.maxEvents
    });
    const sourceEvents = Array.isArray(normalized.timeline_events) && normalized.timeline_events.length > 0
        ? normalized.timeline_events
        : fallbackEvents;
    const eventSentences = sourceEvents
        .map(item => {
            const actor = String(item.actor || `${userLabel}与${contactLabel}`).trim();
            const eventText = String(item.event || '').trim();
            const action = String(item.action || '提到').trim();
            const object = String(item.object || '相关事项').trim();
            const time = String(item.time || '').trim();
            const evidence = String(item.evidence || '').trim();
            const baseEvent = eventText || `${actor}${action}${object}`;
            const quoted = ensureQuotedSnippet(evidence);
            const evidenceText = quoted ? `，原话是${quoted}` : '';
            return toNarrativeSentence(`${time ? `${time}，` : ''}${baseEvent}${evidenceText}`);
        })
        .filter(sentence => isConcreteEventSentence(sentence))
        .slice(0, SUMMARY_STRUCTURED_POLICY.maxEvents);
    console.log('[timeline_event_count]', {
        channel: context.channel || 'chat',
        count: eventSentences.length
    });

    const topicText = inferSummaryTopic(list, userLabel, contactLabel);
    const rangeLabel = String(context.rangeLabel || '').trim();
    const rangeText = rangeLabel ? `（消息范围 ${rangeLabel}）` : '';
    const defaultContext = (() => {
        if (list.length > 0) {
            const first = list[0];
            const last = list[list.length - 1];
            const startText = first && first.time ? formatDateTimeForMemory(first.time) : '';
            const endText = last && last.time ? formatDateTimeForMemory(last.time) : '';
            if (startText && endText) return `${startText}至${endText}期间，${userLabel}与${contactLabel}围绕${topicText}展开沟通${rangeText}。`;
        }
        return `${userLabel}与${contactLabel}围绕${topicText}展开沟通${rangeText}。`;
    })();

    const contextLine = toNarrativeSentence(String(normalized.context || defaultContext));
    const timelineLine = toNarrativeSentence(
        buildSummaryProcessLine(eventSentences.map(item => item.replace(/[。！？!?]+$/, '').trim()).filter(Boolean))
    );
    const paragraph1 = `${contextLine}${timelineLine}`.trim();

    const currentState = toNarrativeSentence(
        String(normalized.current_state || normalized.decision_state || normalized.decision || inferSummaryOutcomeFromMessages(list, String(context.aiSummary || '')))
    );
    const nextActions = Array.isArray(normalized.next_actions) ? normalized.next_actions.filter(Boolean) : [];
    const safeActions = nextActions.length > 0
        ? nextActions
        : buildSummaryActionableNextStepsFromMessages(list, userLabel, contactLabel, normalized.time_points || []);
    const nextLine = toNarrativeSentence(`下一步是：${safeActions.join('；')}`);
    const timeLine = Array.isArray(normalized.time_points) && normalized.time_points.length > 0
        ? toNarrativeSentence(`涉及时间点：${normalized.time_points.join('；')}`)
        : '';
    const paragraph2 = `${currentState}${nextLine}${timeLine}`.trim();

    let quoteSnippets = Array.isArray(normalized.quote_snippets) ? normalized.quote_snippets.filter(Boolean) : [];
    if (quoteSnippets.length === 0) {
        quoteSnippets = extractQuoteSnippetsFromMessages(list, SUMMARY_STRUCTURED_POLICY.maxQuotes);
    } else {
        quoteSnippets = quoteSnippets.map(item => ensureQuotedSnippet(item)).filter(Boolean).slice(0, SUMMARY_STRUCTURED_POLICY.maxQuotes);
    }
    console.log('[quote_injected_count]', {
        channel: context.channel || 'chat',
        count: quoteSnippets.length
    });
    const paragraph3 = quoteSnippets.length > 0
        ? toNarrativeSentence(`对话原话中出现${quoteSnippets.join('、')}，这些表述直接对应了双方当时的实际意图与执行细节`)
        : '';

    const paragraphs = [paragraph1, paragraph2, paragraph3];
    return normalizeSummaryParagraphText(paragraphs.filter(Boolean).join('\n\n'), context);
}

function buildNarrativeSummaryFromStructuredResponse(rawSummary, contact, textMessages, range, userName, context = {}) {
    const actorNames = resolveSummaryActorNames(contact, userName);
    const runtimeContext = Object.assign({}, context, {
        contact,
        userLabel: actorNames.userLabel,
        contactLabel: actorNames.contactLabel,
        textMessages: Array.isArray(textMessages) ? textMessages : []
    });

    let payload = parseStructuredSummaryPayload(rawSummary, runtimeContext);
    if (payload) {
        console.log('[minutes_parse_ok]', {
            channel: runtimeContext.channel || 'chat',
            eventCount: Array.isArray(payload.timeline_events) ? payload.timeline_events.length : 0,
            hasState: !!String(payload.current_state || payload.decision_state || payload.decision || '').trim(),
            nextCount: Array.isArray(payload.next_actions) ? payload.next_actions.length : 0,
            quoteCount: Array.isArray(payload.quote_snippets) ? payload.quote_snippets.length : 0
        });
    }

    let validation = validateStructuredSummaryPayload(payload, runtimeContext);
    if (!validation.ok) {
        console.warn('[minutes_validate_fail]', {
            channel: runtimeContext.channel || 'chat',
            reasons: validation.reasons
        });
        payload = repairStructuredPayloadFromMessages(contact, textMessages, payload, Object.assign({}, runtimeContext, {
            aiSummary: rawSummary
        }));
        validation = validateStructuredSummaryPayload(payload, runtimeContext);
        console.log('[minutes_repair_used]', {
            channel: runtimeContext.channel || 'chat',
            repairedEventCount: Array.isArray(payload && payload.timeline_events) ? payload.timeline_events.length : 0,
            repairedNextCount: Array.isArray(payload && payload.next_actions) ? payload.next_actions.length : 0,
            reasonsAfterRepair: validation.reasons,
            detailScore: validation.detailScore
        });
    }

    const rendered = renderStructuredSummaryToParagraph(payload, runtimeContext);
    return {
        payload,
        validation,
        paragraph: normalizeSummaryParagraphText(rendered, runtimeContext)
    };
}

function stripSummaryLinePrefix(line) {
    let text = String(line || '').trim();
    text = text.replace(/^\s*【[^】]{1,16}】\s*/, '');
    text = text.replace(/^\s*(时间与背景|关键经过|结果与状态|后续关注)\s*[:：]\s*/, '');
    return text.trim();
}

function normalizeSummaryText(rawText) {
    return String(rawText || '')
        .replace(/```json/gi, '')
        .replace(/```text/gi, '')
        .replace(/```/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .join('\n')
        .trim();
}

function countSummarySections(text) {
    const value = String(text || '');
    let count = 0;
    ['时间与背景', '关键经过', '结果与状态', '后续关注'].forEach(section => {
        if (value.includes(`【${section}】`)) count++;
    });
    return count;
}

function escapeRegexForSummary(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function splitNarrativeSentences(text) {
    const normalized = String(text || '').replace(/\n+/g, ' ').trim();
    if (!normalized) return [];
    const matches = normalized.match(/[^。！？!?]+[。！？!?]?/g);
    return (matches || [])
        .map(item => String(item || '').trim())
        .filter(Boolean);
}

function toNarrativeSentence(text) {
    let value = stripSummaryLinePrefix(text);
    value = value.replace(/^\s*[，,。；;:：\s]+/, '').trim();
    value = value.replace(/\s+/g, ' ').trim();
    if (!value) return '';
    if (!/[。！？!?]$/.test(value)) value += '。';
    return value;
}

function convertLegacyTaggedSummaryToParagraph(rawText) {
    const normalized = normalizeSummaryText(rawText);
    if (!normalized) return '';
    const lines = normalized.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return '';
    const sections = { background: '', process: '', result: '', follow: '' };
    let hasLegacyTag = false;
    lines.forEach(line => {
        if (/^\s*(【?\s*时间与背景\s*】?|时间与背景\s*[:：])/.test(line)) {
            sections.background = stripSummaryLinePrefix(line);
            hasLegacyTag = true;
            return;
        }
        if (/^\s*(【?\s*关键经过\s*】?|关键经过\s*[:：])/.test(line)) {
            sections.process = stripSummaryLinePrefix(line);
            hasLegacyTag = true;
            return;
        }
        if (/^\s*(【?\s*结果与状态\s*】?|结果与状态\s*[:：])/.test(line)) {
            sections.result = stripSummaryLinePrefix(line);
            hasLegacyTag = true;
            return;
        }
        if (/^\s*(【?\s*后续关注\s*】?|后续关注\s*[:：])/.test(line)) {
            sections.follow = stripSummaryLinePrefix(line);
            hasLegacyTag = true;
        }
    });
    if (!hasLegacyTag) return normalized;
    const paragraph1 = [sections.background, sections.process].map(toNarrativeSentence).filter(Boolean).join('');
    const paragraph2 = [sections.result, sections.follow].map(toNarrativeSentence).filter(Boolean).join('');
    return [paragraph1, paragraph2].filter(Boolean).join('\n\n').trim();
}

function normalizeSummaryParagraphText(rawText, context = {}) {
    let text = String(rawText || '')
        .replace(/```json/gi, '')
        .replace(/```text/gi, '')
        .replace(/```/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim();
    if (!text) return '';

    const paragraphs = text.split(/\n+/)
        .map(line => String(line || '').trim())
        .filter(Boolean)
        .map(line => {
            let value = line;
            value = value.replace(/^\s*#{1,6}\s*/, '');
            value = value.replace(/^\s*(?:[-*•]|\d+[.)]|[（(]?[一二三四五六七八九十]+[、.)）])\s*/, '');
            value = value.replace(/\*\*(.*?)\*\*/g, '$1');
            value = value.replace(/`([^`]+)`/g, '$1');
            value = value.replace(/^\s*(摘要|总结|结论|说明)\s*[:：]\s*/, '');
            value = stripSummaryLinePrefix(value);
            value = value.replace(/^\s*[“"']+/, '').replace(/[”"']+\s*$/, '');
            value = value.replace(/\s+/g, ' ').trim();
            return value;
        })
        .filter(Boolean);
    if (paragraphs.length === 0) return '';
    return paragraphs.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

function isWeakNarrativeSummary(text, context = {}) {
    const normalized = normalizeSummaryParagraphText(text, context);
    if (!normalized) return true;
    if (/^无[。.!！？?]?$/.test(normalized)) return true;

    const minByRange = context && context.range && Number.isFinite(Number(context.range.min))
        ? Math.max(96, Math.floor(Number(context.range.min) * 0.72))
        : 96;
    if (countSummaryChars(normalized) < minByRange) return true;

    if (/(^|[，。！？\s、])(我|我们|咱|咱们)(?=[，。！？\s、]|$)/.test(normalized)) return true;

    const actorMarks = ['用户', '联系人', '对方', '我', '你'];
    const userLabel = String(context.userLabel || '').trim();
    const contactLabel = String(context.contactLabel || '').trim();
    if (userLabel) actorMarks.push(userLabel);
    if (contactLabel) actorMarks.push(contactLabel);
    const actorPattern = actorMarks.map(escapeRegexForSummary).filter(Boolean).join('|');
    if (actorPattern) {
        const dialogueRegex = new RegExp(`(^|\\n)\\s*(?:${actorPattern})\\s*[:：]`, 'm');
        if (dialogueRegex.test(normalized)) return true;
    }

    const sentenceList = splitNarrativeSentences(normalized);
    if (sentenceList.length < 3) return true;
    const requiredEvents = getTimelineMinEvents(context.totalMessageCount || 0);
    const concreteEvents = sentenceList.filter(sentence => isConcreteEventSentence(sentence));
    if (concreteEvents.length < requiredEvents) return true;

    const statePattern = /(当前|目前|结论|状态|已|待|仍|确认|完成|推进|搁置|取消|成功|失败|未回复|待确认|进展)/;
    if (!sentenceList.some(sentence => statePattern.test(sentence))) return true;

    const hasActionableNextStep = sentenceList.some(sentence =>
        isActionableNextStepSentence(sentence, {
            userLabel: context.userLabel || '',
            contactLabel: context.contactLabel || ''
        })
    );
    if (!hasActionableNextStep) return true;

    const hasActorNames = [userLabel, contactLabel]
        .filter(Boolean)
        .some(name => normalized.includes(name));
    if (!hasActorNames) return true;

    const vagueCount = sentenceList.filter(sentence => isVagueEventSentence(sentence)).length;
    if (vagueCount > 0 && (vagueCount / sentenceList.length) > 0.35) return true;
    return false;
}

function enforceSummaryLengthRange(text, range, context = {}) {
    const normalized = normalizeSummaryParagraphText(text, context);
    if (!normalized) return normalized;
    if (!range || typeof range !== 'object' || !Number.isFinite(Number(range.max))) return normalized;
    const maxChars = Math.max(40, Math.floor(Number(range.max)));
    if (countSummaryChars(normalized) <= maxChars) return normalized;

    const sentenceList = splitNarrativeSentences(normalized.replace(/\n+/g, ' '));
    const kept = [];
    for (const sentence of sentenceList) {
        const nextText = `${kept.join('')}${sentence}`;
        if (countSummaryChars(nextText) <= maxChars || kept.length === 0) {
            kept.push(sentence);
            continue;
        }
        break;
    }
    let truncated = kept.join('');
    if (!truncated) {
        truncated = Array.from(normalized).slice(0, maxChars).join('');
    }
    if (countSummaryChars(truncated) > maxChars) {
        truncated = Array.from(truncated).slice(0, maxChars).join('');
    }
    truncated = truncated.trim();
    if (truncated && !/[。！？!?]$/.test(truncated)) truncated += '。';
    return normalizeSummaryParagraphText(truncated, context);
}

function detectSummaryStateHint(text) {
    const value = String(text || '');
    if (/生病|发烧|感冒|不舒服|疼|康复|恢复/.test(value)) return '健康状态有变化';
    if (/考试|期末|备考|复习|答辩|ddl|deadline/i.test(value)) return '学习/考试进度有变化';
    if (/出差|外地|旅行|旅游|高铁|飞机|赶路/.test(value)) return '行程/出行状态有变化';
    if (/焦虑|低落|压力大|emo|崩/.test(value)) return '情绪状态有变化';
    return '当前暂无明确的结束信号，状态按持续处理';
}

function normalizeSummarySourceMessage(text) {
    return String(text || '')
        .replace(/\s+/g, ' ')
        .replace(/[“”"'`]/g, '')
        .trim();
}

function extractQuoteSnippetsFromMessages(messages = [], maxQuotes = 3) {
    const list = Array.isArray(messages) ? messages.filter(Boolean) : [];
    if (list.length === 0) return [];
    const quoteSet = new Set();
    const result = [];
    const pushQuote = (value) => {
        const normalized = ensureQuotedSnippet(value);
        if (!normalized) return;
        if (quoteSet.has(normalized)) return;
        quoteSet.add(normalized);
        result.push(normalized);
    };

    list.slice(-80).forEach(msg => {
        const raw = String(msg && msg.content ? msg.content : '').trim();
        if (!raw) return;
        const quoteMatches = raw.match(/[“"「『][^“”"「」『』]{2,40}[”"」』]/g) || [];
        quoteMatches.forEach(item => pushQuote(item));
    });

    if (result.length < maxQuotes) {
        list.slice(-80).forEach(msg => {
            const raw = String(msg && msg.content ? msg.content : '').trim();
            if (!raw || isLowInfoSummaryMessage(raw)) return;
            if (raw.length > 28) return;
            if (!/(改|定|到|约|买|发|回|收|见|等|确认|完成|取消|晚点|现在|明天|今天)/.test(raw)) return;
            pushQuote(raw);
        });
    }
    return result.slice(0, Math.max(1, maxQuotes));
}

function extractTimelineEventsFromMessages(messages, userName, contactName, options = {}) {
    const source = Array.isArray(messages) ? messages.filter(Boolean) : [];
    if (source.length === 0) return [];
    const maxEvents = Number.isFinite(Number(options.maxEvents))
        ? Math.max(2, Math.round(Number(options.maxEvents)))
        : SUMMARY_STRUCTURED_POLICY.maxEvents;
    const minEvents = Number.isFinite(Number(options.minEvents))
        ? Math.max(2, Math.round(Number(options.minEvents)))
        : SUMMARY_STRUCTURED_POLICY.minEvents;

    const actionPattern = /(改到|改成|约了?|安排|确认|完成|取消|补发|下单|点了?|买了?|送了?|见面|通话|打电话|视频|回复|回传|等待|推进|提交|联系|通知|付款|转账|收到了?|发了?|准备|出发|到达|回家|上课|下课|复习|备考|考试|出差|旅行|生病|恢复)/;
    const timePattern = /(\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?|今天|明天|今晚|刚才|稍后|本周|下周)/;
    const signalPattern = /(然后|随后|之后|最后|已经|还没|先|再|因为|所以|如果|那就|改为|改成)/;
    const shortWhitelist = new Set(['到', '改', '定', '行', '好', '可', '已买', '收到了', '已到', '已发', '改周六', '改晚上']);
    const seen = new Set();
    const picked = [];

    source.slice(-120).forEach((msg, idx) => {
        const raw = String(msg && msg.content ? msg.content : '').trim();
        if (!raw) return;
        const actor = msg && msg.role === 'user' ? userName : contactName;
        const baseTime = msg && msg.time ? Number(msg.time) : (Date.now() + idx);
        const timeText = msg && msg.time ? formatDateTimeForMemory(msg.time) : '';

        const parts = raw
            .split(/[。！？!?；;\n]/)
            .map(item => String(item || '').trim())
            .filter(Boolean);
        const candidates = parts.length > 0 ? parts : [raw];

        candidates.forEach(part => {
            const cleaned = normalizeSummarySourceMessage(part);
            if (!cleaned) return;
            if (!shortWhitelist.has(cleaned) && isLowInfoSummaryMessage(cleaned)) return;
            const key = `${actor}-${cleaned}`.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);

            let score = 0;
            if (actionPattern.test(cleaned)) score += 3;
            if (timePattern.test(cleaned)) score += 2;
            if (signalPattern.test(cleaned)) score += 1;
            if (cleaned.length >= 2 && cleaned.length <= 40) score += 1;
            if (/["“「『].+["”」』]/.test(part)) score += 1;
            if (shortWhitelist.has(cleaned)) score += 2;
            if (score < 2) return;

            const evidence = stateExtractPreviewText(raw, 24);
            const snippet = summarizeEventText(cleaned, 40) || cleaned;
            const eventText = `${actor}${/^(提到|表示|说)/.test(snippet) ? '' : '提到'}${snippet}`;
            if (!isConcreteEventSentence(eventText) && !isConcreteEventSentence(snippet)) return;

            let action = '提到';
            const actionMatched = cleaned.match(actionPattern);
            if (actionMatched) action = actionMatched[0];
            const objectText = cleaned.replace(action, '').replace(/^[，,、\s]+/, '').trim() || cleaned;
            picked.push({
                actor,
                action,
                object: objectText,
                time: timeText,
                evidence,
                event: eventText,
                score,
                ts: baseTime
            });
        });
    });

    if (picked.length === 0) return [];
    const selected = picked
        .sort((a, b) => b.score - a.score || a.ts - b.ts)
        .slice(0, Math.max(maxEvents + 2, minEvents + 1))
        .sort((a, b) => a.ts - b.ts)
        .slice(0, maxEvents);
    return selected.map(item => ({
        actor: item.actor,
        action: item.action,
        object: item.object,
        time: item.time,
        evidence: item.evidence,
        event: item.event
    }));
}

function isLowInfoSummaryMessage(text) {
    const value = normalizeSummarySourceMessage(text);
    if (!value) return true;
    const shortWhitelist = new Set(['到', '改', '定', '行', 'ok', 'OK', '已买', '收到了', '已发', '改周六', '改晚上']);
    if (shortWhitelist.has(value)) return false;
    if (value.length < 2) return true;
    if (/^[\s,.，。!?！？、;；:："'`~\-_=+()（）【】\[\]<>《》]+$/.test(value)) return true;
    if (/^(嗯+|哦+|啊+|好+|行+|哈哈+|呵呵+|在吗|收到|ok|OK|6+|666+|是吗|真的吗|知道了|晚安|早安|？|\?)$/i.test(value)) return true;
    return false;
}

function summarizeEventText(text, maxLen = 30) {
    let value = normalizeSummarySourceMessage(text);
    value = value.replace(/^(用户|联系人|对方|我|你)\s*[:：]/, '').trim();
    value = value.replace(/^(我觉得|我感觉|我想说|其实|就是说)\s*/,'').trim();
    value = value.replace(/^[,，。；;:：]+/, '').trim();
    value = value.replace(/[。]+$/,'').trim();
    return stateExtractPreviewText(value, maxLen);
}

function pickSummaryEventNarratives(messages, userName, contactName) {
    const events = extractTimelineEventsFromMessages(messages, userName, contactName, {
        minEvents: SUMMARY_STRUCTURED_POLICY.minEvents,
        maxEvents: SUMMARY_STRUCTURED_POLICY.maxEvents
    });
    return events
        .map(item => String(item.event || `${item.actor || ''}${item.action || ''}${item.object || ''}`).trim())
        .filter(Boolean);
}

function buildSummaryProcessLine(narratives = []) {
    const list = Array.isArray(narratives) ? narratives.filter(Boolean) : [];
    if (list.length === 0) return '';
    if (list.length === 1) return `${list[0]}。`;
    const limited = list.slice(0, 6);
    const merged = limited.map((item, idx) => {
        const clean = String(item || '').replace(/[。！？!?]+$/, '').trim();
        if (!clean) return '';
        if (idx === 0) return clean;
        if (idx === limited.length - 1) return `最后${clean}`;
        if (idx === 1) return `随后${clean}`;
        return `之后${clean}`;
    }).filter(Boolean);
    return `${merged.join('，')}。`;
}

function extractResultLineFromAiSummary(aiSummary = '') {
    const legacyLines = normalizeSummaryText(aiSummary).split('\n').map(line => line.trim()).filter(Boolean);
    const legacyLine = legacyLines.find(item => item.includes('【结果与状态】')) || '';
    const strippedLegacy = stripSummaryLinePrefix(legacyLine || '');
    if (strippedLegacy && !(/^\d{4}年\d{1,2}月\d{1,2}日/.test(strippedLegacy) && strippedLegacy.length <= 20)) {
        return stateExtractPreviewText(strippedLegacy, 90);
    }
    const paragraph = normalizeSummaryParagraphText(convertLegacyTaggedSummaryToParagraph(aiSummary));
    if (!paragraph) return '';
    const sentenceList = splitNarrativeSentences(paragraph);
    const resultLine = sentenceList.find(line =>
        /(确认|完成|解决|待回复|未回复|推进|分歧|结果|状态|结论|后续|跟进|已形成|暂未|仍需)/.test(line) &&
        !/(期间|背景|沟通|聊天|对话|讨论)/.test(line)
    );
    return resultLine ? stateExtractPreviewText(resultLine, 90) : '';
}

function inferSummaryOutcomeFromMessages(messages, aiSummary = '') {
    const aiLine = extractResultLineFromAiSummary(aiSummary);
    if (aiLine) return aiLine;
    const source = Array.isArray(messages) ? messages.slice(-16) : [];
    const merged = source.map(msg => normalizeSummarySourceMessage(msg && msg.content)).join(' ');
    if (!merged) return '当前结论是已形成阶段性对齐，但仍需下一轮确认后执行。';
    if (/没回|未回复|没有回应|稍后|晚点|回头再说|先这样|等等看|改天/.test(merged)) {
        return '当前结论是关键事项尚未闭环，主要受回复时点不确定影响，需等待下一次明确反馈。';
    }
    if (/确认|确定|约好|完成|解决|处理好了|收到了|已经可以|搞定了|考完|下课/.test(merged)) {
        return '当前结论是关键事项已形成明确进展，执行路径已基本确认。';
    }
    if (/生气|吵|害怕|担心|焦虑|低落|压力大|emo|难受/.test(merged)) {
        return '当前结论是情绪因素对推进节奏影响较大，后续需在安抚基础上给出可执行确认。';
    }
    return `当前结论是${detectSummaryStateHint(merged)}，但仍需补齐执行细节后再最终落地。`;
}

function inferSummaryTopic(messages, userName, contactName) {
    const source = Array.isArray(messages) ? messages.slice(-30) : [];
    const merged = source.map(msg => String(msg && msg.content || '')).join(' ');
    const names = normalizeExactNames(extractQuoteNames(merged)).slice(0, 2);
    if (names.length > 0) return `具体事项（${names.join(' / ')}）`;
    if (/外卖|下单|点了|餐|奶茶|咖啡/.test(merged)) return '外卖与日常安排';
    if (/礼物|送了|买了|花束|礼品卡/.test(merged)) return '礼物与心意表达';
    if (/通话|电话|语音|视频/.test(merged)) return '通话中的状态交流';
    if (/生病|发烧|感冒|不舒服|复习|备考|考试|出差|旅行/.test(merged)) return '近期状态与日程';
    return `${userName}与${contactName}的近期沟通`;
}

function extractQuoteNames(text) {
    const raw = String(text || '');
    const names = [];
    const regex = /[“"「『]([^“”"「」『』]{2,40})[”"」』]/g;
    let match = regex.exec(raw);
    while (match) {
        const name = cleanupExtractedName(match[1]);
        if (name) names.push(name);
        match = regex.exec(raw);
    }
    return normalizeExactNames(names);
}

function buildDetailedSummaryFallbackParagraph(contact, textMessages, range, userName, aiSummary = '', context = {}) {
    const list = Array.isArray(textMessages) ? textMessages.filter(Boolean) : [];
    if (list.length === 0) return '无';

    const actorNames = resolveSummaryActorNames(contact, userName);
    const userLabel = actorNames.userLabel;
    const contactName = actorNames.contactLabel;
    const first = list[0];
    const last = list[list.length - 1];
    const startText = formatDateTimeForMemory(first && first.time ? first.time : Date.now());
    const endText = formatDateTimeForMemory(last && last.time ? last.time : Date.now());
    const rangeLabel = String(context.rangeLabel || '').trim();
    const rangeText = rangeLabel ? `（消息范围 ${rangeLabel}）` : '';
    const topicText = inferSummaryTopic(list, userLabel, contactName);
    const line1 = `${startText}至${endText}期间，${userLabel}与${contactName}围绕${topicText}展开沟通${rangeText}`;

    const minEvents = getTimelineMinEvents(context.totalMessageCount || list.length);
    const timelineEvents = extractTimelineEventsFromMessages(list, userLabel, contactName, {
        minEvents,
        maxEvents: SUMMARY_STRUCTURED_POLICY.maxEvents
    });
    const eventNarratives = timelineEvents
        .map(item => String(item.event || `${item.actor || ''}${item.action || ''}${item.object || ''}`).trim())
        .filter(Boolean);
    let line2 = buildSummaryProcessLine(eventNarratives);
    if (!line2) {
        const hardBackup = list
            .slice(-Math.max(minEvents, 3))
            .map(msg => {
                const actor = msg && msg.role === 'user' ? userLabel : contactName;
                const raw = summarizeEventText(String(msg && msg.content || ''), 30);
                return raw ? `${actor}提到${raw}` : '';
            })
            .filter(Boolean);
        line2 = buildSummaryProcessLine(hardBackup);
    }

    const decisionLine = inferSummaryOutcomeFromMessages(list, aiSummary);

    let timePoints = [];
    if (first && first.time) timePoints.push(formatDateTimeForMemory(first.time));
    if (last && last.time) timePoints.push(formatDateTimeForMemory(last.time));
    timelineEvents.forEach(item => {
        const t = String(item.time || '').trim();
        if (t) timePoints.push(t);
    });
    timePoints = Array.from(new Set(timePoints)).filter(Boolean).slice(0, 3);
    const nextActions = buildSummaryActionableNextStepsFromMessages(list, userLabel, contactName, timePoints);
    const nextLine = `下一步是：${nextActions.join('；')}`;
    const timeLine = timePoints.length > 0 ? `涉及时间点：${timePoints.join('；')}` : '';

    const exactNames = extractExactNamesFromMessages(list);
    const nameLine = exactNames.length > 0 ? `涉及具体名称：${exactNames.join(' / ')}` : '';
    const quoteSnippets = extractQuoteSnippetsFromMessages(list, SUMMARY_STRUCTURED_POLICY.maxQuotes);
    const quoteLine = quoteSnippets.length > 0 ? `对话原话包括${quoteSnippets.join('、')}` : '';

    const paragraph1 = `${toNarrativeSentence(line1)}${toNarrativeSentence(line2)}`;
    const paragraph2 = `${toNarrativeSentence(decisionLine)}${toNarrativeSentence(nextLine)}${toNarrativeSentence(timeLine)}`;
    const paragraph3 = `${toNarrativeSentence(nameLine)}${toNarrativeSentence(quoteLine)}`;
    return normalizeSummaryParagraphText([paragraph1, paragraph2, paragraph3].filter(Boolean).join('\n\n'), context);
}

function buildDetailedSummaryFallback(contact, textMessages, range, userName, aiSummary = '') {
    return buildDetailedSummaryFallbackParagraph(contact, textMessages, range, userName, aiSummary);
}

function ensureDetailedSummaryText(rawSummary, contact, textMessages, range, userName, context = {}) {
    const normalized = normalizeSummaryText(rawSummary);
    if (!normalized || normalized === '无' || normalized === '无。') return normalized;

    const channel = context && context.channel === 'call'
        ? 'call'
        : (context && context.channel === 'meeting' ? 'meeting' : 'chat');
    const totalCount = Number.isFinite(Number(context.totalMessageCount))
        ? Number(context.totalMessageCount)
        : (Array.isArray(textMessages) ? textMessages.length : 0);
    const safeRange = range && typeof range === 'object'
        ? range
        : getSummaryLengthRangeByCount(totalCount, channel);
    const actorNames = resolveSummaryActorNames(contact, userName);
    const runtimeContext = Object.assign({}, context, {
        channel,
        range: safeRange,
        userLabel: actorNames.userLabel,
        contactLabel: actorNames.contactLabel
    });

    let paragraphText = convertLegacyTaggedSummaryToParagraph(normalized);
    paragraphText = normalizeSummaryParagraphText(paragraphText, runtimeContext);
    paragraphText = enforceSummaryLengthRange(paragraphText, safeRange, runtimeContext);
    if (isWeakNarrativeSummary(paragraphText, runtimeContext)) {
        const candidateStructured = context && context.structuredPayload
            ? context.structuredPayload
            : parseStructuredSummaryPayload(normalized, runtimeContext);
        if (candidateStructured) {
            const repairedPayload = repairStructuredPayloadFromMessages(
                contact,
                textMessages,
                candidateStructured,
                Object.assign({}, runtimeContext, { aiSummary: normalized })
            );
            const repairedParagraph = enforceSummaryLengthRange(
                renderStructuredSummaryToParagraph(repairedPayload, runtimeContext),
                safeRange,
                runtimeContext
            );
            if (repairedParagraph && !isWeakNarrativeSummary(repairedParagraph, runtimeContext)) {
                console.log('[minutes_repair_used]', {
                    channel,
                    eventCount: Array.isArray(repairedPayload.timeline_events) ? repairedPayload.timeline_events.length : 0,
                    nextCount: Array.isArray(repairedPayload.next_actions) ? repairedPayload.next_actions.length : 0
                });
                return repairedParagraph.trim();
            }
        }
        const fallback = buildDetailedSummaryFallbackParagraph(
            contact,
            textMessages,
            safeRange,
            actorNames.userLabel,
            paragraphText,
            runtimeContext
        );
        return enforceSummaryLengthRange(fallback, safeRange, runtimeContext).trim();
    }
    return paragraphText.trim();
}

function extractCoreActionPhrase(text) {
    let value = stripNaturalSummaryLeadIn(String(text || '').replace(/\n+/g, ' ').trim());
    if (!value) return '';
    value = value
        .replace(/^\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?[，,、\s]*/, '')
        .replace(/^在?\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?[，,、\s]*/, '')
        .replace(/^(先是|随后|最后|接着|之后|后来|目前|当前)\s*/, '')
        .replace(/^(双方|两人|二人|用户与联系人|联系人与用户)\s*/, '')
        .trim();

    const actionPatterns = [
        /(确认[^，。！？]{1,12})/,
        /(完成[^，。！？]{1,12})/,
        /(解决[^，。！？]{1,12})/,
        /(安排[^，。！？]{1,12})/,
        /(约了?[^，。！？]{1,12})/,
        /(下单[^，。！？]{1,12})/,
        /(点了?[^，。！？]{1,12})/,
        /(买了?[^，。！？]{1,12})/,
        /(送了?[^，。！？]{1,12})/,
        /(推进[^，。！？]{1,12})/,
        /(等待[^，。！？]{1,12})/,
        /(回复[^，。！？]{1,12})/,
        /(见面[^，。！？]{1,12})/,
        /(通话[^，。！？]{1,12})/,
        /(去找[^，。！？]{1,12})/,
        /(想见[^，。！？]{1,12})/,
        /(抱抱[^，。！？]{1,12})/,
        /(思念[^，。！？]{1,12})/,
        /(返程[^，。！？]{1,12})/
    ];
    for (const pattern of actionPatterns) {
        const match = value.match(pattern);
        if (match && match[1]) {
            const phrase = match[1].trim();
            if (!/(沟通|讨论|交流|聊天|联系|进展)/.test(phrase)) return phrase;
        }
    }
    const fallback = value.split(/[，。！？!?]/)[0].trim();
    if (/(沟通|讨论|交流|聊天|联系|进展|对话|情况)/.test(fallback)) return '';
    return fallback;
}

function extractNaturalSummaryTitleCandidate(text) {
    const source = stripNaturalSummaryLeadIn(text);
    if (!source) return '';
    const sentences = splitNarrativeSentences(source).slice(0, 3);
    for (const sentence of sentences) {
        const cleaned = String(sentence || '')
            .replace(/^(?:从|在)?\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?(?:到\d{4}年\d{1,2}月\d{1,2}日(?:\s*\d{1,2}:\d{2})?)?[，,、\s]*/, '')
            .replace(/^(?:这段时间里|这段时间|最近这段时间|随后|之后|后来|最后)[，,、\s]*/, '')
            .trim();
        const phrase = extractCoreActionPhrase(cleaned);
        if (phrase && phrase.length >= 2) return phrase;
    }
    return '';
}

function buildMemoryDisplayTitle(memory) {
    const truncateTitle = (text, maxChars = 7) => {
        const source = String(text || '').replace(/\s+/g, ' ').trim();
        if (!source) return '';
        const chars = Array.from(source);
        if (chars.length <= maxChars) return source;
        if (maxChars <= 1) return chars[0];
        return `${chars.slice(0, maxChars - 1).join('')}…`;
    };
    if (memory && String(memory.title || '').trim()) return truncateTitle(memory.title, 7);
    if (memory && memory.structuredSummary && Array.isArray(memory.structuredSummary.timeline_events) && memory.structuredSummary.timeline_events.length > 0) {
        const firstEvent = memory.structuredSummary.timeline_events[0] || {};
        const eventText = String(firstEvent.event || `${firstEvent.action || ''}${firstEvent.object || ''}`).trim();
        const eventPhrase = extractCoreActionPhrase(eventText);
        if (eventPhrase && eventPhrase.length >= 2) {
            return truncateTitle(eventPhrase, 7);
        }
    }
    if (memory && memory.structuredSummary && Array.isArray(memory.structuredSummary.key_events) && memory.structuredSummary.key_events.length > 0) {
        const firstEvent = memory.structuredSummary.key_events[0] || {};
        const eventPhrase = extractCoreActionPhrase(String(firstEvent.event || `${firstEvent.action || ''}${firstEvent.object || ''}`).trim());
        if (eventPhrase && eventPhrase.length >= 2) {
            return truncateTitle(eventPhrase, 7);
        }
    }
    const rawContent = String(memory && memory.content ? memory.content : '');
    const content = normalizeSummaryParagraphText(convertLegacyTaggedSummaryToParagraph(rawContent));
    if (!content) return rawContent ? truncateTitle(normalizeSummaryText(rawContent), 7) || '记忆' : '记忆';
    const tags = normalizeMemoryTags(memory && memory.memoryTags, 'long_term');
    const firstSentence = splitNarrativeSentences(content)[0] || content.split('\n')[0] || '';
    let compact = extractNaturalSummaryTitleCandidate(content)
        || extractCoreActionPhrase(firstSentence)
        .replace(/^(核心事件是[:：]?|双方围绕|双方就)/, '')
        .replace(/[。；;]+$/, '')
        .trim();

    if (!compact) {
        const legacyLines = normalizeSummaryText(rawContent).split('\n').map(line => line.trim()).filter(Boolean);
        const keyLine = legacyLines.find(line => line.includes('【关键经过】'));
        compact = keyLine ? extractCoreActionPhrase(stripSummaryLinePrefix(keyLine)) : '';
    }

    if (compact && compact.length >= 2 && !/^至\d{4}年/.test(compact)) {
        return truncateTitle(compact, 7);
    }
    if (tags.includes('state')) return '状态记忆';
    if (tags.includes('refined')) return '精炼记忆';
    if (rawContent.includes('【时间与背景】') || rawContent.includes('【关键经过】')) {
        return '详细总结';
    }
    return truncateTitle(content.replace(/\n/g, ' '), 7) || '记忆';
}

function isLikelySelfStateUtterance(text, isUser) {
    if (isUser) return true;
    const raw = String(text || '').trim();
    if (!raw) return false;
    if (/(你|你们|用户).*(吗|呢|？|\?)/.test(raw)) return false;
    if (/(是不是|要不要|行不行|可不可以)/.test(raw)) return false;
    if (/[?？]\s*$/.test(raw)) return false;
    if (/(我|本人|这几天|最近|目前|本周|刚|正在|下课|考完|恢复|回来了)/.test(raw)) return true;
    if (/(生病|发烧|感冒|不舒服|出差|外地|旅行|焦虑|低落|压力大|emo|上课|课堂|听课|备考|复习)/.test(raw)) return true;
    if (/(网吧|打游戏|在玩|上班|加班|在公司|在学校|在家|在宿舍|在路上|排队|吃饭|睡觉|洗澡|开会|没钱|手头紧)/.test(raw)) return true;
    return false;
}

function buildConversationStateFallback(contactId, text, isUser) {
    if (isUser) return null;
    const answer = String(text || '').trim();
    if (!answer) return null;
    if (answer.length > 30) return null;
    if (/^[.。!！?？~～,，\s]+$/.test(answer)) return null;
    if (/^(嗯|哦|啊|好|行|知道了|哈哈|呵呵|笑死|无语|6|666|ok)$/i.test(answer)) return null;
    if (/^[?？]/.test(answer) || /[?？]\s*$/.test(answer)) return null;

    const history = (window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contactId]) || [];
    if (!Array.isArray(history) || history.length < 2) return null;
    let lastUserText = '';
    for (let i = history.length - 2; i >= 0 && i >= history.length - 6; i--) {
        const item = history[i];
        if (!item || item.role !== 'user' || String(item.type || '') !== 'text') continue;
        lastUserText = String(item.content || '').trim();
        if (lastUserText) break;
    }
    if (!lastUserText) return null;
    if (!/(你在干嘛|在干嘛|干嘛呢|干啥呢|在忙什么|最近在忙|你在哪|在哪里|你现在在哪|你在做什么|什么情况|怎么了)/.test(lastUserText)) {
        return null;
    }
    if (!isLikelySelfStateUtterance(answer, false)) return null;

    let normalizedText = answer;
    if (/^[\u4e00-\u9fa5A-Za-z0-9]{1,6}$/.test(answer) && !/(在|正在|最近|这几天|目前|本周|刚)/.test(answer)) {
        normalizedText = `在${answer}`;
    }

    const reasonType = inferStateReasonType(normalizedText);
    return {
        matched: true,
        rawText: answer,
        normalizedText,
        reasonType: reasonType || 'other',
        isResolve: false,
        ruleScore: 0.74,
        matchedKeywords: ['问答语境']
    };
}

function normalizeExactNames(names) {
    if (!Array.isArray(names)) return [];
    const set = new Set();
    const result = [];
    names.forEach(name => {
        const text = String(name || '').trim().replace(/\s+/g, ' ');
        if (!text) return;
        const key = text.toLowerCase();
        if (set.has(key)) return;
        set.add(key);
        result.push(text);
    });
    return result;
}

function splitNamesByJoiners(raw) {
    const source = String(raw || '').trim();
    if (!source) return [];
    let parts = source
        .split(/(?:、|，|,|\/|\\|\s和\s|\s及\s|\s还有\s)/)
        .map(item => item.trim())
        .filter(Boolean);
    if (parts.length <= 1 && source.includes('和') && !source.includes('和牛')) {
        const byHe = source.split('和').map(item => item.trim()).filter(Boolean);
        if (byHe.length > 1 && byHe.every(item => item.length >= 2 && item.length <= 20)) {
            parts = byHe;
        }
    }
    return parts.length > 1 ? parts : [source];
}

function cleanupExtractedName(text) {
    let value = String(text || '').trim();
    if (!value) return '';
    value = value.replace(/^[“"'‘’「『]+|[”"'’」』]+$/g, '').trim();
    value = value.replace(/^(嗯+|哦+|啊+|呃+|诶+)\s*/i, '').trim();
    value = value.replace(/\s*(吧|呀|呢|哈+|啦+|嘛)\s*$/i, '').trim();
    value = value.replace(/^(?:了)?(?:一(?:份|碗|杯|盒|束|袋|套|件|张|份儿)|一个|一杯|一份|一碗|一盒|一束|一袋|一套|一件|一张)/, '').trim();
    value = value.replace(/^(?:个|份|杯|碗|盒|束|袋|套|件|张)/, '').trim();
    value = value.replace(/(?:给你|给你们|给你点的|给你买的|给你送的)$/g, '').trim();
    if (value.length > 40) return '';
    if (/^(?:东西|礼物|外卖|吃的|喝的|饭|餐|那个|这个|它|这份|那份|些东西|这个东西|那个东西)$/.test(value)) return '';
    return value;
}

function buildExactNamesKey(names) {
    const normalized = normalizeExactNames(names);
    if (normalized.length === 0) return '';
    return normalized.map(item => item.toLowerCase()).sort().join('||');
}

function extractNamesFromFactContent(content) {
    const text = String(content || '').trim();
    if (!text) return [];
    const directMatch = text.match(/具体名称[:：]\s*(.+)$/);
    if (!directMatch || !directMatch[1]) return [];
    const raw = directMatch[1].trim();
    if (!raw) return [];
    const parts = raw.split(/(?:\/|、|，|,)/).map(item => cleanupExtractedName(item)).filter(Boolean);
    return normalizeExactNames(parts);
}

function getMemoryExactNames(memory) {
    if (!memory || typeof memory !== 'object') return [];
    if (memory.factMeta && Array.isArray(memory.factMeta.exactNames) && memory.factMeta.exactNames.length > 0) {
        return normalizeExactNames(memory.factMeta.exactNames);
    }
    return extractNamesFromFactContent(memory.content);
}

function normalizeSceneText(sceneText) {
    let text = String(sceneText || '').replace(/\s+/g, ' ').trim();
    if (!text) return '';
    text = text.replace(/[，。！？!?；;]+$/g, '');
    if (text.length > 80) text = `${text.slice(0, 80)}...`;
    return text;
}

function extractSceneTextFromFactContent(content) {
    const text = String(content || '').trim();
    if (!text) return '';
    const match = text.match(/^(.+?)[，,]\s*具体名称[:：]/);
    if (!match || !match[1]) return '';
    return normalizeSceneText(match[1]);
}

function inferFactSceneBySource(sourceType, actor = 'user') {
    const safeActor = actor === 'contact' ? 'contact' : 'user';
    const subject = safeActor === 'contact' ? '联系人' : '用户';
    const target = safeActor === 'contact' ? '用户' : '联系人';
    if (sourceType === 'delivery_share') return `${subject}给${target}点过外卖`;
    if (sourceType === 'shopping_gift') return `${subject}给${target}送过礼物`;
    if (sourceType === 'gift_card') return `${subject}给${target}分享过礼品卡`;
    if (sourceType === 'refine_extract') return '从多条历史记忆中提炼出的关键事实';
    return `${subject}在聊天中明确提到过具体名称`;
}

function inferFactSceneFromText(text, actor = 'user') {
    const raw = String(text || '');
    const safeActor = actor === 'contact' ? 'contact' : 'user';
    const subject = safeActor === 'contact' ? '联系人' : '用户';
    const target = safeActor === 'contact' ? '用户' : '联系人';
    if (/点了|下单了|外卖/.test(raw)) return `${subject}给${target}点过外卖`;
    if (/送了|买了|礼物|花束|蛋糕|手办|耳机|口红|奶茶|零食/.test(raw)) return `${subject}给${target}送过礼物`;
    if (/礼品卡|卡券|代金券|红包封面/.test(raw)) return `${subject}给${target}分享过礼品卡`;
    return `${subject}在聊天中明确提到过具体名称`;
}

function buildFactSceneText(sourceType, extraMeta = {}) {
    const safeSourceType = FACT_SOURCE_TYPES.includes(sourceType) ? sourceType : 'user_explicit_text';
    const safeActor = extraMeta.actor === 'contact' ? 'contact' : 'user';
    const provided = normalizeSceneText(extraMeta.sceneText);
    if (provided) return provided;
    if (safeSourceType === 'user_explicit_text') {
        const fromText = normalizeSceneText(inferFactSceneFromText(extraMeta.sourceText, safeActor));
        if (fromText) return fromText;
    }
    return normalizeSceneText(inferFactSceneBySource(safeSourceType, safeActor));
}

function buildFactMemoryContent(names, sourceType, extraMeta = {}) {
    const exactNames = normalizeExactNames(Array.isArray(names) ? names : []);
    if (exactNames.length === 0) return '';
    const sceneText = buildFactSceneText(sourceType, extraMeta);
    const namesText = exactNames.join(' / ');
    if (!sceneText) return `用户提到具体名称：${namesText}`;
    return `${sceneText}，具体名称：${namesText}`;
}

function buildFactMemoryReadableContent(memory) {
    const names = getMemoryExactNames(memory);
    if (names.length === 0) return String((memory && memory.content) || '');
    const sceneText = normalizeSceneText(
        (memory && memory.factMeta && memory.factMeta.sceneText)
            ? memory.factMeta.sceneText
            : extractSceneTextFromFactContent(memory && memory.content)
    );
    if (!sceneText) return `用户提到具体名称：${names.join(' / ')}`;
    return `${sceneText}，具体名称：${names.join(' / ')}`;
}

function normalizeFactMeta(meta, fallbackSourceType = 'user_explicit_text') {
    if (!meta || typeof meta !== 'object') return null;
    const safeSourceType = FACT_SOURCE_TYPES.includes(meta.sourceType) ? meta.sourceType : fallbackSourceType;
    const exactNames = normalizeExactNames(meta.exactNames);
    if (exactNames.length === 0) return null;
    const next = {
        sourceType: safeSourceType,
        exactNames
    };
    if (meta.sourceMsgId !== undefined && meta.sourceMsgId !== null && String(meta.sourceMsgId).trim()) {
        next.sourceMsgId = String(meta.sourceMsgId).trim();
    }
    if (meta.sourceRange !== undefined && meta.sourceRange !== null && String(meta.sourceRange).trim()) {
        next.sourceRange = String(meta.sourceRange).trim();
    }
    const sceneText = normalizeSceneText(meta.sceneText);
    if (sceneText) next.sceneText = sceneText;
    return next;
}

function mergeFactMeta(previous, incoming, fallbackSourceType = 'user_explicit_text') {
    const prev = normalizeFactMeta(previous, fallbackSourceType);
    const next = normalizeFactMeta(incoming, fallbackSourceType);
    if (!prev && !next) return null;
    if (!prev) return next;
    if (!next) return prev;
    const mergedNames = normalizeExactNames([...(prev.exactNames || []), ...(next.exactNames || [])]);
    const merged = {
        sourceType: FACT_SOURCE_TYPES.includes(next.sourceType) ? next.sourceType : prev.sourceType,
        exactNames: mergedNames
    };
    merged.sourceMsgId = next.sourceMsgId || prev.sourceMsgId;
    merged.sourceRange = next.sourceRange || prev.sourceRange;
    merged.sceneText = next.sceneText || prev.sceneText;
    if (!merged.sourceMsgId) delete merged.sourceMsgId;
    if (!merged.sourceRange) delete merged.sourceRange;
    if (!merged.sceneText) delete merged.sceneText;
    return merged;
}

function normalizeRefinedMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const selectedMemoryIds = Array.isArray(meta.selectedMemoryIds)
        ? meta.selectedMemoryIds.map(id => Number(id)).filter(id => Number.isFinite(id))
        : [];
    const keyFactsCount = clampInt(meta.keyFactsCount, 0, 0, 9999);
    if (selectedMemoryIds.length === 0 && keyFactsCount === 0) return null;
    return {
        selectedMemoryIds: Array.from(new Set(selectedMemoryIds)),
        keyFactsCount
    };
}

function mergeRefinedMeta(previous, incoming) {
    const prev = normalizeRefinedMeta(previous);
    const next = normalizeRefinedMeta(incoming);
    if (!prev && !next) return null;
    if (!prev) return next;
    if (!next) return prev;
    return {
        selectedMemoryIds: Array.from(new Set([...(prev.selectedMemoryIds || []), ...(next.selectedMemoryIds || [])])),
        keyFactsCount: Math.max(clampInt(prev.keyFactsCount, 0, 0, 9999), clampInt(next.keyFactsCount, 0, 0, 9999))
    };
}

function normalizeStateExtractMeta(meta) {
    if (!meta || typeof meta !== 'object') return null;
    const matchedKeywords = Array.isArray(meta.matchedKeywords)
        ? meta.matchedKeywords.map(item => String(item || '').trim()).filter(Boolean).slice(0, 20)
        : [];
    return {
        ruleScore: clampFloat(meta.ruleScore, 0.62, 0, 1),
        aiConfidence: Number.isFinite(Number(meta.aiConfidence)) ? clampFloat(meta.aiConfidence, 0.75, 0, 1) : null,
        finalConfidence: clampFloat(meta.finalConfidence, 0.75, 0, 1),
        matchedKeywords,
        detector: ['rule_plus_ai', 'rule_only_fallback', 'ai_only', 'conversation_fallback'].includes(meta.detector) ? meta.detector : 'rule_only_fallback'
    };
}

function mergeStateExtractMeta(previous, incoming) {
    const prev = normalizeStateExtractMeta(previous);
    const next = normalizeStateExtractMeta(incoming);
    if (!prev && !next) return null;
    if (!prev) return next;
    if (!next) return prev;
    return {
        ruleScore: Math.max(prev.ruleScore, next.ruleScore),
        aiConfidence: next.aiConfidence === null ? prev.aiConfidence : next.aiConfidence,
        finalConfidence: Math.max(prev.finalConfidence, next.finalConfidence),
        matchedKeywords: Array.from(new Set([...(prev.matchedKeywords || []), ...(next.matchedKeywords || [])])).slice(0, 20),
        detector: next.detector || prev.detector
    };
}

function formatCandidateMetaText(candidate) {
    const sourceLabel = CANDIDATE_SOURCE_LABELS[candidate.source] || '自动提取';
    const confidence = (Number(candidate.confidence || 0) * 100).toFixed(0);
    const importance = Math.round(getMemoryImportance(candidate, getDefaultImportanceByTags(candidate && candidate.suggestedTags, 'long_term')) * 100);
    const date = new Date(candidate.createdAt || Date.now());
    const timeText = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    const candidateTags = normalizeMemoryTags(candidate && candidate.suggestedTags, 'long_term');
    const ownerPart = candidateTags.includes('state')
        ? `，对象：${getStateOwnerLabel(getMemoryStateOwner(candidate, 'user'), candidate && candidate.contactId)}`
        : '';
    const reasonText = String(candidate.reason || '').trim();
    const reasonPart = reasonText ? `，原因：${reasonText}` : '';
    return `来源：${sourceLabel}${ownerPart}，可信度约 ${confidence}%，重要性 ${importance}%${reasonPart}（${timeText}）`;
}

function ensureMemoryCollections() {
    let changed = false;
    if (!Array.isArray(window.iphoneSimState.memories)) {
        window.iphoneSimState.memories = [];
        changed = true;
    }
    if (!Array.isArray(window.iphoneSimState.memoryCandidates)) {
        window.iphoneSimState.memoryCandidates = [];
        changed = true;
    }
    window.iphoneSimState.memories.forEach(memory => {
        if (!memory || typeof memory !== 'object') return;
        const fallbackTag = String(memory.content || '').startsWith('【通话回忆】') ? 'short_term' : 'long_term';
        const normalizedTags = normalizeMemoryTags(memory.memoryTags, fallbackTag);
        if (
            !Array.isArray(memory.memoryTags) ||
            memory.memoryTags.length !== normalizedTags.length ||
            memory.memoryTags.some((tag, index) => tag !== normalizedTags[index])
        ) {
            memory.memoryTags = normalizedTags;
            changed = true;
        }
        if (memory.factMeta) {
            delete memory.factMeta;
            changed = true;
        }
        if (ensureMemoryImportance(memory, memory.memoryTags, fallbackTag)) changed = true;
    });
    window.iphoneSimState.memoryCandidates.forEach(candidate => {
        if (!candidate || typeof candidate !== 'object') return;
        const normalizedTags = normalizeMemoryTags(candidate.suggestedTags, 'long_term');
        if (
            !Array.isArray(candidate.suggestedTags) ||
            candidate.suggestedTags.length !== normalizedTags.length ||
            candidate.suggestedTags.some((tag, index) => tag !== normalizedTags[index])
        ) {
            candidate.suggestedTags = normalizedTags;
            changed = true;
        }
        if (candidate.factMeta) {
            delete candidate.factMeta;
            changed = true;
        }
        if (ensureMemoryImportance(candidate, candidate.suggestedTags, 'long_term')) changed = true;
    });
    return changed;
}

function getDefaultMemorySettingsRuntime() {
    if (typeof window.createDefaultMemorySettingsV2 === 'function') {
        return window.createDefaultMemorySettingsV2();
    }
    return {
        extractMode: 'hybrid',
        injectQuota: { short_term: 2, long_term: 2, state: 2, refined: 1, maxTotal: 7 },
        injectRecentDays: { short_term: 3, long_term: 30, state: 14, refined: 30 },
        injectImportanceMin: { short_term: 0.5, long_term: 0.5, state: 0.5, refined: 0.5 },
        stateTtlDays: { health: 7, exam: 14, travel: 10, emotion: 3, other: 7 },
        dedupeThreshold: 0.75,
        stateExtractV2: {
            enabled: true,
            strategy: 'rule_plus_ai',
            debugConsole: true,
            thresholds: { accept: 0.78, borderline: 0.60, resolve: 0.72 },
            ai: { timeoutMs: 4500, maxTokens: 180, temperature: 0.1 }
        }
    };
}

function clampInt(value, fallback, min = 0, max = 999) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(n)));
}

function clampFloat(value, fallback, min = 0, max = 1) {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

function ensureMemorySettingsV2() {
    const defaults = getDefaultMemorySettingsRuntime();
    const raw = window.iphoneSimState.memorySettingsV2 && typeof window.iphoneSimState.memorySettingsV2 === 'object'
        ? window.iphoneSimState.memorySettingsV2
        : {};
    const inject = raw.injectQuota && typeof raw.injectQuota === 'object' ? raw.injectQuota : {};
    const recentDays = raw.injectRecentDays && typeof raw.injectRecentDays === 'object' ? raw.injectRecentDays : {};
    const importanceMin = raw.injectImportanceMin && typeof raw.injectImportanceMin === 'object' ? raw.injectImportanceMin : {};
    const ttl = raw.stateTtlDays && typeof raw.stateTtlDays === 'object' ? raw.stateTtlDays : {};
    const stateExtract = raw.stateExtractV2 && typeof raw.stateExtractV2 === 'object' ? raw.stateExtractV2 : {};
    const thresholds = stateExtract.thresholds && typeof stateExtract.thresholds === 'object' ? stateExtract.thresholds : {};
    const ai = stateExtract.ai && typeof stateExtract.ai === 'object' ? stateExtract.ai : {};
    const normalized = {
        extractMode: ['hybrid', 'auto', 'manual'].includes(raw.extractMode) ? raw.extractMode : defaults.extractMode,
        injectQuota: {
            short_term: clampInt(inject.short_term, defaults.injectQuota.short_term, 0, 50),
            long_term: clampInt(inject.long_term, defaults.injectQuota.long_term, 0, 50),
            state: clampInt(inject.state, defaults.injectQuota.state, 0, 50),
            refined: clampInt(inject.refined, defaults.injectQuota.refined, 0, 50),
            maxTotal: clampInt(inject.maxTotal, defaults.injectQuota.maxTotal, 1, 100)
        },
        injectRecentDays: {
            short_term: clampInt(recentDays.short_term, defaults.injectRecentDays.short_term, 0, 3650),
            long_term: clampInt(recentDays.long_term, defaults.injectRecentDays.long_term, 0, 3650),
            state: clampInt(recentDays.state, defaults.injectRecentDays.state, 0, 3650),
            refined: clampInt(recentDays.refined, defaults.injectRecentDays.refined, 0, 3650)
        },
        injectImportanceMin: {
            short_term: clampFloat(importanceMin.short_term, defaults.injectImportanceMin.short_term, 0.1, 1),
            long_term: clampFloat(importanceMin.long_term, defaults.injectImportanceMin.long_term, 0.1, 1),
            state: clampFloat(importanceMin.state, defaults.injectImportanceMin.state, 0.1, 1),
            refined: clampFloat(importanceMin.refined, defaults.injectImportanceMin.refined, 0.1, 1)
        },
        stateTtlDays: {
            health: clampInt(ttl.health, defaults.stateTtlDays.health, 1, 365),
            exam: clampInt(ttl.exam, defaults.stateTtlDays.exam, 1, 365),
            travel: clampInt(ttl.travel, defaults.stateTtlDays.travel, 1, 365),
            emotion: clampInt(ttl.emotion, defaults.stateTtlDays.emotion, 1, 365),
            other: clampInt(ttl.other, defaults.stateTtlDays.other, 1, 365)
        },
        dedupeThreshold: clampFloat(raw.dedupeThreshold, defaults.dedupeThreshold, 0.3, 0.99),
        stateExtractV2: {
            enabled: stateExtract.enabled === undefined ? true : !!stateExtract.enabled,
            strategy: ['rule_plus_ai', 'rule_only'].includes(stateExtract.strategy)
                ? stateExtract.strategy
                : defaults.stateExtractV2.strategy,
            debugConsole: stateExtract.debugConsole === undefined ? defaults.stateExtractV2.debugConsole : !!stateExtract.debugConsole,
            thresholds: {
                accept: clampFloat(thresholds.accept, defaults.stateExtractV2.thresholds.accept, 0.3, 0.99),
                borderline: clampFloat(thresholds.borderline, defaults.stateExtractV2.thresholds.borderline, 0.3, 0.99),
                resolve: clampFloat(thresholds.resolve, defaults.stateExtractV2.thresholds.resolve, 0.3, 0.99)
            },
            ai: {
                timeoutMs: clampInt(ai.timeoutMs, defaults.stateExtractV2.ai.timeoutMs, 500, 15000),
                maxTokens: clampInt(ai.maxTokens, defaults.stateExtractV2.ai.maxTokens, 60, 800),
                temperature: clampFloat(ai.temperature, defaults.stateExtractV2.ai.temperature, 0, 1)
            }
        }
    };
    if (normalized.stateExtractV2.thresholds.borderline > normalized.stateExtractV2.thresholds.accept) {
        normalized.stateExtractV2.thresholds.borderline = normalized.stateExtractV2.thresholds.accept;
    }
    window.iphoneSimState.memorySettingsV2 = normalized;
    return normalized;
}

function stateExtractDebugEnabled(settings = null) {
    const local = settings || ensureMemorySettingsV2();
    const stateExtract = local && local.stateExtractV2 ? local.stateExtractV2 : {};
    if (typeof stateExtract.debugConsole === 'boolean') return stateExtract.debugConsole;
    return true;
}

function stateExtractDebugLog(stage, payload = {}, level = 'info', settings = null) {
    if (!stateExtractDebugEnabled(settings)) return;
    const logger = level === 'warn'
        ? (console.warn || console.log)
        : (level === 'error' ? (console.error || console.log) : (console.log || console.info));
    logger.call(console, `[memory-state-v2] ${stage}`, payload);
}

function stateExtractPreviewText(text, maxLen = 60) {
    const normalized = String(text || '').replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxLen) return normalized;
    return `${normalized.slice(0, Math.max(8, maxLen - 3))}...`;
}

window.setStateExtractDebug = function(enabled) {
    const settings = ensureMemorySettingsV2();
    settings.stateExtractV2.debugConsole = !!enabled;
    window.iphoneSimState.memorySettingsV2 = settings;
    saveConfig();
    console.log(`[memory-state-v2] debugConsole=${settings.stateExtractV2.debugConsole ? 'ON' : 'OFF'}`);
};

setTimeout(() => {
    try {
        const settings = ensureMemorySettingsV2();
        stateExtractDebugLog('debug_ready', {
            enabled: !!(settings.stateExtractV2 && settings.stateExtractV2.enabled),
            strategy: settings.stateExtractV2 ? settings.stateExtractV2.strategy : '',
            debugConsole: stateExtractDebugEnabled(settings)
        }, 'info', settings);
    } catch (error) {}
}, 0);

function normalizeMemoryTags(tags, fallback = 'long_term') {
    const safeFallback = MEMORY_VALID_TAGS.includes(String(fallback || '').trim().toLowerCase())
        ? String(fallback || '').trim().toLowerCase()
        : 'long_term';
    const next = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',') : []);
    const normalized = Array.from(new Set(
        next.map(tag => String(tag || '').trim().toLowerCase()).filter(tag => MEMORY_VALID_TAGS.includes(tag))
    ));
    if (normalized.length === 0) normalized.push(safeFallback);
    return normalized;
}

function getDefaultImportanceByTags(tags, fallbackTag = 'long_term') {
    const normalizedTags = normalizeMemoryTags(tags, fallbackTag);
    if (normalizedTags.includes('state')) return MEMORY_DEFAULT_IMPORTANCE_BY_TAG.state;
    if (normalizedTags.includes('refined')) return MEMORY_DEFAULT_IMPORTANCE_BY_TAG.refined;
    if (normalizedTags.includes('short_term')) return MEMORY_DEFAULT_IMPORTANCE_BY_TAG.short_term;
    return MEMORY_DEFAULT_IMPORTANCE_BY_TAG.long_term;
}

function normalizeMemoryImportanceValue(value, fallback = 0.7) {
    return clampFloat(value, fallback, 0.1, 1);
}

function getMemoryImportance(memory, fallback = 0.7) {
    const raw = memory && memory.importance;
    return normalizeMemoryImportanceValue(raw, fallback);
}

function ensureMemoryImportance(memory, tags = null, fallbackTag = 'long_term') {
    if (!memory || typeof memory !== 'object') return false;
    const normalizedTags = normalizeMemoryTags(tags || memory.memoryTags, fallbackTag);
    const fallback = getDefaultImportanceByTags(normalizedTags, fallbackTag);
    const normalized = normalizeMemoryImportanceValue(memory.importance, fallback);
    const changed = !Number.isFinite(Number(memory.importance)) || Number(memory.importance) !== normalized;
    memory.importance = normalized;
    return changed;
}

function inferStateReasonType(text) {
    const value = String(text || '').toLowerCase();
    if (/period|sick|ill|hospital|fever|health/.test(value)) return 'health';
    if (/exam|test|quiz|final|deadline/.test(value)) return 'exam';
    if (/travel|trip|flight|train|away|business/.test(value)) return 'travel';
    if (/anxious|sad|emo|stress|panic|mood|emotion|happy/.test(value)) return 'emotion';
    return 'other';
}

function makeStateMeta(reasonType = 'other', startAt = Date.now(), expiresAt = null, owner = 'user') {
    const safeReason = ['health', 'exam', 'travel', 'emotion', 'other'].includes(reasonType) ? reasonType : 'other';
    const safeStart = Number.isFinite(Number(startAt)) ? Number(startAt) : Date.now();
    return {
        phase: 'active',
        startAt: safeStart,
        expiresAt: null,
        resolvedAt: null,
        reasonType: safeReason,
        owner: normalizeStateOwner(owner, 'user')
    };
}

function normalizeStateMetaForMemory(memory) {
    if (!memory || !Array.isArray(memory.memoryTags) || !memory.memoryTags.includes('state')) return false;
    const prev = memory.stateMeta && typeof memory.stateMeta === 'object' ? memory.stateMeta : null;
    const owner = getMemoryStateOwner(memory, 'user');
    if (!prev) {
        memory.stateMeta = makeStateMeta(inferStateReasonType(memory.content), memory.time || Date.now(), null, owner);
        memory.stateOwner = owner;
        return true;
    }
    const reasonType = ['health', 'exam', 'travel', 'emotion', 'other'].includes(prev.reasonType)
        ? prev.reasonType
        : inferStateReasonType(memory.content);
    const startAt = Number.isFinite(Number(prev.startAt)) ? Number(prev.startAt) : (Number(memory.time) || Date.now());
    const normalized = makeStateMeta(reasonType, startAt, null, owner);
    normalized.phase = prev.phase === 'resolved' ? 'resolved' : 'active';
    normalized.resolvedAt = normalized.phase === 'resolved' && Number.isFinite(Number(prev.resolvedAt))
        ? Number(prev.resolvedAt)
        : null;
    normalized.owner = owner;
    const changed = JSON.stringify(prev) !== JSON.stringify(normalized);
    memory.stateMeta = normalized;
    memory.stateOwner = owner;
    return changed;
}

window.extractStateMemoryByRule = function(text) {
    const rawText = String(text || '').trim();
    if (!rawText) return null;
    const normalized = normalizeStateExtractText(rawText);
    if (!normalized) return null;
    const lowered = normalized.toLowerCase();

    const resolveMatches = collectMatchedKeywords(lowered, STATE_RESOLVE_KEYWORDS);
    const isResolve = resolveMatches.length > 0;
    const hasNegative = STATE_NEGATIVE_PATTERNS.some(pattern => pattern.test(normalized) || pattern.test(lowered));
    const isGuessOrQuestion = STATE_GUESS_PATTERNS.some(pattern => pattern.test(normalized) || pattern.test(lowered));

    if (isGuessOrQuestion) return null;
    if (hasNegative && !isResolve) return null;

    const tenseMatches = collectMatchedKeywords(normalized, STATE_TENSE_KEYWORDS);
    const reasonHits = { health: [], exam: [], travel: [], emotion: [] };
    Object.keys(STATE_RULE_KEYWORDS).forEach(reason => {
        reasonHits[reason] = collectMatchedKeywords(lowered, STATE_RULE_KEYWORDS[reason]);
    });
    const allReasonMatches = [];
    Object.keys(reasonHits).forEach(key => {
        reasonHits[key].forEach(item => allReasonMatches.push(item));
    });
    const hasStatusKeyword = allReasonMatches.length > 0;
    if (!hasStatusKeyword && !isResolve) return null;

    if (!hasStatusKeyword && isResolve) {
        const resolveReasonType = inferResolveReasonType(resolveMatches);
        return {
            matched: true,
            rawText,
            normalizedText: stripStateLeadingSubject(normalized) || normalized,
            reasonType: resolveReasonType,
            isResolve: true,
            ruleScore: resolveReasonType === 'other' ? 0.7 : 0.74,
            matchedKeywords: resolveMatches.slice(0, 10)
        };
    }

    let reasonType = 'other';
    let maxReasonCount = 0;
    Object.keys(reasonHits).forEach(reason => {
        const count = reasonHits[reason].length;
        if (count > maxReasonCount) {
            maxReasonCount = count;
            reasonType = reason;
        }
    });
    if (maxReasonCount === 0) reasonType = 'other';
    if (isResolve && reasonType === 'other') {
        reasonType = inferResolveReasonType(resolveMatches);
    }

    if (!isResolve && reasonType === 'other') return null;
    if (STATE_GENERIC_EXCLUDE_PATTERNS.some(pattern => pattern.test(normalized)) && tenseMatches.length === 0 && !isResolve) {
        return null;
    }

    const selfStateLead = hasSelfStateLead(rawText) || hasSelfStateLead(normalized);
    const stateVerbPhrase = hasStateVerbPhrase(rawText) || hasStateVerbPhrase(normalized);
    let ruleScore = maxReasonCount > 0 ? 0.62 : 0.58;
    if (tenseMatches.length > 0) ruleScore += 0.12;
    if (maxReasonCount >= 2) ruleScore += 0.05;
    if (selfStateLead && !isResolve) ruleScore += 0.08;
    if (stateVerbPhrase && !isResolve) ruleScore += 0.06;
    if (isResolve) ruleScore += 0.05;
    if (reasonType === 'other') ruleScore -= 0.08;
    ruleScore = clampFloat(ruleScore, 0.62, 0.4, 0.95);

    const normalizedText = stripStateLeadingSubject(normalized) || normalized;
    const matchedKeywords = Array.from(new Set([
        ...tenseMatches,
        ...allReasonMatches,
        ...resolveMatches
    ])).slice(0, 16);

    return {
        matched: true,
        rawText,
        normalizedText,
        reasonType,
        isResolve,
        ruleScore,
        matchedKeywords,
        selfStateLead,
        stateVerbPhrase
    };
};

window.classifyStateMemoryWithAI = async function(text, ruleResult, contactId, speakerRole = 'user') {
    const settings = ensureMemorySettingsV2();
    const stateExtract = settings.stateExtractV2 || {};
    const preview = stateExtractPreviewText(text, 48);
    if (stateExtract.strategy !== 'rule_plus_ai') {
        stateExtractDebugLog('ai_skip_strategy', {
            contactId,
            speakerRole,
            strategy: stateExtract.strategy || '',
            text: preview
        }, 'info', settings);
        return null;
    }

    const aiSettings = window.iphoneSimState.aiSettings2.url
        ? window.iphoneSimState.aiSettings2
        : window.iphoneSimState.aiSettings;
    if (!aiSettings || !aiSettings.url || !aiSettings.key) {
        stateExtractDebugLog('ai_skip_missing_api', {
            contactId,
            speakerRole,
            text: preview
        }, 'warn', settings);
        return null;
    }

    let fetchUrl = aiSettings.url;
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? `${fetchUrl}chat/completions` : `${fetchUrl}/chat/completions`;
    }

    const timeoutMs = clampInt(stateExtract.ai && stateExtract.ai.timeoutMs, 4500, 500, 15000);
    const maxTokens = clampInt(stateExtract.ai && stateExtract.ai.maxTokens, 180, 60, 800);
    const temperature = clampFloat(stateExtract.ai && stateExtract.ai.temperature, 0.1, 0, 1);
    const contact = window.iphoneSimState.contacts.find(item => item && item.id === contactId);
    const contactName = contact && contact.name ? contact.name : '联系人';
    const safeSpeaker = speakerRole === 'contact' ? 'contact' : 'user';
    const speakerLabel = safeSpeaker === 'contact' ? '联系人' : '用户';

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    stateExtractDebugLog('ai_start', {
        contactId,
        speakerRole,
        text: preview,
        timeoutMs,
        maxTokens,
        temperature
    }, 'info', settings);
    try {
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${aiSettings.key}`
            },
            signal: controller.signal,
            body: JSON.stringify({
                model: aiSettings.model,
                messages: [
                    {
                        role: 'system',
                        content: `你是状态记忆判定器。你必须只输出 JSON，不要输出任何额外文本。
任务：判断输入文本是否应记为状态记忆。
输出格式：
{
  "is_state": true,
  "reason_type": "health|exam|travel|emotion|other",
  "is_resolve": false,
  "normalized_content": "标准化状态描述",
  "confidence": 0.84,
  "reason": "简短判定依据"
}
规则：
1) confidence 范围 0~1。
2) normalized_content 必须简短具体，不要臆造。
3) 如不是状态信息，is_state=false。
4) 仅在“说话者本人状态”成立时才 is_state=true。不要把对他人的提问或猜测识别为状态。`
                    },
                    {
                        role: 'user',
                        content: `联系人：${contactName}
说话者角色：${speakerLabel}
原文：${String(text || '')}
规则初筛：${JSON.stringify({
    reasonType: ruleResult && ruleResult.reasonType ? ruleResult.reasonType : 'other',
    isResolve: !!(ruleResult && ruleResult.isResolve),
    ruleScore: ruleResult && Number.isFinite(Number(ruleResult.ruleScore)) ? Number(ruleResult.ruleScore) : 0.62
})}
请注意：仅识别${speakerLabel}自己的状态。`
                    }
                ],
                temperature,
                max_tokens: maxTokens
            })
        });
        if (!response.ok) {
            stateExtractDebugLog('ai_http_error', {
                contactId,
                speakerRole,
                status: response.status,
                text: preview
            }, 'warn', settings);
            return null;
        }
        const data = await response.json();
        const content = String(data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
        const parsed = parseJsonFromPossibleText(content);
        if (!parsed || typeof parsed !== 'object') {
            stateExtractDebugLog('ai_parse_fail', {
                contactId,
                speakerRole,
                text: preview,
                raw: stateExtractPreviewText(content, 120)
            }, 'warn', settings);
            return null;
        }

        const safeReasonType = ['health', 'exam', 'travel', 'emotion', 'other'].includes(parsed.reason_type)
            ? parsed.reason_type
            : (ruleResult && ruleResult.reasonType ? ruleResult.reasonType : 'other');
        const normalizedContent = String(parsed.normalized_content || (ruleResult && ruleResult.normalizedText) || '').trim();
        const confidence = clampFloat(parsed.confidence, ruleResult && ruleResult.ruleScore ? ruleResult.ruleScore : 0.62, 0, 1);
        const result = {
            isState: !!parsed.is_state,
            reasonType: safeReasonType,
            isResolve: !!parsed.is_resolve,
            normalizedContent: normalizedContent || String(text || '').trim(),
            confidence,
            reason: String(parsed.reason || '').trim(),
            speakerRole: safeSpeaker
        };
        stateExtractDebugLog('ai_success', {
            contactId,
            speakerRole,
            text: preview,
            result
        }, 'info', settings);
        return result;
    } catch (error) {
        stateExtractDebugLog('ai_exception', {
            contactId,
            speakerRole,
            text: preview,
            message: error && error.message ? error.message : String(error || '')
        }, 'warn', settings);
        return null;
    } finally {
        clearTimeout(timer);
    }
};

window.resolveActiveStateMemory = function(contactId, reasonType, text, stateOwner = 'user') {
    const cid = Number(contactId);
    if (!Number.isFinite(cid)) return null;
    const targetOwner = normalizeStateOwner(stateOwner, 'user');
    const activeStates = getContactMemories(cid)
        .filter(memory => {
            const tags = normalizeMemoryTags(memory.memoryTags, 'long_term');
            if (!tags.includes('state')) return false;
            normalizeStateMetaForMemory(memory);
            if (!memory.stateMeta || memory.stateMeta.phase !== 'active') return false;
            const owner = getMemoryStateOwner(memory, 'user');
            return owner === targetOwner;
        });
    if (activeStates.length === 0) return null;

    const validReason = ['health', 'exam', 'travel', 'emotion', 'other'].includes(reasonType) ? reasonType : 'other';
    const sameReasonPool = activeStates.filter(memory => {
        return memory.stateMeta && memory.stateMeta.reasonType === validReason;
    });
    const pool = sameReasonPool.length > 0 ? sameReasonPool : activeStates;

    const compareText = String(text || '').trim();
    let best = null;
    let bestScore = -1;
    pool.forEach(memory => {
        const sim = compareText ? diceSimilarity(memory.content, compareText) : 0;
        const freshnessBoost = 1 - Math.min(1, Math.max(0, (Date.now() - (Number(memory.time) || Date.now())) / (14 * 24 * 60 * 60 * 1000)));
        const score = sim * 0.7 + freshnessBoost * 0.3;
        if (score > bestScore) {
            best = memory;
            bestScore = score;
        }
    });
    if (!best) return null;
    if (sameReasonPool.length === 0 && bestScore < 0.18) return null;

    best.stateMeta = best.stateMeta || makeStateMeta(validReason, best.time || Date.now(), null, targetOwner);
    best.stateMeta.reasonType = validReason;
    best.stateMeta.phase = 'resolved';
    best.stateMeta.resolvedAt = Date.now();
    best.stateMeta.owner = targetOwner;
    best.stateOwner = targetOwner;
    best.time = Date.now();
    syncLegacyPerceptionAndState(cid);
    return best;
};

window.tryExtractStateMemoryFromMessage = async function(contactId, msg, isUser) {
    const cid = Number(contactId);
    let settings = null;
    try {
        settings = ensureMemorySettingsV2();
    } catch (error) {}

    const baseTrace = {
        contactId: Number.isFinite(cid) ? cid : contactId,
        msgId: msg && msg.id ? String(msg.id) : '',
        role: isUser ? 'user' : 'contact',
        type: msg && msg.type ? String(msg.type) : '',
        text: stateExtractPreviewText(msg && msg.content ? msg.content : '')
    };

    if (!Number.isFinite(cid) || !msg) {
        stateExtractDebugLog('skip_invalid_input', baseTrace, 'warn', settings);
        return null;
    }
    if (String(msg.type || '') !== 'text') {
        stateExtractDebugLog('skip_not_text', baseTrace, 'info', settings);
        return null;
    }
    const text = String(msg.content || '').trim();
    if (!text) {
        stateExtractDebugLog('skip_empty_text', baseTrace, 'info', settings);
        return null;
    }
    if (text.includes('ACTION:') || text.startsWith('[')) {
        stateExtractDebugLog('skip_action_or_system_text', baseTrace, 'info', settings);
        return null;
    }
    const stateOwner = isUser ? 'user' : 'contact';
    const likelyUserQuestion = isUser
        && (/[?？]\s*$/.test(text) || /(你在干嘛|你在哪|你现在在哪|你在做什么|你怎么样|你咋样)/.test(text))
        && !/(我最近|我这几天|我目前|我在|我正在|我有点|我感觉|我状态)/.test(text);
    if (likelyUserQuestion) {
        stateExtractDebugLog('skip_user_question', baseTrace, 'info', settings);
        return null;
    }

    settings = settings || ensureMemorySettingsV2();
    const stateExtract = settings.stateExtractV2 || {};
    const trace = {
        contactId: cid,
        msgId: msg.id ? String(msg.id) : '',
        role: stateOwner,
        mode: settings.extractMode || 'hybrid',
        text: stateExtractPreviewText(text)
    };
    stateExtractDebugLog('message_start', trace, 'info', settings);
    if (stateExtract.enabled === false) {
        stateExtractDebugLog('skip_disabled', trace, 'warn', settings);
        return null;
    }

    const msgId = msg.id ? String(msg.id) : '';
    if (msgId && processedStateExtractMessageIds.has(msgId)) {
        stateExtractDebugLog('skip_duplicate_message', trace, 'info', settings);
        return null;
    }
    if (msgId) capProcessedStateMessageSet(msgId);

    let ruleResult = window.extractStateMemoryByRule(text);
    const shouldSkipAiForStrongRule = !!(
        ruleResult
        && ruleResult.matched
        && !ruleResult.isResolve
        && Number(ruleResult.ruleScore || 0) >= 0.74
        && (ruleResult.selfStateLead || ruleResult.stateVerbPhrase || isLikelySelfStateUtterance(text, isUser))
    );
    let aiResult = null;
    if (shouldSkipAiForStrongRule) {
        stateExtractDebugLog('ai_skip_strong_rule', {
            ...trace,
            ruleScore: ruleResult.ruleScore,
            reasonType: ruleResult.reasonType,
            selfStateLead: !!ruleResult.selfStateLead,
            stateVerbPhrase: !!ruleResult.stateVerbPhrase
        }, 'info', settings);
    } else {
        aiResult = await window.classifyStateMemoryWithAI(text, ruleResult, cid, stateOwner);
    }
    let hasRuleMatch = !!(ruleResult && ruleResult.matched);
    const hasAiResult = !!aiResult;
    let usedConversationFallback = false;
    stateExtractDebugLog('signal_scan', {
        ...trace,
        hasRuleMatch,
        hasAiResult,
        ruleResult: ruleResult ? {
            reasonType: ruleResult.reasonType || 'other',
            isResolve: !!ruleResult.isResolve,
            ruleScore: Number.isFinite(Number(ruleResult.ruleScore)) ? Number(ruleResult.ruleScore) : null,
            selfStateLead: !!ruleResult.selfStateLead,
            stateVerbPhrase: !!ruleResult.stateVerbPhrase,
            matchedKeywords: Array.isArray(ruleResult.matchedKeywords) ? ruleResult.matchedKeywords : []
        } : null,
        aiResult: aiResult ? {
            isState: !!aiResult.isState,
            reasonType: aiResult.reasonType || 'other',
            isResolve: !!aiResult.isResolve,
            confidence: Number.isFinite(Number(aiResult.confidence)) ? Number(aiResult.confidence) : null
        } : null
    }, 'info', settings);

    const conversationRule = buildConversationStateFallback(cid, text, isUser);
    if (!hasRuleMatch && conversationRule) {
        ruleResult = conversationRule;
        hasRuleMatch = true;
        usedConversationFallback = true;
        stateExtractDebugLog('conversation_fallback_hit', {
            ...trace,
            conversationRule
        }, 'info', settings);
    }
    if (!hasRuleMatch && !hasAiResult) {
        stateExtractDebugLog('drop_no_signal', trace, 'info', settings);
        return null;
    }
    if (!isUser && !hasAiResult && !hasRuleMatch && !isLikelySelfStateUtterance(text, false)) {
        stateExtractDebugLog('drop_not_self_state_contact', trace, 'info', settings);
        return null;
    }

    let detector = 'ai_only';
    if (usedConversationFallback) {
        detector = 'conversation_fallback';
    } else if (hasRuleMatch) {
        detector = hasAiResult ? 'rule_plus_ai' : 'rule_only_fallback';
    }
    let aiConfidence = aiResult && Number.isFinite(Number(aiResult.confidence))
        ? clampFloat(aiResult.confidence, null, 0, 1)
        : null;
    const reasonType = aiResult && aiResult.reasonType
        ? aiResult.reasonType
        : (ruleResult && ruleResult.reasonType ? ruleResult.reasonType : 'other');
    const isResolve = aiResult
        ? !!aiResult.isResolve
        : !!(ruleResult && ruleResult.isResolve);
    const isState = aiResult ? !!aiResult.isState : true;
    const normalizedContent = String(
        (aiResult && aiResult.normalizedContent)
            ? aiResult.normalizedContent
            : ((ruleResult && ruleResult.normalizedText) || text)
    ).trim();
    if (!normalizedContent) return null;

    let finalConfidence = 0;
    if (!hasRuleMatch && aiConfidence !== null) {
        // 纯语义识别时更保守一点，降低误触发。
        finalConfidence = clampFloat(aiConfidence - 0.04, aiConfidence, 0, 1);
    } else if (aiConfidence === null) {
        let fallbackPenalty = 0.08;
        if (usedConversationFallback) {
            fallbackPenalty = 0.02;
        } else if (ruleResult && ruleResult.isResolve && ruleResult.reasonType && ruleResult.reasonType !== 'other') {
            fallbackPenalty = 0.02;
        } else if (ruleResult && Number(ruleResult.ruleScore || 0) >= 0.74 && (ruleResult.selfStateLead || ruleResult.stateVerbPhrase)) {
            fallbackPenalty = 0.03;
        } else if (ruleResult && Number(ruleResult.ruleScore || 0) >= 0.68) {
            fallbackPenalty = 0.05;
        }
        const baseRuleScore = ruleResult && Number.isFinite(Number(ruleResult.ruleScore)) ? Number(ruleResult.ruleScore) : 0.62;
        finalConfidence = clampFloat(baseRuleScore - fallbackPenalty, baseRuleScore, 0, 1);
    } else {
        const baseRuleScore = ruleResult && Number.isFinite(Number(ruleResult.ruleScore)) ? Number(ruleResult.ruleScore) : 0.62;
        finalConfidence = clampFloat(baseRuleScore * 0.45 + aiConfidence * 0.55, baseRuleScore, 0, 1);
    }

    const thresholds = stateExtract.thresholds || {};
    const acceptThreshold = clampFloat(thresholds.accept, 0.78, 0.3, 0.99);
    const borderlineThreshold = clampFloat(thresholds.borderline, 0.6, 0.3, 0.99);
    const resolveThreshold = clampFloat(thresholds.resolve, 0.72, 0.3, 0.99);
    const effectiveAcceptThreshold = hasRuleMatch ? acceptThreshold : Math.max(0.8, acceptThreshold + 0.02);
    const effectiveBorderlineThreshold = hasRuleMatch ? borderlineThreshold : Math.max(0.62, borderlineThreshold + 0.02);
    const effectiveResolveThreshold = hasRuleMatch ? resolveThreshold : Math.max(0.76, resolveThreshold + 0.03);
    const extractMode = settings.extractMode || 'hybrid';

    if (aiResult && !isState) {
        if (!usedConversationFallback) {
            stateExtractDebugLog('drop_ai_not_state', {
                ...trace,
                detector,
                aiResult
            }, 'info', settings);
            return null;
        }
        aiConfidence = null;
        stateExtractDebugLog('fallback_override_ai_not_state', {
            ...trace,
            detector
        }, 'warn', settings);
    }
    if (finalConfidence < effectiveBorderlineThreshold) {
        stateExtractDebugLog('drop_low_confidence', {
            ...trace,
            detector,
            finalConfidence,
            borderlineThreshold: effectiveBorderlineThreshold,
            acceptThreshold: effectiveAcceptThreshold,
            resolveThreshold: effectiveResolveThreshold
        }, 'info', settings);
        return null;
    }

    if (isResolve) {
        if (extractMode === 'manual') {
            stateExtractDebugLog('resolve_manual_skip', {
                ...trace,
                detector,
                finalConfidence
            }, 'info', settings);
            showNotification('手动模式：检测到状态结束，请手动更新', 2200);
            return null;
        }
        if (finalConfidence >= effectiveResolveThreshold) {
            const resolved = window.resolveActiveStateMemory(cid, reasonType, normalizedContent, stateOwner);
            if (resolved) {
                stateExtractDebugLog('resolve_success', {
                    ...trace,
                    detector,
                    reasonType,
                    finalConfidence,
                    resolvedMemoryId: resolved.id
                }, 'info', settings);
                saveConfig();
                const memoryApp = document.getElementById('memory-app');
                if (memoryApp && !memoryApp.classList.contains('hidden')) renderMemoryList();
                showNotification(`${getStateOwnerLabel(stateOwner, cid)}已自动更新为已结束`, 1400, 'success');
                return { resolved: true, memory: resolved };
            }
            stateExtractDebugLog('resolve_no_active_target', {
                ...trace,
                detector,
                reasonType,
                finalConfidence
            }, 'info', settings);
            return null;
        }
        stateExtractDebugLog('resolve_confidence_not_enough', {
            ...trace,
            detector,
            finalConfidence,
            resolveThreshold: effectiveResolveThreshold
        }, 'info', settings);
        return null;
    }

    if (extractMode === 'auto' && finalConfidence < effectiveAcceptThreshold) {
        stateExtractDebugLog('auto_skip_below_accept', {
            ...trace,
            detector,
            finalConfidence,
            acceptThreshold: effectiveAcceptThreshold
        }, 'info', settings);
        showNotification('自动模式未达到入库阈值，已跳过；可切换为“混合确认”查看待确认记忆', 2400);
        return null;
    }

    const now = Date.now();
    const reasonLabel = STATE_REASON_LABELS[reasonType] || '其他';
    const ownerLabel = getStateOwnerLabel(stateOwner, cid);
    const detectorLabel = usedConversationFallback
        ? '问答语境'
        : (hasRuleMatch ? `规则${aiResult ? '+AI' : ''}` : 'AI语义');
    const candidateReason = `自动状态识别（${detectorLabel}）：${ownerLabel}，${reasonLabel}类，可信度${Math.round(finalConfidence * 100)}%`;
    const created = createMemoryCandidate(cid, {
        content: formatStateMemoryContent(stateOwner, normalizedContent, now, cid),
        suggestedTags: ['state'],
        source: 'ai_action',
        confidence: finalConfidence,
        reason: candidateReason,
        stateOwner,
        stateMeta: makeStateMeta(reasonType, now, null, stateOwner),
        stateExtractMeta: {
            ruleScore: hasRuleMatch && ruleResult
                ? clampFloat(ruleResult.ruleScore, 0.62, 0, 1)
                : 0,
            aiConfidence,
            finalConfidence,
            matchedKeywords: (hasRuleMatch && ruleResult && Array.isArray(ruleResult.matchedKeywords))
                ? ruleResult.matchedKeywords.slice(0, 20)
                : [],
            detector
        }
    });
    stateExtractDebugLog('candidate_result', {
        ...trace,
        detector,
        reasonType,
        isResolve,
        finalConfidence,
        created: !!created,
        status: created && created.status ? created.status : (created ? 'approved_or_merged' : 'none'),
        target: created && created.id ? created.id : null
    }, 'info', settings);

    if (!created && extractMode === 'manual') {
        stateExtractDebugLog('manual_detected_no_write', {
            ...trace,
            detector
        }, 'info', settings);
        showNotification(`手动模式：检测到${getStateOwnerLabel(stateOwner, cid)}，请手动确认`, 2200);
        return null;
    }
    if (created && created.status === 'pending') {
        showNotification(`${getStateOwnerLabel(stateOwner, cid)}待确认`, 1500, 'success');
    } else if (created) {
        showNotification(`${getStateOwnerLabel(stateOwner, cid)}已记录`, 1500, 'success');
    }
    return created;
};

function normalizeTextForSimilarity(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[\s.,!?;:，。！？、；：“”"'`~!@#$%^&*()_+=\-[\]{}<>\\/|]+/g, '');
}

function buildBigrams(text) {
    const normalized = normalizeTextForSimilarity(text);
    if (normalized.length < 2) return [normalized];
    const arr = [];
    for (let i = 0; i < normalized.length - 1; i++) {
        arr.push(normalized.slice(i, i + 2));
    }
    return arr;
}

function diceSimilarity(textA, textB) {
    const a = buildBigrams(textA);
    const b = buildBigrams(textB);
    if (!a.length && !b.length) return 1;
    if (!a.length || !b.length) return 0;
    const counts = new Map();
    a.forEach(item => counts.set(item, (counts.get(item) || 0) + 1));
    let overlap = 0;
    b.forEach(item => {
        const n = counts.get(item) || 0;
        if (n > 0) {
            overlap++;
            counts.set(item, n - 1);
        }
    });
    return (2 * overlap) / (a.length + b.length);
}

function computeMemoryRelevance(content, contextText) {
    const c = normalizeTextForSimilarity(content);
    const h = normalizeTextForSimilarity(contextText);
    if (!c || !h) return 0;
    const bigrams = buildBigrams(c);
    if (!bigrams.length) return 0;
    let hit = 0;
    bigrams.forEach(bg => {
        if (!bg) return;
        if (h.includes(bg)) hit++;
    });
    return hit / bigrams.length;
}

function getContactMemories(contactId, includeAll = false) {
    ensureMemoryCollections();
    return window.iphoneSimState.memories.filter(memory => {
        if (!memory || memory.contactId !== contactId) return false;
        if (includeAll) return true;
        return (memory.reviewStatus || 'approved') === 'approved';
    });
}

function getPendingCandidates(contactId) {
    ensureMemoryCollections();
    return window.iphoneSimState.memoryCandidates.filter(candidate =>
        candidate && candidate.contactId === contactId && candidate.status === 'pending'
    );
}

function syncLegacyPerceptionAndState(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    const memories = getContactMemories(contactId).slice().sort((a, b) => (b.time || 0) - (a.time || 0));
    const importantStates = [];
    memories.forEach(memory => {
        const tags = normalizeMemoryTags(memory.memoryTags, 'long_term');
        if (tags.includes('state')) {
            normalizeStateMetaForMemory(memory);
            if (memory.stateMeta && memory.stateMeta.phase === 'active') {
                const owner = getMemoryStateOwner(memory, 'user');
                const ownerPrefix = owner === 'contact' ? '联系人状态' : '用户状态';
                const baseText = String(memory.content || '').trim();
                const legacyText = /^((用户|联系人)当前状态[:：]|(用户状态|联系人状态)[:：])/.test(baseText)
                    ? baseText
                    : `${ownerPrefix}：${baseText}`;
                if (!importantStates.includes(legacyText)) {
                    importantStates.push(legacyText);
                }
            }
        }
    });
    contact.importantStates = importantStates.slice(0, 5);
}

function createOrMergeApprovedMemory(payload) {
    ensureMemoryCollections();
    const settings = ensureMemorySettingsV2();
    const contactId = payload && payload.contactId;
    const content = String((payload && payload.content) || '').trim();
    if (!contactId || !content) return { created: false, memory: null };

    const tags = normalizeMemoryTags(payload.memoryTags, content.startsWith('【通话回忆】') ? 'short_term' : 'long_term');
    const importanceFallback = getDefaultImportanceByTags(tags, 'long_term');
    const hasExplicitImportance = Number.isFinite(Number(payload && payload.importance));
    const importance = normalizeMemoryImportanceValue(payload && payload.importance, importanceFallback);
    const payloadStateOwner = tags.includes('state')
        ? normalizeStateOwner(payload.stateOwner, inferStateOwnerFromContent(content, 'user'))
        : null;
    const source = payload.source || 'manual';
    const confidence = clampFloat(payload.confidence, 0.8, 0, 1);
    const dedupeThreshold = clampFloat(settings.dedupeThreshold, 0.75, 0.3, 0.99);
    const now = Date.now();
    const refinedMetaPayload = normalizeRefinedMeta(payload.refinedMeta);

    let duplicate = null;
    let bestScore = 0;
    const approvedMemories = getContactMemories(contactId);

    approvedMemories.forEach(memory => {
        if (duplicate && memory.id === duplicate.id) return;
        const existingTags = normalizeMemoryTags(memory.memoryTags, 'long_term');
        const existingStateOwner = existingTags.includes('state') ? getMemoryStateOwner(memory, 'user') : null;
        if (hasStateOwnerConflict(tags, payloadStateOwner, existingTags, existingStateOwner)) return;
        const hasOverlap = tags.some(tag => existingTags.includes(tag));
        if (!hasOverlap) return;
        const score = diceSimilarity(memory.content, content);
        if (score >= dedupeThreshold && score > bestScore) {
            bestScore = score;
            duplicate = memory;
        }
    });

    if (duplicate) {
        duplicate.content = content.length >= String(duplicate.content || '').length ? content : duplicate.content;
        duplicate.time = Math.max(Number(duplicate.time) || 0, Number(payload.time) || now);
        duplicate.title = payload.title || duplicate.title;
        duplicate.range = payload.range || duplicate.range;
        duplicate.type = payload.type || duplicate.type;
        duplicate.source = source || duplicate.source;
        duplicate.confidence = Math.max(clampFloat(duplicate.confidence, 0.6, 0, 1), confidence);
        const oldImportance = getMemoryImportance(duplicate, getDefaultImportanceByTags(duplicate.memoryTags, 'long_term'));
        duplicate.importance = hasExplicitImportance ? importance : Math.max(oldImportance, importance);
        duplicate.reviewStatus = 'approved';
        duplicate.memoryTags = Array.from(new Set([...normalizeMemoryTags(duplicate.memoryTags, 'long_term'), ...tags]));
        if (payload.refinedFrom && Array.isArray(payload.refinedFrom)) {
            const oldRefs = Array.isArray(duplicate.refinedFrom) ? duplicate.refinedFrom : [];
            duplicate.refinedFrom = Array.from(new Set([...oldRefs, ...payload.refinedFrom]));
        }
        if (duplicate.memoryTags.includes('state')) {
            const nextStateOwner = payloadStateOwner || getMemoryStateOwner(duplicate, 'user');
            if (payload.stateMeta && typeof payload.stateMeta === 'object') {
                duplicate.stateMeta = Object.assign({}, payload.stateMeta);
            }
            if (duplicate.stateMeta && typeof duplicate.stateMeta === 'object') {
                duplicate.stateMeta.owner = nextStateOwner;
            }
            duplicate.stateOwner = nextStateOwner;
            normalizeStateMetaForMemory(duplicate);
        } else {
            delete duplicate.stateMeta;
            delete duplicate.stateOwner;
        }
        delete duplicate.factMeta;
        const mergedRefinedMeta = mergeRefinedMeta(duplicate.refinedMeta, refinedMetaPayload);
        if (mergedRefinedMeta) {
            duplicate.refinedMeta = mergedRefinedMeta;
        } else if (!duplicate.memoryTags.includes('refined')) {
            delete duplicate.refinedMeta;
        }
        ensureMemoryImportance(duplicate, duplicate.memoryTags, 'long_term');
        syncLegacyPerceptionAndState(contactId);
        return { created: false, memory: duplicate };
    }

    const memory = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        contactId: contactId,
        content: content,
        time: Number(payload.time) || now,
        title: payload.title || '',
        range: payload.range || '',
        type: payload.type || '',
        memoryTags: tags,
        source: source,
        confidence: confidence,
        importance: importance,
        reviewStatus: 'approved'
    };
    if (payload.refinedFrom && Array.isArray(payload.refinedFrom)) {
        memory.refinedFrom = payload.refinedFrom.slice(0);
    }
    delete memory.factMeta;
    if (refinedMetaPayload && memory.memoryTags.includes('refined')) {
        memory.refinedMeta = refinedMetaPayload;
    }
    if (memory.memoryTags.includes('state')) {
        const nextStateOwner = payloadStateOwner || inferStateOwnerFromContent(content, 'user');
        memory.stateMeta = payload.stateMeta && typeof payload.stateMeta === 'object'
            ? Object.assign({}, payload.stateMeta)
            : makeStateMeta(inferStateReasonType(content), memory.time, null, nextStateOwner);
        if (memory.stateMeta && typeof memory.stateMeta === 'object') {
            memory.stateMeta.owner = nextStateOwner;
        }
        memory.stateOwner = nextStateOwner;
        normalizeStateMetaForMemory(memory);
    }
    ensureMemoryImportance(memory, memory.memoryTags, 'long_term');
    window.iphoneSimState.memories.push(memory);
    syncLegacyPerceptionAndState(contactId);
    return { created: true, memory: memory };
}

function createMemoryCandidate(contactId, payload = {}) {
    ensureMemoryCollections();
    const settings = ensureMemorySettingsV2();
    if (!contactId) return null;
    const content = String(payload.content || '').trim();
    if (!content) return null;

    const tags = normalizeMemoryTags(payload.suggestedTags || payload.memoryTags, 'long_term');
    const importanceFallback = getDefaultImportanceByTags(tags, 'long_term');
    const hasExplicitImportance = Number.isFinite(Number(payload && payload.importance));
    const importance = normalizeMemoryImportanceValue(payload && payload.importance, importanceFallback);
    const payloadStateOwner = tags.includes('state')
        ? normalizeStateOwner(payload.stateOwner, inferStateOwnerFromContent(content, 'user'))
        : null;
    const source = ['auto_summary', 'call_summary', 'ai_action'].includes(payload.source) ? payload.source : 'auto_summary';
    const confidence = clampFloat(payload.confidence, 0.75, 0, 1);
    const extractMode = settings.extractMode || 'hybrid';
    const now = Date.now();
    const stateExtractMetaPayload = normalizeStateExtractMeta(payload.stateExtractMeta);

    if (extractMode === 'manual') {
        return null;
    }

    const dedupeThreshold = clampFloat(settings.dedupeThreshold, 0.75, 0.3, 0.99);
    const pending = getPendingCandidates(contactId);
    for (const existing of pending) {
        const existingTags = normalizeMemoryTags(existing.suggestedTags, 'long_term');
        const existingStateOwner = existingTags.includes('state') ? getMemoryStateOwner(existing, 'user') : null;
        if (hasStateOwnerConflict(tags, payloadStateOwner, existingTags, existingStateOwner)) {
            continue;
        }
        const score = diceSimilarity(existing.content, content);
        if (score >= dedupeThreshold) {
            existing.content = content.length > String(existing.content || '').length ? content : existing.content;
            existing.suggestedTags = Array.from(new Set([...existingTags, ...tags]));
            existing.confidence = Math.max(clampFloat(existing.confidence, 0.6, 0, 1), confidence);
            const oldImportance = getMemoryImportance(existing, getDefaultImportanceByTags(existing.suggestedTags, 'long_term'));
            existing.importance = hasExplicitImportance ? importance : Math.max(oldImportance, importance);
            existing.reason = payload.reason || existing.reason;
            existing.range = payload.range || existing.range;
            existing.createdAt = now;
            delete existing.factMeta;
            if (existing.suggestedTags.includes('state')) {
                const nextStateOwner = payloadStateOwner || getMemoryStateOwner(existing, 'user');
                existing.stateOwner = nextStateOwner;
                if (existing.stateMeta && typeof existing.stateMeta === 'object') {
                    existing.stateMeta.owner = nextStateOwner;
                }
            }
            if (payload.stateMeta && typeof payload.stateMeta === 'object') {
                existing.stateMeta = Object.assign({}, payload.stateMeta);
                if (existing.stateMeta && typeof existing.stateMeta === 'object') {
                    existing.stateMeta.owner = payloadStateOwner || getMemoryStateOwner(existing, 'user');
                }
            } else if (existing.suggestedTags.includes('state') && !existing.stateMeta) {
                existing.stateMeta = makeStateMeta(
                    inferStateReasonType(existing.content),
                    now,
                    null,
                    payloadStateOwner || getMemoryStateOwner(existing, 'user')
                );
            }
            existing.stateExtractMeta = mergeStateExtractMeta(existing.stateExtractMeta, stateExtractMetaPayload);
            ensureMemoryImportance(existing, existing.suggestedTags, 'long_term');
            saveConfig();
            const memoryApp = document.getElementById('memory-app');
            if (memoryApp && !memoryApp.classList.contains('hidden')) renderMemoryList();
            return existing;
        }
    }

    if (extractMode === 'auto') {
        const created = createOrMergeApprovedMemory({
            contactId: contactId,
            content: content,
            memoryTags: tags,
            source: source,
            confidence: confidence,
            importance: importance,
            range: payload.range || '',
            stateOwner: payloadStateOwner,
            stateMeta: payload.stateMeta || (tags.includes('state') ? makeStateMeta(inferStateReasonType(content), now, null, payloadStateOwner || 'user') : null)
        });
        saveConfig();
        const memoryApp = document.getElementById('memory-app');
        if (memoryApp && !memoryApp.classList.contains('hidden')) renderMemoryList();
        return created.memory;
    }

    const candidate = {
        id: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        contactId: contactId,
        content: content,
        title: payload.title || '',
        suggestedTags: tags,
        source: source,
        confidence: confidence,
        importance: importance,
        createdAt: now,
        range: payload.range || '',
        reason: payload.reason || '',
        stateMeta: payload.stateMeta && typeof payload.stateMeta === 'object'
            ? Object.assign({}, payload.stateMeta)
            : (tags.includes('state') ? makeStateMeta(inferStateReasonType(content), now, null, payloadStateOwner || 'user') : null),
        stateOwner: payloadStateOwner,
        stateExtractMeta: stateExtractMetaPayload,
        status: 'pending'
    };
    if (candidate.stateMeta && typeof candidate.stateMeta === 'object' && tags.includes('state')) {
        candidate.stateMeta.owner = payloadStateOwner || 'user';
    }
    ensureMemoryImportance(candidate, candidate.suggestedTags, 'long_term');
    window.iphoneSimState.memoryCandidates.push(candidate);
    saveConfig();
    const memoryApp = document.getElementById('memory-app');
    if (memoryApp && !memoryApp.classList.contains('hidden')) renderMemoryList();
    return candidate;
}

function approveMemoryCandidate(candidateId, overrides = {}) {
    ensureMemoryCollections();
    const candidate = window.iphoneSimState.memoryCandidates.find(item => item.id === candidateId);
    if (!candidate || candidate.status !== 'pending') return null;
    const memory = createOrMergeApprovedMemory({
        contactId: candidate.contactId,
        content: overrides.content || candidate.content,
        title: overrides.title || candidate.title || '',
        memoryTags: overrides.memoryTags || candidate.suggestedTags,
        source: candidate.source || 'auto_summary',
        confidence: clampFloat(overrides.confidence, candidate.confidence, 0, 1),
        importance: normalizeMemoryImportanceValue(overrides.importance, getMemoryImportance(candidate, getDefaultImportanceByTags(candidate && candidate.suggestedTags, 'long_term'))),
        range: overrides.range || candidate.range || '',
        stateOwner: overrides.stateOwner || candidate.stateOwner || getMemoryStateOwner(candidate, 'user'),
        stateMeta: overrides.stateMeta || candidate.stateMeta || null
    });
    candidate.status = 'approved';
    saveConfig();
    renderMemoryList();
    return memory.memory;
}

function rejectMemoryCandidate(candidateId) {
    ensureMemoryCollections();
    const candidate = window.iphoneSimState.memoryCandidates.find(item => item.id === candidateId);
    if (!candidate || candidate.status !== 'pending') return;
    candidate.status = 'rejected';
    saveConfig();
    renderMemoryList();
}

window.getMemorySettingsV2 = ensureMemorySettingsV2;
window.createMemoryCandidate = createMemoryCandidate;
window.createOrMergeApprovedMemory = createOrMergeApprovedMemory;
window.approveMemoryCandidate = approveMemoryCandidate;
window.rejectMemoryCandidate = rejectMemoryCandidate;
window.syncLegacyPerceptionAndState = syncLegacyPerceptionAndState;

function getMemoryImportanceThreshold(settings, contact, bucket) {
    const base = settings && settings.injectImportanceMin && typeof settings.injectImportanceMin === 'object'
        ? settings.injectImportanceMin
        : {};
    const override = contact && contact.memoryInjectImportanceMin && typeof contact.memoryInjectImportanceMin === 'object'
        ? contact.memoryInjectImportanceMin
        : {};
    const fallback = Number.isFinite(Number(base[bucket])) ? Number(base[bucket]) : 0.5;
    return clampFloat(override[bucket], fallback, 0.1, 1);
}

function isMemoryAboveImportance(memory, bucket, settings, contact) {
    const normalizedTags = normalizeMemoryTags(memory && memory.memoryTags, 'long_term');
    const fallbackImportance = getDefaultImportanceByTags(normalizedTags, 'long_term');
    const importance = getMemoryImportance(memory, fallbackImportance);
    const threshold = getMemoryImportanceThreshold(settings, contact, bucket);
    return importance >= threshold;
}

function buildLegacyMemoryContext(contact, history) {
    const settings = ensureMemorySettingsV2();
    const memories = getContactMemories(contact.id)
        .filter(memory => {
            const tags = normalizeMemoryTags(memory && memory.memoryTags, 'long_term');
            return tags.some(tag => isMemoryAboveImportance(memory, tag, settings, contact));
        })
        .sort((a, b) => (b.time || 0) - (a.time || 0));
    if (memories.length === 0) return '';
    const finalList = memories.slice().sort((a, b) => (a.time || 0) - (b.time || 0));
    if (finalList.length === 0) return '';
    let output = '\n【历史记忆 (已知事实)】\n⚠️ 注意：以下内容是你们过去的共同经历或已知事实，请勿重复向用户复述，除非用户主动询问或需要回忆。\n';
    finalList.forEach(memory => {
        const date = new Date(memory.time || Date.now());
        const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        output += `- [${dateStr}] ${memory.content}\n`;
    });
    return output;
}

function buildMemoryInjectDebugRow(memory, bucket) {
    const date = new Date(memory && memory.time ? memory.time : Date.now());
    const timeText = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const fallbackImportance = getDefaultImportanceByTags(memory && memory.memoryTags, 'long_term');
    return {
        bucket,
        id: Number(memory && memory.id),
        time: timeText,
        tags: normalizeMemoryTags(memory && memory.memoryTags, 'long_term').join(','),
        importance: getMemoryImportance(memory, fallbackImportance),
        content: String(memory && memory.content || '').slice(0, 120)
    };
}

function emitMemoryInjectDebug(contact, payload = {}) {
    const debugPayload = Object.assign({
        source: 'chat',
        reason: '',
        settings: {},
        selectedRows: [],
        sectionCounts: {},
        memoryContext: ''
    }, payload || {});

    window.__lastMemoryInjectDebug = {
        contactId: contact && contact.id ? contact.id : null,
        contactName: contact ? (contact.remark || contact.nickname || contact.name || String(contact.id || '')) : '',
        ts: Date.now(),
        ...debugPayload
    };

    const contactName = contact ? (contact.remark || contact.nickname || contact.name || String(contact.id || '')) : 'unknown';
    const rowCount = Array.isArray(debugPayload.selectedRows) ? debugPayload.selectedRows.length : 0;
    const header = `[memory-inject] source=${debugPayload.source} contact=${contactName} selected=${rowCount}`;
    try {
        console.groupCollapsed(header);
        if (debugPayload.reason) console.log('reason:', debugPayload.reason);
        if (debugPayload.settings) console.log('settings:', debugPayload.settings);
        if (Array.isArray(debugPayload.selectedRows) && debugPayload.selectedRows.length > 0) {
            if (typeof console.table === 'function') {
                console.table(debugPayload.selectedRows);
            } else {
                console.log('selectedRows:', debugPayload.selectedRows);
            }
        } else {
            console.log('selectedRows: []');
        }
        console.log('sectionCounts:', debugPayload.sectionCounts || {});
        if (debugPayload.memoryContext) {
            console.log('memoryContext:\n' + debugPayload.memoryContext);
        } else {
            console.log('memoryContext: (empty)');
        }
        console.groupEnd();
    } catch (error) {}
}

function buildMemoryContextByPolicy(contact, history, debugSource = 'chat') {
    if (!contact || !contact.id) return '';
    const settings = ensureMemorySettingsV2();
    const all = getContactMemories(contact.id).map(memory => {
        const clone = memory;
        clone.memoryTags = normalizeMemoryTags(clone.memoryTags, clone.content && clone.content.startsWith('【通话回忆】') ? 'short_term' : 'long_term');
        ensureMemoryImportance(clone, clone.memoryTags, 'long_term');
        if (clone.memoryTags.includes('state')) normalizeStateMetaForMemory(clone);
        return clone;
    });
    
    // [调试] 显示配置和过滤情况
    console.log('[buildMemoryContextByPolicy] 总记忆数:', all.length);
    console.log('[buildMemoryContextByPolicy] 配置:', {
        daysBase: settings.injectRecentDays,
        importanceBase: settings.injectImportanceMin,
        legacyQuota: settings.injectQuota
    });
    
    if (all.length === 0) {
        const noMemImportance = Object.assign({}, settings.injectImportanceMin, contact.memoryInjectImportanceMin || {});
        emitMemoryInjectDebug(contact, {
            source: debugSource,
            reason: 'no_memories',
            settings: {
                injectRecentDays: settings.injectRecentDays,
                injectImportanceMin: noMemImportance,
                legacyInjectQuota: settings.injectQuota
            },
            selectedRows: [],
            sectionCounts: {},
            memoryContext: ''
        });
        return '';
    }

    const historyText = history.slice(-20).map(item => String(item.content || '')).join(' ');
    const now = Date.now();
    const daysBase = Object.assign({}, settings.injectRecentDays, contact.memoryInjectRecentDays || {});
    const importanceBase = Object.assign({}, settings.injectImportanceMin, contact.memoryInjectImportanceMin || {});
    const legacyQuota = Object.assign({}, settings.injectQuota, contact.memoryInjectQuota || {});
    const dayMs = 24 * 60 * 60 * 1000;
    const getDaysLimit = (bucket) => clampInt(daysBase[bucket], settings.injectRecentDays[bucket], 0, 3650);
    const getImportanceLimit = (bucket) => clampFloat(importanceBase[bucket], settings.injectImportanceMin[bucket], 0.1, 1);
    const effectiveImportanceMin = {
        short_term: getImportanceLimit('short_term'),
        long_term: getImportanceLimit('long_term'),
        state: getImportanceLimit('state'),
        refined: getImportanceLimit('refined')
    };
    const isWithinRecentDays = (memory, bucket) => {
        const days = getDaysLimit(bucket);
        if (days <= 0) return true;
        const ts = Number(memory && memory.time);
        if (!Number.isFinite(ts) || ts <= 0) return false;
        return (now - ts) <= days * dayMs;
    };
    const isAboveImportanceLimit = (memory, bucket) => {
        const importance = getMemoryImportance(memory, getDefaultImportanceByTags(memory && memory.memoryTags, 'long_term'));
        return importance >= getImportanceLimit(bucket);
    };
    const hasActiveRecentDaysLimit = ['short_term', 'long_term', 'state', 'refined']
        .some(bucket => getDaysLimit(bucket) > 0);

    const withScore = all.map(memory => {
        const relevance = computeMemoryRelevance(memory.content, historyText);
        const freshness = 1 - Math.min(1, Math.max(0, (now - (Number(memory.time) || now)) / (30 * 24 * 60 * 60 * 1000)));
        const confidence = clampFloat(memory.confidence, 0.7, 0, 1);
        const importance = getMemoryImportance(memory, getDefaultImportanceByTags(memory.memoryTags, 'long_term'));
        const score = 0.5 * relevance + 0.2 * freshness + 0.15 * confidence + 0.15 * importance;
        return { memory, relevance, freshness, confidence, importance, score };
    });

    const stateCandidates = withScore
        .filter(item => item.memory.memoryTags.includes('state'))
        .filter(item => isWithinRecentDays(item.memory, 'state'))
        .filter(item => isAboveImportanceLimit(item.memory, 'state'))
        .filter(item => !item.memory.stateMeta || item.memory.stateMeta.phase === 'active')
        .sort((a, b) => b.score - a.score);
    const stateList = stateCandidates.slice();
    const shortList = withScore
        .filter(item => item.memory.memoryTags.includes('short_term'))
        .filter(item => isWithinRecentDays(item.memory, 'short_term'))
        .filter(item => isAboveImportanceLimit(item.memory, 'short_term'))
        .sort((a, b) => (b.freshness + b.relevance) - (a.freshness + a.relevance));
    const longList = withScore
        .filter(item => item.memory.memoryTags.includes('long_term'))
        .filter(item => isWithinRecentDays(item.memory, 'long_term'))
        .filter(item => isAboveImportanceLimit(item.memory, 'long_term'))
        .sort((a, b) => b.score - a.score);
    
    // [调试] 显示每个类别的过滤结果
    const longTermTotal = withScore.filter(item => item.memory.memoryTags.includes('long_term')).length;
    const longTermRecentDays = withScore.filter(item => item.memory.memoryTags.includes('long_term')).filter(item => isWithinRecentDays(item.memory, 'long_term')).length;
    const longTermImportance = withScore.filter(item => item.memory.memoryTags.includes('long_term')).filter(item => isWithinRecentDays(item.memory, 'long_term')).filter(item => isAboveImportanceLimit(item.memory, 'long_term')).length;
    console.log('[buildMemoryContextByPolicy] 长期记忆: 总数', longTermTotal, '过滤后(时间)', longTermRecentDays, '过滤后(重要性)', longTermImportance, '最终发送', longList.length);
    console.log('[buildMemoryContextByPolicy] state:', stateList.length, 'short_term:', shortList.length, 'long_term:', longList.length);
    const refinedList = withScore
        .filter(item => item.memory.memoryTags.includes('refined'))
        .filter(item => isWithinRecentDays(item.memory, 'refined'))
        .filter(item => isAboveImportanceLimit(item.memory, 'refined'))
        .sort((a, b) => (b.memory.time || 0) - (a.memory.time || 0));

    let selected = [
        ...stateList.map(item => ({ bucket: 'state', item })),
        ...shortList.map(item => ({ bucket: 'short_term', item })),
        ...longList.map(item => ({ bucket: 'long_term', item })),
        ...refinedList.map(item => ({ bucket: 'refined', item }))
    ];
    if (selected.length === 0) {
        const fallbackContext = hasActiveRecentDaysLimit ? '' : buildLegacyMemoryContext(contact, history);
        emitMemoryInjectDebug(contact, {
            source: debugSource,
            reason: hasActiveRecentDaysLimit ? 'empty_after_recent_days_filter' : 'empty_policy_use_legacy_fallback',
            settings: {
                injectRecentDays: settings.injectRecentDays,
                injectImportanceMin: effectiveImportanceMin,
                legacyInjectQuota: legacyQuota
            },
            selectedRows: [],
            sectionCounts: { state: 0, short_term: 0, long_term: 0, refined: 0 },
            memoryContext: fallbackContext
        });
        return fallbackContext;
    }

    const sections = { state: [], short_term: [], long_term: [], refined: [] };
    selected.forEach(entry => sections[entry.bucket].push(entry.item.memory));

    const buildSection = (title, list) => {
        if (!list || list.length === 0) return '';
        let text = `\n【${title}】\n`;
        if (title === '状态记忆') {
            text += '- 说明：每条状态会标注主体（用户/联系人），请勿混淆主体。\n';
        }
        list.sort((a, b) => (a.time || 0) - (b.time || 0)).forEach(memory => {
            const date = new Date(memory.time || Date.now());
            const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
            let lineContent = String(memory.content || '');
            if (title === '状态记忆') {
                const owner = getMemoryStateOwner(memory, 'user');
                const ownerLabel = owner === 'contact' ? '联系人状态' : '用户状态';
                lineContent = /^((用户|联系人)当前状态[:：]|(用户状态|联系人状态)[:：])/.test(lineContent)
                    ? lineContent
                    : `${ownerLabel}：${lineContent}`;
            }
            text += `- [${dateStr}] ${lineContent}\n`;
        });
        return text;
    };

    let output = '';
    output += buildSection('状态记忆', sections.state);
    output += buildSection('短期记忆', sections.short_term);
    output += buildSection('长期记忆', sections.long_term);
    output += buildSection('精炼记忆', sections.refined);
    if (!output.trim()) {
        const fallbackContext = hasActiveRecentDaysLimit ? '' : buildLegacyMemoryContext(contact, history);
        emitMemoryInjectDebug(contact, {
            source: debugSource,
            reason: hasActiveRecentDaysLimit ? 'empty_output_after_section_build' : 'empty_output_use_legacy_fallback',
            settings: {
                injectRecentDays: settings.injectRecentDays,
                injectImportanceMin: effectiveImportanceMin,
                legacyInjectQuota: legacyQuota
            },
            selectedRows: selected.map(entry => buildMemoryInjectDebugRow(entry.item.memory, entry.bucket)),
            sectionCounts: {
                state: sections.state.length,
                short_term: sections.short_term.length,
                long_term: sections.long_term.length,
                refined: sections.refined.length
            },
            memoryContext: fallbackContext
        });
        return fallbackContext;
    }

    emitMemoryInjectDebug(contact, {
        source: debugSource,
        reason: 'policy_selected',
        settings: {
            injectRecentDays: settings.injectRecentDays,
            injectImportanceMin: effectiveImportanceMin,
            legacyInjectQuota: legacyQuota
        },
        selectedRows: selected.map(entry => buildMemoryInjectDebugRow(entry.item.memory, entry.bucket)),
        sectionCounts: {
            state: sections.state.length,
            short_term: sections.short_term.length,
            long_term: sections.long_term.length,
            refined: sections.refined.length
        },
        memoryContext: output
    });
    return output;
}

window.buildMemoryContextByPolicy = buildMemoryContextByPolicy;

function pruneSelectedMemoryIds(contactId) {
    const idSet = new Set(
        getContactMemories(contactId)
            .filter(memory => memory && Number.isFinite(Number(memory.id)))
            .map(memory => Number(memory.id))
    );
    selectedMemoryIds = new Set(
        Array.from(selectedMemoryIds).filter(id => idSet.has(Number(id)))
    );
}

function getSortedMemoriesForCurrentFilter(memories) {
    const filterTag = MEMORY_FILTER_TO_TAG[currentMemoryFilter] || null;
    const filtered = filterTag
        ? memories.filter(memory => normalizeMemoryTags(memory.memoryTags, 'long_term').includes(filterTag))
        : memories;
    return filtered.sort((a, b) => (b.time || 0) - (a.time || 0));
}

function getMemoryFilterLabel(filterKey) {
    return MEMORY_FILTER_LABELS[filterKey] || MEMORY_FILTER_LABELS.all;
}

function updateMemoryFilterDropdownUI() {
    const trigger = document.getElementById('memory-filter-trigger');
    const dropdown = document.getElementById('memory-filter-dropdown');
    const currentLabel = document.getElementById('memory-filter-current-label');
    const options = document.querySelectorAll('#memory-filter-dropdown .memory-filter-option');
    if (currentLabel) currentLabel.textContent = getMemoryFilterLabel(currentMemoryFilter);
    options.forEach(option => {
        option.classList.toggle('is-active', option.dataset.filter === currentMemoryFilter);
    });
    if (trigger && dropdown) {
        trigger.setAttribute('aria-expanded', dropdown.classList.contains('is-open') ? 'true' : 'false');
    }
}

function closeMemoryFilterDropdown() {
    const trigger = document.getElementById('memory-filter-trigger');
    const dropdown = document.getElementById('memory-filter-dropdown');
    if (dropdown) dropdown.classList.remove('is-open');
    if (trigger) trigger.classList.remove('is-open');
    updateMemoryFilterDropdownUI();
}

function applyMemoryFilter(filterKey) {
    const safeFilter = MEMORY_FILTER_LABELS[filterKey] ? filterKey : 'all';
    currentMemoryFilter = safeFilter;
    if (currentMemoryFilter === 'candidate' && memorySelectMode) {
        memorySelectMode = false;
        selectedMemoryIds = new Set();
    }
    closeMemoryFilterDropdown();
    renderMemoryList();
}

function getSelectableMemoryIdsForCurrentFilter(contactId, limitCount = null) {
    if (!contactId || currentMemoryFilter === 'candidate') return [];
    const sorted = getSortedMemoriesForCurrentFilter(getContactMemories(contactId).slice());
    const limited = Number.isFinite(Number(limitCount)) && Number(limitCount) > 0
        ? sorted.slice(0, Number(limitCount))
        : sorted;
    return limited
        .map(memory => Number(memory.id))
        .filter(id => Number.isFinite(id));
}

function parseMemoryDateInputToTimestamp(dateText, endOfDay = false) {
    const raw = String(dateText || '').trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
    const [yearStr, monthStr, dayStr] = raw.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
    const date = endOfDay
        ? new Date(year, month - 1, day, 23, 59, 59, 999)
        : new Date(year, month - 1, day, 0, 0, 0, 0);
    const ts = date.getTime();
    return Number.isFinite(ts) ? ts : null;
}

function getSelectableMemoryIdsForDateRange(contactId, startTs, endTs) {
    if (!contactId || currentMemoryFilter === 'candidate') return [];
    const minTs = Math.min(startTs, endTs);
    const maxTs = Math.max(startTs, endTs);
    return getSortedMemoriesForCurrentFilter(getContactMemories(contactId).slice())
        .filter(memory => {
            const ts = Number(memory && memory.time);
            return Number.isFinite(ts) && ts >= minTs && ts <= maxTs;
        })
        .map(memory => Number(memory.id))
        .filter(id => Number.isFinite(id));
}

function pickPrimaryDisplayTag(tags, fallbackTag = 'long_term') {
    const normalized = normalizeMemoryTags(tags, fallbackTag);
    const byPriority = MEMORY_DISPLAY_TAG_PRIORITY.find(tag => normalized.includes(tag));
    if (byPriority) return byPriority;
    return normalized[0] || fallbackTag;
}

function buildAllTagBadgesForMemory(memory, tags) {
    const normalizedTags = normalizeMemoryTags(tags, 'long_term');
    let badgeHtml = normalizedTags
        .map(tag => `<span class="memory-tag-badge tag-${tag}">${escapeHtml(MEMORY_TAG_LABELS[tag] || String(tag || '').toUpperCase())}</span>`)
        .join('');
    const importance = Math.round(getMemoryImportance(memory, getDefaultImportanceByTags(normalizedTags, 'long_term')) * 100);
    badgeHtml += `<span class="memory-tag-badge tag-memory-importance">重要性：${importance}%</span>`;

    if (!normalizedTags.includes('state')) return badgeHtml;

    normalizeStateMetaForMemory(memory);
    const phase = memory && memory.stateMeta && memory.stateMeta.phase ? memory.stateMeta.phase : 'active';
    const reasonType = memory && memory.stateMeta && memory.stateMeta.reasonType
        ? memory.stateMeta.reasonType
        : inferStateReasonType(memory && memory.content);
    const ownerLabel = getStateOwnerLabel(getMemoryStateOwner(memory, 'user'), memory && memory.contactId);
    badgeHtml += `<span class="memory-tag-badge tag-state-reason">类型：${escapeHtml(getStateReasonLabel(reasonType))}</span>`;
    badgeHtml += `<span class="memory-tag-badge tag-state-phase">阶段：${escapeHtml(getStatePhaseLabel(phase))}</span>`;
    badgeHtml += `<span class="memory-tag-badge tag-state-owner">${escapeHtml(ownerLabel)}</span>`;
    return badgeHtml;
}

function buildAllTagBadgesForCandidate(candidate, tags) {
    const normalizedTags = normalizeMemoryTags(tags, 'long_term');
    let badgeHtml = normalizedTags
        .map(tag => `<span class="memory-tag-badge tag-${tag}">${escapeHtml(MEMORY_TAG_LABELS[tag] || String(tag || '').toUpperCase())}</span>`)
        .join('');
    const importance = Math.round(getMemoryImportance(candidate, getDefaultImportanceByTags(normalizedTags, 'long_term')) * 100);
    badgeHtml += `<span class="memory-tag-badge tag-memory-importance">重要性：${importance}%</span>`;

    if (!normalizedTags.includes('state')) return badgeHtml;

    const phase = candidate && candidate.stateMeta && candidate.stateMeta.phase ? candidate.stateMeta.phase : 'active';
    const reasonType = candidate && candidate.stateMeta && candidate.stateMeta.reasonType
        ? candidate.stateMeta.reasonType
        : inferStateReasonType(candidate && candidate.content);
    const ownerLabel = getStateOwnerLabel(getMemoryStateOwner(candidate, 'user'), candidate && candidate.contactId);
    badgeHtml += `<span class="memory-tag-badge tag-state-reason">类型：${escapeHtml(getStateReasonLabel(reasonType))}</span>`;
    badgeHtml += `<span class="memory-tag-badge tag-state-phase">阶段：${escapeHtml(getStatePhaseLabel(phase))}</span>`;
    badgeHtml += `<span class="memory-tag-badge tag-state-owner">${escapeHtml(ownerLabel)}</span>`;
    return badgeHtml;
}

function updateMemoryRefineToolbar() {
    const selectAllBtn = document.getElementById('memory-select-all-btn');
    const selectRecentBtn = document.getElementById('memory-select-recent-btn');
    const selectRecentCountInput = document.getElementById('memory-select-recent-count');
    const selectStartDateInput = document.getElementById('memory-select-start-date');
    const selectEndDateInput = document.getElementById('memory-select-end-date');
    const selectDateRangeBtn = document.getElementById('memory-select-date-range-btn');
    const selectInvertBtn = document.getElementById('memory-select-invert-btn');
    const selectClearBtn = document.getElementById('memory-select-clear-btn');
    const refineBtn = document.getElementById('memory-refine-selected-btn');
    const contactId = window.iphoneSimState.currentChatContactId;
    const currentFilter = currentMemoryFilter;
    const canSelect = !!contactId && currentFilter !== 'candidate';
    const selectedCount = selectedMemoryIds.size;
    const selectableCount = canSelect ? getSelectableMemoryIdsForCurrentFilter(contactId).length : 0;

    if (selectAllBtn) selectAllBtn.disabled = !canSelect || selectableCount === 0;
    if (selectRecentBtn) selectRecentBtn.disabled = !canSelect || selectableCount === 0;
    if (selectRecentCountInput) selectRecentCountInput.disabled = !canSelect;
    if (selectStartDateInput) selectStartDateInput.disabled = !canSelect;
    if (selectEndDateInput) selectEndDateInput.disabled = !canSelect;
    if (selectDateRangeBtn) selectDateRangeBtn.disabled = !canSelect || selectableCount === 0;
    if (selectInvertBtn) selectInvertBtn.disabled = !canSelect || selectableCount === 0;
    if (selectClearBtn) selectClearBtn.disabled = !memorySelectMode || selectedCount === 0;
    if (refineBtn) {
        refineBtn.disabled = !memorySelectMode || selectedCount === 0 || !canSelect;
    }
}

function setMemoryRefinePanelVisible(visible) {
    memoryRefinePanelVisible = !!visible;
    const toolbar = document.getElementById('memory-refine-toolbar');
    if (toolbar) {
        toolbar.style.display = memoryRefinePanelVisible ? '' : 'none';
    }
    const toggleBtn = document.getElementById('memory-refine-panel-toggle-btn');
    if (toggleBtn) {
        toggleBtn.textContent = memoryRefinePanelVisible ? 'HIDE_OPS' : 'BATCH_OPS';
    }
}

window.toggleMemoryRefinePanel = function(forceVisible) {
    const nextVisible = typeof forceVisible === 'boolean' ? forceVisible : !memoryRefinePanelVisible;
    if (!nextVisible) {
        resetMemorySelection();
        setMemoryRefinePanelVisible(false);
        renderMemoryList();
        updateMemoryRefineToolbar();
        return;
    }
    const contactId = window.iphoneSimState.currentChatContactId;
    if (currentMemoryFilter === 'candidate') {
        currentMemoryFilter = 'all';
    }
    if (contactId) {
        memorySelectMode = true;
        pruneSelectedMemoryIds(contactId);
    } else {
        memorySelectMode = false;
        selectedMemoryIds = new Set();
    }
    setMemoryRefinePanelVisible(true);
    renderMemoryList();
    updateMemoryRefineToolbar();
};

function resetMemorySelection() {
    selectedMemoryIds = new Set();
    memorySelectMode = false;
    updateMemoryRefineToolbar();
}

window.toggleMemorySelectMode = function(forceMode) {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId || currentMemoryFilter === 'candidate') return;
    memorySelectMode = typeof forceMode === 'boolean' ? forceMode : !memorySelectMode;
    if (!memorySelectMode) {
        selectedMemoryIds = new Set();
    } else {
        pruneSelectedMemoryIds(contactId);
    }
    renderMemoryList();
};

window.toggleMemorySelection = function(id, checked) {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;
    if (checked) {
        selectedMemoryIds.add(numericId);
    } else {
        selectedMemoryIds.delete(numericId);
    }
    updateMemoryRefineToolbar();
};

window.selectAllMemoriesForRefine = function() {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId || currentMemoryFilter === 'candidate') return;
    memorySelectMode = true;
    selectedMemoryIds = new Set(getSelectableMemoryIdsForCurrentFilter(contactId));
    renderMemoryList();
};

window.selectRecentMemoriesForRefine = function(count = 10) {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId || currentMemoryFilter === 'candidate') return;
    const parsedCount = Number(count);
    const safeCount = Number.isFinite(parsedCount) && parsedCount > 0
        ? clampInt(parsedCount, 10, 1, 500)
        : 10;
    memorySelectMode = true;
    const ids = getSelectableMemoryIdsForCurrentFilter(contactId, safeCount);
    selectedMemoryIds = new Set(ids);
    renderMemoryList();
    if (ids.length === 0) {
        showNotification('当前筛选下没有可选择的记忆', 1600);
    }
};

window.selectMemoriesByDateRangeForRefine = function(startDate, endDate) {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId || currentMemoryFilter === 'candidate') return;
    const startTs = parseMemoryDateInputToTimestamp(startDate, false);
    const endTs = parseMemoryDateInputToTimestamp(endDate, true);
    if (startTs === null || endTs === null) {
        showNotification('请选择完整的开始和结束日期', 1800);
        return;
    }
    memorySelectMode = true;
    const ids = getSelectableMemoryIdsForDateRange(contactId, startTs, endTs);
    selectedMemoryIds = new Set(ids);
    renderMemoryList();
    if (ids.length === 0) {
        showNotification('这个日期区间没有可精炼记忆', 1800);
    } else {
        showNotification(`已按日期选中 ${ids.length} 条记忆`, 1300, 'success');
    }
};

window.invertMemorySelectionForRefine = function() {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId || currentMemoryFilter === 'candidate') return;
    memorySelectMode = true;
    const visibleIds = getSelectableMemoryIdsForCurrentFilter(contactId);
    const next = new Set();
    visibleIds.forEach(id => {
        if (!selectedMemoryIds.has(id)) next.add(id);
    });
    selectedMemoryIds = next;
    renderMemoryList();
};

window.clearMemorySelectionForRefine = function() {
    selectedMemoryIds = new Set();
    updateMemoryRefineToolbar();
    renderMemoryList();
};

window.extractSpecificNamesFromStructuredMessage = function(type, content, msgId) {
    const safeType = String(type || '').trim();
    if (!['shopping_gift', 'delivery_share', 'gift_card'].includes(safeType)) return [];

    let payload = content;
    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch (error) {
            payload = null;
        }
    }
    if (!payload || typeof payload !== 'object') return [];

    const names = [];
    if ((safeType === 'shopping_gift' || safeType === 'delivery_share') && Array.isArray(payload.items)) {
        payload.items.forEach(item => {
            const title = item && typeof item === 'object' ? String(item.title || '').trim() : '';
            if (title) names.push(title);
        });
    }
    if (safeType === 'gift_card') {
        const title = String(payload.title || '').trim();
        if (title) names.push(title);
    }
    return normalizeExactNames(names);
};

window.extractSpecificNamesFromUserText = function(text) {
    const raw = String(text || '').trim();
    if (!raw) return [];
    const names = [];

    const quoteRegex = /[“"「『]([^“”"「」『』]{1,40})[”"」』]/g;
    let quoteMatch;
    while ((quoteMatch = quoteRegex.exec(raw)) !== null) {
        const cleaned = cleanupExtractedName(quoteMatch[1]);
        if (cleaned) names.push(cleaned);
    }

    const actionRegex = /(?:给你(?:点了|买了|送了|下单了)|我(?:刚|刚刚|今天|已经|又)?(?:给你)?(?:点了|买了|送了|下单了)|(?:点了|买了|送了|下单了|给你点了))\s*([^，。！？!\?\n]{1,40})/g;
    let actionMatch;
    while ((actionMatch = actionRegex.exec(raw)) !== null) {
        splitNamesByJoiners(actionMatch[1]).forEach(part => {
            const cleaned = cleanupExtractedName(part);
            if (cleaned) names.push(cleaned);
        });
    }

    return normalizeExactNames(names);
};

async function callRefineMemoryBatchModel(contact, selectedMemories) {
    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings;
    if (!settings || !settings.url || !settings.key) return null;

    const records = selectedMemories.map(memory => {
        const date = new Date(memory.time || Date.now());
        const timeText = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        return `#${memory.id} [${timeText}] ${memory.content}`;
    }).join('\n');

    let fetchUrl = settings.url;
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? `${fetchUrl}chat/completions` : `${fetchUrl}/chat/completions`;
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
                {
                    role: 'system',
                    content: `你是记忆精炼助手。输入是同一联系人的多条记忆，请输出严格 JSON：
{
  "refined_summary": "1-2句总览"
}
要求：
1) 只输出 JSON，不要 Markdown。
2) 只生成一条适合归档的精炼总览，不要额外字段。`
                },
                {
                    role: 'user',
                    content: `联系人：${contact && contact.name ? contact.name : '未知联系人'}\n记忆列表：\n${records}`
                }
            ],
            temperature: 0.2
        })
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = String(data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '').trim();
    if (!content) return null;

    const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleaned);
    } catch (error) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) return null;
        try {
            return JSON.parse(match[0]);
        } catch (error2) {
            return null;
        }
    }
}

window.refineSelectedMemories = async function(contactId, selectedIds) {
    const cid = Number(contactId);
    if (!Number.isFinite(cid)) return null;
    const uniqueIds = Array.from(new Set((Array.isArray(selectedIds) ? selectedIds : []).map(id => Number(id)).filter(id => Number.isFinite(id))));
    if (uniqueIds.length === 0) {
        showNotification('请先选择要精炼的记忆', 1800);
        return null;
    }

    const selectedMemories = getContactMemories(cid)
        .filter(memory => uniqueIds.includes(Number(memory.id)))
        .sort((a, b) => (a.time || 0) - (b.time || 0));
    if (selectedMemories.length === 0) {
        showNotification('没有可精炼的记忆', 1800);
        return null;
    }

    const contact = window.iphoneSimState.contacts.find(item => item.id === cid);
    showNotification('正在精炼归档...', 1500);

    let result = null;
    try {
        result = await callRefineMemoryBatchModel(contact, selectedMemories);
    } catch (error) {
        console.warn('refineSelectedMemories model call failed', error);
    }

    let refinedSummary = '';
    if (result && typeof result.refined_summary === 'string') {
        refinedSummary = result.refined_summary.trim();
    }
    if (!refinedSummary) {
        refinedSummary = selectedMemories.map(memory => String(memory.content || '').trim()).filter(Boolean).slice(0, 2).join('；');
        if (refinedSummary.length > 140) refinedSummary = `${refinedSummary.slice(0, 140)}...`;
    }
    if (!refinedSummary) {
        showNotification('精炼失败，请稍后重试', 1800);
        return null;
    }

    createOrMergeApprovedMemory({
        contactId: cid,
        content: refinedSummary,
        memoryTags: ['refined'],
        source: 'refine',
        confidence: 0.9,
        refinedFrom: uniqueIds,
        refinedMeta: {
            selectedMemoryIds: uniqueIds,
            sourceMemoryCount: uniqueIds.length
        }
    });

    syncLegacyPerceptionAndState(cid);
    saveConfig();
    resetMemorySelection();
    renderMemoryList();
    showNotification('精炼归档完成：总览 1 条', 2200, 'success');
    return {
        refinedSummary,
        keyFacts: []
    };
};

function openMemoryApp() {
    if (!window.iphoneSimState.currentChatContactId) {
        alert('请先进入一个聊天窗口');
        return;
    }
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const memoryCollectionChanged = ensureMemoryCollections();
    ensureMemorySettingsV2();
    syncLegacyPerceptionAndState(contact.id);
    if (memoryCollectionChanged) saveConfig();
    resetMemorySelection();
    closeMemoryFilterDropdown();
    setMemoryRefinePanelVisible(false);
    pruneSelectedMemoryIds(contact.id);

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

    const checkedTags = Array.from(document.querySelectorAll('#manual-memory-tags input[type="checkbox"]:checked'))
        .map(input => input.value);
    const tags = normalizeMemoryTags(checkedTags, 'long_term');
    const manualImportanceInput = document.getElementById('manual-memory-importance');
    const importance = normalizeMemoryImportanceValue(
        manualImportanceInput ? manualImportanceInput.value : null,
        getDefaultImportanceByTags(tags, 'long_term')
    );
    let stateMeta = null;
    const stateOwner = tags.includes('state') ? inferStateOwnerFromContent(content, 'user') : null;
    if (tags.includes('state')) {
        const reason = document.getElementById('manual-memory-state-reason')
            ? document.getElementById('manual-memory-state-reason').value
            : 'other';
        const start = Date.now();
        stateMeta = makeStateMeta(reason, start, null, stateOwner || 'user');
    }

    createOrMergeApprovedMemory({
        contactId: window.iphoneSimState.currentChatContactId,
        content: content,
        time: Date.now(),
        memoryTags: tags,
        source: 'manual',
        confidence: 1,
        importance: importance,
        stateOwner: stateOwner,
        stateMeta: stateMeta
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
    showNotification('正在生成详细总结...');
    
    await generateSummary(contact, messagesToSummarize, range, {
        autoExtract: false,
        source: 'manual',
        suggestedTags: ['long_term'],
        reason: '手动详细总结'
    });
}

function openMemorySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;
    const settings = ensureMemorySettingsV2();
    const extractModeEl = document.getElementById('modal-memory-extract-mode');
    if (extractModeEl) extractModeEl.value = settings.extractMode || 'hybrid';
    const recentDaysMap = [
        ['short_term', 'modal-memory-days-short-term'],
        ['long_term', 'modal-memory-days-long-term'],
        ['state', 'modal-memory-days-state'],
        ['refined', 'modal-memory-days-refined']
    ];
    recentDaysMap.forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.value = settings.injectRecentDays[key] || 0;
    });
    const importanceMap = [
        ['short_term', 'modal-memory-importance-short-term'],
        ['long_term', 'modal-memory-importance-long-term'],
        ['state', 'modal-memory-importance-state'],
        ['refined', 'modal-memory-importance-refined']
    ];
    importanceMap.forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.value = clampFloat(settings.injectImportanceMin[key], 0.5, 0.1, 1).toFixed(2);
    });
    const dedupeEl = document.getElementById('modal-memory-dedupe-threshold');
    if (dedupeEl) dedupeEl.value = settings.dedupeThreshold;
    document.getElementById('memory-settings-modal').classList.remove('hidden');
}

function handleSaveMemorySettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const settings = ensureMemorySettingsV2();
    const extractModeEl = document.getElementById('modal-memory-extract-mode');
    if (extractModeEl && ['hybrid', 'auto', 'manual'].includes(extractModeEl.value)) {
        settings.extractMode = extractModeEl.value;
    }
    const recentDaysMap = [
        ['short_term', 'modal-memory-days-short-term'],
        ['long_term', 'modal-memory-days-long-term'],
        ['state', 'modal-memory-days-state'],
        ['refined', 'modal-memory-days-refined']
    ];
    recentDaysMap.forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el) return;
        settings.injectRecentDays[key] = clampInt(el.value, settings.injectRecentDays[key], 0, 3650);
    });
    const importanceMap = [
        ['short_term', 'modal-memory-importance-short-term'],
        ['long_term', 'modal-memory-importance-long-term'],
        ['state', 'modal-memory-importance-state'],
        ['refined', 'modal-memory-importance-refined']
    ];
    importanceMap.forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (!el) return;
        settings.injectImportanceMin[key] = clampFloat(el.value, settings.injectImportanceMin[key], 0.1, 1);
    });
    const dedupeEl = document.getElementById('modal-memory-dedupe-threshold');
    if (dedupeEl) {
        settings.dedupeThreshold = clampFloat(dedupeEl.value, settings.dedupeThreshold, 0.3, 0.99);
    }
    window.iphoneSimState.memorySettingsV2 = settings;
    
    saveConfig();
    document.getElementById('memory-settings-modal').classList.add('hidden');
    alert('设置已保存');
}

function renderMemoryList() {
    const list = document.getElementById('memory-list');
    const emptyState = document.getElementById('memory-empty');
    const candidatePanel = document.getElementById('memory-candidate-panel');
    const candidateList = document.getElementById('memory-candidate-list');
    const candidateCount = document.getElementById('memory-candidate-count');
    if (!list) return;

    list.innerHTML = '';
    if (candidateList) candidateList.innerHTML = '';
    updateMemoryFilterDropdownUI();

    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) {
        updateMemoryRefineToolbar();
        return;
    }

    ensureMemoryCollections();
    pruneSelectedMemoryIds(contactId);
    const contactMemories = getContactMemories(contactId).slice();
    let stateChanged = false;
    contactMemories.forEach(memory => {
        if (normalizeStateMetaForMemory(memory)) stateChanged = true;
    });
    if (stateChanged) {
        syncLegacyPerceptionAndState(contactId);
        saveConfig();
    }

    const pendingCandidates = getPendingCandidates(contactId).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (candidateCount) candidateCount.textContent = String(pendingCandidates.length);
    if (candidatePanel) {
        if (pendingCandidates.length === 0 && currentMemoryFilter !== 'candidate') {
            candidatePanel.style.display = 'none';
        } else {
            candidatePanel.style.display = '';
        }
    }
    if (candidateList) {
        pendingCandidates.forEach(candidate => {
            const item = document.createElement('div');
            item.className = 'memory-candidate-card';
            const candidateTags = normalizeMemoryTags(candidate.suggestedTags, 'long_term');
            const primaryTag = pickPrimaryDisplayTag(candidateTags, 'long_term');
            const primaryBadge = `<span class="memory-tag-badge tag-${primaryTag}">${escapeHtml(MEMORY_TAG_LABELS[primaryTag] || String(primaryTag || '').toUpperCase())}</span>`;
            const allTagBadges = buildAllTagBadgesForCandidate(candidate, candidateTags);
            item.innerHTML = `
                <div class="memory-primary-tag-wrap">${primaryBadge}</div>
                <div class="memory-candidate-content">${escapeHtml(candidate.content || '')}</div>
                <div class="memory-all-tags-panel">${allTagBadges}</div>
                <div class="memory-candidate-meta">${escapeHtml(formatCandidateMetaText(candidate))}</div>
                <div class="memory-candidate-actions">
                    <button class="approve-btn" onclick="event.stopPropagation(); window.approveMemoryCandidate('${candidate.id}'); showNotification('已存档', 1200, 'success');">存档</button>
                    <button onclick="event.stopPropagation(); window.editAndApproveMemoryCandidate('${candidate.id}')">改一下再存档</button>
                    <button class="reject-btn" onclick="event.stopPropagation(); window.rejectMemoryCandidate('${candidate.id}')">不保存</button>
                </div>
            `;
            item.addEventListener('click', function(e) {
                if (e.target.closest('.memory-candidate-actions')) return;
                const isActive = this.classList.contains('is-active');
                document.querySelectorAll('.memory-candidate-card').forEach(card => card.classList.remove('is-active'));
                if (!isActive) this.classList.add('is-active');
            });
            candidateList.appendChild(item);
        });
    }

    if (currentMemoryFilter === 'candidate') {
        if (emptyState) {
            emptyState.style.display = pendingCandidates.length > 0 ? 'none' : 'flex';
            emptyState.textContent = pendingCandidates.length > 0 ? '' : '暂无待确认记忆';
        }
        updateMemoryRefineToolbar();
        return;
    }

    const sortedMemories = getSortedMemoriesForCurrentFilter(contactMemories);

    if (sortedMemories.length === 0) {
        if (emptyState) {
            emptyState.style.display = 'flex';
            emptyState.textContent = '暂无记忆';
        }
        updateMemoryRefineToolbar();
        return;
    }
    if (emptyState) emptyState.style.display = 'none';

    sortedMemories.forEach(memory => {
        const item = document.createElement('div');
        item.className = 'archive-card';
        const date = new Date(memory.time || Date.now());
        const timeStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
        const title = buildMemoryDisplayTitle(memory);
        const tags = normalizeMemoryTags(memory.memoryTags, memory.content && memory.content.startsWith('【通话回忆】') ? 'short_term' : 'long_term');
        const refText = memory.range || (memory.id ? String(memory.id).slice(-4) : '0000');
        const primaryTag = pickPrimaryDisplayTag(tags, 'long_term');
        const primaryBadge = `<span class="memory-tag-badge tag-${primaryTag}">${escapeHtml(MEMORY_TAG_LABELS[primaryTag] || String(primaryTag || '').toUpperCase())}</span>`;
        const allTagBadges = buildAllTagBadgesForMemory(memory, tags);
        const selected = selectedMemoryIds.has(Number(memory.id));
        const selectControl = memorySelectMode
            ? `<label class="memory-select-wrap" title="选择用于精炼归档" onclick="event.stopPropagation();">
                    <input type="checkbox" ${selected ? 'checked' : ''} onclick="event.stopPropagation(); window.toggleMemorySelection('${String(memory.id)}', this.checked)">
                    <span>选择</span>
               </label>`
            : '';

        item.innerHTML = `
            <div class="card-top">
                <div style="display: flex; align-items: center;">${selectControl}<span class="ref-id">REF // ${refText}</span></div>
                <div class="memory-primary-tag-wrap">${primaryBadge}</div>
            </div>
            <div class="card-body">
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(memory.content || '')}</p>
                <div class="memory-all-tags-panel">${allTagBadges}</div>
            </div>
            <div class="card-footer">
                <div class="archive-actions" style="position: relative;">
                    <span style="cursor: pointer; margin-right: 10px; font-family: monospace; font-size: 10px; border: 1px solid #ccc; padding: 2px 5px; border-radius: 4px;" onclick="event.stopPropagation(); window.toggleMemoryActions(this, ${memory.id})">OPTS</span>
                    <div class="memory-action-menu" id="memory-action-${memory.id}" style="display: none; position: absolute; left: 0; bottom: 100%; background: white; border: 1px solid #eee; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 5px; z-index: 100;">
                        <div onclick="event.stopPropagation(); window.editMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">EDIT</div>
                        <div onclick="event.stopPropagation(); window.retagMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">RETAG</div>
                        <div onclick="event.stopPropagation(); window.refineMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">REFINE</div>
                        ${tags.includes('state') ? `<div onclick="event.stopPropagation(); window.resolveStateMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #333; border-bottom: 1px solid #f5f5f5;">RESOLVE</div>` : ''}
                        <div onclick="event.stopPropagation(); window.deleteMemory(${memory.id}); window.toggleMemoryActions(null, ${memory.id})" style="padding: 5px 10px; cursor: pointer; white-space: nowrap; font-size: 12px; color: #ff3b30;">DELETE</div>
                    </div>
                </div>
                <span>DATE: ${timeStr}</span>
            </div>
        `;

        item.addEventListener('click', function(e) {
            if (e.target.closest('.archive-actions') || e.target.closest('.memory-action-menu') || e.target.closest('.memory-select-wrap')) return;
            const isActive = this.classList.contains('is-active');
            document.querySelectorAll('.archive-card').forEach(card => card.classList.remove('is-active'));
            if (!isActive) this.classList.add('is-active');
        });

        list.appendChild(item);
    });
    updateMemoryRefineToolbar();
}

window.toggleMemoryActions = function(element, id) {
    const allMenus = document.querySelectorAll('.memory-action-menu');
    allMenus.forEach(menu => {
        if (menu.id !== `memory-action-${id}`) menu.style.display = 'none';
    });
    const menu = document.getElementById(`memory-action-${id}`);
    if (!menu) return;
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    if (menu.style.display !== 'block') return;
    const closeMenu = function(e) {
        if (!menu.contains(e.target) && (!element || !element.contains(e.target))) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
};

window.editMemory = function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;
    currentEditingMemoryId = id;
    document.getElementById('edit-memory-content').value = memory.content || '';
    const editTagCheckboxes = document.querySelectorAll('#edit-memory-tags input[type="checkbox"]');
    const tags = normalizeMemoryTags(memory.memoryTags, 'long_term');
    editTagCheckboxes.forEach(input => {
        input.checked = tags.includes(input.value);
    });
    ensureMemoryImportance(memory, tags, 'long_term');
    const importanceInput = document.getElementById('edit-memory-importance');
    if (importanceInput) {
        importanceInput.value = getMemoryImportance(memory, getDefaultImportanceByTags(tags, 'long_term')).toFixed(2);
    }
    const stateBlock = document.getElementById('edit-memory-state-options');
    if (stateBlock) stateBlock.style.display = tags.includes('state') ? '' : 'none';
    if (tags.includes('state')) {
        normalizeStateMetaForMemory(memory);
        const reasonInput = document.getElementById('edit-memory-state-reason');
        if (reasonInput) reasonInput.value = (memory.stateMeta && memory.stateMeta.reasonType) || 'other';
    }
    document.getElementById('edit-memory-modal').classList.remove('hidden');
};

window.editAndApproveMemoryCandidate = function(candidateId) {
    const candidate = window.iphoneSimState.memoryCandidates.find(item => item.id === candidateId);
    if (!candidate || candidate.status !== 'pending') return;
    const edited = prompt('改一下内容再存档：', candidate.content || '');
    if (edited === null) return;
    const text = String(edited).trim();
    if (!text) return alert('内容不能为空');
    const overrides = { content: text };
    const candidateTags = normalizeMemoryTags(candidate.suggestedTags, 'long_term');
    if (candidateTags.includes('state')) {
        const owner = getMemoryStateOwner(candidate, inferStateOwnerFromContent(text, 'user'));
        overrides.stateOwner = owner;
    }
    approveMemoryCandidate(candidateId, overrides);
    showNotification('已存档', 1200, 'success');
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
        const tags = Array.from(document.querySelectorAll('#edit-memory-tags input[type="checkbox"]:checked')).map(input => input.value);
        memory.memoryTags = normalizeMemoryTags(tags, 'long_term');
        const importanceInput = document.getElementById('edit-memory-importance');
        memory.importance = normalizeMemoryImportanceValue(
            importanceInput ? importanceInput.value : null,
            getDefaultImportanceByTags(memory.memoryTags, 'long_term')
        );
        if (memory.memoryTags.includes('state')) {
            const reason = document.getElementById('edit-memory-state-reason')
                ? document.getElementById('edit-memory-state-reason').value
                : inferStateReasonType(memory.content);
            const startAt = memory.stateMeta && Number.isFinite(Number(memory.stateMeta.startAt))
                ? Number(memory.stateMeta.startAt)
                : Date.now();
            const owner = getMemoryStateOwner(memory, 'user');
            memory.stateOwner = owner;
            const prevPhase = memory.stateMeta && memory.stateMeta.phase === 'resolved' ? 'resolved' : 'active';
            const prevResolvedAt = memory.stateMeta && Number.isFinite(Number(memory.stateMeta.resolvedAt))
                ? Number(memory.stateMeta.resolvedAt)
                : null;
            memory.stateMeta = makeStateMeta(reason, startAt, null, owner);
            memory.stateMeta.phase = prevPhase;
            memory.stateMeta.resolvedAt = prevPhase === 'resolved' ? prevResolvedAt : null;
        } else {
            delete memory.stateMeta;
            delete memory.stateOwner;
        }
        delete memory.factMeta;
        if (!memory.memoryTags.includes('refined')) {
            delete memory.refinedMeta;
        }
        syncLegacyPerceptionAndState(memory.contactId);
        saveConfig();
        renderMemoryList();
        document.getElementById('edit-memory-modal').classList.add('hidden');
    }
    currentEditingMemoryId = null;
}

window.deleteMemory = function(id) {
    if (!confirm('确定要删除这条记忆吗？')) return;
    window.iphoneSimState.memories = window.iphoneSimState.memories.filter(m => m.id !== id);
    selectedMemoryIds.delete(Number(id));
    const contactId = window.iphoneSimState.currentChatContactId;
    if (contactId) syncLegacyPerceptionAndState(contactId);
    saveConfig();
    renderMemoryList();
    // 刷新设置页中的token计数
    if (typeof window.refreshTokenCountForContact === 'function' && contactId) {
        console.log('[删除记忆] 触发token刷新，contactId:', contactId);
        window.refreshTokenCountForContact(contactId);
    }
};

window.retagMemory = function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;
    const current = normalizeMemoryTags(memory.memoryTags, 'long_term').join(', ');
    const input = prompt('输入标签（refined, short_term, long_term, state）\n逗号分隔：', current);
    if (input === null) return;
    const tags = normalizeMemoryTags(String(input).split(','), 'long_term');
    memory.memoryTags = tags;
    if (tags.includes('state')) {
        const owner = getMemoryStateOwner(memory, 'user');
        memory.stateOwner = owner;
        memory.stateMeta = memory.stateMeta || makeStateMeta(inferStateReasonType(memory.content), memory.time || Date.now(), null, owner);
        if (memory.stateMeta && typeof memory.stateMeta === 'object') {
            memory.stateMeta.owner = owner;
        }
        normalizeStateMetaForMemory(memory);
    } else {
        delete memory.stateMeta;
        delete memory.stateOwner;
    }
    delete memory.factMeta;
    if (!tags.includes('refined')) {
        delete memory.refinedMeta;
    }
    ensureMemoryImportance(memory, memory.memoryTags, 'long_term');
    syncLegacyPerceptionAndState(memory.contactId);
    saveConfig();
    renderMemoryList();
};

window.resolveStateMemory = function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;
    memory.memoryTags = normalizeMemoryTags(memory.memoryTags, 'state');
    if (!memory.memoryTags.includes('state')) memory.memoryTags.push('state');
    const owner = getMemoryStateOwner(memory, 'user');
    memory.stateOwner = owner;
    memory.stateMeta = memory.stateMeta || makeStateMeta(inferStateReasonType(memory.content), memory.time || Date.now(), null, owner);
    memory.stateMeta.owner = owner;
    memory.stateMeta.phase = 'resolved';
    memory.stateMeta.resolvedAt = Date.now();
    syncLegacyPerceptionAndState(memory.contactId);
    saveConfig();
    renderMemoryList();
};

window.extendStateMemory = function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;
    memory.memoryTags = normalizeMemoryTags(memory.memoryTags, 'state');
    if (!memory.memoryTags.includes('state')) memory.memoryTags.push('state');
    const owner = getMemoryStateOwner(memory, 'user');
    memory.stateOwner = owner;
    memory.stateMeta = memory.stateMeta || makeStateMeta(inferStateReasonType(memory.content), memory.time || Date.now(), null, owner);
    memory.stateMeta.owner = owner;
    memory.stateMeta.phase = 'active';
    memory.stateMeta.resolvedAt = null;
    memory.stateMeta.expiresAt = null;
    normalizeStateMetaForMemory(memory);
    syncLegacyPerceptionAndState(memory.contactId);
    saveConfig();
    renderMemoryList();
};

window.refineMemory = async function(id) {
    const memory = window.iphoneSimState.memories.find(m => m.id === id);
    if (!memory) return;
    await window.refineSelectedMemories(memory.contactId, [memory.id]);
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

        showNotification('正在生成详细总结...');
        await generateSummary(contact, messagesToSummarize, range, {
            autoExtract: true,
            summaryPromptMode: 'manual',
            source: 'auto_summary',
            suggestedTags: ['long_term'],
            reason: '聊天自动详细总结'
        });
    }
}

function persistChatSummaryResult(contact, summaryText, range, options = {}, structuredPayload = null) {
    const summary = String(summaryText || '').trim();
    if (!summary || summary === '无' || summary === '无。') {
        showNotification('未提取到重要信息', 2000);
        return false;
    }

    const autoExtract = options.autoExtract !== false;
    const summaryTitle = buildMemoryDisplayTitle({
        title: '',
        content: summary,
        structuredSummary: structuredPayload,
        memoryTags: Array.isArray(options.suggestedTags) ? options.suggestedTags : ['long_term']
    });

    if (autoExtract) {
        const candidate = createMemoryCandidate(contact.id, {
            title: summaryTitle,
            content: summary,
            suggestedTags: Array.isArray(options.suggestedTags) ? options.suggestedTags : ['long_term'],
            source: options.source || 'auto_summary',
            confidence: clampFloat(options.confidence, 0.78, 0, 1),
            range: range,
            reason: options.reason || '自动提取'
        });
        if (candidate && candidate.status === 'pending') {
            showNotification('已加入待确认记忆', 2000, 'success');
        } else if (candidate) {
            showNotification('已提取记忆', 2000, 'success');
        } else {
            const mode = ensureMemorySettingsV2().extractMode;
            if (mode === 'manual') {
                showNotification('手动模式：未自动写入记忆', 2200);
            } else {
                showNotification('已提取记忆', 2000, 'success');
            }
        }
    } else {
        createOrMergeApprovedMemory({
            contactId: contact.id,
            title: summaryTitle,
            content: summary,
            time: Date.now(),
            range: range,
            source: options.source || 'manual',
            memoryTags: Array.isArray(options.suggestedTags) ? options.suggestedTags : ['long_term'],
            confidence: clampFloat(options.confidence, 0.9, 0, 1)
        });
        showNotification('总结完成', 2000, 'success');
    }

    saveConfig();
    const memoryApp = document.getElementById('memory-app');
    if (memoryApp && !memoryApp.classList.contains('hidden')) {
        renderMemoryList();
    }
    return true;
}

function getChannelNaturalSummaryLengthRange(messageCount, channel = 'chat', mode = 'auto', rangeOverride = null) {
    if (rangeOverride && typeof rangeOverride === 'object') {
        const count = Number.isFinite(Number(rangeOverride.count))
            ? Math.max(1, Math.round(Number(rangeOverride.count)))
            : Math.max(1, Number.isFinite(Number(messageCount)) ? Math.round(Number(messageCount)) : 1);
        const target = Number.isFinite(Number(rangeOverride.target)) ? Math.max(80, Math.round(Number(rangeOverride.target))) : 220;
        const min = Number.isFinite(Number(rangeOverride.min)) ? Math.max(60, Math.round(Number(rangeOverride.min))) : Math.max(80, target - 60);
        const max = Number.isFinite(Number(rangeOverride.max)) ? Math.max(min + 12, Math.round(Number(rangeOverride.max))) : Math.max(min + 24, target + 80);
        const fallbackTokens = Math.max(512, Math.min(4000, Math.round(max * 2.2)));
        const maxTokens = Number.isFinite(Number(rangeOverride.maxTokens))
            ? Math.max(256, Math.min(4000, Math.round(Number(rangeOverride.maxTokens))))
            : fallbackTokens;
        return Object.assign({}, rangeOverride, {
            mode: mode === 'manual' ? 'manual' : 'auto',
            count,
            target,
            min,
            max,
            maxTokens
        });
    }

    if (channel === 'chat') {
        return getNaturalSummaryLengthRange(messageCount, mode);
    }

    if (channel === 'live_link') {
        const count = Math.max(1, Number.isFinite(Number(messageCount)) ? Math.round(Number(messageCount)) : 1);
        const target = Math.max(120, Math.min(220, Math.round(130 + count * 4)));
        const min = Math.max(100, Math.min(target - 8, 120));
        const max = Math.max(min + 20, Math.min(240, target + 34));
        return {
            mode: mode === 'manual' ? 'manual' : 'auto',
            count,
            target,
            min,
            max,
            maxTokens: 760
        };
    }

    const range = getSummaryLengthRangeByCount(messageCount, channel === 'meeting' ? 'meeting' : 'call');
    return Object.assign({}, range, {
        mode: mode === 'manual' ? 'manual' : 'auto',
        maxTokens: channel === 'call' ? 900 : 1100
    });
}

function getNaturalSummaryDetailHintByChannel(channel = 'chat', detailModeHint = '') {
    const userHint = String(detailModeHint || '').trim();
    const presetMap = {
        chat: '当前是微信聊天总结，每一个独立事项都要交代具体时间。优先写成YYYY年MM月DD日 HH:mm；如果原聊天无法精确到分钟，也至少写成YYYY年MM月DD日+上午/中午/下午/晚上，不能只写“今天/那天/后来”。',
        meeting: '当前是见面总结，重点写线下关键动作、情绪变化、承诺或分歧以及后续动作。',
        call: '当前是通话总结，重点写通话中的确认点、未决点与下一次确认时点。',
        live_link: '当前是直播连线总结，重点写模式、双方互动、观众反馈、结果与后续策略。'
    };
    const preset = String(presetMap[channel] || '').trim();
    if (preset && userHint) return `${preset} ${userHint}`;
    return preset || userHint;
}

async function generateChannelNaturalSummary(contact, textMessages, options = {}) {
    if (!contact || typeof contact !== 'object') {
        throw new Error('缺少联系人信息');
    }

    const sourceMessages = Array.isArray(textMessages) ? textMessages.filter(Boolean) : [];
    const normalizedMessages = sourceMessages
        .map(msg => ({
            role: msg && msg.role === 'user' ? 'user' : 'assistant',
            time: msg && msg.time ? msg.time : Date.now(),
            content: String(msg && msg.content ? msg.content : '').trim(),
            type: msg && msg.type ? msg.type : 'text'
        }))
        .filter(msg => msg.content && !msg.content.startsWith('['));
    if (normalizedMessages.length === 0) {
        return { summary: '', context: null, range: null, mode: resolveNaturalSummaryMode(options) };
    }

    let userName = String(options.userLabel || '').trim();
    if (!userName) {
        if (contact.userPersonaId && Array.isArray(window.iphoneSimState.userPersonas)) {
            const persona = window.iphoneSimState.userPersonas.find(item => item.id === contact.userPersonaId);
            if (persona && persona.name) userName = persona.name;
        }
        if (!userName && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name) {
            userName = window.iphoneSimState.userProfile.name;
        }
    }
    if (!userName) userName = '用户';

    const actorNames = resolveSummaryActorNames(contact, userName);
    const resolvedUserName = actorNames.userLabel;
    const contactLabel = actorNames.contactLabel;
    const mode = resolveNaturalSummaryMode(options);
    const channel = ['chat', 'meeting', 'call', 'live_link'].includes(String(options.channel || '').trim())
        ? String(options.channel || '').trim()
        : 'chat';
    const totalMessageCount = Number.isFinite(Number(options.totalMessageCount))
        ? Number(options.totalMessageCount)
        : normalizedMessages.length;
    const sourceMessageCount = Number.isFinite(Number(options.sourceMessageCount))
        ? Number(options.sourceMessageCount)
        : sourceMessages.length;
    const lengthRange = getChannelNaturalSummaryLengthRange(totalMessageCount, channel, mode, options.rangeOverride || null);
    const sourceTag = String(options.source || 'auto_summary').trim() || 'auto_summary';

    console.log('[summary-natural-start]', {
        mode,
        sourceCount: sourceMessageCount,
        textCount: normalizedMessages.length,
        target: lengthRange.target,
        min: lengthRange.min,
        max: lengthRange.max,
        source: sourceTag,
        channel
    });

    const settings = options.settings && options.settings.url && options.settings.key
        ? options.settings
        : (window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings);
    if (!settings.url || !settings.key) {
        throw new Error('未配置API');
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const runtimeContext = {
        channel,
        mode,
        rangeLabel: String(options.rangeLabel || '').trim(),
        totalMessageCount,
        sourceMessageCount,
        dateStr,
        timeStr,
        userLabel: resolvedUserName,
        contactLabel,
        persona: String(contact.persona || '傲娇、温柔').trim(),
        detailModeHint: getNaturalSummaryDetailHintByChannel(channel, options.detailModeHint),
        range: lengthRange
    };

    const chatContext = buildNaturalSummaryChatContext(normalizedMessages, resolvedUserName, contactLabel);
    if (!chatContext) {
        throw new Error('缺少可用聊天内容');
    }

    const isImportant = isImportantConversation(normalizedMessages, resolvedUserName, contactLabel);
    const systemPrompt = isImportant
        ? buildFirstPersonSummaryPrompt(runtimeContext, chatContext)
        : (mode === 'manual'
            ? buildManualNaturalSummaryPrompt(runtimeContext)
            : buildAutoNaturalSummaryPrompt(runtimeContext));
    const userContent = isImportant
        ? '请根据上述提示生成深度记忆。'
        : buildNaturalSummaryUserContent(chatContext, runtimeContext);
    const firstRaw = await requestNaturalSummaryText(settings, {
        stage: 'first_pass',
        mode,
        systemPrompt,
        userContent,
        temperature: 0.45,
        presencePenalty: 0.2,
        frequencyPenalty: 0.15,
        maxTokens: lengthRange.maxTokens
    });
    let summary = isImportant
        ? firstRaw.trim()
        : normalizeNaturalSummaryOutput(firstRaw, runtimeContext).trim();

    console.log('[summary-natural-first-pass]', {
        mode,
        outputChars: countSummaryChars(summary),
        target: lengthRange.target,
        min: lengthRange.min,
        max: lengthRange.max,
        channel
    });

    if (!summary) {
        throw new Error('总结结果为空');
    }

    console.log('[summary-natural-final]', {
        mode,
        outputChars: countSummaryChars(summary),
        finalStage: 'first_pass',
        channel
    });

    return {
        summary,
        mode,
        range: lengthRange,
        context: runtimeContext
    };
}

window.generateChannelNaturalSummary = generateChannelNaturalSummary;

async function generateSummary(contact, messages, range, options = {}) {
    const sourceMessages = Array.isArray(messages) ? messages : [];
    const textMessages = sourceMessages.filter(m => m && m.type === 'text' && !String(m.content || '').startsWith('['));
    if (textMessages.length === 0) {
        const summaryEl = document.getElementById('summary-notification');
        if (summaryEl) summaryEl.classList.add('hidden');
        return;
    }

    try {
        const result = await generateChannelNaturalSummary(contact, textMessages, {
            channel: 'chat',
            source: options.source || 'auto_summary',
            rangeLabel: String(range || ''),
            summaryPromptMode: options.summaryPromptMode,
            detailModeHint: options.detailModeHint,
            sourceMessageCount: sourceMessages.length,
            totalMessageCount: textMessages.length,
            rangeOverride: options.rangeOverride || null
        });
        const summary = String(result && result.summary || '').trim();
        if (!summary) throw new Error('总结结果为空');
        persistChatSummaryResult(contact, summary, range, options, null);
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

    const container = document.getElementById('agendaList');
    if (container) container.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;"><i class="fas fa-spinner fa-spin"></i> 正在生成行程...</div>';
    
    const refreshBtn = document.getElementById('refresh-location-btn');
    if (refreshBtn) refreshBtn.innerText = 'GENERATING...';

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
            if (container) container.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff3b30;">生成失败，请重试</div>';
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
        if (container) container.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff3b30;">生成失败，请检查网络或配置</div>';
    } finally {
        if (refreshBtn) refreshBtn.innerText = 'IN PROGRESS';
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
    const container = document.getElementById('agendaList');
    if (!container) return;

    // Recreate progress line
    container.innerHTML = '';
    const progressLine = document.createElement('div');
    progressLine.className = 'agenda-progress';
    progressLine.id = 'progressLine';
    container.appendChild(progressLine);

    if (!events || events.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.textAlign = 'center';
        emptyDiv.style.padding = '20px';
        emptyDiv.style.color = '#999';
        emptyDiv.textContent = '暂无行程';
        container.appendChild(emptyDiv);
        return;
    }

    // Re-sort chronologically for proper display
    events.sort((a, b) => {
        const timeA = a.time.split('-')[0];
        const timeB = b.time.split('-')[0];
        return timeA.localeCompare(timeB);
    });

    // Determine current time in minutes
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    // Parse time string "HH:MM" to minutes
    function toMinutes(timeStr) {
        const parts = (timeStr || '').trim().split(':');
        if (parts.length < 2) return -1;
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    // Find which event is currently active (current time falls within its range)
    let activeIndex = -1;
    events.forEach((event, index) => {
        const timeParts = event.time.split('-');
        const startMin = toMinutes(timeParts[0]);
        const endMin = toMinutes(timeParts[1]);
        if (startMin >= 0 && endMin >= 0 && nowMinutes >= startMin && nowMinutes <= endMin) {
            activeIndex = index;
        }
    });

    // If no active event found, use the last event whose start time has passed
    if (activeIndex === -1) {
        for (let i = events.length - 1; i >= 0; i--) {
            const startMin = toMinutes(events[i].time.split('-')[0]);
            if (startMin >= 0 && nowMinutes >= startMin) {
                activeIndex = i;
                break;
            }
        }
    }

    // Render items
    events.forEach((event, index) => {
        const item = document.createElement('div');
        const isActive = index === activeIndex;
        item.className = `agenda-item visible ${isActive ? 'active expanded' : ''}`;
        
        const startTime = event.time.split('-')[0].trim();
        
        let generatedTimeHtml = '';
        if (event.generatedAt) {
            const genDate = new Date(event.generatedAt);
            const genTimeStr = `${genDate.getHours()}:${genDate.getMinutes().toString().padStart(2, '0')}`;
            generatedTimeHtml = `<div style="font-size: 10px; color: #ccc; margin-top: 5px; text-align: right;">生成于 ${genTimeStr}</div>`;
        }

        item.innerHTML = `
            <div class="time-col">
                <span class="time-prefix">// time</span>
                ${startTime}
                <div class="node"></div>
            </div>
            <div class="content-col">
                <div class="title-wrapper">
                    <div class="item-title">${event.location}</div>
                    <i class="ph ph-map-pin item-icon"></i>
                </div>
                <div class="item-details">
                    <div class="ornament">◆ ◆ ◆</div>
                    <div class="detail-text">${event.description}</div>
                    <div class="detail-meta">
                        <span class="meta-tag"><i class="ph ph-clock"></i> ${event.time}</span>
                    </div>
                    ${generatedTimeHtml}
                </div>
            </div>
        `;
        
        // Add click listener for expand/collapse
        item.addEventListener('click', () => {
            const allItems = container.querySelectorAll('.agenda-item');
            allItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove('expanded');
                    other.classList.remove('active');
                }
            });
            item.classList.toggle('expanded');
            item.classList.toggle('active');
        });

        container.appendChild(item);
    });

    // Calculate and set progress line height after layout is complete
    setTimeout(() => {
        updateProgressLine(events, nowMinutes);
    }, 100);
}

function parseTimeToMinutes(timeStr) {
    const parts = (timeStr || '').trim().split(':');
    if (parts.length < 2) return -1;
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
}

function updateProgressLine(events, nowMinutes) {
    const container = document.getElementById('agendaList');
    const progressLine = document.getElementById('progressLine');
    if (!container || !progressLine || !events || events.length === 0) return;

    // Find the first and last event times
    const firstStart = parseTimeToMinutes(events[0].time.split('-')[0]);
    const lastEnd = parseTimeToMinutes(events[events.length - 1].time.split('-')[1] || events[events.length - 1].time.split('-')[0]);

    if (firstStart < 0 || lastEnd < 0 || lastEnd <= firstStart) {
        progressLine.style.height = '0px';
        return;
    }

    // Clamp nowMinutes between first start and last end
    const clampedNow = Math.max(firstStart, Math.min(lastEnd, nowMinutes));
    
    // Calculate the ratio through the timeline
    const ratio = (clampedNow - firstStart) / (lastEnd - firstStart);

    // Use pixel height based on the container's actual scroll height
    const totalHeight = container.scrollHeight;
    progressLine.style.height = `${Math.round(ratio * totalHeight)}px`;
}

function openLocationApp() {
    const locationApp = document.getElementById('location-app');
    locationApp.classList.remove('hidden');
    document.getElementById('chat-more-panel').classList.add('hidden');

    // Update date display in header
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];
    const shortMonth = shortMonths[now.getMonth()];
    const headerDateEl = document.getElementById('location-header-date');
    if (headerDateEl) headerDateEl.textContent = `${dayName}, ${day} ${month}`;
    const introDateEl = document.getElementById('location-intro-date');
    if (introDateEl) introDateEl.textContent = `\u2605 Daily Itinerary / ${shortMonth} ${day}`;

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
        item.style.setProperty('display', 'flex', 'important');
        item.style.setProperty('align-items', 'center', 'important');
        item.style.setProperty('padding-top', '12px', 'important');
        item.style.setProperty('padding-bottom', '12px', 'important');
        item.style.setProperty('min-height', '64px', 'important');
        item.style.setProperty('box-sizing', 'border-box', 'important');
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
        const textBlocks = item.querySelectorAll('.list-content.column > div');
        textBlocks.forEach(el => {
            el.style.setProperty('margin', '0', 'important');
            el.style.setProperty('line-height', '1.2', 'important');
        });
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
    const walletWithdrawBtn = document.getElementById('wallet-withdraw-btn');
    const walletWithdrawModal = document.getElementById('wallet-withdraw-modal');
    const closeWalletRechargeBtn = document.getElementById('close-recharge-modal');
    const closeWalletWithdrawBtn = document.getElementById('close-withdraw-modal');
    const doRechargeBtn = document.getElementById('do-recharge-btn');
    const doWithdrawBtn = document.getElementById('do-withdraw-btn');

    // Keep shared modals outside app containers so they can open from any page.
    const ensureGlobalModal = (modalEl) => {
        if (!modalEl) return null;
        if (modalEl.parentElement !== document.body) document.body.appendChild(modalEl);
        return modalEl;
    };
    ensureGlobalModal(walletRechargeModal);
    ensureGlobalModal(walletWithdrawModal);
    ensureGlobalModal(document.getElementById('bank-funding-source-modal'));

    if (closeWalletBtn) closeWalletBtn.addEventListener('click', () => document.getElementById('wallet-screen').classList.add('hidden'));
    if (walletRechargeBtn) walletRechargeBtn.addEventListener('click', () => {
        walletRechargeModal.classList.remove('hidden');
        const input = document.getElementById('recharge-amount');
        if (input) input.value = '';
    });
    if (closeWalletRechargeBtn) closeWalletRechargeBtn.addEventListener('click', () => walletRechargeModal.classList.add('hidden'));
    if (doRechargeBtn) doRechargeBtn.addEventListener('click', handleRecharge);
    if (walletWithdrawBtn) walletWithdrawBtn.addEventListener('click', () => {
        if (!walletWithdrawModal) return;
        walletWithdrawModal.classList.remove('hidden');
        const input = document.getElementById('withdraw-amount');
        if (input) input.value = '';
    });
    if (closeWalletWithdrawBtn) closeWalletWithdrawBtn.addEventListener('click', () => {
        if (walletWithdrawModal) walletWithdrawModal.classList.add('hidden');
    });
    if (doWithdrawBtn) doWithdrawBtn.addEventListener('click', handleWithdraw);

    const addMemoryBtn = document.getElementById('add-memory-btn');
    const manualSummaryBtn = document.getElementById('manual-summary-btn');
    const memorySettingsBtn = document.getElementById('memory-settings-btn');
    const memoryRefinePanelToggleBtn = document.getElementById('memory-refine-panel-toggle-btn');
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
    const memoryFilterTrigger = document.getElementById('memory-filter-trigger');
    const memoryFilterDropdown = document.getElementById('memory-filter-dropdown');
    const memoryFilterOptionBtns = document.querySelectorAll('#memory-filter-dropdown .memory-filter-option');
    const memorySelectAllBtn = document.getElementById('memory-select-all-btn');
    const memorySelectRecentBtn = document.getElementById('memory-select-recent-btn');
    const memorySelectRecentCountInput = document.getElementById('memory-select-recent-count');
    const memorySelectStartDateInput = document.getElementById('memory-select-start-date');
    const memorySelectEndDateInput = document.getElementById('memory-select-end-date');
    const memorySelectDateRangeBtn = document.getElementById('memory-select-date-range-btn');
    const memorySelectInvertBtn = document.getElementById('memory-select-invert-btn');
    const memorySelectClearBtn = document.getElementById('memory-select-clear-btn');
    const memoryRefineSelectedBtn = document.getElementById('memory-refine-selected-btn');
    const memoryRefineConfirmModal = document.getElementById('memory-refine-confirm-modal');
    const closeMemoryRefineConfirmBtn = document.getElementById('close-memory-refine-confirm');
    const cancelMemoryRefineConfirmBtn = document.getElementById('cancel-memory-refine-confirm');
    const confirmMemoryRefineBtn = document.getElementById('confirm-memory-refine-btn');
    const memoryRefineSelectedCountModal = document.getElementById('memory-refine-selected-count-modal');
    const manualStateTagInput = document.querySelector('#manual-memory-tags input[value="state"]');
    const editStateTagInput = document.querySelector('#edit-memory-tags input[value="state"]');
    const manualStateOptions = document.getElementById('manual-memory-state-options');
    const editStateOptions = document.getElementById('edit-memory-state-options');

    if (closeMemoryBtn) closeMemoryBtn.addEventListener('click', () => {
        document.getElementById('memory-app').classList.add('hidden');
        resetMemorySelection();
        closeMemoryFilterDropdown();
        setMemoryRefinePanelVisible(false);
        if (memoryRefineConfirmModal) memoryRefineConfirmModal.classList.add('hidden');
    });
    if (closeEditMemoryBtn) closeEditMemoryBtn.addEventListener('click', () => {
        editMemoryModal.classList.add('hidden');
        currentEditingMemoryId = null;
    });
    if (saveEditedMemoryBtn) saveEditedMemoryBtn.addEventListener('click', handleSaveEditedMemory);

    if (manualStateTagInput && manualStateOptions) {
        manualStateTagInput.addEventListener('change', () => {
            manualStateOptions.style.display = manualStateTagInput.checked ? '' : 'none';
        });
    }
    if (editStateTagInput && editStateOptions) {
        editStateTagInput.addEventListener('change', () => {
            editStateOptions.style.display = editStateTagInput.checked ? '' : 'none';
        });
    }

    if (memoryFilterTrigger && memoryFilterDropdown) {
        const toggleDropdown = (event) => {
            if (event) event.stopPropagation();
            const nextOpen = !memoryFilterDropdown.classList.contains('is-open');
            memoryFilterDropdown.classList.toggle('is-open', nextOpen);
            memoryFilterTrigger.classList.toggle('is-open', nextOpen);
            updateMemoryFilterDropdownUI();
        };
        memoryFilterTrigger.addEventListener('click', toggleDropdown);
        memoryFilterTrigger.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            toggleDropdown(event);
        });
    }
    if (memoryFilterOptionBtns && memoryFilterOptionBtns.length > 0) {
        memoryFilterOptionBtns.forEach(btn => {
            btn.addEventListener('click', (event) => {
                event.stopPropagation();
                applyMemoryFilter(btn.dataset.filter || 'all');
            });
        });
    }
    document.addEventListener('click', (event) => {
        if (!memoryFilterDropdown || !memoryFilterTrigger) return;
        if (memoryFilterDropdown.contains(event.target) || memoryFilterTrigger.contains(event.target)) return;
        closeMemoryFilterDropdown();
    });

    if (memoryRefinePanelToggleBtn) {
        memoryRefinePanelToggleBtn.addEventListener('click', () => {
            window.toggleMemoryRefinePanel();
        });
    }
    if (memorySelectAllBtn) {
        memorySelectAllBtn.addEventListener('click', () => {
            window.selectAllMemoriesForRefine();
        });
    }
    if (memorySelectRecentBtn) {
        memorySelectRecentBtn.addEventListener('click', () => {
            const count = memorySelectRecentCountInput ? Number(memorySelectRecentCountInput.value) : 10;
            window.selectRecentMemoriesForRefine(count);
        });
    }
    if (memorySelectRecentCountInput) {
        memorySelectRecentCountInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const count = Number(memorySelectRecentCountInput.value);
            window.selectRecentMemoriesForRefine(count);
        });
    }
    if (memorySelectDateRangeBtn) {
        memorySelectDateRangeBtn.addEventListener('click', () => {
            const startDate = memorySelectStartDateInput ? memorySelectStartDateInput.value : '';
            const endDate = memorySelectEndDateInput ? memorySelectEndDateInput.value : '';
            window.selectMemoriesByDateRangeForRefine(startDate, endDate);
        });
    }
    if (memorySelectStartDateInput) {
        memorySelectStartDateInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const startDate = memorySelectStartDateInput.value;
            const endDate = memorySelectEndDateInput ? memorySelectEndDateInput.value : '';
            window.selectMemoriesByDateRangeForRefine(startDate, endDate);
        });
    }
    if (memorySelectEndDateInput) {
        memorySelectEndDateInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault();
            const startDate = memorySelectStartDateInput ? memorySelectStartDateInput.value : '';
            const endDate = memorySelectEndDateInput.value;
            window.selectMemoriesByDateRangeForRefine(startDate, endDate);
        });
    }
    if (memorySelectInvertBtn) {
        memorySelectInvertBtn.addEventListener('click', () => {
            window.invertMemorySelectionForRefine();
        });
    }
    if (memorySelectClearBtn) {
        memorySelectClearBtn.addEventListener('click', () => {
            window.clearMemorySelectionForRefine();
        });
    }

    if (memoryRefineSelectedBtn) {
        memoryRefineSelectedBtn.addEventListener('click', () => {
            if (!memorySelectMode || selectedMemoryIds.size === 0) {
                showNotification('请先选择要精炼的记忆', 1600);
                return;
            }
            if (memoryRefineSelectedCountModal) {
                memoryRefineSelectedCountModal.textContent = String(selectedMemoryIds.size);
            }
            if (memoryRefineConfirmModal) {
                memoryRefineConfirmModal.classList.remove('hidden');
            }
        });
    }

    if (closeMemoryRefineConfirmBtn) {
        closeMemoryRefineConfirmBtn.addEventListener('click', () => {
            if (memoryRefineConfirmModal) memoryRefineConfirmModal.classList.add('hidden');
        });
    }
    if (cancelMemoryRefineConfirmBtn) {
        cancelMemoryRefineConfirmBtn.addEventListener('click', () => {
            if (memoryRefineConfirmModal) memoryRefineConfirmModal.classList.add('hidden');
        });
    }
    if (confirmMemoryRefineBtn) {
        confirmMemoryRefineBtn.addEventListener('click', async () => {
            const contactId = window.iphoneSimState.currentChatContactId;
            if (!contactId) return;
            const selectedIds = Array.from(selectedMemoryIds);
            if (memoryRefineConfirmModal) memoryRefineConfirmModal.classList.add('hidden');
            await window.refineSelectedMemories(contactId, selectedIds);
        });
    }
    if (memoryRefineConfirmModal) {
        memoryRefineConfirmModal.addEventListener('click', (event) => {
            if (event.target === memoryRefineConfirmModal) {
                memoryRefineConfirmModal.classList.add('hidden');
            }
        });
    }

    if (addMemoryBtn) addMemoryBtn.addEventListener('click', () => {
        document.getElementById('manual-memory-content').value = '';
        document.querySelectorAll('#manual-memory-tags input[type="checkbox"]').forEach(input => {
            input.checked = input.value === 'long_term';
        });
        const manualImportanceInput = document.getElementById('manual-memory-importance');
        if (manualImportanceInput) manualImportanceInput.value = String(MEMORY_DEFAULT_IMPORTANCE_BY_TAG.long_term);
        if (manualStateOptions) manualStateOptions.style.display = 'none';
        const manualStateReason = document.getElementById('manual-memory-state-reason');
        if (manualStateReason) manualStateReason.value = 'other';
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
    
    // Bind new UI elements to location app functions
    const closeLocationBtnNew = document.getElementById('close-location-btn-new');
    const itinerarySettingsBtnNew = document.getElementById('itinerary-settings-btn-new');
    const refreshLocationBtnNew = document.getElementById('refresh-location-btn-new');
    
    if (closeLocationBtnNew) closeLocationBtnNew.addEventListener('click', () => document.getElementById('location-app').classList.add('hidden'));
    if (itinerarySettingsBtnNew) itinerarySettingsBtnNew.addEventListener('click', openItinerarySettings);
    if (refreshLocationBtnNew) refreshLocationBtnNew.addEventListener('click', () => generateDailyItinerary(true));

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
    
    if (closePersonalMomentsBtn) {
        closePersonalMomentsBtn.addEventListener('click', () => {
            personalMomentsScreen.classList.add('hidden');
            if (window.iphoneSimState.personalMomentsSource === 'ai-profile') {
                document.getElementById('ai-profile-screen')?.classList.remove('hidden');
            }
            window.iphoneSimState.personalMomentsSource = null;
        });
    }
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
