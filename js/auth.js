// auth.js
(function() {
    const DEVICE_ID_KEY = 'device_id';
    const DEVICE_VERIFIED_KEY = 'device_verified';
    const DEVICE_VERIFIED_AT_KEY = 'device_verified_at';
    const LEGACY_STORAGE_KEY = 'is_verified';
    const SECRET_SALT = 'LOOKUS-DEVICE-ACTIVATE-2026';
    const DEVICE_ID_SEGMENT_LENGTH = 4;
    const DEVICE_ID_SEGMENT_COUNT = 3;
    const ACTIVATION_SEGMENT_LENGTH = 4;
    const ACTIVATION_SEGMENT_COUNT = 3;

    // 保留 Bmob 初始化配置仅作兼容说明，当前默认模式不再依赖云端校验。
    const BMOB_SECRET_KEY = '47555583581ac060';
    const BMOB_API_KEY = '2382745495111111';

    function initAuth() {
        clearLegacyVerificationFlag();
        initBmobForCompatibility();

        const deviceId = getOrCreateDeviceId();
        if (isCurrentDeviceVerified(deviceId)) {
            showContent();
            return;
        }

        createAuthUI(deviceId);
    }

    function clearLegacyVerificationFlag() {
        if (localStorage.getItem(LEGACY_STORAGE_KEY) === 'true') {
            localStorage.removeItem(LEGACY_STORAGE_KEY);
        }
    }

    function initBmobForCompatibility() {
        if (typeof Bmob === 'undefined' || BMOB_SECRET_KEY === 'YOUR_SECRET_KEY') {
            return;
        }

        try {
            Bmob.initialize(BMOB_SECRET_KEY, BMOB_API_KEY);
            console.log('Bmob initialized for compatibility only.');
        } catch (error) {
            console.warn('Bmob init skipped:', error);
        }
    }

    function getOrCreateDeviceId() {
        const existing = normalizeDeviceId(localStorage.getItem(DEVICE_ID_KEY));
        if (existing) {
            return existing;
        }

        const generated = generateDeviceId();
        localStorage.setItem(DEVICE_ID_KEY, generated);
        return generated;
    }

    function generateDeviceId() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const length = DEVICE_ID_SEGMENT_LENGTH * DEVICE_ID_SEGMENT_COUNT;
        let raw = '';

        if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
            const bytes = new Uint8Array(length);
            window.crypto.getRandomValues(bytes);
            for (let index = 0; index < bytes.length; index += 1) {
                raw += chars[bytes[index] % chars.length];
            }
        } else {
            for (let index = 0; index < length; index += 1) {
                raw += chars[Math.floor(Math.random() * chars.length)];
            }
        }

        return formatGroupedCode(raw, DEVICE_ID_SEGMENT_LENGTH);
    }

    function normalizeDeviceId(value) {
        return normalizeCode(value, DEVICE_ID_SEGMENT_LENGTH, DEVICE_ID_SEGMENT_COUNT);
    }

    function normalizeActivationCode(value) {
        return normalizeCode(value, ACTIVATION_SEGMENT_LENGTH, ACTIVATION_SEGMENT_COUNT);
    }

    function normalizeCode(value, segmentLength, segmentCount) {
        const cleaned = String(value || '')
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '');

        const expectedLength = segmentLength * segmentCount;
        if (!cleaned) {
            return '';
        }

        return formatGroupedCode(cleaned.slice(0, expectedLength), segmentLength);
    }

    function formatGroupedCode(raw, segmentLength) {
        const groups = [];
        for (let index = 0; index < raw.length; index += segmentLength) {
            groups.push(raw.slice(index, index + segmentLength));
        }
        return groups.join('-');
    }

    function simpleHash(input) {
        let hash = 2166136261;
        for (let index = 0; index < input.length; index += 1) {
            hash ^= input.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function generateActivationCode(deviceId) {
        const normalizedDeviceId = normalizeDeviceId(deviceId);
        const seed = normalizedDeviceId.replace(/-/g, '');
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        const targetLength = ACTIVATION_SEGMENT_LENGTH * ACTIVATION_SEGMENT_COUNT;
        let buffer = '';
        let round = 0;

        while (buffer.length < targetLength) {
            const hash = simpleHash(`${SECRET_SALT}:${seed}:${round}`);
            let value = hash;
            for (let step = 0; step < 8 && buffer.length < targetLength; step += 1) {
                buffer += alphabet[value % alphabet.length];
                value = Math.floor(value / alphabet.length);
            }
            round += 1;
        }

        return formatGroupedCode(buffer.slice(0, targetLength), ACTIVATION_SEGMENT_LENGTH);
    }

    function verifyActivationCode(deviceId, inputCode) {
        const expectedCode = generateActivationCode(deviceId);
        const normalizedInput = normalizeActivationCode(inputCode);
        return normalizedInput && normalizedInput === expectedCode;
    }

    function isCurrentDeviceVerified(deviceId) {
        const savedVerifiedDeviceId = normalizeDeviceId(localStorage.getItem(DEVICE_VERIFIED_KEY));
        return !!savedVerifiedDeviceId && savedVerifiedDeviceId === normalizeDeviceId(deviceId);
    }

    function markDeviceVerified(deviceId) {
        localStorage.setItem(DEVICE_VERIFIED_KEY, normalizeDeviceId(deviceId));
        localStorage.setItem(DEVICE_VERIFIED_AT_KEY, new Date().toISOString());
    }

    function createAuthUI(deviceId) {
        const authOverlay = document.createElement('div');
        authOverlay.id = 'auth-overlay';
        authOverlay.style.position = 'fixed';
        authOverlay.style.top = '0';
        authOverlay.style.left = '0';
        authOverlay.style.width = '100%';
        authOverlay.style.height = '100%';
        authOverlay.style.background = 'rgba(0, 0, 0, 0.96)';
        authOverlay.style.backdropFilter = 'blur(10px)';
        authOverlay.style.zIndex = '99999';
        authOverlay.style.display = 'flex';
        authOverlay.style.flexDirection = 'column';
        authOverlay.style.justifyContent = 'center';
        authOverlay.style.alignItems = 'center';
        authOverlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        authOverlay.style.padding = '24px';

        const container = document.createElement('div');
        container.style.width = '100%';
        container.style.maxWidth = '340px';
        container.style.textAlign = 'center';
        container.style.background = '#111214';
        container.style.border = '1px solid rgba(255,255,255,0.08)';
        container.style.borderRadius = '18px';
        container.style.padding = '28px 22px 22px';
        container.style.boxSizing = 'border-box';

        const title = document.createElement('h2');
        title.innerText = '设备激活';
        title.style.color = '#fff';
        title.style.margin = '0 0 12px';
        title.style.fontWeight = '600';
        title.style.fontSize = '24px';

        const desc = document.createElement('div');
        desc.innerText = '把下面的设备码发给我，我会生成这台设备专属的进入码。';
        desc.style.color = 'rgba(255,255,255,0.72)';
        desc.style.fontSize = '13px';
        desc.style.lineHeight = '1.6';
        desc.style.marginBottom = '18px';

        const deviceCodeBox = document.createElement('div');
        deviceCodeBox.style.background = '#1c1c1e';
        deviceCodeBox.style.border = '1px solid rgba(255,255,255,0.08)';
        deviceCodeBox.style.borderRadius = '14px';
        deviceCodeBox.style.padding = '14px 12px';
        deviceCodeBox.style.marginBottom = '12px';

        const deviceCodeLabel = document.createElement('div');
        deviceCodeLabel.innerText = '当前设备码';
        deviceCodeLabel.style.color = '#8e8e93';
        deviceCodeLabel.style.fontSize = '12px';
        deviceCodeLabel.style.marginBottom = '8px';

        const deviceCodeValue = document.createElement('div');
        deviceCodeValue.innerText = deviceId;
        deviceCodeValue.style.color = '#fff';
        deviceCodeValue.style.fontSize = '20px';
        deviceCodeValue.style.fontWeight = '700';
        deviceCodeValue.style.letterSpacing = '2px';
        deviceCodeValue.style.wordBreak = 'break-word';

        const copyButton = document.createElement('button');
        copyButton.type = 'button';
        copyButton.innerText = '复制设备码';
        copyButton.style.width = '100%';
        copyButton.style.padding = '11px';
        copyButton.style.marginBottom = '14px';
        copyButton.style.borderRadius = '12px';
        copyButton.style.border = '1px solid rgba(255,255,255,0.12)';
        copyButton.style.backgroundColor = '#1f2023';
        copyButton.style.color = '#fff';
        copyButton.style.fontSize = '15px';
        copyButton.style.fontWeight = '500';
        copyButton.style.cursor = 'pointer';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '请输入该设备对应的进入码';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.style.width = '100%';
        input.style.padding = '12px';
        input.style.borderRadius = '12px';
        input.style.border = 'none';
        input.style.backgroundColor = '#1c1c1e';
        input.style.color = '#fff';
        input.style.fontSize = '16px';
        input.style.marginBottom = '14px';
        input.style.outline = 'none';
        input.style.boxSizing = 'border-box';
        input.style.textAlign = 'center';
        input.style.letterSpacing = '1px';

        const button = document.createElement('button');
        button.type = 'button';
        button.innerText = '激活并进入';
        button.style.width = '100%';
        button.style.padding = '12px';
        button.style.borderRadius = '12px';
        button.style.border = 'none';
        button.style.backgroundColor = '#007AFF';
        button.style.color = '#fff';
        button.style.fontSize = '16px';
        button.style.fontWeight = '600';
        button.style.cursor = 'pointer';

        const errorMsg = document.createElement('div');
        errorMsg.style.color = '#ff453a';
        errorMsg.style.marginTop = '14px';
        errorMsg.style.fontSize = '14px';
        errorMsg.style.display = 'none';
        errorMsg.innerText = '激活码不匹配当前设备';

        const tip = document.createElement('div');
        tip.style.color = '#8e8e93';
        tip.style.marginTop = '16px';
        tip.style.fontSize = '12px';
        tip.style.lineHeight = '1.6';
        tip.innerText = '当前为本地设备码激活模式。清除浏览器缓存或更换浏览器后，需要重新激活。';

        deviceCodeBox.appendChild(deviceCodeLabel);
        deviceCodeBox.appendChild(deviceCodeValue);
        container.appendChild(title);
        container.appendChild(desc);
        container.appendChild(deviceCodeBox);
        container.appendChild(copyButton);
        container.appendChild(input);
        container.appendChild(button);
        container.appendChild(errorMsg);
        container.appendChild(tip);
        authOverlay.appendChild(container);

        document.body.appendChild(authOverlay);

        const mainContent = document.getElementById('screen-container');
        if (mainContent) {
            mainContent.style.filter = 'blur(10px)';
        }

        input.addEventListener('input', function() {
            const cursor = input.selectionStart;
            input.value = normalizeActivationCode(input.value);
            if (typeof cursor === 'number') {
                input.setSelectionRange(input.value.length, input.value.length);
            }
        });

        copyButton.addEventListener('click', async function() {
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(deviceId);
                } else {
                    const tempInput = document.createElement('input');
                    tempInput.value = deviceId;
                    document.body.appendChild(tempInput);
                    tempInput.select();
                    document.execCommand('copy');
                    tempInput.remove();
                }

                const oldText = copyButton.innerText;
                copyButton.innerText = '已复制';
                setTimeout(function() {
                    copyButton.innerText = oldText;
                }, 1200);
            } catch (error) {
                console.warn('Copy failed:', error);
                errorMsg.innerText = '复制失败，请手动抄下设备码';
                errorMsg.style.display = 'block';
            }
        });

        async function verify() {
            const inputCode = input.value.trim();
            if (!inputCode) {
                return;
            }

            button.disabled = true;
            button.innerText = '激活中...';
            errorMsg.style.display = 'none';

            try {
                if (!verifyActivationCode(deviceId, inputCode)) {
                    throw new Error('激活码不匹配当前设备');
                }

                markDeviceVerified(deviceId);
                showContent(authOverlay);
            } catch (err) {
                console.error(err);
                errorMsg.innerText = err.message || '激活失败';
                errorMsg.style.display = 'block';
                input.value = '';
                input.style.transform = 'translateX(10px)';
                setTimeout(function() {
                    input.style.transform = 'translateX(-10px)';
                    setTimeout(function() {
                        input.style.transform = 'translateX(0)';
                    }, 100);
                }, 100);
            } finally {
                button.disabled = false;
                button.innerText = '激活并进入';
            }
        }

        button.addEventListener('click', verify);
        input.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                verify();
            }
        });
    }

    function showContent(overlay) {
        if (overlay) {
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
            setTimeout(function() {
                overlay.remove();
            }, 500);
        }

        const mainContent = document.getElementById('screen-container');
        if (mainContent) {
            mainContent.style.filter = 'none';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
})();
