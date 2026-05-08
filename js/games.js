// 小游戏功能模块

window.currentMiniGame = null;
let minesweeperState = {
    grid: [],
    rows: 9,
    cols: 9,
    mines: 10,
    flags: 0,
    gameOver: false,
    startTime: null,
    timerInterval: null,
    level: 'easy'
};

const UNDERCOVER_WORD_PAIRS = [
    { civilian: '咖啡', undercover: '奶茶' },
    { civilian: '地铁', undercover: '公交' },
    { civilian: '手机', undercover: '平板' },
    { civilian: '海边', undercover: '沙漠' },
    { civilian: '钢琴', undercover: '吉他' },
    { civilian: '篮球', undercover: '足球' },
    { civilian: '苹果', undercover: '梨子' },
    { civilian: '火锅', undercover: '烧烤' },
    { civilian: '雨伞', undercover: '雨衣' },
    { civilian: '猫咪', undercover: '狗狗' },
    { civilian: '电影', undercover: '电视剧' },
    { civilian: '冬天', undercover: '夏天' },
    { civilian: '可乐', undercover: '雪碧' },
    { civilian: '汉堡', undercover: '三明治' },
    { civilian: '米饭', undercover: '面条' },
    { civilian: '寿司', undercover: '刺身' },
    { civilian: '牛奶', undercover: '酸奶' },
    { civilian: '橙子', undercover: '柚子' },
    { civilian: '芒果', undercover: '木瓜' },
    { civilian: '葡萄', undercover: '蓝莓' },
    { civilian: '樱桃', undercover: '草莓' },
    { civilian: '西瓜', undercover: '哈密瓜' },
    { civilian: '电风扇', undercover: '空调' },
    { civilian: '洗衣机', undercover: '烘干机' },
    { civilian: '冰箱', undercover: '冷柜' },
    { civilian: '电磁炉', undercover: '燃气灶' },
    { civilian: '电动车', undercover: '摩托车' },
    { civilian: '高铁', undercover: '动车' },
    { civilian: '出租车', undercover: '网约车' },
    { civilian: '轮船', undercover: '游艇' },
    { civilian: '自行车', undercover: '滑板车' },
    { civilian: '飞机', undercover: '直升机' },
    { civilian: '口红', undercover: '唇釉' },
    { civilian: '粉底液', undercover: '气垫' },
    { civilian: '香水', undercover: '身体喷雾' },
    { civilian: '洗面奶', undercover: '洁面泡沫' },
    { civilian: '洗发水', undercover: '护发素' },
    { civilian: '耳机', undercover: '音箱' },
    { civilian: '鼠标', undercover: '触控板' },
    { civilian: '键盘', undercover: '手写板' },
    { civilian: '相机', undercover: '摄像机' },
    { civilian: '微信', undercover: 'QQ' },
    { civilian: '微博', undercover: '小红书' },
    { civilian: '抖音', undercover: '快手' },
    { civilian: 'B站', undercover: 'YouTube' },
    { civilian: '小说', undercover: '散文' },
    { civilian: '诗歌', undercover: '歌词' },
    { civilian: '数学', undercover: '物理' },
    { civilian: '历史', undercover: '地理' },
    { civilian: '英语', undercover: '日语' },
    { civilian: '小学', undercover: '中学' },
    { civilian: '医生', undercover: '护士' },
    { civilian: '律师', undercover: '法官' },
    { civilian: '警察', undercover: '保安' },
    { civilian: '程序员', undercover: '测试工程师' },
    { civilian: '设计师', undercover: '插画师' },
    { civilian: '导演', undercover: '编剧' },
    { civilian: '歌手', undercover: '演员' },
    { civilian: '记者', undercover: '编辑' },
    { civilian: '羽毛球', undercover: '网球' },
    { civilian: '乒乓球', undercover: '台球' },
    { civilian: '排球', undercover: '手球' },
    { civilian: '游泳', undercover: '潜水' },
    { civilian: '跑步', undercover: '竞走' },
    { civilian: '瑜伽', undercover: '普拉提' },
    { civilian: '山地车', undercover: '公路车' },
    { civilian: '雪糕', undercover: '冰淇淋' },
    { civilian: '蛋糕', undercover: '面包' },
    { civilian: '饺子', undercover: '包子' },
    { civilian: '馄饨', undercover: '面片汤' },
    { civilian: '豆浆', undercover: '豆奶' },
    { civilian: '绿茶', undercover: '红茶' },
    { civilian: '乌龙茶', undercover: '普洱茶' },
    { civilian: '拿铁', undercover: '卡布奇诺' },
    { civilian: '柠檬水', undercover: '苏打水' },
    { civilian: '图书馆', undercover: '书店' },
    { civilian: '电影院', undercover: '剧院' },
    { civilian: '博物馆', undercover: '美术馆' },
    { civilian: '公园', undercover: '植物园' },
    { civilian: '商场', undercover: '超市' },
    { civilian: '医院', undercover: '诊所' },
    { civilian: '宿舍', undercover: '公寓' },
    { civilian: '办公室', undercover: '会议室' },
    { civilian: '地毯', undercover: '地板' },
    { civilian: '窗帘', undercover: '百叶窗' },
    { civilian: '牙刷', undercover: '电动牙刷' },
    { civilian: '毛巾', undercover: '浴巾' },
    { civilian: '拖鞋', undercover: '凉鞋' },
    { civilian: '衬衫', undercover: 'T恤' },
    { civilian: '牛仔裤', undercover: '休闲裤' },
    { civilian: '卫衣', undercover: '毛衣' },
    { civilian: '羽绒服', undercover: '风衣' },
    { civilian: '太阳镜', undercover: '近视镜' },
    { civilian: '手表', undercover: '手环' },
    { civilian: '项链', undercover: '手链' },
    { civilian: '戒指', undercover: '耳环' },
    { civilian: '早饭', undercover: '夜宵' },
    { civilian: '午饭', undercover: '晚饭' },
    { civilian: '闹钟', undercover: '计时器' },
    { civilian: '日历', undercover: '备忘录' },
    { civilian: '地图', undercover: '指南针' },
    { civilian: '木门', undercover: '玻璃门' },
    { civilian: '沙发', undercover: '躺椅' },
    { civilian: '台灯', undercover: '落地灯' },
    { civilian: '铅笔', undercover: '签字笔' },
    { civilian: '橡皮', undercover: '修正带' },
    { civilian: '水彩', undercover: '丙烯' },
    { civilian: '手电筒', undercover: '应急灯' },
    { civilian: '键帽', undercover: '轴体' },
    { civilian: '路由器', undercover: '光猫' },
    { civilian: '云盘', undercover: '硬盘' },
    { civilian: '短信', undercover: '邮件' },
    { civilian: '直播', undercover: '录播' },
    { civilian: '外卖', undercover: '堂食' },
    { civilian: '地瓜', undercover: '土豆' },
    { civilian: '酸辣粉', undercover: '米线' },
    { civilian: '麻辣烫', undercover: '冒菜' },
    { civilian: '春卷', undercover: '煎饺' },
    { civilian: '烤鸭', undercover: '烧鸡' },
    { civilian: '椰子', undercover: '榴莲' },
    { civilian: '桃子', undercover: '李子' },
    { civilian: '杏子', undercover: '枇杷' },
    { civilian: '雪山', undercover: '冰川' },
    { civilian: '湖泊', undercover: '河流' },
    { civilian: '社牛', undercover: '社恐' },
    { civilian: '显眼包', undercover: '气氛组' },
    { civilian: 'i人', undercover: 'e人' },
    { civilian: '摆烂', undercover: '卷王' },
    { civilian: '躺平', undercover: '奋斗' },
    { civilian: '上头', undercover: '下头' },
    { civilian: '整活', undercover: '翻车' },
    { civilian: '破防', undercover: '无语' },
    { civilian: '抽象', undercover: '离谱' },
    { civilian: '发疯文学', undercover: '鸡汤文学' },
    { civilian: '土味情话', undercover: '冷笑话' },
    { civilian: '嘴替', undercover: '捧哏' },
    { civilian: '显微镜网友', undercover: '吃瓜群众' },
    { civilian: '嗑CP', undercover: '磕学家' },
    { civilian: '乐子人', undercover: '围观党' },
    { civilian: '打工人', undercover: '牛马' },
    { civilian: '摸鱼', undercover: '加班' },
    { civilian: '早八', undercover: '晚自习' },
    { civilian: 'ddl', undercover: 'kpi' },
    { civilian: '显眼包穿搭', undercover: '基础款穿搭' },
    { civilian: '精神状态美丽', undercover: '精神内耗' },
    { civilian: '电子榨菜', undercover: '下饭视频' },
    { civilian: '互联网嘴替', undercover: '互联网判官' },
    { civilian: '村口情报局', undercover: '热搜榜' },
    { civilian: '冲浪', undercover: '潜水' },
    { civilian: '互关', undercover: '取关' },
    { civilian: '双击666', undercover: '一键三连' },
    { civilian: '催更', undercover: '断更' },
    { civilian: '发刀子', undercover: '发糖' },
    { civilian: 'BE', undercover: 'HE' },
    { civilian: '白月光', undercover: '朱砂痣' },
    { civilian: '逆天', undercover: '神仙' },
    { civilian: '高能预警', undercover: '名场面' },
    { civilian: '整顿职场', undercover: '整顿饭圈' },
    { civilian: '开摆', undercover: '开卷' },
    { civilian: '人设崩塌', undercover: '人设拉满' },
    { civilian: '鸽子精', undercover: '秒回怪' },
    { civilian: '嘴硬', undercover: '真香' },
    { civilian: '互联网嘴强王者', undercover: '线下社恐' },
    { civilian: '恋爱脑', undercover: '事业脑' },
    { civilian: '氛围感', undercover: '松弛感' },
    { civilian: '多巴胺穿搭', undercover: '美拉德穿搭' },
    { civilian: '清汤大老爷', undercover: '麻辣狠人' },
    { civilian: '脆皮大学生', undercover: '特种兵旅游' },
    { civilian: '赛博烧香', undercover: '电子木鱼' },
    { civilian: '锦鲤体质', undercover: '水逆体质' },
    { civilian: '朋友圈仅三天', undercover: '朋友圈全公开' },
    { civilian: '已读不回', undercover: '秒回' },
    { civilian: '哈哈哈', undercover: 'hhhhh' },
    { civilian: 'emoji大户', undercover: '句号战神' },
    { civilian: '大冤种', undercover: '大聪明' },
    { civilian: '笋都夺完了', undercover: '我真的会谢' },
    { civilian: '拿捏', undercover: '被拿捏' },
    { civilian: '你好香', undercover: '你真下头' },
    { civilian: '阴阳怪气', undercover: '直球发言' },
    { civilian: '反向凡尔赛', undercover: '真凡尔赛' },
    { civilian: '小作文', undercover: '长图文' },
    { civilian: '评论区盖楼', undercover: '弹幕刷屏' },
    { civilian: '网抑云', undercover: '土嗨歌单' },
    { civilian: '电子宠物', undercover: '电子木鱼' }
];

const UNDERCOVER_PHASE = {
    idle: 'idle',
    clue: 'clue',
    vote: 'vote',
    finished: 'finished'
};

const UNDERCOVER_ACTION_COMMANDS = new Set([
    'START_UNDERCOVER_GAME',
    'UNDERCOVER_SWITCH_PHASE',
    'UNDERCOVER_VOTE',
    'UNDERCOVER_SETTLE',
    'UNDERCOVER_NEXT_ROUND',
    'UNDERCOVER_END'
]);

const TURTLE_SOUP_PHASE = {
    idle: 'idle',
    questioning: 'questioning',
    revealed: 'revealed'
};

const TURTLE_SOUP_ACTION_COMMANDS = new Set([
    'START_TURTLE_SOUP_GAME',
    'TURTLE_SOUP_REPLY',
    'TURTLE_SOUP_REVEAL',
    'TURTLE_SOUP_NEXT_ROUND',
    'TURTLE_SOUP_END'
]);

const TURTLE_SOUP_CASES = [
    {
        title: '停电的房间',
        question: '男人回家发现屋里一片漆黑，打开灯后却立刻报警。为什么？',
        answer: '屋里本应有人在睡觉，灯被人提前关掉且物品被翻动，男人意识到入室盗窃刚发生。',
        hints: ['重点看“为什么一开灯就报警”', '不是灵异', '与“有人来过”有关']
    },
    {
        title: '最后一班车',
        question: '女生每天都坐同一班末班车，今天却宁愿走回家。为什么？',
        answer: '她在站台看到司机不是平时那位，且车牌也不对，怀疑是假冒车辆。',
        hints: ['和安全感有关', '不是因为没钱', '她观察到了异常细节']
    },
    {
        title: '雨天的伞',
        question: '男人冒雨跑了很远却始终没打伞，到了目的地反而笑了。为什么？',
        answer: '他赶去参加“淋雨挑战”直播，故意不打伞才能完成任务。',
        hints: ['主动淋雨', '与工作/任务有关', '不是忘带伞']
    },
    {
        title: '空白消息',
        question: '她收到一条空白消息后立刻请假回家，结果救了家人。为什么？',
        answer: '家人约定遇险发空白消息求救，她识别暗号后及时回家处理煤气泄漏。',
        hints: ['空白消息本身就是信息', '提前有约定', '与紧急情况有关']
    },
    {
        title: '深夜敲门',
        question: '半夜有人敲门，男人开门后说“谢谢”，然后关门睡觉。为什么？',
        answer: '外卖小哥送错门但顺手提醒他钥匙还插在门外，男人因此道谢。',
        hints: ['敲门的人并非坏人', '男人得到了帮助', '和门有关']
    },
    {
        title: '电梯停在一楼',
        question: '女人每天下班都坐电梯上楼，今天电梯正好在一楼她却改走楼梯。为什么？',
        answer: '她闻到电梯里有强烈焦糊味，担心故障，选择楼梯更安全。',
        hints: ['并非健身', '与“安全”有关', '电梯本身有异常']
    },
    {
        title: '关机的手机',
        question: '男人发现手机自动关机后反而松了口气。为什么？',
        answer: '他把手机放在被盗车里做定位诱饵，关机说明小偷拆卡丢机，警方已在埋伏点附近。',
        hints: ['不是电量问题', '与抓人有关', '手机是诱饵']
    },
    {
        title: '错过的婚礼',
        question: '她故意迟到错过朋友婚礼开场，却被全场夸“来得正好”。为什么？',
        answer: '她是专业化妆师，临时去给新娘补妆，卡点赶到完成救场。',
        hints: ['不是社交迟到', '她有特殊技能', '和婚礼流程有关']
    },
    {
        title: '不喝水的人',
        question: '男人在沙漠里有水却不喝，几小时后还活着。为什么？',
        answer: '他在等待救援直升机，需保留水用于给设备降温避免失联，而非立刻饮用。',
        hints: ['不是不渴', '水另有用途', '与求生策略有关']
    },
    {
        title: '删除的照片',
        question: '女生删掉旅行照片后，朋友反而说“你做对了”。为什么？',
        answer: '照片里拍到了护照和酒店房号等敏感信息，发布会有安全风险。',
        hints: ['不是拍得丑', '与隐私安全有关', '重点是照片内容']
    },
    {
        title: '迟到的打卡',
        question: '他明明按时到公司，却故意晚一分钟打卡。为什么？',
        answer: '系统故障导致早一分钟会记成“昨日补卡”，晚一分钟才能正确计入当天出勤。',
        hints: ['不是摸鱼', '与系统规则有关', '一分钟很关键']
    },
    {
        title: '空着的座位',
        question: '餐厅里空座很多，情侣却坚持站着等同一桌。为什么？',
        answer: '那桌正对直播镜头且采光最好，他们是来拍探店视频的。',
        hints: ['不是迷信座位', '与拍摄有关', '环境条件重要']
    },
    {
        title: '被拒绝的红包',
        question: '群里有人发红包，女生抢到后立刻退回，大家都夸她机智。为什么？',
        answer: '红包备注含钓鱼链接口令，疑似诈骗测试，她退回并提醒全群。',
        hints: ['不是客气', '和风险识别有关', '红包有异常']
    },
    {
        title: '停下的音乐',
        question: '司机在高速上突然关掉音乐，全车人都安静下来，结果避免了事故。为什么？',
        answer: '他听到轮胎异响，关音乐让大家一起判断声音来源并及时靠边。',
        hints: ['不是心情变化', '听觉信息很关键', '与车辆故障有关']
    },
    {
        title: '反复确认门牌',
        question: '快递员到门口后反复确认门牌才敢敲门，最终被客户感谢。为什么？',
        answer: '客户备注“家有婴儿勿按门铃”，快递员确认无误后改为轻敲门避免吵醒孩子。',
        hints: ['与服务细节有关', '不是迷路', '敲门方式是关键']
    }
];

const undercoverStateByGroup = {};
const turtleSoupStateByGroup = {};

// --- 初始化与事件监听 ---

function initGames() {
    const gamesBtn = document.getElementById('chat-more-games-btn');
    if (gamesBtn) {
        gamesBtn.addEventListener('click', () => {
            document.getElementById('chat-more-panel').classList.add('hidden');
            openGameSelection();
        });
    }

    const closeSelectionBtn = document.getElementById('close-game-selection');
    if (closeSelectionBtn) {
        closeSelectionBtn.addEventListener('click', () => {
            document.getElementById('game-selection-modal').classList.add('hidden');
        });
    }

    const closeMinesweeperBtn = document.getElementById('close-minesweeper');
    if (closeMinesweeperBtn) {
        closeMinesweeperBtn.addEventListener('click', closeMinesweeper);
    }

    const minimizeMinesweeperBtn = document.getElementById('minimize-minesweeper');
    if (minimizeMinesweeperBtn) {
        minimizeMinesweeperBtn.addEventListener('click', minimizeMinesweeper);
    }

    const minesweeperMinimized = document.getElementById('minesweeper-minimized');
    if (minesweeperMinimized) {
        minesweeperMinimized.addEventListener('click', (e) => {
            // Check if it was a drag or a click
            if (minesweeperMinimized.dataset.isDragging === 'true') {
                return;
            }
            restoreMinesweeper();
        });
        makeDraggable(minesweeperMinimized, minesweeperMinimized);
    }

    const msFaceBtn = document.getElementById('ms-face-btn');
    if (msFaceBtn) {
        msFaceBtn.addEventListener('click', () => startMinesweeper(minesweeperState.level));
    }

    const levelBtns = document.querySelectorAll('.ms-level-btn');
    levelBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            levelBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            startMinesweeper(e.target.dataset.level);
        });
    });

    const msWindow = document.getElementById('minesweeper-window');
    const msHeader = document.getElementById('minesweeper-header');
    if (msWindow && msHeader) {
        makeDraggable(msWindow, msHeader);
    }

    // Minesweeper Mode Selection Listeners
    const msModeSoloBtn = document.getElementById('ms-mode-solo');
    if (msModeSoloBtn) {
        msModeSoloBtn.addEventListener('click', () => {
            document.getElementById('minesweeper-mode-modal').classList.add('hidden');
            startMinesweeper();
        });
    }

    const msModeCoopBtn = document.getElementById('ms-mode-coop');
    if (msModeCoopBtn) {
        msModeCoopBtn.addEventListener('click', () => {
            document.getElementById('minesweeper-mode-modal').classList.add('hidden');
            handleMinesweeperCoop();
        });
    }
    
    const closeModeBtn = document.getElementById('close-minesweeper-mode');
    if (closeModeBtn) {
        closeModeBtn.addEventListener('click', () => {
            document.getElementById('minesweeper-mode-modal').classList.add('hidden');
        });
    }

    const closePickerBtn = document.getElementById('close-contact-picker');
    if (closePickerBtn) {
        closePickerBtn.addEventListener('click', () => {
            document.getElementById('contact-picker-modal').classList.add('hidden');
        });
    }

    const msAiHelpBtn = document.getElementById('ms-ai-help-btn');
    if (msAiHelpBtn) {
        msAiHelpBtn.addEventListener('click', () => {
            if (window.sendMessage) window.sendMessage("帮我玩一下", true, "text");
            setTimeout(() => {
                if (window.generateAiReply) window.generateAiReply();
            }, 500);
        });
    }

    // Mini Game Generic Modal
    const closeMiniGameBtn = document.getElementById('close-mini-game');
    if (closeMiniGameBtn) {
        closeMiniGameBtn.addEventListener('click', () => {
            document.getElementById('mini-game-modal').classList.add('hidden');
        });
    }

    const minimizeMiniGameBtn = document.getElementById('minimize-mini-game');
    if (minimizeMiniGameBtn) {
        minimizeMiniGameBtn.addEventListener('click', minimizeMiniGame);
    }

    const miniGameMinimized = document.getElementById('mini-game-minimized');
    if (miniGameMinimized) {
        miniGameMinimized.addEventListener('click', (e) => {
            if (miniGameMinimized.dataset.isDragging === 'true') {
                return;
            }
            restoreMiniGame();
        });
        makeDraggable(miniGameMinimized, miniGameMinimized);
    }

    const miniGameWindow = document.getElementById('mini-game-window');
    const miniGameHeader = document.getElementById('mini-game-header');
    if (miniGameWindow && miniGameHeader) {
        makeDraggable(miniGameWindow, miniGameHeader);
    }
}

function minimizeMiniGame() {
    const windowEl = document.getElementById('mini-game-window');
    const minimizedIcon = document.getElementById('mini-game-minimized');
    
    // Hide window, show icon
    windowEl.classList.add('ms-window-hidden'); // Reuse same class as minesweeper for transition
    minimizedIcon.classList.remove('ms-icon-hidden');
    
    // Also hide the modal container background (since it's transparent now, but good practice)
    document.getElementById('mini-game-modal').classList.add('hidden'); 
    // Wait, if I hide modal, the icon needs to be outside modal? 
    // In index.html, icon is outside modal. Correct.
}

function restoreMiniGame() {
    const windowEl = document.getElementById('mini-game-window');
    const minimizedIcon = document.getElementById('mini-game-minimized');
    
    document.getElementById('mini-game-modal').classList.remove('hidden');
    windowEl.classList.remove('ms-window-hidden');
    minimizedIcon.classList.add('ms-icon-hidden');
}

function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    handle.addEventListener('mousedown', dragMouseDown);
    handle.addEventListener('touchstart', dragMouseDown, { passive: false });

    function dragMouseDown(e) {
        element.dataset.isDragging = 'false'; // Reset drag state
        e = e || window.event;
        
        if (e.type === 'touchstart') {
            // e.preventDefault(); // Allow tap
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
        element.dataset.isDragging = 'true'; // Mark as dragging
        e = e || window.event;
        
        if (e.cancelable) {
            e.preventDefault(); // Prevent default (scrolling) during drag
        }
        
        // calculate the new cursor position:
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
        // set the element's new position:
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
        
        document.removeEventListener('touchend', closeDragElement);
        document.removeEventListener('touchmove', elementDrag);
    }
}

function minimizeMinesweeper() {
    // Animate minimize
    const windowEl = document.getElementById('minesweeper-window');
    const minimizedIcon = document.getElementById('minesweeper-minimized');
    
    windowEl.classList.add('ms-window-hidden');
    minimizedIcon.classList.remove('ms-icon-hidden');
}

function restoreMinesweeper() {
    const windowEl = document.getElementById('minesweeper-window');
    const minimizedIcon = document.getElementById('minesweeper-minimized');
    
    windowEl.classList.remove('ms-window-hidden');
    minimizedIcon.classList.add('ms-icon-hidden');
}

function isCurrentChatGroup() {
    const contactId = window.iphoneSimState && window.iphoneSimState.currentChatContactId;
    if (!contactId) return false;
    const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
        ? window.iphoneSimState.contacts
        : [];
    const currentContact = contacts.find(item => String(item && item.id) === String(contactId));
    if (!currentContact) return false;
    if (typeof window.isGroupChatContact === 'function') {
        return !!window.isGroupChatContact(currentContact);
    }
    return currentContact.chatType === 'group';
}

function createGameSelectionItem(config = {}) {
    const item = document.createElement('div');
    item.className = 'list-item';
    item.style.cursor = 'pointer';
    item.innerHTML = `
        <div class="list-content">
            <div style="width: 40px; height: 40px; background: ${config.color || '#eee'}; border-radius: 8px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                <i class="${config.icon || 'fas fa-gamepad'}" style="font-size: 20px; color: ${config.iconColor || '#fff'};"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: bold;">${config.title || '小游戏'}</div>
                <div style="font-size: 12px; color: #888;">${config.desc || ''}</div>
            </div>
        </div>
        <i class="fas fa-chevron-right" style="color: #ccc;"></i>
    `;
    item.addEventListener('click', () => {
        if (typeof config.onClick === 'function') {
            config.onClick();
        }
    });
    return item;
}

function renderGameSelectionList() {
    const modal = document.getElementById('game-selection-modal');
    if (!modal) return;
    const list = modal.querySelector('.ios-list-group');
    if (!list) return;
    list.innerHTML = '';

    const isGroupChat = isCurrentChatGroup();
    if (isGroupChat) {
        list.appendChild(createGameSelectionItem({
            color: '#6C63FF',
            icon: 'fas fa-user-secret',
            title: '谁是卧底',
            desc: '群聊推理互动游戏',
            onClick: () => window.startMiniGame('undercover')
        }));
        list.appendChild(createGameSelectionItem({
            color: '#111',
            icon: 'fas fa-question-circle',
            title: '海龟汤',
            desc: '问答推理互动游戏',
            onClick: () => window.startMiniGame('turtle_soup')
        }));
        return;
    }

    list.appendChild(createGameSelectionItem({
        color: '#eee',
        icon: 'fas fa-bomb',
        iconColor: '#333',
        title: '扫雷',
        desc: '经典益智游戏',
        onClick: () => window.openMinesweeperModeSelection()
    }));
    list.appendChild(createGameSelectionItem({
        color: '#FF9500',
        icon: 'fas fa-hand-scissors',
        title: '猜拳',
        desc: '石头剪刀布',
        onClick: () => window.startMiniGame('rps')
    }));
    list.appendChild(createGameSelectionItem({
        color: '#34C759',
        icon: 'fas fa-dice',
        title: '投骰子',
        desc: '比大小',
        onClick: () => window.startMiniGame('dice')
    }));
    list.appendChild(createGameSelectionItem({
        color: '#9b59b6',
        icon: 'fas fa-flask',
        title: '女巫的毒药',
        desc: '策略博弈',
        onClick: () => window.startMiniGame('witch')
    }));
    list.appendChild(createGameSelectionItem({
        color: '#FF2D55',
        icon: 'fas fa-bullseye',
        title: '真心话大冒险',
        desc: '转盘决定命运',
        onClick: () => window.startMiniGame('truth_dare')
    }));
}

function openGameSelection() {
    renderGameSelectionList();
    document.getElementById('game-selection-modal').classList.remove('hidden');
}

window.openMinesweeperModeSelection = function() {
    document.getElementById('game-selection-modal').classList.add('hidden');
    document.getElementById('minesweeper-mode-modal').classList.remove('hidden');
};

function handleMinesweeperCoop() {
    if (window.iphoneSimState.currentChatContactId) {
        startMinesweeperWithContact(window.iphoneSimState.currentChatContactId);
    } else {
        openContactPickerForGame();
    }
}

function openContactPickerForGame() {
    const modal = document.getElementById('contact-picker-modal');
    const list = document.getElementById('contact-picker-list');
    const sendBtn = document.getElementById('contact-picker-send-btn');
    
    if (!list) return;
    list.innerHTML = '';
    
    if (!window.iphoneSimState.contacts || window.iphoneSimState.contacts.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无联系人</div>';
    } else {
        window.iphoneSimState.contacts.forEach(contact => {
            const item = document.createElement('div');
            item.className = 'list-item';
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="list-content" style="align-items: center;">
                    <img src="${contact.avatar}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; object-fit: cover;">
                    <span>${contact.remark || contact.name}</span>
                </div>
            `;
            item.onclick = () => {
                modal.classList.add('hidden');
                // Open chat and start game
                document.getElementById('wechat-app').classList.remove('hidden');
                if (window.openChat) {
                    window.openChat(contact.id);
                }
                setTimeout(() => {
                    startMinesweeperWithContact(contact.id);
                }, 500);
            };
            list.appendChild(item);
        });
    }
    
    if (sendBtn) sendBtn.style.display = 'none'; // Hide default send button
    
    modal.classList.remove('hidden');
}

function startMinesweeperWithContact(contactId) {
    if (window.sendMessage) {
        window.sendMessage('[邀请你玩扫雷]', true, 'minesweeper_invite');
    }
    
    startMinesweeper();
    
    setTimeout(() => {
        if (window.generateAiReply) window.generateAiReply("用户邀请你玩扫雷。你可以通过回复 ACTION: MINESWEEPER_CLICK: row,col 来进行操作。");
    }, 1000);
}

window.getMinesweeperGameState = function() {
    if (!minesweeperState.grid || minesweeperState.grid.length === 0) return "Game not started.";
    
    let board = `Minesweeper Board (${minesweeperState.rows}x${minesweeperState.cols}), Mines: ${minesweeperState.mines - minesweeperState.flags}\n`;
    board += "   ";
    for (let c = 0; c < minesweeperState.cols; c++) board += (c % 10) + " "; 
    board += "\n";
    
    for (let r = 0; r < minesweeperState.rows; r++) {
        board += (r % 10) + "  "; 
        for (let c = 0; c < minesweeperState.cols; c++) {
            const cell = minesweeperState.grid[r][c];
            if (cell.isRevealed) {
                if (cell.isMine) board += "* ";
                else board += cell.neighborMines + " ";
            } else if (cell.isFlagged) {
                board += "F ";
            } else {
                board += "? ";
            }
        }
        board += "\n";
    }
    return board;
};

window.handleAiMinesweeperMove = function(command, r, c) {
    r = parseInt(r);
    c = parseInt(c);
    
    if (isNaN(r) || isNaN(c)) return;
    if (r < 0 || r >= minesweeperState.rows || c < 0 || c >= minesweeperState.cols) return;
    
    // 检查有效性
    const cellData = minesweeperState.grid[r][c];
    if ((command === 'CLICK' || command === 'REVEAL')) {
        // 如果已经揭开，忽略
        if (cellData.isRevealed) return;
        // 如果已插旗，忽略点击（必须先取消插旗）
        if (cellData.isFlagged) return;
    } else if (command === 'FLAG') {
        // 如果已经揭开，不能插旗
        if (cellData.isRevealed) return;
    }

    // Highlight cell
    const cellEl = document.querySelector(`.ms-cell[data-row="${r}"][data-col="${c}"]`);
    if (cellEl) {
        const originalBorder = cellEl.style.border;
        const originalTransform = cellEl.style.transform;
        
        cellEl.style.border = '2px solid #007AFF';
        cellEl.style.zIndex = '10';
        cellEl.style.transform = 'scale(1.1)';
        cellEl.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            cellEl.style.border = originalBorder;
            cellEl.style.zIndex = '';
            cellEl.style.transform = originalTransform;
            
            if (command === 'CLICK' || command === 'REVEAL') {
                revealCell(r, c);
            } else if (command === 'FLAG') {
                toggleFlag(r, c);
            }
        }, 800);
    }
};

// --- 扫雷游戏逻辑 ---

window.startMinesweeper = function(level = 'easy') {
    document.getElementById('game-selection-modal').classList.add('hidden');
    const modal = document.getElementById('minesweeper-modal');
    modal.classList.remove('hidden');
    
    // Reset minimize state
    const windowEl = document.getElementById('minesweeper-window');
    const minimizedIcon = document.getElementById('minesweeper-minimized');
    
    windowEl.classList.remove('ms-window-hidden');
    minimizedIcon.classList.add('ms-icon-hidden');
    
    // 设置难度
    minesweeperState.level = level;
    if (level === 'easy') {
        minesweeperState.rows = 9;
        minesweeperState.cols = 9;
        minesweeperState.mines = 10;
    } else if (level === 'medium') {
        minesweeperState.rows = 16;
        minesweeperState.cols = 16;
        minesweeperState.mines = 40;
    } else if (level === 'hard') {
        minesweeperState.rows = 20;
        minesweeperState.cols = 15;
        minesweeperState.mines = 50;
    }

    resetMinesweeper();
    renderMinesweeperGrid();
};

function closeMinesweeper() {
    document.getElementById('minesweeper-modal').classList.add('hidden');
    if (minesweeperState.timerInterval) clearInterval(minesweeperState.timerInterval);
}

function resetMinesweeper() {
    if (minesweeperState.timerInterval) clearInterval(minesweeperState.timerInterval);
    minesweeperState.timerInterval = null;
    minesweeperState.startTime = null;
    minesweeperState.gameOver = false;
    minesweeperState.flags = 0;
    minesweeperState.grid = [];

    // 更新 UI
    document.getElementById('ms-mines-count').textContent = formatNumber(minesweeperState.mines);
    document.getElementById('ms-timer').textContent = '000';
    document.getElementById('ms-face-btn').textContent = '🙂';

    // 初始化网格数据
    for (let r = 0; r < minesweeperState.rows; r++) {
        const row = [];
        for (let c = 0; c < minesweeperState.cols; c++) {
            row.push({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            });
        }
        minesweeperState.grid.push(row);
    }

    // 布雷
    let minesPlaced = 0;
    while (minesPlaced < minesweeperState.mines) {
        const r = Math.floor(Math.random() * minesweeperState.rows);
        const c = Math.floor(Math.random() * minesweeperState.cols);
        if (!minesweeperState.grid[r][c].isMine) {
            minesweeperState.grid[r][c].isMine = true;
            minesPlaced++;
        }
    }

    // 计算邻居雷数
    for (let r = 0; r < minesweeperState.rows; r++) {
        for (let c = 0; c < minesweeperState.cols; c++) {
            if (!minesweeperState.grid[r][c].isMine) {
                minesweeperState.grid[r][c].neighborMines = countNeighborMines(r, c);
            }
        }
    }
}

function countNeighborMines(r, c) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            const nr = r + i;
            const nc = c + j;
            if (nr >= 0 && nr < minesweeperState.rows && nc >= 0 && nc < minesweeperState.cols) {
                if (minesweeperState.grid[nr][nc].isMine) count++;
            }
        }
    }
    return count;
}

function renderMinesweeperGrid() {
    const gridEl = document.getElementById('ms-grid');
    gridEl.innerHTML = '';
    
    // 固定格子大小，确保点击体验
    const cellSize = 30; 
    const gap = 4;
    
    // 设置 CSS Grid
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = `repeat(${minesweeperState.cols}, ${cellSize}px)`;
    gridEl.style.gap = `${gap}px`;
    
    // 启用滚动容器
    gridEl.style.width = '100%';
    gridEl.style.maxWidth = '100%';
    gridEl.style.overflowX = 'auto'; // 横向滚动
    gridEl.style.padding = '5px 0';  // 避免阴影被切
    
    // 根据宽度决定对齐方式
    const estimatedWidth = minesweeperState.cols * (cellSize + gap);
    // 容器内宽约 280px (320 - padding)
    if (estimatedWidth > 280) {
        gridEl.style.justifyContent = 'start';
    } else {
        gridEl.style.justifyContent = 'center';
    }
    
    for (let r = 0; r < minesweeperState.rows; r++) {
        for (let c = 0; c < minesweeperState.cols; c++) {
            const cell = document.createElement('div');
            cell.className = 'ms-cell';
            cell.dataset.row = r;
            cell.dataset.col = c;
            
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.style.flexShrink = '0'; // 防止压缩
            cell.style.borderRadius = '4px';
            cell.style.backgroundColor = '#E5E5EA'; 
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.fontSize = '14px';
            cell.style.fontWeight = '600';
            cell.style.cursor = 'pointer';
            cell.style.transition = 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)';
            cell.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
            
            let touchTimer = null;
            cell.addEventListener('touchstart', (e) => {
                if (minesweeperState.gameOver || minesweeperState.grid[r][c].isRevealed) return;
                touchTimer = setTimeout(() => {
                    e.preventDefault();
                    toggleFlag(r, c);
                    if (navigator.vibrate) navigator.vibrate(50);
                }, 400);
            });
            
            cell.addEventListener('touchend', () => {
                if (touchTimer) clearTimeout(touchTimer);
            });

            cell.addEventListener('click', () => {
                if (minesweeperState.gameOver) return;
                if (minesweeperState.grid[r][c].isFlagged) return;
                revealCell(r, c);
            });

            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (minesweeperState.gameOver || minesweeperState.grid[r][c].isRevealed) return;
                toggleFlag(r, c);
            });

            gridEl.appendChild(cell);
        }
    }
}

function revealCell(r, c) {
    const cellData = minesweeperState.grid[r][c];
    if (cellData.isRevealed || cellData.isFlagged) return;

    if (!minesweeperState.startTime) {
        minesweeperState.startTime = Date.now();
        minesweeperState.timerInterval = setInterval(updateTimer, 1000);
    }

    cellData.isRevealed = true;
    updateCellUI(r, c);

    if (cellData.isMine) {
        gameOver(false);
    } else {
        if (cellData.neighborMines === 0) {
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const nr = r + i;
                    const nc = c + j;
                    if (nr >= 0 && nr < minesweeperState.rows && nc >= 0 && nc < minesweeperState.cols) {
                        revealCell(nr, nc);
                    }
                }
            }
        }
        checkWin();
    }
}

function toggleFlag(r, c) {
    const cellData = minesweeperState.grid[r][c];
    if (cellData.isRevealed) return;

    if (cellData.isFlagged) {
        cellData.isFlagged = false;
        minesweeperState.flags--;
    } else {
        if (minesweeperState.flags < minesweeperState.mines) {
            cellData.isFlagged = true;
            minesweeperState.flags++;
        } else {
            return; 
        }
    }
    
    updateCellUI(r, c);
    document.getElementById('ms-mines-count').textContent = minesweeperState.mines - minesweeperState.flags;
}

function updateCellUI(r, c) {
    const cell = document.querySelector(`.ms-cell[data-row="${r}"][data-col="${c}"]`);
    const data = minesweeperState.grid[r][c];

    cell.style.boxShadow = 'none';
    cell.style.transform = 'scale(1)';

    if (data.isRevealed) {
        cell.style.backgroundColor = '#fff';
        cell.style.border = '1px solid #f0f0f0';
        
        if (data.isMine) {
            cell.style.backgroundColor = '#FF3B30';
            cell.style.border = 'none';
            cell.textContent = '💣';
            cell.style.color = '#fff';
        } else {
            if (data.neighborMines > 0) {
                cell.textContent = data.neighborMines;
                cell.style.color = getNumberColor(data.neighborMines);
            } else {
                cell.textContent = '';
            }
        }
    } else if (data.isFlagged) {
        cell.style.backgroundColor = '#FF9500';
        cell.textContent = '🚩';
        cell.style.color = '#fff';
        cell.style.border = 'none';
    } else {
        cell.textContent = '';
        cell.style.backgroundColor = '#E5E5EA';
        cell.style.border = 'none';
        cell.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
    }
}

function getNumberColor(n) {
    const colors = ['blue', 'green', 'red', 'darkblue', 'brown', 'cyan', 'black', 'gray'];
    return colors[n - 1] || 'black';
}

function gameOver(win) {
    minesweeperState.gameOver = true;
    if (minesweeperState.timerInterval) clearInterval(minesweeperState.timerInterval);

    document.getElementById('ms-face-btn').textContent = win ? '😎' : '😵';

    if (!win) {
        for (let r = 0; r < minesweeperState.rows; r++) {
            for (let c = 0; c < minesweeperState.cols; c++) {
                if (minesweeperState.grid[r][c].isMine) {
                    minesweeperState.grid[r][c].isRevealed = true;
                    updateCellUI(r, c);
                }
            }
        }
    } else {
        showVictoryAnimation();
    }

    if (window.iphoneSimState && window.iphoneSimState.currentChatContactId && window.generateAiReply) {
        setTimeout(() => {
            const resultText = win ? "游戏胜利！所有地雷都已找出。" : "游戏失败！不小心踩到了地雷。";
            window.generateAiReply(`[系统通知]: 扫雷${resultText} 请根据当前游戏结果发表一句简短的评论。`);
        }, 1500);
    }
}

function showVictoryAnimation() {
    const windowEl = document.getElementById('minesweeper-window');
    
    const overlay = document.createElement('div');
    overlay.className = 'victory-overlay';
    
    const content = `
        <div class="victory-emoji">🏆</div>
        <div class="victory-title">Victory!</div>
        <div style="font-size: 16px; color: #666; font-weight: 500;">
            Time: ${document.getElementById('ms-timer').textContent}s
        </div>
        <button id="ms-restart-btn" style="margin-top: 20px; padding: 10px 30px; background: #007AFF; color: white; border: none; border-radius: 20px; font-weight: 600; font-size: 16px; cursor: pointer; box-shadow: 0 4px 10px rgba(0,122,255,0.3);">
            Play Again
        </button>
    `;
    overlay.innerHTML = content;
    
    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'ms-confetti';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.backgroundColor = ['#FF3B30', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#007AFF', '#5856D6', '#FF2D55'][Math.floor(Math.random() * 8)];
        confetti.style.animationDuration = (Math.random() * 2 + 1) + 's';
        confetti.style.animationDelay = (Math.random() * 0.5) + 's';
        overlay.appendChild(confetti);
    }
    
    windowEl.appendChild(overlay);
    
    document.getElementById('ms-restart-btn').addEventListener('click', () => {
        overlay.remove();
        startMinesweeper(minesweeperState.level);
    });
}

function checkWin() {
    let revealedCount = 0;
    for (let r = 0; r < minesweeperState.rows; r++) {
        for (let c = 0; c < minesweeperState.cols; c++) {
            if (minesweeperState.grid[r][c].isRevealed) revealedCount++;
        }
    }
    
    if (revealedCount === (minesweeperState.rows * minesweeperState.cols - minesweeperState.mines)) {
        gameOver(true);
    }
}

function updateTimer() {
    const now = Date.now();
    const diff = Math.floor((now - minesweeperState.startTime) / 1000);
    const display = diff > 999 ? 999 : diff;
    document.getElementById('ms-timer').textContent = formatNumber(display);
}

function formatNumber(num) {
    return num.toString().padStart(3, '0');
}

// --- New Mini Games Logic ---

window.startMiniGame = function(gameType) {
    window.currentMiniGame = gameType;
    document.getElementById('game-selection-modal').classList.add('hidden');
    
    const modal = document.getElementById('mini-game-modal');
    modal.classList.remove('hidden');
    
    // Ensure window is visible and icon hidden
    const windowEl = document.getElementById('mini-game-window');
    const minimizedIcon = document.getElementById('mini-game-minimized');
    windowEl.classList.remove('ms-window-hidden');
    minimizedIcon.classList.add('ms-icon-hidden');

    const title = document.getElementById('mini-game-title');
    const content = document.getElementById('mini-game-content');
    const resultDiv = document.getElementById('mini-game-result');
    
    resultDiv.innerHTML = '';
    content.innerHTML = '';
    
    // Reset max-width if changed by specific games
    windowEl.style.maxWidth = '320px';

    // Clear any previous AI help buttons in header
    const oldAiBtn = document.getElementById('mini-game-ai-btn');
    if(oldAiBtn) oldAiBtn.remove();

    // Clear any previous Import buttons
    const oldImportBtn = document.getElementById('mini-game-import-btn');
    if (oldImportBtn) oldImportBtn.remove();
    const oldImportInput = document.getElementById('tod-import-input');
    if (oldImportInput) oldImportInput.remove();

    if (gameType === 'truth_dare') {
        const headerControls = document.querySelector('#mini-game-header > div:last-child');
        const minimizeBtn = document.getElementById('minimize-mini-game');
        
        if (headerControls && minimizeBtn) {
            // Remove old buttons if exists (cleanup)
            const oldPresetBtn = document.getElementById('mini-game-preset-btn');
            if(oldPresetBtn) oldPresetBtn.remove();

            // 1. Preset Button
            const presetBtn = document.createElement('button');
            presetBtn.id = 'mini-game-preset-btn';
            presetBtn.innerHTML = '<i class="fas fa-list"></i>';
            presetBtn.style.cssText = 'background: transparent; border: none; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #8e8e93; cursor: pointer; transition: all 0.2s; margin-right: 5px;';
            presetBtn.title = "题库预设";
            
            presetBtn.onmouseenter = () => presetBtn.style.backgroundColor = '#f2f2f7';
            presetBtn.onmouseleave = () => presetBtn.style.backgroundColor = 'transparent';
            presetBtn.onclick = showTodPresets;

            // 2. Import Button
            const importBtn = document.createElement('button');
            importBtn.id = 'mini-game-import-btn';
            importBtn.innerHTML = '<i class="fas fa-file-import"></i>';
            importBtn.style.cssText = 'background: transparent; border: none; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; color: #8e8e93; cursor: pointer; transition: all 0.2s;';
            importBtn.title = "导入题目";
            
            importBtn.onmouseenter = () => importBtn.style.backgroundColor = '#f2f2f7';
            importBtn.onmouseleave = () => importBtn.style.backgroundColor = 'transparent';

            const input = document.createElement('input');
            input.type = 'file';
            input.id = 'tod-import-input';
            input.accept = '.json';
            input.style.display = 'none';
            document.body.appendChild(input);

            importBtn.onclick = () => input.click();

            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        if (data.truth && Array.isArray(data.truth) && data.dare && Array.isArray(data.dare)) {
                            tdState.pools.truth = data.truth;
                            tdState.pools.dare = data.dare;
                            saveTodData();
                            alert('真心话大冒险题库导入成功！');
                        } else {
                            alert('导入格式错误：JSON文件必须包含 truth 和 dare 两个数组字段');
                        }
                    } catch (err) {
                        console.error(err);
                        alert('JSON 解析失败，请检查文件格式');
                    }
                };
                reader.readAsText(file);
                input.value = '';
            };

            // Insert in order: Preset -> Import -> Minimize
            headerControls.insertBefore(presetBtn, minimizeBtn);
            headerControls.insertBefore(importBtn, minimizeBtn);
        }
    }

    if (gameType === 'undercover') {
        title.textContent = '谁是卧底';
        document.getElementById('mini-game-window').style.maxWidth = '360px';
        startUndercoverGame();
    } else if (gameType === 'turtle_soup') {
        title.textContent = '海龟汤';
        document.getElementById('mini-game-window').style.maxWidth = '360px';
        startTurtleSoupGame();
    } else if (gameType === 'rps') {
        title.textContent = '猜拳';
        content.innerHTML = `
            <div style="display: flex; gap: 20px;">
                <button class="rps-btn" data-choice="rock" style="font-size: 40px; width: 80px; height: 80px; border-radius: 50%; border: none; background: #eee; cursor: pointer; transition: transform 0.2s;">✊</button>
                <button class="rps-btn" data-choice="scissors" style="font-size: 40px; width: 80px; height: 80px; border-radius: 50%; border: none; background: #eee; cursor: pointer; transition: transform 0.2s;">✌️</button>
                <button class="rps-btn" data-choice="paper" style="font-size: 40px; width: 80px; height: 80px; border-radius: 50%; border: none; background: #eee; cursor: pointer; transition: transform 0.2s;">✋</button>
            </div>
            <div id="rps-opponent" style="margin-top: 20px; font-size: 60px; min-height: 80px;">❓</div>
        `;
        
        const btns = content.querySelectorAll('.rps-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', () => playRPS(btn.dataset.choice));
        });
        
    } else if (gameType === 'dice') {
        title.textContent = '投骰子';
        content.innerHTML = `
            <div style="display: flex; gap: 30px; align-items: center;">
                <div style="text-align: center;">
                    <div style="margin-bottom: 10px; color: #666;">你</div>
                    <div id="dice-user" style="font-size: 60px; width: 80px; height: 80px; background: #f9f9f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);">🎲</div>
                </div>
                <div style="font-size: 24px; color: #ccc;">VS</div>
                <div style="text-align: center;">
                    <div style="margin-bottom: 10px; color: #666;">TA</div>
                    <div id="dice-opponent" style="font-size: 60px; width: 80px; height: 80px; background: #f9f9f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 5px rgba(0,0,0,0.05);">❓</div>
                </div>
            </div>
            <button id="roll-dice-btn" style="margin-top: 30px; padding: 12px 40px; background: #34C759; color: white; border: none; border-radius: 25px; font-size: 18px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 10px rgba(52, 199, 89, 0.3);">
                投掷
            </button>
        `;
        
        document.getElementById('roll-dice-btn').addEventListener('click', playDice);
        
    } else if (gameType === 'witch') {
        title.textContent = '女巫的毒药';
        // Widening the modal for this game
        document.getElementById('mini-game-window').style.maxWidth = '360px';
        
        content.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
                <div style="display: flex; gap: 15px; align-items: flex-start; justify-content: center; width: 100%;">
                    <div style="text-align: center;">
                        <div style="margin-bottom: 5px; font-size: 12px; color: #666;">TA <span id="witch-score-opp" style="color: #FF3B30; font-weight: bold;"></span></div>
                        <div id="witch-grid-opponent" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; width: 130px; height: 130px; background: #f0f0f0; padding: 3px; border-radius: 4px;">
                            <!-- Generated by JS -->
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <div style="margin-bottom: 5px; font-size: 12px; color: #666;">你 <span id="witch-score-user" style="color: #FF3B30; font-weight: bold;"></span></div>
                        <div id="witch-grid-user" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; width: 130px; height: 130px; background: #f0f0f0; padding: 3px; border-radius: 4px;">
                            <!-- Generated by JS -->
                        </div>
                    </div>
                </div>
                <button id="witch-action-btn" style="padding: 8px 20px; background: #007AFF; color: white; border: none; border-radius: 15px; font-size: 14px; cursor: pointer; display: none;">确认布阵</button>
            </div>
            <div id="witch-status" style="margin-top: 10px; font-size: 13px; color: #666; text-align: center;">正在初始化...</div>
        `;
        
        startWitchGame();
    } else if (gameType === 'truth_dare') {
        title.textContent = '真心话大冒险';
        startTruthDareGame();
    }
};

// Initialize from LocalStorage
const savedTodPools = localStorage.getItem('tod_current_pools');
const savedTodPresets = localStorage.getItem('tod_presets');

let tdState = {
    isSpinning: false,
    currentRotation: 0,
    currentType: null, // 'truth' or 'dare'
    currentOptions: [], // Array of strings (questions)
    pools: savedTodPools ? JSON.parse(savedTodPools) : {
        'truth': [
            "最大的恐惧？",
            "最丢脸的事？",
            "暗恋过谁？",
            "最后一次哭？",
            "隐身想做啥？",
            "撒过最大的谎？",
            "想回到何时？",
            "讨厌的缺点？",
            "最喜欢的异性？",
            "初吻还在吗？"
        ],
        'dare': [
            "发鬼脸自拍",
            "发语音学猫叫",
            "给第三人发爱你",
            "改昵称我是猪",
            "左手打字十句",
            "发环境照片",
            "夸赞AI三句",
            "发尴尬表情包",
            "深情朗读一段话",
            "唱一首歌"
        ]
    },
    presets: savedTodPresets ? JSON.parse(savedTodPresets) : []
};

function startTruthDareGame() {
    const content = document.getElementById('mini-game-content');
    content.innerHTML = `
        <div class="tod-selection" style="display: flex; gap: 20px; width: 100%; justify-content: center; padding: 20px 0;">
            <button id="btn-select-truth" style="
                width: 100px; 
                height: 120px; 
                border: none; 
                border-radius: 16px; 
                background: linear-gradient(135deg, #5AC8FA, #007AFF); 
                color: white; 
                font-size: 20px; 
                font-weight: bold; 
                cursor: pointer; 
                box-shadow: 0 8px 20px rgba(90, 200, 250, 0.4);
                transition: transform 0.2s;
                display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
            ">
                <i class="fas fa-heart" style="font-size: 32px;"></i>
                真心话
            </button>
            <button id="btn-select-dare" style="
                width: 100px; 
                height: 120px; 
                border: none; 
                border-radius: 16px; 
                background: linear-gradient(135deg, #FF2D55, #FF9500); 
                color: white; 
                font-size: 20px; 
                font-weight: bold; 
                cursor: pointer; 
                box-shadow: 0 8px 20px rgba(255, 45, 85, 0.4);
                transition: transform 0.2s;
                display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
            ">
                <i class="fas fa-fire" style="font-size: 32px;"></i>
                大冒险
            </button>
        </div>
        <div style="margin-top: 10px; font-size: 14px; color: #666; text-align: center;">请选择游戏模式</div>
    `;
    
    document.getElementById('btn-select-truth').addEventListener('click', () => initTodWheel('truth'));
    document.getElementById('btn-select-dare').addEventListener('click', () => initTodWheel('dare'));
    
    // Reset state
    tdState.currentRotation = 0;
    document.getElementById('mini-game-result').textContent = '';
}

function initTodWheel(type) {
    tdState.currentType = type;
    // Randomly select 6 distinct options
    const pool = [...tdState.pools[type]];
    const selected = [];
    while(selected.length < 6 && pool.length > 0) {
        const idx = Math.floor(Math.random() * pool.length);
        selected.push(pool[idx]);
        pool.splice(idx, 1);
    }
    tdState.currentOptions = selected;
    
    // Render Wheel View
    const content = document.getElementById('mini-game-content');
    content.innerHTML = `
        <div id="wheel-container">
            <div id="wheel-pointer"></div>
            <canvas id="wheel-canvas" width="250" height="250"></canvas>
            <div id="wheel-center" style="cursor: pointer;">GO</div>
        </div>
        <button id="tod-back-btn" style="
            background: none; border: none; color: #888; font-size: 14px; cursor: pointer; text-decoration: underline; margin-top: 10px;
        ">返回选择</button>
    `;
    
    drawWheel();
    
    document.getElementById('wheel-center').addEventListener('click', spinTodWheel);
    document.getElementById('tod-back-btn').addEventListener('click', startTruthDareGame);
}

function drawWheel() {
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const logicalSize = 250;
    
    // High DPI scaling
    canvas.width = logicalSize * dpr;
    canvas.height = logicalSize * dpr;
    canvas.style.width = logicalSize + 'px';
    canvas.style.height = logicalSize + 'px';
    
    ctx.scale(dpr, dpr);
    
    const centerX = logicalSize / 2;
    const centerY = logicalSize / 2;
    const radius = logicalSize / 2;
    const arc = Math.PI * 2 / 6;
    
    const colors = tdState.currentType === 'truth' 
        ? ['#5AC8FA', '#4CD964', '#FF9500', '#FF2D55', '#5856D6', '#FFCC00']
        : ['#FF2D55', '#FF9500', '#FFCC00', '#4CD964', '#5AC8FA', '#5856D6'];
    
    const altColors = tdState.currentType === 'truth'
        ? ['#5AC8FA', '#007AFF']
        : ['#FF2D55', '#FF9500'];

    tdState.currentOptions.forEach((text, i) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, i * arc, (i + 1) * arc);
        ctx.arc(centerX, centerY, 0, (i + 1) * arc, i * arc, true);
        ctx.fillStyle = altColors[i % 2];
        ctx.fill();
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(i * arc + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, sans-serif"; // Slightly larger font
        // Truncate text if too long
        let displayText = text;
        if (text.length > 6) displayText = text.substring(0, 5) + '..';
        ctx.fillText(displayText, radius - 10, 5); // Move text outwards
        ctx.restore();
    });
}

function spinTodWheel() {
    if (tdState.isSpinning) return;
    tdState.isSpinning = true;
    document.getElementById('mini-game-result').textContent = '';
    
    let extraSpins = 5 + Math.floor(Math.random() * 5); 
    let randomDeg = Math.floor(Math.random() * 360);
    let targetRotation = tdState.currentRotation + (extraSpins * 360) + randomDeg;
    
    // Normalize to 0-360
    let finalDeg = targetRotation % 360; 
    
    // Calculate index
    // Pointer at 270 (-90). Wheel rotates clockwise.
    let pointerAngle = 270;
    let effectiveAngle = (pointerAngle - finalDeg + 7200) % 360; 
    let index = Math.floor(effectiveAngle / 60);
    let resultText = tdState.currentOptions[index];
    
    const wheel = document.getElementById('wheel-canvas');
    wheel.style.transform = `rotate(${targetRotation}deg)`;
    tdState.currentRotation = targetRotation;
    
    setTimeout(() => {
        tdState.isSpinning = false;
        handleTodFinalResult(resultText);
    }, 4000);
}

function handleTodFinalResult(text) {
    const prefix = tdState.currentType === 'truth' ? '真心话' : '大冒险';
    document.getElementById('mini-game-result').textContent = `${prefix}: ${text}`;
    
    // Auto send system message
    if (window.sendMessage) {
        window.sendMessage(`[系统消息]: 选择了【${prefix}】\n内容：${text}`, true, 'text');
    }
}

window.handleAiTruthDare = function(intent = null) {
    // Check if we are in selection mode
    const selectionDiv = document.querySelector('.tod-selection');
    if (selectionDiv) {
        // Determine type based on intent or random
        let type;
        if (intent === 'truth') type = 'truth';
        else if (intent === 'dare') type = 'dare';
        else type = Math.random() > 0.5 ? 'truth' : 'dare';
        
        // Visual feedback simulation
        const btnId = type === 'truth' ? 'btn-select-truth' : 'btn-select-dare';
        const btn = document.getElementById(btnId);
        
        if (btn) {
            // Highlight effect
            const originalBoxShadow = btn.style.boxShadow;
            btn.style.boxShadow = `0 0 15px 5px ${type === 'truth' ? '#5AC8FA' : '#FF2D55'}`;
            btn.style.transform = 'scale(1.05)';
            
            // Only generate reply if intent is null (AI deciding)
            // If intent exists (user asked), chat.js handles the reply generation via generateAiReply
            if (!intent && window.generateAiReply) {
                const text = type === 'truth' ? "我选真心话！" : "来个大冒险吧！";
                window.generateAiReply(text);
            }

            setTimeout(() => {
                btn.style.boxShadow = originalBoxShadow;
                btn.style.transform = 'scale(1)';
                initTodWheel(type);
                
                // Auto spin if it was a selection action
                setTimeout(() => {
                    if (!tdState.isSpinning) {
                        spinTodWheel();
                    }
                }, 1500);
            }, 800);
        }
    } else {
        // We are in wheel mode
        const wheelCenter = document.getElementById('wheel-center');
        if (wheelCenter && !tdState.isSpinning) {
            if (!intent && window.generateAiReply) {
                window.generateAiReply("转转转！命运的齿轮开始转动~");
            }
            spinTodWheel();
        }
    }
};

let witchState = {
    phase: 'setup', // 'setup', 'playing', 'finished'
    turn: 'user', // 'user', 'ai'
    userGrid: [], // { isPoison, isRevealed }
    aiGrid: [],
    userPoisons: 0,
    userPoisonedCount: 0, // AI hit user's poison (User lose point)
    aiPoisonedCount: 0,   // User hit AI's poison (AI lose point)
    gameOver: false
};

function startWitchGame() {
    witchState = {
        phase: 'setup',
        turn: 'user',
        userGrid: Array(25).fill(null).map(() => ({ isPoison: false, isRevealed: false })),
        aiGrid: Array(25).fill(null).map(() => ({ isPoison: false, isRevealed: false })),
        userPoisons: 0,
        userPoisonedCount: 0,
        aiPoisonedCount: 0,
        gameOver: false
    };

    // AI Setup (Randomly place 3 poisons)
    let aiPoisonsPlaced = 0;
    while (aiPoisonsPlaced < 3) {
        const idx = Math.floor(Math.random() * 25);
        if (!witchState.aiGrid[idx].isPoison) {
            witchState.aiGrid[idx].isPoison = true;
            aiPoisonsPlaced++;
        }
    }

    renderWitchBoard();
    updateWitchStatus("请在右侧（你的区域）点击格子，藏入3瓶毒药 🧪");
    
    // Auto send invite
    if (window.sendMessage) {
        const contactName = getContactName();
        window.sendMessage(`[系统消息]: 游戏“女巫的毒药”开始\n规则：双方各藏3瓶毒药，轮流猜测对方格子。\n请先进行布阵。`, true, 'text');
    }
}

function renderWitchBoard() {
    const oppGridEl = document.getElementById('witch-grid-opponent');
    const userGridEl = document.getElementById('witch-grid-user');
    const actionBtn = document.getElementById('witch-action-btn');
    
    if (!oppGridEl || !userGridEl) return;

    // Render AI Grid (Opponent - Left)
    oppGridEl.innerHTML = '';
    witchState.aiGrid.forEach((cell, idx) => {
        const div = document.createElement('div');
        div.style.backgroundColor = '#fff';
        div.style.borderRadius = '2px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontSize = '14px';
        div.style.aspectRatio = '1/1'; // Force square
        div.style.overflow = 'hidden';
        div.style.cursor = (witchState.phase === 'playing' && witchState.turn === 'user' && !cell.isRevealed) ? 'pointer' : 'default';
        
        if (cell.isRevealed) {
            if (cell.isPoison) {
                div.textContent = '☠️';
                div.style.backgroundColor = '#ffcccc';
            } else {
                div.textContent = '⭕';
                div.style.color = '#ccc';
            }
        }

        if (witchState.phase === 'playing' && witchState.turn === 'user' && !cell.isRevealed) {
            div.onclick = () => handleWitchMove('opponent', idx);
        }
        
        oppGridEl.appendChild(div);
    });

    // Render User Grid (Right)
    userGridEl.innerHTML = '';
    witchState.userGrid.forEach((cell, idx) => {
        const div = document.createElement('div');
        div.style.backgroundColor = '#fff';
        div.style.borderRadius = '2px';
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontSize = '14px';
        div.style.aspectRatio = '1/1'; // Force square
        div.style.overflow = 'hidden';
        div.style.cursor = (witchState.phase === 'setup' && !cell.isRevealed) ? 'pointer' : 'default';

        if (witchState.phase === 'setup') {
            if (cell.isPoison) {
                div.textContent = '🧪';
                div.style.backgroundColor = '#e6e6fa';
            }
            div.onclick = () => handleWitchSetup(idx);
        } else {
            if (cell.isRevealed) {
                if (cell.isPoison) {
                    div.textContent = '☠️'; // Hit by AI
                    div.style.backgroundColor = '#ffcccc';
                } else {
                    div.textContent = '⭕';
                    div.style.color = '#ccc';
                }
            } else {
                if (cell.isPoison) {
                    div.textContent = '🧪'; // My poison (hidden from AI, visible to me)
                    div.style.color = '#9b59b6';
                }
            }
        }
        
        userGridEl.appendChild(div);
    });

    // Update Action Button
    if (witchState.phase === 'setup') {
        if (witchState.userPoisons === 3) {
            actionBtn.style.display = 'block';
            actionBtn.textContent = '确认布阵';
            actionBtn.onclick = finishWitchSetup;
        } else {
            actionBtn.style.display = 'none';
        }
    } else {
        actionBtn.style.display = 'none';
    }

    // Update Score
    const oppScoreEl = document.getElementById('witch-score-opp');
    const userScoreEl = document.getElementById('witch-score-user');
    if (oppScoreEl) oppScoreEl.textContent = witchState.aiPoisonedCount > 0 ? `中毒${witchState.aiPoisonedCount}` : '';
    if (userScoreEl) userScoreEl.textContent = witchState.userPoisonedCount > 0 ? `中毒${witchState.userPoisonedCount}` : '';
}

function handleWitchSetup(idx) {
    if (witchState.phase !== 'setup') return;
    
    const cell = witchState.userGrid[idx];
    if (cell.isPoison) {
        cell.isPoison = false;
        witchState.userPoisons--;
    } else {
        if (witchState.userPoisons < 3) {
            cell.isPoison = true;
            witchState.userPoisons++;
        }
    }
    renderWitchBoard();
}

function finishWitchSetup() {
    if (witchState.userPoisons !== 3) return;
    witchState.phase = 'playing';
    renderWitchBoard();
    updateWitchStatus("布阵完成！请点击左侧（TA的区域）选择一个格子。");
    
    if (window.sendMessage) {
        window.sendMessage(`[系统消息]: 我已完成布阵，游戏开始！\n轮到我方行动。`, true, 'text');
    }
}

function handleWitchMove(target, idx) {
    if (witchState.gameOver) return;
    if (witchState.phase !== 'playing') return;
    if (witchState.turn !== 'user') return; // AI turn
    if (target !== 'opponent') return; // User clicks opponent grid

    const cell = witchState.aiGrid[idx];
    if (cell.isRevealed) return;

    // User reveals AI cell
    cell.isRevealed = true;
    let msg = '';
    
    if (cell.isPoison) {
        witchState.aiPoisonedCount++; // AI got hit
        msg = `用户选择了 (行${Math.floor(idx/5)+1}, 列${idx%5+1})，那是【毒药】☠️！\n对方中毒次数：${witchState.aiPoisonedCount}`;
        // Animation/Sound effect?
    } else {
        msg = `用户选择了 (行${Math.floor(idx/5)+1}, 列${idx%5+1})，是安全的。`;
    }

    if (window.sendMessage) {
        window.sendMessage(`[系统消息]: ${msg}`, true, 'text');
    }

    checkWitchGameOver();

    if (!witchState.gameOver) {
        witchState.turn = 'ai';
        updateWitchStatus("等待对方行动...");
    }
    renderWitchBoard();
}

window.handleAiWitchGuess = function(r, c) {
    if (witchState.gameOver) return;
    if (witchState.turn !== 'ai') return;

    r = parseInt(r);
    c = parseInt(c);
    const idx = (r - 1) * 5 + (c - 1);
    
    if (idx < 0 || idx >= 25) return;

    const cell = witchState.userGrid[idx];
    if (cell.isRevealed) return; // Already revealed

    cell.isRevealed = true;
    let msg = '';
    const contactName = getContactName();

    if (cell.isPoison) {
        witchState.userPoisonedCount++;
        msg = `${contactName} 选择了 (行${r}, 列${c})，那是【毒药】☠️！\n我方中毒次数：${witchState.userPoisonedCount}`;
    } else {
        msg = `${contactName} 选择了 (行${r}, 列${c})，是安全的。`;
    }

    if (window.sendMessage) {
        window.sendMessage(`[系统消息]: ${msg}`, true, 'text'); 
    }

    checkWitchGameOver();

    if (!witchState.gameOver) {
        witchState.turn = 'user';
        updateWitchStatus("轮到你了，请选择左侧格子。");
    }
    renderWitchBoard();
};

window.getWitchGameState = function() {
    if (!witchState || witchState.phase === 'setup') return null;
    
    let board = `【女巫的毒药局势】\n`;
    board += `对方中毒: ${witchState.aiPoisonedCount}/3\n我方中毒: ${witchState.userPoisonedCount}/3\n`;
    board += `轮到谁: ${witchState.turn === 'user' ? '用户' : '你(AI)'}\n`;
    
    board += `\n【你的视角（右侧格子）】\n`;
    for(let r=0; r<5; r++) {
        for(let c=0; c<5; c++) {
            const idx = r*5 + c;
            const cell = witchState.userGrid[idx];
            if (cell.isRevealed) {
                board += cell.isPoison ? '☠️ ' : '⭕ ';
            } else {
                board += '❓ '; // Unknown to AI
            }
        }
        board += '\n';
    }
    
    // Also hint about opponent grid (left) progress
    board += `\n【对方的区域（左侧格子）】\n`;
    for(let r=0; r<5; r++) {
        for(let c=0; c<5; c++) {
            const idx = r*5 + c;
            const cell = witchState.aiGrid[idx];
            if (cell.isRevealed) {
                board += cell.isPoison ? '☠️ ' : '⭕ ';
            } else {
                board += '⬜ '; // Unrevealed
            }
        }
        board += '\n';
    }
    
    return board;
};

function checkWitchGameOver() {
    const contactName = getContactName();
    if (witchState.aiPoisonedCount >= 3) {
        witchState.gameOver = true;
        updateWitchStatus("游戏结束！你点到了3瓶毒药，你输了！😵");
        if (window.sendMessage) {
            window.sendMessage(`[系统消息]: 游戏结束\n用户不幸点到了3瓶毒药。\n🏆 ${contactName} 胜利！`, true, 'text');
        }
    } else if (witchState.userPoisonedCount >= 3) {
        witchState.gameOver = true;
        updateWitchStatus("游戏结束！对方点到了3瓶毒药，你赢了！🎉");
        if (window.sendMessage) {
            window.sendMessage(`[系统消息]: 游戏结束\n${contactName} 不幸点到了3瓶毒药。\n🏆 用户胜利！`, true, 'text');
        }
    }
}

function updateWitchStatus(text) {
    const el = document.getElementById('witch-status');
    if (el) el.textContent = text;
}

function playRPS(userChoice) {
    const choices = ['rock', 'scissors', 'paper'];
    const emojis = { 'rock': '✊', 'scissors': '✌️', 'paper': '✋' };
    
    // Disable buttons
    document.querySelectorAll('.rps-btn').forEach(btn => btn.disabled = true);
    
    // Highlight user choice
    const userBtn = document.querySelector(`.rps-btn[data-choice="${userChoice}"]`);
    userBtn.style.transform = 'scale(1.2)';
    userBtn.style.background = '#007AFF';
    userBtn.style.color = '#fff';
    
    // Simulate opponent thinking
    const opponentDiv = document.getElementById('rps-opponent');
    let count = 0;
    const interval = setInterval(() => {
        opponentDiv.textContent = emojis[choices[count % 3]];
        count++;
    }, 100);
    
    setTimeout(() => {
        clearInterval(interval);
        const opponentChoice = choices[Math.floor(Math.random() * 3)];
        opponentDiv.textContent = emojis[opponentChoice];
        
        let result = '';
        if (userChoice === opponentChoice) {
            result = '平局！';
        } else if (
            (userChoice === 'rock' && opponentChoice === 'scissors') ||
            (userChoice === 'scissors' && opponentChoice === 'paper') ||
            (userChoice === 'paper' && opponentChoice === 'rock')
        ) {
            result = '你赢了！🎉';
        } else {
            result = '你输了！😵';
        }
        
        document.getElementById('mini-game-result').textContent = result;
        
        // Notify Chat
        if (window.sendMessage) {
            const contactName = getContactName();
            let winnerText = '';
            if (result.includes('你赢了')) winnerText = '用户胜';
            else if (result.includes('你输了')) winnerText = `${contactName}胜`;
            else winnerText = '平局';

            window.sendMessage(`[系统消息]: 猜拳对决\n用户出了 ${emojis[userChoice]}\n${contactName}出了 ${emojis[opponentChoice]}\n结果：${winnerText}`, true, 'text');
        }
        
        // Re-enable after delay
        setTimeout(() => {
            document.querySelectorAll('.rps-btn').forEach(btn => {
                btn.disabled = false;
                btn.style.transform = 'scale(1)';
                btn.style.background = '#eee';
                btn.style.color = '#000';
            });
            document.getElementById('rps-opponent').textContent = '❓';
            document.getElementById('mini-game-result').textContent = '';
        }, 3000);
        
    }, 1000);
}

function playDice() {
    const btn = document.getElementById('roll-dice-btn');
    btn.disabled = true;
    btn.style.opacity = '0.5';
    
    const userDice = document.getElementById('dice-user');
    const oppDice = document.getElementById('dice-opponent');
    
    let count = 0;
    const interval = setInterval(() => {
        userDice.textContent = Math.floor(Math.random() * 6) + 1;
        oppDice.textContent = Math.floor(Math.random() * 6) + 1;
        count++;
    }, 50);
    
    setTimeout(() => {
        clearInterval(interval);
        const userVal = Math.floor(Math.random() * 6) + 1;
        const oppVal = Math.floor(Math.random() * 6) + 1;
        
        userDice.textContent = userVal;
        oppDice.textContent = oppVal;
        
        let result = '';
        if (userVal > oppVal) result = '你赢了！🎉';
        else if (userVal < oppVal) result = '你输了！😵';
        else result = '平局！';
        
        document.getElementById('mini-game-result').textContent = result;
        
        // Notify Chat
        if (window.sendMessage) {
            const contactName = getContactName();
            let winnerText = '';
            if (result.includes('你赢了')) winnerText = '用户胜';
            else if (result.includes('你输了')) winnerText = `${contactName}胜`;
            else winnerText = '平局';

            window.sendMessage(`[系统消息]: 投骰子比大小\n用户：${userVal}点\n${contactName}：${oppVal}点\n结果：${winnerText}`, true, 'text');
        }
        
        setTimeout(() => {
            btn.disabled = false;
            btn.style.opacity = '1';
        }, 2000);
        
    }, 1000);
}


function getContactName() {
    if (window.iphoneSimState && window.iphoneSimState.currentChatContactId) {
        const contact = window.iphoneSimState.contacts.find(c => c.id === window.iphoneSimState.currentChatContactId);
        return contact ? (contact.remark || contact.name) : '对方';
    }
    return '对方';
}

function escapeMiniGameHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function getCurrentChatContactForMiniGame() {
    const contactId = window.iphoneSimState && window.iphoneSimState.currentChatContactId;
    const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
        ? window.iphoneSimState.contacts
        : [];
    return contacts.find(item => String(item && item.id) === String(contactId)) || null;
}

function getUndercoverParticipants() {
    const participants = [];
    const meName = String(window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name || '我').trim() || '我';
    participants.push({
        id: 'me',
        name: meName,
        isSelf: true
    });

    const contact = getCurrentChatContactForMiniGame();
    const isGroupChat = !!(
        contact
        && ((typeof window.isGroupChatContact === 'function' && window.isGroupChatContact(contact)) || contact.chatType === 'group')
    );

    if (isGroupChat && typeof window.getGroupMemberContacts === 'function') {
        const members = window.getGroupMemberContacts(contact) || [];
        const seen = new Set(['me']);
        members.forEach((member) => {
            if (!member || member.id === undefined || member.id === null) return;
            const memberId = String(member.id);
            if (seen.has(memberId)) return;
            seen.add(memberId);
            participants.push({
                id: memberId,
                name: String(member.remark || member.nickname || member.name || '群成员').trim() || '群成员',
                isSelf: false
            });
        });
        return participants;
    }

    if (contact) {
        participants.push({
            id: String(contact.id),
            name: String(contact.remark || contact.nickname || contact.name || '对方').trim() || '对方',
            isSelf: false
        });
    }
    return participants;
}

function shuffleMiniGameArray(source = []) {
    const list = source.slice();
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function getRandomUndercoverPair() {
    if (!Array.isArray(UNDERCOVER_WORD_PAIRS) || UNDERCOVER_WORD_PAIRS.length === 0) {
        return { civilian: '苹果', undercover: '梨子' };
    }
    const randomIndex = Math.floor(Math.random() * UNDERCOVER_WORD_PAIRS.length);
    const pair = UNDERCOVER_WORD_PAIRS[randomIndex] || UNDERCOVER_WORD_PAIRS[0];
    return {
        civilian: String(pair.civilian || '苹果').trim() || '苹果',
        undercover: String(pair.undercover || '梨子').trim() || '梨子'
    };
}

function computeUndercoverWinner() {
    const aliveIds = Array.isArray(undercoverState.aliveIds) ? undercoverState.aliveIds : [];
    const undercoverIds = Array.isArray(undercoverState.undercoverIds) ? undercoverState.undercoverIds : [];
    const aliveUndercoverCount = undercoverIds.filter(id => aliveIds.includes(id)).length;
    const aliveCivilianCount = Math.max(0, aliveIds.length - aliveUndercoverCount);

    if (aliveUndercoverCount <= 0) return '平民';
    if (aliveUndercoverCount >= aliveCivilianCount) return '卧底';
    return '';
}

function beginUndercoverRound(options = {}) {
    const participants = getUndercoverParticipants();
    undercoverState.round = Number(undercoverState.round || 0) + 1;
    undercoverState.participants = participants;
    undercoverState.aliveIds = participants.map(item => String(item.id));
    undercoverState.revealWords = false;
    undercoverState.winner = '';
    undercoverState.statusText = '';

    if (participants.length < 3) {
        undercoverState.undercoverIds = [];
        undercoverState.civilianWord = '';
        undercoverState.undercoverWord = '';
        undercoverState.revealById = {};
        undercoverState.voteCountById = {};
        undercoverState.statusText = '至少需要 3 名玩家（含你）才能开始。';
        renderUndercoverGameBoard();
        return;
    }

    const pair = getRandomUndercoverPair();
    const shuffledIds = shuffleMiniGameArray(undercoverState.aliveIds);
    const undercoverCount = participants.length >= 7 ? 2 : 1;
    const undercoverIds = shuffledIds.slice(0, Math.max(1, Math.min(undercoverCount, participants.length - 1)));
    const revealById = {};
    const voteCountById = {};
    undercoverState.aliveIds.forEach((id) => {
        revealById[String(id)] = false;
        voteCountById[String(id)] = 0;
    });

    undercoverState.undercoverIds = undercoverIds;
    undercoverState.civilianWord = pair.civilian;
    undercoverState.undercoverWord = pair.undercover;
    undercoverState.revealById = revealById;
    undercoverState.voteCountById = voteCountById;
    undercoverState.statusText = `第 ${undercoverState.round} 局已开始：先看身份，再投票淘汰。`;

    if (options.announce && isCurrentChatGroup() && typeof window.sendMessage === 'function') {
        window.sendMessage(`[系统消息]: 发起了「谁是卧底」游戏，当前共有 ${participants.length} 人参与。`, true, 'text');
    }

    renderUndercoverGameBoard();
}

function startUndercoverGame() {
    beginUndercoverRound({ announce: true });
}

function revealUndercoverIdentity(playerId) {
    const key = String(playerId || '');
    if (!key || !undercoverState.revealById || !Object.prototype.hasOwnProperty.call(undercoverState.revealById, key)) return;
    undercoverState.revealById[key] = !undercoverState.revealById[key];
    renderUndercoverGameBoard();
}

function voteUndercoverTarget(targetId) {
    const key = String(targetId || '');
    if (!key || undercoverState.winner) return;
    if (!Array.isArray(undercoverState.aliveIds) || !undercoverState.aliveIds.includes(key)) return;
    if (!undercoverState.voteCountById || typeof undercoverState.voteCountById !== 'object') {
        undercoverState.voteCountById = {};
    }
    undercoverState.voteCountById[key] = Number(undercoverState.voteCountById[key] || 0) + 1;
    undercoverState.statusText = `已给 ${getUndercoverPlayerName(key)} 累计 ${undercoverState.voteCountById[key]} 票`;
    renderUndercoverGameBoard();
}

function getUndercoverPlayerName(playerId) {
    const key = String(playerId || '');
    const participants = Array.isArray(undercoverState.participants) ? undercoverState.participants : [];
    const player = participants.find(item => String(item && item.id) === key);
    return player ? String(player.name || '玩家') : '玩家';
}

function settleUndercoverVote() {
    if (undercoverState.winner) return;
    const aliveIds = Array.isArray(undercoverState.aliveIds) ? undercoverState.aliveIds : [];
    if (aliveIds.length === 0) return;
    const voteMap = undercoverState.voteCountById && typeof undercoverState.voteCountById === 'object'
        ? undercoverState.voteCountById
        : {};
    let maxVotes = 0;
    aliveIds.forEach((id) => {
        const vote = Number(voteMap[String(id)] || 0);
        if (vote > maxVotes) maxVotes = vote;
    });
    if (maxVotes <= 0) {
        undercoverState.statusText = '请先点击玩家按钮进行投票。';
        renderUndercoverGameBoard();
        return;
    }

    const highestIds = aliveIds.filter(id => Number(voteMap[String(id)] || 0) === maxVotes);
    if (highestIds.length !== 1) {
        undercoverState.statusText = `平票（${maxVotes} 票）：${highestIds.map(id => getUndercoverPlayerName(id)).join('、')}，请重新投票。`;
        aliveIds.forEach((id) => { voteMap[String(id)] = 0; });
        renderUndercoverGameBoard();
        return;
    }

    const outId = String(highestIds[0]);
    undercoverState.aliveIds = aliveIds.filter(id => String(id) !== outId);
    aliveIds.forEach((id) => { voteMap[String(id)] = 0; });
    const isUndercover = Array.isArray(undercoverState.undercoverIds) && undercoverState.undercoverIds.includes(outId);
    undercoverState.statusText = `${getUndercoverPlayerName(outId)} 被淘汰（身份：${isUndercover ? '卧底' : '平民'}）`;

    const winner = computeUndercoverWinner();
    if (winner) {
        undercoverState.winner = winner;
        undercoverState.revealWords = true;
        undercoverState.statusText = winner === '卧底' ? '卧底阵营获胜！' : '平民阵营获胜！';
    }
    renderUndercoverGameBoard();
}

function renderUndercoverGameBoard() {
    const content = document.getElementById('mini-game-content');
    const resultDiv = document.getElementById('mini-game-result');
    if (!content || !resultDiv) return;

    const participants = Array.isArray(undercoverState.participants) ? undercoverState.participants : [];
    if (participants.length < 3) {
        content.innerHTML = `
            <div style="width:100%;padding:18px 12px 6px;text-align:center;">
                <div style="font-size:14px;color:#666;line-height:1.7;">当前人数不足，至少需要 3 人（含你）才能开始“谁是卧底”。</div>
                <button id="undercover-retry-btn" style="margin-top:14px;padding:10px 18px;border:none;border-radius:12px;background:#111;color:#fff;cursor:pointer;">重新检测成员</button>
            </div>
        `;
        resultDiv.textContent = undercoverState.statusText || '';
        const retryBtn = document.getElementById('undercover-retry-btn');
        if (retryBtn) retryBtn.addEventListener('click', () => beginUndercoverRound({ announce: false }));
        return;
    }

    const aliveSet = new Set((undercoverState.aliveIds || []).map(id => String(id)));
    const revealById = undercoverState.revealById && typeof undercoverState.revealById === 'object'
        ? undercoverState.revealById
        : {};
    const voteMap = undercoverState.voteCountById && typeof undercoverState.voteCountById === 'object'
        ? undercoverState.voteCountById
        : {};
    const winner = String(undercoverState.winner || '');

    const cardsHtml = participants.map((player) => {
        const playerId = String(player.id);
        const alive = aliveSet.has(playerId);
        const revealed = !!revealById[playerId];
        const isUndercover = Array.isArray(undercoverState.undercoverIds) && undercoverState.undercoverIds.includes(playerId);
        const roleText = isUndercover ? '卧底' : '平民';
        const wordText = isUndercover ? undercoverState.undercoverWord : undercoverState.civilianWord;
        const cardBg = alive ? '#fff' : '#f3f4f6';
        const cardColor = alive ? '#111' : '#9ca3af';
        return `
            <button type="button" data-undercover-reveal="${escapeMiniGameHtml(playerId)}" style="border:1px solid ${alive ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)'};border-radius:12px;background:${cardBg};padding:10px 10px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:4px;color:${cardColor};">
                <div style="font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:space-between;">
                    <span>${escapeMiniGameHtml(player.name)}${player.isSelf ? '（你）' : ''}</span>
                    <span style="font-size:11px;color:${alive ? '#10b981' : '#9ca3af'};">${alive ? '存活' : '出局'}</span>
                </div>
                <div style="font-size:12px;color:#6b7280;">${revealed ? `身份：${roleText} ｜ 词语：${escapeMiniGameHtml(wordText)}` : '点击查看身份与词语'}</div>
                <div style="font-size:11px;color:#9ca3af;">当前票数：${Number(voteMap[playerId] || 0)}</div>
            </button>
        `;
    }).join('');

    const voteButtonsHtml = participants
        .filter(player => aliveSet.has(String(player.id)))
        .map((player) => `
            <button type="button" data-undercover-vote="${escapeMiniGameHtml(String(player.id))}" style="border:none;border-radius:10px;background:#f3f4f6;color:#111;padding:8px 10px;font-size:12px;cursor:pointer;">
                投 ${escapeMiniGameHtml(player.name)}${player.isSelf ? '（你）' : ''}
            </button>
        `)
        .join('');

    content.innerHTML = `
        <div style="width:100%;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div style="font-size:12px;color:#6b7280;">第 ${undercoverState.round} 局 · 存活 ${aliveSet.size}/${participants.length}</div>
                <button type="button" id="undercover-toggle-words-btn" style="border:none;border-radius:10px;background:${undercoverState.revealWords ? '#111' : '#f3f4f6'};color:${undercoverState.revealWords ? '#fff' : '#111'};padding:7px 10px;font-size:12px;cursor:pointer;">
                    ${undercoverState.revealWords ? '隐藏词语' : '显示词语'}
                </button>
            </div>

            <div style="padding:10px;border-radius:12px;background:#f8fafc;border:1px solid rgba(15,23,42,0.06);font-size:12px;line-height:1.6;color:#334155;">
                ${undercoverState.revealWords
                    ? `平民词：${escapeMiniGameHtml(undercoverState.civilianWord)} ｜ 卧底词：${escapeMiniGameHtml(undercoverState.undercoverWord)}`
                    : '词语已隐藏：先让每位玩家点击卡片查看自己的身份与词语。'}
            </div>

            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">
                ${cardsHtml}
            </div>

            <div style="padding-top:2px;display:flex;flex-wrap:wrap;gap:8px;">
                ${voteButtonsHtml}
            </div>

            <div style="display:flex;gap:8px;">
                <button type="button" id="undercover-settle-btn" style="flex:1;border:none;border-radius:12px;background:#111;color:#fff;padding:10px 12px;font-size:13px;cursor:pointer;" ${winner ? 'disabled' : ''}>
                    结算本轮投票
                </button>
                <button type="button" id="undercover-new-round-btn" style="flex:1;border:none;border-radius:12px;background:#f3f4f6;color:#111;padding:10px 12px;font-size:13px;cursor:pointer;">
                    新一局
                </button>
            </div>
        </div>
    `;

    resultDiv.textContent = undercoverState.statusText || (winner ? `本局胜者：${winner}阵营` : '进行中');
    resultDiv.style.color = winner ? '#111' : '#666';
    resultDiv.style.fontWeight = winner ? '700' : '600';

    const toggleWordsBtn = document.getElementById('undercover-toggle-words-btn');
    if (toggleWordsBtn) {
        toggleWordsBtn.addEventListener('click', () => {
            undercoverState.revealWords = !undercoverState.revealWords;
            renderUndercoverGameBoard();
        });
    }

    content.querySelectorAll('[data-undercover-reveal]').forEach((button) => {
        button.addEventListener('click', () => revealUndercoverIdentity(button.dataset.undercoverReveal));
    });
    content.querySelectorAll('[data-undercover-vote]').forEach((button) => {
        button.addEventListener('click', () => voteUndercoverTarget(button.dataset.undercoverVote));
    });

    const settleBtn = document.getElementById('undercover-settle-btn');
    if (settleBtn) settleBtn.addEventListener('click', settleUndercoverVote);
    const newRoundBtn = document.getElementById('undercover-new-round-btn');
    if (newRoundBtn) newRoundBtn.addEventListener('click', () => beginUndercoverRound({ announce: false }));
}

// --- Truth or Dare Presets Logic ---

function showTodPresets() {
    const content = document.getElementById('mini-game-content');
    content.innerHTML = `
        <div style="padding: 10px; height: 100%; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h3 style="margin: 0; font-size: 16px;">题库预设</h3>
                <button id="tod-preset-back" style="border: none; background: none; color: #007AFF; cursor: pointer; font-size: 14px;">返回</button>
            </div>
            
            <div id="tod-preset-list" style="flex: 1; overflow-y: auto; margin-bottom: 15px;">
                <!-- List items will go here -->
            </div>
            
            <button id="tod-save-preset-btn" style="width: 100%; padding: 12px; background: #007AFF; color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 14px;">
                保存当前题库为预设
            </button>
        </div>
    `;

    renderTodPresetsList();
    
    document.getElementById('tod-preset-back').addEventListener('click', startTruthDareGame);
    document.getElementById('tod-save-preset-btn').addEventListener('click', saveCurrentTodAsPreset);
}

function renderTodPresetsList() {
    const list = document.getElementById('tod-preset-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (!tdState.presets || tdState.presets.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #999; margin-top: 40px;">暂无预设</div>';
        return;
    }
    
    tdState.presets.forEach((preset, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'background: #fff; padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05);';
        
        item.innerHTML = `
            <div style="flex: 1; overflow: hidden; margin-right: 10px;">
                <div style="font-weight: 600; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 15px;">${preset.name}</div>
                <div style="font-size: 12px; color: #8e8e93;">真心话: ${preset.truth.length} / 大冒险: ${preset.dare.length}</div>
            </div>
            <div style="display: flex; gap: 8px; flex-shrink: 0;">
                <button class="tod-load-btn" data-index="${index}" style="padding: 6px 12px; background: #34C759; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">使用</button>
                <button class="tod-del-btn" data-index="${index}" style="padding: 6px 12px; background: #FF3B30; color: white; border: none; border-radius: 6px; font-size: 12px; cursor: pointer;">删除</button>
            </div>
        `;
        list.appendChild(item);
    });
    
    document.querySelectorAll('.tod-load-btn').forEach(btn => {
        btn.addEventListener('click', (e) => loadTodPreset(parseInt(e.target.dataset.index)));
    });
    
    document.querySelectorAll('.tod-del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteTodPreset(parseInt(e.target.dataset.index)));
    });
}

function saveCurrentTodAsPreset() {
    const defaultName = "我的题库 " + (tdState.presets.length + 1);
    // Use window.prompt or implement a custom modal if preferred, prompt is simple for now
    // Since we are in an app simulation, prompt might break immersion but it's effective.
    // Let's use prompt for simplicity as requested "simplest solution".
    const name = prompt("请输入预设名称：", defaultName);
    
    if (name) {
        if (!tdState.presets) tdState.presets = [];
        tdState.presets.push({
            name: name,
            truth: [...tdState.pools.truth],
            dare: [...tdState.pools.dare]
        });
        saveTodData();
        renderTodPresetsList();
        // Feedback
        const saveBtn = document.getElementById('tod-save-preset-btn');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = "已保存！";
            saveBtn.style.backgroundColor = "#34C759";
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = "#007AFF";
            }, 1000);
        }
    }
}

function loadTodPreset(index) {
    const preset = tdState.presets[index];
    if (preset) {
        tdState.pools.truth = [...preset.truth];
        tdState.pools.dare = [...preset.dare];
        saveTodData();
        // alert(`已加载预设：${preset.name}`);
        // Instead of alert, show feedback and switch back
        const list = document.getElementById('tod-preset-list');
        list.innerHTML = `<div style="height: 100%; display: flex; align-items: center; justify-content: center; flex-direction: column; color: #34C759;">
            <i class="fas fa-check-circle" style="font-size: 40px; margin-bottom: 10px;"></i>
            <div>已加载：${preset.name}</div>
        </div>`;
        setTimeout(() => {
            startTruthDareGame();
        }, 800);
    }
}

function deleteTodPreset(index) {
    if (confirm("确定要删除这个预设吗？")) {
        tdState.presets.splice(index, 1);
        saveTodData();
        renderTodPresetsList();
    }
}

// --- Undercover group flow override (latest implementation) ---

function isMiniGameGroupContact(contact) {
    if (!contact) return false;
    if (typeof window.isGroupChatContact === 'function') {
        try {
            return !!window.isGroupChatContact(contact);
        } catch (error) {}
    }
    return String(contact.chatType || '') === 'group';
}

function getUndercoverGroupContact(contactOrId = null) {
    let contact = null;
    if (contactOrId && typeof contactOrId === 'object') {
        contact = contactOrId;
    } else if (contactOrId !== null && contactOrId !== undefined) {
        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        contact = contacts.find(item => String(item && item.id) === String(contactOrId)) || null;
    } else {
        contact = getCurrentChatContactForMiniGame();
    }
    return isMiniGameGroupContact(contact) ? contact : null;
}

function getUndercoverStateKey(group) {
    return String(group && group.id || '').trim();
}

function createEmptyUndercoverState(groupId) {
    return {
        groupId: String(groupId || ''),
        gameId: '',
        active: false,
        round: 0,
        phase: UNDERCOVER_PHASE.idle,
        participants: [],
        aliveIds: [],
        undercoverIds: [],
        civilianWord: '',
        undercoverWord: '',
        voteByActorId: {},
        showAllWords: false,
        setupIncludeSelf: true,
        setupSelectedMemberIds: [],
        customParticipantIds: [],
        winner: '',
        statusText: '',
        updatedAt: Date.now()
    };
}

function getUndercoverStateByGroup(group, createIfMissing = true) {
    const key = getUndercoverStateKey(group);
    if (!key) return null;
    if (!undercoverStateByGroup[key] && createIfMissing) {
        undercoverStateByGroup[key] = createEmptyUndercoverState(key);
    }
    return undercoverStateByGroup[key] || null;
}

function getUndercoverParticipantName(group, participantId) {
    const safeId = String(participantId || '').trim();
    if (safeId === 'me') {
        if (group && typeof window.getGroupMemberNickname === 'function') {
            try {
                const nick = String(window.getGroupMemberNickname(group, 'me') || '').trim();
                if (nick) return nick;
            } catch (error) {}
        }
        const profile = window.iphoneSimState && window.iphoneSimState.userProfile;
        return String(profile && profile.name || '我').trim() || '我';
    }
    const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
        ? window.iphoneSimState.contacts
        : [];
    const contact = contacts.find(item => String(item && item.id) === safeId) || null;
    if (group && typeof window.getGroupMemberNickname === 'function') {
        try {
            const nick = String(window.getGroupMemberNickname(group, safeId) || '').trim();
            if (nick) return nick;
        } catch (error) {}
    }
    if (contact) {
        return String(contact.remark || contact.nickname || contact.name || '群成员').trim() || '群成员';
    }
    return '群成员';
}

function getUndercoverParticipants(groupInput = null) {
    const group = getUndercoverGroupContact(groupInput);
    const state = getUndercoverStateByGroup(group, true);
    const participants = [];
    const seen = new Set();
    const members = (group && typeof window.getGroupMemberContacts === 'function')
        ? (window.getGroupMemberContacts(group) || [])
        : [];
    const memberMap = new Map();
    members.forEach((member) => {
        if (!member || member.id === undefined || member.id === null) return;
        memberMap.set(String(member.id), member);
    });

    const appendParticipantById = (participantId) => {
        const safeId = String(participantId || '').trim();
        if (!safeId || seen.has(safeId)) return;
        if (safeId === 'me') {
            seen.add('me');
            participants.push({
                id: 'me',
                name: getUndercoverParticipantName(group, 'me'),
                isSelf: true
            });
            return;
        }
        if (!memberMap.has(safeId)) return;
        seen.add(safeId);
        participants.push({
            id: safeId,
            name: getUndercoverParticipantName(group, safeId),
            isSelf: false
        });
    };

    const preferredIds = Array.isArray(state && state.customParticipantIds)
        ? state.customParticipantIds.map(id => String(id || '').trim()).filter(Boolean)
        : [];

    if (preferredIds.length > 0) {
        preferredIds.forEach(appendParticipantById);
    } else {
        appendParticipantById('me');
        memberMap.forEach((_, memberId) => appendParticipantById(memberId));
    }

    // 如果历史选择失效（如成员已退群），回落到默认全员（含我）
    if (participants.length <= 0) {
        appendParticipantById('me');
        memberMap.forEach((_, memberId) => appendParticipantById(memberId));
    }

    return participants;
}

function openUndercoverSetupFlow(groupInput = null) {
    const group = getUndercoverGroupContact(groupInput);
    const content = document.getElementById('mini-game-content');
    const resultDiv = document.getElementById('mini-game-result');
    if (!group || !content || !resultDiv) return;

    const state = getUndercoverStateByGroup(group, true);
    const members = typeof window.getGroupMemberContacts === 'function'
        ? (window.getGroupMemberContacts(group) || []).filter(item => item && item.id !== undefined && item.id !== null)
        : [];
    const memberIds = members.map(member => String(member.id));
    const existingSelected = Array.isArray(state.setupSelectedMemberIds)
        ? state.setupSelectedMemberIds.map(id => String(id || '').trim()).filter(id => memberIds.includes(id))
        : [];
    state.setupSelectedMemberIds = existingSelected.length > 0 ? existingSelected : memberIds.slice();
    if (typeof state.setupIncludeSelf !== 'boolean') {
        state.setupIncludeSelf = true;
    }

    resultDiv.textContent = '先选参与方式，再选成员。';
    content.innerHTML = `
        <div style="width:100%;display:flex;flex-direction:column;gap:12px;">
            <div style="font-size:14px;font-weight:600;color:#111;">谁是卧底 · 参与方式</div>
            <button type="button" id="undercover-mode-join-btn" style="border:none;border-radius:12px;background:#111;color:#fff;padding:12px 14px;font-size:13px;cursor:pointer;">
                我也参与（你 + 选中群成员）
            </button>
            <button type="button" id="undercover-mode-watch-btn" style="border:1px solid rgba(0,0,0,0.08);border-radius:12px;background:#fff;color:#111;padding:12px 14px;font-size:13px;cursor:pointer;">
                我只看他们玩（仅选中群成员）
            </button>
            <div style="font-size:12px;color:#8e8e93;line-height:1.6;">下一步会选择具体参与成员；总人数至少 3 人。</div>
        </div>
    `;

    const joinBtn = document.getElementById('undercover-mode-join-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {
            state.setupIncludeSelf = true;
            renderUndercoverMemberSelectionStep(group);
        });
    }

    const watchBtn = document.getElementById('undercover-mode-watch-btn');
    if (watchBtn) {
        watchBtn.addEventListener('click', () => {
            state.setupIncludeSelf = false;
            renderUndercoverMemberSelectionStep(group);
        });
    }
}

function renderUndercoverMemberSelectionStep(groupInput) {
    const group = getUndercoverGroupContact(groupInput);
    const content = document.getElementById('mini-game-content');
    const resultDiv = document.getElementById('mini-game-result');
    if (!group || !content || !resultDiv) return;
    const state = getUndercoverStateByGroup(group, true);

    const members = typeof window.getGroupMemberContacts === 'function'
        ? (window.getGroupMemberContacts(group) || []).filter(item => item && item.id !== undefined && item.id !== null)
        : [];
    const memberIds = members.map(member => String(member.id));
    const selectedSet = new Set(
        (Array.isArray(state.setupSelectedMemberIds) ? state.setupSelectedMemberIds : [])
            .map(id => String(id || '').trim())
            .filter(id => memberIds.includes(id))
    );
    state.setupSelectedMemberIds = Array.from(selectedSet);

    const selectedCount = selectedSet.size + (state.setupIncludeSelf ? 1 : 0);
    const minNeed = 3;
    const modeLabel = state.setupIncludeSelf ? '你参与' : '观战模式';

    const memberItemsHtml = members.map((member) => {
        const memberId = String(member.id);
        const selected = selectedSet.has(memberId);
        const memberName = String(member.remark || member.nickname || member.name || '群成员').trim() || '群成员';
        const avatar = String(member.avatar || '').trim() || 'https://placehold.co/64x64/e5e7eb/111827?text=U';
        return `
            <button type="button" data-undercover-pick-member="${escapeMiniGameHtml(memberId)}" style="width:100%;display:flex;align-items:center;gap:10px;border:${selected ? '1px solid #111' : '1px solid rgba(0,0,0,0.06)'};border-radius:12px;background:${selected ? '#f8fafc' : '#fff'};padding:9px 10px;cursor:pointer;">
                <img src="${escapeMiniGameHtml(avatar)}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;">
                <span style="flex:1;text-align:left;color:#111;font-size:13px;">${escapeMiniGameHtml(memberName)}</span>
                <span style="font-size:12px;color:${selected ? '#111' : '#9ca3af'};">${selected ? '已选' : '未选'}</span>
            </button>
        `;
    }).join('');

    content.innerHTML = `
        <div style="width:100%;display:flex;flex-direction:column;gap:10px;">
            <div style="font-size:14px;font-weight:600;color:#111;">谁是卧底 · 选择参与成员</div>
            <div style="font-size:12px;color:#6b7280;line-height:1.6;">
                当前模式：${modeLabel} ｜ 已选总人数：${selectedCount}（至少 ${minNeed} 人）
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;max-height:220px;overflow:auto;">
                ${memberItemsHtml || '<div style="padding:10px 6px;color:#9ca3af;font-size:12px;text-align:center;">当前群成员为空</div>'}
            </div>
            <div style="display:flex;gap:8px;">
                <button type="button" id="undercover-back-to-mode-btn" style="flex:1;border:none;border-radius:12px;background:#f3f4f6;color:#111;padding:10px 12px;font-size:13px;cursor:pointer;">返回</button>
                <button type="button" id="undercover-confirm-members-btn" style="flex:1;border:none;border-radius:12px;background:#111;color:#fff;padding:10px 12px;font-size:13px;cursor:pointer;">开始游戏</button>
            </div>
        </div>
    `;

    resultDiv.textContent = selectedCount >= minNeed ? '配置完成后可开始。' : `人数不足，至少 ${minNeed} 人`;

    content.querySelectorAll('[data-undercover-pick-member]').forEach((button) => {
        button.addEventListener('click', () => {
            const memberId = String(button.dataset.undercoverPickMember || '').trim();
            if (!memberId) return;
            if (selectedSet.has(memberId)) {
                selectedSet.delete(memberId);
            } else {
                selectedSet.add(memberId);
            }
            state.setupSelectedMemberIds = Array.from(selectedSet);
            renderUndercoverMemberSelectionStep(group);
        });
    });

    const backBtn = document.getElementById('undercover-back-to-mode-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => openUndercoverSetupFlow(group));
    }

    const confirmBtn = document.getElementById('undercover-confirm-members-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            const pickedMemberIds = Array.from(selectedSet).filter(id => memberIds.includes(id));
            const participantIds = state.setupIncludeSelf
                ? ['me', ...pickedMemberIds]
                : pickedMemberIds.slice();
            if (participantIds.length < minNeed) {
                resultDiv.textContent = `人数不足，至少 ${minNeed} 人`;
                return;
            }
            state.customParticipantIds = participantIds;
            state.setupSelectedMemberIds = pickedMemberIds;
            beginUndercoverRoundForGroup(group, { announce: true, actorId: 'me' });
        });
    }
}

function shuffleMiniGameArray(source = []) {
    const list = source.slice();
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

function getRandomUndercoverPair() {
    if (!Array.isArray(UNDERCOVER_WORD_PAIRS) || UNDERCOVER_WORD_PAIRS.length === 0) {
        return { civilian: '苹果', undercover: '梨子' };
    }
    const randomIndex = Math.floor(Math.random() * UNDERCOVER_WORD_PAIRS.length);
    const pair = UNDERCOVER_WORD_PAIRS[randomIndex] || UNDERCOVER_WORD_PAIRS[0];
    return {
        civilian: String(pair.civilian || '苹果').trim() || '苹果',
        undercover: String(pair.undercover || '梨子').trim() || '梨子'
    };
}

function computeUndercoverWinner(stateInput = null) {
    const state = stateInput && typeof stateInput === 'object'
        ? stateInput
        : null;
    if (!state) return '';
    const aliveIds = Array.isArray(state.aliveIds) ? state.aliveIds : [];
    const undercoverIds = Array.isArray(state.undercoverIds) ? state.undercoverIds : [];
    const aliveUndercoverCount = undercoverIds.filter(id => aliveIds.includes(id)).length;
    const aliveCivilianCount = Math.max(0, aliveIds.length - aliveUndercoverCount);
    if (aliveUndercoverCount <= 0) return '平民';
    if (aliveUndercoverCount >= aliveCivilianCount) return '卧底';
    return '';
}

function getUndercoverPlayerName(stateInput = null, playerId) {
    const state = stateInput && typeof stateInput === 'object'
        ? stateInput
        : null;
    const key = String(playerId || '');
    const participants = Array.isArray(state && state.participants) ? state.participants : [];
    const player = participants.find(item => String(item && item.id) === key);
    return player ? String(player.name || '玩家') : '玩家';
}

function getUndercoverVoteTally(state) {
    const tally = {};
    const aliveSet = new Set((state && state.aliveIds || []).map(id => String(id)));
    const voteByActorId = state && state.voteByActorId && typeof state.voteByActorId === 'object'
        ? state.voteByActorId
        : {};
    Object.keys(voteByActorId).forEach((actorId) => {
        const targetId = String(voteByActorId[actorId] || '').trim();
        if (!aliveSet.has(String(actorId)) || !aliveSet.has(targetId)) return;
        tally[targetId] = Number(tally[targetId] || 0) + 1;
    });
    return tally;
}

function getUndercoverPhaseLabel(phase) {
    if (phase === UNDERCOVER_PHASE.clue) return '线索阶段';
    if (phase === UNDERCOVER_PHASE.vote) return '投票阶段';
    if (phase === UNDERCOVER_PHASE.finished) return '本局结束';
    return '待开始';
}

function pushUndercoverSystemMessage(group, text) {
    if (!group || !text || typeof window.sendMessage !== 'function') return null;
    return window.sendMessage(`[系统消息]: 谁是卧底｜${text}`, false, 'text', null, group.id, {
        ignoreReplyingState: true,
        bypassWechatBlock: true,
        showNotification: false
    });
}

function beginUndercoverRoundForGroup(groupInput, options = {}) {
    const group = getUndercoverGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const state = getUndercoverStateByGroup(group, true);
    const participants = getUndercoverParticipants(group);
    state.updatedAt = Date.now();
    state.showAllWords = false;

    if (participants.length < 3) {
        state.active = false;
        state.phase = UNDERCOVER_PHASE.idle;
        state.participants = participants;
        state.aliveIds = participants.map(item => String(item.id));
        state.undercoverIds = [];
        state.civilianWord = '';
        state.undercoverWord = '';
        state.voteByActorId = {};
        state.winner = '';
        state.statusText = '至少需要 3 名玩家（含你）才能开始。';
        renderUndercoverGameBoard();
        return { ok: false, reason: 'not_enough_players', state };
    }

    state.active = true;
    state.round = Number(state.round || 0) + 1;
    state.phase = UNDERCOVER_PHASE.clue;
    state.gameId = `undercover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    state.participants = participants;
    state.aliveIds = participants.map(item => String(item.id));
    state.voteByActorId = {};
    state.winner = '';

    const pair = getRandomUndercoverPair();
    const shuffledIds = shuffleMiniGameArray(state.aliveIds);
    const undercoverCount = participants.length >= 7 ? 2 : 1;
    state.undercoverIds = shuffledIds.slice(0, Math.max(1, Math.min(undercoverCount, participants.length - 1)));
    state.civilianWord = pair.civilian;
    state.undercoverWord = pair.undercover;
    state.statusText = `第 ${state.round} 局开始：先描述线索，再进入投票。`;

    if (options.announce) {
        const actorName = options.actorId
            ? getUndercoverParticipantName(group, options.actorId)
            : '群成员';
        pushUndercoverSystemMessage(group, `${actorName} 发起了“谁是卧底”，本局 ${participants.length} 人参与。`);
    }

    renderUndercoverGameBoard();
    return { ok: true, changed: true, state };
}

function switchUndercoverPhaseForGroup(groupInput, phase, options = {}) {
    const group = getUndercoverGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const state = getUndercoverStateByGroup(group, false);
    if (!state || !state.active) return { ok: false, reason: 'not_active' };
    const nextPhase = String(phase || '').trim();
    if (![UNDERCOVER_PHASE.clue, UNDERCOVER_PHASE.vote, UNDERCOVER_PHASE.finished].includes(nextPhase)) {
        return { ok: false, reason: 'invalid_phase' };
    }
    if (state.phase === nextPhase) return { ok: true, changed: false, state };
    state.phase = nextPhase;
    state.updatedAt = Date.now();
    if (nextPhase === UNDERCOVER_PHASE.vote) {
        state.statusText = '已进入投票阶段：请大家投票。';
        if (options.announce) pushUndercoverSystemMessage(group, '已进入投票阶段。');
    } else if (nextPhase === UNDERCOVER_PHASE.clue) {
        state.statusText = '继续线索阶段：请围绕词语继续描述。';
    } else {
        state.statusText = state.winner ? `${state.winner}阵营获胜！` : '本局已结束。';
    }
    renderUndercoverGameBoard();
    return { ok: true, changed: true, state };
}

function voteUndercoverTargetForGroup(groupInput, actorId, targetId, options = {}) {
    const group = getUndercoverGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const state = getUndercoverStateByGroup(group, false);
    if (!state || !state.active) return { ok: false, reason: 'not_active' };
    if (state.phase !== UNDERCOVER_PHASE.vote) return { ok: false, reason: 'not_vote_phase' };

    const actorKey = String(actorId || '').trim();
    const targetKey = String(targetId || '').trim();
    if (!actorKey || !targetKey) return { ok: false, reason: 'invalid_actor_or_target' };
    const aliveSet = new Set((state.aliveIds || []).map(id => String(id)));
    if (!aliveSet.has(actorKey)) return { ok: false, reason: 'actor_not_alive' };
    if (!aliveSet.has(targetKey)) return { ok: false, reason: 'target_not_alive' };
    if (actorKey === targetKey) return { ok: false, reason: 'self_vote_not_allowed' };

    state.voteByActorId = state.voteByActorId && typeof state.voteByActorId === 'object'
        ? state.voteByActorId
        : {};
    state.voteByActorId[actorKey] = targetKey;
    state.updatedAt = Date.now();
    state.statusText = `${getUndercoverPlayerName(state, actorKey)} 投给了 ${getUndercoverPlayerName(state, targetKey)}`;
    if (options.announce) pushUndercoverSystemMessage(group, `${getUndercoverPlayerName(state, actorKey)} 完成了投票。`);
    renderUndercoverGameBoard();
    return { ok: true, changed: true, state };
}

function settleUndercoverVoteForGroup(groupInput, options = {}) {
    const group = getUndercoverGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const state = getUndercoverStateByGroup(group, false);
    if (!state || !state.active) return { ok: false, reason: 'not_active' };

    const aliveIds = Array.isArray(state.aliveIds) ? state.aliveIds.map(id => String(id)) : [];
    if (aliveIds.length <= 0) return { ok: false, reason: 'empty_alive' };
    const tally = getUndercoverVoteTally(state);
    let maxVotes = 0;
    aliveIds.forEach((id) => { maxVotes = Math.max(maxVotes, Number(tally[id] || 0)); });
    if (maxVotes <= 0) {
        state.statusText = '还没有有效投票，请先投票。';
        renderUndercoverGameBoard();
        return { ok: false, reason: 'no_votes', state };
    }

    const highestIds = aliveIds.filter(id => Number(tally[id] || 0) === maxVotes);
    if (highestIds.length !== 1) {
        state.statusText = `平票（${maxVotes}票）：${highestIds.map(id => getUndercoverPlayerName(state, id)).join('、')}，请继续讨论后重新投票。`;
        if (options.announce) pushUndercoverSystemMessage(group, '本轮平票，继续讨论后重新投票。');
        renderUndercoverGameBoard();
        return { ok: true, changed: false, tie: true, state };
    }

    const outId = String(highestIds[0]);
    state.aliveIds = aliveIds.filter(id => id !== outId);
    state.voteByActorId = {};
    state.updatedAt = Date.now();
    const isUndercover = Array.isArray(state.undercoverIds) && state.undercoverIds.includes(outId);
    state.statusText = `${getUndercoverPlayerName(state, outId)} 出局（身份：${isUndercover ? '卧底' : '平民'}）`;
    if (options.announce) {
        pushUndercoverSystemMessage(group, `${getUndercoverPlayerName(state, outId)} 出局（身份：${isUndercover ? '卧底' : '平民'}）。`);
    }

    const winner = computeUndercoverWinner(state);
    if (winner) {
        state.winner = winner;
        state.phase = UNDERCOVER_PHASE.finished;
        state.statusText = `${winner}阵营获胜！`;
        if (options.announce) pushUndercoverSystemMessage(group, `${winner}阵营获胜，本局结束。`);
    } else {
        state.phase = UNDERCOVER_PHASE.clue;
        state.statusText = `${getUndercoverPlayerName(state, outId)} 出局，进入下一轮线索阶段。`;
    }
    renderUndercoverGameBoard();
    return { ok: true, changed: true, state };
}

function endUndercoverGameForGroup(groupInput, options = {}) {
    const group = getUndercoverGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const state = getUndercoverStateByGroup(group, false);
    if (!state) return { ok: false, reason: 'not_found' };
    if (!state.active && state.phase === UNDERCOVER_PHASE.idle) return { ok: true, changed: false, state };
    state.active = false;
    state.phase = UNDERCOVER_PHASE.idle;
    state.winner = '';
    state.voteByActorId = {};
    state.statusText = '游戏已结束。';
    state.updatedAt = Date.now();
    if (options.announce) {
        const actorName = options.actorId ? getUndercoverParticipantName(group, options.actorId) : '群成员';
        pushUndercoverSystemMessage(group, `${actorName} 结束了“谁是卧底”。`);
    }
    renderUndercoverGameBoard();
    return { ok: true, changed: true, state };
}

function extractUndercoverTargetIdFromPayload(payload) {
    if (payload && typeof payload === 'object') {
        return String(
            payload.target_member_id
            || payload.targetMemberId
            || payload.target_id
            || payload.targetId
            || payload.member_id
            || payload.memberId
            || payload.id
            || ''
        ).trim();
    }
    if (typeof payload === 'string') {
        return String(payload || '').split('|')[0].trim();
    }
    return '';
}

function applyUndercoverGameAction(groupInput, actorId, command, payload = {}, options = {}) {
    const group = getUndercoverGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const normalizedCommand = String(command || '').trim().toUpperCase();
    if (!UNDERCOVER_ACTION_COMMANDS.has(normalizedCommand)) {
        return { ok: false, reason: 'unsupported_command' };
    }
    const resolvedActorId = typeof window.resolveGroupSpeakerContactId === 'function'
        ? window.resolveGroupSpeakerContactId(actorId, group) || String(actorId || '').trim()
        : String(actorId || '').trim();
    const actorKey = String(resolvedActorId || '').trim();
    const announce = !!options.showNotice;

    if (normalizedCommand === 'START_UNDERCOVER_GAME' || normalizedCommand === 'UNDERCOVER_NEXT_ROUND') {
        return beginUndercoverRoundForGroup(group, { announce, actorId: actorKey || 'me' });
    }
    if (normalizedCommand === 'UNDERCOVER_END') {
        return endUndercoverGameForGroup(group, { announce, actorId: actorKey || 'me' });
    }
    if (normalizedCommand === 'UNDERCOVER_SWITCH_PHASE') {
        let nextPhase = '';
        if (payload && typeof payload === 'object') {
            nextPhase = String(payload.phase || payload.to_phase || payload.toPhase || '').trim().toLowerCase();
        } else if (typeof payload === 'string') {
            nextPhase = String(payload || '').trim().toLowerCase();
        }
        if (nextPhase === 'clue' || nextPhase === 'line' || nextPhase === 'desc') {
            return switchUndercoverPhaseForGroup(group, UNDERCOVER_PHASE.clue, { announce, actorId: actorKey || 'me' });
        }
        if (nextPhase === 'vote' || nextPhase === 'voting') {
            return switchUndercoverPhaseForGroup(group, UNDERCOVER_PHASE.vote, { announce, actorId: actorKey || 'me' });
        }
        if (nextPhase === 'finished' || nextPhase === 'finish' || nextPhase === 'end') {
            return switchUndercoverPhaseForGroup(group, UNDERCOVER_PHASE.finished, { announce, actorId: actorKey || 'me' });
        }
        return { ok: false, reason: 'invalid_phase_payload' };
    }
    if (normalizedCommand === 'UNDERCOVER_VOTE') {
        const targetId = extractUndercoverTargetIdFromPayload(payload);
        if (!actorKey) return { ok: false, reason: 'missing_actor' };
        return voteUndercoverTargetForGroup(group, actorKey, targetId, { announce });
    }
    if (normalizedCommand === 'UNDERCOVER_SETTLE') {
        return settleUndercoverVoteForGroup(group, { announce, actorId: actorKey || 'me' });
    }
    return { ok: false, reason: 'unhandled' };
}

function buildUndercoverAiNudgeInstruction(group, state) {
    if (!state || !state.active) {
        return '群里想玩“谁是卧底”。请先自然聊天，再用 action START_UNDERCOVER_GAME 发起一局。';
    }
    if (state.phase === UNDERCOVER_PHASE.clue) {
        return '当前是“谁是卧底”线索阶段。每位存活玩家都要至少说 1 条线索，且线索必须和该玩家自己的词语强相关（用途/场景/外观/感受等），不能出现与词语明显无关的发言；线索差不多后可用 UNDERCOVER_SWITCH_PHASE 切到 vote。';
    }
    if (state.phase === UNDERCOVER_PHASE.vote) {
        return '当前是“谁是卧底”投票阶段。请先表达怀疑，再输出 UNDERCOVER_VOTE 让至少两位成员投票；必要时输出 UNDERCOVER_SETTLE。';
    }
    if (state.phase === UNDERCOVER_PHASE.finished) {
        return '“谁是卧底”本局已结束。请先复盘，再选择 UNDERCOVER_NEXT_ROUND 或 UNDERCOVER_END。';
    }
    return '请按“谁是卧底”当前流程自然推进群聊，并在需要时输出对应 action。';
}

function requestUndercoverAiStep(group, state) {
    if (!group || typeof window.generateAiReply !== 'function') return;
    const instruction = buildUndercoverAiNudgeInstruction(group, state);
    window.generateAiReply(instruction, group.id, { triggerSource: 'manual_undercover' });
}

function getGroupUndercoverPromptContext(groupInput) {
    const group = getUndercoverGroupContact(groupInput);
    if (!group) return '';
    const state = getUndercoverStateByGroup(group, false);
    if (!state || !state.active) return '';

    const aliveSet = new Set((state.aliveIds || []).map(id => String(id)));
    const voteByActorId = state.voteByActorId && typeof state.voteByActorId === 'object'
        ? state.voteByActorId
        : {};
    const voteLines = Object.keys(voteByActorId)
        .map((actorId) => {
            const targetId = String(voteByActorId[actorId] || '').trim();
            if (!targetId) return '';
            return `- ${getUndercoverPlayerName(state, actorId)}（${actorId}） -> ${getUndercoverPlayerName(state, targetId)}（${targetId}）`;
        })
        .filter(Boolean);

    const participantLines = (state.participants || []).map((player) => {
        const playerId = String(player.id);
        const isUndercover = Array.isArray(state.undercoverIds) && state.undercoverIds.includes(playerId);
        const role = isUndercover ? '卧底' : '平民';
        const word = isUndercover ? state.undercoverWord : state.civilianWord;
        const aliveText = aliveSet.has(playerId) ? '存活' : '出局';
        return `- speaker_contact_id=${playerId}｜名字=${player.name}｜状态=${aliveText}｜阵营=${role}｜词语=${word}`;
    });
    const clueConstraintLines = [];
    if (state.phase === UNDERCOVER_PHASE.clue) {
        const aliveWordLines = (state.participants || [])
            .filter(player => aliveSet.has(String(player && player.id)))
            .map((player) => {
                const playerId = String(player && player.id || '').trim();
                if (!playerId) return '';
                const isUndercover = Array.isArray(state.undercoverIds) && state.undercoverIds.includes(playerId);
                const word = isUndercover ? state.undercoverWord : state.civilianWord;
                return `- ${player.name}（speaker_contact_id=${playerId}）的线索应围绕词语「${word}」展开`;
            })
            .filter(Boolean);
        clueConstraintLines.push(
            '【线索阶段硬性规则】',
            '- 本轮是线索阶段：先输出线索发言，再考虑切换投票阶段。',
            '- 每位“存活玩家”至少输出 1 条线索发言；不能只让个别人说。',
            '- 每条线索必须与该发言人的词语强相关（用途/场景/外观/感受等），禁止明显跑题的日常闲聊。',
            '- 线索要“相关但不直说词语本体”，可模糊描述，但语义必须能让人联想到该词语。',
            '- 若你生成了与词语明显无关的句子，视为错误，请先重写再输出。',
            aliveWordLines.length > 0 ? aliveWordLines.join('\n') : '- 当前无存活玩家。'
        );
    }

    return [
        '【群内小游戏：谁是卧底】',
        `- 当前第 ${state.round} 局，阶段=${getUndercoverPhaseLabel(state.phase)}。`,
        '- 本局玩家（固定到本局结束）：',
        participantLines.join('\n'),
        clueConstraintLines.length > 0 ? clueConstraintLines.join('\n') : '',
        voteLines.length > 0 ? `- 当前投票记录：\n${voteLines.join('\n')}` : '- 当前还没有有效投票。',
        '- 可用 action：',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"START_UNDERCOVER_GAME","payload":{}}',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"UNDERCOVER_SWITCH_PHASE","payload":{"phase":"vote"}}',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"UNDERCOVER_VOTE","payload":{"target_member_id":"成员ID"}}',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"UNDERCOVER_SETTLE","payload":{}}',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"UNDERCOVER_NEXT_ROUND","payload":{}}',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"UNDERCOVER_END","payload":{}}',
        '- 游戏进行中时，可见消息要像真实群聊：成员之间互相接话、怀疑、辩解，不要只回复用户一人。'
    ].join('\n');
}

function beginUndercoverRound(options = {}) {
    const group = getUndercoverGroupContact();
    return beginUndercoverRoundForGroup(group, options);
}

function startUndercoverGame() {
    const group = getUndercoverGroupContact();
    if (!group) {
        const resultDiv = document.getElementById('mini-game-result');
        if (resultDiv) resultDiv.textContent = '“谁是卧底”仅支持群聊。';
        return;
    }
    const state = getUndercoverStateByGroup(group, true);
    const participants = Array.isArray(state && state.participants) ? state.participants : [];
    if (state && state.active && participants.length >= 3) {
        renderUndercoverGameBoard();
        return;
    }
    openUndercoverSetupFlow(group);
}

function revealUndercoverIdentity() {
    const group = getUndercoverGroupContact();
    if (!group) return;
    const state = getUndercoverStateByGroup(group, true);
    state.showAllWords = !state.showAllWords;
    renderUndercoverGameBoard();
}

function voteUndercoverTarget(targetId) {
    const group = getUndercoverGroupContact();
    if (!group) return;
    voteUndercoverTargetForGroup(group, 'me', targetId, { announce: false });
}

function settleUndercoverVote() {
    const group = getUndercoverGroupContact();
    if (!group) return;
    settleUndercoverVoteForGroup(group, { announce: true, actorId: 'me' });
}

function renderUndercoverGameBoard() {
    const content = document.getElementById('mini-game-content');
    const resultDiv = document.getElementById('mini-game-result');
    if (!content || !resultDiv) return;

    const group = getUndercoverGroupContact();
    if (!group) {
        content.innerHTML = `<div style="width:100%;padding:18px 12px 6px;text-align:center;"><div style="font-size:14px;color:#666;line-height:1.7;">“谁是卧底”仅支持群聊。</div></div>`;
        resultDiv.textContent = '';
        return;
    }

    const state = getUndercoverStateByGroup(group, true);
    const participants = Array.isArray(state.participants) ? state.participants : [];
    const aliveSet = new Set((state.aliveIds || []).map(id => String(id)));
    const tally = getUndercoverVoteTally(state);
    const phase = state.phase || UNDERCOVER_PHASE.idle;
    const isActive = !!state.active;
    const canVote = isActive && phase === UNDERCOVER_PHASE.vote;
    const selfIsParticipant = participants.some(player => String(player && player.id) === 'me');
    const selfAlive = aliveSet.has('me');
    const canUserVote = canVote && selfIsParticipant && selfAlive;
    const myVoteTargetId = String((state.voteByActorId && state.voteByActorId.me) || '').trim();

    if (!isActive || participants.length < 3) {
        content.innerHTML = `
            <div style="width:100%;padding:18px 12px 6px;text-align:center;">
                <div style="font-size:14px;color:#666;line-height:1.7;">点击开始后，AI 会按“线索 -> 投票 -> 结算”的流程在群里推进游戏。</div>
                <button id="undercover-start-btn" style="margin-top:14px;padding:10px 18px;border:none;border-radius:12px;background:#111;color:#fff;cursor:pointer;">开始谁是卧底</button>
            </div>
        `;
        resultDiv.textContent = state.statusText || '';
        const startBtn = document.getElementById('undercover-start-btn');
        if (startBtn) startBtn.addEventListener('click', () => openUndercoverSetupFlow(group));
        return;
    }

    const cardsHtml = participants.map((player) => {
        const playerId = String(player.id);
        const alive = aliveSet.has(playerId);
        const isUndercover = Array.isArray(state.undercoverIds) && state.undercoverIds.includes(playerId);
        const roleText = isUndercover ? '卧底' : '平民';
        const wordText = isUndercover ? state.undercoverWord : state.civilianWord;
        const canRevealRole = state.showAllWords || playerId === 'me' || phase === UNDERCOVER_PHASE.finished;
        const cardBg = alive ? '#fff' : '#f3f4f6';
        const cardColor = alive ? '#111' : '#9ca3af';
        const voteCount = Number(tally[playerId] || 0);
        return `
            <div style="border:1px solid ${alive ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.04)'};border-radius:12px;background:${cardBg};padding:10px 10px;text-align:left;display:flex;flex-direction:column;gap:4px;color:${cardColor};">
                <div style="font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:space-between;">
                    <span>${escapeMiniGameHtml(player.name)}${player.isSelf ? '（你）' : ''}</span>
                    <span style="font-size:11px;color:${alive ? '#10b981' : '#9ca3af'};">${alive ? '存活' : '出局'}</span>
                </div>
                <div style="font-size:12px;color:#6b7280;">${canRevealRole ? `身份：${roleText} ｜词语：${escapeMiniGameHtml(wordText)}` : '身份和词语已隐藏'}</div>
                <div style="font-size:11px;color:#9ca3af;">当前票数：${voteCount}</div>
            </div>
        `;
    }).join('');

    const voteButtonsHtml = participants
        .filter(player => aliveSet.has(String(player.id)) && String(player.id) !== 'me')
        .map((player) => `
            <button type="button" data-undercover-user-vote="${escapeMiniGameHtml(String(player.id))}" style="border:none;border-radius:10px;background:${String(player.id) === myVoteTargetId ? '#111' : '#f3f4f6'};color:${String(player.id) === myVoteTargetId ? '#fff' : '#111'};padding:8px 10px;font-size:12px;cursor:pointer;">
                投给 ${escapeMiniGameHtml(player.name)}
            </button>
        `)
        .join('');

    const myRoleUndercover = Array.isArray(state.undercoverIds) && state.undercoverIds.includes('me');
    const myWord = myRoleUndercover ? state.undercoverWord : state.civilianWord;
    const identityLineHtml = selfIsParticipant
        ? `<div style="margin-top:4px;">你的身份：${myRoleUndercover ? '卧底' : '平民'} ｜ 你的词语：${escapeMiniGameHtml(myWord || '')}</div>`
        : '<div style="margin-top:4px;color:#64748b;">观战模式：你未参与本局，仅可旁观并推进流程。</div>';
    const phaseBg = phase === UNDERCOVER_PHASE.vote ? '#fff7ed' : (phase === UNDERCOVER_PHASE.finished ? '#f3f4f6' : '#ecfeff');

    content.innerHTML = `
        <div style="width:100%;display:flex;flex-direction:column;gap:12px;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div style="font-size:12px;color:#6b7280;">第 ${state.round} 局 · 存活 ${aliveSet.size}/${participants.length}</div>
                <button type="button" id="undercover-toggle-words-btn" style="border:none;border-radius:10px;background:${state.showAllWords ? '#111' : '#f3f4f6'};color:${state.showAllWords ? '#fff' : '#111'};padding:7px 10px;font-size:12px;cursor:pointer;">
                    ${state.showAllWords ? '隐藏全员词语' : '显示全员词语'}
                </button>
            </div>

            <div style="padding:10px;border-radius:12px;background:${phaseBg};border:1px solid rgba(15,23,42,0.06);font-size:12px;line-height:1.6;color:#334155;">
                <div>当前流程：<strong>${getUndercoverPhaseLabel(phase)}</strong></div>
                ${identityLineHtml}
            </div>

            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;">${cardsHtml}</div>

            ${canUserVote ? `<div style="padding-top:2px;display:flex;flex-wrap:wrap;gap:8px;">${voteButtonsHtml || '<div style="font-size:12px;color:#9ca3af;">暂无可投票目标</div>'}</div>` : ''}

            <div style="display:flex;gap:8px;">
                <button type="button" id="undercover-main-flow-btn" style="flex:1;border:none;border-radius:12px;background:#111;color:#fff;padding:10px 12px;font-size:13px;cursor:pointer;">
                    ${phase === UNDERCOVER_PHASE.clue ? '进入投票阶段' : (phase === UNDERCOVER_PHASE.vote ? '结算本轮投票' : '新一局')}
                </button>
                <button type="button" id="undercover-ai-step-btn" style="flex:1;border:none;border-radius:12px;background:#f3f4f6;color:#111;padding:10px 12px;font-size:13px;cursor:pointer;">
                    推进游戏
                </button>
            </div>
            <button type="button" id="undercover-end-btn" style="border:none;border-radius:12px;background:#f9fafb;color:#6b7280;padding:9px 12px;font-size:12px;cursor:pointer;">结束游戏</button>
        </div>
    `;

    resultDiv.textContent = state.statusText || '进行中';
    resultDiv.style.color = phase === UNDERCOVER_PHASE.finished ? '#111' : '#666';
    resultDiv.style.fontWeight = phase === UNDERCOVER_PHASE.finished ? '700' : '600';

    const toggleWordsBtn = document.getElementById('undercover-toggle-words-btn');
    if (toggleWordsBtn) {
        toggleWordsBtn.addEventListener('click', () => {
            state.showAllWords = !state.showAllWords;
            renderUndercoverGameBoard();
        });
    }

    content.querySelectorAll('[data-undercover-user-vote]').forEach((button) => {
        button.addEventListener('click', () => voteUndercoverTargetForGroup(group, 'me', button.dataset.undercoverUserVote, { announce: false }));
    });

    const flowBtn = document.getElementById('undercover-main-flow-btn');
    if (flowBtn) {
        flowBtn.addEventListener('click', () => {
            if (phase === UNDERCOVER_PHASE.clue) {
                switchUndercoverPhaseForGroup(group, UNDERCOVER_PHASE.vote, { announce: true, actorId: 'me' });
                return;
            }
            if (phase === UNDERCOVER_PHASE.vote) {
                settleUndercoverVoteForGroup(group, { announce: true, actorId: 'me' });
                return;
            }
            beginUndercoverRoundForGroup(group, { announce: true, actorId: 'me' });
        });
    }

    const aiStepBtn = document.getElementById('undercover-ai-step-btn');
    if (aiStepBtn) aiStepBtn.addEventListener('click', () => requestUndercoverAiStep(group, state));

    const endBtn = document.getElementById('undercover-end-btn');
    if (endBtn) endBtn.addEventListener('click', () => endUndercoverGameForGroup(group, { announce: true, actorId: 'me' }));
}

// --- Turtle Soup group flow ---

function getTurtleSoupGroupContact(contactOrId = null) {
    return getUndercoverGroupContact(contactOrId);
}

function getTurtleSoupStateKey(group) {
    return String(group && group.id || '').trim();
}

function createEmptyTurtleSoupState(groupId) {
    return {
        groupId: String(groupId || ''),
        gameId: '',
        active: false,
        round: 0,
        phase: TURTLE_SOUP_PHASE.idle,
        participants: [],
        hostId: '',
        caseSource: 'preset',
        caseGenre: '',
        caseRequirement: '',
        caseTitle: '',
        caseQuestion: '',
        caseAnswer: '',
        caseHints: [],
        qaLog: [],
        setupSource: 'preset',
        setupGenre: '微恐',
        setupExtraRequirement: '',
        setupAiGenerating: false,
        statusText: '',
        updatedAt: Date.now()
    };
}

function getTurtleSoupStateByGroup(group, createIfMissing = true) {
    const key = getTurtleSoupStateKey(group);
    if (!key) return null;
    if (!turtleSoupStateByGroup[key] && createIfMissing) {
        turtleSoupStateByGroup[key] = createEmptyTurtleSoupState(key);
    }
    return turtleSoupStateByGroup[key] || null;
}

function getTurtleSoupParticipants(groupInput = null) {
    const group = getTurtleSoupGroupContact(groupInput);
    if (!group) return [];
    const participants = [];
    const seen = new Set();
    const appendById = (participantId) => {
        const safeId = String(participantId || '').trim();
        if (!safeId || seen.has(safeId)) return;
        seen.add(safeId);
        participants.push({
            id: safeId,
            name: getUndercoverParticipantName(group, safeId),
            isSelf: safeId === 'me'
        });
    };
    appendById('me');
    if (typeof window.getGroupMemberContacts === 'function') {
        const members = window.getGroupMemberContacts(group) || [];
        members.forEach((member) => {
            if (!member || member.id === undefined || member.id === null) return;
            appendById(member.id);
        });
    }
    return participants;
}

function getRandomTurtleSoupCase() {
    if (!Array.isArray(TURTLE_SOUP_CASES) || TURTLE_SOUP_CASES.length === 0) {
        return {
            title: '默认汤面',
            question: '有个人做了一件看似奇怪的事，但其实是在救人。为什么？',
            answer: '当时现场有隐患，他的行为是在排除风险。',
            hints: ['不是恶作剧', '与安全有关']
        };
    }
    const randomIndex = Math.floor(Math.random() * TURTLE_SOUP_CASES.length);
    const item = TURTLE_SOUP_CASES[randomIndex] || TURTLE_SOUP_CASES[0];
    return {
        title: String(item.title || '海龟汤').trim() || '海龟汤',
        question: String(item.question || '').trim(),
        answer: String(item.answer || '').trim(),
        hints: Array.isArray(item.hints)
            ? item.hints.map(text => String(text || '').trim()).filter(Boolean)
            : []
    };
}

function normalizeTurtleSoupCaseData(rawCase, fallbackTitle = 'AI海龟汤') {
    const source = rawCase && typeof rawCase === 'object' ? rawCase : {};
    const title = String(source.title || source.name || fallbackTitle || 'AI海龟汤').trim() || 'AI海龟汤';
    const question = String(source.question || source.soup || source.surface || '').trim();
    const answer = String(source.answer || source.bottom || source.solution || '').trim();
    const hintsRaw = Array.isArray(source.hints)
        ? source.hints
        : (Array.isArray(source.tips) ? source.tips : []);
    const hints = hintsRaw
        .map(item => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 5);
    if (!question || !answer) return null;
    return {
        title,
        question,
        answer,
        hints
    };
}

function getTurtleSoupAiSettings() {
    const simState = window.iphoneSimState || {};
    const primary = simState.aiSettings || {};
    const fallback = simState.aiSettings2 || {};
    const settings = primary && primary.url ? primary : fallback;
    if (!settings || !settings.url || !settings.key) return null;
    return settings;
}

function buildTurtleSoupChatCompletionsUrl(url) {
    const base = String(url || '').trim();
    if (!base) return '';
    if (base.endsWith('/chat/completions')) return base;
    return base.endsWith('/') ? `${base}chat/completions` : `${base}/chat/completions`;
}

function extractFirstJsonObjectFromText(rawText) {
    const text = String(rawText || '').trim();
    if (!text) return null;
    const fenceMatched = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidateList = [];
    if (fenceMatched && fenceMatched[1]) candidateList.push(fenceMatched[1].trim());
    candidateList.push(text);
    for (const candidate of candidateList) {
        if (!candidate) continue;
        try {
            return JSON.parse(candidate);
        } catch (error) {}
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start >= 0 && end > start) {
            const fragment = candidate.slice(start, end + 1);
            try {
                return JSON.parse(fragment);
            } catch (error) {}
        }
    }
    return null;
}

async function requestTurtleSoupCaseFromAi(options = {}) {
    const settings = getTurtleSoupAiSettings();
    if (!settings) {
        return { ok: false, reason: 'missing_settings', message: '请先在设置中配置 AI API' };
    }
    const genre = String(options.genre || '').trim() || '微恐';
    const requirement = String(options.requirement || '').trim();
    const requestTimeoutMs = 45000;
    const fetchUrl = buildTurtleSoupChatCompletionsUrl(settings.url);
    if (!fetchUrl) {
        return { ok: false, reason: 'invalid_url', message: 'AI API 地址无效' };
    }

    const systemPrompt = [
        '你是一个“海龟汤题目生成器”。',
        '你的唯一任务是生成 1 组高质量海龟汤：汤面(question) + 汤底(answer) + hints。',
        '输出必须是 JSON 对象，且只能输出 JSON，不要输出任何额外解释和 markdown。',
        'JSON 格式：{"title":"标题","question":"汤面","answer":"汤底","hints":["提示1","提示2","提示3"]}',
        '要求：',
        '- question 要有悬念，但不能直接暴露答案；不超过 80 字。',
        '- answer 逻辑完整、可复盘；不超过 140 字。',
        '- hints 提供 2~4 条渐进式提示，不能直接泄底。',
        '- 内容要适合群聊推理，不涉及极端血腥和违规内容。'
    ].join('\n');

    const userPrompt = [
        `题材倾向：${genre}`,
        requirement ? `额外要求：${requirement}` : '',
        '请开始生成。'
    ].filter(Boolean).join('\n');

    const cleanKey = String(settings.key || '').replace(/[^\x00-\x7F]/g, '').trim();
    const requestController = typeof AbortController === 'function' ? new AbortController() : null;
    const requestTimeout = requestController
        ? setTimeout(() => {
            try {
                requestController.abort();
            } catch (abortError) {}
        }, requestTimeoutMs)
        : null;

    try {
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
                    { role: 'user', content: userPrompt }
                ],
                temperature: Number.isFinite(Number(settings.temperature))
                    ? Number(settings.temperature)
                    : 0.8
            }),
            signal: requestController ? requestController.signal : undefined
        });

        if (!response.ok) {
            return { ok: false, reason: 'http_error', message: `AI 请求失败（${response.status}）` };
        }
        const data = await response.json();
        const content = String(
            data
            && data.choices
            && data.choices[0]
            && data.choices[0].message
            && data.choices[0].message.content
            || ''
        ).trim();
        if (!content) {
            return { ok: false, reason: 'empty_content', message: 'AI 没有返回有效题目' };
        }

        const parsed = extractFirstJsonObjectFromText(content);
        const caseData = normalizeTurtleSoupCaseData(parsed, `${genre}海龟汤`);
        if (!caseData) {
            return { ok: false, reason: 'invalid_json', message: 'AI 返回格式异常，无法解析题目' };
        }
        return { ok: true, caseData };
    } catch (error) {
        if (requestController && requestController.signal && requestController.signal.aborted) {
            return { ok: false, reason: 'timeout', message: 'AI 出题超时，请重试' };
        }
        return { ok: false, reason: 'request_error', message: error && error.message ? error.message : 'AI 出题失败' };
    } finally {
        if (requestTimeout) clearTimeout(requestTimeout);
    }
}

function normalizeTurtleSoupVerdict(rawVerdict) {
    const value = String(rawVerdict || '').trim().toLowerCase();
    if (!value) return '无关';
    if (['yes', '是', '对', '正确', '有关'].includes(value)) return '是';
    if (['no', '否', '不', '错误', '无关'].includes(value)) return '否';
    if (['irrelevant', '无关', '关系不大'].includes(value)) return '无关';
    if (['close', '接近', '差一点', 'almost'].includes(value)) return '接近';
    if (['unknown', '不知道', '不确定'].includes(value)) return '不知道';
    return rawVerdict;
}

function pushTurtleSoupSystemMessage(group, text) {
    if (!group || !text || typeof window.sendMessage !== 'function') return null;
    return window.sendMessage(`[系统消息]: 海龟汤｜${text}`, false, 'text', null, group.id, {
        ignoreReplyingState: true,
        bypassWechatBlock: true,
        showNotification: false
    });
}

function beginTurtleSoupRoundForGroup(groupInput, options = {}) {
    const group = getTurtleSoupGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const state = getTurtleSoupStateByGroup(group, true);
    const participants = getTurtleSoupParticipants(group);
    if (participants.length < 3) {
        state.active = false;
        state.phase = TURTLE_SOUP_PHASE.idle;
        state.participants = participants;
        state.statusText = '至少需要 3 名玩家（含你）才能开始。';
        state.setupAiGenerating = false;
        state.updatedAt = Date.now();
        renderTurtleSoupGameBoard();
        return { ok: false, reason: 'not_enough_players', state };
    }

    const injectedCase = normalizeTurtleSoupCaseData(options.caseData, `${options.genre || ''}海龟汤`);
    const selectedCase = injectedCase || getRandomTurtleSoupCase();
    const caseSource = injectedCase ? 'ai' : 'preset';
    const caseGenre = String(options.genre || state.setupGenre || '').trim();
    const caseRequirement = String(options.requirement || state.setupExtraRequirement || '').trim();
    const aiCandidates = participants.filter(player => String(player.id) !== 'me');
    const host = aiCandidates[Math.floor(Math.random() * aiCandidates.length)] || participants[0];

    state.active = true;
    state.round = Number(state.round || 0) + 1;
    state.phase = TURTLE_SOUP_PHASE.questioning;
    state.gameId = `turtle_soup_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    state.participants = participants;
    state.hostId = String(host && host.id || 'me');
    state.caseSource = caseSource;
    state.caseGenre = caseGenre;
    state.caseRequirement = caseRequirement;
    state.caseTitle = selectedCase.title || `第 ${state.round} 局海龟汤`;
    state.caseQuestion = selectedCase.question || '';
    state.caseAnswer = selectedCase.answer || '';
    state.caseHints = selectedCase.hints || [];
    state.qaLog = [];
    state.setupAiGenerating = false;
    state.statusText = `第 ${state.round} 局开始：先提问，再推理，最后揭晓答案。`;
    state.updatedAt = Date.now();

    if (options.announce) {
        const hostName = getUndercoverParticipantName(group, state.hostId);
        const sourceText = caseSource === 'ai'
            ? `（AI出题${caseGenre ? `｜${caseGenre}` : ''}${caseRequirement ? `｜${caseRequirement}` : ''}）`
            : '（题库随机）';
        pushTurtleSoupSystemMessage(
            group,
            `${hostName} 发起了「海龟汤」${sourceText}：${state.caseQuestion || state.caseTitle}`
        );
    }

    renderTurtleSoupGameBoard();
    return { ok: true, changed: true, state };
}

async function startTurtleSoupRoundWithAiCase(groupInput, options = {}) {
    const group = getTurtleSoupGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const state = getTurtleSoupStateByGroup(group, true);
    if (state.setupAiGenerating) return { ok: false, reason: 'busy' };

    const participants = getTurtleSoupParticipants(group);
    if (participants.length < 3) {
        state.active = false;
        state.phase = TURTLE_SOUP_PHASE.idle;
        state.participants = participants;
        state.statusText = '至少需要 3 名玩家（含你）才能开始。';
        state.setupAiGenerating = false;
        state.updatedAt = Date.now();
        renderTurtleSoupGameBoard();
        return { ok: false, reason: 'not_enough_players', state };
    }

    const genre = String(options.genre || state.setupGenre || '微恐').trim() || '微恐';
    const requirement = String(options.requirement || state.setupExtraRequirement || '').trim();
    state.setupAiGenerating = true;
    state.statusText = `AI 正在生成「${genre}」海龟汤...`;
    state.updatedAt = Date.now();
    renderTurtleSoupGameBoard();

    const generated = await requestTurtleSoupCaseFromAi({ genre, requirement });
    state.setupAiGenerating = false;
    state.updatedAt = Date.now();
    if (!generated || !generated.ok || !generated.caseData) {
        state.statusText = generated && generated.message ? `AI 出题失败：${generated.message}` : 'AI 出题失败，请重试';
        renderTurtleSoupGameBoard();
        return { ok: false, reason: generated && generated.reason ? generated.reason : 'ai_generate_failed', state };
    }

    return beginTurtleSoupRoundForGroup(group, {
        announce: options.announce,
        actorId: options.actorId,
        caseData: generated.caseData,
        genre,
        requirement
    });
}

function appendTurtleSoupQaLogForGroup(groupInput, actorId, payload = {}, options = {}) {
    const group = getTurtleSoupGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const state = getTurtleSoupStateByGroup(group, false);
    if (!state || !state.active) return { ok: false, reason: 'not_active' };
    if (state.phase !== TURTLE_SOUP_PHASE.questioning) return { ok: false, reason: 'not_questioning_phase' };

    const actorKey = String(
        (typeof window.resolveGroupSpeakerContactId === 'function'
            ? window.resolveGroupSpeakerContactId(actorId, group)
            : actorId) || ''
    ).trim() || String(actorId || '').trim();
    const source = payload && typeof payload === 'object' ? payload : {};

    const question = String(
        source.question
        || source.ask
        || source.ask_text
        || source.question_text
        || source.content
        || ''
    ).trim();
    const askerId = String(
        source.asker_member_id
        || source.askerMemberId
        || source.target_member_id
        || source.targetMemberId
        || source.member_id
        || source.memberId
        || source.asker_id
        || source.askerId
        || ''
    ).trim() || 'me';
    const verdictRaw = String(
        source.verdict
        || source.reply
        || source.result
        || source.answer
        || '无关'
    ).trim();
    const verdict = normalizeTurtleSoupVerdict(verdictRaw);
    const hint = String(source.hint || source.tip || '').trim();
    if (!question) return { ok: false, reason: 'empty_question' };

    const qaItem = {
        id: `qa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        askerId,
        question,
        responderId: actorKey || state.hostId || 'me',
        verdict,
        hint,
        createdAt: Date.now()
    };
    if (!Array.isArray(state.qaLog)) state.qaLog = [];
    state.qaLog.push(qaItem);
    if (state.qaLog.length > 30) {
        state.qaLog = state.qaLog.slice(-30);
    }
    state.statusText = `${getUndercoverParticipantName(group, qaItem.responderId)} 已回复问题。`;
    state.updatedAt = Date.now();

    if (options.announce) {
        const askerName = getUndercoverParticipantName(group, qaItem.askerId);
        const responderName = getUndercoverParticipantName(group, qaItem.responderId);
        const hintText = qaItem.hint ? `｜提示：${qaItem.hint}` : '';
        pushTurtleSoupSystemMessage(
            group,
            `${responderName} 回答了 ${askerName} 的问题：${qaItem.question} → ${qaItem.verdict}${hintText}`
        );
    }

    renderTurtleSoupGameBoard();
    return { ok: true, changed: true, state };
}

function revealTurtleSoupAnswerForGroup(groupInput, options = {}) {
    const group = getTurtleSoupGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const state = getTurtleSoupStateByGroup(group, false);
    if (!state || !state.active) return { ok: false, reason: 'not_active' };
    state.phase = TURTLE_SOUP_PHASE.revealed;
    state.statusText = '本局已揭晓答案。';
    state.updatedAt = Date.now();
    if (options.announce) {
        pushTurtleSoupSystemMessage(group, `答案揭晓：${state.caseAnswer || '（无）'}`);
    }
    renderTurtleSoupGameBoard();
    return { ok: true, changed: true, state };
}

function endTurtleSoupGameForGroup(groupInput, options = {}) {
    const group = getTurtleSoupGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const state = getTurtleSoupStateByGroup(group, false);
    if (!state) return { ok: false, reason: 'not_found' };
    if (!state.active && state.phase === TURTLE_SOUP_PHASE.idle) return { ok: true, changed: false, state };
    state.active = false;
    state.phase = TURTLE_SOUP_PHASE.idle;
    state.setupAiGenerating = false;
    state.statusText = '海龟汤已结束。';
    state.updatedAt = Date.now();
    if (options.announce) {
        const actorName = options.actorId ? getUndercoverParticipantName(group, options.actorId) : '群成员';
        pushTurtleSoupSystemMessage(group, `${actorName} 结束了「海龟汤」。`);
    }
    renderTurtleSoupGameBoard();
    return { ok: true, changed: true, state };
}

function buildTurtleSoupAiNudgeInstruction(group, state) {
    if (!state || !state.active) {
        return '群里想玩“海龟汤”。请先自然聊天，再用 action START_TURTLE_SOUP_GAME 发起一局。';
    }
    if (state.phase === TURTLE_SOUP_PHASE.questioning) {
        return '当前是“海龟汤”提问阶段。请让成员围绕汤面提出是/否型问题，主持人用 action TURTLE_SOUP_REPLY 回答（是/否/无关/接近+提示）；暂时不要直接公布标准答案。';
    }
    if (state.phase === TURTLE_SOUP_PHASE.revealed) {
        return '当前是“海龟汤”复盘阶段。先讨论谜底与推理过程，再选择 TURTLE_SOUP_NEXT_ROUND 或 TURTLE_SOUP_END。';
    }
    return '请按“海龟汤”当前流程自然推进群聊，并在需要时输出对应 action。';
}

function requestTurtleSoupAiStep(group, state) {
    if (!group || typeof window.generateAiReply !== 'function') return;
    const instruction = buildTurtleSoupAiNudgeInstruction(group, state);
    window.generateAiReply(instruction, group.id, { triggerSource: 'manual_turtle_soup' });
}

function applyTurtleSoupGameAction(groupInput, actorId, command, payload = {}, options = {}) {
    const group = getTurtleSoupGroupContact(groupInput);
    if (!group) return { ok: false, reason: 'not_group' };
    const normalizedCommand = String(command || '').trim().toUpperCase();
    if (!TURTLE_SOUP_ACTION_COMMANDS.has(normalizedCommand)) {
        return { ok: false, reason: 'unsupported_command' };
    }

    const resolvedActorId = typeof window.resolveGroupSpeakerContactId === 'function'
        ? window.resolveGroupSpeakerContactId(actorId, group) || String(actorId || '').trim()
        : String(actorId || '').trim();
    const actorKey = String(resolvedActorId || '').trim();
    const announce = !!options.showNotice;

    if (normalizedCommand === 'START_TURTLE_SOUP_GAME' || normalizedCommand === 'TURTLE_SOUP_NEXT_ROUND') {
        return beginTurtleSoupRoundForGroup(group, { announce, actorId: actorKey || 'me' });
    }
    if (normalizedCommand === 'TURTLE_SOUP_REPLY') {
        return appendTurtleSoupQaLogForGroup(group, actorKey || 'me', payload, { announce });
    }
    if (normalizedCommand === 'TURTLE_SOUP_REVEAL') {
        return revealTurtleSoupAnswerForGroup(group, { announce, actorId: actorKey || 'me' });
    }
    if (normalizedCommand === 'TURTLE_SOUP_END') {
        return endTurtleSoupGameForGroup(group, { announce, actorId: actorKey || 'me' });
    }
    return { ok: false, reason: 'unhandled' };
}

function getTurtleSoupPhaseLabel(phase) {
    if (phase === TURTLE_SOUP_PHASE.questioning) return '提问阶段';
    if (phase === TURTLE_SOUP_PHASE.revealed) return '揭晓阶段';
    return '待开始';
}

function getGroupTurtleSoupPromptContext(groupInput) {
    const group = getTurtleSoupGroupContact(groupInput);
    if (!group) return '';
    const state = getTurtleSoupStateByGroup(group, false);
    if (!state || !state.active) return '';

    const participantLines = (state.participants || []).map((player) => (
        `- speaker_contact_id=${player.id}｜名字=${player.name}${String(player.id) === String(state.hostId) ? '｜当前主持人=是' : ''}`
    ));
    const qaLines = Array.isArray(state.qaLog)
        ? state.qaLog.slice(-12).map((item) => {
            const askerName = getUndercoverParticipantName(group, item.askerId);
            const responderName = getUndercoverParticipantName(group, item.responderId);
            const hintText = item.hint ? `｜提示=${item.hint}` : '';
            return `- ${askerName} 问：${item.question}｜${responderName} 答：${item.verdict}${hintText}`;
        })
        : [];
    const hints = Array.isArray(state.caseHints) ? state.caseHints : [];
    const hintsText = hints.length > 0 ? hints.map(h => `- ${h}`).join('\n') : '- 无';

    return [
        '【群内小游戏：海龟汤】',
        `- 当前第 ${state.round} 局，阶段=${getTurtleSoupPhaseLabel(state.phase)}。`,
        `- 出题来源：${state.caseSource === 'ai' ? 'AI生成' : '题库随机'}${state.caseGenre ? `｜题材=${state.caseGenre}` : ''}${state.caseRequirement ? `｜要求=${state.caseRequirement}` : ''}`,
        `- 当前主持人：speaker_contact_id=${state.hostId}｜名字=${getUndercoverParticipantName(group, state.hostId)}。`,
        `- 汤面题目：${state.caseQuestion || state.caseTitle || '（无）'}`,
        `- 标准答案（仅供你内部推理，提问阶段严禁直接明说给群里）：${state.caseAnswer || '（无）'}`,
        `- 可用提示：\n${hintsText}`,
        '- 参与成员：',
        participantLines.join('\n'),
        qaLines.length > 0 ? `- 最近问答记录：\n${qaLines.join('\n')}` : '- 当前暂无问答记录。',
        '【海龟汤规则】',
        '- 提问阶段：可见消息里不要直接泄露标准答案，只能给线索、提问和推理互动。',
        '- 主持人回答提问时，尽量输出 action TURTLE_SOUP_REPLY 记录问题与回答（是/否/无关/接近）。',
        '- 当你判断群里已经接近真相时，可输出 TURTLE_SOUP_REVEAL 揭晓；揭晓后可 TURTLE_SOUP_NEXT_ROUND 或 TURTLE_SOUP_END。',
        '- 可用 action：',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"START_TURTLE_SOUP_GAME","payload":{}}',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"TURTLE_SOUP_REPLY","payload":{"asker_member_id":"成员ID","question":"问题","verdict":"是|否|无关|接近","hint":"可选提示"}}',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"TURTLE_SOUP_REVEAL","payload":{}}',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"TURTLE_SOUP_NEXT_ROUND","payload":{}}',
        '- {"type":"action","speaker_contact_id":"成员ID","command":"TURTLE_SOUP_END","payload":{}}'
    ].join('\n');
}

function startTurtleSoupGame() {
    const group = getTurtleSoupGroupContact();
    const resultDiv = document.getElementById('mini-game-result');
    if (!group) {
        if (resultDiv) resultDiv.textContent = '“海龟汤”仅支持群聊。';
        return;
    }
    const state = getTurtleSoupStateByGroup(group, true);
    if (state) {
        state.setupAiGenerating = false;
    }
    renderTurtleSoupGameBoard();
}

function renderTurtleSoupGameBoard() {
    const content = document.getElementById('mini-game-content');
    const resultDiv = document.getElementById('mini-game-result');
    if (!content || !resultDiv) return;

    const group = getTurtleSoupGroupContact();
    if (!group) {
        content.innerHTML = `<div style="width:100%;padding:18px 12px 6px;text-align:center;"><div style="font-size:14px;color:#666;line-height:1.7;">“海龟汤”仅支持群聊。</div></div>`;
        resultDiv.textContent = '';
        return;
    }

    const state = getTurtleSoupStateByGroup(group, true);
    const participants = Array.isArray(state.participants) ? state.participants : [];

    if (!state.active || !state.caseQuestion) {
        const setupSource = state.setupSource === 'ai' ? 'ai' : 'preset';
        const selectedGenre = String(state.setupGenre || '微恐').trim() || '微恐';
        const extraRequirement = String(state.setupExtraRequirement || '').trim();
        const aiGenerating = !!state.setupAiGenerating;
        const genreOptions = ['恐怖', '微恐', '搞笑', '悬疑', '脑洞', '治愈'];
        const genreButtonsHtml = genreOptions.map((genre) => {
            const selected = genre === selectedGenre;
            return `
                <button type="button" data-turtle-genre="${escapeMiniGameHtml(genre)}" style="border:${selected ? '1px solid #111' : '1px solid rgba(0,0,0,0.08)'};border-radius:999px;background:${selected ? '#111' : '#fff'};color:${selected ? '#fff' : '#111'};padding:6px 10px;font-size:12px;cursor:pointer;">
                    ${escapeMiniGameHtml(genre)}
                </button>
            `;
        }).join('');

        content.innerHTML = `
            <div style="width:100%;padding:10px 8px 4px;display:flex;flex-direction:column;gap:10px;">
                <div style="font-size:14px;color:#111;font-weight:600;">开局设置</div>
                <div style="font-size:12px;color:#6b7280;line-height:1.6;">你可以先选出题方式。若选择 AI 出题，可指定题材与额外要求（如恐怖、微恐、搞笑）。</div>
                <div style="display:flex;gap:8px;">
                    <button type="button" id="turtle-source-preset-btn" style="flex:1;border:${setupSource === 'preset' ? '1px solid #111' : '1px solid rgba(0,0,0,0.08)'};border-radius:12px;background:${setupSource === 'preset' ? '#111' : '#fff'};color:${setupSource === 'preset' ? '#fff' : '#111'};padding:9px 10px;font-size:12px;cursor:pointer;">
                        题库随机
                    </button>
                    <button type="button" id="turtle-source-ai-btn" style="flex:1;border:${setupSource === 'ai' ? '1px solid #111' : '1px solid rgba(0,0,0,0.08)'};border-radius:12px;background:${setupSource === 'ai' ? '#111' : '#fff'};color:${setupSource === 'ai' ? '#fff' : '#111'};padding:9px 10px;font-size:12px;cursor:pointer;">
                        AI 出题
                    </button>
                </div>
                ${setupSource === 'ai' ? `
                    <div style="display:flex;flex-direction:column;gap:8px;padding:10px;border-radius:12px;background:#f8fafc;border:1px solid rgba(15,23,42,0.06);">
                        <div style="font-size:12px;color:#6b7280;">题材</div>
                        <div style="display:flex;flex-wrap:wrap;gap:6px;">${genreButtonsHtml}</div>
                        <div style="font-size:12px;color:#6b7280;">额外要求（可选）</div>
                        <textarea id="turtle-soup-extra-requirement" maxlength="120" placeholder="例如：反转强一点、校园场景、不要太黑暗" style="display:block;width:100%;min-height:72px !important;height:72px !important;box-sizing:border-box;border:1px solid rgba(0,0,0,0.08) !important;border-radius:12px !important;padding:10px 12px !important;font-size:13px !important;line-height:1.45 !important;outline:none;resize:none;background:#fff;">${escapeMiniGameHtml(extraRequirement)}</textarea>
                    </div>
                ` : ''}
                <button id="turtle-soup-start-btn" ${aiGenerating ? 'disabled' : ''} style="align-self:stretch;padding:10px 16px;border:none;border-radius:12px;background:#111;color:#fff;cursor:${aiGenerating ? 'not-allowed' : 'pointer'};opacity:${aiGenerating ? '0.65' : '1'};">
                    ${aiGenerating ? 'AI 出题中...' : (setupSource === 'ai' ? 'AI 出题并开局' : '开始海龟汤')}
                </button>
            </div>
        `;

        resultDiv.textContent = state.statusText || '';

        const sourcePresetBtn = document.getElementById('turtle-source-preset-btn');
        if (sourcePresetBtn) {
            sourcePresetBtn.addEventListener('click', () => {
                if (state.setupAiGenerating) return;
                state.setupSource = 'preset';
                renderTurtleSoupGameBoard();
            });
        }

        const sourceAiBtn = document.getElementById('turtle-source-ai-btn');
        if (sourceAiBtn) {
            sourceAiBtn.addEventListener('click', () => {
                if (state.setupAiGenerating) return;
                state.setupSource = 'ai';
                renderTurtleSoupGameBoard();
            });
        }

        content.querySelectorAll('[data-turtle-genre]').forEach((button) => {
            button.addEventListener('click', () => {
                if (state.setupAiGenerating) return;
                const genre = String(button.dataset.turtleGenre || '').trim();
                if (!genre) return;
                state.setupGenre = genre;
                renderTurtleSoupGameBoard();
            });
        });

        const startBtn = document.getElementById('turtle-soup-start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (state.setupAiGenerating) return;
                const inputEl = document.getElementById('turtle-soup-extra-requirement');
                if (inputEl) {
                    state.setupExtraRequirement = String(inputEl.value || '').trim();
                }
                if (state.setupSource === 'ai') {
                    startTurtleSoupRoundWithAiCase(group, {
                        announce: true,
                        actorId: 'me',
                        genre: state.setupGenre,
                        requirement: state.setupExtraRequirement
                    });
                    return;
                }
                beginTurtleSoupRoundForGroup(group, { announce: true, actorId: 'me' });
            });
        }
        return;
    }

    const phase = state.phase || TURTLE_SOUP_PHASE.idle;
    const hostName = getUndercoverParticipantName(group, state.hostId || 'me');
    const qaList = Array.isArray(state.qaLog) ? state.qaLog.slice(-8) : [];
    const qaHtml = qaList.length > 0
        ? qaList.map((item) => {
            const askerName = getUndercoverParticipantName(group, item.askerId);
            const responderName = getUndercoverParticipantName(group, item.responderId);
            return `
                <div style="padding:8px 10px;border-radius:10px;background:#f8fafc;border:1px solid rgba(15,23,42,0.06);display:flex;flex-direction:column;gap:4px;">
                    <div style="font-size:12px;color:#374151;">${escapeMiniGameHtml(askerName)} 问：${escapeMiniGameHtml(item.question || '')}</div>
                    <div style="font-size:12px;color:#111;">${escapeMiniGameHtml(responderName)} 答：${escapeMiniGameHtml(item.verdict || '')}${item.hint ? ` ｜提示：${escapeMiniGameHtml(item.hint)}` : ''}</div>
                </div>
            `;
        }).join('')
        : '<div style="font-size:12px;color:#9ca3af;text-align:center;padding:8px 0;">暂无问答记录</div>';

    const answerHtml = phase === TURTLE_SOUP_PHASE.revealed
        ? `<div style="padding:10px;border-radius:12px;background:#ecfeff;border:1px solid rgba(15,23,42,0.06);font-size:12px;color:#0f172a;line-height:1.6;">答案：${escapeMiniGameHtml(state.caseAnswer || '（无）')}</div>`
        : '<div style="padding:10px;border-radius:12px;background:#f9fafb;border:1px solid rgba(15,23,42,0.06);font-size:12px;color:#6b7280;line-height:1.6;">答案暂未揭晓，请在群聊中继续提问推理。</div>';

    content.innerHTML = `
        <div style="width:100%;display:flex;flex-direction:column;gap:10px;">
            <div style="font-size:12px;color:#6b7280;">第 ${state.round} 局 · ${getTurtleSoupPhaseLabel(phase)} · 参与 ${participants.length} 人</div>
            <div style="padding:10px;border-radius:12px;background:#fff7ed;border:1px solid rgba(15,23,42,0.06);font-size:12px;color:#334155;line-height:1.6;">
                <div>主持人：<strong>${escapeMiniGameHtml(hostName)}</strong></div>
                <div style="margin-top:4px;">汤面：${escapeMiniGameHtml(state.caseQuestion || '')}</div>
            </div>
            ${answerHtml}
            <div style="display:flex;flex-direction:column;gap:6px;max-height:190px;overflow:auto;">${qaHtml}</div>
            <div style="display:flex;gap:8px;">
                <button type="button" id="turtle-soup-main-flow-btn" style="flex:1;border:none;border-radius:12px;background:#111;color:#fff;padding:10px 12px;font-size:13px;cursor:pointer;">
                    ${phase === TURTLE_SOUP_PHASE.questioning ? '揭晓答案' : '新一局'}
                </button>
                <button type="button" id="turtle-soup-ai-step-btn" style="flex:1;border:none;border-radius:12px;background:#f3f4f6;color:#111;padding:10px 12px;font-size:13px;cursor:pointer;">
                    推进游戏
                </button>
            </div>
            <button type="button" id="turtle-soup-end-btn" style="border:none;border-radius:12px;background:#f9fafb;color:#6b7280;padding:9px 12px;font-size:12px;cursor:pointer;">结束游戏</button>
        </div>
    `;

    resultDiv.textContent = state.statusText || '进行中';
    resultDiv.style.color = phase === TURTLE_SOUP_PHASE.revealed ? '#111' : '#666';
    resultDiv.style.fontWeight = phase === TURTLE_SOUP_PHASE.revealed ? '700' : '600';

    const mainBtn = document.getElementById('turtle-soup-main-flow-btn');
    if (mainBtn) {
        mainBtn.addEventListener('click', () => {
            if (phase === TURTLE_SOUP_PHASE.questioning) {
                revealTurtleSoupAnswerForGroup(group, { announce: true, actorId: 'me' });
                return;
            }
            if (state.caseSource === 'ai') {
                startTurtleSoupRoundWithAiCase(group, {
                    announce: true,
                    actorId: 'me',
                    genre: state.caseGenre || state.setupGenre,
                    requirement: state.caseRequirement || state.setupExtraRequirement
                });
                return;
            }
            beginTurtleSoupRoundForGroup(group, { announce: true, actorId: 'me' });
        });
    }

    const aiStepBtn = document.getElementById('turtle-soup-ai-step-btn');
    if (aiStepBtn) aiStepBtn.addEventListener('click', () => requestTurtleSoupAiStep(group, state));

    const endBtn = document.getElementById('turtle-soup-end-btn');
    if (endBtn) endBtn.addEventListener('click', () => endTurtleSoupGameForGroup(group, { announce: true, actorId: 'me' }));
}

window.getGroupUndercoverPromptContext = getGroupUndercoverPromptContext;
window.applyGroupUndercoverGameAction = applyUndercoverGameAction;
window.startGroupUndercoverGame = beginUndercoverRoundForGroup;
window.getGroupTurtleSoupPromptContext = getGroupTurtleSoupPromptContext;
window.applyGroupTurtleSoupGameAction = applyTurtleSoupGameAction;
window.startGroupTurtleSoupGame = beginTurtleSoupRoundForGroup;

function saveTodData() {
    localStorage.setItem('tod_presets', JSON.stringify(tdState.presets));
    localStorage.setItem('tod_current_pools', JSON.stringify(tdState.pools));
}

// 注册初始化
if (window.appInitFunctions) {
    window.appInitFunctions.push(initGames);
} else {
    window.appInitFunctions = [initGames];
}
