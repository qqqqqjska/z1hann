
// LookUS 应用功能模块

let currentLookusContactId = null;
let lookusUpdateTimer = null;

function initLookusApp() {
    // 绑定顶部点击事件
    const headerBadge = document.getElementById('lookus-header-time-badge');
    if (headerBadge) {
        headerBadge.addEventListener('click', openLookusContactPicker);
    }

    // Initial check for current contact
    if (currentLookusContactId) {
        const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
        if (contact) {
            checkAndRefreshLookusData(contact);
        }
    }

    renderLookusApp();
    updateLookusTime();
    setupLookusTimers();
    
    // Update time display every second (if using live time)
    setInterval(updateLookusTime, 1000);
}

function isSameDay(timestamp) {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
           date.getMonth() === now.getMonth() &&
           date.getDate() === now.getDate();
}

async function checkAndRefreshLookusData(contact) {
    if (!contact.lookusData || !isSameDay(contact.lookusData.lastUpdateTime)) {
        console.log(`Resetting Lookus data for ${contact.name} (New Day or First Load)`);
        
        // Reset to initial state (Zeroed out)
        contact.lookusData = {
            distance: '--',
            battery: '--%',
            network: '未知',
            // Use existing device model if available, otherwise default pending generation
            device: contact.deviceModel || 'iPhone', 
            screenTimeH: 0,
            screenTimeM: 0,
            unlockCount: '0次',
            lastUnlock: '未知',
            stops: 0,
            stopList: [],
            appList: [],
            netLog: [],
            reportLog: [],
            lastUpdateTime: 0 // Mark as 0 so we know it's pending update
        };
        saveConfig();
        renderLookusApp(); // Will show 0 values
        
        // Trigger AI update
        await updateLookusStatusWithAI(contact.id);
    }
}

function updateLookusTime() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    const timeEl = document.getElementById('lookus-update-time');
    
    if (timeEl) {
        if (contact && contact.lookusData && contact.lookusData.lastUpdateTime > 0) {
            const date = new Date(contact.lookusData.lastUpdateTime);
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            timeEl.textContent = timeStr;
        } else {
            // Fallback to current time if no update data or pending
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            timeEl.textContent = timeStr;
        }
    }
}

function setupLookusTimers() {
    if (lookusUpdateTimer) clearInterval(lookusUpdateTimer);
    
    lookusUpdateTimer = setInterval(() => {
        if (!currentLookusContactId) return;
        const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
        if (!contact) return;
        
        // Check for day change
        if (contact.lookusData && contact.lookusData.lastUpdateTime > 0 && !isSameDay(contact.lookusData.lastUpdateTime)) {
            checkAndRefreshLookusData(contact);
            return; 
        }
        
        const now = Date.now();
        if (contact.lookusNextUpdateTime && now >= contact.lookusNextUpdateTime) {
            console.log('Triggering auto update for Lookus:', contact.name);
            updateLookusStatusWithAI(contact.id);
            
            // Schedule next
            const mode = contact.lookusUpdateMode;
            if (mode === 'random') {
                scheduleNextRandomUpdate(contact);
            } else if (mode === 'fixed') {
                const interval = contact.lookusUpdateMin || 30;
                contact.lookusNextUpdateTime = now + interval * 60 * 1000;
            } else {
                contact.lookusNextUpdateTime = null;
            }
            saveConfig();
        }
    }, 10000); // Check every 10s
}

function scheduleNextRandomUpdate(contact) {
    const min = contact.lookusUpdateMin || 30;
    const max = contact.lookusUpdateMax || 60;
    // Ensure max >= min
    const validMax = Math.max(max, min);
    
    const randomMinutes = Math.floor(Math.random() * (validMax - min + 1)) + min;
    contact.lookusNextUpdateTime = Date.now() + randomMinutes * 60 * 1000;
}

function openLookusSettings() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    if (!contact) {
        alert('请先选择一个联系人');
        return;
    }
    
    // Load current settings
    const mode = contact.lookusUpdateMode || 'manual';
    const modeSelect = document.getElementById('lookus-update-mode');
    const minInput = document.getElementById('lookus-update-min');
    const maxInput = document.getElementById('lookus-update-max');
    const timeGroup = document.getElementById('lookus-time-input-group');
    const timeLabel = document.getElementById('lookus-time-label');
    const timeHint = document.getElementById('lookus-time-hint');
    const separator = document.getElementById('lookus-time-separator');

    if (modeSelect) modeSelect.value = mode;
    if (minInput) minInput.value = contact.lookusUpdateMin || 30;
    if (maxInput) maxInput.value = contact.lookusUpdateMax || 60;

    // Toggle UI state
    if (mode === 'manual') {
        timeGroup.classList.add('hidden');
    } else {
        timeGroup.classList.remove('hidden');
        if (mode === 'random') {
            timeLabel.textContent = '时间范围 (分钟)';
            timeHint.textContent = '将在最小和最大时间之间随机更新';
            maxInput.classList.remove('hidden');
            separator.classList.remove('hidden');
            minInput.placeholder = '最小';
        } else if (mode === 'fixed') {
            timeLabel.textContent = '固定间隔 (分钟)';
            timeHint.textContent = '每隔设定时间更新一次';
            maxInput.classList.add('hidden');
            separator.classList.add('hidden');
            minInput.placeholder = '分钟';
        }
    }
    
    document.getElementById('lookus-settings-modal').classList.remove('hidden');
    
    // Bind Force Update button
    const forceBtn = document.getElementById('lookus-force-update-btn');
    if (forceBtn) {
        const newForceBtn = forceBtn.cloneNode(true);
        forceBtn.parentNode.replaceChild(newForceBtn, forceBtn);
        newForceBtn.onclick = () => {
            updateLookusStatusWithAI(contact.id);
            document.getElementById('lookus-settings-modal').classList.add('hidden');
        };
    }
}

window.toggleLookusTimeInput = function() {
    const mode = document.getElementById('lookus-update-mode').value;
    const timeGroup = document.getElementById('lookus-time-input-group');
    const timeLabel = document.getElementById('lookus-time-label');
    const timeHint = document.getElementById('lookus-time-hint');
    const minInput = document.getElementById('lookus-update-min');
    const maxInput = document.getElementById('lookus-update-max');
    const separator = document.getElementById('lookus-time-separator');

    if (mode === 'manual') {
        timeGroup.classList.add('hidden');
    } else {
        timeGroup.classList.remove('hidden');
        if (mode === 'random') {
            timeLabel.textContent = '时间范围 (分钟)';
            timeHint.textContent = '将在最小和最大时间之间随机更新';
            maxInput.classList.remove('hidden');
            separator.classList.remove('hidden');
            minInput.placeholder = '最小';
        } else if (mode === 'fixed') {
            timeLabel.textContent = '固定间隔 (分钟)';
            timeHint.textContent = '每隔设定时间更新一次';
            maxInput.classList.add('hidden');
            separator.classList.add('hidden');
            minInput.placeholder = '分钟';
        }
    }
}

window.saveLookusSettings = function() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    if (!contact) return;
    
    const mode = document.getElementById('lookus-update-mode').value;
    const minVal = parseInt(document.getElementById('lookus-update-min').value) || 30;
    const maxVal = parseInt(document.getElementById('lookus-update-max').value) || 60;

    contact.lookusUpdateMode = mode;
    contact.lookusUpdateMin = minVal;
    contact.lookusUpdateMax = maxVal;
    
    if (mode === 'random') {
        scheduleNextRandomUpdate(contact);
    } else if (mode === 'fixed') {
        contact.lookusNextUpdateTime = Date.now() + minVal * 60 * 1000;
    } else {
        contact.lookusNextUpdateTime = null;
    }
    
    saveConfig();
    document.getElementById('lookus-settings-modal').classList.add('hidden');
    setupLookusTimers();
}

window.openLookusSettings = openLookusSettings; // Expose global

function getItineraryText(contactId) {
    if (!window.iphoneSimState.itineraries || !window.iphoneSimState.itineraries[contactId]) return '';
    const data = window.iphoneSimState.itineraries[contactId];
    if (data.events && Array.isArray(data.events)) {
        return data.events.join('\n');
    }
    return '';
}

async function updateLookusStatusWithAI(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    const timeEl = document.getElementById('lookus-update-time');
    if (timeEl) timeEl.textContent = "更新中...";

    const currentData = getLookusData(contactId);
    const history = window.iphoneSimState.chatHistory[contactId] || [];
    const recentHistory = history.slice(-20).map(m => `${m.role === 'user' ? '我' : '你'}: ${m.content}`).join('\n');
    const itineraryText = getItineraryText(contactId);
    
    // Check if device model needs generation
    let deviceInstruction = "";
    if (!contact.deviceModel) {
        deviceInstruction = `\n- **首次生成**：该角色尚未设置手机型号。请根据人设推断并返回 "deviceModel" 字段，例如 "iPhone 15 Pro", "Huawei Mate 60" 等。`;
    }

    // Calculate time elapsed
    let timeElapsedStr = "首次生成或新的一天";
    let lastTime = 0;
    if (contact.lookusData && contact.lookusData.lastUpdateTime > 0 && isSameDay(contact.lookusData.lastUpdateTime)) {
        lastTime = contact.lookusData.lastUpdateTime;
        const diffMs = Date.now() - lastTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours > 0) {
            timeElapsedStr = `${diffHours}小时${diffMins % 60}分钟`;
        } else {
            timeElapsedStr = `${diffMins}分钟`;
        }
    }

    const systemPrompt = `你现在扮演 ${contact.name}。
请根据你的人设、最近的聊天记录以及【行程安排】，更新你在"LookUs"中的状态数据。

【时间逻辑 (关键)】
- 现在的真实时间是：${new Date().toLocaleTimeString()}
- **距离上次更新已过去：${timeElapsedStr}**
- 请务必根据这个时间间隔来合理推演状态变化：
  1. **电量**：根据间隔时间和使用强度扣减电量。
  2. **屏幕使用时间**：增加量**绝对不能超过**逝去的时间 (${timeElapsedStr})。
  3. **位置/行程**：如果间隔很短，位置通常不变；如果间隔较长，可能已经移动到了下一个地点。
  4. **报备事件**：请根据逝去的时间生成 1-3 条在此期间发生的状态变更事件（系统提示消息）。如果时间间隔很短，可以没有事件。事件应简短，例如"对方刚刚解锁了手机"、"对方电量低于20%"、"对方离开了[地点]"等。

【重要原则】
1. **连续性**：必须基于上次数据演变。
2. **上下文感知**：
   - 睡觉/忙碌 -> 手机未解锁。
   - 打游戏 -> 屏幕使用增加，正在使用游戏APP。
3. **行程同步**：
   - 参考行程信息生成停留地点。
${deviceInstruction}

【参考信息】
当前状态：
- 距离: ${currentData.distance} km
- 电量: ${currentData.battery}
- 屏幕使用: ${currentData.screenTimeH}小时${currentData.screenTimeM}分

今日行程：
${itineraryText || "暂无具体行程"}

请返回 JSON (字段名必须一致):
{
  "distance": "数字 (例如 5.2, 不要带km)",
  "battery": "数字 (0-100)",
  "network": "WiFi名称 或 5G",
  ${!contact.deviceModel ? '"deviceModel": "手机型号",' : ''}
  "screenTimeH": "数字 (小时)",
  "screenTimeM": "数字 (分钟)",
  "unlockCount": "数字 (次数)",
  "lastUnlock": "HH:MM",
  "stops": "数字 (停留数)",
  "stopList": [ {"location": "地点", "duration": "时长", "startTime": "HH:MM"} ],
  "appList": [ {"name": "应用名", "cat": "分类", "time": "时长"} ],
  "netLog": [ {"type": "WiFi/5G", "name": "名称", "time": "时间段", "isCurrent": true/false} ],
  "reportEvents": [ {"text": "事件描述", "type": "unlock/charge/move/app/other", "timeOffsetMin": "距离上次更新过去多少分钟(数字)"} ]
}`;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    
    if (!settings.url || !settings.key) {
        alert("请先在设置中配置 AI API");
        return;
    }
    
    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }
        const cleanKey = settings.key.replace(/[^\x00-\x7F]/g, "").trim();
        
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: '请更新状态' }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });
        
        if (response.ok) {
            const resData = await response.json();
            const content = resData.choices[0].message.content;
            let newData;
            try {
                newData = JSON.parse(content);
            } catch (e) {
                const match = content.match(/\{[\s\S]*\}/);
                if (match) {
                    newData = JSON.parse(match[0]);
                } else {
                    throw new Error("Invalid JSON response");
                }
            }
            
            // Save permanent device model if generated
            if (newData.deviceModel && !contact.deviceModel) {
                contact.deviceModel = newData.deviceModel;
            }

            // Process Report Events
            let newReports = [];
            if (newData.reportEvents && Array.isArray(newData.reportEvents)) {
                const now = Date.now();
                const lastTime = (contact.lookusData && contact.lookusData.lastUpdateTime > 0) ? contact.lookusData.lastUpdateTime : (now - 60000);
                
                newReports = newData.reportEvents.map(evt => {
                    let icon = 'fas fa-info-circle';
                    let color = '#999';
                    
                    // Simple Icon Logic
                    if (evt.type === 'unlock' || evt.text.includes('解锁')) { icon = 'fas fa-mobile-alt'; color = '#4CAF50'; }
                    else if (evt.type === 'charge' || evt.text.includes('充电')) { icon = 'fas fa-bolt'; color = '#FF9500'; }
                    else if (evt.type === 'move' || evt.text.includes('离开') || evt.text.includes('到达')) { icon = 'fas fa-map-marker-alt'; color = '#007AFF'; }
                    else if (evt.type === 'app' || evt.text.includes('使用')) { icon = 'fas fa-layer-group'; color = '#9C27B0'; }
                    
                    // Calculate timestamp
                    let offset = parseInt(evt.timeOffsetMin) || 0;
                    let timestamp = lastTime + (offset * 60 * 1000);
                    // Ensure timestamp is not in future
                    if (timestamp > now) timestamp = now;
                    // Ensure timestamp is after last update
                    if (timestamp < lastTime) timestamp = lastTime;

                    const date = new Date(timestamp);
                    const timeStr = `${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
                    
                    return {
                        time: timeStr,
                        timestamp: timestamp,
                        icon: icon,
                        iconColor: color,
                        text: evt.text
                    };
                });
            }

            // Merge Reports
            let currentReports = (contact.lookusData && contact.lookusData.reportLog) ? contact.lookusData.reportLog : [];
            const allReports = [...newReports, ...currentReports];
            
            // Sort by timestamp desc
            allReports.sort((a, b) => b.timestamp - a.timestamp);
            
            // Limit history size (e.g. keep last 50)
            const limitedReports = allReports.slice(0, 50);

            contact.lookusData = {
                distance: newData.distance || currentData.distance,
                battery: (newData.battery || 80) + '%',
                network: newData.network || '5G',
                // deviceModel is stored in contact root, lookusData.device is for display logic
                device: contact.deviceModel || newData.deviceModel || 'iPhone', 
                screenTimeH: newData.screenTimeH || 0,
                screenTimeM: newData.screenTimeM || 0,
                unlockCount: (newData.unlockCount || 0) + '次',
                lastUnlock: newData.lastUnlock || '未知',
                stops: newData.stops || 1,
                stopList: newData.stopList || [],
                appList: newData.appList || [],
                netLog: newData.netLog || [],
                reportLog: limitedReports,
                lastUpdateTime: Date.now()
            };
            
            saveConfig();
            renderLookusApp();
            renderLookusReport(); // Update report view if open
            updateLookusTime();
        } else {
            throw new Error(`API Error: ${response.status}`);
        }
    } catch (e) {
        console.error("AI Update Failed", e);
        if (timeEl) timeEl.textContent = "更新失败";
    }
}

function openLookusContactPicker() {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    const headerTitle = modal.querySelector('h3');
    const originalTitle = headerTitle ? headerTitle.textContent : '选择联系人';
    if (headerTitle) headerTitle.textContent = '选择查看对象';
    
    if (sendBtn) sendBtn.style.display = 'none';
    
    list.innerHTML = '';
    
    if (!window.iphoneSimState.contacts || window.iphoneSimState.contacts.length === 0) {
        list.innerHTML = '<div class="list-item center-content" style="color:#999;">暂无联系人</div>';
    } else {
        window.iphoneSimState.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="list-content" style="display:flex; align-items:center; width:100%; padding: 10px;">
                    <img src="${c.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; object-fit: cover;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${c.remark || c.name}</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #ccc;"></i>
                </div>
            `;
            item.onclick = () => {
                currentLookusContactId = c.id;
                modal.classList.add('hidden');
                if (headerTitle) headerTitle.textContent = originalTitle;
                if (sendBtn) sendBtn.style.display = '';
                
                checkAndRefreshLookusData(c);
                // Ensure render happens
                renderLookusApp();
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

function getLookusData(contactId) {
    if (!contactId) return null; // Return null if no contact

    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    const name = contact ? (contact.remark || contact.name) : '未知用户';
    
    // Restore pseudo-random generation for stable fallbacks
    let seed = 0;
    const str = String(contactId) + name;
    for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed) + str.charCodeAt(i);
        seed |= 0;
    }
    seed = Math.abs(seed);
    
    const randomDistance = ((seed % 900) / 10 + 0.1).toFixed(1);
    const deviceModels = ['iPhone 15 Pro', 'iPhone 14', 'iPhone 13 mini', 'iPhone 15 Pro Max', 'iPhone SE'];
    const randomDevice = deviceModels[seed % deviceModels.length];

    if (contact && contact.lookusData) {
        return {
            name: name,
            distance: (contact.lookusData.distance && contact.lookusData.distance !== '--') ? contact.lookusData.distance : randomDistance,
            // Prefer permanent device model if set, else fallback to daily data or random
            device: contact.deviceModel || contact.lookusData.device || randomDevice,
            network: contact.lookusData.network,
            battery: contact.lookusData.battery,
            stops: contact.lookusData.stops,
            screenTimeH: contact.lookusData.screenTimeH || 0,
            screenTimeM: contact.lookusData.screenTimeM || 0,
            unlockCount: contact.lookusData.unlockCount,
            lastUnlock: contact.lookusData.lastUnlock,
            appList: contact.lookusData.appList || [],
            netLog: contact.lookusData.netLog || [],
            stopList: contact.lookusData.stopList || []
        };
    }

    // Default Fallback
    return {
        name: name,
        distance: randomDistance,
        device: contact && contact.deviceModel ? contact.deviceModel : randomDevice,
        network: '未知',
        battery: '--%',
        stops: 0,
        screenTimeH: 0,
        screenTimeM: 0,
        unlockCount: '0次',
        lastUnlock: '未知',
        appList: [],
        netLog: [],
        stopList: []
    };
}

function renderLookusApp() {
    const container = document.getElementById('lookus-content');
    if (!container) return;

    if (!currentLookusContactId) {
        container.innerHTML = '<div style="text-align:center; padding: 50px; color: #999;">请先选择联系人</div>';
        return;
    }

    const data = getLookusData(currentLookusContactId);

    // Calculate Screen Time Percentage
    const h = parseInt(data.screenTimeH) || 0;
    const m = parseInt(data.screenTimeM) || 0;
    const totalMinutes = h * 60 + m;
    const percentage = Math.min(100, (totalMinutes / 1440) * 100).toFixed(1);
    const screenTimeStr = `${h}小时${m}分`;

    // Clear container
    container.innerHTML = '';

    // --- Top Section ---
    const topSection = document.createElement('div');
    topSection.className = 'lookus-section';
    
    topSection.innerHTML = `
        <div class="lookus-status-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div class="lookus-distance">我们相距 ${data.distance} km</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <i class="fas fa-heart" style="color: #000;"></i>
                    <i class="fas fa-comment-dots" style="color: #000;"></i>
                </div>
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">${data.name} 在这里</div>
            <div class="lookus-device-info">
                <div class="lookus-device-item">
                    <i class="fas fa-mobile-alt lookus-device-icon"></i>
                    <span>${data.device}</span>
                </div>
                <div class="lookus-device-item">
                    <i class="fas fa-wifi lookus-device-icon"></i>
                    <span>${data.network} <i class="far fa-question-circle"></i></span>
                </div>
                <div class="lookus-device-item">
                    <i class="fas fa-battery-three-quarters lookus-device-icon"></i>
                    <span>${data.battery}</span>
                </div>
            </div>
        </div>
    `;

    // Stops Section
    let stopListHtml = '';
    if (data.stopList && data.stopList.length > 0) {
        data.stopList.forEach((stop, index) => {
             stopListHtml += `
                <div style="display: flex; gap: 15px; align-items: center; padding-top: 10px; margin-bottom: 10px;">
                    <div style="width: 80px; height: 80px; border-radius: 12px; overflow: hidden; position: relative; flex-shrink: 0;">
                        <img src="https://placehold.co/100x100/3e4c63/3e4c63?text=${index+1}" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: #FF9500; border-radius: 50%; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; border: 2px solid #fff;">${index + 1}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                            <i class="fas fa-map-pin" style="color: #FF9500; margin-right: 5px;"></i>
                            停留${stop.duration}
                        </div>
                        <div style="color: #666; font-size: 13px; display: flex; align-items: center; gap: 5px;">
                            <span style="color: #FF9500; font-size: 20px;">•</span> ${stop.startTime}
                            <div style="background: #e0e0e0; height: 10px; width: 60px; border-radius: 2px;"></div>
                            <div style="font-size: 12px; color: #999; margin-left: 5px;">${stop.location}</div>
                        </div>
                    </div>
                </div>
             `;
        });
    } else {
        stopListHtml = '<div style="text-align: center; color: #999; padding: 10px;">暂无停留记录</div>';
    }

    const stopsCard = document.createElement('div');
    stopsCard.className = 'lookus-card';
    stopsCard.innerHTML = `
        <div class="lookus-card-title" style="border-bottom: none; padding-bottom: 0;">
            <span><i class="fas fa-map-marker-alt" style="color: #8BC34A;"></i> 对方今天停留${data.stops}个地方</span>
        </div>
        ${stopListHtml}
    `;
    topSection.appendChild(stopsCard);
    
    container.appendChild(topSection);

    // --- Middle Section ---
    const middleSection = document.createElement('div');
    middleSection.className = 'lookus-section';
    
    middleSection.innerHTML = `
        <div class="lookus-card">
            <div class="lookus-card-title">今日手机使用记录</div>
            <div style="display: flex; gap: 15px;">
                <div style="flex: 1; background: #f9f9f9; border-radius: 12px; padding: 20px; text-align: center;">
                    <div id="lookus-usage-ring" class="lookus-usage-circle"></div>
                    <div style="margin-top: 15px; font-weight: bold;">屏幕使用时间</div>
                    <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">${screenTimeStr}</div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 15px;">
                    <div class="lookus-stat-box" style="flex: 1;">
                        <div class="lookus-stat-label"><span style="color: #000;">●</span> 解锁手机次数</div>
                        <div class="lookus-stat-value">${data.unlockCount}</div>
                        <i class="fas fa-lock lookus-lock-icon"></i>
                    </div>
                    <div class="lookus-stat-box" style="flex: 1;">
                        <div class="lookus-stat-label"><span style="color: #000;">●</span> 最近解锁手机</div>
                        <div class="lookus-stat-value">${data.lastUnlock}</div>
                        <i class="far fa-clock lookus-lock-icon"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
    container.appendChild(middleSection);

    // --- Bottom Section ---
    const bottomSection = document.createElement('div');
    bottomSection.className = 'lookus-section';
    
    // Generate App List HTML
    let appListHtml = '';
    if (data.appList && data.appList.length > 0) {
        data.appList.forEach(app => {
            // Simple mapping for icons/colors based on common app names, fallback to random/default
            let iconClass = 'fas fa-mobile-alt';
            let bg = '#333';
            if (app.name.includes('微信')) { iconClass = 'fab fa-weixin'; bg = '#07C160'; }
            else if (app.name.includes('抖音')) { iconClass = 'fab fa-tiktok'; bg = '#000'; }
            else if (app.name.includes('游戏') || app.name.includes('荣耀')) { iconClass = 'fas fa-gamepad'; bg = '#FF9500'; }
            
            appListHtml += `
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="width: 40px; height: 40px; background: ${bg}; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="${iconClass}" style="color: #fff; font-size: 22px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 15px;">${app.name}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 2px;">${app.cat || '应用'}</div>
                    </div>
                    <div style="font-weight: 600; font-size: 14px;">${app.time}</div>
                </div>
            `;
        });
    } else {
        appListHtml = '<div style="text-align: center; color: #999; padding: 10px;">暂无记录</div>';
    }

    // Generate Net Log HTML
    let netLogHtml = '';
    if (data.netLog && data.netLog.length > 0) {
        data.netLog.forEach(log => {
            let iconClass = log.type === 'WiFi' ? 'fas fa-wifi' : 'fas fa-signal';
            let iconColor = log.type === 'WiFi' ? '#007AFF' : '#666';
            let bg = log.type === 'WiFi' ? '#E3F2FD' : '#F5F5F5';
            let tagHtml = log.isCurrent ? `<div style="color: #007AFF; font-size: 12px; background: #E3F2FD; padding: 4px 8px; border-radius: 10px; font-weight: 600;">当前</div>` : '';
            
            netLogHtml += `
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="width: 36px; height: 36px; background: ${bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="${iconClass}" style="color: ${iconColor}; font-size: 16px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 15px;">${log.name}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 2px;">${log.time}</div>
                    </div>
                    ${tagHtml}
                </div>
            `;
        });
    } else {
        netLogHtml = '<div style="text-align: center; color: #999; padding: 10px;">暂无记录</div>';
    }

    bottomSection.innerHTML = `
        <div class="lookus-card">
            <div class="lookus-card-title">
                手机APP使用记录 <span class="lookus-new-badge">NEW!</span>
                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
            </div>
            <div class="lookus-app-list" style="margin-top: 15px;">
                ${appListHtml}
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">
                网络记录
                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
            </div>
            <div class="lookus-net-list" style="margin-top: 15px;">
                ${netLogHtml}
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">
                <span>锁Ta手机 <span class="lookus-new-badge">NEW!</span></span>
                <span style="font-size: 12px; color: #999;">iOS锁定说明 <i class="far fa-question-circle"></i></span>
            </div>
            <div style="text-align: center; color: #666; font-size: 14px; margin: 20px 0;">对方未开启相关权限，还不能锁机</div>
            <button class="lookus-lock-phone-btn">去提醒Ta</button>
        </div>
    `;
    container.appendChild(bottomSection);

    // Animate Ring
    setTimeout(() => {
        const ring = document.getElementById('lookus-usage-ring');
        if (ring) {
            // Trigger reflow
            void ring.offsetWidth;
            ring.style.setProperty('--progress', `${percentage}%`);
        }
    }, 100);
}

function closeLookusApp() {
    const app = document.getElementById('lookus-app');
    if (app) {
        app.style.opacity = '0';
        app.style.transform = 'scale(0.95)';
        app.style.transition = 'opacity 0.2s, transform 0.2s';
        
        setTimeout(() => {
            app.classList.add('hidden');
            // Reset styles for next open
            app.style.opacity = '';
            app.style.transform = '';
            app.style.transition = '';
        }, 200);
    }
}

function switchLookusTab(tabName) {
    const homeView = document.getElementById('lookus-content');
    const reportView = document.getElementById('lookus-report-view');
    const tabs = document.querySelectorAll('.lookus-tab-bar .tab-item');
    const homeBtn = tabs[0];
    const reportBtn = tabs[1];

    const showView = (viewToShow, viewToHide) => {
        if (viewToHide) {
            viewToHide.style.opacity = '0';
            viewToHide.style.transform = 'scale(0.98)';
            viewToHide.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            
            setTimeout(() => {
                viewToHide.style.display = 'none';
                viewToHide.style.opacity = '';
                viewToHide.style.transform = '';
                viewToHide.style.transition = '';
                
                if (viewToShow) {
                    if (tabName === 'report') {
                        viewToShow.style.display = 'flex';
                    } else {
                        viewToShow.style.display = 'block';
                    }
                    viewToShow.style.opacity = '0';
                    viewToShow.style.transform = 'scale(1.02)';
                    viewToShow.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                    
                    // Trigger reflow
                    void viewToShow.offsetWidth;
                    
                    viewToShow.style.opacity = '1';
                    viewToShow.style.transform = 'scale(1)';
                    
                    if (tabName === 'home') {
                        // Re-trigger ring animation if returning to home
                        const ring = document.getElementById('lookus-usage-ring');
                        if (ring) {
                            const currentP = ring.style.getPropertyValue('--progress');
                            ring.style.setProperty('--progress', '0%');
                            setTimeout(() => {
                                ring.style.setProperty('--progress', currentP);
                            }, 50);
                        }
                    }
                }
            }, 200);
        } else if (viewToShow) {
             // Initial show if nothing to hide (shouldn't happen usually but safe to handle)
             if (tabName === 'report') viewToShow.style.display = 'flex';
             else viewToShow.style.display = 'block';
        }
    };

    if (tabName === 'home') {
        if (homeBtn.classList.contains('active')) return;
        
        showView(homeView, reportView);
        
        homeBtn.classList.add('active');
        homeBtn.style.color = '#000';
        reportBtn.classList.remove('active');
        reportBtn.style.color = '#999';
        
    } else if (tabName === 'report') {
        if (reportBtn.classList.contains('active')) return;
        
        showView(reportView, homeView);
        
        homeBtn.classList.remove('active');
        homeBtn.style.color = '#999';
        reportBtn.classList.add('active');
        reportBtn.style.color = '#000';
        
        renderLookusReport(); 
    }
}

function renderLookusReport() {
    const container = document.getElementById('lookus-report-view');
    if (!container) return;
    
    if (!currentLookusContactId) {
        container.innerHTML = '<div style="text-align:center; padding: 50px; color: #999;">请先选择联系人</div>';
        return;
    }

    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    let events = [];
    if (contact && contact.lookusData && contact.lookusData.reportLog) {
        events = contact.lookusData.reportLog;
    }

    container.innerHTML = '';
    container.className = 'lookus-report-view';

    if (events.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 50px; color: #999;">暂无报备记录</div>';
        return;
    }

    events.forEach(event => {
        // Time
        const timeEl = document.createElement('div');
        timeEl.className = 'lookus-report-time';
        timeEl.textContent = event.time;
        container.appendChild(timeEl);

        // Bubble
        const itemEl = document.createElement('div');
        itemEl.className = 'lookus-report-item';
        
        // Icon
        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = `<i class="${event.icon || 'fas fa-info-circle'}" style="color: ${event.iconColor || '#999'};"></i>`;
        iconSpan.className = 'lookus-report-icon';
        itemEl.appendChild(iconSpan);

        // Text content
        const textSpan = document.createElement('span');
        let processedText = event.text;
        
        if (event.boldText) {
             processedText = processedText.replace(event.boldText, `<b>${event.boldText}</b>`);
        }
        
        textSpan.innerHTML = processedText;
        itemEl.appendChild(textSpan);

        // Link (Optional)
        if (event.link) {
            const linkSpan = document.createElement('span');
            linkSpan.className = 'lookus-report-link';
            linkSpan.textContent = event.link;
            itemEl.appendChild(linkSpan);
        }

        container.appendChild(itemEl);
    });
    
    // Bottom padding
    const spacer = document.createElement('div');
    spacer.style.height = '50px';
    container.appendChild(spacer);
}

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(initLookusApp);
}
