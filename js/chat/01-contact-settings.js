// 聊天功能模块 (聊天, 联系人, AI, 语音)

// ====== AI 位置选择器数据 ======
const LOCATION_DATA = {
    "中国": {
        "北京市": ["东城区","西城区","朝阳区","丰台区","石景山区","海淀区","门头沟区","房山区","通州区","顺义区","昌平区","大兴区","怀柔区","平谷区","密云区","延庆区"],
        "上海市": ["黄浦区","徐汇区","长宁区","静安区","普陀区","虹口区","杨浦区","闵行区","宝山区","嘉定区","浦东新区","金山区","松江区","青浦区","奉贤区","崇明区"],
        "广东省": ["广州市","深圳市","珠海市","汕头市","佛山市","韶关市","湛江市","肇庆市","江门市","茂名市","惠州市","梅州市","汕尾市","河源市","阳江市","清远市","东莞市","中山市","潮州市","揭阳市","云浮市"],
        "浙江省": ["杭州市","宁波市","温州市","嘉兴市","湖州市","绍兴市","金华市","衢州市","舟山市","台州市","丽水市"],
        "江苏省": ["南京市","无锡市","徐州市","常州市","苏州市","南通市","连云港市","淮安市","盐城市","扬州市","镇江市","泰州市","宿迁市"],
        "四川省": ["成都市","自贡市","攀枝花市","泸州市","德阳市","绵阳市","广元市","遂宁市","内江市","乐山市","南充市","眉山市","宜宾市","广安市","达州市","雅安市","巴中市","资阳市"],
        "湖北省": ["武汉市","黄石市","十堰市","宜昌市","襄阳市","鄂州市","荆门市","孝感市","荆州市","黄冈市","咸宁市","随州市","恩施州"],
        "湖南省": ["长沙市","株洲市","湘潭市","衡阳市","邵阳市","岳阳市","常德市","张家界市","益阳市","郴州市","永州市","怀化市","娄底市","湘西州"],
        "河南省": ["郑州市","开封市","洛阳市","平顶山市","安阳市","鹤壁市","新乡市","焦作市","濮阳市","许昌市","漯河市","三门峡市","南阳市","商丘市","信阳市","周口市","驻马店市"],
        "河北省": ["石家庄市","唐山市","秦皇岛市","邯郸市","邢台市","保定市","张家口市","承德市","沧州市","廊坊市","衡水市"],
        "山东省": ["济南市","青岛市","淄博市","枣庄市","东营市","烟台市","潍坊市","济宁市","泰安市","威海市","日照市","临沂市","德州市","聊城市","滨州市","菏泽市"],
        "福建省": ["福州市","厦门市","莆田市","三明市","泉州市","漳州市","南平市","龙岩市","宁德市"],
        "天津市": ["和平区","河东区","河西区","南开区","河北区","红桥区","东丽区","西青区","津南区","北辰区","武清区","宝坻区","滨海新区","宁河区","静海区","蓟州区"],
        "重庆市": ["万州区","涪陵区","渝中区","大渡口区","江北区","沙坪坝区","九龙坡区","南岸区","北碚区","綦江区","大足区","渝北区","巴南区","黔江区","长寿区","江津区","合川区","永川区","南川区","璧山区","铜梁区","潼南区","荣昌区","开州区","梁平区","武隆区"],
        "辽宁省": ["沈阳市","大连市","鞍山市","抚顺市","本溪市","丹东市","锦州市","营口市","阜新市","辽阳市","盘锦市","铁岭市","朝阳市","葫芦岛市"],
        "吉林省": ["长春市","吉林市","四平市","辽源市","通化市","白山市","松原市","白城市","延边州"],
        "黑龙江省": ["哈尔滨市","齐齐哈尔市","鸡西市","鹤岗市","双鸭山市","大庆市","伊春市","佳木斯市","七台河市","牡丹江市","黑河市","绥化市","大兴安岭地区"],
        "安徽省": ["合肥市","芜湖市","蚌埠市","淮南市","马鞍山市","淮北市","铜陵市","安庆市","黄山市","滁州市","阜阳市","宿州市","六安市","亳州市","池州市","宣城市"],
        "江西省": ["南昌市","景德镇市","萍乡市","九江市","新余市","鹰潭市","赣州市","吉安市","宜春市","抚州市","上饶市"],
        "山西省": ["太原市","大同市","阳泉市","长治市","晋城市","朔州市","晋中市","运城市","忻州市","临汾市","吕梁市"],
        "陕西省": ["西安市","铜川市","宝鸡市","咸阳市","渭南市","延安市","汉中市","榆林市","安康市","商洛市"],
        "甘肃省": ["兰州市","嘉峪关市","金昌市","白银市","天水市","武威市","张掖市","平凉市","酒泉市","庆阳市","定西市","陇南市"],
        "云南省": ["昆明市","曲靖市","玉溪市","保山市","昭通市","丽江市","普洱市","临沧市","大理州","红河州","文山州","西双版纳州","楚雄州","德宏州","怒江州","迪庆州"],
        "贵州省": ["贵阳市","六盘水市","遵义市","安顺市","毕节市","铜仁市","黔西南州","黔东南州","黔南州"],
        "广西壮族自治区": ["南宁市","柳州市","桂林市","梧州市","北海市","防城港市","钦州市","贵港市","玉林市","百色市","贺州市","河池市","来宾市","崇左市"],
        "海南省": ["海口市","三亚市","三沙市","儋州市","五指山市","琼海市","文昌市","万宁市","东方市"],
        "内蒙古自治区": ["呼和浩特市","包头市","乌海市","赤峰市","通辽市","鄂尔多斯市","呼伦贝尔市","巴彦淖尔市","乌兰察布市"],
        "西藏自治区": ["拉萨市","日喀则市","昌都市","林芝市","山南市","那曲市","阿里地区"],
        "宁夏回族自治区": ["银川市","石嘴山市","吴忠市","固原市","中卫市"],
        "新疆维吾尔自治区": ["乌鲁木齐市","克拉玛依市","吐鲁番市","哈密市","喀什地区","和田地区","阿克苏地区","巴音郭楞州","昌吉州","伊犁州","塔城地区","阿勒泰地区"],
        "青海省": ["西宁市","海东市","海北州","黄南州","海南州","果洛州","玉树州","海西州"],
        "香港特别行政区": ["中西区","湾仔区","东区","南区","油尖旺区","深水埗区","九龙城区","黄大仙区","观塘区","葵青区","荃湾区","屯门区","元朗区","北区","大埔区","沙田区","西贡区","离岛区"],
        "澳门特别行政区": ["花地玛堂区","花王堂区","望德堂区","大堂区","风顺堂区","嘉模堂区","路凼填海区","圣方济各堂区"],
        "台湾省": ["台北市","新北市","桃园市","台中市","台南市","高雄市","基隆市","新竹市","嘉义市","新竹县","苗栗县","彰化县","南投县","云林县","嘉义县","屏东县","宜兰县","花莲县","台东县","澎湖县"]
    },
    "日本": {
        "关东地方": ["东京都","神奈川县","埼玉县","千叶县","茨城县","栃木县","群马县"],
        "关西地方": ["大阪府","京都府","奈良县","和歌山县","滋贺县","三重县"],
        "中部地方": ["爱知县","静冈县","新潟县","长野县","岐阜县","石川县","富山县","福井县","山梨县"],
        "北海道": ["札幌市","旭川市","函馆市","小樽市"],
        "东北地方": ["宫城县","福岛县","岩手县","山形县","秋田县","青森县"],
        "中国地方": ["广岛县","冈山县","山口县","岛根县","�的取县"],
        "四国地方": ["香川县","爱媛县","高知县","德岛县"],
        "九州地方": ["福冈县","熊本县","鹿儿岛县","大分县","宫崎县","长崎县","佐贺县","冲绳县"]
    },
    "美国": {
        "加利福尼亚州": ["洛杉矶","旧金山","圣地亚哥","圣何塞","萨克拉门托"],
        "纽约州": ["纽约市","布法罗","奥尔巴尼"],
        "德克萨斯州": ["休斯顿","达拉斯","圣安东尼奥","奥斯汀"],
        "伊利诺伊州": ["芝加哥","斯普林菲尔德"],
        "佛罗里达州": ["迈阿密","奥兰多","坦帕","杰克逊维尔"],
        "华盛顿州": ["西雅图","塔科马","斯波坎"],
        "马萨诸塞州": ["波士顿","剑桥","伍斯特"],
        "宾夕法尼亚州": ["费城","匹兹堡","哈里斯堡"]
    },
    "韩国": {
        "首都圈": ["首尔特别市","仁川广域市","京畿道"],
        "庆尚道": ["釜山广域市","大邱广域市","蔚山广域市","庆尚南道","庆尚北道"],
        "全罗道": ["光州广域市","全罗南道","全罗北道"],
        "忠清道": ["大田广域市","世宗特别自治市","忠清南道","忠清北道"],
        "江原道": ["春川市","江陵市","原州市"],
        "济州道": ["济州市","西归浦市"]
    },
    "英国": {
        "英格兰": ["伦敦","曼彻斯特","伯明翰","利物浦","利兹","布里斯托"],
        "苏格兰": ["爱丁堡","格拉斯哥","阿伯丁"],
        "威尔士": ["加的夫","斯旺西"],
        "北爱尔兰": ["贝尔法斯特","德里"]
    },
    "法国": {
        "法兰西岛": ["巴黎","凡尔赛"],
        "普罗旺斯-阿尔卑斯-蓝色海岸": ["马赛","尼斯","戛纳"],
        "奥弗涅-罗纳-阿尔卑斯": ["里昂","格勒诺布尔"],
        "新阿基坦": ["波尔多","利摩日"],
        "奥克西塔尼": ["图卢兹","蒙彼利埃"]
    },
    "德国": {
        "巴伐利亚州": ["慕尼黑","纽伦堡","奥格斯堡"],
        "北莱茵-威斯特法伦州": ["科隆","杜塞尔多夫","多特蒙德"],
        "柏林": ["柏林"],
        "汉堡": ["汉堡"],
        "黑森州": ["法兰克福","威斯巴登"],
        "巴登-符腾堡州": ["斯图加特","海德堡","弗莱堡"]
    },
    "澳大利亚": {
        "新南威尔士州": ["悉尼","纽卡斯尔","卧龙岗"],
        "维多利亚州": ["墨尔本","吉朗"],
        "昆士兰州": ["布里斯班","黄金海岸","凯恩斯"],
        "西澳大利亚州": ["珀斯"],
        "南澳大利亚州": ["阿德莱德"],
        "首都领地": ["堪培拉"]
    },
    "加拿大": {
        "安大略省": ["多伦多","渥太华","密西沙加"],
        "不列颠哥伦比亚省": ["温哥华","维多利亚"],
        "魁北克省": ["蒙特利尔","魁北克城"],
        "阿尔伯塔省": ["卡尔加里","埃德蒙顿"]
    },
    "俄罗斯": {
        "中央联邦管区": ["莫斯科"],
        "西北联邦管区": ["圣彼得堡"],
        "远东联邦管区": ["符拉迪沃斯托克","哈巴罗夫斯克"],
        "西伯利亚联邦管区": ["新西伯利亚","伊尔库茨克"]
    },
    "其他": {
        "其他": ["其他"]
    }
};

// 初始化位置选择器
function initLocationSelectors() {
    const countrySelect = document.getElementById('chat-setting-location-country');
    const provinceSelect = document.getElementById('chat-setting-location-province');
    const citySelect = document.getElementById('chat-setting-location-city');
    if (!countrySelect || !provinceSelect || !citySelect) return;

    // 填充国家
    countrySelect.innerHTML = '<option value="">选择国家</option>';
    Object.keys(LOCATION_DATA).forEach(country => {
        const opt = document.createElement('option');
        opt.value = country;
        opt.textContent = country;
        countrySelect.appendChild(opt);
    });

    // 国家变化 -> 更新省份
    countrySelect.onchange = function() {
        const country = this.value;
        provinceSelect.innerHTML = '<option value="">选择省/州</option>';
        citySelect.innerHTML = '<option value="">选择城市</option>';
        provinceSelect.disabled = true;
        citySelect.disabled = true;
        if (country && LOCATION_DATA[country]) {
            Object.keys(LOCATION_DATA[country]).forEach(province => {
                const opt = document.createElement('option');
                opt.value = province;
                opt.textContent = province;
                provinceSelect.appendChild(opt);
            });
            provinceSelect.disabled = false;
        }
    };

    // 省份变化 -> 更新城市
    provinceSelect.onchange = function() {
        const country = countrySelect.value;
        const province = this.value;
        citySelect.innerHTML = '<option value="">选择城市</option>';
        citySelect.disabled = true;
        if (country && province && LOCATION_DATA[country] && LOCATION_DATA[country][province]) {
            LOCATION_DATA[country][province].forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.textContent = city;
                citySelect.appendChild(opt);
            });
            citySelect.disabled = false;
        }
    };
}

// 加载联系人位置到选择器
function loadLocationToSelectors(contact) {
    const countrySelect = document.getElementById('chat-setting-location-country');
    const provinceSelect = document.getElementById('chat-setting-location-province');
    const citySelect = document.getElementById('chat-setting-location-city');
    if (!countrySelect || !provinceSelect || !citySelect) return;

    initLocationSelectors();

    const loc = contact.location || {};
    if (loc.country) {
        countrySelect.value = loc.country;
        countrySelect.onchange(); // trigger province populate
        if (loc.province) {
            provinceSelect.value = loc.province;
            provinceSelect.onchange(); // trigger city populate
            if (loc.city) {
                citySelect.value = loc.city;
            }
        }
    }
}

// 从选择器获取位置数据
function getLocationFromSelectors() {
    const country = document.getElementById('chat-setting-location-country')?.value || '';
    const province = document.getElementById('chat-setting-location-province')?.value || '';
    const city = document.getElementById('chat-setting-location-city')?.value || '';
    if (!country && !province && !city) return null;
    return { country, province, city };
}

// 语音相关全局变量
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let recordedDuration = 0;
let recordingStartTime = 0;
let recordedText = '';
let recordedAudio = null;

// 分页加载相关变量
let currentChatRenderLimit = 0;
let lastChatContactId = null;

// 语音通话 VAD 相关变量
let voiceCallAudioContext = null;
let voiceCallAnalyser = null;
let voiceCallMicrophone = null;
let voiceCallScriptProcessor = null;
let voiceCallMediaRecorder = null;
let voiceCallChunks = [];
let voiceCallIsSpeaking = false;
let voiceCallSilenceStart = 0;
let voiceCallVadInterval = null;
let voiceCallIsRecording = false;
let voiceCallStream = null;
let globalVoicePlayer = null;
let isAiSpeaking = false;
let isProcessingResponse = false; // 新增：标记是否正在处理AI回复

let voiceCallTimer = null;
let voiceCallSeconds = 0;
let currentVoiceCallStartTime = 0;
let voiceCallStartIndex = 0;

let currentVoiceAudio = null;
let currentVoiceMsgId = null;
let currentVoiceIcon = null;

// 视频通话相关变量
let videoCallLocalStream = null;
let videoCallTimer = null;
let videoCallSeconds = 0;
let currentVideoCallStartTime = 0;
let pendingVideoSnapshot = null; // 暂存的视频截图
let autoSnapshotTimer = null; // 自动截图定时器

// --- 消息通知功能 ---

let currentNotificationTimeout = null;
let currentNotificationContactId = null;
let currentNotificationOnClick = null;

window.showChatNotification = function(contactId, content, options) {
    let contact = null;
    options = options || {};
    
    // Support passing object directly
    if (typeof contactId === 'object' && contactId !== null) {
        contact = contactId;
    } else {
        contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
        
        // If not found in contacts, check friend requests
        if (!contact && window.iphoneSimState.wechatFriendRequests) {
            const req = window.iphoneSimState.wechatFriendRequests.find(r => r.id === contactId);
            if (req) {
                contact = {
                    id: req.id,
                    name: req.name,
                    avatar: req.avatar,
                    isRequest: true,
                    remark: '',
                    nickname: req.name
                };
            }
        }
    }

    if (!contact) return;

    const banner = document.getElementById('chat-notification');
    const avatar = document.getElementById('chat-notification-avatar');
    const title = document.getElementById('chat-notification-title');
    const message = document.getElementById('chat-notification-message');

    if (!banner || !avatar || !title || !message) return;

    // 清除旧的定时器
    if (currentNotificationTimeout) {
        clearTimeout(currentNotificationTimeout);
        currentNotificationTimeout = null;
    }

    // 设置内容
    currentNotificationContactId = contactId;
    // store custom click callback for system notification and banner
    currentNotificationOnClick = options.onClick || null;
    avatar.src = contact.avatar;
    title.textContent = contact.remark || contact.nickname || contact.name;
    
    // 处理不同类型的消息预览
    let previewText = content;
    if (content.startsWith('[图片]') || content.startsWith('<img')) previewText = '[图片]';
    else if (content.startsWith('[表情包]') || content.startsWith('<img') && content.includes('sticker')) previewText = '[表情包]';
    else if (content.startsWith('[语音]')) previewText = '[语音]';
    else if (content.startsWith('[转账]')) previewText = '[转账]';
    else if (content.startsWith('[亲属卡]')) previewText = '[亲属卡]';
    else if (content.includes('pay_request')) previewText = '[代付请求]';
    else if (content.includes('shopping_gift')) previewText = '[礼物]';
    else if (content.includes('savings_invite')) previewText = '[共同存钱邀请]';
    else if (content.includes('savings_withdraw_request')) previewText = '[共同存钱转出申请]';
    else if (content.includes('savings_progress')) previewText = '[共同存钱进度]';
    else if (content.includes('delivery_share')) previewText = '[外卖]';
    
    // 如果内容包含HTML标签（如图片），尝试提取文本或显示类型
    if (previewText.includes('<') && previewText.includes('>')) {
        const div = document.createElement('div');
        div.innerHTML = previewText;
        previewText = div.textContent || '[富文本消息]';
    }
    
    message.textContent = previewText;

    // 显示横幅
    banner.classList.remove('hidden');

    // 点击横幅时如果提供了自定义回调则调用，否则调用默认处理
    banner.onclick = function(e) {
        if (currentNotificationOnClick && typeof currentNotificationOnClick === 'function') {
            try { currentNotificationOnClick(); } catch(err) { console.error(err); }
            currentNotificationOnClick = null;
        } else {
            window.handleNotificationClick();
        }
    };

    // 播放提示音 (可选)
    // const audio = new Audio('path/to/notification.mp3');
    // audio.play().catch(e => {});

    // 3秒后自动隐藏
    currentNotificationTimeout = setTimeout(() => {
        banner.classList.add('hidden');
        currentNotificationTimeout = null;
        currentNotificationOnClick = null;
    }, 3000);

    // 尝试发送系统通知（可通过 options.skipSystem 关闭）
    if (!options.skipSystem) sendSystemNotification(contact, previewText);
};

window.sendSystemNotification = function(contact, content) {
    if (window.iphoneSimState.enableSystemNotifications && "Notification" in window && Notification.permission === "granted") {
        try {
            const displayName = contact.remark || contact.nickname || contact.name;
            const n = new Notification(displayName, {
                body: content,
                icon: contact.avatar,
                tag: 'chat-msg-' + contact.id
            });
            n.onclick = function() {
                window.focus();
                this.close();
                // 模拟点击应用内通知的行为
                window.handleNotificationClick(); 
            };
        } catch(e) {
            console.error('System notification failed', e);
        }
    }
};

window.handleNotificationClick = function(e) {
    if (e && e.stopPropagation) e.stopPropagation();
    
    const banner = document.getElementById('chat-notification');
    if (banner) banner.classList.add('hidden');
    // 如果有自定义回调，优先调用并返回（例如跳转到直播间）
    if (currentNotificationOnClick && typeof currentNotificationOnClick === 'function') {
        try { currentNotificationOnClick(); } catch(err) { console.error(err); }
        currentNotificationOnClick = null;
        return;
    }

    if (currentNotificationContactId) {
        // 如果当前不在聊天界面或在其他应用，先关闭其他层级
        document.querySelectorAll('.app-screen, .sub-screen').forEach(el => {
            if (el.id !== 'chat-screen' && el.id !== 'wechat-app') {
                el.classList.add('hidden');
            }
        });
        
        // 打开微信
        document.getElementById('wechat-app').classList.remove('hidden');
        
        // 切换到联系人 Tab (通常聊天从这里进入，或者是直接覆盖)
        let targetId = currentNotificationContactId;
        let isRequest = false;

        if (typeof currentNotificationContactId === 'object') {
            targetId = currentNotificationContactId.id;
            isRequest = currentNotificationContactId.isRequest;
        } else {
             // Check if it matches a request ID
             if (window.iphoneSimState.wechatFriendRequests) {
                isRequest = window.iphoneSimState.wechatFriendRequests.some(r => r.id === targetId);
             }
        }

        if (isRequest) {
            if (window.openNewFriendsScreen) {
                window.openNewFriendsScreen();
            }
        } else {
            openChat(targetId);
        }
    }
};

// --- 联系人功能 ---

function clampThoughtPetSizeSetting(rawSize) {
    const size = Number(rawSize);
    if (!Number.isFinite(size)) return 88;
    return Math.max(52, Math.min(140, Math.round(size)));
}

function normalizeThoughtPetPositionSetting(pos) {
    const fallback = { xRatio: 0.86, yRatio: 0.72 };
    if (!pos || typeof pos !== 'object') return { ...fallback };
    const x = Number(pos.xRatio);
    const y = Number(pos.yRatio);
    return {
        xRatio: Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : fallback.xRatio,
        yRatio: Number.isFinite(y) ? Math.max(0, Math.min(1, y)) : fallback.yRatio
    };
}

function getDefaultThoughtPetImageData() {
    if (window.DEFAULT_THOUGHT_PET_IMAGE) return window.DEFAULT_THOUGHT_PET_IMAGE;
    const fallbackSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" fill="none">
  <ellipse cx="82" cy="142" rx="36" ry="10" fill="rgba(0,0,0,0.15)"/>
  <path d="M32 56c0-18 14-32 32-32h34c18 0 32 14 32 32v44c0 22-18 40-40 40H70c-22 0-40-18-40-40V56z" fill="#fff5df" stroke="#2a2a2a" stroke-width="4"/>
  <path d="M54 28l12 18-20 2 8-20zM108 28l-8 20-20-2 12-18z" fill="#fff5df" stroke="#2a2a2a" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="65" cy="76" r="6" fill="#2a2a2a"/>
  <circle cx="95" cy="76" r="6" fill="#2a2a2a"/>
  <path d="M73 92c3 4 11 4 14 0" stroke="#2a2a2a" stroke-width="4" stroke-linecap="round"/>
  <circle cx="54" cy="92" r="6" fill="#ffb7b7" fill-opacity="0.65"/>
  <circle cx="106" cy="92" r="6" fill="#ffb7b7" fill-opacity="0.65"/>
</svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(fallbackSvg)}`;
}

function compressImagePreserveAlpha(file, maxEdge = 512, quality = 0.85) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const ratio = Math.min(1, maxEdge / Math.max(img.width, img.height));
                    const width = Math.max(1, Math.round(img.width * ratio));
                    const height = Math.max(1, Math.round(img.height * ratio));
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Canvas context unavailable'));
                        return;
                    }
                    ctx.clearRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    let output = canvas.toDataURL('image/webp', quality);
                    if (!output || typeof output !== 'string' || !output.startsWith('data:image')) {
                        output = canvas.toDataURL('image/png');
                    }
                    resolve(output);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = (err) => reject(err);
            img.src = event.target.result;
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}

function handleSaveContact() {
    const name = document.getElementById('contact-name').value;
    const remark = document.getElementById('contact-remark').value;
    const persona = document.getElementById('contact-persona').value;
    const avatarInput = document.getElementById('contact-avatar-upload');
    
    if (!name) {
        alert('请输入姓名');
        return;
    }

    const contact = {
        id: Date.now(),
        name,
        nickname: name,
        remark,
        persona,
        style: '正常',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + name,
        activeReplyEnabled: false,
        activeReplyInterval: 60,
        autoItineraryEnabled: false,
        autoItineraryInterval: 10,
        messagesSinceLastItinerary: 0,
        lastItineraryIndex: 0,
        userPerception: [],
        thoughtDisplayMode: 'title',
        thoughtPetImage: '',
        thoughtPetSize: 88,
        thoughtPetPosition: { xRatio: 0.86, yRatio: 0.72 },
        linkedWbCategories: [],
        linkedStickerCategories: []
    };

    if (avatarInput.files && avatarInput.files[0]) {
        compressImage(avatarInput.files[0], 300, 0.7).then(base64 => {
            contact.avatar = base64;
            saveContactAndClose(contact);
        }).catch(err => {
            console.error('图片压缩失败', err);
            saveContactAndClose(contact);
        });
    } else {
        saveContactAndClose(contact);
    }
}

function saveContactAndClose(contact) {
    window.iphoneSimState.contacts.push(contact);
    saveConfig();
    renderContactList(window.iphoneSimState.currentContactGroup || 'all');
    
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-remark').value = '';
    document.getElementById('contact-persona').value = '';
    document.getElementById('contact-avatar-upload').value = '';
    const preview = document.getElementById('contact-avatar-preview');
    if (preview) {
        preview.innerHTML = '<i class="fas fa-camera"></i>';
    }
    
    document.getElementById('add-contact-modal').classList.add('hidden');
    openChat(contact.id);
}

window.togglePinContact = function(contactId, event) {
    if (event) event.stopPropagation();
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (contact) {
        contact.isPinned = !contact.isPinned;
        saveConfig();
        renderContactList(window.iphoneSimState.currentContactGroup || 'all');
    }
};

window.deleteContact = function(contactId, event) {
    if (event) event.stopPropagation();
    if (confirm('确定要删除这位联系人吗？聊天记录也会被删除。')) {
        window.iphoneSimState.contacts = window.iphoneSimState.contacts.filter(c => c.id !== contactId);
        delete window.iphoneSimState.chatHistory[contactId];
        delete window.iphoneSimState.itineraries[contactId];
        saveConfig();
        renderContactList(window.iphoneSimState.currentContactGroup || 'all');
    }
};

function isHiddenForumWechatSyncText(text) {
    if (!text || typeof text !== 'string') return false;
    const hiddenPrefixes = [
        '[评论了你的动态: "',
        '[发布了动态]:',
        '[发布了论坛帖子]:',
        '[论坛自动评论]:',
        '[论坛评论回复]:',
        '[开始直播]:',
        '[回复了你的帖子评论]:',
        '[评论了你的帖子]:',
        '[直播间弹幕]:',
        '[直播间互动]:',
        '[直播间送礼]:',
        '[直播间私信]',
        '[直播间画面]:',
        '[PK模式]',
        '[PK阶段]',
        '[PK评论]',
        '[PK送礼]',
        '[PK送礼汇总]',
        '[PK邀请',
        '[PK结算]',
        '[PK输入]',
        '[PK画面]',
        '[直播连线总结]'
    ];
    return hiddenPrefixes.some(prefix => text.startsWith(prefix));
}

function shouldHideChatSyncMsg(msg) {
    if (!msg) return false;
    if (msg.type === 'system_event' || msg.type === 'live_sync_hidden' || msg.type === 'family_card_spend_notice_hidden') return true;
    if (msg.type === 'text' && typeof msg.content === 'string' && isHiddenForumWechatSyncText(msg.content)) return true;
    return false;
}

function shouldExcludeFromAiContext(msg) {
    if (!msg) return false;
    if (msg.type === 'system_event') return true;
    if (msg.type === 'text' && typeof msg.content === 'string' && isHiddenForumWechatSyncText(msg.content)) return true;
    return false;
}

function normalizeChatSettingsListRows() {
    const screen = document.getElementById('chat-settings-screen');
    if (!screen) return;

    const rows = screen.querySelectorAll('.list-item:not(.no-padding)');
    rows.forEach(row => {
        row.style.paddingTop = '12px';
        row.style.paddingBottom = '12px';
        row.style.boxSizing = 'border-box';
        row.style.alignItems = 'center';
    });

    const textNodes = screen.querySelectorAll(
        '.list-item .list-content > span, .list-item .list-content > label:not(.toggle-switch), .list-item .ios-btn'
    );
    textNodes.forEach(node => {
        node.style.marginTop = '0';
        node.style.marginBottom = '0';
        node.style.lineHeight = '1.2';
    });

    const controls = screen.querySelectorAll('.list-item .list-content > input, .list-item .list-content > select, .list-item .list-content > textarea');
    controls.forEach(node => {
        node.style.marginTop = '0';
        node.style.marginBottom = '0';
    });
}

const CONTACT_PREVIEW_MAX_LENGTH = 28;

function isLikelyHtmlPayload(content) {
    if (typeof content !== 'string') return false;
    const source = content.toLowerCase();
    const htmlMarkers = [
        '<!doctype html',
        '<html',
        '<head',
        '<body',
        '<style',
        '</html>',
        '&lt;!doctype html',
        '&lt;html',
        '&lt;head',
        '&lt;body',
        '&lt;style',
        '&lt;/html&gt;'
    ];
    return htmlMarkers.some(marker => source.includes(marker));
}

function decodeHtmlEntities(content) {
    if (typeof content !== 'string' || !content) return '';
    const textarea = document.createElement('textarea');
    textarea.innerHTML = content;
    return textarea.value;
}

function extractHtmlTitle(content) {
    if (typeof content !== 'string') return '';
    const decoded = decodeHtmlEntities(content);
    const match = decoded.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
    if (!match || !match[1]) return '';
    return stripHtmlToText(match[1]);
}

function stripHtmlToText(content) {
    if (typeof content !== 'string') return '';
    const decoded = decodeHtmlEntities(content);
    if (!decoded.includes('<') || !decoded.includes('>')) {
        return decoded.replace(/\s+/g, ' ').trim();
    }

    const div = document.createElement('div');
    div.innerHTML = decoded;
    return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
}

function truncatePreview(text, maxLen = CONTACT_PREVIEW_MAX_LENGTH) {
    if (typeof text !== 'string') return '';
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    if (normalized.length <= maxLen) return normalized;
    if (maxLen <= 1) return '…';
    return `${normalized.slice(0, maxLen - 1)}…`;
}

function formatLastMsgPreview(lastMsg) {
    if (!lastMsg || typeof lastMsg !== 'object') return '[消息]';

    if (lastMsg.type === 'image') return '[图片]';
    if (lastMsg.type === 'sticker') return '[表情包]';
    if (lastMsg.type === 'transfer') return '[转账]';
    if (lastMsg.type === 'family_card') return '[亲属卡]';
    if (lastMsg.type === 'voice') return '[语音]';
    if (lastMsg.type === 'gift_card') return '[礼物]';
    if (lastMsg.type === 'shopping_gift') return '[礼物]';
    if (lastMsg.type === 'pay_request') return '[代付请求]';
    if (lastMsg.type === 'delivery_share') return '[外卖]';
    if (lastMsg.type === 'savings_invite') return '[共同存钱邀请]';
    if (lastMsg.type === 'savings_withdraw_request') return '[共同存钱转出申请]';
    if (lastMsg.type === 'savings_progress') return '[共同存钱进度]';
    if (lastMsg.type === 'voice_call_text') return '[通话]';

    if (lastMsg.type === 'text' || lastMsg.type === 'html') {
        const content = typeof lastMsg.content === 'string' ? lastMsg.content : '';
        if (!content.trim()) return '[消息]';

        if (isLikelyHtmlPayload(content)) {
            const title = extractHtmlTitle(content);
            if (title) return truncatePreview(`[HTML] ${title}`);
            return '[HTML消息]';
        }

        const plainText = stripHtmlToText(content);
        return truncatePreview(plainText || '[消息]');
    }

    const fallback = stripHtmlToText(typeof lastMsg.content === 'string' ? lastMsg.content : '');
    return truncatePreview(fallback || '[消息]');
}

function renderContactList(filterGroup = 'all') {
    const isSwitchingGroup = window.iphoneSimState.currentContactGroup !== filterGroup;
    window.iphoneSimState.currentContactGroup = filterGroup;

    const tabsContainer = document.getElementById('contacts-group-tabs');
    if (tabsContainer) {
        tabsContainer.innerHTML = '';
        
        const allTab = document.createElement('div');
        allTab.className = `group-tab ${filterGroup === 'all' ? 'active' : ''}`;
        allTab.textContent = 'News';
        allTab.onclick = () => renderContactList('all');
        tabsContainer.appendChild(allTab);

        if (window.iphoneSimState.contactGroups) {
            window.iphoneSimState.contactGroups.forEach(group => {
                const tab = document.createElement('div');
                tab.className = `group-tab ${filterGroup === group ? 'active' : ''}`;
                tab.textContent = group;
                tab.onclick = () => renderContactList(group);
                tabsContainer.appendChild(tab);
            });
        }
    }

    const list = document.getElementById('contact-list');
    if (!list) return;

    const renderContent = () => {
        list.innerHTML = '';
        
        let filteredContacts = [...window.iphoneSimState.contacts]; // Create a copy
        if (filterGroup !== 'all') {
            filteredContacts = filteredContacts.filter(c => c.group === filterGroup);
        }

        // Sorting: Pinned first, then by last message time
        filteredContacts.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            
            const getLastTime = (c) => {
                const history = window.iphoneSimState.chatHistory[c.id];
                if (history && history.length > 0) {
                    for (let i = history.length - 1; i >= 0; i--) {
                        const msg = history[i];
                        if (shouldHideChatSyncMsg(msg)) continue;
                        return msg.time || 0;
                    }
                }
                return 0;
            };
            
            return getLastTime(b) - getLastTime(a);
        });

        if (filteredContacts.length === 0) {
            list.innerHTML = '<div class="empty-state">暂无联系人</div>';
            return;
        }
        
        filteredContacts.forEach(contact => {
            const item = document.createElement('div');
            item.className = `contact-item ${contact.isPinned ? 'pinned' : ''}`;
            
            let lastMsgText = '';
            let lastMsgTime = '';
            let unreadCount = 0;

            const history = window.iphoneSimState.chatHistory[contact.id];
            if (history && history.length > 0) {
                let lastMsg = null;
                for (let i = history.length - 1; i >= 0; i--) {
                    const msg = history[i];
                    if (shouldHideChatSyncMsg(msg)) continue;
                    lastMsg = msg;
                    break;
                }
                lastMsgText = formatLastMsgPreview(lastMsg);

                if (lastMsg && lastMsg.time) {
                    const date = new Date(lastMsg.time);
                    lastMsgTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                }
            }

            if (!lastMsgText) lastMsgText = '[消息]';

            if (!lastMsgTime) {
                const now = new Date();
                lastMsgTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            }

            const name = contact.remark || contact.nickname || contact.name;

            item.innerHTML = `
                <div class="contact-actions">
                    <button class="action-btn contact-pin-btn" onclick="event.stopPropagation(); window.togglePinContact(${contact.id}, event)">${contact.isPinned ? '取消置顶' : '置顶'}</button>
                    <button class="action-btn contact-delete-btn" onclick="event.stopPropagation(); window.deleteContact(${contact.id}, event)">删除</button>
                </div>
                <div class="contact-content-wrapper">
                    <img src="${contact.avatar}" class="contact-avatar">
                    <div class="contact-info">
                        <div class="contact-header-row">
                            <span class="contact-name">${name}</span>
                            <span class="contact-time">${lastMsgTime}</span>
                        </div>
                        <div class="contact-msg-row">
                            <span class="contact-msg-preview"></span>
                            ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;

            // Touch events for swipe
            const contentWrapper = item.querySelector('.contact-content-wrapper');
            const avatarEl = item.querySelector('.contact-avatar');
            const nameEl = item.querySelector('.contact-name');
            const timeEl = item.querySelector('.contact-time');
            const previewEl = item.querySelector('.contact-msg-preview');

            if (contentWrapper) {
                contentWrapper.style.paddingTop = '12px';
                contentWrapper.style.paddingBottom = '12px';
                contentWrapper.style.boxSizing = 'border-box';
                contentWrapper.style.minHeight = '80px';
            }
            if (avatarEl) avatarEl.style.display = 'block';
            [nameEl, timeEl, previewEl].forEach(el => {
                if (!el) return;
                el.style.marginTop = '0';
                el.style.marginBottom = '0';
                el.style.lineHeight = '1.2';
            });
            if (previewEl) previewEl.textContent = lastMsgText;

            let startX = 0;
            let startY = 0;
            let currentTranslate = 0;
            let isDragging = false;
            let isScrolling = undefined;
            const maxSwipe = 160;

            contentWrapper.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                
                // Close other opened items
                document.querySelectorAll('.contact-content-wrapper').forEach(el => {
                    if (el !== contentWrapper) {
                        el.style.transform = 'translateX(0)';
                    }
                });

                const style = contentWrapper.style.transform;
                if (style && style.includes('translateX')) {
                     const match = style.match(/translateX\(([-\d.]+)px\)/);
                     if (match) currentTranslate = parseFloat(match[1]);
                } else {
                    currentTranslate = 0;
                }
                
                contentWrapper.style.transition = 'none';
                isDragging = true;
                isScrolling = undefined;
            }, { passive: true });

            contentWrapper.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                
                const currentX = e.touches[0].clientX;
                const currentY = e.touches[0].clientY;
                const deltaX = currentX - startX;
                const deltaY = currentY - startY;

                if (typeof isScrolling === 'undefined') {
                    isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
                }

                if (isScrolling) {
                    isDragging = false;
                    return;
                }

                e.preventDefault();
                
                let newTranslate = currentTranslate + deltaX;
                
                if (newTranslate > 0) newTranslate = 0;
                if (newTranslate < -maxSwipe) newTranslate = -maxSwipe; // Elastic limit can be added if desired
                
                contentWrapper.style.transform = `translateX(${newTranslate}px)`;
            }, { passive: false });

            contentWrapper.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                isDragging = false;
                contentWrapper.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
                
                const style = contentWrapper.style.transform;
                let currentPos = 0;
                if (style && style.includes('translateX')) {
                     const match = style.match(/translateX\(([-\d.]+)px\)/);
                     if (match) currentPos = parseFloat(match[1]);
                }

                if (currentPos < -60) { // Threshold to snap open
                    contentWrapper.style.transform = `translateX(-${maxSwipe}px)`;
                } else {
                    contentWrapper.style.transform = 'translateX(0)';
                }
            });

            item.addEventListener('click', (e) => {
                const style = contentWrapper.style.transform;
                // If open (translated), close it
                if (style && style.includes('translateX') && !style.includes('translateX(0px)') && !style.includes('translateX(0)')) {
                     contentWrapper.style.transform = 'translateX(0)';
                     return;
                }
                openChat(contact.id);
            });

            list.appendChild(item);
        });
    };

    if (isSwitchingGroup) {
        list.classList.add('fade-out');
        setTimeout(() => {
            renderContent();
            list.classList.remove('fade-out');
        }, 150);
    } else {
        renderContent();
    }
}

function applyChatDisplayPreferences(contactOrId = null) {
    const chatScreen = document.getElementById('chat-screen');
    if (!chatScreen) return;

    let contact = null;
    if (contactOrId && typeof contactOrId === 'object') {
        contact = contactOrId;
    } else {
        const targetId = contactOrId || window.iphoneSimState.currentChatContactId;
        if (targetId !== undefined && targetId !== null) {
            contact = (window.iphoneSimState.contacts || []).find(c => c.id === targetId);
        }
    }

    // New per-side avatar visibility with backward compatibility for legacy showAvatar.
    let avatarVisibility = 'show-both';
    if (contact) {
        if (typeof contact.avatarVisibility === 'string' && contact.avatarVisibility) {
            avatarVisibility = contact.avatarVisibility;
        } else if (contact.showAvatar === false) {
            avatarVisibility = 'hide-both';
        }
    }
    const showTimestamp = contact ? (contact.showTimestamp !== false) : true;

    const hideOtherAvatar = avatarVisibility === 'hide-other' || avatarVisibility === 'hide-both';
    const hideSelfAvatar = avatarVisibility === 'hide-self' || avatarVisibility === 'hide-both';

    // Keep legacy class for compatibility with any existing custom CSS rules.
    chatScreen.classList.toggle('hide-chat-avatar', hideOtherAvatar && hideSelfAvatar);
    chatScreen.classList.toggle('hide-chat-avatar-other', hideOtherAvatar);
    chatScreen.classList.toggle('hide-chat-avatar-self', hideSelfAvatar);
    chatScreen.classList.toggle('hide-chat-timestamp', !showTimestamp);
}

window.applyChatDisplayPreferences = applyChatDisplayPreferences;

function openChat(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    if (window.iphoneSimState.isMultiSelectMode) {
        exitMultiSelectMode();
    }

    if (typeof window.hideThoughtOverlays === 'function') {
        window.hideThoughtOverlays();
    }
    const thoughtPetEl = document.getElementById('thought-pet');
    if (thoughtPetEl) thoughtPetEl.classList.add('hidden');

    window.iphoneSimState.currentChatContactId = contactId;
    document.getElementById('chat-title').textContent = contact.remark || contact.nickname || contact.name;
    
    const chatScreen = document.getElementById('chat-screen');
    if (contact.chatBg) {
        chatScreen.style.backgroundImage = `url(${contact.chatBg})`;
        chatScreen.style.backgroundSize = 'cover';
        chatScreen.style.backgroundPosition = 'center';
    } else {
        chatScreen.style.backgroundImage = '';
    }

    const existingStyle = document.getElementById('chat-custom-css');
    if (existingStyle) existingStyle.remove();

    if (contact.customCss) {
        const style = document.createElement('style');
        style.id = 'chat-custom-css';
        // Scope CSS to chat screen to prevent affecting settings page
        style.textContent = `#chat-screen#chat-screen#chat-screen { ${contact.customCss} }`;
        document.head.appendChild(style);
    }

    // 应用字体大小
    const chatBody = document.getElementById('chat-messages');
    if (chatBody) {
        chatBody.style.fontSize = (contact.chatFontSize || 16) + 'px';
    }

    applyChatDisplayPreferences(contact);
    
    chatScreen.classList.remove('hidden');
    
    renderChatHistory(contactId);
}

// --- 资料卡功能 ---

window.openAiProfile = async function() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    if (!contact.initializedProfile) {
        await generateInitialProfile(contact);
    }

    renderAiProfile(contact);
    document.getElementById('ai-profile-screen').classList.remove('hidden');
}

async function generateInitialProfile(contact) {
    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings;
    if (!settings.url || !settings.key) return;

    document.getElementById('ai-profile-name').textContent = '正在生成资料...';
    document.getElementById('ai-profile-screen').classList.remove('hidden');

    try {
        const systemPrompt = `你是一个资料卡生成助手。请为角色 "${contact.name}" (人设: ${contact.persona || '无'}) 生成微信资料卡 JSON。
严禁输出 Markdown 代码块 (如 \`\`\`json)，严禁输出任何解释性文字。
只输出纯 JSON 字符串，格式如下：
{"nickname": "网名", "wxid": "微信号", "signature": "签名"}
确保 JSON 格式合法且完整。`;

        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
        
        // 封装请求函数，支持重试和不同的参数
        const callAiApi = async (useJsonFormat) => {
            const body = {
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: '请生成 JSON 数据' }
                ],
                temperature: 0.7
            };
            
            if (useJsonFormat) {
                body.response_format = { type: "json_object" };
            }

            console.log(`[GenerateProfile] Requesting (JSON_Format: ${useJsonFormat})...`);
            
            const res = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${cleanKey}`
                },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.choices[0].message.content;
        };

        let content = '';
        try {
            // 第一次尝试：带 response_format (如果支持)
            content = await callAiApi(true);
            
            // 检查内容有效性，如果无效则抛出错误以触发重试
            if (!content || content.trim() === '```' || content.trim().length < 5) {
                throw new Error('Response content is empty or invalid');
            }
        } catch (e) {
            console.warn('[GenerateProfile] First attempt failed/invalid, retrying without json_object...', e);
            // 第二次尝试：不带 response_format (兼容性更好)
            try {
                content = await callAiApi(false);
            } catch (e2) {
                console.error('[GenerateProfile] Second attempt failed', e2);
            }
        }

        console.log('[GenerateProfile] Raw AI response:', content);
        
        // 如果响应为空，或只是 markdown 标记，手动处理
        if (!content || content.trim() === '```') {
            console.warn('[GenerateProfile] Empty or invalid response received');
            content = ''; // Reset to empty string to trigger fallback logic
        }

        // 智能提取 JSON 内容（处理 Markdown、嵌套括号、字符串干扰）
        const extractJson = (str) => {
            if (!str) return '';
            // 预处理：移除 markdown 代码块标记
            str = str.replace(/```json/gi, '').replace(/```/g, '').trim();
            
            // 尝试找到第一个 { 或 [
            const firstBrace = str.indexOf('{');
            const firstBracket = str.indexOf('[');
            
            let startIndex = -1;
            if (firstBrace === -1 && firstBracket === -1) return str;
            
            if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                startIndex = firstBrace;
            } else {
                startIndex = firstBracket;
            }
            
            // 尝试找到最后一个 } 或 ]
            const lastBrace = str.lastIndexOf('}');
            const lastBracket = str.lastIndexOf(']');
            
            let endIndex = -1;
            if (lastBrace > startIndex) endIndex = lastBrace;
            if (lastBracket > startIndex && lastBracket > endIndex) endIndex = lastBracket;
            
            if (startIndex !== -1 && endIndex !== -1) {
                return str.substring(startIndex, endIndex + 1);
            }
            
            // 如果只找到了开始，没找到结束（截断），返回剩余部分尝试修复
            if (startIndex !== -1) return str.substring(startIndex);
            
            return str;
        };

        let jsonContent = extractJson(content);
        console.log('[GenerateProfile] Extracted JSON content:', jsonContent);
        
        let profile = null;

        if (jsonContent) {
            try {
                profile = JSON.parse(jsonContent);
                if (Array.isArray(profile) && profile.length > 0) {
                    profile = profile[0];
                }
            } catch (e) {
                console.warn('[GenerateProfile] JSON Parse failed, trying fix...', e);
                if (jsonContent.trim().startsWith('{') && !jsonContent.trim().endsWith('}')) {
                     try { profile = JSON.parse(jsonContent + '}'); } catch(e2) {}
                }
            }
        }

        // 正则提取 Fallback
        if (!profile && content) {
            profile = {};
            const extractField = (keys) => {
                for (const key of keys) {
                    let regex = new RegExp(`["']${key}["']\\s*[:：]\\s*["']((?:[^"']|\\\\.)*)["']`, 'i');
                    let match = content.match(regex);
                    if (match) return match[1];
                    
                    regex = new RegExp(`${key}\\s*[:：]\\s*["']((?:[^"']|\\\\.)*)["']`, 'i');
                    match = content.match(regex);
                    if (match) return match[1];

                    regex = new RegExp(`${key}\\s*[:：]\\s*([^"'\n,{}]+)`, 'i');
                    match = content.match(regex);
                    if (match) return match[1].trim();
                }
                return null;
            };
            profile.nickname = extractField(['nickname', '网名', 'name']);
            profile.wxid = extractField(['wxid', '微信号', 'id']);
            profile.signature = extractField(['signature', '签名', 'sign']);
            
            // Check if profile is empty
            if (!profile.nickname && !profile.wxid && !profile.signature) {
                profile = null;
            }
        }

        // 终极 Fallback：本地生成 (Satisfies "Must generate it out")
        if (!profile) {
            console.warn('[GenerateProfile] All parsing failed. Using local generation.');
            const randomId = Math.random().toString(36).substring(2, 8);
            profile = {
                nickname: contact.name, // 默认使用名字
                wxid: `wxid_${randomId}`,
                signature: `你好，我是${contact.name}`
            };
        }

        console.log('[GenerateProfile] Final parsed profile:', profile);

        if (profile) {
            if (profile.nickname) contact.nickname = profile.nickname;
            if (profile.wxid) contact.wxid = profile.wxid;
            if (profile.signature) contact.signature = profile.signature;
            
            // 强制刷新 UI
            document.getElementById('ai-profile-name').textContent = contact.nickname || contact.name;
            document.getElementById('ai-profile-id').textContent = `微信号: ${contact.wxid || 'wxid_' + contact.id}`;
            document.getElementById('ai-profile-signature').textContent = contact.signature || '暂无个性签名';
        }
        
        contact.initializedProfile = true;
        saveConfig();

    } catch (error) {
        console.error('[GenerateProfile] 生成资料过程中发生异常', error);
        // 异常情况下的保底
        contact.nickname = contact.name;
        contact.wxid = `wxid_${Math.random().toString(36).substring(2, 8)}`;
        contact.signature = "你好";
        contact.initializedProfile = true;
        saveConfig();
        
        // 刷新 UI
        document.getElementById('ai-profile-name').textContent = contact.nickname;
        document.getElementById('ai-profile-id').textContent = `微信号: ${contact.wxid}`;
        document.getElementById('ai-profile-signature').textContent = contact.signature;
    }
}

function renderAiProfile(contact) {
    document.getElementById('ai-profile-avatar').src = contact.avatar;
    
    const displayName = contact.remark || contact.nickname || contact.name;
    document.getElementById('ai-profile-name').textContent = displayName;

    const nicknameEl = document.getElementById('ai-profile-nickname');
    const realNickname = contact.nickname || contact.name;
    if (contact.remark && realNickname && contact.remark !== realNickname) {
        nicknameEl.textContent = `昵称: ${realNickname}`;
        nicknameEl.style.display = 'block';
    } else {
        nicknameEl.style.display = 'none';
    }

    const displayId = contact.wxid || contact.id;
    document.getElementById('ai-profile-id').textContent = `微信号: ${displayId}`;
    
    const bgEl = document.getElementById('ai-profile-bg');
    if (contact.profileBg) {
        bgEl.style.backgroundImage = `url(${contact.profileBg})`;
    } else {
        bgEl.style.backgroundImage = '';
    }

    document.getElementById('ai-profile-remark').textContent = contact.remark || '未设置';
    document.getElementById('ai-profile-signature').textContent = contact.signature || '暂无个性签名';
    document.getElementById('ai-profile-relation').textContent = contact.relation || '未设置';

    const previewContainer = document.getElementById('ai-moments-preview');
    previewContainer.innerHTML = '';
    
    const contactMoments = window.iphoneSimState.moments.filter(m => m.contactId === contact.id);
    const recentMoments = contactMoments.sort((a, b) => b.time - a.time).slice(0, 4);
    
    recentMoments.forEach(m => {
        if (m.images && m.images.length > 0) {
            const img = document.createElement('img');
            img.src = m.images[0];
            previewContainer.appendChild(img);
        }
    });
}

function handleAiProfileBgUpload(e) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        contact.profileBg = base64;
        document.getElementById('ai-profile-bg').style.backgroundImage = `url(${contact.profileBg})`;
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function openRelationSelect() {
    const modal = document.getElementById('relation-select-modal');
    const list = document.getElementById('relation-options');
    list.innerHTML = '';

    const relations = ['情侣', '闺蜜', '死党', '基友', '同事', '同学', '家人', '普通朋友'];
    
    relations.forEach(rel => {
        const item = document.createElement('div');
        item.className = 'list-item center-content';
        item.textContent = rel;
        item.onclick = () => setRelation(rel);
        list.appendChild(item);
    });

    modal.classList.remove('hidden');
}

function setRelation(relation) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    contact.relation = relation;
    document.getElementById('ai-profile-relation').textContent = relation;
    saveConfig();
    document.getElementById('relation-select-modal').classList.add('hidden');
}

// --- 聊天设置功能 ---

function openChatSettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    document.getElementById('chat-setting-name').value = contact.name || '';
    document.getElementById('chat-setting-avatar-preview').src = contact.avatar || '';
    const aiBgContainer = document.getElementById('ai-setting-bg-container');
    if (contact.aiSettingBg) {
        aiBgContainer.style.backgroundImage = `url(${contact.aiSettingBg})`;
    } else {
        aiBgContainer.style.backgroundImage = '';
    }
    document.getElementById('chat-setting-ai-bg-input').value = '';

    document.getElementById('chat-setting-remark').value = contact.remark || '';
    document.getElementById('chat-setting-group-value').textContent = contact.group || '未分组';
    window.iphoneSimState.tempSelectedGroup = contact.group || '';

    document.getElementById('chat-setting-persona').value = contact.persona || '';

    // 加载位置选择器
    loadLocationToSelectors(contact);

    // 加载 NovelAI 预设
    const novelaiPresetSelect = document.getElementById('chat-setting-novelai-preset');
    if (novelaiPresetSelect) {
        novelaiPresetSelect.innerHTML = '<option value="">-- 不使用预设 --</option><option value="AUTO_MATCH">-- 自动匹配类型 --</option>';
        const presets = window.iphoneSimState.novelaiPresets || [];
        presets.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.name;
            opt.textContent = p.name;
            novelaiPresetSelect.appendChild(opt);
        });
        if (contact.novelaiPreset) {
            // 检查预设是否存在，如果不存在则不选中（或者是为了兼容性保留值？）
            // 这里选择直接设置 value，如果 value 不在 options 中，select 会显示为空或第一项，视浏览器行为而定
            // 为了更好的体验，我们假设预设名字是唯一的 key
            novelaiPresetSelect.value = contact.novelaiPreset;
        }
    }

    document.getElementById('chat-setting-context-limit').value = contact.contextLimit || '';
    document.getElementById('chat-setting-summary-limit').value = contact.summaryLimit || '';
    document.getElementById('chat-setting-show-thought').checked = contact.showThought || false;
    document.getElementById('chat-setting-thought-visible').checked = contact.thoughtVisible || false;
    document.getElementById('chat-setting-real-time-visible').checked = contact.realTimeVisible || false;

    const thoughtStyleSelect = document.getElementById('chat-setting-thought-style');
    const thoughtPetPanel = document.getElementById('chat-setting-thought-pet-panel');
    const thoughtPetImageInput = document.getElementById('chat-setting-thought-pet-image');
    const thoughtPetPreview = document.getElementById('chat-setting-thought-pet-preview');
    const thoughtPetSizeSlider = document.getElementById('chat-setting-thought-pet-size');
    const thoughtPetSizeValue = document.getElementById('chat-setting-thought-pet-size-value');
    const thoughtDisplayMode = contact.thoughtDisplayMode === 'desktop-pet' ? 'desktop-pet' : 'title';
    const thoughtPetSize = clampThoughtPetSizeSetting(contact.thoughtPetSize);

    contact.thoughtPetPosition = normalizeThoughtPetPositionSetting(contact.thoughtPetPosition);

    if (thoughtStyleSelect) thoughtStyleSelect.value = thoughtDisplayMode;
    if (thoughtPetPanel) thoughtPetPanel.style.display = thoughtDisplayMode === 'desktop-pet' ? '' : 'none';
    if (thoughtPetImageInput) thoughtPetImageInput.value = '';
    if (thoughtPetSizeSlider) thoughtPetSizeSlider.value = thoughtPetSize;
    if (thoughtPetSizeValue) thoughtPetSizeValue.textContent = `${thoughtPetSize}px`;
    if (thoughtPetPreview) {
        thoughtPetPreview.src = contact.thoughtPetImage || getDefaultThoughtPetImageData();
        const previewSize = Math.max(44, Math.min(76, Math.round(thoughtPetSize * 0.64)));
        thoughtPetPreview.style.width = `${previewSize}px`;
        thoughtPetPreview.style.height = `${previewSize}px`;
    }
    
    document.getElementById('chat-setting-tts-enabled').checked = contact.ttsEnabled || false;
    document.getElementById('chat-setting-tts-voice-id').value = contact.ttsVoiceId || 'male-qn-qingse';

    document.getElementById('chat-setting-avatar').value = '';
    document.getElementById('chat-setting-my-avatar').value = '';
    document.getElementById('chat-setting-bg').value = '';
    document.getElementById('chat-setting-custom-css').value = contact.customCss || '';

    // 消息间隔设置
    document.getElementById('chat-setting-interval-min').value = contact.replyIntervalMin || '';
    document.getElementById('chat-setting-interval-max').value = contact.replyIntervalMax || '';

    // 主动发消息设置
    document.getElementById('chat-setting-active-reply').checked = contact.activeReplyEnabled || false;
    document.getElementById('chat-setting-active-interval').value = contact.activeReplyInterval || '';

    // 字体大小设置
    const fontSizeSlider = document.getElementById('chat-font-size-slider');
    const fontSizeValue = document.getElementById('chat-font-size-value');
    if (fontSizeSlider && fontSizeValue) {
        const currentSize = contact.chatFontSize || 16;
        fontSizeSlider.value = currentSize;
        fontSizeValue.textContent = `${currentSize}px`;
        
        fontSizeSlider.oninput = (e) => {
            const size = e.target.value;
            fontSizeValue.textContent = `${size}px`;
            // 实时预览
            const chatBody = document.getElementById('chat-messages');
            if (chatBody) {
                chatBody.style.fontSize = `${size}px`;
            }
        };
    }

    const avatarVisibilitySelect = document.getElementById('chat-setting-avatar-visibility');
    if (avatarVisibilitySelect) {
        const legacyAvatarVisibility = contact.showAvatar === false ? 'hide-both' : 'show-both';
        avatarVisibilitySelect.value = contact.avatarVisibility || legacyAvatarVisibility;
    }

    const showTimestampToggle = document.getElementById('chat-setting-show-timestamp');
    if (showTimestampToggle) {
        showTimestampToggle.checked = contact.showTimestamp !== false;
    }

    const userPersonaSelect = document.getElementById('chat-setting-user-persona');
    userPersonaSelect.innerHTML = '<option value="">-- 选择身份 --</option>';
    window.iphoneSimState.userPersonas.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name || '未命名身份';
        userPersonaSelect.appendChild(option);
    });
    
    if (contact.userPersonaId) {
        userPersonaSelect.value = contact.userPersonaId;
    }

    // 动态添加用户人设编辑框
    let userPromptTextarea = document.getElementById('chat-setting-user-prompt');
    if (!userPromptTextarea) {
        // 尝试跳出 select 所在的行容器，以实现垂直布局
        const selectContainer = userPersonaSelect.parentNode;
        const mainContainer = selectContainer.parentNode;
        
        userPromptTextarea = document.createElement('textarea');
        userPromptTextarea.id = 'chat-setting-user-prompt';
        userPromptTextarea.className = 'setting-input';
        userPromptTextarea.rows = 3;
        userPromptTextarea.placeholder = '在此输入人设...';
        
        // 样式调整：居中、无标签、类似个性签名
        userPromptTextarea.style.width = '90%';
        userPromptTextarea.style.margin = '15px auto 0 auto';
        userPromptTextarea.style.display = 'block';
        userPromptTextarea.style.textAlign = 'center';
        userPromptTextarea.style.border = 'none';
        userPromptTextarea.style.background = 'transparent';
        userPromptTextarea.style.resize = 'none';
        userPromptTextarea.style.fontSize = '14px';
        userPromptTextarea.style.color = '#666';
        
        // 聚焦时样式
        userPromptTextarea.onfocus = () => {
            userPromptTextarea.style.background = '#f5f5f5';
            userPromptTextarea.style.borderRadius = '8px';
            userPromptTextarea.style.padding = '8px';
        };
        userPromptTextarea.onblur = () => {
            userPromptTextarea.style.background = 'transparent';
            userPromptTextarea.style.padding = '0';
        };
        
        // 插入到 selectContainer 后面 (即主容器中，位于行容器下方)
        if (mainContainer) {
            if (selectContainer.nextSibling) {
                mainContainer.insertBefore(userPromptTextarea, selectContainer.nextSibling);
            } else {
                mainContainer.appendChild(userPromptTextarea);
            }
        } else {
            // Fallback: 如果没有 mainContainer，就插在 select 后面
            if (userPersonaSelect.nextSibling) {
                selectContainer.insertBefore(userPromptTextarea, userPersonaSelect.nextSibling);
            } else {
                selectContainer.appendChild(userPromptTextarea);
            }
        }
    }

    // 加载用户人设内容
    const loadUserPrompt = () => {
        const selectedId = userPersonaSelect.value;
        // 如果有覆盖值且当前选中的ID与保存的ID一致（或者没有保存的ID），显示覆盖值
        // 但如果用户切换了select，应该显示新select对应的默认值
        // 这里逻辑简化：打开时，如果有覆盖值，显示覆盖值；否则显示默认值
        if (contact.userPersonaPromptOverride) {
            userPromptTextarea.value = contact.userPersonaPromptOverride;
        } else if (selectedId) {
            const p = window.iphoneSimState.userPersonas.find(p => p.id == selectedId);
            userPromptTextarea.value = p ? (p.aiPrompt || '') : '';
        } else {
            userPromptTextarea.value = '';
        }
    };
    loadUserPrompt();

    // 监听身份切换
    userPersonaSelect.onchange = () => {
        const selectedId = userPersonaSelect.value;
        const p = window.iphoneSimState.userPersonas.find(p => p.id == selectedId);
        userPromptTextarea.value = p ? (p.aiPrompt || '') : '';
    };

    const userBgContainer = document.getElementById('user-setting-bg-container');
    if (userBgContainer) {
        if (contact.userSettingBg) {
            userBgContainer.style.backgroundImage = `url(${contact.userSettingBg})`;
        } else {
            userBgContainer.style.backgroundImage = '';
        }
    }
    const userBgInput = document.getElementById('chat-setting-user-bg-input');
    if (userBgInput) userBgInput.value = '';
    
    const userAvatarPreview = document.getElementById('chat-setting-my-avatar-preview');
    if (userAvatarPreview) {
        userAvatarPreview.src = contact.myAvatar || window.iphoneSimState.userProfile.avatar;
    }
    
    const userAvatarInput = document.getElementById('chat-setting-my-avatar');
    if (userAvatarInput) {
        const newUserAvatarInput = userAvatarInput.cloneNode(true);
        userAvatarInput.parentNode.replaceChild(newUserAvatarInput, userAvatarInput);
        
        newUserAvatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (userAvatarPreview) userAvatarPreview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const wbList = document.getElementById('chat-setting-wb-list');
    wbList.innerHTML = '';
    
    if (window.iphoneSimState.wbCategories && window.iphoneSimState.wbCategories.length > 0) {
        window.iphoneSimState.wbCategories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            let isChecked = false;
            if (!contact.linkedWbCategories) {
                isChecked = true;
            } else {
                isChecked = contact.linkedWbCategories.includes(cat.id);
            }

            item.innerHTML = `
                <div class="list-content" style="justify-content: space-between; align-items: center; width: 100%;">
                    <span>${cat.name}</span>
                    <input type="checkbox" class="wb-category-checkbox" data-id="${cat.id}" ${isChecked ? 'checked' : ''}>
                </div>
            `;
            wbList.appendChild(item);
        });
    } else {
        wbList.innerHTML = '<div class="list-item"><div class="list-content">暂无世界书分类</div></div>';
    }

    const stickerList = document.getElementById('chat-setting-sticker-list');
    stickerList.innerHTML = '';
    
    if (window.iphoneSimState.stickerCategories && window.iphoneSimState.stickerCategories.length > 0) {
        window.iphoneSimState.stickerCategories.forEach(cat => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            let isChecked = false;
            if (!contact.linkedStickerCategories) {
                isChecked = true;
            } else {
                isChecked = contact.linkedStickerCategories.includes(cat.id);
            }

            item.innerHTML = `
                <div class="list-content" style="justify-content: space-between; align-items: center; width: 100%;">
                    <span>${cat.name}</span>
                    <input type="checkbox" class="sticker-category-checkbox" data-id="${cat.id}" ${isChecked ? 'checked' : ''}>
                </div>
            `;
            stickerList.appendChild(item);
        });
    } else {
        stickerList.innerHTML = '<div class="list-item"><div class="list-content">暂无表情包分类</div></div>';
    }

    renderUserPerception(contact);
    if (window.renderChatCssPresets) window.renderChatCssPresets();

    normalizeChatSettingsListRows();
    document.getElementById('chat-settings-screen').classList.remove('hidden');
}

function renderUserPerception(contact) {
    const list = document.getElementById('user-perception-list');
    const displayArea = document.getElementById('user-perception-display');
    const editArea = document.getElementById('user-perception-edit');
    const editBtn = document.getElementById('edit-user-perception-btn');
    const saveBtn = document.getElementById('save-user-perception-btn');
    const cancelBtn = document.getElementById('cancel-user-perception-btn');
    const input = document.getElementById('user-perception-input');

    if (!list) return;

    if (!contact.userPerception) {
        contact.userPerception = [];
    }

    list.innerHTML = '';
    if (contact.userPerception.length === 0) {
        list.innerHTML = '<div style="color: #999; font-size: 14px; padding: 10px 0;">暂无认知信息</div>';
    } else {
        contact.userPerception.forEach(item => {
            const div = document.createElement('div');
            div.textContent = `• ${item}`;
            div.style.marginBottom = '5px';
            div.style.fontSize = '14px';
            list.appendChild(div);
        });
    }

    const newEditBtn = editBtn.cloneNode(true);
    editBtn.parentNode.replaceChild(newEditBtn, editBtn);
    
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    
    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newEditBtn.addEventListener('click', () => {
        displayArea.classList.add('hidden');
        editArea.classList.remove('hidden');
        input.value = contact.userPerception.join('\n');
    });

    newSaveBtn.addEventListener('click', () => {
        const text = input.value.trim();
        const newPerception = text.split('\n').map(line => line.trim()).filter(line => line);
        contact.userPerception = newPerception;
        saveConfig();
        renderUserPerception(contact);
        displayArea.classList.remove('hidden');
        editArea.classList.add('hidden');
    });

    newCancelBtn.addEventListener('click', () => {
        displayArea.classList.remove('hidden');
        editArea.classList.add('hidden');
    });
}

function handleClearChatHistory() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    if (confirm('确定要清空与该联系人的所有聊天记录吗？此操作不可恢复。')) {
        const contactId = window.iphoneSimState.currentChatContactId;
        window.iphoneSimState.chatHistory[contactId] = [];
        
        // 重置总结和行程生成索引，确保清空后能重新触发
        const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
        if (contact) {
            contact.lastSummaryIndex = 0;
            contact.lastItineraryIndex = 0;
            contact.messagesSinceLastItinerary = 0;
        }
        
        saveConfig();
        renderChatHistory(contactId);
        alert('聊天记录已清空');
        document.getElementById('chat-settings-screen').classList.add('hidden');
    }
}

function handleExportCharacterData() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contactId = window.iphoneSimState.currentChatContactId;
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const data = {
        version: 1,
        type: 'character_data',
        contact: contact,
        chatHistory: window.iphoneSimState.chatHistory[contactId] || [],
        moments: window.iphoneSimState.moments.filter(m => m.contactId === contactId),
        memories: window.iphoneSimState.memories.filter(m => m.contactId === contactId),
        meetings: window.iphoneSimState.meetings ? window.iphoneSimState.meetings[contactId] || [] : [],
        phoneLayout: window.iphoneSimState.phoneLayouts ? window.iphoneSimState.phoneLayouts[contactId] : null,
        phoneContent: window.iphoneSimState.phoneContent ? window.iphoneSimState.phoneContent[contactId] : null,
        itinerary: window.iphoneSimState.itineraries ? window.iphoneSimState.itineraries[contactId] : null,
        exportTime: Date.now()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `character_${contact.name}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function handleImportCharacterData(e) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const currentContactId = window.iphoneSimState.currentChatContactId;
    
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('这将覆盖当前角色的所有数据（包括设定、聊天记录、朋友圈等），确定要继续吗？')) {
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!data.contact) {
                alert('无效的角色数据文件');
                return;
            }

            const currentContact = window.iphoneSimState.contacts.find(c => c.id === currentContactId);
            if (currentContact) {
                Object.assign(currentContact, data.contact);
                currentContact.id = currentContactId; 
            }

            if (data.chatHistory) {
                window.iphoneSimState.chatHistory[currentContactId] = data.chatHistory;
            }

            window.iphoneSimState.moments = window.iphoneSimState.moments.filter(m => m.contactId !== currentContactId);
            if (data.moments) {
                data.moments.forEach(m => {
                    m.contactId = currentContactId;
                    window.iphoneSimState.moments.push(m);
                });
            }

            window.iphoneSimState.memories = window.iphoneSimState.memories.filter(m => m.contactId !== currentContactId);
            if (data.memories) {
                data.memories.forEach(m => {
                    m.contactId = currentContactId;
                    window.iphoneSimState.memories.push(m);
                });
            }

            if (!window.iphoneSimState.meetings) window.iphoneSimState.meetings = {};
            if (data.meetings) {
                window.iphoneSimState.meetings[currentContactId] = data.meetings;
            }

            if (data.phoneLayout) {
                if (!window.iphoneSimState.phoneLayouts) window.iphoneSimState.phoneLayouts = {};
                window.iphoneSimState.phoneLayouts[currentContactId] = data.phoneLayout;
            }

            if (data.phoneContent) {
                if (!window.iphoneSimState.phoneContent) window.iphoneSimState.phoneContent = {};
                window.iphoneSimState.phoneContent[currentContactId] = data.phoneContent;
            }

            if (data.itinerary) {
                if (!window.iphoneSimState.itineraries) window.iphoneSimState.itineraries = {};
                window.iphoneSimState.itineraries[currentContactId] = data.itinerary;
            }

            saveConfig();
            alert('角色数据导入成功！');
            
            openChatSettings(); 
            renderChatHistory(currentContactId);
            if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');

        } catch (err) {
            console.error('Import failed', err);
            alert('导入失败：文件格式错误');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function handleExportCharacterData() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contactId = window.iphoneSimState.currentChatContactId;
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const data = {
        version: 1,
        type: 'character_data',
        contact: contact,
        chatHistory: window.iphoneSimState.chatHistory[contactId] || [],
        moments: window.iphoneSimState.moments.filter(m => m.contactId === contactId),
        memories: window.iphoneSimState.memories.filter(m => m.contactId === contactId),
        meetings: window.iphoneSimState.meetings ? window.iphoneSimState.meetings[contactId] || [] : [],
        phoneLayout: window.iphoneSimState.phoneLayouts ? window.iphoneSimState.phoneLayouts[contactId] : null,
        phoneContent: window.iphoneSimState.phoneContent ? window.iphoneSimState.phoneContent[contactId] : null,
        itinerary: window.iphoneSimState.itineraries ? window.iphoneSimState.itineraries[contactId] : null,
        exportTime: Date.now()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `character_${contact.name}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function handleImportCharacterData(e) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const currentContactId = window.iphoneSimState.currentChatContactId;
    
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('这将覆盖当前角色的所有数据（包括设定、聊天记录、朋友圈等），确定要继续吗？')) {
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!data.contact) {
                alert('无效的角色数据文件');
                return;
            }

            const currentContact = window.iphoneSimState.contacts.find(c => c.id === currentContactId);
            if (currentContact) {
                Object.assign(currentContact, data.contact);
                currentContact.id = currentContactId; 
            }

            if (data.chatHistory) {
                window.iphoneSimState.chatHistory[currentContactId] = data.chatHistory;
            }

            window.iphoneSimState.moments = window.iphoneSimState.moments.filter(m => m.contactId !== currentContactId);
            if (data.moments) {
                data.moments.forEach(m => {
                    m.contactId = currentContactId;
                    window.iphoneSimState.moments.push(m);
                });
            }

            window.iphoneSimState.memories = window.iphoneSimState.memories.filter(m => m.contactId !== currentContactId);
            if (data.memories) {
                data.memories.forEach(m => {
                    m.contactId = currentContactId;
                    window.iphoneSimState.memories.push(m);
                });
            }

            if (!window.iphoneSimState.meetings) window.iphoneSimState.meetings = {};
            if (data.meetings) {
                window.iphoneSimState.meetings[currentContactId] = data.meetings;
            }

            if (data.phoneLayout) {
                if (!window.iphoneSimState.phoneLayouts) window.iphoneSimState.phoneLayouts = {};
                window.iphoneSimState.phoneLayouts[currentContactId] = data.phoneLayout;
            }

            if (data.phoneContent) {
                if (!window.iphoneSimState.phoneContent) window.iphoneSimState.phoneContent = {};
                window.iphoneSimState.phoneContent[currentContactId] = data.phoneContent;
            }

            if (data.itinerary) {
                if (!window.iphoneSimState.itineraries) window.iphoneSimState.itineraries = {};
                window.iphoneSimState.itineraries[currentContactId] = data.itinerary;
            }

            saveConfig();
            alert('角色数据导入成功！');
            
            openChatSettings(); 
            renderChatHistory(currentContactId);
            if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');

        } catch (err) {
            console.error('Import failed', err);
            alert('导入失败：文件格式错误');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function handleSaveChatSettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const name = document.getElementById('chat-setting-name').value;
    const remark = document.getElementById('chat-setting-remark').value;
    const persona = document.getElementById('chat-setting-persona').value;
    const contextLimit = document.getElementById('chat-setting-context-limit').value;
    const summaryLimit = document.getElementById('chat-setting-summary-limit').value;
    const showThought = document.getElementById('chat-setting-show-thought').checked;
    const thoughtVisible = document.getElementById('chat-setting-thought-visible').checked;
    const realTimeVisible = document.getElementById('chat-setting-real-time-visible').checked;
    const thoughtDisplayModeRaw = document.getElementById('chat-setting-thought-style')
        ? document.getElementById('chat-setting-thought-style').value
        : 'title';
    const thoughtDisplayMode = thoughtDisplayModeRaw === 'desktop-pet' ? 'desktop-pet' : 'title';
    const thoughtPetSize = clampThoughtPetSizeSetting(
        document.getElementById('chat-setting-thought-pet-size')
            ? document.getElementById('chat-setting-thought-pet-size').value
            : contact.thoughtPetSize
    );
    const thoughtPetImageInput = document.getElementById('chat-setting-thought-pet-image');
    const ttsEnabled = document.getElementById('chat-setting-tts-enabled').checked;
    const ttsVoiceId = document.getElementById('chat-setting-tts-voice-id').value;
    const userPersonaId = document.getElementById('chat-setting-user-persona').value;
    const userPromptOverride = document.getElementById('chat-setting-user-prompt') ? document.getElementById('chat-setting-user-prompt').value : null;
    const avatarInput = document.getElementById('chat-setting-avatar');
    const aiBgInput = document.getElementById('chat-setting-ai-bg-input');
    const userBgInput = document.getElementById('chat-setting-user-bg-input');
    const myAvatarInput = document.getElementById('chat-setting-my-avatar');
    const customCss = document.getElementById('chat-setting-custom-css').value;
    const fontSize = document.getElementById('chat-font-size-slider') ? parseInt(document.getElementById('chat-font-size-slider').value) : 16;
    const avatarVisibility = document.getElementById('chat-setting-avatar-visibility')
        ? document.getElementById('chat-setting-avatar-visibility').value
        : 'show-both';
    const showTimestamp = document.getElementById('chat-setting-show-timestamp') ? document.getElementById('chat-setting-show-timestamp').checked : true;
    const intervalMin = document.getElementById('chat-setting-interval-min').value;
    const intervalMax = document.getElementById('chat-setting-interval-max').value;
    const activeReplyEnabled = document.getElementById('chat-setting-active-reply').checked;
    const activeReplyInterval = document.getElementById('chat-setting-active-interval').value;
    const novelaiPreset = document.getElementById('chat-setting-novelai-preset') ? document.getElementById('chat-setting-novelai-preset').value : '';

    const selectedWbCategories = [];
    document.querySelectorAll('.wb-category-checkbox').forEach(cb => {
        if (cb.checked) {
            selectedWbCategories.push(parseInt(cb.dataset.id));
        }
    });
    contact.linkedWbCategories = selectedWbCategories;

    const selectedStickerCategories = [];
    document.querySelectorAll('.sticker-category-checkbox').forEach(cb => {
        if (cb.checked) {
            selectedStickerCategories.push(parseInt(cb.dataset.id));
        }
    });
    contact.linkedStickerCategories = selectedStickerCategories;

    contact.name = name;
    contact.remark = remark;
    contact.group = window.iphoneSimState.tempSelectedGroup;
    contact.persona = persona;
    contact.location = getLocationFromSelectors();
    contact.contextLimit = contextLimit ? parseInt(contextLimit) : 0;
    contact.summaryLimit = summaryLimit ? parseInt(summaryLimit) : 0;
    contact.showThought = showThought;
    contact.thoughtVisible = thoughtVisible;
    contact.realTimeVisible = realTimeVisible;
    contact.thoughtDisplayMode = thoughtDisplayMode;
    contact.thoughtPetSize = thoughtPetSize;
    contact.thoughtPetPosition = normalizeThoughtPetPositionSetting(contact.thoughtPetPosition);
    contact.ttsEnabled = ttsEnabled;
    contact.ttsVoiceId = ttsVoiceId;
    contact.userPersonaId = userPersonaId ? parseInt(userPersonaId) : null;
    if (userPromptOverride !== null) {
        contact.userPersonaPromptOverride = userPromptOverride;
    }
    contact.customCss = customCss;
    contact.chatFontSize = fontSize;
    contact.avatarVisibility = avatarVisibility;
    // Backward-compat for any old logic relying on showAvatar.
    contact.showAvatar = avatarVisibility !== 'hide-both';
    contact.showTimestamp = showTimestamp;
    contact.replyIntervalMin = intervalMin ? parseInt(intervalMin) : null;
    contact.replyIntervalMax = intervalMax ? parseInt(intervalMax) : null;
    contact.activeReplyEnabled = activeReplyEnabled;
    contact.activeReplyInterval = activeReplyInterval ? parseInt(activeReplyInterval) : 60;
    contact.novelaiPreset = novelaiPreset;
    
    if (activeReplyEnabled) {
        // Start timing from now (or keep existing start time if already enabled?)
        // Requirement: "Change to timing from the last message sent AFTER enabling".
        // To strictly enforce "after enabling", we set the start time now.
        // If it was already enabled, maybe we shouldn't reset it? 
        // But if the user enters settings and clicks save, they might expect a refresh.
        // Let's set it if it wasn't enabled before, or if we want to reset.
        // For simplicity and to ensure the "after enabling" rule holds even on re-save:
        contact.activeReplyStartTime = Date.now();
    } else {
        contact.activeReplyStartTime = null;
    }

    document.getElementById('chat-title').textContent = remark || contact.name;
    
    contact.chatBg = window.iphoneSimState.tempSelectedChatBg;

    const promises = [];

    if (avatarInput.files && avatarInput.files[0]) {
        promises.push(new Promise(resolve => {
            compressImage(avatarInput.files[0], 300, 0.7).then(base64 => {
                contact.avatar = base64;
                resolve();
            }).catch(err => {
                console.error('图片压缩失败', err);
                resolve();
            });
        }));
    }

    if (aiBgInput.files && aiBgInput.files[0]) {
        promises.push(new Promise(resolve => {
            compressImage(aiBgInput.files[0], 800, 0.7).then(base64 => {
                contact.aiSettingBg = base64;
                resolve();
            }).catch(err => {
                console.error('AI背景图片压缩失败', err);
                resolve();
            });
        }));
    }

    if (userBgInput && userBgInput.files && userBgInput.files[0]) {
        promises.push(new Promise(resolve => {
            compressImage(userBgInput.files[0], 800, 0.7).then(base64 => {
                contact.userSettingBg = base64;
                resolve();
            }).catch(err => {
                console.error('用户背景图片压缩失败', err);
                resolve();
            });
        }));
    }

    if (myAvatarInput.files && myAvatarInput.files[0]) {
        promises.push(new Promise(resolve => {
            compressImage(myAvatarInput.files[0], 300, 0.7).then(base64 => {
                contact.myAvatar = base64;
                resolve();
            }).catch(err => {
                console.error('图片压缩失败', err);
                resolve();
            });
        }));
    }

    if (thoughtPetImageInput && thoughtPetImageInput.files && thoughtPetImageInput.files[0]) {
        promises.push(new Promise(resolve => {
            compressImagePreserveAlpha(thoughtPetImageInput.files[0], 512, 0.85).then(base64 => {
                contact.thoughtPetImage = base64;
                resolve();
            }).catch(err => {
                console.error('桌宠图片压缩失败', err);
                resolve();
            });
        }));
    }

    Promise.all(promises).then(() => {
        saveConfig();
        if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        renderChatHistory(contact.id);
        if (typeof window.renderThoughtEntryUI === 'function') {
            window.renderThoughtEntryUI(contact.id);
        }
        
        const chatScreen = document.getElementById('chat-screen');
        if (contact.chatBg) {
            chatScreen.style.backgroundImage = `url(${contact.chatBg})`;
            chatScreen.style.backgroundSize = 'cover';
            chatScreen.style.backgroundPosition = 'center';
        } else {
            chatScreen.style.backgroundImage = '';
        }

        const existingStyle = document.getElementById('chat-custom-css');
        if (existingStyle) existingStyle.remove();

        if (contact.customCss) {
            const style = document.createElement('style');
            style.id = 'chat-custom-css';
            // Scope CSS to chat screen to prevent affecting settings page
            style.textContent = `#chat-screen#chat-screen#chat-screen { ${contact.customCss} }`;
            document.head.appendChild(style);
        }

        // 应用字体大小
        const chatBody = document.getElementById('chat-messages');
        if (chatBody) {
            chatBody.style.fontSize = (contact.chatFontSize || 16) + 'px';
        }

        applyChatDisplayPreferences(contact);

        document.getElementById('chat-settings-screen').classList.add('hidden');
    });
}

// --- 聊天界面功能 ---
