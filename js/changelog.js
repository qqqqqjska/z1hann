/**
 * 更新日志弹窗配置
 * 每次更新时：
 * 1. 修改 CHANGELOG_VERSION（修改后所有用户会再次看到弹窗）
 * 2. 修改 CHANGELOG_CONTENT 里的更新内容
 */

const CHANGELOG_VERSION = 'v1.0.3'; // 修改这个版本号来让弹窗再次显示
const CHANGELOG_CONTENT = `
    <h2 style="margin-top: 0; margin-bottom: 15px; text-align: center; color: #333;">更新日志</h2>
    <div style="font-size: 14px; color: #666; margin-bottom: 15px;">版本: ${CHANGELOG_VERSION}</div>
    <div style="width: 100%; aspect-ratio: 1 / 1; overflow: hidden; border-radius: 8px; margin-bottom: 15px; display: flex; justify-content: center; align-items: center; background: #f5f5f5;">
        <img src="https://i.postimg.cc/0yFjXpfZ/IMG_6893.jpg" alt="更新图片" style="max-width: 100%; height: auto; object-fit: contain; display: block;">
    </div>
    <div style="font-size: 15px; color: #444; line-height: 1.7;">
        <ul style="padding-left: 22px; margin: 0; display: flex; flex-direction: column; gap: 10px;">
            <li style="margin-bottom: 0; word-break: break-word;">激活码改成用设备码一机一码，qq带设备码找我</li>
            <li style="margin-bottom: 0; word-break: break-word;">新增家园系统，底栏第一个按钮可以去别的地方，顶栏头像可以选择联系人和设置动图，点击联系人形象可以摸头喂食和派遣</li>
            <li style="margin-bottom: 0; word-break: break-word;">新增查看token数，在聊天设置页面</li>
            <li style="margin-bottom: 0; word-break: break-word;">新增离线时触发主动发消息功能，但是我没测试多个联系人使用时会不会有bug，需要用render部署一下，有需要的qq找我我来教</li>
            <li style="margin-bottom: 0; word-break: break-word;">修改了一下见面的ui和之前的bug，之前的自定义css可能会用不了了</li>
            <li style="margin-bottom: 0; word-break: break-word;">音乐的退出按钮图片可以点那个铃铛按钮自定义了，然后之前的音乐接口失效了换了一下</li>
        </ul>
    </div>
    <div style="margin-top: 20px; text-align: center;">
        <button id="changelog-ok-btn" style="background-color: #007AFF; color: #fff; border: none; padding: 10px 30px; border-radius: 20px; font-size: 16px; cursor: pointer;">我知道了</button>
    </div>
`;

document.addEventListener('DOMContentLoaded', () => {
    const hasSeenChangelog = localStorage.getItem(`changelog_seen_${CHANGELOG_VERSION}`);

    if (!hasSeenChangelog) {
        showChangelogPopup();
    }
});

function showChangelogPopup() {
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

    const popup = document.createElement('div');
    popup.style.cssText = `
        background: #fff;
        border-radius: 16px;
        width: 88%;
        max-width: 340px;
        max-height: 82vh;
        padding: 24px;
        position: relative;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        transform: scale(0.9);
        transition: transform 0.3s ease;
        overflow-y: auto;
        box-sizing: border-box;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
    `;

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

    const closePopup = () => {
        overlay.style.opacity = '0';
        popup.style.transform = 'scale(0.9)';
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        }, 300);
        localStorage.setItem(`changelog_seen_${CHANGELOG_VERSION}`, 'true');
    };

    closeBtn.onclick = closePopup;

    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = CHANGELOG_CONTENT;

    popup.appendChild(closeBtn);
    popup.appendChild(contentDiv);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    setTimeout(() => {
        const okBtn = document.getElementById('changelog-ok-btn');
        if (okBtn) {
            okBtn.onclick = closePopup;
        }

        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1)';
    }, 10);
}
