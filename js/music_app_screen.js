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
            background-color: var(--app-bg, #f5f5f7);
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
            padding: 56px 24px 10px;
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
            background: var(--glass-bg, rgba(255, 255, 255, 0.88));
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border, rgba(255, 255, 255, 0.8));
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
            background: var(--nav-bg, #ffffff);
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
            background: var(--app-bg, #f5f5f7); z-index: 150;
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

        if (viewId !== 'view-library' && musicV2Runtime.librarySelectionMode) {
            musicV2ExitLibrarySelectionMode();
            musicV2RenderLibrary();
        }

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
    const MUSIC_V2_DEFAULT_BACK_BUTTON_IMAGE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
    const MUSIC_V2_API_BASE = 'https://zm.armoe.cn';
    const MUSIC_V2_METING_API_BASE = 'https://api.qijieya.cn/meting/';
    const MUSIC_V2_API_BASES = [
        MUSIC_V2_API_BASE,
        'https://ncm.zhenxin.me',
        'https://ncmapi.btwoa.com',
        'http://110.42.255.106:3000',
        'https://www.musicapi.cn'
    ];
    const MUSIC_V2_API_TIMEOUT_MS = 4500;
    const MUSIC_V2_IMPORT_PAGE_LIMIT = 100;
    const MUSIC_V2_IMPORT_MAX_PAGES = 60;
    const MUSIC_V2_PLAY_COMPLETE_RATIO_THRESHOLD = 0.9;

    const musicV2Runtime = {
        initialized: false,
        root: null,
        preferredApiBase: MUSIC_V2_API_BASES[0],
        keyword: '',
        loading: false,
        error: '',
        results: [],
        pendingSong: null,
        pendingSongs: [],
        selectedResultIds: new Set(),
        createFromPicker: false,
        playlistCoverTargetId: '',
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
        lyricsRenderedSongId: null,
        togetherSummary: null,
        importLoading: false,
        importDetailFallback: false,
        importDraft: '',
        playQueue: {
            mode: 'playlist_loop',
            playlistId: '',
            orderedSongIds: [],
            currentIndex: -1,
            signature: ''
        },
        playCycleTracker: {
            songId: '',
            counted: false,
            maxRatio: 0
        },
        lastInviteError: null,
        playlistSelectionMode: false,
        selectedPlaylistSongIds: new Set(),
        playlistLongPressBound: false,
        suppressPlaylistPlayUntil: 0,
        librarySelectionMode: false,
        selectedLibraryPlaylistIds: new Set(),
        togetherOneShot: {
            active: false,
            songId: '',
            returnSongId: '',
            returnPlaylistId: ''
        },
        transientSongs: Object.create(null),
        friendHomeContactId: '',
        friendHomeData: null,
        friendHomeActiveTab: 'works',
        friendHomeOpenPlaylistId: '',
        friendHomePlaylistPageData: null,
        friendHomeActiveWorkId: '',
        friendHomePlaying: false,
        friendHomeAudio: null,
        friendHomeRequestMode: 'cover',
        friendHomeRequesting: false,
        friendHomeGenerating: false,
        friendHomeApiLoadingMap: Object.create(null),
        friendHomeWorksQueueContext: null,
        friendHomePersonaFitCache: Object.create(null)
    };
    const MUSIC_V2_PLAYLIST_LONGPRESS_MS = 480;

    const MUSIC_V2_PLAYBACK_MODE_PLAYLIST_LOOP = 'playlist_loop';
    const MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP = 'single_loop';
    const MUSIC_V2_PLAYBACK_MODE_SHUFFLE = 'shuffle';
    const MUSIC_V2_PLAYBACK_MODE_ORDER = [
        MUSIC_V2_PLAYBACK_MODE_PLAYLIST_LOOP,
        MUSIC_V2_PLAYBACK_MODE_SHUFFLE,
        MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP
    ];
    const MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED = 'pl_sys_liked';
    const MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL = 'pl_sys_all';
    const MUSIC_V2_SYSTEM_PLAYLIST_TITLES = {
        liked: '喜欢的歌曲',
        all: '全部歌曲'
    };
    const MUSIC_V2_FRIEND_HOME_SCENE = 'music_personal_home';
    const MUSIC_V2_FRIEND_HOME_TABS = ['works', 'dynamic', 'likes'];
    const MUSIC_V2_FRIEND_HOME_API_REFRESH_MS = 1000 * 60 * 60 * 12;
    const MUSIC_V2_FRIEND_HOME_API_MAX_DYNAMIC = 6;
    const MUSIC_V2_FRIEND_HOME_API_MAX_PLAYLISTS = 3;
    const MUSIC_V2_FRIEND_HOME_API_MAX_PLAYLIST_SONGS = 6;
    const MUSIC_V2_FRIEND_HOME_API_MAX_LIKED_SONGS = 12;
    const MUSIC_V2_FRIEND_HOME_API_PERSONA_VALIDATE_LIMIT = 18;
    const MUSIC_V2_FRIEND_HOME_REQUEST_MODE_COVER = 'cover';
    const MUSIC_V2_FRIEND_HOME_REQUEST_MODE_ORIGINAL = 'original';

    function musicV2NormalizePlaybackMode(rawMode) {
        const mode = String(rawMode || '').trim().toLowerCase();
        if (
            mode === MUSIC_V2_PLAYBACK_MODE_SHUFFLE ||
            mode === 'random'
        ) return MUSIC_V2_PLAYBACK_MODE_SHUFFLE;
        if (
            mode === MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP ||
            mode === 'single' ||
            mode === 'repeat_one'
        ) return MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP;
        return MUSIC_V2_PLAYBACK_MODE_PLAYLIST_LOOP;
    }

    function musicV2GetPlaybackModeLabel(mode) {
        const normalized = musicV2NormalizePlaybackMode(mode);
        if (normalized === MUSIC_V2_PLAYBACK_MODE_SHUFFLE) return '随机播放';
        if (normalized === MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP) return '单曲循环';
        return '歌单循环';
    }

    function musicV2GetPlaybackModeIcon(mode) {
        const normalized = musicV2NormalizePlaybackMode(mode);
        if (normalized === MUSIC_V2_PLAYBACK_MODE_SHUFFLE) return 'ri-shuffle-line';
        if (normalized === MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP) return 'ri-repeat-one-line';
        return 'ri-repeat-2-line';
    }

    function musicV2ResetTogetherOneShot(options) {
        const opts = options || {};
        musicV2Runtime.togetherOneShot = {
            active: false,
            songId: '',
            returnSongId: '',
            returnPlaylistId: ''
        };
        if (!opts.skipSyncAudioLoop) {
            musicV2SyncAudioLoopByMode();
        }
        return musicV2Runtime.togetherOneShot;
    }

    function musicV2IsSystemPlaylistId(playlistId) {
        const sid = String(playlistId || '');
        return sid === MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED || sid === MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL;
    }

    function musicV2NormalizeTitleForCompare(title) {
        return String(title || '').trim();
    }

    function musicV2IsReservedSystemPlaylistTitle(title) {
        const normalized = musicV2NormalizeTitleForCompare(title);
        return normalized === MUSIC_V2_SYSTEM_PLAYLIST_TITLES.liked || normalized === MUSIC_V2_SYSTEM_PLAYLIST_TITLES.all;
    }

    function musicV2UniqueValidSongIds(songIds, validSongSet) {
        const arr = Array.isArray(songIds) ? songIds : [];
        const seen = new Set();
        const list = [];
        for (let i = 0; i < arr.length; i++) {
            const sid = String(arr[i]);
            if (!sid || seen.has(sid)) continue;
            if (validSongSet && !validSongSet.has(sid)) continue;
            seen.add(sid);
            list.push(sid);
        }
        return list;
    }

    function musicV2ArrayEquals(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b)) return false;
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (String(a[i]) !== String(b[i])) return false;
        }
        return true;
    }

    function musicV2NeedProfileCountForNextLevel(level) {
        const lv = Math.max(1, Math.floor(Number(level) || 1));
        return 8 + (lv - 1) * 4;
    }

    function musicV2NeedBondSecForNextLevel(level) {
        const lv = Math.max(1, Math.floor(Number(level) || 1));
        return (10 + (lv - 1) * 5) * 60;
    }

    function musicV2ComputeProfileLevel(playCompleteCount) {
        let remain = Math.max(0, Math.floor(Number(playCompleteCount) || 0));
        let level = 1;
        let guard = 0;
        while (guard < 10000) {
            const need = musicV2NeedProfileCountForNextLevel(level);
            if (remain < need) break;
            remain -= need;
            level += 1;
            guard += 1;
        }
        return {
            level: level,
            progressInLevel: remain,
            nextNeed: musicV2NeedProfileCountForNextLevel(level)
        };
    }

    function musicV2ComputeBondLevel(totalTogetherSec) {
        let remain = Math.max(0, Math.floor(Number(totalTogetherSec) || 0));
        let level = 1;
        let guard = 0;
        while (guard < 10000) {
            const need = musicV2NeedBondSecForNextLevel(level);
            if (remain < need) break;
            remain -= need;
            level += 1;
            guard += 1;
        }
        return {
            level: level,
            progressInLevel: remain,
            nextNeed: musicV2NeedBondSecForNextLevel(level)
        };
    }

    function musicV2EnsureGamificationModel(music) {
        if (!music || typeof music !== 'object') return;
        if (!music.gamification || typeof music.gamification !== 'object' || Array.isArray(music.gamification)) {
            music.gamification = {};
        }
        const gm = music.gamification;
        if (!gm.profile || typeof gm.profile !== 'object' || Array.isArray(gm.profile)) gm.profile = {};
        const profile = gm.profile;

        let playCompleteCount = Number(profile.playCompleteCount);
        if (!Number.isFinite(playCompleteCount) || playCompleteCount < 0) playCompleteCount = 0;
        profile.playCompleteCount = Math.floor(playCompleteCount);
        const profileMeta = musicV2ComputeProfileLevel(profile.playCompleteCount);
        profile.level = profileMeta.level;
        const profileUpdatedAt = Number(profile.updatedAt);
        profile.updatedAt = Number.isFinite(profileUpdatedAt) && profileUpdatedAt > 0
            ? Math.floor(profileUpdatedAt)
            : 0;

        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts)
            ? window.iphoneSimState.contacts
            : [];
        const validContactIds = new Set(contacts.map(c => String(c && c.id)).filter(Boolean));
        const rawBonds = gm.bonds && typeof gm.bonds === 'object' && !Array.isArray(gm.bonds)
            ? gm.bonds
            : {};
        const normalizedBonds = {};
        Object.keys(rawBonds).forEach((key) => {
            const cid = String(key || '');
            if (!cid || !validContactIds.has(cid)) return;
            const rawBond = rawBonds[key];
            const bond = rawBond && typeof rawBond === 'object' && !Array.isArray(rawBond)
                ? rawBond
                : {};
            let totalTogetherSec = Number(bond.totalTogetherSec);
            if (!Number.isFinite(totalTogetherSec) || totalTogetherSec < 0) totalTogetherSec = 0;
            totalTogetherSec = Math.floor(totalTogetherSec);

            let sessions = Number(bond.sessions);
            if (!Number.isFinite(sessions) || sessions < 0) sessions = 0;
            sessions = Math.floor(sessions);

            const bondMeta = musicV2ComputeBondLevel(totalTogetherSec);
            const updatedAt = Number(bond.updatedAt);
            normalizedBonds[cid] = {
                totalTogetherSec: totalTogetherSec,
                sessions: sessions,
                level: bondMeta.level,
                updatedAt: Number.isFinite(updatedAt) && updatedAt > 0 ? Math.floor(updatedAt) : 0
            };
        });
        gm.bonds = normalizedBonds;

        const gmUpdatedAt = Number(gm.updatedAt);
        gm.updatedAt = Number.isFinite(gmUpdatedAt) && gmUpdatedAt > 0
            ? Math.floor(gmUpdatedAt)
            : 0;
    }

    function musicV2FormatDurationSecShort(sec) {
        const safe = Math.max(0, Math.floor(Number(sec) || 0));
        const hours = Math.floor(safe / 3600);
        const minutes = Math.floor((safe % 3600) / 60);
        const seconds = safe % 60;
        if (hours > 0) return hours + '小时' + minutes + '分';
        if (minutes > 0) return minutes + '分';
        return seconds + '秒';
    }

    function musicV2GetBondSnapshot(contactId) {
        const cid = String(contactId || '');
        if (!cid) return { level: 1, totalTogetherSec: 0, sessions: 0 };
        const music = musicV2EnsureModel();
        const bonds = music.gamification && music.gamification.bonds && typeof music.gamification.bonds === 'object'
            ? music.gamification.bonds
            : {};
        const bond = bonds[cid];
        if (!bond || typeof bond !== 'object') return { level: 1, totalTogetherSec: 0, sessions: 0 };
        const totalTogetherSec = Math.max(0, Math.floor(Number(bond.totalTogetherSec) || 0));
        const sessions = Math.max(0, Math.floor(Number(bond.sessions) || 0));
        const levelMeta = musicV2ComputeBondLevel(totalTogetherSec);
        return {
            level: levelMeta.level,
            totalTogetherSec: totalTogetherSec,
            sessions: sessions
        };
    }

    function musicV2ApplyBondProgress(contactId, durationSec) {
        const cid = String(contactId || '');
        if (!cid) return null;
        const addSec = Math.max(0, Math.floor(Number(durationSec) || 0));
        const music = musicV2EnsureModel();
        musicV2EnsureGamificationModel(music);
        if (!music.gamification.bonds[cid]) {
            music.gamification.bonds[cid] = {
                totalTogetherSec: 0,
                sessions: 0,
                level: 1,
                updatedAt: 0
            };
        }
        const bond = music.gamification.bonds[cid];
        const beforeLevel = Math.max(1, Math.floor(Number(bond.level) || 1));
        bond.totalTogetherSec = Math.max(0, Math.floor(Number(bond.totalTogetherSec) || 0)) + addSec;
        bond.sessions = Math.max(0, Math.floor(Number(bond.sessions) || 0)) + 1;
        const bondMeta = musicV2ComputeBondLevel(bond.totalTogetherSec);
        bond.level = bondMeta.level;
        bond.updatedAt = Date.now();
        music.gamification.updatedAt = Date.now();
        return {
            beforeLevel: beforeLevel,
            afterLevel: bond.level,
            totalTogetherSec: bond.totalTogetherSec,
            sessions: bond.sessions
        };
    }

    function musicV2ResetPlayCycleTracker(songId, currentTime) {
        const sid = String(songId || '');
        musicV2Runtime.playCycleTracker.songId = sid;
        musicV2Runtime.playCycleTracker.counted = false;
        const current = Number(currentTime);
        musicV2Runtime.playCycleTracker.maxRatio = Number.isFinite(current) && current > 0 ? current : 0;
    }

    function musicV2GrantProfilePlayComplete(reason) {
        const tracker = musicV2Runtime.playCycleTracker;
        if (!tracker || !tracker.songId || tracker.counted) return false;

        const music = musicV2EnsureModel();
        musicV2EnsureGamificationModel(music);
        const profile = music.gamification.profile;
        const beforeLevel = Math.max(1, Math.floor(Number(profile.level) || 1));
        profile.playCompleteCount = Math.max(0, Math.floor(Number(profile.playCompleteCount) || 0)) + 1;
        const next = musicV2ComputeProfileLevel(profile.playCompleteCount);
        profile.level = next.level;
        profile.updatedAt = Date.now();
        music.gamification.updatedAt = Date.now();
        tracker.counted = true;

        musicV2Persist();
        musicV2RenderSongView();
        if (next.level > beforeLevel) {
            musicV2Toast('等级提升到 Lv.' + next.level);
        }
        return true;
    }

    function musicV2TryCountPlayCompletion(ratio, reason) {
        const tracker = musicV2Runtime.playCycleTracker;
        if (!tracker || !tracker.songId || tracker.counted) return false;
        const safeRatio = musicV2Clamp01(Number(ratio));
        if (safeRatio > tracker.maxRatio) tracker.maxRatio = safeRatio;
        const triggerByEnded = String(reason || '') === 'ended';
        if (!triggerByEnded && tracker.maxRatio < MUSIC_V2_PLAY_COMPLETE_RATIO_THRESHOLD) return false;
        return musicV2GrantProfilePlayComplete(reason);
    }

    function musicV2EnsureSystemPlaylists(music) {
        if (!music || typeof music !== 'object') return;
        if (!Array.isArray(music.playlists)) music.playlists = [];
        if (!Array.isArray(music.songs)) music.songs = [];

        const now = Date.now();
        const allSongIds = music.songs.map(song => String(song && song.id)).filter(Boolean);
        const validSongSet = new Set(allSongIds);
        const playlists = music.playlists;

        let likedPlaylist = playlists.find(pl => String(pl && pl.id) === MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED) || null;
        let allPlaylist = playlists.find(pl => String(pl && pl.id) === MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL) || null;

        if (!likedPlaylist) {
            likedPlaylist = playlists.find(pl => musicV2NormalizeTitleForCompare(pl && pl.title) === MUSIC_V2_SYSTEM_PLAYLIST_TITLES.liked) || null;
        }
        if (!allPlaylist) {
            allPlaylist = playlists.find(pl => musicV2NormalizeTitleForCompare(pl && pl.title) === MUSIC_V2_SYSTEM_PLAYLIST_TITLES.all) || null;
        }

        if (!likedPlaylist) {
            likedPlaylist = {
                id: MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED,
                title: MUSIC_V2_SYSTEM_PLAYLIST_TITLES.liked,
                cover: MUSIC_V2_DEFAULT_COVER,
                songs: [],
                createdAt: now,
                updatedAt: now
            };
        }
        if (!allPlaylist) {
            allPlaylist = {
                id: MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL,
                title: MUSIC_V2_SYSTEM_PLAYLIST_TITLES.all,
                cover: MUSIC_V2_DEFAULT_COVER,
                songs: allSongIds.slice(),
                createdAt: now,
                updatedAt: now
            };
        }

        likedPlaylist.id = MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED;
        likedPlaylist.title = MUSIC_V2_SYSTEM_PLAYLIST_TITLES.liked;
        likedPlaylist.cover = likedPlaylist.cover || MUSIC_V2_DEFAULT_COVER;
        likedPlaylist.createdAt = likedPlaylist.createdAt || now;
        const likedSongIds = musicV2UniqueValidSongIds(likedPlaylist.songs, validSongSet);
        if (!musicV2ArrayEquals(likedPlaylist.songs, likedSongIds)) {
            likedPlaylist.songs = likedSongIds;
            likedPlaylist.updatedAt = now;
        } else {
            likedPlaylist.songs = likedSongIds;
            likedPlaylist.updatedAt = likedPlaylist.updatedAt || now;
        }

        allPlaylist.id = MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL;
        allPlaylist.title = MUSIC_V2_SYSTEM_PLAYLIST_TITLES.all;
        allPlaylist.cover = allPlaylist.cover || MUSIC_V2_DEFAULT_COVER;
        allPlaylist.createdAt = allPlaylist.createdAt || now;
        if (!musicV2ArrayEquals(allPlaylist.songs, allSongIds)) {
            allPlaylist.songs = allSongIds.slice();
            allPlaylist.updatedAt = now;
        } else {
            allPlaylist.songs = allSongIds.slice();
            allPlaylist.updatedAt = allPlaylist.updatedAt || now;
        }

        const ordered = [likedPlaylist, allPlaylist];
        const seenIds = new Set([MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED, MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL]);
        playlists.forEach((pl) => {
            if (!pl || pl === likedPlaylist || pl === allPlaylist) return;
            const pid = String(pl.id || '');
            const title = musicV2NormalizeTitleForCompare(pl.title);
            if (musicV2IsSystemPlaylistId(pid)) return;
            if (title === MUSIC_V2_SYSTEM_PLAYLIST_TITLES.liked || title === MUSIC_V2_SYSTEM_PLAYLIST_TITLES.all) return;
            if (seenIds.has(pid)) return;
            seenIds.add(pid);
            ordered.push(pl);
        });
        music.playlists = ordered;
    }

    function musicV2GetLikedPlaylist() {
        return musicV2GetPlaylist(MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED);
    }

    function musicV2IsSongLiked(songId) {
        const sid = String(songId || '');
        if (!sid) return false;
        const likedPlaylist = musicV2GetLikedPlaylist();
        if (!likedPlaylist || !Array.isArray(likedPlaylist.songs)) return false;
        return likedPlaylist.songs.includes(sid);
    }

    function musicV2ToggleLikeSong(songId) {
        const sid = String(songId || '');
        if (!sid) return '';
        const music = musicV2EnsureModel();
        const likedPlaylist = music.playlists.find(pl => String(pl.id) === MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED);
        if (!likedPlaylist) return '';
        if (!music.songs.some(song => String(song.id) === sid)) return '';
        if (!Array.isArray(likedPlaylist.songs)) likedPlaylist.songs = [];
        const idx = likedPlaylist.songs.findIndex(id => String(id) === sid);
        if (idx >= 0) {
            likedPlaylist.songs.splice(idx, 1);
            likedPlaylist.updatedAt = Date.now();
            return 'unliked';
        }
        likedPlaylist.songs.unshift(sid);
        likedPlaylist.songs = musicV2UniqueValidSongIds(likedPlaylist.songs, new Set(music.songs.map(song => String(song.id))));
        likedPlaylist.updatedAt = Date.now();
        return 'liked';
    }

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
            apiBase: src.apiBase || '',
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
                    apiBase: song.apiBase || '',
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
        music.playbackMode = musicV2NormalizePlaybackMode(music.playbackMode);
        if (typeof music.playing !== 'boolean') music.playing = false;
        if (typeof music.title !== 'string' || !music.title) music.title = 'Happy Together';
        if (typeof music.artist !== 'string' || !music.artist) music.artist = 'Maximillian';
        if (typeof music.cover !== 'string' || !music.cover) music.cover = MUSIC_V2_DEFAULT_COVER;
        if (typeof music.backButtonImage !== 'string') music.backButtonImage = '';
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
            raw.apiBase = normalized.apiBase;
            raw.lyricsData = normalized.lyricsData;
            raw.lyricsFile = normalized.lyricsFile;
            raw.lyricsSource = normalized.lyricsSource;
            raw.lyricsUpdatedAt = normalized.lyricsUpdatedAt;
            raw.addedAt = raw.addedAt || normalized.addedAt;
            normalizedSongs.push(raw);
        });
        music.songs = normalizedSongs;
        musicV2EnsureSystemPlaylists(music);
        if (!music.activePlaylistId || !music.playlists.some(pl => pl.id === music.activePlaylistId)) {
            music.activePlaylistId = music.playlists.some(pl => String(pl.id) === MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL)
                ? MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL
                : (music.playlists[0] ? music.playlists[0].id : null);
        }
        musicV2EnsureGamificationModel(music);
        musicV2EnsureFriendHomeProfiles(music);

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
            const directionRaw = String(raw.direction || 'outgoing').toLowerCase();
            const direction = directionRaw === 'incoming' ? 'incoming' : 'outgoing';
            normalizedInvites.push({
                inviteId: inviteId,
                contactId: contactId,
                songId: raw.songId != null ? String(raw.songId) : '',
                songTitle: String(raw.songTitle || ''),
                songArtist: String(raw.songArtist || ''),
                songCover: String(raw.songCover || ''),
                direction: direction,
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
                const normalizedLastSongId = String(active.lastSongId != null ? active.lastSongId : (active.songId || ''));
                let normalizedSongCount = Number(active.songCount);
                if (!Number.isFinite(normalizedSongCount) || normalizedSongCount < 0) {
                    normalizedSongCount = normalizedLastSongId ? 1 : 0;
                } else {
                    normalizedSongCount = Math.floor(normalizedSongCount);
                }
                const normalizedActive = {
                    sessionId: String(active.sessionId || musicV2MakeId('session')),
                    contactId: contactId,
                    inviteId: active.inviteId != null ? String(active.inviteId) : '',
                    songId: active.songId != null ? String(active.songId) : '',
                    startedAt: Number(active.startedAt) || Date.now(),
                    lastSongId: normalizedLastSongId,
                    songCount: normalizedSongCount
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
        musicV2EnsureSystemPlaylists(music);
        musicV2EnsureGamificationModel(music);
        musicV2EnsureFriendHomeProfiles(music);
        musicV2SyncLegacyPlaylist(music);
        if (typeof saveConfig === 'function') saveConfig();
    }

    function musicV2GetBackButtonImage() {
        const music = musicV2EnsureModel();
        const imageUrl = String(music.backButtonImage || '').trim();
        return imageUrl || MUSIC_V2_DEFAULT_BACK_BUTTON_IMAGE;
    }

    function musicV2ApplyBackButtonImage(rootArg) {
        const root = rootArg || musicV2Runtime.root || getMusicRoot();
        if (!root) return;
        const profilePic = root.querySelector('.profile-pic');
        if (!profilePic) return;
        const imageUrl = musicV2GetBackButtonImage();
        profilePic.style.backgroundImage = 'url("' + imageUrl.replace(/"/g, '\\"') + '")';
        profilePic.style.backgroundPosition = 'center';
        profilePic.style.backgroundSize = 'cover';
        profilePic.style.backgroundRepeat = 'no-repeat';
    }

    function musicV2SyncBackButtonPanel() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const preview = root.querySelector('#music-v2-back-button-preview');
        const urlInput = root.querySelector('#music-v2-back-button-url');
        const currentValue = String(musicV2EnsureModel().backButtonImage || '').trim();
        const imageUrl = musicV2GetBackButtonImage();
        if (preview) {
            preview.style.backgroundImage = 'url("' + imageUrl.replace(/"/g, '\\"') + '")';
            preview.style.backgroundPosition = 'center';
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundRepeat = 'no-repeat';
        }
        if (urlInput) {
            urlInput.value = currentValue && !/^data:/i.test(currentValue) ? currentValue : '';
        }
    }

    function musicV2ShowBackButtonPanel() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const mask = root.querySelector('#music-v2-back-button-mask');
        if (!mask) return;
        musicV2SyncBackButtonPanel();
        mask.classList.add('active');
    }

    function musicV2HideBackButtonPanel() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const mask = root.querySelector('#music-v2-back-button-mask');
        if (mask) mask.classList.remove('active');
    }

    function musicV2SaveBackButtonImage(imageUrl) {
        const music = musicV2EnsureModel();
        music.backButtonImage = String(imageUrl || '').trim();
        musicV2Persist();
        musicV2ApplyBackButtonImage();
        musicV2SyncBackButtonPanel();
    }

    function musicV2ValidateBackButtonUrl(imageUrl) {
        const src = String(imageUrl || '').trim();
        if (!src) return Promise.reject(new Error('empty_image_url'));
        if (/^javascript:/i.test(src)) return Promise.reject(new Error('invalid_image_url'));
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(src);
            image.onerror = () => reject(new Error('image_load_failed'));
            image.referrerPolicy = 'no-referrer';
            image.src = src;
        });
    }

    function musicV2GetPlaylist(playlistId) {
        const music = musicV2EnsureModel();
        return music.playlists.find(pl => String(pl.id) === String(playlistId)) || null;
    }

    function musicV2GetSong(songId) {
        const music = musicV2EnsureModel();
        const sid = String(songId || '');
        if (!sid) return null;
        const song = music.songs.find(item => String(item.id) === sid);
        if (song) return song;
        const transientMap = musicV2Runtime.transientSongs && typeof musicV2Runtime.transientSongs === 'object'
            ? musicV2Runtime.transientSongs
            : null;
        if (transientMap && transientMap[sid]) return transientMap[sid];
        return null;
    }

    function musicV2UpsertSong(rawSong) {
        const music = musicV2EnsureModel();
        const song = musicV2NormalizeSong(rawSong);
        const idx = music.songs.findIndex(item => String(item.id) === song.id);
        if (idx < 0) {
            music.songs.push(song);
            musicV2EnsureSystemPlaylists(music);
            return song;
        }
        const oldSong = music.songs[idx];
        const merged = Object.assign({}, oldSong, song);
        if (!song.src) merged.src = oldSong.src || '';
        if (!song.cover) merged.cover = oldSong.cover || '';
        if (!song.provider) merged.provider = oldSong.provider || '';
        if (!song.apiBase) merged.apiBase = oldSong.apiBase || '';
        if (!song.lyricsData || song.lyricsData.length === 0) merged.lyricsData = oldSong.lyricsData || [];
        if (!song.lyricsFile) merged.lyricsFile = oldSong.lyricsFile || '';
        if (!song.lyricsSource) merged.lyricsSource = oldSong.lyricsSource || '';
        if (!song.lyricsUpdatedAt) merged.lyricsUpdatedAt = oldSong.lyricsUpdatedAt || 0;
        music.songs[idx] = merged;
        musicV2EnsureSystemPlaylists(music);
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
        if (!music.listenTogether || !music.listenTogether.activeSession) {
            const oneShot = musicV2Runtime.togetherOneShot && typeof musicV2Runtime.togetherOneShot === 'object'
                ? musicV2Runtime.togetherOneShot
                : null;
            if (oneShot && oneShot.active) {
                musicV2ResetTogetherOneShot();
            }
            return null;
        }
        return music.listenTogether.activeSession;
    }

    function musicV2DebugInvite(stage, detail) {
        if (typeof console === 'undefined') return;
        if (typeof detail === 'undefined') {
            console.log('[music-v2][invite-debug]', stage);
            return;
        }
        console.log('[music-v2][invite-debug]', stage, detail);
    }

    function musicV2SetLastInviteError(code, message, meta) {
        musicV2Runtime.lastInviteError = {
            code: String(code || 'unknown'),
            message: String(message || '邀请发送失败，请稍后重试'),
            meta: meta || null,
            at: Date.now()
        };
    }

    function musicV2ClearLastInviteError() {
        musicV2Runtime.lastInviteError = null;
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
            payload.direction = invite.direction || payload.direction || 'outgoing';
            msg.content = JSON.stringify(payload);
        }

        if (String(window.iphoneSimState.currentChatContactId || '') === cid && typeof window.renderChatHistory === 'function') {
            window.renderChatHistory(cid, true);
        }
    }

    function musicV2NormalizeInviteSong(inputSong) {
        if (!inputSong || typeof inputSong !== 'object') return null;
        const songId = String(inputSong.songId || inputSong.id || '');
        if (!songId) return null;
        return {
            songId: songId,
            songTitle: String(inputSong.songTitle || inputSong.title || '未知歌曲'),
            songArtist: String(inputSong.songArtist || inputSong.artist || '未知歌手'),
            songCover: String(inputSong.songCover || inputSong.cover || MUSIC_V2_DEFAULT_COVER)
        };
    }

    function musicV2GetInviteAutoplayPlaylistId(songId) {
        const sid = String(songId || '');
        if (!sid) return '';
        const music = musicV2EnsureModel();
        const candidateIds = [
            musicV2Runtime.activePlaylistId,
            music.activePlaylistId,
            MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL
        ].map(item => String(item || '')).filter(Boolean);
        const seen = new Set();
        for (let i = 0; i < candidateIds.length; i++) {
            const pid = candidateIds[i];
            if (!pid || seen.has(pid)) continue;
            seen.add(pid);
            const playlist = musicV2GetPlaylist(pid);
            if (!playlist || !Array.isArray(playlist.songs)) continue;
            if (playlist.songs.some(rawId => String(rawId) === sid)) return pid;
        }
        const fallback = musicV2GetPlaylist(MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL);
        if (fallback && String(fallback.id || '')) return String(fallback.id || '');
        const any = (music.playlists || []).find(pl => pl && Array.isArray(pl.songs) && pl.songs.some(rawId => String(rawId) === sid));
        if (any && any.id) return String(any.id);
        return String(music.activePlaylistId || '');
    }

    function musicV2CreateInvite(contactId, opts) {
        const cid = String(contactId || '');
        const options = opts && typeof opts === 'object' ? opts : {};
        musicV2ClearLastInviteError();
        musicV2DebugInvite('create:start', {
            contactId: cid,
            hasOptionsSong: !!(options && options.song),
            senderIsUser: options.senderIsUser !== false
        });
        if (!cid) {
            musicV2SetLastInviteError('invalid_contact', '联系人不可用', { contactId: contactId });
            musicV2DebugInvite('create:fail:invalid-contact-id', { contactId: contactId });
            musicV2Toast('联系人不可用');
            return null;
        }
        const contact = musicV2GetContactById(cid);
        if (!contact) {
            musicV2SetLastInviteError('contact_not_found', '联系人不存在', { contactId: cid });
            musicV2DebugInvite('create:fail:contact-not-found', { contactId: cid });
            musicV2Toast('联系人不存在');
            return null;
        }
        const pending = musicV2GetPendingInviteForContactInternal(cid);
        if (pending) {
            musicV2SetLastInviteError('pending_exists', '邀请已发送，等待回复', {
                contactId: cid,
                inviteId: String(pending.inviteId || '')
            });
            musicV2DebugInvite('create:fail:pending-exists', {
                contactId: cid,
                inviteId: String(pending.inviteId || '')
            });
            musicV2Toast('邀请已发送，等待回复');
            return null;
        }

        const explicitSong = musicV2NormalizeInviteSong(options.song);
        const currentSong = musicV2GetCurrentSong();
        const fallbackSong = currentSong
            ? {
                songId: String(currentSong.id || ''),
                songTitle: String(currentSong.title || '未知歌曲'),
                songArtist: String(currentSong.artist || '未知歌手'),
                songCover: String(currentSong.cover || MUSIC_V2_DEFAULT_COVER)
            }
            : null;
        const inviteSong = explicitSong || fallbackSong;
        if (!inviteSong || !inviteSong.songId) {
            musicV2SetLastInviteError('no_invite_song', '请先播放一首歌再邀请', {
                contactId: cid,
                hasExplicitSong: !!explicitSong,
                hasCurrentSong: !!currentSong
            });
            musicV2DebugInvite('create:fail:no-invite-song', {
                contactId: cid,
                hasExplicitSong: !!explicitSong,
                hasCurrentSong: !!currentSong
            });
            musicV2Toast('请先播放一首歌再邀请');
            return null;
        }

        const music = musicV2EnsureModel();
        const senderIsUser = options.senderIsUser !== false;
        const invite = {
            inviteId: musicV2MakeId('invite'),
            contactId: cid,
            songId: inviteSong.songId,
            songTitle: inviteSong.songTitle,
            songArtist: inviteSong.songArtist,
            songCover: inviteSong.songCover || String(music.cover || MUSIC_V2_DEFAULT_COVER),
            direction: senderIsUser ? 'outgoing' : 'incoming',
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        music.listenTogether.invites.push(invite);
        music.listenTogether.updatedAt = Date.now();
        musicV2DebugInvite('create:invite-built', {
            inviteId: String(invite.inviteId || ''),
            contactId: cid,
            songId: String(invite.songId || ''),
            direction: String(invite.direction || '')
        });

        if (typeof window.sendMessage === 'function') {
            try {
                window.sendMessage(JSON.stringify(invite), senderIsUser, 'music_listen_invite', null, cid);
                musicV2DebugInvite('create:send-message:ok', {
                    inviteId: String(invite.inviteId || ''),
                    contactId: cid
                });
            } catch (error) {
                musicV2SetLastInviteError('send_message_failed', '邀请发送失败，请稍后重试', {
                    contactId: cid,
                    inviteId: String(invite.inviteId || ''),
                    error: String(error && error.message ? error.message : error)
                });
                musicV2DebugInvite('create:send-message:fail', {
                    inviteId: String(invite.inviteId || ''),
                    contactId: cid,
                    error: String(error && error.message ? error.message : error)
                });
                return null;
            }
        } else {
            musicV2SetLastInviteError('send_message_api_missing', '音乐模块暂不可用，无法发起一起听邀请', {
                contactId: cid,
                inviteId: String(invite.inviteId || '')
            });
            musicV2DebugInvite('create:send-message:missing-api', {
                inviteId: String(invite.inviteId || ''),
                contactId: cid
            });
            return null;
        }
        musicV2Persist();
        musicV2RenderFriends();
        musicV2Toast('已发送一起听邀请');
        musicV2ClearLastInviteError();
        musicV2DebugInvite('create:done', {
            inviteId: String(invite.inviteId || ''),
            contactId: cid
        });
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
        let acceptedSongId = '';
        let acceptedPlaylistId = '';

        if (normalizedDecision === 'accepted') {
            const initialSongId = String(invite.songId || (music.currentSongId || ''));
            acceptedSongId = initialSongId;
            acceptedPlaylistId = musicV2GetInviteAutoplayPlaylistId(initialSongId);
            music.listenTogether.activeSession = {
                sessionId: musicV2MakeId('session'),
                contactId: cid,
                inviteId: String(invite.inviteId),
                songId: initialSongId,
                startedAt: Date.now(),
                lastSongId: initialSongId,
                songCount: initialSongId ? 1 : 0
            };
        } else if (
            music.listenTogether.activeSession &&
            String(music.listenTogether.activeSession.inviteId || '') === String(invite.inviteId || '')
        ) {
            music.listenTogether.activeSession = null;
            musicV2ResetTogetherOneShot({ skipSyncAudioLoop: true });
        }

        musicV2Persist();
        musicV2RenderFriends();
        musicV2RenderMiniPlayer();
        musicV2RenderSongView();
        if (normalizedDecision === 'accepted') {
            const acceptedSong = acceptedSongId ? musicV2GetSong(acceptedSongId) : null;
            if (acceptedSong) {
                // Keep UI in sync immediately, then try to start playback.
                musicV2SyncNowPlaying(acceptedSong, false);
                musicV2Persist();
                musicV2RenderMiniPlayer();
                musicV2RenderSongView();
                musicV2PlaySong(acceptedSongId, acceptedPlaylistId).catch((playError) => {
                    musicV2DebugInvite('decision:autoplay-fail', {
                        contactId: cid,
                        inviteId: String(invite && invite.inviteId ? invite.inviteId : ''),
                        songId: acceptedSongId,
                        error: String(playError && playError.message ? playError.message : playError)
                    });
                    musicV2Toast('邀请歌曲不可用，请重新选歌');
                });
                musicV2Toast('对方同意了一起听邀请');
            } else {
                musicV2Toast('邀请歌曲不可用，请重新选歌');
            }
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
                direction: String(pendingInvite.direction || 'outgoing'),
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
                isPlaying: !!music.playing,
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

    function musicV2FormatDurationMs(ms) {
        const safeMs = Number.isFinite(ms) && ms > 0 ? Math.floor(ms) : 0;
        const totalSec = Math.floor(safeMs / 1000);
        const hours = Math.floor(totalSec / 3600);
        const minutes = Math.floor((totalSec % 3600) / 60);
        const seconds = totalSec % 60;
        if (hours > 0) {
            return hours + '小时' + minutes + '分' + String(seconds).padStart(2, '0') + '秒';
        }
        if (minutes > 0) {
            return minutes + '分' + String(seconds).padStart(2, '0') + '秒';
        }
        return seconds + '秒';
    }

    function musicV2TrackTogetherSongProgress(songId) {
        const sid = String(songId || '');
        if (!sid) return false;
        const music = musicV2EnsureModel();
        if (!music.listenTogether || !music.listenTogether.activeSession) return false;
        const active = music.listenTogether.activeSession;
        const lastSongId = String(active.lastSongId || active.songId || '');
        let songCount = Number(active.songCount);
        if (!Number.isFinite(songCount) || songCount < 0) {
            songCount = lastSongId ? 1 : 0;
        } else {
            songCount = Math.floor(songCount);
        }
        if (!lastSongId) {
            active.lastSongId = sid;
            active.songCount = Math.max(songCount, 1);
            if (!active.songId) active.songId = sid;
            music.listenTogether.updatedAt = Date.now();
            return true;
        }
        if (lastSongId === sid) return false;
        active.lastSongId = sid;
        active.songCount = songCount + 1;
        active.songId = sid;
        music.listenTogether.updatedAt = Date.now();
        return true;
    }

    function musicV2SendTogetherEndedSystemMessage(contactId) {
        const cid = String(contactId || '');
        if (!cid || typeof window.sendMessage !== 'function') return;
        const text = '[系统消息]: 对方结束了一起听';
        try {
            window.sendMessage(text, true, 'text', null, cid);
        } catch (error) {
            // Ignore messaging failures to avoid blocking session cleanup.
        }
    }

    function musicV2ShowTogetherSummaryModal(summary) {
        const root = musicV2Runtime.root;
        if (!root || !summary || typeof summary !== 'object') return;
        const mask = root.querySelector('#music-v2-together-summary-mask');
        if (!mask) return;
        musicV2Runtime.togetherSummary = {
            contactName: String(summary.contactName || '联系人'),
            durationText: String(summary.durationText || '0秒'),
            songCount: Math.max(0, Math.floor(Number(summary.songCount) || 0))
        };
        const contactEl = mask.querySelector('#music-v2-summary-contact');
        const durationEl = mask.querySelector('#music-v2-summary-duration');
        const countEl = mask.querySelector('#music-v2-summary-count');
        if (contactEl) contactEl.textContent = musicV2Runtime.togetherSummary.contactName;
        if (durationEl) durationEl.textContent = musicV2Runtime.togetherSummary.durationText;
        if (countEl) countEl.textContent = String(musicV2Runtime.togetherSummary.songCount);
        mask.classList.add('active');
    }

    function musicV2HideTogetherSummaryModal() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const mask = root.querySelector('#music-v2-together-summary-mask');
        if (mask) mask.classList.remove('active');
        musicV2Runtime.togetherSummary = null;
    }

    function musicV2ShowSongMenu() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const panel = root.querySelector('#music-v2-song-menu-panel');
        if (!panel) return;
        const songView = root.querySelector('#song-view');
        const moreBtn = songView ? songView.querySelector('.sv-header > i:last-child') : null;
        const endBtn = root.querySelector('#music-v2-song-menu-end');
        const active = musicV2GetActiveTogetherSession();
        if (endBtn) {
            endBtn.disabled = !active;
            endBtn.textContent = active ? '结束一起听' : '当前未在一起听';
        }
        if (songView && moreBtn) {
            const svRect = songView.getBoundingClientRect();
            const btnRect = moreBtn.getBoundingClientRect();
            const top = Math.max(0, btnRect.bottom - svRect.top + 8);
            const right = Math.max(12, svRect.right - btnRect.right);
            panel.style.top = top + 'px';
            panel.style.right = right + 'px';
        }
        panel.classList.add('active');
    }

    function musicV2HideSongMenu() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const panel = root.querySelector('#music-v2-song-menu-panel');
        if (panel) panel.classList.remove('active');
    }

    function musicV2EndTogetherSession() {
        const music = musicV2EnsureModel();
        const active = musicV2GetActiveTogetherSession();
        if (!active) {
            musicV2Toast('当前没有一起听会话');
            return false;
        }
        const contact = musicV2GetContactById(active.contactId);
        const contactName = contact ? musicV2GetContactDisplayName(contact) : '联系人';
        const startedAt = Number(active.startedAt) || Date.now();
        const durationMs = Math.max(0, Date.now() - startedAt);
        const durationSec = Math.max(0, Math.floor(durationMs / 1000));
        const bondProgress = musicV2ApplyBondProgress(active.contactId, durationSec);
        let songCount = Number(active.songCount);
        if (!Number.isFinite(songCount) || songCount < 0) songCount = 0;
        songCount = Math.floor(songCount);
        if (songCount <= 0 && String(active.lastSongId || active.songId || '')) songCount = 1;

        music.listenTogether.activeSession = null;
        music.listenTogether.updatedAt = Date.now();
        musicV2ResetTogetherOneShot();
        musicV2Persist();
        musicV2RenderSongView();
        musicV2RenderFriends();
        musicV2RenderMiniPlayer();
        musicV2SendTogetherEndedSystemMessage(active.contactId);
        musicV2ShowTogetherSummaryModal({
            contactName: contactName,
            durationText: musicV2FormatDurationMs(durationMs),
            songCount: songCount
        });
        if (bondProgress && bondProgress.afterLevel > bondProgress.beforeLevel) {
            setTimeout(() => {
                musicV2Toast('你与' + contactName + '的羁绊提升到 Lv.' + bondProgress.afterLevel);
            }, 220);
        }
        return true;
    }

    function musicV2Clamp01(value) {
        if (!Number.isFinite(value)) return 0;
        if (value < 0) return 0;
        if (value > 1) return 1;
        return value;
    }

    function musicV2NormalizeApiBase(base) {
        return String(base || '').trim().replace(/\/+$/, '');
    }

    function musicV2BuildApiBaseOrder() {
        const seen = new Set();
        const ordered = [];
        const preferred = musicV2NormalizeApiBase(musicV2Runtime.preferredApiBase);
        [preferred].concat(MUSIC_V2_API_BASES).forEach((base) => {
            const normalized = musicV2NormalizeApiBase(base);
            if (!normalized || seen.has(normalized)) return;
            seen.add(normalized);
            ordered.push(normalized);
        });
        return ordered;
    }

    function musicV2RememberApiBase(base) {
        const normalized = musicV2NormalizeApiBase(base);
        if (normalized) musicV2Runtime.preferredApiBase = normalized;
    }

    function musicV2BuildApiUrl(base, path, params) {
        const normalizedBase = musicV2NormalizeApiBase(base);
        const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : ('/' + String(path || ''));
        const search = new URLSearchParams();
        if (params && typeof params === 'object') {
            Object.keys(params).forEach((key) => {
                const value = params[key];
                if (value === undefined || value === null || value === '') return;
                search.append(key, String(value));
            });
        }
        const query = search.toString();
        return normalizedBase + normalizedPath + (query ? ('?' + query) : '');
    }

    function musicV2GetApiProviderLabel(base) {
        const normalized = musicV2NormalizeApiBase(base);
        if (!normalized) return 'netease-api';
        try {
            return new URL(normalized).host || normalized;
        } catch (error) {
            return normalized;
        }
    }

    function musicV2BuildMetingUrl(songId, type) {
        const params = new URLSearchParams();
        params.set('server', 'netease');
        params.set('type', String(type || 'url'));
        params.set('id', String(songId || ''));
        return MUSIC_V2_METING_API_BASE + '?' + params.toString();
    }

    function musicV2GetSongApiBase(song) {
        if (!song || typeof song !== 'object') return '';
        const direct = musicV2NormalizeApiBase(song.apiBase || '');
        if (direct) return direct;
        const music = musicV2EnsureModel();
        const sid = String(song.id || '');
        const cached = sid && music.urlCache && music.urlCache[sid] ? music.urlCache[sid] : null;
        return musicV2NormalizeApiBase(cached && cached.apiBase ? cached.apiBase : '');
    }

    async function musicV2FetchJson(url, options) {
        const opts = options && typeof options === 'object' ? options : {};
        const timeoutMs = Number.isFinite(opts.timeoutMs) && opts.timeoutMs > 0
            ? opts.timeoutMs
            : MUSIC_V2_API_TIMEOUT_MS;
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        let timer = null;
        try {
            if (controller) {
                timer = window.setTimeout(() => controller.abort(), timeoutMs);
            }
            const response = await fetch(url, {
                method: 'GET',
                cache: 'no-store',
                signal: controller ? controller.signal : undefined
            });
            if (!response.ok) throw new Error('HTTP_' + response.status);
            return response.json();
        } catch (error) {
            if (error && error.name === 'AbortError') throw new Error('TIMEOUT');
            throw error;
        } finally {
            if (timer) window.clearTimeout(timer);
        }
    }

    async function musicV2TryApiCandidates(candidates, options) {
        const opts = options && typeof options === 'object' ? options : {};
        let lastError = null;
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            if (!candidate || !candidate.url) continue;
            try {
                const data = await musicV2FetchJson(candidate.url, { timeoutMs: candidate.timeoutMs || opts.timeoutMs });
                if (musicV2IsRateLimitPayload(data)) throw new Error('RATE_LIMIT');
                const result = typeof candidate.transform === 'function' ? candidate.transform(data, candidate) : data;
                const isValid = typeof candidate.validate === 'function' ? candidate.validate(result, data, candidate) : Boolean(result);
                if (!isValid) throw new Error(candidate.invalidCode || 'INVALID_PAYLOAD');
                musicV2RememberApiBase(candidate.base);
                return result;
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error(opts.errorCode || 'API_REQUEST_FAILED');
    }

    function musicV2ParseNeteasePlaylistId(input) {
        const raw = String(input || '').trim();
        if (!raw) return '';
        const directMatch = raw.match(/^(\d{3,})$/);
        if (directMatch) return directMatch[1];

        let decoded = raw;
        try {
            decoded = decodeURIComponent(raw);
        } catch (error) {
            decoded = raw;
        }

        const queryMatch = decoded.match(/[?&#]id=(\d{3,})/i);
        if (queryMatch) return queryMatch[1];

        const pathMatch = decoded.match(/\/playlist\/(\d{3,})/i);
        if (pathMatch) return pathMatch[1];

        return '';
    }

    async function musicV2FetchNeteasePlaylistDetail(playlistId) {
        const pid = String(playlistId || '');
        if (!pid) throw new Error('invalid_playlist_id');
        const candidates = musicV2BuildApiBaseOrder().map((base) => ({
            base: base,
            url: musicV2BuildApiUrl(base, '/playlist/detail', { id: pid, _t: Date.now() }),
            transform: (data) => {
                const playlist = data && data.playlist && typeof data.playlist === 'object'
                    ? data.playlist
                    : null;
                if (!playlist) return null;
                return {
                    name: String(playlist.name || ''),
                    coverImgUrl: String(playlist.coverImgUrl || '')
                };
            },
            validate: (result) => Boolean(result && (result.name || result.coverImgUrl)),
            invalidCode: 'playlist_detail_invalid'
        }));
        return musicV2TryApiCandidates(candidates, { errorCode: 'playlist_detail_invalid' });
    }

    async function musicV2FetchNeteaseSongDetail(songId) {
        const sid = String(songId || '').trim();
        if (!sid) throw new Error('invalid_song_id');
        const candidates = musicV2BuildApiBaseOrder().map((base) => ({
            base: base,
            url: musicV2BuildApiUrl(base, '/song/detail', { ids: sid, _t: Date.now() }),
            transform: (data) => {
                const song = Array.isArray(data && data.songs) && data.songs.length ? data.songs[0] : null;
                if (!song) return null;
                return {
                    title: String(song.name || '未命名歌曲'),
                    artist: musicV2PickArtist(song),
                    cover: String((song.al && song.al.picUrl) || (song.album && song.album.picUrl) || '')
                };
            },
            validate: (result) => Boolean(result && (result.title || result.artist || result.cover)),
            invalidCode: 'song_detail_invalid'
        }));
        return musicV2TryApiCandidates(candidates, { errorCode: 'song_detail_invalid' });
    }

    async function musicV2FetchNeteasePlaylistSongsAllFromBase(base, playlistId) {
        const pid = String(playlistId || '');
        const allSongs = [];
        const seenSongIds = new Set();
        let offset = 0;
        const limit = MUSIC_V2_IMPORT_PAGE_LIMIT;

        for (let page = 0; page < MUSIC_V2_IMPORT_MAX_PAGES; page++) {
            const data = await musicV2FetchJson(musicV2BuildApiUrl(base, '/playlist/track/all', {
                id: pid,
                limit: limit,
                offset: offset,
                _t: Date.now()
            }));
            if (musicV2IsRateLimitPayload(data)) throw new Error('RATE_LIMIT');
            let songs = Array.isArray(data && data.songs)
                ? data.songs
                : (data && data.playlist && Array.isArray(data.playlist.tracks) ? data.playlist.tracks : []);

            if (!songs.length && page === 0) {
                const detailData = await musicV2FetchJson(musicV2BuildApiUrl(base, '/playlist/detail', {
                    id: pid,
                    _t: Date.now()
                }));
                if (musicV2IsRateLimitPayload(detailData)) throw new Error('RATE_LIMIT');
                songs = detailData && detailData.playlist && Array.isArray(detailData.playlist.tracks)
                    ? detailData.playlist.tracks
                    : [];
            }

            if (!songs.length) break;

            let pageNewCount = 0;
            for (let i = 0; i < songs.length; i++) {
                const item = songs[i];
                const sid = String(item && item.id ? item.id : '');
                if (!sid || seenSongIds.has(sid)) continue;
                seenSongIds.add(sid);
                allSongs.push(item);
                pageNewCount += 1;
            }

            if (songs.length < limit) break;
            if (pageNewCount <= 0) break;
            offset += limit;
        }

        if (!allSongs.length) throw new Error('playlist_tracks_empty');
        return allSongs;
    }

    async function musicV2FetchNeteasePlaylistSongsAll(playlistId) {
        const pid = String(playlistId || '');
        if (!pid) throw new Error('invalid_playlist_id');
        let lastError = null;
        const bases = musicV2BuildApiBaseOrder();
        for (let i = 0; i < bases.length; i++) {
            const base = bases[i];
            try {
                const songs = await musicV2FetchNeteasePlaylistSongsAllFromBase(base, pid);
                musicV2RememberApiBase(base);
                return songs;
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error('playlist_tracks_failed');
    }

    function musicV2BuildImportedPlaylistTitle(baseTitle) {
        const base = String(baseTitle || '').trim() || '导入歌单';
        const music = musicV2EnsureModel();
        const existing = new Set((music.playlists || []).map(pl => musicV2NormalizeTitleForCompare(pl && pl.title)));
        if (!existing.has(base)) return base;

        for (let i = 1; i <= 999; i++) {
            const candidate = i === 1 ? (base + ' (导入)') : (base + ' (导入 ' + i + ')');
            if (!existing.has(candidate)) return candidate;
        }

        return base + ' (导入 ' + Date.now() + ')';
    }

    function musicV2MapImportedTrack(track) {
        if (!track || typeof track !== 'object') return null;
        const sid = String(track.id || '');
        if (!sid) return null;

        const artistNames = Array.isArray(track.ar)
            ? track.ar.map(item => String(item && item.name ? item.name : '').trim()).filter(Boolean)
            : [];
        const title = String(track.name || '未命名歌曲');
        const artist = artistNames.length ? artistNames.join('/') : '未知歌手';
        const cover = String(
            (track.al && track.al.picUrl)
            || (track.album && track.album.picUrl)
            || ''
        );

        return {
            id: sid,
            title: title,
            artist: artist,
            cover: cover,
            src: '',
            provider: 'netease-import'
        };
    }

    function musicV2BuildImportErrorMessage(error) {
        if (error && typeof error.userMessage === 'string' && error.userMessage) {
            return error.userMessage;
        }
        const raw = String(error && error.message ? error.message : '');
        if (/^HTTP_\d+$/i.test(raw)) {
            return '导入失败，请稍后重试（接口异常）';
        }
        return '导入失败，请稍后重试';
    }

    async function musicV2ImportPlaylistByInput(rawInput) {
        const playlistId = musicV2ParseNeteasePlaylistId(rawInput);
        if (!playlistId) {
            const error = new Error('invalid_playlist_id');
            error.userMessage = '无法识别歌单ID';
            throw error;
        }

        const detailPromise = musicV2FetchNeteasePlaylistDetail(playlistId);
        const tracksPromise = musicV2FetchNeteasePlaylistSongsAll(playlistId);
        let detail = null;
        let detailFallback = false;

        try {
            detail = await detailPromise;
        } catch (error) {
            detailFallback = true;
            detail = null;
        }

        const tracks = await tracksPromise;
        if (!Array.isArray(tracks) || !tracks.length) {
            const error = new Error('empty_playlist');
            error.userMessage = '歌单为空或未获取到歌曲';
            throw error;
        }

        const importedSongIds = [];
        const importedSongIdSet = new Set();
        for (let i = 0; i < tracks.length; i++) {
            const mapped = musicV2MapImportedTrack(tracks[i]);
            if (!mapped) continue;
            const saved = musicV2UpsertSong(mapped);
            const sid = String(saved && saved.id ? saved.id : '');
            if (!sid || importedSongIdSet.has(sid)) continue;
            importedSongIdSet.add(sid);
            importedSongIds.push(sid);
        }

        if (!importedSongIds.length) {
            const error = new Error('empty_playlist');
            error.userMessage = '歌单为空或未获取到歌曲';
            throw error;
        }

        const baseTitle = detail && detail.name
            ? String(detail.name)
            : ('导入歌单 ' + playlistId);
        const title = musicV2BuildImportedPlaylistTitle(baseTitle);

        let cover = detail && detail.coverImgUrl ? String(detail.coverImgUrl) : '';
        if (!cover) {
            const firstSong = musicV2GetSong(importedSongIds[0]);
            cover = firstSong && firstSong.cover ? String(firstSong.cover) : '';
        }
        if (!cover) cover = MUSIC_V2_DEFAULT_COVER;

        const music = musicV2EnsureModel();
        const now = Date.now();
        const newPlaylist = {
            id: musicV2MakeId('pl'),
            title: title,
            cover: cover,
            songs: importedSongIds.slice(),
            createdAt: now,
            updatedAt: now
        };

        const systems = [];
        const others = [];
        (music.playlists || []).forEach(pl => {
            if (!pl || typeof pl !== 'object') return;
            if (musicV2IsSystemPlaylistId(pl.id)) systems.push(pl);
            else others.push(pl);
        });
        music.playlists = systems.concat([newPlaylist], others);
        music.activePlaylistId = String(newPlaylist.id);
        musicV2Runtime.activePlaylistId = String(newPlaylist.id);
        musicV2Runtime.importDetailFallback = detailFallback;

        musicV2Persist();
        musicV2RenderLibrary();
        musicV2RenderPlaylistPage();

        return {
            playlistId: String(newPlaylist.id),
            title: title,
            songCount: importedSongIds.length,
            detailFallback: detailFallback
        };
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

    function musicV2BuildLyricsDataFromText(lyricsText, durationSec) {
        const rawText = String(lyricsText || '').trim();
        if (!rawText) return [];
        const parsedLrc = musicV2ParseLyricText(rawText);
        if (parsedLrc.length) return parsedLrc;
        const lines = rawText
            .split(/\r?\n/)
            .map(line => String(line || '').trim())
            .filter(Boolean)
            .slice(0, 320);
        if (!lines.length) return [];

        const dur = Number(durationSec);
        const hasDuration = Number.isFinite(dur) && dur > 0;
        const step = hasDuration
            ? Math.max(1.4, Math.min(8, dur / Math.max(1, lines.length + 1)))
            : 3.2;
        const result = [];
        let cursor = 0;
        for (let i = 0; i < lines.length; i++) {
            result.push({
                time: Number(cursor.toFixed(2)),
                text: lines[i]
            });
            cursor += step;
        }
        return result;
    }

    function musicV2NormalizeLyricsData(rawLines, fallbackLyricsText, durationSec) {
        const lines = Array.isArray(rawLines) ? rawLines : [];
        const out = [];
        for (let i = 0; i < lines.length; i++) {
            const item = lines[i];
            const text = String(item && item.text || '').trim();
            if (!text) continue;
            const timeRaw = Number(item && item.time);
            out.push({
                time: Number.isFinite(timeRaw) && timeRaw >= 0 ? timeRaw : NaN,
                text: text
            });
        }
        if (!out.length) {
            return musicV2BuildLyricsDataFromText(fallbackLyricsText, durationSec);
        }
        let hasValidTime = false;
        out.forEach((item) => {
            if (Number.isFinite(item.time)) hasValidTime = true;
        });
        if (!hasValidTime) {
            const stepBase = Math.max(1.4, Math.min(8, (Number(durationSec) > 0 ? Number(durationSec) : out.length * 3.2) / Math.max(1, out.length + 1)));
            let cursor = 0;
            out.forEach((item) => {
                item.time = Number(cursor.toFixed(2));
                cursor += stepBase;
            });
        }
        return out
            .map(item => ({ time: Math.max(0, Number(item.time) || 0), text: item.text }))
            .sort((a, b) => a.time - b.time);
    }

    function musicV2IsInstrumentalLyric(lines) {
        if (!Array.isArray(lines) || !lines.length) return false;
        const sample = lines.slice(0, 8).map(line => String(line && line.text ? line.text : '')).join(' ');
        return /(纯音乐|伴奏|inst\.?|instrumental|暂无歌词|没有填词)/i.test(sample);
    }

    async function musicV2FetchLyrics(songId) {
        const sid = String(songId || '');
        const candidates = musicV2BuildApiBaseOrder().map((base) => ({
            base: base,
            url: musicV2BuildApiUrl(base, '/lyric', { id: sid, _t: Date.now() }),
            transform: (data) => {
                const lyricText = musicV2ExtractLyricPayload(data);
                return {
                    lyricText: lyricText,
                    lines: musicV2ParseLyricText(lyricText)
                };
            },
            validate: (result) => Boolean(result && Array.isArray(result.lines)),
            invalidCode: 'lyric_invalid'
        }));
        return musicV2TryApiCandidates(candidates, { errorCode: 'lyric_failed' });
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

    function musicV2BindPlaylistLongPress() {
        const root = musicV2Runtime.root;
        if (!root || musicV2Runtime.playlistLongPressBound) return;
        const pageContent = root.querySelector('#music-v2-playlist-page-content');
        if (!pageContent) return;
        musicV2Runtime.playlistLongPressBound = true;

        let pressTimer = null;
        let pressing = false;
        let moved = false;
        let startX = 0;
        let startY = 0;
        let startSongId = '';

        const getPoint = function (evt) {
            if (!evt) return null;
            if (evt.touches && evt.touches[0]) {
                return { x: evt.touches[0].clientX, y: evt.touches[0].clientY };
            }
            if (evt.changedTouches && evt.changedTouches[0]) {
                return { x: evt.changedTouches[0].clientX, y: evt.changedTouches[0].clientY };
            }
            if (Number.isFinite(evt.clientX) && Number.isFinite(evt.clientY)) {
                return { x: evt.clientX, y: evt.clientY };
            }
            return null;
        };

        const clearPress = function () {
            if (pressTimer) {
                clearTimeout(pressTimer);
                pressTimer = null;
            }
            if (!pressing) return;
            pressing = false;
            startSongId = '';
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchend', onEnd);
            window.removeEventListener('touchcancel', onEnd);
        };

        const onMove = function (evt) {
            if (!pressing || moved) return;
            const point = getPoint(evt);
            if (!point) return;
            if (Math.abs(point.x - startX) > 8 || Math.abs(point.y - startY) > 8) {
                moved = true;
                if (pressTimer) {
                    clearTimeout(pressTimer);
                    pressTimer = null;
                }
            }
        };

        const onEnd = function () {
            clearPress();
        };

        const onPressStart = function (evt) {
            if (musicV2Runtime.playlistSelectionMode) return;
            const songRow = evt.target.closest('.music-v2-playlist-song-item[data-musicv2-playlist-song="1"]');
            if (!songRow) return;
            const songId = String(songRow.getAttribute('data-song-id') || '');
            if (!songId) return;
            const point = getPoint(evt);
            if (!point) return;

            clearPress();
            pressing = true;
            moved = false;
            startX = point.x;
            startY = point.y;
            startSongId = songId;
            pressTimer = setTimeout(() => {
                pressTimer = null;
                if (!pressing || moved || !startSongId) return;
                musicV2EnterPlaylistSelectionMode(startSongId);
                musicV2Toast('已进入多选模式');
                clearPress();
            }, MUSIC_V2_PLAYLIST_LONGPRESS_MS);

            window.addEventListener('mousemove', onMove, { passive: true });
            window.addEventListener('touchmove', onMove, { passive: true });
            window.addEventListener('mouseup', onEnd);
            window.addEventListener('touchend', onEnd);
            window.addEventListener('touchcancel', onEnd);
        };

        pageContent.addEventListener('mousedown', onPressStart);
        pageContent.addEventListener('touchstart', onPressStart, { passive: true });
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
        if (knownSource === 'api-163' || knownSource === 'none' || knownSource.indexOf('friend-home') === 0) {
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
        const source = String(song.lyricsSource || '').toLowerCase();
        if (source === 'friend-home-original') {
            if (musicV2Runtime.activeLyricIndex !== -1) {
                musicV2Runtime.activeLyricIndex = -1;
                const groups = musicV2CollectLyricPanels(root);
                groups.forEach((group) => {
                    const activeNodes = group.listEl.querySelectorAll('.music-v2-lyric-line.active');
                    activeNodes.forEach((node) => node.classList.remove('active'));
                });
            }
            return;
        }

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

    function musicV2BuildSearchCandidates(keyword) {
        const kw = String(keyword || '').trim();
        const params = { keywords: kw, _t: Date.now() };
        const candidates = [];
        const bases = musicV2BuildApiBaseOrder();
        bases.forEach((base) => {
            candidates.push({
                base: base,
                url: musicV2BuildApiUrl(base, '/cloudsearch', params),
                transform: (data) => musicV2ParseSearchSongs(data),
                validate: (result) => Array.isArray(result),
                invalidCode: 'search_invalid'
            });
        });
        bases.forEach((base) => {
            candidates.push({
                base: base,
                url: musicV2BuildApiUrl(base, '/search', params),
                transform: (data) => musicV2ParseSearchSongs(data),
                validate: (result) => Array.isArray(result),
                invalidCode: 'search_invalid'
            });
        });
        return candidates;
    }

    async function musicV2SearchWithFallback(keyword) {
        return musicV2TryApiCandidates(musicV2BuildSearchCandidates(keyword), { errorCode: 'SEARCH_FAILED' });
    }

    async function musicV2BuildInviteSongFromKeyword(keyword, options) {
        const opts = options && typeof options === 'object' ? options : {};
        const persistToLibrary = opts.persistToLibrary !== false;
        const kw = String(keyword || '').trim();
        musicV2DebugInvite('build-song:start', { keyword: kw, persistToLibrary: persistToLibrary });
        if (!kw) {
            const error = new Error('invite_keyword_required');
            error.userMessage = '当前未在听歌，请先指定邀请歌曲关键词';
            musicV2DebugInvite('build-song:fail:empty-keyword');
            throw error;
        }

        let results = [];
        try {
            results = await musicV2SearchWithFallback(kw);
            musicV2DebugInvite('build-song:search:ok', { count: Array.isArray(results) ? results.length : 0 });
        } catch (primaryError) {
            musicV2DebugInvite('build-song:search:fail', {
                error: String(primaryError && primaryError.message ? primaryError.message : primaryError)
            });
            throw primaryError;
        }

        if (!Array.isArray(results) || !results.length) {
            const error = new Error('invite_song_not_found');
            error.userMessage = '未找到可邀请的歌曲，请换个关键词';
            musicV2DebugInvite('build-song:fail:no-results', { keyword: kw });
            throw error;
        }

        const top = results[0] || {};
        const mapped = {
            id: String(top.id || ''),
            title: String(top.title || '未命名歌曲'),
            artist: String(top.artist || '未知歌手'),
            cover: String(top.cover || ''),
            src: '',
            provider: 'netease-search'
        };
        if (!mapped.id) {
            const error = new Error('invite_song_invalid');
            error.userMessage = '未找到可邀请的歌曲，请换个关键词';
            musicV2DebugInvite('build-song:fail:invalid-top-result', { top: top });
            throw error;
        }
        let targetSong = null;
        let sid = '';
        if (persistToLibrary) {
            const saved = musicV2UpsertSong(mapped);
            sid = String((saved && saved.id) || mapped.id);
            targetSong = saved || null;
        } else {
            sid = String(mapped.id || '');
            const existing = musicV2GetSong(sid);
            if (existing) {
                targetSong = existing;
            } else {
                const transientSong = musicV2NormalizeSong(mapped);
                if (musicV2Runtime.transientSongs && typeof musicV2Runtime.transientSongs === 'object') {
                    musicV2Runtime.transientSongs[sid] = transientSong;
                }
                targetSong = transientSong;
            }
        }
        if (!sid) {
            const error = new Error('invite_song_invalid');
            error.userMessage = '未找到可邀请的歌曲，请换个关键词';
            musicV2DebugInvite('build-song:fail:upsert-invalid', { mapped: mapped, targetSong: targetSong });
            throw error;
        }
        try {
            await musicV2ResolveSongSource(sid, false);
            musicV2DebugInvite('build-song:resolve-src:ok', { songId: sid });
        } catch (resolveError) {
            musicV2DebugInvite('build-song:resolve-src:fail', {
                songId: sid,
                error: String(resolveError && resolveError.message ? resolveError.message : resolveError)
            });
        }
        const latestSong = musicV2GetSong(sid) || targetSong || mapped;
        musicV2DebugInvite('build-song:done', {
            songId: sid,
            title: String((latestSong && latestSong.title) || mapped.title || ''),
            artist: String((latestSong && latestSong.artist) || mapped.artist || ''),
            persistToLibrary: persistToLibrary
        });
        return {
            songId: sid,
            songTitle: String((latestSong && latestSong.title) || mapped.title || '未命名歌曲'),
            songArtist: String((latestSong && latestSong.artist) || mapped.artist || '未知歌手'),
            songCover: String((latestSong && latestSong.cover) || mapped.cover || MUSIC_V2_DEFAULT_COVER)
        };
    }

    function musicV2ParseSongUrl(data) {
        if (!data || typeof data !== 'object') return null;
        const target = Array.isArray(data.data) && data.data.length > 0
            ? data.data[0]
            : (Array.isArray(data.urls) && data.urls.length > 0 ? data.urls[0] : null);
        if (!target || typeof target !== 'object') return null;
        const src = String(target.url || target.src || '').trim();
        if (!src) return null;
        return {
            src: src,
            cover: '',
            provider: ''
        };
    }

    async function musicV2ResolveSongSource(songId, force) {
        const music = musicV2EnsureModel();
        const sid = String(songId);
        const song = musicV2GetSong(sid);
        if (!song) throw new Error('song_not_found');
        const metingBase = musicV2NormalizeApiBase(MUSIC_V2_METING_API_BASE);

        const cached = music.urlCache[sid];
        if (!force && song.src) return { src: song.src, cover: song.cover || '', provider: song.provider || '' };
        if (!force && cached && cached.src) {
            song.src = cached.src;
            if (!song.cover && cached.cover) song.cover = cached.cover;
            if (!song.provider && cached.provider) song.provider = cached.provider;
            if (!song.apiBase && cached.apiBase) song.apiBase = cached.apiBase;
            return { src: song.src, cover: song.cover || '', provider: song.provider || '', apiBase: song.apiBase || cached.apiBase || '' };
        }

        const resolved = {
            src: musicV2BuildMetingUrl(sid, 'url'),
            cover: song.cover || '',
            provider: musicV2GetApiProviderLabel(metingBase),
            apiBase: metingBase
        };

        if (!resolved || !resolved.src) throw new Error('resolve_failed');

        song.src = resolved.src;
        if (resolved.cover) song.cover = resolved.cover;
        if (resolved.provider) song.provider = resolved.provider;
        if (resolved.apiBase) song.apiBase = resolved.apiBase;
        music.urlCache[sid] = {
            src: resolved.src,
            cover: resolved.cover || song.cover || '',
            provider: resolved.provider || '',
            apiBase: resolved.apiBase || song.apiBase || '',
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

    function musicV2RenderLevelPill() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const levelPill = root.querySelector('#music-v2-level-pill');
        if (!levelPill) return;
        const music = musicV2EnsureModel();
        const profile = music.gamification && music.gamification.profile
            ? music.gamification.profile
            : { playCompleteCount: 0, level: 1 };
        const meta = musicV2ComputeProfileLevel(profile.playCompleteCount);
        const remain = Math.max(0, meta.nextNeed - meta.progressInLevel);
        levelPill.textContent = 'Lv.' + meta.level;
        levelPill.setAttribute('title', '距下级还差 ' + remain + ' 首');
        levelPill.setAttribute('aria-label', '当前等级 Lv.' + meta.level + '，距下级还差 ' + remain + ' 首');
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
        const modeBtn = root.querySelector('.music-v2-playback-mode-btn');
        const likeBtn = root.querySelector('.music-v2-like-btn');
        const currentPlaylistBtn = root.querySelector('.music-v2-current-playlist-btn, #song-view .sv-controls > i:last-child');
        const cover = song && song.cover ? song.cover : (music.cover || MUSIC_V2_DEFAULT_COVER);
        const playbackMode = musicV2GetPlaybackMode();
        const isLiked = song ? musicV2IsSongLiked(song.id) : false;

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
        musicV2RenderLevelPill();
        if (togetherAvatars && togetherAvatars.length >= 2) {
            const meAvatar = String((window.iphoneSimState && window.iphoneSimState.userProfile && window.iphoneSimState.userProfile.avatar) || MUSIC_V2_DEFAULT_COVER);
            const friend = activeSession ? musicV2GetContactById(activeSession.contactId) : null;
            togetherAvatars[0].src = meAvatar;
            togetherAvatars[1].src = String((friend && friend.avatar) || MUSIC_V2_DEFAULT_COVER);
            togetherAvatars[0].alt = 'Me';
            togetherAvatars[1].alt = friend ? musicV2GetContactDisplayName(friend) : 'Friend';
        }
        if (modeBtn) {
            modeBtn.className = musicV2GetPlaybackModeIcon(playbackMode) + ' clickable music-v2-playback-mode-btn';
            modeBtn.setAttribute('data-musicv2-action', 'toggle-playback-mode');
            modeBtn.style.fontSize = '24px';
            modeBtn.style.color = playbackMode === MUSIC_V2_PLAYBACK_MODE_PLAYLIST_LOOP
                ? 'var(--text-gray)'
                : 'var(--text-dark)';
            modeBtn.setAttribute('title', musicV2GetPlaybackModeLabel(playbackMode));
            modeBtn.setAttribute('aria-label', '播放模式：' + musicV2GetPlaybackModeLabel(playbackMode));
        }
        if (likeBtn) {
            likeBtn.className = (isLiked ? 'ri-heart-3-fill' : 'ri-heart-3-line') + ' clickable music-v2-like-btn';
            likeBtn.style.fontSize = '28px';
            likeBtn.style.color = isLiked ? '#ff3b30' : 'var(--text-dark)';
            likeBtn.setAttribute('data-musicv2-action', 'toggle-like-current-song');
            likeBtn.setAttribute('title', isLiked ? '取消喜欢' : '加入喜欢的歌曲');
            likeBtn.setAttribute('aria-label', isLiked ? '取消喜欢' : '加入喜欢的歌曲');
        }
        if (currentPlaylistBtn) {
            currentPlaylistBtn.className = 'ri-play-list-2-line clickable music-v2-current-playlist-btn';
            currentPlaylistBtn.setAttribute('data-musicv2-action', 'open-current-playlist-panel');
            currentPlaylistBtn.setAttribute('title', '当前播放列表');
            currentPlaylistBtn.setAttribute('aria-label', '打开当前播放列表');
        }

        musicV2ApplyLyricsMode();
        if (!song) musicV2PaintLyrics(null);
        if (song && (musicV2Runtime.lyricsRenderedSongId !== songId || musicV2Runtime.lyricsMode === 'lyrics')) {
            musicV2RenderLyrics(song);
        }
        musicV2RenderProgress();
        musicV2UpdatePlayIcons(!!music.playing);
        const currentPlaylistMask = root.querySelector('#music-v2-current-playlist-mask');
        if (currentPlaylistMask && currentPlaylistMask.classList.contains('active')) {
            musicV2RenderCurrentPlaylistPanel();
        }
        musicV2RenderFriends();
    }

    async function musicV2PlaySong(songId, playlistId) {
        const song = musicV2GetSong(songId);
        const audio = document.getElementById('bg-music');
        if (!song || !audio) {
            musicV2Toast('歌曲不可用');
            return;
        }
        const oneShot = musicV2Runtime.togetherOneShot && typeof musicV2Runtime.togetherOneShot === 'object'
            ? musicV2Runtime.togetherOneShot
            : null;
        if (oneShot && oneShot.active) {
            const oneShotSongId = String(oneShot.songId || '');
            const nextSongId = String(song.id || '');
            if (oneShotSongId && oneShotSongId !== nextSongId) {
                // User switched songs during one-shot playback; drop one-shot fallback to avoid stale forced return.
                musicV2ResetTogetherOneShot({ skipSyncAudioLoop: true });
            }
        }
        musicV2SyncAudioLoopByMode();
        if (playlistId) musicV2Runtime.activePlaylistId = String(playlistId);
        const currentMusic = musicV2EnsureModel();
        const isSongChanged = String(currentMusic.currentSongId || '') !== String(song.id);
        let didRestartFromBeginning = false;

        const run = async function (forceResolve) {
            if (
                song.src &&
                typeof window.isChatMediaReference === 'function' &&
                window.isChatMediaReference(song.src) &&
                typeof window.resolveChatMediaSrc === 'function'
            ) {
                const resolvedMediaSrc = await window.resolveChatMediaSrc(song.src);
                if (resolvedMediaSrc) song.src = resolvedMediaSrc;
                else throw new Error('media_resolve_failed');
            }
            if (!song.src || forceResolve) await musicV2ResolveSongSource(song.id, !!forceResolve);
            if (!song.src) throw new Error('no_src');
            if (audio.src !== song.src) {
                audio.src = song.src;
            } else if (Number.isFinite(audio.duration) && audio.currentTime >= Math.max(0, audio.duration - 0.25)) {
                // Restart from beginning when replaying the same track after it has ended.
                audio.currentTime = 0;
                didRestartFromBeginning = true;
            }
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
        musicV2TrackTogetherSongProgress(song.id);
        musicV2EnsurePlayQueue({ currentSongId: String(song.id), reason: 'play-song' });
        const shouldResetPlayCycle = isSongChanged
            || didRestartFromBeginning
            || (!isSongChanged && Number.isFinite(audio.currentTime) && audio.currentTime <= 0.35);
        if (shouldResetPlayCycle) {
            musicV2ResetPlayCycleTracker(song.id, 0);
        }
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

    function musicV2GetPlaybackMode() {
        const music = musicV2EnsureModel();
        return musicV2NormalizePlaybackMode(music.playbackMode);
    }

    function musicV2TogglePlaybackMode() {
        const music = musicV2EnsureModel();
        const current = musicV2NormalizePlaybackMode(music.playbackMode);
        const currentIndex = MUSIC_V2_PLAYBACK_MODE_ORDER.indexOf(current);
        const nextIndex = currentIndex >= 0
            ? (currentIndex + 1) % MUSIC_V2_PLAYBACK_MODE_ORDER.length
            : 0;
        const nextMode = MUSIC_V2_PLAYBACK_MODE_ORDER[nextIndex];
        musicV2ResetTogetherOneShot({ skipSyncAudioLoop: true });
        music.playbackMode = nextMode;
        musicV2EnsurePlayQueue({ forceRebuild: true, reason: 'mode-switch' });
        musicV2SyncAudioLoopByMode();
        musicV2Persist();
        musicV2RenderSongView();
        musicV2Toast('播放模式：' + musicV2GetPlaybackModeLabel(nextMode));
    }

    function musicV2SyncAudioLoopByMode() {
        const audio = document.getElementById('bg-music');
        if (!audio) return;
        const mode = musicV2GetPlaybackMode();
        const oneShot = musicV2Runtime.togetherOneShot && typeof musicV2Runtime.togetherOneShot === 'object'
            ? musicV2Runtime.togetherOneShot
            : null;
        const shouldLoop = mode === MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP && !(oneShot && oneShot.active);
        if (audio.loop !== shouldLoop) audio.loop = shouldLoop;
    }

    async function musicV2SkipByOffset(offset, options) {
        const opts = options || {};
        const silent = !!opts.silent;
        const reason = String(opts.reason || 'manual');
        const music = musicV2EnsureModel();
        const playbackMode = musicV2GetPlaybackMode();
        const queue = musicV2EnsurePlayQueue({ reason: 'skip' });
        const songIds = queue && Array.isArray(queue.orderedSongIds)
            ? queue.orderedSongIds.slice()
            : [];
        if (!songIds.length) {
            if (!silent) musicV2Toast('歌单暂无歌曲');
            music.playing = false;
            musicV2Runtime.lyricsMode = 'cover';
            musicV2Runtime.activeLyricIndex = -1;
            musicV2ApplyLyricsMode();
            musicV2Persist();
            musicV2RenderMiniPlayer();
            musicV2RenderSongView();
            return;
        }
        const step = Number(offset) < 0 ? -1 : 1;
        const currentSongId = music.currentSongId != null ? String(music.currentSongId) : '';
        if (playbackMode === MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP) {
            if (reason === 'auto-ended') {
                const oneShot = musicV2Runtime.togetherOneShot && typeof musicV2Runtime.togetherOneShot === 'object'
                    ? musicV2Runtime.togetherOneShot
                    : null;
                if (oneShot && oneShot.active) {
                    const oneShotSongId = String(oneShot.songId || '');
                    const returnSongId = String(oneShot.returnSongId || '');
                    const returnPlaylistId = String(oneShot.returnPlaylistId || (queue ? queue.playlistId : '') || '');
                    musicV2ResetTogetherOneShot({ skipSyncAudioLoop: true });
                    if (oneShotSongId && oneShotSongId === currentSongId && returnSongId && musicV2GetSong(returnSongId)) {
                        await musicV2PlaySong(returnSongId, returnPlaylistId);
                        return;
                    }
                }
                let staySongId = currentSongId;
                if (!staySongId) {
                    staySongId = songIds[0];
                }
                if (staySongId) {
                    await musicV2PlaySong(staySongId, queue ? queue.playlistId : '');
                }
                return;
            }
            musicV2ResetTogetherOneShot({ skipSyncAudioLoop: true });
            const playlistCtx = musicV2GetQueuePlaylistContext();
            const baseIds = playlistCtx.songIds;
            if (!baseIds.length) {
                if (!silent) musicV2Toast('歌单暂无歌曲');
                return;
            }
            const anchorIndex = currentSongId ? baseIds.indexOf(currentSongId) : -1;
            const currentIndexForManual = anchorIndex >= 0 ? anchorIndex : 0;
            const nextIndexForManual = (currentIndexForManual + step + baseIds.length) % baseIds.length;
            await musicV2PlaySong(baseIds[nextIndexForManual], playlistCtx.playlistId);
            return;
        }

        let currentIndex = Number.isFinite(queue.currentIndex) ? Math.floor(queue.currentIndex) : -1;
        if (currentIndex < 0 || currentIndex >= songIds.length) {
            currentIndex = currentSongId ? songIds.indexOf(currentSongId) : -1;
        }
        if (currentIndex < 0) currentIndex = 0;
        if (!currentSongId) {
            queue.currentIndex = currentIndex;
            await musicV2PlaySong(songIds[currentIndex], queue.playlistId || '');
            return;
        }
        const nextIndex = (currentIndex + step + songIds.length) % songIds.length;
        queue.currentIndex = nextIndex;
        await musicV2PlaySong(songIds[nextIndex], queue.playlistId || '');
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
            direction: String(invite.direction || 'outgoing'),
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

    window.musicV2HandleChatSendInviteAction = async function (contactId, payload) {
        const cid = String(contactId || '');
        const payloadText = String(payload || '').trim();
        musicV2DebugInvite('chat-action:start', {
            contactId: cid,
            payload: payloadText
        });
        if (!cid) {
            musicV2DebugInvite('chat-action:fail:invalid-contact-id', { contactId: contactId });
            return { ok: false, message: '联系人不可用' };
        }
        const contact = musicV2GetContactById(cid);
        if (!contact) {
            musicV2DebugInvite('chat-action:fail:contact-not-found', { contactId: cid });
            return { ok: false, message: '联系人不存在' };
        }

        const music = musicV2EnsureModel();
        const currentSong = musicV2GetCurrentSong();
        const isNowPlaying = !!(music.playing && currentSong);
        const shouldUseKeywordSong = !!payloadText;
        musicV2DebugInvite('chat-action:state', {
            isNowPlaying: isNowPlaying,
            currentSongId: String((currentSong && currentSong.id) || ''),
            shouldUseKeywordSong: shouldUseKeywordSong
        });

        let inviteSong = null;
        if (shouldUseKeywordSong) {
            const keyword = payloadText;
            try {
                inviteSong = await musicV2BuildInviteSongFromKeyword(keyword);
            } catch (error) {
                musicV2DebugInvite('chat-action:fail:build-song', {
                    keyword: keyword,
                    error: String(error && error.message ? error.message : error),
                    userMessage: String(error && error.userMessage ? error.userMessage : '')
                });
                return { ok: false, message: String(error && error.userMessage ? error.userMessage : '未找到可邀请的歌曲，请换个关键词') };
            }
        } else if (!isNowPlaying) {
            musicV2DebugInvite('chat-action:fail:keyword-required');
            return { ok: false, message: '当前未在听歌，请先指定邀请歌曲关键词' };
        }

        const invite = musicV2CreateInvite(cid, {
            senderIsUser: false,
            song: inviteSong || null
        });
        if (!invite) {
            const lastError = musicV2Runtime.lastInviteError && typeof musicV2Runtime.lastInviteError === 'object'
                ? musicV2Runtime.lastInviteError
                : null;
            const failMessage = lastError && lastError.message
                ? String(lastError.message)
                : '邀请发送失败，请稍后重试';
            if (lastError && String(lastError.code || '') === 'pending_exists') {
                const pendingInvite = musicV2GetPendingInviteForContactInternal(cid);
                if (
                    pendingInvite &&
                    String(pendingInvite.status || 'pending') === 'pending' &&
                    String(pendingInvite.direction || 'incoming') === 'incoming' &&
                    typeof window.openMusicListenInvitePrompt === 'function'
                ) {
                    setTimeout(() => {
                        try {
                            window.openMusicListenInvitePrompt(pendingInvite);
                        } catch (popupError) {
                            musicV2DebugInvite('chat-action:pending-popup-open-failed', {
                                contactId: cid,
                                inviteId: String(pendingInvite.inviteId || ''),
                                error: String(popupError && popupError.message ? popupError.message : popupError)
                            });
                        }
                    }, 20);
                }
            }
            musicV2DebugInvite('chat-action:fail:create-invite-null', {
                contactId: cid,
                usedSongId: String((inviteSong && inviteSong.songId) || ''),
                lastError: lastError
            });
            return { ok: false, message: failMessage };
        }
        musicV2DebugInvite('chat-action:done', {
            inviteId: String(invite.inviteId || ''),
            contactId: cid,
            songId: String(invite.songId || '')
        });
        return {
            ok: true,
            inviteId: String(invite.inviteId || ''),
            songId: String(invite.songId || ''),
            songTitle: String(invite.songTitle || '')
        };
    };

    window.musicV2HandleTogetherRemoteAction = async function (contactId, command, payload) {
        const cid = String(contactId || '');
        const cmd = String(command || '').trim().toUpperCase();
        const payloadText = String(payload || '').trim();
        if (!cid) return { ok: false, message: '联系人不可用' };
        if (!cmd) return { ok: false, message: '指令无效' };

        const active = musicV2GetActiveTogetherSession();
        if (!active || String(active.contactId || '') !== cid) {
            return { ok: false, message: '当前未与该联系人一起听' };
        }

        const song = musicV2GetCurrentSong();
        const audio = document.getElementById('bg-music');
        const safeRefresh = function () {
            musicV2Persist();
            musicV2RenderMiniPlayer();
            musicV2RenderSongView();
            musicV2RenderFriends();
        };

        if (cmd === 'MUSIC_TOGETHER_PAUSE') {
            if (audio && !audio.paused) audio.pause();
            if (song) musicV2SyncNowPlaying(song, false);
            safeRefresh();
            return { ok: true, message: '已暂停播放' };
        }

        if (cmd === 'MUSIC_TOGETHER_RESUME') {
            const targetSongId = String((song && song.id) || active.songId || '');
            if (!targetSongId || !musicV2GetSong(targetSongId)) {
                return { ok: false, message: '当前没有可恢复播放的歌曲' };
            }
            const playlistId = musicV2GetInviteAutoplayPlaylistId(targetSongId);
            await musicV2PlaySong(targetSongId, playlistId);
            return { ok: true, message: '已继续播放', songId: targetSongId };
        }

        if (cmd === 'MUSIC_TOGETHER_NEXT') {
            await musicV2SkipByOffset(1, { reason: 'remote-action-next', silent: true });
            const nextSong = musicV2GetCurrentSong();
            return {
                ok: true,
                message: '已切换下一首',
                songId: String(nextSong && nextSong.id ? nextSong.id : ''),
                songTitle: String(nextSong && nextSong.title ? nextSong.title : '')
            };
        }

        if (cmd === 'MUSIC_TOGETHER_PREV') {
            await musicV2SkipByOffset(-1, { reason: 'remote-action-prev', silent: true });
            const prevSong = musicV2GetCurrentSong();
            return {
                ok: true,
                message: '已切换上一首',
                songId: String(prevSong && prevSong.id ? prevSong.id : ''),
                songTitle: String(prevSong && prevSong.title ? prevSong.title : '')
            };
        }

        if (cmd === 'MUSIC_TOGETHER_SEARCH_PLAY') {
            if (!payloadText) return { ok: false, message: '请先提供要播放的歌曲关键词' };
            // Remote search-play during together mode should not write songs into the user's playlists/library.
            const inviteSong = await musicV2BuildInviteSongFromKeyword(payloadText, { persistToLibrary: false });
            const targetSongId = String(inviteSong.songId || '');
            const playbackMode = musicV2GetPlaybackMode();
            if (playbackMode === MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP) {
                await musicV2PlayTogetherSearchSongInSingleLoop(targetSongId);
            } else {
                await musicV2QueueTogetherSearchSong(targetSongId);
            }
            return {
                ok: true,
                message: '已搜索并播放',
                songId: targetSongId,
                songTitle: String(inviteSong.songTitle || '')
            };
        }

        if (cmd === 'MUSIC_TOGETHER_QUIT') {
            const music = musicV2EnsureModel();
            const currentActive = musicV2GetActiveTogetherSession();
            if (!currentActive || String(currentActive.contactId || '') !== cid) {
                return { ok: false, message: '当前未与该联系人一起听' };
            }
            const contact = musicV2GetContactById(currentActive.contactId);
            const contactName = contact ? musicV2GetContactDisplayName(contact) : '联系人';
            const startedAt = Number(currentActive.startedAt) || Date.now();
            const durationMs = Math.max(0, Date.now() - startedAt);
            const durationSec = Math.max(0, Math.floor(durationMs / 1000));
            const bondProgress = musicV2ApplyBondProgress(currentActive.contactId, durationSec);
            let songCount = Number(currentActive.songCount);
            if (!Number.isFinite(songCount) || songCount < 0) songCount = 0;
            songCount = Math.floor(songCount);
            if (songCount <= 0 && String(currentActive.lastSongId || currentActive.songId || '')) songCount = 1;

            music.listenTogether.activeSession = null;
            music.listenTogether.updatedAt = Date.now();
            musicV2ResetTogetherOneShot();
            musicV2Persist();
            musicV2RenderSongView();
            musicV2RenderFriends();
            musicV2RenderMiniPlayer();
            musicV2ShowTogetherSummaryModal({
                contactName: contactName,
                durationText: musicV2FormatDurationMs(durationMs),
                songCount: songCount
            });
            if (typeof window.sendMessage === 'function') {
                try {
                    window.sendMessage('[系统消息]: 对方结束了一起听', false, 'text', null, cid);
                } catch (error) {
                    // ignore messaging failure
                }
            }
            if (bondProgress && bondProgress.afterLevel > bondProgress.beforeLevel) {
                setTimeout(() => {
                    musicV2Toast('你与' + contactName + '的羁绊提升到 Lv.' + bondProgress.afterLevel);
                }, 220);
            }
            return { ok: true, message: '已结束一起听' };
        }

        return { ok: false, message: '暂不支持该一起听指令' };
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
            musicV2Runtime.selectedResultIds.clear();
            return;
        }
        if (!musicV2Runtime.results.length) {
            stateEl.textContent = '无结果';
            listEl.innerHTML = '';
            musicV2Runtime.selectedResultIds.clear();
            return;
        }

        const validIds = new Set(musicV2Runtime.results.map(song => String(song.id)));
        const selected = musicV2Runtime.selectedResultIds;
        Array.from(selected).forEach((sid) => {
            if (!validIds.has(String(sid))) selected.delete(String(sid));
        });
        const selectedCount = musicV2Runtime.results.reduce((count, song) => {
            return count + (selected.has(String(song.id)) ? 1 : 0);
        }, 0);
        const allSelected = musicV2Runtime.results.length > 0 && selectedCount === musicV2Runtime.results.length;

        stateEl.textContent = '找到 ' + musicV2Runtime.results.length + ' 首';
        const toolsHtml =
            '<div class="music-v2-search-tools">' +
                '<button class="music-v2-modal-btn" data-musicv2-action="toggle-result-select-all">' +
                    (allSelected ? '取消全选' : '全选') +
                '</button>' +
                '<span class="music-v2-search-picked">已选 ' + selectedCount + ' 首</span>' +
                '<button class="music-v2-action-btn music-v2-batch-add-btn" data-musicv2-action="batch-add-open-picker" ' + (selectedCount ? '' : 'disabled') + '>' +
                    '添加已选(' + selectedCount + ')' +
                '</button>' +
            '</div>';
        const rowsHtml = musicV2Runtime.results.map(song => {
            const songId = String(song.id);
            const isSelected = selected.has(songId);
            return (
                '<div class="list-item music-v2-result-item' + (isSelected ? ' selected' : '') + '">' +
                    '<button class="music-v2-result-check' + (isSelected ? ' active' : '') + '" data-musicv2-action="toggle-result-select" data-song-id="' + musicV2EscapeHtml(songId) + '" aria-label="选择歌曲">' +
                        '<i class="' + (isSelected ? 'ri-check-line' : 'ri-add-line') + '"></i>' +
                    '</button>' +
                '<img class="li-img" src="' + musicV2EscapeHtml(song.cover || MUSIC_V2_DEFAULT_COVER) + '">' +
                '<div class="li-info"><h4>' + musicV2EscapeHtml(song.title) + '</h4><p>' + musicV2EscapeHtml(song.artist) + '</p></div>' +
                '<button class="music-v2-action-btn" data-musicv2-action="toggle-result-select" data-song-id="' + musicV2EscapeHtml(songId) + '">' +
                    (isSelected ? '已选中' : '选择') +
                '</button>' +
            '</div>'
            );
        }).join('');
        listEl.innerHTML = toolsHtml + rowsHtml;
    }

    async function musicV2Search(keyword) {
        const kw = String(keyword || '').trim();
        musicV2Runtime.keyword = kw;
        musicV2Runtime.results = [];
        musicV2Runtime.error = '';
        musicV2Runtime.selectedResultIds.clear();
        if (!kw) {
            musicV2RenderSearch();
            return;
        }
        musicV2Runtime.loading = true;
        musicV2RenderSearch();
        try {
            musicV2Runtime.results = await musicV2SearchWithFallback(kw);
            musicV2Runtime.error = '';
        } catch (error) {
            musicV2Runtime.error = '网络繁忙，请稍后重试';
            musicV2Runtime.results = [];
        } finally {
            musicV2Runtime.loading = false;
            musicV2RenderSearch();
        }
    }

    function musicV2FormatFriendHomeMetric(value) {
        const safe = Math.max(0, Math.floor(Number(value) || 0));
        if (safe >= 100000000) return (safe / 100000000).toFixed(1).replace(/\.0$/, '') + '亿';
        if (safe >= 10000) return (safe / 10000).toFixed(1).replace(/\.0$/, '') + '万';
        if (safe >= 1000) return (safe / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
        return String(safe);
    }

    function musicV2FormatFriendHomeDate(ms) {
        const time = Number(ms);
        if (!Number.isFinite(time) || time <= 0) return '--';
        const date = new Date(time);
        return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }

    function musicV2BuildFriendHomeSeed(contact) {
        const source = `${String(contact && contact.id || '')}|${musicV2GetContactDisplayName(contact)}`;
        let seed = 0;
        for (let i = 0; i < source.length; i++) {
            seed = (seed * 31 + source.charCodeAt(i)) >>> 0;
        }
        return seed || 1;
    }

    function musicV2ExtractFriendHomeSignature(contact) {
        const candidates = [contact && contact.signature, contact && contact.persona, contact && contact.style, contact && contact.desc];
        for (let i = 0; i < candidates.length; i++) {
            const text = String(candidates[i] || '').trim();
            if (text) return text.slice(0, 88);
        }
        return '欢迎来听歌，也欢迎随时点歌催更。';
    }

    function musicV2SanitizePromptText(value, maxLength) {
        const text = String(value || '')
            .replace(/\r/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        const limit = Math.max(0, Math.floor(Number(maxLength) || 0));
        if (!limit) return text;
        return text.slice(0, limit);
    }

    function musicV2BuildFriendHomePersonaContext(contact) {
        const parts = [];
        const persona = musicV2SanitizePromptText(contact && contact.persona, 1600);
        const style = musicV2SanitizePromptText(contact && contact.style, 600);
        const signature = musicV2SanitizePromptText(contact && contact.signature, 260);
        const desc = musicV2SanitizePromptText(contact && contact.desc, 600);
        if (persona) parts.push('人设：' + persona);
        if (style) parts.push('说话风格：' + style);
        if (signature) parts.push('个性签名：' + signature);
        if (desc) parts.push('补充设定：' + desc);
        return parts.join('\n');
    }

    function musicV2BuildFriendHomeWorldbookContext(contact) {
        const state = window.iphoneSimState || {};
        const historyMap = state.chatHistory && typeof state.chatHistory === 'object' ? state.chatHistory : {};
        const history = contact && Array.isArray(historyMap[contact.id]) ? historyMap[contact.id] : [];

        if (typeof window.buildWechatWorldbookPrompt === 'function') {
            try {
                const promptText = String(window.buildWechatWorldbookPrompt(contact || {}, history) || '').trim();
                if (promptText) {
                    return musicV2SanitizePromptText(
                        promptText.replace(/^世界书信息\s*[:：]\s*/i, ''),
                        3200
                    );
                }
            } catch (error) {}
        }

        const worldbook = Array.isArray(state.worldbook) ? state.worldbook : [];
        if (!worldbook.length) return '';
        let activeEntries = worldbook.filter(entry => entry && entry.enabled);

        if (contact && Array.isArray(contact.linkedWbCategories)) {
            if (contact.linkedWbCategories.length > 0) {
                const categorySet = new Set(contact.linkedWbCategories.map(item => String(item || '')));
                activeEntries = activeEntries.filter(entry => categorySet.has(String(entry && entry.categoryId || '')));
            } else {
                activeEntries = [];
            }
        }
        if (!activeEntries.length) return '';

        const historyText = history
            .map(item => String(item && item.content || ''))
            .filter(Boolean)
            .join('\n');

        const matched = [];
        activeEntries.forEach((entry) => {
            if (!entry || typeof entry !== 'object') return;
            const content = musicV2SanitizePromptText(entry.content, 1200);
            if (!content) return;
            const keys = Array.isArray(entry.keys)
                ? entry.keys.map(key => String(key || '').trim()).filter(Boolean)
                : [];
            if (!keys.length) {
                matched.push(content);
                return;
            }
            if (historyText && keys.some(key => historyText.includes(key))) {
                matched.push(content);
            }
        });

        const picked = matched.length
            ? matched
            : activeEntries
                .map(entry => musicV2SanitizePromptText(entry && entry.content, 1200))
                .filter(Boolean);
        return musicV2SanitizePromptText(picked.slice(0, 8).join('\n'), 3200);
    }

    function musicV2ResolveFriendHomeUserPersonaContext(contact) {
        const state = window.iphoneSimState || {};
        const personas = Array.isArray(state.userPersonas) ? state.userPersonas : [];
        const userProfile = state.userProfile && typeof state.userProfile === 'object' ? state.userProfile : {};
        let persona = null;
        if (contact && contact.userPersonaId) {
            persona = personas.find(item => String(item && item.id || '') === String(contact.userPersonaId || '')) || null;
        }
        if (!persona && state.currentUserPersonaId) {
            persona = personas.find(item => String(item && item.id || '') === String(state.currentUserPersonaId || '')) || null;
        }
        const displayName = musicV2SanitizePromptText((persona && persona.name) || userProfile.name || '用户', 48) || '用户';
        const promptText = musicV2SanitizePromptText(
            (contact && contact.userPersonaPromptOverride) || (persona && persona.aiPrompt) || '',
            1800
        );
        return {
            name: displayName,
            prompt: promptText
        };
    }

    function musicV2BuildFriendHomeMemoryContext(contact) {
        if (!contact || !contact.id) return '';
        const state = window.iphoneSimState || {};
        const historyMap = state.chatHistory && typeof state.chatHistory === 'object' ? state.chatHistory : {};
        const history = Array.isArray(historyMap[contact.id]) ? historyMap[contact.id] : [];
        if (typeof window.buildMemoryContextByPolicy === 'function') {
            try {
                const contextText = String(window.buildMemoryContextByPolicy(contact, history, 'music-original') || '').trim();
                if (contextText) return musicV2SanitizePromptText(contextText, 3200);
            } catch (error) {}
        }
        const memories = Array.isArray(state.memories)
            ? state.memories
                .filter(item => item && String(item.contactId || '') === String(contact.id || ''))
                .sort((a, b) => Number(b.time || 0) - Number(a.time || 0))
            : [];
        if (!memories.length) return '';
        const lines = memories.slice(0, 10).map((memory) => {
            const content = musicV2SanitizePromptText(memory && memory.content, 180);
            return content ? ('- ' + content) : '';
        }).filter(Boolean);
        return musicV2SanitizePromptText(lines.join('\n'), 1800);
    }

    function musicV2BuildOriginalLyricsPrompt(contact, themeText) {
        const contactName = musicV2GetContactDisplayName(contact);
        const userPersona = musicV2ResolveFriendHomeUserPersonaContext(contact);
        const contactPersona = musicV2BuildFriendHomePersonaContext(contact);
        const memoryContext = musicV2BuildFriendHomeMemoryContext(contact);
        const worldbookContext = musicV2BuildFriendHomeWorldbookContext(contact);
        const theme = musicV2SanitizePromptText(themeText, 140);
        const lines = [
            `为联系人「${contactName}」写一首中文原创歌曲歌词。`,
            '要求：',
            '1. 歌词自然，像真人写作，不要模板腔。',
            '2. 包含 [Verse] 与 [Chorus]，总长度控制在 10-28 行。',
            '3. 情绪连贯，副歌要有记忆点，适合流行演唱。',
            '4. 禁止输出解释，只输出歌词正文与结构标签。',
            `主题参考：${theme || '不限，可结合人物关系自由发挥'}`
        ];
        if (contactPersona) {
            lines.push('\n【联系人人设】');
            lines.push(contactPersona);
        }
        if (userPersona && userPersona.name) {
            lines.push('\n【用户人设】');
            lines.push(`用户名：${userPersona.name}`);
            if (userPersona.prompt) lines.push(`用户设定：${userPersona.prompt}`);
        }
        if (memoryContext) {
            lines.push('\n【联系人记忆】');
            lines.push(memoryContext);
        }
        if (worldbookContext) {
            lines.push('\n【关联世界书】');
            lines.push(worldbookContext);
        }
        lines.push('\n请让歌词与以上设定保持一致，避免冲突。');
        return musicV2SanitizePromptText(lines.join('\n'), 1900);
    }

    function musicV2BuildOriginalMusicPrompt(contact, themeText) {
        const contactName = musicV2GetContactDisplayName(contact);
        const theme = musicV2SanitizePromptText(themeText, 120);
        const styleHint = musicV2SanitizePromptText(contact && contact.style, 120);
        const personaHint = musicV2SanitizePromptText(contact && contact.persona, 120);
        const parts = [
            'Mandarin Pop Ballad',
            'emotional',
            'clear lead vocal',
            '95 BPM',
            'warm modern arrangement'
        ];
        if (theme) parts.push(`theme: ${theme}`);
        if (styleHint) parts.push(`speaking style: ${styleHint}`);
        if (personaHint) parts.push(`persona vibe: ${personaHint}`);
        parts.push(`character voice reference: ${contactName}`);
        return musicV2SanitizePromptText(parts.join(', '), 420);
    }

    function musicV2BuildLyricSnippetFromText(lyricsText) {
        const lines = String(lyricsText || '')
            .split(/\n+/)
            .map(line => String(line || '').trim())
            .filter(Boolean)
            .filter(line => !/^\[[^\]]+\]$/.test(line))
            .slice(0, 4);
        if (!lines.length) return '';
        return lines.join(' / ');
    }

    function musicV2BuildFriendHomePlaylists(music, seed) {
        const songs = Array.isArray(music && music.songs) ? music.songs : [];
        if (!songs.length) return [];
        const ids = songs.map(item => String(item && item.id || '')).filter(Boolean);
        if (!ids.length) return [];
        const list = [];
        const titles = ['深夜循环', '私藏收藏'];
        for (let i = 0; i < titles.length; i++) {
            const pick = [];
            const start = (seed + i * 7) % ids.length;
            for (let j = 0; j < ids.length && pick.length < 5; j++) {
                const sid = ids[(start + j) % ids.length];
                if (!pick.includes(sid)) pick.push(sid);
            }
            if (!pick.length) continue;
            list.push({
                id: musicV2MakeId('fh_pl'),
                title: titles[i],
                songs: pick,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
        }
        return list;
    }

    function musicV2GetFriendHomeAiSettings() {
        const state = window.iphoneSimState || {};
        const s1 = state.aiSettings && typeof state.aiSettings === 'object' ? state.aiSettings : {};
        const s2 = state.aiSettings2 && typeof state.aiSettings2 === 'object' ? state.aiSettings2 : {};
        const selected = s1.url ? s1 : (s2.url ? s2 : s1);
        const url = String(selected.url || '').trim();
        const key = String(selected.key || '').replace(/[^\x00-\x7F]/g, '').trim();
        const model = String(selected.model || '').trim();
        const temperatureRaw = Number(selected.temperature);
        const temperature = Number.isFinite(temperatureRaw) ? Math.max(0, Math.min(1.2, temperatureRaw)) : 0.6;
        if (!url || !key || !model) return null;
        return { url, key, model, temperature };
    }

    function musicV2BuildChatCompletionsUrl(rawUrl) {
        const base = String(rawUrl || '').trim();
        if (!base) return '';
        if (/\/chat\/completions\/?$/i.test(base)) return base.replace(/\/+$/, '');
        return base.endsWith('/') ? (base + 'chat/completions') : (base + '/chat/completions');
    }

    function musicV2ExtractFirstJsonObject(text) {
        const raw = String(text || '').trim();
        if (!raw) return null;
        const stripFence = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        const candidates = [raw, stripFence];
        for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];
            if (!candidate) continue;
            try {
                const parsed = JSON.parse(candidate);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
            } catch (error) {}
            const start = candidate.indexOf('{');
            const end = candidate.lastIndexOf('}');
            if (start !== -1 && end !== -1 && end > start) {
                try {
                    const parsed = JSON.parse(candidate.slice(start, end + 1));
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
                } catch (error) {}
            }
        }
        return null;
    }

    function musicV2ClampProfileMetric(value, min, max, fallback) {
        const parsed = Math.floor(Number(value));
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(min, Math.min(max, parsed));
    }

    function musicV2NormalizeKeywordList(list, fallbackList, maxCount) {
        const arr = Array.isArray(list) ? list : [];
        const fallback = Array.isArray(fallbackList) ? fallbackList : [];
        const normalized = [];
        const seen = new Set();
        const push = (value) => {
            const text = String(value || '').trim();
            if (!text || seen.has(text)) return;
            seen.add(text);
            normalized.push(text);
        };
        arr.forEach(push);
        if (!normalized.length) fallback.forEach(push);
        return normalized.slice(0, Math.max(1, Math.floor(Number(maxCount) || 1)));
    }

    function musicV2NormalizeOptionalKeywordList(list, fallbackList, maxCount) {
        const arr = Array.isArray(list) ? list : [];
        const fallback = Array.isArray(fallbackList) ? fallbackList : [];
        const normalized = [];
        const seen = new Set();
        const push = (value) => {
            const text = String(value || '').trim();
            if (!text || seen.has(text)) return;
            seen.add(text);
            normalized.push(text);
        };
        arr.forEach(push);
        if (!normalized.length) fallback.forEach(push);
        const limit = Math.max(0, Math.floor(Number(maxCount) || 0));
        if (limit <= 0) return [];
        return normalized.slice(0, limit);
    }

    function musicV2EscapeRegExp(text) {
        return String(text == null ? '' : text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function musicV2InferPersonaAvoidKeywords(contact, personaContext, worldbookContext) {
        const text = [
            String(contact && contact.signature || ''),
            String(contact && contact.persona || ''),
            String(contact && contact.desc || ''),
            String(contact && contact.style || ''),
            String(personaContext || ''),
            String(worldbookContext || '')
        ].join('\n');
        if (!text.trim()) return [];
        const genreWords = [
            '重金属', '金属', '朋克', '硬核', '摇滚', '死亡金属',
            '说唱', 'rap', '电子', 'DJ', '电音', 'trap',
            '古典', '交响', '戏曲', '民谣', '乡村',
            '儿歌', '二次元', '动漫', '韩流', 'kpop', '日语歌', '英文歌'
        ];
        const out = [];
        const push = (word) => {
            const value = String(word || '').trim();
            if (!value) return;
            if (out.includes(value)) return;
            out.push(value);
        };
        for (let i = 0; i < genreWords.length; i++) {
            const word = genreWords[i];
            const escaped = musicV2EscapeRegExp(word);
            const rejectPattern = new RegExp(`(?:不听|不会听|讨厌|拒绝|排斥|不喜欢|不碰|禁听|别给我推)(?:[^\\n]{0,10})${escaped}`, 'i');
            if (rejectPattern.test(text)) push(word);
        }
        return out.slice(0, 12);
    }

    function musicV2GetFriendHomePersonaPolicy(contact, blueprint, personaContext, worldbookContext) {
        const apiAvoid = musicV2NormalizeOptionalKeywordList(
            blueprint && blueprint.avoidKeywords,
            [],
            16
        );
        const inferredAvoid = musicV2InferPersonaAvoidKeywords(contact, personaContext, worldbookContext);
        const avoidKeywords = musicV2NormalizeOptionalKeywordList(
            apiAvoid.concat(inferredAvoid),
            [],
            20
        );
        return {
            avoidKeywords: avoidKeywords,
            personaContext: String(personaContext || ''),
            worldbookContext: String(worldbookContext || '')
        };
    }

    function musicV2IsSongBlockedByAvoidKeywords(candidate, avoidKeywords) {
        const list = musicV2NormalizeOptionalKeywordList(avoidKeywords, [], 40);
        if (!list.length) return false;
        const haystack = (
            String(candidate && candidate.title || '') + ' ' +
            String(candidate && candidate.artist || '')
        ).toLowerCase();
        if (!haystack.trim()) return false;
        for (let i = 0; i < list.length; i++) {
            const kw = String(list[i] || '').trim().toLowerCase();
            if (!kw) continue;
            if (haystack.includes(kw)) return true;
        }
        return false;
    }

    async function musicV2ValidateSongByPersona(contact, candidate, policy, context) {
        const cid = String(contact && contact.id || '').trim();
        const sid = String(candidate && candidate.id || '').trim();
        if (!cid || !sid) return true;
        if (musicV2IsSongBlockedByAvoidKeywords(candidate, policy && policy.avoidKeywords)) {
            return false;
        }
        const settings = musicV2GetFriendHomeAiSettings();
        if (!settings) return true;
        const fetchUrl = musicV2BuildChatCompletionsUrl(settings.url);
        if (!fetchUrl) return true;

        const cacheMap = musicV2Runtime.friendHomePersonaFitCache && typeof musicV2Runtime.friendHomePersonaFitCache === 'object'
            ? musicV2Runtime.friendHomePersonaFitCache
            : (musicV2Runtime.friendHomePersonaFitCache = Object.create(null));
        const cacheKey = `${cid}::${sid}`;
        if (cacheKey && Object.prototype.hasOwnProperty.call(cacheMap, cacheKey)) {
            return !!cacheMap[cacheKey];
        }

        try {
            const personaContext = String(policy && policy.personaContext || musicV2BuildFriendHomePersonaContext(contact) || '').trim();
            const worldbookContext = String(policy && policy.worldbookContext || musicV2BuildFriendHomeWorldbookContext(contact) || '').trim();
            const avoidKeywords = musicV2NormalizeOptionalKeywordList(policy && policy.avoidKeywords, [], 20);
            const payload = {
                model: settings.model,
                temperature: 0,
                messages: [
                    {
                        role: 'system',
                        content: '你是音乐品味审核器。只输出一个 JSON 对象，不要解释，不要 markdown。字段: fit(boolean), reason(string)。如果歌曲与人设冲突，fit 必须是 false。'
                    },
                    {
                        role: 'user',
                        content: JSON.stringify({
                            scene: 'music_personal_home_song_filter',
                            contactName: musicV2GetContactDisplayName(contact),
                            contactPersona: personaContext || '无',
                            linkedWorldbook: worldbookContext || '无',
                            avoidKeywords: avoidKeywords,
                            song: {
                                id: sid,
                                title: String(candidate && candidate.title || ''),
                                artist: String(candidate && candidate.artist || '')
                            },
                            strictRule: '若歌曲明显违背人设（包括风格、价值观、禁忌），必须判定 fit=false。'
                        })
                    }
                ]
            };
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.key}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('HTTP_' + response.status);
            const data = await response.json();
            const content = String(
                (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
                || ''
            );
            const parsed = musicV2ExtractFirstJsonObject(content);
            if (!parsed || typeof parsed !== 'object' || typeof parsed.fit === 'undefined') {
                cacheMap[cacheKey] = true;
                return true;
            }
            const fit = String(parsed.fit).toLowerCase() === 'true' || parsed.fit === true || parsed.fit === 1;
            cacheMap[cacheKey] = fit;
            return fit;
        } catch (error) {
            if (context && typeof context === 'object') {
                context.validateErrors = Number(context.validateErrors || 0) + 1;
            }
            return true;
        }
    }

    function musicV2BuildFriendHomeApiFallbackBlueprint(contact, seed) {
        const name = musicV2GetContactDisplayName(contact);
        const personaContext = musicV2BuildFriendHomePersonaContext(contact);
        const worldbookContext = musicV2BuildFriendHomeWorldbookContext(contact);
        const inferredAvoid = musicV2InferPersonaAvoidKeywords(contact, personaContext, worldbookContext);
        return {
            following: 90 + (seed % 260),
            followers: 3000 + (seed % 30000),
            likes: 10000 + (seed % 90000),
            signature: musicV2ExtractFriendHomeSignature(contact),
            dynamic: [`${name} 正在练习下一首翻唱。`, '欢迎点歌催更。'],
            likedKeywords: [`${name} 热门`, '华语流行', '经典老歌', '翻唱'],
            avoidKeywords: inferredAvoid,
            playlists: [
                { title: '深夜循环', keywords: ['深夜', '抒情', '华语'] },
                { title: '私藏收藏', keywords: ['经典', '热歌', '情歌'] }
            ]
        };
    }

    async function musicV2FetchFriendHomeApiBlueprint(contact, seed) {
        const fallback = musicV2BuildFriendHomeApiFallbackBlueprint(contact, seed);
        const settings = musicV2GetFriendHomeAiSettings();
        if (!settings) return fallback;
        const fetchUrl = musicV2BuildChatCompletionsUrl(settings.url);
        if (!fetchUrl) return fallback;
        const personaContext = musicV2BuildFriendHomePersonaContext(contact);
        const worldbookContext = musicV2BuildFriendHomeWorldbookContext(contact);
        const payload = {
            model: settings.model,
            temperature: settings.temperature,
            messages: [
                {
                    role: 'system',
                    content: '你是音乐社交资料生成器。只输出一个JSON对象，不要markdown，不要解释。字段: following, followers, likes, signature, dynamic(字符串数组), likedKeywords(字符串数组), avoidKeywords(字符串数组，可为空), playlists(数组，元素含title和keywords字符串数组)。内容需中文、自然、简洁。你必须严格遵守 contactPersona（联系人人设）与 linkedWorldbook（关联世界书）；若这两者有内容，生成结果不得冲突。禁止把该人设明显不会听的歌曲类型放入 likedKeywords 或 playlists 关键词。'
                },
                {
                    role: 'user',
                    content: JSON.stringify({
                        scene: 'music_personal_home',
                        contactName: musicV2GetContactDisplayName(contact),
                        contactHint: String((contact && (contact.signature || contact.persona || contact.desc || '')) || '').slice(0, 120),
                        contactPersona: personaContext || '无',
                        linkedWorldbook: worldbookContext || '无',
                        consistencyRules: [
                            '主页信息、动态、歌单主题必须与联系人人设一致',
                            '若给定了世界书内容，优先沿用其中设定，不得冲突',
                            '必须给出 avoidKeywords，列出该人设不会听或应规避的风格/题材关键词',
                            '严禁生成与人设冲突的歌单关键词'
                        ],
                        requirements: {
                            following: '50-3000整数',
                            followers: '1000-800000整数',
                            likes: '5000-5000000整数',
                            dynamic: '2-4条',
                            likedKeywords: '3-6个关键词',
                            avoidKeywords: '0-8个关键词',
                            playlists: '2-3个歌单，每个歌单2-4个关键词'
                        }
                    })
                }
            ]
        };
        try {
            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.key}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('HTTP_' + response.status);
            const data = await response.json();
            const content = String(
                (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content)
                || ''
            );
            const parsed = musicV2ExtractFirstJsonObject(content);
            if (!parsed) return fallback;
            return {
                following: musicV2ClampProfileMetric(parsed.following, 50, 3000, fallback.following),
                followers: musicV2ClampProfileMetric(parsed.followers, 1000, 800000, fallback.followers),
                likes: musicV2ClampProfileMetric(parsed.likes, 5000, 5000000, fallback.likes),
                signature: String(parsed.signature || fallback.signature || '').trim().slice(0, 88) || fallback.signature,
                dynamic: musicV2NormalizeKeywordList(parsed.dynamic, fallback.dynamic, MUSIC_V2_FRIEND_HOME_API_MAX_DYNAMIC),
                likedKeywords: musicV2NormalizeKeywordList(parsed.likedKeywords, fallback.likedKeywords, 8),
                avoidKeywords: musicV2NormalizeOptionalKeywordList(parsed.avoidKeywords, fallback.avoidKeywords, 12),
                playlists: (Array.isArray(parsed.playlists) ? parsed.playlists : fallback.playlists).map((item, index) => {
                    const title = String(item && item.title || fallback.playlists[index % fallback.playlists.length].title || `歌单${index + 1}`).trim().slice(0, 24) || `歌单${index + 1}`;
                    const fallbackKeywords = fallback.playlists[index % fallback.playlists.length].keywords || fallback.likedKeywords;
                    const keywords = musicV2NormalizeKeywordList(item && item.keywords, fallbackKeywords, 6);
                    return { title, keywords };
                }).slice(0, MUSIC_V2_FRIEND_HOME_API_MAX_PLAYLISTS)
            };
        } catch (error) {
            console.warn('[music-v2] friend-home api blueprint failed', error);
            return fallback;
        }
    }

    async function musicV2CollectSongIdsByKeywords(keywords, maxCount, sharedUsedSet, options) {
        const opts = options && typeof options === 'object' ? options : {};
        const limit = Math.max(1, Math.floor(Number(maxCount) || 1));
        const out = [];
        const used = sharedUsedSet instanceof Set ? sharedUsedSet : new Set();
        const personaPolicy = opts.personaPolicy && typeof opts.personaPolicy === 'object'
            ? opts.personaPolicy
            : null;
        const contact = opts.contact || null;
        const validateContext = opts.validateContext && typeof opts.validateContext === 'object'
            ? opts.validateContext
            : null;
        const list = musicV2NormalizeKeywordList(keywords, ['华语流行'], 12);
        for (let i = 0; i < list.length && out.length < limit; i++) {
            const kw = list[i];
            let results = [];
            try {
                results = await musicV2SearchWithFallback(kw);
            } catch (error) {
                results = [];
            }
            if (!Array.isArray(results) || !results.length) continue;
            for (let j = 0; j < results.length && out.length < limit; j++) {
                const candidate = results[j];
                if (!candidate || !candidate.id) continue;
                if (musicV2IsSongBlockedByAvoidKeywords(candidate, personaPolicy && personaPolicy.avoidKeywords)) continue;
                if (contact && personaPolicy) {
                    const usedBudget = Number(validateContext && validateContext.used || 0);
                    const withinBudget = usedBudget < MUSIC_V2_FRIEND_HOME_API_PERSONA_VALIDATE_LIMIT;
                    if (withinBudget) {
                        if (validateContext) validateContext.used = usedBudget + 1;
                        const fit = await musicV2ValidateSongByPersona(contact, candidate, personaPolicy, validateContext);
                        if (!fit) continue;
                    }
                }
                const saved = musicV2UpsertSong({
                    id: String(candidate.id),
                    title: String(candidate.title || '未命名歌曲'),
                    artist: String(candidate.artist || '未知歌手'),
                    cover: String(candidate.cover || ''),
                    src: '',
                    provider: 'friend-home-api'
                });
                const sid = String(saved && saved.id || candidate.id);
                if (!sid || used.has(sid)) continue;
                used.add(sid);
                out.push(sid);
            }
        }
        return out;
    }

    async function musicV2HydrateFriendHomeProfileFromApi(contactId, options) {
        const cid = String(contactId || '').trim();
        if (!cid) return null;
        const opts = options && typeof options === 'object' ? options : {};
        const music = musicV2EnsureModel();
        musicV2EnsureFriendHomeProfiles(music);
        const storedProfile = music.friendHomeProfiles[cid];
        const contact = musicV2GetContactById(cid);
        if (!storedProfile || !contact) return storedProfile || null;

        const now = Date.now();
        const lastGeneratedAt = Number(storedProfile.apiGeneratedAt || 0);
        if (!opts.force && lastGeneratedAt > 0 && (now - lastGeneratedAt) < MUSIC_V2_FRIEND_HOME_API_REFRESH_MS) {
            return storedProfile;
        }
        if (musicV2Runtime.friendHomeApiLoadingMap[cid]) return storedProfile;
        musicV2Runtime.friendHomeApiLoadingMap[cid] = true;

        try {
            const seed = musicV2BuildFriendHomeSeed(contact);
            const blueprint = await musicV2FetchFriendHomeApiBlueprint(contact, seed);
            const personaContext = musicV2BuildFriendHomePersonaContext(contact);
            const worldbookContext = musicV2BuildFriendHomeWorldbookContext(contact);
            const personaPolicy = musicV2GetFriendHomePersonaPolicy(contact, blueprint, personaContext, worldbookContext);
            const validateContext = {
                used: 0,
                validateErrors: 0
            };
            const usedSongIds = new Set();
            const likedSongIds = await musicV2CollectSongIdsByKeywords(
                blueprint.likedKeywords,
                MUSIC_V2_FRIEND_HOME_API_MAX_LIKED_SONGS,
                usedSongIds,
                { contact, personaPolicy, validateContext }
            );
            const customPlaylists = [];
            const playlistBlueprints = Array.isArray(blueprint.playlists) ? blueprint.playlists : [];
            for (let i = 0; i < playlistBlueprints.length && customPlaylists.length < MUSIC_V2_FRIEND_HOME_API_MAX_PLAYLISTS; i++) {
                const item = playlistBlueprints[i] || {};
                const songs = await musicV2CollectSongIdsByKeywords(
                    item.keywords,
                    MUSIC_V2_FRIEND_HOME_API_MAX_PLAYLIST_SONGS,
                    usedSongIds,
                    { contact, personaPolicy, validateContext }
                );
                if (!songs.length) continue;
                customPlaylists.push({
                    id: String(item.id || musicV2MakeId('fh_pl')),
                    title: String(item.title || `歌单${i + 1}`).trim().slice(0, 24) || `歌单${i + 1}`,
                    songs: songs,
                    createdAt: Number(item.createdAt || now),
                    updatedAt: now
                });
            }
            if (!customPlaylists.length) {
                const seedSongs = likedSongIds.slice();
                if (seedSongs.length) {
                    const splitSize = Math.max(2, Math.ceil(seedSongs.length / 2));
                    const poolA = seedSongs.slice(0, splitSize);
                    const poolB = seedSongs.slice(splitSize);
                    if (poolA.length) {
                        customPlaylists.push({
                            id: musicV2MakeId('fh_pl'),
                            title: '私藏收藏',
                            songs: poolA,
                            createdAt: now,
                            updatedAt: now
                        });
                    }
                    if (poolB.length) {
                        customPlaylists.push({
                            id: musicV2MakeId('fh_pl'),
                            title: '最近偏爱',
                            songs: poolB,
                            createdAt: now,
                            updatedAt: now
                        });
                    }
                }
            }

            storedProfile.following = musicV2ClampProfileMetric(blueprint.following, 50, 3000, storedProfile.following || (90 + (seed % 260)));
            storedProfile.followers = musicV2ClampProfileMetric(blueprint.followers, 1000, 800000, storedProfile.followers || (3000 + (seed % 30000)));
            storedProfile.likes = musicV2ClampProfileMetric(blueprint.likes, 5000, 5000000, storedProfile.likes || (10000 + (seed % 90000)));
            storedProfile.signature = String(blueprint.signature || storedProfile.signature || musicV2ExtractFriendHomeSignature(contact)).slice(0, 88);
            storedProfile.dynamic = musicV2NormalizeKeywordList(blueprint.dynamic, storedProfile.dynamic || [`${musicV2GetContactDisplayName(contact)} 正在练习下一首翻唱。`], MUSIC_V2_FRIEND_HOME_API_MAX_DYNAMIC);
            storedProfile.likesSongIds = musicV2UniqueValidSongIds(
                likedSongIds,
                new Set((music.songs || []).map(item => String(item && item.id || '')))
            );
            storedProfile.customPlaylists = customPlaylists;
            storedProfile.personaAvoidKeywords = musicV2NormalizeOptionalKeywordList(personaPolicy.avoidKeywords, [], 20);
            storedProfile.apiGeneratedAt = now;
            storedProfile.apiSource = 'remote';
            storedProfile.updatedAt = now;
            music.friendHomeProfiles[cid] = storedProfile;
            musicV2Persist();

            if (String(musicV2Runtime.friendHomeContactId || '') === cid) {
                musicV2Runtime.friendHomeData = storedProfile;
                musicV2RenderFriendHomeProfile(storedProfile);
            }
            console.info('[music-v2] friend-home profile hydrated by api', {
                contactId: cid,
                likesSongCount: Array.isArray(storedProfile.likesSongIds) ? storedProfile.likesSongIds.length : 0,
                customPlaylistCount: Array.isArray(storedProfile.customPlaylists) ? storedProfile.customPlaylists.length : 0,
                personaFilterValidated: Number(validateContext.used || 0),
                personaFilterApiErrors: Number(validateContext.validateErrors || 0),
                personaAvoidKeywordCount: Array.isArray(storedProfile.personaAvoidKeywords) ? storedProfile.personaAvoidKeywords.length : 0
            });
            return storedProfile;
        } finally {
            delete musicV2Runtime.friendHomeApiLoadingMap[cid];
        }
    }

    function musicV2NormalizeFriendHomeWork(work, fallbackArtist) {
        const src = work && typeof work === 'object' ? work : {};
        const playCount = Math.max(0, Math.floor(Number(src.playCount || src.plays || 0) || 0));
        const durationSecRaw = Number(src.durationSec || src.audioDurationSec || src.duration || 0);
        const durationSec = Number.isFinite(durationSecRaw) && durationSecRaw > 0 ? durationSecRaw : 0;
        const fullLyrics = String(src.lyrics || src.fullLyrics || '').trim();
        const lyricsData = musicV2NormalizeLyricsData(src.lyricsData, fullLyrics, durationSec);
        const lyricSnippet = String(src.lyricSnippet || '').trim() || musicV2BuildLyricSnippetFromText(fullLyrics);
        return {
            id: String(src.id || musicV2MakeId('fh_work')),
            title: String(src.title || src.songTitle || '未命名作品'),
            artist: String(src.artist || src.author || fallbackArtist || '联系人'),
            cover: String(src.cover || src.songCover || MUSIC_V2_DEFAULT_COVER),
            audio: String(src.audio || src.src || ''),
            mode: String(src.mode || 'cover'),
            playCount: playCount,
            grade: String(src.grade || (playCount > 5000 ? 'SS' : 'S')),
            createdAt: Number(src.createdAt || Date.now()) || Date.now(),
            sourceSongId: String(src.sourceSongId || ''),
            sourceAudioUrl: String(src.sourceAudioUrl || ''),
            songId: String(src.songId || src.musicSongId || ''),
            durationSec: durationSec,
            lyrics: fullLyrics,
            lyricsData: lyricsData,
            lyricSnippet: lyricSnippet
        };
    }

    function musicV2EnsureFriendHomeProfiles(music) {
        if (!music || typeof music !== 'object') return;
        if (!music.friendHomeProfiles || typeof music.friendHomeProfiles !== 'object' || Array.isArray(music.friendHomeProfiles)) {
            music.friendHomeProfiles = {};
        }
        const contacts = Array.isArray(window.iphoneSimState && window.iphoneSimState.contacts) ? window.iphoneSimState.contacts : [];
        const validContactMap = {};
        contacts.forEach((contact) => {
            const cid = String(contact && contact.id || '').trim();
            if (cid) validContactMap[cid] = contact;
        });
        Object.keys(music.friendHomeProfiles).forEach((cid) => {
            if (!validContactMap[cid]) {
                delete music.friendHomeProfiles[cid];
                return;
            }
            const contact = validContactMap[cid];
            const profile = music.friendHomeProfiles[cid] || {};
            const seed = musicV2BuildFriendHomeSeed(contact);
            const likes = Array.isArray(music.playlists)
                ? (music.playlists.find(pl => String(pl && pl.id) === MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED) || null)
                : null;
            const validSongIds = new Set((music.songs || []).map(item => String(item && item.id || '')));
            const likesSongIds = musicV2UniqueValidSongIds(Array.isArray(profile.likesSongIds) ? profile.likesSongIds : (likes && likes.songs ? likes.songs : []), validSongIds);
            const customPlaylists = Array.isArray(profile.customPlaylists) && profile.customPlaylists.length
                ? profile.customPlaylists.map((item) => {
                    const songs = musicV2UniqueValidSongIds(item && item.songs, validSongIds);
                    if (!songs.length) return null;
                    return {
                        id: String(item.id || musicV2MakeId('fh_pl')),
                        title: String(item.title || '自建歌单'),
                        songs: songs,
                        createdAt: Number(item.createdAt || Date.now()),
                        updatedAt: Number(item.updatedAt || Date.now())
                    };
                }).filter(Boolean)
                : musicV2BuildFriendHomePlaylists(music, seed);
            const name = musicV2GetContactDisplayName(contact);
            const works = Array.isArray(profile.works)
                ? profile.works.map(item => musicV2NormalizeFriendHomeWork(item, name)).slice(0, 36)
                : [];
            music.friendHomeProfiles[cid] = {
                contactId: cid,
                scene: MUSIC_V2_FRIEND_HOME_SCENE,
                following: Math.max(0, Math.floor(Number(profile.following || (90 + (seed % 260))) || 0)),
                followers: Math.max(0, Math.floor(Number(profile.followers || (3000 + (seed % 30000))) || 0)),
                likes: Math.max(0, Math.floor(Number(profile.likes || (10000 + (seed % 90000))) || 0)),
                signature: String(profile.signature || musicV2ExtractFriendHomeSignature(contact)),
                likesSongIds: likesSongIds,
                customPlaylists: customPlaylists,
                personaAvoidKeywords: musicV2NormalizeOptionalKeywordList(profile.personaAvoidKeywords, [], 20),
                dynamic: Array.isArray(profile.dynamic) && profile.dynamic.length
                    ? profile.dynamic.map(item => String(item || '').trim()).filter(Boolean).slice(0, 24)
                    : [`${name} 正在练习下一首翻唱。`, '欢迎点歌催更。'],
                works: works,
                apiGeneratedAt: Number(profile.apiGeneratedAt || 0) || 0,
                apiSource: String(profile.apiSource || ''),
                createdAt: Number(profile.createdAt || Date.now()),
                updatedAt: Number(profile.updatedAt || Date.now())
            };
        });
    }

    function musicV2GetFriendHomeProfile(contactId) {
        const cid = String(contactId || '').trim();
        if (!cid) return null;
        const contact = musicV2GetContactById(cid);
        if (!contact) return null;
        const music = musicV2EnsureModel();
        musicV2EnsureFriendHomeProfiles(music);
        if (!music.friendHomeProfiles[cid]) {
            const seed = musicV2BuildFriendHomeSeed(contact);
            const likes = musicV2GetPlaylist(MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED);
            const likesSongIds = likes && Array.isArray(likes.songs) ? likes.songs.slice(0, 24) : [];
            music.friendHomeProfiles[cid] = {
                contactId: cid,
                scene: MUSIC_V2_FRIEND_HOME_SCENE,
                following: 90 + (seed % 260),
                followers: 3000 + (seed % 30000),
                likes: 10000 + (seed % 90000),
                signature: musicV2ExtractFriendHomeSignature(contact),
                likesSongIds: likesSongIds,
                customPlaylists: musicV2BuildFriendHomePlaylists(music, seed),
                personaAvoidKeywords: [],
                dynamic: [`${musicV2GetContactDisplayName(contact)} 正在练习下一首翻唱。`, '欢迎点歌催更。'],
                works: [],
                apiGeneratedAt: 0,
                apiSource: '',
                createdAt: Date.now(),
                updatedAt: Date.now()
            };
            musicV2Persist();
        }
        return music.friendHomeProfiles[cid];
    }

    function musicV2PersistFriendHomeProfile(profileArg) {
        const profile = profileArg && typeof profileArg === 'object'
            ? profileArg
            : musicV2Runtime.friendHomeData;
        if (!profile) return;
        profile.updatedAt = Date.now();
        musicV2Persist();
    }

    function musicV2ResolveSongListByIds(songIds) {
        const arr = Array.isArray(songIds) ? songIds : [];
        const out = [];
        arr.forEach((sid) => {
            const song = musicV2GetSong(sid);
            if (!song) return;
            out.push(song);
        });
        return out;
    }

    function musicV2BuildFriendHomePlaylistBuckets(profile) {
        const buckets = [];
        if (!profile || typeof profile !== 'object') return buckets;

        const likedSongIds = musicV2UniqueValidSongIds(profile.likesSongIds, null);
        buckets.push({
            id: 'fh_pl_liked_' + String(profile.contactId || ''),
            title: '喜欢的歌曲',
            songIds: likedSongIds,
            playbackPlaylistId: MUSIC_V2_SYSTEM_PLAYLIST_ID_LIKED
        });

        const customPlaylists = Array.isArray(profile.customPlaylists) ? profile.customPlaylists : [];
        customPlaylists.forEach((playlist, index) => {
            const title = String(playlist && playlist.title || ('自建歌单 ' + (index + 1))).trim();
            const songIds = musicV2UniqueValidSongIds(playlist && playlist.songs, null);
            buckets.push({
                id: String(playlist && playlist.id || musicV2MakeId('fh_pl')),
                title: title || ('自建歌单 ' + (index + 1)),
                songIds: songIds,
                playbackPlaylistId: MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL
            });
        });

        return buckets;
    }

    function musicV2OpenFriendHomePlaylistPage(bucketId) {
        const bid = String(bucketId || '').trim();
        const profile = musicV2Runtime.friendHomeData;
        if (!bid || !profile) return;
        const bucket = musicV2BuildFriendHomePlaylistBuckets(profile).find(item => String(item && item.id || '') === bid);
        if (!bucket) {
            musicV2Toast('歌单不存在');
            return;
        }
        const songs = musicV2ResolveSongListByIds(bucket.songIds);
        musicV2Runtime.friendHomePlaylistPageData = {
            id: bid,
            title: String(bucket.title || '歌单'),
            songIds: Array.isArray(bucket.songIds) ? bucket.songIds.slice() : [],
            cover: String((songs[0] && songs[0].cover) || MUSIC_V2_DEFAULT_COVER),
            playbackPlaylistId: String(bucket.playbackPlaylistId || MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL)
        };
        console.info('[music-v2] open friend-home playlist page', {
            bucketId: bid,
            title: musicV2Runtime.friendHomePlaylistPageData.title,
            songCount: musicV2Runtime.friendHomePlaylistPageData.songIds.length
        });
        musicV2ExitPlaylistSelectionMode();
        musicV2RenderPlaylistPage();
        window.musicV2OpenPage('page-playlist');
    }

    function musicV2StopFriendHomeAudio() {
        if (musicV2Runtime.friendHomeAudio && typeof musicV2Runtime.friendHomeAudio.pause === 'function') {
            try { musicV2Runtime.friendHomeAudio.pause(); } catch (error) {}
        }
        musicV2Runtime.friendHomeAudio = null;
    }

    function musicV2ResetFriendHomePlayState() {
        const root = musicV2Runtime.root;
        if (!root) return;
        musicV2StopFriendHomeAudio();
        musicV2Runtime.friendHomePlaying = false;
        const record = root.querySelector('#music-v2-fh-record');
        const icon = root.querySelector('#music-v2-fh-play-icon');
        if (record) record.classList.remove('playing');
        if (icon) {
            icon.classList.remove('ri-pause-fill');
            icon.classList.add('ri-play-fill');
        }
    }

    function musicV2RenderFriendHomeTabs() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const tabNodes = root.querySelectorAll('.music-v2-fh-tab');
        tabNodes.forEach((tabNode) => {
            const tab = String(tabNode.getAttribute('data-tab') || '').toLowerCase();
            if (tab === musicV2Runtime.friendHomeActiveTab) tabNode.classList.add('active');
            else tabNode.classList.remove('active');
        });
    }

    function musicV2RenderFriendHomeMainList() {
        const root = musicV2Runtime.root;
        const profile = musicV2Runtime.friendHomeData;
        if (!root || !profile) return;
        const list = root.querySelector('#music-v2-fh-main-list');
        if (!list) return;
        const tab = String(musicV2Runtime.friendHomeActiveTab || 'works');

        if (tab === 'dynamic') {
            const rows = Array.isArray(profile.dynamic) ? profile.dynamic : [];
            list.innerHTML = rows.length
                ? rows.map(item => '<div class="music-v2-fh-dynamic-item">' + musicV2EscapeHtml(item) + '</div>').join('')
                : '<div class="music-v2-fh-empty">TA 还没有发布动态</div>';
            return;
        }

        if (tab === 'likes') {
            const playlistBuckets = musicV2BuildFriendHomePlaylistBuckets(profile);
            const playlistRows = playlistBuckets.map((bucket) => {
                const bid = String(bucket && bucket.id || '');
                const songs = musicV2ResolveSongListByIds(bucket.songIds);
                const cover = songs[0] && songs[0].cover ? songs[0].cover : MUSIC_V2_DEFAULT_COVER;
                return (
                    '<div class="music-v2-fh-playlist-group">' +
                        '<button class="music-v2-fh-playlist-card clickable" data-musicv2-action="open-friend-home-playlist" data-playlist-id="' + musicV2EscapeHtml(bid) + '">' +
                            '<img class="music-v2-fh-playlist-cover" src="' + musicV2EscapeHtml(cover) + '">' +
                            '<span class="music-v2-fh-playlist-main">' +
                                '<strong>' + musicV2EscapeHtml(bucket.title || '歌单') + '</strong>' +
                                '<small>' + musicV2EscapeHtml(String(songs.length)) + ' 首歌曲</small>' +
                            '</span>' +
                            '<i class="ri-arrow-right-s-line"></i>' +
                        '</button>' +
                    '</div>'
                );
            }).join('');
            list.innerHTML = playlistRows || '<div class="music-v2-fh-empty">暂无可展示歌单</div>';
            return;
        }

        const works = Array.isArray(profile.works) ? profile.works : [];
        list.innerHTML = works.length
            ? works.map((work) => (
                '<button class="music-v2-fh-work-item clickable" data-musicv2-action="open-friend-home-work" data-work-id="' + musicV2EscapeHtml(work.id) + '">' +
                    '<div class="music-v2-fh-work-cover"><img src="' + musicV2EscapeHtml(work.cover || MUSIC_V2_DEFAULT_COVER) + '"></div>' +
                    '<div class="music-v2-fh-work-info">' +
                        '<div class="music-v2-fh-work-title">' + musicV2EscapeHtml(work.title || 'Untitled') + '</div>' +
                        '<div class="music-v2-fh-work-meta">' +
                            '<span>' + musicV2EscapeHtml(musicV2FormatFriendHomeDate(work.createdAt)) + '</span><span>·</span><span><i class="ri-play-fill"></i> ' + musicV2EscapeHtml(musicV2FormatFriendHomeMetric(work.playCount || 0)) + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="music-v2-fh-grade">' + musicV2EscapeHtml(work.grade || 'S') + '</div>' +
                '</button>'
            )).join('')
            : '<div class="music-v2-fh-empty">还没有作品，点击右上角「催更」试试</div>';
    }

    function musicV2RenderFriendHomeProfile(profile) {
        const root = musicV2Runtime.root;
        if (!root || !profile) return;
        const contact = musicV2GetContactById(profile.contactId);
        const name = root.querySelector('#music-v2-fh-name');
        const uid = root.querySelector('#music-v2-fh-uid');
        const avatar = root.querySelector('#music-v2-fh-avatar');
        const following = root.querySelector('#music-v2-fh-following');
        const followers = root.querySelector('#music-v2-fh-followers');
        const likes = root.querySelector('#music-v2-fh-likes');
        const bio = root.querySelector('#music-v2-fh-bio');
        const scene = root.querySelector('#music-v2-fh-scene');
        if (name) name.textContent = musicV2GetContactDisplayName(contact);
        if (uid) uid.textContent = String(contact && contact.wechatId || ('ID: ' + String(profile.contactId || '').replace(/\D+/g, '').slice(-8)));
        if (avatar) avatar.src = String(contact && contact.avatar || MUSIC_V2_DEFAULT_COVER);
        if (following) following.textContent = musicV2FormatFriendHomeMetric(profile.following);
        if (followers) followers.textContent = musicV2FormatFriendHomeMetric(profile.followers);
        if (likes) likes.textContent = musicV2FormatFriendHomeMetric(profile.likes);
        if (bio) bio.textContent = String(profile.signature || '');
        if (scene) scene.textContent = '';
        musicV2RenderFriendHomeTabs();
        musicV2RenderFriendHomeMainList();
    }

    function musicV2OpenFriendMusicHome(contactId) {
        const cid = String(contactId || '').trim();
        if (!cid) return;
        const root = musicV2Runtime.root;
        if (!root) return;
        const mask = root.querySelector('#music-v2-friend-home-mask');
        if (!mask) return;
        const profile = musicV2GetFriendHomeProfile(cid);
        if (!profile) {
            musicV2Toast('联系人不可用');
            return;
        }
        musicV2Runtime.friendHomeContactId = cid;
        musicV2Runtime.friendHomeData = profile;
        musicV2Runtime.friendHomeActiveWorkId = '';
        musicV2Runtime.friendHomeActiveTab = 'works';
        musicV2Runtime.friendHomeOpenPlaylistId = '';
        musicV2Runtime.friendHomePlaylistPageData = null;
        console.info('[music-v2] open friend home', {
            contactId: cid,
            worksCount: Array.isArray(profile.works) ? profile.works.length : 0
        });
        musicV2RenderFriendHomeProfile(profile);
        musicV2ResetFriendHomePlayState();
        const main = root.querySelector('#music-v2-friend-page-main');
        const detail = root.querySelector('#music-v2-friend-page-detail');
        if (main) {
            main.classList.remove('music-v2-fh-page-left');
            main.classList.add('music-v2-fh-page-active');
        }
        if (detail) {
            detail.classList.remove('music-v2-fh-page-active');
            detail.classList.add('music-v2-fh-page-right');
        }
        mask.classList.add('active');
        const lastGeneratedAt = Number(profile.apiGeneratedAt || 0);
        const shouldHydrateByApi = !lastGeneratedAt || (Date.now() - lastGeneratedAt) > MUSIC_V2_FRIEND_HOME_API_REFRESH_MS;
        if (shouldHydrateByApi) {
            musicV2Toast('正在通过 API 生成主页资料...');
        }
        musicV2HydrateFriendHomeProfileFromApi(cid).catch((error) => {
            console.warn('[music-v2] hydrate friend home profile failed', error);
        });
    }

    function musicV2CloseFriendMusicHome() {
        const root = musicV2Runtime.root;
        if (!root) return;
        if (musicV2Runtime.friendHomeGenerating) {
            musicV2Toast('正在生成作品，请稍候');
            return;
        }
        const mask = root.querySelector('#music-v2-friend-home-mask');
        const requestMask = root.querySelector('#music-v2-fh-request-mask') || document.getElementById('music-v2-fh-request-mask');
        const generateMask = root.querySelector('#music-v2-fh-generate-mask') || document.getElementById('music-v2-fh-generate-mask');
        if (mask) mask.classList.remove('active');
        if (requestMask) requestMask.classList.remove('active');
        if (generateMask) generateMask.classList.remove('active');
        musicV2Runtime.friendHomeContactId = '';
        musicV2Runtime.friendHomeData = null;
        musicV2Runtime.friendHomeActiveWorkId = '';
        musicV2Runtime.friendHomeActiveTab = 'works';
        musicV2Runtime.friendHomeOpenPlaylistId = '';
        musicV2Runtime.friendHomePlaylistPageData = null;
        musicV2Runtime.friendHomeRequesting = false;
        musicV2Runtime.friendHomeGenerating = false;
    }

    function musicV2SetFriendHomeTab(tab) {
        const normalized = String(tab || '').toLowerCase();
        musicV2Runtime.friendHomeActiveTab = MUSIC_V2_FRIEND_HOME_TABS.includes(normalized) ? normalized : 'works';
        if (musicV2Runtime.friendHomeActiveTab !== 'likes') {
            musicV2Runtime.friendHomeOpenPlaylistId = '';
        }
        musicV2RenderFriendHomeTabs();
        musicV2RenderFriendHomeMainList();
    }

    function musicV2GetActiveFriendHomeWork() {
        const profile = musicV2Runtime.friendHomeData;
        if (!profile || !Array.isArray(profile.works) || !profile.works.length) return null;
        const workId = String(musicV2Runtime.friendHomeActiveWorkId || '');
        if (!workId) return profile.works[0];
        return profile.works.find(item => String(item && item.id) === workId) || profile.works[0];
    }

    function musicV2BuildFriendHomeWorkSongId(profile, work) {
        const pid = String(profile && profile.contactId || '').trim();
        const wid = String(work && work.id || '').trim();
        if (!pid || !wid) return '';
        return 'fhw_song_' + pid + '_' + wid;
    }

    function musicV2EnsureFriendHomeWorkSong(profile, work) {
        if (!profile || !work) return null;
        const sid = String(work.songId || musicV2BuildFriendHomeWorkSongId(profile, work) || '').trim();
        if (!sid) return null;
        work.songId = sid;
        const workMode = String(work.mode || '').trim().toLowerCase();
        const lyricsSourceTag = workMode === 'original'
            ? 'friend-home-original'
            : 'friend-home-cover';
        const fallbackLyrics = (
            String(work.lyrics || '').trim()
            || String(work.lyricSnippet || '')
                .split(/\s*\/\s*/)
                .map(line => String(line || '').trim())
                .filter(Boolean)
                .join('\n')
        );
        let normalizedLyricsData = musicV2NormalizeLyricsData(work.lyricsData, fallbackLyrics, Number(work.durationSec) || 0);
        if (!normalizedLyricsData.length) {
            const sourceSid = String(work.sourceSongId || '').trim();
            const sourceSong = sourceSid ? musicV2GetSong(sourceSid) : null;
            if (sourceSong && Array.isArray(sourceSong.lyricsData) && sourceSong.lyricsData.length) {
                normalizedLyricsData = sourceSong.lyricsData
                    .map((item) => ({
                        time: Number(item && item.time) || 0,
                        text: String(item && item.text || '').trim()
                    }))
                    .filter((item) => !!item.text);
            }
        }
        work.lyricsData = normalizedLyricsData;
        const song = musicV2UpsertSong({
            id: sid,
            title: String(work.title || '未命名作品'),
            artist: String(work.artist || musicV2GetContactDisplayName(musicV2GetContactById(profile.contactId))),
            cover: String(work.cover || MUSIC_V2_DEFAULT_COVER),
            src: String(work.audio || ''),
            provider: 'friend-home-work',
            lyricsData: normalizedLyricsData,
            lyricsFile: 'friend-home:' + String(work.id || sid),
            lyricsSource: lyricsSourceTag,
            lyricsUpdatedAt: Date.now()
        });
        return song;
    }

    function musicV2BuildFriendHomeWorksQueueContext(contactId, songIds) {
        const cid = String(contactId || '').trim();
        const ids = musicV2UniqueValidSongIds(songIds, null).filter((sid) => !!musicV2GetSong(sid));
        if (!cid || !ids.length) {
            musicV2Runtime.friendHomeWorksQueueContext = null;
            return null;
        }
        const context = {
            contactId: cid,
            playlistId: 'fhw_queue_' + cid,
            songIds: ids,
            signature: 'fhw:' + cid + ':' + ids.join('|')
        };
        musicV2Runtime.friendHomeWorksQueueContext = context;
        return context;
    }

    function musicV2RenderFriendHomeWorkDetail(work) {
        const root = musicV2Runtime.root;
        if (!root || !work) return;
        const title = root.querySelector('#music-v2-fh-detail-title');
        const author = root.querySelector('#music-v2-fh-detail-author');
        const lyric = root.querySelector('#music-v2-fh-detail-lyric');
        const recordImg = root.querySelector('#music-v2-fh-record-img');
        if (title) title.textContent = String(work.title || 'Untitled');
        if (author) author.textContent = String(work.artist || '联系人');
        if (lyric) lyric.textContent = String(work.lyricSnippet || '轻触播放，听听这段翻唱。');
        if (recordImg) recordImg.src = String(work.cover || MUSIC_V2_DEFAULT_COVER);
    }

    async function musicV2OpenFriendHomeWork(workId) {
        const root = musicV2Runtime.root;
        const profile = musicV2Runtime.friendHomeData;
        if (!root || !profile || !Array.isArray(profile.works) || !profile.works.length) return;
        const selected = profile.works.find(item => String(item && item.id) === String(workId || '')) || profile.works[0];
        if (!selected) return;
        const workSongs = [];
        const works = Array.isArray(profile.works) ? profile.works : [];
        for (let i = 0; i < works.length; i++) {
            const song = musicV2EnsureFriendHomeWorkSong(profile, works[i]);
            if (song && song.id) workSongs.push(String(song.id));
        }
        const selectedSong = musicV2EnsureFriendHomeWorkSong(profile, selected);
        if (!selectedSong || !String(selectedSong.src || '').trim()) {
            musicV2Toast('该作品还没有可播放音频');
            return;
        }
        musicV2Runtime.friendHomeActiveWorkId = String(selected.id || '');
        musicV2BuildFriendHomeWorksQueueContext(profile.contactId, workSongs);
        musicV2PersistFriendHomeProfile(profile);

        await musicV2PlaySong(selectedSong.id, '');
        const mask = root.querySelector('#music-v2-friend-home-mask');
        const requestMask = root.querySelector('#music-v2-fh-request-mask') || document.getElementById('music-v2-fh-request-mask');
        const generateMask = root.querySelector('#music-v2-fh-generate-mask') || document.getElementById('music-v2-fh-generate-mask');
        if (mask) mask.classList.remove('active');
        if (requestMask) requestMask.classList.remove('active');
        if (generateMask) generateMask.classList.remove('active');
        window.musicV2ToggleSongView('solo');
        musicV2Runtime.lyricsMode = 'lyrics';
        musicV2ApplyLyricsMode();
        const songForLyrics = musicV2GetSong(selectedSong.id) || selectedSong;
        musicV2RenderLyrics(songForLyrics).catch(() => {});
        const audio = document.getElementById('bg-music');
        musicV2SyncLyrics(audio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    }

    function musicV2CloseFriendHomeDetail() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const main = root.querySelector('#music-v2-friend-page-main');
        const detail = root.querySelector('#music-v2-friend-page-detail');
        if (detail) {
            detail.classList.remove('music-v2-fh-page-active');
            detail.classList.add('music-v2-fh-page-right');
        }
        if (main) {
            main.classList.remove('music-v2-fh-page-left');
            main.classList.add('music-v2-fh-page-active');
        }
    }

    async function musicV2ToggleFriendHomePlay() {
        const root = musicV2Runtime.root;
        const work = musicV2GetActiveFriendHomeWork();
        if (!root || !work) return;
        const record = root.querySelector('#music-v2-fh-record');
        const icon = root.querySelector('#music-v2-fh-play-icon');
        if (!record || !icon) return;

        if (musicV2Runtime.friendHomePlaying) {
            musicV2StopFriendHomeAudio();
            musicV2Runtime.friendHomePlaying = false;
            record.classList.remove('playing');
            icon.classList.remove('ri-pause-fill');
            icon.classList.add('ri-play-fill');
            return;
        }

        let src = String(work.audio || '').trim();
        if (!src) {
            musicV2Toast('该作品还没有可播放音频');
            return;
        }
        if (typeof window.isChatMediaReference === 'function' && window.isChatMediaReference(src) && typeof window.resolveChatMediaSrc === 'function') {
            src = await window.resolveChatMediaSrc(src);
        }
        if (!src) {
            musicV2Toast('音频资源不可用');
            return;
        }

        const audio = new Audio(src);
        audio.addEventListener('ended', () => {
            musicV2Runtime.friendHomePlaying = false;
            record.classList.remove('playing');
            icon.classList.remove('ri-pause-fill');
            icon.classList.add('ri-play-fill');
            musicV2StopFriendHomeAudio();
        });
        try {
            await audio.play();
            musicV2StopFriendHomeAudio();
            musicV2Runtime.friendHomeAudio = audio;
            musicV2Runtime.friendHomePlaying = true;
            record.classList.add('playing');
            icon.classList.remove('ri-play-fill');
            icon.classList.add('ri-pause-fill');
            work.playCount = Math.max(0, Math.floor(Number(work.playCount || 0))) + 1;
            musicV2PersistFriendHomeProfile();
        } catch (error) {
            musicV2Toast('播放失败，请稍后重试');
        }
    }

    function musicV2NormalizeFriendHomeRequestMode(rawMode) {
        const mode = String(rawMode || '').trim().toLowerCase();
        if (mode === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_ORIGINAL) return MUSIC_V2_FRIEND_HOME_REQUEST_MODE_ORIGINAL;
        return MUSIC_V2_FRIEND_HOME_REQUEST_MODE_COVER;
    }

    function musicV2GetFriendHomeRequestModeMeta(mode) {
        const normalized = musicV2NormalizeFriendHomeRequestMode(mode);
        if (normalized === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_ORIGINAL) {
            return {
                mode: normalized,
                inputLabel: '主题或关键词（可选）',
                inputPlaceholder: '例如：夏夜、错过、海边日落',
                submitText: '生成原创作品',
                loadingTitle: '原创生成中',
                loadingStatus: '正在生成原创作品，请稍候...'
            };
        }
        return {
            mode: MUSIC_V2_FRIEND_HOME_REQUEST_MODE_COVER,
            inputLabel: '歌名或链接（留空则默认当前播放）',
            inputPlaceholder: '例如：红 / 网易云链接',
            submitText: '生成翻唱作品',
            loadingTitle: '翻唱生成中',
            loadingStatus: '正在生成翻唱作品，请稍候...'
        };
    }

    function musicV2RenderFriendHomeRequestModeUi() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const mode = musicV2NormalizeFriendHomeRequestMode(musicV2Runtime.friendHomeRequestMode);
        const meta = musicV2GetFriendHomeRequestModeMeta(mode);
        const coverBtn = root.querySelector('#music-v2-fh-request-mode-cover') || document.getElementById('music-v2-fh-request-mode-cover');
        const originalBtn = root.querySelector('#music-v2-fh-request-mode-original') || document.getElementById('music-v2-fh-request-mode-original');
        const inputLabel = root.querySelector('#music-v2-fh-request-input-label') || document.getElementById('music-v2-fh-request-input-label');
        const input = root.querySelector('#music-v2-fh-request-input') || document.getElementById('music-v2-fh-request-input');
        const submit = root.querySelector('#music-v2-fh-request-submit') || document.getElementById('music-v2-fh-request-submit');
        if (coverBtn) {
            coverBtn.classList.toggle('active', mode === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_COVER);
            coverBtn.setAttribute('aria-pressed', mode === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_COVER ? 'true' : 'false');
        }
        if (originalBtn) {
            originalBtn.classList.toggle('active', mode === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_ORIGINAL);
            originalBtn.setAttribute('aria-pressed', mode === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_ORIGINAL ? 'true' : 'false');
        }
        if (inputLabel) inputLabel.textContent = meta.inputLabel;
        if (input && !musicV2Runtime.friendHomeGenerating) input.placeholder = meta.inputPlaceholder;
        if (submit && !musicV2Runtime.friendHomeGenerating) submit.textContent = meta.submitText;
    }

    function musicV2SetFriendHomeRequestMode(mode) {
        musicV2Runtime.friendHomeRequestMode = musicV2NormalizeFriendHomeRequestMode(mode);
        musicV2RenderFriendHomeRequestModeUi();
    }

    function musicV2OpenFriendHomeRequestPanel() {
        const root = musicV2Runtime.root;
        if (!root) {
            console.warn('[music-v2] open request panel failed: root missing');
            return;
        }
        if (!musicV2Runtime.friendHomeContactId && musicV2Runtime.friendHomeData && musicV2Runtime.friendHomeData.contactId) {
            musicV2Runtime.friendHomeContactId = String(musicV2Runtime.friendHomeData.contactId || '').trim();
        }
        if (!musicV2Runtime.friendHomeContactId) {
            console.warn('[music-v2] open request panel failed: contactId missing');
            musicV2Toast('请先进入联系人主页');
            return;
        }
        let mask = root.querySelector('#music-v2-fh-request-mask') || document.getElementById('music-v2-fh-request-mask');
        if (!mask) {
            musicV2EnsureFeatureNodes(root);
            mask = root.querySelector('#music-v2-fh-request-mask') || document.getElementById('music-v2-fh-request-mask');
        }
        const input = root.querySelector('#music-v2-fh-request-input') || document.getElementById('music-v2-fh-request-input');
        const submit = root.querySelector('#music-v2-fh-request-submit') || document.getElementById('music-v2-fh-request-submit');
        musicV2Runtime.friendHomeRequesting = false;
        musicV2SetFriendHomeRequestMode(MUSIC_V2_FRIEND_HOME_REQUEST_MODE_COVER);
        musicV2SetFriendHomeGenerateLoading(false);
        if (input) input.value = '';
        if (submit) submit.disabled = false;
        musicV2RenderFriendHomeRequestModeUi();
        if (mask) {
            mask.classList.add('active');
            console.info('[music-v2] request panel opened', {
                contactId: String(musicV2Runtime.friendHomeContactId || ''),
                hasInput: !!input,
                hasSubmit: !!submit
            });
        } else {
            console.warn('[music-v2] open request panel failed: request mask missing');
            musicV2Toast('催更面板未加载，请重试');
        }
    }

    function musicV2CloseFriendHomeRequestPanel() {
        const root = musicV2Runtime.root;
        if (!root) return;
        if (musicV2Runtime.friendHomeGenerating) {
            musicV2Toast('正在生成作品，请稍候');
            return;
        }
        const mask = root.querySelector('#music-v2-fh-request-mask') || document.getElementById('music-v2-fh-request-mask');
        if (mask) mask.classList.remove('active');
        musicV2Runtime.friendHomeRequesting = false;
    }

    function musicV2SetFriendHomeGenerateLoading(loading, statusText) {
        const root = musicV2Runtime.root;
        const isLoading = !!loading;
        const status = String(statusText || '').trim();
        musicV2Runtime.friendHomeGenerating = isLoading;
        if (!root) return;
        const mask = root.querySelector('#music-v2-fh-generate-mask') || document.getElementById('music-v2-fh-generate-mask');
        const titleNode = root.querySelector('#music-v2-fh-generate-title') || document.getElementById('music-v2-fh-generate-title');
        const statusNode = root.querySelector('#music-v2-fh-generate-status') || document.getElementById('music-v2-fh-generate-status');
        const input = root.querySelector('#music-v2-fh-request-input') || document.getElementById('music-v2-fh-request-input');
        const submit = root.querySelector('#music-v2-fh-request-submit') || document.getElementById('music-v2-fh-request-submit');
        const coverBtn = root.querySelector('#music-v2-fh-request-mode-cover') || document.getElementById('music-v2-fh-request-mode-cover');
        const originalBtn = root.querySelector('#music-v2-fh-request-mode-original') || document.getElementById('music-v2-fh-request-mode-original');
        const modeMeta = musicV2GetFriendHomeRequestModeMeta(musicV2Runtime.friendHomeRequestMode);
        if (input) input.disabled = isLoading;
        if (coverBtn) coverBtn.disabled = isLoading;
        if (originalBtn) originalBtn.disabled = isLoading;
        if (submit) {
            submit.disabled = isLoading;
            submit.textContent = isLoading ? '生成中...' : modeMeta.submitText;
        }
        if (titleNode) titleNode.textContent = modeMeta.loadingTitle;
        if (statusNode) {
            statusNode.textContent = status || modeMeta.loadingStatus;
        }
        if (mask) {
            if (isLoading) mask.classList.add('active');
            else mask.classList.remove('active');
        }
    }

    async function musicV2ResolveFriendHomeRequestSong(input) {
        const query = String(input || '').trim();
        const currentSong = musicV2GetCurrentSong();
        if (!query && currentSong) {
            await musicV2ResolveSongSource(currentSong.id, false).catch(() => null);
            return {
                songId: String(currentSong.id || ''),
                title: String(currentSong.title || '未命名歌曲'),
                artist: String(currentSong.artist || '未知歌手'),
                cover: String(currentSong.cover || MUSIC_V2_DEFAULT_COVER),
                audioUrl: String(currentSong.src || ''),
                lyricSnippet: ''
            };
        }

        const idMatch = query.match(/(?:id=|song\/)(\d{5,})/i);
        if (idMatch && idMatch[1]) {
            const sid = String(idMatch[1]);
            const detail = await musicV2FetchNeteaseSongDetail(sid).catch(() => null);
            const mapped = musicV2UpsertSong({
                id: sid,
                title: String(detail && detail.title || '未命名歌曲'),
                artist: String(detail && detail.artist || '未知歌手'),
                cover: String(detail && detail.cover || ''),
                src: ''
            });
            await musicV2ResolveSongSource(sid, false).catch(() => null);
            const latest = musicV2GetSong(sid) || mapped;
            return {
                songId: sid,
                title: String(latest && latest.title || '未命名歌曲'),
                artist: String(latest && latest.artist || '未知歌手'),
                cover: String(latest && latest.cover || MUSIC_V2_DEFAULT_COVER),
                audioUrl: String(latest && latest.src || ''),
                lyricSnippet: ''
            };
        }

        const inviteSong = await musicV2BuildInviteSongFromKeyword(query, { persistToLibrary: true });
        const sid = String(inviteSong && inviteSong.songId || '');
        if (!sid) throw new Error('song_not_found');
        await musicV2ResolveSongSource(sid, false).catch(() => null);
        const song = musicV2GetSong(sid);
        if (!song) throw new Error('song_not_found');
        return {
            songId: sid,
            title: String(song.title || inviteSong.songTitle || '未命名歌曲'),
            artist: String(song.artist || inviteSong.songArtist || '未知歌手'),
            cover: String(song.cover || inviteSong.songCover || MUSIC_V2_DEFAULT_COVER),
            audioUrl: String(song.src || ''),
            lyricSnippet: ''
        };
    }

    async function musicV2BuildFriendHomeWorkLyricsBundle(songInfo) {
        const sid = String(songInfo && songInfo.songId || '').trim();
        const textLines = [];
        let lyricsData = [];
        if (sid) {
            try {
                const lyric = await musicV2FetchLyrics(sid);
                const items = Array.isArray(lyric && lyric.lines) ? lyric.lines : [];
                lyricsData = items
                    .map((item) => {
                        const text = String(item && item.text || '').trim();
                        const time = Number(item && item.time);
                        if (!text) return null;
                        return {
                            time: Number.isFinite(time) && time >= 0 ? time : 0,
                            text: text
                        };
                    })
                    .filter(Boolean);
                lyricsData
                    .map(item => String(item && item.text || '').trim())
                    .filter(Boolean)
                    .forEach((line) => textLines.push(line));
            } catch (error) {}
        }
        if (!textLines.length) {
            textLines.push(`给你唱《${String(songInfo && songInfo.title || '这首歌')}》`);
            textLines.push('你点歌我来唱');
        }
        const lyricsText = textLines.join('\n');
        if (!lyricsData.length) {
            lyricsData = musicV2BuildLyricsDataFromText(lyricsText, 0);
        }
        return {
            lyrics: lyricsText,
            lyricsData: lyricsData,
            lyricSnippet: musicV2BuildLyricSnippetFromText(lyricsText)
        };
    }

    function musicV2BuildOriginalFallbackLyrics(contact, themeText) {
        const contactName = musicV2GetContactDisplayName(contact);
        const theme = musicV2SanitizePromptText(themeText, 80);
        const subject = theme || '想你的夜晚';
        return [
            '[Verse]',
            `${contactName}把故事写进了风里`,
            `你在${subject}里慢慢靠近`,
            '心跳像未寄出的信',
            '[Chorus]',
            '让我把爱唱成你的名字',
            '每一句都落在你眼睛',
            '如果今晚月色正好',
            '就把这一首送给你'
        ].join('\n');
    }

    async function musicV2GenerateOriginalLyrics(contact, themeText) {
        const genLyrics = window.musicV2GenerateMinimaxLyrics || window.generateMinimaxLyrics;
        const prompt = musicV2BuildOriginalLyricsPrompt(contact, themeText);
        if (typeof genLyrics !== 'function') {
            return {
                lyrics: musicV2BuildOriginalFallbackLyrics(contact, themeText),
                songTitle: '',
                styleTags: ''
            };
        }
        const result = await genLyrics({
            mode: 'write_full_song',
            prompt: prompt
        }, { suppressAlert: true });
        const lyrics = musicV2SanitizePromptText(result && result.lyrics, 3500) || musicV2BuildOriginalFallbackLyrics(contact, themeText);
        return {
            lyrics: lyrics,
            songTitle: musicV2SanitizePromptText(result && result.songTitle, 48),
            styleTags: musicV2SanitizePromptText(result && result.styleTags, 120)
        };
    }

    async function musicV2PersistFriendHomeAudioValue(audioValue, workId) {
        const raw = String(audioValue || '').trim();
        if (!raw) return '';
        if (!/^data:audio\//i.test(raw)) return raw;
        if (typeof window.saveChatMediaBlob !== 'function') return raw;
        try {
            const blob = await fetch(raw).then(resp => resp.blob());
            const mediaRef = await window.saveChatMediaBlob(blob, {
                type: blob.type || 'audio/mpeg',
                name: `${workId || 'friend-home'}.mp3`
            });
            return String(mediaRef || '').trim() || raw;
        } catch (error) {
            return raw;
        }
    }

    async function musicV2SubmitFriendHomeRequest() {
        const root = musicV2Runtime.root;
        const profile = musicV2Runtime.friendHomeData;
        if (!root || !profile) return;
        if (musicV2Runtime.friendHomeRequesting) return;
        const input = root.querySelector('#music-v2-fh-request-input') || document.getElementById('music-v2-fh-request-input');
        const submit = root.querySelector('#music-v2-fh-request-submit') || document.getElementById('music-v2-fh-request-submit');
        const query = String(input && input.value || '').trim();
        const mode = musicV2NormalizeFriendHomeRequestMode(musicV2Runtime.friendHomeRequestMode);
        const genCover = window.musicV2GenerateMinimaxMusicCover || window.generateMinimaxMusicCover;
        const genTts = window.musicV2GenerateMinimaxTTS || window.generateMinimaxTTS;
        const genOriginal = window.musicV2GenerateMinimaxOriginalMusic || window.generateMinimaxOriginalMusic;
        if (mode === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_COVER && (typeof genCover !== 'function' || typeof genTts !== 'function')) {
            musicV2Toast('生成接口未就绪');
            return;
        }
        if (mode === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_ORIGINAL && typeof genOriginal !== 'function') {
            musicV2Toast('原创作曲接口未就绪');
            return;
        }

        musicV2Runtime.friendHomeRequesting = true;
        musicV2SetFriendHomeGenerateLoading(true, mode === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_ORIGINAL ? '正在准备原创创作...' : '正在解析歌曲信息...');
        musicV2Toast('正在催更生成...');
        try {
            const contact = musicV2GetContactById(profile.contactId);
            const workId = musicV2MakeId('fh_work');
            let newWork = null;

            if (mode === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_COVER) {
                musicV2SetFriendHomeGenerateLoading(true, '正在解析歌曲信息...');
                const songInfo = await musicV2ResolveFriendHomeRequestSong(query);
                if (!songInfo || !songInfo.audioUrl) throw new Error('song_audio_missing');
                musicV2SetFriendHomeGenerateLoading(true, '正在准备歌词片段...');
                const lyricBundle = await musicV2BuildFriendHomeWorkLyricsBundle(songInfo);
                const lyrics = String(lyricBundle && lyricBundle.lyrics || '').trim();
                musicV2SetFriendHomeGenerateLoading(true, '正在生成翻唱音频...');
                const coverAudio = await genCover({
                    coverAudioUrl: songInfo.audioUrl,
                    coverPrompt: `Keep original melody and rhythm of "${songInfo.title}" by ${songInfo.artist}, natural expressive vocal cover.`,
                    musicOptions: { model: 'music-cover-free', output_format: 'hex' }
                }, { suppressAlert: true });
                let finalAudio = String(coverAudio || '').trim();
                if (!finalAudio) {
                    musicV2SetFriendHomeGenerateLoading(true, '翻唱接口无结果，切换语音兜底...');
                    const ttsLyrics = lyrics
                        .split(/\n+/)
                        .map(line => String(line || '').trim())
                        .filter(Boolean)
                        .slice(0, 8)
                        .join('，');
                    finalAudio = String(await genTts(ttsLyrics || lyrics.replace(/\n+/g, '，'), String(contact && contact.ttsVoiceId || ''), { suppressAlert: true }) || '').trim();
                }
                if (!finalAudio) throw new Error('audio_generate_failed');
                musicV2SetFriendHomeGenerateLoading(true, '正在保存作品...');
                const persistedAudio = await musicV2PersistFriendHomeAudioValue(finalAudio, workId);
                newWork = musicV2NormalizeFriendHomeWork({
                    id: workId,
                    title: `翻唱《${songInfo.title}》`,
                    artist: musicV2GetContactDisplayName(contact),
                    cover: songInfo.cover || MUSIC_V2_DEFAULT_COVER,
                    audio: persistedAudio,
                    mode: 'cover',
                    playCount: 100 + Math.floor(Math.random() * 800),
                    createdAt: Date.now(),
                    sourceSongId: songInfo.songId,
                    sourceAudioUrl: songInfo.audioUrl,
                    lyrics: lyrics,
                    lyricsData: Array.isArray(lyricBundle && lyricBundle.lyricsData) ? lyricBundle.lyricsData : [],
                    lyricSnippet: String(lyricBundle && lyricBundle.lyricSnippet || lyrics.replace(/\n/g, ' / '))
                }, musicV2GetContactDisplayName(contact));
            } else {
                const themeText = musicV2SanitizePromptText(query, 120);
                musicV2SetFriendHomeGenerateLoading(true, '正在注入人设与记忆上下文...');
                const lyricResult = await musicV2GenerateOriginalLyrics(contact, themeText);
                const lyrics = musicV2SanitizePromptText(lyricResult && lyricResult.lyrics, 3500);
                const composePrompt = musicV2BuildOriginalMusicPrompt(contact, themeText || (lyricResult && lyricResult.styleTags) || '');
                musicV2SetFriendHomeGenerateLoading(true, '正在原创作曲并生成音频...');
                const originalAudio = await genOriginal({
                    prompt: composePrompt,
                    lyrics: lyrics,
                    musicOptions: {
                        model: 'music-2.6-free',
                        output_format: 'hex',
                        voice_id: String(contact && contact.ttsVoiceId || ''),
                        contact_voice_id: String(contact && contact.ttsVoiceId || '')
                    },
                    isInstrumental: false
                }, { suppressAlert: true });
                const finalAudio = String(originalAudio || '').trim();
                if (!finalAudio) throw new Error('audio_generate_failed');
                musicV2SetFriendHomeGenerateLoading(true, '正在保存作品...');
                const persistedAudio = await musicV2PersistFriendHomeAudioValue(finalAudio, workId);
                const fallbackTitle = themeText ? `原创《${themeText.slice(0, 12)}》` : '原创作品';
                const apiTitle = musicV2SanitizePromptText(lyricResult && lyricResult.songTitle, 24);
                const workTitle = apiTitle || fallbackTitle;
                const lyricSnippet = musicV2BuildLyricSnippetFromText(lyrics);
                newWork = musicV2NormalizeFriendHomeWork({
                    id: workId,
                    title: workTitle,
                    artist: musicV2GetContactDisplayName(contact),
                    cover: String((contact && contact.avatar) || MUSIC_V2_DEFAULT_COVER),
                    audio: persistedAudio,
                    mode: 'original',
                    playCount: 60 + Math.floor(Math.random() * 600),
                    createdAt: Date.now(),
                    sourceSongId: '',
                    sourceAudioUrl: '',
                    lyrics: lyrics,
                    lyricsData: musicV2BuildLyricsDataFromText(lyrics, 0),
                    lyricSnippet: lyricSnippet
                }, musicV2GetContactDisplayName(contact));
            }

            const contactId = String(profile.contactId || '').trim();
            const music = musicV2EnsureModel();
            musicV2EnsureFriendHomeProfiles(music);
            let storedProfile = contactId ? music.friendHomeProfiles[contactId] : null;
            if (!storedProfile) {
                storedProfile = profile;
                if (contactId) music.friendHomeProfiles[contactId] = storedProfile;
            }
            if (!Array.isArray(storedProfile.works)) storedProfile.works = [];
            storedProfile.works.unshift(newWork);
            const seenWorkIds = new Set();
            storedProfile.works = storedProfile.works.filter((item) => {
                const wid = String(item && item.id || '').trim();
                if (!wid || seenWorkIds.has(wid)) return false;
                seenWorkIds.add(wid);
                return true;
            }).slice(0, 36);
            storedProfile.likes = Math.max(0, Math.floor(Number(storedProfile.likes || 0))) + 1;
            storedProfile.updatedAt = Date.now();
            console.info('[music-v2] friend home work generated', {
                contactId: contactId,
                workId: String(newWork.id || ''),
                worksCount: storedProfile.works.length
            });
            musicV2PersistFriendHomeProfile(storedProfile);
            const isSameContactActive = String(musicV2Runtime.friendHomeContactId || '') === contactId;
            if (isSameContactActive) {
                musicV2Runtime.friendHomeData = storedProfile;
                musicV2SetFriendHomeTab('works');
                musicV2RenderFriendHomeMainList();
                const requestMask = root.querySelector('#music-v2-fh-request-mask') || document.getElementById('music-v2-fh-request-mask');
                if (requestMask) requestMask.classList.remove('active');
                await musicV2OpenFriendHomeWork(newWork.id);
            }
            musicV2Toast('催更完成，已加入作品');
        } catch (error) {
            console.error('[music-v2] friend home request failed', error);
            if (mode === MUSIC_V2_FRIEND_HOME_REQUEST_MODE_ORIGINAL) {
                musicV2Toast('原创生成失败，请稍后再试');
            } else {
                musicV2Toast('催更失败，请换个歌名或链接试试');
            }
        } finally {
            musicV2SetFriendHomeGenerateLoading(false);
            musicV2Runtime.friendHomeRequesting = false;
            if (submit) submit.disabled = false;
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
        const bondMap = music.gamification && music.gamification.bonds && typeof music.gamification.bonds === 'object'
            ? music.gamification.bonds
            : {};

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
            const rawBond = bondMap[cid];
            const totalTogetherSec = Math.max(0, Math.floor(Number(rawBond && rawBond.totalTogetherSec) || 0));
            const bondMeta = musicV2ComputeBondLevel(totalTogetherSec);
            const bondLevelText = 'Lv.' + bondMeta.level;
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
                '<div class="friend-row clickable" data-musicv2-action="open-friend-music-home" data-contact-id="' + musicV2EscapeHtml(cid) + '">' +
                    '<img class="fr-avatar" src="' + musicV2EscapeHtml(contact.avatar || MUSIC_V2_DEFAULT_COVER) + '">' +
                    '<div class="fr-info">' +
                        '<div class="music-v2-friend-head">' +
                            '<h4>' + musicV2EscapeHtml(musicV2GetContactDisplayName(contact)) + '</h4>' +
                            '<span class="music-v2-bond-badge' + (isActive ? ' active' : '') + '">' + musicV2EscapeHtml(bondLevelText) + '</span>' +
                        '</div>' +
                        '<p>' + musicV2EscapeHtml(statusText) + '</p>' +
                    '</div>' +
                    '<button class="fr-action music-v2-friend-invite-btn clickable" data-musicv2-action="invite-contact" data-contact-id="' + musicV2EscapeHtml(cid) + '" aria-label="邀请一起听">' +
                        '<i class="' + actionIcon + '"></i>' +
                    '</button>' +
                '</div>'
            );
        });
        listWrap.innerHTML = rows.join('');
    }

    function musicV2ExitLibrarySelectionMode() {
        musicV2Runtime.librarySelectionMode = false;
        musicV2Runtime.selectedLibraryPlaylistIds.clear();
    }

    function musicV2ToggleLibraryPlaylistSelection(playlistId) {
        const pid = String(playlistId || '');
        if (!pid) return;
        if (musicV2IsSystemPlaylistId(pid)) {
            musicV2Toast('系统歌单不支持删除');
            return;
        }
        musicV2Runtime.librarySelectionMode = true;
        if (musicV2Runtime.selectedLibraryPlaylistIds.has(pid)) {
            musicV2Runtime.selectedLibraryPlaylistIds.delete(pid);
        } else {
            musicV2Runtime.selectedLibraryPlaylistIds.add(pid);
        }
        musicV2RenderLibrary();
    }

    function musicV2ToggleLibrarySelectAll() {
        const music = musicV2EnsureModel();
        const selectableIds = (music.playlists || [])
            .filter(pl => !musicV2IsSystemPlaylistId(pl && pl.id))
            .map(pl => String(pl.id || ''))
            .filter(Boolean);
        if (!selectableIds.length) {
            musicV2Toast('暂无可删除歌单');
            return;
        }
        const allSelected = selectableIds.every(id => musicV2Runtime.selectedLibraryPlaylistIds.has(id));
        if (allSelected) {
            musicV2Runtime.selectedLibraryPlaylistIds.clear();
        } else {
            musicV2Runtime.selectedLibraryPlaylistIds.clear();
            selectableIds.forEach(id => musicV2Runtime.selectedLibraryPlaylistIds.add(id));
        }
        musicV2RenderLibrary();
    }

    function musicV2DeleteSelectedPlaylists() {
        const music = musicV2EnsureModel();
        const selectedIds = Array.from(musicV2Runtime.selectedLibraryPlaylistIds || [])
            .map(id => String(id || ''))
            .filter(Boolean)
            .filter(id => !musicV2IsSystemPlaylistId(id));
        if (!selectedIds.length) {
            musicV2Toast('请先选择歌单');
            return;
        }
        if (!window.confirm('确定删除已选的 ' + selectedIds.length + ' 个歌单吗？')) return;
        const deleteSet = new Set(selectedIds);
        const before = (music.playlists || []).length;
        music.playlists = (music.playlists || []).filter(pl => !deleteSet.has(String(pl && pl.id)));
        const removed = Math.max(0, before - music.playlists.length);
        if (!removed) {
            musicV2Toast('未删除任何歌单');
            return;
        }
        if (!music.playlists.some(pl => String(pl && pl.id) === String(music.activePlaylistId || ''))) {
            if (music.playlists.some(pl => String(pl && pl.id) === MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL)) {
                music.activePlaylistId = MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL;
            } else {
                music.activePlaylistId = music.playlists[0] ? String(music.playlists[0].id || '') : '';
            }
        }
        musicV2Runtime.activePlaylistId = music.activePlaylistId || '';
        musicV2ExitLibrarySelectionMode();
        musicV2ExitPlaylistSelectionMode();
        musicV2EnsurePlayQueue({ forceRebuild: true, reason: 'library-playlists-deleted' });
        musicV2Persist();
        musicV2RenderLibrary();
        musicV2RenderPlaylistPage();
        window.musicV2ClosePage('page-playlist');
        musicV2Toast('已删除 ' + removed + ' 个歌单');
    }

    function musicV2RenderLibrary() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const list = root.querySelector('#music-v2-library-list');
        if (!list) return;
        const manageTools = root.querySelector('#music-v2-library-manage-tools');
        const music = musicV2EnsureModel();
        const isManage = !!musicV2Runtime.librarySelectionMode;

        const validCustomIdSet = new Set(
            (music.playlists || [])
                .filter(pl => !musicV2IsSystemPlaylistId(pl && pl.id))
                .map(pl => String(pl.id || ''))
                .filter(Boolean)
        );
        Array.from(musicV2Runtime.selectedLibraryPlaylistIds || []).forEach((pid) => {
            if (!validCustomIdSet.has(String(pid))) {
                musicV2Runtime.selectedLibraryPlaylistIds.delete(String(pid));
            }
        });
        const selectedCount = musicV2Runtime.selectedLibraryPlaylistIds.size;
        const allSelected = validCustomIdSet.size > 0 && Array.from(validCustomIdSet).every(pid => musicV2Runtime.selectedLibraryPlaylistIds.has(pid));

        if (manageTools) {
            if (!isManage) {
                manageTools.innerHTML = '';
            } else {
                manageTools.innerHTML =
                    '<div class="music-v2-library-manage-tools">' +
                        '<button class="music-v2-modal-btn" data-musicv2-action="toggle-library-select-all">' + (allSelected ? '取消全选' : '全选') + '</button>' +
                        '<span class="music-v2-library-manage-state">已选 ' + selectedCount + ' 个</span>' +
                        '<button class="music-v2-action-btn music-v2-library-delete-btn" data-musicv2-action="delete-selected-playlists"' + (selectedCount ? '' : ' disabled') + '>删除已选</button>' +
                        '<button class="music-v2-modal-btn" data-musicv2-action="cancel-library-manage">取消</button>' +
                    '</div>';
            }
        }

        const settingsBtn = root.querySelector('.top-bar .ri-settings-4-line');
        if (settingsBtn) {
            settingsBtn.classList.add('clickable');
            settingsBtn.setAttribute('data-musicv2-action', 'toggle-library-manage');
            settingsBtn.classList.toggle('music-v2-library-manage-active', isManage);
            settingsBtn.setAttribute('title', isManage ? '退出歌单管理' : '管理歌单');
            settingsBtn.setAttribute('aria-label', isManage ? '退出歌单管理' : '管理歌单');
        }

        list.innerHTML = music.playlists.map(pl => {
            const pid = String(pl && pl.id || '');
            const isSystem = musicV2IsSystemPlaylistId(pid);
            const count = (pl && pl.songs ? pl.songs.length : 0);
            const selected = isManage && musicV2Runtime.selectedLibraryPlaylistIds.has(pid);
            const rowAction = isManage
                ? (!isSystem ? (' data-musicv2-action="toggle-library-playlist-select" data-playlist-id="' + musicV2EscapeHtml(pid) + '"') : '')
                : (' data-musicv2-action="open-playlist" data-playlist-id="' + musicV2EscapeHtml(pid) + '"');
            const rowClass = 'list-item' +
                ((isManage && isSystem) ? ' music-v2-library-item-locked' : ' clickable') +
                (selected ? ' selected' : '');
            const subText = isSystem
                ? ('系统歌单 • ' + count + ' tracks')
                : ('Playlist • ' + count + ' tracks');
            const iconHtml = isManage
                ? (isSystem
                    ? '<i class="ri-lock-2-line li-action"></i>'
                    : ('<i class="' + (selected ? 'ri-checkbox-circle-fill' : 'ri-checkbox-blank-circle-line') + ' li-action"></i>'))
                : '<i class="ri-arrow-right-s-line li-action"></i>';
            return (
                '<div class="' + rowClass + '"' + rowAction + '>' +
                    '<img class="li-img" src="' + musicV2EscapeHtml(musicV2GetPlaylistCover(pl)) + '">' +
                    '<div class="li-info"><h4 style="font-size:18px;">' + musicV2EscapeHtml(pl.title) + '</h4><p>' + musicV2EscapeHtml(subText) + '</p></div>' +
                    iconHtml +
                '</div>'
            );
        }).join('');
    }

    function musicV2ExitPlaylistSelectionMode() {
        musicV2Runtime.playlistSelectionMode = false;
        musicV2Runtime.selectedPlaylistSongIds.clear();
    }

    function musicV2EnterPlaylistSelectionMode(initialSongId) {
        const sid = String(initialSongId || '');
        if (!sid) return;
        musicV2Runtime.playlistSelectionMode = true;
        musicV2Runtime.selectedPlaylistSongIds.clear();
        musicV2Runtime.selectedPlaylistSongIds.add(sid);
        musicV2Runtime.suppressPlaylistPlayUntil = Date.now() + 360;
        musicV2RenderPlaylistPage();
    }

    function musicV2TogglePlaylistSongSelection(songId) {
        const sid = String(songId || '');
        if (!sid) return;
        if (!musicV2Runtime.playlistSelectionMode) {
            musicV2Runtime.playlistSelectionMode = true;
        }
        if (musicV2Runtime.selectedPlaylistSongIds.has(sid)) {
            musicV2Runtime.selectedPlaylistSongIds.delete(sid);
        } else {
            musicV2Runtime.selectedPlaylistSongIds.add(sid);
        }
        if (!musicV2Runtime.selectedPlaylistSongIds.size) {
            musicV2ExitPlaylistSelectionMode();
        }
        musicV2RenderPlaylistPage();
    }

    function musicV2TogglePlaylistSelectAll() {
        const playlist = musicV2GetPlaylist(musicV2Runtime.activePlaylistId);
        const songIds = playlist && Array.isArray(playlist.songs)
            ? playlist.songs.map(id => String(id || '')).filter(Boolean)
            : [];
        if (!songIds.length) {
            musicV2Toast('歌单暂无歌曲');
            return;
        }
        const allSelected = songIds.every(id => musicV2Runtime.selectedPlaylistSongIds.has(id));
        musicV2Runtime.playlistSelectionMode = true;
        if (allSelected) {
            musicV2Runtime.selectedPlaylistSongIds.clear();
        } else {
            musicV2Runtime.selectedPlaylistSongIds.clear();
            songIds.forEach(id => musicV2Runtime.selectedPlaylistSongIds.add(id));
        }
        if (!musicV2Runtime.selectedPlaylistSongIds.size) {
            musicV2ExitPlaylistSelectionMode();
        }
        musicV2RenderPlaylistPage();
    }

    function musicV2DeleteSelectedSongsFromActivePlaylist() {
        const playlist = musicV2GetPlaylist(musicV2Runtime.activePlaylistId);
        if (!playlist) {
            musicV2Toast('歌单不存在');
            return;
        }
        const sid = String(playlist.id || '');
        if (sid === MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL) {
            musicV2Toast('全部歌曲不支持删除曲目');
            return;
        }
        const selected = Array.from(musicV2Runtime.selectedPlaylistSongIds || []);
        if (!selected.length) {
            musicV2Toast('请先选择歌曲');
            return;
        }
        const selectedSet = new Set(selected.map(id => String(id)));
        const before = Array.isArray(playlist.songs) ? playlist.songs.length : 0;
        playlist.songs = (playlist.songs || []).filter(rawId => !selectedSet.has(String(rawId)));
        const removed = Math.max(0, before - playlist.songs.length);
        if (!removed) {
            musicV2Toast('未删除任何歌曲');
            return;
        }
        playlist.updatedAt = Date.now();
        musicV2Persist();
        musicV2ExitPlaylistSelectionMode();
        musicV2EnsurePlayQueue({ forceRebuild: true, reason: 'playlist-song-removed' });
        musicV2RenderLibrary();
        musicV2RenderPlaylistPage();
        musicV2RenderSongView();
        musicV2RenderMiniPlayer();
        const queueMask = document.getElementById('music-v2-current-playlist-mask');
        if (queueMask && queueMask.classList.contains('active')) {
            musicV2RenderCurrentPlaylistPanel();
        }
        musicV2Toast('已删除 ' + removed + ' 首歌曲');
    }

    function musicV2DeleteActivePlaylist() {
        const playlist = musicV2GetPlaylist(musicV2Runtime.activePlaylistId);
        if (!playlist) {
            musicV2Toast('歌单不存在');
            return;
        }
        if (musicV2IsSystemPlaylistId(playlist.id)) {
            musicV2Toast('系统歌单不支持删除');
            return;
        }
        const title = String(playlist.title || '该歌单');
        if (!window.confirm('确定删除歌单「' + title + '」吗？')) return;

        const music = musicV2EnsureModel();
        const deleteId = String(playlist.id || '');
        music.playlists = (music.playlists || []).filter(pl => String(pl && pl.id) !== deleteId);

        let fallbackId = '';
        if (music.playlists.some(pl => String(pl && pl.id) === MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL)) {
            fallbackId = MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL;
        } else if (music.playlists.length) {
            fallbackId = String(music.playlists[0].id || '');
        }
        music.activePlaylistId = fallbackId;
        musicV2Runtime.activePlaylistId = fallbackId;
        musicV2ExitPlaylistSelectionMode();
        musicV2EnsurePlayQueue({ forceRebuild: true, reason: 'playlist-deleted' });
        musicV2Persist();
        musicV2RenderLibrary();
        musicV2RenderPlaylistPage();
        window.musicV2ClosePage('page-playlist');
        musicV2Toast('歌单已删除');
    }

    function musicV2RenderPlaylistPage() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const content = root.querySelector('#music-v2-playlist-page-content');
        if (!content) return;

        const friendPlaylistPage = musicV2Runtime.friendHomePlaylistPageData && typeof musicV2Runtime.friendHomePlaylistPageData === 'object'
            ? musicV2Runtime.friendHomePlaylistPageData
            : null;
        if (friendPlaylistPage) {
            const songIds = Array.isArray(friendPlaylistPage.songIds) ? friendPlaylistPage.songIds : [];
            const songs = songIds.map(id => musicV2GetSong(id)).filter(Boolean);
            const playbackPlaylistId = String(friendPlaylistPage.playbackPlaylistId || MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL);
            const listHtml = songs.map((song, idx) => {
                const sid = String(song.id || '');
                return (
                    '<div class="list-item clickable music-v2-playlist-song-item" data-musicv2-action="play-friend-home-song" data-song-id="' + musicV2EscapeHtml(sid) + '" data-playlist-id="' + musicV2EscapeHtml(playbackPlaylistId) + '">' +
                        '<div class="li-num">' + (idx + 1) + '</div>' +
                        '<div class="li-info"><h4>' + musicV2EscapeHtml(song.title) + '</h4><p>' + musicV2EscapeHtml(song.artist) + '</p></div>' +
                        '<button class="music-v2-action-btn music-v2-playlist-item-action" data-musicv2-action="play-friend-home-song" data-song-id="' + musicV2EscapeHtml(sid) + '" data-playlist-id="' + musicV2EscapeHtml(playbackPlaylistId) + '">播放</button>' +
                    '</div>'
                );
            }).join('');
            content.innerHTML =
                '<div class="pl-hero">' +
                    '<img class="music-v2-playlist-cover" src="' + musicV2EscapeHtml(friendPlaylistPage.cover || MUSIC_V2_DEFAULT_COVER) + '">' +
                    '<h2>' + musicV2EscapeHtml(friendPlaylistPage.title || '歌单') + '</h2>' +
                    '<p>Playlist • ' + songs.length + ' tracks</p>' +
                    '<div class="pl-actions">' +
                        '<div class="pl-btn clickable" data-musicv2-action="play-friend-home-playlist-first"><i class="ri-play-fill" style="font-size:20px;"></i> Play</div>' +
                    '</div>' +
                '</div>' +
                (songs.length ? listHtml : '<div class="music-v2-empty-note">歌单暂无歌曲</div>');
            return;
        }

        const playlist = musicV2GetPlaylist(musicV2Runtime.activePlaylistId);
        if (!playlist) return;

        const songs = (playlist.songs || []).map(id => musicV2GetSong(id)).filter(Boolean);
        const validSongIdSet = new Set(songs.map(song => String(song.id)));
        Array.from(musicV2Runtime.selectedPlaylistSongIds || []).forEach((sid) => {
            if (!validSongIdSet.has(String(sid))) {
                musicV2Runtime.selectedPlaylistSongIds.delete(String(sid));
            }
        });
        if (musicV2Runtime.playlistSelectionMode && !songs.length) {
            musicV2ExitPlaylistSelectionMode();
        }
        const isSelectionMode = !!musicV2Runtime.playlistSelectionMode;
        const selectedCount = musicV2Runtime.selectedPlaylistSongIds.size;
        const allSelected = songs.length > 0 && songs.every(song => musicV2Runtime.selectedPlaylistSongIds.has(String(song.id)));
        const listHtml = songs.map((song, idx) => {
            const sid = String(song.id || '');
            const selected = isSelectionMode && musicV2Runtime.selectedPlaylistSongIds.has(sid);
            const itemAction = isSelectionMode ? 'toggle-playlist-song-select' : 'play-song';
            const actionLabel = isSelectionMode
                ? (selected ? '<i class="ri-check-line"></i>' : '<i class="ri-add-line"></i>')
                : '播放';
            return (
                '<div class="list-item clickable music-v2-playlist-song-item' + (selected ? ' selected' : '') + '" data-musicv2-playlist-song="1" data-musicv2-action="' + itemAction + '" data-song-id="' + musicV2EscapeHtml(sid) + '">' +
                    '<div class="li-num">' + (isSelectionMode ? (selected ? '<i class="ri-checkbox-circle-fill"></i>' : '<i class="ri-checkbox-blank-circle-line"></i>') : (idx + 1)) + '</div>' +
                    '<div class="li-info"><h4>' + musicV2EscapeHtml(song.title) + '</h4><p>' + musicV2EscapeHtml(song.artist) + '</p></div>' +
                    '<button class="music-v2-action-btn music-v2-playlist-item-action" data-musicv2-action="' + itemAction + '" data-song-id="' + musicV2EscapeHtml(sid) + '">' + actionLabel + '</button>' +
                '</div>'
            );
        }).join('');

        content.innerHTML =
            '<div class="pl-hero">' +
                '<img class="music-v2-playlist-cover clickable" data-musicv2-action="upload-playlist-cover" data-playlist-id="' + musicV2EscapeHtml(playlist.id) + '" src="' + musicV2EscapeHtml(musicV2GetPlaylistCover(playlist)) + '">' +
                '<h2>' + musicV2EscapeHtml(playlist.title) + '</h2>' +
                '<p>Playlist • ' + songs.length + ' tracks</p>' +
                '<div class="pl-actions">' +
                    '<div class="pl-btn clickable" data-musicv2-action="play-first"><i class="ri-play-fill" style="font-size:20px;"></i> Play</div>' +
                '</div>' +
                (isSelectionMode
                    ? ('<div class="music-v2-playlist-selection-tools">' +
                        '<button class="music-v2-modal-btn" data-musicv2-action="toggle-playlist-select-all">' + (allSelected ? '取消全选' : '全选') + '</button>' +
                        '<span class="music-v2-playlist-selection-state">已选 ' + selectedCount + ' 首</span>' +
                        '<button class="music-v2-action-btn music-v2-playlist-delete-btn" data-musicv2-action="batch-delete-playlist-songs"' + (selectedCount ? '' : ' disabled') + '>删除已选</button>' +
                        '<button class="music-v2-modal-btn" data-musicv2-action="cancel-playlist-select">取消</button>' +
                    '</div>')
                    : '<div class="music-v2-playlist-longpress-tip"></div>') +
            '</div>' +
            (songs.length ? listHtml : '<div class="music-v2-empty-note">歌单暂无歌曲</div>');
    }

    function musicV2GetQueuePlaylistContext() {
        const music = musicV2EnsureModel();
        const override = musicV2Runtime.friendHomeWorksQueueContext && typeof musicV2Runtime.friendHomeWorksQueueContext === 'object'
            ? musicV2Runtime.friendHomeWorksQueueContext
            : null;
        if (override && Array.isArray(override.songIds) && override.songIds.length) {
            const currentSongId = String(music.currentSongId || '');
            const hasCurrentSong = currentSongId && override.songIds.includes(currentSongId);
            if (hasCurrentSong) {
                const validSongIds = musicV2UniqueValidSongIds(override.songIds, null).filter((sid) => !!musicV2GetSong(sid));
                if (validSongIds.length) {
                    return {
                        playlist: null,
                        playlistId: String(override.playlistId || ''),
                        songIds: validSongIds,
                        signature: String(override.signature || ('fhw:' + validSongIds.join('|')))
                    };
                }
            }
        }
        let playlist = null;
        if (musicV2Runtime.activePlaylistId) {
            playlist = musicV2GetPlaylist(musicV2Runtime.activePlaylistId);
        }
        if (!playlist && music.activePlaylistId) {
            playlist = musicV2GetPlaylist(music.activePlaylistId);
        }
        if (!playlist && Array.isArray(music.playlists) && music.playlists.length > 0) {
            playlist = music.playlists[0];
        }
        const rawSongIds = playlist && Array.isArray(playlist.songs) ? playlist.songs : [];
        const seen = new Set();
        const validSongIds = [];
        rawSongIds.forEach((rawId) => {
            const sid = String(rawId || '');
            if (!sid || seen.has(sid)) return;
            if (!musicV2GetSong(sid)) return;
            seen.add(sid);
            validSongIds.push(sid);
        });
        return {
            playlist: playlist || null,
            playlistId: playlist ? String(playlist.id || '') : '',
            songIds: validSongIds,
            signature: validSongIds.join('|')
        };
    }

    function musicV2GetCurrentPlaylistForPanel() {
        const ctx = musicV2GetQueuePlaylistContext();
        return ctx.playlist || null;
    }

    function musicV2ShuffleSongIdsKeepCurrentFirst(songIds, currentSongId) {
        const list = Array.isArray(songIds) ? songIds.map(id => String(id || '')).filter(Boolean) : [];
        if (!list.length) return [];
        const currentId = String(currentSongId || '');
        const rest = [];
        let currentFound = '';
        list.forEach((sid) => {
            if (!currentFound && sid === currentId) {
                currentFound = sid;
                return;
            }
            rest.push(sid);
        });
        for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = rest[i];
            rest[i] = rest[j];
            rest[j] = temp;
        }
        if (currentFound) return [currentFound].concat(rest);
        return rest;
    }

    function musicV2BuildPlayQueue(mode, playlist, currentSongId, songIds, signature) {
        const normalizedMode = musicV2NormalizePlaybackMode(mode);
        const ids = Array.isArray(songIds) ? songIds.slice() : [];
        const currentId = String(currentSongId || '');
        const result = {
            mode: normalizedMode,
            playlistId: playlist ? String(playlist.id || '') : '',
            orderedSongIds: [],
            currentIndex: -1,
            signature: String(signature || '')
        };
        if (normalizedMode === MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP) {
            const singleId = currentId || '';
            if (singleId && musicV2GetSong(singleId)) {
                result.orderedSongIds = [singleId];
                result.currentIndex = 0;
            }
            return result;
        }

        if (!ids.length) return result;

        if (normalizedMode === MUSIC_V2_PLAYBACK_MODE_SHUFFLE) {
            const shuffled = musicV2ShuffleSongIdsKeepCurrentFirst(ids, currentId);
            result.orderedSongIds = shuffled;
            if (!shuffled.length) return result;
            const idx = currentId ? shuffled.indexOf(currentId) : -1;
            result.currentIndex = idx >= 0 ? idx : 0;
            return result;
        }

        result.orderedSongIds = ids;
        if (!ids.length) return result;
        const idx = currentId ? ids.indexOf(currentId) : -1;
        result.currentIndex = idx >= 0 ? idx : 0;
        return result;
    }

    function musicV2EnsurePlayQueue(options) {
        const opts = options || {};
        const forceRebuild = !!opts.forceRebuild;
        const music = musicV2EnsureModel();
        const mode = musicV2GetPlaybackMode();
        const ctx = musicV2GetQueuePlaylistContext();
        const desiredSongId = String(opts.currentSongId != null ? opts.currentSongId : (music.currentSongId || ''));
        const existing = musicV2Runtime.playQueue && typeof musicV2Runtime.playQueue === 'object'
            ? musicV2Runtime.playQueue
            : null;
        const canReuse =
            !forceRebuild &&
            existing &&
            String(existing.mode || '') === mode &&
            String(existing.playlistId || '') === String(ctx.playlistId || '') &&
            String(existing.signature || '') === String(ctx.signature || '') &&
            Array.isArray(existing.orderedSongIds);

        if (canReuse) {
            const ids = existing.orderedSongIds.slice();
            if (!ids.length) {
                existing.currentIndex = -1;
                musicV2Runtime.playQueue = existing;
                return existing;
            }
            if (mode === MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP) {
                if (!desiredSongId) {
                    const rebuiltEmptySingle = musicV2BuildPlayQueue(mode, ctx.playlist, '', ctx.songIds, ctx.signature);
                    musicV2Runtime.playQueue = rebuiltEmptySingle;
                    return rebuiltEmptySingle;
                }
                const targetSingleId = desiredSongId && musicV2GetSong(desiredSongId) ? desiredSongId : '';
                if (targetSingleId && ids[0] !== targetSingleId) {
                    const rebuiltSingle = musicV2BuildPlayQueue(mode, ctx.playlist, targetSingleId, ctx.songIds, ctx.signature);
                    musicV2Runtime.playQueue = rebuiltSingle;
                    return rebuiltSingle;
                }
            }
            let currentIndex = desiredSongId ? ids.indexOf(desiredSongId) : -1;
            if (currentIndex < 0) {
                const oldIdx = Number(existing.currentIndex);
                currentIndex = Number.isFinite(oldIdx) && oldIdx >= 0 && oldIdx < ids.length ? Math.floor(oldIdx) : 0;
            }
            existing.currentIndex = currentIndex;
            existing.orderedSongIds = ids;
            musicV2Runtime.playQueue = existing;
            return existing;
        }

        const rebuilt = musicV2BuildPlayQueue(mode, ctx.playlist, desiredSongId, ctx.songIds, ctx.signature);
        musicV2Runtime.playQueue = rebuilt;
        return rebuilt;
    }

    async function musicV2QueueTogetherSearchSong(songId) {
        const sid = String(songId || '');
        if (!sid || !musicV2GetSong(sid)) {
            throw new Error('together_song_unavailable');
        }
        musicV2ResetTogetherOneShot();
        const queue = musicV2EnsurePlayQueue({ reason: 'together-search-play' });
        if (!queue || !Array.isArray(queue.orderedSongIds)) {
            await musicV2PlaySong(sid, '');
            return {
                songId: sid,
                inserted: true
            };
        }
        const ids = queue.orderedSongIds.slice();
        const existsAt = ids.indexOf(sid);
        if (existsAt >= 0) {
            queue.currentIndex = existsAt;
            queue.orderedSongIds = ids;
            await musicV2PlaySong(sid, queue.playlistId || '');
            return {
                songId: sid,
                inserted: false,
                queueIndex: existsAt
            };
        }

        let currentIndex = Number(queue.currentIndex);
        if (!Number.isFinite(currentIndex) || currentIndex < 0 || currentIndex >= ids.length) {
            const music = musicV2EnsureModel();
            const currentSongId = String(music.currentSongId || '');
            const idxByCurrentSong = currentSongId ? ids.indexOf(currentSongId) : -1;
            currentIndex = idxByCurrentSong >= 0 ? idxByCurrentSong : 0;
        } else {
            currentIndex = Math.floor(currentIndex);
        }
        const insertIndex = ids.length
            ? Math.min(ids.length, currentIndex + 1)
            : 0;
        ids.splice(insertIndex, 0, sid);
        queue.orderedSongIds = ids;
        queue.currentIndex = insertIndex;
        await musicV2PlaySong(sid, queue.playlistId || '');
        return {
            songId: sid,
            inserted: true,
            queueIndex: insertIndex
        };
    }

    async function musicV2PlayTogetherSearchSongInSingleLoop(songId) {
        const sid = String(songId || '');
        if (!sid || !musicV2GetSong(sid)) {
            throw new Error('together_song_unavailable');
        }
        const music = musicV2EnsureModel();
        const queue = musicV2EnsurePlayQueue({ reason: 'together-search-play-single' });
        const returnSongId = String(music.currentSongId || '');
        const returnPlaylistId = String(
            (queue && queue.playlistId)
            || musicV2Runtime.activePlaylistId
            || music.activePlaylistId
            || ''
        );
        musicV2Runtime.togetherOneShot = {
            active: true,
            songId: sid,
            returnSongId: returnSongId,
            returnPlaylistId: returnPlaylistId
        };
        musicV2SyncAudioLoopByMode();
        await musicV2PlaySong(sid, '');
        return {
            songId: sid,
            returnSongId: returnSongId,
            returnPlaylistId: returnPlaylistId
        };
    }

    function musicV2GetQueueDisplayItems(queue) {
        const q = queue || musicV2EnsurePlayQueue({ reason: 'display' });
        if (!q || !Array.isArray(q.orderedSongIds) || !q.orderedSongIds.length) return [];
        const ids = q.orderedSongIds;
        const mode = musicV2NormalizePlaybackMode(q.mode);
        const total = ids.length;
        if (mode === MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP) {
            const sid = ids[0];
            if (!sid || !musicV2GetSong(sid)) return [];
            return [{
                songId: sid,
                queueIndex: 0,
                isCurrent: true
            }];
        }
        let startIndex = Number.isFinite(q.currentIndex) ? Math.floor(q.currentIndex) : -1;
        if (startIndex < 0 || startIndex >= total) startIndex = 0;
        const items = [];
        for (let step = 0; step < total; step++) {
            const idx = (startIndex + step) % total;
            const sid = ids[idx];
            if (!sid || !musicV2GetSong(sid)) continue;
            items.push({
                songId: sid,
                queueIndex: idx,
                isCurrent: step === 0
            });
        }
        return items;
    }

    function musicV2GetQueueModeTitle(mode) {
        const normalized = musicV2NormalizePlaybackMode(mode);
        if (normalized === MUSIC_V2_PLAYBACK_MODE_SINGLE_LOOP) return '单曲循环队列';
        if (normalized === MUSIC_V2_PLAYBACK_MODE_SHUFFLE) return '随机队列';
        return '歌单循环队列';
    }

    function musicV2RenderCurrentPlaylistPanel() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const mask = root.querySelector('#music-v2-current-playlist-mask');
        if (!mask) return;
        const titleEl = mask.querySelector('#music-v2-current-playlist-title');
        const countEl = mask.querySelector('#music-v2-current-playlist-count');
        const listEl = mask.querySelector('#music-v2-current-playlist-list');
        if (!listEl) return;

        const queue = musicV2EnsurePlayQueue({ reason: 'render-panel' });
        const items = musicV2GetQueueDisplayItems(queue);
        if (titleEl) titleEl.textContent = musicV2GetQueueModeTitle(queue && queue.mode);
        if (countEl) countEl.textContent = '共 ' + items.length + ' 首';

        if (!items.length) {
            listEl.innerHTML = '<div class="music-v2-current-playlist-empty">当前没有可展示的播放队列</div>';
            return;
        }

        const playlistId = queue && queue.playlistId ? String(queue.playlistId) : '';
        listEl.innerHTML = items.map((item, index) => {
            const song = musicV2GetSong(item.songId);
            if (!song) return '';
            return (
                '<button class="music-v2-current-playlist-item' + (item.isCurrent ? ' active' : '') + '" data-musicv2-action="play-current-playlist-song" data-song-id="' + musicV2EscapeHtml(item.songId) + '" data-playlist-id="' + musicV2EscapeHtml(playlistId) + '">' +
                    '<span class="music-v2-current-playlist-index">' + (index + 1) + '</span>' +
                    '<span class="music-v2-current-playlist-meta">' +
                        '<strong>' + musicV2EscapeHtml(song.title || '未命名歌曲') + '</strong>' +
                        '<small>' + musicV2EscapeHtml(song.artist || '未知歌手') + '</small>' +
                    '</span>' +
                    '<i class="ri-play-circle-line"></i>' +
                '</button>'
            );
        }).join('');
    }

    function musicV2ShowCurrentPlaylistPanel() {
        const root = musicV2Runtime.root;
        if (!root) return false;
        const mask = root.querySelector('#music-v2-current-playlist-mask');
        if (!mask) return false;
        musicV2EnsurePlayQueue({ reason: 'open-panel' });
        musicV2RenderCurrentPlaylistPanel();
        mask.classList.add('active');
        return true;
    }

    function musicV2HideCurrentPlaylistPanel() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const mask = root.querySelector('#music-v2-current-playlist-mask');
        if (mask) mask.classList.remove('active');
    }

    function musicV2RenderPicker() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const body = root.querySelector('#music-v2-picker-list');
        if (!body) return;
        const music = musicV2EnsureModel();
        const list = music.playlists.filter(pl => !musicV2IsSystemPlaylistId(pl && pl.id));
        body.innerHTML = list.map(pl => (
            '<button class="music-v2-picker-item" data-musicv2-action="choose-playlist" data-playlist-id="' + musicV2EscapeHtml(pl.id) + '">' +
                '<img src="' + musicV2EscapeHtml(musicV2GetPlaylistCover(pl)) + '">' +
                '<div><strong>' + musicV2EscapeHtml(pl.title) + '</strong><span>' + ((pl.songs || []).length) + ' 首</span></div>' +
            '</button>'
        )).join('');
    }

    function musicV2ShowPicker(songs) {
        const root = musicV2Runtime.root;
        if (!root) return;
        const list = Array.isArray(songs)
            ? songs.filter(Boolean)
            : (songs ? [songs] : []);
        if (!list.length) {
            musicV2Toast('请先选择歌曲');
            return;
        }
        musicV2Runtime.pendingSongs = list.slice();
        musicV2Runtime.pendingSong = list[0] || null;
        musicV2Runtime.createFromPicker = false;
        musicV2RenderPicker();
        const mask = root.querySelector('#music-v2-picker-mask');
        if (mask) mask.classList.add('active');
    }

    function musicV2HidePicker() {
        const root = musicV2Runtime.root;
        if (!root) return;
        const mask = root.querySelector('#music-v2-picker-mask');
        if (mask) mask.classList.remove('active');
        musicV2Runtime.pendingSongs = [];
        musicV2Runtime.pendingSong = null;
        musicV2Runtime.createFromPicker = false;
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

    function musicV2SetImportLoading(loading) {
        const isLoading = !!loading;
        musicV2Runtime.importLoading = isLoading;
        const root = musicV2Runtime.root;
        if (!root) return;
        const input = root.querySelector('#music-v2-import-url');
        const submitBtn = root.querySelector('[data-musicv2-action="submit-import-playlist"]');
        if (input) input.disabled = isLoading;
        if (submitBtn) {
            submitBtn.disabled = isLoading;
            submitBtn.textContent = isLoading ? '导入中...' : '导入';
        }
    }

    function musicV2ShowImportModal() {
        const root = musicV2Runtime.root;
        if (!root) return;
        musicV2Runtime.importDraft = '';
        musicV2Runtime.importDetailFallback = false;
        musicV2SetImportLoading(false);
        const input = root.querySelector('#music-v2-import-url');
        if (input) input.value = '';
        const mask = root.querySelector('#music-v2-import-mask');
        if (mask) mask.classList.add('active');
        if (input) {
            setTimeout(() => {
                try {
                    input.focus();
                    input.select();
                } catch (error) {
                    // ignore focus errors on hidden/readonly contexts
                }
            }, 0);
        }
    }

    function musicV2HideImportModal() {
        const root = musicV2Runtime.root;
        if (!root) return;
        if (musicV2Runtime.importLoading) {
            musicV2Toast('正在导入，请稍候');
            return;
        }
        const mask = root.querySelector('#music-v2-import-mask');
        if (mask) mask.classList.remove('active');
        const input = root.querySelector('#music-v2-import-url');
        if (input) input.value = '';
        musicV2Runtime.importDraft = '';
        musicV2Runtime.importDetailFallback = false;
        musicV2SetImportLoading(false);
    }

    async function musicV2ReadDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target ? e.target.result : '');
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function musicV2AddSongToPlaylistCore(rawSong, playlistId) {
        const song = musicV2UpsertSong(rawSong);
        const sid = String(song.id);

        let playlist = musicV2GetPlaylist(playlistId);
        if (!playlist) {
            return { status: 'failed', songId: sid };
        }
        if (musicV2IsSystemPlaylistId(playlist.id)) {
            return { status: 'failed', songId: sid, reason: 'system_playlist' };
        }

        if (!Array.isArray(playlist.songs)) playlist.songs = [];
        if (playlist.songs.includes(sid)) {
            return { status: 'duplicate', songId: sid };
        }
        try {
            await musicV2ResolveSongSource(sid, false);
        } catch (error) {
            // add flow should continue even if pre-resolve fails
        }
        // Reacquire playlist to avoid stale object references after normalization calls.
        playlist = musicV2GetPlaylist(playlistId);
        if (!playlist) {
            return { status: 'failed', songId: sid };
        }
        if (!Array.isArray(playlist.songs)) playlist.songs = [];
        if (playlist.songs.includes(sid)) {
            return { status: 'duplicate', songId: sid };
        }
        playlist.songs.push(sid);
        playlist.updatedAt = Date.now();
        if (!playlist.cover && song.cover) playlist.cover = song.cover;
        return { status: 'added', songId: sid };
    }

    async function musicV2AddSongsToPlaylist(rawSongs, playlistId) {
        const list = Array.isArray(rawSongs) ? rawSongs.filter(Boolean) : [];
        const summary = {
            addedCount: 0,
            duplicateCount: 0,
            failedCount: 0
        };
        for (let i = 0; i < list.length; i++) {
            const rawSong = list[i];
            try {
                const result = await musicV2AddSongToPlaylistCore(rawSong, playlistId);
                if (result && result.status === 'added') summary.addedCount += 1;
                else if (result && result.status === 'duplicate') summary.duplicateCount += 1;
                else summary.failedCount += 1;
            } catch (error) {
                summary.failedCount += 1;
            }
        }
        return summary;
    }

    function musicV2BuildBatchAddToast(summary) {
        return '已添加' + summary.addedCount + '首，重复' + summary.duplicateCount + '首，失败' + summary.failedCount + '首';
    }

    function musicV2BindAudio() {
        if (musicV2Runtime.audioBound) return;
        const audio = document.getElementById('bg-music');
        if (!audio) return;
        musicV2Runtime.audioBound = true;
        musicV2SyncAudioLoopByMode();

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
            const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
            const ratio = duration > 0 ? musicV2Clamp01((audio.currentTime || 0) / duration) : 0;
            musicV2TryCountPlayCompletion(ratio, 'seeked');
            musicV2SyncLyrics(audio.currentTime || 0);
        });

        audio.addEventListener('timeupdate', () => {
            const progressTick = Math.floor((audio.currentTime || 0) * 4);
            if (progressTick !== musicV2Runtime.lastProgressSec) {
                musicV2Runtime.lastProgressSec = progressTick;
                musicV2RenderProgress(audio);
            }
            const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
            const ratio = duration > 0 ? musicV2Clamp01((audio.currentTime || 0) / duration) : 0;
            musicV2TryCountPlayCompletion(ratio, 'timeupdate');
            musicV2SyncLyrics(audio.currentTime || 0);
        });

        audio.addEventListener('play', () => {
            const song = musicV2GetCurrentSong();
            if (!song) return;
            if (String(musicV2Runtime.playCycleTracker.songId || '') !== String(song.id || '')) {
                musicV2ResetPlayCycleTracker(song.id, 0);
            }
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
            musicV2TryCountPlayCompletion(1, 'ended');
            musicV2RenderProgress(audio);
            musicV2SkipByOffset(1, { silent: true, reason: 'auto-ended' });
        });
    }

    function musicV2HandleClick(event) {
        const root = musicV2Runtime.root;
        if (!root) return;
        const rawTarget = event ? event.target : null;
        const target = rawTarget && typeof rawTarget.closest === 'function'
            ? rawTarget
            : (rawTarget && rawTarget.parentElement && typeof rawTarget.parentElement.closest === 'function'
                ? rawTarget.parentElement
                : null);
        if (!target) return;
        const actionNode = target.closest('[data-musicv2-action]');
        const action = actionNode ? actionNode.getAttribute('data-musicv2-action') : '';
        if (action === 'play-song' && musicV2Runtime.playlistSelectionMode) {
            const sid = actionNode.getAttribute('data-song-id');
            if (sid) musicV2TogglePlaylistSongSelection(sid);
            return;
        }
        if (action === 'play-song' && Date.now() < Number(musicV2Runtime.suppressPlaylistPlayUntil || 0)) {
            return;
        }
        const songMenuPanel = root.querySelector('#music-v2-song-menu-panel');
        if (songMenuPanel && songMenuPanel.classList.contains('active')) {
            const inMenu = target.closest('#music-v2-song-menu-panel');
            const onMoreBtn = target.closest('[data-musicv2-action="open-song-menu"]');
            if (!inMenu && !onMoreBtn) {
                musicV2HideSongMenu();
            }
        }

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
        if (action === 'open-back-button-panel') {
            musicV2ShowBackButtonPanel();
            return;
        }
        if (action === 'close-back-button-panel') {
            musicV2HideBackButtonPanel();
            return;
        }
        if (action === 'choose-back-button-file') {
            const input = root.querySelector('#music-v2-back-button-file');
            if (!input) {
                musicV2Toast('图片上传不可用');
                return;
            }
            input.value = '';
            input.click();
            return;
        }
        if (action === 'apply-back-button-url') {
            const input = root.querySelector('#music-v2-back-button-url');
            const imageUrl = input ? String(input.value || '').trim() : '';
            if (!imageUrl) {
                musicV2Toast('请输入图片 URL');
                return;
            }
            musicV2ValidateBackButtonUrl(imageUrl).then((validUrl) => {
                musicV2SaveBackButtonImage(validUrl);
                musicV2HideBackButtonPanel();
                musicV2Toast('返回按钮图片已更新');
            }).catch(() => {
                musicV2Toast('图片 URL 无法加载');
            });
            return;
        }
        if (action === 'reset-back-button-image') {
            musicV2SaveBackButtonImage('');
            musicV2HideBackButtonPanel();
            musicV2Toast('已恢复默认图片');
            return;
        }
        if (action === 'upload-playlist-cover') {
            const playlistId = actionNode.getAttribute('data-playlist-id') || musicV2Runtime.activePlaylistId;
            if (!playlistId) {
                musicV2Toast('歌单信息缺失');
                return;
            }
            if (!musicV2GetPlaylist(playlistId)) {
                musicV2Toast('歌单不存在');
                return;
            }
            const fileInput = root.querySelector('#music-v2-playlist-cover-file');
            if (!fileInput) {
                musicV2Toast('封面上传不可用');
                return;
            }
            musicV2Runtime.playlistCoverTargetId = String(playlistId);
            fileInput.value = '';
            fileInput.click();
            return;
        }
        if (action === 'toggle-playback-mode') {
            musicV2TogglePlaybackMode();
            return;
        }
        if (action === 'open-current-playlist-panel') {
            const queue = musicV2EnsurePlayQueue({ reason: 'open-panel-action' });
            const queueItems = musicV2GetQueueDisplayItems(queue);
            if (!queueItems.length) {
                musicV2Toast('当前没有可展示的播放队列');
                return;
            }
            musicV2ShowCurrentPlaylistPanel();
            return;
        }
        if (action === 'close-current-playlist-panel') {
            musicV2HideCurrentPlaylistPanel();
            return;
        }
        if (action === 'play-current-playlist-song') {
            const songId = actionNode.getAttribute('data-song-id');
            const playlistId = actionNode.getAttribute('data-playlist-id');
            if (!songId) return;
            const queue = musicV2EnsurePlayQueue({ reason: 'panel-click' });
            const targetPlaylistId = playlistId || (queue && queue.playlistId) || '';
            musicV2PlaySong(songId, targetPlaylistId).then(() => {
                musicV2RenderCurrentPlaylistPanel();
            }).catch(() => {
                // Playback errors are already handled in musicV2PlaySong.
            });
            return;
        }
        if (action === 'open-song-menu') {
            if (songMenuPanel && songMenuPanel.classList.contains('active')) {
                musicV2HideSongMenu();
            } else {
                musicV2ShowSongMenu();
            }
            return;
        }
        if (action === 'end-together-session') {
            musicV2HideSongMenu();
            musicV2EndTogetherSession();
            return;
        }
        if (action === 'close-together-summary') {
            musicV2HideTogetherSummaryModal();
            return;
        }
        if (action === 'toggle-like-current-song') {
            const song = musicV2GetCurrentSong();
            if (!song) {
                musicV2Toast('暂无播放歌曲');
                return;
            }
            const state = musicV2ToggleLikeSong(song.id);
            if (!state) {
                musicV2Toast('操作失败，请稍后重试');
                return;
            }
            musicV2Persist();
            musicV2RenderSongView();
            musicV2RenderLibrary();
            musicV2RenderPlaylistPage();
            musicV2Toast(state === 'liked' ? '已加入喜欢的歌曲' : '已从喜欢的歌曲移除');
            return;
        }
        if (action === 'toggle-result-select') {
            const songId = actionNode.getAttribute('data-song-id');
            if (!songId) return;
            const sid = String(songId);
            if (musicV2Runtime.selectedResultIds.has(sid)) musicV2Runtime.selectedResultIds.delete(sid);
            else musicV2Runtime.selectedResultIds.add(sid);
            musicV2RenderSearch();
            return;
        }
        if (action === 'toggle-result-select-all') {
            const resultIds = musicV2Runtime.results.map(song => String(song.id));
            if (!resultIds.length) {
                musicV2Toast('暂无可选歌曲');
                return;
            }
            const allSelected = resultIds.every(id => musicV2Runtime.selectedResultIds.has(id));
            if (allSelected) {
                resultIds.forEach(id => musicV2Runtime.selectedResultIds.delete(id));
            } else {
                resultIds.forEach(id => musicV2Runtime.selectedResultIds.add(id));
            }
            musicV2RenderSearch();
            return;
        }
        if (action === 'batch-add-open-picker') {
            const selectedSongs = musicV2Runtime.results.filter(song => musicV2Runtime.selectedResultIds.has(String(song.id)));
            if (!selectedSongs.length) {
                musicV2Toast('请先选择歌曲');
                return;
            }
            musicV2ShowPicker(selectedSongs);
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
        if (action === 'open-friend-music-home') {
            const contactId = actionNode.getAttribute('data-contact-id');
            if (!contactId) return;
            musicV2OpenFriendMusicHome(contactId);
            return;
        }
        if (action === 'close-friend-home') {
            musicV2CloseFriendMusicHome();
            return;
        }
        if (action === 'switch-friend-home-tab') {
            const tab = actionNode.getAttribute('data-tab');
            musicV2SetFriendHomeTab(tab);
            return;
        }
        if (action === 'play-friend-home-song') {
            const songId = actionNode.getAttribute('data-song-id');
            const playlistId = actionNode.getAttribute('data-playlist-id') || MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL;
            if (!songId) return;
            musicV2PlaySong(songId, playlistId).catch(() => {});
            return;
        }
        if (action === 'open-friend-home-playlist') {
            const playlistId = actionNode.getAttribute('data-playlist-id');
            if (!playlistId) return;
            musicV2OpenFriendHomePlaylistPage(playlistId);
            return;
        }
        if (action === 'open-friend-home-work') {
            const workId = actionNode.getAttribute('data-work-id');
            musicV2OpenFriendHomeWork(workId).catch(() => {
                musicV2Toast('打开作品失败，请稍后重试');
            });
            return;
        }
        if (action === 'close-friend-home-detail') {
            musicV2CloseFriendHomeDetail();
            return;
        }
        if (action === 'toggle-friend-home-play') {
            musicV2ToggleFriendHomePlay().catch(() => {
                musicV2Toast('播放失败，请稍后重试');
            });
            return;
        }
        if (action === 'open-friend-home-request') {
            console.info('[music-v2] open-friend-home-request clicked', {
                contactId: String(musicV2Runtime.friendHomeContactId || ''),
                hasProfile: !!musicV2Runtime.friendHomeData
            });
            musicV2OpenFriendHomeRequestPanel();
            return;
        }
        if (action === 'close-friend-home-request') {
            musicV2CloseFriendHomeRequestPanel();
            return;
        }
        if (action === 'set-friend-home-request-mode') {
            const mode = actionNode.getAttribute('data-mode');
            musicV2SetFriendHomeRequestMode(mode);
            return;
        }
        if (action === 'submit-friend-home-request') {
            musicV2SubmitFriendHomeRequest();
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
            musicV2ShowPicker([song]);
            return;
        }
        if (action === 'choose-playlist') {
            const playlistId = actionNode.getAttribute('data-playlist-id');
            const pending = Array.isArray(musicV2Runtime.pendingSongs) && musicV2Runtime.pendingSongs.length
                ? musicV2Runtime.pendingSongs.slice()
                : (musicV2Runtime.pendingSong ? [musicV2Runtime.pendingSong] : []);
            if (!pending.length || !playlistId) return;
            const targetPlaylist = musicV2GetPlaylist(playlistId);
            if (!targetPlaylist) {
                musicV2Toast('歌单不存在');
                return;
            }
            if (musicV2IsSystemPlaylistId(targetPlaylist.id)) {
                musicV2Toast('系统歌单不支持手动添加');
                return;
            }
            musicV2AddSongsToPlaylist(pending, playlistId).then((summary) => {
                const music = musicV2EnsureModel();
                music.activePlaylistId = String(playlistId);
                musicV2Runtime.activePlaylistId = String(playlistId);
                musicV2Persist();
                musicV2RenderLibrary();
                musicV2RenderPlaylistPage();
                musicV2HidePicker();
                musicV2Runtime.selectedResultIds.clear();
                musicV2RenderSearch();
                musicV2Toast(musicV2BuildBatchAddToast(summary));
            }).catch(() => {
                musicV2Toast('添加失败，请稍后重试');
            });
            return;
        }
        if (action === 'open-import') {
            musicV2ShowImportModal();
            return;
        }
        if (action === 'close-import') {
            musicV2HideImportModal();
            return;
        }
        if (action === 'submit-import-playlist') {
            if (musicV2Runtime.importLoading) return;
            const input = root.querySelector('#music-v2-import-url');
            const rawInput = input ? String(input.value || '').trim() : '';
            if (!rawInput) {
                musicV2Toast('请输入网易云歌单链接或ID');
                return;
            }
            musicV2Runtime.importDraft = rawInput;
            musicV2SetImportLoading(true);
            musicV2ImportPlaylistByInput(rawInput).then((summary) => {
                musicV2SetImportLoading(false);
                musicV2HideImportModal();
                musicV2Toast('已导入「' + summary.title + '」(' + summary.songCount + '首)');
                if (summary.detailFallback) {
                    setTimeout(() => musicV2Toast('歌单详情获取失败，已使用默认信息导入'), 260);
                }
            }).catch((error) => {
                musicV2SetImportLoading(false);
                musicV2Toast(musicV2BuildImportErrorMessage(error));
            });
            return;
        }
        if (action === 'open-create') {
            const pickerMask = root.querySelector('#music-v2-picker-mask');
            const fromPicker = !!(pickerMask && pickerMask.classList.contains('active') && musicV2Runtime.pendingSongs.length > 0);
            musicV2Runtime.createFromPicker = fromPicker;
            musicV2ShowCreateModal();
            return;
        }
        if (action === 'close-picker') {
            musicV2HidePicker();
            return;
        }
        if (action === 'close-create') {
            musicV2Runtime.createFromPicker = false;
            musicV2HideCreateModal();
            return;
        }
        if (action === 'toggle-library-manage') {
            const libraryView = root.querySelector('#view-library');
            if (!libraryView || !libraryView.classList.contains('active')) {
                musicV2Toast('请先进入 Library 页管理歌单');
                return;
            }
            if (musicV2Runtime.librarySelectionMode) {
                musicV2ExitLibrarySelectionMode();
            } else {
                musicV2Runtime.librarySelectionMode = true;
                musicV2Runtime.selectedLibraryPlaylistIds.clear();
            }
            musicV2RenderLibrary();
            return;
        }
        if (action === 'toggle-library-playlist-select') {
            const playlistId = actionNode.getAttribute('data-playlist-id');
            if (!playlistId) return;
            musicV2ToggleLibraryPlaylistSelection(playlistId);
            return;
        }
        if (action === 'toggle-library-select-all') {
            musicV2ToggleLibrarySelectAll();
            return;
        }
        if (action === 'cancel-library-manage') {
            musicV2ExitLibrarySelectionMode();
            musicV2RenderLibrary();
            return;
        }
        if (action === 'delete-selected-playlists') {
            musicV2DeleteSelectedPlaylists();
            return;
        }
        if (action === 'create-playlist') {
            const titleInput = root.querySelector('#music-v2-create-title');
            const title = titleInput ? titleInput.value.trim() : '';
            if (!title) {
                musicV2Toast('请输入歌单标题');
                return;
            }
            if (musicV2IsReservedSystemPlaylistTitle(title)) {
                musicV2Toast('该名称为系统歌单，无法创建');
                return;
            }
            musicV2ExitLibrarySelectionMode();
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
            const pending = musicV2Runtime.pendingSongs.slice();
            const shouldBatchAdd = !!(musicV2Runtime.createFromPicker && pending.length > 0);
            if (shouldBatchAdd) {
                musicV2AddSongsToPlaylist(pending, playlist.id).then((summary) => {
                    musicV2Persist();
                    musicV2RenderLibrary();
                    musicV2RenderPlaylistPage();
                    musicV2HideCreateModal();
                    musicV2HidePicker();
                    musicV2Runtime.selectedResultIds.clear();
                    musicV2RenderSearch();
                    musicV2Toast(musicV2BuildBatchAddToast(summary));
                }).catch(() => {
                    musicV2HideCreateModal();
                    musicV2HidePicker();
                    musicV2Toast('添加失败，请稍后重试');
                });
                return;
            }
            musicV2Persist();
            musicV2RenderLibrary();
            musicV2RenderPicker();
            musicV2HideCreateModal();
            musicV2Runtime.createFromPicker = false;
            musicV2Toast('歌单已创建');
            return;
        }
        if (action === 'open-playlist') {
            const playlistId = actionNode.getAttribute('data-playlist-id');
            if (!playlistId) return;
            if (musicV2Runtime.librarySelectionMode) {
                musicV2ToggleLibraryPlaylistSelection(playlistId);
                return;
            }
            musicV2ExitPlaylistSelectionMode();
            musicV2Runtime.friendHomePlaylistPageData = null;
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
            musicV2ExitPlaylistSelectionMode();
            musicV2Runtime.friendHomePlaylistPageData = null;
            window.musicV2ClosePage('page-playlist');
            return;
        }
        if (action === 'toggle-playlist-song-select') {
            const songId = actionNode.getAttribute('data-song-id');
            if (!songId) return;
            musicV2TogglePlaylistSongSelection(songId);
            return;
        }
        if (action === 'toggle-playlist-select-all') {
            musicV2TogglePlaylistSelectAll();
            return;
        }
        if (action === 'cancel-playlist-select') {
            musicV2ExitPlaylistSelectionMode();
            musicV2RenderPlaylistPage();
            return;
        }
        if (action === 'batch-delete-playlist-songs') {
            musicV2DeleteSelectedSongsFromActivePlaylist();
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
        if (action === 'play-friend-home-playlist-first') {
            const friendPlaylistPage = musicV2Runtime.friendHomePlaylistPageData && typeof musicV2Runtime.friendHomePlaylistPageData === 'object'
                ? musicV2Runtime.friendHomePlaylistPageData
                : null;
            const songIds = friendPlaylistPage && Array.isArray(friendPlaylistPage.songIds)
                ? friendPlaylistPage.songIds
                : [];
            if (!songIds.length) {
                musicV2Toast('歌单暂无歌曲');
                return;
            }
            const firstSongId = String(songIds[0] || '');
            if (!firstSongId) {
                musicV2Toast('歌曲不可用');
                return;
            }
            const playbackPlaylistId = String(friendPlaylistPage.playbackPlaylistId || MUSIC_V2_SYSTEM_PLAYLIST_ID_ALL);
            musicV2PlaySong(firstSongId, playbackPlaylistId);
            const active = musicV2GetActiveTogetherSession();
            window.musicV2ToggleSongView(active ? 'together' : 'solo');
            return;
        }
        if (action === 'play-prev') {
            musicV2SkipByOffset(-1);
            return;
        }
        if (action === 'play-next') {
            musicV2SkipByOffset(1);
            return;
        }
    }

    function musicV2InjectFeatureStyles(root) {
        if (root.querySelector('#music-v2-feature-style')) return;
        const styleEl = document.createElement('style');
        styleEl.id = 'music-v2-feature-style';
        const rawFeatureCss = `
            #music-v2-playlist-page-content > .list-item {
                margin: 0 !important;
                padding: 14px 0 !important;
                min-height: 78px !important;
                border-bottom: 1px solid #e5e5ea !important;
                background: transparent !important;
                box-sizing: border-box;
            }
            #music-v2-playlist-page-content > .list-item.music-v2-playlist-song-item {
                transition: background .16s ease, border-color .16s ease;
            }
            #music-v2-playlist-page-content > .list-item.music-v2-playlist-song-item.selected {
                background: rgba(17,17,17,0.06) !important;
                border-bottom-color: rgba(17,17,17,0.14) !important;
            }
            #music-v2-playlist-page-content > .list-item:last-child {
                border-bottom: none !important;
            }
            #music-v2-playlist-page-content .li-info {
                display: flex;
                flex-direction: column;
                justify-content: center;
                gap: 6px;
            }
            #music-v2-playlist-page-content .li-info h4,
            #music-v2-playlist-page-content .li-info p {
                margin: 0 !important;
                line-height: 1.2 !important;
            }
            #music-v2-playlist-page-content .li-num i {
                font-size: 18px;
                color: #6b7280;
            }
            #music-v2-playlist-page-content .list-item.selected .li-num i {
                color: #111;
            }
            .music-v2-playlist-item-action i {
                font-size: 14px;
            }
            .music-v2-playlist-longpress-tip {
                margin-top: 10px;
                font-size: 12px;
                color: var(--text-gray);
            }
            .music-v2-playlist-selection-tools {
                margin-top: 10px;
                display: flex;
                align-items: center;
                gap: 8px;
                flex-wrap: wrap;
                justify-content: center;
            }
            .music-v2-playlist-selection-state {
                font-size: 12px;
                color: var(--text-gray);
                min-width: 80px;
                text-align: center;
            }
            .music-v2-playlist-delete-btn[disabled] {
                opacity: 0.45;
                pointer-events: none;
            }
            #music-v2-library-list > .list-item {
                border-bottom: none !important;
                box-shadow: none !important;
                margin-bottom: 16px !important;
            }
            #music-v2-library-list > .list-item.selected {
                background: rgba(17,17,17,0.06) !important;
                border: 1px solid rgba(17,17,17,0.12);
                border-radius: 18px;
                padding-left: 10px;
                padding-right: 10px;
            }
            #music-v2-library-list > .list-item.music-v2-library-item-locked {
                opacity: 0.78;
            }
            #music-v2-library-list > .list-item .li-action {
                font-size: 22px;
            }
            #music-v2-library-list > .list-item::before,
            #music-v2-library-list > .list-item::after {
                display: none !important;
                border-bottom: none !important;
            }
            #music-v2-library-manage-tools {
                margin-bottom: 10px;
            }
            .music-v2-library-manage-tools {
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 8px;
                background: rgba(255,255,255,0.72);
                border: 1px solid rgba(17,17,17,0.08);
                border-radius: 14px;
                padding: 8px 10px;
            }
            .music-v2-library-manage-state {
                font-size: 12px;
                color: var(--text-gray);
                white-space: nowrap;
                min-width: 72px;
                text-align: center;
            }
            .music-v2-library-delete-btn[disabled] {
                opacity: 0.45;
                pointer-events: none;
            }
            .top-bar .ri-settings-4-line.music-v2-library-manage-active {
                color: #111 !important;
                background: rgba(17,17,17,0.1);
                border-radius: 999px;
                padding: 5px;
            }
            .pl-hero .music-v2-playlist-cover {
                cursor: pointer;
                transition: transform .18s ease, opacity .18s ease;
            }
            .pl-hero .music-v2-playlist-cover:hover {
                opacity: .92;
                transform: scale(1.01);
            }
            .music-v2-search-state { font-size: 12px; color: var(--text-gray); margin: 0 4px 10px; }
            .music-v2-search-results { display: flex; flex-direction: column; gap: 10px; }
            .music-v2-search-tools {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                background: rgba(255,255,255,0.72);
                border: 1px solid rgba(17,17,17,0.08);
                border-radius: 14px;
                padding: 8px 10px;
            }
            .music-v2-search-picked {
                font-size: 12px;
                color: var(--text-gray);
                white-space: nowrap;
            }
            .music-v2-result-item {
                background: rgba(255,255,255,0.72);
                border-radius: 16px;
                padding: 10px;
                margin-bottom: 0;
                border: 1px solid transparent;
            }
            .music-v2-result-item.selected {
                border-color: rgba(17,17,17,0.2);
                background: rgba(255,255,255,0.88);
            }
            .music-v2-result-check {
                width: 34px;
                height: 34px;
                border: 1px solid #d1d1d6;
                border-radius: 10px;
                background: #fff;
                color: #6b7280;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                flex: 0 0 34px;
                font-size: 16px;
            }
            .music-v2-result-check.active {
                border-color: #111111;
                background: #111111;
                color: #fff;
            }
            .music-v2-action-btn {
                border: none; background: #1c1c1e; color: #fff; border-radius: 14px; padding: 8px 12px;
                font-size: 12px; font-weight: 600; white-space: nowrap;
            }
            .music-v2-library-actions {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            .music-v2-import-btn {
                background: #2a2a2c;
            }
            .music-v2-batch-add-btn[disabled] {
                opacity: 0.45;
                pointer-events: none;
            }
            .music-v2-import-submit-btn[disabled] {
                opacity: 0.6;
                pointer-events: none;
            }
            .music-v2-playback-mode-btn {
                transition: color .2s ease, transform .2s ease;
            }
            .music-v2-song-footer-row {
                display: none !important;
            }
            .music-v2-current-playlist-btn {
                color: var(--text-gray) !important;
                font-size: 24px !important;
                transition: opacity .2s ease, transform .2s ease;
            }
            .music-v2-current-playlist-btn:active {
                opacity: 0.72;
                transform: scale(0.96);
            }
            #song-view .sv-header {
                position: relative;
            }
            .music-v2-level-pill {
                position: absolute;
                left: 32px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 11px;
                font-weight: 700;
                color: #111;
                background: rgba(255,255,255,0.88);
                border: 1px solid rgba(17,17,17,0.08);
                border-radius: 999px;
                min-height: 20px;
                padding: 1px 8px 0;
                line-height: 18px;
                pointer-events: none;
                z-index: 2;
            }
            .music-v2-friend-head {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 4px;
                min-width: 0;
            }
            .music-v2-friend-head h4 {
                margin: 0 !important;
            }
            .music-v2-bond-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 20px;
                padding: 1px 8px 0;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 700;
                color: #5f6368;
                background: rgba(142, 142, 147, 0.16);
                border: 1px solid rgba(142, 142, 147, 0.26);
                line-height: 1;
                white-space: nowrap;
            }
            .music-v2-bond-badge.active {
                color: #111;
                background: rgba(17, 17, 17, 0.12);
                border-color: rgba(17, 17, 17, 0.2);
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
            .music-v2-summary-mask {
                align-items: center;
            }
            .music-v2-song-menu-panel {
                position: absolute;
                top: 86px;
                right: 24px;
                display: none;
                min-width: 150px;
                background: rgba(255,255,255,0.98);
                border: 1px solid #e5e5ea;
                border-radius: 12px;
                padding: 6px;
                box-shadow: 0 12px 24px rgba(0,0,0,0.16);
                z-index: 270;
            }
            .music-v2-song-menu-panel.active {
                display: block;
            }
            .music-v2-song-menu-item {
                width: 100%;
                border: none;
                background: #fff;
                border-radius: 10px;
                min-height: 38px;
                padding: 0 10px;
                text-align: left;
                font-size: 13px;
                font-weight: 600;
                color: #d93025;
            }
            .music-v2-song-menu-item:active {
                background: #f4f4f5;
            }
            .music-v2-song-menu-item[disabled] {
                opacity: 0.45;
                pointer-events: none;
                color: #8e8e93;
            }
            .music-v2-modal-card {
                width: 100%; max-width: 500px; max-height: 72%; overflow: auto;
                background: rgba(255,255,255,0.96); border-radius: 22px; padding: 12px;
                box-shadow: 0 14px 32px rgba(0,0,0,0.18);
            }
            .music-v2-current-playlist-card {
                padding: 12px;
            }
            .music-v2-current-playlist-head {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 10px;
            }
            .music-v2-current-playlist-title-wrap {
                min-width: 0;
            }
            .music-v2-current-playlist-title {
                font-size: 16px;
                font-weight: 800;
                color: #111;
                line-height: 1.2;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .music-v2-current-playlist-count {
                font-size: 12px;
                color: var(--text-gray);
            }
            .music-v2-current-playlist-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .music-v2-current-playlist-item {
                width: 100%;
                border: 1px solid #ececef;
                background: #fff;
                border-radius: 12px;
                padding: 10px 12px;
                display: flex;
                align-items: center;
                gap: 10px;
                text-align: left;
                color: #111;
            }
            .music-v2-current-playlist-item i {
                color: #7f7f84;
                font-size: 18px;
                margin-left: auto;
                flex-shrink: 0;
            }
            .music-v2-current-playlist-index {
                width: 22px;
                flex-shrink: 0;
                font-size: 12px;
                color: #7f7f84;
                text-align: center;
            }
            .music-v2-current-playlist-meta {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
                overflow: hidden;
            }
            .music-v2-current-playlist-meta strong {
                font-size: 14px;
                line-height: 1.2;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .music-v2-current-playlist-meta small {
                font-size: 12px;
                line-height: 1.2;
                color: #7f7f84;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .music-v2-current-playlist-item.active {
                border-color: rgba(17,17,17,0.22);
                background: rgba(17,17,17,0.06);
            }
            .music-v2-current-playlist-item.active .music-v2-current-playlist-index,
            .music-v2-current-playlist-item.active .music-v2-current-playlist-meta small,
            .music-v2-current-playlist-item.active i {
                color: #111;
            }
            .music-v2-current-playlist-empty {
                border-radius: 12px;
                background: #f6f6f7;
                color: var(--text-gray);
                font-size: 13px;
                text-align: center;
                padding: 20px 12px;
            }
            .music-v2-together-summary-card {
                width: min(92%, 360px);
                max-width: 360px;
                max-height: none;
                padding: 16px 14px 14px;
            }
            .music-v2-together-summary-title {
                font-size: 18px;
                font-weight: 800;
                color: #111;
                text-align: center;
                margin-bottom: 6px;
            }
            .music-v2-together-summary-sub {
                text-align: center;
                color: var(--text-gray);
                font-size: 13px;
                margin-bottom: 12px;
            }
            .music-v2-together-summary-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 12px;
                border-radius: 12px;
                background: #f6f6f7;
                margin-bottom: 8px;
                font-size: 13px;
            }
            .music-v2-together-summary-row strong {
                font-size: 14px;
                color: #111;
            }
            .music-v2-modal-head {
                display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
                font-size: 16px; font-weight: 700;
            }
            .music-v2-modal-btn {
                border: none; background: #e5e5ea; color: #000; border-radius: 12px; padding: 7px 10px; font-size: 12px;
            }
            .music-v2-back-button-card {
                width: min(100%, 360px);
                max-width: 360px;
                padding: 14px;
            }
            .music-v2-back-button-preview-wrap {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 10px;
                margin-bottom: 14px;
            }
            .music-v2-back-button-preview {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                border: 3px solid #fff;
                box-shadow: 0 8px 18px rgba(0,0,0,0.08);
                background: center / cover no-repeat #f2f2f7;
            }
            .music-v2-back-button-tip {
                font-size: 12px;
                line-height: 1.5;
                color: var(--text-gray);
                text-align: center;
            }
            .music-v2-back-button-actions {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 10px;
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
            .music-v2-friend-invite-btn {
                border: none;
                padding: 0;
                outline: none;
                cursor: pointer;
            }
            .music-v2-friend-home-mask {
                position: absolute;
                inset: 0;
                z-index: 335;
                display: none;
                background: #fff;
            }
            #page-playlist {
                z-index: 340;
            }
            .music-v2-friend-home-mask.active { display: block; }
            .music-v2-friend-home-shell {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
                background: #fff;
                color: #1d1d1f;
            }
            .music-v2-fh-page {
                position: absolute;
                inset: 0;
                overflow-x: hidden;
                overflow-y: auto;
                transition: transform .35s cubic-bezier(0.36,0.66,0.04,1), opacity .35s ease;
                background: #fff;
            }
            .music-v2-fh-page-right { transform: translateX(100%); }
            .music-v2-fh-page-active { transform: translateX(0); }
            .music-v2-fh-page-left { transform: translateX(-30%); opacity: .8; }
            .music-v2-fh-header {
                position: sticky;
                top: 0;
                height: 100px;
                padding: 40px 16px 0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                background: rgba(255,255,255,.72);
                backdrop-filter: blur(18px);
                -webkit-backdrop-filter: blur(18px);
                border-bottom: .5px solid rgba(0,0,0,.06);
                z-index: 20;
            }
            .music-v2-fh-header-title { font-size: 17px; font-weight: 700; letter-spacing: -.3px; }
            .music-v2-fh-icon-btn {
                width: 32px;
                height: 32px;
                border: none;
                background: transparent;
                color: #1d1d1f;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                padding: 0;
            }
            .music-v2-fh-urge-btn {
                min-width: 56px;
                height: 30px;
                border: none;
                border-radius: 999px;
                background: #111;
                color: #fff;
                font-size: 12px;
                font-weight: 700;
            }
            .music-v2-fh-profile { padding: 18px 20px; }
            .music-v2-fh-profile-top { display: flex; align-items: center; gap: 16px; }
            .music-v2-fh-avatar-wrap { width: 76px; height: 76px; flex-shrink: 0; position: relative; }
            .music-v2-fh-avatar {
                width: 76px;
                height: 76px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid rgba(0,0,0,.06);
                background: #e5e5ea;
            }
            .music-v2-fh-profile-info { min-width: 0; flex: 1; }
            .music-v2-fh-name { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
            .music-v2-fh-uid { font-size: 13px; color: #86868b; margin-bottom: 4px; }
            .music-v2-fh-scene { font-size: 11px; color: #6f6f74; letter-spacing: .4px; }
            .music-v2-fh-stats { display: flex; gap: 24px; margin-top: 14px; }
            .music-v2-fh-stat-item { display: flex; flex-direction: column; }
            .music-v2-fh-stat-num { font-size: 18px; font-weight: 700; }
            .music-v2-fh-stat-label { font-size: 12px; color: #86868b; }
            .music-v2-fh-bio { margin-top: 14px; font-size: 14px; color: #707075; line-height: 1.6; }
            .music-v2-fh-tabs {
                position: sticky;
                top: 84px;
                z-index: 15;
                display: flex;
                gap: 24px;
                padding: 0 20px;
                background: rgba(255,255,255,.72);
                backdrop-filter: blur(18px);
                -webkit-backdrop-filter: blur(18px);
                border-bottom: .5px solid rgba(0,0,0,.06);
            }
            .music-v2-fh-tab {
                border: none;
                background: transparent;
                color: #86868b;
                font-size: 15px;
                font-weight: 600;
                padding: 12px 0;
                position: relative;
            }
            .music-v2-fh-tab.active { color: #1d1d1f; }
            .music-v2-fh-tab.active::after {
                content: '';
                position: absolute;
                left: 50%;
                bottom: 0;
                transform: translateX(-50%);
                width: 20px;
                height: 3px;
                border-radius: 3px;
                background: #1d1d1f;
            }
            .music-v2-fh-main-list {
                padding: 16px 20px 30px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .music-v2-fh-list-title { font-size: 13px; font-weight: 700; color: #6d6d72; margin-top: 4px; }
            .music-v2-fh-playlist-group { display: flex; flex-direction: column; gap: 8px; }
            .music-v2-fh-playlist-card {
                width: 100%;
                border: none;
                border-radius: 14px;
                background: #f1f1f4;
                padding: 10px 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                text-align: left;
                color: inherit;
            }
            .music-v2-fh-playlist-cover {
                width: 48px;
                height: 48px;
                border-radius: 10px;
                object-fit: cover;
                background: #e5e5ea;
                flex-shrink: 0;
            }
            .music-v2-fh-playlist-main {
                min-width: 0;
                flex: 1;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .music-v2-fh-playlist-main strong {
                font-size: 15px;
                font-weight: 700;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .music-v2-fh-playlist-main small {
                color: #7b7b81;
                font-size: 12px;
            }
            .music-v2-fh-playlist-card i { color: #7b7b81; font-size: 20px; }
            .music-v2-fh-playlist-songs {
                display: flex;
                flex-direction: column;
                gap: 10px;
                padding: 0 2px 4px;
            }
            .music-v2-fh-empty {
                border-radius: 12px;
                background: #f5f5f7;
                color: #86868b;
                font-size: 13px;
                text-align: center;
                padding: 20px 12px;
            }
            .music-v2-fh-work-item,
            .music-v2-fh-song-row {
                width: 100%;
                border: none;
                background: #f5f5f7;
                border-radius: 14px;
                padding: 10px 12px;
                display: flex;
                align-items: center;
                gap: 12px;
                color: inherit;
                text-align: left;
            }
            .music-v2-fh-song-row i { margin-left: auto; color: #7e7e83; font-size: 20px; }
            .music-v2-fh-song-row img,
            .music-v2-fh-work-cover img {
                width: 52px;
                height: 52px;
                border-radius: 10px;
                object-fit: cover;
                flex-shrink: 0;
                background: #e5e5ea;
            }
            .music-v2-fh-song-row span {
                min-width: 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .music-v2-fh-song-row strong {
                font-size: 14px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .music-v2-fh-song-row small {
                font-size: 12px;
                color: #86868b;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .music-v2-fh-work-info { min-width: 0; flex: 1; }
            .music-v2-fh-work-title {
                font-size: 15px;
                font-weight: 600;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .music-v2-fh-work-meta { font-size: 12px; color: #86868b; display: flex; gap: 8px; align-items: center; }
            .music-v2-fh-grade { font-weight: 800; font-style: italic; color: #1d1d1f; }
            .music-v2-fh-dynamic-item {
                border-radius: 12px;
                background: #f5f5f7;
                color: #444;
                font-size: 14px;
                line-height: 1.6;
                padding: 12px;
            }
            .music-v2-fh-player-cover-wrap {
                padding: 40px;
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .music-v2-fh-player-cover {
                width: 236px;
                height: 236px;
                border-radius: 50%;
                border: 8px solid rgba(0,0,0,.05);
                background: #f5f5f7;
                box-shadow: 0 20px 40px rgba(0,0,0,.05);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                animation: music-v2-fh-spin 10s linear infinite;
                animation-play-state: paused;
            }
            .music-v2-fh-player-cover img { width: 68%; height: 68%; border-radius: 50%; object-fit: cover; }
            .music-v2-fh-player-cover.playing { animation-play-state: running; }
            @keyframes music-v2-fh-spin { 100% { transform: rotate(360deg); } }
            .music-v2-fh-player-info { text-align: center; padding: 0 20px; }
            .music-v2-fh-player-title { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
            .music-v2-fh-player-author { font-size: 16px; color: #86868b; margin-bottom: 20px; }
            .music-v2-fh-lyric {
                margin: 0 22px;
                border-radius: 14px;
                background: #f5f5f7;
                color: #666;
                font-size: 14px;
                line-height: 1.7;
                text-align: center;
                padding: 12px 14px;
            }
            .music-v2-fh-controls {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 28px;
                margin-top: 30px;
                padding-bottom: 40px;
            }
            .music-v2-fh-secondary-btn {
                border: none;
                background: transparent;
                color: #1d1d1f;
                font-size: 24px;
                padding: 0;
            }
            .music-v2-fh-play-btn {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                border: none;
                background: #1d1d1f;
                color: #fff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 32px;
                padding: 0;
            }
            .music-v2-fh-request-card {
                width: min(92%, 360px);
                max-width: 360px;
                max-height: none;
                padding: 14px;
            }
            .music-v2-fh-request-modes {
                display: flex;
                gap: 8px;
                margin-bottom: 10px;
            }
            .music-v2-fh-request-mode-btn {
                flex: 1;
                border: 1px solid #d8d8de;
                background: #f7f7fa;
                border-radius: 12px;
                min-height: 36px;
                font-size: 13px;
                font-weight: 700;
                color: #666;
            }
            .music-v2-fh-request-mode-btn.active {
                border-color: #111;
                background: #111;
                color: #fff;
            }
            .music-v2-fh-request-mode-btn:disabled {
                opacity: 0.55;
            }
            #music-v2-fh-request-mask {
                z-index: 360;
            }
            #music-v2-fh-generate-mask {
                z-index: 370;
            }
            .music-v2-fh-generate-card {
                width: min(88%, 320px);
                max-width: 320px;
                border-radius: 18px;
                padding: 20px 16px;
                text-align: center;
                background: #ffffff;
            }
            .music-v2-fh-generate-spinner {
                width: 44px;
                height: 44px;
                margin: 0 auto 12px;
                border-radius: 50%;
                border: 3px solid rgba(0,0,0,0.12);
                border-top-color: #111;
                animation: music-v2-fh-generate-spin .9s linear infinite;
            }
            .music-v2-fh-generate-title {
                font-size: 16px;
                font-weight: 700;
                color: #111;
                margin-bottom: 8px;
            }
            .music-v2-fh-generate-status {
                color: #6b6b72;
                font-size: 13px;
                line-height: 1.6;
            }
            @keyframes music-v2-fh-generate-spin {
                to { transform: rotate(360deg); }
            }
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
        styleEl.textContent = musicV2ScopeCssText(rawFeatureCss, MUSIC_V2_SCOPE_ROOT);
        root.appendChild(styleEl);
    }

    function musicV2EnsureFeatureNodes(root) {
        const body = root.querySelector('.music-v2-body') || root;
        const bellBtn = root.querySelector('.top-bar .ri-notification-3-line');
        if (bellBtn) {
            bellBtn.classList.add('clickable');
            bellBtn.setAttribute('data-musicv2-action', 'open-back-button-panel');
            bellBtn.setAttribute('title', '更换左上角返回按钮图片');
            bellBtn.setAttribute('aria-label', '更换左上角返回按钮图片');
        }
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
            const modeBtn = songView.querySelector('.sv-controls > i:first-child');
            const likeBtn = songView.querySelector('i.music-v2-like-btn, i.ri-heart-3-fill.clickable[style*="font-size: 28px"], i.ri-heart-3-line.clickable[style*="font-size: 28px"]');
            const prevBtn = songView.querySelector('.ri-skip-back-fill');
            const nextBtn = songView.querySelector('.ri-skip-forward-fill');
            const currentPlaylistBtn = songView.querySelector('.sv-controls > i:last-child');
            const moreBtn = songView.querySelector('.sv-header > i:last-child');
            const headerRow = songView.querySelector('.sv-header');
            const footerSpeakerIcon = songView.querySelector('.ri-speaker-2-line');
            const footerRow = footerSpeakerIcon && footerSpeakerIcon.parentElement
                ? footerSpeakerIcon.parentElement
                : null;
            if (footerRow) footerRow.classList.add('music-v2-song-footer-row');
            if (headerRow && !songView.querySelector('#music-v2-level-pill')) {
                const levelPill = document.createElement('span');
                levelPill.id = 'music-v2-level-pill';
                levelPill.className = 'music-v2-level-pill';
                levelPill.textContent = 'Lv.1';
                headerRow.appendChild(levelPill);
            }
            if (!songView.querySelector('#music-v2-song-menu-panel')) {
                const menuPanel = document.createElement('div');
                menuPanel.id = 'music-v2-song-menu-panel';
                menuPanel.className = 'music-v2-song-menu-panel';
                menuPanel.innerHTML =
                    '<button id="music-v2-song-menu-end" class="music-v2-song-menu-item" data-musicv2-action="end-together-session">结束一起听</button>';
                songView.appendChild(menuPanel);
            }
            if (modeBtn) {
                modeBtn.classList.add('music-v2-playback-mode-btn');
                modeBtn.setAttribute('data-musicv2-action', 'toggle-playback-mode');
            }
            if (likeBtn) {
                likeBtn.classList.add('music-v2-like-btn');
                likeBtn.setAttribute('data-musicv2-action', 'toggle-like-current-song');
            }
            if (currentPlaylistBtn) {
                currentPlaylistBtn.className = 'ri-play-list-2-line clickable music-v2-current-playlist-btn';
                currentPlaylistBtn.setAttribute('data-musicv2-action', 'open-current-playlist-panel');
                currentPlaylistBtn.setAttribute('title', '当前播放列表');
                currentPlaylistBtn.setAttribute('aria-label', '打开当前播放列表');
            }
            if (moreBtn) {
                moreBtn.classList.add('clickable');
                moreBtn.setAttribute('data-musicv2-action', 'open-song-menu');
            }
            if (prevBtn) prevBtn.setAttribute('data-musicv2-action', 'play-prev');
            if (nextBtn) nextBtn.setAttribute('data-musicv2-action', 'play-next');
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
        if (!root.querySelector('#music-v2-friend-home-mask')) {
            const friendHomeMask = document.createElement('div');
            friendHomeMask.id = 'music-v2-friend-home-mask';
            friendHomeMask.className = 'music-v2-friend-home-mask';
            friendHomeMask.innerHTML =
                '<div class="music-v2-friend-home-shell">' +
                    '<div id="music-v2-friend-page-main" class="music-v2-fh-page music-v2-fh-page-active">' +
                        '<div class="music-v2-fh-header">' +
                            '<button class="music-v2-fh-icon-btn clickable" data-musicv2-action="close-friend-home"><i class="ri-arrow-left-s-line"></i></button>' +
                            '<div class="music-v2-fh-header-title">PERSONAL</div>' +
                            '<button class="music-v2-fh-urge-btn clickable" data-musicv2-action="open-friend-home-request">催更</button>' +
                        '</div>' +
                        '<div class="music-v2-fh-profile">' +
                            '<div class="music-v2-fh-profile-top">' +
                                '<div class="music-v2-fh-avatar-wrap"><img id="music-v2-fh-avatar" class="music-v2-fh-avatar" src="' + musicV2EscapeHtml(MUSIC_V2_DEFAULT_COVER) + '"></div>' +
                                '<div class="music-v2-fh-profile-info">' +
                                    '<div id="music-v2-fh-name" class="music-v2-fh-name">联系人</div>' +
                                    '<div id="music-v2-fh-uid" class="music-v2-fh-uid">ID: 00000000</div>' +
                                    '<div id="music-v2-fh-scene" class="music-v2-fh-scene">帮我设计一个行程的页面ui样式，可以点击某一天的日期查看当天的行程安排（需要有 时间线），用户可以进行交互，要求是页面过渡动画自然，需要有点击反馈，整体简约ios风格，黑白灰配色，手账本样式，可以翻页，可以切换查看月计划周计划和日计划，周计划月计划的布局和标记方式可以参考 我给的图片，上下竖屏，不要夜间模式，需要有新意，可以有磨砂玻璃效果，用到中英文、特殊字体、符号、图标来装饰（重要），加一些小动效，不要emoji，给我两个版本文件。</div>' +
                                '</div>' +
                            '</div>' +
                            '<div class="music-v2-fh-stats">' +
                                '<div class="music-v2-fh-stat-item"><span id="music-v2-fh-following" class="music-v2-fh-stat-num">0</span><span class="music-v2-fh-stat-label">Following</span></div>' +
                                '<div class="music-v2-fh-stat-item"><span id="music-v2-fh-followers" class="music-v2-fh-stat-num">0</span><span class="music-v2-fh-stat-label">Followers</span></div>' +
                                '<div class="music-v2-fh-stat-item"><span id="music-v2-fh-likes" class="music-v2-fh-stat-num">0</span><span class="music-v2-fh-stat-label">Likes</span></div>' +
                            '</div>' +
                            '<div id="music-v2-fh-bio" class="music-v2-fh-bio">欢迎来听歌。</div>' +
                        '</div>' +
                        '<div class="music-v2-fh-tabs">' +
                            '<button class="music-v2-fh-tab active clickable" data-musicv2-action="switch-friend-home-tab" data-tab="works">Works</button>' +
                            '<button class="music-v2-fh-tab clickable" data-musicv2-action="switch-friend-home-tab" data-tab="dynamic">Dynamic</button>' +
                            '<button class="music-v2-fh-tab clickable" data-musicv2-action="switch-friend-home-tab" data-tab="likes">Likes</button>' +
                        '</div>' +
                        '<div id="music-v2-fh-main-list" class="music-v2-fh-main-list"></div>' +
                    '</div>' +
                    '<div id="music-v2-friend-page-detail" class="music-v2-fh-page music-v2-fh-page-right">' +
                        '<div class="music-v2-fh-header">' +
                            '<button class="music-v2-fh-icon-btn clickable" data-musicv2-action="close-friend-home-detail"><i class="ri-arrow-left-s-line"></i></button>' +
                            '<div class="music-v2-fh-header-title">PLAYING</div>' +
                            '<div class="music-v2-fh-icon-btn"><i class="ri-share-forward-line"></i></div>' +
                        '</div>' +
                        '<div class="music-v2-fh-player-cover-wrap">' +
                            '<div id="music-v2-fh-record" class="music-v2-fh-player-cover">' +
                                '<img id="music-v2-fh-record-img" src="' + musicV2EscapeHtml(MUSIC_V2_DEFAULT_COVER) + '">' +
                            '</div>' +
                        '</div>' +
                        '<div class="music-v2-fh-player-info">' +
                            '<div id="music-v2-fh-detail-title" class="music-v2-fh-player-title">Song Name</div>' +
                            '<div id="music-v2-fh-detail-author" class="music-v2-fh-player-author">Author</div>' +
                        '</div>' +
                        '<div id="music-v2-fh-detail-lyric" class="music-v2-fh-lyric">轻触播放，听听这段翻唱。</div>' +
                        '<div class="music-v2-fh-controls">' +
                            '<button class="music-v2-fh-secondary-btn clickable"><i class="ri-heart-line"></i></button>' +
                            '<button class="music-v2-fh-play-btn clickable" data-musicv2-action="toggle-friend-home-play"><i id="music-v2-fh-play-icon" class="ri-play-fill"></i></button>' +
                            '<button class="music-v2-fh-secondary-btn clickable"><i class="ri-chat-1-line"></i></button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
            body.appendChild(friendHomeMask);
        }
        if (!root.querySelector('#music-v2-fh-request-mask')) {
            const requestMask = document.createElement('div');
            requestMask.id = 'music-v2-fh-request-mask';
            requestMask.className = 'music-v2-modal-mask music-v2-summary-mask';
            requestMask.innerHTML =
                '<div class="music-v2-modal-card music-v2-fh-request-card">' +
                    '<div class="music-v2-modal-head"><span>催更创作</span><button class="music-v2-modal-btn" data-musicv2-action="close-friend-home-request">关闭</button></div>' +
                    '<div class="music-v2-fh-request-modes">' +
                        '<button id="music-v2-fh-request-mode-cover" class="music-v2-fh-request-mode-btn active" data-musicv2-action="set-friend-home-request-mode" data-mode="cover">翻唱</button>' +
                        '<button id="music-v2-fh-request-mode-original" class="music-v2-fh-request-mode-btn" data-musicv2-action="set-friend-home-request-mode" data-mode="original">原创</button>' +
                    '</div>' +
                    '<div class="music-v2-create-row"><label id="music-v2-fh-request-input-label">歌名或链接（留空则默认当前播放）</label><input id="music-v2-fh-request-input" type="text" placeholder="例如：红 / 网易云链接"></div>' +
                    '<button id="music-v2-fh-request-submit" class="music-v2-action-btn" data-musicv2-action="submit-friend-home-request" style="width:100%;">生成翻唱作品</button>' +
                '</div>';
            body.appendChild(requestMask);
        }
        if (!root.querySelector('#music-v2-fh-generate-mask') && !document.getElementById('music-v2-fh-generate-mask')) {
            const generateMask = document.createElement('div');
            generateMask.id = 'music-v2-fh-generate-mask';
            generateMask.className = 'music-v2-modal-mask music-v2-summary-mask';
            generateMask.innerHTML =
                '<div class="music-v2-modal-card music-v2-fh-generate-card">' +
                    '<div class="music-v2-fh-generate-spinner"></div>' +
                    '<div id="music-v2-fh-generate-title" class="music-v2-fh-generate-title">翻唱生成中</div>' +
                    '<div id="music-v2-fh-generate-status" class="music-v2-fh-generate-status">正在生成翻唱作品，请稍候...</div>' +
                '</div>';
            body.appendChild(generateMask);
        }

        const libraryView = root.querySelector('#view-library');
        if (libraryView) {
            libraryView.innerHTML =
                '<div class="sec-title" style="font-size: 28px; font-weight: 800; display:flex; justify-content:space-between; align-items:center;">' +
                    'Library' +
                    '<div class="music-v2-library-actions">' +
                        '<button class="music-v2-action-btn music-v2-import-btn" data-musicv2-action="open-import">导入歌单</button>' +
                        '<button class="music-v2-action-btn" data-musicv2-action="open-create">新建歌单</button>' +
                    '</div>' +
                '</div>' +
                '<div id="music-v2-library-manage-tools"></div>' +
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

        if (!root.querySelector('#music-v2-import-mask')) {
            const importMask = document.createElement('div');
            importMask.id = 'music-v2-import-mask';
            importMask.className = 'music-v2-modal-mask';
            importMask.innerHTML =
                '<div class="music-v2-modal-card">' +
                    '<div class="music-v2-modal-head"><span>导入网易云歌单</span><button class="music-v2-modal-btn" data-musicv2-action="close-import">关闭</button></div>' +
                    '<div class="music-v2-create-row"><label>歌单链接或ID</label><input id="music-v2-import-url" type="text" placeholder="粘贴网易云歌单链接或ID"></div>' +
                    '<button class="music-v2-action-btn music-v2-import-submit-btn" data-musicv2-action="submit-import-playlist" style="width:100%;">导入</button>' +
                '</div>';
            body.appendChild(importMask);
        }

        if (!root.querySelector('#music-v2-together-summary-mask')) {
            const summary = document.createElement('div');
            summary.id = 'music-v2-together-summary-mask';
            summary.className = 'music-v2-modal-mask music-v2-summary-mask';
            summary.innerHTML =
                '<div class="music-v2-modal-card music-v2-together-summary-card">' +
                    '<div class="music-v2-together-summary-title">一起听已结束</div>' +
                    '<div class="music-v2-together-summary-sub">你和 <span id="music-v2-summary-contact">联系人</span> 的本次记录</div>' +
                    '<div class="music-v2-together-summary-row"><span>一起听时长</span><strong id="music-v2-summary-duration">0秒</strong></div>' +
                    '<div class="music-v2-together-summary-row"><span>一起听歌曲</span><strong><span id="music-v2-summary-count">0</span> 首</strong></div>' +
                    '<button class="music-v2-action-btn" data-musicv2-action="close-together-summary" style="width:100%; margin-top:6px;">知道了</button>' +
                '</div>';
            body.appendChild(summary);
        }

        if (!root.querySelector('#music-v2-current-playlist-mask')) {
            const playlistMask = document.createElement('div');
            playlistMask.id = 'music-v2-current-playlist-mask';
            playlistMask.className = 'music-v2-modal-mask';
            playlistMask.innerHTML =
                '<div class="music-v2-modal-card music-v2-current-playlist-card">' +
                    '<div class="music-v2-current-playlist-head">' +
                        '<div class="music-v2-current-playlist-title-wrap">' +
                            '<div id="music-v2-current-playlist-title" class="music-v2-current-playlist-title">当前播放列表</div>' +
                            '<div id="music-v2-current-playlist-count" class="music-v2-current-playlist-count">0 首</div>' +
                        '</div>' +
                        '<button class="music-v2-modal-btn" data-musicv2-action="close-current-playlist-panel">关闭</button>' +
                    '</div>' +
                    '<div id="music-v2-current-playlist-list" class="music-v2-current-playlist-list">' +
                        '<div class="music-v2-current-playlist-empty">当前歌单暂无歌曲</div>' +
                    '</div>' +
                '</div>';
            body.appendChild(playlistMask);
        }

        if (!root.querySelector('#music-v2-back-button-mask')) {
            const backButtonMask = document.createElement('div');
            backButtonMask.id = 'music-v2-back-button-mask';
            backButtonMask.className = 'music-v2-modal-mask music-v2-summary-mask';
            backButtonMask.innerHTML =
                '<div class="music-v2-modal-card music-v2-back-button-card">' +
                    '<div class="music-v2-modal-head"><span>更换返回按钮图片</span><button class="music-v2-modal-btn" data-musicv2-action="close-back-button-panel">关闭</button></div>' +
                    '<div class="music-v2-back-button-preview-wrap">' +
                        '<div id="music-v2-back-button-preview" class="music-v2-back-button-preview"></div>' +
                        '<div class="music-v2-back-button-tip">点击铃铛后，可在这里上传本地图片或粘贴图片 URL 来替换左上角返回按钮图片。</div>' +
                    '</div>' +
                    '<div class="music-v2-create-row"><label>图片 URL</label><input id="music-v2-back-button-url" type="text" placeholder="粘贴图片链接，例如 https://example.com/avatar.png"></div>' +
                    '<div class="music-v2-back-button-actions">' +
                        '<button class="music-v2-modal-btn" data-musicv2-action="choose-back-button-file">本地上传</button>' +
                        '<button class="music-v2-action-btn" data-musicv2-action="apply-back-button-url">使用 URL</button>' +
                    '</div>' +
                    '<button class="music-v2-modal-btn" data-musicv2-action="reset-back-button-image" style="width:100%; margin-top:10px;">恢复默认图片</button>' +
                '</div>';
            body.appendChild(backButtonMask);
        }

        if (!root.querySelector('#music-v2-playlist-cover-file')) {
            const coverInput = document.createElement('input');
            coverInput.id = 'music-v2-playlist-cover-file';
            coverInput.type = 'file';
            coverInput.accept = 'image/*';
            coverInput.style.display = 'none';
            body.appendChild(coverInput);
        }

        if (!root.querySelector('#music-v2-back-button-file')) {
            const backButtonInput = document.createElement('input');
            backButtonInput.id = 'music-v2-back-button-file';
            backButtonInput.type = 'file';
            backButtonInput.accept = 'image/*';
            backButtonInput.style.display = 'none';
            body.appendChild(backButtonInput);
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

        const importInput = root.querySelector('#music-v2-import-url');
        if (importInput && !importInput.dataset.musicV2Bound) {
            importInput.dataset.musicV2Bound = '1';
            importInput.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                if (e.cancelable) e.preventDefault();
                const submitBtn = root.querySelector('[data-musicv2-action="submit-import-playlist"]');
                if (submitBtn && !submitBtn.disabled) submitBtn.click();
            });
        }

        const playlistCoverFile = root.querySelector('#music-v2-playlist-cover-file');
        if (playlistCoverFile && !playlistCoverFile.dataset.musicV2Bound) {
            playlistCoverFile.dataset.musicV2Bound = '1';
            playlistCoverFile.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                const targetPlaylistId = String(musicV2Runtime.playlistCoverTargetId || '');
                if (!file || !targetPlaylistId) {
                    musicV2Runtime.playlistCoverTargetId = '';
                    return;
                }
                try {
                    const coverDataUrl = String(await musicV2ReadDataUrl(file) || '');
                    if (!coverDataUrl) throw new Error('empty_cover');
                    const playlist = musicV2GetPlaylist(targetPlaylistId);
                    if (!playlist) {
                        musicV2Toast('歌单不存在');
                        return;
                    }
                    playlist.cover = coverDataUrl;
                    playlist.updatedAt = Date.now();
                    musicV2Persist();
                    musicV2RenderLibrary();
                    musicV2RenderPlaylistPage();
                    musicV2Toast('歌单封面已更新');
                } catch (error) {
                    musicV2Toast('封面读取失败');
                } finally {
                    musicV2Runtime.playlistCoverTargetId = '';
                    playlistCoverFile.value = '';
                }
            });
        }

        const backButtonFile = root.querySelector('#music-v2-back-button-file');
        if (backButtonFile && !backButtonFile.dataset.musicV2Bound) {
            backButtonFile.dataset.musicV2Bound = '1';
            backButtonFile.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                try {
                    const imageDataUrl = String(await musicV2ReadDataUrl(file) || '');
                    if (!imageDataUrl) throw new Error('empty_back_button_image');
                    musicV2SaveBackButtonImage(imageDataUrl);
                    musicV2HideBackButtonPanel();
                    musicV2Toast('返回按钮图片已更新');
                } catch (error) {
                    musicV2Toast('图片读取失败');
                } finally {
                    backButtonFile.value = '';
                }
            });
        }

        const importMask = root.querySelector('#music-v2-import-mask');
        if (importMask && !importMask.dataset.musicV2Bound) {
            importMask.dataset.musicV2Bound = '1';
            importMask.addEventListener('click', (e) => {
                if (e.target === importMask) {
                    musicV2HideImportModal();
                }
            });
        }

        const summaryMask = root.querySelector('#music-v2-together-summary-mask');
        if (summaryMask && !summaryMask.dataset.musicV2Bound) {
            summaryMask.dataset.musicV2Bound = '1';
            summaryMask.addEventListener('click', (e) => {
                if (e.target === summaryMask) {
                    musicV2HideTogetherSummaryModal();
                }
            });
        }

        const currentPlaylistMask = root.querySelector('#music-v2-current-playlist-mask');
        if (currentPlaylistMask && !currentPlaylistMask.dataset.musicV2Bound) {
            currentPlaylistMask.dataset.musicV2Bound = '1';
            currentPlaylistMask.addEventListener('click', (e) => {
                if (e.target === currentPlaylistMask) {
                    musicV2HideCurrentPlaylistPanel();
                }
            });
        }

        const backButtonMask = root.querySelector('#music-v2-back-button-mask');
        if (backButtonMask && !backButtonMask.dataset.musicV2Bound) {
            backButtonMask.dataset.musicV2Bound = '1';
            backButtonMask.addEventListener('click', (e) => {
                if (e.target === backButtonMask) {
                    musicV2HideBackButtonPanel();
                }
            });
        }

        const friendHomeMask = root.querySelector('#music-v2-friend-home-mask');
        if (friendHomeMask && !friendHomeMask.dataset.musicV2Bound) {
            friendHomeMask.dataset.musicV2Bound = '1';
            friendHomeMask.addEventListener('click', (e) => {
                if (e.target === friendHomeMask) {
                    musicV2CloseFriendMusicHome();
                }
            });
        }

        const friendHomeUrgeButtons = root.querySelectorAll('.music-v2-fh-urge-btn');
        friendHomeUrgeButtons.forEach((btn) => {
            if (!btn || btn.dataset.musicV2Bound) return;
            btn.dataset.musicV2Bound = '1';
            btn.addEventListener('click', (e) => {
                if (e && e.cancelable) e.preventDefault();
                if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
                musicV2OpenFriendHomeRequestPanel();
            });
        });

        const friendHomeRequestMask = root.querySelector('#music-v2-fh-request-mask') || document.getElementById('music-v2-fh-request-mask');
        if (friendHomeRequestMask && !friendHomeRequestMask.dataset.musicV2Bound) {
            friendHomeRequestMask.dataset.musicV2Bound = '1';
            friendHomeRequestMask.addEventListener('click', (e) => {
                if (e.target === friendHomeRequestMask) {
                    musicV2CloseFriendHomeRequestPanel();
                }
            });
        }

        const backButtonUrl = root.querySelector('#music-v2-back-button-url');
        if (backButtonUrl && !backButtonUrl.dataset.musicV2Bound) {
            backButtonUrl.dataset.musicV2Bound = '1';
            backButtonUrl.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                if (e.cancelable) e.preventDefault();
                const submitBtn = root.querySelector('[data-musicv2-action="apply-back-button-url"]');
                if (submitBtn) submitBtn.click();
            });
        }

        const friendHomeRequestInput = root.querySelector('#music-v2-fh-request-input') || document.getElementById('music-v2-fh-request-input');
        if (friendHomeRequestInput && !friendHomeRequestInput.dataset.musicV2Bound) {
            friendHomeRequestInput.dataset.musicV2Bound = '1';
            friendHomeRequestInput.addEventListener('keydown', (e) => {
                if (e.key !== 'Enter') return;
                if (e.cancelable) e.preventDefault();
                const submitBtn = root.querySelector('#music-v2-fh-request-submit') || document.getElementById('music-v2-fh-request-submit');
                if (submitBtn && !submitBtn.disabled) submitBtn.click();
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
        musicV2BindPlaylistLongPress();

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

    const MUSIC_V2_SCOPE_ROOT = '#music-app-shadow-host';

    function musicV2ScopeSelectorList(selectorList, scopeRoot) {
        const selectors = [];
        let start = 0;
        let parenDepth = 0;
        let bracketDepth = 0;
        let inSingle = false;
        let inDouble = false;

        for (let i = 0; i < selectorList.length; i++) {
            const ch = selectorList[i];
            const prev = i > 0 ? selectorList[i - 1] : '';
            if (ch === "'" && !inDouble && prev !== '\\') {
                inSingle = !inSingle;
                continue;
            }
            if (ch === '"' && !inSingle && prev !== '\\') {
                inDouble = !inDouble;
                continue;
            }
            if (inSingle || inDouble) continue;
            if (ch === '(') parenDepth++;
            else if (ch === ')' && parenDepth > 0) parenDepth--;
            else if (ch === '[') bracketDepth++;
            else if (ch === ']' && bracketDepth > 0) bracketDepth--;
            else if (ch === ',' && parenDepth === 0 && bracketDepth === 0) {
                selectors.push(selectorList.slice(start, i));
                start = i + 1;
            }
        }
        selectors.push(selectorList.slice(start));

        return selectors
            .map(s => s.trim())
            .filter(Boolean)
            .map(s => s.startsWith(scopeRoot) ? s : `${scopeRoot} ${s}`)
            .join(', ');
    }

    function musicV2FindCssBlockEnd(cssText, openBraceIdx) {
        let depth = 1;
        let inSingle = false;
        let inDouble = false;
        for (let i = openBraceIdx + 1; i < cssText.length; i++) {
            const ch = cssText[i];
            const prev = i > 0 ? cssText[i - 1] : '';
            const next = i + 1 < cssText.length ? cssText[i + 1] : '';

            if (!inSingle && !inDouble && ch === '/' && next === '*') {
                const commentEnd = cssText.indexOf('*/', i + 2);
                if (commentEnd === -1) return cssText.length - 1;
                i = commentEnd + 1;
                continue;
            }

            if (ch === "'" && !inDouble && prev !== '\\') {
                inSingle = !inSingle;
                continue;
            }
            if (ch === '"' && !inSingle && prev !== '\\') {
                inDouble = !inDouble;
                continue;
            }
            if (inSingle || inDouble) continue;

            if (ch === '{') depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) return i;
            }
        }
        return cssText.length - 1;
    }

    function musicV2ScopeCssText(cssText, scopeRoot) {
        if (!cssText || !scopeRoot) return cssText || '';

        const recursiveAtRules = ['@media', '@supports', '@container', '@layer'];
        const passthroughAtRules = ['@keyframes', '@-webkit-keyframes', '@font-face', '@property'];

        let result = '';
        let i = 0;

        while (i < cssText.length) {
            if (cssText.startsWith('/*', i)) {
                const commentEnd = cssText.indexOf('*/', i + 2);
                if (commentEnd === -1) {
                    result += cssText.slice(i);
                    break;
                }
                result += cssText.slice(i, commentEnd + 2);
                i = commentEnd + 2;
                continue;
            }

            const chunkStart = i;
            let parenDepth = 0;
            let bracketDepth = 0;
            let inSingle = false;
            let inDouble = false;
            let foundTerminator = false;

            while (i < cssText.length) {
                const ch = cssText[i];
                const prev = i > 0 ? cssText[i - 1] : '';
                const next = i + 1 < cssText.length ? cssText[i + 1] : '';

                if (!inSingle && !inDouble && ch === '/' && next === '*') {
                    const commentEnd = cssText.indexOf('*/', i + 2);
                    if (commentEnd === -1) {
                        i = cssText.length;
                        break;
                    }
                    i = commentEnd + 2;
                    continue;
                }

                if (ch === "'" && !inDouble && prev !== '\\') {
                    inSingle = !inSingle;
                    i++;
                    continue;
                }
                if (ch === '"' && !inSingle && prev !== '\\') {
                    inDouble = !inDouble;
                    i++;
                    continue;
                }
                if (inSingle || inDouble) {
                    i++;
                    continue;
                }

                if (ch === '(') parenDepth++;
                else if (ch === ')' && parenDepth > 0) parenDepth--;
                else if (ch === '[') bracketDepth++;
                else if (ch === ']' && bracketDepth > 0) bracketDepth--;

                if (parenDepth === 0 && bracketDepth === 0 && (ch === ';' || ch === '{')) {
                    foundTerminator = true;
                    break;
                }

                i++;
            }

            if (!foundTerminator) {
                result += cssText.slice(chunkStart);
                break;
            }

            const prelude = cssText.slice(chunkStart, i).trim();
            const terminator = cssText[i];

            if (terminator === ';') {
                result += cssText.slice(chunkStart, i + 1);
                i += 1;
                continue;
            }

            const blockStart = i;
            const blockEnd = musicV2FindCssBlockEnd(cssText, blockStart);
            const blockContent = cssText.slice(blockStart + 1, blockEnd);
            const preludeLower = prelude.toLowerCase();

            if (!prelude) {
                result += cssText.slice(chunkStart, blockEnd + 1);
                i = blockEnd + 1;
                continue;
            }

            if (prelude.startsWith('@')) {
                const isPassthrough = passthroughAtRules.some(rule => preludeLower.startsWith(rule));
                const isRecursive = recursiveAtRules.some(rule => preludeLower.startsWith(rule));
                if (isPassthrough) {
                    result += `${prelude}{${blockContent}}`;
                } else if (isRecursive) {
                    result += `${prelude}{${musicV2ScopeCssText(blockContent, scopeRoot)}}`;
                } else {
                    result += `${prelude}{${blockContent}}`;
                }
            } else {
                const scopedPrelude = musicV2ScopeSelectorList(prelude, scopeRoot);
                result += `${scopedPrelude}{${blockContent}}`;
            }

            i = blockEnd + 1;
        }

        return result;
    }

    function normalizeStyle(rawStyle) {
        const normalized = rawStyle
            .replace(/:root/g, '.music-v2-body')
            .replace(/\bbody\b/g, '.music-v2-body');
        return musicV2ScopeCssText(normalized, MUSIC_V2_SCOPE_ROOT);
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
                #music-app-shadow-host {
                    --bg-base: #e5e5ea;
                    --app-bg: #f5f5f7;
                    --text-dark: #000000;
                    --text-gray: #8e8e93;
                    --accent: #1c1c1e;
                    --glass-bg: rgba(255, 255, 255, 0.88);
                    --glass-border: rgba(255, 255, 255, 0.8);
                    --shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
                    --nav-bg: #ffffff;
                    background-color: var(--bg-base, #e5e5ea);
                }
                #music-app-shadow-host .music-v2-body {
                    width: 100%;
                    height: 100%;
                    background-color: var(--bg-base, #e5e5ea);
                }
                #music-app-shadow-host .phone {
                    background-color: var(--app-bg, #f5f5f7);
                }
                #music-app-shadow-host .mini-player {
                    background: var(--glass-bg, rgba(255, 255, 255, 0.88));
                    border-color: var(--glass-border, rgba(255, 255, 255, 0.8));
                }
                #music-app-shadow-host .nav-bar {
                    background: var(--nav-bg, #ffffff);
                }
                #music-app-shadow-host .page-overlay {
                    background: var(--app-bg, #f5f5f7);
                }
                ${style}
                #music-app-shadow-host .phone {
                    width: 100% !important;
                    height: 100% !important;
                    border-radius: 0 !important;
                    border: none !important;
                    outline: none !important;
                    box-shadow: none !important;
                    background-color: var(--app-bg, #f5f5f7) !important;
                }
                #music-app-shadow-host .floating-bottom {
                    bottom: max(8px, calc(env(safe-area-inset-bottom, 0px) - 14px)) !important;
                }
                #music-app-shadow-host .mini-player {
                    background: var(--glass-bg, rgba(255, 255, 255, 0.88)) !important;
                    border-color: var(--glass-border, rgba(255, 255, 255, 0.8)) !important;
                }
                #music-app-shadow-host .nav-bar {
                    background: var(--nav-bg, #ffffff) !important;
                }
                #music-app-shadow-host .page-overlay {
                    background: var(--app-bg, #f5f5f7) !important;
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

        musicV2ApplyBackButtonImage(root);

        musicV2InitFeatures(root);
    }

    if (window.appInitFunctions) {
        window.appInitFunctions.push(initMusicAppScreen);
    } else {
        document.addEventListener('DOMContentLoaded', initMusicAppScreen);
    }
})();
