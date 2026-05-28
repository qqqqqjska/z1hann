// NovelAI / Custom image generation module.
(function () {
    const NOVELAI_ENDPOINT = 'https://image.novelai.net/ai/generate-image';

    function asString(value) {
        return String(value === undefined || value === null ? '' : value).trim();
    }

    function safeNumber(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function clampNumber(value, min, max, fallback) {
        const parsed = safeNumber(value, fallback);
        return Math.min(max, Math.max(min, parsed));
    }

    function ensureNovelAiSettings() {
        if (!window.iphoneSimState || typeof window.iphoneSimState !== 'object') {
            window.iphoneSimState = {};
        }
        if (!window.iphoneSimState.novelaiSettings || typeof window.iphoneSimState.novelaiSettings !== 'object') {
            window.iphoneSimState.novelaiSettings = {};
        }

        const defaults = {
            url: 'https://api.novelai.net',
            key: '',
            provider: 'novelai',
            customApiUrl: '',
            customApiKey: '',
            customModel: '',
            customFetchPath: '/models',
            customGeneratePath: '/images/generations',
            customEditPath: '/images/edits',
            model: 'nai-diffusion-3',
            size: '832x1216',
            width: 832,
            height: 1216,
            steps: 28,
            cfg: 5,
            sampler: 'k_euler_ancestral',
            seed: -1,
            referenceStrength: 0.78,
            referenceInfoExtracted: 0.92,
            ucPreset: 0,
            addQualityTags: true,
            smea: false,
            smeaDyn: false,
            defaultPrompt: '((full body shot:1.6)), (solo character:1.5), dynamic pose, 1boy, ((manly))',
            negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
            corsProxy: 'corsproxy.io'
        };

        const settings = window.iphoneSimState.novelaiSettings;
        Object.keys(defaults).forEach((key) => {
            if (settings[key] === undefined || settings[key] === null) {
                settings[key] = defaults[key];
            }
        });
        if (settings.provider !== 'custom' && settings.provider !== 'novelai') {
            settings.provider = 'novelai';
        }
        return settings;
    }

    function setSelectValueWithFallback(select, value) {
        if (!select) return;
        const target = asString(value);
        if (!target) return;
        const exists = Array.from(select.options || []).some(opt => String(opt.value) === target);
        if (!exists) {
            const option = document.createElement('option');
            option.value = target;
            option.textContent = target;
            select.appendChild(option);
        }
        select.value = target;
    }

    function stripTrailingSlash(url) {
        return asString(url).replace(/\/+$/, '');
    }

    function joinUrl(base, path) {
        const baseValue = stripTrailingSlash(base);
        const pathValue = asString(path).replace(/^\/+/, '');
        if (!baseValue) return '';
        if (!pathValue) return baseValue;
        return `${baseValue}/${pathValue}`;
    }

    function looksLikeGenerateEndpoint(url) {
        return /\/images\/generations\/?(\?.*)?$/i.test(asString(url));
    }

    function looksLikeEditEndpoint(url) {
        return /\/images\/edits\/?(\?.*)?$/i.test(asString(url));
    }

    function stripGenerateSuffix(url) {
        return asString(url).replace(/\/images\/generations\/?(\?.*)?$/i, '');
    }

    function stripEditSuffix(url) {
        return asString(url).replace(/\/images\/edits\/?(\?.*)?$/i, '');
    }

    function resolveCustomGenerateUrl(settings) {
        const baseUrl = asString(settings.customApiUrl || settings.url || '');
        if (!baseUrl) return '';
        if (/^https?:\/\//i.test(settings.customGeneratePath || '')) {
            return asString(settings.customGeneratePath);
        }
        if (looksLikeGenerateEndpoint(baseUrl)) return baseUrl;
        const path = asString(settings.customGeneratePath || '/images/generations') || '/images/generations';
        return joinUrl(baseUrl, path);
    }

    function resolveCustomEditsUrl(settings, generateEndpoint = '') {
        const baseUrl = asString(generateEndpoint || settings.customApiUrl || settings.url || '');
        if (!baseUrl) return '';

        const explicitPath = asString(settings.customEditPath || '');
        if (/^https?:\/\//i.test(explicitPath)) {
            return explicitPath;
        }
        if (looksLikeEditEndpoint(baseUrl)) {
            return baseUrl;
        }
        if (explicitPath) {
            return joinUrl(stripEditSuffix(stripGenerateSuffix(baseUrl)), explicitPath);
        }
        if (looksLikeGenerateEndpoint(baseUrl)) {
            return asString(baseUrl).replace(/\/images\/generations\/?(\?.*)?$/i, '/images/edits');
        }
        return joinUrl(stripEditSuffix(stripGenerateSuffix(baseUrl)), '/images/edits');
    }

    function resolveCustomModelsUrl(settings) {
        const rawUrl = asString(settings.customApiUrl || settings.url || '');
        if (!rawUrl) return '';
        if (/^https?:\/\//i.test(settings.customFetchPath || '')) {
            return asString(settings.customFetchPath);
        }
        if (/\/models\/?(\?.*)?$/i.test(rawUrl)) return rawUrl;
        const baseUrl = stripGenerateSuffix(rawUrl);
        const path = asString(settings.customFetchPath || '/models') || '/models';
        return joinUrl(baseUrl, path);
    }

    function isDataImageUrl(value) {
        return /^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(asString(value));
    }

    function isLikelyHttpUrl(value) {
        const str = asString(value);
        return /^https?:\/\//i.test(str) || str.startsWith('//');
    }

    function isLikelyGptImageModel(modelName) {
        const value = asString(modelName).toLowerCase();
        return value.includes('gpt-image') || value.includes('dall-e');
    }

    function buildReferenceIdentityInstruction(referenceStrength) {
        const strength = clampNumber(referenceStrength, 0, 1, 0.82);
        if (strength >= 0.85) {
            return 'Same person identity lock: keep identical facial features, hairstyle, body type, age and skin tone from the reference image. Do not change identity.';
        }
        return 'Use the reference image as the same person (face and body). Only change pose, camera angle and scene.';
    }

    function dataUrlToRawBase64(dataUrl) {
        const raw = asString(dataUrl);
        if (!raw) return '';
        const commaIndex = raw.indexOf(',');
        if (commaIndex === -1) return raw;
        return raw.slice(commaIndex + 1).trim();
    }

    function rawBase64ToDataUrl(raw, mime = 'image/png') {
        const clean = asString(raw).replace(/^data:[^,]+,/, '');
        if (!clean) return '';
        return `data:${mime};base64,${clean}`;
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    function maskImageDebugKey(key) {
        const raw = asString(key);
        if (!raw) return '(empty)';
        if (raw.length <= 8) return `${raw.slice(0, 2)}***${raw.slice(-1)}`;
        return `${raw.slice(0, 4)}***${raw.slice(-4)}`;
    }

    function summarizeReferenceForDebug(reference) {
        if (!reference) {
            return { hasReference: false, kind: 'none', length: 0 };
        }
        if (reference.dataUrl) {
            return { hasReference: true, kind: 'data_url', length: String(reference.dataUrl).length };
        }
        if (reference.rawBase64) {
            return { hasReference: true, kind: 'raw_base64', length: String(reference.rawBase64).length };
        }
        return { hasReference: true, kind: 'unknown', length: 0 };
    }

    function summarizeReferenceListForDebug(references) {
        const list = Array.isArray(references) ? references : [];
        return {
            count: list.length,
            first: summarizeReferenceForDebug(list[0] || null)
        };
    }

    async function normalizeReferenceImage(referenceImage) {
        const raw = asString(referenceImage);
        if (!raw) return null;

        if (isDataImageUrl(raw)) {
            return {
                dataUrl: raw,
                rawBase64: dataUrlToRawBase64(raw)
            };
        }

        const base64OnlyPattern = /^[A-Za-z0-9+/=\s]+$/;
        if (raw.length > 120 && base64OnlyPattern.test(raw) && !raw.includes('http')) {
            const compact = raw.replace(/\s+/g, '');
            return {
                dataUrl: rawBase64ToDataUrl(compact),
                rawBase64: compact
            };
        }

        if (typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(raw)) {
            if (typeof window.resolveChatMediaDataUrl === 'function') {
                const dataUrl = await window.resolveChatMediaDataUrl(raw);
                if (isDataImageUrl(dataUrl)) {
                    return {
                        dataUrl,
                        rawBase64: dataUrlToRawBase64(dataUrl)
                    };
                }
            }
            return null;
        }

        if (isLikelyHttpUrl(raw)) {
            const normalizedUrl = raw.startsWith('//') ? `https:${raw}` : raw;
            const response = await fetch(normalizedUrl);
            if (!response.ok) {
                throw new Error(`Reference image fetch failed: HTTP ${response.status}`);
            }
            const blob = await response.blob();
            const dataUrl = await blobToDataUrl(blob);
            if (!isDataImageUrl(dataUrl)) return null;
            return {
                dataUrl,
                rawBase64: dataUrlToRawBase64(dataUrl)
            };
        }

        return null;
    }

    async function normalizeReferenceImages(referenceImage, referenceImages = []) {
        const candidates = [];
        const primary = asString(referenceImage);
        if (primary) candidates.push(primary);
        if (Array.isArray(referenceImages)) {
            for (const item of referenceImages) {
                const normalized = asString(item);
                if (normalized) candidates.push(normalized);
            }
        }
        const dedupedCandidates = Array.from(new Set(candidates));
        const output = [];
        for (const candidate of dedupedCandidates) {
            let normalized = null;
            try {
                normalized = await normalizeReferenceImage(candidate);
            } catch (error) {
                console.warn('[NovelAI Debug] reference:normalize-item-error', {
                    message: error && error.message ? error.message : String(error)
                });
                normalized = null;
            }
            if (!normalized || !normalized.dataUrl) continue;
            if (output.some(item => item.dataUrl === normalized.dataUrl)) continue;
            output.push(normalized);
        }
        return output;
    }

    function parseImageFromJson(data) {
        if (!data || typeof data !== 'object') return '';

        const tryItem = (value) => {
            if (!value) return '';
            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed.startsWith('data:image')) return trimmed;
                if (/^https?:\/\//i.test(trimmed)) return trimmed;
                if (trimmed.startsWith('iVBOR') || trimmed.startsWith('/9j/')) {
                    return rawBase64ToDataUrl(trimmed);
                }
                if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 120) {
                    return rawBase64ToDataUrl(trimmed.replace(/\s+/g, ''));
                }
            } else if (typeof value === 'object') {
                const nestedCandidates = [
                    value.b64_json,
                    value.base64,
                    value.image,
                    value.image_base64,
                    value.url,
                    value.data
                ];
                for (const nested of nestedCandidates) {
                    const result = tryItem(nested);
                    if (result) return result;
                }
            }
            return '';
        };

        const candidates = [
            data.image,
            data.image_base64,
            data.base64,
            data.b64_json,
            data.url,
            data.output_text,
            data.result,
            data.data,
            data.images,
            data.output
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                for (const item of candidate) {
                    const result = tryItem(item);
                    if (result) return result;
                }
            } else {
                const result = tryItem(candidate);
                if (result) return result;
            }
        }

        return '';
    }

    async function parseZipOrBinaryBlob(blob) {
        const buffer = await blob.arrayBuffer();
        const view = new Uint8Array(buffer);

        const isZip = view.length > 2 && view[0] === 0x50 && view[1] === 0x4B;
        if (isZip) {
            if (!window.JSZip) {
                throw new Error('ZIP response requires JSZip');
            }
            const zip = new JSZip();
            const zipContent = await zip.loadAsync(blob);
            const firstFileName = Object.keys(zipContent.files || {}).find(name => !zipContent.files[name].dir);
            if (!firstFileName) {
                throw new Error('ZIP response has no image file');
            }
            const file = zipContent.files[firstFileName];
            const base64 = await file.async('base64');
            const mime = firstFileName.toLowerCase().endsWith('.jpg') || firstFileName.toLowerCase().endsWith('.jpeg')
                ? 'image/jpeg'
                : (firstFileName.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/png');
            return `data:${mime};base64,${base64}`;
        }

        return URL.createObjectURL(blob);
    }

    function parseSseDataText(text) {
        const lines = String(text || '').split('\n');
        for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            if (payload.startsWith('iVBOR') || payload.startsWith('/9j/')) {
                return rawBase64ToDataUrl(payload);
            }
            try {
                const json = JSON.parse(payload);
                const image = parseImageFromJson(json);
                if (image) return image;
            } catch (error) {}
        }
        return '';
    }

    async function parseTextLikeImageResponse(response) {
        const text = await response.text();
        if (!text) return '';

        const sseParsed = parseSseDataText(text);
        if (sseParsed) return sseParsed;

        if (text.startsWith('data:image')) {
            return text.trim();
        }

        if (text.startsWith('iVBOR') || text.startsWith('/9j/')) {
            return rawBase64ToDataUrl(text.trim());
        }

        try {
            const json = JSON.parse(text);
            const image = parseImageFromJson(json);
            if (image) return image;
        } catch (error) {}

        return '';
    }

    async function parseImageResponse(response) {
        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            const shortened = errText ? `: ${errText.slice(0, 500)}` : '';
            throw new Error(`HTTP ${response.status}${shortened}`);
        }

        const contentType = asString(response.headers.get('content-type')).toLowerCase();

        if (contentType.startsWith('image/')) {
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        }

        if (contentType.includes('application/json')) {
            const data = await response.json();
            const image = parseImageFromJson(data);
            if (image) return image;
            throw new Error('JSON response does not contain image data');
        }

        if (contentType.includes('application/zip') || contentType.includes('octet-stream') || contentType.includes('binary')) {
            const blob = await response.blob();
            return parseZipOrBinaryBlob(blob);
        }

        const parsedTextImage = await parseTextLikeImageResponse(response);
        if (parsedTextImage) return parsedTextImage;

        throw new Error('No image data found in response');
    }

    function buildNovelAiPayload(options, reference, references = []) {
        const model = asString(options.model || 'nai-diffusion-3');
        const prompt = asString(options.prompt);
        const negativePrompt = asString(options.negativePrompt);
        const normalizedReferences = Array.isArray(references) && references.length
            ? references
            : (reference ? [reference] : []);
        const primaryReference = normalizedReferences[0] || null;

        const parameters = {
            params_version: 3,
            width: clampNumber(options.width, 128, 4096, 832),
            height: clampNumber(options.height, 128, 4096, 1216),
            scale: clampNumber(options.scale, 0.1, 30, 5),
            sampler: 'k_euler_ancestral',
            steps: Math.round(clampNumber(options.steps, 1, 60, 28)),
            n_samples: 1,
            seed: options.seed === -1
                ? Math.floor(Math.random() * 4294967295)
                : Math.round(clampNumber(options.seed, 0, 4294967295, 0)),
            ucPreset: 0,
            qualityToggle: true,
            sm: false,
            sm_dyn: false,
            dynamic_thresholding: false,
            controlnet_strength: 1,
            legacy: false,
            add_original_image: true,
            cfg_rescale: 0,
            noise_schedule: 'karras',
            legacy_v3_extend: false,
            skip_cfg_above_sigma: null,
            use_coords: false,
            negative_prompt: negativePrompt
        };

        if (model.includes('diffusion-4')) {
            parameters.characterPrompts = [];
            parameters.v4_prompt = {
                caption: { base_caption: prompt, char_captions: [] },
                use_coords: false,
                use_order: true
            };
            parameters.v4_negative_prompt = {
                caption: { base_caption: negativePrompt, char_captions: [] },
                legacy_uc: false
            };
            parameters.deliberate_euler_ancestral_bug = false;
            parameters.prefer_brownian = true;
        }

        if (primaryReference && primaryReference.rawBase64) {
            if (model.includes('diffusion-4')) {
                const referenceStrength = clampNumber(options.referenceStrength, 0, 1, 0.62);
                const referenceInfoExtracted = clampNumber(options.referenceInfoExtracted, 0, 1, 0.92);
                const rawReferences = normalizedReferences
                    .map(item => item && item.rawBase64 ? item.rawBase64 : '')
                    .filter(Boolean);
                const finalRawReferences = rawReferences.length ? rawReferences : [primaryReference.rawBase64];
                parameters.reference_image = finalRawReferences[0];
                parameters.reference_strength = referenceStrength;
                parameters.reference_information_extracted = referenceInfoExtracted;
                parameters.reference_image_multiple = finalRawReferences;
                parameters.reference_strength_multiple = finalRawReferences.map(() => referenceStrength);
                parameters.reference_information_extracted_multiple = finalRawReferences.map(() => referenceInfoExtracted);
            } else {
                parameters.image = primaryReference.rawBase64;
                parameters.strength = clampNumber(options.referenceStrength, 0, 1, 0.35);
                parameters.noise = 0.2;
            }
        }

        return {
            input: prompt,
            model,
            action: 'generate',
            parameters
        };
    }

    function buildCustomPayload(options, reference, references = []) {
        const model = asString(options.model || '');
        const gptImageLikeModel = isLikelyGptImageModel(model);
        const normalizedReferences = Array.isArray(references) && references.length
            ? references
            : (reference ? [reference] : []);
        const referenceDataUrls = normalizedReferences
            .map(item => item && item.dataUrl ? asString(item.dataUrl) : '')
            .filter(Boolean);
        const primaryReferenceDataUrl = referenceDataUrls[0] || '';
        const hasReference = referenceDataUrls.length > 0;
        const promptBase = asString(options.prompt || '');
        const prompt = hasReference
            ? `${promptBase}\n\n${buildReferenceIdentityInstruction(options.referenceStrength)}`
            : promptBase;

        const payload = {
            model,
            prompt,
            negative_prompt: asString(options.negativePrompt || ''),
            width: Math.round(clampNumber(options.width, 128, 4096, 832)),
            height: Math.round(clampNumber(options.height, 128, 4096, 1216)),
            size: `${Math.round(clampNumber(options.width, 128, 4096, 832))}x${Math.round(clampNumber(options.height, 128, 4096, 1216))}`,
            steps: Math.round(clampNumber(options.steps, 1, 120, 28)),
            cfg_scale: clampNumber(options.scale, 0.1, 50, 5),
            seed: options.seed === -1
                ? Math.floor(Math.random() * 4294967295)
                : Math.round(clampNumber(options.seed, 0, 4294967295, 0)),
            n: 1,
            response_format: 'b64_json'
        };

        if (hasReference) {
            const referenceStrength = Math.max(0.78, clampNumber(options.referenceStrength, 0, 1, 0.82));
            payload.reference_image = primaryReferenceDataUrl;
            payload.reference_images = referenceDataUrls;
            payload.reference_image_urls = referenceDataUrls;
            payload.image = primaryReferenceDataUrl;
            payload.images = referenceDataUrls;
            payload.image_url = primaryReferenceDataUrl;
            payload.image_urls = referenceDataUrls;
            payload.input_image = primaryReferenceDataUrl;
            payload.input_images = referenceDataUrls;
            payload.reference_strength = referenceStrength;
            payload.image_strength = referenceStrength;
            payload.strength = clampNumber(referenceStrength * 0.78, 0, 1, 0.65);
            payload.denoising_strength = clampNumber(1 - referenceStrength * 0.45, 0.2, 0.9, 0.55);
            if (gptImageLikeModel) {
                payload.input_fidelity = referenceStrength >= 0.72 ? 'high' : 'low';
            }
        }

        return payload;
    }

    async function buildReferenceBlob(reference) {
        if (!reference || !reference.dataUrl) return null;
        const response = await fetch(reference.dataUrl);
        const blob = await response.blob();
        return blob;
    }

    function buildCustomEditFormData(options, reference) {
        const formData = new FormData();
        const model = asString(options.model || '');
        const referenceStrength = Math.max(0.78, clampNumber(options.referenceStrength, 0, 1, 0.82));
        const prompt = `${asString(options.prompt || '')}\n\n${buildReferenceIdentityInstruction(referenceStrength)}`.trim();

        formData.append('model', model);
        formData.append('prompt', prompt);
        formData.append('size', `${Math.round(clampNumber(options.width, 128, 4096, 832))}x${Math.round(clampNumber(options.height, 128, 4096, 1216))}`);
        formData.append('n', '1');
        formData.append('response_format', 'b64_json');

        const negativePrompt = asString(options.negativePrompt || '');
        if (negativePrompt) {
            formData.append('negative_prompt', negativePrompt);
        }

        if (isLikelyGptImageModel(model)) {
            formData.append('input_fidelity', referenceStrength >= 0.72 ? 'high' : 'low');
        }

        const strengthText = String(referenceStrength);
        formData.append('reference_strength', strengthText);
        formData.append('image_strength', strengthText);
        formData.append('strength', String(clampNumber(referenceStrength * 0.78, 0, 1, 0.65)));

        return formData;
    }

    async function requestNovelAiImage(options, reference, references = []) {
        const payload = buildNovelAiPayload(options, reference, references);
        console.log('[NovelAI Debug] request:nai:start', {
            provider: 'novelai',
            endpoint: NOVELAI_ENDPOINT,
            keyMasked: maskImageDebugKey(options.key),
            model: options.model,
            width: options.width,
            height: options.height,
            steps: options.steps,
            scale: options.scale,
            promptLength: String(options.prompt || '').length,
            negativePromptLength: String(options.negativePrompt || '').length,
            reference: summarizeReferenceForDebug(reference),
            referenceList: summarizeReferenceListForDebug(references)
        });
        const response = await fetch(NOVELAI_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${options.key}`
            },
            body: JSON.stringify(payload)
        });
        console.log('[NovelAI Debug] request:nai:response', {
            ok: !!response.ok,
            status: response.status,
            contentType: asString(response.headers.get('content-type'))
        });
        return parseImageResponse(response);
    }

    async function requestCustomImage(options, settings, reference, references = []) {
        const endpoint = resolveCustomGenerateUrl(settings);
        if (!endpoint) {
            throw new Error('Custom API URL is empty');
        }

        const normalizedReferences = Array.isArray(references) && references.length
            ? references
            : (reference ? [reference] : []);
        const hasReference = normalizedReferences.length > 0;
        const editsEndpoint = hasReference ? resolveCustomEditsUrl(settings, endpoint) : '';
        const jsonPayload = buildCustomPayload(options, reference, normalizedReferences);
        const commonLogPayload = {
            provider: 'custom',
            endpoint,
            editsEndpoint,
            keyMasked: maskImageDebugKey(options.key),
            model: options.model,
            width: options.width,
            height: options.height,
            steps: options.steps,
            scale: options.scale,
            promptLength: String(options.prompt || '').length,
            negativePromptLength: String(options.negativePrompt || '').length,
            reference: summarizeReferenceForDebug(reference),
            referenceList: summarizeReferenceListForDebug(normalizedReferences),
            payloadReferenceKeys: hasReference
                ? ['reference_image', 'reference_images', 'image', 'images', 'input_image', 'input_images', 'reference_strength', 'input_fidelity']
                : []
        };

        console.log('[NovelAI Debug] request:custom:start', commonLogPayload);

        const authorizationHeaders = {};
        if (options.key) {
            authorizationHeaders.Authorization = `Bearer ${options.key}`;
        }

        if (hasReference && editsEndpoint) {
            try {
                const referenceBlobList = (await Promise.all(
                    normalizedReferences.map(item => buildReferenceBlob(item).catch(() => null))
                )).filter(Boolean);
                if (referenceBlobList.length > 0) {
                    const editFormData = buildCustomEditFormData(options, normalizedReferences[0]);
                    referenceBlobList.forEach((blob, index) => {
                        const name = `reference-${index + 1}.png`;
                        editFormData.append('image', blob, name);
                        editFormData.append('images', blob, name);
                        editFormData.append('input_images', blob, name);
                        if (index === 0) {
                            editFormData.append('input_image', blob, name);
                        }
                    });

                    console.log('[NovelAI Debug] request:custom:edits-attempt', {
                        endpoint: editsEndpoint,
                        method: 'POST',
                        referenceCount: referenceBlobList.length,
                        referenceBlobSizes: referenceBlobList.map(item => item.size),
                        mode: 'multipart/form-data'
                    });
                    const editResponse = await fetch(editsEndpoint, {
                        method: 'POST',
                        headers: authorizationHeaders,
                        body: editFormData
                    });
                    console.log('[NovelAI Debug] request:custom:edits-response', {
                        ok: !!editResponse.ok,
                        status: editResponse.status,
                        contentType: asString(editResponse.headers.get('content-type'))
                    });
                    if (editResponse.ok) {
                        return parseImageResponse(editResponse);
                    }
                    const editErrText = await editResponse.text().catch(() => '');
                    console.warn('[NovelAI Debug] request:custom:edits-fallback', {
                        status: editResponse.status,
                        reason: asString(editErrText).slice(0, 400)
                    });
                }
            } catch (editError) {
                console.warn('[NovelAI Debug] request:custom:edits-exception', {
                    message: editError && editError.message ? editError.message : String(editError)
                });
            }
        }

        const jsonHeaders = {
            ...authorizationHeaders,
            'Content-Type': 'application/json'
        };
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(jsonPayload)
        });
        console.log('[NovelAI Debug] request:custom:response', {
            ok: !!response.ok,
            status: response.status,
            contentType: asString(response.headers.get('content-type'))
        });

        return parseImageResponse(response);
    }

    async function fetchCustomModels(settings) {
        const modelsUrl = resolveCustomModelsUrl(settings);
        if (!modelsUrl) throw new Error('Custom API URL is empty');
        const headers = {};
        const key = asString(settings.customApiKey || settings.key);
        if (key) {
            headers.Authorization = `Bearer ${key}`;
        }
        const response = await fetch(modelsUrl, { headers });
        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`HTTP ${response.status}: ${errText}`);
        }
        const data = await response.json();
        const rawList = Array.isArray(data)
            ? data
            : (Array.isArray(data.data) ? data.data : (Array.isArray(data.models) ? data.models : []));
        const models = rawList
            .map(item => (item && typeof item === 'object' ? (item.id || item.name || item.model || '') : item))
            .map(item => asString(item))
            .filter(Boolean);
        return Array.from(new Set(models));
    }

    function getPresets() {
        return window.iphoneSimState.novelaiPresets || [];
    }

    function savePresets(presets) {
        window.iphoneSimState.novelaiPresets = presets;
        if (window.saveConfig) window.saveConfig();
    }

    function getActiveProvider(settings) {
        return settings.provider === 'custom' ? 'custom' : 'novelai';
    }

    function getActiveKey(settings) {
        const provider = getActiveProvider(settings);
        if (provider === 'custom') {
            return asString(settings.customApiKey || settings.key);
        }
        return asString(settings.key);
    }

    function getActiveModel(settings) {
        const provider = getActiveProvider(settings);
        return provider === 'custom'
            ? asString(settings.customModel || settings.model)
            : asString(settings.model);
    }

    function syncCustomProviderFields(settings) {
        const provider = getActiveProvider(settings);
        const customFields = document.getElementById('novelai-custom-api-fields');
        if (customFields) {
            customFields.style.display = provider === 'custom' ? '' : 'none';
        }
    }

    function renderPresetOptions(select) {
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="">-- 选择预设 --</option>';
        getPresets().forEach((preset) => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            select.appendChild(option);
        });
        if (currentValue && getPresets().some(preset => preset.name === currentValue)) {
            select.value = currentValue;
        }
    }

    async function handleFetchCustomModels() {
        const settings = ensureNovelAiSettings();
        const btn = document.getElementById('novelai-custom-fetch-models');
        const select = document.getElementById('novelai-model-select');
        if (!btn || !select) return;

        const originalText = btn.textContent;
        btn.textContent = '拉取中...';
        btn.disabled = true;
        try {
            const models = await fetchCustomModels(settings);
            if (!models.length) {
                throw new Error('未获取到可用模型');
            }
            models.forEach((modelId) => {
                if (!Array.from(select.options).some(option => option.value === modelId)) {
                    const option = document.createElement('option');
                    option.value = modelId;
                    option.textContent = modelId;
                    select.appendChild(option);
                }
            });
            const preferred = asString(settings.customModel || settings.model || models[0]);
            setSelectValueWithFallback(select, preferred || models[0]);
            settings.customModel = select.value;
            if (window.saveConfig) window.saveConfig();
            alert(`成功获取 ${models.length} 个模型`);
        } catch (error) {
            console.error('Failed to fetch custom image models', error);
            alert(`模型拉取失败: ${error.message}`);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }

    async function generateImage() {
        const settings = ensureNovelAiSettings();
        const provider = getActiveProvider(settings);
        const key = getActiveKey(settings);
        if (!key) {
            alert(provider === 'custom' ? '请先填写 Custom API Key' : '请先填写 NovelAI API Key');
            return;
        }

        const btn = document.getElementById('novelai-generate-btn');
        const resultContainer = document.getElementById('novelai-result-container');
        const resultImg = document.getElementById('novelai-result-img');
        const statusText = document.getElementById('novelai-status-text');

        if (btn) {
            btn.disabled = true;
            btn.textContent = '生成中...';
        }
        if (resultContainer) resultContainer.style.display = 'block';
        if (statusText) statusText.textContent = '准备请求...';
        if (resultImg) {
            resultImg.style.display = 'none';
            resultImg.src = '';
        }

        try {
            const prompt = asString(document.getElementById('novelai-prompt') ? document.getElementById('novelai-prompt').value : settings.defaultPrompt);
            const negativePrompt = asString(document.getElementById('novelai-negative-prompt') ? document.getElementById('novelai-negative-prompt').value : settings.negativePrompt);
            const steps = safeNumber(document.getElementById('novelai-steps') ? document.getElementById('novelai-steps').value : settings.steps, settings.steps);
            const scale = safeNumber(document.getElementById('novelai-scale') ? document.getElementById('novelai-scale').value : settings.cfg, settings.cfg);
            const seed = safeNumber(document.getElementById('novelai-seed') ? document.getElementById('novelai-seed').value : settings.seed, settings.seed);
            const modelSelect = document.getElementById('novelai-model-select');
            const model = asString(modelSelect ? modelSelect.value : getActiveModel(settings));
            const sizeValue = asString(document.getElementById('novelai-size-select') ? document.getElementById('novelai-size-select').value : settings.size) || '832x1216';
            const [widthRaw, heightRaw] = sizeValue.split('x').map(Number);
            const width = Number.isFinite(widthRaw) ? widthRaw : 832;
            const height = Number.isFinite(heightRaw) ? heightRaw : 1216;

            if (statusText) statusText.textContent = '正在生成...';

            const options = {
                provider,
                key,
                model,
                prompt,
                negativePrompt,
                steps,
                scale,
                seed,
                width,
                height,
                referenceStrength: settings.referenceStrength,
                referenceInfoExtracted: settings.referenceInfoExtracted
            };

            const imageSource = await window.generateNovelAiImageApi(options);
            if (resultImg) {
                resultImg.src = imageSource;
                resultImg.style.display = 'block';
            }
            if (statusText) statusText.textContent = '生成成功';
        } catch (error) {
            console.error('Image generation failed', error);
            if (statusText) statusText.textContent = `错误: ${error.message}`;
            alert(`生成失败: ${error.message}`);
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = '生成测试';
            }
        }
    }

    function bindOnce(element, eventName, handler) {
        if (!element) return;
        const key = `bound${String(eventName || '').replace(/[^a-z0-9]/gi, '')}`;
        if (element.dataset[key] === '1') return;
        element.addEventListener(eventName, handler);
        element.dataset[key] = '1';
    }

    window.updateNovelAiUi = function () {
        const settings = ensureNovelAiSettings();

        const enabledToggle = document.getElementById('novelai-chat-enabled');
        if (enabledToggle) {
            enabledToggle.checked = settings.enabled !== false;
            bindOnce(enabledToggle, 'change', (event) => {
                settings.enabled = !!event.target.checked;
                if (window.saveConfig) window.saveConfig();
            });
        }

        const providerSelect = document.getElementById('novelai-provider-select');
        if (providerSelect) {
            providerSelect.value = getActiveProvider(settings);
            bindOnce(providerSelect, 'change', (event) => {
                settings.provider = event.target.value === 'custom' ? 'custom' : 'novelai';
                const modelSelect = document.getElementById('novelai-model-select');
                if (modelSelect) {
                    const nextModel = getActiveModel(settings);
                    setSelectValueWithFallback(modelSelect, nextModel);
                }
                syncCustomProviderFields(settings);
                if (window.saveConfig) window.saveConfig();
            });
        }
        syncCustomProviderFields(settings);

        const keyInput = document.getElementById('novelai-api-key');
        if (keyInput) {
            keyInput.value = asString(settings.key);
            bindOnce(keyInput, 'change', (event) => {
                settings.key = asString(event.target.value);
                if (window.saveConfig) window.saveConfig();
            });
        }

        const customUrlInput = document.getElementById('novelai-custom-api-url');
        if (customUrlInput) {
            customUrlInput.value = asString(settings.customApiUrl);
            bindOnce(customUrlInput, 'change', (event) => {
                settings.customApiUrl = asString(event.target.value);
                if (window.saveConfig) window.saveConfig();
            });
        }

        const customKeyInput = document.getElementById('novelai-custom-api-key');
        if (customKeyInput) {
            customKeyInput.value = asString(settings.customApiKey);
            bindOnce(customKeyInput, 'change', (event) => {
                settings.customApiKey = asString(event.target.value);
                if (window.saveConfig) window.saveConfig();
            });
        }

        const fetchCustomModelsBtn = document.getElementById('novelai-custom-fetch-models');
        bindOnce(fetchCustomModelsBtn, 'click', handleFetchCustomModels);

        const modelSelect = document.getElementById('novelai-model-select');
        if (modelSelect) {
            setSelectValueWithFallback(modelSelect, getActiveModel(settings) || 'nai-diffusion-3');
            bindOnce(modelSelect, 'change', (event) => {
                const selected = asString(event.target.value);
                if (getActiveProvider(settings) === 'custom') {
                    settings.customModel = selected;
                } else {
                    settings.model = selected;
                }
                if (window.saveConfig) window.saveConfig();
            });
        }

        const promptInput = document.getElementById('novelai-prompt');
        if (promptInput) {
            promptInput.value = asString(settings.defaultPrompt);
            bindOnce(promptInput, 'change', (event) => {
                settings.defaultPrompt = asString(event.target.value);
                if (window.saveConfig) window.saveConfig();
            });
        }

        const negativePromptInput = document.getElementById('novelai-negative-prompt');
        if (negativePromptInput) {
            negativePromptInput.value = asString(settings.negativePrompt);
            bindOnce(negativePromptInput, 'change', (event) => {
                settings.negativePrompt = asString(event.target.value);
                if (window.saveConfig) window.saveConfig();
            });
        }

        const sizeSelect = document.getElementById('novelai-size-select');
        if (sizeSelect) {
            const currentSize = `${safeNumber(settings.width, 832)}x${safeNumber(settings.height, 1216)}`;
            setSelectValueWithFallback(sizeSelect, currentSize);
            bindOnce(sizeSelect, 'change', (event) => {
                const [w, h] = asString(event.target.value).split('x').map(Number);
                settings.width = Number.isFinite(w) ? w : 832;
                settings.height = Number.isFinite(h) ? h : 1216;
                settings.size = `${settings.width}x${settings.height}`;
                if (window.saveConfig) window.saveConfig();
            });
        }

        const stepsInput = document.getElementById('novelai-steps');
        const stepsValue = document.getElementById('novelai-steps-val');
        if (stepsInput) {
            stepsInput.value = safeNumber(settings.steps, 28);
            if (stepsValue) stepsValue.textContent = stepsInput.value;
            bindOnce(stepsInput, 'input', (event) => {
                if (stepsValue) stepsValue.textContent = event.target.value;
            });
            bindOnce(stepsInput, 'change', (event) => {
                settings.steps = Math.round(clampNumber(event.target.value, 1, 60, 28));
                if (window.saveConfig) window.saveConfig();
            });
        }

        const scaleInput = document.getElementById('novelai-scale');
        const scaleValue = document.getElementById('novelai-scale-val');
        if (scaleInput) {
            scaleInput.value = safeNumber(settings.cfg, 5);
            if (scaleValue) scaleValue.textContent = scaleInput.value;
            bindOnce(scaleInput, 'input', (event) => {
                if (scaleValue) scaleValue.textContent = event.target.value;
            });
            bindOnce(scaleInput, 'change', (event) => {
                settings.cfg = clampNumber(event.target.value, 0.1, 30, 5);
                if (window.saveConfig) window.saveConfig();
            });
        }

        const referenceStrengthInput = document.getElementById('novelai-reference-strength');
        const referenceStrengthValue = document.getElementById('novelai-reference-strength-val');
        if (referenceStrengthInput) {
            const normalizedStrength = clampNumber(settings.referenceStrength, 0, 1, 0.78);
            referenceStrengthInput.value = normalizedStrength;
            if (referenceStrengthValue) referenceStrengthValue.textContent = normalizedStrength.toFixed(2);
            bindOnce(referenceStrengthInput, 'input', (event) => {
                if (referenceStrengthValue) {
                    referenceStrengthValue.textContent = clampNumber(event.target.value, 0, 1, 0.78).toFixed(2);
                }
            });
            bindOnce(referenceStrengthInput, 'change', (event) => {
                settings.referenceStrength = clampNumber(event.target.value, 0, 1, 0.78);
                if (referenceStrengthValue) {
                    referenceStrengthValue.textContent = settings.referenceStrength.toFixed(2);
                }
                if (window.saveConfig) window.saveConfig();
            });
        }

        const seedInput = document.getElementById('novelai-seed');
        if (seedInput) {
            seedInput.value = safeNumber(settings.seed, -1);
            bindOnce(seedInput, 'change', (event) => {
                settings.seed = Math.round(safeNumber(event.target.value, -1));
                if (window.saveConfig) window.saveConfig();
            });
        }

        const presetSelect = document.getElementById('novelai-preset-select');
        const presetTypeSelect = document.getElementById('novelai-preset-type-select');
        const savePresetBtn = document.getElementById('save-novelai-preset');
        const deletePresetBtn = document.getElementById('delete-novelai-preset');
        if (presetSelect && savePresetBtn && deletePresetBtn) {
            renderPresetOptions(presetSelect);

            bindOnce(savePresetBtn, 'click', () => {
                const name = prompt('请输入预设名称:');
                if (!name) return;
                const provider = getActiveProvider(settings);
                const preset = {
                    name,
                    type: presetTypeSelect ? presetTypeSelect.value : 'general',
                    settings: {
                        model: provider === 'custom' ? getActiveModel(settings) : asString(settings.model),
                        prompt: asString(settings.defaultPrompt),
                        negativePrompt: asString(settings.negativePrompt),
                        steps: safeNumber(settings.steps, 28),
                        scale: safeNumber(settings.cfg, 5),
                        seed: safeNumber(settings.seed, -1),
                        width: safeNumber(settings.width, 832),
                        height: safeNumber(settings.height, 1216)
                    }
                };

                const presets = getPresets();
                const index = presets.findIndex(item => item.name === name);
                if (index >= 0) {
                    if (!confirm(`预设 "${name}" 已存在，是否覆盖？`)) return;
                    presets[index] = preset;
                } else {
                    presets.push(preset);
                }
                savePresets(presets);
                renderPresetOptions(presetSelect);
                presetSelect.value = name;
                alert('预设已保存');
            });

            bindOnce(deletePresetBtn, 'click', () => {
                const name = asString(presetSelect.value);
                if (!name) return;
                if (!confirm(`确定删除预设 "${name}" 吗？`)) return;
                const presets = getPresets().filter(item => item.name !== name);
                savePresets(presets);
                renderPresetOptions(presetSelect);
            });

            bindOnce(presetSelect, 'change', (event) => {
                const name = asString(event.target.value);
                if (!name) return;
                const preset = getPresets().find(item => item.name === name);
                if (!preset || !preset.settings) return;

                const s = preset.settings;
                settings.model = asString(s.model || settings.model);
                if (getActiveProvider(settings) === 'custom') {
                    settings.customModel = settings.model;
                }
                settings.defaultPrompt = asString(s.prompt || settings.defaultPrompt);
                settings.negativePrompt = asString(s.negativePrompt || settings.negativePrompt);
                settings.steps = Math.round(clampNumber(s.steps, 1, 60, settings.steps || 28));
                settings.cfg = clampNumber(s.scale, 0.1, 30, settings.cfg || 5);
                settings.seed = Math.round(safeNumber(s.seed, settings.seed));
                settings.width = Math.round(clampNumber(s.width, 128, 4096, settings.width || 832));
                settings.height = Math.round(clampNumber(s.height, 128, 4096, settings.height || 1216));
                settings.size = `${settings.width}x${settings.height}`;

                if (promptInput) promptInput.value = settings.defaultPrompt;
                if (negativePromptInput) negativePromptInput.value = settings.negativePrompt;
                if (stepsInput) stepsInput.value = settings.steps;
                if (stepsValue) stepsValue.textContent = settings.steps;
                if (scaleInput) scaleInput.value = settings.cfg;
                if (scaleValue) scaleValue.textContent = settings.cfg;
                if (seedInput) seedInput.value = settings.seed;
                if (sizeSelect) setSelectValueWithFallback(sizeSelect, settings.size);
                if (modelSelect) setSelectValueWithFallback(modelSelect, getActiveModel(settings));
                if (window.saveConfig) window.saveConfig();
            });
        }

        const generateBtn = document.getElementById('novelai-generate-btn');
        if (generateBtn) {
            generateBtn.onclick = generateImage;
        }
    };

    window.generateNovelAiImageApi = async function (options = {}) {
        const settings = ensureNovelAiSettings();
        const provider = options.provider === 'custom'
            ? 'custom'
            : (options.provider === 'novelai' ? 'novelai' : getActiveProvider(settings));
        const key = asString(
            options.key
            || (provider === 'custom' ? (settings.customApiKey || settings.key) : settings.key)
        );
        if (!key) {
            throw new Error(provider === 'custom' ? 'Missing Custom API Key' : 'Missing NovelAI API Key');
        }

        const model = asString(
            options.model
            || (provider === 'custom' ? (settings.customModel || settings.model) : settings.model)
            || 'nai-diffusion-3'
        );

        const referenceInput = asString(options.referenceImage || '');
        const referenceInputList = Array.isArray(options.referenceImages)
            ? options.referenceImages.map(item => asString(item)).filter(Boolean)
            : [];
        const hasReferenceInput = !!referenceInput || referenceInputList.length > 0;
        const defaultReferenceStrength = (provider === 'custom' && hasReferenceInput)
            ? Math.max(0.78, safeNumber(settings.referenceStrength, 0.78))
            : safeNumber(settings.referenceStrength, 0.78);

        const requestOptions = {
            provider,
            key,
            model,
            prompt: asString(options.prompt),
            negativePrompt: asString(options.negativePrompt),
            steps: safeNumber(options.steps, settings.steps || 28),
            scale: safeNumber(options.scale, settings.cfg || 5),
            seed: safeNumber(options.seed, settings.seed === undefined ? -1 : settings.seed),
            width: safeNumber(options.width, settings.width || 832),
            height: safeNumber(options.height, settings.height || 1216),
            referenceStrength: clampNumber(
                options.referenceStrength,
                0,
                1,
                defaultReferenceStrength
            ),
            referenceInfoExtracted: clampNumber(
                options.referenceInfoExtracted,
                0,
                1,
                safeNumber(settings.referenceInfoExtracted, 0.92)
            )
        };

        let references = [];
        let reference = null;
        try {
            references = await normalizeReferenceImages(referenceInput, referenceInputList);
            reference = references[0] || null;
        } catch (referenceError) {
            console.warn('[NovelAI Debug] reference:normalize-error', {
                provider,
                inputKind: referenceInput.startsWith('data:image')
                    ? 'data_url'
                    : (typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(referenceInput)
                        ? 'chat_media_ref'
                        : (/^https?:\/\//i.test(referenceInput) ? 'http_url' : (referenceInput ? 'raw_or_other' : 'none'))),
                inputCount: (referenceInput ? 1 : 0) + referenceInputList.length,
                message: referenceError && referenceError.message ? referenceError.message : String(referenceError)
            });
            references = [];
            reference = null;
        }
        console.log('[NovelAI Debug] generate:entry', {
            provider,
            model,
            keyMasked: maskImageDebugKey(key),
            promptLength: requestOptions.prompt.length,
            negativePromptLength: requestOptions.negativePrompt.length,
            width: requestOptions.width,
            height: requestOptions.height,
            steps: requestOptions.steps,
            scale: requestOptions.scale,
            seed: requestOptions.seed,
            inputReferenceKind: referenceInput.startsWith('data:image')
                ? 'data_url'
                : (typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(referenceInput)
                    ? 'chat_media_ref'
                    : (/^https?:\/\//i.test(referenceInput) ? 'http_url' : (referenceInput ? 'raw_or_other' : 'none'))),
            inputReferenceCount: (referenceInput ? 1 : 0) + referenceInputList.length,
            normalizedReference: summarizeReferenceForDebug(reference),
            normalizedReferenceList: summarizeReferenceListForDebug(references)
        });
        if (provider === 'custom') {
            return requestCustomImage(requestOptions, settings, reference, references);
        }
        return requestNovelAiImage(requestOptions, reference, references);
    };
})();
