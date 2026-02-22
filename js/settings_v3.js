// Settings App V3 Logic

function initSettingsApp() {
    // Initial tab
    switchSettingsTab('ai');
    
    // Sliders
    const aiTemp = document.getElementById('ai-temperature');
    if (aiTemp) {
        aiTemp.addEventListener('input', function(e) {
            const display = document.getElementById('ai-temp-value');
            if (display) display.innerText = e.target.value;
        });
    }

    const aiTemp2 = document.getElementById('ai-temperature-2');
    if (aiTemp2) {
        aiTemp2.addEventListener('input', function(e) {
            const display = document.getElementById('ai-temp-value-2');
            if (display) display.innerText = e.target.value;
        });
    }

    const naiSteps = document.getElementById('novelai-steps');
    if (naiSteps) {
        naiSteps.addEventListener('input', function(e) {
            const display = document.getElementById('novelai-steps-val');
            if (display) display.innerText = e.target.value;
        });
    }

    const naiScale = document.getElementById('novelai-scale');
    if (naiScale) {
        naiScale.addEventListener('input', function(e) {
            const display = document.getElementById('novelai-scale-val');
            if (display) display.innerText = e.target.value;
        });
    }
    
    // Bind Back Button
    const closeBtn = document.getElementById('close-settings-app');
    if (closeBtn) {
        closeBtn.onclick = function() {
            document.getElementById('settings-app').classList.add('hidden');
        };
    }
}

function switchSettingsTab(tabId) {
    // Remove active from pills (scoped to settings app)
    const settingsApp = document.getElementById('settings-app');
    if (!settingsApp) return;

    const pills = settingsApp.querySelectorAll('.nav-pill');
    pills.forEach(el => {
        el.classList.remove('active');
        const onclickAttr = el.getAttribute('onclick');
        // Robust matching of the tab ID in the onclick attribute
        if (onclickAttr && onclickAttr.includes(`'${tabId}'`)) {
            el.classList.add('active');
        }
    });

    // Hide all views
    const views = settingsApp.querySelectorAll('.section-view');
    views.forEach(el => el.classList.remove('active'));
    
    // Show target view
    const target = document.getElementById('tab-' + tabId);
    if (target) target.classList.add('active');
}

// Global scope
window.switchSettingsTab = switchSettingsTab;
window.initSettingsApp = initSettingsApp;

// Enable Drag to Scroll for Nav Scroller
// Must be called AFTER settings-app is visible (not display:none)
let _dragScrollInited = false;
function enableDragScroll() {
    if (_dragScrollInited) return;
    const slider = document.querySelector('#settings-app .nav-scroller');
    if (!slider) return;
    _dragScrollInited = true;

    // Mouse drag support
    let isMouseDown = false;
    let startX, scrollLeft;

    slider.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        startX = e.pageX;
        scrollLeft = slider.scrollLeft;
        slider.style.cursor = 'grabbing';
    });

    document.addEventListener('mouseup', () => {
        isMouseDown = false;
        slider.style.cursor = 'grab';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        e.preventDefault();
        const walk = (e.pageX - startX) * 1.5;
        slider.scrollLeft = scrollLeft - walk;
    });

    // Touch drag support (for mobile / DevTools mobile simulation)
    let touchStartX = 0;
    let touchScrollLeft = 0;

    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchScrollLeft = slider.scrollLeft;
    }, { passive: true });

    slider.addEventListener('touchmove', (e) => {
        const walk = (touchStartX - e.touches[0].clientX) * 1.5;
        slider.scrollLeft = touchScrollLeft + walk;
    }, { passive: true });

    slider.style.cursor = 'grab';
}

// Watch for settings-app becoming visible, then init drag scroll
function watchSettingsAppOpen() {
    const settingsApp = document.getElementById('settings-app');
    if (!settingsApp) return;

    const observer = new MutationObserver(() => {
        if (!settingsApp.classList.contains('hidden')) {
            enableDragScroll();
        }
    });
    observer.observe(settingsApp, { attributes: true, attributeFilter: ['class'] });
}

function initSettingsV3App() {
    initSettingsApp();
    watchSettingsAppOpen();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSettingsV3App);
} else {
    initSettingsV3App();
}
