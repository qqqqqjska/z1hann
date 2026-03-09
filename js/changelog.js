/**
 * 更新日志弹窗配置
 * 每次更新时：
 * 1. 修改 CHANGELOG_VERSION （修改后所有用户会再次看到弹窗）
 * 2. 修改 CHANGELOG_CONTENT 里的更新内容
 */

const CHANGELOG_VERSION = 'v1.0.2'; // 修改这个版本号来让弹窗再次显示
const CHANGELOG_CONTENT = `
    <h2 style="margin-top: 0; margin-bottom: 15px; text-align: center; color: #333;">更新日志</h2>
    <div style="font-size: 14px; color: #666; margin-bottom: 15px;">版本: ${CHANGELOG_VERSION}</div>
    <div style="width: 100%; aspect-ratio: 1 / 1; overflow: hidden; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: center; align-items: center; background: #f5f5f5;">
    <img src="https://i.postimg.cc/25Hvq8WG/IMG-6801.jpg" alt="更新图片" style="max-width: 100%; height: auto; object-fit: contain; display: block;">
    </div>
    <div style="font-size: 15px; color: #444; line-height: 1.6;">
        <ul style="padding-left: 20px; margin: 0;">
            <li style="margin-bottom: 8px;">小美亚检测到你上班上学玩手机很累，给你带来了今天的更新</li>
            <li style="margin-bottom: 8px;">新增屏幕共享功能在聊天功能菜单中，还没具体测试有bug上报zz！</li>
            <li style="margin-bottom: 8px;">新增日历应用在第二页，日历页面下方三个点按钮可以添加日程，课程表页面点击右上角可以导入课程表的json文件，文件格式我会发在群文件</li>
            <li style="margin-bottom: 8px;">(✧∇✧)</li>
        </ul>
    </div>
    <div style="margin-top: 20px; text-align: center;">
        <button id="changelog-ok-btn" style="background-color: #007AFF; color: #fff; border: none; padding: 10px 30px; border-radius: 20px; font-size: 16px; cursor: pointer;">我知道了</button>
    </div>
`;

document.addEventListener('DOMContentLoaded', () => {
    // 检查本地存储中是否已经有该版本的已读记录
    const hasSeenChangelog = localStorage.getItem(`changelog_seen_${CHANGELOG_VERSION}`);
    
    if (!hasSeenChangelog) {
        showChangelogPopup();
    }
});

function showChangelogPopup() {
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.id = 'changelog-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    // 创建弹窗容器
    const popup = document.createElement('div');
    popup.style.cssText = `
        background: #fff;
        border-radius: 16px;
        width: 80%;
        max-width: 320px;
        padding: 24px;
        position: relative;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        transform: scale(0.9);
        transition: transform 0.3s ease;
    `;

    // 创建关闭按钮 (右上角 X)
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 15px;
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #999;
        padding: 0;
        line-height: 1;
    `;
    
    // 关闭弹窗的函数
    const closePopup = () => {
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.9)';
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 300);
        // 记录该版本已读
        localStorage.setItem(`changelog_seen_${CHANGELOG_VERSION}`, 'true');
    };

    closeBtn.onclick = closePopup;

    // 创建内容区
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = CHANGELOG_CONTENT;

    // 组装并添加到页面
    popup.appendChild(closeBtn);
    popup.appendChild(contentDiv);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // 绑定 "我知道了" 按钮的点击事件
    setTimeout(() => {
        const okBtn = document.getElementById('changelog-ok-btn');
        if (okBtn) {
            okBtn.onclick = closePopup;
        }
        
        // 动画显示
        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1)';
    }, 10);
}
