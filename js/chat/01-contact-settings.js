// 聊天功能模块 (聊天, 联系人, AI, 语音)

function estimateChatPromptTextTokensLocal(text) {
    if (typeof text !== 'string' || !text) return 0;

    let total = 0;
    for (let i = 0; i < text.length;) {
        const char = text[i];

        if (/\s/.test(char)) {
            i += 1;
            continue;
        }

        if (/[A-Za-z0-9_]/.test(char)) {
            let end = i + 1;
            while (end < text.length && /[A-Za-z0-9_]/.test(text[end])) {
                end += 1;
            }
            total += Math.ceil((end - i) / 4);
            i = end;
            continue;
        }

        if (/[\x00-\x7F]/.test(char)) {
            total += 1;
            i += 1;
            continue;
        }

        const codePoint = text.codePointAt(i);
        total += 1;
        i += codePoint > 0xFFFF ? 2 : 1;
    }

    return total;
}

// Token统计函数（与真实提示词预览使用同一估算规则）
function countTokensForPrompts(prompts) {
    if (!Array.isArray(prompts)) return 0;
    let total = 0;
    for (const p of prompts) {
        if (typeof p !== 'string') continue;
        total += typeof window.estimateAiTextTokens === 'function'
            ? window.estimateAiTextTokens(p)
            : estimateChatPromptTextTokensLocal(p);
    }
    return total;
}

const CONTACT_REST_WAKE_PROBABILITY = 0.2;
const CONTACT_REST_OFFLINE_REGEX = /(晚安|先睡了|睡了|去睡|去睡觉|睡觉了|先休息|休息了|我先下了|先下了|下线|离线|回头聊)/;

function ensureContactRestWindowFields(contact) {
    if (!contact || typeof contact !== 'object') return contact;
    if (typeof contact.restWindowEnabled !== 'boolean') contact.restWindowEnabled = false;
    if (typeof contact.restWindowStart !== 'string') contact.restWindowStart = '';
    if (typeof contact.restWindowEnd !== 'string') contact.restWindowEnd = '';
    if (contact.restWindowAwakenedAt === undefined) contact.restWindowAwakenedAt = null;
    return contact;
}

function parseContactRestWindowTime(value) {
    const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
}

function buildDateWithMinutes(baseDate, totalMinutes) {
    const next = new Date(baseDate.getTime());
    next.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
    return next;
}

function getContactRestWindowStatus(contact, now = Date.now()) {
    ensureContactRestWindowFields(contact);
    const startMinutes = parseContactRestWindowTime(contact && contact.restWindowStart);
    const endMinutes = parseContactRestWindowTime(contact && contact.restWindowEnd);
    const enabled = !!(contact && contact.restWindowEnabled && startMinutes !== null && endMinutes !== null && startMinutes !== endMinutes);
    const result = {
        enabled,
        inRestWindow: false,
        awakened: false,
        startTimeMs: null,
        endTimeMs: null
    };
    if (!enabled) return result;

    const nowDate = new Date(now);
    const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
    let windowStart = null;
    let windowEnd = null;

    if (startMinutes < endMinutes) {
        if (nowMinutes >= startMinutes && nowMinutes < endMinutes) {
            windowStart = buildDateWithMinutes(nowDate, startMinutes);
            windowEnd = buildDateWithMinutes(nowDate, endMinutes);
        }
    } else {
        if (nowMinutes >= startMinutes) {
            windowStart = buildDateWithMinutes(nowDate, startMinutes);
            windowEnd = buildDateWithMinutes(new Date(nowDate.getTime() + 86400000), endMinutes);
        } else if (nowMinutes < endMinutes) {
            windowStart = buildDateWithMinutes(new Date(nowDate.getTime() - 86400000), startMinutes);
            windowEnd = buildDateWithMinutes(nowDate, endMinutes);
        }
    }

    if (!windowStart || !windowEnd) return result;

    result.inRestWindow = true;
    result.startTimeMs = windowStart.getTime();
    result.endTimeMs = windowEnd.getTime();
    const awakenedAt = Number(contact && contact.restWindowAwakenedAt);
    result.awakened = Number.isFinite(awakenedAt) && awakenedAt >= result.startTimeMs && awakenedAt < result.endTimeMs;
    return result;
}

function isContactRestOfflineText(text) {
    const raw = String(text || '').trim();
    if (!raw) return false;
    return CONTACT_REST_OFFLINE_REGEX.test(raw);
}

function shouldTrackAssistantRestState(text, type = 'text') {
    if (type !== 'text') return true;
    const raw = String(text || '').trim();
    if (!raw) return false;
    if (/^\[(系统|System)/i.test(raw)) return false;
    if (/^(系统消息|系统提示)[:：]/.test(raw)) return false;
    return true;
}

function updateContactRestStateOnAssistantMessage(contactId, text, type = 'text', now = Date.now()) {
    if (!window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) return false;
    const contact = window.iphoneSimState.contacts.find(item => item.id === contactId);
    if (!contact) return false;
    ensureContactRestWindowFields(contact);
    if (!shouldTrackAssistantRestState(text, type)) return false;

    const status = getContactRestWindowStatus(contact, now);
    if (!status.enabled || !status.inRestWindow) return false;

    if (type === 'text' && isContactRestOfflineText(text)) {
        if (contact.restWindowAwakenedAt !== null) {
            contact.restWindowAwakenedAt = null;
            return true;
        }
        return false;
    }

    if (!status.awakened) {
        contact.restWindowAwakenedAt = now;
        return true;
    }
    return false;
}

function getContactRestTriggerDecision(contact, triggerSource = 'system', now = Date.now()) {
    ensureContactRestWindowFields(contact);
    const normalizedSource = String(triggerSource || 'system').trim() || 'system';
    const status = getContactRestWindowStatus(contact, now);
    const decision = {
        allow: true,
        status,
        shouldToast: false,
        reason: ''
    };
    if (!status.enabled || !status.inRestWindow) return decision;
    if (status.awakened) return decision;

    if (normalizedSource === 'manual') {
        const shouldWake = Math.random() <= CONTACT_REST_WAKE_PROBABILITY;
        decision.allow = shouldWake;
        decision.shouldToast = !shouldWake;
        decision.reason = shouldWake ? 'wake-up' : 'resting';
        return decision;
    }

    if (normalizedSource === 'active' || normalizedSource === 'offline-active') {
        decision.allow = false;
        decision.reason = 'resting-active-blocked';
        return decision;
    }

    return decision;
}

function syncRestWindowSettingsVisibility() {
    const enabledInput = document.getElementById('chat-setting-rest-window-enabled');
    const panel = document.getElementById('chat-setting-rest-window-time-panel');
    if (!enabledInput || !panel) return;
    panel.style.display = enabledInput.checked ? '' : 'none';
}

window.ensureContactRestWindowFields = ensureContactRestWindowFields;
window.getContactRestWindowStatus = getContactRestWindowStatus;
window.isContactRestOfflineText = isContactRestOfflineText;
window.updateContactRestStateOnAssistantMessage = updateContactRestStateOnAssistantMessage;
window.getContactRestTriggerDecision = getContactRestTriggerDecision;
window.syncRestWindowSettingsVisibility = syncRestWindowSettingsVisibility;

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

function getChatSettingsLocationSummaryText() {
    const country = document.getElementById('chat-setting-location-country')?.value || '';
    const province = document.getElementById('chat-setting-location-province')?.value || '';
    const city = document.getElementById('chat-setting-location-city')?.value || '';
    if (province || city) return [province, city].filter(Boolean).join(' · ');
    if (country) return country;
    return '点击选择国家、省份、城市';
}

function updateChatSettingsLocationSummary() {
    const trigger = document.getElementById('chat-setting-location-trigger');
    const summary = document.getElementById('chat-setting-location-summary');
    const country = document.getElementById('chat-setting-location-country')?.value || '';
    const province = document.getElementById('chat-setting-location-province')?.value || '';
    const city = document.getElementById('chat-setting-location-city')?.value || '';
    const isEmpty = !country && !province && !city;
    if (summary) summary.textContent = getChatSettingsLocationSummaryText();
    if (trigger) trigger.classList.toggle('is-empty', isEmpty);
}

function setChatSettingsLocationPickerOpen(isOpen) {
    const trigger = document.getElementById('chat-setting-location-trigger');
    const picker = document.getElementById('chat-setting-location-picker');
    if (!trigger || !picker) return;
    trigger.classList.toggle('is-open', !!isOpen);
    picker.classList.toggle('mag-hidden', !isOpen);
    syncChatSettingsFloatingCardState(trigger);
}

function bindChatSettingsLocationPicker() {
    const trigger = document.getElementById('chat-setting-location-trigger');
    if (trigger && trigger.dataset.bound !== '1') {
        trigger.dataset.bound = '1';
        trigger.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            const picker = document.getElementById('chat-setting-location-picker');
            const willOpen = picker ? picker.classList.contains('mag-hidden') : false;
            if (willOpen) closeAllChatSettingsMultiSelects();
            setChatSettingsLocationPickerOpen(willOpen);
        });
    }

    if (!window.__chatSettingsLocationPickerDocBound) {
        window.__chatSettingsLocationPickerDocBound = true;
        document.addEventListener('click', (event) => {
            const field = document.querySelector('#chat-settings-screen .mag-target-location-field');
            const picker = document.getElementById('chat-setting-location-picker');
            if (!field || !picker || picker.classList.contains('mag-hidden')) return;
            if (!field.contains(event.target)) setChatSettingsLocationPickerOpen(false);
        });
    }
}

// 初始化位置选择器
function initLocationSelectors() {
    const countrySelect = document.getElementById('chat-setting-location-country');
    const provinceSelect = document.getElementById('chat-setting-location-province');
    const citySelect = document.getElementById('chat-setting-location-city');
    if (!countrySelect || !provinceSelect || !citySelect) return;

    countrySelect.innerHTML = '<option value="">选择国家</option>';
    Object.keys(LOCATION_DATA).forEach(country => {
        const opt = document.createElement('option');
        opt.value = country;
        opt.textContent = country;
        countrySelect.appendChild(opt);
    });

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
        updateChatSettingsLocationSummary();
    };

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
        updateChatSettingsLocationSummary();
    };

    citySelect.onchange = function() {
        updateChatSettingsLocationSummary();
        setChatSettingsLocationPickerOpen(false);
    };
}

// 加载联系人位置到选择器
function loadLocationToSelectors(contact) {
    const countrySelect = document.getElementById('chat-setting-location-country');
    const provinceSelect = document.getElementById('chat-setting-location-province');
    const citySelect = document.getElementById('chat-setting-location-city');
    if (!countrySelect || !provinceSelect || !citySelect) return;

    bindChatSettingsLocationPicker();
    initLocationSelectors();

    const loc = contact.location || {};
    if (loc.country) {
        countrySelect.value = loc.country;
        countrySelect.onchange();
        if (loc.province) {
            provinceSelect.value = loc.province;
            provinceSelect.onchange();
            if (loc.city) citySelect.value = loc.city;
        }
    }

    updateChatSettingsLocationSummary();
    setChatSettingsLocationPickerOpen(false);
}

// 从选择器获取位置数据
function getLocationFromSelectors() {
    const country = document.getElementById('chat-setting-location-country')?.value || '';
    const province = document.getElementById('chat-setting-location-province')?.value || '';
    const city = document.getElementById('chat-setting-location-city')?.value || '';
    if (!country && !province && !city) return null;
    return {
        country,
        province,
        city,
        query: [country, province, city].filter(Boolean).join(' ')
    };
}

let activeChatSettingsPromptPreview = null;

const CHAT_SETTINGS_LINKED_MULTI_SELECTS = {
    worldbooks: {
        triggerId: 'chat-setting-wb-trigger',
        panelId: 'chat-setting-wb-list',
        tagsId: 'chat-setting-wb-tags',
        placeholder: '点击选择关联世界书',
        chipClass: 'is-accent',
        checkboxClass: 'wb-category-checkbox',
        emptyText: '暂无世界书分类'
    },
    stickers: {
        triggerId: 'chat-setting-sticker-trigger',
        panelId: 'chat-setting-sticker-list',
        tagsId: 'chat-setting-sticker-tags',
        placeholder: '点击选择关联表情包',
        chipClass: '',
        checkboxClass: 'sticker-category-checkbox',
        emptyText: '暂无表情包分类'
    }
};

function syncChatSettingsFloatingCardState(source) {
    const card = source && source.closest ? source.closest('.mag-card') : source;
    if (!card) return;
    const hasOpenLocation = !!card.querySelector('#chat-setting-location-picker:not(.mag-hidden)');
    const hasOpenMulti = !!card.querySelector('.mag-multi-select-panel:not(.mag-hidden)');
    card.classList.toggle('is-elevated', hasOpenLocation || hasOpenMulti);
}

function getChatSettingsPromptSource(previewElement) {
    if (!previewElement) return null;
    const inputId = previewElement.dataset.inputId || '';
    return inputId ? document.getElementById(inputId) : null;
}

function getChatSettingsPromptTextNode(previewElement) {
    if (!previewElement) return null;
    let textNode = previewElement.querySelector('.mag-prompt-preview-text');
    if (!textNode) {
        textNode = document.createElement('span');
        textNode.className = 'mag-prompt-preview-text';
        previewElement.innerHTML = '';
        previewElement.appendChild(textNode);
    }
    return textNode;
}

function syncChatSettingsPromptPreview(previewElement) {
    if (!previewElement) return;
    const source = getChatSettingsPromptSource(previewElement);
    const defaultText = previewElement.getAttribute('data-default-text') || '';
    const actualText = source ? String(source.value || '').trim() : '';
    const textNode = getChatSettingsPromptTextNode(previewElement);
    const displayText = actualText || defaultText;
    const normalizedText = previewElement.classList.contains('mag-prompt-preview-clamp')
        ? displayText.split(/\r?\n+/).join(' ')
        : displayText;
    if (textNode) textNode.textContent = normalizedText;
    previewElement.dataset.fullText = actualText;
    previewElement.style.color = actualText ? 'var(--mag-text)' : 'rgba(0,0,0,0.3)';
}

function syncChatSettingsPromptPreviewByIds(previewId, inputId) {
    const previewElement = document.getElementById(previewId);
    const source = document.getElementById(inputId);
    if (!previewElement || !source) return;
    previewElement.dataset.inputId = inputId;
    syncChatSettingsPromptPreview(previewElement);
}

function openChatSettingsPromptModal(previewElementOrId) {
    const previewElement = typeof previewElementOrId === 'string'
        ? document.getElementById(previewElementOrId)
        : previewElementOrId;
    const promptModal = document.getElementById('chat-settings-prompt-modal');
    const textarea = document.getElementById('chat-settings-modal-textarea');
    if (!previewElement || !promptModal || !textarea) return;
    const source = getChatSettingsPromptSource(previewElement);
    activeChatSettingsPromptPreview = previewElement;
    const titleEn = document.getElementById('chat-settings-modal-title-en');
    const titleZh = document.getElementById('chat-settings-modal-title-zh');
    if (titleEn) titleEn.textContent = previewElement.dataset.modalEn || 'Edit Prompt';
    if (titleZh) titleZh.textContent = previewElement.dataset.modalZh || '编辑指令';
    textarea.placeholder = previewElement.dataset.modalPlaceholder || '在此输入详细的指令...';
    textarea.value = source ? String(source.value || '') : '';
    promptModal.classList.add('active');
    setTimeout(() => textarea.focus(), 220);
}

function closeChatSettingsPromptModal() {
    const promptModal = document.getElementById('chat-settings-prompt-modal');
    if (promptModal) promptModal.classList.remove('active');
    activeChatSettingsPromptPreview = null;
}

function saveChatSettingsPromptModal() {
    if (activeChatSettingsPromptPreview) {
        const textarea = document.getElementById('chat-settings-modal-textarea');
        const source = getChatSettingsPromptSource(activeChatSettingsPromptPreview);
        if (textarea && source) {
            source.value = textarea.value.trim();
            source.dispatchEvent(new Event('input', { bubbles: true }));
            source.dispatchEvent(new Event('change', { bubbles: true }));
        }
        syncChatSettingsPromptPreview(activeChatSettingsPromptPreview);
    }
    closeChatSettingsPromptModal();
}

function initializeChatSettingsPromptUI() {
    const screen = document.getElementById('chat-settings-screen');
    const promptModal = document.getElementById('chat-settings-prompt-modal');

    if (promptModal && promptModal.parentElement !== document.body) {
        document.body.appendChild(promptModal);
    }

    if (!window.__chatSettingsPromptDelegatedBound) {
        window.__chatSettingsPromptDelegatedBound = true;
        document.addEventListener('click', event => {
            const previewElement = event.target.closest('#chat-settings-screen .chat-settings-prompt-trigger');
            if (!previewElement) return;
            event.preventDefault();
            openChatSettingsPromptModal(previewElement);
        });
        document.addEventListener('keydown', event => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const activeElement = document.activeElement;
            if (!activeElement || !activeElement.matches('#chat-settings-screen .chat-settings-prompt-trigger')) return;
            event.preventDefault();
            openChatSettingsPromptModal(activeElement);
        });
    }

    document.querySelectorAll('#chat-settings-screen .chat-settings-prompt-trigger').forEach(previewElement => {
        if (previewElement.dataset.promptBound !== '1') {
            previewElement.dataset.promptBound = '1';
            previewElement.addEventListener('click', () => openChatSettingsPromptModal(previewElement));
            previewElement.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openChatSettingsPromptModal(previewElement);
                }
            });
        }
        const source = getChatSettingsPromptSource(previewElement);
        if (source && source.dataset.promptSyncBound !== '1') {
            source.dataset.promptSyncBound = '1';
            source.addEventListener('input', () => syncChatSettingsPromptPreview(previewElement));
            source.addEventListener('change', () => syncChatSettingsPromptPreview(previewElement));
        }
        syncChatSettingsPromptPreview(previewElement);
    });

    const cancelBtn = document.getElementById('chat-settings-modal-cancel');
    const saveBtn = document.getElementById('chat-settings-modal-save');
    if (cancelBtn && cancelBtn.dataset.bound !== '1') {
        cancelBtn.dataset.bound = '1';
        cancelBtn.addEventListener('click', closeChatSettingsPromptModal);
    }
    if (saveBtn && saveBtn.dataset.bound !== '1') {
        saveBtn.dataset.bound = '1';
        saveBtn.addEventListener('click', saveChatSettingsPromptModal);
    }
    if (promptModal && promptModal.dataset.bound !== '1') {
        promptModal.dataset.bound = '1';
        promptModal.addEventListener('click', event => {
            if (event.target === promptModal) closeChatSettingsPromptModal();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && promptModal.classList.contains('active')) {
                closeChatSettingsPromptModal();
            }
        });
    }
}

function getChatSettingsMultiSelectConfig(key) {
    return CHAT_SETTINGS_LINKED_MULTI_SELECTS[key] || null;
}

function closeAllChatSettingsMultiSelects(exceptKey = '') {
    Object.keys(CHAT_SETTINGS_LINKED_MULTI_SELECTS).forEach(key => {
        if (key === exceptKey) return;
        const config = getChatSettingsMultiSelectConfig(key);
        const trigger = config ? document.getElementById(config.triggerId) : null;
        const panel = config ? document.getElementById(config.panelId) : null;
        const field = trigger ? trigger.closest('.mag-multi-select-field') : null;
        if (trigger) trigger.classList.remove('is-open');
        if (field) field.classList.remove('is-open');
        if (panel) panel.classList.add('mag-hidden');
        if (field) syncChatSettingsFloatingCardState(field);
    });
}

function renderChatSettingsMultiSelectTags(key) {
    const config = getChatSettingsMultiSelectConfig(key);
    const tags = config ? document.getElementById(config.tagsId) : null;
    const trigger = config ? document.getElementById(config.triggerId) : null;
    const panel = config ? document.getElementById(config.panelId) : null;
    if (!config || !tags || !trigger || !panel) return;

    tags.innerHTML = '';
    const selected = Array.from(panel.querySelectorAll(`.${config.checkboxClass}:checked`)).map(cb => cb.dataset.name).filter(Boolean);
    if (!selected.length) {
        const placeholder = document.createElement('span');
        placeholder.className = 'mag-multi-select-placeholder';
        placeholder.textContent = config.placeholder;
        tags.appendChild(placeholder);
        trigger.classList.add('is-empty');
        return;
    }

    trigger.classList.remove('is-empty');
    const availableWidth = Math.max(tags.clientWidth, trigger.clientWidth - 28, 220);
    const overflowTolerance = 1;

    const createChip = item => {
        const chip = document.createElement('span');
        chip.className = `mag-chip${config.chipClass ? ' ' + config.chipClass : ''}`;
        chip.textContent = item;
        return chip;
    };

    const createPage = () => {
        const page = document.createElement('div');
        page.className = 'mag-inline-tag-page';

        const firstRow = document.createElement('div');
        firstRow.className = 'mag-inline-tag-row';
        const secondRow = document.createElement('div');
        secondRow.className = 'mag-inline-tag-row';

        page.appendChild(firstRow);
        page.appendChild(secondRow);
        tags.appendChild(page);

        return {
            page,
            rows: [firstRow, secondRow]
        };
    };

    let currentPage = createPage();
    let currentRowIndex = 0;

    const appendToFreshPage = chip => {
        currentPage = createPage();
        currentRowIndex = 0;
        currentPage.rows[0].appendChild(chip);
    };

    selected.forEach(item => {
        const chip = createChip(item);
        const currentRow = currentPage.rows[currentRowIndex];
        currentRow.appendChild(chip);

        if (currentRow.scrollWidth <= availableWidth + overflowTolerance || currentRow.childElementCount === 1) {
            return;
        }

        chip.remove();

        if (currentRowIndex === 0) {
            currentRowIndex = 1;
            const secondRow = currentPage.rows[1];
            secondRow.appendChild(chip);

            if (secondRow.scrollWidth <= availableWidth + overflowTolerance || secondRow.childElementCount === 1) {
                return;
            }

            chip.remove();
            appendToFreshPage(chip);
            return;
        }

        appendToFreshPage(chip);
    });

    tags.querySelectorAll('.mag-inline-tag-page').forEach(page => {
        const rows = page.querySelectorAll('.mag-inline-tag-row');
        const secondRow = rows[1];
        if (secondRow && !secondRow.childElementCount) {
            secondRow.remove();
        }
    });
}

function renderChatSettingsMultiSelectOptions(key, options, selectedIds) {
    const config = getChatSettingsMultiSelectConfig(key);
    const panel = config ? document.getElementById(config.panelId) : null;
    if (!config || !panel) return;

    panel.innerHTML = '';
    if (!Array.isArray(options) || options.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'mag-multi-option';
        empty.textContent = config.emptyText;
        panel.appendChild(empty);
        renderChatSettingsMultiSelectTags(key);
        return;
    }

    options.forEach(option => {
        const label = document.createElement('label');
        label.className = 'mag-multi-option';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = config.checkboxClass;
        checkbox.dataset.id = option.id;
        checkbox.dataset.name = option.name || '未命名';
        checkbox.checked = selectedIds.has(Number(option.id));
        checkbox.addEventListener('change', () => {
            renderChatSettingsMultiSelectTags(key);
            scheduleChatSettingsTokenPreviewRefresh();
        });

        const text = document.createElement('span');
        text.textContent = option.name || '未命名';

        label.appendChild(checkbox);
        label.appendChild(text);
        panel.appendChild(label);
    });

    renderChatSettingsMultiSelectTags(key);
}

function toggleChatSettingsMultiSelect(key, forceOpen) {
    const config = getChatSettingsMultiSelectConfig(key);
    const trigger = config ? document.getElementById(config.triggerId) : null;
    const panel = config ? document.getElementById(config.panelId) : null;
    const field = trigger ? trigger.closest('.mag-multi-select-field') : null;
    if (!config || !trigger || !panel) return;

    const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.classList.contains('mag-hidden');
    closeAllChatSettingsMultiSelects(shouldOpen ? key : '');
    if (shouldOpen) setChatSettingsLocationPickerOpen(false);
    panel.classList.toggle('mag-hidden', !shouldOpen);
    trigger.classList.toggle('is-open', shouldOpen);
    if (field) {
        field.classList.toggle('is-open', shouldOpen);
        syncChatSettingsFloatingCardState(field);
    }
}

function initializeChatSettingsLinkedSelectors(contact) {
    const worldbookOptions = Array.isArray(window.iphoneSimState.wbCategories) ? window.iphoneSimState.wbCategories : [];
    const stickerOptions = Array.isArray(window.iphoneSimState.stickerCategories) ? window.iphoneSimState.stickerCategories : [];
    const selectedWorldbooks = Array.isArray(contact.linkedWbCategories)
        ? new Set(contact.linkedWbCategories.map(id => Number(id)))
        : new Set(worldbookOptions.map(option => Number(option.id)));
    const selectedStickers = Array.isArray(contact.linkedStickerCategories)
        ? new Set(contact.linkedStickerCategories.map(id => Number(id)))
        : new Set(stickerOptions.map(option => Number(option.id)));

    renderChatSettingsMultiSelectOptions('worldbooks', worldbookOptions, selectedWorldbooks);
    renderChatSettingsMultiSelectOptions('stickers', stickerOptions, selectedStickers);

    Object.keys(CHAT_SETTINGS_LINKED_MULTI_SELECTS).forEach(key => {
        const config = getChatSettingsMultiSelectConfig(key);
        const trigger = config ? document.getElementById(config.triggerId) : null;
        const panel = config ? document.getElementById(config.panelId) : null;
        if (trigger && trigger.dataset.bound !== '1') {
            trigger.dataset.bound = '1';
            trigger.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                toggleChatSettingsMultiSelect(key);
            });
        }
        if (panel && panel.dataset.bound !== '1') {
            panel.dataset.bound = '1';
            panel.addEventListener('click', event => event.stopPropagation());
        }
    });

    if (!window.__chatSettingsMultiSelectDocBound) {
        window.__chatSettingsMultiSelectDocBound = true;
        document.addEventListener('click', event => {
            const settingsScreen = document.getElementById('chat-settings-screen');
            if (!settingsScreen || settingsScreen.classList.contains('hidden')) return;
            if (!settingsScreen.contains(event.target)) return;
            closeAllChatSettingsMultiSelects();
        });
    }
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
    else if (content.startsWith('[表情包]') || content.startsWith('<img') && content.includes('sticker')) previewText = '[动画表情]';
    else if (content.startsWith('[语音]')) previewText = '[语音]';
    else if (content.startsWith('[转账]')) previewText = '[转账]';
    else if (content.startsWith('[亲属卡]')) previewText = '[亲属卡]';
    else if (content.includes('pay_request')) previewText = '[代付请求]';
    else if (content.includes('shopping_gift')) previewText = '[礼物]';
    else if (content.includes('savings_invite')) previewText = '[共同存钱邀请]';
    else if (content.includes('savings_withdraw_request')) previewText = '[共同存钱转出申请]';
    else if (content.includes('savings_progress')) previewText = '[共同存钱进度]';
    else if (content.includes('delivery_share')) previewText = '[外卖]';

    const trimmedContent = String(content || '').trim();
    if (/^https?:\/\/\S+$/i.test(trimmedContent)) {
        previewText = /\.(?:gif)(?:[?#].*)?$/i.test(trimmedContent) || /(?:[?&](?:format|type)=gif\b)/i.test(trimmedContent)
            ? '[动画表情]'
            : '[图片]';
    }
    
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

function createBaseContactPayload({ name, remark = '', persona = '', avatar = '' }) {
    const resolvedName = String(name || '').trim();
    return {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name: resolvedName,
        nickname: resolvedName,
        remark: String(remark || '').trim(),
        persona: String(persona || '').trim(),
        style: '正常',
        avatar: avatar || ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(resolvedName || 'contact')),
        activeReplyEnabled: false,
        activeReplyInterval: 60,
        restWindowEnabled: false,
        restWindowStart: '',
        restWindowEnd: '',
        restWindowAwakenedAt: null,
        calendarAwareEnabled: true,
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
        meetingLinkedWbCategories: [],
        linkedStickerCategories: []
    };
}

function resetAddContactForm() {
    const nameInput = document.getElementById('contact-name');
    const remarkInput = document.getElementById('contact-remark');
    const personaInput = document.getElementById('contact-persona');
    const avatarInput = document.getElementById('contact-avatar-upload');
    const preview = document.getElementById('contact-avatar-preview');
    if (nameInput) nameInput.value = '';
    if (remarkInput) remarkInput.value = '';
    if (personaInput) personaInput.value = '';
    if (avatarInput) avatarInput.value = '';
    if (preview) {
        preview.innerHTML = '<i class="fas fa-camera"></i>';
    }
}

function closeAddContactModeChooser() {
    const modal = document.getElementById('add-contact-entry-modal');
    if (modal) modal.classList.add('hidden');
}

function openAddContactModeChooser() {
    const modal = document.getElementById('add-contact-entry-modal');
    if (modal) modal.classList.remove('hidden');
}

function openManualAddContactModal() {
    closeAddContactModeChooser();
    const modal = document.getElementById('add-contact-modal');
    if (modal) modal.classList.remove('hidden');
}

function triggerImportContactFilePicker() {
    closeAddContactModeChooser();
    const input = document.getElementById('contact-import-file-input');
    if (input) input.click();
}

window.openAddContactModeChooser = openAddContactModeChooser;
window.closeAddContactModeChooser = closeAddContactModeChooser;
window.openManualAddContactModal = openManualAddContactModal;
window.triggerImportContactFilePicker = triggerImportContactFilePicker;

function splitImportedListValue(value) {
    if (Array.isArray(value)) return value;
    if (typeof value !== 'string') return [];
    return value.split(/[\n,，]/);
}

function uniqueImportedStringList(values) {
    return Array.from(new Set((Array.isArray(values) ? values : [])
        .map(value => String(value || '').trim())
        .filter(Boolean)));
}

function getImportFileBaseName(fileName) {
    return String(fileName || '导入角色').replace(/\.[^.]+$/, '').trim() || '导入角色';
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(String(event?.target?.result || ''));
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event?.target?.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(String(event?.target?.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function decodeBase64Utf8(text) {
    const normalized = String(text || '').replace(/\s+/g, '');
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index++) {
        bytes[index] = binary.charCodeAt(index);
    }
    return new TextDecoder('utf-8').decode(bytes);
}

function looksLikeBase64Payload(text) {
    const normalized = String(text || '').trim().replace(/\s+/g, '');
    if (!normalized || normalized.length < 16 || normalized.length % 4 !== 0) return false;
    return /^[A-Za-z0-9+/=]+$/.test(normalized);
}

function tryParseJsonCandidate(raw) {
    const initial = String(raw || '').trim();
    if (!initial) return null;

    const candidates = [initial];
    try {
        const uriDecoded = decodeURIComponent(initial);
        if (uriDecoded && !candidates.includes(uriDecoded)) candidates.push(uriDecoded);
    } catch (err) {
    }

    candidates.slice().forEach(candidate => {
        if (looksLikeBase64Payload(candidate)) {
            try {
                const decoded = decodeBase64Utf8(candidate);
                if (decoded && !candidates.includes(decoded)) candidates.push(decoded);
            } catch (err) {
            }
        }
    });

    for (const candidate of candidates) {
        try {
            return JSON.parse(candidate);
        } catch (err) {
        }
    }

    return null;
}

function findNullByteIndex(bytes, start = 0) {
    for (let index = start; index < bytes.length; index++) {
        if (bytes[index] === 0) return index;
    }
    return -1;
}

async function inflatePngTextBytes(bytes) {
    if (typeof DecompressionStream !== 'function') {
        throw new Error('当前浏览器不支持解压 PNG 角色卡元数据');
    }
    const stream = new DecompressionStream('deflate');
    const writer = stream.writable.getWriter();
    await writer.write(bytes);
    await writer.close();
    const outputBuffer = await new Response(stream.readable).arrayBuffer();
    return new Uint8Array(outputBuffer);
}

async function extractPngTextChunks(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (signature.some((value, index) => bytes[index] !== value)) {
        throw new Error('不是有效的 PNG 文件');
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const latin1Decoder = new TextDecoder('latin1');
    const utf8Decoder = new TextDecoder('utf-8');
    const chunks = [];

    let offset = 8;
    while (offset + 12 <= bytes.length) {
        const length = view.getUint32(offset);
        const type = latin1Decoder.decode(bytes.subarray(offset + 4, offset + 8));
        const dataStart = offset + 8;
        const dataEnd = dataStart + length;
        if (dataEnd + 4 > bytes.length) break;
        const data = bytes.subarray(dataStart, dataEnd);

        if (type === 'tEXt') {
            const keywordEnd = findNullByteIndex(data);
            if (keywordEnd > -1) {
                chunks.push({
                    keyword: latin1Decoder.decode(data.subarray(0, keywordEnd)),
                    value: latin1Decoder.decode(data.subarray(keywordEnd + 1))
                });
            }
        } else if (type === 'zTXt') {
            const keywordEnd = findNullByteIndex(data);
            if (keywordEnd > -1 && data.length > keywordEnd + 2) {
                const inflated = await inflatePngTextBytes(data.subarray(keywordEnd + 2));
                chunks.push({
                    keyword: latin1Decoder.decode(data.subarray(0, keywordEnd)),
                    value: utf8Decoder.decode(inflated)
                });
            }
        } else if (type === 'iTXt') {
            const keywordEnd = findNullByteIndex(data);
            if (keywordEnd > -1 && data.length > keywordEnd + 2) {
                const compressionFlag = data[keywordEnd + 1];
                let cursor = keywordEnd + 3;
                const languageEnd = findNullByteIndex(data, cursor);
                cursor = languageEnd > -1 ? languageEnd + 1 : cursor;
                const translatedEnd = findNullByteIndex(data, cursor);
                cursor = translatedEnd > -1 ? translatedEnd + 1 : cursor;
                const textBytes = data.subarray(cursor);
                const resolvedText = compressionFlag === 1
                    ? utf8Decoder.decode(await inflatePngTextBytes(textBytes))
                    : utf8Decoder.decode(textBytes);
                chunks.push({
                    keyword: latin1Decoder.decode(data.subarray(0, keywordEnd)),
                    value: resolvedText
                });
            }
        }

        offset = dataEnd + 4;
        if (type === 'IEND') break;
    }

    return chunks;
}

async function parseContactImportFile(file) {
    const lowerName = String(file?.name || '').toLowerCase();
    const isPngFile = (file && file.type === 'image/png') || lowerName.endsWith('.png');

    if (isPngFile) {
        const [arrayBuffer, avatarDataUrl] = await Promise.all([
            readFileAsArrayBuffer(file),
            readFileAsDataUrl(file)
        ]);
        const chunks = await extractPngTextChunks(arrayBuffer);
        const priority = ['chara', 'ccv3', 'ccv2', 'character'];
        const orderedChunks = chunks.slice().sort((left, right) => {
            const leftIndex = priority.findIndex(item => String(left?.keyword || '').toLowerCase().includes(item));
            const rightIndex = priority.findIndex(item => String(right?.keyword || '').toLowerCase().includes(item));
            const resolvedLeft = leftIndex === -1 ? priority.length : leftIndex;
            const resolvedRight = rightIndex === -1 ? priority.length : rightIndex;
            return resolvedLeft - resolvedRight;
        });

        for (const chunk of orderedChunks) {
            const parsed = tryParseJsonCandidate(chunk?.value);
            if (parsed) {
                return { payload: parsed, avatarDataUrl, sourceType: 'png' };
            }
        }
        throw new Error('未在 PNG 中找到可识别的角色数据');
    }

    const text = await readFileAsText(file);
    const parsed = tryParseJsonCandidate(text);
    if (!parsed) {
        throw new Error('文件格式错误，未找到可识别的 JSON 数据');
    }
    return { payload: parsed, avatarDataUrl: '', sourceType: 'json' };
}

function getImportedPayloadRoot(payload) {
    if (payload && payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        return payload.data;
    }
    return payload || {};
}

function extractImportedWorldbookEntries(payload, root) {
    const candidates = [
        payload?.worldbookEntries,
        root?.worldbookEntries,
        payload?.worldbook,
        root?.worldbook,
        root?.character_book?.entries,
        payload?.character_book?.entries,
        root?.characterBook?.entries,
        payload?.characterBook?.entries,
        root?.lorebook?.entries,
        payload?.lorebook?.entries
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    return [];
}

function extractImportedRegexEntries(payload, root) {
    const candidates = [
        payload?.regexEntries,
        root?.regexEntries,
        payload?.regex,
        root?.regex,
        root?.extensions?.regex_scripts,
        payload?.extensions?.regex_scripts
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate)) {
            return candidate;
        }
    }

    return [];
}

function buildImportedPersonaText(payload, root) {
    const sections = [];
    const appendSection = (label, value) => {
        const text = String(value || '').trim();
        if (!text) return;
        sections.push(`【${label}】\n${text}`);
    };

    appendSection('角色设定', root?.description || payload?.description);
    appendSection('性格特点', root?.personality || payload?.personality);
    appendSection('场景背景', root?.scenario || payload?.scenario);
    appendSection('示例对话', root?.mes_example || payload?.mes_example);
    appendSection('补充说明', root?.creator_notes || payload?.creator_notes || root?.system_prompt || payload?.system_prompt);

    return sections.join('\n\n').trim();
}

function normalizeImportedMessage(message, index, fallbackRole = 'assistant') {
    const content = String(message?.content ?? message?.mes ?? message?.text ?? '').trim();
    if (!content) return null;
    const role = message?.role === 'user' ? 'user' : (message?.role === 'assistant' ? 'assistant' : fallbackRole);
    return Object.assign({}, message, {
        id: message?.id || (Date.now() + index + Math.random().toString(36).slice(2, 8)),
        time: Number.isFinite(Number(message?.time)) ? Number(message.time) : (Date.now() + index),
        role,
        content
    });
}

function normalizeImportedChatHistory(chatHistory, fallbackAssistantText = '') {
    const normalized = Array.isArray(chatHistory)
        ? chatHistory.map((message, index) => normalizeImportedMessage(message, index)).filter(Boolean)
        : [];

    if (normalized.length) {
        return normalized;
    }

    const greeting = String(fallbackAssistantText || '').trim();
    if (!greeting) {
        return [];
    }

    return [normalizeImportedMessage({ role: 'assistant', content: greeting }, 0, 'assistant')].filter(Boolean);
}

function buildImportedContactBundle(payload, options = {}) {
    const root = getImportedPayloadRoot(payload);
    const sourceContact = payload?.contact && typeof payload.contact === 'object'
        ? payload.contact
        : (root?.contact && typeof root.contact === 'object' ? root.contact : null);

    const resolvedName = String(
        sourceContact?.name
        || root?.name
        || payload?.name
        || root?.char_name
        || payload?.char_name
        || getImportFileBaseName(options.fileName)
    ).trim();

    if (!resolvedName) {
        throw new Error('未识别到角色名称');
    }

    const resolvedRemark = String(sourceContact?.remark || sourceContact?.nickname || '').trim();
    const resolvedPersona = String(sourceContact?.persona || buildImportedPersonaText(payload, root) || '').trim();
    const fallbackContact = createBaseContactPayload({
        name: resolvedName,
        remark: resolvedRemark,
        persona: resolvedPersona,
        avatar: sourceContact?.avatar || root?.avatar || payload?.avatar || options.avatarDataUrl || ''
    });

    const contact = Object.assign({}, fallbackContact, sourceContact || {});
    contact.id = Date.now() + Math.floor(Math.random() * 1000);
    contact.name = resolvedName;
    contact.nickname = String(contact.nickname || resolvedName).trim() || resolvedName;
    contact.remark = resolvedRemark;
    contact.persona = resolvedPersona;
    contact.avatar = String(contact.avatar || options.avatarDataUrl || fallbackContact.avatar);
    contact.linkedWbCategories = [];
    contact.linkedStickerCategories = [];

    const firstMessage = String(root?.first_mes || payload?.first_mes || '').trim();
    const chatHistory = normalizeImportedChatHistory(payload?.chatHistory || root?.chatHistory, firstMessage);

    return {
        contact,
        chatHistory,
        moments: Array.isArray(payload?.moments) ? payload.moments : [],
        memories: Array.isArray(payload?.memories) ? payload.memories : [],
        meetings: payload?.meetings || null,
        phoneLayout: payload?.phoneLayout || null,
        phoneContent: payload?.phoneContent || null,
        itinerary: payload?.itinerary || null,
        worldbookEntries: extractImportedWorldbookEntries(payload, root),
        worldbookDescription: String(root?.character_book?.description || payload?.character_book?.description || '').trim(),
        regexEntries: extractImportedRegexEntries(payload, root)
    };
}

async function finalizeImportedContactBundle(bundle) {
    const state = window.iphoneSimState;
    if (!state) throw new Error('应用状态未初始化');

    if (!Array.isArray(state.contacts)) state.contacts = [];
    if (!state.chatHistory || typeof state.chatHistory !== 'object') state.chatHistory = {};
    if (!Array.isArray(state.moments)) state.moments = [];
    if (!Array.isArray(state.memories)) state.memories = [];

    const contact = bundle.contact;
    state.contacts.push(contact);
    state.chatHistory[contact.id] = Array.isArray(bundle.chatHistory) ? bundle.chatHistory : [];

    (Array.isArray(bundle.moments) ? bundle.moments : []).forEach((item, index) => {
        state.moments.push(Object.assign({}, item, {
            id: item?.id || (Date.now() + index + Math.floor(Math.random() * 1000)),
            contactId: contact.id
        }));
    });

    (Array.isArray(bundle.memories) ? bundle.memories : []).forEach((item, index) => {
        state.memories.push(Object.assign({}, item, {
            id: item?.id || (Date.now() + index + Math.floor(Math.random() * 1000)),
            contactId: contact.id
        }));
    });

    if (bundle.meetings) {
        if (!state.meetings || typeof state.meetings !== 'object') state.meetings = {};
        state.meetings[contact.id] = bundle.meetings;
    }
    if (bundle.phoneLayout) {
        if (!state.phoneLayouts || typeof state.phoneLayouts !== 'object') state.phoneLayouts = {};
        state.phoneLayouts[contact.id] = bundle.phoneLayout;
    }
    if (bundle.phoneContent) {
        if (!state.phoneContent || typeof state.phoneContent !== 'object') state.phoneContent = {};
        state.phoneContent[contact.id] = bundle.phoneContent;
    }
    if (bundle.itinerary) {
        if (!state.itineraries || typeof state.itineraries !== 'object') state.itineraries = {};
        state.itineraries[contact.id] = bundle.itinerary;
    }

    let worldbookResult = null;
    if (Array.isArray(bundle.worldbookEntries) && bundle.worldbookEntries.length > 0 && typeof window.upsertWorldbookImportBundle === 'function') {
        try {
            worldbookResult = window.upsertWorldbookImportBundle({
                categoryName: contact.name,
                description: bundle.worldbookDescription || `来自 ${contact.name} 的导入资料`,
                entries: bundle.worldbookEntries,
                replaceExisting: true
            });
            if (worldbookResult?.categoryId) {
                contact.linkedWbCategories = [worldbookResult.categoryId];
            }
        } catch (err) {
            console.error('Worldbook import failed', err);
        }
    }

    let regexResult = null;
    if (Array.isArray(bundle.regexEntries) && bundle.regexEntries.length > 0 && window.PresetApp && typeof window.PresetApp.upsertImportedRegexBundle === 'function') {
        try {
            regexResult = await window.PresetApp.upsertImportedRegexBundle({
                presetTitle: contact.name,
                categoryName: contact.name,
                regexEntries: bundle.regexEntries,
                replaceExisting: true
            });
        } catch (err) {
            console.error('Regex import failed', err);
        }
    }

    await Promise.resolve(saveConfig());
    if (window.renderContactList) {
        window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
    }

    resetAddContactForm();
    closeAddContactModeChooser();
    const addContactModal = document.getElementById('add-contact-modal');
    if (addContactModal) addContactModal.classList.add('hidden');

    const summary = [
        `联系人：${contact.name}`,
        worldbookResult ? `世界书：${worldbookResult.entryCount} 条` : '世界书：0 条',
        regexResult ? `正则：${regexResult.entryCount} 条` : '正则：0 条'
    ];
    alert(`导入成功\n${summary.join('\n')}`);
    openChat(contact.id);
}

async function handleImportContactFileSelection(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    try {
        const parsedResult = await parseContactImportFile(file);
        const bundle = buildImportedContactBundle(parsedResult.payload, {
            fileName: file.name,
            avatarDataUrl: parsedResult.avatarDataUrl
        });
        await finalizeImportedContactBundle(bundle);
    } catch (err) {
        console.error('Import contact bundle failed', err);
        alert(`导入失败：${err && err.message ? err.message : '文件格式错误'}`);
    } finally {
        if (event && event.target) {
            event.target.value = '';
        }
    }
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

    const contact = createBaseContactPayload({ name, remark, persona });

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
    resetAddContactForm();
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
    if (msg.type === 'system_event' || msg.type === 'live_sync_hidden' || msg.type === 'family_card_spend_notice_hidden' || msg.type === 'screen_share_hidden') return true;
    if (
        msg.role === 'system'
        && typeof msg.content === 'string'
        && (
            msg.content.startsWith('[System]: Screen share started')
            || msg.content.startsWith('[System]: Typed ')
            || msg.content.startsWith('[System]: Tried to type ')
            || msg.content.startsWith('[System]: No text to type')
            || msg.content.startsWith('[System]: No input is available right now')
            || msg.content.startsWith('[System]: The password for ')
            || msg.content.startsWith('[System]: Password is still empty, cannot tap Open yet')
        )
    ) return true;
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
    return;
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
    const explicitBlockMarkers = [
        '[[html_start]]',
        '[[html_end]]',
        '[html_start]',
        '[html_end]',
        '<html_start>',
        '<html_end>',
        '{{html_start}}',
        '{{html_end}}'
    ];
    return htmlMarkers.some(marker => source.includes(marker))
        || explicitBlockMarkers.some(marker => source.includes(marker));
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

function formatContactListTimeLabel(timestamp) {
    const time = Number(timestamp);
    if (!Number.isFinite(time) || time <= 0) return '';
    const date = new Date(time);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

function getLastRenderableChatMessage(contactId) {
    const history = window.iphoneSimState && window.iphoneSimState.chatHistory
        ? window.iphoneSimState.chatHistory[contactId]
        : null;
    if (!Array.isArray(history) || history.length === 0) return null;

    for (let index = history.length - 1; index >= 0; index--) {
        const msg = history[index];
        if (shouldHideChatSyncMsg(msg)) continue;
        return msg;
    }

    return null;
}

function getSortedContactsForCurrentGroup(filterGroup = (window.iphoneSimState && window.iphoneSimState.currentContactGroup) || 'all') {
    const contacts = window.iphoneSimState && Array.isArray(window.iphoneSimState.contacts)
        ? [...window.iphoneSimState.contacts]
        : [];

    const filteredContacts = filterGroup === 'all'
        ? contacts
        : contacts.filter(contact => contact.group === filterGroup);

    filteredContacts.sort((contactA, contactB) => {
        if (contactA.isPinned && !contactB.isPinned) return -1;
        if (!contactA.isPinned && contactB.isPinned) return 1;

        const lastTimeA = getLastRenderableChatMessage(contactA.id);
        const lastTimeB = getLastRenderableChatMessage(contactB.id);
        return Number(lastTimeB && lastTimeB.time) - Number(lastTimeA && lastTimeA.time);
    });

    return filteredContacts;
}

function isElementVisibleInScrollViewport(element, container) {
    if (!element || !container) return false;
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return elementRect.bottom > containerRect.top && elementRect.top < containerRect.bottom;
}

window.getWechatListScreenShareSnapshot = function() {
    const activeTab = document.querySelector('#wechat-app .wechat-tab-item.active')?.dataset?.tab || 'contacts';
    const list = document.getElementById('contact-list');
    let items = [];

    if (list) {
        const renderedItems = Array.from(list.querySelectorAll('.contact-item'));
        const visibleItems = renderedItems.filter(item => isElementVisibleInScrollViewport(item, list));
        const sourceItems = (visibleItems.length > 0 ? visibleItems : renderedItems).slice(0, 8);

        items = sourceItems.map(item => ({
            name: (item.querySelector('.contact-name')?.textContent || '').trim(),
            preview: (item.querySelector('.contact-msg-preview')?.textContent || '[消息]').trim() || '[消息]',
            time: (item.querySelector('.contact-time')?.textContent || '').trim(),
            pinned: item.classList.contains('pinned')
        })).filter(item => item.name);
    }

    if (items.length === 0) {
        items = getSortedContactsForCurrentGroup().slice(0, 8).map(contact => {
            const lastMsg = getLastRenderableChatMessage(contact.id);
            return {
                name: contact.remark || contact.nickname || contact.name || '联系人',
                preview: formatLastMsgPreview(lastMsg) || '[消息]',
                time: formatContactListTimeLabel(lastMsg && lastMsg.time),
                pinned: !!contact.isPinned
            };
        });
    }

    return {
        activeTab,
        items
    };
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

function applyChatSettingsCustomCssPreview() {
    const cssTextarea = document.getElementById('chat-setting-custom-css');
    if (!cssTextarea) return;

    const existingStyle = document.getElementById('chat-custom-css');
    if (existingStyle) existingStyle.remove();

    const customCss = cssTextarea.value.trim();
    if (!customCss) return;

    const style = document.createElement('style');
    style.id = 'chat-custom-css';
    style.textContent = `#chat-screen#chat-screen#chat-screen { ${customCss} }`;
    document.head.appendChild(style);
}

window.applyChatSettingsCustomCssPreview = applyChatSettingsCustomCssPreview;

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

    if (typeof window.prefetchAmapChatContext === 'function') {
        window.prefetchAmapChatContext(contactId);
    }
}

// --- 资料卡功能 ---

function getActiveAiProfileContactId() {
    return window.iphoneSimState.currentAiProfileContactId || window.iphoneSimState.currentChatContactId || null;
}

function getActiveAiProfileContact() {
    const contactId = getActiveAiProfileContactId();
    if (!contactId) return null;
    return window.iphoneSimState.contacts.find(c => c.id === contactId) || null;
}

window.openAiProfile = async function(contactId = null) {
    const resolvedContactId = contactId || window.iphoneSimState.currentChatContactId;
    if (!resolvedContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === resolvedContactId);
    if (!contact) return;

    window.iphoneSimState.currentAiProfileContactId = contact.id;

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
    const contact = getActiveAiProfileContact();
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

window.handleAiProfileBgUpload = handleAiProfileBgUpload;

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
    const contact = getActiveAiProfileContact();
    if (!contact) return;

    contact.relation = relation;
    document.getElementById('ai-profile-relation').textContent = relation;
    saveConfig();
    document.getElementById('relation-select-modal').classList.add('hidden');
}

// --- 聊天设置功能 ---

function setChatSettingsEditorialAvatar(elementId, imageUrl, fallbackHtml) {
    const element = document.getElementById(elementId);
    if (!element) return;
    if (imageUrl) {
        element.style.backgroundImage = `url(${imageUrl})`;
        element.innerHTML = '';
    } else {
        element.style.backgroundImage = '';
        element.innerHTML = fallbackHtml;
    }
}

function syncChatSettingsEditorialHeader(contact = null) {
    const activeContact = contact || (typeof getActiveAiProfileContact === 'function' ? getActiveAiProfileContact() : null);
    const contactPreview = document.getElementById('chat-setting-avatar-preview');
    const userPreview = document.getElementById('chat-setting-my-avatar-preview');
    const contactPreviewSrc = contactPreview ? (contactPreview.getAttribute('src') || '').trim() : '';
    const userPreviewSrc = userPreview ? (userPreview.getAttribute('src') || '').trim() : '';
    const contactAvatar = contactPreviewSrc || (activeContact && activeContact.avatar) || '';
    const userAvatar = userPreviewSrc || (activeContact && activeContact.myAvatar) || (window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.avatar) || '';

    setChatSettingsEditorialAvatar('chat-settings-editorial-contact-avatar', contactAvatar, '<i class="ri-user-line"></i>');
    setChatSettingsEditorialAvatar('chat-settings-editorial-user-avatar', userAvatar, '<i class="ri-user-smile-line"></i>');
}

window.syncChatSettingsEditorialHeader = syncChatSettingsEditorialHeader;

function syncChatSettingsStickyChrome() {
    const screen = document.getElementById('chat-settings-screen');
    const header = screen ? screen.querySelector('.chat-settings-editorial-header') : null;
    const nav = screen ? screen.querySelector('.chat-settings-nav') : null;
    if (!screen || !header) return;

    requestAnimationFrame(() => {
        const headerHeight = Math.ceil(header.getBoundingClientRect().height || 0);
        const navHeight = nav ? Math.ceil(nav.getBoundingClientRect().height || 0) : 0;

        if (headerHeight > 0) {
            screen.style.setProperty('--chat-settings-header-height', `${headerHeight}px`);
        }

        if (navHeight > 0) {
            screen.style.setProperty('--chat-settings-nav-height', `${navHeight}px`);
        }
    });
}

window.syncChatSettingsStickyChrome = syncChatSettingsStickyChrome;

function mountChatSettingsEditorialNav() {
    const screen = document.getElementById('chat-settings-screen');
    const header = screen ? screen.querySelector('.chat-settings-editorial-header') : null;
    const hero = header ? header.querySelector('.chat-settings-editorial-hero') : null;
    const nav = screen ? screen.querySelector('.chat-settings-nav') : null;
    if (!screen || !header || !hero || !nav) return;
    if (nav.parentElement === header) return;
    hero.insertAdjacentElement('afterend', nav);
}

window.mountChatSettingsEditorialNav = mountChatSettingsEditorialNav;

function syncChatSettingsNavIndicator(activeItem = null) {
    const screen = document.getElementById('chat-settings-screen');
    const nav = screen ? screen.querySelector('.chat-settings-nav') : null;
    const indicator = nav ? nav.querySelector('.nav-indicator') : null;
    const target = activeItem || (nav ? nav.querySelector('.nav-item.active') : null);
    if (!nav || !indicator || !target) return;

    requestAnimationFrame(() => {
        const width = Math.round(target.offsetWidth || target.getBoundingClientRect().width || 0);
        const offset = Math.round(target.offsetLeft || 0);
        indicator.style.width = `${width}px`;
        indicator.style.transform = `translate3d(${offset}px, 0, 0)`;
        indicator.style.opacity = width > 0 ? '1' : '0';
    });
}

window.syncChatSettingsNavIndicator = syncChatSettingsNavIndicator;

function bindChatSettingsHeaderInteractions() {
    const screen = document.getElementById('chat-settings-screen');
    const avatarGroup = screen ? screen.querySelector('.chat-settings-editorial-avatars') : null;
    const avatars = avatarGroup ? Array.from(avatarGroup.querySelectorAll('.chat-settings-editorial-avatar')) : [];
    const nav = screen ? screen.querySelector('.chat-settings-nav') : null;
    if (!screen) return;

    if (nav && !nav.dataset.indicatorBound) {
        nav.dataset.indicatorBound = '1';
        nav.addEventListener('scroll', () => syncChatSettingsNavIndicator());
    }

    if (!avatarGroup || avatarGroup.dataset.tapBound === '1') return;
    avatarGroup.dataset.tapBound = '1';

    const triggerTap = () => {
        avatarGroup.classList.remove('is-tapped');
        avatars.forEach(avatar => avatar.classList.remove('is-tapped'));
        void avatarGroup.offsetWidth;
        avatarGroup.classList.add('is-tapped');
        avatars.forEach(avatar => avatar.classList.add('is-tapped'));
        clearTimeout(window.__chatSettingsHeaderAvatarTapTimer);
        window.__chatSettingsHeaderAvatarTapTimer = setTimeout(() => {
            avatarGroup.classList.remove('is-tapped');
            avatars.forEach(avatar => avatar.classList.remove('is-tapped'));
        }, 320);
    };

    avatars.forEach(avatar => {
        avatar.style.cursor = 'pointer';
        avatar.addEventListener('click', triggerTap);
    });
}

window.bindChatSettingsHeaderInteractions = bindChatSettingsHeaderInteractions;

if (!window.__chatSettingsStickyChromeResizeBound) {
    window.__chatSettingsStickyChromeResizeBound = true;
    window.addEventListener('resize', () => {
        syncChatSettingsStickyChrome();
        syncChatSettingsNavIndicator();
    });
}

function openChatSettings() {
    const contact = getActiveAiProfileContact();
    if (!contact) return;
    mountChatSettingsEditorialNav();
    bindChatSettingsHeaderInteractions();
    ensureContactRestWindowFields(contact);
    setChatSettingsFloatingSaveVisible(true);
    setChatSettingsFloatingSaveState(false);

    document.getElementById('chat-setting-name').value = contact.name || '';
    document.getElementById('chat-setting-avatar-preview').src = contact.avatar || '';
    const aiBgContainer = document.getElementById('ai-setting-bg-container');
    if (aiBgContainer && contact.aiSettingBg) {
        aiBgContainer.style.backgroundImage = `url(${contact.aiSettingBg})`;
    } else if (aiBgContainer) {
        aiBgContainer.style.backgroundImage = '';
    }
    const aiBgInput = document.getElementById('chat-setting-ai-bg-input');
    if (aiBgInput) aiBgInput.value = '';

    document.getElementById('chat-setting-remark').value = contact.remark || '';
    document.getElementById('chat-setting-group-value').textContent = contact.group || '未分组';
    window.iphoneSimState.tempSelectedGroup = contact.group || '';

    document.getElementById('chat-setting-persona').value = contact.persona || '';
    initializeChatSettingsPromptUI();
    syncChatSettingsPromptPreviewByIds('chat-setting-persona-preview', 'chat-setting-persona');

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
            novelaiPresetSelect.value = contact.novelaiPreset;
        }
    }

    document.getElementById('chat-setting-context-limit').value = contact.contextLimit || '';
    document.getElementById('chat-setting-summary-limit').value = contact.summaryLimit || '';
    document.getElementById('chat-setting-show-thought').checked = contact.showThought || false;
    document.getElementById('chat-setting-thought-visible').checked = contact.thoughtVisible || false;
    document.getElementById('chat-setting-real-time-visible').checked = contact.realTimeVisible || false;
    document.getElementById('chat-setting-calendar-aware').checked = contact.calendarAwareEnabled !== false;

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
    window.iphoneSimState.tempSelectedChatBg = contact.chatBg || '';
    if (window.renderChatWallpaperGallery) window.renderChatWallpaperGallery();
    document.getElementById('chat-setting-custom-css').value = contact.customCss || '';

    // 消息间隔设置
    document.getElementById('chat-setting-interval-min').value = contact.replyIntervalMin || 400;
    document.getElementById('chat-setting-interval-max').value = contact.replyIntervalMax || 2200;

    // 主动发消息设置
    document.getElementById('chat-setting-active-reply').checked = contact.activeReplyEnabled || false;
    document.getElementById('chat-setting-active-interval').value = contact.activeReplyInterval || '';
    document.getElementById('chat-setting-rest-window-enabled').checked = !!contact.restWindowEnabled;
    document.getElementById('chat-setting-rest-window-start').value = contact.restWindowStart || '';
    document.getElementById('chat-setting-rest-window-end').value = contact.restWindowEnd || '';
    syncRestWindowSettingsVisibility();

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
    userPersonaSelect.innerHTML = '<option value="">Default Self / 默认身份</option>';
    window.iphoneSimState.userPersonas.forEach(p => {
        const option = document.createElement('option');
        option.value = p.id;
        option.textContent = p.name || '未命名身份';
        userPersonaSelect.appendChild(option);
    });
    
    const fallbackUserPersonaId = contact.userPersonaId || window.iphoneSimState.currentUserPersonaId || (window.iphoneSimState.userPersonas[0] ? window.iphoneSimState.userPersonas[0].id : '');
        if (fallbackUserPersonaId) {
            userPersonaSelect.value = fallbackUserPersonaId;
        }
    // 动态补一个用户人设编辑框（优先使用 HTML 中已存在的 showcase 容器）
    let userPromptTextarea = document.getElementById('chat-setting-user-prompt');
    if (!userPromptTextarea) {
        const selectContainer = userPersonaSelect.parentNode;
        const mainContainer = selectContainer ? selectContainer.parentNode : null;
        const promptField = document.querySelector('#chat-settings-screen .editorial-user-prompt-field');

        userPromptTextarea = document.createElement('textarea');
        userPromptTextarea.id = 'chat-setting-user-prompt';
        userPromptTextarea.className = 'mag-textarea';
        userPromptTextarea.rows = 3;
        userPromptTextarea.placeholder = '在此输入人设...';

        if (promptField) {
            promptField.appendChild(userPromptTextarea);
        } else if (mainContainer) {
            mainContainer.appendChild(userPromptTextarea);
        } else if (selectContainer) {
            selectContainer.appendChild(userPromptTextarea);
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
        syncChatSettingsPromptPreviewByIds('chat-setting-user-prompt-preview', 'chat-setting-user-prompt');
    };
    loadUserPrompt();

    // 监听身份切换
    userPersonaSelect.onchange = () => {
        const selectedId = userPersonaSelect.value;
        const p = window.iphoneSimState.userPersonas.find(p => p.id == selectedId);
        userPromptTextarea.value = p ? (p.aiPrompt || '') : '';
        syncChatSettingsPromptPreviewByIds('chat-setting-user-prompt-preview', 'chat-setting-user-prompt');
        scheduleChatSettingsTokenPreviewRefresh();
    };

    if (userPromptTextarea && !userPromptTextarea.dataset.tokenPreviewBound) {
        userPromptTextarea.dataset.tokenPreviewBound = '1';
        userPromptTextarea.addEventListener('input', () => {
            scheduleChatSettingsTokenPreviewRefresh();
        });
    }

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
    syncChatSettingsEditorialHeader(contact);
    syncChatSettingsStickyChrome();
    
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
                    syncChatSettingsEditorialHeader();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    initializeChatSettingsLinkedSelectors(contact);

    renderUserPerception(contact);
    if (window.renderChatCssPresets) window.renderChatCssPresets();

    normalizeChatSettingsListRows();
    ensureChatSettingsTokenPreviewBindings();
    const chatSettingsScreen = document.getElementById('chat-settings-screen');
    const chatSettingsBody = chatSettingsScreen ? chatSettingsScreen.querySelector('.chat-settings-editorial-body') : null;
    if (chatSettingsScreen) chatSettingsScreen.classList.remove('hidden');
    if (chatSettingsScreen) chatSettingsScreen.scrollTop = 0;
    if (chatSettingsBody) chatSettingsBody.scrollTop = 0;
    syncChatSettingsStickyChrome();
    syncChatSettingsNavIndicator();
    requestAnimationFrame(() => {
        renderChatSettingsMultiSelectTags('worldbooks');
        renderChatSettingsMultiSelectTags('stickers');
        syncChatSettingsStickyChrome();
        syncChatSettingsNavIndicator();
    });
    setTimeout(() => {
        renderChatSettingsMultiSelectTags('worldbooks');
        renderChatSettingsMultiSelectTags('stickers');
        syncChatSettingsStickyChrome();
        syncChatSettingsNavIndicator();
    }, 120);
    if (contact.id) {
        refreshTokenCountForContact(contact.id);
    }
}

function renderUserPerception(contact) {
    const list = document.getElementById('user-perception-list');
    const displayArea = document.getElementById('user-perception-display');
    const editArea = document.getElementById('user-perception-edit');
    const editBtn = document.getElementById('edit-user-perception-btn');
    const saveBtn = document.getElementById('save-user-perception-btn');
    const cancelBtn = document.getElementById('cancel-user-perception-btn');
    const input = document.getElementById('user-perception-input');

    // 性别设置
    const genderDisplay = document.getElementById('user-gender-display');
    if (genderDisplay) {
        const currentGender = window.iphoneSimState.userProfile?.gender || 'female';
        const genderText = currentGender === 'male' ? 'Male / 男' : 'Female / 女';
        genderDisplay.textContent = genderText;
        
        genderDisplay.onclick = () => {
            const newGender = currentGender === 'male' ? 'female' : 'male';
            if (!window.iphoneSimState.userProfile) {
                window.iphoneSimState.userProfile = {};
            }
            window.iphoneSimState.userProfile.gender = newGender;
            saveConfig();
            renderUserPerception(contact);
        };
    }

    if (!list) return;

    if (!contact.userPerception) {
        contact.userPerception = [];
    }

    list.innerHTML = '';
    if (contact.userPerception.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'mag-quote-item mag-perception-empty';
        emptyItem.textContent = '暂无认知信息';
        list.appendChild(emptyItem);
    } else {
        contact.userPerception.forEach(item => {
            const div = document.createElement('div');
            div.className = 'mag-quote-item';
            div.textContent = item;
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

function collectRemoteMessageIdsFromHistory(history) {
    if (!Array.isArray(history)) return [];
    return history
        .filter(message => message && (message.pushedByBackend || message.source === 'offline-backend' || message.remoteId))
        .map(message => String(message.remoteId || message.id || '').trim())
        .filter(Boolean);
}

async function handleClearChatHistory() {
    if (!window.iphoneSimState.currentChatContactId) return;
    
    if (confirm('确定要清空与该联系人的所有聊天记录吗？此操作不可恢复。')) {
        const contactId = window.iphoneSimState.currentChatContactId;
        const history = Array.isArray(window.iphoneSimState.chatHistory[contactId])
            ? window.iphoneSimState.chatHistory[contactId]
            : [];
        const remoteMessageIds = collectRemoteMessageIdsFromHistory(history);
        window.iphoneSimState.chatHistory[contactId] = [];
        
        // 重置总结和行程生成索引，确保清空后能重新触发
        const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
        if (contact) {
            contact.lastSummaryIndex = 0;
            contact.lastItineraryIndex = 0;
            contact.messagesSinceLastItinerary = 0;
        }
        
        saveConfig();
        if (window.renderContactList) window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
        renderChatHistory(contactId);
        if (remoteMessageIds.length > 0 && window.offlinePushSync && typeof window.offlinePushSync.deleteMessages === 'function') {
            try {
                await window.offlinePushSync.deleteMessages(remoteMessageIds);
            } catch (err) {
                console.error('[offline-push-sync] clear chat remote delete failed', err);
            }
        }
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


function mountChatSettingsFloatingSaveButton() {
    const button = document.getElementById('chat-settings-editorial-save');
    if (!button) return null;
    if (button.parentElement !== document.body) {
        document.body.appendChild(button);
    }
    return button;
}

function setChatSettingsFloatingSaveVisible(visible) {
    const button = mountChatSettingsFloatingSaveButton();
    if (!button) return;
    button.classList.toggle('hidden', !visible);
}

window.setChatSettingsFloatingSaveVisible = setChatSettingsFloatingSaveVisible;

function setChatSettingsFloatingSaveState(saved) {
    const button = mountChatSettingsFloatingSaveButton();
    if (!button) return;
    button.classList.toggle('is-saved', !!saved);
    button.innerHTML = saved ? '<i class="ri-check-line"></i>' : '<i class="ri-save-line"></i>';
    button.setAttribute('aria-label', saved ? 'Saved chat settings' : 'Save chat settings');
    button.setAttribute('title', saved ? 'Saved' : 'Save');
}

function handleChatSettingsFloatingSave() {
    const legacySaveButton = document.getElementById('save-chat-settings-btn');
    if (!legacySaveButton) return;
    setChatSettingsFloatingSaveState(true);
    legacySaveButton.click();
}

function handleSaveChatSettings() {
    if (!window.iphoneSimState.currentChatContactId) return;
    const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
    if (!contact) return;
    ensureContactRestWindowFields(contact);
    const previousRestWindowSnapshot = `${contact.restWindowEnabled ? '1' : '0'}|${contact.restWindowStart || ''}|${contact.restWindowEnd || ''}`;

    const name = document.getElementById('chat-setting-name').value;
    const remark = document.getElementById('chat-setting-remark').value;
    const persona = document.getElementById('chat-setting-persona').value;
    const contextLimit = document.getElementById('chat-setting-context-limit').value;
    const summaryLimit = document.getElementById('chat-setting-summary-limit').value;
    const showThought = document.getElementById('chat-setting-show-thought').checked;
    const thoughtVisible = document.getElementById('chat-setting-thought-visible').checked;
    const realTimeVisible = document.getElementById('chat-setting-real-time-visible').checked;
    const calendarAwareEnabled = document.getElementById('chat-setting-calendar-aware').checked;
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
    const restWindowEnabled = document.getElementById('chat-setting-rest-window-enabled').checked;
    const restWindowStart = document.getElementById('chat-setting-rest-window-start').value;
    const restWindowEnd = document.getElementById('chat-setting-rest-window-end').value;
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
    {
        const nextLocation = getLocationFromSelectors();
        const prevQuery = contact.location && contact.location.query ? String(contact.location.query) : '';
        const nextQuery = nextLocation && nextLocation.query ? String(nextLocation.query) : '';
        contact.location = nextLocation;
        if (prevQuery !== nextQuery) {
            contact.locationResolved = null;
            if (window.iphoneSimState && window.iphoneSimState.amapRuntime && window.iphoneSimState.amapRuntime.lastResolvedContacts) {
                delete window.iphoneSimState.amapRuntime.lastResolvedContacts[contact.id];
            }
            if (window.iphoneSimState && window.iphoneSimState.amapRuntime && window.iphoneSimState.amapRuntime.lastWeather) {
                delete window.iphoneSimState.amapRuntime.lastWeather[contact.id];
            }
            if (window.iphoneSimState && window.iphoneSimState.amapRuntime && window.iphoneSimState.amapRuntime.lastRoutes) {
                delete window.iphoneSimState.amapRuntime.lastRoutes[contact.id];
            }
        }
    }
    contact.contextLimit = contextLimit ? parseInt(contextLimit) : 0;
    contact.summaryLimit = summaryLimit ? parseInt(summaryLimit) : 0;
    contact.showThought = showThought;
    contact.thoughtVisible = thoughtVisible;
    contact.realTimeVisible = realTimeVisible;
    contact.calendarAwareEnabled = calendarAwareEnabled;
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
    contact.restWindowEnabled = !!(restWindowEnabled && parseContactRestWindowTime(restWindowStart) !== null && parseContactRestWindowTime(restWindowEnd) !== null && restWindowStart !== restWindowEnd);
    contact.restWindowStart = contact.restWindowEnabled ? restWindowStart : '';
    contact.restWindowEnd = contact.restWindowEnabled ? restWindowEnd : '';
    const nextRestWindowSnapshot = `${contact.restWindowEnabled ? '1' : '0'}|${contact.restWindowStart || ''}|${contact.restWindowEnd || ''}`;
    if (!contact.restWindowEnabled || previousRestWindowSnapshot !== nextRestWindowSnapshot) {
        contact.restWindowAwakenedAt = null;
    }
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

    if (aiBgInput && aiBgInput.files && aiBgInput.files[0]) {
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

    if (typeof window.persistFireBuddySettings === 'function') {
        promises.push(
            Promise.resolve()
                .then(() => window.persistFireBuddySettings())
                .catch(err => {
                    console.error('保存小火人设置失败', err);
                })
        );
    }

    Promise.all(promises).then(() => {
        saveConfig();
        setChatSettingsFloatingSaveState(true);
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
        setChatSettingsFloatingSaveVisible(false);
    });
}

const CHAT_SETTINGS_TOKEN_REFRESH_DEBOUNCE_MS = 180;
const CHAT_SETTINGS_MEMORY_TOKEN_WARNING_THRESHOLD = 2500;
let chatSettingsTokenRefreshTimer = null;
let chatSettingsTokenRefreshVersion = 0;

function getChatSettingsCheckedIds(selector) {
    return Array.from(document.querySelectorAll(selector))
        .filter(input => input && input.checked)
        .map(input => parseInt(input.dataset.id, 10))
        .filter(Number.isFinite);
}

function getChatSettingsNumberValue(id, fallback = 0) {
    const input = document.getElementById(id);
    if (!input) return fallback;
    const rawValue = String(input.value || '').trim();
    if (!rawValue) return fallback;
    const parsedValue = parseInt(rawValue, 10);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
}

function buildChatSettingsDraftContact(contact) {
    if (!contact) return null;

    const nameInput = document.getElementById('chat-setting-name');
    const personaInput = document.getElementById('chat-setting-persona');
    const userPersonaInput = document.getElementById('chat-setting-user-persona');
    const userPromptInput = document.getElementById('chat-setting-user-prompt');
    const showThoughtInput = document.getElementById('chat-setting-show-thought');
    const thoughtVisibleInput = document.getElementById('chat-setting-thought-visible');
    const realTimeVisibleInput = document.getElementById('chat-setting-real-time-visible');
    const calendarAwareInput = document.getElementById('chat-setting-calendar-aware');
    const userPersonaId = userPersonaInput ? parseInt(userPersonaInput.value, 10) : NaN;

    return {
        name: nameInput ? (nameInput.value.trim() || contact.name || '') : (contact.name || ''),
        persona: personaInput ? personaInput.value : (contact.persona || ''),
        contextLimit: getChatSettingsNumberValue('chat-setting-context-limit', 0),
        showThought: showThoughtInput ? !!showThoughtInput.checked : !!contact.showThought,
        thoughtVisible: thoughtVisibleInput ? !!thoughtVisibleInput.checked : !!contact.thoughtVisible,
        realTimeVisible: realTimeVisibleInput ? !!realTimeVisibleInput.checked : !!contact.realTimeVisible,
        calendarAwareEnabled: calendarAwareInput ? !!calendarAwareInput.checked : contact.calendarAwareEnabled !== false,
        userPersonaId: Number.isFinite(userPersonaId) ? userPersonaId : null,
        userPersonaPromptOverride: userPromptInput ? userPromptInput.value : (contact.userPersonaPromptOverride || ''),
        linkedWbCategories: getChatSettingsCheckedIds('.wb-category-checkbox'),
        linkedStickerCategories: getChatSettingsCheckedIds('.sticker-category-checkbox')
    };
}

function renderChatTokenPreviewState(state = {}) {
    const previewEl = document.getElementById('chat-setting-token-preview');
    const countEl = document.getElementById('chat-setting-token-count');
    const visualStateEl = document.getElementById('chat-setting-token-visual-state');
    const systemBaseEl = document.getElementById('chat-setting-token-system-base');
    const memoryEl = document.getElementById('chat-setting-token-memory');
    const worldbookEl = document.getElementById('chat-setting-token-worldbook');
    const contextEl = document.getElementById('chat-setting-token-context');
    const extraEl = document.getElementById('chat-setting-token-extra');
    const visualEl = document.getElementById('chat-setting-token-visual');
    const metaEl = document.getElementById('chat-setting-token-meta');
    if (!previewEl || !countEl || !systemBaseEl || !memoryEl || !worldbookEl || !contextEl || !extraEl || !visualEl || !metaEl) return;

    previewEl.classList.toggle('is-loading', !!state.loading);
    previewEl.classList.toggle('has-error', !!state.error);

    if (state.loading) {
        countEl.textContent = '--';
        systemBaseEl.textContent = '--';
        memoryEl.textContent = '--';
        worldbookEl.textContent = '--';
        contextEl.textContent = '--';
        extraEl.textContent = '--';
        if (visualStateEl) visualStateEl.textContent = '--';
        visualEl.textContent = '当前检测中...';
        metaEl.textContent = '按当前未保存设置实时估算';
        return;
    }

    if (state.error) {
        countEl.textContent = '--';
        systemBaseEl.textContent = '--';
        memoryEl.textContent = '--';
        worldbookEl.textContent = '--';
        contextEl.textContent = '--';
        extraEl.textContent = '--';
        if (visualStateEl) visualStateEl.textContent = '--';
        visualEl.textContent = '无法估算';
        metaEl.textContent = state.detail || '按当前未保存设置实时估算';
        return;
    }

    const preview = state.preview || {};
    const sections = preview.sections || {};
    const systemBaseTokens = Number(sections.systemBase && sections.systemBase.tokens ? sections.systemBase.tokens : 0);
    const memoryTokens = Number(sections.memory && sections.memory.tokens ? sections.memory.tokens : 0);
    const worldbookTokens = Number(sections.worldbook && sections.worldbook.tokens ? sections.worldbook.tokens : 0);
    const contextTokens = Number(sections.context && sections.context.tokens ? sections.context.tokens : 0);
    const extraTokens = Number(sections.extra && sections.extra.tokens ? sections.extra.tokens : 0);
    const totalTextTokens = Number(preview.totalTextTokens || 0);
    const visualInputs = preview.visualInputs || {};
    const visualParts = [];
    const metaParts = [`共 ${(preview.messageCount || 0).toLocaleString()} 条请求消息`, '按当前未保存设置实时估算'];

    if (visualInputs.imageCount > 0) {
        visualParts.push(`${visualInputs.imageCount} 张图片`);
    }
    if (visualInputs.screenShareCount > 0) {
        visualParts.push(`${visualInputs.screenShareCount} 次共享屏幕`);
    }

    countEl.textContent = totalTextTokens.toLocaleString();
    systemBaseEl.textContent = systemBaseTokens.toLocaleString();
    memoryEl.textContent = memoryTokens.toLocaleString();
    worldbookEl.textContent = worldbookTokens.toLocaleString();
    contextEl.textContent = contextTokens.toLocaleString();
    extraEl.textContent = extraTokens.toLocaleString();
    if (memoryTokens >= CHAT_SETTINGS_MEMORY_TOKEN_WARNING_THRESHOLD) {
        metaParts.push('记忆注入较长，可能显著增加本轮提示词长度');
    }
    if (visualStateEl) {
        visualStateEl.textContent = visualParts.length > 0 ? 'ON' : 'OFF';
    }
    visualEl.textContent = visualParts.length > 0
        ? `当前检测到 ${visualParts.join(' / ')}（未计入上方总数）`
        : '未检测到视觉输入（未计入上方总数）';
    metaEl.textContent = metaParts.join('，');
}

function scheduleChatSettingsTokenPreviewRefresh() {
    const contactId = window.iphoneSimState.currentChatContactId;
    if (!contactId) return;

    clearTimeout(chatSettingsTokenRefreshTimer);
    chatSettingsTokenRefreshTimer = setTimeout(() => {
        refreshTokenCountForContact(contactId);
    }, CHAT_SETTINGS_TOKEN_REFRESH_DEBOUNCE_MS);
}

function ensureChatSettingsTokenPreviewBindings() {
    if (window.__chatSettingsTokenPreviewBindingsBound) return;
    window.__chatSettingsTokenPreviewBindingsBound = true;

    const bindRefresh = (id, events) => {
        const element = document.getElementById(id);
        if (!element) return;
        events.forEach(eventName => {
            element.addEventListener(eventName, () => {
                scheduleChatSettingsTokenPreviewRefresh();
            });
        });
    };

    bindRefresh('chat-setting-name', ['input']);
    bindRefresh('chat-setting-persona', ['input']);
    bindRefresh('chat-setting-context-limit', ['input', 'change']);
    bindRefresh('chat-setting-show-thought', ['change']);
    bindRefresh('chat-setting-thought-visible', ['change']);
    bindRefresh('chat-setting-real-time-visible', ['change']);
    bindRefresh('chat-setting-calendar-aware', ['change']);
    bindRefresh('chat-setting-user-persona', ['change']);

    const wbList = document.getElementById('chat-setting-wb-list');
    if (wbList) {
        wbList.addEventListener('change', event => {
            if (event.target && event.target.classList.contains('wb-category-checkbox')) {
                scheduleChatSettingsTokenPreviewRefresh();
            }
        });
    }

    const stickerList = document.getElementById('chat-setting-sticker-list');
    if (stickerList) {
        stickerList.addEventListener('change', event => {
            if (event.target && event.target.classList.contains('sticker-category-checkbox')) {
                scheduleChatSettingsTokenPreviewRefresh();
            }
        });
    }
}

// 计算提示词Token并更新UI（可供设置页调用）
async function refreshTokenCountForContact(contactId) {
    const displayEl = document.getElementById('chat-setting-token-count');
    if (!displayEl) return;

    renderChatTokenPreviewState({ loading: true, message: '计算中...' });

    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) {
        renderChatTokenPreviewState({
            error: true,
            message: '暂无可用数据',
            detail: '当前联系人不存在或已被删除'
        });
        return;
    }

    const requestVersion = ++chatSettingsTokenRefreshVersion;

    try {
        if (typeof window.buildAiPromptTokenPreview !== 'function') {
            throw new Error('token preview helper unavailable');
        }

        const draftContact = buildChatSettingsDraftContact(contact);
        const preview = await window.buildAiPromptTokenPreview(contactId, {
            contactOverride: draftContact
        });

        if (requestVersion !== chatSettingsTokenRefreshVersion) {
            return;
        }

        if (!preview || preview.status === 'error') {
            renderChatTokenPreviewState({
                error: true,
                message: '本轮输入文本估算失败',
                detail: preview && preview.error ? preview.error : '请稍后重试'
            });
            return;
        }

        renderChatTokenPreviewState({ preview });
    } catch (err) {
        if (requestVersion !== chatSettingsTokenRefreshVersion) {
            return;
        }
        console.error('refreshTokenCountForContact error', err);
        renderChatTokenPreviewState({
            error: true,
            message: '本轮输入文本估算失败',
            detail: err && err.message ? err.message : '请稍后重试'
        });
    }
}

// --- 聊天界面功能 ---











