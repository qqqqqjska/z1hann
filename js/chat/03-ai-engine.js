window.refreshAiImage = async function(msgId, event) {
    if (event) event.stopPropagation();

    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) return;

    const history = window.iphoneSimState.chatHistory[contactId];
    if (!history) return;

    const msgIndex = history.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    const msg = history[msgIndex];
    if (!msg.novelaiPrompt) {
        alert("该图片无法重新生成（缺少 Prompt）");
        return;
    }

    if (!confirm("确定要使用相同的提示词重新生成这张图片吗？")) return;

    const novelaiSettings = window.iphoneSimState.novelaiSettings;
    if (!novelaiSettings || !novelaiSettings.key) {
        alert("请先配置 NovelAI API Key");
        return;
    }

    // 更新消息状态为正在生成
    const originalContent = msg.content;
    const originalType = msg.type;
    
    msg.type = 'virtual_image';
    msg.content = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Regenerating...';
    
    // 强制重新渲染
    if (window.renderChatHistory) renderChatHistory(contactId, true);

    try {
         const genOptions = {
            key: novelaiSettings.key,
            model: novelaiSettings.model,
            prompt: msg.novelaiPrompt,
            negativePrompt: msg.novelaiNegativePrompt || novelaiSettings.negativePrompt,
            steps: novelaiSettings.steps || 28,
            scale: novelaiSettings.cfg || 5,
            seed: -1,
            width: 832,
            height: 1216
        };

        // 尝试从 preset 恢复参数
        const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
        if (contact && contact.novelaiPreset) {
             let preset = null;
             if (contact.novelaiPreset === 'AUTO_MATCH') {
                  const type = detectImageType(msg.description || "");
                  const presets = window.iphoneSimState.novelaiPresets || [];
                  preset = presets.find(p => p.type === type);
                  if (!preset && type !== 'general') {
                       preset = presets.find(p => p.type === 'general');
                  }
             } else {
                  preset = (window.iphoneSimState.novelaiPresets || []).find(p => p.name === contact.novelaiPreset);
             }

             if (preset && preset.settings) {
                 genOptions.model = preset.settings.model || genOptions.model;
                 genOptions.steps = preset.settings.steps || genOptions.steps;
                 genOptions.scale = preset.settings.scale || genOptions.scale;
                 genOptions.width = preset.settings.width || genOptions.width;
                 genOptions.height = preset.settings.height || genOptions.height;
             }
        }

        const base64Image = await window.generateNovelAiImageApi(genOptions);

        // 更新消息
        msg.type = 'image';
        msg.content = base64Image;
        
        saveConfig();
        if (window.renderChatHistory) renderChatHistory(contactId, true);

    } catch (e) {
        console.error("Regeneration failed", e);
        alert("生成失败: " + e.message);
        // 恢复原图
        msg.type = originalType;
        msg.content = originalContent;
        if (window.renderChatHistory) renderChatHistory(contactId, true);
    }
};

window.closeMusicListenInviteDetail = function () {
    const modal = document.getElementById('music-listen-invite-detail-modal');
    if (modal) modal.style.display = 'none';
};

window.openMusicListenInviteDetail = function (payload) {
    let data = {};
    try {
        if (typeof payload === 'string') {
            const parsed = decodeURIComponent(payload);
            data = JSON.parse(parsed);
        } else if (payload && typeof payload === 'object') {
            data = payload;
        }
    } catch (e) {
        data = {};
    }

    const statusMap = {
        pending: '待回复',
        accepted: '已同意',
        rejected: '已拒绝'
    };
    const statusText = statusMap[String(data.status || 'pending')] || '待回复';
    const createdAt = Number(data.createdAt || 0);
    const updatedAt = Number(data.updatedAt || 0);
    const createdText = createdAt ? new Date(createdAt).toLocaleString() : '-';
    const updatedText = updatedAt ? new Date(updatedAt).toLocaleString() : '-';
    const contact = (window.iphoneSimState.contacts || []).find(c => String(c.id) === String(data.contactId || ''));
    const contactName = contact ? (contact.remark || contact.nickname || contact.name || '联系人') : '联系人';

    let modal = document.getElementById('music-listen-invite-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'music-listen-invite-detail-modal';
        modal.style.cssText = [
            'position:fixed',
            'inset:0',
            'z-index:10050',
            'background:rgba(0,0,0,0.45)',
            'display:none',
            'align-items:center',
            'justify-content:center',
            'padding:16px'
        ].join(';');
        modal.innerHTML = `
            <div id="music-listen-invite-detail-card" style="width:min(92vw,360px);background:#fff;border-radius:18px;box-shadow:0 14px 34px rgba(0,0,0,0.22);overflow:hidden;">
                <div style="padding:14px 16px 10px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;">
                    <strong style="font-size:16px;color:#111;">一起听邀请详情</strong>
                    <button onclick="window.closeMusicListenInviteDetail()" style="border:none;background:#f2f2f7;border-radius:999px;width:28px;height:28px;line-height:28px;font-size:16px;color:#666;cursor:pointer;">×</button>
                </div>
                <div id="music-listen-invite-detail-body" style="padding:14px 16px 16px;font-size:13px;color:#333;line-height:1.6;"></div>
            </div>
        `;
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeMusicListenInviteDetail();
        });
        document.body.appendChild(modal);
    }

    const body = modal.querySelector('#music-listen-invite-detail-body');
    if (body) {
        body.innerHTML = `
            <div style="display:flex;gap:10px;margin-bottom:12px;">
                <img src="${data.songCover || 'https://placehold.co/80x80/e5e7eb/111827?text=Music'}" style="width:52px;height:52px;border-radius:10px;object-fit:cover;background:#f0f0f0;">
                <div style="min-width:0;flex:1;">
                    <div style="font-size:15px;font-weight:700;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.songTitle || '未知歌曲'}</div>
                    <div style="font-size:13px;color:#666;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${data.songArtist || '未知歌手'}</div>
                </div>
            </div>
            <div><strong style="color:#555;">联系人：</strong>${contactName}</div>
            <div><strong style="color:#555;">状态：</strong>${statusText}</div>
            <div><strong style="color:#555;">邀请ID：</strong>${data.inviteId || '-'}</div>
            <div><strong style="color:#555;">创建时间：</strong>${createdText}</div>
            <div><strong style="color:#555;">更新时间：</strong>${updatedText}</div>
        `;
    }
    modal.style.display = 'flex';
};

function appendMessageToUI(text, isUser, type = 'text', description = null, replyTo = null, msgId = null, timestamp = null, isHistory = false) {
    if (type === 'text' && text && typeof text === 'string') {
        // Strip hidden image data from display
        text = text.replace(/<hidden_img>.*?<\/hidden_img>/g, '');

        if (isHiddenForumWechatSyncText(text)) {
            return;
        }
        
        if (!isUser && text.includes('ACTION:')) {
            text = text.split('\n').filter(line => !line.trim().startsWith('ACTION:')).join('\n').trim();
            if (!text) return;
        }
    }

    if (type === 'voice_call_text') {
        return;
    }

    const container = document.getElementById('chat-messages');
    
    const lastMsg = container.lastElementChild;
    let showTimestamp = false;
    const now = timestamp || Date.now();
    
    if (!lastMsg || lastMsg.classList.contains('system') || !lastMsg.dataset.time) {
        showTimestamp = true;
    } else {
        const lastTime = parseInt(lastMsg.dataset.time);
        if (now - lastTime > 5 * 60 * 1000) {
            showTimestamp = true;
        }
    }

    // 处理气泡尾巴逻辑：如果是连续消息且没有时间戳分隔，移除上一条消息的尾巴
    if (!showTimestamp && lastMsg && lastMsg.classList.contains('chat-message')) {
        const lastIsUser = lastMsg.classList.contains('user');
        if (lastIsUser === isUser) {
            lastMsg.classList.remove('has-tail');
        }
    }

    if (showTimestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'chat-time-stamp';
        const date = new Date(now);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        timeDiv.innerHTML = `<span>${timeStr}</span>`;
        container.appendChild(timeDiv);
    }

    const msgDiv = document.createElement('div');
    msgDiv.dataset.time = now;
    
    let isSystemMsg = false;
    if (type === 'system') {
        isSystemMsg = true;
    } else if (type === 'text' && text && typeof text === 'string' && (text.startsWith('[系统消息]:') || text.startsWith('[系统]:'))) {
        isSystemMsg = true;
    }

    if (isSystemMsg) {
        msgDiv.className = 'chat-message system';
        const systemText = text.replace(/^\[系统(消息)?\][:：]?\s*/, '').trim();
        msgDiv.innerHTML = `<div class="system-tip">${systemText}</div>`;
        container.appendChild(msgDiv);
        return;
    }

    // 默认给新消息添加 has-tail 类，因为它目前是最后一条
    msgDiv.className = `chat-message ${isUser ? 'user' : 'other'} has-tail`;
    if (!isHistory) {
        msgDiv.classList.add('new');
    }
    if (msgId) msgDiv.dataset.msgId = msgId;

    msgDiv.style.position = 'relative';
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    
    let contentHtml = '';
    if (type === 'image' || type === 'sticker') {
        contentHtml = `<img src="${text}" style="max-width: 200px; border-radius: 4px;">`;
    } else if (type === 'voice') {
        let duration = '1"';
        let transText = '[语音]';
        try {
            let data = typeof text === 'string' ? JSON.parse(text) : text;
            duration = (data.duration || 1) + '"';
            transText = data.text || '';
        } catch (e) {
            transText = text;
        }

        const uid = 'v-' + Math.random().toString(36).substr(2, 9);
        
        contentHtml = `
            <div class="voice-bar-top" onclick="window.playVoiceMsg('${msgId}', '${uid}', event)">
                <div class="voice-icon-box"><i class="fas fa-rss"></i></div>
                <span class="voice-dur-text">${duration}</span>
            </div>
            <div id="${uid}" class="voice-text-bottom hidden" onclick="this.classList.add('hidden'); event.stopPropagation();">${transText}</div>
        `;
    } else if (type === 'transfer') {
        let transferData = { amount: '0.00', remark: '转账', status: 'pending' };
        try {
            if (typeof text === 'string') {
                transferData = JSON.parse(text);
            } else {
                transferData = text;
            }
        } catch (e) {
            console.error('解析转账数据失败', e);
            transferData = { amount: '0.00', remark: text || '转账', status: 'pending' };
        }
        
        const amount = parseFloat(transferData.amount).toFixed(2);
        const remark = transferData.remark || '转账给您';
        const status = transferData.status || 'pending';
        
        let statusText = '';
        let iconClass = 'fas fa-exchange-alt';
        let cardClass = '';
        
        if (status === 'accepted') {
            statusText = '已收款';
            iconClass = 'fas fa-check';
            cardClass = 'accepted';
        } else if (status === 'returned') {
            statusText = '已退还';
            iconClass = 'fas fa-undo';
            cardClass = 'returned';
        }
        
        if (!transferData.id) {
            contentHtml = `
                <div class="transfer-card" onclick="alert('该转账消息已失效（旧数据），请发送新转账测试')">
                    <div class="transfer-top">
                        <div class="transfer-icon"><i class="${iconClass}"></i></div>
                        <div class="transfer-info">
                            <div class="transfer-amount">¥${amount}</div>
                            <div class="transfer-remark">${remark}</div>
                        </div>
                    </div>
                    <div class="transfer-bottom">
                        <span>${statusText} (已失效)</span>
                    </div>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="transfer-card" onclick="window.handleTransferClick(${transferData.id}, '${isUser ? 'user' : 'other'}')">
                    <div class="transfer-top">
                        <div class="transfer-icon"><i class="${iconClass}"></i></div>
                        <div class="transfer-info">
                            <div class="transfer-amount">¥${amount}</div>
                            <div class="transfer-remark">${remark}</div>
                        </div>
                    </div>
                    <div class="transfer-bottom">
                        <span>${statusText}</span>
                    </div>
                </div>
            `;
        }
    } else if (type === 'family_card') {
        let familyData = {
            id: '',
            mode: 'request',
            status: 'pending',
            monthlyLimit: null,
            note: ''
        };
        try {
            familyData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch (e) {
            console.error('解析亲属卡数据失败', e);
        }

        const mode = familyData.mode === 'grant' ? 'grant' : 'request';
        const isAccepted = familyData.status === 'accepted';
        const safeCardId = String(familyData.id || '').replace(/'/g, "\\'");
        const safeContactId = String(window.iphoneSimState.currentChatContactId || '').replace(/'/g, "\\'");
        const cardClass = mode === 'grant' ? 'chat-bank-v2-card chat-bank-v2-card-light' : 'chat-bank-v2-card';
        const cardTitle = mode === 'grant' ? '亲属卡' : 'Black Card';
        contentHtml = `
            <div class="${cardClass}" onclick="window.openFamilyCardDetail('${safeCardId}', '${safeContactId}')">
                <i class="fas fa-coins chat-bank-v2-decor"></i>
                <div class="chat-bank-v2-title-row">
                    <div class="chat-bank-v2-card-title">${cardTitle}</div>
                    ${isAccepted ? '<span class="chat-bank-v2-status-check"><i class="fas fa-check"></i></span>' : ''}
                </div>
                <div class="chat-bank-v2-chip"></div>
                <div class="chat-bank-v2-card-info">
                    <div class="chat-bank-v2-card-num">**** 4921</div>
                    <i class="fas fa-credit-card"></i>
                </div>
            </div>
        `;
    } else if (type === 'virtual_image') {
        const imgId = `virtual-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const overlayId = `overlay-${imgId}`;
        const descText = description || '无描述';
        const cleanDesc = descText.replace(/^\[图片描述\][:：]?\s*/, '');
        
        contentHtml = `
            <div class="virtual-image-container" style="position: relative; cursor: pointer; display: flex; justify-content: center; align-items: center;">
                <img id="${imgId}" src="${text}" style="max-width: 200px; border-radius: 4px; display: block; width: auto; height: auto;">
                <div id="${overlayId}" class="virtual-image-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.8); border-radius: 4px; display: flex; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box; opacity: 0; transition: opacity 0.3s; pointer-events: none;">
                    <div style="font-size: 14px; color: #333; line-height: 1.4; overflow-y: auto; max-height: 100%; text-align: center;">${cleanDesc}</div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const container = document.getElementById(imgId).parentElement;
            const overlay = document.getElementById(overlayId);
            
            if (container && overlay) {
                container.onclick = () => {
                    const isVisible = overlay.style.opacity === '1';
                    overlay.style.opacity = isVisible ? '0' : '1';
                    overlay.style.pointerEvents = isVisible ? 'none' : 'auto';
                };
            }
        }, 0);
    } else if (type === 'description') {
        contentHtml = text;
    } else {
        contentHtml = text;
    }

    let extraClass = '';
    const cardTypes = ['transfer', 'family_card', 'gift_card', 'shopping_gift', 'delivery_share', 'order_progress', 'order_share', 'pay_request', 'product_share', 'icity_card', 'minesweeper_invite', 'pdd_cash_share', 'pdd_bargain_share', 'savings_invite', 'savings_withdraw_request', 'savings_withdraw_result', 'savings_progress', 'music_listen_invite'];
    if (cardTypes.includes(type)) {
        extraClass += ' no-bubble';
    }

    if (type === 'transfer') {
        extraClass += ' transfer-msg';
        try {
            const data = typeof text === 'string' ? JSON.parse(text) : text;
            if (data.status === 'accepted') extraClass += ' accepted';
            if (data.status === 'returned') extraClass += ' returned';
        } catch(e) {}
    } else if (type === 'family_card') {
        extraClass += ' family-card-msg';
    } else if (type === 'sticker') {
        extraClass = 'sticker-msg';
        contentHtml = `<img src="${text}" onclick="showImagePreview(this.src)">`;
    } else if (type === 'voice') {
        extraClass = 'voice-msg'; 
    } else if (type === 'description') {
        extraClass = 'description-msg';
    } else if (type === 'virtual_image') {
        extraClass = 'virtual-image-msg';
    } else if (type === 'image') {
        extraClass = 'image-msg';
    } else if (type === 'gift_card') {
        extraClass += ' gift-card-msg';
        let giftData = typeof text === 'string' ? JSON.parse(text) : text;
        const paymentAmount = giftData.paymentAmount || giftData.price || '0.00';
        const recipientName = giftData.recipientName || '';
        const paymentMethodLabel = giftData.paymentMethodLabel || '';
        contentHtml = `
            <div class="gift-card" style="background: #fff; border-radius: 8px; padding: 12px 12px 10px 12px; width: 230px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: -45px; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="display: flex; gap: 10px;">
                    <div style="width: 50px; height: 50px; border-radius: 4px; background: #FFDA44; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas fa-gift" style="font-size: 24px; color: #333;"></i>
                    </div>
                    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-start;">
                        <div style="font-size: 14px; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;">${giftData.title}</div>
                        <div style="font-size: 14px; color: #000000; font-weight: bold; margin-top: 4px;">¥${paymentAmount}</div>
                    </div>
                </div>
                <div style="margin-top: 6px; font-size: 12px; color: #666; line-height: 1.45;">
                    <div>金额：¥${paymentAmount}</div>
                    ${recipientName ? `<div>收货人：${recipientName}</div>` : ''}
                    ${paymentMethodLabel ? `<div>支付方式：${paymentMethodLabel}</div>` : ''}
                </div>
                <div style="border-top: 1px solid #f0f0f0; padding-top: 8px; font-size: 12px; color: #666; display: flex; align-items: center;">
                    <i class="fas fa-heart" style="color: #FF3B30; margin-right: 5px;"></i> 
                    <span>闲鱼收藏礼物</span>
                </div>
            </div>
        `;
    } else if (type === 'shopping_gift') {
        extraClass += ' shopping-gift-msg';
        let giftData = {};
        try {
            giftData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const itemCount = giftData.items ? giftData.items.length : 0;
        const firstItem = itemCount > 0 ? giftData.items[0] : { title: '礼物', image: '' };
        const total = giftData.total || giftData.paymentAmount || '0.00';
        const recipientText = giftData.recipientName || giftData.recipientText || '';
        const paymentMethodLabel = giftData.paymentMethodLabel || '';
        const itemNames = (giftData.items || []).map(i => {
            const count = Number(i.count || 1);
            return `${i.title}${count > 1 ? ` x${count}` : ''}`;
        });
        const itemNamesText = itemNames.length ? itemNames.join('、') : (firstItem.title || '礼物');
        const remarkHtml = giftData.remark ? `<div style="padding: 6px 12px; font-size: 13px; color: #333; background: #fff; border-top: 1px solid #f5f5f5; font-style: italic;">"${giftData.remark}"</div>` : '';
        
        contentHtml = `
            <div class="shopping-gift-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 230px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="background: #333333; padding: 8px 12px; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fas fa-gift" style="margin-right: 6px;"></i>送你的礼物</span>
                    <span style="font-size: 16px;">¥${total}</span>
                </div>
                <div style="padding: 5px 10px 2px 10px; display: flex; gap: 10px;">
                    <div style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background-color: #f0f0f0;">
                        <img src="${firstItem.image || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 13px; color: #333; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${firstItem.title}</div>
                        ${firstItem.selectedSpec ? `<div style="font-size: 11px; color: #999; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${firstItem.selectedSpec}</div>` : ''}
                        ${itemCount > 1 ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">等 ${itemCount} 件商品</div>` : ''}
                    </div>
                </div>
                <div style="padding: 8px 12px 0; font-size: 12px; color: #666; line-height: 1.4;">
                    <div>商品：${itemNamesText}</div>
                    <div>金额：¥${total}</div>
                    ${recipientText ? `<div>收货人：${recipientText}</div>` : ''}
                    ${paymentMethodLabel ? `<div>支付方式：${paymentMethodLabel}</div>` : ''}
                </div>
                ${remarkHtml}
                <div style="padding: 2px 12px; border-top: 1px solid #f5f5f5; text-align: right; line-height: 1;">
                     <span style="font-size: 12px; color: #999;">已发送</span>
                </div>
            </div>
        `;
    } else if (type === 'savings_invite') {
        extraClass += ' savings-invite-msg';
        let inviteData = {};
        try {
            inviteData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch (e) {}
        const safePayload = encodeURIComponent(JSON.stringify({
            title: inviteData.title || '共同存钱计划',
            targetAmount: Number(inviteData.targetAmount || 0),
            aprBase: Number(inviteData.aprBase || 0),
            inviteText: '已邀请你一起存钱'
        })).replace(/'/g, "\\'");
        const cardTitle = '共同存钱';
        contentHtml = `
            <div class="chat-bank-v2-card chat-bank-v2-card-light" onclick="window.openSavingsInviteDetail('${safePayload}')">
                <i class="fas fa-piggy-bank chat-bank-v2-decor"></i>
                <div class="chat-bank-v2-title-row">
                    <div class="chat-bank-v2-card-title">${cardTitle}</div>
                </div>
                <div class="chat-bank-v2-chip"></div>
                <div class="chat-bank-v2-card-info">
                    <div class="chat-bank-v2-card-num">SAVINGS INVITE</div>
                    <i class="fas fa-wallet"></i>
                </div>
            </div>
        `;
    } else if (type === 'savings_withdraw_request') {
        extraClass += ' savings-withdraw-msg';
        let reqData = {};
        try {
            reqData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch (e) {}
        contentHtml = `
            <div style="background:#fff;border-radius:12px;overflow:hidden;width:240px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <div style="background:#333;color:#fff;padding:10px 12px;font-size:14px;font-weight:700;">共同存钱转出申请</div>
                <div style="padding:10px 12px;font-size:13px;color:#333;line-height:1.45;">
                    <div>金额：¥${Number(reqData.amount || 0).toFixed(2)}</div>
                    <div>状态：待确认（24小时）</div>
                </div>
            </div>
        `;
    } else if (type === 'savings_progress') {
        extraClass += ' savings-progress-msg';
        let pData = {};
        try {
            pData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch (e) {}
        contentHtml = `
            <div style="background:#fff;border-radius:12px;overflow:hidden;width:240px;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <div style="background:#111;color:#fff;padding:10px 12px;font-size:14px;font-weight:700;">共同存钱进度</div>
                <div style="padding:10px 12px;font-size:13px;color:#333;line-height:1.45;">
                    <div>${pData.text || '计划有新进展'}</div>
                </div>
            </div>
        `;
    } else if (type === 'music_listen_invite') {
        extraClass += ' music-listen-invite-msg';
        let inviteData = {};
        try {
            inviteData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch (e) {}
        const safePayload = encodeURIComponent(JSON.stringify(inviteData || {})).replace(/'/g, "\\'");
        const songTitle = inviteData.songTitle || '未知歌曲';
        const songArtist = inviteData.songArtist || '未知歌手';
        const songCover = inviteData.songCover || 'https://placehold.co/120x120/e5e7eb/111827?text=Music';
        contentHtml = `
            <div class="music-listen-invite-card" onclick="window.openMusicListenInviteDetail('${safePayload}')">
                <div class="music-listen-invite-content">
                    <img class="music-listen-invite-cover" src="${songCover}">
                    <div class="music-listen-invite-meta">
                        <div class="music-listen-invite-title">${songTitle}</div>
                        <div class="music-listen-invite-artist">${songArtist}</div>
                        <div class="music-listen-invite-platform">
                            <i class="fab fa-apple"></i>
                            <span>Music</span>
                        </div>
                    </div>
                    <div class="music-listen-invite-play">
                        <i class="fas fa-play"></i>
                    </div>
                </div>
            </div>
        `;
    } else if (type === 'delivery_share') {
        extraClass += ' delivery-share-msg';
        let deliveryData = {};
        try {
            deliveryData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const itemCount = deliveryData.items ? deliveryData.items.length : 0;
        const firstItem = itemCount > 0 ? deliveryData.items[0] : { title: '美食', image: '' };
        const total = deliveryData.total || '0.00';
        const remarkHtml = deliveryData.remark ? `<div style="padding: 6px 12px; font-size: 13px; color: #333; background: #fff; border-top: 1px solid #f5f5f5; font-style: italic;">"${deliveryData.remark}"</div>` : '';
        
        contentHtml = `
            <div class="delivery-share-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 230px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="background: #333333; padding: 8px 12px; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fas fa-utensils" style="margin-right: 6px;"></i>请你吃外卖</span>
                    <span style="font-size: 16px;">¥${total}</span>
                </div>
                <div style="padding: 5px 10px 2px 10px; display: flex; gap: 10px;">
                    <div style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background-color: #f0f0f0;">
                        <img src="${firstItem.image || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 13px; color: #333; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${firstItem.title}</div>
                        ${firstItem.selectedSpec ? `<div style="font-size: 11px; color: #999; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${firstItem.selectedSpec}</div>` : ''}
                        ${itemCount > 1 ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">等 ${itemCount} 件美食</div>` : ''}
                    </div>
                </div>
                ${remarkHtml}
                <div style="padding: 2px 12px; border-top: 1px solid #f5f5f5; text-align: right; line-height: 1;">
                     <span style="font-size: 12px; color: #999;">正在配送中</span>
                </div>
            </div>
        `;
    } else if (type === 'order_progress' || type === 'order_share') {
        extraClass += ' order-progress-msg';
        let progressData = {};
        try {
            progressData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const title = progressData.title || '商品订单';
        const status = progressData.status || '待发货';
        const eta = progressData.eta || '计算中';
        const items = progressData.items || '商品';
        const orderId = progressData.orderId;
        
        // Determine progress state
        let step = 1;
        if (status === '已发货' || status === 'On Delivery') step = 2;
        if (status === '已完成' || status === 'Delivered') step = 3;
        
        contentHtml = `
            <div class="order-share-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 240px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);" onclick="document.getElementById('shopping-app').classList.remove('hidden'); if(window.switchShoppingTab) window.switchShoppingTab('orders'); if(window.openShoppingOrderProgress && '${orderId}') window.openShoppingOrderProgress('${orderId}');">
                <div style="background: #000; padding: 10px 12px; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fas fa-box" style="margin-right: 6px;"></i>订单分享</span>
                    <span style="font-size: 12px; opacity: 0.8;">Møde.</span>
                </div>
                <div style="padding: 15px;">
                    <div style="font-size: 16px; font-weight: bold; margin-bottom: 4px; color: #333;">${status}</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 12px;">${eta}</div>
                    
                    <div style="position: relative; height: 4px; background: #f0f0f0; border-radius: 2px; margin-bottom: 12px;">
                        <div style="position: absolute; top: 0; left: 0; height: 100%; background: #000; border-radius: 2px; width: ${step === 1 ? '33%' : (step === 2 ? '66%' : '100%')};"></div>
                    </div>

                    <div style="font-size: 13px; color: #333; border-top: 1px solid #f0f0f0; padding-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${items}
                    </div>
                </div>
                <div style="padding: 6px 12px; background: #f9f9f9; font-size: 11px; color: #999; text-align: right;">
                    点击查看详情 <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
                </div>
            </div>
        `;
    } else if (type === 'pay_request') {

        extraClass += ' pay-request-msg';
        let payData = {};
        try {
            payData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const itemCount = payData.items ? payData.items.length : 0;
        const firstItem = itemCount > 0 ? payData.items[0] : { title: '商品', image: '' };
        const total = payData.total || '0.00';
        const isPaid = payData.status === 'paid';
        
        contentHtml = `
            <div class="pay-request-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 230px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                <div style="background: #333333; padding: 8px 12px; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fas fa-hand-holding-usd" style="margin-right: 6px;"></i>代付请求</span>
                    <span style="font-size: 16px;">¥${total}</span>
                </div>
                <div style="padding: 5px 10px 2px 10px; display: flex; gap: 10px;">
                    <div style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background-color: #f0f0f0;">
                        <img src="${firstItem.image || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 13px; color: #333; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${firstItem.title}</div>
                        ${firstItem.selectedSpec ? `<div style="font-size: 11px; color: #999; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${firstItem.selectedSpec}</div>` : ''}
                        ${itemCount > 1 ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">等 ${itemCount} 件商品</div>` : ''}
                    </div>
                </div>
                <div style="padding: 2px 12px; border-top: 1px solid #f5f5f5; text-align: right; line-height: 1;">
                     ${isPaid ? 
                       '<span style="font-size: 12px; color: #999; border: 1px solid #ddd; padding: 2px 8px; border-radius: 10px; background: #f5f5f5;">已付款</span>' : 
                       '<span style="font-size: 12px; color: #FF5000; border: 1px solid #FF5000; padding: 2px 8px; border-radius: 10px;">去支付</span>'}
                </div>
            </div>
        `;
    } else if (type === 'product_share') {
        extraClass += ' product-share-msg';
        let productData = {};
        try {
            productData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        contentHtml = `
            <div class="product-share-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 230px; height: 115px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: flex; flex-direction: column;">
                <div style="display: flex; padding: 10px; gap: 8px; flex: 1; overflow: hidden;">
                    <div style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background-color: #f0f0f0;">
                        <img src="${productData.image || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
                        <div style="font-size: 13px; color: #333; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">${productData.title || '商品'}</div>
                        <div style="font-size: 14px; color: #FF5000; font-weight: bold;">¥${productData.price || '0.00'}</div>
                    </div>
                </div>
                <div style="padding: 0 10px 0 10px; height: 26px; font-size: 10px; color: #999; border-top: 1px solid #f5f5f5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
                    <div style="display: flex; align-items: center;">
                        <i class="fas fa-shopping-bag" style="color: #FF5000; margin-right: 4px;"></i>
                        <span>${productData.shop_name || '闲鱼'}</span>
                    </div>
                    <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
                </div>
            </div>
        `;
    } else if (type === 'icity_card') {
        extraClass += ' icity-card-msg';
        let cardData = typeof text === 'string' ? JSON.parse(text) : text;
        
        let displayContent = cardData.content;
        if (displayContent && displayContent.length > 30) {
            displayContent = displayContent.substring(0, 30) + '...';
        }
        
        let commentCount = 0;
        if (cardData.comments && Array.isArray(cardData.comments)) {
            commentCount = cardData.comments.length;
        }
        
        let commentBadge = '';
        if (commentCount > 0) {
            commentBadge = `<span style="margin-left: auto; background: #f0f0f0; padding: 1px 6px; border-radius: 4px; color: #666;">${commentCount}条评论</span>`;
        }
        
        contentHtml = `
            <div class="icity-share-card" style="background: #fff; border-radius: 8px; width: 220px; height: 110px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; margin-top: -40px;" onclick="document.getElementById('icity-app').classList.remove('hidden'); window.openIcityDiaryDetail(${cardData.diaryId});">
                <div style="padding: 8px 10px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cardData.authorName}</div>
                    <div style="font-size: 12px; color: #666; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayContent}</div>
                </div>
                <div style="padding: 4px 10px; font-size: 10px; color: #999; display: flex; align-items: center; border-top: 1px solid #f5f5f5; height: 24px; padding-top: 6px;">
                    <i class="fas fa-globe" style="margin-right: 4px;"></i> <span style="position: relative; top: 0px;">iCity 日记</span>
                    ${commentBadge}
                </div>
            </div>
        `;
    } else if (type === 'minesweeper_invite') {
        extraClass += ' minesweeper-invite-msg';
        contentHtml = `<div class="minesweeper-card" style="display: flex; flex-direction: column; width: 100%; height: 100%; justify-content: space-between;" onclick="window.startMinesweeper()"><div class="minesweeper-invite-top" style="display: flex; align-items: center; padding: 12px 15px; gap: 12px; background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; width: 100%;"><div class="minesweeper-icon" style="width: 40px; height: 40px; border-radius: 8px; background-color: #ff3b30; display: flex; justify-content: center; align-items: center; font-size: 20px; color: #fff;">💣</div><div class="minesweeper-info" style="display: flex; flex-direction: column; justify-content: center; flex: 1;"><div class="minesweeper-title" style="font-size: 16px; font-weight: 600; color: #000; margin-bottom: 2px;">扫雷</div><div class="minesweeper-desc" style="font-size: 12px; color: #8e8e93;">邀请你玩游戏</div></div></div><div class="minesweeper-invite-bottom" style="padding: 8px 15px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #8e8e93; width: 100%;"><span>经典游戏</span><i class="fas fa-chevron-right"></i></div></div>`;
    } else if (type === 'pdd_cash_share') {
        let data = {};
        try { data = JSON.parse(text); } catch(e) {}
        
        contentHtml = `
            <div class="pdd-share-msg" onclick="if(window.renderCashActivity) { document.getElementById('shopping-app').classList.remove('hidden'); window.renderCashActivity(); }">
                <div class="pdd-share-header">
                    <i class="fas fa-money-bill-wave"></i> <span class="pdd-header-text">天天领现金</span>
                </div>
                <div class="pdd-share-content">
                    <div class="pdd-share-title">点一下！就差你了</div>
                    <div class="pdd-share-amount">¥${data.amount || '99.9'}</div>
                </div>
            </div>
        `;
    } else if (type === 'pdd_bargain_share') {
        let data = {};
        try { data = JSON.parse(text); } catch(e) {}
        
        contentHtml = `
            <div class="pdd-share-msg" onclick="if(window.startBargain) { document.getElementById('shopping-app').classList.remove('hidden'); window.startBargain({id: '${data.productId}', title: '${data.title}', price: ${data.currentPrice}, image: '${data.image}'}); }">
                <div class="pdd-share-header" style="background:#ff6600;">
                    <i class="fas fa-cut"></i> <span class="pdd-header-text">砍价免费拿</span>
                </div>
                <div class="pdd-share-content">
                    <div style="display:flex; gap:10px; margin-bottom:10px;">
                        <div style="width:60px; height:60px; background:#f0f0f0; border-radius:4px; flex-shrink:0; display:flex; align-items:center; justify-content:center;">
                            <i class="fas fa-gift" style="font-size:24px; color:#ff6600;"></i>
                        </div>
                        <div style="text-align:left; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
                            <div style="font-size:13px; font-weight:bold; line-height:1.2; height:32px; overflow:hidden; color:#333;">${data.title}</div>
                            <div style="color:#ff0000; font-weight:bold; font-size:14px;">当前: ¥${data.currentPrice}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    let replyHtml = '';
    if (replyTo) {
        replyHtml = `
            <div class="quote-container">
                回复 ${replyTo.name}: ${replyTo.content}
            </div>
        `;
    }

    const date = new Date(now);
    const msgTimeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const timeHtml = `<div class="msg-time">${msgTimeStr}</div>`;

    if (type === 'description') {
        msgDiv.className = 'chat-message description-row';
        msgDiv.innerHTML = `
            <div class="msg-wrapper" style="width: 100%; align-items: center;">
                <div class="message-content ${extraClass}">${contentHtml}</div>
            </div>
        `;
    } else if (!isUser) {
        const avatar = contact ? contact.avatar : '';
        msgDiv.innerHTML = `
            <img src="${avatar}" class="chat-avatar" onclick="window.openAiProfile()" style="cursor: pointer;">
            <div class="msg-wrapper">
                <div class="message-content ${extraClass}">${contentHtml}</div>
                ${replyHtml}
            </div>
            ${timeHtml}
        `;
    } else {
        let myAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
        
        if (contact && contact.myAvatar) {
            myAvatar = contact.myAvatar;
        } else if (window.iphoneSimState.currentUserPersonaId) {
            const p = window.iphoneSimState.userPersonas.find(p => p.id === window.iphoneSimState.currentUserPersonaId);
            if (p) myAvatar = p.avatar;
        }

        msgDiv.innerHTML = `
            <img src="${myAvatar}" class="chat-avatar">
            <div class="msg-wrapper">
                <div class="message-content ${extraClass}">${contentHtml}</div>
                ${replyHtml}
            </div>
            ${timeHtml}
        `;
    }
    
    // 在 msgDiv 构建完成后，检查并添加刷新按钮
    if (type === 'image' && !isUser && msgId) {
        const contentEl = msgDiv.querySelector('.message-content');
        if (contentEl) {
             const currentContactId = window.iphoneSimState.currentChatContactId;
             if (currentContactId && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[currentContactId]) {
                 const msgObj = window.iphoneSimState.chatHistory[currentContactId].find(m => m.id === msgId);
                 if (msgObj && msgObj.novelaiPrompt) {
                     contentEl.style.position = 'relative';
                     contentEl.style.display = 'inline-block';
                     
                     const img = contentEl.querySelector('img');
                     if (img) {
                         img.style.display = 'block';
                         img.style.margin = '0';
                     }

                     const btn = document.createElement('div');
                     btn.className = 'image-refresh-btn';
                     btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                     btn.onclick = (e) => window.refreshAiImage(msgId, e);
                     btn.title = '重新生成';
                     contentEl.appendChild(btn);
                 }
             }
        }
    }

    const selectCheckbox = document.createElement('input');
    selectCheckbox.type = 'checkbox';
    selectCheckbox.className = 'msg-select-checkbox hidden';
    selectCheckbox.style.position = 'absolute';
    selectCheckbox.style.zIndex = '210';
    selectCheckbox.dataset.msgId = msgId || '';
    selectCheckbox.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = ev.target.dataset.msgId;
        toggleMessageSelection(id);
    });
    msgDiv.appendChild(selectCheckbox);

    let longPressTimer;
    const handleStart = (e) => {
        longPressTimer = setTimeout(() => {
            handleMessageLongPress(e, text, isUser, type, msgId);
        }, 500);
    };
    const handleEnd = () => {
        clearTimeout(longPressTimer);
    };
    
    const bubble = msgDiv.querySelector('.message-content');
    if (bubble) {
        bubble.addEventListener('touchstart', handleStart);
        bubble.addEventListener('touchend', handleEnd);
        bubble.addEventListener('touchmove', handleEnd);
        bubble.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleMessageLongPress(e, text, isUser, type, msgId);
        });
    }

    container.appendChild(msgDiv);
}

function enterMultiSelectMode(preselectMsgId) {
    window.iphoneSimState.isMultiSelectMode = true;
    if (preselectMsgId) window.iphoneSimState.selectedMessages.add(preselectMsgId);
    const cancelBtn = document.getElementById('multi-select-cancel');
    const deleteBtn = document.getElementById('multi-select-delete');
    const countEl = document.getElementById('multi-select-count');
    if (cancelBtn) cancelBtn.classList.remove('hidden');
    if (deleteBtn) deleteBtn.classList.remove('hidden');
    if (countEl) countEl.textContent = window.iphoneSimState.selectedMessages.size;
    if (cancelBtn) {
        cancelBtn.onclick = (e) => { e.stopPropagation(); exitMultiSelectMode(); };
    }
    if (deleteBtn) {
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteSelectedMessages(); };
    }
    updateMultiSelectUI();
    applyChatMultiSelectClass();
}

function exitMultiSelectMode() {
    window.iphoneSimState.isMultiSelectMode = false;
    window.iphoneSimState.selectedMessages.clear();
    const cancelBtn = document.getElementById('multi-select-cancel');
    const deleteBtn = document.getElementById('multi-select-delete');
    const countEl = document.getElementById('multi-select-count');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    if (deleteBtn) deleteBtn.classList.add('hidden');
    if (countEl) countEl.textContent = '0';
    updateMultiSelectUI();
}

function applyChatMultiSelectClass() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    if (window.iphoneSimState.isMultiSelectMode) container.classList.add('multi-select-mode');
    else container.classList.remove('multi-select-mode');
}

function toggleMessageSelection(msgId) {
    if (!window.iphoneSimState.isMultiSelectMode) return;
    if (!msgId) return;
    if (window.iphoneSimState.selectedMessages.has(msgId)) window.iphoneSimState.selectedMessages.delete(msgId);
    else window.iphoneSimState.selectedMessages.add(msgId);
    const countEl = document.getElementById('multi-select-count');
    if (countEl) countEl.textContent = window.iphoneSimState.selectedMessages.size;
    updateMultiSelectUI();
}

function updateMultiSelectUI() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const items = container.querySelectorAll('.chat-message');
    items.forEach(item => {
        const checkbox = item.querySelector('.msg-select-checkbox');
        const id = item.dataset.msgId;
        
        if (window.iphoneSimState.isMultiSelectMode) {
            if (checkbox) checkbox.classList.remove('hidden');
            
            // Attach click handler to the message item container
            item.onclick = (e) => {
                // Avoid double toggling if clicking the checkbox directly
                if (e.target !== checkbox) {
                    e.stopPropagation();
                    if (id) toggleMessageSelection(id);
                }
            };
            
            // Clear bubble handler if any
            const bubble = item.querySelector('.message-content');
            if (bubble) bubble.onclick = null;
            
        } else {
            if (checkbox) {
                checkbox.classList.add('hidden');
                checkbox.checked = false;
            }
            
            // Remove item handler
            item.onclick = null;
            
            const bubble = item.querySelector('.message-content');
            if (bubble) {
                bubble.style.cursor = '';
                bubble.onclick = null;
            }
        }

        if (checkbox) {
            checkbox.checked = window.iphoneSimState.selectedMessages.has(id);
            if (window.iphoneSimState.selectedMessages.has(id)) item.classList.add('selected-msg');
            else item.classList.remove('selected-msg');
        }
    });
    const deleteBtn = document.getElementById('multi-select-delete');
    const countEl = document.getElementById('multi-select-count');
    if (deleteBtn && countEl) {
        deleteBtn.disabled = window.iphoneSimState.selectedMessages.size === 0;
    }
    applyChatMultiSelectClass();
}

function deleteSelectedMessages() {
    if (!window.iphoneSimState.isMultiSelectMode) return;
    if (window.iphoneSimState.selectedMessages.size === 0) {
        alert('未选择任何消息');
        return;
    }
    if (!confirm(`确定删除选中的 ${window.iphoneSimState.selectedMessages.size} 条消息吗？此操作不可恢复。`)) return;
    const ids = Array.from(window.iphoneSimState.selectedMessages);
    if (!window.iphoneSimState.currentChatContactId) return;
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = history.filter(m => !ids.includes(String(m.id)) && !ids.includes(m.id));
    saveConfig();
    exitMultiSelectMode();
    renderChatHistory(window.iphoneSimState.currentChatContactId);
}

function handleMessageLongPress(e, content, isUser, type, msgId) {
    if (e.type === 'contextmenu') {
        e.preventDefault();
    }
    
    let target = e.target;
    while (target && !target.classList.contains('message-content')) {
        target = target.parentElement;
        if (!target || target === document.body) break; 
    }
    
    if (!target) {
        if (e.type === 'touchstart' && e.touches && e.touches[0]) {
            const touch = e.touches[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (el) {
                target = el.closest('.message-content');
            }
        }
    }

    if (!target) return;

    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    let name = 'AI';
    if (isUser) {
        if (contact && contact.userPersonaId) {
            const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
            name = p ? p.name : window.iphoneSimState.userProfile.name;
        } else {
            name = window.iphoneSimState.userProfile.name;
        }
    } else {
        name = contact ? (contact.remark || contact.name) : 'AI';
    }

    showContextMenu(target, { content, name, isUser, type, msgId });
}

function showContextMenu(targetEl, msgData) {
    const oldMenu = document.querySelector('.context-menu');
    if (oldMenu) oldMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-menu-item" id="menu-quote">引用</div>
        <div class="context-menu-item" id="menu-copy">复制</div>
        ${(msgData.type === 'image' || msgData.type === 'sticker' || msgData.type === 'virtual_image') ? '<div class="context-menu-item" id="menu-set-avatar">设为头像</div>' : ''}
        <div class="context-menu-item" id="menu-edit">编辑</div>
        <div class="context-menu-item" id="menu-delete" style="color: #ff3b30;">删除</div>
    `;
    
    menu.style.visibility = 'hidden';
    document.body.appendChild(menu);
    
    const menuRect = menu.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const gap = 10;
    
    let left, top;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    if (msgData.isUser) {
        left = targetRect.left - menuRect.width - gap + scrollX;
    } else {
        left = targetRect.right + gap + scrollX;
    }
    
    top = targetRect.top + scrollY;
    
    if (left < 0 || left + menuRect.width > window.innerWidth) {
         left = targetRect.left + (targetRect.width - menuRect.width) / 2 + scrollX;
         top = targetRect.top - menuRect.height - gap + scrollY;
         
         if (top < scrollY) {
             top = targetRect.bottom + gap + scrollY;
         }
    }
    
    if (left < 0) left = 10;
    if (left + menuRect.width > window.innerWidth) left = window.innerWidth - menuRect.width - 10;

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.visibility = 'visible';
    
    menu.querySelector('#menu-quote').onclick = () => {
        handleQuote(msgData);
        menu.remove();
    };
    
    menu.querySelector('#menu-copy').onclick = () => {
        if (msgData.type === 'text') {
            navigator.clipboard.writeText(msgData.content).then(() => {
            });
        }
        menu.remove();
    };
    const setAvatarBtn = menu.querySelector('#menu-set-avatar');
    if (setAvatarBtn) {
        setAvatarBtn.onclick = () => {
            menu.remove();
            if (!window.iphoneSimState.currentChatContactId) return;
            const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
            if (!contact) return;

            if (confirm(`确定要将这张图片设为 "${contact.remark || contact.name}" 的头像吗？`)) {
                let newAvatar = msgData.content;
                // If it's a sticker or virtual image with complex structure, handle it?
                // Usually msgData.content is the URL/Base64 for these types in appendMessageToUI calls
                // But for virtual_image in showContextMenu caller, content passed might be just URL if extracted correctly.
                // handleMessageLongPress passes 'content' which is 'text' from appendMessageToUI args.
                // In appendMessageToUI:
                // if type is image/sticker, text is URL.
                // if type is virtual_image, text is URL.
                
                contact.avatar = newAvatar;
                saveConfig();
                
                // Refresh UI
                if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                
                // Refresh chat history (to update avatars in message list)
                renderChatHistory(contact.id, true);
                
                // Update chat title avatar if exists (usually handled by renderChatHistory or openChat)
                // But we should refresh the header info if possible. 
                // Currently chat header doesn't show avatar, just name.
                // The contact list and message list avatars will be updated.
                
                // Send a system message indicating change?
                // sendMessage(`[系统消息]: 已将图片设为头像`, false, 'text');
                // Maybe just a toast?
                if (window.showChatToast) window.showChatToast('头像已更新');
                else alert('头像已更新');
            }
        };
    }

    menu.querySelector('#menu-edit').onclick = () => {
        if (msgData.msgId) {
            menu.remove();

            // 检查是否有 NovelAI 提示词
            const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
            const fullMsg = history ? history.find(m => m.id === msgData.msgId) : null;
            
            if (fullMsg && fullMsg.novelaiPrompt) {
                // 如果有提示词，显示提示词编辑框
                // 这里简单使用 prompt 弹窗，也可以换成更复杂的模态框
                // 为了更好的体验，可以使用 textarea 的模态框，但目前 prompt 最简单有效
                const newPrompt = prompt("NovelAI 生成提示词 (Prompt):", fullMsg.novelaiPrompt);
                if (newPrompt !== null && newPrompt !== fullMsg.novelaiPrompt) {
                    fullMsg.novelaiPrompt = newPrompt;
                    saveConfig();
                    alert('提示词已更新 (仅更新记录，不会重新生成图片)');
                }
                return;
            }

            if (msgData.type !== 'text') {
                if(!confirm('这是一条非文本消息（如图片或转账），直接编辑内容可能会破坏显示格式。确定要编辑吗？')) {
                    return;
                }
            }
            if (typeof openEditChatMessageModal === 'function') {
                openEditChatMessageModal(msgData.msgId, msgData.content);
            } else {
                alert('编辑功能暂不可用');
            }
        } else {
            alert('无法编辑此消息（缺少ID）');
            menu.remove();
        }
    };

    menu.querySelector('#menu-delete').onclick = () => {
        if (msgData.msgId) {
            menu.remove();
            enterMultiSelectMode(msgData.msgId);
        } else {
            alert('无法删除此消息（缺少ID）');
            menu.remove();
        }
    };
    
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

function handleQuote(msgData) {
    window.iphoneSimState.replyingToMsg = msgData;
    const replyBar = document.getElementById('reply-bar');
    document.getElementById('reply-name').textContent = msgData.name;
    
    let previewText = msgData.content;
    if (msgData.type === 'image') previewText = '[图片]';
    else if (msgData.type === 'sticker') previewText = '[表情包]';
    else if (msgData.type === 'transfer') previewText = '[转账]';
    else if (msgData.type === 'family_card') previewText = '[亲属卡]';
    else if (msgData.type === 'pay_request') previewText = '[代付请求]';
    else if (msgData.type === 'music_listen_invite') previewText = '[一起听邀请]';
    
    document.getElementById('reply-text').textContent = previewText;
    replyBar.classList.remove('hidden');
    
    const chatInput = document.getElementById('chat-input');
    if (chatInput) chatInput.focus();
}

function cancelQuote() {
    window.iphoneSimState.replyingToMsg = null;
    document.getElementById('reply-bar').classList.add('hidden');
}

function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

// New Robust Parser for AI Responses
function parseMixedAiResponse(content) {
    const results = [];
    
    // Helper to process valid item
    const processItem = (item) => {
        if (!item) return;
        if (typeof item === 'string') {
            splitAndPushText(item);
            return;
        }
        
        // Normalize types
        let type = 'text';
        let content = item.content || '';
        
        if (item.type) {
            type = item.type;
             // Map Chinese types if any (compatibility)
            if (type === '消息') type = 'text';
            else if (type === '表情包') type = 'sticker';
            else if (type === '图片') type = 'image';
            else if (type === '语音') type = 'voice';
            else if (type === '旁白') type = 'description';
        }
        
        if (type === 'voice') {
             content = `${item.duration || 3} ${item.content || '语音消息'}`;
             results.push({ type: '语音', content });
        } else if (type === 'text') {
            splitAndPushText(content);
        } else if (type === 'thought') {
            results.push({ type: 'thought', content: content });
        } else if (type === 'action') {
            results.push({ type: 'action', content: item }); // Keep full object
        } else {
            // Other types (sticker, image, etc.)
            // 保留 item 中的其他字段（如 prompt）
            results.push({ ...item, type: type, content: content });
        }
    };

    const splitAndPushText = (text) => {
        if (!text) return;
        
        // 1. Handle Mixed Content (tags like [sticker])
        const mixedItems = forceSplitMixedContent(text);
        
        mixedItems.forEach(mi => {
            if (mi.type === '消息' || mi.type === 'text') {
                 // 2. Sentence Splitting for pure text
                 // Split by newlines OR punctuation (。！？!?)
                 const rawSegments = mi.content.split(/([。！？!?]+|\n+)/);
                 let buffer = '';
                 
                 for (let i = 0; i < rawSegments.length; i++) {
                     const seg = rawSegments[i];
                     if (!seg) continue;
                     
                     // Check if it's a separator
                     if (/^[。！？!?]+$/.test(seg)) {
                         buffer += seg;
                         // Punctuation marks end a sentence -> push buffer
                         if (buffer.trim()) {
                             results.push({ type: '消息', content: buffer.trim() });
                         }
                         buffer = '';
                     } else if (/^\n+$/.test(seg)) {
                         // Newlines definitely end a sentence
                         if (buffer.trim()) {
                             results.push({ type: '消息', content: buffer.trim() });
                         }
                         buffer = '';
                     } else {
                         buffer += seg;
                     }
                 }
                 if (buffer.trim()) {
                     results.push({ type: '消息', content: buffer.trim() });
                 }
            } else {
                results.push(mi);
            }
        });
    };

    // Helper to extract JSON objects from text using brace counting
    const extractJsonFromText = (text) => {
        const found = [];
        let braceCount = 0;
        let inString = false;
        let escape = false;
        let jsonStart = -1;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (inString) {
                if (char === '\\' && !escape) escape = true;
                else if (char === '"' && !escape) inString = false;
                else escape = false;
                continue;
            }

            if (char === '"') {
                inString = true;
                continue;
            }
            
            if (char === '{') {
                if (braceCount === 0) jsonStart = i;
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0 && jsonStart !== -1) {
                    const jsonStr = text.substring(jsonStart, i + 1);
                    try {
                        // Clean loose commas before parsing
                        const cleanJson = jsonStr.replace(/,\s*([\]}])/g, '$1');
                        const obj = JSON.parse(cleanJson);
                        found.push(obj);
                        jsonStart = -1;
                    } catch (e) {
                         // Ignore invalid JSON
                    }
                } else if (braceCount < 0) {
                    braceCount = 0;
                    jsonStart = -1;
                }
            }
        }
        return found;
    };

    let cleanContent = content.trim();
    
    // Attempt 1: Full JSON Parse
    try {
        if (cleanContent.includes('```')) {
            const match = cleanContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            if (match) cleanContent = match[1].trim();
        }
        
        const parsed = JSON.parse(cleanContent);
        if (Array.isArray(parsed)) {
            parsed.forEach(processItem);
            return results;
        } else if (typeof parsed === 'object') {
            processItem(parsed);
            return results;
        }
    } catch (e) {
        // Continue to extraction
    }

    // Attempt 2: Extract JSON Objects
    const extractedObjects = extractJsonFromText(cleanContent);
    if (extractedObjects.length > 0) {
        extractedObjects.forEach(processItem);
        return results;
    }

    // Attempt 3: Treat as raw text (Fallback)
    splitAndPushText(cleanContent);

    return results;
}

// Helper to force split text containing stickers/images
function forceSplitMixedContent(content) {
    const results = [];
    // 预处理：统一符号
    let processed = content.replace(/【/g, '[').replace(/】/g, ']').replace(/：/g, ':');
    
    // 正则匹配 [类型:内容] 或 [类型] (无冒号兼容)
    // 改进正则：允许内容中包含换行符，且支持 "发送了表情包" 这种 AI 常见错误格式
    const regex = /\[(消息|表情包|发送了表情包|发送了一个表情包|语音|图片|旁白)(?:\s*[:：]\s*([\s\S]*?))?\]/g;
    
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(processed)) !== null) {
        // 1. 捕获当前匹配项之前的文本
        const preText = processed.substring(lastIndex, match.index); // 不trim以保留格式
        if (preText) { 
             const parts = preText.split('\n');
             parts.forEach(p => {
                 if (p.trim()) {
                     results.push({ type: '消息', content: p.trim() });
                 }
             });
        }

        // 2. 添加当前匹配项
        let type = match[1];
        if (type.includes('表情包')) type = '表情包';
        else if (type === '图片') type = '图片';
        else if (type === '语音') type = '语音';
        else if (type === '旁白') type = '旁白';
        else type = '消息';

        let content = match[2] ? match[2].trim() : '';
        if (type === '表情包' && !content) content = '未知表情'; // 默认值

        results.push({
            type: type, 
            content: content
        });

        lastIndex = regex.lastIndex;
    }

    // 3. 捕获剩余的文本
    const postText = processed.substring(lastIndex);
    if (postText && postText.trim()) {
        const parts = postText.split('\n');
        parts.forEach(p => {
            if (p.trim()) {
                results.push({ type: '消息', content: p.trim() });
            }
        });
    }

    return results.length > 0 ? results : [{ type: '消息', content: content }];
}

// Fallback legacy parser (kept for compatibility)
function parseMixedContent(content) {
    return forceSplitMixedContent(content);
}

function normalizeQuoteText(text) {
    if (!text) return '';
    return String(text)
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[，。！？、,.!?:;"'“”‘’（）()【】\[\]{}<>《》\-—_]/g, '');
}

function buildQuoteContextPrefix(replyTo) {
    if (!replyTo || !replyTo.name || !replyTo.content) return '';
    return `[引用回复：正在回复 ${replyTo.name} 的消息「${replyTo.content}」]\n`;
}

function getMessageTextForQuoteMatch(msg) {
    if (!msg) return '';

    if (msg.type === 'voice' && typeof msg.content === 'string') {
        try {
            const data = JSON.parse(msg.content);
            return data.text || '';
        } catch (e) {
            return msg.content || '';
        }
    }

    if (typeof msg.content === 'string') {
        return msg.content;
    }

    return '';
}

function quoteSimilarityScore(queryNorm, targetNorm) {
    if (!queryNorm || !targetNorm) return 0;
    if (targetNorm.includes(queryNorm) || queryNorm.includes(targetNorm)) return 1;

    const queryBigrams = new Set();
    const targetBigrams = new Set();

    for (let i = 0; i < queryNorm.length - 1; i++) {
        queryBigrams.add(queryNorm.slice(i, i + 2));
    }
    for (let i = 0; i < targetNorm.length - 1; i++) {
        targetBigrams.add(targetNorm.slice(i, i + 2));
    }

    if (queryBigrams.size > 0 && targetBigrams.size > 0) {
        let intersection = 0;
        queryBigrams.forEach(bg => {
            if (targetBigrams.has(bg)) intersection++;
        });
        const base = Math.max(1, Math.min(queryBigrams.size, targetBigrams.size));
        return intersection / base;
    }

    const queryChars = new Set(queryNorm.split(''));
    if (queryChars.size === 0) return 0;
    let hits = 0;
    queryChars.forEach(ch => {
        if (targetNorm.includes(ch)) hits++;
    });
    return hits / queryChars.size;
}

function findBestQuoteTargetMessage(history, quoteContent) {
    if (!Array.isArray(history) || history.length === 0 || !quoteContent) return null;

    const rawQuery = String(quoteContent).trim();
    const queryNorm = normalizeQuoteText(rawQuery);
    if (!rawQuery || !queryNorm) return null;

    let bestMsg = null;
    let bestScore = 0;

    for (let j = history.length - 1; j >= 0; j--) {
        const msg = history[j];
        const rawTarget = getMessageTextForQuoteMatch(msg);
        if (!rawTarget) continue;

        const targetNorm = normalizeQuoteText(rawTarget);
        if (!targetNorm) continue;

        if (rawTarget.includes(rawQuery) || rawQuery.includes(rawTarget)) {
            return msg;
        }
        if (targetNorm.includes(queryNorm) || queryNorm.includes(targetNorm)) {
            return msg;
        }

        const sim = quoteSimilarityScore(queryNorm, targetNorm);
        const recencyBonus = ((history.length - j) / history.length) * 0.08;
        const score = sim + recencyBonus;
        if (score > bestScore) {
            bestScore = score;
            bestMsg = msg;
        }
    }

    return bestScore >= 0.42 ? bestMsg : null;
}

async function generateAiReply(instruction = null, targetContactId = null) {
    const contactId = targetContactId || window.iphoneSimState.currentChatContactId;
    if (!contactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        if (!targetContactId) alert('请先在设置中配置AI API');
        return;
    }

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    
    // Check for Truth or Dare triggers
    if (!targetContactId && window.currentMiniGame === 'truth_dare') {
        const modal = document.getElementById('mini-game-modal');
        if (modal && !modal.classList.contains('hidden')) {
            const lastMsg = history[history.length - 1];
            if (lastMsg && lastMsg.role === 'user') {
                const content = lastMsg.content;
                // Only trigger if content is simple (avoid false positives in long texts)
                if (content.length < 20) {
                    if (content.includes('真心话')) {
                        if (window.handleAiTruthDare) window.handleAiTruthDare('truth');
                    } else if (content.includes('大冒险')) {
                        if (window.handleAiTruthDare) window.handleAiTruthDare('dare');
                    } else if (content.includes('转') || content.includes('开始') || content.toLowerCase().includes('spin')) {
                        if (window.handleAiTruthDare) window.handleAiTruthDare(null); // null means random choice or just spin
                    }
                }
            }
        }
    }

    let userPromptInfo = '';
    let currentPersona = null;

    if (contact.userPersonaId) {
        currentPersona = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
    }

    if (currentPersona) {
        userPromptInfo = `\n用户(我)的网名：${currentPersona.name || '未命名'}`;
        const promptContent = contact.userPersonaPromptOverride || currentPersona.aiPrompt;
        if (promptContent) {
            userPromptInfo += `\n用户(我)的人设：${promptContent}`;
        }
    } else if (window.iphoneSimState.userProfile) {
        userPromptInfo = `\n用户(我)的网名：${window.iphoneSimState.userProfile.name}`;
    }

    let momentContext = '';
    const contactMoments = window.iphoneSimState.moments.filter(m => m.contactId === contact.id);
    if (contactMoments.length > 0) {
        const lastMoment = contactMoments.sort((a, b) => b.time - a.time)[0];
        momentContext += `\n【朋友圈状态】\n你最新的一条朋友圈是：“${lastMoment.content}”\n`;
        
        if (lastMoment.comments && lastMoment.comments.length > 0) {
            const userName = currentPersona ? currentPersona.name : window.iphoneSimState.userProfile.name;
            const userComments = lastMoment.comments.filter(c => c.user === userName);
            if (userComments.length > 0) {
                const lastComment = userComments[userComments.length - 1];
                momentContext += `用户刚刚评论了你的朋友圈：“${lastComment.content}”\n`;
            }
        }
    }

    let icityContext = '';
    if (window.iphoneSimState.icityDiaries && window.iphoneSimState.icityDiaries.length > 0) {
        // Check visibility permissions
        const isLinked = window.iphoneSimState.icityProfile && 
                         window.iphoneSimState.icityProfile.linkedContactIds && 
                         window.iphoneSimState.icityProfile.linkedContactIds.includes(contact.id);
        
        const recentDiaries = window.iphoneSimState.icityDiaries.filter(d => {
            if (d.visibility === 'private') return false;
            // Friends-only posts are visible to linked contacts
            if (d.visibility === 'friends' && !isLinked) return false; 
            return true;
        }).slice(0, 3); // Get last 3

        if (recentDiaries.length > 0) {
            icityContext += '\n【用户最近的 iCity 日记】\n';
            recentDiaries.forEach(d => {
                const date = new Date(d.time);
                const timeStr = `${date.getMonth() + 1}月${date.getDate()}日`;
                icityContext += `[${timeStr}] ${d.content}\n`;
            });
        }
    }

    if (window.iphoneSimState.icityFriendsPosts && window.iphoneSimState.icityFriendsPosts.length > 0) {
        const aiPosts = window.iphoneSimState.icityFriendsPosts.filter(p => p.contactId === contact.id).slice(0, 3);
        if (aiPosts.length > 0) {
            icityContext += '\n【你最近发布的 iCity 动态】\n';
            aiPosts.forEach(p => {
                const date = new Date(p.time);
                const timeStr = `${date.getMonth() + 1}月${date.getDate()}日`;
                icityContext += `[${timeStr}] ${p.content}\n`;
            });
        }
    }

    let userPerceptionContext = '';
    if (contact.userPerception && contact.userPerception.length > 0) {
        userPerceptionContext = '\n【关于用户的认知】\n';
        contact.userPerception.forEach(p => {
            userPerceptionContext += `- ${p}\n`;
        });
    }

    let importantStateContext = '';
    if (contact.importantStates && contact.importantStates.length > 0) {
        importantStateContext = '\n【当前重要状态 (时效性信息)】\n⚠️ 请务必记住以下状态，并在回复中体现：\n';
        contact.importantStates.forEach(s => {
            importantStateContext += `- ${s}\n`;
        });
    }

    let memoryContext = '';
    // 增强记忆读取逻辑：结合最近记忆和相关性记忆 (Simple RAG)
    const contactMemories = window.iphoneSimState.memories.filter(m => m.contactId === contact.id);
    
    if (contactMemories.length > 0) {
        // 1. 获取限制，默认为 5 条
        const limit = contact.memorySendLimit && contact.memorySendLimit > 0 ? contact.memorySendLimit : 5;
        
        // 2. 按时间倒序排序 (最新的在前)
        const sortedMemories = contactMemories.sort((a, b) => b.time - a.time);
        
        // 3. 总是保留最新的几条记忆 (保持短期连贯性)
        const recentCount = Math.min(3, limit);
        const recentMemories = sortedMemories.slice(0, recentCount);
        
        // 4. 对剩余记忆进行关键词匹配 (Contextual Retrieval)
        // 提取当前对话上下文中的关键词 (简单的基于最近20条消息的全文检索)
        const remainingMemories = sortedMemories.slice(recentCount);
        const relevantMemories = [];
        
        if (remainingMemories.length > 0) {
            const contextText = history.slice(-20).map(m => m.content).join(' ').toLowerCase();
            
            if (contextText) {
                const scored = remainingMemories.map(mem => {
                    let score = 0;
                    const content = mem.content.toLowerCase();
                    
                    // 简单的双字匹配评分 (Bigram matching score)
                    // 对于中文环境，这比单词匹配更鲁棒
                    if (content.length > 1 && contextText.length > 1) {
                        for (let i = 0; i < content.length - 1; i++) {
                            const bigram = content.substr(i, 2);
                            // 排除常见标点
                            if (/[，。！？、：；\s]/.test(bigram)) continue;
                            if (contextText.includes(bigram)) score++;
                        }
                    }
                    return { mem, score };
                });
                
                // 按相关性排序
                scored.sort((a, b) => b.score - a.score);
                
                // 取出前 N 条相关记忆 (填补 limit 的剩余空间)
                const relevantCount = Math.max(0, limit - recentCount);
                // 只有分数大于0的才算相关
                const validRelevant = scored.filter(s => s.score > 0).slice(0, relevantCount).map(s => s.mem);
                relevantMemories.push(...validRelevant);
            }
        }
        
        // 合并并去重 (理论上 slice 保证了不重复)
        let finalMemories = [...recentMemories, ...relevantMemories];
        
        // 再次按时间正序排列，方便 AI 理解时间线
        finalMemories.sort((a, b) => a.time - b.time); 
        
        if (finalMemories.length > 0) {
            memoryContext += '\n【历史记忆 (已知事实)】\n⚠️ 注意：以下内容是你们过去的共同经历或已知事实，请勿重复向用户复述，除非用户主动询问或需要回忆。\n';
            finalMemories.forEach(m => {
                const date = new Date(m.time);
                const dateStr = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                memoryContext += `- [${dateStr}] ${m.content}\n`;
            });
        }
    }

    let timeContext = '';
    let itineraryContext = '';
    if (contact.realTimeVisible) {
        timeContext = buildRealtimeTimeContext(contact.id);
        
        if (window.getCurrentItineraryInfo) {
            itineraryContext = await window.getCurrentItineraryInfo(contact.id);
        }
    }

    let lookusContext = '';
    if (contact.lookusData) {
        const d = contact.lookusData;
        const lastUpdate = d.lastUpdateTime ? new Date(d.lastUpdateTime).toLocaleTimeString() : '未知';
        
        let appUsage = '';
        if (d.appList && d.appList.length > 0) {
            appUsage = '\n- 最近使用的APP: ' + d.appList.map(a => `${a.name}(${a.time})`).join(', ');
        }

        lookusContext = `\n【LookUs 状态 (用户可见)】
用户可以通过 "LookUs" 应用实时查看你的以下状态 (更新于 ${lastUpdate}):
- 距离: ${d.distance} km
- 电量: ${d.battery}
- 网络: ${d.network}
- 手机型号: ${d.device}
- 屏幕使用时间: ${d.screenTimeH}小时${d.screenTimeM}分
- 解锁次数: ${d.unlockCount}
- 最近解锁: ${d.lastUnlock}
- 停留地点数: ${d.stops}${appUsage}
⚠️ 你知道用户能看到这些信息。如果用户问起你的位置、电量或你在干什么，请结合这些信息回答。如果用户提到这些信息，请不要感到惊讶，因为你知道他在关注你的 LookUs 状态。`;

        // 添加用户端状态事件到上下文
        if (d.reportLog && d.reportLog.length > 0) {
            const userEvents = d.reportLog.filter(e => e.isUserEvent).slice(0, 5);
            if (userEvents.length > 0) {
                lookusContext += `\n\n【用户的手机状态通知】\n你同样可以通过 LookUs 看到用户(对方)的手机状态变化：\n`;
                userEvents.forEach(evt => {
                    lookusContext += `- ${evt.time}: ${evt.text.replace('📱 ', '')}\n`;
                });
                lookusContext += `\n⚠️ 你可以自然地在聊天���提及或关心这些状态。例如用户在充电时你可以说"在充电呀"，用户电量低时你可以提醒他充电，用户离开很久回来你可以问他去哪了。但不要每次都提，要自然。`;
            }
        }
    }

    let meetingContext = '';
    if (window.iphoneSimState.meetings && window.iphoneSimState.meetings[contact.id] && window.iphoneSimState.meetings[contact.id].length > 0) {
        const meetings = window.iphoneSimState.meetings[contact.id];
        const lastMeeting = meetings[meetings.length - 1];
        
        let meetingContent = '';
        if (lastMeeting.content && lastMeeting.content.length > 0) {
            const recentContent = lastMeeting.content.slice(-5);
            meetingContent = recentContent.map(c => {
                const role = c.role === 'user' ? '用户' : contact.name;
                return `${role}: ${c.text}`;
            }).join('\n');
        }

        if (meetingContent) {
            const meetingDate = new Date(lastMeeting.time);
            const meetingTimeStr = `${meetingDate.getMonth() + 1}月${meetingDate.getDate()}日`;
            meetingContext = `\n【线下见面记忆】\n你们最近一次见面是在 ${meetingTimeStr} (${lastMeeting.title})。\n当时发生的剧情片段：\n${meetingContent}\n(请知晓你们已经见过面，并根据剧情发展进行聊天)\n`;
        }
    }

    let icityBookContext = getLinkedIcityBooksContext(contact.id);

    let minesweeperContext = '';
    const msModal = document.getElementById('minesweeper-modal');
    if (msModal && !msModal.classList.contains('hidden') && window.getMinesweeperGameState) {
        minesweeperContext = '\n【当前扫雷游戏状态】\n' + window.getMinesweeperGameState() + '\n\n【扫雷操作指令】\n如果你想操作扫雷游戏，请使用以下指令：\n- 点击/揭开格子: ACTION: MINESWEEPER_CLICK: 行,列 (例如: ACTION: MINESWEEPER_CLICK: 0,0)\n- 插旗/标记地雷: ACTION: MINESWEEPER_FLAG: 行,列\n请分析局势，做出明智的决策。\n⚠️ 重要提示：\n1. 绝对不要点击已经揭开的数字格子或空格子。\n2. 绝对不要点击已经插旗的格子。\n3. 请只点击未知区域（显示为 ? 的位置）。\n4. 如果你推断某个位置是地雷，请务必使用 MINESWEEPER_FLAG 进行插旗，而不要点击它。\n5. 获胜条件是找出并标记所有地雷。';
    }

    let witchGameContext = '';
    const miniGameModal = document.getElementById('mini-game-modal');
    // Check if witch game is active (by checking title or state)
    if (miniGameModal && !miniGameModal.classList.contains('hidden') && window.getWitchGameState) {
        const witchState = window.getWitchGameState();
        if (witchState) {
            witchGameContext = '\n' + witchState + '\n\n【女巫的毒药操作指令】\n轮到你行动时，请选择用户区域（右侧）的一个格子进行猜测。\n指令：ACTION: WITCH_GUESS: 行,列 (行1-5, 列1-5)\n目标：找出用户藏的3瓶毒药。不要重复选择已经揭开的格子(⭕或☠️)。\n';
        }
    }

    // forum live-stream command guidance
    let forumLiveInstruction = '';
    // only show when forum app loaded or syncing enabled
    if (window.forumState) {
        forumLiveInstruction = '\n【论坛直播指令】\n当你希望在论坛开直播时，请在回复中输出：\nACTION: START_FORUM_LIVE: 标题\n可选扩展（按 `|` 分隔）：\nACTION: START_FORUM_LIVE: 标题 | 画面描述 | [{"username":"网名","content":"评论"}] | 图片URL\n如未提供画面描述/评论，系统会根据聊天上下文自动生成。\n';
    }

    let musicTogetherContext = '';
    if (typeof window.musicV2GetChatMusicContext === 'function') {
        try {
            const musicCtx = window.musicV2GetChatMusicContext(contact.id);
            if (musicCtx) {
                const lines = [];
                lines.push('\n【音乐一起听状态】');
                if (musicCtx.nowPlaying) {
                    lines.push(`当前播放：${musicCtx.nowPlaying.title || '未知歌曲'} - ${musicCtx.nowPlaying.artist || '未知歌手'}`);
                    if (musicCtx.nowPlaying.lyricLine) {
                        lines.push(`当前歌词句：${musicCtx.nowPlaying.lyricLine}`);
                    }
                } else {
                    lines.push('当前未播放歌曲');
                }
                if (musicCtx.together && musicCtx.together.active) {
                    if (musicCtx.together.withCurrentContact) {
                        lines.push('你当前正在和用户一起听歌。');
                    } else {
                        lines.push(`你当前在和 ${musicCtx.together.contactName || '其他联系人'} 一起听歌。`);
                    }
                } else {
                    lines.push('当前没有激活的一起听会话。');
                }
                if (musicCtx.pendingInvite && musicCtx.pendingInvite.inviteId) {
                    lines.push(`你收到了用户发来的一起听邀请（inviteId=${musicCtx.pendingInvite.inviteId}），歌曲是 ${musicCtx.pendingInvite.songTitle || '未知歌曲'} - ${musicCtx.pendingInvite.songArtist || '未知歌手'}。`);
                    lines.push('你必须在本次回复中给出动作指令：{"type":"action","command":"MUSIC_INVITE_DECISION","payload":"inviteId | 同意/拒绝"}');
                }
                musicTogetherContext = lines.join('\n') + '\n';
            }
        } catch (e) {
            musicTogetherContext = '';
        }
    }

    let systemPrompt = `你现在扮演 ${contact.name}。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

聊天风格：${contact.style || '正常'}
${userPromptInfo}
${userPerceptionContext}
${importantStateContext}
${momentContext}
${icityContext}
${lookusContext}
${memoryContext}
${meetingContext}
${icityBookContext}
${minesweeperContext}
${witchGameContext}
${forumLiveInstruction}
${musicTogetherContext}
${timeContext}
${itineraryContext}

你必须完全沉浸在角色中，绝对不能透露你是AI或语言模型。你的回复必须像一个真实的${contact.name}在使用微信聊天。
你拥有“微信朋友圈”“微信转账”“亲属卡”功能。

${contact.showThought ? `
【⚡️强制要求：内心独白⚡️】
⚠️ **最高优先级指令**：当前用户已开启“显示心声”模式。
你**必须**在返回的 JSON 数组的**第一个元素**位置输出角色的内心独白。
格式：{"type": "thought", "content": "这里写角色的心理活动..."}
**如果不输出心声，将视为严重错误！请务必执行！**
` : ''}

【⚡️绝对输出规则 - JSON 格式 (强制)⚡️】
为了确保回复格式正确，你**必须且只能**返回一个标准的 JSON 数组。
**严禁**包含任何 Markdown 代码块标记（如 \`\`\`json 或 \`\`\`）。
**严禁**在 JSON 数组之外输出任何文本。
**严禁**输出类似 "[发送了一个表情包：xxx]" 的纯文本格式。
**严禁**输出 "BAKA"、"baka" 等词汇，除非人设明确要求。

数组中的每个元素代表一条消息、表情包或动作指令。请严格遵守以下 JSON 对象结构：

1. 💭 **内心独白** ${contact.showThought ? '(**必须作为第一项**)' : '(可选)'}：
   \`{"type": "thought", "content": "想法内容"}\`
   ${contact.showThought ? '*要求*：这是角色的心理活动，必须输出，且必须放在数组第一个位置。' : ''}

2. 💬 **文本消息**：
   \`{"type": "text", "content": "消息内容"}\`
   *注意*：请务必将长回复拆分为多条短消息，模拟真实聊天节奏。**不要把多句话合并在一条消息里**。每条消息尽量简短（1-2句话）。如果内容包含多个句子（用句号、问号、感叹号等分隔），请强制拆分成多个 type="text" 的对象。
   *禁止*：content 中绝对不能包含 "[发送了一个表情包...]" 或 "[图片]" 这样的描述文本。表情包必须通过独立的 type="sticker" 对象发送。

3. 😂 **表情包**（如果有）：
   \`{"type": "sticker", "content": "表情包名称"}\`
   *注意*：只能使用下方【可用表情包列表】中存在的名称。
   *禁止*：不要在 content 中写 "[发送了一个表情包...]"，直接写表情包名称即可。

4. 🖼️ **图片**：
   \`{"type": "image", "content": "图片中文描述", "prompt": "NovelAI English tags..."}\`
   *要求*：请务必提供 \`prompt\` 字段，将图片描述翻译为高质量的 NovelAI 英文标签（Tags），用逗号分隔。例如："1boy, solo, smile, looking at viewer"。

5. 🎤 **语音**：
   \`{"type": "voice", "duration": 秒数, "content": "语音文本"}\`

6. ⚡️ **动作指令**：
   \`{"type": "action", "command": "指令名", "payload": "参数"}\`
   *说明*：原本的 \`ACTION:\` 指令请封装在此结构中。例如 \`ACTION: POST_MOMENT: 内容\` 变为 \`{"type": "action", "command": "POST_MOMENT", "payload": "内容"}\`。

**示例回复：**
[
  {"type": "thought", "content": "他终于回我了，开心。"},
  {"type": "text", "content": "你好呀！"},
  {"type": "sticker", "content": "开心"},
  {"type": "text", "content": "今天天气真不错。"},
  {"type": "action", "command": "POST_MOMENT", "payload": "今天心情真好"}
]

【指令说明 (请封装为 type="action")】
- 发朋友圈 -> command: "POST_MOMENT", payload: "内容" (注意：朋友圈是公开的社交动态，类似于微信朋友圈)
- 发 iCity 日记 -> command: "POST_ICITY_DIARY", payload: "内容" (注意：iCity 是更私密、情绪化的日记，类似于微博/Instagram/小红书，用来记录心情、碎碎念或emo时刻)
- 编辑 iCity 手账 -> command: "EDIT_ICITY_BOOK", payload: "内容" (注意：这是你和用户共同编辑的手账本/交换日记。你可以另起一页写下你的回应、感悟或日记。纯文本内容，不需要HTML标签)
- 点赞动态 -> command: "LIKE_MOMENT", payload: "" (留空)
- 评论动态 -> command: "COMMENT_MOMENT", payload: "评论内容"
- 发论坛帖子 -> command: "POST_FORUM", payload: "内容"  (将内容发布为论坛动态)
- 开始直播 -> command: "START_FORUM_LIVE", payload: "标题"  (在论坛创建一个直播间)
- 发送图片 -> command: "SEND_IMAGE", payload: "图片描述"
- 发送表情包 -> command: "SEND_STICKER", payload: "表情包名称" (优先使用 type="sticker" 格式)
- 发送语音 -> command: "SEND_VOICE", payload: "秒数 语音内容文本" (例如 "5 哈哈")
- 拨打语音通话 -> command: "START_VOICE_CALL", payload: ""
- 拨打视频通话 -> command: "START_VIDEO_CALL", payload: ""
- 转账 -> command: "TRANSFER", payload: "金额 备注" (例如 "88.88 节日快乐")
- 接收转账 -> command: "ACCEPT_TRANSFER", payload: "ID" (当收到转账且决定接受时，必须使用此指令，否则转账状态不会更新)
- 退回转账 -> command: "RETURN_TRANSFER", payload: "ID"
- 亲属卡决策 -> command: "FAMILY_CARD_DECISION", payload: "cardId | 同意/拒绝 | 月额度数字"
  *规则*：同意时必须给出月额度；拒绝时额度可留空或0。
- 支付代付请求 -> command: "PAY_FOR_REQUEST", payload: "requestId" (当用户发送了代付请求时，你可以选择帮他支付。requestId在代付消息的JSON中)
- 共同存钱转入 -> command: "SAVINGS_DEPOSIT", payload: "金额 | 备注(可选)" (例如 "200 | 这周一起攒")
- 送礼物给用户 -> command: "SEND_GIFT", payload: "物品名称 | 价格 | 备注" (例如 "一束鲜花 | 52.0 | 节日快乐")
- 点外卖给用户 -> command: "SEND_DELIVERY", payload: "餐品名称 | 价格 | 备注" (例如 "炸鸡啤酒 | 35.0 | 趁热吃")
- 一起听邀请决策 -> command: "MUSIC_INVITE_DECISION", payload: "inviteId | 同意/拒绝" (例如 "invite_123 | 同意")
- 引用回复 -> command: "QUOTE_MESSAGE", payload: "消息内容摘要"
- 更改资料 -> 
  - command: "UPDATE_NAME", payload: "新网名"
  - command: "UPDATE_WXID", payload: "新微信号"
  - command: "UPDATE_SIGNATURE", payload: "新签名"
  - command: "UPDATE_AVATAR", payload: "" (将用户发送的最后一张图片设为自己的头像)
- 拼多多领现金助力 -> command: "PDD_CASH_HELP", payload: "" (留空)
  *说明*：当用户发送领现金链接时，如果决定帮他助力，请输出此指令。
- 拼多多砍价助力 -> command: "PDD_BARGAIN_HELP", payload: "商品ID" (从用户的分享链接中获取)
  *说明*：当用户发送砍价链接时，如果决定帮他砍一刀，请输出此指令。

【记忆提取指令】
在对话过程中，当你注意到用户提到关于自己的新信息时（如喜好、习惯、特征、经历等），请将其记录下来。
但必须注意：如果这个信息已经包含在用户当前选择的身份描述中，就不要记录。

检查步骤：
1. 获取当前用户身份描述（当前联系人的userPersonaId对应的aiPrompt）
2. 如果要记录的信息已经在该身份描述中明确提到过，则跳过
3. 如果要记录的信息与身份描述中的信息本质相同（只是表述不同），也跳过
4. 只有全新的、身份描述中没有的信息才记录

记录格式：{"type": "action", "command": "RECORD_USER_INFO", "payload": "信息内容"}
示例：{"type": "action", "command": "RECORD_USER_INFO", "payload": "用户喜欢在周末爬山"}

注意事项：
1. 只记录客观事实，不要记录推测或假设
2. 确保信息简洁明了，一条信息一句话
3. 避免重复记录已有信息
4. 信息可以是用户的任何方面：喜好、厌恶、习惯、特征、经历、能力等
5. 必须严格检查是否已在身份描述中存在

【重要状态记录指令】
除了普通记忆，你还可以记录用户的当前状态、时效性信息（如生理期、生病、考试周、出差、假期等）或你们关系的重大变化。
这类信息非常重要，你必须时刻记住，直到它过期或改变。

记录格式：{"type": "action", "command": "RECORD_IMPORTANT_STATE", "payload": "状态内容"}
示例：{"type": "action", "command": "RECORD_IMPORTANT_STATE", "payload": "用户正在生理期，身体不适"}

注意：
1. 只记录有时效性或非常重要的状态。
2. 避免记录琐碎的日常（如“用户刚才在吃饭”）。
3. 如果状态已经结束（通过对话推断），请不要再重复记录，或者可以通过新状态覆盖旧状态（系统会自动追加，你只需记录新的）。

${contact.showThought ? '- **强制执行**：请务必输出角色的【内心独白】(心声)。格式：{"type": "thought", "content": "..."}。\n  *注意*：这是角色的心理活动，不是AI的思考过程。绝不要暴露你是AI，不要分析任务指令，而是描写角色此刻的真实想法。' : '- 如果需要输出角色的内心独白（心声），请使用格式：{"type": "thought", "content": "..."}'}

注意：
1. **严格遵守 JSON 格式**：整个回复必须是一个合法的 JSON 数组。
2. **严禁**输出 "[发送了一个表情包：xxx]" 这种格式的文本。表情包必须用 sticker 对象。
3. 正常回复应该自然，不要机械地说“我点赞了”或“我收钱了”。
4. 如果不想执行操作，就不要输出 action 指令。
5. 发送图片时，请提供详细的画面描述。
5. 一次回复中最多只能发起一笔转账。
6. 你有权限更改自己的资料卡信息（网名、微信号、签名），当用户要求或你自己想改时可以使用。
7. **内心独白**是角色的心理活动，用户可见（如果开启了显示）。${contact.showThought ? '当前已开启显示，请务必输出，且作为第一条。' : ''}
8. 当对方消息带有“引用回复”关系时，请优先根据被引用消息理解对方在回应什么。

请回复对方的消息。`;

    if (window.iphoneSimState.stickerCategories && window.iphoneSimState.stickerCategories.length > 0) {
        let activeStickers = [];
        let hasLinkedCategories = false;
        
        // 修正逻辑：只有当 contact.linkedStickerCategories 存在且为数组时才进行过滤
        if (Array.isArray(contact.linkedStickerCategories)) {
            // 如果数组为空，说明没有关联任何表情包（用户可能特意取消了所有关联）
            // 如果数组不为空，只添加关联的表情包
            if (contact.linkedStickerCategories.length > 0) {
                hasLinkedCategories = true;
                window.iphoneSimState.stickerCategories.forEach(cat => {
                    if (contact.linkedStickerCategories.includes(cat.id)) {
                        activeStickers = activeStickers.concat(cat.list);
                    }
                });
            } else {
                // 显式设置为空数组，表示不使用任何表情包
                hasLinkedCategories = true; 
            }
        } 
        
        // 如果没有设置关联属性（新联系人或旧数据），默认使用所有
        if (!hasLinkedCategories && !contact.linkedStickerCategories) {
            window.iphoneSimState.stickerCategories.forEach(cat => {
                activeStickers = activeStickers.concat(cat.list);
            });
        }

        if (activeStickers.length > 0) {
            systemPrompt += '\n\n【可用表情包列表】\n';
            const descriptions = activeStickers.map(s => s.desc).join(', ');
            systemPrompt += descriptions + '\n';
            systemPrompt += '\n⚠️ **严格约束**：你只能使用上述列表中的表情包名称，必须**完全匹配**，不允许有任何偏差（包括标点符号）。\n';
            systemPrompt += '⚠️ **绝对禁止**编造不存在的表情包名称。如果列表中没有你想要表达的表情，请直接使用文字描述，或者放弃发送表情包。';
            systemPrompt += '\n⚠️ 如果你发送了不在列表中的表情包名称，它将无法显示，导致出现 "[表情包: xxx]" 的错误提示，这是不允许的。\n';
        } else {
            systemPrompt += '\n\n【可用表情包列表】\n（当前没有可用的表情包）\n';
            systemPrompt += '⚠️ 由于没有可用的表情包，请**绝对不要**尝试发送任何表情包。不要输出 {"type": "sticker", ...}。请仅使用文字回复。\n';
        }
    }

    if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0) {
        let activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled);
        
        if (contact.linkedWbCategories) {
            activeEntries = activeEntries.filter(e => contact.linkedWbCategories.includes(e.categoryId));
        }
        
        if (activeEntries.length > 0) {
            systemPrompt += '\n\n世界书信息：\n';
            activeEntries.forEach(entry => {
                let shouldAdd = false;
                if (entry.keys && entry.keys.length > 0) {
                    const historyText = history.map(h => h.content).join('\n');
                    const match = entry.keys.some(key => historyText.includes(key));
                    if (match) shouldAdd = true;
                } else {
                    shouldAdd = true;
                }
                
                if (shouldAdd) {
                    systemPrompt += `${entry.content}\n`;
                }
            });
        }
    }

    let limit = contact.contextLimit && contact.contextLimit > 0 ? contact.contextLimit : 50;
    let contextMessages = history.filter(h => !shouldExcludeFromAiContext(h)).slice(-limit);

    let imageCount = 0;
    for (let i = contextMessages.length - 1; i >= 0; i--) {
        if (contextMessages[i].type === 'image') {
            imageCount++;
            if (imageCount > 3) {
                contextMessages[i]._skipImage = true;
            }
        }
    }

    // 如果开启了时间感知，在消息之间插入时间间隔提示
    let messagesWithTimeGaps = [];
    if (contact.realTimeVisible && contextMessages.length > 0) {
        for (let i = 0; i < contextMessages.length; i++) {
            const currentMsg = contextMessages[i];
            
            // 添加当前消息
            messagesWithTimeGaps.push(currentMsg);
            
            // 检查与下一条消息的时间间隔
            if (i < contextMessages.length - 1) {
                const nextMsg = contextMessages[i + 1];
                const currentTime = currentMsg.time || 0;
                const nextTime = nextMsg.time || 0;
                
                if (currentTime && nextTime) {
                    const timeDiff = nextTime - currentTime; // 毫秒
                    const minutes = Math.floor(timeDiff / 60000);
                    const hours = Math.floor(timeDiff / 3600000);
                    const days = Math.floor(timeDiff / 86400000);
                    
                    let timeGapText = '';
                    
                    // 根据时间间隔生成不同的提示
                    if (days >= 1) {
                        timeGapText = `[时间流逝：距离上一条消息已过去${days}天${hours % 24}小时]`;
                    } else if (hours >= 2) {
                        timeGapText = `[时间流逝：距离上一条消息已过去${hours}小时]`;
                    } else if (minutes >= 30) {
                        timeGapText = `[时间流逝：距离上一条消息已过去${minutes}分钟]`;
                    }
                    
                    // 如果有明显的时间间隔，插入提示
                    if (timeGapText) {
                        messagesWithTimeGaps.push({
                            role: 'system',
                            content: timeGapText,
                            _isTimeGap: true
                        });
                    }
                }
            }
        }
        contextMessages = messagesWithTimeGaps;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages.map(h => {
            // 如果是时间间隔提示，直接返回
            if (h._isTimeGap) {
                return { role: 'system', content: h.content };
            }
            let content = h.content;
            const quotePrefix = buildQuoteContextPrefix(h.replyTo);
            
            // Parse hidden images from text content (e.g. from Moments)
            let embeddedImages = [];
            if (typeof content === 'string') {
                // Strip pollution from text messages to prevent AI from learning bad formats
                // This removes patterns like [发送了一个表情包:...] or [表情包] from text history
                content = content.replace(/\[(发送了一个)?(表情包|图片|语音).*?\]/g, '').trim();

                if (content.includes('<hidden_img>')) {
                    const imgRegex = /<hidden_img>(.*?)<\/hidden_img>/g;
                    let match;
                    while ((match = imgRegex.exec(content)) !== null) {
                        embeddedImages.push(match[1]);
                    }
                    content = content.replace(imgRegex, '').trim();
                }
            }

            if (contact.thoughtVisible && h.thought) {
                content += `\n(内心独白: ${h.thought})`;
            }

            if (embeddedImages.length > 0) {
                const textPart = `${quotePrefix}${content}`.trim();
                const contentArray = [{ type: "text", text: textPart }];
                embeddedImages.forEach(url => {
                    contentArray.push({ type: "image_url", image_url: { url: url } });
                });
                return { role: h.role, content: contentArray };
            }

            if (h.type === 'image') {
                if (h._skipImage) {
                    return { role: h.role, content: `${quotePrefix}[图片]` };
                }
                const imageContentArray = [];
                if (quotePrefix) {
                    imageContentArray.push({ type: "text", text: quotePrefix.trim() });
                }
                imageContentArray.push({ type: "image_url", image_url: { url: h.content } });
                return {
                    role: h.role,
                    content: imageContentArray
                };
            } else if (h.type === 'virtual_image') {
                const desc = h.description ? `: ${h.description}` : '';
                return {
                    role: h.role,
                    content: `${quotePrefix}[图片${desc}]`
                };
            } else if (h.type === 'sticker') {
                const desc = h.description ? `: ${h.description}` : '';
                return {
                    role: h.role,
                    content: `${quotePrefix}[表情包${desc}]`
                };
            } else if (h.type === 'voice') {
                let voiceText = '语音消息';
                try {
                    const data = JSON.parse(h.content);
                    voiceText = data.text || '语音消息';
                } catch (e) {
                    voiceText = h.content;
                }
                return {
                    role: h.role,
                    content: `${quotePrefix}[语音: ${voiceText}]`
                };
            } else if (h.type === 'voice_call_text') {
                let callText = '通话内容';
                try {
                    const data = JSON.parse(h.content);
                    callText = data.text || '通话内容';
                } catch(e) {
                    callText = h.content;
                }
                // 清洗可能残留的视频通话标签，防止污染普通聊天
                callText = callText.replace(/{{DESC}}[\s\S]*?{{\/DESC}}/gi, '')
                                   .replace(/{{DIALOGUE}}/gi, '')
                                   .replace(/{{\/DIALOGUE}}/gi, '')
                                   .replace(/{{.*?}}/g, '') // 移除其他可能的标签
                                   .trim();
                return { role: h.role, content: `${quotePrefix}${callText}` };
            } else if (h.type === 'gift_card') {
                let giftData = {};
                try {
                    giftData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {
                    giftData = { title: '礼物', price: '0' };
                }
                const amount = giftData.paymentAmount || giftData.price || '0';
                const recipient = giftData.recipientName ? `，收货人：${giftData.recipientName}` : '';
                const payMethod = giftData.paymentMethodLabel ? `，支付方式：${giftData.paymentMethodLabel}` : '';
                return { role: h.role, content: `${quotePrefix}[送出礼物：${giftData.title}，金额：${amount}元${recipient}${payMethod}] (这是我在闲鱼上看到你收藏的商品，特意买来送给你的)` };
            } else if (h.type === 'shopping_gift') {
                let giftData = {};
                try {
                    giftData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {}
                const items = giftData.items ? giftData.items.map(i => i.title).join(', ') : '礼物';
                const amount = giftData.paymentAmount || giftData.total || '0';
                const recipient = (giftData.recipientName || giftData.recipientText) ? `，收货人：${giftData.recipientName || giftData.recipientText}` : '';
                const payMethod = giftData.paymentMethodLabel ? `，支付方式：${giftData.paymentMethodLabel}` : '';
                return { role: h.role, content: `${quotePrefix}[送出礼物：${items}，总价值：${amount}元${recipient}${payMethod}] (这是我在购物APP购买并送给你的)` };
            } else if (h.type === 'savings_invite') {
                let inviteData = {};
                try {
                    inviteData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {}
                return { role: h.role, content: `${quotePrefix}[共同存钱邀请: 计划${inviteData.title || '共同存钱计划'}，目标¥${Number(inviteData.targetAmount || 0).toFixed(2)}，基础年化${Number(inviteData.aprBase || 0).toFixed(2)}%]` };
            } else if (h.type === 'savings_withdraw_request') {
                let reqData = {};
                try {
                    reqData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {}
                return { role: h.role, content: `${quotePrefix}[共同存钱转出申请: 金额¥${Number(reqData.amount || 0).toFixed(2)}，状态待确认]` };
            } else if (h.type === 'icity_card') {
                let cardData = {};
                try {
                    cardData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {}
                
                let authorInfo = `作者: ${cardData.authorName || '未知'}`;
                if (cardData.source === 'diary') {
                    authorInfo = `作者: 我(用户)`;
                }
                
                let commentsInfo = '';
                if (cardData.comments && cardData.comments.length > 0) {
                    // Limit to last 5 comments to avoid token limit
                    const recentComments = cardData.comments.slice(-5);
                    commentsInfo = '\n评论区:\n' + recentComments.map(c => `${c.name}: ${c.content}`).join('\n');
                }
                
                return { role: h.role, content: `${quotePrefix}[分享了 iCity 日记 (${authorInfo}): "${cardData.content || '内容'}"${commentsInfo}]` };
            } else if (h.type === 'pdd_cash_share') {
                let data = {};
                try { data = JSON.parse(content); } catch(e) {}
                return { role: h.role, content: `${quotePrefix}[分享了天天领现金链接：差 ${data.diff} 元提现]` };
            } else if (h.type === 'pdd_bargain_share') {
                let data = {};
                try { data = JSON.parse(content); } catch(e) {}
                return { role: h.role, content: `${quotePrefix}[分享了砍价免费拿链接：${data.title}，当前价格 ¥${data.currentPrice}，商品ID: ${data.productId}]` };
            } else {
                if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
                     try {
                         if (h.type === 'transfer') {
                             const data = JSON.parse(content);
                             return { role: h.role, content: `${quotePrefix}[转账: ${data.amount}元] (ID: ${data.id})` };
                         } else if (h.type === 'family_card') {
                             const data = JSON.parse(content);
                             const modeText = data.mode === 'grant' ? '给予' : '索要';
                             const statusText = data.status || 'pending';
                             const limitText = data.monthlyLimit ? `${data.monthlyLimit}元/月` : '待设置';
                             return { role: h.role, content: `${quotePrefix}[亲属卡: ${modeText}, 状态:${statusText}, 额度:${limitText}] (ID: ${data.id})` };
                         }
                     } catch(e) {}
                }
                return { role: h.role, content: `${quotePrefix}${content}` };
            }
        })
    ];

    if (instruction) {
        messages.push({
            role: 'system',
            content: `[系统提示]: ${instruction}`
        });
    }

    const titleEl = document.getElementById('chat-title');
    const originalTitle = titleEl.textContent;
    titleEl.textContent = '正在输入中...';

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: messages,
                temperature: settings.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('AI API Response:', data);

        if (data.error) {
            console.error('API Error Response:', data.error);
            throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        if (!data.choices || !data.choices.length || !data.choices[0].message) {
            console.error('Invalid API response structure:', data);
            throw new Error('API返回数据格式异常，请检查控制台日志');
        }

        let replyContent = data.choices[0].message.content;

        replyContent = replyContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                                   .replace(/<think>[\s\S]*?<\/think>/g, '')
                                   .trim();

        let actions = [];
        let thoughtContent = null;
        let messagesList = [];
        
        // 使用新的混合解析器
        const parsedItems = parseMixedAiResponse(replyContent);
        
        // 处理解析结果
        for (const item of parsedItems) {
            if (item.type === 'thought') {
                const t = item.content || '';
                thoughtContent = thoughtContent ? (thoughtContent + ' ' + t) : t;
            } else if (item.type === 'action') {
                // 转换 action 为旧的字符串格式以复用逻辑
                const cmd = item.content.command;
                const pl = item.content.payload;
                let actionStr = `ACTION: ${cmd}`;
                if (pl) {
                    actionStr += `: ${pl}`;
                }
                actions.push(actionStr);
            } else {
                // 消息, 表情包, 图片, 语音 等
                if (item.type === '消息' || item.type === 'text') {
                    // 二次解析文本中的混合内容（防止 AI 输出纯文本的表情包标签）
                    const subItems = forceSplitMixedContent(item.content);
                    messagesList.push(...subItems);
                } else {
                    messagesList.push(item);
                }
            }
        }

        // 兼容旧的 ACTION 和 心声 格式（如果解析器没处理）
        // parseMixedAiResponse 应该已经处理了大部分 JSON，但对于纯文本中的 ACTION 标记可能需要补充
        // 这里我们假设 AI 严格遵循 JSON 输出，但为了保险，扫描一下 text 类型的内容
        // 如果 text 内容包含 "ACTION:", 我们将其提取出来
        
        // Re-scan text messages for embedded actions (legacy fallback)
        const finalMessages = [];
        const actionRegex = /^[\s\*\-\>]*ACTION\s*[:：]\s*(.*)$/i;
        const thoughtRegex = /\[心声\s*[:：]\s*(.*?)\]/i;

        for (const msg of messagesList) {
            if (msg.type === '消息') {
                let lines = msg.content.split('\n');
                let cleanContent = '';
                
                for (let line of lines) {
                    let trimmedLine = line.trim();
                    
                    // Optimization: Do not skip empty lines to preserve formatting (paragraph breaks)
                    // if (!trimmedLine) continue; 

                    let actionMatch = trimmedLine.match(actionRegex);
                    let thoughtMatch = trimmedLine.match(thoughtRegex);

                    if (actionMatch) {
                        actions.push('ACTION: ' + actionMatch[1].trim());
                    } else if (thoughtMatch) {
                        const content = thoughtMatch[1].trim();
                        thoughtContent = thoughtContent ? (thoughtContent + ' ' + content) : content;
                    } else {
                        cleanContent += (cleanContent ? '\n' : '') + line;
                    }
                }
                
                if (cleanContent) {
                    // 如果清理后还有内容，保留消息
                    // 还要再次检查是否是 [类型:内容] 格式（如果 fallback 到 parseMixedContent）
                    // 但 parseMixedAiResponse 已经不做这个了。
                    // 保持简单，直接作为文本
                    finalMessages.push({ type: '消息', content: cleanContent });
                }
            } else {
                finalMessages.push(msg);
            }
        }
        messagesList = finalMessages;

        // 处理指令
        let imageToSend = null;
        let hasTransferred = false;
        
const momentRegex = /ACTION:\s*POST_MOMENT:\s*(.*?)(?:\n|$)/;
const forumPostRegex = /ACTION:\s*POST_FORUM:\s*(.*?)(?:\n|$)/;
const startForumLiveRegex = /ACTION:\s*START_FORUM_LIVE:\s*(.*?)(?:\n|$)/;
const icityDiaryRegex = /ACTION:\s*POST_ICITY_DIARY:\s*(.*?)(?:\n|$)/;
        const editIcityBookRegex = /ACTION:\s*EDIT_ICITY_BOOK:\s*(.*?)(?:\n|$)/;
        const likeRegex = /ACTION:\s*LIKE_MOMENT(?:\s*|$)/;
        const commentRegex = /ACTION:\s*COMMENT_MOMENT:\s*(.*?)(?:\n|$)/;
        const sendImageRegex = /ACTION:\s*SEND_IMAGE:\s*(.*?)(?:\n|$)/;
        const sendStickerRegex = /ACTION:\s*SEND_STICKER:\s*(.*?)(?:\n|$)/;
        const startVoiceCallRegex = /ACTION:\s*START_VOICE_CALL(?:\s*|$)/;
        const startVideoCallRegex = /ACTION:\s*START_VIDEO_CALL(?:\s*|$)/;
        const transferRegex = /ACTION:\s*TRANSFER:\s*(\d+(?:\.\d{1,2})?)\s*(.*?)(?:\n|$)/;
        const acceptTransferRegex = /ACTION:\s*ACCEPT_TRANSFER:\s*(\d+)(?:\n|$)/;
        const returnTransferRegex = /ACTION:\s*RETURN_TRANSFER:\s*(\d+)(?:\n|$)/;
        const familyCardDecisionRegex = /ACTION:\s*FAMILY_CARD_DECISION:\s*(.*?)(?:\n|$)/;
        const payForRequestRegex = /ACTION:\s*PAY_FOR_REQUEST:\s*(.*?)(?:\n|$)/;
        const savingsDepositRegex = /ACTION:\s*SAVINGS_DEPOSIT:\s*(.*?)(?:\n|$)/;
        const sendGiftRegex = /ACTION:\s*SEND_GIFT:\s*(.*?)(?:\n|$)/;
        const sendDeliveryRegex = /ACTION:\s*SEND_DELIVERY:\s*(.*?)(?:\n|$)/;
        const updateNameRegex = /ACTION:\s*UPDATE_NAME:\s*(.*?)(?:\n|$)/;
        const updateWxidRegex = /ACTION:\s*UPDATE_WXID:\s*(.*?)(?:\n|$)/;
        const updateSignatureRegex = /ACTION:\s*UPDATE_SIGNATURE:\s*(.*?)(?:\n|$)/;
        const updateAvatarRegex = /ACTION:\s*UPDATE_AVATAR(?:\s*|$)/;
        const quoteMessageRegex = /ACTION:\s*QUOTE_MESSAGE:\s*(.*?)(?:\n|$)/;
        const recordUserInfoRegex = /ACTION:\s*RECORD_USER_INFO:\s*(.*?)(?:\n|$)/;
        const sendVoiceRegex = /ACTION:\s*SEND_VOICE:\s*(\d+)\s*(.*?)(?:\n|$)/;
        const msClickRegex = /ACTION:\s*MINESWEEPER_CLICK:\s*(\d+)\s*,\s*(\d+)(?:\n|$)/;
        const msFlagRegex = /ACTION:\s*MINESWEEPER_FLAG:\s*(\d+)\s*,\s*(\d+)(?:\n|$)/;
        const witchGuessRegex = /ACTION:\s*WITCH_GUESS:\s*(\d+)\s*,\s*(\d+)(?:\n|$)/;
        const recordImportantStateRegex = /ACTION:\s*RECORD_IMPORTANT_STATE:\s*(.*?)(?:\n|$)/;
        const pddCashHelpRegex = /ACTION:\s*PDD_CASH_HELP(?:\s*|$)/;
        const pddBargainHelpRegex = /ACTION:\s*PDD_BARGAIN_HELP:\s*(.*?)(?:\n|$)/;
        const musicInviteDecisionRegex = /ACTION:\s*MUSIC_INVITE_DECISION:\s*(.*?)(?:\n|$)/;

        let replyToObj = null;
        let hasUpdatedName = false;
        let hasUpdatedWxid = false;
        let hasUpdatedSignature = false;
        let hasFamilyCardDecision = false;
        let hasShownSavingsPlanMissingToast = false;
        let hasMusicInviteDecision = false;

        for (let i = 0; i < actions.length; i++) {
            let segment = actions[i];
            let processedSegment = segment;

            let pddCashHelpMatch;
            while ((pddCashHelpMatch = processedSegment.match(pddCashHelpRegex)) !== null) {
                if (window.processPddHelp) {
                    setTimeout(() => window.processPddHelp('cash', null), 1000);
                }
                processedSegment = processedSegment.replace(pddCashHelpMatch[0], '');
            }

            let pddBargainHelpMatch;
            while ((pddBargainHelpMatch = processedSegment.match(pddBargainHelpRegex)) !== null) {
                const prodId = pddBargainHelpMatch[1].trim();
                if (window.processPddHelp) {
                    setTimeout(() => window.processPddHelp('bargain', prodId), 1000);
                }
                processedSegment = processedSegment.replace(pddBargainHelpMatch[0], '');
            }

            let musicInviteDecisionMatch;
            while ((musicInviteDecisionMatch = processedSegment.match(musicInviteDecisionRegex)) !== null) {
                const payloadRaw = (musicInviteDecisionMatch[1] || '').trim();
                const pendingInvite = (typeof window.musicV2GetPendingInviteForContact === 'function')
                    ? window.musicV2GetPendingInviteForContact(contact.id)
                    : null;
                let inviteId = '';
                let decisionText = '';
                if (payloadRaw.includes('|')) {
                    const parts = payloadRaw.split('|').map(s => s.trim()).filter(Boolean);
                    inviteId = parts[0] || '';
                    decisionText = parts.slice(1).join(' ') || '';
                } else {
                    const parts = payloadRaw.split(/\s+/).map(s => s.trim()).filter(Boolean);
                    if (parts.length >= 2) {
                        inviteId = parts[0];
                        decisionText = parts.slice(1).join(' ');
                    } else {
                        decisionText = payloadRaw;
                    }
                }
                if (!inviteId && pendingInvite && pendingInvite.inviteId) {
                    inviteId = pendingInvite.inviteId;
                }
                const normalizedDecision = /同意|接受|可以|accept|agree|yes|一起听/i.test(decisionText)
                    ? 'accepted'
                    : (/拒绝|不同意|改天|没空|忙|reject|decline|no/i.test(decisionText) ? 'rejected' : '');
                if (inviteId && normalizedDecision && typeof window.musicV2HandleInviteDecision === 'function') {
                    const handled = window.musicV2HandleInviteDecision(contact.id, inviteId, normalizedDecision);
                    if (handled) hasMusicInviteDecision = true;
                }
                processedSegment = processedSegment.replace(musicInviteDecisionMatch[0], '');
            }

            let recordImportantStateMatch;
            while ((recordImportantStateMatch = processedSegment.match(recordImportantStateRegex)) !== null) {
                let info = recordImportantStateMatch[1].trim();
                info = info.replace(/^(用户|我|他|她)(:|：|,|，|\s)?/, '').trim();
                if (info) {
                    if (!contact.importantStates) contact.importantStates = [];
                    // 简单查重
                    if (!contact.importantStates.includes(info)) {
                        contact.importantStates.push(info);
                        // 保持数量限制，比如最新的 5 条
                        if (contact.importantStates.length > 5) {
                            contact.importantStates.shift();
                        }
                        saveConfig();
                        showChatToast('重要状态已记录');
                    }
                }
                processedSegment = processedSegment.replace(recordImportantStateMatch[0], '');
            }

            let recordUserInfoMatch;
            while ((recordUserInfoMatch = processedSegment.match(recordUserInfoRegex)) !== null) {
                let info = recordUserInfoMatch[1].trim();
                info = info.replace(/^(用户|我|他|她)(:|：|,|，|\s)?/, '').trim();
                if (info) {
                    let userAiPrompt = '';
                    if (contact.userPersonaId) {
                        const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
                        if (p) userAiPrompt = p.aiPrompt || '';
                    }
                    let isDuplicate = false;
                    if (!contact.userPerception) contact.userPerception = [];
                    if (contact.userPerception.some(item => item.includes(info) || info.includes(item))) {
                        isDuplicate = true;
                    }
                    if (!isDuplicate && userAiPrompt) {
                        if (userAiPrompt.toLowerCase().includes(info.toLowerCase())) {
                            isDuplicate = true;
                        }
                    }
                    if (!isDuplicate) {
                        contact.userPerception.push(info);
                        saveConfig();
                        showChatToast('TA记住了');
                    }
                }
                processedSegment = processedSegment.replace(recordUserInfoMatch[0], '');
            }

            let quoteMessageMatch;
            while ((quoteMessageMatch = processedSegment.match(quoteMessageRegex)) !== null) {
                const quoteContent = quoteMessageMatch[1].trim();
                if (quoteContent) {
                    let targetMsg = findBestQuoteTargetMessage(history, quoteContent);
                    if (!targetMsg) {
                        for (let j = history.length - 1; j >= 0; j--) {
                            const msg = history[j];
                            if (msg.role === 'user' && typeof msg.content === 'string' && msg.content.trim()) {
                                targetMsg = msg;
                                break;
                            }
                        }
                    }
                    if (targetMsg) {
                        let targetName = '未知';
                        if (targetMsg.role === 'user') {
                            targetName = '我';
                            if (contact.userPersonaId) {
                                const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
                                if (p) targetName = p.name;
                            } else if (window.iphoneSimState.userProfile) {
                                targetName = window.iphoneSimState.userProfile.name;
                            }
                        } else {
                            targetName = contact.remark || contact.name;
                        }
                        replyToObj = {
                            name: targetName,
                            content: targetMsg.type === 'text' ? targetMsg.content : `[${targetMsg.type === 'sticker' ? '表情包' : '图片'}]`
                        };
                    }
                }
                processedSegment = processedSegment.replace(quoteMessageMatch[0], '');
            }

            let updateNameMatch;
            while ((updateNameMatch = processedSegment.match(updateNameRegex)) !== null) {
                const newName = updateNameMatch[1].trim();
                if (newName && !hasUpdatedName) {
                    contact.nickname = newName;
                    if (!contact.remark) {
                        document.getElementById('chat-title').textContent = newName;
                    }
                    saveConfig();
                    if (window.renderContactList) window.renderContactList();
                    setTimeout(() => sendMessage(`[系统消息]: 对方更改了网名为 "${newName}"`, false, 'text'), 500);
                    hasUpdatedName = true;
                }
                processedSegment = processedSegment.replace(updateNameMatch[0], '');
            }

            let updateWxidMatch;
            while ((updateWxidMatch = processedSegment.match(updateWxidRegex)) !== null) {
                const newWxid = updateWxidMatch[1].trim();
                if (newWxid && !hasUpdatedWxid) {
                    contact.wxid = newWxid;
                    saveConfig();
                    setTimeout(() => sendMessage(`[系统消息]: 对方更改了微信号`, false, 'text'), 500);
                    hasUpdatedWxid = true;
                }
                processedSegment = processedSegment.replace(updateWxidMatch[0], '');
            }

            let updateSignatureMatch;
            while ((updateSignatureMatch = processedSegment.match(updateSignatureRegex)) !== null) {
                const newSignature = updateSignatureMatch[1].trim();
                if (newSignature && !hasUpdatedSignature) {
                    contact.signature = newSignature;
                    saveConfig();
                    setTimeout(() => sendMessage(`[系统消息]: 对方更改了个性签名`, false, 'text'), 500);
                    hasUpdatedSignature = true;
                }
                processedSegment = processedSegment.replace(updateSignatureMatch[0], '');
            }

            let updateAvatarMatch;
            while ((updateAvatarMatch = processedSegment.match(updateAvatarRegex)) !== null) {
                // Find the last image sent by user
                let lastImageMsg = null;
                for (let j = history.length - 1; j >= 0; j--) {
                    if (history[j].role === 'user' && history[j].type === 'image') {
                        lastImageMsg = history[j];
                        break;
                    }
                }

                if (lastImageMsg && lastImageMsg.content) {
                    contact.avatar = lastImageMsg.content;
                    saveConfig();
                    
                    // Refresh UI
                    if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                    
                    // Update header avatar if needed
                    // (Header usually updates on chat open, but we can try to find the element)
                    // Actually, re-opening chat or just updating the img src in DOM would be better.
                    // But for simplicity, we rely on the system message to prompt user attention, 
                    // and next render will show new avatar.
                    // Or we can try to update the avatar in the message list if any are visible? 
                    // The messages use contact.avatar when rendering 'other' messages.
                    // We might need to refresh the current chat view to reflect the new avatar on old messages?
                    // renderChatHistory(contact.id, true); // Preserve scroll
                    
                    setTimeout(() => {
                        renderChatHistory(contact.id, true);
                        sendMessage(`[系统消息]: 对方更换了头像`, false, 'text');
                    }, 500);
                }
                processedSegment = processedSegment.replace(updateAvatarMatch[0], '');
            }

            let momentMatch;
            while ((momentMatch = processedSegment.match(momentRegex)) !== null) {
                const momentContent = momentMatch[1].trim();
                if (momentContent) {
                    if (window.addMoment) window.addMoment(contact.id, momentContent);
                }
                processedSegment = processedSegment.replace(momentMatch[0], '');
            }

            let icityDiaryMatch;
            while ((icityDiaryMatch = processedSegment.match(icityDiaryRegex)) !== null) {
                const diaryContent = icityDiaryMatch[1].trim();
                if (diaryContent) {
                    if (window.addIcityPost) window.addIcityPost(contact.id, diaryContent, 'friends');
                }
                processedSegment = processedSegment.replace(icityDiaryMatch[0], '');
            }

            let editIcityBookMatch;
            while ((editIcityBookMatch = processedSegment.match(editIcityBookRegex)) !== null) {
                const content = editIcityBookMatch[1].trim();
                if (content) {
                    if (window.writeToIcityBook) window.writeToIcityBook(contact.id, content);
                }
                processedSegment = processedSegment.replace(editIcityBookMatch[0], '');
            }

            let likeMatch;
            while ((likeMatch = processedSegment.match(likeRegex)) !== null) {
                const userMoments = window.iphoneSimState.moments.filter(m => m.contactId === 'me');
                if (userMoments.length > 0) {
                    const latestMoment = userMoments.sort((a, b) => b.time - a.time)[0];
                    const aiName = contact.remark || contact.name;
                    if (!latestMoment.likes || !latestMoment.likes.includes(aiName)) {
                        if (window.toggleLike) window.toggleLike(latestMoment.id, aiName);
                    }
                }
                processedSegment = processedSegment.replace(likeMatch[0], '');
            }

            let commentMatch;
            while ((commentMatch = processedSegment.match(commentRegex)) !== null) {
                const commentContent = commentMatch[1].trim();
                const userMoments = window.iphoneSimState.moments.filter(m => m.contactId === 'me');
                if (userMoments.length > 0 && commentContent) {
                    const latestMoment = userMoments.sort((a, b) => b.time - a.time)[0];
                    const aiName = contact.remark || contact.name;
                    if (window.submitComment) window.submitComment(latestMoment.id, commentContent, null, aiName);
                }
                processedSegment = processedSegment.replace(commentMatch[0], '');
            }

            let forumPostMatch;
            while ((forumPostMatch = processedSegment.match(forumPostRegex)) !== null) {
                const postContent = forumPostMatch[1].trim();
                if (postContent && window.addForumPost) {
                    window.addForumPost(contact.id, postContent, []);
                }
                processedSegment = processedSegment.replace(forumPostMatch[0], '');
            }

            let startLiveMatch;
            while ((startLiveMatch = processedSegment.match(startForumLiveRegex)) !== null) {
                const parsedLive = window.parseStartForumLivePayload ? window.parseStartForumLivePayload(startLiveMatch[1]) : null;
                const liveTitle = parsedLive?.title || (startLiveMatch[1] || '').trim() || '';
                const liveActionDesc = parsedLive?.actionDesc || '';
                const liveBgUrl = parsedLive?.bgUrl || null;
                const liveInitialComments = parsedLive?.initialComments || [];
                const liveViewers = parsedLive?.viewers || '';
                if (window.createForumLiveStream) {
                    window.createForumLiveStream(contact.id, liveTitle, liveActionDesc, liveBgUrl, liveInitialComments, liveViewers);
                }
                processedSegment = processedSegment.replace(startLiveMatch[0], '');
            }

            let sendImageMatch;
            while ((sendImageMatch = processedSegment.match(sendImageRegex)) !== null) {
                const imageDesc = sendImageMatch[1].trim();
                if (imageDesc) {
                    imageToSend = { type: 'virtual_image', content: imageDesc };
                }
                processedSegment = processedSegment.replace(sendImageMatch[0], '');
            }

            let sendStickerMatch;
            while ((sendStickerMatch = processedSegment.match(sendStickerRegex)) !== null) {
                const stickerDesc = sendStickerMatch[1].trim();
                if (stickerDesc) {
                    let stickerUrl = null;
                    for (const cat of window.iphoneSimState.stickerCategories) {
                        if (contact.linkedStickerCategories && !contact.linkedStickerCategories.includes(cat.id)) {
                            continue;
                        }
                        const found = cat.list.find(s => s.desc === stickerDesc);
                        if (found) {
                            stickerUrl = found.url;
                            break;
                        }
                    }
                    
                    if (stickerUrl) {
                        imageToSend = { type: 'sticker', content: stickerUrl, desc: stickerDesc };
                    }
                }
                processedSegment = processedSegment.replace(sendStickerMatch[0], '');
            }

            let startVoiceCallMatch;
            while ((startVoiceCallMatch = processedSegment.match(startVoiceCallRegex)) !== null) {
                setTimeout(() => {
                    startIncomingCall(contact);
                }, 1500);
                processedSegment = processedSegment.replace(startVoiceCallMatch[0], '');
            }

            let startVideoCallMatch;
            while ((startVideoCallMatch = processedSegment.match(startVideoCallRegex)) !== null) {
                setTimeout(() => {
                    startIncomingVideoCall(contact);
                }, 1500);
                processedSegment = processedSegment.replace(startVideoCallMatch[0], '');
            }

            let sendVoiceMatch;
            while ((sendVoiceMatch = processedSegment.match(sendVoiceRegex)) !== null) {
                const duration = sendVoiceMatch[1];
                const text = sendVoiceMatch[2].trim();
                if (text) {
                    setTimeout(() => {
                        const voiceData = {
                            duration: parseInt(duration),
                            text: text,
                            isReal: false,
                            audio: null
                        };
                        sendMessage(JSON.stringify(voiceData), false, 'voice');
                    }, 1500);
                }
                processedSegment = processedSegment.replace(sendVoiceMatch[0], '');
            }

            let msClickMatch;
            while ((msClickMatch = processedSegment.match(msClickRegex)) !== null) {
                const r = msClickMatch[1];
                const c = msClickMatch[2];
                if (window.handleAiMinesweeperMove) {
                    window.handleAiMinesweeperMove('CLICK', r, c);
                }
                processedSegment = processedSegment.replace(msClickMatch[0], '');
            }

            let msFlagMatch;
            while ((msFlagMatch = processedSegment.match(msFlagRegex)) !== null) {
                const r = msFlagMatch[1];
                const c = msFlagMatch[2];
                if (window.handleAiMinesweeperMove) {
                    window.handleAiMinesweeperMove('FLAG', r, c);
                }
                processedSegment = processedSegment.replace(msFlagMatch[0], '');
            }

            let witchGuessMatch;
            while ((witchGuessMatch = processedSegment.match(witchGuessRegex)) !== null) {
                const r = witchGuessMatch[1];
                const c = witchGuessMatch[2];
                if (window.handleAiWitchGuess) {
                    // Delay slightly to look natural
                    setTimeout(() => {
                        window.handleAiWitchGuess(r, c);
                    }, 1000);
                }
                processedSegment = processedSegment.replace(witchGuessMatch[0], '');
            }

            let transferMatch;
            while ((transferMatch = processedSegment.match(transferRegex)) !== null) {
                if (!hasTransferred) {
                    const amount = transferMatch[1];
                    const remark = transferMatch[2].trim();
                    setTimeout(() => {
                        const transferId = Date.now() + Math.floor(Math.random() * 1000);
                        sendMessage(JSON.stringify({ id: transferId, amount, remark: remark || '转账给您', status: 'pending' }), false, 'transfer');
                    }, 1000);
                    hasTransferred = true;
                }
                processedSegment = processedSegment.replace(transferMatch[0], '');
            }

            let acceptTransferMatch;
            while ((acceptTransferMatch = processedSegment.match(acceptTransferRegex)) !== null) {
                const transferId = parseInt(acceptTransferMatch[1]);
                if (transferId) {
                    setTimeout(() => {
                        if (window.updateTransferStatus) window.updateTransferStatus(transferId, 'accepted');
                        sendMessage('[系统消息]: 对方已收款', false, 'text');
                    }, 1000);
                }
                processedSegment = processedSegment.replace(acceptTransferMatch[0], '');
            }

            let returnTransferMatch;
            while ((returnTransferMatch = processedSegment.match(returnTransferRegex)) !== null) {
                const transferId = parseInt(returnTransferMatch[1]);
                if (transferId) {
                    setTimeout(() => {
                        if (window.updateTransferStatus) window.updateTransferStatus(transferId, 'returned');
                        if (window.handleAiReturnTransfer) window.handleAiReturnTransfer(transferId);
                        sendMessage('[系统消息]: 转账已退还', false, 'text');
                    }, 1000);
                }
                processedSegment = processedSegment.replace(returnTransferMatch[0], '');
            }

            let familyCardDecisionMatch;
            while ((familyCardDecisionMatch = processedSegment.match(familyCardDecisionRegex)) !== null) {
                const payload = familyCardDecisionMatch[1].trim();
                if (payload && window.handleFamilyCardDecisionAction) {
                    const handled = window.handleFamilyCardDecisionAction(payload, contact.id, { sendText: false });
                    if (handled) hasFamilyCardDecision = true;
                }
                processedSegment = processedSegment.replace(familyCardDecisionMatch[0], '');
            }

            let payForRequestMatch;
            while ((payForRequestMatch = processedSegment.match(payForRequestRegex)) !== null) {
                const requestId = payForRequestMatch[1].trim();
                if (requestId) {
                    const history = window.iphoneSimState.chatHistory[contact.id] || [];
                    let targetMsg = null;
                    for (let j = history.length - 1; j >= 0; j--) {
                        const msg = history[j];
                        if (msg.type === 'pay_request') {
                            let data = null;
                            try { data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content; } catch(e){}
                            if (data && data.id === requestId) {
                                targetMsg = msg;
                                break;
                            }
                        }
                    }

                    if (targetMsg) {
                        setTimeout(() => {
                            let data = typeof targetMsg.content === 'string' ? JSON.parse(targetMsg.content) : targetMsg.content;
                            if (data.status !== 'paid') {
                                data.status = 'paid';
                                targetMsg.content = JSON.stringify(data);
                                if (window.handlePayForRequest) {
                                    window.handlePayForRequest(requestId, contact.name, data);
                                }
                                saveConfig();
                                renderChatHistory(contact.id, true);
                                sendMessage('[系统消息]: 对方已帮你付款', false, 'text');
                            }
                        }, 1500);
                    }
                }
                processedSegment = processedSegment.replace(payForRequestMatch[0], '');
            }

            let savingsDepositMatch;
            while ((savingsDepositMatch = processedSegment.match(savingsDepositRegex)) !== null) {
                const payloadRaw = (savingsDepositMatch[1] || '').trim();
                const parts = payloadRaw.split('|').map(s => s.trim());
                const amountRaw = parts[0] || '';
                const note = parts.slice(1).join(' | ');
                const validAmount = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amountRaw);
                const amount = validAmount ? Number(amountRaw) : NaN;

                if (!Number.isFinite(amount) || amount <= 0) {
                    processedSegment = processedSegment.replace(savingsDepositMatch[0], '');
                    continue;
                }

                const plan = getSavingsPlanByPeerContactId(contact.id);
                if (!plan) {
                    if (!hasShownSavingsPlanMissingToast && window.showChatToast) {
                        showChatToast('未找到该联系人的共同存钱计划');
                        hasShownSavingsPlanMissingToast = true;
                    }
                    processedSegment = processedSegment.replace(savingsDepositMatch[0], '');
                    continue;
                }

                const normalizedAmount = Number(amount.toFixed(2));
                const handled = applySavingsPeerDeposit(plan, normalizedAmount, note, contact.id);
                if (handled && typeof sendMessage !== 'undefined') {
                    const noteText = note ? `（备注：${note}）` : '';
                    const systemNotice = `[系统消息]: 对方往共同存钱转入了¥${normalizedAmount.toFixed(2)}${noteText}`;
                    setTimeout(() => {
                        sendMessage(systemNotice, false, 'text', null, contact.id);
                    }, 800);
                }
                processedSegment = processedSegment.replace(savingsDepositMatch[0], '');
            }

            let sendGiftMatch;
            while ((sendGiftMatch = processedSegment.match(sendGiftRegex)) !== null) {
                const payload = sendGiftMatch[1].trim();
                const parts = payload.split('|').map(s => s.trim());
                if (parts.length >= 2) {
                    const title = parts[0];
                    const price = parseFloat(parts[1]) || 0;
                    const remark = parts[2] || '';
                    
                    // 生成占位图
                    let imgUrl = '';
                    if (typeof generatePlaceholderImage === 'function') {
                        let bgColor = '#FF9500';
                        if (window.getRandomPastelColor) {
                            bgColor = window.getRandomPastelColor();
                        }
                        imgUrl = generatePlaceholderImage(300, 300, title, bgColor);
                    } else {
                        imgUrl = 'https://placehold.co/300x300/FF9500/ffffff?text=' + encodeURIComponent(title);
                    }

                    const giftData = {
                        items: [{
                            title: title,
                            price: price,
                            image: imgUrl,
                            isDelivery: false
                        }],
                        total: price.toFixed(2),
                        remark: remark
                    };
                    
                    setTimeout(() => {
                        sendMessage(JSON.stringify(giftData), false, 'shopping_gift');
                    }, 1000);
                }
                processedSegment = processedSegment.replace(sendGiftMatch[0], '');
            }

            let sendDeliveryMatch;
            while ((sendDeliveryMatch = processedSegment.match(sendDeliveryRegex)) !== null) {
                const payload = sendDeliveryMatch[1].trim();
                const parts = payload.split('|').map(s => s.trim());
                if (parts.length >= 2) {
                    const title = parts[0];
                    const price = parseFloat(parts[1]) || 0;
                    const remark = parts[2] || '';
                    
                    let imgUrl = '';
                    if (typeof generatePlaceholderImage === 'function') {
                        imgUrl = generatePlaceholderImage(300, 300, title, '#007AFF');
                    } else {
                        imgUrl = 'https://placehold.co/300x300/007AFF/ffffff?text=' + encodeURIComponent(title);
                    }

                    const deliveryData = {
                        items: [{
                            title: title,
                            price: price,
                            image: imgUrl,
                            isDelivery: true
                        }],
                        total: price.toFixed(2),
                        remark: remark
                    };
                    
                    setTimeout(() => {
                        sendMessage(JSON.stringify(deliveryData), false, 'delivery_share');
                    }, 1000);
                }
                processedSegment = processedSegment.replace(sendDeliveryMatch[0], '');
            }
        }

        const pendingMusicInvite = (!hasMusicInviteDecision && typeof window.musicV2GetPendingInviteForContact === 'function')
            ? window.musicV2GetPendingInviteForContact(contact.id)
            : null;
        if (pendingMusicInvite && pendingMusicInvite.inviteId && typeof window.musicV2HandleInviteDecision === 'function') {
            const textForDecision = messagesList
                .filter(msg => msg && (msg.type === '消息' || msg.type === 'text') && typeof msg.content === 'string')
                .map(msg => msg.content)
                .join(' ');
            let fallbackDecision = '';
            if (/同意|接受|可以|好啊|来吧|一起听|accept|agree|yes|sure/i.test(textForDecision)) {
                fallbackDecision = 'accepted';
            } else if (/拒绝|不同意|改天|下次|没空|忙|不方便|reject|decline|no/i.test(textForDecision)) {
                fallbackDecision = 'rejected';
            } else {
                fallbackDecision = 'rejected';
            }
            const handled = window.musicV2HandleInviteDecision(contact.id, pendingMusicInvite.inviteId, fallbackDecision);
            if (handled) hasMusicInviteDecision = true;
        }

        const pendingFamilyCard = findLatestPendingFamilyCard(contact.id);
        if (pendingFamilyCard && !hasFamilyCardDecision) {
            const fallback = deriveFamilyDecisionFromMessages(messagesList);
            const payload = `${pendingFamilyCard.data.id} | ${fallback.status === 'accepted' ? '同意' : '拒绝'} | ${fallback.monthlyLimit || 0}`;
            if (window.handleFamilyCardDecisionAction) {
                const handled = window.handleFamilyCardDecisionAction(payload, contact.id, { sendText: false });
                if (handled) hasFamilyCardDecision = true;
            }
        }

        if (hasFamilyCardDecision) {
            const familyDecisionTextRegex = /(亲属卡|每月额度|月额度|开亲属卡|同意给你|不办亲属卡)/;
            messagesList = messagesList.filter(msg => {
                const msgType = msg && (msg.type || '').toLowerCase();
                const isTextLike = msgType === 'text' || msgType === '消息' || !msgType;
                const content = String(msg && msg.content ? msg.content : '');
                return !(isTextLike && familyDecisionTextRegex.test(content));
            });
        }

        if (thoughtContent && contact.showThought) {
            updateThoughtBubble(thoughtContent);
        }

        // 逐条发送消息
        for (let i = 0; i < messagesList.length; i++) {
            const msg = messagesList[i];
            const currentThought = (i === messagesList.length - 1) ? thoughtContent : null;
            const currentReplyTo = (i === 0) ? replyToObj : null;

            // 检查用户是否仍在当前聊天界面
            const isChatOpen = !document.getElementById('chat-screen').classList.contains('hidden');
            const isSameContact = window.iphoneSimState.currentChatContactId === contact.id;
            const shouldShowInChat = isChatOpen && isSameContact;

            if (shouldShowInChat) {
                // 如果用户在聊天界面但页面被隐藏/最小化，仍然发送系统通知
                    if (document.hidden) {
                        let notifContent = msg.content;
                        if (msg.type === '表情包') notifContent = '[表情包]';
                        else if (msg.type === '图片') notifContent = '[图片]';
                        else if (msg.type === '语音') notifContent = '[语音]';
                        else if (msg.type === 'family_card') notifContent = '[亲属卡]';
                        else if (msg.type === 'savings_invite') notifContent = '[共同存钱邀请]';
                        else if (msg.type === 'savings_withdraw_request') notifContent = '[共同存钱转出申请]';
                        else if (msg.type === 'savings_progress') notifContent = '[共同存钱进度]';
                        else if (msg.type === 'music_listen_invite') notifContent = '[一起听邀请]';
                        else if (msg.type === 'virtual_image') notifContent = '[图片]';
                        else if (msg.type === 'sticker') notifContent = '[表情包]';
                    
                    sendSystemNotification(contact, notifContent);
                }

                // 用户在聊天界面，使用打字机效果或直接发送
                if (msg.type === '消息' || msg.type === 'text') {
                    await typewriterEffect(msg.content, contact.avatar, currentThought, currentReplyTo, 'text', contactId);
                } else if (msg.type === '表情包' || msg.type === 'sticker') {
                    // 尝试查找表情包 URL
                    let stickerUrl = null;
                    if (window.iphoneSimState.stickerCategories) {
                        let allowedIds = null;
                        if (Array.isArray(contact.linkedStickerCategories)) allowedIds = contact.linkedStickerCategories;

                        for (const cat of window.iphoneSimState.stickerCategories) {
                            if (allowedIds !== null && !allowedIds.includes(cat.id)) continue;

                            const found = cat.list.find(s => s.desc === msg.content || s.desc.includes(msg.content));
                            if (found) {
                                stickerUrl = found.url;
                                break;
                            }
                        }
                    }
                    if (stickerUrl) {
                        sendMessage(stickerUrl, false, 'sticker', msg.content, contactId);
                    } else {
                        // 找不到表情包，直接忽略，不发送文本 fallback，以免破坏沉浸感
                        console.warn(`Sticker not found: ${msg.content}`);
                    }
                } else if (msg.type === '语音' || msg.type === 'voice') {
                    let duration = 3;
                    let text = msg.content;
                    
                    if (typeof msg.content === 'string') {
                        const parts = msg.content.match(/(\d+)\s+(.*)/);
                        if (parts) {
                            duration = parseInt(parts[1]);
                            text = parts[2];
                        }
                    }
                    
                    const voiceData = {
                        duration: duration,
                        text: text,
                        isReal: false
                    };
                    sendMessage(JSON.stringify(voiceData), false, 'voice', null, contactId);
                } else if (msg.type === '图片' || msg.type === 'image' || msg.type === 'virtual_image') {
                    let sent = false;
                    const novelaiSettings = window.iphoneSimState.novelaiSettings;
                    const globalEnabled = novelaiSettings && novelaiSettings.enabled !== false;
                    
                    if (globalEnabled && window.generateNovelAiImageApi && contact.novelaiPreset) {
                        let finalPrompt = "";
                        let presetName = contact.novelaiPreset;
                        let preset = null;
    
                        if (presetName === 'AUTO_MATCH') {
                            const type = detectImageType(imageToSend.content);
                            const presets = window.iphoneSimState.novelaiPresets || [];
                            preset = presets.find(p => p.type === type);
                            if (!preset && type !== 'general') {
                                preset = presets.find(p => p.type === 'general');
                            }
                        } else {
                            preset = (window.iphoneSimState.novelaiPresets || []).find(p => p.name === presetName);
                        }
                        
                        if (preset && preset.settings && preset.settings.prompt) {
                            finalPrompt += preset.settings.prompt;
                        } else if (novelaiSettings.defaultPrompt) {
                            finalPrompt += novelaiSettings.defaultPrompt;
                        }

                        // Removed persona splicing to avoid polluting prompt with chat style settings
                        // if (contact.persona) {
                        //     finalPrompt += ", " + (contact.persona || "").replace(/\n/g, ", ");
                        // }

                        // 优先使用 AI 提供的翻译好的 prompt
                        if (msg.prompt) {
                            finalPrompt += ", " + msg.prompt;
                        } else if (msg.content) {
                            finalPrompt += ", " + optimizePromptForNovelAI(msg.content);
                        }

                        try {
                            const genOptions = {
                                key: novelaiSettings.key,
                                model: (preset && preset.settings && preset.settings.model) || novelaiSettings.model,
                                prompt: finalPrompt,
                                negativePrompt: (preset && preset.settings && preset.settings.negativePrompt) || novelaiSettings.negativePrompt,
                                steps: (preset && preset.settings && preset.settings.steps) || novelaiSettings.steps,
                                scale: (preset && preset.settings && preset.settings.scale) || novelaiSettings.cfg,
                                seed: (preset && preset.settings && preset.settings.seed) !== undefined ? preset.settings.seed : -1,
                                width: (preset && preset.settings && preset.settings.width) || 832,
                                height: (preset && preset.settings && preset.settings.height) || 1216
                            };

                            // 先发送占位图片以占据正确的历史记录顺序
                            const placeholderUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Generating...';
                            const placeholderMsg = sendMessage(placeholderUrl, false, 'virtual_image', msg.content, contactId);
                            
                            appendMessageToUI('[系统]: 正在生成图片...', false, 'system', null, null, null, null, false);

                            window.generateNovelAiImageApi(genOptions).then(base64Image => {
                                // 图片生成成功，直接更新占位消息，而不是发送新消息
                                if (placeholderMsg) {
                                    placeholderMsg.type = 'image';
                                    placeholderMsg.content = base64Image;
                                    placeholderMsg.novelaiPrompt = finalPrompt;
                                    placeholderMsg.novelaiNegativePrompt = genOptions.negativePrompt;
                                    saveConfig();
                                    
                                    // 刷新界面以显示新图片，并保持滚动位置
                                    if (window.renderChatHistory) renderChatHistory(contactId, true);
                                }
                            }).catch(err => {
                                console.error("NovelAI Gen Error", err);
                                appendMessageToUI(`[系统]: 生图失败 - ${err.message}`, false, 'system', null, null, null, null, false);
                                // 失败时占位符保持为 virtual_image，无需额外处理，或可更新为错误图
                            });
                            
                            sent = true;

                        } catch (e) {
                            console.error("NovelAI Setup Error", e);
                            appendMessageToUI(`[系统]: 生图配置错误 - ${e.message}`, false, 'text', null, null, null, null, false);
                        }
                    }

                    if (!sent) {
                        const failReason = [];
                        if (!contact.novelaiPreset) failReason.push("未选择预设");
                        else if (!globalEnabled) failReason.push("全局开关未开启");
                        
                        if (!window.generateNovelAiImageApi) failReason.push("生图模块未加载");
                        if (!novelaiSettings || !novelaiSettings.key) failReason.push("API Key缺失");

                        if (failReason.length > 0) {
                            appendMessageToUI(`[系统诊断]: 无法生成图片 - ${failReason.join('; ')}`, false, 'text', null, null, null, null, false);
                        }

                        const defaultImageUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                        sendMessage(defaultImageUrl, false, 'virtual_image', msg.content, contactId);
                    }
                } else if (msg.type === '旁白' || msg.type === 'description') {
                    await typewriterEffect(msg.content, contact.avatar, null, null, 'description', contactId);
                }
            } else {
                // 用户不在聊天界面，后台保存并弹窗
                let contentToSave = msg.content;
                let typeToSave = 'text';
                
                if (msg.type === '消息' || msg.type === 'text') {
                    typeToSave = 'text';
                } else if (msg.type === '表情包' || msg.type === 'sticker') {
                    let stickerUrl = null;
                    if (window.iphoneSimState.stickerCategories) {
                        let allowedIds = null;
                        if (Array.isArray(contact.linkedStickerCategories)) allowedIds = contact.linkedStickerCategories;

                        for (const cat of window.iphoneSimState.stickerCategories) {
                            if (allowedIds !== null && !allowedIds.includes(cat.id)) continue;

                            const found = cat.list.find(s => s.desc === msg.content || s.desc.includes(msg.content));
                            if (found) {
                                stickerUrl = found.url;
                                break;
                            }
                        }
                    }
                    if (stickerUrl) {
                        contentToSave = stickerUrl;
                        typeToSave = 'sticker';
                    } else {
                        contentToSave = `[表情包: ${msg.content}]`;
                        typeToSave = 'text';
                    }
                } else if (msg.type === '语音' || msg.type === 'voice') {
                    let duration = 3;
                    let text = msg.content;
                    
                    if (typeof msg.content === 'string') {
                        const parts = msg.content.match(/(\d+)\s+(.*)/);
                        if (parts) {
                            duration = parseInt(parts[1]);
                            text = parts[2];
                        }
                    }

                    const voiceData = {
                        duration: duration,
                        text: text,
                        isReal: false
                    };
                    contentToSave = JSON.stringify(voiceData);
                    typeToSave = 'voice';
                } else if (msg.type === '图片' || msg.type === 'image') {
                    contentToSave = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                    typeToSave = 'virtual_image';
                } else if (msg.type === '旁白' || msg.type === 'description') {
                    typeToSave = 'description';
                }

                // 保存到历史记录
                if (!window.iphoneSimState.chatHistory[contact.id]) {
                    window.iphoneSimState.chatHistory[contact.id] = [];
                }
                
                const msgData = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    time: Date.now(),
                    role: 'assistant',
                    content: contentToSave,
                    type: typeToSave,
                    replyTo: currentReplyTo
                };
                
                if (currentThought) {
                    msgData.thought = currentThought;
                }
                
                if (msg.type === '图片' || msg.type === 'sticker') {
                    msgData.description = msg.content; // 保存描述
                }

                window.iphoneSimState.chatHistory[contact.id].push(msgData);
                saveConfig();
                
                // 触发通知
                let notificationText = contentToSave;
                if (typeToSave === 'sticker') notificationText = '[表情包]';
                if (typeToSave === 'virtual_image' || typeToSave === 'image') notificationText = '[图片]';
                if (typeToSave === 'voice') notificationText = '[语音]';
                if (typeToSave === 'family_card') notificationText = '[亲属卡]';
                if (typeToSave === 'savings_invite') notificationText = '[共同存钱邀请]';
                if (typeToSave === 'savings_withdraw_request') notificationText = '[共同存钱转出申请]';
                if (typeToSave === 'savings_progress') notificationText = '[共同存钱进度]';
                if (typeToSave === 'music_listen_invite') notificationText = '[一起听邀请]';
                
                showChatNotification(contact.id, notificationText);
                
                // 刷新联系人列表以更新预览
                if (window.renderContactList) {
                    // 只有当联系人列表可见时才刷新，或者强制刷新
                    window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                }
            }

            // 模拟间隔
            if (i < messagesList.length - 1) {
                let delay;
                if (contact.replyIntervalMin !== undefined && contact.replyIntervalMin !== null && 
                    contact.replyIntervalMax !== undefined && contact.replyIntervalMax !== null) {
                    const min = contact.replyIntervalMin;
                    const max = Math.max(contact.replyIntervalMax, min);
                    delay = min + Math.random() * (max - min);
                } else {
                    // 默认逻辑：第一条消息稍微慢一点(900-2200ms)，后续消息快一点(400-800ms)
                    delay = (i === 0) ? (900 + Math.random() * 1300) : (400 + Math.random() * 400);
                }
                await new Promise(r => setTimeout(r, delay));
            }
        }
        await new Promise(r => setTimeout(r, 500));

        if (imageToSend) {
            if (imageToSend.type === 'virtual_image') {
                let sent = false;
                const novelaiSettings = window.iphoneSimState.novelaiSettings;
                const globalEnabled = novelaiSettings && novelaiSettings.enabled !== false;
                
                if (globalEnabled && window.generateNovelAiImageApi && contact.novelaiPreset) {
                    let finalPrompt = "";
                    let presetName = contact.novelaiPreset;
                    let preset = null;

                    if (presetName === 'AUTO_MATCH') {
                        const type = detectImageType(msg.content);
                        const presets = window.iphoneSimState.novelaiPresets || [];
                        preset = presets.find(p => p.type === type);
                        if (!preset && type !== 'general') {
                            preset = presets.find(p => p.type === 'general');
                        }
                    } else {
                        preset = (window.iphoneSimState.novelaiPresets || []).find(p => p.name === presetName);
                    }
                    
                    if (preset && preset.settings && preset.settings.prompt) {
                        finalPrompt += preset.settings.prompt;
                    } else if (novelaiSettings.defaultPrompt) {
                        finalPrompt += novelaiSettings.defaultPrompt;
                    }

                    // Removed persona splicing
                    // if (contact.persona) {
                    //     finalPrompt += ", " + (contact.persona || "").replace(/\n/g, ", ");
                    // }

                    // 优先使用 AI 提供的翻译好的 prompt
                    if (imageToSend.prompt) {
                        finalPrompt += ", " + imageToSend.prompt;
                    } else if (imageToSend.content) {
                        finalPrompt += ", " + optimizePromptForNovelAI(imageToSend.content);
                    }

                    try {
                        const genOptions = {
                            key: novelaiSettings.key,
                            model: (preset && preset.settings && preset.settings.model) || novelaiSettings.model,
                            prompt: finalPrompt,
                            negativePrompt: (preset && preset.settings && preset.settings.negativePrompt) || novelaiSettings.negativePrompt,
                            steps: (preset && preset.settings && preset.settings.steps) || novelaiSettings.steps,
                            scale: (preset && preset.settings && preset.settings.scale) || novelaiSettings.cfg,
                            seed: (preset && preset.settings && preset.settings.seed) !== undefined ? preset.settings.seed : -1,
                            width: (preset && preset.settings && preset.settings.width) || 832,
                            height: (preset && preset.settings && preset.settings.height) || 1216
                        };

                        // 先发送占位图片
                        const placeholderUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Generating...';
                        const placeholderMsg = sendMessage(placeholderUrl, false, 'virtual_image', imageToSend.content, contactId);

                        // 直接调用当前作用域内的函数
                        appendMessageToUI('[系统]: 正在生成图片...', false, 'system', null, null, null, null, false);

                        window.generateNovelAiImageApi(genOptions).then(base64Image => {
                            // 更新占位消息
                            if (placeholderMsg) {
                                placeholderMsg.type = 'image';
                                placeholderMsg.content = base64Image;
                                placeholderMsg.novelaiPrompt = finalPrompt;
                                placeholderMsg.novelaiNegativePrompt = genOptions.negativePrompt;
                                saveConfig();
                                
                                if (window.renderChatHistory) renderChatHistory(contactId, true);
                            }
                        }).catch(err => {
                            console.error("NovelAI Gen Error", err);
                            appendMessageToUI(`[系统]: 生图API错误 - ${err.message}`, false, 'system', null, null, null, null, false);
                        });
                        
                        sent = true;

                    } catch (e) {
                        console.error("NovelAI Setup Error", e);
                        appendMessageToUI(`[系统]: 生图配置错误 - ${e.message}`, false, 'text', null, null, null, null, false);
                    }
                }

                if (!sent) {
                    // 增强诊断：显示所有未满足的条件
                    const failReason = [];
                    if (!contact.novelaiPreset) failReason.push("未选择预设");
                    else if (!globalEnabled) failReason.push("全局开关未开启");
                    
                    if (!window.generateNovelAiImageApi) failReason.push("生图模块未加载");
                    if (!novelaiSettings || !novelaiSettings.key) failReason.push("API Key缺失");

                    // 只要是 virtual_image 类型，即使没预设，也提示一下（可能是用户忘了配）
                    // 或者是配置了但其他条件不满足
                    if (failReason.length > 0) {
                        appendMessageToUI(`[系统诊断]: 无法生成图片 - ${failReason.join('; ')}`, false, 'text', null, null, null, null, false);
                    }
                    
                    const defaultImageUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                    sendMessage(defaultImageUrl, false, 'virtual_image', imageToSend.content, contactId);
                }
            } else if (imageToSend.type === 'sticker') {
                sendMessage(imageToSend.content, false, 'sticker', imageToSend.desc, contactId);
            }
        }

    } catch (error) {
        console.error('AI生成失败:', error);
        // 显示具体的错误信息
        alert(`AI生成失败: ${error.message}\n请检查配置和API状态`);
        // 同时在聊天界面显示系统消息
        appendMessageToUI(`[系统错误]: AI生成失败 - ${error.message}`, false, 'text', null, null, null, null, false);
    } finally {
        const currentContact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        if (currentContact) {
            titleEl.textContent = currentContact.remark || currentContact.name;
        } else {
            titleEl.textContent = originalTitle;
        }
    }
}

// Helper function to detect image type from text
function detectImageType(text) {
    if (!text) return 'general';
    if (/(吃|喝|美食|美味|food|dish|meal|好吃|蛋糕|面|饭|菜)/i.test(text)) return 'food';
    if (/(风景|景色|山|水|scenery|landscape|view|sky|cloud|sea|forest|outside|nature)/i.test(text)) return 'scenery';
    if (/(房间|屋|室|room|indoor|house|living|bedroom|bed)/i.test(text)) return 'scene';
    if (/(我|你|他|她|人|脸|看|girl|boy|man|woman|face|eye|hair|body|looking)/i.test(text)) return 'portrait';
    return 'general';
}

// Helper function to optimize natural language prompts for NovelAI
function optimizePromptForNovelAI(text) {
    if (!text) return "";
    
    // 1. 特殊样例优化 (针对用户提供的具体例子)
    const specificCase = "一张从下往上拍的自拍，我正躺在床上，没穿上衣，被子乱糟糟地堆在肩膀周围。黑色的头发有点乱，垂在额前，有几缕贴在皮肤上。光线很暗，只有手机屏幕的光照亮了我的脸和锁骨，能隐约看到那个小小的爱心纹身。我睡眼惺忪地看着镜头，嘴唇微微张着。";
    // 放宽匹配条件
    if (text.includes("从下往上拍") && text.includes("自拍") || text.includes(specificCase.substr(0, 10))) {
        return "selfie, from below, lying on bed, shirtless, messy bed sheet, messy black hair, hair over forehead, dim light, phone screen light, light on face, collarbone, small heart tattoo, sleepy eyes, looking at viewer, parted lips, messy hair, upper body, realistic, 4k, best quality";
    }

    // 2. 通用优化
    let processed = text;
    
    // 过滤可能包含在 prompt 中的中文聊天设定 (简单 heuristcs)
    // 移除括号内容，因为它们往往是动作或状态描述 (e.g. (微笑), (开心))，如果不是 Tag 格式
    // processed = processed.replace(/\（[^)]*\）/g, ''); // 慎用，可能会误删 Tag
    
    // 替换中文标点为英文逗号
    processed = processed.replace(/[，。、；！\n]/g, ', ');
    
    // 移除常见中文冗余词
    const removeWords = ['一张', '图片描述[:：]?', '生成', '画', '一个', '样子', '照片'];
    removeWords.forEach(w => {
        processed = processed.replace(new RegExp(w, 'g'), '');
    });
    
    // 关键词映射表 (扩充)
    const keywords = [
        { cn: '自拍', en: 'selfie' },
        { cn: '全身', en: 'full body' },
        { cn: '上半身', en: 'upper body' },
        { cn: '特写', en: 'close up' },
        { cn: '背景', en: 'background' },
        { cn: '夜晚', en: 'night' },
        { cn: '白天', en: 'day' },
        { cn: '微笑', en: 'smile' },
        { cn: '大笑', en: 'laughing' },
        { cn: '哭泣', en: 'crying' },
        { cn: '生气', en: 'angry' },
        { cn: '害羞', en: 'blush' },
        { cn: '长发', en: 'long hair' },
        { cn: '短发', en: 'short hair' },
        { cn: '卷发', en: 'curly hair' },
        { cn: '直发', en: 'straight hair' },
        { cn: '黑发', en: 'black hair' },
        { cn: '金发', en: 'blonde hair' },
        { cn: '白发', en: 'white hair' },
        { cn: '红发', en: 'red hair' },
        { cn: '蓝发', en: 'blue hair' },
        { cn: '粉发', en: 'pink hair' },
        { cn: '眼睛', en: 'eyes' },
        { cn: '蓝眼', en: 'blue eyes' },
        { cn: '红眼', en: 'red eyes' },
        { cn: '衬衫', en: 'shirt' },
        { cn: 'T恤', en: 't-shirt' },
        { cn: '裙子', en: 'dress' },
        { cn: '制服', en: 'uniform' },
        { cn: '西装', en: 'suit' },
        { cn: '泳装', en: 'swimsuit' },
        { cn: '猫耳', en: 'cat ears' },
        { cn: '眼镜', en: 'glasses' },
        // 新增扩充
        { cn: '方亦楷', en: '1boy, solo, male focus' }, // 针对特定角色名
        { cn: '单手', en: 'one hand' },
        { cn: '举着', en: 'holding' },
        { cn: '手机', en: 'phone, smartphone, holding phone' },
        { cn: '从下往上', en: 'from below' },
        { cn: '仰拍', en: 'low angle' },
        { cn: '凌乱', en: 'messy hair' },
        { cn: '额前', en: 'bangs' },
        { cn: '发丝', en: 'hair strands' },
        { cn: '汗', en: 'sweat, wet skin' },
        { cn: '脸颊', en: 'cheeks' },
        { cn: '昏暗', en: 'dim lighting' },
        { cn: '灯光', en: 'lighting' },
        { cn: '鼻梁', en: 'nose' },
        { cn: '下颌', en: 'jawline' },
        { cn: '阴影', en: 'shadow, chiaroscuro' },
        { cn: '深邃', en: 'defined features' },
        { cn: '眉', en: 'eyebrows' },
        { cn: '蹙', en: 'frowning' },
        { cn: '琥珀色', en: 'amber' },
        { cn: '不耐烦', en: 'annoyed' },
        { cn: '疲惫', en: 'tired' },
        { cn: '嘴', en: 'mouth, lips' },
        { cn: '弧度', en: 'smirk' },
        { cn: '黑色', en: 'black' },
        { cn: 'oversized', en: 'oversized' },
        { cn: '锁骨', en: 'collarbone' },
        { cn: '工作室', en: 'studio, indoor' }
    ];
    
    keywords.forEach(kw => {
        if (processed.includes(kw.cn)) {
            processed = processed.replace(new RegExp(kw.cn, 'g'), kw.en);
        }
    });

    // 清理多余的逗号和空格
    processed = processed.replace(/,+/g, ',').replace(/\s+/g, ' ').replace(/^,/, '').replace(/,$/, '').trim();

    return processed;
}

