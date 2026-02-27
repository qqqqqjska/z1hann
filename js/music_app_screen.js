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
            display: flex; align-items: center; gap: 12px;
            z-index: 300; transition: top 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            border: 1px solid rgba(255,255,255,0.8);
        }
        .invite-popup.active { top: 50px; }
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
            margin-bottom: 16px;
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
    };

    window.musicV2ToggleSongView = function (mode = null) {
        const root = getMusicRoot();
        if (!root) return;

        const sv = root.querySelector('#song-view');
        const headerTitle = root.querySelector('.sv-header-title');
        if (!sv) return;

        if (mode) {
            if (mode === 'together') {
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
                    bottom: calc(16px + env(safe-area-inset-bottom, 0px)) !important;
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
    }

    if (window.appInitFunctions) {
        window.appInitFunctions.push(initMusicAppScreen);
    } else {
        document.addEventListener('DOMContentLoaded', initMusicAppScreen);
    }
})();
