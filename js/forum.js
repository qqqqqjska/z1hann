// 仿 Instagram 论坛应用逻辑 (UI Update)

(function() {
    const forumState = {
        activeTab: 'home', // home, video, share, search, profile
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
            </div>
        `;

        setupTabListeners();
        setupBackToTopListener();
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

    function renderCommentsOverlay(comments = null, post = null) {
        // Remove existing overlay if any
        const existing = document.getElementById('comments-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'comments-overlay';
        overlay.className = 'comments-overlay';
        
        const commentsData = comments || mockComments;

        const commentsListHtml = commentsData.map(comment => {
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
                <div class="comments-header-close" id="comments-close-btn"><img src="https://i.postimg.cc/hGjkXkL3/无标题98_20260213231726.png" class="post-action-icon"></div>
            </div>
            <div class="comments-scroll-area">
                ${commentsListHtml}
            </div>
            <div class="comments-input-area">
                <div class="emoji-bar">
                    <span>❤️</span> <span>🙌</span> <span>🔥</span> <span>👏</span> <span>😥</span> <span>😍</span> <span>😮</span> <span>😂</span>
                </div>
                <div class="comment-input-wrapper">
                    <img src="${forumState.currentUser.avatar}" class="comment-user-avatar-small">
                    <div class="comment-input-box">
                        <input type="text" class="comment-input" placeholder="为 ${post ? post.user.name : '作者'} 添加评论...">
                        <img src="https://i.postimg.cc/hGjkXkL3/无标题98_20260213231726.png" class="comment-send-icon">
                    </div>
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
                    <div style="cursor: pointer; display: flex; align-items: center;">
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </div>
                </div>
                <div class="header-center">
                    <span style="font-weight: 700; font-size: 22px;">${forumState.currentUser.username}</span>
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
        
        const postsContent = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; padding-bottom: 2px;">
                 <div style="aspect-ratio: 1; background-color: #efefef;"></div>
                 <div style="aspect-ratio: 1; background-color: #efefef;"></div>
                 <div style="aspect-ratio: 1; background-color: #efefef;"></div>
            </div>
            <div style="padding: 40px; text-align: center; color: #8e8e8e; font-size: 14px;">
                暂无帖子
            </div>
        `;

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
        const isTextPost = !post.image;

        const actionsBarHtml = `
            <div class="post-actions-bar">
                <div class="actions-left-group">
                    <div class="action-item like-btn" data-id="${post.id}">
                        <i class="${post.liked ? 'fas fa-heart' : 'far fa-heart'}" style="${post.liked ? 'color: #ed4956;' : ''}"></i>
                        <span class="action-count">${formatNum(post.stats.likes)}</span>
                    </div>
                    <div class="action-item comment-btn" data-id="${post.id}">
                        <img src="https://i.postimg.cc/GmHtkm1B/无标题98_20260213233618.png" class="post-action-icon">
                        <span class="action-count">${post.stats.comments}</span>
                    </div>
                    <div class="action-item">
                        <img src="https://i.postimg.cc/hGjkXkL3/无标题98_20260213231726.png" class="post-action-icon">
                        <span class="action-count">${post.stats.shares}</span>
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
        } else {
            contentHtml = `
                <div class="post-image-container">
                    <img src="${post.image}" class="post-image">
                    ${post.stats.count ? `<div class="image-overlay-count">${post.stats.count}</div>` : ''}
                    <div class="post-description-overlay">
                        <div class="post-description-text">${post.image_description || ''}</div>
                    </div>
                </div>
                ${actionsBarHtml}
                <div class="post-info-section">
                    <div class="post-caption-row">
                        <span class="post-caption-username">${post.user.name}</span>
                        <span class="post-caption-content">${post.caption}</span>
                    </div>
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
            });
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
        localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));

        // Exit multi-select mode and re-render
        forumState.multiSelectMode = false;
        forumState.selectedPostIds = new Set();
        renderForum(false);
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

            let fetchUrl = settings.url;
            if (!fetchUrl.endsWith('/chat/completions')) {
                fetchUrl = fetchUrl.endsWith('/') ? fetchUrl + 'chat/completions' : fetchUrl + '/chat/completions';
            }

            const prompt = `
请模拟真实的社交论坛环境，生成7个陌生人（NPC）发布的帖子数据。
返回格式必须是纯粹的JSON数组，严禁包含markdown格式标记。
每个对象包含以下字段：
- id: 唯一数字ID
- post_type: 帖子形式，"image" (带图) 或 "text" (纯文字)。请随机分配，约30%为纯文字。
- image_ratio: 如果是带图帖子，请随机指定图片比例: "1:1" (正方形), "4:5" (竖长), "16:9" (横长)。如果是纯文字，则为 null。
- type: 帖子主题，必须从以下选项中选择一个: "food" (美食), "travel" (旅行), "mood" (心情), "hobby" (爱好), "daily" (日常), "pet" (宠物), "scenery" (风景)
- image_description: 如果是带图帖子，提供详细的中文图片画面描述，不要只写关键词，要描绘画面细节（例如：“一只橘猫懒洋洋地躺在洒满阳光的窗台上，旁边放着一杯冒着热气的咖啡”）。如果是纯文字，则为 null。
- user: 对象，包含 name (随机有趣的网名), avatar (使用 https://api.dicebear.com/7.x/lorelei/svg?seed=随机字符串), verified (布尔值, 20%概率为true), subtitle (短签名或位置)
- stats: 对象，包含 likes (随机数字10-5000), comments (随机数字5-100), shares (随机数字)
- caption: 帖子正文，内容要非常生活化、丰富有趣、甚至带点狗血或搞笑，像活人发的，必须包含emoji。如果是纯文字帖子，内容可以稍长一些。
- time: 发布时间字符串（如"5分钟前", "刚刚"）
- liked: false
- comments_list: 数组，包含3-5条评论对象，每个包含 id, user (name, avatar使用lorelei风格, verified), text (评论内容，要有趣，有互动感，模仿真实网友), time, likes。
`;

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
                newPosts.forEach((post, index) => {
                    post.id = now + index; // Ensure unique numeric IDs
                    
                    // Generate Image if post_type is not 'text'
                    if (post.post_type === 'text') {
                        post.image = null;
                    } else {
                        // Default to image if undefined
                         post.image = generatePlaceholderSvg(post.type || 'daily', post.image_ratio || '1:1');
                    }

                    if (!post.stats) post.stats = { likes: 0, comments: 0, shares: 0 };
                    // Ensure stats.comments matches comments_list length if possible
                    if (post.comments_list && Array.isArray(post.comments_list)) {
                        post.stats.comments = post.comments_list.length + Math.floor(Math.random() * 20);
                    }
                });

                // Add to state
                forumState.posts = [...newPosts, ...forumState.posts];
                
                // Save
                localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));

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

    window.initForumApp = initForum;
    if (window.appInitFunctions) {
        window.appInitFunctions.push(initForum);
    }
})();
