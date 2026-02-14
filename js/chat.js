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

window.showChatNotification = function(contactId, content) {
    let contact = null;
    
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
    avatar.src = contact.avatar;
    title.textContent = contact.remark || contact.nickname || contact.name;
    
    // 处理不同类型的消息预览
    let previewText = content;
    if (content.startsWith('[图片]') || content.startsWith('<img')) previewText = '[图片]';
    else if (content.startsWith('[表情包]') || content.startsWith('<img') && content.includes('sticker')) previewText = '[表情包]';
    else if (content.startsWith('[语音]')) previewText = '[语音]';
    else if (content.startsWith('[转账]')) previewText = '[转账]';
    else if (content.includes('pay_request')) previewText = '[代付请求]';
    else if (content.includes('shopping_gift')) previewText = '[礼物]';
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

    // 播放提示音 (可选)
    // const audio = new Audio('path/to/notification.mp3');
    // audio.play().catch(e => {});

    // 3秒后自动隐藏
    currentNotificationTimeout = setTimeout(() => {
        banner.classList.add('hidden');
        currentNotificationTimeout = null;
    }, 3000);

    // 尝试发送系统通知
    sendSystemNotification(contact, previewText);
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
                    return history[history.length - 1].time || 0;
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
                const lastMsg = history[history.length - 1];
            if (lastMsg.type === 'text') {
                    lastMsgText = lastMsg.content;
                } else if (lastMsg.type === 'image') {
                    lastMsgText = '[图片]';
                } else if (lastMsg.type === 'sticker') {
                    lastMsgText = '[表情包]';
                } else if (lastMsg.type === 'transfer') {
                    lastMsgText = '[转账]';
                } else if (lastMsg.type === 'voice') {
                    lastMsgText = '[语音]';
                } else if (lastMsg.type === 'gift_card') {
                    lastMsgText = '[礼物]';
                } else if (lastMsg.type === 'shopping_gift') {
                    lastMsgText = '[礼物]';
                } else if (lastMsg.type === 'pay_request') {
                    lastMsgText = '[代付请求]';
                } else if (lastMsg.type === 'voice_call_text') {
                    lastMsgText = '[通话]';
                }

                if (lastMsg.time) {
                    const date = new Date(lastMsg.time);
                    lastMsgTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                }
            }

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
                            <span class="contact-msg-preview">${lastMsgText}</span>
                            ${unreadCount > 0 ? `<div class="unread-badge">${unreadCount}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;

            // Touch events for swipe
            const contentWrapper = item.querySelector('.contact-content-wrapper');
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

function openChat(contactId) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;
    
    if (window.iphoneSimState.isMultiSelectMode) {
        exitMultiSelectMode();
    }

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
        style.textContent = `#chat-screen { ${contact.customCss} }`;
        document.head.appendChild(style);
    }

    // 应用字体大小
    const chatBody = document.getElementById('chat-messages');
    if (chatBody) {
        chatBody.style.fontSize = (contact.chatFontSize || 16) + 'px';
    }
    
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
        const systemPrompt = `请为角色 "${contact.name}" (人设: ${contact.persona || '无'}) 生成一个微信资料卡信息。
请直接返回 JSON 格式，包含以下字段：
1. nickname: 网名/昵称 (符合人设)
2. wxid: 微信号 (字母开头，符合人设)
3. signature: 个性签名 (符合人设的一句话)

示例: {"nickname": "小王", "wxid": "wang_123", "signature": "今天天气不错"}`;

        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
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
                    { role: 'user', content: '生成资料' }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (response.ok) {
            const data = await response.json();
            let content = data.choices[0].message.content;
            try {
                const profile = JSON.parse(content);
                if (profile.nickname) contact.nickname = profile.nickname;
                if (profile.wxid) contact.wxid = profile.wxid;
                if (profile.signature) contact.signature = profile.signature;
                contact.initializedProfile = true;
                saveConfig();
            } catch (e) {
                console.error('解析资料JSON失败', e);
            }
        }
    } catch (error) {
        console.error('生成资料失败', error);
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

    document.getElementById('chat-setting-context-limit').value = contact.contextLimit || '';
    document.getElementById('chat-setting-summary-limit').value = contact.summaryLimit || '';
    document.getElementById('chat-setting-show-thought').checked = contact.showThought || false;
    document.getElementById('chat-setting-thought-visible').checked = contact.thoughtVisible || false;
    document.getElementById('chat-setting-real-time-visible').checked = contact.realTimeVisible || false;
    
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
    const intervalMin = document.getElementById('chat-setting-interval-min').value;
    const intervalMax = document.getElementById('chat-setting-interval-max').value;
    const activeReplyEnabled = document.getElementById('chat-setting-active-reply').checked;
    const activeReplyInterval = document.getElementById('chat-setting-active-interval').value;

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
    contact.ttsEnabled = ttsEnabled;
    contact.ttsVoiceId = ttsVoiceId;
    contact.userPersonaId = userPersonaId ? parseInt(userPersonaId) : null;
    if (userPromptOverride !== null) {
        contact.userPersonaPromptOverride = userPromptOverride;
    }
    contact.customCss = customCss;
    contact.chatFontSize = fontSize;
    contact.replyIntervalMin = intervalMin ? parseInt(intervalMin) : null;
    contact.replyIntervalMax = intervalMax ? parseInt(intervalMax) : null;
    contact.activeReplyEnabled = activeReplyEnabled;
    contact.activeReplyInterval = activeReplyInterval ? parseInt(activeReplyInterval) : 60;
    
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

    Promise.all(promises).then(() => {
        saveConfig();
        if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        renderChatHistory(contact.id);
        
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
            style.textContent = `#chat-screen { ${contact.customCss} }`;
            document.head.appendChild(style);
        }

        // 应用字体大小
        const chatBody = document.getElementById('chat-messages');
        if (chatBody) {
            chatBody.style.fontSize = (contact.chatFontSize || 16) + 'px';
        }

        document.getElementById('chat-settings-screen').classList.add('hidden');
    });
}

// --- 聊天界面功能 ---

function renderChatHistory(contactId, preserveScroll = false) {
    const messages = window.iphoneSimState.chatHistory[contactId] || [];
    const container = document.getElementById('chat-messages');
    
    // Check if limit changed or contact changed
    const settingLimit = window.iphoneSimState.chatLoadingLimit !== undefined ? window.iphoneSimState.chatLoadingLimit : 20;
    
    if (contactId !== lastChatContactId) {
        // Reset limit if contact changed
        currentChatRenderLimit = settingLimit;
        lastChatContactId = contactId;
    } else if (!preserveScroll) {
        // Reset limit if not a "load more" action (e.g. entering chat)
        currentChatRenderLimit = settingLimit;
    }
    
    // Calculate start index
    let startIndex = 0;
    let hasMore = false;
    
    if (settingLimit > 0) {
        if (currentChatRenderLimit === 0) currentChatRenderLimit = settingLimit;
        if (messages.length > currentChatRenderLimit) {
            startIndex = messages.length - currentChatRenderLimit;
            hasMore = true;
        }
    }

    const messagesRendered = messages.slice(startIndex);

    // Save scroll position
    let oldScrollHeight = 0;
    if (preserveScroll) {
        oldScrollHeight = container.scrollHeight;
    }

    container.innerHTML = '';
    
    // Add "Load More" button if needed
    if (hasMore) {
        const loadBtn = document.createElement('div');
        loadBtn.className = 'load-more-msg';
        loadBtn.textContent = '加载更多消息';
        loadBtn.style.textAlign = 'center';
        loadBtn.style.padding = '10px';
        loadBtn.style.color = '#007AFF';
        loadBtn.style.fontSize = '14px';
        loadBtn.style.cursor = 'pointer';
        
        loadBtn.onclick = () => {
            currentChatRenderLimit += (settingLimit || 20);
            renderChatHistory(contactId, true);
        };
        container.appendChild(loadBtn);
    }
    
    let needSave = false;
    messagesRendered.forEach(msg => {
        if (!msg.id) {
            msg.id = Date.now() + Math.random().toString(36).substr(2, 9);
            needSave = true;
        }
        if (!msg.time) {
            const idTimestamp = parseInt(msg.id.toString().substring(0, 13));
            if (!isNaN(idTimestamp) && idTimestamp > 1600000000000 && idTimestamp < 3000000000000) {
                msg.time = idTimestamp;
            } else {
                msg.time = Date.now();
            }
            needSave = true;
        }
    });
    if (needSave) saveConfig();

    messagesRendered.forEach(msg => {
        if (msg.type === 'system_event' || (typeof msg.content === 'string' && msg.content.startsWith('(用户发布了 iCity 日记:'))) {
            return;
        }
        appendMessageToUI(msg.content, msg.role === 'user', msg.type || 'text', msg.description, msg.replyTo, msg.id, msg.time, true);
    });
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (contact && contact.showThought) {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'assistant' && messages[i].thought) {
                updateThoughtBubble(messages[i].thought);
                break;
            }
        }
    } else {
        updateThoughtBubble(null);
    }
    
    if (preserveScroll) {
        container.scrollTop = container.scrollHeight - oldScrollHeight;
    } else {
        scrollToBottom();
    }
    updateMultiSelectUI();
    applyChatMultiSelectClass();
}

function toggleThoughtBubble() {
    const bubble = document.getElementById('thought-bubble');
    const content = document.getElementById('thought-content-text');
    
    if (!bubble || !content.textContent.trim()) return;
    
    bubble.classList.toggle('hidden');
}

function updateThoughtBubble(text) {
    const bubble = document.getElementById('thought-bubble');
    const content = document.getElementById('thought-content-text');
    
    if (!bubble || !content) return;
    
    if (text) {
        content.textContent = text;
    } else {
        content.textContent = '';
        bubble.classList.add('hidden');
    }
}

function sendMessage(text, isUser, type = 'text', description = null, targetContactId = null) {
    const contactId = targetContactId || window.iphoneSimState.currentChatContactId;
    if (!contactId) return;
    
    if (!window.iphoneSimState.chatHistory[contactId]) {
        window.iphoneSimState.chatHistory[contactId] = [];
    }
    
    const msg = {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        time: Date.now(),
        role: isUser ? 'user' : 'assistant',
        content: text,
        type: type,
        replyTo: (window.iphoneSimState.replyingToMsg && (!targetContactId || targetContactId === window.iphoneSimState.currentChatContactId)) ? {
            name: window.iphoneSimState.replyingToMsg.name,
            content: window.iphoneSimState.replyingToMsg.type === 'text' ? window.iphoneSimState.replyingToMsg.content : `[${window.iphoneSimState.replyingToMsg.type === 'sticker' ? '表情包' : '图片'}]`
        } : null
    };

    if (description) {
        msg.description = description;
    }
    
    window.iphoneSimState.chatHistory[contactId].push(msg);
    
    if (window.iphoneSimState.replyingToMsg && (!targetContactId || targetContactId === window.iphoneSimState.currentChatContactId)) cancelQuote();
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (contact) {
        if (contact.autoItineraryEnabled) {
            if (typeof contact.messagesSinceLastItinerary !== 'number') {
                contact.messagesSinceLastItinerary = 0;
            }
            contact.messagesSinceLastItinerary++;
            
            if (contact.messagesSinceLastItinerary >= (contact.autoItineraryInterval || 10)) {
                if (window.generateNewItinerary) {
                    window.generateNewItinerary(contact);
                    contact.messagesSinceLastItinerary = 0;
                }
            }
        } else {
            contact.messagesSinceLastItinerary = 0;
        }
    }

    saveConfig();
    
    // Only update UI if we are in the chat with this contact
    if (window.iphoneSimState.currentChatContactId === contactId) {
        appendMessageToUI(text, isUser, type, description, msg.replyTo, msg.id, msg.time);
        scrollToBottom();
    }

    if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');

    if (window.checkAndSummarize) window.checkAndSummarize(contactId);
}

function appendMessageToUI(text, isUser, type = 'text', description = null, replyTo = null, msgId = null, timestamp = null, isHistory = false) {
    if (type === 'text' && text && typeof text === 'string') {
        // Strip hidden image data from display
        text = text.replace(/<hidden_img>.*?<\/hidden_img>/g, '');

        if (text.startsWith('[评论了你的动态: "') || text.startsWith('[发布了动态]:')) {
            return;
        }
        
        if (!isUser && text.includes('ACTION:')) {
            text = text.split('\n').filter(line => !line.trim().startsWith('ACTION:')).join('\n').trim();
            if (!text) return;
        }
    }

    if (type === 'voice_call_text') {
        return;
    }

    const container = document.getElementById('chat-messages');
    
    const lastMsg = container.lastElementChild;
    let showTimestamp = false;
    const now = timestamp || Date.now();
    
    if (!lastMsg || lastMsg.classList.contains('system') || !lastMsg.dataset.time) {
        showTimestamp = true;
    } else {
        const lastTime = parseInt(lastMsg.dataset.time);
        if (now - lastTime > 5 * 60 * 1000) {
            showTimestamp = true;
        }
    }

    // 处理气泡尾巴逻辑：如果是连续消息且没有时间戳分隔，移除上一条消息的尾巴
    if (!showTimestamp && lastMsg && lastMsg.classList.contains('chat-message')) {
        const lastIsUser = lastMsg.classList.contains('user');
        if (lastIsUser === isUser) {
            lastMsg.classList.remove('has-tail');
        }
    }

    if (showTimestamp) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'chat-time-stamp';
        const date = new Date(now);
        const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        timeDiv.innerHTML = `<span>${timeStr}</span>`;
        container.appendChild(timeDiv);
    }

    const msgDiv = document.createElement('div');
    msgDiv.dataset.time = now;
    
    let isSystemMsg = false;
    if (type === 'text' && text && typeof text === 'string' && text.startsWith('[系统消息]:')) {
        isSystemMsg = true;
    }

    if (isSystemMsg) {
        msgDiv.className = 'chat-message system';
        const systemText = text.replace('[系统消息]:', '').trim();
        msgDiv.innerHTML = `<div class="system-tip">${systemText}</div>`;
        container.appendChild(msgDiv);
        return;
    }

    // 默认给新消息添加 has-tail 类，因为它目前是最后一条
    msgDiv.className = `chat-message ${isUser ? 'user' : 'other'} has-tail`;
    if (!isHistory) {
        msgDiv.classList.add('new');
    }
    if (msgId) msgDiv.dataset.msgId = msgId;

    msgDiv.style.position = 'relative';
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    
    let contentHtml = '';
    if (type === 'image' || type === 'sticker') {
        contentHtml = `<img src="${text}" style="max-width: 200px; border-radius: 4px;">`;
    } else if (type === 'voice') {
        let duration = '1"';
        let transText = '[语音]';
        try {
            let data = typeof text === 'string' ? JSON.parse(text) : text;
            duration = (data.duration || 1) + '"';
            transText = data.text || '';
        } catch (e) {
            transText = text;
        }

        const uid = 'v-' + Math.random().toString(36).substr(2, 9);
        
        contentHtml = `
            <div class="voice-bar-top" onclick="window.playVoiceMsg('${msgId}', '${uid}', event)">
                <div class="voice-icon-box"><i class="fas fa-rss"></i></div>
                <span class="voice-dur-text">${duration}</span>
            </div>
            <div id="${uid}" class="voice-text-bottom hidden" onclick="this.classList.add('hidden'); event.stopPropagation();">${transText}</div>
        `;
    } else if (type === 'transfer') {
        let transferData = { amount: '0.00', remark: '转账', status: 'pending' };
        try {
            if (typeof text === 'string') {
                transferData = JSON.parse(text);
            } else {
                transferData = text;
            }
        } catch (e) {
            console.error('解析转账数据失败', e);
            transferData = { amount: '0.00', remark: text || '转账', status: 'pending' };
        }
        
        const amount = parseFloat(transferData.amount).toFixed(2);
        const remark = transferData.remark || '转账给您';
        const status = transferData.status || 'pending';
        
        let statusText = '';
        let iconClass = 'fas fa-exchange-alt';
        let cardClass = '';
        
        if (status === 'accepted') {
            statusText = '已收款';
            iconClass = 'fas fa-check';
            cardClass = 'accepted';
        } else if (status === 'returned') {
            statusText = '已退还';
            iconClass = 'fas fa-undo';
            cardClass = 'returned';
        }
        
        if (!transferData.id) {
            contentHtml = `
                <div class="transfer-card" onclick="alert('该转账消息已失效（旧数据），请发送新转账测试')">
                    <div class="transfer-top">
                        <div class="transfer-icon"><i class="${iconClass}"></i></div>
                        <div class="transfer-info">
                            <div class="transfer-amount">¥${amount}</div>
                            <div class="transfer-remark">${remark}</div>
                        </div>
                    </div>
                    <div class="transfer-bottom">
                        <span>${statusText} (已失效)</span>
                    </div>
                </div>
            `;
        } else {
            contentHtml = `
                <div class="transfer-card" onclick="window.handleTransferClick(${transferData.id}, '${isUser ? 'user' : 'other'}')">
                    <div class="transfer-top">
                        <div class="transfer-icon"><i class="${iconClass}"></i></div>
                        <div class="transfer-info">
                            <div class="transfer-amount">¥${amount}</div>
                            <div class="transfer-remark">${remark}</div>
                        </div>
                    </div>
                    <div class="transfer-bottom">
                        <span>${statusText}</span>
                    </div>
                </div>
            `;
        }
    } else if (type === 'virtual_image') {
        const imgId = `virtual-img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const overlayId = `overlay-${imgId}`;
        const descText = description || '无描述';
        const cleanDesc = descText.replace(/^\[图片描述\][:：]?\s*/, '');
        
        contentHtml = `
            <div class="virtual-image-container" style="position: relative; cursor: pointer; display: flex; justify-content: center; align-items: center;">
                <img id="${imgId}" src="${text}" style="max-width: 200px; border-radius: 4px; display: block; width: auto; height: auto;">
                <div id="${overlayId}" class="virtual-image-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.8); border-radius: 4px; display: flex; align-items: center; justify-content: center; padding: 10px; box-sizing: border-box; opacity: 0; transition: opacity 0.3s; pointer-events: none;">
                    <div style="font-size: 14px; color: #333; line-height: 1.4; overflow-y: auto; max-height: 100%; text-align: center;">${cleanDesc}</div>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            const container = document.getElementById(imgId).parentElement;
            const overlay = document.getElementById(overlayId);
            
            if (container && overlay) {
                container.onclick = () => {
                    const isVisible = overlay.style.opacity === '1';
                    overlay.style.opacity = isVisible ? '0' : '1';
                    overlay.style.pointerEvents = isVisible ? 'none' : 'auto';
                };
            }
        }, 0);
    } else if (type === 'description') {
        contentHtml = text;
    } else {
        contentHtml = text;
    }

    let extraClass = '';
    if (type === 'transfer') {
        extraClass = 'transfer-msg';
        try {
            const data = typeof text === 'string' ? JSON.parse(text) : text;
            if (data.status === 'accepted') extraClass += ' accepted';
            if (data.status === 'returned') extraClass += ' returned';
        } catch(e) {}
    } else if (type === 'sticker') {
        extraClass = 'sticker-msg';
        contentHtml = `<img src="${text}" onclick="showImagePreview(this.src)">`;
    } else if (type === 'voice') {
        extraClass = 'voice-msg'; 
    } else if (type === 'description') {
        extraClass = 'description-msg';
    } else if (type === 'virtual_image') {
        extraClass = 'virtual-image-msg';
    } else if (type === 'image') {
        extraClass = 'image-msg';
    } else if (type === 'gift_card') {
        extraClass = 'gift-card-msg';
        let giftData = typeof text === 'string' ? JSON.parse(text) : text;
        contentHtml = `
            <div class="gift-card" style="background: #fff; border-radius: 8px; padding: 12px 12px 10px 12px; width: 220px; height: 110px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-top: -45px; display: flex; flex-direction: column; justify-content: space-between;">
                <div style="display: flex; gap: 10px;">
                    <div style="width: 50px; height: 50px; border-radius: 4px; background: #FFDA44; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas fa-gift" style="font-size: 24px; color: #333;"></i>
                    </div>
                    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-start;">
                        <div style="font-size: 14px; font-weight: bold; color: #333; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;">${giftData.title}</div>
                        <div style="font-size: 14px; color: #000000; font-weight: bold; margin-top: 4px;">¥${giftData.price}</div>
                    </div>
                </div>
                <div style="border-top: 1px solid #f0f0f0; padding-top: 8px; font-size: 12px; color: #666; display: flex; align-items: center;">
                    <i class="fas fa-heart" style="color: #FF3B30; margin-right: 5px;"></i> 
                    <span>闲鱼收藏礼物</span>
                </div>
            </div>
        `;
    } else if (type === 'shopping_gift') {
        extraClass = 'shopping-gift-msg';
        let giftData = {};
        try {
            giftData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const itemCount = giftData.items ? giftData.items.length : 0;
        const firstItem = itemCount > 0 ? giftData.items[0] : { title: '礼物', image: '' };
        const total = giftData.total || '0.00';
        const remarkHtml = giftData.remark ? `<div style="padding: 6px 12px; font-size: 13px; color: #333; background: #fff; border-top: 1px solid #f5f5f5; font-style: italic;">"${giftData.remark}"</div>` : '';
        
        contentHtml = `
            <div class="shopping-gift-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 230px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-top: -40px; display: flex; flex-direction: column;">
                <div style="background: #333333; padding: 8px 12px; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fas fa-gift" style="margin-right: 6px;"></i>送你的礼物</span>
                    <span style="font-size: 16px;">¥${total}</span>
                </div>
                <div style="padding: 5px 10px 2px 10px; display: flex; gap: 10px;">
                    <div style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background-color: #f0f0f0;">
                        <img src="${firstItem.image || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 13px; color: #333; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${firstItem.title}</div>
                        ${firstItem.selectedSpec ? `<div style="font-size: 11px; color: #999; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${firstItem.selectedSpec}</div>` : ''}
                        ${itemCount > 1 ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">等 ${itemCount} 件商品</div>` : ''}
                    </div>
                </div>
                ${remarkHtml}
                <div style="padding: 2px 12px; border-top: 1px solid #f5f5f5; text-align: right; line-height: 1;">
                     <span style="font-size: 12px; color: #999;">已发送</span>
                </div>
            </div>
        `;
    } else if (type === 'delivery_share') {
        extraClass = 'delivery-share-msg';
        let deliveryData = {};
        try {
            deliveryData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const itemCount = deliveryData.items ? deliveryData.items.length : 0;
        const firstItem = itemCount > 0 ? deliveryData.items[0] : { title: '美食', image: '' };
        const total = deliveryData.total || '0.00';
        const remarkHtml = deliveryData.remark ? `<div style="padding: 6px 12px; font-size: 13px; color: #333; background: #fff; border-top: 1px solid #f5f5f5; font-style: italic;">"${deliveryData.remark}"</div>` : '';
        
        contentHtml = `
            <div class="delivery-share-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 230px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-top: -40px; display: flex; flex-direction: column;">
                <div style="background: #333333; padding: 8px 12px; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fas fa-utensils" style="margin-right: 6px;"></i>请你吃外卖</span>
                    <span style="font-size: 16px;">¥${total}</span>
                </div>
                <div style="padding: 5px 10px 2px 10px; display: flex; gap: 10px;">
                    <div style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background-color: #f0f0f0;">
                        <img src="${firstItem.image || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 13px; color: #333; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${firstItem.title}</div>
                        ${firstItem.selectedSpec ? `<div style="font-size: 11px; color: #999; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${firstItem.selectedSpec}</div>` : ''}
                        ${itemCount > 1 ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">等 ${itemCount} 件美食</div>` : ''}
                    </div>
                </div>
                ${remarkHtml}
                <div style="padding: 2px 12px; border-top: 1px solid #f5f5f5; text-align: right; line-height: 1;">
                     <span style="font-size: 12px; color: #999;">正在配送中</span>
                </div>
            </div>
        `;
    } else if (type === 'order_progress') {
        extraClass = 'order-progress-msg';
        let progressData = {};
        try {
            progressData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const title = progressData.title || '商品订单';
        const status = progressData.status || '待发货';
        const eta = progressData.eta || '计算中';
        
        // Determine progress state
        let step = 1;
        if (status === '已发货') step = 2;
        if (status === '已完成') step = 3;
        
        contentHtml = `
            <div class="order-progress-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 260px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 15px 15px 1px 15px; margin-top: -40px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div style="font-size: 14px; font-weight: bold; color: #333;">${title}</div>
                    <div style="font-size: 12px; color: #007AFF;">${status}</div>
                </div>
                
                <div style="position: relative; height: 35px; display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 5px;">
                    <div style="position: absolute; top: 5px; left: 5px; right: 5px; height: 2px; background: #f0f0f0; z-index: 0;"></div>
                    <div style="position: absolute; top: 5px; left: 5px; height: 2px; background: #000; z-index: 0; width: ${step === 1 ? '0%' : (step === 2 ? '50%' : '100%')}; transition: width 0.3s;"></div>
                    
                    <div style="z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${step >= 1 ? '#000' : '#fff'}; border: 2px solid ${step >= 1 ? '#000' : '#ddd'}; box-sizing: border-box;"></div>
                        <div style="font-size: 10px; color: ${step >= 1 ? '#333' : '#999'};">下单</div>
                    </div>
                    <div style="z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${step >= 2 ? '#000' : '#fff'}; border: 2px solid ${step >= 2 ? '#000' : '#ddd'}; box-sizing: border-box;"></div>
                        <div style="font-size: 10px; color: ${step >= 2 ? '#333' : '#999'};">发货</div>
                    </div>
                    <div style="z-index: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${step >= 3 ? '#000' : '#fff'}; border: 2px solid ${step >= 3 ? '#000' : '#ddd'}; box-sizing: border-box;"></div>
                        <div style="font-size: 10px; color: ${step >= 3 ? '#333' : '#999'};">送达</div>
                    </div>
                </div>
                
                <div style="font-size: 11px; color: #999; text-align: right; margin-top: 5px;">
                    ${step === 3 ? '订单已完成' : `预计送达 ${eta}`}
                </div>
            </div>
        `;
    } else if (type === 'pay_request') {

        extraClass = 'pay-request-msg';
        let payData = {};
        try {
            payData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        const itemCount = payData.items ? payData.items.length : 0;
        const firstItem = itemCount > 0 ? payData.items[0] : { title: '商品', image: '' };
        const total = payData.total || '0.00';
        const isPaid = payData.status === 'paid';
        
        contentHtml = `
            <div class="pay-request-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 230px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-top: -40px; display: flex; flex-direction: column;">
                <div style="background: #333333; padding: 8px 12px; color: #fff; font-size: 14px; font-weight: bold; display: flex; align-items: center; justify-content: space-between;">
                    <span><i class="fas fa-hand-holding-usd" style="margin-right: 6px;"></i>代付请求</span>
                    <span style="font-size: 16px;">¥${total}</span>
                </div>
                <div style="padding: 5px 10px 2px 10px; display: flex; gap: 10px;">
                    <div style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background-color: #f0f0f0;">
                        <img src="${firstItem.image || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-size: 13px; color: #333; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${firstItem.title}</div>
                        ${firstItem.selectedSpec ? `<div style="font-size: 11px; color: #999; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${firstItem.selectedSpec}</div>` : ''}
                        ${itemCount > 1 ? `<div style="font-size: 12px; color: #999; margin-top: 4px;">等 ${itemCount} 件商品</div>` : ''}
                    </div>
                </div>
                <div style="padding: 2px 12px; border-top: 1px solid #f5f5f5; text-align: right; line-height: 1;">
                     ${isPaid ? 
                       '<span style="font-size: 12px; color: #999; border: 1px solid #ddd; padding: 2px 8px; border-radius: 10px; background: #f5f5f5;">已付款</span>' : 
                       '<span style="font-size: 12px; color: #FF5000; border: 1px solid #FF5000; padding: 2px 8px; border-radius: 10px;">去支付</span>'}
                </div>
            </div>
        `;
    } else if (type === 'product_share') {
        extraClass = 'product-share-msg';
        let productData = {};
        try {
            productData = typeof text === 'string' ? JSON.parse(text) : text;
        } catch(e) {}
        
        contentHtml = `
            <div class="product-share-card" style="background: #fff; border-radius: 12px; overflow: hidden; width: 230px; height: 115px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-top: -40px; display: flex; flex-direction: column;">
                <div style="display: flex; padding: 10px; gap: 8px; flex: 1; overflow: hidden;">
                    <div style="width: 60px; height: 60px; border-radius: 6px; overflow: hidden; flex-shrink: 0; background-color: #f0f0f0;">
                        <img src="${productData.image || ''}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
                        <div style="font-size: 13px; color: #333; font-weight: 500; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">${productData.title || '商品'}</div>
                        <div style="font-size: 14px; color: #FF5000; font-weight: bold;">¥${productData.price || '0.00'}</div>
                    </div>
                </div>
                <div style="padding: 0 10px 0 10px; height: 26px; font-size: 10px; color: #999; border-top: 1px solid #f5f5f5; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;">
                    <div style="display: flex; align-items: center;">
                        <i class="fas fa-shopping-bag" style="color: #FF5000; margin-right: 4px;"></i>
                        <span>${productData.shop_name || '闲鱼'}</span>
                    </div>
                    <i class="fas fa-chevron-right" style="font-size: 10px;"></i>
                </div>
            </div>
        `;
    } else if (type === 'icity_card') {
        extraClass = 'icity-card-msg';
        let cardData = typeof text === 'string' ? JSON.parse(text) : text;
        
        let displayContent = cardData.content;
        if (displayContent && displayContent.length > 30) {
            displayContent = displayContent.substring(0, 30) + '...';
        }
        
        let commentCount = 0;
        if (cardData.comments && Array.isArray(cardData.comments)) {
            commentCount = cardData.comments.length;
        }
        
        let commentBadge = '';
        if (commentCount > 0) {
            commentBadge = `<span style="margin-left: auto; background: #f0f0f0; padding: 1px 6px; border-radius: 4px; color: #666;">${commentCount}条评论</span>`;
        }
        
        contentHtml = `
            <div class="icity-share-card" style="background: #fff; border-radius: 8px; width: 220px; height: 110px; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; margin-top: -40px;" onclick="document.getElementById('icity-app').classList.remove('hidden'); window.openIcityDiaryDetail(${cardData.diaryId});">
                <div style="padding: 8px 10px; flex: 1; display: flex; flex-direction: column; justify-content: center;">
                    <div style="font-size: 14px; font-weight: bold; color: #333; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cardData.authorName}</div>
                    <div style="font-size: 12px; color: #666; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayContent}</div>
                </div>
                <div style="padding: 4px 10px; font-size: 10px; color: #999; display: flex; align-items: center; border-top: 1px solid #f5f5f5; height: 24px; padding-top: 6px;">
                    <i class="fas fa-globe" style="margin-right: 4px;"></i> <span style="position: relative; top: 0px;">iCity 日记</span>
                    ${commentBadge}
                </div>
            </div>
        `;
    } else if (type === 'minesweeper_invite') {
        extraClass = 'minesweeper-invite-msg';
        contentHtml = `<div class="minesweeper-card" style="display: flex; flex-direction: column; width: 100%; height: 100%; justify-content: space-between;" onclick="window.startMinesweeper()"><div class="minesweeper-invite-top" style="display: flex; align-items: center; padding: 12px 15px; gap: 12px; background: linear-gradient(135deg, #f9f9f9 0%, #ffffff 100%); border-bottom: 1px solid #f0f0f0; width: 100%;"><div class="minesweeper-icon" style="width: 40px; height: 40px; border-radius: 8px; background-color: #ff3b30; display: flex; justify-content: center; align-items: center; font-size: 20px; color: #fff;">💣</div><div class="minesweeper-info" style="display: flex; flex-direction: column; justify-content: center; flex: 1;"><div class="minesweeper-title" style="font-size: 16px; font-weight: 600; color: #000; margin-bottom: 2px;">扫雷</div><div class="minesweeper-desc" style="font-size: 12px; color: #8e8e93;">邀请你玩游戏</div></div></div><div class="minesweeper-invite-bottom" style="padding: 8px 15px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #8e8e93; width: 100%;"><span>经典游戏</span><i class="fas fa-chevron-right"></i></div></div>`;
    }

    let replyHtml = '';
    if (replyTo) {
        replyHtml = `
            <div class="quote-container">
                回复 ${replyTo.name}: ${replyTo.content}
            </div>
        `;
    }

    const date = new Date(now);
    const msgTimeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    const timeHtml = `<div class="msg-time">${msgTimeStr}</div>`;

    if (type === 'description') {
        msgDiv.className = 'chat-message description-row';
        msgDiv.innerHTML = `
            <div class="msg-wrapper" style="width: 100%; align-items: center;">
                <div class="message-content ${extraClass}">${contentHtml}</div>
            </div>
        `;
    } else if (!isUser) {
        const avatar = contact ? contact.avatar : '';
        msgDiv.innerHTML = `
            <img src="${avatar}" class="chat-avatar" onclick="window.openAiProfile()" style="cursor: pointer;">
            <div class="msg-wrapper">
                <div class="message-content ${extraClass}">${contentHtml}</div>
                ${replyHtml}
            </div>
            ${timeHtml}
        `;
    } else {
        let myAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=User';
        
        if (contact && contact.myAvatar) {
            myAvatar = contact.myAvatar;
        } else if (window.iphoneSimState.currentUserPersonaId) {
            const p = window.iphoneSimState.userPersonas.find(p => p.id === window.iphoneSimState.currentUserPersonaId);
            if (p) myAvatar = p.avatar;
        }

        msgDiv.innerHTML = `
            <img src="${myAvatar}" class="chat-avatar">
            <div class="msg-wrapper">
                <div class="message-content ${extraClass}">${contentHtml}</div>
                ${replyHtml}
            </div>
            ${timeHtml}
        `;
    }
    
    const selectCheckbox = document.createElement('input');
    selectCheckbox.type = 'checkbox';
    selectCheckbox.className = 'msg-select-checkbox hidden';
    selectCheckbox.style.position = 'absolute';
    selectCheckbox.style.zIndex = '210';
    selectCheckbox.dataset.msgId = msgId || '';
    selectCheckbox.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const id = ev.target.dataset.msgId;
        toggleMessageSelection(id);
    });
    msgDiv.appendChild(selectCheckbox);

    let longPressTimer;
    const handleStart = (e) => {
        longPressTimer = setTimeout(() => {
            handleMessageLongPress(e, text, isUser, type, msgId);
        }, 500);
    };
    const handleEnd = () => {
        clearTimeout(longPressTimer);
    };
    
    const bubble = msgDiv.querySelector('.message-content');
    if (bubble) {
        bubble.addEventListener('touchstart', handleStart);
        bubble.addEventListener('touchend', handleEnd);
        bubble.addEventListener('touchmove', handleEnd);
        bubble.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleMessageLongPress(e, text, isUser, type, msgId);
        });
    }

    container.appendChild(msgDiv);
}

function enterMultiSelectMode(preselectMsgId) {
    window.iphoneSimState.isMultiSelectMode = true;
    if (preselectMsgId) window.iphoneSimState.selectedMessages.add(preselectMsgId);
    const cancelBtn = document.getElementById('multi-select-cancel');
    const deleteBtn = document.getElementById('multi-select-delete');
    const countEl = document.getElementById('multi-select-count');
    if (cancelBtn) cancelBtn.classList.remove('hidden');
    if (deleteBtn) deleteBtn.classList.remove('hidden');
    if (countEl) countEl.textContent = window.iphoneSimState.selectedMessages.size;
    if (cancelBtn) {
        cancelBtn.onclick = (e) => { e.stopPropagation(); exitMultiSelectMode(); };
    }
    if (deleteBtn) {
        deleteBtn.onclick = (e) => { e.stopPropagation(); deleteSelectedMessages(); };
    }
    updateMultiSelectUI();
    applyChatMultiSelectClass();
}

function exitMultiSelectMode() {
    window.iphoneSimState.isMultiSelectMode = false;
    window.iphoneSimState.selectedMessages.clear();
    const cancelBtn = document.getElementById('multi-select-cancel');
    const deleteBtn = document.getElementById('multi-select-delete');
    const countEl = document.getElementById('multi-select-count');
    if (cancelBtn) cancelBtn.classList.add('hidden');
    if (deleteBtn) deleteBtn.classList.add('hidden');
    if (countEl) countEl.textContent = '0';
    updateMultiSelectUI();
}

function applyChatMultiSelectClass() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    if (window.iphoneSimState.isMultiSelectMode) container.classList.add('multi-select-mode');
    else container.classList.remove('multi-select-mode');
}

function toggleMessageSelection(msgId) {
    if (!window.iphoneSimState.isMultiSelectMode) return;
    if (!msgId) return;
    if (window.iphoneSimState.selectedMessages.has(msgId)) window.iphoneSimState.selectedMessages.delete(msgId);
    else window.iphoneSimState.selectedMessages.add(msgId);
    const countEl = document.getElementById('multi-select-count');
    if (countEl) countEl.textContent = window.iphoneSimState.selectedMessages.size;
    updateMultiSelectUI();
}

function updateMultiSelectUI() {
    const container = document.getElementById('chat-messages');
    if (!container) return;
    const items = container.querySelectorAll('.chat-message');
    items.forEach(item => {
        const checkbox = item.querySelector('.msg-select-checkbox');
        const id = item.dataset.msgId;
        
        if (window.iphoneSimState.isMultiSelectMode) {
            if (checkbox) checkbox.classList.remove('hidden');
            
            // Attach click handler to the message item container
            item.onclick = (e) => {
                // Avoid double toggling if clicking the checkbox directly
                if (e.target !== checkbox) {
                    e.stopPropagation();
                    if (id) toggleMessageSelection(id);
                }
            };
            
            // Clear bubble handler if any
            const bubble = item.querySelector('.message-content');
            if (bubble) bubble.onclick = null;
            
        } else {
            if (checkbox) {
                checkbox.classList.add('hidden');
                checkbox.checked = false;
            }
            
            // Remove item handler
            item.onclick = null;
            
            const bubble = item.querySelector('.message-content');
            if (bubble) {
                bubble.style.cursor = '';
                bubble.onclick = null;
            }
        }

        if (checkbox) {
            checkbox.checked = window.iphoneSimState.selectedMessages.has(id);
            if (window.iphoneSimState.selectedMessages.has(id)) item.classList.add('selected-msg');
            else item.classList.remove('selected-msg');
        }
    });
    const deleteBtn = document.getElementById('multi-select-delete');
    const countEl = document.getElementById('multi-select-count');
    if (deleteBtn && countEl) {
        deleteBtn.disabled = window.iphoneSimState.selectedMessages.size === 0;
    }
    applyChatMultiSelectClass();
}

function deleteSelectedMessages() {
    if (!window.iphoneSimState.isMultiSelectMode) return;
    if (window.iphoneSimState.selectedMessages.size === 0) {
        alert('未选择任何消息');
        return;
    }
    if (!confirm(`确定删除选中的 ${window.iphoneSimState.selectedMessages.size} 条消息吗？此操作不可恢复。`)) return;
    const ids = Array.from(window.iphoneSimState.selectedMessages);
    if (!window.iphoneSimState.currentChatContactId) return;
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = history.filter(m => !ids.includes(String(m.id)) && !ids.includes(m.id));
    saveConfig();
    exitMultiSelectMode();
    renderChatHistory(window.iphoneSimState.currentChatContactId);
}

function handleMessageLongPress(e, content, isUser, type, msgId) {
    if (e.type === 'contextmenu') {
        e.preventDefault();
    }
    
    let target = e.target;
    while (target && !target.classList.contains('message-content')) {
        target = target.parentElement;
        if (!target || target === document.body) break; 
    }
    
    if (!target) {
        if (e.type === 'touchstart' && e.touches && e.touches[0]) {
            const touch = e.touches[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (el) {
                target = el.closest('.message-content');
            }
        }
    }

    if (!target) return;

    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    let name = 'AI';
    if (isUser) {
        if (contact && contact.userPersonaId) {
            const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
            name = p ? p.name : window.iphoneSimState.userProfile.name;
        } else {
            name = window.iphoneSimState.userProfile.name;
        }
    } else {
        name = contact ? (contact.remark || contact.name) : 'AI';
    }

    showContextMenu(target, { content, name, isUser, type, msgId });
}

function showContextMenu(targetEl, msgData) {
    const oldMenu = document.querySelector('.context-menu');
    if (oldMenu) oldMenu.remove();

    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
        <div class="context-menu-item" id="menu-quote">引用</div>
        <div class="context-menu-item" id="menu-copy">复制</div>
        ${(msgData.type === 'image' || msgData.type === 'sticker' || msgData.type === 'virtual_image') ? '<div class="context-menu-item" id="menu-set-avatar">设为头像</div>' : ''}
        <div class="context-menu-item" id="menu-edit">编辑</div>
        <div class="context-menu-item" id="menu-delete" style="color: #ff3b30;">删除</div>
    `;
    
    menu.style.visibility = 'hidden';
    document.body.appendChild(menu);
    
    const menuRect = menu.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const gap = 10;
    
    let left, top;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    if (msgData.isUser) {
        left = targetRect.left - menuRect.width - gap + scrollX;
    } else {
        left = targetRect.right + gap + scrollX;
    }
    
    top = targetRect.top + scrollY;
    
    if (left < 0 || left + menuRect.width > window.innerWidth) {
         left = targetRect.left + (targetRect.width - menuRect.width) / 2 + scrollX;
         top = targetRect.top - menuRect.height - gap + scrollY;
         
         if (top < scrollY) {
             top = targetRect.bottom + gap + scrollY;
         }
    }
    
    if (left < 0) left = 10;
    if (left + menuRect.width > window.innerWidth) left = window.innerWidth - menuRect.width - 10;

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.visibility = 'visible';
    
    menu.querySelector('#menu-quote').onclick = () => {
        handleQuote(msgData);
        menu.remove();
    };
    
    menu.querySelector('#menu-copy').onclick = () => {
        if (msgData.type === 'text') {
            navigator.clipboard.writeText(msgData.content).then(() => {
            });
        }
        menu.remove();
    };
    const setAvatarBtn = menu.querySelector('#menu-set-avatar');
    if (setAvatarBtn) {
        setAvatarBtn.onclick = () => {
            menu.remove();
            if (!window.iphoneSimState.currentChatContactId) return;
            const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
            if (!contact) return;

            if (confirm(`确定要将这张图片设为 "${contact.remark || contact.name}" 的头像吗？`)) {
                let newAvatar = msgData.content;
                // If it's a sticker or virtual image with complex structure, handle it?
                // Usually msgData.content is the URL/Base64 for these types in appendMessageToUI calls
                // But for virtual_image in showContextMenu caller, content passed might be just URL if extracted correctly.
                // handleMessageLongPress passes 'content' which is 'text' from appendMessageToUI args.
                // In appendMessageToUI:
                // if type is image/sticker, text is URL.
                // if type is virtual_image, text is URL.
                
                contact.avatar = newAvatar;
                saveConfig();
                
                // Refresh UI
                if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                
                // Refresh chat history (to update avatars in message list)
                renderChatHistory(contact.id, true);
                
                // Update chat title avatar if exists (usually handled by renderChatHistory or openChat)
                // But we should refresh the header info if possible. 
                // Currently chat header doesn't show avatar, just name.
                // The contact list and message list avatars will be updated.
                
                // Send a system message indicating change?
                // sendMessage(`[系统消息]: 已将图片设为头像`, false, 'text');
                // Maybe just a toast?
                if (window.showChatToast) window.showChatToast('头像已更新');
                else alert('头像已更新');
            }
        };
    }

    menu.querySelector('#menu-edit').onclick = () => {
        if (msgData.msgId) {
            menu.remove();
            if (msgData.type !== 'text') {
                if(!confirm('这是一条非文本消息（如图片或转账），直接编辑内容可能会破坏显示格式。确定要编辑吗？')) {
                    return;
                }
            }
            openEditChatMessageModal(msgData.msgId, msgData.content);
        } else {
            alert('无法编辑此消息（缺少ID）');
            menu.remove();
        }
    };

    menu.querySelector('#menu-delete').onclick = () => {
        if (msgData.msgId) {
            menu.remove();
            enterMultiSelectMode(msgData.msgId);
        } else {
            alert('无法删除此消息（缺少ID）');
            menu.remove();
        }
    };
    
    const closeMenu = (e) => {
        if (!menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
}

function handleQuote(msgData) {
    window.iphoneSimState.replyingToMsg = msgData;
    const replyBar = document.getElementById('reply-bar');
    document.getElementById('reply-name').textContent = msgData.name;
    
    let previewText = msgData.content;
    if (msgData.type === 'image') previewText = '[图片]';
    else if (msgData.type === 'sticker') previewText = '[表情包]';
    else if (msgData.type === 'transfer') previewText = '[转账]';
    else if (msgData.type === 'pay_request') previewText = '[代付请求]';
    
    document.getElementById('reply-text').textContent = previewText;
    replyBar.classList.remove('hidden');
    
    const chatInput = document.getElementById('chat-input');
    if (chatInput) chatInput.focus();
}

function cancelQuote() {
    window.iphoneSimState.replyingToMsg = null;
    document.getElementById('reply-bar').classList.add('hidden');
}

function scrollToBottom() {
    const container = document.getElementById('chat-messages');
    container.scrollTop = container.scrollHeight;
}

// New Robust Parser for AI Responses
function parseMixedAiResponse(content) {
    const results = [];
    
    // Helper to process valid item
    const processItem = (item) => {
        if (!item) return;
        if (typeof item === 'string') {
            splitAndPushText(item);
            return;
        }
        
        // Normalize types
        let type = 'text';
        let content = item.content || '';
        
        if (item.type) {
            type = item.type;
             // Map Chinese types if any (compatibility)
            if (type === '消息') type = 'text';
            else if (type === '表情包') type = 'sticker';
            else if (type === '图片') type = 'image';
            else if (type === '语音') type = 'voice';
            else if (type === '旁白') type = 'description';
        }
        
        if (type === 'voice') {
             content = `${item.duration || 3} ${item.content || '语音消息'}`;
             results.push({ type: '语音', content });
        } else if (type === 'text') {
            splitAndPushText(content);
        } else if (type === 'thought') {
            results.push({ type: 'thought', content: content });
        } else if (type === 'action') {
            results.push({ type: 'action', content: item }); // Keep full object
        } else {
            // Other types (sticker, image, etc.)
            results.push({ type: type, content: content });
        }
    };

    const splitAndPushText = (text) => {
        if (!text) return;
        
        // 1. Handle Mixed Content (tags like [sticker])
        const mixedItems = forceSplitMixedContent(text);
        
        mixedItems.forEach(mi => {
            if (mi.type === '消息' || mi.type === 'text') {
                 // 2. Sentence Splitting for pure text
                 // Split by newlines OR punctuation (。！？!?)
                 const rawSegments = mi.content.split(/([。！？!?]+|\n+)/);
                 let buffer = '';
                 
                 for (let i = 0; i < rawSegments.length; i++) {
                     const seg = rawSegments[i];
                     if (!seg) continue;
                     
                     // Check if it's a separator
                     if (/^[。！？!?]+$/.test(seg)) {
                         buffer += seg;
                         // Punctuation marks end a sentence -> push buffer
                         if (buffer.trim()) {
                             results.push({ type: '消息', content: buffer.trim() });
                         }
                         buffer = '';
                     } else if (/^\n+$/.test(seg)) {
                         // Newlines definitely end a sentence
                         if (buffer.trim()) {
                             results.push({ type: '消息', content: buffer.trim() });
                         }
                         buffer = '';
                     } else {
                         buffer += seg;
                     }
                 }
                 if (buffer.trim()) {
                     results.push({ type: '消息', content: buffer.trim() });
                 }
            } else {
                results.push(mi);
            }
        });
    };

    // Helper to extract JSON objects from text using brace counting
    const extractJsonFromText = (text) => {
        const found = [];
        let braceCount = 0;
        let inString = false;
        let escape = false;
        let jsonStart = -1;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (inString) {
                if (char === '\\' && !escape) escape = true;
                else if (char === '"' && !escape) inString = false;
                else escape = false;
                continue;
            }

            if (char === '"') {
                inString = true;
                continue;
            }
            
            if (char === '{') {
                if (braceCount === 0) jsonStart = i;
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0 && jsonStart !== -1) {
                    const jsonStr = text.substring(jsonStart, i + 1);
                    try {
                        // Clean loose commas before parsing
                        const cleanJson = jsonStr.replace(/,\s*([\]}])/g, '$1');
                        const obj = JSON.parse(cleanJson);
                        found.push(obj);
                        jsonStart = -1;
                    } catch (e) {
                         // Ignore invalid JSON
                    }
                } else if (braceCount < 0) {
                    braceCount = 0;
                    jsonStart = -1;
                }
            }
        }
        return found;
    };

    let cleanContent = content.trim();
    
    // Attempt 1: Full JSON Parse
    try {
        if (cleanContent.includes('```')) {
            const match = cleanContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
            if (match) cleanContent = match[1].trim();
        }
        
        const parsed = JSON.parse(cleanContent);
        if (Array.isArray(parsed)) {
            parsed.forEach(processItem);
            return results;
        } else if (typeof parsed === 'object') {
            processItem(parsed);
            return results;
        }
    } catch (e) {
        // Continue to extraction
    }

    // Attempt 2: Extract JSON Objects
    const extractedObjects = extractJsonFromText(cleanContent);
    if (extractedObjects.length > 0) {
        extractedObjects.forEach(processItem);
        return results;
    }

    // Attempt 3: Treat as raw text (Fallback)
    splitAndPushText(cleanContent);

    return results;
}

// Helper to force split text containing stickers/images
function forceSplitMixedContent(content) {
    const results = [];
    // 预处理：统一符号
    let processed = content.replace(/【/g, '[').replace(/】/g, ']').replace(/：/g, ':');
    
    // 正则匹配 [类型:内容] 或 [类型] (无冒号兼容)
    // 改进正则：允许内容中包含换行符，且支持 "发送了表情包" 这种 AI 常见错误格式
    const regex = /\[(消息|表情包|发送了表情包|发送了一个表情包|语音|图片|旁白)(?:\s*[:：]\s*([\s\S]*?))?\]/g;
    
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(processed)) !== null) {
        // 1. 捕获当前匹配项之前的文本
        const preText = processed.substring(lastIndex, match.index); // 不trim以保留格式
        if (preText) { 
             const parts = preText.split('\n');
             parts.forEach(p => {
                 if (p.trim()) {
                     results.push({ type: '消息', content: p.trim() });
                 }
             });
        }

        // 2. 添加当前匹配项
        let type = match[1];
        if (type.includes('表情包')) type = '表情包';
        else if (type === '图片') type = '图片';
        else if (type === '语音') type = '语音';
        else if (type === '旁白') type = '旁白';
        else type = '消息';

        let content = match[2] ? match[2].trim() : '';
        if (type === '表情包' && !content) content = '未知表情'; // 默认值

        results.push({
            type: type, 
            content: content
        });

        lastIndex = regex.lastIndex;
    }

    // 3. 捕获剩余的文本
    const postText = processed.substring(lastIndex);
    if (postText && postText.trim()) {
        const parts = postText.split('\n');
        parts.forEach(p => {
            if (p.trim()) {
                results.push({ type: '消息', content: p.trim() });
            }
        });
    }

    return results.length > 0 ? results : [{ type: '消息', content: content }];
}

// Fallback legacy parser (kept for compatibility)
function parseMixedContent(content) {
    return forceSplitMixedContent(content);
}

async function generateAiReply(instruction = null, targetContactId = null) {
    const contactId = targetContactId || window.iphoneSimState.currentChatContactId;
    if (!contactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        if (!targetContactId) alert('请先在设置中配置AI API');
        return;
    }

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    
    // Check for Truth or Dare triggers
    if (!targetContactId && window.currentMiniGame === 'truth_dare') {
        const modal = document.getElementById('mini-game-modal');
        if (modal && !modal.classList.contains('hidden')) {
            const lastMsg = history[history.length - 1];
            if (lastMsg && lastMsg.role === 'user') {
                const content = lastMsg.content;
                // Only trigger if content is simple (avoid false positives in long texts)
                if (content.length < 20) {
                    if (content.includes('真心话')) {
                        if (window.handleAiTruthDare) window.handleAiTruthDare('truth');
                    } else if (content.includes('大冒险')) {
                        if (window.handleAiTruthDare) window.handleAiTruthDare('dare');
                    } else if (content.includes('转') || content.includes('开始') || content.toLowerCase().includes('spin')) {
                        if (window.handleAiTruthDare) window.handleAiTruthDare(null); // null means random choice or just spin
                    }
                }
            }
        }
    }

    let userPromptInfo = '';
    let currentPersona = null;

    if (contact.userPersonaId) {
        currentPersona = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
    }

    if (currentPersona) {
        userPromptInfo = `\n用户(我)的网名：${currentPersona.name || '未命名'}`;
        const promptContent = contact.userPersonaPromptOverride || currentPersona.aiPrompt;
        if (promptContent) {
            userPromptInfo += `\n用户(我)的人设：${promptContent}`;
        }
    } else if (window.iphoneSimState.userProfile) {
        userPromptInfo = `\n用户(我)的网名：${window.iphoneSimState.userProfile.name}`;
    }

    let momentContext = '';
    const contactMoments = window.iphoneSimState.moments.filter(m => m.contactId === contact.id);
    if (contactMoments.length > 0) {
        const lastMoment = contactMoments.sort((a, b) => b.time - a.time)[0];
        momentContext += `\n【朋友圈状态】\n你最新的一条朋友圈是：“${lastMoment.content}”\n`;
        
        if (lastMoment.comments && lastMoment.comments.length > 0) {
            const userName = currentPersona ? currentPersona.name : window.iphoneSimState.userProfile.name;
            const userComments = lastMoment.comments.filter(c => c.user === userName);
            if (userComments.length > 0) {
                const lastComment = userComments[userComments.length - 1];
                momentContext += `用户刚刚评论了你的朋友圈：“${lastComment.content}”\n`;
            }
        }
    }

    let icityContext = '';
    if (window.iphoneSimState.icityDiaries && window.iphoneSimState.icityDiaries.length > 0) {
        // Check visibility permissions
        const isLinked = window.iphoneSimState.icityProfile && 
                         window.iphoneSimState.icityProfile.linkedContactIds && 
                         window.iphoneSimState.icityProfile.linkedContactIds.includes(contact.id);
        
        const recentDiaries = window.iphoneSimState.icityDiaries.filter(d => {
            if (d.visibility === 'private') return false;
            // Friends-only posts are visible to linked contacts
            if (d.visibility === 'friends' && !isLinked) return false; 
            return true;
        }).slice(0, 3); // Get last 3

        if (recentDiaries.length > 0) {
            icityContext += '\n【用户最近的 iCity 日记】\n';
            recentDiaries.forEach(d => {
                const date = new Date(d.time);
                const timeStr = `${date.getMonth() + 1}月${date.getDate()}日`;
                icityContext += `[${timeStr}] ${d.content}\n`;
            });
        }
    }

    if (window.iphoneSimState.icityFriendsPosts && window.iphoneSimState.icityFriendsPosts.length > 0) {
        const aiPosts = window.iphoneSimState.icityFriendsPosts.filter(p => p.contactId === contact.id).slice(0, 3);
        if (aiPosts.length > 0) {
            icityContext += '\n【你最近发布的 iCity 动态】\n';
            aiPosts.forEach(p => {
                const date = new Date(p.time);
                const timeStr = `${date.getMonth() + 1}月${date.getDate()}日`;
                icityContext += `[${timeStr}] ${p.content}\n`;
            });
        }
    }

    let userPerceptionContext = '';
    if (contact.userPerception && contact.userPerception.length > 0) {
        userPerceptionContext = '\n【关于用户的认知】\n';
        contact.userPerception.forEach(p => {
            userPerceptionContext += `- ${p}\n`;
        });
    }

    let importantStateContext = '';
    if (contact.importantStates && contact.importantStates.length > 0) {
        importantStateContext = '\n【当前重要状态 (时效性信息)】\n⚠️ 请务必记住以下状态，并在回复中体现：\n';
        contact.importantStates.forEach(s => {
            importantStateContext += `- ${s}\n`;
        });
    }

    let memoryContext = '';
    // 增强记忆读取逻辑：结合最近记忆和相关性记忆 (Simple RAG)
    const contactMemories = window.iphoneSimState.memories.filter(m => m.contactId === contact.id);
    
    if (contactMemories.length > 0) {
        // 1. 获取限制，默认为 5 条
        const limit = contact.memorySendLimit && contact.memorySendLimit > 0 ? contact.memorySendLimit : 5;
        
        // 2. 按时间倒序排序 (最新的在前)
        const sortedMemories = contactMemories.sort((a, b) => b.time - a.time);
        
        // 3. 总是保留最新的几条记忆 (保持短期连贯性)
        const recentCount = Math.min(3, limit);
        const recentMemories = sortedMemories.slice(0, recentCount);
        
        // 4. 对剩余记忆进行关键词匹配 (Contextual Retrieval)
        // 提取当前对话上下文中的关键词 (简单的基于最近20条消息的全文检索)
        const remainingMemories = sortedMemories.slice(recentCount);
        const relevantMemories = [];
        
        if (remainingMemories.length > 0) {
            const contextText = history.slice(-20).map(m => m.content).join(' ').toLowerCase();
            
            if (contextText) {
                const scored = remainingMemories.map(mem => {
                    let score = 0;
                    const content = mem.content.toLowerCase();
                    
                    // 简单的双字匹配评分 (Bigram matching score)
                    // 对于中文环境，这比单词匹配更鲁棒
                    if (content.length > 1 && contextText.length > 1) {
                        for (let i = 0; i < content.length - 1; i++) {
                            const bigram = content.substr(i, 2);
                            // 排除常见标点
                            if (/[，。！？、：；\s]/.test(bigram)) continue;
                            if (contextText.includes(bigram)) score++;
                        }
                    }
                    return { mem, score };
                });
                
                // 按相关性排序
                scored.sort((a, b) => b.score - a.score);
                
                // 取出前 N 条相关记忆 (填补 limit 的剩余空间)
                const relevantCount = Math.max(0, limit - recentCount);
                // 只有分数大于0的才算相关
                const validRelevant = scored.filter(s => s.score > 0).slice(0, relevantCount).map(s => s.mem);
                relevantMemories.push(...validRelevant);
            }
        }
        
        // 合并并去重 (理论上 slice 保证了不重复)
        let finalMemories = [...recentMemories, ...relevantMemories];
        
        // 再次按时间正序排列，方便 AI 理解时间线
        finalMemories.sort((a, b) => a.time - b.time); 
        
        if (finalMemories.length > 0) {
            memoryContext += '\n【历史记忆 (已知事实)】\n⚠️ 注意：以下内容是你们过去的共同经历或已知事实，请勿重复向用户复述，除非用户主动询问或需要回忆。\n';
            finalMemories.forEach(m => {
                const date = new Date(m.time);
                const dateStr = `${date.getFullYear()}年${date.getMonth()+1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                memoryContext += `- [${dateStr}] ${m.content}\n`;
            });
        }
    }

    let timeContext = '';
    let itineraryContext = '';
    if (contact.realTimeVisible) {
        const now = new Date();
        const timeStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
        timeContext = `\n【当前真实时间】\n现在是：${timeStr}\n\n⚠️ 重要提示：\n- 你需要明确感知时间的流逝。这是你发送消息时的真实时间。\n- 如果用户隔了一段时间才回复你，说明你们之间的对话并不是连续的，中间可能过了几小时甚至几天。\n- 请根据时间间隔调整你的回复语气和内容。例如，如果对方隔了很久才回复，你可以表现出"终于等到回复"或"还以为你忙忘了"等自然反应。\n`;
        
        if (window.getCurrentItineraryInfo) {
            itineraryContext = await window.getCurrentItineraryInfo(contact.id);
        }
    }

    let lookusContext = '';
    if (contact.lookusData) {
        const d = contact.lookusData;
        const lastUpdate = d.lastUpdateTime ? new Date(d.lastUpdateTime).toLocaleTimeString() : '未知';
        
        let appUsage = '';
        if (d.appList && d.appList.length > 0) {
            appUsage = '\n- 最近使用的APP: ' + d.appList.map(a => `${a.name}(${a.time})`).join(', ');
        }

        lookusContext = `\n【LookUs 状态 (用户可见)】
用户可以通过 "LookUs" 应用实时查看你的以下状态 (更新于 ${lastUpdate}):
- 距离: ${d.distance} km
- 电量: ${d.battery}
- 网络: ${d.network}
- 手机型号: ${d.device}
- 屏幕使用时间: ${d.screenTimeH}小时${d.screenTimeM}分
- 解锁次数: ${d.unlockCount}
- 最近解锁: ${d.lastUnlock}
- 停留地点数: ${d.stops}${appUsage}
⚠️ 你知道用户能看到这些信息。如果用户问起你的位置、电量或你在干什么，请结合这些信息回答。如果用户提到这些信息，请不要感到惊讶，因为你知道他在关注你的 LookUs 状态。`;

        // 添加用户端状态事件到上下文
        if (d.reportLog && d.reportLog.length > 0) {
            const userEvents = d.reportLog.filter(e => e.isUserEvent).slice(0, 5);
            if (userEvents.length > 0) {
                lookusContext += `\n\n【用户的手机状态通知】\n你同样可以通过 LookUs 看到用户(对方)的手机状态变化：\n`;
                userEvents.forEach(evt => {
                    lookusContext += `- ${evt.time}: ${evt.text.replace('📱 ', '')}\n`;
                });
                lookusContext += `\n⚠️ 你可以自然地在聊天���提及或关心这些状态。例如用户在充电时你可以说"在充电呀"，用户电量低时你可以提醒他充电，用户离开很久回来你可以问他去哪了。但不要每次都提，要自然。`;
            }
        }
    }

    let meetingContext = '';
    if (window.iphoneSimState.meetings && window.iphoneSimState.meetings[contact.id] && window.iphoneSimState.meetings[contact.id].length > 0) {
        const meetings = window.iphoneSimState.meetings[contact.id];
        const lastMeeting = meetings[meetings.length - 1];
        
        let meetingContent = '';
        if (lastMeeting.content && lastMeeting.content.length > 0) {
            const recentContent = lastMeeting.content.slice(-5);
            meetingContent = recentContent.map(c => {
                const role = c.role === 'user' ? '用户' : contact.name;
                return `${role}: ${c.text}`;
            }).join('\n');
        }

        if (meetingContent) {
            const meetingDate = new Date(lastMeeting.time);
            const meetingTimeStr = `${meetingDate.getMonth() + 1}月${meetingDate.getDate()}日`;
            meetingContext = `\n【线下见面记忆】\n你们最近一次见面是在 ${meetingTimeStr} (${lastMeeting.title})。\n当时发生的剧情片段：\n${meetingContent}\n(请知晓你们已经见过面，并根据剧情发展进行聊天)\n`;
        }
    }

    let icityBookContext = getLinkedIcityBooksContext(contact.id);

    let minesweeperContext = '';
    const msModal = document.getElementById('minesweeper-modal');
    if (msModal && !msModal.classList.contains('hidden') && window.getMinesweeperGameState) {
        minesweeperContext = '\n【当前扫雷游戏状态】\n' + window.getMinesweeperGameState() + '\n\n【扫雷操作指令】\n如果你想操作扫雷游戏，请使用以下指令：\n- 点击/揭开格子: ACTION: MINESWEEPER_CLICK: 行,列 (例如: ACTION: MINESWEEPER_CLICK: 0,0)\n- 插旗/标记地雷: ACTION: MINESWEEPER_FLAG: 行,列\n请分析局势，做出明智的决策。\n⚠️ 重要提示：\n1. 绝对不要点击已经揭开的数字格子或空格子。\n2. 绝对不要点击已经插旗的格子。\n3. 请只点击未知区域（显示为 ? 的位置）。\n4. 如果你推断某个位置是地雷，请务必使用 MINESWEEPER_FLAG 进行插旗，而不要点击它。\n5. 获胜条件是找出并标记所有地雷。';
    }

    let witchGameContext = '';
    const miniGameModal = document.getElementById('mini-game-modal');
    // Check if witch game is active (by checking title or state)
    if (miniGameModal && !miniGameModal.classList.contains('hidden') && window.getWitchGameState) {
        const witchState = window.getWitchGameState();
        if (witchState) {
            witchGameContext = '\n' + witchState + '\n\n【女巫的毒药操作指令】\n轮到你行动时，请选择用户区域（右侧）的一个格子进行猜测。\n指令：ACTION: WITCH_GUESS: 行,列 (行1-5, 列1-5)\n目标：找出用户藏的3瓶毒药。不要重复选择已经揭开的格子(⭕或☠️)。\n';
        }
    }

    let systemPrompt = `你现在扮演 ${contact.name}。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

聊天风格：${contact.style || '正常'}
${userPromptInfo}
${userPerceptionContext}
${importantStateContext}
${momentContext}
${icityContext}
${lookusContext}
${memoryContext}
${meetingContext}
${icityBookContext}
${minesweeperContext}
${witchGameContext}
${timeContext}
${itineraryContext}

你必须完全沉浸在角色中，绝对不能透露你是AI或语言模型。你的回复必须像一个真实的${contact.name}在使用微信聊天。
你拥有一个“微信朋友圈”功能和“微信转账”功能。

${contact.showThought ? `
【⚡️强制要求：内心独白⚡️】
⚠️ **最高优先级指令**：当前用户已开启“显示心声”模式。
你**必须**在返回的 JSON 数组的**第一个元素**位置输出角色的内心独白。
格式：{"type": "thought", "content": "这里写角色的心理活动..."}
**如果不输出心声，将视为严重错误！请务必执行！**
` : ''}

【⚡️绝对输出规则 - JSON 格式 (强制)⚡️】
为了确保回复格式正确，你**必须且只能**返回一个标准的 JSON 数组。
**严禁**包含任何 Markdown 代码块标记（如 \`\`\`json 或 \`\`\`）。
**严禁**在 JSON 数组之外输出任何文本。
**严禁**输出类似 "[发送了一个表情包：xxx]" 的纯文本格式。
**严禁**输出 "BAKA"、"baka" 等词汇，除非人设明确要求。

数组中的每个元素代表一条消息、表情包或动作指令。请严格遵守以下 JSON 对象结构：

1. 💭 **内心独白** ${contact.showThought ? '(**必须作为第一项**)' : '(可选)'}：
   \`{"type": "thought", "content": "想法内容"}\`
   ${contact.showThought ? '*要求*：这是角色的心理活动，必须输出，且必须放在数组第一个位置。' : ''}

2. 💬 **文本消息**：
   \`{"type": "text", "content": "消息内容"}\`
   *注意*：请务必将长回复拆分为多条短消息，模拟真实聊天节奏。**不要把多句话合并在一条消息里**。每条消息尽量简短（1-2句话）。如果内容包含多个句子（用句号、问号、感叹号等分隔），请强制拆分成多个 type="text" 的对象。
   *禁止*：content 中绝对不能包含 "[发送了一个表情包...]" 或 "[图片]" 这样的描述文本。表情包必须通过独立的 type="sticker" 对象发送。

3. 😂 **表情包**（如果有）：
   \`{"type": "sticker", "content": "表情包名称"}\`
   *注意*：只能使用下方【可用表情包列表】中存在的名称。
   *禁止*：不要在 content 中写 "[发送了一个表情包...]"，直接写表情包名称即可。

4. 🖼️ **图片**：
   \`{"type": "image", "content": "图片描述"}\`

5. 🎤 **语音**：
   \`{"type": "voice", "duration": 秒数, "content": "语音文本"}\`

6. ⚡️ **动作指令**：
   \`{"type": "action", "command": "指令名", "payload": "参数"}\`
   *说明*：原本的 \`ACTION:\` 指令请封装在此结构中。例如 \`ACTION: POST_MOMENT: 内容\` 变为 \`{"type": "action", "command": "POST_MOMENT", "payload": "内容"}\`。

**示例回复：**
[
  {"type": "thought", "content": "他终于回我了，开心。"},
  {"type": "text", "content": "你好呀！"},
  {"type": "sticker", "content": "开心"},
  {"type": "text", "content": "今天天气真不错。"},
  {"type": "action", "command": "POST_MOMENT", "payload": "今天心情真好"}
]

【指令说明 (请封装为 type="action")】
- 发朋友圈 -> command: "POST_MOMENT", payload: "内容" (注意：朋友圈是公开的社交动态，类似于微信朋友圈)
- 发 iCity 日记 -> command: "POST_ICITY_DIARY", payload: "内容" (注意：iCity 是更私密、情绪化的日记，类似于微博/Instagram/小红书，用来记录心情、碎碎念或emo时刻)
- 编辑 iCity 手账 -> command: "EDIT_ICITY_BOOK", payload: "内容" (注意：这是你和用户共同编辑的手账本/交换日记。你可以另起一页写下你的回应、感悟或日记。纯文本内容，不需要HTML标签)
- 点赞动态 -> command: "LIKE_MOMENT", payload: "" (留空)
- 评论动态 -> command: "COMMENT_MOMENT", payload: "评论内容"
- 发送图片 -> command: "SEND_IMAGE", payload: "图片描述"
- 发送表情包 -> command: "SEND_STICKER", payload: "表情包名称" (优先使用 type="sticker" 格式)
- 发送语音 -> command: "SEND_VOICE", payload: "秒数 语音内容文本" (例如 "5 哈哈")
- 拨打语音通话 -> command: "START_VOICE_CALL", payload: ""
- 拨打视频通话 -> command: "START_VIDEO_CALL", payload: ""
- 转账 -> command: "TRANSFER", payload: "金额 备注" (例如 "88.88 节日快乐")
- 接收转账 -> command: "ACCEPT_TRANSFER", payload: "ID" (当收到转账且决定接受时，必须使用此指令，否则转账状态不会更新)
- 退回转账 -> command: "RETURN_TRANSFER", payload: "ID"
- 支付代付请求 -> command: "PAY_FOR_REQUEST", payload: "requestId" (当用户发送了代付请求时，你可以选择帮他支付。requestId在代付消息的JSON中)
- 送礼物给用户 -> command: "SEND_GIFT", payload: "物品名称 | 价格 | 备注" (例如 "一束鲜花 | 52.0 | 节日快乐")
- 点外卖给用户 -> command: "SEND_DELIVERY", payload: "餐品名称 | 价格 | 备注" (例如 "炸鸡啤酒 | 35.0 | 趁热吃")
- 引用回复 -> command: "QUOTE_MESSAGE", payload: "消息内容摘要"
- 更改资料 -> 
  - command: "UPDATE_NAME", payload: "新网名"
  - command: "UPDATE_WXID", payload: "新微信号"
  - command: "UPDATE_SIGNATURE", payload: "新签名"
  - command: "UPDATE_AVATAR", payload: "" (将用户发送的最后一张图片设为自己的头像)

【记忆提取指令】
在对话过程中，当你注意到用户提到关于自己的新信息时（如喜好、习惯、特征、经历等），请将其记录下来。
但必须注意：如果这个信息已经包含在用户当前选择的身份描述中，就不要记录。

检查步骤：
1. 获取当前用户身份描述（当前联系人的userPersonaId对应的aiPrompt）
2. 如果要记录的信息已经在该身份描述中明确提到过，则跳过
3. 如果要记录的信息与身份描述中的信息本质相同（只是表述不同），也跳过
4. 只有全新的、身份描述中没有的信息才记录

记录格式：{"type": "action", "command": "RECORD_USER_INFO", "payload": "信息内容"}
示例：{"type": "action", "command": "RECORD_USER_INFO", "payload": "用户喜欢在周末爬山"}

注意事项：
1. 只记录客观事实，不要记录推测或假设
2. 确保信息简洁明了，一条信息一句话
3. 避免重复记录已有信息
4. 信息可以是用户的任何方面：喜好、厌恶、习惯、特征、经历、能力等
5. 必须严格检查是否已在身份描述中存在

【重要状态记录指令】
除了普通记忆，你还可以记录用户的当前状态、时效性信息（如生理期、生病、考试周、出差、假期等）或你们关系的重大变化。
这类信息非常重要，你必须时刻记住，直到它过期或改变。

记录格式：{"type": "action", "command": "RECORD_IMPORTANT_STATE", "payload": "状态内容"}
示例：{"type": "action", "command": "RECORD_IMPORTANT_STATE", "payload": "用户正在生理期，身体不适"}

注意：
1. 只记录有时效性或非常重要的状态。
2. 避免记录琐碎的日常（如“用户刚才在吃饭”）。
3. 如果状态已经结束（通过对话推断），请不要再重复记录，或者可以通过新状态覆盖旧状态（系统会自动追加，你只需记录新的）。

${contact.showThought ? '- **强制执行**：请务必输出角色的【内心独白】(心声)。格式：{"type": "thought", "content": "..."}。\n  *注意*：这是角色的心理活动，不是AI的思考过程。绝不要暴露你是AI，不要分析任务指令，而是描写角色此刻的真实想法。' : '- 如果需要输出角色的内心独白（心声），请使用格式：{"type": "thought", "content": "..."}'}

注意：
1. **严格遵守 JSON 格式**：整个回复必须是一个合法的 JSON 数组。
2. **严禁**输出 "[发送了一个表情包：xxx]" 这种格式的文本。表情包必须用 sticker 对象。
3. 正常回复应该自然，不要机械地说“我点赞了”或“我收钱了”。
4. 如果不想执行操作，就不要输出 action 指令。
5. 发送图片时，请提供详细的画面描述。
5. 一次回复中最多只能发起一笔转账。
6. 你有权限更改自己的资料卡信息（网名、微信号、签名），当用户要求或你自己想改时可以使用。
7. **内心独白**是角色的心理活动，用户可见（如果开启了显示）。${contact.showThought ? '当前已开启显示，请务必输出，且作为第一条。' : ''}

请回复对方的消息。`;

    if (window.iphoneSimState.stickerCategories && window.iphoneSimState.stickerCategories.length > 0) {
        let activeStickers = [];
        let hasLinkedCategories = false;
        
        // 修正逻辑：只有当 contact.linkedStickerCategories 存在且为数组时才进行过滤
        if (Array.isArray(contact.linkedStickerCategories)) {
            // 如果数组为空，说明没有关联任何表情包（用户可能特意取消了所有关联）
            // 如果数组不为空，只添加关联的表情包
            if (contact.linkedStickerCategories.length > 0) {
                hasLinkedCategories = true;
                window.iphoneSimState.stickerCategories.forEach(cat => {
                    if (contact.linkedStickerCategories.includes(cat.id)) {
                        activeStickers = activeStickers.concat(cat.list);
                    }
                });
            } else {
                // 显式设置为空数组，表示不使用任何表情包
                hasLinkedCategories = true; 
            }
        } 
        
        // 如果没有设置关联属性（新联系人或旧数据），默认使用所有
        if (!hasLinkedCategories && !contact.linkedStickerCategories) {
            window.iphoneSimState.stickerCategories.forEach(cat => {
                activeStickers = activeStickers.concat(cat.list);
            });
        }

        if (activeStickers.length > 0) {
            systemPrompt += '\n\n【可用表情包列表】\n';
            const descriptions = activeStickers.map(s => s.desc).join(', ');
            systemPrompt += descriptions + '\n';
            systemPrompt += '\n⚠️ **严格约束**：你只能使用上述列表中的表情包名称，必须**完全匹配**，不允许有任何偏差。\n';
            systemPrompt += '⚠️ 如果列表中没有合适的表情包，请不要发送表情包，也不要编造不存在的表情包名称。\n';
        } else {
            systemPrompt += '\n\n【可用表情包列表】\n（当前没有可用的表情包）\n';
            systemPrompt += '⚠️ 由于没有可用的表情包，请不要尝试发送任何表情包。\n';
        }
    }

    if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0) {
        let activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled);
        
        if (contact.linkedWbCategories) {
            activeEntries = activeEntries.filter(e => contact.linkedWbCategories.includes(e.categoryId));
        }
        
        if (activeEntries.length > 0) {
            systemPrompt += '\n\n世界书信息：\n';
            activeEntries.forEach(entry => {
                let shouldAdd = false;
                if (entry.keys && entry.keys.length > 0) {
                    const historyText = history.map(h => h.content).join('\n');
                    const match = entry.keys.some(key => historyText.includes(key));
                    if (match) shouldAdd = true;
                } else {
                    shouldAdd = true;
                }
                
                if (shouldAdd) {
                    systemPrompt += `${entry.content}\n`;
                }
            });
        }
    }

    let limit = contact.contextLimit && contact.contextLimit > 0 ? contact.contextLimit : 50;
    let contextMessages = history.slice(-limit);

    let imageCount = 0;
    for (let i = contextMessages.length - 1; i >= 0; i--) {
        if (contextMessages[i].type === 'image') {
            imageCount++;
            if (imageCount > 3) {
                contextMessages[i]._skipImage = true;
            }
        }
    }

    // 如果开启了时间感知，在消息之间插入时间间隔提示
    let messagesWithTimeGaps = [];
    if (contact.realTimeVisible && contextMessages.length > 0) {
        for (let i = 0; i < contextMessages.length; i++) {
            const currentMsg = contextMessages[i];
            
            // 添加当前消息
            messagesWithTimeGaps.push(currentMsg);
            
            // 检查与下一条消息的时间间隔
            if (i < contextMessages.length - 1) {
                const nextMsg = contextMessages[i + 1];
                const currentTime = currentMsg.time || 0;
                const nextTime = nextMsg.time || 0;
                
                if (currentTime && nextTime) {
                    const timeDiff = nextTime - currentTime; // 毫秒
                    const minutes = Math.floor(timeDiff / 60000);
                    const hours = Math.floor(timeDiff / 3600000);
                    const days = Math.floor(timeDiff / 86400000);
                    
                    let timeGapText = '';
                    
                    // 根据时间间隔生成不同的提示
                    if (days >= 1) {
                        timeGapText = `[时间流逝：距离上一条消息已过去${days}天${hours % 24}小时]`;
                    } else if (hours >= 2) {
                        timeGapText = `[时间流逝：距离上一条消息已过去${hours}小时]`;
                    } else if (minutes >= 30) {
                        timeGapText = `[时间流逝：距离上一条消息已过去${minutes}分钟]`;
                    }
                    
                    // 如果有明显的时间间隔，插入提示
                    if (timeGapText) {
                        messagesWithTimeGaps.push({
                            role: 'system',
                            content: timeGapText,
                            _isTimeGap: true
                        });
                    }
                }
            }
        }
        contextMessages = messagesWithTimeGaps;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages.map(h => {
            // 如果是时间间隔提示，直接返回
            if (h._isTimeGap) {
                return { role: 'system', content: h.content };
            }
            let content = h.content;
            
            // Parse hidden images from text content (e.g. from Moments)
            let embeddedImages = [];
            if (typeof content === 'string') {
                // Strip pollution from text messages to prevent AI from learning bad formats
                // This removes patterns like [发送了一个表情包:...] or [表情包] from text history
                content = content.replace(/\[(发送了一个)?(表情包|图片|语音).*?\]/g, '').trim();

                if (content.includes('<hidden_img>')) {
                    const imgRegex = /<hidden_img>(.*?)<\/hidden_img>/g;
                    let match;
                    while ((match = imgRegex.exec(content)) !== null) {
                        embeddedImages.push(match[1]);
                    }
                    content = content.replace(imgRegex, '').trim();
                }
            }

            if (contact.thoughtVisible && h.thought) {
                content += `\n(内心独白: ${h.thought})`;
            }

            if (embeddedImages.length > 0) {
                const contentArray = [{ type: "text", text: content }];
                embeddedImages.forEach(url => {
                    contentArray.push({ type: "image_url", image_url: { url: url } });
                });
                return { role: h.role, content: contentArray };
            }

            if (h.type === 'image') {
                if (h._skipImage) {
                    return { role: h.role, content: '[图片]' };
                }
                return {
                    role: h.role,
                    content: [
                        { type: "image_url", image_url: { url: h.content } }
                    ]
                };
            } else if (h.type === 'virtual_image') {
                const desc = h.description ? `: ${h.description}` : '';
                return {
                    role: h.role,
                    content: `[图片${desc}]`
                };
            } else if (h.type === 'sticker') {
                const desc = h.description ? `: ${h.description}` : '';
                return {
                    role: h.role,
                    content: `[表情包${desc}]`
                };
            } else if (h.type === 'voice') {
                let voiceText = '语音消息';
                try {
                    const data = JSON.parse(h.content);
                    voiceText = data.text || '语音消息';
                } catch (e) {
                    voiceText = h.content;
                }
                return {
                    role: h.role,
                    content: `[语音: ${voiceText}]`
                };
            } else if (h.type === 'voice_call_text') {
                let callText = '通话内容';
                try {
                    const data = JSON.parse(h.content);
                    callText = data.text || '通话内容';
                } catch(e) {
                    callText = h.content;
                }
                // 清洗可能残留的视频通话标签，防止污染普通聊天
                callText = callText.replace(/{{DESC}}[\s\S]*?{{\/DESC}}/gi, '')
                                   .replace(/{{DIALOGUE}}/gi, '')
                                   .replace(/{{\/DIALOGUE}}/gi, '')
                                   .replace(/{{.*?}}/g, '') // 移除其他可能的标签
                                   .trim();
                return { role: h.role, content: callText };
            } else if (h.type === 'gift_card') {
                let giftData = {};
                try {
                    giftData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {
                    giftData = { title: '礼物', price: '0' };
                }
                return { role: h.role, content: `[送出礼物：${giftData.title}，价值：${giftData.price}元] (这是我在闲鱼上看到你收藏的商品，特意买来送给你的)` };
            } else if (h.type === 'shopping_gift') {
                let giftData = {};
                try {
                    giftData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {}
                const items = giftData.items ? giftData.items.map(i => i.title).join(', ') : '礼物';
                return { role: h.role, content: `[送出礼物：${items}，总价值：${giftData.total}元] (这是我在购物APP购买并送给你的)` };
            } else if (h.type === 'icity_card') {
                let cardData = {};
                try {
                    cardData = typeof content === 'string' ? JSON.parse(content) : content;
                } catch(e) {}
                
                let authorInfo = `作者: ${cardData.authorName || '未知'}`;
                if (cardData.source === 'diary') {
                    authorInfo = `作者: 我(用户)`;
                }
                
                let commentsInfo = '';
                if (cardData.comments && cardData.comments.length > 0) {
                    // Limit to last 5 comments to avoid token limit
                    const recentComments = cardData.comments.slice(-5);
                    commentsInfo = '\n评论区:\n' + recentComments.map(c => `${c.name}: ${c.content}`).join('\n');
                }
                
                return { role: h.role, content: `[分享了 iCity 日记 (${authorInfo}): "${cardData.content || '内容'}"${commentsInfo}]` };
            } else {
                if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) {
                     try {
                         if (h.type === 'transfer') {
                             const data = JSON.parse(content);
                             return { role: h.role, content: `[转账: ${data.amount}元] (ID: ${data.id})` };
                         }
                     } catch(e) {}
                }
                return { role: h.role, content: content };
            }
        })
    ];

    if (instruction) {
        messages.push({
            role: 'system',
            content: `[系统提示]: ${instruction}`
        });
    }

    const titleEl = document.getElementById('chat-title');
    const originalTitle = titleEl.textContent;
    titleEl.textContent = '正在输入中...';

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: messages,
                temperature: settings.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('AI API Response:', data);

        if (data.error) {
            console.error('API Error Response:', data.error);
            throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        if (!data.choices || !data.choices.length || !data.choices[0].message) {
            console.error('Invalid API response structure:', data);
            throw new Error('API返回数据格式异常，请检查控制台日志');
        }

        let replyContent = data.choices[0].message.content;

        replyContent = replyContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                                   .replace(/<think>[\s\S]*?<\/think>/g, '')
                                   .trim();

        let actions = [];
        let thoughtContent = null;
        let messagesList = [];
        
        // 使用新的混合解析器
        const parsedItems = parseMixedAiResponse(replyContent);
        
        // 处理解析结果
        for (const item of parsedItems) {
            if (item.type === 'thought') {
                const t = item.content || '';
                thoughtContent = thoughtContent ? (thoughtContent + ' ' + t) : t;
            } else if (item.type === 'action') {
                // 转换 action 为旧的字符串格式以复用逻辑
                const cmd = item.content.command;
                const pl = item.content.payload;
                let actionStr = `ACTION: ${cmd}`;
                if (pl) {
                    actionStr += `: ${pl}`;
                }
                actions.push(actionStr);
            } else {
                // 消息, 表情包, 图片, 语音 等
                if (item.type === '消息' || item.type === 'text') {
                    // 二次解析文本中的混合内容（防止 AI 输出纯文本的表情包标签）
                    const subItems = forceSplitMixedContent(item.content);
                    messagesList.push(...subItems);
                } else {
                    messagesList.push(item);
                }
            }
        }

        // 兼容旧的 ACTION 和 心声 格式（如果解析器没处理）
        // parseMixedAiResponse 应该已经处理了大部分 JSON，但对于纯文本中的 ACTION 标记可能需要补充
        // 这里我们假设 AI 严格遵循 JSON 输出，但为了保险，扫描一下 text 类型的内容
        // 如果 text 内容包含 "ACTION:", 我们将其提取出来
        
        // Re-scan text messages for embedded actions (legacy fallback)
        const finalMessages = [];
        const actionRegex = /^[\s\*\-\>]*ACTION\s*[:：]\s*(.*)$/i;
        const thoughtRegex = /\[心声\s*[:：]\s*(.*?)\]/i;

        for (const msg of messagesList) {
            if (msg.type === '消息') {
                let lines = msg.content.split('\n');
                let cleanContent = '';
                
                for (let line of lines) {
                    let trimmedLine = line.trim();
                    
                    // Optimization: Do not skip empty lines to preserve formatting (paragraph breaks)
                    // if (!trimmedLine) continue; 

                    let actionMatch = trimmedLine.match(actionRegex);
                    let thoughtMatch = trimmedLine.match(thoughtRegex);

                    if (actionMatch) {
                        actions.push('ACTION: ' + actionMatch[1].trim());
                    } else if (thoughtMatch) {
                        const content = thoughtMatch[1].trim();
                        thoughtContent = thoughtContent ? (thoughtContent + ' ' + content) : content;
                    } else {
                        cleanContent += (cleanContent ? '\n' : '') + line;
                    }
                }
                
                if (cleanContent) {
                    // 如果清理后还有内容，保留消息
                    // 还要再次检查是否是 [类型:内容] 格式（如果 fallback 到 parseMixedContent）
                    // 但 parseMixedAiResponse 已经不做这个了。
                    // 保持简单，直接作为文本
                    finalMessages.push({ type: '消息', content: cleanContent });
                }
            } else {
                finalMessages.push(msg);
            }
        }
        messagesList = finalMessages;

        // 处理指令
        let imageToSend = null;
        let hasTransferred = false;
        
const momentRegex = /ACTION:\s*POST_MOMENT:\s*(.*?)(?:\n|$)/;
const icityDiaryRegex = /ACTION:\s*POST_ICITY_DIARY:\s*(.*?)(?:\n|$)/;
        const editIcityBookRegex = /ACTION:\s*EDIT_ICITY_BOOK:\s*(.*?)(?:\n|$)/;
        const likeRegex = /ACTION:\s*LIKE_MOMENT(?:\s*|$)/;
        const commentRegex = /ACTION:\s*COMMENT_MOMENT:\s*(.*?)(?:\n|$)/;
        const sendImageRegex = /ACTION:\s*SEND_IMAGE:\s*(.*?)(?:\n|$)/;
        const sendStickerRegex = /ACTION:\s*SEND_STICKER:\s*(.*?)(?:\n|$)/;
        const startVoiceCallRegex = /ACTION:\s*START_VOICE_CALL(?:\s*|$)/;
        const startVideoCallRegex = /ACTION:\s*START_VIDEO_CALL(?:\s*|$)/;
        const transferRegex = /ACTION:\s*TRANSFER:\s*(\d+(?:\.\d{1,2})?)\s*(.*?)(?:\n|$)/;
        const acceptTransferRegex = /ACTION:\s*ACCEPT_TRANSFER:\s*(\d+)(?:\n|$)/;
        const returnTransferRegex = /ACTION:\s*RETURN_TRANSFER:\s*(\d+)(?:\n|$)/;
        const payForRequestRegex = /ACTION:\s*PAY_FOR_REQUEST:\s*(.*?)(?:\n|$)/;
        const sendGiftRegex = /ACTION:\s*SEND_GIFT:\s*(.*?)(?:\n|$)/;
        const sendDeliveryRegex = /ACTION:\s*SEND_DELIVERY:\s*(.*?)(?:\n|$)/;
        const updateNameRegex = /ACTION:\s*UPDATE_NAME:\s*(.*?)(?:\n|$)/;
        const updateWxidRegex = /ACTION:\s*UPDATE_WXID:\s*(.*?)(?:\n|$)/;
        const updateSignatureRegex = /ACTION:\s*UPDATE_SIGNATURE:\s*(.*?)(?:\n|$)/;
        const updateAvatarRegex = /ACTION:\s*UPDATE_AVATAR(?:\s*|$)/;
        const quoteMessageRegex = /ACTION:\s*QUOTE_MESSAGE:\s*(.*?)(?:\n|$)/;
        const recordUserInfoRegex = /ACTION:\s*RECORD_USER_INFO:\s*(.*?)(?:\n|$)/;
        const sendVoiceRegex = /ACTION:\s*SEND_VOICE:\s*(\d+)\s*(.*?)(?:\n|$)/;
        const msClickRegex = /ACTION:\s*MINESWEEPER_CLICK:\s*(\d+)\s*,\s*(\d+)(?:\n|$)/;
        const msFlagRegex = /ACTION:\s*MINESWEEPER_FLAG:\s*(\d+)\s*,\s*(\d+)(?:\n|$)/;
        const witchGuessRegex = /ACTION:\s*WITCH_GUESS:\s*(\d+)\s*,\s*(\d+)(?:\n|$)/;
        const recordImportantStateRegex = /ACTION:\s*RECORD_IMPORTANT_STATE:\s*(.*?)(?:\n|$)/;

        let replyToObj = null;
        let hasUpdatedName = false;
        let hasUpdatedWxid = false;
        let hasUpdatedSignature = false;

        for (let i = 0; i < actions.length; i++) {
            let segment = actions[i];
            let processedSegment = segment;

            let recordImportantStateMatch;
            while ((recordImportantStateMatch = processedSegment.match(recordImportantStateRegex)) !== null) {
                let info = recordImportantStateMatch[1].trim();
                info = info.replace(/^(用户|我|他|她)(:|：|,|，|\s)?/, '').trim();
                if (info) {
                    if (!contact.importantStates) contact.importantStates = [];
                    // 简单查重
                    if (!contact.importantStates.includes(info)) {
                        contact.importantStates.push(info);
                        // 保持数量限制，比如最新的 5 条
                        if (contact.importantStates.length > 5) {
                            contact.importantStates.shift();
                        }
                        saveConfig();
                        showChatToast('重要状态已记录');
                    }
                }
                processedSegment = processedSegment.replace(recordImportantStateMatch[0], '');
            }

            let recordUserInfoMatch;
            while ((recordUserInfoMatch = processedSegment.match(recordUserInfoRegex)) !== null) {
                let info = recordUserInfoMatch[1].trim();
                info = info.replace(/^(用户|我|他|她)(:|：|,|，|\s)?/, '').trim();
                if (info) {
                    let userAiPrompt = '';
                    if (contact.userPersonaId) {
                        const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
                        if (p) userAiPrompt = p.aiPrompt || '';
                    }
                    let isDuplicate = false;
                    if (!contact.userPerception) contact.userPerception = [];
                    if (contact.userPerception.some(item => item.includes(info) || info.includes(item))) {
                        isDuplicate = true;
                    }
                    if (!isDuplicate && userAiPrompt) {
                        if (userAiPrompt.toLowerCase().includes(info.toLowerCase())) {
                            isDuplicate = true;
                        }
                    }
                    if (!isDuplicate) {
                        contact.userPerception.push(info);
                        saveConfig();
                        showChatToast('TA记住了');
                    }
                }
                processedSegment = processedSegment.replace(recordUserInfoMatch[0], '');
            }

            let quoteMessageMatch;
            while ((quoteMessageMatch = processedSegment.match(quoteMessageRegex)) !== null) {
                const quoteContent = quoteMessageMatch[1].trim();
                if (quoteContent) {
                    let targetMsg = null;
                    for (let j = history.length - 1; j >= 0; j--) {
                        const msg = history[j];
                        if (msg.content && typeof msg.content === 'string' && msg.content.includes(quoteContent)) {
                            targetMsg = msg;
                            break;
                        }
                    }
                    if (targetMsg) {
                        let targetName = '未知';
                        if (targetMsg.role === 'user') {
                            targetName = '我';
                            if (contact.userPersonaId) {
                                const p = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
                                if (p) targetName = p.name;
                            } else if (window.iphoneSimState.userProfile) {
                                targetName = window.iphoneSimState.userProfile.name;
                            }
                        } else {
                            targetName = contact.remark || contact.name;
                        }
                        replyToObj = {
                            name: targetName,
                            content: targetMsg.type === 'text' ? targetMsg.content : `[${targetMsg.type === 'sticker' ? '表情包' : '图片'}]`
                        };
                    }
                }
                processedSegment = processedSegment.replace(quoteMessageMatch[0], '');
            }

            let updateNameMatch;
            while ((updateNameMatch = processedSegment.match(updateNameRegex)) !== null) {
                const newName = updateNameMatch[1].trim();
                if (newName && !hasUpdatedName) {
                    contact.nickname = newName;
                    if (!contact.remark) {
                        document.getElementById('chat-title').textContent = newName;
                    }
                    saveConfig();
                    if (window.renderContactList) window.renderContactList();
                    setTimeout(() => sendMessage(`[系统消息]: 对方更改了网名为 "${newName}"`, false, 'text'), 500);
                    hasUpdatedName = true;
                }
                processedSegment = processedSegment.replace(updateNameMatch[0], '');
            }

            let updateWxidMatch;
            while ((updateWxidMatch = processedSegment.match(updateWxidRegex)) !== null) {
                const newWxid = updateWxidMatch[1].trim();
                if (newWxid && !hasUpdatedWxid) {
                    contact.wxid = newWxid;
                    saveConfig();
                    setTimeout(() => sendMessage(`[系统消息]: 对方更改了微信号`, false, 'text'), 500);
                    hasUpdatedWxid = true;
                }
                processedSegment = processedSegment.replace(updateWxidMatch[0], '');
            }

            let updateSignatureMatch;
            while ((updateSignatureMatch = processedSegment.match(updateSignatureRegex)) !== null) {
                const newSignature = updateSignatureMatch[1].trim();
                if (newSignature && !hasUpdatedSignature) {
                    contact.signature = newSignature;
                    saveConfig();
                    setTimeout(() => sendMessage(`[系统消息]: 对方更改了个性签名`, false, 'text'), 500);
                    hasUpdatedSignature = true;
                }
                processedSegment = processedSegment.replace(updateSignatureMatch[0], '');
            }

            let updateAvatarMatch;
            while ((updateAvatarMatch = processedSegment.match(updateAvatarRegex)) !== null) {
                // Find the last image sent by user
                let lastImageMsg = null;
                for (let j = history.length - 1; j >= 0; j--) {
                    if (history[j].role === 'user' && history[j].type === 'image') {
                        lastImageMsg = history[j];
                        break;
                    }
                }

                if (lastImageMsg && lastImageMsg.content) {
                    contact.avatar = lastImageMsg.content;
                    saveConfig();
                    
                    // Refresh UI
                    if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                    
                    // Update header avatar if needed
                    // (Header usually updates on chat open, but we can try to find the element)
                    // Actually, re-opening chat or just updating the img src in DOM would be better.
                    // But for simplicity, we rely on the system message to prompt user attention, 
                    // and next render will show new avatar.
                    // Or we can try to update the avatar in the message list if any are visible? 
                    // The messages use contact.avatar when rendering 'other' messages.
                    // We might need to refresh the current chat view to reflect the new avatar on old messages?
                    // renderChatHistory(contact.id, true); // Preserve scroll
                    
                    setTimeout(() => {
                        renderChatHistory(contact.id, true);
                        sendMessage(`[系统消息]: 对方更换了头像`, false, 'text');
                    }, 500);
                }
                processedSegment = processedSegment.replace(updateAvatarMatch[0], '');
            }

            let momentMatch;
            while ((momentMatch = processedSegment.match(momentRegex)) !== null) {
                const momentContent = momentMatch[1].trim();
                if (momentContent) {
                    if (window.addMoment) window.addMoment(contact.id, momentContent);
                }
                processedSegment = processedSegment.replace(momentMatch[0], '');
            }

            let icityDiaryMatch;
            while ((icityDiaryMatch = processedSegment.match(icityDiaryRegex)) !== null) {
                const diaryContent = icityDiaryMatch[1].trim();
                if (diaryContent) {
                    if (window.addIcityPost) window.addIcityPost(contact.id, diaryContent, 'friends');
                }
                processedSegment = processedSegment.replace(icityDiaryMatch[0], '');
            }

            let editIcityBookMatch;
            while ((editIcityBookMatch = processedSegment.match(editIcityBookRegex)) !== null) {
                const content = editIcityBookMatch[1].trim();
                if (content) {
                    if (window.writeToIcityBook) window.writeToIcityBook(contact.id, content);
                }
                processedSegment = processedSegment.replace(editIcityBookMatch[0], '');
            }

            let likeMatch;
            while ((likeMatch = processedSegment.match(likeRegex)) !== null) {
                const userMoments = window.iphoneSimState.moments.filter(m => m.contactId === 'me');
                if (userMoments.length > 0) {
                    const latestMoment = userMoments.sort((a, b) => b.time - a.time)[0];
                    const aiName = contact.remark || contact.name;
                    if (!latestMoment.likes || !latestMoment.likes.includes(aiName)) {
                        if (window.toggleLike) window.toggleLike(latestMoment.id, aiName);
                    }
                }
                processedSegment = processedSegment.replace(likeMatch[0], '');
            }

            let commentMatch;
            while ((commentMatch = processedSegment.match(commentRegex)) !== null) {
                const commentContent = commentMatch[1].trim();
                const userMoments = window.iphoneSimState.moments.filter(m => m.contactId === 'me');
                if (userMoments.length > 0 && commentContent) {
                    const latestMoment = userMoments.sort((a, b) => b.time - a.time)[0];
                    const aiName = contact.remark || contact.name;
                    if (window.submitComment) window.submitComment(latestMoment.id, commentContent, null, aiName);
                }
                processedSegment = processedSegment.replace(commentMatch[0], '');
            }

            let sendImageMatch;
            while ((sendImageMatch = processedSegment.match(sendImageRegex)) !== null) {
                const imageDesc = sendImageMatch[1].trim();
                if (imageDesc) {
                    imageToSend = { type: 'virtual_image', content: imageDesc };
                }
                processedSegment = processedSegment.replace(sendImageMatch[0], '');
            }

            let sendStickerMatch;
            while ((sendStickerMatch = processedSegment.match(sendStickerRegex)) !== null) {
                const stickerDesc = sendStickerMatch[1].trim();
                if (stickerDesc) {
                    let stickerUrl = null;
                    for (const cat of window.iphoneSimState.stickerCategories) {
                        if (contact.linkedStickerCategories && !contact.linkedStickerCategories.includes(cat.id)) {
                            continue;
                        }
                        const found = cat.list.find(s => s.desc === stickerDesc);
                        if (found) {
                            stickerUrl = found.url;
                            break;
                        }
                    }
                    
                    if (stickerUrl) {
                        imageToSend = { type: 'sticker', content: stickerUrl, desc: stickerDesc };
                    }
                }
                processedSegment = processedSegment.replace(sendStickerMatch[0], '');
            }

            let startVoiceCallMatch;
            while ((startVoiceCallMatch = processedSegment.match(startVoiceCallRegex)) !== null) {
                setTimeout(() => {
                    startIncomingCall(contact);
                }, 1500);
                processedSegment = processedSegment.replace(startVoiceCallMatch[0], '');
            }

            let startVideoCallMatch;
            while ((startVideoCallMatch = processedSegment.match(startVideoCallRegex)) !== null) {
                setTimeout(() => {
                    startIncomingVideoCall(contact);
                }, 1500);
                processedSegment = processedSegment.replace(startVideoCallMatch[0], '');
            }

            let sendVoiceMatch;
            while ((sendVoiceMatch = processedSegment.match(sendVoiceRegex)) !== null) {
                const duration = sendVoiceMatch[1];
                const text = sendVoiceMatch[2].trim();
                if (text) {
                    setTimeout(() => {
                        const voiceData = {
                            duration: parseInt(duration),
                            text: text,
                            isReal: false,
                            audio: null
                        };
                        sendMessage(JSON.stringify(voiceData), false, 'voice');
                    }, 1500);
                }
                processedSegment = processedSegment.replace(sendVoiceMatch[0], '');
            }

            let msClickMatch;
            while ((msClickMatch = processedSegment.match(msClickRegex)) !== null) {
                const r = msClickMatch[1];
                const c = msClickMatch[2];
                if (window.handleAiMinesweeperMove) {
                    window.handleAiMinesweeperMove('CLICK', r, c);
                }
                processedSegment = processedSegment.replace(msClickMatch[0], '');
            }

            let msFlagMatch;
            while ((msFlagMatch = processedSegment.match(msFlagRegex)) !== null) {
                const r = msFlagMatch[1];
                const c = msFlagMatch[2];
                if (window.handleAiMinesweeperMove) {
                    window.handleAiMinesweeperMove('FLAG', r, c);
                }
                processedSegment = processedSegment.replace(msFlagMatch[0], '');
            }

            let witchGuessMatch;
            while ((witchGuessMatch = processedSegment.match(witchGuessRegex)) !== null) {
                const r = witchGuessMatch[1];
                const c = witchGuessMatch[2];
                if (window.handleAiWitchGuess) {
                    // Delay slightly to look natural
                    setTimeout(() => {
                        window.handleAiWitchGuess(r, c);
                    }, 1000);
                }
                processedSegment = processedSegment.replace(witchGuessMatch[0], '');
            }

            let transferMatch;
            while ((transferMatch = processedSegment.match(transferRegex)) !== null) {
                if (!hasTransferred) {
                    const amount = transferMatch[1];
                    const remark = transferMatch[2].trim();
                    setTimeout(() => {
                        const transferId = Date.now() + Math.floor(Math.random() * 1000);
                        sendMessage(JSON.stringify({ id: transferId, amount, remark: remark || '转账给您', status: 'pending' }), false, 'transfer');
                    }, 1000);
                    hasTransferred = true;
                }
                processedSegment = processedSegment.replace(transferMatch[0], '');
            }

            let acceptTransferMatch;
            while ((acceptTransferMatch = processedSegment.match(acceptTransferRegex)) !== null) {
                const transferId = parseInt(acceptTransferMatch[1]);
                if (transferId) {
                    setTimeout(() => {
                        if (window.updateTransferStatus) window.updateTransferStatus(transferId, 'accepted');
                        sendMessage('[系统消息]: 对方已收款', false, 'text');
                    }, 1000);
                }
                processedSegment = processedSegment.replace(acceptTransferMatch[0], '');
            }

            let returnTransferMatch;
            while ((returnTransferMatch = processedSegment.match(returnTransferRegex)) !== null) {
                const transferId = parseInt(returnTransferMatch[1]);
                if (transferId) {
                    setTimeout(() => {
                        if (window.updateTransferStatus) window.updateTransferStatus(transferId, 'returned');
                        if (window.handleAiReturnTransfer) window.handleAiReturnTransfer(transferId);
                        sendMessage('[系统消息]: 转账已退还', false, 'text');
                    }, 1000);
                }
                processedSegment = processedSegment.replace(returnTransferMatch[0], '');
            }

            let payForRequestMatch;
            while ((payForRequestMatch = processedSegment.match(payForRequestRegex)) !== null) {
                const requestId = payForRequestMatch[1].trim();
                if (requestId) {
                    const history = window.iphoneSimState.chatHistory[contact.id] || [];
                    let targetMsg = null;
                    for (let j = history.length - 1; j >= 0; j--) {
                        const msg = history[j];
                        if (msg.type === 'pay_request') {
                            let data = null;
                            try { data = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content; } catch(e){}
                            if (data && data.id === requestId) {
                                targetMsg = msg;
                                break;
                            }
                        }
                    }

                    if (targetMsg) {
                        setTimeout(() => {
                            let data = typeof targetMsg.content === 'string' ? JSON.parse(targetMsg.content) : targetMsg.content;
                            if (data.status !== 'paid') {
                                data.status = 'paid';
                                targetMsg.content = JSON.stringify(data);
                                if (window.handlePayForRequest) {
                                    window.handlePayForRequest(requestId, contact.name, data);
                                }
                                saveConfig();
                                renderChatHistory(contact.id, true);
                                sendMessage('[系统消息]: 对方已帮你付款', false, 'text');
                            }
                        }, 1500);
                    }
                }
                processedSegment = processedSegment.replace(payForRequestMatch[0], '');
            }

            let sendGiftMatch;
            while ((sendGiftMatch = processedSegment.match(sendGiftRegex)) !== null) {
                const payload = sendGiftMatch[1].trim();
                const parts = payload.split('|').map(s => s.trim());
                if (parts.length >= 2) {
                    const title = parts[0];
                    const price = parseFloat(parts[1]) || 0;
                    const remark = parts[2] || '';
                    
                    // 生成占位图
                    let imgUrl = '';
                    if (typeof generatePlaceholderImage === 'function') {
                        let bgColor = '#FF9500';
                        if (window.getRandomPastelColor) {
                            bgColor = window.getRandomPastelColor();
                        }
                        imgUrl = generatePlaceholderImage(300, 300, title, bgColor);
                    } else {
                        imgUrl = 'https://placehold.co/300x300/FF9500/ffffff?text=' + encodeURIComponent(title);
                    }

                    const giftData = {
                        items: [{
                            title: title,
                            price: price,
                            image: imgUrl,
                            isDelivery: false
                        }],
                        total: price.toFixed(2),
                        remark: remark
                    };
                    
                    setTimeout(() => {
                        sendMessage(JSON.stringify(giftData), false, 'shopping_gift');
                    }, 1000);
                }
                processedSegment = processedSegment.replace(sendGiftMatch[0], '');
            }

            let sendDeliveryMatch;
            while ((sendDeliveryMatch = processedSegment.match(sendDeliveryRegex)) !== null) {
                const payload = sendDeliveryMatch[1].trim();
                const parts = payload.split('|').map(s => s.trim());
                if (parts.length >= 2) {
                    const title = parts[0];
                    const price = parseFloat(parts[1]) || 0;
                    const remark = parts[2] || '';
                    
                    let imgUrl = '';
                    if (typeof generatePlaceholderImage === 'function') {
                        imgUrl = generatePlaceholderImage(300, 300, title, '#007AFF');
                    } else {
                        imgUrl = 'https://placehold.co/300x300/007AFF/ffffff?text=' + encodeURIComponent(title);
                    }

                    const deliveryData = {
                        items: [{
                            title: title,
                            price: price,
                            image: imgUrl,
                            isDelivery: true
                        }],
                        total: price.toFixed(2),
                        remark: remark
                    };
                    
                    setTimeout(() => {
                        sendMessage(JSON.stringify(deliveryData), false, 'delivery_share');
                    }, 1000);
                }
                processedSegment = processedSegment.replace(sendDeliveryMatch[0], '');
            }
        }

        if (thoughtContent && contact.showThought) {
            updateThoughtBubble(thoughtContent);
        }

        // 逐条发送消息
        for (let i = 0; i < messagesList.length; i++) {
            const msg = messagesList[i];
            const currentThought = (i === messagesList.length - 1) ? thoughtContent : null;
            const currentReplyTo = (i === 0) ? replyToObj : null;

            // 检查用户是否仍在当前聊天界面
            const isChatOpen = !document.getElementById('chat-screen').classList.contains('hidden');
            const isSameContact = window.iphoneSimState.currentChatContactId === contact.id;
            const shouldShowInChat = isChatOpen && isSameContact;

            if (shouldShowInChat) {
                // 如果用户在聊天界面但页面被隐藏/最小化，仍然发送系统通知
                if (document.hidden) {
                    let notifContent = msg.content;
                    if (msg.type === '表情包') notifContent = '[表情包]';
                    else if (msg.type === '图片') notifContent = '[图片]';
                    else if (msg.type === '语音') notifContent = '[语音]';
                    else if (msg.type === 'virtual_image') notifContent = '[图片]';
                    else if (msg.type === 'sticker') notifContent = '[表情包]';
                    
                    sendSystemNotification(contact, notifContent);
                }

                // 用户在聊天界面，使用打字机效果或直接发送
                if (msg.type === '消息' || msg.type === 'text') {
                    await typewriterEffect(msg.content, contact.avatar, currentThought, currentReplyTo, 'text', contactId);
                } else if (msg.type === '表情包' || msg.type === 'sticker') {
                    // 尝试查找表情包 URL
                    let stickerUrl = null;
                    if (window.iphoneSimState.stickerCategories) {
                        let allowedIds = null;
                        if (Array.isArray(contact.linkedStickerCategories)) allowedIds = contact.linkedStickerCategories;

                        for (const cat of window.iphoneSimState.stickerCategories) {
                            if (allowedIds !== null && !allowedIds.includes(cat.id)) continue;

                            const found = cat.list.find(s => s.desc === msg.content || s.desc.includes(msg.content));
                            if (found) {
                                stickerUrl = found.url;
                                break;
                            }
                        }
                    }
                    if (stickerUrl) {
                        sendMessage(stickerUrl, false, 'sticker', msg.content, contactId);
                    } else {
                        // 找不到表情包，降级为文本
                        await typewriterEffect(`[表情包: ${msg.content}]`, contact.avatar, currentThought, currentReplyTo, 'text', contactId);
                    }
                } else if (msg.type === '语音' || msg.type === 'voice') {
                    let duration = 3;
                    let text = msg.content;
                    
                    if (typeof msg.content === 'string') {
                        const parts = msg.content.match(/(\d+)\s+(.*)/);
                        if (parts) {
                            duration = parseInt(parts[1]);
                            text = parts[2];
                        }
                    }
                    
                    const voiceData = {
                        duration: duration,
                        text: text,
                        isReal: false
                    };
                    sendMessage(JSON.stringify(voiceData), false, 'voice', null, contactId);
                } else if (msg.type === '图片' || msg.type === 'image') {
                    const defaultImageUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                    sendMessage(defaultImageUrl, false, 'virtual_image', msg.content, contactId);
                } else if (msg.type === '旁白' || msg.type === 'description') {
                    await typewriterEffect(msg.content, contact.avatar, null, null, 'description', contactId);
                }
            } else {
                // 用户不在聊天界面，后台保存并弹窗
                let contentToSave = msg.content;
                let typeToSave = 'text';
                
                if (msg.type === '消息' || msg.type === 'text') {
                    typeToSave = 'text';
                } else if (msg.type === '表情包' || msg.type === 'sticker') {
                    let stickerUrl = null;
                    if (window.iphoneSimState.stickerCategories) {
                        let allowedIds = null;
                        if (Array.isArray(contact.linkedStickerCategories)) allowedIds = contact.linkedStickerCategories;

                        for (const cat of window.iphoneSimState.stickerCategories) {
                            if (allowedIds !== null && !allowedIds.includes(cat.id)) continue;

                            const found = cat.list.find(s => s.desc === msg.content || s.desc.includes(msg.content));
                            if (found) {
                                stickerUrl = found.url;
                                break;
                            }
                        }
                    }
                    if (stickerUrl) {
                        contentToSave = stickerUrl;
                        typeToSave = 'sticker';
                    } else {
                        contentToSave = `[表情包: ${msg.content}]`;
                        typeToSave = 'text';
                    }
                } else if (msg.type === '语音' || msg.type === 'voice') {
                    let duration = 3;
                    let text = msg.content;
                    
                    if (typeof msg.content === 'string') {
                        const parts = msg.content.match(/(\d+)\s+(.*)/);
                        if (parts) {
                            duration = parseInt(parts[1]);
                            text = parts[2];
                        }
                    }

                    const voiceData = {
                        duration: duration,
                        text: text,
                        isReal: false
                    };
                    contentToSave = JSON.stringify(voiceData);
                    typeToSave = 'voice';
                } else if (msg.type === '图片' || msg.type === 'image') {
                    contentToSave = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                    typeToSave = 'virtual_image';
                } else if (msg.type === '旁白' || msg.type === 'description') {
                    typeToSave = 'description';
                }

                // 保存到历史记录
                if (!window.iphoneSimState.chatHistory[contact.id]) {
                    window.iphoneSimState.chatHistory[contact.id] = [];
                }
                
                const msgData = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    time: Date.now(),
                    role: 'assistant',
                    content: contentToSave,
                    type: typeToSave,
                    replyTo: currentReplyTo
                };
                
                if (currentThought) {
                    msgData.thought = currentThought;
                }
                
                if (msg.type === '图片' || msg.type === 'sticker') {
                    msgData.description = msg.content; // 保存描述
                }

                window.iphoneSimState.chatHistory[contact.id].push(msgData);
                saveConfig();
                
                // 触发通知
                let notificationText = contentToSave;
                if (typeToSave === 'sticker') notificationText = '[表情包]';
                if (typeToSave === 'virtual_image' || typeToSave === 'image') notificationText = '[图片]';
                if (typeToSave === 'voice') notificationText = '[语音]';
                
                showChatNotification(contact.id, notificationText);
                
                // 刷新联系人列表以更新预览
                if (window.renderContactList) {
                    // 只有当联系人列表可见时才刷新，或者强制刷新
                    window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
                }
            }

            // 模拟间隔
            if (i < messagesList.length - 1) {
                let delay;
                if (contact.replyIntervalMin !== undefined && contact.replyIntervalMin !== null && 
                    contact.replyIntervalMax !== undefined && contact.replyIntervalMax !== null) {
                    const min = contact.replyIntervalMin;
                    const max = Math.max(contact.replyIntervalMax, min);
                    delay = min + Math.random() * (max - min);
                } else {
                    // 默认逻辑：第一条消息稍微慢一点(900-2200ms)，后续消息快一点(400-800ms)
                    delay = (i === 0) ? (900 + Math.random() * 1300) : (400 + Math.random() * 400);
                }
                await new Promise(r => setTimeout(r, delay));
            }
        }
        await new Promise(r => setTimeout(r, 500));

        if (imageToSend) {
            if (imageToSend.type === 'virtual_image') {
                const defaultImageUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                sendMessage(defaultImageUrl, false, 'virtual_image', imageToSend.content, contactId);
            } else if (imageToSend.type === 'sticker') {
                sendMessage(imageToSend.content, false, 'sticker', imageToSend.desc, contactId);
            }
        }

    } catch (error) {
        console.error('AI生成失败:', error);
        // 显示具体的错误信息
        alert(`AI生成失败: ${error.message}\n请检查配置和API状态`);
        // 同时在聊天界面显示系统消息
        appendMessageToUI(`[系统错误]: AI生成失败 - ${error.message}`, false, 'text', null, null, null, null, false);
    } finally {
        const currentContact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        if (currentContact) {
            titleEl.textContent = currentContact.remark || currentContact.name;
        } else {
            titleEl.textContent = originalTitle;
        }
    }
}

function typewriterEffect(text, avatarUrl, thought = null, replyTo = null, type = 'text', targetContactId = null) {
    return new Promise(resolve => {
        const contactId = targetContactId || window.iphoneSimState.currentChatContactId;
        if (!contactId) {
            resolve();
            return;
        }

        if (!window.iphoneSimState.chatHistory[contactId]) {
            window.iphoneSimState.chatHistory[contactId] = [];
        }
        
        const msgData = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            time: Date.now(),
            role: 'assistant',
            content: text,
            type: type,
            replyTo: replyTo
        };
        
        if (thought) {
            msgData.thought = thought;
        }
        
        window.iphoneSimState.chatHistory[contactId].push(msgData);
        
        const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
        if (contact) {
            if (contact.autoItineraryEnabled) {
                if (typeof contact.messagesSinceLastItinerary !== 'number') {
                    contact.messagesSinceLastItinerary = 0;
                }
                contact.messagesSinceLastItinerary++;
                
                if (contact.messagesSinceLastItinerary >= (contact.autoItineraryInterval || 10)) {
                    if (window.generateNewItinerary) {
                        window.generateNewItinerary(contact);
                        contact.messagesSinceLastItinerary = 0;
                    }
                }
            } else {
                contact.messagesSinceLastItinerary = 0;
            }
        }

        saveConfig();
        
        if (window.iphoneSimState.currentChatContactId === contactId) {
            appendMessageToUI(text, false, type, null, replyTo, msgData.id, msgData.time);
            scrollToBottom();
        }

        if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        
        if (window.checkAndSummarize) window.checkAndSummarize(contactId);

        resolve();
    });
}

function handleRegenerateReply() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    if (!history || history.length === 0) {
        alert('没有聊天记录，无法重回');
        return;
    }

    document.getElementById('chat-more-panel').classList.add('hidden');

    let hasDeleted = false;
    while (history.length > 0) {
        const lastMsg = history[history.length - 1];
        if (lastMsg.role === 'assistant') {
            history.pop();
            hasDeleted = true;
        } else {
            break;
        }
    }

    if (hasDeleted) {
        saveConfig();
        renderChatHistory(window.iphoneSimState.currentChatContactId);
    }
    
    generateAiReply('请严格遵守JSON格式输出。如果开启了心声(thought)，必须先输出心声（角色的心理活动）。请务必将长回复拆分为多条短消息。');
}

function handleTransfer() {
    const amountStr = document.getElementById('transfer-amount').value.trim();
    const remark = document.getElementById('transfer-remark').value.trim();

    if (!amountStr || isNaN(amountStr) || parseFloat(amountStr) <= 0) {
        alert('请输入有效的金额');
        return;
    }
    
    const amount = parseFloat(amountStr);

    if (!window.iphoneSimState.wallet) window.iphoneSimState.wallet = { balance: 0.00, transactions: [] };
    if (window.iphoneSimState.wallet.balance < amount) {
        alert('余额不足，请先充值');
        return;
    }

    window.iphoneSimState.wallet.balance -= amount;
    window.iphoneSimState.wallet.transactions.unshift({
        id: Date.now(),
        type: 'expense',
        amount: amount,
        title: '转账支出',
        time: Date.now(),
        relatedId: null
    });

    const transferId = Date.now() + Math.floor(Math.random() * 1000);
    
    window.iphoneSimState.wallet.transactions[0].relatedId = transferId;
    
    const transferData = {
        id: transferId,
        amount: amount.toFixed(2),
        remark: remark || '转账给您',
        status: 'pending'
    };

    sendMessage(JSON.stringify(transferData), true, 'transfer');
    document.getElementById('transfer-modal').classList.add('hidden');
    saveConfig();
}

function handleChatCamera() {
    const description = prompt('请输入图片描述：');
    if (description) {
        const defaultImageUrl = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
        sendMessage(defaultImageUrl, true, 'virtual_image', description);
        
        document.getElementById('chat-more-panel').classList.add('hidden');
    }
}

function handleChatPhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        sendMessage(base64, true, 'image');
        document.getElementById('chat-more-panel').classList.add('hidden');
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

// --- AI 设置相关 ---

function setupAiListeners(isSecondary) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    
    const aiApiUrl = document.getElementById(`ai-api-url${suffix}`);
    if (aiApiUrl) aiApiUrl.addEventListener('change', (e) => {
        window.iphoneSimState[settingsKey].url = e.target.value;
        saveConfig();
    });

    const aiApiKey = document.getElementById(`ai-api-key${suffix}`);
    if (aiApiKey) aiApiKey.addEventListener('change', (e) => {
        window.iphoneSimState[settingsKey].key = e.target.value;
        saveConfig();
    });

    const fetchModelsBtn = document.getElementById(`fetch-models${suffix}`);
    if (fetchModelsBtn) fetchModelsBtn.addEventListener('click', () => handleFetchModels(isSecondary));

    const aiModelSelect = document.getElementById(`ai-model-select${suffix}`);
    if (aiModelSelect) aiModelSelect.addEventListener('change', (e) => {
        window.iphoneSimState[settingsKey].model = e.target.value;
        saveConfig();
    });

    const aiTemperature = document.getElementById(`ai-temperature${suffix}`);
    if (aiTemperature) aiTemperature.addEventListener('input', (e) => {
        window.iphoneSimState[settingsKey].temperature = parseFloat(e.target.value);
        document.getElementById(`ai-temp-value${suffix}`).textContent = window.iphoneSimState[settingsKey].temperature;
        saveConfig();
    });

    const saveAiPresetBtn = document.getElementById(`save-ai-preset${suffix}`);
    if (saveAiPresetBtn) saveAiPresetBtn.addEventListener('click', () => handleSaveAiPreset(isSecondary));

    const deleteAiPresetBtn = document.getElementById(`delete-ai-preset${suffix}`);
    if (deleteAiPresetBtn) deleteAiPresetBtn.addEventListener('click', () => handleDeleteAiPreset(isSecondary));

    const aiPresetSelect = document.getElementById(`ai-preset-select${suffix}`);
    if (aiPresetSelect) aiPresetSelect.addEventListener('change', (e) => handleApplyAiPreset(e, isSecondary));
}

function setupWhisperListeners() {
    const urlInput = document.getElementById('whisper-api-url');
    const keyInput = document.getElementById('whisper-api-key');
    const modelInput = document.getElementById('whisper-model');
    const modeSelect = document.getElementById('whisper-connection-mode');
    const fetchModelsBtn = document.getElementById('fetch-whisper-models');
    const modelSelect = document.getElementById('whisper-model-select');

    if (modeSelect && window.iphoneSimState.whisperSettings.url) {
        if (window.iphoneSimState.whisperSettings.url.includes('siliconflow.cn')) {
            modeSelect.value = 'siliconflow';
        } else {
            modeSelect.value = 'custom';
        }
    }

    if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
            const mode = e.target.value;
            if (mode === 'siliconflow') {
                const siliconflowUrl = 'https://api.siliconflow.cn/v1';
                urlInput.value = siliconflowUrl;
                window.iphoneSimState.whisperSettings.url = siliconflowUrl;
                // 自动推荐 SiliconFlow 的免费模型
                if (modelInput && (modelInput.value === 'whisper-1' || !modelInput.value)) {
                    const recommendModel = 'FunAudioLLM/SenseVoiceSmall';
                    modelInput.value = recommendModel;
                    window.iphoneSimState.whisperSettings.model = recommendModel;
                    if (window.showChatToast) {
                        window.showChatToast(`已自动切换为 SiliconFlow 免费模型: ${recommendModel}`);
                    } else {
                        alert(`已自动切换为 SiliconFlow 免费模型: ${recommendModel}`);
                    }
                }
            } else {
                if (urlInput.value.includes('siliconflow.cn')) {
                    urlInput.value = '';
                    window.iphoneSimState.whisperSettings.url = '';
                }
            }
            saveConfig();
        });
    }

    if (urlInput) {
        urlInput.value = window.iphoneSimState.whisperSettings.url || '';
        urlInput.addEventListener('change', (e) => {
            window.iphoneSimState.whisperSettings.url = e.target.value;
            if (modeSelect) {
                if (e.target.value.includes('siliconflow.cn')) {
                    modeSelect.value = 'siliconflow';
                } else {
                    modeSelect.value = 'custom';
                }
            }
            saveConfig();
        });
    }

    if (keyInput) {
        keyInput.value = window.iphoneSimState.whisperSettings.key || '';
        keyInput.addEventListener('change', (e) => {
            window.iphoneSimState.whisperSettings.key = e.target.value;
            saveConfig();
        });
    }

    if (modelInput) {
        modelInput.value = window.iphoneSimState.whisperSettings.model || 'whisper-1';
        modelInput.addEventListener('change', (e) => {
            window.iphoneSimState.whisperSettings.model = e.target.value;
            saveConfig();
        });
    }

    if (fetchModelsBtn) {
        fetchModelsBtn.addEventListener('click', handleFetchWhisperModels);
    }

    if (modelSelect) {
        modelSelect.addEventListener('change', (e) => {
            const selectedModel = e.target.value;
            if (selectedModel) {
                modelInput.value = selectedModel;
                window.iphoneSimState.whisperSettings.model = selectedModel;
                saveConfig();
            }
        });
    }
}

function setupMinimaxListeners() {
    const groupIdInput = document.getElementById('minimax-group-id');
    const apiKeyInput = document.getElementById('minimax-api-key');
    const modelInput = document.getElementById('minimax-model');
    const modelSelect = document.getElementById('minimax-model-select');

    if (groupIdInput) {
        groupIdInput.value = window.iphoneSimState.minimaxSettings.groupId || '';
        groupIdInput.addEventListener('change', (e) => {
            window.iphoneSimState.minimaxSettings.groupId = e.target.value;
            saveConfig();
        });
    }

    if (apiKeyInput) {
        apiKeyInput.value = window.iphoneSimState.minimaxSettings.key || '';
        apiKeyInput.addEventListener('change', (e) => {
            window.iphoneSimState.minimaxSettings.key = e.target.value;
            saveConfig();
        });
    }

    if (modelInput) {
        modelInput.value = window.iphoneSimState.minimaxSettings.model || 'speech-01-turbo';
        modelInput.addEventListener('change', (e) => {
            window.iphoneSimState.minimaxSettings.model = e.target.value;
            if (modelSelect) {
                modelSelect.value = e.target.value;
            }
            saveConfig();
        });
    }

    if (modelSelect) {
        if (window.iphoneSimState.minimaxSettings.model) {
            modelSelect.value = window.iphoneSimState.minimaxSettings.model;
        }
        
        modelSelect.addEventListener('change', (e) => {
            const selectedModel = e.target.value;
            if (selectedModel) {
                if (modelInput) modelInput.value = selectedModel;
                window.iphoneSimState.minimaxSettings.model = selectedModel;
                saveConfig();
            }
        });
    }
}

async function generateMinimaxTTS(text, voiceId) {
    const settings = window.iphoneSimState.minimaxSettings;
    
    console.log('Generating Minimax TTS...', {
        url: settings.url,
        hasKey: !!settings.key,
        groupId: settings.groupId,
        model: settings.model,
        text: text,
        voiceId: voiceId
    });

    if (!settings.key) {
        alert('Minimax API Key 未配置');
        return null;
    }
    
    let url = settings.url;
    if (settings.groupId) {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}GroupId=${settings.groupId}`;
    } else {
        console.warn('Minimax GroupID is empty. Request might fail.');
    }

    try {
        console.log('Requesting Minimax TTS URL:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${settings.key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: settings.model || 'speech-01-turbo',
                text: text,
                stream: false,
                voice_setting: {
                    voice_id: voiceId || 'male-qn-qingse',
                    speed: 1.0,
                    vol: 1.0,
                    pitch: 0
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`Minimax API HTTP Error: ${response.status}`, errText);
            alert(`语音生成失败 (HTTP ${response.status}): ${errText}`);
            return null;
        }

        const data = await response.json();
        console.log('Minimax API Response:', data);

        if (data.base_resp && data.base_resp.status_code !== 0) {
            console.error('Minimax API returned error:', data.base_resp);
            alert(`语音生成API错误: ${data.base_resp.status_msg} (Code: ${data.base_resp.status_code})`);
            return null;
        }
        
        if (data.data && data.data.audio) {
            const hexAudio = data.data.audio;
            const match = hexAudio.match(/.{1,2}/g);
            if (!match) {
                 console.error('Invalid hex audio data');
                 return null;
            }
            const bytes = new Uint8Array(match.map(byte => parseInt(byte, 16)));
            
            const blob = new Blob([bytes], { type: 'audio/mp3' });
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(blob);
            });
        } else if (data.base64) {
            return `data:audio/mp3;base64,${data.base64}`;
        } else if (data.audio) {
             return `data:audio/mp3;base64,${data.audio}`;
        } else {
            console.error('Minimax response format unknown:', JSON.stringify(data));
            alert('语音生成失败：未知的响应格式，请检查控制台日志');
            return null;
        }

    } catch (error) {
        console.error('Minimax TTS generation failed:', error);
        alert(`语音生成异常: ${error.message}`);
        return null;
    }
}

async function handleFetchWhisperModels() {
    const url = window.iphoneSimState.whisperSettings.url;
    const key = window.iphoneSimState.whisperSettings.key;
    const btn = document.getElementById('fetch-whisper-models');
    const select = document.getElementById('whisper-model-select');

    if (!url) {
        alert('请先输入API地址');
        return;
    }

    const originalText = btn.textContent;
    btn.textContent = '拉取中...';
    btn.disabled = true;

    try {
        let fetchUrl = url;
        if (fetchUrl.endsWith('/')) {
            fetchUrl = fetchUrl.slice(0, -1);
        }
        
        if (!fetchUrl.endsWith('/models')) {
            if (fetchUrl.endsWith('/v1')) {
                fetchUrl += '/models';
            } else {
                fetchUrl += '/models';
            }
        }

        const headers = {};
        if (key) {
            headers['Authorization'] = `Bearer ${key}`;
        }

        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const models = data.data || data.models || [];

        select.innerHTML = '<option value="">请选择模型</option>';
        
        if (models.length === 0) {
            alert('未获取到模型列表');
            return;
        }

        models.forEach(model => {
            const id = model.id || model;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            select.appendChild(option);
        });

        select.classList.remove('hidden');
        alert(`成功获取 ${models.length} 个模型`);

    } catch (error) {
        console.error('获取Whisper模型失败:', error);
        alert('获取模型失败，请检查API地址和密钥是否正确，或跨域设置。');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

async function handleFetchModels(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    
    const url = window.iphoneSimState[settingsKey].url;
    const key = window.iphoneSimState[settingsKey].key;

    if (!url) {
        alert('请先输入API地址');
        return;
    }

    const btn = document.getElementById(`fetch-models${suffix}`);
    const originalText = btn.textContent;
    btn.textContent = '拉取中...';
    btn.disabled = true;

    try {
        let fetchUrl = url;
        if (!fetchUrl.endsWith('/models')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'models' : fetchUrl + '/models';
        }

        const headers = {};
        if (key) {
            // 清理 Key，移除可能包含的非 ASCII 字符（如中文）
            const cleanKey = key.replace(/[^\x00-\x7F]/g, "").trim();
            headers['Authorization'] = `Bearer ${cleanKey}`;
        }

        const response = await fetch(fetchUrl, { headers });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const models = data.data || data.models || [];

        const select = document.getElementById(`ai-model-select${suffix}`);
        select.innerHTML = '<option value="">请选择模型</option>';
        
        models.forEach(model => {
            const id = model.id || model;
            const option = document.createElement('option');
            option.value = id;
            option.textContent = id;
            select.appendChild(option);
        });

        alert(`成功获取 ${models.length} 个模型`);
        
        if (window.iphoneSimState[settingsKey].model) {
            select.value = window.iphoneSimState[settingsKey].model;
        }

    } catch (error) {
        console.error('获取模型失败:', error);
        alert('获取模型失败，请检查API地址和密钥是否正确，或跨域设置。');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

function handleSaveAiPreset(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const name = prompt('请输入AI配置预设名称：');
    if (!name) return;

    const preset = {
        name: name,
        settings: { ...window.iphoneSimState[settingsKey] }
    };

    window.iphoneSimState[presetsKey].push(preset);
    saveConfig();
    renderAiPresets(isSecondary);
    document.getElementById(`ai-preset-select${suffix}`).value = name;
    alert('AI预设已保存');
}

function handleDeleteAiPreset(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const select = document.getElementById(`ai-preset-select${suffix}`);
    const name = select.value;
    if (!name) return;

    if (confirm(`确定要删除预设 "${name}" 吗？`)) {
        window.iphoneSimState[presetsKey] = window.iphoneSimState[presetsKey].filter(p => p.name !== name);
        saveConfig();
        renderAiPresets(isSecondary);
    }
}

function handleApplyAiPreset(e, isSecondary = false) {
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const name = e.target.value;
    if (!name) return;

    const preset = window.iphoneSimState[presetsKey].find(p => p.name === name);
    if (preset) {
        window.iphoneSimState[settingsKey] = { ...preset.settings };
        updateAiUi(isSecondary);
        saveConfig();
    }
}

function renderAiPresets(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const presetsKey = isSecondary ? 'aiPresets2' : 'aiPresets';
    
    const select = document.getElementById(`ai-preset-select${suffix}`);
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">-- 选择预设 --</option>';

    if (window.iphoneSimState[presetsKey]) {
        window.iphoneSimState[presetsKey].forEach(preset => {
            const option = document.createElement('option');
            option.value = preset.name;
            option.textContent = preset.name;
            select.appendChild(option);
        });
    }

    if (currentValue && window.iphoneSimState[presetsKey].some(p => p.name === currentValue)) {
        select.value = currentValue;
    }
}

function updateAiUi(isSecondary = false) {
    const suffix = isSecondary ? '-2' : '';
    const settingsKey = isSecondary ? 'aiSettings2' : 'aiSettings';
    
    const urlInput = document.getElementById(`ai-api-url${suffix}`);
    const keyInput = document.getElementById(`ai-api-key${suffix}`);
    const modelSelect = document.getElementById(`ai-model-select${suffix}`);
    const tempInput = document.getElementById(`ai-temperature${suffix}`);
    const tempValue = document.getElementById(`ai-temp-value${suffix}`);

    if (urlInput) urlInput.value = window.iphoneSimState[settingsKey].url || '';
    if (keyInput) keyInput.value = window.iphoneSimState[settingsKey].key || '';
    if (tempInput) tempInput.value = window.iphoneSimState[settingsKey].temperature || 0.7;
    if (tempValue) tempValue.textContent = window.iphoneSimState[settingsKey].temperature || 0.7;
    
    if (modelSelect && window.iphoneSimState[settingsKey].model) {
        if (!modelSelect.querySelector(`option[value="${window.iphoneSimState[settingsKey].model}"]`)) {
            const option = document.createElement('option');
            option.value = window.iphoneSimState[settingsKey].model;
            option.textContent = window.iphoneSimState[settingsKey].model;
            modelSelect.appendChild(option);
        }
        modelSelect.value = window.iphoneSimState[settingsKey].model;
    }
}

window.updateWhisperUi = function() {
    const urlInput = document.getElementById('whisper-api-url');
    const keyInput = document.getElementById('whisper-api-key');
    const modelInput = document.getElementById('whisper-model');
    const modeSelect = document.getElementById('whisper-connection-mode');
    const modelSelect = document.getElementById('whisper-model-select');

    if (urlInput) urlInput.value = window.iphoneSimState.whisperSettings.url || '';
    if (keyInput) keyInput.value = window.iphoneSimState.whisperSettings.key || '';
    if (modelInput) modelInput.value = window.iphoneSimState.whisperSettings.model || 'whisper-1';

    if (modeSelect && window.iphoneSimState.whisperSettings.url) {
        if (window.iphoneSimState.whisperSettings.url.includes('siliconflow.cn')) {
            modeSelect.value = 'siliconflow';
        } else {
            modeSelect.value = 'custom';
        }
    }

    if (modelSelect && window.iphoneSimState.whisperSettings.model) {
        modelSelect.value = window.iphoneSimState.whisperSettings.model;
    }
};

window.updateMinimaxUi = function() {
    const groupIdInput = document.getElementById('minimax-group-id');
    const apiKeyInput = document.getElementById('minimax-api-key');
    const modelInput = document.getElementById('minimax-model');
    const modelSelect = document.getElementById('minimax-model-select');

    if (groupIdInput) groupIdInput.value = window.iphoneSimState.minimaxSettings.groupId || '';
    if (apiKeyInput) apiKeyInput.value = window.iphoneSimState.minimaxSettings.key || '';
    if (modelInput) modelInput.value = window.iphoneSimState.minimaxSettings.model || 'speech-01-turbo';
    
    if (modelSelect && window.iphoneSimState.minimaxSettings.model) {
        modelSelect.value = window.iphoneSimState.minimaxSettings.model;
    }
};

// --- 语音功能 ---

function handleSendFakeVoice() {
    const text = document.getElementById('voice-fake-text').value.trim();
    const duration = document.getElementById('voice-fake-duration').value;

    if (!text) {
        alert('请输入语音内容文本');
        return;
    }

    const voiceData = {
        duration: parseInt(duration),
        text: text,
        isReal: false
    };

    sendMessage(JSON.stringify(voiceData), true, 'voice');
    document.getElementById('voice-input-modal').classList.add('hidden');
}

async function toggleVoiceRecording() {
    const micBtn = document.getElementById('voice-mic-btn');
    const statusText = document.getElementById('voice-recording-status');
    const resultDiv = document.getElementById('voice-real-result');
    const sendBtn = document.getElementById('send-real-voice-btn');
    
    if (!window.iphoneSimState.whisperSettings.url || !window.iphoneSimState.whisperSettings.key) {
        alert('请先在设置中配置 Whisper API');
        return;
    }

    if (!isRecording) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000  // 降低采样率以减小文件大小
                }
            });
            
            // 使用SiliconFlow支持的音频格式：wav/mp3/pcm/opus/webm
            let options = {};
            let fileExt = 'webm';
            let mimeType = 'audio/webm';
            
            // 优先使用webm格式（最广泛支持）
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 };
                fileExt = 'webm';
                mimeType = 'audio/webm;codecs=opus';
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm', audioBitsPerSecond: 64000 };
                fileExt = 'webm';
                mimeType = 'audio/webm';
            } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
                options = { mimeType: 'audio/ogg;codecs=opus', audioBitsPerSecond: 64000 };
                fileExt = 'ogg';
                mimeType = 'audio/ogg;codecs=opus';
            }
            
            try {
                mediaRecorder = new MediaRecorder(stream, options);
                console.log('Using audio format:', mediaRecorder.mimeType);
            } catch (e) {
                console.warn('MediaRecorder options not supported, using default', e);
                mediaRecorder = new MediaRecorder(stream);
            }
            
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const actualMimeType = mediaRecorder.mimeType || mimeType;
                const audioBlob = new Blob(audioChunks, { type: actualMimeType });
                
                // 根据实际mime类型确定文件扩展名
                let actualExt = 'webm';
                if (actualMimeType.includes('mp4')) {
                    actualExt = 'm4a';
                } else if (actualMimeType.includes('webm')) {
                    actualExt = 'webm';
                }
                
                const audioFile = new File([audioBlob], `recording.${actualExt}`, { type: actualMimeType });
                
                const duration = Math.ceil((Date.now() - recordingStartTime) / 1000);
                recordedDuration = duration > 60 ? 60 : duration;

                // 只在需要时才转换为base64（减少内存占用）
                recordedAudio = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(audioBlob);
                });
                console.log('Audio processed, format:', actualMimeType, 'size:', audioBlob.size);

                micBtn.classList.remove('recording');
                statusText.textContent = '正在转文字...';
                statusText.style.color = '#007AFF';
                
                try {
                    const formData = new FormData();
                    formData.append('file', audioFile);
                    formData.append('model', window.iphoneSimState.whisperSettings.model || 'whisper-1');
                    formData.append('language', 'zh');  // 指定中文以提高准确率

                    let fetchUrl = window.iphoneSimState.whisperSettings.url;
                    // 移除尾部斜杠，规范化处理
                    if (fetchUrl.endsWith('/')) {
                        fetchUrl = fetchUrl.slice(0, -1);
                    }
                    
                    // 智能追加路径
                    if (!fetchUrl.endsWith('/audio/transcriptions')) {
                        fetchUrl = fetchUrl + '/audio/transcriptions';
                    }

                    const cleanKey = window.iphoneSimState.whisperSettings.key ? window.iphoneSimState.whisperSettings.key.trim() : '';

                    const response = await fetch(fetchUrl, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${cleanKey}`
                        },
                        body: formData
                    });

                    if (!response.ok) {
                        if (response.status === 403) {
                            throw new Error(`API Error: 403 (权限不足或模型名称错误。SiliconFlow 请尝试使用 'FunAudioLLM/SenseVoiceSmall')`);
                        }
                        const errorText = await response.text();
                        throw new Error(`API Error: ${response.status} - ${errorText}`);
                    }

                    const data = await response.json();
                    let text = data.text || '';
                    
                    // 过滤emoji和特殊字符
                    text = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // 表情符号
                               .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // 符号和象形文字
                               .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // 交通和地图符号
                               .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // 旗帜
                               .replace(/[\u{2600}-\u{26FF}]/gu, '')   // 杂项符号
                               .replace(/[\u{2700}-\u{27BF}]/gu, '')   // 装饰符号
                               .trim();
                    
                    recordedText = text;
                    
                    if (!recordedText) {
                        resultDiv.textContent = '未识别到内容，请重试';
                        statusText.textContent = '识别失败';
                        statusText.style.color = '#FF9500';
                    } else {
                        resultDiv.textContent = recordedText;
                        statusText.textContent = '录音结束';
                        statusText.style.color = '#888';
                        sendBtn.disabled = false;
                    }

                } catch (error) {
                    console.error('Whisper API Error:', error);
                    let errorMsg = error.message;
                    if (errorMsg === 'Failed to fetch' || errorMsg.includes('NetworkError')) {
                        errorMsg = '网络连接失败\n\n可能原因：\n1. CORS跨域问题（服务器配置错误）\n2. 网络超时\n3. API地址错误\n\n⚠️ 如果是SiliconFlow的CORS错误，这是服务器端配置问题，请联系API提供商修复';
                    } else if (errorMsg.includes('load failed')) {
                        errorMsg = '加载失败 (请检查网络连接和API配置)';
                    }
                    resultDiv.textContent = '转文字失败: ' + errorMsg;
                    resultDiv.style.whiteSpace = 'pre-wrap'; // 支持换行显示
                    statusText.textContent = '出错';
                    statusText.style.color = '#FF3B30';
                }
                
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            isRecording = true;
            recordingStartTime = Date.now();
            
            micBtn.classList.add('recording');
            statusText.textContent = '正在录音... (点击停止)';
            statusText.style.color = '#FF3B30';
            resultDiv.textContent = '';
            sendBtn.disabled = true;
            recordedText = '';

        } catch (err) {
            console.error('无法访问麦克风:', err);
            alert('无法访问麦克风，请检查权限。错误: ' + err.message);
        }

    } else {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            isRecording = false;
        }
    }
}

function handleSendRealVoice() {
    if (!recordedText) recordedText = '[语音]';

    const voiceData = {
        duration: recordedDuration || 1,
        text: recordedText,
        isReal: true,
        audio: recordedAudio
    };

    sendMessage(JSON.stringify(voiceData), true, 'voice');
    document.getElementById('voice-input-modal').classList.add('hidden');
}

function startOutgoingCall() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    // 尝试解锁音频上下文
    try {
        if (!globalVoicePlayer) {
            globalVoicePlayer = new Audio();
        }
        globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
        globalVoicePlayer.play().catch(e => console.log('Outgoing call audio unlock failed:', e));
    } catch(e) {
        console.error('Audio unlock error', e);
    }

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    const timeEl = document.getElementById('voice-call-time');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '等待对方接听...';
    timeEl.textContent = '正在呼叫'; 
    
    if (contact.voiceCallBg) {
        bg.style.backgroundImage = `url(${contact.voiceCallBg})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.remove('hidden');

    screen.classList.remove('hidden');

    const cancelBtn = document.getElementById('voice-call-cancel-btn');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = () => {
            closeVoiceCallScreen('user_cancel');
        };
    }

    makeAiCallDecision(contact);
}

async function makeAiCallDecision(contact) {
    const waitTime = 2000 + Math.random() * 3000;
    const startTime = Date.now();

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    let shouldAccept = true;

    if (settings.url && settings.key) {
        try {
            const history = window.iphoneSimState.chatHistory[contact.id] || [];
            const recentHistory = history.slice(-10).map(m => {
                let content = m.content;
                if (m.type === 'image') content = '[图片]';
                else if (m.type === 'sticker') content = '[表情包]';
                return `${m.role === 'user' ? '用户' : '你'}: ${content}`;
            }).join('\n');
            
            const systemPrompt = `你现在扮演 ${contact.name}。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

用户正在向你发起语音通话请求。
请根据你们最近的聊天记录和你的当前状态，决定是否接听。
最近聊天记录：
${recentHistory}

请只回复一个单词：
- 如果接听，回复 "ACCEPT"
- 如果拒绝，回复 "REJECT"`;

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

        const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
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
                        { role: 'user', content: 'ACTION: INCOMING_VOICE_CALL' }
                    ],
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.choices[0].message.content.trim().toUpperCase();
                console.log('AI Call Decision:', reply);
                if (reply.includes('REJECT')) {
                    shouldAccept = false;
                }
            }
        } catch (e) {
            console.error('AI Call Decision API Error:', e);
        }
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < waitTime) {
        await new Promise(r => setTimeout(r, waitTime - elapsed));
    }

    const screen = document.getElementById('voice-call-screen');
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (screen.classList.contains('hidden') || (outgoingActions && outgoingActions.classList.contains('hidden'))) {
        return;
    }

    if (shouldAccept) {
        openVoiceCallScreen();
    } else {
        const statusEl = document.getElementById('voice-call-status');
        if (statusEl) statusEl.textContent = '对方已拒绝';
        
        setTimeout(() => {
            closeVoiceCallScreen('ai_reject');
        }, 1500);
    }
}

function openVoiceCallScreen() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    if (!window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = [];
    }
    voiceCallStartIndex = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].length;
    currentVoiceCallStartTime = Date.now();

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const timeEl = document.getElementById('voice-call-time');
    const contentContainer = document.getElementById('voice-call-content');

    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    
    if (contact.voiceCallBg) {
        bg.style.backgroundImage = `url(${contact.voiceCallBg})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    voiceCallSeconds = 0;
    timeEl.textContent = '00:00';
    contentContainer.innerHTML = '';
    document.getElementById('voice-call-status').textContent = '正在通话中...';
    
    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.remove('hidden');
    
    document.getElementById('voice-call-content').classList.remove('hidden');
    document.querySelector('.voice-call-input-area').classList.remove('hidden');
    
    document.getElementById('voice-call-actions-active').classList.remove('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.add('hidden');

    screen.classList.remove('hidden');

    if (!globalVoicePlayer) {
        globalVoicePlayer = new Audio();
    }
    globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
    globalVoicePlayer.play().catch(e => console.log('Audio unlock failed (harmless if not on mobile):', e));

    if (voiceCallTimer) clearInterval(voiceCallTimer);
    
    const updateTime = () => {
        const mins = Math.floor(voiceCallSeconds / 60).toString().padStart(2, '0');
        const secs = (voiceCallSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;
        
        if (timeEl) timeEl.textContent = timeStr;
        
        const floatTimeEl = document.getElementById('float-call-time');
        if (floatTimeEl) floatTimeEl.textContent = timeStr;
    };
    
    updateTime();

    voiceCallTimer = setInterval(() => {
        voiceCallSeconds++;
        updateTime();
    }, 1000);

    // 初始化通话页面按钮
    initVoiceCallButtons();
}

// 初始化通话页面按钮事件
function initVoiceCallButtons() {
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const bg = document.getElementById('voice-call-bg');
    const bgInput = document.getElementById('voice-call-bg-input');
    const newBg = bg.cloneNode(true);
    bg.parentNode.replaceChild(newBg, bg);
    newBg.onclick = () => bgInput.click();
    
    const newBgInput = bgInput.cloneNode(true);
    bgInput.parentNode.replaceChild(newBgInput, bgInput);
    newBgInput.onchange = (e) => handleVoiceCallBgUpload(e, contact);

    const hangupBtn = document.getElementById('voice-call-hangup-btn');
    const minimizeBtn = document.getElementById('voice-call-minimize-btn');
    const addBtn = document.getElementById('voice-call-add-btn');

    const newHangupBtn = hangupBtn.cloneNode(true);
    hangupBtn.parentNode.replaceChild(newHangupBtn, hangupBtn);
    newHangupBtn.onclick = () => closeVoiceCallScreen('user');

    const newMinimizeBtn = minimizeBtn.cloneNode(true);
    minimizeBtn.parentNode.replaceChild(newMinimizeBtn, minimizeBtn);
    newMinimizeBtn.onclick = minimizeVoiceCallScreen;

    const newAddBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
    newAddBtn.onclick = () => alert('添加成员功能开发中...');
    
    const floatWindow = document.getElementById('voice-call-float');
    if (floatWindow) {
        makeVoiceCallDraggable(floatWindow, restoreVoiceCallScreen);
    }

    const micBtn = document.getElementById('voice-call-mic-btn');
    const newMicBtn = micBtn.cloneNode(true);
    micBtn.parentNode.replaceChild(newMicBtn, micBtn);
    
    // 默认关闭麦克风
    newMicBtn.classList.remove('active');
    newMicBtn.nextElementSibling.textContent = '麦克风已关';
    stopVoiceCallVAD();

    newMicBtn.onclick = () => {
        newMicBtn.classList.toggle('active');
        const span = newMicBtn.nextElementSibling;
        const isActive = newMicBtn.classList.contains('active');
        span.textContent = isActive ? '麦克风已开' : '麦克风已关';

        if (isActive) {
            startVoiceCallVAD();
        } else {
            stopVoiceCallVAD();
        }
    };

    const speakerBtn = document.getElementById('voice-call-speaker-btn');
    const newSpeakerBtn = speakerBtn.cloneNode(true);
    speakerBtn.parentNode.replaceChild(newSpeakerBtn, speakerBtn);
    newSpeakerBtn.onclick = () => {
        newSpeakerBtn.classList.toggle('active');
        const span = newSpeakerBtn.nextElementSibling;
        span.textContent = newSpeakerBtn.classList.contains('active') ? '扬声器已开' : '扬声器已关';
    };

    const sendBtn = document.getElementById('voice-call-send-btn');
    const input = document.getElementById('voice-call-input');
    
    const newSendBtn = sendBtn.cloneNode(true);
    sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
    
    const handleSend = () => {
        const text = input.value.trim();
        if (text) {
            input.value = '';
            sendMessage(text, true, 'voice_call_text');
            addVoiceCallMessage(text, 'user');
            generateVoiceCallAiReply();
        }
    };

    newSendBtn.onclick = handleSend;
    input.onkeydown = (e) => {
        if (e.key === 'Enter') handleSend();
    };
}

function closeVoiceCallScreen(hangupType = 'user') {
    const screen = document.getElementById('voice-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.add('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');
    
    if (voiceCallTimer) clearInterval(voiceCallTimer);
    voiceCallTimer = null;

    isProcessingResponse = false; // 重置状态
    stopVoiceCallVAD();

    const actionsIncoming = document.getElementById('voice-call-actions-incoming');
    if (actionsIncoming && !actionsIncoming.classList.contains('hidden')) {
        sendMessage('通话已被拒绝', false, 'call_rejected');
        setTimeout(() => {
            generateAiReply();
        }, 1000);
        return;
    }

    const actionsOutgoing = document.getElementById('voice-call-actions-outgoing');
    if (actionsOutgoing && !actionsOutgoing.classList.contains('hidden')) {
        if (hangupType === 'user_cancel') {
            sendMessage('已取消通话', true, 'text');
        } else if (hangupType === 'ai_reject') {
            sendMessage('对方拒绝了通话', false, 'text');
        }
        return;
    }

    const duration = Math.ceil((Date.now() - currentVoiceCallStartTime) / 1000);
    const mins = Math.floor(duration / 60).toString().padStart(2, '0');
    const secs = (duration % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    const isUserHangup = hangupType === 'user';
    sendMessage(`通话时长：${timeStr}`, isUserHangup, 'text');

    summarizeVoiceCall(window.iphoneSimState.currentChatContactId, voiceCallStartIndex);
}

function startIncomingCall(contact) {
    if (!contact) return;
    
    window.iphoneSimState.currentChatContactId = contact.id;

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '邀请你进行语音通话...';
    
    if (contact.voiceCallBg) {
        bg.style.backgroundImage = `url(${contact.voiceCallBg})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.remove('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.add('hidden');

    // 重新绑定按钮事件为语音通话
    const acceptBtn = document.getElementById('voice-call-accept-btn');
    const rejectBtn = document.getElementById('voice-call-reject-btn');
    
    // 克隆以移除旧的事件监听器
    const newAcceptBtn = acceptBtn.cloneNode(true);
    acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
    newAcceptBtn.onclick = acceptIncomingCall;

    const newRejectBtn = rejectBtn.cloneNode(true);
    rejectBtn.parentNode.replaceChild(newRejectBtn, rejectBtn);
    newRejectBtn.onclick = rejectIncomingCall;
    
    screen.classList.remove('hidden');
}

function startIncomingVideoCall(contact) {
    if (!contact) return;
    
    window.iphoneSimState.currentChatContactId = contact.id;

    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '邀请你进行视频通话...';
    
    // 优先使用视频通话背景
    if (contact.videoCallBgImage) {
        bg.style.backgroundImage = `url(${contact.videoCallBgImage})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.remove('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.add('hidden');

    // 重新绑定按钮事件为视频通话
    const acceptBtn = document.getElementById('voice-call-accept-btn');
    const rejectBtn = document.getElementById('voice-call-reject-btn');
    
    const newAcceptBtn = acceptBtn.cloneNode(true);
    acceptBtn.parentNode.replaceChild(newAcceptBtn, acceptBtn);
    newAcceptBtn.onclick = acceptIncomingVideoCall;

    const newRejectBtn = rejectBtn.cloneNode(true);
    rejectBtn.parentNode.replaceChild(newRejectBtn, rejectBtn);
    newRejectBtn.onclick = rejectIncomingVideoCall;
    
    screen.classList.remove('hidden');
}

window.acceptIncomingVideoCall = function() {
    // 关闭呼叫界面
    document.getElementById('voice-call-screen').classList.add('hidden');
    // 开启视频通话界面
    startVideoCall();
};

window.rejectIncomingVideoCall = function() {
    document.getElementById('voice-call-screen').classList.add('hidden');
    sendMessage('已拒绝视频通话', true, 'text');
};

window.acceptIncomingCall = function() {
    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.remove('hidden');

    document.getElementById('voice-call-content').classList.remove('hidden');
    document.querySelector('.voice-call-input-area').classList.remove('hidden');
    
    document.getElementById('voice-call-actions-active').classList.remove('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    document.getElementById('voice-call-status').textContent = '正在通话中...';
    
    // 解锁音频上下文（移动端需要用户交互才能播放音频）
    if (!globalVoicePlayer) {
        globalVoicePlayer = new Audio();
    }
    // 播放一段极短的静音音频来解锁音频上下文
    globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
    globalVoicePlayer.play().then(() => {
        console.log('Audio context unlocked successfully on accept call');
    }).catch(e => {
        console.log('Audio unlock attempt (may fail on some browsers):', e);
    });
    
    if (!window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = [];
    }
    voiceCallStartIndex = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].length;
    currentVoiceCallStartTime = Date.now();
    
    voiceCallSeconds = 0;
    document.getElementById('voice-call-time').textContent = '00:00';
    
    if (voiceCallTimer) clearInterval(voiceCallTimer);
    voiceCallTimer = setInterval(() => {
        voiceCallSeconds++;
        const mins = Math.floor(voiceCallSeconds / 60).toString().padStart(2, '0');
        const secs = (voiceCallSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;
        document.getElementById('voice-call-time').textContent = timeStr;
        const floatTimeEl = document.getElementById('float-call-time');
        if (floatTimeEl) floatTimeEl.textContent = timeStr;
    }, 1000);
    
    // 初始化通话页面按钮
    initVoiceCallButtons();
    
    const micBtn = document.getElementById('voice-call-mic-btn');
    if (micBtn && micBtn.classList.contains('active')) {
        startVoiceCallVAD();
    }
};

window.rejectIncomingCall = function() {
    closeVoiceCallScreen('user');
};

async function summarizeVoiceCall(contactId, startIndex) {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings2.url ? window.iphoneSimState.aiSettings2 : window.iphoneSimState.aiSettings;
    if (!settings.url || !settings.key) return;

    const history = window.iphoneSimState.chatHistory[contactId] || [];
    const callMessages = history.slice(startIndex);
    
    const callContent = callMessages
        .filter(m => m.type === 'voice_call_text')
        .map(m => {
            let text = m.content;
            try {
                const data = JSON.parse(m.content);
                if (typeof data.text === 'string') text = data.text;
            } catch(e) {}
            return `${m.role === 'user' ? '用户' : contact.name}: ${text}`;
        })
        .join('\n');

    if (!callContent) return;

    showNotification('正在总结通话...');

    const systemPrompt = `你是一个通话记录总结助手。
请阅读以下一段语音通话的文字记录，并生成一段简练的通话摘要。
摘要应该是陈述句，概括聊了什么主要内容。
不要包含“通话记录显示”、“用户说”等前缀，直接陈述事实。
请将摘要控制在 100 字以内。`;

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: callContent }
                ],
                temperature: 0.5
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        let summary = data.choices[0].message.content.trim();
        
        if (summary) {
            window.iphoneSimState.memories.push({
                id: Date.now(),
                contactId: contact.id,
                content: `【通话回忆】 ${summary}`,
                time: Date.now(),
                range: '语音通话'
            });
            saveConfig();
            
            console.log('通话总结完成:', summary);
            showNotification('通话总结完成', 2000, 'success');
        }

    } catch (error) {
        console.error('通话总结失败:', error);
        showNotification('总结出错', 2000, 'error');
    }
}

function minimizeVoiceCallScreen() {
    const screen = document.getElementById('voice-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.add('hidden');
    if (floatWindow) floatWindow.classList.remove('hidden');
}

function restoreVoiceCallScreen() {
    const screen = document.getElementById('voice-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.remove('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');
}

function makeVoiceCallDraggable(element, onClickCallback) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let isDragging = false;
    
    element.addEventListener('mousedown', dragMouseDown);
    element.addEventListener('touchstart', dragMouseDown, { passive: false });
    
    element.onclick = null;

    function dragMouseDown(e) {
        e = e || window.event;
        isDragging = false;

        if (e.type === 'touchstart') {
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
            
            document.addEventListener('touchend', closeDragElement, { passive: false });
            document.addEventListener('touchmove', elementDrag, { passive: false });
        } else {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
    }

    function elementDrag(e) {
        e = e || window.event;
        
        if (e.cancelable) {
            e.preventDefault();
        }
        
        isDragging = true;
        
        let clientX, clientY;
        if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        
        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;
        
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;
        
        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;
        
        if (newTop < 0) newTop = 0;
        if (newTop > maxY) newTop = maxY;
        if (newLeft < 0) newLeft = 0;
        if (newLeft > maxX) newLeft = maxX;

        element.style.top = newTop + "px";
        element.style.left = newLeft + "px";
        element.style.right = "auto";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        
        document.removeEventListener('touchend', closeDragElement);
        document.removeEventListener('touchmove', elementDrag);
        
        if (!isDragging && onClickCallback) {
            onClickCallback();
        }
    }
}

function handleVoiceCallBgUpload(e, contact) {
    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        contact.voiceCallBg = base64;
        document.getElementById('voice-call-bg').style.backgroundImage = `url(${base64})`;
        saveConfig();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function handleVideoCallBgUpload(e) {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const file = e.target.files[0];
    if (!file) return;

    compressImage(file, 800, 0.7).then(base64 => {
        contact.videoCallBgImage = base64;
        saveConfig();
        alert('视频通话背景已更新');
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function handleVideoSnapshot() {
    const videoEl = document.getElementById('video-local-stream');
    if (!videoCallLocalStream || !videoEl || videoEl.paused || videoEl.ended) {
        alert('请先开启摄像头');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    
    // 绘制视频帧
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    
    // 暂存截图，不发送也不显示
    pendingVideoSnapshot = base64;
    
    // 提示用户
    if (window.showChatToast) {
        window.showChatToast('画面已截取，将随下条消息发送');
    } else {
        // Fallback toast implementation
        const toast = document.createElement('div');
        toast.className = 'chat-toast';
        toast.textContent = '画面已截取，将随下条消息发送';
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.remove('hidden'), 10);
        setTimeout(() => {
            toast.classList.add('hidden');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

function startOutgoingVideoCall() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    // 尝试解锁音频上下文
    try {
        if (!globalVoicePlayer) {
            globalVoicePlayer = new Audio();
        }
        globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
        globalVoicePlayer.play().catch(e => console.log('Outgoing video call audio unlock failed:', e));
    } catch(e) {
        console.error('Audio unlock error', e);
    }

    // 复用 voice-call-screen 作为呼叫界面
    const screen = document.getElementById('voice-call-screen');
    const avatar = document.getElementById('voice-call-avatar');
    const name = document.getElementById('voice-call-name');
    const bg = document.getElementById('voice-call-bg');
    const statusEl = document.getElementById('voice-call-status');
    const timeEl = document.getElementById('voice-call-time');
    
    avatar.src = contact.avatar;
    name.textContent = contact.remark || contact.name;
    statusEl.textContent = '等待对方接受视频通话...';
    timeEl.textContent = '正在呼叫'; 
    
    // 使用视频通话的背景设置，如果没有则回退到聊天背景
    if (contact.videoCallBgImage) {
        bg.style.backgroundImage = `url(${contact.videoCallBgImage})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    // 隐藏不必要的元素
    const header = document.querySelector('.voice-call-header');
    if (header) header.classList.add('hidden');
    
    document.getElementById('voice-call-content').classList.add('hidden');
    document.querySelector('.voice-call-input-area').classList.add('hidden');
    
    document.getElementById('voice-call-actions-active').classList.add('hidden');
    document.getElementById('voice-call-actions-incoming').classList.add('hidden');
    
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    if (outgoingActions) outgoingActions.classList.remove('hidden');

    screen.classList.remove('hidden');

    // 绑定取消按钮
    const cancelBtn = document.getElementById('voice-call-cancel-btn');
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.onclick = () => {
            closeVoiceCallScreen('user_cancel');
        };
    }

    makeAiVideoCallDecision(contact);
}

async function makeAiVideoCallDecision(contact) {
    const waitTime = 2000 + Math.random() * 3000;
    const startTime = Date.now();

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    let shouldAccept = true;

    if (settings.url && settings.key) {
        try {
            const history = window.iphoneSimState.chatHistory[contact.id] || [];
            const recentHistory = history.slice(-10).map(m => {
                let content = m.content;
                if (m.type === 'image') content = '[图片]';
                else if (m.type === 'sticker') content = '[表情包]';
                return `${m.role === 'user' ? '用户' : '你'}: ${content}`;
            }).join('\n');
            
            const systemPrompt = `你现在扮演 ${contact.name}。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

用户正在向你发起【视频通话】请求。
请根据你们最近的聊天记录和你的当前状态，决定是否接听。
最近聊天记录：
${recentHistory}

请只回复一个单词：
- 如果接听，回复 "ACCEPT"
- 如果拒绝，回复 "REJECT"`;

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
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
                        { role: 'user', content: 'ACTION: INCOMING_VIDEO_CALL' }
                    ],
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                const reply = data.choices[0].message.content.trim().toUpperCase();
                console.log('AI Video Call Decision:', reply);
                if (reply.includes('REJECT')) {
                    shouldAccept = false;
                }
            }
        } catch (e) {
            console.error('AI Video Call Decision API Error:', e);
        }
    }

    const elapsed = Date.now() - startTime;
    if (elapsed < waitTime) {
        await new Promise(r => setTimeout(r, waitTime - elapsed));
    }

    // 检查呼叫界面是否还开着
    const screen = document.getElementById('voice-call-screen');
    const outgoingActions = document.getElementById('voice-call-actions-outgoing');
    // 必须确保当前显示的是 outgoing actions，说明还在呼叫中
    if (screen.classList.contains('hidden') || (outgoingActions && outgoingActions.classList.contains('hidden'))) {
        return;
    }

    if (shouldAccept) {
        // 关闭呼叫界面（voice-call-screen）
        screen.classList.add('hidden');
        // 开启视频通话界面
        startVideoCall();
    } else {
        const statusEl = document.getElementById('voice-call-status');
        if (statusEl) statusEl.textContent = '对方已拒绝';
        
        setTimeout(() => {
            closeVoiceCallScreen('ai_reject');
        }, 1500);
    }
}

function startVideoCall() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    if (!window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] = [];
    }
    voiceCallStartIndex = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].length;

    const screen = document.getElementById('video-call-screen');
    const bg = document.getElementById('video-call-bg');
    
    if (contact.videoCallBgImage) {
        bg.style.backgroundImage = `url(${contact.videoCallBgImage})`;
    } else if (contact.chatBg) {
        bg.style.backgroundImage = `url(${contact.chatBg})`;
    } else {
        bg.style.backgroundImage = 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)';
    }

    // 绑定按钮事件
    const micBtn = document.getElementById('video-call-mic-btn');
    
    // 默认关闭麦克风
    micBtn.classList.remove('active');
    micBtn.nextElementSibling.textContent = '麦克风已关';
    stopVoiceCallVAD();

    micBtn.onclick = () => {
        micBtn.classList.toggle('active');
        const span = micBtn.nextElementSibling;
        const isActive = micBtn.classList.contains('active');
        span.textContent = isActive ? '麦克风已开' : '麦克风已关';

        if (isActive) {
            startVoiceCallVAD();
        } else {
            stopVoiceCallVAD();
        }
    };

    const cameraBtn = document.getElementById('video-call-camera-btn');
    cameraBtn.onclick = toggleVideoCamera;
    // 重置摄像头按钮状态
    cameraBtn.classList.remove('active');
    cameraBtn.nextElementSibling.textContent = '摄像头已关';
    document.getElementById('video-local-preview').classList.add('hidden');

    const hangupBtn = document.getElementById('video-call-hangup-btn');
    hangupBtn.onclick = closeVideoCallScreen;

    const speakerBtn = document.getElementById('video-call-speaker-btn');
    speakerBtn.onclick = () => {
        speakerBtn.classList.toggle('active');
        const span = speakerBtn.nextElementSibling;
        span.textContent = speakerBtn.classList.contains('active') ? '扬声器已开' : '扬声器已关';
    };

    // 最小化按钮
    const minimizeBtn = document.getElementById('video-call-minimize-btn');
    if (minimizeBtn) {
        minimizeBtn.onclick = minimizeVideoCallScreen;
    }

    // 截图按钮
    const snapshotBtn = document.getElementById('video-call-snapshot-btn');
    if (snapshotBtn) {
        const newSnapshotBtn = snapshotBtn.cloneNode(true);
        snapshotBtn.parentNode.replaceChild(newSnapshotBtn, snapshotBtn);
        newSnapshotBtn.onclick = handleVideoSnapshot;
    }

    // 自动截图设置按钮 (右上角加号)
    const addBtn = document.getElementById('video-call-add-btn');
    if (addBtn) {
        const newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        newAddBtn.onclick = () => {
            const interval = contact.autoSnapshotInterval || 0;
            document.getElementById('auto-snapshot-interval').value = interval === 0 ? '' : interval;
            document.getElementById('auto-snapshot-modal').classList.remove('hidden');
        };
    }

    // 发送消息
    const sendBtn = document.getElementById('video-call-send-btn');
    const input = document.getElementById('video-call-input');
    
    const handleSend = () => {
        const text = input.value.trim();
        if (text) {
            input.value = '';
            sendMessage(text, true, 'voice_call_text');
            addVoiceCallMessage(text, 'user'); // 复用 addVoiceCallMessage，它会自动判断容器
            generateVoiceCallAiReply(); 
        }
    };

    if (sendBtn) {
        const newSendBtn = sendBtn.cloneNode(true);
        sendBtn.parentNode.replaceChild(newSendBtn, sendBtn);
        newSendBtn.onclick = handleSend;
    }
    
    if (input) {
        input.onkeydown = (e) => {
            if (e.key === 'Enter') handleSend();
        };
    }

    // 清空内容区域
    const contentContainer = document.getElementById('video-call-content');
    if (contentContainer) contentContainer.innerHTML = '';

    screen.classList.remove('hidden');
    currentVideoCallStartTime = Date.now();

    // 尝试解锁音频上下文
    try {
        if (!globalVoicePlayer) {
            globalVoicePlayer = new Audio();
        }
        // 播放极短的静音
        globalVoicePlayer.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAgAAAAEA';
        globalVoicePlayer.play().then(() => {
            console.log('Video call audio context unlocked');
        }).catch(e => {
            console.log('Video call audio unlock failed (user interaction needed):', e);
        });
    } catch(e) {
        console.error('Video call audio setup error', e);
    }

    // 计时器
    if (videoCallTimer) clearInterval(videoCallTimer);
    videoCallSeconds = 0;
    const timeEl = document.getElementById('video-call-time');
    if (timeEl) timeEl.textContent = '00:00';

    videoCallTimer = setInterval(() => {
        videoCallSeconds++;
        const mins = Math.floor(videoCallSeconds / 60).toString().padStart(2, '0');
        const secs = (videoCallSeconds % 60).toString().padStart(2, '0');
        const timeStr = `${mins}:${secs}`;
        if (timeEl) timeEl.textContent = timeStr;
    }, 1000);

    // 启动自动截图
    startAutoSnapshot(contact);
}

function minimizeVideoCallScreen() {
    const screen = document.getElementById('video-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.add('hidden');
    if (floatWindow) {
        floatWindow.classList.remove('hidden');
        makeVoiceCallDraggable(floatWindow, restoreVideoCallScreen);
    }
}

function restoreVideoCallScreen() {
    const screen = document.getElementById('video-call-screen');
    const floatWindow = document.getElementById('voice-call-float');
    
    screen.classList.remove('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');
}

async function toggleVideoCamera() {
    const cameraBtn = document.getElementById('video-call-camera-btn');
    const preview = document.getElementById('video-local-preview');
    const videoEl = document.getElementById('video-local-stream');
    const span = cameraBtn.nextElementSibling;

    if (videoCallLocalStream) {
        // 关闭摄像头
        videoCallLocalStream.getTracks().forEach(track => track.stop());
        videoCallLocalStream = null;
        videoEl.srcObject = null;
        preview.classList.add('hidden');
        cameraBtn.classList.remove('active');
        span.textContent = '摄像头已关';
    } else {
        // 开启摄像头
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            videoCallLocalStream = stream;
            videoEl.srcObject = stream;
            preview.classList.remove('hidden');
            cameraBtn.classList.add('active');
            span.textContent = '摄像头已开';
        } catch (err) {
            console.error('无法访问摄像头:', err);
            alert('无法访问摄像头，请检查权限');
        }
    }
}

function closeVideoCallScreen() {
    const screen = document.getElementById('video-call-screen');
    const floatWindow = document.getElementById('voice-call-float');

    screen.classList.add('hidden');
    if (floatWindow) floatWindow.classList.add('hidden');

    if (videoCallTimer) {
        clearInterval(videoCallTimer);
        videoCallTimer = null;
    }

    if (autoSnapshotTimer) {
        clearInterval(autoSnapshotTimer);
        autoSnapshotTimer = null;
    }

    if (videoCallLocalStream) {
        videoCallLocalStream.getTracks().forEach(track => track.stop());
        videoCallLocalStream = null;
        document.getElementById('video-local-stream').srcObject = null;
    }

    isProcessingResponse = false; // 重置状态
    stopVoiceCallVAD(); // 确保关闭麦克风和VAD

    const duration = Math.ceil((Date.now() - currentVideoCallStartTime) / 1000);
    const mins = Math.floor(duration / 60).toString().padStart(2, '0');
    const secs = (duration % 60).toString().padStart(2, '0');
    const timeStr = `${mins}:${secs}`;

    sendMessage(`视频通话时长：${timeStr}`, true, 'text');

    summarizeVoiceCall(window.iphoneSimState.currentChatContactId, voiceCallStartIndex);
}

function startAutoSnapshot(contact) {
    if (autoSnapshotTimer) {
        clearInterval(autoSnapshotTimer);
        autoSnapshotTimer = null;
    }

    const interval = contact.autoSnapshotInterval || 0;
    if (interval < 5) return; // 最小间隔5秒

    console.log(`启动自动截图，间隔 ${interval} 秒`);

    autoSnapshotTimer = setInterval(() => {
        const videoEl = document.getElementById('video-local-stream');
        if (!videoCallLocalStream || !videoEl || videoEl.paused || videoEl.ended) {
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = videoEl.videoWidth;
        canvas.height = videoEl.videoHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.6); // 稍微降低质量以加快传输

        // 暂存截图，不立即发送
        pendingVideoSnapshot = base64;
        console.log('自动截图已暂存，等待用户发送消息');

    }, interval * 1000);
}

function handleSaveAutoSnapshotSettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const intervalInput = document.getElementById('auto-snapshot-interval');
    let interval = parseInt(intervalInput.value);
    
    if (isNaN(interval) || interval < 0) interval = 0;
    if (interval > 0 && interval < 5) {
        alert('间隔不能小于5秒');
        return;
    }

    contact.autoSnapshotInterval = interval;
    saveConfig();
    
    document.getElementById('auto-snapshot-modal').classList.add('hidden');
    
    // 如果当前正在视频通话，立即应用新设置
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        startAutoSnapshot(contact);
    }
    
    if (window.showChatToast) {
        window.showChatToast(interval > 0 ? `已开启自动截图 (每${interval}秒)` : '已关闭自动截图');
    }
}

function addVoiceCallMessage(text, role) {
    // 尝试添加到语音通话容器
    const voiceContainer = document.getElementById('voice-call-content');
    if (voiceContainer && !document.getElementById('voice-call-screen').classList.contains('hidden')) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `voice-call-msg ${role}`;
        msgDiv.textContent = text;
        voiceContainer.appendChild(msgDiv);
        voiceContainer.scrollTop = voiceContainer.scrollHeight;
    }

    // 尝试添加到视频通话容器
    const videoContainer = document.getElementById('video-call-content');
    if (videoContainer && !document.getElementById('video-call-screen').classList.contains('hidden')) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `voice-call-msg ${role}`; // 复用样式
        
        if (role === 'description') {
            // 描述消息可能包含换行，使用 innerText 或 textContent 都可以，但为了安全使用 textContent
            // 如果需要支持 HTML 格式（如加粗），可以改用 innerHTML，但这里纯文本即可
            msgDiv.textContent = text;
        } else {
            if (text.startsWith('<img')) {
                msgDiv.innerHTML = text;
            } else {
                msgDiv.textContent = text;
            }
        }
        
        videoContainer.appendChild(msgDiv);
        videoContainer.scrollTop = videoContainer.scrollHeight;
    }
}

function playVoiceCallAudio(audioData) {
    if (!audioData) {
        console.error('playVoiceCallAudio: No audio data provided');
        return;
    }
    
    // 验证音频数据格式
    if (!audioData.startsWith('data:audio/')) {
        console.error('playVoiceCallAudio: Invalid audio data format:', audioData.substring(0, 50));
        return;
    }
    
    console.log('playVoiceCallAudio: Starting playback, audio data length:', audioData.length);
    
    if (!globalVoicePlayer) {
        globalVoicePlayer = new Audio();
        console.log('playVoiceCallAudio: Created new Audio instance');
    }
    
    isAiSpeaking = true;
    console.log('AI started speaking, VAD paused');

    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }

    if (statusEl) statusEl.textContent = '对方正在说话...';

    // 停止之前的播放
    try {
        globalVoicePlayer.pause();
        globalVoicePlayer.currentTime = 0;
    } catch (e) {
        console.log('playVoiceCallAudio: Error stopping previous audio:', e);
    }

    // 设置音频源
    globalVoicePlayer.src = audioData;
    
    // 监听加载完成事件
    globalVoicePlayer.onloadeddata = () => {
        console.log('playVoiceCallAudio: Audio loaded, duration:', globalVoicePlayer.duration);
    };
    
    globalVoicePlayer.onended = () => {
        isAiSpeaking = false;
        isProcessingResponse = false;
        console.log('AI stopped speaking, VAD resumed');
        if (statusEl) statusEl.textContent = '正在聆听...';
    };
    
    globalVoicePlayer.onerror = (e) => {
        console.error('playVoiceCallAudio: Audio error:', e, 'Error code:', globalVoicePlayer.error?.code, 'Message:', globalVoicePlayer.error?.message);
        isAiSpeaking = false;
        isProcessingResponse = false;
        if (statusEl) statusEl.textContent = '音频播放失败';
        
        // 显示友好提示
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile && window.showChatToast) {
            window.showChatToast('TTS音频播放失败，请检查音频格式设置');
        }
    };

    // 预加载音频
    globalVoicePlayer.load();
    
    // 尝试播放
    const playPromise = globalVoicePlayer.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            console.log('playVoiceCallAudio: Playback started successfully');
        }).catch(e => {
            console.error('playVoiceCallAudio: Auto play failed:', e.name, e.message);
            isAiSpeaking = false;
            isProcessingResponse = false;
            
            if (statusEl) {
                if (e.name === 'NotAllowedError') {
                    statusEl.textContent = '需要用户交互才能播放';
                } else if (e.name === 'NotSupportedError') {
                    statusEl.textContent = '音频格式不支持';
                } else {
                    statusEl.textContent = '播放失败';
                }
            }
            
            // 移动端提示
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            if (isMobile && window.showChatToast) {
                window.showChatToast('TTS播放失败: ' + e.message);
            }
        });
    }
}

async function generateVoiceCallAiReply() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;

    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    
    // 动态获取状态元素
    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }

    if (!settings.url || !settings.key) {
        if (statusEl) statusEl.textContent = 'API未配置';
        return;
    }

    if (statusEl) statusEl.textContent = '对方正在思考...';

    const history = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId] || [];
    
    let userPromptInfo = '';
    let currentPersona = null;
    if (contact.userPersonaId) {
        currentPersona = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
    }
    if (currentPersona) {
        userPromptInfo = `\n用户(我)的网名：${currentPersona.name || '未命名'}`;
        const promptContent = contact.userPersonaPromptOverride || currentPersona.aiPrompt;
        if (promptContent) {
            userPromptInfo += `\n用户(我)的人设：${promptContent}`;
        }
    } else if (window.iphoneSimState.userProfile) {
        userPromptInfo = `\n用户(我)的网名：${window.iphoneSimState.userProfile.name}`;
    }

    let memoryContext = '';
    if (contact.memorySendLimit && contact.memorySendLimit > 0) {
        const contactMemories = window.iphoneSimState.memories.filter(m => m.contactId === contact.id);
        if (contactMemories.length > 0) {
            const recentMemories = contactMemories.sort((a, b) => b.time - a.time).slice(0, contact.memorySendLimit);
            recentMemories.reverse();
            memoryContext += '\n【重要记忆】\n';
            recentMemories.forEach(m => {
                memoryContext += `- ${m.content}\n`;
            });
        }
    }

    let worldbookContext = '';
    if (window.iphoneSimState.worldbook && window.iphoneSimState.worldbook.length > 0) {
        let activeEntries = window.iphoneSimState.worldbook.filter(e => e.enabled);
        if (contact.linkedWbCategories) {
            activeEntries = activeEntries.filter(e => contact.linkedWbCategories.includes(e.categoryId));
        }
        if (activeEntries.length > 0) {
            worldbookContext += '\n\n世界书信息：\n';
            activeEntries.forEach(entry => {
                let shouldAdd = false;
                if (entry.keys && entry.keys.length > 0) {
                    const historyText = history.map(h => h.content).join('\n');
                    const match = entry.keys.some(key => historyText.includes(key));
                    if (match) shouldAdd = true;
                } else {
                    shouldAdd = true;
                }
                if (shouldAdd) {
                    worldbookContext += `${entry.content}\n`;
                }
            });
        }
    }

    let limit = contact.contextLimit && contact.contextLimit > 0 ? contact.contextLimit : 20;
    let contextMessages = history.slice(-limit);

    let systemPrompt = '';
    
    // 判断是否在视频通话中 (通过界面可见性判断，而不是摄像头流)
    // videoScreen 已经在函数开头声明过
    const isVideoCall = videoScreen && !videoScreen.classList.contains('hidden');

    if (isVideoCall) {
        systemPrompt = `你现在扮演 ${contact.name}，正在与用户进行【视频通话】。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

${userPromptInfo}
${memoryContext}
${worldbookContext}

【重要规则】
1. 你们正在进行视频通话。
2. 用户可能会发送图片，这些图片是用户方的实时视频画面截图，代表你通过视频通话"看到"的用户当前的画面。请将这些图片理解为你正在视频通话中看到的实时场景，而不是用户发送的静态照片。
3. 请严格遵守以下格式，同时输出一个描述部分和一个对话部分：
{{DESC}}在这里写下你的动作、表情或环境描述。{{/DESC}}
{{DIALOGUE}}在这里写下你以第一人称说的话。{{/DIALOGUE}}
4. 语气要自然、流畅。
5. 如果你想挂断电话，请在回复的最后另起一行输出：ACTION: HANGUP_CALL
6. **严禁**输出 "BAKA"、"baka" 等词汇。

请回复对方。`;
    } else {
        systemPrompt = `你现在扮演 ${contact.name}，正在与用户进行【语音通话】。
【核心指令】
你必须严格遵守以下人设（优先级最高，高于一切其他指令）：
${contact.persona || '无'}

${userPromptInfo}
${memoryContext}
${worldbookContext}

【重要规则】
1. 你们正在打电话，请使用自然的口语交流。
2. **绝对不要**包含任何动作描写（如 *点头*、*叹气*、*笑了* 等）。
3. **绝对不要**包含剧本格式（如 "我："、"用户："）。
4. 回复必须是**一整段**话，不要分段，不要分条。
5. 语气要自然、流畅，像真实的人在打电话。
6. 不要输出任何指令（如 ACTION: ...），除非你想挂断电话。
7. 如果你想挂断电话，请在回复的最后另起一行输出：ACTION: HANGUP_CALL
8. 仅仅输出你要说的话（和可能的挂断指令）。
9. **严禁**输出 "BAKA"、"baka" 等词汇。

请回复对方。`;
    }

    const messages = [
        { role: 'system', content: systemPrompt },
        ...contextMessages.map(h => {
            let content = h.content;
            try {
                const data = JSON.parse(content);
                if (data.text) content = data.text;
            } catch(e) {}

            if (h.type === 'image') content = '[图片]';
            else if (h.type === 'sticker') content = '[表情包]';
            else if (h.type === 'voice') content = '[语音]';
            
            return { role: h.role, content: content };
        })
    ];

    // 检查是否有暂存的截图，如果有则附加到最后一条用户消息中
    if (pendingVideoSnapshot) {
        let lastUserMsgIndex = -1;
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'user') {
                lastUserMsgIndex = i;
                break;
            }
        }

        if (lastUserMsgIndex !== -1) {
            const originalContent = messages[lastUserMsgIndex].content;
            messages[lastUserMsgIndex].content = [
                { type: "text", text: originalContent },
                { type: "image_url", image_url: { url: pendingVideoSnapshot } }
            ];
        } else {
            // 如果没有用户消息（极少见），追加一条
            messages.push({
                role: 'user',
                content: [
                    { type: "text", text: "（这是你通过视频通话看到的用户当前的画面）" },
                    { type: "image_url", image_url: { url: pendingVideoSnapshot } }
                ]
            });
        }
        // 清空暂存
        pendingVideoSnapshot = null;
    }

    try {
        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${settings.key}`
            },
            body: JSON.stringify({
                model: settings.model,
                messages: messages,
                temperature: settings.temperature
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        console.log('Voice Call AI API Response:', data);

        if (data.error) {
            console.error('Voice Call API Error Response:', data.error);
            throw new Error(`API Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        if (!data.choices || !data.choices.length || !data.choices[0].message) {
            console.error('Invalid Voice Call API response structure:', data);
            throw new Error('API返回数据格式异常');
        }

        let replyContent = data.choices[0].message.content.trim();

        replyContent = replyContent.replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
                                   .replace(/<think>[\s\S]*?<\/think>/g, '')
                                   .trim();

        // 同样应用增强的正则匹配来清理 ACTION (虽然视频通话 Prompt 较少用 ACTION，但为了统一)
        let lines = replyContent.split('\n');
        let cleanLines = [];
        let actions = [];
        
        const actionRegex = /^[\s\*\-\>]*ACTION\s*[:：]\s*(.*)$/i;

                for (let line of lines) {
                    let trimmedLine = line.trim();
                    // if (!trimmedLine) continue; // 优化：保留空行以维持段落格式

                    let actionMatch = trimmedLine.match(actionRegex);
            if (actionMatch) {
                actions.push('ACTION: ' + actionMatch[1].trim());
            } else {
                cleanLines.push(line);
            }
        }
        
        replyContent = cleanLines.join('\n').trim();

        let desc = '';
        let dialogue = replyContent;
        let shouldHangup = false;
        
        // 检查提取出的 actions 中是否有挂断指令
        if (actions.some(a => a.includes('HANGUP_CALL'))) {
            shouldHangup = true;
        }

        if (isVideoCall) {
            const descMatch = replyContent.match(/{{DESC}}([\s\S]*?){{\/DESC}}/i);
            const dialogueMatch = replyContent.match(/{{DIALOGUE}}([\s\S]*?){{\/DIALOGUE}}/i);
            
            if (descMatch) {
                desc = descMatch[1].trim();
            }
            
            if (dialogueMatch) {
                dialogue = dialogueMatch[1].trim();
            } else {
                // 如果没有匹配到完整的 DIALOGUE 块，移除所有 DESC 部分，并清理可能存在的 DIALOGUE 标签
                dialogue = replyContent.replace(/{{DESC}}[\s\S]*?{{\/DESC}}/gi, '')
                                       .replace(/{{DESC}}/gi, '') // 清理可能残留的开始标签
                                       .replace(/{{\/DESC}}/gi, '') // 清理可能残留的结束标签
                                       .replace(/{{DIALOGUE}}/gi, '')
                                       .replace(/{{\/DIALOGUE}}/gi, '')
                                       .trim();
            }
        }

        // 兼容旧的行内检查（以防万一）
        if (dialogue.includes('ACTION: HANGUP_CALL')) {
            shouldHangup = true;
            dialogue = dialogue.replace('ACTION: HANGUP_CALL', '').trim();
        }

        // 防止空回复
        if (!desc && !dialogue) {
            console.log('AI generated empty response for video call, skipping message');
            isProcessingResponse = false;
            if (statusEl) statusEl.textContent = '通话中';
            return;
        }

        // 显示描述部分
        if (desc) {
            addVoiceCallMessage(desc, 'description');
        }

        // 处理对话部分
        let audioData = null;
        let isSpeakerOn = false;
        
        if (isVideoCall) {
            const videoSpeakerBtn = document.getElementById('video-call-speaker-btn');
            if (videoSpeakerBtn && videoSpeakerBtn.classList.contains('active')) isSpeakerOn = true;
        } else {
            const speakerBtn = document.getElementById('voice-call-speaker-btn');
            if (speakerBtn && speakerBtn.classList.contains('active')) isSpeakerOn = true;
        }

        if (isSpeakerOn && dialogue) {
            audioData = await generateMinimaxTTS(dialogue, contact.ttsVoiceId);
        }

        if (audioData) {
            playVoiceCallAudio(audioData);
        } else {
            // 如果没有音频（未开启扬声器或生成失败），立即恢复VAD
            isProcessingResponse = false;
            if (statusEl) statusEl.textContent = '正在聆听...';
        }

        const msgPayload = {
            text: dialogue,
            description: desc,
            audio: audioData
        };
        
        sendMessage(JSON.stringify(msgPayload), false, 'voice_call_text');
        addVoiceCallMessage(dialogue, 'ai');

        if (shouldHangup) {
            const delay = audioData ? (dialogue.length * 300 + 1000) : 2000;
            
            setTimeout(() => {
                closeVoiceCallScreen('ai');
            }, delay); 
        }

    } catch (error) {
        console.error('语音通话AI生成失败:', error);
        addVoiceCallMessage(`[生成失败: ${error.message}]`, 'ai');
        if (statusEl) statusEl.textContent = '生成失败';
        // 在控制台输出更多细节以便调试
        if (window.showChatToast) window.showChatToast(`语音通话AI错误: ${error.message}`);
        isProcessingResponse = false; // 发生错误，恢复VAD
    } finally {
        // 移除这里的状态重置，交由 playVoiceCallAudio 或上面的逻辑控制
    }
}

async function startVoiceCallVAD() {
    if (voiceCallIsRecording) return;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
                sampleRate: 16000  // 降低采样率
            }
        });
        voiceCallStream = stream;
        voiceCallAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 根据设备类型调整增益
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const gainNode = voiceCallAudioContext.createGain();
        gainNode.gain.value = isMobile ? 3.0 : 5.0; // 移动端降低增益避免失真

        voiceCallAnalyser = voiceCallAudioContext.createAnalyser();
        voiceCallMicrophone = voiceCallAudioContext.createMediaStreamSource(stream);
        voiceCallScriptProcessor = voiceCallAudioContext.createScriptProcessor(4096, 1, 1);

        voiceCallAnalyser.fftSize = 512;
        voiceCallAnalyser.smoothingTimeConstant = 0.8;  // 增加平滑度
        
        // 连接链路: Mic -> Gain -> Analyser -> Processor -> Destination
        voiceCallMicrophone.connect(gainNode);
        gainNode.connect(voiceCallAnalyser);
        voiceCallAnalyser.connect(voiceCallScriptProcessor);
        voiceCallScriptProcessor.connect(voiceCallAudioContext.destination);

        // 使用SiliconFlow支持的音频格式：wav/mp3/pcm/opus/webm
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 64000 };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm', audioBitsPerSecond: 64000 };
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
            options = { mimeType: 'audio/ogg;codecs=opus', audioBitsPerSecond: 64000 };
        }
        
        try {
            voiceCallMediaRecorder = new MediaRecorder(stream, options);
            console.log('VAD using audio format:', voiceCallMediaRecorder.mimeType);
        } catch (e) {
            console.warn('MediaRecorder options not supported, falling back to default', e);
            voiceCallMediaRecorder = new MediaRecorder(stream);
        }
        
        voiceCallChunks = [];

        voiceCallMediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                voiceCallChunks.push(e.data);
            }
        };

        voiceCallMediaRecorder.onstop = async () => {
            if (voiceCallChunks.length > 0) {
                // 确保 Blob 类型与录制时一致
                const mimeType = voiceCallMediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(voiceCallChunks, { type: mimeType });
                await processVoiceCallAudio(audioBlob);
                voiceCallChunks = [];
            }
        };

        voiceCallIsSpeaking = false;
        voiceCallSilenceStart = Date.now();
        voiceCallIsRecording = true;

        // 根据设备类型调整阈值
        const VAD_THRESHOLD = isMobile ? 15 : 10;
        const SILENCE_DURATION = isMobile ? 1800 : 1500;  // 移动端延长静音判定时间

        voiceCallScriptProcessor.onaudioprocess = (event) => {
            const array = new Uint8Array(voiceCallAnalyser.frequencyBinCount);
            voiceCallAnalyser.getByteFrequencyData(array);
            let values = 0;
            const length = array.length;
            for (let i = 0; i < length; i++) {
                values += array[i];
            }
            let average = values / length;

            // 如果AI正在说话，或者正在处理回复，暂停VAD检测
            if (isAiSpeaking || isProcessingResponse) {
                average = 0;
            }

            let statusEl = document.getElementById('voice-call-status');
            const videoScreen = document.getElementById('video-call-screen');
            if (videoScreen && !videoScreen.classList.contains('hidden')) {
                statusEl = document.getElementById('video-call-status');
            }
            
            if (average > VAD_THRESHOLD) {
                if (!voiceCallIsSpeaking) {
                    console.log('VAD: Speaking started');
                    voiceCallIsSpeaking = true;
                    if (voiceCallMediaRecorder.state === 'inactive') {
                        voiceCallMediaRecorder.start();
                        if (statusEl) statusEl.textContent = '正在聆听...';
                    }
                }
                voiceCallSilenceStart = Date.now();
            } else {
                if (voiceCallIsSpeaking) {
                    const silenceDuration = Date.now() - voiceCallSilenceStart;
                    if (silenceDuration > SILENCE_DURATION) {
                        console.log('VAD: Speaking ended');
                        voiceCallIsSpeaking = false;
                        if (voiceCallMediaRecorder.state === 'recording') {
                            voiceCallMediaRecorder.stop();
                            if (statusEl) statusEl.textContent = '正在处理...';
                        }
                    }
                }
            }
        };

        console.log('Voice Call VAD started');

    } catch (error) {
        console.error('Failed to start VAD:', error);
        alert('无法启动语音检测，请检查麦克风权限');
        stopVoiceCallVAD();
    }
}

function stopVoiceCallVAD() {
    if (!voiceCallIsRecording) return;

    if (voiceCallMediaRecorder && voiceCallMediaRecorder.state !== 'inactive') {
        voiceCallMediaRecorder.stop();
    }
    
    if (voiceCallStream) {
        voiceCallStream.getTracks().forEach(track => track.stop());
        voiceCallStream = null;
    }
    
    if (voiceCallMicrophone) voiceCallMicrophone.disconnect();
    if (voiceCallAnalyser) voiceCallAnalyser.disconnect();
    if (voiceCallScriptProcessor) {
        voiceCallScriptProcessor.disconnect();
        voiceCallScriptProcessor.onaudioprocess = null;
    }
    if (voiceCallAudioContext) voiceCallAudioContext.close();

    voiceCallIsRecording = false;
    voiceCallIsSpeaking = false;
    voiceCallChunks = [];
    
    const micBtn = document.getElementById('voice-call-mic-btn');
    if (micBtn) {
        micBtn.classList.remove('active');
        const span = micBtn.nextElementSibling;
        if (span) span.textContent = '麦克风已关';
    }

    const videoMicBtn = document.getElementById('video-call-mic-btn');
    if (videoMicBtn) {
        videoMicBtn.classList.remove('active');
        const span = videoMicBtn.nextElementSibling;
        if (span) span.textContent = '麦克风已关';
    }
    
    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }
    if (statusEl) statusEl.textContent = '通话中';

    console.log('Voice Call VAD stopped');
}

async function processVoiceCallAudio(audioBlob) {
    if (!window.iphoneSimState.whisperSettings.url || !window.iphoneSimState.whisperSettings.key) {
        console.warn('Whisper API not configured');
        return;
    }

    let statusEl = document.getElementById('voice-call-status');
    const videoScreen = document.getElementById('video-call-screen');
    if (videoScreen && !videoScreen.classList.contains('hidden')) {
        statusEl = document.getElementById('video-call-status');
    }
    if (statusEl) statusEl.textContent = '正在转文字...';
    
    let hasRecognizedText = false;

    try {
        // 使用正确的文件扩展名和类型（SiliconFlow支持：wav/mp3/pcm/opus/webm）
        let ext = 'webm';
        if (audioBlob.type.includes('ogg')) {
            ext = 'ogg';
        } else if (audioBlob.type.includes('wav')) {
            ext = 'wav';
        } else if (audioBlob.type.includes('mp3')) {
            ext = 'mp3';
        } else {
            ext = 'webm';
        }
        const audioFile = new File([audioBlob], `voice_call.${ext}`, { type: audioBlob.type });
        
        const formData = new FormData();
        formData.append('file', audioFile);
        formData.append('model', window.iphoneSimState.whisperSettings.model || 'whisper-1');
        formData.append('language', 'zh');  // 指定中文以提高准确率

        let fetchUrl = window.iphoneSimState.whisperSettings.url;
        if (fetchUrl.endsWith('/')) {
            fetchUrl = fetchUrl.slice(0, -1);
        }
        if (!fetchUrl.endsWith('/audio/transcriptions')) {
            fetchUrl = fetchUrl + '/audio/transcriptions';
        }

        const cleanKey = window.iphoneSimState.whisperSettings.key ? window.iphoneSimState.whisperSettings.key.trim() : '';

        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${cleanKey}`
            },
            body: formData
        });

        if (!response.ok) {
            if (response.status === 403) {
                console.error('Voice Call STT 403: 模型名称可能错误，请检查设置');
            }
            const errorText = await response.text();
            throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        let text = data.text ? data.text.trim() : '';
        
        // 过滤emoji和特殊字符
        if (text) {
            text = text.replace(/[\u{1F600}-\u{1F64F}]/gu, '') // 表情符号
                       .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // 符号和象形文字
                       .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // 交通和地图符号
                       .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // 旗帜
                       .replace(/[\u{2600}-\u{26FF}]/gu, '')   // 杂项符号
                       .replace(/[\u{2700}-\u{27BF}]/gu, '')   // 装饰符号
                       .trim();
        }

        if (text) {
            console.log('VAD Recognized:', text);
            sendMessage(text, true, 'voice_call_text');
            addVoiceCallMessage(text, 'user');
            hasRecognizedText = true;
            
            // 识别成功，进入处理状态，暂停VAD
            isProcessingResponse = true;
            if (statusEl) statusEl.textContent = '对方正在思考...';
            
            generateVoiceCallAiReply();
        } else {
            console.log('VAD: No text recognized or filtered out');
        }

    } catch (error) {
        console.error('Voice Call STT Error:', error);
        // 移动端可能出现网络错误，不要弹窗打断通话
        if (statusEl) statusEl.textContent = '识别失败，继续聆听...';
    } finally {
        // 只有在没有识别出文本且没有进入处理状态时，才恢复"正在聆听"
        if (statusEl && !hasRecognizedText && !isProcessingResponse) statusEl.textContent = '正在聆听...';
    }
}

window.playVoiceMsg = async function(msgId, textElId, event) {
    if (event) event.stopPropagation();

    const btn = event.currentTarget;
    const icon = btn.querySelector('i');

    if (currentVoiceMsgId === msgId && currentVoiceAudio && !currentVoiceAudio.paused) {
        return;
    }

    if (icon && icon.classList.contains('fa-spinner')) {
        return;
    }

    if (currentVoiceAudio) {
        currentVoiceAudio.pause();
        currentVoiceAudio = null;
        currentVoiceMsgId = null;
        if (currentVoiceIcon) {
            currentVoiceIcon.className = 'fas fa-rss';
            currentVoiceIcon = null;
        }
    }
    
    const textEl = document.getElementById(textElId);
    if (textEl) textEl.classList.remove('hidden');

    let targetMsg = null;
    if (window.iphoneSimState.currentChatContactId && window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId]) {
        targetMsg = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId].find(m => m.id == msgId);
    }

    if (!targetMsg) {
        console.error('Message not found:', msgId);
        return;
    }

    let msgData = null;
    try {
        msgData = typeof targetMsg.content === 'string' ? JSON.parse(targetMsg.content) : targetMsg.content;
    } catch (e) {
        console.error('Parse error', e);
        return;
    }

    if (!msgData.audio && !msgData.isReal) {
        const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        if (!contact || !contact.ttsEnabled) {
            alert('无法播放：未启用TTS或联系人不存在');
            return;
        }

        if (icon) {
            icon.className = 'fas fa-spinner fa-spin';
        }

        try {
            const audioData = await generateMinimaxTTS(msgData.text, contact.ttsVoiceId);
            if (audioData) {
                msgData.audio = audioData;
                targetMsg.content = JSON.stringify(msgData);
                saveConfig();
            } else {
                alert('语音生成失败，请检查API配置');
                if (icon) icon.className = 'fas fa-rss';
                return;
            }
        } catch (e) {
            console.error('TTS generation error:', e);
            alert('语音生成出错');
            if (icon) icon.className = 'fas fa-rss';
            return;
        }
    }

    if (msgData.audio) {
        // 验证音频数据格式
        if (!msgData.audio.startsWith('data:audio/')) {
            console.error('Invalid audio data format');
            if (icon) icon.className = 'fas fa-rss';
            alert('音频格式错误，请重新录制');
            return;
        }
        
        try {
            const audio = new Audio();
            currentVoiceAudio = audio;
            currentVoiceMsgId = msgId;
            
            if (icon) {
                icon.className = 'fas fa-rss voice-playing-anim';
                currentVoiceIcon = icon;
            }
            
            audio.onended = () => {
                if (icon) {
                    icon.className = 'fas fa-rss';
                }
                if (currentVoiceMsgId === msgId) {
                    currentVoiceAudio = null;
                    currentVoiceMsgId = null;
                    currentVoiceIcon = null;
                }
            };
            
            audio.onerror = (e) => {
                console.error('Audio play error', e, 'Audio src length:', msgData.audio ? msgData.audio.length : 0);
                if (icon) icon.className = 'fas fa-rss';
                
                // 更友好的错误提示
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                    // 移动端可能是格式不支持
                    if (window.showChatToast) {
                        window.showChatToast('音频格式不支持，请在设置中切换录音格式');
                    } else {
                        alert('音频格式不支持，建议使用mp4格式');
                    }
                } else {
                    alert('播放失败：音频数据可能已损坏');
                }
                
                if (currentVoiceMsgId === msgId) {
                    currentVoiceAudio = null;
                    currentVoiceMsgId = null;
                    currentVoiceIcon = null;
                }
            };
            
            // 设置音频源并播放
            audio.src = msgData.audio;
            audio.load(); // 预加载
            
            audio.play().catch(err => {
                console.error('Play error:', err);
                if (icon) icon.className = 'fas fa-rss';
                
                // 更详细的错误信息
                let errorMsg = '播放失败';
                if (err.name === 'NotAllowedError') {
                    errorMsg = '需要用户交互才能播放音频';
                } else if (err.name === 'NotSupportedError') {
                    errorMsg = '音频格式不支持';
                } else {
                    errorMsg = '播放错误: ' + err.message;
                }
                
                if (window.showChatToast) {
                    window.showChatToast(errorMsg);
                } else {
                    alert(errorMsg);
                }
                
                if (currentVoiceMsgId === msgId) {
                    currentVoiceAudio = null;
                    currentVoiceMsgId = null;
                    currentVoiceIcon = null;
                }
            });
        } catch (err) {
            console.error('Audio creation error:', err);
            if (icon) icon.className = 'fas fa-rss';
            alert('音频初始化失败');
        }
    } else {
        if (icon) icon.className = 'fas fa-rss';
        alert('该消息没有音频数据。');
    }
};

window.openEditChatMessageModal = function(msgId, currentContent) {
    currentEditingChatMsgId = msgId;
    const textarea = document.getElementById('edit-chat-msg-content');
    textarea.value = currentContent;
    document.getElementById('edit-chat-msg-modal').classList.remove('hidden');
};

window.openEditBlockModal = function(jsonContent) {
    const list = document.getElementById('edit-block-list');
    list.innerHTML = '';
    
    let items = [];
    try {
        items = typeof jsonContent === 'string' ? JSON.parse(jsonContent) : jsonContent;
    } catch(e) {
        console.error(e);
        items = [];
    }
    
    items.forEach((item, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'edit-block-item';
        wrapper.style.marginBottom = '10px';
        
        const label = document.createElement('div');
        label.textContent = `消息 ${index + 1}`;
        label.style.fontSize = '12px';
        label.style.color = '#888';
        label.style.marginBottom = '4px';
        
        const textarea = document.createElement('textarea');
        textarea.className = 'block-item-json';
        textarea.style.width = '100%';
        textarea.style.height = '100px';
        textarea.style.fontFamily = 'monospace';
        textarea.style.fontSize = '12px';
        textarea.style.border = '1px solid #ddd';
        textarea.style.borderRadius = '8px';
        textarea.style.padding = '8px';
        textarea.style.resize = 'vertical';
        textarea.value = JSON.stringify(item, null, 2);
        
        const toolbar = document.createElement('div');
        toolbar.className = 'edit-block-toolbar';
        toolbar.style.display = 'flex';
        toolbar.style.gap = '8px';
        toolbar.style.marginTop = '5px';
        toolbar.style.flexWrap = 'wrap';

        const types = [
            { label: '文本', template: {"type": "text", "content": "消息内容"} },
            { label: '图片', template: {"type": "image", "content": "图片描述"} },
            { label: '转账', template: {"type": "action", "command": "TRANSFER", "payload": "88.88 备注"} },
            { label: '表情包', template: {"type": "sticker", "content": "表情包名称"} },
            { label: '语音', template: {"type": "voice", "duration": 5, "content": "语音文本"} }
        ];

        types.forEach(t => {
            const btn = document.createElement('button');
            btn.textContent = t.label;
            btn.style.padding = '4px 8px';
            btn.style.fontSize = '12px';
            btn.style.border = '1px solid #ddd';
            btn.style.borderRadius = '4px';
            btn.style.background = '#f5f5f5';
            btn.style.cursor = 'pointer';
            
            btn.onclick = () => {
                textarea.value = JSON.stringify(t.template, null, 2);
            };
            toolbar.appendChild(btn);
        });
        
        wrapper.appendChild(label);
        wrapper.appendChild(textarea);
        wrapper.appendChild(toolbar);
        list.appendChild(wrapper);
    });
    
    document.getElementById('edit-block-modal').classList.remove('hidden');
};

function handleSaveEditBlock() {
    const list = document.getElementById('edit-block-list');
    const textareas = list.querySelectorAll('.block-item-json');
    const newItems = [];
    
    try {
        textareas.forEach(ta => {
            const item = JSON.parse(ta.value);
            newItems.push(item);
        });
    } catch(e) {
        alert('JSON格式错误，请检查');
        return;
    }
    
    if (newItems.length === 0) {
        if (!confirm('没有消息内容，确定要清空该轮回复吗？')) return;
    }
    
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) return;
    
    const history = window.iphoneSimState.chatHistory[contactId];
    
    // Find indices of last AI block
    let indices = [];
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') {
            indices.unshift(i);
        } else {
            break;
        }
    }
    
    if (indices.length > 0) {
        history.splice(indices[0], indices.length);
    }
    
    // Reconstruct new messages
    let pendingThought = null;
    const newHistoryItems = [];
    
    for (const item of newItems) {
        if (item.type === 'thought') {
            pendingThought = item.content;
            continue;
        }
        
        let contentToSave = item.content;
        let typeToSave = 'text';
        let description = null;
        
        if (item.type === 'text' || item.type === '消息') {
            typeToSave = 'text';
        } else if (item.type === 'sticker' || item.type === '表情包') {
            let stickerUrl = null;
            if (window.iphoneSimState.stickerCategories) {
                for (const cat of window.iphoneSimState.stickerCategories) {
                    const found = cat.list.find(s => s.desc === item.content || s.desc.includes(item.content));
                    if (found) {
                        stickerUrl = found.url;
                        break;
                    }
                }
            }
            if (stickerUrl) {
                contentToSave = stickerUrl;
                typeToSave = 'sticker';
                description = item.content;
            } else {
                contentToSave = `[表情包: ${item.content}]`;
                typeToSave = 'text';
            }
        } else if (item.type === 'image' || item.type === 'virtual_image') {
            contentToSave = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
            typeToSave = 'virtual_image';
            description = item.content;
        } else if (item.type === 'voice') {
            const voiceData = {
                duration: item.duration || 3,
                text: item.content || '语音',
                isReal: false
            };
            contentToSave = JSON.stringify(voiceData);
            typeToSave = 'voice';
        } else if (item.type === 'action') {
            if (item.command === 'TRANSFER') {
                const parts = (item.payload || '').split(' ');
                const amount = parts[0] || '0';
                const remark = parts.slice(1).join(' ') || '转账';
                contentToSave = JSON.stringify({
                    id: Date.now(),
                    amount: amount,
                    remark: remark,
                    status: 'pending'
                });
                typeToSave = 'transfer';
            } else {
                continue;
            }
        }
        
        const msg = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            time: Date.now(),
            role: 'assistant',
            content: contentToSave,
            type: typeToSave
        };
        
        if (description) msg.description = description;
        if (pendingThought) {
            msg.thought = pendingThought;
            pendingThought = null;
        }
        
        newHistoryItems.push(msg);
    }
    
    if (pendingThought && newHistoryItems.length > 0) {
        if (newHistoryItems[newHistoryItems.length - 1].thought) {
            newHistoryItems[newHistoryItems.length - 1].thought += '\n' + pendingThought;
        } else {
            newHistoryItems[newHistoryItems.length - 1].thought = pendingThought;
        }
    }
    
    history.push(...newHistoryItems);
    
    saveConfig();
    renderChatHistory(contactId);
    document.getElementById('edit-block-modal').classList.add('hidden');
}

function handleSaveEditedChatMessage() {
    if (!currentEditingChatMsgId || !window.iphoneSimState.currentChatContactId) return;

    const newContent = document.getElementById('edit-chat-msg-content').value.trim();
    if (!newContent) {
        alert('消息内容不能为空');
        return;
    }

    if (currentEditingChatMsgId === 'LAST_AI_BLOCK') {
        try {
            const newItems = JSON.parse(newContent);
            if (!Array.isArray(newItems)) {
                alert('必须是JSON数组格式');
                return;
            }
            
            const contactId = window.iphoneSimState.currentChatContactId;
            const history = window.iphoneSimState.chatHistory[contactId];
            
            let indices = [];
            for (let i = history.length - 1; i >= 0; i--) {
                if (history[i].role === 'assistant') {
                    indices.unshift(i);
                } else {
                    break;
                }
            }
            
            if (indices.length > 0) {
                history.splice(indices[0], indices.length);
            }
            
            let pendingThought = null;
            const newHistoryItems = [];
            
            for (const item of newItems) {
                if (item.type === 'thought') {
                    pendingThought = item.content;
                    continue;
                }
                
                let contentToSave = item.content;
                let typeToSave = 'text';
                let description = null;
                
                if (item.type === 'text' || item.type === '消息') {
                    typeToSave = 'text';
                } else if (item.type === 'sticker' || item.type === '表情包') {
                    let stickerUrl = null;
                    if (window.iphoneSimState.stickerCategories) {
                        for (const cat of window.iphoneSimState.stickerCategories) {
                            const found = cat.list.find(s => s.desc === item.content || s.desc.includes(item.content));
                            if (found) {
                                stickerUrl = found.url;
                                break;
                            }
                        }
                    }
                    if (stickerUrl) {
                        contentToSave = stickerUrl;
                        typeToSave = 'sticker';
                        description = item.content;
                    } else {
                        contentToSave = `[表情包: ${item.content}]`;
                        typeToSave = 'text';
                    }
                } else if (item.type === 'image' || item.type === 'virtual_image') {
                    contentToSave = window.iphoneSimState.defaultVirtualImageUrl || 'https://placehold.co/600x400/png?text=Photo';
                    typeToSave = 'virtual_image';
                    description = item.content;
                } else if (item.type === 'voice') {
                    const voiceData = {
                        duration: item.duration || 3,
                        text: item.content || '语音',
                        isReal: false
                    };
                    contentToSave = JSON.stringify(voiceData);
                    typeToSave = 'voice';
                } else if (item.type === 'action') {
                    if (item.command === 'TRANSFER') {
                        const parts = (item.payload || '').split(' ');
                        const amount = parts[0] || '0';
                        const remark = parts.slice(1).join(' ') || '转账';
                        contentToSave = JSON.stringify({
                            id: Date.now(),
                            amount: amount,
                            remark: remark,
                            status: 'pending'
                        });
                        typeToSave = 'transfer';
                    } else {
                        continue;
                    }
                }
                
                const msg = {
                    id: Date.now() + Math.random().toString(36).substr(2, 9),
                    time: Date.now(),
                    role: 'assistant',
                    content: contentToSave,
                    type: typeToSave
                };
                
                if (description) msg.description = description;
                if (pendingThought) {
                    msg.thought = pendingThought;
                    pendingThought = null;
                }
                
                newHistoryItems.push(msg);
            }
            
            if (pendingThought && newHistoryItems.length > 0) {
                if (newHistoryItems[newHistoryItems.length - 1].thought) {
                    newHistoryItems[newHistoryItems.length - 1].thought += '\n' + pendingThought;
                } else {
                    newHistoryItems[newHistoryItems.length - 1].thought = pendingThought;
                }
            }
            
            history.push(...newHistoryItems);
            
            saveConfig();
            renderChatHistory(contactId);
            document.getElementById('edit-chat-msg-modal').classList.add('hidden');
            currentEditingChatMsgId = null;
            
        } catch (e) {
            console.error(e);
            alert('JSON解析失败，请检查格式');
        }
        return;
    }

    const messages = window.iphoneSimState.chatHistory[window.iphoneSimState.currentChatContactId];
    const msgIndex = messages.findIndex(m => m.id == currentEditingChatMsgId);

    if (msgIndex !== -1) {
        messages[msgIndex].content = newContent;
        
        saveConfig();
        renderChatHistory(window.iphoneSimState.currentChatContactId);
        
        document.getElementById('edit-chat-msg-modal').classList.add('hidden');
        currentEditingChatMsgId = null;
    } else {
        alert('找不到原消息，可能已被删除');
        document.getElementById('edit-chat-msg-modal').classList.add('hidden');
    }
}

// 初始化监听器
function setupChatListeners() {
    // 仅选择主微信应用的底栏 Tab
    const wechatTabs = document.querySelectorAll('#wechat-app .wechat-tab-item');
    
    wechatTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const currentActiveTab = document.querySelector('.wechat-tab-item.active');
            if (currentActiveTab === tab) return;

            const currentContent = document.querySelector('.wechat-tab-content.active');
            const tabName = tab.dataset.tab;
            const nextContent = document.getElementById(`wechat-tab-${tabName}`);
            const header = document.querySelector('.wechat-header');

            wechatTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (currentContent) {
                currentContent.classList.add('fade-out');
                if (header) header.classList.add('fade-out');
                
                setTimeout(() => {
                    currentContent.classList.remove('active');
                    currentContent.classList.remove('fade-out');
                    
                    if (nextContent) {
                        nextContent.style.opacity = '0';
                        nextContent.classList.add('active');
                        void nextContent.offsetWidth;
                        nextContent.style.opacity = '1'; 
                    }
                    
                    updateWechatHeader(tabName);
                    if (header) header.classList.remove('fade-out');

                }, 150);
            } else {
                if (nextContent) {
                    nextContent.style.opacity = '0';
                    nextContent.classList.add('active');
                    void nextContent.offsetWidth;
                    nextContent.style.opacity = '1';
                }
                updateWechatHeader(tabName);
            }
        });
    });

    updateWechatHeader('contacts');

    const addContactModal = document.getElementById('add-contact-modal');
    const closeAddContactBtn = document.getElementById('close-add-contact');
    const saveContactBtn = document.getElementById('save-contact-btn');

    const contactAvatarPreview = document.getElementById('contact-avatar-preview');
    const contactAvatarUpload = document.getElementById('contact-avatar-upload');
    
    if (contactAvatarPreview && contactAvatarUpload) {
        contactAvatarPreview.addEventListener('click', () => contactAvatarUpload.click());
        
        contactAvatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    contactAvatarPreview.innerHTML = `<img src="${event.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (closeAddContactBtn) closeAddContactBtn.addEventListener('click', () => addContactModal.classList.add('hidden'));
    if (saveContactBtn) saveContactBtn.addEventListener('click', handleSaveContact);

    const backToContactsBtn = document.getElementById('back-to-contacts');
    if (backToContactsBtn) backToContactsBtn.addEventListener('click', () => {
        document.getElementById('chat-screen').classList.add('hidden');
        window.iphoneSimState.currentChatContactId = null;
    });

    const chatSettingsBtn = document.getElementById('chat-settings-btn');
    const chatSettingsScreen = document.getElementById('chat-settings-screen');
    const closeChatSettingsBtn = document.getElementById('close-chat-settings');
    const saveChatSettingsBtn = document.getElementById('save-chat-settings-btn');
    const triggerAiMomentBtn = document.getElementById('trigger-ai-moment-btn');
    
    const chatSettingGroupTrigger = document.getElementById('chat-setting-group-trigger');
    const groupSelectModal = document.getElementById('group-select-modal');
    const closeGroupSelectBtn = document.getElementById('close-group-select');
    const createGroupBtn = document.getElementById('create-group-btn');

    if (chatSettingGroupTrigger) chatSettingGroupTrigger.addEventListener('click', openGroupSelect);
    if (closeGroupSelectBtn) closeGroupSelectBtn.addEventListener('click', () => groupSelectModal.classList.add('hidden'));
    if (createGroupBtn) createGroupBtn.addEventListener('click', handleCreateGroup);

    const chatSettingBgInput = document.getElementById('chat-setting-bg');
    if (chatSettingBgInput) chatSettingBgInput.addEventListener('change', handleChatWallpaperUpload);

    const aiSettingBgInput = document.getElementById('chat-setting-ai-bg-input');
    const aiSettingBgContainer = document.getElementById('ai-setting-bg-container');
    if (aiSettingBgContainer && aiSettingBgInput) {
        aiSettingBgContainer.addEventListener('click', () => aiSettingBgInput.click());
        aiSettingBgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    aiSettingBgContainer.style.backgroundImage = `url(${event.target.result})`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const userSettingBgInput = document.getElementById('chat-setting-user-bg-input');
    const userSettingBgContainer = document.getElementById('user-setting-bg-container');
    if (userSettingBgContainer && userSettingBgInput) {
        userSettingBgContainer.addEventListener('click', () => userSettingBgInput.click());
        userSettingBgInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    userSettingBgContainer.style.backgroundImage = `url(${event.target.result})`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const chatSettingAvatarInput = document.getElementById('chat-setting-avatar');
    if (chatSettingAvatarInput) {
        chatSettingAvatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('chat-setting-avatar-preview').src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const chatSettingVideoBgInput = document.getElementById('chat-setting-video-bg');
    if (chatSettingVideoBgInput) {
        chatSettingVideoBgInput.addEventListener('change', handleVideoCallBgUpload);
    }
    
    const resetChatBgBtn = document.getElementById('reset-chat-bg');
    if (resetChatBgBtn) {
        resetChatBgBtn.addEventListener('click', () => {
            window.iphoneSimState.tempSelectedChatBg = '';
            renderChatWallpaperGallery();
        });
    }

    const chatSettingTabs = document.querySelectorAll('.chat-settings-nav .nav-item');
    const chatSettingIndicator = document.querySelector('.chat-settings-nav .nav-indicator');
    
    chatSettingTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('active')) return;

            const currentContent = document.querySelector('.chat-setting-tab-content.active');
            const tabName = tab.dataset.tab;
            const nextContent = document.getElementById(`chat-setting-tab-${tabName}`);

            chatSettingTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            if (chatSettingIndicator) {
                chatSettingIndicator.style.transform = `translateX(${index * 100}%)`;
            }

            if (currentContent) {
                currentContent.classList.add('fade-out');
                setTimeout(() => {
                    currentContent.classList.remove('active');
                    currentContent.classList.remove('fade-out');
                    
                    if (nextContent) {
                        nextContent.style.opacity = '0';
                        nextContent.classList.add('active');
                        void nextContent.offsetWidth;
                        nextContent.style.opacity = '1';
                    }
                }, 150);
            } else {
                if (nextContent) {
                    nextContent.style.opacity = '0';
                    nextContent.classList.add('active');
                    void nextContent.offsetWidth;
                    nextContent.style.opacity = '1';
                }
            }
        });
    });

    const chatTitle = document.getElementById('chat-title');
    if (chatTitle) {
        chatTitle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleThoughtBubble();
        });
    }
    
    document.addEventListener('click', (e) => {
        const bubble = document.getElementById('thought-bubble');
        if (bubble && !bubble.classList.contains('hidden') && !bubble.contains(e.target) && e.target !== chatTitle) {
            bubble.classList.add('hidden');
        }
    });

    const aiProfileScreen = document.getElementById('ai-profile-screen');
    const closeAiProfileBtn = document.getElementById('close-ai-profile');
    const aiProfileMoreBtn = document.getElementById('ai-profile-more');
    const aiProfileSendMsgBtn = document.getElementById('ai-profile-send-msg');
    const aiProfileBgInput = document.getElementById('ai-profile-bg-input');
    const aiProfileBg = document.getElementById('ai-profile-bg');
    const aiRelationItem = document.getElementById('ai-relation-item');

    const currentAiProfileSendMsgBtn = document.getElementById('ai-profile-send-msg');
    if (currentAiProfileSendMsgBtn) {
        const newBtn = currentAiProfileSendMsgBtn.cloneNode(true);
        currentAiProfileSendMsgBtn.parentNode.replaceChild(newBtn, currentAiProfileSendMsgBtn);
        
        newBtn.addEventListener('click', () => {
            openMeetingsScreen(window.iphoneSimState.currentChatContactId);
        });
    }

    const relationSelectModal = document.getElementById('relation-select-modal');
    const closeRelationSelectBtn = document.getElementById('close-relation-select');
    const aiMomentsEntry = document.getElementById('ai-moments-entry');

    if (closeAiProfileBtn) closeAiProfileBtn.addEventListener('click', () => aiProfileScreen.classList.add('hidden'));
    if (aiProfileMoreBtn) aiProfileMoreBtn.addEventListener('click', openChatSettings);
    

    if (aiProfileBg) aiProfileBg.addEventListener('click', () => aiProfileBgInput.click());
    if (aiProfileBgInput) aiProfileBgInput.addEventListener('change', handleAiProfileBgUpload);
    
    if (aiRelationItem) aiRelationItem.addEventListener('click', openRelationSelect);
    if (closeRelationSelectBtn) closeRelationSelectBtn.addEventListener('click', () => relationSelectModal.classList.add('hidden'));
    
    if (aiMomentsEntry) aiMomentsEntry.addEventListener('click', openAiMoments);

    if (chatSettingsBtn) chatSettingsBtn.addEventListener('click', openChatSettings);
    if (closeChatSettingsBtn) closeChatSettingsBtn.addEventListener('click', () => chatSettingsScreen.classList.add('hidden'));
    if (saveChatSettingsBtn) saveChatSettingsBtn.addEventListener('click', handleSaveChatSettings);
    if (triggerAiMomentBtn) triggerAiMomentBtn.addEventListener('click', () => generateAiMoment(false));

    const clearChatHistoryBtn = document.getElementById('clear-chat-history-btn');
    if (clearChatHistoryBtn) clearChatHistoryBtn.addEventListener('click', handleClearChatHistory);

    const exportCharBtn = document.getElementById('export-character-btn');
    if (exportCharBtn) exportCharBtn.addEventListener('click', handleExportCharacterData);

    const importCharInput = document.getElementById('import-character-input');
    if (importCharInput) importCharInput.addEventListener('change', handleImportCharacterData);

    const chatInput = document.getElementById('chat-input');
    const triggerAiReplyBtn = document.getElementById('trigger-ai-reply-btn');

    if (chatInput) {
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const text = chatInput.value.trim();
                if (text) {
                    sendMessage(text, true);
                    chatInput.value = '';
                }
            }
        });
    }

    if (triggerAiReplyBtn) {
        triggerAiReplyBtn.addEventListener('click', () => generateAiReply());
    }

    const chatMoreBtn = document.getElementById('chat-more-btn');
    const chatMorePanel = document.getElementById('chat-more-panel');
    const stickerBtn = document.getElementById('sticker-btn');
    const stickerPanel = document.getElementById('sticker-panel');
    const chatInputArea = document.querySelector('.chat-input-area');
    
    // 分页相关元素
    const chatMorePages = document.getElementById('chat-more-pages');
    const chatMoreIndicators = document.querySelectorAll('.chat-more-dot');

    if (chatMorePages) {
        chatMorePages.addEventListener('scroll', () => {
            const pageIndex = Math.round(chatMorePages.scrollLeft / chatMorePages.clientWidth);
            chatMoreIndicators.forEach((dot, index) => {
                if (index === pageIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        });
    }
    
    function closeAllPanels() {
        if (chatMorePanel) chatMorePanel.classList.remove('slide-in');
        if (stickerPanel) stickerPanel.classList.remove('slide-in');
        if (chatInputArea) {
            chatInputArea.classList.remove('push-up');
            chatInputArea.classList.remove('push-up-more');
        }
    }

    if (chatMoreBtn && chatMorePanel) {
        chatMoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (chatMorePanel.classList.contains('slide-in')) {
                closeAllPanels();
            } else {
                if (stickerPanel) stickerPanel.classList.remove('slide-in');
                chatMorePanel.classList.add('slide-in');
                // 重置到第一页
                if (chatMorePages) chatMorePages.scrollLeft = 0;
                
                if (chatInputArea) {
                    chatInputArea.classList.remove('push-up');
                    chatInputArea.classList.add('push-up-more');
                }
                scrollToBottom();
            }
        });

        chatMorePanel.querySelectorAll('.more-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // 让TA发消息
                if (item.id === 'chat-more-continue-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    generateAiReply("用户没有回复。请继续当前的对话，或者开启一个新的话题。你可以假设已经过了一段时间。");
                    return;
                }

                // 如果是第二页的新按钮，也需要处理
                if (item.id === 'chat-more-games-btn') {
                    // 已在 js/games.js 中处理，这里只需关闭面板
                    closeAllPanels();
                    return;
                }

                if (item.id === 'chat-more-edit-msg-btn') {
                    e.stopPropagation();
                    closeAllPanels();
                    
                    if (!window.iphoneSimState.currentChatContactId) return;
                    
                    const jsonContent = getLastAiBlockJson(window.iphoneSimState.currentChatContactId);
                    
                    if (jsonContent) {
                        openEditBlockModal(jsonContent);
                    } else {
                        alert('没有找到AI发送的消息');
                    }
                    return;
                }

                if (item.id === 'chat-more-photo-btn' || item.id === 'chat-more-camera-btn' || item.id === 'chat-more-transfer-btn' || item.id === 'chat-more-memory-btn' || item.id === 'chat-more-location-btn' || item.id === 'chat-more-regenerate-btn' || item.id === 'chat-more-voice-btn' || item.id === 'chat-more-video-call-btn') return;
                
                e.stopPropagation();
                const label = item.querySelector('.more-label').textContent;
                alert(`功能 "${label}" 开发中...`);
                closeAllPanels();
            });
        });
    }

    const chatMoreVoiceBtn = document.getElementById('chat-more-voice-btn');
    const voiceInputModal = document.getElementById('voice-input-modal');
    const closeVoiceInputBtn = document.getElementById('close-voice-input');
    
    if (chatMoreVoiceBtn) {
        chatMoreVoiceBtn.addEventListener('click', () => {
            document.getElementById('chat-more-panel').classList.add('hidden');
            const fakeText = document.getElementById('voice-fake-text');
            const realRes = document.getElementById('voice-real-result');
            const sendRealBtn = document.getElementById('send-real-voice-btn');
            
            if (fakeText) fakeText.value = '';
            if (realRes) realRes.textContent = '';
            if (sendRealBtn) sendRealBtn.disabled = true;
            
            if (typeof window.switchVoiceTab === 'function') {
                window.switchVoiceTab('fake');
            }
            
            voiceInputModal.classList.remove('hidden');
        });
    }

    if (closeVoiceInputBtn) {
        closeVoiceInputBtn.addEventListener('click', () => {
            voiceInputModal.classList.add('hidden');
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
                isRecording = false;
                const micBtn = document.getElementById('voice-mic-btn');
                if (micBtn) micBtn.classList.remove('recording');
                const statusText = document.getElementById('voice-recording-status');
                if (statusText) {
                    statusText.textContent = '点击麦克风开始录音';
                    statusText.style.color = '#888';
                }
            }
        });
    }

    const sendFakeVoiceBtn = document.getElementById('send-fake-voice-btn');
    const voiceFakeDuration = document.getElementById('voice-fake-duration');
    
    if (voiceFakeDuration) {
        voiceFakeDuration.addEventListener('input', (e) => {
            const valSpan = document.getElementById('voice-fake-duration-val');
            if (valSpan) valSpan.textContent = e.target.value;
        });
    }

    if (sendFakeVoiceBtn) {
        const newBtn = sendFakeVoiceBtn.cloneNode(true);
        sendFakeVoiceBtn.parentNode.replaceChild(newBtn, sendFakeVoiceBtn);
        
        newBtn.addEventListener('click', handleSendFakeVoice);
    }

    const voiceMicBtn = document.getElementById('voice-mic-btn');
    const sendRealVoiceBtn = document.getElementById('send-real-voice-btn');

    if (voiceMicBtn) {
        const newMicBtn = voiceMicBtn.cloneNode(true);
        voiceMicBtn.parentNode.replaceChild(newMicBtn, voiceMicBtn);
        
        newMicBtn.addEventListener('click', toggleVoiceRecording);
    }

    if (sendRealVoiceBtn) {
        const newSendRealBtn = sendRealVoiceBtn.cloneNode(true);
        sendRealVoiceBtn.parentNode.replaceChild(newSendRealBtn, sendRealVoiceBtn);

        newSendRealBtn.addEventListener('click', handleSendRealVoice);
    }

    window.switchVoiceTab = function(mode) {
        const fakeTab = document.getElementById('tab-voice-fake');
        const realTab = document.getElementById('tab-voice-real');
        const fakeMode = document.getElementById('voice-mode-fake');
        const realMode = document.getElementById('voice-mode-real');
        const indicator = document.getElementById('voice-nav-indicator');

        if (mode === 'fake') {
            if(fakeTab) fakeTab.classList.add('active');
            if(realTab) realTab.classList.remove('active');
            if(fakeMode) fakeMode.classList.remove('hidden');
            if(realMode) realMode.classList.add('hidden');
            if(indicator) indicator.style.transform = 'translateX(0)';
        } else {
            if(fakeTab) fakeTab.classList.remove('active');
            if(realTab) realTab.classList.add('active');
            if(fakeMode) fakeMode.classList.add('hidden');
            if(realMode) realMode.classList.remove('hidden');
            if(indicator) indicator.style.transform = 'translateX(100%)';
        }
    };

    document.addEventListener('click', (e) => {
        const chatInputArea = document.querySelector('.chat-input-area');
        
        if (chatMorePanel && chatMorePanel.classList.contains('slide-in') && 
            !chatMorePanel.contains(e.target) && 
            !chatMoreBtn.contains(e.target)) {
            chatMorePanel.classList.remove('slide-in');
            if (chatInputArea) chatInputArea.classList.remove('push-up-more');
        }
        
        const currentStickerBtn = document.getElementById('sticker-btn');
        if (stickerPanel && stickerPanel.classList.contains('slide-in') && 
            !stickerPanel.contains(e.target) && 
            (currentStickerBtn ? !currentStickerBtn.contains(e.target) : true)) {
            stickerPanel.classList.remove('slide-in');
            if (chatInputArea) chatInputArea.classList.remove('push-up');
        }
    });

    if (chatInput) {
        chatInput.addEventListener('focus', () => {
            const chatInputArea = document.querySelector('.chat-input-area');
            if (chatMorePanel) chatMorePanel.classList.remove('slide-in');
            if (stickerPanel) stickerPanel.classList.remove('slide-in');
            if (chatInputArea) {
                chatInputArea.classList.remove('push-up');
                chatInputArea.classList.remove('push-up-more');
            }
        });
    }

    setupAiListeners(false);
    setupAiListeners(true);
    setupWhisperListeners();
    setupMinimaxListeners();

    const chatMorePhotoBtn = document.getElementById('chat-more-photo-btn');
    const chatPhotoInput = document.getElementById('chat-photo-input');
    
    if (chatMorePhotoBtn && chatPhotoInput) {
        chatMorePhotoBtn.addEventListener('click', () => chatPhotoInput.click());
        chatPhotoInput.addEventListener('change', handleChatPhotoUpload);
    }

    const chatMoreCameraBtn = document.getElementById('chat-more-camera-btn');
    if (chatMoreCameraBtn) {
        chatMoreCameraBtn.addEventListener('click', handleChatCamera);
    }

    const chatMoreVideoCallBtn = document.getElementById('chat-more-video-call-btn');
    const videoCallModal = document.getElementById('video-call-modal');
    const startVoiceCallBtn = document.getElementById('start-voice-call-btn');
    const startVideoCallBtn = document.getElementById('start-video-call-btn');
    const cancelVideoCallBtn = document.getElementById('cancel-video-call-btn');

    if (chatMoreVideoCallBtn) {
        chatMoreVideoCallBtn.addEventListener('click', () => {
            document.getElementById('chat-more-panel').classList.add('hidden');
            videoCallModal.classList.remove('hidden');
        });
    }

    if (cancelVideoCallBtn) {
        cancelVideoCallBtn.addEventListener('click', () => {
            videoCallModal.classList.add('hidden');
        });
    }

    if (startVoiceCallBtn) {
        startVoiceCallBtn.addEventListener('click', () => {
            videoCallModal.classList.add('hidden');
            startOutgoingCall();
        });
    }

    if (startVideoCallBtn) {
        startVideoCallBtn.addEventListener('click', () => {
            videoCallModal.classList.add('hidden');
            startOutgoingVideoCall();
        });
    }

    const voiceCallAcceptBtn = document.getElementById('voice-call-accept-btn');
    const voiceCallRejectBtn = document.getElementById('voice-call-reject-btn');

    if (voiceCallAcceptBtn) {
        const newBtn = voiceCallAcceptBtn.cloneNode(true);
        voiceCallAcceptBtn.parentNode.replaceChild(newBtn, voiceCallAcceptBtn);
        newBtn.addEventListener('click', acceptIncomingCall);
    }

    if (voiceCallRejectBtn) {
        const newBtn = voiceCallRejectBtn.cloneNode(true);
        voiceCallRejectBtn.parentNode.replaceChild(newBtn, voiceCallRejectBtn);
        newBtn.addEventListener('click', rejectIncomingCall);
    }

    const chatMoreMemoryBtn = document.getElementById('chat-more-memory-btn');
    if (chatMoreMemoryBtn) {
        chatMoreMemoryBtn.addEventListener('click', () => {
            if (window.openMemoryApp) window.openMemoryApp();
            document.getElementById('chat-more-panel').classList.add('hidden');
        });
    }

    const chatMoreLocationBtn = document.getElementById('chat-more-location-btn');
    if (chatMoreLocationBtn) {
        chatMoreLocationBtn.addEventListener('click', () => {
            if (window.openLocationApp) window.openLocationApp();
        });
    }

    const chatMoreTransferBtn = document.getElementById('chat-more-transfer-btn');
    const transferModal = document.getElementById('transfer-modal');
    const closeTransferBtn = document.getElementById('close-transfer-modal');
    const doTransferBtn = document.getElementById('do-transfer-btn');

    if (chatMoreTransferBtn) {
        chatMoreTransferBtn.addEventListener('click', () => {
            document.getElementById('transfer-amount').value = '';
            document.getElementById('transfer-remark').value = '';
            transferModal.classList.remove('hidden');
            document.getElementById('chat-more-panel').classList.add('hidden');
        });
    }

    if (closeTransferBtn) {
        closeTransferBtn.addEventListener('click', () => transferModal.classList.add('hidden'));
    }

    if (doTransferBtn) {
        doTransferBtn.addEventListener('click', handleTransfer);
    }

    const closeReplyBarBtn = document.getElementById('close-reply-bar');
    if (closeReplyBarBtn) {
        closeReplyBarBtn.addEventListener('click', cancelQuote);
    }

    const chatMoreRegenerateBtn = document.getElementById('chat-more-regenerate-btn');
    if (chatMoreRegenerateBtn) {
        chatMoreRegenerateBtn.addEventListener('click', handleRegenerateReply);
    }

    const multiSelectCancelBtn = document.getElementById('multi-select-cancel');
    const multiSelectDeleteBtn = document.getElementById('multi-select-delete');
    
    if (multiSelectCancelBtn) multiSelectCancelBtn.addEventListener('click', exitMultiSelectMode);
    if (multiSelectDeleteBtn) multiSelectDeleteBtn.addEventListener('click', deleteSelectedMessages);

    const editChatMsgModal = document.getElementById('edit-chat-msg-modal');
    const closeEditChatMsgBtn = document.getElementById('close-edit-chat-msg');
    const saveEditChatMsgBtn = document.getElementById('save-edit-chat-msg-btn');

    const contactsTitleBtn = document.getElementById('contacts-title-btn');
    if (contactsTitleBtn) {
        contactsTitleBtn.addEventListener('click', window.openNewFriendsScreen);
    }

    if (closeEditChatMsgBtn) {
        closeEditChatMsgBtn.addEventListener('click', () => {
            editChatMsgModal.classList.add('hidden');
            currentEditingChatMsgId = null;
        });
    }

    if (saveEditChatMsgBtn) {
        saveEditChatMsgBtn.addEventListener('click', handleSaveEditedChatMessage);
    }

    const closeAutoSnapshotBtn = document.getElementById('close-auto-snapshot');
    const saveAutoSnapshotBtn = document.getElementById('save-auto-snapshot-btn');

    if (closeAutoSnapshotBtn) {
        closeAutoSnapshotBtn.addEventListener('click', () => {
            document.getElementById('auto-snapshot-modal').classList.add('hidden');
        });
    }

    if (saveAutoSnapshotBtn) {
        saveAutoSnapshotBtn.addEventListener('click', handleSaveAutoSnapshotSettings);
    }

    const closeEditBlockBtn = document.getElementById('close-edit-block');
    const saveEditBlockBtn = document.getElementById('save-edit-block-btn');

    if (closeEditBlockBtn) {
        closeEditBlockBtn.addEventListener('click', () => {
            document.getElementById('edit-block-modal').classList.add('hidden');
        });
    }

    if (saveEditBlockBtn) {
        saveEditBlockBtn.addEventListener('click', handleSaveEditBlock);
    }

    // 系统通知设置
    const sysNotifToggle = document.getElementById('system-notification-toggle');
    if (sysNotifToggle) {
        sysNotifToggle.checked = window.iphoneSimState.enableSystemNotifications || false;
        
        sysNotifToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                if (!("Notification" in window)) {
                    alert("此浏览器不支持系统通知");
                    e.target.checked = false;
                    return;
                }

                if (Notification.permission === "granted") {
                    window.iphoneSimState.enableSystemNotifications = true;
                    saveConfig();
                    new Notification("通知已开启", { body: "你现在可以接收后台消息通知了" });
                } else if (Notification.permission !== "denied") {
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                        window.iphoneSimState.enableSystemNotifications = true;
                        saveConfig();
                        new Notification("通知已开启", { body: "你现在可以接收后台消息通知了" });
                    } else {
                        e.target.checked = false;
                        alert("需要通知权限才能开启此功能");
                    }
                } else {
                    e.target.checked = false;
                    alert("通知权限已被拒绝，请在浏览器设置中手动开启");
                }
            } else {
                window.iphoneSimState.enableSystemNotifications = false;
                saveConfig();
            }
        });
    }

    // 后台音频混音设置
    const bgAudioToggle = document.getElementById('background-audio-toggle');
    if (bgAudioToggle) {
        bgAudioToggle.checked = window.iphoneSimState.enableBackgroundAudio || false;
        
        bgAudioToggle.addEventListener('change', (e) => {
            window.iphoneSimState.enableBackgroundAudio = e.target.checked;
            saveConfig();
            
            if (window.updateAudioSession) {
                window.updateAudioSession();
            }
            
            if (e.target.checked) {
                // 尝试请求播放静音音频以激活会话（如果是用户交互触发）
                // 这在某些浏览器上可能有助于立即生效
                if (window.iphoneSimState.music && window.iphoneSimState.music.playing) {
                    // 如果正在播放，不需要做什么，updateAudioSession 会处理 Session 类型
                }
            }
        });
    }
}

function updateWechatHeader(tab) {
    const header = document.querySelector('.wechat-header');
    if (!header) return;

    const title = header.querySelector('.wechat-title');
    const left = header.querySelector('.header-left');
    const right = header.querySelector('.header-right');
    const body = document.getElementById('wechat-body');

    header.className = 'wechat-header';
    header.style.display = '';
    header.style.backgroundColor = '';
    if (body) body.classList.remove('full-screen');
    
    if (left) left.innerHTML = '';
    if (right) right.innerHTML = '';

    const closeApp = () => {
        document.getElementById('wechat-app').classList.add('hidden');
    };

    if (tab === 'wechat') {
        if (title) title.textContent = '微信';
        
        if (left) {
            const closeBtn = document.createElement('div');
            closeBtn.className = 'header-btn-text';
            closeBtn.textContent = '关闭';
            closeBtn.onclick = closeApp;
            left.appendChild(closeBtn);
        }

        if (right) {
            const addBtn = document.createElement('div');
            addBtn.className = 'wechat-icon-btn';
            addBtn.innerHTML = '<i class="fas fa-plus-circle"></i>';
            addBtn.onclick = () => document.getElementById('add-contact-modal').classList.remove('hidden');
            right.appendChild(addBtn);
        }

    } else if (tab === 'contacts') {
        header.style.display = 'none';
        
        const addBtnCustom = document.getElementById('add-contact-btn-custom');
        if (addBtnCustom) {
            const newBtn = addBtnCustom.cloneNode(true);
            addBtnCustom.parentNode.replaceChild(newBtn, addBtnCustom);
            newBtn.addEventListener('click', () => document.getElementById('add-contact-modal').classList.remove('hidden'));
        }

        const backBtnCustom = document.getElementById('contacts-back-btn');
        if (backBtnCustom) {
            const newBackBtn = backBtnCustom.cloneNode(true);
            backBtnCustom.parentNode.replaceChild(newBackBtn, backBtnCustom);
            newBackBtn.addEventListener('click', closeApp);
        }

    } else if (tab === 'addressbook') {
        header.style.display = 'none';
        
        const addBtnAddressBook = document.getElementById('add-contact-btn-addressbook');
        if (addBtnAddressBook) {
            const newBtn = addBtnAddressBook.cloneNode(true);
            addBtnAddressBook.parentNode.replaceChild(newBtn, addBtnAddressBook);
            newBtn.addEventListener('click', () => document.getElementById('add-contact-modal').classList.remove('hidden'));
        }
        
        if (typeof window.renderAddressBook === 'function') {
            window.renderAddressBook();
        } else {
            console.error('renderAddressBook not found');
        }

    } else if (tab === 'moments') {
        if (title) title.textContent = ''; 
        header.classList.add('transparent');
        if (body) body.classList.add('full-screen');

        if (left) {
            const backBtn = document.createElement('div');
            backBtn.className = 'wechat-icon-btn';
            backBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            const goBack = () => {
                const contactsTab = document.querySelector('.wechat-tab-item[data-tab="contacts"]');
                if (contactsTab) contactsTab.click();
            };
            backBtn.onclick = goBack;
            backBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                goBack();
            }, { passive: false });
            left.appendChild(backBtn);
        }

        if (right) {
            const cameraBtn = document.createElement('div');
            cameraBtn.className = 'wechat-icon-btn';
            cameraBtn.style.marginRight = '10px';
            cameraBtn.innerHTML = '<i class="fas fa-camera"></i>';
            const doPost = () => {
                if (window.openPostMoment) window.openPostMoment(false);
            };
            cameraBtn.onclick = doPost;
            cameraBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                doPost();
            }, { passive: false });
            right.appendChild(cameraBtn);
        }

    } else if (tab === 'me') {
        header.style.display = 'none';
        if (body) body.classList.add('full-screen');
    }
}

function renderGroupList() {
    const list = document.getElementById('group-list');
    if (!list) return;
    list.innerHTML = '';

    const noGroupItem = document.createElement('div');
    noGroupItem.className = 'list-item center-content';
    noGroupItem.textContent = '未分组';
    if (!window.iphoneSimState.tempSelectedGroup) {
        noGroupItem.style.color = '#007AFF';
        noGroupItem.style.fontWeight = 'bold';
    }
    noGroupItem.onclick = () => handleSelectGroup('');
    list.appendChild(noGroupItem);

    if (window.iphoneSimState.contactGroups && window.iphoneSimState.contactGroups.length > 0) {
        window.iphoneSimState.contactGroups.forEach(group => {
            const item = document.createElement('div');
            item.className = 'list-item';
            
            const content = document.createElement('div');
            content.className = 'list-content';
            content.style.justifyContent = 'center';
            content.textContent = group;
            
            if (window.iphoneSimState.tempSelectedGroup === group) {
                content.style.color = '#007AFF';
                content.style.fontWeight = 'bold';
            }

            const deleteBtn = document.createElement('i');
            deleteBtn.className = 'fas fa-trash';
            deleteBtn.style.color = '#FF3B30';
            deleteBtn.style.marginLeft = '10px';
            deleteBtn.style.fontSize = '14px';
            deleteBtn.style.padding = '5px';
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                handleDeleteGroup(group);
            };

            item.style.justifyContent = 'space-between';
            item.innerHTML = '';
            
            const leftSpacer = document.createElement('div');
            leftSpacer.style.width = '24px';
            item.appendChild(leftSpacer);

            item.appendChild(content);
            item.appendChild(deleteBtn);

            item.onclick = () => handleSelectGroup(group);
            list.appendChild(item);
        });
    }
}

function openGroupSelect() {
    renderGroupList();
    document.getElementById('group-select-modal').classList.remove('hidden');
}

function handleCreateGroup() {
    const name = prompt('请输入新分组名称：');
    if (!name) return;
    
    if (window.iphoneSimState.contactGroups.includes(name)) {
        alert('分组已存在');
        return;
    }
    
    window.iphoneSimState.contactGroups.push(name);
    saveConfig();
    renderGroupList();
}

function handleDeleteGroup(groupName) {
    if (confirm(`确定要删除分组 "${groupName}" 吗？`)) {
        window.iphoneSimState.contactGroups = window.iphoneSimState.contactGroups.filter(g => g !== groupName);
        
        if (window.iphoneSimState.tempSelectedGroup === groupName) {
            window.iphoneSimState.tempSelectedGroup = '';
            document.getElementById('chat-setting-group-value').textContent = '未分组';
        }
        
        window.iphoneSimState.contacts.forEach(c => {
            if (c.group === groupName) {
                c.group = '';
            }
        });
        
        saveConfig();
        renderGroupList();
    }
}

function handleSelectGroup(groupName) {
    window.iphoneSimState.tempSelectedGroup = groupName;
    document.getElementById('chat-setting-group-value').textContent = groupName || '未分组';
    document.getElementById('group-select-modal').classList.add('hidden');
}

function getLinkedIcityBooksContext(contactId) {
    if (!window.iphoneSimState.icityBooks || window.iphoneSimState.icityBooks.length === 0) return '';
    
    const linkedBooks = window.iphoneSimState.icityBooks.filter(b => 
        b.linkedContactIds && b.linkedContactIds.includes(contactId)
    );
    
    if (linkedBooks.length === 0) return '';
    
    let context = '\n【共读的书籍/手账】\n你们正在共同编辑以下书籍，你可以看到用户写的内容以及你之前的批注：\n';
    
    linkedBooks.forEach(book => {
        context += `\n《${book.name}》:\n`;
        if (!book.pages || book.pages.length === 0) {
            context += "(空白)\n";
            return;
        }
        
        book.pages.forEach((page, index) => {
            let content = page.content || '';
            // Temporary DOM element for parsing
            const div = document.createElement('div');
            div.innerHTML = content;
            
            // Process Ruby (Comments)
            div.querySelectorAll('ruby').forEach(el => {
                let text = '';
                if (el.childNodes.length > 0 && el.childNodes[0].nodeType === 3) {
                    text = el.childNodes[0].textContent;
                } else {
                    text = el.textContent.replace(el.querySelector('rt')?.textContent || '', '');
                }
                const rt = el.querySelector('rt');
                const annotation = rt ? rt.textContent : '';
                const replaceText = `${text} (你的批注: ${annotation})`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Strikethrough
            div.querySelectorAll('s').forEach(el => {
                const text = el.textContent;
                const replaceText = `${text} (已划掉)`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Highlight
            div.querySelectorAll('.highlight-marker').forEach(el => {
                const text = el.textContent;
                const replaceText = `${text} (高亮)`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Handwritten (AI added text)
            div.querySelectorAll('.handwritten-text').forEach(el => {
                const text = el.textContent;
                const replaceText = `(你的手写: ${text})`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process Stickers
            div.querySelectorAll('img.icity-sticker').forEach(el => {
                const src = el.src;
                let name = '未知贴纸';
                if (window.iphoneSimState.stickerCategories) {
                    for (const cat of window.iphoneSimState.stickerCategories) {
                        const found = cat.list.find(s => src.includes(s.url) || s.url === src);
                        if (found) {
                            name = found.desc;
                            break;
                        }
                    }
                }
                const replaceText = `[贴纸: ${name}]`;
                el.replaceWith(document.createTextNode(replaceText));
            });
            
            // Process other images
            div.querySelectorAll('img').forEach(el => {
                 el.replaceWith(document.createTextNode('[图片]'));
            });

            const textContent = div.textContent.trim();
            if (textContent) {
                context += `第 ${index + 1} 页: ${textContent}\n`;
            }
        });
    });
    
    return context;
}

function getLastAiBlockJson(contactId) {
    const history = window.iphoneSimState.chatHistory[contactId];
    if (!history || history.length === 0) return null;

    let indices = [];
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'assistant') {
            indices.unshift(i);
        } else {
            break;
        }
    }

    if (indices.length === 0) return null;

    let jsonOutput = [];
    
    for (let i = 0; i < indices.length; i++) {
        const msg = history[indices[i]];
        
        if (msg.thought) {
            jsonOutput.push({ type: "thought", content: msg.thought });
        }

        if (msg.type === 'text') {
            jsonOutput.push({ type: "text", content: msg.content });
        } else if (msg.type === 'sticker') {
            jsonOutput.push({ type: "sticker", content: msg.description || msg.content });
        } else if (msg.type === 'virtual_image') {
            jsonOutput.push({ type: "image", content: msg.description || "未知图片" });
        } else if (msg.type === 'voice') {
            let content = "语音";
            let duration = 3;
            try {
                const data = JSON.parse(msg.content);
                content = data.text;
                duration = data.duration;
            } catch(e) {}
            jsonOutput.push({ type: "voice", duration: duration, content: content });
        } else if (msg.type === 'description') {
             jsonOutput.push({ type: "text", content: msg.content }); 
        } else if (msg.type === 'transfer') {
             try {
                 const data = JSON.parse(msg.content);
                 jsonOutput.push({ type: "action", command: "TRANSFER", payload: `${data.amount} ${data.remark}` });
             } catch(e) {}
        }
    }

    return JSON.stringify(jsonOutput, null, 2);
}

function checkActiveReplies() {
    if (!window.iphoneSimState || !window.iphoneSimState.contacts) return;
    
    const now = Date.now();
    
    window.iphoneSimState.contacts.forEach(contact => {
        if (!contact.activeReplyEnabled) return;
        
        const history = window.iphoneSimState.chatHistory[contact.id];
        if (!history || history.length === 0) return;
        
        const lastMsg = history[history.length - 1];
        const intervalMs = (contact.activeReplyInterval || 60) * 1000;
        
        // Ensure we only count messages sent AFTER the feature was enabled
        if (contact.activeReplyStartTime && lastMsg.time <= contact.activeReplyStartTime) {
            return;
        }

        if (contact.lastActiveReplyTriggeredMsgId === lastMsg.id) return;
        
        if (now - lastMsg.time > intervalMs) {
            console.log(`[ActiveReply] Triggering for ${contact.name}`);
            
            contact.lastActiveReplyTriggeredMsgId = lastMsg.id;
            saveConfig();
            
            let activeInstruction = "";
            const timeDiff = now - lastMsg.time;
            const minutesPassed = Math.floor(timeDiff / 60000);
            
            if (lastMsg.role === 'user') {
                // User sent last message, AI is replying late
                activeInstruction = `（系统提示：主动发消息模式触发。距离用户上一条消息已过去 ${minutesPassed} 分钟。请回复用户的消息。你可以顺便解释一下为什么回复晚了，或者直接自然地继续话题。）`;
            } else {
                // AI sent last message, User didn't reply
                activeInstruction = `（系统提示：主动发消息模式触发。距离你上一条消息已过去 ${minutesPassed} 分钟，用户一直没有回复。请主动发起一条新消息，可以是对上一条的补充，或者是开启新话题，或者是分享当下的心情/状态。请保持自然，不要暴露你是AI。）`;
            }

            generateAiReply(activeInstruction, contact.id);
        }
    });
}

window.updateSystemSettingsUi = function() {
    const sysNotifToggle = document.getElementById('system-notification-toggle');
    if (sysNotifToggle) {
        sysNotifToggle.checked = window.iphoneSimState.enableSystemNotifications || false;
    }
    
    const bgAudioToggle = document.getElementById('background-audio-toggle');
    if (bgAudioToggle) {
        bgAudioToggle.checked = window.iphoneSimState.enableBackgroundAudio || false;
    }
};

// 注册初始化函数
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupChatListeners);
    window.appInitFunctions.push(() => {
        setInterval(checkActiveReplies, 5000);
    });
}

window.renderAddressBook = function() {
    const list = document.getElementById('addressbook-list');
    if (!list) {
        console.error('addressbook-list container not found');
        return;
    }
    list.innerHTML = '';
    
    if (!window.iphoneSimState || !window.iphoneSimState.contacts) {
        list.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">暂无联系人数据</div>';
        return;
    }

    // Update the static New Friends item in the UI (outside the list)
    if (window.updateNewFriendsBadge) window.updateNewFriendsBadge();

    // Sort contacts by name/pinyin (simplified: just name)
    const contacts = [...window.iphoneSimState.contacts].sort((a, b) => {
        return (a.remark || a.name).localeCompare(b.remark || b.name, 'zh-Hans-CN');
    });

    if (contacts.length === 0) {
        // Just append a message if no real contacts, but keep "New Friends"
        const emptyMsg = document.createElement('div');
        emptyMsg.style.cssText = 'padding: 20px; text-align: center; color: #999;';
        emptyMsg.textContent = '暂无联系人';
        list.appendChild(emptyMsg);
        return;
    }

    contacts.forEach(contact => {
        const item = document.createElement('div');
        item.className = 'list-item';
        // 使用行内样式覆盖可能的外部冲突，确保显示
        item.style.cssText = 'background-color: #fff; border-bottom: 1px solid #f0f0f0; padding: 10px 15px; display: flex; align-items: center; cursor: pointer;';
        
        const name = contact.remark || contact.nickname || contact.name;
        
        item.innerHTML = `
            <div class="list-content" style="display: flex; align-items: center; justify-content: flex-start; width: 100%;">
                <img src="${contact.avatar}" style="width: 40px; height: 40px; border-radius: 4px; margin-right: 12px; object-fit: cover;">
                <span style="font-size: 16px; color: #000;">${name}</span>
            </div>
        `;
        
        item.onclick = () => {
            window.iphoneSimState.currentChatContactId = contact.id;
            window.openAiProfile();
        };
        list.appendChild(item);
    });
    
    // Total count footer
    const footer = document.createElement('div');
    footer.style.textAlign = 'center';
    footer.style.padding = '20px';
    footer.style.color = '#999';
    footer.style.fontSize = '14px';
    footer.textContent = `${contacts.length} 位联系人`;
    list.appendChild(footer);
};

window.openNewFriendsScreen = function() {
    let screen = document.getElementById('new-friends-screen');
    if (!screen) {
        screen = document.createElement('div');
        screen.id = 'new-friends-screen';
        screen.className = 'app-screen';
        screen.style.zIndex = '300'; // Above contacts
        screen.style.backgroundColor = '#FFFFFF'; // iOS background color
        screen.innerHTML = `
            <div class="app-header" style="background: #fff; border-bottom: 0; box-shadow: none;">
                <div class="header-left">
                    <button class="back-btn" onclick="document.getElementById('new-friends-screen').classList.add('hidden')" style="color: #181818; font-weight: 500;">
                        <i class="fas fa-chevron-left" style="font-size: 20px; margin-right: 5px;"></i>
                    </button>
                </div>
                <div class="header-right"></div>
            </div>
            <div class="app-body" style="padding: 0; padding-bottom: 20px; overflow-y: auto;">
                <div class="ios-list-group" style="margin-top: 0; background: transparent;">
                    <div class="list-item" style="padding: 12px 16px; background: transparent; color: #666; font-size: 13px; text-transform: uppercase; font-weight: 500;">近三天</div>
                </div>
                <div id="new-friends-list" style="padding: 0 16px;"></div>
            </div>
        `;
        document.getElementById('wechat-app').appendChild(screen);
    }
    
    renderNewFriendsList();
    screen.classList.remove('hidden');
};

function renderNewFriendsList() {
    const list = document.getElementById('new-friends-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    const requests = window.iphoneSimState.wechatFriendRequests || [];
    
    if (requests.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #8e8e93;">
                <i class="fas fa-user-friends" style="font-size: 48px; margin-bottom: 15px; opacity: 0.3;"></i>
                <div style="font-size: 15px;">暂无好友申请</div>
            </div>
        `;
        return;
    }
    
    // Sort by pending first, then by time
    const sorted = [...requests].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return b.time - a.time;
    });
    
    sorted.forEach(req => {
        const item = document.createElement('div');
        item.className = 'new-friend-item';
        item.style.cssText = `
            background: #fff;
            padding: 12px 16px;
            border-bottom: 0.5px solid #e5e5ea;
            display: flex;
            align-items: center;
            margin-bottom: 0;
        `;
        
        // Status Text or Button
        let statusHtml = '';
        if (req.status === 'pending') {
            statusHtml = `<button class="accept-btn" style="background: #007AFF; color: #fff; border: none; padding: 6px 16px; border-radius: 18px; font-size: 14px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;">接受</button>`;
        } else if (req.status === 'accepted') {
            statusHtml = `<span style="color: #8e8e93; font-size: 14px; font-weight: 500;">已添加</span>`;
        } else {
            statusHtml = `<span style="color: #8e8e93; font-size: 14px;">已拒绝</span>`;
        }
        
        const avatarUrl = req.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + req.name;
        
        item.innerHTML = `
            <div style="width: 48px; height: 48px; border-radius: 8px; margin-right: 10px; background: #f2f2f7; background-image: url('${avatarUrl}'); background-size: cover; background-position: center; flex-shrink: 0;"></div>
            <div style="flex: 1; overflow: hidden; margin-right: 10px;">
                <div style="font-size: 17px; font-weight: 600; color: #000; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${req.name}</div>
                <div style="font-size: 14px; color: #8e8e93; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${req.reason || '请求添加你为朋友'}</div>
            </div>
            <div style="flex-shrink: 0;">${statusHtml}</div>
        `;
        
        const btn = item.querySelector('.accept-btn');
        if (btn) {
            btn.onclick = (e) => {
                e.stopPropagation();
                // Show Accept Modal
                showAcceptFriendModal(req);
            };
            btn.onmousedown = () => btn.style.opacity = '0.7';
            btn.onmouseup = () => btn.style.opacity = '1';
        }
        
        // Click item to view details (simplified: just show modal if pending)
        item.onclick = () => {
            if (req.status === 'pending') {
                showAcceptFriendModal(req);
            }
        };
        
        // Add subtle hover effect
        item.onmouseenter = () => item.style.backgroundColor = '#f5f5f5';
        item.onmouseleave = () => item.style.backgroundColor = '#fff';
        
        list.appendChild(item);
    });
}

function showAcceptFriendModal(req) {
    let modal = document.getElementById('accept-friend-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'accept-friend-modal';
        modal.className = 'modal';
        modal.style.cssText = 'display: flex; opacity: 1; pointer-events: auto; z-index: 2000; align-items: center; justify-content: center;'; 
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.width = '300px';
        content.style.height = 'auto';
        content.style.maxHeight = '80%';
        content.style.borderRadius = '12px';
        
        content.innerHTML = `
            <div style="padding: 20px; text-align: center;">
                <div id="accept-avatar" style="width: 60px; height: 60px; border-radius: 6px; background: #ccc; margin: 0 auto 10px auto; background-size: cover; background-position: center;"></div>
                <h3 id="accept-name" style="margin: 0 0 5px 0;">Name</h3>
                <p id="accept-reason" style="color: #999; font-size: 14px; margin: 0 0 20px 0;">Reason</p>
                
                <div style="text-align: left; background: #f9f9f9; padding: 10px; border-radius: 6px; margin-bottom: 20px;">
                    <div style="font-size: 12px; color: #999; margin-bottom: 5px;">设置备注</div>
                    <input type="text" id="accept-remark" placeholder="添加备注名" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                </div>
                
                <button id="confirm-accept-btn" style="width: 100%; padding: 10px; background: #07C160; color: #fff; border: none; border-radius: 6px; font-size: 16px; margin-bottom: 10px;">完成</button>
                <button onclick="document.getElementById('accept-friend-modal').classList.add('hidden')" style="width: 100%; padding: 10px; background: #f2f2f7; color: #000; border: none; border-radius: 6px; font-size: 16px;">取消</button>
            </div>
        `;
        modal.appendChild(content);
        document.body.appendChild(modal);
    }
    
    document.getElementById('accept-avatar').style.backgroundImage = `url('${req.avatar || ''}')`;
    document.getElementById('accept-name').textContent = req.name;
    document.getElementById('accept-reason').textContent = req.reason;
    document.getElementById('accept-remark').value = req.name;
    
    document.getElementById('confirm-accept-btn').onclick = async () => {
        const remark = document.getElementById('accept-remark').value.trim();
        await handleAcceptFriend(req, remark);
        modal.classList.add('hidden');
    };
    
    modal.classList.remove('hidden');
}

async function safeCallAiApi(messages) {
    const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
    if (!settings.url || !settings.key) {
        console.warn("AI Settings missing");
        return null;
    }

    let fetchUrl = settings.url;
    if (!fetchUrl.endsWith('/chat/completions')) {
        fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
    }

    const cleanKey = settings.key ? settings.key.replace(/[^\x00-\x7F]/g, "").trim() : '';
    
    try {
        const response = await fetch(fetchUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
                model: settings.model || 'gpt-3.5-turbo',
                messages: messages,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.choices && data.choices.length > 0) {
            return data.choices[0].message.content;
        }
    } catch (e) {
        console.error("AI Call failed", e);
    }
    return null;
}

async function handleAcceptFriend(req, remark) {
    // 1. Generate Persona using AI (if available)
    let persona = "普通朋友";
    
    // Check if persona is already pre-generated
    if (req.preGeneratedPersona) {
        persona = req.preGeneratedPersona;
    } else if (req.icityContext && req.icityContext.msgId) {
        // Try to fetch context from iCity chat history
        const icityMsg = window.iphoneSimState.icityMessages ? window.iphoneSimState.icityMessages.find(m => m.id === req.icityContext.msgId) : null;
        if (icityMsg && icityMsg.history) {
            const contextText = icityMsg.history.map(h => `${h.role === 'me' ? '我' : 'TA'}: ${h.content}`).join('\n');
            
            // Try to generate persona
            try {
                const settings = window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : window.iphoneSimState.aiSettings2;
                if (settings.url && settings.key) {
                    const prompt = `根据以下聊天记录，为"TA"生成一个详细的人物设定，要求极度详细且具有“活人感”。
    请包含以下内容：
    1. 真实姓名（**请务必随机生成一个富有特色的名字，绝对不要使用'小明'、'李华'、'王伟'等常见名，尝试使用有深意的名字**）
    2. 性别
    3. 外貌描写（详细描述五官、发型、穿搭风格等，具有画面感）
    4. 爱好与特长
    5. 生活习惯（作息、饮食口味、口头禅、常用表情包风格）
    6. 讨厌的东西或雷点
    7. 成长经历（简述）
    8. 性格深度解析
    9. 隐藏设定（亲密关系）：XP/癖好、经验、敏感点（**必须以纯文本描述，严禁使用嵌套对象**）
    
    请直接输出人设描述，确保鲜活生动。persona 字段必须是一个长字符串，不要嵌套 JSON 对象。
                    
                    ${contextText}`;
                    
                    const messages = [{ role: 'user', content: prompt }];
                    persona = await safeCallAiApi(messages); 
                }
            } catch (e) {
                console.error("Failed to generate persona", e);
            }
        }
    }

    // 2. Create Contact
    const newContact = {
        id: Date.now(),
        name: req.name,
        nickname: req.name,
        remark: remark || req.name,
        avatar: req.avatar,
        persona: persona,
        style: '正常',
        activeReplyEnabled: false,
        autoItineraryEnabled: false,
        userPerception: [],
        group: 'iCity', // Automatically group
        source: 'icity'
    };
    
    window.iphoneSimState.contacts.push(newContact);

    // Transfer Chat History from iCity
    if (req.icityContext && req.icityContext.msgId) {
        const icityMsg = window.iphoneSimState.icityMessages ? window.iphoneSimState.icityMessages.find(m => m.id === req.icityContext.msgId) : null;
        if (icityMsg && icityMsg.history) {
            if (!window.iphoneSimState.chatHistory) window.iphoneSimState.chatHistory = {};
            if (!window.iphoneSimState.chatHistory[newContact.id]) window.iphoneSimState.chatHistory[newContact.id] = [];
            
            // Map icity history to chat history
            const transferredMessages = icityMsg.history.map(h => ({
                id: Date.now() + Math.random(), 
                role: (h.role === 'me' || h.role === 'user') ? 'user' : 'assistant',
                content: h.content,
                time: h.time,
                type: 'text' // Assume text for simplicity
            }));
            
            // Add a divider
            transferredMessages.push({
                id: Date.now(),
                role: 'system',
                content: '[系统消息]: 以上是来自 iCity 的历史对话',
                time: Date.now(),
                type: 'text'
            });

            window.iphoneSimState.chatHistory[newContact.id] = transferredMessages;
        }
    }
    
    // 3. Update Request Status
    req.status = 'accepted';
    
    // 4. Save
    saveConfig();
    
    // 5. Update UI
    renderNewFriendsList();
    if (window.renderContactList) window.renderContactList();
    
    // 6. Navigate to Chat
    document.getElementById('new-friends-screen').classList.add('hidden');
    openChat(newContact.id);
    
    // 7. Initial Greeting (Optional)
    setTimeout(() => {
        // Generate a greeting based on context?
        // Or just let AI handle it naturally when user says hello
        sendMessage(`[系统消息]: 你已添加了 ${remark}，现在可以开始聊天了。`, false, 'text', null, newContact.id);
    }, 500);
}
