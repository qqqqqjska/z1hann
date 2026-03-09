function typewriterEffect(text, avatarUrl, thought = null, replyTo = null, type = 'text', targetContactId = null) {
    return new Promise(resolve => {
        const contactId = targetContactId || window.iphoneSimState.currentChatContactId;
        if (!contactId) {
            resolve();
            return;
        }

        if (!window.iphoneSimState.chatHistory[contactId]) {
            window.iphoneSimState.chatHistory[contactId] = [];
        }
        
        const msgData = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            time: Date.now(),
            role: 'assistant',
            content: text,
            type: type,
            replyTo: replyTo
        };
        
        if (thought) {
            msgData.thought = thought;
        }
        
        window.iphoneSimState.chatHistory[contactId].push(msgData);
        
        const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
        if (contact) {
            if (contact.autoItineraryEnabled) {
                if (typeof contact.messagesSinceLastItinerary !== 'number') {
                    contact.messagesSinceLastItinerary = 0;
                }
                contact.messagesSinceLastItinerary++;
                
                if (contact.messagesSinceLastItinerary >= (contact.autoItineraryInterval || 10)) {
                    if (window.generateNewItinerary) {
                        window.generateNewItinerary(contact);
                        contact.messagesSinceLastItinerary = 0;
                    }
                }
            } else {
                contact.messagesSinceLastItinerary = 0;
            }
        }

        saveConfig();

        if (window.syncToFloatingChat && window.isScreenSharing) {
            console.log('[ScreenShare Debug] sync assistant reply to floating', {
                contactId,
                type,
                preview: String(text || '').slice(0, 120)
            });
            window.syncToFloatingChat({ content: text, type: type, role: 'assistant' }, contactId);
            if (typeof window.loadFloatingChatHistory === 'function') {
                window.loadFloatingChatHistory();
            }
        }
        
        if (window.iphoneSimState.currentChatContactId === contactId) {
            appendMessageToUI(text, false, type, null, replyTo, msgData.id, msgData.time);
            scrollToBottom();
        }

        if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        
        if (window.checkAndSummarize) window.checkAndSummarize(contactId);

        resolve();
    });
}

function handleRegenerateReply() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    if (!history || history.length === 0) {
        alert('没有聊天记录，无法重回');
        return;
    }

    document.getElementById('chat-more-panel').classList.add('hidden');

    let hasDeleted = false;
    while (history.length > 0) {
        const lastMsg = history[history.length - 1];
        if (lastMsg.role === 'assistant') {
            history.pop();
            hasDeleted = true;
        } else {
            break;
        }
    }

    if (hasDeleted) {
        saveConfig();
        renderChatHistory(window.iphoneSimState.currentChatContactId);
    }
    
    generateAiReply('请严格遵守JSON格式输出。如果开启了心声(thought)，必须先输出心声（角色的心理活动）。请务必将长回复拆分为多条短消息。');
}

function handleTransfer() {
    const amountStr = document.getElementById('transfer-amount').value.trim();
    const remark = document.getElementById('transfer-remark').value.trim();

    if (!amountStr || isNaN(amountStr) || parseFloat(amountStr) <= 0) {
        alert('请输入有效的金额');
        return;
    }
    
    const amount = parseFloat(amountStr);

    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
    if (window.iphoneSimState.wallet.balance < amount) {
        alert('余额不足，请先充值');
        return;
    }

    window.iphoneSimState.wallet.balance -= amount;
    window.iphoneSimState.wallet.transactions.unshift({
        id: Date.now(),
        type: 'expense',
        amount: amount,
        title: '转账支出',
        time: Date.now(),
        relatedId: null
    });

    const transferId = Date.now() + Math.floor(Math.random() * 1000);
    
    window.iphoneSimState.wallet.transactions[0].relatedId = transferId;
    
    const transferData = {
        id: transferId,
        amount: amount.toFixed(2),
        remark: remark || '转账给您',
        status: 'pending'
    };

    sendMessage(JSON.stringify(transferData), true, 'transfer');
    document.getElementById('transfer-modal').classList.add('hidden');
    saveConfig();
}

function handleChatCamera() {
    const description = prompt('请输入图片描述：');
    if (description) {
        const defaultImageUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
        sendMessage(defaultImageUrl, true, 'virtual_image', description);
        
        document.getElementById('chat-more-panel').classList.add('hidden');
    }
}

function handleChatPhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        sendMessage(base64, true, 'image');
        document.getElementById('chat-more-panel').classList.add('hidden');
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

// --- AI 设置相关 ---

function setupAiListeners(isSecondary) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    
    const aiApiUrl = document.getElementById(`ai-api-url${suffix}`);
    if (aiApiUrl) aiApiUrl.addEventListener('change', (e) => {
        window.iphoneSimState[settingsKey].url = e.target.value;
        saveConfig();
    });

    const aiApiKey = document.getElementById(`ai-api-key${suffix}`);
    if (aiApiKey) aiApiKey.addEventListener('change', (e) => {
        window.iphoneSimState[settingsKey].key = e.target.value;
        saveConfig();
    });

    const fetchModelsBtn = document.getElementById(`fetch-models${suffix}`);
    if (fetchModelsBtn) fetchModelsBtn.addEventListener('click', () => handleFetchModels(isSecondary));

    const aiModelSelect = document.getElementById(`ai-model-select${suffix}`);
    if (aiModelSelect) aiModelSelect.addEventListener('change', (e) => {
        window.iphoneSimState[settingsKey].model = e.target.value;
        saveConfig();
    });

    const aiTemperature = document.getElementById(`ai-temperature${suffix}`);
    if (aiTemperature) aiTemperature.addEventListener('input', (e) => {
        window.iphoneSimState[settingsKey].temperature = parseFloat(e.target.value);
        document.getElementById(`ai-temp-value${suffix}`).textContent = window.iphoneSimState[settingsKey].temperature;
        saveConfig();
    });

    const saveAiPresetBtn = document.getElementById(`save-ai-preset${suffix}`);
    if (saveAiPresetBtn) saveAiPresetBtn.addEventListener('click', () => handleSaveAiPreset(isSecondary));

    const deleteAiPresetBtn = document.getElementById(`delete-ai-preset${suffix}`);
    if (deleteAiPresetBtn) deleteAiPresetBtn.addEventListener('click', () => handleDeleteAiPreset(isSecondary));

    const aiPresetSelect = document.getElementById(`ai-preset-select${suffix}`);
    if (aiPresetSelect) aiPresetSelect.addEventListener('change', (e) => handleApplyAiPreset(e, isSecondary));
}

function setupWhisperListeners() {
    const urlInput = document.getElementById('whisper-api-url');
    const keyInput = document.getElementById('whisper-api-key');
    const modelInput = document.getElementById('whisper-model');
    const modeSelect = document.getElementById('whisper-connection-mode');
    const fetchModelsBtn = document.getElementById('fetch-whisper-models');
    const modelSelect = document.getElementById('whisper-model-select');

    if (modeSelect && window.iphoneSimState.whisperSettings.url) {
        if (window.iphoneSimState.whisperSettings.url.includes('siliconflow.cn')) {
            modeSelect.value = 'siliconflow';
        } else {
            modeSelect.value = 'custom';
        }
    }

    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            if (mode === 'siliconflow') {
                const siliconflowUrl = 'https://api.siliconflow.cn/v1';
                urlInput.value = siliconflowUrl;
                window.iphoneSimState.whisperSettings.url = siliconflowUrl;
                // 自动推荐 SiliconFlow 的免费模型
                if (modelInput && (modelInput.value === 'whisper-1' || !modelInput.value)) {
                    const recommendModel = 'FunAudioLLM/SenseVoiceSmall';
                    modelInput.value = recommendModel;
                    window.iphoneSimState.whisperSettings.model = recommendModel;
                    if (window.showChatToast) {
                        window.showChatToast(`已自动切换为 SiliconFlow 免费模型: ${recommendModel}`);
                    } else {
                        alert(`已自动切换为 SiliconFlow 免费模型: ${recommendModel}`);
                    }
                }
            } else {
                if (urlInput.value.includes('siliconflow.cn')) {
                    urlInput.value = '';
                    window.iphoneSimState.whisperSettings.url = '';
                }
            }
            saveConfig();
        });
    }

    if (urlInput) {
        urlInput.value = window.iphoneSimState.whisperSettings.url || '';
        urlInput.addEventListener('change', (e) => {
            window.iphoneSimState.whisperSettings.url = e.target.value;
            if (modeSelect) {
                if (e.target.value.includes('siliconflow.cn')) {
                    modeSelect.value = 'siliconflow';
                } else {
                    modeSelect.value = 'custom';
                }
            }
            saveConfig();
        });
    }

    if (keyInput) {
        keyInput.value = window.iphoneSimState.whisperSettings.key || '';
        keyInput.addEventListener('change', (e) => {
            window.iphoneSimState.whisperSettings.key = e.target.value;
            saveConfig();
        });
    }

    if (modelInput) {
        modelInput.value = window.iphoneSimState.whisperSettings.model || 'whisper-1';
        modelInput.addEventListener('change', (e) => {
            window.iphoneSimState.whisperSettings.model = e.target.value;
            saveConfig();
        });
    }

    if (fetchModelsBtn) {
        fetchModelsBtn.addEventListener('click', handleFetchWhisperModels);
    }

    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            const selectedModel = e.target.value;
            if (selectedModel) {
                modelInput.value = selectedModel;
                window.iphoneSimState.whisperSettings.model = selectedModel;
                saveConfig();
            }
        });
    }
}

function setupMinimaxListeners() {
    const groupIdInput = document.getElementById('minimax-group-id');
    const apiKeyInput = document.getElementById('minimax-api-key');
    const modelInput = document.getElementById('minimax-model');
    const modelSelect = document.getElementById('minimax-model-select');

    if (groupIdInput) {
        groupIdInput.value = window.iphoneSimState.minimaxSettings.groupId || '';
        groupIdInput.addEventListener('change', (e) => {
            window.iphoneSimState.minimaxSettings.groupId = e.target.value;
            saveConfig();
        });
    }

    if (apiKeyInput) {
        apiKeyInput.value = window.iphoneSimState.minimaxSettings.key || '';
        apiKeyInput.addEventListener('change', (e) => {
            window.iphoneSimState.minimaxSettings.key = e.target.value;
            saveConfig();
        });
    }

    if (modelInput) {
        modelInput.value = window.iphoneSimState.minimaxSettings.model || 'speech-01-turbo';
        modelInput.addEventListener('change', (e) => {
            window.iphoneSimState.minimaxSettings.model = e.target.value;
            if (modelSelect) {
                modelSelect.value = e.target.value;
            }
            saveConfig();
        });
    }

    if (modelSelect) {
        if (window.iphoneSimState.minimaxSettings.model) {
            modelSelect.value = window.iphoneSimState.minimaxSettings.model;
        }
        
        modelSelect.addEventListener('change', (e) => {
            const selectedModel = e.target.value;
            if (selectedModel) {
                if (modelInput) modelInput.value = selectedModel;
                window.iphoneSimState.minimaxSettings.model = selectedModel;
                saveConfig();
            }
        });
    }
}

async function generateMinimaxTTS(text, voiceId) {
    const settings = window.iphoneSimState.minimaxSettings;
    
    console.log('Generating Minimax TTS...', {
        url: settings.url,
        hasKey: !!settings.key,
        groupId: settings.groupId,
        model: settings.model,
        text: text,
        voiceId: voiceId
    });

    if (!settings.key) {
        alert('Minimax API Key 未配置');
        return null;
    }
    
    let url = settings.url;
    if (settings.groupId) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}GroupId=${settings.groupId}`;
    } else {
        console.warn('Minimax GroupID is empty. Request might fail.');
    }

    try {
        console.log('Requesting Minimax TTS URL:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: settings.model || 'speech-01-turbo',
                text: text,
                stream: false,
                voice_setting: {
                    voice_id: voiceId || 'male-qn-qingse',
                    speed: 1.0,
                    vol: 1.0,
                    pitch: 0
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Minimax API HTTP Error: ${response.status}`, errText);
            alert(`语音生成失败 (HTTP ${response.status}): ${errText}`);
            return null;
        }

        const data = await response.json();
        console.log('Minimax API Response:', data);

        if (data.base_resp && data.base_resp.status_code !== 0) {
            console.error('Minimax API returned error:', data.base_resp);
            alert(`语音生成API错误: ${data.base_resp.status_msg} (Code: ${data.base_resp.status_code})`);
            return null;
        }
        
        if (data.data && data.data.audio) {
            const hexAudio = data.data.audio;
            const match = hexAudio.match(/.{1,2}/g);
            if (!match) {
                 console.error('Invalid hex audio data');
                 return null;
            }
            const bytes = new Uint8Array(match.map(byte => parseInt(byte, 16)));
            
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } else if (data.base64) {
            return `data:audio/mp3;base64,${data.base64}`;
        } else if (data.audio) {
             return `data:audio/mp3;base64,${data.audio}`;
        } else {
            console.error('Minimax response format unknown:', JSON.stringify(data));
            alert('语音生成失败：未知的响应格式，请检查控制台日志');
            return null;
        }

    } catch (error) {
        console.error('Minimax TTS generation failed:', error);
        alert(`语音生成异常: ${error.message}`);
        return null;
    }
}

async function handleFetchWhisperModels() {
    const url = window.iphoneSimState.whisperSettings.url;
    const key = window.iphoneSimState.whisperSettings.key;
    const btn = document.getElementById('fetch-whisper-models');
    const select = document.getElementById('whisper-model-select');

    if (!url) {
        alert('请先输入API地址');
        return;
    }

    const originalText = btn.textContent;
    btn.textContent = '拉取中...';
    btn.disabled = true;

    try {
        let fetchUrl = url;
        if (fetchUrl.endsWith('/')) {
            fetchUrl = fetchUrl.slice(0, -1);
        }
        
        if (!fetchUrl.endsWith('/models')) {
            if (fetchUrl.endsWith('/v1')) {
                fetchUrl += '/models';
            } else {
                fetchUrl += '/models';
            }
        }

        const headers = {};
        if (key) {
            headers['Authorization'] = `Bearer ${key}`;
        }

        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const models = data.data || data.models || [];

        select.innerHTML = '<option value="">请选择模型</option>';
        
        if (models.length === 0) {
            alert('未获取到模型列表');
            return;
        }

        models.forEach(model => {
            const id = model.id || model;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            select.appendChild(option);
        });

        select.classList.remove('hidden');
        alert(`成功获取 ${models.length} 个模型`);

    } catch (error) {
        console.error('获取Whisper模型失败:', error);
        alert('获取模型失败，请检查API地址和密钥是否正确，或跨域设置。');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function handleFetchModels(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    
    const url = window.iphoneSimState[settingsKey].url;
    const key = window.iphoneSimState[settingsKey].key;

    if (!url) {
        alert('请先输入API地址');
        return;
    }

    const btn = document.getElementById(`fetch-models${suffix}`);
    const originalText = btn.textContent;
    btn.textContent = '拉取中...';
    btn.disabled = true;

    try {
        let fetchUrl = url;
        if (!fetchUrl.endsWith('/models')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'models' : fetchUrl + '/models';
        }

        const headers = {};
        if (key) {
            // 清理 Key，移除可能包含的非 ASCII 字符（如中文）
            const cleanKey = key.replace(/[^\x00-\x7F]/g, "").trim();
            headers['Authorization'] = `Bearer ${cleanKey}`;
        }

        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const models = data.data || data.models || [];

        const select = document.getElementById(`ai-model-select${suffix}`);
        select.innerHTML = '<option value="">请选择模型</option>';
        
        models.forEach(model => {
            const id = model.id || model;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            select.appendChild(option);
        });

        alert(`成功获取 ${models.length} 个模型`);
        
        if (window.iphoneSimState[settingsKey].model) {
            select.value = window.iphoneSimState[settingsKey].model;
        }

    } catch (error) {
        console.error('获取模型失败:', error);
        alert('获取模型失败，请检查API地址和密钥是否正确，或跨域设置。');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function handleSaveAiPreset(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const name = prompt('请输入AI配置预设名称：');
    if (!name) return;

    const preset = {
        name: name,
        settings: { ...window.iphoneSimState[settingsKey] }
    };

    window.iphoneSimState[presetsKey].push(preset);
    saveConfig();
    renderAiPresets(isSecondary);
    document.getElementById(`ai-preset-select${suffix}`).value = name;
    alert('AI预设已保存');
}

function handleDeleteAiPreset(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const select = document.getElementById(`ai-preset-select${suffix}`);
    const name = select.value;
    if (!name) return;

    if (confirm(`确定要删除预设 "${name}" 吗？`)) {
        window.iphoneSimState[presetsKey] = window.iphoneSimState[presetsKey].filter(p => p.name !== name);
        saveConfig();
        renderAiPresets(isSecondary);
    }
}

function handleApplyAiPreset(e, isSecondary = false) {
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const name = e.target.value;
    if (!name) return;

    const preset = window.iphoneSimState[presetsKey].find(p => p.name === name);
    if (preset) {
        window.iphoneSimState[settingsKey] = { ...preset.settings };
        updateAiUi(isSecondary);
        saveConfig();
    }
}

function renderAiPresets(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const select = document.getElementById(`ai-preset-select${suffix}`);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">-- 选择预设 --</option>';

    if (window.iphoneSimState[presetsKey]) {
        window.iphoneSimState[presetsKey].forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            select.appendChild(option);
        });
    }

    if (currentValue && window.iphoneSimState[presetsKey].some(p => p.name === currentValue)) {
        select.value = currentValue;
    }
}

function updateAiUi(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    
    const urlInput = document.getElementById(`ai-api-url${suffix}`);
    const keyInput = document.getElementById(`ai-api-key${suffix}`);
    const modelSelect = document.getElementById(`ai-model-select${suffix}`);
    const tempInput = document.getElementById(`ai-temperature${suffix}`);
    const tempValue = document.getElementById(`ai-temp-value${suffix}`);

    if (urlInput) urlInput.value = window.iphoneSimState[settingsKey].url || '';
    if (keyInput) keyInput.value = window.iphoneSimState[settingsKey].key || '';
    if (tempInput) tempInput.value = window.iphoneSimState[settingsKey].temperature || 0.7;
    if (tempValue) tempValue.textContent = window.iphoneSimState[settingsKey].temperature || 0.7;
    
    if (modelSelect && window.iphoneSimState[settingsKey].model) {
        if (!modelSelect.querySelector(`option[value="${window.iphoneSimState[settingsKey].model}"]`)) {
            const option = document.createElement('option');
            option.value = window.iphoneSimState[settingsKey].model;
            option.textContent = window.iphoneSimState[settingsKey].model;
            modelSelect.appendChild(option);
        }
        modelSelect.value = window.iphoneSimState[settingsKey].model;
    }
}

window.updateWhisperUi = function() {
    const urlInput = document.getElementById('whisper-api-url');
    const keyInput = document.getElementById('whisper-api-key');
    const modelInput = document.getElementById('whisper-model');
    const modeSelect = document.getElementById('whisper-connection-mode');
    const modelSelect = document.getElementById('whisper-model-select');

    if (urlInput) urlInput.value = window.iphoneSimState.whisperSettings.url || '';
    if (keyInput) keyInput.value = window.iphoneSimState.whisperSettings.key || '';
    if (modelInput) modelInput.value = window.iphoneSimState.whisperSettings.model || 'whisper-1';

    if (modeSelect && window.iphoneSimState.whisperSettings.url) {
        if (window.iphoneSimState.whisperSettings.url.includes('siliconflow.cn')) {
            modeSelect.value = 'siliconflow';
        } else {
            modeSelect.value = 'custom';
        }
    }

    if (modelSelect && window.iphoneSimState.whisperSettings.model) {
        modelSelect.value = window.iphoneSimState.whisperSettings.model;
    }
};

window.updateMinimaxUi = function() {
    const groupIdInput = document.getElementById('minimax-group-id');
    const apiKeyInput = document.getElementById('minimax-api-key');
    const modelInput = document.getElementById('minimax-model');
    const modelSelect = document.getElementById('minimax-model-select');

    if (groupIdInput) groupIdInput.value = window.iphoneSimState.minimaxSettings.groupId || '';
    if (apiKeyInput) apiKeyInput.value = window.iphoneSimState.minimaxSettings.key || '';
    if (modelInput) modelInput.value = window.iphoneSimState.minimaxSettings.model || 'speech-01-turbo';
    
    if (modelSelect && window.iphoneSimState.minimaxSettings.model) {
        modelSelect.value = window.iphoneSimState.minimaxSettings.model;
    }
};

// --- 语音功能 ---

function handleSendFakeVoice() {
    const text = document.getElementById('voice-fake-text').value.trim();
    const duration = document.getElementById('voice-fake-duration').value;

    if (!text) {
        alert('请输入语音内容文本');
        return;
    }

    const voiceData = {
        duration: parseInt(duration),
        text: text,
        isReal: false
    };

    sendMessage(JSON.stringify(voiceData), true, 'voice');
    document.getElementById('voice-input-modal').classList.add('hidden');
}

async function toggleVoiceRecording() {
    const micBtn = document.getElementById('voice-mic-btn');
    const statusText = document.getElementById('voice-recording-status');
    const resultDiv = document.getElementById('voice-real-result');
    const sendBtn = document.getElementById('send-real-voice-btn');
    
    if (!window.iphoneSimState.whisperSettings.url || !window.iphoneSimState.whisperSettings.key) {
        alert('请先在设置中配置 Whisper API');
        return;
    }

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000  // 降低采样率以减小文件大小
                }
            });
            
            // 使用SiliconFlow支持的音频格式：wav/mp3/pcm/opus/webm
            let options = {};
            let fileExt = 'webm';
            let mimeType = 'audio/webm';
            
            // 优先使用webm格式（最广泛支持）
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 };
                fileExt = 'webm';
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm', audioBitsPerSecond: 64000 };
                fileExt = 'webm';
                mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                options = { mimeType: 'audio/ogg;codecs=opus', audioBitsPerSecond: 64000 };
                fileExt = 'ogg';
                mimeType = 'audio/ogg;codecs=opus';
            }
            
            try {
                mediaRecorder = new MediaRecorder(stream, options);
                console.log('Using audio format:', mediaRecorder.mimeType);
            } catch (e) {
                console.warn('MediaRecorder options not supported, using default', e);
                mediaRecorder = new MediaRecorder(stream);
            }
            
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const actualMimeType = mediaRecorder.mimeType || mimeType;
                const audioBlob = new Blob(audioChunks, { type: actualMimeType });
                
                // 根据实际mime类型确定文件扩展名
                let actualExt = 'webm';
                if (actualMimeType.includes('mp4')) {
                    actualExt = 'm4a';
                } else if (actualMimeType.includes('webm')) {
                    actualExt = 'webm';
                }
                
                const audioFile = new File([audioBlob], `recording.${actualExt}`, { type: actualMimeType });
                
                const duration = Math.ceil((Date.now() - recordingStartTime) / 1000);
                recordedDuration = duration > 60 ? 60 : duration;

                // 只在需要时才转换为base64（减少内存占用）
                recordedAudio = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(audioBlob);
                });
                console.log('Audio processed, format:', actualMimeType, 'size:', audioBlob.size);

                micBtn.classList.remove('recording');
                statusText.textContent = '正在转文字...';
                statusText.style.color = '#007AFF';
                
                try {
                    const formData = new FormData();
                    formData.append('file', audioFile);
                    formData.append('model', window.iphoneSimState.whisperSettings.model || 'whisper-1');
                    formData.append('language', 'zh');  // 指定中文以提高准确率

                    let fetchUrl = window.iphoneSimState.whisperSettings.url;
                    // 移除尾部斜杠，规范化处理
                    if (fetchUrl.endsWith('/')) {
                        fetchUrl = fetchUrl.slice(0, -1);
                    }
                    
                    // 智能追加路径
                    if (!fetchUrl.endsWith('/audio/transcriptions')) {
                        fetchUrl = fetchUrl + '/audio/transcriptions';
                    }

                    const cleanKey = window.iphoneSimState.whisperSettings.key ? window.iphoneSimState.whisperSettings.key.trim() : '';

                    const response = await fetch(fetchUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${cleanKey}`
                        },
                        body: formData
                    });

                    if (!response.ok) {
                        if (response.status === 403) {
                            throw new Error(`API Error: 403 (权限不足或模型名称错误。SiliconFlow 请尝试使用 'FunAudioLLM/SenseVoiceSmall')`);
                        }
                        const errorText = await response.text();
                        throw new Error(`API Error: ${response.status} - ${errorText}`);
                    }

                    const data = await response.json();
                    let text = data.text || '';
                    
                    // 过滤emoji和特殊字符
                    text = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // 表情符号
                               .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // 符号和象形文字
                               .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // 交通和地图符号
                               .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // 旗帜
                               .replace(/[\u{2600}-\u{26FF}]/gu, '')   // 杂项符号
                               .replace(/[\u{2700}-\u{27BF}]/gu, '')   // 装饰符号
                               .trim();
                    
                    recordedText = text;
                    
                    if (!recordedText) {
                        resultDiv.textContent = '未识别到内容，请重试';
                        statusText.textContent = '识别失败';
                        statusText.style.color = '#FF9500';
                    } else {
                        resultDiv.textContent = recordedText;
                        statusText.textContent = '录音结束';
                        statusText.style.color = '#888';
                        sendBtn.disabled = false;
                    }

                } catch (error) {
                    console.error('Whisper API Error:', error);
                    let errorMsg = error.message;
                    if (errorMsg === 'Failed to fetch' || errorMsg.includes('NetworkError')) {
                        errorMsg = '网络连接失败\n\n可能原因：\n1. CORS跨域问题（服务器配置错误）\n2. 网络超时\n3. API地址错误\n\n⚠️ 如果是SiliconFlow的CORS错误，这是服务器端配置问题，请联系API提供商修复';
                    } else if (errorMsg.includes('load failed')) {
                        errorMsg = '加载失败 (请检查网络连接和API配置)';
                    }
                    resultDiv.textContent = '转文字失败: ' + errorMsg;
                    resultDiv.style.whiteSpace = 'pre-wrap'; // 支持换行显示
                    statusText.textContent = '出错';
                    statusText.style.color = '#FF3B30';
                }
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            recordingStartTime = Date.now();
            
            micBtn.classList.add('recording');
            statusText.textContent = '正在录音... (点击停止)';
            statusText.style.color = '#FF3B30';
            resultDiv.textContent = '';
            sendBtn.disabled = true;
            recordedText = '';

        } catch (err) {
            console.error('无法访问麦克风:', err);
            alert('无法访问麦克风，请检查权限。错误: ' + err.message);
        }

    } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            isRecording = false;
        }
    }
}

function handleSendRealVoice() {
    if (!recordedText) recordedText = '[语音]';

    const voiceData = {
        duration: recordedDuration || 1,
        text: recordedText,
        isReal: true,
        audio: recordedAudio
    };

    sendMessage(JSON.stringify(voiceData), true, 'voice');
    document.getElementById('voice-input-modal').classList.add('hidden');
}

function startOutgoingCall() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    // 尝试解锁音频上下文
    try {
        if (!globalVoicePlayer) {
            globalVoicePlayer = new Audio();
        }
        globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
        globalVoicePlayer.play().catch(e => console.log('Outgoing call audio unlock failed:', e));
    } catch(e) {
        console.error('Audio unlock error', e);
    }

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    const timeEl = document.getElementById('voice-call-time');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '等待对方接听...';
    timeEl.textContent = '正在呼叫'; 
    
    if (contact.voiceCallBg) {
        bg.style.backgroundImage = `url(${contact.voiceCallBg})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.remove('hidden');

    screen.classList.remove('hidden');

    const cancelBtn = document.getElementById('voice-call-cancel-btn');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = () => {
            closeVoiceCallScreen('user_cancel');
        };
    }

    makeAiCallDecision(contact);
}

async function makeAiCallDecision(contact) {
    const waitTime = 2000 + Math.random() * 3000;
    const startTime = Date.now();

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    let shouldAccept = true;

    if (settings.url && settings.key) {
        try {
            const history = window.iphoneSimState.chatHistory[contact.id] || [];
            const recentHistory = history.slice(-10).map(m => {
                let content = m.content;
                if (m.type === 'image') content = '[图片]';
                else if (m.type === 'sticker') content = '[表情包]';
                return `${m.role === 'user' ? '用户' : '你'}: ${content}`;
            }).join('\n');
            
            const systemPrompt = `你现在扮演 ${contact.name}。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

用户正在向你发起语音通话请求。
请根据你们最近的聊天记录和你的当前状态，决定是否接听。
最近聊天记录：
${recentHistory}

请只回复一个单词：
- 如果接听，回复 "ACCEPT"
- 如果拒绝，回复 "REJECT"`;

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
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: 'ACTION: INCOMING_VOICE_CALL' }
                    ],
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.choices[0].message.content.trim().toUpperCase();
                console.log('AI Call Decision:', reply);
                if (reply.includes('REJECT')) {
                    shouldAccept = false;
                }
            }
        } catch (e) {
            console.error('AI Call Decision API Error:', e);
        }
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < waitTime) {
        await new Promise(r => setTimeout(r, waitTime - elapsed));
    }

    const screen = document.getElementById('voice-call-screen');
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (screen.classList.contains('hidden') || (outgoingActions && outgoingActions.classList.contains('hidden'))) {
        return;
    }

    if (shouldAccept) {
        openVoiceCallScreen();
    } else {
        const statusEl = document.getElementById('voice-call-status');
        if (statusEl) statusEl.textContent = '对方已拒绝';
        
        setTimeout(() => {
            closeVoiceCallScreen('ai_reject');
        }, 1500);
    }
}

function openVoiceCallScreen() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    if (!window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = [];
    }
    voiceCallStartIndex = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].length;
    currentVoiceCallStartTime = Date.now();

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const timeEl = document.getElementById('voice-call-time');
    const contentContainer = document.getElementById('voice-call-content');

    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    
    if (contact.voiceCallBg) {
        bg.style.backgroundImage = `url(${contact.voiceCallBg})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    voiceCallSeconds = 0;
    timeEl.textContent = '00:00';
    contentContainer.innerHTML = '';
    document.getElementById('voice-call-status').textContent = '正在通话中...';
    
    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.remove('hidden');
    
    document.getElementById('voice-call-content').classList.remove('hidden');
    document.querySelector('.voice-call-input-area').classList.remove('hidden');
    
    document.getElementById('voice-call-actions-active').classList.remove('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.add('hidden');

    screen.classList.remove('hidden');

    if (!globalVoicePlayer) {
        globalVoicePlayer = new Audio();
    }
    globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
    globalVoicePlayer.play().catch(e => console.log('Audio unlock failed (harmless if not on mobile):', e));

    if (voiceCallTimer) clearInterval(voiceCallTimer);
    
    const updateTime = () => {
        const mins = Math.floor(voiceCallSeconds / 60).toString().padStart(2, '0');
        const secs = (voiceCallSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;
        
        if (timeEl) timeEl.textContent = timeStr;
        
        const floatTimeEl = document.getElementById('float-call-time');
        if (floatTimeEl) floatTimeEl.textContent = timeStr;
    };
    
    updateTime();

    voiceCallTimer = setInterval(() => {
        voiceCallSeconds++;
        updateTime();
    }, 1000);

    // 初始化通话页面按钮
    initVoiceCallButtons();
}

// 初始化通话页面按钮事件
function initVoiceCallButtons() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const bg = document.getElementById('voice-call-bg');
    const bgInput = document.getElementById('voice-call-bg-input');
    const newBg = bg.cloneNode(true);
    bg.parentNode.replaceChild(newBg, bg);
    newBg.onclick = () => bgInput.click();
    
    const newBgInput = bgInput.cloneNode(true);
    bgInput.parentNode.replaceChild(newBgInput, bgInput);
    newBgInput.onchange = (e) => handleVoiceCallBgUpload(e, contact);

    const hangupBtn = document.getElementById('voice-call-hangup-btn');
    const minimizeBtn = document.getElementById('voice-call-minimize-btn');
    const addBtn = document.getElementById('voice-call-add-btn');

    const newHangupBtn = hangupBtn.cloneNode(true);
    hangupBtn.parentNode.replaceChild(newHangupBtn, hangupBtn);
    newHangupBtn.onclick = () => closeVoiceCallScreen('user');

    const newMinimizeBtn = minimizeBtn.cloneNode(true);
    minimizeBtn.parentNode.replaceChild(newMinimizeBtn, minimizeBtn);
    newMinimizeBtn.onclick = minimizeVoiceCallScreen;

    const newAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
    newAddBtn.onclick = () => alert('添加成员功能开发中...');
    
    const floatWindow = document.getElementById('voice-call-float');
    if (floatWindow) {
        makeVoiceCallDraggable(floatWindow, restoreVoiceCallScreen);
    }

    const micBtn = document.getElementById('voice-call-mic-btn');
    const newMicBtn = micBtn.cloneNode(true);
    micBtn.parentNode.replaceChild(newMicBtn, micBtn);
    
    // 默认关闭麦克风
    newMicBtn.classList.remove('active');
    newMicBtn.nextElementSibling.textContent = '麦克风已关';
    stopVoiceCallVAD();

    newMicBtn.onclick = () => {
        newMicBtn.classList.toggle('active');
        const span = newMicBtn.nextElementSibling;
        const isActive = newMicBtn.classList.contains('active');
        span.textContent = isActive ? '麦克风已开' : '麦克风已关';

        if (isActive) {
            startVoiceCallVAD();
        } else {
            stopVoiceCallVAD();
        }
    };

    const speakerBtn = document.getElementById('voice-call-speaker-btn');
    const newSpeakerBtn = speakerBtn.cloneNode(true);
    speakerBtn.parentNode.replaceChild(newSpeakerBtn, speakerBtn);
    newSpeakerBtn.onclick = () => {
        newSpeakerBtn.classList.toggle('active');
        const span = newSpeakerBtn.nextElementSibling;
        span.textContent = newSpeakerBtn.classList.contains('active') ? '扬声器已开' : '扬声器已关';
    };

    const sendBtn = document.getElementById('voice-call-send-btn');
    const input = document.getElementById('voice-call-input');
    
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    
    const handleSend = () => {
        const text = input.value.trim();
        if (text) {
            input.value = '';
            sendMessage(text, true, 'voice_call_text');
            addVoiceCallMessage(text, 'user');
            generateVoiceCallAiReply();
        }
    };

    newSendBtn.onclick = handleSend;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') handleSend();
    };
}

function closeVoiceCallScreen(hangupType = 'user') {
    const screen = document.getElementById('voice-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.add('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');
    
    if (voiceCallTimer) clearInterval(voiceCallTimer);
    voiceCallTimer = null;

    isProcessingResponse = false; // 重置状态
    stopVoiceCallVAD();

    const actionsIncoming = document.getElementById('voice-call-actions-incoming');
    if (actionsIncoming && !actionsIncoming.classList.contains('hidden')) {
        sendMessage('通话已被拒绝', false, 'call_rejected');
        setTimeout(() => {
            generateAiReply();
        }, 1000);
        return;
    }

    const actionsOutgoing = document.getElementById('voice-call-actions-outgoing');
    if (actionsOutgoing && !actionsOutgoing.classList.contains('hidden')) {
        if (hangupType === 'user_cancel') {
            sendMessage('已取消通话', true, 'text');
        } else if (hangupType === 'ai_reject') {
            sendMessage('对方拒绝了通话', false, 'text');
        }
        return;
    }

    const duration = Math.ceil((Date.now() - currentVoiceCallStartTime) / 1000);
    const mins = Math.floor(duration / 60).toString().padStart(2, '0');
    const secs = (duration % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    const isUserHangup = hangupType === 'user';
    sendMessage(`通话时长：${timeStr}`, isUserHangup, 'text');

    summarizeVoiceCall(window.iphoneSimState.currentChatContactId, voiceCallStartIndex);
}

function startIncomingCall(contact) {
    if (!contact) return;
    
    window.iphoneSimState.currentChatContactId = contact.id;

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '邀请你进行语音通话...';
    
    if (contact.voiceCallBg) {
        bg.style.backgroundImage = `url(${contact.voiceCallBg})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.remove('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.add('hidden');

    // 重新绑定按钮事件为语音通话
    const acceptBtn = document.getElementById('voice-call-accept-btn');
    const rejectBtn = document.getElementById('voice-call-reject-btn');
    
    // 克隆以移除旧的事件监听器
    const newAcceptBtn = acceptBtn.cloneNode(true);
    acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
    newAcceptBtn.onclick = acceptIncomingCall;

    const newRejectBtn = rejectBtn.cloneNode(true);
    rejectBtn.parentNode.replaceChild(newRejectBtn, rejectBtn);
    newRejectBtn.onclick = rejectIncomingCall;
    
    screen.classList.remove('hidden');
}

function startIncomingVideoCall(contact) {
    if (!contact) return;
    
    window.iphoneSimState.currentChatContactId = contact.id;

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '邀请你进行视频通话...';
    
    // 优先使用视频通话背景
    if (contact.videoCallBgImage) {
        bg.style.backgroundImage = `url(${contact.videoCallBgImage})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.remove('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.add('hidden');

    // 重新绑定按钮事件为视频通话
    const acceptBtn = document.getElementById('voice-call-accept-btn');
    const rejectBtn = document.getElementById('voice-call-reject-btn');
    
    const newAcceptBtn = acceptBtn.cloneNode(true);
    acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
    newAcceptBtn.onclick = acceptIncomingVideoCall;

    const newRejectBtn = rejectBtn.cloneNode(true);
    rejectBtn.parentNode.replaceChild(newRejectBtn, rejectBtn);
    newRejectBtn.onclick = rejectIncomingVideoCall;
    
    screen.classList.remove('hidden');
}

window.acceptIncomingVideoCall = function() {
    // 关闭呼叫界面
    document.getElementById('voice-call-screen').classList.add('hidden');
    // 开启视频通话界面
    startVideoCall();
};

window.rejectIncomingVideoCall = function() {
    document.getElementById('voice-call-screen').classList.add('hidden');
    sendMessage('已拒绝视频通话', true, 'text');
};

window.acceptIncomingCall = function() {
    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.remove('hidden');

    document.getElementById('voice-call-content').classList.remove('hidden');
    document.querySelector('.voice-call-input-area').classList.remove('hidden');
    
    document.getElementById('voice-call-actions-active').classList.remove('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    document.getElementById('voice-call-status').textContent = '正在通话中...';
    
    // 解锁音频上下文（移动端需要用户交互才能播放音频）
    if (!globalVoicePlayer) {
        globalVoicePlayer = new Audio();
    }
    // 播放一段极短的静音音频来解锁音频上下文
    globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
    globalVoicePlayer.play().then(() => {
        console.log('Audio context unlocked successfully on accept call');
    }).catch(e => {
        console.log('Audio unlock attempt (may fail on some browsers):', e);
    });
    
    if (!window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = [];
    }
    voiceCallStartIndex = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].length;
    currentVoiceCallStartTime = Date.now();
    
    voiceCallSeconds = 0;
    document.getElementById('voice-call-time').textContent = '00:00';
    
    if (voiceCallTimer) clearInterval(voiceCallTimer);
    voiceCallTimer = setInterval(() => {
        voiceCallSeconds++;
        const mins = Math.floor(voiceCallSeconds / 60).toString().padStart(2, '0');
        const secs = (voiceCallSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;
        document.getElementById('voice-call-time').textContent = timeStr;
        const floatTimeEl = document.getElementById('float-call-time');
        if (floatTimeEl) floatTimeEl.textContent = timeStr;
    }, 1000);
    
    // 初始化通话页面按钮
    initVoiceCallButtons();
    
    const micBtn = document.getElementById('voice-call-mic-btn');
    if (micBtn && micBtn.classList.contains('active')) {
        startVoiceCallVAD();
    }
};

window.rejectIncomingCall = function() {
    closeVoiceCallScreen('user');
};

async function summarizeVoiceCall(contactId, startIndex) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings;
    if (!settings.url || !settings.key) return;

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    const callMessages = history.slice(startIndex);

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

    const callTextMessages = callMessages
        .filter(m => m && m.type === 'voice_call_text')
        .map(m => {
            let text = String(m.content || '');
            try {
                const data = JSON.parse(text);
                if (typeof data.text === 'string') text = data.text;
            } catch (e) {}
            return {
                role: m.role,
                time: m.time,
                content: String(text || '').trim()
            };
        })
        .filter(m => m.content);

    const callContent = callTextMessages
        .map(m => `${m.role === 'user' ? userName : contactLabel}: ${m.content}`)
        .join('\n');

    if (!callContent) return;

    const totalMessageCount = callMessages.length;
    const lengthRange = typeof getSummaryLengthRangeByCount === 'function'
        ? getSummaryLengthRangeByCount(totalMessageCount, 'call')
        : { count: Math.max(1, totalMessageCount), target: 120, min: 90, max: 260 };
    console.log('[summary-length-call]', {
        count: lengthRange.count,
        target: lengthRange.target,
        min: lengthRange.min,
        max: lengthRange.max,
        source: 'call_summary'
    });

    showNotification('正在总结通话...');

    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const systemPrompt = typeof buildStructuredSummaryPrompt === 'function'
        ? buildStructuredSummaryPrompt({
            channel: 'call',
            userLabel: userName,
            contactLabel,
            range: lengthRange,
            dateStr,
            timeStr,
            totalMessageCount,
            detailModeHint: '当前是通话总结，请输出时间线提要：优先具体事件链、当前状态与下一步，并尽量摘录原话短句。'
        })
        : `你是一个通话记录总结助手。请返回严格JSON，包含 context/timeline_events/current_state/next_actions/time_points/quote_snippets。`;

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
                    { role: 'user', content: callContent }
                ],
                temperature: 0.35,
                max_tokens: 520
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

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
            if (apiErrorMsg) throw new Error(`通话总结接口异常: ${apiErrorMsg}`);
            throw new Error('通话总结接口返回为空或格式不兼容');
        }

        let structuredPayload = null;
        let summary = rawSummary;
        if (typeof buildNarrativeSummaryFromStructuredResponse === 'function') {
            const structured = buildNarrativeSummaryFromStructuredResponse(
                rawSummary,
                contact,
                callTextMessages,
                lengthRange,
                userName,
                {
                    channel: 'call',
                    rangeLabel: '语音通话',
                    totalMessageCount,
                    dateStr,
                    timeStr,
                    detailModeHint: '当前是通话总结，请输出时间线提要：优先具体事件链、当前状态与下一步，并尽量摘录原话短句。'
                }
            );
            structuredPayload = structured.payload;
            summary = structured.paragraph || rawSummary;
        }

        if (typeof ensureDetailedSummaryText === 'function') {
            summary = ensureDetailedSummaryText(summary, contact, callTextMessages, lengthRange, userName, {
                channel: 'call',
                rangeLabel: '语音通话',
                totalMessageCount,
                structuredPayload
            });
        }
        summary = String(summary || '').trim();
        
        if (summary && summary !== '无' && summary !== '无。') {
            const summaryTitle = typeof buildMemoryDisplayTitle === 'function'
                ? buildMemoryDisplayTitle({
                    title: '',
                    content: summary,
                    structuredSummary: structuredPayload,
                    memoryTags: ['short_term']
                })
                : '';
            const memoryContent = `【通话回忆】 ${summary}`;
            if (typeof window.createMemoryCandidate === 'function') {
                const created = window.createMemoryCandidate(contact.id, {
                    title: summaryTitle,
                    content: memoryContent,
                    suggestedTags: ['short_term'],
                    source: 'call_summary',
                    confidence: 0.8,
                    range: '语音通话',
                    reason: '语音通话总结'
                });
                saveConfig();
                if (created && created.status === 'pending') {
                    showNotification('通话总结已加入待确认', 2000, 'success');
                } else if (created) {
                    showNotification('通话总结完成', 2000, 'success');
                } else {
                    showNotification('手动模式：未自动写入记忆', 2200);
                }
            } else {
                window.iphoneSimState.memories.push({
                    id: Date.now(),
                    contactId: contact.id,
                    content: memoryContent,
                    time: Date.now(),
                    range: '语音通话'
                });
                saveConfig();
                showNotification('通话总结完成', 2000, 'success');
            }
            console.log('通话总结完成:', summary);
        }

    } catch (error) {
        console.error('通话总结失败:', error);
        showNotification('总结出错', 2000, 'error');
    }
}

function minimizeVoiceCallScreen() {
    const screen = document.getElementById('voice-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.add('hidden');
    if (floatWindow) floatWindow.classList.remove('hidden');
}

function restoreVoiceCallScreen() {
    const screen = document.getElementById('voice-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.remove('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');
}

function makeVoiceCallDraggable(element, onClickCallback) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    
    element.addEventListener('mousedown', dragMouseDown);
    element.addEventListener('touchstart', dragMouseDown, { passive: false });
    
    element.onclick = null;

    function dragMouseDown(e) {
        e = e || window.event;
        isDragging = false;

        if (e.type === 'touchstart') {
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
            
            document.addEventListener('touchend', closeDragElement, { passive: false });
            document.addEventListener('touchmove', elementDrag, { passive: false });
        } else {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
    }

    function elementDrag(e) {
        e = e || window.event;
        
        if (e.cancelable) {
            e.preventDefault();
        }
        
        isDragging = true;
        
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;
        
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        
        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;
        
        if (newTop < 0) newTop = 0;
        if (newTop > maxY) newTop = maxY;
        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxX) newLeft = maxX;

        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
        element.style.right = "auto";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        
        document.removeEventListener('touchend', closeDragElement);
        document.removeEventListener('touchmove', elementDrag);
        
        if (!isDragging && onClickCallback) {
            onClickCallback();
        }
    }
}

function handleVoiceCallBgUpload(e, contact) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        contact.voiceCallBg = base64;
        document.getElementById('voice-call-bg').style.backgroundImage = `url(${base64})`;
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function handleVideoCallBgUpload(e) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        contact.videoCallBgImage = base64;
        saveConfig();
        alert('视频通话背景已更新');
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function handleVideoSnapshot() {
    const videoEl = document.getElementById('video-local-stream');
    if (!videoCallLocalStream || !videoEl || videoEl.paused || videoEl.ended) {
        alert('请先开启摄像头');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // 绘制视频帧
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // 暂存截图，不发送也不显示
    pendingVideoSnapshot = base64;
    
    // 提示用户
    if (window.showChatToast) {
        window.showChatToast('画面已截取，将随下条消息发送');
    } else {
        // Fallback toast implementation
        const toast = document.createElement('div');
        toast.className = 'chat-toast';
        toast.textContent = '画面已截取，将随下条消息发送';
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.remove('hidden'), 10);
        setTimeout(() => {
            toast.classList.add('hidden');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

function startOutgoingVideoCall() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    // 尝试解锁音频上下文
    try {
        if (!globalVoicePlayer) {
            globalVoicePlayer = new Audio();
        }
        globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
        globalVoicePlayer.play().catch(e => console.log('Outgoing video call audio unlock failed:', e));
    } catch(e) {
        console.error('Audio unlock error', e);
    }

    // 复用 voice-call-screen 作为呼叫界面
    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    const timeEl = document.getElementById('voice-call-time');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '等待对方接受视频通话...';
    timeEl.textContent = '正在呼叫'; 
    
    // 使用视频通话的背景设置，如果没有则回退到聊天背景
    if (contact.videoCallBgImage) {
        bg.style.backgroundImage = `url(${contact.videoCallBgImage})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    // 隐藏不必要的元素
    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.remove('hidden');

    screen.classList.remove('hidden');

    // 绑定取消按钮
    const cancelBtn = document.getElementById('voice-call-cancel-btn');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = () => {
            closeVoiceCallScreen('user_cancel');
        };
    }

    makeAiVideoCallDecision(contact);
}

async function makeAiVideoCallDecision(contact) {
    const waitTime = 2000 + Math.random() * 3000;
    const startTime = Date.now();

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    let shouldAccept = true;

    if (settings.url && settings.key) {
        try {
            const history = window.iphoneSimState.chatHistory[contact.id] || [];
            const recentHistory = history.slice(-10).map(m => {
                let content = m.content;
                if (m.type === 'image') content = '[图片]';
                else if (m.type === 'sticker') content = '[表情包]';
                return `${m.role === 'user' ? '用户' : '你'}: ${content}`;
            }).join('\n');
            
            const systemPrompt = `你现在扮演 ${contact.name}。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

用户正在向你发起【视频通话】请求。
请根据你们最近的聊天记录和你的当前状态，决定是否接听。
最近聊天记录：
${recentHistory}

请只回复一个单词：
- 如果接听，回复 "ACCEPT"
- 如果拒绝，回复 "REJECT"`;

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
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: 'ACTION: INCOMING_VIDEO_CALL' }
                    ],
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.choices[0].message.content.trim().toUpperCase();
                console.log('AI Video Call Decision:', reply);
                if (reply.includes('REJECT')) {
                    shouldAccept = false;
                }
            }
        } catch (e) {
            console.error('AI Video Call Decision API Error:', e);
        }
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < waitTime) {
        await new Promise(r => setTimeout(r, waitTime - elapsed));
    }

    // 检查呼叫界面是否还开着
    const screen = document.getElementById('voice-call-screen');
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    // 必须确保当前显示的是 outgoing actions，说明还在呼叫中
    if (screen.classList.contains('hidden') || (outgoingActions && outgoingActions.classList.contains('hidden'))) {
        return;
    }

    if (shouldAccept) {
        // 关闭呼叫界面（voice-call-screen）
        screen.classList.add('hidden');
        // 开启视频通话界面
        startVideoCall();
    } else {
        const statusEl = document.getElementById('voice-call-status');
        if (statusEl) statusEl.textContent = '对方已拒绝';
        
        setTimeout(() => {
            closeVoiceCallScreen('ai_reject');
        }, 1500);
    }
}

function startVideoCall() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    if (!window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = [];
    }
    voiceCallStartIndex = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].length;

    const screen = document.getElementById('video-call-screen');
    const bg = document.getElementById('video-call-bg');
    
    if (contact.videoCallBgImage) {
        bg.style.backgroundImage = `url(${contact.videoCallBgImage})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    // 绑定按钮事件
    const micBtn = document.getElementById('video-call-mic-btn');
    
    // 默认关闭麦克风
    micBtn.classList.remove('active');
    micBtn.nextElementSibling.textContent = '麦克风已关';
    stopVoiceCallVAD();

    micBtn.onclick = () => {
        micBtn.classList.toggle('active');
        const span = micBtn.nextElementSibling;
        const isActive = micBtn.classList.contains('active');
        span.textContent = isActive ? '麦克风已开' : '麦克风已关';

        if (isActive) {
            startVoiceCallVAD();
        } else {
            stopVoiceCallVAD();
        }
    };

    const cameraBtn = document.getElementById('video-call-camera-btn');
    cameraBtn.onclick = toggleVideoCamera;
    // 重置摄像头按钮状态
    cameraBtn.classList.remove('active');
    cameraBtn.nextElementSibling.textContent = '摄像头已关';
    document.getElementById('video-local-preview').classList.add('hidden');

    const hangupBtn = document.getElementById('video-call-hangup-btn');
    hangupBtn.onclick = closeVideoCallScreen;

    const speakerBtn = document.getElementById('video-call-speaker-btn');
    speakerBtn.onclick = () => {
        speakerBtn.classList.toggle('active');
        const span = speakerBtn.nextElementSibling;
        span.textContent = speakerBtn.classList.contains('active') ? '扬声器已开' : '扬声器已关';
    };

    // 最小化按钮
    const minimizeBtn = document.getElementById('video-call-minimize-btn');
    if (minimizeBtn) {
        minimizeBtn.onclick = minimizeVideoCallScreen;
    }

    // 截图按钮
    const snapshotBtn = document.getElementById('video-call-snapshot-btn');
    if (snapshotBtn) {
        const newSnapshotBtn = snapshotBtn.cloneNode(true);
        snapshotBtn.parentNode.replaceChild(newSnapshotBtn, snapshotBtn);
        newSnapshotBtn.onclick = handleVideoSnapshot;
    }

    // 自动截图设置按钮 (右上角加号)
    const addBtn = document.getElementById('video-call-add-btn');
    if (addBtn) {
        const newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        newAddBtn.onclick = () => {
            const interval = contact.autoSnapshotInterval || 0;
            document.getElementById('auto-snapshot-interval').value = interval === 0 ? '' : interval;
            document.getElementById('auto-snapshot-modal').classList.remove('hidden');
        };
    }

    // 发送消息
    const sendBtn = document.getElementById('video-call-send-btn');
    const input = document.getElementById('video-call-input');
    
    const handleSend = () => {
        const text = input.value.trim();
        if (text) {
            input.value = '';
            sendMessage(text, true, 'voice_call_text');
            addVoiceCallMessage(text, 'user'); // 复用 addVoiceCallMessage，它会自动判断容器
            generateVoiceCallAiReply(); 
        }
    };

    if (sendBtn) {
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        newSendBtn.onclick = handleSend;
    }
    
    if (input) {
        input.onkeydown = (e) => {
            if (e.key === 'Enter') handleSend();
        };
    }

    // 清空内容区域
    const contentContainer = document.getElementById('video-call-content');
    if (contentContainer) contentContainer.innerHTML = '';

    screen.classList.remove('hidden');
    currentVideoCallStartTime = Date.now();

    // 尝试解锁音频上下文
    try {
        if (!globalVoicePlayer) {
            globalVoicePlayer = new Audio();
        }
        // 播放极短的静音
        globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
        globalVoicePlayer.play().then(() => {
            console.log('Video call audio context unlocked');
        }).catch(e => {
            console.log('Video call audio unlock failed (user interaction needed):', e);
        });
    } catch(e) {
        console.error('Video call audio setup error', e);
    }

    // 计时器
    if (videoCallTimer) clearInterval(videoCallTimer);
    videoCallSeconds = 0;
    const timeEl = document.getElementById('video-call-time');
    if (timeEl) timeEl.textContent = '00:00';

    videoCallTimer = setInterval(() => {
        videoCallSeconds++;
        const mins = Math.floor(videoCallSeconds / 60).toString().padStart(2, '0');
        const secs = (videoCallSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;
        if (timeEl) timeEl.textContent = timeStr;
    }, 1000);

    // 启动自动截图
    startAutoSnapshot(contact);
}

function minimizeVideoCallScreen() {
    const screen = document.getElementById('video-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.add('hidden');
    if (floatWindow) {
        floatWindow.classList.remove('hidden');
        makeVoiceCallDraggable(floatWindow, restoreVideoCallScreen);
    }
}

function restoreVideoCallScreen() {
    const screen = document.getElementById('video-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.remove('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');
}

async function toggleVideoCamera() {
    const cameraBtn = document.getElementById('video-call-camera-btn');
    const preview = document.getElementById('video-local-preview');
    const videoEl = document.getElementById('video-local-stream');
    const span = cameraBtn.nextElementSibling;

    if (videoCallLocalStream) {
        // 关闭摄像头
        videoCallLocalStream.getTracks().forEach(track => track.stop());
        videoCallLocalStream = null;
        videoEl.srcObject = null;
        preview.classList.add('hidden');
        cameraBtn.classList.remove('active');
        span.textContent = '摄像头已关';
    } else {
        // 开启摄像头
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoCallLocalStream = stream;
            videoEl.srcObject = stream;
            preview.classList.remove('hidden');
            cameraBtn.classList.add('active');
            span.textContent = '摄像头已开';
        } catch (err) {
            console.error('无法访问摄像头:', err);
            alert('无法访问摄像头，请检查权限');
        }
    }
}

function closeVideoCallScreen() {
    const screen = document.getElementById('video-call-screen');
    const floatWindow = document.getElementById('voice-call-float');

    screen.classList.add('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');

    if (videoCallTimer) {
        clearInterval(videoCallTimer);
        videoCallTimer = null;
    }

    if (autoSnapshotTimer) {
        clearInterval(autoSnapshotTimer);
        autoSnapshotTimer = null;
    }

    if (videoCallLocalStream) {
        videoCallLocalStream.getTracks().forEach(track => track.stop());
        videoCallLocalStream = null;
        document.getElementById('video-local-stream').srcObject = null;
    }

    isProcessingResponse = false; // 重置状态
    stopVoiceCallVAD(); // 确保关闭麦克风和VAD

    const duration = Math.ceil((Date.now() - currentVideoCallStartTime) / 1000);
    const mins = Math.floor(duration / 60).toString().padStart(2, '0');
    const secs = (duration % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    sendMessage(`视频通话时长：${timeStr}`, true, 'text');

    summarizeVoiceCall(window.iphoneSimState.currentChatContactId, voiceCallStartIndex);
}

function startAutoSnapshot(contact) {
    if (autoSnapshotTimer) {
        clearInterval(autoSnapshotTimer);
        autoSnapshotTimer = null;
    }

    const interval = contact.autoSnapshotInterval || 0;
    if (interval < 5) return; // 最小间隔5秒

    console.log(`启动自动截图，间隔 ${interval} 秒`);

    autoSnapshotTimer = setInterval(() => {
        const videoEl = document.getElementById('video-local-stream');
        if (!videoCallLocalStream || !videoEl || videoEl.paused || videoEl.ended) {
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.6); // 稍微降低质量以加快传输

        // 暂存截图，不立即发送
        pendingVideoSnapshot = base64;
        console.log('自动截图已暂存，等待用户发送消息');

    }, interval * 1000);
}

function handleSaveAutoSnapshotSettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const intervalInput = document.getElementById('auto-snapshot-interval');
    let interval = parseInt(intervalInput.value);
    
    if (isNaN(interval) || interval < 0) interval = 0;
    if (interval > 0 && interval < 5) {
        alert('间隔不能小于5秒');
        return;
    }

    contact.autoSnapshotInterval = interval;
    saveConfig();
    
    document.getElementById('auto-snapshot-modal').classList.add('hidden');
    
    // 如果当前正在视频通话，立即应用新设置
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        startAutoSnapshot(contact);
    }
    
    if (window.showChatToast) {
        window.showChatToast(interval > 0 ? `已开启自动截图 (每${interval}秒)` : '已关闭自动截图');
    }
}

function addVoiceCallMessage(text, role) {
    // 尝试添加到语音通话容器
    const voiceContainer = document.getElementById('voice-call-content');
    if (voiceContainer && !document.getElementById('voice-call-screen').classList.contains('hidden')) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `voice-call-msg ${role}`;
        msgDiv.textContent = text;
        voiceContainer.appendChild(msgDiv);
        voiceContainer.scrollTop = voiceContainer.scrollHeight;
    }

    // 尝试添加到视频通话容器
    const videoContainer = document.getElementById('video-call-content');
    if (videoContainer && !document.getElementById('video-call-screen').classList.contains('hidden')) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `voice-call-msg ${role}`; // 复用样式
        
        if (role === 'description') {
            // 描述消息可能包含换行，使用 innerText 或 textContent 都可以，但为了安全使用 textContent
            // 如果需要支持 HTML 格式（如加粗），可以改用 innerHTML，但这里纯文本即可
            msgDiv.textContent = text;
        } else {
            if (text.startsWith('<img')) {
                msgDiv.innerHTML = text;
            } else {
                msgDiv.textContent = text;
            }
        }
        
        videoContainer.appendChild(msgDiv);
        videoContainer.scrollTop = videoContainer.scrollHeight;
    }
}

function playVoiceCallAudio(audioData) {
    if (!audioData) {
        console.error('playVoiceCallAudio: No audio data provided');
        return;
    }
    
    // 验证音频数据格式
    if (!audioData.startsWith('data:audio/')) {
        console.error('playVoiceCallAudio: Invalid audio data format:', audioData.substring(0, 50));
        return;
    }
    
    console.log('playVoiceCallAudio: Starting playback, audio data length:', audioData.length);
    
    if (!globalVoicePlayer) {
        globalVoicePlayer = new Audio();
        console.log('playVoiceCallAudio: Created new Audio instance');
    }
    
    isAiSpeaking = true;
    console.log('AI started speaking, VAD paused');

    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }

    if (statusEl) statusEl.textContent = '对方正在说话...';

    // 停止之前的播放
    try {
        globalVoicePlayer.pause();
        globalVoicePlayer.currentTime = 0;
    } catch (e) {
        console.log('playVoiceCallAudio: Error stopping previous audio:', e);
    }

    // 设置音频源
    globalVoicePlayer.src = audioData;
    
    // 监听加载完成事件
    globalVoicePlayer.onloadeddata = () => {
        console.log('playVoiceCallAudio: Audio loaded, duration:', globalVoicePlayer.duration);
    };
    
    globalVoicePlayer.onended = () => {
        isAiSpeaking = false;
        isProcessingResponse = false;
        console.log('AI stopped speaking, VAD resumed');
        if (statusEl) statusEl.textContent = '正在聆听...';
    };
    
    globalVoicePlayer.onerror = (e) => {
        console.error('playVoiceCallAudio: Audio error:', e, 'Error code:', globalVoicePlayer.error?.code, 'Message:', globalVoicePlayer.error?.message);
        isAiSpeaking = false;
        isProcessingResponse = false;
        if (statusEl) statusEl.textContent = '音频播放失败';
        
        // 显示友好提示
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && window.showChatToast) {
            window.showChatToast('TTS音频播放失败，请检查音频格式设置');
        }
    };

    // 预加载音频
    globalVoicePlayer.load();
    
    // 尝试播放
    const playPromise = globalVoicePlayer.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('playVoiceCallAudio: Playback started successfully');
        }).catch(e => {
            console.error('playVoiceCallAudio: Auto play failed:', e.name, e.message);
            isAiSpeaking = false;
            isProcessingResponse = false;
            
            if (statusEl) {
                if (e.name === 'NotAllowedError') {
                    statusEl.textContent = '需要用户交互才能播放';
                } else if (e.name === 'NotSupportedError') {
                    statusEl.textContent = '音频格式不支持';
                } else {
                    statusEl.textContent = '播放失败';
                }
            }
            
            // 移动端提示
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile && window.showChatToast) {
                window.showChatToast('TTS播放失败: ' + e.message);
            }
        });
    }
}

async function generateVoiceCallAiReply() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    
    // 动态获取状态元素
    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }

    if (!settings.url || !settings.key) {
        if (statusEl) statusEl.textContent = 'API未配置';
        return;
    }

    if (statusEl) statusEl.textContent = '对方正在思考...';

    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    
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

    let memoryContext = '';
    if (typeof window.buildMemoryContextByPolicy === 'function') {
        memoryContext = window.buildMemoryContextByPolicy(contact, history, 'voice-call');
    } else if (contact.memorySendLimit && contact.memorySendLimit > 0) {
        const contactMemories = window.iphoneSimState.memories.filter(m => m.contactId === contact.id);
        if (contactMemories.length > 0) {
            const recentMemories = contactMemories.sort((a, b) => b.time - a.time).slice(0, contact.memorySendLimit);
            recentMemories.reverse();
            memoryContext += '\n【重要记忆】\n';
            recentMemories.forEach(m => {
                memoryContext += `- ${m.content}\n`;
            });
        }
    }

    let worldbookContext = '';
    if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0) {
        let activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled);
        if (contact.linkedWbCategories) {
            activeEntries = activeEntries.filter(e => contact.linkedWbCategories.includes(e.categoryId));
        }
        if (activeEntries.length > 0) {
            worldbookContext += '\n\n世界书信息：\n';
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
                    worldbookContext += `${entry.content}\n`;
                }
            });
        }
    }

    let limit = contact.contextLimit && contact.contextLimit > 0 ? contact.contextLimit : 20;
    let contextMessages = history.filter(h => !shouldExcludeFromAiContext(h)).slice(-limit);

    let systemPrompt = '';
    
    // 判断是否在视频通话中 (通过界面可见性判断，而不是摄像头流)
    // videoScreen 已经在函数开头声明过
    const isVideoCall = videoScreen && !videoScreen.classList.contains('hidden');

    if (isVideoCall) {
        systemPrompt = `你现在扮演 ${contact.name}，正在与用户进行【视频通话】。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

${userPromptInfo}
${memoryContext}
${worldbookContext}

【重要规则】
1. 你们正在进行视频通话。
2. 用户可能会发送图片，这些图片是用户方的实时视频画面截图，代表你通过视频通话"看到"的用户当前的画面。请将这些图片理解为你正在视频通话中看到的实时场景，而不是用户发送的静态照片。
3. 请严格遵守以下格式，同时输出一个描述部分和一个对话部分：
{{DESC}}在这里写下你的动作、表情或环境描述。{{/DESC}}
{{DIALOGUE}}在这里写下你以第一人称说的话。{{/DIALOGUE}}
4. 语气要自然、流畅。
5. 如果你想挂断电话，请在回复的最后另起一行输出：ACTION: HANGUP_CALL
6. **严禁**输出 "BAKA"、"baka" 等词汇。

请回复对方。`;
    } else {
        systemPrompt = `你现在扮演 ${contact.name}，正在与用户进行【语音通话】。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

${userPromptInfo}
${memoryContext}
${worldbookContext}

【重要规则】
1. 你们正在打电话，请使用自然的口语交流。
2. **绝对不要**包含任何动作描写（如 *点头*、*叹气*、*笑了* 等）。
3. **绝对不要**包含剧本格式（如 "我："、"用户："）。
4. 回复必须是**一整段**话，不要分段，不要分条。
5. 语气要自然、流畅，像真实的人在打电话。
6. 不要输出任何指令（如 ACTION: ...），除非你想挂断电话。
7. 如果你想挂断电话，请在回复的最后另起一行输出：ACTION: HANGUP_CALL
8. 仅仅输出你要说的话（和可能的挂断指令）。
9. **严禁**输出 "BAKA"、"baka" 等词汇。

请回复对方。`;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages.map(h => {
            let content = h.content;
            try {
                const data = JSON.parse(content);
                if (data.text) content = data.text;
            } catch(e) {}

            if (h.type === 'image') content = '[图片]';
            else if (h.type === 'sticker') content = '[表情包]';
            else if (h.type === 'voice') content = '[语音]';
            
            return { role: h.role, content: content };
        })
    ];

    // 检查是否有暂存的截图，如果有则附加到最后一条用户消息中
    if (pendingVideoSnapshot) {
        let lastUserMsgIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserMsgIndex = i;
                break;
            }
        }

        if (lastUserMsgIndex !== -1) {
            const originalContent = messages[lastUserMsgIndex].content;
            messages[lastUserMsgIndex].content = [
                { type: "text", text: originalContent },
                { type: "image_url", image_url: { url: pendingVideoSnapshot } }
            ];
        } else {
            // 如果没有用户消息（极少见），追加一条
            messages.push({
                role: 'user',
                content: [
                    { type: "text", text: "（这是你通过视频通话看到的用户当前的画面）" },
                    { type: "image_url", image_url: { url: pendingVideoSnapshot } }
                ]
            });
        }
        // 清空暂存
        pendingVideoSnapshot = null;
    }

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
                messages: messages,
                temperature: settings.temperature
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        console.log('Voice Call AI API Response:', data);

        if (data.error) {
            console.error('Voice Call API Error Response:', data.error);
            throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        if (!data.choices || !data.choices.length || !data.choices[0].message) {
            console.error('Invalid Voice Call API response structure:', data);
            throw new Error('API返回数据格式异常');
        }

        let replyContent = data.choices[0].message.content.trim();

        replyContent = replyContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                                   .replace(/<think>[\s\S]*?<\/think>/g, '')
                                   .trim();

        // 同样应用增强的正则匹配来清理 ACTION (虽然视频通话 Prompt 较少用 ACTION，但为了统一)
        let lines = replyContent.split('\n');
        let cleanLines = [];
        let actions = [];
        
        const actionRegex = /^[\s\*\-\>]*ACTION\s*[:：]\s*(.*)$/i;

                for (let line of lines) {
                    let trimmedLine = line.trim();
                    // if (!trimmedLine) continue; // 优化：保留空行以维持段落格式

                    let actionMatch = trimmedLine.match(actionRegex);
            if (actionMatch) {
                actions.push('ACTION: ' + actionMatch[1].trim());
            } else {
                cleanLines.push(line);
            }
        }
        
        replyContent = cleanLines.join('\n').trim();

        let desc = '';
        let dialogue = replyContent;
        let shouldHangup = false;
        
        // 检查提取出的 actions 中是否有挂断指令
        if (actions.some(a => a.includes('HANGUP_CALL'))) {
            shouldHangup = true;
        }

        if (isVideoCall) {
            const descMatch = replyContent.match(/{{DESC}}([\s\S]*?){{\/DESC}}/i);
            const dialogueMatch = replyContent.match(/{{DIALOGUE}}([\s\S]*?){{\/DIALOGUE}}/i);
            
            if (descMatch) {
                desc = descMatch[1].trim();
            }
            
            if (dialogueMatch) {
                dialogue = dialogueMatch[1].trim();
            } else {
                // 如果没有匹配到完整的 DIALOGUE 块，移除所有 DESC 部分，并清理可能存在的 DIALOGUE 标签
                dialogue = replyContent.replace(/{{DESC}}[\s\S]*?{{\/DESC}}/gi, '')
                                       .replace(/{{DESC}}/gi, '') // 清理可能残留的开始标签
                                       .replace(/{{\/DESC}}/gi, '') // 清理可能残留的结束标签
                                       .replace(/{{DIALOGUE}}/gi, '')
                                       .replace(/{{\/DIALOGUE}}/gi, '')
                                       .trim();
            }
        }

        // 兼容旧的行内检查（以防万一）
        if (dialogue.includes('ACTION: HANGUP_CALL')) {
            shouldHangup = true;
            dialogue = dialogue.replace('ACTION: HANGUP_CALL', '').trim();
        }

        // 防止空回复
        if (!desc && !dialogue) {
            console.log('AI generated empty response for video call, skipping message');
            isProcessingResponse = false;
            if (statusEl) statusEl.textContent = '通话中';
            return;
        }

        // 显示描述部分
        if (desc) {
            addVoiceCallMessage(desc, 'description');
        }

        // 处理对话部分
        let audioData = null;
        let isSpeakerOn = false;
        
        if (isVideoCall) {
            const videoSpeakerBtn = document.getElementById('video-call-speaker-btn');
            if (videoSpeakerBtn && videoSpeakerBtn.classList.contains('active')) isSpeakerOn = true;
        } else {
            const speakerBtn = document.getElementById('voice-call-speaker-btn');
            if (speakerBtn && speakerBtn.classList.contains('active')) isSpeakerOn = true;
        }

        if (isSpeakerOn && dialogue) {
            audioData = await generateMinimaxTTS(dialogue, contact.ttsVoiceId);
        }

        if (audioData) {
            playVoiceCallAudio(audioData);
        } else {
            // 如果没有音频（未开启扬声器或生成失败），立即恢复VAD
            isProcessingResponse = false;
            if (statusEl) statusEl.textContent = '正在聆听...';
        }

        const msgPayload = {
            text: dialogue,
            description: desc,
            audio: audioData
        };
        
        sendMessage(JSON.stringify(msgPayload), false, 'voice_call_text');
        addVoiceCallMessage(dialogue, 'ai');

        if (shouldHangup) {
            const delay = audioData ? (dialogue.length * 300 + 1000) : 2000;
            
            setTimeout(() => {
                closeVoiceCallScreen('ai');
            }, delay); 
        }

    } catch (error) {
        console.error('语音通话AI生成失败:', error);
        addVoiceCallMessage(`[生成失败: ${error.message}]`, 'ai');
        if (statusEl) statusEl.textContent = '生成失败';
        // 在控制台输出更多细节以便调试
        if (window.showChatToast) window.showChatToast(`语音通话AI错误: ${error.message}`);
        isProcessingResponse = false; // 发生错误，恢复VAD
    } finally {
        // 移除这里的状态重置，交由 playVoiceCallAudio 或上面的逻辑控制
    }
}

async function startVoiceCallVAD() {
    if (voiceCallIsRecording) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000  // 降低采样率
            }
        });
        voiceCallStream = stream;
        voiceCallAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 根据设备类型调整增益
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const gainNode = voiceCallAudioContext.createGain();
        gainNode.gain.value = isMobile ? 3.0 : 5.0; // 移动端降低增益避免失真

        voiceCallAnalyser = voiceCallAudioContext.createAnalyser();
        voiceCallMicrophone = voiceCallAudioContext.createMediaStreamSource(stream);
        voiceCallScriptProcessor = voiceCallAudioContext.createScriptProcessor(4096, 1, 1);

        voiceCallAnalyser.fftSize = 512;
        voiceCallAnalyser.smoothingTimeConstant = 0.8;  // 增加平滑度
        
        // 连接链路: Mic -> Gain -> Analyser -> Processor -> Destination
        voiceCallMicrophone.connect(gainNode);
        gainNode.connect(voiceCallAnalyser);
        voiceCallAnalyser.connect(voiceCallScriptProcessor);
        voiceCallScriptProcessor.connect(voiceCallAudioContext.destination);

        // 使用SiliconFlow支持的音频格式：wav/mp3/pcm/opus/webm
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm', audioBitsPerSecond: 64000 };
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            options = { mimeType: 'audio/ogg;codecs=opus', audioBitsPerSecond: 64000 };
        }
        
        try {
            voiceCallMediaRecorder = new MediaRecorder(stream, options);
            console.log('VAD using audio format:', voiceCallMediaRecorder.mimeType);
        } catch (e) {
            console.warn('MediaRecorder options not supported, falling back to default', e);
            voiceCallMediaRecorder = new MediaRecorder(stream);
        }
        
        voiceCallChunks = [];

        voiceCallMediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                voiceCallChunks.push(e.data);
            }
        };

        voiceCallMediaRecorder.onstop = async () => {
            if (voiceCallChunks.length > 0) {
                // 确保 Blob 类型与录制时一致
                const mimeType = voiceCallMediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(voiceCallChunks, { type: mimeType });
                await processVoiceCallAudio(audioBlob);
                voiceCallChunks = [];
            }
        };

        voiceCallIsSpeaking = false;
        voiceCallSilenceStart = Date.now();
        voiceCallIsRecording = true;

        // 根据设备类型调整阈值
        const VAD_THRESHOLD = isMobile ? 15 : 10;
        const SILENCE_DURATION = isMobile ? 1800 : 1500;  // 移动端延长静音判定时间

        voiceCallScriptProcessor.onaudioprocess = (event) => {
            const array = new Uint8Array(voiceCallAnalyser.frequencyBinCount);
            voiceCallAnalyser.getByteFrequencyData(array);
            let values = 0;
            const length = array.length;
            for (let i = 0; i < length; i++) {
                values += array[i];
            }
            let average = values / length;

            // 如果AI正在说话，或者正在处理回复，暂停VAD检测
            if (isAiSpeaking || isProcessingResponse) {
                average = 0;
            }

            let statusEl = document.getElementById('voice-call-status');
            const videoScreen = document.getElementById('video-call-screen');
            if (videoScreen && !videoScreen.classList.contains('hidden')) {
                statusEl = document.getElementById('video-call-status');
            }
            
            if (average > VAD_THRESHOLD) {
                if (!voiceCallIsSpeaking) {
                    console.log('VAD: Speaking started');
                    voiceCallIsSpeaking = true;
                    if (voiceCallMediaRecorder.state === 'inactive') {
                        voiceCallMediaRecorder.start();
                        if (statusEl) statusEl.textContent = '正在聆听...';
                    }
                }
                voiceCallSilenceStart = Date.now();
            } else {
                if (voiceCallIsSpeaking) {
                    const silenceDuration = Date.now() - voiceCallSilenceStart;
                    if (silenceDuration > SILENCE_DURATION) {
                        console.log('VAD: Speaking ended');
                        voiceCallIsSpeaking = false;
                        if (voiceCallMediaRecorder.state === 'recording') {
                            voiceCallMediaRecorder.stop();
                            if (statusEl) statusEl.textContent = '正在处理...';
                        }
                    }
                }
            }
        };

        console.log('Voice Call VAD started');

    } catch (error) {
        console.error('Failed to start VAD:', error);
        alert('无法启动语音检测，请检查麦克风权限');
        stopVoiceCallVAD();
    }
}

function stopVoiceCallVAD() {
    if (!voiceCallIsRecording) return;

    if (voiceCallMediaRecorder && voiceCallMediaRecorder.state !== 'inactive') {
        voiceCallMediaRecorder.stop();
    }
    
    if (voiceCallStream) {
        voiceCallStream.getTracks().forEach(track => track.stop());
        voiceCallStream = null;
    }
    
    if (voiceCallMicrophone) voiceCallMicrophone.disconnect();
    if (voiceCallAnalyser) voiceCallAnalyser.disconnect();
    if (voiceCallScriptProcessor) {
        voiceCallScriptProcessor.disconnect();
        voiceCallScriptProcessor.onaudioprocess = null;
    }
    if (voiceCallAudioContext) voiceCallAudioContext.close();

    voiceCallIsRecording = false;
    voiceCallIsSpeaking = false;
    voiceCallChunks = [];
    
    const micBtn = document.getElementById('voice-call-mic-btn');
    if (micBtn) {
        micBtn.classList.remove('active');
        const span = micBtn.nextElementSibling;
        if (span) span.textContent = '麦克风已关';
    }

    const videoMicBtn = document.getElementById('video-call-mic-btn');
    if (videoMicBtn) {
        videoMicBtn.classList.remove('active');
        const span = videoMicBtn.nextElementSibling;
        if (span) span.textContent = '麦克风已关';
    }
    
    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }
    if (statusEl) statusEl.textContent = '通话中';

    console.log('Voice Call VAD stopped');
}

async function processVoiceCallAudio(audioBlob) {
    if (!window.iphoneSimState.whisperSettings.url || !window.iphoneSimState.whisperSettings.key) {
        console.warn('Whisper API not configured');
        return;
    }

    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }
    if (statusEl) statusEl.textContent = '正在转文字...';
    
    let hasRecognizedText = false;

    try {
        // 使用正确的文件扩展名和类型（SiliconFlow支持：wav/mp3/pcm/opus/webm）
        let ext = 'webm';
        if (audioBlob.type.includes('ogg')) {
            ext = 'ogg';
        } else if (audioBlob.type.includes('wav')) {
            ext = 'wav';
        } else if (audioBlob.type.includes('mp3')) {
            ext = 'mp3';
        } else {
            ext = 'webm';
        }
        const audioFile = new File([audioBlob], `voice_call.${ext}`, { type: audioBlob.type });
        
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', window.iphoneSimState.whisperSettings.model || 'whisper-1');
        formData.append('language', 'zh');  // 指定中文以提高准确率

        let fetchUrl = window.iphoneSimState.whisperSettings.url;
        if (fetchUrl.endsWith('/')) {
            fetchUrl = fetchUrl.slice(0, -1);
        }
        if (!fetchUrl.endsWith('/audio/transcriptions')) {
            fetchUrl = fetchUrl + '/audio/transcriptions';
        }

        const cleanKey = window.iphoneSimState.whisperSettings.key ? window.iphoneSimState.whisperSettings.key.trim() : '';

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanKey}`
            },
            body: formData
        });

        if (!response.ok) {
            if (response.status === 403) {
                console.error('Voice Call STT 403: 模型名称可能错误，请检查设置');
            }
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        let text = data.text ? data.text.trim() : '';
        
        // 过滤emoji和特殊字符
        if (text) {
            text = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // 表情符号
                       .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // 符号和象形文字
                       .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // 交通和地图符号
                       .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // 旗帜
                       .replace(/[\u{2600}-\u{26FF}]/gu, '')   // 杂项符号
                       .replace(/[\u{2700}-\u{27BF}]/gu, '')   // 装饰符号
                       .trim();
        }

        if (text) {
            console.log('VAD Recognized:', text);
            sendMessage(text, true, 'voice_call_text');
            addVoiceCallMessage(text, 'user');
            hasRecognizedText = true;
            
            // 识别成功，进入处理状态，暂停VAD
            isProcessingResponse = true;
            if (statusEl) statusEl.textContent = '对方正在思考...';
            
            generateVoiceCallAiReply();
        } else {
            console.log('VAD: No text recognized or filtered out');
        }

    } catch (error) {
        console.error('Voice Call STT Error:', error);
        // 移动端可能出现网络错误，不要弹窗打断通话
        if (statusEl) statusEl.textContent = '识别失败，继续聆听...';
    } finally {
        // 只有在没有识别出文本且没有进入处理状态时，才恢复"正在聆听"
        if (statusEl && !hasRecognizedText && !isProcessingResponse) statusEl.textContent = '正在聆听...';
    }
}

window.playVoiceMsg = async function(msgId, textElId, event) {
    if (event) event.stopPropagation();

    const btn = event.currentTarget;
    const icon = btn.querySelector('i');
    const getIdleIconClass = () => {
        if (!icon) return 'ri-play-fill';
        return icon.dataset.idleClass || 'ri-play-fill';
    };
    const getPlayingIconClass = () => {
        if (!icon) return 'ri-play-fill voice-playing-anim';
        return icon.dataset.playingClass || 'ri-play-fill voice-playing-anim';
    };

    if (currentVoiceMsgId === msgId && currentVoiceAudio && !currentVoiceAudio.paused) {
        return;
    }

    if (icon && icon.classList.contains('fa-spinner')) {
        return;
    }

    if (currentVoiceAudio) {
        currentVoiceAudio.pause();
        currentVoiceAudio = null;
        currentVoiceMsgId = null;
        if (currentVoiceIcon) {
            const idleCls = currentVoiceIcon.dataset.idleClass || 'ri-play-fill';
            currentVoiceIcon.className = idleCls;
            currentVoiceIcon = null;
        }
    }
    
    const textEl = document.getElementById(textElId);
    if (textEl) textEl.classList.remove('hidden');

    let targetMsg = null;
    if (window.iphoneSimState.currentChatContactId && window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        targetMsg = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].find(m => m.id == msgId);
    }

    if (!targetMsg) {
        console.error('Message not found:', msgId);
        return;
    }

    let msgData = null;
    try {
        msgData = typeof targetMsg.content === 'string' ? JSON.parse(targetMsg.content) : targetMsg.content;
    } catch (e) {
        console.error('Parse error', e);
        return;
    }

    if (!msgData.audio && !msgData.isReal) {
        const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        if (!contact || !contact.ttsEnabled) {
            alert('无法播放：未启用TTS或联系人不存在');
            return;
        }

        if (icon) {
            icon.className = 'fas fa-spinner fa-spin';
        }

        try {
            const audioData = await generateMinimaxTTS(msgData.text, contact.ttsVoiceId);
            if (audioData) {
                msgData.audio = audioData;
                targetMsg.content = JSON.stringify(msgData);
                saveConfig();
            } else {
                alert('语音生成失败，请检查API配置');
                if (icon) icon.className = getIdleIconClass();
                return;
            }
        } catch (e) {
            console.error('TTS generation error:', e);
            alert('语音生成出错');
            if (icon) icon.className = getIdleIconClass();
            return;
        }
    }

    if (msgData.audio) {
        // 验证音频数据格式
        if (!msgData.audio.startsWith('data:audio/')) {
            console.error('Invalid audio data format');
            if (icon) icon.className = getIdleIconClass();
            alert('音频格式错误，请重新录制');
            return;
        }
        
        try {
            const audio = new Audio();
            currentVoiceAudio = audio;
            currentVoiceMsgId = msgId;
            
            if (icon) {
                icon.className = getPlayingIconClass();
                currentVoiceIcon = icon;
            }
            
            audio.onended = () => {
                if (icon) {
                    icon.className = getIdleIconClass();
                }
                if (currentVoiceMsgId === msgId) {
                    currentVoiceAudio = null;
                    currentVoiceMsgId = null;
                    currentVoiceIcon = null;
                }
            };
            
            audio.onerror = (e) => {
                console.error('Audio play error', e, 'Audio src length:', msgData.audio ? msgData.audio.length : 0);
                if (icon) icon.className = getIdleIconClass();
                
                // 更友好的错误提示
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                    // 移动端可能是格式不支持
                    if (window.showChatToast) {
                        window.showChatToast('音频格式不支持，请在设置中切换录音格式');
                    } else {
                        alert('音频格式不支持，建议使用mp4格式');
                    }
                } else {
                    alert('播放失败：音频数据可能已损坏');
                }
                
                if (currentVoiceMsgId === msgId) {
                    currentVoiceAudio = null;
                    currentVoiceMsgId = null;
                    currentVoiceIcon = null;
                }
            };
            
            // 设置音频源并播放
            audio.src = msgData.audio;
            audio.load(); // 预加载
            
            audio.play().catch(err => {
                console.error('Play error:', err);
                if (icon) icon.className = getIdleIconClass();
                
                // 更详细的错误信息
                let errorMsg = '播放失败';
                if (err.name === 'NotAllowedError') {
                    errorMsg = '需要用户交互才能播放音频';
                } else if (err.name === 'NotSupportedError') {
                    errorMsg = '音频格式不支持';
                } else {
                    errorMsg = '播放错误: ' + err.message;
                }
                
                if (window.showChatToast) {
                    window.showChatToast(errorMsg);
                } else {
                    alert(errorMsg);
                }
                
                if (currentVoiceMsgId === msgId) {
                    currentVoiceAudio = null;
                    currentVoiceMsgId = null;
                    currentVoiceIcon = null;
                }
            });
        } catch (err) {
            console.error('Audio creation error:', err);
            if (icon) icon.className = getIdleIconClass();
            alert('音频初始化失败');
        }
    } else {
        if (icon) icon.className = getIdleIconClass();
        alert('该消息没有音频数据。');
    }
};

window.openEditChatMessageModal = function(msgId, currentContent) {
    currentEditingChatMsgId = msgId;
    const textarea = document.getElementById('edit-chat-msg-content');
    textarea.value = currentContent;
    document.getElementById('edit-chat-msg-modal').classList.remove('hidden');
};

window.openEditBlockModal = function(jsonContent) {
    const list = document.getElementById('edit-block-list');
    list.innerHTML = '';
    
    let items = [];
    try {
        items = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch(e) {
        console.error(e);
        items = [];
    }
    
    items.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'edit-block-item';
        wrapper.style.marginBottom = '10px';
        
        const label = document.createElement('div');
        label.textContent = `消息 ${index + 1}`;
        label.style.fontSize = '12px';
        label.style.color = '#888';
        label.style.marginBottom = '4px';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'block-item-json';
        textarea.style.width = '100%';
        textarea.style.height = '100px';
        textarea.style.fontFamily = 'monospace';
        textarea.style.fontSize = '12px';
        textarea.style.border = '1px solid #ddd';
        textarea.style.borderRadius = '8px';
        textarea.style.padding = '8px';
        textarea.style.resize = 'vertical';
        textarea.value = JSON.stringify(item, null, 2);
        
        const toolbar = document.createElement('div');
        toolbar.className = 'edit-block-toolbar';
        toolbar.style.display = 'flex';
        toolbar.style.gap = '8px';
        toolbar.style.marginTop = '5px';
        toolbar.style.flexWrap = 'wrap';

        const types = [
            { label: '文本', template: {"type": "text", "content": "消息内容"} },
            { label: '图片', template: {"type": "image", "content": "图片描述", "novelaiPrompt": "", "novelaiNegativePrompt": ""} },
            { label: '转账', template: {"type": "action", "command": "TRANSFER", "payload": "88.88 备注"} },
            { label: '表情包', template: {"type": "sticker", "content": "表情包名称"} },
            { label: '语音', template: {"type": "voice", "duration": 5, "content": "语音文本"} }
        ];

        types.forEach(t => {
            const btn = document.createElement('button');
            btn.textContent = t.label;
            btn.style.padding = '4px 8px';
            btn.style.fontSize = '12px';
            btn.style.border = '1px solid #ddd';
            btn.style.borderRadius = '4px';
            btn.style.background = '#f5f5f5';
            btn.style.cursor = 'pointer';
            
            btn.onclick = () => {
                textarea.value = JSON.stringify(t.template, null, 2);
            };
            toolbar.appendChild(btn);
        });
        
        wrapper.appendChild(label);
        wrapper.appendChild(textarea);
        wrapper.appendChild(toolbar);
        list.appendChild(wrapper);
    });
    
    document.getElementById('edit-block-modal').classList.remove('hidden');
};

function handleSaveEditBlock() {
    const list = document.getElementById('edit-block-list');
    const textareas = list.querySelectorAll('.block-item-json');
    const newItems = [];
    
    try {
        textareas.forEach(ta => {
            const item = JSON.parse(ta.value);
            newItems.push(item);
        });
    } catch(e) {
        alert('JSON格式错误，请检查');
        return;
    }
    
    if (newItems.length === 0) {
        if (!confirm('没有消息内容，确定要清空该轮回复吗？')) return;
    }
    
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) return;
    
    const history = window.iphoneSimState.chatHistory[contactId];
    
    // Find indices of last AI block
    let indices = [];
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') {
            indices.unshift(i);
        } else {
            break;
        }
    }
    
    if (indices.length > 0) {
        history.splice(indices[0], indices.length);
    }
    
    // Reconstruct new messages
    let pendingThought = null;
    const newHistoryItems = [];
    
    for (const item of newItems) {
        if (item.type === 'thought') {
            pendingThought = item.content;
            continue;
        }
        
        let contentToSave = item.content;
        let typeToSave = 'text';
        let description = null;
        
        if (item.type === 'text' || item.type === '消息') {
            typeToSave = 'text';
        } else if (item.type === 'sticker' || item.type === '表情包') {
            let stickerUrl = null;
            if (window.iphoneSimState.stickerCategories) {
                for (const cat of window.iphoneSimState.stickerCategories) {
                    const found = cat.list.find(s => s.desc === item.content || s.desc.includes(item.content));
                    if (found) {
                        stickerUrl = found.url;
                        break;
                    }
                }
            }
            if (stickerUrl) {
                contentToSave = stickerUrl;
                typeToSave = 'sticker';
                description = item.content;
            } else {
                contentToSave = `[表情包: ${item.content}]`;
                typeToSave = 'text';
            }
        } else if (item.type === 'image' || item.type === 'virtual_image') {
            contentToSave = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
            typeToSave = 'virtual_image';
            description = item.content;
        } else if (item.type === 'voice') {
            const voiceData = {
                duration: item.duration || 3,
                text: item.content || '语音',
                isReal: false
            };
            contentToSave = JSON.stringify(voiceData);
            typeToSave = 'voice';
        } else if (item.type === 'action') {
            if (item.command === 'TRANSFER') {
                const parts = (item.payload || '').split(' ');
                const amount = parts[0] || '0';
                const remark = parts.slice(1).join(' ') || '转账';
                contentToSave = JSON.stringify({
                    id: Date.now(),
                    amount: amount,
                    remark: remark,
                    status: 'pending'
                });
                typeToSave = 'transfer';
            } else {
                continue;
            }
        }
        
        const msg = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            time: Date.now(),
            role: 'assistant',
            content: contentToSave,
            type: typeToSave
        };
        
        if (item.novelaiPrompt) msg.novelaiPrompt = item.novelaiPrompt;
        if (item.novelaiNegativePrompt) msg.novelaiNegativePrompt = item.novelaiNegativePrompt;
        
        if (description) msg.description = description;
        if (pendingThought) {
            msg.thought = pendingThought;
            pendingThought = null;
        }
        
        newHistoryItems.push(msg);
    }
    
    if (pendingThought && newHistoryItems.length > 0) {
        if (newHistoryItems[newHistoryItems.length - 1].thought) {
            newHistoryItems[newHistoryItems.length - 1].thought += '\n' + pendingThought;
        } else {
            newHistoryItems[newHistoryItems.length - 1].thought = pendingThought;
        }
    }
    
    history.push(...newHistoryItems);
    
    saveConfig();
    renderChatHistory(contactId);
    document.getElementById('edit-block-modal').classList.add('hidden');
}

function handleSaveEditedChatMessage() {
    if (!currentEditingChatMsgId || !window.iphoneSimState.currentChatContactId) return;

    const newContent = document.getElementById('edit-chat-msg-content').value.trim();
    if (!newContent) {
        alert('消息内容不能为空');
        return;
    }

    if (currentEditingChatMsgId === 'LAST_AI_BLOCK') {
        try {
            const newItems = JSON.parse(newContent);
            if (!Array.isArray(newItems)) {
                alert('必须是JSON数组格式');
                return;
            }
            
            const contactId = window.iphoneSimState.currentChatContactId;
            const history = window.iphoneSimState.chatHistory[contactId];
            
            let indices = [];
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].role === 'assistant') {
                    indices.unshift(i);
                } else {
                    break;
                }
            }
            
            if (indices.length > 0) {
                history.splice(indices[0], indices.length);
            }
            
            let pendingThought = null;
            const newHistoryItems = [];
            
            for (const item of newItems) {
                if (item.type === 'thought') {
                    pendingThought = item.content;
                    continue;
                }
                
                let contentToSave = item.content;
                let typeToSave = 'text';
                let description = null;
                
                if (item.type === 'text' || item.type === '消息') {
                    typeToSave = 'text';
                } else if (item.type === 'sticker' || item.type === '表情包') {
                    let stickerUrl = null;
                    if (window.iphoneSimState.stickerCategories) {
                        for (const cat of window.iphoneSimState.stickerCategories) {
                            const found = cat.list.find(s => s.desc === item.content || s.desc.includes(item.content));
                            if (found) {
                                stickerUrl = found.url;
                                break;
                            }
                        }
                    }
                    if (stickerUrl) {
                        contentToSave = stickerUrl;
                        typeToSave = 'sticker';
                        description = item.content;
                    } else {
                        contentToSave = `[表情包: ${item.content}]`;
                        typeToSave = 'text';
                    }
                } else if (item.type === 'image' || item.type === 'virtual_image') {
                    contentToSave = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                    typeToSave = 'virtual_image';
                    description = item.content;
                } else if (item.type === 'voice') {
                    const voiceData = {
                        duration: item.duration || 3,
                        text: item.content || '语音',
                        isReal: false
                    };
                    contentToSave = JSON.stringify(voiceData);
                    typeToSave = 'voice';
                } else if (item.type === 'action') {
                    if (item.command === 'TRANSFER') {
                        const parts = (item.payload || '').split(' ');
                        const amount = parts[0] || '0';
                        const remark = parts.slice(1).join(' ') || '转账';
                        contentToSave = JSON.stringify({
                            id: Date.now(),
                            amount: amount,
                            remark: remark,
                            status: 'pending'
                        });
                        typeToSave = 'transfer';
                    } else {
                        continue;
                    }
                }
                
                const msg = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    time: Date.now(),
                    role: 'assistant',
                    content: contentToSave,
                    type: typeToSave
                };
                
                if (description) msg.description = description;
                if (pendingThought) {
                    msg.thought = pendingThought;
                    pendingThought = null;
                }
                
                newHistoryItems.push(msg);
            }
            
            if (pendingThought && newHistoryItems.length > 0) {
                if (newHistoryItems[newHistoryItems.length - 1].thought) {
                    newHistoryItems[newHistoryItems.length - 1].thought += '\n' + pendingThought;
                } else {
                    newHistoryItems[newHistoryItems.length - 1].thought = pendingThought;
                }
            }
            
            history.push(...newHistoryItems);
            
            saveConfig();
            renderChatHistory(contactId);
            document.getElementById('edit-chat-msg-modal').classList.add('hidden');
            currentEditingChatMsgId = null;
            
        } catch (e) {
            console.error(e);
            alert('JSON解析失败，请检查格式');
        }
        return;
    }

    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    const msgIndex = messages.findIndex(m => m.id == currentEditingChatMsgId);

    if (msgIndex !== -1) {
        messages[msgIndex].content = newContent;
        
        saveConfig();
        renderChatHistory(window.iphoneSimState.currentChatContactId);
        
        document.getElementById('edit-chat-msg-modal').classList.add('hidden');
        currentEditingChatMsgId = null;
    } else {
        alert('找不到原消息，可能已被删除');
        document.getElementById('edit-chat-msg-modal').classList.add('hidden');
    }
}

// 初始化监听器
function openWechatMomentsTab() {
    const momentsTab = document.querySelector('#wechat-app .wechat-tab-item[data-tab="moments"]');
    if (momentsTab) {
        momentsTab.click();
        return;
    }
    if (window.switchTab) {
        window.switchTab('moments');
    }
}

function setupChatListeners() {
    // 仅选择主微信应用的底栏 Tab
    const wechatTabs = document.querySelectorAll('#wechat-app .wechat-tab-item');
    
    wechatTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const currentActiveTab = document.querySelector('#wechat-app .wechat-tab-item.active');
            if (currentActiveTab === tab) return;

            const currentContent = document.querySelector('#wechat-app .wechat-tab-content.active');
            const tabName = tab.dataset.tab;
            const nextContent = document.getElementById(`wechat-tab-${tabName}`);
            const header = document.querySelector('#wechat-app .wechat-header');

            wechatTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (currentContent) {
                currentContent.classList.add('fade-out');
                if (header) header.classList.add('fade-out');
                
                setTimeout(() => {
                    currentContent.classList.remove('active');
                    currentContent.classList.remove('fade-out');
                    
                    if (nextContent) {
                        nextContent.style.opacity = '0';
                        nextContent.classList.add('active');
                        void nextContent.offsetWidth;
                        nextContent.style.opacity = '1'; 
                    }
                    
                    updateWechatHeader(tabName);
                    if (header) header.classList.remove('fade-out');

                }, 150);
            } else {
                if (nextContent) {
                    nextContent.style.opacity = '0';
                    nextContent.classList.add('active');
                    void nextContent.offsetWidth;
                    nextContent.style.opacity = '1';
                }
                updateWechatHeader(tabName);
            }
        });
    });

    updateWechatHeader('contacts');

    const addContactModal = document.getElementById('add-contact-modal');
    const closeAddContactBtn = document.getElementById('close-add-contact');
    const saveContactBtn = document.getElementById('save-contact-btn');

    const contactAvatarPreview = document.getElementById('contact-avatar-preview');
    const contactAvatarUpload = document.getElementById('contact-avatar-upload');
    
    if (contactAvatarPreview && contactAvatarUpload) {
        contactAvatarPreview.addEventListener('click', () => contactAvatarUpload.click());
        
        contactAvatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    contactAvatarPreview.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (closeAddContactBtn) closeAddContactBtn.addEventListener('click', () => addContactModal.classList.add('hidden'));
    if (saveContactBtn) saveContactBtn.addEventListener('click', handleSaveContact);

    const backToContactsBtn = document.getElementById('back-to-contacts');
    if (backToContactsBtn) backToContactsBtn.addEventListener('click', () => {
        document.getElementById('chat-screen').classList.add('hidden');
        if (typeof window.hideThoughtOverlays === 'function') {
            window.hideThoughtOverlays();
        }
        const pet = document.getElementById('thought-pet');
        if (pet) pet.classList.add('hidden');
        window.iphoneSimState.currentAiProfileContactId = null;
        window.iphoneSimState.currentChatContactId = null;
    });

    const chatSettingsBtn = document.getElementById('chat-settings-btn');
    const chatSettingsScreen = document.getElementById('chat-settings-screen');
    const closeChatSettingsBtn = document.getElementById('close-chat-settings');
    const saveChatSettingsBtn = document.getElementById('save-chat-settings-btn');
    const triggerAiMomentBtn = document.getElementById('trigger-ai-moment-btn');
    
    const chatSettingGroupTrigger = document.getElementById('chat-setting-group-trigger');
    const groupSelectModal = document.getElementById('group-select-modal');
    const closeGroupSelectBtn = document.getElementById('close-group-select');
    const createGroupBtn = document.getElementById('create-group-btn');

    if (chatSettingGroupTrigger) chatSettingGroupTrigger.addEventListener('click', openGroupSelect);
    if (closeGroupSelectBtn) closeGroupSelectBtn.addEventListener('click', () => groupSelectModal.classList.add('hidden'));
    if (createGroupBtn) createGroupBtn.addEventListener('click', handleCreateGroup);

    const chatSettingBgInput = document.getElementById('chat-setting-bg');
    if (chatSettingBgInput) chatSettingBgInput.addEventListener('change', handleChatWallpaperUpload);

    const aiSettingBgInput = document.getElementById('chat-setting-ai-bg-input');
    const aiSettingBgContainer = document.getElementById('ai-setting-bg-container');
    if (aiSettingBgContainer && aiSettingBgInput) {
        aiSettingBgContainer.addEventListener('click', () => aiSettingBgInput.click());
        aiSettingBgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    aiSettingBgContainer.style.backgroundImage = `url(${event.target.result})`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const userSettingBgInput = document.getElementById('chat-setting-user-bg-input');
    const userSettingBgContainer = document.getElementById('user-setting-bg-container');
    if (userSettingBgContainer && userSettingBgInput) {
        userSettingBgContainer.addEventListener('click', () => userSettingBgInput.click());
        userSettingBgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    userSettingBgContainer.style.backgroundImage = `url(${event.target.result})`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const chatSettingAvatarInput = document.getElementById('chat-setting-avatar');
    if (chatSettingAvatarInput) {
        chatSettingAvatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('chat-setting-avatar-preview').src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const thoughtStyleSelect = document.getElementById('chat-setting-thought-style');
    const thoughtPetPanel = document.getElementById('chat-setting-thought-pet-panel');
    const thoughtPetImageInput = document.getElementById('chat-setting-thought-pet-image');
    const thoughtPetPreview = document.getElementById('chat-setting-thought-pet-preview');
    const thoughtPetSizeSlider = document.getElementById('chat-setting-thought-pet-size');
    const thoughtPetSizeValue = document.getElementById('chat-setting-thought-pet-size-value');

    const syncThoughtPetPreviewSize = () => {
        const rawSize = thoughtPetSizeSlider ? parseInt(thoughtPetSizeSlider.value, 10) : 88;
        const size = Number.isFinite(rawSize) ? Math.max(52, Math.min(140, rawSize)) : 88;
        if (thoughtPetSizeValue) thoughtPetSizeValue.textContent = `${size}px`;
        if (thoughtPetPreview) {
            const previewSize = Math.max(44, Math.min(76, Math.round(size * 0.64)));
            thoughtPetPreview.style.width = `${previewSize}px`;
            thoughtPetPreview.style.height = `${previewSize}px`;
        }
    };

    const syncThoughtPetPanelVisibility = () => {
        if (!thoughtPetPanel || !thoughtStyleSelect) return;
        thoughtPetPanel.style.display = thoughtStyleSelect.value === 'desktop-pet' ? '' : 'none';
    };

    if (thoughtStyleSelect) {
        thoughtStyleSelect.addEventListener('change', () => {
            syncThoughtPetPanelVisibility();
        });
    }

    if (thoughtPetSizeSlider) {
        thoughtPetSizeSlider.addEventListener('input', () => {
            syncThoughtPetPreviewSize();
        });
    }

    if (thoughtPetImageInput) {
        thoughtPetImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                if (thoughtPetPreview && !thoughtPetPreview.src) {
                    thoughtPetPreview.src = window.DEFAULT_THOUGHT_PET_IMAGE || '';
                }
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                if (thoughtPetPreview) thoughtPetPreview.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    syncThoughtPetPanelVisibility();
    syncThoughtPetPreviewSize();
    if (thoughtPetPreview && !thoughtPetPreview.src) {
        thoughtPetPreview.src = window.DEFAULT_THOUGHT_PET_IMAGE || '';
    }

    const chatSettingVideoBgInput = document.getElementById('chat-setting-video-bg');
    if (chatSettingVideoBgInput) {
        chatSettingVideoBgInput.addEventListener('change', handleVideoCallBgUpload);
    }
    
    const resetChatBgBtn = document.getElementById('reset-chat-bg');
    if (resetChatBgBtn) {
        resetChatBgBtn.addEventListener('click', () => {
            window.iphoneSimState.tempSelectedChatBg = '';
            renderChatWallpaperGallery();
        });
    }

    const chatSettingsScreenEl = document.getElementById('chat-settings-screen');
    const chatSettingTabs = chatSettingsScreenEl
        ? chatSettingsScreenEl.querySelectorAll('.chat-settings-nav .nav-item[data-tab]')
        : [];
    const chatSettingIndicator = chatSettingsScreenEl
        ? chatSettingsScreenEl.querySelector('.chat-settings-nav .nav-indicator')
        : null;
    
    chatSettingTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('active')) return;

            const currentContent = chatSettingsScreenEl
                ? chatSettingsScreenEl.querySelector('.chat-setting-tab-content.active')
                : null;
            const tabName = tab.dataset.tab;
            const nextContent = chatSettingsScreenEl
                ? chatSettingsScreenEl.querySelector(`#chat-setting-tab-${tabName}`)
                : null;

            chatSettingTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (chatSettingIndicator) {
                chatSettingIndicator.style.transform = `translate3d(${index * 100}%, 0, 0)`;
            }

            if (currentContent) {
                currentContent.classList.add('fade-out');
                setTimeout(() => {
                    currentContent.classList.remove('active');
                    currentContent.classList.remove('fade-out');
                    
                    if (nextContent) {
                        nextContent.style.opacity = '0';
                        nextContent.classList.add('active');
                        void nextContent.offsetWidth;
                        nextContent.style.opacity = '1';
                    }
                }, 150);
            } else {
                if (nextContent) {
                    nextContent.style.opacity = '0';
                    nextContent.classList.add('active');
                    void nextContent.offsetWidth;
                    nextContent.style.opacity = '1';
                }
            }
        });
    });

    const chatTitle = document.getElementById('chat-title');
    if (chatTitle) {
        chatTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            const contactId = window.iphoneSimState.currentChatContactId;
            const contact = (window.iphoneSimState.contacts || []).find(c => c.id === contactId);
            const mode = contact && contact.thoughtDisplayMode === 'desktop-pet' ? 'desktop-pet' : 'title';
            if (mode === 'title') {
                toggleThoughtBubble();
            }
        });
    }
    
    document.addEventListener('click', (e) => {
        const titleBubble = document.getElementById('thought-bubble');
        const pet = document.getElementById('thought-pet');
        const petBubble = document.getElementById('thought-pet-bubble');
        const inTitle = chatTitle && (e.target === chatTitle || chatTitle.contains(e.target));
        const inTitleBubble = titleBubble && titleBubble.contains(e.target);
        const inPet = pet && pet.contains(e.target);
        const inPetBubble = petBubble && petBubble.contains(e.target);

        if (!inTitle && !inTitleBubble && !inPet && !inPetBubble) {
            if (typeof window.hideThoughtOverlays === 'function') {
                window.hideThoughtOverlays();
            } else if (titleBubble) {
                titleBubble.classList.add('hidden');
            }
        }
    });

    if (!window.__thoughtPetResizeBound) {
        window.__thoughtPetResizeBound = true;
        window.addEventListener('resize', () => {
            if (typeof window.renderThoughtEntryUI === 'function') {
                window.renderThoughtEntryUI(window.iphoneSimState.currentChatContactId);
            }
        });
    }

    const aiProfileScreen = document.getElementById('ai-profile-screen');
    const closeAiProfileBtn = document.getElementById('close-ai-profile');
    const aiProfileMoreBtn = document.getElementById('ai-profile-more');
    const aiProfileSendMsgBtn = document.getElementById('ai-profile-send-msg');
    const aiProfileBgInput = document.getElementById('ai-profile-bg-input');
    const aiProfileBg = document.getElementById('ai-profile-bg');
    const aiRelationItem = document.getElementById('ai-relation-item');

    const currentAiProfileSendMsgBtn = document.getElementById('ai-profile-send-msg');
    if (currentAiProfileSendMsgBtn) {
        const newBtn = currentAiProfileSendMsgBtn.cloneNode(true);
        currentAiProfileSendMsgBtn.parentNode.replaceChild(newBtn, currentAiProfileSendMsgBtn);
        
        newBtn.addEventListener('click', () => {
            const contactId = window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId;
            openMeetingsScreen(contactId);
        });
    }

    const relationSelectModal = document.getElementById('relation-select-modal');
    const closeRelationSelectBtn = document.getElementById('close-relation-select');
    const aiMomentsEntry = document.getElementById('ai-moments-entry');

    if (closeAiProfileBtn) {
        closeAiProfileBtn.addEventListener('click', () => {
            aiProfileScreen.classList.add('hidden');
            window.iphoneSimState.currentAiProfileContactId = null;
        });
    }
    if (aiProfileMoreBtn) aiProfileMoreBtn.addEventListener('click', openChatSettings);
    

    if (aiProfileBg) aiProfileBg.addEventListener('click', () => aiProfileBgInput.click());
    if (aiProfileBgInput) aiProfileBgInput.addEventListener('change', handleAiProfileBgUpload);
    
    if (aiRelationItem) aiRelationItem.addEventListener('click', openRelationSelect);
    if (closeRelationSelectBtn) closeRelationSelectBtn.addEventListener('click', () => relationSelectModal.classList.add('hidden'));
    
    if (aiMomentsEntry) aiMomentsEntry.addEventListener('click', window.openAiMoments);

    if (chatSettingsBtn) chatSettingsBtn.addEventListener('click', openChatSettings);
    if (closeChatSettingsBtn) closeChatSettingsBtn.addEventListener('click', () => chatSettingsScreen.classList.add('hidden'));
    if (saveChatSettingsBtn) saveChatSettingsBtn.addEventListener('click', handleSaveChatSettings);
    if (triggerAiMomentBtn) triggerAiMomentBtn.addEventListener('click', () => generateAiMoment(false));

    const clearChatHistoryBtn = document.getElementById('clear-chat-history-btn');
    if (clearChatHistoryBtn) clearChatHistoryBtn.addEventListener('click', handleClearChatHistory);

    const exportCharBtn = document.getElementById('export-character-btn');
    if (exportCharBtn) exportCharBtn.addEventListener('click', handleExportCharacterData);

    const importCharInput = document.getElementById('import-character-input');
    if (importCharInput) importCharInput.addEventListener('change', handleImportCharacterData);

    const chatInput = document.getElementById('chat-input');
    const triggerAiReplyBtn = document.getElementById('trigger-ai-reply-btn');

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = chatInput.value.trim();
                if (text) {
                    sendMessage(text, true);
                    chatInput.value = '';
                }
            }
        });
    }

    if (triggerAiReplyBtn) {
        triggerAiReplyBtn.addEventListener('click', () => generateAiReply());
    }

    const chatMoreBtn = document.getElementById('chat-more-btn');
    const chatMorePanel = document.getElementById('chat-more-panel');
    const stickerBtn = document.getElementById('sticker-btn');
    const stickerPanel = document.getElementById('sticker-panel');
    const chatInputArea = document.querySelector('.chat-input-area');
    
    // 分页相关元素
    const chatMorePages = document.getElementById('chat-more-pages');
    const chatMoreIndicators = document.querySelectorAll('.chat-more-dot');

    if (chatMorePages) {
        chatMorePages.addEventListener('scroll', () => {
            const pageIndex = Math.round(chatMorePages.scrollLeft / chatMorePages.clientWidth);
            chatMoreIndicators.forEach((dot, index) => {
                if (index === pageIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        });
    }
    
    function closeAllPanels() {
        if (chatMorePanel) chatMorePanel.classList.remove('slide-in');
        if (stickerPanel) stickerPanel.classList.remove('slide-in');
        if (chatInputArea) {
            chatInputArea.classList.remove('push-up');
            chatInputArea.classList.remove('push-up-more');
        }
    }

    if (chatMoreBtn && chatMorePanel) {
        chatMoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (chatMorePanel.classList.contains('slide-in')) {
                closeAllPanels();
            } else {
                if (stickerPanel) stickerPanel.classList.remove('slide-in');
                chatMorePanel.classList.add('slide-in');
                // 重置到第一页
                if (chatMorePages) chatMorePages.scrollLeft = 0;
                
                if (chatInputArea) {
                    chatInputArea.classList.remove('push-up');
                    chatInputArea.classList.add('push-up-more');
                }
                scrollToBottom();
            }
        });

        chatMorePanel.querySelectorAll('.more-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 让TA发消息
                if (item.id === 'chat-more-continue-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    generateAiReply("用户没有回复。请继续当前的对话，或者开启一个新的话题。你可以假设已经过了一段时间。");
                    return;
                }

                // 如果是第二页的新按钮，也需要处理
                if (item.id === 'chat-more-games-btn') {
                    // 已在 js/games.js 中处理，这里只需关闭面板
                    closeAllPanels();
                    return;
                }

                if (item.id === 'chat-more-edit-msg-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    
                    if (!window.iphoneSimState.currentChatContactId) return;
                    
                    const jsonContent = getLastAiBlockJson(window.iphoneSimState.currentChatContactId);
                    
                    if (jsonContent) {
                        openEditBlockModal(jsonContent);
                    } else {
                        alert('没有找到AI发送的消息');
                    }
                    return;
                }

                if (item.id === 'chat-more-photo-btn' || item.id === 'chat-more-camera-btn' || item.id === 'chat-more-transfer-btn' || item.id === 'chat-more-memory-btn' || item.id === 'chat-more-location-btn' || item.id === 'chat-more-regenerate-btn' || item.id === 'chat-more-voice-btn' || item.id === 'chat-more-video-call-btn' || item.id === 'chat-more-screen-share-btn') return;
                
                e.stopPropagation();
                const label = item.querySelector('.more-label').textContent;
                alert(`功能 "${label}" 开发中...`);
                closeAllPanels();
            });
        });
    }

    const chatMoreVoiceBtn = document.getElementById('chat-more-voice-btn');
    const voiceInputModal = document.getElementById('voice-input-modal');
    const closeVoiceInputBtn = document.getElementById('close-voice-input');
    
    if (chatMoreVoiceBtn) {
        chatMoreVoiceBtn.addEventListener('click', () => {
            document.getElementById('chat-more-panel').classList.add('hidden');
            const fakeText = document.getElementById('voice-fake-text');
            const realRes = document.getElementById('voice-real-result');
            const sendRealBtn = document.getElementById('send-real-voice-btn');
            
            if (fakeText) fakeText.value = '';
            if (realRes) realRes.textContent = '';
            if (sendRealBtn) sendRealBtn.disabled = true;
            
            if (typeof window.switchVoiceTab === 'function') {
                window.switchVoiceTab('fake');
            }
            
            voiceInputModal.classList.remove('hidden');
        });
    }

    if (closeVoiceInputBtn) {
        closeVoiceInputBtn.addEventListener('click', () => {
            voiceInputModal.classList.add('hidden');
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                isRecording = false;
                const micBtn = document.getElementById('voice-mic-btn');
                if (micBtn) micBtn.classList.remove('recording');
                const statusText = document.getElementById('voice-recording-status');
                if (statusText) {
                    statusText.textContent = '点击麦克风开始录音';
                    statusText.style.color = '#888';
                }
            }
        });
    }

    const sendFakeVoiceBtn = document.getElementById('send-fake-voice-btn');
    const voiceFakeDuration = document.getElementById('voice-fake-duration');
    
    if (voiceFakeDuration) {
        voiceFakeDuration.addEventListener('input', (e) => {
            const valSpan = document.getElementById('voice-fake-duration-val');
            if (valSpan) valSpan.textContent = e.target.value;
        });
    }

    if (sendFakeVoiceBtn) {
        const newBtn = sendFakeVoiceBtn.cloneNode(true);
        sendFakeVoiceBtn.parentNode.replaceChild(newBtn, sendFakeVoiceBtn);
        
        newBtn.addEventListener('click', handleSendFakeVoice);
    }

    const voiceMicBtn = document.getElementById('voice-mic-btn');
    const sendRealVoiceBtn = document.getElementById('send-real-voice-btn');

    if (voiceMicBtn) {
        const newMicBtn = voiceMicBtn.cloneNode(true);
        voiceMicBtn.parentNode.replaceChild(newMicBtn, voiceMicBtn);
        
        newMicBtn.addEventListener('click', toggleVoiceRecording);
    }

    if (sendRealVoiceBtn) {
        const newSendRealBtn = sendRealVoiceBtn.cloneNode(true);
        sendRealVoiceBtn.parentNode.replaceChild(newSendRealBtn, sendRealVoiceBtn);

        newSendRealBtn.addEventListener('click', handleSendRealVoice);
    }

    window.switchVoiceTab = function(mode) {
        const fakeTab = document.getElementById('tab-voice-fake');
        const realTab = document.getElementById('tab-voice-real');
        const fakeMode = document.getElementById('voice-mode-fake');
        const realMode = document.getElementById('voice-mode-real');
        const indicator = document.getElementById('voice-nav-indicator');

        if (mode === 'fake') {
            if(fakeTab) fakeTab.classList.add('active');
            if(realTab) realTab.classList.remove('active');
            if(fakeMode) fakeMode.classList.remove('hidden');
            if(realMode) realMode.classList.add('hidden');
            if(indicator) indicator.style.transform = 'translateX(0)';
        } else {
            if(fakeTab) fakeTab.classList.remove('active');
            if(realTab) realTab.classList.add('active');
            if(fakeMode) fakeMode.classList.add('hidden');
            if(realMode) realMode.classList.remove('hidden');
            if(indicator) indicator.style.transform = 'translateX(100%)';
        }
    };

    document.addEventListener('click', (e) => {
        const chatInputArea = document.querySelector('.chat-input-area');
        
        if (chatMorePanel && chatMorePanel.classList.contains('slide-in') && 
            !chatMorePanel.contains(e.target) && 
            !chatMoreBtn.contains(e.target)) {
            chatMorePanel.classList.remove('slide-in');
            if (chatInputArea) chatInputArea.classList.remove('push-up-more');
        }
        
        const currentStickerBtn = document.getElementById('sticker-btn');
        if (stickerPanel && stickerPanel.classList.contains('slide-in') && 
            !stickerPanel.contains(e.target) && 
            (currentStickerBtn ? !currentStickerBtn.contains(e.target) : true)) {
            stickerPanel.classList.remove('slide-in');
            if (chatInputArea) chatInputArea.classList.remove('push-up');
        }
    });

    if (chatInput) {
        chatInput.addEventListener('focus', () => {
            const chatInputArea = document.querySelector('.chat-input-area');
            if (chatMorePanel) chatMorePanel.classList.remove('slide-in');
            if (stickerPanel) stickerPanel.classList.remove('slide-in');
            if (chatInputArea) {
                chatInputArea.classList.remove('push-up');
                chatInputArea.classList.remove('push-up-more');
            }
        });
    }

    setupAiListeners(false);
    setupAiListeners(true);
    setupWhisperListeners();
    setupMinimaxListeners();

    const chatMorePhotoBtn = document.getElementById('chat-more-photo-btn');
    const chatPhotoInput = document.getElementById('chat-photo-input');
    
    if (chatMorePhotoBtn && chatPhotoInput) {
        chatMorePhotoBtn.addEventListener('click', () => chatPhotoInput.click());
        chatPhotoInput.addEventListener('change', handleChatPhotoUpload);
    }

    const chatMoreCameraBtn = document.getElementById('chat-more-camera-btn');
    if (chatMoreCameraBtn) {
        chatMoreCameraBtn.addEventListener('click', handleChatCamera);
    }

    const chatMoreVideoCallBtn = document.getElementById('chat-more-video-call-btn');
    const videoCallModal = document.getElementById('video-call-modal');
    const startVoiceCallBtn = document.getElementById('start-voice-call-btn');
    const startVideoCallBtn = document.getElementById('start-video-call-btn');
    const cancelVideoCallBtn = document.getElementById('cancel-video-call-btn');

    if (chatMoreVideoCallBtn) {
        chatMoreVideoCallBtn.addEventListener('click', () => {
            document.getElementById('chat-more-panel').classList.add('hidden');
            videoCallModal.classList.remove('hidden');
        });
    }

    if (cancelVideoCallBtn) {
        cancelVideoCallBtn.addEventListener('click', () => {
            videoCallModal.classList.add('hidden');
        });
    }

    if (startVoiceCallBtn) {
        startVoiceCallBtn.addEventListener('click', () => {
            videoCallModal.classList.add('hidden');
            startOutgoingCall();
        });
    }

    if (startVideoCallBtn) {
        startVideoCallBtn.addEventListener('click', () => {
            videoCallModal.classList.add('hidden');
            startOutgoingVideoCall();
        });
    }

    const voiceCallAcceptBtn = document.getElementById('voice-call-accept-btn');
    const voiceCallRejectBtn = document.getElementById('voice-call-reject-btn');

    if (voiceCallAcceptBtn) {
        const newBtn = voiceCallAcceptBtn.cloneNode(true);
        voiceCallAcceptBtn.parentNode.replaceChild(newBtn, voiceCallAcceptBtn);
        newBtn.addEventListener('click', acceptIncomingCall);
    }

    if (voiceCallRejectBtn) {
        const newBtn = voiceCallRejectBtn.cloneNode(true);
        voiceCallRejectBtn.parentNode.replaceChild(newBtn, voiceCallRejectBtn);
        newBtn.addEventListener('click', rejectIncomingCall);
    }

    const chatMoreMemoryBtn = document.getElementById('chat-more-memory-btn');
    if (chatMoreMemoryBtn) {
        chatMoreMemoryBtn.addEventListener('click', () => {
            if (window.openMemoryApp) window.openMemoryApp();
            document.getElementById('chat-more-panel').classList.add('hidden');
        });
    }

    const chatMoreLocationBtn = document.getElementById('chat-more-location-btn');
    if (chatMoreLocationBtn) {
        chatMoreLocationBtn.addEventListener('click', () => {
            if (window.openLocationApp) window.openLocationApp();
        });
    }

    const chatMoreTransferBtn = document.getElementById('chat-more-transfer-btn');
    const transferModal = document.getElementById('transfer-modal');
    const closeTransferBtn = document.getElementById('close-transfer-modal');
    const doTransferBtn = document.getElementById('do-transfer-btn');

    if (chatMoreTransferBtn) {
        chatMoreTransferBtn.addEventListener('click', () => {
            document.getElementById('transfer-amount').value = '';
            document.getElementById('transfer-remark').value = '';
            transferModal.classList.remove('hidden');
            document.getElementById('chat-more-panel').classList.add('hidden');
        });
    }

    if (closeTransferBtn) {
        closeTransferBtn.addEventListener('click', () => transferModal.classList.add('hidden'));
    }

    if (doTransferBtn) {
        doTransferBtn.addEventListener('click', handleTransfer);
    }

    const closeReplyBarBtn = document.getElementById('close-reply-bar');
    if (closeReplyBarBtn) {
        closeReplyBarBtn.addEventListener('click', cancelQuote);
    }

    const chatMoreRegenerateBtn = document.getElementById('chat-more-regenerate-btn');
    if (chatMoreRegenerateBtn) {
        chatMoreRegenerateBtn.addEventListener('click', handleRegenerateReply);
    }

    const multiSelectCancelBtn = document.getElementById('multi-select-cancel');
    const multiSelectDeleteBtn = document.getElementById('multi-select-delete');
    
    if (multiSelectCancelBtn) multiSelectCancelBtn.addEventListener('click', exitMultiSelectMode);
    if (multiSelectDeleteBtn) multiSelectDeleteBtn.addEventListener('click', deleteSelectedMessages);

    const editChatMsgModal = document.getElementById('edit-chat-msg-modal');
    const closeEditChatMsgBtn = document.getElementById('close-edit-chat-msg');
    const saveEditChatMsgBtn = document.getElementById('save-edit-chat-msg-btn');

    const contactsTitleBtn = document.getElementById('contacts-title-btn');
    if (contactsTitleBtn) {
        contactsTitleBtn.addEventListener('click', window.openNewFriendsScreen);
    }

    if (closeEditChatMsgBtn) {
        closeEditChatMsgBtn.addEventListener('click', () => {
            editChatMsgModal.classList.add('hidden');
            currentEditingChatMsgId = null;
        });
    }

    if (saveEditChatMsgBtn) {
        saveEditChatMsgBtn.addEventListener('click', handleSaveEditedChatMessage);
    }

    const closeAutoSnapshotBtn = document.getElementById('close-auto-snapshot');
    const saveAutoSnapshotBtn = document.getElementById('save-auto-snapshot-btn');

    if (closeAutoSnapshotBtn) {
        closeAutoSnapshotBtn.addEventListener('click', () => {
            document.getElementById('auto-snapshot-modal').classList.add('hidden');
        });
    }

    if (saveAutoSnapshotBtn) {
        saveAutoSnapshotBtn.addEventListener('click', handleSaveAutoSnapshotSettings);
    }

    const closeEditBlockBtn = document.getElementById('close-edit-block');
    const saveEditBlockBtn = document.getElementById('save-edit-block-btn');

    if (closeEditBlockBtn) {
        closeEditBlockBtn.addEventListener('click', () => {
            document.getElementById('edit-block-modal').classList.add('hidden');
        });
    }

    if (saveEditBlockBtn) {
        saveEditBlockBtn.addEventListener('click', handleSaveEditBlock);
    }

    // 系统通知设置
    const sysNotifToggle = document.getElementById('system-notification-toggle');
    if (sysNotifToggle) {
        sysNotifToggle.checked = window.iphoneSimState.enableSystemNotifications || false;
        
        sysNotifToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                if (!("Notification" in window)) {
                    alert("此浏览器不支持系统通知");
                    e.target.checked = false;
                    return;
                }

                if (Notification.permission === "granted") {
                    window.iphoneSimState.enableSystemNotifications = true;
                    saveConfig();
                    new Notification("通知已开启", { body: "你现在可以接收后台消息通知了" });
                } else if (Notification.permission !== "denied") {
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                        window.iphoneSimState.enableSystemNotifications = true;
                        saveConfig();
                        new Notification("通知已开启", { body: "你现在可以接收后台消息通知了" });
                    } else {
                        e.target.checked = false;
                        alert("需要通知权限才能开启此功能");
                    }
                } else {
                    e.target.checked = false;
                    alert("通知权限已被拒绝，请在浏览器设置中手动开启");
                }
            } else {
                window.iphoneSimState.enableSystemNotifications = false;
                saveConfig();
            }
        });
    }

    // 后台音频混音设置
    const bgAudioToggle = document.getElementById('background-audio-toggle');
    if (bgAudioToggle) {
        bgAudioToggle.checked = window.iphoneSimState.enableBackgroundAudio || false;
        
        bgAudioToggle.addEventListener('change', (e) => {
            window.iphoneSimState.enableBackgroundAudio = e.target.checked;
            saveConfig();
            
            if (window.updateAudioSession) {
                window.updateAudioSession();
            }
            
            if (e.target.checked) {
                // 尝试请求播放静音音频以激活会话（如果是用户交互触发）
                // 这在某些浏览器上可能有助于立即生效
                if (window.iphoneSimState.music && window.iphoneSimState.music.playing) {
                    // 如果正在播放，不需要做什么，updateAudioSession 会处理 Session 类型
                }
            }
        });
    }
}

function updateWechatHeader(tab) {
    const header = document.querySelector('#wechat-app .wechat-header');
    if (!header) return;

    const title = header.querySelector('.wechat-title');
    const left = header.querySelector('.header-left');
    const right = header.querySelector('.header-right');
    const body = document.getElementById('wechat-body');

    header.className = 'wechat-header';
    header.style.display = '';
    header.style.backgroundColor = '';
    if (body) body.classList.remove('full-screen');
    
    if (left) left.innerHTML = '';
    if (right) right.innerHTML = '';

    const closeApp = () => {
        document.getElementById('wechat-app').classList.add('hidden');
    };

    if (tab === 'wechat') {
        if (title) title.textContent = '微信';
        
        if (left) {
            const closeBtn = document.createElement('div');
            closeBtn.className = 'header-btn-text';
            closeBtn.textContent = '关闭';
            closeBtn.onclick = closeApp;
            left.appendChild(closeBtn);
        }

        if (right) {
            const addBtn = document.createElement('div');
            addBtn.className = 'wechat-icon-btn';
            addBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
            addBtn.onclick = () => document.getElementById('add-contact-modal').classList.remove('hidden');
            right.appendChild(addBtn);
        }

    } else if (tab === 'contacts') {
        header.style.display = 'none';
        
        const addBtnCustom = document.getElementById('add-contact-btn-custom');
        if (addBtnCustom) {
            const newBtn = addBtnCustom.cloneNode(true);
            addBtnCustom.parentNode.replaceChild(newBtn, addBtnCustom);
            newBtn.addEventListener('click', () => document.getElementById('add-contact-modal').classList.remove('hidden'));
        }

        const backBtnCustom = document.getElementById('contacts-back-btn');
        if (backBtnCustom) {
            const newBackBtn = backBtnCustom.cloneNode(true);
            backBtnCustom.parentNode.replaceChild(newBackBtn, backBtnCustom);
            newBackBtn.addEventListener('click', closeApp);
        }

    } else if (tab === 'addressbook') {
        header.style.display = 'none';
        
        const addBtnAddressBook = document.getElementById('add-contact-btn-addressbook');
        if (addBtnAddressBook) {
            const newBtn = addBtnAddressBook.cloneNode(true);
            addBtnAddressBook.parentNode.replaceChild(newBtn, addBtnAddressBook);
            newBtn.addEventListener('click', () => document.getElementById('add-contact-modal').classList.remove('hidden'));
        }
        
        if (typeof window.renderAddressBook === 'function') {
            window.renderAddressBook();
        } else {
            console.error('renderAddressBook not found');
        }

    } else if (tab === 'moments') {
        if (title) title.textContent = ''; 
        header.classList.add('transparent');
        if (body) body.classList.add('full-screen');

        if (left) {
            const backBtn = document.createElement('div');
            backBtn.className = 'wechat-icon-btn';
            backBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            const goBack = () => {
                const contactsTab = document.querySelector('#wechat-app .wechat-tab-item[data-tab="contacts"]');
                if (contactsTab) contactsTab.click();
            };
            backBtn.onclick = goBack;
            backBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                goBack();
            }, { passive: false });
            left.appendChild(backBtn);
        }

        if (right) {
            const cameraBtn = document.createElement('div');
            cameraBtn.className = 'wechat-icon-btn';
            cameraBtn.style.marginRight = '10px';
            cameraBtn.innerHTML = '<i class="fas fa-camera"></i>';
            const doPost = () => {
                if (window.openPostMoment) window.openPostMoment(false);
            };
            cameraBtn.onclick = doPost;
            cameraBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                doPost();
            }, { passive: false });
            right.appendChild(cameraBtn);
        }

    } else if (tab === 'me') {
        header.style.display = 'none';
        if (body) body.classList.add('full-screen');
    }
}

function renderGroupList() {
    const list = document.getElementById('group-list');
    if (!list) return;
    list.innerHTML = '';

    const noGroupItem = document.createElement('div');
    noGroupItem.className = 'list-item center-content';
    noGroupItem.textContent = '未分组';
    if (!window.iphoneSimState.tempSelectedGroup) {
        noGroupItem.style.color = '#007AFF';
        noGroupItem.style.fontWeight = 'bold';
    }
    noGroupItem.onclick = () => handleSelectGroup('');
    list.appendChild(noGroupItem);

    if (window.iphoneSimState.contactGroups && window.iphoneSimState.contactGroups.length > 0) {
        window.iphoneSimState.contactGroups.forEach(group => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            const content = document.createElement('div');
            content.className = 'list-content';
            content.style.justifyContent = 'center';
            content.textContent = group;
            
            if (window.iphoneSimState.tempSelectedGroup === group) {
                content.style.color = '#007AFF';
                content.style.fontWeight = 'bold';
            }

            const deleteBtn = document.createElement('i');
            deleteBtn.className = 'fas fa-trash';
            deleteBtn.style.color = '#FF3B30';
            deleteBtn.style.marginLeft = '10px';
            deleteBtn.style.fontSize = '14px';
            deleteBtn.style.padding = '5px';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                handleDeleteGroup(group);
            };

            item.style.justifyContent = 'space-between';
            item.innerHTML = '';
            
            const leftSpacer = document.createElement('div');
            leftSpacer.style.width = '24px';
            item.appendChild(leftSpacer);

            item.appendChild(content);
            item.appendChild(deleteBtn);

            item.onclick = () => handleSelectGroup(group);
            list.appendChild(item);
        });
    }
}

function openGroupSelect() {
    renderGroupList();
    document.getElementById('group-select-modal').classList.remove('hidden');
}

function handleCreateGroup() {
    const name = prompt('请输入新分组名称：');
    if (!name) return;
    
    if (window.iphoneSimState.contactGroups.includes(name)) {
        alert('分组已存在');
        return;
    }
    
    window.iphoneSimState.contactGroups.push(name);
    saveConfig();
    renderGroupList();
}

function handleDeleteGroup(groupName) {
    if (confirm(`确定要删除分组 "${groupName}" 吗？`)) {
        window.iphoneSimState.contactGroups = window.iphoneSimState.contactGroups.filter(g => g !== groupName);
        
        if (window.iphoneSimState.tempSelectedGroup === groupName) {
            window.iphoneSimState.tempSelectedGroup = '';
            document.getElementById('chat-setting-group-value').textContent = '未分组';
        }
        
        window.iphoneSimState.contacts.forEach(c => {
            if (c.group === groupName) {
                c.group = '';
            }
        });
        
        saveConfig();
        renderGroupList();
    }
}

function handleSelectGroup(groupName) {
    window.iphoneSimState.tempSelectedGroup = groupName;
    document.getElementById('chat-setting-group-value').textContent = groupName || '未分组';
    document.getElementById('group-select-modal').classList.add('hidden');
}

function getLinkedIcityBooksContext(contactId) {
    if (!window.iphoneSimState.icityBooks || window.iphoneSimState.icityBooks.length === 0) return '';
    
    const linkedBooks = window.iphoneSimState.icityBooks.filter(b => 
        b.linkedContactIds && b.linkedContactIds.includes(contactId)
    );
    
    if (linkedBooks.length === 0) return '';
    
    let context = '\n【共读的书籍/手账】\n你们正在共同编辑以下书籍，你可以看到用户写的内容以及你之前的批注：\n';
    
    linkedBooks.forEach(book => {
        context += `\n《${book.name}》:\n`;
        if (!book.pages || book.pages.length === 0) {
            context += "(空白)\n";
            return;
        }
        
        book.pages.forEach((page, index) => {
            let content = page.content || '';
            // Temporary DOM element for parsing
            const div = document.createElement('div');
            div.innerHTML = content;
            
            // Process Ruby (Comments)
            div.querySelectorAll('ruby').forEach(el => {
                let text = '';
                if (el.childNodes.length > 0 && el.childNodes[0].nodeType === 3) {
                    text = el.childNodes[0].textContent;
                } else {
                    text = el.textContent.replace(el.querySelector('rt')?.textContent || '', '');
                }
                const rt = el.querySelector('rt');
                const annotation = rt ? rt.textContent : '';
                const replaceText = `${text} (你的批注: ${annotation})`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Strikethrough
            div.querySelectorAll('s').forEach(el => {
                const text = el.textContent;
                const replaceText = `${text} (已划掉)`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Highlight
            div.querySelectorAll('.highlight-marker').forEach(el => {
                const text = el.textContent;
                const replaceText = `${text} (高亮)`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Handwritten (AI added text)
            div.querySelectorAll('.handwritten-text').forEach(el => {
                const text = el.textContent;
                const replaceText = `(你的手写: ${text})`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Stickers
            div.querySelectorAll('img.icity-sticker').forEach(el => {
                const src = el.src;
                let name = '未知贴纸';
                if (window.iphoneSimState.stickerCategories) {
                    for (const cat of window.iphoneSimState.stickerCategories) {
                        const found = cat.list.find(s => src.includes(s.url) || s.url === src);
                        if (found) {
                            name = found.desc;
                            break;
                        }
                    }
                }
                const replaceText = `[贴纸: ${name}]`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process other images
            div.querySelectorAll('img').forEach(el => {
                 el.replaceWith(document.createTextNode('[图片]'));
            });

            const textContent = div.textContent.trim();
            if (textContent) {
                context += `第 ${index + 1} 页: ${textContent}\n`;
            }
        });
    });
    
    return context;
}

function formatElapsedZh(ms) {
    const safeMs = Math.max(0, Number(ms) || 0);
    const totalMinutes = Math.floor(safeMs / 60000);
    if (totalMinutes < 1) return '不到1分钟';
    if (totalMinutes < 60) return `${totalMinutes}分钟`;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours < 24) return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return remHours > 0 ? `${days}天${remHours}小时` : `${days}天`;
}

function isRealConversationMsg(msg) {
    if (!msg) return false;
    if (msg.role !== 'user' && msg.role !== 'assistant') return false;
    if (msg.type === 'system_event' || msg.type === 'live_sync_hidden' || msg.type === 'voice_call_text') return false;
    if (typeof msg.content !== 'string') return false;
    if (msg.type === 'text') {
        if (isHiddenForumWechatSyncText(msg.content)) return false;
        if (msg.content.startsWith('[系统消息]:') || msg.content.startsWith('[系统]:') || msg.content.startsWith('[系统错误]:') || msg.content.startsWith('[系统诊断]:')) return false;
    }
    return true;
}

function buildRealtimeTimeContext(contactId) {
    const nowMs = Date.now();
    const now = new Date(nowMs);
    const weekdayMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    const nowStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdayMap[now.getDay()]} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    const visibleMsgs = history.filter(isRealConversationMsg);
    const lastUserMsg = [...visibleMsgs].reverse().find(m => m.role === 'user') || null;
    const lastAssistantMsg = [...visibleMsgs].reverse().find(m => m.role === 'assistant') || null;
    const latestMsg = visibleMsgs.length > 0 ? visibleMsgs[visibleMsgs.length - 1] : null;

    const userGap = lastUserMsg ? formatElapsedZh(nowMs - (lastUserMsg.time || nowMs)) : '暂无';
    const aiGap = lastAssistantMsg ? formatElapsedZh(nowMs - (lastAssistantMsg.time || nowMs)) : '暂无';

    let roundState = '当前暂无完整互动记录';
    if (latestMsg) {
        const latestGap = formatElapsedZh(nowMs - (latestMsg.time || nowMs));
        if (latestMsg.role === 'user') {
            roundState = `用户刚发来消息，尚未收到你的新回复，已过去 ${latestGap}`;
        } else {
            roundState = `你刚回复完用户，用户暂未继续，已过去 ${latestGap}`;
        }
    }

    return `\n【当前真实时间】\n现在是：${nowStr}\n时区：${timezone}\n\n【时间间隔感知】\n- 距离用户上一条消息：${userGap}\n- 距离你上一条消息：${aiGap}\n- 当前互动状态：${roundState}\n\n⚠️ 重要提示：\n- 你必须严格以以上时间信息判断“现在”和“间隔”，不要自行编造时间。\n- 若间隔较长，请自然体现时间感（例如“刚忙完”“久等了”），但避免每句都提时间。\n`;
}

function getLastAiBlockJson(contactId) {
    const history = window.iphoneSimState.chatHistory[contactId];
    if (!history || history.length === 0) return null;

    let indices = [];
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') {
            indices.unshift(i);
        } else {
            break;
        }
    }

    if (indices.length === 0) return null;

    let jsonOutput = [];
    
    for (let i = 0; i < indices.length; i++) {
        const msg = history[indices[i]];
        
        if (msg.thought) {
            jsonOutput.push({ type: "thought", content: msg.thought });
        }

        if (msg.type === 'text') {
            jsonOutput.push({ type: "text", content: msg.content });
        } else if (msg.type === 'sticker') {
            jsonOutput.push({ type: "sticker", content: msg.description || msg.content });
        } else if (msg.type === 'image' || msg.type === 'virtual_image') {
            const item = { type: "image", content: msg.description || "未知图片" };
            if (msg.novelaiPrompt) item.novelaiPrompt = msg.novelaiPrompt;
            if (msg.novelaiNegativePrompt) item.novelaiNegativePrompt = msg.novelaiNegativePrompt;
            jsonOutput.push(item);
        } else if (msg.type === 'voice') {
            let content = "语音";
            let duration = 3;
            try {
                const data = JSON.parse(msg.content);
                content = data.text;
                duration = data.duration;
            } catch(e) {}
            jsonOutput.push({ type: "voice", duration: duration, content: content });
        } else if (msg.type === 'description') {
             jsonOutput.push({ type: "text", content: msg.content }); 
        } else if (msg.type === 'transfer') {
             try {
                 const data = JSON.parse(msg.content);
                 jsonOutput.push({ type: "action", command: "TRANSFER", payload: `${data.amount} ${data.remark}` });
             } catch(e) {}
        }
    }

    return JSON.stringify(jsonOutput, null, 2);
}

function checkActiveReplies() {
    if (!window.iphoneSimState || !window.iphoneSimState.contacts) return;
    
    const now = Date.now();
    
    window.iphoneSimState.contacts.forEach(contact => {
        if (!contact.activeReplyEnabled) return;
        
        const history = window.iphoneSimState.chatHistory[contact.id];
        if (!history || history.length === 0) return;
        
        const lastMsg = history[history.length - 1];
        const intervalMs = (contact.activeReplyInterval || 60) * 1000;
        
        // Ensure we only count messages sent AFTER the feature was enabled
        if (contact.activeReplyStartTime && lastMsg.time <= contact.activeReplyStartTime) {
            return;
        }

        if (contact.lastActiveReplyTriggeredMsgId === lastMsg.id) return;
        
        if (now - lastMsg.time > intervalMs) {
            console.log(`[ActiveReply] Triggering for ${contact.name}`);
            
            contact.lastActiveReplyTriggeredMsgId = lastMsg.id;
            saveConfig();
            
            let activeInstruction = "";
            const timeDiff = now - lastMsg.time;
            const minutesPassed = Math.floor(timeDiff / 60000);
            
            if (lastMsg.role === 'user') {
                // User sent last message, AI is replying late
                activeInstruction = `（系统提示：主动发消息模式触发。距离用户上一条消息已过去 ${minutesPassed} 分钟。请回复用户的消息。你可以顺便解释一下为什么回复晚了，或者直接自然地继续话题。）`;
            } else {
                // AI sent last message, User didn't reply
                activeInstruction = `（系统提示：主动发消息模式触发。距离你上一条消息已过去 ${minutesPassed} 分钟，用户一直没有回复。请主动发起一条新消息，可以是对上一条的补充，或者是开启新话题，或者是分享当下的心情/状态。请保持自然，不要暴露你是AI。）`;
            }

            generateAiReply(activeInstruction, contact.id);
        }
    });
}

window.updateSystemSettingsUi = function() {
    const sysNotifToggle = document.getElementById('system-notification-toggle');
    if (sysNotifToggle) {
        sysNotifToggle.checked = window.iphoneSimState.enableSystemNotifications || false;
    }
    
    const bgAudioToggle = document.getElementById('background-audio-toggle');
    if (bgAudioToggle) {
        bgAudioToggle.checked = window.iphoneSimState.enableBackgroundAudio || false;
    }
};

// helper: generate simple forum post content based on recent chat
window.generateForumPostContent = async function(contactId) {
    const history = window.iphoneSimState.chatHistory[contactId] || [];
    let content = '自动发帖';
    if (history.length > 0) {
        const last = history[history.length-1];
        content += '：'+ (last.content || '').substring(0, 50);
    }
    return content;
};

// scheduler for auto-posting
window.startForumAutoPostScheduler = function() {
    setInterval(async () => {
        if (!window.forumState) return; // forum module not initialized yet
        const contacts = window.iphoneSimState.contacts || [];
        if (!contacts.length) return;
        contacts.forEach(async c => {
            const profiles = (window.forumState && window.forumState.settings && window.forumState.settings.contactProfiles) ? window.forumState.settings.contactProfiles : {};
            const prof = profiles[c.id] || {};
            if (prof.syncWechat && prof.autoPostEnabled && prof.autoPostInterval > 0) {
                const now = Date.now();
                if (!prof._lastAutoPost) prof._lastAutoPost = 0;
                if (now - prof._lastAutoPost >= prof.autoPostInterval * 60000) {
                    prof._lastAutoPost = now;
                    profiles[c.id] = prof;
                    if (window.forumState && window.forumState.settings) {
                        window.forumState.settings.contactProfiles = profiles;
                        localStorage.setItem('forum_settings', JSON.stringify(window.forumState.settings));
                    }
                    let caption = await window.generateForumPostContent(c.id);
                    if (window.addForumPost) window.addForumPost(c.id, caption, []);
                }
            }
        });
    }, 60000);
};

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupChatListeners);
    window.appInitFunctions.push(() => {
        setInterval(checkActiveReplies, 5000);
    });
    window.appInitFunctions.push(() => {
        if (window.startForumAutoPostScheduler) window.startForumAutoPostScheduler();
    });
}

