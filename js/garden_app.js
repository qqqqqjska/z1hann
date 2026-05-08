(function () {
    'use strict';

    const GARDEN_TITLE_STORAGE_KEY = 'garden_app_custom_title_v1';
    const GARDEN_LAYOUT_STORAGE_KEY = 'garden_app_contact_layouts_v1';
    const GARDEN_GAME_STATE_STORAGE_KEY = 'garden_game_state_v1';
    const GARDEN_ROGUE_RUN_STORAGE_KEY_V2 = 'garden_rogue_run_v2';
    const GARDEN_ROGUE_META_STORAGE_KEY_V2 = 'garden_rogue_meta_v2';
    const GARDEN_HOME_TUTORIAL_DISMISSED_KEY = 'garden_home_tutorial_dismissed_v1';
    const GARDEN_FIGURE_ASSET_DB_NAME = 'garden_app_figure_assets_v1';
    const GARDEN_FIGURE_ASSET_STORE = 'resident_character_assets';
    const GARDEN_TITLE_DEFAULT = '\u840c\u5ba0\u76f8\u4f34\u7684\u5bb6';
    const GARDEN_TITLE_MAX_LENGTH = 20;
    const CONTACT_FIGURE_MIN_LEFT = 15;
    const CONTACT_FIGURE_MAX_LEFT = 85;
    const CONTACT_FIGURE_MIN_TOP = 74;
    const CONTACT_FIGURE_MAX_TOP = 90;

    const HOME_ENTRY_META = {
        home: { label: '小家' },
        farm: { label: '农场' },
        pasture: { label: '牧场' },
        kitchen: { label: '厨房' }
    };

    const ITEM_META = {
        wheat: { id: 'wheat', name: '小麦', emoji: '🌾', category: 'crops', sellPrice: 20 },
        carrot: { id: 'carrot', name: '胡萝卜', emoji: '🥕', category: 'crops', sellPrice: 35 },
        tomato: { id: 'tomato', name: '番茄', emoji: '🍅', category: 'crops', sellPrice: 50 },
        corn: { id: 'corn', name: '玉米', emoji: '🌽', category: 'crops', sellPrice: 65 },
        pumpkin: { id: 'pumpkin', name: '南瓜', emoji: '🎃', category: 'crops', sellPrice: 90 },
        egg: { id: 'egg', name: '鸡蛋', emoji: '🥚', category: 'products', sellPrice: 30 },
        milk: { id: 'milk', name: '牛奶', emoji: '🥛', category: 'products', sellPrice: 200 },
        pork: { id: 'pork', name: '猪肉', emoji: '🥩', category: 'products', sellPrice: 80 },
        wool: { id: 'wool', name: '羊毛', emoji: '🧶', category: 'products', sellPrice: 130 },
        bread: { id: 'bread', name: '香喷喷面包', emoji: '🍞', category: 'cooked', sellPrice: 90 },
        cake: { id: 'cake', name: '美味蛋糕', emoji: '🍰', category: 'cooked', sellPrice: 320 },
        salad: { id: 'salad', name: '田园沙拉', emoji: '🥗', category: 'cooked', sellPrice: 170 },
        pizza: { id: 'pizza', name: '农家披萨', emoji: '🍕', category: 'cooked', sellPrice: 290 },
        taco: { id: 'taco', name: '烤肉卷饼', emoji: '🌮', category: 'cooked', sellPrice: 240 },
        icecream: { id: 'icecream', name: '奶香冰淇淋', emoji: '🍨', category: 'cooked', sellPrice: 520 },
        stirfry: { id: 'stirfry', name: '营养炖菜', emoji: '🥘', category: 'cooked', sellPrice: 180 }
    };

    const ROGUE_ACTIVE_ITEM_POOL_V2 = {
        fertilizer: { id: 'fertilizer', name: '丰产肥料', emoji: '🧪', scope: 'farm', desc: '对一块农田使用，本次收获有较高概率额外 +1。', recommendedUse: '适合当前缺基础材料时补一次高产。', effectType: 'farm_bonus_yield', charges: 1 },
        greenhouse_spray: { id: 'greenhouse_spray', name: '温室喷雾', emoji: '💦', scope: 'farm', desc: '让一块作物立刻加速成熟。', recommendedUse: '适合赶当前节点进度或补最后一份原料。', effectType: 'farm_finish_now', charges: 1 },
        pasture_whistle: { id: 'pasture_whistle', name: '牧场口哨', emoji: '📯', scope: 'pasture', desc: '立即推进一只动物到可收获状态。', recommendedUse: '适合急缺鸡蛋、牛奶、猪肉或羊毛时使用。', effectType: 'pasture_finish_now', charges: 1 },
        nutrient_feed: { id: 'nutrient_feed', name: '营养饲料', emoji: '🥣', scope: 'pasture', desc: '对一只动物使用，下一次收获额外 +1。', recommendedUse: '适合想放大高价值畜产时使用。', effectType: 'pasture_bonus_yield', charges: 1 },
        kitchen_spice: { id: 'kitchen_spice', name: '厨房香料', emoji: '🧂', scope: 'kitchen', desc: '下一次成功烹饪额外产出 1 份熟食。', recommendedUse: '适合做高价值熟食或冲市场订单时使用。', effectType: 'kitchen_bonus_output', charges: 1 },
        market_coupon: { id: 'market_coupon', name: '市场加价券', emoji: '🎟️', scope: 'market', desc: '下一张市场订单奖励提升。', recommendedUse: '适合第三幕卖货爆发或冲 Boss 收益。', effectType: 'market_bonus_order', charges: 1 }
    };

    const STORAGE_TABS = {
        crops: { id: 'crops', label: '作物', itemIds: ['wheat', 'carrot', 'tomato', 'corn', 'pumpkin'] },
        products: { id: 'products', label: '畜产', itemIds: ['egg', 'milk', 'pork', 'wool'] },
        cooked: { id: 'cooked', label: '熟食', itemIds: ['bread', 'cake', 'salad', 'pizza', 'taco', 'icecream', 'stirfry'] }
    };

    const INVENTORY_ITEM_IDS = Object.keys(ITEM_META);

    function getFarmSeedGrowTimeByCost(cost) {
        return Math.max(60 * 1000, cost * 6000);
    }

    const FARM_SEEDS = {
        wheat: { id: 'wheat', inventoryId: 'wheat', name: '小麦', emoji: '🌾', cost: 10, time: getFarmSeedGrowTimeByCost(10) },
        carrot: { id: 'carrot', inventoryId: 'carrot', name: '胡萝卜', emoji: '🥕', cost: 15, time: getFarmSeedGrowTimeByCost(15) },
        tomato: { id: 'tomato', inventoryId: 'tomato', name: '番茄', emoji: '🍅', cost: 20, time: getFarmSeedGrowTimeByCost(20) },
        corn: { id: 'corn', inventoryId: 'corn', name: '玉米', emoji: '🌽', cost: 25, time: getFarmSeedGrowTimeByCost(25) },
        pumpkin: { id: 'pumpkin', inventoryId: 'pumpkin', name: '南瓜', emoji: '🎃', cost: 35, time: getFarmSeedGrowTimeByCost(35) }
    };

    const KITCHEN_RECIPES = {
        bread: { id: 'bread', name: '香喷喷面包', emoji: '🍞', primaryIngredient: 'wheat', ingredients: { wheat: 2, egg: 1 } },
        cake: { id: 'cake', name: '美味蛋糕', emoji: '🍰', primaryIngredient: 'wheat', ingredients: { wheat: 3, milk: 1 } },
        salad: { id: 'salad', name: '田园沙拉', emoji: '🥗', primaryIngredient: 'tomato', ingredients: { tomato: 2, carrot: 1 } },
        pizza: { id: 'pizza', name: '农家披萨', emoji: '🍕', primaryIngredient: 'wheat', ingredients: { wheat: 3, tomato: 2, pork: 1 } },
        taco: { id: 'taco', name: '烤肉卷饼', emoji: '🌮', primaryIngredient: 'wheat', ingredients: { wheat: 2, pork: 2 } },
        icecream: { id: 'icecream', name: '奶香冰淇淋', emoji: '🍨', primaryIngredient: 'milk', ingredients: { milk: 2, egg: 1 } },
        stirfry: { id: 'stirfry', name: '营养炖菜', emoji: '🥘', primaryIngredient: 'carrot', ingredients: { carrot: 2, pork: 1 } }
    };

    const ROGUE_V2_NODE_LABELS = {
        farm: '农场节点',
        pasture: '牧场节点',
        kitchen: '厨房节点',
        market: '市场节点',
        event: '奇遇节点',
        merchant: '商店节点',
        rest: '休整节点',
        elite: '精英节点',
        boss: '最终 Boss'
    };

    const ROGUE_V2_ACT_LABELS = {
        1: '第一幕 · 开荒',
        2: '第二幕 · 扩张',
        3: '第三幕 · 爆仓'
    };

    const ROGUE_V2_STARTER_LOADOUTS = {
        farmer: {
            id: 'farmer',
            name: '老农夫',
            desc: '初始农地更多，适合走高频种植和素食速推。',
            icon: '🌾',
            startCoins: 160,
            startInventory: { wheat: 4, carrot: 2 },
            starterRelicId: 'golden_watering_can'
        },
        chef: {
            id: 'chef',
            name: '落魄主厨',
            desc: '开局自带高级菜谱，更容易走高价值加工路线。',
            icon: '🍳',
            startCoins: 150,
            startInventory: { wheat: 2, egg: 2, tomato: 2 },
            starterRelicId: 'lucky_pan'
        },
        rancher: {
            id: 'rancher',
            name: '牧场经理',
            desc: '初始动物更强，适合走自动化牧场和高价畜产路线。',
            icon: '🐮',
            startCoins: 170,
            startInventory: { corn: 3, egg: 1 },
            starterRelicId: 'auto_feeder'
        }
    };

    const ROGUE_RELIC_POOL_V2 = {
        golden_watering_can: { id: 'golden_watering_can', rarity: 'starter', category: 'farm', title: '黄金水壶', desc: '浇水不消耗行动力，暴雨日额外提升变异率。', effects: { freeWatering: 1, rainMutationBonus: 0.15 } },
        lucky_pan: { id: 'lucky_pan', rarity: 'starter', category: 'kitchen', title: '幸运平底锅', desc: '烹饪大成功率提高，发光料理售价更高。', effects: { cookingCritChance: 0.18, glowingDishBonus: 1 } },
        auto_feeder: { id: 'auto_feeder', rarity: 'starter', category: 'pasture', title: '自动投喂机', desc: '每天自动喂养 1 次动物，适合牧场自动化。', effects: { autoFeedPerDay: 1 } },
        catalyst_fertilizer: { id: 'catalyst_fertilizer', rarity: 'common', category: 'farm', title: '催熟肥料', desc: '所有作物生长周期 -1 天。', effects: { cropGrowDaysDelta: -1 } },
        twin_harvest: { id: 'twin_harvest', rarity: 'common', category: 'farm', title: '双生果穗', desc: '农场收获有 30% 概率额外 +1。', effects: { extraCropChance: 0.3 } },
        gourmet_salt: { id: 'gourmet_salt', rarity: 'common', category: 'kitchen', title: '秘制香料', desc: '厨房成功料理有 25% 概率升级为发光料理。', effects: { glowingDishChance: 0.25 } },
        bulk_freezer: { id: 'bulk_freezer', rarity: 'common', category: 'warehouse', title: '冷藏柜', desc: '仓库容量 +4，食材更不容易腐烂。', effects: { inventoryCapacity: 4, spoilageGuard: 1 } },
        price_board: { id: 'price_board', rarity: 'common', category: 'market', title: '行情板', desc: '每天提前预知 1 类涨价商品。', effects: { marketPreview: 1 } },
        mutant_gene: { id: 'mutant_gene', rarity: 'rare', category: 'farm', title: '变异基因', desc: '流星雨和特殊天气下更容易出现变异作物。', effects: { mutationChanceBonus: 0.25 } },
        dark_contract: { id: 'dark_contract', rarity: 'rare', category: 'market', title: '黑市契约', desc: '黑暗料理无视市场波动，按高价卖给地下商人。', effects: { darkDishMarketIgnore: 1 } },
        carnivore_brand: { id: 'carnivore_brand', rarity: 'rare', category: 'pasture', title: '肉食招牌', desc: '肉类相关成品在热卖日额外获得高倍率收益。', effects: { meatDishBonus: 0.5 } },
        vegetarian_manifesto: { id: 'vegetarian_manifesto', rarity: 'rare', category: 'kitchen', title: '素食主义', desc: '纯素料理收益 +50%，但动物每日维护成本更高。', effects: { veganDishBonus: 0.5, animalFeedPenalty: 1 } }
    };

    const ROGUE_EVENT_POOL_V2 = {
        lucky_crate: { id: 'lucky_crate', title: '漂流补给箱', desc: '打开一箱随机补给。', choices: [{ id: 'open', label: '打开', result: { type: 'items', items: { wheat: 2, egg: 1, tomato: 1 } } }, { id: 'sell', label: '折现', result: { type: 'coins', amount: 90 } }] },
        risky_bet: { id: 'risky_bet', title: '流浪商人', desc: '赌一把资源，可能直接摸到高稀有遗物。', choices: [{ id: 'bet', label: '下注 80 金币', result: { type: 'relicDraft', rarityBias: 'rare', costCoins: 80 } }, { id: 'leave', label: '离开', result: { type: 'nothing' } }] },
        morale_campfire: { id: 'morale_campfire', title: '篝火夜话', desc: '在火边休息，恢复状态并整理背包。', choices: [{ id: 'rest', label: '恢复士气', result: { type: 'morale', amount: 1 } }, { id: 'sort', label: '复制一份库存', result: { type: 'copyHighestStack' } }] }
    };

    const ROGUE_NODE_POOL_V2 = {
        1: {
            normal: ['farm', 'farm', 'pasture', 'event', 'merchant', 'rest'],
            elite: 'elite'
        },
        2: {
            normal: ['farm', 'pasture', 'kitchen', 'event', 'merchant', 'rest'],
            elite: 'elite'
        },
        3: {
            normal: ['farm', 'pasture', 'kitchen', 'market', 'event', 'merchant', 'rest'],
            elite: 'boss'
        }
    };

    const ROGUE_META_TREE_V2 = {
        opening: [
            { id: 'start_coins_1', name: '启动资金', desc: '开局局内金币 +40', maxLevel: 5, costBase: 20, effects: { runCoinsFlat: 40 } },
            { id: 'start_pack_1', name: '后勤补给', desc: '开局额外获得随机基础材料', maxLevel: 5, costBase: 25, effects: { bonusStartItems: 1 } }
        ],
        relics: [
            { id: 'relic_quality_1', name: '精制遗物', desc: '高品质遗物出现率提升', maxLevel: 5, costBase: 30, effects: { rareRelicRate: 0.06 } },
            { id: 'shop_quality_1', name: '精选货架', desc: '商店商品质量提升', maxLevel: 5, costBase: 30, effects: { shopQuality: 1 } }
        ],
        route: [
            { id: 'route_scout_1', name: '路线侦察', desc: '每层多显示 1 个备选节点', maxLevel: 3, costBase: 40, effects: { extraNodeChoice: 1 } },
            { id: 'route_reroll_1', name: '线路重绘', desc: '每幕可刷新 1 次路线', maxLevel: 3, costBase: 45, effects: { routeReroll: 1 } }
        ],
        survival: [
            { id: 'morale_cap_1', name: '稳住阵脚', desc: '士气上限 +1', maxLevel: 3, costBase: 40, effects: { moraleCap: 1 } },
            { id: 'safety_guard_1', name: '失误缓冲', desc: '每局首次失败不扣士气', maxLevel: 3, costBase: 50, effects: { failShield: 1 } }
        ],
        settlement: [
            { id: 'settle_bonus_1', name: '满载而归', desc: '局外结算奖励提升', maxLevel: 5, costBase: 35, effects: { settlementBonus: 0.08 } },
            { id: 'ascension_unlock', name: '更高难度', desc: '解锁更高 Ascension', maxLevel: 5, costBase: 60, effects: { ascensionUnlock: 1 } }
        ]
    };

    const PASTURE_ANIMAL_DATA = {
        chicken: { id: 'chicken', babyEmoji: '🐥', adultEmoji: '🐓', food: '🌾', inventoryId: 'egg', produceName: '鸡蛋', produceEmoji: '🥚', cost: 20, growTime: 5000, produceTime: 6000 },
        pig: { id: 'pig', babyEmoji: '🐷', adultEmoji: '🐖', food: '🥬', inventoryId: 'pork', produceName: '猪肉', produceEmoji: '🥩', cost: 50, growTime: 8000, produceTime: 10000 },
        sheep: { id: 'sheep', babyEmoji: '🐑', adultEmoji: '🐏', food: '🌿', inventoryId: 'wool', produceName: '羊毛', produceEmoji: '🧶', cost: 80, growTime: 12000, produceTime: 15000 },
        cow: { id: 'cow', babyEmoji: '🐮', adultEmoji: '🐄', food: '🌽', inventoryId: 'milk', produceName: '牛奶', produceEmoji: '🥛', cost: 120, growTime: 15000, produceTime: 20000 }
    };

    const PANEL_TABS = [
        {
            key: 'pet',
            label: '宠物',
            icon: 'fas fa-paw',
            items: [
                { kind: 'adoption', icon: 'fas fa-plus', color: '#f59e0b', name: '领养宠物' }
            ]
        },
        {
            key: 'furniture',
            label: '家具',
            icon: 'fas fa-couch',
            items: [
                { kind: 'spawn', itemType: 'bed', placement: 'floor', icon: 'fas fa-bed', color: 'var(--wood-dark)', name: '小熊床' },
                { kind: 'spawn', itemType: 'sofa', placement: 'floor', icon: 'fas fa-couch', color: 'var(--primary)', name: '云朵沙发' },
                { kind: 'spawn', itemType: 'tv', placement: 'floor', icon: 'fas fa-tv', color: '#9ca3af', name: '复古电视' },
                { kind: 'spawn', itemType: 'bookshelf', placement: 'floor', icon: 'fas fa-book-open', color: '#8b5a2b', name: '大书架' },
                { kind: 'spawn', itemType: 'table', placement: 'floor', icon: 'fas fa-table-cells-large', color: 'var(--wood)', name: '原木桌' },
                { kind: 'spawn', itemType: 'desk', placement: 'floor', icon: 'fas fa-table', color: '#c08457', name: '小书桌' },
                { kind: 'spawn', itemType: 'chair', placement: 'floor', icon: 'fas fa-chair', color: '#f3c17a', name: '木椅' },
                { kind: 'spawn', itemType: 'dresser', placement: 'floor', icon: 'fas fa-box', color: '#f59e0b', name: '小斗柜' },
                { kind: 'spawn', itemType: 'wardrobe', placement: 'floor', icon: 'fas fa-door-closed', color: '#f4d7a1', name: '奶油衣柜' },
                { kind: 'spawn', itemType: 'pet_house', placement: 'floor', icon: 'fas fa-house', color: '#fb7185', name: '宠物小窝' },
                { kind: 'spawn', itemType: 'plant', placement: 'floor', icon: 'fas fa-seedling', color: 'var(--primary)', name: '圆叶绿植' },
                { kind: 'spawn', itemType: 'cactus', placement: 'floor', icon: 'fas fa-seedling', color: '#2a9d8f', name: '仙人掌' },
                { kind: 'spawn', itemType: 'lamp', placement: 'floor', icon: 'fas fa-lightbulb', color: '#fef08a', name: '落地灯' },
                { kind: 'spawn', itemType: 'pouf', placement: 'floor', icon: 'fas fa-circle', color: 'var(--secondary)', name: '软坐垫' },
                { kind: 'spawn', itemType: 'cat_lazy', placement: 'floor', icon: 'fas fa-cat', color: '#f97316', name: '猫咪垫' },
                { kind: 'spawn', itemType: 'rug', placement: 'floor', icon: 'fas fa-grip-lines', color: '#cbd5e0', name: '羊毛毯' }
            ]
        },
        {
            key: 'decor',
            label: '墙饰',
            icon: 'fas fa-image',
            items: [
                { kind: 'spawn', itemType: 'window', placement: 'wall', icon: 'fas fa-window-maximize', color: '#bae6fd', name: '拱形窗' },
                { kind: 'spawn', itemType: 'mirror', placement: 'wall', icon: 'fas fa-face-smile', color: '#fbcfe8', name: '梳妆镜' },
                { kind: 'spawn', itemType: 'painting', placement: 'wall', icon: 'fas fa-image', color: 'var(--primary)', name: '抽象挂画' },
                { kind: 'spawn', itemType: 'board', placement: 'wall', icon: 'fas fa-thumbtack', color: '#d97706', name: '软木板' },
                { kind: 'spawn', itemType: 'clock', placement: 'wall', icon: 'fas fa-clock', color: 'var(--secondary)', name: '挂钟' },
                { kind: 'spawn', itemType: 'garland', placement: 'wall', icon: 'fas fa-flag', color: 'var(--wood-dark)', name: '派对彩旗' }
            ]
        },
        {
            key: 'wallpaper',
            label: '墙纸',
            icon: 'fas fa-paint-roller',
            items: [
                { kind: 'texture', target: 'wall', background: 'linear-gradient(to bottom, #fefce8, #fef9c3)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: linear-gradient(to bottom, #fefce8, #fef9c3);', name: '奶油淡黄' },
                { kind: 'texture', target: 'wall', background: 'linear-gradient(to bottom, #fcfefe, #f0f7f4)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: linear-gradient(to bottom, #fcfefe, #f0f7f4);', name: '初雪清晨' },
                { kind: 'texture', target: 'wall', background: 'repeating-linear-gradient(0deg, #fff2f2, #fff2f2 10px, #ffffff 10px, #ffffff 20px)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: repeating-linear-gradient(0deg, #fff2f2, #fff2f2 10px, #ffffff 10px, #ffffff 20px);', name: '蜜桃条纹' },
                { kind: 'texture', target: 'wall', background: 'radial-gradient(#88d4ab 2px, transparent 2px)', bgSize: '10px 10px', bgColor: '#f0f7f4', swatchStyle: 'background: radial-gradient(#88d4ab 2px, transparent 2px); background-size: 10px 10px; background-color: #f0f7f4;', name: '薄荷波点' },
                { kind: 'texture', target: 'wall', background: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)', bgSize: '10px 10px', bgColor: '#ffffff', swatchStyle: 'background: linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px); background-size: 10px 10px; background-color: #fff;', name: '极简网格' },
                { kind: 'texture', target: 'wall', background: 'radial-gradient(#fef08a 2px, transparent 2px)', bgSize: '30px 30px', bgColor: '#e0f2fe', swatchStyle: 'background: radial-gradient(#fef08a 2px, transparent 2px); background-size: 15px 15px; background-color: #e0f2fe;', name: '星空蓝' }
            ]
        },
        {
            key: 'floor',
            label: '地板',
            icon: 'fas fa-border-all',
            items: [
                { kind: 'texture', target: 'floor', background: 'repeating-linear-gradient(90deg, #fcd34d, #fcd34d 30px, #fbbf24 30px, #fbbf24 32px)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: repeating-linear-gradient(90deg, #fcd34d, #fcd34d 10px, #fbbf24 10px, #fbbf24 12px);', name: '明亮木纹' },
                { kind: 'texture', target: 'floor', background: '#e8f4ec', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: #e8f4ec;', name: '浅草绿' },
                { kind: 'texture', target: 'floor', background: 'repeating-linear-gradient(90deg, #e2e8f0, #e2e8f0 30px, #cbd5e0 30px, #cbd5e0 32px)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: repeating-linear-gradient(90deg, #e2e8f0, #e2e8f0 10px, #cbd5e0 10px, #cbd5e0 12px);', name: '灰白木纹' },
                { kind: 'texture', target: 'floor', background: 'repeating-linear-gradient(90deg, #8b5a2b, #8b5a2b 30px, #704721 30px, #704721 32px)', bgSize: 'auto', bgColor: 'transparent', swatchStyle: 'background: repeating-linear-gradient(90deg, #8b5a2b, #8b5a2b 10px, #704721 10px, #704721 12px);', name: '深色胡桃' },
                { kind: 'texture', target: 'floor', background: 'conic-gradient(#88d4ab 90deg, #fff 90deg 180deg, #88d4ab 180deg 270deg, #fff 270deg)', bgSize: '40px 40px', bgColor: 'transparent', swatchStyle: 'background: conic-gradient(#88d4ab 90deg, #fff 90deg 180deg, #88d4ab 180deg 270deg, #fff 270deg); background-size: 20px 20px;', name: '复古棋盘' }
            ]
        }
    ];

    const SHAPE_GENERATORS = {
        pet_dog: `<div class="shape-pet pet-dog is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_dog_samoyed: `<div class="shape-pet pet-dog-samoyed is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_dog_golden: `<div class="shape-pet pet-dog-golden is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_cat: `<div class="shape-pet pet-cat is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_cat_silver: `<div class="shape-pet pet-cat-silver is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_cat_calico: `<div class="shape-pet pet-cat-calico is-sitting"><div class="floor-shadow"></div><div class="pet-flipper"><div class="pet-sprite"><div class="pet-tail"></div><div class="pet-leg l1"></div><div class="pet-leg l2"></div><div class="pet-leg l3"></div><div class="pet-leg l4"></div><div class="pet-body"></div><div class="pet-head"><div class="pet-ear e-l"></div><div class="pet-ear e-r"></div><div class="pet-eye eye-l"></div><div class="pet-eye eye-r"></div><div class="pet-snout"></div><div class="pet-nose"></div></div></div></div></div>`,
        pet_adopted_photo: `<div class="shape-adopted-pet"><div class="floor-shadow"></div><div class="adopted-pet-photo-wrap"><div class="adopted-pet-flipper"><img class="adopted-pet-photo" alt="宠物照片" draggable="false" /></div></div><div class="adopted-pet-badge"></div></div>`,
        bed: `<div class="shape-bed"><div class="floor-shadow"></div><div class="bed-frame"></div><div class="bed-head"></div><div class="bed-mat"></div><div class="bed-blanket"></div><div class="bed-pillow"></div></div>`,
        sofa: `<div class="shape-sofa"><div class="floor-shadow"></div><div class="sofa-back1"></div><div class="sofa-back2"></div><div class="sofa-base"></div></div>`,
        bookshelf: `<div class="shape-bookshelf"><div class="floor-shadow"></div><div class="shelf-board b1"></div><div class="shelf-board b2"></div><div class="book bk1"></div><div class="book bk2"></div><div class="book bk3"></div></div>`,
        table: `<div class="shape-table"><div class="floor-shadow"></div><div class="table-leg left"></div><div class="table-leg right"></div><div class="table-top"></div></div>`,
        coffee_table: `<div class="shape-coffee-table"><div class="floor-shadow"></div><div class="coffee-top"></div><div class="coffee-apron"></div><div class="coffee-shelf"></div><div class="coffee-leg fl"></div><div class="coffee-leg fr"></div><div class="coffee-leg bl"></div><div class="coffee-leg br"></div></div>`,
        desk: `<div class="shape-desk"><div class="floor-shadow"></div><div class="desk-leg left"></div><div class="desk-leg right"></div><div class="desk-top"></div><div class="desk-drawer"></div><div class="desk-note"></div></div>`,
        chair: `<div class="shape-chair"><div class="floor-shadow"></div><div class="chair-back-frame"></div><div class="chair-back-cushion"></div><div class="chair-seat"></div><div class="chair-leg back-left"></div><div class="chair-leg back-right"></div><div class="chair-leg front-left"></div><div class="chair-leg front-right"></div><div class="chair-bar"></div></div>`,
        dresser: `<div class="shape-dresser"><div class="floor-shadow"></div><div class="dresser-body"></div><div class="dresser-top"></div><div class="dresser-drawer d1"></div><div class="dresser-drawer d2"></div><div class="dresser-drawer d3"></div><div class="dresser-knob k1"></div><div class="dresser-knob k2"></div><div class="dresser-knob k3"></div></div>`,
        wardrobe: `<div class="shape-wardrobe"><div class="floor-shadow"></div><div class="wardrobe-body"></div><div class="wardrobe-door left"></div><div class="wardrobe-door right"></div><div class="wardrobe-handle left"></div><div class="wardrobe-handle right"></div><div class="wardrobe-base"></div></div>`,
        pet_house: `<div class="shape-pet-house"><div class="floor-shadow"></div><div class="pet-house-roof"></div><div class="pet-house-body"></div><div class="pet-house-entry"></div><div class="pet-house-cushion"></div></div>`,
        cactus: `<div class="shape-cactus"><div class="floor-shadow"></div><div class="cac-arm"></div><div class="cac-body"></div><div class="cac-pot"></div></div>`,
        lamp: `<div class="shape-lamp"><div class="floor-shadow"></div><div class="lamp-base"></div><div class="lamp-pole"></div><div class="lamp-shade"></div></div>`,
        pouf: `<div class="shape-pouf"><div class="floor-shadow"></div><div class="pouf-body"></div></div>`,
        rug: `<div class="shape-rug"></div>`,
        plant: `<div class="shape-plant"><div class="floor-shadow"></div><div class="plant-leaf leaf-3"></div><div class="plant-leaf leaf-2"></div><div class="plant-leaf leaf-1"></div><div class="plant-pot"></div></div>`,
        flora_portal_plant: `<div class="shape-flora-portal flora-portal-state-healthy"><div class="flora-portal-particle-system"><div class="flora-portal-particle" style="left: 20%; animation-delay: 0s;">&#10024;</div><div class="flora-portal-particle" style="left: 70%; animation-delay: 1.5s;">&#127807;</div><div class="flora-portal-particle" style="left: 45%; animation-delay: 0.8s;">&#127793;</div></div><div class="flora-portal-art-flower"></div><div class="flora-portal-art-leaf flora-portal-l1"></div><div class="flora-portal-art-leaf flora-portal-l2"></div><div class="flora-portal-art-leaf flora-portal-l3"></div><div class="flora-portal-art-leaf flora-portal-l4"></div><div class="flora-portal-art-stem"></div><div class="flora-portal-art-pot"></div><div class="flora-portal-floor-shadow"></div></div>`,
        tv: `<div class="shape-tv"><div class="floor-shadow"></div><div class="tv-leg1"></div><div class="tv-leg2"></div><div class="tv-antenna"></div><div class="tv-screen"></div><div class="tv-knob k1"></div><div class="tv-knob k2"></div></div>`,
        cat_lazy: `<div class="shape-cat-lazy"><div class="floor-shadow"></div><div class="cat-mat"></div><div class="cat-tail-lazy"></div><div class="cat-body"></div><div class="cat-ear1"></div><div class="cat-ear2"></div></div>`,
        window: `<div class="shape-window"><div class="win-sun"></div></div>`,
        mirror: `<div class="shape-mirror"><div class="mirror-glare"></div></div>`,
        garland: `<div class="shape-garland"><div class="garland-line"></div><div class="flag f1"></div><div class="flag f2"></div><div class="flag f3"></div></div>`,
        painting: `<div class="shape-painting"><div class="paint-hill"></div></div>`,
        clock: `<div class="shape-clock"><div class="clock-center"></div><div class="clock-hand1"></div><div class="clock-hand2"></div></div>`,
        board: `<div class="shape-board"><div class="board-p1"><div class="board-pin"></div></div><div class="board-p2"></div><div class="board-p3"></div></div>`
    };




    const FLORA_STATES = {
        blooming: {
            particlesVisible: true,
            particles: [
                { left: '30%', delay: '0s', label: '\u2728' },
                { left: '60%', delay: '1s', label: '\u{1F339}' }
            ],
            logHtml: `
                <div class="garden-flora-msg">
                    <div class="garden-flora-msg-time">\u521a\u521a</div>
                    <div class="garden-flora-msg-bubble is-positive">
                        <i class="ph-fill ph-flower-tulip"></i>TA \u5bf9\u4f60\u8868\u8fbe\u4e86\u5f88\u591a\u559c\u6b22\u548c\u5fc3\u52a8\uff0c\u7eff\u690d\u5f00\u51fa\u4e86\u6f02\u4eae\u7684\u5c0f\u82b1\u3002
                    </div>
                </div>`
        },
        healthy: {
            particlesVisible: true,
            particles: [
                { left: '20%', delay: '0s', label: '\u2728' },
                { left: '70%', delay: '1.5s', label: '\u{1F33F}' },
                { left: '45%', delay: '0.8s', label: '\u{1F331}' }
            ],
            logHtml: `
                <div class="garden-flora-msg">
                    <div class="garden-flora-msg-time">10:42</div>
                    <div class="garden-flora-msg-bubble is-positive">
                        <i class="ph-fill ph-smiley"></i>TA \u521a\u521a\u56de\u4e86\u4f60\u4e00\u53e5\u201c\u54c8\u54c8\u54c8\u54c8\u201d\uff0c\u7eff\u690d\u5438\u6536\u5230\u4e86\u5feb\u4e50\u517b\u5206\u3002
                    </div>
                </div>
                <div class="garden-flora-msg">
                    <div class="garden-flora-msg-time">09:15</div>
                    <div class="garden-flora-msg-bubble">
                        <i class="ph-fill ph-cloud-rain" style="color: #5ac8fa;"></i>\u4eca\u5929\u8bb0\u5f97\u4e5f\u6765\u6d47\u6d47\u6c34\uff0c\u966a\u5b83\u8bf4\u8bf4\u8bdd\u3002
                    </div>
                </div>`
        },
        withering: {
            particlesVisible: false,
            particles: [],
            logHtml: `
                <div class="garden-flora-msg">
                    <div class="garden-flora-msg-time">\u6628\u5929</div>
                    <div class="garden-flora-msg-bubble is-negative">
                        <i class="ph-fill ph-warning-circle"></i>\u4f60\u4eec\u5df2\u7ecf\u8d85\u8fc7 24 \u5c0f\u65f6\u6ca1\u6709\u8ba4\u771f\u4e92\u52a8\u4e86\uff0c\u7eff\u690d\u5f00\u59cb\u6709\u70b9\u7f3a\u6c34\u53d1\u853b\u3002
                    </div>
                </div>`
        },
        withered: {
            particlesVisible: false,
            particles: [],
            logHtml: `
                <div class="garden-flora-msg">
                    <div class="garden-flora-msg-time">\u4e09\u5929\u524d</div>
                    <div class="garden-flora-msg-bubble is-negative">
                        <i class="ph-fill ph-heart-break"></i>\u6700\u8fd1\u6355\u6349\u5230\u4e86\u51b7\u6de1\u6216\u4e89\u5435\u7684\u60c5\u7eea\uff0c\u690d\u7269\u6709\u70b9\u5931\u53bb\u751f\u673a\u4e86\uff0c\u5feb\u53bb\u54c4\u54c4 TA \u5427\u3002
                    </div>
                </div>`
        }
    };

    const state = {
        initialized: false,
        gardenMode: 'casual',
        gardenGame: null,
        casualGardenGame: null,
        rogueRunV2: null,
        rogueMetaV2: null,
        activeTab: 'pet',
        currentView: 'home',
        drawerOpen: false,
        currentHomeSection: 'home',
        homeEntryMenuOpen: false,
        farmScreenOpen: false,
        pastureScreenOpen: false,
        kitchenScreenOpen: false,
        farmToastTimeout: null,
        pastureToastTimeout: null,
        kitchenToastTimeout: null,
        roguePanelOpen: false,
        rogueIntroOpen: false,
        rogueBuffPanelOpen: false,
        homeTutorialDismissed: false,
        farmGame: {
            initialized: false,
            progressTimer: null,
            currentTool: 'pointer',
            currentSeed: 'wheat',
            selectedToolItemId: null
        },
        pastureGame: {
            initialized: false,
            progressTimer: null,
            roamTimer: null,
            visualEatingUntil: {},
            currentTool: 'pointer',
            selectedAnimalToBuy: 'chicken',
            selectedToolItemId: null,
            shopMarkup: ''
        },
        kitchenGame: {
            initialized: false,
            qteActive: false,
            currentRecipeId: null,
            currentAngle: 0,
            spinDuration: 0,
            startTime: 0,
            whiteStart: 0,
            whiteEnd: 0,
            yellowStart: 0,
            yellowEnd: 0,
            selectedToolItemId: null,
            toolPanelOpen: false
        },
        storageSell: {
            itemId: null,
            qty: 1
        },
        miniMissionCollapsed: {
            farm: true,
            pasture: true,
            kitchen: true
        },
        toastTimeout: null,
        saveResetTimer: null,
        saveDoneTimer: null,
        shadowRoot: null,
        roomEl: null,
        wallEl: null,
        floorEl: null,
        residentLayerEl: null,
        toastEl: null,
        drawerEl: null,
        tabsEl: null,
        panelContentEl: null,
        floraState: 'healthy',
        floraOpen: false,
        currentGardenContactId: null,
        gardenLayouts: null,
        residentFigureEl: null,
        residentFigureTriggerEl: null,
        residentAssignmentBadgeEl: null,
        residentFigureLoopTimer: null,
        residentFigureMoveTimer: null,
        residentFigurePreloadToken: 0,
        residentFigureImageCache: new Map(),
        residentFigureAssetDbPromise: null,
        residentFigureAssetUrlCache: new Map(),
        residentFigurePoseToken: 0,
        residentFigureInteractionTimer: null,
        residentFigureInteractionLocked: false,
        residentStatusCardEl: null,
        residentFeedSheetEl: null,
        residentDispatchSheetEl: null,
        contactFigureDraftFiles: {
            idle: null,
            runLeft: null,
            runRight: null,
            pet: null,
            feed: null
        },
        contactFigureEditingId: null
    };

    let screenEl;
    let closeBtn;
    let togglePanelBtn;
    let saveBtn;
    let viewEls;
    let navBtns;
    let activitiesViewEl;
    let storageViewEl;
    let storageGridEl;
    let storageTabBtns = [];
    let storageSellSheetEl;
    let storageSellBackdropEl;
    let storageSellIconEl;
    let storageSellNameEl;
    let storageSellStockEl;
    let storageSellPriceEl;
    let storageSellQtyEl;
    let storageSellTotalEl;
    let storageSellConfirmBtn;
    let homeEntryMenuEl;
    let farmScreenEl;
    let farmCloseBtn;
    let farmGridEl;
    let farmSeedPanelEl;
    let farmPanelTitleEl;
    let farmSeedListEl;
    let farmCoinsEl;
    let farmLevelEl;
    let farmApEl;
    let farmApMaxEl;
    let farmBuffSummaryEl;
    let farmBuffSummaryTextEl;
    let farmBuffChipEl;
    let farmToolBtns = [];
    let farmToastEl;
    let pastureScreenEl;
    let pastureCloseBtn;
    let pastureFieldEl;
    let pastureShopPanelEl;
    let pastureCoinsEl;
    let pastureExpEl;
    let pastureBuffSummaryEl;
    let pastureBuffSummaryTextEl;
    let pastureBuffChipEl;
    let pastureToolBtns = [];
    let pastureShopItems = [];
    let pastureToastEl;
    let kitchenScreenEl;
    let kitchenCloseBtn;
    let kitchenOverlayEl;
    let kitchenQteContainerEl;
    let kitchenQteDialEl;
    let kitchenQtePointerEl;
    let kitchenQteHintEl;
    let kitchenToastEl;
    let kitchenCookBtns = [];
    let kitchenBuffSummaryEl;
    let kitchenBuffSummaryTextEl;
    let kitchenBuffChipEl;
    let kitchenToolPanelEl;
    let kitchenToolListEl;
    let rogueProgressStripEl;
    let rogueProgressStageEl;
    let rogueProgressCardsEl;
    let rogueProgressGoalEl;
    let rogueProgressOrderEl;
    let rogueProgressPanelEl;
    let rogueProgressPanelStageEl;
    let rogueProgressPanelCardsEl;
    let rogueProgressPanelGoalEl;
    let rogueProgressPanelOrderEl;
    let rogueOfferModalEl;
    let rogueOfferTitleEl;
    let rogueOfferDescEl;
    let rogueOfferChoicesEl;
    let rogueIntroModalEl;
    let rogueIntroTitleEl;
    let rogueIntroDescEl;
    let rogueIntroBodyEl;
    let rogueBuffPanelEl;
    let rogueBuffPanelListEl;
    let storageOrderCardEl;
    let kitchenSkipBtnEl;
    let farmMissionEl;
    let farmMissionTitleEl;
    let farmMissionProgressEl;
    let farmMissionActionEl;
    let pastureMissionEl;
    let pastureMissionTitleEl;
    let pastureMissionProgressEl;
    let pastureMissionActionEl;
    let kitchenMissionEl;
    let kitchenMissionTitleEl;
    let kitchenMissionProgressEl;
    let kitchenMissionActionEl;
    let homeTutorialCardEl;
    let homeTutorialReopenBtnEl;
    let editorHost;
    let titleTextEl;
    let floraScreenEl;
    let floraAppEl;
    let floraBackBtn;
    let floraArtEl;
    let floraParticlesEl;
    let floraLogContentEl;
    let floraToggleBtns = [];
    let contactFigureModalEl;
    let contactFigureModalTitleEl;
    let contactFigureIdleInputEl;
    let contactFigureRunLeftInputEl;
    let contactFigureRunRightInputEl;
    let contactFigurePetInputEl;
    let contactFigureFeedInputEl;
    let contactFigureIdlePreviewEl;
    let contactFigureRunLeftPreviewEl;
    let contactFigureRunRightPreviewEl;
    let contactFigurePetPreviewEl;
    let contactFigureFeedPreviewEl;
    let petAdoptionOverlayEl;
    let petAdoptionCloseBtnEl;
    let petAdoptionRootEl;
    let petCareOverlayEl;
    let petCareCloseBtnEl;
    let petCareRootEl;
    let farmAssignmentFigureEl;
    let pastureAssignmentFigureEl;
    let farmAssignmentLayerEl;
    let pastureAssignmentLayerEl;
    let farmAssignmentLoopTimer = null;
    let pastureAssignmentLoopTimer = null;
    let residentAssignmentAutoTimer = null;

    const CONTACT_STATUS_DEFAULTS = Object.freeze({ mood: 70, hunger: 75, energy: 80 });
    const CONTACT_STATUS_MAX = 100;
    const CONTACT_HUNGER_DECAY_MS = 10 * 60 * 1000;
    const CONTACT_HUNGER_DECAY_AMOUNT = 4;
    const CONTACT_ASSIGNMENT_COST = Object.freeze({ energy: 20, hunger: 15 });
    const CONTACT_ASSIGNMENT_DURATIONS = Object.freeze({ farm: 2 * 60 * 1000, pasture: 3 * 60 * 1000, kitchen: 4 * 60 * 1000 });
    const CONTACT_ASSIGNMENT_EMPTY_RETURN_DELAY = 5000;
    const ADOPTION_PRESET_PETS = Object.freeze([
        {
            id: 'shiba',
            icon: '🐶',
            name: '柴犬',
            tag: '✨ 忠诚 / Loyal',
            desc: '机灵又带点小傲娇，像一团会自己发光的小太阳，陪你把日常过得热热闹闹。',
            imageSrc: 'https://i.postimg.cc/mDRL08rQ/%E6%97%A0%E6%A0%87%E9%A2%98120_20260317175551.png'
        },
        {
            id: 'samoyed',
            icon: '🐶',
            name: '萨摩耶',
            tag: '☁️ 治愈 / Gentle',
            desc: '笑起来像会下雪的云团，温柔亲人，总能用软乎乎的陪伴把你的心情治愈好。',
            imageSrc: 'https://i.postimg.cc/wvHqS0BQ/%E6%97%A0%E6%A0%87%E9%A2%98120_20260317175610.png'
        },
        {
            id: 'silver-cat',
            icon: '🐱',
            name: '银渐层',
            tag: '🌙 安静 / Soft',
            desc: '毛色像月光一样柔和，安静又亲人，会用软绵绵的陪伴把日子过得很温柔。',
            imageSrc: 'https://i.postimg.cc/Zn4BZ6Ts/wu-biao-ti120-20260317202610.png'
        },
        {
            id: 'calico-cat',
            icon: '🐱',
            name: '三花猫',
            tag: '🎀 灵动 / Playful',
            desc: '古灵精怪又很会撒娇，像一颗跳跳糖，总能用灵动的小表情把你逗笑。',
            imageSrc: 'https://i.postimg.cc/5ygHtj0R/wu-biao-ti120-20260317202630.png'
        }
    ]);
    const ADOPTED_PET_ANIMATION_PRESETS = Object.freeze({
        shiba: Object.freeze({
            idleUrl: 'https://i.postimg.cc/155qwjLH/1773911645.gif',
            runLeftUrl: 'https://i.postimg.cc/DfcGWTYQ/3723B353_B73E_4074_8ACE_02836D256E97.gif',
            runRightUrl: 'https://i.postimg.cc/DfcGWTYQ/3723B353_B73E_4074_8ACE_02836D256E97.gif',
            flipRight: true,
            displayScale: 1.12,
            runOffsetY: -2,
            moveAfterRunLeadMs: 1500,
            moveStopAtRunMs: 2500,
            maxIdleDelayMs: 2500,
            maxRunDurationMs: 4000
        }),
        samoyed: Object.freeze({
            idleUrl: 'https://i.postimg.cc/W3Y3MyNq/IMG_7493.gif',
            runLeftUrl: 'https://i.postimg.cc/76t6gRHb/IMG_7488.gif',
            runRightUrl: 'https://i.postimg.cc/76t6gRHb/IMG_7488.gif',
            flipRight: true
        })
    });
    const ADOPTION_PET_POSITIONS = Object.freeze([
        { left: '22%', top: '84%' },
        { left: '40%', top: '87%' },
        { left: '58%', top: '84%' },
        { left: '76%', top: '87%' }
    ]);
    const petAdoptionState = {
        currentPet: null,
        customPetImageData: '',
        guardianName: ''
    };

    function createEmptyInventory() {
        return INVENTORY_ITEM_IDS.reduce((result, itemId) => {
            result[itemId] = 0;
            return result;
        }, {});
    }

    function createDefaultRogueMetaStateV2() {
        return {
            workshopCurrency: 0,
            ascensionLevel: 0,
            highestActCleared: 0,
            unlockedLoadouts: ['farmer', 'chef', 'rancher'],
            workshopLevels: {},
            seenRelics: [],
            seenEvents: []
        };
    }

    function createEmptyAdoptionPet() {
        return {
            icon: '🐾',
            name: '',
            desc: '',
            imageSrc: '',
            breed: '',
            gender: '',
            personality: '',
            hunger: 50,
            mood: 60
        };
    }

    petAdoptionState.currentPet = createEmptyAdoptionPet();

    function normalizeAdoptionText(value) {
        return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
    }

    function getPresetPetById(petId) {
        return ADOPTION_PRESET_PETS.find((pet) => pet.id === petId) || null;
    }

    function getPetAdoptionEl(selector) {
        return petAdoptionRootEl ? petAdoptionRootEl.querySelector(selector) : null;
    }

    function getOwnedAdoptedPets(contactId = null) {
        const layout = getStoredGardenLayout(contactId || state.currentGardenContactId);
        return layout && Array.isArray(layout.adoptedPets) ? layout.adoptedPets : [];
    }

    function getOwnedAdoptedPetById(petId, contactId = null) {
        return getOwnedAdoptedPets(contactId).find((pet) => pet.id === petId) || null;
    }

    function updateOwnedAdoptedPet(contactId = null, petId = '', updates = {}) {
        const resolvedContactId = resolveGardenContactId(contactId || state.currentGardenContactId);
        const store = readGardenLayouts();
        const existingLayout = store.contacts[resolvedContactId]
            ? sanitizeGardenLayout(store.contacts[resolvedContactId])
            : createDefaultGardenLayout();
        const petIndex = existingLayout.adoptedPets.findIndex((pet) => pet.id === petId);
        if (petIndex < 0) return null;

        const nextPet = sanitizeAdoptedPet({
            ...existingLayout.adoptedPets[petIndex],
            ...updates,
            id: existingLayout.adoptedPets[petIndex].id
        });
        if (!nextPet) return null;

        existingLayout.adoptedPets[petIndex] = nextPet;
        store.contacts[resolvedContactId] = existingLayout;
        state.gardenLayouts = store;
        writeGardenLayouts();
        return nextPet;
    }

    function registerOwnedAdoptedPet(contactId = null, petData = null) {
        const sanitizedPet = sanitizeAdoptedPet({
            id: petData && petData.id ? petData.id : '',
            name: petData && petData.name ? petData.name : '',
            imageSrc: petData && petData.imageSrc ? petData.imageSrc : '',
            hunger: petData && Number.isFinite(petData.hunger) ? petData.hunger : 50,
            mood: petData && Number.isFinite(petData.mood) ? petData.mood : 60
        });
        if (!sanitizedPet) return null;

        const resolvedContactId = resolveGardenContactId(contactId || state.currentGardenContactId);
        const store = readGardenLayouts();
        const existingLayout = store.contacts[resolvedContactId]
            ? sanitizeGardenLayout(store.contacts[resolvedContactId])
            : createDefaultGardenLayout();

        const exists = existingLayout.adoptedPets.some((pet) => pet.imageSrc === sanitizedPet.imageSrc && pet.name === sanitizedPet.name);
        if (!exists) {
            existingLayout.adoptedPets.push(sanitizedPet);
            store.contacts[resolvedContactId] = existingLayout;
            state.gardenLayouts = store;
            writeGardenLayouts();
        }
        return exists
            ? existingLayout.adoptedPets.find((pet) => pet.imageSrc === sanitizedPet.imageSrc && pet.name === sanitizedPet.name) || sanitizedPet
            : sanitizedPet;
    }

    function getPanelTabItems(tabKey) {
        const tab = PANEL_TABS.find((item) => item.key === tabKey);
        if (!tab) return [];
        if (tabKey !== 'pet') return tab.items;
        const ownedPets = getOwnedAdoptedPets();
        const ownedPetItems = ownedPets.map((pet) => ({
            kind: 'owned-pet',
            name: pet.name,
            imageSrc: pet.imageSrc,
            petId: pet.id,
            placement: 'floor'
        }));
        return [...tab.items, ...ownedPetItems];
    }

    function buildPetAdoptionMarkup() {
        const cardsMarkup = ADOPTION_PRESET_PETS.map((pet) => `
            <button type="button" class="pet-card" data-adoption-pet="${pet.id}">
                <div class="pet-avatar pet-avatar-image"><img src="${pet.imageSrc}" alt="${pet.name}"></div>
                <div class="pet-info"><h3>${pet.name}</h3><span>${pet.tag}</span></div>
            </button>
        `).join('');

        return `
            <style>
                @font-face{font-family:'AdoptionContractFont';src:url('https://nos.netease.com/ysf/b3fe611c56fa2e40c155ceddff5a6002.ttf') format('truetype');font-display:swap}
                #garden-pet-adoption-root{--primary:#f4cd7a;--secondary:#f7dd9b;--gold-dark:#d8b56c;--text-main:#6b5635;--text-light:#9b8359;--glass-bg:rgba(255,250,236,.78);--shadow:0 12px 40px rgba(214,174,92,.22);--stamp-red:#c96c56;--contract-font:'AdoptionContractFont','STKaiti','KaiTi',serif;position:relative;width:100%;height:100%;overflow:hidden;font-family:'PingFang SC','Helvetica Neue',Helvetica,Arial,sans-serif;color:var(--text-main)}
                #garden-pet-adoption-root *{box-sizing:border-box}#garden-pet-adoption-root .adoption-shell{position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;background:#fff9eb}#garden-pet-adoption-root .bg-shapes,#garden-pet-adoption-root .particles{position:absolute;inset:0;overflow:hidden;pointer-events:none}#garden-pet-adoption-root .bg-shapes{background:radial-gradient(circle at 50% 40%,#fffef9 0%,#fff4d9 100%)}
                #garden-pet-adoption-root .shape{position:absolute;border-radius:50%;filter:blur(80px);opacity:.46;animation:gardenPetFloat 12s infinite alternate ease-in-out}#garden-pet-adoption-root .shape-1{width:42vh;height:42vh;background:#ffe39b;top:-12%;left:-10%}#garden-pet-adoption-root .shape-2{width:52vh;height:52vh;background:#ffd6a6;right:-16%;bottom:-18%;animation-delay:-6s}
                #garden-pet-adoption-root .glass-panel{position:relative;width:min(92vw,430px);height:min(86vh,820px);background:var(--glass-bg);border:1px solid rgba(255,255,255,.82);border-radius:28px;box-shadow:var(--shadow);backdrop-filter:blur(18px);overflow:hidden}#garden-pet-adoption-root .page{position:absolute;inset:0;padding:34px 24px 24px;display:flex;flex-direction:column;opacity:0;pointer-events:none;transform:translateY(18px);transition:opacity .35s ease,transform .35s ease;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:none}#garden-pet-adoption-root .page::-webkit-scrollbar{display:none}#garden-pet-adoption-root .page.active{opacity:1;pointer-events:auto;transform:translateY(0)}#garden-pet-adoption-root #garden-adoption-page-list{overflow:hidden}#garden-pet-adoption-root #garden-adoption-page-custom{padding-bottom:calc(32px + env(safe-area-inset-bottom,0px))}
                #garden-pet-adoption-root .header{text-align:center;margin-bottom:26px}#garden-pet-adoption-root .header h1{font-size:25px;font-weight:700;letter-spacing:2px}#garden-pet-adoption-root .header p{margin-top:6px;font-size:11px;color:var(--text-light);letter-spacing:3px;text-transform:uppercase}
                #garden-pet-adoption-root .pet-grid{display:grid;gap:14px;flex:1;overflow-y:auto;padding:4px 2px 28px}#garden-pet-adoption-root .pet-card{border:none;background:rgba(255,255,255,.78);border-radius:22px;padding:16px;display:flex;align-items:center;gap:16px;text-align:left;box-shadow:0 12px 24px rgba(214,174,92,.12);cursor:pointer;transition:transform .2s ease;text-decoration:none;color:inherit}#garden-pet-adoption-root .pet-card:active{transform:translateY(2px) scale(.98)}
                #garden-pet-adoption-root .pet-avatar{width:70px;height:70px;border-radius:22px;display:flex;justify-content:center;align-items:center;background:transparent;flex-shrink:0}#garden-pet-adoption-root .pet-avatar img,#garden-pet-adoption-root .pet-visual-image,#garden-pet-adoption-root .profile-preview img{width:100%;height:100%;object-fit:contain;display:block}#garden-pet-adoption-root .pet-info h3{font-size:18px;margin:0 0 6px}#garden-pet-adoption-root .pet-info span{font-size:12px;color:var(--text-light);background:rgba(244,205,122,.18);padding:5px 10px;border-radius:999px}
                #garden-pet-adoption-root .pet-card-create{justify-content:center;border:2px dashed rgba(216,181,108,.62);background:rgba(255,250,236,.9);min-height:112px}#garden-pet-adoption-root .pet-card-create .pet-info{text-align:center}#garden-pet-adoption-root .detail-avatar{width:150px;height:150px;margin:12px auto 28px;display:flex;align-items:center;justify-content:center;font-size:90px;animation:gardenPetBounce 3s infinite ease-in-out}
                #garden-pet-adoption-root .detail-box,#garden-pet-adoption-root .profile-box{background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.9);border-radius:24px;padding:22px;margin-bottom:auto;box-shadow:0 10px 24px rgba(214,174,92,.1)}#garden-pet-adoption-root .detail-box h2{text-align:center;margin:0 0 12px}#garden-pet-adoption-root .detail-box p{color:var(--text-light);line-height:1.85;text-align:center;margin:0}
                #garden-pet-adoption-root .certificate{font-family:var(--contract-font);background:#fdfbf7;border:4px double var(--gold-dark);border-radius:6px;padding:28px 20px;position:relative;display:flex;flex-direction:column;flex:1;margin-bottom:16px;box-shadow:inset 0 0 50px rgba(216,181,108,.08)}#garden-pet-adoption-root .cert-title{font-family:var(--contract-font);text-align:center;font-size:26px;font-weight:700;letter-spacing:4px;padding-bottom:14px;margin-bottom:18px;border-bottom:1px solid var(--gold-dark)}#garden-pet-adoption-root .cert-content{font-family:var(--contract-font);font-size:16px;line-height:2.2;color:#5a4b3c;text-align:justify;padding:0 8px}#garden-pet-adoption-root .cert-pet-highlight{font-size:20px;font-weight:700;border-bottom:1px solid var(--text-main);padding:0 4px;border-radius:4px;cursor:text;outline:none}
                #garden-pet-adoption-root .signature-area{margin-top:auto;text-align:right;padding-right:10px;display:flex;justify-content:flex-end;align-items:flex-end}#garden-pet-adoption-root .signature-label{font-family:var(--contract-font);font-size:12px;color:#9d8c73;margin-right:10px;margin-bottom:4px}#garden-pet-adoption-root .signature-line{border-bottom:1px dashed var(--gold-dark);width:120px;height:30px;position:relative}#garden-pet-adoption-root .signature-text{font-family:var(--contract-font);font-size:28px;color:#1a1a1a;position:absolute;bottom:-2px;left:10px;white-space:nowrap;overflow:hidden;width:0}
                #garden-pet-adoption-root .contract-form{display:flex;flex-direction:column;gap:8px;margin-bottom:14px}#garden-pet-adoption-root .contract-input-label{font-family:var(--contract-font);font-size:14px;color:#5a4b3c;padding-left:4px}#garden-pet-adoption-root .contract-name-input,#garden-pet-adoption-root .profile-input,#garden-pet-adoption-root .profile-select{width:100%;border:1px solid rgba(216,181,108,.88);border-radius:14px;padding:12px 14px;background:rgba(255,252,244,.94);color:#4a3f35;outline:none;font-size:15px}#garden-pet-adoption-root .profile-grid{display:grid;gap:12px}#garden-pet-adoption-root .profile-field label{display:block;font-size:13px;color:var(--text-light);margin-bottom:7px}
                #garden-pet-adoption-root .profile-preview{width:140px;height:140px;margin:0 auto 18px;border-radius:28px;background:rgba(255,255,255,.74);border:2px dashed rgba(216,181,108,.5);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--text-light);cursor:pointer;overflow:hidden}#garden-pet-adoption-root .profile-preview.has-image .profile-preview-text,#garden-pet-adoption-root .profile-preview.has-image .profile-preview-icon{display:none}#garden-pet-adoption-root .profile-upload-input{display:none}#garden-pet-adoption-root .form-upload-tip{margin-top:10px;font-size:12px;color:var(--text-light);text-align:center;line-height:1.7}
                #garden-pet-adoption-root .btn-primary,#garden-pet-adoption-root .btn-secondary{width:100%;border:none;border-radius:18px;cursor:pointer;transition:transform .2s ease,box-shadow .2s ease}#garden-pet-adoption-root .btn-primary{padding:17px 18px;background:linear-gradient(135deg,#7f6442,#b48a53);color:#fff;font-size:16px;font-weight:700;letter-spacing:2px;box-shadow:0 10px 24px rgba(127,100,66,.24);display:flex;justify-content:center;align-items:center;gap:8px}#garden-pet-adoption-root .btn-gold{background:linear-gradient(135deg,#f0c96b,#ddac42);box-shadow:0 10px 24px rgba(221,172,66,.28)}#garden-pet-adoption-root .btn-secondary{background:transparent;color:var(--text-light);padding:12px;margin-top:8px;font-size:14px}
                #garden-pet-adoption-root .stamp{position:absolute;top:40%;left:50%;transform:translate(-50%,-50%) scale(4);opacity:0;width:150px;height:150px;border:6px solid var(--stamp-red);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-direction:column;color:var(--stamp-red);font-weight:700;background:rgba(253,251,247,.92);box-shadow:0 0 20px rgba(201,108,86,.16)}#garden-pet-adoption-root .stamp::before{content:'';position:absolute;inset:7px;border:2px solid var(--stamp-red);border-radius:50%}#garden-pet-adoption-root .stamp .ch{font-family:'KaiTi',serif;font-size:30px;letter-spacing:4px}#garden-pet-adoption-root .stamp .en{font-size:11px;letter-spacing:2px;margin-top:4px}#garden-pet-adoption-root .stamp.smash{animation:gardenPetStamp .5s cubic-bezier(.5,0,.3,1.5) forwards}
                #garden-pet-adoption-root .particle{position:absolute;width:6px;height:6px;background:#ffd36d;border-radius:50%;opacity:0;box-shadow:0 0 10px #ffd36d}#garden-pet-adoption-root .writing{animation:gardenPetWrite 1.2s steps(30) forwards}#garden-pet-adoption-root .shake-screen{animation:gardenPetShake .4s cubic-bezier(.36,.07,.19,.97) both}#garden-pet-adoption-root .curtain{position:absolute;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;background:rgba(255,252,244,.98);color:var(--text-main);letter-spacing:4px;font-weight:700;opacity:0;pointer-events:none;transition:opacity .5s ease}#garden-pet-adoption-root .curtain.show{opacity:1}
                @keyframes gardenPetFloat{from{transform:translate(0,0) scale(1)}to{transform:translate(36px,52px) scale(1.1)}}@keyframes gardenPetBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes gardenPetWrite{to{width:100%}}@keyframes gardenPetShake{10%,90%{transform:translate3d(-2px,2px,0)}20%,80%{transform:translate3d(2px,-2px,0)}30%,50%,70%{transform:translate3d(-4px,4px,0)}40%,60%{transform:translate3d(4px,-4px,0)}}@keyframes gardenPetStamp{0%{opacity:0;transform:translate(-50%,-50%) scale(4) rotate(10deg)}60%{opacity:1;transform:translate(-50%,-50%) scale(.92) rotate(-12deg)}100%{opacity:.95;transform:translate(-50%,-50%) scale(1) rotate(-12deg)}}
            </style>
            <div class="adoption-shell">
                <div class="bg-shapes"><div class="shape shape-1"></div><div class="shape shape-2"></div></div>
                <div class="particles" id="garden-adoption-particles"></div>
                <div class="glass-panel" id="garden-adoption-panel">
                    <div class="page active" id="garden-adoption-page-list">
                        <div class="header"><h1>✨ 寻觅羁绊</h1><p>Find Your Companion</p></div>
                        <div class="pet-grid">${cardsMarkup}<button type="button" class="pet-card pet-card-create" data-adoption-action="open-custom"><div class="pet-info"><h3>➕ 创建我的宠物档案</h3><span>上传照片，自己定义新的小伙伴</span></div></button></div>
                    </div>
                    <div class="page" id="garden-adoption-page-custom">
                        <div class="header"><h1>宠物档案</h1><p>Pet Profile</p></div>
                        <div class="profile-box"><label class="profile-preview" for="garden-adoption-custom-image"><div class="profile-preview-icon">📸</div><div class="profile-preview-text">点击上传照片</div><img id="garden-adoption-custom-preview-image" alt="宠物预览"></label><div class="profile-grid"><div class="profile-field"><label for="garden-adoption-custom-breed">宠物品种</label><input id="garden-adoption-custom-breed" class="profile-input" type="text" maxlength="20" placeholder="例如：布偶猫 / 柯基"></div><div class="profile-field"><label for="garden-adoption-custom-gender">宠物性别</label><select id="garden-adoption-custom-gender" class="profile-select"><option value="">请选择</option><option value="男孩子">男孩子</option><option value="女孩子">女孩子</option></select></div><div class="profile-field"><label for="garden-adoption-custom-name">宠物名字</label><input id="garden-adoption-custom-name" class="profile-input" type="text" maxlength="20" placeholder="给它起个名字"></div><div class="profile-field"><label for="garden-adoption-custom-personality">宠物性格</label><input id="garden-adoption-custom-personality" class="profile-input" type="text" maxlength="30" placeholder="例如：粘人、元气、温柔"></div></div><input id="garden-adoption-custom-image" class="profile-upload-input" type="file" accept="image/*"><div class="form-upload-tip">点击上方区域上传宠物照片，创建后会沿用你宠物页里的领养风格。</div></div>
                        <button type="button" class="btn-primary" data-adoption-action="create-custom"><i class="fas fa-sparkles"></i> 创建档案</button><button type="button" class="btn-secondary" data-adoption-action="back-list">返回列表</button>
                    </div>
                    <div class="page" id="garden-adoption-page-detail">
                        <div class="header"><h1>📖 灵魂共鸣</h1><p>Soul Resonance</p></div><div class="detail-avatar" id="garden-adoption-detail-visual">🐾</div>
                        <div class="detail-box"><h2 id="garden-adoption-detail-name">未命名</h2><p id="garden-adoption-detail-desc">它正等待与你相遇。</p></div>
                        <button type="button" class="btn-primary" data-adoption-action="to-cert"><i class="fas fa-feather-pointed"></i> 缔结契约</button><button type="button" class="btn-secondary" data-adoption-action="back-list">重新寻觅</button>
                    </div>
                    <div class="page" id="garden-adoption-page-cert">
                        <div class="header"><h1>📜 庄严誓约</h1><p>Solemn Vow</p></div>
                        <div class="certificate"><div class="cert-title">领 养 契 约</div><div class="cert-content">星光为证，岁月为鉴。<br>我在此郑重立誓，自愿成为<br><span class="cert-pet-highlight" id="garden-adoption-cert-name" contenteditable="true" spellcheck="false">未命名</span> 的唯一守护者。<br>承诺无论疾病或健康，都将不离不弃；<br>提供温暖的居所与充足的食物；<br>相伴一生，直至星辰黯淡。</div><div class="signature-area"><span class="signature-label">守护人签名:</span><div class="signature-line"><span class="signature-text" id="garden-adoption-signature"></span></div></div><div class="stamp" id="garden-adoption-stamp"><span class="ch">契约达成</span><span class="en">BOND SEALED</span></div></div>
                        <div class="contract-form"><label class="contract-input-label" for="garden-adoption-guardian">守护人姓名</label><input id="garden-adoption-guardian" class="contract-name-input" type="text" maxlength="20" placeholder="请输入你的名字后再签署"></div>
                        <button type="button" class="btn-primary" id="garden-adoption-submit" data-adoption-action="sign"><i class="fas fa-pen-nib"></i> 郑重签署</button><button type="button" class="btn-secondary" data-adoption-action="back-detail">返回详情</button>
                    </div>
                    <div class="curtain" id="garden-adoption-curtain">✨ 欢迎回家 ✨</div>
                </div>
            </div>
        `;
    }

    function switchPetAdoptionPage(pageId) {
        if (!petAdoptionRootEl) return;
        petAdoptionRootEl.querySelectorAll('.page').forEach((page) => {
            page.classList.toggle('active', page.id === pageId);
        });
    }

    function renderPetAdoptionVisual(targetEl) {
        if (!targetEl) return;
        targetEl.innerHTML = '';
        if (petAdoptionState.currentPet && petAdoptionState.currentPet.imageSrc) {
            const img = document.createElement('img');
            img.className = 'pet-visual-image';
            img.src = petAdoptionState.currentPet.imageSrc;
            img.alt = petAdoptionState.currentPet.name || '宠物';
            targetEl.appendChild(img);
            return;
        }
        targetEl.textContent = petAdoptionState.currentPet && petAdoptionState.currentPet.icon ? petAdoptionState.currentPet.icon : '🐾';
    }

    function renderPetAdoptionDetails() {
        renderPetAdoptionVisual(getPetAdoptionEl('#garden-adoption-detail-visual'));
        const detailNameEl = getPetAdoptionEl('#garden-adoption-detail-name');
        const detailDescEl = getPetAdoptionEl('#garden-adoption-detail-desc');
        if (detailNameEl) detailNameEl.textContent = petAdoptionState.currentPet.name || '未命名';
        if (detailDescEl) detailDescEl.textContent = petAdoptionState.currentPet.desc || '它正等待与你相遇。';
    }

    function resetPetAdoptionCustomForm() {
        const breedInput = getPetAdoptionEl('#garden-adoption-custom-breed');
        const genderInput = getPetAdoptionEl('#garden-adoption-custom-gender');
        const nameInput = getPetAdoptionEl('#garden-adoption-custom-name');
        const personalityInput = getPetAdoptionEl('#garden-adoption-custom-personality');
        const imageInput = getPetAdoptionEl('#garden-adoption-custom-image');
        const previewBox = getPetAdoptionEl('.profile-preview');
        const previewImage = getPetAdoptionEl('#garden-adoption-custom-preview-image');
        if (breedInput) breedInput.value = '';
        if (genderInput) genderInput.value = '';
        if (nameInput) nameInput.value = '';
        if (personalityInput) personalityInput.value = '';
        if (imageInput) imageInput.value = '';
        if (previewImage) previewImage.removeAttribute('src');
        if (previewBox) previewBox.classList.remove('has-image');
        petAdoptionState.customPetImageData = '';
    }

    function openCustomPetAdoptionPage() {
        resetPetAdoptionCustomForm();
        switchPetAdoptionPage('garden-adoption-page-custom');
    }

    function selectPetForAdoption(pet) {
        petAdoptionState.currentPet = {
            icon: pet.icon,
            name: pet.name,
            desc: pet.desc,
            imageSrc: pet.imageSrc,
            breed: '',
            gender: '',
            personality: '',
            hunger: 50,
            mood: 60
        };
        renderPetAdoptionDetails();
        switchPetAdoptionPage('garden-adoption-page-detail');
    }

    function createCustomPetForAdoption() {
        const breedInput = getPetAdoptionEl('#garden-adoption-custom-breed');
        const genderInput = getPetAdoptionEl('#garden-adoption-custom-gender');
        const nameInput = getPetAdoptionEl('#garden-adoption-custom-name');
        const personalityInput = getPetAdoptionEl('#garden-adoption-custom-personality');
        const breed = normalizeAdoptionText(breedInput ? breedInput.value : '');
        const gender = genderInput ? genderInput.value : '';
        const name = normalizeAdoptionText(nameInput ? nameInput.value : '');
        const personality = normalizeAdoptionText(personalityInput ? personalityInput.value : '');

        if (!breed || !gender || !name || !personality || !petAdoptionState.customPetImageData) {
            window.alert('请完整填写宠物品种、性别、名字、性格，并上传一张宠物图片。');
            return;
        }

        petAdoptionState.currentPet = {
            icon: '🐾',
            name,
            desc: `${name}是一只${gender}的${breed}，性格${personality}。从现在开始，它会把全部的小情绪和小快乐都交给你。`,
            imageSrc: petAdoptionState.customPetImageData,
            breed,
            gender,
            personality,
            hunger: 50,
            mood: 60
        };
        renderPetAdoptionDetails();
        switchPetAdoptionPage('garden-adoption-page-detail');
    }

    function syncPetAdoptionNameFromContract() {
        const petNameEl = getPetAdoptionEl('#garden-adoption-cert-name');
        if (!petNameEl) return '';
        const nextName = normalizeAdoptionText(petNameEl.innerText) || petAdoptionState.currentPet.name || '未命名';
        petNameEl.innerText = nextName;
        petAdoptionState.currentPet.name = nextName;
        renderPetAdoptionDetails();
        return nextName;
    }

    function moveCaretToEnd(element) {
        if (!element) return;
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function goToPetAdoptionCert() {
        if (!petAdoptionState.currentPet || !petAdoptionState.currentPet.name) return;
        const nameEl = getPetAdoptionEl('#garden-adoption-cert-name');
        const signatureEl = getPetAdoptionEl('#garden-adoption-signature');
        const stampEl = getPetAdoptionEl('#garden-adoption-stamp');
        const buttonEl = getPetAdoptionEl('#garden-adoption-submit');
        const guardianInput = getPetAdoptionEl('#garden-adoption-guardian');
        if (nameEl) nameEl.innerText = petAdoptionState.currentPet.name;
        if (signatureEl) {
            signatureEl.textContent = '';
            signatureEl.classList.remove('writing');
        }
        if (stampEl) stampEl.classList.remove('smash');
        if (guardianInput) guardianInput.value = '';
        petAdoptionState.guardianName = '';
        if (buttonEl) {
            buttonEl.className = 'btn-primary';
            buttonEl.dataset.adoptionAction = 'sign';
            buttonEl.innerHTML = '<i class="fas fa-pen-nib"></i> 郑重签署';
            buttonEl.style.pointerEvents = 'auto';
        }
        switchPetAdoptionPage('garden-adoption-page-cert');
    }

    function createPetAdoptionSparkles() {
        const container = getPetAdoptionEl('#garden-adoption-particles');
        const panel = getPetAdoptionEl('#garden-adoption-panel');
        if (!container || !panel) return;
        const rect = panel.getBoundingClientRect();
        const centerX = rect.left + (rect.width * 0.5);
        const centerY = rect.top + (rect.height * 0.4);

        for (let i = 0; i < 28; i += 1) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            container.appendChild(particle);
            const angle = Math.random() * Math.PI * 2;
            const velocity = 40 + Math.random() * 90;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity;
            particle.animate([
                { transform: 'translate(0,0) scale(1)', opacity: 1 },
                { transform: `translate(${tx}px, ${ty - 40}px) scale(1.4)`, opacity: 1, offset: 0.4 },
                { transform: `translate(${tx * 1.45}px, ${ty + 90}px) scale(0)`, opacity: 0 }
            ], {
                duration: 820 + Math.random() * 320,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                fill: 'forwards'
            });
            window.setTimeout(() => particle.remove(), 1200);
        }
    }

    function resetPetAdoptionFlow() {
        petAdoptionState.currentPet = createEmptyAdoptionPet();
        petAdoptionState.guardianName = '';
        petAdoptionState.customPetImageData = '';
        resetPetAdoptionCustomForm();
        const curtain = getPetAdoptionEl('#garden-adoption-curtain');
        const panel = getPetAdoptionEl('#garden-adoption-panel');
        if (curtain) curtain.classList.remove('show');
        if (panel) panel.classList.remove('shake-screen');
        switchPetAdoptionPage('garden-adoption-page-list');
    }

    function completePetAdoptionToGarden() {
        const curtain = getPetAdoptionEl('#garden-adoption-curtain');
        if (curtain) curtain.classList.add('show');
        window.setTimeout(() => {
            addAdoptedPetToGarden(petAdoptionState.currentPet);
            closePetAdoptionOverlay();
            if (window.showChatToast) window.showChatToast('新伙伴已经到家啦 ✨', 2200);
        }, 620);
    }

    function startPetAdoptionRitual() {
        syncPetAdoptionNameFromContract();
        const guardianInput = getPetAdoptionEl('#garden-adoption-guardian');
        const buttonEl = getPetAdoptionEl('#garden-adoption-submit');
        const signatureEl = getPetAdoptionEl('#garden-adoption-signature');
        const stampEl = getPetAdoptionEl('#garden-adoption-stamp');
        const panel = getPetAdoptionEl('#garden-adoption-panel');
        const guardianName = normalizeAdoptionText(guardianInput ? guardianInput.value : '');
        if (!guardianName) {
            if (guardianInput) {
                guardianInput.focus();
                guardianInput.placeholder = '请先输入你的名字';
            }
            return;
        }

        petAdoptionState.guardianName = guardianName;
        if (buttonEl) {
            buttonEl.style.pointerEvents = 'none';
            buttonEl.innerHTML = '正在签署...';
        }
        if (signatureEl) {
            signatureEl.classList.remove('writing');
            signatureEl.textContent = guardianName;
            void signatureEl.offsetWidth;
            signatureEl.classList.add('writing');
        }

        window.setTimeout(() => {
            if (buttonEl) buttonEl.innerHTML = '盖章确认中...';
            if (stampEl) stampEl.classList.add('smash');
            window.setTimeout(() => {
                if (panel) panel.classList.add('shake-screen');
                vibrate(50);
                createPetAdoptionSparkles();
            }, 300);
            window.setTimeout(() => {
                if (panel) panel.classList.remove('shake-screen');
                if (buttonEl) {
                    buttonEl.innerHTML = '<i class="fas fa-house"></i> 仪式完成 · 带它回家';
                    buttonEl.classList.add('btn-gold');
                    buttonEl.dataset.adoptionAction = 'complete';
                    buttonEl.style.pointerEvents = 'auto';
                }
            }, 1000);
        }, 1400);
    }

    function ensurePetAdoptionUi() {
        if (!petAdoptionRootEl || petAdoptionRootEl.dataset.ready === 'true') return;
        petAdoptionRootEl.innerHTML = buildPetAdoptionMarkup();
        petAdoptionRootEl.dataset.ready = 'true';

        petAdoptionRootEl.addEventListener('click', (event) => {
            const petCard = event.target.closest('[data-adoption-pet]');
            if (petCard) {
                const pet = getPresetPetById(petCard.dataset.adoptionPet);
                if (pet) selectPetForAdoption(pet);
                return;
            }

            const actionBtn = event.target.closest('[data-adoption-action]');
            if (!actionBtn) return;
            const action = actionBtn.dataset.adoptionAction;
            if (action === 'open-custom') openCustomPetAdoptionPage();
            if (action === 'back-list') switchPetAdoptionPage('garden-adoption-page-list');
            if (action === 'back-detail') switchPetAdoptionPage('garden-adoption-page-detail');
            if (action === 'create-custom') createCustomPetForAdoption();
            if (action === 'to-cert') goToPetAdoptionCert();
            if (action === 'sign') startPetAdoptionRitual();
            if (action === 'complete') completePetAdoptionToGarden();
        });

        const certNameEl = getPetAdoptionEl('#garden-adoption-cert-name');
        if (certNameEl) {
            certNameEl.addEventListener('focus', () => moveCaretToEnd(certNameEl));
            certNameEl.addEventListener('blur', syncPetAdoptionNameFromContract);
            certNameEl.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    certNameEl.blur();
                }
            });
        }

        const imageInput = getPetAdoptionEl('#garden-adoption-custom-image');
        if (imageInput) {
            imageInput.addEventListener('change', (event) => {
                const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
                const previewBox = getPetAdoptionEl('.profile-preview');
                const previewImage = getPetAdoptionEl('#garden-adoption-custom-preview-image');
                if (!file) {
                    petAdoptionState.customPetImageData = '';
                    if (previewImage) previewImage.removeAttribute('src');
                    if (previewBox) previewBox.classList.remove('has-image');
                    return;
                }

                const reader = new FileReader();
                reader.onload = () => {
                    petAdoptionState.customPetImageData = typeof reader.result === 'string' ? reader.result : '';
                    if (previewImage) previewImage.src = petAdoptionState.customPetImageData;
                    if (previewBox) previewBox.classList.add('has-image');
                };
                reader.readAsDataURL(file);
            });
        }
    }

    function openPetAdoptionOverlay() {
        ensurePetAdoptionUi();
        resetPetAdoptionFlow();
        if (petAdoptionOverlayEl) {
            petAdoptionOverlayEl.classList.remove('hidden');
            petAdoptionOverlayEl.setAttribute('aria-hidden', 'false');
        }
        setDrawerOpen(false);
        vibrate(20);
    }

    function closePetAdoptionOverlay() {
        if (petAdoptionOverlayEl) {
            petAdoptionOverlayEl.classList.add('hidden');
            petAdoptionOverlayEl.setAttribute('aria-hidden', 'true');
        }
        resetPetAdoptionFlow();
    }

    function buildPetCareMarkup(pet) {
        return `
            <style>
                #garden-pet-care-root{--primary:#f4cd7a;--text-main:#6b5635;--text-light:#9b8359;--glass-bg:rgba(255,250,236,.78);--shadow:0 12px 40px rgba(214,174,92,.22);position:relative;width:100%;height:100%;overflow:hidden;font-family:'PingFang SC','Helvetica Neue',Helvetica,Arial,sans-serif;color:var(--text-main)}
                #garden-pet-care-root *{box-sizing:border-box}
                #garden-pet-care-root .shell{position:relative;width:100%;height:100%;display:flex;justify-content:center;align-items:center;background:#fff9eb}
                #garden-pet-care-root .bg-shapes{position:absolute;inset:0;overflow:hidden;pointer-events:none;background:radial-gradient(circle at 50% 40%,#fffef9 0%,#fff4d9 100%)}
                #garden-pet-care-root .shape{position:absolute;border-radius:50%;filter:blur(80px);opacity:.46;animation:gardenPetFloat 12s infinite alternate ease-in-out}
                #garden-pet-care-root .shape-1{width:42vh;height:42vh;background:#ffe39b;top:-12%;left:-10%}
                #garden-pet-care-root .shape-2{width:52vh;height:52vh;background:#ffd6a6;right:-16%;bottom:-18%;animation-delay:-6s}
                #garden-pet-care-root .glass-panel{position:relative;width:min(92vw,430px);height:min(86vh,820px);background:var(--glass-bg);border:1px solid rgba(255,255,255,.82);border-radius:28px;box-shadow:var(--shadow);backdrop-filter:blur(18px);overflow:hidden;padding:52px 24px 24px;display:flex;flex-direction:column}
                #garden-pet-care-root .header{text-align:center;margin-bottom:18px;position:relative;z-index:2}
                #garden-pet-care-root .header h1{font-size:25px;font-weight:700;letter-spacing:2px;margin:0}
                #garden-pet-care-root .header p{margin-top:6px;font-size:11px;color:var(--text-light);letter-spacing:3px;text-transform:uppercase}
                #garden-pet-care-root .home-scene{flex:1;display:flex;flex-direction:column}
                #garden-pet-care-root .pet-care-status-card{display:block;width:100%;margin:0 0 22px;padding:18px;background:linear-gradient(180deg,rgba(255,254,245,.94) 0%,rgba(255,246,214,.90) 100%);border:2px solid rgba(255,255,255,.95);border-radius:24px;box-shadow:0 8px 0 rgba(225,212,176,.5),0 16px 24px rgba(186,162,103,.1);position:relative;z-index:2}
                #garden-pet-care-root .pet-care-status-row{display:flex;align-items:center;gap:12px;margin-bottom:12px}
                #garden-pet-care-root .pet-care-status-row:last-child{margin-bottom:0}
                #garden-pet-care-root .pet-care-status-icon{width:30px;flex:0 0 30px;font-size:16px;line-height:1;text-align:center}
                #garden-pet-care-root .pet-care-status-track{flex:1;height:14px;background:rgba(142,160,187,.14);border-radius:999px;overflow:hidden;box-shadow:inset 0 2px 4px rgba(0,0,0,.05)}
                #garden-pet-care-root .pet-care-status-fill{height:100%;width:0;border-radius:999px;transition:width .4s cubic-bezier(.34,1.56,.64,1)}
                #garden-pet-care-root .pet-care-status-fill-hunger{background:linear-gradient(90deg,#ffc3a0 0%,#ffafbd 100%)}
                #garden-pet-care-root .pet-care-status-fill-mood{background:linear-gradient(90deg,#d4fc79 0%,#96e6a1 100%)}
                #garden-pet-care-root .pet-stage{flex:1;display:flex;justify-content:center;align-items:center;position:relative;transition:transform .2s;min-height:250px;margin-bottom:2px}
                #garden-pet-care-root .pet-stage.has-image .pet-care-image{width:180px;height:180px;object-fit:contain;display:block;filter:drop-shadow(0 12px 18px rgba(122,145,180,.18))}
                #garden-pet-care-root .pet-name{position:absolute;top:6px;left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:999px;background:rgba(255,255,255,.76);color:var(--text-main);font-size:14px;font-weight:700}
                #garden-pet-care-root .actions{margin-top:auto;display:flex;justify-content:space-around;background:rgba(255,255,255,.72);padding:20px 10px;border-radius:24px;box-shadow:0 4px 15px rgba(0,0,0,.03)}
                #garden-pet-care-root .action-btn{display:flex;flex-direction:column;align-items:center;cursor:pointer;border:none;background:transparent}
                #garden-pet-care-root .action-icon{width:56px;height:56px;background:#fff;border-radius:50%;display:flex;justify-content:center;align-items:center;font-size:26px;box-shadow:0 4px 12px rgba(0,0,0,.06);margin-bottom:8px;transition:all .2s}
                #garden-pet-care-root .action-btn:active .action-icon{transform:scale(.85);background:#f0f4f8}
                #garden-pet-care-root .action-name{font-size:12px;color:var(--text-main);font-weight:600;letter-spacing:1px}
                .pet-care-floating{position:absolute;font-size:24px;opacity:0;pointer-events:none;animation:floatUpFade 1s ease-out forwards}
                @keyframes gardenPetFloat{from{transform:translate(0,0) scale(1)}to{transform:translate(36px,52px) scale(1.1)}}
                @keyframes floatUpFade{0%{opacity:1;transform:translateY(0) scale(.8)}50%{opacity:1;transform:translateY(-30px) scale(1.2)}100%{opacity:0;transform:translateY(-60px) scale(1)}}
            </style>
            <div class="shell">
                <div class="bg-shapes"><div class="shape shape-1"></div><div class="shape shape-2"></div></div>
                <div class="glass-panel">
                    <div class="header"><h1>🏡 我们的家</h1><p>Our Sanctuary</p></div>
                    <div class="home-scene">
                        <div class="pet-care-status-card">
                            <div class="pet-care-status-row">
                                <span class="pet-care-status-icon">🍗</span>
                                <div class="pet-care-status-track"><div class="pet-care-status-fill pet-care-status-fill-hunger" id="garden-pet-care-bar-hunger"></div></div>
                            </div>
                            <div class="pet-care-status-row">
                                <span class="pet-care-status-icon">💖</span>
                                <div class="pet-care-status-track"><div class="pet-care-status-fill pet-care-status-fill-mood" id="garden-pet-care-bar-mood"></div></div>
                            </div>
                        </div>
                        <div class="pet-stage has-image" id="garden-pet-care-stage">
                            <div class="pet-name">${pet.name}</div>
                            <img class="pet-care-image" src="${pet.imageSrc}" alt="${pet.name}">
                        </div>
                        <div class="actions">
                            <button class="action-btn" type="button" data-pet-care-action="feed"><div class="action-icon">🥣</div><div class="action-name">投喂</div></button>
                            <button class="action-btn" type="button" data-pet-care-action="play"><div class="action-icon">🎾</div><div class="action-name">玩耍</div></button>
                            <button class="action-btn" type="button" data-pet-care-action="pet"><div class="action-icon">🖐️</div><div class="action-name">抚摸</div></button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function syncPetCareBars(pet) {
        const hungerBar = petCareRootEl ? petCareRootEl.querySelector('#garden-pet-care-bar-hunger') : null;
        const moodBar = petCareRootEl ? petCareRootEl.querySelector('#garden-pet-care-bar-mood') : null;
        if (hungerBar) hungerBar.style.width = `${pet.hunger}%`;
        if (moodBar) moodBar.style.width = `${pet.mood}%`;
    }

    function createPetCareFloatingEmoji(emoji) {
        const stage = petCareRootEl ? petCareRootEl.querySelector('#garden-pet-care-stage') : null;
        if (!stage) return;
        const el = document.createElement('div');
        el.className = 'pet-care-floating';
        el.textContent = emoji;
        const leftOffset = (Math.random() - 0.5) * 80;
        el.style.left = `calc(50% + ${leftOffset}px - 12px)`;
        el.style.top = '35%';
        stage.appendChild(el);
        window.setTimeout(() => el.remove(), 1000);
    }

    function openPetCareOverlay(petId) {
        const pet = getOwnedAdoptedPetById(petId);
        if (!pet || !petCareRootEl || !petCareOverlayEl) return;
        petCareRootEl.dataset.petId = pet.id;
        petCareRootEl.innerHTML = buildPetCareMarkup(pet);
        petCareRootEl.onclick = (event) => {
            const actionBtn = event.target.closest('[data-pet-care-action]');
            if (!actionBtn) return;
            handlePetCareAction(actionBtn.dataset.petCareAction);
        };
        syncPetCareBars(pet);
        petCareOverlayEl.classList.remove('hidden');
        petCareOverlayEl.setAttribute('aria-hidden', 'false');
        setDrawerOpen(false);
        vibrate(20);
    }

    function closePetCareOverlay() {
        if (petCareOverlayEl) {
            petCareOverlayEl.classList.add('hidden');
            petCareOverlayEl.setAttribute('aria-hidden', 'true');
        }
        if (petCareRootEl) {
            petCareRootEl.onclick = null;
            petCareRootEl.innerHTML = '';
            petCareRootEl.removeAttribute('data-pet-id');
        }
    }

    function handlePetCareAction(action) {
        if (!petCareRootEl) return;
        const petId = petCareRootEl.dataset.petId || '';
        const pet = getOwnedAdoptedPetById(petId);
        const stage = petCareRootEl.querySelector('#garden-pet-care-stage');
        if (!pet || !stage) return;

        let nextHunger = pet.hunger;
        let nextMood = pet.mood;
        let emoji = '💖';
        if (action === 'feed') {
            nextHunger = Math.min(100, pet.hunger + 15);
            emoji = '🍗';
        } else if (action === 'play') {
            nextHunger = Math.max(0, pet.hunger - 5);
            nextMood = Math.min(100, pet.mood + 15);
            emoji = '🎵';
        } else if (action === 'pet') {
            nextMood = Math.min(100, pet.mood + 10);
            emoji = '💖';
        }

        const nextPet = updateOwnedAdoptedPet(null, petId, { hunger: nextHunger, mood: nextMood });
        if (!nextPet) return;
        syncPetCareBars(nextPet);
        createPetCareFloatingEmoji(emoji);
        stage.style.transform = 'scale(1.08)';
        window.setTimeout(() => { stage.style.transform = 'scale(1)'; }, 150);
        vibrate(15);
    }

    function createDefaultRogueNodeState(nodeType, actIndex, depthIndex, options) {
        return {
            id: `rogue_v2_node_${actIndex}_${depthIndex}_${nodeType}_${Math.random().toString(36).slice(2, 7)}`,
            type: nodeType,
            actIndex,
            depthIndex,
            routeIndex: options && Number.isFinite(options.routeIndex) ? options.routeIndex : 0,
            isCleared: false,
            isElite: nodeType === 'elite',
            isBoss: nodeType === 'boss'
        };
    }

    function pickRandomNodeType(pool) {
        if (!Array.isArray(pool) || !pool.length) return 'event';
        return pool[Math.floor(Math.random() * pool.length)] || 'event';
    }

    function pickNodeChoicesForDepthV2(pool, actIndex, depthIndex) {
        const sourcePool = Array.isArray(pool) && pool.length ? [...pool] : ['event'];
        const uniqueTypes = [...new Set(sourcePool)];
        const preferredByAct = actIndex === 1
            ? ['farm', 'pasture', 'rest', 'event', 'merchant']
            : actIndex === 2
                ? ['kitchen', 'farm', 'pasture', 'event', 'merchant', 'rest']
                : ['market', 'kitchen', 'farm', 'pasture', 'event', 'merchant', 'rest'];
        const preferredAvailable = preferredByAct.filter((type) => uniqueTypes.includes(type));
        const choices = [];

        preferredAvailable.forEach((type) => {
            if (choices.length >= 3) return;
            if (!choices.includes(type)) choices.push(type);
        });

        const shuffledUnique = uniqueTypes.sort(() => Math.random() - 0.5);
        shuffledUnique.forEach((type) => {
            if (choices.length >= 3) return;
            if (!choices.includes(type)) choices.push(type);
        });

        while (choices.length < 3) {
            const fallback = pickRandomNodeType(sourcePool);
            if (choices.length < 2 && choices.includes(fallback) && uniqueTypes.length > choices.length) continue;
            choices.push(fallback);
        }

        if (depthIndex === 0 && actIndex === 1 && !choices.includes('farm')) {
            choices[0] = 'farm';
        }
        if (depthIndex === 1 && actIndex >= 2 && !choices.includes('kitchen') && uniqueTypes.includes('kitchen')) {
            choices[Math.min(1, choices.length - 1)] = 'kitchen';
        }
        if (depthIndex >= 1 && actIndex === 3 && !choices.includes('market') && uniqueTypes.includes('market')) {
            choices[choices.length - 1] = 'market';
        }

        return choices.slice(0, 3);
    }

    function createRogueMapStateV2() {
        const acts = [1, 2, 3].map((actIndex) => {
            const actPool = ROGUE_NODE_POOL_V2[actIndex] || ROGUE_NODE_POOL_V2[1];
            const routes = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => null));
            Array.from({ length: 3 }, (_, depthIndex) => {
                const nodeChoices = pickNodeChoicesForDepthV2(actPool.normal, actIndex, depthIndex);
                nodeChoices.forEach((nodeType, routeIndex) => {
                    routes[routeIndex][depthIndex] = createDefaultRogueNodeState(
                        nodeType,
                        actIndex,
                        depthIndex,
                        { routeIndex }
                    );
                });
            });
            const climaxNode = createDefaultRogueNodeState(actPool.elite, actIndex, 3, { routeIndex: 0 });
            return { actIndex, routes, climaxNode };
        });
        return { acts };
    }

    function createDefaultRogueRunStateV2(loadoutId) {
        const loadout = ROGUE_V2_STARTER_LOADOUTS[loadoutId] || ROGUE_V2_STARTER_LOADOUTS.farmer;
        const inventory = createEmptyInventory();
        const map = createRogueMapStateV2();
        const firstAct = Array.isArray(map.acts) ? map.acts.find((act) => Number(act.actIndex) === 1) : null;
        const firstNode = firstAct && Array.isArray(firstAct.routes) && firstAct.routes[0]
            ? firstAct.routes[0][0] || null
            : null;
        Object.entries(loadout.startInventory || {}).forEach(([itemId, amount]) => {
            if (!ITEM_META[itemId]) return;
            inventory[itemId] = Math.max(0, Math.floor(Number(amount) || 0));
        });
        return {
            version: 2,
            starterRoleId: loadout.id,
            map,
            actIndex: 1,
            depthIndex: 0,
            currentNode: firstNode,
            day: 1,
            cycleIndex: 1,
            cycleDay: 1,
            dailyAP: 6,
            apRemaining: 6,
            runCoins: loadout.startCoins,
            cycleDebtTarget: 240,
            cycleDebtPaid: 0,
            inventoryCapacity: 16,
            moraleCap: 3,
            morale: 3,
            currentWeather: 'sunny',
            currentMarket: { focus: 'crops', modifiers: { crops: 1, products: 1, cooked: 1 } },
            currentGuestEvent: null,
            runInventory: inventory,
            farm: {
                level: 1,
                plots: Array.from({ length: loadout.id === 'farmer' ? 9 : 6 }, () => ({ ...createEmptyFarmPlotState(), growDaysLeft: 0, wateredToday: false, mutated: false }))
            },
            pasture: {
                level: 1,
                animals: createInitialPastureAnimals().slice(0, loadout.id === 'rancher' ? 3 : 2)
            },
            kitchen: {
                level: 1,
                glowingDishChance: 0
            },
            relics: loadout.starterRelicId ? [loadout.starterRelicId] : [],
            recipesUnlocked: loadout.id === 'chef' ? ['bread', 'salad', 'pizza'] : ['bread', 'salad'],
            currentDraft: null,
            completed: false,
            victory: false,
            gameOverReason: '',
            storage: { tab: 'crops' },
            introConfirmed: false,
            runTools: {}
        };
    }

    function createEmptyFarmPlotState() {
        return {
            state: 'empty',
            seedId: '',
            readyAt: null,
            growDuration: null
        };
    }

    function createInitialPastureAnimals() {
        return [
            { id: 'starter_chicken_1', type: 'chicken', age: 'baby', state: 'hungry', x: 30, y: 40, stateEndsAt: null },
            { id: 'starter_chicken_2', type: 'chicken', age: 'adult', state: 'hungry', x: 70, y: 60, stateEndsAt: null }
        ];
    }

    function normalizeRogueMetaStateV2(rawState) {
        const defaults = createDefaultRogueMetaStateV2();
        if (!rawState || typeof rawState !== 'object') return defaults;
        const workshopLevels = rawState.workshopLevels && typeof rawState.workshopLevels === 'object'
            ? Object.keys(rawState.workshopLevels).reduce((result, key) => {
                result[key] = Math.max(0, Math.floor(Number(rawState.workshopLevels[key]) || 0));
                return result;
            }, {})
            : {};
        const unlockedLoadouts = Array.isArray(rawState.unlockedLoadouts)
            ? Array.from(new Set([
                ...defaults.unlockedLoadouts,
                ...rawState.unlockedLoadouts.filter((item) => !!ROGUE_V2_STARTER_LOADOUTS[item])
            ]))
            : defaults.unlockedLoadouts;
        return {
            workshopCurrency: Math.max(0, Math.floor(Number(rawState.workshopCurrency) || 0)),
            ascensionLevel: Math.max(0, Math.floor(Number(rawState.ascensionLevel) || 0)),
            highestActCleared: Math.max(0, Math.floor(Number(rawState.highestActCleared) || 0)),
            unlockedLoadouts,
            workshopLevels,
            seenRelics: Array.isArray(rawState.seenRelics) ? rawState.seenRelics.filter((id) => !!ROGUE_RELIC_POOL_V2[id]) : [],
            seenEvents: Array.isArray(rawState.seenEvents) ? rawState.seenEvents.filter((id) => !!ROGUE_EVENT_POOL_V2[id]) : []
        };
    }

    function normalizeRogueRunStateV2(rawState) {
        if (!rawState || typeof rawState !== 'object' || Number(rawState.version) !== 2) return null;
        const roleId = ROGUE_V2_STARTER_LOADOUTS[rawState.starterRoleId] ? rawState.starterRoleId : 'farmer';
        const defaults = createDefaultRogueRunStateV2(roleId);
        const map = rawState.map && Array.isArray(rawState.map.acts) ? rawState.map : defaults.map;
        const actIndex = Math.max(1, Math.min(3, Math.floor(Number(rawState.actIndex) || defaults.actIndex)));
        const depthIndex = Math.max(0, Math.min(3, Math.floor(Number(rawState.depthIndex) || defaults.depthIndex)));
        const activeAct = Array.isArray(map.acts)
            ? map.acts.find((act) => Number(act.actIndex) === Number(actIndex)) || null
            : null;
        const fallbackNode = depthIndex >= 3
            ? (activeAct && activeAct.climaxNode ? activeAct.climaxNode : null)
            : (activeAct && Array.isArray(activeAct.routes)
                ? activeAct.routes
                    .map((route) => Array.isArray(route) ? route[depthIndex] : null)
                    .find(Boolean) || null
                : null);
        const inventory = createEmptyInventory();
        Object.keys(inventory).forEach((itemId) => {
            inventory[itemId] = Math.max(0, Math.floor(Number(rawState.runInventory && rawState.runInventory[itemId]) || 0));
        });
        return {
            ...defaults,
            starterRoleId: roleId,
            map,
            actIndex,
            depthIndex,
            currentNode: rawState.currentNode && typeof rawState.currentNode === 'object' ? rawState.currentNode : fallbackNode,
            day: Math.max(1, Math.floor(Number(rawState.day) || defaults.day)),
            cycleIndex: Math.max(1, Math.floor(Number(rawState.cycleIndex) || defaults.cycleIndex)),
            cycleDay: Math.max(1, Math.min(7, Math.floor(Number(rawState.cycleDay) || defaults.cycleDay))),
            dailyAP: Math.max(1, Math.floor(Number(rawState.dailyAP) || defaults.dailyAP)),
            apRemaining: Math.max(0, Math.floor(Number(rawState.apRemaining) || defaults.apRemaining)),
            runCoins: Math.max(0, Math.floor(Number(rawState.runCoins) || defaults.runCoins)),
            cycleDebtTarget: Math.max(0, Math.floor(Number(rawState.cycleDebtTarget) || defaults.cycleDebtTarget)),
            cycleDebtPaid: Math.max(0, Math.floor(Number(rawState.cycleDebtPaid) || defaults.cycleDebtPaid)),
            inventoryCapacity: Math.max(4, Math.floor(Number(rawState.inventoryCapacity) || defaults.inventoryCapacity)),
            moraleCap: Math.max(1, Math.floor(Number(rawState.moraleCap) || defaults.moraleCap)),
            morale: Math.max(0, Math.min(
                Math.max(1, Math.floor(Number(rawState.moraleCap) || defaults.moraleCap)),
                Math.floor(Number(rawState.morale))
            || defaults.morale)),
            currentWeather: rawState.currentWeather ? String(rawState.currentWeather) : defaults.currentWeather,
            currentMarket: rawState.currentMarket && typeof rawState.currentMarket === 'object' ? rawState.currentMarket : defaults.currentMarket,
            currentGuestEvent: rawState.currentGuestEvent || null,
            runInventory: inventory,
            farm: rawState.farm && typeof rawState.farm === 'object' ? rawState.farm : defaults.farm,
            pasture: rawState.pasture && typeof rawState.pasture === 'object' ? rawState.pasture : defaults.pasture,
            kitchen: rawState.kitchen && typeof rawState.kitchen === 'object' ? rawState.kitchen : defaults.kitchen,
            relics: Array.isArray(rawState.relics) ? rawState.relics.filter((id) => !!ROGUE_RELIC_POOL_V2[id]) : defaults.relics,
            recipesUnlocked: Array.isArray(rawState.recipesUnlocked) ? rawState.recipesUnlocked.filter((id) => !!KITCHEN_RECIPES[id]) : defaults.recipesUnlocked,
            currentDraft: rawState.currentDraft || null,
            completed: !!rawState.completed,
            victory: !!rawState.victory,
            gameOverReason: rawState.gameOverReason ? String(rawState.gameOverReason) : '',
            storage: rawState.storage && typeof rawState.storage === 'object' ? rawState.storage : defaults.storage,
            introConfirmed: !!rawState.introConfirmed,
            runTools: rawState.runTools && typeof rawState.runTools === 'object' ? rawState.runTools : {}
        };
    }

    function normalizeRogueModifierState(rawModifier) {
        if (!rawModifier || typeof rawModifier !== 'object') return null;
        const remaining = isFiniteNumber(Number(rawModifier.remaining)) ? Math.max(0, Math.floor(Number(rawModifier.remaining))) : null;
        const value = isFiniteNumber(Number(rawModifier.value)) ? Number(rawModifier.value) : null;
        const flags = Array.isArray(rawModifier.flags)
            ? rawModifier.flags.map((flag) => String(flag)).filter(Boolean)
            : [];
        return { remaining, value, flags };
    }

    function normalizeRogueOffer(rawOffer) {
        if (!rawOffer || typeof rawOffer !== 'object') return null;
        const context = ['farm', 'pasture', 'kitchen', 'sell'].includes(rawOffer.context) ? rawOffer.context : null;
        if (!context) return null;
        const cardIds = Array.isArray(rawOffer.cardIds)
            ? Array.from(new Set(rawOffer.cardIds.filter((cardId) => ROGUE_CARD_POOL[cardId] && ROGUE_CARD_POOL[cardId].context == context))).slice(0, 3)
            : [];
        if (!cardIds.length) return null;
        return { context, cardIds };
    }

    function normalizeRogueSupplyOffer(rawOffer) {
        if (!rawOffer || typeof rawOffer !== 'object') return null;
        const stage = ['farm', 'pasture', 'kitchen'].includes(rawOffer.stage) ? rawOffer.stage : null;
        if (!stage) return null;
        const optionIds = Array.isArray(rawOffer.optionIds)
            ? Array.from(new Set(rawOffer.optionIds.filter((optionId) => {
                return (STAGE_SUPPLY_POOL[stage] || []).some((entry) => entry.id === optionId);
            }))).slice(0, 3)
            : [];
        if (!optionIds.length) return null;
        return { stage, optionIds };
    }

    function normalizeRogueOrder(rawOrder) {
        if (!rawOrder || typeof rawOrder !== 'object') return null;
        const lines = Array.isArray(rawOrder.lines)
            ? rawOrder.lines.map((line) => {
                if (!line || typeof line !== 'object' || !ITEM_META[line.itemId]) return null;
                const requiredQty = isFiniteNumber(Number(line.requiredQty)) ? Math.max(1, Math.floor(Number(line.requiredQty))) : 1;
                const fulfilledQty = isFiniteNumber(Number(line.fulfilledQty))
                    ? Math.max(0, Math.min(requiredQty, Math.floor(Number(line.fulfilledQty))))
                    : 0;
                return { itemId: line.itemId, requiredQty, fulfilledQty };
            }).filter(Boolean).slice(0, 2)
            : [];
        if (!lines.length) return null;
        return {
            orderId: rawOrder.orderId ? String(rawOrder.orderId) : `rogue_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            title: rawOrder.title ? String(rawOrder.title) : '特殊订单',
            lines,
            baseValue: isFiniteNumber(Number(rawOrder.baseValue)) ? Math.max(0, Math.floor(Number(rawOrder.baseValue))) : 0,
            bonusGold: isFiniteNumber(Number(rawOrder.bonusGold)) ? Math.max(0, Math.floor(Number(rawOrder.bonusGold))) : 0
        };
    }

    function createDefaultGardenGameState(options) {
        const baseState = {
            coins: 250,
            inventory: createEmptyInventory(),
            contactStates: {},
            farm: {
                level: 1,
                exp: 0,
                plots: Array.from({ length: 9 }, () => createEmptyFarmPlotState())
            },
            pasture: {
                level: 2,
                animals: createInitialPastureAnimals()
            },
            storage: {
                tab: 'crops'
            }
        };
        return baseState;
    }

    function isFiniteNumber(value) {
        return typeof value === 'number' && Number.isFinite(value);
    }

    function formatFarmDuration(ms) {
        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function sanitizeStorageTab(tab) {
        return STORAGE_TABS[tab] ? tab : 'crops';
    }

    function normalizeInventory(rawInventory) {
        const inventory = createEmptyInventory();
        if (!rawInventory || typeof rawInventory !== 'object') return inventory;
        INVENTORY_ITEM_IDS.forEach((itemId) => {
            const count = Number(rawInventory[itemId]);
            inventory[itemId] = Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
        });
        return inventory;
    }

    function advanceFarmPlotByClock(plot, now) {
        if (!plot || plot.state !== 'growing' || !isFiniteNumber(plot.readyAt)) return false;
        if (plot.readyAt > now) return false;
        plot.state = 'ready';
        plot.readyAt = null;
        plot.growDuration = null;
        return true;
    }

    function normalizeFarmPlot(rawPlot, now) {
        const plot = createEmptyFarmPlotState();
        if (!rawPlot || typeof rawPlot !== 'object') return plot;

        const nextState = rawPlot.state;
        plot.state = nextState === 'planted' || nextState === 'growing' || nextState === 'ready' ? nextState : 'empty';
        plot.seedId = FARM_SEEDS[rawPlot.seedId] ? rawPlot.seedId : '';
        plot.readyAt = isFiniteNumber(rawPlot.readyAt) ? rawPlot.readyAt : null;
        plot.growDuration = isFiniteNumber(rawPlot.growDuration) ? Math.max(1000, Math.floor(rawPlot.growDuration)) : null;

        if (!plot.seedId) {
            return createEmptyFarmPlotState();
        }
        if (plot.state === 'empty') {
            return createEmptyFarmPlotState();
        }
        if (plot.state === 'ready') {
            plot.readyAt = null;
            plot.growDuration = null;
            return plot;
        }
        if (plot.state === 'planted') {
            plot.readyAt = null;
            plot.growDuration = null;
            return plot;
        }
        if (!isFiniteNumber(plot.readyAt)) {
            plot.state = 'planted';
            plot.readyAt = null;
            plot.growDuration = null;
            return plot;
        }
        if (!isFiniteNumber(plot.growDuration)) {
            const seed = FARM_SEEDS[plot.seedId];
            plot.growDuration = seed ? seed.time : null;
        }
        advanceFarmPlotByClock(plot, now);
        return plot;
    }

    function advancePastureAnimalByClock(animal, now) {
        let changed = false;
        while (animal && isFiniteNumber(animal.stateEndsAt) && animal.stateEndsAt <= now) {
            if (animal.state === 'growing') {
                animal.age = 'adult';
                animal.state = 'hungry';
                animal.stateEndsAt = null;
                changed = true;
                continue;
            }
            if (animal.state === 'producing') {
                animal.state = 'ready';
                animal.stateEndsAt = null;
                changed = true;
                continue;
            }
            animal.stateEndsAt = null;
            changed = true;
        }
        return changed;
    }

    function normalizePastureAnimal(rawAnimal, now) {
        if (!rawAnimal || typeof rawAnimal !== 'object') return null;
        if (!PASTURE_ANIMAL_DATA[rawAnimal.type]) return null;

        const animal = {
            id: rawAnimal.id ? String(rawAnimal.id) : `animal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type: rawAnimal.type,
            age: rawAnimal.age === 'adult' ? 'adult' : 'baby',
            state: ['hungry', 'growing', 'producing', 'ready'].includes(rawAnimal.state) ? rawAnimal.state : 'hungry',
            x: isFiniteNumber(Number(rawAnimal.x)) ? Number(rawAnimal.x) : 50,
            y: isFiniteNumber(Number(rawAnimal.y)) ? Number(rawAnimal.y) : 50,
            stateEndsAt: isFiniteNumber(Number(rawAnimal.stateEndsAt)) ? Number(rawAnimal.stateEndsAt) : null
        };
        if (animal.age === 'baby' && animal.state === 'ready') {
            animal.state = 'hungry';
        }
        if (animal.age === 'baby' && animal.state === 'producing') {
            animal.state = 'growing';
        }
        advancePastureAnimalByClock(animal, now);
        return animal;
    }

    function normalizeGardenGameState(rawState) {
        const defaults = createDefaultGardenGameState();
        const now = Date.now();
        if (!rawState || typeof rawState !== 'object') return defaults;

        const farmPlots = Array.from({ length: 9 }, (_, index) => normalizeFarmPlot(rawState.farm && rawState.farm.plots ? rawState.farm.plots[index] : null, now));
        const hasPastureAnimals = !!(rawState.pasture && Array.isArray(rawState.pasture.animals));
        const animalsSource = hasPastureAnimals ? rawState.pasture.animals : defaults.pasture.animals;
        const animals = animalsSource
            .map((animal) => normalizePastureAnimal(animal, now))
            .filter(Boolean);

        const normalizedState = {
            coins: isFiniteNumber(Number(rawState.coins)) ? Math.max(0, Math.floor(Number(rawState.coins))) : defaults.coins,
            inventory: normalizeInventory(rawState.inventory),
            contactStates: normalizeGardenContactStates(rawState.contactStates),
            farm: {
                level: isFiniteNumber(Number(rawState.farm && rawState.farm.level)) ? Math.max(1, Math.floor(Number(rawState.farm.level))) : defaults.farm.level,
                exp: isFiniteNumber(Number(rawState.farm && rawState.farm.exp)) ? Math.max(0, Math.floor(Number(rawState.farm.exp))) : defaults.farm.exp,
                plots: farmPlots
            },
            pasture: {
                level: isFiniteNumber(Number(rawState.pasture && rawState.pasture.level)) ? Math.max(1, Math.floor(Number(rawState.pasture.level))) : defaults.pasture.level,
                animals: hasPastureAnimals ? animals : createInitialPastureAnimals()
            },
            storage: {
                tab: sanitizeStorageTab(rawState.storage && rawState.storage.tab)
            }
        };
        return normalizedState;
    }

    function clampContactStatusValue(value) {
        return Math.max(0, Math.min(CONTACT_STATUS_MAX, Math.round(Number(value) || 0)));
    }

    function createDefaultGardenContactState() {
        return {
            mood: CONTACT_STATUS_DEFAULTS.mood,
            hunger: CONTACT_STATUS_DEFAULTS.hunger,
            energy: CONTACT_STATUS_DEFAULTS.energy,
            lastStatusUpdateAt: Date.now(),
            activeAssignment: null
        };
    }

    function sanitizeGardenContactAssignment(rawAssignment) {
        if (!rawAssignment || typeof rawAssignment !== 'object') return null;
        const type = ['farm', 'pasture', 'kitchen'].includes(rawAssignment.type) ? rawAssignment.type : null;
        if (!type) return null;
        const startedAt = isFiniteNumber(Number(rawAssignment.startedAt)) ? Number(rawAssignment.startedAt) : Date.now();
        const finishAt = isFiniteNumber(Number(rawAssignment.finishAt)) ? Number(rawAssignment.finishAt) : startedAt + (CONTACT_ASSIGNMENT_DURATIONS[type] || 0);
        return { type, startedAt, finishAt };
    }

    function sanitizeGardenContactState(rawState) {
        const defaults = createDefaultGardenContactState();
        const source = rawState && typeof rawState === 'object' ? rawState : {};
        return {
            mood: clampContactStatusValue(source.mood ?? defaults.mood),
            hunger: clampContactStatusValue(source.hunger ?? defaults.hunger),
            energy: clampContactStatusValue(source.energy ?? defaults.energy),
            lastStatusUpdateAt: isFiniteNumber(Number(source.lastStatusUpdateAt)) ? Number(source.lastStatusUpdateAt) : defaults.lastStatusUpdateAt,
            activeAssignment: sanitizeGardenContactAssignment(source.activeAssignment)
        };
    }

    function normalizeGardenContactStates(rawStates) {
        const result = {};
        if (!rawStates || typeof rawStates !== 'object') return result;
        Object.keys(rawStates).forEach((contactId) => {
            result[String(contactId)] = sanitizeGardenContactState(rawStates[contactId]);
        });
        return result;
    }

    function getGardenGameStorageKey(mode) {
        return mode === 'casual' ? GARDEN_GAME_STATE_STORAGE_KEY : GARDEN_GAME_STATE_STORAGE_KEY;
    }

    function loadGardenGameState(mode = 'casual') {
        const defaultState = createDefaultGardenGameState();
        try {
            const raw = window.localStorage.getItem(getGardenGameStorageKey(mode));
            if (!raw) return defaultState;
            return normalizeGardenGameState(JSON.parse(raw));
        } catch (error) {
            return defaultState;
        }
    }

    function hasPersistedRogueRunV2() {
        try {
            return !!window.localStorage.getItem(GARDEN_ROGUE_RUN_STORAGE_KEY_V2);
        } catch (error) {
            return false;
        }
    }

    function loadRogueMetaStateV2() {
        try {
            const raw = window.localStorage.getItem(GARDEN_ROGUE_META_STORAGE_KEY_V2);
            return raw ? normalizeRogueMetaStateV2(JSON.parse(raw)) : createDefaultRogueMetaStateV2();
        } catch (error) {
            return createDefaultRogueMetaStateV2();
        }
    }

    function saveRogueMetaStateV2() {
        if (!state.rogueMetaV2) return;
        try {
            window.localStorage.setItem(GARDEN_ROGUE_META_STORAGE_KEY_V2, JSON.stringify(state.rogueMetaV2));
        } catch (error) {
            return;
        }
    }

    function loadRogueRunStateV2() {
        try {
            const raw = window.localStorage.getItem(GARDEN_ROGUE_RUN_STORAGE_KEY_V2);
            return raw ? normalizeRogueRunStateV2(JSON.parse(raw)) : null;
        } catch (error) {
            return null;
        }
    }

    function saveRogueRunStateV2() {
        if (!state.rogueRunV2) return;
        try {
            window.localStorage.setItem(GARDEN_ROGUE_RUN_STORAGE_KEY_V2, JSON.stringify(state.rogueRunV2));
        } catch (error) {
            return;
        }
    }

    function syncGardenGameReference() {
        state.gardenGame = state.casualGardenGame;
    }

    function saveGardenGameState() {
        const gameState = state.casualGardenGame;
        if (!gameState) return;
        try {
            window.localStorage.setItem(GARDEN_GAME_STATE_STORAGE_KEY, JSON.stringify(gameState));
        } catch (error) {
            return;
        }
    }

    function setGardenMode(mode) {
        const nextMode = mode === 'rogue_activity' ? 'rogue_activity' : 'casual';
        if (nextMode === 'casual' && !state.casualGardenGame) {
            state.casualGardenGame = loadGardenGameState('casual');
        }
        state.gardenMode = nextMode;
        syncGardenGameReference();
        if (screenEl) {
            screenEl.classList.toggle('is-rogue-activity-mode', state.gardenMode === 'rogue_activity');
            screenEl.classList.toggle('is-casual-garden-mode', state.gardenMode !== 'rogue_activity');
        }
    }

    function getInventoryCount(itemId) {
        if (!ITEM_META[itemId]) return 0;
        if (isRogueActivityMode() && state.rogueRunV2 && state.rogueRunV2.runInventory) {
            return Math.max(0, Math.floor(Number(state.rogueRunV2.runInventory[itemId]) || 0));
        }
        return state.gardenGame && state.gardenGame.inventory && isFiniteNumber(Number(state.gardenGame.inventory[itemId]))
            ? Math.max(0, Math.floor(Number(state.gardenGame.inventory[itemId])))
            : 0;
    }

    function addInventoryItem(itemId, amount) {
        if (!ITEM_META[itemId]) return;
        const nextAmount = Math.max(0, getInventoryCount(itemId) + amount);
        if (isRogueActivityMode() && state.rogueRunV2 && state.rogueRunV2.runInventory) {
            state.rogueRunV2.runInventory[itemId] = nextAmount;
            return;
        }
        if (!state.gardenGame) return;
        state.gardenGame.inventory[itemId] = nextAmount;
    }

    function getRogueRunV2() {
        return state.rogueRunV2;
    }

    function ensureRogueMetaV2() {
        if (!state.rogueMetaV2) {
            state.rogueMetaV2 = loadRogueMetaStateV2();
        }
        return state.rogueMetaV2;
    }

    function getRogueRunInventoryCount(itemId) {
        const run = getRogueRunV2();
        if (!run || !ITEM_META[itemId]) return 0;
        return Math.max(0, Math.floor(Number(run.runInventory[itemId]) || 0));
    }

    function addRogueRunInventoryItem(itemId, amount) {
        const run = getRogueRunV2();
        if (!run || !ITEM_META[itemId]) return;
        run.runInventory[itemId] = Math.max(0, getRogueRunInventoryCount(itemId) + Math.floor(Number(amount) || 0));
    }

    function getRogueRelicDefs() {
        const run = getRogueRunV2();
        if (!run) return [];
        return [...(run.relics || []), ...(run.blessings || [])]
            .map((relicId) => ROGUE_RELIC_POOL_V2[relicId])
            .filter(Boolean);
    }

    function getRogueRunToolsV2() {
        const run = getRogueRunV2();
        if (!run || !run.runTools) return {};
        return run.runTools;
    }

    function getRogueToolCountV2(itemId) {
        const tools = getRogueRunToolsV2();
        return Math.max(0, Math.floor(Number(tools[itemId]) || 0));
    }

    function addRogueToolV2(itemId, amount) {
        const run = getRogueRunV2();
        if (!run || !ROGUE_ACTIVE_ITEM_POOL_V2[itemId]) return;
        if (!run.runTools) run.runTools = {};
        run.runTools[itemId] = Math.max(0, getRogueToolCountV2(itemId) + Math.floor(Number(amount) || 0));
    }

    function consumeRogueToolV2(itemId) {
        if (getRogueToolCountV2(itemId) <= 0) return false;
        addRogueToolV2(itemId, -1);
        return true;
    }

    function ensureRogueGoalsV2(run) {
        if (!run) return;
        if (!run.runGoal) {
            run.runGoal = {
                title: '最终目标：完成三幕远征并击败最终 Boss 订单',
                summary: '一路囤货、加工、卖货，把 build 叠到最后一波爆发。'
            };
        }
        const actGoalMap = {
            1: {
                title: '第一幕目标：打好原料基础',
                summary: '优先拿作物和畜产，攒出第一波能加工的库存。'
            },
            2: {
                title: '第二幕目标：开始加工成型',
                summary: '让农牧产出开始喂厨房，把原料变成高价值熟食。'
            },
            3: {
                title: '第三幕目标：卖货爆仓',
                summary: '围绕市场订单与 Boss 三段式目标，把收益一次性兑现。'
            }
        };
        run.actGoal = actGoalMap[run.actIndex] || actGoalMap[1];
        if (!run.nodeGoal || typeof run.nodeGoal !== 'object') {
            run.nodeGoal = {
                title: '当前节点目标待生成',
                progressText: '待推进',
                progressValue: 0,
                progressMax: 1,
                action: '进入当前节点后刷新',
                reward: '推进本幕进度'
            };
        }
    }

    function getRogueRewardRecommendationV2(option, runState) {
        const run = runState || getRogueRunV2();
        if (!option || !run) return '适合作为当前过渡强化。';
        const actTitle = run.actGoal && run.actGoal.title ? run.actGoal.title : '';
        if (option.id === 'pasture_whistle' || option.id === 'nutrient_feed') return `推荐：你当前在${actTitle || '本幕'}里需要补畜产，拿了就能更快接厨房。`;
        if (option.id === 'fertilizer' || option.id === 'greenhouse_spray') return `推荐：你当前在${actTitle || '本幕'}里需要基础原料，农场道具会更顺手。`;
        if (option.id === 'kitchen_spice') return '推荐：适合把当前熟食产能再往上推一档。';
        if (option.id === 'market_coupon') return '推荐：适合第三幕或订单节点冲一波高收益。';
        if (option.effects && option.effects.orderBonus) return '推荐：你的后期收益主要靠订单兑现，这个会很值。';
        if (option.effects && (option.effects.harvestBonus || option.effects.allHarvestFlatBonus)) return '推荐：你现在最缺的是把原料盘子做大。';
        if (option.effects && option.effects.kitchenOutputBonus) return '推荐：适合把厨房节点变成真正的爆发点。';
        return '推荐：作为当前 build 的稳定补强。';
    }

    function openRogueRunIntroV2() {
        const run = getRogueRunV2();
        if (!rogueIntroModalEl || !run) return;
        ensureRogueGoalsV2(run);
        const roleId = run.starterRoleId || run.loadoutId;
        const loadout = ROGUE_V2_STARTER_LOADOUTS[roleId] || ROGUE_V2_STARTER_LOADOUTS.farmer;
        const starterRelic = loadout.starterRelicId ? ROGUE_RELIC_POOL_V2[loadout.starterRelicId] : null;
        if (rogueIntroTitleEl) rogueIntroTitleEl.textContent = '本局要做什么';
        if (rogueIntroDescEl) rogueIntroDescEl.textContent = '这次不是走路线节点，而是按天经营、每 7 天还债。';
        if (rogueIntroBodyEl) {
            rogueIntroBodyEl.innerHTML = `
                <div class="garden-rogue-intro-section"><strong>长期目标</strong><span>活过多个 7 天周期，不断还清越来越高的债务。</span><em>每个周期结束时都要交钱，不够就直接破产出局。</em></div>
                <div class="garden-rogue-intro-section"><strong>本局核心</strong><span>农场种原料 → 牧场产高级食材 → 厨房做高价料理 → 仓库择机出售。</span><em>这局怎么挣钱，取决于你抽到的遗物、菜谱、天气和市场。</em></div>
                <div class="garden-rogue-intro-section"><strong>开局第一步</strong><span>先用有限行动力搭起第一条赚钱链，再盯住市场和订单把债务凑够。</span><em>建议优先补基础原料，别急着乱卖，先看今天什么最值钱。</em></div>
                <div class="garden-rogue-intro-stats">
                    <div>起始角色：${loadout.name}</div>
                    <div>局内金币：${run.runCoins}</div>
                    <div>每日行动力：${run.dailyAP}</div>
                    <div>本旬债务：${run.cycleDebtTarget}</div>
                    <div>起始遗物：${starterRelic ? starterRelic.title : '暂无'}</div>
                </div>
            `;
        }
        state.rogueIntroOpen = true;
        rogueIntroModalEl.classList.add('is-open');
        rogueIntroModalEl.setAttribute('aria-hidden', 'false');
    }

    function closeRogueIntroV2() {
        state.rogueIntroOpen = false;
        if (!rogueIntroModalEl) return;
        rogueIntroModalEl.classList.remove('is-open');
        rogueIntroModalEl.setAttribute('aria-hidden', 'true');
    }

    function confirmRogueRunIntroV2() {
        const run = getRogueRunV2();
        if (!run) return;
        run.introConfirmed = true;
        saveRogueRunStateV2();
        closeRogueIntroV2();
        if (run.currentDraft) {
            renderRogueOfferModal();
        } else {
            setRogueProgressPanelOpen(true);
            renderRogueUiV2();
        }
    }

    function openRogueBuffPanelV2() {
        if (!rogueBuffPanelEl) return;
        renderRogueBuffPanelV2();
        state.rogueBuffPanelOpen = true;
        rogueBuffPanelEl.classList.add('is-open');
        rogueBuffPanelEl.setAttribute('aria-hidden', 'false');
    }

    function closeRogueBuffPanelV2() {
        state.rogueBuffPanelOpen = false;
        if (!rogueBuffPanelEl) return;
        rogueBuffPanelEl.classList.remove('is-open');
        rogueBuffPanelEl.setAttribute('aria-hidden', 'true');
    }

    function getRogueBuffSummaryTextV2() {
        const relics = getRogueRelicDefs().slice(0, 2).map((entry) => entry.title);
        const tools = Object.keys(getRogueRunToolsV2()).filter((itemId) => getRogueToolCountV2(itemId) > 0).slice(0, 1).map((itemId) => `${ROGUE_ACTIVE_ITEM_POOL_V2[itemId].name} x${getRogueToolCountV2(itemId)}`);
        const parts = [...relics, ...tools].filter(Boolean);
        return parts.length ? parts.join(' · ') : '暂无强增益，先完成节点拿奖励';
    }

    function renderRogueBuffPanelV2() {
        if (!rogueBuffPanelListEl) return;
        const relicCards = getRogueRelicDefs().map((entry) => `
            <div class="garden-rogue-buff-card">
                <div class="garden-rogue-buff-card-title">${entry.title}</div>
                <div class="garden-rogue-buff-card-desc">${entry.desc}</div>
                <div class="garden-rogue-buff-card-tip">${getRogueRewardRecommendationV2(entry)}</div>
            </div>
        `).join('');
        const toolCards = Object.keys(ROGUE_ACTIVE_ITEM_POOL_V2)
            .filter((itemId) => getRogueToolCountV2(itemId) > 0)
            .map((itemId) => {
                const tool = ROGUE_ACTIVE_ITEM_POOL_V2[itemId];
                return `
                    <div class="garden-rogue-buff-card">
                        <div class="garden-rogue-buff-card-title">${tool.emoji} ${tool.name} x${getRogueToolCountV2(itemId)}</div>
                        <div class="garden-rogue-buff-card-desc">${tool.desc}</div>
                        <div class="garden-rogue-buff-card-tip">${tool.recommendedUse}</div>
                    </div>
                `;
            }).join('');
        rogueBuffPanelListEl.innerHTML = relicCards || toolCards
            ? `${relicCards}${toolCards}`
            : '<div class="garden-rogue-buff-empty">当前还没有生效中的强增益，继续推进节点就会慢慢成型。</div>';
    }

    function getRogueCurrentNodeLabel() {
        const run = getRogueRunV2();
        if (!run || !run.currentNode) return '尚未进入节点';
        const nodeLabel = ROGUE_V2_NODE_LABELS[run.currentNode.type] || run.currentNode.type;
        return `${ROGUE_V2_ACT_LABELS[run.currentNode.actIndex] || '远征中'} · ${nodeLabel}`;
    }

    function getRogueGoalTextV2() {
        const run = getRogueRunV2();
        const isInActivitiesView = state.currentView === 'activities';
        if (!run) return '先点“开始远征”，选一个起始流派后进入第一幕。';
        if (run.completed) {
            return run.victory ? '本轮已通关。下一步可以去工坊强化，或者重新开始新一局。' : '本轮已结束。下一步可以重新开始远征。';
        }
        if (!isInActivitiesView) {
            return '当前任务：先切到底栏“活动”，再点“继续远征”进入当前节点。';
        }
        if (run.currentDraft) return '下一步：先从 3 个奖励里选 1 个，这是你 build 变强的核心来源。';
        if (run.currentNode && run.currentNode.type === 'rest') return '下一步：在休整弹层里二选一，拿完收益后会自动进入下一层选路。';
        if (run.currentEvent) return '下一步：先完成当前奇遇选择，拿收益或承担代价后再继续。';
        if (run.currentMerchant) return '下一步：决定要不要在商店花局内金币补强遗物和资源。';
        if (run.currentBoss) return '下一步：完成 Boss 的三段式目标，依次筹备原料、加工菜品、完成交付。';
        if (run.currentMarketOrder) return '当前任务：完成市场订单，按要求卖出物资后拿局内金币与推进奖励。';
        if (run.currentNode && run.currentNode.type === 'farm') return '当前任务：进入农场节点，完成这一轮播种 / 收获目标。';
        if (run.currentNode && run.currentNode.type === 'pasture') return '当前任务：进入牧场节点，完成喂食 / 收获目标。';
        if (run.currentNode && run.currentNode.type === 'kitchen') return '当前任务：进入厨房节点，做出本轮要求的料理。';
        if (run.currentNode && run.currentNode.type === 'merchant') return '当前任务：打开商店，决定是否花局内金币购买强化。';
        if (run.currentNode && run.currentNode.type === 'event') return '当前任务：处理当前奇遇，做出一次风险收益选择。';
        if (run.currentNode && run.currentNode.type === 'elite') return '当前任务：完成精英经营挑战，这是本幕的强度检定点。';
        if (run.currentNode) return `当前任务：进入${ROGUE_V2_NODE_LABELS[run.currentNode.type] || run.currentNode.type}节点并完成它。`;
        return '下一步：从当前幕的分支路线里选 1 个节点继续推进。';
    }

    function getRogueHintTextV2() {
        const run = getRogueRunV2();
        const isInActivitiesView = state.currentView === 'activities';
        if (!run) return '目标是用 3 幕大约 12 个遭遇，把遗物 build 叠起来，最后打爆最终 Boss 订单。';
        if (run.completed) return run.victory ? '通关后会获得工坊徽章，可用来强化后续开局和路线控制。' : '失败也能积累经验，优先提升工坊开局资源和士气上限会更稳。';
        if (!isInActivitiesView) return '你现在不在远征主界面，所以只看得到摘要。切到“活动”后，入口按钮会直接带你去当前节点。';
        if (run.currentDraft) return '优先拿能跨阶段联动的遗物，例如产量 → 厨房减耗 → 市场溢价。';
        if (run.currentNode && run.currentNode.type === 'farm') return '农场节点的价值在于给后续厨房和市场准备原料，不只是当前收益。';
        if (run.currentNode && run.currentNode.type === 'pasture') return '牧场节点会补足蛋、奶、猪肉等高价值材料，后续很多强配方都靠它。';
        if (run.currentNode && run.currentNode.type === 'kitchen') return '厨房节点要尽量把原料转成高价值熟食，方便第三幕爆发。';
        if (run.currentNode && run.currentNode.type === 'market') return '市场节点是把 build 兑现成大量金币和订单奖励的关键节点。';
        if (run.currentNode && run.currentNode.type === 'rest') return '如果士气低就优先回复；如果状态稳，就复制高价值库存滚雪球。';
        if (run.currentBoss) return 'Boss 是整局爆发点，前面攒的库存、遗物和链式收益都会在这里兑现。';
        return '普通节点每清 2 个会触发一次 3 选 1 奖励，所以路线长度本身就是强度来源。';
    }

    function getRogueTaskCardV2() {
        const run = getRogueRunV2();
        const isInActivitiesView = state.currentView === 'activities';
        if (!run) {
            return {
                title: '主任务：开始一局远征',
                progress: '进度：未开始',
                action: '操作：点击“开始远征” → 选择起始流派',
                value: '意义：先确定这一局的 build 方向和开局资源。'
            };
        }
        if (run.completed) {
            return {
                title: run.victory ? '主任务：本轮已通关' : '主任务：本轮已结束',
                progress: run.victory ? '进度：最终 Boss 已完成' : '进度：远征中断',
                action: run.victory ? '操作：去工坊强化，或者重新开始新一局' : '操作：重新开始远征，并优先补强工坊',
                value: '意义：把局内收益转成长期成长，下一局会更稳定。'
            };
        }
        if (!isInActivitiesView) {
            return {
                title: '主任务：回到远征主界面',
                progress: `进度：当前节点为 ${ROGUE_V2_NODE_LABELS[run.currentNode ? run.currentNode.type : 'farm'] || '未定节点'}`,
                action: '操作：切到底栏“活动” → 点“继续远征”',
                value: '意义：只有在活动页里，你才能真正进入当前节点并推进这一局。'
            };
        }
        if (run.currentDraft) {
            const draftCount = Array.isArray(run.currentDraft.relicIds) ? run.currentDraft.relicIds.length : 0;
            return {
                title: '主任务：选择 1 个奖励',
                progress: `进度：可选奖励 ${draftCount}/3`,
                action: '操作：从弹层 3 选 1，优先拿能跨阶段联动的遗物',
                value: '意义：遗物是这一局最核心的强度来源，越早成型越容易滚雪球。'
            };
        }
        if (run.currentNode && run.currentNode.type === 'farm') {
            const readyPlots = (run.farm && Array.isArray(run.farm.plots) ? run.farm.plots : []).filter((plot) => plot && plot.state === 'ready').length;
            const plantedPlots = (run.farm && Array.isArray(run.farm.plots) ? run.farm.plots : []).filter((plot) => plot && plot.state === 'growing').length;
            const harvestCount = Math.max(0, Math.floor(Number(run.currentNode.harvestCount) || 0));
            return {
                title: '主任务：完成农场节点',
                progress: `进度：已收获 ${harvestCount}/1 · 成熟地块 ${readyPlots} · 生长中 ${plantedPlots}`,
                action: '操作：进入农场，先播种，再收获成熟作物',
                value: '意义：农场原料会喂给后续厨房和市场，是整局经济的起点。'
            };
        }
        if (run.currentNode && run.currentNode.type === 'pasture') {
            const animals = run.pasture && Array.isArray(run.pasture.animals) ? run.pasture.animals : [];
            const readyAnimals = animals.filter((animal) => animal && animal.state === 'ready').length;
            const hungryAnimals = animals.filter((animal) => animal && animal.state === 'hungry').length;
            const harvestCount = Math.max(0, Math.floor(Number(run.currentNode.harvestCount) || 0));
            return {
                title: '主任务：完成牧场节点',
                progress: `进度：已收获 ${harvestCount}/1 · 可收获动物 ${readyAnimals} · 待喂食动物 ${hungryAnimals}`,
                action: '操作：进入牧场，先喂食，再收获已经完成生产的动物',
                value: '意义：蛋、奶、猪肉是高价值料理的重要原料。'
            };
        }
        if (run.currentNode && run.currentNode.type === 'kitchen') {
            const cookableRecipes = Object.values(KITCHEN_RECIPES).filter((recipe) => hasInventoryItems(recipe.ingredients || {})).length;
            return {
                title: '主任务：完成厨房节点',
                progress: `进度：当前可做配方 ${cookableRecipes} 个`,
                action: '操作：进入厨房，选择可做菜谱并完成 QTE',
                value: '意义：把原料加工成熟食，通常能显著提高第三幕的兑现效率。'
            };
        }
        if (run.currentNode && run.currentNode.type === 'market') {
            const lines = run.currentMarketOrder && Array.isArray(run.currentMarketOrder.lines) ? run.currentMarketOrder.lines : [];
            const done = lines.filter((line) => (line.fulfilledQty || 0) >= (line.requiredQty || 0)).length;
            return {
                title: '主任务：完成市场订单',
                progress: `进度：订单条目 ${done}/${lines.length || 0}`,
                action: '操作：进入仓库，按订单卖出指定物资',
                value: '意义：市场节点会把你前面囤的货直接兑现成大量局内收益。'
            };
        }
        if (run.currentNode && run.currentNode.type === 'rest') {
            return {
                title: '主任务：完成休整选择',
                progress: `进度：当前士气 ${run.morale}/${run.moraleCap}`,
                action: '操作：在休整弹层里二选一，回复士气或复制库存',
                value: '意义：休整能补容错，或者把优势库存继续滚大。'
            };
        }
        if (run.currentNode && run.currentNode.type === 'merchant') {
            return {
                title: '主任务：处理商店节点',
                progress: `进度：局内金币 ${run.runCoins || 0}`,
                action: '操作：查看商店货物，决定是否花钱买强化',
                value: '意义：商店能补遗物、资源和关键过渡强度。'
            };
        }
        if (run.currentNode && run.currentNode.type === 'event') {
            return {
                title: '主任务：完成奇遇选择',
                progress: '进度：等待做出一次事件决策',
                action: '操作：选择更适合当前 build 的风险收益分支',
                value: '意义：事件往往能提供爆发收益，但也可能带来代价。'
            };
        }
        if (run.currentNode && run.currentNode.type === 'elite') {
            return {
                title: '主任务：击破精英经营节点',
                progress: `进度：第 ${run.actIndex} 幕高潮节点`,
                action: '操作：进入挑战，完成这一幕的高压经营目标',
                value: '意义：精英奖励更强，是 build 成型的重要拐点。'
            };
        }
        if (run.currentBoss) {
            return {
                title: '主任务：完成最终 Boss 订单',
                progress: `进度：Boss 第 ${Math.max(1, Math.floor(Number(run.currentBoss.phase) || 1))}/3 段`,
                action: '操作：按阶段准备原料、加工菜品并完成最终交付',
                value: '意义：这是整局 build 的最终兑现点，通关奖励也最高。'
            };
        }
        return {
            title: '主任务：选择下一条路线',
            progress: `进度：第 ${run.actIndex} 幕 · 第 ${Math.min(run.depthIndex + 1, 4)} 层`,
            action: '操作：在分支路线中选择 1 个节点继续推进',
            value: '意义：路线长度决定你能拿多少遗物和 build 组件。'
        };
    }

    function getRogueNodeObjectiveV2() {
        const run = getRogueRunV2();
        if (!run) {
            return {
                title: '开始一局远征',
                progressText: '未开始',
                progressValue: 0,
                progressMax: 1,
                action: '点击开始远征并选择起始流派',
                reward: '开始构筑本局 build',
                purpose: '先明确这把的主线目标，再开局会更顺。',
                recommendedNextStep: '选择流派并阅读开局简报'
            };
        }
        ensureRogueGoalsV2(run);
        if (run.completed) {
            return {
                title: run.victory ? '本轮远征已通关' : '本轮远征已结束',
                progressText: run.victory ? '1/1' : '0/1',
                progressValue: run.victory ? 1 : 0,
                progressMax: 1,
                action: run.victory ? '去工坊强化或直接开启新一局' : '重新开启一局远征',
                reward: '结算局外成长与奖励',
                purpose: '这一局已经收尾，下一步是结算和长期成长。',
                recommendedNextStep: run.victory ? '先去工坊补强开局' : '重开并优先补稳定资源'
            };
        }
        if (run.currentDraft) {
            return {
                title: '选择 1 个奖励',
                progressText: `${Array.isArray(run.currentDraft.relicIds) ? run.currentDraft.relicIds.length : 0}/3 候选`,
                progressValue: 0,
                progressMax: 1,
                action: '从 3 个奖励里选择当前最适合 build 的一个',
                reward: '立即强化本局 build',
                purpose: run.actGoal.summary,
                recommendedNextStep: '优先拿最能服务当前幕目标的奖励'
            };
        }
        if (!run.currentNode) {
            return {
                title: '选择下一条路线',
                progressText: `第 ${run.actIndex} 幕 · 第 ${Math.min(run.depthIndex + 1, 4)} 层`,
                progressValue: 0,
                progressMax: 1,
                action: '从这一层的 3 个节点里选 1 个继续推进',
                reward: '进入新节点并推进本幕进度',
                purpose: run.actGoal.summary,
                recommendedNextStep: '优先选能补你当前短缺资源的节点'
            };
        }
        if (run.currentNode.type === 'farm') {
            const current = Math.max(0, Math.floor(Number(run.currentNode.harvestCount) || 0));
            return {
                title: '收获 1 次作物',
                progressText: `${current}/1`,
                progressValue: current,
                progressMax: 1,
                action: '先播种、浇水，等成熟后收获 1 次作物',
                reward: '完成农场节点并进入下一步',
                purpose: '先补基础原料，为后续厨房或市场做准备。',
                recommendedNextStep: '收完后考虑接牧场补蛋奶肉，或者直接进厨房'
            };
        }
        if (run.currentNode.type === 'elite') {
            const current = Math.max(0, Math.floor(Number(run.currentNode.harvestCount) || 0));
            return {
                title: '精英挑战：收获 3 次作物',
                progressText: `${current}/3`,
                progressValue: current,
                progressMax: 3,
                action: '连续完成 3 次收获，扛住这一幕的精英压力',
                reward: '高稀有奖励与下一幕推进',
                purpose: '精英是 build 检查点，通过后通常能直接进入强势期。',
                recommendedNextStep: '拿完高稀有奖励后围绕新 build 改路线'
            };
        }
        if (run.currentNode.type === 'pasture') {
            const current = Math.max(0, Math.floor(Number(run.currentNode.harvestCount) || 0));
            return {
                title: '收获 1 次畜产',
                progressText: `${current}/1`,
                progressValue: current,
                progressMax: 1,
                action: '先喂食动物，再收获已完成生产的畜产',
                reward: '完成牧场节点并进入下一步',
                purpose: '蛋、奶、猪肉是很多高价值料理的关键原料。',
                recommendedNextStep: '有可做菜谱时优先转厨房提高单位价值'
            };
        }
        if (run.currentNode.type === 'kitchen') {
            const current = Math.max(0, Math.floor(Number(run.currentNode.cookCount) || 0));
            return {
                title: '成功烹饪 1 道料理',
                progressText: `${current}/1`,
                progressValue: current,
                progressMax: 1,
                action: '选择一个可做菜谱并完成 QTE',
                reward: '完成厨房节点并推进 build',
                purpose: '把原料转成高价值熟食，是后期卖货爆发的关键。',
                recommendedNextStep: '做完后优先看市场/订单是否能兑现'
            };
        }
        if (run.currentNode.type === 'market') {
            const lines = run.currentMarketOrder && Array.isArray(run.currentMarketOrder.lines) ? run.currentMarketOrder.lines : [];
            const done = lines.filter((line) => (line.fulfilledQty || 0) >= (line.requiredQty || 0)).length;
            return {
                title: '完成 1 张市场订单',
                progressText: `${done}/${lines.length || 1}`,
                progressValue: done,
                progressMax: Math.max(1, lines.length),
                action: '去仓库卖出订单需要的物资',
                reward: '获得局内金币并完成市场节点',
                purpose: '这是把 build 兑现成大量收益的核心节点。',
                recommendedNextStep: '优先交付高价值订单线，准备下一次爆发'
            };
        }
        if (run.currentNode.type === 'rest') {
            return {
                title: '完成 1 次休整选择',
                progressText: `士气 ${run.morale}/${run.moraleCap}`,
                progressValue: 0,
                progressMax: 1,
                action: '在休整弹层中选择恢复士气或复制库存',
                reward: '立刻获得休整收益并进入下一层',
                purpose: '休整是修复容错或补一波库存节奏的节点。',
                recommendedNextStep: run.morale < run.moraleCap ? '士气低时优先回复' : '状态稳时复制高价值库存'
            };
        }
        if (run.currentNode.type === 'event') {
            return {
                title: '完成 1 次奇遇决策',
                progressText: '等待选择',
                progressValue: 0,
                progressMax: 1,
                action: '在奇遇弹层里选择一个分支结果',
                reward: '获得风险收益并推进节点',
                purpose: '奇遇是低成本补资源、补道具或赌高收益的捷径。',
                recommendedNextStep: '优先选能直接服务当前幕目标的分支'
            };
        }
        if (run.currentNode.type === 'merchant') {
            return {
                title: '完成 1 次商店处理',
                progressText: `局内金币 ${run.runCoins}`,
                progressValue: 0,
                progressMax: 1,
                action: '购买遗物，或者直接离开商店',
                reward: '补强 build 后进入下一层',
                purpose: '花局内金币换强度，是这局滚雪球的重要手段。',
                recommendedNextStep: '优先买立刻能生效的强补强，而不是平均分散'
            };
        }
        if (run.currentBoss) {
            const phase = Math.max(1, Math.floor(Number(run.currentBoss.phase) || 1));
            return {
                title: '完成最终 Boss 三段式订单',
                progressText: `${phase}/3 段`,
                progressValue: phase,
                progressMax: 3,
                action: '依次完成筹备原料、加工菜品、最终交付',
                reward: '通关整局远征',
                purpose: '这是整局 build 的最终兑现点。',
                recommendedNextStep: '先补足缺口最大的那类资源，再追求高价交付'
            };
        }
        return {
            title: '完成当前节点',
            progressText: '待推进',
            progressValue: 0,
            progressMax: 1,
            action: '根据当前节点类型完成对应操作',
            reward: '继续本幕进度',
            purpose: run.actGoal ? run.actGoal.summary : '继续推进这一幕。',
            recommendedNextStep: '围绕当前幕目标继续补强'
        };
    }

    function getRogueOrderTextV2() {
        const run = getRogueRunV2();
        if (!run) return '未开始';
        if (run.currentMarketOrder && Array.isArray(run.currentMarketOrder.lines)) {
            return run.currentMarketOrder.lines.map((line) => {
                const meta = ITEM_META[line.itemId];
                return `${meta ? meta.emoji : '📦'} ${meta ? meta.name : line.itemId} ${line.fulfilledQty || 0}/${line.requiredQty || 0}`;
            }).join(' / ');
        }
        if (run.currentBoss) {
            return `Boss 进度：第 ${Math.max(1, Math.floor(Number(run.currentBoss.phase) || 1))} / 3 段`;
        }
        return '当前没有活跃订单';
    }

    function renderRogueWorkshopListV2() {
        const listEl = document.getElementById('garden-rogue-workshop-list');
        const currencyEl = document.getElementById('garden-rogue-workshop-currency');
        const meta = ensureRogueMetaV2();
        if (currencyEl) currencyEl.textContent = `${meta.workshopCurrency} 徽章`;
        if (!listEl) return;
        const rows = [];
        Object.keys(ROGUE_META_TREE_V2).forEach((groupKey) => {
            (ROGUE_META_TREE_V2[groupKey] || []).forEach((entry) => {
                const level = Math.max(0, Math.floor(Number(meta.workshopLevels[entry.id]) || 0));
                const isMax = level >= entry.maxLevel;
                const cost = entry.costBase * (level + 1);
                rows.push(`
                    <div class="garden-rogue-workshop-item">
                        <div class="garden-rogue-workshop-copy">
                            <div class="garden-rogue-workshop-title">${entry.name}</div>
                            <div class="garden-rogue-workshop-desc">${entry.desc}</div>
                            <div class="garden-rogue-workshop-meta">Lv.${level}/${entry.maxLevel} · 升级消耗 ${cost} 徽章</div>
                        </div>
                        <button class="garden-rogue-workshop-btn" data-rogue-workshop-upgrade="${entry.id}" type="button" ${isMax || meta.workshopCurrency < cost ? 'disabled' : ''}>${isMax ? '已满' : '升级'}</button>
                    </div>
                `);
            });
        });
        listEl.innerHTML = rows.join('');
    }

    function renderRogueUiV2() {
        const run = getRogueRunV2();
        const relics = getRogueRelicDefs();
        const taskCard = getRogueTaskCardV2();
        const startRunBtn = document.getElementById('garden-rogue-start-run');
        if (run) {
            ensureRogueGoalsV2(run);
            run.nodeGoal = getRogueNodeObjectiveV2();
        }
        if (rogueProgressStageEl) {
            rogueProgressStageEl.textContent = run ? (ROGUE_V2_ACT_LABELS[run.actIndex] || '远征中') : '未开始';
        }
        if (rogueProgressCardsEl) {
            rogueProgressCardsEl.textContent = run ? `遗物 ${relics.length} / 行动力 ${run.apRemaining || 0}/${run.dailyAP || 0}` : '遗物 0 / 行动力 0';
        }
        if (rogueProgressGoalEl) {
            rogueProgressGoalEl.textContent = run ? `第 ${run.day} 天｜第 ${run.cycleIndex} 旬｜债务 ${run.cycleDebtTarget}` : '未开始';
        }
        if (rogueProgressOrderEl) {
            rogueProgressOrderEl.textContent = run ? `金币 ${run.runCoins}｜天气 ${run.currentWeather}｜市场 ${run.currentMarket && run.currentMarket.focus ? run.currentMarket.focus : '平稳'}` : '等待开局';
        }
        if (rogueProgressPanelStageEl) {
            rogueProgressPanelStageEl.textContent = run ? `第 ${run.day} 天 · 第 ${run.cycleIndex} 旬 · 本旬第 ${run.cycleDay} 天` : '请选择起始角色';
        }
        if (rogueProgressPanelGoalEl) {
            rogueProgressPanelGoalEl.textContent = run
                ? `本旬目标：在第 7 天前凑够 ${run.cycleDebtTarget} 金币。
今天先安排农场、牧场、厨房与仓库的行动顺序。
优先让第一条赚钱链跑起来。`
                : `${taskCard.title}
${taskCard.progress}
${taskCard.action}`;
        }
        if (rogueProgressPanelCardsEl) {
            rogueProgressPanelCardsEl.innerHTML = relics.length
                ? relics.map((relic) => `<span class="garden-rogue-chip">${relic.title}</span>`).join('')
                : '<div class="garden-rogue-empty-text">当前还没有拿到遗物。</div>';
        }
        if (rogueProgressPanelOrderEl) {
            rogueProgressPanelOrderEl.innerHTML = run
                ? `<div class="garden-rogue-empty-text">已还债 ${run.cycleDebtPaid} / ${run.cycleDebtTarget} · 仓库容量 ${run.inventoryCapacity} · 剩余行动力 ${run.apRemaining}</div>`
                : `<div class="garden-rogue-empty-text">${taskCard.value}</div>`;
        }
        syncRogueBuffSummaryUi();
        syncKitchenToolPanelUi();
        renderRogueBuffPanelV2();
        if (startRunBtn) {
            startRunBtn.textContent = run ? '继续经营' : '开始经营';
        }
        renderRogueWorkshopListV2();
    }

    function setRogueWorkshopOpen(open) {
        const workshopEl = document.getElementById('garden-rogue-workshop');
        if (!workshopEl) return;
        workshopEl.classList.toggle('is-open', !!open);
        workshopEl.setAttribute('aria-hidden', open ? 'false' : 'true');
    }

    function buildRogueDraftChoicesFromIds(relicIds, draftType) {
        return relicIds.filter((relicId) => !!ROGUE_RELIC_POOL_V2[relicId]).map((relicId) => {
            const relic = ROGUE_RELIC_POOL_V2[relicId];
            return `
                <button class="garden-rogue-card-choice" data-rogue-v2-pick="${relic.id}" data-rogue-v2-draft-type="${draftType}" type="button">
                    <div class="garden-rogue-card-choice-title">${relic.title}</div>
                    <div class="garden-rogue-card-choice-desc">${relic.desc}</div>
                </button>
            `;
        }).join('');
    }

    function getRogueWorkshopBonusValue(entryId, effectKey) {
        const meta = ensureRogueMetaV2();
        let matchedEntry = null;
        Object.keys(ROGUE_META_TREE_V2).some((groupKey) => {
            matchedEntry = (ROGUE_META_TREE_V2[groupKey] || []).find((entry) => entry.id === entryId) || null;
            return !!matchedEntry;
        });
        if (!matchedEntry || !matchedEntry.effects || !Object.prototype.hasOwnProperty.call(matchedEntry.effects, effectKey)) return 0;
        const level = Math.max(0, Math.floor(Number(meta.workshopLevels[entryId]) || 0));
        return level * (Number(matchedEntry.effects[effectKey]) || 0);
    }

    function getRogueActStateV2(actIndex) {
        const run = getRogueRunV2();
        if (!run || !run.map || !Array.isArray(run.map.acts)) return null;
        return run.map.acts.find((act) => Number(act.actIndex) === Number(actIndex)) || null;
    }

    function getRogueAvailableNodesForCurrentDepthV2() {
        const run = getRogueRunV2();
        const act = getRogueActStateV2(run ? run.actIndex : 0);
        if (!run || !act) return [];
        if (run.depthIndex >= 3) return [act.climaxNode].filter(Boolean);
        return (act.routes || []).map((route) => route[run.depthIndex]).filter(Boolean);
    }

    function createRogueDraftFromPoolV2(draftType) {
        const run = getRogueRunV2();
        if (!run) return null;
        const owned = new Set([...(run.relics || []), ...(run.blessings || [])]);
        const pool = Object.values(ROGUE_RELIC_POOL_V2).filter((relic) => {
            if (!relic || owned.has(relic.id)) return false;
            if (draftType === 'blessing') return relic.rarity === 'blessing';
            if (draftType === 'elite') return relic.rarity === 'rare' || relic.rarity === 'epic' || relic.rarity === 'blessing';
            return relic.rarity !== 'blessing';
        });
        const relicIds = pool.sort(() => Math.random() - 0.5).slice(0, 3).map((relic) => relic.id);
        run.currentDraft = { type: draftType, relicIds };
        saveRogueRunStateV2();
        renderRogueUiV2();
        return run.currentDraft;
    }

    function openRogueNodeChoicesV2() {
        const run = getRogueRunV2();
        if (!run || run.completed) return;
        const nodes = getRogueAvailableNodesForCurrentDepthV2();
        const html = nodes.map((node, index) => {
            const label = ROGUE_V2_NODE_LABELS[node.type] || node.type;
            const summary = getRogueNodeSummaryV2(node.type);
            const reason = getRogueNodeReasonV2(node.type);
            const recommendation = getRogueNodeRecommendationV2(node.type);
            return `
                <button class="garden-rogue-card-choice" data-rogue-v2-node="${index}" type="button">
                    <div class="garden-rogue-card-choice-title">${label}</div>
                    <div class="garden-rogue-card-choice-desc">第 ${node.depthIndex + 1} 层 · ${ROGUE_V2_ACT_LABELS[node.actIndex] || '远征'}</div>
                    <div class="garden-rogue-card-choice-desc">${summary}</div>
                    <div class="garden-rogue-card-choice-desc">${reason}</div>
                    <div class="garden-rogue-card-choice-desc">${recommendation}</div>
                </button>
            `;
        }).join('');
        openRogueOfferV2('选择路线节点', '每一层选择一个遭遇推进 build。', html);
    }

    function getRogueBuildDirectionV2() {
        const run = getRogueRunV2();
        if (!run) return 'balanced';
        const relics = getRogueRelicDefs();
        const counts = relics.reduce((result, relic) => {
            const category = relic && relic.category ? relic.category : 'balanced';
            result[category] = (result[category] || 0) + 1;
            return result;
        }, {});
        let bestKey = run.starterRoleId || run.loadoutId || 'balanced';
        let bestScore = -1;
        Object.keys(counts).forEach((key) => {
            if (counts[key] > bestScore) {
                bestKey = key;
                bestScore = counts[key];
            }
        });
        return bestKey;
    }

    function getRogueNodeSummaryV2(nodeType) {
        if (nodeType === 'farm') return '作用：补农作物原料，适合铺后续厨房和市场。';
        if (nodeType === 'pasture') return '作用：补蛋奶肉毛，适合高价值料理链。';
        if (nodeType === 'kitchen') return '作用：把原料转成熟食，提高后期兑现效率。';
        if (nodeType === 'market') return '作用：卖货兑现 build，换取大量局内金币。';
        if (nodeType === 'rest') return '作用：补士气或复制库存，偏稳扎稳打。';
        if (nodeType === 'event') return '作用：拿一波风险收益，可能赚也可能亏。';
        if (nodeType === 'merchant') return '作用：用局内金币补遗物和关键过渡强度。';
        if (nodeType === 'elite') return '作用：高压挑战，但奖励更强。';
        if (nodeType === 'boss') return '作用：最终三段式大订单，结算整局 build。';
        return '作用：推进本幕路线。';
    }

    function getRogueNodeReasonV2(nodeType) {
        const run = getRogueRunV2();
        if (!run) return '当前没有进行中的 build 信息。';
        if (nodeType === 'farm') return `当前仓库：小麦 ${getRogueRunInventoryCount('wheat')} / 胡萝卜 ${getRogueRunInventoryCount('carrot')} / 番茄 ${getRogueRunInventoryCount('tomato')}。`;
        if (nodeType === 'pasture') return `当前仓库：鸡蛋 ${getRogueRunInventoryCount('egg')} / 牛奶 ${getRogueRunInventoryCount('milk')} / 猪肉 ${getRogueRunInventoryCount('pork')}。`;
        if (nodeType === 'kitchen') return `当前可做配方 ${Object.values(KITCHEN_RECIPES).filter((recipe) => hasInventoryItems(recipe.ingredients || {})).length} 个。`;
        if (nodeType === 'market') return `当前局内金币 ${run.runCoins}，适合把已有库存兑现。`;
        if (nodeType === 'rest') return `当前士气 ${run.morale}/${run.moraleCap}。`;
        if (nodeType === 'merchant') return `当前局内金币 ${run.runCoins}，可考虑买关键遗物。`;
        if (nodeType === 'event') return '适合想赌资源、士气或高稀有奖励时选择。';
        if (nodeType === 'elite') return '这是本幕高潮点，适合 build 已经成型时挑战。';
        if (nodeType === 'boss') return '进入后就是最终检定，建议库存和遗物都准备好。';
        return '继续推进当前路线。';
    }

    function getRogueNodeRecommendationV2(nodeType) {
        const direction = getRogueBuildDirectionV2();
        if (direction === 'yield' && (nodeType === 'farm' || nodeType === 'pasture')) return '推荐：符合你当前的产量向 build。';
        if (direction === 'conversion' && nodeType === 'kitchen') return '推荐：符合你当前的加工向 build。';
        if (direction === 'economy' && (nodeType === 'market' || nodeType === 'merchant')) return '推荐：符合你当前的卖货/经济向 build。';
        if (direction === 'survival' && nodeType === 'rest') return '推荐：符合你当前的稳健向 build。';
        if (nodeType === 'event') return '建议：想搏一把就选它，想稳一点就别选。';
        if (nodeType === 'elite') return '建议：奖励高，但压力也高，适合强势期。';
        if (nodeType === 'boss') return '建议：除非整局已成型，否则先别急着冲。';
        return '建议：按你现在最缺的资源类型来选。';
    }

    function selectRogueNodeV2(choiceIndex) {
        const run = getRogueRunV2();
        const nodes = getRogueAvailableNodesForCurrentDepthV2();
        const sourceNode = nodes[choiceIndex];
        const node = sourceNode ? {
            ...sourceNode,
            isCleared: false,
            harvestCount: 0,
            cookCount: 0,
            orderProgress: 0
        } : null;
        if (!run || !node) return;
        if (sourceNode) {
            Object.assign(sourceNode, node);
        }
        run.currentNode = node;
        run.routeIndex = Number.isFinite(Number(node.routeIndex)) ? Number(node.routeIndex) : run.routeIndex;
        run.currentEvent = node.type === 'event' ? { nodeId: node.id } : null;
        run.currentMerchant = node.type === 'merchant' ? { nodeId: node.id, refreshCost: 25 } : null;
        run.currentMarketOrder = node.type === 'market' ? { nodeId: node.id, lines: [] } : null;
        if (node.type === 'rest') {
            run.currentEvent = { nodeId: node.id, eventType: 'rest' };
        }
        run.currentBoss = node.type === 'boss' ? { nodeId: node.id, phase: 1 } : null;
        closeRogueOfferV2();
        closeFarmScreen({ silent: true });
        closePastureScreen({ silent: true });
        closeKitchenScreen({ silent: true });
        saveRogueRunStateV2();
        renderRogueUiV2();
        openCurrentRogueStageScreen();
    }

    function advanceRogueRunV2(nodeCleared) {
        const run = getRogueRunV2();
        if (!run || !nodeCleared) return;
        if (nodeCleared.type !== 'elite' && nodeCleared.type !== 'boss') {
            run.clearedNormalNodes += 1;
        }
        nodeCleared.isCleared = true;
        run.currentNode = null;
        run.currentEvent = null;
        run.currentMerchant = null;
        run.currentMarketOrder = null;
        if (nodeCleared.type === 'boss') {
            run.currentBoss = null;
            run.completed = true;
            run.victory = true;
            const meta = ensureRogueMetaV2();
            meta.workshopCurrency += 60 + (run.actIndex * 20);
            saveRogueMetaStateV2();
            saveRogueRunStateV2();
            renderRogueUiV2();
            showRogueToast('远征通关，已获得工坊徽章');
            return;
        }
        if (nodeCleared.type === 'elite') {
            run.currentBoss = null;
            if (run.actIndex >= 3) {
                const act3 = getRogueActStateV2(3);
                run.currentNode = act3 ? act3.climaxNode : null;
                if (run.currentNode) {
                    run.currentBoss = { nodeId: run.currentNode.id, phase: 1 };
                }
                saveRogueRunStateV2();
                renderRogueUiV2();
                switchView('activities');
                setRogueProgressPanelOpen(true);
                return;
            }
            run.actIndex += 1;
            run.depthIndex = 0;
            run.routeIndex = null;
            createRogueDraftFromPoolV2('elite');
            saveRogueRunStateV2();
            switchView('activities');
            setRogueProgressPanelOpen(true);
            renderRogueUiV2();
            return;
        }
        if (run.clearedNormalNodes > 0 && run.clearedNormalNodes % 2 === 0) {
            createRogueDraftFromPoolV2('relic');
            switchView('activities');
            setRogueProgressPanelOpen(true);
            renderRogueUiV2();
            return;
        }
        if (run.depthIndex < 2) {
            run.depthIndex += 1;
        } else {
            run.depthIndex = 3;
            const act = getRogueActStateV2(run.actIndex);
            run.currentNode = act ? act.climaxNode : null;
            if (run.currentNode && run.currentNode.type === 'boss') {
                run.currentBoss = { nodeId: run.currentNode.id, phase: 1 };
            }
        }
        saveRogueRunStateV2();
        renderRogueUiV2();
        switchView('activities');
        setRogueProgressPanelOpen(true);
    }

    function progressRogueFarmHarvestV2() {
        const run = getRogueRunV2();
        if (!isRogueActivityMode() || !run || !run.currentNode || !['farm', 'elite'].includes(run.currentNode.type)) return false;
        run.currentNode.harvestCount = Math.max(0, Math.floor(Number(run.currentNode.harvestCount) || 0)) + 1;
        const targetHarvests = run.currentNode.type === 'elite' ? 3 : 1;
        saveRogueRunStateV2();
        if (run.currentNode.harvestCount >= targetHarvests) {
            const clearedNode = run.currentNode;
            showRogueToast(clearedNode.type === 'elite' ? '精英农场目标完成，准备进入下一步奖励' : '农场节点完成，准备进入下一步');
            advanceRogueRunV2(clearedNode);
            return true;
        }
        showRogueToast(`农场节点进度 ${run.currentNode.harvestCount}/${targetHarvests}`);
        return true;
    }

    function progressRoguePastureHarvestV2() {
        const run = getRogueRunV2();
        if (!isRogueActivityMode() || !run || !run.currentNode || run.currentNode.type !== 'pasture') return false;
        run.currentNode.harvestCount = Math.max(0, Math.floor(Number(run.currentNode.harvestCount) || 0)) + 1;
        const targetHarvests = 1;
        saveRogueRunStateV2();
        if (run.currentNode.harvestCount >= targetHarvests) {
            const clearedNode = run.currentNode;
            showRogueToast('牧场节点完成，准备进入下一步');
            advanceRogueRunV2(clearedNode);
            return true;
        }
        showRogueToast(`牧场节点进度 ${run.currentNode.harvestCount}/${targetHarvests}`);
        return true;
    }

    function progressRogueKitchenSuccessV2() {
        const run = getRogueRunV2();
        if (!isRogueActivityMode() || !run || !run.currentNode || run.currentNode.type !== 'kitchen') return false;
        run.currentNode.cookCount = Math.max(0, Math.floor(Number(run.currentNode.cookCount) || 0)) + 1;
        const targetCooks = 1;
        saveRogueRunStateV2();
        if (run.currentNode.cookCount >= targetCooks) {
            const clearedNode = run.currentNode;
            run.lastNodeSummary = {
                title: '厨房节点完成',
                lines: ['+ 熟食已入库', '+ 节点目标已完成', '+ 更接近市场与 Boss 爆发'],
                next: '下一步优先查看市场、订单或继续补缺材料'
            };
            showRogueToast('厨房节点完成，熟食已备好，适合去市场兑现');
            advanceRogueRunV2(clearedNode);
            return true;
        }
        showRogueToast(`厨房节点进度 ${run.currentNode.cookCount}/${targetCooks}`);
        return true;
    }

    function openRogueRestModalV2() {
        const run = getRogueRunV2();
        if (!run || !run.currentNode || run.currentNode.type !== 'rest') return;
        const inventoryEntries = Object.entries(run.runInventory || {})
            .filter(([itemId, qty]) => ITEM_META[itemId] && Number(qty) > 0)
            .sort((left, right) => Number(right[1]) - Number(left[1]));
        const bestStack = inventoryEntries[0] || null;
        const recoverDisabled = run.morale >= run.moraleCap;
        const cloneDisabled = !bestStack;
        const cloneText = bestStack
            ? `复制 ${ITEM_META[bestStack[0]].emoji} ${ITEM_META[bestStack[0]].name} ×1`
            : '当前没有可复制库存';
        openRogueOfferV2(
            '休整营地',
            `选择一项休整收益。当前士气 ${run.morale}/${run.moraleCap}。`,
            `
                <button class="garden-rogue-card-choice" data-rogue-v2-rest="recover" type="button" ${recoverDisabled ? 'disabled' : ''}>
                    <div class="garden-rogue-card-choice-title">回复士气</div>
                    <div class="garden-rogue-card-choice-desc">恢复 1 点士气，提升后续容错。</div>
                </button>
                <button class="garden-rogue-card-choice" data-rogue-v2-rest="clone" type="button" ${cloneDisabled ? 'disabled' : ''}>
                    <div class="garden-rogue-card-choice-title">复制库存</div>
                    <div class="garden-rogue-card-choice-desc">${cloneText}</div>
                </button>
            `
        );
    }

    function openRogueEventModalV2() {
        const run = getRogueRunV2();
        if (!run || !run.currentNode || run.currentNode.type !== 'event') return;
        const eventPool = Object.values(ROGUE_EVENT_POOL_V2 || {});
        if (!run.currentEvent || !run.currentEvent.eventId) {
            const pickedEvent = eventPool[Math.floor(Math.random() * eventPool.length)] || null;
            if (!pickedEvent) return;
            run.currentEvent = { nodeId: run.currentNode.id, eventType: 'event', eventId: pickedEvent.id };
            saveRogueRunStateV2();
        }
        const eventDef = ROGUE_EVENT_POOL_V2[run.currentEvent.eventId];
        if (!eventDef) return;
        const choicesHtml = (eventDef.choices || []).map((choice) => `
            <button class="garden-rogue-card-choice" data-rogue-v2-event-choice="${choice.id}" type="button">
                <div class="garden-rogue-card-choice-title">${choice.label}</div>
                <div class="garden-rogue-card-choice-desc">${eventDef.desc}</div>
            </button>
        `).join('');
        openRogueOfferV2(eventDef.title, eventDef.desc, choicesHtml);
    }

    function resolveRogueEventChoiceV2(choiceId) {
        const run = getRogueRunV2();
        const eventDef = run && run.currentEvent ? ROGUE_EVENT_POOL_V2[run.currentEvent.eventId] : null;
        const choice = eventDef && Array.isArray(eventDef.choices) ? eventDef.choices.find((entry) => entry.id === choiceId) : null;
        if (!run || !eventDef || !choice) return;
        const result = choice.result || {};
        if (result.costCoins) {
            run.runCoins = Math.max(0, Math.floor(Number(run.runCoins) || 0) - Math.max(0, Math.floor(Number(result.costCoins) || 0)));
        }
        if (result.type === 'items' && result.items) {
            Object.entries(result.items).forEach(([itemId, amount]) => addRogueRunInventoryItem(itemId, amount));
        }
        if (result.type === 'coins' && result.amount) {
            run.runCoins = Math.max(0, Math.floor(Number(run.runCoins) || 0) + Math.floor(Number(result.amount) || 0));
        }
        if (result.type === 'morale' && result.amount) {
            run.morale = Math.min(run.moraleCap, Math.max(0, run.morale + Math.floor(Number(result.amount) || 0)));
        }
        if (result.type === 'copyHighestStack') {
            const inventoryEntries = Object.entries(run.runInventory || {}).filter(([itemId, qty]) => ITEM_META[itemId] && Number(qty) > 0).sort((a, b) => Number(b[1]) - Number(a[1]));
            const bestStack = inventoryEntries[0] || null;
            if (bestStack) addRogueRunInventoryItem(bestStack[0], 1);
        }
        if (result.type === 'relicDraft') {
            run.currentNode = null;
            run.currentEvent = null;
            closeRogueOfferV2();
            createRogueDraftFromPoolV2('elite');
            return;
        }
        const clearedNode = run.currentNode;
        run.currentEvent = null;
        closeRogueOfferV2();
        saveRogueRunStateV2();
        if (clearedNode) advanceRogueRunV2(clearedNode);
    }

    function openRogueMerchantModalV2() {
        const run = getRogueRunV2();
        if (!run || !run.currentNode || run.currentNode.type !== 'merchant') return;
        if (!run.currentMerchant || !Array.isArray(run.currentMerchant.stock)) {
            const relicIds = Object.values(ROGUE_RELIC_POOL_V2)
                .filter((relic) => relic && relic.rarity !== 'blessing')
                .sort(() => Math.random() - 0.5)
                .slice(0, 3)
                .map((relic) => relic.id);
            run.currentMerchant = { nodeId: run.currentNode.id, stock: relicIds.map((relicId, index) => ({ relicId, price: 90 + (index * 30) })), refreshCost: 25 };
            saveRogueRunStateV2();
        }
        const html = (run.currentMerchant.stock || []).map((entry) => {
            const relic = ROGUE_RELIC_POOL_V2[entry.relicId];
            if (!relic) return '';
            return `
                <button class="garden-rogue-card-choice" data-rogue-v2-merchant-buy="${relic.id}" type="button" ${run.runCoins < entry.price ? 'disabled' : ''}>
                    <div class="garden-rogue-card-choice-title">${relic.title} · ${entry.price} 金币</div>
                    <div class="garden-rogue-card-choice-desc">${relic.desc}</div>
                </button>
            `;
        }).join('') + `
            <button class="garden-rogue-card-choice" data-rogue-v2-merchant-leave="true" type="button">
                <div class="garden-rogue-card-choice-title">离开商店</div>
                <div class="garden-rogue-card-choice-desc">不消费，直接进入下一步。</div>
            </button>
        `;
        openRogueOfferV2('流动商店', `当前局内金币 ${run.runCoins}`, html);
    }

    function resolveRogueMerchantBuyV2(relicId) {
        const run = getRogueRunV2();
        if (!run || !run.currentMerchant || !Array.isArray(run.currentMerchant.stock)) return;
        const stockEntry = run.currentMerchant.stock.find((entry) => entry.relicId === relicId);
        const relic = ROGUE_RELIC_POOL_V2[relicId];
        if (!stockEntry || !relic) return;
        if (run.runCoins < stockEntry.price) return;
        run.runCoins -= stockEntry.price;
        run.relics.push(relicId);
        run.currentMerchant.stock = run.currentMerchant.stock.filter((entry) => entry.relicId !== relicId);
        saveRogueRunStateV2();
        closeRogueOfferV2();
        showRogueToast(`购入 ${relic.title}`);
        openRogueMerchantModalV2();
    }

    function leaveRogueMerchantV2() {
        const run = getRogueRunV2();
        if (!run) return;
        const clearedNode = run.currentNode;
        run.currentNode = null;
        run.currentMerchant = null;
        closeRogueOfferV2();
        saveRogueRunStateV2();
        if (clearedNode) advanceRogueRunV2(clearedNode);
    }

    function resolveRogueRestChoiceV2(choice) {
        const run = getRogueRunV2();
        if (!run || !run.currentNode || run.currentNode.type !== 'rest') return;
        if (choice === 'recover') {
            run.morale = Math.min(run.moraleCap, run.morale + 1);
            closeRogueOfferV2();
            advanceRogueRunV2(run.currentNode);
            showRogueToast('士气恢复了 1 点');
            return;
        }
        if (choice === 'clone') {
            const inventoryEntries = Object.entries(run.runInventory || {})
                .filter(([itemId, qty]) => ITEM_META[itemId] && Number(qty) > 0)
                .sort((left, right) => Number(right[1]) - Number(left[1]));
            const bestStack = inventoryEntries[0] || null;
            if (!bestStack) return;
            addRogueRunInventoryItem(bestStack[0], 1);
            closeRogueOfferV2();
            advanceRogueRunV2(run.currentNode);
            showRogueToast(`复制了 ${ITEM_META[bestStack[0]].name} ×1`);
        }
    }

    function openRogueOfferV2(title, desc, html) {
        if (!rogueOfferModalEl) return;
        if (rogueOfferTitleEl) rogueOfferTitleEl.textContent = title;
        if (rogueOfferDescEl) rogueOfferDescEl.textContent = desc;
        if (rogueOfferChoicesEl) rogueOfferChoicesEl.innerHTML = html;
        rogueOfferModalEl.classList.add('is-open');
        rogueOfferModalEl.setAttribute('aria-hidden', 'false');
    }

    function closeRogueOfferV2() {
        if (!rogueOfferModalEl) return;
        rogueOfferModalEl.classList.remove('is-open');
        rogueOfferModalEl.setAttribute('aria-hidden', 'true');
    }

    function startRogueRunV2(loadoutId) {
        state.rogueRunV2 = createDefaultRogueRunStateV2(loadoutId);
        state.rogueRunV2.runCoins += getRogueWorkshopBonusValue('start_coins_1', 'runCoinsFlat');
        state.rogueRunV2.moraleCap += getRogueWorkshopBonusValue('morale_cap_1', 'moraleCap');
        state.rogueRunV2.morale = state.rogueRunV2.moraleCap;
        ensureRogueGoalsV2(state.rogueRunV2);
        addRogueToolV2('fertilizer', 1);
        addRogueToolV2('pasture_whistle', 1);
        setGardenMode('rogue_activity');
        saveRogueRunStateV2();
        renderRogueUiV2();
        closeRogueOfferV2();
        showRogueToast(`已开始 ${ROGUE_V2_STARTER_LOADOUTS[loadoutId] ? ROGUE_V2_STARTER_LOADOUTS[loadoutId].name : '老农夫'} 远征`);
        openRogueRunIntroV2();
    }

    function openRogueStartDraftV2() {
        const meta = ensureRogueMetaV2();
        const choices = (meta.unlockedLoadouts || Object.keys(ROGUE_V2_STARTER_LOADOUTS)).map((loadoutId) => {
            const loadout = ROGUE_V2_STARTER_LOADOUTS[loadoutId];
            return `
                <button class="garden-rogue-card-choice" data-rogue-v2-start="${loadout.id}" type="button">
                    <div class="garden-rogue-card-choice-title">${loadout.icon} ${loadout.name}</div>
                    <div class="garden-rogue-card-choice-desc">${loadout.desc}</div>
                    <div class="garden-rogue-card-choice-desc">起始金币 ${loadout.startCoins} · 起始遗物 ${ROGUE_RELIC_POOL_V2[loadout.starterRelicId] ? ROGUE_RELIC_POOL_V2[loadout.starterRelicId].title : '无'}</div>
                </button>
            `;
        }).join('');
        openRogueOfferV2('选择起始角色', '角色会决定你的开局资源、初始土地/动物倾向和专属遗物。', choices);
    }

    function openRogueEntryChoiceV2() {
        const hasRun = !!(state.rogueRunV2 && !state.rogueRunV2.completed);
        const continueDisabled = hasRun ? '' : 'disabled';
        openRogueOfferV2(
            '丰收远征',
            hasRun ? '你有一局进行中的远征。可以继续推进，或者直接重开一局。' : '当前没有进行中的远征，可以直接开始新一局。',
            `
                <button class="garden-rogue-card-choice" data-rogue-v2-entry="continue" type="button" ${continueDisabled}>
                    <div class="garden-rogue-card-choice-title">继续上次进度</div>
                    <div class="garden-rogue-card-choice-desc">从当前节点、当前遗物和当前库存继续。</div>
                </button>
                <button class="garden-rogue-card-choice" data-rogue-v2-entry="restart" type="button">
                    <div class="garden-rogue-card-choice-title">重开一局</div>
                    <div class="garden-rogue-card-choice-desc">重新选择起始流派，开始全新远征。</div>
                </button>
            `
        );
    }

    function upgradeRogueWorkshopNode(entryId) {
        const meta = ensureRogueMetaV2();
        let matchedEntry = null;
        Object.keys(ROGUE_META_TREE_V2).some((groupKey) => {
            matchedEntry = (ROGUE_META_TREE_V2[groupKey] || []).find((entry) => entry.id === entryId) || null;
            return !!matchedEntry;
        });
        if (!matchedEntry) return;
        const level = Math.max(0, Math.floor(Number(meta.workshopLevels[entryId]) || 0));
        if (level >= matchedEntry.maxLevel) return;
        const cost = matchedEntry.costBase * (level + 1);
        if (meta.workshopCurrency < cost) return;
        meta.workshopCurrency -= cost;
        meta.workshopLevels[entryId] = level + 1;
        saveRogueMetaStateV2();
        renderRogueUiV2();
        showRogueToast(`${matchedEntry.name} 升到 Lv.${level + 1}`);
    }

    function hasInventoryItems(ingredients) {
        return Object.entries(ingredients || {}).every(([itemId, requiredCount]) => getInventoryCount(itemId) >= requiredCount);
    }

    function spendInventoryItems(ingredients) {
        if (!hasInventoryItems(ingredients)) return false;
        Object.entries(ingredients || {}).forEach(([itemId, requiredCount]) => {
            addInventoryItem(itemId, -requiredCount);
        });
        return true;
    }

    function getFarmPlots() {
        if (isRogueActivityMode() && state.rogueRunV2 && state.rogueRunV2.farm) {
            return state.rogueRunV2.farm.plots || [];
        }
        return state.gardenGame ? state.gardenGame.farm.plots : [];
    }

    function getPastureAnimals() {
        if (isRogueActivityMode() && state.rogueRunV2 && state.rogueRunV2.pasture) {
            return state.rogueRunV2.pasture.animals || [];
        }
        return state.gardenGame ? state.gardenGame.pasture.animals : [];
    }

    function updateGardenCoins(amount) {
        if (isRogueActivityMode() && state.rogueRunV2) {
            state.rogueRunV2.runCoins = Math.max(0, Math.floor(Number(state.rogueRunV2.runCoins) || 0) + amount);
            syncFarmStats();
            syncPastureStats();
            return;
        }
        if (!state.gardenGame) return;
        state.gardenGame.coins = Math.max(0, state.gardenGame.coins + amount);
        syncFarmStats();
        syncPastureStats();
    }

    function saveActiveGardenModeState() {
        if (isRogueActivityMode() && state.rogueRunV2) {
            saveRogueRunStateV2();
            return;
        }
        saveGardenGameState();
    }

    function openRogueStorageView() {
        closeFarmScreen({ silent: true });
        closePastureScreen({ silent: true });
        closeKitchenScreen({ silent: true });
        setRogueProgressPanelOpen(false);
        switchView('gallery');
        const activeStorageTab = state.rogueRunV2 && state.rogueRunV2.storage
            ? state.rogueRunV2.storage.tab
            : 'crops';
        renderStorageItems(activeStorageTab);
    }

    function tryConsumeRogueActionPoint(cost, reason) {
        const run = getRogueRunV2();
        const amount = Math.max(0, Math.floor(Number(cost) || 0));
        if (!run || amount <= 0) return true;
        run.apRemaining = Math.max(0, Math.floor(Number(run.apRemaining) || 0));
        if (run.apRemaining < amount) {
            showFarmToast(reason ? `${reason}需要 ${amount} 点行动力` : '行动力不足');
            return false;
        }
        run.apRemaining -= amount;
        syncFarmStats();
        saveActiveGardenModeState();
        return true;
    }

    function syncActivitiesFarmCardUi() {
        const farmCard = activitiesViewEl
            ? activitiesViewEl.querySelector('[data-activities-card="farm"]')
            : document.querySelector('#garden-app [data-activities-card="farm"]');
        if (!farmCard) return;
        const descEl = farmCard.querySelector('.garden-activities-desc');
        const statsTextEl = farmCard.querySelector('.garden-activities-stats span');
        const playBtn = farmCard.querySelector('.garden-activities-play-btn');
        const hasProgress = hasPendingRogueActivityProgress();
        if (descEl) {
            descEl.textContent = '三幕分支远征：选路线、叠遗物、打精英，并在最终 Boss 订单里爆仓。';
        }
        if (statsTextEl) {
            statsTextEl.textContent = hasProgress ? '远征进行中 · 点击继续推进' : '丰收远征 V2 · 点击开始';
        }
        if (playBtn) {
            playBtn.setAttribute('aria-label', hasProgress ? 'continue farm rogue challenge' : 'start farm rogue challenge');
            playBtn.title = hasProgress ? '继续远征' : '开始远征';
        }
        farmCard.classList.toggle('is-highlight', true);
    }

    function refreshGardenEconomyUi() {
        syncFarmStats();
        syncPastureStats();
        syncKitchenCookButtons();
        const activeStorageTab = isRogueActivityMode() && state.rogueRunV2 && state.rogueRunV2.storage
            ? state.rogueRunV2.storage.tab
            : state.gardenGame && state.gardenGame.storage
                ? state.gardenGame.storage.tab
                : 'crops';
        renderStorageItems(activeStorageTab);
        syncStorageSellSheetUi();
        syncGardenRogueUi();
        syncActivitiesFarmCardUi();
    }

    function refreshGardenModeViews() {
        refreshGardenEconomyUi();
        renderFarmPlots();
        renderPastureAnimals();
        syncMiniGameMissionUi();
    }

    function syncMiniGameMissionUi() {
        const objective = getRogueNodeObjectiveV2();
        const isRogue = isRogueActivityMode() && !!state.rogueRunV2;
        const currentNodeType = isRogue && state.rogueRunV2.currentNode ? state.rogueRunV2.currentNode.type : null;

        if (farmMissionEl) {
            farmMissionEl.hidden = !isRogue || state.miniMissionCollapsed.farm;
            farmMissionEl.classList.toggle('is-expanded', !state.miniMissionCollapsed.farm);
            const toggle = farmMissionEl.querySelector('[data-mini-mission-toggle="farm"]');
            if (toggle) toggle.textContent = state.miniMissionCollapsed.farm ? '展开' : '收起';
            if (!farmMissionEl.hidden) {
                if (farmMissionTitleEl) farmMissionTitleEl.textContent = `目标：${objective.title}`;
                if (farmMissionProgressEl) farmMissionProgressEl.textContent = `进度：${objective.progressText}`;
                if (farmMissionActionEl) farmMissionActionEl.textContent = `完成后：${objective.reward}`;
            }
        }

        if (pastureMissionEl) {
            pastureMissionEl.hidden = !isRogue || state.miniMissionCollapsed.pasture;
            pastureMissionEl.classList.toggle('is-expanded', !state.miniMissionCollapsed.pasture);
            const toggle = pastureMissionEl.querySelector('[data-mini-mission-toggle="pasture"]');
            if (toggle) toggle.textContent = state.miniMissionCollapsed.pasture ? '展开' : '收起';
            if (!pastureMissionEl.hidden) {
                if (pastureMissionTitleEl) pastureMissionTitleEl.textContent = `目标：${objective.title}`;
                if (pastureMissionProgressEl) pastureMissionProgressEl.textContent = `进度：${objective.progressText}`;
                if (pastureMissionActionEl) pastureMissionActionEl.textContent = `完成后：${objective.reward}`;
            }
        }

        if (kitchenMissionEl) {
            kitchenMissionEl.hidden = !isRogue || state.miniMissionCollapsed.kitchen;
            kitchenMissionEl.classList.toggle('is-expanded', !state.miniMissionCollapsed.kitchen);
            const toggle = kitchenMissionEl.querySelector('[data-mini-mission-toggle="kitchen"]');
            if (toggle) toggle.textContent = state.miniMissionCollapsed.kitchen ? '展开' : '收起';
            if (!kitchenMissionEl.hidden) {
                if (kitchenMissionTitleEl) kitchenMissionTitleEl.textContent = `目标：${objective.title}`;
                if (kitchenMissionProgressEl) kitchenMissionProgressEl.textContent = `进度：${objective.progressText}`;
                if (kitchenMissionActionEl) kitchenMissionActionEl.textContent = `完成后：${objective.reward}`;
            }
        }
    }

    function toggleMiniMission(section) {
        if (!['farm', 'pasture', 'kitchen'].includes(section)) return;
        state.miniMissionCollapsed[section] = !state.miniMissionCollapsed[section];
        syncMiniGameMissionUi();
    }

    function showRogueToast(message) {
        if (!message) return;
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(message, 2200);
            return;
        }
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, 1800, 'info');
        }
    }

    function isRogueActivityMode() {
        return state.gardenMode === 'rogue_activity';
    }

    function getRogueRun() {
        if (state.rogueRunV2) return state.rogueRunV2;
        return isRogueActivityMode() && state.gardenGame ? state.gardenGame.rogueRun : null;
    }

    function ensureRogueRun() {
        if (state.rogueRunV2) return state.rogueRunV2;
        if (!isRogueActivityMode()) return null;
        if (hasPersistedRogueRunV2()) {
            state.rogueRunV2 = loadRogueRunStateV2();
            return state.rogueRunV2;
        }
        return null;
    }

    function getRogueCardContextForStage(stage) {
        if (stage === 'farm') return 'farm';
        if (stage === 'pasture') return 'pasture';
        if (stage === 'kitchen') return 'kitchen';
        if (stage === 'sell_setup') return 'sell';
        return null;
    }

    function getNextRogueStageAfterSupply(stage) {
        if (stage === 'farm') return 'pasture';
        if (stage === 'pasture') return 'kitchen';
        if (stage === 'kitchen') return 'sell_setup';
        return null;
    }

    function getSupplyOptionDef(stage, optionId) {
        return (STAGE_SUPPLY_POOL[stage] || []).find((entry) => entry.id === optionId) || null;
    }

    function createRogueSupplyOffer(stage) {
        const run = ensureRogueRun();
        const options = STAGE_SUPPLY_POOL[stage] || [];
        if (!run || !options.length) return null;
        run.currentSupplyOffer = {
            stage,
            optionIds: options.map((entry) => entry.id).slice(0, 3)
        };
        return run.currentSupplyOffer;
    }

    function createPastureAnimalRewardState(type) {
        const x = 18 + (Math.random() * 64);
        const y = 24 + (Math.random() * 52);
        return createPastureAnimalState(type, x, y, false);
    }

    function applyRogueSupplyReward(optionId) {
        const run = ensureRogueRun();
        const offer = run ? run.currentSupplyOffer : null;
        const option = offer ? getSupplyOptionDef(offer.stage, optionId) : null;
        if (!run || !offer || !option) return false;
        if (option.rewardType === 'coins') {
            updateGardenCoins(option.amount || 0);
        } else if (option.rewardType === 'animal' && option.animalType) {
            getPastureAnimals().push(createPastureAnimalRewardState(option.animalType));
        } else if (option.rewardType === 'items' && option.items) {
            Object.entries(option.items).forEach(([itemId, amount]) => {
                addInventoryItem(itemId, Math.max(0, Math.floor(Number(amount) || 0)));
            });
        }
        return true;
    }

    function hasPendingRogueActivityProgress() {
        if (state.rogueRunV2) return !state.rogueRunV2.completed;
        if (hasPersistedRogueRunV2()) {
            const run = loadRogueRunStateV2();
            return !!(run && !run.completed);
        }
        const legacyRun = state.rogueActivityGame && state.rogueActivityGame.rogueRun
            ? state.rogueActivityGame.rogueRun
            : null;
        return !!legacyRun;
    }

    function getSelectedRogueCardDefs() {
        const run = getRogueRun();
        if (!run || !Array.isArray(run.selectedCards)) return [];
        return run.selectedCards.map((cardId) => ROGUE_CARD_POOL[cardId]).filter(Boolean);
    }

    function hasSelectedRogueCardForContext(context) {
        return getSelectedRogueCardDefs().some((card) => card.context === context);
    }

    function getRogueModifier(cardId) {
        const run = getRogueRun();
        if (!run || !run.activeModifiers) return null;
        return run.activeModifiers[cardId] || null;
    }

    function isRogueModifierActive(cardId) {
        const modifier = getRogueModifier(cardId);
        if (!modifier) return false;
        return modifier.remaining == null || modifier.remaining > 0;
    }

    function getRogueModifierValue(cardId, fallbackValue) {
        const modifier = getRogueModifier(cardId);
        if (modifier && isFiniteNumber(Number(modifier.value))) return Number(modifier.value);
        const card = ROGUE_CARD_POOL[cardId];
        if (card && card.values && isFiniteNumber(Number(card.values.value))) return Number(card.values.value);
        return fallbackValue;
    }

    function createRogueModifierState(cardId) {
        const card = ROGUE_CARD_POOL[cardId];
        if (!card) return null;
        const values = card.values || {};
        return {
            remaining: isFiniteNumber(Number(values.remaining)) ? Math.max(1, Math.floor(Number(values.remaining))) : null,
            value: isFiniteNumber(Number(values.value)) ? Number(values.value) : null,
            flags: Array.isArray(values.flags) ? values.flags.map((flag) => String(flag)).filter(Boolean) : []
        };
    }

    function applyRogueCardModifier(cardId) {
        const run = ensureRogueRun();
        if (!run) return;
        const modifier = createRogueModifierState(cardId);
        if (!modifier) return;
        run.activeModifiers[cardId] = modifier;
    }

    function consumeRogueModifier(cardId, amount = 1) {
        const run = ensureRogueRun();
        if (!run || !run.activeModifiers || !run.activeModifiers[cardId]) return false;
        const modifier = run.activeModifiers[cardId];
        if (modifier.remaining == null) return true;
        modifier.remaining = Math.max(0, Math.floor(Number(modifier.remaining) || 0) - Math.max(1, Math.floor(amount || 1)));
        if (modifier.remaining <= 0) {
            delete run.activeModifiers[cardId];
        }
        return true;
    }

    function rogueModifierHasFlag(cardId, flag) {
        const modifier = getRogueModifier(cardId);
        return !!(modifier && Array.isArray(modifier.flags) && modifier.flags.includes(flag));
    }

    function rogueModifierAddFlag(cardId, flag) {
        const modifier = getRogueModifier(cardId);
        if (!modifier || !flag) return;
        if (!Array.isArray(modifier.flags)) modifier.flags = [];
        if (!modifier.flags.includes(flag)) modifier.flags.push(flag);
    }

    function rogueModifierRemoveFlag(cardId, flag) {
        const modifier = getRogueModifier(cardId);
        if (!modifier || !Array.isArray(modifier.flags)) return;
        modifier.flags = modifier.flags.filter((entry) => entry !== flag);
    }

    function shuffleGardenArray(list) {
        const cloned = Array.isArray(list) ? list.slice() : [];
        for (let index = cloned.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            const temp = cloned[index];
            cloned[index] = cloned[swapIndex];
            cloned[swapIndex] = temp;
        }
        return cloned;
    }

    function createRogueCardOffer(context) {
        const run = ensureRogueRun();
        if (!run) return null;
        const availableCards = shuffleGardenArray(
            Object.values(ROGUE_CARD_POOL).filter((card) => card.context === context && !run.selectedCards.includes(card.id))
        ).slice(0, 3);
        if (!availableCards.length) return null;
        run.currentOffer = {
            context,
            cardIds: availableCards.map((card) => card.id)
        };
        return run.currentOffer;
    }

    function canCookAnyKitchenRecipe() {
        return Object.values(KITCHEN_RECIPES).some((recipe) => hasInventoryItems(recipe.ingredients));
    }

    function getSellUnitPrice(itemId) {
        const meta = ITEM_META[itemId];
        if (!meta) return 0;
        let price = meta.sellPrice;
        if (meta.category === 'cooked' && isRogueModifierActive('kitchen_cooked_markup')) {
            price *= 1 + getRogueModifierValue('kitchen_cooked_markup', 0.2);
        }
        return Math.max(1, Math.round(price));
    }

    function calculateStorageSellGold(itemId, qty) {
        const sellQty = Math.max(0, Math.floor(qty || 0));
        if (sellQty < 1) return 0;
        let totalGold = getSellUnitPrice(itemId) * sellQty;
        if (sellQty >= 3 && isRogueModifierActive('sell_bulk_bonus')) {
            totalGold = Math.round(totalGold * (1 + getRogueModifierValue('sell_bulk_bonus', 0.15)));
        }
        return Math.max(0, Math.round(totalGold));
    }

    function markSellChainPending() {
        if (!isRogueModifierActive('sell_chain_bonus')) return;
        rogueModifierAddFlag('sell_chain_bonus', 'pending_next');
    }

    function takeSellChainPending() {
        if (!rogueModifierHasFlag('sell_chain_bonus', 'pending_next')) return false;
        rogueModifierRemoveFlag('sell_chain_bonus', 'pending_next');
        return true;
    }

    function calculateOrderReward(lines, options) {
        const normalizedLines = Array.isArray(lines) ? lines : [];
        const baseValue = normalizedLines.reduce((sum, line) => sum + (getSellUnitPrice(line.itemId) * line.requiredQty), 0);
        let bonusGold = Math.round(baseValue * 0.5);
        const hasCookedLine = normalizedLines.some((line) => ITEM_META[line.itemId] && ITEM_META[line.itemId].category === 'cooked');
        if (hasCookedLine && isRogueModifierActive('sell_cooked_order')) {
            bonusGold = Math.round(bonusGold * getRogueModifierValue('sell_cooked_order', 1.3));
        }
        if (options && options.chainApplied) {
            bonusGold = Math.round(bonusGold * 1.2);
        }
        if (isRogueModifierActive('sell_order_tip')) {
            bonusGold += Math.round(getRogueModifierValue('sell_order_tip', 60));
        }
        return { baseValue, bonusGold };
    }

    function getSpecialOrderCandidates() {
        return Object.keys(ITEM_META)
            .map((itemId) => ({
                itemId,
                stock: getInventoryCount(itemId),
                meta: ITEM_META[itemId],
                weight: ITEM_META[itemId].category === 'cooked' && isRogueModifierActive('sell_cooked_order') ? 2 : 1
            }))
            .filter((entry) => entry.stock > 0);
    }

    function pickWeightedSpecialOrderCandidate(candidates, excludedIds) {
        const excludedSet = excludedIds instanceof Set ? excludedIds : new Set(excludedIds || []);
        const weightedPool = [];
        (candidates || []).forEach((entry) => {
            if (!entry || excludedSet.has(entry.itemId)) return;
            for (let index = 0; index < Math.max(1, entry.weight || 1); index += 1) {
                weightedPool.push(entry);
            }
        });
        if (!weightedPool.length) return null;
        return weightedPool[Math.floor(Math.random() * weightedPool.length)];
    }

    function createSpecialOrderLine(itemId) {
        const meta = ITEM_META[itemId];
        const stock = getInventoryCount(itemId);
        if (!meta || stock < 1) return null;
        const maxQty = meta.category === 'cooked' ? 2 : 3;
        const requiredQty = Math.max(1, Math.min(stock, 1 + Math.floor(Math.random() * Math.min(maxQty, stock))));
        return { itemId, requiredQty, fulfilledQty: 0 };
    }

    function createSpecialSellOrder() {
        const run = ensureRogueRun();
        const candidates = getSpecialOrderCandidates();
        if (!run || !candidates.length) return null;
        const desiredLineCount = candidates.length >= 2 && Math.random() >= 0.75 ? 2 : 1;
        const chosenIds = [];
        const usedIds = new Set();
        while (chosenIds.length < desiredLineCount) {
            const picked = pickWeightedSpecialOrderCandidate(candidates, usedIds);
            if (!picked) break;
            chosenIds.push(picked.itemId);
            usedIds.add(picked.itemId);
        }
        if (!chosenIds.length) return null;
        const lines = chosenIds.map((itemId) => createSpecialOrderLine(itemId)).filter(Boolean);
        if (!lines.length) return null;
        const chainApplied = takeSellChainPending();
        const reward = calculateOrderReward(lines, { chainApplied });
        return {
            orderId: `rogue_order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            title: `特殊订单 ${Math.min(2, run.progress.ordersCompleted + 1)}/2`,
            lines,
            baseValue: reward.baseValue,
            bonusGold: reward.bonusGold
        };
    }

    function ensureSellStageOrder() {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'sell_orders' || run.currentOrder || run.currentOffer || run.currentSupplyOffer) return false;
        const nextOrder = createSpecialSellOrder();
        if (!nextOrder) return false;
        run.currentOrder = nextOrder;
        return true;
    }

    function syncRogueStateConsistency() {
        const run = ensureRogueRun();
        if (!run) return false;
        let changed = false;
        if (!run.currentSupplyOffer && !run.currentOffer) {
            const currentContext = getRogueCardContextForStage(run.stage);
            if (currentContext && !hasSelectedRogueCardForContext(currentContext)) {
                changed = !!createRogueCardOffer(currentContext) || changed;
            }
        }
        changed = ensureSellStageOrder() || changed;
        return changed;
    }

    function getRogueStageGoalText() {
        const run = getRogueRun();
        if (!run) return '等待新周目开始';
        if (run.currentSupplyOffer) {
            const nextStage = getNextRogueStageAfterSupply(run.currentSupplyOffer.stage);
            return `阶段完成，领取补给后进入${ROGUE_STAGE_LABELS[nextStage] || '下一阶段'}`;
        }
        if (run.stage === 'farm') {
            if (run.currentOffer) return '先选择 1 张农场卡牌';
            return `收获作物 2 次（${Math.min(2, run.progress.farmHarvests)}/2）`;
        }
        if (run.stage === 'pasture') {
            if (run.currentOffer) return '先选择 1 张牧场卡牌';
            return `收获畜产 2 次（${Math.min(2, run.progress.pastureHarvests)}/2）`;
        }
        if (run.stage === 'kitchen') {
            if (run.currentOffer) return '先选择 1 张厨房卡牌';
            if (!canCookAnyKitchenRecipe()) return '暂无可做料理，可无惩罚跳过厨房';
            return `成功烹饪 1 次（${Math.min(1, run.progress.kitchenSuccesses)}/1）`;
        }
        if (run.stage === 'sell_setup') return run.currentOffer ? '先选择 1 张出售卡牌' : '出售卡牌已生效，准备生成特殊订单';
        if (run.stage === 'sell_orders') return run.currentOrder ? `完成特殊订单 2 张（${Math.min(2, run.progress.ordersCompleted)}/2）` : '等待可交付库存';
        return '继续推进本轮周目';
    }

    function getRogueOrderSummaryText() {
        const run = getRogueRun();
        if (!run) return '未开始';
        if (run.currentSupplyOffer) return '本阶段已完成，先领取补给';
        if (run.stage === 'sell_setup') return '选完出售卡后生成第一张订单';
        if (run.stage !== 'sell_orders') return '尚未进入出售阶段';
        if (!run.currentOrder) return '等待可交付库存';
        const completedLines = run.currentOrder.lines.map((line) => {
            const meta = ITEM_META[line.itemId];
            return `${meta ? meta.emoji : '📦'} ${meta ? meta.name : line.itemId} ${line.fulfilledQty}/${line.requiredQty}`;
        });
        return `${run.currentOrder.title} · ${completedLines.join(' / ')} · 奖励 ${run.currentOrder.bonusGold}`;
    }

    function renderStorageSpecialOrderCard() {
        if (!storageOrderCardEl) return;
        if (!isRogueActivityMode()) {
            storageOrderCardEl.hidden = true;
            storageOrderCardEl.innerHTML = '';
            return;
        }
        if (state.rogueRunV2) {
            storageOrderCardEl.hidden = false;
            if (state.rogueRunV2.currentBoss) {
                storageOrderCardEl.classList.remove('is-idle');
                storageOrderCardEl.innerHTML = `
                    <div class="garden-storage-order-head">
                        <div>
                            <div class="garden-storage-order-title">最终 Boss</div>
                            <div class="garden-storage-order-subtitle">三段式超级订单进行中</div>
                        </div>
                        <div class="garden-storage-order-reward">第 ${Math.max(1, Math.floor(Number(state.rogueRunV2.currentBoss.phase) || 1))} / 3 段</div>
                    </div>
                `;
                return;
            }
            if (state.rogueRunV2.currentMarketOrder && Array.isArray(state.rogueRunV2.currentMarketOrder.lines)) {
                const lineHtml = state.rogueRunV2.currentMarketOrder.lines.map((line) => {
                    const meta = ITEM_META[line.itemId];
                    return `
                        <div class="garden-storage-order-line">
                            <span>${meta ? meta.emoji : '📦'} ${meta ? meta.name : line.itemId}</span>
                            <strong>${line.fulfilledQty || 0}/${line.requiredQty || 0}</strong>
                        </div>
                    `;
                }).join('');
                storageOrderCardEl.classList.remove('is-idle');
                storageOrderCardEl.innerHTML = `
                    <div class="garden-storage-order-head">
                        <div>
                            <div class="garden-storage-order-title">市场订单</div>
                            <div class="garden-storage-order-subtitle">完成后获得局内金币与结算奖励</div>
                        </div>
                        <div class="garden-storage-order-reward">进行中</div>
                    </div>
                    <div class="garden-storage-order-lines">${lineHtml}</div>
                `;
                return;
            }
            storageOrderCardEl.classList.add('is-idle');
            storageOrderCardEl.innerHTML = `
                <div class="garden-storage-order-head">
                    <div>
                        <div class="garden-storage-order-title">远征订单</div>
                        <div class="garden-storage-order-subtitle">进入市场或 Boss 节点后，这里会显示当前订单。</div>
                    </div>
                    <div class="garden-storage-order-reward">待触发</div>
                </div>
            `;
            return;
        }
        storageOrderCardEl.hidden = false;
        const run = ensureRogueRun();
        if (!run) {
            storageOrderCardEl.innerHTML = '';
            return;
        }
        const isSellStage = run.stage === 'sell_setup' || run.stage === 'sell_orders';
        storageOrderCardEl.classList.toggle('is-active', isSellStage);
        storageOrderCardEl.classList.toggle('is-idle', !isSellStage);
        if (run.stage === 'sell_setup') {
            storageOrderCardEl.innerHTML = `
                <div class="garden-storage-order-head">
                    <div>
                        <div class="garden-storage-order-title">特殊订单</div>
                        <div class="garden-storage-order-subtitle">选完出售卡后自动生成第一张订单</div>
                    </div>
                    <div class="garden-storage-order-reward">待生成</div>
                </div>
            `;
            return;
        }
        if (run.stage !== 'sell_orders') {
            storageOrderCardEl.innerHTML = `
                <div class="garden-storage-order-head">
                    <div>
                        <div class="garden-storage-order-title">特殊订单</div>
                        <div class="garden-storage-order-subtitle">出售阶段开始后会在这里显示订单</div>
                    </div>
                    <div class="garden-storage-order-reward">未开启</div>
                </div>
            `;
            return;
        }
        if (!run.currentOrder) {
            storageOrderCardEl.innerHTML = `
                <div class="garden-storage-order-head">
                    <div>
                        <div class="garden-storage-order-title">特殊订单</div>
                        <div class="garden-storage-order-subtitle">等待可交付库存，仓库有货后会自动补单</div>
                    </div>
                    <div class="garden-storage-order-reward">补货中</div>
                </div>
            `;
            return;
        }
        const lineHtml = run.currentOrder.lines.map((line) => {
            const meta = ITEM_META[line.itemId];
            return `
                <div class="garden-storage-order-line">
                    <span>${meta ? meta.emoji : '📦'} ${meta ? meta.name : line.itemId}</span>
                    <strong>${line.fulfilledQty}/${line.requiredQty}</strong>
                </div>
            `;
        }).join('');
        storageOrderCardEl.innerHTML = `
            <div class="garden-storage-order-head">
                <div>
                    <div class="garden-storage-order-title">${run.currentOrder.title}</div>
                    <div class="garden-storage-order-subtitle">完成后额外获得 ${run.currentOrder.bonusGold} 金币</div>
                </div>
                <div class="garden-storage-order-reward">${run.progress.ordersCompleted}/2</div>
            </div>
            <div class="garden-storage-order-lines">${lineHtml}</div>
        `;
    }

    function syncKitchenSkipButton() {
        if (!kitchenSkipBtnEl) return;
        if (state.rogueRunV2) {
            const shouldShow = !!state.rogueRunV2.currentNode && state.rogueRunV2.currentNode.type === 'kitchen' && !state.rogueRunV2.currentBoss && !state.rogueRunV2.currentMarketOrder;
            kitchenSkipBtnEl.hidden = !shouldShow;
            kitchenSkipBtnEl.disabled = !shouldShow;
            return;
        }
        const run = getRogueRun();
        const shouldShow = !!run && run.stage === 'kitchen' && !run.currentOffer && !run.currentSupplyOffer && !canCookAnyKitchenRecipe();
        kitchenSkipBtnEl.hidden = !shouldShow;
        kitchenSkipBtnEl.disabled = !shouldShow;
    }

    function renderRogueProgressStrip() {
        if (state.rogueRunV2) {
            renderRogueUiV2();
            return;
        }
        const run = getRogueRun();
        if (!run) return;
        if (rogueProgressStageEl) rogueProgressStageEl.textContent = ROGUE_STAGE_LABELS[run.stage] || '农场阶段';
        if (rogueProgressCardsEl) {
            const cardTitles = getSelectedRogueCardDefs().map((card) => card.title);
            rogueProgressCardsEl.textContent = cardTitles.length ? `卡牌：${cardTitles.join(' · ')}` : '已选卡牌 0/4';
        }
        if (rogueProgressGoalEl) rogueProgressGoalEl.textContent = `目标：${getRogueStageGoalText()}`;
        if (rogueProgressOrderEl) {
            rogueProgressOrderEl.textContent = run.currentOrder
                ? `${run.currentOrder.title} · 奖励 ${run.currentOrder.bonusGold}`
                : (run.stage === 'sell_orders' ? '订单：等待可交付库存' : '订单：未开始');
        }
    }

    function renderRogueProgressPanel() {
        if (state.rogueRunV2) {
            renderRogueUiV2();
            return;
        }
        const run = getRogueRun();
        if (!run) return;
        if (rogueProgressPanelStageEl) rogueProgressPanelStageEl.textContent = ROGUE_STAGE_LABELS[run.stage] || '农场阶段';
        if (rogueProgressPanelGoalEl) rogueProgressPanelGoalEl.textContent = getRogueStageGoalText();
        if (rogueProgressPanelCardsEl) {
            const cards = getSelectedRogueCardDefs();
            rogueProgressPanelCardsEl.innerHTML = cards.length
                ? cards.map((card) => `<span class="garden-rogue-chip">${card.title}</span>`).join('')
                : '<span class="garden-rogue-empty-text">本轮还没有选卡</span>';
        }
        if (rogueProgressPanelOrderEl) {
            if (!run.currentOrder) {
                rogueProgressPanelOrderEl.innerHTML = `<div class="garden-rogue-empty-text">${getRogueOrderSummaryText()}</div>`;
            } else {
                rogueProgressPanelOrderEl.innerHTML = `
                    <div class="garden-rogue-order-title">${run.currentOrder.title}</div>
                    <div class="garden-rogue-order-lines">${run.currentOrder.lines.map((line) => {
                        const meta = ITEM_META[line.itemId];
                        return `<div class="garden-rogue-order-line"><span>${meta ? meta.emoji : '📦'} ${meta ? meta.name : line.itemId}</span><strong>${line.fulfilledQty}/${line.requiredQty}</strong></div>`;
                    }).join('')}</div>
                    <div class="garden-rogue-order-reward">完成奖励：${run.currentOrder.bonusGold} 金币</div>
                `;
            }
        }
    }

    function renderRogueOfferModal() {
        if (state.rogueRunV2) {
            if (state.rogueRunV2.currentDraft && Array.isArray(state.rogueRunV2.currentDraft.relicIds)) {
                const draftType = state.rogueRunV2.currentDraft.type || 'relic';
                openRogueOfferV2(
                    draftType === 'blessing' ? '精英 / Boss 奖励' : '远征奖励',
                    draftType === 'starter' ? '选择起始流派后会自动开局。' : '从以下奖励中选择一个，立即强化你的 build。',
                    buildRogueDraftChoicesFromIds(state.rogueRunV2.currentDraft.relicIds, draftType)
                );
            }
            return;
        }
        if (!rogueOfferModalEl) return;
        const run = getRogueRun();
        const cardOffer = run ? run.currentOffer : null;
        const supplyOffer = run ? run.currentSupplyOffer : null;
        const isOpen = !!(cardOffer || supplyOffer);
        rogueOfferModalEl.classList.toggle('is-open', isOpen);
        rogueOfferModalEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (!isOpen) return;
        if (supplyOffer) {
            if (rogueOfferTitleEl) rogueOfferTitleEl.textContent = `${ROGUE_CONTEXT_LABELS[supplyOffer.stage] || '阶段'}完成补给`;
            if (rogueOfferDescEl) rogueOfferDescEl.textContent = '选择 1 份补给后，会自动进入下一阶段。';
            if (rogueOfferChoicesEl) {
                rogueOfferChoicesEl.innerHTML = supplyOffer.optionIds.map((optionId) => {
                    const option = getSupplyOptionDef(supplyOffer.stage, optionId);
                    if (!option) return '';
                    return `
                        <button class="garden-rogue-card-choice" data-rogue-supply-id="${option.id}" type="button">
                            <div class="garden-rogue-card-choice-title">${option.title}</div>
                            <div class="garden-rogue-card-choice-desc">${option.desc}</div>
                        </button>
                    `;
                }).join('');
            }
            return;
        }
        if (!cardOffer) return;
        if (rogueOfferTitleEl) rogueOfferTitleEl.textContent = `${ROGUE_CONTEXT_LABELS[cardOffer.context] || '阶段'}三选一卡`;
        if (rogueOfferDescEl) rogueOfferDescEl.textContent = `本轮已选 ${run.selectedCards.length} 张卡牌，选择后立即生效。`;
        if (rogueOfferChoicesEl) {
            rogueOfferChoicesEl.innerHTML = cardOffer.cardIds.map((cardId) => {
                const card = ROGUE_CARD_POOL[cardId];
                return `
                    <button class="garden-rogue-card-choice" data-rogue-card-id="${card.id}" type="button">
                        <div class="garden-rogue-card-choice-title">${card.title}</div>
                        <div class="garden-rogue-card-choice-desc">${card.desc}</div>
                    </button>
                `;
            }).join('');
        }
    }

    function syncGardenRogueUi() {
        if (!state.gardenGame) return;
        if (!isRogueActivityMode()) {
            setRogueProgressPanelOpen(false);
            if (rogueProgressStripEl) rogueProgressStripEl.hidden = true;
            if (rogueOfferModalEl) {
                rogueOfferModalEl.classList.remove('is-open');
                rogueOfferModalEl.setAttribute('aria-hidden', 'true');
            }
            renderStorageSpecialOrderCard();
            syncKitchenSkipButton();
            return;
        }
        if (rogueProgressStripEl) rogueProgressStripEl.hidden = false;
        const changed = syncRogueStateConsistency();
        if (changed) saveGardenGameState();
        renderRogueProgressStrip();
        renderRogueProgressPanel();
        renderRogueOfferModal();
        renderStorageSpecialOrderCard();
        syncKitchenSkipButton();
    }

    function setRogueProgressPanelOpen(open) {
        state.roguePanelOpen = !!open;
        if (!rogueProgressPanelEl) return;
        rogueProgressPanelEl.classList.toggle('is-open', state.roguePanelOpen);
        rogueProgressPanelEl.setAttribute('aria-hidden', state.roguePanelOpen ? 'false' : 'true');
    }

    function handleRogueUiClick(event) {
        const miniMissionToggle = event.target.closest('[data-mini-mission-toggle]');
        if (miniMissionToggle) {
            toggleMiniMission(miniMissionToggle.dataset.miniMissionToggle);
            vibrate(10);
            return;
        }
        if (!isRogueActivityMode()) return;
        const openButton = event.target.closest('[data-rogue-open-panel]');
        if (openButton) {
            setRogueProgressPanelOpen(true);
            renderRogueUiV2();
            vibrate(12);
            return;
        }
        const closeButton = event.target.closest('[data-rogue-close-panel]');
        if (closeButton) {
            setRogueProgressPanelOpen(false);
            vibrate(12);
            return;
        }
        const workshopOpenButton = event.target.closest('[data-rogue-action="open-workshop"]');
        if (workshopOpenButton) {
            setRogueWorkshopOpen(true);
            renderRogueUiV2();
            vibrate(12);
            return;
        }
        const storageOpenButton = event.target.closest('[data-rogue-action="open-storage"]');
        if (storageOpenButton) {
            openRogueStorageView();
            vibrate(12);
            return;
        }
        const workshopCloseButton = event.target.closest('[data-rogue-workshop-close]');
        if (workshopCloseButton) {
            setRogueWorkshopOpen(false);
            vibrate(12);
            return;
        }
        const startRunButton = event.target.closest('[data-rogue-action="open-start"]');
        if (startRunButton) {
            setRogueProgressPanelOpen(false);
            if (state.rogueRunV2) {
                if (state.rogueRunV2.currentDraft) {
                    renderRogueOfferModal();
                } else if (state.rogueRunV2.currentNode) {
                    openCurrentRogueStageScreen();
                } else {
                    openRogueNodeChoicesV2();
                }
                vibrate(15);
                return;
            }
            openRogueStartDraftV2();
            vibrate(15);
            return;
        }
        const rogueEntryButton = event.target.closest('[data-rogue-v2-entry]');
        if (rogueEntryButton) {
            const action = rogueEntryButton.dataset.rogueV2Entry;
            if (action === 'continue') {
                closeRogueOfferV2();
                if (state.rogueRunV2) {
                    openRogueRunIntroV2();
                }
            } else if (action === 'restart') {
                closeRogueOfferV2();
                openRogueStartDraftV2();
            }
            vibrate(15);
            return;
        }
        const startLoadoutButton = event.target.closest('[data-rogue-v2-start]');
        if (startLoadoutButton) {
            startRogueRunV2(startLoadoutButton.dataset.rogueV2Start);
            vibrate(15);
            return;
        }
        const introConfirmButton = event.target.closest('[data-rogue-intro-confirm]');
        if (introConfirmButton) {
            confirmRogueRunIntroV2();
            vibrate(15);
            return;
        }
        const introCancelButton = event.target.closest('[data-rogue-intro-cancel]');
        if (introCancelButton) {
            closeRogueIntroV2();
            vibrate(12);
            return;
        }
        const buffOpenButton = event.target.closest('#garden-farm-buff-chip, #garden-pasture-buff-chip, #garden-kitchen-buff-chip');
        if (buffOpenButton) {
            if (state.rogueBuffPanelOpen) {
                closeRogueBuffPanelV2();
            } else {
                openRogueBuffPanelV2();
            }
            vibrate(12);
            return;
        }
        const buffCloseButton = event.target.closest('[data-rogue-buff-close]');
        if (buffCloseButton) {
            closeRogueBuffPanelV2();
            vibrate(12);
            return;
        }
        const kitchenToolCloseButton = event.target.closest('[data-kitchen-tool-panel-close]');
        if (kitchenToolCloseButton) {
            state.kitchenGame.toolPanelOpen = false;
            syncKitchenToolPanelUi();
            vibrate(12);
            return;
        }
        const rogueToolButton = event.target.closest('[data-rogue-tool-use]');
        if (rogueToolButton) {
            useRogueActiveItemV2(rogueToolButton.dataset.rogueToolUse);
            vibrate(12);
            return;
        }
        const nodeChoiceButton = event.target.closest('[data-rogue-v2-node]');
        if (nodeChoiceButton) {
            selectRogueNodeV2(Number(nodeChoiceButton.dataset.rogueV2Node));
            vibrate(15);
            return;
        }
        const restChoiceButton = event.target.closest('[data-rogue-v2-rest]');
        if (restChoiceButton) {
            resolveRogueRestChoiceV2(restChoiceButton.dataset.rogueV2Rest);
            vibrate(15);
            return;
        }
        const eventChoiceButton = event.target.closest('[data-rogue-v2-event-choice]');
        if (eventChoiceButton) {
            resolveRogueEventChoiceV2(eventChoiceButton.dataset.rogueV2EventChoice);
            vibrate(15);
            return;
        }
        const merchantBuyButton = event.target.closest('[data-rogue-v2-merchant-buy]');
        if (merchantBuyButton) {
            resolveRogueMerchantBuyV2(merchantBuyButton.dataset.rogueV2MerchantBuy);
            vibrate(15);
            return;
        }
        const merchantLeaveButton = event.target.closest('[data-rogue-v2-merchant-leave]');
        if (merchantLeaveButton) {
            leaveRogueMerchantV2();
            vibrate(15);
            return;
        }
        const workshopUpgradeButton = event.target.closest('[data-rogue-workshop-upgrade]');
        if (workshopUpgradeButton) {
            upgradeRogueWorkshopNode(workshopUpgradeButton.dataset.rogueWorkshopUpgrade);
            vibrate(15);
            return;
        }
        const relicPickButton = event.target.closest('[data-rogue-v2-pick]');
        if (relicPickButton) {
            const relicId = relicPickButton.dataset.rogueV2Pick;
            const relic = ROGUE_RELIC_POOL_V2[relicId];
            if (state.rogueRunV2 && relic) {
                const pickedDraftType = state.rogueRunV2.currentDraft && state.rogueRunV2.currentDraft.type
                    ? state.rogueRunV2.currentDraft.type
                    : 'relic';
                if (relic.rarity === 'blessing') {
                    state.rogueRunV2.blessings.push(relicId);
                } else {
                    state.rogueRunV2.relics.push(relicId);
                }
                state.rogueRunV2.currentDraft = null;
                ensureRogueMetaV2();
                if (!state.rogueMetaV2.seenRelics.includes(relicId)) {
                    state.rogueMetaV2.seenRelics.push(relicId);
                }
                saveRogueMetaStateV2();
                saveRogueRunStateV2();
                closeRogueOfferV2();
                closeFarmScreen({ silent: true });
                closePastureScreen({ silent: true });
                closeKitchenScreen({ silent: true });
                renderRogueUiV2();
                showRogueToast(`获得 ${relic.title}`);
                if (!state.rogueRunV2.completed) {
                    if (pickedDraftType === 'relic') {
                        openRogueNodeChoicesV2();
                    } else if (state.rogueRunV2.currentNode) {
                        openCurrentRogueStageScreen();
                    } else {
                        openRogueNodeChoicesV2();
                    }
                }
            }
            vibrate(15);
            return;
        }
        const cardButton = event.target.closest('[data-rogue-card-id]');
        if (cardButton) {
            selectRogueCard(cardButton.dataset.rogueCardId);
            vibrate(15);
            return;
        }
        const supplyButton = event.target.closest('[data-rogue-supply-id]');
        if (supplyButton) {
            selectRogueSupply(supplyButton.dataset.rogueSupplyId);
            vibrate(15);
            return;
        }
        const skipButton = event.target.closest('[data-kitchen-skip-rogue]');
        if (skipButton) {
            skipRogueKitchenStage();
            vibrate(15);
            return;
        }
    }

    function openCurrentRogueStageScreen(options) {
        if (state.rogueRunV2) {
            const runV2 = state.rogueRunV2;
            const preferActivitiesBase = !options || options.preferActivitiesBase !== false;
            if (!runV2) return;
            const currentNodeType = runV2.currentNode ? runV2.currentNode.type : null;
            if ((currentNodeType === 'farm' || currentNodeType === 'elite') && preferActivitiesBase && state.currentView === 'gallery') {
                switchView('activities');
            }
            if (currentNodeType === 'farm' || currentNodeType === 'elite') {
                openFarmScreen();
                return;
            }
            if (currentNodeType === 'pasture') {
                if (preferActivitiesBase && state.currentView === 'gallery') {
                    switchView('activities');
                }
                openPastureScreen();
                return;
            }
            if (currentNodeType === 'kitchen' || currentNodeType === 'boss') {
                if (preferActivitiesBase && state.currentView === 'gallery') {
                    switchView('activities');
                }
                openKitchenScreen();
                return;
            }
            if (currentNodeType === 'rest') {
                if (preferActivitiesBase && state.currentView === 'gallery') {
                    switchView('activities');
                }
                openRogueRestModalV2();
                return;
            }
            if (currentNodeType === 'event') {
                if (preferActivitiesBase && state.currentView === 'gallery') {
                    switchView('activities');
                }
                openRogueEventModalV2();
                return;
            }
            if (currentNodeType === 'merchant') {
                if (preferActivitiesBase && state.currentView === 'gallery') {
                    switchView('activities');
                }
                openRogueMerchantModalV2();
                return;
            }
            if (currentNodeType === 'market') {
                switchView('gallery');
                return;
            }
            switchView('gallery');
            return;
        }
        const run = getRogueRun();
        const preferActivitiesBase = !options || options.preferActivitiesBase !== false;
        if (!run) return;
        if (run.stage === 'farm') {
            if (preferActivitiesBase && state.currentView === 'gallery') {
                switchView('activities');
            }
            openFarmScreen();
            return;
        }
        if (run.stage === 'pasture') {
            if (preferActivitiesBase && state.currentView === 'gallery') {
                switchView('activities');
            }
            openPastureScreen();
            return;
        }
        if (run.stage === 'kitchen') {
            if (preferActivitiesBase && state.currentView === 'gallery') {
                switchView('activities');
            }
            openKitchenScreen();
            return;
        }
        switchView('gallery');
    }

    function progressRogueFarmHarvest() {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'farm' || run.currentOffer || run.currentSupplyOffer) return;
        run.progress.farmHarvests += 1;
        if (run.progress.farmHarvests >= 2 && !run.currentSupplyOffer) {
            createRogueSupplyOffer('farm');
            showRogueToast('农场目标完成，来领 1 份阶段补给');
        }
    }

    function progressRoguePastureHarvest() {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'pasture' || run.currentOffer || run.currentSupplyOffer) return;
        run.progress.pastureHarvests += 1;
        if (run.progress.pastureHarvests >= 2 && !run.currentSupplyOffer) {
            createRogueSupplyOffer('pasture');
            showRogueToast('牧场目标完成，来领 1 份阶段补给');
        }
    }

    function progressRogueKitchenSuccess() {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'kitchen' || run.currentOffer || run.currentSupplyOffer) return;
        run.progress.kitchenSuccesses += 1;
        if (run.progress.kitchenSuccesses >= 1 && !run.currentSupplyOffer) {
            createRogueSupplyOffer('kitchen');
            showRogueToast('厨房目标完成，来领 1 份阶段补给');
        }
    }

    function skipRogueKitchenStage() {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'kitchen' || run.currentOffer || run.currentSupplyOffer || canCookAnyKitchenRecipe()) return;
        run.stage = 'sell_setup';
        run.currentOrder = null;
        showRogueToast('已无惩罚跳过厨房，进入出售准备');
        syncRogueStateConsistency();
        saveActiveGardenModeState();
        refreshGardenEconomyUi();
        openCurrentRogueStageScreen({ preferActivitiesBase: false });
    }

    function selectRogueCard(cardId) {
        const run = ensureRogueRun();
        const card = ROGUE_CARD_POOL[cardId];
        if (!run || !card || !run.currentOffer || !run.currentOffer.cardIds.includes(cardId)) return;
        if (!run.selectedCards.includes(cardId)) run.selectedCards.push(cardId);
        applyRogueCardModifier(cardId);
        run.currentOffer = null;
        if (card.context === 'farm') {
            showRogueToast('农场卡已生效，去收获 2 次作物吧');
        } else if (card.context === 'pasture') {
            showRogueToast('牧场卡已生效，去收获 2 次畜产吧');
        } else if (card.context === 'kitchen') {
            showRogueToast(canCookAnyKitchenRecipe() ? '厨房卡已生效，成功做出 1 道菜即可进入出售' : '当前没有可做料理，可以直接跳过厨房');
        } else if (card.context === 'sell') {
            run.stage = 'sell_orders';
            run.currentOrder = null;
            showRogueToast('出售卡已生效，去仓库完成 2 张特殊订单吧');
        }
        syncRogueStateConsistency();
        saveActiveGardenModeState();
        refreshGardenEconomyUi();
        if (card.context === 'sell') {
            openCurrentRogueStageScreen({ preferActivitiesBase: false });
        }
    }

    function selectRogueSupply(optionId) {
        const run = ensureRogueRun();
        const offer = run ? run.currentSupplyOffer : null;
        if (!run || !offer || !offer.optionIds.includes(optionId)) return;
        if (!applyRogueSupplyReward(optionId)) return;
        const nextStage = getNextRogueStageAfterSupply(offer.stage);
        run.currentSupplyOffer = null;
        if (nextStage) {
            run.stage = nextStage;
            if (nextStage === 'sell_setup') {
                run.currentOrder = null;
            }
        }
        syncRogueStateConsistency();
        saveActiveGardenModeState();
        refreshGardenEconomyUi();
        if (nextStage) {
            showRogueToast(`补给已领取，进入${ROGUE_STAGE_LABELS[nextStage] || '下一阶段'}`);
            openCurrentRogueStageScreen();
        }
    }

    function applySellToCurrentOrder(itemId, sellQty) {
        const run = ensureRogueRun();
        if (!run || run.stage !== 'sell_orders' || !run.currentOrder || sellQty < 1) return null;
        let remainingQty = sellQty;
        run.currentOrder.lines.forEach((line) => {
            if (line.itemId !== itemId || remainingQty < 1) return;
            const missingQty = Math.max(0, line.requiredQty - line.fulfilledQty);
            if (missingQty < 1) return;
            const fulfilledNow = Math.min(missingQty, remainingQty);
            line.fulfilledQty += fulfilledNow;
            remainingQty -= fulfilledNow;
        });
        const isCompleted = run.currentOrder.lines.every((line) => line.fulfilledQty >= line.requiredQty);
        if (!isCompleted) return null;
        const completedOrder = run.currentOrder;
        run.progress.ordersCompleted += 1;
        updateGardenCoins(completedOrder.bonusGold);
        markSellChainPending();
        run.currentOrder = null;
        if (run.progress.ordersCompleted >= 2) {
            const completedRuns = Math.max(0, Math.floor(Number(run.completedRuns) || 0)) + 1;
            updateGardenCoins(120);
            if (state.rogueRunV2) {
                state.rogueRunV2.completed = true;
                state.rogueRunV2.victory = true;
                saveRogueRunStateV2();
                renderRogueUiV2();
            } else if (state.gardenGame) {
                state.gardenGame.rogueRun = null;
            }
            showRogueToast(`本轮完成，额外获得 ${completedOrder.bonusGold + 120} 金币，已开启下一轮农场阶段`);
            return { finishedRun: true, reward: completedOrder.bonusGold, settlementGold: 120 };
        }
        ensureSellStageOrder();
        showRogueToast(`订单完成，额外获得 ${completedOrder.bonusGold} 金币`);
        return { finishedRun: false, reward: completedOrder.bonusGold };
    }

    function createEmptyContactFigureDraftFiles() {
        return {
            idle: null,
            runLeft: null,
            runRight: null
        };
    }

    function readHomeTutorialDismissed() {
        try {
            const value = window.localStorage.getItem(GARDEN_HOME_TUTORIAL_DISMISSED_KEY);
            if (value == null) return true;
            return value === '1';
        } catch (error) {
            return true;
        }
    }

    function writeHomeTutorialDismissed(dismissed) {
        try {
            window.localStorage.setItem(GARDEN_HOME_TUTORIAL_DISMISSED_KEY, dismissed ? '1' : '0');
        } catch (error) {
            return;
        }
    }

    function syncHomeTutorialVisibility() {
        if (homeTutorialCardEl) {
            homeTutorialCardEl.hidden = true;
        }
        if (homeTutorialReopenBtnEl) {
            homeTutorialReopenBtnEl.hidden = true;
        }
    }

    function setHomeTutorialDismissed(dismissed) {
        state.homeTutorialDismissed = !!dismissed;
        writeHomeTutorialDismissed(state.homeTutorialDismissed);
        syncHomeTutorialVisibility();
    }

    function init() {
        if (state.initialized) return;

        screenEl = document.getElementById('garden-app');
        closeBtn = document.getElementById('close-garden-app');
        togglePanelBtn = document.getElementById('garden-toggle-panel-btn');
        saveBtn = document.getElementById('garden-save-btn');
        petAdoptionOverlayEl = document.getElementById('garden-pet-adoption-overlay');
        petAdoptionCloseBtnEl = document.getElementById('garden-pet-adoption-close');
        petAdoptionRootEl = document.getElementById('garden-pet-adoption-root');
        petCareOverlayEl = document.getElementById('garden-pet-care-overlay');
        petCareCloseBtnEl = document.getElementById('garden-pet-care-close');
        petCareRootEl = document.getElementById('garden-pet-care-root');
        editorHost = document.getElementById('garden-editor-host');
        titleTextEl = document.querySelector('#garden-app .garden-app-title-text');
        viewEls = Array.from(document.querySelectorAll('#garden-app .garden-app-view'));
        navBtns = Array.from(document.querySelectorAll('#garden-app .garden-bottom-nav-btn'));
        activitiesViewEl = document.querySelector('#garden-app [data-garden-view="activities"]');
        storageViewEl = document.querySelector('#garden-app [data-garden-view="gallery"]');
        storageGridEl = document.getElementById('garden-storage-grid');
        storageTabBtns = Array.from(document.querySelectorAll('#garden-app [data-storage-tab]'));
        storageSellSheetEl = document.getElementById('garden-storage-sell-sheet');
        storageSellBackdropEl = document.getElementById('garden-storage-sell-backdrop');
        storageSellIconEl = document.getElementById('garden-storage-sell-icon');
        storageSellNameEl = document.getElementById('garden-storage-sell-name');
        storageSellStockEl = document.getElementById('garden-storage-sell-stock');
        storageSellPriceEl = document.getElementById('garden-storage-sell-price');
        storageSellQtyEl = document.getElementById('garden-storage-sell-qty');
        storageSellTotalEl = document.getElementById('garden-storage-sell-total');
        storageSellConfirmBtn = document.getElementById('garden-storage-sell-confirm');
        homeEntryMenuEl = document.getElementById('garden-home-entry-menu');
        farmScreenEl = document.getElementById('garden-farm-screen');
        farmCloseBtn = document.getElementById('garden-farm-close-btn');
        farmGridEl = document.getElementById('garden-farm-grid');
        farmSeedPanelEl = document.getElementById('garden-farm-seed-panel');
        farmPanelTitleEl = document.getElementById('garden-farm-panel-title');
        farmSeedListEl = document.getElementById('garden-farm-seed-list');
        farmCoinsEl = document.getElementById('garden-farm-coins');
        farmLevelEl = document.getElementById('garden-farm-level');
        farmApEl = document.getElementById('garden-farm-ap');
        farmApMaxEl = document.getElementById('garden-farm-ap-max');
        farmBuffSummaryEl = document.getElementById('garden-farm-buff-summary');
        farmBuffSummaryTextEl = document.getElementById('garden-farm-buff-summary-text');
        farmBuffChipEl = document.getElementById('garden-farm-buff-chip');
        farmToolBtns = Array.from(document.querySelectorAll('#garden-app [data-farm-tool]'));
        farmToastEl = document.getElementById('garden-farm-toast');
        pastureScreenEl = document.getElementById('garden-pasture-screen');
        pastureCloseBtn = document.getElementById('garden-pasture-close-btn');
        pastureFieldEl = document.getElementById('garden-pasture-field');
        pastureShopPanelEl = document.getElementById('garden-pasture-shop-panel');
        pastureCoinsEl = document.getElementById('garden-pasture-coins');
        pastureExpEl = document.getElementById('garden-pasture-exp');
        pastureBuffSummaryEl = document.getElementById('garden-pasture-buff-summary');
        pastureBuffSummaryTextEl = document.getElementById('garden-pasture-buff-summary-text');
        pastureBuffChipEl = document.getElementById('garden-pasture-buff-chip');
        pastureToolBtns = Array.from(document.querySelectorAll('#garden-app [data-pasture-tool]'));
        pastureShopItems = Array.from(document.querySelectorAll('#garden-app [data-pasture-animal]'));
        pastureToastEl = document.getElementById('garden-pasture-toast');
        kitchenScreenEl = document.getElementById('garden-kitchen-screen');
        kitchenCloseBtn = document.getElementById('garden-kitchen-close-btn');
        kitchenOverlayEl = document.getElementById('garden-kitchen-overlay');
        kitchenQteContainerEl = document.getElementById('garden-kitchen-qte-container');
        kitchenQteDialEl = document.getElementById('garden-kitchen-qte-dial');
        kitchenQtePointerEl = document.getElementById('garden-kitchen-qte-pointer');
        kitchenQteHintEl = document.getElementById('garden-kitchen-qte-hint');
        kitchenToastEl = document.getElementById('garden-kitchen-toast');
        kitchenCookBtns = Array.from(document.querySelectorAll('#garden-app [data-kitchen-cook]'));
        kitchenBuffSummaryEl = document.getElementById('garden-kitchen-buff-summary');
        kitchenBuffSummaryTextEl = document.getElementById('garden-kitchen-buff-summary-text');
        kitchenBuffChipEl = document.getElementById('garden-kitchen-buff-chip');
        kitchenToolPanelEl = document.getElementById('garden-kitchen-tool-panel');
        kitchenToolListEl = document.getElementById('garden-kitchen-tool-list');
        rogueProgressStripEl = document.getElementById('garden-rogue-strip');
        rogueProgressStageEl = document.getElementById('garden-rogue-stage');
        rogueProgressCardsEl = document.getElementById('garden-rogue-cards');
        rogueProgressGoalEl = document.getElementById('garden-rogue-goal');
        rogueProgressOrderEl = document.getElementById('garden-rogue-order');
        rogueProgressPanelEl = document.getElementById('garden-rogue-panel');
        rogueProgressPanelStageEl = document.getElementById('garden-rogue-panel-stage');
        rogueProgressPanelCardsEl = document.getElementById('garden-rogue-panel-cards');
        rogueProgressPanelGoalEl = document.getElementById('garden-rogue-panel-goal');
        rogueProgressPanelOrderEl = document.getElementById('garden-rogue-panel-order');
        rogueOfferModalEl = document.getElementById('garden-rogue-offer');
        rogueOfferTitleEl = document.getElementById('garden-rogue-offer-title');
        rogueOfferDescEl = document.getElementById('garden-rogue-offer-desc');
        rogueOfferChoicesEl = document.getElementById('garden-rogue-offer-choices');
        rogueIntroModalEl = document.getElementById('garden-rogue-intro');
        rogueIntroTitleEl = document.getElementById('garden-rogue-intro-title');
        rogueIntroDescEl = document.getElementById('garden-rogue-intro-desc');
        rogueIntroBodyEl = document.getElementById('garden-rogue-intro-body');
        rogueBuffPanelEl = document.getElementById('garden-rogue-buff-panel');
        rogueBuffPanelListEl = document.getElementById('garden-rogue-buff-panel-list');
        storageOrderCardEl = document.getElementById('garden-storage-order-card');
        kitchenSkipBtnEl = document.getElementById('garden-kitchen-skip-btn');
        farmMissionEl = document.getElementById('garden-farm-mission');
        farmMissionTitleEl = document.getElementById('garden-farm-mission-title');
        farmMissionProgressEl = document.getElementById('garden-farm-mission-progress');
        farmMissionActionEl = document.getElementById('garden-farm-mission-action');
        pastureMissionEl = document.getElementById('garden-pasture-mission');
        pastureMissionTitleEl = document.getElementById('garden-pasture-mission-title');
        pastureMissionProgressEl = document.getElementById('garden-pasture-mission-progress');
        pastureMissionActionEl = document.getElementById('garden-pasture-mission-action');
        kitchenMissionEl = document.getElementById('garden-kitchen-mission');
        kitchenMissionTitleEl = document.getElementById('garden-kitchen-mission-title');
        kitchenMissionProgressEl = document.getElementById('garden-kitchen-mission-progress');
        kitchenMissionActionEl = document.getElementById('garden-kitchen-mission-action');
        homeTutorialCardEl = document.getElementById('garden-home-tutorial-card');
        homeTutorialReopenBtnEl = document.getElementById('garden-home-tutorial-reopen');
        floraScreenEl = document.getElementById('garden-flora-screen');
        floraAppEl = document.getElementById('garden-flora-app');
        floraBackBtn = document.getElementById('garden-flora-back');
        floraArtEl = document.getElementById('garden-flora-art-plant');
        floraParticlesEl = document.getElementById('garden-flora-particles');
        floraLogContentEl = document.getElementById('garden-flora-log-content');
        floraToggleBtns = Array.from(document.querySelectorAll('#garden-flora-screen .garden-flora-toggle-btn'));

        if (!screenEl || !closeBtn || !togglePanelBtn || !saveBtn || !editorHost) {
            return;
        }

        state.casualGardenGame = loadGardenGameState('casual');
        state.rogueMetaV2 = loadRogueMetaStateV2();
        state.rogueRunV2 = loadRogueRunStateV2();
        setGardenMode('casual');
        state.homeTutorialDismissed = readHomeTutorialDismissed();
        saveActiveGardenModeState();
        renderRogueUiV2();
        syncHomeTutorialVisibility();

        closeBtn.addEventListener('click', closeApp);
        if (petAdoptionCloseBtnEl) {
            petAdoptionCloseBtnEl.addEventListener('click', closePetAdoptionOverlay);
        }
        if (petCareCloseBtnEl) {
            petCareCloseBtnEl.addEventListener('click', closePetCareOverlay);
        }
        bindGardenTitleEditing();
        syncGardenTitle();
        syncActivitiesNavButton();
        bindActivitiesInteractions();
        initStorageView();
        ensureContactFigureModal();
        screenEl.addEventListener('click', handleRogueUiClick);
        togglePanelBtn.addEventListener('click', () => {
            if (state.currentView !== 'home') return;
            setDrawerOpen(!state.drawerOpen);
        });
        saveBtn.addEventListener('click', saveDesign);
        navBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                const viewKey = btn.dataset.gardenView;
                if (viewKey === 'home' && state.currentView === 'home') {
                    setDrawerOpen(false);
                    syncHomeEntryMenuSelection();
                    setHomeEntryMenuOpen(!state.homeEntryMenuOpen);
                    vibrate(20);
                    return;
                }

                setHomeEntryMenuOpen(false);
                switchView(viewKey);
                vibrate(20);
            });
        });
        if (homeEntryMenuEl) {
            homeEntryMenuEl.addEventListener('click', handleHomeEntryMenuClick);
        }
        if (farmCloseBtn) {
            farmCloseBtn.addEventListener('click', closeFarmScreen);
        }
        if (pastureCloseBtn) {
            pastureCloseBtn.addEventListener('click', closePastureScreen);
        }
        if (kitchenCloseBtn) {
            kitchenCloseBtn.addEventListener('click', closeKitchenScreen);
        }
        document.addEventListener('click', handleOutsideDrawerClick, true);
        if (floraBackBtn) {
            floraBackBtn.addEventListener('click', closeFloraScreen);
        }
        window.addEventListener('moodflora:statechange', handleFloraStateEvent);
        window.addEventListener('moodflora:contactchange', handleFloraContactEvent);

        initEditor();
        initFarmScreen({ startTimers: false });
        initPastureScreen({ startTimers: false });
        initKitchenScreen();
        syncGardenLayoutFromActiveContact();
        syncFloraFromEngine();
        switchView('home');
        state.initialized = true;
    }

    function sanitizeGardenTitle(value) {
        if (typeof value !== 'string') return '';
        return value.replace(/\s+/g, ' ').trim().slice(0, GARDEN_TITLE_MAX_LENGTH);
    }

    function readGardenTitle() {
        try {
            return sanitizeGardenTitle(window.localStorage.getItem(GARDEN_TITLE_STORAGE_KEY) || '');
        } catch (error) {
            return '';
        }
    }

    function writeGardenTitle(value) {
        try {
            window.localStorage.setItem(GARDEN_TITLE_STORAGE_KEY, value);
        } catch (error) {
            console.warn('[garden-app] title-save-failed', error);
        }
    }

    function applyGardenTitle(value) {
        if (!titleTextEl) return;
        const nextTitle = sanitizeGardenTitle(value) || GARDEN_TITLE_DEFAULT;
        titleTextEl.textContent = nextTitle;
        titleTextEl.setAttribute('title', nextTitle);
    }

    function syncGardenTitle() {
        if (!titleTextEl) return;
        applyGardenTitle(readGardenTitle() || titleTextEl.textContent || GARDEN_TITLE_DEFAULT);
    }

    function moveCaretToEnd(el) {
        if (!el || !window.getSelection || !document.createRange) return;
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    function finishGardenTitleEditing(commit = true) {
        if (!titleTextEl || !titleTextEl.classList.contains('is-editing')) return;

        const previousTitle = titleTextEl.dataset.previousTitle || GARDEN_TITLE_DEFAULT;
        const currentTitle = sanitizeGardenTitle(titleTextEl.textContent);

        titleTextEl.contentEditable = 'false';
        titleTextEl.classList.remove('is-editing');

        if (!commit) {
            applyGardenTitle(previousTitle);
            delete titleTextEl.dataset.previousTitle;
            return;
        }

        const nextTitle = currentTitle || previousTitle || GARDEN_TITLE_DEFAULT;
        applyGardenTitle(nextTitle);
        writeGardenTitle(nextTitle);
        delete titleTextEl.dataset.previousTitle;
        vibrate(10);
    }

    function startGardenTitleEditing() {
        if (!titleTextEl || titleTextEl.classList.contains('is-editing')) return;

        titleTextEl.dataset.previousTitle = sanitizeGardenTitle(titleTextEl.textContent) || GARDEN_TITLE_DEFAULT;
        titleTextEl.contentEditable = 'true';
        titleTextEl.spellcheck = false;
        titleTextEl.classList.add('is-editing');
        titleTextEl.focus();
        moveCaretToEnd(titleTextEl);
    }

    function bindGardenTitleEditing() {
        if (!titleTextEl || titleTextEl.dataset.editBound === 'true') return;

        titleTextEl.dataset.editBound = 'true';
        titleTextEl.setAttribute('role', 'textbox');
        titleTextEl.setAttribute('aria-label', '\u7f16\u8f91\u5bb6\u56ed\u6807\u9898');

        titleTextEl.addEventListener('click', (event) => {
            event.stopPropagation();
            startGardenTitleEditing();
        });

        titleTextEl.addEventListener('blur', () => {
            finishGardenTitleEditing(true);
        });

        titleTextEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                finishGardenTitleEditing(true);
                return;
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                finishGardenTitleEditing(false);
            }
        });

        titleTextEl.addEventListener('input', () => {
            if (!titleTextEl.classList.contains('is-editing')) return;
            const sanitizedText = sanitizeGardenTitle(titleTextEl.textContent);
            if (titleTextEl.textContent !== sanitizedText) {
                titleTextEl.textContent = sanitizedText;
                moveCaretToEnd(titleTextEl);
            }
        });
    }

    function syncActivitiesNavButton() {
        const button = document.querySelector('#garden-app .garden-bottom-nav-btn[data-garden-view="activities"]');
        if (!button) return;

        const icon = button.querySelector('i');
        const label = button.querySelector('span');
        if (icon) {
            icon.className = 'fas fa-gamepad';
        }
        if (label) {
            label.textContent = '\u6d3b\u52a8';
        }
    }

    function setHomeEntryMenuOpen(open) {
        state.homeEntryMenuOpen = Boolean(open) && state.currentView === 'home';
        if (!homeEntryMenuEl) return;
        homeEntryMenuEl.classList.toggle('is-open', state.homeEntryMenuOpen);
        homeEntryMenuEl.setAttribute('aria-hidden', state.homeEntryMenuOpen ? 'false' : 'true');
    }

    function syncHomeEntryMenuSelection() {
        if (!homeEntryMenuEl) return;
        homeEntryMenuEl.querySelectorAll('[data-garden-home-entry]').forEach((button) => {
            button.classList.toggle('is-current', button.dataset.gardenHomeEntry === state.currentHomeSection);
        });
    }

    function handleHomeEntrySelection(entryKey) {
        const targetKey = HOME_ENTRY_META[entryKey] ? entryKey : 'home';
        setHomeEntryMenuOpen(false);
        vibrate(20);

        if (targetKey === 'home') {
            state.currentHomeSection = 'home';
            syncHomeEntryMenuSelection();
            switchView('home');
            return;
        }

        if (targetKey === 'farm') {
            openCasualFarmScreen();
            return;
        }

        if (targetKey === 'pasture') {
            openCasualPastureScreen();
            return;
        }

        if (targetKey === 'kitchen') {
            openCasualKitchenScreen();
            return;
        }

        const label = HOME_ENTRY_META[targetKey] ? HOME_ENTRY_META[targetKey].label : '\u8be5\u533a\u57df';
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(`${label}\u5165\u53e3\u83dc\u5355\u5df2\u7ecf\u505a\u597d\uff0c\u4e0b\u4e00\u6b65\u6211\u53ef\u4ee5\u7ee7\u7eed\u5e2e\u4f60\u628a\u9875\u9762\u63a5\u8fdb\u53bb`, 2200);
            return;
        }
        if (typeof window.showNotification === 'function') {
            window.showNotification(`${label}\u5165\u53e3\u83dc\u5355\u5df2\u7ecf\u505a\u597d`, 1800, 'info');
        }
    }

    function handleHomeEntryMenuClick(event) {
        const closeTarget = event.target.closest('[data-garden-home-entry-close]');
        if (closeTarget) {
            setHomeEntryMenuOpen(false);
            return;
        }

        const entryButton = event.target.closest('[data-garden-home-entry]');
        if (!entryButton) return;
        handleHomeEntrySelection(entryButton.dataset.gardenHomeEntry);
    }

    function enterCasualGardenMode() {
        setGardenMode('casual');
        saveActiveGardenModeState();
        refreshGardenEconomyUi();
        renderFarmPlots();
        renderPastureAnimals();
    }

    function enterRogueActivityMode() {
        if (!state.rogueMetaV2) state.rogueMetaV2 = loadRogueMetaStateV2();
        if (!state.rogueRunV2 && hasPersistedRogueRunV2()) {
            state.rogueRunV2 = loadRogueRunStateV2();
        }
        setGardenMode('rogue_activity');
        saveGardenGameState();
        renderRogueUiV2();
        refreshGardenEconomyUi();
        renderFarmPlots();
        renderPastureAnimals();
    }

    function openCasualFarmScreen() {
        enterCasualGardenMode();
        openFarmScreen();
    }

    function openCasualPastureScreen() {
        enterCasualGardenMode();
        openPastureScreen();
    }

    function openCasualKitchenScreen() {
        enterCasualGardenMode();
        openKitchenScreen();
    }

    function initFarmScreen(options = {}) {
        if (!farmGridEl || !farmSeedListEl) return;
        if (!state.farmGame.initialized) {
            farmGridEl.innerHTML = '';
            for (let index = 0; index < 9; index += 1) {
                const plot = document.createElement('div');
                plot.className = 'garden-farm-plot';
                plot.dataset.plotIndex = String(index);
                plot.innerHTML = '<span class="garden-farm-crop"></span><div class="garden-farm-progress-meta"><div class="garden-farm-progress-container"><div class="garden-farm-progress-fill"></div></div><div class="garden-farm-progress-time"></div></div>';
                plot.addEventListener('click', () => handleFarmPlotClick(plot));
                farmGridEl.appendChild(plot);
            }

            farmSeedListEl.innerHTML = '';
            Object.values(FARM_SEEDS).forEach((seed, index) => {
                const item = document.createElement('div');
                item.className = `garden-farm-seed-item${index === 0 ? ' active' : ''}`;
                item.dataset.farmSeed = seed.id;
                item.innerHTML = `<div class="garden-farm-seed-emoji">${seed.emoji}</div><div class="garden-farm-seed-info"><i class="ri-copper-coin-fill" style="color:#FFD700;"></i>${seed.cost}</div><div class="garden-farm-seed-time">${formatFarmDuration(seed.time)}</div>`;
                item.addEventListener('click', () => setFarmSeed(seed.id));
                farmSeedListEl.appendChild(item);
            });

            farmToolBtns.forEach((button) => {
                button.addEventListener('click', () => setFarmTool(button.dataset.farmTool));
            });

            state.farmGame.initialized = true;
        }

        const shouldStartTimers = !(options && options.startTimers === false);
        if (shouldStartTimers) ensureFarmProgressTimer();
        renderFarmPlots();
        syncFarmStats();
        syncFarmToolUi();
    }

    function syncFarmStats() {
        const isRogue = isRogueActivityMode() && !!state.rogueRunV2;
        const coins = isRogue
            ? Math.max(0, Math.floor(Number(state.rogueRunV2.runCoins) || 0))
            : (state.gardenGame ? state.gardenGame.coins : 0);
        const level = isRogue
            ? Math.max(1, Math.floor(Number((state.rogueRunV2.farm && state.rogueRunV2.farm.level) || 1)))
            : (state.gardenGame ? state.gardenGame.farm.level : 1);
        const apRemaining = isRogue ? Math.max(0, Math.floor(Number(state.rogueRunV2.apRemaining) || 0)) : 0;
        const dailyAP = isRogue ? Math.max(0, Math.floor(Number(state.rogueRunV2.dailyAP) || 0)) : 0;
        if (farmCoinsEl) farmCoinsEl.textContent = String(coins);
        if (farmLevelEl) farmLevelEl.textContent = String(level);
        if (farmApEl) farmApEl.textContent = String(apRemaining);
        if (farmApMaxEl) farmApMaxEl.textContent = String(dailyAP);
    }

    function ensureFarmProgressTimer() {
        if (state.farmGame.progressTimer) return;
        state.farmGame.progressTimer = window.setInterval(() => {
            if (!state.farmScreenOpen) return;
            const changed = advanceFarmPlotsByClock();
            renderFarmPlots();
            if (changed) saveGardenGameState();
        }, 250);
    }

    function stopFarmProgressTimer() {
        if (!state.farmGame.progressTimer) return;
        window.clearInterval(state.farmGame.progressTimer);
        state.farmGame.progressTimer = null;
    }

    function advanceFarmPlotsByClock() {
        const now = Date.now();
        let changed = false;
        getFarmPlots().forEach((plot) => {
            changed = advanceFarmPlotByClock(plot, now) || changed;
        });
        return changed;
    }

    function getFarmPlotStateByElement(plotEl) {
        if (!plotEl) return null;
        const plotIndex = Number(plotEl.dataset.plotIndex);
        return getFarmPlots()[plotIndex] || null;
    }

    function getFarmPlotProgress(plot) {
        if (!plot || plot.state !== 'growing' || !plot.seedId || !isFiniteNumber(plot.readyAt)) return 0;
        const seed = FARM_SEEDS[plot.seedId];
        if (!seed) return 0;
        const totalDuration = isFiniteNumber(plot.growDuration) ? plot.growDuration : seed.time;
        const remaining = Math.max(0, plot.readyAt - Date.now());
        return Math.max(0, Math.min(100, ((totalDuration - remaining) / totalDuration) * 100));
    }

    function renderFarmPlots() {
        if (!farmGridEl) return;
        const now = Date.now();
        let changed = false;
        Array.from(farmGridEl.children).forEach((plotEl, index) => {
            const plot = getFarmPlots()[index] || createEmptyFarmPlotState();
            changed = advanceFarmPlotByClock(plot, now) || changed;
            const cropEl = plotEl.querySelector('.garden-farm-crop');
            const progressMetaEl = plotEl.querySelector('.garden-farm-progress-meta');
            const progressFillEl = plotEl.querySelector('.garden-farm-progress-fill');
            const progressTimeEl = plotEl.querySelector('.garden-farm-progress-time');
            plotEl.dataset.state = plot.state;
            plotEl.dataset.seedId = plot.seedId || '';
            plotEl.classList.remove('planted', 'growing', 'ready');

            if (plot.state === 'empty' || !plot.seedId) {
                if (cropEl) cropEl.textContent = '';
                if (progressFillEl) progressFillEl.style.width = '0%';
                if (progressTimeEl) progressTimeEl.textContent = '';
                if (progressMetaEl) progressMetaEl.style.display = 'none';
                return;
            }

            const seed = FARM_SEEDS[plot.seedId];
            if (plot.state === 'ready') {
                plotEl.classList.add('ready');
                if (cropEl) cropEl.textContent = seed ? seed.emoji : '🌾';
                if (progressFillEl) progressFillEl.style.width = '100%';
                if (progressTimeEl) progressTimeEl.textContent = '';
                if (progressMetaEl) progressMetaEl.style.display = 'none';
                return;
            }

            if (progressMetaEl) progressMetaEl.style.display = 'flex';
            if (plot.state === 'planted') {
                plotEl.classList.add('planted');
                if (cropEl) cropEl.textContent = '🌱';
                if (progressFillEl) progressFillEl.style.width = '0%';
                if (progressTimeEl) progressTimeEl.textContent = `成熟 ${seed ? formatFarmDuration(seed.time) : '01:00'}`;
                return;
            }

            if (plot.state === 'growing') {
                plotEl.classList.add('growing');
            }
            if (cropEl) cropEl.textContent = '🌱';
            if (progressFillEl) progressFillEl.style.width = `${getFarmPlotProgress(plot)}%`;
            if (progressTimeEl) {
                progressTimeEl.textContent = `剩余 ${formatFarmDuration(Math.max(0, (plot.readyAt || now) - now))}`;
            }
        });

        if (changed) saveGardenGameState();
    }

    function syncFarmToolUi() {
        farmToolBtns.forEach((button) => {
            button.classList.toggle('active', button.dataset.farmTool === state.farmGame.currentTool);
        });
        if (farmSeedPanelEl) {
            farmSeedPanelEl.classList.toggle('is-open', state.farmGame.currentTool === 'plant' || state.farmGame.currentTool === 'tool');
        }
        if (farmPanelTitleEl) {
            farmPanelTitleEl.textContent = state.farmGame.currentTool === 'tool' ? '局内道具' : '种子背包';
        }
        if (!farmSeedListEl) return;
        if (state.farmGame.currentTool !== 'tool') {
            renderFarmSeedListUi();
        }
        if (state.farmGame.currentTool === 'tool' && isRogueActivityMode()) {
            renderFarmToolListUi();
            return;
        }
        farmSeedListEl.querySelectorAll('[data-farm-seed]').forEach((item) => {
            item.classList.toggle('active', item.dataset.farmSeed === state.farmGame.currentSeed);
        });
    }

    function renderFarmSeedListUi() {
        if (!farmSeedListEl) return;
        const rows = Object.values(FARM_SEEDS).map((seed) => {
            const selected = state.farmGame.currentSeed === seed.id;
            return `
                <button class="garden-farm-seed-item ${selected ? 'active' : ''}" data-farm-seed="${seed.id}" type="button">
                    <div class="garden-farm-seed-emoji">${seed.emoji}</div>
                    <div class="garden-farm-seed-info">${seed.name}</div>
                    <div class="garden-farm-seed-time">${formatFarmDuration(seed.time)}</div>
                </button>
            `;
        }).join('');
        farmSeedListEl.innerHTML = rows;
        farmSeedListEl.querySelectorAll('[data-farm-seed]').forEach((item) => {
            item.addEventListener('click', () => setFarmSeed(item.dataset.farmSeed));
        });
    }

    function renderFarmToolListUi() {
        if (!farmSeedListEl) return;
        const rows = Object.keys(ROGUE_ACTIVE_ITEM_POOL_V2)
            .filter((itemId) => ROGUE_ACTIVE_ITEM_POOL_V2[itemId].scope === 'farm' && getRogueToolCountV2(itemId) > 0)
            .map((itemId) => {
                const tool = ROGUE_ACTIVE_ITEM_POOL_V2[itemId];
                const selected = state.farmGame.selectedToolItemId === itemId;
                return `
                    <button class="garden-farm-seed-item ${selected ? 'active' : ''}" data-rogue-tool-use="${itemId}" type="button">
                        <div class="garden-farm-seed-icon">${tool.emoji}</div>
                        <div class="garden-farm-seed-meta">
                            <div class="garden-farm-seed-name">${tool.name} x${getRogueToolCountV2(itemId)}</div>
                            <div class="garden-farm-seed-cost">${tool.desc}</div>
                        </div>
                    </button>
                `;
            }).join('');
        farmSeedListEl.innerHTML = rows || '<div class="garden-rogue-empty-text">当前没有可用农场道具</div>';
    }

    function setFarmTool(toolKey) {
        state.farmGame.currentTool = toolKey || 'plant';
        syncFarmToolUi();
        vibrate(15);
    }

    function setFarmSeed(seedId) {
        if (!FARM_SEEDS[seedId]) return;
        state.farmGame.currentSeed = seedId;
        syncFarmToolUi();
        vibrate(15);
    }

    function openFarmScreen() {
        initFarmScreen();
        if (!farmScreenEl) return;
        closePastureScreen({ silent: true });
        closeKitchenScreen({ silent: true });
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closeFloraScreen();
        if (editorHost) editorHost.style.display = 'none';
        state.farmScreenOpen = true;
        state.currentHomeSection = 'farm';
        farmScreenEl.classList.add('is-open');
        farmScreenEl.setAttribute('aria-hidden', 'false');
        syncAssignmentFigures();
        syncMiniGameMissionUi();
        syncRogueBuffSummaryUi();
        vibrate(20);
    }

    function closeFarmScreen(options) {
        if (!farmScreenEl) return;
        const silent = !!(options && options.silent);
        state.farmScreenOpen = false;
        stopFarmProgressTimer();
        if (editorHost) editorHost.style.display = '';
        state.currentHomeSection = 'home';
        farmScreenEl.classList.remove('is-open');
        farmScreenEl.setAttribute('aria-hidden', 'true');
        clearAssignmentFigures();
        if (!silent) vibrate(20);
    }

    function handleFarmPlotClick(plotEl) {
        if (!plotEl) return;
        const plotState = plotEl.dataset.state || 'empty';
        const currentTool = state.farmGame.currentTool;

        if (currentTool === 'tool' && isRogueActivityMode()) {
            const selectedTool = state.farmGame.selectedToolItemId;
            if (!selectedTool) {
                showFarmToast('先从底栏选择一个农场道具');
                return;
            }
            const plot = getFarmPlotStateByElement(plotEl);
            if (!plot) return;
            if (selectedTool === 'greenhouse_spray') {
                if (plot.state !== 'growing' && plot.state !== 'planted') {
                    showFarmToast('温室喷雾要对已种下的作物使用');
                    return;
                }
                if (!consumeRogueToolV2(selectedTool)) return;
                plot.state = 'ready';
                plot.readyAt = Date.now();
                state.farmGame.selectedToolItemId = null;
                renderFarmPlots();
                saveActiveGardenModeState();
                syncRogueBuffSummaryUi();
                showFarmToast('温室喷雾生效，这块地已立刻成熟');
                return;
            }
            if (selectedTool === 'fertilizer') {
                if (plot.state !== 'growing' && plot.state !== 'ready' && plot.state !== 'planted') {
                    showFarmToast('肥料要对已经种下的作物使用');
                    return;
                }
                if (!consumeRogueToolV2(selectedTool)) return;
                plot.bonusYield = (Number(plot.bonusYield) || 0) + 1;
                state.farmGame.selectedToolItemId = null;
                saveActiveGardenModeState();
                syncRogueBuffSummaryUi();
                showFarmToast('施肥成功，这块地收获时会额外增产');
                return;
            }
        }

        if (currentTool === 'plant') {
            if (plotState !== 'empty') {
                showFarmToast('这块地已经种上啦');
                return;
            }
            const seed = FARM_SEEDS[state.farmGame.currentSeed];
            if (!seed) return;
            const isRogue = isRogueActivityMode() && !!state.rogueRunV2;
            if (isRogue && !tryConsumeRogueActionPoint(1, '播种')) {
                return;
            }
            const availableCoins = isRogue
                ? Math.max(0, Math.floor(Number(state.rogueRunV2.runCoins) || 0))
                : (state.gardenGame ? state.gardenGame.coins : 0);
            if (availableCoins < seed.cost) {
                if (isRogue && state.rogueRunV2) {
                    state.rogueRunV2.apRemaining += 1;
                    syncFarmStats();
                    saveActiveGardenModeState();
                }
                showFarmToast('金币不足啦');
                return;
            }
            updateGardenCoins(-seed.cost);
            let rebateGold = 0;
            if (isRogueModifierActive('farm_seed_rebate')) {
                rebateGold = Math.ceil(seed.cost * getRogueModifierValue('farm_seed_rebate', 0.3));
                if (rebateGold > 0) {
                    updateGardenCoins(rebateGold);
                }
            }
            plantFarmSeed(plotEl, seed, rebateGold);
            return;
        }

        if (currentTool === 'water') {
            if (plotState === 'planted') {
                waterFarmPlot(plotEl);
                return;
            }
            if (plotState === 'growing') {
                showFarmToast('已经浇过水啦，等现实时间过去后成熟');
                return;
            }
            if (plotState === 'ready') {
                showFarmToast('已经成熟啦，快去收获');
                return;
            }
            showFarmToast('先种下种子再浇水');
            return;
        }

        if (currentTool === 'harvest') {
            if (plotState !== 'ready') {
                showFarmToast('还没成熟，先等等');
                return;
            }
            const plot = getFarmPlotStateByElement(plotEl);
            const seed = plot ? FARM_SEEDS[plot.seedId] : null;
            if (!seed) return;
            harvestFarmCrop(plotEl, seed);
            return;
        }

        if (currentTool === 'shovel') {
            if (plotState === 'empty') {
                showFarmToast('这块地现在是空的');
                return;
            }
            clearFarmPlot(plotEl);
            showFarmToast('已铲除当前作物');
            return;
        }

        if (plotState === 'ready') {
            const plot = getFarmPlotStateByElement(plotEl);
            const seed = plot ? FARM_SEEDS[plot.seedId] : null;
            showFarmToast(seed ? `${seed.name} 已成熟，快去收获` : '作物已成熟');
            return;
        }
        if (plotState === 'planted') {
            showFarmToast('种子已经种下，记得先浇水');
            return;
        }
        if (plotState === 'growing') {
            showFarmToast('已经浇过水，等待现实时间成熟');
            return;
        }
        showFarmToast('切换工具后就能开始种地啦');
    }

    function plantFarmSeed(plotEl, seed, rebateGold = 0) {
        const plot = getFarmPlotStateByElement(plotEl);
        if (!plot) return;
        plot.state = 'planted';
        plot.seedId = seed.id;
        plot.readyAt = null;
        plot.growDuration = null;
        renderFarmPlots();
        saveGardenGameState();
        showFarmToast(rebateGold > 0
            ? `已种下${seed.name}，返还 ${rebateGold} 金币，记得浇水`
            : `已种下${seed.name}，记得浇水`);
    }

    function waterFarmPlot(plotEl) {
        const plot = getFarmPlotStateByElement(plotEl);
        if (!plot || plot.state !== 'planted' || !plot.seedId) return;
        const seed = FARM_SEEDS[plot.seedId];
        if (!seed) return;
        plotEl.style.backgroundColor = 'var(--farm-dirt-wet)';
        window.setTimeout(() => {
            plotEl.style.backgroundColor = '';
        }, 500);
        const fastWaterApplied = consumeRogueModifier('farm_fast_water');
        const growDuration = Math.max(60 * 1000, Math.round(seed.time * (fastWaterApplied ? getRogueModifierValue('farm_fast_water', 0.75) : 1)));
        plot.state = 'growing';
        plot.growDuration = growDuration;
        plot.readyAt = Date.now() + growDuration;
        renderFarmPlots();
        saveGardenGameState();
        showFarmToast(fastWaterApplied ? '已浇水，速熟效果已生效' : '已浇水，开始按现实时间生长');
    }

    function harvestFarmCrop(plotEl, seed) {
        const plot = getFarmPlotStateByElement(plotEl);
        if (!plot) return;
        let rewardQty = 1;
        if (Number(plot.bonusYield || 0) > 0) {
            rewardQty += Math.max(0, Math.floor(Number(plot.bonusYield) || 0));
            plot.bonusYield = 0;
        }
        if (consumeRogueModifier('farm_double_crop') && Math.random() < getRogueModifierValue('farm_double_crop', 0.35)) {
            rewardQty += 1;
        }
        const cropMeta = ITEM_META[seed.inventoryId];
        if (cropMeta && cropMeta.sellPrice >= 25 && isRogueModifierActive('farm_big_crop')) {
            rewardQty += 1;
        }
        addInventoryItem(seed.inventoryId, rewardQty);
        plot.state = 'empty';
        plot.seedId = '';
        plot.readyAt = null;
        plot.growDuration = null;
        if (isRogueActivityMode() && state.rogueRunV2) {
            state.rogueRunV2.farm.exp = Math.max(0, Math.floor(Number(state.rogueRunV2.farm.exp) || 0) + 10);
            progressRogueFarmHarvestV2();
        } else if (state.gardenGame) {
            state.gardenGame.farm.exp += 10;
            progressRogueFarmHarvest();
        }

        let leveledUp = false;
        const farmState = isRogueActivityMode() && state.rogueRunV2 ? state.rogueRunV2.farm : state.gardenGame.farm;
        while (farmState.exp >= 100) {
            farmState.exp -= 100;
            farmState.level += 1;
            leveledUp = true;
        }

        renderFarmPlots();
        saveActiveGardenModeState();
        refreshGardenEconomyUi();
        showFarmToast(leveledUp
            ? `收获 ${seed.name} x${rewardQty}，已存入仓库 · 升到 ${farmState.level} 级`
            : `收获 ${seed.name} x${rewardQty}，已存入仓库`);
    }

    function clearFarmPlot(plotEl) {
        const plot = getFarmPlotStateByElement(plotEl);
        if (!plot) return;
        plot.state = 'empty';
        plot.seedId = '';
        plot.readyAt = null;
        plot.growDuration = null;
        renderFarmPlots();
        saveGardenGameState();
    }

    function showFarmToast(message) {
        if (!farmToastEl || !message) return;
        farmToastEl.textContent = message;
        farmToastEl.classList.add('is-visible');
        window.clearTimeout(state.farmToastTimeout);
        state.farmToastTimeout = window.setTimeout(() => {
            if (farmToastEl) farmToastEl.classList.remove('is-visible');
        }, 2000);
    }

    function initPastureScreen(options = {}) {
        if (!pastureFieldEl || !pastureShopPanelEl || !pastureCoinsEl || !pastureExpEl) return;
        if (!state.pastureGame.initialized) {
            state.pastureGame.shopMarkup = pastureShopPanelEl.innerHTML;
            pastureFieldEl.addEventListener('click', handlePastureAreaClick);
            pastureToolBtns.forEach((button) => {
                button.addEventListener('click', () => {
                    const tool = button.dataset.pastureTool;
                    if (tool) setPastureTool(tool);
                });
            });
            pastureShopItems.forEach((button) => {
                button.addEventListener('click', () => {
                    const animalType = button.dataset.pastureAnimal;
                    if (animalType) selectPastureAnimalToBuy(animalType);
                });
            });
            state.pastureGame.initialized = true;
        }

        const shouldStartTimers = !(options && options.startTimers === false);
        if (shouldStartTimers) ensurePastureTimers();
        syncPastureStats();
        syncPastureToolUi();
        selectPastureAnimalToBuy(state.pastureGame.selectedAnimalToBuy, false);
        renderPastureAnimals();
    }

    function syncPastureStats() {
        const isRogue = isRogueActivityMode() && !!state.rogueRunV2;
        const coins = isRogue
            ? Math.max(0, Math.floor(Number(state.rogueRunV2.runCoins) || 0))
            : (state.gardenGame ? state.gardenGame.coins : 0);
        const level = isRogue
            ? Math.max(1, Math.floor(Number((state.rogueRunV2.pasture && state.rogueRunV2.pasture.level) || 1)))
            : (state.gardenGame ? state.gardenGame.pasture.level : 1);
        if (pastureCoinsEl) pastureCoinsEl.textContent = String(coins);
        if (pastureExpEl) pastureExpEl.textContent = `Lv.${level}`;
    }

    function syncPastureToolUi() {
        pastureToolBtns.forEach((button) => {
            button.classList.toggle('active', button.dataset.pastureTool === state.pastureGame.currentTool);
        });
        if (pastureShopPanelEl) {
            pastureShopPanelEl.style.display = state.pastureGame.currentTool === 'shop' || state.pastureGame.currentTool === 'tool' ? 'flex' : 'none';
            if (state.pastureGame.currentTool === 'shop') {
                if (state.pastureGame.shopMarkup) {
                    pastureShopPanelEl.innerHTML = state.pastureGame.shopMarkup;
                    pastureShopItems = Array.from(document.querySelectorAll('#garden-app [data-pasture-animal]'));
                    pastureShopItems.forEach((button) => {
                        button.addEventListener('click', () => {
                            const animalType = button.dataset.pastureAnimal;
                            if (animalType) selectPastureAnimalToBuy(animalType);
                        });
                        button.classList.toggle('selected', button.dataset.pastureAnimal === state.pastureGame.selectedAnimalToBuy);
                    });
                }
            } else if (state.pastureGame.currentTool === 'tool' && isRogueActivityMode()) {
                renderPastureToolListUi();
            }
        }
    }

    function renderPastureToolListUi() {
        if (!pastureShopPanelEl) return;
        const rows = Object.keys(ROGUE_ACTIVE_ITEM_POOL_V2)
            .filter((itemId) => ROGUE_ACTIVE_ITEM_POOL_V2[itemId].scope === 'pasture' && getRogueToolCountV2(itemId) > 0)
            .map((itemId) => {
                const tool = ROGUE_ACTIVE_ITEM_POOL_V2[itemId];
                return `
                    <button class="garden-pasture-shop-item" data-rogue-tool-use="${itemId}" type="button">
                        <div class="garden-pasture-shop-icon">${tool.emoji}</div>
                        <div class="garden-pasture-shop-name">${tool.name} x${getRogueToolCountV2(itemId)}</div>
                        <div class="garden-pasture-shop-price">${tool.desc}</div>
                    </button>
                `;
            }).join('');
        pastureShopPanelEl.innerHTML = rows || '<div class="garden-rogue-empty-text">当前没有可用牧场道具</div>';
    }

    function syncKitchenToolPanelUi() {
        if (!kitchenToolPanelEl || !kitchenToolListEl) return;
        const shouldShow = isRogueActivityMode() && state.kitchenGame.toolPanelOpen;
        kitchenToolPanelEl.hidden = !shouldShow;
        if (!shouldShow) return;
        const rows = Object.keys(ROGUE_ACTIVE_ITEM_POOL_V2)
            .filter((itemId) => ROGUE_ACTIVE_ITEM_POOL_V2[itemId].scope === 'kitchen' && getRogueToolCountV2(itemId) > 0)
            .map((itemId) => {
                const tool = ROGUE_ACTIVE_ITEM_POOL_V2[itemId];
                return `
                    <button class="garden-kitchen-tool-item" data-rogue-tool-use="${itemId}" type="button">
                        <span>${tool.emoji} ${tool.name} x${getRogueToolCountV2(itemId)}</span>
                        <small>${tool.desc}</small>
                    </button>
                `;
            }).join('');
        kitchenToolListEl.innerHTML = rows || '<div class="garden-rogue-empty-text">当前没有可用厨房道具</div>';
    }

    function syncRogueBuffSummaryUi() {
        const visible = isRogueActivityMode() && !!getRogueRunV2();
        [farmBuffSummaryEl, pastureBuffSummaryEl, kitchenBuffSummaryEl].forEach((el) => {
            if (el) el.hidden = !visible;
        });
        [farmBuffChipEl, pastureBuffChipEl, kitchenBuffChipEl].forEach((el) => {
            if (el) el.hidden = !visible;
        });
        const text = getRogueBuffSummaryTextV2();
        if (farmBuffSummaryTextEl) farmBuffSummaryTextEl.textContent = text;
        if (pastureBuffSummaryTextEl) pastureBuffSummaryTextEl.textContent = text;
        if (kitchenBuffSummaryTextEl) kitchenBuffSummaryTextEl.textContent = text;
        if (farmBuffChipEl) farmBuffChipEl.textContent = state.rogueBuffPanelOpen ? '收起增益' : '增益';
        if (pastureBuffChipEl) pastureBuffChipEl.textContent = state.rogueBuffPanelOpen ? '收起增益' : '增益';
        if (kitchenBuffChipEl) kitchenBuffChipEl.textContent = state.rogueBuffPanelOpen ? '收起增益' : '增益';
    }

    function useRogueActiveItemV2(itemId) {
        const run = getRogueRunV2();
        const tool = ROGUE_ACTIVE_ITEM_POOL_V2[itemId];
        if (!run || !tool || getRogueToolCountV2(itemId) <= 0) return;
        if (tool.scope === 'kitchen') {
            if (!consumeRogueToolV2(itemId)) return;
            run.tempToolEffects = run.tempToolEffects || {};
            run.tempToolEffects[itemId] = true;
            state.kitchenGame.toolPanelOpen = false;
            syncKitchenToolPanelUi();
            saveRogueRunStateV2();
            syncRogueBuffSummaryUi();
            showKitchenToast(`${tool.name} 已就绪，下一次成功烹饪会触发效果`);
            return;
        }
        if (tool.scope === 'farm') {
            state.farmGame.selectedToolItemId = itemId;
            showFarmToast(`已选中 ${tool.name}，现在点一块田地即可施放`);
            return;
        }
        if (tool.scope === 'pasture') {
            state.pastureGame.selectedToolItemId = itemId;
            showPastureToast(`已选中 ${tool.name}，现在点一只动物即可施放`);
        }
    }

    function setPastureTool(tool) {
        if (!tool) return;
        state.pastureGame.currentTool = tool;
        if (tool === 'shop' && !state.pastureGame.selectedAnimalToBuy) {
            state.pastureGame.selectedAnimalToBuy = 'chicken';
        }
        syncPastureToolUi();
        vibrate(15);
    }

    function selectPastureAnimalToBuy(type, shouldVibrate = true) {
        if (!PASTURE_ANIMAL_DATA[type]) return;
        state.pastureGame.selectedAnimalToBuy = type;
        syncPastureToolUi();
        if (shouldVibrate) vibrate(15);
    }

    function openPastureScreen() {
        initPastureScreen();
        if (!pastureScreenEl) return;
        if (isRogueActivityMode() && state.rogueRunV2 && state.rogueRunV2.currentNode && state.rogueRunV2.currentNode.type === 'pasture') {
            state.pastureGame.currentTool = 'feed';
            state.pastureGame.selectedToolItemId = null;
            state.pastureGame.selectedAnimalToBuy = null;
            state.pastureGame.visualEatingUntil = {};
            syncPastureToolUi();
        }
        closeFarmScreen({ silent: true });
        closeKitchenScreen({ silent: true });
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closeFloraScreen();
        if (editorHost) editorHost.style.display = 'none';
        state.pastureScreenOpen = true;
        state.currentHomeSection = 'pasture';
        pastureScreenEl.classList.add('is-open');
        pastureScreenEl.setAttribute('aria-hidden', 'false');
        renderPastureAnimals();
        syncAssignmentFigures();
        syncPastureStats();
        syncMiniGameMissionUi();
        syncRogueBuffSummaryUi();
        vibrate(20);
    }

    function closePastureScreen(options) {
        if (!pastureScreenEl) return;
        const silent = !!(options && options.silent);
        state.pastureScreenOpen = false;
        stopPastureTimers();
        if (editorHost) editorHost.style.display = '';
        state.currentHomeSection = 'home';
        pastureScreenEl.classList.remove('is-open');
        pastureScreenEl.setAttribute('aria-hidden', 'true');
        clearAssignmentFigures();
        if (!silent) vibrate(20);
    }

    function ensurePastureTimers() {
        if (!state.pastureGame.progressTimer) {
            state.pastureGame.progressTimer = window.setInterval(() => {
                if (!state.pastureScreenOpen) return;
                const changed = advancePastureAnimalsProgress();
                renderPastureAnimals();
                if (changed) saveActiveGardenModeState();
            }, 1000);
        }
        if (!state.pastureGame.roamTimer) {
            state.pastureGame.roamTimer = window.setInterval(() => {
                if (!state.pastureScreenOpen) return;
                roamPastureAnimals();
            }, 2000);
        }
    }

    function stopPastureTimers() {
        if (state.pastureGame.progressTimer) {
            window.clearInterval(state.pastureGame.progressTimer);
            state.pastureGame.progressTimer = null;
        }
        if (state.pastureGame.roamTimer) {
            window.clearInterval(state.pastureGame.roamTimer);
            state.pastureGame.roamTimer = null;
        }
    }

    function advancePastureAnimalsProgress() {
        const now = Date.now();
        let changed = false;
        getPastureAnimals().forEach((animal) => {
            changed = advancePastureAnimalByClock(animal, now) || changed;
        });
        return changed;
    }

    function showPastureToast(message) {
        if (!pastureToastEl || !message) return;
        pastureToastEl.textContent = message;
        pastureToastEl.classList.add('is-visible');
        window.clearTimeout(state.pastureToastTimeout);
        state.pastureToastTimeout = window.setTimeout(() => {
            if (pastureToastEl) pastureToastEl.classList.remove('is-visible');
        }, 2000);
    }

    function handlePastureAreaClick(event) {
        if (!pastureFieldEl) return;
        if (event.target.closest('.garden-pasture-animal-wrapper')) return;
        if (state.pastureGame.currentTool !== 'shop' || !state.pastureGame.selectedAnimalToBuy) return;

        const animalType = state.pastureGame.selectedAnimalToBuy;
        const animalData = PASTURE_ANIMAL_DATA[animalType];
        if (!animalData) return;
        const availableCoins = isRogueActivityMode() && state.rogueRunV2
            ? Math.max(0, Math.floor(Number(state.rogueRunV2.runCoins) || 0))
            : (state.gardenGame ? state.gardenGame.coins : 0);
        if (availableCoins < animalData.cost) {
            showPastureToast('金币不足！');
            return;
        }

        const rect = pastureFieldEl.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        updateGardenCoins(-animalData.cost);
        getPastureAnimals().push(createPastureAnimalState(animalType, x, y, false));
        renderPastureAnimals();
        saveGardenGameState();
        refreshGardenEconomyUi();
        showPastureToast(`购买了幼崽 ${animalData.babyEmoji}`);
    }

    function createPastureAnimalState(type, x, y, isAdult) {
        return {
            id: `animal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            type,
            age: isAdult ? 'adult' : 'baby',
            state: 'hungry',
            x: Math.max(10, Math.min(90, x)),
            y: Math.max(15, Math.min(85, y)),
            stateEndsAt: null
        };
    }

    function setPastureAnimalPosition(wrapper, x, y) {
        if (!wrapper) return;
        const nextX = Math.max(10, Math.min(90, x));
        const nextY = Math.max(15, Math.min(85, y));
        wrapper.dataset.x = String(nextX);
        wrapper.dataset.y = String(nextY);
        wrapper.style.left = `calc(${nextX}% - 25px)`;
        wrapper.style.top = `calc(${nextY}% - 30px)`;
        wrapper.style.zIndex = String(getPastureDepthZ(nextY));
    }

    function getPastureDepthZ(y) {
        const nextY = Math.max(15, Math.min(85, Number(y) || 0));
        return 100 + Math.floor(nextY * 10);
    }

    function getPastureAnimalById(animalId) {
        return getPastureAnimals().find((animal) => animal.id === animalId) || null;
    }

    function getPastureAnimalBubble(animal, data, isEating) {
        if (isEating) {
            return { text: `${data.food} 吃吃吃...`, color: '#333' };
        }
        if (animal.state === 'ready') {
            return { text: `可收获 ${data.produceEmoji}`, color: '#2e7d32' };
        }
        if (animal.state === 'growing') {
            return { text: '成长中 ⏳', color: '#333' };
        }
        if (animal.state === 'producing') {
            return { text: '生产中 ⏳', color: '#333' };
        }
        return { text: '饿了 😫', color: '#333' };
    }

    function renderPastureAnimals() {
        if (!pastureFieldEl) return;
        const now = Date.now();
        const existingMap = new Map(
            Array.from(pastureFieldEl.querySelectorAll('.garden-pasture-animal-wrapper'))
                .map((node) => [String(node.dataset.pastureId || ''), node])
        );
        const nextIds = new Set();
        getPastureAnimals().forEach((animal) => {
            const data = PASTURE_ANIMAL_DATA[animal.type];
            if (!data) return;
            nextIds.add(String(animal.id));
            const isEating = Number(state.pastureGame.visualEatingUntil[animal.id] || 0) > now;
            const bubbleMeta = getPastureAnimalBubble(animal, data, isEating);
            const existingWrapper = existingMap.get(String(animal.id));
            const wrapper = existingWrapper || document.createElement('div');
            const classNames = ['garden-pasture-animal-wrapper', animal.age === 'adult' ? 'garden-pasture-age-adult' : 'garden-pasture-age-baby'];
            if (animal.state === 'hungry') classNames.push('garden-pasture-state-hungry');
            if (animal.state === 'ready') classNames.push('garden-pasture-state-ready');
            if (isEating || animal.state === 'hungry' || animal.state === 'ready') classNames.push('garden-pasture-show-bubble');
            wrapper.className = classNames.join(' ');
            wrapper.dataset.pastureId = animal.id;
            wrapper.dataset.type = animal.type;
            wrapper.dataset.state = animal.state;
            wrapper.dataset.age = animal.age;
            wrapper.innerHTML = `
                <div class="garden-pasture-bubble" style="color:${bubbleMeta.color};">${bubbleMeta.text}</div>
                <div class="garden-pasture-animal-emoji">${animal.age === 'adult' ? data.adultEmoji : data.babyEmoji}</div>
            `;
            setPastureAnimalPosition(wrapper, animal.x, animal.y);
            if (!existingWrapper) {
                wrapper.addEventListener('click', (clickEvent) => {
                    clickEvent.stopPropagation();
                    interactWithPastureAnimal(wrapper);
                });
                pastureFieldEl.appendChild(wrapper);
            }
        });
        existingMap.forEach((node, id) => {
            if (!nextIds.has(id)) node.remove();
        });
        const contactState = getGardenContactState(state.currentGardenContactId);
        const assignment = contactState.activeAssignment;
        if (assignment && assignment.finishAt > Date.now() && assignment.type === 'pasture' && state.pastureScreenOpen) {
            renderAssignmentFigureInPasture();
        }
    }

    function interactWithPastureAnimal(wrapper) {
        if (!wrapper) return;
        const animal = getPastureAnimalById(wrapper.dataset.pastureId);
        if (!animal) return;
        const data = PASTURE_ANIMAL_DATA[animal.type];
        if (!data) return;

        const animalState = animal.state;
        const animalAge = animal.age;
        const bubble = wrapper.querySelector('.garden-pasture-bubble');
        if (!bubble) return;

        if (state.pastureGame.currentTool === 'tool' && isRogueActivityMode()) {
            const selectedTool = state.pastureGame.selectedToolItemId;
            if (!selectedTool) {
                showPastureToast('先从底栏选择一个牧场道具');
                return;
            }
            if (selectedTool === 'pasture_whistle') {
                if (animalAge === 'baby') {
                    showPastureToast('口哨更适合对成年动物使用');
                    return;
                }
                if (!consumeRogueToolV2(selectedTool)) return;
                animal.state = 'ready';
                animal.stateEndsAt = null;
                state.pastureGame.selectedToolItemId = null;
                renderPastureAnimals();
                saveActiveGardenModeState();
                syncRogueBuffSummaryUi();
                showPastureToast('牧场口哨生效，动物已可直接收获');
                return;
            }
            if (selectedTool === 'nutrient_feed') {
                if (!consumeRogueToolV2(selectedTool)) return;
                animal.bonusYield = (Number(animal.bonusYield) || 0) + 1;
                state.pastureGame.selectedToolItemId = null;
                saveActiveGardenModeState();
                syncRogueBuffSummaryUi();
                showPastureToast('营养饲料生效，下次收获额外 +1');
                return;
            }
        }

        if (state.pastureGame.currentTool === 'pointer') {
            wrapper.classList.add('garden-pasture-show-bubble');
            window.setTimeout(() => {
                if (!wrapper.isConnected) return;
                if (wrapper.dataset.state !== 'ready' && wrapper.dataset.state !== 'hungry') {
                    wrapper.classList.remove('garden-pasture-show-bubble');
                }
            }, 2000);
            return;
        }

        if (state.pastureGame.currentTool === 'feed' && animalState === 'hungry') {
            if (isRogueActivityMode() && state.rogueRunV2 && !tryConsumeRogueActionPoint(1, '喂食')) {
                return;
            }
            animal.state = animalAge === 'baby' ? 'growing' : 'producing';
            let durationMultiplier = 1;
            if (consumeRogueModifier('pasture_fast_feed')) {
                durationMultiplier *= getRogueModifierValue('pasture_fast_feed', 0.7);
            }
            if (animalAge === 'baby' && isRogueModifierActive('pasture_baby_boost')) {
                durationMultiplier *= getRogueModifierValue('pasture_baby_boost', 0.6);
            }
            const baseDuration = animalAge === 'baby' ? data.growTime : data.produceTime;
            animal.stateEndsAt = Date.now() + Math.max(1000, Math.round(baseDuration * durationMultiplier));
            state.pastureGame.visualEatingUntil[animal.id] = Date.now() + 1500;
            saveActiveGardenModeState();
            renderPastureAnimals();
            const refreshedWrapper = pastureFieldEl ? pastureFieldEl.querySelector(`[data-pasture-id="${animal.id}"]`) : null;
            if (refreshedWrapper) {
                showPastureFoodAnimation(refreshedWrapper, data.food);
            }
            showPastureToast(animalAge === 'baby' ? '喂食成功，开始成长' : '喂食成功，开始生产');
            return;
        }

        if (state.pastureGame.currentTool === 'harvest') {
            if (animalAge === 'baby') {
                showPastureToast('还在幼崽期，不能收获哦！');
                return;
            }
            if (animalState !== 'ready') {
                showPastureToast('还没有可以收获的产物');
                return;
            }
            if (isRogueActivityMode() && state.rogueRunV2 && !tryConsumeRogueActionPoint(1, '收获')) {
                return;
            }

            animal.state = 'hungry';
            animal.stateEndsAt = null;
            let rewardQty = 1;
            if (Number(animal.bonusYield || 0) > 0) {
                rewardQty += Math.max(0, Math.floor(Number(animal.bonusYield) || 0));
                animal.bonusYield = 0;
            }
            if (consumeRogueModifier('pasture_twin_yield') && Math.random() < getRogueModifierValue('pasture_twin_yield', 0.35)) {
                rewardQty += 1;
            }
            if (isRogueModifierActive('pasture_type_bonus') && !rogueModifierHasFlag('pasture_type_bonus', animal.type)) {
                rewardQty += 1;
                rogueModifierAddFlag('pasture_type_bonus', animal.type);
            }
            addInventoryItem(data.inventoryId, rewardQty);
            if (isRogueActivityMode() && state.rogueRunV2) {
                progressRoguePastureHarvestV2();
            } else {
                progressRoguePastureHarvest();
            }
            renderPastureAnimals();
            saveActiveGardenModeState();
            refreshGardenEconomyUi();
            showPastureToast(`获得 ${data.produceName} ${data.produceEmoji} x${rewardQty}，已存入仓库`);
            return;
        }

        if (state.pastureGame.currentTool === 'feed') {
            showPastureToast('这只动物现在不用喂，换一只饥饿动物或等待生产完成');
            return;
        }
        if (state.pastureGame.currentTool === 'harvest') {
            showPastureToast('这只动物现在还不能收获，先等它进入可收获状态');
            return;
        }
    }

    function showPastureFoodAnimation(animalWrapper, foodEmoji) {
        if (!pastureFieldEl || !animalWrapper) return;
        const food = document.createElement('div');
        food.className = 'garden-pasture-food-bowl';
        food.textContent = foodEmoji;
        pastureFieldEl.appendChild(food);

        const animalRect = animalWrapper.getBoundingClientRect();
        const pastureRect = pastureFieldEl.getBoundingClientRect();
        food.style.left = `${(animalRect.left - pastureRect.left) + 40}px`;
        food.style.top = `${(animalRect.top - pastureRect.top) - 50}px`;
        food.style.opacity = '1';
        food.style.transform = 'scale(0.5)';

        window.setTimeout(() => {
            food.style.transform = 'scale(1.2) translateY(50px)';
            window.setTimeout(() => {
                food.style.opacity = '0';
                window.setTimeout(() => {
                    if (food.parentNode) food.parentNode.removeChild(food);
                }, 500);
            }, 1000);
        }, 50);
    }

    function showPastureCoinAnimation(animalWrapper) {
        if (!pastureFieldEl || !animalWrapper) return;
        const coin = document.createElement('div');
        const animalRect = animalWrapper.getBoundingClientRect();
        const pastureRect = pastureFieldEl.getBoundingClientRect();
        coin.textContent = '🪙';
        coin.style.position = 'absolute';
        coin.style.left = `${(animalRect.left - pastureRect.left) + 25}px`;
        coin.style.top = `${animalRect.top - pastureRect.top}px`;
        coin.style.fontSize = '30px';
        coin.style.pointerEvents = 'none';
        coin.style.zIndex = '25';
        coin.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        pastureFieldEl.appendChild(coin);

        window.setTimeout(() => {
            coin.style.transform = 'translateY(-100px) scale(1.5)';
            coin.style.opacity = '0';
            window.setTimeout(() => {
                if (coin.parentNode) coin.parentNode.removeChild(coin);
            }, 1000);
        }, 50);
    }

    function showPastureGrowAnimation(wrapper) {
        if (!pastureFieldEl || !wrapper) return;
        const effect = document.createElement('div');
        const animalRect = wrapper.getBoundingClientRect();
        const pastureRect = pastureFieldEl.getBoundingClientRect();
        effect.textContent = '✨';
        effect.style.position = 'absolute';
        effect.style.left = `${(animalRect.left - pastureRect.left) + 20}px`;
        effect.style.top = `${animalRect.top - pastureRect.top}px`;
        effect.style.fontSize = '40px';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '25';
        effect.style.transition = 'all 1s';
        pastureFieldEl.appendChild(effect);

        wrapper.style.transform = 'scale(1.3)';
        window.setTimeout(() => {
            if (wrapper.isConnected) wrapper.style.transform = 'scale(1)';
        }, 300);
        window.setTimeout(() => {
            effect.style.transform = 'translateY(-60px) scale(1.5)';
            effect.style.opacity = '0';
            window.setTimeout(() => {
                if (effect.parentNode) effect.parentNode.removeChild(effect);
            }, 1000);
        }, 50);
    }

    function startPastureRoaming(wrapper) {
        if (!wrapper) return;
    }

    function roamPastureAnimals() {
        if (!getPastureAnimals().length) return;
        const now = Date.now();
        let moved = false;
        getPastureAnimals().forEach((animal) => {
            if (Number(state.pastureGame.visualEatingUntil[animal.id] || 0) > now) return;
            if (Math.random() >= 0.2) return;
            animal.x = Math.max(10, Math.min(90, animal.x + (Math.random() * 20 - 10)));
            animal.y = Math.max(15, Math.min(85, animal.y + (Math.random() * 20 - 10)));
            moved = true;
        });
        if (!moved) return;
        renderPastureAnimals();
        saveActiveGardenModeState();
    }

    function initKitchenScreen() {
        if (!kitchenOverlayEl) return;
        if (!state.kitchenGame.initialized) {
            kitchenCookBtns.forEach((button) => {
                button.addEventListener('click', () => {
                    const recipeId = button.dataset.kitchenCook;
                    if (recipeId) cookKitchenRecipe(recipeId);
                });
            });

            kitchenOverlayEl.addEventListener('click', (event) => {
                if (!state.kitchenGame.qteActive) return;
                event.stopPropagation();
                handleKitchenQteHit();
            });

            state.kitchenGame.initialized = true;
        }

        syncKitchenCookButtons();
        syncGardenRogueUi();
    }

    function syncKitchenCookButtons() {
        kitchenCookBtns.forEach((button) => {
            const recipeId = button.dataset.kitchenCook;
            const recipe = recipeId ? KITCHEN_RECIPES[recipeId] : null;
            const canCook = !!recipe && hasInventoryItems(recipe.ingredients);
            const card = button.closest('[data-kitchen-recipe]');
            button.disabled = !canCook;
            button.textContent = canCook ? '烹饪' : '材料不足';
            if (card) {
                card.classList.toggle('is-disabled', !canCook);
            }
        });
        syncKitchenSkipButton();
    }

    function openKitchenScreen() {
        initKitchenScreen();
        if (!kitchenScreenEl) return;
        closePastureScreen({ silent: true });
        closeFarmScreen({ silent: true });
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closeFloraScreen();
        state.kitchenScreenOpen = true;
        state.currentHomeSection = 'kitchen';
        kitchenScreenEl.classList.add('is-open');
        kitchenScreenEl.setAttribute('aria-hidden', 'false');
        syncKitchenCookButtons();
        syncGardenRogueUi();
        syncMiniGameMissionUi();
        syncRogueBuffSummaryUi();
        syncKitchenToolPanelUi();
        vibrate(20);
    }

    function closeKitchenScreen(options) {
        if (!kitchenScreenEl) return;
        const silent = !!(options && options.silent);
        stopKitchenQte(true);
        state.kitchenScreenOpen = false;
        state.currentHomeSection = 'home';
        kitchenScreenEl.classList.remove('is-open');
        kitchenScreenEl.setAttribute('aria-hidden', 'true');
        if (!silent) vibrate(20);
    }

    function cookKitchenRecipe(recipeId) {
        const recipe = KITCHEN_RECIPES[recipeId];
        if (!recipe) return;
        if (!hasInventoryItems(recipe.ingredients)) {
            syncKitchenCookButtons();
            showKitchenToast('材料不足');
            return;
        }
        state.kitchenGame.currentRecipeId = recipeId;
        startKitchenQte();
    }

    function startKitchenQte() {
        if (!kitchenOverlayEl || !kitchenQteContainerEl || !kitchenQteDialEl || !kitchenQtePointerEl || !kitchenQteHintEl) return;

        const qteMultiplier = consumeRogueModifier('kitchen_easy_qte') ? getRogueModifierValue('kitchen_easy_qte', 1.35) : 1;
        const whiteWidth = Math.min(180, 90 * qteMultiplier);
        const yellowWidth = Math.min(whiteWidth - 10, 15 * qteMultiplier);
        const randomStart = Math.floor(Math.random() * Math.max(1, (320 - whiteWidth))) + 20;
        state.kitchenGame.whiteStart = randomStart;
        state.kitchenGame.whiteEnd = randomStart + whiteWidth;
        state.kitchenGame.yellowStart = randomStart + ((whiteWidth - yellowWidth) / 2);
        state.kitchenGame.yellowEnd = state.kitchenGame.yellowStart + yellowWidth;
        state.kitchenGame.currentAngle = 0;
        state.kitchenGame.qteActive = true;
        state.kitchenGame.spinDuration = 1.5 + Math.random() * 1.0;

        kitchenQteDialEl.style.background = `conic-gradient(
            #444 0deg,
            #444 ${state.kitchenGame.whiteStart - 0.5}deg,
            white ${state.kitchenGame.whiteStart}deg,
            white ${state.kitchenGame.yellowStart - 0.5}deg,
            #FF9800 ${state.kitchenGame.yellowStart}deg,
            #FF9800 ${state.kitchenGame.yellowEnd}deg,
            white ${state.kitchenGame.yellowEnd + 0.5}deg,
            white ${state.kitchenGame.whiteEnd}deg,
            #444 ${state.kitchenGame.whiteEnd + 0.5}deg,
            #444 360deg
        )`;

        kitchenOverlayEl.classList.add('is-active');
        kitchenQteContainerEl.classList.add('is-active');
        kitchenQteHintEl.classList.add('is-active');

        kitchenQtePointerEl.style.animation = 'none';
        kitchenQtePointerEl.style.transform = 'rotate(0deg) translateZ(0)';
        void kitchenQtePointerEl.offsetWidth;
        kitchenQtePointerEl.style.animation = `gardenKitchenSpinPointer ${state.kitchenGame.spinDuration}s linear infinite`;
        state.kitchenGame.startTime = performance.now();
        saveGardenGameState();
    }

    function handleKitchenQteHit() {
        if (!state.kitchenGame.qteActive || !kitchenQtePointerEl) return;
        const elapsedSeconds = (performance.now() - state.kitchenGame.startTime) / 1000;
        const progress = (elapsedSeconds / state.kitchenGame.spinDuration) % 1;
        const angle = progress * 360;
        state.kitchenGame.currentAngle = angle;

        kitchenQtePointerEl.style.animation = 'none';
        kitchenQtePointerEl.style.transform = `rotate(${angle}deg) translateZ(0)`;

        if (angle >= state.kitchenGame.yellowStart && angle <= state.kitchenGame.yellowEnd) {
            endKitchenQte(true, '完美成功！', 'perfect');
            return;
        }
        if (angle >= state.kitchenGame.whiteStart && angle <= state.kitchenGame.whiteEnd) {
            endKitchenQte(true, '普通成功！', 'normal');
            return;
        }
        endKitchenQte(false, '点错时机啦！烹饪失败...');
    }

    function endKitchenQte(isSuccess, message, quality) {
        state.kitchenGame.qteActive = false;
        window.setTimeout(() => {
            stopKitchenQte(true);
            if (!isSuccess) {
                showKitchenToast(`❌ ${message}`);
                return;
            }

            const recipe = KITCHEN_RECIPES[state.kitchenGame.currentRecipeId] || { id: null, name: '料理', emoji: '🍳', primaryIngredient: null, ingredients: {} };
            if (!spendInventoryItems(recipe.ingredients)) {
                syncKitchenCookButtons();
                showKitchenToast('材料不足，未能完成烹饪');
                return;
            }
            let outputQty = 1;
            if (consumeRogueModifier('kitchen_bonus_output')) {
                outputQty += 1;
            }
            if (isRogueActivityMode() && state.rogueRunV2 && state.rogueRunV2.tempToolEffects && state.rogueRunV2.tempToolEffects.kitchen_spice) {
                outputQty += 1;
                delete state.rogueRunV2.tempToolEffects.kitchen_spice;
            }
            if (recipe.id) {
                addInventoryItem(recipe.id, outputQty);
            }
            let returnedPrimary = false;
            if (recipe.primaryIngredient && consumeRogueModifier('kitchen_primary_save')) {
                addInventoryItem(recipe.primaryIngredient, 1);
                returnedPrimary = true;
            }
            if (isRogueActivityMode() && state.rogueRunV2) {
                progressRogueKitchenSuccessV2();
            } else {
                progressRogueKitchenSuccess();
            }
            saveActiveGardenModeState();
            refreshGardenEconomyUi();
            const prefix = quality === 'perfect' ? '✨[完美品质]✨' : '✅';
            showKitchenToast(`${prefix} ${recipe.name} ${recipe.emoji} x${outputQty} 已存入仓库${returnedPrimary ? ' · 已返还 1 份主材料' : ''}`);
        }, 500);
    }

    function stopKitchenQte(resetPointer) {
        state.kitchenGame.qteActive = false;
        if (kitchenOverlayEl) kitchenOverlayEl.classList.remove('is-active');
        if (kitchenQteContainerEl) kitchenQteContainerEl.classList.remove('is-active');
        if (kitchenQteHintEl) kitchenQteHintEl.classList.remove('is-active');
        if (resetPointer && kitchenQtePointerEl) {
            kitchenQtePointerEl.style.animation = 'none';
            kitchenQtePointerEl.style.transform = 'rotate(0deg) translateZ(0)';
        }
    }

    function showKitchenToast(message) {
        if (!kitchenToastEl || !message) return;
        kitchenToastEl.textContent = message;
        kitchenToastEl.classList.add('is-visible');
        window.clearTimeout(state.kitchenToastTimeout);
        state.kitchenToastTimeout = window.setTimeout(() => {
            if (kitchenToastEl) kitchenToastEl.classList.remove('is-visible');
        }, 2500);
    }

    function triggerActivitiesPlayFeedback(playBtn) {
        if (!playBtn) return;
        const icon = playBtn.querySelector('i');
        if (!icon) return;

        icon.classList.remove('ph-play');
        icon.classList.add('ph-spinner-gap', 'is-spinning');

        window.clearTimeout(playBtn.spinTimer);
        playBtn.spinTimer = window.setTimeout(() => {
            icon.classList.remove('ph-spinner-gap', 'is-spinning');
            icon.classList.add('ph-play');
        }, 800);
    }

    function openActivitiesView() {
        init();
        if (!screenEl) return;
        syncGardenTitle();
        syncGardenLayoutFromActiveContact();
        switchView('activities');
        setDrawerOpen(false);
        closeFloraScreen();
        syncFloraFromEngine();
        screenEl.classList.remove('hidden');
    }

    function openWhisperChallengeFromActivities() {
        openActivitiesView();
        if (window.WhisperChallenge && typeof window.WhisperChallenge.openApp === 'function') {
            window.WhisperChallenge.openApp({ returnTarget: 'garden-activities' });
        }
    }

    function bindActivitiesInteractions() {
        if (!activitiesViewEl || activitiesViewEl.dataset.bound === 'true') return;

        activitiesViewEl.dataset.bound = 'true';
        activitiesViewEl.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-garden-action]');
            if (actionButton) {
                const action = actionButton.dataset.gardenAction;
                vibrate(20);
                if (action === 'back-home') {
                    closeApp();
                    return;
                }
                if (action === 'search-activities') {
                    return;
                }
            }

            const tabButton = event.target.closest('.garden-activities-tab');
            if (tabButton) {
                activitiesViewEl.querySelectorAll('.garden-activities-tab').forEach((button) => {
                    button.classList.toggle('is-active', button === tabButton);
                });
                vibrate(15);
                return;
            }

            const playButton = event.target.closest('.garden-activities-play-btn');
            if (playButton) {
                event.stopPropagation();
                vibrate(20);
                const playCard = playButton.closest('.garden-activities-card');
                if (playCard && playCard.dataset.activitiesCard === 'whisper') {
                    openWhisperChallengeFromActivities();
                    return;
                }
                triggerActivitiesPlayFeedback(playButton);
                return;
            }

            const card = event.target.closest('.garden-activities-card');
            if (card) {
                vibrate(20);
                if (card.dataset.activitiesCard === 'whisper') {
                    openWhisperChallengeFromActivities();
                    return;
                }
                triggerActivitiesPlayFeedback(card.querySelector('.garden-activities-play-btn'));
            }
        });
    }

    function initStorageView() {
        renderStorageItems(state.gardenGame && state.gardenGame.storage ? state.gardenGame.storage.tab : 'crops');
        syncStorageSellSheetUi();
        if (!storageViewEl || storageViewEl.dataset.bound === 'true') return;

        storageViewEl.dataset.bound = 'true';
        storageViewEl.addEventListener('click', (event) => {
            const actionButton = event.target.closest('[data-storage-action]');
            if (actionButton) {
                const action = actionButton.dataset.storageAction;
                vibrate(20);
                if (action === 'exit') {
                    if (isRogueActivityMode() && state.rogueRunV2) {
                        switchView('activities');
                        if (state.rogueRunV2.currentDraft) {
                            renderRogueOfferModal();
                        } else if (state.rogueRunV2.currentNode) {
                            openCurrentRogueStageScreen({ preferActivitiesBase: false });
                        } else {
                            setRogueProgressPanelOpen(true);
                            renderRogueUiV2();
                        }
                    } else {
                        closeApp();
                    }
                }
                return;
            }

            const sellActionButton = event.target.closest('[data-storage-sell-action]');
            if (sellActionButton) {
                const sellAction = sellActionButton.dataset.storageSellAction;
                if (sellAction === 'cancel') {
                    closeStorageSellSheet();
                }
                if (sellAction === 'confirm' && state.storageSell.itemId) {
                    confirmStorageSell(state.storageSell.itemId, state.storageSell.qty);
                }
                vibrate(15);
                return;
            }

            const sellStepButton = event.target.closest('[data-storage-sell-step]');
            if (sellStepButton) {
                const step = sellStepButton.dataset.storageSellStep;
                if (step === 'all') {
                    setStorageSellQty(getInventoryCount(state.storageSell.itemId));
                } else {
                    setStorageSellQty((state.storageSell.qty || 1) + Number(step));
                }
                vibrate(12);
                return;
            }

            const itemCard = event.target.closest('[data-storage-item-id]');
            if (itemCard) {
                openStorageSellSheet(itemCard.dataset.storageItemId);
                vibrate(15);
                return;
            }

            const tabButton = event.target.closest('[data-storage-tab]');
            if (!tabButton) return;

            const nextTab = tabButton.dataset.storageTab;
            if (!nextTab || !STORAGE_TABS[nextTab]) return;
            if (isRogueActivityMode() && state.rogueRunV2) {
                state.rogueRunV2.storage = state.rogueRunV2.storage || { tab: 'crops' };
                state.rogueRunV2.storage.tab = nextTab;
            } else {
                if (!state.gardenGame) return;
                state.gardenGame.storage.tab = nextTab;
            }
            saveActiveGardenModeState();
            renderStorageItems(nextTab);
            vibrate(15);
        });
    }

    function renderStorageItems(type) {
        if (!storageGridEl) return;

        const nextType = sanitizeStorageTab(type);
        const items = STORAGE_TABS[nextType].itemIds
            .map((itemId) => ({ ...ITEM_META[itemId], count: getInventoryCount(itemId) }))
            .filter((item) => item.count > 0);
        renderStorageSpecialOrderCard();

        if (isRogueActivityMode() && state.rogueRunV2) {
            state.rogueRunV2.storage = state.rogueRunV2.storage || { tab: 'crops' };
            state.rogueRunV2.storage.tab = nextType;
        } else if (state.gardenGame && state.gardenGame.storage) {
            state.gardenGame.storage.tab = nextType;
        }

        storageTabBtns.forEach((button) => {
            button.classList.toggle('active', button.dataset.storageTab === nextType);
        });

        if (!items.length) {
            storageGridEl.innerHTML = '<div class="garden-storage-empty">当前分类暂无库存</div>';
            syncStorageSellSheetUi();
            return;
        }

        storageGridEl.innerHTML = items.map((item) => (
            `<button class="garden-storage-item" data-storage-item-id="${item.id}" type="button">
                <div class="garden-storage-item-count">${item.count}</div>
                <div class="garden-storage-item-icon">${item.emoji}</div>
                <div class="garden-storage-item-name">${item.name}</div>
                <div class="garden-storage-item-price">${getSellUnitPrice(item.id)} 金币/个</div>
            </button>`
        )).join('');

        syncStorageSellSheetUi();
    }

    function openStorageSellSheet(itemId) {
        if (!ITEM_META[itemId] || getInventoryCount(itemId) <= 0) return;
        state.storageSell.itemId = itemId;
        state.storageSell.qty = 1;
        syncStorageSellSheetUi();
    }

    function closeStorageSellSheet() {
        state.storageSell.itemId = null;
        state.storageSell.qty = 1;
        syncStorageSellSheetUi();
    }

    function setStorageSellQty(nextQty) {
        if (!state.storageSell.itemId) return;
        const maxQty = getInventoryCount(state.storageSell.itemId);
        const normalizedQty = Math.max(1, Math.min(maxQty, Math.floor(nextQty || 1)));
        state.storageSell.qty = normalizedQty;
        syncStorageSellSheetUi();
    }

    function syncStorageSellSheetUi() {
        if (!storageSellSheetEl) return;
        const itemId = state.storageSell.itemId;
        const meta = itemId ? ITEM_META[itemId] : null;
        const stockCount = itemId ? getInventoryCount(itemId) : 0;
        const isOpen = !!meta && stockCount > 0;
        storageSellSheetEl.classList.toggle('is-open', isOpen);
        storageSellSheetEl.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
        if (!isOpen) return;

        state.storageSell.qty = Math.max(1, Math.min(stockCount, state.storageSell.qty || 1));
        if (storageSellIconEl) storageSellIconEl.textContent = meta.emoji;
        if (storageSellNameEl) storageSellNameEl.textContent = meta.name;
        if (storageSellStockEl) storageSellStockEl.textContent = `当前持有 ${stockCount}`;
        if (storageSellPriceEl) storageSellPriceEl.textContent = `单价 ${getSellUnitPrice(itemId)} 金币`;
        if (storageSellQtyEl) storageSellQtyEl.textContent = String(state.storageSell.qty);
        if (storageSellTotalEl) storageSellTotalEl.textContent = `${calculateStorageSellGold(itemId, state.storageSell.qty)} 金币`;
        if (storageSellConfirmBtn) {
            const disabled = state.storageSell.qty < 1 || state.storageSell.qty > stockCount;
            storageSellConfirmBtn.disabled = disabled;
        }
    }

    function confirmStorageSell(itemId, qty) {
        const meta = ITEM_META[itemId];
        if (!meta) return;
        const stockCount = getInventoryCount(itemId);
        const sellQty = Math.max(0, Math.min(stockCount, Math.floor(qty || 0)));
        if (sellQty < 1 || sellQty > stockCount) return;

        const totalGold = calculateStorageSellGold(itemId, sellQty);
        addInventoryItem(itemId, -sellQty);
        updateGardenCoins(totalGold);
        const orderResult = applySellToCurrentOrder(itemId, sellQty);
        saveActiveGardenModeState();
        refreshGardenEconomyUi();

        if (orderResult && orderResult.finishedRun) {
            closeStorageSellSheet();
            openCurrentRogueStageScreen();
            return;
        }

        if (getInventoryCount(itemId) > 0) {
            state.storageSell.qty = Math.min(state.storageSell.qty, getInventoryCount(itemId));
            syncStorageSellSheetUi();
            return;
        }

        closeStorageSellSheet();
    }

    function hasResidentCharacterAssetDbSupport() {
        return typeof window !== 'undefined' && 'indexedDB' in window;
    }

    function openResidentCharacterAssetDb() {
        if (!hasResidentCharacterAssetDbSupport()) {
            return Promise.reject(new Error('indexeddb-not-supported'));
        }
        if (state.residentFigureAssetDbPromise) {
            return state.residentFigureAssetDbPromise;
        }

        state.residentFigureAssetDbPromise = new Promise((resolve, reject) => {
            const request = window.indexedDB.open(GARDEN_FIGURE_ASSET_DB_NAME, 1);

            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(GARDEN_FIGURE_ASSET_STORE)) {
                    db.createObjectStore(GARDEN_FIGURE_ASSET_STORE, { keyPath: 'id' });
                }
            };

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error('indexeddb-open-failed'));
        }).catch((error) => {
            state.residentFigureAssetDbPromise = null;
            throw error;
        });

        return state.residentFigureAssetDbPromise;
    }

    async function saveResidentCharacterAssetFile(file) {
        const db = await openResidentCharacterAssetDb();
        const assetId = `garden_figure_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const record = {
            id: assetId,
            blob: file,
            name: file && file.name ? file.name : 'figure',
            type: file && file.type ? file.type : '',
            updatedAt: Date.now()
        };

        await new Promise((resolve, reject) => {
            const tx = db.transaction(GARDEN_FIGURE_ASSET_STORE, 'readwrite');
            tx.objectStore(GARDEN_FIGURE_ASSET_STORE).put(record);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('indexeddb-write-failed'));
            tx.onabort = () => reject(tx.error || new Error('indexeddb-write-aborted'));
        });

        return record;
    }

    async function readResidentCharacterAssetRecord(assetId) {
        if (!assetId) return null;
        const db = await openResidentCharacterAssetDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(GARDEN_FIGURE_ASSET_STORE, 'readonly');
            const request = tx.objectStore(GARDEN_FIGURE_ASSET_STORE).get(assetId);
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error || new Error('indexeddb-read-failed'));
        });
    }

    async function getResidentCharacterAssetObjectUrl(assetId) {
        if (!assetId) return '';

        const cachedUrl = state.residentFigureAssetUrlCache.get(assetId);
        if (cachedUrl) return cachedUrl;

        const record = await readResidentCharacterAssetRecord(assetId);
        if (!record || !record.blob) return '';

        const objectUrl = URL.createObjectURL(record.blob);
        state.residentFigureAssetUrlCache.set(assetId, objectUrl);
        return objectUrl;
    }

    async function deleteResidentCharacterAsset(assetId) {
        if (!assetId || !hasResidentCharacterAssetDbSupport()) return;

        const cachedUrl = state.residentFigureAssetUrlCache.get(assetId);
        if (cachedUrl) {
            URL.revokeObjectURL(cachedUrl);
            state.residentFigureAssetUrlCache.delete(assetId);
        }

        const db = await openResidentCharacterAssetDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(GARDEN_FIGURE_ASSET_STORE, 'readwrite');
            tx.objectStore(GARDEN_FIGURE_ASSET_STORE).delete(assetId);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error || new Error('indexeddb-delete-failed'));
            tx.onabort = () => reject(tx.error || new Error('indexeddb-delete-aborted'));
        });
    }

    function getContactFigureDraftFile(fieldKey) {
        return state.contactFigureDraftFiles && state.contactFigureDraftFiles[fieldKey]
            ? state.contactFigureDraftFiles[fieldKey]
            : null;
    }

    function clearContactFigureDraftFile(fieldKey) {
        const draft = getContactFigureDraftFile(fieldKey);
        if (draft && draft.previewUrl) {
            URL.revokeObjectURL(draft.previewUrl);
        }
        if (!state.contactFigureDraftFiles) {
            state.contactFigureDraftFiles = createEmptyContactFigureDraftFiles();
        }
        state.contactFigureDraftFiles[fieldKey] = null;
    }

    function resetContactFigureDraftFiles() {
        ['idle', 'runLeft', 'runRight'].forEach(clearContactFigureDraftFile);
        state.contactFigureDraftFiles = createEmptyContactFigureDraftFiles();
    }

    function setContactFigureDraftFile(fieldKey, file) {
        clearContactFigureDraftFile(fieldKey);
        if (!file) return;
        if (!state.contactFigureDraftFiles) {
            state.contactFigureDraftFiles = createEmptyContactFigureDraftFiles();
        }
        state.contactFigureDraftFiles[fieldKey] = {
            file,
            name: file.name || 'figure',
            previewUrl: URL.createObjectURL(file)
        };
    }

    function getContactFigureInputSource(inputEl, fieldKey = '') {
        const manualUrl = inputEl && typeof inputEl.value === 'string' ? inputEl.value.trim() : '';
        if (manualUrl) {
            return { url: manualUrl, assetId: '', kind: 'url' };
        }

        const draft = fieldKey ? getContactFigureDraftFile(fieldKey) : null;
        if (draft && draft.previewUrl) {
            return { url: draft.previewUrl, assetId: '', kind: 'draft' };
        }

        const assetId = inputEl && inputEl.dataset ? String(inputEl.dataset.assetId || '').trim() : '';
        if (assetId) {
            return { url: '', assetId, kind: 'asset' };
        }

        return { url: '', assetId: '', kind: 'empty' };
    }

    function getContactFigureFieldConfigMeta(fieldKey) {
        if (fieldKey === 'pet') {
            return {
                urlKey: 'petUrl',
                assetIdKey: 'petAssetId',
                inputEl: contactFigurePetInputEl,
                previewEl: contactFigurePetPreviewEl,
                emptyLabel: '暂无摸头图'
            };
        }
        if (fieldKey === 'feed') {
            return {
                urlKey: 'feedUrl',
                assetIdKey: 'feedAssetId',
                inputEl: contactFigureFeedInputEl,
                previewEl: contactFigureFeedPreviewEl,
                emptyLabel: '暂无喂食图'
            };
        }
        if (fieldKey === 'runLeft') {
            return {
                urlKey: 'runLeftUrl',
                assetIdKey: 'runLeftAssetId',
                inputEl: contactFigureRunLeftInputEl,
                previewEl: contactFigureRunLeftPreviewEl,
                emptyLabel: '暂无左跑图'
            };
        }
        if (fieldKey === 'runRight') {
            return {
                urlKey: 'runRightUrl',
                assetIdKey: 'runRightAssetId',
                inputEl: contactFigureRunRightInputEl,
                previewEl: contactFigureRunRightPreviewEl,
                emptyLabel: '暂无右跑图'
            };
        }
        return {
            urlKey: 'idleUrl',
            assetIdKey: 'idleAssetId',
            inputEl: contactFigureIdleInputEl,
            previewEl: contactFigureIdlePreviewEl,
            emptyLabel: '暂无站立图'
        };
    }

    function ensureContactFigurePreviewImage(previewEl) {
        if (!previewEl) return null;

        let imageEl = previewEl.querySelector('.garden-contact-figure-preview-img');
        if (imageEl) return imageEl;

        imageEl = document.createElement('img');
        imageEl.className = 'garden-contact-figure-preview-img';
        imageEl.alt = 'contact figure preview';
        imageEl.draggable = false;
        imageEl.loading = 'eager';
        imageEl.style.width = '100%';
        imageEl.style.height = '100%';
        imageEl.style.display = 'block';
        imageEl.style.objectFit = 'contain';
        imageEl.style.objectPosition = 'center bottom';
        imageEl.style.borderRadius = 'inherit';
        imageEl.style.pointerEvents = 'none';
        imageEl.style.opacity = '0';
        imageEl.style.transition = 'opacity 0.18s ease';

        previewEl.insertBefore(imageEl, previewEl.firstChild || null);
        return imageEl;
    }

    function syncContactFigurePreview(previewEl, url, emptyLabel) {
        if (!previewEl) return;
        const nextUrl = sanitizeResidentCharacterUrl(url);
        const labelEl = previewEl.querySelector('.garden-contact-figure-preview-label');
        const imageEl = ensureContactFigurePreviewImage(previewEl);
        previewEl.style.backgroundImage = 'none';
        previewEl.classList.toggle('is-empty', !nextUrl);
        if (imageEl) {
            if (nextUrl) {
                if (imageEl.getAttribute('src') !== nextUrl) {
                    imageEl.setAttribute('src', nextUrl);
                }
                imageEl.style.opacity = '1';
            } else {
                imageEl.removeAttribute('src');
                imageEl.style.opacity = '0';
            }
        }
        if (labelEl) {
            labelEl.textContent = nextUrl ? '' : emptyLabel;
        }
    }
    function getContactFigureStoredValue(inputEl) {
        if (!inputEl) return '';
        const manualUrl = typeof inputEl.value === 'string' ? inputEl.value.trim() : '';
        if (manualUrl) return manualUrl;
        return inputEl.dataset && inputEl.dataset.uploadDataUrl
            ? String(inputEl.dataset.uploadDataUrl || '').trim()
            : '';
    }

    function isInlineImageDataUrl(value) {
        return typeof value === 'string' && /^data:image\//i.test(value.trim());
    }

    function updateContactFigureUploadStatus(fieldKey, inputEl) {
        if (!contactFigureModalEl || !inputEl) return;
        const statusEl = contactFigureModalEl.querySelector(`[data-figure-upload-status="${fieldKey}"]`);
        if (!statusEl) return;

        const manualUrl = typeof inputEl.value === 'string' ? inputEl.value.trim() : '';
        const uploadDataUrl = inputEl.dataset ? String(inputEl.dataset.uploadDataUrl || '').trim() : '';

        if (manualUrl) {
            statusEl.textContent = '当前使用：外部图片链接';
            return;
        }
        if (uploadDataUrl) {
            statusEl.textContent = '当前使用：浏览器内已上传动图';
            return;
        }
        statusEl.textContent = '当前使用：未设置';
    }

    function readContactFigureFormConfig() {
        return sanitizeResidentCharacter({
            idleUrl: getContactFigureStoredValue(contactFigureIdleInputEl),
            runLeftUrl: getContactFigureStoredValue(contactFigureRunLeftInputEl),
            runRightUrl: getContactFigureStoredValue(contactFigureRunRightInputEl),
            petUrl: getContactFigureStoredValue(contactFigurePetInputEl),
            feedUrl: getContactFigureStoredValue(contactFigureFeedInputEl)
        });
    }

    function updateContactFigureFormPreviews() {
        syncContactFigurePreview(contactFigureIdlePreviewEl, getContactFigureStoredValue(contactFigureIdleInputEl), '暂无站立图');
        syncContactFigurePreview(contactFigureRunLeftPreviewEl, getContactFigureStoredValue(contactFigureRunLeftInputEl), '暂无左跑图');
        syncContactFigurePreview(contactFigureRunRightPreviewEl, getContactFigureStoredValue(contactFigureRunRightInputEl), '暂无右跑图');
        syncContactFigurePreview(contactFigurePetPreviewEl, getContactFigureStoredValue(contactFigurePetInputEl), '暂无摸头图');
        syncContactFigurePreview(contactFigureFeedPreviewEl, getContactFigureStoredValue(contactFigureFeedInputEl), '暂无喂食图');
        updateContactFigureUploadStatus('idle', contactFigureIdleInputEl);
        updateContactFigureUploadStatus('runLeft', contactFigureRunLeftInputEl);
        updateContactFigureUploadStatus('runRight', contactFigureRunRightInputEl);
        updateContactFigureUploadStatus('pet', contactFigurePetInputEl);
        updateContactFigureUploadStatus('feed', contactFigureFeedInputEl);
    }

    function fillContactFigureForm(contactId) {
        const resolvedContactId = resolveGardenContactId(contactId);
        const displayName = getGardenContactDisplayName(resolvedContactId);
        const config = getContactFigureConfig(resolvedContactId);

        state.contactFigureEditingId = resolvedContactId;
        if (contactFigureModalTitleEl) {
            contactFigureModalTitleEl.textContent = `${displayName}的形象设置`;
        }
        if (contactFigureIdleInputEl) {
            contactFigureIdleInputEl.value = isInlineImageDataUrl(config.idleUrl) ? '' : config.idleUrl;
            contactFigureIdleInputEl.dataset.uploadDataUrl = isInlineImageDataUrl(config.idleUrl) ? config.idleUrl : '';
        }
        if (contactFigureRunLeftInputEl) {
            contactFigureRunLeftInputEl.value = isInlineImageDataUrl(config.runLeftUrl) ? '' : config.runLeftUrl;
            contactFigureRunLeftInputEl.dataset.uploadDataUrl = isInlineImageDataUrl(config.runLeftUrl) ? config.runLeftUrl : '';
        }
        if (contactFigureRunRightInputEl) {
            contactFigureRunRightInputEl.value = isInlineImageDataUrl(config.runRightUrl) ? '' : config.runRightUrl;
            contactFigureRunRightInputEl.dataset.uploadDataUrl = isInlineImageDataUrl(config.runRightUrl) ? config.runRightUrl : '';
        }
        if (contactFigurePetInputEl) {
            contactFigurePetInputEl.value = isInlineImageDataUrl(config.petUrl) ? '' : config.petUrl;
            contactFigurePetInputEl.dataset.uploadDataUrl = isInlineImageDataUrl(config.petUrl) ? config.petUrl : '';
        }
        if (contactFigureFeedInputEl) {
            contactFigureFeedInputEl.value = isInlineImageDataUrl(config.feedUrl) ? '' : config.feedUrl;
            contactFigureFeedInputEl.dataset.uploadDataUrl = isInlineImageDataUrl(config.feedUrl) ? config.feedUrl : '';
        }
        updateContactFigureFormPreviews();
    }
    function readImageFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
            reader.onerror = () => reject(reader.error || new Error('file-read-failed'));
            reader.readAsDataURL(file);
        });
    }

    async function applyContactFigureUpload(fieldKey, file) {
        const meta = getContactFigureFieldConfigMeta(fieldKey);
        if (!meta.inputEl || !file) return;

        if (!(file.type || '').toLowerCase().startsWith('image/')) {
            window.alert('请选择图片或动图文件。');
            return;
        }
        if (file.size > 900 * 1024) {
            window.alert('图片过大，当前浏览器直传建议控制在 900KB 以内，优先使用 WebP 动图。');
            return;
        }

        try {
            const dataUrl = await readImageFileAsDataUrl(file);
            if (!dataUrl) {
                window.alert('图片读取失败，请重试。');
                return;
            }
            meta.inputEl.value = '';
            meta.inputEl.dataset.uploadDataUrl = dataUrl;
            updateContactFigureFormPreviews();
        } catch (error) {
            window.alert('图片读取失败，请重试。');
        }
    }

    function closeContactFigureModal() {
        if (!contactFigureModalEl) return;
        contactFigureModalEl.classList.remove('is-open');
        contactFigureModalEl.style.pointerEvents = 'none';
        contactFigureModalEl.style.display = 'none';
        state.contactFigureEditingId = null;
        window.setTimeout(() => {
            if (contactFigureModalEl && !contactFigureModalEl.classList.contains('is-open')) {
                contactFigureModalEl.hidden = true;
            }
        }, 180);
    }

    function openContactFigureSettings(contactId = null) {
        init();
        ensureContactFigureModal();
        if (!contactFigureModalEl) return;

        fillContactFigureForm(contactId);
        contactFigureModalEl.hidden = false;
        contactFigureModalEl.style.display = 'flex';
        contactFigureModalEl.style.pointerEvents = 'auto';
        window.requestAnimationFrame(() => {
            if (!contactFigureModalEl) return;
            contactFigureModalEl.classList.add('is-open');
        });
    }

    function ensureContactFigureModal() {
        if (!screenEl || contactFigureModalEl) return;

        const modal = document.createElement('div');
        modal.className = 'garden-contact-figure-modal';
        modal.hidden = true;
        modal.style.cssText = 'position:absolute;inset:0;z-index:320;display:none;align-items:flex-end;justify-content:center;padding:calc(env(safe-area-inset-top, 0px) + 20px) 12px calc(env(safe-area-inset-bottom, 0px) + 12px);box-sizing:border-box;pointer-events:none;';
        modal.innerHTML = `
            <div class="garden-contact-figure-backdrop"></div>
            <div class="garden-contact-figure-panel" role="dialog" aria-modal="true" aria-label="联系人形象设置" style="position:relative;width:min(100%,520px);max-height:100%;overflow:auto;border-radius:22px 22px 18px 18px;margin-top:auto;">
                <div class="garden-contact-figure-handle"></div>
                <div class="garden-contact-figure-head">
                    <div class="garden-contact-figure-title">联系人形象设置</div>
                    <button class="garden-contact-figure-close" type="button" aria-label="关闭">×</button>
                </div>
                <div class="garden-contact-figure-form">
                    <div class="garden-contact-figure-tip">可直接在网页里上传动图。注意：这种方式只会保存在当前用户自己的浏览器里，不会自动同步给所有用户。</div>
                    <div class="garden-contact-figure-field">
                        <div class="garden-contact-figure-field-top">
                            <label class="garden-contact-figure-label" for="garden-contact-figure-idle">站立动图链接</label>
                            <div class="garden-contact-figure-preview is-empty" id="garden-contact-figure-idle-preview"><span class="garden-contact-figure-preview-label">暂无站立图</span></div>
                        </div>
                        <input id="garden-contact-figure-idle" class="garden-contact-figure-input" type="text" placeholder="可粘贴外链，也可点下方上传" inputmode="url" spellcheck="false" />
                        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
                            <button type="button" class="garden-contact-figure-action is-muted" data-figure-upload="idle">上传站立图</button>
                            <span data-figure-upload-status="idle" style="font-size:12px;color:#7c8aa5;">当前使用：未设置</span>
                        </div>
                        <input id="garden-contact-figure-idle-file" type="file" accept="image/*" hidden />
                    </div>
                    <div class="garden-contact-figure-field">
                        <div class="garden-contact-figure-field-top">
                            <label class="garden-contact-figure-label" for="garden-contact-figure-run-left">向左跑动图链接</label>
                            <div class="garden-contact-figure-preview is-empty" id="garden-contact-figure-run-left-preview"><span class="garden-contact-figure-preview-label">暂无左跑图</span></div>
                        </div>
                        <input id="garden-contact-figure-run-left" class="garden-contact-figure-input" type="text" placeholder="可粘贴外链，也可点下方上传" inputmode="url" spellcheck="false" />
                        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
                            <button type="button" class="garden-contact-figure-action is-muted" data-figure-upload="runLeft">上传左跑图</button>
                            <span data-figure-upload-status="runLeft" style="font-size:12px;color:#7c8aa5;">当前使用：未设置</span>
                        </div>
                        <input id="garden-contact-figure-run-left-file" type="file" accept="image/*" hidden />
                    </div>
                    <div class="garden-contact-figure-field">
                        <div class="garden-contact-figure-field-top">
                            <label class="garden-contact-figure-label" for="garden-contact-figure-run-right">向右跑动图链接</label>
                            <div class="garden-contact-figure-preview is-empty" id="garden-contact-figure-run-right-preview"><span class="garden-contact-figure-preview-label">暂无右跑图</span></div>
                        </div>
                        <input id="garden-contact-figure-run-right" class="garden-contact-figure-input" type="text" placeholder="可粘贴外链，也可点下方上传" inputmode="url" spellcheck="false" />
                        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
                            <button type="button" class="garden-contact-figure-action is-muted" data-figure-upload="runRight">上传右跑图</button>
                            <span data-figure-upload-status="runRight" style="font-size:12px;color:#7c8aa5;">当前使用：未设置</span>
                        </div>
                        <input id="garden-contact-figure-run-right-file" type="file" accept="image/*" hidden />
                    </div>
                    <div class="garden-contact-figure-field">
                        <div class="garden-contact-figure-field-top">
                            <label class="garden-contact-figure-label" for="garden-contact-figure-pet">被摸头动图链接</label>
                            <div class="garden-contact-figure-preview is-empty" id="garden-contact-figure-pet-preview"><span class="garden-contact-figure-preview-label">暂无摸头图</span></div>
                        </div>
                        <input id="garden-contact-figure-pet" class="garden-contact-figure-input" type="text" placeholder="可粘贴外链，也可点下方上传" inputmode="url" spellcheck="false" />
                        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
                            <button type="button" class="garden-contact-figure-action is-muted" data-figure-upload="pet">上传摸头图</button>
                            <span data-figure-upload-status="pet" style="font-size:12px;color:#7c8aa5;">当前使用：未设置</span>
                        </div>
                        <input id="garden-contact-figure-pet-file" type="file" accept="image/*" hidden />
                    </div>
                    <div class="garden-contact-figure-field">
                        <div class="garden-contact-figure-field-top">
                            <label class="garden-contact-figure-label" for="garden-contact-figure-feed">被喂食动图链接</label>
                            <div class="garden-contact-figure-preview is-empty" id="garden-contact-figure-feed-preview"><span class="garden-contact-figure-preview-label">暂无喂食图</span></div>
                        </div>
                        <input id="garden-contact-figure-feed" class="garden-contact-figure-input" type="text" placeholder="可粘贴外链，也可点下方上传" inputmode="url" spellcheck="false" />
                        <div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap;">
                            <button type="button" class="garden-contact-figure-action is-muted" data-figure-upload="feed">上传喂食图</button>
                            <span data-figure-upload-status="feed" style="font-size:12px;color:#7c8aa5;">当前使用：未设置</span>
                        </div>
                        <input id="garden-contact-figure-feed-file" type="file" accept="image/*" hidden />
                    </div>
                </div>
                <div class="garden-contact-figure-actions">
                    <button class="garden-contact-figure-action is-muted" type="button" data-figure-action="cancel">取消</button>
                    <button class="garden-contact-figure-action is-danger" type="button" data-figure-action="clear">清空</button>
                    <button class="garden-contact-figure-action is-primary" type="button" data-figure-action="save">保存</button>
                </div>
            </div>
        `;
        screenEl.appendChild(modal);

        contactFigureModalEl = modal;
        contactFigureModalTitleEl = modal.querySelector('.garden-contact-figure-title');
        contactFigureIdleInputEl = modal.querySelector('#garden-contact-figure-idle');
        contactFigureRunLeftInputEl = modal.querySelector('#garden-contact-figure-run-left');
        contactFigureRunRightInputEl = modal.querySelector('#garden-contact-figure-run-right');
        contactFigurePetInputEl = modal.querySelector('#garden-contact-figure-pet');
        contactFigureFeedInputEl = modal.querySelector('#garden-contact-figure-feed');
        contactFigureIdlePreviewEl = modal.querySelector('#garden-contact-figure-idle-preview');
        contactFigureRunLeftPreviewEl = modal.querySelector('#garden-contact-figure-run-left-preview');
        contactFigureRunRightPreviewEl = modal.querySelector('#garden-contact-figure-run-right-preview');
        contactFigurePetPreviewEl = modal.querySelector('#garden-contact-figure-pet-preview');
        contactFigureFeedPreviewEl = modal.querySelector('#garden-contact-figure-feed-preview');

        const closeButton = modal.querySelector('.garden-contact-figure-close');
        const backdrop = modal.querySelector('.garden-contact-figure-backdrop');
        const cancelButton = modal.querySelector('[data-figure-action="cancel"]');
        const clearButton = modal.querySelector('[data-figure-action="clear"]');
        const saveButton = modal.querySelector('[data-figure-action="save"]');
        const idleFileInput = modal.querySelector('#garden-contact-figure-idle-file');
        const runLeftFileInput = modal.querySelector('#garden-contact-figure-run-left-file');
        const runRightFileInput = modal.querySelector('#garden-contact-figure-run-right-file');
        const petFileInput = modal.querySelector('#garden-contact-figure-pet-file');
        const feedFileInput = modal.querySelector('#garden-contact-figure-feed-file');
        const uploadButtons = Array.from(modal.querySelectorAll('[data-figure-upload]'));

        [contactFigureIdleInputEl, contactFigureRunLeftInputEl, contactFigureRunRightInputEl, contactFigurePetInputEl, contactFigureFeedInputEl].forEach((input) => {
            if (!input) return;
            input.addEventListener('input', updateContactFigureFormPreviews);
        });

        uploadButtons.forEach((button) => {
            button.addEventListener('click', () => {
                const fieldKey = button.dataset.figureUpload;
                if (fieldKey === 'idle' && idleFileInput) idleFileInput.click();
                if (fieldKey === 'runLeft' && runLeftFileInput) runLeftFileInput.click();
                if (fieldKey === 'runRight' && runRightFileInput) runRightFileInput.click();
                if (fieldKey === 'pet' && petFileInput) petFileInput.click();
                if (fieldKey === 'feed' && feedFileInput) feedFileInput.click();
            });
        });

        if (idleFileInput) {
            idleFileInput.addEventListener('change', async () => {
                await applyContactFigureUpload('idle', idleFileInput.files && idleFileInput.files[0] ? idleFileInput.files[0] : null);
                idleFileInput.value = '';
            });
        }
        if (runLeftFileInput) {
            runLeftFileInput.addEventListener('change', async () => {
                await applyContactFigureUpload('runLeft', runLeftFileInput.files && runLeftFileInput.files[0] ? runLeftFileInput.files[0] : null);
                runLeftFileInput.value = '';
            });
        }
        if (runRightFileInput) {
            runRightFileInput.addEventListener('change', async () => {
                await applyContactFigureUpload('runRight', runRightFileInput.files && runRightFileInput.files[0] ? runRightFileInput.files[0] : null);
                runRightFileInput.value = '';
            });
        }
        if (petFileInput) {
            petFileInput.addEventListener('change', async () => {
                await applyContactFigureUpload('pet', petFileInput.files && petFileInput.files[0] ? petFileInput.files[0] : null);
                petFileInput.value = '';
            });
        }
        if (feedFileInput) {
            feedFileInput.addEventListener('change', async () => {
                await applyContactFigureUpload('feed', feedFileInput.files && feedFileInput.files[0] ? feedFileInput.files[0] : null);
                feedFileInput.value = '';
            });
        }

        if (closeButton) closeButton.addEventListener('click', closeContactFigureModal);
        if (backdrop) backdrop.addEventListener('click', closeContactFigureModal);
        if (cancelButton) cancelButton.addEventListener('click', closeContactFigureModal);
        if (clearButton) {
            clearButton.addEventListener('click', () => {
                if (!state.contactFigureEditingId) {
                    closeContactFigureModal();
                    return;
                }
                setContactFigureConfig(state.contactFigureEditingId, createEmptyResidentCharacter());
                closeContactFigureModal();
                vibrate(15);
            });
        }
        if (saveButton) {
            saveButton.addEventListener('click', () => {
                if (!state.contactFigureEditingId) {
                    closeContactFigureModal();
                    return;
                }
                setContactFigureConfig(state.contactFigureEditingId, readContactFigureFormConfig());
                closeContactFigureModal();
                vibrate(15);
            });
        }
        closeContactFigureModal();
    }

    function createEmptyGardenLayoutStore() {
        return {
            contacts: {}
        };
    }

    function createDefaultGardenLayout() {
        return {
            wall: {
                background: '',
                backgroundSize: '',
                backgroundColor: ''
            },
            floor: {
                background: '',
                backgroundSize: '',
                backgroundColor: ''
            },
            residentCharacter: {
                idleUrl: '',
                idleAssetId: '',
                runLeftUrl: '',
                runLeftAssetId: '',
                runRightUrl: '',
                runRightAssetId: '',
                petUrl: '',
                petAssetId: '',
                feedUrl: '',
                feedAssetId: ''
            },
            adoptedPets: [],
            items: []
        };
    }

    function sanitizeGardenSurface(rawSurface) {
        const surface = rawSurface && typeof rawSurface === 'object' ? rawSurface : {};
        return {
            background: typeof surface.background === 'string' ? surface.background : '',
            backgroundSize: typeof surface.backgroundSize === 'string' ? surface.backgroundSize : '',
            backgroundColor: typeof surface.backgroundColor === 'string' ? surface.backgroundColor : ''
        };
    }

    function sanitizeResidentCharacterUrl(value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    function createEmptyResidentCharacter() {
        return {
            idleUrl: '',
            idleAssetId: '',
            runLeftUrl: '',
            runLeftAssetId: '',
            runRightUrl: '',
            runRightAssetId: '',
            petUrl: '',
            petAssetId: '',
            feedUrl: '',
            feedAssetId: ''
        };
    }

    function sanitizeResidentCharacter(rawCharacter) {
        const source = rawCharacter && typeof rawCharacter === 'object' ? rawCharacter : {};
        return {
            idleUrl: sanitizeResidentCharacterUrl(source.idleUrl),
            idleAssetId: sanitizeResidentCharacterUrl(source.idleAssetId),
            runLeftUrl: sanitizeResidentCharacterUrl(source.runLeftUrl),
            runLeftAssetId: sanitizeResidentCharacterUrl(source.runLeftAssetId),
            runRightUrl: sanitizeResidentCharacterUrl(source.runRightUrl),
            runRightAssetId: sanitizeResidentCharacterUrl(source.runRightAssetId),
            petUrl: sanitizeResidentCharacterUrl(source.petUrl),
            petAssetId: sanitizeResidentCharacterUrl(source.petAssetId),
            feedUrl: sanitizeResidentCharacterUrl(source.feedUrl),
            feedAssetId: sanitizeResidentCharacterUrl(source.feedAssetId)
        };
    }

    function sanitizeAdoptedPet(rawPet) {
        if (!rawPet || typeof rawPet !== 'object') return null;
        const imageSrc = sanitizeResidentCharacterUrl(rawPet.imageSrc);
        if (!imageSrc) return null;
        return {
            id: sanitizeResidentCharacterUrl(rawPet.id) || `adopted_${Math.random().toString(36).slice(2, 10)}`,
            name: sanitizeResidentCharacterUrl(rawPet.name) || '新伙伴',
            imageSrc,
            hunger: Number.isFinite(rawPet.hunger) ? Math.max(0, Math.min(100, Number(rawPet.hunger))) : 50,
            mood: Number.isFinite(rawPet.mood) ? Math.max(0, Math.min(100, Number(rawPet.mood))) : 60
        };
    }

    function getAdoptedPetAnimationConfig(petData = {}) {
        const petId = typeof petData.id === 'string' ? petData.id.trim().toLowerCase() : '';
        const petName = typeof petData.name === 'string' ? petData.name.trim() : '';
        if (petId && ADOPTED_PET_ANIMATION_PRESETS[petId]) {
            return ADOPTED_PET_ANIMATION_PRESETS[petId];
        }
        if (petName === '柴犬') {
            return ADOPTED_PET_ANIMATION_PRESETS.shiba;
        }
        if (petName === '萨摩耶') {
            return ADOPTED_PET_ANIMATION_PRESETS.samoyed;
        }
        return null;
    }

    function resolveAdoptedPetPoseUrl(animationConfig, pose, fallbackUrl = '') {
        if (!animationConfig) return fallbackUrl || '';
        if (pose === 'run-left') {
            return animationConfig.runLeftUrl || animationConfig.runRightUrl || animationConfig.idleUrl || fallbackUrl || '';
        }
        if (pose === 'run-right') {
            return animationConfig.runRightUrl || animationConfig.runLeftUrl || animationConfig.idleUrl || fallbackUrl || '';
        }
        return animationConfig.idleUrl || animationConfig.runLeftUrl || animationConfig.runRightUrl || fallbackUrl || '';
    }

    function updateAdoptedPetPose(item, pose = 'idle') {
        if (!item) return;
        const imageEl = item.querySelector('.adopted-pet-photo');
        const flipperEl = item.querySelector('.adopted-pet-flipper');
        if (!imageEl || !flipperEl) return;

        const animationConfig = getAdoptedPetAnimationConfig({
            id: item.dataset.petId || '',
            name: item.dataset.petName || '',
            imageSrc: item.dataset.petImageSrc || ''
        });
        const fallbackUrl = item.dataset.petImageSrc || '';
        const nextPose = pose === 'run-left' || pose === 'run-right' ? pose : 'idle';
        const nextUrl = resolveAdoptedPetPoseUrl(animationConfig, nextPose, fallbackUrl);
        const shouldFlip = Boolean(animationConfig && animationConfig.flipRight && nextPose === 'run-right');
        const displayScale = animationConfig ? Math.max(0.8, Number(animationConfig.displayScale) || 1) : 1;
        const activeScale = nextPose === 'idle' ? 1 : displayScale;
        const runOffsetY = animationConfig ? Number(animationConfig.runOffsetY) || 0 : 0;
        const activeOffsetY = nextPose === 'idle' ? 0 : runOffsetY;

        const didSourceChange = Boolean(nextUrl) && imageEl.getAttribute('src') !== nextUrl;

        if (didSourceChange) {
            imageEl.setAttribute('src', nextUrl);
        }
        if (!nextUrl) {
            imageEl.removeAttribute('src');
        }

        if (didSourceChange) {
            item.classList.add('is-pose-transitioning');
            if (item.petPoseTransitionTimer) {
                clearTimeout(item.petPoseTransitionTimer);
            }
            item.petPoseTransitionTimer = window.setTimeout(() => {
                item.classList.remove('is-pose-transitioning');
                item.petPoseTransitionTimer = null;
            }, 180);
        }

        imageEl.dataset.pose = nextPose;
        flipperEl.style.transform = `translateY(${activeOffsetY}px) ${shouldFlip ? 'scaleX(-1)' : 'scaleX(1)'} scale(${activeScale})`;
        item.dataset.petPose = nextPose;
        item.classList.toggle('is-idle', nextPose === 'idle');
        item.classList.toggle('is-running-left', nextPose === 'run-left');
        item.classList.toggle('is-running-right', nextPose === 'run-right');
    }

    function sanitizeGardenItem(rawItem) {
        if (!rawItem || typeof rawItem !== 'object') return null;
        if (typeof rawItem.type !== 'string' || !SHAPE_GENERATORS[rawItem.type]) return null;

        const placement = rawItem.placement === 'wall' ? 'wall' : 'floor';
        const item = {
            type: rawItem.type,
            placement,
            left: typeof rawItem.left === 'string' ? rawItem.left : (placement === 'wall' ? '50%' : '50%'),
            top: typeof rawItem.top === 'string' ? rawItem.top : (placement === 'wall' ? '30%' : '80%')
        };

        if (rawItem.portal === 'flora' || rawItem.type === 'flora_portal_plant') {
            item.fixed = true;
            item.portal = 'flora';
        }

        if (rawItem.type === 'pet_adopted_photo') {
            item.petImageSrc = sanitizeResidentCharacterUrl(rawItem.petImageSrc);
            item.petName = sanitizeResidentCharacterUrl(rawItem.petName);
            item.petId = sanitizeResidentCharacterUrl(rawItem.petId);
        }

        return item;
    }

    function sanitizeGardenLayout(rawLayout) {
        const layout = rawLayout && typeof rawLayout === 'object' ? rawLayout : {};
        return {
            wall: sanitizeGardenSurface(layout.wall),
            floor: sanitizeGardenSurface(layout.floor),
            residentCharacter: sanitizeResidentCharacter(layout.residentCharacter),
            adoptedPets: Array.isArray(layout.adoptedPets)
                ? layout.adoptedPets.map(sanitizeAdoptedPet).filter(Boolean)
                : [],
            items: Array.isArray(layout.items)
                ? layout.items.map(sanitizeGardenItem).filter(Boolean)
                : []
        };
    }

    function readGardenLayouts() {
        if (state.gardenLayouts) return state.gardenLayouts;

        const emptyStore = createEmptyGardenLayoutStore();

        try {
            const raw = window.localStorage.getItem(GARDEN_LAYOUT_STORAGE_KEY);
            if (!raw) {
                state.gardenLayouts = emptyStore;
                return state.gardenLayouts;
            }

            const parsed = JSON.parse(raw);
            const store = createEmptyGardenLayoutStore();
            const contacts = parsed && parsed.contacts && typeof parsed.contacts === 'object' ? parsed.contacts : {};
            Object.keys(contacts).forEach((contactId) => {
                store.contacts[contactId] = sanitizeGardenLayout(contacts[contactId]);
            });
            state.gardenLayouts = store;
            return state.gardenLayouts;
        } catch (error) {
            console.warn('[garden-app] layout-read-failed', error);
            state.gardenLayouts = emptyStore;
            return state.gardenLayouts;
        }
    }

    function writeGardenLayouts() {
        if (!state.gardenLayouts) return;
        try {
            window.localStorage.setItem(GARDEN_LAYOUT_STORAGE_KEY, JSON.stringify(state.gardenLayouts));
        } catch (error) {
            console.warn('[garden-app] layout-write-failed', error);
        }
    }

    function resolveGardenContactId(explicitContactId = null) {
        if (explicitContactId) return String(explicitContactId);
        if (window.FloraEngine && typeof window.FloraEngine.getSnapshot === 'function') {
            const snapshot = window.FloraEngine.getSnapshot();
            if (snapshot && snapshot.contactId) {
                return String(snapshot.contactId);
            }
        }
        if (window.iphoneSimState && window.iphoneSimState.currentChatContactId) {
            return String(window.iphoneSimState.currentChatContactId);
        }
        return '__default__';
    }

    function getStoredGardenLayout(contactId) {
        const store = readGardenLayouts();
        const resolvedContactId = resolveGardenContactId(contactId);
        return store.contacts[resolvedContactId] ? sanitizeGardenLayout(store.contacts[resolvedContactId]) : null;
    }

    function findGardenContact(contactId) {
        if (!window.iphoneSimState || !Array.isArray(window.iphoneSimState.contacts)) return null;
        return window.iphoneSimState.contacts.find((contact) => String(contact.id) === String(contactId)) || null;
    }

    function getGardenContactDisplayName(contactId) {
        const contact = findGardenContact(contactId);
        if (!contact) return '\u8be5\u8054\u7cfb\u4eba';
        return contact.remark || contact.nickname || contact.name || '\u8be5\u8054\u7cfb\u4eba';
    }

    function getContactFigureConfig(contactId = null) {
        const layout = getStoredGardenLayout(contactId);
        return layout ? sanitizeResidentCharacter(layout.residentCharacter) : createEmptyResidentCharacter();
    }

    function setContactFigureConfig(contactId = null, config = {}) {
        const resolvedContactId = resolveGardenContactId(contactId);
        const store = readGardenLayouts();
        const existingLayout = store.contacts[resolvedContactId]
            ? sanitizeGardenLayout(store.contacts[resolvedContactId])
            : createDefaultGardenLayout();

        existingLayout.residentCharacter = sanitizeResidentCharacter(config);
        store.contacts[resolvedContactId] = existingLayout;
        state.gardenLayouts = store;
        writeGardenLayouts();

        if (String(state.currentGardenContactId || '') === String(resolvedContactId)) {
            refreshActiveContactFigure();
        }

        return sanitizeResidentCharacter(existingLayout.residentCharacter);
    }

    function serializeSurface(targetEl) {
        if (!targetEl) {
            return sanitizeGardenSurface(null);
        }
        return {
            background: targetEl.style.background || '',
            backgroundSize: targetEl.style.backgroundSize || '',
            backgroundColor: targetEl.style.backgroundColor || ''
        };
    }

    function applySurface(targetEl, surface) {
        if (!targetEl) return;
        const nextSurface = sanitizeGardenSurface(surface);
        targetEl.style.background = nextSurface.background || '';
        targetEl.style.backgroundSize = nextSurface.backgroundSize || '';
        targetEl.style.backgroundColor = nextSurface.backgroundColor || '';
    }

    function createItemSnapshot(itemEl) {
        if (!itemEl || !itemEl.dataset || !itemEl.dataset.itemType) return null;

        const isPortalFlora = itemEl.dataset.portal === 'flora' || itemEl.dataset.itemType === 'flora_portal_plant';
        if (itemEl.dataset.fixed === 'true' && !isPortalFlora) {
            return null;
        }

        const snapshot = {
            type: itemEl.dataset.itemType,
            placement: itemEl.dataset.placement === 'wall' ? 'wall' : 'floor',
            left: itemEl.style.left || '50%',
            top: itemEl.style.top || (itemEl.dataset.placement === 'wall' ? '30%' : '80%')
        };

        if (itemEl.dataset.itemType === 'pet_adopted_photo') {
            snapshot.petImageSrc = itemEl.dataset.petImageSrc || '';
            snapshot.petName = itemEl.dataset.petName || '';
            snapshot.petId = itemEl.dataset.petId || '';
        }

        if (isPortalFlora) {
            snapshot.fixed = true;
            snapshot.portal = 'flora';
        }

        return snapshot;
    }

    function collectCurrentGardenLayout() {
        const resolvedContactId = resolveGardenContactId(state.currentGardenContactId);
        const existingLayout = getStoredGardenLayout(resolvedContactId) || createDefaultGardenLayout();
        const layout = createDefaultGardenLayout();
        if (!state.roomEl) {
            layout.adoptedPets = Array.isArray(existingLayout.adoptedPets) ? existingLayout.adoptedPets.slice() : [];
            return layout;
        }

        layout.wall = serializeSurface(state.wallEl);
        layout.floor = serializeSurface(state.floorEl);
        layout.residentCharacter = getContactFigureConfig(resolvedContactId);
        layout.items = Array.from(state.roomEl.querySelectorAll('.item-container'))
            .map(createItemSnapshot)
            .filter(Boolean);

        const adoptedPetsFromItems = layout.items
            .filter((item) => item.type === 'pet_adopted_photo' && item.petImageSrc)
            .map((item) => sanitizeAdoptedPet({
                id: item.petId || '',
                name: item.petName || '新伙伴',
                imageSrc: item.petImageSrc
            }))
            .filter(Boolean);

        const mergedAdoptedPets = [
            ...(Array.isArray(existingLayout.adoptedPets) ? existingLayout.adoptedPets : []),
            ...adoptedPetsFromItems
        ].filter((pet, index, list) => list.findIndex((entry) => entry.imageSrc === pet.imageSrc && entry.name === pet.name) === index);

        layout.adoptedPets = mergedAdoptedPets;

        return sanitizeGardenLayout(layout);
    }

    function clearRoomItems() {
        if (!state.roomEl) return;
        Array.from(state.roomEl.querySelectorAll('.item-container')).forEach((itemEl) => {
            if (itemEl.petInterval) clearInterval(itemEl.petInterval);
            if (itemEl.petMoveTimer) clearTimeout(itemEl.petMoveTimer);
            if (itemEl.petPoseTransitionTimer) clearTimeout(itemEl.petPoseTransitionTimer);
            itemEl.remove();
        });
    }

    function buildItemOptionsFromSnapshot(itemSnapshot) {
        const options = {
            left: itemSnapshot.left,
            top: itemSnapshot.top
        };

        if (itemSnapshot.type === 'pet_adopted_photo') {
            options.petData = {
                id: itemSnapshot.petId || '',
                imageSrc: itemSnapshot.petImageSrc || '',
                name: itemSnapshot.petName || ''
            };
        }

        if (itemSnapshot.portal === 'flora' || itemSnapshot.type === 'flora_portal_plant') {
            options.fixed = true;
            options.portal = 'flora';
            options.ariaLabel = '\u6253\u5f00\u5fc3\u60c5\u7eff\u690d';
            options.className = 'is-fixed-portal';
            options.onClick = openFloraScreen;
        }

        return options;
    }

    function applyGardenLayout(layout) {
        if (!state.roomEl) return;

        const nextLayout = sanitizeGardenLayout(layout);
        clearResidentCharacterFigure();
        clearRoomItems();
        applySurface(state.wallEl, nextLayout.wall);
        applySurface(state.floorEl, nextLayout.floor);

        nextLayout.items.forEach((itemSnapshot) => {
            createRoomItem(itemSnapshot.type, itemSnapshot.placement, buildItemOptionsFromSnapshot(itemSnapshot));
        });

        ensureFixedFloraPlant();
        refreshActiveContactFigure(nextLayout.residentCharacter);
        syncFloraFromEngine();
        renderPanel();
    }

    function persistGardenLayoutForContact(contactId = null) {
        if (!state.roomEl) return;

        const resolvedContactId = resolveGardenContactId(contactId || state.currentGardenContactId);
        const store = readGardenLayouts();
        store.contacts[resolvedContactId] = collectCurrentGardenLayout();
        state.gardenLayouts = store;
        writeGardenLayouts();
    }

    function restoreGardenLayoutForContact(contactId = null) {
        const resolvedContactId = resolveGardenContactId(contactId);
        const layout = getStoredGardenLayout(resolvedContactId) || createDefaultGardenLayout();
        state.currentGardenContactId = resolvedContactId;
        applyGardenLayout(layout);
    }

    function syncGardenLayoutFromActiveContact() {
        const activeContactId = resolveGardenContactId();
        if (state.currentGardenContactId && state.currentGardenContactId !== activeContactId) {
            persistGardenLayoutForContact(state.currentGardenContactId);
        }
        restoreGardenLayoutForContact(activeContactId);
    }

    function initEditor() {
        if (!editorHost || editorHost.shadowRoot) {
            state.shadowRoot = editorHost ? editorHost.shadowRoot : null;
            cacheShadowElements();
            ensureFixedFloraPlant();
            return;
        }

        const shadowRoot = editorHost.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.2/src/regular/style.css">
            <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.2/src/fill/style.css">
            <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.2/src/bold/style.css">
            <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.2/src/duotone/style.css">
            <link rel="stylesheet" href="css/garden_app_shadow.css?v=8">

            <div class="garden-editor-root">
                <div class="bg-blob blob-1"></div>
                <div class="bg-blob blob-2"></div>

                <main id="room">
                    <div class="room-wall" id="roomWall"></div>
                    <div class="room-floor" id="roomFloor"></div>
                    <div class="resident-character-layer" id="residentCharacterLayer"></div>
                    <div class="toast" id="toast"><i class="fas fa-hand-pointer"></i> 丝滑拖拽，双击收回</div>
                </main>

                <div class="decor-panel glass" id="decorPanel">
                    <div class="tabs" id="gardenPanelTabs"></div>
                    <div class="panel-content" id="gardenPanelContent"></div>
                </div>
            </div>
        `;

        state.shadowRoot = shadowRoot;
        cacheShadowElements();
        renderPanel();
        shadowRoot.addEventListener('click', handleShadowClick);
        setDrawerOpen(false);
        ensureFixedFloraPlant();
    }

    function cacheShadowElements() {
        if (!state.shadowRoot) return;
        state.roomEl = state.shadowRoot.getElementById('room');
        state.wallEl = state.shadowRoot.getElementById('roomWall');
        state.floorEl = state.shadowRoot.getElementById('roomFloor');
        state.residentLayerEl = state.shadowRoot.getElementById('residentCharacterLayer');
        state.toastEl = state.shadowRoot.getElementById('toast');
        state.drawerEl = state.shadowRoot.getElementById('decorPanel');
        state.tabsEl = state.shadowRoot.getElementById('gardenPanelTabs');
        state.panelContentEl = state.shadowRoot.getElementById('gardenPanelContent');
    }

    function renderPanel() {
        if (!state.tabsEl || !state.panelContentEl) return;

        state.tabsEl.innerHTML = PANEL_TABS.map((tab) => `
            <button type="button" class="tab${tab.key === state.activeTab ? ' active' : ''}" data-tab-key="${tab.key}">
                <i class="${tab.icon}"></i>
                <span>${tab.label}</span>
            </button>
        `).join('');

        state.panelContentEl.innerHTML = PANEL_TABS.map((tab) => `
            <div class="item-grid${tab.key === state.activeTab ? ' active' : ''}" id="tab-${tab.key}">
                ${getPanelTabItems(tab.key).map((item, index) => renderCard(tab.key, item, index)).join('')}
            </div>
        `).join('');
    }

    function renderCard(tabKey, item, index) {
        if (item.kind === 'texture') {
            return `
                <button type="button" class="item-card" data-tab-key="${tabKey}" data-item-index="${index}">
                    <div class="texture-swatch" style="${item.swatchStyle}"></div>
                    <span class="item-name">${item.name}</span>
                </button>
            `;
        }

        if (item.kind === 'adoption') {
            return `
                <button type="button" class="item-card item-card-adoption" data-tab-key="${tabKey}" data-item-index="${index}">
                    <div class="adoption-plus-box"><i class="${item.icon} card-icon" style="color: ${item.color};"></i></div>
                    <span class="item-name">${item.name}</span>
                </button>
            `;
        }

        if (item.kind === 'owned-pet') {
            return `
                <button type="button" class="item-card item-card-owned-pet" data-tab-key="${tabKey}" data-item-index="${index}">
                    <div class="owned-pet-thumb"><img src="${item.imageSrc}" alt="${item.name}"></div>
                    <span class="item-name">${item.name}</span>
                </button>
            `;
        }

        return `
            <button type="button" class="item-card" data-tab-key="${tabKey}" data-item-index="${index}">
                <i class="${item.icon} card-icon" style="color: ${item.color};"></i>
                <span class="item-name">${item.name}</span>
            </button>
        `;
    }

    function handleShadowClick(event) {
        if (!event.target.closest('.resident-status-card') && !event.target.closest('.resident-feed-sheet') && !event.target.closest('.resident-dispatch-sheet')) {
            closeResidentStatusCard();
            closeResidentFeedSheet();
            closeResidentDispatchSheet();
        }
        const tabBtn = event.target.closest('.tab');
        if (tabBtn) {
            switchPanelTab(tabBtn.dataset.tabKey);
            return;
        }

        const card = event.target.closest('.item-card');
        if (!card) return;

        const items = getPanelTabItems(card.dataset.tabKey);
        const action = items[Number(card.dataset.itemIndex)];
        if (!action) return;

        if (action.kind === 'adoption') {
            openPetAdoptionOverlay();
            return;
        }

        if (action.kind === 'owned-pet') {
            openPetCareOverlay(action.petId);
            return;
        }

        if (action.kind === 'spawn') {
            spawnItem(action.itemType, action.placement);
            return;
        }

        changeTexture(action.target, action.background, action.bgSize, action.bgColor);
    }

    function isEventWithinElement(event, element) {
        if (!event || !element) return false;

        if (typeof event.composedPath === 'function') {
            const path = event.composedPath();
            if (Array.isArray(path) && path.includes(element)) {
                return true;
            }
        }

        const target = event.target;
        return !!(target && typeof element.contains === 'function' && element.contains(target));
    }

    function handleOutsideDrawerClick(event) {
        if (!state.drawerOpen || state.currentView !== 'home') return;
        if (isEventWithinElement(event, state.drawerEl)) return;
        if (isEventWithinElement(event, togglePanelBtn)) return;
        setDrawerOpen(false);
    }

    function switchPanelTab(tabKey) {
        state.activeTab = tabKey;
        if (!state.shadowRoot) return;

        state.shadowRoot.querySelectorAll('.tab').forEach((tab) => {
            tab.classList.toggle('active', tab.dataset.tabKey === tabKey);
        });
        state.shadowRoot.querySelectorAll('.item-grid').forEach((grid) => {
            grid.classList.toggle('active', grid.id === `tab-${tabKey}`);
        });
        vibrate(20);
    }

    function createRoomItem(type, placement, options = {}) {
        if (!state.roomEl || !SHAPE_GENERATORS[type]) return null;

        const item = document.createElement('div');
        item.className = `item-container${options.className ? ` ${options.className}` : ''}`;
        item.innerHTML = SHAPE_GENERATORS[type];
        item.dataset.itemType = type;
        item.dataset.placement = placement;
        item.style.left = options.left || '50%';
        item.style.top = options.top || (placement === 'wall' ? '30%' : '80%');

        if (type === 'pet_adopted_photo') {
            const petData = options.petData || {};
            const photoEl = item.querySelector('.adopted-pet-photo');
            const badgeEl = item.querySelector('.adopted-pet-badge');
            const animationConfig = getAdoptedPetAnimationConfig(petData);
            item.dataset.petImageSrc = typeof petData.imageSrc === 'string' ? petData.imageSrc : '';
            item.dataset.petName = typeof petData.name === 'string' ? petData.name : '';
            item.dataset.petId = typeof petData.id === 'string' ? petData.id : '';
            if (photoEl) {
                photoEl.src = resolveAdoptedPetPoseUrl(animationConfig, 'idle', item.dataset.petImageSrc);
                photoEl.alt = item.dataset.petName || '宠物';
            }
            if (badgeEl) {
                badgeEl.textContent = item.dataset.petName || '新伙伴';
            }
        }

        if (type.startsWith('pet_')) {
            item.dataset.isPet = 'true';
        }
        if (options.fixed) {
            item.dataset.fixed = 'true';
        }
        if (options.portal) {
            item.dataset.portal = options.portal;
            item.setAttribute('role', 'button');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', options.ariaLabel || '可交互物件');
        }

        if (!options.noDrag) {
            makeDraggable(item);
        }

        if (typeof options.onClick === 'function') {
            item.addEventListener('click', (clickEvent) => {
                if (item.dataset.justDragged === 'true') {
                    clickEvent.preventDefault();
                    clickEvent.stopPropagation();
                    return;
                }
                clickEvent.stopPropagation();
                options.onClick(clickEvent);
            });
            item.addEventListener('keydown', (keyEvent) => {
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                    keyEvent.preventDefault();
                    options.onClick(keyEvent);
                }
            });
        }

        item.addEventListener('dblclick', function (dblEvent) {
            dblEvent.stopPropagation();
            if (this.dataset.fixed === 'true') return;
            const removedContactId = state.currentGardenContactId;
            if (this.petInterval) clearInterval(this.petInterval);
            this.style.animation = 'popOut 0.3s forwards';
            vibrate(20);
            setTimeout(() => {
                this.remove();
                persistGardenLayoutForContact(removedContactId);
            }, 300);
        });

        state.roomEl.appendChild(item);
        updateZIndex(item);

        if (item.dataset.isPet) {
            startPetAI(item);
        }

        return item;
    }

    function ensureFixedFloraPlant() {
        if (!state.roomEl || state.roomEl.querySelector('.item-container[data-portal="flora"]')) return;

        createRoomItem('flora_portal_plant', 'floor', {
            left: '18%',
            top: '84%',
            fixed: true,
            portal: 'flora',
            ariaLabel: '\u6253\u5f00\u5fc3\u60c5\u7eff\u690d',
            className: 'is-fixed-portal',
            onClick: openFloraScreen
        });
    }

    function getNextAdoptedPetPosition() {
        const adoptedPets = state.roomEl
            ? Array.from(state.roomEl.querySelectorAll('.item-container[data-item-type="pet_adopted_photo"]'))
            : [];
        const preset = ADOPTION_PET_POSITIONS[adoptedPets.length % ADOPTION_PET_POSITIONS.length];
        return preset || { left: '50%', top: '86%' };
    }

    function hasAdoptedPetInRoom(petData) {
        if (!state.roomEl || !petData || !petData.imageSrc) return false;
        return Array.from(state.roomEl.querySelectorAll('.item-container[data-item-type="pet_adopted_photo"]')).some((itemEl) => {
            const sameImage = (itemEl.dataset.petImageSrc || '') === petData.imageSrc;
            const sameName = !petData.name || (itemEl.dataset.petName || '') === petData.name;
            return sameImage && sameName;
        });
    }

    function addAdoptedPetToGarden(petData) {
        if (!petData || !petData.imageSrc) return;
        const ownedPet = registerOwnedAdoptedPet(null, petData) || petData;
        const nextPosition = getNextAdoptedPetPosition();
        const item = createRoomItem('pet_adopted_photo', 'floor', {
            left: nextPosition.left,
            top: nextPosition.top,
            petData: {
                id: ownedPet.id || '',
                imageSrc: ownedPet.imageSrc,
                name: ownedPet.name || '新伙伴'
            }
        });
        if (!item) return;
        persistGardenLayoutForContact();
        renderPanel();
        showToast();
        vibrate(30);
    }

    function spawnItem(type, placement) {
        const item = createRoomItem(type, placement);
        if (!item) return;

        persistGardenLayoutForContact();
        showToast();
        vibrate(30);
    }

    function startPetAI(item) {

        const petShape = item.querySelector('.shape-pet');
        const flipper = item.querySelector('.pet-flipper');
        const adoptedPetAnimation = getAdoptedPetAnimationConfig({
            id: item.dataset.petId || '',
            name: item.dataset.petName || '',
            imageSrc: item.dataset.petImageSrc || ''
        });
        const hasShapePet = Boolean(petShape && flipper);
        const hasAnimatedAdoptedPet = Boolean(item.querySelector('.adopted-pet-photo') && adoptedPetAnimation);
        if (!hasShapePet && !hasAnimatedAdoptedPet) return;
        const adoptedPetMaxIdleDelayMs = hasAnimatedAdoptedPet
            ? Math.max(0, Number(adoptedPetAnimation.maxIdleDelayMs) || 0)
            : 0;
        const adoptedPetMaxRunDurationMs = hasAnimatedAdoptedPet
            ? Math.max(0, Number(adoptedPetAnimation.maxRunDurationMs) || 0)
            : 0;

        const getIdleDelay = (min, max) => {
            const cappedMax = adoptedPetMaxIdleDelayMs > 0 ? Math.min(max, adoptedPetMaxIdleDelayMs) : max;
            const cappedMin = Math.min(min, cappedMax);
            return Math.round(randomInRange(cappedMin, cappedMax));
        };

        const getRunDuration = (min, max) => {
            const cappedMax = adoptedPetMaxRunDurationMs > 0 ? Math.min(max, adoptedPetMaxRunDurationMs) : max;
            const cappedMin = Math.min(min, cappedMax);
            return Math.round(randomInRange(cappedMin, cappedMax));
        };

        const setPetIdlePose = () => {
            if (hasShapePet) {
                petShape.classList.remove('is-walking');
                petShape.classList.add('is-sitting');
                flipper.style.transform = 'scaleX(1)';
            }
            if (hasAnimatedAdoptedPet) {
                updateAdoptedPetPose(item, 'idle');
            }
        };

        const setPetRunPose = (direction) => {
            if (hasShapePet) {
                petShape.classList.remove('is-sitting');
                petShape.classList.add('is-walking');
                flipper.style.transform = direction === 'right' ? 'scaleX(1)' : 'scaleX(-1)';
            }
            if (hasAnimatedAdoptedPet) {
                updateAdoptedPetPose(item, direction === 'right' ? 'run-right' : 'run-left');
            }
        };

        const scheduleNextAction = (delay = getIdleDelay(1600, 3000)) => {
            clearTimeout(item.petInterval);
            if (item.petMoveTimer) {
                clearTimeout(item.petMoveTimer);
                item.petMoveTimer = null;
            }
            item.petInterval = window.setTimeout(() => {
                if (!item.isConnected) return;
                if (item.classList.contains('dragging')) {
                    scheduleNextAction(900);
                    return;
                }

                const currentLeft = parseFloat(item.style.left) || 50;
                const currentTop = parseFloat(item.style.top) || 80;
                const rand = Math.random();

                if (rand < 0.4) {
                    setPetIdlePose();
                    item.style.transition = 'left 0.5s ease-out, top 0.5s ease-out';
                    scheduleNextAction(getIdleDelay(1800, 3200));
                    return;
                }

                const dirX = (Math.random() - 0.5) * 30;
                const dirY = (Math.random() - 0.5) * 10;
                const newLeft = Math.max(10, Math.min(90, currentLeft + dirX));
                const newTop = Math.max(65, Math.min(95, currentTop + dirY));
                const direction = newLeft > currentLeft ? 'right' : 'left';
                const moveDuration = 2000;
                const totalRunDuration = getRunDuration(3200, 5000);
                const moveAfterRunLeadMs = hasAnimatedAdoptedPet
                    ? Math.max(0, Number(adoptedPetAnimation.moveAfterRunLeadMs) || 0)
                    : 0;
                const moveStopAtRunMs = hasAnimatedAdoptedPet
                    ? Math.max(moveAfterRunLeadMs, Number(adoptedPetAnimation.moveStopAtRunMs) || 0)
                    : 0;

                setPetRunPose(direction);

                if (moveAfterRunLeadMs > 0) {
                    item.style.transition = 'left 0ms linear, top 0ms linear';
                    item.petMoveTimer = window.setTimeout(() => {
                        if (!item.isConnected) return;
                        const moveEndAtMs = moveStopAtRunMs > 0
                            ? Math.min(totalRunDuration, moveStopAtRunMs)
                            : totalRunDuration;
                        const remainingMoveDuration = Math.max(600, moveEndAtMs - moveAfterRunLeadMs);
                        item.style.transition = `left ${remainingMoveDuration}ms linear, top ${remainingMoveDuration}ms linear`;
                        item.style.left = `${newLeft}%`;
                        item.style.top = `${newTop}%`;
                        updateZIndex(item, newTop);
                    }, moveAfterRunLeadMs);
                } else {
                    item.style.transition = `left ${moveDuration}ms linear, top ${moveDuration}ms linear`;
                    item.style.left = `${newLeft}%`;
                    item.style.top = `${newTop}%`;
                    updateZIndex(item, newTop);
                }

                item.petInterval = window.setTimeout(() => {
                    if (!item.isConnected) return;
                    if (item.petMoveTimer) {
                        clearTimeout(item.petMoveTimer);
                        item.petMoveTimer = null;
                    }
                    setPetIdlePose();
                    item.style.transition = 'left 0.5s ease-out, top 0.5s ease-out';
                    scheduleNextAction(getIdleDelay(1400, 2600));
                }, totalRunDuration);
            }, delay);
        };

        setPetIdlePose();
        scheduleNextAction(getIdleDelay(1200, 2200));
    }

    function makeDraggable(el) {
        let isDragging = false;
        let hasMoved = false;
        let startX;
        let startY;
        let startLeftPercent;
        let startTopPercent;

        const startDrag = (event) => {
            isDragging = true;
            hasMoved = false;
            el.classList.add('dragging');
            if (el.petMoveTimer) {
                clearTimeout(el.petMoveTimer);
                el.petMoveTimer = null;
            }

            if (el.dataset.isPet) {
                const petShape = el.querySelector('.shape-pet');
                if (petShape) petShape.classList.remove('is-walking', 'is-sitting');
            }

            startLeftPercent = parseFloat(el.style.left) || 50;
            startTopPercent = parseFloat(el.style.top) || 50;
            startX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
            startY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
            vibrate(15);
        };

        const drag = (event) => {
            if (!isDragging || !state.roomEl) return;
            if (event.cancelable) {
                event.preventDefault();
            }

            const currentX = event.type.includes('mouse') ? event.clientX : event.touches[0].clientX;
            const currentY = event.type.includes('mouse') ? event.clientY : event.touches[0].clientY;
            const dx = currentX - startX;
            const dy = currentY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                hasMoved = true;
            }
            const roomRect = state.roomEl.getBoundingClientRect();

            let newLeftPercent = startLeftPercent + (dx / roomRect.width) * 100;
            let newTopPercent = startTopPercent + (dy / roomRect.height) * 100;

            newLeftPercent = Math.max(0, Math.min(newLeftPercent, 100));

            const wallLimitPercent = 60;
            if (el.dataset.placement === 'wall') {
                newTopPercent = Math.max(0, Math.min(newTopPercent, wallLimitPercent));
            } else {
                newTopPercent = Math.max(wallLimitPercent - 5, Math.min(newTopPercent, 100));
            }

            el.style.left = `${newLeftPercent}%`;
            el.style.top = `${newTopPercent}%`;
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            el.classList.remove('dragging');
            updateZIndex(el);

            if (hasMoved) {
                el.dataset.justDragged = 'true';
                clearTimeout(el.justDraggedTimer);
                el.justDraggedTimer = setTimeout(() => {
                    delete el.dataset.justDragged;
                }, 220);
                persistGardenLayoutForContact();
            }

            if (el.dataset.isPet) {
                const petShape = el.querySelector('.shape-pet');
                const flipper = el.querySelector('.pet-flipper');
                if (petShape) petShape.classList.add('is-sitting');
                if (flipper) flipper.style.transform = 'scaleX(1)';
                if (el.querySelector('.adopted-pet-photo')) updateAdoptedPetPose(el, 'idle');
            }
        };

        el.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        el.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', endDrag);
    }

    function updateZIndex(el, dynamicTop = null) {
        if (el.dataset.placement === 'wall') {
            el.style.zIndex = '5';
        } else if (el.querySelector('.shape-rug')) {
            el.style.zIndex = '10';
        } else {
            const topPercent = dynamicTop !== null ? dynamicTop : parseFloat(el.style.top);
            el.style.zIndex = String(Math.floor(topPercent));
        }
    }

    function randomInRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function clampResidentFigureValue(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function clearResidentCharacterTimers() {
        if (state.residentFigureLoopTimer) {
            clearTimeout(state.residentFigureLoopTimer);
            state.residentFigureLoopTimer = null;
        }
        if (state.residentFigureMoveTimer) {
            clearTimeout(state.residentFigureMoveTimer);
            state.residentFigureMoveTimer = null;
        }
        if (state.residentFigureInteractionTimer) {
            clearTimeout(state.residentFigureInteractionTimer);
            state.residentFigureInteractionTimer = null;
        }
    }

    function clearResidentCharacterFigure() {
        clearResidentCharacterTimers();
        state.residentFigureInteractionLocked = false;
        state.residentFigurePreloadToken += 1;
        closeResidentStatusCard();
        closeResidentFeedSheet();
        closeResidentDispatchSheet();
        if (state.residentFigureEl) {
            state.residentFigureEl.remove();
            state.residentFigureEl = null;
        }
        if (state.residentFigureTriggerEl) {
            state.residentFigureTriggerEl.remove();
            state.residentFigureTriggerEl = null;
        }
        closeResidentAssignmentBadge();
    }

    function getContactStateStore() {
        if (!state.gardenGame) return {};
        if (!state.gardenGame.contactStates || typeof state.gardenGame.contactStates !== 'object') {
            state.gardenGame.contactStates = {};
        }
        return state.gardenGame.contactStates;
    }

    function getGardenContactState(contactId = null) {
        const resolvedContactId = resolveGardenContactId(contactId || state.currentGardenContactId);
        const store = getContactStateStore();
        if (!store[resolvedContactId]) {
            store[resolvedContactId] = createDefaultGardenContactState();
            saveGardenGameState();
        } else {
            store[resolvedContactId] = sanitizeGardenContactState(store[resolvedContactId]);
        }
        return store[resolvedContactId];
    }

    function patchGardenContactState(contactId, patch) {
        const resolvedContactId = resolveGardenContactId(contactId || state.currentGardenContactId);
        const current = sanitizeGardenContactState(getGardenContactState(resolvedContactId));
        const next = {
            ...current,
            ...(patch && typeof patch === 'object' ? patch : {})
        };
        next.mood = clampContactStatusValue(next.mood);
        next.hunger = clampContactStatusValue(next.hunger);
        next.energy = clampContactStatusValue(next.energy);
        next.activeAssignment = sanitizeGardenContactAssignment(next.activeAssignment);
        const store = getContactStateStore();
        store[resolvedContactId] = next;
        saveGardenGameState();
        return next;
    }

    function settleGardenContactNeeds(contactId = null, now = Date.now()) {
        const resolvedContactId = resolveGardenContactId(contactId || state.currentGardenContactId);
        const current = getGardenContactState(resolvedContactId);
        const elapsed = Math.max(0, now - Math.max(0, Number(current.lastStatusUpdateAt) || 0));
        const decaySteps = Math.floor(elapsed / CONTACT_HUNGER_DECAY_MS);
        if (decaySteps <= 0) return current;
        return patchGardenContactState(resolvedContactId, {
            hunger: current.hunger - decaySteps * CONTACT_HUNGER_DECAY_AMOUNT,
            lastStatusUpdateAt: current.lastStatusUpdateAt + decaySteps * CONTACT_HUNGER_DECAY_MS
        });
    }

    function closeResidentStatusCard() {
        if (state.residentStatusCardEl) {
            state.residentStatusCardEl.remove();
            state.residentStatusCardEl = null;
        }
    }

    function closeResidentFeedSheet() {
        if (state.residentFeedSheetEl) {
            state.residentFeedSheetEl.remove();
            state.residentFeedSheetEl = null;
        }
    }

    function closeResidentDispatchSheet() {
        if (state.residentDispatchSheetEl) {
            state.residentDispatchSheetEl.remove();
            state.residentDispatchSheetEl = null;
        }
    }

    function closeResidentAssignmentBadge() {
        if (state.residentAssignmentBadgeEl) {
            state.residentAssignmentBadgeEl.remove();
            state.residentAssignmentBadgeEl = null;
        }
    }

    function formatResidentAssignmentRemaining(finishAt) {
        const remainMs = Math.max(0, Number(finishAt || 0) - Date.now());
        const totalSeconds = Math.ceil(remainMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function showResidentAssignmentBadge(contactId = null) {
        const resolvedContactId = resolveGardenContactId(contactId || state.currentGardenContactId);
        const contactState = settleGardenContactNeeds(resolvedContactId);
        const assignment = contactState.activeAssignment;
        if (!assignment || !state.residentLayerEl) return;
        closeResidentAssignmentBadge();
        const badge = document.createElement('button');
        const labels = { farm: '农场浇水', pasture: '牧场喂动物', kitchen: '厨房做菜' };
        badge.type = 'button';
        badge.className = 'resident-assignment-badge';
        const anchorLeft = state.residentFigureEl && state.residentFigureEl.dataset.left
            ? `${state.residentFigureEl.dataset.left}%`
            : (state.residentFigureEl && state.residentFigureEl.style.left ? state.residentFigureEl.style.left : '50%');
        const anchorTop = state.residentFigureEl && state.residentFigureEl.dataset.top
            ? `${Math.max(16, Number(state.residentFigureEl.dataset.top) - 12)}%`
            : '66%';
        badge.style.left = anchorLeft;
        badge.style.top = anchorTop;
        badge.innerHTML = `<div class="resident-assignment-badge-title">外出中</div><div class="resident-assignment-badge-copy">${labels[assignment.type] || '派遣中'}</div><div class="resident-assignment-badge-time">${formatResidentAssignmentRemaining(assignment.finishAt)}</div>`;
        badge.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (completeResidentAssignment(resolvedContactId)) {
                closeResidentAssignmentBadge();
                return;
            }
            showResidentToast(`还需要 ${formatResidentAssignmentRemaining(assignment.finishAt)}`);
        });
        state.residentLayerEl.appendChild(badge);
        state.residentAssignmentBadgeEl = badge;
    }

    function showResidentToast(message) {
        if (!state.toastEl) return;
        state.toastEl.innerHTML = `<i class="fas fa-heart"></i> ${message}`;
        state.toastEl.classList.add('show');
        clearTimeout(state.toastTimeout);
        state.toastTimeout = setTimeout(() => {
            if (state.toastEl) state.toastEl.classList.remove('show');
        }, 2200);
    }

    function renderResidentStatusBars(contactState) {
        return [
            { label: '心情', emoji: '💖', value: contactState.mood, color: '#fb7185' },
            { label: '饱食', emoji: '🍖', value: contactState.hunger, color: '#f59e0b' },
            { label: '精力', emoji: '⚡', value: contactState.energy, color: '#22c55e' }
        ].map((item) => `
            <div class="resident-status-row">
                <div class="resident-status-meta"><span>${item.emoji} ${item.label}</span><strong>${item.value}</strong></div>
                <div class="resident-status-track"><div class="resident-status-fill" style="width:${item.value}%;background:${item.color};"></div></div>
            </div>
        `).join('');
    }

    function openResidentStatusCard() {
        const figureEl = state.residentFigureEl;
        if (!figureEl || !state.residentLayerEl) return;
        closeResidentStatusCard();
        closeResidentFeedSheet();
        closeResidentDispatchSheet();
        const contactId = resolveGardenContactId(state.currentGardenContactId);
        completeResidentAssignment(contactId);
        const contactState = settleGardenContactNeeds(contactId);
        const displayName = getGardenContactDisplayName(contactId);
        const card = document.createElement('div');
        card.className = 'resident-status-card';
        card.innerHTML = `
            <div class="resident-status-card-title">${displayName}${contactState.activeAssignment ? ' · 外出中' : ''}</div>
            <div class="resident-status-bars">${renderResidentStatusBars(contactState)}</div>
            <div class="resident-status-actions">
                <button type="button" data-resident-action="pet">摸头</button>
                <button type="button" data-resident-action="feed">喂食</button>
                <button type="button" data-resident-action="dispatch">派遣</button>
            </div>
        `;
        card.style.left = `${parseFloat(figureEl.dataset.left || figureEl.style.left || '50')}%`;
        card.style.top = `${Math.max(8, parseFloat(figureEl.dataset.top || figureEl.style.top || '84') - 21)}%`;
        card.addEventListener('click', (event) => {
            event.stopPropagation();
            const button = event.target.closest('[data-resident-action]');
            if (!button) return;
            if (button.dataset.residentAction === 'pet') handleResidentPetAction();
            if (button.dataset.residentAction === 'feed') openResidentFeedSheet();
            if (button.dataset.residentAction === 'dispatch') openResidentDispatchSheet();
        });
        state.residentLayerEl.appendChild(card);
        state.residentStatusCardEl = card;
    }

    function performResidentTimedPose(pose, duration, onDone) {
        const figureEl = state.residentFigureEl;
        if (!figureEl || state.residentFigureInteractionLocked) return;
        state.residentFigureInteractionLocked = true;
        clearResidentCharacterTimers();
        updateResidentCharacterPose(getContactFigureConfig(state.currentGardenContactId), pose);
        state.residentFigureInteractionTimer = window.setTimeout(() => {
            state.residentFigureInteractionLocked = false;
            if (typeof onDone === 'function') onDone();
            scheduleResidentCharacterLoop(getContactFigureConfig(state.currentGardenContactId));
            openResidentStatusCard();
        }, duration);
    }

    function handleResidentPetAction() {
        const contactId = resolveGardenContactId(state.currentGardenContactId);
        const contactState = settleGardenContactNeeds(contactId);
        if (contactState.activeAssignment && contactState.activeAssignment.finishAt > Date.now()) {
            showResidentToast('TA正在外出忙碌');
            return;
        }
        patchGardenContactState(contactId, { mood: contactState.mood + 10 });
        closeResidentFeedSheet();
        closeResidentDispatchSheet();
        performResidentTimedPose('pet', 2400, () => showResidentToast('TA看起来更开心了'));
    }

    function getResidentCookedFeedItems() {
        return STORAGE_TABS.cooked.itemIds.map((itemId) => ({ ...ITEM_META[itemId], count: getInventoryCount(itemId) })).filter((item) => item && item.count > 0);
    }

    function positionResidentSheetBelowAnchor(sheetEl, anchorEl) {
        if (!sheetEl || !anchorEl || !state.residentLayerEl) return;
        const layerRect = state.residentLayerEl.getBoundingClientRect();
        const anchorRect = anchorEl.getBoundingClientRect();
        const leftPx = anchorRect.left - layerRect.left + (anchorRect.width / 2);
        const topPx = anchorRect.top - layerRect.top + anchorRect.height + 8;
        sheetEl.style.left = `${leftPx}px`;
        sheetEl.style.top = `${topPx}px`;
        sheetEl.style.transform = 'translateX(-50%)';
    }

    function openResidentFeedSheet() {
        const anchorEl = state.residentStatusCardEl || state.residentFigureEl;
        if (!anchorEl || !state.residentLayerEl) return;
        closeResidentFeedSheet();
        closeResidentDispatchSheet();
        const items = getResidentCookedFeedItems();
        if (!items.length) {
            showResidentToast('仓库里还没有可喂的熟食');
            return;
        }
        const sheet = document.createElement('div');
        sheet.className = 'resident-feed-sheet';
        if (anchorEl === state.residentStatusCardEl) {
            sheet.classList.add('is-anchored-card');
            positionResidentSheetBelowAnchor(sheet, anchorEl);
        } else {
            sheet.style.left = `${parseFloat(anchorEl.dataset.left || anchorEl.style.left || '50')}%`;
            sheet.style.top = `${Math.max(24, parseFloat(anchorEl.dataset.top || anchorEl.style.top || '84') + 4)}%`;
        }
        sheet.innerHTML = items.map((item) => `<button type="button" data-feed-item="${item.id}">${item.emoji} ${item.name} · ${item.count}</button>`).join('');
        sheet.addEventListener('click', (event) => {
            event.stopPropagation();
            const button = event.target.closest('[data-feed-item]');
            if (!button) return;
            handleResidentFeedAction(button.dataset.feedItem);
        });
        state.residentLayerEl.appendChild(sheet);
        state.residentFeedSheetEl = sheet;
    }

    function handleResidentFeedAction(itemId) {
        const meta = ITEM_META[itemId];
        if (!meta || getInventoryCount(itemId) <= 0) return;
        const contactId = resolveGardenContactId(state.currentGardenContactId);
        const contactState = settleGardenContactNeeds(contactId);
        if (contactState.activeAssignment && contactState.activeAssignment.finishAt > Date.now()) {
            showResidentToast('TA正在外出忙碌');
            return;
        }
        addInventoryItem(itemId, -1);
        patchGardenContactState(contactId, {
            hunger: contactState.hunger + 25,
            mood: contactState.mood + 8,
            energy: contactState.energy + 12
        });
        closeResidentFeedSheet();
        renderStorageItems(state.gardenGame && state.gardenGame.storage ? state.gardenGame.storage.tab : 'cooked');
        performResidentTimedPose('feed', 2400, () => showResidentToast(`TA吃掉了 ${meta.name} ${meta.emoji}`));
    }

    function openResidentDispatchSheet() {
        const anchorEl = state.residentStatusCardEl || state.residentFigureEl;
        if (!anchorEl || !state.residentLayerEl) return;
        closeResidentDispatchSheet();
        closeResidentFeedSheet();
        const contactId = resolveGardenContactId(state.currentGardenContactId);
        const contactState = settleGardenContactNeeds(contactId);
        if (contactState.activeAssignment && contactState.activeAssignment.finishAt > Date.now()) {
            showResidentToast('TA已经出门干活啦');
            return;
        }
        if (contactState.hunger < 20) {
            showResidentToast('TA太饿了，先喂点吃的吧');
            return;
        }
        if (contactState.energy < 20) {
            showResidentToast('TA精力不够，先喂食吧');
            return;
        }
        const sheet = document.createElement('div');
        sheet.className = 'resident-dispatch-sheet';
        if (anchorEl === state.residentStatusCardEl) {
            sheet.classList.add('is-anchored-card');
            positionResidentSheetBelowAnchor(sheet, anchorEl);
        } else {
            sheet.style.left = `${parseFloat(anchorEl.dataset.left || anchorEl.style.left || '50')}%`;
            sheet.style.top = `${Math.max(24, parseFloat(anchorEl.dataset.top || anchorEl.style.top || '84') + 4)}%`;
        }
        sheet.innerHTML = '<button type="button" data-dispatch-type="farm">🌱 去农场浇水</button><button type="button" data-dispatch-type="pasture">🐄 去牧场喂动物</button><button type="button" data-dispatch-type="kitchen">🍳 去厨房做菜</button>';
        sheet.addEventListener('click', (event) => {
            event.stopPropagation();
            const button = event.target.closest('[data-dispatch-type]');
            if (!button) return;
            startResidentAssignment(button.dataset.dispatchType);
        });
        state.residentLayerEl.appendChild(sheet);
        state.residentDispatchSheetEl = sheet;
    }

    function startResidentAssignment(type) {
        const contactId = resolveGardenContactId(state.currentGardenContactId);
        const contactState = settleGardenContactNeeds(contactId);
        if (!['farm', 'pasture', 'kitchen'].includes(type)) return;
        if (contactState.hunger < 20) {
            showResidentToast('TA太饿了，先喂点吃的吧');
            return;
        }
        if (contactState.energy < 20) {
            showResidentToast('TA精力不够，先喂食吧');
            return;
        }
        if (type === 'farm') {
            const farmPlots = state.gardenGame && state.gardenGame.farm && Array.isArray(state.gardenGame.farm.plots)
                ? state.gardenGame.farm.plots
                : [];
            const hasWaterablePlot = farmPlots.some((plot) => plot && plot.state === 'planted');
            if (!hasWaterablePlot) {
                const now = Date.now();
                patchGardenContactState(contactId, {
                    activeAssignment: { type, startedAt: now, finishAt: now + CONTACT_ASSIGNMENT_EMPTY_RETURN_DELAY },
                    lastStatusUpdateAt: now
                });
                closeResidentDispatchSheet();
                closeResidentStatusCard();
                if (state.residentFigureEl) state.residentFigureEl.style.display = 'none';
                if (state.residentFigureTriggerEl) state.residentFigureTriggerEl.style.display = 'none';
                showResidentAssignmentBadge(contactId);
                syncAssignmentFigures();
                scheduleResidentAssignmentAutoSettlement(contactId);
                showResidentToast('农场暂时没有可浇水的植物，TA稍后会回来');
                return;
            }
        }
        const now = Date.now();
        patchGardenContactState(contactId, {
            energy: contactState.energy - CONTACT_ASSIGNMENT_COST.energy,
            hunger: contactState.hunger - CONTACT_ASSIGNMENT_COST.hunger,
            activeAssignment: { type, startedAt: now, finishAt: now + CONTACT_ASSIGNMENT_DURATIONS[type] },
            lastStatusUpdateAt: now
        });
        closeResidentDispatchSheet();
        closeResidentStatusCard();
        if (state.residentFigureEl) state.residentFigureEl.style.display = 'none';
        if (state.residentFigureTriggerEl) state.residentFigureTriggerEl.style.display = 'none';
        showResidentAssignmentBadge(contactId);
        syncAssignmentFigures();
        scheduleResidentAssignmentAutoSettlement(contactId);
        showResidentToast('TA出门干活啦');
    }

    function completeResidentAssignment(contactId = null) {
        const resolvedContactId = resolveGardenContactId(contactId || state.currentGardenContactId);
        const contactState = settleGardenContactNeeds(resolvedContactId);
        const assignment = contactState.activeAssignment;
        if (!assignment || assignment.finishAt > Date.now()) return false;
        let message = 'TA忙完回来啦';
        if (assignment.type === 'farm') {
            const plots = state.gardenGame && state.gardenGame.farm && Array.isArray(state.gardenGame.farm.plots) ? state.gardenGame.farm.plots : [];
            const hasWaterablePlot = plots.some((plot) => plot && plot.state === 'planted');
            if (!hasWaterablePlot) {
                message = '农场里暂时没有可浇水的植物，TA先回来了';
            }
            let reduced = 0;
            plots.forEach((plot) => {
                if (hasWaterablePlot && plot && plot.state === 'growing' && isFiniteNumber(plot.readyAt) && reduced < 3) {
                    plot.readyAt = Math.max(Date.now(), plot.readyAt - 60 * 1000);
                    reduced += 1;
                }
            });
            if (hasWaterablePlot) {
                message = reduced > 0 ? `TA帮你照料了 ${reduced} 块农田` : 'TA去农场转了一圈，暂时没有可浇水的作物';
            }
        } else if (assignment.type === 'pasture') {
            const animals = state.gardenGame && state.gardenGame.pasture && Array.isArray(state.gardenGame.pasture.animals) ? state.gardenGame.pasture.animals : [];
            const target = animals.find((animal) => animal && animal.state === 'hungry');
            if (target) {
                target.state = target.age === 'baby' ? 'growing' : 'producing';
                target.stateEndsAt = Date.now() + (target.age === 'baby' ? 2 * 60 * 1000 : 3 * 60 * 1000);
                message = 'TA帮你喂好了牧场里的动物';
            } else {
                message = 'TA去牧场巡视了一圈';
            }
        } else if (assignment.type === 'kitchen') {
            const recipe = Object.values(KITCHEN_RECIPES).find((candidate) => hasInventoryItems(candidate.ingredients || {})) || null;
            if (recipe) {
                Object.keys(recipe.ingredients || {}).forEach((itemId) => addInventoryItem(itemId, -(recipe.ingredients[itemId] || 0)));
                addInventoryItem(recipe.id, 1);
                message = `TA做了一份 ${recipe.name} ${recipe.emoji}`;
            } else {
                message = '厨房没有现成材料可做菜';
            }
        }
        patchGardenContactState(resolvedContactId, {
            mood: contactState.mood + 5,
            activeAssignment: null,
            lastStatusUpdateAt: Date.now()
        });
        saveGardenGameState();
        if (state.residentFigureEl) state.residentFigureEl.style.display = '';
        if (state.residentFigureTriggerEl) state.residentFigureTriggerEl.style.display = '';
        closeResidentAssignmentBadge();
        clearAssignmentFigures();
        showResidentToast(message);
        return true;
    }

    function resolveResidentCharacterUrl(config, pose) {
        const nextConfig = sanitizeResidentCharacter(config);
        if (pose === 'pet') {
            return nextConfig.petUrl || nextConfig.idleUrl || nextConfig.runLeftUrl || nextConfig.runRightUrl || '';
        }
        if (pose === 'feed') {
            return nextConfig.feedUrl || nextConfig.idleUrl || nextConfig.runLeftUrl || nextConfig.runRightUrl || '';
        }
        if (pose === 'run-left') {
            return nextConfig.runLeftUrl || nextConfig.runRightUrl || nextConfig.idleUrl || '';
        }
        if (pose === 'run-right') {
            return nextConfig.runRightUrl || nextConfig.runLeftUrl || nextConfig.idleUrl || '';
        }
        return nextConfig.idleUrl || nextConfig.runLeftUrl || nextConfig.runRightUrl || nextConfig.petUrl || nextConfig.feedUrl || '';
    }

    function updateAssignmentFigurePose(figureEl, config, pose) {
        if (!figureEl) return;
        const imageEl = figureEl.querySelector('.garden-assignment-sprite-img') || getResidentCharacterImageEl(figureEl) || figureEl.querySelector('img');
        const nextUrl = resolveResidentCharacterUrl(config, pose === 'left' ? 'run-left' : pose === 'right' ? 'run-right' : 'idle');
        if (!imageEl) return;
        if (nextUrl) {
            if (imageEl.getAttribute('src') !== nextUrl) {
                imageEl.setAttribute('src', nextUrl);
            }
            imageEl.dataset.pose = pose;
            imageEl.classList.remove('is-empty');
        } else {
            imageEl.removeAttribute('src');
            imageEl.dataset.pose = '';
            imageEl.classList.add('is-empty');
        }
        figureEl.dataset.pose = pose;
        figureEl.classList.toggle('is-idle', pose === 'idle');
        figureEl.classList.toggle('is-running-left', pose === 'left');
        figureEl.classList.toggle('is-running-right', pose === 'right');
    }

    function clearAssignmentFigureLoopTimers() {
        if (farmAssignmentLoopTimer) {
            clearTimeout(farmAssignmentLoopTimer);
            farmAssignmentLoopTimer = null;
        }
        if (pastureAssignmentLoopTimer) {
            clearTimeout(pastureAssignmentLoopTimer);
            pastureAssignmentLoopTimer = null;
        }
        if (residentAssignmentAutoTimer) {
            clearTimeout(residentAssignmentAutoTimer);
            residentAssignmentAutoTimer = null;
        }
    }

    function scheduleResidentAssignmentAutoSettlement(contactId = null) {
        if (residentAssignmentAutoTimer) {
            clearTimeout(residentAssignmentAutoTimer);
            residentAssignmentAutoTimer = null;
        }
        const resolvedContactId = resolveGardenContactId(contactId || state.currentGardenContactId);
        const contactState = getGardenContactState(resolvedContactId);
        const assignment = contactState.activeAssignment;
        if (!assignment || assignment.finishAt <= Date.now()) return;
        const delay = Math.max(80, Number(assignment.finishAt || 0) - Date.now() + 80);
        residentAssignmentAutoTimer = window.setTimeout(() => {
            residentAssignmentAutoTimer = null;
            if (!completeResidentAssignment(resolvedContactId)) return;
            if (state.currentView === 'home') {
                refreshActiveContactFigure();
            }
            syncAssignmentFigures();
        }, delay);
    }

    function runAssignmentFigureLoop(figureEl, scope) {
        if (!figureEl) return;
        const config = getContactFigureConfig(state.currentGardenContactId);
        updateAssignmentFigurePose(figureEl, config, 'idle');
        const timerRefSetter = scope === 'farm'
            ? (id) => { farmAssignmentLoopTimer = id; }
            : (id) => { pastureAssignmentLoopTimer = id; };
        const idleDelay = randomInRange(1200, 2200);
        timerRefSetter(window.setTimeout(() => {
            const currentLeft = parseFloat(figureEl.dataset.left || figureEl.style.left) || 50;
            const currentTop = parseFloat(figureEl.dataset.top || figureEl.style.top) || (scope === 'farm' ? 70 : 72);
            let direction = Math.random() < 0.5 ? 'left' : 'right';
            const deltaX = randomInRange(3, 7);
            const minLeft = scope === 'farm' ? 34 : 34;
            const maxLeft = scope === 'farm' ? 66 : 66;
            const minTop = scope === 'farm' ? 58 : 62;
            const maxTop = scope === 'farm' ? 72 : 76;
            if (direction === 'left' && currentLeft <= minLeft + 4) direction = 'right';
            if (direction === 'right' && currentLeft >= maxLeft - 4) direction = 'left';
            const nextLeft = clampResidentFigureValue(currentLeft + (direction === 'left' ? -deltaX : deltaX), minLeft, maxLeft);
            const nextTop = clampResidentFigureValue(currentTop + randomInRange(-2, 2), minTop, maxTop);
            const duration = Math.round(randomInRange(2600, 4200));
            updateAssignmentFigurePose(figureEl, config, direction);
            figureEl.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
            figureEl.style.left = `${nextLeft}%`;
            figureEl.style.top = `${nextTop}%`;
            figureEl.style.zIndex = String(scope === 'pasture' ? getPastureDepthZ(nextTop) : Math.max(2, Math.floor(nextTop)));
            figureEl.dataset.left = String(nextLeft);
            figureEl.dataset.top = String(nextTop);
            timerRefSetter(window.setTimeout(() => runAssignmentFigureLoop(figureEl, scope), duration + 80));
        }, idleDelay));
    }

    function createAssignmentFigureElement(scope) {
        const figure = document.createElement('div');
        const spriteSize = scope === 'farm'
            ? { figureW: 62, figureH: 74, spriteW: 62, spriteH: 68, imageW: 78, imageH: 78, imageBottom: 0 }
            : { figureW: 66, figureH: 78, spriteW: 66, spriteH: 72, imageW: 84, imageH: 84, imageBottom: 0 };
        figure.className = `garden-assignment-figure garden-assignment-figure-${scope}`;
        const startLeft = scope === 'farm' ? randomInRange(38, 62) : randomInRange(38, 62);
        const startTop = scope === 'farm' ? randomInRange(60, 70) : randomInRange(64, 74);
        figure.dataset.left = String(startLeft);
        figure.dataset.top = String(startTop);
        figure.style.left = `${startLeft}%`;
        figure.style.top = `${startTop}%`;
        figure.style.position = 'absolute';
        figure.style.transform = 'translate(-50%, -100%)';
        figure.style.transformOrigin = 'center bottom';
        figure.style.width = `${spriteSize.figureW}px`;
        figure.style.height = `${spriteSize.figureH}px`;
        figure.style.pointerEvents = 'none';
        figure.style.zIndex = String(scope === 'pasture' ? getPastureDepthZ(startTop) : Math.max(2, Math.floor(startTop)));
        figure.style.overflow = 'visible';
        figure.innerHTML = `
            <div class="resident-character-shadow"></div>
            <div class="garden-assignment-sprite resident-character-sprite">
                <img class="garden-assignment-sprite-img" alt="assignment contact" draggable="false" loading="eager" />
            </div>
        `;
        const shadowEl = figure.querySelector('.resident-character-shadow');
        if (shadowEl) {
            shadowEl.style.position = 'absolute';
            shadowEl.style.left = '50%';
            shadowEl.style.bottom = '0';
            shadowEl.style.width = scope === 'farm' ? '18px' : '20px';
            shadowEl.style.height = '5px';
            shadowEl.style.borderRadius = '999px';
            shadowEl.style.background = 'rgba(15,23,42,.18)';
            shadowEl.style.transform = 'translateX(-50%)';
            shadowEl.style.filter = 'blur(1px)';
        }
        const spriteEl = figure.querySelector('.garden-assignment-sprite');
        if (spriteEl) {
            spriteEl.style.position = 'absolute';
            spriteEl.style.left = '50%';
            spriteEl.style.bottom = '2px';
            spriteEl.style.width = `${spriteSize.spriteW}px`;
            spriteEl.style.height = `${spriteSize.spriteH}px`;
            spriteEl.style.transform = 'translateX(-50%)';
            spriteEl.style.overflow = 'visible';
            spriteEl.style.filter = 'drop-shadow(0 2px 4px rgba(0,0,0,.12))';
        }
        const imageEl = figure.querySelector('.garden-assignment-sprite-img');
        if (imageEl) {
            imageEl.style.position = 'absolute';
            imageEl.style.left = '50%';
            imageEl.style.bottom = `${spriteSize.imageBottom}px`;
            imageEl.style.width = `${spriteSize.imageW}px`;
            imageEl.style.height = `${spriteSize.imageH}px`;
            imageEl.style.maxWidth = 'none';
            imageEl.style.maxHeight = 'none';
            imageEl.style.display = 'block';
            imageEl.style.objectFit = 'contain';
            imageEl.style.objectPosition = 'center bottom';
            imageEl.style.transform = 'translateX(-50%)';
            imageEl.style.transformOrigin = 'center bottom';
            imageEl.style.filter = 'none';
        }
        updateAssignmentFigurePose(figure, getContactFigureConfig(state.currentGardenContactId), 'idle');
        return figure;
    }

    function ensureFarmAssignmentLayer() {
        if (!farmGridEl || !farmGridEl.parentElement) return null;
        if (farmAssignmentLayerEl && farmAssignmentLayerEl.isConnected) return farmAssignmentLayerEl;
        const host = farmGridEl.parentElement;
        host.style.position = host.style.position || 'relative';
        const layer = document.createElement('div');
        layer.className = 'garden-assignment-layer garden-assignment-layer-farm';
        host.appendChild(layer);
        farmAssignmentLayerEl = layer;
        return layer;
    }

    function ensurePastureAssignmentLayer() {
        if (!pastureFieldEl) return null;
        if (pastureAssignmentLayerEl && pastureAssignmentLayerEl.isConnected) return pastureAssignmentLayerEl;
        pastureFieldEl.style.position = pastureFieldEl.style.position || 'relative';
        const layer = document.createElement('div');
        layer.className = 'garden-assignment-layer garden-assignment-layer-pasture';
        pastureFieldEl.appendChild(layer);
        pastureAssignmentLayerEl = layer;
        return layer;
    }

    function renderAssignmentFigureInFarm() {
        const layer = ensureFarmAssignmentLayer();
        if (!layer) return;
        if (farmAssignmentFigureEl && farmAssignmentFigureEl.isConnected) return;
        farmAssignmentFigureEl = createAssignmentFigureElement('farm');
        layer.appendChild(farmAssignmentFigureEl);
        runAssignmentFigureLoop(farmAssignmentFigureEl, 'farm');
    }

    function renderAssignmentFigureInPasture() {
        const layer = ensurePastureAssignmentLayer();
        if (!layer) return;
        if (pastureAssignmentFigureEl && pastureAssignmentFigureEl.isConnected) return;
        pastureAssignmentFigureEl = createAssignmentFigureElement('pasture');
        layer.appendChild(pastureAssignmentFigureEl);
        runAssignmentFigureLoop(pastureAssignmentFigureEl, 'pasture');
    }

    function clearAssignmentFigures() {
        clearAssignmentFigureLoopTimers();
        if (farmAssignmentFigureEl) {
            farmAssignmentFigureEl.remove();
            farmAssignmentFigureEl = null;
        }
        if (pastureAssignmentFigureEl) {
            pastureAssignmentFigureEl.remove();
            pastureAssignmentFigureEl = null;
        }
        if (farmAssignmentLayerEl) {
            farmAssignmentLayerEl.remove();
            farmAssignmentLayerEl = null;
        }
        if (pastureAssignmentLayerEl) {
            pastureAssignmentLayerEl.remove();
            pastureAssignmentLayerEl = null;
        }
    }

    function syncAssignmentFigures() {
        clearAssignmentFigures();
        const contactState = getGardenContactState(state.currentGardenContactId);
        const assignment = contactState.activeAssignment;
        if (!assignment || assignment.finishAt <= Date.now()) return;
        if (assignment.type === 'farm' && state.farmScreenOpen) {
            renderAssignmentFigureInFarm();
        }
        if (assignment.type === 'pasture' && state.pastureScreenOpen) {
            renderAssignmentFigureInPasture();
        }
    }

    function getResidentCharacterImageEl(figureEl) {
        if (!figureEl) return null;
        return figureEl.querySelector('.resident-character-sprite-img');
    }

    function waitForResidentCharacterImageEl(imageEl, timeout = 1200) {
        if (!imageEl) return Promise.resolve('empty');
        const currentUrl = imageEl.currentSrc || imageEl.getAttribute('src') || '';
        if (!currentUrl) return Promise.resolve('empty');
        if (imageEl.complete) {
            return Promise.resolve(imageEl.naturalWidth > 0 ? 'loaded' : 'error');
        }

        return new Promise((resolve) => {
            let timeoutId = null;
            const finalize = (status) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }
                imageEl.removeEventListener('load', handleLoad);
                imageEl.removeEventListener('error', handleError);
                resolve(status);
            };

            const handleLoad = () => finalize('loaded');
            const handleError = () => finalize('error');

            imageEl.addEventListener('load', handleLoad, { once: true });
            imageEl.addEventListener('error', handleError, { once: true });
            timeoutId = window.setTimeout(() => finalize('timeout'), timeout);
        });
    }

    function preloadResidentCharacterUrl(url) {
        if (!url) return Promise.resolve('empty');

        const existingEntry = state.residentFigureImageCache.get(url);
        if (existingEntry) {
            return existingEntry.promise;
        }

        const preloadImage = new Image();
        const entry = {
            status: 'loading',
            promise: null
        };

        entry.promise = new Promise((resolve) => {
            const finalize = (status) => {
                preloadImage.onload = null;
                preloadImage.onerror = null;
                entry.status = status;
                if (status === 'error') {
                    state.residentFigureImageCache.delete(url);
                }
                resolve(status);
            };

            preloadImage.onload = () => finalize('loaded');
            preloadImage.onerror = () => finalize('error');
            preloadImage.src = url;
        });

        state.residentFigureImageCache.set(url, entry);
        return entry.promise;
    }

    async function prepareResidentCharacterLoop(config, figureEl) {
        const preloadToken = state.residentFigurePreloadToken;
        scheduleResidentCharacterLoop(config);

        const spriteImageEl = getResidentCharacterImageEl(figureEl);
        await waitForResidentCharacterImageEl(spriteImageEl);

        if (preloadToken !== state.residentFigurePreloadToken || state.residentFigureEl !== figureEl) {
            return;
        }

        const preloadQueue = [
            resolveResidentCharacterUrl(config, 'run-left'),
            resolveResidentCharacterUrl(config, 'run-right')
        ].filter((url, index, array) => Boolean(url) && array.indexOf(url) === index);

        for (const url of preloadQueue) {
            await preloadResidentCharacterUrl(url);
            if (preloadToken !== state.residentFigurePreloadToken || state.residentFigureEl !== figureEl) {
                return;
            }
        }
    }

    function updateResidentCharacterPose(config, pose) {
        const figureEl = state.residentFigureEl;
        if (!figureEl) return;

        const spriteEl = figureEl.querySelector('.resident-character-sprite');
        const imageEl = getResidentCharacterImageEl(figureEl);
        const nextUrl = resolveResidentCharacterUrl(config, pose);
        const isMovingPose = pose === 'run-left' || pose === 'run-right';

        figureEl.dataset.pose = pose;
        figureEl.classList.toggle('is-running', isMovingPose);
        figureEl.classList.toggle('is-idle', pose === 'idle');
        figureEl.classList.toggle('is-running-left', pose === 'run-left');
        figureEl.classList.toggle('is-running-right', pose === 'run-right');

        if (spriteEl) {
            spriteEl.classList.toggle('is-empty', !nextUrl);
        }

        if (!imageEl) return;

        if (nextUrl) {
            if (imageEl.getAttribute('src') !== nextUrl) {
                imageEl.setAttribute('src', nextUrl);
            }
            imageEl.dataset.pose = pose;
        } else {
            imageEl.removeAttribute('src');
            imageEl.dataset.pose = '';
        }

        imageEl.classList.toggle('is-empty', !nextUrl);
    }

    function scheduleResidentCharacterLoop(config) {
        const figureEl = state.residentFigureEl;
        if (!figureEl) return;

        updateResidentCharacterPose(config, 'idle');
        figureEl.style.transition = 'left 240ms ease-out, top 240ms ease-out';

        const idleDelay = randomInRange(5000, 9000);
        state.residentFigureLoopTimer = window.setTimeout(() => {
            const currentLeft = parseFloat(figureEl.dataset.left || figureEl.style.left) || 50;
            const currentTop = parseFloat(figureEl.dataset.top || figureEl.style.top) || 84;
            let direction = Math.random() < 0.5 ? 'left' : 'right';
            const deltaX = randomInRange(6, 14);

            if (direction === 'left' && currentLeft <= CONTACT_FIGURE_MIN_LEFT + 6) {
                direction = 'right';
            } else if (direction === 'right' && currentLeft >= CONTACT_FIGURE_MAX_LEFT - 6) {
                direction = 'left';
            }

            const nextLeft = clampResidentFigureValue(
                currentLeft + (direction === 'left' ? -deltaX : deltaX),
                CONTACT_FIGURE_MIN_LEFT,
                CONTACT_FIGURE_MAX_LEFT
            );
            const nextTop = clampResidentFigureValue(
                currentTop + randomInRange(-2, 2),
                CONTACT_FIGURE_MIN_TOP,
                CONTACT_FIGURE_MAX_TOP
            );
            const duration = Math.round(randomInRange(2800, 4800));

            updateResidentCharacterPose(config, direction === 'left' ? 'run-left' : 'run-right');
            figureEl.style.transition = `left ${duration}ms linear, top ${duration}ms linear`;
            figureEl.style.left = `${nextLeft}%`;
            figureEl.style.top = `${nextTop}%`;
            figureEl.dataset.left = String(nextLeft);
            figureEl.dataset.top = String(nextTop);
            figureEl.style.zIndex = String(Math.floor(nextTop));

            state.residentFigureMoveTimer = window.setTimeout(() => {
                scheduleResidentCharacterLoop(config);
            }, duration + 60);
        }, idleDelay);
    }

    function ensureResidentCharacterLayer() {
        if (!state.roomEl) return null;
        if (!state.residentLayerEl || !state.residentLayerEl.isConnected) {
            state.residentLayerEl = state.shadowRoot ? state.shadowRoot.getElementById('residentCharacterLayer') : null;
        }
        if (!state.residentLayerEl) {
            const layer = document.createElement('div');
            layer.id = 'residentCharacterLayer';
            layer.className = 'resident-character-layer';
            state.roomEl.appendChild(layer);
            state.residentLayerEl = layer;
        }
        return state.residentLayerEl;
    }

    function refreshActiveContactFigure(config = null) {
        const layerEl = ensureResidentCharacterLayer();
        if (!layerEl) return;

        clearResidentCharacterFigure();

        const activeConfig = sanitizeResidentCharacter(config || getContactFigureConfig(state.currentGardenContactId));
        const hasAnyFigure = Boolean(activeConfig.idleUrl || activeConfig.runLeftUrl || activeConfig.runRightUrl || activeConfig.petUrl || activeConfig.feedUrl);
        if (!hasAnyFigure || state.currentView !== 'home') {
            return;
        }

        const figureEl = document.createElement('div');
        const triggerEl = document.createElement('button');
        const startLeft = randomInRange(28, 72);
        const startTop = randomInRange(80, 88);
        figureEl.className = 'resident-character is-idle';
        figureEl.dataset.left = String(startLeft);
        figureEl.dataset.top = String(startTop);
        figureEl.style.left = `${startLeft}%`;
        figureEl.style.top = `${startTop}%`;
        figureEl.style.zIndex = String(Math.floor(startTop));
        figureEl.style.cursor = 'pointer';
        figureEl.innerHTML = `
            <div class="resident-character-shadow"></div>
            <div class="resident-character-sprite">
                <img class="resident-character-sprite-img" alt="resident pose" draggable="false" loading="eager" />
            </div>
        `;

        triggerEl.type = 'button';
        triggerEl.className = 'resident-character-trigger';
        triggerEl.setAttribute('aria-label', '打开联系人互动');
        triggerEl.style.left = `${startLeft}%`;
        triggerEl.style.top = `${startTop}%`;
        triggerEl.style.zIndex = String(Math.floor(startTop) + 1);
        triggerEl.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openResidentStatusCard();
        });

        layerEl.appendChild(figureEl);
        layerEl.appendChild(triggerEl);
        if (!layerEl.querySelector('[data-resident-ui-style="true"]')) {
            const styleEl = document.createElement('style');
            styleEl.dataset.residentUiStyle = 'true';
            styleEl.textContent = `
                .resident-character-trigger{position:absolute;transform:translate(-50%,-100%);width:88px;height:112px;border:none;background:transparent;pointer-events:auto;cursor:pointer;z-index:141;padding:0;margin:0;appearance:none;-webkit-appearance:none}
                .resident-status-card,.resident-feed-sheet,.resident-dispatch-sheet{position:absolute;transform:translate(-50%,-100%);z-index:140;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.96);box-shadow:0 12px 28px rgba(15,23,42,.18);min-width:170px;backdrop-filter:blur(10px);pointer-events:auto}
                .resident-status-card-title{font-size:13px;font-weight:700;color:#334155;margin-bottom:8px;text-align:center}.resident-status-row+.resident-status-row{margin-top:6px}.resident-status-meta{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:4px}.resident-status-track{height:7px;border-radius:999px;background:#e2e8f0;overflow:hidden}.resident-status-fill{height:100%;border-radius:999px}.resident-status-actions,.resident-feed-sheet,.resident-dispatch-sheet{display:flex;flex-direction:column;gap:6px}.resident-status-actions button,.resident-feed-sheet button,.resident-dispatch-sheet button{border:none;border-radius:12px;padding:8px 10px;background:#f8fafc;color:#334155;font-size:12px;font-weight:600;cursor:pointer}.resident-status-actions button:hover,.resident-feed-sheet button:hover,.resident-dispatch-sheet button:hover{background:#eef2ff}.resident-feed-sheet,.resident-dispatch-sheet{transform:translate(-50%,0);min-width:190px}.resident-feed-sheet.is-anchored-card,.resident-dispatch-sheet.is-anchored-card{transform:translateX(-50%)}.resident-assignment-badge{position:absolute;transform:translate(-50%,-100%);min-width:120px;border:none;border-radius:16px;padding:10px 12px;background:rgba(255,255,255,.96);box-shadow:0 12px 28px rgba(15,23,42,.16);pointer-events:auto;cursor:pointer;z-index:142;color:#334155}.resident-assignment-badge-title{font-size:12px;font-weight:700;color:#7c3aed}.resident-assignment-badge-copy{font-size:12px;margin-top:2px}.resident-assignment-badge-time{font-size:14px;font-weight:700;margin-top:4px}.garden-assignment-layer{position:absolute;inset:0;pointer-events:none;z-index:6;overflow:hidden}
            `;
            layerEl.appendChild(styleEl);
        }
        state.residentFigureEl = figureEl;
        state.residentFigureTriggerEl = triggerEl;
        completeResidentAssignment(state.currentGardenContactId);
        const contactState = settleGardenContactNeeds(state.currentGardenContactId);
        if (contactState.activeAssignment && contactState.activeAssignment.finishAt > Date.now()) {
            figureEl.style.display = 'none';
            triggerEl.style.display = 'none';
            scheduleResidentAssignmentAutoSettlement(state.currentGardenContactId);
        }
        updateResidentCharacterPose(activeConfig, 'idle');
        prepareResidentCharacterLoop(activeConfig, figureEl);
    }

    function changeTexture(target, background, bgSize = 'auto', bgColor = 'transparent') {
        const targetEl = target === 'wall' ? state.wallEl : state.floorEl;
        if (!targetEl) return;

        targetEl.style.background = background;
        targetEl.style.backgroundSize = bgSize;
        targetEl.style.backgroundColor = bgColor;
        persistGardenLayoutForContact();
        vibrate(20);
    }

    function showToast() {
        if (!state.toastEl) return;
        state.toastEl.classList.add('show');
        clearTimeout(state.toastTimeout);
        state.toastTimeout = setTimeout(() => {
            if (state.toastEl) state.toastEl.classList.remove('show');
        }, 2500);
    }

    function saveDesign() {
        if (state.currentView !== 'home' || !saveBtn || saveBtn.disabled) return;

        persistGardenLayoutForContact();

        const originalHTML = saveBtn.dataset.originalHtml || saveBtn.innerHTML;
        saveBtn.dataset.originalHtml = originalHTML;
        clearTimeout(state.saveResetTimer);
        clearTimeout(state.saveDoneTimer);
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>保存中...</span>';

        state.saveResetTimer = setTimeout(() => {
            saveBtn.innerHTML = '<i class="fas fa-circle-check"></i><span>保存成功</span>';
            saveBtn.classList.add('is-saved');
            state.saveDoneTimer = setTimeout(() => {
                saveBtn.innerHTML = originalHTML;
                saveBtn.classList.remove('is-saved');
            }, 1500);
        }, 800);
    }

    function setDrawerOpen(open) {
        state.drawerOpen = Boolean(open) && state.currentView === 'home';
        if (state.drawerEl) {
            state.drawerEl.classList.toggle('is-open', state.drawerOpen);
        }
        if (togglePanelBtn) {
            togglePanelBtn.classList.toggle('is-active', state.drawerOpen);
        }
    }

    function switchView(viewKey) {
        state.currentView = viewKey;
        setHomeEntryMenuOpen(false);
        setRogueProgressPanelOpen(false);
        syncHomeTutorialVisibility();
        if (viewKey !== 'gallery') {
            closeStorageSellSheet();
        }
        if (viewKey !== 'home') {
            closeFarmScreen({ silent: true });
            closePastureScreen({ silent: true });
            closeKitchenScreen({ silent: true });
        }
        viewEls.forEach((viewEl) => {
            viewEl.classList.toggle('active', viewEl.dataset.gardenView === viewKey);
        });
        navBtns.forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.gardenView === viewKey);
        });
        if (screenEl) {
            screenEl.classList.toggle('is-activities-view', viewKey === 'activities');
            screenEl.classList.toggle('is-storage-view', viewKey === 'gallery');
        }

        const isHome = viewKey === 'home';
        if (togglePanelBtn) togglePanelBtn.disabled = !isHome;
        if (saveBtn) saveBtn.disabled = !isHome;
        if (!isHome) {
            setDrawerOpen(false);
            closePetAdoptionOverlay();
            closePetCareOverlay();
            closeFloraScreen();
            clearResidentCharacterFigure();
            return;
        }

        syncHomeEntryMenuSelection();
        refreshActiveContactFigure();
    }

    function syncFloraFromEngine() {
        const snapshot = window.FloraEngine && typeof window.FloraEngine.init === 'function'
            ? window.FloraEngine.init()
            : null;
        const stateKey = snapshot && snapshot.state ? snapshot.state : state.floraState;
        setFloraState(stateKey);
    }

    function handleFloraStateEvent(event) {
        const detail = event && event.detail ? event.detail : null;
        const stateKey = detail && detail.snapshot && detail.snapshot.state
            ? detail.snapshot.state
            : (detail && detail.state ? detail.state : null);
        if (!stateKey) return;
        setFloraState(stateKey);
    }

    function handleFloraContactEvent(event) {
        const detail = event && event.detail ? event.detail : null;
        const contactId = detail && detail.contactId ? String(detail.contactId) : resolveGardenContactId();
        if (state.currentGardenContactId && state.currentGardenContactId !== contactId) {
            persistGardenLayoutForContact(state.currentGardenContactId);
        }
        restoreGardenLayoutForContact(contactId);
        const stateKey = detail && detail.snapshot && detail.snapshot.state ? detail.snapshot.state : null;
        if (!stateKey) {
            syncFloraFromEngine();
            return;
        }
        setFloraState(stateKey);
    }

    function renderFloraParticles(particles) {
        return particles.map((particle) => `
            <div class="garden-flora-particle" style="left: ${particle.left}; animation-delay: ${particle.delay};">${particle.label}</div>
        `).join('');
    }

    function syncPortalPlantState(stateKey) {
        if (!state.roomEl) return;
        const portalPlant = state.roomEl.querySelector('.shape-flora-portal');
        if (!portalPlant) return;
        portalPlant.className = `shape-flora-portal flora-portal-state-${stateKey}`;
        const particles = portalPlant.querySelector('.flora-portal-particle-system');
        if (particles) {
            particles.style.opacity = stateKey === 'withering' || stateKey === 'withered' ? '0' : '1';
        }
    }

    function setFloraState(stateKey) {
        const nextStateKey = FLORA_STATES[stateKey] ? stateKey : 'healthy';
        state.floraState = nextStateKey;

        floraToggleBtns.forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.floraState === nextStateKey);
            btn.disabled = true;
            btn.setAttribute('aria-disabled', 'true');
        });
        syncPortalPlantState(nextStateKey);
    }

    function openFloraScreen() {
        if (!floraScreenEl || state.currentView !== 'home') return;
        setDrawerOpen(false);
        syncFloraFromEngine();
        state.floraOpen = true;
        floraScreenEl.classList.add('is-open');
        floraScreenEl.setAttribute('aria-hidden', 'false');
        vibrate(15);
    }

    function closeFloraScreen() {
        if (!floraScreenEl) return;
        state.floraOpen = false;
        floraScreenEl.classList.remove('is-open');
        floraScreenEl.setAttribute('aria-hidden', 'true');
    }

    function openApp() {
        init();
        if (!screenEl) return;
        state.casualGardenGame = loadGardenGameState('casual');
        state.rogueMetaV2 = loadRogueMetaStateV2();
        state.rogueRunV2 = loadRogueRunStateV2();
        setGardenMode('casual');
        saveGardenGameState();
        renderRogueUiV2();
        refreshGardenEconomyUi();
        syncHomeTutorialVisibility();
        renderFarmPlots();
        renderPastureAnimals();
        syncGardenTitle();
        syncGardenLayoutFromActiveContact();
        closeFarmScreen({ silent: true });
        closePastureScreen({ silent: true });
        closeKitchenScreen({ silent: true });
        switchView('home');
        scheduleResidentAssignmentAutoSettlement(state.currentGardenContactId);
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closeFloraScreen();
        syncFloraFromEngine();
        screenEl.classList.remove('hidden');
    }

    function closeApp() {
        if (!screenEl) return;
        persistGardenLayoutForContact();
        closeFarmScreen({ silent: true });
        closePastureScreen({ silent: true });
        closeKitchenScreen({ silent: true });
        closeStorageSellSheet();
        setRogueProgressPanelOpen(false);
        setHomeEntryMenuOpen(false);
        setDrawerOpen(false);
        closePetAdoptionOverlay();
        closePetCareOverlay();
        closeFloraScreen();
        closeContactFigureModal();
        clearResidentCharacterFigure();
        screenEl.classList.add('hidden');
    }

    function vibrate(duration) {
        if (navigator.vibrate) navigator.vibrate(duration);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    window.GardenApp = {
        openApp,
        closeApp,
        openFarmScreen,
        closeFarmScreen,
        openPastureScreen,
        closePastureScreen,
        openKitchenScreen,
        closeKitchenScreen,
        openActivitiesView,
        openWhisperChallengeFromActivities,
        openContactFigureSettings,
        getContactFigureConfig,
        setContactFigureConfig,
        refreshActiveContactFigure
    };
})();

