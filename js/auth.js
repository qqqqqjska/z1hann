// auth.js
(function() {
    // Discord Auth Config
    const DISCORD_CLIENT_ID = '1487795213609992324';
    const DISCORD_GUILD_ID = '1379304008157499423';
    const DISCORD_REDIRECT_URI = 'https://qqqqqjska.github.io/z1han/';

    const DEVICE_ID_KEY = 'device_id';
    const DEVICE_VERIFIED_KEY = 'device_verified';
    const DEVICE_VERIFIED_AT_KEY = 'device_verified_at';
    const LEGACY_STORAGE_KEY = 'is_verified';
    const SECRET_SALT = 'LOOKUS-DEVICE-ACTIVATE-2026';
    const DEVICE_ID_SEGMENT_LENGTH = 4;
    const DEVICE_ID_SEGMENT_COUNT = 3;
    const ACTIVATION_SEGMENT_LENGTH = 4;
    const ACTIVATION_SEGMENT_COUNT = 3;
    const ACCESS_READY_EVENT = 'z1han:access-ready';

    // 保留 Bmob 初始化配置仅作兼容说明，当前默认模式不再依赖云端校验。
    const BMOB_SECRET_KEY = '47555583581ac060';
    const BMOB_API_KEY = '2382745495111111';

    function initAuth() {
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const accessToken = hashParams.get('access_token');
        const discordError = urlParams.get('error') || hashParams.get('error');

        clearLegacyVerificationFlag();
        initBmobForCompatibility();

        const deviceId = getOrCreateDeviceId();
        
        if (isCurrentDeviceVerified(deviceId)) {
            showContent();
            return;
        }

        if (accessToken || discordError) {
            createAuthUI(deviceId);
            handleDiscordCallback(accessToken, discordError, deviceId);
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

    function notifyAccessReady(delay) {
        const emit = function() {
            window.__z1hanAccessReady = true;
            window.dispatchEvent(new CustomEvent(ACCESS_READY_EVENT));
        };

        if (delay && delay > 0) {
            window.setTimeout(emit, delay);
            return;
        }

        emit();
    }

    function redirectToDiscord() {
        const authUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&scope=identify+guilds`;
        window.location.href = authUrl;
    }

    async function handleDiscordCallback(accessToken, error, deviceId) {
        const authOverlay = document.getElementById('auth-overlay');
        const errorMsg = authOverlay.querySelector('#error-msg');
        const button = authOverlay.querySelector('#activation-button');
        const discordButton = authOverlay.querySelector('#discord-login-btn');

        function showMessage(msg, isError = false) {
            errorMsg.innerText = msg;
            errorMsg.style.color = isError ? '#ff453a' : '#8e8e93';
            errorMsg.style.display = 'block';
        }

        if (button) button.disabled = true;
        if (discordButton) discordButton.disabled = true;

        if (error) {
            showMessage('Discord 授权被取消或失败', true);
            window.history.replaceState({}, document.title, window.location.pathname);
            if (button) button.disabled = false;
            if (discordButton) discordButton.disabled = false;
            return;
        }

        showMessage('正在通过 Discord 验证...');

        try {
            if (!accessToken) {
                throw new Error('未获取到有效的授权令牌');
            }

            // 获取用户所在的服务器列表
            const guildsResponse = await fetch('https://discord.com/api/users/@me/guilds', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!guildsResponse.ok) {
                throw new Error('无法获取 Discord 服务器列表');
            }

            const guilds = await guildsResponse.json();
            
            // 检查是否在指定的社区内
            const isInGuild = guilds.some(guild => guild.id === DISCORD_GUILD_ID);

            if (isInGuild) {
                showMessage('验证成功，正在进入...');
                markDeviceVerified(deviceId);
                // 清除 URL 中的 hash 和 search
                window.history.replaceState({}, document.title, window.location.pathname);
                showContent(authOverlay);
            } else {
                throw new Error('验证失败：您不在指定的 Discord 社区内');
            }

        } catch (err) {
            console.error('Discord login error:', err);
            showMessage(err.message, true);
            if (button) button.disabled = false;
            if (discordButton) discordButton.disabled = false;
            window.history.replaceState({}, document.title, window.location.pathname);
        }
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
        button.id = 'activation-button';

        const orSeparator = document.createElement('div');
        orSeparator.innerText = '或';
        orSeparator.style.color = '#8e8e93';
        orSeparator.style.margin = '16px 0';
        orSeparator.style.fontSize = '12px';
        orSeparator.style.position = 'relative';
        orSeparator.style.display = 'flex';
        orSeparator.style.alignItems = 'center';
        orSeparator.style.justifyContent = 'center';

        // Add lines on sides of "或"
        const leftLine = document.createElement('span');
        leftLine.style.flex = '1';
        leftLine.style.height = '1px';
        leftLine.style.background = 'rgba(255,255,255,0.1)';
        leftLine.style.marginRight = '10px';
        
        const rightLine = document.createElement('span');
        rightLine.style.flex = '1';
        rightLine.style.height = '1px';
        rightLine.style.background = 'rgba(255,255,255,0.1)';
        rightLine.style.marginLeft = '10px';

        orSeparator.prepend(leftLine);
        orSeparator.appendChild(rightLine);

        const discordButton = document.createElement('button');
        discordButton.type = 'button';
        discordButton.id = 'discord-login-btn';
        discordButton.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" style="fill: #fff; margin-right: 8px;"><path d="M20.317 4.36981C18.799 3.13124 16.9248 2.37659 14.8677 2.16431C14.7775 2.35515 14.6933 2.55123 14.615 2.7504C13.1037 2.37659 11.4925 2.37659 9.98124 2.7504C9.90297 2.55123 9.81873 2.35515 9.72855 2.16431C7.67139 2.37659 5.79722 3.13124 4.27923 4.36981C1.49673 7.50917 0.584375 11.252 1.05563 14.8373C2.88337 16.9742 5.25338 18.261 7.84338 18.672C8.25213 18.2043 8.62313 17.6933 8.94813 17.139C8.42313 16.9742 7.92937 16.7751 7.46187 16.5373C7.61813 16.4419 7.76813 16.3344 7.91813 16.2268C11.3709 18.1009 15.3413 18.1009 18.6742 16.2268C18.8242 16.3344 18.9742 16.4419 19.1305 16.5373C18.663 16.7751 18.1692 16.9742 17.6442 17.139C17.9692 17.6933 18.3402 18.2043 18.749 18.672C21.339 18.261 23.709 16.9742 25.5367 14.8373C26.0705 10.7093 24.8192 7.08475 20.317 4.36981ZM8.73047 13.9167C7.61813 13.9167 6.69963 12.9324 6.69963 11.7C6.69963 10.4676 7.61813 9.48331 8.73047 9.48331C9.84282 9.48331 10.7613 10.4676 10.7424 11.7C10.7424 12.9324 9.84282 13.9167 8.73047 13.9167ZM15.4319 13.9167C14.3196 13.9167 13.4011 12.9324 13.4011 11.7C13.4011 10.4676 14.3196 9.48331 15.4319 9.48331C16.5442 9.48331 17.4627 10.4676 17.4439 11.7C17.4439 12.9324 16.5442 13.9167 15.4319 13.9167Z"/></svg>' + '通过 Discord 登录';
        
        discordButton.style.width = '100%';
        discordButton.style.padding = '12px';
        discordButton.style.borderRadius = '12px';
        discordButton.style.border = 'none';
        discordButton.style.backgroundColor = '#5865F2';
        discordButton.style.color = '#fff';
        discordButton.style.fontSize = '16px';
        discordButton.style.fontWeight = '600';
        discordButton.style.cursor = 'pointer';
        discordButton.style.display = 'flex';
        discordButton.style.alignItems = 'center';
        discordButton.style.justifyContent = 'center';

        const errorMsg = document.createElement('div');
        errorMsg.id = 'error-msg';
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
        container.appendChild(orSeparator);
        container.appendChild(discordButton);
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

        discordButton.addEventListener('click', redirectToDiscord);
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

        notifyAccessReady(overlay ? 520 : 0);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
})();
