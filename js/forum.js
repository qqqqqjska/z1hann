// 仿 Instagram 论坛应用逻辑 (UI Update)

(function() {
    function formatCount(num) {
        if (num === undefined || num === null) return '0';
        let n = Number(num);
        if (isNaN(n)) return String(num);
        if (n >= 10000) return (Math.floor(n / 1000) / 10) + 'w';
        if (n >= 1000) return (Math.floor(n / 100) / 10) + 'k';
        return n.toLocaleString();
    }

    // Unified Gift Configuration
    const FORUM_GIFTS = [
        { name: '玫瑰', emoji: '🌹', value: 10, color: '#ff2d55' },
        { name: '棒棒糖', emoji: '🍭', value: 20, color: '#ff9500' },
        { name: '皇冠', emoji: '👑', value: 50, color: '#ffd60a' },
        { name: '火箭', emoji: '🚀', value: 100, color: '#0a84ff' },
        { name: '钻石', emoji: '💎', value: 200, color: '#5ac8fa' },
        { name: '爱心', emoji: '💖', value: 30, color: '#ff375f' }
    ];

    const forumState = {
        activeTab: 'home', // home, video, share, search, profile, forum_wallet
        multiSelectMode: false,
        selectedPostIds: new Set(),
        stories: [
            { id: 1, name: '你的便签', avatar: '', isMe: true, isNote: true }, // Added isNote for DM page
            { id: 2, name: 'dearfriends80', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dearfriends80', hasStory: true },
            { id: 3, name: 'starbucks_j', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=starbucks_j', hasStory: true },
            { id: 4, name: 'tokyofm', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tokyofm', hasStory: true }
        ],
        posts: JSON.parse(localStorage.getItem('forum_posts')) || [
            {
                id: 1,
                user: {
                    name: 'dearfriends80',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dearfriends80',
                    verified: false,
                    subtitle: 'Tokyo Fm'
                },
                image: 'https://placehold.co/600x600/eee/333?text=Radio+Show', // Placeholder
                stats: {
                    likes: 2607,
                    comments: 7,
                    forwards: 42,
                    shares: 68,
                    sends: 18
                },
                caption: '2/11(水)・祝... 展开',
                time: '1天前',
                translation: '查看翻译',
                liked: false
            },
            {
                id: 2,
                user: {
                    name: 'starbucks_j',
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=starbucks_j',
                    verified: true,
                    subtitle: '为你推荐'
                },
                image: 'https://placehold.co/600x400/pink/white?text=Sakura',
                stats: {
                    likes: 1240,
                    comments: 45,
                    forwards: 15,
                    shares: 12,
                    sends: 5
                },
                caption: 'Sakura Season is here! 🌸',
                time: '2小时前',
                translation: '查看翻译',
                liked: false
            }
        ],
        currentUser: JSON.parse(localStorage.getItem('forum_currentUser')) || {
            username: 'kdksiehdb', // Updated from screenshot
            name: 'Me',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
            posts: 0,
            followers: 0,
            following: 1,
            bio: 'z', // This is acting as the Name 'z'
            signature: '1', // New signature field
            completion: 3 // 3/4 completed
        },
        settings: JSON.parse(localStorage.getItem('forum_settings')) || {
            linkedContacts: [],
            linkedWorldbook: null,
            forumWorldview: ''
        },
        liveStreams: JSON.parse(localStorage.getItem('forum_liveStreams')) || null,
        profileActiveTab: 'posts', // 'posts' or 'tagged'
        otherProfileActiveTab: 'posts',
        profileMultiSelectMode: false,
        profileSelectedPostIds: new Set(),
        activeChatUser: null, // For chat page
        viewingUser: null, // For other user profile
        replyingToCommentId: null, // For comment replies
        replyingToUsername: null,
        isGeneratingReply: false,
        commentMultiSelectMode: false,
        selectedCommentIds: new Set(),
        expandedCommentReplyIds: new Set(),
        messages: JSON.parse(localStorage.getItem('forum_messages')) || [],
        dmMultiSelectMode: false,
        selectedDmIds: new Set(),
        chatHistory: JSON.parse(localStorage.getItem('forum_chatHistory')) || {},
        dmNotes: [
             { id: 1, name: '你的便签', avatar: '', isMe: true, note: '分享便签', subtext: '位置共享已关闭' },
             { id: 2, name: '地图', avatar: 'https://placehold.co/100x100/87CEEB/ffffff?text=Map', isMap: true, note: '全新' }
        ],
        liveWallpapers: JSON.parse(localStorage.getItem('forum_liveWallpapers')) || [],
        currentLiveWallpaper: localStorage.getItem('forum_currentLiveWallpaper') || '',
        forumWallet: (() => {
            const raw = JSON.parse(localStorage.getItem('forum_wallet_state') || 'null');
            return {
                initialized: !!(raw && raw.initialized),
                balance: raw && Number.isFinite(Number(raw.balance)) ? Number(raw.balance) : 0,
                transactions: raw && Array.isArray(raw.transactions) ? raw.transactions : [],
                isGenerating: false,
                source: raw && raw.source ? raw.source : 'none',
                generatedAt: raw && raw.generatedAt ? raw.generatedAt : null
            };
        })()
    };

    function initForum() {
        const app = document.getElementById('forum-app');
        if (!app) return;

        // Sync current user with global state if available
        // if (window.iphoneSimState && window.iphoneSimState.userProfile) {
        //     forumState.currentUser.avatar = window.iphoneSimState.userProfile.avatar;
        //     // forumState.currentUser.name = window.iphoneSimState.userProfile.name; // Keep internal name logic or override
        // }

        // Helper to save live room state
        function saveLiveRoomState() {
            if (!forumState.currentLiveRoom) return;
            const roomKey = `forum_live_state_${forumState.currentLiveRoom.host}`;
            const state = {
                actionDesc: forumState.currentLiveRoom.actionDesc,
                comments: forumState.currentLiveRoom.comments,
                timestamp: Date.now()
            };
            localStorage.setItem(roomKey, JSON.stringify(state));
        }

        // Helper to update leaderboard
        function updateLeaderboard(hostName, valueToAdd, hostAvatar = '') {
            let lb = JSON.parse(localStorage.getItem('forum_leaderboard') || '{"hosts":[]}');
            if (!Array.isArray(lb.hosts)) lb.hosts = [];
            const delta = Number(valueToAdd) || 0;
            let host = lb.hosts.find(h => h.name === hostName);
            
            if (host) {
                host.totalValue = (Number(host.totalValue) || 0) + delta;
                if (hostAvatar) host.avatar = hostAvatar; // Update avatar if provided
            } else {
                lb.hosts.push({ 
                    name: hostName, 
                    avatar: hostAvatar || resolveLeaderboardAvatarByHost(hostName), 
                    totalValue: delta
                });
            }
            
            // Sort by value desc
            lb.hosts.sort((a, b) => (Number(b.totalValue) || 0) - (Number(a.totalValue) || 0));
            
            localStorage.setItem('forum_leaderboard', JSON.stringify(lb));

            // Broadcast rank change in host mode so viewers know current ranking.
            if (forumState.currentLiveRoom && forumState.currentLiveRoom.mode === 'host' && forumState.currentLiveRoom.host === hostName) {
                const rank = Math.max(1, lb.hosts.findIndex(h => h.name === hostName) + 1);
                if (rank > 0 && forumState.currentLiveRoom.lastAnnouncedRank !== rank) {
                    forumState.currentLiveRoom.lastAnnouncedRank = rank;
                    if (typeof window.appendForumLiveMessage === 'function') {
                        window.appendForumLiveMessage(
                            `<span style="color:#ffd60a;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.92);">冲榜实时排名：NO.${rank}</span>`
                        );
                    }
                }
            }

            // Keep leaderboard overlay and rank badge in sync in real-time.
            const overlay = document.getElementById('forum-leaderboard-overlay');
            if (overlay && overlay.classList.contains('active') && typeof window.renderLeaderboardOverlay === 'function') {
                window.renderLeaderboardOverlay();
            }
        }

        // Helper to post a new forum entry programmatically
        window.addForumPost = function(contactId, caption, images = []) {
            const authorProfile = resolveForumAuthorProfile(contactId);
            const user = authorProfile.user;
            const followers = authorProfile.followers;

            let likes = 0, commentsCount = 0, forwards = 0, shares = 0;
            if (followers > 0) {
                const likeRate = 0.05 + Math.random() * 0.1;
                likes = Math.max(0, Math.floor(followers * likeRate));
                const commentRate = 0.005 + Math.random() * 0.015;
                commentsCount = Math.max(0, Math.floor(followers * commentRate));
                const shareRate = 0.001 + Math.random() * 0.009;
                forwards = Math.max(0, Math.floor(followers * shareRate));
                shares = Math.max(0, Math.floor(followers * shareRate));
            }

            const newPost = {
                id: Date.now(),
                user,
                images: (images && images.length > 0) ? [...images] : [],
                image: (images && images.length > 0) ? images[0] : null,
                caption: caption || '',
                time: '刚刚',
                stats: { likes, comments: commentsCount, forwards, shares, sends: shares },
                comments_list: [],
                userId: contactId || null
            };
            forumState.posts.unshift(newPost);
            saveForumData();
            forumState.activeTab = 'home';
            renderForum();
            generateCommentsForPost(newPost);
            generateStrangerDMs(newPost);
            if (contactId) {
                window.syncForumEventToChat(contactId, `[发布了论坛帖子]: "${caption}"`);
            }
        };

        // sync forum events to chat history for a contact
        // `role` defaults to 'system' but can be overridden (e.g. 'user')
        // `msgType` can be 'text' or 'system_event' (hidden in UI but kept in context)
        window.syncForumEventToChat = function(contactId, text, role = 'system', msgType = 'text') {
            if (!contactId) return;
            if (!isWechatSyncEnabled(contactId)) return;
            if (!window.iphoneSimState.chatHistory) window.iphoneSimState.chatHistory = {};
            if (!window.iphoneSimState.chatHistory[contactId]) window.iphoneSimState.chatHistory[contactId] = [];
            window.iphoneSimState.chatHistory[contactId].push({ role: role, type: msgType, content: text, time: Date.now() });
            if (window.saveConfig) saveConfig();
        };

        function getContactProfile(contactId) {
            const profiles = (forumState.settings && forumState.settings.contactProfiles) ? forumState.settings.contactProfiles : {};
            return profiles[contactId] || {};
        }

        function resolveForumAuthorProfile(contactId) {
            if (!contactId) {
                return {
                    user: { ...forumState.currentUser, name: forumState.currentUser.bio || forumState.currentUser.username },
                    followers: Number(forumState.currentUser.followers || 0) || 0
                };
            }

            const contact = (window.iphoneSimState && Array.isArray(window.iphoneSimState.contacts))
                ? window.iphoneSimState.contacts.find(c => String(c.id) === String(contactId))
                : null;
            const profile = getContactProfile(contactId) || {};
            const contactName = profile.name || (contact ? (contact.remark || contact.name) : '') || '联系人';
            const avatarSeed = profile.username || contactName || String(contactId);

            return {
                user: {
                    id: contact ? contact.id : contactId,
                    name: contactName,
                    avatar: profile.avatar || (contact && contact.avatar) || `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(String(avatarSeed))}`,
                    verified: !!profile.verified,
                    subtitle: profile.identity || '',
                    bio: profile.bio || '',
                    username: profile.username || String(contactId)
                },
                followers: Number(profile.followers || 0) || 0
            };
        }

        function isWechatSyncEnabled(contactId) {
            if (!contactId) return false;
            const profile = getContactProfile(contactId);
            return !!profile.syncWechat;
        }

        function resolveLiveContactByHost(hostName) {
            const contacts = (window.iphoneSimState && window.iphoneSimState.contacts) ? window.iphoneSimState.contacts : [];
            const profiles = (forumState.settings && forumState.settings.contactProfiles) ? forumState.settings.contactProfiles : {};
            const match = contacts.find(c => {
                const p = profiles[c.id] || {};
                return c.remark === hostName || c.name === hostName || p.name === hostName;
            });
            if (!match) return null;
            return { contactId: match.id, contact: match, profile: profiles[match.id] || {} };
        }

        function resolveLeaderboardAvatarByHost(hostName) {
            const resolved = resolveLiveContactByHost(hostName);
            if (!resolved) return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(hostName)}`;
            const linkedIds = (forumState.settings && forumState.settings.linkedContacts) ? forumState.settings.linkedContacts : [];
            const isLinked = linkedIds.includes(resolved.contactId);
            if (isLinked && resolved.profile && resolved.profile.avatar) return resolved.profile.avatar;
            if (resolved.contact && resolved.contact.avatar) return resolved.contact.avatar;
            return `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(hostName)}`;
        }

        function getCurrentUserLiveAvatar() {
            return (forumState.currentUser && forumState.currentUser.avatar) ||
                (window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.avatar) ||
                `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent((forumState.currentUser && (forumState.currentUser.bio || forumState.currentUser.username)) || 'me')}`;
        }

        function maybeSyncLiveEventToChat(room, text, role = 'system', msgType = 'live_sync_hidden') {
            if (!room || !text) return;
            let targetId = room.userId || null;
            if (!targetId) {
                const resolved = resolveLiveContactByHost(room.host);
                if (resolved) targetId = resolved.contactId;
            }
            if (!targetId || !isWechatSyncEnabled(targetId)) return;
            const syncType = (msgType === 'system_event') ? 'live_sync_hidden' : (msgType || 'live_sync_hidden');
            window.syncForumEventToChat(targetId, text, role, syncType);
        }

        function maybePushLiveDmFromActionDesc(room, actionDesc) {
            if (!room || !actionDesc || typeof actionDesc !== 'string') return;
            const hit = /(给你发消息|给我发消息|私信你|私信我|在微信上发了消息|发来消息)/.test(actionDesc);
            if (!hit) return;

            let targetId = room.userId || null;
            if (!targetId) {
                const resolved = resolveLiveContactByHost(room.host);
                if (resolved) targetId = resolved.contactId;
            }
            if (!targetId || !isWechatSyncEnabled(targetId)) return;

            const shortText = actionDesc.length > 48 ? actionDesc.slice(0, 48) + '…' : actionDesc;
            if (typeof window.sendMessage === 'function') {
                window.sendMessage(`[直播间私信] ${shortText}`, false, 'live_sync_hidden', null, targetId);
            } else {
                window.syncForumEventToChat(targetId, `[直播间私信] ${shortText}`, 'assistant', 'live_sync_hidden');
            }
        }

        function createEmptyPkState() {
            return {
                enabled: false,
                mode: 'pk',
                phase: 'idle',
                inviteTargetName: '',
                opponent: { name: '', avatar: '', contactId: null, isLinked: false },
                leftActionDesc: '',
                rightActionDesc: '',
                leftGiftValue: 0,
                rightGiftValue: 0,
                leftTotalGiftValue: 0,
                rightTotalGiftValue: 0,
                timerSec: 0,
                timerHandle: null,
                timerPaused: false,
                pauseReason: '',
                autoStartOnPreEnd: true,
                addTimeUsed: { pre: 0, post: 0 },
                winner: null
            };
        }

        function getLeaderboardGiftValueByHost(hostName) {
            if (!hostName) return 0;
            try {
                const lb = JSON.parse(localStorage.getItem('forum_leaderboard') || '{"hosts":[]}');
                const hosts = Array.isArray(lb.hosts) ? lb.hosts : [];
                const hit = hosts.find(h => h && h.name === hostName);
                return Math.max(0, Number(hit && hit.totalValue) || 0);
            } catch (e) {
                return 0;
            }
        }

        function clearPkTimer(room) {
            if (!room || !room.pk) return;
            if (room.pk.timerHandle) {
                clearInterval(room.pk.timerHandle);
                room.pk.timerHandle = null;
            }
        }

        function formatPkTimer(seconds) {
            const sec = Math.max(0, Number(seconds) || 0);
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }

        function getPkSideTag(side) {
            if (side === 'left') return '[我方]';
            if (side === 'right') return '[对方]';
            return '[系统]';
        }

        function resolveOpponentSenderName(eventUsername, room) {
            const fixedName = room && room.pk && room.pk.opponent && room.pk.opponent.name ? String(room.pk.opponent.name).trim() : '';
            if (fixedName) return fixedName;
            const fallback = String(eventUsername || '').trim();
            return fallback || '对方主播';
        }

        function resolvePkInviteTarget(hostName) {
            const resolved = resolveLiveContactByHost(hostName);
            if (!resolved) {
                return {
                    name: hostName,
                    avatar: resolveLeaderboardAvatarByHost(hostName),
                    contactId: null,
                    profile: {},
                    isLinked: false
                };
            }
            const linkedIds = (forumState.settings && forumState.settings.linkedContacts) ? forumState.settings.linkedContacts : [];
            const isLinked = linkedIds.includes(resolved.contactId);
            const avatar = (isLinked && resolved.profile && resolved.profile.avatar)
                ? resolved.profile.avatar
                : (resolved.contact && resolved.contact.avatar)
                    ? resolved.contact.avatar
                    : resolveLeaderboardAvatarByHost(hostName);
            return {
                name: hostName,
                avatar,
                contactId: resolved.contactId,
                profile: resolved.profile || {},
                contact: resolved.contact || null,
                isLinked
            };
        }

        function getPkSyncContactId(room) {
            if (!room || !room.pk || !room.pk.enabled) return null;
            const id = room.pk.opponent && room.pk.opponent.contactId ? room.pk.opponent.contactId : null;
            if (!id) return null;
            return isWechatSyncEnabled(id) ? id : null;
        }

        function syncPkEvent(room, text, role = 'system', msgType = 'live_sync_hidden') {
            const contactId = getPkSyncContactId(room);
            if (!contactId || !text) return;
            window.syncForumEventToChat(contactId, text, role, 'live_sync_hidden');
        }

        function buildPkProgressWidths(pk) {
            if (pk && (pk.phase === 'pre_pk' || pk.mode === 'chat')) return { leftPct: 50, rightPct: 50 };
            const left = Math.max(0, Number(pk && pk.leftGiftValue) || 0);
            const right = Math.max(0, Number(pk && pk.rightGiftValue) || 0);
            const total = left + right;
            if (total <= 0) return { leftPct: 50, rightPct: 50 };
            const leftPct = Math.max(0, Math.min(100, (left / total) * 100));
            const rightPct = 100 - leftPct;
            return { leftPct, rightPct };
        }

        window.renderPkPanel = function() {
            const room = forumState.currentLiveRoom;
            const panel = document.getElementById('forum-pk-panel');
            const descContainer = document.querySelector('.forum-room-desc-container');
            if (!room || !panel || !room.pk || !room.pk.enabled) {
                if (panel) panel.style.display = 'none';
                if (descContainer) descContainer.classList.remove('pk-mode');
                return;
            }
            const pk = room.pk;
            const progress = buildPkProgressWidths(pk);
            const phaseMap = {
                pre_pk: 'PK预备',
                pk_running: 'PK进行中',
                post_pk: 'PK后互动'
            };
            const isChatMode = pk.mode === 'chat';
            const showStart = pk.phase === 'pre_pk';
            const canAddTime = pk.phase === 'pre_pk' || pk.phase === 'post_pk';
            const addTimeCount = pk.phase === 'post_pk' ? pk.addTimeUsed.post : pk.addTimeUsed.pre;
            const leftAvatar = getCurrentUserLiveAvatar();
            const rightAvatar = pk.opponent.avatar || resolveLeaderboardAvatarByHost(pk.opponent.name || 'opponent');

            panel.style.display = 'block';
            panel.classList.toggle('mode-chat', isChatMode);
            panel.innerHTML = `
                <div class="forum-pk-mode-switch">
                    <button class="forum-pk-mode-btn ${isChatMode ? '' : 'active'}" onclick="window.switchPkMode('pk')">PK模式</button>
                    <button class="forum-pk-mode-btn ${isChatMode ? 'active' : ''}" onclick="window.switchPkMode('chat')">闲聊模式</button>
                    <button class="forum-pk-mode-btn danger" onclick="window.exitPkLinkSession()">退出连线</button>
                </div>
                <div class="forum-pk-hosts-row">
                    <div class="forum-pk-host forum-pk-host-left">
                        <img src="${leftAvatar}" alt="left">
                        <div class="forum-pk-host-meta">
                            <div class="forum-pk-host-name">${room.host || '我方主播'}</div>
                            <div class="forum-pk-gift-value">¥${formatWalletAmount(pk.leftGiftValue || 0)}</div>
                        </div>
                    </div>
                    <div class="forum-pk-phase-wrap">
                        ${isChatMode ? '' : `<div class="forum-pk-phase">${phaseMap[pk.phase] || 'PK'}</div>`}
                        ${isChatMode ? '' : `<div class="forum-pk-timer">${formatPkTimer(pk.timerSec)}</div>`}
                    </div>
                    <div class="forum-pk-host forum-pk-host-right">
                        <div class="forum-pk-host-meta forum-pk-host-meta-right">
                            <div class="forum-pk-host-name">${pk.opponent.name || '对方主播'}</div>
                            <div class="forum-pk-gift-value">¥${formatWalletAmount(pk.rightGiftValue || 0)}</div>
                        </div>
                        <img src="${rightAvatar}" alt="right">
                    </div>
                </div>
                ${isChatMode ? '' : `
                    <div class="forum-pk-progress">
                        <div class="forum-pk-progress-left" style="width:${progress.leftPct}%;"></div>
                        <div class="forum-pk-progress-right" style="width:${progress.rightPct}%;"></div>
                    </div>
                    <div class="forum-pk-actions">
                        ${showStart ? '<button class="forum-pk-btn" onclick="window.startPkBattle()">开始PK</button>' : ''}
                        ${canAddTime ? '<button class="forum-pk-btn ghost" onclick="window.extendPkTime()">加时 +30s</button>' : ''}
                        <button class="forum-pk-btn ghost" onclick="window.togglePkTimerPause()">${pk.timerPaused ? '继续计时' : '暂停计时'}</button>
                    </div>
                `}
            `;
        };

        window.switchPkMode = function(mode) {
            const room = forumState.currentLiveRoom;
            if (!room || !room.pk || !room.pk.enabled) return;
            const nextMode = mode === 'chat' ? 'chat' : 'pk';
            if (room.pk.mode === nextMode) return;
            room.pk.mode = nextMode;
            window.appendForumLiveMessage(
                `<span style="color:#ffd60a;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.92);">已切换到${nextMode === 'chat' ? '闲聊模式' : 'PK模式'}。</span>`
            );
            syncPkEvent(room, `[PK模式] ${nextMode}`, 'system', 'system_event');
            window.renderPkPanel();
        };

        async function summarizeLiveLinkSession(room, contactId) {
            if (!room || !room.pk || !room.pk.enabled || !contactId) return;
            const settings = getLiveAiSettings();
            const modeLabel = room.pk.mode === 'chat' ? '闲聊模式' : 'PK模式';
            const rawTimeline = [
                `模式:${modeLabel}`,
                `我方礼物值:¥${formatWalletAmount(room.pk.leftGiftValue || 0)}`,
                `对方礼物值:¥${formatWalletAmount(room.pk.rightGiftValue || 0)}`,
                `我方画面:${String(room.pk.leftActionDesc || room.actionDesc || '').trim() || '(无)'}`,
                `对方画面:${String(room.pk.rightActionDesc || '').trim() || '(无)'}`,
                `评论摘要:${(room.comments || []).slice(-20).map(c => `[${c.side || 'left'}]${c.username || '观众'}:${c.content || ''}`).join(' | ') || '(无)'}`
            ].join('\n');
            const fallbackSummary = `【直播原始记录】\n${rawTimeline}`;

            let summaryText = '';
            if (!settings.url || !settings.key) {
                if (typeof showNotification === 'function') showNotification('直播总结失败：未配置AI', 2000, 'error');
                window.syncForumEventToChat(contactId, fallbackSummary, 'system', 'live_sync_hidden');
                return;
            }

            try {
                if (typeof window.generateChannelNaturalSummary !== 'function') {
                    throw new Error('summary helper unavailable');
                }
                const virtualContact = {
                    id: contactId,
                    name: (room.pk.opponent && room.pk.opponent.name) || '连线对象',
                    realName: (room.pk.opponent && room.pk.opponent.name) || '连线对象'
                };
                const timelineMessages = rawTimeline
                    .split('\n')
                    .map((line, index) => ({
                        role: index % 2 === 0 ? 'assistant' : 'user',
                        time: Date.now() + index * 1000,
                        content: String(line || '').trim(),
                        type: 'live_link_text'
                    }))
                    .filter(msg => msg.content);
                const generated = await window.generateChannelNaturalSummary(virtualContact, timelineMessages, {
                    channel: 'live_link',
                    source: 'live_sync_hidden',
                    rangeLabel: `${room.host || '我方'} vs ${(room.pk.opponent && room.pk.opponent.name) || '对方'}`,
                    detailModeHint: '当前是直播连线总结，重点写模式、双方互动、观众反馈、结果与后续策略。',
                    summaryPromptMode: 'manual',
                    totalMessageCount: timelineMessages.length,
                    sourceMessageCount: timelineMessages.length,
                    rangeOverride: { target: 170, min: 120, max: 220, maxTokens: 760 },
                    settings
                });
                summaryText = String(generated && generated.summary || '').trim();
                if (!summaryText) throw new Error('empty summary');

                if (!window.iphoneSimState.memories) window.iphoneSimState.memories = [];
                window.iphoneSimState.memories.push({
                    id: Date.now(),
                    contactId,
                    content: `【直播连线总结】${summaryText}`,
                    time: Date.now(),
                    type: '直播',
                    title: '直播连线总结',
                    range: `${room.host || '我方'} vs ${(room.pk.opponent && room.pk.opponent.name) || '对方'}`
                });
                if (typeof saveConfig === 'function') saveConfig();
                window.syncForumEventToChat(contactId, `[直播连线总结] ${summaryText}`, 'system', 'live_sync_hidden');
            } catch (err) {
                const msg = (err && err.message) ? err.message : '未知错误';
                if (typeof showNotification === 'function') showNotification(`直播总结失败：${msg}`, 2200, 'error');
                window.syncForumEventToChat(contactId, fallbackSummary, 'system', 'live_sync_hidden');
            }
        }

        window.exitPkLinkSession = async function() {
            const room = forumState.currentLiveRoom;
            if (!room || !room.pk || !room.pk.enabled) return;
            const linkSnapshot = JSON.parse(JSON.stringify(room.pk));
            const summaryRoom = { ...room, pk: linkSnapshot, comments: Array.isArray(room.comments) ? room.comments.slice() : [] };
            const summaryContactId = room.pk.opponent && room.pk.opponent.contactId ? room.pk.opponent.contactId : null;
            clearPkTimer(room);
            room.pk = createEmptyPkState();
            const descContainer = document.querySelector('.forum-room-desc-container');
            if (descContainer) {
                descContainer.classList.remove('pk-mode');
                descContainer.innerHTML = renderLiveActionDesc(room.actionDesc || '');
            }
            window.appendForumLiveMessage(
                `<span style="color:#ffd60a;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.92);">已退出连线，返回普通直播。</span>`
            );
            window.renderPkPanel();
            if (typeof window.renderLeaderboardOverlay === 'function') window.renderLeaderboardOverlay();
            if (summaryContactId) {
                await summarizeLiveLinkSession(summaryRoom, summaryContactId);
            }
        };

        window.renderPkActionDesc = function() {
            const room = forumState.currentLiveRoom;
            const container = document.querySelector('.forum-room-desc-container');
            if (!container || !room || !room.pk || !room.pk.enabled) return;
            container.classList.add('pk-mode');
            const leftDesc = String(room.pk.leftActionDesc || room.actionDesc || '').trim() || '我方准备中...';
            const rightDesc = String(room.pk.rightActionDesc || '').trim() || '对方准备中...';
            container.innerHTML = `
                <div class="forum-pk-desc-wrap">
                    <div class="forum-pk-desc-card">
                        <div class="forum-pk-desc-head">
                            <div class="forum-pk-desc-title">我方画面</div>
                            <div class="forum-pk-desc-head-value">¥${formatWalletAmount(room.pk.leftTotalGiftValue || 0)}</div>
                        </div>
                        <div class="forum-pk-desc-text">${leftDesc}</div>
                    </div>
                    <div class="forum-pk-desc-card right">
                        <div class="forum-pk-desc-head">
                            <div class="forum-pk-desc-title">对方画面</div>
                            <div class="forum-pk-desc-head-value">¥${formatWalletAmount(room.pk.rightTotalGiftValue || 0)}</div>
                        </div>
                        <div class="forum-pk-desc-text">${rightDesc}</div>
                    </div>
                </div>
            `;
        };

        function appendPkChatComment(side, username, content, isUser = false) {
            const room = forumState.currentLiveRoom;
            if (!room || !room.pk || !room.pk.enabled) return;
            const sideTag = getPkSideTag(side);
            const sideText = side === 'right' ? '对方' : '我方';
            const badgeClass = side === 'right' ? 'forum-pk-side-badge right' : 'forum-pk-side-badge left';
            const safeUser = username || '观众';
            const safeContent = content || '';
            const html = `
                <span class="${badgeClass}">${sideText}</span><span style="color:#ffffff;font-weight:700;margin-right:6px;">${safeUser}</span>${safeContent}
            `;
            window.appendForumLiveMessage(html);
            room.comments.push({ username: safeUser, content: safeContent, isUser: !!isUser, side });
            syncPkEvent(room, `[PK评论][${sideTag}] ${safeUser}: ${safeContent}`, isUser ? 'user' : 'assistant', 'text');
        }

        function normalizeJsonFromAi(rawText) {
            let content = String(rawText || '').trim();
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const startIdx = content.indexOf('{');
            const endIdx = content.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1) {
                content = content.substring(startIdx, endIdx + 1);
            }
            return content;
        }

        async function requestPkInviteDecision(room, target) {
            const delayMs = 2000 + Math.floor(Math.random() * 3000); // 2-5s
            await new Promise(resolve => setTimeout(resolve, delayMs));

            const acceptProb = 0.7;
            const roll = Math.random();
            const accepted = roll < acceptProb;
            const rejectReasons = [
                '对方主播正在和观众互动，暂时不方便连线。',
                '对方主播设备正在调试中，稍后再试。',
                '对方主播当前有既定直播流程，暂不接受PK。',
                '对方主播刚开播，想先稳定节奏。',
                '对方主播网络状态不太稳定，先不连线。'
            ];
            const reason = accepted ? '' : rejectReasons[Math.floor(Math.random() * rejectReasons.length)];

            console.log('[PK Invite Decision Prob]:', {
                acceptProb,
                roll: Number(roll.toFixed(3)),
                delayMs,
                finalStatus: accepted ? 'accepted' : 'rejected',
                reason
            });

            return {
                status: accepted ? 'accepted' : 'rejected',
                reason
            };
        }

        function buildPkPersonaContext(room) {
            if (!room || !room.pk || !room.pk.enabled) return '';
            const opponent = room.pk.opponent || {};
            if (!opponent.isLinked || !opponent.contactId) return '\n对方是陌生主播，不需要关系化口吻。';
            const profiles = (forumState.settings && forumState.settings.contactProfiles) ? forumState.settings.contactProfiles : {};
            const contacts = (window.iphoneSimState && window.iphoneSimState.contacts) ? window.iphoneSimState.contacts : [];
            const c = contacts.find(x => x.id === opponent.contactId);
            const p = profiles[opponent.contactId] || {};
            const realName = (window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.name) || '用户';
            let userPersonaPrompt = '';
            if (c && c.userPersonaId && window.iphoneSimState && Array.isArray(window.iphoneSimState.userPersonas)) {
                const up = window.iphoneSimState.userPersonas.find(item => item.id === c.userPersonaId);
                if (up && up.aiPrompt) userPersonaPrompt = up.aiPrompt;
            }
            const knows = !!p.knowsUser;
            let relation = '';
            if (c && c.persona) relation += `对方人设:${c.persona}\n`;
            if (userPersonaPrompt) relation += `用户人设:${userPersonaPrompt}\n`;
            relation += knows ? `对方知道当前主播就是${realName}本人。` : '对方不一定知道主播真实身份。';
            let wechatContext = '';
            if (p.syncWechat && window.iphoneSimState && window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[opponent.contactId]) {
                const hist = window.iphoneSimState.chatHistory[opponent.contactId].slice(-8);
                const text = hist.map(m => `${m.role === 'user' ? '我' : '对方'}:${m.content || ''}`).join('\n');
                if (text) wechatContext = `\n最近微信上下文:\n${text}`;
            }
            return `\n当前PK双方存在现实关系，请严格按关系生成：\n${relation}${wechatContext}`;
        }

        async function requestPkGeneratedContent(room, userInputText) {
            const settings = getLiveAiSettings();
            if (!settings.url || !settings.key) throw new Error('请先配置AI接口');
            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            const comments = (room.comments || []).slice(-10).map(c => `${getPkSideTag(c.side)}${c.username}: ${c.content}`).join('\n');
            const myName = forumState.currentUser.bio || forumState.currentUser.username || '我';
            const personaContext = buildPkPersonaContext(room);
            const leftValue = Math.max(0, Number(room.pk.leftGiftValue) || 0);
            const rightValue = Math.max(0, Number(room.pk.rightGiftValue) || 0);
            const diff = Math.abs(leftValue - rightValue);
            const lead = leftValue === rightValue ? '平局' : (leftValue > rightValue ? '我方领先' : '对方领先');
            const prompt = `你在模拟直播PK对战。双方信息:
我方主播:${room.host}
对方主播:${room.pk.opponent.name}
当前模式:${room.pk.mode === 'chat' ? '闲聊模式(不比拼)' : 'PK模式(比拼中)'}
我方礼物值:${leftValue}
对方礼物值:${rightValue}
领先方:${lead}
礼物差值:${diff}
用户本轮输入:${userInputText || '(无)'}
最近评论:
${comments || '(无)'}
${personaContext}

请输出JSON，字段必须完整:
{
  "left_action_desc":"我方画面描述",
  "right_action_desc":"对方画面描述",
  "left_comments":[{"username":"...","content":"..."}],
  "right_comments":[{"username":"...","content":"..."}],
  "left_gift_events":[{"username":"...","gift_name":"火箭","count":3,"comment":"..."}],
  "opponent_host_gift_events":[{"username":"对方主播","gift_name":"皇冠","count":1,"comment":"给你一点支持"}],
  "right_gift_delta":120,
  "suggested_actions":["建议1","建议2"],
  "next_action_hint":"一句简短建议"
}
规则:
1) 评论简短口语化，且不能把${myName}当成送礼人。
2) left_gift_events 的礼物必须来自[玫瑰,棒棒糖,皇冠,火箭,钻石,爱心]，count为1-20整数。
3) left_action_desc必须保持和“用户本轮输入”一致（可原样复述，不能改写）。
4) opponent_host_gift_events可为空数组；若有，表示对方主播给我方送礼，礼物同样来自上述列表。
5) right_gift_delta是对方本轮新增礼物总价值(数字)。
6) 如果opponent_host_gift_events非空，right_action_desc必须明确体现“对方主播知道自己给我方送了礼物”。
7) 必须返回至少2条suggested_actions，且next_action_hint不超过20字。
8) 只返回JSON，不要Markdown。`;
            const resp = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.key },
                body: JSON.stringify({
                    model: settings.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: '你是直播PK互动数据生成器，只返回JSON。' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.82
                })
            });
            if (!resp.ok) throw new Error('PK生成失败');
            const data = await resp.json();
            const raw = data && data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : '';
            const parsed = JSON.parse(normalizeJsonFromAi(raw));
            return parsed;
        }

        window.enterPkPhase = function(phase, seconds) {
            const room = forumState.currentLiveRoom;
            if (!room || !room.pk || !room.pk.enabled) return;
            clearPkTimer(room);
            room.pk.phase = phase;
            room.pk.timerSec = Math.max(0, Number(seconds) || 0);
            room.pk.timerPaused = false;
            const phaseLabel = phase === 'pre_pk' ? 'PK预备阶段' : phase === 'pk_running' ? 'PK正式开始' : phase === 'post_pk' ? 'PK后互动阶段' : phase;
            window.appendForumLiveMessage(`<span style="color:#ffd60a;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.92);">${phaseLabel}（${formatPkTimer(room.pk.timerSec)}）</span>`);
            syncPkEvent(room, `[PK阶段] ${phase} (${room.pk.timerSec}s)`, 'system', 'live_sync_hidden');
            window.renderPkPanel();
            if (room.pk.timerSec <= 0) return;
                room.pk.timerHandle = setInterval(() => {
                if (!forumState.currentLiveRoom || !forumState.currentLiveRoom.pk || !forumState.currentLiveRoom.pk.enabled) {
                    clearPkTimer(room);
                    return;
                }
                if (room.pk.timerPaused) return;
                room.pk.timerSec = Math.max(0, room.pk.timerSec - 1);
                window.renderPkPanel();
                if (room.pk.timerSec <= 0) {
                    clearPkTimer(room);
                    if (room.pk.phase === 'pre_pk') {
                        if (room.pk.mode === 'pk' && room.pk.autoStartOnPreEnd !== false) {
                            window.startPkBattle();
                            return;
                        }
                    } else if (room.pk.phase === 'pk_running') {
                        window.finishPkBattle();
                        window.enterPkPhase('post_pk', 120);
                    }
                }
            }, 1000);
        };

        window.initPkSession = function(opponentInfo) {
            const room = forumState.currentLiveRoom;
            if (!room) return;
            const base = createEmptyPkState();
            room.pk = { ...base, enabled: true };
            room.pk.opponent = {
                name: opponentInfo.name || '对方主播',
                avatar: opponentInfo.avatar || resolveLeaderboardAvatarByHost(opponentInfo.name || 'opponent'),
                contactId: opponentInfo.contactId || null,
                isLinked: !!opponentInfo.isLinked
            };
            room.pk.leftActionDesc = room.actionDesc || '';
            room.pk.rightActionDesc = '对方进入PK连线，准备中...';
            room.pk.mode = 'pk';
            room.pk.autoStartOnPreEnd = true;
            room.pk.leftGiftValue = 0;
            room.pk.rightGiftValue = 0;
            room.pk.leftTotalGiftValue = getLeaderboardGiftValueByHost(room.host);
            room.pk.rightTotalGiftValue = getLeaderboardGiftValueByHost(room.pk.opponent.name);
            room.pk.addTimeUsed = { pre: 0, post: 0 };
            room.pk.winner = null;
            room.comments = [];
            const chatArea = document.querySelector('.forum-room-chat-area');
            if (chatArea) {
                chatArea.innerHTML = '';
                const wrapper = document.createElement('div');
                wrapper.className = 'forum-chat-list-wrapper';
                chatArea.appendChild(wrapper);
            }
            window.renderPkPanel();
            window.renderPkActionDesc();
            syncPkEvent(room, `[PK邀请] 已和 ${room.pk.opponent.name} 建立连线`, 'system', 'live_sync_hidden');
            window.enterPkPhase('pre_pk', 120);
            let rankText = 'NO.99+';
            try {
                const lb = JSON.parse(localStorage.getItem('forum_leaderboard') || '{"hosts":[]}');
                const hosts = Array.isArray(lb.hosts) ? lb.hosts.slice() : [];
                hosts.sort((a, b) => (Number(b.totalValue) || 0) - (Number(a.totalValue) || 0));
                const idx = hosts.findIndex(h => h.name === room.host);
                if (idx >= 0) rankText = `NO.${idx + 1}`;
            } catch (e) {}
            window.appendForumLiveMessage(`<span style="color:#ffd60a;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.95);">PK预备阶段开始，观众送礼可帮我方冲榜，当前排名 ${rankText}。</span>`);
        };

        window.startPkBattle = function() {
            const room = forumState.currentLiveRoom;
            if (!room || !room.pk || !room.pk.enabled || room.pk.phase !== 'pre_pk') return;
            room.pk.leftGiftValue = 0;
            room.pk.rightGiftValue = 0;
            window.enterPkPhase('pk_running', 180);
            window.renderPkPanel();
        };

        window.finishPkBattle = function() {
            const room = forumState.currentLiveRoom;
            if (!room || !room.pk || !room.pk.enabled) return;
            const left = Math.max(0, Number(room.pk.leftGiftValue) || 0);
            const right = Math.max(0, Number(room.pk.rightGiftValue) || 0);
            let winner = 'draw';
            if (left > right) winner = 'left';
            else if (right > left) winner = 'right';
            room.pk.winner = winner;
            const msg = winner === 'draw'
                ? `PK结束：平局（我方¥${formatWalletAmount(left)} / 对方¥${formatWalletAmount(right)}）`
                : winner === 'left'
                    ? `PK结束：我方胜利（我方¥${formatWalletAmount(left)} / 对方¥${formatWalletAmount(right)}）`
                    : `PK结束：对方胜利（我方¥${formatWalletAmount(left)} / 对方¥${formatWalletAmount(right)}）`;
            window.appendForumLiveMessage(`<span style="color:#ffd60a;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.95);">${msg}</span>`);
            syncPkEvent(room, `[PK结算] ${msg}`, 'system', 'live_sync_hidden');
            window.renderPkPanel();
        };

        window.extendPkTime = function() {
            const room = forumState.currentLiveRoom;
            if (!room || !room.pk || !room.pk.enabled) return;
            const phase = room.pk.phase;
            if (phase !== 'pre_pk' && phase !== 'post_pk') return;
            room.pk.timerSec = Math.max(0, Number(room.pk.timerSec) || 0) + 30;
            syncPkEvent(room, `[PK加时] ${phase} +30s`, 'system', 'live_sync_hidden');
            window.renderPkPanel();
        };

        window.togglePkTimerPause = function() {
            const room = forumState.currentLiveRoom;
            if (!room || !room.pk || !room.pk.enabled) return;
            room.pk.timerPaused = !room.pk.timerPaused;
            syncPkEvent(room, `[PK计时] ${room.pk.timerPaused ? '暂停' : '继续'}`, 'system', 'live_sync_hidden');
            window.renderPkPanel();
        };

        function getLiveAiSettings() {
            let settings = { url: '', key: '', model: '' };
            if (window.iphoneSimState) {
                if (window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url) settings = window.iphoneSimState.aiSettings;
                else if (window.iphoneSimState.aiSettings2 && window.iphoneSimState.aiSettings2.url) settings = window.iphoneSimState.aiSettings2;
            }
            return settings;
        }

        function buildFallbackLiveStartPack(username, title, history) {
            const textHistory = (history || [])
                .slice(-12)
                .map(m => (m && typeof m.content === 'string') ? m.content : '')
                .filter(Boolean);
            const lastLine = textHistory.length > 0 ? textHistory[textHistory.length - 1].substring(0, 60) : '';
            const t = (title || '直播').trim() || '直播';
            const actionDesc = lastLine
                ? `主播 ${username} 调整好镜头后开播，笑着和大家打招呼：“${lastLine}”，直播间节奏慢慢热起来。`
                : `主播 ${username} 刚开播，整理麦克风和灯光，轻松和大家打招呼，准备开始今天的 ${t}。`;

            const namePool = ['Mika_17','RinCat','南风不晚','Cloudie','PixelTea','夜航星','阿青在看','LemonRoom','Sora_98','KiteRunner'];
            const commentPool = [`刚进来，${t}主题我爱看`,'主播状态好好','这场氛围好舒服','前排打卡','今天会讲到重点吗','声音很清楚','来了来了','期待后面内容'];
            const picked = [];
            while (picked.length < 4 && namePool.length > 0) {
                const idx = Math.floor(Math.random() * namePool.length);
                const uname = namePool.splice(idx, 1)[0];
                const cidx = Math.floor(Math.random() * commentPool.length);
                picked.push({ username: uname, content: commentPool[cidx], isUser: false });
            }
            const viewerCandidates = ['96', '188', '356', '628', '1.1k', '1.6k', '2.3k', '3.8k'];
            const viewers = viewerCandidates[Math.floor(Math.random() * viewerCandidates.length)];
            return { actionDesc, initialComments: picked, viewers };
        }

        async function generateLiveStartPack(contactId, username, title) {
            const history = (window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contactId]) || [];
            const fallback = buildFallbackLiveStartPack(username, title, history);
            const settings = getLiveAiSettings();
            if (!settings.url || !settings.key) return fallback;

            const historyText = history.slice(-24).map(m => {
                const role = m && m.role === 'user' ? '用户' : '角色';
                const msg = (m && typeof m.content === 'string') ? m.content : '';
                return msg ? `${role}: ${msg}` : '';
            }).filter(Boolean).join('\n');
            const myName = forumState.currentUser.bio || forumState.currentUser.username || '我';

            const prompt = `你是论坛直播开场内容生成器。请根据以下聊天上下文，生成“开播后立刻展示”的内容。\n角色名: ${username}\n直播标题: ${title || '直播'}\n用户在论坛中的名字: ${myName}\n最近聊天上下文:\n${historyText || '（无）'}\n\n要求:\n1. 生成 action_desc: 一段主播开播时的画面描述（30-80字，具体自然）。\n2. 生成 initial_comments: 3-5条评论，格式为对象数组。\n3. 评论用户名必须像真实网名，严禁使用“观众1/观众2/用户/我/admin”等占位名。\n4. 评论内容要和上下文相关、口语化、简短。\n5. 生成 viewers: 直播卡片展示的观看人数，格式如 "356"、"1.2k"。\n6. 只返回JSON，不要Markdown。\n\n返回格式:\n{\n  "action_desc": "......",\n  "viewers": "1.2k",\n  "initial_comments": [\n    { "username": "xxx", "content": "xxx" }\n  ]\n}`;

            try {
                let fetchUrl = settings.url;
                if (!fetchUrl.endsWith('/chat/completions')) {
                    fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
                }
                const response = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.key },
                    body: JSON.stringify({
                        model: settings.model || 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: '你是严格只输出JSON的助手。' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.8
                    })
                });
                if (!response.ok) return fallback;
                const data = await response.json();
                let out = (((data || {}).choices || [])[0] || {}).message?.content || '';
                out = out.replace(/```json/g, '').replace(/```/g, '').trim();
                const s = out.indexOf('{');
                const e = out.lastIndexOf('}');
                if (s !== -1 && e !== -1 && e > s) out = out.substring(s, e + 1);
                const parsed = JSON.parse(out);

                const actionDesc = (parsed.action_desc || parsed.actionDesc || '').trim();
                const rawComments = Array.isArray(parsed.initial_comments) ? parsed.initial_comments : [];
                const cleaned = rawComments.map(c => ({
                    username: (c && c.username ? String(c.username) : '').trim(),
                    content: (c && c.content ? String(c.content) : '').trim(),
                    isUser: false
                })).filter(c => c.username && c.content)
                  .filter(c => !/^观众\d+$/i.test(c.username))
                  .filter(c => !/^(观众|用户|我|admin)$/i.test(c.username));

                return {
                    actionDesc: actionDesc || fallback.actionDesc,
                    initialComments: cleaned.length > 0 ? cleaned.slice(0, 5) : fallback.initialComments,
                    viewers: (parsed.viewers ? String(parsed.viewers).trim() : '') || fallback.viewers
                };
            } catch (e) {
                console.warn('generateLiveStartPack fallback:', e);
                return fallback;
            }
        }

        function openForumLiveFromNotification(live) {
            if (!live) return;
            document.querySelectorAll('.app-screen, .sub-screen').forEach(el => {
                if (el.id !== 'forum-app') el.classList.add('hidden');
            });
            const forumApp = document.getElementById('forum-app');
            if (forumApp) forumApp.classList.remove('hidden');
            forumState.activeTab = 'video';
            renderForum && renderForum();
            setTimeout(() => {
                const initialCommentsStr = encodeURIComponent(JSON.stringify(live.initial_comments || []));
                window.openForumLiveRoom(live.title || '直播', live.username || live.host || '', live.actionDesc || '', initialCommentsStr, (live.viewers || '').toString());
            }, 40);
        }

        // bgUrl is optional background image used for the live card
        window.createForumLiveStream = async function(contactId, title, actionDesc, bgUrl, initialCommentsInput, viewersInput) {
            const contacts = window.iphoneSimState.contacts || [];
            const c = contacts.find(c => c.id === contactId);
            if (!c) return;
            const username = c.remark || c.name;

            const bgPool = [
                'https://i.postimg.cc/fymR94qp/IMG-6099.jpg',
                'https://i.postimg.cc/kGKgbrY0/IMG-6100.jpg',
                'https://i.postimg.cc/3RPwNr1v/IMG-6101.jpg',
                'https://i.postimg.cc/bJKvrYgd/IMG-6102.jpg',
                'https://i.postimg.cc/NMW0FGDJ/IMG-6103.jpg',
                'https://i.postimg.cc/C1Z1wnGx/IMG-6104.jpg'
            ];
            const randomBg = bgPool[Math.floor(Math.random() * bgPool.length)];
            const finalBg = (bgUrl && bgUrl.trim()) ? bgUrl.trim() : randomBg;

            const hasInputComments = Array.isArray(initialCommentsInput) && initialCommentsInput.length > 0;
            let initialComments = hasInputComments
                ? initialCommentsInput.map(c => ({ username: c.username, content: c.content, isUser: false }))
                : [];
            let viewers = viewersInput ? String(viewersInput).trim() : '';

            if (!actionDesc || !actionDesc.trim() || initialComments.length === 0) {
                const generated = await generateLiveStartPack(contactId, username, title || '直播');
                if (!actionDesc || !actionDesc.trim()) actionDesc = generated.actionDesc || '';
                if (initialComments.length === 0) initialComments = generated.initialComments || [];
                if (!viewers) viewers = generated.viewers || '';
            }
            if (!viewers) viewers = '128';

            const newLive = {
                category: 'Chat',
                title: title || '直播',
                username: username,
                viewers: viewers,
                image: finalBg,
                host: username,
                actionDesc: actionDesc || '',
                userId: contactId,
                initial_comments: initialComments
            };

            if (!forumState.liveStreams) forumState.liveStreams = [];
            forumState.liveStreams.unshift(newLive);
            localStorage.setItem('forum_liveStreams', JSON.stringify(forumState.liveStreams));

            if (contactId && isWechatSyncEnabled(contactId)) {
                window.syncForumEventToChat(contactId, `[开始直播]: "${title || '直播'}"`);
                if (window.showChatNotification) {
                    window.showChatNotification(contactId, `对方开始直播: ${title || '直播'}`, {
                        onClick: function() {
                            openForumLiveFromNotification(newLive);
                        }
                    });
                }
            }

            renderForum && renderForum();
        };

        window.showForumLiveNotification = function(username, title) {
            // append to body so re-renders of #forum-app don't remove it
            const container = document.body || document.documentElement;
            if (!container) return;
            const notif = document.createElement('div');
            notif.className = 'forum-live-notification';
            notif.textContent = `${username} 开始直播: ${title}`;
            notif.onclick = () => { window.openForumLiveRoom(title, username, '', '[]', '128'); notif.remove(); };
            container.appendChild(notif);
            setTimeout(() => notif.remove(), 5000);
        };

        function randomHostViewers() {
            const n = 60 + Math.floor(Math.random() * 2200);
            if (n >= 1000) return (Math.round(n / 100) / 10) + 'k';
            return String(n);
        }

        function buildHostInitialComments(seedText = '') {
            const hook = (seedText || '').trim();
            const suffix = hook ? `，${hook.slice(0, 12)}` : '';
            const pool = [
                { username: '橘子汽水', content: `开播啦${suffix}` },
                { username: '今晚不熬夜', content: '主播来了，蹲后续' },
                { username: 'Aki_77', content: '这个开场挺有氛围' },
                { username: '北极熊同学', content: '继续继续，节奏不错' },
                { username: 'LuckyMint', content: '已点赞，等高能' },
                { username: '猫耳朵', content: '这段描述很有画面感' }
            ];
            const count = 3 + Math.floor(Math.random() * 3);
            return pool
                .sort(() => Math.random() - 0.5)
                .slice(0, count)
                .map(c => ({ username: c.username, content: c.content, isUser: false }));
        }

        function renderLiveActionDesc(text) {
            const safe = (text || '').trim();
            if (!safe) return '';
            return `<div style="text-align:center; font-size: 15px; color: white; background: rgba(0,0,0,0.3); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 12px 20px; border-radius: 20px; display: inline-block; max-width: 85%; max-height: 250px; overflow-y: auto; line-height: 1.5; pointer-events: auto; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${safe}</div>`;
        }

        function buildHostActionSuggestions(result, room) {
            const comments = Array.isArray(result && result.comments) ? result.comments : [];
            const gifts = Array.isArray(result && result.gift_events) ? result.gift_events : [];
            const suggestions = [];

            if (comments[0] && comments[0].content) suggestions.push(`回应弹幕：“${comments[0].content}”，并微笑点头。`);
            if (comments[1] && comments[1].content) suggestions.push(`根据“${comments[1].content}”切换镜头，做一次细节展示。`);
            if (gifts[0] && gifts[0].gift_name) suggestions.push(`感谢 ${gifts[0].username || '粉丝'} 送的${gifts[0].gift_name}，做一个互动挑战。`);
            if (gifts[1] && gifts[1].gift_name) suggestions.push(`带着${gifts[1].gift_name}特效节奏，说一句感谢词并推进下一段内容。`);
            if (result && result.actionDesc) suggestions.push(`沿用当前氛围“${result.actionDesc.slice(0, 18)}...”，继续放大情绪。`);
            suggestions.push('总结刚才互动，抛一个二选一问题让观众投票。');

            const dedup = [];
            const seen = new Set();
            suggestions.forEach(s => {
                const k = (s || '').trim();
                if (!k || seen.has(k)) return;
                seen.add(k);
                dedup.push(k);
            });
            if (room) room.suggestedActions = dedup.slice(0, 5);
            return (room && room.suggestedActions) ? room.suggestedActions : dedup.slice(0, 5);
        }

        window.renderForumActionSuggestionMenu = function() {
            const room = forumState.currentLiveRoom;
            const list = document.getElementById('forum-action-suggestion-list');
            if (!list || !room) return;
            const items = (room.suggestedActions && room.suggestedActions.length > 0) ? room.suggestedActions : [];
            if (items.length === 0) {
                list.innerHTML = `
                    <div style="padding:16px; color:#666; font-size:13px; line-height:1.5;">
                        先点击一次“生成回复”，系统会结合本轮弹幕和礼物生成下一步建议。
                    </div>
                `;
                return;
            }
            list.innerHTML = items.map(text => `
                <div class="create-menu-item" style="border-bottom:1px solid #f0f0f0;" onclick="window.pickForumActionSuggestion('${encodeURIComponent(text).replace(/'/g, '%27')}')">
                    <div class="create-menu-text" style="font-size:14px; line-height:1.45;">${text}</div>
                </div>
            `).join('');
        };

        window.toggleForumActionSuggestionMenu = function() {
            const menu = document.getElementById('forum-action-suggestion-menu');
            if (!menu) return;
            menu.classList.toggle('active');
            if (menu.classList.contains('active')) window.renderForumActionSuggestionMenu();
        };

        window.pickForumActionSuggestion = function(encodedText) {
            const input = document.getElementById('forum-live-input');
            if (!input) return;
            const text = decodeURIComponent(encodedText || '').trim();
            if (!text) return;
            input.value = text;
            input.focus();
            window.toggleForumActionSuggestionMenu();
        };

        window.startMyLiveRoom = function() {
            const myName = forumState.currentUser.bio || forumState.currentUser.username || '我';
            const title = '我的直播间';
            const actionDesc = '我调整好镜头，和大家打招呼，准备开始今天的直播内容。';
            const initialComments = buildHostInitialComments(actionDesc);
            const viewers = randomHostViewers();
            const initialCommentsStr = encodeURIComponent(JSON.stringify(initialComments));
            // Build leaderboard hosts from live list page hosts (video tab list).
            const listLives = Array.isArray(forumState.liveStreams) ? forumState.liveStreams : [];
            const hostMap = new Map();
            const parseViewers = (v) => {
                const s = String(v || '').toLowerCase().trim();
                if (!s) return 0;
                if (s.endsWith('k')) return Math.round((parseFloat(s) || 0) * 1000);
                if (s.endsWith('w')) return Math.round((parseFloat(s) || 0) * 10000);
                return parseInt(s.replace(/[^\d]/g, ''), 10) || 0;
            };
            listLives.forEach((live) => {
                const hostName = String((live && (live.username || live.host)) || '').trim();
                if (!hostName || hostMap.has(hostName)) return;
                const viewersNum = parseViewers(live && live.viewers);
                const seedValue = Math.max(80, Math.floor(viewersNum * (0.08 + Math.random() * 0.18)));
                hostMap.set(hostName, {
                    name: hostName,
                    avatar: resolveLeaderboardAvatarByHost(hostName),
                    totalValue: seedValue
                });
            });
            if (!hostMap.has(myName)) {
                hostMap.set(myName, {
                    name: myName,
                    avatar: getCurrentUserLiveAvatar(),
                    totalValue: 0
                });
            }
            const hosts = Array.from(hostMap.values()).map((h) => {
                if (h.name === myName) {
                    return {
                        ...h,
                        avatar: getCurrentUserLiveAvatar(),
                        totalValue: 0
                    };
                }
                return h;
            });
            localStorage.setItem('forum_leaderboard', JSON.stringify({ hosts }));
            window.openForumLiveRoom(title, myName, actionDesc, initialCommentsStr, viewers, { mode: 'host' });
        };

        function ensureWalletReadyForLiveSettlement() {
            const wallet = getForumWalletState();
            if (!wallet.initialized) {
                const initBase = fallbackInitialWalletBalance(
                    (forumState.currentUser && forumState.currentUser.publicIdentity) || '',
                    (forumState.currentUser && forumState.currentUser.followers) || 0
                );
                wallet.initialized = true;
                wallet.balance = Math.max(0, Number(wallet.balance) || initBase);
                wallet.transactions = Array.isArray(wallet.transactions) ? wallet.transactions : [];
                saveForumWalletState();
            }
            return wallet;
        }

        window.showHostLiveSummary = function(giftIncome, gainedFans, rank, rankBonus) {
            const roomPage = document.getElementById('forum-room-page');
            if (!roomPage) return;
            const existing = document.getElementById('host-live-summary-overlay');
            if (existing) existing.remove();

            const giftVal = Math.max(0, Number(giftIncome) || 0);
            const fansVal = Math.max(0, Number(gainedFans) || 0);
            const rankVal = Math.max(1, Number(rank) || 99);
            const bonusVal = Math.max(0, Number(rankBonus) || 0);
            const totalIncome = giftVal + bonusVal;

            const overlay = document.createElement('div');
            overlay.id = 'host-live-summary-overlay';
            overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.76);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:1200;display:flex;align-items:center;justify-content:center;padding:24px;';
            overlay.innerHTML = `
                <div style="width:100%;max-width:320px;background:#111;border:1px solid rgba(255,255,255,0.18);border-radius:18px;padding:18px 16px;color:white;box-shadow:0 18px 42px rgba(0,0,0,0.45);">
                    <div style="font-size:18px;font-weight:800;margin-bottom:12px;">本场直播结算</div>
                    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:14px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.06);padding:10px 12px;border-radius:12px;">
                            <span style="font-size:13px;color:rgba(255,255,255,0.75);">礼物总价值</span>
                            <span style="font-size:18px;font-weight:800;color:#ffd60a;">+¥${formatWalletAmount(giftVal)}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.06);padding:10px 12px;border-radius:12px;">
                            <span style="font-size:13px;color:rgba(255,255,255,0.75);">新增粉丝</span>
                            <span style="font-size:18px;font-weight:800;color:#5ac8fa;">+${fansVal}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.06);padding:10px 12px;border-radius:12px;">
                            <span style="font-size:13px;color:rgba(255,255,255,0.75);">结束时排名</span>
                            <span style="font-size:18px;font-weight:800;color:#ffd60a;">NO.${rankVal}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.06);padding:10px 12px;border-radius:12px;">
                            <span style="font-size:13px;color:rgba(255,255,255,0.75);">排名奖金</span>
                            <span style="font-size:18px;font-weight:800;color:#34c759;">+¥${formatWalletAmount(bonusVal)}</span>
                        </div>
                        <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.1);padding:10px 12px;border-radius:12px;">
                            <span style="font-size:13px;color:rgba(255,255,255,0.85);">本场总入账</span>
                            <span style="font-size:20px;font-weight:900;color:#34c759;">+¥${formatWalletAmount(totalIncome)}</span>
                        </div>
                    </div>
                    <button onclick="window.closeHostLiveSummary()" style="width:100%;height:40px;border:none;border-radius:12px;background:#0095f6;color:#fff;font-weight:700;cursor:pointer;">完成</button>
                </div>
            `;
            roomPage.appendChild(overlay);
        };

        window.closeHostLiveSummary = function() {
            const overlay = document.getElementById('host-live-summary-overlay');
            if (overlay) overlay.remove();
            window.closeForumLiveRoom();
            forumState.activeTab = 'profile';
            renderForum(false);
        };

        window.endMyLiveStream = function() {
            const room = forumState.currentLiveRoom;
            if (!room || room.mode !== 'host') return;
            if (!confirm('确定结束直播吗？')) return;

            const giftIncome = Math.max(0, Number(room.sessionGiftIncome) || 0);
            const baseFans = 3 + Math.floor(Math.random() * 12);
            const giftBoost = Math.floor(giftIncome / 120);
            const viewBoost = Math.max(0, Math.floor((Number(room.sessionPeakViewers) || 0) / 800));
            const gainedFans = Math.max(1, baseFans + giftBoost + viewBoost);

            forumState.currentUser.followers = Math.max(0, Number(forumState.currentUser.followers || 0) + gainedFans);
            localStorage.setItem('forum_currentUser', JSON.stringify(forumState.currentUser));

            const wallet = ensureWalletReadyForLiveSettlement();
            let rank = 99;
            try {
                const lb = JSON.parse(localStorage.getItem('forum_leaderboard') || '{"hosts":[]}');
                let hosts = Array.isArray(lb.hosts) ? lb.hosts : [];
                const myAvatar = (forumState.currentUser && forumState.currentUser.avatar) || '';
                const me = room.host;
                const mine = hosts.find(h => h.name === me);
                if (mine) {
                    if (myAvatar) mine.avatar = myAvatar;
                } else {
                    hosts.push({ name: me, avatar: myAvatar, totalValue: Math.max(0, giftIncome) });
                }
                hosts.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
                rank = Math.max(1, hosts.findIndex(h => h.name === me) + 1);
                localStorage.setItem('forum_leaderboard', JSON.stringify({ hosts }));
            } catch (e) {}

            const rankBonusMap = { 1: 2000, 2: 1200, 3: 800 };
            const rankBonus = rankBonusMap[rank] || 0;
            const settlementIncome = giftIncome + rankBonus;

            if (settlementIncome > 0) {
                wallet.balance = Math.max(0, Number(wallet.balance || 0) + settlementIncome);
                wallet.transactions.unshift({
                    id: Date.now(),
                    title: `Live Settlement${rank <= 3 ? ` (NO.${rank} Bonus)` : ''}`,
                    timeText: 'Just now',
                    amount: settlementIncome,
                    type: 'positive',
                    iconType: 'income',
                    iconSvg: getWalletTxIconSvg('income')
                });
                if (wallet.transactions.length > 30) wallet.transactions = wallet.transactions.slice(0, 30);
                saveForumWalletState();
            }

            window.showHostLiveSummary(giftIncome, gainedFans, rank, rankBonus);
        };

        // Helper for appending live messages with "push up" animation (WeChat style)
        window.appendForumLiveMessage = function(htmlContent) {
            const chatArea = document.querySelector('.forum-room-chat-area');
            if (!chatArea) return;
            
            let wrapper = chatArea.querySelector('.forum-chat-list-wrapper');
            if (!wrapper) {
                // Should exist from init, but safeguard
                wrapper = document.createElement('div');
                wrapper.className = 'forum-chat-list-wrapper';
                // Remove inline flex-end to rely on CSS
                wrapper.style.cssText = ''; 
                chatArea.appendChild(wrapper);
            }

            // Check if user is near bottom (allow 100px tolerance)
            const isNearBottom = chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < 150;

            const newMsg = document.createElement('div');
            newMsg.className = 'forum-room-chat-msg';
            // No inline animation, we animate wrapper transform
            newMsg.innerHTML = htmlContent;
            
            wrapper.appendChild(newMsg);
            
            if (isNearBottom) {
                // Measure height
                const msgHeight = newMsg.offsetHeight + 8; // 8px gap
                
                // Scroll to bottom immediately so new message is in view (at bottom)
                chatArea.scrollTop = chatArea.scrollHeight;
                
                // Apply transform to push it back down (simulating previous state)
                wrapper.style.transition = 'none';
                wrapper.style.transform = `translateY(${msgHeight}px)`;
                
                // Force reflow
                void wrapper.offsetHeight;
                
                // Animate to natural position
                wrapper.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                wrapper.style.transform = 'translateY(0)';
            }
            
            // Save state after appending message
            saveLiveRoomState();
        };

        // Expose function to open live room
        window.openForumLiveRoom = function(title, host, actionDesc, initialCommentsStr, viewersOrOptions, maybeOptions) {
            let viewersText = '';
            let modeOptions = {};
            if (viewersOrOptions && typeof viewersOrOptions === 'object' && !Array.isArray(viewersOrOptions)) {
                modeOptions = viewersOrOptions;
            } else if (viewersOrOptions !== undefined && viewersOrOptions !== null) {
                viewersText = String(viewersOrOptions).trim();
            }
            if (maybeOptions && typeof maybeOptions === 'object') {
                modeOptions = maybeOptions;
            }
            const isHostMode = modeOptions.mode === 'host';

            // Resolve Host Info (Avatar & Display Name)
            let avatarUrl = '';
            let displayName = host; // Default to provided host name

            const contacts = (window.iphoneSimState && window.iphoneSimState.contacts) ? window.iphoneSimState.contacts : [];
            const profiles = (forumState.settings && forumState.settings.contactProfiles) ? forumState.settings.contactProfiles : {};
            
            // Helper to check match
            const isMatch = (c, nameToCheck) => {
                if (!nameToCheck) return false;
                const p = profiles[c.id] || {};
                
                // 1. Exact Name Matches (High Confidence)
                if (c.remark === nameToCheck || p.name === nameToCheck || c.name === nameToCheck) return true;
                
                // 2. Bio/Persona Content Match (Medium Confidence - used because AI sometimes picks names from bio)
                // Only if nameToCheck is specific enough (e.g. > 1 char)
                if (nameToCheck.length > 1) {
                     if (p.bio && p.bio.includes(nameToCheck)) return true;
                     if (c.persona && c.persona.includes(nameToCheck)) return true;
                }
                
                return false;
            };

            // Find matching contact
            let foundContact = null;
            
            // 1. Try linked contacts first (Prioritize these for bio matching)
            const linkedIds = (forumState.settings && forumState.settings.linkedContacts) ? forumState.settings.linkedContacts : [];
            for (const id of linkedIds) {
                const c = contacts.find(contact => contact.id === id);
                if (c && isMatch(c, host)) {
                    foundContact = c;
                    break;
                }
            }

            // 2. Fallback to all contacts (Only exact match to avoid false positives)
            if (!foundContact) {
                foundContact = contacts.find(c => {
                    const p = profiles[c.id] || {};
                    return c.remark === host || p.name === host || c.name === host;
                });
            }

            if (foundContact) {
                const p = profiles[foundContact.id] || {};
                // Priority: Profile Name > Remark > Contact Name (for display)
                // Actually user requested "User Set Name" (Remark) priority for display
                displayName = p.name || foundContact.remark || foundContact.name;
                avatarUrl = p.avatar || foundContact.avatar;
            }

            // Fallback Avatar if not found
            if (!avatarUrl) {
                avatarUrl = `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(host)}`;
            }
            if (isHostMode) {
                displayName = forumState.currentUser.username || forumState.currentUser.bio || host || '我';
                avatarUrl = getCurrentUserLiveAvatar() || avatarUrl;
            }

            // Update DOM
            document.getElementById('forum-room-host-name').textContent = displayName;

            const avatarEl = document.querySelector('.forum-room-host-avatar');
            if (avatarEl) {
                avatarEl.innerHTML = `<img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; display:block;">`;
                avatarEl.style.background = 'transparent';
            }
            
            forumState.currentLiveRoom = {
                title: title,
                host: host,
                actionDesc: actionDesc,
                comments: [],
                preGenState: null,
                userId: (foundContact && foundContact.id) ? foundContact.id : null,
                mode: isHostMode ? 'host' : 'viewer',
                viewers: viewersText || randomHostViewers(),
                suggestedActions: [],
                sessionGiftIncome: 0,
                sessionPeakViewers: 0,
                lastAnnouncedRank: null,
                pk: createEmptyPkState()
            };
            if (isHostMode) {
                forumState.currentLiveRoom.suggestedActions = [];
                const vNum = Number(String(forumState.currentLiveRoom.viewers).replace(/[^\d.]/g, '')) || 0;
                forumState.currentLiveRoom.sessionPeakViewers = vNum >= 100 ? vNum : Math.round(vNum * 1000);
                try {
                    const lb = JSON.parse(localStorage.getItem('forum_leaderboard') || '{"hosts":[]}');
                    const hosts = Array.isArray(lb.hosts) ? lb.hosts : [];
                    const myAvatar = getCurrentUserLiveAvatar();
                    const mine = hosts.find(h => h.name === host);
                    if (mine) {
                        if (myAvatar) mine.avatar = myAvatar;
                    } else {
                        hosts.push({ name: host, avatar: myAvatar, totalValue: 0 });
                    }
                    localStorage.setItem('forum_leaderboard', JSON.stringify({ hosts }));
                    const rank = Math.max(1, hosts.sort((a, b) => (Number(b.totalValue) || 0) - (Number(a.totalValue) || 0)).findIndex(h => h.name === host) + 1);
                    forumState.currentLiveRoom.lastAnnouncedRank = rank;
                } catch (e) {}
            }

            // Check for saved state
            const roomStateKey = `forum_live_state_${host}`;
            const savedStateStr = localStorage.getItem(roomStateKey);
            if (isHostMode) {
                localStorage.removeItem(roomStateKey);
            } else if (savedStateStr) {
                try {
                    const savedState = JSON.parse(savedStateStr);
                    // Only restore if saved state is relatively fresh (e.g. within 24 hours) or just restore always? 
                    // User asked for persistence even after refresh, so let's restore always.
                    if (savedState.actionDesc) {
                        actionDesc = savedState.actionDesc;
                        forumState.currentLiveRoom.actionDesc = actionDesc;
                    }
                    if (savedState.comments && Array.isArray(savedState.comments)) {
                        forumState.currentLiveRoom.comments = savedState.comments;
                    }
                } catch (e) {
                    console.error("Failed to restore live room state", e);
                }
            }
            
            // Set action description
            let actionDescHtml = '';
            if (actionDesc && actionDesc !== 'undefined') {
                actionDescHtml = `<div style="text-align:center; font-size: 15px; color: white; background: rgba(0,0,0,0.3); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); padding: 12px 20px; border-radius: 20px; display: inline-block; max-width: 85%; max-height: 250px; overflow-y: auto; line-height: 1.5; pointer-events: auto; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${actionDesc}</div>`;
            }
            
            const roomBg = document.querySelector('.forum-room-bg');
            if (roomBg) {
                if (forumState.currentLiveWallpaper) {
                    roomBg.style.backgroundImage = `url('${forumState.currentLiveWallpaper}')`;
                    roomBg.style.backgroundSize = 'cover';
                    roomBg.style.backgroundPosition = 'center';
                    roomBg.innerHTML = '';
                } else {
                    roomBg.style.backgroundImage = '';
                    roomBg.innerHTML = `
                        <div style="text-align:center; opacity:0.3; display: flex; flex-direction: column; align-items: center; position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                            <div style="font-size:14px; margin-top:10px;">LIVE FEED</div>
                        </div>
                    `;
                }
            }

            const descContainer = document.querySelector('.forum-room-desc-container');
            if (descContainer) {
                descContainer.classList.remove('pk-mode');
                descContainer.innerHTML = actionDescHtml;
            }
            window.renderPkPanel();

            const viewersEl = document.getElementById('forum-room-viewers');
            if (viewersEl) {
                viewersEl.textContent = `${forumState.currentLiveRoom.viewers} 在看`;
            }
            const giftBtn = document.getElementById('forum-live-gift-btn');
            const suggestBtn = document.getElementById('forum-live-suggest-btn');
            const input = document.getElementById('forum-live-input');
            const endBtn = document.getElementById('forum-live-end-btn');
            const followBtn = document.getElementById('forum-room-follow-btn');
            if (giftBtn && suggestBtn && input) {
                if (isHostMode) {
                    giftBtn.style.display = 'none';
                    suggestBtn.style.display = 'flex';
                    input.placeholder = '输入你此刻的画面描述/行动，回车同步';
                    if (endBtn) endBtn.style.display = 'flex';
                    if (followBtn) followBtn.style.display = 'none';
                } else {
                    giftBtn.style.display = 'flex';
                    suggestBtn.style.display = 'none';
                    input.placeholder = 'Say something...';
                    if (endBtn) endBtn.style.display = 'none';
                    if (followBtn) followBtn.style.display = 'inline-flex';
                }
            }

            // Set initial comments
            const chatArea = document.querySelector('.forum-room-chat-area');
            if (chatArea) {
                chatArea.innerHTML = ''; // Clear previous comments
                
                // Initialize wrapper
                const wrapper = document.createElement('div');
                wrapper.className = 'forum-chat-list-wrapper';
                // wrapper.style.cssText = 'display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; padding-bottom: 10px;';
                // Rely on CSS class
                chatArea.appendChild(wrapper);

                // If we restored comments, render them immediately
                if (forumState.currentLiveRoom.comments.length > 0) {
                     forumState.currentLiveRoom.comments.forEach(c => {
                        const color = c.isUser ? '#ff2d55' : 'white';
                        const newMsg = document.createElement('div');
                        newMsg.className = 'forum-room-chat-msg';
                        // Handle potential icon HTML in content (for gifts)
                        newMsg.innerHTML = `<span style="color: ${color}; font-weight: 600; margin-right: 6px;">${c.username}</span>${c.content}`;
                        wrapper.appendChild(newMsg);
                    });
                    // Scroll to bottom
                    chatArea.scrollTop = chatArea.scrollHeight;
                } else {
                    // Load initial comments if no saved state
                    try {
                        const comments = JSON.parse(decodeURIComponent(initialCommentsStr));
                        if (Array.isArray(comments)) {
                            if (isHostMode) {
                                const rankTip = { username: '系统', content: '送礼可帮助主播冲榜，礼物越多冲榜越快！', isUser: false };
                                forumState.currentLiveRoom.comments.push(rankTip);
                                window.appendForumLiveMessage(`<span style="color:#ffd60a;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.92);">${rankTip.content}</span>`);
                            }
                            comments.forEach((c, index) => {
                                setTimeout(() => {
                                    window.appendForumLiveMessage(`<span style="color: white; font-weight: 600; margin-right: 6px;">${c.username}</span>${c.content}`);
                                    if (forumState.currentLiveRoom) {
                                        // Avoid pushing twice if appendForumLiveMessage handles logic, but here it's just appending to DOM.
                                        // But wait, appendForumLiveMessage calls saveLiveRoomState which uses forumState.currentLiveRoom.comments.
                                        // So we must push to state BEFORE calling appendForumLiveMessage if we want it saved correctly?
                                        // Actually appendForumLiveMessage logic above is just UI append. State update is separate in original code.
                                        // My modified appendForumLiveMessage saves current state.
                                        // So we update state, then call append.
                                        forumState.currentLiveRoom.comments.push({ username: c.username, content: c.content, isUser: false });
                                        // But appendForumLiveMessage uses the HTML content passed to it.
                                        // Let's stick to original flow: Render UI -> Update State -> Save State.
                                        // But wait, appendForumLiveMessage calls saveLiveRoomState.
                                        // saveLiveRoomState saves `forumState.currentLiveRoom.comments`.
                                        // So we must push to `comments` BEFORE calling `appendForumLiveMessage`?
                                        // No, original code pushed AFTER.
                                        // If I call save inside append, it will save the OLD comments array (missing the one currently being added).
                                        // Fix: update state FIRST.
                                    }
                                    // Actually, appendForumLiveMessage is purely UI.
                                    // I should update saveLiveRoomState to be called explicitly or move the push before.
                                }, 400 + index * 1000);
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing initial comments', e);
                        // Fallback default comments
                        setTimeout(() => {
                            if (forumState.currentLiveRoom) forumState.currentLiveRoom.comments.push({ username: 'Alex', content: 'Hello! 👋', isUser: false });
                            window.appendForumLiveMessage(`<span style="color: white; font-weight: 600; margin-right: 6px;">Alex</span>Hello! 👋`);
                        }, 400);
                        setTimeout(() => {
                            if (forumState.currentLiveRoom) forumState.currentLiveRoom.comments.push({ username: 'Sarah_99', content: 'Love the vibe here', isUser: false });
                            window.appendForumLiveMessage(`<span style="color: white; font-weight: 600; margin-right: 6px;">Sarah_99</span>Love the vibe here`);
                        }, 1400);
                    }
                }
            }

            document.getElementById('forum-room-page').classList.add('active');

            // Start NPC gift loop
            window._startNpcGiftLoop();

            // Ensure leaderboard is updated with this host if new
            if (host) {
                // Initialize if not present
                const lb = JSON.parse(localStorage.getItem('forum_leaderboard') || '{"hosts":[]}');
                const exists = lb.hosts.find(h => h.name === host);
                if (!exists) {
                     lb.hosts.push({ name: host, avatar: avatarUrl, totalValue: 0 });
                     localStorage.setItem('forum_leaderboard', JSON.stringify(lb));
                }
            }

        };

        // --- NPC Random Gift System ---
        let _npcGiftTimer = null;
        let _heartTimer = null;

        // Show host gift notification banner
        window._showHostGiftBanner = function(senderName, giftEmoji, giftName, count, totalValue, giftColor) {
            const roomPage = document.getElementById('forum-room-page');
            if (!roomPage) return;

            // Remove existing banner if any
            const existing = roomPage.querySelector('.host-gift-banner');
            if (existing) existing.remove();

            const countLabel = count > 1 ? ` ×${count}` : '';
            const banner = document.createElement('div');
            banner.className = 'host-gift-banner';
            banner.style.cssText = `
                position: absolute;
                top: 120px;
                left: 50%;
                transform: translateX(-50%) translateY(-20px);
                background: linear-gradient(135deg, rgba(0,0,0,0.85), rgba(30,30,30,0.92));
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid ${giftColor || '#ffd60a'}55;
                border-radius: 20px;
                padding: 14px 22px;
                display: flex;
                align-items: center;
                gap: 14px;
                z-index: 600;
                min-width: 240px;
                max-width: 85%;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${giftColor || '#ffd60a'}22;
                animation: hostGiftBannerIn 0.4s cubic-bezier(0.16,1,0.3,1) forwards;
                pointer-events: none;
                white-space: nowrap;
            `;

            banner.innerHTML = `
                <div style="font-size:44px;line-height:1;flex-shrink:0;filter:drop-shadow(0 2px 8px ${giftColor || '#ffd60a'}88);">${giftEmoji}</div>
                <div style="display:flex;flex-direction:column;min-width:0;">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                        <span style="color:rgba(255,255,255,0.6);font-size:11px;font-weight:600;letter-spacing:0.5px;">🎁 收到礼物</span>
                    </div>
                    <div style="color:white;font-size:15px;font-weight:700;overflow:hidden;text-overflow:ellipsis;">
                        <span style="color:white;">${senderName}</span> <span style="font-weight:normal; font-size:13px; color:rgba(255,255,255,0.7);">送出了</span> <span style="color:${giftColor || '#ffd60a'};">${giftName}${countLabel}</span>
                    </div>
                    <div style="margin-top:5px;display:flex;align-items:center;gap:8px;">
                        <span style="background:${giftColor || '#ffd60a'}33;border:1px solid ${giftColor || '#ffd60a'}66;color:${giftColor || '#ffd60a'};font-size:12px;font-weight:800;padding:2px 10px;border-radius:10px;">¥${totalValue}</span>
                        <span style="color:rgba(255,255,255,0.4);font-size:11px;">已到账 ✓</span>
                    </div>
                </div>
            `;

            roomPage.appendChild(banner);

            // Fade out after 3.5 seconds
            setTimeout(() => {
                banner.style.animation = 'hostGiftBannerOut 0.4s ease forwards';
                setTimeout(() => banner.remove(), 400);
            }, 3500);
        };

        // Show floating Danmaku for expensive gifts
        window._showGiftDanmaku = function(senderName, giftEmoji, giftName, message, giftColor) {
            const roomPage = document.getElementById('forum-room-page');
            if (!roomPage) return;

            const danmaku = document.createElement('div');
            danmaku.className = 'forum-gift-danmaku';
            // Random vertical position (top 20% to 60%)
            const topPos = 20 + Math.random() * 40;
            danmaku.style.top = topPos + '%';
            
            danmaku.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); padding: 8px 16px; border-radius: 20px; border: 1px solid ${giftColor}66; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                    <span style="color:white; font-weight:700; font-size:14px;">${senderName}</span>
                    <span style="color:rgba(255,255,255,0.7); font-size:13px;">送出 ${giftName} ${giftEmoji}</span>
                    <span style="color:${giftColor}; font-weight:600; font-size:14px; margin-left:4px;">: ${message}</span>
                </div>
            `;

            roomPage.appendChild(danmaku);

            // Cleanup after animation (assumed 6s duration)
            setTimeout(() => {
                danmaku.remove();
            }, 6100);
        };

        window._startNpcGiftLoop = function() {
            window._stopNpcGiftLoop();
            
            // --- 1. Start Auto-Like Loop (Simulation) ---
            function scheduleHeart() {
                const delay = 300 + Math.random() * 1200; // Random hearts every 0.3-1.5s
                _heartTimer = setTimeout(() => {
                    if (typeof spawnFloatingHeart === 'function') spawnFloatingHeart();
                    scheduleHeart();
                }, delay);
            }
            scheduleHeart();
        };

        // Function to trigger 1-2 NPC gifts immediately (called by AI generation)
        window._triggerNpcGift = function(giftEvents) {
            const roomPage = document.getElementById('forum-room-page');
            if (!roomPage || !roomPage.classList.contains('active')) return;

            // Helper to find gift object by name
            const findGift = (name) => FORUM_GIFTS.find(g => name && name.includes(g.name)) || FORUM_GIFTS[Math.floor(Math.random() * FORUM_GIFTS.length)];

            let events = giftEvents;
            // Fallback if no events provided or empty array (rare case if AI fails)
            if (!events || !Array.isArray(events) || events.length === 0) {
                 // Force 2 random gifts to keep the stream alive
                 const mockNames = ['神秘粉丝', '路人甲', 'BigFan', 'yuki酱'];
                 const expensiveGifts = ['皇冠', '火箭', '钻石'];
                 const normalGifts = ['玫瑰', '棒棒糖', '爱心'];
                 events = [
                     { username: mockNames[Math.floor(Math.random()*mockNames.length)], gift_name: expensiveGifts[Math.floor(Math.random()*expensiveGifts.length)], count: 2 + Math.floor(Math.random()*3), comment: '主播好棒！' },
                     { username: mockNames[Math.floor(Math.random()*mockNames.length)], gift_name: normalGifts[Math.floor(Math.random()*normalGifts.length)], count: 1 + Math.floor(Math.random()*3), comment: '' }
                 ];
            }

            events.forEach((event, i) => {
                setTimeout(() => {
                    // Filter out current user if AI made a mistake
                    const myName = forumState.currentUser.bio || forumState.currentUser.username || '我';
                    if (event.username === myName || event.username === '我' || event.username === 'Admin') return;

                    const gift = findGift(event.gift_name);
                    const rawCount = parseInt(event.count, 10);
                    const count = Number.isFinite(rawCount) && rawCount > 0
                        ? Math.min(99, rawCount)
                        : (Math.random() < 0.35 ? (2 + Math.floor(Math.random() * 4)) : 1);
                    const totalValue = gift.value * count;
                    const npc = event.username || '神秘观众';
                    const comment = event.comment || '';

                    // 1. Show in chat
                    let chatMsg = `<span style="color:white;font-weight:700;margin-right:6px;">${npc}</span>` +
                                  `<span style="color:rgba(255,255,255,0.7);font-size:12px;">送出了 ${gift.name} ${gift.emoji}${count > 1 ? ` x${count}` : ''}</span>`;
                    
                    if (gift.value >= 50 && comment) {
                        chatMsg += ` <span style="color:white;font-size:14px;margin-left:4px;">${comment}</span>`;
                    }
                    window.appendForumLiveMessage(chatMsg);

                    // 2. Host visibility + high-value danmaku
                    if (window._showHostGiftBanner) {
                        window._showHostGiftBanner(npc, gift.emoji, gift.name, count, totalValue, gift.color);
                    }
                    if (gift.value >= 50) {
                        // High Value -> Danmaku with comment
                        window._showGiftDanmaku(npc, gift.emoji, gift.name, comment, gift.color);
                    }
                    
                    // 3. Floating Emoji Animation (Always)
                    const anim = document.createElement('div');
                    anim.className = 'forum-gift-anim';
                    anim.style.cssText = 'font-size:80px; display:flex; justify-content:center; align-items:center;';
                    anim.textContent = gift.emoji;
                    if (count > 1) {
                        const badge = document.createElement('div');
                        badge.style.cssText = 'position:absolute;bottom:-10px;right:-20px;background:' + gift.color + ';color:white;font-size:16px;font-weight:800;border-radius:12px;padding:4px 8px;';
                        badge.textContent = 'x' + count;
                        anim.appendChild(badge);
                    }
                    roomPage.appendChild(anim);
                    setTimeout(() => anim.remove(), 2100);

                    // 4. Update Leaderboard & LocalStorage
                     const giftEvent = {
                        id: Date.now() + i,
                        sender: npc,
                        giftName: gift.name,
                        giftEmoji: gift.emoji,
                        count: count,
                        value: totalValue,
                        host: forumState.currentLiveRoom ? forumState.currentLiveRoom.host : '',
                        isNpc: true
                    };
                    localStorage.setItem('forum_live_gift_event', JSON.stringify(giftEvent));

                    if (forumState.currentLiveRoom) {
                        const hostAvatar = forumState.currentLiveRoom.mode === 'host'
                            ? ((forumState.currentUser && forumState.currentUser.avatar) || '')
                            : '';
                        updateLeaderboard(forumState.currentLiveRoom.host, totalValue, hostAvatar);
                        if (forumState.currentLiveRoom.mode === 'host') {
                            forumState.currentLiveRoom.sessionGiftIncome = Math.max(0, Number(forumState.currentLiveRoom.sessionGiftIncome) || 0) + totalValue;
                        }
                    }

                }, i * 1500); // Stagger if multiple
            });
        };

        window._stopNpcGiftLoop = function() {
            if (_npcGiftTimer) { clearTimeout(_npcGiftTimer); _npcGiftTimer = null; }
        };

        // --- Floating Hearts System ---
        const heartEmojis = ['❤️', '🧡', '💛', '💚', '💙', '💜', '🩷', '🤍', '💖', '💗', '💓', '🔥'];

        function spawnFloatingHeart() {
            const roomPage = document.getElementById('forum-room-page');
            if (!roomPage || !roomPage.classList.contains('active')) return;

            let container = roomPage.querySelector('.heart-float-container');
            if (!container) {
                container = document.createElement('div');
                container.className = 'heart-float-container';
                roomPage.appendChild(container);
            }

            const heart = document.createElement('span');
            heart.className = 'heart-float';
            heart.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];

            // Randomise the CSS rotation variables used in the keyframe animation
            const r = () => (Math.random() * 24 - 12).toFixed(1) + 'deg';
            heart.style.setProperty('--hr',  r());
            heart.style.setProperty('--hr2', r());
            heart.style.setProperty('--hr3', r());
            heart.style.setProperty('--hr4', r());
            heart.style.setProperty('--hr5', r());
            // Slight horizontal jitter so hearts don't all stack perfectly
            heart.style.right = (Math.random() * 30).toFixed(0) + 'px';
            heart.style.fontSize = (22 + Math.random() * 12).toFixed(0) + 'px';

            container.appendChild(heart);
            // Remove element after animation completes (3 s)
            setTimeout(() => heart.remove(), 3100);
        }

        window._startHeartLoop = function() {
            window._stopHeartLoop();
            let burstCount = 0;

            function scheduleBurst() {
                // Random interval: 1.5 – 5 seconds between bursts
                const delay = 1500 + Math.random() * 3500;
                _heartTimer = setTimeout(() => {
                    const roomPage = document.getElementById('forum-room-page');
                    if (!roomPage || !roomPage.classList.contains('active')) return;

                    // Spawn 1-4 hearts in rapid succession per burst
                    const count = 1 + Math.floor(Math.random() * 4);
                    for (let i = 0; i < count; i++) {
                        setTimeout(() => spawnFloatingHeart(), i * 180);
                    }
                    scheduleBurst();
                }, delay);
            }
            scheduleBurst();
        };

        window._stopHeartLoop = function() {
            if (_heartTimer) { clearTimeout(_heartTimer); _heartTimer = null; }
        };

        window.closeForumLiveRoom = function() {
            if (forumState.currentLiveRoom) {
                clearPkTimer(forumState.currentLiveRoom);
                if (forumState.currentLiveRoom.pk) forumState.currentLiveRoom.pk = createEmptyPkState();
            }
            document.getElementById('forum-room-page').classList.remove('active');
            const giftMenu = document.getElementById('forum-gift-menu');
            if (giftMenu) giftMenu.classList.remove('active');
            const actionMenu = document.getElementById('forum-action-suggestion-menu');
            if (actionMenu) actionMenu.classList.remove('active');
            const leaderboard = document.getElementById('forum-leaderboard-overlay');
            if (leaderboard) leaderboard.classList.remove('active');
            const pkPanel = document.getElementById('forum-pk-panel');
            if (pkPanel) pkPanel.style.display = 'none';
            const summary = document.getElementById('host-live-summary-overlay');
            if (summary) summary.remove();
            window._stopNpcGiftLoop();
            window._stopHeartLoop();
        };

        window.toggleForumGiftMenu = function() {
            document.getElementById('forum-gift-menu').classList.toggle('active');
        };

        // --- Live Wallpaper Logic ---
        window.toggleLiveWallpaperMenu = function() {
            const menu = document.getElementById('forum-wallpaper-menu');
            if (menu) {
                menu.classList.toggle('active');
                if (menu.classList.contains('active')) {
                    window.renderRoomWallpaperGrid();
                }
            }
        };

        window.renderRoomWallpaperGrid = function() {
            const grid = document.getElementById('forum-wallpaper-grid');
            if (!grid) return;

            const wallpapers = forumState.liveWallpapers || [];
            const isDefaultSelected = !forumState.currentLiveWallpaper;

            const gridHtml = wallpapers.map((img, index) => {
                const isSelected = forumState.currentLiveWallpaper === img;
                return `
                    <div class="live-wallpaper-item" onclick="window.setRoomWallpaper('${img}')" style="position: relative; aspect-ratio: 9/16; background-image: url('${img}'); background-size: cover; background-position: center; border-radius: 8px; overflow: hidden; cursor: pointer; border: ${isSelected ? '3px solid #0095f6' : '1px solid #ddd'};">
                        ${isSelected ? '<div style="position: absolute; top: 5px; right: 5px; background: #0095f6; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; justify-content: center; align-items: center; font-size: 12px;"><i class="fas fa-check"></i></div>' : ''}
                        <div onclick="window.deleteRoomWallpaper(event, ${index})" style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; font-size: 12px; cursor: pointer;"><i class="fas fa-trash"></i></div>
                    </div>
                `;
            }).join('');

            const defaultHtml = `
                <div class="live-wallpaper-item" onclick="window.setRoomWallpaper('')" style="aspect-ratio: 9/16; background: #f0f2f5; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; border: ${isDefaultSelected ? '3px solid #0095f6' : '1px solid #ddd'}; color: #666; font-size: 13px;">
                    默认
                    ${isDefaultSelected ? '<div style="position: absolute; top: 5px; right: 5px; background: #0095f6; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; justify-content: center; align-items: center; font-size: 12px;"><i class="fas fa-check"></i></div>' : ''}
                </div>
            `;

            grid.innerHTML = defaultHtml + gridHtml;
        };

        window.handleRoomWallpaperUpload = function(input) {
            if (input.files && input.files.length > 0) {
                Array.from(input.files).forEach(file => {
                    const reader = new FileReader();
                    reader.onload = async (e) => {
                        try {
                            const compressed = await compressImage(e.target.result, 0.7, 800);
                            if (!forumState.liveWallpapers) forumState.liveWallpapers = [];
                            forumState.liveWallpapers.unshift(compressed);
                            localStorage.setItem('forum_liveWallpapers', JSON.stringify(forumState.liveWallpapers));
                            window.renderRoomWallpaperGrid();
                        } catch (err) {
                            console.error("Image upload failed", err);
                            alert("图片处理失败");
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }
        };

        window.setRoomWallpaper = function(img) {
            forumState.currentLiveWallpaper = img;
            localStorage.setItem('forum_currentLiveWallpaper', img);
            
            // Apply immediately
            const bgDiv = document.querySelector('.forum-room-bg');
            if (bgDiv) {
                if (img) {
                    bgDiv.style.backgroundImage = `url('${img}')`;
                    bgDiv.style.backgroundSize = 'cover';
                    bgDiv.style.backgroundPosition = 'center';
                    bgDiv.innerHTML = ''; // Clear default SVG content
                } else {
                    bgDiv.style.backgroundImage = '';
                    // Restore default SVG
                    bgDiv.innerHTML = `
                        <div style="text-align:center; opacity:0.3; display: flex; flex-direction: column; align-items: center; position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%);">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                            <div style="font-size:14px; margin-top:10px;">LIVE FEED</div>
                        </div>
                    `;
                }
            }
            window.renderRoomWallpaperGrid();
        };

        window.deleteRoomWallpaper = function(e, index) {
            e.stopPropagation();
            if (confirm('确定删除这张壁纸吗？')) {
                const deletedImg = forumState.liveWallpapers[index];
                forumState.liveWallpapers.splice(index, 1);
                
                if (forumState.currentLiveWallpaper === deletedImg) {
                    window.setRoomWallpaper('');
                }
                
                localStorage.setItem('forum_liveWallpapers', JSON.stringify(forumState.liveWallpapers));
                window.renderRoomWallpaperGrid();
            }
        };

        // --- Leaderboard Logic ---
        window.toggleLeaderboard = function() {
            const el = document.getElementById('forum-leaderboard-overlay');
            if (el) {
                el.classList.toggle('active');
                if (el.classList.contains('active')) {
                    window.renderLeaderboardOverlay();
                }
            }
        };

        window.renderLeaderboardOverlay = function() {
            const container = document.getElementById('forum-leaderboard-list');
            if (!container) return;

            const lb = JSON.parse(localStorage.getItem('forum_leaderboard') || '{"hosts":[]}');
            let hosts = lb.hosts || [];
            
            // Ensure current host is in the list just in case
            if (forumState.currentLiveRoom && !hosts.find(h => h.name === forumState.currentLiveRoom.host)) {
                // If not found (maybe initial load issue), add with 0
                hosts.push({ name: forumState.currentLiveRoom.host, avatar: '', totalValue: 0 });
            }

            // Sort descending
            hosts.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));

            // Take top 20
            const topHosts = hosts.slice(0, 20);
            
            const currentHostName = forumState.currentLiveRoom ? forumState.currentLiveRoom.host : '';
            const isHostMode = !!(forumState.currentLiveRoom && forumState.currentLiveRoom.mode === 'host');
            const isLinkBusy = !!(forumState.currentLiveRoom && forumState.currentLiveRoom.pk && forumState.currentLiveRoom.pk.enabled);
            const activeInviteName = (isHostMode && forumState.currentLiveRoom && forumState.currentLiveRoom.pk && forumState.currentLiveRoom.pk.phase === 'inviting')
                ? String(forumState.currentLiveRoom.pk.inviteTargetName || '')
                : '';

            const listHtml = topHosts.map((h, index) => {
                const isCurrent = h.name === currentHostName;
                const isInvitingThis = !!activeInviteName && activeInviteName === h.name;
                const rank = index + 1;
                const rowAvatar = (isCurrent && isHostMode)
                    ? getCurrentUserLiveAvatar()
                    : (resolveLeaderboardAvatarByHost(h.name) || h.avatar || `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(h.name)}`);
                let rankClass = 'rank-other';
                if (rank === 1) rankClass = 'rank-1';
                else if (rank === 2) rankClass = 'rank-2';
                else if (rank === 3) rankClass = 'rank-3';
                const inviteHtml = (isHostMode && !isCurrent && !isLinkBusy)
                    ? `<button ${isInvitingThis ? 'disabled' : ''} onclick="window.handleLeaderboardInviteClick('${encodeURIComponent(h.name).replace(/'/g, '%27')}')" class="forum-leaderboard-invite-btn ${isInvitingThis ? 'is-pending' : ''}">${isInvitingThis ? '邀请中' : '邀请'}</button>`
                    : '';

                return `
                    <div class="leaderboard-item ${isCurrent ? 'current-host' : ''}" style="display: flex; align-items: center; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <div class="lb-rank ${rankClass}" style="width: 30px; font-weight: 800; font-size: 16px; text-align: center; margin-right: 10px; font-style: italic;">${rank}</div>
                        <div style="width: 40px; height: 40px; border-radius: 50%; overflow: hidden; margin-right: 10px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.2);">
                            <img src="${rowAvatar}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${h.name}</div>
                        </div>
                        <div style="font-weight: 700; color: #ffd60a; font-size: 14px;">${formatCount(h.totalValue)} 🪙</div>
                        ${inviteHtml}
                    </div>
                `;
            }).join('');

            container.innerHTML = listHtml;
            
            // Update current rank display in header if exists
            const myRankIndex = hosts.findIndex(h => h.name === currentHostName);
            const rankBadge = document.getElementById('live-rank-badge');
            if (rankBadge) {
                if (myRankIndex !== -1) {
                    rankBadge.innerHTML = `NO.${myRankIndex + 1}`;
                    rankBadge.style.display = 'flex';
                } else {
                    rankBadge.style.display = 'none';
                }
            }
        };

        let selectedGiftIcon = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ff2d55" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-8"/><path d="M12 14a4 4 0 0 0 4-4 4 4 0 0 0-4-4 4 4 0 0 0-4 4 4 4 0 0 0 4 4z"/><path d="M12 14c-2.2 0-4 1.8-4 4s1.8 4 4 4"/><path d="M12 14c2.2 0 4 1.8 4 4s-1.8 4-4 4"/></svg>';

        window.selectForumGift = function(el) {
            document.querySelectorAll('.forum-gift-item').forEach(item => item.classList.remove('active'));
            el.classList.add('active');
            // Update selected icon based on the element
            const emoji = el.querySelector('.forum-gift-icon').innerText;
            selectedGiftIcon = `<div style="font-size:32px;">${emoji}</div>`;
        };

        window.sendForumGift = function() {
            const countInput = document.getElementById('forum-gift-count');
            const count = parseInt(countInput ? countInput.value : 1);
            if (count < 1) return;
            
            // Determine gift value
            const activeGiftItem = document.querySelector('.forum-gift-item.active');
            let giftValue = 10;
            let giftName = 'Gift';
            let giftEmoji = '🎁';
            let giftColor = '#ffd60a';
            
            if (activeGiftItem) {
                giftValue = parseInt(activeGiftItem.dataset.price || 10);
                giftName = activeGiftItem.dataset.name || 'Gift';
                giftEmoji = activeGiftItem.querySelector('.forum-gift-icon').innerText;
                giftColor = activeGiftItem.dataset.color || '#ffd60a';
            }

            const totalValue = giftValue * count;
            const wallet = getForumWalletState();
            if (wallet.isGenerating) {
                alert('钱包初始化中，请稍后再试');
                return;
            }
            if (!wallet.initialized) {
                const initBase = fallbackInitialWalletBalance(
                    (forumState.currentUser && forumState.currentUser.publicIdentity) || '',
                    (forumState.currentUser && forumState.currentUser.followers) || 0
                );
                wallet.initialized = true;
                wallet.balance = Math.max(0, Number(wallet.balance) || initBase);
                wallet.transactions = Array.isArray(wallet.transactions) ? wallet.transactions : [];
                saveForumWalletState();
            }
            if (!applyWalletGiftExpense(totalValue, giftName, count, giftEmoji)) return;

            window.toggleForumGiftMenu();
            
            const myName = forumState.currentUser.bio || forumState.currentUser.username || '我';

            // 1. Add to chat (Unified Style)
            window.appendForumLiveMessage(
                `<span style="color:white;font-weight:700;margin-right:6px;">${myName}</span>` +
                `<span style="color:rgba(255,255,255,0.7);font-size:12px;">送出了 ${giftName} ${giftEmoji}</span>`
            );

            // 2. High Value -> Danmaku (Consistency)
            if (giftValue >= 50) {
                window._showGiftDanmaku(myName, giftEmoji, giftName, '', giftColor); // User gifts usually don't carry text unless we add input
            }
            if (window._showHostGiftBanner) {
                window._showHostGiftBanner(myName, giftEmoji, giftName, count, totalValue, giftColor);
            }

            // 3. Show animation (Unified Style)
            const anim = document.createElement('div');
            anim.className = 'forum-gift-anim';
            anim.style.cssText = 'font-size:80px; display:flex; justify-content:center; align-items:center;';
            anim.textContent = giftEmoji;
            
            // Add count badge
            if (count > 1) {
                const badge = document.createElement('div');
                badge.style.cssText = 'position:absolute; bottom:-10px; right:-20px; background:' + giftColor + ';color:white;font-size:16px;font-weight:800;border-radius:12px;padding:4px 8px;';
                badge.innerText = 'x' + count;
                anim.appendChild(badge);
            }
            
            const roomPage = document.getElementById('forum-room-page');
            if (roomPage) roomPage.appendChild(anim);
            
            setTimeout(() => {
                anim.remove();
            }, 2100);

            // 1. Update Leaderboard
            if (forumState.currentLiveRoom) {
                // Get avatar from DOM if possible, or fallback
                let avatarUrl = '';
                const avatarImg = document.querySelector('.forum-room-host-avatar img');
                if (avatarImg) avatarUrl = avatarImg.src;
                
                updateLeaderboard(forumState.currentLiveRoom.host, totalValue, avatarUrl);
                
                // 2. Notify Host Page (via localStorage event)
                const giftEvent = {
                    id: Date.now(),
                    sender: myName,
                    giftName: giftName,
                    giftEmoji: giftEmoji,
                    count: count,
                    value: totalValue,
                    host: forumState.currentLiveRoom.host,
                    icon: selectedGiftIcon
                };
                localStorage.setItem('forum_live_gift_event', JSON.stringify(giftEvent));
                maybeSyncLiveEventToChat(
                    forumState.currentLiveRoom,
                    `[直播间送礼]: ${myName} -> ${giftName}${count > 1 ? ` x${count}` : ''} (¥${totalValue})`,
                    'system',
                    'system_event'
                );
            }
        };

        window.handleLeaderboardInviteClick = function(encodedHostName) {
            const hostName = decodeURIComponent(encodedHostName || '');
            if (!hostName) return;
            const room = forumState.currentLiveRoom;
            if (!room || room.mode !== 'host') return;
            if (room.pk && (room.pk.enabled || room.pk.phase === 'inviting')) {
                alert(room.pk.phase === 'inviting' ? '邀请判定中，请稍候。' : '当前已在PK中，请先结束本场PK。');
                return;
            }
            const target = resolvePkInviteTarget(hostName);
            if (!target || !target.name) return;
            const loadingMsg = `已向 ${target.name} 发出PK邀请，等待回应...`;
            window.appendForumLiveMessage(
                `<span style="color:#ffd60a;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.92);">${loadingMsg}</span>`
            );
            room.pk = createEmptyPkState();
            room.pk.phase = 'inviting';
            room.pk.inviteTargetName = target.name;
            window.renderPkPanel();
            if (typeof window.renderLeaderboardOverlay === 'function') window.renderLeaderboardOverlay();
            syncPkEvent(room, `[PK邀请发起] -> ${target.name}`, 'user', 'system_event');

            requestPkInviteDecision(room, target).then((decision) => {
                if (!forumState.currentLiveRoom || forumState.currentLiveRoom !== room) return;
                if (decision.status === 'accepted') {
                    window.appendForumLiveMessage(
                        `<span style="color:#34c759;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.92);">${target.name} 接受了PK邀请，进入预备阶段。</span>`
                    );
                    if (typeof window.toggleLeaderboard === 'function') {
                        const overlay = document.getElementById('forum-leaderboard-overlay');
                        if (overlay && overlay.classList.contains('active')) window.toggleLeaderboard();
                    }
                    window.initPkSession(target);
                } else {
                    const reason = decision.reason ? `（${decision.reason}）` : '';
                    window.appendForumLiveMessage(
                        `<span style="color:#ffd60a;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.92);">${target.name} 暂未接受PK邀请${reason}</span>`
                    );
                    syncPkEvent(room, `[PK邀请拒绝] ${target.name}${reason}`, 'system', 'system_event');
                    room.pk = createEmptyPkState();
                    window.renderPkPanel();
                    if (typeof window.renderLeaderboardOverlay === 'function') window.renderLeaderboardOverlay();
                    alert(`${target.name} 暂未接受PK邀请${reason}`);
                }
            }).catch((err) => {
                if (!forumState.currentLiveRoom || forumState.currentLiveRoom !== room) return;
                const msg = (err && err.message) ? err.message : '邀请判定失败';
                window.appendForumLiveMessage(
                    `<span style="color:#ffd60a;font-weight:700;margin-right:6px;">系统</span><span style="color:rgba(255,255,255,0.92);">邀请失败：${msg}</span>`
                );
                syncPkEvent(room, `[PK邀请失败] ${msg}`, 'system', 'system_event');
                room.pk = createEmptyPkState();
                window.renderPkPanel();
                if (typeof window.renderLeaderboardOverlay === 'function') window.renderLeaderboardOverlay();
                alert(`邀请失败：${msg}`);
            });
        };

        window.handleForumChatEnter = function(e) {
            if (e.key === 'Enter' && e.target.value.trim() !== '') {
                const text = e.target.value.trim();
                const room = forumState.currentLiveRoom;
                if (room && room.pk && room.pk.enabled) {
                    room.pk.leftActionDesc = text;
                    room.actionDesc = text;
                    window.renderPkActionDesc();
                    syncPkEvent(room, `[PK输入] 我方画面描述: "${text}"`, 'user', 'text');
                    e.target.value = '';
                    return;
                }
                if (room && room.mode === 'host') {
                    room.actionDesc = text;
                    room.preGenState = null;
                    const descContainer = document.querySelector('.forum-room-desc-container');
                    if (descContainer) descContainer.innerHTML = renderLiveActionDesc(text);
                    maybeSyncLiveEventToChat(room, `[直播间画面]: "${text}"`, 'user');
                } else {
                    const myName = forumState.currentUser.bio || forumState.currentUser.username || 'Me';
                    window.appendForumLiveMessage(`<span style="color: #ff2d55; font-weight: 600; margin-right: 6px;">${myName}</span>${text}`);
                    if (room) {
                        room.comments.push({ username: myName, content: text, isUser: true });
                        room.preGenState = null;
                        maybeSyncLiveEventToChat(room, `[直播间弹幕]: "${text}"`, 'user');
                        const regenerateBtn = document.getElementById('live-regenerate-btn');
                        if (regenerateBtn) regenerateBtn.style.display = 'none';
                    }
                }
                e.target.value = '';
            }
        };

        window.showLiveEndedScreen = function(hostName) {
            const roomPage = document.getElementById('forum-room-page');
            if (!roomPage) return;

            // Get Rank
            let rank = '99+';
            try {
                const lb = JSON.parse(localStorage.getItem('forum_leaderboard') || '{"hosts":[]}');
                const sorted = lb.hosts.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
                const index = sorted.findIndex(h => h.name === hostName);
                if (index !== -1) rank = index + 1;
            } catch(e) {}

            // Create Overlay
            const endScreen = document.createElement('div');
            endScreen.className = 'live-ended-screen';
            endScreen.style.cssText = `
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
                z-index: 999; display: flex; flex-direction: column; justify-content: center; align-items: center;
                color: white; animation: fadeIn 0.5s ease;
            `;
            
            endScreen.innerHTML = `
                <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">直播已结束</div>
                <div style="font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 40px;">感谢观看</div>
                
                <div style="display: flex; flex-direction: column; align-items: center; gap: 5px;">
                    <div style="font-size: 14px; color: rgba(255,255,255,0.5);">本场排名</div>
                    <div style="font-size: 48px; font-weight: 800; color: #ffd60a; text-shadow: 0 2px 10px rgba(255,214,10,0.3);">NO.${rank}</div>
                </div>

                <div style="margin-top: 60px; padding: 12px 40px; background: rgba(255,255,255,0.15); border-radius: 30px; cursor: pointer; font-weight: 600;" onclick="window.removeEndedLiveStream('${hostName}')">
                    返回大厅
                </div>
            `;
            
            roomPage.appendChild(endScreen);
        };

        window.removeEndedLiveStream = function(hostName) {
            window.closeForumLiveRoom();
            if (forumState && forumState.liveStreams) {
                forumState.liveStreams = forumState.liveStreams.filter(l => l.username !== hostName);
                localStorage.setItem('forum_liveStreams', JSON.stringify(forumState.liveStreams));
                // Refresh the list if we are on the live tab (which is 'video')
                if ((forumState.activeTab === 'live' || forumState.activeTab === 'video') && typeof renderForum === 'function') {
                    renderForum(false);
                }
            }
        };

        window.generateLiveContent = async function() {
            const room = forumState.currentLiveRoom;
            if (!room) return;
            const isPkMode = !!(room.pk && room.pk.enabled);
            let pkUserInput = '';
            if (isPkMode) {
                const input = document.getElementById('forum-live-input');
                pkUserInput = input ? input.value.trim() : '';
                if (pkUserInput) {
                    room.pk.leftActionDesc = pkUserInput;
                    room.actionDesc = pkUserInput;
                    window.renderPkActionDesc();
                }
            }
            const hostLockedActionDesc = room.mode === 'host' ? String(room.actionDesc || '').trim() : '';
            if (!isPkMode && room.mode === 'host') {
                const input = document.getElementById('forum-live-input');
                const draft = input ? input.value.trim() : '';
                if (draft) {
                    room.actionDesc = draft;
                    const descContainer = document.querySelector('.forum-room-desc-container');
                    if (descContainer) descContainer.innerHTML = renderLiveActionDesc(draft);
                }
            }

            const generateBtn = document.getElementById('live-generate-btn');
            const regenerateBtn = document.getElementById('live-regenerate-btn');
            
            if (generateBtn) generateBtn.style.pointerEvents = 'none';
            if (regenerateBtn) regenerateBtn.style.pointerEvents = 'none';
            
            const oldGenIcon = generateBtn ? generateBtn.innerHTML : '';
            if (generateBtn) generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 14px;"></i>';

            try {
                if (isPkMode) {
                    const result = await requestPkGeneratedContent(room, pkUserInput);
                    const rightDesc = String(result.right_action_desc || '').trim();
                    if (rightDesc) room.pk.rightActionDesc = rightDesc;
                    window.renderPkActionDesc();
                    if (rightDesc) syncPkEvent(room, `[PK画面][对方] ${rightDesc}`, 'assistant', 'text');

                    const leftComments = Array.isArray(result.left_comments) ? result.left_comments : [];
                    const rightComments = Array.isArray(result.right_comments) ? result.right_comments : [];
                    leftComments.forEach((c, index) => {
                        setTimeout(() => appendPkChatComment('left', c.username || '我方观众', c.content || '', false), index * 650);
                    });
                    rightComments.forEach((c, index) => {
                        setTimeout(() => appendPkChatComment('right', c.username || '对方观众', c.content || '', false), 260 + index * 650);
                    });

                    const leftGiftEvents = Array.isArray(result.left_gift_events) ? result.left_gift_events : [];
                    const findGift = (name) => FORUM_GIFTS.find(g => name && name.includes(g.name)) || FORUM_GIFTS[0];
                    leftGiftEvents.forEach((event, i) => {
                        setTimeout(() => {
                            const gift = findGift(event.gift_name);
                            const rawCount = parseInt(event.count, 10);
                            const count = Number.isFinite(rawCount) && rawCount > 0 ? Math.min(99, rawCount) : 1;
                            const totalValue = Math.max(0, Number(gift.value) || 0) * count;
                            room.pk.leftGiftValue = Math.max(0, Number(room.pk.leftGiftValue) || 0) + totalValue;
                            room.pk.leftTotalGiftValue = Math.max(0, Number(room.pk.leftTotalGiftValue) || 0) + totalValue;
                            room.sessionGiftIncome = Math.max(0, Number(room.sessionGiftIncome) || 0) + totalValue;
                            updateLeaderboard(room.host, totalValue, getCurrentUserLiveAvatar());
                            const npc = event.username || '我方观众';
                            const comment = event.comment ? ` ${event.comment}` : '';
                            window.appendForumLiveMessage(
                                `<span style="color:#ffffff;font-weight:700;margin-right:6px;">${npc}</span><span style="color:rgba(255,255,255,0.78);">送出 ${gift.name} ${gift.emoji}${count > 1 ? ` x${count}` : ''}</span>${comment}`
                            );
                            room.comments.push({
                                username: npc,
                                content: `送出 ${gift.name}${count > 1 ? ` x${count}` : ''}${comment}`.trim(),
                                side: 'left',
                                isUser: false
                            });
                            syncPkEvent(room, `[PK送礼][我方] ${npc} -> ${gift.name}${count > 1 ? ` x${count}` : ''} (+¥${totalValue})`, 'assistant', 'system_event');
                            window.renderPkPanel();
                            window.renderPkActionDesc();
                        }, 800 + i * 850);
                    });

                    const opponentHostGiftEvents = Array.isArray(result.opponent_host_gift_events) ? result.opponent_host_gift_events : [];
                    opponentHostGiftEvents.forEach((event, i) => {
                        setTimeout(() => {
                            const gift = findGift(event.gift_name);
                            const rawCount = parseInt(event.count, 10);
                            const count = Number.isFinite(rawCount) && rawCount > 0 ? Math.min(99, rawCount) : 1;
                            const totalValue = Math.max(0, Number(gift.value) || 0) * count;
                            const hostName = resolveOpponentSenderName(event.username, room);
                            const comment = event.comment ? ` ${event.comment}` : '';
                            room.pk.leftGiftValue = Math.max(0, Number(room.pk.leftGiftValue) || 0) + totalValue;
                            room.pk.leftTotalGiftValue = Math.max(0, Number(room.pk.leftTotalGiftValue) || 0) + totalValue;
                            room.sessionGiftIncome = Math.max(0, Number(room.sessionGiftIncome) || 0) + totalValue;
                            updateLeaderboard(room.host, totalValue, getCurrentUserLiveAvatar());

                            window.appendForumLiveMessage(
                                `<span class="forum-pk-side-badge right">对方</span><span class="forum-opponent-host-highlight">${hostName}</span><span style="color:rgba(255,255,255,0.82);margin-left:6px;">送出 ${gift.name} ${gift.emoji}${count > 1 ? ` x${count}` : ''}${comment}</span>`
                            );
                            room.comments.push({
                                username: hostName,
                                content: `送出 ${gift.name}${count > 1 ? ` x${count}` : ''}${comment}`.trim(),
                                side: 'right',
                                isUser: false
                            });

                            if (typeof window._showHostGiftBanner === 'function') {
                                window._showHostGiftBanner(hostName, gift.emoji, gift.name, count, totalValue, gift.color);
                            }
                            if (typeof window._showGiftDanmaku === 'function') {
                                window._showGiftDanmaku(hostName, gift.name, gift.emoji, totalValue);
                            }
                            const roomPage = document.querySelector('.forum-room-page');
                            if (roomPage) {
                                const anim = document.createElement('div');
                                anim.className = 'forum-gift-anim';
                                anim.innerHTML = `<div class="forum-gift-emoji">${gift.emoji}</div><div class="forum-gift-name">${gift.name} x${count}</div>`;
                                roomPage.appendChild(anim);
                                setTimeout(() => anim.remove(), 1800);
                            }
                            syncPkEvent(room, `[PK送礼][对方主播->我方] ${hostName} -> ${gift.name}${count > 1 ? ` x${count}` : ''} (+¥${totalValue})`, 'assistant', 'system_event');
                            window.renderPkPanel();
                            window.renderPkActionDesc();
                        }, 1000 + i * 900);
                    });

                    const rightDeltaRaw = Number(result.right_gift_delta);
                    const rightDelta = Number.isFinite(rightDeltaRaw) ? Math.max(0, Math.floor(rightDeltaRaw)) : 0;
                    if (rightDelta > 0) {
                        setTimeout(() => {
                            room.pk.rightGiftValue = Math.max(0, Number(room.pk.rightGiftValue) || 0) + rightDelta;
                            room.pk.rightTotalGiftValue = Math.max(0, Number(room.pk.rightTotalGiftValue) || 0) + rightDelta;
                            updateLeaderboard(room.pk.opponent.name, rightDelta, room.pk.opponent.avatar || '');
                            syncPkEvent(room, `[PK送礼汇总][对方] +¥${rightDelta}`, 'assistant', 'system_event');
                            window.renderPkPanel();
                            window.renderPkActionDesc();
                        }, 1200);
                    }

                    const pkSuggestions = Array.isArray(result.suggested_actions)
                        ? result.suggested_actions.map(x => String(x || '').trim()).filter(Boolean)
                        : [];
                    if (result.next_action_hint) pkSuggestions.unshift(String(result.next_action_hint).trim());
                    room.suggestedActions = pkSuggestions.length > 0 ? pkSuggestions.slice(0, 5) : buildHostActionSuggestions(result, room);

                    window.renderPkPanel();
                    if (regenerateBtn) regenerateBtn.style.display = 'flex';
                    const input = document.getElementById('forum-live-input');
                    if (input) input.value = '';
                    return;
                }

                let settings = { url: '', key: '', model: '' };
                if (window.iphoneSimState) {
                    if (window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url) settings = window.iphoneSimState.aiSettings;
                    else if (window.iphoneSimState.aiSettings2 && window.iphoneSimState.aiSettings2.url) settings = window.iphoneSimState.aiSettings2;
                }

                if (!settings.url || !settings.key) {
                    alert('请先配置AI接口');
                    return;
                }

                const recentComments = room.comments.slice(-10).map(c => `${c.username}: ${c.content}`).join('\n');
                
                let hostPersonaContext = '';
                const myName = forumState.currentUser.bio || forumState.currentUser.username || '我';
                
                if (window.iphoneSimState && window.iphoneSimState.contacts) {
                    const contacts = window.iphoneSimState.contacts;
                    const profiles = forumState.settings.contactProfiles || {};
                    const hostContact = contacts.find(c => {
                        const p = profiles[c.id] || {};
                        return c.remark === room.host || p.name === room.host || c.name === room.host;
                    });
                    
                    if (hostContact) {
                        const hostProfile = profiles[hostContact.id] || {};
                        if (hostContact.persona && hostProfile.knowsUser) {
                            const realName = window.iphoneSimState?.userProfile?.name || '我';
                            let userPersonaText = '';
                            if (hostContact.userPersonaId && window.iphoneSimState.userPersonas) {
                                const up = window.iphoneSimState.userPersonas.find(p => p.id === hostContact.userPersonaId);
                                if (up && up.aiPrompt) {
                                    userPersonaText = `\n此外，关于用户(我)的设定如下：'${up.aiPrompt}'。`;
                                }
                            }
                            hostPersonaContext = `\n请注意：发送弹幕的网名 [${myName}] 其实是现实中你认识的 [${realName}]。你们之间有特殊关系，在以下人设中有描述：'${hostContact.persona}'。${userPersonaText}\n请综合以上人设，主播的反应和动作描述必须严格符合这段关系所定义的语气、口吻和亲密度（例如如果是情侣就亲密，是前任就...视复合情况而定），表现出你认出了他/她。不要像对待陌生人一样对待他。`;
                        }
                    }
                }

            const hostModeExtra = room.mode === 'host' ? `
7. 严格保留当前主播画面描述，不要改写，不要扩写，输出时原样放在 actionDesc 字段。
8. 输出 "suggested_actions"：3-5条给主播下一步参考的行动文案，要求可直接作为画面描述输入。
9. 额外输出 "next_action_hint"：一句20字以内的主播下一步建议。
10. comments 中至少有 1 条要自然提到“送礼可以帮主播冲榜”或类似意思（口语化即可）。` : '';

                const prompt = `你是一个社交平台直播间模拟器。
当前直播间标题: "${room.title}"
主播名字: "${room.host}"
当前主播画面描述: "${room.actionDesc}"
最近的弹幕记录:
${recentComments}${hostPersonaContext}

请根据以上的上下文，生成接下来的直播间互动内容。
要求:
1. 生成一段新的"主播画面/动作描述"，描述主播看到了弹幕（特别是用户"${myName}"的弹幕）后的反应，或者直播内容的推进。
2. 生成 3-5 条新的弹幕评论。其中一部分是对用户"${myName}"的弹幕的回复/反应，一部分是对主播新动作的反应。
3. 必须生成 1-3 个"送礼事件"，并确保包含普通礼物和贵重礼物。礼物必须从以下列表中选择: [玫瑰, 棒棒糖, 皇冠, 火箭, 钻石, 爱心]。
   - 如果是普通礼物(玫瑰/棒棒糖/爱心)，评论必须留空 ("")。
   - 如果是贵重礼物(皇冠/火箭/钻石)，必须附带一条符合送礼氛围的专门评论(如"太强了!", "支持主播")。
   - 每个送礼事件必须提供 count（整数，范围 1-20）。
4. 【重要】所有生成的弹幕发送者和送礼者必须是其他网友(虚拟人)，**绝对不能**使用名字"${myName}"或"我"或"Admin"。
5. 弹幕内容要简短、真实、口语化。
6. 判断是否结束直播：如果用户弹幕暗示结束（如“晚安”、“去睡吧”、“下播吧”），或者主播觉得累了想下播，请将 "should_end" 设为 true，并在 "actionDesc" 中描述主播道别下播的动作。
${hostModeExtra}

返回纯JSON对象，格式如下:
{
  "actionDesc": "新的主播画面描述",
  "should_end": false, // true 表示决定下播
  "comments": [
    { "username": "网友A", "content": "弹幕内容" },
    { "username": "网友B", "content": "弹幕内容" }
  ],
  "gift_events": [
    { "username": "大佬A", "gift_name": "火箭", "count": 3, "comment": "主播加油！" },
    { "username": "粉丝B", "gift_name": "玫瑰", "count": 2, "comment": "" }
  ],
  "suggested_actions": ["下一步建议1", "下一步建议2"],
  "next_action_hint": "主播下一步建议"
}
不要返回任何Markdown标记。`;

                let fetchUrl = settings.url;
                if (!fetchUrl.endsWith('/chat/completions')) fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';

                const response = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.key },
                    body: JSON.stringify({
                        model: settings.model || 'gpt-3.5-turbo',
                        messages: [
                            { role: 'system', content: '你是一个模拟直播间互动数据的生成器，只返回JSON数据。' },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.8
                    })
                });

                if (!response.ok) throw new Error('API request failed');
                const data = await response.json();
                let content = data.choices[0].message.content.trim();
                
                console.log("[Live API Raw Response]:", content);

                // Cleanup Markdown code blocks if present
                content = content.replace(/```json/g, '').replace(/```/g, '').trim();

                // Find first '{' and last '}'
                const startIdx = content.indexOf('{');
                const endIdx = content.lastIndexOf('}');
                
                if (startIdx !== -1 && endIdx !== -1) {
                    content = content.substring(startIdx, endIdx + 1);
                }
                
                // Fix common JSON issues - REMOVED aggressive escaping that breaks JSON structure
                // content = content.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
                
                // For safety, remove some unescaped newlines that might break parsing
                // content = content.replace(/([^\\])\\n/g, '$1\\\\n');
                
                let result;
                try {
                    result = JSON.parse(content);
                } catch (parseError) {
                    console.error("JSON parse error:", parseError, "Content:", content);
                    // Try to repair basic errors
                    let repaired = content.replace(/\\n/g, ' ').replace(/\\r/g, '').replace(/\\t/g, ' ');
                    result = JSON.parse(repaired);
                }

                if (!room.preGenState) {
                    room.preGenState = {
                        actionDesc: room.actionDesc,
                        commentsLength: room.comments.length
                    };
                }

                if (room.mode === 'host') {
                    const locked = hostLockedActionDesc || room.actionDesc || '';
                    room.actionDesc = locked;
                } else {
                    room.actionDesc = result.actionDesc;
                    if (result.actionDesc) {
                        maybeSyncLiveEventToChat(room, `[直播间画面]: "${result.actionDesc}"`, 'system');
                        maybePushLiveDmFromActionDesc(room, result.actionDesc);
                    }
                }
                const descContainer = document.querySelector('.forum-room-desc-container');
                if (descContainer) {
                    descContainer.innerHTML = renderLiveActionDesc(room.actionDesc);
                }

                if (result.comments && Array.isArray(result.comments)) {
                    const myName = forumState.currentUser.bio || forumState.currentUser.username || '我';
                    result.comments.forEach((c, index) => {
                        if (c.username === myName || c.username === '我') return;
                        setTimeout(() => {
                            window.appendForumLiveMessage(`<span style="color: white; font-weight: 600; margin-right: 6px;">${c.username}</span>${c.content}`);
                            room.comments.push({ username: c.username, content: c.content, isUser: false });
                            maybeSyncLiveEventToChat(room, `[直播间互动]: ${c.username}: ${c.content}`, 'assistant');
                        }, 400 + index * 1000);
                    });

                    // Trigger NPC Gifts after comments start appearing
                    setTimeout(() => {
                        if (window._triggerNpcGift) window._triggerNpcGift(result.gift_events);
                    }, 1500);

                    // Handle End Stream
                    if (result.should_end) {
                        setTimeout(() => {
                            if (window.showLiveEndedScreen) window.showLiveEndedScreen(room.host);
                        }, 4000);
                    }
                }

                if (room.mode === 'host') {
                    const fromAi = Array.isArray(result.suggested_actions)
                        ? result.suggested_actions.map(s => String(s || '').trim()).filter(Boolean)
                        : [];
                    if (result.next_action_hint) fromAi.unshift(String(result.next_action_hint).trim());
                    room.suggestedActions = fromAi.length > 0 ? fromAi.slice(0, 5) : buildHostActionSuggestions(result, room);
                    window.renderForumActionSuggestionMenu();
                }

                // Simulate Leaderboard Dynamics (Randomly boost other hosts)
                try {
                    let lb = JSON.parse(localStorage.getItem('forum_leaderboard') || '{"hosts":[]}');
                    if (lb.hosts && lb.hosts.length > 0) {
                        let changed = false;
                        lb.hosts.forEach(h => {
                            // Don't boost current host here, only others
                            if (h.name !== room.host && Math.random() > 0.6) {
                                // Add random value between 10 and 200
                                h.totalValue = (h.totalValue || 0) + Math.floor(Math.random() * 190) + 10;
                                changed = true;
                            }
                        });
                        
                        if (changed) {
                            lb.hosts.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
                            localStorage.setItem('forum_leaderboard', JSON.stringify(lb));
                            
                            // If leaderboard is open, update it
                            const overlay = document.getElementById('forum-leaderboard-overlay');
                            if (overlay && overlay.classList.contains('active')) {
                                window.renderLeaderboardOverlay();
                            }
                        }
                    }
                } catch (e) {
                    console.error("Leaderboard simulation error", e);
                }
                
                if (regenerateBtn) regenerateBtn.style.display = 'flex';

            } catch (e) {
                console.error(e);
                alert('生成失败: ' + e.message);
            } finally {
                if (generateBtn) {
                    generateBtn.innerHTML = oldGenIcon;
                    generateBtn.style.pointerEvents = 'auto';
                }
                if (regenerateBtn) regenerateBtn.style.pointerEvents = 'auto';
            }
        };

        window.regenerateLiveContent = function() {
            const room = forumState.currentLiveRoom;
            if (!room || !room.preGenState) return;

            // Restore UI
            room.actionDesc = room.preGenState.actionDesc;
            const descContainer = document.querySelector('.forum-room-desc-container');
            if (descContainer) {
                descContainer.innerHTML = renderLiveActionDesc(room.actionDesc);
            }

            // Restore comments list
            room.comments = room.comments.slice(0, room.preGenState.commentsLength);
            
            // Re-render chat area
            const chatArea = document.querySelector('.forum-room-chat-area');
            if (chatArea) {
                chatArea.innerHTML = '';
                const wrapper = document.createElement('div');
                wrapper.className = 'forum-chat-list-wrapper';
                // Rely on CSS class
                chatArea.appendChild(wrapper);

                room.comments.forEach(c => {
                    const color = c.isUser ? '#ff2d55' : 'white';
                    const newMsg = document.createElement('div');
                    newMsg.className = 'forum-room-chat-msg';
                    newMsg.innerHTML = `<span style="color: ${color}; font-weight: 600; margin-right: 6px;">${c.username}</span>${c.content}`;
                    wrapper.appendChild(newMsg);
                });
                chatArea.scrollTop = chatArea.scrollHeight;
            }

            // Call generate again
            window.generateLiveContent();
        };

        window.filterForumLiveCategory = function(category) {
            // Update active button state
            document.querySelectorAll('.forum-cat-btn').forEach(btn => {
                btn.classList.remove('active');
                if (btn.innerText === category) {
                    btn.classList.add('active');
                }
            });

            // Filter cards
            const cards = document.querySelectorAll('.forum-live-card');
            cards.forEach(card => {
                const cardCat = card.getAttribute('data-category');
                
                // First hide with animation
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                
                setTimeout(() => {
                    if (category === 'All' || cardCat === category) {
                        card.classList.remove('hidden');
                        // Small delay before showing to allow display block to apply
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1)';
                        }, 50);
                    } else {
                        card.classList.add('hidden');
                    }
                }, 300); // Wait for fade out animation
            });
        };

        window.showForumLiveHeart = function() {
            const heart = document.createElement('div');
            heart.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="#ff2d55" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;
            heart.style.position = 'fixed';
            heart.style.bottom = '100px';
            heart.style.right = '40px';
            heart.style.zIndex = '3000';
            heart.style.pointerEvents = 'none';
            heart.style.transition = 'all 1s ease-out';
            heart.style.transform = `translate(${Math.random()*40 - 20}px, 0) scale(1)`;
            heart.style.opacity = '1';

            document.getElementById('forum-app').appendChild(heart);

            // Animate
            requestAnimationFrame(() => {
                heart.style.transform = `translate(${Math.random()*60 - 30}px, -200px) scale(0.5)`;
                heart.style.opacity = '0';
            });

            setTimeout(() => {
                heart.remove();
            }, 1000);
        };

        // Restore images stored in separate localStorage keys
        loadPostImages();

        // Migration: Fix avatars for existing posts
        if (forumState.posts) {
            let changed = false;
            forumState.posts.forEach(p => {
                if (p.userId) {
                    const expectedAuthor = resolveForumAuthorProfile(p.userId).user;
                    const currentAuthor = p.user || {};
                    if (
                        currentAuthor.name !== expectedAuthor.name ||
                        currentAuthor.avatar !== expectedAuthor.avatar ||
                        currentAuthor.subtitle !== expectedAuthor.subtitle ||
                        String(currentAuthor.id || '') !== String(expectedAuthor.id || '')
                    ) {
                        p.user = { ...expectedAuthor };
                        changed = true;
                    }
                }
                if (p.comments_list) {
                    p.comments_list.forEach(c => {
                        if (c.user && c.user.avatar && c.user.avatar.includes('avataaars')) {
                            c.user.avatar = c.user.avatar.replace('avataaars', 'lorelei');
                            changed = true;
                        }
                    });
                }
            });
            if (changed) {
                saveForumData();
            }
        }

        renderForum();
        
        const closeBtn = document.getElementById('close-forum-app');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                app.classList.add('hidden');
            });
        }
    }

    function renderForum(animate = true) {
        const app = document.getElementById('forum-app');
        
        // Capture scroll position before re-render if not animating (update mode)
        let previousScrollTop = 0;
        if (!animate) {
            const currentContent = document.getElementById('forum-content-area');
            if (currentContent) {
                previousScrollTop = currentContent.scrollTop;
            }
        }

        let contentHtml = '';
        let headerHtml = renderHeader(); // Default header

        switch(forumState.activeTab) {
            case 'home':
                contentHtml = renderHomeTab();
                break;
            case 'video':
                headerHtml = renderLiveHeader();
                contentHtml = renderLiveTab();
                break;
            case 'share': // Using share tab for the "Middle Button" (Search/Messages/Map) view requested
                headerHtml = renderDMHeader(); // Special header for this view
                contentHtml = renderDMTab();
                break;
            case 'profile':
                headerHtml = renderProfileHeader();
                contentHtml = renderProfileTab();
                break;
            case 'forum_wallet':
                headerHtml = renderForumWalletHeader();
                contentHtml = renderForumWallet();
                break;
            case 'edit_profile':
                headerHtml = renderEditProfileHeader();
                contentHtml = renderEditProfile();
                break;
            case 'forum_settings':
                headerHtml = renderForumSettingsHeader();
                contentHtml = renderForumSettings();
                break;
            case 'forum_edit_contact':
                headerHtml = renderForumEditContactHeader();
                contentHtml = renderForumEditContact();
                break;
            case 'chat':
                headerHtml = renderChatHeader();
                contentHtml = renderChatPage();
                break;
            case 'other_profile':
                headerHtml = renderOtherProfileHeader();
                contentHtml = renderOtherProfile();
                break;
            case 'other_profile_posts':
                headerHtml = renderOtherProfileHeader();
                contentHtml = renderOtherProfilePosts();
                break;
            case 'my_profile_posts':
                headerHtml = renderMyProfilePostsHeader();
                contentHtml = renderMyProfilePosts();
                break;
            case 'create_post':
                headerHtml = renderCreatePostHeader();
                contentHtml = renderCreatePostPage();
                break;
            default:
                contentHtml = renderHomeTab();
        }

        const showNav = forumState.activeTab !== 'edit_profile' && forumState.activeTab !== 'forum_settings' && forumState.activeTab !== 'forum_edit_contact' && forumState.activeTab !== 'chat' && forumState.activeTab !== 'other_profile' && forumState.activeTab !== 'other_profile_posts' && forumState.activeTab !== 'my_profile_posts' && forumState.activeTab !== 'create_post' && forumState.activeTab !== 'forum_wallet';

        const multiSelectBarHtml = forumState.multiSelectMode ? `
            <div class="forum-multi-select-bar">
                <div class="multi-select-left-actions">
                    <button class="multi-select-cancel-btn" id="multi-select-cancel">取消</button>
                    <button class="multi-select-all-btn" id="multi-select-all">全选</button>
                </div>
                <button class="multi-select-delete-btn ${forumState.selectedPostIds.size === 0 ? 'is-disabled' : ''}" id="multi-select-delete">删除</button>
            </div>
        ` : '';

        app.innerHTML = `
            <div class="forum-screen">
                <div class="forum-content ${animate ? 'animate-fade' : ''} ${showNav ? 'has-nav' : ''}" id="forum-content-area">
                    ${headerHtml}
                    ${contentHtml}
                </div>
                ${forumState.multiSelectMode ? '' : (showNav ? renderBottomNav() : '')}
                ${multiSelectBarHtml}
                <div class="forum-back-to-top" id="forum-back-to-top">
                    <i class="fas fa-arrow-up"></i>
                </div>

                <!-- Live Room Page Overlay -->
                <div id="forum-room-page" class="forum-live-room-page">
                    <div class="forum-room-bg">
                        <div style="text-align:center; opacity:0.3;">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                            </svg>
                            <div style="font-size:14px; margin-top:10px;">LIVE FEED</div>
                        </div>
                    </div>

                    <div class="forum-room-overlay">
                        <div class="forum-room-header">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <button class="forum-room-back-btn" onclick="window.closeForumLiveRoom()">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </button>
                                <div class="forum-room-host-info">
                                    <div class="forum-room-host-avatar"></div>
                                    <div style="display:flex; flex-direction:column; justify-content:center;">
                                        <div class="forum-room-host-name" id="forum-room-host-name">Host</div>
                                        <div id="forum-room-viewers" style="font-size: 11px; color: rgba(255,255,255,0.85); margin-top: 2px;">128 在看</div>
                                        <div id="live-rank-badge" onclick="window.toggleLeaderboard()" style="display:none; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,215,0,0.5); color: #ffd60a; font-size: 10px; padding: 1px 6px; border-radius: 8px; margin-top: 2px; cursor: pointer; align-self: flex-start; font-weight: 800; font-style: italic;">NO.99</div>
                                    </div>
                                    <button class="forum-room-follow-btn" id="forum-room-follow-btn">Follow</button>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 8px;">
                                <button id="forum-live-end-btn" class="forum-room-action-btn" onclick="window.endMyLiveStream()" style="width: 40px; height: 40px; border: none; background: rgba(255,59,48,0.2); color: #ff453a; display:none;">
                                    <i class="fas fa-stop" style="font-size: 14px;"></i>
                                </button>
                                <!-- Leaderboard Button -->
                                <button class="forum-room-action-btn" onclick="window.toggleLeaderboard()" style="width: 40px; height: 40px; border: none; background: rgba(255,215,0,0.2); color: #ffd60a;">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                                        <path d="M4 22h16"></path>
                                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                                    </svg>
                                </button>
                                
                                <!-- Wallpaper Button -->
                                <button class="forum-room-action-btn" onclick="window.toggleLiveWallpaperMenu()" style="width: 40px; height: 40px; border: none; background: rgba(255,255,255,0.2);">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div style="display: flex; flex-direction: column; gap: 12px; flex: 1; overflow: hidden; margin-top: 20px;">
                            <div id="forum-pk-panel" class="forum-pk-panel" style="display:none;"></div>
                            <div class="forum-room-desc-container" style="display: flex; justify-content: center; align-items: flex-start; width: 100%; margin-top: 10vh; height: 250px; flex-shrink: 0; pointer-events: none;">
                            </div>
                            
                            <div class="forum-room-chat-container" style="flex: 1; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end;">
                                <div class="forum-room-chat-area">
                                    <div class="forum-room-chat-msg"><span style="color: white; font-weight: 600; margin-right: 6px;">Alex</span>Hello! 👋</div>
                                    <div class="forum-room-chat-msg"><span style="color: white; font-weight: 600; margin-right: 6px;">Sarah_99</span>Love the vibe here</div>
                                    <div class="forum-room-chat-msg"><span style="color: white; font-weight: 600; margin-right: 6px;">Mike_D</span>Can you show the setup?</div>
                                </div>
                            </div>

                            <div class="forum-room-controls" style="align-items: center; width: 100%; flex-shrink: 0; gap: 8px;">
                                <!-- Input Field Wrapper (includes buttons) -->
                                <div style="flex: 1; background: rgba(0,0,0,0.3); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-radius: 22px; padding: 4px 8px; display: flex; align-items: center; border: 1px solid rgba(255,255,255,0.1);">
                                    
                                    <!-- Regenerate Button -->
                                    <div id="live-regenerate-btn" onclick="window.regenerateLiveContent()" style="width: 32px; height: 32px; display: none; align-items: center; justify-content: center; cursor: pointer; color: white; margin-right: 2px;">
                                        <i class="fas fa-sync-alt" style="font-size: 14px;"></i>
                                    </div>

                                    <input type="text" id="forum-live-input" placeholder="Say something..." style="background: transparent; border: none; color: white; flex: 1; outline: none; font-size: 14px; padding: 0 4px; min-width: 0;" onkeypress="window.handleForumChatEnter(event)">
                                    
                                    <!-- Generate Button -->
                                    <div id="live-generate-btn" onclick="window.generateLiveContent()" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: white; margin-left: 2px;">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    </div>
                                </div>

                                <div class="forum-room-action-bar" style="gap: 8px;">
                                    <!-- Gift Button -->
                                    <div class="forum-room-action-btn" id="forum-live-gift-btn" onclick="window.toggleForumGiftMenu()" style="width: 36px; height: 36px;">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="14" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="22"></line><path d="M12 8V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v4"></path><path d="M12 8V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path></svg>
                                    </div>
                                    <div class="forum-room-action-btn" id="forum-live-suggest-btn" onclick="window.toggleForumActionSuggestionMenu()" style="width: 36px; height: 36px; display:none;">
                                        <i class="fas fa-lightbulb" style="font-size: 16px;"></i>
                                    </div>
                                    <!-- Heart Button -->
                                    <div class="forum-room-action-btn" style="background: #ff2d55; border:none; width: 36px; height: 36px;" onclick="window.showForumLiveHeart()">
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Gift Menu Overlay -->
                    <div class="forum-gift-menu" id="forum-gift-menu">
                        <div class="forum-gift-menu-header">
                            <h4 style="font-size: 18px; font-weight: 700; color: #1c1c1e;">Send Gift</h4>
                            <button onclick="window.toggleForumGiftMenu()" style="background: rgba(0,0,0,0.05); border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 14px; font-weight: bold; cursor: pointer; color: #1c1c1e;">✕</button>
                        </div>
                        <div class="forum-gift-grid">
                            ${FORUM_GIFTS.map((g, i) => `
                                <div class="forum-gift-item ${i === 0 ? 'active' : ''}" onclick="window.selectForumGift(this)" data-name="${g.name}" data-price="${g.value}" data-color="${g.color}">
                                    <div class="forum-gift-icon" style="font-size:32px; display:flex; justify-content:center; align-items:center; height:32px;">${g.emoji}</div>
                                    <div class="forum-gift-name">${g.name}</div>
                                    <div class="forum-gift-price">${g.value} Coins</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="forum-gift-action">
                            <input type="number" id="forum-gift-count" value="1" min="1" max="99">
                            <button class="forum-send-gift-btn" onclick="window.sendForumGift()">Send Gift</button>
                        </div>
                    </div>

                    <div class="forum-gift-menu" id="forum-action-suggestion-menu" style="height: auto; max-height: 62vh;">
                        <div class="forum-gift-menu-header">
                            <h4 style="font-size: 18px; font-weight: 700; color: #1c1c1e;">下一步建议</h4>
                            <button onclick="window.toggleForumActionSuggestionMenu()" style="background: rgba(0,0,0,0.05); border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 14px; font-weight: bold; cursor: pointer; color: #1c1c1e;">✕</button>
                        </div>
                        <div id="forum-action-suggestion-list" style="padding-bottom: 10px;">
                        </div>
                    </div>

                    <!-- Wallpaper Menu Overlay -->
                    <div class="forum-gift-menu" id="forum-wallpaper-menu" style="height: auto; max-height: 70vh;">
                        <div class="forum-gift-menu-header">
                            <h4 style="font-size: 18px; font-weight: 700; color: #1c1c1e;">直播背景</h4>
                            <button onclick="window.toggleLiveWallpaperMenu()" style="background: rgba(0,0,0,0.05); border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 14px; font-weight: bold; cursor: pointer; color: #1c1c1e;">✕</button>
                        </div>
                        <div style="padding: 15px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div style="font-weight: 600; color: #666;">我的壁纸</div>
                                <button onclick="document.getElementById('room-wallpaper-upload').click()" style="background: #0095f6; color: white; border: none; padding: 6px 14px; border-radius: 16px; font-size: 13px; font-weight: 600;">上传</button>
                                <input type="file" id="room-wallpaper-upload" accept="image/*" style="display: none;" onchange="window.handleRoomWallpaperUpload(this)">
                            </div>
                            
                            <div class="forum-wallpaper-grid" id="forum-wallpaper-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding-bottom: 20px;">
                                <!-- Populated by JS -->
                            </div>
                        </div>
                    </div>

                    <!-- Leaderboard Overlay -->
                    <div class="forum-gift-menu" id="forum-leaderboard-overlay" style="height: 60vh; background: #1c1c1e;">
                        <div class="forum-gift-menu-header" style="background: linear-gradient(135deg, #1c1c1e, #2c2c2e); color: white; border: none;">
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffd60a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                                    <path d="M4 22h16"></path>
                                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                                </svg>
                                <h4 style="font-size: 18px; font-weight: 800; color: #ffd60a; font-style: italic;">Leaderboard</h4>
                            </div>
                            <button onclick="window.toggleLeaderboard()" style="background: rgba(255,255,255,0.1); border: none; width: 30px; height: 30px; border-radius: 50%; font-size: 14px; font-weight: bold; cursor: pointer; color: white;">✕</button>
                        </div>
                        <div style="padding: 0; background: #1c1c1e; color: white; height: 100%; overflow-y: auto;">
                            <div id="forum-leaderboard-list" style="padding-bottom: 20px;">
                                <!-- JS Populated -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Restore scroll position
        if (!animate && previousScrollTop > 0) {
            const newContent = document.getElementById('forum-content-area');
            if (newContent) {
                newContent.scrollTop = previousScrollTop;
            }
        }

        setupTabListeners();
        setupBackToTopListener();
        setupCarousels();
        
        // Scroll to specific post if needed
        if (forumState.activeTab === 'other_profile_posts' && forumState.otherProfileScrollToPostId) {
            setTimeout(() => {
                const el = document.getElementById(`other-profile-post-${forumState.otherProfileScrollToPostId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'auto', block: 'center' });
                }
                forumState.otherProfileScrollToPostId = null;
            }, 0);
        } else if (forumState.activeTab === 'my_profile_posts' && forumState.myProfileScrollToPostId) {
            setTimeout(() => {
                const el = document.getElementById(`my-profile-post-${forumState.myProfileScrollToPostId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'auto', block: 'center' });
                }
                forumState.myProfileScrollToPostId = null;
            }, 0);
        }
    }

    function setupBackToTopListener() {
        const contentArea = document.getElementById('forum-content-area');
        const backToTopBtn = document.getElementById('forum-back-to-top');
        const forumHeader = document.querySelector('.forum-header');
        
        let lastScrollTop = 0;
        const scrollThreshold = 5; // 最小滚动距离阈值

        if (contentArea && backToTopBtn) {
            contentArea.addEventListener('scroll', () => {
                const scrollTop = contentArea.scrollTop;
                
                // Back to Top Button logic
                if (scrollTop > 300) {
                    backToTopBtn.classList.add('visible');
                } else {
                    backToTopBtn.classList.remove('visible');
                }
                
                // Header Hide/Show logic
                if (forumHeader) {
                    if (forumState.activeTab === 'other_profile' || forumState.activeTab === 'chat' || forumState.activeTab === 'other_profile_posts' || forumState.activeTab === 'my_profile_posts') {
                        // 在他人主页或私聊页面，顶栏不自动隐藏
                        // 但这里我们只是取消"header-hidden"类的添加，让它保持原位
                        // 实际上用户要求"顶栏和别的内容一起上滑"，这意味着顶栏不应该 fixed/sticky，或者应该随着页面滚动而移动
                        // 现有的CSS是 sticky top:0。如果要一起上滑，需要在滚动时把它推上去，或者改为 position: absolute/relative
                        // 最简单的方法是禁用这里的自动隐藏逻辑，并修改CSS使其不sticky，或者在这里通过JS控制
                        // 但根据用户描述 "不用页面下滑时顶栏隐藏上滑时顶栏出现了"，说明不要这个自动显隐动画
                        // "让顶栏在页面下滑时顶栏和别的内容一起上滑" -> 这意味着顶栏应该是文档流的一部分，而不是 sticky 的
                        
                        // 所以这里我们什么都不做，让它保持默认状态（sticky），或者我们需要修改CSS。
                        // 如果CSS是sticky，它会吸顶。用户想要"一起上滑"，说明不吸顶。
                        // 我们可以在 renderOtherProfileHeader 中添加内联样式 style="position: relative;" 覆盖默认的 sticky
                    } else {
                        if (Math.abs(scrollTop - lastScrollTop) > scrollThreshold) {
                            if (scrollTop > lastScrollTop && scrollTop > 100) {
                                // 向下滚动且超过100px，隐藏顶栏
                                forumHeader.classList.add('header-hidden');
                            } else {
                                // 向上滚动，显示顶栏
                                forumHeader.classList.remove('header-hidden');
                            }
                            lastScrollTop = scrollTop;
                        }
                    }
                }
            });

            backToTopBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                contentArea.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }

    // --- Comments Logic ---

    const mockComments = [
        {
            id: 1,
            user: { name: 'katsumi_hyodo_official', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=katsumi', verified: true },
            text: '心の底からおめでとう！！！！！\n幸せにな☺',
            time: '2天',
            likes: 7357,
            replies: [
                {
                    id: 101,
                    user: { name: 'soccer.poke050607', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=soccer', verified: false },
                    text: '@katsumi_hyodo_official わー！ 絵文字使ってるのかわいいー！',
                    time: '2天',
                    likes: 15
                }
            ]
        },
        {
            id: 2,
            user: { name: 'taisei_kido_', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=taisei', verified: true },
            text: '楓珠おめでとう！ お幸せに！ 👏',
            time: '2天',
            likes: 2048,
            replies: []
        },
        {
            id: 3,
            user: { name: 'harunaiikubo_official', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=haruna', verified: true },
            text: 'おめでとうー！ 👏🏻',
            time: '2天',
            likes: 287,
            replies: []
        },
        {
            id: 4,
            user: { name: 'oshiro_maeda', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=oshiro', verified: false },
            text: 'おめ🔥🔥🔥',
            time: '2天',
            likes: 663,
            replies: []
        },
        {
             id: 5,
            user: { name: 'm.i.b___730', avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=mib', verified: false },
            text: 'また顔似てる夫婦が増えた👏❤️❤️',
            time: '2天',
            likes: 5623,
            replies: []
        }
    ];

    function renderCommentsOverlay(comments = null, post = null) {
        // Remove existing overlay if any (simple check to allow partial update)
        const existing = document.getElementById('comments-overlay');
        
        // Initialize post comments if needed
        if (post && !post.comments_list) {
            post.comments_list = JSON.parse(JSON.stringify(mockComments));
        }
        
        const commentsData = (post && post.comments_list) ? post.comments_list : (comments || mockComments);
        const isMultiSelect = forumState.commentMultiSelectMode;

        const commentsListHtml = commentsData.map(comment => {
            const hasReplies = comment.replies && comment.replies.length > 0;
            const isSelected = forumState.selectedCommentIds.has(comment.id);
            const isRepliesExpanded = forumState.expandedCommentReplyIds.has(comment.id);
            const checkboxHtml = isMultiSelect ? `<div class="comment-select-checkbox ${isSelected ? 'checked' : ''}"></div>` : '';

            const repliesHtml = hasReplies ? `
                <div class="view-replies-btn ${isRepliesExpanded ? 'hidden' : ''}" onclick="toggleReplies(${comment.id}, this)">
                    <div class="view-replies-line"></div>
                    <span class="view-replies-text">查看另 ${comment.replies.length} 条回复</span>
                </div>
                <div class="replies-list ${isRepliesExpanded ? 'visible' : ''}" id="replies-${comment.id}">
                    ${comment.replies.map(reply => {
                        const isReplySelected = forumState.selectedCommentIds.has(reply.id);
                        const replyCheckboxHtml = isMultiSelect ? `<div class="comment-select-checkbox ${isReplySelected ? 'checked' : ''}"></div>` : '';
                        return `
                        <div class="comment-item reply-item" data-id="${reply.id}">
                             ${replyCheckboxHtml}
                             <img src="${reply.user.avatar}" class="comment-avatar reply-avatar">
                             <div class="comment-content">
                                <div class="comment-row-1">
                                    <span class="comment-username">${reply.user.name}</span>
                                    ${reply.user.verified ? '<i class="fas fa-check-circle comment-verified"></i>' : ''}
                                    <span class="comment-time">${reply.time}</span>
                                </div>
                                <div class="comment-text">${reply.text}</div>
                                <div class="comment-actions">
                                    <span class="comment-action-btn reply-trigger" data-id="${comment.id}" data-username="${reply.user.name}">回复</span>
                                    <span class="comment-action-btn">查看翻译</span>
                                </div>
                             </div>
                             <div class="comment-like-container" onclick="toggleCommentLike(${reply.id}, this)">
                                <i class="${reply.liked ? 'fas' : 'far'} fa-heart comment-like-icon" style="${reply.liked ? 'color: #ed4956;' : ''}"></i>
                                <span class="comment-like-count">${reply.likes}</span>
                             </div>
                        </div>
                    `; }).join('')}
                </div>
            ` : '';

            return `
                <div class="comment-wrapper">
                    <div class="comment-item" data-id="${comment.id}">
                        ${checkboxHtml}
                        <img src="${comment.user.avatar}" class="comment-avatar">
                        <div class="comment-content">
                            <div class="comment-row-1">
                                <span class="comment-username">${comment.user.name}</span>
                                ${comment.user.verified ? '<i class="fas fa-check-circle comment-verified"></i>' : ''}
                                <span class="comment-time">${comment.time}</span>
                            </div>
                            <div class="comment-text">${comment.text}</div>
                            <div class="comment-actions">
                                <span class="comment-action-btn reply-trigger" data-id="${comment.id}" data-username="${comment.user.name}">回复</span>
                                <span class="comment-action-btn">查看翻译</span>
                            </div>
                        </div>
                        <div class="comment-like-container" onclick="toggleCommentLike(${comment.id}, this)">
                            <i class="${comment.liked ? 'fas' : 'far'} fa-heart comment-like-icon" style="${comment.liked ? 'color: #ed4956;' : ''}"></i>
                            <span class="comment-like-count">${comment.likes}</span>
                        </div>
                    </div>
                    ${repliesHtml}
                </div>
            `;
        }).join('');

        let overlay = document.getElementById('comments-overlay');
        let backdrop = document.getElementById('comments-backdrop');
        const isNew = !overlay;

        if (isNew) {
            // Create Backdrop
            backdrop = document.createElement('div');
            backdrop.id = 'comments-backdrop';
            backdrop.className = 'comments-backdrop';
            document.getElementById('forum-app').appendChild(backdrop);
            
            backdrop.addEventListener('click', () => {
                const closeBtn = document.getElementById('comments-close-btn');
                if (closeBtn) closeBtn.click();
            });

            overlay = document.createElement('div');
            overlay.id = 'comments-overlay';
            overlay.className = 'comments-overlay';
            
            overlay.innerHTML = `
                <div class="comments-drag-handle-area" id="comments-drag-area">
                    <div class="comments-drag-handle"></div>
                </div>
                <div class="comments-header">
                    <div class="comments-header-title">评论</div>
                    <div class="comments-header-close" id="comments-close-btn"><img src="https://i.postimg.cc/hGjkXkL3/无标题98_20260213231726.png" class="post-action-icon"></div>
                </div>
                <div class="comments-scroll-area"></div>
                <div class="comments-input-area">
                    <div class="emoji-bar">
                        <span>❤️</span> <span>🙌</span> <span>🔥</span> <span>👏</span> <span>😥</span> <span>😍</span> <span>😮</span> <span>😂</span>
                    </div>
                    <div class="comment-input-wrapper">
                        <img src="${forumState.currentUser.avatar}" class="comment-user-avatar-small">
                        <div class="comment-input-box">
                            <input type="text" class="comment-input" id="comment-input-field">
                            <img src="https://i.postimg.cc/hGjkXkL3/无标题98_20260213231726.png" class="comment-send-icon">
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('forum-app').appendChild(overlay);
            
            // Listeners
            document.getElementById('comments-close-btn').addEventListener('click', () => {
                overlay.classList.remove('active');
                if (backdrop) backdrop.classList.remove('active');
                forumState.replyingToCommentId = null;
                forumState.commentMultiSelectMode = false;
                forumState.selectedCommentIds = new Set();
                forumState.expandedCommentReplyIds = new Set();
                setTimeout(() => {
                    overlay.remove();
                    if (backdrop) backdrop.remove();
                }, 300);
            });

            document.getElementById('comments-drag-area').addEventListener('click', () => {
                overlay.classList.toggle('expanded');
            });

            const sendBtn = overlay.querySelector('.comment-send-icon');
            const input = document.getElementById('comment-input-field');
            
            const handleSend = () => {
                const text = input.value.trim();
                if (!text) return;
                
                if (post) {
                    const newComment = {
                        id: Date.now(),
                        user: {
                            ...forumState.currentUser,
                            name: forumState.currentUser.bio || forumState.currentUser.username || 'Me'
                        },
                        text: text,
                        time: '刚刚',
                        likes: 0,
                        replies: []
                    };
                    
                    let replyContext = null;

                    if (forumState.replyingToCommentId) {
                        const parent = post.comments_list.find(c => c.id === parseInt(forumState.replyingToCommentId));
                        if (parent) {
                            if (!parent.replies) parent.replies = [];
                            parent.replies.push(newComment);
                            replyContext = { parentComment: parent, type: 'reply' };
                        }
                        forumState.replyingToCommentId = null;
                        forumState.replyingToUsername = null;
                    } else {
                        post.comments_list.push(newComment);
                        replyContext = { type: 'comment' };
                    }
                    
                    post.stats.comments++;
                    saveForumData();
                    
                    // Clear input before re-rendering
                    input.value = '';
                    
                    renderCommentsOverlay(post.comments_list, post); // Re-render logic

                    // sync this manual comment to chat if the post belongs to a linked contact
                    if (post.userId) {
                        let chatMsg = `[评论了你的帖子]: "${text}"`;
                        if (replyContext && replyContext.type === 'reply' && replyContext.parentComment) {
                            chatMsg = `[回复了你的帖子评论]: "${text}"`;
                        }
                        window.syncForumEventToChat(post.userId, chatMsg, 'user');
                    }

                    // Trigger AI Reply Logic
                    generateAIReply(post, newComment, replyContext);
                }
            };

            if (sendBtn) sendBtn.onclick = handleSend;
            if (input) {
                input.onkeypress = (e) => {
                    if (e.key === 'Enter') handleSend();
                };
            }
            
            setTimeout(() => {
                overlay.classList.add('active');
                if (backdrop) backdrop.classList.add('active');
            }, 10);
        }

        // Update Content
        const scrollArea = overlay.querySelector('.comments-scroll-area');
        if (scrollArea) {
            scrollArea.innerHTML = commentsListHtml;
            requestAnimationFrame(() => {
                overlay.querySelectorAll('.replies-list.visible').forEach((repliesEl) => {
                    repliesEl.style.maxHeight = `${repliesEl.scrollHeight}px`;
                });
            });
            // Scroll to bottom if it's a new comment being added (not initial render)
            if (!isNew && post && post.comments_list.length > comments.length) {
                 scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        }

        // Generating Indicator
        let indicator = document.getElementById('reply-generating-indicator');
        if (forumState.isGeneratingReply) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = 'reply-generating-indicator';
                indicator.className = 'reply-generating-indicator';
                indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>正在回复评论...</span>';
                
                const inputArea = overlay.querySelector('.comments-input-area');
                if (inputArea) {
                    inputArea.insertBefore(indicator, inputArea.firstChild);
                }
            }
        } else {
            if (indicator) indicator.remove();
        }

        // Update Placeholder & Focus
        const inputField = document.getElementById('comment-input-field');
        if (inputField) {
            const isReplying = forumState.replyingToCommentId;
            const replyUsername = forumState.replyingToUsername || '';
            const placeholder = isReplying ? `回复 ${replyUsername}...` : (post ? `为 ${post.user.name} 添加评论...` : '添加评论...');
            inputField.placeholder = placeholder;
            if (isReplying) inputField.focus();
        }

        // Multi-select Bar
        let msBar = document.getElementById('comment-multiselect-bar');
        if (isMultiSelect) {
            if (!msBar) {
                msBar = document.createElement('div');
                msBar.id = 'comment-multiselect-bar';
                msBar.className = 'forum-multi-select-bar';
                msBar.style.position = 'absolute';
                msBar.style.zIndex = '2005';
                msBar.innerHTML = `
                    <div class="multi-select-left-actions">
                        <button class="multi-select-cancel-btn" id="cms-cancel">取消</button>
                    </div>
                    <button class="multi-select-delete-btn" id="cms-delete">删除</button>
                `;
                overlay.appendChild(msBar);
                
                document.getElementById('cms-cancel').onclick = () => {
                    forumState.commentMultiSelectMode = false;
                    forumState.selectedCommentIds = new Set();
                    renderCommentsOverlay(post.comments_list, post);
                };
                
                document.getElementById('cms-delete').onclick = () => {
                    if (forumState.selectedCommentIds.size === 0) return;
                    if (!confirm(`确定要删除选中的 ${forumState.selectedCommentIds.size} 条评论吗？`)) return;
                    
                    const ids = forumState.selectedCommentIds;
                    post.comments_list = post.comments_list.filter(c => !ids.has(c.id));
                    post.comments_list.forEach(c => {
                        if (c.replies) {
                            c.replies = c.replies.filter(r => !ids.has(r.id));
                        }
                    });
                    
                    let count = post.comments_list.length;
                    post.comments_list.forEach(c => { if(c.replies) count += c.replies.length; });
                    post.stats.comments = count;
                    
                    saveForumData();
                    
                    forumState.commentMultiSelectMode = false;
                    forumState.selectedCommentIds = new Set();
                    renderCommentsOverlay(post.comments_list, post);
                };
            }
            const delBtn = document.getElementById('cms-delete');
            if (delBtn) {
                if (forumState.selectedCommentIds.size === 0) delBtn.classList.add('is-disabled');
                else delBtn.classList.remove('is-disabled');
            }
        } else {
            if (msBar) msBar.remove();
        }

        // Attach Listeners to Comment Items
        overlay.querySelectorAll('.comment-item').forEach(item => {
            const id = parseInt(item.dataset.id);
            if (!id) return;

            item.addEventListener('click', (e) => {
                if (forumState.commentMultiSelectMode) {
                    e.stopPropagation();
                    e.preventDefault();
                    if (forumState.selectedCommentIds.has(id)) {
                        forumState.selectedCommentIds.delete(id);
                    } else {
                        forumState.selectedCommentIds.add(id);
                    }
                    renderCommentsOverlay(post.comments_list, post);
                }
            });

            let timer;
            const start = () => {
                if (forumState.commentMultiSelectMode) return;
                timer = setTimeout(() => {
                    forumState.commentMultiSelectMode = true;
                    forumState.selectedCommentIds.add(id);
                    renderCommentsOverlay(post.comments_list, post);
                }, 500);
            };
            const cancel = () => clearTimeout(timer);

            item.addEventListener('mousedown', start);
            item.addEventListener('touchstart', start);
            item.addEventListener('mouseup', cancel);
            item.addEventListener('touchend', cancel);
            item.addEventListener('mousemove', cancel);
            item.addEventListener('touchmove', cancel);
        });

        // Re-attach Reply Triggers
        overlay.querySelectorAll('.reply-trigger').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                if (forumState.commentMultiSelectMode) return;
                forumState.replyingToCommentId = btn.dataset.id;
                forumState.replyingToUsername = btn.dataset.username;
                renderCommentsOverlay(commentsData, post);
            };
        });
    }

    // Expose toggleReplies to global scope since it's called inline
    window.toggleReplies = function(id, btn) {
        const replies = document.getElementById(`replies-${id}`);
        if (replies) {
             forumState.expandedCommentReplyIds.add(id);
             replies.classList.add('visible');
             requestAnimationFrame(() => {
                 replies.style.maxHeight = `${replies.scrollHeight}px`;
             });
             btn.classList.add('hidden');
        }
    };

    window.toggleCommentLike = function(commentId, btn) {
        // Find the comment across all posts (since overlay doesn't pass post context to global function easily, though we could pass post id)
        // But finding it in forumState.posts is safe enough or we can find the post in the current rendered overlay context.
        // Actually, we can search forumState.posts.
        
        let targetComment = null;
        let targetPost = null;

        for (const post of forumState.posts) {
            if (post.comments_list) {
                targetComment = post.comments_list.find(c => c.id === commentId);
                if (targetComment) {
                    targetPost = post;
                    break;
                }
                // Check replies
                for (const comment of post.comments_list) {
                    if (comment.replies) {
                        targetComment = comment.replies.find(r => r.id === commentId);
                        if (targetComment) {
                            targetPost = post;
                            break;
                        }
                    }
                }
                if (targetComment) break;
            }
        }

        if (targetComment && targetPost) {
            targetComment.liked = !targetComment.liked;
            targetComment.likes = Math.max(0, (targetComment.likes || 0) + (targetComment.liked ? 1 : -1));
            
            // Save
            saveForumData();

            // Update UI
            if (btn) {
                const icon = btn.querySelector('.comment-like-icon');
                const count = btn.querySelector('.comment-like-count');
                
                if (targetComment.liked) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    icon.style.color = '#ed4956';
                    icon.classList.add('animate-like-heart');
                    setTimeout(() => icon.classList.remove('animate-like-heart'), 300);
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    icon.style.color = '';
                }
                
                if (count) {
                    count.textContent = formatCount(targetComment.likes);
                }
            }
        }
    };

    // --- Headers ---

    function renderEditProfileHeader() {
        return `
            <div class="forum-header">
                <div class="header-left">
                    <i class="fas fa-chevron-left" id="edit-profile-back" style="font-size: 24px; cursor: pointer;"></i>
                </div>
                <div class="header-center">
                    <span style="font-size: 16px; font-weight: 700;">编辑主页</span>
                </div>
                <div class="header-right">
                    <!-- Right side empty -->
                </div>
            </div>
        `;
    }

    function renderForumSettingsHeader() {
        return `
            <div class="forum-header">
                <div class="header-left">
                    <i class="fas fa-chevron-left" id="forum-settings-back" style="font-size: 24px; cursor: pointer;"></i>
                </div>
                <div class="header-center">
                    <span style="font-size: 16px; font-weight: 700;">论坛设置</span>
                </div>
                <div class="header-right">
                    <span id="forum-settings-save" style="font-weight: 600; color: #0095f6; cursor: pointer;">保存</span>
                </div>
            </div>
        `;
    }

    function renderForumEditContactHeader() {
        return `
            <div class="forum-header">
                <div class="header-left">
                    <i class="fas fa-chevron-left" id="forum-edit-contact-back" style="font-size: 24px; cursor: pointer;"></i>
                </div>
                <div class="header-center">
                    <span style="font-size: 16px; font-weight: 700;">编辑角色主页</span>
                </div>
                <div class="header-right">
                    <span id="forum-edit-contact-save" style="font-weight: 600; color: #0095f6; cursor: pointer;">保存</span>
                </div>
            </div>
        `;
    }

    function renderLiveHeader() {
        return `
            <div class="forum-live-header">
                <div>
                    <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 2px; opacity: 0.5; margin-bottom: 4px;">Discover</div>
                    <h1>Now Streaming</h1>
                </div>
                <div class="forum-live-header-icon" onclick="window.generateForumLives()" style="cursor: pointer;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </div>
            </div>
        `;
    }

    function renderHeader() {
        // Default Home Header
        return `
            <div class="forum-header">
                <div class="header-left">
                    <div id="forum-back-btn" style="cursor: pointer; margin-top: 12px; display: flex; align-items: center;">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                </div>
                <div class="header-center">
                    <img src="https://i.postimg.cc/B6rSJSKs/wu-biao-ti94-20260213222425.png" alt="Instagram" style="height: 60px;">
                    <i class="fas fa-chevron-down" style="font-size: 12px; margin-left: 5px; margin-top: 12px;"></i>
                </div>
                <div class="header-right">
                    <i class="far fa-heart" id="forum-generate-btn" style="font-size: 24px; margin-top: 12px; cursor: pointer;"></i>
                </div>
            </div>
        `;
    }

    function renderDMHeader() {
        // Header for the "Search/DM" page (Middle button)
        return `
            <div class="forum-header">
                 <div class="header-left">
                    <!-- Placeholder for back or empty -->
                </div>
                <div class="header-center">
                    <span style="font-weight: 700; font-size: 16px;">${forumState.currentUser.username}</span>
                    <i class="fas fa-chevron-down header-title-arrow"></i>
                </div>
                <div class="header-right">
                    <i class="far fa-edit" style="font-size: 24px;"></i>
                </div>
            </div>
        `;
    }

    function renderProfileHeader() {
        return `
            <div class="forum-header">
                <div class="header-left">
                    <div style="cursor: pointer; display: flex; align-items: center;" onclick="window.showCreateMenu()">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                </div>
                <div class="header-center">
                    <span style="font-weight: 700; font-size: 22px;">${forumState.currentUser.username}</span>
                    <i class="fas fa-chevron-down header-title-arrow"></i>
                </div>
                <div class="header-right">
                    <img src="https://i.postimg.cc/QCfGKHGC/无标题98_20260215024118.png" id="forum-wallet-entry-btn" style="height: 32px; width: auto; margin-top: 5px; cursor: pointer;">
                    <img src="https://i.postimg.cc/vT0FxcF9/无标题98_20260215024227.png" style="height: 32px; width: auto; margin-top: 5px;">
                </div>
            </div>
        `;
    }

    function renderForumWalletHeader() {
        return '';
    }

    function getForumWalletState() {
        if (!forumState.forumWallet) {
            forumState.forumWallet = { initialized: false, balance: 0, transactions: [], isGenerating: false, source: 'none', generatedAt: null };
        }
        return forumState.forumWallet;
    }

    function saveForumWalletState() {
        const s = getForumWalletState();
        localStorage.setItem('forum_wallet_state', JSON.stringify({
            initialized: !!s.initialized,
            balance: Number.isFinite(Number(s.balance)) ? Number(s.balance) : 0,
            transactions: Array.isArray(s.transactions) ? s.transactions.slice(0, 30) : [],
            source: s.source || 'none',
            generatedAt: s.generatedAt || null
        }));
    }

    function formatWalletAmount(value) {
        const n = Number(value) || 0;
        return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    function getWalletTxIconSvg(type = 'income') {
        if (type === 'expense') {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3" stroke="#1d1d1f" stroke-width="1.8"/><path d="M12 11v5" stroke="#1d1d1f" stroke-width="1.8" stroke-linecap="round"/><path d="M9.8 13.8L12 16l2.2-2.2" stroke="#1d1d1f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
        if (type === 'gift') {
            return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="10" width="18" height="10" rx="2" stroke="#1d1d1f" stroke-width="1.8"/><path d="M12 10v10" stroke="#1d1d1f" stroke-width="1.8"/><path d="M3 14h18" stroke="#1d1d1f" stroke-width="1.8"/><path d="M8.4 10c-1.5 0-2.4-.8-2.4-2 0-1.1.8-2 2.1-2 1.7 0 2.7 1.5 3.9 4" stroke="#1d1d1f" stroke-width="1.8" stroke-linecap="round"/><path d="M15.6 10c1.5 0 2.4-.8 2.4-2 0-1.1-.8-2-2.1-2-1.7 0-2.7 1.5-3.9 4" stroke="#1d1d1f" stroke-width="1.8" stroke-linecap="round"/></svg>';
        }
        return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3" stroke="#1d1d1f" stroke-width="1.8"/><path d="M12 16v-5" stroke="#1d1d1f" stroke-width="1.8" stroke-linecap="round"/><path d="M14.2 13.2L12 11l-2.2 2.2" stroke="#1d1d1f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }

    function fallbackInitialWalletBalance(identity, followers) {
        const f = Math.max(0, Number(followers) || 0);
        const identityText = (identity || '').toLowerCase();
        let base = 800 + Math.min(200000, f * 2.2);
        if (identityText.includes('明星') || identityText.includes('artist') || identityText.includes('演员')) base *= 2.1;
        if (identityText.includes('主播') || identityText.includes('博主') || identityText.includes('creator') || identityText.includes('influencer')) base *= 1.55;
        if (identityText.includes('企业') || identityText.includes('品牌') || identityText.includes('company') || identityText.includes('brand')) base *= 1.35;
        const rounded = Math.round(base / 10) * 10;
        return Math.max(100, Math.min(99999999, rounded));
    }

    function parseInitialBalanceFromText(text) {
        if (!text) return null;
        const cleaned = String(text).replace(/```json|```/g, '').trim();
        try {
            const obj = JSON.parse(cleaned);
            if (obj && Number.isFinite(Number(obj.balance))) return Number(obj.balance);
        } catch (e) {}
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const obj = JSON.parse(jsonMatch[0]);
                if (obj && Number.isFinite(Number(obj.balance))) return Number(obj.balance);
            } catch (e) {}
        }
        const numMatch = cleaned.match(/-?\d+(?:,\d{3})*(?:\.\d+)?/);
        if (!numMatch) return null;
        const n = Number(numMatch[0].replace(/,/g, ''));
        return Number.isFinite(n) ? n : null;
    }

    async function requestInitialWalletBalanceByAI(identity, followers) {
        let settings = { url: '', key: '', model: '' };
        if (window.iphoneSimState) {
            if (window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url) settings = window.iphoneSimState.aiSettings;
            else if (window.iphoneSimState.aiSettings2 && window.iphoneSimState.aiSettings2.url) settings = window.iphoneSimState.aiSettings2;
        }
        if (!settings.url || !settings.key) {
            return { balance: fallbackInitialWalletBalance(identity, followers), source: 'fallback' };
        }

        let fetchUrl = settings.url;
        if (!fetchUrl.endsWith('/chat/completions')) {
            fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
        }

        const prompt = `你是钱包初始化计算器。请根据下面用户画像估算“初始钱包余额（人民币）”。
公众身份：${identity || '未填写'}
粉丝数量：${followers || 0}
要求：返回严格 JSON，不要任何解释，格式为 {"balance":12345.67}。balance 必须为正数。`;

        try {
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + settings.key
                },
                body: JSON.stringify({
                    model: settings.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are a calculator that only returns compact JSON.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3
                })
            });
            if (!response.ok) throw new Error('wallet init request failed');
            const data = await response.json();
            const text = (((data || {}).choices || [])[0] || {}).message ? (((data || {}).choices || [])[0].message.content || '') : '';
            const parsed = parseInitialBalanceFromText(text);
            if (Number.isFinite(parsed) && parsed > 0) {
                return { balance: Math.min(99999999, parsed), source: 'ai' };
            }
        } catch (e) {}

        return { balance: fallbackInitialWalletBalance(identity, followers), source: 'fallback' };
    }

    async function ensureForumWalletInitialized() {
        const wallet = getForumWalletState();
        if (wallet.initialized || wallet.isGenerating) return;

        wallet.isGenerating = true;
        if (forumState.activeTab === 'forum_wallet') renderForum(false);

        const identity = forumState.currentUser && forumState.currentUser.publicIdentity ? forumState.currentUser.publicIdentity : '';
        const followers = forumState.currentUser && forumState.currentUser.followers ? Number(forumState.currentUser.followers) : 0;
        const result = await requestInitialWalletBalanceByAI(identity, followers);

        wallet.balance = Math.max(0, Number(result.balance) || 0);
        wallet.initialized = true;
        wallet.source = result.source;
        wallet.generatedAt = Date.now();
        wallet.transactions = [{
            id: Date.now(),
            title: 'Initial Wallet Setup',
            timeText: 'Just now',
            amount: wallet.balance,
            type: 'positive',
            iconType: 'income',
            iconSvg: getWalletTxIconSvg('income')
        }];
        wallet.isGenerating = false;
        saveForumWalletState();
        if (forumState.activeTab === 'forum_wallet') renderForum(false);
    }

    function renderForumWallet() {
        const wallet = getForumWalletState();
        const loading = !!wallet.isGenerating;
        const tx = Array.isArray(wallet.transactions) ? wallet.transactions : [];
        const txHtml = tx.length > 0 ? tx.map(item => `
            <div class="forum-wallet-tx-item">
                <div class="forum-wallet-tx-icon">${item.iconSvg || getWalletTxIconSvg(item.type === 'negative' ? 'expense' : 'income')}</div>
                <div class="forum-wallet-tx-info">
                    <div class="forum-wallet-tx-title">${item.title || 'Wallet Activity'}</div>
                    <div class="forum-wallet-tx-date">${item.timeText || 'Just now'}</div>
                </div>
                <div class="forum-wallet-tx-amount ${item.type === 'negative' ? 'negative' : 'positive'}">${item.type === 'negative' ? '-' : '+'}¥${formatWalletAmount(item.amount || 0)}</div>
            </div>
        `).join('') : `
            <div class="forum-wallet-empty">No activity yet</div>
        `;

        return `
            <div class="forum-wallet-page">
                <div class="forum-wallet-top" id="forum-wallet-back-title" role="button">
                    <div class="forum-wallet-greeting">
                        <p>Total Balance</p>
                        <h1>My Wallet</h1>
                    </div>
                </div>

                <div class="forum-wallet-card">
                    <div class="forum-wallet-card-label">AVAILABLE BALANCE</div>
                    <div class="forum-wallet-balance">${loading ? '<span>¥</span>--' : `<span>¥</span>${formatWalletAmount(wallet.balance)}`}</div>
                    <div class="forum-wallet-card-bottom">
                        <div class="forum-wallet-card-number">${loading ? 'Generating...' : '**** **** **** 3829'}</div>
                        <svg width="32" height="20" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="10" cy="10" r="10" fill="#000" fill-opacity="0.2"/>
                            <circle cx="22" cy="10" r="10" fill="#000" fill-opacity="0.4"/>
                        </svg>
                    </div>
                </div>

                <div class="forum-wallet-actions">
                    <button id="forum-wallet-recharge-btn" class="forum-wallet-action-btn" type="button">
                        <div class="forum-wallet-icon-box"><i class="fa-solid fa-arrow-up"></i></div>
                        <span>充值</span>
                    </button>
                    <button id="forum-wallet-withdraw-btn" class="forum-wallet-action-btn" type="button">
                        <div class="forum-wallet-icon-box"><i class="fa-solid fa-arrow-down"></i></div>
                        <span>提现</span>
                    </button>
                    <button class="forum-wallet-action-btn" type="button">
                        <div class="forum-wallet-icon-box"><i class="fa-solid fa-qrcode"></i></div>
                        <span>Scan</span>
                    </button>
                    <button class="forum-wallet-action-btn" type="button">
                        <div class="forum-wallet-icon-box"><i class="fa-solid fa-plus"></i></div>
                        <span>Top Up</span>
                    </button>
                </div>

                <div class="forum-wallet-transactions">
                    <div class="forum-wallet-section-header">
                        <h2>Recent Activity</h2>
                        <a href="javascript:void(0)">See All</a>
                    </div>
                    <div class="forum-wallet-tx-list">${txHtml}</div>
                </div>
            </div>
        `;
    }

    function openForumWalletAmountModal(mode, onConfirm) {
        const isRecharge = mode === 'recharge';
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.zIndex = '360';
        modal.style.alignItems = 'center';
        modal.innerHTML = `
            <div class="modal-content" style="height:auto;border-radius:12px;width:85%;max-width:320px;background-color:#fff;">
                <div class="modal-header" style="border-bottom:none;padding-bottom:0;">
                    <h3 style="width:100%;text-align:center;color:#000;">${isRecharge ? '论坛钱包充值' : '论坛钱包提现'}</h3>
                    <button class="close-btn" style="position:absolute;right:15px;">&times;</button>
                </div>
                <div class="modal-body" style="padding:20px;">
                    <div class="setting-group">
                        <label>${isRecharge ? '充值金额' : '提现金额'}</label>
                        <div style="display:flex;align-items:center;border-bottom:1px solid #eee;padding-bottom:5px;">
                            <span style="font-size:24px;font-weight:bold;color:#000;">¥</span>
                            <input type="number" id="forum-wallet-amount-input" placeholder="0.00" style="border:none;font-size:24px;font-weight:bold;width:100%;background:transparent;outline:none;color:#000;">
                        </div>
                    </div>
                    <button id="forum-wallet-amount-confirm-btn" class="ios-btn-block" style="margin-top:20px;background-color:#000;">确认</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const close = () => modal.remove();
        const closeBtn = modal.querySelector('.close-btn');
        const confirmBtn = modal.querySelector('#forum-wallet-amount-confirm-btn');
        const input = modal.querySelector('#forum-wallet-amount-input');
        if (closeBtn) closeBtn.addEventListener('click', close);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                const amount = Number(input ? input.value : '');
                if (!Number.isFinite(amount) || amount <= 0) {
                    alert('请输入有效金额');
                    return;
                }
                close();
                onConfirm(amount);
            });
        }
        if (input) {
            input.focus();
            input.value = '';
        }
    }

    function handleForumWalletRecharge() {
        ensureForumWalletInitialized();
        openForumWalletAmountModal('recharge', (amount) => {
            if (typeof window.ensureFamilyQuotaMonthReset === 'function') {
                window.ensureFamilyQuotaMonthReset(false);
            }
            if (typeof window.selectBankFundingSource !== 'function' || typeof window.applyBankDebit !== 'function') {
                alert('银行资金功能不可用');
                return;
            }
            window.selectBankFundingSource({ amount }).then((source) => {
                const debitResult = window.applyBankDebit(amount, source);
                if (!debitResult.ok) {
                    alert(debitResult.message || '扣款失败');
                    return;
                }
                const wallet = getForumWalletState();
                wallet.balance = Number((Number(wallet.balance || 0) + amount).toFixed(2));
                wallet.transactions.unshift({
                    id: Date.now(),
                    title: 'Wallet Top-up from Bank',
                    timeText: 'Just now',
                    amount: amount,
                    type: 'positive',
                    iconType: 'income',
                    iconSvg: getWalletTxIconSvg('income')
                });
                if (wallet.transactions.length > 30) wallet.transactions = wallet.transactions.slice(0, 30);
                if (typeof window.appendBankTransaction === 'function') {
                    window.appendBankTransaction({
                        type: 'expense',
                        amount,
                        title: '转出到论坛钱包',
                        sourceApp: 'forum_wallet',
                        sourceType: source.type === 'family_card' ? 'family_card' : 'cash',
                        sourceKey: source.key,
                        sourceLabel: source.label
                    });
                }
                saveForumWalletState();
                if (window.saveConfig) window.saveConfig();
                if (window.renderBankBalance) window.renderBankBalance();
                if (window.renderBankStatementView) window.renderBankStatementView();
                if (forumState.activeTab === 'forum_wallet') renderForum(false);
            }).catch(() => {});
        });
    }

    function handleForumWalletWithdraw() {
        ensureForumWalletInitialized();
        openForumWalletAmountModal('withdraw', (amount) => {
            if (typeof window.ensureFamilyQuotaMonthReset === 'function') {
                window.ensureFamilyQuotaMonthReset(false);
            }
            const wallet = getForumWalletState();
            if (Number(wallet.balance || 0) < amount) {
                alert('论坛钱包余额不足');
                return;
            }
            wallet.balance = Number((Number(wallet.balance || 0) - amount).toFixed(2));
            wallet.transactions.unshift({
                id: Date.now(),
                title: 'Withdraw to Bank',
                timeText: 'Just now',
                amount: amount,
                type: 'negative',
                iconType: 'expense',
                iconSvg: getWalletTxIconSvg('expense')
            });
            if (wallet.transactions.length > 30) wallet.transactions = wallet.transactions.slice(0, 30);
            if (typeof window.applyBankCredit === 'function') {
                window.applyBankCredit(amount, '来自论坛钱包提现', {
                    sourceApp: 'forum_wallet',
                    sourceType: 'cash',
                    sourceLabel: '论坛钱包'
                });
            }
            saveForumWalletState();
            if (window.saveConfig) window.saveConfig();
            if (window.renderBankBalance) window.renderBankBalance();
            if (window.renderBankStatementView) window.renderBankStatementView();
            if (forumState.activeTab === 'forum_wallet') renderForum(false);
        });
    }

    function applyWalletGiftExpense(totalValue, giftName, count, giftEmoji) {
        const wallet = getForumWalletState();
        const spend = Math.max(0, Number(totalValue) || 0);
        if (!wallet.initialized) {
            wallet.initialized = true;
            wallet.balance = Math.max(0, Number(wallet.balance) || 0);
        }
        if (wallet.balance < spend) {
            alert(`余额不足，当前余额 ¥${formatWalletAmount(wallet.balance)}`);
            return false;
        }
        wallet.balance -= spend;
        wallet.transactions.unshift({
            id: Date.now(),
            title: `Gift: ${giftName}${count > 1 ? ` x${count}` : ''} ${giftEmoji || ''}`.trim(),
            timeText: 'Just now',
            amount: spend,
            type: 'negative',
            iconType: 'gift',
            iconSvg: getWalletTxIconSvg('gift')
        });
        if (wallet.transactions.length > 30) wallet.transactions = wallet.transactions.slice(0, 30);
        saveForumWalletState();
        if (forumState.activeTab === 'forum_wallet') renderForum(false);
        return true;
    }

    function renderOtherProfileHeader() {
        const user = forumState.viewingUser;
        if (!user) return '';
        
        const isPostView = forumState.activeTab === 'other_profile_posts';

        if (forumState.profileMultiSelectMode) {
            const userPosts = forumState.posts.filter(p => p.user.name === user.name);
            const isAllSelected = userPosts.length > 0 && forumState.profileSelectedPostIds.size === userPosts.length;
            const hasSelection = forumState.profileSelectedPostIds.size > 0;

            return `
                <div class="forum-header">
                    <div class="header-left" style="display: flex; align-items: center; gap: 15px; flex: 1;">
                        <span id="profile-multiselect-done" style="font-weight: 400; font-size: 16px; cursor: pointer;">取消</span>
                    </div>
                    <div class="header-center">
                        <span style="font-weight: 700; font-size: 16px;">已选择 ${forumState.profileSelectedPostIds.size} 项</span>
                    </div>
                    <div class="header-right" style="gap: 15px;">
                         <span id="profile-multiselect-all" style="font-weight: 600; color: #0095f6; cursor: pointer; font-size: 14px;">${isAllSelected ? '取消全选' : '全选'}</span>
                         <span id="profile-multiselect-delete" style="font-weight: 600; color: ${hasSelection ? '#ed4956' : '#ccc'}; cursor: pointer; font-size: 14px;">删除</span>
                    </div>
                </div>
            `;
        }

        if (isPostView) {
            return `
                <div class="forum-header">
                    <div class="header-left">
                        <i class="fas fa-chevron-left" onclick="window.backToOtherProfile()" style="font-size: 24px; cursor: pointer;"></i>
                    </div>
                    <div class="header-center" style="display: flex; flex-direction: column; align-items: center;">
                        <div style="font-size: 16px; color: #000; font-weight: 700; line-height: 1.2;">帖子</div>
                        <div style="font-size: 12px; color: #666; font-weight: 400; line-height: 1.2;">${user.name}</div>
                    </div>
                    <div class="header-right">
                        <!-- Placeholder -->
                    </div>
                </div>
            `;
        }

        return `
            <div class="forum-header">
                <div class="header-left" style="display: flex; align-items: center; gap: 15px; flex: 1;">
                    <i class="fas fa-chevron-left" id="other-profile-back" style="font-size: 24px; cursor: pointer;"></i>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span style="font-weight: 700; font-size: 16px;">${user.username || user.name}</span>
                        ${user.verified ? '<i class="fas fa-check-circle" style="color: #0095f6; font-size: 14px;"></i>' : ''}
                    </div>
                </div>
                <div class="header-center">
                    <!-- Empty center -->
                </div>
                <div class="header-right">
                    <i class="fas fa-ellipsis-h" id="other-profile-menu-btn" style="font-size: 20px; color: #000; cursor: pointer;"></i>
                </div>
            </div>
        `;
    }

    // --- Tabs Content ---

    function renderHomeTab() {
        return `
            <div class="stories-container">
                ${forumState.stories.map(renderStory).join('')}
            </div>
            <div class="feed-container">
                ${forumState.posts.map(renderPost).join('')}
            </div>
        `;
    }

    function renderLiveTab() {
        let lives = forumState.liveStreams;
        if (!lives || lives.length === 0) {
            lives = [
                { category: 'Music', title: 'Midnight Jazz 🎷', username: 'Alice', viewers: '1.2k', image: 'https://i.postimg.cc/fymR94qp/IMG-6099.jpg' },
                { category: 'Design', title: 'Minimalist UI Design', username: 'Studio A', viewers: '856', image: 'https://i.postimg.cc/kGKgbrY0/IMG-6100.jpg' },
                { category: 'Chatting', title: 'Late Night Code 💻', username: 'DevJohn', viewers: '2.3k', image: 'https://i.postimg.cc/3RPwNr1v/IMG-6101.jpg' },
                { category: 'Travel', title: 'Tokyo Rain ☔️', username: 'Walker', viewers: '5.1k', image: 'https://i.postimg.cc/bJKvrYgd/IMG-6102.jpg' },
                { category: 'Chatting', title: 'Morning Brew ☕️', username: 'Barista', viewers: '300', image: 'https://i.postimg.cc/NMW0FGDJ/IMG-6103.jpg' },
                { category: 'Music', title: 'Study With Me 📚', username: 'Beats', viewers: '10k', image: 'https://i.postimg.cc/C1Z1wnGx/IMG-6104.jpg' }
            ];
        }

        const categories = ['All', ...new Set(lives.map(l => l.category))].slice(0, 6);

        const categoryHtml = categories.map((cat, i) => `
            <div class="forum-cat-btn ${i === 0 ? 'active' : ''}" onclick="window.filterForumLiveCategory('${cat}')">${cat}</div>
        `).join('');

        const cardsHtml = lives.map(live => {
            // Resolve Display Name for Card (prioritize Remark)
            let displayUsername = live.username;
            if (window.iphoneSimState && window.iphoneSimState.contacts) {
                const contacts = window.iphoneSimState.contacts;
                const profiles = (forumState.settings && forumState.settings.contactProfiles) ? forumState.settings.contactProfiles : {};
                
                // Try to find contact matching this username (which might be Name, Remark, or Profile Name)
                // Helper to check match
                const isMatch = (c, nameToCheck) => {
                    if (!nameToCheck) return false;
                    const p = profiles[c.id] || {};
                    
                    // 1. Exact Name Matches
                    if (c.remark === nameToCheck || p.name === nameToCheck || c.name === nameToCheck) return true;
                    
                    // 2. Bio/Persona Content Match
                    if (nameToCheck.length > 1) {
                         if (p.bio && p.bio.includes(nameToCheck)) return true;
                         if (c.persona && c.persona.includes(nameToCheck)) return true;
                    }
                    return false;
                };

                let foundContact = null;
                // 1. Try linked contacts
                const linkedIds = (forumState.settings && forumState.settings.linkedContacts) ? forumState.settings.linkedContacts : [];
                for (const id of linkedIds) {
                    const c = contacts.find(contact => contact.id === id);
                    if (c && isMatch(c, live.username)) {
                        foundContact = c;
                        break;
                    }
                }
                // 2. Fallback (Exact only)
                if (!foundContact) {
                    foundContact = contacts.find(c => {
                        const p = profiles[c.id] || {};
                        return c.remark === live.username || p.name === live.username || c.name === live.username;
                    });
                }

                if (foundContact) {
                    const p = profiles[foundContact.id] || {};
                    displayUsername = p.name || foundContact.remark || foundContact.name;
                }
            }

            const titleEnc = encodeURIComponent(live.title || '').replace(/'/g, "%27");
            const usernameEnc = encodeURIComponent(displayUsername || '').replace(/'/g, "%27"); // Pass resolved name
            const actionDescEnc = encodeURIComponent(live.action_desc || live.actionDesc || '').replace(/'/g, "%27");
            const initialCommentsStr = encodeURIComponent(JSON.stringify(live.initial_comments || [])).replace(/'/g, "%27");
            const viewersEnc = encodeURIComponent((live.viewers || '').toString()).replace(/'/g, "%27");
            
            return `
            <div class="forum-live-card" data-category="${live.category}" onclick="window.openForumLiveRoom(decodeURIComponent('${titleEnc}'), decodeURIComponent('${usernameEnc}'), decodeURIComponent('${actionDescEnc}'), '${initialCommentsStr}', decodeURIComponent('${viewersEnc}'))">
                <div class="forum-live-card-image" style="background-image: url('${live.image}'); background-size: cover; background-position: center;"></div>
                <div class="forum-live-card-badge">
                    <div class="forum-live-status-dot"></div> LIVE
                </div>
                <div class="forum-live-card-info">
                    <div class="forum-live-card-title">${live.title}</div>
                    <div class="forum-live-card-meta">
                        <span>${displayUsername} • ${live.viewers} watching</span>
                    </div>
                </div>
                <div class="forum-live-card-category">${live.category}</div>
            </div>
        `}).join('');

        return `
            <div class="forum-live-big-text">Live</div>
            
            <div class="forum-category-scroll">
                ${categoryHtml}
            </div>

            <div class="forum-live-grid">
                ${cardsHtml}
            </div>
        `;
    }

    window.openLiveWallpaperSettings = function() {
        forumState.activeTab = 'live_settings';
        renderForum();
    };

    window.closeLiveWallpaperSettings = function() {
        forumState.activeTab = 'video';
        renderForum();
    };

    window.handleLiveWallpaperUpload = function(input) {
        if (input.files && input.files.length > 0) {
            Array.from(input.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        // Compress image to avoid QuotaExceededError
                        const compressed = await compressImage(e.target.result, 0.7, 800);
                        if (!forumState.liveWallpapers) forumState.liveWallpapers = [];
                        forumState.liveWallpapers.unshift(compressed);
                        
                        // Persist
                        localStorage.setItem('forum_liveWallpapers', JSON.stringify(forumState.liveWallpapers));
                        renderForum();
                    } catch (err) {
                        console.error("Image upload failed", err);
                        alert("图片处理失败");
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    window.setLiveWallpaper = function(img) {
        forumState.currentLiveWallpaper = img;
        localStorage.setItem('forum_currentLiveWallpaper', img);
        renderForum();
    };

    window.deleteLiveWallpaper = function(e, index) {
        e.stopPropagation();
        if (confirm('确定删除这张壁纸吗？')) {
            const deletedImg = forumState.liveWallpapers[index];
            forumState.liveWallpapers.splice(index, 1);
            
            // If deleting current wallpaper, clear it
            if (forumState.currentLiveWallpaper === deletedImg) {
                forumState.currentLiveWallpaper = '';
                localStorage.setItem('forum_currentLiveWallpaper', '');
            }
            
            localStorage.setItem('forum_liveWallpapers', JSON.stringify(forumState.liveWallpapers));
            renderForum();
        }
    };

    function renderLiveSettings() {
        const wallpapers = forumState.liveWallpapers || [];
        
        const gridHtml = wallpapers.map((img, index) => {
            const isSelected = forumState.currentLiveWallpaper === img;
            return `
                <div class="live-wallpaper-item ${isSelected ? 'selected' : ''}" onclick="window.setLiveWallpaper('${img}')" style="position: relative; aspect-ratio: 9/16; background-image: url('${img}'); background-size: cover; background-position: center; border-radius: 8px; overflow: hidden; cursor: pointer; border: ${isSelected ? '3px solid #0095f6' : '1px solid #ddd'};">
                    ${isSelected ? '<div style="position: absolute; top: 5px; right: 5px; background: #0095f6; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; justify-content: center; align-items: center; font-size: 12px;"><i class="fas fa-check"></i></div>' : ''}
                    <div onclick="window.deleteLiveWallpaper(event, ${index})" style="position: absolute; bottom: 5px; right: 5px; background: rgba(0,0,0,0.5); color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center; font-size: 12px; cursor: pointer;"><i class="fas fa-trash"></i></div>
                </div>
            `;
        }).join('');

        const isDefaultSelected = !forumState.currentLiveWallpaper;

        return `
            <div style="padding: 20px;">
                <div style="margin-bottom: 20px;">
                    <div style="font-weight: 600; margin-bottom: 10px;">当前壁纸</div>
                    <div style="width: 100px; aspect-ratio: 9/16; background: ${forumState.currentLiveWallpaper ? `url('${forumState.currentLiveWallpaper}')` : '#f0f2f5'}; background-size: cover; border-radius: 8px; border: 1px solid #ddd;"></div>
                </div>

                <div style="margin-bottom: 20px;">
                    <div style="font-weight: 600; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
                        <span>我的壁纸</span>
                        <button onclick="document.getElementById('live-wallpaper-upload').click()" style="background: #0095f6; color: white; border: none; padding: 5px 12px; border-radius: 4px; font-size: 13px; font-weight: 600;">上传</button>
                    </div>
                    <input type="file" id="live-wallpaper-upload" accept="image/*" style="display: none;" onchange="window.handleLiveWallpaperUpload(this)">
                    
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        <div class="live-wallpaper-item ${isDefaultSelected ? 'selected' : ''}" onclick="window.setLiveWallpaper('')" style="aspect-ratio: 9/16; background: #f0f2f5; border-radius: 8px; display: flex; justify-content: center; align-items: center; cursor: pointer; border: ${isDefaultSelected ? '3px solid #0095f6' : '1px solid #ddd'}; color: #666; font-size: 13px;">
                            默认
                            ${isDefaultSelected ? '<div style="position: absolute; top: 5px; right: 5px; background: #0095f6; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; justify-content: center; align-items: center; font-size: 12px;"><i class="fas fa-check"></i></div>' : ''}
                        </div>
                        ${gridHtml}
                    </div>
                </div>
            </div>
        `;
    }

    function renderDMTab() {
        // Search bar + Notes + Messages List
        
        const multiSelectBarHtml = forumState.dmMultiSelectMode ? `
            <div class="forum-multi-select-bar" style="position: absolute; bottom: 0; left: 0; width: 100%; z-index: 2005;">
                <div class="multi-select-left-actions">
                    <button class="multi-select-cancel-btn" id="dm-ms-cancel">取消</button>
                    <button class="multi-select-all-btn" id="dm-ms-all">${forumState.selectedDmIds.size === forumState.messages.length && forumState.messages.length > 0 ? '取消全选' : '全选'}</button>
                </div>
                <button class="multi-select-delete-btn ${forumState.selectedDmIds.size === 0 ? 'is-disabled' : ''}" id="dm-ms-delete">删除 (${forumState.selectedDmIds.size})</button>
            </div>
        ` : '';

        // Add padding bottom if multi-select mode to avoid content being covered by bar
        const listStyle = forumState.dmMultiSelectMode ? 'padding-bottom: 60px;' : '';

        return `
            <div class="dm-notes-container">
                ${forumState.dmNotes.map(renderDMNote).join('')}
            </div>

            <div class="dm-section-header">
                <div class="dm-section-title">消息 <i class="fas fa-bell-slash" style="font-size: 14px; margin-left: 5px; color: #000;"></i></div>
                <div class="dm-section-action">陌生消息</div>
            </div>

            <div class="dm-messages-list" style="${listStyle}">
                ${forumState.messages.map(renderDMMessage).join('')}
            </div>
            ${multiSelectBarHtml}
        `;
    }

    function renderEditProfile() {
        const user = forumState.currentUser;
        return `
            <div class="edit-profile-container">
                <input type="file" id="avatar-upload-input" style="display: none;" accept="image/*">
                <div class="edit-profile-avatar-section">
                    <div class="edit-avatar-wrapper">
                         <img src="${user.avatar}" class="edit-profile-avatar">
                    </div>
                    <div class="edit-avatar-text">编辑头像或虚拟形象</div>
                </div>

                <div class="edit-form-group">
                    <div class="edit-form-row">
                        <label>姓名</label>
                        <input type="text" id="edit-name-input" value="${user.bio}" placeholder="姓名" style="background: transparent;">
                    </div>
                    <div class="edit-form-row">
                        <label>账号</label>
                        <input type="text" id="edit-username-input" value="${user.username}" placeholder="账号" style="background: transparent;">
                    </div>
                    <div class="edit-form-row">
                        <label>个性签名</label>
                         <input type="text" id="edit-signature-input" value="${user.signature || ''}" placeholder="个性签名" style="background: transparent;">
                    </div>
                    <div class="edit-form-row">
                        <label>公众身份</label>
                        <input type="text" id="edit-public-identity-input" value="${user.publicIdentity || ''}" placeholder="公众形象身份" style="background: transparent;">
                    </div>
                    <div class="edit-form-row">
                        <label>粉丝数量</label>
                        <input type="number" id="edit-followers-input" value="${user.followers || 0}" placeholder="粉丝数量" style="background: transparent;">
                    </div>
                     <div class="edit-form-row">
                        <label>性别</label>
                        <input type="text" id="edit-gender-input" value="${user.gender || '性别'}" placeholder="性别" style="color: #000; background: transparent;">
                    </div>
                </div>

                <div class="edit-profile-links">
                    <div class="edit-link-item">切换为专业账户</div>
                </div>
            </div>
        `;
    }

    window.toggleContactSelection = function(el) {
        const icon = el.querySelector('.forum-contact-check-icon');
        if (!icon) return;
        
        const isChecked = icon.dataset.checked === 'true';
        
        if (isChecked) {
            // Uncheck
            icon.className = 'forum-contact-check-icon far fa-circle';
            icon.style.color = '#dbdbdb';
            icon.dataset.checked = 'false';
        } else {
            // Check
            icon.className = 'forum-contact-check-icon fas fa-check-circle';
            icon.style.color = '#0095f6';
            icon.dataset.checked = 'true';
        }
    };

    function renderForumSettings() {
        const contacts = window.iphoneSimState.contacts || [];
        const worldbooks = window.iphoneSimState.wbCategories || [];
        
        let contactsHtml = '';
        contacts.forEach(c => {
            const isChecked = forumState.settings && forumState.settings.linkedContacts && forumState.settings.linkedContacts.includes(c.id);
            contactsHtml += `
                <div class="edit-form-row" onclick="window.toggleContactSelection(this)">
                    <label style="flex: 1;">${c.remark || c.name}</label>
                    <i class="forum-contact-check-icon ${isChecked ? 'fas fa-check-circle' : 'far fa-circle'}" data-id="${c.id}" data-checked="${isChecked}" style="font-size: 22px; color: ${isChecked ? '#0095f6' : '#dbdbdb'}; margin-right: 5px;"></i>
                </div>
            `;
        });

        let linkedListHtml = '';
        if (forumState.settings && forumState.settings.linkedContacts) {
            forumState.settings.linkedContacts.forEach(cid => {
                const c = contacts.find(contact => contact.id === cid);
                if (c) {
                    linkedListHtml += `
                        <div class="edit-form-row" style="cursor: pointer;" onclick="window.openEditForumContact(${c.id})">
                            <label style="flex: 1;">${c.remark || c.name}</label>
                            <div style="color: #0095f6; font-size: 14px;">编辑资料 ></div>
                        </div>
                    `;
                }
            });
        }

        let worldbooksHtml = '<option value="">-- 选择世界书 --</option>';
        worldbooks.forEach(wb => {
            const isSelected = forumState.settings && forumState.settings.linkedWorldbook == wb.id;
            worldbooksHtml += `<option value="${wb.id}" ${isSelected ? 'selected' : ''}>${wb.name}</option>`;
        });

        const currentWorldview = (forumState.settings && forumState.settings.forumWorldview) ? forumState.settings.forumWorldview : '';

        return `
            <div class="edit-profile-container">
                <div class="edit-form-group">
                    <div style="font-weight: 600; margin-bottom: 10px;">关联联系人</div>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #efefef; padding: 0 10px; border-radius: 8px;">
                        ${contactsHtml || '<div style="padding:10px; color:#999;">暂无联系人</div>'}
                    </div>
                </div>

                ${linkedListHtml ? `
                <div class="edit-form-group" style="margin-top: 20px;">
                    <div style="font-weight: 600; margin-bottom: 10px;">已关联角色的论坛资料</div>
                    <div style="border: 1px solid #efefef; padding: 0 10px; border-radius: 8px;">
                        ${linkedListHtml}
                    </div>
                </div>
                ` : ''}

                <div class="edit-form-group">
                    <div style="font-weight: 600; margin-bottom: 10px;">关联世界书</div>
                    <select id="forum-worldbook-select" style="width: 100%; padding: 10px; border: 1px solid #dbdbdb; border-radius: 8px; background: #fff;">
                        ${worldbooksHtml}
                    </select>
                </div>

                <div class="edit-form-group">
                    <div style="font-weight: 600; margin-bottom: 10px;">论坛世界观</div>
                    <textarea id="forum-worldview-input" placeholder="输入在这个论坛中的世界观设定..." style="width: 100%; height: 150px; padding: 10px; border: 1px solid #dbdbdb; border-radius: 8px; resize: none; font-family: inherit;">${currentWorldview}</textarea>
                </div>
            </div>
        `;
    }

    function renderForumEditContact() {
        const contactId = forumState.editingContactId;
        const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
        if (!contact) return '<div>联系人不存在</div>';

        const profiles = forumState.settings.contactProfiles || {};
        const profile = profiles[contactId] || {};

        const avatar = profile.avatar || contact.avatar;
        const name = profile.name || contact.remark || contact.name;
        const username = profile.username || contact.id; // Default ID
        const bio = profile.bio || '';
        const identity = profile.identity || '';
        const followers = profile.followers !== undefined ? profile.followers : 0;
        const following = profile.following !== undefined ? profile.following : 0;
        const syncWechat = profile.syncWechat || false;
        const autoPostEnabled = profile.autoPostEnabled || false;
        const autoPostInterval = profile.autoPostInterval || 60; // in minutes

        return `
            <div class="edit-profile-container">
                <input type="file" id="forum-contact-avatar-input" style="display: none;" accept="image/*">
                <div class="edit-profile-avatar-section">
                    <div class="edit-avatar-wrapper" id="forum-contact-avatar-wrapper">
                         <img src="${avatar}" class="edit-profile-avatar" id="forum-contact-avatar-preview">
                    </div>
                    <div class="edit-avatar-text" onclick="document.getElementById('forum-contact-avatar-input').click()">更换头像</div>
                </div>

                <div class="edit-form-group">
                    <div class="edit-form-row">
                        <label>网名</label>
                        <input type="text" id="fc-name" value="${name}" placeholder="网名">
                    </div>
                    <div class="edit-form-row">
                        <label>ID</label>
                        <input type="text" id="fc-username" value="${username}" placeholder="用户ID">
                    </div>
                    <div class="edit-form-row">
                        <label>公众身份</label>
                        <input type="text" id="fc-identity" value="${identity}" placeholder="例如: 知名博主">
                    </div>
                    <div class="edit-form-row">
                        <label>个性签名</label>
                        <input type="text" id="fc-bio" value="${bio}" placeholder="个性签名">
                    </div>
                    <div class="edit-form-row">
                        <label>粉丝量</label>
                        <input type="number" id="fc-followers" value="${followers}" placeholder="0">
                    </div>
                    <div class="edit-form-row">
                        <label>关注量</label>
                        <input type="number" id="fc-following" value="${following}" placeholder="0">
                    </div>

                    <div class="edit-profile-section-title" style="margin-top: 20px; font-weight: bold; font-size: 14px; color: #666; margin-bottom: 10px; padding-left: 5px;">AI生图设置</div>
                    <div class="edit-form-row">
                        <label>自动生图</label>
                        <label class="toggle-switch" style="transform: scale(0.8); transform-origin: right center;">
                            <input type="checkbox" id="fc-auto-image" ${profile.autoImage ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="edit-form-row">
                        <label>知道这是用户本人</label>
                        <label class="toggle-switch" style="transform: scale(0.8); transform-origin: right center;">
                            <input type="checkbox" id="fc-knows-user" ${profile.knowsUser ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="edit-form-row">
                        <label>与微信记忆互通</label>
                        <label class="toggle-switch" style="transform: scale(0.8); transform-origin: right center;">
                            <input type="checkbox" id="fc-sync-wechat" ${syncWechat ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="edit-form-row">
                        <label>定时自动发帖</label>
                        <label class="toggle-switch" style="transform: scale(0.8); transform-origin: right center;">
                            <input type="checkbox" id="fc-auto-post" ${autoPostEnabled ? 'checked' : ''}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                    <div class="edit-form-row" style="flex-direction: column; align-items: flex-start;">
                        <label style="margin-bottom:8px;">发帖间隔 (分钟)</label>
                        <input type="number" id="fc-auto-post-interval" value="${autoPostInterval}" placeholder="60" style="width: 100%;">
                    </div>
                    <div class="edit-form-row" style="flex-direction: column; align-items: flex-start; height: auto;">
                        <label style="margin-bottom: 8px;">生图提示词预设</label>
                        <select id="fc-image-preset" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-family: inherit; background: white;">
                            <option value="">-- 选择预设 --</option>
                            <option value="AUTO_MATCH" ${profile.imagePresetName === 'AUTO_MATCH' ? 'selected' : ''}>✨ 自动匹配 (AI检测)</option>
                            ${(window.iphoneSimState.novelaiPresets || []).map(p => `<option value="${p.name}" ${profile.imagePresetName === p.name ? 'selected' : ''}>${p.name}</option>`).join('')}
                        </select>
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">请选择在“设置”应用中保存的生图预设</div>
                    </div>
                </div>
            </div>
        `;
    }

    window.openEditForumContact = function(contactId) {
        forumState.editingContactId = contactId;
        forumState.activeTab = 'forum_edit_contact';
        renderForum();
    };

    function renderProfileTab() {
        const user = forumState.currentUser;
        const activeTab = forumState.profileActiveTab || 'posts';
        
        // Filter my posts
        const myPosts = forumState.posts.filter(p => p.user.username === user.username);
        
        let postsContent = '';
        if (myPosts.length > 0) {
            const gridItems = myPosts.map(post => {
                let contentHtml = '';
                if (post.image) {
                    contentHtml = `<img src="${post.image}" style="width: 100%; height: 100%; object-fit: cover; display: block;">`;
                } else {
                    contentHtml = `
                        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #000; font-size: 12px; padding: 10px; text-align: center; background-color: #fff; overflow: hidden;">
                            ${post.caption.substring(0, 50)}...
                        </div>
                    `;
                }
                return `
                    <div class="profile-grid-item" onclick="window.viewMyProfilePosts(${post.id})" style="aspect-ratio: 3/4; background-color: #efefef; position: relative; border: 0.5px solid #fff; cursor: pointer;">
                        ${contentHtml}
                    </div>
                `; 
            }).join('');
            
            postsContent = `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; padding-bottom: 2px;">
                    ${gridItems}
                </div>
            `;
        } else {
             postsContent = `
                <div style="padding: 40px; text-align: center; color: #8e8e8e; font-size: 14px;">
                    暂无帖子
                </div>
            `;
        }

        const taggedContent = `
            <div style="padding: 40px; text-align: center; color: #8e8e8e; font-size: 14px;">
                <div style="font-size: 40px; margin-bottom: 10px;"><i class="far fa-play-circle"></i></div>
                暂无视频
            </div>
        `;

        const tabClass = activeTab === 'posts' ? 'tab-posts' : 'tab-tagged';

        return `
            <div class="profile-container">
                <div class="profile-header-section">
                    <div class="profile-top-row">
                        <div class="profile-avatar-wrapper">
                            <img src="${user.avatar}" class="profile-avatar-large">
                        </div>
                        <div class="profile-right-column">
                            <div class="profile-username-large">${user.bio}</div>
                                <div class="profile-stats">
                                    <div class="stat-item">
                                        <span class="stat-num">${formatCount(user.posts)}</span>
                                        <span class="stat-label">帖子</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-num">${formatCount(user.followers)}</span>
                                        <span class="stat-label">粉丝</span>
                                    </div>
                                    <div class="stat-item">
                                        <span class="stat-num">${formatCount(user.following)}</span>
                                        <span class="stat-label">关注</span>
                                    </div>
                                </div>
                        </div>
                    </div>

                    <div class="profile-bio-section">
                        <div class="profile-bio-text">${user.signature || ''}</div>
                    </div>

                    <div class="profile-actions-row">
                        <button class="profile-btn" id="my-profile-edit-btn">编辑主页</button>
                        <button class="profile-btn">分享主页</button>
                        <button class="profile-btn-icon" id="forum-settings-btn"><i class="fas fa-user-plus"></i></button>
                    </div>
                </div>
                
                <div class="profile-tabs-bar ${tabClass}">
                    <div class="profile-tab" id="profile-tab-posts" onclick="window.updateProfileTab('posts')">
                        <img src="${activeTab === 'posts' ? 'https://i.postimg.cc/ydkWQvw2/无标题102_20260214211949.png' : 'https://i.postimg.cc/gJnrSNfM/无标题102_20260214211944.png'}" class="profile-tab-icon" id="icon-posts">
                    </div>
                    <div class="profile-tab" id="profile-tab-tagged" onclick="window.updateProfileTab('tagged')">
                        <img src="${activeTab === 'tagged' ? 'https://i.postimg.cc/4dmnLBrr/无标题102_20260214212200.png' : 'https://i.postimg.cc/wv73f0Sr/无标题102_20260214212136.png'}" class="profile-tab-icon" id="icon-tagged">
                    </div>
                    <div class="tab-indicator">
                        <div class="tab-indicator-inner"></div>
                    </div>
                </div>
                
                <div class="profile-content-window">
                    <div class="profile-content-slider ${tabClass}">
                        <div class="profile-content-panel">
                            ${postsContent}
                        </div>
                        <div class="profile-content-panel">
                            ${taggedContent}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderOtherProfile() {
        const user = forumState.viewingUser;
        if (!user) return '<div>User not found</div>';
        
        const isFollowing = user.isFollowing;
        const followBtnText = isFollowing ? '已关注 <i class="fas fa-chevron-down" style="font-size: 12px; margin-left: 2px;"></i>' : '关注';
        const followBtnStyle = isFollowing ? '' : 'background-color: #455EFF; color: white;';

        // Mock data if missing
        const postsCount = user.stats ? (user.stats.posts || 0) : 0;
        const followersCount = user.stats ? (user.stats.followers || 0) : 0;
        const followingCount = user.stats ? (user.stats.following || 0) : 0;
        const realName = user.realName || user.name || ''; 
        const bio = user.bio || user.subtitle || '';
        const link = user.link || '';
        
        // Loading State
        if (user.isGeneratingProfile) {
            return `
                <div class="profile-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 32px; color: #0095f6; margin-bottom: 20px;"></i>
                    <div style="color: #8e8e8e;">正在生成主页内容...</div>
                </div>
            `;
        }

        // Generate a grid of images (using the user's posts or placeholders)
        const userPosts = forumState.posts.filter(p => p.user.name === user.name);
        
        // Generate grid of images
        let gridHtml = '';
        
        for (let i = 0; i < userPosts.length; i++) {
            const post = userPosts[i];
            const isSelected = forumState.profileMultiSelectMode && forumState.profileSelectedPostIds.has(post.id);
            const selectAttr = forumState.profileMultiSelectMode ? `onclick="window.toggleProfilePostSelection(${post.id})"` : `onclick="window.viewOtherProfilePosts(${post.id})"`;
            const selectedClass = isSelected ? 'selected' : '';
            
            gridHtml += `
                <div class="profile-grid-item ${selectedClass}" data-post-id="${post.id}" ${selectAttr} style="aspect-ratio: 3/4; background-color: #efefef; position: relative; cursor: pointer;">
                    ${forumState.profileMultiSelectMode ? `<div class="grid-item-checkbox"></div>` : ''}
                    ${post.image ? `<img src="${post.image}" style="width: 100%; height: 100%; object-fit: cover; display: block;">` : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #8e8e8e; font-size: 12px; padding: 10px; text-align: center;">${post.caption.substring(0, 20)}...</div>`}
                </div>
            `;
        }

        const activeTab = forumState.otherProfileActiveTab || 'posts';
        const tabClass = activeTab === 'posts' ? 'tab-posts' : (activeTab === 'tagged' ? 'tab-tagged' : (activeTab === 'tab3' ? 'tab-tab3' : 'tab-tab4'));

        const postsContent = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px;">
                ${gridHtml}
            </div>
        `;

        const taggedContent = `
            <div style="padding: 40px; text-align: center; color: #8e8e8e; font-size: 14px;">
                <div style="font-size: 40px; margin-bottom: 10px;"><i class="far fa-play-circle"></i></div>
                暂无视频
            </div>
        `;

        const tab3Content = `
            <div style="padding: 40px; text-align: center; color: #8e8e8e; font-size: 14px;">
                暂无内容
            </div>
        `;

        const tab4Content = `
            <div style="padding: 40px; text-align: center; color: #8e8e8e; font-size: 14px;">
                暂无内容
            </div>
        `;

        return `
            <div class="profile-container">
                <div class="profile-header-section">
                    <div class="profile-top-row" style="margin-bottom: 10px;">
                        <div class="profile-avatar-wrapper" style="margin-right: 25px;">
                            <img src="${user.avatar}" class="profile-avatar-large" style="width: 80px; height: 80px; border-radius: 50%;">
                        </div>
                        <div class="profile-right-column" style="justify-content: center;">
                            <div class="profile-username-large" style="font-weight: 700; font-size: 16px; margin-bottom: 0; display: none;">${user.name}</div>
                            
                            <div class="profile-stats" style="margin-right: 0; justify-content: space-around;">
                                <div class="stat-item" style="margin-right: 0;">
                                    <span class="stat-num">${formatCount(postsCount)}</span>
                                    <span class="stat-label">帖子</span>
                                </div>
                                <div class="stat-item" style="margin-right: 0;">
                                    <span class="stat-num">${formatCount(followersCount)}</span>
                                    <span class="stat-label">粉丝</span>
                                </div>
                                <div class="stat-item" style="margin-right: 0;">
                                    <span class="stat-num">${formatCount(followingCount)}</span>
                                    <span class="stat-label">关注</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-bio-section" style="padding: 0;">
                        <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px;">${realName}</div>
                        <div class="profile-bio-text" style="color: #262626; margin-bottom: 2px;">${bio}</div>
                        <div style="font-weight: 600; font-size: 14px; margin-bottom: 2px;">查看翻译</div>
                        <div style="color: #00376b; font-weight: 600; font-size: 14px; display: flex; align-items: center;">
                            <i class="fas fa-link" style="font-size: 12px; margin-right: 5px; transform: rotate(45deg);"></i>
                            ${link}
                        </div>
                    </div>

                    <div class="profile-actions-row" style="margin-top: 15px;">
                        <button class="profile-btn" id="other-profile-follow-btn" style="${followBtnStyle}">${followBtnText}</button>
                        <button class="profile-btn">发消息</button>
                        <button class="profile-btn-icon"><i class="fas fa-user-plus"></i></button>
                    </div>
                </div>
                
                <!-- Story Highlights Placeholder -->
                <div style="padding: 0 15px 10px; display: flex; gap: 15px; overflow-x: auto;">
                    <!-- Could add story highlights here if needed -->
                </div>

                <div class="profile-tabs-bar tabs-4-items ${tabClass}">
                    <div class="profile-tab" id="other-profile-tab-posts" onclick="window.updateOtherProfileTab('posts')">
                        <img src="${activeTab === 'posts' ? 'https://i.postimg.cc/ydkWQvw2/无标题102_20260214211949.png' : 'https://i.postimg.cc/gJnrSNfM/无标题102_20260214211944.png'}" class="profile-tab-icon" id="other-icon-posts">
                    </div>
                    <div class="profile-tab" id="other-profile-tab-tagged" onclick="window.updateOtherProfileTab('tagged')">
                        <img src="${activeTab === 'tagged' ? 'https://i.postimg.cc/4dmnLBrr/无标题102_20260214212200.png' : 'https://i.postimg.cc/wv73f0Sr/无标题102_20260214212136.png'}" class="profile-tab-icon" id="other-icon-tagged">
                    </div>
                    <div class="profile-tab" id="other-profile-tab-tab3" onclick="window.updateOtherProfileTab('tab3')">
                        <img src="${activeTab === 'tab3' ? 'https://i.postimg.cc/c1pGMbXX/无标题102_20260217014150.png' : 'https://i.postimg.cc/3r4HGTCF/无标题102_20260217014005.png'}" class="profile-tab-icon" id="other-icon-tab3">
                    </div>
                    <div class="profile-tab" id="other-profile-tab-tab4" onclick="window.updateOtherProfileTab('tab4')">
                        <img src="${activeTab === 'tab4' ? 'https://i.postimg.cc/Y25BfsbR/无标题102_20260217014057.png' : 'https://i.postimg.cc/kM0PFpfc/无标题102_20260217014034.png'}" class="profile-tab-icon" id="other-icon-tab4">
                    </div>
                    <div class="tab-indicator">
                        <div class="tab-indicator-inner"></div>
                    </div>
                </div>
                
                <div class="profile-content-window">
                    <div class="profile-content-slider slider-4-items ${tabClass}">
                        <div class="profile-content-panel">
                            ${postsContent}
                        </div>
                        <div class="profile-content-panel">
                            ${taggedContent}
                        </div>
                        <div class="profile-content-panel">
                            ${tab3Content}
                        </div>
                        <div class="profile-content-panel">
                            ${tab4Content}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    window.showCreateMenu = function() {
        const existing = document.getElementById('create-menu-overlay');
        if (existing) { existing.remove(); return; }

        const menu = document.createElement('div');
        menu.id = 'create-menu-overlay';
        menu.className = 'action-menu-overlay'; // Reuse overlay style from css
        
        // Items based on image
        const items = [
            { icon: 'https://i.postimg.cc/PxgVLPVD/无标题102_20260220203555.png', text: 'Reels', action: 'reels' },
            { icon: 'https://i.postimg.cc/ZRGs9Csc/无标题102_20260220203627.png', text: 'Edits', action: 'edits' },
            { icon: 'https://i.postimg.cc/wvC4t74W/无标题102_20260220203702.png', text: '帖子', action: 'post' },
            { icon: 'https://i.postimg.cc/bJ7VGsVg/无标题102_20260220203727.png', text: '快拍', action: 'story' },
            { icon: 'https://i.postimg.cc/LXcQqnQv/无标题102_20260220203752.png', text: '精选', action: 'highlight' },
            { icon: 'https://i.postimg.cc/MH1P1qgm/无标题102_20260220203828.png', text: '直播', action: 'live' }
        ];
        
        const itemsHtml = items.map(item => `
            <div class="create-menu-item" onclick="window.handleCreateMenuAction('${item.action}')">
                <img src="${item.icon}" class="create-menu-icon">
                <span class="create-menu-text">${item.text}</span>
            </div>
        `).join('');

        menu.innerHTML = `
            <div class="create-menu-container">
                 <div class="create-menu-drag-handle-area">
                    <div class="create-menu-drag-handle"></div>
                </div>
                <div class="create-menu-header">创建</div>
                <div class="create-menu-list">
                    ${itemsHtml}
                </div>
            </div>
        `;
        
        menu.addEventListener('click', (e) => {
            if (e.target === menu) menu.remove();
        });
        
        document.getElementById('forum-app').appendChild(menu);
    };

    function showProfileMenu() {
        const existing = document.getElementById('profile-action-menu');
        if (existing) { existing.remove(); return; }

        const menu = document.createElement('div');
        menu.id = 'profile-action-menu';
        menu.className = 'action-menu-overlay';
        menu.innerHTML = `
            <div class="action-menu-container">
                <div class="action-menu-item" onclick="window.handleProfileMenu('multiselect')">多选管理</div>
                <div class="action-menu-item" onclick="window.handleProfileMenu('regenerate')">重新生成</div>
                <div class="action-menu-item" onclick="window.handleProfileMenu('add_posts')">新增帖子</div>
                <div class="action-menu-cancel" onclick="document.getElementById('profile-action-menu').remove()">取消</div>
            </div>
        `;
        // Close on background click
        menu.addEventListener('click', (e) => {
            if (e.target === menu) menu.remove();
        });
        document.getElementById('forum-app').appendChild(menu);
    }

    function showRegenerateOptions() {
        const existing = document.getElementById('regenerate-options-menu');
        if (existing) { existing.remove(); return; }

        const menu = document.createElement('div');
        menu.id = 'regenerate-options-menu';
        menu.className = 'action-menu-overlay';
        menu.style.zIndex = '2001'; // Above the other menu
        menu.innerHTML = `
            <div class="action-menu-container">
                <div style="padding: 10px; text-align: center; color: #8e8e8e; font-size: 12px;">选择重新生成的内容 (旧内容将被覆盖)</div>
                <div class="action-menu-item" onclick="window.handleProfileMenu('regenerate_bio')">简介与数据</div>
                <div class="action-menu-item" onclick="window.handleProfileMenu('regenerate_posts')">帖子内容</div>
                <div class="action-menu-item" onclick="window.handleProfileMenu('regenerate_all')">全部</div>
                <div class="action-menu-cancel" onclick="document.getElementById('regenerate-options-menu').remove()">取消</div>
            </div>
        `;
        menu.addEventListener('click', (e) => {
            if (e.target === menu) menu.remove();
        });
        document.getElementById('forum-app').appendChild(menu);
    }

    window.handleProfileMenu = function(action) {
        // Close menus
        const menu1 = document.getElementById('profile-action-menu');
        const menu2 = document.getElementById('regenerate-options-menu');
        if (menu1) menu1.remove();
        if (menu2) menu2.remove();

        const user = forumState.viewingUser;
        if (!user) return;

        if (action === 'multiselect') {
            forumState.profileMultiSelectMode = true;
            forumState.profileSelectedPostIds = new Set();
            renderForum();
        } else if (action === 'regenerate') {
            showRegenerateOptions();
        } else if (action === 'regenerate_bio') {
            generateUserProfile(user, 'regenerate_bio');
        } else if (action === 'regenerate_posts') {
            if(confirm('确定要清空当前帖子并重新生成吗？')) {
                generateUserProfile(user, 'regenerate_posts');
            }
        } else if (action === 'regenerate_all') {
            if(confirm('确定要完全重新生成该用户主页吗？')) {
                generateUserProfile(user, 'regenerate_all'); // 'initial' covers both
            }
        } else if (action === 'add_posts') {
            generateUserProfile(user, 'add_posts');
        }
    };

    window.toggleProfilePostSelection = function(postId) {
        if (!forumState.profileMultiSelectMode) return;
        
        if (forumState.profileSelectedPostIds.has(postId)) {
            forumState.profileSelectedPostIds.delete(postId);
        } else {
            forumState.profileSelectedPostIds.add(postId);
        }
        renderForum(false); // Re-render without animation
    };

    window.toggleProfileSelectAll = function() {
        const user = forumState.viewingUser;
        if (!user) return;
        
        const userPosts = forumState.posts.filter(p => p.user.name === user.name);
        if (userPosts.length === 0) return;

        const isAllSelected = forumState.profileSelectedPostIds.size === userPosts.length;
        
        if (isAllSelected) {
            forumState.profileSelectedPostIds.clear();
        } else {
            userPosts.forEach(p => forumState.profileSelectedPostIds.add(p.id));
        }
        renderForum(false);
    };

    window.deleteProfileSelectedPosts = function() {
        if (forumState.profileSelectedPostIds.size === 0) return;
        
        if (confirm(`确定删除选中的 ${forumState.profileSelectedPostIds.size} 个帖子吗？`)) {
            forumState.posts = forumState.posts.filter(p => !forumState.profileSelectedPostIds.has(p.id));
            saveForumData();
            
            // Also update viewing user stats locally if needed (though next render recalculates)
            if (forumState.viewingUser && forumState.viewingUser.stats) {
                forumState.viewingUser.stats.posts = Math.max(0, forumState.viewingUser.stats.posts - forumState.profileSelectedPostIds.size);
            }
            
            forumState.profileMultiSelectMode = false;
            forumState.profileSelectedPostIds = new Set();
            renderForum();
        }
    };

    window.updateOtherProfileTab = function(tab) {
        forumState.otherProfileActiveTab = tab;
        
        const tabsBar = document.querySelector('.profile-tabs-bar');
        if (tabsBar) {
            tabsBar.classList.remove('tab-posts', 'tab-tagged', 'tab-tab3', 'tab-tab4');
            tabsBar.classList.add(`tab-${tab}`);
        }
        
        const slider = document.querySelector('.profile-content-slider');
        if (slider) {
            slider.classList.remove('tab-posts', 'tab-tagged', 'tab-tab3', 'tab-tab4');
            slider.classList.add(`tab-${tab}`);
        }
        
        // Update Icons
        const iconPosts = document.getElementById('other-icon-posts');
        const iconTagged = document.getElementById('other-icon-tagged');
        const iconTab3 = document.getElementById('other-icon-tab3');
        const iconTab4 = document.getElementById('other-icon-tab4');
        
        if (iconPosts) {
            iconPosts.src = tab === 'posts' ?
                'https://i.postimg.cc/ydkWQvw2/无标题102_20260214211949.png' :
                'https://i.postimg.cc/gJnrSNfM/无标题102_20260214211944.png';
        }
        
        if (iconTagged) {
            iconTagged.src = tab === 'tagged' ?
                'https://i.postimg.cc/4dmnLBrr/无标题102_20260214212200.png' :
                'https://i.postimg.cc/wv73f0Sr/无标题102_20260214212136.png';
        }

        if (iconTab3) {
            iconTab3.src = tab === 'tab3' ?
                'https://i.postimg.cc/c1pGMbXX/无标题102_20260217014150.png' :
                'https://i.postimg.cc/3r4HGTCF/无标题102_20260217014005.png';
        }

        if (iconTab4) {
            iconTab4.src = tab === 'tab4' ?
                'https://i.postimg.cc/Y25BfsbR/无标题102_20260217014057.png' :
                'https://i.postimg.cc/kM0PFpfc/无标题102_20260217014034.png';
        }
    };

    window.openUserProfile = function(user) {
        if (!user) return;
        // If it's me, go to my profile tab
        if (user.username === forumState.currentUser.username || user.name === forumState.currentUser.name) {
             forumState.activeTab = 'profile';
        } else {
             forumState.viewingUser = user;
             forumState.activeTab = 'other_profile';
             
             // Check if we need to generate profile data
             // We generate if:
             // 1. It's not already generated (flag)
             // 2. AND (it's a contact OR it's a stranger without detailed stats)
             if (!user.isProfileGenerated) {
                 generateUserProfile(user);
             }
        }
        renderForum();
    };

    window.triggerGenerateProfile = function(type) {
        const user = forumState.viewingUser;
        if (!user) return;
        
        generateUserProfile(user, type);
    };

    async function generateUserProfile(user, mode = 'initial') {
        // mode: 'initial' (default), 'regenerate_bio', 'regenerate_posts', 'add_posts'
        if (user.isGeneratingProfile) return;
        user.isGeneratingProfile = true;
        renderForum(); // Update UI to show loading state if implemented

        try {
            // 1. Identify if Contact
            const contacts = window.iphoneSimState.contacts || [];
            let contact = null;
            if (user.id) {
                contact = contacts.find(c => c.id === user.id);
            }
            if (!contact) {
                contact = contacts.find(c => c.name === user.name || c.remark === user.name);
            }

            // 2. Prepare Context (Worldbook & Worldview)
            const forumWorldview = forumState.settings.forumWorldview || '';
            const wbId = forumState.settings.linkedWorldbook;
            let worldbookContent = '';
            if (wbId && window.iphoneSimState.wbCategories) {
                const wb = window.iphoneSimState.wbCategories.find(c => c.id === wbId);
                if (wb && wb.entries) {
                    worldbookContent = wb.entries.slice(0, 20).map(e => `${e.key}: ${e.content}`).join('\n').substring(0, 3000);
                }
            }

            // 3. Construct Prompt
            let prompt = '';
            if (contact) {
                const profiles = forumState.settings.contactProfiles || {};
                const profile = profiles[contact.id] || {};
                const persona = contact.persona || '普通网友';
                const name = profile.name || contact.remark || contact.name;
                
                prompt = `
你是一个社交论坛模拟器。请为用户 "${name}" 生成个人主页详情。
该用户是我的联系人。
人设(Persona): ${persona}
世界观: ${forumWorldview}
世界书片段: ${worldbookContent}

请生成以下 JSON 数据 (不要Markdown):
{
  "bio": "根据人设生成的个性签名(Bio)，50字以内",
  "stats": {
      "posts": 随机数值(10-1000),
      "followers": 随机数值(根据人设热度),
      "following": 随机数值
  },
  "recent_posts": [
      {
          "type": "image" 或 "text",
          "caption": "符合人设和世界观的帖子内容",
          "image_ratio": "1:1" 或 "4:5",
          "image_description": "详细的画面描述，用于AI生图 (Stable Diffusion/NovelAI Tags格式，英文)",
          "image_description_zh": "画面的中文详细描述(用于展示给用户)",
          "time": "时间(如2天前)",
          "stats": { "likes": 随机数, "comments": 随机数, "forwards": 随机数, "shares": 随机数 },
          "comments_list": [
              { "user": "随机用户名", "text": "符合语境的评论内容" },
              { "user": "随机用户名", "text": "..." }
          ]
      },
      ... (生成 4-6 条)
  ]
}
`;
            } else {
                // Stranger
                prompt = `
你是一个社交论坛模拟器。请为陌生用户 "${user.name}" 生成个人主页详情。
世界观: ${forumWorldview}

请生成以下 JSON 数据 (不要Markdown):
{
  "bio": "一个有趣的个性签名",
  "stats": {
      "posts": 随机数值,
      "followers": 随机数值,
      "following": 随机数值
  },
  "recent_posts": [
      {
          "type": "image" 或 "text",
          "caption": "符合人设和世界观的帖子内容",
          "image_ratio": "1:1" 或 "4:5",
          "image_description": "详细的画面描述，用于AI生图 (Stable Diffusion/NovelAI Tags格式，英文)",
          "image_description_zh": "画面的中文详细描述(用于展示给用户)",
          "image_description_zh": "画面的中文详细描述(用于展示给用户)",
          "time": "时间(如2天前)",
          "stats": { "likes": 随机数, "comments": 随机数, "forwards": 随机数, "shares": 随机数 },
          "comments_list": [
              { "user": "随机用户名", "text": "符合语境的评论内容" },
              { "user": "随机用户名", "text": "..." }
          ]
      },
      ... (生成 4-6 条)
  ]
}
`;
            }

            // 4. Call AI
            let settings = { url: '', key: '', model: '' };
            if (window.iphoneSimState) {
                if (window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url) {
                    settings = window.iphoneSimState.aiSettings;
                } else if (window.iphoneSimState.aiSettings2 && window.iphoneSimState.aiSettings2.url) {
                    settings = window.iphoneSimState.aiSettings2;
                }
            }

            if (!settings.url || !settings.key) {
                console.warn('No AI settings for profile generation');
                user.isGeneratingProfile = false;
                return;
            }

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + settings.key
                },
                body: JSON.stringify({
                    model: settings.model || 'gpt-3.5-turbo',
                    messages: [
                         { role: 'system', content: 'You return ONLY JSON.' },
                         { role: 'user', content: prompt }
                    ],
                    temperature: 0.8
                })
            });

            const data = await response.json();
            let content = data.choices[0].message.content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
            const result = JSON.parse(content);

            // 5. Apply Data
            user.bio = result.bio;
            user.stats = result.stats;
            user.isProfileGenerated = true;

            // Save to Persistent Storage
            
            // 1. Update all instances of this user in current posts to ensure consistency
            // This is crucial so that when we return to the feed, the posts have updated user data
            forumState.posts.forEach(p => {
                let match = false;
                if (contact && p.user.name === contact.name) match = true; // Match by contact name (as ID might be missing on post)
                else if (user.id && p.user.id === user.id) match = true;
                else if (p.user.name === user.name) match = true;

                if (match) {
                    p.user.bio = user.bio;
                    p.user.stats = user.stats;
                    p.user.isProfileGenerated = true;
                    // Ensure ID is attached if available
                    if (contact && !p.user.id) p.user.id = contact.id;
                }
            });

            // 2. If contact, update contact profile settings for global persistence
            if (contact) {
                if (!forumState.settings.contactProfiles) forumState.settings.contactProfiles = {};
                if (!forumState.settings.contactProfiles[contact.id]) forumState.settings.contactProfiles[contact.id] = {};
                
                const profile = forumState.settings.contactProfiles[contact.id];
                profile.bio = user.bio;
                profile.followers = user.stats.followers;
                profile.following = user.stats.following;
                profile.isProfileGenerated = true;
                
                localStorage.setItem('forum_settings', JSON.stringify(forumState.settings));
            }

            // Process Posts
            if (mode !== 'regenerate_bio' && result.recent_posts && Array.isArray(result.recent_posts)) {
                // Use generatePlaceholderSvg which should be available in scope or copied here
                // Copying generatePlaceholderSvg logic for safety
                const generatePlaceholderSvg = (type, ratio = '1:1') => {
                    const colors = ['#F0F8FF', '#FAEBD7', '#F5F5DC', '#FFE4C4', '#FFEBCD', '#E6E6FA', '#FFF0F5', '#E0FFFF', '#FAFAD2', '#D3D3D3', '#90EE90', '#FFB6C1'];
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    
                    const icons = {
                        food: '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="#fff" opacity="0.8"/>',
                        travel: '<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#fff" opacity="0.8"/>',
                        mood: '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="#fff" opacity="0.8"/>',
                        hobby: '<path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#fff" opacity="0.8"/>',
                        daily: '<path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" fill="#fff" opacity="0.8"/>',
                        pet: '<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#fff" opacity="0.8"/>',
                        scenery: '<path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.55 8.26 9 6 9c-3.87 0-7 3.13-7 7s3.13 7 7 7h13c2.76 0 5-2.24 5-5s-2.24-5-5-5c-.55 0-1.07.09-1.57.24C16.8 9.53 15.65 6 14 6z" fill="#fff" opacity="0.8"/>'
                    };

                    const iconPath = icons[type] || icons.daily;
                    
                    let width = 600;
                    let height = 600;
                    let viewBox = "0 0 24 24";
                    
                    if (ratio === '4:5') {
                        height = 750;
                        viewBox = "0 0 24 30"; 
                    } else if (ratio === '16:9') {
                        height = 338;
                        viewBox = "0 0 24 13.5"; 
                    }
                    
                    let iconTransform = "translate(8, 8) scale(0.33)";
                    if (ratio === '4:5') {
                        iconTransform = "translate(8, 11) scale(0.33)";
                    } else if (ratio === '16:9') {
                        iconTransform = "translate(8, 2.75) scale(0.33)";
                    }

                    const svg = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">
                        <defs>
                            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" flood-color="#000" flood-opacity="0.15"/>
                            </filter>
                        </defs>
                        <rect width="100%" height="100%" fill="${color}"/>
                        <g transform="${iconTransform}" filter="url(#shadow)">
                            ${iconPath}
                        </g>
                    </svg>
                    `;
                    
                    return 'data:image/svg+xml;base64,' + btoa(svg);
                };

                const newPosts = result.recent_posts.map((p, idx) => ({
                    id: Date.now() + idx,
                    user: user, // Link to this user
                    image: p.type === 'text' ? null : (p.image || generatePlaceholderSvg(p.type || 'daily', p.image_ratio)),
                    image_description: p.image_description,
                    image_description_zh: p.image_description_zh,
                    image_ratio: p.image_ratio || '1:1',
                    stats: {
                        likes: Math.floor(Math.random() * (user.stats.followers / 10)),
                        comments: (p.comments_list ? p.comments_list.length : 0),
                        forwards: 0,
                        shares: 0,
                        ...p.stats
                    },
                    caption: p.caption,
                    time: p.time || '近期',
                    translation: '查看翻译',
                    liked: false,
                    comments_list: (p.comments_list || []).map((c, cIdx) => ({
                        id: Date.now() + idx + cIdx + 1000,
                        user: {
                            name: c.user || 'User'+cIdx,
                            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + (c.user || cIdx),
                            verified: false
                        },
                        text: c.text,
                        time: '近期',
                        likes: Math.floor(Math.random() * 50),
                        replies: []
                    }))
                }));

                // Add to global posts so they appear in grid
                // Filter out existing posts by this user if we are regenerating
                if (mode === 'regenerate_posts' || mode === 'regenerate_all') {
                    forumState.posts = forumState.posts.filter(p => {
                        if (contact && p.user.name === contact.name) return false;
                        if (user.id && p.user.id === user.id) return false;
                        if (p.user.name === user.name) return false;
                        return true;
                    });
                }

                forumState.posts = [...forumState.posts, ...newPosts];
                saveForumData();
            }

        } catch (e) {
            console.error('Profile Generation Failed', e);
        } finally {
            user.isGeneratingProfile = false;
            renderForum();
        }
    }

    // Helper: Show preset picker bottom sheet, resolves with chosen presetName or null
    function showPresetPickerSheet(currentPresetName) {
        return new Promise((resolve) => {
            const presets = window.iphoneSimState.novelaiPresets || [];

            // Remove any existing sheet
            const old = document.getElementById('forum-preset-picker');
            if (old) old.remove();

            const sheet = document.createElement('div');
            sheet.id = 'forum-preset-picker';
            sheet.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:3000;display:flex;flex-direction:column;justify-content:flex-end;';

            const presetsHtml = presets.map(p => `
                <div class="action-menu-item forum-preset-option" data-preset="${encodeURIComponent(p.name)}" style="${currentPresetName===p.name ? 'color:#0095f6;font-weight:700;' : ''}">
                    ${p.name}
                </div>
            `).join('');

            sheet.innerHTML = `
                <div class="action-menu-container">
                    <div style="padding:12px 20px 8px;text-align:center;font-weight:700;font-size:15px;border-bottom:1px solid #efefef;margin-bottom:4px;">选择生图预设</div>
                    <div style="max-height:60vh;overflow-y:auto;">
                        <div class="action-menu-item forum-preset-option" data-preset="AUTO_MATCH" style="${currentPresetName==='AUTO_MATCH'?'color:#0095f6;font-weight:700;':''}">
                            ✨ 自动匹配 (AI检测)
                        </div>
                        ${presetsHtml}
                        <div class="action-menu-item forum-preset-option" data-preset="" style="color:#8e8e8e;">
                            不使用预设 (仅用图片描述)
                        </div>
                    </div>
                    <div class="action-menu-cancel" id="forum-preset-cancel">取消</div>
                </div>
            `;

            document.getElementById('forum-app').appendChild(sheet);

            sheet.querySelectorAll('.forum-preset-option').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const chosen = el.dataset.preset ? decodeURIComponent(el.dataset.preset) : '';
                    sheet.remove();
                    resolve(chosen || null);
                });
            });

            document.getElementById('forum-preset-cancel').addEventListener('click', () => {
                sheet.remove();
                resolve(undefined); // undefined = cancelled
            });

            sheet.addEventListener('click', (e) => {
                if (e.target === sheet) {
                    sheet.remove();
                    resolve(undefined);
                }
            });
        });
    }

    window.regeneratePostImage = async function(event, postId) {
        event.stopPropagation();
        const post = forumState.posts.find(p => p.id === postId);
        if (!post) return;

        // ── Step 1: Resolve contact & existing preset ──────────────────────
        const contacts = window.iphoneSimState.contacts || [];
        let contact = null;
        let userId = post.userId;

        if (userId) contact = contacts.find(c => c.id == userId);
        if (!contact && post.user && post.user.id) {
            contact = contacts.find(c => c.id == post.user.id);
            if (contact) userId = contact.id;
        }
        if (!contact && post.user && post.user.name) {
            contact = contacts.find(c => c.name === post.user.name || c.remark === post.user.name);
            if (contact) userId = contact.id;
        }

        const contactProfile = contact
            ? ((forumState.settings.contactProfiles && forumState.settings.contactProfiles[userId]) || {})
            : null;

        // ── Step 2: Show preset picker (always show for strangers, show for contacts too) ──
        const existingPreset = contactProfile ? (contactProfile.imagePresetName || null) : null;
        const chosenPreset = await showPresetPickerSheet(existingPreset);

        // undefined means the user tapped "取消" — abort
        if (chosenPreset === undefined) return;

        // ── Step 3: Start spinning the button ──────────────────────────────
        const btn = event.currentTarget;
        const icon = btn ? btn.querySelector('i') : null;
        if (icon) icon.classList.add('fa-spin');

        try {
            // ── Step 4: Get API key & base model settings ──────────────────
            let apiKey = '';
            let imageModel = 'nai-diffusion-3';
            let negativePrompt = 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry';

            if (window.iphoneSimState) {
                if (window.iphoneSimState.novelaiSettings && window.iphoneSimState.novelaiSettings.key) {
                    apiKey = window.iphoneSimState.novelaiSettings.key;
                    if (window.iphoneSimState.novelaiSettings.model) imageModel = window.iphoneSimState.novelaiSettings.model;
                    if (window.iphoneSimState.novelaiSettings.negativePrompt) negativePrompt = window.iphoneSimState.novelaiSettings.negativePrompt;
                }
                if (!apiKey && window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.novelai_key)
                    apiKey = window.iphoneSimState.aiSettings.novelai_key;
                if (!apiKey && window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.key)
                    apiKey = window.iphoneSimState.aiSettings.key;
                if (!apiKey && window.iphoneSimState.aiSettings2)
                    apiKey = window.iphoneSimState.aiSettings2.key;
            }

            if (!apiKey) {
                alert('未找到有效的 AI Key。请在"设置"或"NovelAI设置"中配置 Key。');
                return;
            }

            // ── Step 5: Resolve chosen preset settings ─────────────────────
            let basePrompt = '';
            if (chosenPreset) { // null = no preset, 'AUTO_MATCH' or preset name
                const presets = window.iphoneSimState.novelaiPresets || [];
                let preset = null;

                if (chosenPreset === 'AUTO_MATCH') {
                    const typeText = (post.image_description || post.caption || '') + ' ' + (post.title || '');
                    const type = detectImageType(typeText);
                    preset = presets.find(p => p.type === type);
                    if (!preset) preset = presets.find(p => p.name && p.name.toLowerCase().includes(type));
                    if (!preset) preset = presets.find(p => p.type === 'general' || p.name === '通用' || p.name === 'General');
                } else {
                    preset = presets.find(p => p.name === chosenPreset);
                }

                if (preset && preset.settings) {
                    if (preset.settings.prompt) basePrompt = preset.settings.prompt;
                    if (preset.settings.negativePrompt) negativePrompt = preset.settings.negativePrompt;
                    if (preset.settings.model) imageModel = preset.settings.model;
                }
            }

            // ── Step 6: Extract appearance from contact persona (if any) ───
            let appearancePrompt = '';
            if (contact && contact.persona) {
                const match = contact.persona.match(/(?:外貌|外观|形象|样子)[:：]\s*([^\n]+)/);
                if (match && match[1]) appearancePrompt = match[1].trim();
            }

            // ── Step 7: Build & translate prompt ──────────────���───────────
            const promptParts = [];
            if (basePrompt) promptParts.push(basePrompt);
            if (appearancePrompt) promptParts.push(appearancePrompt);
            if (post.image_description || post.caption) promptParts.push(post.image_description || post.caption);

            const rawPrompt = promptParts.join(', ');
            let prompt = rawPrompt.replace(/[，。、；！\n]/g, ', ').replace(/\s+/g, ' ').trim();

            try {
                const aiSettings = window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url
                    ? window.iphoneSimState.aiSettings
                    : (window.iphoneSimState.aiSettings2 || {});
                if (aiSettings && aiSettings.url) {
                    const translated = await translateToNovelAIPrompt(rawPrompt, aiSettings);
                    if (translated && translated.length > 0) prompt = translated;
                }
            } catch (e) {
                console.warn('Regenerate translation failed:', e);
            }

            if (!prompt) prompt = post.image_description || post.caption || '';

            // ── Step 8: Generate image ─────────────────────────────────────
            if (window.generateNovelAiImageApi) {
                const resultBase64 = await window.generateNovelAiImageApi({
                    key: apiKey,
                    prompt: prompt,
                    negativePrompt: negativePrompt,
                    width: post.image_ratio === '4:5' ? 832 : 1024,
                    height: post.image_ratio === '4:5' ? 1216 : 1024,
                    model: imageModel,
                    steps: 28,
                    scale: 5
                });

                post.image = await compressImage(resultBase64, 0.7, 800);
                localStorage.removeItem('forum_img_' + post.id); // Clear old image to force update
                saveForumData();
                renderForum(false);
            } else {
                alert('生图功能未加载 (window.generateNovelAiImageApi not found)');
            }

        } catch (e) {
            console.error(e);
            alert('生图失败: ' + e.message);
        } finally {
            if (icon) icon.classList.remove('fa-spin');
        }
    };

    // --- My Profile Posts View Logic ---

    window.viewMyProfilePosts = function(postId) {
        forumState.myProfileScrollToPostId = postId;
        forumState.activeTab = 'my_profile_posts';
        renderForum();
    };

    window.backToMyProfile = function() {
         forumState.activeTab = 'profile';
         renderForum();
    };

    function renderMyProfilePostsHeader() {
        const user = forumState.currentUser;
        return `
            <div class="forum-header">
                <div class="header-left">
                    <i class="fas fa-chevron-left" onclick="window.backToMyProfile()" style="font-size: 24px; cursor: pointer;"></i>
                </div>
                <div class="header-center" style="display: flex; flex-direction: column; align-items: center;">
                    <div style="font-size: 16px; color: #000; font-weight: 700; line-height: 1.2;">帖子</div>
                    <div style="font-size: 12px; color: #666; font-weight: 400; line-height: 1.2;">${user.username}</div>
                </div>
                <div class="header-right">
                    <!-- Placeholder -->
                </div>
            </div>
        `;
    }

    function renderMyProfilePosts() {
        const user = forumState.currentUser;
        
        // Filter posts for me
        const userPosts = forumState.posts.filter(p => p.user.username === user.username);
        
        if (userPosts.length === 0) {
            return '<div style="padding: 40px; text-align: center; color: #8e8e8e;">暂无帖子</div>';
        }

        return `
            <div class="feed-container" style="padding-bottom: 20px;">
                ${userPosts.map(post => {
                    const postHtml = renderPost(post);
                    return postHtml.replace('class="post-item', `id="my-profile-post-${post.id}" class="post-item`);
                }).join('')}
            </div>
        `;
    }

    // --- Components ---

    function renderStory(story) {
        const borderClass = story.hasStory ? 'story-border' : '';
        const name = story.name;
        const addIcon = story.isMe ? '<div class="story-add-icon"><i class="fas fa-plus"></i></div>' : '';
        const avatar = story.isMe ? forumState.currentUser.avatar : story.avatar;

        return `
            <div class="story-item">
                <div class="story-avatar-wrapper ${borderClass}">
                    <img src="${avatar}" class="story-avatar">
                    ${addIcon}
                </div>
                <span class="story-name">${name}</span>
            </div>
        `;
    }

    function renderDMNote(note) {
        // Special rendering for DM Notes
        const avatar = note.isMe ? forumState.currentUser.avatar : note.avatar;
        const noteText = note.note || '分享便签';
        
        let subHtml = '';
        if (note.isMe && note.subtext) {
             subHtml = `<div style="font-size: 9px; color: #8e8e8e; margin-top: 2px; display: flex; align-items: center;"><i class="fas fa-plane" style="transform: rotate(-45deg); margin-right: 3px; font-size: 8px; color: #ff3b30;"></i>${note.subtext}</div>`;
        } else {
             subHtml = `<span class="dm-note-name">${note.name}</span>`;
        }

        let bubbleHtml = `<div class="dm-note-bubble">${noteText}</div>`;
        if (note.isMap) {
            bubbleHtml = `<div class="dm-note-new-badge">全新</div>`;
        }

        return `
            <div class="dm-note-item">
                <div style="position: relative;">
                    <img src="${avatar}" class="dm-note-avatar">
                    ${bubbleHtml}
                </div>
                ${subHtml}
            </div>
        `;
    }

    function renderDMMessage(msg) {
        const isMultiSelect = forumState.dmMultiSelectMode;
        const isSelected = forumState.selectedDmIds.has(msg.id);
        
        let leftContent = '';
        if (isMultiSelect) {
            leftContent = `<div class="comment-select-checkbox ${isSelected ? 'checked' : ''}" style="margin-right: 10px;"></div>`;
        }

        // Add data-id attribute for JS hooks
        return `
            <div class="dm-user-row ${isMultiSelect ? 'multi-select-mode' : ''}" data-dm-id="${msg.id}">
                ${leftContent}
                <img src="${msg.avatar}" class="dm-user-avatar">
                <div class="dm-user-info">
                    <div class="dm-user-name">
                        ${msg.name} 
                        ${msg.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                    </div>
                    <div class="dm-user-sub">${msg.subtext}</div>
                </div>
                <div class="dm-camera-icon">
                    <i class="fas fa-camera"></i>
                </div>
            </div>
        `;
    }

    window.openForumChat = function(id) {
        if (forumState.dmMultiSelectMode) return; // Prevent opening chat in multi-select mode
        
        const user = forumState.messages.find(m => m.id === id);
        if (user) {
            forumState.activeChatUser = user;
            forumState.activeTab = 'chat';
            renderForum();
        }
    };

    function renderChatHeader() {
        const user = forumState.activeChatUser;
        if (!user) return '';
        
        return `
            <div class="forum-header chat-header-custom">
                <div class="header-left">
                    <img src="https://i.postimg.cc/XYDyGHXB/无标题98_20260215152604.png" id="chat-back-btn" style="width: 26px; height: 26px; cursor: pointer; margin-top: 2px;">
                    <div class="chat-header-user">
                        <img src="${user.avatar}" class="chat-header-avatar">
                        <div class="chat-header-info">
                            <div class="chat-header-name">
                                ${user.name} 
                                ${user.verified ? '<i class="fas fa-check-circle verified-badge-small"></i>' : ''}
                            </div>
                            <div class="chat-header-username">${user.username || 'username'}</div>
                        </div>
                    </div>
                </div>
                <div class="header-right">
                    <img src="https://i.postimg.cc/8znrJKsr/无标题98_20260215152721.png" style="width: 28px; height: 28px; margin-right: 16px; cursor: pointer;">
                    <img src="https://i.postimg.cc/8znrJKs6/无标题98_20260215152805.png" style="width: 28px; height: 28px; cursor: pointer;">
                </div>
            </div>
        `;
    }

    function renderChatPage() {
        const user = forumState.activeChatUser;
        
        // Initialize chat history if not exists
        if (!forumState.chatHistory) forumState.chatHistory = {};
        if (!forumState.chatHistory[user.id]) {
             forumState.chatHistory[user.id] = [
                { type: 'time', text: '1月1日 02:55' },
                { type: 'other', text: '好久不见！你还好吗？', avatar: user.avatar },
                { type: 'other', text: '我现在在上海，朋友把包忘在公交车上了，希望你能帮帮我😭😭😭', avatar: user.avatar },
                { type: 'time', text: '00:38' },
                { type: 'me', text: '啊啊我才看到你的消息🤯' },
                { type: 'me', text: 'もう見つかりましたか？' } // Did you find it?
             ];
        }

        const messages = forumState.chatHistory[user.id];

        const messagesHtml = messages.map(msg => {
            if (msg.type === 'time') {
                return `<div class="chat-time-label">${msg.text}</div>`;
            } else if (msg.type === 'other') {
                return `
                    <div class="forum-chat-msg other">
                        <img src="${msg.avatar}" class="chat-msg-avatar">
                        <div class="chat-bubble other">${msg.text}</div>
                    </div>
                `;
            } else if (msg.type === 'me') {
                return `
                    <div class="forum-chat-msg me">
                        <div class="chat-bubble me">${msg.text}</div>
                    </div>
                `;
            }
        }).join('');

        // Wait for DOM update to attach listener
        setTimeout(() => {
            const backBtn = document.getElementById('chat-back-btn');
            if (backBtn) {
                backBtn.onclick = () => {
                    forumState.activeTab = 'share'; // Go back to DM list
                    renderForum();
                };
            }

            const contentArea = document.getElementById('forum-content-area');
            if (contentArea) {
                contentArea.scrollTop = contentArea.scrollHeight;
            }

            const chatBody = document.querySelector('.forum-chat-body');
            const input = document.getElementById('forum-chat-input-field');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const text = input.value.trim();
                        if (text) {
                            sendChatMessage(text, user, chatBody);
                        }
                    }
                });
            }

            // AI Reply Button (bottom-right icon)
            const aiReplyBtn = document.getElementById('forum-chat-ai-reply-btn');
            if (aiReplyBtn) {
                aiReplyBtn.onclick = () => {
                    if (aiReplyBtn._isGenerating) return;
                    generateDMChatReply(user, chatBody);
                };
            }
        }, 0);

        return `
            <div class="forum-chat-container">
                <div class="forum-chat-body">
                    ${messagesHtml}
                </div>
                <div class="forum-chat-footer">
                    <div class="chat-bar-pill">
                        <div class="chat-footer-camera">
                            <img src="https://i.postimg.cc/W41znMFf/wu-biao-ti98-20260215154732.png">
                        </div>
                        <div class="chat-input-wrapper">
                            <input type="text" placeholder="发消息..." class="forum-chat-input" id="forum-chat-input-field">
                        </div>
                        <div class="chat-footer-actions">
                            <img src="https://i.postimg.cc/xT2Zhgfk/无标题98_20260215154555.png">
                            <img src="https://i.postimg.cc/ZKSQ2jby/无标题98_20260215154535.png">
                            <img src="https://i.postimg.cc/jdb1mvxw/无标题98_20260215154633.png">
                            <img id="forum-chat-ai-reply-btn" src="https://i.postimg.cc/02s4FZkK/无标题98_20260215154658.png" style="cursor:pointer;" title="让对方AI回复">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    window.refreshPostImage = async function(postId) {
        const post = forumState.posts.find(p => p.id === postId);
        if (!post) return;

        const btnContainer = document.querySelector(`.post-item[data-post-id="${postId}"] .post-refresh-btn`);
        const btnIcon = btnContainer ? btnContainer.querySelector('i') : null;
        
        if (btnIcon) {
            btnIcon.className = 'fas fa-spinner fa-spin';
            btnContainer.style.pointerEvents = 'none'; // Prevent double click
        }

        try {
            const userId = post.userId;
            const contact = window.iphoneSimState.contacts.find(c => c.id == userId);
            if (!contact) {
                alert('未找到关联联系人信息');
                return;
            }

            const novelaiSettings = window.iphoneSimState.novelaiSettings;
            if (!novelaiSettings || !novelaiSettings.key) {
                alert('请先配置 NovelAI 设置');
                return;
            }

            const profile = (forumState.settings.contactProfiles && forumState.settings.contactProfiles[userId]) || {};
            
            // --- Logic Copied from generateForumPosts ---
            let basePrompt = '';
            let negativePrompt = novelaiSettings.negativePrompt || 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry';
            let model = novelaiSettings.model || 'nai-diffusion-3';

            // Check for preset
            if (profile.imagePresetName) {
                const presets = window.iphoneSimState.novelaiPresets || [];
                let preset = null;

                if (profile.imagePresetName === 'AUTO_MATCH') {
                    const typeText = (post.image_description || post.caption || '') + ' ' + (post.title || '');
                    const type = detectImageType(typeText);
                    preset = presets.find(p => p.type === type);
                    if (!preset) preset = presets.find(p => p.name && p.name.toLowerCase().includes(type));
                    if (!preset) preset = presets.find(p => p.type === 'general' || p.name === '通用' || p.name === 'General');
                } else {
                    preset = presets.find(p => p.name === profile.imagePresetName);
                }

                if (preset && preset.settings) {
                    if (preset.settings.prompt) basePrompt = preset.settings.prompt;
                    if (preset.settings.negativePrompt) negativePrompt = preset.settings.negativePrompt;
                    if (preset.settings.model) model = preset.settings.model;
                }
            } else if (profile.imagePrompt) {
                basePrompt = profile.imagePrompt;
            }

            // Extract appearance from persona
            let appearancePrompt = '';
            const personaContact = window.iphoneSimState.contacts.find(c => c.id == post.userId);
            if (personaContact && personaContact.persona) {
                const match = personaContact.persona.match(/(?:外貌|外观|形象|样子)[:：]\s*([^\n]+)/);
                if (match && match[1]) appearancePrompt = match[1].trim();
            }

            let promptParts = [];
            if (basePrompt) promptParts.push(basePrompt);
            if (appearancePrompt) promptParts.push(appearancePrompt);
            if (post.image_description || post.caption) promptParts.push(post.image_description || post.caption);
            
            // Sanitize & Translate
            const rawPrompt = promptParts.join(', ');
            let prompt = rawPrompt.replace(/[，。、；！\n]/g, ', ').replace(/\s+/g, ' ').trim();
            
            try {
                const aiSettings = window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : (window.iphoneSimState.aiSettings2 || {});
                if (aiSettings && aiSettings.url) {
                    const translated = await translateToNovelAIPrompt(rawPrompt, aiSettings);
                    if (translated && translated.length > 0) prompt = translated;
                }
            } catch (e) {
                console.warn('Refresh translation failed:', e);
            }

            if (!prompt || prompt.length === 0) throw new Error('Prompt is empty');

            let width = 832;
            let height = 1216;
            if (post.image_ratio === '16:9') { width = 1024; height = 576; }
            else if (post.image_ratio === '1:1') { width = 1024; height = 1024; }
            else if (post.image_ratio === '4:5') { width = 832; height = 1024; }

            console.log('[Forum] Refreshing Image for post:', post.id, 'Prompt:', prompt);

            const base64Image = await window.generateNovelAiImageApi({
                key: novelaiSettings.key,
                model: model,
                prompt: prompt,
                negativePrompt: negativePrompt,
                steps: 28,
                scale: 5,
                width: width,
                height: height,
                seed: -1
            });

            // Update Post
            post.image = base64Image;
            
            // Update UI directly to avoid full re-render scroll jump
            const imgEl = document.querySelector(`.post-item[data-post-id="${postId}"] .post-image`);
            if (imgEl) imgEl.src = base64Image;

            // Persist
            localStorage.removeItem('forum_img_' + post.id);
            saveForumData();
            
        } catch (e) {
            console.error('Refresh Image Error:', e);
            alert('刷新失败: ' + e.message);
        } finally {
            if (btnIcon) {
                btnIcon.className = 'fas fa-sync-alt';
                btnContainer.style.pointerEvents = 'auto';
            }
        }
    };

    function renderPost(post) {
        // Determine images array: support both single image and multi-image posts
        const images = ((Array.isArray(post.images) && post.images.length > 0)
            ? post.images
            : (post.image ? [post.image] : []))
            .filter((src) => {
                if (typeof src === 'string') return src.trim().length > 0;
                return Boolean(src);
            });
        const isTextPost = images.length === 0;
        const isMultiImage = images.length > 1;
        const imageAspectRatio = post.image_ratio === '16:9'
            ? '16 / 9'
            : (post.image_ratio === '4:5' ? '4 / 5' : '1 / 1');

        const actionsBarHtml = `
            <div class="post-actions-bar">
                <div class="actions-left-group">
                    <div class="action-item like-btn" data-id="${post.id}">
                        <i class="${post.liked ? 'fas fa-heart' : 'far fa-heart'}" style="${post.liked ? 'color: #ed4956;' : ''}"></i>
                        <span class="action-count">${formatCount(post.stats.likes)}</span>
                    </div>
                    <div class="action-item comment-btn" data-id="${post.id}">
                        <img src="https://i.postimg.cc/GmHtkm1B/无标题98_20260213233618.png" class="post-action-icon">
                        <span class="action-count">${formatCount(post.stats.comments)}</span>
                    </div>
                    <div class="action-item">
                        <img src="https://i.postimg.cc/fyG4XnSn/wu-biao-ti98-20260215020652.png" class="post-action-icon">
                        <span class="action-count">${formatCount(post.stats.forwards || 0)}</span>
                    </div>
                    <div class="action-item">
                        <img src="https://i.postimg.cc/hGjkXkL3/无标题98_20260213231726.png" class="post-action-icon">
                        <span class="action-count">${formatCount(post.stats.shares)}</span>
                    </div>
                </div>
                <div class="actions-right-group">
                    <img src="https://i.postimg.cc/cLrCQLNn/无标题98_20260213233659.png" class="post-action-icon">
                </div>
            </div>
        `;

        let contentHtml = '';

        if (isTextPost) {
            contentHtml = `
                <div class="post-info-section">
                    <div class="post-caption-row" style="margin-top: 5px;">
                        <span class="post-caption-content" style="font-size: 15px;">${post.caption}</span>
                    </div>
                </div>
                ${actionsBarHtml}
                <div class="post-info-section">
                    <div class="post-meta-row" style="margin-bottom: 10px;">
                        <span class="post-time">${post.time}</span>
                        <span class="meta-dot">·</span>
                        <span class="post-translation">${post.translation || '查看翻译'}</span>
                    </div>
                </div>
            `;
        } else if (isMultiImage) {
            // Multi-image carousel
            const dotsHtml = images.map((_, i) => `<span class="post-carousel-dot ${i === 0 ? 'active' : ''}"></span>`).join('');
            const slidesHtml = images.map((img, i) => `
                <div class="post-carousel-slide">
                    <img src="${img}" class="post-image" onerror="this.closest('.post-carousel-container')?.classList.add('is-image-fallback'); this.style.display='none';">
                </div>
            `).join('');

            const showRefreshBtn = !!post.userId || !!post.image_description;
            contentHtml = `
                <div class="post-carousel-container" data-post-id="${post.id}" data-total="${images.length}" data-current="0" style="aspect-ratio: ${imageAspectRatio};">
                    <div class="post-carousel-track">
                        ${slidesHtml}
                    </div>
                    <div class="post-carousel-counter">${images.length > 1 ? `1/${images.length}` : ''}</div>
                    <div class="post-carousel-dots">${dotsHtml}</div>
                    ${showRefreshBtn ? `
                    <div class="post-refresh-btn" onclick="window.regeneratePostImage(event, ${post.id})" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 10; backdrop-filter: blur(4px);">
                        <i class="fas fa-sync-alt" style="font-size: 14px;"></i>
                    </div>` : ''}
                </div>
                ${actionsBarHtml}
                <div class="post-info-section">
                    ${post.caption ? `<div class="post-caption-row">
                        <span class="post-caption-username">${post.user.name}</span>
                        <span class="post-caption-content">${post.caption}</span>
                    </div>` : ''}
                    <div class="post-meta-row">
                        <span class="post-time">${post.time}</span>
                        <span class="meta-dot">·</span>
                        <span class="post-translation">${post.translation || '查看翻译'}</span>
                    </div>
                </div>
            `;
        } else {
            // Single image
            const showRefreshBtn = !!post.userId || !!post.image_description;
            contentHtml = `
                <div class="post-image-container" style="position: relative; aspect-ratio: ${imageAspectRatio};">
                    <img src="${images[0]}" class="post-image" onerror="this.closest('.post-image-container')?.classList.add('is-image-fallback'); this.style.display='none';">
                    ${post.stats.count ? `<div class="image-overlay-count">${post.stats.count}</div>` : ''}
                    <div class="post-description-overlay">
                        <div class="post-description-text">${post.image_description_zh || post.image_description || ''}</div>
                    </div>
                    ${showRefreshBtn ? `
                    <div class="post-refresh-btn" onclick="window.regeneratePostImage(event, ${post.id})" style="position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center; cursor: pointer; z-index: 10; backdrop-filter: blur(4px);">
                        <i class="fas fa-sync-alt" style="font-size: 14px;"></i>
                    </div>` : ''}
                </div>
                ${actionsBarHtml}
                <div class="post-info-section">
                    ${post.caption ? `<div class="post-caption-row">
                        <span class="post-caption-username">${post.user.name}</span>
                        <span class="post-caption-content">${post.caption}</span>
                    </div>` : ''}
                    <div class="post-meta-row">
                        <span class="post-time">${post.time}</span>
                        <span class="meta-dot">·</span>
                        <span class="post-translation">${post.translation || '查看翻译'}</span>
                    </div>
                </div>
            `;
        }

        const isMultiSelect = forumState.multiSelectMode;
        const isSelected = forumState.selectedPostIds.has(post.id);

        return `
            <div class="post-item ${isMultiSelect ? 'multi-select-mode' : ''} ${isSelected ? 'post-selected' : ''}" data-post-id="${post.id}">
                ${isMultiSelect ? `<div class="post-select-checkbox ${isSelected ? 'selected' : ''}" data-post-id="${post.id}"></div>` : ''}
                <div class="post-header">
                    <div class="post-user-info-wrapper user-profile-trigger" data-user-json="${encodeURIComponent(JSON.stringify(post.user))}" style="cursor: pointer;">
                        <img src="${post.user.avatar}" class="post-user-avatar">
                        <div class="post-user-text">
                            <div class="post-username-row">
                                <span class="post-username">${post.user.name}</span>
                                ${post.user.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                            </div>
                            ${post.user.subtitle ? `<div class="post-subtitle">${post.user.subtitle}</div>` : ''}
                        </div>
                    </div>
                    <div class="post-header-actions">
                        <button class="follow-btn">关注</button>
                        <i class="fas fa-ellipsis-h post-more-btn" style="font-size: 14px; color: #000; cursor: pointer; padding: 5px;" data-post-id="${post.id}"></i>
                    </div>
                </div>
                ${contentHtml}
            </div>
        `;
    }

    function renderBottomNav() {
        const activeTab = forumState.activeTab;
        
        const iconsUnclicked = [
            'https://i.postimg.cc/g0JCxCVs/无标题98_20260213231529.png',
            'https://i.postimg.cc/k54020Qj/无标题98_20260213231635.png',
            'https://i.postimg.cc/hGjkXkL3/无标题98_20260213231726.png',
            'https://i.postimg.cc/W43BdBGW/无标题98_20260213231753.png',
            'https://i.postimg.cc/TPwzKzVs/无标题98_20260213231825.png'
        ];

        const iconsClicked = [
            'https://i.postimg.cc/RFCNJVsV/无标题98_20260213232115.png',
            'https://i.postimg.cc/85ysRQ9Q/无标题98_20260213232143.png',
            'https://i.postimg.cc/NMNL6qSv/无标题98_20260213232200.png',
            'https://i.postimg.cc/26H3QRMf/无标题98_20260213232226.png',
            'https://i.postimg.cc/MTsX72Nx/无标题98_20260213232300.png'
        ];

        const getIcon = (tab, index) => {
            return activeTab === tab ? iconsClicked[index] : iconsUnclicked[index];
        };

        return `
            <div class="forum-nav-bar">
                <div class="nav-item ${activeTab === 'home' ? 'active' : ''}" data-tab="home">
                    <img src="${getIcon('home', 0)}" class="nav-icon">
                </div>
                <div class="nav-item ${activeTab === 'video' ? 'active' : ''}" data-tab="video">
                    <img src="${getIcon('video', 1)}" class="nav-icon">
                </div>
                <div class="nav-item ${activeTab === 'share' ? 'active' : ''}" data-tab="share">
                    <img src="${getIcon('share', 2)}" class="nav-icon">
                </div>
                 <div class="nav-item ${activeTab === 'explore' ? 'active' : ''}" data-tab="explore">
                    <img src="${getIcon('explore', 3)}" class="nav-icon">
                </div>
                <div class="nav-item ${activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
                    <img src="${getIcon('profile', 4)}" class="nav-icon">
                </div>
            </div>
        `;
    }

    window.updateProfileTab = function(tab) {
        console.log('Switching profile tab to:', tab);
        
        forumState.profileActiveTab = tab;
        
        const tabsBar = document.querySelector('.profile-tabs-bar');
        if (tabsBar) {
            tabsBar.classList.remove('tab-posts', 'tab-tagged');
            tabsBar.classList.add(`tab-${tab}`);
        }
        
        const slider = document.querySelector('.profile-content-slider');
        if (slider) {
            slider.classList.remove('tab-posts', 'tab-tagged');
            slider.classList.add(`tab-${tab}`);
        }
        
        // Update Icons
        const iconPosts = document.getElementById('icon-posts');
        const iconTagged = document.getElementById('icon-tagged');
        
        if (iconPosts) {
            iconPosts.src = tab === 'posts' ?
                'https://i.postimg.cc/ydkWQvw2/无标题102_20260214211949.png' :
                'https://i.postimg.cc/gJnrSNfM/无标题102_20260214211944.png';
        }
        
        if (iconTagged) {
            iconTagged.src = tab === 'tagged' ?
                'https://i.postimg.cc/4dmnLBrr/无标题102_20260214212200.png' :
                'https://i.postimg.cc/wv73f0Sr/无标题102_20260214212136.png';
        }
    };

    function setupTabListeners() {
        document.querySelectorAll('.forum-nav-bar .nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = item.dataset.tab;
                if (tab) {
                    // Clear DM badge when switching to DM tab
                    if (tab === 'share') {
                        const badge = item.querySelector('.dm-badge');
                        if (badge) badge.remove();
                    }
                    forumState.activeTab = tab;
                    renderForum();
                }
            });
        });

        const backBtn = document.getElementById('forum-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                document.getElementById('forum-app').classList.add('hidden');
            });
        }

        const editProfileBtn = document.getElementById('my-profile-edit-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                forumState.activeTab = 'edit_profile';
                renderForum();
            });
        }

        const forumWalletEntryBtn = document.getElementById('forum-wallet-entry-btn');
        if (forumWalletEntryBtn) {
            forumWalletEntryBtn.addEventListener('click', () => {
                forumState.activeTab = 'forum_wallet';
                renderForum();
                ensureForumWalletInitialized();
            });
        }

        const forumWalletBackBtn = document.getElementById('forum-wallet-back-title');
        if (forumWalletBackBtn) {
            forumWalletBackBtn.addEventListener('click', () => {
                forumState.activeTab = 'profile';
                renderForum();
            });
        }
        const forumWalletRechargeBtn = document.getElementById('forum-wallet-recharge-btn');
        if (forumWalletRechargeBtn) {
            forumWalletRechargeBtn.addEventListener('click', () => {
                handleForumWalletRecharge();
            });
        }
        const forumWalletWithdrawBtn = document.getElementById('forum-wallet-withdraw-btn');
        if (forumWalletWithdrawBtn) {
            forumWalletWithdrawBtn.addEventListener('click', () => {
                handleForumWalletWithdraw();
            });
        }

        const followBtn = document.getElementById('other-profile-follow-btn');
        if (followBtn) {
            followBtn.addEventListener('click', () => {
                if (forumState.viewingUser) {
                    const isFollowing = !forumState.viewingUser.isFollowing;
                    forumState.viewingUser.isFollowing = isFollowing;
                    
                    // Add smooth transition
                    followBtn.style.transition = 'all 0.2s ease';
                    
                    if (isFollowing) {
                        followBtn.innerHTML = '已关注 <i class="fas fa-chevron-down" style="font-size: 12px; margin-left: 2px;"></i>';
                        followBtn.style.backgroundColor = '#F0F2F5';
                        followBtn.style.color = '#000';
                        // Add scale effect
                        followBtn.style.transform = 'scale(0.95)';
                        setTimeout(() => followBtn.style.transform = 'scale(1)', 200);
                    } else {
                        followBtn.innerHTML = '关注';
                        followBtn.style.backgroundColor = '#455EFF';
                        followBtn.style.color = 'white';
                        // Add scale effect
                        followBtn.style.transform = 'scale(0.95)';
                        setTimeout(() => followBtn.style.transform = 'scale(1)', 200);
                    }
                }
            });
        }

        const forumSettingsBtn = document.getElementById('forum-settings-btn');
        if (forumSettingsBtn) {
            forumSettingsBtn.addEventListener('click', () => {
                forumState.activeTab = 'forum_settings';
                renderForum();
            });
        }

        const otherProfileBackBtn = document.getElementById('other-profile-back');
        if (otherProfileBackBtn) {
            otherProfileBackBtn.addEventListener('click', () => {
                forumState.viewingUser = null;
                forumState.activeTab = 'home';
                renderForum();
            });
        }

        const otherProfileMenuBtn = document.getElementById('other-profile-menu-btn');
        if (otherProfileMenuBtn) {
            otherProfileMenuBtn.addEventListener('click', () => {
                showProfileMenu();
            });
        }

        const profileMultiselectDoneBtn = document.getElementById('profile-multiselect-done');
        if (profileMultiselectDoneBtn) {
            profileMultiselectDoneBtn.addEventListener('click', () => {
                // Cancel/Exit Mode
                forumState.profileMultiSelectMode = false;
                forumState.profileSelectedPostIds = new Set();
                renderForum(false);
            });
        }

        const profileMultiselectAllBtn = document.getElementById('profile-multiselect-all');
        if (profileMultiselectAllBtn) {
            profileMultiselectAllBtn.addEventListener('click', () => {
                toggleProfileSelectAll();
            });
        }

        const profileMultiselectDeleteBtn = document.getElementById('profile-multiselect-delete');
        if (profileMultiselectDeleteBtn) {
            profileMultiselectDeleteBtn.addEventListener('click', () => {
                deleteProfileSelectedPosts();
            });
        }

        const editBackBtn = document.getElementById('edit-profile-back');
        if (editBackBtn) {
            editBackBtn.addEventListener('click', () => {
                // Save changes logic
                const nameInput = document.getElementById('edit-name-input');
                const usernameInput = document.getElementById('edit-username-input');
                const signatureInput = document.getElementById('edit-signature-input');
                const publicIdentityInput = document.getElementById('edit-public-identity-input');
                const followersInput = document.getElementById('edit-followers-input');
                const genderInput = document.getElementById('edit-gender-input');

                if (nameInput) forumState.currentUser.bio = nameInput.value;
                if (usernameInput) forumState.currentUser.username = usernameInput.value;
                if (signatureInput) forumState.currentUser.signature = signatureInput.value;
                if (publicIdentityInput) forumState.currentUser.publicIdentity = publicIdentityInput.value;
                if (followersInput) forumState.currentUser.followers = parseInt(followersInput.value) || 0;
                if (genderInput) forumState.currentUser.gender = genderInput.value;

                // Save to localStorage
                localStorage.setItem('forum_currentUser', JSON.stringify(forumState.currentUser));

                forumState.activeTab = 'profile';
                renderForum();
            });
        }

        const forumSettingsBackBtn = document.getElementById('forum-settings-back');
        if (forumSettingsBackBtn) {
            forumSettingsBackBtn.addEventListener('click', () => {
                forumState.activeTab = 'profile';
                renderForum();
            });
        }

        const forumSettingsSaveBtn = document.getElementById('forum-settings-save');
        if (forumSettingsSaveBtn) {
            forumSettingsSaveBtn.addEventListener('click', () => {
                // Save Logic
                if (!forumState.settings) forumState.settings = {};
                
                const selectedContacts = [];
                document.querySelectorAll('.forum-contact-check-icon').forEach(icon => {
                    if (icon.dataset.checked === 'true') selectedContacts.push(parseInt(icon.dataset.id));
                });
                forumState.settings.linkedContacts = selectedContacts;

                const wbSelect = document.getElementById('forum-worldbook-select');
                forumState.settings.linkedWorldbook = wbSelect.value ? parseInt(wbSelect.value) : null;

                const worldviewInput = document.getElementById('forum-worldview-input');
                forumState.settings.forumWorldview = worldviewInput.value;

                // Persist
                localStorage.setItem('forum_settings', JSON.stringify(forumState.settings));
                
                forumState.activeTab = 'profile';
                renderForum();
            });
        }

        const forumEditContactBackBtn = document.getElementById('forum-edit-contact-back');
        if (forumEditContactBackBtn) {
            forumEditContactBackBtn.addEventListener('click', () => {
                forumState.activeTab = 'forum_settings';
                renderForum();
            });
        }

        const forumEditContactSaveBtn = document.getElementById('forum-edit-contact-save');
        if (forumEditContactSaveBtn) {
            forumEditContactSaveBtn.addEventListener('click', () => {
                const contactId = forumState.editingContactId;
                if (!contactId) return;

                if (!forumState.settings.contactProfiles) forumState.settings.contactProfiles = {};
                
                const profile = forumState.settings.contactProfiles[contactId] || {};
                
                profile.name = document.getElementById('fc-name').value;
                profile.username = document.getElementById('fc-username').value;
                profile.identity = document.getElementById('fc-identity').value;
                profile.bio = document.getElementById('fc-bio').value;
                profile.followers = parseInt(document.getElementById('fc-followers').value) || 0;
                profile.following = parseInt(document.getElementById('fc-following').value) || 0;
                
                profile.autoImage = document.getElementById('fc-auto-image').checked;
                const knowsUserCheckbox = document.getElementById('fc-knows-user');
                if (knowsUserCheckbox) {
                    profile.knowsUser = knowsUserCheckbox.checked;
                }
                const presetSelect = document.getElementById('fc-image-preset');
                if (presetSelect) {
                    profile.imagePresetName = presetSelect.value;
                }
                // profile.imagePrompt = document.getElementById('fc-image-prompt').value; // Removed old field

                // Avatar handling via existing preview img src (assuming uploaded/set)
                const avatarPreview = document.getElementById('forum-contact-avatar-preview');
                if (avatarPreview) {
                    profile.avatar = avatarPreview.src;
                }

                // sync options
                const syncCb = document.getElementById('fc-sync-wechat');
                if (syncCb) profile.syncWechat = syncCb.checked;
                const autoPostCb = document.getElementById('fc-auto-post');
                if (autoPostCb) profile.autoPostEnabled = autoPostCb.checked;
                const intervalInput = document.getElementById('fc-auto-post-interval');
                if (intervalInput) profile.autoPostInterval = parseInt(intervalInput.value) || 0;

                forumState.settings.contactProfiles[contactId] = profile;
                
                localStorage.setItem('forum_settings', JSON.stringify(forumState.settings));
                
                forumState.activeTab = 'forum_settings';
                renderForum();
            });
        }

        const forumContactAvatarInput = document.getElementById('forum-contact-avatar-input');
        if (forumContactAvatarInput) {
            forumContactAvatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const img = new Image();
                        img.src = event.target.result;
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const MAX_SIZE = 300;
                            let width = img.width;
                            let height = img.height;
                            if (width > height) {
                                if (width > MAX_SIZE) {
                                    height *= MAX_SIZE / width;
                                    width = MAX_SIZE;
                                }
                            } else {
                                if (height > MAX_SIZE) {
                                    width *= MAX_SIZE / height;
                                    height = MAX_SIZE;
                                }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);
                            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                            document.getElementById('forum-contact-avatar-preview').src = compressedDataUrl;
                        };
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const generateBtn = document.getElementById('forum-generate-btn');
        if (generateBtn) {
            generateBtn.addEventListener('click', generateForumPosts);
        }


        // Avatar Upload Logic
        const avatarWrapper = document.querySelector('.edit-avatar-wrapper');
        const avatarText = document.querySelector('.edit-avatar-text');
        const fileInput = document.getElementById('avatar-upload-input');
        
        const triggerUpload = () => {
            if (fileInput) fileInput.click();
        };

        if (avatarWrapper) avatarWrapper.addEventListener('click', triggerUpload);
        if (avatarText) avatarText.addEventListener('click', triggerUpload);

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        // Capture current input values before re-rendering
                        const nameInput = document.getElementById('edit-name-input');
                        const usernameInput = document.getElementById('edit-username-input');
                        const signatureInput = document.getElementById('edit-signature-input');

                        if (nameInput) forumState.currentUser.bio = nameInput.value;
                        if (usernameInput) forumState.currentUser.username = usernameInput.value;
                        if (signatureInput) forumState.currentUser.signature = signatureInput.value;

                        // Image Compression
                        const img = new Image();
                        img.src = e.target.result;
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Resize logic (max 300x300)
                            const MAX_SIZE = 300;
                            let width = img.width;
                            let height = img.height;
                            
                            if (width > height) {
                                if (width > MAX_SIZE) {
                                    height *= MAX_SIZE / width;
                                    width = MAX_SIZE;
                                }
                            } else {
                                if (height > MAX_SIZE) {
                                    width *= MAX_SIZE / height;
                                    height = MAX_SIZE;
                                }
                            }
                            
                            canvas.width = width;
                            canvas.height = height;
                            ctx.drawImage(img, 0, 0, width, height);
                            
                            // Compress to JPEG 0.7 quality
                            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

                            // Update State
                            forumState.currentUser.avatar = compressedDataUrl;
                            
                            // Save to localStorage
                            try {
                                localStorage.setItem('forum_currentUser', JSON.stringify(forumState.currentUser));
                            } catch (err) {
                                console.error("Failed to save to localStorage", err);
                                alert("图片无法保存：文件过大");
                            }
                            
                            renderForum(); // Re-render
                        };
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Like Button Listener (Delegation)
        const contentArea = document.getElementById('forum-content-area');
        if (contentArea) {
            contentArea.addEventListener('click', (e) => {
                // Profile Trigger
                const profileTrigger = e.target.closest('.user-profile-trigger');
                if (profileTrigger) {
                    e.stopPropagation();
                    try {
                        const userData = JSON.parse(decodeURIComponent(profileTrigger.dataset.userJson));
                        window.openUserProfile(userData);
                    } catch (err) {
                        console.error('Failed to parse user data', err);
                    }
                    return;
                }

                // Multi-select checkbox click
                const checkbox = e.target.closest('.post-select-checkbox');
                if (checkbox) {
                    e.stopPropagation();
                    const postId = parseInt(checkbox.dataset.postId);
                    togglePostSelection(postId);
                    return;
                }

                // Three-dot (ellipsis) button click - enter multi-select mode
                const moreBtn = e.target.closest('.post-more-btn');
                if (moreBtn) {
                    e.stopPropagation();
                    enterMultiSelectMode();
                    return;
                }

                // In multi-select mode, clicking on a post toggles its selection
                if (forumState.multiSelectMode) {
                    const postItem = e.target.closest('.post-item');
                    if (postItem) {
                        const postId = parseInt(postItem.dataset.postId);
                        if (postId) {
                            togglePostSelection(postId);
                        }
                    }
                    return;
                }

                const likeBtn = e.target.closest('.like-btn');
                if (likeBtn) {
                    const postId = likeBtn.dataset.id;
                    toggleLike(postId);
                }

                const commentBtn = e.target.closest('.comment-btn');
                if (commentBtn) {
                    const postId = commentBtn.dataset.id;
                    const post = forumState.posts.find(p => p.id === parseInt(postId));
                    renderCommentsOverlay(post ? post.comments_list : null, post);
                }

                // Image Click Listener for Description
                const postImageContainer = e.target.closest('.post-image-container');
                if (postImageContainer) {
                    postImageContainer.classList.toggle('show-description');
                }
            });
        }

        // Multi-select bar buttons - use event delegation on app level
        const forumApp = document.getElementById('forum-app');
        if (forumApp && !forumApp._multiSelectListenerAttached) {
            forumApp._multiSelectListenerAttached = true;
            forumApp.addEventListener('click', (e) => {
                // Post Multi-select
                if (e.target.closest('#multi-select-cancel')) {
                    e.stopPropagation();
                    exitMultiSelectMode();
                }
                if (e.target.closest('#multi-select-all')) {
                    e.stopPropagation();
                    selectAllPosts();
                }
                if (e.target.closest('#multi-select-delete')) {
                    e.stopPropagation();
                    if (forumState.selectedPostIds.size > 0) {
                        deleteSelectedPosts();
                    }
                }

                // DM Multi-select
                if (e.target.closest('#dm-ms-cancel')) {
                    e.stopPropagation();
                    exitDMMultiSelectMode();
                }
                if (e.target.closest('#dm-ms-all')) {
                    e.stopPropagation();
                    toggleDMSelectAll();
                }
                if (e.target.closest('#dm-ms-delete')) {
                    e.stopPropagation();
                    deleteSelectedDMs();
                }
            });
        }

        // --- DM Long Press Logic ---
        const dmList = document.querySelector('.dm-messages-list');
        if (dmList && !dmList._longPressAttached) {
            dmList._longPressAttached = true;
            
            // Delegate events from list to items
            dmList.addEventListener('mousedown', handleDMLongPressStart);
            dmList.addEventListener('touchstart', handleDMLongPressStart, { passive: true });
            dmList.addEventListener('mouseup', handleDMLongPressEnd);
            dmList.addEventListener('touchend', handleDMLongPressEnd);
            dmList.addEventListener('mousemove', handleDMLongPressCancel);
            dmList.addEventListener('touchmove', handleDMLongPressCancel);
            
            // Handle clicks for selection in multi-select mode or open chat
            dmList.addEventListener('click', (e) => {
                const item = e.target.closest('.dm-user-row');
                if (!item) return;
                
                const id = parseInt(item.dataset.dmId);
                if (!id) return;

                if (forumState.dmMultiSelectMode) {
                    e.stopPropagation();
                    e.preventDefault();
                    toggleDMSelection(id);
                } else {
                    // Check if it was a long press (flag set by timer)
                    if (dmList._isLongPressHandled) {
                        dmList._isLongPressHandled = false;
                        return;
                    }
                    window.openForumChat(id);
                }
            });
        }
    }

    let dmLongPressTimer = null;
    let dmLongPressStartX = 0;
    let dmLongPressStartY = 0;

    function handleDMLongPressStart(e) {
        const item = e.target.closest('.dm-user-row');
        if (!item || forumState.dmMultiSelectMode) return;

        const list = document.querySelector('.dm-messages-list');
        if (list) list._isLongPressHandled = false;

        if (e.type === 'touchstart') {
            dmLongPressStartX = e.touches[0].clientX;
            dmLongPressStartY = e.touches[0].clientY;
        } else {
            dmLongPressStartX = e.clientX;
            dmLongPressStartY = e.clientY;
        }

        dmLongPressTimer = setTimeout(() => {
            const id = parseInt(item.dataset.dmId);
            if (id) {
                enterDMMultiSelectMode(id);
                // Mark as handled to prevent click event
                if (list) list._isLongPressHandled = true;
            }
        }, 500); // 500ms long press
    }

    function handleDMLongPressEnd(e) {
        if (dmLongPressTimer) {
            clearTimeout(dmLongPressTimer);
            dmLongPressTimer = null;
        }
    }

    function handleDMLongPressCancel(e) {
        if (!dmLongPressTimer) return;

        let x, y;
        if (e.type === 'touchmove') {
            x = e.touches[0].clientX;
            y = e.touches[0].clientY;
        } else {
            x = e.clientX;
            y = e.clientY;
        }

        // If moved more than 10px, cancel long press
        if (Math.abs(x - dmLongPressStartX) > 10 || Math.abs(y - dmLongPressStartY) > 10) {
            clearTimeout(dmLongPressTimer);
            dmLongPressTimer = null;
        }
    }

    function enterDMMultiSelectMode(initialId) {
        forumState.dmMultiSelectMode = true;
        forumState.selectedDmIds = new Set([initialId]);
        renderForum(false);
    }

    function exitDMMultiSelectMode() {
        forumState.dmMultiSelectMode = false;
        forumState.selectedDmIds = new Set();
        renderForum(false);
    }

    function toggleDMSelection(id) {
        if (forumState.selectedDmIds.has(id)) {
            forumState.selectedDmIds.delete(id);
        } else {
            forumState.selectedDmIds.add(id);
        }
        renderForum(false); // Using renderForum(false) for simplicity, could optimize
    }

    function toggleDMSelectAll() {
        if (forumState.selectedDmIds.size === forumState.messages.length) {
            forumState.selectedDmIds.clear();
        } else {
            forumState.messages.forEach(m => forumState.selectedDmIds.add(m.id));
        }
        renderForum(false);
    }

    function deleteSelectedDMs() {
        const count = forumState.selectedDmIds.size;
        if (count === 0) return;

        if (confirm(`确定删除这 ${count} 个对话吗？`)) {
            // Remove from messages list
            forumState.messages = forumState.messages.filter(m => !forumState.selectedDmIds.has(m.id));
            
            // Remove from chat history (optional but cleaner)
            forumState.selectedDmIds.forEach(id => {
                if (forumState.chatHistory[id]) delete forumState.chatHistory[id];
            });

            // Save
            saveMessages();
            saveChatHistory();

            // Exit mode
            forumState.dmMultiSelectMode = false;
            forumState.selectedDmIds = new Set();
            renderForum(false);
        }
    }

    function enterMultiSelectMode() {
        forumState.multiSelectMode = true;
        forumState.selectedPostIds = new Set();
        renderForum(false);
    }

    function exitMultiSelectMode() {
        forumState.multiSelectMode = false;
        forumState.selectedPostIds = new Set();
        renderForum(false);
    }

    function togglePostSelection(postId) {
        if (forumState.selectedPostIds.has(postId)) {
            forumState.selectedPostIds.delete(postId);
        } else {
            forumState.selectedPostIds.add(postId);
        }
        // Update UI without full re-render for better performance
        updateMultiSelectUI(postId);
    }

    function updateMultiSelectUI(postId) {
        // Update the checkbox
        const postItem = document.querySelector(`.post-item[data-post-id="${postId}"]`);
        if (postItem) {
            const checkbox = postItem.querySelector('.post-select-checkbox');
            const isSelected = forumState.selectedPostIds.has(postId);
            if (checkbox) {
                checkbox.classList.toggle('selected', isSelected);
            }
            postItem.classList.toggle('post-selected', isSelected);
        }

        // Update the delete button
        const deleteBtn = document.getElementById('multi-select-delete');
        if (deleteBtn) {
            if (forumState.selectedPostIds.size === 0) {
                deleteBtn.classList.add('is-disabled');
            } else {
                deleteBtn.classList.remove('is-disabled');
            }
        }
        // Update select-all button text
        const selectAllBtn = document.getElementById('multi-select-all');
        if (selectAllBtn) {
            selectAllBtn.textContent = forumState.selectedPostIds.size === forumState.posts.length ? '取消全选' : '全选';
        }
    }

    function selectAllPosts() {
        const allSelected = forumState.posts.length > 0 && forumState.selectedPostIds.size === forumState.posts.length;
        if (allSelected) {
            // Deselect all
            forumState.selectedPostIds = new Set();
        } else {
            // Select all
            forumState.selectedPostIds = new Set(forumState.posts.map(p => p.id));
        }
        // Update UI for all posts
        document.querySelectorAll('.post-item[data-post-id]').forEach(postItem => {
            const postId = parseInt(postItem.getAttribute('data-post-id'));
            const checkbox = postItem.querySelector('.post-select-checkbox');
            const isSelected = forumState.selectedPostIds.has(postId);
            if (checkbox) {
                checkbox.classList.toggle('selected', isSelected);
            }
            postItem.classList.toggle('post-selected', isSelected);
        });
        // Update delete button state
        const deleteBtn = document.getElementById('multi-select-delete');
        if (deleteBtn) {
            if (forumState.selectedPostIds.size === 0) {
                deleteBtn.classList.add('is-disabled');
            } else {
                deleteBtn.classList.remove('is-disabled');
            }
        }
        // Update select-all button text
        const selectAllBtn = document.getElementById('multi-select-all');
        if (selectAllBtn) {
            selectAllBtn.textContent = forumState.selectedPostIds.size === forumState.posts.length ? '取消全选' : '全选';
        }
    }

    function deleteSelectedPosts() {
        if (forumState.selectedPostIds.size === 0) return;

        const count = forumState.selectedPostIds.size;
        if (!confirm(`确定要删除选中的 ${count} 条帖子吗？`)) return;

        // Remove selected posts from state
        forumState.posts = forumState.posts.filter(p => !forumState.selectedPostIds.has(p.id));

        // Save to localStorage
        saveForumData();

        // Exit multi-select mode and re-render
        forumState.multiSelectMode = false;
        forumState.selectedPostIds = new Set();
        renderForum(false);
    }

    function toggleLike(postId) {
        const post = forumState.posts.find(p => p.id === parseInt(postId));
        if (post) {
            post.liked = !post.liked;
            if (typeof post.stats.likes === 'string') {
                post.stats.likes = parseFloat(post.stats.likes.replace(/,/g, ''));
            }
            post.stats.likes += post.liked ? 1 : -1;
            
            // Save to localStorage
            saveForumData();

            // Targeted DOM Update
            const likeBtn = document.querySelector(`.like-btn[data-id="${postId}"]`);
            if (likeBtn) {
                const icon = likeBtn.querySelector('i');
                const count = likeBtn.querySelector('.action-count');
                
                if (post.liked) {
                    icon.className = 'fas fa-heart animate-like-heart';
                    icon.style.color = '#ed4956';
                } else {
                    icon.className = 'far fa-heart';
                    icon.style.color = '';
                }
                
                if (count) {
                    count.textContent = formatCount(post.stats.likes);
                }
            } else {
                renderForum(false);
            }
        }
    }

    // --- Image Storage Helpers (separate keys to avoid quota issues) ---

    const MAX_STORED_IMAGES = 20;

    function getAllImageKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('forum_img_')) keys.push(k);
        }
        return keys.sort(); // Sorted by postId (timestamp-based), oldest first
    }

    function cleanupOldPostImages(keepCount) {
        keepCount = (keepCount === undefined) ? MAX_STORED_IMAGES : keepCount;
        const keys = getAllImageKeys();
        if (keys.length > keepCount) {
            keys.slice(0, keys.length - keepCount).forEach(k => localStorage.removeItem(k));
        }
    }

    function savePostImage(postId, imageData) {
        const key = 'forum_img_' + postId;
        for (let attempt = 0; attempt < 4; attempt++) {
            try {
                localStorage.setItem(key, imageData);
                return true;
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    const keepCount = Math.max(0, MAX_STORED_IMAGES - (attempt + 1) * 2);
                    cleanupOldPostImages(keepCount);
                } else {
                    break;
                }
            }
        }
        console.warn('Cannot store image for post', postId, '— image will not persist');
        return false;
    }

    function loadPostImages() {
        forumState.posts = forumState.posts.map(p => {
            if (p.image === '__ref__') {
                p.image = localStorage.getItem('forum_img_' + p.id) || null;
            }
            return p;
        });
    }

    function saveForumData() {
        // Strip large AI-generated base64 images (JPEG/PNG) and store them under separate keys.
        // SVG data-URIs and http URLs are small enough to stay inline.
        const postsToSave = forumState.posts.map(p => {
            if (p.image &&
                p.image.length > 5000 &&
                p.image.startsWith('data:image/') &&
                !p.image.startsWith('data:image/svg')) {
                
                const key = 'forum_img_' + p.id;
                // Only save if key doesn't exist, to avoid re-writing and hitting quota loop
                if (!localStorage.getItem(key)) {
                    savePostImage(p.id, p.image);
                }
                return Object.assign({}, p, { image: '__ref__' });
            }
            return p;
        });

        for (let pass = 0; pass < 3; pass++) {
            try {
                localStorage.setItem('forum_posts', JSON.stringify(postsToSave));
                return; // Success
            } catch (e) {
                if (e.name !== 'QuotaExceededError') {
                    console.error('Storage error', e);
                    return;
                }
                // Each pass gets more aggressive
                if (pass === 0) {
                    // Remove images from all but the 3 most recent posts
                    for (let i = 3; i < postsToSave.length; i++) {
                        postsToSave[i].image = null;
                    }
                } else if (pass === 1) {
                    // Strip ALL images
                    postsToSave.forEach(p => { p.image = null; });
                    // Trim to 30 posts
                    postsToSave.splice(30);
                    forumState.posts = forumState.posts.slice(0, 30);
                } else {
                    console.error('Critical: Cannot save forum data even after aggressive cleanup');
                }
            }
        }
    }

    // Helper to compress image
    function compressImage(base64Str, quality = 0.7, maxWidth = 800) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to JPEG with quality setting
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = (e) => reject(e);
        });
    }

    // Helper to detect image type from text
    function detectImageType(text) {
        if (!text) return 'general';
        // Remove comments
        text = text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        
        if (/(吃|喝|美食|美味|food|dish|meal|好吃|蛋糕|面|饭|菜|早餐|午餐|晚餐|夜宵)/i.test(text)) return 'food';
        if (/(风景|景色|山|水|scenery|landscape|view|sky|cloud|sea|forest|outside|nature|outdoor|street|city|建筑|街|楼)/i.test(text)) return 'scenery';
        if (/(房间|屋|室|room|indoor|house|living|bedroom|bed|furniture|床|沙发|桌)/i.test(text)) return 'scene';
        if (/(我|你|他|她|人|脸|看|girl|boy|man|woman|face|eye|hair|body|looking|solo|1girl|1boy|自拍|合影)/i.test(text)) return 'portrait';
        return 'general';
    }

    // --- Other Profile Posts View Logic ---

    window.viewOtherProfilePosts = function(postId) {
        forumState.otherProfileScrollToPostId = postId;
        forumState.activeTab = 'other_profile_posts';
        renderForum();
    };

    window.backToOtherProfile = function() {
         forumState.activeTab = 'other_profile';
         renderForum();
    };

    function renderOtherProfilePosts() {
        const user = forumState.viewingUser;
        if (!user) return '<div style="padding: 20px;">User not found</div>';
        
        // Filter posts for this user
        const userPosts = forumState.posts.filter(p => p.user.name === user.name);
        
        if (userPosts.length === 0) {
            return '<div style="padding: 40px; text-align: center; color: #8e8e8e;">暂无帖子</div>';
        }

        return `
            <div class="feed-container" style="padding-bottom: 20px;">
                ${userPosts.map(post => {
                    // Reuse renderPost but inject ID for scrolling
                    // We can't easily inject into the string result of renderPost without parsing
                    // But renderPost returns a string starting with <div class="post-item ...">
                    const postHtml = renderPost(post);
                    // Add ID to the first div
                    return postHtml.replace('class="post-item', `id="other-profile-post-${post.id}" class="post-item`);
                }).join('')}
            </div>
        `;
    }

    // Helper: Translate Chinese prompt to English NovelAI tags
    async function translateToNovelAIPrompt(text, settings) {
        if (!text) return "";
        
        // 1. Basic Cleanup: Remove comments like // ... and /* ... */
        let cleanText = text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
        
        if (!cleanText) return "";

        // 2. If it contains Chinese, use LLM to translate
        if (/[\u4e00-\u9fa5]/.test(cleanText)) {
            // Construct LLM request url
            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            try {
                const response = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + settings.key
                    },
                    body: JSON.stringify({
                        model: settings.model || 'gpt-3.5-turbo',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a professional NovelAI prompt translator. Your task is to translate the user\'s Chinese image description into English comma-separated tags suitable for NovelAI (anime style). \n' +
                                         'Rules:\n' +
                                         '1. Output ONLY the tags, separated by commas.\n' +
                                         '2. Do NOT output any conversational text, explanations, or markdown.\n' +
                                         '3. Focus on visual descriptors (appearance, clothing, setting, lighting, composition).\n' +
                                         '4. Convert abstract concepts into visual tags.\n' +
                                         '5. Translate accurately.'
                            },
                            { role: 'user', content: cleanText }
                        ],
                        temperature: 0.3
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    let translated = data.choices[0].message.content;
                    // Clean up markdown code blocks if any
                    translated = translated.replace(/```json\n?/g, '').replace(/```/g, '').trim();
                    console.log('Prompt translated:', cleanText, '=>', translated);
                    return translated;
                } else {
                    console.warn('Translation API failed, using cleaned text');
                }
            } catch (e) {
                console.error('Translation error:', e);
            }
        }
        
        // Fallback: Just replace punctuation
        return cleanText.replace(/[，。、；！\n]/g, ', ').replace(/\s+/g, ' ').trim();
    }

    async function generateForumPosts() {
        const btn = document.getElementById('forum-generate-btn');
        if (!btn) return;

        if (btn.classList.contains('fa-spin')) return; // Prevent double click

        // Start loading
        btn.classList.remove('far', 'fa-heart');
        btn.classList.add('fas', 'fa-spinner', 'fa-spin');

        try {
            // Get AI settings
            let settings = { url: '', key: '', model: '' };
            if (window.iphoneSimState) {
                if (window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url) {
                    settings = window.iphoneSimState.aiSettings;
                } else if (window.iphoneSimState.aiSettings2 && window.iphoneSimState.aiSettings2.url) {
                    settings = window.iphoneSimState.aiSettings2;
                }
            }

            if (!settings.url || !settings.key) {
                alert('请先在设置中配置AI接口信息');
                throw new Error('No AI settings');
            }

            // Gather Context: Linked Contacts
            const linkedContactIds = forumState.settings.linkedContacts || [];
            const contacts = window.iphoneSimState.contacts || [];
            const profiles = forumState.settings.contactProfiles || {};
            
            const linkedContactsData = linkedContactIds.map(id => {
                const contact = contacts.find(c => c.id === id);
                if (!contact) return null;
                const profile = profiles[id] || {};
                return {
                    id: contact.id, // Keep original ID type
                    name: profile.name || contact.remark || contact.name,
                    username: profile.username || contact.id,
                    avatar: profile.avatar || contact.avatar,
                    verified: false,
                    subtitle: profile.identity || '',
                    followers: profile.followers || 0,
                    persona: contact.persona || '普通网友',
                    bio: profile.bio || ''
                };
            }).filter(c => c);

            // Gather Context: Worldbook & Worldview
            const forumWorldview = forumState.settings.forumWorldview || '';
            const wbId = forumState.settings.linkedWorldbook;
            let worldbookContent = '';
            if (wbId && window.iphoneSimState.wbCategories) {
                const wb = window.iphoneSimState.wbCategories.find(c => c.id === wbId);
                if (wb && wb.entries) {
                    // Limit content to avoid token overflow, prefer key and content
                    worldbookContent = wb.entries.slice(0, 20).map(e => `${e.key}: ${e.content}`).join('\n').substring(0, 3000);
                }
            }

            let prompt = '';
            const targetTotal = 7;
            const currentUserName = forumState.currentUser.bio || '我'; // Current user name

            if (linkedContactsData.length > 0) {
                const charList = linkedContactsData.map(c => {
                    // Collect existing post captions for this contact to avoid duplicates
                    const existingCaptions = forumState.posts
                        .filter(p => {
                            if (!p.user) return false;
                            const contact = contacts.find(ct => ct.id === c.id);
                            if (!contact) return false;
                            return p.user.name === c.name ||
                                   p.user.name === (contact.remark || contact.name) ||
                                   p.userId === c.id ||
                                   (p.user.id && p.user.id == c.id);
                        })
                        .map(p => p.caption)
                        .filter(Boolean)
                        .slice(-10); // Only last 10 to keep prompt short

                    const existingBlock = existingCaptions.length > 0
                        ? `\n  已有帖子(禁止重复或相似，必须生成完全不同的内容):\n${existingCaptions.map(cap => `    - "${cap.substring(0, 60)}"`).join('\n')}`
                        : '';

                    return `- ID: "${c.id}"\n  Name: ${c.name}\n  Identity: ${c.subtitle}\n  Followers: ${c.followers}\n  Persona: ${c.persona}${existingBlock}`;
                }).join('\n\n');

                prompt = `
请模拟社交论坛生成帖子。
世界观背景: ${forumWorldview}
世界设定(Worldbook): ${worldbookContent}

任务: 生成总共 ${Math.max(targetTotal, linkedContactsData.length)} 条帖子。

【重要】每个用户的"已有帖子"列表中的内容是该用户之前已经发过的帖子。新���成的帖子内容和话题必须与已有帖子完全不同，不得有任何相似度。请从不同的生活场景、情绪、事件角度出发。

要求 1 (指定用户):
以下用户必须每人至少发一条帖子 (userId 必须填入对应的 ID):
${charList}

要求 2 (路人):
剩余的帖子由随机路人(NPC)发布 (userId 留空或为null).

通用数据要求:
1. 返回纯JSON数组。
2. 严禁生成以 "${currentUserName}" 或 "我" 为名字的评论/回复。严禁出现替用户("${currentUserName}")回复的情况。
3. 评论区严禁出现重复评论。
4. **重要**: 如果是"指定用户"(联系人)发的帖子，该用户必须在评论区中至少回复一条评论。
5. 每个帖子对象包含:
   - userId: 对应上面列表中的 ID (如果是路人则为 null)
   - user: 如果是路人(userId为null)，必须包含此对象: { "name": "随机网名", "avatar": "https://api.dicebear.com/7.x/lorelei/svg?seed=随机字符串", "verified": false, "subtitle": "签名" }。如果是指定用户，此字段可为 null。
   - post_type: "image" 或 "text" (随机)
   - image_ratio: "1:1", "4:5", "16:9" (如果是图片)
   - type: "food", "travel", "mood", "hobby", "daily", "pet", "scenery"
   - image_description: 图片画面详细描述(用于生成占位图)
   - caption: 帖子正文。必须符合该用户的"Persona"(人设)和"Identity"(身份)，并结合"World Setting"和"Worldbook"中的内容。内容要生活化、真实、有梗。
   - time: "刚刚"
   - stats: { likes, comments, forwards, shares } -> 数值必须根据用户的 Followers (粉丝数) 和 Identity 合理生成。
   - comments_list: 数组，包含3-5条评论。
     每个评论对象必须包含:
     {
       "id": 1,
       "user": { "name": "网友昵称", "avatar": "https://api.dicebear.com/7.x/lorelei/svg?seed=randomString", "verified": false },
       "text": "评论内容",
       "time": "1分钟前",
       "likes": 0,
       "replies": [] // 包含0-2条回复。**如果是联系人帖子，必须包含至少一条作者本人的回复**。
     }

只返回JSON，不要Markdown标记。
`;
            } else {
                // Fallback to random strangers if no contacts linked
                prompt = `
请模拟社交论坛生成7个陌生人（NPC）发布的帖子。
世界观背景: ${forumWorldview}
世界设定(Worldbook): ${worldbookContent}

要求:
1. 返回纯JSON数组。
2. 严禁生成以 "${currentUserName}" 或 "我" 为名字的评论。
3. 严禁出现重复评论。
4. 每个对象包含:
   - post_type: "image" 或 "text" (30%概率为纯文字)
   - image_ratio: "1:1", "4:5", "16:9"
   - type: "food", "travel", "mood", "hobby", "daily", "pet", "scenery"
   - image_description: 画面描述
   - user: { name, avatar (生成随机URL), verified (bool), subtitle }
   - stats: { likes, comments, forwards, shares }
   - caption: 正文 (符合世界观，生活化)
   - time: "刚刚"
   - comments_list: 评论列表。每个评论必须包含 user 对象 { name, avatar }.

只返回JSON，不要Markdown标记。
`;
            }

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + settings.key
                },
                body: JSON.stringify({
                    model: settings.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: '你是模拟社交网络数据的生成器。只返回JSON数据。' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            let content = data.choices[0].message.content;
            
            // Clean up content if it contains markdown code blocks
            content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();

            let newPosts = [];
            try {
                newPosts = JSON.parse(content);
            } catch (e) {
                console.error("JSON parse failed", content);
                throw new Error("AI生成的数据格式有误");
            }
            
            // Helper to generate SVG placeholder
            const generatePlaceholderSvg = (type, ratio = '1:1') => {
                const colors = ['#F0F8FF', '#FAEBD7', '#F5F5DC', '#FFE4C4', '#FFEBCD', '#E6E6FA', '#FFF0F5', '#E0FFFF', '#FAFAD2', '#D3D3D3', '#90EE90', '#FFB6C1'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                const icons = {
                    food: '<path d="M11 9H9V2H7v7H5V2H3v7c0 2.12 1.66 3.84 3.75 3.97V22h2.5v-9.03C11.34 12.84 13 11.12 13 9V2h-2v7zm5-3v8h2.5v8H21V2c-2.76 0-5 2.24-5 4z" fill="#fff" opacity="0.8"/>',
                    travel: '<path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="#fff" opacity="0.8"/>',
                    mood: '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="#fff" opacity="0.8"/>',
                    hobby: '<path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#fff" opacity="0.8"/>',
                    daily: '<path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" fill="#fff" opacity="0.8"/>',
                    pet: '<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#fff" opacity="0.8"/>',
                    scenery: '<path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.55 8.26 9 6 9c-3.87 0-7 3.13-7 7s3.13 7 7 7h13c2.76 0 5-2.24 5-5s-2.24-5-5-5c-.55 0-1.07.09-1.57.24C16.8 9.53 15.65 6 14 6z" fill="#fff" opacity="0.8"/>'
                };

                const iconPath = icons[type] || icons.daily;
                
                let width = 600;
                let height = 600;
                let viewBox = "0 0 24 24";
                
                // Adjust dimensions based on ratio
                if (ratio === '4:5') {
                    height = 750;
                    viewBox = "0 0 24 30"; // Scale viewBox vertically
                } else if (ratio === '16:9') {
                    height = 338;
                    viewBox = "0 0 24 13.5"; // Scale viewBox vertically
                }
                
                // Center icon in new viewBox
                let iconTransform = "translate(8, 8) scale(0.33)";
                if (ratio === '4:5') {
                    iconTransform = "translate(8, 11) scale(0.33)";
                } else if (ratio === '16:9') {
                    iconTransform = "translate(8, 2.75) scale(0.33)";
                }

                const svg = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">
                    <defs>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" flood-color="#000" flood-opacity="0.15"/>
                        </filter>
                    </defs>
                    <rect width="100%" height="100%" fill="${color}"/>
                    <g transform="${iconTransform}" filter="url(#shadow)">
                        ${iconPath}
                    </g>
                </svg>
                `;
                
                return 'data:image/svg+xml;base64,' + btoa(svg);
            };

            // Validate and fix IDs
            const now = Date.now();
            if (Array.isArray(newPosts)) {
                const novelaiSettings = window.iphoneSimState.novelaiSettings;
                const contactProfiles = forumState.settings.contactProfiles || {};

                for (let index = 0; index < newPosts.length; index++) {
                    const post = newPosts[index];
                    post.id = now + index; // Ensure unique numeric IDs
                    
                    // Map User if linked contacts
                    if (linkedContactsData.length > 0 && post.userId) {
                        const contact = linkedContactsData.find(c => c.id == post.userId);
                        if (contact) {
                            post.user = {
                                name: contact.name,
                                avatar: contact.avatar,
                                verified: false,
                                subtitle: contact.subtitle
                            };

                            // Try to generate AI Image if enabled
                            const profile = contactProfiles[post.userId];
                            if (profile && profile.autoImage && post.post_type === 'image' && window.generateNovelAiImageApi && novelaiSettings && novelaiSettings.key) {
                                try {
                                    let basePrompt = '';
                                    let negativePrompt = novelaiSettings.negativePrompt || 'nsfw, lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry';
                                    let model = novelaiSettings.model || 'nai-diffusion-3';

                                    // Check for preset
                                    if (profile.imagePresetName) {
                                        const presets = window.iphoneSimState.novelaiPresets || [];
                                        let preset = null;

                                        if (profile.imagePresetName === 'AUTO_MATCH') {
                                            const typeText = (post.image_description || post.caption || '') + ' ' + (post.title || '');
                                            const type = detectImageType(typeText);
                                            // Find preset by type (assuming preset.type exists)
                                            preset = presets.find(p => p.type === type);
                                            
                                            if (!preset) {
                                                // Try to match by name containing type (e.g. "Food Preset")
                                                preset = presets.find(p => p.name && p.name.toLowerCase().includes(type));
                                            }
                                            
                                            // Final fallback to general
                                            if (!preset) {
                                                preset = presets.find(p => p.type === 'general' || p.name === '通用' || p.name === 'General');
                                            }
                                            
                                            console.log('[Forum] Auto-matched preset:', preset ? preset.name : 'None', 'for type:', type);
                                        } else {
                                            preset = presets.find(p => p.name === profile.imagePresetName);
                                        }

                                        if (preset && preset.settings) {
                                            if (preset.settings.prompt) basePrompt = preset.settings.prompt;
                                            if (preset.settings.negativePrompt) negativePrompt = preset.settings.negativePrompt;
                                            if (preset.settings.model) model = preset.settings.model;
                                        }
                                    } else if (profile.imagePrompt) {
                                        // Fallback to old imagePrompt field
                                        basePrompt = profile.imagePrompt;
                                    }

                                    // Extract appearance from persona
                                    let appearancePrompt = '';
                                    const personaContact = window.iphoneSimState.contacts.find(c => c.id == post.userId);
                                    if (personaContact && personaContact.persona) {
                                        // Try to extract appearance section (e.g. "外貌: ...")
                                        const match = personaContact.persona.match(/(?:外貌|外观|形象|样子)[:：]\s*([^\n]+)/);
                                        if (match && match[1]) {
                                            appearancePrompt = match[1].trim();
                                        }
                                    }

                                    let promptParts = [];
                                    if (basePrompt) promptParts.push(basePrompt);
                                    if (appearancePrompt) promptParts.push(appearancePrompt);
                                    if (post.image_description || post.caption) promptParts.push(post.image_description || post.caption);
                                    
                                    // Sanitize prompt: replace newlines and Chinese punctuation with English commas
                                    const rawPrompt = promptParts.join(', ');
                                    let prompt = rawPrompt;

                                    // Translate and optimize prompt using LLM if needed
                                    try {
                                        // Use global AI settings for translation
                                        const aiSettings = window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url ? window.iphoneSimState.aiSettings : (window.iphoneSimState.aiSettings2 || {});
                                        
                                        if (aiSettings && aiSettings.url) {
                                            prompt = await translateToNovelAIPrompt(rawPrompt, aiSettings);
                                        } else {
                                            console.warn('No AI settings found for translation');
                                            // Manual fallback
                                            prompt = rawPrompt.replace(/[，。、；！\n]/g, ', ').replace(/\s+/g, ' ').trim();
                                        }
                                    } catch (e) {
                                        console.warn('Prompt translation failed, falling back to original', e);
                                        prompt = rawPrompt.replace(/[，。、；！\n]/g, ', ').replace(/\s+/g, ' ').trim();
                                    }
                                    
                                    if (!prompt || prompt.length === 0) {
                                        console.warn('Skipping AI image generation: Prompt is empty');
                                        throw new Error('Prompt is empty');
                                    }

                                    console.log('Generating AI image for contact post:', personaContact?.name || 'Unknown', 'Preset:', profile.imagePresetName, 'Prompt:', prompt);

                                    let width = 832;
                                    let height = 1216;
                                    if (post.image_ratio === '16:9') { width = 1024; height = 576; }
                                    else if (post.image_ratio === '1:1') { width = 1024; height = 1024; }
                                    else if (post.image_ratio === '4:5') { width = 832; height = 1024; }

                                    const base64Image = await window.generateNovelAiImageApi({
                                        key: novelaiSettings.key,
                                        model: model,
                                        prompt: prompt,
                                        negativePrompt: negativePrompt,
                                        steps: 28,
                                        scale: 5,
                                        width: width,
                                        height: height,
                                        seed: -1
                                    });
                                    post.image = base64Image;
                                } catch (err) {
                                    console.error('Failed to generate AI image for post:', err);
                                    // Fallback to placeholder handled below
                                }
                            }
                        }
                    }

                    // Fallback for user if missing (e.g. AI error or stranger mode)
                    if (!post.user) {
                        post.user = {
                            name: '路人' + Math.floor(Math.random() * 1000),
                            avatar: 'https://api.dicebear.com/7.x/lorelei/svg?seed=' + Math.random(),
                            verified: false,
                            subtitle: ''
                        };
                    }

                    if (Array.isArray(post.images)) {
                        post.images = post.images.filter((src) => {
                            if (typeof src === 'string') return src.trim().length > 0;
                            return Boolean(src);
                        });
                    }
                    if (!post.image && Array.isArray(post.images) && post.images.length > 0) {
                        post.image = post.images[0];
                    }

                    // Generate Image if post_type is not 'text'
                    if (post.post_type === 'text') {
                        post.image = null;
                    } else if (!post.image) {
                        // Default to image if undefined and not generated by AI
                         post.image = generatePlaceholderSvg(post.type || 'daily', post.image_ratio || '1:1');
                    }

                    if (!post.stats) post.stats = { likes: 0, comments: 0, forwards: 0, shares: 0 };
                    // Ensure stats.comments matches comments_list length if possible
                    if (post.comments_list && Array.isArray(post.comments_list)) {
                        post.stats.comments = post.comments_list.length + Math.floor(Math.random() * 20);
                        
                        // Fix undefined comments and ensure author reply exists
                        let hasAuthorReply = false;
                        const isLinkedPost = linkedContactsData.length > 0 && post.userId;
                        const seenComments = new Set(); // For deduplication
                        
                        // Filter out empty or duplicate comments
                        if (post.comments_list && Array.isArray(post.comments_list)) {
                            post.comments_list = post.comments_list.filter(comment => {
                                if (!comment.text) return false;
                                if (seenComments.has(comment.text)) return false;
                                seenComments.add(comment.text);
                                return true;
                            });
                        }

                        if (post.comments_list && Array.isArray(post.comments_list)) {
                            post.comments_list.forEach((comment, cIndex) => {
                                if (!comment.id) comment.id = now + index * 100 + cIndex;
                                if (!comment.user) comment.user = {};
                                
                                // Prevent impersonation of current user in comments
                                if (!comment.user.name || comment.user.name === currentUserName || comment.user.name === '我') {
                                    comment.user.name = '网友' + Math.floor(Math.random()*1000);
                                }
                                
                                if (!comment.user.avatar) comment.user.avatar = `https://api.dicebear.com/7.x/lorelei/svg?seed=${Math.random()}`;
                                if (!comment.text) comment.text = '...';
                                if (!comment.time) comment.time = '刚刚';
                                
                                // Fix replies
                                if (comment.replies && Array.isArray(comment.replies)) {
                                    // Filter out impersonated replies or duplicate replies
                                    const seenReplies = new Set();
                                    comment.replies = comment.replies.filter(reply => {
                                        if (!reply.text) return false;
                                        if (seenReplies.has(reply.text)) return false;
                                        seenReplies.add(reply.text);
                                        return true;
                                    });

                                    comment.replies.forEach((reply, rIndex) => {
                                        if (!reply.id) reply.id = comment.id * 1000 + rIndex;
                                        if (!reply.user) reply.user = {};
                                        
                                        // Handle author replies
                                        if (reply.user.name === 'Author' || reply.user.isAuthor || (post.user && reply.user.name === post.user.name)) {
                                            reply.user = post.user; // Use post author object
                                            hasAuthorReply = true;
                                        } else {
                                            // Prevent impersonation in replies
                                            if (!reply.user.name || reply.user.name === currentUserName || reply.user.name === '我') {
                                                reply.user.name = '网友' + Math.floor(Math.random()*1000);
                                            }
                                            if (!reply.user.avatar) reply.user.avatar = `https://api.dicebear.com/7.x/lorelei/svg?seed=${Math.random()}`;
                                        }
                                        
                                        if (!reply.text) reply.text = '...';
                                        if (!reply.time) reply.time = '刚刚';
                                    });
                                }
                            });
                        }

                        // Force at least one author reply for Linked Contact posts if not present
                        if (isLinkedPost && !hasAuthorReply && post.comments_list && post.comments_list.length > 0) {
                            // Try to find a comment to reply to, preferably one that isn't already full
                            const targetIndex = Math.floor(Math.random() * post.comments_list.length);
                            const targetComment = post.comments_list[targetIndex];
                            
                            if (!targetComment.replies) targetComment.replies = [];
                            
                            // Only add if not already replied by author
                            const alreadyReplied = targetComment.replies.some(r => r.user.name === post.user.name);
                            if (!alreadyReplied) {
                                targetComment.replies.push({
                                    id: Date.now() + Math.random(),
                                    user: post.user,
                                    text: '👀 感谢支持！', 
                                    time: '刚刚',
                                    likes: 0
                                });
                            }
                        }
                    }
                } // End for loop

                // Add to state
                forumState.posts = [...newPosts, ...forumState.posts];
                
                // Save
                saveForumData();

                // Render
                renderForum(false);
            } else {
                 throw new Error("AI生成的不是数组");
            }

        } catch (error) {
            console.error('Generate posts error:', error);
            alert('生成帖子失败: ' + error.message);
        } finally {
            const newBtn = document.getElementById('forum-generate-btn');
            if (newBtn) {
                newBtn.className = 'far fa-heart';
            }
        }
    }

    // --- Create Post Functions ---

    window.handleCreateMenuAction = function(action) {
        // Close menu
        const overlay = document.getElementById('create-menu-overlay');
        if (overlay) overlay.remove();

            if (action === 'post') {
                forumState.activeTab = 'create_post';
                forumState.createPostImages = []; // Reset images
                renderForum();
                return;
            }
            if (action === 'live') {
                window.startMyLiveRoom();
                return;
            }
            // Handle other actions later if needed
        };

    function renderCreatePostHeader() {
        return `
            <div class="forum-header">
                <div class="header-left">
                    <i class="fas fa-chevron-left" onclick="window.exitCreatePost()" style="font-size: 24px; cursor: pointer;"></i>
                </div>
                <div class="header-center">
                    <span style="font-size: 16px; font-weight: 700;">新帖子</span>
                </div>
                <div class="header-right">
                    <!-- Empty -->
                </div>
            </div>
        `;
    }

    function renderCreatePostPage() {
        return `
            <div class="create-post-container">
                <div class="create-post-image-area" onclick="document.getElementById('create-post-file-input').click()">
                    ${forumState.createPostImages && forumState.createPostImages.length > 0 ? 
                        `<img src="${forumState.createPostImages[0]}" class="create-post-preview-img">
                         ${forumState.createPostImages.length > 1 ? `<div class="create-post-multi-badge"><i class="fas fa-clone"></i></div>` : ''}` 
                        : `<div class="create-post-placeholder"><i class="fas fa-wifi" style="transform: rotate(45deg); font-size: 40px;"></i></div>`
                    }
                </div>
                <input type="file" id="create-post-file-input" multiple accept="image/*" style="display:none" onchange="window.handleCreatePostImageSelect(this)">
                
                <div class="create-post-input-section">
                    <textarea class="create-post-caption" id="create-post-caption" placeholder="添加说明文字..."></textarea>
                    
                    <div class="create-post-tags-row">
                        <div class="create-post-tag-btn"><img src="https://i.postimg.cc/kX0r0K66/无标题102_20260221012430.png" class="tag-icon"> 投票</div>
                        <div class="create-post-tag-btn"><img src="https://i.postimg.cc/rw56MsxD/无标题102_20260221012455.png" class="tag-icon"> 话题引子</div>
                    </div>
                </div>

                <div class="create-post-options-list">
                    <div class="create-post-option-item">
                        <img src="https://i.postimg.cc/s23YxHQZ/无标题102_20260221011255.png" class="option-icon">
                        <div class="option-label">添加音频</div>
                        <div class="option-right">
                            <span class="option-value">Crystal Chamber...</span>
                            <i class="fas fa-chevron-right option-arrow"></i>
                        </div>
                    </div>
                    <div class="create-post-option-item">
                        <img src="https://i.postimg.cc/13G091tr/无标题102_20260221011226.png" class="option-icon">
                        <div class="option-label">标记用户</div>
                        <div class="option-right"><i class="fas fa-chevron-right option-arrow"></i></div>
                    </div>
                    <div class="create-post-option-item">
                        <img src="https://i.postimg.cc/bvqxrVDn/无标题102_20260221011327.png" class="option-icon">
                        <div class="option-label">添加地点</div>
                        <div class="option-right"><i class="fas fa-chevron-right option-arrow"></i></div>
                    </div>
                    <div class="create-post-option-item">
                        <img src="https://i.postimg.cc/k57QGY6b/无标题102_20260221011354.png" class="option-icon">
                        <div class="option-content">
                            <div class="option-label">添加 AI 标签</div>
                            <div class="option-desc">对于由 AI 制作的特定逼真内容，我们要求为其添加标签。<span style="color: #0095f6;">详细了解</span></div>
                        </div>
                        <div class="option-right">
                            <label class="toggle-switch" style="transform: scale(0.8);">
                                <input type="checkbox">
                                <span class="slider round"></span>
                            </label>
                        </div>
                    </div>
                     <div class="create-post-option-item">
                        <img src="https://i.postimg.cc/R0v7hp6Q/无标题102_20260221011426.png" class="option-icon">
                        <div class="option-label">分享对象</div>
                        <div class="option-right">
                            <span class="option-value">所有人</span>
                            <i class="fas fa-chevron-right option-arrow"></i>
                        </div>
                    </div>
                     <div class="create-post-option-item">
                        <img src="https://i.postimg.cc/CKwG5rB4/无标题102_20260221011505.png" class="option-icon">
                        <div class="option-label">同时分享到...</div>
                        <div class="option-right">
                            <span class="option-value">关</span>
                            <i class="fas fa-chevron-right option-arrow"></i>
                        </div>
                    </div>
                     <div class="create-post-option-item">
                        <img src="https://i.postimg.cc/tg93JvZk/无标题102_20260221011539.png" class="option-icon">
                        <div class="option-label">更多选项</div>
                        <div class="option-right"><i class="fas fa-chevron-right option-arrow"></i></div>
                    </div>
                </div>

                <div class="create-post-footer-btn-container">
                    <button class="create-post-share-btn" onclick="window.handleSharePost()">分享</button>
                </div>
            </div>
        `;
    }

    window.exitCreatePost = function() {
        // Go back to profile since the button is on profile page
        forumState.activeTab = 'profile'; 
        renderForum();
    };

    window.handleCreatePostImageSelect = function(input) {
        if (input.files && input.files.length > 0) {
            forumState.createPostImages = [];
            let processed = 0;
            Array.from(input.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    try {
                        // Compress image to avoid QuotaExceededError
                        const compressed = await compressImage(e.target.result, 0.6, 800);
                        forumState.createPostImages.push(compressed);
                    } catch (err) {
                        console.error("Image compression failed", err);
                        forumState.createPostImages.push(e.target.result);
                    }
                    
                    processed++;
                    // If last one, re-render
                    if (processed === input.files.length) {
                        renderForum(false);
                    }
                };
                reader.readAsDataURL(file);
            });
        }
    };

    async function generateCommentsForPost(post) {
        // 1. Get Linked Contacts
        const linkedContactIds = forumState.settings.linkedContacts || [];
        const contacts = window.iphoneSimState.contacts || [];
        const profiles = forumState.settings.contactProfiles || {};
        
        const linkedContactsData = linkedContactIds.map(id => {
            const contact = contacts.find(c => c.id === id);
            if (!contact) return null;
            const profile = profiles[id] || {};
            return {
                name: profile.name || contact.remark || contact.name,
                persona: contact.persona || 'Friend',
                avatar: profile.avatar || contact.avatar
            };
        }).filter(c => c);

        const currentUserName = forumState.currentUser.bio || forumState.currentUser.username || '我';
        const forumWorldview = forumState.settings.forumWorldview || '';

        // Collect all images from this post (carousel support)
        const postImages = post.images && post.images.length > 0 ? post.images : (post.image ? [post.image] : []);
        // Only use base64 data-URIs for vision (not external URLs, limit to 3 to save tokens)
        const visionImages = postImages
            .filter(img => img && img.startsWith('data:image/') && !img.startsWith('data:image/svg'))
            .slice(0, 3);

        try {
            let settings = { url: '', key: '', model: '' };
            if (window.iphoneSimState) {
                if (window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url) {
                    settings = window.iphoneSimState.aiSettings;
                } else if (window.iphoneSimState.aiSettings2 && window.iphoneSimState.aiSettings2.url) {
                    settings = window.iphoneSimState.aiSettings2;
                }
            }

            if (!settings.url || !settings.key) {
                console.warn('AI settings missing for auto-comment');
                return;
            }

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            // Build user message content — use vision if images are available
            let userMessageContent;
            const textPrompt = `你是一个社交媒体评论生成器。
帖子文案: "${post.caption}"
世界观背景: ${forumWorldview}
发帖人: ${currentUserName}

必须评论的联系人 (全部都要出现):
${linkedContactsData.length > 0 ? linkedContactsData.map(c => `- ${c.name} (人设: ${c.persona})`).join('\n') : '无指定联系人，使用随机路人'}

额外要求: 再生成至少 10 条来自随机路人的评论，网名要真实有个性（可以包含日文、英文、emoji等）。
禁止以 "${currentUserName}" 或 "我" 作为评论者的名字。
评论内容必须结合帖子文案${visionImages.length > 0 ? '和图片内容' : ''}来生成，要生活化、真实。

只返回 JSON 数组，不要任何额外文字、不要Markdown代码块。每个对象只有两个字符串字段 name 和 text:
[{"name":"评论者名字","text":"评论内容"},{"name":"路人网名","text":"评论内容"}]`;

            if (visionImages.length > 0) {
                // Vision API format: content is an array of text + image_url objects
                userMessageContent = [
                    { type: 'text', text: textPrompt }
                ];
                visionImages.forEach(imgBase64 => {
                    userMessageContent.push({
                        type: 'image_url',
                        image_url: { url: imgBase64, detail: 'low' }
                    });
                });
            } else {
                // Plain text format
                userMessageContent = textPrompt;
            }

            // Pick a vision-capable model if needed
            let model = settings.model || 'gpt-3.5-turbo';
            if (visionImages.length > 0) {
                // If the configured model doesn't look vision-capable, try to upgrade
                if (!model.includes('vision') && !model.includes('gpt-4o') && !model.includes('claude-3') && !model.includes('gemini') && model === 'gpt-3.5-turbo') {
                    model = 'gpt-4o-mini'; // Cheapest vision model as fallback
                }
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.key },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: '你是一个社交媒体评论生成器，只返回JSON数组，每条评论尽量简短。' },
                        { role: 'user', content: userMessageContent }
                    ],
                    temperature: 0.8,
                    max_tokens: 3000
                })
            });

            const data = await response.json();
            let content = data.choices[0].message.content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
            // Extract JSON array from response
            const jsonStart = content.indexOf('[');
            const jsonEnd = content.lastIndexOf(']');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                content = content.substring(jsonStart, jsonEnd + 1);
            }
            // Repair common AI JSON mistakes
            content = content
                .replace(/:\s*true或false/gi, ': false')
                .replace(/:\s*true\s*或\s*false/gi, ': false')
                .replace(/:\s*True\b/g, ': true')
                .replace(/:\s*False\b/g, ': false')
                .replace(/:\s*None\b/g, ': null')
                .replace(/,(\s*[}\]])/g, '$1');

            // Fix unescaped control characters inside JSON strings (common AI mistake)
            // Replace actual newlines/tabs inside quoted strings with escaped versions
            content = content.replace(/"((?:[^"\\]|\\.)*)"/g, (match, inner) => {
                // Re-escape any raw newlines/carriage returns/tabs inside the string
                const fixed = inner
                    .replace(/\r\n/g, '\\n')
                    .replace(/\r/g, '\\n')
                    .replace(/\n/g, '\\n')
                    .replace(/\t/g, '\\t');
                return `"${fixed}"`;
            });

            console.log('[Forum] Comment JSON (after repair, full):', content);

            let comments;
            // Try standard parse first
            try {
                comments = JSON.parse(content);
            } catch (parseErr) {
                console.error('[Forum] Standard parse failed:', parseErr.message);
                // Fallback: extract each {...} object individually (handles truncated arrays / stray chars)
                try {
                    const items = [];
                    // Use a stack-based approach to handle nested braces in text values
                    let depth = 0;
                    let objStart = -1;
                    for (let i = 0; i < content.length; i++) {
                        const ch = content[i];
                        // Skip escaped characters and string content
                        if (ch === '"') {
                            i++; // Move past opening quote
                            while (i < content.length) {
                                if (content[i] === '\\') { i++; } // Skip escape
                                else if (content[i] === '"') { break; } // End of string
                                i++;
                            }
                            continue;
                        }
                        if (ch === '{') {
                            if (depth === 0) objStart = i;
                            depth++;
                        } else if (ch === '}') {
                            depth--;
                            if (depth === 0 && objStart !== -1) {
                                const objStr = content.substring(objStart, i + 1);
                                try {
                                    // Repair and parse individual object
                                    const fixed = objStr
                                        .replace(/:\s*true或false/gi, ': false')
                                        .replace(/:\s*True\b/g, ': true')
                                        .replace(/:\s*False\b/g, ': false')
                                        .replace(/:\s*None\b/g, ': null')
                                        .replace(/,(\s*})/g, '$1');
                                    items.push(JSON.parse(fixed));
                                } catch(e2) {
                                    console.warn('[Forum] Skipping malformed object:', objStr.substring(0, 100));
                                }
                                objStart = -1;
                            }
                        }
                    }
                    if (items.length > 0) {
                        comments = items;
                        console.log('[Forum] Recovered', items.length, 'comments via fallback extraction');
                    } else {
                        throw parseErr;
                    }
                } catch (e3) {
                    throw parseErr;
                }
            }

            // Add to post
            if (Array.isArray(comments)) {
                comments.forEach(c => {
                    if (!c.text || !c.name) return;
                    // Skip if impersonating current user
                    if (c.name === currentUserName || c.name === '我') return;
                    
                    // Determine avatar: check if commenter is a known linked contact (by name match)
                    const matchedContact = linkedContactsData.find(lc => lc.name === c.name);
                    let avatar = matchedContact
                        ? (matchedContact.avatar || 'https://api.dicebear.com/7.x/lorelei/svg?seed=' + encodeURIComponent(c.name))
                        : 'https://api.dicebear.com/7.x/lorelei/svg?seed=' + encodeURIComponent(c.name) + Math.random();
                    
                    post.comments_list.push({
                        id: Date.now() + Math.random(),
                        user: { name: c.name, avatar: avatar, verified: false },
                        text: c.text,
                        time: '刚刚',
                        likes: 0,
                        replies: []
                    });
                });
            }
            
            post.stats.comments = post.comments_list.length;
            saveForumData();
            
            // Only re-render if active tab is relevant
            if (forumState.activeTab === 'home' || forumState.activeTab === 'profile') {
                renderForum(false);
            }

        } catch (e) {
            console.error("Auto-comment failed", e);
        }
    }

    window.handleSharePost = async function() {
        const caption = document.getElementById('create-post-caption').value;
        const images = forumState.createPostImages;
        
        if ((!images || images.length === 0) && !caption) {
            alert('请添加图片或文字');
            return;
        }

        // Calculate stats based on followers
        const followers = forumState.currentUser.followers || 0;
        let likes = 0, commentsCount = 0, forwards = 0, shares = 0;

        if (followers > 0) {
            // Likes: 5% - 15%
            const likeRate = 0.05 + Math.random() * 0.1;
            likes = Math.max(0, Math.floor(followers * likeRate));
            
            // Comments: 0.5% - 2%
            const commentRate = 0.005 + Math.random() * 0.015;
            commentsCount = Math.max(0, Math.floor(followers * commentRate));
            
            // Forwards/Shares: 0.1% - 1%
            const shareRate = 0.001 + Math.random() * 0.009;
            forwards = Math.max(0, Math.floor(followers * shareRate));
            shares = Math.max(0, Math.floor(followers * shareRate));
        }

        const newPost = {
            id: Date.now(),
            user: { 
                ...forumState.currentUser,
                name: forumState.currentUser.bio || forumState.currentUser.username 
            },
            // Store all images in the images array; keep image for backward compat
            images: (images && images.length > 0) ? [...images] : [],
            image: (images && images.length > 0) ? images[0] : null, 
            caption: caption || '',
            time: '刚刚',
            stats: { likes, comments: commentsCount, forwards, shares, sends: shares },
            comments_list: []
        };
        
        forumState.posts.unshift(newPost);
        saveForumData();
        
        forumState.activeTab = 'home';
        renderForum();

        // Trigger comment generation
        generateCommentsForPost(newPost);

        // Trigger stranger DM generation
        generateStrangerDMs(newPost);
    };

    // --- Stranger DM Generation ---
    async function generateStrangerDMs(post) {
        try {
            let settings = { url: '', key: '', model: '' };
            if (window.iphoneSimState) {
                if (window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url) {
                    settings = window.iphoneSimState.aiSettings;
                } else if (window.iphoneSimState.aiSettings2 && window.iphoneSimState.aiSettings2.url) {
                    settings = window.iphoneSimState.aiSettings2;
                }
            }

            if (!settings.url || !settings.key) {
                console.warn('[Forum DM] No AI settings, skipping stranger DM generation');
                return;
            }

            const forumWorldview = forumState.settings.forumWorldview || '';
            const currentUserName = forumState.currentUser.bio || forumState.currentUser.username || '我';

            const prompt = `你是一个社交媒体模拟器。���户"${currentUserName}"刚刚在论坛发帖，帖子内容如下:
"${post.caption}"

请生成 2~3 条来自陌生网友的私信（DM）。这些陌生人看到了帖子后主动发来私信。
世界观背景: ${forumWorldview}

要求:
1. 每个陌生人的网名要真实有个性（可包含日文、英文、emoji等），不能叫"陌生人"或"网友123"这种格式。
2. 私信内容要结合帖子内容，风格多样（有赞美、有好奇、有搭讪、有表白、有商业合作等）。
3. 每个私信只发一条消息（简短，真实）。
4. 为每个陌生人生成一个随机头像seed（随机字符串）。

只返回 JSON 数组，格式如下（不要 Markdown 代码块）:
[
  {
    "name": "陌生人昵称",
    "username": "user_id_string",
    "avatarSeed": "随机字符串",
    "verified": false,
    "message": "私信内容"
  }
]`;

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + settings.key
                },
                body: JSON.stringify({
                    model: settings.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: '你是一个社交媒体模拟器，只返回JSON数组。' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.9
                })
            });

            if (!response.ok) throw new Error('DM generation API failed');

            const data = await response.json();
            let content = data.choices[0].message.content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
            const jsonStart = content.indexOf('[');
            const jsonEnd = content.lastIndexOf(']');
            if (jsonStart !== -1 && jsonEnd !== -1) content = content.substring(jsonStart, jsonEnd + 1);

            let dmList = JSON.parse(content);
            if (!Array.isArray(dmList)) return;

            const now = Date.now();
            dmList.forEach((dm, idx) => {
                if (!dm.name || !dm.message) return;

                const newMsgId = now + idx + 9000;
                const avatarUrl = 'https://api.dicebear.com/7.x/lorelei/svg?seed=' + encodeURIComponent(dm.avatarSeed || dm.name + Math.random());

                // Add to messages list (shown in DM tab)
                forumState.messages.unshift({
                    id: newMsgId,
                    name: dm.name,
                    username: dm.username || dm.name,
                    avatar: avatarUrl,
                    verified: !!dm.verified,
                    subtext: dm.message,
                    isStranger: true
                });

                // Pre-populate chat history so when opened it shows the message
                if (!forumState.chatHistory) forumState.chatHistory = {};
                forumState.chatHistory[newMsgId] = [
                    { type: 'time', text: '刚刚' },
                    { type: 'other', text: dm.message, avatar: avatarUrl }
                ];
            });

            // Persist messages
            saveMessages();

            // Re-render DM tab if it's currently visible
            if (forumState.activeTab === 'share') {
                renderForum(false);
            }

            // Show a subtle notification badge if on another tab
            const dmNavItem = document.querySelector('.forum-nav-bar .nav-item[data-tab="share"]');
            if (dmNavItem && forumState.activeTab !== 'share') {
                // Add red dot badge
                if (!dmNavItem.querySelector('.dm-badge')) {
                    const badge = document.createElement('div');
                    badge.className = 'dm-badge';
                    badge.style.cssText = 'position:absolute;top:6px;right:calc(50% - 22px);width:8px;height:8px;background:#ed4956;border-radius:50%;border:1.5px solid #fff;';
                    dmNavItem.style.position = 'relative';
                    dmNavItem.appendChild(badge);
                }
            }

        } catch (e) {
            console.error('[Forum DM] Stranger DM generation failed:', e);
        }
    }

    // --- DM Chat Helpers ---

    function sendChatMessage(text, user, chatBody) {
        const contentArea = document.getElementById('forum-content-area');
        const input = document.getElementById('forum-chat-input-field');

        // Add to state
        if (!forumState.chatHistory) forumState.chatHistory = {};
        if (!forumState.chatHistory[user.id]) forumState.chatHistory[user.id] = [];
        forumState.chatHistory[user.id].push({ type: 'me', text: text });

        // Persist
        saveChatHistory();

        // Add to DOM
        const msgHtml = `
            <div class="forum-chat-msg me">
                <div class="chat-bubble me">${text}</div>
            </div>
        `;
        if (chatBody) chatBody.insertAdjacentHTML('beforeend', msgHtml);
        if (contentArea) contentArea.scrollTop = contentArea.scrollHeight;
        if (input) input.value = '';
    }

    function saveChatHistory() {
        try {
            localStorage.setItem('forum_chatHistory', JSON.stringify(forumState.chatHistory));
        } catch (e) {
            console.warn('[Forum] Could not save chatHistory:', e.message);
        }
    }

    function saveMessages() {
        try {
            localStorage.setItem('forum_messages', JSON.stringify(forumState.messages));
        } catch (e) {
            console.warn('[Forum] Could not save messages:', e.message);
        }
    }

    async function generateDMChatReply(user, chatBody) {
        const aiReplyBtn = document.getElementById('forum-chat-ai-reply-btn');
        if (aiReplyBtn) {
            aiReplyBtn._isGenerating = true;
            aiReplyBtn.style.opacity = '0.4';
        }

        // Show typing indicator
        const typingId = 'dm-typing-' + Date.now();
        const typingHtml = `
            <div class="forum-chat-msg other" id="${typingId}">
                <img src="${user.avatar}" class="chat-msg-avatar">
                <div class="chat-bubble other" style="padding: 10px 14px;">
                    <span class="dm-typing-dot"></span>
                    <span class="dm-typing-dot"></span>
                    <span class="dm-typing-dot"></span>
                </div>
            </div>
        `;
        if (chatBody) chatBody.insertAdjacentHTML('beforeend', typingHtml);
        const contentArea = document.getElementById('forum-content-area');
        if (contentArea) contentArea.scrollTop = contentArea.scrollHeight;

        try {
            let settings = { url: '', key: '', model: '' };
            if (window.iphoneSimState) {
                if (window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url) settings = window.iphoneSimState.aiSettings;
                else if (window.iphoneSimState.aiSettings2 && window.iphoneSimState.aiSettings2.url) settings = window.iphoneSimState.aiSettings2;
            }
            if (!settings.url || !settings.key) throw new Error('No AI settings');

            const history = (forumState.chatHistory && forumState.chatHistory[user.id]) || [];
            const forumWorldview = forumState.settings.forumWorldview || '';

            // Build conversation context for AI
            const conversationLines = history.map(m => {
                if (m.type === 'me') return `我: ${m.text}`;
                if (m.type === 'other') return `${user.name}: ${m.text}`;
                return null;
            }).filter(Boolean).slice(-20).join('\n');

            // Try to find persona for this user
            let persona = '陌生人，刚看到对方帖子后主动发私信';
            let contactMatch = null;
            if (window.iphoneSimState && window.iphoneSimState.contacts) {
                contactMatch = window.iphoneSimState.contacts.find(c =>
                    c.name === user.name || c.remark === user.name
                );
                if (contactMatch && contactMatch.persona) persona = contactMatch.persona;
            }

            const systemPrompt = `你扮演一个正在和用户私信聊天的人。
角色名: ${user.name}
角色人设: ${persona}
世界观: ${forumWorldview}

规则:
- 你只能以"${user.name}"的身份说话，不要加名字前缀。
- 用真实自然的口语风格。
- 每次回复生成 1~3 条消息，以数组形式返回，每条是一个简短字符串。
- 可以有emoji，可以分多条发送，模拟真实的微信聊天节奏。
- 只返回JSON数组，不要任何其他内容。

示例: ["哇真的吗", "你也喜欢这个？！", "好巧🥹"]`;

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.key },
                body: JSON.stringify({
                    model: settings.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: `当前对话记录:\n${conversationLines}\n\n请以${user.name}的身份继续回复，只返回JSON数组。` }
                    ],
                    temperature: 0.9
                })
            });

            if (!response.ok) throw new Error('AI request failed');

            const data = await response.json();
            let content = data.choices[0].message.content.replace(/```json\n?/g, '').replace(/```/g, '').trim();
            const jStart = content.indexOf('['), jEnd = content.lastIndexOf(']');
            if (jStart !== -1 && jEnd !== -1) content = content.substring(jStart, jEnd + 1);

            let replyMessages = JSON.parse(content);
            if (!Array.isArray(replyMessages)) replyMessages = [String(replyMessages)];
            replyMessages = replyMessages.filter(m => typeof m === 'string' && m.trim()).slice(0, 4);

            // Remove typing indicator
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();

            // Deliver messages one by one with short delays
            if (!forumState.chatHistory[user.id]) forumState.chatHistory[user.id] = [];

            for (let i = 0; i < replyMessages.length; i++) {
                const msg = replyMessages[i];

                await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 600));

                forumState.chatHistory[user.id].push({ type: 'other', text: msg, avatar: user.avatar });

                const currentChatBody = document.querySelector('.forum-chat-body');
                if (currentChatBody) {
                    const msgHtml = `
                        <div class="forum-chat-msg other">
                            <img src="${user.avatar}" class="chat-msg-avatar">
                            <div class="chat-bubble other">${msg}</div>
                        </div>
                    `;
                    currentChatBody.insertAdjacentHTML('beforeend', msgHtml);
                    const ca = document.getElementById('forum-content-area');
                    if (ca) ca.scrollTop = ca.scrollHeight;
                }
            }

            // Update DM subtext preview
            const msgEntry = forumState.messages.find(m => m.id === user.id);
            if (msgEntry && replyMessages.length > 0) {
                msgEntry.subtext = replyMessages[replyMessages.length - 1];
            }

            // Persist
            saveChatHistory();
            saveMessages();

        } catch (e) {
            console.error('[Forum DM] AI reply failed:', e);
            const typingEl = document.getElementById(typingId);
            if (typingEl) typingEl.remove();
        } finally {
            if (aiReplyBtn) {
                aiReplyBtn._isGenerating = false;
                aiReplyBtn.style.opacity = '1';
            }
        }
    }

    // --- Carousel Touch Swipe Logic ---
    function setupCarousels() {
        document.querySelectorAll('.post-carousel-container').forEach(container => {
            // Avoid double-binding if already initialized
            if (container._carouselInit) return;
            container._carouselInit = true;

            const track = container.querySelector('.post-carousel-track');
            const dots = container.querySelectorAll('.post-carousel-dot');
            const counter = container.querySelector('.post-carousel-counter');
            const total = parseInt(container.dataset.total) || 1;

            if (!track || total <= 1) return;

            let current = 0;
            let startX = 0;
            let startY = 0;
            let isDragging = false;
            let isHorizontal = null; // null = undecided, true = horizontal, false = vertical
            let dragDelta = 0;

            function goTo(index) {
                current = Math.max(0, Math.min(total - 1, index));
                container.dataset.current = current;
                track.style.transition = 'transform 0.3s ease';
                track.style.transform = `translateX(-${current * 100}%)`;
                dots.forEach((d, i) => d.classList.toggle('active', i === current));
                if (counter) counter.textContent = `${current + 1}/${total}`;
            }

            // --- Touch events (non-passive so we can preventDefault for horizontal) ---
            container.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isDragging = true;
                isHorizontal = null;
                dragDelta = 0;
                track.style.transition = 'none';
            }, { passive: true });

            container.addEventListener('touchmove', (e) => {
                if (!isDragging) return;
                const dx = e.touches[0].clientX - startX;
                const dy = e.touches[0].clientY - startY;

                // Determine direction on first significant move
                if (isHorizontal === null) {
                    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                        isHorizontal = Math.abs(dx) > Math.abs(dy);
                    }
                }

                if (isHorizontal) {
                    // Prevent page scroll when swiping horizontally
                    e.preventDefault();
                    dragDelta = dx;
                    track.style.transform = `translateX(calc(-${current * 100}% + ${dragDelta}px))`;
                }
                // If vertical, do nothing — let native scroll handle it
            }, { passive: false }); // non-passive so we can call preventDefault

            container.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                isDragging = false;

                if (isHorizontal) {
                    if (dragDelta < -50 && current < total - 1) {
                        goTo(current + 1);
                    } else if (dragDelta > 50 && current > 0) {
                        goTo(current - 1);
                    } else {
                        goTo(current); // snap back
                    }
                }
                dragDelta = 0;
                isHorizontal = null;
            }, { passive: true });

            // --- Mouse events (desktop) ---
            container.addEventListener('mousedown', (e) => {
                startX = e.clientX;
                isDragging = true;
                isHorizontal = true;
                dragDelta = 0;
                track.style.transition = 'none';
                e.preventDefault();
            });

            const onMouseMove = (e) => {
                if (!isDragging) return;
                dragDelta = e.clientX - startX;
                track.style.transform = `translateX(calc(-${current * 100}% + ${dragDelta}px))`;
            };

            const onMouseUp = () => {
                if (!isDragging) return;
                isDragging = false;
                if (dragDelta < -50 && current < total - 1) {
                    goTo(current + 1);
                } else if (dragDelta > 50 && current > 0) {
                    goTo(current - 1);
                } else {
                    goTo(current);
                }
                dragDelta = 0;
            };

            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        });
    }

    window.generateForumLives = async function() {
        const btn = document.querySelector('.forum-live-header-icon');
        if (btn && btn.classList.contains('generating')) return;
        
        if (btn) {
            btn.classList.add('generating');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size: 20px; color: #000;"></i>';
        }

        try {
            let settings = { url: '', key: '', model: '' };
            if (window.iphoneSimState) {
                if (window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url) {
                    settings = window.iphoneSimState.aiSettings;
                } else if (window.iphoneSimState.aiSettings2 && window.iphoneSimState.aiSettings2.url) {
                    settings = window.iphoneSimState.aiSettings2;
                }
            }

            if (!settings.url || !settings.key) {
                alert('请先在设置中配置AI接口信息');
                throw new Error('No AI settings');
            }

            const linkedContactIds = forumState.settings.linkedContacts || [];
            const contacts = window.iphoneSimState.contacts || [];
            const profiles = forumState.settings.contactProfiles || {};
            
            const linkedContactsData = linkedContactIds.map(id => {
                const contact = contacts.find(c => c.id === id);
                if (!contact) return null;
                const profile = profiles[id] || {};
                return {
                    id: contact.id,
                    name: profile.name || contact.remark || contact.name,
                    persona: contact.persona || '普通网友'
                };
            }).filter(c => c);

            const forumWorldview = forumState.settings.forumWorldview || '';

            let contactPrompt = '';
            if (linkedContactsData.length > 0) {
                const charList = linkedContactsData.map(c => `- ${c.name} (人设: ${c.persona})`).join('\\n');
                contactPrompt = `必须至少包含以下联系人中的一个作为主播:\\n${charList}\\n`;
            }

            const prompt = `
请为社交论坛生成一组直播列表。
世界观背景: ${forumWorldview}

要求:
1. 生成总数不超过 12 个直播。
${contactPrompt}
2. 返回纯JSON数组。
3. 每个对象包含:
   - category: 直播分类 (例如: Music, Gaming, Chatting, Design, Travel, Dance, Art 等)
   - title: 直播标题 (吸引人，符合主播人设或分类)
   - username: 主播名字 (如果是联系人，必须严格使用提供的 'Name'，禁止从人设中提取其他名字；否则生成一个真实的网名)
   - viewers: 观看人数 (例如 "1.2k", "856", "10w")
   - type: "food", "travel", "mood", "hobby", "daily", "pet", "scenery" 中的一个，用于生成背景图
   - image_description: 直播封面画面描述(英文，Stable Diffusion格式标签)
   - action_desc: 详细描述主播当前所在的画面、正在做什么以及说的话 (例如: "坐在洒满阳光的卧室里，一边弹奏吉他一边微笑着说：'这首新歌送给你们'。")
   - initial_comments: 一个数组，包含3-5条当前直播间里正在发送的评论对象，每个对象包含 { username: "发送者名字", content: "评论内容" }

只返回JSON数组，不要Markdown标记。
`;

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + settings.key
                },
                body: JSON.stringify({
                    model: settings.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: '你是模拟社交网络数据的生成器。只返回JSON数据。' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            const data = await response.json();
            let content = data.choices[0].message.content;
            
            content = content.replace(/```json\n?/g, '').replace(/```/g, '').trim();

            let newLives = [];
            try {
                newLives = JSON.parse(content);
            } catch (e) {
                console.error("JSON parse failed", content);
                throw new Error("AI生成的数据格式有误");
            }

            if (!Array.isArray(newLives)) {
                 throw new Error("AI生成的不是数组");
            }

            newLives = newLives.slice(0, 12);

            const existingImages = [
                'https://i.postimg.cc/fymR94qp/IMG-6099.jpg',
                'https://i.postimg.cc/kGKgbrY0/IMG-6100.jpg',
                'https://i.postimg.cc/3RPwNr1v/IMG-6101.jpg',
                'https://i.postimg.cc/bJKvrYgd/IMG-6102.jpg',
                'https://i.postimg.cc/NMW0FGDJ/IMG-6103.jpg',
                'https://i.postimg.cc/C1Z1wnGx/IMG-6104.jpg',
                'https://i.postimg.cc/zGj37rDZ/IMG-6105.jpg',
                'https://i.postimg.cc/zG5VTBrw/IMG-6106.jpg',
                'https://i.postimg.cc/0yxb7QsY/IMG-6107.jpg',
                'https://i.postimg.cc/K8FRtz2r/IMG-6108.jpg',
                'https://i.postimg.cc/fRZJYLN9/IMG-6109.jpg',
                'https://i.postimg.cc/x1YcLC2q/IMG-6110.jpg'
            ];

            newLives.forEach((live, index) => {
                // only use default background if none provided by the AI-generated data
                if (!live.image) {
                    live.image = existingImages[index % existingImages.length];
                }
            });

            forumState.liveStreams = newLives;
            localStorage.setItem('forum_liveStreams', JSON.stringify(forumState.liveStreams));

            // 1. Clear all old live room caches so entering a room shows fresh content
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('forum_live_state_')) keysToRemove.push(k);
            }
            keysToRemove.forEach(k => localStorage.removeItem(k));

            // 2. Sync all new hosts into the leaderboard (with 0 value if not present)
            let lb = JSON.parse(localStorage.getItem('forum_leaderboard') || '{"hosts":[]}');
            if (!lb.hosts) lb.hosts = [];
            newLives.forEach(live => {
                const hostName = live.username || '';
                if (!hostName) return;
                const exists = lb.hosts.find(h => h.name === hostName);
                if (!exists) {
                    lb.hosts.push({
                        name: hostName,
                        avatar: `https://api.dicebear.com/7.x/lorelei/svg?seed=${encodeURIComponent(hostName)}`,
                        totalValue: 0
                    });
                }
            });
            lb.hosts.sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0));
            localStorage.setItem('forum_leaderboard', JSON.stringify(lb));

            if (forumState.activeTab === 'video') {
                renderForum(false);
            }

        } catch (error) {
            console.error('Generate lives error:', error);
            alert('生成直播失败: ' + error.message);
        } finally {
            if (btn) {
                btn.classList.remove('generating');
                btn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                `;
            }
        }
    };

    window.initForumApp = initForum;
    if (window.appInitFunctions) {
        window.appInitFunctions.push(initForum);
    }

    // AI Reply Generation Function
    async function generateAIReply(post, userComment, context) {
        if (!post || !userComment) return;

        // Determine the persona info
        let authorName = post.user.name;
        let authorPersona = "普通网友";
        let authorBio = "";
        let relationshipContext = "";
        
        // If it's a linked contact, get more specific persona details
        if (post.userId) {
             const contacts = window.iphoneSimState.contacts || [];
             const contact = contacts.find(c => c.id === post.userId);
             if (contact) {
                 const profiles = forumState.settings.contactProfiles || {};
                 const profile = profiles[post.userId] || {};
                 authorPersona = contact.persona || '普通网友';
                 authorName = profile.name || contact.remark || contact.name;
                 authorBio = profile.bio || '';
                 
                 const isUserComment = userComment.user.name === forumState.currentUser.bio || 
                                       userComment.user.name === forumState.currentUser.username || 
                                       userComment.user.name === 'Me';
                 if (profile.knowsUser && contact.persona && userComment && userComment.user && isUserComment) {
                     const realName = window.iphoneSimState?.userProfile?.name || '我';
                     let userPersonaText = '';
                     if (contact.userPersonaId && window.iphoneSimState.userPersonas) {
                         const up = window.iphoneSimState.userPersonas.find(p => p.id === contact.userPersonaId);
                         if (up && up.aiPrompt) {
                             userPersonaText = `\n此外，关于用户(我)的设定如下：'${up.aiPrompt}'。`;
                         }
                     }
                     relationshipContext = `\n请注意：评论者网名 [${userComment.user.name}] 其实是现实中你认识的 [${realName}]。你们之间有特殊关系，在以下人设中有描述：'${contact.persona}'。${userPersonaText}\n请综合以上人设，第一条来自帖子作者本人的回复必须严格符合这段关系所定义的语气、口吻和亲密度，明确表现出你认出了他/她。不要像回复陌生网友一样。`;
                 }
             }
        }

        const systemPrompt = `你是一个模拟社交媒体评论生成器。
当前帖子内容: "${post.caption}"
帖子作者: "${authorName}" (人设: ${authorPersona}, Bio: ${authorBio})
用户评论: "${userComment.text}"${relationshipContext}

任务: 生成 4 条针对用户评论的回复。
1. 第一条必须来自帖子作者本人 (${authorName})，必须符合其人设语气。
2. 后三条来自随机路人(网友)，语气风格要多样化（有的赞同，有的调侃，有的仅仅是吃瓜）。
3. **重要: 为每个路人生成一个真实、独特、像活人的网名 (username)，不要使用"网友123"这种格式。网名可以包含日文、英文、emoji等。**

重要: 请严格只返回一个 JSON 数组，不要包含任何其他说明文字或 Markdown 标记。
示例格式:
[
  { "isAuthor": true, "text": "作者回复内容" },
  { "isAuthor": false, "text": "路人1回复", "username": "Sakura_chan🌸" },
  { "isAuthor": false, "text": "路人2回复", "username": "TokyoWalker" },
  { "isAuthor": false, "text": "路人3回复", "username": "猫猫大好き" }
]`;

        // Set Generating State
        forumState.isGeneratingReply = true;
        renderCommentsOverlay(post.comments_list, post); // Update UI to show indicator

        try {
            // Get AI settings
            let settings = { url: '', key: '', model: '' };
            if (window.iphoneSimState) {
                if (window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.url) {
                    settings = window.iphoneSimState.aiSettings;
                } else if (window.iphoneSimState.aiSettings2 && window.iphoneSimState.aiSettings2.url) {
                    settings = window.iphoneSimState.aiSettings2;
                }
            }

            if (!settings.url || !settings.key) {
                console.warn('AI settings not found, skipping reply generation');
                return;
            }

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + settings.key
                },
                body: JSON.stringify({
                    model: settings.model || 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: 'You are a backend API that returns purely JSON arrays.' },
                        { role: 'user', content: systemPrompt }
                    ],
                    temperature: 0.8
                })
            });

            if (!response.ok) {
                throw new Error('AI request failed');
            }

            const data = await response.json();
            let content = data.choices[0].message.content.trim();
            // Remove code blocks if present
            content = content.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

            let repliesData = [];
            try {
                // Attempt to parse
                const jsonStart = content.indexOf('[');
                const jsonEnd = content.lastIndexOf(']');
                if (jsonStart !== -1 && jsonEnd !== -1) {
                    content = content.substring(jsonStart, jsonEnd + 1);
                    repliesData = JSON.parse(content);
                } else {
                    // Fallback try direct parse
                    repliesData = JSON.parse(content);
                }
            } catch (e) {
                console.error("Failed to parse AI replies", content);
                // Fallback: If parsing fails, use the raw text as a single author reply
                repliesData = [{ isAuthor: true, text: content }];
            }

            // Ensure it's an array
            if (!Array.isArray(repliesData)) {
                repliesData = [repliesData];
            }

            if (repliesData.length > 0) {
                repliesData.forEach((replyItem, index) => {
                    const isAuthor = replyItem.isAuthor;
                    
                    let replyUser;
                    if (isAuthor) {
                        replyUser = post.user; // Post Author
                    } else {
                        // Generate random stranger with AI provided username or fallback
                        const randomNames = ['Momo', 'Yuki', 'Kaito', 'Rin', 'Haru', 'Sora', 'Hina', 'Rio', 'Aoi', 'Toma'];
                        const fallbackName = randomNames[Math.floor(Math.random() * randomNames.length)] + '_' + Math.floor(Math.random() * 100);
                        
                        replyUser = {
                            name: replyItem.username || fallbackName,
                            avatar: `https://api.dicebear.com/7.x/lorelei/svg?seed=${Math.random()}`,
                            verified: false
                        };
                    }

                    const replyComment = {
                        id: Date.now() + index,
                        user: replyUser,
                        text: replyItem.text,
                        time: '刚刚',
                        likes: 0
                    };

                    // Add reply to state
                    if (context && context.type === 'reply' && context.parentComment) {
                        // Reply to a comment -> add to parent's replies
                        if (!context.parentComment.replies) context.parentComment.replies = [];
                        context.parentComment.replies.push(replyComment);
                    } else {
                        // Direct comment -> add to the userComment's replies
                        // Need to find userComment in post list
                        const targetComment = post.comments_list.find(c => c.id === userComment.id);
                        if (targetComment) {
                            if (!targetComment.replies) targetComment.replies = [];
                            targetComment.replies.push(replyComment);
                        } else {
                             post.comments_list.push(replyComment); // Should not happen usually
                        }
                    }
                    
                    post.stats.comments++;

                    // sync the AI-generated reply back to chat history if post is from a contact
                    if (post.userId) {
                        const prefix = (context && context.type === 'reply') ? '[论坛评论回复]:' : '[论坛自动评论]:';
                        window.syncForumEventToChat(post.userId, `${prefix} "${replyItem.text}"`, 'system');
                    }
                });

                saveForumData();
            }

        } catch (error) {
            console.error('AI Reply Error:', error);
        } finally {
            forumState.isGeneratingReply = false;
            // Only re-render if the overlay is still open and showing THIS post
             const overlay = document.getElementById('comments-overlay');
             if (overlay && overlay.classList.contains('active')) {
                 renderCommentsOverlay(post.comments_list, post);
             }
        }
    }
})();
