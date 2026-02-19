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
        settings: JSON.parse(localStorage.getItem('forum_settings')) || {
            linkedContacts: [],
            linkedWorldbook: null,
            forumWorldview: ''
        },
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
        messages: [
            { 
                id: 1, 
                name: '中沢 元紀', 
                username: 'motoki.nakazawa_',
                avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nakazawa', 
                verified: true, 
                subtext: '轻触即可聊天' 
            }
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
            default:
                contentHtml = renderHomeTab();
        }

        const showNav = forumState.activeTab !== 'edit_profile' && forumState.activeTab !== 'forum_settings' && forumState.activeTab !== 'forum_edit_contact' && forumState.activeTab !== 'chat' && forumState.activeTab !== 'other_profile' && forumState.activeTab !== 'other_profile_posts';

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

        // Restore scroll position
        if (!animate && previousScrollTop > 0) {
            const newContent = document.getElementById('forum-content-area');
            if (newContent) {
                newContent.scrollTop = previousScrollTop;
            }
        }

        setupTabListeners();
        setupBackToTopListener();
        
        // Scroll to specific post if needed
        if (forumState.activeTab === 'other_profile_posts' && forumState.otherProfileScrollToPostId) {
            setTimeout(() => {
                const el = document.getElementById(`other-profile-post-${forumState.otherProfileScrollToPostId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'auto', block: 'center' });
                    // Optional: Flash effect
                }
                forumState.otherProfileScrollToPostId = null; // Clear it
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
                    if (forumState.activeTab === 'other_profile' || forumState.activeTab === 'chat' || forumState.activeTab === 'other_profile_posts') {
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
            const checkboxHtml = isMultiSelect ? `<div class="comment-select-checkbox ${isSelected ? 'checked' : ''}"></div>` : '';

            const repliesHtml = hasReplies ? `
                <div class="view-replies-btn" onclick="toggleReplies(${comment.id}, this)">
                    <div class="view-replies-line"></div>
                    <span class="view-replies-text">查看另 ${comment.replies.length} 条回复</span>
                </div>
                <div class="replies-list" id="replies-${comment.id}">
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
                            name: forumState.currentUser.bio || forumState.currentUser.name
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
                    localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));
                    
                    // Clear input before re-rendering
                    input.value = '';
                    
                    renderCommentsOverlay(post.comments_list, post); // Re-render logic

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
                    
                    localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));
                    
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
             replies.classList.add('visible');
             // Hide the button after clicking, per requirements
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
            localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));

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
                    count.textContent = targetComment.likes;
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
                    <img src="https://i.postimg.cc/QCfGKHGC/无标题98_20260215024118.png" style="height: 32px; width: auto; margin-top: 5px;">
                    <img src="https://i.postimg.cc/vT0FxcF9/无标题98_20260215024227.png" style="height: 32px; width: auto; margin-top: 5px;">
                </div>
            </div>
        `;
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
        
        const postsContent = `
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; padding-bottom: 2px;">
                 <div style="aspect-ratio: 3/4; background-color: #efefef;"></div>
                 <div style="aspect-ratio: 3/4; background-color: #efefef;"></div>
                 <div style="aspect-ratio: 3/4; background-color: #efefef;"></div>
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
        
        // Fill grid to look nice (at least 9 items)
        let gridHtml = '';
        const totalGridItems = Math.max(userPosts.length, 9);
        
        for (let i = 0; i < totalGridItems; i++) {
            if (i < userPosts.length) {
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
            } else {
                // Placeholder
                gridHtml += `<div class="profile-grid-item" style="aspect-ratio: 3/4; background-color: #efefef;"></div>`;
            }
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
                                    <span class="stat-num">${postsCount}</span>
                                    <span class="stat-label">帖子</span>
                                </div>
                                <div class="stat-item" style="margin-right: 0;">
                                    <span class="stat-num">${followersCount}</span>
                                    <span class="stat-label">粉丝</span>
                                </div>
                                <div class="stat-item" style="margin-right: 0;">
                                    <span class="stat-num">${followingCount}</span>
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
            localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));
            
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
                // Helper for SVG (Duplicated for safety)
                const generateSvg = (text, ratio) => {
                     // Simple fallback SVG generator
                     const colors = ['#e0f2f1', '#e8eaf6', '#f3e5f5', '#fff3e0'];
                     const color = colors[Math.floor(Math.random() * colors.length)];
                     const w = 600, h = ratio === '4:5' ? 750 : 600;
                     // Truncate text for SVG to avoid overflow
                     const shortText = text.length > 8 ? text.substring(0, 8) + '...' : text;
                     // Encode text to ensure it works in data URI (handle unicode)
                     const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#999">${shortText}</text></svg>`;
                     // Use unescape + encodeURIComponent for unicode btoa support
                     return `data:image/svg+xml;base64,` + btoa(unescape(encodeURIComponent(svgString)));
                };

                const newPosts = result.recent_posts.map((p, idx) => ({
                    id: Date.now() + idx,
                    user: user, // Link to this user
                    image: p.type === 'text' ? null : (p.image || generateSvg(p.image_description_zh || '图片', p.image_ratio)),
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
                localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));
            }

        } catch (e) {
            console.error('Profile Generation Failed', e);
        } finally {
            user.isGeneratingProfile = false;
            renderForum();
        }
    }

    window.regeneratePostImage = async function(event, postId) {
        event.stopPropagation();
        const post = forumState.posts.find(p => p.id === postId);
        if (!post) return;
        
        const btn = event.currentTarget;
        const icon = btn.querySelector('i');
        icon.classList.add('fa-spin');
        
        try {
            // Get settings
            let apiKey = '';
            let imageModel = 'nai-diffusion-3';
            
            if (window.iphoneSimState) {
                // 1. Check novelaiSettings (Highest Priority)
                if (window.iphoneSimState.novelaiSettings && window.iphoneSimState.novelaiSettings.key) {
                    apiKey = window.iphoneSimState.novelaiSettings.key;
                    if (window.iphoneSimState.novelaiSettings.model) imageModel = window.iphoneSimState.novelaiSettings.model;
                }
                
                // 2. Check aiSettings.novelai_key
                if (!apiKey && window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.novelai_key) {
                    apiKey = window.iphoneSimState.aiSettings.novelai_key;
                }

                // 3. Check aiSettings.key (Lowest Priority - mostly for LLM, risk of mismatch)
                if (!apiKey && window.iphoneSimState.aiSettings && window.iphoneSimState.aiSettings.key) {
                     apiKey = window.iphoneSimState.aiSettings.key;
                }
                
                // 4. Check aiSettings2 (fallback)
                if (!apiKey && window.iphoneSimState.aiSettings2) {
                     apiKey = window.iphoneSimState.aiSettings2.key;
                }
            }
            
            console.log('Regenerate Image - Key Source Check. Key Found:', !!apiKey);

            if (!apiKey) {
                alert('未找到有效的 AI Key。请在“设置”或“NovelAI设置”中配置 Key。');
                return;
            }
            
            // Use english description
            const prompt = post.image_description || post.caption;
            
            if (window.generateNovelAiImageApi) {
                const resultBase64 = await window.generateNovelAiImageApi({
                    key: apiKey,
                    prompt: prompt,
                    width: post.image_ratio === '4:5' ? 832 : 1024,
                    height: post.image_ratio === '4:5' ? 1216 : 1024,
                    model: imageModel
                });
                
                post.image = resultBase64;
                // Save
                localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));
                // Render
                renderForum(false);
            } else {
                 alert('生图功能未加载 (window.generateNovelAiImageApi not found)');
            }
            
        } catch (e) {
            console.error(e);
            alert('生图失败: ' + e.message);
        } finally {
            icon.classList.remove('fa-spin');
        }
    };

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
            <div class="dm-user-row" onclick="window.openForumChat(${msg.id})">
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
            const input = document.querySelector('.forum-chat-input');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        const text = input.value.trim();
                        if (text) {
                            // Add to State
                            if (!forumState.chatHistory[user.id]) forumState.chatHistory[user.id] = [];
                            forumState.chatHistory[user.id].push({ type: 'me', text: text });

                            // Add to DOM
                            const msgHtml = `
                                <div class="forum-chat-msg me">
                                    <div class="chat-bubble me">${text}</div>
                                </div>
                            `;
                            chatBody.insertAdjacentHTML('beforeend', msgHtml);
                            
                            // Scroll to bottom
                            const contentArea = document.getElementById('forum-content-area');
                            if (contentArea) {
                                contentArea.scrollTop = contentArea.scrollHeight;
                            }
                            
                            // Clear input
                            input.value = '';
                        }
                    }
                });
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
                            <input type="text" placeholder="发消息..." class="forum-chat-input">
                        </div>
                        <div class="chat-footer-actions">
                            <img src="https://i.postimg.cc/xT2Zhgfk/无标题98_20260215154555.png">
                            <img src="https://i.postimg.cc/ZKSQ2jby/无标题98_20260215154535.png">
                            <img src="https://i.postimg.cc/jdb1mvxw/无标题98_20260215154633.png">
                            <img src="https://i.postimg.cc/02s4FZkK/无标题98_20260215154658.png">
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
            else if (post.image_ratio === '4:5') { width = 832; height = 1040; }

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
            localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));
            
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
                        <img src="https://i.postimg.cc/fyG4XnSn/wu-biao-ti98-20260215020652.png" class="post-action-icon">
                        <span class="action-count">${post.stats.forwards || 0}</span>
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
            // Show refresh button if it's a generated post (has description) or has userId (legacy logic)
            const showRefreshBtn = !!post.userId || !!post.image_description;
            contentHtml = `
                <div class="post-image-container" style="position: relative;">
                    <img src="${post.image}" class="post-image">
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
                const charList = linkedContactsData.map(c => 
                    `- ID: "${c.id}"\n  Name: ${c.name}\n  Identity: ${c.subtitle}\n  Followers: ${c.followers}\n  Persona: ${c.persona}`
                ).join('\n\n');

                prompt = `
请模拟社交论坛生成帖子。
世界观背景: ${forumWorldview}
世界设定(Worldbook): ${worldbookContent}

任务: 生成总共 ${Math.max(targetTotal, linkedContactsData.length)} 条帖子。

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
                                    else if (post.image_ratio === '4:5') { width = 832; height = 1040; }

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

    // AI Reply Generation Function
    async function generateAIReply(post, userComment, context) {
        if (!post || !userComment) return;

        // Determine the persona info
        let authorName = post.user.name;
        let authorPersona = "普通网友";
        let authorBio = "";
        
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
             }
        }

        const systemPrompt = `你是一个模拟社交媒体评论生成器。
当前帖子内容: "${post.caption}"
帖子作者: "${authorName}" (人设: ${authorPersona}, Bio: ${authorBio})
用户评论: "${userComment.text}"

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
                });

                localStorage.setItem('forum_posts', JSON.stringify(forumState.posts));
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
