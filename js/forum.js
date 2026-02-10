// 仿 Instagram 论坛应用逻辑

(function() {
    const forumState = {
        activeTab: 'home', // home, search, create, reels, profile
        stories: [
            { id: 1, name: 'your_story', avatar: '', isMe: true },
            { id: 2, name: 'bamgyuuuu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bamgyuuuu', hasStory: true },
            { id: 3, name: 'yeonjun', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yeonjun', hasStory: true },
            { id: 4, name: 'soobin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=soobin', hasStory: true },
            { id: 5, name: 'beomgyu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=beomgyu', hasStory: true },
            { id: 6, name: 'taehyun', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=taehyun', hasStory: true },
            { id: 7, name: 'hueningkai', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hueningkai', hasStory: true }
        ],
        posts: [
            {
                id: 1,
                user: { name: 'bamgyuuuu', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bamgyuuuu', verified: true },
                image: 'https://placehold.co/600x600/eee/333?text=Photo', // Placeholder, user will replace or use local
                likes: 12345,
                caption: 'Happy Sunday! ☀️',
                time: '2 hours ago',
                music: 'TOMORROW X TOGETHER · Sunday...'
            },
            {
                id: 2,
                user: { name: 'yeonjun', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yeonjun', verified: true },
                image: 'https://placehold.co/600x800/333/eee?text=Dance',
                likes: 892,
                caption: 'Practice practice practice 🕺',
                time: '5 hours ago',
                music: 'NewJeans · Super Shy'
            }
        ],
        currentUser: {
            username: 'kdksiehdb',
            posts: 0,
            followers: 0,
            following: 1,
            name: 'z',
            bio: '添加个性签名\n向粉丝介绍一下自己吧。',
            avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' // Will sync with global user
        }
    };

    function initForum() {
        const app = document.getElementById('forum-app');
        if (!app) return;

        // Sync current user with global state if available
        if (window.iphoneSimState && window.iphoneSimState.userProfile) {
            forumState.currentUser.avatar = window.iphoneSimState.userProfile.avatar;
            forumState.currentUser.name = window.iphoneSimState.userProfile.name;
            // forumState.currentUser.username = window.iphoneSimState.userProfile.name.toLowerCase().replace(/\s+/g, '_');
        }

        renderForum();
        
        // Add event listener to close button (handled by core.js generally, but we might need custom back behavior if pushed)
        const closeBtn = document.getElementById('close-forum-app');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                app.classList.add('hidden');
            });
        }
    }

    function renderForum() {
        const app = document.getElementById('forum-app');
        app.innerHTML = `
            <div class="forum-screen">
                ${renderHeader()}
                <div class="forum-content" id="forum-content-area">
                    ${renderHomeTab()}
                </div>
                ${renderBottomNav()}
            </div>
        `;

        setupTabListeners();
    }

    function renderHeader() {
        // Common back button for all headers to allow exit
        const backBtn = `<i class="fas fa-chevron-left" id="forum-back-btn" style="font-size: 24px; margin-right: 15px; cursor: pointer;"></i>`;

        if (forumState.activeTab === 'home') {
            return `
                <div class="forum-header">
                    <div class="header-left">
                        ${backBtn}
                        <i class="far fa-plus-square" style="font-size: 24px;"></i>
                    </div>
                    <div class="header-center">
                        <span class="instagram-logo">Instagram</span>
                        <i class="fas fa-chevron-down" style="font-size: 12px; margin-left: 5px;"></i>
                    </div>
                    <div class="header-right">
                        <i class="far fa-heart" style="font-size: 24px; margin-right: 20px;"></i>
                        <i class="fab fa-facebook-messenger" style="font-size: 24px;"></i>
                    </div>
                </div>
            `;
        } else if (forumState.activeTab === 'profile') {
            return `
                <div class="forum-header">
                    <div class="header-left">
                        ${backBtn}
                        <i class="far fa-plus-square" style="font-size: 24px;"></i>
                    </div>
                    <div class="header-center">
                        <span class="profile-username">${forumState.currentUser.username}</span>
                        <i class="fas fa-chevron-down" style="font-size: 12px; margin-left: 5px;"></i>
                    </div>
                    <div class="header-right">
                        <i class="fas fa-at" style="font-size: 24px; margin-right: 20px;"></i>
                        <i class="fas fa-bars" style="font-size: 24px;"></i>
                    </div>
                </div>
            `;
        }
        // Default header with back button if tab doesn't have specific one
        return `
            <div class="forum-header">
                <div class="header-left">
                    ${backBtn}
                </div>
                <div class="header-center">
                    <span class="instagram-logo">Instagram</span>
                </div>
                <div class="header-right"></div>
            </div>
        `; 
    }

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

    function renderStory(story) {
        const borderClass = story.hasStory ? 'story-border' : '';
        const name = story.isMe ? '你的快拍' : story.name;
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

    function renderPost(post) {
        return `
            <div class="post-item">
                <div class="post-header">
                    <div class="post-user-info">
                        <img src="${post.user.avatar}" class="post-user-avatar">
                        <div class="post-user-text">
                            <div class="post-username-row">
                                <span class="post-username">${post.user.name}</span>
                                ${post.user.verified ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                            </div>
                            ${post.music ? `<div class="post-music">${post.music}</div>` : ''}
                        </div>
                    </div>
                    <div class="post-more">
                        <button class="follow-btn">关注</button>
                        <i class="fas fa-ellipsis-h"></i>
                    </div>
                </div>
                <div class="post-image-container">
                    <img src="${post.image}" class="post-image">
                </div>
                <div class="post-actions">
                    <div class="actions-left">
                        <i class="far fa-heart"></i>
                        <i class="far fa-comment"></i>
                        <i class="far fa-paper-plane"></i>
                    </div>
                    <div class="actions-right">
                        <i class="far fa-bookmark"></i>
                    </div>
                </div>
                <div class="post-info">
                    <div class="post-likes">${post.likes.toLocaleString()} likes</div>
                    <div class="post-caption">
                        <span class="post-username">${post.user.name}</span>
                        <span class="post-caption-text">${post.caption}</span>
                    </div>
                    <div class="post-time">${post.time}</div>
                </div>
            </div>
        `;
    }

    function renderProfileTab() {
        const user = forumState.currentUser;
        return `
            <div class="profile-container">
                <div class="profile-header-section">
                    <div class="profile-avatar-section">
                        <div class="profile-avatar-wrapper">
                            <img src="${user.avatar}" class="profile-avatar-large">
                            <div class="profile-add-icon"><i class="fas fa-plus"></i></div>
                        </div>
                        <div class="profile-mood">你对心情歌\n是哪首?</div>
                    </div>
                    <div class="profile-stats">
                        <div class="stat-item">
                            <span class="stat-value">${user.posts}</span>
                            <span class="stat-label">帖子</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${user.followers}</span>
                            <span class="stat-label">粉丝</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${user.following}</span>
                            <span class="stat-label">关注</span>
                        </div>
                    </div>
                </div>
                
                <div class="profile-bio-section">
                    <div class="profile-name">${user.name}</div>
                    <div class="profile-bio">${user.bio.replace(/\n/g, '<br>')}</div>
                </div>

                <div class="profile-actions-row">
                    <button class="profile-action-btn">编辑主页</button>
                    <button class="profile-action-btn">分享主页</button>
                    <button class="profile-action-btn icon-only"><i class="fas fa-user-plus"></i></button>
                </div>

                <div class="profile-tabs">
                    <div class="profile-tab active"><i class="fas fa-th"></i></div>
                    <div class="profile-tab"><i class="fas fa-play"></i></div>
                    <div class="profile-tab"><i class="fas fa-user-tag"></i></div>
                </div>

                <div class="profile-content-area">
                    <div class="complete-profile-card">
                        <div class="card-header">
                            <span class="card-title">完善主页</span>
                            <span class="card-subtitle">2/4 已完成</span>
                        </div>
                        <div class="card-scroll">
                            <div class="action-card">
                                <div class="circle-icon"><i class="far fa-comment"></i></div>
                                <div class="card-text-bold">添加个性签名</div>
                                <div class="card-text-small">向粉丝介绍一下自己吧。</div>
                                <button class="card-btn">添加个性签名</button>
                            </div>
                            <div class="action-card">
                                <div class="circle-icon"><i class="fas fa-user-friends"></i></div>
                                <div class="card-text-bold">查找用户并关注</div>
                                <div class="card-text-small">关注至少 5 个账户。</div>
                                <button class="card-btn">查找用户</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function renderBottomNav() {
        const isActive = (tab) => forumState.activeTab === tab ? 'active' : '';
        // Profile icon logic
        const profileIcon = forumState.activeTab === 'profile' 
            ? `<div class="nav-profile-icon active" style="background-image: url('${forumState.currentUser.avatar}')"></div>`
            : `<div class="nav-profile-icon" style="background-image: url('${forumState.currentUser.avatar}')"></div>`;

        return `
            <div class="forum-nav-bar">
                <div class="nav-item ${isActive('home')}" data-tab="home"><i class="fas fa-home"></i></div>
                <div class="nav-item ${isActive('search')}" data-tab="search"><i class="fas fa-search"></i></div>
                <div class="nav-item ${isActive('create')}" data-tab="create"><i class="far fa-plus-square"></i></div>
                <div class="nav-item ${isActive('reels')}" data-tab="reels"><i class="fas fa-film"></i></div>
                <div class="nav-item ${isActive('profile')}" data-tab="profile">${profileIcon}</div>
            </div>
        `;
    }

    function setupTabListeners() {
        document.querySelectorAll('.forum-nav-bar .nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Handle different icon structure (img vs i)
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
    }

    // Export init function
    window.initForumApp = initForum;
    
    // Auto register
    if (window.appInitFunctions) {
        window.appInitFunctions.push(initForum);
    }

})();
