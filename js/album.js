(function () {
    const PLACEHOLDER_COVER = 'https://placehold.co/600x400?text=Album';

    function buildPhoto(id, seed, location, datetime) {
        return {
            id,
            src: `https://picsum.photos/seed/${seed}/900/900`,
            thumb: `https://picsum.photos/seed/${seed}/120/120`,
            location,
            datetime
        };
    }

    const initialRecentSections = [
        {
            label: 'Today',
            photos: [
                buildPhoto('recent-1', 'album-recent-1', 'Fuzhou / Gushan', 'July 8 / 16:11'),
                buildPhoto('recent-2', 'album-recent-2', 'Fuzhou / West Lake', 'July 8 / 14:24'),
                buildPhoto('recent-3', 'album-recent-3', 'Fuzhou / Sanfang Qixiang', 'July 8 / 11:38'),
                buildPhoto('recent-4', 'album-recent-4', 'Xiamen / Zhongshan Road', 'July 8 / 10:05'),
                buildPhoto('recent-5', 'album-recent-5', 'Quanzhou / Luoyang Bridge', 'July 8 / 09:42')
            ]
        },
        {
            label: 'Yesterday',
            photos: [
                buildPhoto('recent-6', 'album-recent-6', 'Shanghai / Wukang Road', 'July 7 / 20:16'),
                buildPhoto('recent-7', 'album-recent-7', 'Hangzhou / West Lake', 'July 7 / 18:08'),
                buildPhoto('recent-8', 'album-recent-8', 'Nanjing / Yihe Road', 'July 7 / 14:52'),
                buildPhoto('recent-9', 'album-recent-9', 'Suzhou / Pingjiang Road', 'July 7 / 12:20')
            ]
        }
    ];

    const initialAlbums = [
        {
            id: 'favorites',
            name: 'Favorites',
            count: 128,
            icon: 'ri-heart-fill',
            iconColor: '#ff3b30',
            cover: 'https://picsum.photos/seed/album-cover-favorites/600/400',
            photos: [
                buildPhoto('favorites-1', 'favorites-1', 'Fuzhou / Gushan', 'June 28 / 18:40'),
                buildPhoto('favorites-2', 'favorites-2', 'Xiamen / Huangcuo Beach', 'June 24 / 17:18'),
                buildPhoto('favorites-3', 'favorites-3', 'Shanghai / North Bund', 'June 18 / 19:52'),
                buildPhoto('favorites-4', 'favorites-4', 'Hangzhou / Longjing', 'June 12 / 09:16'),
                buildPhoto('favorites-5', 'favorites-5', 'Quanzhou / Kaiyuan Temple', 'June 3 / 15:06'),
                buildPhoto('favorites-6', 'favorites-6', 'Suzhou / Jinji Lake', 'May 28 / 20:31')
            ]
        },
        {
            id: 'vacation-2023',
            name: 'Vacation 2023',
            count: 450,
            icon: 'ri-map-pin-line',
            iconColor: '#8e8e93',
            cover: 'https://picsum.photos/seed/album-cover-vacation/600/400',
            photos: [
                buildPhoto('vacation-1', 'vacation-1', 'Sanya / Yalong Bay', 'August 3 / 11:14'),
                buildPhoto('vacation-2', 'vacation-2', 'Sanya / Wuzhizhou', 'August 3 / 16:48'),
                buildPhoto('vacation-3', 'vacation-3', 'Sanya / Coconut Dream', 'August 2 / 18:12'),
                buildPhoto('vacation-4', 'vacation-4', 'Haikou / Qilou Old Street', 'August 1 / 13:27'),
                buildPhoto('vacation-5', 'vacation-5', 'Wanning / Riyue Bay', 'July 31 / 10:05'),
                buildPhoto('vacation-6', 'vacation-6', 'Lingshui / Clearwater Bay', 'July 30 / 09:54')
            ]
        },
        {
            id: 'instagram',
            name: 'Instagram',
            count: 54,
            icon: 'ri-instagram-line',
            iconColor: '#8e8e93',
            cover: 'https://picsum.photos/seed/album-cover-instagram/600/400',
            photos: [
                buildPhoto('instagram-1', 'instagram-1', 'Tokyo / Daikanyama', 'June 22 / 13:42'),
                buildPhoto('instagram-2', 'instagram-2', 'Kyoto / Gion', 'June 20 / 07:22'),
                buildPhoto('instagram-3', 'instagram-3', 'Osaka / Nakanoshima', 'June 19 / 16:35'),
                buildPhoto('instagram-4', 'instagram-4', 'Seoul / Seongsu', 'June 16 / 12:28'),
                buildPhoto('instagram-5', 'instagram-5', 'Busan / Haeundae', 'June 15 / 18:48'),
                buildPhoto('instagram-6', 'instagram-6', 'Bangkok / Talat Noi', 'June 9 / 10:06')
            ]
        },
        {
            id: 'recent-album',
            name: 'Recent',
            count: initialRecentSections.flatMap(section => section.photos).length,
            icon: 'ri-time-line',
            iconColor: '#8e8e93',
            cover: 'https://picsum.photos/seed/album-cover-recent/600/400',
            photos: [],
            dynamicRecent: true
        }
    ];

    function clonePhoto(photo) {
        return { ...photo };
    }

    function cloneSection(section) {
        return {
            label: section.label,
            photos: section.photos.map(clonePhoto)
        };
    }

    function cloneAlbum(album) {
        return {
            ...album,
            photos: Array.isArray(album.photos) ? album.photos.map(clonePhoto) : []
        };
    }

    const RECENT_ALBUM_ID = 'recent-album';
    const FAVORITES_ALBUM_ID = 'favorites';

    function createDynamicRecentAlbum(recentSections, overrides = {}) {
        const recentPhotos = Array.isArray(recentSections)
            ? recentSections.flatMap(section => Array.isArray(section.photos) ? section.photos : [])
            : [];

        return {
            id: RECENT_ALBUM_ID,
            name: typeof overrides.name === 'string' && overrides.name.trim() ? overrides.name.trim() : 'Recent',
            count: recentPhotos.length,
            icon: typeof overrides.icon === 'string' && overrides.icon.trim() ? overrides.icon.trim() : 'ri-time-line',
            iconColor: typeof overrides.iconColor === 'string' && overrides.iconColor.trim() ? overrides.iconColor.trim() : '#8e8e93',
            cover: recentPhotos[0] ? recentPhotos[0].src : (typeof overrides.cover === 'string' && overrides.cover ? overrides.cover : PLACEHOLDER_COVER),
            photos: [],
            dynamicRecent: true
        };
    }

    function sanitizePhoto(photo, fallbackId) {
        const safePhoto = photo && typeof photo === 'object' ? photo : {};
        const src = typeof safePhoto.src === 'string' && safePhoto.src
            ? safePhoto.src
            : (typeof safePhoto.thumb === 'string' && safePhoto.thumb ? safePhoto.thumb : PLACEHOLDER_COVER);
        const thumb = typeof safePhoto.thumb === 'string' && safePhoto.thumb ? safePhoto.thumb : src;

        return {
            id: typeof safePhoto.id === 'string' && safePhoto.id.trim() ? safePhoto.id.trim() : fallbackId,
            src,
            thumb,
            location: typeof safePhoto.location === 'string' ? safePhoto.location : 'Imported Photo',
            datetime: typeof safePhoto.datetime === 'string' ? safePhoto.datetime : ''
        };
    }

    function normalizeRecentSections(recentSections) {
        if (!Array.isArray(recentSections)) return [];

        return recentSections
            .map((section, sectionIndex) => {
                if (!section || typeof section !== 'object') return null;

                const safePhotos = Array.isArray(section.photos)
                    ? section.photos.map((photo, photoIndex) => sanitizePhoto(photo, `recent-${sectionIndex + 1}-${photoIndex + 1}`))
                    : [];

                return {
                    label: typeof section.label === 'string' && section.label.trim() ? section.label.trim() : `Section ${sectionIndex + 1}`,
                    photos: safePhotos
                };
            })
            .filter(Boolean);
    }

    function normalizeAlbums(albums, recentSections) {
        const normalizedAlbums = Array.isArray(albums)
            ? albums.map((album, albumIndex) => {
                if (!album || typeof album !== 'object') return null;

                const safeId = typeof album.id === 'string' && album.id.trim() ? album.id.trim() : `album-${albumIndex + 1}`;
                const isDynamicRecent = album.dynamicRecent === true || safeId === RECENT_ALBUM_ID;
                const safePhotos = isDynamicRecent
                    ? []
                    : (Array.isArray(album.photos)
                        ? album.photos.map((photo, photoIndex) => sanitizePhoto(photo, `${safeId}-photo-${photoIndex + 1}`))
                        : []);
                const rawCount = Number(album.count);
                const safeCount = Number.isFinite(rawCount) ? Math.max(safePhotos.length, rawCount) : safePhotos.length;

                return {
                    id: safeId,
                    name: typeof album.name === 'string' && album.name.trim()
                        ? album.name.trim()
                        : (isDynamicRecent ? 'Recent' : `Album ${albumIndex + 1}`),
                    count: isDynamicRecent ? safePhotos.length : safeCount,
                    icon: typeof album.icon === 'string' && album.icon.trim()
                        ? album.icon.trim()
                        : (isDynamicRecent ? 'ri-time-line' : 'ri-folder-line'),
                    iconColor: typeof album.iconColor === 'string' && album.iconColor.trim() ? album.iconColor.trim() : '#8e8e93',
                    cover: safePhotos[0] ? safePhotos[0].src : (typeof album.cover === 'string' && album.cover ? album.cover : PLACEHOLDER_COVER),
                    photos: safePhotos,
                    dynamicRecent: isDynamicRecent,
                    isPrivate: !isDynamicRecent && album.isPrivate === true && typeof album.privacyPassword === 'string' && album.privacyPassword.length > 0,
                    privacyPassword: !isDynamicRecent && typeof album.privacyPassword === 'string' ? album.privacyPassword : ''
                };
            }).filter(Boolean)
            : [];

        const dynamicRecentSource = normalizedAlbums.find(album => album.id === RECENT_ALBUM_ID || album.dynamicRecent) || {};
        const staticAlbums = normalizedAlbums.filter(album => album.id !== RECENT_ALBUM_ID && !album.dynamicRecent);
        const favoritesAlbum = staticAlbums.find(album => album.id === FAVORITES_ALBUM_ID) || null;
        const otherStaticAlbums = staticAlbums.filter(album => album.id !== FAVORITES_ALBUM_ID);

        return [
            ...(favoritesAlbum ? [favoritesAlbum] : []),
            ...otherStaticAlbums,
            createDynamicRecentAlbum(recentSections, dynamicRecentSource)
        ];
    }

    function buildDefaultAlbumData() {
        const recentSections = normalizeRecentSections(initialRecentSections.map(cloneSection));
        return {
            recentSections,
            albums: normalizeAlbums(initialAlbums.map(cloneAlbum), recentSections)
        };
    }

    function getPersistedAlbumData() {
        const rootState = window.iphoneSimState;
        if (!rootState || typeof rootState !== 'object') return null;

        const persisted = rootState.albumData;
        if (!persisted || typeof persisted !== 'object') return null;

        return persisted;
    }

    function createAlbumDataSnapshot() {
        const recentSections = normalizeRecentSections(albumState.recentSections.map(cloneSection));
        const albums = normalizeAlbums(albumState.albums.map(cloneAlbum), recentSections);
        return {
            recentSections,
            albums: albums.map(cloneAlbum)
        };
    }

    function persistAlbumState() {
        const rootState = window.iphoneSimState;
        if (!rootState || typeof rootState !== 'object') return;

        rootState.albumData = createAlbumDataSnapshot();

        if (typeof saveConfig === 'function') {
            const saveResult = saveConfig();
            if (saveResult && typeof saveResult.catch === 'function') {
                saveResult.catch(error => console.error('Failed to save album data.', error));
            }
        }
    }

    function hydrateAlbumState() {
        const persisted = getPersistedAlbumData();
        const defaultData = buildDefaultAlbumData();
        const sourceData = persisted ? persisted : defaultData;

        albumState.recentSections = normalizeRecentSections(sourceData.recentSections);
        albumState.albums = normalizeAlbums(sourceData.albums, albumState.recentSections);

        if (albumState.currentAlbumId && !getAlbumById(albumState.currentAlbumId)) {
            albumState.currentAlbumId = null;
            albumState.detailManageMode = false;
            albumState.selectedDetailPhotoIds.clear();
        }

        if (albumState.currentPhotoId && !findPhotoById(albumState.currentPhotoCollectionKey, albumState.currentPhotoId)) {
            albumState.currentPhotoId = null;
            albumState.currentPhotoCollectionKey = 'recent';
            albumState.currentPhotoFullView = false;
        }
    }

    const defaultAlbumData = buildDefaultAlbumData();

    const albumState = {
        activeTab: 'recent',
        recentSections: defaultAlbumData.recentSections.map(cloneSection),
        albums: defaultAlbumData.albums.map(cloneAlbum),
        currentAlbumId: null,
        currentPhotoId: null,
        currentPhotoCollectionKey: 'recent',
        currentPhotoFullView: false,
        mainManageMode: null,
        detailManageMode: false,
        moveModalMode: null,
        privacyActionAlbumId: null,
        privacyPasswordMode: null,
        privacyPasswordAlbumId: null,
        selectedRecentPhotoIds: new Set(),
        selectedAlbumIds: new Set(),
        selectedDetailPhotoIds: new Set(),
        selectedMoveTargetAlbumIds: new Set()
    };

    const ALBUM_CARD_LONG_PRESS_DURATION = 480;
    const ALBUM_SCREEN_SHARE_MAX_ITEMS = 4;
    let albumCardLongPressTimer = null;
    let suppressedAlbumOpenId = null;

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatCount(count) {
        return Number(count || 0).toLocaleString('en-US');
    }

    function getRecentPhotos() {
        return albumState.recentSections.flatMap(section => section.photos);
    }

    function getPrivateAlbumPhotos() {
        return albumState.albums
            .filter(album => album && !album.dynamicRecent && album.isPrivate === true && Array.isArray(album.photos))
            .flatMap(album => album.photos);
    }

    function isPhotoHiddenFromRecent(photo) {
        if (!photo) return false;
        return getPrivateAlbumPhotos().some(privatePhoto => isSamePhotoReference(privatePhoto, photo));
    }

    function getVisibleRecentSections() {
        return albumState.recentSections
            .map(section => ({
                ...section,
                photos: section.photos.filter(photo => !isPhotoHiddenFromRecent(photo))
            }))
            .filter(section => section.photos.length > 0);
    }

    function getVisibleRecentPhotos() {
        return getVisibleRecentSections().flatMap(section => section.photos);
    }

    function isProtectedAlbum(albumId) {
        return albumId === FAVORITES_ALBUM_ID;
    }

    function getAlbumRecordById(albumId) {
        return albumState.albums.find(album => album.id === albumId) || null;
    }

    function resolveAlbum(album) {
        if (!album) return null;

        if (album.dynamicRecent) {
            const recentPhotos = getVisibleRecentPhotos();
            return {
                ...album,
                photos: recentPhotos,
                count: recentPhotos.length,
                cover: recentPhotos[0] ? recentPhotos[0].src : (album.cover || PLACEHOLDER_COVER)
            };
        }

        return {
            ...album,
            photos: Array.isArray(album.photos) ? album.photos : [],
            count: Number.isFinite(Number(album.count)) ? Number(album.count) : (Array.isArray(album.photos) ? album.photos.length : 0),
            cover: (album.photos && album.photos[0] && album.photos[0].src) || album.cover || PLACEHOLDER_COVER
        };
    }

    function getAlbums() {
        return albumState.albums.map(resolveAlbum).filter(Boolean);
    }

    function getAlbumById(albumId) {
        return resolveAlbum(getAlbumRecordById(albumId));
    }

    function getPrivacyEligibleAlbum(albumId) {
        const album = getAlbumById(albumId);
        if (!album || album.dynamicRecent) return null;
        return album;
    }

    function showAlbumToast(message) {
        if (typeof window.showChatToast === 'function') {
            window.showChatToast(message);
        }
    }

    function getPhotoCollection(collectionKey) {
        if (collectionKey === 'recent') return getVisibleRecentPhotos();
        if (collectionKey && collectionKey.startsWith('album:')) {
            const album = getAlbumById(collectionKey.slice('album:'.length));
            return album ? album.photos : [];
        }
        return [];
    }

    function findPhotoById(collectionKey, photoId) {
        return getPhotoCollection(collectionKey).find(photo => photo.id === photoId) || null;
    }

    function isSamePhotoReference(leftPhoto, rightPhoto) {
        if (!leftPhoto || !rightPhoto) return false;
        if (leftPhoto.id && rightPhoto.id && leftPhoto.id === rightPhoto.id) return true;
        return !!leftPhoto.src && !!rightPhoto.src && leftPhoto.src === rightPhoto.src;
    }

    function getFavoritesAlbumRecord() {
        return getAlbumRecordById(FAVORITES_ALBUM_ID);
    }

    function isPhotoInFavorites(photo) {
        const favoritesAlbum = getFavoritesAlbumRecord();
        if (!favoritesAlbum || !Array.isArray(favoritesAlbum.photos) || !photo) return false;
        return favoritesAlbum.photos.some(item => isSamePhotoReference(item, photo));
    }

    function getCurrentPhotoRecord() {
        if (!albumState.currentPhotoId) return null;
        return findPhotoById(albumState.currentPhotoCollectionKey, albumState.currentPhotoId);
    }

    function isAlbumElementVisibleInViewport(element, viewportElement = document.getElementById('album-app')) {
        if (!element) return false;

        const style = window.getComputedStyle(element);
        if (style.visibility === 'hidden' || style.display === 'none' || element.offsetParent === null) {
            return false;
        }

        const rect = element.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;

        const viewportRect = viewportElement
            ? viewportElement.getBoundingClientRect()
            : { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight };

        return rect.bottom > viewportRect.top
            && rect.top < viewportRect.bottom
            && rect.right > viewportRect.left
            && rect.left < viewportRect.right;
    }

    function getVisibleAlbumElements(selector, limit = ALBUM_SCREEN_SHARE_MAX_ITEMS) {
        if (!selector || limit <= 0) return [];

        const app = document.getElementById('album-app');
        return Array.from(document.querySelectorAll(selector))
            .filter(element => isAlbumElementVisibleInViewport(element, app))
            .slice(0, limit);
    }

    function getAlbumElementImageSrc(element) {
        if (!element) return '';

        const image = element.tagName === 'IMG' ? element : element.querySelector('img');
        if (!image) return '';

        return image.currentSrc || image.src || image.getAttribute('src') || '';
    }

    function normalizeScreenSharePhotoPayload(photo, fallbackSrc = '', sourceText = '') {
        if (!photo) return null;

        const src = typeof fallbackSrc === 'string' && fallbackSrc
            ? fallbackSrc
            : (typeof photo.src === 'string' && photo.src ? photo.src : (typeof photo.thumb === 'string' ? photo.thumb : ''));
        if (!src) return null;

        return {
            photoId: typeof photo.id === 'string' ? photo.id : '',
            src,
            thumb: typeof photo.thumb === 'string' && photo.thumb
                ? photo.thumb
                : (typeof fallbackSrc === 'string' && fallbackSrc ? fallbackSrc : src),
            location: typeof photo.location === 'string' ? photo.location : '',
            datetime: typeof photo.datetime === 'string' ? photo.datetime : '',
            sourceText: typeof sourceText === 'string' && sourceText.trim()
                ? sourceText.trim()
                : (typeof photo.location === 'string' ? photo.location : '')
        };
    }

    function buildScreenSharePhotoItem(photo, position, fallbackSrc = '', sourceText = '') {
        const normalizedPhoto = normalizeScreenSharePhotoPayload(photo, fallbackSrc, sourceText);
        if (!normalizedPhoto) return null;

        return {
            kind: 'photo',
            photoId: normalizedPhoto.photoId,
            src: normalizedPhoto.src,
            thumb: normalizedPhoto.thumb,
            location: normalizedPhoto.location,
            datetime: normalizedPhoto.datetime,
            sourceText: normalizedPhoto.sourceText,
            position
        };
    }

    function buildScreenShareAlbumItem(album, position, fallbackSrc = '') {
        if (!album) return null;

        const src = typeof fallbackSrc === 'string' && fallbackSrc
            ? fallbackSrc
            : (typeof album.cover === 'string' && album.cover
                ? album.cover
                : ((album.photos && album.photos[0] && album.photos[0].src) || PLACEHOLDER_COVER));

        return {
            kind: 'album_cover',
            albumId: typeof album.id === 'string' ? album.id : '',
            albumName: typeof album.name === 'string' ? album.name : '',
            src,
            count: Number.isFinite(Number(album.count)) ? Number(album.count) : 0,
            isPrivate: album.isPrivate === true,
            position
        };
    }

    function getCurrentPhotoAlbumName() {
        if (!albumState.currentPhotoCollectionKey || !albumState.currentPhotoCollectionKey.startsWith('album:')) {
            return null;
        }

        const album = getAlbumById(albumState.currentPhotoCollectionKey.slice('album:'.length));
        return album ? album.name : null;
    }

    function getAlbumPhotoDetailSourceText() {
        const sourceElement = document.getElementById('album-photo-location');
        return sourceElement ? String(sourceElement.textContent || '').trim() : '';
    }

    function getAlbumScreenShareSnapshot() {
        const app = document.getElementById('album-app');
        if (!app || app.classList.contains('hidden')) return null;

        const pageTitle = document.getElementById('album-page-title');
        const detailOverlay = document.getElementById('album-detail-overlay');
        const photoView = document.getElementById('album-photo-detail-view');
        const privacyPasswordModal = document.getElementById('album-privacy-password-modal');
        const privacyPasswordTitle = document.getElementById('album-privacy-password-title');
        const privacyPasswordDescription = document.getElementById('album-privacy-password-description');
        const privacyPasswordInput = document.getElementById('album-privacy-password-input');
        const privacyPasswordError = document.getElementById('album-privacy-password-error');
        const privacyPasswordConfirm = document.getElementById('album-privacy-password-confirm');
        const isPhotoDetailOpen = !!(photoView && photoView.classList.contains('open'));
        const isAlbumDetailOpen = !!(detailOverlay && detailOverlay.classList.contains('open'));
        const isPrivacyPasswordOpen = !!(privacyPasswordModal && privacyPasswordModal.classList.contains('open'));
        const privacyAlbum = albumState.privacyPasswordAlbumId ? getAlbumById(albumState.privacyPasswordAlbumId) : null;

        const snapshot = {
            app: 'album',
            view: 'recent_grid',
            title: pageTitle ? pageTitle.textContent.trim() : 'Album',
            activeAlbumName: null,
            currentPhoto: null,
            photoOriginView: null,
            detailSourceText: '',
            passwordAlbumName: privacyAlbum && privacyAlbum.name ? privacyAlbum.name : null,
            passwordMode: albumState.privacyPasswordMode || null,
            passwordTitle: privacyPasswordTitle ? String(privacyPasswordTitle.textContent || '').trim() : '',
            passwordDescription: privacyPasswordDescription ? String(privacyPasswordDescription.textContent || '').trim() : '',
            passwordError: privacyPasswordError && !privacyPasswordError.classList.contains('hidden')
                ? String(privacyPasswordError.textContent || '').trim()
                : '',
            passwordInputVisible: !!privacyPasswordInput,
            passwordConfirmText: privacyPasswordConfirm ? String(privacyPasswordConfirm.textContent || '').trim() : '',
            items: []
        };

        if (isPrivacyPasswordOpen) {
            snapshot.view = 'privacy_password_modal';
            snapshot.title = snapshot.passwordTitle || '输入相册密码';
            snapshot.activeAlbumName = snapshot.passwordAlbumName;
            snapshot.items = getVisibleAlbumElements('#album-albums-grid .album-card[data-album-id]')
                .map((button, index) => buildScreenShareAlbumItem(getAlbumById(button.dataset.albumId), index + 1, getAlbumElementImageSrc(button)))
                .filter(Boolean);
            return snapshot;
        }

        if (isPhotoDetailOpen) {
            const detailSourceText = getAlbumPhotoDetailSourceText();
            const currentPhoto = normalizeScreenSharePhotoPayload(
                getCurrentPhotoRecord(),
                getAlbumElementImageSrc(document.getElementById('album-photo-main-img')),
                detailSourceText
            );
            snapshot.view = 'photo_detail';
            snapshot.title = currentPhoto && currentPhoto.location
                ? currentPhoto.location
                : (document.getElementById('album-photo-location')?.textContent || 'Photo').trim();
            snapshot.activeAlbumName = getCurrentPhotoAlbumName();
            snapshot.detailSourceText = detailSourceText;
            snapshot.currentPhoto = currentPhoto;
            snapshot.photoOriginView = isAlbumDetailOpen ? 'album_detail' : 'recent_grid';
            snapshot.items = getVisibleAlbumElements('#album-photo-thumbnails .album-photo-thumb[data-photo-id]', ALBUM_SCREEN_SHARE_MAX_ITEMS + 1)
                .filter(button => !button.classList.contains('is-active'))
                .map((button, index) => buildScreenSharePhotoItem(
                    findPhotoById(button.dataset.collectionKey || albumState.currentPhotoCollectionKey, button.dataset.photoId),
                    index + 1,
                    getAlbumElementImageSrc(button)
                ))
                .filter(Boolean);
            return snapshot;
        }

        if (isAlbumDetailOpen) {
            const currentAlbum = getAlbumById(albumState.currentAlbumId);
            snapshot.view = 'album_detail';
            snapshot.title = currentAlbum && currentAlbum.name ? currentAlbum.name : 'Album Detail';
            snapshot.activeAlbumName = currentAlbum && currentAlbum.name ? currentAlbum.name : null;
            snapshot.items = getVisibleAlbumElements('#album-detail-content .album-photo-item[data-photo-id]')
                .map((button, index) => buildScreenSharePhotoItem(
                    findPhotoById(button.dataset.collectionKey || `album:${albumState.currentAlbumId}`, button.dataset.photoId),
                    index + 1,
                    getAlbumElementImageSrc(button)
                ))
                .filter(Boolean);
            return snapshot;
        }

        if (albumState.activeTab === 'albums') {
            snapshot.view = 'albums_grid';
            snapshot.title = pageTitle ? pageTitle.textContent.trim() : 'Albums';
            snapshot.items = getVisibleAlbumElements('#album-albums-grid .album-card[data-album-id]')
                .map((button, index) => buildScreenShareAlbumItem(getAlbumById(button.dataset.albumId), index + 1, getAlbumElementImageSrc(button)))
                .filter(Boolean);
            return snapshot;
        }

        snapshot.view = 'recent_grid';
        snapshot.title = pageTitle ? pageTitle.textContent.trim() : 'Recent';
        snapshot.items = getVisibleAlbumElements('#album-recent-content .album-photo-item[data-photo-id]')
            .map((button, index) => buildScreenSharePhotoItem(
                findPhotoById(button.dataset.collectionKey || 'recent', button.dataset.photoId),
                index + 1,
                getAlbumElementImageSrc(button)
            ))
            .filter(Boolean);
        return snapshot;
    }

    function sanitizePhotoFileName(value) {
        return String(value || '')
            .trim()
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    function inferPhotoFileExtension(source) {
        const normalizedSource = String(source || '').trim().toLowerCase();
        const dataMatch = normalizedSource.match(/^data:image\/([a-z0-9.+-]+);/);
        if (dataMatch && dataMatch[1]) {
            if (dataMatch[1] === 'jpeg') return 'jpg';
            return dataMatch[1];
        }

        try {
            const url = new URL(normalizedSource, window.location.href);
            const pathname = url.pathname || '';
            const extMatch = pathname.match(/\.([a-z0-9]+)$/i);
            if (extMatch && extMatch[1]) return extMatch[1].toLowerCase();
        } catch (error) {
            // ignore URL parsing failure and use fallback extension below
        }

        return 'jpg';
    }

    function buildPhotoExportFileName(photo) {
        const baseName = sanitizePhotoFileName(photo && photo.location ? photo.location : '') || `photo-${Date.now()}`;
        const extension = inferPhotoFileExtension(photo && photo.src ? photo.src : '');
        return `${baseName}.${extension}`;
    }

    function normalizeImageExtension(value) {
        const normalized = String(value || '')
            .trim()
            .toLowerCase()
            .replace(/^image\//, '')
            .replace(/^\./, '');

        if (!normalized) return 'jpg';
        if (normalized === 'jpeg') return 'jpg';
        if (normalized === 'svg+xml') return 'svg';
        if (normalized === 'x-icon' || normalized === 'vnd.microsoft.icon') return 'ico';

        const cleaned = normalized.split('+')[0].replace(/[^a-z0-9]/g, '');
        return cleaned || 'jpg';
    }

    function buildExportTimestamp() {
        const now = new Date();
        const pad = value => String(value).padStart(2, '0');
        return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    }

    function downloadBlobFile(blob, fileName) {
        const downloadUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = downloadUrl;
        anchor.download = fileName;
        anchor.rel = 'noopener';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    }

    async function fetchPhotoBlobForExport(photo) {
        if (!photo || !photo.src) {
            throw new Error('Missing photo source');
        }

        const response = await fetch(photo.src);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return response.blob();
    }

    function buildZipArchiveFileName(baseName) {
        const safeBaseName = sanitizePhotoFileName(baseName) || 'photos-export';
        return `${safeBaseName}-${buildExportTimestamp()}.zip`;
    }

    function buildUniquePhotoFileName(photo, index, usedNames, extension) {
        const safeExtension = normalizeImageExtension(extension || inferPhotoFileExtension(photo && photo.src ? photo.src : ''));
        const baseName = sanitizePhotoFileName(photo && photo.location ? photo.location : '')
            || sanitizePhotoFileName(photo && photo.datetime ? photo.datetime : '')
            || `photo-${index + 1}`;

        let fileName = `${baseName}.${safeExtension}`;
        let suffix = 2;

        while (usedNames.has(fileName.toLowerCase())) {
            fileName = `${baseName}-${suffix}.${safeExtension}`;
            suffix += 1;
        }

        usedNames.add(fileName.toLowerCase());
        return fileName;
    }

    function buildUniqueExportFolderName(name, index, usedNames) {
        const baseName = sanitizePhotoFileName(name) || `album-${index + 1}`;
        let folderName = baseName;
        let suffix = 2;

        while (usedNames.has(folderName.toLowerCase())) {
            folderName = `${baseName}-${suffix}`;
            suffix += 1;
        }

        usedNames.add(folderName.toLowerCase());
        return folderName;
    }

    async function exportPhotosAsZip(photos, baseName) {
        if (!Array.isArray(photos) || !photos.length) {
            alert('没有可导出的图片。');
            return;
        }

        if (typeof window.JSZip === 'undefined') {
            alert('当前环境不支持 ZIP 导出。');
            return;
        }

        const zip = new window.JSZip();
        const usedNames = new Set();
        let exportedCount = 0;
        let skippedCount = 0;

        for (let index = 0; index < photos.length; index += 1) {
            const photo = photos[index];

            try {
                const blob = await fetchPhotoBlobForExport(photo);
                const extension = normalizeImageExtension(blob.type || inferPhotoFileExtension(photo && photo.src ? photo.src : ''));
                const fileName = buildUniquePhotoFileName(photo, index, usedNames, extension);
                zip.file(fileName, blob);
                exportedCount += 1;
            } catch (error) {
                skippedCount += 1;
                console.error('Failed to add photo to zip export:', error);
            }
        }

        if (!exportedCount) {
            alert('没有成功打包的图片文件。');
            return;
        }

        try {
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            downloadBlobFile(zipBlob, buildZipArchiveFileName(baseName));

            if (typeof window.showChatToast === 'function') {
                const toastMessage = skippedCount
                    ? `已导出 ${exportedCount} 张，跳过 ${skippedCount} 张`
                    : `已开始导出 ZIP（${exportedCount} 张）`;
                window.showChatToast(toastMessage);
            }
        } catch (error) {
            console.error('Export zip failed:', error);
            alert(`ZIP 导出失败: ${error.message}`);
        }
    }

    async function exportCurrentPhotoFile() {
        const photo = getCurrentPhotoRecord();
        if (!photo || !photo.src) {
            alert('找不到可导出的图片');
            return;
        }

        const fileName = buildPhotoExportFileName(photo);

        try {
            const blob = await fetchPhotoBlobForExport(photo);
            downloadBlobFile(blob, fileName);

            if (typeof window.showChatToast === 'function') {
                window.showChatToast('图片已开始导出');
            }
        } catch (error) {
            console.error('Export photo failed:', error);
            try {
                const fallbackAnchor = document.createElement('a');
                fallbackAnchor.href = photo.src;
                fallbackAnchor.target = '_blank';
                fallbackAnchor.rel = 'noopener';
                document.body.appendChild(fallbackAnchor);
                fallbackAnchor.click();
                fallbackAnchor.remove();
            } catch (fallbackError) {
                console.error('Fallback export open failed:', fallbackError);
            }
            alert(`导出失败: ${error.message}`);
        }
    }

    function updateFavoriteButtonState() {
        const favoriteButton = document.getElementById('album-photo-favorite-btn');
        if (!favoriteButton) return;

        const icon = favoriteButton.querySelector('i');
        const currentPhoto = getCurrentPhotoRecord();
        const isFavorite = !!currentPhoto && isPhotoInFavorites(currentPhoto);

        favoriteButton.classList.toggle('is-active', isFavorite);
        favoriteButton.setAttribute('aria-pressed', isFavorite ? 'true' : 'false');
        if (icon) {
            icon.className = isFavorite ? 'ri-heart-fill' : 'ri-heart-line';
        }
    }

    function addCurrentPhotoToFavorites() {
        const currentPhoto = albumState.currentPhotoId
            ? findPhotoById(albumState.currentPhotoCollectionKey, albumState.currentPhotoId)
            : null;
        const favoritesAlbum = getFavoritesAlbumRecord();
        if (!currentPhoto || !favoritesAlbum) return;

        if (isPhotoInFavorites(currentPhoto)) {
            updateFavoriteButtonState();
            return;
        }

        favoritesAlbum.photos = [clonePhoto(currentPhoto), ...(Array.isArray(favoritesAlbum.photos) ? favoritesAlbum.photos : [])];
        favoritesAlbum.count = favoritesAlbum.photos.length;
        favoritesAlbum.cover = favoritesAlbum.photos[0] ? favoritesAlbum.photos[0].src : PLACEHOLDER_COVER;

        persistAlbumState();
        renderAlbums();
        if (albumState.currentAlbumId === FAVORITES_ALBUM_ID) {
            renderAlbumDetailContent();
        }
        updateFavoriteButtonState();
    }

    function renderSelectionMark(isSelected) {
        return `
            <span class="album-selection-mark ${isSelected ? 'is-selected' : ''}">
                <i class="ri-check-line"></i>
            </span>
        `;
    }

    function renderPhotoButton(photo, collectionKey, manageMode, selectedIds) {
        const isSelected = selectedIds && selectedIds.has(photo.id);
        return `
            <button
                class="album-photo-item${manageMode ? ' is-manage' : ''}${isSelected ? ' is-selected' : ''}"
                type="button"
                data-photo-id="${escapeHtml(photo.id)}"
                data-collection-key="${escapeHtml(collectionKey)}"
                aria-label="Open photo"
            >
                ${manageMode ? renderSelectionMark(isSelected) : ''}
                <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.location)}">
            </button>
        `;
    }

    function renderRecent() {
        const recentContent = document.getElementById('album-recent-content');
        if (!recentContent) return;

        const manageMode = albumState.mainManageMode === 'recent';
        const selectedIds = albumState.selectedRecentPhotoIds;
        const visibleSections = getVisibleRecentSections();

        if (!visibleSections.length) {
            recentContent.innerHTML = '<div class="album-detail-empty">No photos here right now.</div>';
            return;
        }

        recentContent.innerHTML = visibleSections.map(section => `
            <div class="album-date-header">${escapeHtml(section.label)}</div>
            <div class="album-photo-grid">
                ${section.photos.map(photo => renderPhotoButton(photo, 'recent', manageMode, selectedIds)).join('')}
            </div>
        `).join('');
    }

    function renderAlbums() {
        const albumsGrid = document.getElementById('album-albums-grid');
        if (!albumsGrid) return;

        const manageMode = albumState.mainManageMode === 'albums';
        const selectedIds = albumState.selectedAlbumIds;
        const albums = getAlbums();

        if (!albums.length) {
            albumsGrid.innerHTML = '<div class="album-detail-empty">No albums yet.</div>';
            return;
        }

        albumsGrid.innerHTML = albums.map(album => {
            const isSelected = selectedIds.has(album.id);
            return `
                <button
                    class="album-card${manageMode ? ' is-manage' : ''}${isSelected ? ' is-selected' : ''}${album.isPrivate ? ' is-private' : ''}"
                    type="button"
                    data-album-id="${escapeHtml(album.id)}"
                    aria-label="Open ${escapeHtml(album.name)}"
                >
                    ${manageMode ? renderSelectionMark(isSelected) : ''}
                    ${album.isPrivate ? '<span class="album-card-lock"><i class="ri-lock-2-fill"></i></span>' : ''}
                    <img src="${escapeHtml(album.cover)}" alt="${escapeHtml(album.name)}">
                    <div class="album-card-details">
                        <div class="album-card-title">${escapeHtml(album.name)}</div>
                        <div class="album-card-meta">
                            <i class="${escapeHtml(album.icon)}" style="color: ${escapeHtml(album.iconColor)};"></i>
                            <span>${formatCount(album.count)} items</span>
                        </div>
                    </div>
                </button>
            `;
        }).join('');
    }

    function syncMainTabUi() {
        const recentView = document.getElementById('album-recent-view');
        const albumsView = document.getElementById('album-albums-view');
        const recentTab = document.getElementById('album-tab-recent');
        const albumsTab = document.getElementById('album-tab-albums');
        const title = document.getElementById('album-page-title');
        if (!recentView || !albumsView || !recentTab || !albumsTab || !title) return;

        const showingRecent = albumState.activeTab === 'recent';
        recentView.classList.toggle('active', showingRecent);
        albumsView.classList.toggle('active', !showingRecent);
        recentTab.classList.toggle('active', showingRecent);
        albumsTab.classList.toggle('active', !showingRecent);
        title.textContent = showingRecent ? 'Recent' : 'Albums';
    }

    function renderAlbumAppUi() {
        renderRecent();
        renderAlbums();
        syncMainTabUi();
        updateMainHeaderActions();
        updateMainManageBar();

        if (albumState.currentAlbumId) {
            renderAlbumDetailContent();
        } else {
            const detailOverlay = document.getElementById('album-detail-overlay');
            if (detailOverlay) detailOverlay.classList.remove('open');
            updateDetailManageUi();
        }

        if (albumState.currentPhotoId) {
            const currentPhoto = findPhotoById(albumState.currentPhotoCollectionKey, albumState.currentPhotoId);
            if (currentPhoto) {
                openPhotoDetail(albumState.currentPhotoId, albumState.currentPhotoCollectionKey);
            } else {
                closePhotoDetail();
            }
        } else {
            const photoView = document.getElementById('album-photo-detail-view');
            if (photoView) photoView.classList.remove('open');
            updatePhotoMainViewMode();
            updateFavoriteButtonState();
        }
    }

    function updateMainHeaderActions() {
        const manageButton = document.getElementById('album-manage-btn');
        const createButton = document.getElementById('album-create-btn');
        if (!manageButton || !createButton) return;

        const managing = albumState.mainManageMode !== null;

        manageButton.textContent = managing ? '完成' : '管理';
        manageButton.classList.toggle('is-active', managing);
        createButton.classList.toggle('hidden', managing);
    }

    function updateMainManageBar() {
        const app = document.getElementById('album-app');
        const bar = document.getElementById('album-main-manage-bar');
        const countLabel = document.getElementById('album-main-manage-count');
        const selectAllButton = document.getElementById('album-main-select-all-btn');
        const addButton = document.getElementById('album-main-add-btn');
        const exportButton = document.getElementById('album-main-export-btn');
        const deleteButton = document.getElementById('album-main-delete-btn');
        if (!app || !bar || !countLabel || !selectAllButton || !addButton || !exportButton || !deleteButton) return;

        if (!albumState.mainManageMode) {
            bar.classList.add('hidden');
            app.classList.remove('is-main-managing');
            return;
        }

        const count = albumState.mainManageMode === 'albums'
            ? albumState.selectedAlbumIds.size
            : albumState.selectedRecentPhotoIds.size;
        const total = getCurrentMainSelectableIds().length;
        const allSelected = total > 0 && count === total;
        const hasDeletableAlbumSelection = albumState.mainManageMode !== 'albums'
            || Array.from(albumState.selectedAlbumIds).some(albumId => !isProtectedAlbum(albumId));
        const unit = albumState.mainManageMode === 'albums' ? '个相簿' : '张';

        countLabel.textContent = `已选择 ${count} ${unit}`;
        selectAllButton.textContent = allSelected ? '取消全选' : '全选';
        selectAllButton.classList.toggle('is-disabled', total === 0);
        const displayUnit = albumState.mainManageMode === 'albums' ? '个相簿' : '张';
        const shouldShowAddButton = albumState.mainManageMode === 'recent';
        const shouldShowExportButton = albumState.mainManageMode === 'recent' || albumState.mainManageMode === 'albums';
        countLabel.textContent = `已选择 ${count} ${displayUnit}`;
        selectAllButton.textContent = allSelected ? '取消全选' : '全选';
        addButton.classList.toggle('hidden', !shouldShowAddButton);
        exportButton.classList.toggle('hidden', !shouldShowExportButton);
        addButton.classList.toggle('is-disabled', !shouldShowAddButton || count === 0 || getAddableTargetAlbums().length === 0);
        exportButton.classList.toggle('is-disabled', !shouldShowExportButton || count === 0);
        deleteButton.classList.toggle('is-disabled', count === 0 || !hasDeletableAlbumSelection);
        bar.classList.remove('hidden');
        app.classList.add('is-main-managing');
    }

    function getCurrentMainSelectableIds() {
        return albumState.mainManageMode === 'albums'
            ? getAlbums().map(album => album.id)
            : getVisibleRecentPhotos().map(photo => photo.id);
    }

    function getMovableTargetAlbums() {
        return getAlbums().filter(album => album.id !== albumState.currentAlbumId && !album.dynamicRecent);
    }

    function getAddableTargetAlbums() {
        return getAlbums().filter(album => !album.dynamicRecent);
    }

    function getSelectedRecentPhotos() {
        if (!albumState.selectedRecentPhotoIds.size) return [];
        return getVisibleRecentPhotos()
            .filter(photo => albumState.selectedRecentPhotoIds.has(photo.id))
            .map(clonePhoto);
    }

    function getSelectedDetailPhotos() {
        if (!albumState.currentAlbumId || !albumState.selectedDetailPhotoIds.size) return [];

        const album = getAlbumById(albumState.currentAlbumId);
        if (!album || !Array.isArray(album.photos)) return [];

        return album.photos
            .filter(photo => albumState.selectedDetailPhotoIds.has(photo.id))
            .map(clonePhoto);
    }

    function getSelectedAlbumsForExport() {
        if (!albumState.selectedAlbumIds.size) return [];

        return getAlbums()
            .filter(album => albumState.selectedAlbumIds.has(album.id))
            .map(album => ({
                ...album,
                photos: Array.isArray(album.photos) ? album.photos.map(clonePhoto) : []
            }));
    }

    function getAlbumTargetOptions() {
        return albumState.moveModalMode === 'main-add'
            ? getAddableTargetAlbums()
            : getMovableTargetAlbums();
    }

    function updateDetailManageUi() {
        const overlay = document.getElementById('album-detail-overlay');
        const manageButton = document.getElementById('album-detail-manage-btn');
        const bar = document.getElementById('album-detail-manage-bar');
        const countLabel = document.getElementById('album-detail-manage-count');
        const selectAllButton = document.getElementById('album-detail-select-all-btn');
        const exportButton = document.getElementById('album-detail-export-btn');
        const deleteButton = document.getElementById('album-detail-delete-btn');
        const moveButton = document.getElementById('album-detail-move-btn');
        if (!overlay || !manageButton || !bar || !countLabel || !selectAllButton || !exportButton || !deleteButton || !moveButton) return;

        manageButton.textContent = albumState.detailManageMode ? '完成' : '管理';
        manageButton.classList.toggle('is-active', albumState.detailManageMode);
        overlay.classList.toggle('is-managing', albumState.detailManageMode);

        if (!albumState.detailManageMode) {
            bar.classList.add('hidden');
            return;
        }

        const count = albumState.selectedDetailPhotoIds.size;
        const total = getCurrentDetailSelectableIds().length;
        const allSelected = total > 0 && count === total;
        countLabel.textContent = `已选择 ${count} 张`;
        selectAllButton.textContent = allSelected ? '取消全选' : '全选';
        selectAllButton.classList.toggle('is-disabled', total === 0);
        exportButton.classList.toggle('is-disabled', count === 0);
        deleteButton.classList.toggle('is-disabled', count === 0);
        moveButton.classList.toggle('is-disabled', count === 0 || getMovableTargetAlbums().length === 0);
        bar.classList.remove('hidden');
    }

    function getCurrentDetailSelectableIds() {
        const album = getAlbumById(albumState.currentAlbumId);
        return album ? album.photos.map(photo => photo.id) : [];
    }

    function switchAlbumTab(tabName) {
        if (albumState.mainManageMode) {
            exitMainManageMode();
        }

        albumState.activeTab = tabName === 'albums' ? 'albums' : 'recent';

        const recentView = document.getElementById('album-recent-view');
        const albumsView = document.getElementById('album-albums-view');
        const recentTab = document.getElementById('album-tab-recent');
        const albumsTab = document.getElementById('album-tab-albums');
        const title = document.getElementById('album-page-title');

        if (!recentView || !albumsView || !recentTab || !albumsTab || !title) return;

        const showingRecent = albumState.activeTab === 'recent';
        recentView.classList.toggle('active', showingRecent);
        albumsView.classList.toggle('active', !showingRecent);
        recentTab.classList.toggle('active', showingRecent);
        albumsTab.classList.toggle('active', !showingRecent);
        title.textContent = showingRecent ? 'Recent' : 'Albums';
        updateMainHeaderActions();
    }

    function renderAlbumDetailContent() {
        const title = document.getElementById('album-detail-title');
        const content = document.getElementById('album-detail-content');
        if (!title || !content) return;

        const album = getAlbumById(albumState.currentAlbumId);
        if (!album) {
            closeAlbumDetail();
            return;
        }

        title.textContent = album.name;

        if (!album.photos.length) {
            content.innerHTML = '<div class="album-detail-empty">No photos in this album yet.</div>';
        } else {
            content.innerHTML = `
                <div class="album-photo-grid">
                    ${album.photos.map(photo => renderPhotoButton(
                        photo,
                        `album:${album.id}`,
                        albumState.detailManageMode,
                        albumState.selectedDetailPhotoIds
                    )).join('')}
                </div>
            `;
        }

        updateDetailManageUi();
    }

    function openAlbumDetail(albumId) {
        const overlay = document.getElementById('album-detail-overlay');
        if (!overlay) return;

        albumState.currentAlbumId = albumId;
        albumState.detailManageMode = false;
        albumState.selectedDetailPhotoIds.clear();
        closeMoveModal();
        renderAlbumDetailContent();
        overlay.classList.add('open');
    }

    function closeAlbumDetail() {
        const overlay = document.getElementById('album-detail-overlay');
        if (overlay) overlay.classList.remove('open');
        albumState.currentAlbumId = null;
        albumState.detailManageMode = false;
        albumState.selectedDetailPhotoIds.clear();
        closeMoveModal();
        updateDetailManageUi();
    }

    function updateAlbumPrivacyActionModal() {
        const title = document.getElementById('album-privacy-action-title');
        const description = document.getElementById('album-privacy-action-description');
        const confirmButton = document.getElementById('album-privacy-action-confirm');
        if (!title || !description || !confirmButton) return;

        const album = getPrivacyEligibleAlbum(albumState.privacyActionAlbumId);
        if (!album) {
            closeAlbumPrivacyActionModal();
            return;
        }

        if (album.isPrivate) {
            title.textContent = '取消隐私相册';
            description.textContent = `“${album.name}” 将恢复为普通相册，之后打开时不再需要输入密码。`;
            confirmButton.textContent = '取消隐私';
        } else {
            title.textContent = '设为隐私相册';
            description.textContent = `“${album.name}” 将在每次打开时要求输入密码。`;
            confirmButton.textContent = '设置隐私';
        }
    }

    function openAlbumPrivacyActionModal(albumId) {
        const modal = document.getElementById('album-privacy-action-modal');
        const album = getPrivacyEligibleAlbum(albumId);
        if (!modal) return false;

        if (!album) {
            showAlbumToast('Recent 不能设置为隐私相册');
            return false;
        }

        albumState.privacyActionAlbumId = album.id;
        updateAlbumPrivacyActionModal();
        modal.classList.add('open');
        return true;
    }

    function closeAlbumPrivacyActionModal() {
        const modal = document.getElementById('album-privacy-action-modal');
        if (modal) modal.classList.remove('open');
        albumState.privacyActionAlbumId = null;
        suppressedAlbumOpenId = null;
    }

    function setAlbumPrivacyPasswordError(message = '') {
        const error = document.getElementById('album-privacy-password-error');
        if (!error) return;

        error.textContent = message;
        error.classList.toggle('hidden', !message);
    }

    function openAlbumPrivacyPasswordModal(mode, albumId) {
        const modal = document.getElementById('album-privacy-password-modal');
        const title = document.getElementById('album-privacy-password-title');
        const description = document.getElementById('album-privacy-password-description');
        const input = document.getElementById('album-privacy-password-input');
        const confirmButton = document.getElementById('album-privacy-password-confirm');
        const album = getAlbumById(albumId);
        if (!modal || !title || !description || !input || !confirmButton || !album) return;

        albumState.privacyPasswordMode = mode;
        albumState.privacyPasswordAlbumId = album.id;
        input.value = '';
        setAlbumPrivacyPasswordError('');

        if (mode === 'set') {
            title.textContent = '设置相册密码';
            description.textContent = `请为“${album.name}”设置一个打开密码。`;
            input.placeholder = '请输入相册密码';
            confirmButton.textContent = '确定';
        } else if (mode === 'disable') {
            title.textContent = '验证相册密码';
            description.textContent = `请输入“${album.name}”的密码以取消隐私相册。`;
            input.placeholder = '请输入相册密码';
            confirmButton.textContent = '取消隐私';
        } else {
            title.textContent = '输入相册密码';
            description.textContent = `请输入“${album.name}”的密码以打开该相册。`;
            input.placeholder = '请输入相册密码';
            confirmButton.textContent = '打开';
        }

        modal.classList.add('open');
        window.setTimeout(() => input.focus(), 0);
    }

    function closeAlbumPrivacyPasswordModal() {
        const modal = document.getElementById('album-privacy-password-modal');
        const input = document.getElementById('album-privacy-password-input');
        if (modal) modal.classList.remove('open');
        if (input) input.value = '';
        setAlbumPrivacyPasswordError('');
        albumState.privacyPasswordMode = null;
        albumState.privacyPasswordAlbumId = null;
    }

    function confirmAlbumPrivacyAction() {
        const album = getPrivacyEligibleAlbum(albumState.privacyActionAlbumId);
        if (!album) {
            closeAlbumPrivacyActionModal();
            return;
        }

        closeAlbumPrivacyActionModal();

        if (album.isPrivate) {
            openAlbumPrivacyPasswordModal('disable', album.id);
            return;
        }

        openAlbumPrivacyPasswordModal('set', album.id);
    }

    function submitAlbumPrivacyPassword() {
        const input = document.getElementById('album-privacy-password-input');
        const albumId = albumState.privacyPasswordAlbumId;
        const mode = albumState.privacyPasswordMode;
        const album = getAlbumById(albumId);
        const value = input ? input.value.trim() : '';
        if (!input || !albumId || !mode || !album) return;

        if (!value) {
            setAlbumPrivacyPasswordError('请输入密码');
            input.focus();
            return;
        }

        if (mode === 'set') {
            const albumRecord = getAlbumRecordById(albumId);
            if (!albumRecord) return;

            albumRecord.isPrivate = true;
            albumRecord.privacyPassword = value;
            persistAlbumState();
            renderAlbums();
            closeAlbumPrivacyPasswordModal();
            showAlbumToast('已设为隐私相册');
            return;
        }

        if (album.privacyPassword !== value) {
            setAlbumPrivacyPasswordError('密码错误，请重新输入');
            input.focus();
            input.select();
            return;
        }

        if (mode === 'disable') {
            const albumRecord = getAlbumRecordById(albumId);
            if (!albumRecord) return;

            albumRecord.isPrivate = false;
            albumRecord.privacyPassword = '';
            persistAlbumState();
            renderAlbums();
            closeAlbumPrivacyPasswordModal();
            showAlbumToast('已取消隐私相册');
            return;
        }

        closeAlbumPrivacyPasswordModal();
        openAlbumDetail(albumId);
    }

    function handleAlbumOpenRequest(albumId) {
        const album = getAlbumById(albumId);
        if (!album) return;

        if (album.isPrivate) {
            openAlbumPrivacyPasswordModal('unlock', album.id);
            return;
        }

        openAlbumDetail(album.id);
    }

    function clearAlbumCardLongPress() {
        if (albumCardLongPressTimer) {
            window.clearTimeout(albumCardLongPressTimer);
            albumCardLongPressTimer = null;
        }
    }

    function beginAlbumCardLongPress(albumId) {
        clearAlbumCardLongPress();
        suppressedAlbumOpenId = null;

        albumCardLongPressTimer = window.setTimeout(() => {
            suppressedAlbumOpenId = albumId;
            openAlbumPrivacyActionModal(albumId);
            albumCardLongPressTimer = null;
        }, ALBUM_CARD_LONG_PRESS_DURATION);
    }

    function renderPhotoThumbnails(collectionKey) {
        const thumbnails = document.getElementById('album-photo-thumbnails');
        if (!thumbnails) return;

        const photos = getPhotoCollection(collectionKey);
        thumbnails.innerHTML = photos.map(photo => `
            <button
                class="album-photo-thumb ${photo.id === albumState.currentPhotoId ? 'is-active' : ''}"
                type="button"
                data-photo-id="${escapeHtml(photo.id)}"
                data-collection-key="${escapeHtml(collectionKey)}"
                aria-label="Select photo"
            >
                <img src="${escapeHtml(photo.thumb)}" alt="${escapeHtml(photo.location)}">
            </button>
        `).join('');
    }

    function updatePhotoMainViewMode() {
        const main = document.querySelector('#album-app .album-photo-main');
        if (!main) return;
        main.classList.toggle('is-full-view', !!albumState.currentPhotoFullView);
    }

    function openPhotoDetail(photoId, collectionKey) {
        const photoView = document.getElementById('album-photo-detail-view');
        const mainImg = document.getElementById('album-photo-main-img');
        const location = document.getElementById('album-photo-location');
        const datetime = document.getElementById('album-photo-datetime');
        const photo = findPhotoById(collectionKey, photoId);

        if (!photoView || !mainImg || !location || !datetime || !photo) return;

        albumState.currentPhotoId = photo.id;
        albumState.currentPhotoCollectionKey = collectionKey;
        albumState.currentPhotoFullView = false;
        mainImg.src = photo.src;
        mainImg.alt = photo.location;
        location.textContent = photo.location;
        datetime.textContent = photo.datetime;
        renderPhotoThumbnails(collectionKey);
        updatePhotoMainViewMode();
        updateFavoriteButtonState();
        photoView.classList.add('open');
    }

    function closePhotoDetail() {
        const photoView = document.getElementById('album-photo-detail-view');
        albumState.currentPhotoFullView = false;
        albumState.currentPhotoId = null;
        albumState.currentPhotoCollectionKey = 'recent';
        updatePhotoMainViewMode();
        updateFavoriteButtonState();
        if (photoView) photoView.classList.remove('open');
    }

    function togglePhotoMainViewMode() {
        albumState.currentPhotoFullView = !albumState.currentPhotoFullView;
        updatePhotoMainViewMode();
    }

    function openCreateAlbumModal() {
        const modal = document.getElementById('album-create-modal');
        const input = document.getElementById('album-new-name');
        if (!modal || !input) return;

        modal.classList.add('open');
        input.value = '';
        window.setTimeout(() => input.focus(), 0);
    }

    function closeCreateAlbumModal() {
        const modal = document.getElementById('album-create-modal');
        if (modal) modal.classList.remove('open');
    }

    function formatPhotoTimestamp(date) {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${months[date.getMonth()]} ${date.getDate()} / ${hours}:${minutes}`;
    }

    function getOrCreateTodaySection() {
        let section = albumState.recentSections.find(item => item.label === 'Today');
        if (!section) {
            section = { label: 'Today', photos: [] };
            albumState.recentSections.unshift(section);
        }
        return section;
    }

    function readAlbumImageFile(file) {
        if (typeof compressImage === 'function') {
            return compressImage(file, 1600, 0.82);
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => resolve(event.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async function prepareAlbumPhotoSource(source) {
        const normalizedSource = typeof source === 'string' ? source.trim() : '';
        if (!normalizedSource) {
            throw new Error('Missing image source');
        }

        if (normalizedSource.startsWith('data:image') && typeof compressBase64 === 'function') {
            try {
                return await compressBase64(normalizedSource, 1600, 0.82);
            } catch (error) {
                console.warn('Failed to compress album source image, falling back to original.', error);
            }
        }

        return normalizedSource;
    }

    async function savePhotoToLibrary(source, options = {}) {
        const preparedSource = await prepareAlbumPhotoSource(source);
        const existingPhoto = getRecentPhotos().find(photo => isSamePhotoReference(photo, { src: preparedSource, thumb: preparedSource }));
        if (existingPhoto) {
            return {
                ok: true,
                duplicate: true,
                photo: clonePhoto(existingPhoto)
            };
        }

        const now = new Date();
        const savedPhoto = {
            id: `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            src: preparedSource,
            thumb: preparedSource,
            location: typeof options.location === 'string' && options.location.trim() ? options.location.trim() : 'Saved from Chat',
            datetime: formatPhotoTimestamp(now)
        };

        const todaySection = getOrCreateTodaySection();
        todaySection.photos = [savedPhoto, ...todaySection.photos];

        persistAlbumState();
        renderRecent();
        renderAlbums();

        if (albumState.currentAlbumId === RECENT_ALBUM_ID) {
            renderAlbumDetailContent();
        }

        return {
            ok: true,
            duplicate: false,
            photo: clonePhoto(savedPhoto)
        };
    }

    async function handlePhotoUpload(event) {
        const input = event.target;
        const files = Array.from(input.files || []).filter(file => file.type && file.type.startsWith('image/'));
        input.value = '';

        if (!files.length) return;

        const now = new Date();
        const uploadedResults = await Promise.allSettled(files.map((file, index) =>
            readAlbumImageFile(file).then(src => ({
                id: `upload-${Date.now()}-${index}`,
                src,
                thumb: src,
                location: 'Imported Photo',
                datetime: formatPhotoTimestamp(now)
            }))
        ));

        const uploadedPhotos = uploadedResults
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);

        if (!uploadedPhotos.length) {
            alert('图片上传失败，请重试');
            return;
        }

        const todaySection = getOrCreateTodaySection();
        todaySection.photos = [...uploadedPhotos, ...todaySection.photos];
        persistAlbumState();

        renderRecent();
        renderAlbums();

        if (albumState.currentAlbumId === RECENT_ALBUM_ID) {
            renderAlbumDetailContent();
        }
    }

    function handleCreateAction() {
        if (albumState.activeTab === 'recent') {
            const uploadInput = document.getElementById('album-upload-input');
            if (uploadInput) uploadInput.click();
            return;
        }

        openCreateAlbumModal();
    }

    function saveNewAlbum() {
        const input = document.getElementById('album-new-name');
        if (!input) return;

        const name = input.value.trim();
        if (!name) {
            input.focus();
            return;
        }

        const albumId = `custom-album-${Date.now()}`;
        const newAlbum = {
            id: albumId,
            name,
            count: 0,
            icon: 'ri-folder-line',
            iconColor: '#8e8e93',
            cover: PLACEHOLDER_COVER,
            photos: [],
            isPrivate: false,
            privacyPassword: ''
        };
        const favoritesIndex = albumState.albums.findIndex(album => album.id === FAVORITES_ALBUM_ID);
        const insertIndex = favoritesIndex >= 0 ? favoritesIndex + 1 : 0;
        albumState.albums.splice(insertIndex, 0, newAlbum);
        persistAlbumState();

        renderAlbums();
        closeCreateAlbumModal();
        switchAlbumTab('albums');
        openAlbumDetail(albumId);
    }

    function closeMoveModal() {
        const modal = document.getElementById('album-move-modal');
        if (modal) modal.classList.remove('open');
        albumState.moveModalMode = null;
        albumState.selectedMoveTargetAlbumIds.clear();
    }

    function closeAlbumApp() {
        const app = document.getElementById('album-app');
        if (app) app.classList.add('hidden');
        closeCreateAlbumModal();
        closeMoveModal();
        closeAlbumPrivacyActionModal();
        closeAlbumPrivacyPasswordModal();
        clearAlbumCardLongPress();
        closePhotoDetail();
        closeAlbumDetail();
        exitMainManageMode();
        switchAlbumTab('recent');
    }

    function exitMainManageMode() {
        albumState.mainManageMode = null;
        albumState.selectedRecentPhotoIds.clear();
        albumState.selectedAlbumIds.clear();
        closeMoveModal();
        renderRecent();
        renderAlbums();
        updateMainHeaderActions();
        updateMainManageBar();
    }

    function toggleMainManageMode() {
        if (albumState.mainManageMode) {
            exitMainManageMode();
            return;
        }

        albumState.mainManageMode = albumState.activeTab === 'albums' ? 'albums' : 'recent';
        albumState.selectedRecentPhotoIds.clear();
        albumState.selectedAlbumIds.clear();
        renderRecent();
        renderAlbums();
        updateMainHeaderActions();
        updateMainManageBar();
    }

    function toggleDetailManageMode() {
        albumState.detailManageMode = !albumState.detailManageMode;
        albumState.selectedDetailPhotoIds.clear();
        closeMoveModal();
        renderAlbumDetailContent();
    }

    function toggleSelection(setRef, itemId) {
        if (setRef.has(itemId)) {
            setRef.delete(itemId);
        } else {
            setRef.add(itemId);
        }
    }

    function toggleMainSelectAll() {
        if (!albumState.mainManageMode) return;

        const allIds = getCurrentMainSelectableIds();
        const targetSet = albumState.mainManageMode === 'albums'
            ? albumState.selectedAlbumIds
            : albumState.selectedRecentPhotoIds;

        if (targetSet.size === allIds.length) {
            targetSet.clear();
        } else {
            targetSet.clear();
            allIds.forEach(id => targetSet.add(id));
        }

        renderRecent();
        renderAlbums();
        updateMainManageBar();
    }

    function toggleDetailSelectAll() {
        if (!albumState.detailManageMode) return;

        const allIds = getCurrentDetailSelectableIds();
        if (albumState.selectedDetailPhotoIds.size === allIds.length) {
            albumState.selectedDetailPhotoIds.clear();
        } else {
            albumState.selectedDetailPhotoIds.clear();
            allIds.forEach(id => albumState.selectedDetailPhotoIds.add(id));
        }

        renderAlbumDetailContent();
    }

    function removeRecentPhotos(photoIds) {
        albumState.recentSections = albumState.recentSections
            .map(section => ({
                ...section,
                photos: section.photos.filter(photo => !photoIds.has(photo.id))
            }))
            .filter(section => section.photos.length > 0);
    }

    function removePhotosFromAlbumRecord(albumRecord, photoIds) {
        if (!albumRecord) return [];

        if (albumRecord.dynamicRecent) {
            const removed = getRecentPhotos().filter(photo => photoIds.has(photo.id));
            removeRecentPhotos(photoIds);
            return removed.map(clonePhoto);
        }

        const removed = albumRecord.photos.filter(photo => photoIds.has(photo.id)).map(clonePhoto);
        albumRecord.photos = albumRecord.photos.filter(photo => !photoIds.has(photo.id));
        albumRecord.count = Math.max(albumRecord.photos.length, Number(albumRecord.count || 0) - removed.length);
        albumRecord.cover = albumRecord.photos[0] ? albumRecord.photos[0].src : PLACEHOLDER_COVER;
        return removed;
    }

    function clonePhotosForMove(targetAlbum, photos) {
        const existingIds = new Set((targetAlbum.photos || []).map(photo => photo.id));

        return photos.map((photo, index) => {
            const next = clonePhoto(photo);
            while (existingIds.has(next.id)) {
                next.id = `${next.id}-${Date.now()}-${index}`;
            }
            existingIds.add(next.id);
            return next;
        });
    }

    function addPhotosToAlbum(targetAlbumId, photos) {
        const targetAlbum = getAlbumRecordById(targetAlbumId);
        if (!targetAlbum || targetAlbum.dynamicRecent || !photos.length) return;

        const incoming = clonePhotosForMove(targetAlbum, photos);
        targetAlbum.photos = [...incoming, ...targetAlbum.photos];
        targetAlbum.count = Math.max(targetAlbum.photos.length, Number(targetAlbum.count || 0) + incoming.length);
        targetAlbum.cover = targetAlbum.photos[0] ? targetAlbum.photos[0].src : PLACEHOLDER_COVER;
    }

    function handleRecentDelete() {
        if (!albumState.selectedRecentPhotoIds.size) return;

        removeRecentPhotos(albumState.selectedRecentPhotoIds);
        albumState.selectedRecentPhotoIds.clear();
        persistAlbumState();
        renderRecent();
        renderAlbums();
        updateMainManageBar();
    }

    function handleAlbumDelete() {
        if (!albumState.selectedAlbumIds.size) return;

        const deletableAlbumIds = new Set(
            Array.from(albumState.selectedAlbumIds).filter(albumId => !isProtectedAlbum(albumId))
        );
        if (!deletableAlbumIds.size) {
            albumState.selectedAlbumIds.clear();
            renderAlbums();
            updateMainManageBar();
            return;
        }

        const deletingCurrentAlbum = albumState.currentAlbumId && deletableAlbumIds.has(albumState.currentAlbumId);
        albumState.albums = albumState.albums.filter(album => !deletableAlbumIds.has(album.id));
        albumState.selectedAlbumIds.clear();
        persistAlbumState();
        renderAlbums();
        updateMainManageBar();

        if (deletingCurrentAlbum) {
            closeAlbumDetail();
        }
    }

    function handleDetailDelete() {
        if (!albumState.currentAlbumId || !albumState.selectedDetailPhotoIds.size) return;

        const currentAlbum = getAlbumRecordById(albumState.currentAlbumId);
        removePhotosFromAlbumRecord(currentAlbum, albumState.selectedDetailPhotoIds);
        albumState.selectedDetailPhotoIds.clear();
        persistAlbumState();
        renderRecent();
        renderAlbums();
        renderAlbumDetailContent();
    }

    function updateMoveModalUi() {
        const title = document.getElementById('album-move-title');
        const options = document.getElementById('album-move-options');
        const confirmButton = document.getElementById('album-move-confirm');
        if (!title || !options || !confirmButton) return;

        const isMainAddMode = albumState.moveModalMode === 'main-add';
        const targets = getAlbumTargetOptions();

        title.textContent = isMainAddMode ? '添加到相簿' : '移动到相簿';
        confirmButton.textContent = isMainAddMode ? '添加' : '移动';
        confirmButton.classList.toggle('hidden', !isMainAddMode);
        confirmButton.classList.toggle('is-disabled', !isMainAddMode || albumState.selectedMoveTargetAlbumIds.size === 0 || targets.length === 0);

        if (!targets.length) {
            options.innerHTML = `<div class="album-move-empty">${isMainAddMode ? '没有可添加到的相簿。' : '没有可移动到的相簿。'}</div>`;
            return;
        }

        options.innerHTML = targets.map(album => {
            const isSelected = albumState.selectedMoveTargetAlbumIds.has(album.id);
            const trailing = isMainAddMode
                ? `<span class="album-move-option-check"><i class="ri-check-line"></i></span>`
                : '<span class="album-move-option-arrow"><i class="ri-arrow-right-s-line"></i></span>';

            return `
                <button
                    class="album-move-option${isSelected ? ' is-selected' : ''}"
                    type="button"
                    data-target-album-id="${escapeHtml(album.id)}"
                >
                    <span class="album-move-option-info">
                        <span class="album-move-option-name">${escapeHtml(album.name)}</span>
                        <span class="album-move-option-count">${formatCount(album.count)} items</span>
                    </span>
                    ${trailing}
                </button>
            `;
        }).join('');
    }

    function openMoveModal(mode = 'detail-move') {
        const modal = document.getElementById('album-move-modal');
        if (!modal) return;

        if (mode === 'main-add') {
            if (albumState.mainManageMode !== 'recent' || !albumState.selectedRecentPhotoIds.size) return;
        } else if (!albumState.currentAlbumId || !albumState.selectedDetailPhotoIds.size) {
            return;
        }

        albumState.moveModalMode = mode;
        albumState.selectedMoveTargetAlbumIds.clear();
        updateMoveModalUi();
        modal.classList.add('open');
    }

    function toggleMoveTargetSelection(targetAlbumId) {
        if (!targetAlbumId || albumState.moveModalMode !== 'main-add') return;

        if (albumState.selectedMoveTargetAlbumIds.has(targetAlbumId)) {
            albumState.selectedMoveTargetAlbumIds.delete(targetAlbumId);
        } else {
            albumState.selectedMoveTargetAlbumIds.add(targetAlbumId);
        }

        updateMoveModalUi();
    }

    function addSelectedRecentPhotosToAlbums() {
        if (albumState.mainManageMode !== 'recent' || !albumState.selectedRecentPhotoIds.size || !albumState.selectedMoveTargetAlbumIds.size) return;

        const selectedPhotos = getSelectedRecentPhotos();
        if (!selectedPhotos.length) return;

        const targetAlbumIds = Array.from(albumState.selectedMoveTargetAlbumIds);
        targetAlbumIds.forEach(targetAlbumId => addPhotosToAlbum(targetAlbumId, selectedPhotos));
        albumState.selectedRecentPhotoIds.clear();
        closeMoveModal();
        persistAlbumState();
        renderRecent();
        renderAlbums();
        updateMainManageBar();

        if (albumState.currentAlbumId && targetAlbumIds.includes(albumState.currentAlbumId)) {
            renderAlbumDetailContent();
        }
    }

    async function exportSelectedRecentPhotosZip() {
        if (albumState.mainManageMode !== 'recent' || !albumState.selectedRecentPhotoIds.size) return;
        await exportPhotosAsZip(getSelectedRecentPhotos(), 'photos-export');
    }

    async function exportSelectedAlbumsZip() {
        if (albumState.mainManageMode !== 'albums' || !albumState.selectedAlbumIds.size) return;

        const albums = getSelectedAlbumsForExport();
        if (!albums.length) {
            alert('没有可导出的相簿。');
            return;
        }

        if (typeof window.JSZip === 'undefined') {
            alert('当前环境不支持 ZIP 导出。');
            return;
        }

        const zip = new window.JSZip();
        const usedFolderNames = new Set();
        let exportedCount = 0;
        let skippedCount = 0;

        for (let albumIndex = 0; albumIndex < albums.length; albumIndex += 1) {
            const album = albums[albumIndex];
            if (!Array.isArray(album.photos) || !album.photos.length) continue;

            const folderName = buildUniqueExportFolderName(album.name, albumIndex, usedFolderNames);
            const folder = zip.folder(folderName);
            const usedFileNames = new Set();

            for (let photoIndex = 0; photoIndex < album.photos.length; photoIndex += 1) {
                const photo = album.photos[photoIndex];

                try {
                    const blob = await fetchPhotoBlobForExport(photo);
                    const extension = normalizeImageExtension(blob.type || inferPhotoFileExtension(photo && photo.src ? photo.src : ''));
                    const fileName = buildUniquePhotoFileName(photo, photoIndex, usedFileNames, extension);
                    folder.file(fileName, blob);
                    exportedCount += 1;
                } catch (error) {
                    skippedCount += 1;
                    console.error('Failed to add album photo to zip export:', error);
                }
            }
        }

        if (!exportedCount) {
            alert('没有成功打包的图片文件。');
            return;
        }

        try {
            const zipBlob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 }
            });

            downloadBlobFile(zipBlob, buildZipArchiveFileName('albums-export'));

            if (typeof window.showChatToast === 'function') {
                const toastMessage = skippedCount
                    ? `已导出 ${exportedCount} 张，跳过 ${skippedCount} 张`
                    : `已开始导出相簿 ZIP（${exportedCount} 张）`;
                window.showChatToast(toastMessage);
            }
        } catch (error) {
            console.error('Export selected albums zip failed:', error);
            alert(`ZIP 导出失败: ${error.message}`);
        }
    }

    async function exportSelectedDetailPhotosZip() {
        if (!albumState.currentAlbumId || !albumState.selectedDetailPhotoIds.size) return;

        const currentAlbum = getAlbumById(albumState.currentAlbumId);
        const baseName = currentAlbum ? `${currentAlbum.name}-photos` : 'album-photos';
        await exportPhotosAsZip(getSelectedDetailPhotos(), baseName);
    }

    function moveSelectedPhotosToAlbum(targetAlbumId) {
        if (!albumState.currentAlbumId || !albumState.selectedDetailPhotoIds.size) return;

        const sourceAlbum = getAlbumRecordById(albumState.currentAlbumId);
        const movedPhotos = removePhotosFromAlbumRecord(sourceAlbum, albumState.selectedDetailPhotoIds);
        addPhotosToAlbum(targetAlbumId, movedPhotos);
        albumState.selectedDetailPhotoIds.clear();
        albumState.detailManageMode = false;
        closeMoveModal();
        persistAlbumState();
        renderRecent();
        renderAlbums();
        renderAlbumDetailContent();
    }

    function bindAlbumEvents() {
        const recentContent = document.getElementById('album-recent-content');
        const albumsGrid = document.getElementById('album-albums-grid');
        const detailContent = document.getElementById('album-detail-content');
        const thumbnails = document.getElementById('album-photo-thumbnails');
        const photoMain = document.querySelector('#album-app .album-photo-main');
        const createButton = document.getElementById('album-create-btn');
        const uploadInput = document.getElementById('album-upload-input');
        const manageButton = document.getElementById('album-manage-btn');
        const pageTitle = document.getElementById('album-page-title');
        const recentTab = document.getElementById('album-tab-recent');
        const albumsTab = document.getElementById('album-tab-albums');
        const detailBack = document.getElementById('album-detail-back-btn');
        const detailManageButton = document.getElementById('album-detail-manage-btn');
        const exportButton = document.getElementById('album-photo-export-btn');
        const photoClose = document.getElementById('album-photo-close-btn');
        const favoriteButton = document.getElementById('album-photo-favorite-btn');
        const modal = document.getElementById('album-create-modal');
        const modalCancel = document.getElementById('album-modal-cancel');
        const modalSave = document.getElementById('album-modal-save');
        const modalInput = document.getElementById('album-new-name');
        const privacyActionModal = document.getElementById('album-privacy-action-modal');
        const privacyActionCancel = document.getElementById('album-privacy-action-cancel');
        const privacyActionConfirm = document.getElementById('album-privacy-action-confirm');
        const privacyPasswordModal = document.getElementById('album-privacy-password-modal');
        const privacyPasswordCancel = document.getElementById('album-privacy-password-cancel');
        const privacyPasswordConfirm = document.getElementById('album-privacy-password-confirm');
        const privacyPasswordInput = document.getElementById('album-privacy-password-input');
        const mainSelectAllButton = document.getElementById('album-main-select-all-btn');
        const mainAddButton = document.getElementById('album-main-add-btn');
        const mainExportButton = document.getElementById('album-main-export-btn');
        const mainDeleteButton = document.getElementById('album-main-delete-btn');
        const detailSelectAllButton = document.getElementById('album-detail-select-all-btn');
        const detailExportButton = document.getElementById('album-detail-export-btn');
        const detailDeleteButton = document.getElementById('album-detail-delete-btn');
        const detailMoveButton = document.getElementById('album-detail-move-btn');
        const moveModal = document.getElementById('album-move-modal');
        const moveOptions = document.getElementById('album-move-options');
        const moveCancel = document.getElementById('album-move-cancel');
        const moveConfirm = document.getElementById('album-move-confirm');

        if (recentContent) {
            recentContent.addEventListener('click', event => {
                const button = event.target.closest('[data-photo-id][data-collection-key]');
                if (!button) return;

                if (albumState.mainManageMode === 'recent') {
                    toggleSelection(albumState.selectedRecentPhotoIds, button.dataset.photoId);
                    renderRecent();
                    updateMainManageBar();
                    return;
                }

                openPhotoDetail(button.dataset.photoId, button.dataset.collectionKey);
            });
        }

        if (albumsGrid) {
            albumsGrid.addEventListener('click', event => {
                const button = event.target.closest('[data-album-id]');
                if (!button) return;

                if (suppressedAlbumOpenId === button.dataset.albumId) {
                    suppressedAlbumOpenId = null;
                    return;
                }

                if (albumState.mainManageMode === 'albums') {
                    toggleSelection(albumState.selectedAlbumIds, button.dataset.albumId);
                    renderAlbums();
                    updateMainManageBar();
                    return;
                }

                handleAlbumOpenRequest(button.dataset.albumId);
            });

            albumsGrid.addEventListener('pointerdown', event => {
                if (event.pointerType === 'mouse' && event.button !== 0) return;

                const button = event.target.closest('[data-album-id]');
                if (!button || albumState.mainManageMode === 'albums') return;

                beginAlbumCardLongPress(button.dataset.albumId);
            });

            albumsGrid.addEventListener('pointerup', clearAlbumCardLongPress);
            albumsGrid.addEventListener('pointercancel', clearAlbumCardLongPress);
            albumsGrid.addEventListener('pointerleave', event => {
                if (!event.target.closest('[data-album-id]')) return;
                clearAlbumCardLongPress();
            });

            albumsGrid.addEventListener('contextmenu', event => {
                const button = event.target.closest('[data-album-id]');
                if (!button || albumState.mainManageMode === 'albums') return;

                event.preventDefault();
                clearAlbumCardLongPress();
                if (openAlbumPrivacyActionModal(button.dataset.albumId)) {
                    suppressedAlbumOpenId = button.dataset.albumId;
                }
            });
        }

        if (detailContent) {
            detailContent.addEventListener('click', event => {
                const button = event.target.closest('[data-photo-id][data-collection-key]');
                if (!button) return;

                if (albumState.detailManageMode) {
                    toggleSelection(albumState.selectedDetailPhotoIds, button.dataset.photoId);
                    renderAlbumDetailContent();
                    return;
                }

                openPhotoDetail(button.dataset.photoId, button.dataset.collectionKey);
            });
        }

        if (thumbnails) {
            thumbnails.addEventListener('click', event => {
                const button = event.target.closest('[data-photo-id][data-collection-key]');
                if (!button) return;
                openPhotoDetail(button.dataset.photoId, button.dataset.collectionKey);
            });
        }

        if (photoMain) {
            photoMain.addEventListener('click', togglePhotoMainViewMode);
        }

        if (moveOptions) {
            moveOptions.addEventListener('click', event => {
                const button = event.target.closest('[data-target-album-id]');
                if (!button) return;
                if (albumState.moveModalMode === 'main-add') {
                    toggleMoveTargetSelection(button.dataset.targetAlbumId);
                    return;
                }
                moveSelectedPhotosToAlbum(button.dataset.targetAlbumId);
            });
        }

        if (createButton) createButton.addEventListener('click', handleCreateAction);
        if (uploadInput) uploadInput.addEventListener('change', handlePhotoUpload);
        if (manageButton) manageButton.addEventListener('click', toggleMainManageMode);
        if (pageTitle) pageTitle.addEventListener('click', closeAlbumApp);
        if (recentTab) recentTab.addEventListener('click', () => switchAlbumTab('recent'));
        if (albumsTab) albumsTab.addEventListener('click', () => switchAlbumTab('albums'));
        if (detailBack) detailBack.addEventListener('click', closeAlbumDetail);
        if (detailManageButton) detailManageButton.addEventListener('click', toggleDetailManageMode);
        if (exportButton) exportButton.addEventListener('click', exportCurrentPhotoFile);
        if (photoClose) photoClose.addEventListener('click', closePhotoDetail);
        if (favoriteButton) favoriteButton.addEventListener('click', addCurrentPhotoToFavorites);
        if (modalCancel) modalCancel.addEventListener('click', closeCreateAlbumModal);
        if (modalSave) modalSave.addEventListener('click', saveNewAlbum);
        if (privacyActionCancel) privacyActionCancel.addEventListener('click', closeAlbumPrivacyActionModal);
        if (privacyActionConfirm) privacyActionConfirm.addEventListener('click', confirmAlbumPrivacyAction);
        if (privacyPasswordCancel) privacyPasswordCancel.addEventListener('click', closeAlbumPrivacyPasswordModal);
        if (privacyPasswordConfirm) privacyPasswordConfirm.addEventListener('click', submitAlbumPrivacyPassword);
        if (mainSelectAllButton) mainSelectAllButton.addEventListener('click', toggleMainSelectAll);
        if (mainAddButton) mainAddButton.addEventListener('click', () => openMoveModal('main-add'));
        if (mainExportButton) {
            mainExportButton.addEventListener('click', () => {
                if (albumState.mainManageMode === 'albums') {
                    exportSelectedAlbumsZip();
                    return;
                }

                exportSelectedRecentPhotosZip();
            });
        }
        if (mainDeleteButton) {
            mainDeleteButton.addEventListener('click', () => {
                if (albumState.mainManageMode === 'albums') {
                    handleAlbumDelete();
                } else if (albumState.mainManageMode === 'recent') {
                    handleRecentDelete();
                }
            });
        }
        if (detailSelectAllButton) detailSelectAllButton.addEventListener('click', toggleDetailSelectAll);
        if (detailExportButton) detailExportButton.addEventListener('click', exportSelectedDetailPhotosZip);
        if (detailDeleteButton) detailDeleteButton.addEventListener('click', handleDetailDelete);
        if (detailMoveButton) detailMoveButton.addEventListener('click', openMoveModal);
        if (moveCancel) moveCancel.addEventListener('click', closeMoveModal);
        if (moveConfirm) moveConfirm.addEventListener('click', addSelectedRecentPhotosToAlbums);

        if (modal) {
            modal.addEventListener('click', event => {
                if (event.target === modal) closeCreateAlbumModal();
            });
        }

        if (moveModal) {
            moveModal.addEventListener('click', event => {
                if (event.target === moveModal) closeMoveModal();
            });
        }

        if (privacyActionModal) {
            privacyActionModal.addEventListener('click', event => {
                if (event.target === privacyActionModal) closeAlbumPrivacyActionModal();
            });
        }

        if (privacyPasswordModal) {
            privacyPasswordModal.addEventListener('click', event => {
                if (event.target === privacyPasswordModal) closeAlbumPrivacyPasswordModal();
            });
        }

        if (modalInput) {
            modalInput.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    saveNewAlbum();
                }
            });
        }

        if (privacyPasswordInput) {
            privacyPasswordInput.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    submitAlbumPrivacyPassword();
                }
            });
        }
    }

    function initAlbumApp() {
        const app = document.getElementById('album-app');
        if (!app || app.dataset.albumReady === '1') return;

        hydrateAlbumState();
        app.dataset.albumReady = '1';
        bindAlbumEvents();
        renderAlbumAppUi();
    }

    function reloadAlbumAppState() {
        hydrateAlbumState();
        renderAlbumAppUi();
    }

    window.initAlbumApp = initAlbumApp;
    window.reloadAlbumAppState = reloadAlbumAppState;
    window.closeAlbumApp = closeAlbumApp;
    window.savePhotoToAlbumLibrary = savePhotoToLibrary;
    window.getAlbumScreenShareSnapshot = getAlbumScreenShareSnapshot;

    window.appInitFunctions = window.appInitFunctions || [];
    window.appInitFunctions.push(initAlbumApp);
}());
