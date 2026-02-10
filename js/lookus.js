
// LookUS 应用功能模块

function initLookusApp() {
    renderLookusApp();
    updateLookusTime();
    
    // Update time every second
    setInterval(updateLookusTime, 1000);
}

function updateLookusTime() {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const timeEl = document.getElementById('lookus-update-time');
    if (timeEl) {
        timeEl.textContent = timeStr;
    }
}

function renderLookusApp() {
    const container = document.getElementById('lookus-content');
    if (!container) return;

    // Clear container
    container.innerHTML = '';

    // --- Top Section (Image 3) ---
    const topSection = document.createElement('div');
    topSection.className = 'lookus-section';
    
    topSection.innerHTML = `
        <div class="lookus-status-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div class="lookus-distance">我们相距 -- km</div>
                    <div class="lookus-location-status">对方未授权定位，无法查看距离</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <i class="fas fa-heart" style="color: #000;"></i>
                    <i class="fas fa-comment-dots" style="color: #000;"></i>
                </div>
            </div>
            <button style="background: #000; color: #fff; border: none; padding: 5px 15px; border-radius: 15px; font-size: 12px; font-weight: bold; float: right; margin-top: -30px;">一键提醒</button>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">iii 在这里</div>
            <div class="lookus-device-info">
                <div class="lookus-device-item">
                    <i class="fas fa-mobile-alt lookus-device-icon"></i>
                    <span>iPhone17Pro</span>
                </div>
                <div class="lookus-device-item">
                    <i class="fas fa-wifi lookus-device-icon"></i>
                    <span>未知 <i class="far fa-question-circle"></i></span>
                </div>
                <div class="lookus-device-item">
                    <i class="fas fa-battery-three-quarters lookus-device-icon"></i>
                    <span>75%</span>
                </div>
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">
                <span><i class="fas fa-map-marker-alt" style="color: #000;"></i> 对方今天停留*个地方</span>
            </div>
            <div class="lookus-map-placeholder">
                <img src="https://placehold.co/600x200/e0e0e0/999?text=Map" class="lookus-map-img">
                <div class="lookus-vip-overlay">
                    <div class="lookus-vip-btn"><i class="fas fa-crown" style="color: #fff;"></i> 开通会员</div>
                    <div class="lookus-vip-text">立即查看对方的行动轨迹</div>
                </div>
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">
                <span><i class="fas fa-sparkles" style="color: #000;"></i> 对方今天的手机报告</span>
            </div>
            <div class="lookus-notice-bar">
                <i class="fas fa-exclamation-circle"></i> 检测到对方未打开实时定位，提醒Ta
                <i class="fas fa-chevron-right" style="margin-left: auto; color: #ccc;"></i>
            </div>
        </div>
    `;
    container.appendChild(topSection);

    // --- Middle Section (Image 2) ---
    const middleSection = document.createElement('div');
    middleSection.className = 'lookus-section';
    
    middleSection.innerHTML = `
        <div class="lookus-card">
            <div class="lookus-card-title">今日手机使用记录</div>
            <div style="display: flex; gap: 15px;">
                <div style="flex: 1; background: #f9f9f9; border-radius: 12px; padding: 20px; text-align: center;">
                    <div class="lookus-usage-circle">
                        <div style="width: 90px; height: 90px; background: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                        </div>
                    </div>
                    <div style="margin-top: 15px; font-weight: bold;">屏幕使用时间</div>
                    <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">*时*分</div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 15px;">
                    <div class="lookus-stat-box" style="flex: 1;">
                        <div class="lookus-stat-label"><span style="color: #000;">●</span> 解锁手机次数</div>
                        <div class="lookus-stat-value">*次</div>
                        <i class="fas fa-lock lookus-lock-icon"></i>
                    </div>
                    <div class="lookus-stat-box" style="flex: 1;">
                        <div class="lookus-stat-label"><span style="color: #000;">●</span> 最近解锁手机</div>
                        <div class="lookus-stat-value">未知</div>
                        <i class="far fa-clock lookus-lock-icon"></i>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="lookus-notice-bar" style="margin: 0 15px 15px 15px;">
            <i class="fas fa-exclamation-circle"></i> 你未开启APP使用权限，对方无法查看
            <i class="fas fa-chevron-right" style="margin-left: auto; color: #ccc;"></i>
        </div>
    `;
    container.appendChild(middleSection);

    // --- Bottom Section (Image 1) ---
    const bottomSection = document.createElement('div');
    bottomSection.className = 'lookus-section';
    
    bottomSection.innerHTML = `
        <div class="lookus-card">
            <div class="lookus-card-title">
                手机APP使用记录 <span class="lookus-new-badge">NEW!</span>
                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
            </div>
            <div style="position: relative; height: 60px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <div class="lookus-blur-content" style="width: 100%; display: flex; gap: 10px;">
                    <div style="width: 40px; height: 40px; background: #eee; border-radius: 8px;"></div>
                    <div style="flex: 1; height: 10px; background: #eee; border-radius: 4px; margin-top: 5px;"></div>
                </div>
                <div class="lookus-vip-overlay">
                    <div class="lookus-vip-btn"><i class="fas fa-crown" style="color: #fff;"></i> 开通会员</div>
                    <div class="lookus-vip-text">查看对方的APP使用记录</div>
                </div>
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">
                网络记录
                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
            </div>
            <div style="position: relative; height: 60px; overflow: hidden; display: flex; align-items: center; justify-content: center;">
                <div class="lookus-blur-content" style="width: 100%; display: flex; gap: 10px;">
                    <div style="width: 40px; height: 40px; background: #eee; border-radius: 8px;"></div>
                    <div style="flex: 1; height: 10px; background: #eee; border-radius: 4px; margin-top: 5px;"></div>
                </div>
                <div class="lookus-vip-overlay">
                    <div class="lookus-vip-btn"><i class="fas fa-crown" style="color: #fff;"></i> 开通会员</div>
                    <div class="lookus-vip-text">查看对方的网络记录</div>
                </div>
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">
                接打记录 (内测版)
                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
            </div>
            <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; color: #666; font-size: 12px; display: flex; align-items: center; gap: 5px;">
                <i class="fas fa-phone-slash" style="color: #666;"></i> 空空如也
            </div>
            <div style="text-align: center; color: #ccc; font-size: 12px; margin-top: 10px;">查看更多</div>
        </div>

        <div class="lookus-grid-2" style="padding: 0 15px;">
            <div class="lookus-card" style="margin: 0;">
                <div class="lookus-card-title">打开Lookus <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i></div>
                <div style="font-size: 14px; font-weight: bold; margin-top: 10px;">*次</div>
                <div style="text-align: right; margin-top: 10px;">
                    <i class="fas fa-eye" style="font-size: 30px; color: #eee;"></i>
                </div>
            </div>
            <div class="lookus-card" style="margin: 0;">
                <div class="lookus-card-title">敏感记录 <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i></div>
                <div style="font-size: 14px; font-weight: bold; margin-top: 10px;">*次</div>
                <div style="text-align: right; margin-top: 10px;">
                    <i class="fas fa-cog" style="font-size: 30px; color: #eee;"></i>
                </div>
            </div>
        </div>

        <div class="lookus-notice-bar">
            <i class="fas fa-exclamation-circle"></i> 我的锁机权限未开启，对方无法锁机
            <i class="fas fa-chevron-right" style="margin-left: auto; color: #ccc;"></i>
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
}

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(initLookusApp);
}
