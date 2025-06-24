// Game state variables
let currentPlayer = "Cao Cao";
let currentTurn = { year: 189, season: "Spring" };
const seasons = ["Spring", "Summer", "Autumn", "Winter"];
let turnSummary = [];
let discoveredCharacters = new Set();
let provinceDistances = [];
let advisor = null;
let characterSortOrder = 'name';
let selectedProvince = null;
let currentDialog = null;

// Canvas and context
let canvas, ctx;
let camera = {
    x: 400,
    y: 300,
    scale: 1,
    targetScale: 1
};

// Task types
const taskTypes = [
    { id: 'develop', name: 'Agriculture', stat: 'Politics' },
    { id: 'commerce', name: 'Commerce', stat: 'Politics' },
    { id: 'fortify', name: 'Fortify', stat: 'Leadership' },
    { id: 'recruit', name: 'Recruit Soldiers', stat: 'Leadership' },
    { id: 'search', name: 'Talent Search', stat: 'Charm' }
];

// Initialize characters with IDs
const characters = [
    // Cao Cao's forces
    new Character("cao_cao", "Cao Cao", 72, 91, 94, 96, 91, 100, "Cao Cao"),
    new Character("xiahou_dun", "Xiahou Dun", 90, 82, 58, 72, 63, 95, "Cao Cao"),
    new Character("xiahou_yuan", "Xiahou Yuan", 88, 85, 52, 65, 58, 93, "Cao Cao"),
    new Character("cao_ren", "Cao Ren", 82, 88, 61, 68, 69, 92, "Cao Cao"),
    new Character("xun_yu", "Xun Yu", 25, 78, 95, 82, 96, 88, "Cao Cao"),
    new Character("guo_jia", "Guo Jia", 19, 72, 98, 85, 97, 82, "Cao Cao"),
    
    // Liu Bei's forces
    new Character("liu_bei", "Liu Bei", 68, 77, 75, 99, 75, 100, "Liu Bei"),
    new Character("guan_yu", "Guan Yu", 97, 95, 75, 92, 76, 98, "Liu Bei"),
    new Character("zhang_fei", "Zhang Fei", 99, 78, 30, 42, 22, 97, "Liu Bei"),
    new Character("jian_yong", "Jian Yong", 35, 65, 82, 78, 80, 85, "Liu Bei"),
    
    // Sun Jian's forces
    new Character("sun_jian", "Sun Jian", 92, 87, 68, 82, 70, 100, "Sun Jian"),
    new Character("huang_gai", "Huang Gai", 86, 82, 58, 65, 66, 93, "Sun Jian"),
    new Character("cheng_pu", "Cheng Pu", 84, 85, 72, 70, 73, 91, "Sun Jian"),
    new Character("han_dang", "Han Dang", 85, 81, 62, 68, 65, 89, "Sun Jian"),
    
    // Dong Zhuo's forces
    new Character("dong_zhuo", "Dong Zhuo", 88, 75, 42, 32, 45, 100, "Dong Zhuo"),
    new Character("lu_bu", "Lu Bu", 100, 70, 26, 48, 26, 62, "Dong Zhuo"),
    new Character("li_ru", "Li Ru", 42, 82, 88, 75, 93, 75, "Dong Zhuo"),
    
    // Yuan Shao's forces
    new Character("yuan_shao", "Yuan Shao", 65, 78, 75, 85, 70, 100, "Yuan Shao"),
    new Character("yan_liang", "Yan Liang", 93, 74, 38, 52, 35, 88, "Yuan Shao"),
    new Character("wen_chou", "Wen Chou", 92, 72, 35, 48, 32, 86, "Yuan Shao"),
    
    // Free characters
    new Character("zhao_yun", "Zhao Yun", 96, 91, 76, 81, 80, 50),
    new Character("zhuge_liang", "Zhuge Liang", 38, 92, 100, 93, 100, 50),
    new Character("sima_yi", "Sima Yi", 63, 87, 98, 87, 96, 50),
    new Character("zhou_yu", "Zhou Yu", 71, 86, 97, 96, 96, 50),
    new Character("xu_shu", "Xu Shu", 57, 84, 95, 88, 89, 50),
    new Character("pang_tong", "Pang Tong", 45, 82, 98, 89, 92, 50),
    new Character("jiang_wei", "Jiang Wei", 89, 89, 87, 82, 85, 50),
    new Character("ma_chao", "Ma Chao", 95, 86, 44, 85, 62, 50),
    new Character("huang_zhong", "Huang Zhong", 94, 87, 62, 68, 70, 50),
    new Character("wei_yan", "Wei Yan", 92, 82, 45, 62, 58, 50),
    new Character("deng_ai", "Deng Ai", 87, 89, 94, 72, 88, 50),
    new Character("zhang_liao", "Zhang Liao", 92, 90, 72, 78, 82, 50),
    new Character("gan_ning", "Gan Ning", 94, 83, 45, 76, 68, 50),
    new Character("taishi_ci", "Taishi Ci", 95, 81, 66, 73, 75, 50),
    new Character("yu_jin", "Yu Jin", 78, 88, 69, 62, 74, 50)
];

// Initialize provinces
const provinces = [
    new Province(1, "Youzhou", 500, 80, [2, 4], "Yuan Shao"),
    new Province(2, "Jizhou", 420, 120, [1, 3, 4, 6], "Yuan Shao"),
    new Province(3, "Bingzhou", 300, 100, [2, 5, 6, 16], "Independent"),
    new Province(4, "Qingzhou", 520, 200, [1, 2, 7], "Independent"),
    new Province(7, "Xuzhou", 480, 280, [4, 6, 9, 11], "Independent"),
    new Province(5, "Yongzhou", 220, 180, [3, 8, 16], "Dong Zhuo"),
    new Province(6, "Yanzhou", 380, 220, [2, 3, 7, 8, 9], "Cao Cao"),
    new Province(8, "Luoyang", 280, 250, [5, 6, 9, 10], "Dong Zhuo"),
    new Province(9, "Yuzhou", 380, 300, [6, 7, 8, 10, 11], "Cao Cao"),
    new Province(10, "Jingzhou", 300, 360, [8, 9, 11, 12, 13, 17], "Liu Bei"),
    new Province(11, "Yangzhou", 440, 360, [7, 9, 10, 14, 17], "Sun Jian"),
    new Province(14, "Jianye", 500, 420, [11, 15], "Sun Jian"),
    new Province(12, "Yizhou", 180, 400, [10, 13], "Independent"),
    new Province(13, "Hanzhong", 240, 320, [10, 12], "Independent"),
    new Province(15, "Jiaozhou", 420, 480, [14, 17], "Independent"),
    new Province(16, "Liangzhou", 150, 250, [3, 5], "Independent"),
    new Province(17, "Jiangxia", 360, 400, [10, 11, 15], "Liu Bei")
];