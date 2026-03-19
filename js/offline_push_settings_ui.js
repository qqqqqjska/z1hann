(function() {
    const STORAGE_KEY = 'offlinePushSyncSettings';

    function getDom() {
        return {
            enabledToggle: document.getElementById('offline-push-enabled-toggle'),
            apiBaseUrlInput: document.getElementById('offline-push-api-base-url'),
            userIdInput: document.getElementById('offline-push-user-id'),
            vapidInput: document.getElementById('offline-push-vapid-public-key'),
            disableLocalToggle: document.getElementById('offline-push-disable-local-toggle'),
            saveBtn: document.getElementById('offline-push-save-btn'),
            enableBtn: document.getElementById('offline-push-enable-btn'),
            syncBtn: document.getElementById('offline-push-sync-btn'),
            healthBtn: document.getElementById('offline-push-health-btn'),
            status: document.getElementById('offline-push-status')
        };
    }

    function safeText(value, fallback) {
        const text = typeof value === 'string' ? value.trim() : '';
        return text || (fallback || '');
    }

    function setStatus(text, type) {
        const dom = getDom();
        if (!dom.status) return;
        dom.status.textContent = text;
        dom.status.style.color = type === 'error' ? '#d93025' : (type === 'success' ? '#0f9d58' : '#666');
    }

    function readLocalBackup() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : null;
        } catch (err) {
            console.error('[offline-push-ui] readLocalBackup failed', err);
            return null;
        }
    }

    function writeLocalBackup(data) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {}));
        } catch (err) {
            console.error('[offline-push-ui] writeLocalBackup failed', err);
        }
    }

    function getStateObject() {
        if (window.offlinePushSync && typeof window.offlinePushSync.getState === 'function') {
            return window.offlinePushSync.getState();
        }
        window.iphoneSimState = window.iphoneSimState || {};
        window.iphoneSimState.offlinePushSync = window.iphoneSimState.offlinePushSync || {};
        return window.iphoneSimState.offlinePushSync;
    }

    function readForm() {
        const dom = getDom();
        return {
            enabled: !!(dom.enabledToggle && dom.enabledToggle.checked),
            apiBaseUrl: safeText(dom.apiBaseUrlInput && dom.apiBaseUrlInput.value),
            userId: safeText(dom.userIdInput && dom.userIdInput.value, 'default-user'),
            vapidPublicKey: safeText(dom.vapidInput && dom.vapidInput.value),
            disableLocalActiveReplyScheduler: !!(dom.disableLocalToggle && dom.disableLocalToggle.checked)
        };
    }

    function mergeState() {
        const state = getStateObject() || {};
        const backup = readLocalBackup() || {};

        return {
            enabled: typeof state.enabled === 'boolean' ? state.enabled : !!backup.enabled,
            apiBaseUrl: safeText(state.apiBaseUrl || backup.apiBaseUrl),
            userId: safeText(state.userId || backup.userId, 'default-user'),
            vapidPublicKey: safeText(state.vapidPublicKey || backup.vapidPublicKey),
            disableLocalActiveReplyScheduler: typeof state.disableLocalActiveReplyScheduler === 'boolean'
                ? state.disableLocalActiveReplyScheduler
                : !!backup.disableLocalActiveReplyScheduler,
            pushPermission: safeText(state.pushPermission || backup.pushPermission, window.Notification ? Notification.permission : 'unsupported')
        };
    }

    function syncMergedStateBack() {
        const state = getStateObject();
        const merged = mergeState();
        Object.assign(state, merged);
        writeLocalBackup(state);
        return state;
    }

    function writeFormFromState() {
        const dom = getDom();
        const merged = syncMergedStateBack();

        if (dom.enabledToggle) dom.enabledToggle.checked = !!merged.enabled;
        if (dom.apiBaseUrlInput) dom.apiBaseUrlInput.value = merged.apiBaseUrl || '';
        if (dom.userIdInput) dom.userIdInput.value = merged.userId || 'default-user';
        if (dom.vapidInput) dom.vapidInput.value = merged.vapidPublicKey || '';
        if (dom.disableLocalToggle) dom.disableLocalToggle.checked = !!merged.disableLocalActiveReplyScheduler;

        const backendText = merged.apiBaseUrl ? `Backend: ${merged.apiBaseUrl}` : 'Backend: not configured';
        setStatus(`Status: ${merged.enabled ? 'enabled' : 'disabled'}; Notification: ${merged.pushPermission}; ${backendText}`);
    }

    async function persistForm() {
        const state = getStateObject();
        const form = readForm();
        Object.assign(state, form);
        writeLocalBackup(state);

        try {
            if (typeof window.saveConfig === 'function') {
                await window.saveConfig();
            }
        } catch (err) {
            console.error('[offline-push-ui] saveConfig failed', err);
        }

        writeLocalBackup(state);
        writeFormFromState();
        return state;
    }

    async function handleEnable() {
        try {
            const form = await persistForm();
            if (!form.apiBaseUrl) {
                setStatus('Please fill in the backend URL first', 'error');
                return;
            }
            if (!form.userId) {
                setStatus('Please fill in the user ID first', 'error');
                return;
            }
            setStatus('Enabling offline sync and requesting notification permission...');
            await window.offlinePushSync.enableWithConfig(form);
            writeLocalBackup(getStateObject());
            writeFormFromState();
            setStatus('Offline sync is enabled on this device', 'success');
        } catch (err) {
            console.error(err);
            setStatus(`Enable failed: ${err.message || err}`, 'error');
        }
    }

    async function handleSync() {
        try {
            await persistForm();
            setStatus('Syncing offline messages...');
            const result = await window.offlinePushSync.syncMessages();
            const added = result && typeof result.added === 'number' ? result.added : 0;
            setStatus(`Sync complete: added ${added} messages`, 'success');
        } catch (err) {
            console.error(err);
            setStatus(`Sync failed: ${err.message || err}`, 'error');
        }
    }

    async function handleHealthCheck() {
        try {
            const form = await persistForm();
            if (!form.apiBaseUrl) {
                setStatus('Please fill in the backend URL first', 'error');
                return;
            }
            setStatus('Checking backend health...');
            const response = await fetch(`${form.apiBaseUrl.replace(/\/$/, '')}/health`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            setStatus(`Backend OK: ${data.ok ? 'healthy' : 'unexpected'}; time ${data.now || '-'}`, 'success');
        } catch (err) {
            console.error(err);
            setStatus(`Health check failed: ${err.message || err}`, 'error');
        }
    }

    function bindEvents() {
        const dom = getDom();
        if (dom.saveBtn) {
            dom.saveBtn.addEventListener('click', async () => {
                await persistForm();
                setStatus('Offline sync settings saved', 'success');
            });
        }
        if (dom.enableBtn) dom.enableBtn.addEventListener('click', handleEnable);
        if (dom.syncBtn) dom.syncBtn.addEventListener('click', handleSync);
        if (dom.healthBtn) dom.healthBtn.addEventListener('click', handleHealthCheck);
    }

    function installLateRehydrateHooks() {
        window.addEventListener('load', writeFormFromState);
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) writeFormFromState();
        });
    }

    function initOfflinePushSettingsUi() {
        writeFormFromState();
        bindEvents();
        installLateRehydrateHooks();

        setTimeout(writeFormFromState, 200);
        setTimeout(writeFormFromState, 800);
        setTimeout(writeFormFromState, 1600);
    }

    if (window.appInitFunctions) {
        window.appInitFunctions.push(initOfflinePushSettingsUi);
    }
})();
