/**
 * 更新日志弹窗配置
 * 每次更新时：
 * 1. 修改 CHANGELOG_VERSION（修改后所有用户会再次看到弹窗）
 * 2. 修改 CHANGELOG_CONTENT 里的更新内容
 */

const CHANGELOG_VERSION = 'v1.0.8'; // 修改这个版本号来让弹窗再次显示
const CHANGELOG_IMAGE = 'https://i.postimg.cc/7Lm6s43m/IMG-8241.jpg';
const CHANGELOG_ITEMS = [
    '查手机中加了一些应用，但是微博和icity还是懒得没做、、',
    '在微信功能菜单中增加了“吃什么”和“导航”的功能，可以让char帮你看附近有什么吃的以及帮你规划路线，需要一个另外的高德地图apikey（申请key时选择web服务，lookus的地图部分用的是web端js api）'
];
const CHANGELOG_ACCESS_READY_EVENT = 'z1han:access-ready';

let changelogPopupShown = false;

const CHANGELOG_STYLE = `
    #changelog-overlay {
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
    }

    .changelog-popup {
        background: #fff;
        border-radius: 24px;
        width: 88%;
        max-width: 360px;
        max-height: 82vh;
        padding: 28px 22px 22px;
        position: relative;
        box-shadow: 0 18px 42px rgba(0, 0, 0, 0.18);
        transform: scale(0.9);
        transition: transform 0.3s ease;
        overflow-y: auto;
        box-sizing: border-box;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
    }

    .changelog-close-btn {
        position: absolute;
        top: 12px;
        right: 14px;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 50%;
        background: #f2f2f7;
        color: #8e8e93;
        font-size: 18px;
        cursor: pointer;
        line-height: 1;
    }

    .changelog-subtitle {
        margin-bottom: 8px;
        text-align: center;
        color: #8e8e93;
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 1.6px;
        text-transform: uppercase;
    }

    .changelog-title {
        margin-bottom: 24px;
        text-align: center;
        color: #000;
        font-size: 28px;
        line-height: 1.2;
        font-weight: 800;
        letter-spacing: -0.5px;
    }

    .changelog-title span {
        color: #d1d1d6;
        font-weight: 500;
    }

    .changelog-feature-stage {
        margin-bottom: 24px;
    }

    .changelog-feature-visual {
        overflow: hidden;
        max-height: 420px;
        opacity: 1;
        transform: translateY(0) scale(1);
        transform-origin: top center;
        transition: max-height 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.24s ease, transform 0.28s ease;
    }

    .changelog-feature-visual[hidden] {
        display: none !important;
    }

    .changelog-feature-cover {
        width: 100%;
        aspect-ratio: 1 / 1;
        display: block;
        padding: 0;
        border: none;
        border-radius: 20px;
        overflow: hidden;
        background: #f5f5f5;
        cursor: pointer;
        transition: opacity 0.28s ease, transform 0.28s ease;
    }

    .changelog-feature-cover img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
    }

    .changelog-feature-cover[hidden] {
        display: none !important;
    }

    .changelog-feature-guide {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 18px;
        margin-top: 12px;
        color: #8e8e93;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.2px;
        transition: opacity 0.24s ease, transform 0.24s ease;
    }

    .changelog-feature-guide[hidden] {
        display: none !important;
    }

    .changelog-feature-guide-text {
        animation: changelogGuideFade 1.8s ease-in-out infinite;
    }

    .changelog-feature-guide-chevron {
        display: inline-block;
        font-size: 16px;
        line-height: 1;
        animation: changelogGuideBounce 1.2s ease-in-out infinite;
    }

    .changelog-feature-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transform: translateY(10px);
        transition: max-height 0.42s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease, transform 0.28s ease, margin-top 0.28s ease;
    }

    .changelog-feature-stage.is-revealed .changelog-feature-list {
        max-height: 720px;
        opacity: 1;
        transform: translateY(0);
        margin-top: 4px;
    }

    .changelog-feature-stage.is-revealed .changelog-feature-visual {
        max-height: 0;
        opacity: 0;
        transform: translateY(-8px) scale(0.98);
        pointer-events: none;
    }

    .changelog-feature-cover.is-hiding,
    .changelog-feature-guide.is-hiding {
        opacity: 0;
        transform: translateY(-4px) scale(0.98);
    }

    .changelog-feature-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        color: #444;
        font-size: 14px;
        line-height: 1.65;
    }

    .changelog-feature-dot {
        width: 7px;
        height: 7px;
        margin-top: 9px;
        border-radius: 50%;
        background: #000;
        flex-shrink: 0;
    }

    .changelog-actions {
        margin-top: 6px;
        text-align: center;
    }

    .changelog-ok-btn {
        width: 100%;
        border: none;
        border-radius: 16px;
        padding: 14px 18px;
        background: #000;
        color: #fff;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
    }

    @keyframes changelogGuideFade {
        0%,
        100% {
            opacity: 0.45;
        }

        50% {
            opacity: 1;
        }
    }

    @keyframes changelogGuideBounce {
        0%,
        100% {
            transform: translateY(0);
        }

        50% {
            transform: translateY(3px);
        }
    }
`;

function canShowChangelogNow() {
    return !!window.__z1hanAccessReady || !document.getElementById('auth-overlay');
}

function tryShowChangelog() {
    if (changelogPopupShown) {
        return;
    }

    const hasSeenChangelog = localStorage.getItem(`changelog_seen_${CHANGELOG_VERSION}`);
    if (hasSeenChangelog || !canShowChangelogNow()) {
        return;
    }

    changelogPopupShown = true;
    showChangelogPopup();
}

window.addEventListener(CHANGELOG_ACCESS_READY_EVENT, tryShowChangelog);

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryShowChangelog);
} else {
    tryShowChangelog();
}

function ensureChangelogStyles() {
    if (document.getElementById('changelog-style')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'changelog-style';
    style.textContent = CHANGELOG_STYLE;
    document.head.appendChild(style);
}

function renderChangelogContent() {
    const versionText = CHANGELOG_VERSION.replace(/^v/i, '');
    const itemsMarkup = CHANGELOG_ITEMS.map(item => `
        <div class="changelog-feature-item">
            <span class="changelog-feature-dot"></span>
            <span>${item}</span>
        </div>
    `).join('');

    return `
        <div class="changelog-subtitle">What's New</div>
        <div class="changelog-title">Version <span>${versionText}</span></div>
        <div class="changelog-feature-stage" id="changelog-feature-stage">
            <div class="changelog-feature-visual" id="changelog-feature-visual">
                <button class="changelog-feature-cover" id="changelog-feature-cover" type="button" aria-label="查看更新内容">
                    <img src="${CHANGELOG_IMAGE}" alt="更新图片">
                </button>
                <div class="changelog-feature-guide" id="changelog-feature-guide" aria-hidden="true">
                    <span class="changelog-feature-guide-text">轻触图片查看更新内容</span>
                    <span class="changelog-feature-guide-chevron">⌄</span>
                </div>
            </div>
            <div class="changelog-feature-list" id="changelog-feature-list">
                ${itemsMarkup}
            </div>
        </div>
        <div class="changelog-actions">
            <button id="changelog-ok-btn" class="changelog-ok-btn">我知道了</button>
        </div>
    `;
}

function showChangelogPopup() {
    ensureChangelogStyles();

    const overlay = document.createElement('div');
    overlay.id = 'changelog-overlay';

    const popup = document.createElement('div');
    popup.className = 'changelog-popup';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'changelog-close-btn';

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
    contentDiv.innerHTML = renderChangelogContent();

    popup.appendChild(closeBtn);
    popup.appendChild(contentDiv);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    setTimeout(() => {
        const okBtn = popup.querySelector('#changelog-ok-btn');
        const featureStage = popup.querySelector('#changelog-feature-stage');
        const featureVisual = popup.querySelector('#changelog-feature-visual');
        const featureCover = popup.querySelector('#changelog-feature-cover');
        const featureGuide = popup.querySelector('#changelog-feature-guide');

        if (okBtn) {
            okBtn.onclick = closePopup;
        }

        if (featureCover && featureStage && featureVisual) {
            const syncFeatureVisualHeight = () => {
                if (featureStage.classList.contains('is-revealed')) {
                    return;
                }

                featureVisual.style.maxHeight = `${featureVisual.scrollHeight}px`;
            };

            syncFeatureVisualHeight();

            const featureImage = featureCover.querySelector('img');
            if (featureImage && !featureImage.complete) {
                featureImage.addEventListener('load', syncFeatureVisualHeight, { once: true });
            }

            featureCover.onclick = () => {
                if (featureStage.classList.contains('is-revealed')) {
                    return;
                }

                syncFeatureVisualHeight();

                requestAnimationFrame(() => {
                    featureStage.classList.add('is-revealed');
                });

                featureVisual.setAttribute('aria-hidden', 'true');
                featureCover.setAttribute('aria-hidden', 'true');
                featureCover.tabIndex = -1;
                if (featureGuide) {
                    featureGuide.setAttribute('aria-hidden', 'true');
                }

                window.setTimeout(() => {
                    featureVisual.hidden = true;
                }, 420);
            };
        }

        overlay.style.opacity = '1';
        popup.style.transform = 'scale(1)';
    }, 10);
}
