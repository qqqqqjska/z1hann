// auth.js
(function() {
    const STORAGE_KEY = "is_verified";

    // ============================================================
    // 【配置区域】请在此处填入您的 Bmob (比目后端云) 应用信息
    // ============================================================
    // 由于 LeanCloud 暂停注册，我们改用 Bmob (https://www.bmob.cn/)
    // 1. 注册 Bmob 账号并创建应用。
    // 2. 在应用设置 -> 应用密钥 中获取 Secret Key 和 API 安全码 (API Safety Code)。
    // 3. 在数据 -> 创建表 -> 名称必须为 "VerificationCode"。
    // 4. 为 "VerificationCode" 表添加列：
    //    - code (String): 存放资格码
    //    - isUsed (Boolean): 是否已使用 (默认 false)
    // 5. 将获取到的信息填入下方：
    
    const BMOB_SECRET_KEY = "47555583581ac060"; // 替换为您的 Secret Key
    const BMOB_API_KEY = "2382745495111111"; // 替换为您的 API 安全码 (API Safety Code)
    
    // 如果您还没有配置 Bmob，可以暂时使用此【备用】本地验证码 (Base64编码)
    // 默认: 2024 -> MjAyNA==
    const FALLBACK_CODE_BASE64 = "MjAyNA=="; 
    
    // ============================================================

    function initAuth() {
        // 1. 检查本地是否已验证
        if (localStorage.getItem(STORAGE_KEY) === "true") {
            showContent();
            return;
        }

        // 2. 初始化 Bmob
        let isBmobReady = false;
        if (typeof Bmob !== 'undefined' && BMOB_SECRET_KEY !== "YOUR_SECRET_KEY") {
            try {
                Bmob.initialize(BMOB_SECRET_KEY, BMOB_API_KEY);
                isBmobReady = true;
                console.log("Bmob initialized.");
            } catch (e) {
                console.error("Bmob init failed:", e);
            }
        }

        // 3. 创建验证界面 UI
        createAuthUI(isBmobReady);
    }

    function createAuthUI(isBmobReady) {
        const authOverlay = document.createElement('div');
        authOverlay.id = 'auth-overlay';
        authOverlay.style.position = 'fixed';
        authOverlay.style.top = '0';
        authOverlay.style.left = '0';
        authOverlay.style.width = '100%';
        authOverlay.style.height = '100%';
        authOverlay.style.backgroundColor = '#000000';
        authOverlay.style.zIndex = '99999';
        authOverlay.style.display = 'flex';
        authOverlay.style.flexDirection = 'column';
        authOverlay.style.justifyContent = 'center';
        authOverlay.style.alignItems = 'center';
        authOverlay.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

        const container = document.createElement('div');
        container.style.width = '80%';
        container.style.maxWidth = '300px';
        container.style.textAlign = 'center';

        const title = document.createElement('h2');
        title.innerText = '访问验证';
        title.style.color = '#fff';
        title.style.marginBottom = '20px';
        title.style.fontWeight = '500';

        const input = document.createElement('input');
        input.type = 'text'; 
        input.placeholder = '请输入资格码';
        input.style.width = '100%';
        input.style.padding = '12px';
        input.style.borderRadius = '10px';
        input.style.border = 'none';
        input.style.backgroundColor = '#1c1c1e';
        input.style.color = '#fff';
        input.style.fontSize = '16px';
        input.style.marginBottom = '15px';
        input.style.outline = 'none';
        input.style.textAlign = 'center';

        const button = document.createElement('button');
        button.innerText = '验证并进入';
        button.style.width = '100%';
        button.style.padding = '12px';
        button.style.borderRadius = '10px';
        button.style.border = 'none';
        button.style.backgroundColor = '#007AFF';
        button.style.color = '#fff';
        button.style.fontSize = '16px';
        button.style.fontWeight = '600';
        button.style.cursor = 'pointer';
        button.disabled = false;

        const errorMsg = document.createElement('div');
        errorMsg.style.color = '#ff3b30';
        errorMsg.style.marginTop = '15px';
        errorMsg.style.fontSize = '14px';
        errorMsg.style.display = 'none';
        errorMsg.innerText = '资格码错误';

        const tip = document.createElement('div');
        tip.style.color = '#666';
        tip.style.marginTop = '20px';
        tip.style.fontSize = '12px';
        
        if (!isBmobReady) {
            if (typeof Bmob === 'undefined') {
                tip.innerText = '提示: Bmob SDK 加载失败，正在使用本地模式';
                tip.style.color = '#ff3b30';
            } else if (BMOB_SECRET_KEY === "YOUR_SECRET_KEY") {
                tip.innerText = '提示: 未配置云端数据库，使用本地验证模式';
            } else {
                tip.innerText = '提示: 云端连接失败，请检查密钥';
                tip.style.color = '#ff3b30';
            }
        }

        container.appendChild(title);
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

        // 验证逻辑
        async function verify() {
            const inputCode = input.value.trim();
            if (!inputCode) return;

            button.disabled = true;
            button.innerText = '验证中...';
            errorMsg.style.display = 'none';

            try {
                let isValid = false;

                if (isBmobReady) {
                    // === 云端验证逻辑 (Bmob) ===
                    const query = Bmob.Query('VerificationCode');
                    query.equalTo('code', '==', inputCode);
                    const results = await query.find();

                    if (results && results.length > 0) {
                        const codeObj = results[0];
                        // Bmob v3 返回的是普通对象，没有 set 方法
                        // 直接访问属性 isUsed
                        if (codeObj.isUsed) {
                            throw new Error('该资格码已被使用');
                        } else {
                            // 标记为已使用: 需要用 objectId 重新构建查询进行更新
                            const updateQuery = Bmob.Query('VerificationCode');
                            updateQuery.set('id', codeObj.objectId);
                            updateQuery.set('isUsed', true);
                            await updateQuery.save();
                            isValid = true;
                        }
                    } else {
                        throw new Error('资格码无效');
                    }
                } else {
                    // === 本地备用逻辑 ===
                    const inputBase64 = btoa(inputCode);
                    if (inputBase64 === FALLBACK_CODE_BASE64) {
                        isValid = true;
                    } else {
                        throw new Error('资格码错误');
                    }
                }

                if (isValid) {
                    localStorage.setItem(STORAGE_KEY, "true");
                    showContent(authOverlay);
                }

            } catch (err) {
                console.error(err);
                // Bmob 错误处理
                let msg = err.message || '验证失败';
                if (err.error) msg = err.error;
                
                errorMsg.innerText = msg;
                errorMsg.style.display = 'block';
                input.value = '';
                // 震动特效
                input.style.transform = 'translateX(10px)';
                setTimeout(() => {
                    input.style.transform = 'translateX(-10px)';
                    setTimeout(() => {
                        input.style.transform = 'translateX(0)';
                    }, 100);
                }, 100);
            } finally {
                button.disabled = false;
                button.innerText = '验证并进入';
            }
        }

        button.addEventListener('click', verify);
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verify();
            }
        });
    }

    function showContent(overlay) {
        if (overlay) {
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
            setTimeout(() => {
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
