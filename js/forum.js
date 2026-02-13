// 仿 Instagram 论坛应用逻辑 (UI Update)

(function() {
    const forumState = {
        activeTab: 'home', // home, video, share, search, profile
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
        profileActiveTab: 'posts', // 'posts' or 'tagged'
        messages: [
            { id: 1, name: '中沢 元紀', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nakazawa', verified: true, subtext: '轻触即可聊天' }
        ],
        dmNotes: [
             { id: 1, name: '你的便签', avatar: '', isMe: true, note: '分享便签', subtext: '位置共享已关闭' },
             { id: 2, name: '地图', avatar: 'https://placehold.co/100x100/87CEEB/ffffff?text=Map', isMap: true, note: '全新' }
        ]
    };

    function initForum() {
        const app = document.getElementById('forum-app');
        if (!app) return;

        // Sync current user with global state if available
        // if (window.iphoneSimState && window.iphoneSimState.userProfile) {
        //     forumState.currentUser.avatar = window.iphoneSimState.userProfile.avatar;
        //     // forumState.currentUser.name = window.iphoneSimState.userProfile.name; // Keep internal name logic or override
        // }

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
        let contentHtml = '';
        let headerHtml = renderHeader(); // Default header

        switch(forumState.activeTab) {
            case 'home':
                contentHtml = renderHomeTab();
                break;
            case 'share': // Using share tab for the "Middle Button" (Search/Messages/Map) view requested
                headerHtml = renderDMHeader(); // Special header for this view
                contentHtml = renderDMTab();
                break;
            case 'profile':
                headerHtml = renderProfileHeader();
                contentHtml = renderProfileTab();
                break;
            case 'edit_profile':
                headerHtml = renderEditProfileHeader();
                contentHtml = renderEditProfile();
                break;
            default:
                contentHtml = renderHomeTab();
        }

        const showNav = forumState.activeTab !== 'edit_profile';

        app.innerHTML = `
            <div class="forum-screen">
                ${headerHtml}
                <div class="forum-content ${animate ? 'animate-fade' : ''} ${showNav ? 'has-nav' : ''}" id="forum-content-area">
                    ${contentHtml}
                </div>
                ${showNav ? renderBottomNav() : ''}
            </div>
        `;

        setupTabListeners();
    }

    // --- Comments Logic ---

    const mockComments = [
        {
            id: 1,
            user: { name: 'katsumi_hyodo_official', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=katsumi', verified: true },
            text: '心の底からおめでとう！！！！！\n幸せにな☺',
            time: '2天',
            likes: 7357,
            replies: [
                {
                    id: 101,
                    user: { name: 'soccer.poke050607', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=soccer', verified: false },
                    text: '@katsumi_hyodo_official わー！ 絵文字使ってるのかわいいー！',
                    time: '2天',
                    likes: 15
                }
            ]
        },
        {
            id: 2,
            user: { name: 'taisei_kido_', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taisei', verified: true },
            text: '楓珠おめでとう！ お幸せに！ 👏',
            time: '2天',
            likes: 2048,
            replies: []
        },
        {
            id: 3,
            user: { name: 'harunaiikubo_official', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=haruna', verified: true },
            text: 'おめでとうー！ 👏🏻',
            time: '2天',
            likes: 287,
            replies: []
        },
        {
            id: 4,
            user: { name: 'oshiro_maeda', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=oshiro', verified: false },
            text: 'おめ🔥🔥🔥',
            time: '2天',
            likes: 663,
            replies: []
        },
        {
             id: 5,
            user: { name: 'm.i.b___730', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mib', verified: false },
            text: 'また顔似てる夫婦が増えた👏❤️❤️',
            time: '2天',
            likes: 5623,
            replies: []
        }
    ];

    function renderCommentsOverlay() {
        // Remove existing overlay if any
        const existing = document.getElementById('comments-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'comments-overlay';
        overlay.className = 'comments-overlay';
        
        const commentsListHtml = mockComments.map(comment => {
            const hasReplies = comment.replies && comment.replies.length > 0;
            const repliesHtml = hasReplies ? `
                <div class="view-replies-btn" onclick="toggleReplies(${comment.id}, this)">
                    <div class="view-replies-line"></div>
                    <span class="view-replies-text">查看另 ${comment.replies.length} 条回复</span>
                </div>
                <div class="replies-list" id="replies-${comment.id}">
                    ${comment.replies.map(reply => `
                        <div class="comment-item reply-item">
                             <img src="${reply.user.avatar}" class="comment-avatar reply-avatar">
                             <div class="comment-content">
                                <div class="comment-row-1">
                                    <span class="comment-username">${reply.user.name}</span>
                                    ${reply.user.verified ? '<i class="fas fa-check-circle comment-verified"></i>' : ''}
                                    <span class="comment-time">${reply.time}</span>
                                </div>
                                <div class="comment-text">${reply.text}</div>
                                <div class="comment-actions">
                                    <span class="comment-action-btn">回复</span>
                                    <span class="comment-action-btn">查看翻译</span>
                                </div>
                             </div>
                             <div class="comment-like-container">
                                <i class="far fa-heart comment-like-icon"></i>
                                <span class="comment-like-count">${reply.likes}</span>
                             </div>
                        </div>
                    `).join('')}
                </div>
            ` : '';

            return `
                <div class="comment-item">
                    <img src="${comment.user.avatar}" class="comment-avatar">
                    <div class="comment-content">
                        <div class="comment-row-1">
                            <span class="comment-username">${comment.user.name}</span>
                            ${comment.user.verified ? '<i class="fas fa-check-circle comment-verified"></i>' : ''}
                            <span class="comment-time">${comment.time}</span>
                        </div>
                        <div class="comment-text">${comment.text}</div>
                        <div class="comment-actions">
                            <span class="comment-action-btn">回复</span>
                            <span class="comment-action-btn">查看翻译</span>
                        </div>
                        ${repliesHtml}
                    </div>
                    <div class="comment-like-container">
                        <i class="far fa-heart comment-like-icon"></i>
                        <span class="comment-like-count">${comment.likes}</span>
                    </div>
                </div>
            `;
        }).join('');

        overlay.innerHTML = `
            <div class="comments-drag-handle-area" id="comments-drag-area">
                <div class="comments-drag-handle"></div>
            </div>
            <div class="comments-header">
                <div class="comments-header-title">评论</div>
                <div class="comments-header-close" id="comments-close-btn"><i class="far fa-paper-plane" style="transform: rotate(15deg);"></i></div>
            </div>
            <div class="comments-scroll-area">
                ${commentsListHtml}
            </div>
            <div class="comments-input-area">
                <div class="emoji-bar">
                    <span>❤️</span> <span>🙌</span> <span>🔥</span> <span>👏</span> <span>😥</span> <span>😍</span> <span>😮</span> <span>😂</span>
                </div>
                <div class="comment-input-box">
                    <img src="${forumState.currentUser.avatar}" class="comment-user-avatar-small">
                    <input type="text" class="comment-input" placeholder="为 ${forumState.currentUser.bio} 添加评论...">
                    <div class="gif-icon">GIF</div>
                </div>
            </div>
        `;

        document.getElementById('forum-app').appendChild(overlay);

        // Event Listeners
        setTimeout(() => overlay.classList.add('active'), 10);

        document.getElementById('comments-close-btn').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        });

        const dragArea = document.getElementById('comments-drag-area');
        dragArea.addEventListener('click', () => {
            overlay.classList.toggle('expanded');
        });
    }

    // Expose toggleReplies to global scope since it's called inline
    window.toggleReplies = function(id, btn) {
        const replies = document.getElementById(`replies-${id}`);
        if (replies) {
             const isHidden = replies.style.display === 'none' || !replies.style.display;
             const textSpan = btn.querySelector('.view-replies-text');
             
             if (isHidden) {
                 replies.style.display = 'block';
                 if (textSpan) {
                     if (!btn.dataset.originalText) {
                         btn.dataset.originalText = textSpan.textContent;
                     }
                     textSpan.textContent = '隐藏回复';
                 }
             } else {
                 replies.style.display = 'none';
                 if (textSpan && btn.dataset.originalText) {
                     textSpan.textContent = btn.dataset.originalText;
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

    function renderHeader() {
        // Default Home Header
        return `
            <div class="forum-header">
                <div class="header-left">
                    <i class="fas fa-plus" id="forum-back-btn" style="font-size: 26px; cursor: pointer;"></i>
                </div>
                <div class="header-center">
                    <span class="instagram-logo">Instagram</span>
                    <i class="fas fa-chevron-down" style="font-size: 12px; margin-left: 5px;"></i>
                </div>
                <div class="header-right">
                    <i class="far fa-heart" style="font-size: 24px;"></i>
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
                    <i class="fas fa-plus" style="font-size: 26px;"></i>
                </div>
                <div class="header-center">
                    <span style="font-weight: 700; font-size: 16px;">${forumState.currentUser.username}</span>
                    <i class="fas fa-chevron-down header-title-arrow"></i>
                </div>
                <div class="header-right">
                    <i class="fas fa-at" style="font-size: 24px;"></i> <!-- Threads icon approx -->
                    <i class="fas fa-bars" style="font-size: 24px;"></i>
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

    function renderDMTab() {
        // Search bar + Notes + Messages List
        return `
            <div class="dm-notes-container">
                ${forumState.dmNotes.map(renderDMNote).join('')}
            </div>

            <div class="dm-section-header">
                <div class="dm-section-title">消息 <i class="fas fa-bell-slash" style="font-size: 14px; margin-left: 5px; color: #000;"></i></div>
                <div class="dm-section-action">陌生消息</div>
            </div>

            <div class="dm-messages-list">
                ${forumState.messages.map(renderDMMessage).join('')}
            </div>
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
                        <input type="text" id="edit-name-input" value="${user.bio}" placeholder="姓名">
                    </div>
                    <div class="edit-form-row">
                        <label>账号</label>
                        <input type="text" id="edit-username-input" value="${user.username}" placeholder="账号">
                    </div>
                    <div class="edit-form-row">
                        <label>人称代词</label>
                        <input type="text" value="人称代词" placeholder="人称代词" readonly style="color: #8e8e8e;">
                    </div>
                    <div class="edit-form-row">
                        <label>个性签名</label>
                         <input type="text" id="edit-signature-input" value="${user.signature || ''}" placeholder="个性签名">
                    </div>
                    <div class="edit-form-row">
                        <label>链接</label>
                        <div class="edit-row-right">添加链接</div>
                    </div>
                    <div class="edit-form-row">
                        <label>横幅</label>
                        <div class="edit-row-right">添加横幅 <i class="fas fa-chevron-right" style="font-size: 12px; margin-left: auto;"></i></div>
                    </div>
                     <div class="edit-form-row">
                        <label>音乐</label>
                        <div class="edit-row-right">在主页添加音乐 <i class="fas fa-chevron-right" style="font-size: 12px; margin-left: auto;"></i></div>
                    </div>
                     <div class="edit-form-row">
                        <label>性别</label>
                        <div class="edit-row-right">性别 <i class="fas fa-chevron-right" style="font-size: 12px; margin-left: auto;"></i></div>
                    </div>
                </div>

                <div class="edit-profile-links">
                    <div class="edit-link-item">切换为专业账户</div>
                    <div class="edit-link-item">个人信息设置</div>
                </div>
            </div>
        `;
    }

    function renderProfileTab() {
        const user = forumState.currentUser;
        const activeTab = forumState.profileActiveTab || 'posts';
        
        let content = '';
        if (activeTab === 'posts') {
            content = `
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; padding-bottom: 2px;">
                     <!-- Placeholder grid for posts -->
                     <div style="aspect-ratio: 1; background-color: #efefef;"></div>
                     <div style="aspect-ratio: 1; background-color: #efefef;"></div>
                     <div style="aspect-ratio: 1; background-color: #efefef;"></div>
                </div>
                <div style="padding: 40px; text-align: center; color: #8e8e8e; font-size: 14px;">
                    暂无帖子
                </div>
            `;
        } else {
            content = `
                <div style="padding: 40px; text-align: center; color: #8e8e8e; font-size: 14px;">
                    <div style="font-size: 40px; margin-bottom: 10px;"><i class="far fa-play-circle"></i></div>
                    暂无视频
                </div>
            `;
        }

        return `
            <div class="profile-container">
                <div class="profile-header-section">
                    <div class="profile-top-row">
                        <div class="profile-avatar-wrapper">
                            <img src="${user.avatar}" class="profile-avatar-large">
                            <div class="story-add-icon" style="bottom: 0; right: 20px; width: 24px; height: 24px; font-size: 12px; border: 2px solid #fff;">
                                <i class="fas fa-plus"></i>
                            </div>
                        </div>
                        <div class="profile-right-column">
                            <div class="profile-username-large">${user.bio}</div>
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <span class="stat-num">${user.posts}</span>
                                    <span class="stat-label">帖子</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-num">${user.followers}</span>
                                    <span class="stat-label">粉丝</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-num">${user.following}</span>
                                    <span class="stat-label">关注</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="profile-bio-section">
                        <div class="profile-bio-text">${user.signature || ''}</div>
                    </div>

                    <div class="profile-actions-row">
                        <button class="profile-btn">编辑主页</button>
                        <button class="profile-btn">分享主页</button>
                        <button class="profile-btn-icon"><i class="fas fa-user-plus"></i></button>
                    </div>
                </div>
                

                <div class="profile-tabs-bar">
                    <div class="profile-tab ${activeTab === 'posts' ? 'active' : ''}" id="profile-tab-posts">
                        <i class="fas fa-th"></i>
                    </div>
                    <div class="profile-tab ${activeTab === 'tagged' ? 'active' : ''}" id="profile-tab-tagged">
                        <i class="fas fa-play-circle" style="font-size: 24px;"></i>
                    </div>
                </div>
                
                ${content}
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
        return `
            <div class="dm-user-row">
                <img src="${msg.avatar}" class="dm-user-avatar">
                <div class="dm-user-info">
                    <div class="dm-user-name">
                        ${msg.name} 
                        ${msg.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                    </div>
                    <div class="dm-user-sub">${msg.subtext}</div>
                </div>
            </div>
        `;
    }

    function renderPost(post) {
        const formatNum = (n) => n.toLocaleString();

        return `
            <div class="post-item">
                <div class="post-header">
                    <div class="post-user-info-wrapper">
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
                        <i class="fas fa-ellipsis-h" style="font-size: 14px; color: #000;"></i>
                    </div>
                </div>
                
                <div class="post-image-container">
                    <img src="${post.image}" class="post-image">
                    ${post.stats.count ? `<div class="image-overlay-count">${post.stats.count}</div>` : ''}
                </div>
                
                <div class="post-actions-bar">
                    <div class="actions-left-group">
                        <div class="action-item like-btn" data-id="${post.id}">
                            <i class="${post.liked ? 'fas fa-heart' : 'far fa-heart'}" style="${post.liked ? 'color: #ed4956;' : ''}"></i>
                            <span class="action-count">${formatNum(post.stats.likes)}</span>
                        </div>
                        <div class="action-item comment-btn" data-id="${post.id}">
                            <i class="far fa-comment"></i>
                            <span class="action-count">${post.stats.comments}</span>
                        </div>
                        <div class="action-item">
                            <i class="far fa-paper-plane"></i>
                            <span class="action-count">${post.stats.shares}</span>
                        </div>
                    </div>
                    <div class="actions-right-group">
                        <i class="far fa-bookmark"></i>
                    </div>
                </div>

                <div class="post-info-section">
                    <div class="post-caption-row">
                        <span class="post-caption-username">${post.user.name}</span>
                        <span class="post-caption-content">${post.caption}</span>
                    </div>
                    <div class="post-meta-row">
                        <span class="post-time">${post.time}</span>
                        <span class="meta-dot">·</span>
                        <span class="post-translation">${post.translation}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderBottomNav() {
        const activeTab = forumState.activeTab;
        const userAvatar = forumState.currentUser.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'; // Fallback

        return `
            <div class="forum-nav-bar">
                <div class="nav-item ${activeTab === 'home' ? 'active' : ''}" data-tab="home">
                    <i class="${activeTab === 'home' ? 'fas fa-home' : 'fas fa-home'}"></i>
                </div>
                <div class="nav-item ${activeTab === 'video' ? 'active' : ''}" data-tab="video">
                    <i class="${activeTab === 'video' ? 'fas fa-play-circle' : 'far fa-play-circle'}"></i>
                </div>
                <div class="nav-item ${activeTab === 'share' ? 'active' : ''}" data-tab="share">
                    <i class="${activeTab === 'share' ? 'fas fa-paper-plane' : 'far fa-paper-plane'}"></i>
                </div>
                 <div class="nav-item ${activeTab === 'explore' ? 'active' : ''}" data-tab="explore">
                    <i class="fas fa-search" style="${activeTab === 'explore' ? 'font-weight: 900;' : ''}"></i>
                </div>
                <div class="nav-item ${activeTab === 'profile' ? 'active' : ''}" data-tab="profile">
                    <i class="${activeTab === 'profile' ? 'fas fa-user-circle' : 'far fa-user-circle'}" style="font-size: 26px;"></i>
                </div>
            </div>
        `;
    }

    function setupTabListeners() {
        document.querySelectorAll('.forum-nav-bar .nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tab = item.dataset.tab;
                if (tab) {
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

        const editProfileBtn = document.querySelector('.profile-btn'); // Assumes first one is Edit Profile
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                forumState.activeTab = 'edit_profile';
                renderForum();
            });
        }

        const editBackBtn = document.getElementById('edit-profile-back');
        if (editBackBtn) {
            editBackBtn.addEventListener('click', () => {
                // Save changes logic
                const nameInput = document.getElementById('edit-name-input');
                const usernameInput = document.getElementById('edit-username-input');
                const signatureInput = document.getElementById('edit-signature-input');

                if (nameInput) forumState.currentUser.bio = nameInput.value;
                if (usernameInput) forumState.currentUser.username = usernameInput.value;
                if (signatureInput) forumState.currentUser.signature = signatureInput.value;

                // Save to localStorage
                localStorage.setItem('forum_currentUser', JSON.stringify(forumState.currentUser));

                forumState.activeTab = 'profile';
                renderForum();
            });
        }

        const tabPosts = document.getElementById('profile-tab-posts');
        const tabTagged = document.getElementById('profile-tab-tagged');

        if (tabPosts) {
            tabPosts.addEventListener('click', () => {
                forumState.profileActiveTab = 'posts';
                renderForum();
            });
        }

        if (tabTagged) {
            tabTagged.addEventListener('click', () => {
                forumState.profileActiveTab = 'tagged';
                renderForum();
            });
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
                const likeBtn = e.target.closest('.like-btn');
                if (likeBtn) {
                    const postId = likeBtn.dataset.id;
                    toggleLike(postId);
                }

                const commentBtn = e.target.closest('.comment-btn');
                if (commentBtn) {
                    // const postId = commentBtn.dataset.id; // Can be used later to load specific comments
                    renderCommentsOverlay();
                }
            });
        }
    }

    function toggleLike(postId) {
        const post = forumState.posts.find(p => p.id === parseInt(postId));
        if (post) {
            post.liked = !post.liked;
            post.stats.likes += post.liked ? 1 : -1;
            
            // Save to localStorage
            localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));

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
                    count.textContent = post.stats.likes.toLocaleString();
                }
            } else {
                renderForum(false);
            }
        }
    }

    window.initForumApp = initForum;
    if (window.appInitFunctions) {
        window.appInitFunctions.push(initForum);
    }
})();
