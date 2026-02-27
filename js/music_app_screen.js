(function () {
    const MUSIC_V2_STYLE_RAW = `:root {
            --bg-base: #e5e5ea;
            --app-bg: #f5f5f7;
            --text-dark: #000000;
            --text-gray: #8e8e93;
            --accent: #1c1c1e;
            --glass-bg: rgba(255, 255, 255, 0.7);
            --glass-border: rgba(255, 255, 255, 0.8);
            --shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
            --nav-bg: #ffffff;
        }

        * {
            margin: 0; padding: 0; box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            -webkit-tap-highlight-color: transparent;
        }

        body {
            background-color: var(--bg-base);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
            background-image: radial-gradient(circle at 50% 0%, #ffffff 0%, #e5e5ea 80%);
        }

        /* Phone Container */
        .phone {
            width: 375px;
            height: 812px;
            background-color: var(--app-bg);
            border-radius: 45px;
            box-shadow: var(--shadow);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 10px solid #ffffff;
            outline: 2px solid #d1d1d6;
        }

        .clickable {
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .clickable:active {
            transform: scale(0.94);
            opacity: 0.6;
        }

        /* Header / Top Bar */
        .top-bar {
            padding: 50px 24px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            z-index: 10;
        }
        .profile-pic {
            width: 40px; height: 40px;
            border-radius: 50%;
            background: url('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80') center/cover;
            border: 2px solid #fff;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }
        .top-actions {
            display: flex; gap: 16px; font-size: 22px; color: var(--text-dark);
        }

        /* Invite Popup */
        .invite-popup {
            position: absolute; top: -120px; left: 20px; right: 20px;
            background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
            border-radius: 24px; padding: 16px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
            display: none !important; align-items: center; gap: 12px;
            z-index: 300; transition: top 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border: 1px solid rgba(255,255,255,0.8);
            pointer-events: none;
        }
        .invite-popup.active { top: 50px; display: none !important; }
        .ip-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
        .ip-info { flex: 1; }
        .ip-info h4 { font-size: 15px; font-weight: 700; margin-bottom: 2px; }
        .ip-info p { font-size: 12px; color: var(--text-gray); }
        .ip-actions { display: flex; gap: 8px; }
        .ip-btn { padding: 8px 16px; border-radius: 16px; font-size: 13px; font-weight: 600; border: none; outline: none; }
        .ip-btn.accept { background: var(--text-dark); color: white; }
        .ip-btn.reject { background: #e5e5ea; color: var(--text-dark); }

        /* Scrollable Content */
        .scroll-content {
            flex: 1;
            overflow-y: auto;
            padding: 10px 24px 120px;
            scrollbar-width: none;
            position: relative;
        }
        .scroll-content::-webkit-scrollbar { display: none; }

        /* Views */
        .view-section {
            display: none;
            animation: fadeSlideUp 0.3s ease forwards;
        }
        .view-section.active {
            display: block;
        }

        @keyframes fadeSlideUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Home View Styles */
        .greeting {
            font-size: 34px;
            font-weight: 800;
            letter-spacing: -1px;
            margin-bottom: 24px;
            line-height: 1.1;
        }
        .greeting span {
            color: var(--text-gray);
            font-weight: 400;
        }

        .search-box {
            background: #ffffff;
            border-radius: 20px;
            padding: 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.03);
            margin-bottom: 30px;
        }
        .search-box input {
            border: none; outline: none; background: transparent; width: 100%;
            font-size: 16px; color: var(--text-dark);
        }

        .sec-title {
            font-size: 18px; font-weight: 700; margin-bottom: 16px;
            display: flex; justify-content: space-between; align-items: center;
        }
        .sec-title i { font-size: 20px; color: var(--text-gray); }

        .together-card {
            background: var(--accent);
            color: white;
            border-radius: 24px;
            padding: 24px;
            margin-bottom: 30px;
            position: relative;
            overflow: hidden;
        }
        .together-card::before {
            content: 'SYNC';
            position: absolute; right: -10px; bottom: -20px;
            font-size: 80px; font-weight: 900; opacity: 0.05;
        }
        .tc-friends {
            display: flex; margin-bottom: 16px;
        }
        .tc-friends img {
            width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--accent);
            margin-left: -10px; background: #fff;
        }
        .tc-friends img:first-child { margin-left: 0; }
        .tc-btn {
            background: #ffffff; color: var(--text-dark);
            padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;
            display: inline-block;
        }

        /* Lists */
        .list-item {
            display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
        }
        .li-num { font-size: 14px; font-weight: 600; color: var(--text-gray); width: 20px; }
        .li-img { width: 56px; height: 56px; border-radius: 16px; background: #ddd; object-fit: cover; }
        .li-info { flex: 1; }
        .li-info h4 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
        .li-info p { font-size: 13px; color: var(--text-gray); }
        .li-action { font-size: 24px; color: var(--text-gray); }

        /* Grids */
        .grid-scroll {
            display: flex; gap: 16px; overflow-x: auto; padding-bottom: 20px; 
            margin: 0 -24px; padding-left: 24px; scrollbar-width: none;
        }
        .grid-item { min-width: 130px; }
        .grid-item img {
            width: 100%; aspect-ratio: 1; border-radius: 20px; margin-bottom: 8px; object-fit: cover;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        .grid-item h4 { font-size: 14px; font-weight: 600; }
        .grid-item p { font-size: 12px; color: var(--text-gray); margin-top: 2px; }

        /* Floating Nav & Player */
        .floating-bottom {
            position: absolute;
            bottom: 24px; left: 24px; right: 24px;
            z-index: 100;
        }

        .mini-player {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: 24px;
            padding: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            margin-bottom: 7px;
        }
        .mp-art { width: 44px; height: 44px; border-radius: 16px; background: #ccc; }
        .mp-info { flex: 1; }
        .mp-info h4 { font-size: 14px; font-weight: 600; }
        .mp-info p { font-size: 12px; color: var(--text-gray); }
        .mp-play { width: 36px; height: 36px; background: var(--text-dark); color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 18px; margin-right: 8px; }

        /* OPTIMIZED NAV BAR: White bg, Black icons */
        .nav-bar {
            background: var(--nav-bg);
            border-radius: 30px;
            height: 60px;
            display: flex;
            justify-content: space-around;
            align-items: center;
            padding: 0 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            border: 1px solid rgba(0,0,0,0.03);
        }
        .nav-item {
            color: var(--text-gray); font-size: 22px; width: 44px; height: 44px;
            display: flex; justify-content: center; align-items: center; border-radius: 50%;
            transition: all 0.2s;
        }
        .nav-item.active { 
            color: var(--text-dark); 
            background: rgba(0,0,0,0.05); 
        }

        /* Sub-Pages (Slide from right) */
        .page-overlay {
            position: absolute; top: 0; left: 100%; width: 100%; height: 100%;
            background: var(--app-bg); z-index: 150;
            transition: left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            display: flex; flex-direction: column;
        }
        .page-overlay.active { left: 0; }
        
        .page-header {
            padding: 50px 24px 20px;
            display: flex; align-items: center; gap: 16px;
            font-size: 20px; font-weight: 700;
            background: rgba(245,245,247,0.9);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            z-index: 10;
        }
        .page-content {
            flex: 1; overflow-y: auto; padding: 10px 24px 120px; scrollbar-width: none;
        }
        .page-content::-webkit-scrollbar { display: none; }

        /* Playlist Header */
        .pl-hero {
            display: flex; flex-direction: column; align-items: center; text-align: center;
            margin-bottom: 30px;
        }
        .pl-hero img { width: 180px; height: 180px; border-radius: 30px; box-shadow: 0 15px 30px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .pl-hero h2 { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
        .pl-hero p { color: var(--text-gray); font-size: 14px; }
        .pl-actions { display: flex; gap: 16px; margin-top: 20px; width: 100%; }
        .pl-btn { flex: 1; background: var(--text-dark); color: white; border-radius: 16px; padding: 14px; font-weight: 600; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .pl-btn.secondary { background: #e5e5ea; color: var(--text-dark); }

        /* Friends View Styles */
        .friend-row {
            display: flex; align-items: center; gap: 16px; padding: 16px;
            background: #ffffff; border-radius: 20px; margin-bottom: 12px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .fr-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
        .fr-info { flex: 1; }
        .fr-info h4 { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
        .fr-info p { font-size: 13px; color: var(--text-gray); display: flex; align-items: center; gap: 4px; }
        .fr-status { width: 10px; height: 10px; border-radius: 50%; background: #34c759; }
        .fr-status.offline { background: #d1d1d6; }
        .fr-action { width: 36px; height: 36px; border-radius: 50%; background: #f0f0f2; display: flex; justify-content: center; align-items: center; color: var(--text-dark); }

        /* Listen Together Active State */
        .sync-active-bar {
            background: #000000; color: white; padding: 12px 24px;
            border-radius: 20px; display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 20px; animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.2); }
            70% { box-shadow: 0 0 0 10px rgba(0,0,0,0); }
            100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }
        .sync-avatars { display: flex; }
        .sync-avatars img { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #000; margin-left: -8px; }
        .sync-avatars img:first-child { margin-left: 0; }

        /* Song Page Full */
        .song-view {
            position: absolute; top: 100%; left: 0; width: 100%; height: 100%;
            background: #ffffff; z-index: 200;
            transition: top 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
            padding: 50px 24px 40px;
            display: flex; flex-direction: column;
        }
        .song-view.active { top: 0; }

        .sv-header { display: flex; justify-content: space-between; align-items: center; font-size: 24px; margin-bottom: 30px; }
        
        /* Solo vs Together Elements Toggling */
        .sv-together-elements { display: none; }
        .sv-solo-elements { display: block; }
        .song-view.together .sv-together-elements { display: flex; }
        .song-view.together .sv-solo-elements { display: none; }
        .song-view:not(.together) #chat-icon { display: none; }

        /* Solo Art */
        .sv-art-container {
            width: 100%; aspect-ratio: 1; margin-bottom: 40px;
            border-radius: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            overflow: hidden;
            position: relative;
        }
        .sv-art-container img { width: 100%; height: 100%; object-fit: cover; }

        /* Listen Together Avatars */
        .sv-together-avatars {
            justify-content: center; align-items: center; gap: 16px;
            margin-bottom: 24px;
        }
        .sv-together-avatars img {
            width: 48px; height: 48px; border-radius: 50%; object-fit: cover;
            border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
        .sv-together-deco {
            display: flex; gap: 4px;
        }
        .sv-together-deco span {
            width: 6px; height: 6px; background: var(--text-gray); border-radius: 50%;
            animation: bounce 1.4s infinite ease-in-out both;
        }
        .sv-together-deco span:nth-child(1) { animation-delay: -0.32s; }
        .sv-together-deco span:nth-child(2) { animation-delay: -0.16s; }
        
        @keyframes bounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1); }
        }

        /* Vinyl Record */
        .sv-vinyl-container {
            width: 260px; height: 260px; margin: 0 auto 30px;
            position: relative;
            justify-content: center; align-items: center;
        }
        .sv-vinyl {
            width: 260px; height: 260px; border-radius: 50%;
            background: radial-gradient(circle at center, #222 0%, #000 100%);
            box-shadow: 0 15px 35px rgba(0,0,0,0.2);
            display: flex; justify-content: center; align-items: center;
            position: relative;
            animation: spin 8s linear infinite;
        }
        .sv-vinyl.paused {
            animation-play-state: paused;
        }
        /* Groove rings */
        .sv-vinyl::before {
            content: ''; position: absolute;
            width: 244px; height: 244px; border-radius: 50%;
            border: 1px solid rgba(255,255,255,0.05);
            box-shadow: inset 0 0 0 4px #000,
                        inset 0 0 0 5px rgba(255,255,255,0.05),
                        inset 0 0 0 10px #000,
                        inset 0 0 0 11px rgba(255,255,255,0.05),
                        inset 0 0 0 18px #000,
                        inset 0 0 0 19px rgba(255,255,255,0.05);
        }
        .sv-vinyl img {
            width: 170px; height: 170px; border-radius: 50%; object-fit: cover;
            z-index: 2;
        }
        /* Center hole */
        .sv-vinyl::after {
            content: ''; position: absolute;
            width: 12px; height: 12px; border-radius: 50%;
            background: #ffffff; z-index: 3;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);
        }
        
        @keyframes spin {
            100% { transform: rotate(360deg); }
        }

        .sv-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
        .sv-artist { font-size: 18px; color: var(--text-gray); font-weight: 500; margin-bottom: 10px; }

        /* FIXED Progress Bar */
        .sv-slider {
            width: 100%; height: 4px; background: #d1d1d6; border-radius: 2px; margin: 24px 0 12px; position: relative;
            flex-shrink: 0;
        }
        .sv-slider-fill {
            width: 40%; height: 100%; background: var(--text-dark); border-radius: 2px; position: absolute; left: 0; top: 0;
        }
        .sv-slider-fill::after {
            content: ''; position: absolute; right: -6px; top: 50%; transform: translateY(-50%);
            width: 12px; height: 12px; background: var(--text-dark); border-radius: 50%;
        }
        .sv-times { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-gray); font-weight: 600; margin-bottom: 40px; }

        .sv-controls { display: flex; justify-content: space-between; align-items: center; font-size: 28px; }
        .sv-play { width: 80px; height: 80px; background: var(--text-dark); color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 36px; box-shadow: 0 10px 20px rgba(0,0,0,0.1); }`;
    const MUSIC_V2_MARKUP_RAW = `<div class="phone">
        
        <!-- Invite Popup -->
        <div class="invite-popup" id="invite-popup">
            <img class="ip-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80">
            <div class="ip-info">
                <h4>Emma Watson</h4>
                <p>Invited you to Listen Together</p>
            </div>
            <div class="ip-actions">
                <button class="ip-btn reject clickable" onclick="closeInvite()">Decline</button>
                <button class="ip-btn accept clickable" onclick="acceptInvite()">Join</button>
            </div>
        </div>

        <div class="top-bar">
            <div class="profile-pic clickable"></div>
            <div class="top-actions">
                <i class="ri-notification-3-line clickable"></i>
                <i class="ri-settings-4-line clickable"></i>
            </div>
        </div>

        <div class="scroll-content">
            
            <!-- HOME VIEW -->
            <div id="view-home" class="view-section active">
                <div class="greeting">
                    Listen<br>
                    <span>Everywhere.</span>
                </div>

                <div class="search-box clickable" onclick="switchNav(document.querySelectorAll('.nav-item')[1], 'view-explore')">
                    <i class="ri-search-line" style="color: var(--text-gray); font-size: 20px;"></i>
                    <input type="text" placeholder="Search songs, artists, friends..." readonly>
                </div>

                <div class="together-card clickable" onclick="switchNav(document.querySelectorAll('.nav-item')[2], 'view-friends')">
                    <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">Listen Together</h3>
                    <p style="font-size: 14px; opacity: 0.8; margin-bottom: 20px;">Sync music with your friends in real-time.</p>
                    <div class="tc-friends">
                        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80">
                        <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); border: 2px solid var(--accent); margin-left: -10px; display: flex; justify-content: center; align-items: center; font-size: 12px; backdrop-filter: blur(5px);">+3</div>
                    </div>
                    <div class="tc-btn">Start Session</div>
                </div>

                <div class="sec-title">
                    Top Hits
                    <i class="ri-play-circle-line clickable"></i>
                </div>

                <div class="list-item clickable" onclick="toggleSongView('solo')">
                    <div class="li-num">01</div>
                    <img class="li-img" src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=100&q=80">
                    <div class="li-info">
                        <h4>Blinding Lights</h4>
                        <p>The Weeknd</p>
                    </div>
                    <i class="ri-more-2-fill li-action clickable" onclick="event.stopPropagation()"></i>
                </div>

                <div class="list-item clickable" onclick="toggleSongView('solo')">
                    <div class="li-num">02</div>
                    <img class="li-img" src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80">
                    <div class="li-info">
                        <h4>As It Was</h4>
                        <p>Harry Styles</p>
                    </div>
                    <i class="ri-heart-3-fill li-action clickable" style="color: var(--text-dark);" onclick="event.stopPropagation()"></i>
                </div>
                
                <div class="sec-title" style="margin-top: 30px;">
                    Your Playlists
                </div>
                <div class="grid-scroll">
                    <div class="grid-item clickable" onclick="openPage('page-playlist')">
                        <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=200&q=80">
                        <h4>Chill Vibes</h4>
                        <p>24 tracks</p>
                    </div>
                    <div class="grid-item clickable" onclick="openPage('page-likes')">
                        <div style="width:100%; aspect-ratio:1; border-radius:20px; margin-bottom:8px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); display:flex; justify-content:center; align-items:center; font-size:40px; color:#fff;">
                            <i class="ri-heart-3-fill" style="color: #ff3b30;"></i>
                        </div>
                        <h4>Liked Songs</h4>
                        <p>128 tracks</p>
                    </div>
                    <div class="grid-item clickable">
                        <img src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200&q=80">
                        <h4>Workout</h4>
                        <p>45 tracks</p>
                    </div>
                </div>
            </div>

            <!-- EXPLORE VIEW -->
            <div id="view-explore" class="view-section">
                <div class="sec-title" style="font-size: 28px; font-weight: 800;">Explore</div>
                <div class="search-box">
                    <i class="ri-search-line" style="color: var(--text-gray); font-size: 20px;"></i>
                    <input type="text" placeholder="Search songs, artists...">
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div class="clickable" style="background: #ff9a9e; height: 100px; border-radius: 16px; padding: 16px; color: white; font-weight: 700; font-size: 18px;">Pop</div>
                    <div class="clickable" style="background: #a18cd1; height: 100px; border-radius: 16px; padding: 16px; color: white; font-weight: 700; font-size: 18px;">Indie</div>
                    <div class="clickable" style="background: #fbc2eb; height: 100px; border-radius: 16px; padding: 16px; color: white; font-weight: 700; font-size: 18px;">R&B</div>
                    <div class="clickable" style="background: #8fd3f4; height: 100px; border-radius: 16px; padding: 16px; color: white; font-weight: 700; font-size: 18px;">Jazz</div>
                </div>
            </div>

            <!-- FRIENDS VIEW -->
            <div id="view-friends" class="view-section">
                <div class="sec-title" style="font-size: 28px; font-weight: 800; display: flex; justify-content: space-between; align-items: center;">
                    Friends
                    <i class="ri-user-add-line clickable" style="font-size: 22px; color: var(--text-dark);" onclick="showInvite()" title="Simulate Invite"></i>
                </div>
                
                <div class="sync-active-bar clickable" onclick="toggleSongView('together')">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <i class="ri-headphone-line" style="font-size: 20px;"></i>
                        <div>
                            <div style="font-size: 14px; font-weight: 600;">Listening Together</div>
                            <div style="font-size: 12px; opacity: 0.8;">Blinding Lights</div>
                        </div>
                    </div>
                    <div class="sync-avatars">
                        <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80">
                    </div>
                </div>

                <div class="friend-row clickable" onclick="toggleSongView('together')">
                    <img class="fr-avatar" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80">
                    <div class="fr-info">
                        <h4>Emma Watson</h4>
                        <p><i class="ri-music-2-line"></i> As It Was - Harry Styles</p>
                    </div>
                    <div class="fr-action"><i class="ri-headphone-line"></i></div>
                </div>

                <div class="friend-row clickable" onclick="toggleSongView('together')">
                    <img class="fr-avatar" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80">
                    <div class="fr-info">
                        <h4>Liam Smith</h4>
                        <p><i class="ri-music-2-line"></i> Starboy - The Weeknd</p>
                    </div>
                    <div class="fr-action"><i class="ri-headphone-line"></i></div>
                </div>

                <div class="friend-row clickable" style="opacity: 0.6;">
                    <img class="fr-avatar" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80">
                    <div class="fr-info">
                        <h4>Sophia Chen</h4>
                        <p>Offline 2h ago</p>
                    </div>
                </div>
            </div>

            <!-- LIBRARY VIEW -->
            <div id="view-library" class="view-section">
                <div class="sec-title" style="font-size: 28px; font-weight: 800;">Library</div>
                <div class="list-item clickable" onclick="openPage('page-likes')">
                    <div class="li-img" style="background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); display:flex; justify-content:center; align-items:center; font-size:24px; color:#fff;">
                        <i class="ri-heart-3-fill" style="color: #ff3b30;"></i>
                    </div>
                    <div class="li-info">
                        <h4 style="font-size: 18px;">Liked Songs</h4>
                        <p>128 tracks</p>
                    </div>
                    <i class="ri-arrow-right-s-line li-action"></i>
                </div>
                <div class="list-item clickable" onclick="openPage('page-playlist')">
                    <img class="li-img" src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=100&q=80">
                    <div class="li-info">
                        <h4 style="font-size: 18px;">Chill Vibes</h4>
                        <p>Playlist • 24 tracks</p>
                    </div>
                    <i class="ri-arrow-right-s-line li-action"></i>
                </div>
            </div>

        </div>

        <div class="floating-bottom">
                <div class="mini-player clickable" onclick="toggleSongView('solo')">
                <img class="mp-art" src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=100&q=80">
                <div class="mp-info">
                    <h4>Blinding Lights</h4>
                    <p>The Weeknd</p>
                </div>
                <div class="mp-play clickable" onclick="togglePlay(event)">
                    <i id="mini-play-icon" class="ri-pause-fill"></i>
                </div>
            </div>

            <!-- OPTIMIZED NAV BAR -->
            <div class="nav-bar">
                <div class="nav-item active clickable" onclick="switchNav(this, 'view-home')"><i class="ri-home-5-fill"></i></div>
                <div class="nav-item clickable" onclick="switchNav(this, 'view-explore')"><i class="ri-search-line"></i></div>
                <div class="nav-item clickable" onclick="switchNav(this, 'view-friends')"><i class="ri-group-line"></i></div>
                <div class="nav-item clickable" onclick="switchNav(this, 'view-library')"><i class="ri-folder-music-line"></i></div>
            </div>
        </div>

        <!-- PAGE: Playlist Detail -->
        <div class="page-overlay" id="page-playlist">
            <div class="page-header clickable" onclick="closePage('page-playlist')">
                <i class="ri-arrow-left-line"></i>
            </div>
            <div class="page-content">
                <div class="pl-hero">
                    <img src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80">
                    <h2>Chill Vibes</h2>
                    <p>Curated for relaxing • 24 tracks</p>
                    <div class="pl-actions">
                        <div class="pl-btn clickable" onclick="toggleSongView('solo')"><i class="ri-play-fill" style="font-size: 20px;"></i> Play</div>
                        <div class="pl-btn secondary clickable" onclick="toggleSongView('solo')"><i class="ri-shuffle-line" style="font-size: 20px;"></i> Shuffle</div>
                    </div>
                </div>
                
                <div class="list-item clickable" onclick="toggleSongView('solo')">
                    <div class="li-num">1</div>
                    <div class="li-info">
                        <h4>Midnight City</h4>
                        <p>M83</p>
                    </div>
                    <i class="ri-more-2-fill li-action clickable" onclick="event.stopPropagation()"></i>
                </div>
                <div class="list-item clickable" onclick="toggleSongView('solo')">
                    <div class="li-num">2</div>
                    <div class="li-info">
                        <h4>Nightcall</h4>
                        <p>Kavinsky</p>
                    </div>
                    <i class="ri-more-2-fill li-action clickable" onclick="event.stopPropagation()"></i>
                </div>
            </div>
        </div>

        <!-- PAGE: Liked Songs -->
        <div class="page-overlay" id="page-likes">
            <div class="page-header clickable" onclick="closePage('page-likes')">
                <i class="ri-arrow-left-line"></i>
            </div>
            <div class="page-content">
                <div class="pl-hero">
                    <div style="width: 180px; height: 180px; border-radius: 30px; box-shadow: 0 15px 30px rgba(0,0,0,0.1); margin-bottom: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); display:flex; justify-content:center; align-items:center; font-size:80px; color:#fff;">
                        <i class="ri-heart-3-fill" style="color: #ff3b30;"></i>
                    </div>
                    <h2>Liked Songs</h2>
                    <p>128 tracks</p>
                    <div class="pl-actions">
                        <div class="pl-btn clickable" onclick="toggleSongView('solo')"><i class="ri-play-fill" style="font-size: 20px;"></i> Play</div>
                    </div>
                </div>
                
                <div class="list-item clickable" onclick="toggleSongView('solo')">
                    <img class="li-img" src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=100&q=80">
                    <div class="li-info">
                        <h4>Blinding Lights</h4>
                        <p>The Weeknd</p>
                    </div>
                    <i class="ri-heart-3-fill li-action clickable" style="color: #ff3b30;" onclick="event.stopPropagation()"></i>
                </div>
                <div class="list-item clickable" onclick="toggleSongView('solo')">
                    <img class="li-img" src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=100&q=80">
                    <div class="li-info">
                        <h4>As It Was</h4>
                        <p>Harry Styles</p>
                    </div>
                    <i class="ri-heart-3-fill li-action clickable" style="color: #ff3b30;" onclick="event.stopPropagation()"></i>
                </div>
            </div>
        </div>

        <!-- Full Song View -->
        <div class="song-view" id="song-view">
            <div class="sv-header">
                <i class="ri-arrow-down-s-line clickable" onclick="toggleSongView()"></i>
                <span class="sv-header-title" style="font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--text-gray);">Now Playing</span>
                <i class="ri-more-2-fill clickable"></i>
            </div>

            <!-- Together Elements -->
            <div class="sv-together-avatars sv-together-elements">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Me">
                <div class="sv-together-deco">
                    <span></span><span></span><span></span>
                </div>
                <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="Friend">
            </div>

            <div class="sv-vinyl-container sv-together-elements">
                <div class="sv-vinyl" id="vinyl-record">
                    <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80" alt="Album Art">
                </div>
            </div>

            <!-- Solo Elements -->
            <div class="sv-art-container sv-solo-elements">
                <img src="https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80">
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <div class="sv-title">Blinding Lights</div>
                    <div class="sv-artist">The Weeknd</div>
                </div>
                <i class="ri-heart-3-fill clickable" style="font-size: 28px; color: #ff3b30;"></i>
            </div>

            <div class="sv-slider">
                <div class="sv-slider-fill"></div>
            </div>
            <div class="sv-times">
                <span>1:18</span>
                <span>3:20</span>
            </div>

            <div class="sv-controls">
                <i class="ri-shuffle-line clickable" style="color: var(--text-gray); font-size: 24px;"></i>
                <i class="ri-skip-back-fill clickable"></i>
                <div class="sv-play clickable" onclick="togglePlay()">
                    <i id="play-btn-icon" class="ri-pause-fill"></i>
                </div>
                <i class="ri-skip-forward-fill clickable"></i>
                <i class="ri-repeat-2-line clickable" style="color: var(--text-gray); font-size: 24px;"></i>
            </div>
            
            <div style="margin-top: auto; display: flex; justify-content: center; gap: 40px; color: var(--text-gray); font-size: 24px; padding-top: 20px;">
                <i class="ri-speaker-2-line clickable"></i>
                <i class="ri-chat-3-line clickable" id="chat-icon"></i>
                <i class="ri-play-list-2-line clickable"></i>
            </div>
        </div>

    </div>`;

    function getMusicRoot() {
        const host = document.getElementById('music-app-shadow-host');
        if (!host) return null;
        return host;
    }

    window.musicV2GetRoot = getMusicRoot;

    window.musicV2SwitchNav = function (el, viewId) {
        const root = getMusicRoot();
        if (!root || !el) return;

        root.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            const icon = item.querySelector('i');
            if (icon && icon.className.includes('-fill')) {
                icon.className = icon.className.replace('-fill', '-line');
            }
        });

        el.classList.add('active');
        const activeIcon = el.querySelector('i');
        if (activeIcon && activeIcon.className.includes('-line')) {
            activeIcon.className = activeIcon.className.replace('-line', '-fill');
        }

        root.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
        const target = root.querySelector(`#${viewId}`);
        if (target) target.classList.add('active');

        if (viewId === 'view-library') {
            musicV2RenderLibrary();
            musicV2RenderPlaylistPage();
        } else if (viewId === 'view-explore') {
            musicV2RenderSearch();
        } else if (viewId === 'view-friends') {
            musicV2RenderFriends();
        } else if (viewId === 'view-home') {
            musicV2RenderMiniPlayer();
        }
    };

    window.musicV2ToggleSongView = function (mode = null) {
        const root = getMusicRoot();
        if (!root) return;

        const sv = root.querySelector('#song-view');
        const headerTitle = root.querySelector('.sv-header-title');
        if (!sv) return;
        const music = musicV2EnsureModel();
        const hasActiveSession = !!(music.listenTogether && music.listenTogether.activeSession);

        if (mode) {
            if (mode === 'together' || (mode === 'solo' && hasActiveSession)) {
                sv.classList.add('together');
                if (headerTitle) headerTitle.innerText = 'Listening Together';
            } else {
                sv.classList.remove('together');
                if (headerTitle) headerTitle.innerText = 'Now Playing';
            }
            sv.classList.add('active');
        } else {
            sv.classList.remove('active');
        }
    };

    let isPlaying = true;
    window.musicV2TogglePlay = function (evt = null) {
        if (evt) evt.stopPropagation();

        if (typeof window.musicV2FeatureTogglePlay === 'function') {
            window.musicV2FeatureTogglePlay();
            return;
        }

        const root = getMusicRoot();
        if (!root) return;

        isPlaying = !isPlaying;

        const vinyl = root.querySelector('#vinyl-record');
        const playBtnIcon = root.querySelector('#play-btn-icon');
        const miniPlayIcon = root.querySelector('#mini-play-icon');

        if (isPlaying) {
            if (vinyl) vinyl.classList.remove('paused');
            if (playBtnIcon) playBtnIcon.className = 'ri-pause-fill';
            if (miniPlayIcon) miniPlayIcon.className = 'ri-pause-fill';
        } else {
            if (vinyl) vinyl.classList.add('paused');
            if (playBtnIcon) playBtnIcon.className = 'ri-play-fill';
            if (miniPlayIcon) miniPlayIcon.className = 'ri-play-fill';
        }
    };

    window.musicV2OpenPage = function (pageId) {
        const root = getMusicRoot();
        if (!root) return;
        const page = root.querySelector(`#${pageId}`);
        if (page) page.classList.add('active');
    };

    window.musicV2ClosePage = function (pageId) {
        const root = getMusicRoot();
        if (!root) return;
        const page = root.querySelector(`#${pageId}`);
        if (page) page.classList.remove('active');
    };

    window.musicV2ShowInvite = function () {
        const root = getMusicRoot();
        if (!root) return;
        const popup = root.querySelector('#invite-popup');
        if (popup) popup.classList.add('active');
    };

    window.musicV2CloseInvite = function () {
        const root = getMusicRoot();
        if (!root) return;
        const popup = root.querySelector('#invite-popup');
        if (popup) popup.classList.remove('active');
    };

    window.musicV2AcceptInvite = function () {
        window.musicV2CloseInvite();
        setTimeout(() => {
            window.musicV2ToggleSongView('together');
        }, 300);
    };

    const MUSIC_V2_DEFAULT_COVER = 'https://placehold.co/300x300/e5e7eb/111827?text=Music';
    const MUSIC_V2_SEARCH_PRIMARY = 'https://163api.qijieya.cn/cloudsearch';
    const MUSIC_V2_SEARCH_FALLBACK = 'https://163api.qijieya.cn/search';
    const MUSIC_V2_METING_API = 'https://api.qijieya.cn/meting/';
    const MUSIC_V2_BUGPK_API = 'https://api.bugpk.com/api/163_music';
    const MUSIC_V2_LYRIC_API = 'https://163api.qijieya.cn/lyric';

    const musicV2Runtime = {
        initialized: false,
        root: null,
        keyword: '',
        loading: false,
        error: '',
        results: [],
        pendingSong: null,
        activePlaylistId: null,
        coverDraft: '',
        audioBound: false,
        lyricsMode: 'cover',
        lyricsLoading: false,
        lyricsError: '',
        activeLyricIndex: -1,
        lastProgressSec: -1,
        lyricsFetchToken: 0,
        lyricsSongId: null,
        lyricsRenderedSongId: null
    };

    function musicV2Sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function musicV2EscapeHtml(input) {
        return String(input == null ? '' : input)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function musicV2GetState() {
        if (!window.iphoneSimState) window.iphoneSimState = {};
        if (!window.iphoneSimState.music || typeof window.iphoneSimState.music !== 'object') {
            window.iphoneSimState.music = {};
        }
        return window.iphoneSimState.music;
    }

    function musicV2MakeId(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    }

    function musicV2PickArtist(raw) {
        if (!raw) return '未知歌手';
        if (raw.artist && String(raw.artist).trim()) return String(raw.artist).trim();
        const arr = Array.isArray(raw.artists) ? raw.artists : (Array.isArray(raw.ar) ? raw.ar : []);
        if (arr.length > 0) {
            return arr.map(x => (x && (x.name || x.artistName)) ? (x.name || x.artistName) : '').filter(Boolean).join(' / ') || '未知歌手';
        }
        if (raw.author && String(raw.author).trim()) return String(raw.author).trim();
        return '未知歌手';
    }

    function musicV2NormalizeSong(raw) {
        const src = raw || {};
        const hasLocalLyrics = Array.isArray(src.lyricsData) && src.lyricsData.length > 0;
        return {
            id: String(src.id != null ? src.id : (src.songId != null ? src.songId : musicV2MakeId('song'))),
            title: String(src.title || src.name || '未命名歌曲'),
            artist: musicV2PickArtist(src),
            cover: src.cover || src.pic || (src.al && src.al.picUrl) || (src.album && src.album.picUrl) || '',
            src: src.src || src.url || '',
            provider: src.provider || '',
            lyricsData: Array.isArray(src.lyricsData) ? src.lyricsData : [],
            lyricsFile: typeof src.lyricsFile === 'string' ? src.lyricsFile : '',
            lyricsSource: src.lyricsSource || (hasLocalLyrics ? 'local' : ''),
            lyricsUpdatedAt: src.lyricsUpdatedAt || 0,
            addedAt: src.addedAt || Date.now()
        };
    }

    function musicV2SyncLegacyPlaylist(music) {
        const songsById = new Map((music.songs || []).map(song => [String(song.id), song]));
        const seen = new Set();
        const list = [];
        (music.playlists || []).forEach(pl => {
            (pl.songs || []).forEach(songId => {
                const sid = String(songId);
                if (seen.has(sid)) return;
                const song = songsById.get(sid);
                if (!song) return;
                seen.add(sid);
                list.push({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    src: song.src || '',
                    cover: song.cover || '',
                    provider: song.provider || '',
                    lyricsData: song.lyricsData || [],
                    lyricsFile: song.lyricsFile || '',
                    lyricsSource: song.lyricsSource || '',
                    lyricsUpdatedAt: song.lyricsUpdatedAt || 0
                });
            });
        });
        music.playlist = list;
    }

    function musicV2EnsureModel() {
        const music = musicV2GetState();
        if (!Array.isArray(music.songs)) music.songs = [];
        if (!Array.isArray(music.playlists)) music.playlists = [];
        if (!music.urlCache || typeof music.urlCache !== 'object') music.urlCache = {};
        if (!Array.isArray(music.playlist)) music.playlist = [];
        if (typeof music.activePlaylistId !== 'string') music.activePlaylistId = null;
        if (typeof music.playing !== 'boolean') music.playing = false;
        if (typeof music.title !== 'string' || !music.title) music.title = 'Happy Together';
        if (typeof music.artist !== 'string' || !music.artist) music.artist = 'Maximillian';
        if (typeof music.cover !== 'string' || !music.cover) music.cover = MUSIC_V2_DEFAULT_COVER;
        if (typeof music.src !== 'string') music.src = '';
        if (!Array.isArray(music.lyricsData)) music.lyricsData = [];
        if (typeof music.lyricsFile !== 'string') music.lyricsFile = '';
        if (!music.listenTogether || typeof music.listenTogether !== 'object') music.listenTogether = {};
        if (!Array.isArray(music.listenTogether.invites)) music.listenTogether.invites = [];
        if (!music.listenTogether.activeSession || typeof music.listenTogether.activeSession !== 'object') {
            music.listenTogether.activeSession = null;
        }
        if (!music.listenTogether.updatedAt) music.listenTogether.updatedAt = Date.now();

        if (!music.playlists.length) {
            const defaultPlaylistId = musicV2MakeId('pl');
            const ids = [];
            const seen = new Set();
            const normalizedSongs = [];
            (music.playlist || []).forEach(raw => {
                const song = musicV2NormalizeSong(raw);
                if (seen.has(song.id)) return;
                seen.add(song.id);
                normalizedSongs.push(song);
                ids.push(song.id);
            });
            music.songs = normalizedSongs;
            music.playlists = [{
                id: defaultPlaylistId,
                title: '默认歌单',
                cover: MUSIC_V2_DEFAULT_COVER,
                songs: ids,
                createdAt: Date.now(),
                updatedAt: Date.now()
            }];
            music.activePlaylistId = defaultPlaylistId;
        }

        const normalizedPlaylists = [];
        const seenPlaylistIds = new Set();
        (music.playlists || []).forEach(rawPl => {
            if (!rawPl || typeof rawPl !== 'object') return;
            const pl = rawPl;
            pl.id = String(pl.id || musicV2MakeId('pl'));
            if (seenPlaylistIds.has(pl.id)) return;
            seenPlaylistIds.add(pl.id);
            pl.title = String(pl.title || '未命名歌单');
            pl.cover = pl.cover || MUSIC_V2_DEFAULT_COVER;
            pl.songs = Array.isArray(pl.songs) ? pl.songs.map(x => String(x)) : [];
            pl.createdAt = pl.createdAt || Date.now();
            pl.updatedAt = pl.updatedAt || Date.now();
            normalizedPlaylists.push(pl);
        });
        music.playlists = normalizedPlaylists;

        if (!music.activePlaylistId || !music.playlists.some(pl => pl.id === music.activePlaylistId)) {
            music.activePlaylistId = music.playlists[0] ? music.playlists[0].id : null;
        }

        const normalizedSongs = [];
        const seenSongIds = new Set();
        (music.songs || []).forEach(raw => {
            const normalized = musicV2NormalizeSong(raw);
            if (seenSongIds.has(normalized.id)) return;
            seenSongIds.add(normalized.id);
            if (!raw || typeof raw !== 'object') {
                normalizedSongs.push(normalized);
                return;
            }
            raw.id = normalized.id;
            raw.title = normalized.title;
            raw.artist = normalized.artist;
            raw.cover = normalized.cover;
            raw.src = normalized.src;
            raw.provider = normalized.provider;
            raw.lyricsData = normalized.lyricsData;
            raw.lyricsFile = normalized.lyricsFile;
            raw.lyricsSource = normalized.lyricsSource;
            raw.lyricsUpdatedAt = normalized.lyricsUpdatedAt;
            raw.addedAt = raw.addedAt || normalized.addedAt;
            normalizedSongs.push(raw);
        });
        music.songs = normalizedSongs;

        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        const validContactIds = new Set(contacts.map(c => String(c && c.id)));
        const normalizedInvites = [];
        const seenInviteIds = new Set();
        (music.listenTogether.invites || []).forEach(raw => {
            if (!raw || typeof raw !== 'object') return;
            const inviteId = String(raw.inviteId || musicV2MakeId('invite'));
            if (seenInviteIds.has(inviteId)) return;
            seenInviteIds.add(inviteId);
            const contactId = String(raw.contactId || '');
            if (!contactId || !validContactIds.has(contactId)) return;
            const statusRaw = String(raw.status || 'pending').toLowerCase();
            const status = statusRaw === 'accepted' || statusRaw === 'rejected' ? statusRaw : 'pending';
            normalizedInvites.push({
                inviteId: inviteId,
                contactId: contactId,
                songId: raw.songId != null ? String(raw.songId) : '',
                songTitle: String(raw.songTitle || ''),
                songArtist: String(raw.songArtist || ''),
                songCover: String(raw.songCover || ''),
                status: status,
                createdAt: Number(raw.createdAt) || Date.now(),
                updatedAt: Number(raw.updatedAt) || Date.now()
            });
        });
        music.listenTogether.invites = normalizedInvites;

        const active = music.listenTogether.activeSession;
        if (active) {
            const contactId = String(active.contactId || '');
            if (!contactId || !validContactIds.has(contactId)) {
                music.listenTogether.activeSession = null;
            } else {
                const normalizedActive = {
                    sessionId: String(active.sessionId || musicV2MakeId('session')),
                    contactId: contactId,
                    inviteId: active.inviteId != null ? String(active.inviteId) : '',
                    songId: active.songId != null ? String(active.songId) : '',
                    startedAt: Number(active.startedAt) || Date.now()
                };
                if (
                    normalizedActive.inviteId &&
                    !music.listenTogether.invites.some(item => String(item.inviteId) === normalizedActive.inviteId && item.status === 'accepted')
                ) {
                    normalizedActive.inviteId = '';
                }
                music.listenTogether.activeSession = normalizedActive;
            }
        }

        musicV2SyncLegacyPlaylist(music);
        return music;
    }

    function musicV2Persist() {
        const music = musicV2EnsureModel();
        musicV2SyncLegacyPlaylist(music);
        if (typeof saveConfig === 'function') saveConfig();
    }

    function musicV2GetPlaylist(playlistId) {
        const music = musicV2EnsureModel();
        return music.playlists.find(pl => String(pl.id) === String(playlistId)) || null;
    }

    function musicV2GetSong(songId) {
        const music = musicV2EnsureModel();
        return music.songs.find(song => String(song.id) === String(songId)) || null;
    }

    function musicV2UpsertSong(rawSong) {
        const music = musicV2EnsureModel();
        const song = musicV2NormalizeSong(rawSong);
        const idx = music.songs.findIndex(item => String(item.id) === song.id);
        if (idx < 0) {
            music.songs.push(song);
            return song;
        }
        const oldSong = music.songs[idx];
        const merged = Object.assign({}, oldSong, song);
        if (!song.src) merged.src = oldSong.src || '';
        if (!song.cover) merged.cover = oldSong.cover || '';
        if (!song.provider) merged.provider = oldSong.provider || '';
        if (!song.lyricsData || song.lyricsData.length === 0) merged.lyricsData = oldSong.lyricsData || [];
        if (!song.lyricsFile) merged.lyricsFile = oldSong.lyricsFile || '';
        if (!song.lyricsSource) merged.lyricsSource = oldSong.lyricsSource || '';
        if (!song.lyricsUpdatedAt) merged.lyricsUpdatedAt = oldSong.lyricsUpdatedAt || 0;
        music.songs[idx] = merged;
        return merged;
    }

    function musicV2GetContactById(contactId) {
        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        return contacts.find(c => String(c && c.id) === String(contactId)) || null;
    }

    function musicV2GetContactDisplayName(contact) {
        if (!contact) return '联系人';
        return String(contact.remark || contact.nickname || contact.name || '联系人');
    }

    function musicV2GetActiveTogetherSession() {
        const music = musicV2EnsureModel();
        if (!music.listenTogether || !music.listenTogether.activeSession) return null;
        return music.listenTogether.activeSession;
    }

    function musicV2GetPendingInviteForContactInternal(contactId) {
        const cid = String(contactId || '');
        if (!cid) return null;
        const music = musicV2EnsureModel();
        const list = Array.isArray(music.listenTogether && music.listenTogether.invites)
            ? music.listenTogether.invites
            : [];
        const matches = list.filter(item => String(item.contactId) === cid && String(item.status) === 'pending');
        if (!matches.length) return null;
        matches.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
        return matches[0];
    }

    function musicV2GetInviteById(inviteId) {
        const sid = String(inviteId || '');
        if (!sid) return null;
        const music = musicV2EnsureModel();
        return (music.listenTogether.invites || []).find(item => String(item.inviteId) === sid) || null;
    }

    function musicV2NormalizeInviteDecision(decision) {
        const text = String(decision || '').trim().toLowerCase();
        if (!text) return '';
        if (/(accept|agree|yes|同意|接受|可以|来吧|一起听)/i.test(text)) return 'accepted';
        if (/(reject|decline|no|refuse|拒绝|不同意|改天|没空|忙|下次)/i.test(text)) return 'rejected';
        return '';
    }

    function musicV2GetCurrentLyricLine(song) {
        if (!song || !Array.isArray(song.lyricsData) || !song.lyricsData.length) return '';
        const audio = document.getElementById('bg-music');
        const currentTime = audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
        let line = '';
        for (let i = 0; i < song.lyricsData.length; i++) {
            const item = song.lyricsData[i];
            if (!item || !Number.isFinite(item.time)) continue;
            if (item.time <= currentTime) line = String(item.text || '');
            else break;
        }
        return String(line || '').trim();
    }

    function musicV2PatchInviteCardInHistory(invite) {
        if (!invite) return;
        const cid = String(invite.contactId || '');
        if (!cid) return;
        const historyMap = window.iphoneSimState && window.iphoneSimState.chatHistory;
        if (!historyMap || !Array.isArray(historyMap[cid])) return;
        const history = historyMap[cid];
        for (let i = history.length - 1; i >= 0; i--) {
            const msg = history[i];
            if (!msg || msg.type !== 'music_listen_invite') continue;
            let payload = null;
            try {
                payload = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
            } catch (error) {
                payload = null;
            }
            if (!payload || String(payload.inviteId || '') !== String(invite.inviteId || '')) continue;
            payload.status = invite.status;
            payload.updatedAt = invite.updatedAt || Date.now();
            payload.songId = invite.songId || payload.songId || '';
            payload.songTitle = invite.songTitle || payload.songTitle || '';
            payload.songArtist = invite.songArtist || payload.songArtist || '';
            payload.songCover = invite.songCover || payload.songCover || '';
            msg.content = JSON.stringify(payload);
        }

        if (String(window.iphoneSimState.currentChatContactId || '') === cid && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(cid, true);
        }
    }

    function musicV2CreateInvite(contactId) {
        const cid = String(contactId || '');
        if (!cid) {
            musicV2Toast('联系人不可用');
            return null;
        }
        const contact = musicV2GetContactById(cid);
        if (!contact) {
            musicV2Toast('联系人不存在');
            return null;
        }
        const song = musicV2GetCurrentSong();
        if (!song) {
            musicV2Toast('请先播放一首歌再邀请');
            return null;
        }
        const pending = musicV2GetPendingInviteForContactInternal(cid);
        if (pending) {
            musicV2Toast('邀请已发送，等待回复');
            return null;
        }

        const music = musicV2EnsureModel();
        const invite = {
            inviteId: musicV2MakeId('invite'),
            contactId: cid,
            songId: String(song.id || ''),
            songTitle: String(song.title || ''),
            songArtist: String(song.artist || ''),
            songCover: String(song.cover || music.cover || MUSIC_V2_DEFAULT_COVER),
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        music.listenTogether.invites.push(invite);
        music.listenTogether.updatedAt = Date.now();

        if (typeof window.sendMessage === 'function') {
            window.sendMessage(JSON.stringify(invite), true, 'music_listen_invite', null, cid);
        }
        musicV2Persist();
        musicV2RenderFriends();
        musicV2Toast('已发送一起听邀请');
        return invite;
    }

    function musicV2HandleInviteDecisionInternal(contactId, inviteId, decision) {
        const cid = String(contactId || '');
        const normalizedDecision = musicV2NormalizeInviteDecision(decision);
        if (!cid || !normalizedDecision) return false;
        const music = musicV2EnsureModel();
        const invite = inviteId
            ? musicV2GetInviteById(inviteId)
            : musicV2GetPendingInviteForContactInternal(cid);
        if (!invite || String(invite.contactId) !== cid || String(invite.status) !== 'pending') return false;

        invite.status = normalizedDecision;
        invite.updatedAt = Date.now();
        music.listenTogether.updatedAt = Date.now();
        musicV2PatchInviteCardInHistory(invite);

        if (normalizedDecision === 'accepted') {
            music.listenTogether.activeSession = {
                sessionId: musicV2MakeId('session'),
                contactId: cid,
                inviteId: String(invite.inviteId),
                songId: String(invite.songId || (music.currentSongId || '')),
                startedAt: Date.now()
            };
        } else if (
            music.listenTogether.activeSession &&
            String(music.listenTogether.activeSession.inviteId || '') === String(invite.inviteId || '')
        ) {
            music.listenTogether.activeSession = null;
        }

        musicV2Persist();
        musicV2RenderFriends();
        musicV2RenderMiniPlayer();
        musicV2RenderSongView();
        if (normalizedDecision === 'accepted') {
            musicV2Toast('对方同意了一起听邀请');
        } else {
            musicV2Toast('对方拒绝了一起听邀请');
        }
        return true;
    }

    function musicV2BuildChatMusicContext(contactId) {
        const cid = String(contactId || '');
        if (!cid) return null;
        const music = musicV2EnsureModel();
        const song = musicV2GetCurrentSong();
        const active = musicV2GetActiveTogetherSession();
        const pendingInvite = musicV2GetPendingInviteForContactInternal(cid);
        const activeContact = active ? musicV2GetContactById(active.contactId) : null;
        return {
            pendingInvite: pendingInvite ? {
                inviteId: String(pendingInvite.inviteId || ''),
                status: String(pendingInvite.status || 'pending'),
                songId: String(pendingInvite.songId || ''),
                songTitle: String(pendingInvite.songTitle || ''),
                songArtist: String(pendingInvite.songArtist || ''),
                createdAt: Number(pendingInvite.createdAt) || 0
            } : null,
            together: {
                active: !!active,
                withCurrentContact: !!(active && String(active.contactId) === cid),
                contactId: active ? String(active.contactId || '') : '',
                contactName: activeContact ? musicV2GetContactDisplayName(activeContact) : ''
            },
            nowPlaying: song ? {
                songId: String(song.id || ''),
                title: String(song.title || ''),
                artist: String(song.artist || ''),
                lyricLine: musicV2GetCurrentLyricLine(song)
            } : null
        };
    }

    function musicV2FormatTime(sec) {
        const safe = Number.isFinite(sec) && sec > 0 ? sec : 0;
        const minutes = Math.floor(safe / 60);
        const seconds = Math.floor(safe % 60);
        return minutes + ':' + String(seconds).padStart(2, '0');
    }

    function musicV2Clamp01(value) {
        if (!Number.isFinite(value)) return 0;
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    async function musicV2FetchJson(url) {
        const response = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP_' + response.status);
        return response.json();
    }

    function musicV2ExtractLyricPayload(data) {
        if (!data || typeof data !== 'object') return '';
        if (typeof data.lyric === 'string') return data.lyric;
        if (data.lrc && typeof data.lrc.lyric === 'string') return data.lrc.lyric;
        if (data.data && typeof data.data.lyric === 'string') return data.data.lyric;
        if (data.data && data.data.lrc && typeof data.data.lrc.lyric === 'string') return data.data.lrc.lyric;
        return '';
    }

    function musicV2ParseLyricText(rawLrc) {
        const source = String(rawLrc || '');
        if (!source.trim()) return [];

        const lines = source.split(/\r?\n/);
        const result = [];
        const timeTagRegex = /\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\]/g;

        lines.forEach(line => {
            timeTagRegex.lastIndex = 0;
            const timedPoints = [];
            let match = null;
            while ((match = timeTagRegex.exec(line)) !== null) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseInt(match[2], 10);
                const msRaw = match[3] ? match[3].padEnd(3, '0').slice(0, 3) : '000';
                const milliseconds = parseInt(msRaw, 10);
                const time = minutes * 60 + seconds + milliseconds / 1000;
                if (Number.isFinite(time)) timedPoints.push(time);
            }
            if (!timedPoints.length) return;
            const text = line.replace(timeTagRegex, '').trim();
            if (!text) return;
            timedPoints.forEach(time => {
                result.push({ time: time, text: text });
            });
        });

        return result.sort((a, b) => a.time - b.time);
    }

    function musicV2IsInstrumentalLyric(lines) {
        if (!Array.isArray(lines) || !lines.length) return false;
        const sample = lines.slice(0, 8).map(line => String(line && line.text ? line.text : '')).join(' ');
        return /(纯音乐|伴奏|inst\.?|instrumental|暂无歌词|没有填词)/i.test(sample);
    }

    async function musicV2FetchLyrics(songId) {
        const url = MUSIC_V2_LYRIC_API + '?id=' + encodeURIComponent(String(songId)) + '&_t=' + Date.now();
        const data = await musicV2FetchJson(url);
        const lyricText = musicV2ExtractLyricPayload(data);
        return {
            lyricText: lyricText,
            lines: musicV2ParseLyricText(lyricText)
        };
    }

    function musicV2RenderProgress(audioInput) {
        const root = musicV2Runtime.root;
        if (!root) return;
        const fill = root.querySelector('.sv-slider-fill');
        const timeSpans = root.querySelectorAll('.sv-times span');
        if (!fill || !timeSpans || timeSpans.length < 2) return;

        const audio = audioInput || document.getElementById('bg-music');
        const current = audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
        const duration = audio && Number.isFinite(audio.duration) ? audio.duration : 0;
        const hasDuration = duration > 0;
        const progress = hasDuration ? musicV2Clamp01(current / duration) : 0;

        fill.style.width = (progress * 100).toFixed(2) + '%';
        timeSpans[0].textContent = musicV2FormatTime(current);
        timeSpans[1].textContent = musicV2FormatTime(hasDuration ? duration : 0);
    }

    function musicV2SeekFromClientX(clientX) {
        const root = musicV2Runtime.root;
        if (!root) return false;
        const slider = root.querySelector('.sv-slider');
        const audio = document.getElementById('bg-music');
        if (!slider || !audio) return false;

        const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
        if (duration <= 0) return false;

        const rect = slider.getBoundingClientRect();
        if (!rect || rect.width <= 0) return false;

        const ratio = musicV2Clamp01((clientX - rect.left) / rect.width);
        const nextTime = duration * ratio;
        audio.currentTime = nextTime;
        musicV2Runtime.lastProgressSec = Math.floor(nextTime * 4);
        musicV2RenderProgress(audio);
        musicV2SyncLyrics(nextTime);
        return true;
    }

    function musicV2BindSeekbar() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const slider = root.querySelector('.sv-slider');
        if (!slider || slider.dataset.musicV2SeekBound === '1') return;
        slider.dataset.musicV2SeekBound = '1';

        let dragging = false;

        const getClientX = function (evt) {
            if (!evt) return null;
            if (evt.touches && evt.touches[0]) return evt.touches[0].clientX;
            if (evt.changedTouches && evt.changedTouches[0]) return evt.changedTouches[0].clientX;
            return evt.clientX;
        };

        const onMove = function (evt) {
            if (!dragging) return;
            const clientX = getClientX(evt);
            if (!Number.isFinite(clientX)) return;
            if (evt.cancelable) evt.preventDefault();
            musicV2SeekFromClientX(clientX);
        };

        const stopDrag = function () {
            if (!dragging) return;
            dragging = false;
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('mouseup', stopDrag);
            window.removeEventListener('touchend', stopDrag);
            window.removeEventListener('touchcancel', stopDrag);
        };

        const startDrag = function (evt) {
            const clientX = getClientX(evt);
            if (!Number.isFinite(clientX)) return;
            dragging = true;
            if (evt.cancelable) evt.preventDefault();
            musicV2SeekFromClientX(clientX);
            window.addEventListener('mousemove', onMove, { passive: false });
            window.addEventListener('touchmove', onMove, { passive: false });
            window.addEventListener('mouseup', stopDrag);
            window.addEventListener('touchend', stopDrag);
            window.addEventListener('touchcancel', stopDrag);
        };

        slider.addEventListener('mousedown', startDrag);
        slider.addEventListener('touchstart', startDrag, { passive: true });
    }

    function musicV2CollectLyricPanels(root) {
        if (!root) return [];
        const panels = root.querySelectorAll('.music-v2-lyrics-panel');
        const groups = [];
        panels.forEach(panel => {
            const stateEl = panel.querySelector('.music-v2-lyrics-state');
            const scrollEl = panel.querySelector('.music-v2-lyrics-scroll');
            const listEl = panel.querySelector('.music-v2-lyrics-list');
            if (!stateEl || !scrollEl || !listEl) return;
            groups.push({ panel, stateEl, scrollEl, listEl });
        });
        return groups;
    }

    function musicV2ApplyLyricsMode() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const isLyrics = musicV2Runtime.lyricsMode === 'lyrics';
        root.querySelectorAll('.sv-art-container, .sv-vinyl-container').forEach(container => {
            container.classList.toggle('fade-out', isLyrics);
        });
        root.querySelectorAll('.music-v2-lyrics-panel').forEach(panel => {
            panel.classList.toggle('active', isLyrics);
        });
    }

    function musicV2PaintLyrics(song) {
        const root = musicV2Runtime.root;
        if (!root) return;
        const groups = musicV2CollectLyricPanels(root);
        if (!groups.length) return;

        const lines = song && Array.isArray(song.lyricsData) ? song.lyricsData : [];
        if (musicV2Runtime.lyricsLoading) {
            groups.forEach(group => {
                group.stateEl.textContent = '歌词加载中...';
                group.stateEl.style.display = 'block';
                group.scrollEl.style.display = 'none';
                group.listEl.innerHTML = '';
            });
            return;
        }

        if (musicV2Runtime.lyricsError) {
            groups.forEach(group => {
                group.stateEl.textContent = musicV2Runtime.lyricsError;
                group.stateEl.style.display = 'block';
                group.scrollEl.style.display = 'none';
                group.listEl.innerHTML = '';
            });
            return;
        }

        if (!song || !lines.length) {
            groups.forEach(group => {
                group.stateEl.textContent = '暂无歌词';
                group.stateEl.style.display = 'block';
                group.scrollEl.style.display = 'none';
                group.listEl.innerHTML = '';
            });
            return;
        }

        if (musicV2IsInstrumentalLyric(lines)) {
            groups.forEach(group => {
                group.stateEl.textContent = '纯音乐，请欣赏';
                group.stateEl.style.display = 'block';
                group.scrollEl.style.display = 'none';
                group.listEl.innerHTML = '';
            });
            return;
        }

        const html = lines.map((line, index) => (
            '<div class="music-v2-lyric-line" data-idx="' + index + '">' + musicV2EscapeHtml(line.text || '') + '</div>'
        )).join('');
        groups.forEach(group => {
            group.stateEl.style.display = 'none';
            group.scrollEl.style.display = 'block';
            group.listEl.innerHTML = html;
        });
    }

    async function musicV2RenderLyrics(song) {
        const targetSong = song || musicV2GetCurrentSong();
        musicV2Runtime.activeLyricIndex = -1;
        if (!targetSong) {
            musicV2Runtime.lyricsLoading = false;
            musicV2Runtime.lyricsError = '';
            musicV2PaintLyrics(null);
            return;
        }

        const sid = String(targetSong.id);
        const currentSong = musicV2GetSong(sid) || targetSong;
        musicV2Runtime.lyricsRenderedSongId = sid;

        if (Array.isArray(currentSong.lyricsData) && currentSong.lyricsData.length > 0) {
            musicV2Runtime.lyricsLoading = false;
            musicV2Runtime.lyricsError = '';
            musicV2PaintLyrics(currentSong);
            const audio = document.getElementById('bg-music');
            musicV2SyncLyrics(audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
            return;
        }

        const knownSource = String(currentSong.lyricsSource || '');
        if (knownSource === 'api-163' || knownSource === 'none') {
            musicV2Runtime.lyricsLoading = false;
            musicV2Runtime.lyricsError = '';
            musicV2PaintLyrics(currentSong);
            return;
        }

        const token = ++musicV2Runtime.lyricsFetchToken;
        musicV2Runtime.lyricsLoading = true;
        musicV2Runtime.lyricsError = '';
        musicV2PaintLyrics(currentSong);

        try {
            const fetched = await musicV2FetchLyrics(sid);
            if (token !== musicV2Runtime.lyricsFetchToken) return;

            const latestSong = musicV2GetSong(sid);
            if (!latestSong) return;
            latestSong.lyricsData = Array.isArray(fetched.lines) ? fetched.lines : [];
            latestSong.lyricsFile = 'net:' + sid;
            latestSong.lyricsSource = 'api-163';
            latestSong.lyricsUpdatedAt = Date.now();
            musicV2Persist();

            musicV2Runtime.lyricsLoading = false;
            musicV2Runtime.lyricsError = '';
            musicV2PaintLyrics(latestSong);
            const audio = document.getElementById('bg-music');
            musicV2SyncLyrics(audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
        } catch (error) {
            if (token !== musicV2Runtime.lyricsFetchToken) return;

            const latestSong = musicV2GetSong(sid);
            if (latestSong) {
                latestSong.lyricsSource = 'none';
                latestSong.lyricsUpdatedAt = Date.now();
                musicV2Persist();
            }
            musicV2Runtime.lyricsLoading = false;
            musicV2Runtime.lyricsError = '歌词加载失败';
            musicV2PaintLyrics(latestSong || currentSong);
        }
    }

    function musicV2SyncLyrics(currentTime) {
        const root = musicV2Runtime.root;
        if (!root) return;
        const song = musicV2GetCurrentSong();
        if (!song || !Array.isArray(song.lyricsData) || song.lyricsData.length === 0) return;
        if (musicV2IsInstrumentalLyric(song.lyricsData)) return;

        const lines = song.lyricsData;
        let low = 0;
        let high = lines.length - 1;
        let activeIndex = -1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            if (Number(currentTime) >= Number(lines[mid].time || 0)) {
                activeIndex = mid;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        if (activeIndex === musicV2Runtime.activeLyricIndex) return;
        musicV2Runtime.activeLyricIndex = activeIndex;

        const groups = musicV2CollectLyricPanels(root);
        if (!groups.length) return;

        groups.forEach(group => {
            const lyricNodes = group.listEl.querySelectorAll('.music-v2-lyric-line');
            if (!lyricNodes.length) return;
            lyricNodes.forEach(node => node.classList.remove('active'));

            if (activeIndex < 0) {
                group.scrollEl.scrollTop = 0;
                return;
            }
            const activeNode = lyricNodes[activeIndex];
            if (!activeNode) return;
            activeNode.classList.add('active');
            const targetTop = Math.max(0, activeNode.offsetTop - group.scrollEl.clientHeight * 0.45);
            group.scrollEl.scrollTo({ top: targetTop, behavior: 'smooth' });
        });
    }

    function musicV2IsRateLimitPayload(data) {
        if (!data || typeof data !== 'object') return false;
        const code = Number(data.code || 0);
        const msg = String(data.msg || data.message || '');
        return code === 405 || msg.indexOf('操作频繁') !== -1;
    }

    function musicV2ParseSearchSongs(data) {
        const arr = data && data.result && Array.isArray(data.result.songs) ? data.result.songs : [];
        return arr.slice(0, 20).map(item => ({
            id: String(item.id),
            title: item.name || '未命名歌曲',
            artist: musicV2PickArtist(item),
            cover: (item.al && item.al.picUrl) || (item.album && item.album.picUrl) || ''
        }));
    }

    async function musicV2SearchWithRetry(baseUrl, keyword, maxRetries) {
        let lastError = null;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const url = baseUrl + '?keywords=' + encodeURIComponent(keyword) + '&_t=' + Date.now();
                const data = await musicV2FetchJson(url);
                if (musicV2IsRateLimitPayload(data)) throw new Error('RATE_LIMIT');
                return musicV2ParseSearchSongs(data);
            } catch (error) {
                lastError = error;
                if (i < maxRetries - 1) await musicV2Sleep(900 + i * 300);
            }
        }
        throw lastError || new Error('SEARCH_FAILED');
    }

    function musicV2ParseMeting(data) {
        const target = Array.isArray(data) ? data[0] : data;
        if (!target || typeof target !== 'object') return null;
        const src = target.url || target.src || '';
        if (!src) return null;
        return {
            src: src,
            cover: target.pic || target.cover || '',
            provider: 'meting'
        };
    }

    function musicV2ParseBugpk(data) {
        if (!data || typeof data !== 'object') return null;
        let target = null;
        if (Array.isArray(data.data) && data.data.length > 0) target = data.data[0];
        else if (data.data && typeof data.data === 'object') target = data.data;
        else if (Array.isArray(data.result) && data.result.length > 0) target = data.result[0];
        else if (data.result && typeof data.result === 'object') target = data.result;
        else target = data;
        if (!target || typeof target !== 'object') return null;
        const src = target.url || target.src || '';
        if (!src) return null;
        return {
            src: src,
            cover: target.pic || target.cover || '',
            provider: 'bugpk'
        };
    }

    async function musicV2ResolveSongSource(songId, force) {
        const music = musicV2EnsureModel();
        const sid = String(songId);
        const song = musicV2GetSong(sid);
        if (!song) throw new Error('song_not_found');

        const cached = music.urlCache[sid];
        if (!force && song.src) return { src: song.src, cover: song.cover || '', provider: song.provider || '' };
        if (!force && cached && cached.src) {
            song.src = cached.src;
            if (!song.cover && cached.cover) song.cover = cached.cover;
            if (!song.provider && cached.provider) song.provider = cached.provider;
            return { src: song.src, cover: song.cover || '', provider: song.provider || '' };
        }

        let resolved = null;
        try {
            const metingUrl = MUSIC_V2_METING_API + '?server=netease&type=song&id=' + encodeURIComponent(sid) + '&_t=' + Date.now();
            resolved = musicV2ParseMeting(await musicV2FetchJson(metingUrl));
        } catch (error) {
            resolved = null;
        }

        if (!resolved) {
            const bugpkUrl = MUSIC_V2_BUGPK_API + '?ids=' + encodeURIComponent(sid) + '&level=standard&type=json&_t=' + Date.now();
            resolved = musicV2ParseBugpk(await musicV2FetchJson(bugpkUrl));
        }

        if (!resolved || !resolved.src) throw new Error('resolve_failed');

        song.src = resolved.src;
        if (resolved.cover) song.cover = resolved.cover;
        if (resolved.provider) song.provider = resolved.provider;
        music.urlCache[sid] = {
            src: resolved.src,
            cover: resolved.cover || song.cover || '',
            provider: resolved.provider || '',
            updatedAt: Date.now()
        };
        return resolved;
    }

    function musicV2GetCurrentSong() {
        const music = musicV2EnsureModel();
        if (!music.currentSongId) return null;
        return musicV2GetSong(music.currentSongId);
    }

    function musicV2Toast(message) {
        const root = musicV2Runtime.root;
        if (!root) return;
        let toast = root.querySelector('#music-v2-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'music-v2-toast';
            toast.className = 'music-v2-toast';
            const body = root.querySelector('.music-v2-body') || root;
            body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('active');
        if (musicV2Runtime.toastTimer) clearTimeout(musicV2Runtime.toastTimer);
        musicV2Runtime.toastTimer = setTimeout(() => {
            toast.classList.remove('active');
        }, 1800);
    }

    function musicV2SyncNowPlaying(song, playing) {
        if (!song) return;
        const music = musicV2EnsureModel();
        music.currentSongId = String(song.id);
        music.title = song.title || '未命名歌曲';
        music.artist = song.artist || '未知歌手';
        music.cover = song.cover || music.cover || MUSIC_V2_DEFAULT_COVER;
        music.src = song.src || '';
        music.playing = !!playing;
        music.lyricsData = Array.isArray(song.lyricsData) ? song.lyricsData : [];
        music.lyricsFile = song.lyricsFile || '';
        if (typeof window.updateMusicUI === 'function') window.updateMusicUI();
    }

    function musicV2UpdatePlayIcons(isNowPlaying) {
        const root = musicV2Runtime.root;
        if (!root) return;
        isPlaying = !!isNowPlaying;
        const vinyl = root.querySelector('#vinyl-record');
        const playBtnIcon = root.querySelector('#play-btn-icon');
        const miniPlayIcon = root.querySelector('#mini-play-icon');
        if (isNowPlaying) {
            if (vinyl) vinyl.classList.remove('paused');
            if (playBtnIcon) playBtnIcon.className = 'ri-pause-fill';
            if (miniPlayIcon) miniPlayIcon.className = 'ri-pause-fill';
        } else {
            if (vinyl) vinyl.classList.add('paused');
            if (playBtnIcon) playBtnIcon.className = 'ri-play-fill';
            if (miniPlayIcon) miniPlayIcon.className = 'ri-play-fill';
        }
    }

    function musicV2RenderMiniPlayer() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const song = musicV2GetCurrentSong();
        const music = musicV2EnsureModel();

        const miniArt = root.querySelector('.mini-player .mp-art');
        const miniTitle = root.querySelector('.mini-player .mp-info h4');
        const miniArtist = root.querySelector('.mini-player .mp-info p');
        if (miniArt) miniArt.src = song && song.cover ? song.cover : (music.cover || MUSIC_V2_DEFAULT_COVER);
        if (miniTitle) miniTitle.textContent = song ? song.title : '未播放';
        if (miniArtist) miniArtist.textContent = song ? (song.artist || '未知歌手') : '添加歌曲开始播放';

        musicV2UpdatePlayIcons(!!music.playing);
    }

    function musicV2RenderSongView() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const song = musicV2GetCurrentSong();
        const music = musicV2EnsureModel();
        const activeSession = musicV2GetActiveTogetherSession();
        const songId = song ? String(song.id) : null;
        const title = root.querySelector('.sv-title');
        const artist = root.querySelector('.sv-artist');
        const artImg = root.querySelector('.sv-art-container img');
        const vinylImg = root.querySelector('#vinyl-record img');
        const songView = root.querySelector('#song-view');
        const headerTitle = root.querySelector('.sv-header-title');
        const togetherAvatars = root.querySelectorAll('.sv-together-avatars img');
        const cover = song && song.cover ? song.cover : (music.cover || MUSIC_V2_DEFAULT_COVER);

        if (songId !== musicV2Runtime.lyricsSongId) {
            musicV2Runtime.lyricsSongId = songId;
            musicV2Runtime.lyricsRenderedSongId = null;
            musicV2Runtime.lyricsMode = 'cover';
            musicV2Runtime.lyricsLoading = false;
            musicV2Runtime.lyricsError = '';
            musicV2Runtime.activeLyricIndex = -1;
        }

        if (title) title.textContent = song ? song.title : (music.title || '未播放');
        if (artist) artist.textContent = song ? (song.artist || '未知歌手') : (music.artist || '未知歌手');
        if (artImg) artImg.src = cover;
        if (vinylImg) vinylImg.src = cover;
        if (songView) songView.classList.toggle('together', !!activeSession);
        if (headerTitle) headerTitle.textContent = activeSession ? 'Listening Together' : 'Now Playing';
        if (togetherAvatars && togetherAvatars.length >= 2) {
            const meAvatar = String((window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.avatar) || MUSIC_V2_DEFAULT_COVER);
            const friend = activeSession ? musicV2GetContactById(activeSession.contactId) : null;
            togetherAvatars[0].src = meAvatar;
            togetherAvatars[1].src = String((friend && friend.avatar) || MUSIC_V2_DEFAULT_COVER);
            togetherAvatars[0].alt = 'Me';
            togetherAvatars[1].alt = friend ? musicV2GetContactDisplayName(friend) : 'Friend';
        }

        musicV2ApplyLyricsMode();
        if (!song) musicV2PaintLyrics(null);
        if (song && (musicV2Runtime.lyricsRenderedSongId !== songId || musicV2Runtime.lyricsMode === 'lyrics')) {
            musicV2RenderLyrics(song);
        }
        musicV2RenderProgress();
        musicV2UpdatePlayIcons(!!music.playing);
        musicV2RenderFriends();
    }

    async function musicV2PlaySong(songId, playlistId) {
        const song = musicV2GetSong(songId);
        const audio = document.getElementById('bg-music');
        if (!song || !audio) {
            musicV2Toast('歌曲不可用');
            return;
        }
        if (playlistId) musicV2Runtime.activePlaylistId = String(playlistId);
        const currentMusic = musicV2EnsureModel();
        const isSongChanged = String(currentMusic.currentSongId || '') !== String(song.id);

        const run = async function (forceResolve) {
            if (!song.src || forceResolve) await musicV2ResolveSongSource(song.id, !!forceResolve);
            if (!song.src) throw new Error('no_src');
            if (audio.src !== song.src) audio.src = song.src;
            await audio.play();
        };

        try {
            await run(false);
        } catch (error1) {
            try {
                await run(true);
            } catch (error2) {
                musicV2Toast('该歌曲暂不可播放，请换一首');
                return;
            }
        }

        musicV2SyncNowPlaying(song, true);
        if (isSongChanged) {
            musicV2Runtime.lastProgressSec = -1;
            musicV2Runtime.lyricsMode = 'cover';
            musicV2Runtime.activeLyricIndex = -1;
            musicV2Runtime.lyricsError = '';
            musicV2Runtime.lyricsLoading = false;
            musicV2ApplyLyricsMode();
        }
        musicV2Persist();
        musicV2RenderProgress(audio);
        musicV2RenderMiniPlayer();
        musicV2RenderSongView();
        musicV2RenderPlaylistPage();
        if (musicV2Runtime.lyricsMode === 'lyrics' || !Array.isArray(song.lyricsData) || song.lyricsData.length === 0) {
            musicV2RenderLyrics(song);
        }
    }

    async function musicV2TogglePlayback() {
        const audio = document.getElementById('bg-music');
        if (!audio) return;
        const currentSong = musicV2GetCurrentSong();
        const music = musicV2EnsureModel();

        if (!currentSong) {
            const playlist = musicV2GetPlaylist(music.activePlaylistId);
            if (playlist && playlist.songs && playlist.songs.length > 0) {
                await musicV2PlaySong(playlist.songs[0], playlist.id);
            } else {
                musicV2Toast('请先添加歌曲');
            }
            return;
        }

        if (audio.paused) {
            try {
                await audio.play();
                musicV2SyncNowPlaying(currentSong, true);
            } catch (error) {
                await musicV2PlaySong(currentSong.id, musicV2Runtime.activePlaylistId || music.activePlaylistId);
                return;
            }
        } else {
            audio.pause();
            musicV2SyncNowPlaying(currentSong, false);
        }

        musicV2Persist();
        musicV2RenderProgress(audio);
        musicV2RenderMiniPlayer();
        musicV2RenderSongView();
        musicV2RenderPlaylistPage();
    }

    window.musicV2FeatureTogglePlay = function () {
        musicV2TogglePlayback();
    };

    window.musicV2GetPendingInviteForContact = function (contactId) {
        const invite = musicV2GetPendingInviteForContactInternal(contactId);
        if (!invite) return null;
        return {
            inviteId: String(invite.inviteId || ''),
            contactId: String(invite.contactId || ''),
            songId: String(invite.songId || ''),
            songTitle: String(invite.songTitle || ''),
            songArtist: String(invite.songArtist || ''),
            songCover: String(invite.songCover || ''),
            status: String(invite.status || 'pending'),
            createdAt: Number(invite.createdAt) || 0,
            updatedAt: Number(invite.updatedAt) || 0
        };
    };

    window.musicV2HandleInviteDecision = function (contactId, inviteId, decision) {
        return musicV2HandleInviteDecisionInternal(contactId, inviteId, decision);
    };

    window.musicV2GetChatMusicContext = function (contactId) {
        return musicV2BuildChatMusicContext(contactId);
    };

    function musicV2GetPlaylistCover(playlist) {
        if (playlist && playlist.cover) return playlist.cover;
        if (playlist && playlist.songs && playlist.songs.length > 0) {
            const song = musicV2GetSong(playlist.songs[0]);
            if (song && song.cover) return song.cover;
        }
        return MUSIC_V2_DEFAULT_COVER;
    }

    function musicV2RenderSearch() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const stateEl = root.querySelector('#music-v2-search-state');
        const listEl = root.querySelector('#music-v2-search-results');
        if (!stateEl || !listEl) return;

        if (musicV2Runtime.loading) {
            stateEl.textContent = '搜索中...';
            listEl.innerHTML = '';
            return;
        }
        if (musicV2Runtime.error) {
            stateEl.textContent = musicV2Runtime.error;
            listEl.innerHTML = '';
            return;
        }
        if (!musicV2Runtime.keyword) {
            stateEl.textContent = '输入歌曲名后按回车搜索';
            listEl.innerHTML = '';
            return;
        }
        if (!musicV2Runtime.results.length) {
            stateEl.textContent = '无结果';
            listEl.innerHTML = '';
            return;
        }

        stateEl.textContent = '找到 ' + musicV2Runtime.results.length + ' 首';
        listEl.innerHTML = musicV2Runtime.results.map(song => (
            '<div class="list-item music-v2-result-item">' +
                '<img class="li-img" src="' + musicV2EscapeHtml(song.cover || MUSIC_V2_DEFAULT_COVER) + '">' +
                '<div class="li-info"><h4>' + musicV2EscapeHtml(song.title) + '</h4><p>' + musicV2EscapeHtml(song.artist) + '</p></div>' +
                '<button class="music-v2-action-btn" data-musicv2-action="add-song" data-song-id="' + musicV2EscapeHtml(song.id) + '">添加到歌单</button>' +
            '</div>'
        )).join('');
    }

    async function musicV2Search(keyword) {
        const kw = String(keyword || '').trim();
        musicV2Runtime.keyword = kw;
        musicV2Runtime.results = [];
        musicV2Runtime.error = '';
        if (!kw) {
            musicV2RenderSearch();
            return;
        }
        musicV2Runtime.loading = true;
        musicV2RenderSearch();
        try {
            try {
                musicV2Runtime.results = await musicV2SearchWithRetry(MUSIC_V2_SEARCH_PRIMARY, kw, 5);
            } catch (error1) {
                musicV2Runtime.results = await musicV2SearchWithRetry(MUSIC_V2_SEARCH_FALLBACK, kw, 5);
            }
            musicV2Runtime.error = '';
        } catch (error) {
            musicV2Runtime.error = '网络繁忙，请稍后重试';
            musicV2Runtime.results = [];
        } finally {
            musicV2Runtime.loading = false;
            musicV2RenderSearch();
        }
    }

    function musicV2RenderFriends() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const activeWrap = root.querySelector('#music-v2-friends-active');
        const listWrap = root.querySelector('#music-v2-friends-list');
        if (!activeWrap || !listWrap) return;

        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        const music = musicV2EnsureModel();
        const activeSession = musicV2GetActiveTogetherSession();
        const currentSong = musicV2GetCurrentSong();

        if (activeSession) {
            const activeContact = musicV2GetContactById(activeSession.contactId);
            const subtitleSong = currentSong
                ? (currentSong.title + ' - ' + (currentSong.artist || '未知歌手'))
                : '一起听进行中';
            const avatarA = String((window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.avatar) || MUSIC_V2_DEFAULT_COVER);
            const avatarB = String((activeContact && activeContact.avatar) || MUSIC_V2_DEFAULT_COVER);
            activeWrap.innerHTML =
                '<div class="sync-active-bar clickable" data-musicv2-action="open-active-session">' +
                    '<div style="display:flex; align-items:center; gap:12px;">' +
                        '<i class="ri-headphone-line" style="font-size:20px;"></i>' +
                        '<div>' +
                            '<div style="font-size:14px; font-weight:600;">正在与 ' + musicV2EscapeHtml(musicV2GetContactDisplayName(activeContact)) + ' 一起听</div>' +
                            '<div style="font-size:12px; opacity:.8;">' + musicV2EscapeHtml(subtitleSong) + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="sync-avatars">' +
                        '<img src="' + musicV2EscapeHtml(avatarA) + '">' +
                        '<img src="' + musicV2EscapeHtml(avatarB) + '">' +
                    '</div>' +
                '</div>';
        } else {
            activeWrap.innerHTML = '';
        }

        if (!contacts.length) {
            listWrap.innerHTML = '<div class="music-v2-empty-note">暂无微信联系人</div>';
            return;
        }

        const rows = contacts.map(contact => {
            const cid = String(contact && contact.id);
            const invite = musicV2GetPendingInviteForContactInternal(cid);
            const isActive = !!(activeSession && String(activeSession.contactId) === cid);
            let statusText = '点击邀请一起听';
            let actionIcon = 'ri-mail-send-line';
            if (isActive) {
                statusText = currentSong
                    ? ('正在一起听：' + currentSong.title + ' - ' + (currentSong.artist || '未知歌手'))
                    : '正在一起听';
                actionIcon = 'ri-headphone-line';
            } else if (invite) {
                statusText = '邀请已发送，等待回复';
                actionIcon = 'ri-time-line';
            }
            return (
                '<div class="friend-row clickable" data-musicv2-action="invite-contact" data-contact-id="' + musicV2EscapeHtml(cid) + '">' +
                    '<img class="fr-avatar" src="' + musicV2EscapeHtml(contact.avatar || MUSIC_V2_DEFAULT_COVER) + '">' +
                    '<div class="fr-info">' +
                        '<h4>' + musicV2EscapeHtml(musicV2GetContactDisplayName(contact)) + '</h4>' +
                        '<p>' + musicV2EscapeHtml(statusText) + '</p>' +
                    '</div>' +
                    '<div class="fr-action"><i class="' + actionIcon + '"></i></div>' +
                '</div>'
            );
        });
        listWrap.innerHTML = rows.join('');
    }

    function musicV2RenderLibrary() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const list = root.querySelector('#music-v2-library-list');
        if (!list) return;
        const music = musicV2EnsureModel();

        list.innerHTML = music.playlists.map(pl => {
            const count = (pl.songs || []).length;
            return (
                '<div class="list-item clickable" data-musicv2-action="open-playlist" data-playlist-id="' + musicV2EscapeHtml(pl.id) + '">' +
                    '<img class="li-img" src="' + musicV2EscapeHtml(musicV2GetPlaylistCover(pl)) + '">' +
                    '<div class="li-info"><h4 style="font-size:18px;">' + musicV2EscapeHtml(pl.title) + '</h4><p>Playlist • ' + count + ' tracks</p></div>' +
                    '<i class="ri-arrow-right-s-line li-action"></i>' +
                '</div>'
            );
        }).join('');
    }

    function musicV2RenderPlaylistPage() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const content = root.querySelector('#music-v2-playlist-page-content');
        const playlist = musicV2GetPlaylist(musicV2Runtime.activePlaylistId);
        if (!content || !playlist) return;

        const songs = (playlist.songs || []).map(id => musicV2GetSong(id)).filter(Boolean);
        const listHtml = songs.map((song, idx) => (
            '<div class="list-item clickable" data-musicv2-action="play-song" data-song-id="' + musicV2EscapeHtml(song.id) + '">' +
                '<div class="li-num">' + (idx + 1) + '</div>' +
                '<div class="li-info"><h4>' + musicV2EscapeHtml(song.title) + '</h4><p>' + musicV2EscapeHtml(song.artist) + '</p></div>' +
                '<button class="music-v2-action-btn" data-musicv2-action="play-song" data-song-id="' + musicV2EscapeHtml(song.id) + '">播放</button>' +
            '</div>'
        )).join('');

        content.innerHTML =
            '<div class="pl-hero">' +
                '<img src="' + musicV2EscapeHtml(musicV2GetPlaylistCover(playlist)) + '">' +
                '<h2>' + musicV2EscapeHtml(playlist.title) + '</h2>' +
                '<p>Playlist • ' + songs.length + ' tracks</p>' +
                '<div class="pl-actions">' +
                    '<div class="pl-btn clickable" data-musicv2-action="play-first"><i class="ri-play-fill" style="font-size:20px;"></i> Play</div>' +
                '</div>' +
            '</div>' +
            (songs.length ? listHtml : '<div class="music-v2-empty-note">歌单暂无歌曲</div>');
    }

    function musicV2RenderPicker() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const body = root.querySelector('#music-v2-picker-list');
        if (!body) return;
        const music = musicV2EnsureModel();
        body.innerHTML = music.playlists.map(pl => (
            '<button class="music-v2-picker-item" data-musicv2-action="choose-playlist" data-playlist-id="' + musicV2EscapeHtml(pl.id) + '">' +
                '<img src="' + musicV2EscapeHtml(musicV2GetPlaylistCover(pl)) + '">' +
                '<div><strong>' + musicV2EscapeHtml(pl.title) + '</strong><span>' + ((pl.songs || []).length) + ' 首</span></div>' +
            '</button>'
        )).join('');
    }

    function musicV2ShowPicker(song) {
        const root = musicV2Runtime.root;
        if (!root) return;
        musicV2Runtime.pendingSong = song || null;
        musicV2RenderPicker();
        const mask = root.querySelector('#music-v2-picker-mask');
        if (mask) mask.classList.add('active');
    }

    function musicV2HidePicker() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const mask = root.querySelector('#music-v2-picker-mask');
        if (mask) mask.classList.remove('active');
        musicV2Runtime.pendingSong = null;
    }

    function musicV2ShowCreateModal() {
        const root = musicV2Runtime.root;
        if (!root) return;
        musicV2Runtime.coverDraft = '';
        const titleInput = root.querySelector('#music-v2-create-title');
        const fileInput = root.querySelector('#music-v2-create-cover-file');
        const preview = root.querySelector('#music-v2-create-cover-preview');
        if (titleInput) titleInput.value = '';
        if (fileInput) fileInput.value = '';
        if (preview) preview.src = MUSIC_V2_DEFAULT_COVER;
        const mask = root.querySelector('#music-v2-create-mask');
        if (mask) mask.classList.add('active');
    }

    function musicV2HideCreateModal() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const mask = root.querySelector('#music-v2-create-mask');
        if (mask) mask.classList.remove('active');
    }

    async function musicV2ReadDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target ? e.target.result : '');
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function musicV2AddSongToPlaylist(rawSong, playlistId) {
        const song = musicV2UpsertSong(rawSong);
        const sid = String(song.id);

        let playlist = musicV2GetPlaylist(playlistId);
        if (!playlist) {
            musicV2Toast('歌单不存在');
            return;
        }

        if (!Array.isArray(playlist.songs)) playlist.songs = [];
        if (playlist.songs.includes(sid)) {
            musicV2Toast('已在歌单中');
            return;
        }
        try {
            await musicV2ResolveSongSource(sid, false);
        } catch (error) {
            // add flow should continue even if pre-resolve fails
        }
        // Reacquire playlist to avoid stale object references after normalization calls.
        playlist = musicV2GetPlaylist(playlistId);
        if (!playlist) {
            musicV2Toast('歌单不存在');
            return;
        }
        if (!Array.isArray(playlist.songs)) playlist.songs = [];
        if (!playlist.songs.includes(sid)) playlist.songs.push(sid);
        playlist.updatedAt = Date.now();
        if (!playlist.cover && song.cover) playlist.cover = song.cover;

        const music = musicV2EnsureModel();
        music.activePlaylistId = playlist.id;
        musicV2Runtime.activePlaylistId = playlist.id;

        musicV2Persist();
        musicV2RenderLibrary();
        musicV2RenderPlaylistPage();
        window.musicV2OpenPage('page-playlist');
        musicV2Toast('已添加到歌单');
    }

    function musicV2BindAudio() {
        if (musicV2Runtime.audioBound) return;
        const audio = document.getElementById('bg-music');
        if (!audio) return;
        musicV2Runtime.audioBound = true;

        audio.addEventListener('loadedmetadata', () => {
            musicV2RenderProgress(audio);
            musicV2SyncLyrics(audio.currentTime || 0);
        });

        audio.addEventListener('durationchange', () => {
            musicV2RenderProgress(audio);
        });

        audio.addEventListener('seeking', () => {
            musicV2RenderProgress(audio);
            musicV2SyncLyrics(audio.currentTime || 0);
        });

        audio.addEventListener('seeked', () => {
            musicV2RenderProgress(audio);
            musicV2SyncLyrics(audio.currentTime || 0);
        });

        audio.addEventListener('timeupdate', () => {
            const progressTick = Math.floor((audio.currentTime || 0) * 4);
            if (progressTick !== musicV2Runtime.lastProgressSec) {
                musicV2Runtime.lastProgressSec = progressTick;
                musicV2RenderProgress(audio);
            }
            musicV2SyncLyrics(audio.currentTime || 0);
        });

        audio.addEventListener('play', () => {
            const song = musicV2GetCurrentSong();
            if (!song) return;
            musicV2SyncNowPlaying(song, true);
            musicV2RenderProgress(audio);
            musicV2RenderMiniPlayer();
            musicV2RenderSongView();
        });

        audio.addEventListener('pause', () => {
            const song = musicV2GetCurrentSong();
            if (!song) return;
            musicV2SyncNowPlaying(song, false);
            musicV2RenderProgress(audio);
            musicV2RenderMiniPlayer();
            musicV2RenderSongView();
        });

        audio.addEventListener('ended', () => {
            musicV2RenderProgress(audio);
            const playlist = musicV2GetPlaylist(musicV2Runtime.activePlaylistId);
            const music = musicV2EnsureModel();
            if (!playlist || !music.currentSongId) {
                music.playing = false;
                musicV2RenderMiniPlayer();
                musicV2RenderSongView();
                return;
            }
            const idx = (playlist.songs || []).findIndex(id => String(id) === String(music.currentSongId));
            if (idx >= 0 && idx < playlist.songs.length - 1) {
                musicV2PlaySong(playlist.songs[idx + 1], playlist.id);
            } else {
                music.playing = false;
                musicV2Runtime.lyricsMode = 'cover';
                musicV2Runtime.activeLyricIndex = -1;
                musicV2ApplyLyricsMode();
                musicV2Persist();
                musicV2RenderMiniPlayer();
                musicV2RenderSongView();
            }
        });
    }

    function musicV2HandleClick(event) {
        const root = musicV2Runtime.root;
        if (!root) return;
        const target = event.target;
        const actionNode = target.closest('[data-musicv2-action]');
        const action = actionNode ? actionNode.getAttribute('data-musicv2-action') : '';

        if (action === 'toggle-lyrics') {
            const song = musicV2GetCurrentSong();
            if (!song) {
                musicV2Toast('暂无播放歌曲');
                return;
            }
            if (musicV2Runtime.lyricsMode === 'lyrics') {
                musicV2Runtime.lyricsMode = 'cover';
                musicV2ApplyLyricsMode();
                return;
            }
            musicV2Runtime.lyricsMode = 'lyrics';
            musicV2ApplyLyricsMode();
            musicV2RenderLyrics(song);
            const audio = document.getElementById('bg-music');
            musicV2SyncLyrics(audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
            return;
        }

        if (action === 'search-now') {
            const input = root.querySelector('#music-v2-search-input');
            musicV2Search(input ? input.value : '');
            return;
        }
        if (action === 'open-active-session') {
            const active = musicV2GetActiveTogetherSession();
            if (!active) {
                musicV2Toast('当前没有一起听会话');
                return;
            }
            window.musicV2ToggleSongView('together');
            return;
        }
        if (action === 'invite-contact') {
            const contactId = actionNode.getAttribute('data-contact-id');
            if (!contactId) return;
            const active = musicV2GetActiveTogetherSession();
            if (active && String(active.contactId) === String(contactId)) {
                window.musicV2ToggleSongView('together');
                return;
            }
            musicV2CreateInvite(contactId);
            return;
        }
        if (action === 'add-song') {
            const songId = actionNode.getAttribute('data-song-id');
            const song = musicV2Runtime.results.find(item => String(item.id) === String(songId));
            if (!song) {
                musicV2Toast('歌曲信息已失效，请重试');
                return;
            }
            musicV2ShowPicker(song);
            return;
        }
        if (action === 'choose-playlist') {
            const playlistId = actionNode.getAttribute('data-playlist-id');
            const pending = musicV2Runtime.pendingSong;
            if (!pending || !playlistId) return;
            musicV2AddSongToPlaylist(pending, playlistId).then(() => {
                musicV2HidePicker();
            });
            return;
        }
        if (action === 'open-create') {
            musicV2ShowCreateModal();
            return;
        }
        if (action === 'close-picker') {
            musicV2HidePicker();
            return;
        }
        if (action === 'close-create') {
            musicV2HideCreateModal();
            return;
        }
        if (action === 'create-playlist') {
            const titleInput = root.querySelector('#music-v2-create-title');
            const title = titleInput ? titleInput.value.trim() : '';
            if (!title) {
                musicV2Toast('请输入歌单标题');
                return;
            }
            const music = musicV2EnsureModel();
            const playlist = {
                id: musicV2MakeId('pl'),
                title: title,
                cover: musicV2Runtime.coverDraft || MUSIC_V2_DEFAULT_COVER,
                songs: [],
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            music.playlists.unshift(playlist);
            music.activePlaylistId = playlist.id;
            musicV2Runtime.activePlaylistId = playlist.id;
            musicV2Persist();
            musicV2RenderLibrary();
            musicV2RenderPicker();
            musicV2HideCreateModal();
            musicV2Toast('歌单已创建');
            return;
        }
        if (action === 'open-playlist') {
            const playlistId = actionNode.getAttribute('data-playlist-id');
            if (!playlistId) return;
            musicV2Runtime.activePlaylistId = String(playlistId);
            const music = musicV2EnsureModel();
            music.activePlaylistId = musicV2Runtime.activePlaylistId;
            musicV2Persist();
            musicV2RenderLibrary();
            musicV2RenderPlaylistPage();
            window.musicV2OpenPage('page-playlist');
            return;
        }
        if (action === 'close-page-playlist') {
            window.musicV2ClosePage('page-playlist');
            return;
        }
        if (action === 'play-song') {
            const songId = actionNode.getAttribute('data-song-id');
            if (!songId) return;
            musicV2PlaySong(songId, musicV2Runtime.activePlaylistId);
            const active = musicV2GetActiveTogetherSession();
            window.musicV2ToggleSongView(active ? 'together' : 'solo');
            return;
        }
        if (action === 'play-first') {
            const playlist = musicV2GetPlaylist(musicV2Runtime.activePlaylistId);
            if (!playlist || !playlist.songs || !playlist.songs.length) {
                musicV2Toast('歌单暂无歌曲');
                return;
            }
            musicV2PlaySong(playlist.songs[0], playlist.id);
            const active = musicV2GetActiveTogetherSession();
            window.musicV2ToggleSongView(active ? 'together' : 'solo');
            return;
        }
    }

    function musicV2InjectFeatureStyles(root) {
        if (root.querySelector('#music-v2-feature-style')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'music-v2-feature-style';
        styleEl.textContent = `
            .music-v2-search-state { font-size: 12px; color: var(--text-gray); margin: 0 4px 10px; }
            .music-v2-search-results { display: flex; flex-direction: column; gap: 10px; }
            .music-v2-result-item { background: rgba(255,255,255,0.72); border-radius: 16px; padding: 10px; margin-bottom: 0; }
            .music-v2-action-btn {
                border: none; background: #1c1c1e; color: #fff; border-radius: 14px; padding: 8px 12px;
                font-size: 12px; font-weight: 600; white-space: nowrap;
            }
            .music-v2-empty-note { text-align: center; color: var(--text-gray); font-size: 13px; padding: 30px 10px; }
            .music-v2-toast {
                position: absolute; left: 50%; transform: translateX(-50%); bottom: 98px; z-index: 360;
                background: rgba(28,28,30,0.95); color: #fff; border-radius: 999px; padding: 8px 14px;
                font-size: 12px; opacity: 0; pointer-events: none; transition: opacity .2s ease;
            }
            .music-v2-toast.active { opacity: 1; }
            .music-v2-modal-mask {
                position: absolute; inset: 0; z-index: 320; background: rgba(0,0,0,0.35);
                display: none; align-items: flex-end; justify-content: center; padding: 12px;
            }
            .music-v2-modal-mask.active { display: flex; }
            .music-v2-modal-card {
                width: 100%; max-width: 500px; max-height: 72%; overflow: auto;
                background: rgba(255,255,255,0.96); border-radius: 22px; padding: 12px;
                box-shadow: 0 14px 32px rgba(0,0,0,0.18);
            }
            .music-v2-modal-head {
                display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
                font-size: 16px; font-weight: 700;
            }
            .music-v2-modal-btn {
                border: none; background: #e5e5ea; color: #000; border-radius: 12px; padding: 7px 10px; font-size: 12px;
            }
            .music-v2-picker-item {
                width: 100%; border: none; background: #fff; border-radius: 14px; padding: 8px;
                display: flex; align-items: center; gap: 10px; margin-bottom: 8px; text-align: left;
            }
            .music-v2-picker-item img { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; }
            .music-v2-picker-item strong { display: block; font-size: 14px; }
            .music-v2-picker-item span { color: var(--text-gray); font-size: 12px; }
            .music-v2-create-row { margin-bottom: 10px; }
            .music-v2-create-row label { display: block; font-size: 12px; color: var(--text-gray); margin-bottom: 6px; }
            .music-v2-create-row input[type="text"] {
                width: 100%; border: 1px solid #d1d1d6; border-radius: 12px; padding: 10px; font-size: 14px;
            }
            .music-v2-cover-row { display: flex; align-items: center; gap: 10px; }
            .music-v2-cover-row img { width: 52px; height: 52px; border-radius: 12px; object-fit: cover; background: #f0f0f0; }
            #music-v2-friends-list { display: flex; flex-direction: column; gap: 10px; }
            #music-v2-friends-active { margin-bottom: 10px; }
            .sv-slider { cursor: pointer; touch-action: none; }
            .sv-art-container,
            .sv-vinyl-container {
                position: relative;
                overflow: hidden;
                transition: opacity .28s ease, transform .28s ease, box-shadow .28s ease;
            }
            .sv-art-container img {
                transition: opacity .28s ease, transform .28s ease;
            }
            .sv-vinyl-container .sv-vinyl {
                transition: opacity .28s ease, transform .28s ease, box-shadow .28s ease;
            }
            .sv-vinyl {
                box-shadow: none !important;
                background:
                    radial-gradient(circle at center, #121212 0%, #060606 58%, #000 100%),
                    repeating-radial-gradient(
                        circle at center,
                        rgba(255,255,255,0.10) 0px,
                        rgba(255,255,255,0.10) 1px,
                        rgba(0,0,0,0) 2px,
                        rgba(0,0,0,0) 8px
                    ) !important;
            }
            .sv-vinyl::before {
                border-color: rgba(255,255,255,0.10) !important;
                box-shadow:
                    inset 0 0 0 4px #000,
                    inset 0 0 0 5px rgba(255,255,255,0.10),
                    inset 0 0 0 10px #000,
                    inset 0 0 0 11px rgba(255,255,255,0.10),
                    inset 0 0 0 18px #000,
                    inset 0 0 0 19px rgba(255,255,255,0.10) !important;
            }
            .sv-vinyl-container .sv-vinyl::before,
            .sv-vinyl-container .sv-vinyl::after {
                transition: opacity .28s ease;
            }
            .sv-art-container.fade-out {
                box-shadow: 0 14px 34px rgba(0,0,0,0);
            }
            .sv-art-container.fade-out img {
                opacity: 0.08;
                transform: scale(1.04);
            }
            .sv-vinyl-container.fade-out .sv-vinyl {
                opacity: 0;
                transform: scale(1.04);
                box-shadow: 0 10px 20px rgba(0,0,0,0);
            }
            .sv-vinyl-container.fade-out .sv-vinyl::before,
            .sv-vinyl-container.fade-out .sv-vinyl::after {
                opacity: 0;
            }
            .music-v2-lyrics-panel {
                position: absolute;
                inset: 0;
                display: flex;
                flex-direction: column;
                background: #ffffff;
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border-radius: 28px;
                opacity: 0;
                pointer-events: none;
                transition: opacity .24s ease;
                padding: 20px 16px;
                z-index: 6;
            }
            .music-v2-lyrics-panel.active {
                opacity: 1;
                pointer-events: auto;
            }
            .sv-vinyl-container .music-v2-lyrics-panel {
                border-radius: 50%;
                padding: 22px 18px;
                backdrop-filter: none;
                -webkit-backdrop-filter: none;
                box-shadow: none;
            }
            .music-v2-lyrics-state {
                margin: auto 0;
                text-align: center;
                color: var(--text-gray);
                font-size: 14px;
                line-height: 1.6;
                padding: 0 12px;
            }
            .music-v2-lyrics-scroll {
                display: none;
                flex: 1;
                overflow-y: auto;
                scrollbar-width: none;
                scroll-behavior: smooth;
                padding: 20px 8px 28px;
            }
            .music-v2-lyrics-scroll::-webkit-scrollbar { display: none; }
            .music-v2-lyrics-list { display: flex; flex-direction: column; gap: 10px; min-height: 100%; }
            .music-v2-lyric-line {
                color: #7f7f84;
                font-size: 15px;
                line-height: 1.5;
                text-align: center;
                transition: color .22s ease, transform .22s ease, opacity .22s ease;
                opacity: 0.92;
                transform: scale(0.98);
                word-break: break-word;
            }
            .music-v2-lyric-line.active {
                color: #111111;
                font-size: 17px;
                font-weight: 700;
                opacity: 1;
                transform: scale(1);
            }
        `;
        root.appendChild(styleEl);
    }

    function musicV2EnsureFeatureNodes(root) {
        const body = root.querySelector('.music-v2-body') || root;
        const songView = root.querySelector('#song-view');
        if (songView) {
            const ensureLyricsPanel = function (container, panelId, stateId, scrollId, listId) {
                if (!container) return;
                container.classList.add('clickable');
                container.setAttribute('data-musicv2-action', 'toggle-lyrics');
                if (container.querySelector('.music-v2-lyrics-panel')) return;
                const panel = document.createElement('div');
                panel.id = panelId;
                panel.className = 'music-v2-lyrics-panel';
                panel.setAttribute('data-musicv2-action', 'toggle-lyrics');
                panel.innerHTML =
                    '<div id="' + stateId + '" class="music-v2-lyrics-state">点击封面查看歌词</div>' +
                    '<div id="' + scrollId + '" class="music-v2-lyrics-scroll">' +
                        '<div id="' + listId + '" class="music-v2-lyrics-list"></div>' +
                    '</div>';
                container.appendChild(panel);
            };
            const artContainer = songView.querySelector('.sv-art-container');
            const vinylContainer = songView.querySelector('.sv-vinyl-container');
            ensureLyricsPanel(artContainer, 'music-v2-lyrics-panel', 'music-v2-lyrics-state', 'music-v2-lyrics-scroll', 'music-v2-lyrics-list');
            ensureLyricsPanel(vinylContainer, 'music-v2-lyrics-panel-together', 'music-v2-lyrics-state-together', 'music-v2-lyrics-scroll-together', 'music-v2-lyrics-list-together');
        }

        const exploreView = root.querySelector('#view-explore');
        if (exploreView) {
            const searchBox = exploreView.querySelector('.search-box');
            const input = searchBox ? searchBox.querySelector('input') : null;
            const icon = searchBox ? searchBox.querySelector('.ri-search-line') : null;
            if (input) {
                input.id = 'music-v2-search-input';
                input.placeholder = 'Search songs, artists...';
                input.removeAttribute('readonly');
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') musicV2Search(input.value || '');
                });
            }
            if (icon && !icon.dataset.musicV2SearchBound) {
                icon.dataset.musicV2SearchBound = '1';
                icon.classList.add('clickable');
                icon.addEventListener('click', () => musicV2Search(input ? input.value : ''));
            }
            if (!root.querySelector('#music-v2-search-state')) {
                const stateEl = document.createElement('div');
                stateEl.id = 'music-v2-search-state';
                stateEl.className = 'music-v2-search-state';
                stateEl.textContent = '输入歌曲名后按回车搜索';
                const listEl = document.createElement('div');
                listEl.id = 'music-v2-search-results';
                listEl.className = 'music-v2-search-results';
                if (searchBox) {
                    searchBox.insertAdjacentElement('afterend', stateEl);
                    stateEl.insertAdjacentElement('afterend', listEl);
                } else {
                    exploreView.appendChild(stateEl);
                    exploreView.appendChild(listEl);
                }
            }
        }

        const friendsView = root.querySelector('#view-friends');
        if (friendsView) {
            friendsView.innerHTML =
                '<div class="sec-title" style="font-size:28px; font-weight:800;">Friends</div>' +
                '<div id="music-v2-friends-active"></div>' +
                '<div id="music-v2-friends-list"></div>';
        }

        const libraryView = root.querySelector('#view-library');
        if (libraryView) {
            libraryView.innerHTML =
                '<div class="sec-title" style="font-size: 28px; font-weight: 800; display:flex; justify-content:space-between; align-items:center;">' +
                    'Library' +
                    '<button class="music-v2-action-btn" data-musicv2-action="open-create">新建歌单</button>' +
                '</div>' +
                '<div id="music-v2-library-list"></div>';
        }

        const playlistPage = root.querySelector('#page-playlist');
        if (playlistPage) {
            playlistPage.innerHTML =
                '<div class="page-header clickable" data-musicv2-action="close-page-playlist"><i class="ri-arrow-left-line"></i></div>' +
                '<div class="page-content" id="music-v2-playlist-page-content"></div>';
        }

        if (!root.querySelector('#music-v2-picker-mask')) {
            const picker = document.createElement('div');
            picker.id = 'music-v2-picker-mask';
            picker.className = 'music-v2-modal-mask';
            picker.innerHTML =
                '<div class="music-v2-modal-card">' +
                    '<div class="music-v2-modal-head"><span>选择歌单</span><button class="music-v2-modal-btn" data-musicv2-action="close-picker">关闭</button></div>' +
                    '<div id="music-v2-picker-list"></div>' +
                    '<button class="music-v2-action-btn" data-musicv2-action="open-create" style="width:100%; margin-top:6px;">新建歌单</button>' +
                '</div>';
            body.appendChild(picker);
        }

        if (!root.querySelector('#music-v2-create-mask')) {
            const create = document.createElement('div');
            create.id = 'music-v2-create-mask';
            create.className = 'music-v2-modal-mask';
            create.innerHTML =
                '<div class="music-v2-modal-card">' +
                    '<div class="music-v2-modal-head"><span>新建歌单</span><button class="music-v2-modal-btn" data-musicv2-action="close-create">关闭</button></div>' +
                    '<div class="music-v2-create-row"><label>歌单标题</label><input id="music-v2-create-title" type="text" placeholder="请输入歌单标题"></div>' +
                    '<div class="music-v2-create-row"><label>封面（可选）</label><div class="music-v2-cover-row"><img id="music-v2-create-cover-preview" src="' + MUSIC_V2_DEFAULT_COVER + '"><input id="music-v2-create-cover-file" type="file" accept="image/*"></div></div>' +
                    '<button class="music-v2-action-btn" data-musicv2-action="create-playlist" style="width:100%;">创建</button>' +
                '</div>';
            body.appendChild(create);
        }

        const createFile = root.querySelector('#music-v2-create-cover-file');
        if (createFile && !createFile.dataset.musicV2Bound) {
            createFile.dataset.musicV2Bound = '1';
            createFile.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) {
                    musicV2Runtime.coverDraft = '';
                    return;
                }
                try {
                    musicV2Runtime.coverDraft = String(await musicV2ReadDataUrl(file) || '');
                    const preview = root.querySelector('#music-v2-create-cover-preview');
                    if (preview) preview.src = musicV2Runtime.coverDraft || MUSIC_V2_DEFAULT_COVER;
                } catch (error) {
                    musicV2Runtime.coverDraft = '';
                    musicV2Toast('封面读取失败');
                }
            });
        }
    }

    function musicV2InitFeatures(root) {
        if (!root || musicV2Runtime.initialized) return;
        musicV2Runtime.initialized = true;
        musicV2Runtime.root = root;
        const music = musicV2EnsureModel();
        musicV2Runtime.activePlaylistId = music.activePlaylistId;

        musicV2InjectFeatureStyles(root);
        musicV2EnsureFeatureNodes(root);
        musicV2BindAudio();
        musicV2BindSeekbar();

        root.addEventListener('click', musicV2HandleClick);

        musicV2RenderSearch();
        musicV2RenderFriends();
        musicV2RenderLibrary();
        musicV2RenderPlaylistPage();
        musicV2RenderMiniPlayer();
        musicV2RenderSongView();
    }

    function transformMarkup(rawMarkup) {
        return rawMarkup
            .replaceAll('switchNav(', 'musicV2SwitchNav(')
            .replaceAll('toggleSongView(', 'musicV2ToggleSongView(')
            .replaceAll('togglePlay(', 'musicV2TogglePlay(')
            .replaceAll('openPage(', 'musicV2OpenPage(')
            .replaceAll('closePage(', 'musicV2ClosePage(')
            .replaceAll('showInvite(', 'musicV2ShowInvite(')
            .replaceAll('closeInvite(', 'musicV2CloseInvite(')
            .replaceAll('acceptInvite(', 'musicV2AcceptInvite(')
            .replaceAll('document.querySelectorAll', 'window.musicV2GetRoot().querySelectorAll');
    }

    function normalizeStyle(rawStyle) {
        return rawStyle
            .replace(/:root/g, '#music-app')
            .replace(/\bbody\b/g, '.music-v2-body');
    }

    function initMusicAppScreen() {
        const appScreen = document.getElementById('music-app');
        const host = document.getElementById('music-app-shadow-host');
        if (!appScreen || !host) return;

        if (host.dataset.initialized === '1') return;
        host.dataset.initialized = '1';

        const root = host;
        const markup = transformMarkup(MUSIC_V2_MARKUP_RAW);
        const style = normalizeStyle(MUSIC_V2_STYLE_RAW);

        root.innerHTML = `
            <style>
                .music-v2-body {
                    width: 100%;
                    height: 100%;
                }
                ${style}
                .phone {
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 0 !important;
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                }
                .floating-bottom {
                    bottom: max(8px, calc(env(safe-area-inset-bottom, 0px) - 14px)) !important;
                }
            </style>
            <div class="music-v2-body">${markup}</div>
        `;

        const profilePic = root.querySelector('.profile-pic');
        if (profilePic && !profilePic.dataset.exitBound) {
            profilePic.dataset.exitBound = '1';
            profilePic.addEventListener('click', (e) => {
                e.stopPropagation();
                appScreen.classList.add('hidden');
            });
        }

        musicV2InitFeatures(root);
    }

    if (window.appInitFunctions) {
        window.appInitFunctions.push(initMusicAppScreen);
    } else {
        document.addEventListener('DOMContentLoaded', initMusicAppScreen);
    }
})();
