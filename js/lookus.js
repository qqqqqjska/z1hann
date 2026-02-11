
// LookUS 应用功能模块

let currentLookusContactId = null;
let lookusUpdateTimer = null;
let amapInstance = null;
let amapMarker = null;
let amapContactMarker = null;
let amapPolyline = null;
let currentUserLocation = null; // { lat, lng, address }

// 城市坐标映射表 (经度, 纬度)
const CITY_COORDINATES = {
    // 中国主要城市
    "东城区": [116.416357, 39.928353], "西城区": [116.365868, 39.912289], "朝阳区": [116.443108, 39.921469],
    "丰台区": [116.286968, 39.863642], "石景山区": [116.222982, 39.906611], "海淀区": [116.298056, 39.959912],
    "通州区": [116.656435, 39.909946], "顺义区": [116.654561, 40.130347], "昌平区": [116.231204, 40.220660],
    "大兴区": [116.341395, 39.726929], "怀柔区": [116.631706, 40.316053], "平谷区": [117.121383, 40.140701],
    "密云区": [116.843177, 40.376834], "延庆区": [115.974848, 40.456951], "门头沟区": [116.101719, 39.940338],
    "房山区": [116.143267, 39.747672],
    "黄浦区": [121.469240, 31.229860], "徐汇区": [121.436525, 31.188523], "长宁区": [121.424624, 31.220367],
    "静安区": [121.447453, 31.227906], "普陀区": [121.395555, 31.249840], "虹口区": [121.505133, 31.264600],
    "杨浦区": [121.526077, 31.259541], "闵行区": [121.381709, 31.112813], "宝山区": [121.489612, 31.405457],
    "嘉定区": [121.265300, 31.375602], "浦东新区": [121.544379, 31.221517], "金山区": [121.341970, 30.741991],
    "松江区": [121.227747, 31.032243], "青浦区": [121.124178, 31.150681], "奉贤区": [121.474042, 30.917795],
    "崇明区": [121.397516, 31.622860],
    "广州市": [113.264385, 23.129112], "深圳市": [114.057868, 22.543099], "珠海市": [113.576726, 22.270715],
    "汕头市": [116.681972, 23.354091], "佛山市": [113.121416, 23.021548], "东莞市": [113.751765, 23.020536],
    "中山市": [113.392782, 22.517646], "惠州市": [114.416196, 23.111847],
    "杭州市": [120.153576, 30.287459], "宁波市": [121.549792, 29.868388], "温州市": [120.672111, 28.000575],
    "嘉兴市": [120.750865, 30.762653], "湖州市": [120.102398, 30.867198], "绍兴市": [120.580232, 30.029752],
    "金华市": [119.649506, 29.089524], "台州市": [121.420757, 28.656386],
    "南京市": [118.767413, 32.041544], "无锡市": [120.301663, 31.574729], "徐州市": [117.184811, 34.261792],
    "常州市": [119.946973, 31.772752], "苏州市": [120.619585, 31.299379], "南通市": [120.864608, 32.016212],
    "扬州市": [119.421003, 32.393159],
    "成都市": [104.065735, 30.659462], "重庆市": [106.504962, 29.533155], "武汉市": [114.298572, 30.584355],
    "长沙市": [112.982279, 28.19409], "郑州市": [113.665412, 34.757975], "西安市": [108.948024, 34.263161],
    "济南市": [117.000923, 36.675807], "青岛市": [120.355173, 36.082982], "大连市": [121.618622, 38.914590],
    "沈阳市": [123.429096, 41.796767], "哈尔滨市": [126.642464, 45.756967], "长春市": [125.324501, 43.886841],
    "福州市": [119.306239, 26.075302], "厦门市": [118.11022, 24.490474], "昆明市": [102.712251, 25.040609],
    "贵阳市": [106.713478, 26.578343], "南宁市": [108.320004, 22.82402], "海口市": [110.353899, 20.017120],
    "三亚市": [109.508268, 18.247872], "拉萨市": [91.132212, 29.660361], "乌鲁木齐市": [87.617733, 43.792818],
    "兰州市": [103.823557, 36.058039], "西宁市": [101.778916, 36.623178], "银川市": [106.278179, 38.46637],
    "呼和浩特市": [111.670801, 40.818311], "石家庄市": [114.502461, 38.045474], "太原市": [112.549248, 37.857014],
    "合肥市": [117.283042, 31.86119], "南昌市": [115.892151, 28.676493],
    // 港澳台
    "中西区": [114.154374, 22.281981], "湾仔区": [114.182847, 22.276547], "油尖旺区": [114.173334, 22.311704],
    "台北市": [121.565418, 25.032969], "高雄市": [120.311922, 22.620856],
    // 日本
    "东京都": [139.691706, 35.689487], "神奈川县": [139.642514, 35.447507], "大阪府": [135.502165, 34.693738],
    "京都府": [135.768163, 35.011636], "札幌市": [141.354376, 43.062096], "福冈县": [130.401716, 33.590355],
    "冲绳县": [127.681107, 26.335249], "爱知县": [136.906565, 35.180188],
    // 美国
    "洛杉矶": [-118.243685, 34.052234], "旧金山": [-122.419416, 37.774929], "纽约市": [-74.005941, 40.712784],
    "芝加哥": [-87.629798, 41.878114], "休斯顿": [-95.369803, 29.760427], "西雅图": [-122.332071, 47.606209],
    "波士顿": [-71.058880, 42.360082], "迈阿密": [-80.191790, 25.761680],
    // 韩国
    "首尔特别市": [126.977969, 37.566535], "釜山广域市": [129.075642, 35.179554], "仁川广域市": [126.705206, 37.456256],
    "济州市": [126.531188, 33.499621],
    // 英国
    "伦敦": [-0.127758, 51.507351], "曼彻斯特": [-2.244644, 53.483959], "爱丁堡": [-3.188267, 55.953252],
    // 法国
    "巴黎": [2.352222, 48.856614], "马赛": [5.369780, 43.296482], "里昂": [4.835659, 45.764043],
    // 德国
    "慕尼黑": [11.581981, 48.135125], "柏林": [13.404954, 52.520007], "法兰克福": [8.682127, 50.110922],
    // 澳大利亚
    "悉尼": [151.209296, -33.868820], "墨尔本": [144.963058, -37.813628], "布里斯班": [153.025131, -27.469771],
    // 加拿大
    "多伦多": [-79.383184, 43.653226], "温哥华": [-123.120738, 49.282729], "蒙特利尔": [-73.567256, 45.501689],
    // 俄罗斯
    "莫斯科": [37.617300, 55.755826], "圣彼得堡": [30.315868, 59.939095]
};

// Haversine 公式计算两点间真实距离 (km)
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径 km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 根据联系人位置设置获取坐标
function getContactCoordinates(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact || !contact.location) return null;
    
    const loc = contact.location;
    // 优先按城市查找，再按省份查找
    if (loc.city && CITY_COORDINATES[loc.city]) {
        return CITY_COORDINATES[loc.city];
    }
    if (loc.province && CITY_COORDINATES[loc.province]) {
        return CITY_COORDINATES[loc.province];
    }
    return null;
}

function initLookusApp() {
    // 绑定顶部点击事件
    const headerBadge = document.getElementById('lookus-header-time-badge');
    if (headerBadge) {
        headerBadge.addEventListener('click', openLookusContactPicker);
    }

    // Initial check for current contact
    if (currentLookusContactId) {
        const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
        if (contact) {
            checkAndRefreshLookusData(contact);
        }
    }

    setupAmapSettings();
    loadAmap();

    renderLookusApp();
    updateLookusTime();
    setupLookusTimers();
    
    // Update time display every second (if using live time)
    setInterval(updateLookusTime, 1000);
}

function setupAmapSettings() {
    const keyInput = document.getElementById('amap-api-key');
    const codeInput = document.getElementById('amap-security-code');

    if (keyInput) {
        keyInput.value = window.iphoneSimState.amapSettings?.key || '';
        keyInput.addEventListener('change', (e) => {
            if (!window.iphoneSimState.amapSettings) window.iphoneSimState.amapSettings = {};
            window.iphoneSimState.amapSettings.key = e.target.value.trim();
            saveConfig();
            loadAmap(); // Reload if key changes
            renderLookusApp(); // Re-render to show/hide map container
        });
    }

    if (codeInput) {
        codeInput.value = window.iphoneSimState.amapSettings?.securityCode || '';
        codeInput.addEventListener('change', (e) => {
            if (!window.iphoneSimState.amapSettings) window.iphoneSimState.amapSettings = {};
            window.iphoneSimState.amapSettings.securityCode = e.target.value.trim();
            saveConfig();
        });
    }
}

function loadAmap() {
    const settings = window.iphoneSimState.amapSettings;
    if (!settings || !settings.key) return;

    if (window.AMap) {
        return;
    }

    if (settings.securityCode) {
        window._AMapSecurityConfig = {
            securityJsCode: settings.securityCode,
        };
    }

    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${settings.key}&plugin=AMap.Geolocation,AMap.Geocoder`;
    script.async = true;
    script.onload = () => {
        console.log('AMap loaded');
        if (!document.getElementById('lookus-app').classList.contains('hidden')) {
            initRealMap();
        }
    };
    document.head.appendChild(script);
}

function initRealMap() {
    const container = document.getElementById('lookus-map-container');
    if (!container || !window.AMap) return;

    if (amapInstance) {
        getCurrentLocation();
        return;
    }

    try {
        amapInstance = new AMap.Map('lookus-map-container', {
            resizeEnable: true,
            zoom: 15,
            center: [116.397428, 39.90923]
        });

        getCurrentLocation();
    } catch (e) {
        console.error('Map init error:', e);
        container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;">地图加载失败</div>';
    }
}

function getCurrentLocation() {
    if (!amapInstance || !window.AMap) return;

    const geolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 10000,
        zoomToAccuracy: true
    });

    geolocation.getCurrentPosition((status, result) => {
        if (status === 'complete') {
            onLocationSuccess(result);
        } else {
            console.error('Geolocation failed:', result);
        }
    });
}

function onLocationSuccess(data) {
    const position = data.position;
    currentUserLocation = {
        lat: position.lat,
        lng: position.lng,
        address: data.formattedAddress
    };

    if (amapInstance) {
        amapInstance.setCenter(position);
        
        if (amapMarker) {
            amapMarker.setPosition(position);
        } else {
            amapMarker = new AMap.Marker({
                position: position,
                map: amapInstance,
                icon: new AMap.Icon({
                    size: new AMap.Size(25, 34),
                    image: '//a.amap.com/jsapi_demos/static/demo-center/icons/dir-marker.png',
                    imageSize: new AMap.Size(135, 40),
                    imageOffset: new AMap.Pixel(-9, -3)
                })
            });
        }
        
        // Show contact marker and connection line if contact location is available
        showContactOnMap();
    }
    
    // Re-render to update distance
    renderLookusApp();
}

// Show contact's location marker and connection line on the map
function showContactOnMap() {
    if (!amapInstance || !window.AMap) {
        console.log('[LookUs Map] showContactOnMap: map not ready');
        return;
    }
    if (!currentLookusContactId) {
        console.log('[LookUs Map] showContactOnMap: no contact selected');
        return;
    }
    
    // Debug: check contact location data
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    if (contact) {
        console.log('[LookUs Map] Contact:', contact.remark || contact.name, 'Location:', JSON.stringify(contact.location));
    }
    
    const contactCoords = getContactCoordinates(currentLookusContactId);
    if (!contactCoords) {
        console.log('[LookUs Map] No coordinates found for contact. Make sure the contact has a location set in chat settings (国家/省份/城市)');
        return;
    }
    console.log('[LookUs Map] Contact coordinates:', contactCoords);
    
    const contactLng = contactCoords[0];
    const contactLat = contactCoords[1];
    
    // Remove old contact marker and polyline
    if (amapContactMarker) {
        amapContactMarker.setMap(null);
        amapContactMarker = null;
    }
    if (amapPolyline) {
        amapPolyline.setMap(null);
        amapPolyline = null;
    }
    
    // Add contact marker (red)
    const contactName = contact ? (contact.remark || contact.name) : '联系人';
    
    amapContactMarker = new AMap.Marker({
        position: [contactLng, contactLat],
        map: amapInstance,
        label: {
            content: `<div style="background:#000;color:#fff;padding:4px 10px;border-radius:12px;font-size:12px;white-space:nowrap;border:none;box-shadow:0 2px 6px rgba(0,0,0,0.3);">${contactName}</div>`,
            direction: 'top',
            offset: new AMap.Pixel(0, -5)
        }
    });
    
    // Draw connection line between user and contact if user location is available
    if (currentUserLocation) {
        amapPolyline = new AMap.Polyline({
            path: [
                [currentUserLocation.lng, currentUserLocation.lat],
                [contactLng, contactLat]
            ],
            strokeColor: '#000000',
            strokeWeight: 2,
            strokeStyle: 'dashed',
            strokeOpacity: 0.4,
            map: amapInstance
        });
        
        // Fit map to show both markers
        amapInstance.setFitView([amapMarker, amapContactMarker], false, [50, 50, 50, 50]);
    } else {
        // Center on contact location if no user location
        amapInstance.setCenter([contactLng, contactLat]);
        amapInstance.setZoom(12);
    }
}

function isSameDay(timestamp) {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() &&
           date.getMonth() === now.getMonth() &&
           date.getDate() === now.getDate();
}

async function checkAndRefreshLookusData(contact) {
    if (!contact.lookusData || !isSameDay(contact.lookusData.lastUpdateTime)) {
        console.log(`Resetting Lookus data for ${contact.name} (New Day or First Load)`);
        
        // Reset to initial state (Zeroed out)
        contact.lookusData = {
            distance: '--',
            battery: '--%',
            network: '未知',
            // Use existing device model if available, otherwise default pending generation
            device: contact.deviceModel || 'iPhone', 
            screenTimeH: 0,
            screenTimeM: 0,
            unlockCount: '0次',
            lastUnlock: '未知',
            stops: 0,
            stopList: [],
            appList: [],
            netLog: [],
            reportLog: [],
            lastUpdateTime: 0 // Mark as 0 so we know it's pending update
        };
        saveConfig();
        renderLookusApp(); // Will show 0 values
        
        // Trigger AI update
        await updateLookusStatusWithAI(contact.id);
    }
}

function updateLookusTime() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    const timeEl = document.getElementById('lookus-update-time');
    
    if (timeEl) {
        if (contact && contact.lookusData && contact.lookusData.lastUpdateTime > 0) {
            const date = new Date(contact.lookusData.lastUpdateTime);
            const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
            timeEl.textContent = timeStr;
        } else {
            // Fallback to current time if no update data or pending
            const now = new Date();
            const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
            timeEl.textContent = timeStr;
        }
    }
}

function setupLookusTimers() {
    if (lookusUpdateTimer) clearInterval(lookusUpdateTimer);
    
    lookusUpdateTimer = setInterval(() => {
        if (!currentLookusContactId) return;
        const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
        if (!contact) return;
        
        // Check for day change
        if (contact.lookusData && contact.lookusData.lastUpdateTime > 0 && !isSameDay(contact.lookusData.lastUpdateTime)) {
            checkAndRefreshLookusData(contact);
            return; 
        }
        
        const now = Date.now();
        if (contact.lookusNextUpdateTime && now >= contact.lookusNextUpdateTime) {
            console.log('Triggering auto update for Lookus:', contact.name);
            updateLookusStatusWithAI(contact.id);
            
            // Schedule next
            const mode = contact.lookusUpdateMode;
            if (mode === 'random') {
                scheduleNextRandomUpdate(contact);
            } else if (mode === 'fixed') {
                const interval = contact.lookusUpdateMin || 30;
                contact.lookusNextUpdateTime = now + interval * 60 * 1000;
            } else {
                contact.lookusNextUpdateTime = null;
            }
            saveConfig();
        }
    }, 10000); // Check every 10s
}

function scheduleNextRandomUpdate(contact) {
    const min = contact.lookusUpdateMin || 30;
    const max = contact.lookusUpdateMax || 60;
    // Ensure max >= min
    const validMax = Math.max(max, min);
    
    const randomMinutes = Math.floor(Math.random() * (validMax - min + 1)) + min;
    contact.lookusNextUpdateTime = Date.now() + randomMinutes * 60 * 1000;
}

function openLookusSettings() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    if (!contact) {
        alert('请先选择一个联系人');
        return;
    }
    
    // Load current settings
    const mode = contact.lookusUpdateMode || 'manual';
    const modeSelect = document.getElementById('lookus-update-mode');
    const minInput = document.getElementById('lookus-update-min');
    const maxInput = document.getElementById('lookus-update-max');
    const timeGroup = document.getElementById('lookus-time-input-group');
    const timeLabel = document.getElementById('lookus-time-label');
    const timeHint = document.getElementById('lookus-time-hint');
    const separator = document.getElementById('lookus-time-separator');

    if (modeSelect) modeSelect.value = mode;
    if (minInput) minInput.value = contact.lookusUpdateMin || 30;
    if (maxInput) maxInput.value = contact.lookusUpdateMax || 60;

    // Toggle UI state
    if (mode === 'manual') {
        timeGroup.classList.add('hidden');
    } else {
        timeGroup.classList.remove('hidden');
        if (mode === 'random') {
            timeLabel.textContent = '时间范围 (分钟)';
            timeHint.textContent = '将在最小和最大时间之间随机更新';
            maxInput.classList.remove('hidden');
            separator.classList.remove('hidden');
            minInput.placeholder = '最小';
        } else if (mode === 'fixed') {
            timeLabel.textContent = '固定间隔 (分钟)';
            timeHint.textContent = '每隔设定时间更新一次';
            maxInput.classList.add('hidden');
            separator.classList.add('hidden');
            minInput.placeholder = '分钟';
        }
    }
    
    document.getElementById('lookus-settings-modal').classList.remove('hidden');
    
    // Bind Force Update button
    const forceBtn = document.getElementById('lookus-force-update-btn');
    if (forceBtn) {
        const newForceBtn = forceBtn.cloneNode(true);
        forceBtn.parentNode.replaceChild(newForceBtn, forceBtn);
        newForceBtn.onclick = () => {
            updateLookusStatusWithAI(contact.id);
            document.getElementById('lookus-settings-modal').classList.add('hidden');
        };
    }
}

window.toggleLookusTimeInput = function() {
    const mode = document.getElementById('lookus-update-mode').value;
    const timeGroup = document.getElementById('lookus-time-input-group');
    const timeLabel = document.getElementById('lookus-time-label');
    const timeHint = document.getElementById('lookus-time-hint');
    const minInput = document.getElementById('lookus-update-min');
    const maxInput = document.getElementById('lookus-update-max');
    const separator = document.getElementById('lookus-time-separator');

    if (mode === 'manual') {
        timeGroup.classList.add('hidden');
    } else {
        timeGroup.classList.remove('hidden');
        if (mode === 'random') {
            timeLabel.textContent = '时间范围 (分钟)';
            timeHint.textContent = '将在最小和最大时间之间随机更新';
            maxInput.classList.remove('hidden');
            separator.classList.remove('hidden');
            minInput.placeholder = '最小';
        } else if (mode === 'fixed') {
            timeLabel.textContent = '固定间隔 (分钟)';
            timeHint.textContent = '每隔设定时间更新一次';
            maxInput.classList.add('hidden');
            separator.classList.add('hidden');
            minInput.placeholder = '分钟';
        }
    }
}

window.saveLookusSettings = function() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    if (!contact) return;
    
    const mode = document.getElementById('lookus-update-mode').value;
    const minVal = parseInt(document.getElementById('lookus-update-min').value) || 30;
    const maxVal = parseInt(document.getElementById('lookus-update-max').value) || 60;

    contact.lookusUpdateMode = mode;
    contact.lookusUpdateMin = minVal;
    contact.lookusUpdateMax = maxVal;
    
    if (mode === 'random') {
        scheduleNextRandomUpdate(contact);
    } else if (mode === 'fixed') {
        contact.lookusNextUpdateTime = Date.now() + minVal * 60 * 1000;
    } else {
        contact.lookusNextUpdateTime = null;
    }
    
    saveConfig();
    document.getElementById('lookus-settings-modal').classList.add('hidden');
    setupLookusTimers();
}

window.openLookusSettings = openLookusSettings; // Expose global

function getItineraryText(contactId) {
    if (!window.iphoneSimState.itineraries || !window.iphoneSimState.itineraries[contactId]) return '';
    const data = window.iphoneSimState.itineraries[contactId];
    if (data.events && Array.isArray(data.events)) {
        return data.events.join('\n');
    }
    return '';
}

async function updateLookusStatusWithAI(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    const timeEl = document.getElementById('lookus-update-time');
    if (timeEl) timeEl.textContent = "更新中...";

    const currentData = getLookusData(contactId);
    const history = window.iphoneSimState.chatHistory[contactId] || [];
    const recentHistory = history.slice(-20).map(m => `${m.role === 'user' ? '我' : '你'}: ${m.content}`).join('\n');
    const itineraryText = getItineraryText(contactId);
    
    // Check if device model needs generation
    let deviceInstruction = "";
    if (!contact.deviceModel) {
        deviceInstruction = `\n- **首次生成**：该角色尚未设置手机型号。请根据人设推断并返回 "deviceModel" 字段，例如 "iPhone 15 Pro", "Huawei Mate 60" 等。`;
    }

    // Calculate time elapsed
    let timeElapsedStr = "首次生成或新的一天";
    let lastTime = 0;
    if (contact.lookusData && contact.lookusData.lastUpdateTime > 0 && isSameDay(contact.lookusData.lastUpdateTime)) {
        lastTime = contact.lookusData.lastUpdateTime;
        const diffMs = Date.now() - lastTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours > 0) {
            timeElapsedStr = `${diffHours}小时${diffMins % 60}分钟`;
        } else {
            timeElapsedStr = `${diffMins}分钟`;
        }
    }

    const systemPrompt = `你现在扮演 ${contact.name}。
请根据你的人设、最近的聊天记录以及【行程安排】，更新你在"LookUs"中的状态数据。

【时间逻辑 (关键)】
- 现在的真实时间是：${new Date().toLocaleTimeString()}
- **距离上次更新已过去：${timeElapsedStr}**
- 请务必根据这个时间间隔来合理推演状态变化：
  1. **电量**：根据间隔时间和使用强度扣减电量。
  2. **屏幕使用时间**：增加量**绝对不能超过**逝去的时间 (${timeElapsedStr})。
  3. **位置/行程**：如果间隔很短，位置通常不变；如果间隔较长，可能已经移动到了下一个地点。
  4. **报备事件**：请根据逝去的时间生成 1-3 条在此期间发生的状态变更事件（系统提示消息）。如果时间间隔很短，可以没有事件。事件应简短，例如"对方刚刚解锁了手机"、"对方电量低于20%"、"对方离开了[地点]"等。

【重要原则】
1. **连续性**：必须基于上次数据演变。
2. **上下文感知**：
   - 睡觉/忙碌 -> 手机未解锁。
   - 打游戏 -> 屏幕使用增加，正在使用游戏APP。
3. **行程同步**：
   - 参考行程信息生成停留地点。
${deviceInstruction}

【参考信息】
当前状态：
- 距离: ${currentData.distance} km
- 电量: ${currentData.battery}
- 屏幕使用: ${currentData.screenTimeH}小时${currentData.screenTimeM}分

今日行程：
${itineraryText || "暂无具体行程"}

请返回 JSON (字段名必须一致):
{
  "distance": "数字 (例如 5.2, 不要带km)",
  "battery": "数字 (0-100)",
  "network": "WiFi名称 或 5G",
  ${!contact.deviceModel ? '"deviceModel": "手机型号",' : ''}
  "screenTimeH": "数字 (小时)",
  "screenTimeM": "数字 (分钟)",
  "unlockCount": "数字 (次数)",
  "lastUnlock": "HH:MM",
  "stops": "数字 (停留数)",
  "stopList": [ {"location": "地点", "duration": "时长", "startTime": "HH:MM"} ],
  "appList": [ {"name": "应用名", "cat": "分类", "time": "时长"} ],
  "netLog": [ {"type": "WiFi/5G", "name": "名称", "time": "时间段", "isCurrent": true/false} ],
  "reportEvents": [ {"text": "事件描述", "type": "unlock/charge/move/app/other", "timeOffsetMin": "距离上次更新过去多少分钟(数字)"} ]
}`;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    
    if (!settings.url || !settings.key) {
        alert("请先在设置中配置 AI API");
        return;
    }
    
    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }
        const cleanKey = settings.key.replace(/[^\x00-\x7F]/g, "").trim();
        
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: '请只返回JSON，不要包含任何其他文字或markdown格式。' }
                ],
                temperature: 0.7
            })
        });
        
        if (response.ok) {
            const resData = await response.json();
            const content = resData.choices[0].message.content;
            let newData;
            try {
                newData = JSON.parse(content);
            } catch (e) {
                // Try to extract JSON from markdown code blocks or other wrapping
                let jsonStr = content;
                
                // Remove markdown code block markers (```json ... ``` or ``` ... ```)
                const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
                if (codeBlockMatch) {
                    jsonStr = codeBlockMatch[1].trim();
                }
                
                try {
                    newData = JSON.parse(jsonStr);
                } catch (e2) {
                    // Last resort: find the outermost { ... } 
                    const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
                    if (braceMatch) {
                        try {
                            newData = JSON.parse(braceMatch[0]);
                        } catch (e3) {
                            console.error("Failed to parse AI response:", content);
                            throw new Error("Invalid JSON response");
                        }
                    } else {
                        console.error("No JSON found in AI response:", content);
                        throw new Error("Invalid JSON response");
                    }
                }
            }
            
            // Save permanent device model if generated
            if (newData.deviceModel && !contact.deviceModel) {
                contact.deviceModel = newData.deviceModel;
            }

            // Process Report Events
            let newReports = [];
            if (newData.reportEvents && Array.isArray(newData.reportEvents)) {
                const now = Date.now();
                const lastTime = (contact.lookusData && contact.lookusData.lastUpdateTime > 0) ? contact.lookusData.lastUpdateTime : (now - 60000);
                
                newReports = newData.reportEvents.map(evt => {
                    let icon = 'fas fa-info-circle';
                    let color = '#999';
                    
                    // Simple Icon Logic
                    if (evt.type === 'unlock' || evt.text.includes('解锁')) { icon = 'fas fa-mobile-alt'; color = '#4CAF50'; }
                    else if (evt.type === 'charge' || evt.text.includes('充电')) { icon = 'fas fa-bolt'; color = '#FF9500'; }
                    else if (evt.type === 'move' || evt.text.includes('离开') || evt.text.includes('到达')) { icon = 'fas fa-map-marker-alt'; color = '#007AFF'; }
                    else if (evt.type === 'app' || evt.text.includes('使用')) { icon = 'fas fa-layer-group'; color = '#9C27B0'; }
                    
                    // Calculate timestamp
                    let offset = parseInt(evt.timeOffsetMin) || 0;
                    let timestamp = lastTime + (offset * 60 * 1000);
                    // Ensure timestamp is not in future
                    if (timestamp > now) timestamp = now;
                    // Ensure timestamp is after last update
                    if (timestamp < lastTime) timestamp = lastTime;

                    const date = new Date(timestamp);
                    const timeStr = `${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
                    
                    return {
                        time: timeStr,
                        timestamp: timestamp,
                        icon: icon,
                        iconColor: color,
                        text: evt.text
                    };
                });
            }

            // Merge Reports
            let currentReports = (contact.lookusData && contact.lookusData.reportLog) ? contact.lookusData.reportLog : [];
            const allReports = [...newReports, ...currentReports];
            
            // Sort by timestamp desc
            allReports.sort((a, b) => b.timestamp - a.timestamp);
            
            // Limit history size (e.g. keep last 50)
            const limitedReports = allReports.slice(0, 50);

            contact.lookusData = {
                distance: newData.distance || currentData.distance,
                battery: (newData.battery || 80) + '%',
                network: newData.network || '5G',
                // deviceModel is stored in contact root, lookusData.device is for display logic
                device: contact.deviceModel || newData.deviceModel || 'iPhone', 
                screenTimeH: newData.screenTimeH || 0,
                screenTimeM: newData.screenTimeM || 0,
                unlockCount: (newData.unlockCount || 0) + '次',
                lastUnlock: newData.lastUnlock || '未知',
                stops: newData.stops || 1,
                stopList: newData.stopList || [],
                appList: newData.appList || [],
                netLog: newData.netLog || [],
                reportLog: limitedReports,
                lastUpdateTime: Date.now()
            };
            
            saveConfig();
            renderLookusApp();
            renderLookusReport(); // Update report view if open
            updateLookusTime();

            // Show notification banner for new report events (only if not in LookUs app)
            if (newReports.length > 0) {
                const latestReport = newReports[0];
                showLookusNotification(contact.name || '对方', latestReport.text, latestReport.icon);
            }
        } else {
            throw new Error(`API Error: ${response.status}`);
        }
    } catch (e) {
        console.error("AI Update Failed", e);
        if (timeEl) timeEl.textContent = "更新失败";
    }
}

function openLookusContactPicker() {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    const closeBtn = document.getElementById('close-contact-picker');
    
    if (!modal || !list) return;
    
    const headerTitle = modal.querySelector('h3');
    const originalTitle = headerTitle ? headerTitle.textContent : '选择联系人';
    if (headerTitle) headerTitle.textContent = '选择查看对象';
    
    if (sendBtn) sendBtn.style.display = 'none';
    
    list.innerHTML = '';
    
    if (!window.iphoneSimState.contacts || window.iphoneSimState.contacts.length === 0) {
        list.innerHTML = '<div class="list-item center-content" style="color:#999;">暂无联系人</div>';
    } else {
        window.iphoneSimState.contacts.forEach(c => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="list-content" style="display:flex; align-items:center; width:100%; padding: 10px;">
                    <img src="${c.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 15px; object-fit: cover;">
                    <div style="flex: 1;">
                        <div style="font-weight: bold;">${c.remark || c.name}</div>
                    </div>
                    <i class="fas fa-chevron-right" style="color: #ccc;"></i>
                </div>
            `;
            item.onclick = () => {
                currentLookusContactId = c.id;
                modal.classList.add('hidden');
                if (headerTitle) headerTitle.textContent = originalTitle;
                if (sendBtn) sendBtn.style.display = '';
                
                checkAndRefreshLookusData(c);
                // Ensure render happens
                renderLookusApp();
            };
            list.appendChild(item);
        });
    }
    
    modal.classList.remove('hidden');
    
    const closeHandler = () => {
        modal.classList.add('hidden');
        if (sendBtn) sendBtn.style.display = '';
        if (headerTitle) headerTitle.textContent = originalTitle;
        closeBtn.removeEventListener('click', closeHandler);
    };
    closeBtn.addEventListener('click', closeHandler);
}

function getLookusData(contactId) {
    if (!contactId) return null; // Return null if no contact

    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    const name = contact ? (contact.remark || contact.name) : '未知用户';
    
    // Restore pseudo-random generation for stable fallbacks
    let seed = 0;
    const str = String(contactId) + name;
    for (let i = 0; i < str.length; i++) {
        seed = ((seed << 5) - seed) + str.charCodeAt(i);
        seed |= 0;
    }
    seed = Math.abs(seed);
    
    const randomDistance = ((seed % 900) / 10 + 0.1).toFixed(1);
    const deviceModels = ['iPhone 15 Pro', 'iPhone 14', 'iPhone 13 mini', 'iPhone 15 Pro Max', 'iPhone SE'];
    const randomDevice = deviceModels[seed % deviceModels.length];

    if (contact && contact.lookusData) {
        return {
            name: name,
            distance: (contact.lookusData.distance && contact.lookusData.distance !== '--') ? contact.lookusData.distance : randomDistance,
            // Prefer permanent device model if set, else fallback to daily data or random
            device: contact.deviceModel || contact.lookusData.device || randomDevice,
            network: contact.lookusData.network,
            battery: contact.lookusData.battery,
            stops: contact.lookusData.stops,
            screenTimeH: contact.lookusData.screenTimeH || 0,
            screenTimeM: contact.lookusData.screenTimeM || 0,
            unlockCount: contact.lookusData.unlockCount,
            lastUnlock: contact.lookusData.lastUnlock,
            appList: contact.lookusData.appList || [],
            netLog: contact.lookusData.netLog || [],
            stopList: contact.lookusData.stopList || []
        };
    }

    // Default Fallback
    return {
        name: name,
        distance: randomDistance,
        device: contact && contact.deviceModel ? contact.deviceModel : randomDevice,
        network: '未知',
        battery: '--%',
        stops: 0,
        screenTimeH: 0,
        screenTimeM: 0,
        unlockCount: '0次',
        lastUnlock: '未知',
        appList: [],
        netLog: [],
        stopList: []
    };
}

function renderLookusApp() {
    const container = document.getElementById('lookus-content');
    if (!container) return;

    if (!currentLookusContactId) {
        container.innerHTML = '<div style="text-align:center; padding: 50px; color: #999;">请先选择联系人</div>';
        return;
    }

    const data = getLookusData(currentLookusContactId);

    // Calculate real distance if both user and contact locations are available
    const contactCoords = getContactCoordinates(currentLookusContactId);
    if (currentUserLocation && contactCoords) {
        const realDist = haversineDistance(
            currentUserLocation.lat, currentUserLocation.lng,
            contactCoords[1], contactCoords[0] // CITY_COORDINATES is [lng, lat]
        );
        data.distance = realDist.toFixed(1);
    }

    // Calculate Screen Time Percentage
    const h = parseInt(data.screenTimeH) || 0;
    const m = parseInt(data.screenTimeM) || 0;
    const totalMinutes = h * 60 + m;
    const percentage = Math.min(100, (totalMinutes / 1440) * 100).toFixed(1);
    const screenTimeStr = `${h}小时${m}分`;

    // Clear container
    container.innerHTML = '';

    // --- Top Section ---
    const topSection = document.createElement('div');
    topSection.className = 'lookus-section';
    
    topSection.innerHTML = `
        <div class="lookus-status-card">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div class="lookus-distance">我们相距 ${data.distance} km</div>
                </div>
                <div style="display: flex; gap: 10px;">
                    <i class="fas fa-heart" style="color: #000;"></i>
                    <i class="fas fa-comment-dots" style="color: #000;"></i>
                </div>
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">${data.name} 在这里</div>
            <div class="lookus-device-info">
                <div class="lookus-device-item">
                    <i class="fas fa-mobile-alt lookus-device-icon"></i>
                    <span>${data.device}</span>
                </div>
                <div class="lookus-device-item">
                    <i class="fas fa-wifi lookus-device-icon"></i>
                    <span>${data.network} <i class="far fa-question-circle"></i></span>
                </div>
                <div class="lookus-device-item">
                    <i class="fas fa-battery-three-quarters lookus-device-icon"></i>
                    <span>${data.battery}</span>
                </div>
            </div>
        </div>
    `;

    // Stops Section
    let stopListHtml = '';
    if (data.stopList && data.stopList.length > 0) {
        data.stopList.forEach((stop, index) => {
             stopListHtml += `
                <div style="display: flex; gap: 15px; align-items: center; padding-top: 10px; margin-bottom: 10px;">
                    <div style="width: 80px; height: 80px; border-radius: 12px; overflow: hidden; position: relative; flex-shrink: 0;">
                        <img src="https://placehold.co/100x100/3e4c63/3e4c63?text=${index+1}" style="width: 100%; height: 100%; object-fit: cover;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: #FF9500; border-radius: 50%; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: center; border: 2px solid #fff;">${index + 1}</div>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                            <i class="fas fa-map-pin" style="color: #FF9500; margin-right: 5px;"></i>
                            停留${stop.duration}
                        </div>
                        <div style="color: #666; font-size: 13px; display: flex; align-items: center; gap: 5px;">
                            <span style="color: #FF9500; font-size: 20px;">•</span> ${stop.startTime}
                            <div style="background: #e0e0e0; height: 10px; width: 60px; border-radius: 2px;"></div>
                            <div style="font-size: 12px; color: #999; margin-left: 5px;">${stop.location}</div>
                        </div>
                    </div>
                </div>
             `;
        });
    } else {
        stopListHtml = '<div style="text-align: center; color: #999; padding: 10px;">暂无停留记录</div>';
    }

    const stopsCard = document.createElement('div');
    stopsCard.className = 'lookus-card';
    stopsCard.innerHTML = `
        <div class="lookus-card-title" style="border-bottom: none; padding-bottom: 0;">
            <span><i class="fas fa-map-marker-alt" style="color: #8BC34A;"></i> 对方今天停留${data.stops}个地方</span>
        </div>
        ${stopListHtml}
    `;
    topSection.appendChild(stopsCard);
    
    container.appendChild(topSection);

    // --- Middle Section ---
    const middleSection = document.createElement('div');
    middleSection.className = 'lookus-section';
    
    middleSection.innerHTML = `
        <div class="lookus-card">
            <div class="lookus-card-title">今日手机使用记录</div>
            <div style="display: flex; gap: 15px;">
                <div style="flex: 1; background: #f9f9f9; border-radius: 12px; padding: 20px; text-align: center;">
                    <div id="lookus-usage-ring" class="lookus-usage-circle"></div>
                    <div style="margin-top: 15px; font-weight: bold;">屏幕使用时间</div>
                    <div style="font-size: 18px; font-weight: bold; margin-top: 5px;">${screenTimeStr}</div>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 15px;">
                    <div class="lookus-stat-box" style="flex: 1;">
                        <div class="lookus-stat-label"><span style="color: #000;">●</span> 解锁手机次数</div>
                        <div class="lookus-stat-value">${data.unlockCount}</div>
                        <i class="fas fa-lock lookus-lock-icon"></i>
                    </div>
                    <div class="lookus-stat-box" style="flex: 1;">
                        <div class="lookus-stat-label"><span style="color: #000;">●</span> 最近解锁手机</div>
                        <div class="lookus-stat-value">${data.lastUnlock}</div>
                        <i class="far fa-clock lookus-lock-icon"></i>
                    </div>
                </div>
            </div>
        </div>
    `;
    container.appendChild(middleSection);

    // --- Bottom Section ---
    const bottomSection = document.createElement('div');
    bottomSection.className = 'lookus-section';
    
    // Generate App List HTML
    let appListHtml = '';
    if (data.appList && data.appList.length > 0) {
        data.appList.forEach(app => {
            // Simple mapping for icons/colors based on common app names, fallback to random/default
            let iconClass = 'fas fa-mobile-alt';
            let bg = '#333';
            if (app.name.includes('微信')) { iconClass = 'fab fa-weixin'; bg = '#07C160'; }
            else if (app.name.includes('抖音')) { iconClass = 'fab fa-tiktok'; bg = '#000'; }
            else if (app.name.includes('游戏') || app.name.includes('荣耀')) { iconClass = 'fas fa-gamepad'; bg = '#FF9500'; }
            
            appListHtml += `
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="width: 40px; height: 40px; background: ${bg}; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="${iconClass}" style="color: #fff; font-size: 22px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 15px;">${app.name}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 2px;">${app.cat || '应用'}</div>
                    </div>
                    <div style="font-weight: 600; font-size: 14px;">${app.time}</div>
                </div>
            `;
        });
    } else {
        appListHtml = '<div style="text-align: center; color: #999; padding: 10px;">暂无记录</div>';
    }

    // Generate Net Log HTML
    let netLogHtml = '';
    if (data.netLog && data.netLog.length > 0) {
        data.netLog.forEach(log => {
            let iconClass = log.type === 'WiFi' ? 'fas fa-wifi' : 'fas fa-signal';
            let iconColor = log.type === 'WiFi' ? '#007AFF' : '#666';
            let bg = log.type === 'WiFi' ? '#E3F2FD' : '#F5F5F5';
            let tagHtml = log.isCurrent ? `<div style="color: #007AFF; font-size: 12px; background: #E3F2FD; padding: 4px 8px; border-radius: 10px; font-weight: 600;">当前</div>` : '';
            
            netLogHtml += `
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <div style="width: 36px; height: 36px; background: ${bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                        <i class="${iconClass}" style="color: ${iconColor}; font-size: 16px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="font-weight: bold; font-size: 15px;">${log.name}</div>
                        <div style="font-size: 12px; color: #999; margin-top: 2px;">${log.time}</div>
                    </div>
                    ${tagHtml}
                </div>
            `;
        });
    } else {
        netLogHtml = '<div style="text-align: center; color: #999; padding: 10px;">暂无记录</div>';
    }

    bottomSection.innerHTML = `
        <div class="lookus-card">
            <div class="lookus-card-title">
                手机APP使用记录 <span class="lookus-new-badge">NEW!</span>
                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
            </div>
            <div class="lookus-app-list" style="margin-top: 15px;">
                ${appListHtml}
            </div>
        </div>

        <div class="lookus-card">
            <div class="lookus-card-title">
                网络记录
                <i class="fas fa-chevron-right" style="color: #ccc; font-size: 12px;"></i>
            </div>
            <div class="lookus-net-list" style="margin-top: 15px;">
                ${netLogHtml}
            </div>
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

    // Animate Ring
    setTimeout(() => {
        const ring = document.getElementById('lookus-usage-ring');
        if (ring) {
            // Trigger reflow
            void ring.offsetWidth;
            ring.style.setProperty('--progress', `${percentage}%`);
        }
    }, 100);
}

function closeLookusApp() {
    const app = document.getElementById('lookus-app');
    if (app) {
        app.style.opacity = '0';
        app.style.transform = 'scale(0.95)';
        app.style.transition = 'opacity 0.2s, transform 0.2s';
        
        setTimeout(() => {
            app.classList.add('hidden');
            // Reset styles for next open
            app.style.opacity = '';
            app.style.transform = '';
            app.style.transition = '';
        }, 200);
    }
}

function switchLookusTab(tabName) {
    const homeView = document.getElementById('lookus-content');
    const reportView = document.getElementById('lookus-report-view');
    const tabs = document.querySelectorAll('.lookus-tab-bar .tab-item');
    const homeBtn = tabs[0];
    const reportBtn = tabs[1];

    const showView = (viewToShow, viewToHide) => {
        if (viewToHide) {
            viewToHide.style.opacity = '0';
            viewToHide.style.transform = 'scale(0.98)';
            viewToHide.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            
            setTimeout(() => {
                viewToHide.style.display = 'none';
                viewToHide.style.opacity = '';
                viewToHide.style.transform = '';
                viewToHide.style.transition = '';
                
                if (viewToShow) {
                    if (tabName === 'report') {
                        viewToShow.style.display = 'flex';
                    } else {
                        viewToShow.style.display = 'block';
                    }
                    viewToShow.style.opacity = '0';
                    viewToShow.style.transform = 'scale(1.02)';
                    viewToShow.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                    
                    // Trigger reflow
                    void viewToShow.offsetWidth;
                    
                    viewToShow.style.opacity = '1';
                    viewToShow.style.transform = 'scale(1)';
                    
                    if (tabName === 'home') {
                        // Re-trigger ring animation if returning to home
                        const ring = document.getElementById('lookus-usage-ring');
                        if (ring) {
                            const currentP = ring.style.getPropertyValue('--progress');
                            ring.style.setProperty('--progress', '0%');
                            setTimeout(() => {
                                ring.style.setProperty('--progress', currentP);
                            }, 50);
                        }
                    }
                }
            }, 200);
        } else if (viewToShow) {
             // Initial show if nothing to hide (shouldn't happen usually but safe to handle)
             if (tabName === 'report') viewToShow.style.display = 'flex';
             else viewToShow.style.display = 'block';
        }
    };

    if (tabName === 'home') {
        if (homeBtn.classList.contains('active')) return;
        
        showView(homeView, reportView);
        
        homeBtn.classList.add('active');
        homeBtn.style.color = '#000';
        reportBtn.classList.remove('active');
        reportBtn.style.color = '#999';
        
    } else if (tabName === 'report') {
        if (reportBtn.classList.contains('active')) return;
        
        showView(reportView, homeView);
        
        homeBtn.classList.remove('active');
        homeBtn.style.color = '#999';
        reportBtn.classList.add('active');
        reportBtn.style.color = '#000';
        
        renderLookusReport(); 
    }
}

function renderLookusReport() {
    const container = document.getElementById('lookus-report-view');
    if (!container) return;
    
    if (!currentLookusContactId) {
        container.innerHTML = '<div style="text-align:center; padding: 50px; color: #999;">请先选择联系人</div>';
        return;
    }

    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    let events = [];
    if (contact && contact.lookusData && contact.lookusData.reportLog) {
        events = contact.lookusData.reportLog;
    }

    container.innerHTML = '';
    container.className = 'lookus-report-view';

    if (events.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding: 50px; color: #999;">暂无报备记录</div>';
        return;
    }

    events.forEach(event => {
        // Time
        const timeEl = document.createElement('div');
        timeEl.className = 'lookus-report-time';
        timeEl.textContent = event.time;
        container.appendChild(timeEl);

        // Bubble
        const itemEl = document.createElement('div');
        itemEl.className = 'lookus-report-item';
        
        // User events get a distinct style
        if (event.isUserEvent) {
            itemEl.style.background = 'rgba(0, 122, 255, 0.08)';
            itemEl.style.border = '1px solid rgba(0, 122, 255, 0.15)';
        }
        
        // Icon
        const iconSpan = document.createElement('span');
        iconSpan.innerHTML = `<i class="${event.icon || 'fas fa-info-circle'}" style="color: ${event.iconColor || '#999'};"></i>`;
        iconSpan.className = 'lookus-report-icon';
        itemEl.appendChild(iconSpan);

        // Text content
        const textSpan = document.createElement('span');
        let processedText = event.text;
        
        if (event.boldText) {
             processedText = processedText.replace(event.boldText, `<b>${event.boldText}</b>`);
        }
        
        textSpan.innerHTML = processedText;
        itemEl.appendChild(textSpan);

        // Link (Optional)
        if (event.link) {
            const linkSpan = document.createElement('span');
            linkSpan.className = 'lookus-report-link';
            linkSpan.textContent = event.link;
            itemEl.appendChild(linkSpan);
        }

        container.appendChild(itemEl);
    });
    
    // Bottom padding
    const spacer = document.createElement('div');
    spacer.style.height = '50px';
    container.appendChild(spacer);
}

// 测试高德地图 API
function testAmapAPI() {
    const statusEl = document.getElementById('lookus-map-status');
    const mapContainer = document.getElementById('lookus-map-container');
    const btn = document.getElementById('lookus-test-map-btn');
    
    if (!statusEl || !mapContainer) return;
    
    statusEl.style.display = 'block';
    
    // Check if API key is configured
    const settings = window.iphoneSimState.amapSettings;
    if (!settings || !settings.key) {
        statusEl.style.color = '#FF3B30';
        statusEl.textContent = '❌ 未配置高德地图 API Key，请在设置中填写';
        mapContainer.style.display = 'none';
        console.error('[Amap Test] No API key configured');
        return;
    }
    
    statusEl.style.color = '#FF9500';
    statusEl.textContent = '⏳ 正在加载高德地图 SDK...';
    console.log('[Amap Test] API Key:', settings.key.substring(0, 6) + '***');
    console.log('[Amap Test] Security Code:', settings.securityCode ? '已配置' : '未配置');
    
    // Set security config
    if (settings.securityCode) {
        window._AMapSecurityConfig = {
            securityJsCode: settings.securityCode,
        };
        console.log('[Amap Test] Security config set');
    }
    
    // Check if AMap is already loaded
    if (window.AMap) {
        console.log('[Amap Test] AMap SDK already loaded, initializing map...');
        statusEl.style.color = '#34C759';
        statusEl.textContent = '✅ SDK 已加载，正在初始化地图...';
        initTestMap(statusEl, mapContainer);
        return;
    }
    
    // Load script
    btn.disabled = true;
    btn.textContent = '加载中...';
    
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${settings.key}&plugin=AMap.Geolocation,AMap.Geocoder`;
    script.async = true;
    
    script.onload = () => {
        console.log('[Amap Test] SDK loaded successfully!');
        statusEl.style.color = '#34C759';
        statusEl.textContent = '✅ SDK 加载成功，正在初始化地图...';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-map-marked-alt"></i> 加载地图 API';
        initTestMap(statusEl, mapContainer);
    };
    
    script.onerror = (e) => {
        console.error('[Amap Test] SDK load failed:', e);
        statusEl.style.color = '#FF3B30';
        statusEl.textContent = '❌ SDK 加载失败，请检查网络和 API Key';
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-map-marked-alt"></i> 重新测试';
        mapContainer.style.display = 'none';
    };
    
    document.head.appendChild(script);
}

function initTestMap(statusEl, mapContainer) {
    try {
        mapContainer.style.display = 'block';
        
        // Clear any previous content
        mapContainer.innerHTML = '';
        
        const map = new AMap.Map(mapContainer, {
            resizeEnable: true,
            zoom: 13,
            center: [116.397428, 39.90923] // 北京天安门
        });
        
        // Add a marker
        const marker = new AMap.Marker({
            position: [116.397428, 39.90923],
            map: map
        });
        
        // Store for later use
        amapInstance = map;
        amapMarker = marker;
        
        map.on('complete', () => {
            console.log('[Amap Test] Map rendered successfully!');
            statusEl.style.color = '#34C759';
            statusEl.textContent = '✅ 地图加载成功！默认显示北京天安门';
        });
        
        // Try geolocation
        try {
            const geolocation = new AMap.Geolocation({
                enableHighAccuracy: true,
                timeout: 10000,
                zoomToAccuracy: true
            });
            
            geolocation.getCurrentPosition((status, result) => {
                if (status === 'complete') {
                    const pos = result.position;
                    const addr = result.formattedAddress || '已获取';
                    console.log('[Amap Test] Geolocation success:', addr, 'lat:', pos.lat, 'lng:', pos.lng);
                    statusEl.textContent = '✅ 地图加载成功！当前位置: ' + addr;
                    map.setCenter(pos);
                    map.setZoom(15);
                    marker.setPosition(pos);
                    
                    // Store user location for distance calculation
                    currentUserLocation = {
                        lat: pos.lat,
                        lng: pos.lng,
                        address: addr
                    };
                    
                    // Show contact marker on the map
                    showContactOnMap();
                    
                    // Re-render to update distance display
                    renderLookusApp();
                } else {
                    console.warn('[Amap Test] Geolocation failed:', result);
                    statusEl.textContent = '✅ 地图加载成功！(定位失败，显示默认位置)';
                    
                    // Even without user geolocation, try to show contact on map
                    showContactOnMap();
                }
            });
        } catch (geoErr) {
            console.warn('[Amap Test] Geolocation error:', geoErr);
        }
        
    } catch (e) {
        console.error('[Amap Test] Map init error:', e);
        statusEl.style.color = '#FF3B30';
        statusEl.textContent = '❌ 地图初始化失败: ' + e.message;
        mapContainer.style.display = 'none';
    }
}

window.testAmapAPI = testAmapAPI;

// ==========================================
// 用户端报备事件监听 (User-side Report Events)
// ==========================================

// 添加用户端报备事件到当前联系人的 reportLog
function addUserReportEvent(text, type = 'other') {
    if (!currentLookusContactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === currentLookusContactId);
    if (!contact) return;
    
    // Ensure lookusData exists
    if (!contact.lookusData) {
        contact.lookusData = { reportLog: [] };
    }
    if (!contact.lookusData.reportLog) {
        contact.lookusData.reportLog = [];
    }
    
    // Icon mapping
    let icon = 'fas fa-info-circle';
    let color = '#999';
    
    if (type === 'charge') { icon = 'fas fa-bolt'; color = '#FF9500'; }
    else if (type === 'battery_low') { icon = 'fas fa-battery-quarter'; color = '#FF3B30'; }
    else if (type === 'battery_full') { icon = 'fas fa-battery-full'; color = '#34C759'; }
    else if (type === 'screen_off') { icon = 'fas fa-moon'; color = '#8E8E93'; }
    else if (type === 'screen_on') { icon = 'fas fa-sun'; color = '#FFCC00'; }
    else if (type === 'offline') { icon = 'fas fa-wifi-slash'; color = '#FF3B30'; }
    else if (type === 'online') { icon = 'fas fa-wifi'; color = '#34C759'; }
    else if (type === 'unlock') { icon = 'fas fa-mobile-alt'; color = '#4CAF50'; }
    
    const now = new Date();
    const timeStr = `${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')} ${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    
    const event = {
        time: timeStr,
        timestamp: Date.now(),
        icon: icon,
        iconColor: color,
        text: '📱 ' + text, // Prefix with phone emoji to distinguish user events
        isUserEvent: true
    };
    
    // Add to front of report log
    contact.lookusData.reportLog.unshift(event);
    
    // Limit to 50 entries
    if (contact.lookusData.reportLog.length > 50) {
        contact.lookusData.reportLog = contact.lookusData.reportLog.slice(0, 50);
    }
    
    saveConfig();
    
    // Update report view if it's currently visible
    const reportView = document.getElementById('lookus-report-view');
    if (reportView && reportView.style.display !== 'none') {
        renderLookusReport();
    }
    
    console.log('[LookUs User Event]', text);
}

// 监听电池状态变化
function setupBatteryMonitor() {
    if (!navigator.getBattery) {
        console.log('[LookUs] Battery API not available');
        return;
    }
    
    navigator.getBattery().then(battery => {
        let lastCharging = battery.charging;
        let lastLevel = battery.level;
        let reportedLow = false;
        let reportedFull = false;
        
        // 充电状态变化
        battery.addEventListener('chargingchange', () => {
            if (battery.charging && !lastCharging) {
                addUserReportEvent('你开始给手机充电了', 'charge');
            } else if (!battery.charging && lastCharging) {
                const pct = Math.round(battery.level * 100);
                addUserReportEvent(`你拔掉了充电器 (当前电量 ${pct}%)`, 'charge');
            }
            lastCharging = battery.charging;
        });
        
        // 电量变化
        battery.addEventListener('levelchange', () => {
            const pct = Math.round(battery.level * 100);
            
            // 电量低于 20% 提醒 (只提醒一次)
            if (pct <= 20 && !reportedLow) {
                addUserReportEvent(`你的手机电量不足 (${pct}%)`, 'battery_low');
                reportedLow = true;
            }
            if (pct > 20) reportedLow = false;
            
            // 充满电提醒 (只提醒一次)
            if (pct >= 100 && battery.charging && !reportedFull) {
                addUserReportEvent('你的手机已充满电', 'battery_full');
                reportedFull = true;
            }
            if (pct < 100) reportedFull = false;
            
            lastLevel = battery.level;
        });
        
        console.log('[LookUs] Battery monitor started. Charging:', battery.charging, 'Level:', Math.round(battery.level * 100) + '%');
    }).catch(err => {
        console.warn('[LookUs] Battery API error:', err);
    });
}

// 监听页面可见性变化 (锁屏/切换标签)
function setupVisibilityMonitor() {
    let lastHiddenTime = null;
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            lastHiddenTime = Date.now();
            // Don't report immediately on hide - wait to see if they come back quickly
        } else {
            if (lastHiddenTime) {
                const awayMs = Date.now() - lastHiddenTime;
                const awayMin = Math.floor(awayMs / 60000);
                
                if (awayMin >= 1) {
                    // Only report if away for more than 1 minute
                    if (awayMin >= 60) {
                        const awayHours = Math.floor(awayMin / 60);
                        const remainMin = awayMin % 60;
                        addUserReportEvent(`你离开了 ${awayHours}小时${remainMin}分钟后回来了`, 'screen_on');
                    } else {
                        addUserReportEvent(`你离开了 ${awayMin} 分钟后回来了`, 'screen_on');
                    }
                }
            }
            lastHiddenTime = null;
        }
    });
    
    console.log('[LookUs] Visibility monitor started');
}

// 监听网络状态变化
function setupNetworkMonitor() {
    window.addEventListener('online', () => {
        addUserReportEvent('你的网络已恢复连接', 'online');
    });
    
    window.addEventListener('offline', () => {
        addUserReportEvent('你的网络已断开', 'offline');
    });
    
    console.log('[LookUs] Network monitor started');
}

// 初始化所有用户端监听器
function setupUserEventMonitors() {
    setupBatteryMonitor();
    setupVisibilityMonitor();
    setupNetworkMonitor();
    console.log('[LookUs] All user event monitors initialized');
}

// 在 initLookusApp 之外也可调用，确保监听器尽早启动
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUserEventMonitors);
} else {
    setupUserEventMonitors();
}

// ==========================================
// LookUS 通知弹窗 (Notification Banner)
// ==========================================

let lookusNotificationTimer = null;

function showLookusNotification(contactName, message, iconClass) {
    // Don't show if LookUs app is currently open and visible
    const lookusApp = document.getElementById('lookus-app');
    if (lookusApp && !lookusApp.classList.contains('hidden')) {
        return;
    }

    const banner = document.getElementById('lookus-notification');
    const titleEl = document.getElementById('lookus-notification-title');
    const msgEl = document.getElementById('lookus-notification-message');
    const iconEl = document.getElementById('lookus-notification-icon');
    const timeEl = document.getElementById('lookus-notification-time');

    if (!banner) return;

    // Set content
    if (titleEl) titleEl.textContent = contactName + ' 状态更新';
    if (msgEl) msgEl.textContent = message;
    if (iconEl && iconClass) {
        iconEl.className = iconClass;
        iconEl.style.fontSize = '20px';
    }
    if (timeEl) timeEl.textContent = '现在';

    // Clear any existing timer
    if (lookusNotificationTimer) {
        clearTimeout(lookusNotificationTimer);
        lookusNotificationTimer = null;
    }

    // Show banner with animation
    banner.classList.remove('hidden');

    // Auto-hide after 5 seconds
    lookusNotificationTimer = setTimeout(() => {
        hideLookusNotification();
    }, 5000);

    console.log('[LookUs Notification]', contactName, message);
}

function hideLookusNotification() {
    const banner = document.getElementById('lookus-notification');
    if (banner) {
        banner.classList.add('hidden');
    }
    if (lookusNotificationTimer) {
        clearTimeout(lookusNotificationTimer);
        lookusNotificationTimer = null;
    }
}

// Click handler: open LookUs app and navigate to report tab
window.handleLookusNotificationClick = function() {
    hideLookusNotification();

    // Open LookUs app
    const lookusApp = document.getElementById('lookus-app');
    if (lookusApp) {
        lookusApp.classList.remove('hidden');
        lookusApp.style.opacity = '1';
        lookusApp.style.transform = 'scale(1)';
    }

    // Switch to report tab
    setTimeout(() => {
        switchLookusTab('report');
    }, 100);
};

// Expose for external use
window.showLookusNotification = showLookusNotification;
window.hideLookusNotification = hideLookusNotification;

// 导出 UI 更新函数
window.updateLookusUi = function() {
    setupAmapSettings();
    if (window.iphoneSimState.amapSettings && window.iphoneSimState.amapSettings.key) {
        loadAmap();
        // 延迟渲染以确保状态已更新
        setTimeout(() => {
            renderLookusApp();
        }, 100);
    }
};

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(initLookusApp);
}
