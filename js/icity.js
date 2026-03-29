// iCity 应用功能模块

// iCity Logic Initialization
function setupIcityListeners() {
    const closeIcityBtn = document.getElementById('close-icity-app');
    if (closeIcityBtn) closeIcityBtn.addEventListener('click', () => document.getElementById('icity-app').classList.add('hidden'));

    // iCity Profile Listeners
    const icityBgInput = document.getElementById('icity-bg-input');
    const icityAvatarInput = document.getElementById('icity-avatar-input');
    const icityBgTrigger = document.getElementById('icity-bg-trigger');
    const icityAvatarTrigger = document.getElementById('icity-avatar-trigger');

    // Calendar Listeners
    const openCalendarBtn = document.getElementById('open-icity-calendar');
    const closeCalendarBtn = document.getElementById('close-icity-calendar');
    
    // Stranger Profile Listener
    const closeStrangerProfileBtn = document.getElementById('close-icity-stranger-profile');
    const addFriendBtn = document.getElementById('icity-stranger-add-friend-btn');
    const strangerChatBtn = document.getElementById('icity-stranger-chat-btn');

    if (closeStrangerProfileBtn) {
        closeStrangerProfileBtn.addEventListener('click', () => {
            document.getElementById('icity-stranger-profile-screen').classList.add('hidden');
        });
    }

    if (addFriendBtn) {
        addFriendBtn.addEventListener('click', () => {
            const profile = window.currentStrangerProfile;
            if (!profile) return;
            
            // Check if already contact (by ID or name)
            const existing = window.iphoneSimState.contacts.find(c => (profile.contactId && c.id === profile.contactId) || c.name === profile.name);
            if (existing) {
                alert('已经是好友了');
                return;
            }
            
            const newContact = {
                id: Date.now(),
                name: profile.name,
                avatar: profile.avatar || '',
                remark: '',
                persona: '' 
            };
            
            window.iphoneSimState.contacts.push(newContact);
            saveConfig();
            
            addFriendBtn.textContent = '已添加';
            addFriendBtn.disabled = true;
            addFriendBtn.style.backgroundColor = '#ccc';
            
            alert('已添加为好友');
        });
    }

    if (strangerChatBtn) {
        strangerChatBtn.addEventListener('click', () => {
            const profile = window.currentStrangerProfile;
            if (!profile) return;
            window.openStrangerChat(profile.name, profile.handle, profile.avatar, profile.contactId);
        });
    }

    if (openCalendarBtn) {
        openCalendarBtn.addEventListener('click', () => {
            renderIcityCalendar(2026); // Default to 2026
            document.getElementById('icity-calendar-screen').classList.remove('hidden');
        });
    }
    
    if (closeCalendarBtn) {
        closeCalendarBtn.addEventListener('click', () => {
            document.getElementById('icity-calendar-screen').classList.add('hidden');
        });
    }

    if (icityBgTrigger) icityBgTrigger.addEventListener('click', () => icityBgInput.click());
    if (icityAvatarTrigger) icityAvatarTrigger.addEventListener('click', () => icityAvatarInput.click());
    
    if (icityBgInput) icityBgInput.addEventListener('change', (e) => handleIcityImageUpload(e, 'bgImage'));
    if (icityAvatarInput) icityAvatarInput.addEventListener('change', (e) => handleIcityImageUpload(e, 'avatar'));

    // iCity Compose Logic
    const icityComposeModal = document.getElementById('icity-compose-modal');
    const closeIcityComposeBtn = document.getElementById('close-icity-compose');
    const icityVisibilityBtn = document.getElementById('icity-visibility-btn');
    const icityVisibilityMenu = document.getElementById('icity-visibility-menu');
    const icityVisItems = document.querySelectorAll('.icity-vis-item');

    if (closeIcityComposeBtn) {
        closeIcityComposeBtn.addEventListener('click', () => {
            icityComposeModal.classList.add('hidden');
        });
    }

    if (icityVisibilityBtn) {
        icityVisibilityBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            icityVisibilityMenu.classList.toggle('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        if (icityVisibilityMenu && !icityVisibilityMenu.classList.contains('hidden') && !icityVisibilityBtn.contains(e.target) && !icityVisibilityMenu.contains(e.target)) {
            icityVisibilityMenu.classList.add('hidden');
        }
    });

    icityVisItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const val = item.dataset.val;
            const iconClass = item.querySelector('i').className;
            const text = item.textContent.trim();
            
            // Update button text and icon
            icityVisibilityBtn.innerHTML = `<i class="${iconClass}"></i> <span>${text}</span>`;
            
            // Update active state style
            icityVisItems.forEach(i => {
                i.classList.remove('active');
                i.style.backgroundColor = 'transparent';
                i.style.color = '#666';
            });
            item.classList.add('active');
            item.style.backgroundColor = '#007AFF';
            item.style.color = '#fff';
            
            icityVisibilityMenu.classList.add('hidden');
        });
    });

    const icityTabBar = document.querySelector('.icity-tab-bar');
    if (icityTabBar) {
        const btns = Array.from(icityTabBar.children);
        // Middle button (Pen) is index 2
        if (btns[2]) {
            btns[2].style.cursor = 'pointer';
            btns[2].addEventListener('click', () => {
                if (icityComposeModal) {
                    icityComposeModal.classList.remove('hidden');
                    const textInput = document.getElementById('icity-compose-text');
                    if (textInput) textInput.focus();
                }
            });
        }
    }

    const icitySendBtn = document.getElementById('icity-send-btn');
    if (icitySendBtn) {
        icitySendBtn.addEventListener('click', handleIcitySend);
    }

    const icityMessageSendBtn = document.getElementById('icity-message-send-btn');
    if (icityMessageSendBtn) {
        icityMessageSendBtn.addEventListener('click', () => handleIcityMessageSend(true));
    }

    const icityMessageInput = document.getElementById('icity-message-input');
    if (icityMessageInput) {
        icityMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleIcityMessageSend(false);
            }
        });
    }

    const icityCommentSendBtn = document.getElementById('icity-comment-send-btn');
    if (icityCommentSendBtn) {
        icityCommentSendBtn.addEventListener('click', handleIcityCommentSend);
    }

    // Badge Listeners
    const badgesBtn = document.getElementById('icity-badges-btn');
    const closeBadgesBtn = document.getElementById('close-icity-badges');
    if (badgesBtn) {
        badgesBtn.addEventListener('click', openIcityBadges);
    }
    if (closeBadgesBtn) {
        closeBadgesBtn.addEventListener('click', () => {
            document.getElementById('icity-badges-screen').classList.add('hidden');
        });
    }

    // Title Listeners
    const titlesBtn = document.getElementById('icity-titles-btn');
    const closeTitlesBtn = document.getElementById('close-icity-titles');
    if (titlesBtn) {
        titlesBtn.addEventListener('click', openIcityTitles);
    }
    if (closeTitlesBtn) {
        closeTitlesBtn.addEventListener('click', () => {
            document.getElementById('icity-titles-screen').classList.add('hidden');
        });
    }

    // All Diaries Screen Listeners
    const closeAllDiariesBtn = document.getElementById('close-icity-all-diaries');
    if (closeAllDiariesBtn) {
        closeAllDiariesBtn.addEventListener('click', () => {
            document.getElementById('icity-all-diaries-screen').classList.add('hidden');
        });
    }

    // Detail Screen Listeners
    const closeDetailBtn = document.getElementById('close-icity-detail');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
            document.getElementById('icity-detail-screen').classList.add('hidden');
        });
    }

    // Settings Modal Listeners
    const settingsBtn = document.getElementById('icity-settings-btn');
    const closeSettingsBtn = document.getElementById('close-icity-settings-modal');
    const saveSettingsBtn = document.getElementById('save-icity-settings-btn');

    if (settingsBtn) settingsBtn.addEventListener('click', openIcitySettings);
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => document.getElementById('icity-settings-modal').classList.add('hidden'));
    if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', saveIcitySettings);

    // Edit Profile Screen Listeners
    const editProfileBtn = document.getElementById('icity-edit-profile-btn');
    const editProfileScreen = document.getElementById('icity-edit-profile-screen');
    const closeEditProfileBtn = document.getElementById('close-icity-edit-profile');
    const saveProfileBtn = document.getElementById('save-icity-profile-btn');

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', openIcityEditProfile);
    }

    if (closeEditProfileBtn) {
        closeEditProfileBtn.addEventListener('click', () => {
            editProfileScreen.classList.add('hidden');
        });
    }

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', handleSaveIcityProfile);
    }

    const diaryTabs = document.querySelectorAll('.icity-diary-tab');
    diaryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            diaryTabs.forEach(t => {
                t.classList.remove('active');
                t.style.fontWeight = 'normal';
                t.style.color = '#999';
                t.style.background = 'transparent';
                t.style.borderRadius = '15px'; // Ensure rounded corners when inactive (if needed) or reset
            });
            tab.classList.add('active');
            tab.style.fontWeight = 'bold';
            tab.style.color = '#fff';
            tab.style.background = '#7C9BF8';
            tab.style.borderRadius = '15px'; // Ensure rounded corners
            
            renderIcityAllDiaries();
        });
    });
    
    // World Tab Listeners
    const navBooks = document.getElementById('icity-nav-books');
    const navWorld = document.getElementById('icity-nav-world');
    const navMessages = document.getElementById('icity-nav-messages');
    const tabMe = document.getElementById('icity-tab-me');
    const generateWorldBtn = document.getElementById('icity-world-generate-btn');
    const headerWorld = document.getElementById('icity-header-world');
    const headerFriends = document.getElementById('icity-header-friends');

    // Books Logic
    const addBookBtn = document.getElementById('icity-add-book-btn');
    const closeAddBookBtn = document.getElementById('close-icity-add-book');
    const saveBookBtn = document.getElementById('save-icity-book-btn');
    const bookCoverInput = document.getElementById('icity-book-cover-input');
    const bookCoverPreview = document.getElementById('icity-book-cover-preview');

    if (addBookBtn) {
        addBookBtn.addEventListener('click', () => {
            document.getElementById('icity-add-book-modal').classList.remove('hidden');
        });
    }

    if (closeAddBookBtn) {
        closeAddBookBtn.addEventListener('click', () => {
            document.getElementById('icity-add-book-modal').classList.add('hidden');
        });
    }

    if (bookCoverInput) {
        bookCoverInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                compressImage(file, 300, 0.7).then(base64 => {
                    bookCoverPreview.style.backgroundImage = `url('${base64}')`;
                    bookCoverPreview.dataset.base64 = base64;
                    bookCoverPreview.innerHTML = ''; // Clear icon
                });
            }
        });
    }

    if (saveBookBtn) {
        saveBookBtn.addEventListener('click', () => {
            const name = document.getElementById('icity-book-name').value.trim();
            const cover = bookCoverPreview.dataset.base64;
            
            if (!name) {
                alert('请输入书名');
                return;
            }
            // Optional cover, default will be handled in render

            if (!window.iphoneSimState.icityBooks) {
                window.iphoneSimState.icityBooks = [];
            }

            window.iphoneSimState.icityBooks.push({
                id: Date.now(),
                name: name,
                cover: cover || '' // Store empty string if no cover
            });

            saveConfig();
            renderIcityBooks();
            document.getElementById('icity-add-book-modal').classList.add('hidden');
            
            // Reset form
            document.getElementById('icity-book-name').value = '';
            bookCoverPreview.style.backgroundImage = '';
            bookCoverPreview.innerHTML = '<i class="fas fa-camera"></i>';
            delete bookCoverPreview.dataset.base64;
        });
    }

    const switchIcityTab = (tabName) => {
        // Hide all tabs
        ['profile', 'world', 'messages', 'books'].forEach(t => {
            const el = document.getElementById(`icity-tab-content-${t}`);
            if (el) el.style.display = 'none';
        });

        // Reset icons
        if (navBooks) navBooks.style.color = '#ccc';
        if (navWorld) navWorld.style.color = '#ccc';
        if (navMessages) navMessages.style.color = '#ccc';
        if (tabMe) tabMe.style.border = '2px solid transparent';

        // Show selected
        const selectedEl = document.getElementById(`icity-tab-content-${tabName}`);
        if (selectedEl) {
            selectedEl.style.display = 'flex';
            if (tabName !== 'profile') selectedEl.style.flexDirection = 'column';
            else selectedEl.style.display = 'block';
        }

        // Highlight icon
        if (tabName === 'books' && navBooks) navBooks.style.color = '#000';
        if (tabName === 'world' && navWorld) navWorld.style.color = '#000';
        if (tabName === 'messages' && navMessages) navMessages.style.color = '#000';
        if (tabName === 'profile' && tabMe) tabMe.style.border = '2px solid #000';
    };
    window.switchIcityTab = switchIcityTab;

    if (navBooks) {
        navBooks.addEventListener('click', () => {
            switchIcityTab('books');
            renderIcityBooks();
        });
    }

    if (navWorld) {
        navWorld.addEventListener('click', () => {
            switchIcityTab('world');
            if (headerFriends && headerFriends.dataset.active === 'true') {
                renderIcityFriends();
            } else {
                renderIcityWorld();
            }
        });
    }

    if (navMessages) {
        navMessages.addEventListener('click', () => {
            switchIcityTab('messages');
            renderIcityMessages();
        });
    }

    if (tabMe) {
        tabMe.addEventListener('click', () => {
            switchIcityTab('profile');
        });
    }

    if (generateWorldBtn) {
        generateWorldBtn.addEventListener('click', () => {
            if (headerFriends && headerFriends.dataset.active === 'true') {
                handleGenerateIcityFriends();
            } else {
                handleGenerateIcityWorld();
            }
        });
    }

    if (headerWorld) {
        headerWorld.addEventListener('click', () => {
            headerWorld.dataset.active = 'true';
            headerFriends.dataset.active = 'false';
            headerWorld.style.color = '#000';
            headerWorld.style.borderBottom = '2px solid #000';
            headerFriends.style.color = '#999';
            headerFriends.style.borderBottom = 'none';
            renderIcityWorld();
        });
    }

    if (headerFriends) {
        headerFriends.addEventListener('click', () => {
            headerFriends.dataset.active = 'true';
            headerWorld.dataset.active = 'false';
            headerFriends.style.color = '#000';
            headerFriends.style.borderBottom = '2px solid #000';
            headerWorld.style.color = '#999';
            headerWorld.style.borderBottom = 'none';
            renderIcityFriends();
        });
    }
    
    renderIcityProfile();
    renderIcityDiaryList();
    
    // Ensure World tab layout is correct on init
    const worldTab = document.getElementById('icity-tab-content-world');
    if (worldTab && getComputedStyle(worldTab).display !== 'none') {
        worldTab.style.display = 'flex';
        worldTab.style.flexDirection = 'column';
    }
}

function renderIcityProfile() {
    const bgTrigger = document.getElementById('icity-bg-trigger');
    const avatarTrigger = document.getElementById('icity-avatar-trigger');
    const tabMeAvatar = document.getElementById('icity-tab-me');
    const composeAvatar = document.getElementById('icity-compose-avatar');
    
    if (!window.iphoneSimState.icityProfile) {
        window.iphoneSimState.icityProfile = { avatar: '', bgImage: '' };
    }

    if (window.iphoneSimState.icityProfile.followers === undefined) window.iphoneSimState.icityProfile.followers = 0;
    if (window.iphoneSimState.icityProfile.totalLikes === undefined) window.iphoneSimState.icityProfile.totalLikes = 0;
    
    const { avatar, bgImage, nickname, id } = window.iphoneSimState.icityProfile;
    
    // Update Header Background
    if (bgTrigger) {
        if (bgImage) {
            bgTrigger.style.backgroundImage = `url('${bgImage}')`;
        } else {
            bgTrigger.style.backgroundImage = ''; // Default color
        }
    }
    
    // Update Main Avatar
    if (avatarTrigger) {
        if (avatar) {
            avatarTrigger.style.backgroundImage = `url('${avatar}')`;
            avatarTrigger.style.backgroundColor = 'transparent';
        } else {
            avatarTrigger.style.backgroundImage = '';
            avatarTrigger.style.backgroundColor = '#000';
        }
    }

    // Update Name and ID (using selectors based on structure)
    const nameEl = document.querySelector('#icity-app .app-body div[style*="margin-top: 10px; text-align: center;"] div[style*="font-size: 24px"]');
    const idEl = document.querySelector('#icity-app .app-body div[style*="margin-top: 10px; text-align: center;"] div[style*="color: #999; font-size: 14px;"]');
    
    if (nameEl) nameEl.textContent = nickname || 'Kaneki';
    if (idEl) idEl.textContent = id || '@heanova1';

    // Update Friend Count
    const friendsCountEl = document.getElementById('icity-friends-count');
    if (friendsCountEl) {
        let friendCount = 0;
        if (window.iphoneSimState.icityProfile.linkedContactIds && Array.isArray(window.iphoneSimState.icityProfile.linkedContactIds)) {
            friendCount = window.iphoneSimState.icityProfile.linkedContactIds.length;
        } else if (window.iphoneSimState.icityProfile.linkedContactId) {
            friendCount = 1;
        }
        friendsCountEl.textContent = friendCount;
    }

    // Update Followers Count
    const followersEl = document.getElementById('icity-followers-count');
    if (followersEl) followersEl.textContent = window.iphoneSimState.icityProfile.followers;

    // Update Total Likes
    const totalLikesEl = document.getElementById('icity-likes-count');
    if (totalLikesEl) totalLikesEl.textContent = window.iphoneSimState.icityProfile.totalLikes;

    // Update Equipped Title
    const titleBtn = document.getElementById('icity-titles-btn');
    if (titleBtn) {
        const titleId = window.iphoneSimState.icityProfile.equippedTitleId;
        const titles = getIcityTitleDefinitions();
        const title = titles.find(t => t.id === titleId);
        
        if (title) {
            titleBtn.textContent = title.text;
            // Merge styles but ensure layout properties
            titleBtn.style.cssText = title.style;
            titleBtn.style.fontSize = '12px';
            titleBtn.style.padding = '2px 8px';
            titleBtn.style.borderRadius = '10px';
            titleBtn.style.cursor = 'pointer';
            titleBtn.style.display = 'inline-block';
        } else {
            titleBtn.textContent = '+ 我的市民称号';
            titleBtn.style.cssText = 'background: #f0f0f0; color: #666; font-size: 12px; padding: 2px 8px; border-radius: 10px; cursor: pointer; display: inline-block;';
        }
    }

    // Update Equipped Badge
    const equippedBadgeIcon = document.getElementById('icity-equipped-badge-icon');
    const equippedBadgeName = document.getElementById('icity-equipped-badge-name');
    const badgeBtn = document.getElementById('icity-badges-btn');
    
    if (window.iphoneSimState.icityProfile.equippedBadgeId && window.iphoneSimState.icityBadges) {
        const badge = window.iphoneSimState.icityBadges.find(b => b.id === window.iphoneSimState.icityProfile.equippedBadgeId);
        if (badge && badge.obtained) {
            const badgeColor = badge.color || '#FF9500';
            if (equippedBadgeIcon) {
                equippedBadgeIcon.className = badge.icon;
                equippedBadgeIcon.style.marginRight = '4px';
                equippedBadgeIcon.style.color = badgeColor;
            }
            if (equippedBadgeName) {
                equippedBadgeName.textContent = badge.name;
                equippedBadgeName.style.color = badgeColor;
            }
            if (badgeBtn) {
                badgeBtn.style.backgroundColor = '#fff';
                badgeBtn.style.color = badgeColor;
                badgeBtn.style.border = `1px solid ${badgeColor}`;
                badgeBtn.style.boxShadow = `0 2px 5px ${badgeColor}20`; // Hex alpha
            }
        } else {
            // Reset if invalid
            if (equippedBadgeIcon) {
                equippedBadgeIcon.className = '';
                equippedBadgeIcon.style.marginRight = '0';
            }
            if (equippedBadgeName) {
                equippedBadgeName.textContent = '+ 勋章';
                equippedBadgeName.style.color = '#666';
            }
            if (badgeBtn) {
                badgeBtn.style.backgroundColor = '#f0f0f0';
                badgeBtn.style.color = '#666';
                badgeBtn.style.border = 'none';
                badgeBtn.style.boxShadow = 'none';
            }
        }
    } else {
        if (equippedBadgeIcon) {
            equippedBadgeIcon.className = '';
            equippedBadgeIcon.style.marginRight = '0';
        }
        if (equippedBadgeName) {
            equippedBadgeName.textContent = '+ 勋章';
            equippedBadgeName.style.color = '#666';
        }
        if (badgeBtn) {
            badgeBtn.style.backgroundColor = '#f0f0f0';
            badgeBtn.style.color = '#666';
            badgeBtn.style.border = 'none';
            badgeBtn.style.boxShadow = 'none';
        }
    }

    // Update Tab Bar Avatar
    if (tabMeAvatar) {
        if (avatar) {
            tabMeAvatar.style.backgroundImage = `url('${avatar}')`;
            tabMeAvatar.style.backgroundColor = 'transparent';
        } else {
            tabMeAvatar.style.backgroundImage = '';
            tabMeAvatar.style.backgroundColor = '#000';
        }
    }

    // Update Compose Modal Avatar
    if (composeAvatar) {
        if (avatar) {
            composeAvatar.style.backgroundImage = `url('${avatar}')`;
            composeAvatar.style.backgroundColor = 'transparent';
        } else {
            composeAvatar.style.backgroundImage = '';
            composeAvatar.style.backgroundColor = '#000';
        }
    }
}

function handleIcityImageUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    
    const maxWidth = type === 'avatar' ? 300 : 800;
    
    compressImage(file, maxWidth, 0.7).then(base64 => {
        if (!window.iphoneSimState.icityProfile) {
            window.iphoneSimState.icityProfile = { avatar: '', bgImage: '' };
        }
        window.iphoneSimState.icityProfile[type] = base64;
        saveConfig();
        renderIcityProfile();
    }).catch(err => {
        console.error('图片压缩失败', err);
    });
    e.target.value = '';
}

function getIcityTitleDefinitions() {
    if (!window.iphoneSimState.icityCustomTitles) {
        window.iphoneSimState.icityCustomTitles = [];
    }

    const presets = [
        { id: 'citizen', text: '普通市民', style: 'background: #f0f0f0; color: #666; border: 1px solid #ddd;' },
        { id: 'enthusiast', text: '热心市民', style: 'background: #E8F5E9; color: #4CAF50; border: 1px solid #4CAF50;' },
        { id: 'mayor', text: '模拟市长', style: 'background: #E3F2FD; color: #2196F3; border: 1px solid #2196F3;' },
        { id: 'vip', text: 'VIP会员', style: 'background: #FFF8E1; color: #FFC107; border: 1px solid #FFC107;' },
        { id: 'star', text: '明日之星', style: 'background: #F3E5F5; color: #9C27B0; border: 1px solid #9C27B0;' },
        { id: 'night', text: '守夜人', style: 'background: #212121; color: #FFD700; border: 1px solid #FFD700;' },
        { id: 'writer', text: '大文豪', style: 'background: #fff; color: #000; border: 2px solid #000; font-family: "Songti SC", serif;' },
        { id: 'cat', text: '铲屎官 🐱', style: 'background: #FFF3E0; color: #FF9800; border: 1px dashed #FF9800;' },
        { id: 'dog', text: '汪星人 🐶', style: 'background: #EFEBE9; color: #795548; border: 1px dashed #795548;' },
        { id: 'foodie', text: '美食家 🍔', style: 'background: #FFEBEE; color: #E91E63; border: 1px solid #E91E63;' },
        { id: 'traveler', text: '旅行者 ✈️', style: 'background: #E0F7FA; color: #00BCD4; border: 1px solid #00BCD4;' },
        { id: 'coder', text: '程序猿 💻', style: 'background: #263238; color: #00E676; border: 1px solid #00E676; font-family: monospace;' },
        { id: 'rich', text: '多财多亿 💰', style: 'background: linear-gradient(45deg, #FFD700, #FFA000); color: #fff; border: none; box-shadow: 0 2px 5px rgba(255, 160, 0, 0.3);' },
        { id: 'lucky', text: '锦鲤 🍀', style: 'background: #FF5252; color: #fff; border: none;' },
        { id: 'ghost', text: '幽灵 👻', style: 'background: #000; color: #fff; border: 1px solid #333; opacity: 0.7;' },
    ];

    return [...presets, ...window.iphoneSimState.icityCustomTitles];
}

function getBadgeDefinitions() {
    return [
        { id: 'newcomer', name: '初来乍到', desc: '第一次打开 iCity', icon: 'fas fa-door-open', color: '#4CD964', obtained: true }, 
        { id: 'diarist', name: '日记达人', desc: '累计发布 1 篇日记', icon: 'fas fa-pen-fancy', color: '#FF9500', condition: (state) => (state.icityDiaries && state.icityDiaries.length >= 1), obtained: false },
        { id: 'prolific', name: '笔耕不辍', desc: '累计发布 10 篇日记', icon: 'fas fa-book-open', color: '#007AFF', condition: (state) => (state.icityDiaries && state.icityDiaries.length >= 10), obtained: false },
        { id: 'writer', name: '文学家', desc: '累计发布 50 篇日记', icon: 'fas fa-feather-alt', color: '#5856D6', condition: (state) => (state.icityDiaries && state.icityDiaries.length >= 50), obtained: false },
        { id: 'social', name: '社交名流', desc: '获得 100 个喜欢', icon: 'fas fa-heart', color: '#FF2D55', obtained: false },
        { id: 'influencer', name: '网络红人', desc: '获得 1000 个喜欢', icon: 'fas fa-star', color: '#FFCC00', obtained: false },
        { id: 'night_owl', name: '夜猫子', desc: '在凌晨 0-4 点发布日记', icon: 'fas fa-moon', color: '#5AC8FA', obtained: false },
        { id: 'early_bird', name: '早起鸟', desc: '在早晨 5-8 点发布日记', icon: 'fas fa-sun', color: '#FF9500', obtained: false },
        { id: 'weekend_warrior', name: '周末战士', desc: '在周末发布日记', icon: 'fas fa-coffee', color: '#8E8E93', obtained: false },
        { id: 'photographer', name: '摄影师', desc: '发布带图片的日记', icon: 'fas fa-camera', color: '#34C759', obtained: false },
        { id: 'secret_keeper', name: '秘密守护者', desc: '发布第一篇私密日记', icon: 'fas fa-user-secret', color: '#32ADE6', condition: (state) => (state.icityDiaries && state.icityDiaries.some(d => d.visibility === 'private')), obtained: false },
        { id: 'open_book', name: '坦诚相待', desc: '发布第一篇公开日记', icon: 'fas fa-bullhorn', color: '#FF3B30', condition: (state) => (state.icityDiaries && state.icityDiaries.some(d => d.visibility === 'public')), obtained: false },
        { id: 'deep_thinker', name: '深邃思想', desc: '日记字数超过 100 字', icon: 'fas fa-brain', color: '#AF52DE', obtained: false },
        { id: 'minimalist', name: '极简主义', desc: '日记字数不超过 2 字', icon: 'fas fa-minus', color: '#2C2C2C', obtained: false },
        { id: 'party_animal', name: '派对动物', desc: '周五或周六晚间发布日记', icon: 'fas fa-glass-cheers', color: '#FF2D55', obtained: false },
        { id: 'monday_warrior', name: '周一战士', desc: '周一早晨 6-9 点发布日记', icon: 'fas fa-fist-raised', color: '#FF3B30', obtained: false },
        { id: 'emoji_lover', name: '表情控', desc: '日记包含 emoji 表情', icon: 'far fa-laugh-beam', color: '#FFCC00', obtained: false },
        { id: 'questioner', name: '好奇宝宝', desc: '日记包含问号', icon: 'fas fa-question', color: '#007AFF', obtained: false },
        { id: 'positive_vibes', name: '正能量', desc: '日记包含“开心”、“快乐”或“爱”', icon: 'fas fa-smile-beam', color: '#FF9500', obtained: false },
        { id: 'storyteller', name: '故事大王', desc: '一天内发布 3 篇日记', icon: 'fas fa-scroll', color: '#A2845E', obtained: false },
        { id: 'copycat', name: '复读机', desc: '发布与上一条内容相同的日记', icon: 'fas fa-copy', color: '#8E8E93', obtained: false }
    ];
}

function initIcityBadges() {
    const badgeDefinitions = getBadgeDefinitions();

    if (!window.iphoneSimState.icityBadges) {
        window.iphoneSimState.icityBadges = [];
    }

    const savedStatus = {};
    if (window.iphoneSimState.icityBadges && Array.isArray(window.iphoneSimState.icityBadges)) {
        window.iphoneSimState.icityBadges.forEach(b => {
            savedStatus[b.id] = b.obtained;
        });
    }

    window.iphoneSimState.icityBadges = badgeDefinitions.map(def => {
        // Explicitly check for true to avoid undefined issues
        const isObtained = (savedStatus[def.id] === true) || def.obtained;
        // IMPORTANT: Do NOT include 'condition' function in the state object, 
        // as functions cannot be serialized by IndexedDB/localStorage.
        return {
            id: def.id,
            name: def.name,
            desc: def.desc,
            icon: def.icon,
            color: def.color,
            obtained: isObtained
        };
    });
}

function checkIcityAchievements() {
    if (!window.iphoneSimState.icityBadges) initIcityBadges();
    
    let changed = false;
    const state = window.iphoneSimState;
    const badgeDefinitions = getBadgeDefinitions();
    
    badgeDefinitions.forEach(def => {
        const badgeInState = state.icityBadges.find(b => b.id === def.id);
        
        if (badgeInState && !badgeInState.obtained && def.condition) {
            if (def.condition(state)) {
                badgeInState.obtained = true;
                changed = true;
                // Ideally show a toast notification here
                alert(`解锁新徽章：${badgeInState.name}`);
            }
        }
    });
    
    if (changed) saveConfig();
}

function openIcityBadges() {
    initIcityBadges();
    renderIcityBadges();
    document.getElementById('icity-badges-screen').classList.remove('hidden');
}

function renderIcityBadges() {
    const list = document.getElementById('icity-badges-list');
    const countEl = document.getElementById('icity-badges-count');
    const totalEl = document.getElementById('icity-badges-total');
    
    if (!list) return;
    
    list.innerHTML = '';
    const badges = window.iphoneSimState.icityBadges || [];
    
    if (countEl) countEl.textContent = badges.filter(b => b.obtained).length;
    if (totalEl) totalEl.textContent = badges.length;
    
    badges.forEach(badge => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'center';
        item.style.gap = '10px';
        item.style.opacity = badge.obtained ? '1' : '0.5';
        
        const iconColor = badge.obtained ? (badge.color || '#FF9500') : '#ccc';
        const borderColor = badge.obtained ? (badge.color || '#FF9500') : '#eee';
        
        const isEquipped = window.iphoneSimState.icityProfile && window.iphoneSimState.icityProfile.equippedBadgeId === badge.id;
        const borderStyle = isEquipped ? `2px solid ${badge.color || '#007AFF'}` : `2px solid ${borderColor}`;
        
        // Add glow if equipped
        const boxShadow = isEquipped ? `0 0 10px ${badge.color || '#007AFF'}` : 'none';
        
        item.innerHTML = `
            <div onclick="window.toggleEquipBadge('${badge.id}')" style="width: 60px; height: 60px; background: #f9f9f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: ${iconColor}; border: ${borderStyle}; box-shadow: ${boxShadow}; cursor: ${badge.obtained ? 'pointer' : 'default'}; position: relative; transition: all 0.3s ease;">
                <i class="${badge.icon}"></i>
                ${isEquipped ? `<div style="position: absolute; bottom: -5px; right: -5px; background: ${badge.color || '#007AFF'}; color: #fff; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px;"><i class="fas fa-check"></i></div>` : ''}
            </div>
            <div>
                <div style="font-weight: bold; font-size: 14px; color: ${badge.obtained ? '#333' : '#999'}">${badge.name}</div>
                <div style="font-size: 10px; color: #999;">${badge.desc}</div>
            </div>
        `;
        
        list.appendChild(item);
    });
}

function toggleEquipBadge(badgeId) {
    if (!window.iphoneSimState.icityProfile) return;
    
    const badge = window.iphoneSimState.icityBadges.find(b => b.id === badgeId);
    if (!badge || !badge.obtained) return;
    
    if (window.iphoneSimState.icityProfile.equippedBadgeId === badgeId) {
        // Unequip
        window.iphoneSimState.icityProfile.equippedBadgeId = null;
    } else {
        // Equip
        window.iphoneSimState.icityProfile.equippedBadgeId = badgeId;
    }
    
    saveConfig();
    renderIcityBadges();
    renderIcityProfile();
}

function openIcityTitles() {
    renderIcityTitles();
    document.getElementById('icity-titles-screen').classList.remove('hidden');
}

function renderIcityTitles() {
    const list = document.getElementById('icity-titles-list');
    if (!list) return;
    
    list.innerHTML = '';
    const titles = getIcityTitleDefinitions();
    
    titles.forEach(title => {
        const item = document.createElement('div');
        const isEquipped = window.iphoneSimState.icityProfile && window.iphoneSimState.icityProfile.equippedTitleId === title.id;
        const isCustom = title.id.startsWith('custom_');
        
        // Base style
        let style = title.style + ' padding: 8px 15px; border-radius: 20px; font-size: 14px; cursor: pointer; transition: all 0.2s ease; user-select: none; position: relative; display: flex; align-items: center; gap: 5px;';
        
        // Highlight if equipped
        if (isEquipped) {
            style += ' transform: scale(1.1); box-shadow: 0 4px 10px rgba(0,0,0,0.2); z-index: 1;';
        } else {
            style += ' opacity: 0.8;';
        }
        
        item.style.cssText = style;
        
        const textSpan = document.createElement('span');
        textSpan.textContent = title.text;
        item.appendChild(textSpan);
        
        if (isEquipped) {
            const checkIcon = document.createElement('i');
            checkIcon.className = 'fas fa-check';
            checkIcon.style.fontSize = '12px';
            item.appendChild(checkIcon);
        }

        if (isCustom) {
            const deleteIcon = document.createElement('i');
            deleteIcon.className = 'fas fa-times';
            deleteIcon.style.fontSize = '10px';
            deleteIcon.style.marginLeft = '5px';
            deleteIcon.style.opacity = '0.5';
            deleteIcon.onclick = (e) => {
                e.stopPropagation();
                deleteIcityTitle(title.id);
            };
            item.appendChild(deleteIcon);
        }
        
        item.onclick = () => equipIcityTitle(title.id);
        
        list.appendChild(item);
    });

    // Add Create Button
    const addBtn = document.createElement('div');
    addBtn.style.cssText = 'background: #fff; color: #007AFF; border: 1px dashed #007AFF; padding: 8px 15px; border-radius: 20px; font-size: 14px; cursor: pointer; opacity: 0.8; display: flex; align-items: center; gap: 5px;';
    addBtn.innerHTML = '<i class="fas fa-plus"></i> <span>自定义</span>';
    addBtn.onclick = handleCreateCustomTitle;
    list.appendChild(addBtn);
}

function handleCreateCustomTitle() {
    const text = prompt('请输入称号名称 (最多6个字):');
    if (!text) return;
    if (text.length > 6) {
        alert('称号太长啦，请控制在6个字以内');
        return;
    }

    const colorInput = prompt('请输入背景颜色 (例如: red, #FF0000, gold) - 留空则随机:', '');
    
    let style = '';
    if (colorInput) {
        // Simple heuristic for text color based on background logic is complex, 
        // so we'll default to white text for dark/saturated colors, or black for light.
        // For simplicity, we'll let user specify just bg, and we use a generic style.
        // Or we can try to be smart.
        // Let's just set the background and add a border.
        style = `background: ${colorInput}; color: #fff; border: none; text-shadow: 0 1px 2px rgba(0,0,0,0.3);`;
    } else {
        // Random preset style
        const colors = [
            '#FFCDD2', '#F8BBD0', '#E1BEE7', '#D1C4E9', '#C5CAE9', '#BBDEFB', '#B3E5FC', '#B2EBF2', '#B2DFDB', '#C8E6C9', '#DCEDC8', '#F0F4C3', '#FFECB3', '#FFE0B2', '#FFCCBC', '#D7CCC8', '#F5F5F5', '#CFD8DC'
        ];
        const randomBg = colors[Math.floor(Math.random() * colors.length)];
        style = `background: ${randomBg}; color: #333; border: 1px solid rgba(0,0,0,0.1);`;
    }

    const newTitle = {
        id: 'custom_' + Date.now(),
        text: text,
        style: style
    };

    if (!window.iphoneSimState.icityCustomTitles) {
        window.iphoneSimState.icityCustomTitles = [];
    }
    window.iphoneSimState.icityCustomTitles.push(newTitle);
    
    // Auto equip
    window.iphoneSimState.icityProfile.equippedTitleId = newTitle.id;
    
    saveConfig();
    renderIcityTitles();
    renderIcityProfile();
}

function deleteIcityTitle(id) {
    if (!confirm('确定删除这个称号吗？')) return;
    
    if (window.iphoneSimState.icityProfile.equippedTitleId === id) {
        window.iphoneSimState.icityProfile.equippedTitleId = null;
    }
    
    window.iphoneSimState.icityCustomTitles = window.iphoneSimState.icityCustomTitles.filter(t => t.id !== id);
    saveConfig();
    renderIcityTitles();
    renderIcityProfile();
}

function equipIcityTitle(id) {
    if (!window.iphoneSimState.icityProfile) {
        window.iphoneSimState.icityProfile = {};
    }
    
    // Toggle logic: if clicking already equipped, unequip it
    if (window.iphoneSimState.icityProfile.equippedTitleId === id) {
        window.iphoneSimState.icityProfile.equippedTitleId = null;
    } else {
        window.iphoneSimState.icityProfile.equippedTitleId = id;
    }
    
    saveConfig();
    renderIcityTitles();
    renderIcityProfile();
}

function openIcitySettings() {
    const contactsContainer = document.getElementById('icity-link-contacts-container');
    const wbSelect = document.getElementById('icity-link-wb');
    const customizationContainer = document.getElementById('icity-contact-customization-container');
    
    if (contactsContainer) {
        contactsContainer.innerHTML = '';
        if (window.iphoneSimState.contacts) {
            if (!window.iphoneSimState.icityProfile.linkedContactIds) {
                window.iphoneSimState.icityProfile.linkedContactIds = [];
                if (window.iphoneSimState.icityProfile.linkedContactId) {
                    window.iphoneSimState.icityProfile.linkedContactIds.push(window.iphoneSimState.icityProfile.linkedContactId);
                }
            }

            window.iphoneSimState.contacts.forEach(c => {
                const div = document.createElement('div');
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.marginBottom = '5px';
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = c.id;
                checkbox.id = `icity-contact-${c.id}`;
                checkbox.checked = window.iphoneSimState.icityProfile.linkedContactIds.includes(c.id);
                checkbox.style.marginRight = '8px';
                checkbox.addEventListener('change', () => {
                    renderIcityContactCustomization();
                });
                
                const label = document.createElement('label');
                label.htmlFor = `icity-contact-${c.id}`;
                label.textContent = c.name;
                label.style.cursor = 'pointer';
                
                div.appendChild(checkbox);
                div.appendChild(label);
                contactsContainer.appendChild(div);
            });
        }
    }
    
    if (customizationContainer) {
        renderIcityContactCustomization();
    }
    
    if (wbSelect) {
        wbSelect.innerHTML = '<option value="">-- 选择世界书 --</option>';
        if (window.iphoneSimState.wbCategories) {
            window.iphoneSimState.wbCategories.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                wbSelect.appendChild(opt);
            });
        }
        if (window.iphoneSimState.icityProfile.linkedWbId) {
            wbSelect.value = window.iphoneSimState.icityProfile.linkedWbId;
        }
    }
    
    document.getElementById('icity-settings-modal').classList.remove('hidden');
}

function saveIcitySettings() {
    const wbId = document.getElementById('icity-link-wb').value;
    
    if (!window.iphoneSimState.icityProfile) window.iphoneSimState.icityProfile = {};
    
    // Save multiple contacts
    const checkboxes = document.querySelectorAll('#icity-link-contacts-container input[type="checkbox"]');
    const selectedIds = Array.from(checkboxes).filter(cb => cb.checked).map(cb => {
        const val = Number(cb.value);
        return isNaN(val) ? cb.value : val;
    });
    
    window.iphoneSimState.icityProfile.linkedContactIds = selectedIds;
    window.iphoneSimState.icityProfile.linkedWbId = wbId || null;

    // Save customizations
    if (window.iphoneSimState.contacts) {
        selectedIds.forEach(id => {
            const contact = window.iphoneSimState.contacts.find(c => c.id === id);
            if (contact) {
                const nameInput = document.getElementById(`icity-custom-name-${id}`);
                const idInput = document.getElementById(`icity-custom-id-${id}`);
                // Avatars are handled by change event immediately, but inputs are here
                if (nameInput) {
                    if (!contact.icityData) contact.icityData = {};
                    contact.icityData.name = nameInput.value.trim();
                }
                if (idInput) {
                    if (!contact.icityData) contact.icityData = {};
                    contact.icityData.handle = idInput.value.trim();
                }
                
                // Save scheduled diary settings
                const autoDiaryToggle = document.getElementById(`icity-auto-diary-toggle-${id}`);
                const autoDiaryTime = document.getElementById(`icity-auto-diary-time-${id}`);
                
                if (autoDiaryToggle && autoDiaryTime) {
                    if (!contact.icityData) contact.icityData = {};
                    contact.icityData.autoDiaryEnabled = autoDiaryToggle.checked;
                    contact.icityData.autoDiaryTime = autoDiaryTime.value;
                }
            }
        });
    }
    
    saveConfig();
    document.getElementById('icity-settings-modal').classList.add('hidden');
    
    // Refresh UI
    renderIcityProfile();
    renderIcityFriends();
    renderIcityWorld(); // In case name change affects world view too?
}

function renderIcityContactCustomization() {
    const container = document.getElementById('icity-contact-customization-container');
    if (!container) return;
    
    // Get checked IDs
    const checkboxes = document.querySelectorAll('#icity-link-contacts-container input[type="checkbox"]');
    const checkedIds = Array.from(checkboxes).filter(cb => cb.checked).map(cb => Number(cb.value));
    
    container.innerHTML = '';
    
    if (checkedIds.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999; font-size: 12px;">请先勾选上方联系人</div>';
        return;
    }
    
    checkedIds.forEach(id => {
        const contact = window.iphoneSimState.contacts.find(c => c.id === id);
        if (!contact) return;
        
        const icityData = contact.icityData || {};
        
        const item = document.createElement('div');
        item.style.marginBottom = '15px';
        item.style.borderBottom = '1px dashed #eee';
        item.style.paddingBottom = '10px';
        
        const currentAvatar = icityData.avatar || contact.avatar || '';
        
        item.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px; color: #333;">${contact.name}</div>
            <div style="display: flex; gap: 10px; align-items: flex-start;">
                <div style="position: relative; width: 50px; height: 50px; flex-shrink: 0;">
                    <img src="${currentAvatar}" id="icity-custom-avatar-preview-${id}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid #ddd; cursor: pointer;">
                    <div style="position: absolute; bottom: 0; right: 0; background: #007AFF; color: #fff; width: 16px; height: 16px; border-radius: 50%; font-size: 10px; display: flex; align-items: center; justify-content: center; pointer-events: none;"><i class="fas fa-camera"></i></div>
                    <input type="file" id="icity-custom-avatar-input-${id}" accept="image/*" class="file-input-hidden">
                </div>
                <div style="flex: 1;">
                    <input type="text" id="icity-custom-name-${id}" placeholder="iCity 昵称" value="${icityData.name || contact.name}" style="width: 100%; margin-bottom: 5px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                    <input type="text" id="icity-custom-id-${id}" placeholder="iCity ID (@开头)" value="${icityData.handle || '@user' + id.toString().slice(-4)}" style="width: 100%; margin-bottom: 5px; padding: 5px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                    
                    <div style="background: #f9f9f9; padding: 8px; border-radius: 6px; margin-top: 5px;">
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                            <span style="font-size: 12px; color: #666;">定时写日记</span>
                            <label class="toggle-switch" style="transform: scale(0.8);">
                                <input type="checkbox" id="icity-auto-diary-toggle-${id}" ${icityData.autoDiaryEnabled ? 'checked' : ''}>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div style="display: flex; align-items: center; gap: 5px;">
                            <span style="font-size: 12px; color: #999;">时间:</span>
                            <input type="time" id="icity-auto-diary-time-${id}" value="${icityData.autoDiaryTime || '22:00'}" style="border: 1px solid #ddd; border-radius: 4px; font-size: 12px; padding: 2px;">
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(item);
        
        // Add event listener for image upload
        const img = item.querySelector(`#icity-custom-avatar-preview-${id}`);
        const fileInput = item.querySelector(`#icity-custom-avatar-input-${id}`);
        
        img.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                compressImage(file, 300, 0.7).then(base64 => {
                    if (!contact.icityData) contact.icityData = {};
                    contact.icityData.avatar = base64;
                    img.src = base64;
                    // Don't saveConfig here to avoid premature saving, but we update state.
                    // Actually saving is better to persist draft? No, stick to save button.
                    // But for base64 which is large, maybe better to keep in memory until save?
                    // We updated contact object in memory.
                });
            }
        });
    });
}

function handleIcitySend() {
    const textInput = document.getElementById('icity-compose-text');
    const visibilityBtn = document.getElementById('icity-visibility-btn');
    
    const content = textInput.value.trim();
    if (!content) {
        alert('请输入内容');
        return;
    }

    // Determine visibility from button content or state
    // We can infer from the icon class in the button
    let visibility = 'public';
    const iconClass = visibilityBtn.querySelector('i').className;
    if (iconClass.includes('fa-lock')) visibility = 'private';
    else if (iconClass.includes('fa-user-friends')) visibility = 'friends';
    else visibility = 'public';

    if (!window.iphoneSimState.icityDiaries) window.iphoneSimState.icityDiaries = [];
    
    const newDiary = {
        id: Date.now(),
        content: content,
        visibility: visibility,
        time: Date.now(),
        likes: 0,
        comments: 0
    };
    
    window.iphoneSimState.icityDiaries.unshift(newDiary);

    // Notify Linked Contacts (Context Injection)
    if (visibility === 'public' || visibility === 'friends') {
        const linkedIds = window.iphoneSimState.icityProfile.linkedContactIds || [];
        if (linkedIds.length === 0 && window.iphoneSimState.icityProfile.linkedContactId) {
            linkedIds.push(window.iphoneSimState.icityProfile.linkedContactId);
        }

        if (!window.iphoneSimState.chatHistory) window.iphoneSimState.chatHistory = {};

        linkedIds.forEach(id => {
            if (!window.iphoneSimState.chatHistory[id]) window.iphoneSimState.chatHistory[id] = [];
            
            window.iphoneSimState.chatHistory[id].push({
                role: 'system',
                type: 'system_event',
                content: `(用户发布了 iCity 日记: "${content}")`,
                time: Date.now()
            });
        });
    }
    
    // Check for 'Night Owl' or 'Early Bird'
    if (!window.iphoneSimState.icityBadges) initIcityBadges();
    const hour = new Date().getHours();
    
    const nightOwl = window.iphoneSimState.icityBadges.find(b => b.id === 'night_owl');
    if (nightOwl && !nightOwl.obtained && hour >= 0 && hour < 4) {
        nightOwl.obtained = true;
        alert(`解锁新徽章：${nightOwl.name}`);
    }
    
    const earlyBird = window.iphoneSimState.icityBadges.find(b => b.id === 'early_bird');
    if (earlyBird && !earlyBird.obtained && hour >= 5 && hour < 8) {
        earlyBird.obtained = true;
        alert(`解锁新徽章：${earlyBird.name}`);
    }

    const day = new Date().getDay();
    const weekendWarrior = window.iphoneSimState.icityBadges.find(b => b.id === 'weekend_warrior');
    if (weekendWarrior && !weekendWarrior.obtained && (day === 0 || day === 6)) {
        weekendWarrior.obtained = true;
        alert(`解锁新徽章：${weekendWarrior.name}`);
    }

    // New Badges Logic
    // Deep Thinker
    const deepThinker = window.iphoneSimState.icityBadges.find(b => b.id === 'deep_thinker');
    if (deepThinker && !deepThinker.obtained && content.length > 100) {
        deepThinker.obtained = true;
        alert(`解锁新徽章：${deepThinker.name}`);
    }

    // Minimalist
    const minimalist = window.iphoneSimState.icityBadges.find(b => b.id === 'minimalist');
    if (minimalist && !minimalist.obtained && content.length <= 2) {
        minimalist.obtained = true;
        alert(`解锁新徽章：${minimalist.name}`);
    }

    // Party Animal (Friday or Saturday 20:00-23:59)
    const partyAnimal = window.iphoneSimState.icityBadges.find(b => b.id === 'party_animal');
    if (partyAnimal && !partyAnimal.obtained && (day === 5 || day === 6) && hour >= 20) {
        partyAnimal.obtained = true;
        alert(`解锁新徽章：${partyAnimal.name}`);
    }

    // Monday Warrior (Monday 06:00-09:00)
    const mondayWarrior = window.iphoneSimState.icityBadges.find(b => b.id === 'monday_warrior');
    if (mondayWarrior && !mondayWarrior.obtained && day === 1 && hour >= 6 && hour < 9) {
        mondayWarrior.obtained = true;
        alert(`解锁新徽章：${mondayWarrior.name}`);
    }

    // Emoji Lover (Regex for emojis)
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/;
    const emojiLover = window.iphoneSimState.icityBadges.find(b => b.id === 'emoji_lover');
    if (emojiLover && !emojiLover.obtained && emojiRegex.test(content)) {
        emojiLover.obtained = true;
        alert(`解锁新徽章：${emojiLover.name}`);
    }

    // Questioner
    const questioner = window.iphoneSimState.icityBadges.find(b => b.id === 'questioner');
    if (questioner && !questioner.obtained && (content.includes('?') || content.includes('？'))) {
        questioner.obtained = true;
        alert(`解锁新徽章：${questioner.name}`);
    }

    // Positive Vibes
    const positiveVibes = window.iphoneSimState.icityBadges.find(b => b.id === 'positive_vibes');
    if (positiveVibes && !positiveVibes.obtained) {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('happy') || lowerContent.includes('good') || lowerContent.includes('love') || 
            content.includes('开心') || content.includes('快乐') || content.includes('爱')) {
            positiveVibes.obtained = true;
            alert(`解锁新徽章：${positiveVibes.name}`);
        }
    }

    // Storyteller (3 diaries today)
    const storyteller = window.iphoneSimState.icityBadges.find(b => b.id === 'storyteller');
    if (storyteller && !storyteller.obtained) {
        const today = new Date().setHours(0,0,0,0);
        const todayCount = window.iphoneSimState.icityDiaries.filter(d => d.time >= today).length;
        // Note: newDiary is already unshifted, so count includes current one
        if (todayCount >= 3) {
            storyteller.obtained = true;
            alert(`解锁新徽章：${storyteller.name}`);
        }
    }

    // Copycat (Identical to previous)
    const copycat = window.iphoneSimState.icityBadges.find(b => b.id === 'copycat');
    if (copycat && !copycat.obtained && window.iphoneSimState.icityDiaries.length >= 2) {
        // newDiary is at index 0, previous is at index 1
        const prevDiary = window.iphoneSimState.icityDiaries[1];
        if (prevDiary && prevDiary.content === content) {
            copycat.obtained = true;
            alert(`解锁新徽章：${copycat.name}`);
        }
    }

    checkIcityAchievements(); // Check count based achievements
    
    saveConfig();
    
    renderIcityDiaryList();
    if (!document.getElementById('icity-all-diaries-screen').classList.contains('hidden')) {
        renderIcityAllDiaries();
    }
    
    // Close and cleanup
    document.getElementById('icity-compose-modal').classList.add('hidden');
    textInput.value = '';

    // Generate Interactions
    if (visibility === 'public') {
        setTimeout(() => {
            generateIcityInteractions(newDiary);
        }, 3000);
        setTimeout(() => {
            generateContactComments(newDiary);
        }, 5000);
    } else if (visibility === 'friends') {
        setTimeout(() => {
            generateContactComments(newDiary);
        }, 3000);
    }
}

async function generateContactComments(diary) {
    const linkedIds = window.iphoneSimState.icityProfile.linkedContactIds || [];
    if (linkedIds.length === 0 && window.iphoneSimState.icityProfile.linkedContactId) {
        linkedIds.push(window.iphoneSimState.icityProfile.linkedContactId);
    }
    
    if (linkedIds.length === 0) return;
    
    const contacts = window.iphoneSimState.contacts.filter(c => linkedIds.includes(c.id));
    if (contacts.length === 0) return;

    try {
        const comments = await callAiForContactComments(diary, contacts);
        if (comments && comments.length > 0) {
            const targetDiary = window.iphoneSimState.icityDiaries.find(d => d.id === diary.id);
            if (targetDiary) {
                if (!targetDiary.commentsList) targetDiary.commentsList = [];
                
                comments.forEach(c => {
                    targetDiary.commentsList.push({
                        id: Date.now() + Math.random(),
                        name: c.name, // Display name
                        content: c.content,
                        time: Date.now()
                    });

                    // 让联系人“记住”自己评论了什么
                    // Find the contact object that corresponds to this comment
                    const contact = contacts.find(ct => {
                        const dName = (ct.icityData && ct.icityData.name) ? ct.icityData.name : ct.name;
                        return dName === c.name;
                    });

                    if (contact) {
                        if (!window.iphoneSimState.chatHistory) window.iphoneSimState.chatHistory = {};
                        if (!window.iphoneSimState.chatHistory[contact.id]) window.iphoneSimState.chatHistory[contact.id] = [];
                        
                        window.iphoneSimState.chatHistory[contact.id].push({
                            role: 'system',
                            type: 'system_event',
                            content: `(你在iCity评论了用户的日记: "${c.content}")`,
                            time: Date.now()
                        });
                    }
                });
                
                targetDiary.comments = (targetDiary.comments || 0) + comments.length;
                saveConfig();
                renderIcityDiaryList();
                // If detail screen is open, refresh it
                const detailScreen = document.getElementById('icity-detail-screen');
                if (detailScreen && !detailScreen.classList.contains('hidden')) {
                     // Simple check to see if we are viewing the same diary
                     // In a real app we'd check ID, but openIcityDiaryDetail sets content directly.
                     // We can just re-open it if the content matches or if we store current ID globally.
                     // Ideally we should store currentDetailId. For now, let's just refresh if open.
                     // Actually, openIcityDiaryDetail takes an ID.
                     openIcityDiaryDetail(diary.id, 'diary'); 
                }
            }
        }
    } catch (e) {
        console.error("Failed to generate contact comments", e);
    }
}

async function callAiForContactComments(diary, contacts) {
    const contextData = [];
    
    for (const contact of contacts) {
        // Use custom iCity name if available
        const displayName = (contact.icityData && contact.icityData.name) ? contact.icityData.name : contact.name;
        
        // Chat History
        const history = window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contact.id] ? window.iphoneSimState.chatHistory[contact.id].slice(-10) : [];
        const chatContext = history.map(m => `${m.role === 'user' ? '用户' : '我'}: ${m.content}`).join('\n');
        
        // Memories
        const memories = window.iphoneSimState.memories ? window.iphoneSimState.memories.filter(m => m.contactId === contact.id).slice(-5) : [];
        const memoryContext = memories.map(m => m.content).join('\n');

        const recentPosts = (window.iphoneSimState.icityFriendsPosts || [])
            .filter(post => post.contactId === contact.id)
            .slice(0, 5)
            .map(post => String(post.content || '').trim())
            .filter(Boolean)
            .join('\n');
        
        // Worldbook
        let wbContext = '';
        if (contact.linkedWbCategories && contact.linkedWbCategories.length > 0) {
             const entries = window.iphoneSimState.worldbook ? window.iphoneSimState.worldbook.filter(e => contact.linkedWbCategories.includes(e.categoryId) && e.enabled) : [];
             const contactWb = entries.map(e => e.content).join('\n').slice(0, 500);
             if (contactWb) wbContext += '\n' + contactWb;
        }
        
        contextData.push({
            name: displayName,
            originalName: contact.name,
            persona: contact.persona || '无',
            chat: chatContext,
            memory: memoryContext,
            wb: wbContext,
            recentPosts: recentPosts
        });
    }

    const contextStr = contextData.map(d => `
【角色: ${d.name}】
人设: ${d.persona}
最近聊天片段:
${d.chat}
重要记忆:
${d.memory}
世界观背景:
${d.wb}
RECENT_ICITY_POSTS:
${d.recentPosts || 'none'}
`).join('\n--------------------------------\n');

    const prompt = `用户在朋友圈/iCity发布了一条动态：
"${diary.content}"

请让以下角色对这条动态进行评论。
${contextStr}

要求：
1. 为每个角色生成一条评论。
2. 评论内容要符合角色人设，**必须结合最近的聊天上下文、重要记忆和世界观背景**。不要出现与记忆相悖的内容。
3. 语气要像在社交媒体上互动，口语化。
4. **严禁**输出 "BAKA"、"baka" 等词汇。
5. 严格返回 JSON 数组格式。

格式示例：
[
    {
        "name": "角色名",
        "content": "评论内容"
    }
]`;

    const messages = [{ role: 'user', content: prompt }];
    const content = await safeCallAiApi(messages);
    
    try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error("Parse error", e);
    }
    return [];
}

async function generateIcityInteractions(diary) {
    const followers = window.iphoneSimState.icityProfile.followers || 0;
    
    // 1. Calculate Likes based on followers
    // Base 0-5 + 10%-30% of followers
    const baseLikes = Math.floor(Math.random() * 5);
    const followerLikes = Math.floor(followers * (0.1 + Math.random() * 0.2));
    const newLikes = baseLikes + followerLikes;
    
    setTimeout(() => {
        const targetDiary = window.iphoneSimState.icityDiaries.find(d => d.id === diary.id);
        if (targetDiary) {
            targetDiary.likes = (targetDiary.likes || 0) + newLikes;
            if (!window.iphoneSimState.icityProfile.totalLikes) window.iphoneSimState.icityProfile.totalLikes = 0;
            window.iphoneSimState.icityProfile.totalLikes += newLikes;
            
            // Generate Mock Likers for the Like Page
            if (newLikes > 0) {
                if (!window.iphoneSimState.icityLikes) window.iphoneSimState.icityLikes = [];
                const likerCount = Math.min(newLikes, 5); 
                for(let i=0; i<likerCount; i++) {
                    const names = ["momo", "Lulala", "Kiki", "Jia", "Cloud", "Seven", "Zero", "Echo", "Nana", "Vivi"];
                    const name = names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random()*100);
                    
                    window.iphoneSimState.icityLikes.unshift({
                        id: Date.now() + Math.random(),
                        name: name,
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
                        time: Date.now(),
                        diaryId: diary.id
                    });
                }
                if (window.iphoneSimState.icityLikes.length > 50) {
                    window.iphoneSimState.icityLikes = window.iphoneSimState.icityLikes.slice(0, 50);
                }
            }

            saveConfig();
            renderIcityDiaryList(); // Refresh list to show like
            renderIcityProfile(); // Refresh profile to show total likes
            const likesTab = document.getElementById('icity-likes-list');
            if (likesTab && likesTab.style.display !== 'none') {
                renderIcityLikes();
            }
        }
    }, 2000);

    // 2. NPC Follow Logic
    // Chance to gain new followers: 50% + small bonus based on content length?
    // Let's say randomly gain 0-3 followers per post usually
    const gainedFollowers = Math.floor(Math.random() * 4); // 0 to 3
    if (gainedFollowers > 0) {
        setTimeout(() => {
            window.iphoneSimState.icityProfile.followers = (window.iphoneSimState.icityProfile.followers || 0) + gainedFollowers;
            saveConfig();
            renderIcityProfile();
            // Optional: Notification?
        }, 3000);
    }

    // 3. Generate Comments & DMs via AI
    // DMs: 2-4
    const dmCount = Math.floor(Math.random() * 3) + 2; // 2, 3, or 4
    
    // Comments: Base 0-2 + 1%-5% of followers (but limit AI calls)
    // We will generate 1-3 actual comments via AI, and if the count should be higher, we just bump the number.
    const followerComments = Math.floor(followers * (0.01 + Math.random() * 0.04));
    const aiCommentCount = Math.min(3, 1 + Math.floor(Math.random() * 2)); // 1 to 3 AI comments
    const totalComments = Math.max(aiCommentCount, followerComments); // Ensure at least AI ones

    try {
        const notification = document.getElementById('summary-notification');
        const notificationText = document.getElementById('summary-notification-text');
        if (notification && notificationText) {
            notificationText.textContent = '正在生成互动...';
            notification.classList.remove('hidden');
        }

        const myName = (window.iphoneSimState.icityProfile && window.iphoneSimState.icityProfile.nickname) || 'Kaneki';

        const prompt = `用户在潮流社交APP（类似小红书/Instagram/即刻）发布了一篇日记：
"${diary.content}"

请模拟真实的互联网用户（Z世代、00后），生成以下互动内容。请务必拒绝“人机感”，内容要**极其生活化、口语化**。

【风格要求】
1. **网名**：**请务必发挥创意，生成极具个性的网名，严禁重复使用常见的名字（如 momo, user, admin）**。
   - 风格可以多样化：
     - 英文ID（如 "cameron", "lost_stars", "whosyourdaddy"）
     - 抽象/搞笑中文（如 "玛卡巴卡", "一般路过群众", "想吃火锅"）
     - 文艺/emo（如 "也就是几分钟", "海边听风", "Last Dance"）
     - 极简/符号（如 "...", "ERROR 404", "ㅤ"）
     - 带 Emoji 的组合（如 "是猫猫呀🐱", "P.J 🏀"）
   - 请确保每次生成的网名都感觉像是不同的人。
2. **语气**：不要像客服或机器人。要口语化、带网感。可以使用流行梗、颜文字、缩写。不要太书面。
3. **评论**：
   - 可以是简短的吐槽、共鸣（"演我"）、夸奖（"好美！"）。
   - 可以只发emoji，或者很短的一句话。
   - 甚至可以稍微有点阴阳怪气或无厘头。
   - **重要**：请在部分评论中加入艾特用户的行为，例如 "@${myName}"，表示在跟博主互动。
4. **私信**：
   - 不要用“你好，我看到了你的动态...”这种正式开场白。
   - 就像朋友一样直接说话，或者像是在搭讪。例如：“姐妹这个哪里买的”、“笑死我了”、“dd”、“求图”。
   - **严禁**输出 "BAKA"、"baka" 等词汇。

【生成任务】
1. 生成 ${aiCommentCount} 条评论。
2. 生成 ${dmCount} 条私信（DMs）。

请严格返回以下 JSON 格式（gender字段必填）：
{
    "comments": [
        { "name": "网名", "content": "评论内容", "gender": "male" },
        ...
    ],
    "dms": [
        { "name": "网名", "content": "私信内容", "gender": "female" },
        ...
    ]
}`;
        
        const messages = [{ role: 'user', content: prompt }];
        const responseContent = await safeCallAiApi(messages);
        
        if (notification) {
            notification.classList.add('hidden');
        }
        
        let data = null;
        try {
            const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                data = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {}

        if (data) {
            const targetDiary = window.iphoneSimState.icityDiaries.find(d => d.id === diary.id);
            
            // Add Comments
            if (data.comments && Array.isArray(data.comments)) {
                if (targetDiary) {
                    if (!targetDiary.commentsList) targetDiary.commentsList = [];
                    
                    data.comments.forEach(c => {
                        const commentId = Date.now() + Math.random();
                        targetDiary.commentsList.push({
                            id: commentId,
                            name: c.name,
                            content: c.content,
                            time: Date.now()
                        });

                        // Add to Notifications
                        if (!window.iphoneSimState.icityNotifications) window.iphoneSimState.icityNotifications = [];
                        window.iphoneSimState.icityNotifications.unshift({
                            id: Date.now() + Math.random(),
                            name: c.name,
                            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`,
                            content: c.content,
                            time: Date.now(),
                            diaryId: diary.id,
                            commentId: commentId
                        });
                    });
                    
                    // Limit notification history
                    if (window.iphoneSimState.icityNotifications.length > 50) {
                        window.iphoneSimState.icityNotifications = window.iphoneSimState.icityNotifications.slice(0, 50);
                    }
                    
                    // If totalComments is higher than what we generated, assume "ghost" comments
                    targetDiary.comments = (targetDiary.comments || 0) + Math.max(data.comments.length, totalComments);
                    saveConfig();
                    renderIcityDiaryList();
                    
                    // Refresh notification tab if active
                    const notifTab = document.getElementById('icity-notifications-list');
                    if (notifTab && notifTab.style.display !== 'none') {
                        renderIcityNotifications();
                    }
                }
            }

            // Add Messages
            if (data.dms && Array.isArray(data.dms)) {
                if (!window.iphoneSimState.icityMessages) window.iphoneSimState.icityMessages = [];
                
                data.dms.forEach(dm => {
                    let gender = 'unknown';
                    if (dm.gender) {
                        const g = String(dm.gender).toLowerCase();
                        if (g.includes('男') || g === 'male' || g === 'm') gender = 'male';
                        else if (g.includes('女') || g === 'female' || g === 'f') gender = 'female';
                    }
                    
                    // Fallback: Randomly assign if unknown, to ensure consistent persona later
                    if (gender === 'unknown') {
                        gender = Math.random() < 0.5 ? 'male' : 'female';
                    }

                    const newMessage = {
                        id: Date.now() + Math.random(),
                        sender: dm.name,
                        handle: '@' + Math.random().toString(36).substring(7),
                        content: dm.content,
                        time: Date.now(),
                        diaryId: diary.id,
                        read: false,
                        type: 'stranger',
                        gender: gender
                    };
                    window.iphoneSimState.icityMessages.unshift(newMessage);
                });
                
                saveConfig();
                
                // If on messages tab, refresh
                const messagesTab = document.getElementById('icity-tab-content-messages');
                if (messagesTab && messagesTab.style.display !== 'none') {
                    renderIcityMessages();
                } else {
                    // Maybe show a badge on the tab?
                    // Simplified: just refresh if open.
                }
            }
        }

    } catch (e) {
        console.error("Failed to generate interactions", e);
        if (document.getElementById('summary-notification')) {
            document.getElementById('summary-notification').classList.add('hidden');
        }
    }
}

// Message Selection Mode State
window.icityMessageSelectionMode = false;
window.selectedIcityMessageIds = new Set();

function openStrangerChat(name, handle, avatar, contactId) {
    // 1. Close Profile Screen
    document.getElementById('icity-stranger-profile-screen').classList.add('hidden');
    
    // 2. Switch to Messages Tab
    switchIcityTab('messages');
    
    // 3. Find existing chat or create new one
    // Try to find chat by contactId or name
    let existingChat = null;
    if (window.iphoneSimState.icityMessages) {
        existingChat = window.iphoneSimState.icityMessages.find(m => {
            // Check if it's a stranger chat type and matches name
            return m.type === 'stranger' && m.sender === name;
        });
    }
    
    if (existingChat) {
        openIcityMessageDetail(existingChat);
    } else {
        // Create new chat entry
        if (!window.iphoneSimState.icityMessages) window.iphoneSimState.icityMessages = [];
        
        const newChat = {
            id: Date.now(),
            sender: name,
            handle: handle || '@user',
            avatar: avatar, // Store avatar if available
            content: '已开始聊天',
            time: Date.now(),
            read: true,
            type: 'stranger',
            history: [] // Empty history
        };
        
        window.iphoneSimState.icityMessages.unshift(newChat);
        saveConfig();
        
        // Render list to update view
        renderIcityMessages();
        
        // Open detail
        openIcityMessageDetail(newChat);
    }
}
window.openStrangerChat = openStrangerChat;

function renderIcityMessages() {
    const list = document.getElementById('icity-messages-list');
    const empty = document.getElementById('icity-messages-empty');
    if (!list) return;

    const messages = window.iphoneSimState.icityMessages || [];
    
    if (messages.length === 0) {
        list.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
    }
    
    if (empty) empty.style.display = 'none';
    list.innerHTML = '';

    messages.forEach(msg => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center'; // Align center for checkbox
        item.style.padding = '15px';
        item.style.borderBottom = '1px solid #f0f0f0';
        item.style.cursor = 'pointer';
        item.style.backgroundColor = '#fff';
        item.style.transition = 'all 0.3s ease';

        // Selection Checkbox (Hidden by default)
        if (window.icityMessageSelectionMode) {
            const isSelected = window.selectedIcityMessageIds.has(msg.id);
            const checkboxHtml = `
                <div style="margin-right: 15px; width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${isSelected ? '#007AFF' : '#ccc'}; background: ${isSelected ? '#007AFF' : 'transparent'}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    ${isSelected ? '<i class="fas fa-check" style="color: #fff; font-size: 14px;"></i>' : ''}
                </div>
            `;
            item.innerHTML = checkboxHtml;
        }

        // Time logic
        let timeStr = '刚刚';
        const diff = Date.now() - msg.time;
        if (diff < 60000) timeStr = '刚刚';
        else if (diff < 3600000) timeStr = Math.floor(diff/60000) + '分钟前';
        else if (diff < 86400000) timeStr = Math.floor(diff/3600000) + '小时前';
        else timeStr = '1天前'; 

        const contentHtml = `
            <div style="width: 50px; height: 50px; border-radius: 50%; background: #ccc; margin-right: 15px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px; flex-shrink: 0; cursor: pointer;" onclick="event.stopPropagation(); window.openIcityStrangerProfile('${msg.sender}', null, '${msg.handle || ''}', null)">
                <i class="fas fa-user"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-weight: bold; font-size: 16px; color: #333;">${msg.sender}${msg.gender === 'male' ? '<span style="color:#007AFF;font-size:14px;margin-left:4px;vertical-align:3px;">♂</span>' : (msg.gender === 'female' ? '<span style="color:#FF2D55;font-size:14px;margin-left:4px;vertical-align:3px;">♀</span>' : '')}</span>
                    <span style="font-size: 12px; color: #ccc;">${timeStr}</span>
                </div>
                <div style="font-size: 14px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${msg.content}
                </div>
            </div>
        `;
        
        item.innerHTML += contentHtml;

        // Event Listeners
        if (window.icityMessageSelectionMode) {
            item.onclick = (e) => {
                e.stopPropagation();
                toggleIcityMessageSelection(msg.id);
            };
        } else {
            item.onclick = () => openIcityMessageDetail(msg);
            
            // Long Press Logic
            let pressTimer;
            const startPress = () => {
                pressTimer = setTimeout(() => {
                    enterIcityMessageSelectionMode(msg.id);
                }, 600); // 600ms for long press
            };
            const cancelPress = () => {
                clearTimeout(pressTimer);
            };

            item.addEventListener('touchstart', startPress);
            item.addEventListener('touchend', cancelPress);
            item.addEventListener('touchmove', cancelPress);
            item.addEventListener('mousedown', startPress);
            item.addEventListener('mouseup', cancelPress);
            item.addEventListener('mouseleave', cancelPress);
        }

        list.appendChild(item);
    });
}

function enterIcityMessageSelectionMode(initialId) {
    if (window.icityMessageSelectionMode) return;
    
    window.icityMessageSelectionMode = true;
    window.selectedIcityMessageIds = new Set();
    if (initialId) window.selectedIcityMessageIds.add(initialId);
    
    updateIcityMessageHeader();
    renderIcityMessages();
    
    // Haptic feedback if supported (simulated)
    if (navigator.vibrate) navigator.vibrate(50);
}

function exitIcityMessageSelectionMode() {
    window.icityMessageSelectionMode = false;
    window.selectedIcityMessageIds = new Set();
    
    updateIcityMessageHeader();
    renderIcityMessages();
}

function toggleIcityMessageSelection(id) {
    if (window.selectedIcityMessageIds.has(id)) {
        window.selectedIcityMessageIds.delete(id);
    } else {
        window.selectedIcityMessageIds.add(id);
    }
    
    updateIcityMessageHeader(); // Update count
    renderIcityMessages(); // Refresh UI
}

function deleteSelectedIcityMessages() {
    if (window.selectedIcityMessageIds.size === 0) return;
    
    if (!confirm(`确定删除这 ${window.selectedIcityMessageIds.size} 条对话吗？`)) return;
    
    window.iphoneSimState.icityMessages = window.iphoneSimState.icityMessages.filter(
        msg => !window.selectedIcityMessageIds.has(msg.id)
    );
    
    saveConfig();
    exitIcityMessageSelectionMode();
}

function updateIcityMessageHeader() {
    const header = document.querySelector('#icity-tab-content-messages .app-header');
    if (!header) return;
    
    if (window.icityMessageSelectionMode) {
        const count = window.selectedIcityMessageIds.size;
        header.innerHTML = `
            <button onclick="window.exitIcityMessageSelectionMode()" style="position: absolute; left: 15px; background: none; border: none; font-size: 16px; color: #333; cursor: pointer;">取消</button>
            <div style="font-weight: bold; font-size: 16px;">已选择 ${count}</div>
            <button onclick="window.deleteSelectedIcityMessages()" style="position: absolute; right: 15px; background: none; border: none; font-size: 16px; color: ${count > 0 ? '#FF3B30' : '#ccc'}; cursor: pointer;" ${count === 0 ? 'disabled' : ''}>删除</button>
        `;
    } else {
        // Restore default header
        header.innerHTML = `
            <div style="display: flex; background: #f0f0f0; border-radius: 8px; padding: 2px;">
                <div style="padding: 4px 15px; font-size: 14px; color: #666; cursor: pointer;">通讯录</div>
                <div style="padding: 4px 15px; font-size: 14px; font-weight: bold; background: #fff; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); cursor: pointer;">私信</div>
            </div>
            <button style="position: absolute; right: 15px; background: none; border: none; font-size: 20px; color: #666;"><i class="far fa-plus-square"></i></button>
        `;
    }
}

// Make globally accessible
window.enterIcityMessageSelectionMode = enterIcityMessageSelectionMode;
window.exitIcityMessageSelectionMode = exitIcityMessageSelectionMode;
window.toggleIcityMessageSelection = toggleIcityMessageSelection;
window.deleteSelectedIcityMessages = deleteSelectedIcityMessages;

function openIcityMessageDetail(msg) {
    window.currentOpenIcityMessageId = msg.id;
    
    const screen = document.getElementById('icity-message-detail-screen');
    const nameEl = document.getElementById('icity-message-detail-name');
    const handleEl = document.getElementById('icity-message-detail-handle');
    const backBtn = document.getElementById('close-icity-message-detail');

    if (nameEl) {
        const genderHtml = msg.gender === 'male' ? '<span style="color:#007AFF;font-size:16px;margin-left:4px;vertical-align:3px;">♂</span>' : (msg.gender === 'female' ? '<span style="color:#FF2D55;font-size:16px;margin-left:4px;vertical-align:3px;">♀</span>' : '');
        nameEl.innerHTML = msg.sender + genderHtml;
    }
    if (handleEl) handleEl.textContent = msg.handle;
    
    // Initialize history if needed
    if (!msg.history) {
        msg.history = [
            { role: 'stranger', content: msg.content, time: msg.time }
        ];
    }
    
    renderIcityMessageDetailList(msg);

    if (backBtn) {
        backBtn.onclick = () => {
            screen.classList.add('hidden');
            window.currentOpenIcityMessageId = null;
        };
    }

    screen.classList.remove('hidden');
}

function renderIcityMessageDetailList(msg) {
    const listEl = document.getElementById('icity-message-detail-list');
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    // Get user avatar for "Me" messages
    const userAvatar = (window.iphoneSimState.icityProfile && window.iphoneSimState.icityProfile.avatar) ? window.iphoneSimState.icityProfile.avatar : '';

    msg.history.forEach((item, index) => {
        // Date Label logic (simplified: show for first message)
        if (index === 0) {
            const dateDiv = document.createElement('div');
            dateDiv.style.textAlign = 'center';
            dateDiv.style.color = '#ccc';
            dateDiv.style.fontSize = '12px';
            dateDiv.style.marginBottom = '20px';
            dateDiv.innerText = new Date(item.time).toLocaleDateString() + ' ' + new Date(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            listEl.appendChild(dateDiv);
        }

        const isMe = item.role === 'me' || item.role === 'user';
        const msgDiv = document.createElement('div');
        msgDiv.className = `icity-msg-row ${isMe ? 'me' : 'other'}`;
        
        let avatarStyle = '';
        let avatarInner = '';
        let otherAvatar = '';

        if (isMe) {
            if (userAvatar) {
                avatarStyle = `background-image: url('${userAvatar}'); background-color: transparent;`;
            } else {
                avatarStyle = `background-color: #000;`;
            }
        } else {
            // Check if we can find avatar from contacts
            // if (msg.avatar) otherAvatar = msg.avatar; // Force default gray for strangers
            // Also check contact list if handle matches or name matches
            if (!otherAvatar && window.iphoneSimState.contacts) {
                const c = window.iphoneSimState.contacts.find(c => c.name === msg.sender || (c.icityData && c.icityData.handle === msg.handle));
                if (c) {
                    if (c.icityData && c.icityData.avatar) otherAvatar = c.icityData.avatar;
                    else if (c.avatar) otherAvatar = c.avatar;
                }
            }

            if (otherAvatar) {
                avatarStyle = `background-image: url('${otherAvatar}'); background-color: transparent;`;
            } else {
                avatarStyle = `background-color: #ccc;`;
                avatarInner = `<i class="fas fa-user"></i>`;
            }
        }
        
        if (isMe) {
            msgDiv.innerHTML = `
                <div class="icity-bubble me">
                    ${item.content}
                </div>
                <div class="icity-avatar" style="${avatarStyle}">
                    ${avatarInner}
                </div>
            `;
        } else {
            msgDiv.innerHTML = `
                <div class="icity-avatar" style="${avatarStyle}; cursor: pointer;" onclick="event.stopPropagation(); window.openIcityStrangerProfile('${msg.sender}', '${otherAvatar || ''}', '${msg.handle || ''}', null)">
                    ${avatarInner}
                </div>
                <div class="icity-bubble other">
                    ${item.content}
                </div>
            `;
        }
        listEl.appendChild(msgDiv);
    });
    
    // Scroll to bottom
    setTimeout(() => {
        const body = document.getElementById('icity-message-detail-body');
        if (body) body.scrollTop = body.scrollHeight;
    }, 100);
}

async function handleIcityMessageSend(triggerAi = true) {
    const input = document.getElementById('icity-message-input');
    const content = input.value.trim();
    
    if (!content && !triggerAi) return;
    
    if (!window.currentOpenIcityMessageId) return;
    
    const msgObj = window.iphoneSimState.icityMessages.find(m => m.id === window.currentOpenIcityMessageId);
    if (!msgObj) return;
    
    // 1. Add User Message
    if (content) {
        if (!msgObj.history) msgObj.history = [];
        msgObj.history.push({
            role: 'me',
            content: content,
            time: Date.now()
        });
        
        // Update preview
        msgObj.content = content;
        msgObj.time = Date.now();
        
        input.value = '';
        renderIcityMessageDetailList(msgObj);
        saveConfig();
        renderIcityMessages(); // Update list view order/preview

        // Check for WeChat ID (Friend Request Trigger)
        const userWxId = window.iphoneSimState.userProfile ? window.iphoneSimState.userProfile.wxid : null;
        if (userWxId && content === userWxId) {
            // Trigger Friend Request Flow
            triggerAi = false; // Override default AI flow
            handleWeChatFriendRequestFlow(msgObj, content);
            return;
        }
    }
    
    // 2. Generate AI Reply
    if (triggerAi) {
        try {
            const historyContext = msgObj.history.slice(-10).map(h => 
                `${h.role === 'me' ? '我' : '对方'}: ${h.content}`
            ).join('\n');
            
            const prompt = `你正在扮演一个网络用户（${msgObj.sender}），正在与“我”进行私信聊天。
以下是聊天记录：
${historyContext}

请回复“我”的上一条消息。
要求：
1. 保持人设（${msgObj.sender}），语气口语化、生活化、像真人。
2. 回复不要太长，符合聊天习惯。
3. **严禁**输出 "BAKA"、"baka" 等词汇。
4. 只返回回复内容，不要包含其他文字。`;

            const messages = [{ role: 'user', content: prompt }];
            
            // Show typing indicator
            const nameEl = document.getElementById('icity-message-detail-name');
            if (nameEl) nameEl.textContent = '对方正在输入中...';

            const responseContent = await safeCallAiApi(messages);
            
            // Restore name
            if (nameEl) nameEl.textContent = msgObj.sender;

            if (responseContent) {
                if (!msgObj.history) msgObj.history = [];
                msgObj.history.push({
                    role: 'stranger',
                    content: responseContent,
                    time: Date.now()
                });
                msgObj.content = responseContent; // Update preview to latest
                msgObj.time = Date.now();
                
                saveConfig();
                if (window.currentOpenIcityMessageId === msgObj.id) {
                    renderIcityMessageDetailList(msgObj);
                }
                renderIcityMessages();
            }
            
        } catch (e) {
            console.error("Failed to generate reply", e);
            // Restore name on error
            const nameEl = document.getElementById('icity-message-detail-name');
            if (nameEl) nameEl.textContent = msgObj.sender;
        }
    }
}

function renderIcityBooks() {
    const list = document.getElementById('icity-books-list');
    if (!list) return;
    
    list.innerHTML = '';
    const books = window.iphoneSimState.icityBooks || [];
    
    if (books.length === 0) {
        list.innerHTML = '<div style="width: 100%; text-align: center; color: #999;">暂无书籍</div>';
        return;
    }
    
    // Ensure correct container style
    list.style.display = 'flex';
    list.style.gap = '20px'; // Add gap
    list.style.padding = '0'; // Reset padding
    list.style.alignItems = 'center';
    list.style.overflowX = 'auto';
    list.style.scrollSnapType = 'x mandatory';

    // Add spacer for centering first item (subtracting gap)
    const spacerLeft = document.createElement('div');
    // Screen Center (50%) - Half Item (100px) - Gap (20px) = Start offset
    // Note: Flex gap applies before the first item if there is a spacer?
    // Flex gap applies BETWEEN items.
    // [Spacer] <gap> [Item1]
    // Spacer Width + Gap + ItemWidth/2 = 50%
    // Spacer Width = 50% - 100px - 20px
    spacerLeft.style.minWidth = 'calc(50% - 120px)'; 
    spacerLeft.style.flexShrink = '0';
    list.appendChild(spacerLeft);

    books.forEach(book => {
        const item = document.createElement('div');
        item.className = 'icity-book-item';
        item.style.cssText = `
            flex-shrink: 0;
            width: 200px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
            scroll-snap-align: center;
            transition: transform 0.2s ease;
            transform-origin: center center;
        `;
        
        // Cover Style
        let coverHtml = '';
        if (book.cover) {
            // Remove border-radius here, let container handle it
            coverHtml = `<div style="width: 100%; height: 100%; border-radius: 2px 6px 6px 2px; background-image: url('${book.cover}'); background-size: cover; background-position: center; box-shadow: inset 3px 0 10px rgba(0,0,0,0.1);"></div>`;
        } else {
            // Default gray cover with title
            // Remove border-radius here too
            coverHtml = `
                <div style="width: 100%; height: 100%; border-radius: 2px 6px 6px 2px; background-color: #8e8e93; display: flex; align-items: center; justify-content: center; padding: 15px; box-sizing: border-box; box-shadow: inset 3px 0 10px rgba(0,0,0,0.1);">
                    <div style="color: #fff; font-size: 18px; font-weight: bold; text-align: center; line-height: 1.4; word-break: break-all; text-shadow: 0 1px 2px rgba(0,0,0,0.3); font-family: 'Times New Roman', serif;">
                        ${book.name}
                    </div>
                </div>
            `;
        }

        // Structure
        item.innerHTML = `
            <div style="width: 100%; aspect-ratio: 3/4; position: relative; margin-bottom: 15px; transform: translateZ(0);">
                
                <!-- Independent Shadow Layer (Behind) -->
                <div style="position: absolute; inset: 0; border-radius: 2px 6px 6px 2px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); pointer-events: none; z-index: 1;"></div>

                <!-- Main Cover Container (Clipped Content) -->
                <div class="book-cover-container" style="width: 100%; height: 100%; border-radius: 2px 6px 6px 2px; overflow: hidden; position: relative; z-index: 2; background-color: transparent; clip-path: inset(0 round 2px 6px 6px 2px);">
                    ${coverHtml}
                    <!-- Spine Highlight -->
                    <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 15px; background: linear-gradient(to right, rgba(255,255,255,0.25), rgba(0,0,0,0)); pointer-events: none;"></div>
                    <!-- Spine Shadow Line -->
                    <div style="position: absolute; left: 6px; top: 0; bottom: 0; width: 1px; background: rgba(0,0,0,0.1); pointer-events: none;"></div>
                    <!-- Inner Shadow for depth -->
                    <div style="position: absolute; inset: 0; box-shadow: inset 0 0 2px rgba(0,0,0,0.1); pointer-events: none;"></div>
                </div>

                <!-- Shadow (Behind) -->
                <div style="position: absolute; bottom: 2px; left: 5%; width: 90%; height: 10px; background: rgba(0,0,0,0.25); filter: blur(6px); z-index: 0; transform: translateY(4px);"></div>
            </div>
            
            <!-- Label below book (only if cover exists, otherwise title is on cover) -->
            ${book.cover ? `<div style="font-size: 14px; font-weight: 500; color: #333; text-align: center; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: -5px; text-shadow: 0 1px 1px rgba(255,255,255,0.8);">${book.name}</div>` : ''}
        `;
        
        // Long press/Right click for menu
        let pressTimer;
        let isLongPress = false;
        const imgDiv = item.querySelector('div');
        
        const handleLongPress = () => {
            isLongPress = true;
            showIcityBookMenu(book.id);
        };

        imgDiv.addEventListener('touchstart', () => {
            isLongPress = false;
            pressTimer = setTimeout(handleLongPress, 500);
        });
        
        imgDiv.addEventListener('touchend', () => clearTimeout(pressTimer));
        imgDiv.addEventListener('touchmove', () => clearTimeout(pressTimer));
        
        imgDiv.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            handleLongPress();
        });

        imgDiv.onclick = (e) => {
            if (isLongPress) return;
            openIcityBook(book.id, imgDiv);
        };

        list.appendChild(item);
    });

    // Add spacer for centering last item
    const spacerRight = document.createElement('div');
    spacerRight.style.minWidth = 'calc(50% - 120px)';
    spacerRight.style.flexShrink = '0';
    list.appendChild(spacerRight);

    // Scroll Logic for Scale Effect
    const handleScroll = () => {
        const center = list.scrollLeft + list.offsetWidth / 2;
        const items = list.querySelectorAll('.icity-book-item');
        
        items.forEach(item => {
            const itemCenter = item.offsetLeft + item.offsetWidth / 2;
            const dist = Math.abs(center - itemCenter);
            const maxDist = list.offsetWidth / 2; // Wider range
            
            let scale = 1;
            let opacity = 1;
            
            if (dist < maxDist) {
                const factor = 1 - (dist / maxDist); // 1 at center, 0 at maxDist
                // Center (factor=1): Scale 1.15
                // Edge (factor=0): Scale 0.9
                scale = 0.9 + (factor * 0.25);
                // Opacity: Keep it high to see other books
                opacity = 0.7 + (factor * 0.3); // 0.7 to 1.0
            } else {
                scale = 0.9;
                opacity = 0.7;
            }
            
            item.style.transform = `scale(${scale})`;
            item.style.opacity = opacity;
            
            // Adjust z-index and shadow for center focus
            const shadowDiv = item.querySelector('div'); // The cover div
            if (dist < 100) { // Near center
                item.style.zIndex = 10;
                if (shadowDiv) shadowDiv.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
            } else {
                item.style.zIndex = 1;
                if (shadowDiv) shadowDiv.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
            }
        });
    };

    // Remove old listener if any (to avoid duplicates if re-rendered)
    if (list._scrollHandler) {
        list.removeEventListener('scroll', list._scrollHandler);
    }
    list._scrollHandler = handleScroll;
    list.addEventListener('scroll', handleScroll);
    
    // Initial call
    setTimeout(handleScroll, 10);
}

function deleteIcityBook(id) {
    if (confirm('确定删除这本书吗？')) {
        window.iphoneSimState.icityBooks = window.iphoneSimState.icityBooks.filter(b => b.id !== id);
        saveConfig();
        renderIcityBooks();
    }
}

window.deleteIcityBook = deleteIcityBook;

function renderIcityDiaryList() {
    const listContainer = document.querySelector('.icity-diary-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    
    const diaries = window.iphoneSimState.icityDiaries || [];
    
    // Update diary count
    const countEl = document.getElementById('icity-diary-count');
    if (countEl) countEl.textContent = diaries.length;

    const limit = 3;
    const displayDiaries = diaries.slice(0, limit);
    
    displayDiaries.forEach(diary => {
        const item = document.createElement('div');
        item.style.borderBottom = '1px solid #f0f0f0';
        item.style.padding = '10px 0';
        
        let visIconHtml = '';
        if (diary.visibility === 'private') {
            visIconHtml = '<i class="fas fa-lock"></i>';
        } else if (diary.visibility === 'friends') {
            visIconHtml = '<i class="fas fa-user"></i>'; 
        }
        
        const date = new Date(diary.time);
        const timeStr = `${date.getMonth() + 1}月${date.getDate()}日`;

        item.onclick = (e) => {
            // Prevent if clicking on menu items
            if (e.target.closest('.fa-ellipsis-h') || e.target.closest('[id^="icity-menu"]')) return;
            openIcityDiaryDetail(diary.id);
        };
        item.style.cursor = 'pointer';

        item.innerHTML = `
            <div style="font-size: 16px; color: #333; line-height: 1.5; margin-bottom: 5px; white-space: pre-wrap; word-break: break-word;">${diary.content}</div>
            <div style="display: flex; align-items: center; color: #ccc; font-size: 14px; gap: 15px; justify-content: flex-end;">
                ${visIconHtml}
                <div style="display: flex; align-items: center; gap: 4px; cursor: pointer;" onclick="event.stopPropagation(); window.toggleIcityLike(${diary.id})">
                    <i class="${diary.isLiked ? 'fas' : 'far'} fa-heart" style="${diary.isLiked ? 'color: #FF3B30;' : ''}"></i>
                    ${diary.likes > 0 ? `<span style="${diary.isLiked ? 'color: #FF3B30;' : ''}">${diary.likes}</span>` : ''}
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <i class="far fa-comment"></i>
                    ${diary.comments > 0 ? `<span style="${diary.isLiked ? 'color: #FF3B30;' : ''}">${diary.comments}</span>` : ''}
                </div>
                <span style="font-size: 12px;">${timeStr}</span>
                <div style="position: relative;">
                    <i class="fas fa-ellipsis-h" style="cursor: pointer; padding: 5px;" onclick="event.stopPropagation(); toggleIcityMenu(this, ${diary.id})"></i>
                    <div id="icity-menu-${diary.id}" class="hidden" style="position: absolute; right: 0; bottom: 25px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 4px; padding: 5px 0; min-width: 80px; z-index: 10;">
                        <div onclick="event.stopPropagation(); window.handleIcityForward(${diary.id}, 'diary')" style="padding: 8px 15px; color: #333; font-size: 14px; cursor: pointer; text-align: center; border-bottom: 1px solid #f0f0f0;">转发</div>
                        <div onclick="event.stopPropagation(); deleteIcityDiary(${diary.id})" style="padding: 8px 15px; color: #FF3B30; font-size: 14px; cursor: pointer; text-align: center;">删除</div>
                    </div>
                </div>
            </div>
        `;
        
        listContainer.appendChild(item);
    });

    if (diaries.length > limit) {
        const moreDiv = document.createElement('div');
        moreDiv.style.textAlign = 'center';
        moreDiv.style.padding = '15px 0';
        moreDiv.style.color = '#999';
        moreDiv.style.fontSize = '14px';
        moreDiv.style.cursor = 'pointer';
        moreDiv.innerText = '更多日记';
        moreDiv.onclick = openIcityAllDiaries;
        listContainer.appendChild(moreDiv);
    }
}

function openIcityAllDiaries() {
    renderIcityAllDiaries();
    document.getElementById('icity-all-diaries-screen').classList.remove('hidden');
}

function renderIcityAllDiaries() {
    const listContainer = document.getElementById('icity-all-diaries-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = '';
    listContainer.style.background = '#f2f2f7'; // Ensure background color for gap visibility
    
    const activeTabEl = document.querySelector('.icity-diary-tab.active');
    const activeTab = activeTabEl ? activeTabEl.dataset.tab : 'all';

    let diaries = window.iphoneSimState.icityDiaries || [];
    
    if (activeTab !== 'all') {
        diaries = diaries.filter(d => d.visibility === activeTab);
    }
    
    // User Info
    const profile = window.iphoneSimState.icityProfile || {};
    const userName = profile.nickname || 'Kaneki'; 
    const userId = profile.id || '@heanova1';
    const avatarSrc = profile.avatar || '';
    
    // Update Header Name
    const headerTitle = document.getElementById('icity-all-diaries-title');
    if (headerTitle) {
        headerTitle.textContent = `${userName} · 日记`;
    } else {
        // Fallback for old structure
        const headerName = document.getElementById('icity-all-diaries-user-name');
        if (headerName) {
            headerName.textContent = userName;
            const subText = headerName.nextElementSibling;
            if (subText) subText.textContent = '日记';
        }
    }

    // Group diaries by day
    const groupedDiaries = [];
    let currentGroup = null;

    diaries.forEach(diary => {
        const date = new Date(diary.time);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        
        if (!currentGroup || currentGroup.key !== key) {
            currentGroup = { key: key, list: [] };
            groupedDiaries.push(currentGroup);
        }
        currentGroup.list.push(diary);
    });

    groupedDiaries.forEach(group => {
        const item = document.createElement('div');
        // Card styling: grey top, shadow, margin
        item.style.backgroundColor = '#fff';
        item.style.margin = '10px 5px'; // Reduced vertical margin, no horizontal margin
        item.style.borderRadius = '0'; // No border radius
        item.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)'; // Subtle shadow
        item.style.overflow = 'hidden'; // Ensure header background clips
        
        // Use first diary for header date info
        const firstDiary = group.list[0];
        const date = new Date(firstDiary.time);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const year = date.getFullYear();
        const daysOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const dayOfWeek = daysOfWeek[date.getDay()];
        
        const datePart = `${month}月${day}日 · ${dayOfWeek}`;
        const yearPart = `${year}`;

        // Header HTML
        let html = `
            <!-- Grey Header Strip with Avatar, Name, Date -->
            <div style="background-color: #f9f9f9; padding: 6px 15px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f0f0f0;">
                <div style="display: flex; align-items: center;">
                    <div style="width: 30px; height: 30px; border-radius: 50%; background: #000; margin-right: 10px; background-image: url('${avatarSrc}'); background-size: cover; background-position: center;"></div>
                    <div style="display: flex; flex-direction: column; justify-content: center;">
                        <div style="font-weight: bold; font-size: 14px; color: #333; line-height: 1.2;">${userName}</div>
                        <div style="font-size: 10px; color: #999; margin-top: 2px; line-height: 1.2;">${userId}</div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center;">
                    <div style="font-size: 12px; color: #999; line-height: 1.2;">${datePart}</div>
                    <div style="font-size: 12px; color: #999; margin-top: 2px; line-height: 1.2;">${yearPart}</div>
                </div>
            </div>
        `;

        // Content List HTML
        group.list.forEach((diary, index) => {
            let visIconHtml = '';
            if (diary.visibility === 'private') {
                visIconHtml = '<i class="fas fa-lock"></i>';
            } else if (diary.visibility === 'friends') {
                visIconHtml = '<i class="fas fa-user-friends"></i>'; 
            }

            const dDate = new Date(diary.time);
            const timeStr = `${dDate.getHours().toString().padStart(2, '0')}:${dDate.getMinutes().toString().padStart(2, '0')}`;
            
            // Add separator for subsequent items
            const separatorStyle = index > 0 ? 'border-top: 1px dashed #f0f0f0;' : '';

            html += `
                <div style="${separatorStyle} cursor: pointer;" onclick="openIcityDiaryDetail(${diary.id})">
                    <!-- Content -->
                    <div style="padding: 10px 15px 5px 15px;">
                        <div style="font-size: 15px; color: #333; line-height: 1.6; margin-bottom: 5px; white-space: pre-wrap; word-break: break-word;">${diary.content}</div>
                    </div>
                    
                    <!-- Footer: Icons, Time -->
                    <div style="padding: 0 15px 10px 15px; display: flex; align-items: center; justify-content: flex-end; color: #ccc; font-size: 12px; gap: 15px;">
                        ${visIconHtml}
                        <i class="far fa-heart"></i>
                        <i class="far fa-comment"></i>
                        <span>${timeStr}</span>
                        <div style="position: relative;">
                            <i class="fas fa-ellipsis-v" style="cursor: pointer; padding: 5px;" onclick="event.stopPropagation(); toggleIcityMenu(this, ${diary.id}, 'all')"></i>
                            <div id="icity-menu-all-${diary.id}" class="hidden" style="position: absolute; right: 0; bottom: 25px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 4px; padding: 5px 0; min-width: 80px; z-index: 10;">
                                <div onclick="event.stopPropagation(); window.handleIcityForward(${diary.id}, 'diary')" style="padding: 8px 15px; color: #333; font-size: 14px; cursor: pointer; text-align: center; border-bottom: 1px solid #f0f0f0;">转发</div>
                                <div onclick="event.stopPropagation(); deleteIcityDiary(${diary.id})" style="padding: 8px 15px; color: #FF3B30; font-size: 14px; cursor: pointer; text-align: center;">删除</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        item.innerHTML = html;
        listContainer.appendChild(item);
    });
}

function toggleIcityMenu(btn, id, type = 'main') {
    // Close all first
    document.querySelectorAll('[id^="icity-menu-"]').forEach(el => el.classList.add('hidden'));
    
    let menuId = `icity-menu-${id}`;
    if (type === 'all') {
        menuId = `icity-menu-all-${id}`;
    }
    
    const menu = document.getElementById(menuId);
    
    if (menu) {
        menu.classList.toggle('hidden');
        
        // Close on click outside
        const closeMenu = (e) => {
            if (!btn.contains(e.target) && !menu.contains(e.target)) {
                menu.classList.add('hidden');
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }
}

function deleteIcityDiary(id) {
    if (confirm('确定删除这条日记吗？')) {
        window.iphoneSimState.icityDiaries = window.iphoneSimState.icityDiaries.filter(d => d.id !== id);
        saveConfig();
        renderIcityDiaryList();
        renderIcityAllDiaries();
    }
}

function openIcityEditProfile() {
    const profile = window.iphoneSimState.icityProfile || {};
    document.getElementById('icity-edit-nickname').value = profile.nickname || 'Kaneki';
    document.getElementById('icity-edit-id').value = profile.id || '@heanova1';
    document.getElementById('icity-edit-profile-screen').classList.remove('hidden');
}

function handleSaveIcityProfile() {
    const nickname = document.getElementById('icity-edit-nickname').value.trim();
    const id = document.getElementById('icity-edit-id').value.trim();

    if (!window.iphoneSimState.icityProfile) {
        window.iphoneSimState.icityProfile = {};
    }

    window.iphoneSimState.icityProfile.nickname = nickname || 'Kaneki';
    window.iphoneSimState.icityProfile.id = id || '@heanova1';
    
    saveConfig();
    document.getElementById('icity-edit-profile-screen').classList.add('hidden');
    
    // Update UI
    const nameEl = document.querySelector('#icity-app .app-body div[style*="margin-top: 10px; text-align: center;"] div[style*="font-size: 24px"]');
    const idEl = document.querySelector('#icity-app .app-body div[style*="margin-top: 10px; text-align: center;"] div[style*="color: #999; font-size: 14px;"]');
    
    if (nameEl) nameEl.textContent = window.iphoneSimState.icityProfile.nickname;
    if (idEl) idEl.textContent = window.iphoneSimState.icityProfile.id;
    
    renderIcityAllDiaries(); // Update names in list
}

function openIcityDiaryDetail(id, source = 'diary') {
    window.currentOpenIcityDiaryId = id;
    window.currentOpenIcitySource = source;
    
    let post = null;
    let userAvatar = '';
    let userName = '';
    let userHandle = '';
    let visibility = 'public'; // default

    if (source === 'diary') {
        post = window.iphoneSimState.icityDiaries.find(d => d.id === id);
        if (!post) return;
        
        const profile = window.iphoneSimState.icityProfile || {};
        userAvatar = profile.avatar;
        userName = profile.nickname || 'Kaneki';
        userHandle = profile.id || '@heanova1';
        visibility = post.visibility || 'public';
        
    } else if (source === 'world') {
        post = window.iphoneSimState.icityWorldPosts.find(p => p.id === id);
        if (!post) return;
        
        userAvatar = post.avatar;
        userName = post.name;
        userHandle = post.handle;
        visibility = 'public';
        
    } else if (source === 'friends') {
        post = window.iphoneSimState.icityFriendsPosts.find(p => p.id === id);
        if (!post) return;
        
        // Similar logic to renderIcityFriends to resolve user info
        let contact = null;
        if (post.contactId) {
            contact = window.iphoneSimState.contacts.find(c => c.id === post.contactId);
        } else {
            contact = window.iphoneSimState.contacts.find(c => c.name === post.name);
        }

        userName = post.name;
        userHandle = post.handle;
        userAvatar = post.avatar;

        if (contact) {
            if (contact.icityData) {
                if (contact.icityData.name) userName = contact.icityData.name;
                if (contact.icityData.handle) userHandle = contact.icityData.handle;
                if (contact.icityData.avatar) userAvatar = contact.icityData.avatar;
            } else {
                if (!userAvatar) userAvatar = contact.avatar;
            }
        }
        
        // Fallback
        if (!userName) userName = post.name;
        if (!userHandle) userHandle = post.handle || '@user';
        
        visibility = post.visibility || 'friends';
    }

    if (!post) return;
    
    // Update Header Title
    const titleEl = document.getElementById('icity-detail-title');
    if (titleEl) {
        titleEl.textContent = `${userName} · 日记`;
    }

    // Populate Avatar
    const avatarEl = document.getElementById('icity-detail-avatar');
    avatarEl.innerHTML = ''; // Clear previous icon
    avatarEl.style.display = 'block'; // Reset display

    if (source === 'world') {
        // World: Gray avatar with icon
        avatarEl.style.backgroundImage = '';
        avatarEl.style.backgroundColor = '#ccc';
        avatarEl.style.display = 'flex';
        avatarEl.style.alignItems = 'center';
        avatarEl.style.justifyContent = 'center';
        avatarEl.innerHTML = '<i class="fas fa-user" style="color: #fff; font-size: 20px;"></i>';
    } else if (userAvatar) {
        avatarEl.style.backgroundImage = `url('${userAvatar}')`;
        avatarEl.style.backgroundColor = 'transparent';
    } else {
        avatarEl.style.backgroundImage = '';
        avatarEl.style.backgroundColor = '#ccc';
        if (source === 'diary') {
            avatarEl.style.backgroundColor = '#000';
        } else {
            // Friends without avatar: Show icon
            avatarEl.style.display = 'flex';
            avatarEl.style.alignItems = 'center';
            avatarEl.style.justifyContent = 'center';
            avatarEl.innerHTML = '<i class="fas fa-user" style="color: #fff; font-size: 20px;"></i>';
        }
    }
    
    document.getElementById('icity-detail-name').textContent = userName;
    document.getElementById('icity-detail-handle').textContent = userHandle;
    
    document.getElementById('icity-detail-text').textContent = post.content;
    
    let timeStr = '';
    if (typeof post.time === 'number') {
        const date = new Date(post.time);
        timeStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;
    } else {
        // Handle string time (legacy world posts)
        timeStr = post.time || '刚刚';
    }
    document.getElementById('icity-detail-time').textContent = timeStr;
    
    const visMap = { 'public': '公开', 'private': '私密', 'friends': '仅好友' };
    const visIconMap = { 'public': 'fa-globe', 'private': 'fa-lock', 'friends': 'fa-user-friends' };
    
    document.getElementById('icity-detail-visibility').innerHTML = `<i class="fas ${visIconMap[visibility] || 'fa-globe'}"></i> ${visMap[visibility] || '公开'}`;
    
    // Clear Comments for now
    const commentsList = document.getElementById('icity-detail-comments-list');
    commentsList.innerHTML = '';
    
    // Render comments if any
    const comments = post.commentsList || [];
    
    comments.forEach(comment => {
        const commentItem = document.createElement('div');
        if (comment.id) commentItem.id = 'icity-comment-' + comment.id;
        commentItem.style.display = 'flex';
        commentItem.style.marginBottom = '15px';
        commentItem.style.borderBottom = '1px dashed #f0f0f0';
        commentItem.style.paddingBottom = '10px';
        commentItem.style.cursor = 'pointer';

        commentItem.onclick = () => {
            window.icityReplyingTo = comment;
            const input = document.getElementById('icity-comment-input');
            if (input) {
                input.placeholder = `回复 ${comment.name}:`;
                input.focus();
            }
        };

        let timeStr = '刚刚';
        const diff = Date.now() - comment.time;
        if (diff < 60000) timeStr = '刚刚';
        else if (diff < 3600000) timeStr = Math.floor(diff/60000) + '分钟前';
        else timeStr = new Date(comment.time).toLocaleString();

        // Resolve Avatar
        let avatarUrl = '';
        const userNickname = (window.iphoneSimState.icityProfile && window.iphoneSimState.icityProfile.nickname) ? window.iphoneSimState.icityProfile.nickname : 'Kaneki';
        
        if (comment.name === userNickname) {
            avatarUrl = (window.iphoneSimState.icityProfile && window.iphoneSimState.icityProfile.avatar) ? window.iphoneSimState.icityProfile.avatar : '';
        } else {
            // Check contacts first (higher priority for linked contacts or friends)
            const contact = window.iphoneSimState.contacts.find(c => {
                const cName = (c.icityData && c.icityData.name) ? c.icityData.name : c.name;
                return cName === comment.name || c.name === comment.name;
            });
            
            if (contact) {
                avatarUrl = (contact.icityData && contact.icityData.avatar) ? contact.icityData.avatar : contact.avatar;
            }
        }

        let avatarStyle = '';
        let avatarContent = '';
        
        if (avatarUrl) {
            avatarStyle = `background-image: url('${avatarUrl}'); background-size: cover; background-position: center;`;
        } else {
             avatarStyle = `background: #ccc;`;
             avatarContent = `<i class="fas fa-user"></i>`;
        }

        commentItem.innerHTML = `
            <div style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px; ${avatarStyle}; cursor: pointer;" onclick="event.stopPropagation(); window.openIcityStrangerProfile('${comment.name}', '${avatarUrl || ''}', null, null)">
                ${avatarContent}
            </div>
            <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <span style="font-weight: bold; font-size: 14px; color: #333;">${comment.name}</span>
                    <span style="font-size: 10px; color: #ccc;">${timeStr}</span>
                </div>
                <div style="font-size: 14px; color: #666; line-height: 1.4;">${comment.content}</div>
            </div>
        `;
        commentsList.appendChild(commentItem);
    });
    
    const displayCount = (post.commentsList && post.commentsList.length > 0) ? post.commentsList.length : (post.comments || 0);
    document.getElementById('icity-detail-comments-count').innerHTML = `${displayCount} 条评论 <i class="fas fa-chevron-down"></i>`;

    document.getElementById('icity-detail-screen').classList.remove('hidden');
}

function toggleIcityLike(id) {
    const diary = window.iphoneSimState.icityDiaries.find(d => d.id === id);
    if (diary) {
        if (diary.isLiked) {
            diary.isLiked = false;
            diary.likes = Math.max(0, (diary.likes || 0) - 1);
        } else {
            diary.isLiked = true;
            diary.likes = (diary.likes || 0) + 1;
        }
        saveConfig();
        renderIcityDiaryList();
    }
}

// Global Exports
window.toggleIcityLike = toggleIcityLike;
window.openIcityDiaryDetail = openIcityDiaryDetail;
window.renderIcityProfile = renderIcityProfile;
window.renderIcityDiaryList = renderIcityDiaryList;
window.toggleIcityMenu = toggleIcityMenu;
window.deleteIcityDiary = deleteIcityDiary;
window.openIcityAllDiaries = openIcityAllDiaries;
window.openIcityBadges = openIcityBadges;
window.checkIcityAchievements = checkIcityAchievements;
window.toggleEquipBadge = toggleEquipBadge;
window.openIcityTitles = openIcityTitles;
window.equipIcityTitle = equipIcityTitle;
window.handleCreateCustomTitle = handleCreateCustomTitle;
window.deleteIcityTitle = deleteIcityTitle;

function getRandomWorldPosts(count = 5) {
    const names = ["7", "bye", "evenlonelinessanddeath", "iiio77_iuz", "林深见鹿", "半岛铁盒", "Cloud", "Momo", "Kiki", "Jia"];
    const handles = ["@lovejiangrenhhh", "@sickodyuu", "@n_annan7", "@iiio77_iuz", "@lin_deep", "@bandao", "@cloud_9", "@momo_world", "@kiki_delivery", "@jia_home"];
    const contents = [
        "十七岁的谢辞，打架抽烟喝大酒泡吧，喜欢和高年级的男生混在一起。\n在盛夏的一天，许呦抱着书，在众目睽睽下推开教室的门进来。\n有男生坐在桌上吹口哨。",
        "再次见面的时候你对怎么对我毫无波澜了，好无力，我已经把你的喜欢耗尽了吗，为什么会这样",
        "我想去卸甲 有事缠身。我不得劲\n好难抉择才做一周",
        "现在也终于理解了什么是门当户对 谈恋爱可以凭感觉 结婚不可以 我也遇到了想要结婚在一起的人 可终究要回到现实 相爱不会抵万难 我们两个即使再相爱",
        "今天的天气真好，适合出去走走。\n阳光洒在身上暖洋洋的。",
        "最近在读一本很有意思的书，推荐给大家。",
        "好想去旅行啊，去一个没有人认识我的地方。",
        "生活总是有起有落，保持平常心就好。",
        "就在一瞬间，我突然觉得我好像不喜欢你了。",
        "有些路，只能一个人走。"
    ];
    
    const posts = [];
    for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * names.length);
        const contentIdx = Math.floor(Math.random() * contents.length);
        posts.push({
            id: Date.now() + i,
            name: names[idx],
            handle: handles[idx],
            avatar: '',
            content: contents[contentIdx],
            time: Date.now() - Math.floor(Math.random() * 100000000),
            likes: Math.floor(Math.random() * 100),
            comments: Math.floor(Math.random() * 20)
        });
    }
    return posts;
}

function renderIcityWorld() {
    const list = document.getElementById('icity-world-list');
    if (!list) return;
    
    // Ensure state exists
    if (!window.iphoneSimState.icityWorldPosts) {
        window.iphoneSimState.icityWorldPosts = [];
    }
    
    const posts = window.iphoneSimState.icityWorldPosts;
    
    if (posts.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">点击右上角生成动态</div>';
        return;
    }
    
    list.innerHTML = '';
    
    posts.forEach(post => {
        const item = document.createElement('div');
        item.style.backgroundColor = '#fff';
        item.style.padding = '15px';
        item.style.borderBottom = '1px solid #f0f0f0';
        item.style.cursor = 'pointer';

        item.onclick = (e) => {
            if (e.target.closest('.fa-heart') || e.target.closest('.fa-comment') || e.target.closest('.fa-ellipsis-v')) return;
            openIcityDiaryDetail(post.id, 'world');
        };
        
        const date = new Date(post.time);
        // Random relative time strings like "22秒钟前", "24秒钟前" as in image
        const seconds = Math.floor(Math.random() * 60);
        const timeStr = `${seconds}秒钟前`;
        
        item.innerHTML = `
            <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; background: #ccc; margin-right: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer;" onclick="event.stopPropagation(); window.openIcityStrangerProfile('${post.name}', '${post.avatar || ''}', '${post.handle}', null)">
                    <i class="fas fa-user" style="color: #fff; font-size: 20px;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 15px; color: #333;">${post.name}</div>
                    <div style="font-size: 12px; color: #999;">${post.handle}</div>
                </div>
            </div>
            <div style="font-size: 15px; color: #333; line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap;">${post.content}</div>
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 20px; color: #ccc; font-size: 13px;">
                <i class="far fa-heart"></i>
                <i class="far fa-comment"></i>
                <div style="display: flex; align-items: center; gap: 5px;"><i class="far fa-clock"></i> ${timeStr}</div>
                <div style="position: relative;">
                    <i class="fas fa-ellipsis-v" style="cursor: pointer; padding: 5px;" onclick="event.stopPropagation(); toggleIcityFeedMenu(this, ${post.id})"></i>
                    <div id="icity-feed-menu-${post.id}" class="hidden" style="position: absolute; right: 0; bottom: 25px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 4px; padding: 5px 0; min-width: 80px; z-index: 10;">
                        <div onclick="event.stopPropagation(); window.handleIcityForward(${post.id}, 'world')" style="padding: 8px 15px; color: #333; font-size: 14px; cursor: pointer; text-align: center;">转发</div>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

async function handleGenerateIcityWorld() {
    const btn = document.getElementById('icity-world-generate-btn');
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    try {
        const posts = await callAiForWorldPosts();
        if (posts && posts.length > 0) {
            window.iphoneSimState.icityWorldPosts = posts;
            saveConfig();
            renderIcityWorld();
        }
    } catch (e) {
        console.error('Failed to generate world posts:', e);
        alert('生成失败，请检查 API 设置');
    } finally {
        if (btn) {
            btn.innerHTML = '<i class="fas fa-magic"></i>';
        }
    }
}

async function callAiForWorldPosts() {
    const prompt = `生成5条模仿社交媒体动态的内容。每条内容包含：昵称、用户ID（@开头）、头像关键词（用于生成头像）、正文内容（可以是心情、小说摘录、吐槽等，风格多样化）、点赞数（0-100）、评论数（0-20）。
    
    请严格按照以下 JSON 格式返回，不要包含其他解释性文字：
    [
        {
            "name": "昵称",
            "handle": "@userid",
            "avatar_seed": "avatar_keyword",
            "content": "正文内容",
            "likes": 10,
            "comments": 2
        },
        ...
    ]`;

    const messages = [{ role: 'user', content: prompt }];
    
    try {
        const response = await callAiApi(messages); // Assuming callAiApi is available globally from chat.js or core.js
        // If callAiApi is not available, we might need to implement a simple fetch here or ensure chat.js is loaded.
        // Based on file list, chat.js is present. Let's assume callAiApi or a similar function exists or we implement a local one.
        // Actually, looking at previous context, there is a `callAiApi` in `js/chat.js` but it might be scoped.
        // Let's check `js/core.js` or `js/chat.js` for available AI functions.
        // Since I cannot check other files right now, I will implement a safe local version of API call using state settings.
        
        return parseAiResponse(response);
    } catch (error) {
        // If external call fails, fallback to a local mock for robustness if needed, or rethrow.
        console.error("AI API Call failed", error);
        throw error;
    }
}

async function safeCallAiApi(messages) {
    const { url, key, model } = window.iphoneSimState.aiSettings;
    if (!url || !key) {
        throw new Error("AI Settings missing");
    }

    const response = await fetch(url + '/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
            model: model || 'gpt-3.5-turbo',
            messages: messages,
            temperature: 0.8
        })
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

function parseAiResponse(content) {
    try {
        // Try to find JSON array in the content
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return data.map((item, index) => ({
                id: Date.now() + index,
                name: item.name,
                handle: item.handle,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.avatar_seed}`,
                content: item.content,
                time: Date.now() - Math.floor(Math.random() * 10000000), // Random recent time
                likes: item.likes,
                comments: item.comments
            }));
        }
        throw new Error("No JSON found");
    } catch (e) {
        console.error("Parse error", e);
        return [];
    }
}

// Override callAiApi usage with safeCallAiApi
async function callAiForWorldPosts() {
    const prompt = `生成5条模仿社交媒体动态的内容。要求：
    1. **网名设计**：请设计极具个性的网名，**拒绝“小明”、“用户123”这种人机名**。
       - 风格参考：抽象中文（"玛卡巴卡"）、全小写英文（"lost_stars"）、Emoji组合（"☁️是云呀"）、文艺风（"半岛铁盒"）、极简风（"..."）。
       - 每个网名都要感觉是不同的人。
    2. **内容风格**：模仿真实用户的发帖，可以是生活碎片、深夜emo、无意义的碎碎念、追星、吐槽等。**拒绝AI味的正式表达**。
    3. 内容要有换行。
    4. 严格返回 JSON 数组格式。
    
    格式示例：
    [
        {
            "name": "这里填你设计的网名",
            "handle": "@user_handle",
            "avatar_seed": "seed_string",
            "content": "动态正文\\n第二行",
            "likes": 42,
            "comments": 5
        }
    ]`;

    const messages = [{ role: 'user', content: prompt }];
    const content = await safeCallAiApi(messages);
    return parseAiResponse(content);
}

// Register Init Function
if (window.appInitFunctions) {
    window.appInitFunctions.push(setupIcityListeners);
} else {
    window.appInitFunctions = [setupIcityListeners];
}

// Append new functions for Friends feature

async function handleWeChatFriendRequestFlow(msgObj, wxid) {
    // 1. Identify the contact based on the current stranger profile or active chat
    let targetName = msgObj.sender;
    let targetAvatar = msgObj.avatar;
    
    // Fallback: try to find current stranger profile
    if (!targetName && window.currentStrangerProfile) {
        targetName = window.currentStrangerProfile.name;
        targetAvatar = window.currentStrangerProfile.avatar;
    }

    if (!targetName) {
        console.log("Cannot identify sender for friend request, using default");
        targetName = "未知用户";
    }

    // 2. Check if already a contact
    const existing = window.iphoneSimState.contacts.find(c => c.name === targetName);
    if (existing) {
        // Already friends
        const reply = `(系统提示：你们已经是好友了)`;
        if (!msgObj.history) msgObj.history = [];
        msgObj.history.push({
            role: 'system',
            content: reply,
            time: Date.now()
        });
        msgObj.content = reply;
        saveConfig();
        renderIcityMessages();
        return;
    }

    // 3. Check if already requested
    if (!window.iphoneSimState.wechatFriendRequests) window.iphoneSimState.wechatFriendRequests = [];
    const pending = window.iphoneSimState.wechatFriendRequests.find(r => r.name === targetName && r.status === 'pending');
    
    if (pending) {
        const reply = `(系统提示：好友申请已发送，请等待验证)`;
        if (!msgObj.history) msgObj.history = [];
        msgObj.history.push({
            role: 'system',
            content: reply,
            time: Date.now()
        });
        msgObj.content = reply;
        saveConfig();
        renderIcityMessages();
        return;
    }

    // 4. AI Decision Logic
    const historyContext = msgObj.history.slice(-10).map(h =>
        `${h.role === 'me' ? '我' : '对方'}: ${h.content}`
    ).join('\n');

    // Add User Diaries to context to provide more "memory" of the user
    const recentDiaries = window.iphoneSimState.icityDiaries ? window.iphoneSimState.icityDiaries.slice(0, 5) : [];
    const diaryContext = recentDiaries.map(d => `[${new Date(d.time).toLocaleDateString()}] 用户日记: ${d.content}`).join('\n');

    const prompt = `你正在扮演一个网络用户（${msgObj.sender}），正在与“我”进行私信聊天。
以下是聊天记录：
${historyContext}

以下是用户最近发布的iCity日记（请阅读以了解用户）：
${diaryContext}

系统提示：用户刚刚发送了自己的微信号 "${wxid}"。
请根据当前聊天的亲密度和上下文，决定是否添加对方为微信好友。
大多数情况下你应该同意添加，除非聊天氛围非常糟糕。
${msgObj.gender && msgObj.gender !== 'unknown' ? `**注意：该用户的性别设定为 ${msgObj.gender === 'male' ? '男性' : '女性'}，生成人设时请务必遵守。**` : ''}

请务必返回 JSON 格式数据，不要包含 Markdown 标记（如 \`\`\`json）。
JSON 格式如下：
{
    "willAdd": true或false,
    "reply": "你给用户的自然语言回复",
    "persona": "如果willAdd为true，请在此处生成极具真实感的丰满人设。请务必使用以下全新格式，不要随意增减基础结构：\n【基础档案】\n  姓名:\n  性别:\n  年龄/生日:\n  体貌特征(身高/体重/体型):\n  公开身份/职业:\n【外在形象】\n  面部特征(五官/发型/气质):\n  日常穿搭(工作/休息/居家):\n  特殊习惯(小动作/口头禅):\n【过往履历】\n  原生家庭状态:\n  早期成长经历(按阶段简述重点):\n  近期生活轨迹:\n【社会与人际】\n  阶层与经济状况:\n  社交圈子与风评:\n  目前的人际牵绊(非用户):\n【内心世界】\n  表层性格(社交面具):\n  深层特质(真实自我):\n  恋爱观与依恋类型:\n  雷区与绝对底线:\n  长远执念/渴望:\n【生活侧写】\n  作息与饮食偏好:\n  特长与业余消遣:\n  优势/发光点:\n  劣势/致命弱点:\n【私密设定(NSFW)】\n  取向与实战经验:\n  床笫偏好(属性/体位/癖好):\n  性幻想与敏感点:\n  绝对不可接受的事项:\n\n生成要求：内容必须极具细节，充满活人味，拒绝脸谱化。⚠️核心禁忌：生成的角色必须是一个【完全随机的陌生人】，严禁与用户现有的任何联系人（包括亲戚、前任、同学、同事等）有任何牵连！也不能和用户当前扮演的身份有任何预设关系。双方必须是初次相遇的独立个体！"
}
`;

    let replyContent = "收到";
    let willAdd = false;
    let persona = null;

    try {
        const messages = [{ role: 'user', content: prompt }];
        let rawContent = await safeCallAiApi(messages);
        
        // Try parsing JSON
        let data = null;
        try {
             const match = rawContent.match(/\{[\s\S]*\}/);
             if (match) {
                 data = JSON.parse(match[0]);
             } else {
                 data = JSON.parse(rawContent);
             }
        } catch (parseErr) {
             console.error("JSON Parse failed", parseErr, rawContent);
             // Fallback: treat as text
             if (rawContent.includes("加你") || rawContent.includes("同意")) {
                 data = { willAdd: true, reply: rawContent, persona: null };
             } else {
                 data = { willAdd: false, reply: rawContent, persona: null };
             }
        }

        if (data) {
            willAdd = data.willAdd;
            replyContent = data.reply || "好的";
            
            // Ensure persona is a string to avoid [object Object]
            if (data.persona) {
                if (typeof data.persona === 'object') {
                    // Convert object to string format if AI returned a JSON object for persona
                    try {
                        persona = Object.entries(data.persona)
                            .map(([key, value]) => {
                                // Recursively stringify objects if value is an object
                                const valStr = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
                                return `${key}: ${valStr}`;
                            })
                            .join('\n');
                    } catch (err) {
                        persona = JSON.stringify(data.persona, null, 2);
                    }
                } else {
                    persona = String(data.persona);
                }
            } else {
                persona = null;
            }
        }

    } catch (e) {
        console.error("AI Gen Failed for Friend Request", e);
        willAdd = Math.random() < 0.7;
        replyContent = willAdd ? "好的，我去加你" : "收到";
    }

    if (!msgObj.history) msgObj.history = [];
    msgObj.history.push({
        role: 'stranger',
        content: replyContent,
        time: Date.now()
    });
    msgObj.content = replyContent;
    
    if (willAdd) {
            // 4. Create Friend Request (Only if willAdd is true)
        const requestId = Date.now();
        const newRequest = {
            id: requestId,
            name: targetName,
            avatar: targetAvatar || '',
            reason: `我是${targetName}`,
            status: 'pending',
            time: Date.now(),
            source: 'icity',
            icityContext: {
                msgId: msgObj.id
            },
            preGeneratedPersona: persona // Use the persona from AI directly
        };
        window.iphoneSimState.wechatFriendRequests.push(newRequest);

        // Fallback: If persona failed to generate in JSON, trigger background generation
        if (!persona) {
             (async () => {
                try {
                    const personaPrompt = `根据以下聊天记录，为"TA"生成一个详细的人物设定，要求极度详细且具有“活人感”。
请严格按照以下模版生成，不要修改模版的结构：
【基础档案】
  姓名:
  性别:
  年龄/生日:
  体貌特征(身高/体重/体型):
  公开身份/职业:
【外在形象】
  面部特征(五官/发型/气质):
  日常穿搭(工作/休息/居家):
  特殊习惯(小动作/口头禅):
【过往履历】
  原生家庭状态:
  早期成长经历(按阶段简述重点):
  近期生活轨迹:
【社会与人际】
  阶层与经济状况:
  社交圈子与风评:
  目前的人际牵绊(非用户):
【内心世界】
  表层性格(社交面具):
  深层特质(真实自我):
  恋爱观与依恋类型:
  雷区与绝对底线:
  长远执念/渴望:
【生活侧写】
  作息与饮食偏好:
  特长与业余消遣:
  优势/发光点:
  劣势/致命弱点:
【私密设定(NSFW)】
  取向与实战经验:
  床笫偏好(属性/体位/癖好):
  性幻想与敏感点:
  绝对不可接受的事项:

请直接输出填好的模版内容，无需其他废话。
\n\n${historyContext}`;
                    const personaMessages = [{ role: 'user', content: personaPrompt }];
                    let p = await safeCallAiApi(personaMessages);
                    if (typeof p === 'string') p = p.trim();
                    newRequest.preGeneratedPersona = p;
                    saveConfig();
                } catch (e) {}
             })();
        }

            // 6. Trigger System Notification
        setTimeout(() => {
                if (window.showChatNotification) {
                window.showChatNotification(requestId, `[微信] ${targetName} 请求添加你为朋友`);
            }
        }, 2000);
    }

    saveConfig();
    
    // Refresh iCity UI if open
    if (window.currentOpenIcityMessageId === msgObj.id) {
        renderIcityMessageDetailList(msgObj);
    }
    renderIcityMessages();
}

// Feed Selection Mode State
window.icityFeedSelectionMode = false;
window.selectedIcityFeedIds = new Set();

function switchIcityFeedTab(tab) {
    const headers = {
        'world': document.getElementById('icity-header-world'),
        'friends': document.getElementById('icity-header-friends'),
        'notifications': document.getElementById('icity-header-notifications'),
        'likes': document.getElementById('icity-header-likes')
    };

    // Reset all headers
    Object.values(headers).forEach(el => {
        if (el) {
            el.style.color = '#999';
            el.style.borderBottom = 'none';
            el.style.fontWeight = 'normal';
            el.dataset.active = 'false';
        }
    });

    // Activate selected
    if (headers[tab]) {
        headers[tab].style.color = '#000';
        headers[tab].style.borderBottom = '2px solid #000';
        headers[tab].style.fontWeight = 'bold';
        headers[tab].dataset.active = 'true';
    }

    // Toggle Lists
    const listWorld = document.getElementById('icity-world-list');
    const listNotif = document.getElementById('icity-notifications-list');
    const listLikes = document.getElementById('icity-likes-list');

    if (listWorld) listWorld.style.display = 'none';
    if (listNotif) listNotif.style.display = 'none';
    if (listLikes) listLikes.style.display = 'none';

    // Toggle Generation Button visibility
    const genBtn = document.getElementById('icity-world-generate-btn');
    if (genBtn) genBtn.style.display = 'block';

    if (tab === 'world') {
        if (listWorld) listWorld.style.display = 'block';
        if (genBtn) {
            genBtn.onclick = window.handleGenerateIcityWorld;
            genBtn.innerHTML = '<i class="fas fa-magic"></i>';
        }
        renderIcityWorld();
    } else if (tab === 'friends') {
        if (listWorld) listWorld.style.display = 'block';
        if (genBtn) {
            genBtn.onclick = window.handleGenerateIcityFriends;
            genBtn.innerHTML = '<i class="fas fa-magic"></i>';
        }
        renderIcityFriends();
    } else if (tab === 'notifications') {
        if (listNotif) listNotif.style.display = 'block';
        if (genBtn) genBtn.style.display = 'none'; // Hide gen button for notifications
        renderIcityNotifications();
    } else if (tab === 'likes') {
        if (listLikes) listLikes.style.display = 'block';
        if (genBtn) genBtn.style.display = 'none'; // Hide gen button for likes
        renderIcityLikes();
    }
}
window.switchIcityFeedTab = switchIcityFeedTab;

function renderIcityNotifications() {
    const list = document.getElementById('icity-notifications-list');
    if (!list) return;
    
    list.innerHTML = '';
    const notifications = window.iphoneSimState.icityNotifications || [];
    
    if (notifications.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">暂无通知</div>';
        return;
    }
    
    // Sort by time desc
    const sorted = [...notifications].sort((a, b) => b.time - a.time);
    
    sorted.forEach(notif => {
        const item = document.createElement('div');
        item.style.padding = '15px';
        item.style.borderBottom = '1px solid #f0f0f0';
        item.style.display = 'flex';
        item.style.alignItems = 'flex-start';
        item.style.cursor = 'pointer';
        item.onclick = () => handleNotificationClick(notif);
        
        // Force default gray avatar for NPCs
        let avatarStyle = 'background: #ccc;';
        
        const timeStr = formatIcityTime(notif.time);
        
        item.innerHTML = `
            <div style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; flex-shrink: 0; ${avatarStyle} display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-user" style="color: #fff;"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-size: 14px; margin-bottom: 4px;">
                    <span style="font-weight: bold;">${notif.name}</span>
                    <span style="color: #666;">在评论中提到了你</span>
                </div>
                <div style="font-size: 14px; color: #333; background: #f9f9f9; padding: 8px; border-radius: 4px; border-left: 3px solid #007AFF;">
                    ${notif.content}
                </div>
                <div style="font-size: 12px; color: #ccc; margin-top: 5px;">${timeStr}</div>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderIcityLikes() {
    const list = document.getElementById('icity-likes-list');
    if (!list) return;
    
    list.innerHTML = '';
    const likes = window.iphoneSimState.icityLikes || [];
    
    if (likes.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">暂无喜欢</div>';
        return;
    }
    
    const sorted = [...likes].sort((a, b) => b.time - a.time);
    
    sorted.forEach(like => {
        const item = document.createElement('div');
        item.style.padding = '15px';
        item.style.borderBottom = '1px solid #f0f0f0';
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        
        // Force default gray avatar for Likes
        let avatarStyle = 'background: #ccc;';
        
        const timeStr = formatIcityTime(like.time);
        
        item.innerHTML = `
            <div style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; flex-shrink: 0; ${avatarStyle} display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-user" style="color: #fff;"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-size: 14px;">
                    <span style="font-weight: bold;">${like.name}</span>
                    <span style="color: #666;">赞了你的日记</span>
                </div>
                <div style="font-size: 12px; color: #ccc; margin-top: 2px;">${timeStr}</div>
            </div>
            <div style="width: 40px; height: 40px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #999;">
                <i class="fas fa-book"></i>
            </div>
        `;
        list.appendChild(item);
    });
}

function formatIcityTime(timestamp) {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return Math.floor(diff/60000) + '分钟前';
    if (diff < 86400000) return Math.floor(diff/3600000) + '小时前';
    return new Date(timestamp).toLocaleDateString();
}

function handleNotificationClick(notif) {
    // Open diary detail
    // We need to know which diary it is.
    // If notification has diaryId, use it.
    if (notif.diaryId) {
        // Determine source. Usually notifications come from 'diary' (my posts)
        // But could be others.
        // Assuming notifications are for user's own content or where they are mentioned.
        // For simplicity, search in all sources or assume source 'diary' if it's my post.
        
        // Check if diary exists in my diaries
        const myDiary = window.iphoneSimState.icityDiaries.find(d => d.id === notif.diaryId);
        let source = 'diary';
        if (!myDiary) {
            // Check friends
            const friendPost = window.iphoneSimState.icityFriendsPosts.find(p => p.id === notif.diaryId);
            if (friendPost) source = 'friends';
            else {
                // Check world
                const worldPost = window.iphoneSimState.icityWorldPosts.find(p => p.id === notif.diaryId);
                if (worldPost) source = 'world';
            }
        }
        
        openIcityDiaryDetail(notif.diaryId, source);
        
        // Scroll to comment?
        // This is complex as comments are rendered after opening.
        // We can set a global flag
        window.icityScrollToCommentId = notif.commentId;
    }
}

// Hook into openIcityDiaryDetail to scroll if needed
const originalOpenIcityDiaryDetail = window.openIcityDiaryDetail;
window.openIcityDiaryDetail = function(id, source) {
    originalOpenIcityDiaryDetail(id, source);
    if (window.icityScrollToCommentId) {
        setTimeout(() => {
            const el = document.getElementById('icity-comment-' + window.icityScrollToCommentId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.style.backgroundColor = '#fff9c4'; // Highlight
                setTimeout(() => el.style.backgroundColor = 'transparent', 2000);
            }
            window.icityScrollToCommentId = null;
        }, 500);
    }
};

function updateIcityFeedHeader() {
    const header = document.querySelector('#icity-tab-content-world .app-header');
    if (!header) return;
    
    if (window.icityFeedSelectionMode) {
        const count = window.selectedIcityFeedIds.size;
        // Selection Mode Header
        header.innerHTML = `
            <button onclick="window.exitIcityFeedSelectionMode()" style="position: absolute; left: 15px; background: none; border: none; font-size: 16px; color: #333; cursor: pointer;">取消</button>
            <div style="font-weight: bold; font-size: 16px;">已选择 ${count}</div>
            <button onclick="window.deleteSelectedIcityFeedItems()" style="position: absolute; right: 15px; background: none; border: none; font-size: 16px; color: ${count > 0 ? '#FF3B30' : '#ccc'}; cursor: pointer;" ${count === 0 ? 'disabled' : ''}>删除</button>
        `;
    } else {
        // Restore Default Header
        // Note: Using the updated onclicks
        header.innerHTML = `
            <div style="display: flex; gap: 20px; font-size: 16px;">
                <span id="icity-header-world" style="color: #999; border-bottom: none; padding-bottom: 5px; cursor: pointer;" onclick="window.switchIcityFeedTab('world')">世界</span>
                <span id="icity-header-friends" style="font-weight: bold; color: #000; cursor: pointer; border-bottom: 2px solid #000; padding-bottom: 5px;" data-active="true" onclick="window.switchIcityFeedTab('friends')">朋友</span>
                <span id="icity-header-notifications" style="color: #999; cursor: pointer;" onclick="window.switchIcityFeedTab('notifications')">@ 通知</span>
                <span id="icity-header-likes" style="color: #999; cursor: pointer;" onclick="window.switchIcityFeedTab('likes')">♡ 喜欢</span>
            </div>
            <button id="icity-world-generate-btn" style="position: absolute; right: 15px; background: none; border: none; color: #007AFF; font-size: 16px;" onclick="window.handleGenerateIcityFriends()"><i class="fas fa-magic"></i></button>
        `;
    }
}

function renderIcityFriends() {
    const list = document.getElementById('icity-world-list');
    if (!list) return;
    
    // Update header for selection mode if needed
    updateIcityFeedHeader();

    // Ensure state exists
    if (!window.iphoneSimState.icityFriendsPosts) {
        window.iphoneSimState.icityFriendsPosts = [];
    }
    
    const posts = window.iphoneSimState.icityFriendsPosts;
    
    if (posts.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">暂无朋友动态，点击右上角生成</div>';
        return;
    }
    
    list.innerHTML = '';
    
    posts.forEach(post => {
        const item = document.createElement('div');
        item.style.backgroundColor = '#fff';
        item.style.padding = '15px';
        item.style.borderBottom = '1px solid #f0f0f0';
        item.style.cursor = 'pointer';
        item.style.position = 'relative';

        // Selection mode style adjustment
        if (window.icityFeedSelectionMode) {
            item.style.paddingLeft = '50px';
        }

        item.onclick = (e) => {
            if (window.icityFeedSelectionMode) {
                toggleIcityFeedSelection(post.id);
                return;
            }
            if (e.target.closest('.fa-heart') || e.target.closest('.fa-comment') || e.target.closest('.fa-ellipsis-v') || e.target.closest('[id^="icity-feed-menu"]')) return;
            openIcityDiaryDetail(post.id, 'friends');
        };
        
        // Lookup dynamic contact info
        let displayName = post.name;
        let displayHandle = post.handle;
        let displayAvatar = post.avatar;
        
        let contact = null;
        if (post.contactId) {
            contact = window.iphoneSimState.contacts.find(c => c.id === post.contactId);
        } else {
            // Fallback: try to find by name match (legacy posts)
            contact = window.iphoneSimState.contacts.find(c => c.name === post.name);
        }

        if (contact) {
            if (contact.icityData) {
                if (contact.icityData.name) displayName = contact.icityData.name;
                if (contact.icityData.handle) displayHandle = contact.icityData.handle;
                if (contact.icityData.avatar) displayAvatar = contact.icityData.avatar;
            }
        }

        // Random relative time strings or actual time
        let timeStr = '刚刚';
        if (typeof post.time === 'number') {
             const seconds = Math.floor((Date.now() - post.time) / 1000);
             if (seconds < 60) timeStr = `${Math.max(1, seconds)}秒钟前`;
             else if (seconds < 3600) timeStr = `${Math.floor(seconds/60)}分钟前`;
             else timeStr = '今天';
        } else {
             timeStr = post.time || '刚刚';
        }
        
        // Use contact avatar if available
        let avatarStyle = 'background: #ccc;';
        if (displayAvatar) {
            avatarStyle = `background-image: url('${displayAvatar}'); background-size: cover; background-position: center;`;
        }

        // Checkbox HTML
        let checkboxHtml = '';
        if (window.icityFeedSelectionMode) {
            const isSelected = window.selectedIcityFeedIds.has(post.id);
            checkboxHtml = `
                <div style="position: absolute; left: 15px; top: 50%; transform: translateY(-50%); width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${isSelected ? '#007AFF' : '#ccc'}; background: ${isSelected ? '#007AFF' : 'transparent'}; display: flex; align-items: center; justify-content: center; z-index: 10;">
                    ${isSelected ? '<i class="fas fa-check" style="color: #fff; font-size: 14px;"></i>' : ''}
                </div>
            `;
        }

        let visIconHtml = '';
        if (post.visibility === 'friends') {
            visIconHtml = '<i class="fas fa-user-friends" style="margin-right: 5px;"></i>';
        } else {
            visIconHtml = '<i class="fas fa-globe" style="margin-right: 5px;"></i>';
        }

        item.innerHTML = `
            ${checkboxHtml}
            <div style="display: flex; align-items: flex-start; margin-bottom: 10px;">
                <div style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; ${avatarStyle}; cursor: pointer;" onclick="event.stopPropagation(); window.openIcityStrangerProfile('${displayName}', '${displayAvatar}', '${displayHandle}', ${contact ? contact.id : 'null'})">
                    ${!displayAvatar ? '<i class="fas fa-user" style="color: #fff; font-size: 20px;"></i>' : ''}
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; font-size: 15px; color: #333;">${displayName}</div>
                    <div style="font-size: 12px; color: #999;">${displayHandle || ''}</div>
                </div>
            </div>
            <div style="font-size: 15px; color: #333; line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap;">${post.content}</div>
            <div style="display: flex; justify-content: flex-end; align-items: center; gap: 15px; color: #ccc; font-size: 13px;">
                <div style="display: flex; align-items: center;">${visIconHtml}</div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <i class="far fa-heart"></i>
                    <span>${post.likes || 0}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <i class="far fa-comment"></i>
                    <span>${(post.commentsList && post.commentsList.length) || post.comments || 0}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;"><i class="far fa-clock"></i> ${timeStr}</div>
                <div style="position: relative;">
                    <i class="fas fa-ellipsis-v" style="cursor: pointer; padding: 5px;" onclick="event.stopPropagation(); toggleIcityFeedMenu(this, ${post.id})"></i>
                    <div id="icity-feed-menu-${post.id}" class="hidden" style="position: absolute; right: 0; bottom: 25px; background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 4px; padding: 5px 0; min-width: 100px; z-index: 10;">
                        <div onclick="event.stopPropagation(); window.handleIcityForward(${post.id}, 'friends')" style="padding: 8px 15px; color: #333; font-size: 14px; cursor: pointer; text-align: left; border-bottom: 1px solid #f0f0f0;">转发</div>
                        <div onclick="event.stopPropagation(); enterIcityFeedSelectionMode(${post.id})" style="padding: 8px 15px; color: #333; font-size: 14px; cursor: pointer; text-align: left;">多选</div>
                        <div onclick="event.stopPropagation(); deleteIcityFeedItem(${post.id})" style="padding: 8px 15px; color: #FF3B30; font-size: 14px; cursor: pointer; text-align: left; border-top: 1px solid #f0f0f0;">删除</div>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

function toggleIcityFeedMenu(btn, id) {
    // Close all others
    document.querySelectorAll('[id^="icity-feed-menu-"]').forEach(el => {
        if (el.id !== `icity-feed-menu-${id}`) el.classList.add('hidden');
    });
    
    const menu = document.getElementById(`icity-feed-menu-${id}`);
    if (menu) {
        menu.classList.toggle('hidden');
        
        // Close on click outside
        const closeMenu = (e) => {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.classList.add('hidden');
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => document.addEventListener('click', closeMenu), 0);
    }
}

function deleteIcityFeedItem(id) {
    if (confirm('确定删除这条动态吗？')) {
        window.iphoneSimState.icityFriendsPosts = window.iphoneSimState.icityFriendsPosts.filter(p => p.id !== id);
        saveConfig();
        renderIcityFriends();
    }
}

function enterIcityFeedSelectionMode(initialId) {
    if (window.icityFeedSelectionMode) return;
    
    window.icityFeedSelectionMode = true;
    window.selectedIcityFeedIds = new Set();
    if (initialId) window.selectedIcityFeedIds.add(initialId);
    
    // Close menus
    document.querySelectorAll('[id^="icity-feed-menu-"]').forEach(el => el.classList.add('hidden'));
    
    renderIcityFriends();
}

function exitIcityFeedSelectionMode() {
    window.icityFeedSelectionMode = false;
    window.selectedIcityFeedIds = new Set();
    renderIcityFriends();
}

function toggleIcityFeedSelection(id) {
    if (window.selectedIcityFeedIds.has(id)) {
        window.selectedIcityFeedIds.delete(id);
    } else {
        window.selectedIcityFeedIds.add(id);
    }
    renderIcityFriends(); // Trigger re-render to update header count and checkboxes
}

function deleteSelectedIcityFeedItems() {
    if (window.selectedIcityFeedIds.size === 0) return;
    
    if (!confirm(`确定删除这 ${window.selectedIcityFeedIds.size} 条动态吗？`)) return;
    
    window.iphoneSimState.icityFriendsPosts = window.iphoneSimState.icityFriendsPosts.filter(
        p => !window.selectedIcityFeedIds.has(p.id)
    );
    
    saveConfig();
    exitIcityFeedSelectionMode();
}

// Export new functions to window
window.switchIcityFeedTab = switchIcityFeedTab;
window.handleGenerateIcityFriends = handleGenerateIcityFriends;
window.enterIcityFeedSelectionMode = enterIcityFeedSelectionMode;
window.exitIcityFeedSelectionMode = exitIcityFeedSelectionMode;
window.toggleIcityFeedSelection = toggleIcityFeedSelection;
window.deleteSelectedIcityFeedItems = deleteSelectedIcityFeedItems;
window.deleteIcityFeedItem = deleteIcityFeedItem;
window.toggleIcityFeedMenu = toggleIcityFeedMenu;

let isGeneratingIcityFriends = false;

function rerenderIcityFriendsIfVisible() {
    const friendsTab = document.getElementById('icity-tab-content-world');
    const headerFriends = document.getElementById('icity-header-friends');
    if (friendsTab && friendsTab.style.display !== 'none' && headerFriends && headerFriends.dataset.active === 'true') {
        renderIcityFriends();
    }
}

function insertIcityFriendsPost(post, options = {}) {
    if (!post) return null;
    if (!window.iphoneSimState.icityFriendsPosts) window.iphoneSimState.icityFriendsPosts = [];

    const normalizedContent = String(post.content || '').trim();
    if (!normalizedContent) return null;

    const candidatePost = {
        ...post,
        content: normalizedContent
    };

    if (typeof window.getIcityFriendPostFingerprint === 'function') {
        const fingerprint = window.getIcityFriendPostFingerprint(candidatePost);
        if (fingerprint) {
            const hasDuplicate = window.iphoneSimState.icityFriendsPosts.some(existing => (
                window.getIcityFriendPostFingerprint(existing) === fingerprint
            ));
            if (hasDuplicate) return null;
        }
    }

    window.iphoneSimState.icityFriendsPosts.unshift(candidatePost);

    if (options.save !== false) saveConfig();
    if (options.render !== false) rerenderIcityFriendsIfVisible();
    return candidatePost;
}

async function handleGenerateIcityFriends() {
    if (isGeneratingIcityFriends) return;
    isGeneratingIcityFriends = true;

    const btn = document.getElementById('icity-world-generate-btn');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
    }
    
    try {
        const linkedIds = window.iphoneSimState.icityProfile.linkedContactIds || [];
        // Support legacy single ID
        if (linkedIds.length === 0 && window.iphoneSimState.icityProfile.linkedContactId) {
            linkedIds.push(window.iphoneSimState.icityProfile.linkedContactId);
        }

        if (linkedIds.length === 0) {
            alert('请先在设置中关联联系人');
            if (btn) btn.innerHTML = '<i class="fas fa-magic"></i>';
            return;
        }

        const contacts = window.iphoneSimState.contacts.filter(c => linkedIds.includes(c.id));
        if (contacts.length === 0) {
            alert('未找到关联的联系人信息');
            if (btn) btn.innerHTML = '<i class="fas fa-magic"></i>';
            return;
        }

        const posts = await callAiForFriendsPosts(contacts);
        if (posts && posts.length > 0) {
            let insertedCount = 0;
            for (let i = posts.length - 1; i >= 0; i--) {
                const insertedPost = insertIcityFriendsPost(posts[i], { save: false, render: false });
                if (insertedPost) insertedCount++;
            }

            if (insertedCount === 0) {
                if (typeof window.showChatToast === 'function') {
                    window.showChatToast('生成结果与现有 iCity 动态重复，已自动跳过', 2800);
                }
                return;
            }

            if (insertedCount > 0) {
                saveConfig();
                rerenderIcityFriendsIfVisible();
            } else if (typeof window.showChatToast === 'function') {
                window.showChatToast('生成结果与现有 iCity 动态重复，已自动跳过', 2800);
            }
        }
    } catch (e) {
        console.error('Failed to generate friends posts:', e);
        alert('生成失败，请检查 API 设置');
    } finally {
        if (btn) btn.innerHTML = '<i class="fas fa-magic"></i>';
    }
}

handleGenerateIcityFriends = async function() {
    if (isGeneratingIcityFriends) return;
    isGeneratingIcityFriends = true;

    const btn = document.getElementById('icity-world-generate-btn');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
    }

    try {
        const linkedIds = window.iphoneSimState.icityProfile.linkedContactIds || [];
        if (linkedIds.length === 0 && window.iphoneSimState.icityProfile.linkedContactId) {
            linkedIds.push(window.iphoneSimState.icityProfile.linkedContactId);
        }

        if (linkedIds.length === 0) {
            alert('请先在设置中关联联系人');
            return;
        }

        if (linkedIds.length === 0) {
            alert('请先在设置中关联联系人');
            return;
        }

        const contacts = window.iphoneSimState.contacts.filter(c => linkedIds.includes(c.id));
        if (contacts.length === 0) {
            alert('未找到已关联的联系人');
            return;
        }

        if (contacts.length === 0) {
            alert('未找到已关联的联系人');
            return;
        }

        const posts = await callAiForFriendsPosts(contacts);
        if (posts && posts.length > 0) {
            let insertedCount = 0;
            for (let i = posts.length - 1; i >= 0; i--) {
                const insertedPost = insertIcityFriendsPost(posts[i], { save: false, render: false });
                if (insertedPost) insertedCount++;
            }

            if (insertedCount > 0) {
                saveConfig();
                rerenderIcityFriendsIfVisible();
            } else if (typeof window.showChatToast === 'function') {
                window.showChatToast('生成结果与现有 iCity 动态重复，已自动跳过', 2800);
            }
        }
    } catch (e) {
        console.error('Failed to generate friends posts:', e);
        alert('生成失败，请检查 API 设置');
    } finally {
        if (btn) {
            btn.innerHTML = '<i class="fas fa-magic"></i>';
            btn.disabled = false;
        }
        isGeneratingIcityFriends = false;
    }
};

window.handleGenerateIcityFriends = handleGenerateIcityFriends;

async function callAiForFriendsPosts(contacts) {
    const postsData = [];
    
    for (const contact of contacts) {
        // Use custom iCity name if available for the prompt
        const displayName = (contact.icityData && contact.icityData.name) ? contact.icityData.name : contact.name;

        // Chat History
        const history = window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contact.id] ? window.iphoneSimState.chatHistory[contact.id].slice(-10) : [];
        const chatContext = history.map(m => `${m.role === 'user' ? '用户' : '我'}: ${m.content}`).join('\n');
        
        // Memories
        const memories = window.iphoneSimState.memories ? window.iphoneSimState.memories.filter(m => m.contactId === contact.id).slice(-5) : [];
        const memoryContext = memories.map(m => m.content).join('\n');
        
        // Worldbook (Linked in iCity settings)
        let wbContext = '';
        if (window.iphoneSimState.icityProfile.linkedWbId) {
             const entries = window.iphoneSimState.worldbook ? window.iphoneSimState.worldbook.filter(e => e.categoryId == window.iphoneSimState.icityProfile.linkedWbId && e.enabled) : [];
             wbContext = entries.map(e => e.content).join('\n').slice(0, 800); // Limit length
        }
        
        // Contact's Linked Worldbooks (from Chat Settings)
        if (contact.linkedWbCategories && contact.linkedWbCategories.length > 0) {
             const entries = window.iphoneSimState.worldbook ? window.iphoneSimState.worldbook.filter(e => contact.linkedWbCategories.includes(e.categoryId) && e.enabled) : [];
             const contactWb = entries.map(e => e.content).join('\n').slice(0, 500);
             if (contactWb) wbContext += '\n' + contactWb;
        }
        
        postsData.push({
            name: displayName,
            originalName: contact.name,
            persona: contact.persona || '无',
            chat: chatContext,
            memory: memoryContext,
            wb: wbContext
        });
    }

    const contextStr = postsData.map(d => `
【角色: ${d.name}】
人设: ${d.persona}
最近聊天片段:
${d.chat}
重要记忆:
${d.memory}
世界观背景:
${d.wb}
`).join('\n--------------------------------\n');

    const prompt = `请基于以下角色的详细上下文，为他们生成一些 iCity 动态。
    
${contextStr}

要求：
1. 为每个角色生成 1 条内容。
2. **风格要求**：日记、感悟、emo时刻。体现内心世界。
3. **结合上下文**：必须结合角色人设、聊天记录和记忆。
4. **可见性设置**：请为每条动态决定是 "public" (公开) 还是 "friends" (仅好友)。
   - 如果内容比较私密、emo、或者是对特定人的悄悄话，设为 "friends"。
   - 如果是分享生活、风景、或者比较大众的话题，设为 "public"。
5. **互动生成**：
   - 如果是 "public"：请生成较多的点赞数(likes)和一些**陌生人/路人**的评论(comments_list)。评论内容要像真实的网友互动。
   - 如果是 "friends"：点赞数较少，评论列表为空(或仅限互关好友，暂时留空即可)。
6. **严禁**输出 "BAKA"、"baka" 等词汇。
7. 严格返回 JSON 数组格式。

格式示例：
[
    {
        "name": "角色姓名",
        "content": "日记内容...",
        "visibility": "public",  // 或 "friends"
        "likes": 128,
        "comments_list": [
            { "name": "路人A", "content": "好美！" },
            { "name": "momo", "content": "求链接" }
        ]
    }
]`;

    const messages = [{ role: 'user', content: prompt }];
    const content = await safeCallAiApi(messages);
    
    // Parse
    try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            return data.map((item, index) => {
                // Find contact by matching either custom name or original name
                // Note: contacts is the list of linked contact objects
                // item.name should match what we sent in prompt (displayName)
                const contact = contacts.find(c => {
                    const customName = (c.icityData && c.icityData.name) ? c.icityData.name : c.name;
                    return customName === item.name || c.name === item.name;
                });

                let name = item.name;
                let handle = '@user';
                let avatar = '';
                
                if (contact) {
                    handle = (contact.icityData && contact.icityData.handle) ? contact.icityData.handle : `@User_${contact.id.toString().substring(0, 4)}`;
                    avatar = (contact.icityData && contact.icityData.avatar) ? contact.icityData.avatar : contact.avatar;
                }

                return {
                    id: Date.now() + index,
                    contactId: contact ? contact.id : null,
                    name: name,
                    handle: handle,
                    avatar: avatar,
                    content: String(item.content || '').trim(),
                    time: Date.now(),
                    visibility: item.visibility || 'public',
                    likes: item.likes || 0,
                    comments: (item.comments_list && item.comments_list.length) || item.comments || 0,
                    commentsList: item.comments_list || []
                };
            });
        }
        throw new Error("No JSON found");
    } catch (e) {
        console.error("Parse error", e);
        return [];
    }
}

window.renderIcityFriends = renderIcityFriends;
window.handleGenerateIcityFriends = handleGenerateIcityFriends;

window.addIcityPost = function(contactId, content, visibility = 'friends') {
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return null;

    const displayName = (contact.icityData && contact.icityData.name) ? contact.icityData.name : contact.name;
    const handle = (contact.icityData && contact.icityData.handle) ? contact.icityData.handle : `@User_${contact.id.toString().substring(0, 4)}`;
    const avatar = (contact.icityData && contact.icityData.avatar) ? contact.icityData.avatar : contact.avatar;

    const newPost = {
        id: Date.now(),
        contactId: contact.id,
        name: displayName,
        handle: handle,
        avatar: avatar,
        content: content,
        time: Date.now(),
        visibility: visibility,
        likes: 0,
        comments: 0
    };

    const insertedPost = insertIcityFriendsPost(newPost);
    if (!insertedPost) return null;

    // Inject into chat history
    if (!window.iphoneSimState.chatHistory) window.iphoneSimState.chatHistory = {};
    if (!window.iphoneSimState.chatHistory[contactId]) window.iphoneSimState.chatHistory[contactId] = [];
    
    window.iphoneSimState.chatHistory[contactId].push({
        id: Date.now() + Math.random(),
        role: 'system',
        type: 'system_event',
        content: `(你在iCity发布了动态: "${content}")`,
        time: Date.now()
    });

    return insertedPost;
};

window.writeToIcityBook = function(contactId, content) {
    const books = window.iphoneSimState.icityBooks || [];
    // Find book linked to contact
    const linkedBook = books.find(b => b.linkedContactIds && b.linkedContactIds.includes(contactId));
    
    if (!linkedBook) return false;

    if (!linkedBook.pages) linkedBook.pages = [];
    
    let processedContent = content.trim();
    processedContent = processedContent.replace(/\n/g, '<br>');
    
    if (window.iphoneSimState.stickerCategories) {
         processedContent = processedContent.replace(/\[\[STICKER:(.*?)\]\]/g, (match, name) => {
            for (const cat of window.iphoneSimState.stickerCategories) {
                const sticker = cat.list.find(s => s.desc === name.trim());
                if (sticker) {
                    return `<img src="${sticker.url}" class="icity-sticker" style="max-width: 30%; float: right; margin: 5px 0 5px 10px;">`;
                }
            }
            return '';
        });
    }

    linkedBook.pages.push({
        content: processedContent,
        author: 'ai',
        lastModified: Date.now()
    });
    
    saveConfig();
    
    if (window.currentReadingBook && window.currentReadingBook.id === linkedBook.id) {
        renderBookPages(linkedBook);
    }
    
    if (window.showChatNotification) {
        window.showChatNotification(contactId, `[iCity] ${linkedBook.name} 更新了新内容`);
    }

    // Inject into chat history
    if (!window.iphoneSimState.chatHistory) window.iphoneSimState.chatHistory = {};
    if (!window.iphoneSimState.chatHistory[contactId]) window.iphoneSimState.chatHistory[contactId] = [];
    
    window.iphoneSimState.chatHistory[contactId].push({
        id: Date.now() + Math.random(),
        role: 'system',
        type: 'system_event',
        content: `(你在共读手账《${linkedBook.name}》中写了新内容: "${content}")`,
        time: Date.now()
    });
    
    return true;
};

// Scheduled Diary Generation
window.generateScheduledContactDiary = async function(contact) {
    console.log('Generating scheduled diary for:', contact.name);
    
    // Show hidden notification (optional, maybe not needed for background task)
    // showNotification(`正在生成 ${contact.name} 的今日日记...`);

    // Prepare Context
    // Use custom iCity name if available
    const displayName = (contact.icityData && contact.icityData.name) ? contact.icityData.name : contact.name;

    // Chat History (Today's chat if possible, or recent)
    const history = window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contact.id] ? window.iphoneSimState.chatHistory[contact.id].slice(-20) : [];
    const chatContext = history.map(m => `${m.role === 'user' ? '用户' : '我'}: ${m.content}`).join('\n');
    
    // Memories
    const memories = window.iphoneSimState.memories ? window.iphoneSimState.memories.filter(m => m.contactId === contact.id).slice(-5) : [];
    const memoryContext = memories.map(m => m.content).join('\n');
    
    // Worldbook
    let wbContext = '';
    if (contact.linkedWbCategories && contact.linkedWbCategories.length > 0) {
            const entries = window.iphoneSimState.worldbook ? window.iphoneSimState.worldbook.filter(e => contact.linkedWbCategories.includes(e.categoryId) && e.enabled) : [];
            const contactWb = entries.map(e => e.content).join('\n').slice(0, 500);
            if (contactWb) wbContext += '\n' + contactWb;
    }


    const prompt = `你现在扮演 ${contact.name} (iCity昵称: ${displayName})。
人设: ${contact.persona || '无'}
世界观背景: ${wbContext}
重要记忆: ${memoryContext}
最近聊天:
${chatContext}

【任务】
请写一篇较长的日记，总结你今天的一天。
时间是晚上（或者你设定的时间），你正在回顾今天发生的事情、你的心情、或者你的感悟。

【要求】
1. **篇幅较长**：内容要丰富，字数在 100-300 字之间。
2. **深度结合上下文**：
   - 如果今天和用户（"我"）聊过天，请在日记中提到今天聊的话题，或者对用户的看法。
   - 如果有特定世界观，内容要符合该世界观下的生活状态。
   - 如果没有特别的事情，可以写你的日常生活、心理活动、或者对未来的期许。
3. **风格**：完全沉浸在角色中，使用角色的口吻。可以是感性的、碎碎念的、或者严肃的，取决于人设。
4. **禁语**：**严禁**输出 "BAKA"、"baka" 等词汇。
5. **格式**：只返回日记正文内容，不要包含任何解释性文字或JSON格式。直接输出纯文本。

请开始写日记：`;

    try {
        const messages = [{ role: 'user', content: prompt }];
        const content = await safeCallAiApi(messages);
        
        if (content) {
            const newPost = {
                id: Date.now(),
                contactId: contact.id,
                name: displayName,
                handle: (contact.icityData && contact.icityData.handle) ? contact.icityData.handle : `@User_${contact.id.toString().substring(0, 4)}`,
                avatar: (contact.icityData && contact.icityData.avatar) ? contact.icityData.avatar : contact.avatar,
                content: content.trim(),
                time: Date.now(),
                likes: Math.floor(Math.random() * 10),
                comments: 0
            };

            const insertedPost = insertIcityFriendsPost(newPost);
            if (!insertedPost) return;
            
            // Optional: Notification
            if (window.showChatNotification) {
                window.showChatNotification(contact.id, `[iCity] ${displayName} 发布了今日日记`);
            }
        }
    } catch (e) {
        console.error('Failed to generate scheduled diary:', e);
    }
};

// Calendar Functions
function renderIcityCalendar(year = 2026) {
    const calendarScreen = document.getElementById('icity-calendar-screen');
    if (!calendarScreen) return;

    // Update Year Selector
    const yearsContainer = document.getElementById('icity-calendar-years');
    if (yearsContainer) {
        yearsContainer.innerHTML = '';
        const years = [2026];
        years.forEach(y => {
            const span = document.createElement('span');
            span.textContent = y;
            if (y === year) {
                span.style.cssText = 'color: #fff; background: #7C9BF8; padding: 2px 12px; border-radius: 12px; cursor: default;';
            } else {
                span.style.cssText = 'cursor: pointer;';
                span.onclick = () => renderIcityCalendar(y);
            }
            yearsContainer.appendChild(span);
        });
    }

    // Filter diaries for this year
    const diaries = window.iphoneSimState.icityDiaries || [];
    const yearDiaries = diaries.filter(d => new Date(d.time).getFullYear() === year);
    
    // Stats
    const distinctDays = new Set(yearDiaries.map(d => {
        const date = new Date(d.time);
        return `${date.getMonth()}-${date.getDate()}`;
    })).size;
    
    const daysEl = document.getElementById('icity-calendar-days');
    if (daysEl) daysEl.textContent = distinctDays;
    const countEl = document.getElementById('icity-calendar-count');
    if (countEl) countEl.textContent = yearDiaries.length;

    // Heatmap
    renderIcityHeatmap(year, yearDiaries);

    // Monthly List
    renderIcityMonthlyList(year, yearDiaries);
}

function renderIcityHeatmap(year, diaries) {
    const container = document.getElementById('icity-calendar-heatmap');
    if (!container) return;
    container.innerHTML = '';
    
    const diaryDates = new Set(diaries.map(d => {
        const date = new Date(d.time);
        return `${date.getMonth()}-${date.getDate()}`;
    }));

    const today = new Date(); // Uses system/simulated time
    
    for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= 31; d++) {
            const el = document.createElement('div');
            el.style.width = '100%';
            el.style.aspectRatio = '1/1';
            
            // Check validity
            // Note: Date(2026, 1, 30) -> March 2
            const date = new Date(year, m, d);
            if (date.getMonth() !== m) {
                el.style.background = 'transparent'; // Invalid date
            } else {
                el.style.background = '#f0f0f0';
                el.style.borderRadius = '1px';
                
                const key = `${m}-${d}`;
                
                // Today check (Yellow)
                if (year === today.getFullYear() && m === today.getMonth() && d === today.getDate()) {
                    el.style.background = '#FFCC00';
                }
                
                if (diaryDates.has(key)) {
                    el.style.background = '#7C9BF8'; // Blue for diary
                } else if (year === today.getFullYear() && m === today.getMonth() && d === today.getDate()) {
                    el.style.background = '#FFCC00'; // Yellow for today (no diary)
                }
            }
            container.appendChild(el);
        }
    }
}

function renderIcityMonthlyList(year, diaries) {
    const container = document.getElementById('icity-calendar-months');
    if (!container) return;
    container.innerHTML = '';

    // Weekday Header
    const weekHeader = document.createElement('div');
    weekHeader.style.display = 'flex';
    weekHeader.style.gap = '10px';
    weekHeader.style.marginBottom = '10px';
    
    const spacer = document.createElement('div');
    spacer.style.width = '50px';
    spacer.style.flexShrink = '0';
    weekHeader.appendChild(spacer);
    
    const weekGrid = document.createElement('div');
    weekGrid.style.flex = '1';
    weekGrid.style.display = 'grid';
    weekGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    weekGrid.style.gap = '5px';
    weekGrid.style.textAlign = 'center';
    weekGrid.style.fontSize = '12px';
    weekGrid.style.color = '#ccc';
    
    ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].forEach(d => {
        const el = document.createElement('div');
        el.textContent = d;
        weekGrid.appendChild(el);
    });
    weekHeader.appendChild(weekGrid);
    container.appendChild(weekHeader);

    const today = new Date();
    const diaryDates = new Set(diaries.map(d => {
        const date = new Date(d.time);
        return `${date.getMonth()}-${date.getDate()}`;
    }));

    let startM = 11;
    if (year === today.getFullYear()) startM = today.getMonth();
    else if (year > today.getFullYear()) startM = -1;

    // Months reverse order
    for (let m = startM; m >= 0; m--) {
        const monthDiv = document.createElement('div');
        monthDiv.style.marginBottom = '20px';
        
        const monthNameEn = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][m];
        const monthNameCn = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"][m];
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.gap = '10px';
        
        const header = document.createElement('div');
        header.style.width = '50px';
        header.style.textAlign = 'right';
        header.style.paddingTop = '0px';
        header.innerHTML = `
            <div style="font-weight: bold; font-size: 14px;">${monthNameEn}</div>
            <div style="font-weight: bold; font-size: 12px;">${monthNameCn}</div>
            <div style="font-size: 10px; color: #999;">${year}</div>
            <div style="margin-top: 5px; font-size: 10px; color: #999; background: #f0f0f0; display: inline-block; padding: 2px 5px; border-radius: 4px;">
                ${getDiariesCountInMonth(diaries, m)}天
            </div>
        `;
        
        const grid = document.createElement('div');
        grid.style.flex = '1';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        grid.style.gap = '10px';
        grid.style.rowGap = '15px';
        grid.style.marginTop = '10px';
        
        // Days
        let firstDay = new Date(year, m, 1).getDay(); // 0 = Sun
        firstDay = (firstDay + 6) % 7; // 0 = Mon
        
        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }
        
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dayEl = document.createElement('div');
            dayEl.style.aspectRatio = '1/1';
            dayEl.style.display = 'flex';
            dayEl.style.alignItems = 'center';
            dayEl.style.justifyContent = 'center';
            dayEl.style.borderRadius = '4px';
            dayEl.style.fontSize = '14px';
            dayEl.style.color = '#666';
            dayEl.style.background = '#f9f9f9'; // Default box
            dayEl.textContent = d;
            
            const key = `${m}-${d}`;
            if (diaryDates.has(key)) {
                dayEl.style.background = '#7C9BF8'; // Blue
                dayEl.style.color = '#fff';
            }
            
            // Today Highlight
            if (year === today.getFullYear() && m === today.getMonth() && d === today.getDate()) {
                dayEl.style.position = 'relative';
                const line = document.createElement('div');
                line.style.position = 'absolute';
                line.style.bottom = '2px';
                line.style.width = '15px';
                line.style.height = '2px';
                line.style.background = '#FFCC00';
                dayEl.appendChild(line);
            }
            
            grid.appendChild(dayEl);
        }
        
        wrapper.appendChild(header);
        wrapper.appendChild(grid);
        monthDiv.appendChild(wrapper);
        container.appendChild(monthDiv);
    }
}

function getDiariesCountInMonth(diaries, month) {
    return new Set(diaries.filter(d => new Date(d.time).getMonth() === month).map(d => new Date(d.time).getDate())).size;
}

// Stranger Profile Logic
window.currentStrangerProfile = null;

async function openIcityStrangerProfile(name, avatar, handle, contactId) {
    const screen = document.getElementById('icity-stranger-profile-screen');
    if (!screen) return;

    window.currentStrangerProfile = { name, avatar, handle, contactId };

    // Reset UI
    const bgEl = document.getElementById('icity-stranger-profile-bg');
    const avatarEl = document.getElementById('icity-stranger-profile-avatar');
    const nameEl = document.getElementById('icity-stranger-profile-name');
    const idEl = document.getElementById('icity-stranger-profile-id');
    const listEl = document.getElementById('icity-stranger-profile-diary-list');

    if (bgEl) bgEl.style.backgroundImage = '';
    
    // Default Gray Avatar for Strangers (force empty if no contactId)
    // If contactId is present, we try to use provided avatar or contact avatar
    let showAvatar = avatar;
    if (!contactId) {
        showAvatar = ''; // Force default gray for strangers
    }

    if (avatarEl) {
        if (showAvatar && showAvatar !== 'undefined' && showAvatar !== 'null') {
            avatarEl.style.backgroundImage = `url('${showAvatar}')`;
            avatarEl.style.backgroundColor = 'transparent';
            avatarEl.innerHTML = '';
        } else {
            avatarEl.style.backgroundImage = '';
            avatarEl.style.backgroundColor = '#ccc';
            avatarEl.innerHTML = '<i class="fas fa-user" style="color: #fff; font-size: 40px; display: flex; align-items: center; justify-content: center; height: 100%;"></i>';
        }
    }
    if (nameEl) nameEl.textContent = name;
    if (idEl) idEl.textContent = handle || '@user';
    
    // Update Add Friend Button State
    const addFriendBtn = document.getElementById('icity-stranger-add-friend-btn');
    if (addFriendBtn) {
        const isFriend = window.iphoneSimState.contacts.some(c => (contactId && c.id === contactId) || c.name === name);
        if (isFriend) {
            addFriendBtn.textContent = '已添加';
            addFriendBtn.disabled = true;
            addFriendBtn.style.backgroundColor = '#ccc';
        } else {
            addFriendBtn.textContent = '加好友';
            addFriendBtn.disabled = false;
            addFriendBtn.style.backgroundColor = '#007AFF';
        }
    }

    // Show screen
    screen.classList.remove('hidden');

    // CACHE LOGIC
    if (!window.iphoneSimState.icityStrangerProfiles) {
        window.iphoneSimState.icityStrangerProfiles = {};
    }
    
    const cacheKey = contactId ? `contact_${contactId}` : `name_${name}`;
    const cached = window.iphoneSimState.icityStrangerProfiles[cacheKey];
    
    if (cached && cached.posts && cached.posts.length > 0) {
        // Use cached
        renderIcityStrangerDiaries(cached.posts);
    } else {
        if (listEl) listEl.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;"><i class="fas fa-spinner fa-spin"></i> 正在加载...</div>';
        // Generate
        await handleGenerateStrangerContent(name, contactId);
    }
}

async function handleGenerateStrangerContent(name, contactId) {
    try {
        let contact = null;
        if (contactId) {
            contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
        } else {
            // Try to find by name if contactId is null
            contact = window.iphoneSimState.contacts.find(c => c.name === name);
        }

        const posts = await callAiForStrangerProfile(name, contact);
        
        // Cache it
        if (!window.iphoneSimState.icityStrangerProfiles) {
            window.iphoneSimState.icityStrangerProfiles = {};
        }
        const cacheKey = contactId ? `contact_${contactId}` : `name_${name}`;
        window.iphoneSimState.icityStrangerProfiles[cacheKey] = {
            name: name,
            contactId: contactId,
            posts: posts,
            lastUpdated: Date.now()
        };
        saveConfig();
        
        renderIcityStrangerDiaries(posts);
    } catch (e) {
        console.error('Failed to generate stranger content:', e);
        const listEl = document.getElementById('icity-stranger-profile-diary-list');
        if (listEl) listEl.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">加载失败</div>';
    }
}

async function callAiForStrangerProfile(name, contact) {
    let contextPrompt = "";
    if (contact) {
        const history = window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contact.id] ? window.iphoneSimState.chatHistory[contact.id].slice(-10) : [];
        const chatContext = history.map(m => `${m.role === 'user' ? '用户' : '我'}: ${m.content}`).join('\n');
        contextPrompt = `
【角色信息】
姓名: ${contact.name}
人设: ${contact.persona || '无'}
最近聊天:
${chatContext}
`;
    } else {
        contextPrompt = `
【角色信息】
姓名: ${name}
身份: 路人网友
`;
    }

    const prompt = `请为用户 ${name} 生成 iCity 个人主页的内容。
${contextPrompt}

要求：
1. 生成 3-5 条过往动态（日记）。
2. 内容要符合人设（如果是联系人）或网友风格（如果是路人）。
3. 包含：内容、大致时间（例如 "2天前"）、点赞数、评论数。
4. 严格返回 JSON 数组格式。

格式示例：
[
    {
        "content": "今天心情不错...",
        "time": "2天前",
        "likes": 32,
        "comments": 5
    }
]`;

    const messages = [{ role: 'user', content: prompt }];
    const content = await safeCallAiApi(messages);
    
    try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch (e) {
        console.error("Parse error", e);
    }
    return [];
}

function renderIcityStrangerDiaries(posts) {
    const list = document.getElementById('icity-stranger-profile-diary-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (!posts || posts.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 50px; color: #999;">暂无动态</div>';
        return;
    }

    posts.forEach(post => {
        const item = document.createElement('div');
        item.style.borderBottom = '1px solid #f0f0f0';
        item.style.padding = '15px 0';
        
        item.innerHTML = `
            <div style="font-size: 15px; color: #333; line-height: 1.6; margin-bottom: 8px; white-space: pre-wrap;">${post.content}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; color: #ccc; font-size: 12px;">
                <span>${post.time}</span>
                <div style="display: flex; gap: 15px;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <i class="far fa-heart"></i>
                        <span>${post.likes}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <i class="far fa-comment"></i>
                        <span>${post.comments}</span>
                    </div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
}

window.openIcityStrangerProfile = openIcityStrangerProfile;

function showIcityBookMenu(bookId) {
    // Remove existing if any
    const existing = document.getElementById('icity-book-action-sheet');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'icity-book-action-sheet';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.4); z-index: 1000;
        display: flex; flex-direction: column; justify-content: flex-end;
    `;
    
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };

    const sheet = document.createElement('div');
    sheet.style.cssText = `
        background: #f2f2f7; border-radius: 12px 12px 0 0; padding: 20px; padding-bottom: max(20px, env(safe-area-inset-bottom));
        animation: slideUp 0.3s ease;
    `;
    
    // Options
    const options = [
        { text: '更改书名', color: '#007AFF', action: () => renameIcityBook(bookId) },
        { text: '更改封面', color: '#007AFF', action: () => changeIcityBookCover(bookId) },
        { text: '删除', color: '#FF3B30', action: () => deleteIcityBook(bookId) }
    ];

    const group = document.createElement('div');
    group.style.cssText = 'background: #fff; border-radius: 12px; overflow: hidden; margin-bottom: 10px;';

    options.forEach((opt, index) => {
        const btn = document.createElement('div');
        btn.textContent = opt.text;
        btn.style.cssText = `
            padding: 15px; text-align: center; font-size: 16px; color: ${opt.color};
            background: #fff; cursor: pointer;
            ${index < options.length - 1 ? 'border-bottom: 1px solid #eee;' : ''}
        `;
        btn.onclick = () => {
            overlay.remove();
            opt.action();
        };
        group.appendChild(btn);
    });

    const cancelBtn = document.createElement('div');
    cancelBtn.textContent = '取消';
    cancelBtn.style.cssText = `
        padding: 15px; text-align: center; font-size: 16px; color: #007AFF;
        background: #fff; border-radius: 12px; cursor: pointer; font-weight: bold;
    `;
    cancelBtn.onclick = () => overlay.remove();

    sheet.appendChild(group);
    sheet.appendChild(cancelBtn);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
    
    // Add CSS animation if not exists
    if (!document.getElementById('slideUp-style')) {
        const style = document.createElement('style');
        style.id = 'slideUp-style';
        style.innerHTML = '@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }';
        document.head.appendChild(style);
    }
}

function renameIcityBook(id) {
    const book = window.iphoneSimState.icityBooks.find(b => b.id === id);
    if (!book) return;
    
    const newName = prompt('请输入新的书名:', book.name);
    if (newName && newName.trim()) {
        book.name = newName.trim();
        saveConfig();
        renderIcityBooks();
    }
}

function changeIcityBookCover(id) {
    // Create hidden input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            compressImage(file, 300, 0.7).then(base64 => {
                const book = window.iphoneSimState.icityBooks.find(b => b.id === id);
                if (book) {
                    book.cover = base64;
                    saveConfig();
                    renderIcityBooks();
                }
            });
        }
    };
    input.click();
}

window.showIcityBookMenu = showIcityBookMenu;
window.renameIcityBook = renameIcityBook;
window.changeIcityBookCover = changeIcityBookCover;

// Book Reader Logic
function injectBookStyles() {
    if (document.getElementById('icity-book-styles')) return;
    const style = document.createElement('style');
    style.id = 'icity-book-styles';
    style.innerHTML = `
        .book-reader-screen {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #e0e0e0; z-index: 2000;
            display: flex; flex-direction: column;
            opacity: 0; pointer-events: none; transition: opacity 0.3s;
            overflow: hidden;
            overscroll-behavior: contain;
            isolation: isolate;
        }
        .book-reader-screen.visible {
            opacity: 1; pointer-events: auto;
        }
        .book-reader-header {
            padding: max(18px, calc(env(safe-area-inset-top) + 12px)) 20px 10px;
            display: flex; justify-content: space-between;
            align-items: center; background: transparent; z-index: 30;
            position: relative; flex-shrink: 0;
        }
        .book-stage {
            flex: 1; display: flex; align-items: center; justify-content: center;
            perspective: 1500px; overflow: hidden; position: relative;
            min-height: 0; z-index: 1;
        }
        .book-3d {
            width: 80vw; max-width: 400px;
            aspect-ratio: 3/4;
            position: relative;
            transform-style: preserve-3d;
            transition: transform 0.5s;
            contain: layout paint style;
            isolation: isolate;
        }
        .book-page {
            position: absolute; top: 0; left: 0;
            width: 100%; height: 100%;
            background: #fff;
            border-radius: 2px 6px 6px 2px;
            box-shadow: inset 5px 0 10px rgba(0,0,0,0.05), 0 2px 5px rgba(0,0,0,0.1);
            transform-origin: left center;
            transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
            backface-visibility: hidden;
            display: flex; flex-direction: column;
            overflow: hidden;
            contain: layout paint style;
        }
        .book-page.flipped {
            transform: rotateY(-180deg);
        }
        .book-page-content {
            flex: 1; padding: 30px; font-size: 16px; line-height: 1.8;
            color: #333; overflow-y: auto; white-space: pre-wrap; font-family: 'Songti SC', serif;
            outline: none;
            min-height: 0;
            word-break: break-word;
            overflow-wrap: anywhere;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: contain;
        }
        .book-page-footer {
            height: 30px; display: flex; justify-content: center; align-items: center;
            font-size: 12px; color: #999;
        }
        .book-cover-page {
            background-size: cover; background-position: center;
        }
        .book-controls {
            position: absolute; bottom: 20px; width: 100%;
            display: flex; justify-content: center; gap: 20px; z-index: 20;
            padding-bottom: max(0px, env(safe-area-inset-bottom));
        }
        .book-control-btn {
            background: rgba(0,0,0,0.5); color: #fff; border: none;
            padding: 10px 20px; border-radius: 20px; cursor: pointer;
        }
        .book-reader-screen.flat-mode .book-stage {
            padding: 0 16px 90px;
        }
        .book-reader-screen.flat-mode .book-3d {
            width: min(88vw, 420px);
            height: min(62vh, 640px);
            max-height: 62vh;
            aspect-ratio: auto;
            transform-style: flat;
            perspective: none;
        }
        .book-reader-screen.flat-mode .book-page {
            position: relative;
            border-radius: 14px;
            transform: none !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        }
        .book-reader-screen.flat-mode .book-page-content {
            padding: 28px 28px 20px;
        }
        /* Animation helper for opening */
        .book-fly-anim {
            position: fixed; z-index: 3000;
            transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
            transform-origin: center center;
        }
        
        /* Annotation Styles */
        rt.handwritten {
            font-family: "Comic Sans MS", "Chalkboard SE", sans-serif;
            font-size: 0.6em;
            /* transform: rotate(-5deg); Removed rotation to make text flat */
            display: inline-block;
            text-align: center;
            opacity: 0.9;
            line-height: 1.2;
        }
        /* Pen Colors for Ruby/Handwritten */
        .pen-blue { color: #007AFF; }
        .pen-red { color: #FF3B30; }
        .pen-purple { color: #5856D6; }
        .pen-pink { color: #FF2D55; }
        .pen-teal { color: #30B0C7; }
        .pen-black { color: #333; }

        .highlight-marker {
            border-radius: 4px;
            padding: 0 2px;
        }
        /* Highlighter Colors */
        .highlight-yellow { background: linear-gradient(120deg, rgba(255, 235, 59, 0.4) 0%, rgba(255, 235, 59, 0.1) 100%); }
        .highlight-green { background: linear-gradient(120deg, rgba(52, 199, 89, 0.3) 0%, rgba(52, 199, 89, 0.1) 100%); }
        .highlight-pink { background: linear-gradient(120deg, rgba(255, 45, 85, 0.2) 0%, rgba(255, 45, 85, 0.1) 100%); }
        .highlight-blue { background: linear-gradient(120deg, rgba(0, 122, 255, 0.2) 0%, rgba(0, 122, 255, 0.1) 100%); }
        .highlight-purple { background: linear-gradient(120deg, rgba(88, 86, 214, 0.2) 0%, rgba(88, 86, 214, 0.1) 100%); }

        .strikethrough-hand {
            text-decoration: line-through;
            text-decoration-color: #FF3B30; /* Default red strike */
            text-decoration-style: wavy;
            text-decoration-thickness: 2px;
            color: #999;
        }
        .handwritten-text {
            font-family: "Comic Sans MS", "Chalkboard SE", sans-serif;
        }
        .book-page-content .icity-ruby-note {
            display: inline-flex;
            flex-direction: column;
            align-items: flex-start;
            vertical-align: top;
            max-width: 100%;
            margin: 0 2px;
        }
        .book-page-content .icity-ruby-base {
            display: inline;
        }
        .book-page-content .icity-ruby-rt {
            display: block;
            max-width: min(16em, 100%);
            white-space: normal;
            word-break: break-word;
            overflow-wrap: anywhere;
            line-height: 1.15;
            margin-bottom: 2px;
        }
        .book-page-content img.icity-sticker {
            max-width: min(30%, 140px);
            height: auto;
            float: right;
            clear: right;
            margin: 8px 0 8px 12px;
            border-radius: 4px;
        }
        
        /* Reset helper */
        .reset-style {
            color: #333 !important;
            background: transparent !important;
            font-weight: normal !important;
            font-style: normal !important;
            text-decoration: none !important;
            font-family: inherit !important;
        }
    `;
    document.head.appendChild(style);
}

const ICITY_BOOK_ALLOWED_CLASSES = new Set([
    'handwritten',
    'pen-blue',
    'pen-red',
    'pen-purple',
    'pen-pink',
    'pen-teal',
    'pen-black',
    'highlight-marker',
    'highlight-yellow',
    'highlight-green',
    'highlight-pink',
    'highlight-blue',
    'highlight-purple',
    'strikethrough-hand',
    'handwritten-text',
    'reset-style',
    'icity-sticker',
    'icity-ruby-note',
    'icity-ruby-base',
    'icity-ruby-rt'
]);

const ICITY_BOOK_TEXT_COLOR_CLASS_MAP = [
    { values: ['#007aff', 'rgb(0,122,255)'], className: 'pen-blue' },
    { values: ['#ff3b30', 'rgb(255,59,48)'], className: 'pen-red' },
    { values: ['#5856d6', 'rgb(88,86,214)'], className: 'pen-purple' },
    { values: ['#ff2d55', 'rgb(255,45,85)'], className: 'pen-pink' },
    { values: ['#30b0c7', 'rgb(48,176,199)'], className: 'pen-teal' },
    { values: ['#333333', '#000000', 'rgb(51,51,51)', 'rgb(0,0,0)'], className: 'pen-black' }
];

function normalizeIcityBookColorValue(value) {
    return String(value || '').toLowerCase().replace(/\s+/g, '');
}

function mapIcityBookTextColorToClass(value) {
    const normalized = normalizeIcityBookColorValue(value);
    if (!normalized) return null;
    const matched = ICITY_BOOK_TEXT_COLOR_CLASS_MAP.find(item => item.values.includes(normalized));
    return matched ? matched.className : null;
}

function extractIcityBookClasses(node, tagName) {
    const classes = new Set();
    if (node.classList) {
        node.classList.forEach(cls => {
            if (ICITY_BOOK_ALLOWED_CLASSES.has(cls)) {
                classes.add(cls);
            }
        });
    }

    const fontColor = node.getAttribute && node.getAttribute('color');
    const style = node.getAttribute && node.getAttribute('style');
    const styleColorMatch = style && style.match(/(?:^|;)\s*color\s*:\s*([^;]+)/i);
    const colorClass = mapIcityBookTextColorToClass(
        fontColor || (styleColorMatch ? styleColorMatch[1] : '')
    );
    if (colorClass) classes.add(colorClass);

    if (tagName === 'rt') {
        classes.add('handwritten');
    }
    if (tagName === 's') {
        classes.add('strikethrough-hand');
    }
    if (tagName === 'img') {
        classes.add('icity-sticker');
    }

    return Array.from(classes);
}

function sanitizeIcityBookNode(node) {
    if (!node) return null;
    if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent || '');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const tagName = node.tagName.toLowerCase();

    if (tagName === 'br') {
        return document.createElement('br');
    }

    if (tagName === 'img') {
        const src = String(node.getAttribute('src') || '').trim();
        if (!src || !/^(https?:\/\/|data:image\/)/i.test(src)) return null;
        const img = document.createElement('img');
        img.src = src;
        img.className = extractIcityBookClasses(node, tagName).join(' ');
        if (!img.className) img.className = 'icity-sticker';
        return img;
    }

    if (['div', 'p', 'section', 'article', 'blockquote', 'li'].includes(tagName)) {
        const fragment = document.createDocumentFragment();
        Array.from(node.childNodes).forEach(child => {
            const sanitizedChild = sanitizeIcityBookNode(child);
            if (sanitizedChild) fragment.appendChild(sanitizedChild);
        });
        fragment.appendChild(document.createElement('br'));
        return fragment;
    }

    if (tagName === 'ruby') {
        const wrapper = document.createElement('span');
        wrapper.className = 'icity-ruby-note';

        const note = document.createElement('span');
        note.className = 'icity-ruby-rt handwritten';

        const base = document.createElement('span');
        base.className = 'icity-ruby-base';

        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === 'rt') {
                const rtClasses = extractIcityBookClasses(child, 'rt');
                note.className = `icity-ruby-rt ${rtClasses.join(' ')}`.trim();
                Array.from(child.childNodes).forEach(rtChild => {
                    const sanitizedRtChild = sanitizeIcityBookNode(rtChild);
                    if (sanitizedRtChild) note.appendChild(sanitizedRtChild);
                });
                return;
            }

            const sanitizedBaseChild = sanitizeIcityBookNode(child);
            if (sanitizedBaseChild) base.appendChild(sanitizedBaseChild);
        });

        if (!note.textContent.trim()) {
            note.className = 'icity-ruby-rt handwritten pen-black';
        }

        wrapper.appendChild(note);
        wrapper.appendChild(base);
        return wrapper;
    }

    let normalizedTag = tagName;
    if (tagName === 'b') normalizedTag = 'strong';
    if (tagName === 'i') normalizedTag = 'em';
    if (tagName === 'font') normalizedTag = 'span';

    if (!['ruby', 'rt', 'span', 's', 'strong', 'em', 'u'].includes(normalizedTag)) {
        const fragment = document.createDocumentFragment();
        Array.from(node.childNodes).forEach(child => {
            const sanitizedChild = sanitizeIcityBookNode(child);
            if (sanitizedChild) fragment.appendChild(sanitizedChild);
        });
        return fragment;
    }

    const el = document.createElement(normalizedTag);
    const classes = extractIcityBookClasses(node, normalizedTag);
    const style = String(node.getAttribute('style') || '');
    const hasBoldStyle = /font-weight\s*:\s*(bold|[6-9]00)/i.test(style);
    const hasItalicStyle = /font-style\s*:\s*italic/i.test(style);
    const hasUnderlineStyle = /text-decoration[^;]*underline/i.test(style);

    if (classes.length > 0) {
        el.className = classes.join(' ');
    }
    if (hasBoldStyle) {
        el.style.fontWeight = '700';
    }
    if (hasItalicStyle) {
        el.style.fontStyle = 'italic';
    }
    if (hasUnderlineStyle) {
        el.style.textDecoration = 'underline';
    }

    Array.from(node.childNodes).forEach(child => {
        const sanitizedChild = sanitizeIcityBookNode(child);
        if (sanitizedChild) el.appendChild(sanitizedChild);
    });

    return el;
}

function sanitizeIcityBookHtml(html) {
    if (!html) return '';

    const template = document.createElement('template');
    template.innerHTML = String(html);
    const wrapper = document.createElement('div');

    Array.from(template.content.childNodes).forEach(node => {
        const sanitizedNode = sanitizeIcityBookNode(node);
        if (sanitizedNode) wrapper.appendChild(sanitizedNode);
    });

    return wrapper.innerHTML
        .replace(/(?:<br>\s*){3,}/gi, '<br><br>')
        .replace(/^(?:<br>\s*)+|(?:<br>\s*)+$/gi, '')
        .trim();
}

function getIcityBookPageElements() {
    return Array.from(document.querySelectorAll('#book-3d-container .book-page'));
}

function getCurrentIcityBookContentElement() {
    const container = document.getElementById('book-3d-container');
    return container ? container.querySelector('.book-page-content') : null;
}

function clampCurrentIcityBookPage(book) {
    if (!book) return 0;
    const maxPageIndex = Math.max(0, (book.pages ? book.pages.length : 0));
    if (!Number.isInteger(window.currentBookPage)) {
        window.currentBookPage = 0;
    }
    window.currentBookPage = Math.min(Math.max(window.currentBookPage, 0), maxPageIndex);
    return window.currentBookPage;
}

function shouldUseFlatIcityBookRenderer(book) {
    if (!book) return false;
    const isSmallOrTouchViewport = window.innerWidth <= 900 ||
        (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
    const totalContentLength = (book.pages || []).reduce((sum, page) => sum + String(page.content || '').length, 0);
    const stickerCount = (book.pages || []).reduce((sum, page) => {
        const matches = String(page.content || '').match(/class="[^"]*icity-sticker[^"]*"/g);
        return sum + (matches ? matches.length : 0);
    }, 0);
    return isSmallOrTouchViewport || book.pages.length >= 12 || totalContentLength >= 12000 || stickerCount >= 8;
}

function createIcityBookPageElement(pageIndex, page, options = {}) {
    const { isCover = false, zIndex = null } = options;
    const pageDiv = document.createElement('div');
    pageDiv.className = `book-page${isCover ? ' book-cover-page' : ''}`;
    if (zIndex !== null) {
        pageDiv.style.zIndex = String(zIndex);
    }

    if (isCover) {
        if (page && page.cover) {
            pageDiv.style.backgroundImage = `url('${page.cover}')`;
        } else if (page && page.name) {
            pageDiv.style.backgroundColor = '#8e8e93';
            pageDiv.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px; font-weight:bold; font-family:'Times New Roman'; padding:20px; text-align:center;">${page.name}</div>`;
        }
        pageDiv.onclick = () => nextIcityBookPage();
        return pageDiv;
    }

    const safeContent = sanitizeIcityBookHtml(page.content || '');
    if (safeContent !== (page.content || '')) {
        page.content = safeContent;
        window.__icityBookNeedsSave = true;
    }

    pageDiv.innerHTML = `
        <div class="book-page-content" contenteditable="true" oninput="updateBookPageContent(${pageIndex}, this)">${safeContent}</div>
        <div class="book-page-footer">- ${pageIndex + 1} -</div>
    `;

    const contentDiv = pageDiv.querySelector('.book-page-content');
    contentDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        contentDiv.focus();
    });

    pageDiv.onclick = () => nextIcityBookPage();
    return pageDiv;
}

function openIcityBook(id, startEl) {
    injectBookStyles();
    
    const book = window.iphoneSimState.icityBooks.find(b => b.id === id);
    if (!book) return;
    
    // Ensure pages exist
    if (!book.pages || !Array.isArray(book.pages) || book.pages.length === 0) {
        book.pages = [{ content: '' }]; // Start with one empty page
    }

    // Create Reader DOM
    let reader = document.getElementById('icity-book-reader');
    if (!reader) {
        reader = document.createElement('div');
        reader.id = 'icity-book-reader';
        reader.className = 'book-reader-screen';
        reader.innerHTML = `
            <div class="book-reader-header">
                <button class="back-btn" onclick="closeIcityBook()"><i class="fas fa-chevron-left"></i> 关闭</button>
                <div style="font-weight: bold;" id="book-reader-title"></div>
                <div style="display: flex; gap: 10px;">
                    <button class="icon-btn" onclick="toggleIcityFormatToolbar()"><i class="fas fa-highlighter"></i></button>
                    <button class="icon-btn" onclick="openIcityStickerPicker()"><i class="far fa-smile"></i></button>
                    <button class="icon-btn" id="book-reader-settings-btn"><i class="fas fa-cog"></i></button>
                    <button class="icon-btn" onclick="addIcityBookPage()"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div class="book-stage">
                <div class="book-3d" id="book-3d-container"></div>
            </div>
            <div class="book-controls">
                <button class="book-control-btn" onclick="prevIcityBookPage()"><i class="fas fa-arrow-left"></i></button>
                <button class="book-control-btn" onclick="nextIcityBookPage()"><i class="fas fa-arrow-right"></i></button>
            </div>
        `;
        document.body.appendChild(reader);
    }

    reader.dataset.prevBodyOverflow = document.body.style.overflow || '';
    reader.dataset.prevRootOverflow = document.documentElement.style.overflow || '';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    document.getElementById('book-reader-title').textContent = book.name;
    // Update settings button handler
    const settingsBtn = document.getElementById('book-reader-settings-btn');
    if (settingsBtn) {
        settingsBtn.onclick = () => openIcityBookSettings(book.id);
    }

    window.currentReadingBook = book;
    window.currentBookPage = 0; // 0 is cover? No, let's say 0 is cover, 1 is first page.
    
    renderBookPages(book);
    
    // Opening Animation
    if (startEl) {
        const rect = startEl.getBoundingClientRect();
        const clone = startEl.cloneNode(true);
        clone.classList.add('book-fly-anim');
        clone.style.top = rect.top + 'px';
        clone.style.left = rect.left + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.margin = '0';
        document.body.appendChild(clone);
        
        // Target position (center of screen, approx book size)
        // Book size defined in CSS is 80vw max 400px, aspect 3/4.
        // We need to calculate roughly where it ends up.
        // Simplified: just fade in reader and fade out clone.
        
        requestAnimationFrame(() => {
            reader.classList.add('visible');
            clone.style.top = '15%'; // Approx
            clone.style.left = '10%';
            clone.style.width = '80%';
            clone.style.height = 'auto'; 
            clone.style.opacity = '0';
            
            setTimeout(() => {
                clone.remove();
            }, 500);
        });
    } else {
        reader.classList.add('visible');
    }
}

function renderBookPages(book) {
    const container = document.getElementById('book-3d-container');
    const reader = document.getElementById('icity-book-reader');
    if (!container || !reader || !book) return;

    container.innerHTML = '';
    clampCurrentIcityBookPage(book);
    window.__icityBookNeedsSave = false;

    const useFlatRenderer = shouldUseFlatIcityBookRenderer(book);
    window.currentIcityBookUseFlatRenderer = useFlatRenderer;
    reader.classList.toggle('flat-mode', useFlatRenderer);

    const persistSanitizedPagesIfNeeded = () => {
        if (window.__icityBookNeedsSave) {
            saveConfig();
            window.__icityBookNeedsSave = false;
        }
    };

    if (useFlatRenderer) {
        if (window.currentBookPage === 0) {
            container.appendChild(createIcityBookPageElement(0, { name: book.name, cover: book.cover }, {
                isCover: true,
                zIndex: 1
            }));
            persistSanitizedPagesIfNeeded();
            return;
        }

        const currentPageIndex = window.currentBookPage - 1;
        const page = book.pages[currentPageIndex];
        if (!page) return;
        container.appendChild(createIcityBookPageElement(currentPageIndex, page, { zIndex: 1 }));
        persistSanitizedPagesIfNeeded();
        return;
    }

    container.appendChild(createIcityBookPageElement(0, { name: book.name, cover: book.cover }, {
        isCover: true,
        zIndex: 100
    }));
    
    book.pages.forEach((page, index) => {
        container.appendChild(createIcityBookPageElement(index, page, {
            zIndex: 99 - index
        }));
    });

    const pages = getIcityBookPageElements();
    const flippedCount = Math.min(window.currentBookPage, pages.length);
    for (let i = 0; i < flippedCount; i++) {
        pages[i].classList.add('flipped');
    }
    persistSanitizedPagesIfNeeded();
}

let bookSaveTimer = null;

function updateBookPageContent(index, el) {
    if (window.currentReadingBook) {
        window.currentReadingBook.pages[index].content = el.innerHTML;
        window.currentReadingBook.pages[index].lastModified = Date.now();
        
        // Debounce save to prevent browser crash on mobile
        if (bookSaveTimer) clearTimeout(bookSaveTimer);
        bookSaveTimer = setTimeout(() => {
            saveConfig();
            bookSaveTimer = null;
        }, 1000);
    }
}

function nextIcityBookPage() {
    if (!window.currentReadingBook) return;
    saveCurrentBookPage();
    const total = window.currentReadingBook.pages.length + 1; // +1 for cover
    if (window.currentBookPage < total - 1) {
        if (window.currentIcityBookUseFlatRenderer) {
            window.currentBookPage++;
            renderBookPages(window.currentReadingBook);
            return;
        }
        const pages = getIcityBookPageElements();
        if (pages[window.currentBookPage]) {
            pages[window.currentBookPage].classList.add('flipped');
        }
        window.currentBookPage++;
    }
}

function prevIcityBookPage() {
    if (!window.currentReadingBook) return;
    saveCurrentBookPage();
    if (window.currentBookPage > 0) {
        window.currentBookPage--;
        if (window.currentIcityBookUseFlatRenderer) {
            renderBookPages(window.currentReadingBook);
            return;
        }
        const pages = getIcityBookPageElements();
        if (pages[window.currentBookPage]) {
            pages[window.currentBookPage].classList.remove('flipped');
        }
    }
}

function addIcityBookPage() {
    if (window.currentReadingBook) {
        window.currentReadingBook.pages.push({ content: '' });
        saveConfig();
        window.currentBookPage = window.currentReadingBook.pages.length;
        renderBookPages(window.currentReadingBook);
    }
}

function closeIcityBook() {
    const book = window.currentReadingBook;
    
    // Check for linked contact + content
    if (book && book.linkedContactIds && book.linkedContactIds.length > 0) {
        const hasContent = book.pages.some(p => p.content && p.content.trim().length > 0);
        if (hasContent) {
            showIcityCloseOptions(book);
            return;
        }
    }
    
    // Default close
    forceCloseIcityBook();
}

function forceCloseIcityBook() {
    saveCurrentBookPage();
    // Flush pending save
    if (bookSaveTimer) {
        clearTimeout(bookSaveTimer);
        bookSaveTimer = null;
        saveConfig();
    }

    const reader = document.getElementById('icity-book-reader');
    if (reader) {
        reader.classList.remove('visible');
        window.currentReadingBook = null;
        window.currentIcityBookUseFlatRenderer = false;
        document.body.style.overflow = reader.dataset.prevBodyOverflow || '';
        document.documentElement.style.overflow = reader.dataset.prevRootOverflow || '';
    }
}

function showIcityCloseOptions(book) {
    const overlay = document.createElement('div');
    overlay.id = 'icity-close-options-sheet';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.4); z-index: 3000;
        display: flex; flex-direction: column; justify-content: flex-end;
    `;
    
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
        }
    };

    const sheet = document.createElement('div');
    sheet.style.cssText = `
        background: #f2f2f7; border-radius: 12px 12px 0 0; padding: 20px; padding-bottom: max(20px, env(safe-area-inset-bottom));
        animation: slideUp 0.3s ease;
    `;
    
    const title = document.createElement('div');
    title.textContent = '关闭后，你希望TA做什么？';
    title.style.cssText = 'text-align: center; color: #8e8e93; font-size: 13px; margin-bottom: 15px;';
    sheet.appendChild(title);

    const group = document.createElement('div');
    group.style.cssText = 'background: #fff; border-radius: 12px; overflow: hidden; margin-bottom: 10px;';

    const options = [
        { text: '只进行批注', action: () => { forceCloseIcityBook(); triggerBookAnnotation(book, 'annotate_only'); } },
        { text: '只写新内容', action: () => { forceCloseIcityBook(); triggerBookAnnotation(book, 'write_only'); } },
        { text: '批注并写新内容', action: () => { forceCloseIcityBook(); triggerBookAnnotation(book, 'both'); } },
    ];

    options.forEach((opt, index) => {
        const btn = document.createElement('div');
        btn.textContent = opt.text;
        btn.style.cssText = `
            padding: 15px; text-align: center; font-size: 16px; color: #007AFF;
            background: #fff; cursor: pointer;
            ${index < options.length - 1 ? 'border-bottom: 1px solid #eee;' : ''}
        `;
        btn.onclick = () => {
            overlay.remove();
            opt.action();
        };
        group.appendChild(btn);
    });

    const closeBtn = document.createElement('div');
    closeBtn.textContent = '什么都不写直接关闭';
    closeBtn.style.cssText = `
        padding: 15px; text-align: center; font-size: 16px; color: #FF3B30;
        background: #fff; border-radius: 12px; cursor: pointer; font-weight: bold; margin-bottom: 10px;
    `;
    closeBtn.onclick = () => {
        overlay.remove();
        forceCloseIcityBook();
    };
    
    const cancelBtn = document.createElement('div');
    cancelBtn.textContent = '取消 (保持打开)';
    cancelBtn.style.cssText = `
        padding: 15px; text-align: center; font-size: 16px; color: #007AFF;
        background: #fff; border-radius: 12px; cursor: pointer; font-weight: bold;
    `;
    cancelBtn.onclick = () => overlay.remove();

    sheet.appendChild(group);
    sheet.appendChild(closeBtn);
    sheet.appendChild(cancelBtn);
    overlay.appendChild(sheet);
    document.body.appendChild(overlay);
}

async function triggerBookAnnotation(book, mode = 'both') {
    // Find the contact
    const contactId = book.linkedContactIds[0];
    const contact = window.iphoneSimState.contacts.find(c => c.id === contactId);
    if (!contact) return;

    // Show a subtle notification
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 50px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 10px 20px; border-radius: 20px; z-index: 3000; font-size: 14px; transition: opacity 0.5s;';
    notification.innerHTML = `<i class="fas fa-magic fa-spin"></i> ${contact.name} 正在思考...`;
    document.body.appendChild(notification);

    try {
        await generateBookAnnotations(book, contact, mode);
        notification.innerHTML = `<i class="fas fa-check"></i> ${contact.name} 完成了`;
        setTimeout(() => notification.remove(), 3000);
    } catch (e) {
        console.error(e);
        notification.innerHTML = `<i class="fas fa-times"></i> 操作失败`;
        setTimeout(() => notification.remove(), 3000);
    }
}

function protectAnnotations(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    const placeholders = [];
    
    // Select selectors for elements to protect:
    // ruby (Comment)
    // s with class strikethrough-hand (Strike)
    // span with class highlight-marker (Highlight)
    // span with class handwritten-text (Handwritten)
    // span with class starting with pen- (Colored text)
    
    const selector = 'ruby, span.icity-ruby-note, s.strikethrough-hand, span.highlight-marker, span.handwritten-text, span[class*="pen-"], img.icity-sticker';
    const nodes = div.querySelectorAll(selector);
    
    nodes.forEach((node, index) => {
        // Check if node is still part of the tree (it might have been removed if a parent was replaced)
        if (!div.contains(node)) return;
        
        const id = `[[LOCKED_ANNOTATION_${index}]]`;
        placeholders.push({ id, content: node.outerHTML });
        
        const textNode = document.createTextNode(id);
        node.replaceWith(textNode);
    });
    
    return { protectedHtml: div.innerHTML, placeholders };
}

function restoreAnnotations(html, placeholders) {
    let restored = html;
    // Iterate and replace back
    placeholders.forEach(p => {
        // Use split/join to replace all occurrences
        restored = restored.split(p.id).join(p.content);
    });
    return restored;
}

async function generateBookAnnotations(book, contact, mode = 'both') {
    let changed = false;
    let newPageContent = null;

    // 1. 批注现有页面
    if (mode === 'annotate_only' || mode === 'both') {
        for (let i = 0; i < book.pages.length; i++) {
            const page = book.pages[i];
            
            // 标记为 AI 创建的页面，跳过
            if (page.author === 'ai') continue;

            // 如果已经批注过且用户没有修改，则跳过（避免重复批注）
            if (page.lastAnnotated && page.lastAnnotated > (page.lastModified || 0)) continue;

            let content = page.content;
            
            // Skip empty pages
            if (!content || content.trim().length === 0) continue;
            
            // Protect existing annotations (including stickers)
            const { protectedHtml, placeholders } = protectAnnotations(content);
            
            // Prepare context
            const history = window.iphoneSimState.chatHistory && window.iphoneSimState.chatHistory[contact.id] ? window.iphoneSimState.chatHistory[contact.id].slice(-10) : [];
            const chatContext = history.map(m => `${m.role === 'user' ? '用户' : '我'}: ${m.content}`).join('\n');
            
            // Prepare Stickers
            let availableStickers = [];
            let stickerContext = '';
            if (window.iphoneSimState.stickerCategories) {
                window.iphoneSimState.stickerCategories.forEach(cat => {
                    // If linkedStickerCategories is undefined/null, allow all. If array, filter by ID.
                    if (!contact.linkedStickerCategories || (Array.isArray(contact.linkedStickerCategories) && contact.linkedStickerCategories.includes(cat.id))) {
                        availableStickers = availableStickers.concat(cat.list);
                    }
                });
            }
            
            if (availableStickers.length > 0) {
                const names = availableStickers.map(s => s.desc).join(', ');
                stickerContext = `\n【可用贴纸】\n你可以插入贴纸来表达心情。请使用格式 [[STICKER:贴纸名称]]。\n可用列表：${names}\n\n⚠️ **严格警告**：你只能使用上述列表中的贴纸名称。绝对不要编造不存在的贴纸名称。如果找不到合适的，就不要插入贴纸。\n`;
            } else {
                stickerContext = `\n【可用贴纸】\n当前没有可用的贴纸，请不要使用 [[STICKER:...]] 格式。\n`;
            }
            
            // Contact Name in iCity
            const contactName = (contact.icityData && contact.icityData.name) ? contact.icityData.name : contact.name;

            const prompt = `你现在扮演 ${contactName}。
人设: ${contact.persona || '无'}
最近聊天:
${chatContext}

用户在你们共同的手账本上写了以下内容（HTML格式）：
${protectedHtml}

【任务】
请阅读用户的内容，并以你的角色身份进行“批注”和“互动”。
这是一个增量批注的过程。

【严格限制 - 保护已有批注】
1. 内容中出现的 **[[LOCKED_ANNOTATION_数字]]** 标记代表之前已经生成的批注。
2. **绝对禁止**修改、删除、拆分或移动这些标记。
3. **绝对禁止**在这些标记内部或针对这些标记的内容进行再次批注。
4. 你只能对**没有被标记覆盖的纯文本**进行新的批注。
5. **严禁**输出 "BAKA"、"baka" 等词汇。

【批注样式与颜色】
请**随机**使用以下颜色类名，不要总是用同一种颜色，让页面看起来丰富多彩：
- 笔迹颜色类名 (用于评论/补充): "pen-blue", "pen-red", "pen-purple", "pen-pink", "pen-teal", "pen-black"
- 高亮颜色类名 (用于划重点): "highlight-yellow", "highlight-green", "highlight-pink", "highlight-blue", "highlight-purple"
${stickerContext}

【批注规则 - 请严格遵守HTML格式】
请返回一段HTML代码，包含用户的原文（含LOCKED标记）和你新添加的批注。
1. **吐槽/评论 (使用 Ruby)**：
   <ruby>用户文字<rt class="handwritten pen-red">你的评论</rt></ruby> (请随机替换 pen-red 为其他笔迹颜色)
2. **划重点 (高亮)**：
   <span class="highlight-marker highlight-yellow">重点文字</span> (请随机替换 highlight-yellow 为其他高亮颜色)
3. **划掉 (删除线)**：
   <s class="strikethrough-hand">想划掉的文字</s>
4. **手写补充**：
   <span class="handwritten-text pen-blue">你的补充文字</span> (请随机替换 pen-blue 为其他笔迹颜色)
5. **改变文字颜色**：
   <span class="pen-purple">变色文字</span> (请随机替换颜色类名)
6. **插入贴纸**：
   在合适的位置插入 [[STICKER:名称]]。

【返回要求】
1. 直接返回完整的HTML字符串。
2. 不要包含 \`\`\`html \`\`\` 标记。
3. 再次强调：**保留 [[LOCKED_ANNOTATION_...]] 标记不动**。`;

            const messages = [{ role: 'user', content: prompt }];
            const annotatedContent = await safeCallAiApi(messages);
            
            if (annotatedContent && annotatedContent.length > 0) {
                // Basic cleanup
                let cleanContent = annotatedContent.replace(/```html/g, '').replace(/```/g, '').trim();
                
                // Process Stickers (Always run to clean up even if availableStickers is empty but AI hallucinated)
                cleanContent = cleanContent.replace(/\[\[STICKER:(.*?)\]\]/g, (match, name) => {
                    if (availableStickers.length > 0) {
                        const sticker = availableStickers.find(s => s.desc === name.trim());
                        if (sticker) {
                            return `<img src="${sticker.url}" class="icity-sticker" style="max-width: 30%; float: right; margin: 5px 0 5px 10px;">`;
                        }
                    }
                    return ''; // Remove if invalid or none available
                });
                
                // Restore annotations
                cleanContent = restoreAnnotations(cleanContent, placeholders);
                
                // Append a reset span to ensure subsequent typing is default style
                cleanContent += '&nbsp;<span class="reset-style">&#8203;</span>';
                cleanContent = sanitizeIcityBookHtml(cleanContent);
                
                page.content = cleanContent;
                page.lastAnnotated = Date.now();
                changed = true;

                // Inject into chat history
                if (!window.iphoneSimState.chatHistory) window.iphoneSimState.chatHistory = {};
                if (!window.iphoneSimState.chatHistory[contact.id]) window.iphoneSimState.chatHistory[contact.id] = [];
                
                window.iphoneSimState.chatHistory[contact.id].push({
                    id: Date.now() + Math.random(),
                    role: 'system',
                    type: 'system_event',
                    content: `(你批注了用户的手账页面: "${cleanContent.replace(/<[^>]+>/g, '').substring(0, 50)}...")`,
                    time: Date.now()
                });
            }
        }
    }

    // 2. AI 生成新页面内容
    if (mode === 'write_only' || mode === 'both') {
        const lastPage = book.pages[book.pages.length - 1];
        
        // 决定是否写新内容：
        // 1. 如果是 write_only 模式，强制写（用户主动请求）
        // 2. 如果是 both 模式，需满足轮流规则（最后一页是用户写的且不为空）
        let shouldWrite = false;
        if (mode === 'write_only') {
            shouldWrite = true;
        } else {
            if (lastPage && lastPage.author !== 'ai' && lastPage.content && lastPage.content.trim().length > 0) {
                shouldWrite = true;
            }
        }

        if (shouldWrite) {
            
            const contactName = (contact.icityData && contact.icityData.name) ? contact.icityData.name : contact.name;
            
            // Prepare Stickers for new page
            let availableStickers = [];
            let stickerContext = '';
            if (window.iphoneSimState.stickerCategories) {
                window.iphoneSimState.stickerCategories.forEach(cat => {
                    if (!contact.linkedStickerCategories || (Array.isArray(contact.linkedStickerCategories) && contact.linkedStickerCategories.includes(cat.id))) {
                        availableStickers = availableStickers.concat(cat.list);
                    }
                });
            }
            if (availableStickers.length > 0) {
                const names = availableStickers.map(s => s.desc).join(', ');
                stickerContext = `\n【可用贴纸】\n你可以插入贴纸来表达心情。请使用格式 [[STICKER:贴纸名称]]。\n可用列表：${names}\n\n⚠️ **严格警告**：你只能使用上述列表中的贴纸名称。绝对不要编造不存在的贴纸名称。如果找不到合适的，就不要插入贴纸。\n`;
            } else {
                stickerContext = `\n【可用贴纸】\n当前没有可用的贴纸，请不要使用 [[STICKER:...]] 格式。\n`;
            }

            const prompt = `你现在扮演 ${contactName}。
人设: ${contact.persona || '无'}

【任务】
作为手账本的共创者，请在用户写完一页后，另起一页写下你的回应、感悟或日记。
内容要是自然的、生活化的，符合你的人设。

【要求】
1. **纯文本**：只写文字内容，不需要HTML标签。
2. **黑色字体**：使用默认黑色字体（不需要任何颜色类名）。
3. **表情包**：可以在合适的地方插入表情包，格式：[[STICKER:名称]]。
4. **禁语**：**严禁**输出 "BAKA"、"baka" 等词汇。
5. **长度**：适中，写满一页手账的感觉（约50-150字）。
${stickerContext}

请直接返回内容文本。`;

            const messages = [{ role: 'user', content: prompt }];
            const newPageText = await safeCallAiApi(messages);

            if (newPageText && newPageText.length > 0) {
                let processedContent = newPageText.replace(/```html/g, '').replace(/```/g, '').trim();
                
                // Process Stickers (Always run cleanup)
                processedContent = processedContent.replace(/\[\[STICKER:(.*?)\]\]/g, (match, name) => {
                    if (availableStickers.length > 0) {
                        const sticker = availableStickers.find(s => s.desc === name.trim());
                        if (sticker) {
                            return `<img src="${sticker.url}" class="icity-sticker" style="max-width: 30%; float: right; margin: 5px 0 5px 10px;">`;
                        }
                    }
                    return ''; // Remove if invalid
                });
                
                // Convert newlines to <br> for HTML display
                processedContent = processedContent.replace(/\n/g, '<br>');
                processedContent = sanitizeIcityBookHtml(processedContent);
                
                newPageContent = processedContent;
            }
        }
    }

    if (newPageContent) {
        book.pages.push({
            content: newPageContent,
            author: 'ai' // Mark as AI page
        });
        changed = true;
    }

    if (changed) {
        saveConfig();
        // If the book is currently open, refresh the view
        if (window.currentReadingBook && window.currentReadingBook.id === book.id) {
            renderBookPages(book);
        }
    }
}

function openIcityStickerPicker() {
    let modal = document.getElementById('icity-sticker-picker-modal');
    if (modal) {
        modal.classList.remove('hidden');
        return;
    }

    modal = document.createElement('div');
    modal.id = 'icity-sticker-picker-modal';
    modal.className = 'modal';
    modal.style.cssText = 'display: flex; opacity: 1; pointer-events: auto; z-index: 2200;'; 
    
    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.height = '60%';
    
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
        <h3>选择贴纸</h3>
        <button class="close-btn" onclick="document.getElementById('icity-sticker-picker-modal').classList.add('hidden')"><i class="fas fa-times"></i></button>
    `;
    content.appendChild(header);
    
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.padding = '0';
    
    const tabs = document.createElement('div');
    tabs.style.cssText = 'display: flex; overflow-x: auto; border-bottom: 1px solid #eee; padding: 10px; gap: 10px; flex-shrink: 0;';
    
    const stickerGrid = document.createElement('div');
    stickerGrid.style.cssText = 'flex: 1; overflow-y: auto; padding: 10px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; align-content: start;';
    
    const categories = window.iphoneSimState.stickerCategories || [];
    
    if (categories.length === 0) {
        stickerGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #999; margin-top: 20px;">暂无表情包，请先在聊天设置中导入</div>';
    } else {
        categories.forEach((cat, index) => {
            const tab = document.createElement('div');
            tab.textContent = cat.name;
            tab.style.cssText = `padding: 5px 12px; background: #f0f0f0; border-radius: 15px; font-size: 12px; cursor: pointer; white-space: nowrap; ${index === 0 ? 'background: #007AFF; color: #fff;' : ''}`;
            
            tab.onclick = () => {
                Array.from(tabs.children).forEach(t => {
                    t.style.background = '#f0f0f0';
                    t.style.color = '#333';
                });
                tab.style.background = '#007AFF';
                tab.style.color = '#fff';
                renderStickers(cat.list);
            };
            
            tabs.appendChild(tab);
        });
        
        renderStickers(categories[0].list);
    }
    
    function renderStickers(list) {
        stickerGrid.innerHTML = '';
        list.forEach(s => {
            const img = document.createElement('img');
            img.src = s.url;
            img.style.cssText = 'width: 100%; aspect-ratio: 1/1; object-fit: contain; cursor: pointer; border-radius: 4px; padding: 2px; border: 1px solid transparent; transition: all 0.2s;';
            img.onclick = () => {
                insertIcitySticker(s.url);
                modal.classList.add('hidden');
            };
            img.onmouseover = () => img.style.background = '#f0f0f0';
            img.onmouseout = () => img.style.background = 'transparent';
            stickerGrid.appendChild(img);
        });
    }
    
    body.appendChild(tabs);
    body.appendChild(stickerGrid);
    content.appendChild(body);
    modal.appendChild(content);
    document.body.appendChild(modal);
}

function insertIcitySticker(url) {
    if (!window.currentReadingBook) return;
    
    const pageIndex = window.currentBookPage || 0;
    
    if (pageIndex === 0) {
        alert('封面无法添加贴纸，请翻开书本');
        return;
    }
    
    const contentPageIndex = pageIndex - 1;
    if (contentPageIndex < 0 || contentPageIndex >= window.currentReadingBook.pages.length) return;
    
    const page = window.currentReadingBook.pages[contentPageIndex];
    const contentDiv = getCurrentIcityBookContentElement();
    if (contentDiv) {
        const imgHtml = `<img src="${url}" class="icity-sticker">`;
        contentDiv.insertAdjacentHTML('beforeend', imgHtml);
        page.content = sanitizeIcityBookHtml(contentDiv.innerHTML);
        contentDiv.innerHTML = page.content;
        saveConfig();
    }
}

window.openIcityStickerPicker = openIcityStickerPicker;
window.insertIcitySticker = insertIcitySticker;

function toggleIcityFormatToolbar() {
    let toolbar = document.getElementById('icity-format-toolbar');
    if (toolbar) {
        toolbar.classList.toggle('hidden');
        if (!toolbar.classList.contains('hidden')) {
            setTimeout(() => document.addEventListener('click', closeFormatToolbarOutside), 0);
        } else {
            document.removeEventListener('click', closeFormatToolbarOutside);
        }
        return;
    }
    
    toolbar = document.createElement('div');
    toolbar.id = 'icity-format-toolbar';
    toolbar.style.cssText = `
        position: absolute; top: 100px; right: 60px; 
        background: #fff; padding: 10px; border-radius: 8px; 
        box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 2100;
        display: flex; flex-direction: column; gap: 8px; width: 200px;
    `;
    
    // Row 1: Basic
    const row1 = document.createElement('div');
    row1.style.cssText = 'display: flex; gap: 10px; justify-content: space-around;';
    
    const createBtn = (icon, cmd, arg) => {
        const btn = document.createElement('div');
        btn.innerHTML = icon;
        btn.style.cssText = 'width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 4px; background: #f0f0f0;';
        btn.onmousedown = (e) => {
            e.preventDefault(); 
            if (cmd === 'custom-strike') {
                applyCustomFormat('strike');
            } else {
                document.execCommand(cmd, false, arg);
            }
        };
        return btn;
    };
    
    row1.appendChild(createBtn('<i class="fas fa-bold"></i>', 'bold'));
    row1.appendChild(createBtn('<i class="fas fa-italic"></i>', 'italic'));
    row1.appendChild(createBtn('<i class="fas fa-strikethrough"></i>', 'custom-strike')); 
    
    // Row 2: Text Color
    const row2 = document.createElement('div');
    row2.style.cssText = 'display: flex; gap: 5px; flex-wrap: wrap; border-top: 1px solid #eee; padding-top: 5px;';
    const textColors = ['#000000', '#FF3B30', '#007AFF', '#5856D6', '#4CD964'];
    textColors.forEach(c => {
        const dot = document.createElement('div');
        dot.style.cssText = `width: 20px; height: 20px; border-radius: 50%; background: ${c}; cursor: pointer; border: 1px solid #ddd;`;
        dot.onmousedown = (e) => {
            e.preventDefault();
            document.execCommand('foreColor', false, c);
        };
        row2.appendChild(dot);
    });
    
    // Row 3: Highlight
    const row3 = document.createElement('div');
    row3.style.cssText = 'display: flex; gap: 5px; flex-wrap: wrap; border-top: 1px solid #eee; padding-top: 5px;';
    
    const highlights = [
        { color: '#FFEB3B', class: 'highlight-yellow' }, 
        { color: '#4CD964', class: 'highlight-green' },  
        { color: '#FF2D55', class: 'highlight-pink' },   
        { color: '#007AFF', class: 'highlight-blue' },   
        { color: '#5856D6', class: 'highlight-purple' }  
    ];
    
    highlights.forEach(h => {
        const dot = document.createElement('div');
        dot.style.cssText = `width: 20px; height: 20px; border-radius: 4px; background: ${h.color}; cursor: pointer; opacity: 0.6;`;
        dot.onmousedown = (e) => {
            e.preventDefault();
            applyCustomFormat('highlight', h.class);
        };
        row3.appendChild(dot);
    });
    
    toolbar.appendChild(row1);
    toolbar.appendChild(row2);
    toolbar.appendChild(row3);
    
    const reader = document.getElementById('icity-book-reader');
    if (reader) reader.appendChild(toolbar);
    
    setTimeout(() => document.addEventListener('click', closeFormatToolbarOutside), 0);
}

function closeFormatToolbarOutside(e) {
    const toolbar = document.getElementById('icity-format-toolbar');
    if (toolbar && !toolbar.classList.contains('hidden') && !toolbar.contains(e.target)) {
        toolbar.classList.add('hidden');
        document.removeEventListener('click', closeFormatToolbarOutside);
    }
}

function applyCustomFormat(type, className) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return; 
    
    let wrapper;
    if (type === 'strike') {
        wrapper = document.createElement('s');
        wrapper.className = 'strikethrough-hand';
    } else if (type === 'highlight') {
        wrapper = document.createElement('span');
        wrapper.className = `highlight-marker ${className}`;
    }
    
    if (wrapper) {
        try {
            range.surroundContents(wrapper);
            saveCurrentBookPage(); 
        } catch(e) {
            console.error(e);
            alert('无法应用样式：请确保选择的文本在同一段落内');
        }
    }
}

function saveCurrentBookPage() {
    const pageIndex = window.currentBookPage || 0;
    if (pageIndex === 0) return;
    const contentIndex = pageIndex - 1;

    const contentDiv = getCurrentIcityBookContentElement();
    if (contentDiv && window.currentReadingBook && window.currentReadingBook.pages[contentIndex]) {
        const safeContent = sanitizeIcityBookHtml(contentDiv.innerHTML);
        if (safeContent !== contentDiv.innerHTML) {
            contentDiv.innerHTML = safeContent;
        }
        window.currentReadingBook.pages[contentIndex].content = safeContent;
        window.currentReadingBook.pages[contentIndex].lastModified = Date.now();
        saveConfig();
    }
}

window.toggleIcityFormatToolbar = toggleIcityFormatToolbar;

function openIcityBookSettings(bookId) {
    const book = window.iphoneSimState.icityBooks.find(b => b.id === bookId);
    if (!book) return;

    // Remove existing modal if any
    const existing = document.getElementById('icity-book-settings-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'icity-book-settings-modal';
    overlay.className = 'modal';
    overlay.classList.remove('hidden'); // Show immediately
    // Increase z-index to be above the book reader (which is 2000)
    overlay.style.cssText = 'display: flex; opacity: 1; pointer-events: auto; z-index: 2100;'; 

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.style.height = '60%'; // Set height

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
        <h3>书籍设置</h3>
        <button class="close-btn" onclick="document.getElementById('icity-book-settings-modal').remove()"><i class="fas fa-times"></i></button>
    `;

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.gap = '15px';

    const title = document.createElement('div');
    title.textContent = '关联联系人';
    title.style.cssText = 'font-size: 14px; color: #8e8e93; text-transform: uppercase; margin-bottom: 5px;';
    body.appendChild(title);

    const list = document.createElement('div');
    // Removed background color as requested
    list.style.cssText = 'flex: 1; overflow-y: auto; border-radius: 10px; padding: 10px;';

    const contacts = window.iphoneSimState.contacts || [];
    if (contacts.length === 0) {
        list.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">暂无联系人</div>';
    } else {
        // Only one linked ID allowed now
        const linkedId = (book.linkedContactIds && book.linkedContactIds.length > 0) ? book.linkedContactIds[0] : null;
        
        contacts.forEach(c => {
            const item = document.createElement('div');
            // Simplified item style without white background card look, or maybe just cleaner list
            // Keeping white background for item itself is good for readability, but user asked to remove "grey background behind choice place"
            // The grey background was on the list container.
            item.style.cssText = 'display: flex; align-items: center; padding: 10px; border-bottom: 1px solid #e5e5ea; background: #fff; border-radius: 8px; margin-bottom: 8px; cursor: pointer;';
            
            const radio = document.createElement('input');
            radio.type = 'radio'; // Changed to radio for single selection
            radio.name = 'icity-book-contact-select'; // Name group for radio behavior
            radio.value = c.id;
            radio.checked = (linkedId === c.id);
            radio.style.cssText = 'margin-right: 15px; transform: scale(1.2);';
            
            const avatar = document.createElement('div');
            avatar.style.cssText = `width: 40px; height: 40px; border-radius: 50%; background: #ccc; margin-right: 10px; background-image: url('${c.avatar || ''}'); background-size: cover; background-position: center;`;
            
            const name = document.createElement('div');
            name.textContent = c.name;
            name.style.fontWeight = 'bold';

            item.appendChild(radio);
            item.appendChild(avatar);
            item.appendChild(name);
            
            item.onclick = (e) => {
                // If clicking item (not radio), select radio
                if (e.target !== radio) {
                    radio.checked = true;
                }
            };

            list.appendChild(item);
        });
    }
    body.appendChild(list);

    // Save Button
    const saveBtn = document.createElement('button');
    saveBtn.className = 'ios-btn-block';
    saveBtn.textContent = '保存';
    saveBtn.onclick = () => saveIcityBookSettings(bookId);
    body.appendChild(saveBtn);

    content.appendChild(header);
    content.appendChild(body);
    overlay.appendChild(content);
    document.body.appendChild(overlay);
}

function saveIcityBookSettings(bookId) {
    const modal = document.getElementById('icity-book-settings-modal');
    if (!modal) return;

    const book = window.iphoneSimState.icityBooks.find(b => b.id === bookId);
    if (!book) return;

    // Use radio selector
    const radio = modal.querySelector('input[name="icity-book-contact-select"]:checked');
    const selectedIds = radio ? [Number(radio.value)] : [];

    book.linkedContactIds = selectedIds;
    saveConfig();
    
    modal.remove();
    alert('设置已保存');
}

window.openIcityBook = openIcityBook;
window.closeIcityBook = closeIcityBook;
window.openIcityBookSettings = openIcityBookSettings;
window.saveIcityBookSettings = saveIcityBookSettings;
window.addIcityBookPage = addIcityBookPage;
window.nextIcityBookPage = nextIcityBookPage;
window.prevIcityBookPage = prevIcityBookPage;
window.updateBookPageContent = updateBookPageContent;

async function handleIcityCommentSend() {
    const input = document.getElementById('icity-comment-input');
    let content = input.value.trim();
    if (!content) return;
    
    // Find the post
    let post = null;
    
    if (window.currentOpenIcitySource === 'diary') {
        post = window.iphoneSimState.icityDiaries.find(d => d.id === window.currentOpenIcityDiaryId);
    } else if (window.currentOpenIcitySource === 'world') {
        post = window.iphoneSimState.icityWorldPosts.find(p => p.id === window.currentOpenIcityDiaryId);
    } else if (window.currentOpenIcitySource === 'friends') {
        post = window.iphoneSimState.icityFriendsPosts.find(p => p.id === window.currentOpenIcityDiaryId);
    }
    
    if (!post) return;
    
    // Check if replying to someone
    if (window.icityReplyingTo) {
        content = `回复 ${window.icityReplyingTo.name}：${content}`;
        // Clear reply state
        window.icityReplyingTo = null;
        input.placeholder = '我要评论';
    }
    
    // Add user comment
    if (!post.commentsList) post.commentsList = [];
    
    const userComment = {
        id: Date.now(),
        name: window.iphoneSimState.icityProfile.nickname || 'Kaneki',
        content: content,
        time: Date.now()
    };
    
    post.commentsList.push(userComment);
    post.comments = (post.comments || 0) + 1;
    
    input.value = '';
    saveConfig();
    
    // Refresh view
    openIcityDiaryDetail(window.currentOpenIcityDiaryId, window.currentOpenIcitySource);
    
    // Generate AI Reply
    // If user commented on someone else's post, trigger reply
    if (window.currentOpenIcitySource !== 'diary') {
        await generateIcityCommentReply(post, content);
    }
}

async function generateIcityCommentReply(post, userContent) {
    // Determine persona
    let persona = "一个路人网友";
    let name = post.name;
    
    if (window.currentOpenIcitySource === 'friends') {
        // Find contact
        let contact = null;
        if (post.contactId) {
            contact = window.iphoneSimState.contacts.find(c => c.id === post.contactId);
        } else {
            contact = window.iphoneSimState.contacts.find(c => c.name === post.name);
        }
        
        if (contact) {
            persona = contact.persona || "你的朋友";
        }
    } else {
        // World post - fake persona
        persona = "网络用户，性格随机";
    }
    
    const prompt = `你扮演 ${name} (人设: ${persona})。
你在社交平台发布了动态："${post.content}"
用户评论说："${userContent}"

请回复用户的评论。
要求：
1. 简短、口语化。
2. 符合人设。
3. **严禁**输出 "BAKA"、"baka" 等词汇。
4. 只返回回复内容，不要包含其他文字。`;

    try {
        const messages = [{ role: 'user', content: prompt }];
        const reply = await safeCallAiApi(messages);
        
        if (reply) {
            const aiComment = {
                id: Date.now() + 1,
                name: name, // Author replies
                content: `回复我：${reply}`, // Prefix as requested
                time: Date.now()
            };
            
            post.commentsList.push(aiComment);
            post.comments = (post.comments || 0) + 1;
            saveConfig();
            
            // Refresh if still on same page
            if (window.currentOpenIcityDiaryId === post.id) {
                openIcityDiaryDetail(post.id, window.currentOpenIcitySource);
            }

            // Inject into chat history
            // We need contact ID.
            let contact = null;
            if (post.contactId) {
                contact = window.iphoneSimState.contacts.find(c => c.id === post.contactId);
            } else {
                contact = window.iphoneSimState.contacts.find(c => c.name === post.name);
            }

            if (contact) {
                if (!window.iphoneSimState.chatHistory) window.iphoneSimState.chatHistory = {};
                if (!window.iphoneSimState.chatHistory[contact.id]) window.iphoneSimState.chatHistory[contact.id] = [];
                
                window.iphoneSimState.chatHistory[contact.id].push({
                    id: Date.now() + Math.random(),
                    role: 'system',
                    type: 'system_event',
                    content: `(你在iCity回复了用户的评论: "${reply}")`,
                    time: Date.now()
                });
            }
        }
    } catch (e) {
        console.error("Failed to generate comment reply", e);
    }
}

// Forwarding Logic
window.currentForwardDiaryId = null;
window.currentForwardSource = 'diary';

function handleIcityForward(diaryId, source = 'diary') {
    // Hide menus first
    document.querySelectorAll('[id^="icity-menu-"]').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('[id^="icity-feed-menu-"]').forEach(el => el.classList.add('hidden'));
    
    window.currentForwardDiaryId = diaryId;
    window.currentForwardSource = source;
    openContactPicker();
}

function openContactPicker() {
    const modal = document.getElementById('contact-picker-modal');
    if (!modal) return;
    
    renderContactPickerList();
    modal.classList.remove('hidden');
    
    const closeBtn = document.getElementById('close-contact-picker');
    if (closeBtn) closeBtn.onclick = () => modal.classList.add('hidden');
    
    const sendBtn = document.getElementById('contact-picker-send-btn');
    if (sendBtn) sendBtn.onclick = handleContactPickerSend;
}

function renderContactPickerList() {
    const list = document.getElementById('contact-picker-list');
    if (!list) return;
    
    list.innerHTML = '';
    const contacts = window.iphoneSimState.contacts || [];
    
    if (contacts.length === 0) {
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">暂无联系人</div>';
        return;
    }
    
    contacts.forEach(c => {
        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.alignItems = 'center';
        item.style.padding = '10px 15px';
        item.style.borderBottom = '1px solid #f0f0f0';
        item.style.cursor = 'pointer';
        
        item.innerHTML = `
            <input type="checkbox" class="contact-picker-checkbox" value="${c.id}" style="margin-right: 15px; transform: scale(1.2);">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: #ccc; margin-right: 10px; background-image: url('${c.avatar}'); background-size: cover; background-position: center;"></div>
            <div style="font-weight: bold; color: #333;">${c.remark || c.name}</div>
        `;
        
        // Toggle checkbox on row click
        item.onclick = (e) => {
            if (e.target.type !== 'checkbox') {
                const cb = item.querySelector('input[type="checkbox"]');
                cb.checked = !cb.checked;
            }
        };
        
        list.appendChild(item);
    });
}

function handleContactPickerSend() {
    const checkboxes = document.querySelectorAll('.contact-picker-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => Number(cb.value));
    
    if (selectedIds.length === 0) {
        alert('请选择联系人');
        return;
    }
    
    if (!window.currentForwardDiaryId) return;
    
    let post = null;
    let authorName = '';
    let authorAvatar = '';

    if (window.currentForwardSource === 'diary') {
        post = window.iphoneSimState.icityDiaries.find(d => d.id === window.currentForwardDiaryId);
        authorName = window.iphoneSimState.icityProfile.nickname || 'Kaneki';
        authorAvatar = window.iphoneSimState.icityProfile.avatar || '';
    } else if (window.currentForwardSource === 'world') {
        post = window.iphoneSimState.icityWorldPosts.find(p => p.id === window.currentForwardDiaryId);
        if (post) {
            authorName = post.name;
            authorAvatar = post.avatar;
        }
    } else if (window.currentForwardSource === 'friends') {
        post = window.iphoneSimState.icityFriendsPosts.find(p => p.id === window.currentForwardDiaryId);
        if (post) {
            authorName = post.name;
            authorAvatar = post.avatar;
            // Try to resolve contact info if available
            if (post.contactId) {
                const contact = window.iphoneSimState.contacts.find(c => c.id === post.contactId);
                if (contact) {
                    if (contact.icityData && contact.icityData.name) authorName = contact.icityData.name;
                    if (contact.icityData && contact.icityData.avatar) authorAvatar = contact.icityData.avatar;
                    else if (!authorAvatar) authorAvatar = contact.avatar;
                }
            }
        }
    }

    if (!post) return;
    
    const cardData = {
        diaryId: post.id,
        content: post.content,
        authorName: authorName,
        authorAvatar: authorAvatar,
        time: post.time,
        source: window.currentForwardSource, // Add source to help identify author context
        comments: post.commentsList || []
    };
    
    selectedIds.forEach(contactId => {
        if (!window.iphoneSimState.chatHistory[contactId]) {
            window.iphoneSimState.chatHistory[contactId] = [];
        }
        
        window.iphoneSimState.chatHistory[contactId].push({
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            role: 'user', // Sent by me
            type: 'icity_card',
            content: JSON.stringify(cardData),
            time: Date.now()
        });
    });
    
    saveConfig();
    
    document.getElementById('contact-picker-modal').classList.add('hidden');
    alert('已转发');
    
    // Refresh chat if open
    if (window.iphoneSimState.currentChatContactId && selectedIds.includes(window.iphoneSimState.currentChatContactId)) {
        if (window.renderChatHistory) window.renderChatHistory(window.iphoneSimState.currentChatContactId);
    }
}

// Export functions
window.handleIcityForward = handleIcityForward;

// Calendar Functions
function renderIcityCalendar(year = 2026) {
    const calendarScreen = document.getElementById('icity-calendar-screen');
    if (!calendarScreen) return;

    // Update Year Selector
    const yearsContainer = document.getElementById('icity-calendar-years');
    if (yearsContainer) {
        yearsContainer.innerHTML = '';
        const years = [2026];
        years.forEach(y => {
            const span = document.createElement('span');
            span.textContent = y;
            if (y === year) {
                span.style.cssText = 'color: #fff; background: #7C9BF8; padding: 2px 12px; border-radius: 12px; cursor: default;';
            } else {
                span.style.cssText = 'cursor: pointer;';
                span.onclick = () => renderIcityCalendar(y);
            }
            yearsContainer.appendChild(span);
        });
    }

    // Filter diaries for this year
    const diaries = window.iphoneSimState.icityDiaries || [];
    const yearDiaries = diaries.filter(d => new Date(d.time).getFullYear() === year);
    
    // Stats
    const distinctDays = new Set(yearDiaries.map(d => {
        const date = new Date(d.time);
        return `${date.getMonth()}-${date.getDate()}`;
    })).size;
    
    const daysEl = document.getElementById('icity-calendar-days');
    if (daysEl) daysEl.textContent = distinctDays;
    const countEl = document.getElementById('icity-calendar-count');
    if (countEl) countEl.textContent = yearDiaries.length;

    // Heatmap
    renderIcityHeatmap(year, yearDiaries);

    // Monthly List
    renderIcityMonthlyList(year, yearDiaries);
}

function renderIcityHeatmap(year, diaries) {
    const container = document.getElementById('icity-calendar-heatmap');
    if (!container) return;
    container.innerHTML = '';
    
    const diaryDates = new Set(diaries.map(d => {
        const date = new Date(d.time);
        return `${date.getMonth()}-${date.getDate()}`;
    }));

    const today = new Date(); // Uses system/simulated time
    // In ACT MODE, environment time is 2026/2/1.
    // If we rely on system Date(), it might be 2026.
    
    for (let m = 0; m < 12; m++) {
        for (let d = 1; d <= 31; d++) {
            const el = document.createElement('div');
            el.style.width = '100%';
            el.style.aspectRatio = '1/1';
            
            // Check validity
            // Note: Date(2026, 1, 30) -> March 2
            const date = new Date(year, m, d);
            if (date.getMonth() !== m) {
                el.style.background = 'transparent'; // Invalid date
            } else {
                el.style.background = '#f0f0f0';
                el.style.borderRadius = '1px';
                
                const key = `${m}-${d}`;
                
                // Today check (Yellow)
                if (year === today.getFullYear() && m === today.getMonth() && d === today.getDate()) {
                    el.style.background = '#FFCC00';
                }
                // Diary check (Blue) - overrides today? Or prioritized?
                // User said: "When user published text on a day ... square will turn blue."
                // "Today ... square is yellow".
                // If I published today, is it blue or yellow?
                // Usually "Today" is status, "Diary" is record.
                // If I wrote today, maybe it should be Blue to indicate record?
                // Or maybe both?
                // Let's assume Blue takes precedence if recorded, or Yellow if just today?
                // User: "Today ... top little square is yellow".
                // Let's keep Yellow for today regardless of diary, or Blue if diary?
                // Let's make Blue overwrite Yellow if diary exists, as "Record" is more important visualization in heatmap.
                // Or maybe the user implies "Today is yellow" means the cursor.
                
                if (diaryDates.has(key)) {
                    el.style.background = '#7C9BF8'; // Blue for diary
                } else if (year === today.getFullYear() && m === today.getMonth() && d === today.getDate()) {
                    el.style.background = '#FFCC00'; // Yellow for today (no diary)
                }
            }
            container.appendChild(el);
        }
    }
}

function renderIcityMonthlyList(year, diaries) {
    const container = document.getElementById('icity-calendar-months');
    if (!container) return;
    container.innerHTML = '';

    // Weekday Header
    const weekHeader = document.createElement('div');
    weekHeader.style.display = 'flex';
    weekHeader.style.gap = '10px';
    weekHeader.style.marginBottom = '10px';
    
    const spacer = document.createElement('div');
    spacer.style.width = '50px';
    weekHeader.appendChild(spacer);
    
    const weekGrid = document.createElement('div');
    weekGrid.style.flex = '1';
    weekGrid.style.display = 'grid';
    weekGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    weekGrid.style.gap = '5px';
    weekGrid.style.textAlign = 'center';
    weekGrid.style.fontSize = '12px';
    weekGrid.style.color = '#ccc';
    
    ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].forEach(d => {
        const el = document.createElement('div');
        el.textContent = d;
        weekGrid.appendChild(el);
    });
    weekHeader.appendChild(weekGrid);
    container.appendChild(weekHeader);

    const today = new Date();
    const diaryDates = new Set(diaries.map(d => {
        const date = new Date(d.time);
        return `${date.getMonth()}-${date.getDate()}`;
    }));

    let startM = 11;
    if (year === today.getFullYear()) startM = today.getMonth();
    else if (year > today.getFullYear()) startM = -1;

    // Months reverse order
    for (let m = startM; m >= 0; m--) {
        const monthDiv = document.createElement('div');
        monthDiv.style.marginBottom = '20px';
        
        const monthNameEn = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][m];
        const monthNameCn = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"][m];
        
        const wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.gap = '10px';
        
        const header = document.createElement('div');
        header.style.width = '50px';
        header.style.flexShrink = '0';
        header.style.textAlign = 'right';
        header.style.paddingTop = '0px';
        header.innerHTML = `
            <div style="font-weight: bold; font-size: 14px;">${monthNameEn}</div>
            <div style="font-weight: bold; font-size: 12px;">${monthNameCn}</div>
            <div style="font-size: 10px; color: #999;">${year}</div>
            <div style="margin-top: 5px; font-size: 10px; color: #999; background: #f0f0f0; display: inline-block; padding: 2px 5px; border-radius: 4px;">
                ${getDiariesCountInMonth(diaries, m)}天
            </div>
        `;
        
        const grid = document.createElement('div');
        grid.style.flex = '1';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        grid.style.gap = '5px';
        
        // Days
        let firstDay = new Date(year, m, 1).getDay(); // 0 = Sun
        firstDay = (firstDay + 6) % 7; // 0 = Mon
        
        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }
        
        const daysInMonth = new Date(year, m + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
            const dayEl = document.createElement('div');
            dayEl.style.aspectRatio = '1/1';
            dayEl.style.display = 'flex';
            dayEl.style.alignItems = 'center';
            dayEl.style.justifyContent = 'center';
            dayEl.style.borderRadius = '4px';
            dayEl.style.fontSize = '14px';
            dayEl.style.color = '#666';
            dayEl.style.background = '#f9f9f9'; // Default box
            dayEl.textContent = d;
            
            const key = `${m}-${d}`;
            if (diaryDates.has(key)) {
                dayEl.style.background = '#7C9BF8'; // Blue
                dayEl.style.color = '#fff';
            }
            
            // Today Highlight
            if (year === today.getFullYear() && m === today.getMonth() && d === today.getDate()) {
                dayEl.style.position = 'relative';
                const line = document.createElement('div');
                line.style.position = 'absolute';
                line.style.bottom = '2px';
                line.style.width = '15px';
                line.style.height = '2px';
                line.style.background = '#FFCC00';
                dayEl.appendChild(line);
            }
            
            grid.appendChild(dayEl);
        }
        
        wrapper.appendChild(header);
        wrapper.appendChild(grid);
        monthDiv.appendChild(wrapper);
        container.appendChild(monthDiv);
    }
}

function getDiariesCountInMonth(diaries, month) {
    return new Set(diaries.filter(d => new Date(d.time).getMonth() === month).map(d => new Date(d.time).getDate())).size;
}
