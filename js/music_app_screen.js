(function () {
    'use strict';

    const DEFAULT_COVER = 'https://placehold.co/200x200/1f2937/f9fafb?text=Music';
    const API_SEARCH = 'https://163api.qijieya.cn/cloudsearch';
    const API_SEARCH_FALLBACK = 'https://163api.qijieya.cn/search';
    const API_METING = 'https://api.qijieya.cn/meting/';
    const API_BUGPK = 'https://api.bugpk.com/api/163_music';

    const S = {
        started: false,
        mounted: false,
        root: null,
        activeTab: 'explore',
        keyword: '',
        results: [],
        loading: false,
        error: '',
        pickerSongId: null,
        detailPlaylistId: null,
        coverDraft: '',
        playCtx: { playlistId: null },
        toastTimer: null,
        audioBound: false
    };

    function state() {
        if (!window.iphoneSimState) window.iphoneSimState = {};
        if (!window.iphoneSimState.music || typeof window.iphoneSimState.music !== 'object') window.iphoneSimState.music = {};
        return window.iphoneSimState.music;
    }

    function gid(prefix) {
        return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    }

    function esc(v) {
        return String(v == null ? '' : v)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function pickArtist(raw) {
        if (!raw) return '未知歌手';
        if (raw.artist && String(raw.artist).trim()) return String(raw.artist).trim();
        const list = Array.isArray(raw.artists) ? raw.artists : (Array.isArray(raw.ar) ? raw.ar : []);
        if (list.length) return list.map(a => a && (a.name || a.artistName) ? (a.name || a.artistName) : '').filter(Boolean).join(' / ') || '未知歌手';
        return '未知歌手';
    }

    function normSong(raw) {
        const s = raw || {};
        const id = String(s.id != null ? s.id : (s.songId != null ? s.songId : gid('song')));
        return {
            id: id,
            title: String(s.title || s.name || '未命名歌曲'),
            artist: pickArtist(s),
            cover: s.cover || (s.al && s.al.picUrl) || (s.album && s.album.picUrl) || s.pic || '',
            src: s.src || s.url || '',
            provider: s.provider || '',
            lyricsData: Array.isArray(s.lyricsData) ? s.lyricsData : [],
            lyricsFile: typeof s.lyricsFile === 'string' ? s.lyricsFile : '',
            addedAt: s.addedAt || Date.now()
        };
    }

    function syncLegacy(music) {
        const songs = new Map((music.songs || []).map(s => [String(s.id), s]));
        const seen = new Set();
        const flat = [];
        (music.playlists || []).forEach(pl => {
            (pl.songs || []).forEach(sid => {
                const id = String(sid);
                if (seen.has(id)) return;
                const song = songs.get(id);
                if (!song) return;
                seen.add(id);
                flat.push({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    src: song.src || '',
                    cover: song.cover || '',
                    provider: song.provider || '',
                    lyricsData: song.lyricsData || [],
                    lyricsFile: song.lyricsFile || ''
                });
            });
        });
        music.playlist = flat;
    }

    function ensureModel(persistMigration) {
        const music = state();
        if (!Array.isArray(music.songs)) music.songs = [];
        if (!Array.isArray(music.playlists)) music.playlists = [];
        if (!music.urlCache || typeof music.urlCache !== 'object') music.urlCache = {};
        if (typeof music.activePlaylistId !== 'string') music.activePlaylistId = null;
        if (typeof music.playing !== 'boolean') music.playing = false;
        if (!music.cover) music.cover = DEFAULT_COVER;
        if (!music.title) music.title = 'Happy Together';
        if (!music.artist) music.artist = 'Maximillian';
        if (typeof music.src !== 'string') music.src = '';
        if (!Array.isArray(music.playlist)) music.playlist = [];
        if (!Array.isArray(music.lyricsData)) music.lyricsData = [];
        if (typeof music.lyricsFile !== 'string') music.lyricsFile = '';

        let migrated = false;
        if (music.playlists.length === 0) {
            const old = Array.isArray(music.playlist) ? music.playlist : [];
            const pid = gid('pl');
            const ids = [];
            const seen = new Set();
            const songs = [];
            old.forEach(x => {
                const n = normSong(x);
                if (seen.has(n.id)) return;
                seen.add(n.id);
                songs.push(n);
                ids.push(n.id);
            });
            music.songs = songs;
            music.playlists = [{ id: pid, title: '默认歌单', cover: DEFAULT_COVER, songs: ids, createdAt: Date.now(), updatedAt: Date.now() }];
            music.activePlaylistId = pid;
            migrated = true;
        } else {
            music.playlists = music.playlists.filter(Boolean).map(pl => ({
                id: String(pl.id || gid('pl')),
                title: String(pl.title || '未命名歌单'),
                cover: pl.cover || DEFAULT_COVER,
                songs: Array.isArray(pl.songs) ? pl.songs.map(x => String(x)) : [],
                createdAt: pl.createdAt || Date.now(),
                updatedAt: pl.updatedAt || Date.now()
            }));
            if (!music.activePlaylistId || !music.playlists.some(p => p.id === music.activePlaylistId)) {
                music.activePlaylistId = music.playlists[0] ? music.playlists[0].id : null;
            }
        }

        const map = new Map();
        (music.songs || []).forEach(x => {
            const n = normSong(x);
            if (!map.has(n.id)) map.set(n.id, n);
        });
        music.songs = Array.from(map.values());
        syncLegacy(music);

        if (migrated && persistMigration && typeof saveConfig === 'function') saveConfig();
        return music;
    }

    function persist() {
        const music = ensureModel(false);
        syncLegacy(music);
        if (typeof saveConfig === 'function') saveConfig();
    }

    function songById(id) {
        const music = ensureModel(false);
        return music.songs.find(s => String(s.id) === String(id)) || null;
    }

    function playlistById(id) {
        const music = ensureModel(false);
        return music.playlists.find(p => String(p.id) === String(id)) || null;
    }

    function upsertSong(raw) {
        const music = ensureModel(false);
        const n = normSong(raw);
        const i = music.songs.findIndex(s => s.id === n.id);
        if (i < 0) {
            music.songs.push(n);
            return n;
        }
        const old = music.songs[i];
        const merged = Object.assign({}, old, n);
        if (!n.src) merged.src = old.src || '';
        if (!n.cover) merged.cover = old.cover || '';
        if (!n.provider) merged.provider = old.provider || '';
        if (!n.lyricsData || n.lyricsData.length === 0) merged.lyricsData = old.lyricsData || [];
        if (!n.lyricsFile) merged.lyricsFile = old.lyricsFile || '';
        music.songs[i] = merged;
        return merged;
    }

    async function getJSON(url) {
        const res = await fetch(url, { method: 'GET', cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP_' + res.status);
        return res.json();
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function parseSearchSongs(data) {
        const arr = data && data.result && Array.isArray(data.result.songs) ? data.result.songs : [];
        return arr.slice(0, 20).map(x => ({
            id: String(x.id),
            title: x.name || '未命名歌曲',
            artist: pickArtist(x),
            cover: (x.al && x.al.picUrl) || (x.album && x.album.picUrl) || ''
        }));
    }

    function isRateLimitedPayload(data) {
        if (!data || typeof data !== 'object') return false;
        const code = Number(data.code || 0);
        const msg = String(data.msg || data.message || '');
        return code === 405 || msg.indexOf('操作频繁') !== -1;
    }

    async function searchWithRetry(baseUrl, keyword, maxRetries) {
        let lastError = null;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const url = baseUrl + '?keywords=' + encodeURIComponent(keyword) + '&_t=' + Date.now();
                const data = await getJSON(url);
                if (isRateLimitedPayload(data)) throw new Error('RATE_LIMIT');
                return parseSearchSongs(data);
            } catch (e) {
                lastError = e;
                if (i < maxRetries - 1) await sleep(900 + i * 300);
            }
        }
        throw lastError || new Error('SEARCH_FAILED');
    }

    function parseMeting(data) {
        const t = Array.isArray(data) ? data[0] : data;
        if (!t || typeof t !== 'object') return null;
        const src = t.url || t.src || '';
        if (!src) return null;
        return { src: src, cover: t.pic || t.cover || '', provider: 'meting' };
    }

    function parseBugpk(data) {
        if (!data || typeof data !== 'object') return null;
        let t = null;
        if (Array.isArray(data.data) && data.data.length) t = data.data[0];
        else if (data.data && typeof data.data === 'object') t = data.data;
        else if (Array.isArray(data.result) && data.result.length) t = data.result[0];
        else if (data.result && typeof data.result === 'object') t = data.result;
        else t = data;
        if (!t || typeof t !== 'object') return null;
        const src = t.url || t.src || '';
        if (!src) return null;
        return { src: src, cover: t.pic || t.cover || '', provider: 'bugpk' };
    }

    async function resolveSong(songId, force) {
        const sid = String(songId);
        const music = ensureModel(false);
        const song = songById(sid);
        if (!song) throw new Error('song_not_found');

        const cached = music.urlCache[sid];
        if (!force && song.src) return { src: song.src, cover: song.cover || '', provider: song.provider || '' };
        if (!force && cached && cached.src) {
            song.src = cached.src;
            if (!song.cover && cached.cover) song.cover = cached.cover;
            if (!song.provider && cached.provider) song.provider = cached.provider;
            return { src: song.src, cover: song.cover || '', provider: song.provider || '' };
        }

        let out = null;
        try {
            const mUrl = API_METING + '?server=netease&type=song&id=' + encodeURIComponent(sid) + '&_t=' + Date.now();
            out = parseMeting(await getJSON(mUrl));
        } catch (e) {
            out = null;
        }
        if (!out) {
            const bUrl = API_BUGPK + '?ids=' + encodeURIComponent(sid) + '&level=standard&type=json&_t=' + Date.now();
            out = parseBugpk(await getJSON(bUrl));
        }
        if (!out || !out.src) throw new Error('resolve_failed');

        song.src = out.src;
        if (out.cover) song.cover = out.cover;
        if (out.provider) song.provider = out.provider;
        music.urlCache[sid] = { src: out.src, cover: out.cover || song.cover || '', provider: out.provider || '', updatedAt: Date.now() };
        return out;
    }

    function toast(msg) {
        if (!S.root) return;
        const el = S.root.querySelector('#music-v2-toast');
        if (!el) return;
        el.textContent = msg;
        el.classList.add('show');
        if (S.toastTimer) clearTimeout(S.toastTimer);
        S.toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
    }

    async function doSearch(keyword) {
        const kw = String(keyword || '').trim();
        S.keyword = kw;
        S.error = '';
        S.results = [];
        if (!kw) {
            renderSearch();
            return;
        }
        S.loading = true;
        renderSearch();
        try {
            try {
                S.results = await searchWithRetry(API_SEARCH, kw, 5);
            } catch (e1) {
                S.results = await searchWithRetry(API_SEARCH_FALLBACK, kw, 5);
            }
            S.error = '';
        } catch (e) {
            S.error = '网络繁忙，请稍后重试';
            S.results = [];
        } finally {
            S.loading = false;
            renderSearch();
        }
    }

    function syncNowPlaying(song, playing) {
        if (!song) return;
        const music = ensureModel(false);
        music.currentSongId = String(song.id);
        music.title = song.title || '未命名歌曲';
        music.artist = song.artist || '未知歌手';
        music.cover = song.cover || music.cover || DEFAULT_COVER;
        music.src = song.src || '';
        music.playing = !!playing;
        music.lyricsData = Array.isArray(song.lyricsData) ? song.lyricsData : [];
        music.lyricsFile = song.lyricsFile || '';
        if (typeof window.updateMusicUI === 'function') window.updateMusicUI();
    }

    async function addSongToPlaylist(rawSong, playlistId) {
        const pl = playlistById(playlistId);
        if (!pl) {
            toast('歌单不存在');
            return;
        }
        const song = upsertSong(rawSong);
        const sid = String(song.id);
        if (!Array.isArray(pl.songs)) pl.songs = [];
        if (pl.songs.includes(sid)) {
            toast('已在歌单中');
            return;
        }

        try {
            await resolveSong(sid, false);
        } catch (e) {
            // 预解析失败不阻塞添加
        }

        pl.songs.push(sid);
        pl.updatedAt = Date.now();
        if (!pl.cover && song.cover) pl.cover = song.cover;
        persist();
        renderLibrary();
        renderPicker();
        if (S.detailPlaylistId === pl.id) renderDetail();
        toast('已添加到歌单');
    }

    function currentSong() {
        const music = ensureModel(false);
        return music.currentSongId ? songById(music.currentSongId) : null;
    }

    async function playSong(songId, playlistId) {
        const song = songById(songId);
        const audio = document.getElementById('bg-music');
        if (!song || !audio) {
            toast('歌曲不可用');
            return;
        }
        if (playlistId) S.playCtx.playlistId = String(playlistId);

        const run = async function (forceResolve) {
            if (!song.src || forceResolve) await resolveSong(song.id, forceResolve);
            if (!song.src) throw new Error('no_src');
            if (audio.src !== song.src) audio.src = song.src;
            await audio.play();
        };

        try {
            await run(false);
        } catch (e1) {
            try {
                await run(true);
            } catch (e2) {
                toast('该歌曲暂不可播放，请换一首');
                return;
            }
        }

        syncNowPlaying(song, true);
        persist();
        renderMini();
        renderDetail();
    }

    function togglePlay() {
        const audio = document.getElementById('bg-music');
        if (!audio) return;
        const now = currentSong();
        const music = ensureModel(false);

        if (!now) {
            const pl = playlistById(music.activePlaylistId);
            if (pl && pl.songs && pl.songs.length) {
                playSong(pl.songs[0], pl.id);
            } else {
                toast('请先添加歌曲');
            }
            return;
        }

        if (audio.paused) {
            audio.play().then(() => {
                syncNowPlaying(now, true);
                persist();
                renderMini();
            }).catch(() => playSong(now.id, S.playCtx.playlistId));
        } else {
            audio.pause();
            syncNowPlaying(now, false);
            persist();
            renderMini();
        }
    }

    function bindAudio() {
        if (S.audioBound) return;
        const audio = document.getElementById('bg-music');
        if (!audio) return;
        S.audioBound = true;

        audio.addEventListener('play', () => {
            const now = currentSong();
            if (!now) return;
            syncNowPlaying(now, true);
            renderMini();
            renderDetail();
        });

        audio.addEventListener('pause', () => {
            const now = currentSong();
            if (!now) return;
            syncNowPlaying(now, false);
            renderMini();
            renderDetail();
        });

        audio.addEventListener('ended', () => {
            const pid = S.playCtx.playlistId;
            const music = ensureModel(false);
            const pl = playlistById(pid);
            if (!pl || !music.currentSongId) {
                music.playing = false;
                renderMini();
                return;
            }
            const i = (pl.songs || []).findIndex(x => String(x) === String(music.currentSongId));
            if (i >= 0 && i < pl.songs.length - 1) {
                playSong(pl.songs[i + 1], pl.id);
            } else {
                music.playing = false;
                persist();
                renderMini();
                renderDetail();
            }
        });
    }

    function coverOfPlaylist(pl) {
        if (!pl) return DEFAULT_COVER;
        if (pl.cover) return pl.cover;
        const sid = pl.songs && pl.songs[0] ? pl.songs[0] : null;
        const s = sid ? songById(sid) : null;
        return (s && s.cover) ? s.cover : DEFAULT_COVER;
    }

    function switchTab(tab) {
        S.activeTab = tab;
        if (!S.root) return;
        S.root.querySelectorAll('.mv2-view').forEach(x => x.classList.remove('active'));
        const view = S.root.querySelector('[data-view="' + tab + '"]');
        if (view) view.classList.add('active');
        S.root.querySelectorAll('.mv2-nav-item').forEach(x => x.classList.toggle('active', x.getAttribute('data-tab') === tab));
        if (tab === 'library') renderLibrary();
        if (tab === 'explore') renderSearch();
    }

    function renderSearch() {
        if (!S.root) return;
        const stateEl = S.root.querySelector('#music-v2-search-state');
        const listEl = S.root.querySelector('#music-v2-search-results');
        if (!stateEl || !listEl) return;

        if (S.loading) {
            stateEl.textContent = '搜索中...';
            listEl.innerHTML = '';
            return;
        }
        if (S.error) {
            stateEl.textContent = S.error;
            listEl.innerHTML = '';
            return;
        }
        if (!S.keyword) {
            stateEl.textContent = '输入歌曲名后按回车搜索';
            listEl.innerHTML = '';
            return;
        }
        if (!S.results.length) {
            stateEl.textContent = '无结果';
            listEl.innerHTML = '';
            return;
        }

        stateEl.textContent = '找到 ' + S.results.length + ' 首';
        listEl.innerHTML = S.results.map(s => (
            '<div class="mv2-row">' +
                '<div class="mv2-cover" style="background-image:url(\'' + esc(s.cover || DEFAULT_COVER) + '\')"></div>' +
                '<div class="mv2-meta"><div class="mv2-title">' + esc(s.title) + '</div><div class="mv2-sub">' + esc(s.artist) + '</div></div>' +
                '<button class="mv2-btn mv2-btn-primary" data-action="add-song" data-song-id="' + esc(s.id) + '">添加到歌单</button>' +
            '</div>'
        )).join('');
    }

    function renderLibrary() {
        if (!S.root) return;
        const box = S.root.querySelector('#music-v2-library-list');
        if (!box) return;
        const music = ensureModel(false);
        if (!music.playlists.length) {
            box.innerHTML = '<div class="mv2-empty">暂无歌单，点击右上角新建</div>';
            return;
        }
        box.innerHTML = music.playlists.map(pl => {
            const count = (pl.songs || []).length;
            const active = music.activePlaylistId === pl.id ? ' active' : '';
            return (
                '<div class="mv2-pl-card' + active + '">' +
                    '<button class="mv2-pl-main" data-action="open-playlist" data-playlist-id="' + esc(pl.id) + '">' +
                        '<div class="mv2-pl-cover" style="background-image:url(\'' + esc(coverOfPlaylist(pl)) + '\')"></div>' +
                        '<div class="mv2-meta"><div class="mv2-title">' + esc(pl.title) + '</div><div class="mv2-sub">' + count + ' 首歌曲</div></div>' +
                    '</button>' +
                '</div>'
            );
        }).join('');
    }

    function renderPicker() {
        if (!S.root) return;
        const body = S.root.querySelector('#music-v2-picker-body');
        if (!body) return;
        const music = ensureModel(false);
        if (!music.playlists.length) {
            body.innerHTML = '<div class="mv2-empty">还没有歌单，请先新建</div>';
            return;
        }
        body.innerHTML = music.playlists.map(pl => (
            '<button class="mv2-picker-item" data-action="choose-playlist" data-playlist-id="' + esc(pl.id) + '">' +
                '<div class="mv2-picker-cover" style="background-image:url(\'' + esc(coverOfPlaylist(pl)) + '\')"></div>' +
                '<div class="mv2-meta"><div class="mv2-title">' + esc(pl.title) + '</div><div class="mv2-sub">' + (pl.songs || []).length + ' 首</div></div>' +
            '</button>'
        )).join('');
    }

    function renderDetail() {
        if (!S.root) return;
        const panel = S.root.querySelector('#music-v2-playlist-detail');
        const title = S.root.querySelector('#music-v2-detail-title');
        const list = S.root.querySelector('#music-v2-detail-list');
        if (!panel || !title || !list) return;

        if (!S.detailPlaylistId) {
            panel.classList.remove('show');
            return;
        }
        const pl = playlistById(S.detailPlaylistId);
        const music = ensureModel(false);
        if (!pl) {
            panel.classList.remove('show');
            return;
        }
        title.textContent = pl.title;

        if (!pl.songs || !pl.songs.length) {
            list.innerHTML = '<div class="mv2-empty">歌单暂无歌曲</div>';
        } else {
            list.innerHTML = pl.songs.map(sid => {
                const song = songById(sid);
                if (!song) return '';
                const playing = String(music.currentSongId || '') === String(song.id) && !!music.playing;
                return (
                    '<div class="mv2-row">' +
                        '<div class="mv2-cover" style="background-image:url(\'' + esc(song.cover || DEFAULT_COVER) + '\')"></div>' +
                        '<div class="mv2-meta"><div class="mv2-title">' + esc(song.title) + '</div><div class="mv2-sub">' + esc(song.artist) + '</div></div>' +
                        '<button class="mv2-btn ' + (playing ? 'mv2-btn-active' : 'mv2-btn-primary') + '" data-action="play-song" data-song-id="' + esc(song.id) + '" data-playlist-id="' + esc(pl.id) + '">' + (playing ? '播放中' : '播放') + '</button>' +
                    '</div>'
                );
            }).join('');
        }
        panel.classList.add('show');
    }

    function renderMini() {
        if (!S.root) return;
        const title = S.root.querySelector('#music-v2-mini-title');
        const artist = S.root.querySelector('#music-v2-mini-artist');
        const cover = S.root.querySelector('#music-v2-mini-cover');
        const btn = S.root.querySelector('#music-v2-mini-toggle');
        const wrap = S.root.querySelector('#music-v2-mini-player');
        if (!title || !artist || !cover || !btn || !wrap) return;

        const music = ensureModel(false);
        const song = currentSong();
        if (!song) {
            title.textContent = '未播放';
            artist.textContent = '添加歌曲开始播放';
            cover.style.backgroundImage = 'url(\'' + DEFAULT_COVER + '\')';
            btn.textContent = '播放';
            wrap.classList.remove('playing');
            return;
        }
        title.textContent = song.title || '未命名歌曲';
        artist.textContent = song.artist || '未知歌手';
        cover.style.backgroundImage = 'url(\'' + (song.cover || DEFAULT_COVER) + '\')';
        btn.textContent = music.playing ? '暂停' : '播放';
        wrap.classList.toggle('playing', !!music.playing);
    }

    function readDataUrl(file) {
        return new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = e => resolve(e.target ? e.target.result : '');
            r.onerror = reject;
            r.readAsDataURL(file);
        });
    }

    function mount() {
        const host = document.getElementById('music-app-shadow-host');
        if (!host) return false;
        host.innerHTML = '<style>' +
            '.mv2{position:relative;width:100%;height:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:radial-gradient(circle at 10% 0%,#e2e8f0 0,#f8fafc 42%,#f1f5f9 100%);color:#0f172a;overflow:hidden}' +
            '.mv2-main{height:calc(100% - 130px);padding:16px 12px 0}.mv2-head{margin-bottom:10px}.mv2-h1{font-size:30px;font-weight:800;letter-spacing:-.02em}.mv2-h2{font-size:13px;color:#64748b}' +
            '.mv2-view{display:none;height:100%;overflow:auto}.mv2-view.active{display:block}.mv2-search{display:flex;gap:8px}.mv2-input{flex:1;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;background:#ffffffcc;outline:none}' +
            '.mv2-input:focus{border-color:#0f766e;box-shadow:0 0 0 3px #99f6e455}.mv2-state{font-size:12px;color:#64748b;margin:10px 2px}.mv2-list{display:flex;flex-direction:column;gap:10px;padding-bottom:20px}' +
            '.mv2-row{display:flex;align-items:center;gap:10px;background:#ffffffd9;border:1px solid #e2e8f0;border-radius:14px;padding:10px}.mv2-cover{width:46px;height:46px;border-radius:10px;background-size:cover;background-position:center;background-color:#dbeafe;flex-shrink:0}' +
            '.mv2-meta{flex:1;min-width:0}.mv2-title{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.mv2-sub{font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
            '.mv2-btn{border:none;background:#e2e8f0;color:#0f172a;border-radius:10px;padding:8px 10px;font-size:12px;font-weight:700;cursor:pointer}.mv2-btn:active{transform:scale(.98)}.mv2-btn-primary{background:#0f766e;color:#ecfeff}.mv2-btn-active{background:#0369a1;color:#f0f9ff}' +
            '.mv2-lib-head{display:flex;justify-content:space-between;align-items:center;margin:8px 0 12px}.mv2-lib-title{font-size:20px;font-weight:800}.mv2-pl-card{background:#ffffffd9;border:1px solid #e2e8f0;border-radius:14px}.mv2-pl-card.active{border-color:#0f766e;box-shadow:0 8px 20px #0f766e26}' +
            '.mv2-pl-main{width:100%;display:flex;align-items:center;gap:10px;padding:10px;background:transparent;border:none;cursor:pointer;text-align:left}.mv2-pl-cover{width:52px;height:52px;border-radius:12px;background-size:cover;background-position:center;background-color:#d1d5db;flex-shrink:0}' +
            '.mv2-empty{padding:32px 16px;text-align:center;color:#64748b;font-size:13px}.mv2-mini{position:absolute;left:10px;right:10px;bottom:66px;background:#0f172ae6;color:#e2e8f0;border-radius:14px;padding:8px 10px;display:flex;align-items:center;gap:10px}.mv2-mini.playing{box-shadow:0 8px 20px #0891b255}' +
            '.mv2-mini-main{flex:1;display:flex;align-items:center;gap:10px;background:transparent;border:none;color:inherit;cursor:pointer;text-align:left}.mv2-mini-cover{width:40px;height:40px;border-radius:10px;background-size:cover;background-position:center;background-color:#334155}.mv2-mini-title{font-size:13px;font-weight:700}.mv2-mini-sub{font-size:11px;color:#94a3b8}' +
            '.mv2-nav{position:absolute;left:0;right:0;bottom:0;height:56px;background:#ffffffeb;border-top:1px solid #e2e8f0;display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}.mv2-nav-item{border:none;background:transparent;font-size:12px;font-weight:700;color:#64748b;cursor:pointer}.mv2-nav-item.active{color:#0f766e}' +
            '.mv2-overlay{position:absolute;inset:0;transform:translateX(105%);transition:transform .25s ease;background:#f8fafc;display:flex;flex-direction:column}.mv2-overlay.show{transform:translateX(0)}.mv2-overlay-head{display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #e2e8f0;background:#fff}.mv2-detail-list{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:10px}' +
            '.mv2-modal{position:absolute;inset:0;background:#0f172a88;display:none;align-items:flex-end;justify-content:center;padding:12px}.mv2-modal.show{display:flex}.mv2-modal-card{width:100%;max-width:520px;background:#fff;border-radius:16px;padding:12px;max-height:78%;overflow:auto}.mv2-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}.mv2-picker-body{display:flex;flex-direction:column;gap:8px;margin-bottom:10px}.mv2-picker-item{display:flex;align-items:center;gap:10px;border:1px solid #e2e8f0;background:#fff;border-radius:12px;padding:8px;cursor:pointer;text-align:left}.mv2-picker-cover{width:38px;height:38px;border-radius:8px;background-size:cover;background-position:center;background-color:#e2e8f0}' +
            '.mv2-form{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}.mv2-label{font-size:12px;color:#334155;font-weight:700}.mv2-cover-preview{width:52px;height:52px;border-radius:10px;background-size:cover;background-position:center;background-image:url("' + DEFAULT_COVER + '");background-color:#e2e8f0}.mv2-toast{position:absolute;left:50%;transform:translateX(-50%);bottom:128px;background:#0f172a;color:#e2e8f0;padding:8px 12px;border-radius:999px;font-size:12px;opacity:0;transition:opacity .2s;pointer-events:none}.mv2-toast.show{opacity:1}' +
            '</style>' +
            '<div id="music-v2-root" class="mv2">' +
                '<div class="mv2-main">' +
                    '<div class="mv2-head"><div class="mv2-h1">Music</div><div class="mv2-h2">Explore and Library</div></div>' +
                    '<section class="mv2-view active" data-view="explore"><div class="mv2-search"><input id="music-v2-search-input" class="mv2-input" placeholder="搜索歌曲，按回车"><button class="mv2-btn mv2-btn-primary" data-action="search">搜索</button></div><div id="music-v2-search-state" class="mv2-state">输入歌曲名后按回车搜索</div><div id="music-v2-search-results" class="mv2-list"></div></section>' +
                    '<section class="mv2-view" data-view="discover"><div class="mv2-empty">Discover 内容本期暂未开放</div></section>' +
                    '<section class="mv2-view" data-view="community"><div class="mv2-empty">Community 内容本期暂未开放</div></section>' +
                    '<section class="mv2-view" data-view="library"><div class="mv2-lib-head"><div class="mv2-lib-title">我的歌单</div><button class="mv2-btn mv2-btn-primary" data-action="open-create">新建歌单</button></div><div id="music-v2-library-list" class="mv2-list"></div></section>' +
                '</div>' +
                '<div id="music-v2-mini-player" class="mv2-mini"><button class="mv2-mini-main" data-action="open-active-playlist"><div id="music-v2-mini-cover" class="mv2-mini-cover"></div><div class="mv2-meta"><div id="music-v2-mini-title" class="mv2-mini-title">未播放</div><div id="music-v2-mini-artist" class="mv2-mini-sub">添加歌曲开始播放</div></div></button><button id="music-v2-mini-toggle" class="mv2-btn mv2-btn-primary" data-action="toggle-play">播放</button></div>' +
                '<nav class="mv2-nav"><button class="mv2-nav-item active" data-action="tab" data-tab="explore">Explore</button><button class="mv2-nav-item" data-action="tab" data-tab="discover">Discover</button><button class="mv2-nav-item" data-action="tab" data-tab="community">Community</button><button class="mv2-nav-item" data-action="tab" data-tab="library">Library</button></nav>' +
                '<div id="music-v2-playlist-detail" class="mv2-overlay"><div class="mv2-overlay-head"><button class="mv2-btn" data-action="close-detail">返回</button><div id="music-v2-detail-title" class="mv2-title">歌单详情</div><div style="width:52px"></div></div><div id="music-v2-detail-list" class="mv2-detail-list"></div></div>' +
                '<div id="music-v2-picker-modal" class="mv2-modal"><div class="mv2-modal-card"><div class="mv2-modal-head"><div class="mv2-title">选择歌单</div><button class="mv2-btn" data-action="close-picker">关闭</button></div><div id="music-v2-picker-body" class="mv2-picker-body"></div><button class="mv2-btn mv2-btn-primary" data-action="open-create" style="width:100%">新建歌单</button></div></div>' +
                '<div id="music-v2-create-modal" class="mv2-modal"><div class="mv2-modal-card"><div class="mv2-modal-head"><div class="mv2-title">新建歌单</div><button class="mv2-btn" data-action="close-create">关闭</button></div><div class="mv2-form"><label class="mv2-label">歌单标题</label><input id="music-v2-new-playlist-title" class="mv2-input" placeholder="请输入歌单标题"></div><div class="mv2-form"><label class="mv2-label">封面（可选）</label><div style="display:flex;align-items:center;gap:10px"><div id="music-v2-new-playlist-cover-preview" class="mv2-cover-preview"></div><input id="music-v2-new-playlist-cover-file" type="file" accept="image/*"></div></div><button class="mv2-btn mv2-btn-primary" data-action="create-playlist" style="width:100%">创建</button></div></div>' +
                '<div id="music-v2-toast" class="mv2-toast"></div>' +
            '</div>';

        S.root = host.querySelector('#music-v2-root');
        if (!S.root) return false;
        S.root.addEventListener('click', onClick);
        S.root.addEventListener('keydown', onKeydown);
        S.root.addEventListener('change', onChange);
        S.mounted = true;
        return true;
    }

    function onClick(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn || !S.root || !S.root.contains(btn)) return;
        const a = btn.getAttribute('data-action');

        if (a === 'tab') { switchTab(btn.getAttribute('data-tab')); return; }
        if (a === 'search') { const ipt = S.root.querySelector('#music-v2-search-input'); doSearch(ipt ? ipt.value : ''); return; }
        if (a === 'add-song') {
            S.pickerSongId = btn.getAttribute('data-song-id');
            renderPicker();
            S.root.querySelector('#music-v2-picker-modal').classList.add('show');
            return;
        }
        if (a === 'close-picker') { S.root.querySelector('#music-v2-picker-modal').classList.remove('show'); S.pickerSongId = null; return; }
        if (a === 'choose-playlist') {
            const pid = btn.getAttribute('data-playlist-id');
            const song = S.results.find(x => String(x.id) === String(S.pickerSongId));
            if (!song) { toast('歌曲信息已失效，请重试'); return; }
            addSongToPlaylist(song, pid).then(() => {
                S.root.querySelector('#music-v2-picker-modal').classList.remove('show');
                S.pickerSongId = null;
            });
            return;
        }
        if (a === 'open-create') {
            S.coverDraft = '';
            const t = S.root.querySelector('#music-v2-new-playlist-title');
            const f = S.root.querySelector('#music-v2-new-playlist-cover-file');
            const p = S.root.querySelector('#music-v2-new-playlist-cover-preview');
            if (t) t.value = '';
            if (f) f.value = '';
            if (p) p.style.backgroundImage = 'url("' + DEFAULT_COVER + '")';
            S.root.querySelector('#music-v2-create-modal').classList.add('show');
            return;
        }
        if (a === 'close-create') { S.root.querySelector('#music-v2-create-modal').classList.remove('show'); return; }
        if (a === 'create-playlist') {
            const input = S.root.querySelector('#music-v2-new-playlist-title');
            const title = input ? input.value.trim() : '';
            if (!title) { toast('请输入歌单标题'); return; }
            const music = ensureModel(false);
            const pl = { id: gid('pl'), title: title, cover: S.coverDraft || DEFAULT_COVER, songs: [], createdAt: Date.now(), updatedAt: Date.now() };
            music.playlists.unshift(pl);
            music.activePlaylistId = pl.id;
            persist();
            renderLibrary();
            renderPicker();
            S.root.querySelector('#music-v2-create-modal').classList.remove('show');
            toast('歌单已创建');
            return;
        }
        if (a === 'open-playlist') {
            const pid = btn.getAttribute('data-playlist-id');
            const music = ensureModel(false);
            music.activePlaylistId = pid;
            persist();
            S.detailPlaylistId = pid;
            renderLibrary();
            renderDetail();
            return;
        }
        if (a === 'close-detail') { S.detailPlaylistId = null; renderDetail(); return; }
        if (a === 'play-song') { playSong(btn.getAttribute('data-song-id'), btn.getAttribute('data-playlist-id')); return; }
        if (a === 'toggle-play') { togglePlay(); return; }
        if (a === 'open-active-playlist') {
            const music = ensureModel(false);
            if (!music.activePlaylistId) { toast('请先创建歌单'); return; }
            S.detailPlaylistId = music.activePlaylistId;
            renderDetail();
            return;
        }
    }

    function onKeydown(e) {
        if (e.target && e.target.id === 'music-v2-search-input' && e.key === 'Enter') {
            doSearch(e.target.value || '');
        }
    }

    function onChange(e) {
        if (!e.target || e.target.id !== 'music-v2-new-playlist-cover-file') return;
        const file = e.target.files && e.target.files[0];
        if (!file) { S.coverDraft = ''; return; }
        readDataUrl(file).then(data => {
            S.coverDraft = String(data || '');
            const pv = S.root.querySelector('#music-v2-new-playlist-cover-preview');
            if (pv) pv.style.backgroundImage = 'url("' + esc(S.coverDraft || DEFAULT_COVER) + '")';
        }).catch(() => {
            S.coverDraft = '';
            toast('封面读取失败');
        });
    }

    function refreshAll() {
        // avoid writing config during early boot; persistence happens on user actions
        ensureModel(false);
        renderSearch();
        renderLibrary();
        renderPicker();
        renderDetail();
        renderMini();
    }

    function onVisible() {
        if (!S.mounted && !mount()) return;
        bindAudio();
        refreshAll();
    }

    function init() {
        if (S.started) return;
        S.started = true;
        const app = document.getElementById('music-app');
        if (!app) return;
        const mo = new MutationObserver(() => {
            if (!app.classList.contains('hidden')) onVisible();
        });
        mo.observe(app, { attributes: true, attributeFilter: ['class'] });
        if (!app.classList.contains('hidden')) onVisible();
    }

    if (Array.isArray(window.appInitFunctions)) window.appInitFunctions.push(init);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
