// NovelAI Image Generation Module

window.generateNovelAiImageApi = async function(options) {
    const {
        key,
        model = 'nai-diffusion-3',
        prompt,
        negativePrompt = '',
        steps = 28,
        scale = 5,
        seed = -1,
        width = 832,
        height = 1216
    } = options;

    if (!key) throw new Error('Missing API Key');

    const seedVal = seed === -1 ? Math.floor(Math.random() * 4294967295) : seed;
    const url = "https://image.novelai.net/ai/generate-image";

    const parameters = {
        params_version: 3,
        width: width,
        height: height,
        scale: scale,
        sampler: "k_euler_ancestral",
        steps: steps,
        n_samples: 1,
        seed: seedVal,
        ucPreset: 0,
        qualityToggle: true,
        sm: false,
        sm_dyn: false,
        dynamic_thresholding: false,
        controlnet_strength: 1,
        legacy: false,
        add_original_image: true,
        cfg_rescale: 0,
        noise_schedule: "karras",
        legacy_v3_extend: false,
        skip_cfg_above_sigma: null,
        use_coords: false,
        negative_prompt: negativePrompt
    };

    if (model.includes('diffusion-4')) {
        parameters.characterPrompts = [];
        parameters.v4_prompt = {
            caption: { base_caption: prompt, char_captions: [] },
            use_coords: false, use_order: true
        };
        parameters.v4_negative_prompt = {
            caption: { base_caption: negativePrompt, char_captions: [] },
            legacy_uc: false
        };
        parameters.deliberate_euler_ancestral_bug = false;
        parameters.prefer_brownian = true;
    }

    const payload = {
        input: prompt,
        model: model,
        action: "generate",
        parameters: parameters
    };

    console.log('Sending NovelAI API request:', payload);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errText}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType && (contentType.includes('application/zip') || contentType === 'binary/octet-stream')) {
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const view = new Uint8Array(buffer);
        
        if (view[0] === 0x50 && view[1] === 0x4B) { // PK header
            if (window.JSZip) {
                const zip = new JSZip();
                const zipContent = await zip.loadAsync(blob);
                const filename = Object.keys(zipContent.files)[0];
                if (filename) {
                    const fileData = await zipContent.files[filename].async('base64');
                    let mime = 'image/png';
                    if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) mime = 'image/jpeg';
                    return `data:${mime};base64,` + fileData;
                }
            }
            throw new Error('ZIP response parsing failed (JSZip missing or empty)');
        } else {
            return URL.createObjectURL(blob);
        }
    } else if (contentType && contentType.startsWith('image/')) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } else {
        // SSE
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data:')) {
                    const dataStr = line.slice(5).trim();
                    if (dataStr === '[DONE]') continue;
                    
                    // Direct base64 check
                    if (dataStr.startsWith('iVBOR') || dataStr.startsWith('/9j/')) {
                        return 'data:image/png;base64,' + dataStr;
                    }
                    
                    try {
                        const json = JSON.parse(dataStr);
                        // Some versions wrap base64 in json
                        // Just simpler to check string content if possible or structure
                        // But usually it's direct data line
                    } catch(e) {}
                }
            }
        }
        // Check remaining buffer
         if (buffer.startsWith('data:')) {
             const dataStr = buffer.slice(5).trim();
             if (dataStr.startsWith('iVBOR') || dataStr.startsWith('/9j/')) {
                return 'data:image/png;base64,' + dataStr;
             }
         }
         
         throw new Error('No image data found in response');
    }
};

(function() {
    // Helper to get presets
    function getPresets() {
        return window.iphoneSimState.novelaiPresets || [];
    }

    // Helper to save presets
    function savePresets(presets) {
        window.iphoneSimState.novelaiPresets = presets;
        if (window.saveConfig) window.saveConfig();
    }

    // Expose UI update function
    window.updateNovelAiUi = function() {
        const settings = window.iphoneSimState.novelaiSettings;
        if (!settings) return;

        console.log('Initializing NovelAI UI...');

        // -1. Enabled Toggle
        const enabledToggle = document.getElementById('novelai-chat-enabled');
        if (enabledToggle) {
            enabledToggle.checked = settings.enabled !== false; // Default true
            enabledToggle.addEventListener('change', (e) => {
                settings.enabled = e.target.checked;
                if (window.saveConfig) window.saveConfig();
            });
        }

        // 0. Preset Management
        const presetSelect = document.getElementById('novelai-preset-select');
        const savePresetBtn = document.getElementById('save-novelai-preset');
        const deletePresetBtn = document.getElementById('delete-novelai-preset');

        if (presetSelect && savePresetBtn && deletePresetBtn) {
            const renderPresets = () => {
                const currentVal = presetSelect.value;
                presetSelect.innerHTML = '<option value="">-- 选择预设 --</option>';
                getPresets().forEach(p => {
                    const opt = document.createElement('option');
                    opt.value = p.name;
                    opt.textContent = p.name;
                    presetSelect.appendChild(opt);
                });
                if (currentVal && getPresets().some(p => p.name === currentVal)) {
                    presetSelect.value = currentVal;
                }
            };

            renderPresets();

            savePresetBtn.onclick = () => {
                const name = prompt('请输入预设名称：');
                if (!name) return;
                
                const newPreset = {
                    name: name,
                    settings: {
                        model: settings.model,
                        prompt: settings.defaultPrompt,
                        negativePrompt: settings.negativePrompt,
                        steps: settings.steps,
                        scale: settings.cfg,
                        seed: settings.seed,
                        width: settings.width,
                        height: settings.height
                    }
                };

                const presets = getPresets();
                const existingIndex = presets.findIndex(p => p.name === name);
                if (existingIndex !== -1) {
                    if (!confirm(`预设 "${name}" 已存在，要覆盖吗？`)) return;
                    presets[existingIndex] = newPreset;
                } else {
                    presets.push(newPreset);
                }
                
                savePresets(presets);
                renderPresets();
                presetSelect.value = name;
                alert('预设已保存');
                
                // Update chat settings selector if open
                if (window.renderChatNovelAiPresets) window.renderChatNovelAiPresets();
            };

            deletePresetBtn.onclick = () => {
                const name = presetSelect.value;
                if (!name) return;
                if (!confirm(`确定要删除预设 "${name}" 吗？`)) return;
                
                const presets = getPresets().filter(p => p.name !== name);
                savePresets(presets);
                renderPresets();
                presetSelect.value = '';
                
                // Update chat settings selector if open
                if (window.renderChatNovelAiPresets) window.renderChatNovelAiPresets();
            };

            presetSelect.onchange = (e) => {
                const name = e.target.value;
                if (!name) return;
                
                const preset = getPresets().find(p => p.name === name);
                if (preset && preset.settings) {
                    const s = preset.settings;
                    
                    if (s.model) {
                        settings.model = s.model;
                        const el = document.getElementById('novelai-model-select');
                        if (el) el.value = s.model;
                    }
                    if (s.prompt !== undefined) {
                        settings.defaultPrompt = s.prompt;
                        const el = document.getElementById('novelai-prompt');
                        if (el) el.value = s.prompt;
                    }
                    if (s.negativePrompt !== undefined) {
                        settings.negativePrompt = s.negativePrompt;
                        const el = document.getElementById('novelai-negative-prompt');
                        if (el) el.value = s.negativePrompt;
                    }
                    if (s.steps) {
                        settings.steps = s.steps;
                        const el = document.getElementById('novelai-steps');
                        if (el) {
                            el.value = s.steps;
                            const valEl = document.getElementById('novelai-steps-val');
                            if (valEl) valEl.textContent = s.steps;
                        }
                    }
                    if (s.scale) {
                        settings.cfg = s.scale;
                        const el = document.getElementById('novelai-scale');
                        if (el) {
                            el.value = s.scale;
                            const valEl = document.getElementById('novelai-scale-val');
                            if (valEl) valEl.textContent = s.scale;
                        }
                    }
                    if (s.seed !== undefined) {
                        settings.seed = s.seed;
                        const el = document.getElementById('novelai-seed');
                        if (el) el.value = s.seed;
                    }
                    if (s.width && s.height) {
                        settings.width = s.width;
                        settings.height = s.height;
                        const el = document.getElementById('novelai-size-select');
                        if (el) {
                            const sizeStr = `${s.width}x${s.height}`;
                            // Try to select if exists, otherwise default
                            let found = false;
                            for(let i=0; i<el.options.length; i++) {
                                if(el.options[i].value === sizeStr) {
                                    el.value = sizeStr;
                                    found = true;
                                    break;
                                }
                            }
                            if(!found && el.options.length > 0) el.value = el.options[0].value;
                        }
                    }
                    
                    if (window.saveConfig) window.saveConfig();
                }
            };
        }

        // 1. API Key
        const keyInput = document.getElementById('novelai-api-key');
        if (keyInput) {
            keyInput.value = settings.key || '';
            keyInput.addEventListener('change', (e) => {
                settings.key = e.target.value;
                if (window.saveConfig) window.saveConfig();
            });
        }

        // 2. Model
        const modelSelect = document.getElementById('novelai-model-select');
        if (modelSelect) {
            modelSelect.value = settings.model || 'nai-diffusion-3';
            modelSelect.addEventListener('change', (e) => {
                settings.model = e.target.value;
                if (window.saveConfig) window.saveConfig();
            });
        }

        // 3. Prompt
        const promptInput = document.getElementById('novelai-prompt');
        if (promptInput) {
            promptInput.value = settings.defaultPrompt || '';
            promptInput.addEventListener('change', (e) => {
                settings.defaultPrompt = e.target.value;
                if (window.saveConfig) window.saveConfig();
            });
        }

        // 4. Negative Prompt
        const negInput = document.getElementById('novelai-negative-prompt');
        if (negInput) {
            negInput.value = settings.negativePrompt || '';
            negInput.addEventListener('change', (e) => {
                settings.negativePrompt = e.target.value;
                if (window.saveConfig) window.saveConfig();
            });
        }

        // 5. Size
        const sizeSelect = document.getElementById('novelai-size-select');
        if (sizeSelect) {
            // Try to match current width/height
            const currentSize = `${settings.width || 832}x${settings.height || 1216}`;
            // Check if option exists, otherwise default
            let found = false;
            for (let i = 0; i < sizeSelect.options.length; i++) {
                if (sizeSelect.options[i].value === currentSize) {
                    sizeSelect.value = currentSize;
                    found = true;
                    break;
                }
            }
            if (!found) sizeSelect.value = '832x1216';

            sizeSelect.addEventListener('change', (e) => {
                const [w, h] = e.target.value.split('x').map(Number);
                settings.width = w;
                settings.height = h;
                if (window.saveConfig) window.saveConfig();
            });
        }

        // 6. Steps
        const stepsInput = document.getElementById('novelai-steps');
        const stepsVal = document.getElementById('novelai-steps-val');
        if (stepsInput) {
            stepsInput.value = settings.steps || 28;
            if (stepsVal) stepsVal.textContent = stepsInput.value;
            
            stepsInput.addEventListener('input', (e) => {
                if (stepsVal) stepsVal.textContent = e.target.value;
            });
            stepsInput.addEventListener('change', (e) => {
                settings.steps = parseInt(e.target.value);
                if (window.saveConfig) window.saveConfig();
            });
        }

        // 7. Scale (CFG)
        const scaleInput = document.getElementById('novelai-scale');
        const scaleVal = document.getElementById('novelai-scale-val');
        if (scaleInput) {
            scaleInput.value = settings.cfg || 5;
            if (scaleVal) scaleVal.textContent = scaleInput.value;

            scaleInput.addEventListener('input', (e) => {
                if (scaleVal) scaleVal.textContent = e.target.value;
            });
            scaleInput.addEventListener('change', (e) => {
                settings.cfg = parseFloat(e.target.value);
                if (window.saveConfig) window.saveConfig();
            });
        }

        // 8. Seed
        const seedInput = document.getElementById('novelai-seed');
        if (seedInput) {
            seedInput.value = settings.seed !== undefined ? settings.seed : -1;
            seedInput.addEventListener('change', (e) => {
                settings.seed = parseInt(e.target.value);
                if (window.saveConfig) window.saveConfig();
            });
        }

        // 9. Generate Button
        const genBtn = document.getElementById('novelai-generate-btn');
        if (genBtn) {
            genBtn.onclick = generateImage;
        }

        // 10. Save Button
        const saveBtn = document.getElementById('novelai-save-btn');
        if (saveBtn) {
            saveBtn.onclick = () => {
                const img = document.getElementById('novelai-result-img');
                if (img && img.src && img.src.startsWith('data:image')) {
                    const a = document.createElement('a');
                    a.href = img.src;
                    a.download = `novelai-${Date.now()}.png`;
                    a.click();
                } else {
                    alert('没有可保存的图片');
                }
            };
        }
    };

    // Programmatic API for generating images
    window.generateNovelAiImageApi = async function(options) {
        const {
            key,
            model = 'nai-diffusion-3',
            prompt,
            negativePrompt = '',
            steps = 28,
            scale = 5,
            seed = -1,
            width = 832,
            height = 1216
        } = options;

        if (!key) throw new Error('Missing API Key');

        const seedVal = seed === -1 ? Math.floor(Math.random() * 4294967295) : seed;
        const url = "https://image.novelai.net/ai/generate-image";

        const parameters = {
            params_version: 3,
            width: width,
            height: height,
            scale: scale,
            sampler: "k_euler_ancestral",
            steps: steps,
            n_samples: 1,
            seed: seedVal,
            ucPreset: 0,
            qualityToggle: true,
            sm: false,
            sm_dyn: false,
            dynamic_thresholding: false,
            controlnet_strength: 1,
            legacy: false,
            add_original_image: true,
            cfg_rescale: 0,
            noise_schedule: "karras",
            legacy_v3_extend: false,
            skip_cfg_above_sigma: null,
            use_coords: false,
            negative_prompt: negativePrompt
        };

        if (model.includes('diffusion-4')) {
            parameters.characterPrompts = [];
            parameters.v4_prompt = {
                caption: { base_caption: prompt, char_captions: [] },
                use_coords: false, use_order: true
            };
            parameters.v4_negative_prompt = {
                caption: { base_caption: negativePrompt, char_captions: [] },
                legacy_uc: false
            };
            parameters.deliberate_euler_ancestral_bug = false;
            parameters.prefer_brownian = true;
        }

        const payload = {
            input: prompt,
            model: model,
            action: "generate",
            parameters: parameters
        };

        console.log('Sending NovelAI API request:', payload);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${key}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText}`);
        }

        const contentType = response.headers.get('content-type');
        
        if (contentType && (contentType.includes('application/zip') || contentType === 'binary/octet-stream')) {
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const view = new Uint8Array(buffer);
            
            if (view[0] === 0x50 && view[1] === 0x4B) { // PK header
                if (window.JSZip) {
                    const zip = new JSZip();
                    const zipContent = await zip.loadAsync(blob);
                    const filename = Object.keys(zipContent.files)[0];
                    if (filename) {
                        const fileData = await zipContent.files[filename].async('base64');
                        let mime = 'image/png';
                        if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) mime = 'image/jpeg';
                        return `data:${mime};base64,` + fileData;
                    }
                }
                throw new Error('ZIP response parsing failed (JSZip missing or empty)');
            } else {
                return URL.createObjectURL(blob);
            }
        } else if (contentType && contentType.startsWith('image/')) {
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        } else {
            // SSE
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        const dataStr = line.slice(5).trim();
                        if (dataStr === '[DONE]') continue;
                        
                        // Direct base64 check
                        if (dataStr.startsWith('iVBOR') || dataStr.startsWith('/9j/')) {
                            return 'data:image/png;base64,' + dataStr;
                        }
                        
                        try {
                            const json = JSON.parse(dataStr);
                            // Some versions wrap base64 in json
                            // Just simpler to check string content if possible or structure
                            // But usually it's direct data line
                        } catch(e) {}
                    }
                }
            }
            // Check remaining buffer
             if (buffer.startsWith('data:')) {
                 const dataStr = buffer.slice(5).trim();
                 if (dataStr.startsWith('iVBOR') || dataStr.startsWith('/9j/')) {
                    return 'data:image/png;base64,' + dataStr;
                 }
             }
             
             throw new Error('No image data found in response');
        }
    };

    async function generateImage() {
        const settings = window.iphoneSimState.novelaiSettings;
        if (!settings || !settings.key) {
            alert('请先填写 API Key');
            return;
        }

        const btn = document.getElementById('novelai-generate-btn');
        const resultContainer = document.getElementById('novelai-result-container');
        const resultImg = document.getElementById('novelai-result-img');
        const statusText = document.getElementById('novelai-status-text');

        // UI State
        btn.disabled = true;
        btn.textContent = '生成中...';
        resultContainer.classList.remove('hidden');
        statusText.textContent = '准备请求...';
        resultImg.style.display = 'none';
        resultImg.src = '';

        try {
            // Get values from UI
            const prompt = document.getElementById('novelai-prompt').value;
            const negPrompt = document.getElementById('novelai-negative-prompt').value;
            const steps = parseInt(document.getElementById('novelai-steps').value);
            const scale = parseFloat(document.getElementById('novelai-scale').value);
            const seedVal = parseInt(document.getElementById('novelai-seed').value);
            const model = document.getElementById('novelai-model-select').value;
            const [width, height] = document.getElementById('novelai-size-select').value.split('x').map(Number);

            statusText.textContent = '正在生成...';

            const imgSrc = await window.generateNovelAiImageApi({
                key: settings.key,
                model,
                prompt,
                negativePrompt: negPrompt,
                steps,
                scale,
                seed: seedVal,
                width,
                height
            });

            resultImg.src = imgSrc;
            resultImg.style.display = 'block';
            statusText.textContent = '生成成功';

        } catch (error) {
            console.error('NovelAI generation error:', error);
            statusText.textContent = '错误: ' + error.message;
            alert('生成失败: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = '生成图片';
        }
    }

})();
