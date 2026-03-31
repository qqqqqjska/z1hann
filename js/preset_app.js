(function () {
    const defaultRegexEntries = [
        {
            title: 'Extract Links',
            icon: 'ri-link',
            pattern: '/https?:\\/\\/[^\\s]+/g',
            template: '<a href="$&">$&</a>'
        },
        {
            title: 'Highlight Tags',
            icon: 'ri-hashtag',
            pattern: '/#\\w+/g',
            template: '<span class="tag">$&</span>'
        }

    ];

    const presetState = {
        data: [],
        currentIndex: 0,
        activeTab: 'preset',
        editContext: null,
        regexEditContext: null,
        initialized: false,
        restoring: false
    };

    const STORAGE_KEY = 'preset-app-state-v2';
    const LEGACY_STORAGE_KEY = 'preset-app-state-v1';
    const STATE_DB_NAME = 'preset-app-db';
    const STATE_STORE_NAME = 'preset_state';
    const STATE_RECORD_ID = 'main';
    const defaultPresetData = clonePresetData(presetState.data);
    let stateDbPromise = null;
    let pendingConfirmAction = null;
    let presetReadyPromise = null;

    function byId(id) {
        return document.getElementById(id);
    }

    function clonePresetItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map(function (item, index) {
            return {
                identifier: item?.identifier ? String(item.identifier) : undefined,
                en: String(item?.en ?? item?.name ?? ('Entry ' + (index + 1))),
                zh: String(item?.zh ?? item?.summary ?? item?.content ?? ''),
                icon: item?.icon || 'ri-text',
                active: item?.active !== false,
                content: typeof item?.content === 'string' ? item.content : undefined,
                summary: typeof item?.summary === 'string' ? item.summary : undefined,
                role: item?.role || undefined,
                systemPrompt: Boolean(item?.systemPrompt),
                marker: Boolean(item?.marker)
            };
        });
    }

    function createEntityId(prefix) {
        return String(prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
    }

    function buildRegexEntryId(index) {
        return 'regex-' + String(index + 1);
    }

    function buildRegexCategoryId(index) {
        return 'category-' + String(index + 1);
    }

    function uniqueStringList(values) {
        return Array.from(new Set((Array.isArray(values) ? values : []).map(function (value) {
            return String(value);
        }).filter(Boolean)));
    }

    function cloneRegexCategories(categories, allowedEntryIds) {
        if (!Array.isArray(categories)) {
            return [];
        }

        const allowedSet = new Set(Array.isArray(allowedEntryIds) ? allowedEntryIds.map(String) : []);

        return categories.map(function (category, index) {
            const regexEntryIds = uniqueStringList(category?.regexEntryIds).filter(function (entryId) {
                return !allowedSet.size || allowedSet.has(entryId);
            });

            return {
                id: String(category?.id || buildRegexCategoryId(index)),
                name: String(category?.name || ('Category ' + (index + 1))),
                regexEntryIds: regexEntryIds
            };
        }).filter(function (category) {
            return Boolean(String(category.name).trim());
        });
    }

    function clonePresetData(presets) {
        if (!Array.isArray(presets)) {
            return [];
        }

        const usedPresetUids = new Set();

        return presets.map(function (preset, index) {
            const displayId = String(preset?.id || buildPresetId(index));
            let uid = String(preset?.uid || '').trim();
            if (!uid) {
                uid = displayId;
            }
            if (!uid || usedPresetUids.has(uid)) {
                uid = createEntityId('preset');
            }
            usedPresetUids.add(uid);

            const regexEntries = cloneRegexEntries(preset?.regexEntries);
            const regexCategories = cloneRegexCategories(preset?.regexCategories, regexEntries.map(function (entry) {
                return entry.id;
            }));
            const activeRegexCategoryId = regexCategories.some(function (category) {
                return category.id === String(preset?.activeRegexCategoryId || '');
            }) ? String(preset.activeRegexCategoryId) : null;

            return {
                uid: uid,
                id: displayId,
                title: String(preset?.title || ('预设' + (index + 1))),
                items: clonePresetItems(preset?.items),
                regexEntries: regexEntries,
                regexCategories: regexCategories,
                activeRegexCategoryId: activeRegexCategoryId
            };
        });
    }

    function isRemovedBuiltinPreset(preset) {
        const builtinMap = {
            Creative: ['Artistic Freedom', 'Sensory Overlay', 'Poetic Tone', 'Abstract Logic'],
            Logic: ['Strict Syntax', 'Math Precision', 'Source Citation', 'Error Tracing'],
            Roleplay: ['Deep Memory', 'Persona Anchor', 'Emotion Engine', 'Unrestricted']
        };

        const expectedItems = builtinMap[String(preset?.title || '')];
        if (!expectedItems || !Array.isArray(preset?.items) || preset.items.length !== expectedItems.length) {
            return false;
        }

        return expectedItems.every(function (name, index) {
            return String(preset.items[index]?.en || '') === name;
        });
    }

    function stripRemovedBuiltinPresets(presets) {
        return clonePresetData(presets).filter(function (preset) {
            return !isRemovedBuiltinPreset(preset);
        });
    }


    function getStorage() {
        try {
            return window.localStorage;
        } catch (error) {
            return null;
        }
    }

    function createPersistedStatePayload() {
        const data = stripRemovedBuiltinPresets(presetState.data);
        const hasData = data.length > 0;

        return {
            data: data,
            currentIndex: hasData ? Math.min(Math.max(presetState.currentIndex, 0), data.length - 1) : 0,
            activeTab: presetState.activeTab === 'regex' ? 'regex' : 'preset'
        };
    }

    function applyPersistedState(payload) {
        const data = stripRemovedBuiltinPresets(payload?.data);
        presetState.data = data;
        presetState.currentIndex = data.length
            ? Math.min(Math.max(Number.isFinite(Number(payload?.currentIndex)) ? Number(payload.currentIndex) : 0, 0), data.length - 1)
            : 0;
        presetState.activeTab = payload?.activeTab === 'regex' ? 'regex' : 'preset';
    }

    function openStateDatabase() {
        if (stateDbPromise) {
            return stateDbPromise;
        }

        stateDbPromise = new Promise(function (resolve) {
            try {
                if (!window.indexedDB) {
                    resolve(null);
                    return;
                }

                const request = window.indexedDB.open(STATE_DB_NAME, 1);
                request.onupgradeneeded = function () {
                    const db = request.result;
                    if (!db.objectStoreNames.contains(STATE_STORE_NAME)) {
                        db.createObjectStore(STATE_STORE_NAME, { keyPath: 'id' });
                    }
                };
                request.onsuccess = function () {
                    const db = request.result;
                    db.onversionchange = function () {
                        db.close();
                    };
                    resolve(db);
                };
                request.onerror = function () {
                    resolve(null);
                };
            } catch (error) {
                resolve(null);
            }
        });

        return stateDbPromise;
    }

    function readStateFromIndexedDb() {
        return openStateDatabase().then(function (db) {
            if (!db) {
                return null;
            }

            return new Promise(function (resolve) {
                try {
                    const tx = db.transaction(STATE_STORE_NAME, 'readonly');
                    const request = tx.objectStore(STATE_STORE_NAME).get(STATE_RECORD_ID);
                    request.onsuccess = function () {
                        resolve(request.result || null);
                    };
                    request.onerror = function () {
                        resolve(null);
                    };
                } catch (error) {
                    resolve(null);
                }
            });
        });
    }

    function writeStateToIndexedDb(payload) {
        return openStateDatabase().then(function (db) {
            if (!db) {
                return false;
            }

            return new Promise(function (resolve) {
                try {
                    const tx = db.transaction(STATE_STORE_NAME, 'readwrite');
                    tx.objectStore(STATE_STORE_NAME).put({
                        id: STATE_RECORD_ID,
                        data: payload.data,
                        currentIndex: payload.currentIndex,
                        activeTab: payload.activeTab
                    });
                    tx.oncomplete = function () {
                        resolve(true);
                    };
                    tx.onerror = function () {
                        resolve(false);
                    };
                    tx.onabort = function () {
                        resolve(false);
                    };
                } catch (error) {
                    resolve(false);
                }
            });
        });
    }

    function persistState() {
        if (presetState.restoring) {
            return;
        }

        const payload = createPersistedStatePayload();
        writeStateToIndexedDb(payload);

        const storage = getStorage();
        if (storage) {
            try {
                storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(payload));
            } catch (error) {
            }
        }
    }

    function restoreState() {
        presetState.restoring = true;

        return readStateFromIndexedDb()
            .then(function (payload) {
                if (payload && Array.isArray(payload.data)) {
                    applyPersistedState(payload);
                    writeStateToIndexedDb(createPersistedStatePayload());
                    const storage = getStorage();
                    if (storage) {
                        try {
                            storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(createPersistedStatePayload()));
                        } catch (error) {
                        }
                    }
                    return;
                }

                const storage = getStorage();
                if (storage) {
                    try {
                        const raw = storage.getItem(LEGACY_STORAGE_KEY);
                        if (raw) {
                            const legacyPayload = JSON.parse(raw);
                            if (legacyPayload && Array.isArray(legacyPayload.data)) {
                                applyPersistedState(legacyPayload);
                                writeStateToIndexedDb(createPersistedStatePayload());
                                return;
                            }
                        }
                    } catch (error) {
                    }
                }

                applyPersistedState({
                    data: stripRemovedBuiltinPresets(defaultPresetData),
                    currentIndex: 0,
                    activeTab: 'preset'
                });
            })
            .catch(function () {
                applyPersistedState({
                    data: stripRemovedBuiltinPresets(defaultPresetData),
                    currentIndex: 0,
                    activeTab: 'preset'
                });
            })
            .finally(function () {
                presetState.restoring = false;
            });
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function hasOwnRegexField(entry, key) {
        return Boolean(entry) && Object.prototype.hasOwnProperty.call(entry, key);
    }

    function normalizeRegexStringList(list) {
        if (!Array.isArray(list)) {
            return [];
        }

        return list.map(function (value) {
            return String(value ?? '').trim();
        }).filter(Boolean);
    }

    function parseLegacyRegexTemplate(template) {
        const source = String(template ?? '').replace(/\r\n/g, '\n');
        let replacement = source;
        let trimStrings = [];
        const modes = [];

        const modeMatch = replacement.match(/(?:^|\n{2,})Mode:\s*([^\n]+)\s*$/i);
        if (modeMatch) {
            replacement = replacement.slice(0, modeMatch.index);
            modeMatch[1].split(/\s*(?:[\u00B7|]|\u8def)\s*/).forEach(function (item) {
                const value = String(item || '').trim().toLowerCase();
                if (value) {
                    modes.push(value);
                }
            });
        }

        const trimMatch = replacement.match(/(?:^|\n{2,})Trim:\s*([^\n]+)\s*$/i);
        if (trimMatch) {
            replacement = replacement.slice(0, trimMatch.index);
            trimStrings = trimMatch[1].split('|').map(function (item) {
                return String(item || '').trim();
            }).filter(Boolean);
        }

        return {
            replacement: replacement.trim(),
            trimStrings: trimStrings,
            promptOnly: modes.includes('prompt'),
            markdownOnly: modes.includes('markdown'),
            runOnEdit: modes.includes('edit'),
            disabled: modes.includes('disabled')
        };
    }

    function buildRegexTemplateString(entry) {
        const templateParts = [];
        const replaceString = String(entry?.replaceString ?? '');
        const trimStrings = normalizeRegexStringList(entry?.trimStrings);
        const modes = [];

        if (replaceString) {
            templateParts.push(replaceString);
        }

        if (trimStrings.length) {
            templateParts.push('Trim: ' + trimStrings.join(' | '));
        }

        if (entry?.promptOnly) {
            modes.push('Prompt');
        }

        if (entry?.markdownOnly) {
            modes.push('Markdown');
        }

        if (entry?.runOnEdit) {
            modes.push('Edit');
        }

        if (entry?.disabled) {
            modes.push('Disabled');
        }

        if (modes.length) {
            templateParts.push('Mode: ' + modes.join(' | '));
        }

        return templateParts.join('\n\n') || '';
    }

    function normalizeRegexEntry(entry, index) {
        const legacyTemplateMeta = parseLegacyRegexTemplate(entry?.template);
        const disabled = hasOwnRegexField(entry, 'disabled')
            ? Boolean(entry.disabled)
            : hasOwnRegexField(entry, 'active')
                ? !Boolean(entry.active)
                : hasOwnRegexField(entry, 'enabled')
                    ? !Boolean(entry.enabled)
                    : Boolean(legacyTemplateMeta.disabled);
        const replaceString = hasOwnRegexField(entry, 'replaceString')
            ? String(entry?.replaceString ?? '')
            : String(legacyTemplateMeta.replacement ?? '');
        const trimStrings = hasOwnRegexField(entry, 'trimStrings')
            ? normalizeRegexStringList(entry?.trimStrings)
            : legacyTemplateMeta.trimStrings;
        const promptOnly = hasOwnRegexField(entry, 'promptOnly')
            ? Boolean(entry?.promptOnly)
            : Boolean(legacyTemplateMeta.promptOnly);
        const markdownOnly = hasOwnRegexField(entry, 'markdownOnly')
            ? Boolean(entry?.markdownOnly)
            : Boolean(legacyTemplateMeta.markdownOnly);
        const runOnEdit = hasOwnRegexField(entry, 'runOnEdit')
            ? Boolean(entry?.runOnEdit)
            : Boolean(legacyTemplateMeta.runOnEdit);
        const substituteRegex = Boolean(entry?.substituteRegex);
        const placement = Array.isArray(entry?.placement) ? entry.placement.slice() : [];
        const icon = entry?.icon || inferRegexIcon({
            substituteRegex: substituteRegex,
            promptOnly: promptOnly,
            markdownOnly: markdownOnly
        });

        return {
            id: String(entry?.id ?? entry?.identifier ?? buildRegexEntryId(index)),
            title: String(entry?.title ?? entry?.scriptName ?? 'Untitled Regex'),
            icon: icon,
            pattern: String(entry?.pattern ?? entry?.findRegex ?? ''),
            template: String(entry?.template ?? buildRegexTemplateString({
                replaceString: replaceString,
                trimStrings: trimStrings,
                promptOnly: promptOnly,
                markdownOnly: markdownOnly,
                runOnEdit: runOnEdit,
                disabled: disabled
            })),
            replaceString: replaceString,
            trimStrings: trimStrings,
            promptOnly: promptOnly,
            markdownOnly: markdownOnly,
            runOnEdit: runOnEdit,
            substituteRegex: substituteRegex,
            placement: placement,
            minDepth: entry?.minDepth,
            maxDepth: entry?.maxDepth,
            disabled: disabled,
            active: !disabled
        };
    }

    function cloneRegexEntries(entries) {
        if (!Array.isArray(entries)) {
            return [];
        }

        return entries.map(function (entry, index) {
            return normalizeRegexEntry(entry, index);
        });
    }

    function buildPresetId(index) {
        return String(index + 1).padStart(2, '0');
    }

    function getNextPresetId() {
        return buildPresetId(presetState.data.length);
    }

    function getBaseName(fileName) {
        return String(fileName || 'Imported Preset').replace(/\.[^.]+$/, '').trim() || 'Imported Preset';
    }

    function getCurrentPreset() {
        return presetState.data[presetState.currentIndex] || null;
    }

    function syncCurrentRegexState(currentPreset) {
        if (!currentPreset) {
            return null;
        }

        currentPreset.regexEntries = cloneRegexEntries(currentPreset.regexEntries);
        currentPreset.regexCategories = cloneRegexCategories(currentPreset.regexCategories, currentPreset.regexEntries.map(function (entry) {
            return entry.id;
        }));

        if (!currentPreset.regexCategories.some(function (category) {
            return category.id === currentPreset.activeRegexCategoryId;
        })) {
            currentPreset.activeRegexCategoryId = null;
        }

        return currentPreset;
    }

    function getCurrentRegexEntries() {
        const currentPreset = syncCurrentRegexState(getCurrentPreset());
        if (!currentPreset) {
            return [];
        }

        return currentPreset.regexEntries;
    }

    function getCurrentRegexCategories() {
        const currentPreset = syncCurrentRegexState(getCurrentPreset());
        if (!currentPreset) {
            return [];
        }

        return currentPreset.regexCategories;
    }

    function getActiveRegexCategory() {
        const activeCategoryId = syncCurrentRegexState(getCurrentPreset())?.activeRegexCategoryId || null;
        if (!activeCategoryId) {
            return null;
        }

        return getCurrentRegexCategories().find(function (category) {
            return category.id === activeCategoryId;
        }) || null;
    }

    function getActiveRegexCategoryName() {
        const activeCategory = getActiveRegexCategory();
        return activeCategory ? activeCategory.name : 'All Regex';
    }

    function getVisibleRegexEntries() {
        const entries = getCurrentRegexEntries();
        const activeCategory = getActiveRegexCategory();

        if (!activeCategory) {
            return entries.map(function (entry, index) {
                return { entry: entry, index: index };
            });
        }

        const visibleIdSet = new Set(activeCategory.regexEntryIds || []);
        return entries.map(function (entry, index) {
            return { entry: entry, index: index };
        }).filter(function (item) {
            return visibleIdSet.has(item.entry.id);
        });
    }

    function getTextPreview(text, maxLength) {
        const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();
        if (!normalized) {
            return '';
        }

        if (normalized.length <= maxLength) {
            return normalized;
        }

        return normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd() + '…';
    }

    function getItemContent(item) {
        if (!item) {
            return '';
        }

        if (typeof item.content === 'string') {
            return item.content;
        }

        return String(item.zh ?? '');
    }

    function getItemSubtitle(item) {
        if (!item) {
            return '';
        }

        if (typeof item.summary === 'string' && item.summary.trim()) {
            return item.summary;
        }

        return String(item.zh ?? '');
    }

    function buildImportedItemSummary(item, contentOverride) {
        const meta = [];
        const content = typeof contentOverride === 'string' ? contentOverride : getItemContent(item);

        if (item?.role) {
            meta.push(String(item.role).toUpperCase());
        }

        if (item?.systemPrompt) {
            meta.push('SYS');
        }

        if (item?.marker) {
            meta.push('MARK');
        }

        const preview = getTextPreview(content, 54);
        if (meta.length && preview) {
            return meta.join(' · ') + ' · ' + preview;
        }

        return meta.join(' · ') || preview || 'Imported Entry';
    }

    function setItemContent(item, value) {
        if (!item) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(item, 'content') || Object.prototype.hasOwnProperty.call(item, 'summary')) {
            item.content = value;
            item.summary = buildImportedItemSummary(item, value);
            item.zh = item.summary;
            return;
        }

        item.zh = value;
    }

    function inferPromptIcon(prompt) {
        if (prompt?.system_prompt) {
            return 'ri-shield-star-line';
        }

        if (prompt?.role === 'assistant') {
            return 'ri-robot-2-line';
        }

        if (prompt?.role === 'user') {
            return 'ri-user-3-line';
        }

        if (prompt?.marker) {
            return 'ri-price-tag-3-line';
        }

        return 'ri-file-text-line';
    }

    function inferRegexIcon(script) {
        if (script?.substituteRegex) {
            return 'ri-magic-line';
        }

        if (script?.promptOnly) {
            return 'ri-chat-1-line';
        }

        if (script?.markdownOnly) {
            return 'ri-markdown-line';
        }

        return 'ri-braces-line';
    }

    function normalizeRegexEntries(rawEntries) {
        if (!Array.isArray(rawEntries)) {
            return [];
        }

        return rawEntries.map(function (entry, index) {
            return normalizeRegexEntry(entry, index);
        });
    }

    function parseRegexScripts(regexScripts) {
        if (!Array.isArray(regexScripts)) {
            return [];
        }

        return regexScripts.map(function (script, index) {
            return normalizeRegexEntry({
                id: script?.id ?? script?.identifier ?? buildRegexEntryId(index),
                title: script?.scriptName,
                icon: inferRegexIcon(script),
                pattern: script?.findRegex ?? '',
                replaceString: String(script?.replaceString ?? ''),
                trimStrings: normalizeRegexStringList(script?.trimStrings),
                promptOnly: Boolean(script?.promptOnly),
                markdownOnly: Boolean(script?.markdownOnly),
                runOnEdit: Boolean(script?.runOnEdit),
                substituteRegex: Boolean(script?.substituteRegex),
                placement: Array.isArray(script?.placement) ? script.placement.slice() : [],
                minDepth: script?.minDepth,
                maxDepth: script?.maxDepth,
                disabled: Boolean(script?.disabled)
            }, index);
        });
    }

    function normalizeLegacyItems(items) {
        if (!Array.isArray(items)) {
            return [];
        }

        return items.map(function (item, index) {
            return {
                en: String(item?.en ?? item?.name ?? `Entry ${index + 1}`),
                zh: String(item?.zh ?? item?.summary ?? item?.content ?? ''),
                icon: item?.icon || 'ri-text',
                active: item?.active !== false,
                content: typeof item?.content === 'string' ? item.content : undefined,
                summary: typeof item?.summary === 'string' ? item.summary : undefined,
                role: item?.role || undefined,
                systemPrompt: Boolean(item?.systemPrompt),
                marker: Boolean(item?.marker)
            };
        });
    }

    function parsePromptPreset(parsed, fileName) {
        const prompts = Array.isArray(parsed?.prompts) ? parsed.prompts : [];
        if (!prompts.length) {
            return null;
        }

        const promptMap = new Map();
        prompts.forEach(function (prompt) {
            promptMap.set(prompt.identifier, prompt);
        });

        const orderedRefs = Array.isArray(parsed?.prompt_order?.[0]?.order) ? parsed.prompt_order[0].order : [];
        const seen = new Set();
        const items = [];

        orderedRefs.forEach(function (orderItem) {
            const prompt = promptMap.get(orderItem.identifier);
            if (!prompt || seen.has(orderItem.identifier)) {
                return;
            }

            seen.add(orderItem.identifier);
            items.push({
                identifier: prompt.identifier,
                en: String(prompt.name || prompt.identifier || `Entry ${items.length + 1}`),
                zh: '',
                summary: '',
                content: String(prompt.content ?? ''),
                icon: inferPromptIcon(prompt),
                active: orderItem.enabled !== false && prompt.enabled !== false,
                role: prompt.role || '',
                systemPrompt: Boolean(prompt.system_prompt),
                marker: Boolean(prompt.marker)
            });
        });

        prompts.forEach(function (prompt) {
            if (seen.has(prompt.identifier)) {
                return;
            }

            items.push({
                identifier: prompt.identifier,
                en: String(prompt.name || prompt.identifier || `Entry ${items.length + 1}`),
                zh: '',
                summary: '',
                content: String(prompt.content ?? ''),
                icon: inferPromptIcon(prompt),
                active: prompt.enabled !== false,
                role: prompt.role || '',
                systemPrompt: Boolean(prompt.system_prompt),
                marker: Boolean(prompt.marker)
            });
        });

        items.forEach(function (item) {
            item.summary = buildImportedItemSummary(item, item.content);
            item.zh = item.summary;
        });

        const regexEntries = parseRegexScripts(parsed?.extensions?.regex_scripts);

        return {
            uid: createEntityId('preset'),
            id: buildPresetId(presetState.data.length),
            title: getBaseName(fileName),
            items: items,
            regexEntries: regexEntries,
            regexCategories: [],
            activeRegexCategoryId: null
        };
    }

    function normalizeLegacyPreset(parsed, fileName) {
        if (!parsed || !parsed.title || !Array.isArray(parsed.items)) {
            return null;
        }

        const regexEntries = normalizeRegexEntries(parsed.regexEntries || parsed.regex || parsed?.extensions?.regex_scripts);

        return {
            uid: parsed.uid || createEntityId('preset'),
            id: parsed.id || buildPresetId(presetState.data.length),
            title: String(parsed.title || getBaseName(fileName)),
            items: normalizeLegacyItems(parsed.items),
            regexEntries: regexEntries,
            regexCategories: cloneRegexCategories(parsed.regexCategories, regexEntries.map(function (entry) {
                return entry.id;
            })),
            activeRegexCategoryId: parsed.activeRegexCategoryId || null
        };
    }

    function parseImportedPreset(parsed, fileName) {
        const legacyPreset = normalizeLegacyPreset(parsed, fileName);
        if (legacyPreset) {
            return legacyPreset;
        }

        const promptPreset = parsePromptPreset(parsed, fileName);
        if (promptPreset) {
            return promptPreset;
        }

        return null;
    }

    function updateVolDisplays() {
        const displayValue = presetState.data.length ? String(presetState.currentIndex + 1) : '--';

        document.querySelectorAll('#preset-app .preset-vol-num-display').forEach(function (node) {
            node.textContent = displayValue;
        });

        const legacyVol = byId('preset-vol-num');
        if (legacyVol) {
            legacyVol.textContent = displayValue;
        }
    }

    function closeDropdown() {
        const carousel = byId('preset-carousel');
        if (carousel) {
            carousel.classList.remove('open');
        }
    }

    function closeConfirmDialog() {
        const overlay = byId('preset-confirm-overlay');
        const sheet = byId('preset-confirm-sheet');
        const kicker = byId('preset-confirm-kicker');
        const title = byId('preset-confirm-title');
        const copy = byId('preset-confirm-copy');
        const commitButton = byId('preset-confirm-commit');

        if (overlay) {
            overlay.classList.remove('active');
        }
        if (sheet) {
            sheet.classList.remove('active');
        }
        if (kicker) {
            kicker.textContent = 'Confirm';
        }
        if (title) {
            title.textContent = 'Are you sure?';
        }
        if (copy) {
            copy.textContent = 'This action cannot be undone.';
        }
        if (commitButton) {
            commitButton.textContent = 'Delete';
        }

        pendingConfirmAction = null;
    }

    function openConfirmDialog(options) {
        const overlay = byId('preset-confirm-overlay');
        const sheet = byId('preset-confirm-sheet');
        const kicker = byId('preset-confirm-kicker');
        const title = byId('preset-confirm-title');
        const copy = byId('preset-confirm-copy');
        const commitButton = byId('preset-confirm-commit');

        if (!overlay || !sheet || !title || !copy || !commitButton) {
            return;
        }

        pendingConfirmAction = typeof options?.onConfirm === 'function' ? options.onConfirm : null;
        if (kicker) {
            kicker.textContent = options?.kicker || 'Confirm';
        }
        title.textContent = options?.title || 'Are you sure?';
        copy.textContent = options?.copy || 'This action cannot be undone.';
        commitButton.textContent = options?.confirmLabel || 'Delete';

        overlay.classList.add('active');
        sheet.classList.add('active');
    }

    function commitConfirmDialog() {
        const action = pendingConfirmAction;
        closeConfirmDialog();
        if (typeof action === 'function') {
            action();
        }
    }

    function renderPresetEmptyState(listContent, title, copy) {
        if (!listContent) {
            return;
        }

        listContent.innerHTML = `
            <div class="preset-empty-state" style="animation: presetSlideUp 0.45s ease both;">
                <div class="preset-empty-title">${escapeHtml(title)}</div>
                <div class="preset-empty-copy">${escapeHtml(copy)}</div>
            </div>
        `;

        void listContent.offsetWidth;
        listContent.classList.add('show');
    }

    function renderPresetHeader() {
        const carousel = byId('preset-carousel');
        const dots = byId('preset-dots');
        const deletePresetButton = byId('preset-delete-preset-btn');
        const currentPreset = getCurrentPreset();

        if (!carousel || !dots) {
            return;
        }

        if (deletePresetButton) {
            deletePresetButton.disabled = !currentPreset;
        }

        carousel.classList.remove('open');

        if (!currentPreset) {
            carousel.innerHTML = `
                <div class="preset-trigger preset-trigger-empty">
                    <div class="preset-title-index">Preset Library</div>
                    <div class="preset-title-main-wrap">
                        <div class="preset-title-main">No Preset Yet</div>
                    </div>
                </div>
            `;
            dots.innerHTML = '';
            updateVolDisplays();
            return;
        }

        carousel.innerHTML = `
            <button type="button" class="preset-trigger" id="preset-trigger-btn">
                <div class="preset-title-index">No. ${escapeHtml(currentPreset.id || buildPresetId(presetState.currentIndex))}</div>
                <div class="preset-title-main-wrap">
                    <div class="preset-title-main">${escapeHtml(currentPreset.title)}</div>
                    <i class="ri-arrow-down-s-line preset-title-caret"></i>
                </div>
            </button>
            <div class="preset-dropdown">
                ${presetState.data.map(function (preset, index) {
                    return `
                        <button type="button" class="preset-option ${index === presetState.currentIndex ? 'active' : ''}" data-index="${index}">
                            <div class="preset-option-meta">
                                <div class="preset-option-index">No. ${escapeHtml(preset.id || buildPresetId(index))}</div>
                                <div class="preset-option-title">${escapeHtml(preset.title)}</div>
                            </div>
                            <i class="ri-check-line preset-option-check"></i>
                        </button>
                    `;
                }).join('')}
            </div>
        `;

        dots.innerHTML = presetState.data.map(function (_, index) {
            return `
                <button type="button" class="preset-dot ${index === presetState.currentIndex ? 'active' : ''}" data-index="${index}" aria-label="Select preset ${index + 1}"></button>
            `;
        }).join('');

        updateVolDisplays();

        const trigger = byId('preset-trigger-btn');
        if (trigger) {
            trigger.addEventListener('click', function (event) {
                event.stopPropagation();
                carousel.classList.toggle('open');
            });
        }

        carousel.querySelectorAll('.preset-option').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                closeDropdown();
                goToPreset(Number(button.dataset.index));
            });
        });

        dots.querySelectorAll('.preset-dot').forEach(function (button) {
            button.addEventListener('click', function () {
                goToPreset(Number(button.dataset.index));
            });
        });
    }

    function renderPresetList(index) {
        const listContent = byId('preset-list-content');
        const preset = presetState.data[index];

        if (!listContent) {
            return;
        }

        if (!preset) {
            renderPresetEmptyState(listContent, 'No Preset Yet', 'Use the top-right buttons to create a preset or import one from JSON.');
            return;
        }

        if (!Array.isArray(preset.items) || !preset.items.length) {
            renderPresetEmptyState(listContent, 'No Entries Yet', 'Create the first entry from the top-right add button to start building this preset.');
            return;
        }

        listContent.innerHTML = preset.items.map(function (item, itemIndex) {
            const itemDelay = Math.min(itemIndex * 0.03, 0.18);

            return `
                <div class="preset-list-item" style="animation: presetSlideUp 0.36s ${itemDelay}s both;">
                    <button type="button" class="preset-item-content" data-index="${itemIndex}">
                        <i class="${escapeHtml(item.icon || 'ri-text')} preset-item-icon"></i>
                        <div class="preset-item-text">
                            <div class="preset-item-en">${escapeHtml(item.en)}</div>
                            <div class="preset-item-zh">${escapeHtml(getItemSubtitle(item))}</div>
                        </div>
                    </button>
                    <button type="button" class="preset-toggle ${item.active ? 'active' : ''}" data-index="${itemIndex}" aria-label="切换参数"></button>
                </div>
            `;
        }).join('');

        void listContent.offsetWidth;
        listContent.classList.add('show');

        listContent.querySelectorAll('.preset-item-content').forEach(function (button) {
            button.addEventListener('click', function () {
                openEditor(Number(button.dataset.index));
            });
        });

        listContent.querySelectorAll('.preset-toggle').forEach(function (button) {
            button.addEventListener('click', function () {
                toggleItem(button, Number(button.dataset.index));
            });
        });

        listContent.querySelectorAll('.preset-list-item').forEach(function (itemNode) {
            itemNode.addEventListener('animationend', function handleAnimationEnd() {
                itemNode.style.animation = 'none';
            }, { once: true });
        });
    }

    function goToPreset(index) {
        if (index < 0 || index >= presetState.data.length) {
            return;
        }

        if (index === presetState.currentIndex) {
            renderPresetHeader();
            renderPresetList(index);
            if (presetState.activeTab === 'regex') {
                renderRegexGrid();
            }
            return;
        }

        presetState.currentIndex = index;
        persistState();
        const listContent = byId('preset-list-content');
        const content = byId('preset-app-content');

        if (content) {
            content.scrollTo({ top: 0, behavior: 'smooth' });
        }

        renderPresetHeader();

        if (navigator.vibrate) {
            navigator.vibrate(15);
        }

        if (listContent) {
            listContent.classList.remove('show');
        }

        if (presetState.activeTab === 'regex') {
            renderRegexGrid();
        }

        setTimeout(function () {
            renderPresetList(index);
        }, 180);
    }

    function toggleItem(button, itemIndex) {
        const item = getCurrentPreset()?.items?.[itemIndex];
        if (!button || !item) {
            return;
        }

        button.classList.toggle('active');
        item.active = button.classList.contains('active');
        persistState();

        if (navigator.vibrate) {
            navigator.vibrate([10, 20]);
        }

        const parent = button.closest('.preset-list-item');
        if (parent) {
            parent.style.background = 'rgba(0, 0, 0, 0.02)';
            setTimeout(function () {
                parent.style.background = 'transparent';
            }, 180);
        }
    }

    function setEditorMode(mode) {
        const title = byId('preset-editor-title');
        const inputEnLabel = byId('preset-input-en-label');
        const inputZhLabel = byId('preset-input-zh-label');
        const inputEn = byId('preset-input-en');
        const inputZh = byId('preset-input-zh');
        const definitionGroup = byId('preset-definition-group');
        const discardButton = byId('preset-discard-btn');
        const commitButton = byId('preset-commit-btn');

        const editorConfigs = {
            'item-edit': {
                title: 'Refine Parameter',
                inputEnLabel: 'Nomenclature',
                inputZhLabel: 'Definition',
                inputEnPlaceholder: 'Parameter Name',
                inputZhPlaceholder: 'Definition Content',
                commitLabel: 'Save',
                showDefinition: true
            },
            'item-create': {
                title: 'New Entry',
                inputEnLabel: 'Nomenclature',
                inputZhLabel: 'Definition',
                inputEnPlaceholder: 'Entry Name',
                inputZhPlaceholder: 'Definition Content',
                commitLabel: 'Add Entry',
                showDefinition: true
            },
            'preset-create': {
                title: 'New Preset',
                inputEnLabel: 'Preset Name',
                inputZhLabel: 'Definition',
                inputEnPlaceholder: 'Preset Title',
                inputZhPlaceholder: 'Definition Content',
                commitLabel: 'Create Preset',
                showDefinition: false
            }
        };

        const config = editorConfigs[mode] || editorConfigs['item-edit'];

        if (title) {
            title.textContent = config.title;
        }
        if (inputEnLabel) {
            inputEnLabel.textContent = config.inputEnLabel;
        }
        if (inputZhLabel) {
            inputZhLabel.textContent = config.inputZhLabel;
        }
        if (inputEn) {
            inputEn.placeholder = config.inputEnPlaceholder;
        }
        if (inputZh) {
            inputZh.placeholder = config.inputZhPlaceholder;
        }
        if (definitionGroup) {
            definitionGroup.classList.toggle('preset-form-group-hidden', !config.showDefinition);
        }
        if (discardButton) {
            discardButton.textContent = 'Cancel';
        }
        if (commitButton) {
            commitButton.textContent = config.commitLabel;
        }
    }

    function openEditorSheet() {
        const backdrop = byId('preset-sheet-backdrop');
        const sheet = byId('preset-editor-sheet');

        if (backdrop) {
            backdrop.classList.add('active');
        }

        if (sheet) {
            sheet.classList.add('active');
        }
    }

    function openPresetCreator() {
        const inputEn = byId('preset-input-en');
        const inputZh = byId('preset-input-zh');

        presetState.editContext = { type: 'preset-create' };
        setEditorMode('preset-create');

        if (inputEn) {
            inputEn.value = '';
            inputEn.focus();
        }
        if (inputZh) {
            inputZh.value = '';
        }

        openEditorSheet();
    }

    function openItemCreator() {
        const currentPreset = getCurrentPreset();
        const inputEn = byId('preset-input-en');
        const inputZh = byId('preset-input-zh');

        if (!currentPreset) {
            alert('Create or import a preset first.');
            return;
        }

        presetState.editContext = { type: 'item-create' };
        setEditorMode('item-create');

        if (inputEn) {
            inputEn.value = '';
            inputEn.focus();
        }
        if (inputZh) {
            inputZh.value = '';
        }

        openEditorSheet();
    }

    function openEditor(itemIndex) {
        const item = getCurrentPreset()?.items?.[itemIndex];
        if (!item) {
            return;
        }

        presetState.editContext = { type: 'item-edit', index: itemIndex };
        setEditorMode('item-edit');

        const inputEn = byId('preset-input-en');
        const inputZh = byId('preset-input-zh');

        if (inputEn) {
            inputEn.value = item.en || '';
        }

        if (inputZh) {
            inputZh.value = getItemContent(item);
        }

        openEditorSheet();
    }

    function closeEditor() {
        const inputEn = byId('preset-input-en');
        const inputZh = byId('preset-input-zh');
        const backdrop = byId('preset-sheet-backdrop');
        const sheet = byId('preset-editor-sheet');

        if (backdrop) {
            backdrop.classList.remove('active');
        }
        if (sheet) {
            sheet.classList.remove('active');
        }

        if (inputEn) {
            inputEn.value = '';
        }
        if (inputZh) {
            inputZh.value = '';
        }

        setEditorMode('item-edit');
        presetState.editContext = null;
    }

    function saveEditor() {
        const editorContext = presetState.editContext;
        if (!editorContext) {
            return;
        }

        const inputEn = byId('preset-input-en');
        const inputZh = byId('preset-input-zh');

        if (!inputEn || !inputZh) {
            return;
        }

        const enValue = inputEn.value.trim();
        const zhValue = inputZh.value.trim();

        if (editorContext.type === 'preset-create') {
            const newPreset = {
                uid: createEntityId('preset'),
                id: getNextPresetId(),
                title: enValue || ('Preset ' + (presetState.data.length + 1)),
                items: [],
                regexEntries: [],
                regexCategories: [],
                activeRegexCategoryId: null
            };

            presetState.data.push(newPreset);
            presetState.currentIndex = presetState.data.length - 1;
            persistState();
            closeEditor();
            setActiveTab('preset');
            renderPresetHeader();
            renderPresetList(presetState.currentIndex);
            renderRegexGrid();
            return;
        }

        if (editorContext.type === 'item-create') {
            const currentPreset = getCurrentPreset();
            if (!currentPreset) {
                return;
            }

            currentPreset.items.push({
                en: enValue || ('Entry ' + (currentPreset.items.length + 1)),
                zh: zhValue,
                icon: 'ri-text',
                active: true
            });

            persistState();
            closeEditor();
            renderPresetList(presetState.currentIndex);
            return;
        }

        const currentItem = getCurrentPreset()?.items?.[editorContext.index];
        if (!currentItem) {
            return;
        }

        if (enValue) {
            currentItem.en = enValue;
        }

        setItemContent(currentItem, zhValue);
        persistState();

        closeEditor();
        renderPresetList(presetState.currentIndex);
    }

    function importData(event) {
        const file = event?.target?.files?.[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function (loadEvent) {
            try {
                const parsed = JSON.parse(loadEvent.target.result);
                let importedPreset = parseImportedPreset(parsed, file.name);

                if (!importedPreset) {
                    alert('Invalid preset format.');
                    return;
                }

                if (!importedPreset.regexEntries?.length) {
                    importedPreset.regexEntries = [];
                }

                if (!importedPreset.regexCategories?.length) {
                    importedPreset.regexCategories = [];
                }

                if (!importedPreset.regexCategories.some(function (category) {
                    return category.id === importedPreset.activeRegexCategoryId;
                })) {
                    importedPreset.activeRegexCategoryId = null;
                }

                importedPreset = applyImportedRegexCategory(importedPreset);

                presetState.data.push(importedPreset);
                persistState();
                setActiveTab('preset');
                goToPreset(presetState.data.length - 1);
            } catch (error) {
                alert('Failed to parse preset JSON.');
            }
        };

        reader.readAsText(file);
        event.target.value = '';
    }

    function applyImportedRegexCategory(preset) {
        if (!preset) {
            return preset;
        }

        const regexEntries = cloneRegexEntries(preset.regexEntries);
        const presetTitle = String(preset.title || 'Imported Preset').trim() || 'Imported Preset';

        preset.regexEntries = regexEntries;

        if (!regexEntries.length) {
            preset.regexCategories = [];
            preset.activeRegexCategoryId = null;
            return preset;
        }

        const importedCategory = {
            id: createEntityId('regex-category'),
            name: presetTitle,
            regexEntryIds: regexEntries.map(function (entry) {
                return entry.id;
            })
        };

        preset.regexCategories = [importedCategory];
        preset.activeRegexCategoryId = importedCategory.id;
        return preset;
    }

    function closeRegexCategoryDropdown() {
        const switcher = byId('preset-regex-category-switcher');
        if (switcher) {
            switcher.classList.remove('open');
        }
    }

    function selectRegexCategory(categoryId) {
        const currentPreset = syncCurrentRegexState(getCurrentPreset());
        if (!currentPreset) {
            return;
        }

        currentPreset.activeRegexCategoryId = categoryId || null;
        persistState();
        closeRegexCategoryDropdown();
        renderRegexCategorySwitcher();
        renderRegexGrid();
    }

    function renderRegexCategorySwitcher() {
        const switcher = byId('preset-regex-category-switcher');
        const trigger = byId('preset-regex-category-trigger');
        const nameNode = byId('preset-regex-category-name');
        const dropdown = byId('preset-regex-category-dropdown');

        if (!switcher || !trigger || !nameNode || !dropdown) {
            return;
        }

        const currentPreset = syncCurrentRegexState(getCurrentPreset());
        if (!currentPreset) {
            nameNode.textContent = 'All Regex';
            dropdown.innerHTML = '';
            switcher.classList.remove('open');
            return;
        }

        const categories = getCurrentRegexCategories();
        const activeCategoryId = currentPreset.activeRegexCategoryId || null;
        const totalCount = getCurrentRegexEntries().length;

        nameNode.textContent = getActiveRegexCategoryName();
        dropdown.innerHTML = [
            `
                <button type="button" class="regex-category-option ${activeCategoryId ? '' : 'active'}" data-category-id="">
                    <div class="regex-category-option-meta">
                        <div class="regex-category-option-name">All Regex</div>
                        <div class="regex-category-option-count">${totalCount} item${totalCount === 1 ? '' : 's'}</div>
                    </div>
                    <i class="ri-check-line regex-category-option-check"></i>
                </button>
            `,
            categories.map(function (category) {
                const count = Array.isArray(category.regexEntryIds) ? category.regexEntryIds.length : 0;
                return `
                    <button type="button" class="regex-category-option ${category.id === activeCategoryId ? 'active' : ''}" data-category-id="${escapeHtml(category.id)}">
                        <div class="regex-category-option-meta">
                            <div class="regex-category-option-name">${escapeHtml(category.name)}</div>
                            <div class="regex-category-option-count">${count} item${count === 1 ? '' : 's'}</div>
                        </div>
                        <i class="ri-check-line regex-category-option-check"></i>
                    </button>
                `;
            }).join('')
        ].join('');

        trigger.onclick = function (event) {
            event.stopPropagation();
            switcher.classList.toggle('open');
        };

        dropdown.querySelectorAll('.regex-category-option').forEach(function (button) {
            button.onclick = function (event) {
                event.stopPropagation();
                selectRegexCategory(button.dataset.categoryId || null);
            };
        });
    }

    function renderRegexCategoryChecklist() {
        const list = byId('preset-regex-category-list');
        if (!list) {
            return;
        }

        const entries = getCurrentRegexEntries();
        if (!entries.length) {
            list.innerHTML = '<div class="regex-category-empty">No regex entries yet. You can still create an empty category now and add regex to it later.</div>';
            return;
        }

        list.innerHTML = entries.map(function (entry) {
            return `
                <label class="regex-category-checkbox">
                    <input type="checkbox" value="${escapeHtml(entry.id)}">
                    <div class="regex-category-checkbox-body">
                        <div class="regex-category-checkbox-title">${escapeHtml(entry.title)}</div>
                        <div class="regex-category-checkbox-meta">${escapeHtml(getTextPreview(entry.pattern, 88) || 'No pattern')}</div>
                    </div>
                </label>
            `;
        }).join('');
    }

    function openRegexCategorySheet() {
        const currentPreset = getCurrentPreset();
        const overlay = byId('preset-regex-category-overlay');
        const sheet = byId('preset-regex-category-sheet');
        const input = byId('preset-regex-category-input');

        if (!currentPreset) {
            alert('Create or import a preset first.');
            return;
        }

        closeRegexCategoryDropdown();
        closeRegexDrawer();
        renderRegexCategoryChecklist();

        if (input) {
            input.value = '';
        }
        if (overlay) {
            overlay.classList.add('active');
        }
        if (sheet) {
            sheet.classList.add('active');
        }
        if (input) {
            input.focus();
        }
    }

    function closeRegexCategorySheet() {
        const overlay = byId('preset-regex-category-overlay');
        const sheet = byId('preset-regex-category-sheet');
        const input = byId('preset-regex-category-input');
        const list = byId('preset-regex-category-list');

        if (overlay) {
            overlay.classList.remove('active');
        }
        if (sheet) {
            sheet.classList.remove('active');
        }
        if (input) {
            input.value = '';
        }
        if (list) {
            list.innerHTML = '';
        }
    }

    function saveRegexCategory() {
        const currentPreset = syncCurrentRegexState(getCurrentPreset());
        const input = byId('preset-regex-category-input');
        const list = byId('preset-regex-category-list');

        if (!currentPreset || !input || !list) {
            return;
        }

        const categories = getCurrentRegexCategories();
        const selectedIds = Array.from(list.querySelectorAll('input[type="checkbox"]:checked')).map(function (checkbox) {
            return checkbox.value;
        });
        const newCategory = {
            id: createEntityId('regex-category'),
            name: input.value.trim() || ('Category ' + (categories.length + 1)),
            regexEntryIds: uniqueStringList(selectedIds)
        };

        currentPreset.regexCategories.push(newCategory);
        currentPreset.activeRegexCategoryId = newCategory.id;

        persistState();
        renderRegexCategorySwitcher();
        renderRegexGrid();
        closeRegexCategorySheet();
    }

    function requestDeleteCurrentPreset() {
        const currentPreset = getCurrentPreset();
        if (!currentPreset) {
            return;
        }

        closeDropdown();
        closeRegexCategoryDropdown();

        openConfirmDialog({
            kicker: 'Delete Preset',
            title: 'Delete this preset?',
            copy: `预设“${currentPreset.title}”以及它包含的正则条目都会从应用中删除，删除后无法恢复。`,
            confirmLabel: 'Delete Preset',
            onConfirm: function () {
                deleteCurrentPreset();
            }
        });
    }

    function deleteCurrentPreset() {
        if (!presetState.data.length) {
            return;
        }

        presetState.data.splice(presetState.currentIndex, 1);
        if (presetState.currentIndex >= presetState.data.length) {
            presetState.currentIndex = Math.max(0, presetState.data.length - 1);
        }

        closeDropdown();
        closeEditor();
        closeRegexDrawer();
        closeRegexCategoryDropdown();
        closeRegexCategorySheet();

        persistState();
        renderPresetHeader();
        renderPresetList(presetState.currentIndex);
        renderRegexGrid();
    }

    function requestDeleteRegexEntry(index) {
        const entry = getCurrentRegexEntries()[index];
        if (!entry) {
            return;
        }

        openConfirmDialog({
            kicker: 'Delete Regex',
            title: 'Delete this regex?',
            copy: `Regex "${entry.title}" will be removed from this preset and from all of its categories. This cannot be undone.`,
            confirmLabel: 'Delete Regex',
            onConfirm: function () {
                deleteRegexEntry(index);
            }
        });
    }

    function deleteRegexEntry(index) {
        const currentPreset = syncCurrentRegexState(getCurrentPreset());
        if (!currentPreset) {
            return;
        }

        const entries = getCurrentRegexEntries();
        const entry = entries[index];
        if (!entry) {
            return;
        }

        currentPreset.regexEntries.splice(index, 1);
        currentPreset.regexCategories.forEach(function (category) {
            category.regexEntryIds = (Array.isArray(category.regexEntryIds) ? category.regexEntryIds : []).filter(function (entryId) {
                return entryId !== entry.id;
            });
        });

        persistState();
        renderRegexCategorySwitcher();
        renderRegexGrid();
    }

    function regexCardMarkup(entry, index) {
        return `
            <article class="regex-card" data-index="${index}" tabindex="0" role="button" aria-label="Edit regex ${escapeHtml(entry.title)}" style="animation: regexFadeInUp 0.45s ease both;">
                <div class="regex-card-top">
                    <div class="regex-card-title">${escapeHtml(entry.title)}</div>
                    <button type="button" class="regex-card-delete" data-index="${index}" aria-label="Delete regex ${escapeHtml(entry.title)}">
                        <i class="ri-delete-bin-6-line"></i>
                    </button>
                </div>

                <div class="regex-data-section">
                    <div class="regex-data-label"><i class="ri-code-s-slash-line"></i> Pattern</div>
                    <div class="regex-data-value">${escapeHtml(entry.pattern)}</div>
                </div>

                <div class="regex-card-divider"></div>

                <div class="regex-data-section">
                    <div class="regex-data-label"><i class="ri-html5-line"></i> Markup</div>
                    <div class="regex-data-value regex-data-value-clamped">${escapeHtml(entry.template)}</div>
                </div>
            </article>
        `;
    }

    function renderRegexGrid() {
        const grid = byId('preset-regex-grid');
        if (!grid) {
            return;
        }

        renderRegexCategorySwitcher();

        if (!getCurrentPreset()) {
            grid.innerHTML = `
                <article class="regex-card" style="animation: regexFadeInUp 0.45s ease both;">
                    <div class="regex-card-top">
                        <div class="regex-card-title">No Preset Selected</div>
                        <div class="regex-card-icon"><i class="ri-braces-line"></i></div>
                    </div>
                    <div class="regex-data-section">
                        <div class="regex-data-label"><i class="ri-information-line"></i> Status</div>
                        <div class="regex-data-value">Create or import a preset first, then add regex entries here.</div>
                    </div>
                </article>
            `;
            return;
        }

        const allEntries = getCurrentRegexEntries();
        const activeCategory = getActiveRegexCategory();
        const visibleEntries = getVisibleRegexEntries();

        if (!allEntries.length) {
            grid.innerHTML = `
                <article class="regex-card" style="animation: regexFadeInUp 0.45s ease both;">
                    <div class="regex-card-top">
                        <div class="regex-card-title">No Regex Yet</div>
                        <div class="regex-card-icon"><i class="ri-braces-line"></i></div>
                    </div>
                    <div class="regex-data-section">
                        <div class="regex-data-label"><i class="ri-information-line"></i> Status</div>
                        <div class="regex-data-value">当前预设还没有配套正则，点右上角 New 可以自己补一条。</div>
                    </div>
                </article>
            `;
            return;
        }

        if (!visibleEntries.length && activeCategory) {
            grid.innerHTML = `
                <article class="regex-card" style="animation: regexFadeInUp 0.45s ease both;">
                    <div class="regex-card-top">
                        <div class="regex-card-title">${escapeHtml(activeCategory.name)}</div>
                        <div class="regex-card-icon"><i class="ri-folder-open-line"></i></div>
                    </div>
                    <div class="regex-data-section">
                        <div class="regex-data-label"><i class="ri-information-line"></i> Status</div>
                        <div class="regex-data-value">This category is empty right now. Create another category or switch back to All Regex.</div>
                    </div>
                </article>
            `;
            return;
        }

        grid.innerHTML = visibleEntries.map(function (item) {
            return regexCardMarkup(item.entry, item.index);
        }).join('');

        grid.querySelectorAll('.regex-card[data-index]').forEach(function (card) {
            const index = Number(card.dataset.index);

            card.addEventListener('click', function () {
                openRegexDrawer(index);
            });

            card.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openRegexDrawer(index);
                }
            });
        });

        grid.querySelectorAll('.regex-card-delete').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                requestDeleteRegexEntry(Number(button.dataset.index));
            });
        });
    }

    function setRegexDrawerMode(mode) {
        const drawerTitle = byId('preset-regex-drawer-title');
        const submitButton = byId('preset-regex-add-entry');

        if (drawerTitle) {
            drawerTitle.textContent = mode === 'edit' ? 'Edit Regex' : 'Compose';
        }

        if (submitButton) {
            submitButton.textContent = mode === 'edit' ? 'Save Regex' : 'Append to Lexicon';
        }
    }

    function openRegexDrawer(index) {
        const currentPreset = getCurrentPreset();
        const drawer = byId('preset-regex-drawer');
        const overlay = byId('preset-regex-overlay');
        const titleInput = byId('preset-regex-title');
        const patternInput = byId('preset-regex-pattern');
        const templateInput = byId('preset-regex-template');

        if (!currentPreset) {
            alert('Create or import a preset first.');
            return;
        }

        closeRegexCategoryDropdown();
        closeRegexCategorySheet();

        if (titleInput && patternInput && templateInput && typeof index === 'number' && Number.isInteger(index)) {
            const entry = getCurrentRegexEntries()[index];
            if (entry) {
                presetState.regexEditContext = { index: index };
                setRegexDrawerMode('edit');
                titleInput.value = entry.title || '';
                patternInput.value = entry.pattern || '';
                templateInput.value = entry.template || '';
            } else {
                presetState.regexEditContext = null;
                setRegexDrawerMode('create');
                titleInput.value = '';
                patternInput.value = '';
                templateInput.value = '';
            }
        } else if (titleInput && patternInput && templateInput) {
            presetState.regexEditContext = null;
            setRegexDrawerMode('create');
            titleInput.value = '';
            patternInput.value = '';
            templateInput.value = '';
        }

        if (drawer) {
            drawer.classList.add('active');
        }
        if (overlay) {
            overlay.classList.add('active');
        }
    }

    function closeRegexDrawer() {
        const drawer = byId('preset-regex-drawer');
        const overlay = byId('preset-regex-overlay');
        const titleInput = byId('preset-regex-title');
        const patternInput = byId('preset-regex-pattern');
        const templateInput = byId('preset-regex-template');

        if (drawer) {
            drawer.classList.remove('active');
        }
        if (overlay) {
            overlay.classList.remove('active');
        }

        if (titleInput) {
            titleInput.value = '';
        }
        if (patternInput) {
            patternInput.value = '';
        }
        if (templateInput) {
            templateInput.value = '';
        }

        presetState.regexEditContext = null;
        setRegexDrawerMode('create');
    }

    function addRegexEntry() {
        const currentPreset = getCurrentPreset();
        const titleInput = byId('preset-regex-title');
        const patternInput = byId('preset-regex-pattern');
        const templateInput = byId('preset-regex-template');

        if (!currentPreset) {
            alert('Create or import a preset first.');
            return;
        }

        if (!titleInput || !patternInput || !templateInput) {
            return;
        }

        const entries = getCurrentRegexEntries();
        const activeCategory = getActiveRegexCategory();
        const editingIndex = presetState.regexEditContext?.index;
        const currentEntry = typeof editingIndex === 'number' ? entries[editingIndex] : null;

        const entry = {
            id: currentEntry?.id || createEntityId('regex'),
            title: titleInput.value.trim() || 'Untitled',
            icon: currentEntry?.icon || 'ri-function-line',
            pattern: patternInput.value.trim() || '/.../g',
            template: templateInput.value.trim() || '...'
        };

        if (currentEntry) {
            entries[editingIndex] = Object.assign({}, currentEntry, entry);
        } else {
            entries.unshift(entry);

            if (activeCategory && Array.isArray(activeCategory.regexEntryIds)) {
                activeCategory.regexEntryIds = uniqueStringList(activeCategory.regexEntryIds.concat(entry.id));
            }
        }

        persistState();
        renderRegexGrid();

        closeRegexDrawer();
    }

    function setActiveTab(tabName) {
        presetState.activeTab = tabName;
        persistState();

        document.querySelectorAll('#preset-app [data-tab-pane]').forEach(function (pane) {
            pane.classList.toggle('active', pane.dataset.tabPane === tabName);
        });

        document.querySelectorAll('#preset-app .preset-tab-item').forEach(function (button) {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });

        if (tabName !== 'preset') {
            closeDropdown();
            closeEditor();
        }

        if (tabName !== 'regex') {
            closeRegexDrawer();
            closeRegexCategoryDropdown();
            closeRegexCategorySheet();
        }

        closeConfirmDialog();

        if (tabName === 'regex') {
            renderRegexGrid();
        }

        if (tabName === 'preset') {
            const listContent = byId('preset-list-content');

            renderPresetHeader();

            if (listContent && listContent.children.length) {
                listContent.classList.remove('show');
                void listContent.offsetWidth;
                listContent.classList.add('show');
            } else {
                renderPresetList(presetState.currentIndex);
            }
        }
    }

    function openApp() {
        const screen = byId('preset-app');
        if (!screen) {
            return;
        }

        screen.classList.remove('hidden');
        renderPresetHeader();
        renderPresetList(presetState.currentIndex);
        renderRegexGrid();
        setActiveTab(presetState.activeTab);
    }

    function closeApp() {
        const screen = byId('preset-app');
        if (!screen) {
            return;
        }

        closeDropdown();
        closeEditor();
        closeRegexDrawer();
        closeRegexCategoryDropdown();
        closeRegexCategorySheet();
        closeConfirmDialog();
        screen.classList.add('hidden');
    }

    function handleDocumentClick(event) {
        const screen = byId('preset-app');
        const carousel = byId('preset-carousel');
        const categorySwitcher = byId('preset-regex-category-switcher');
        if (!screen || screen.classList.contains('hidden') || !carousel) {
            return;
        }

        if (!carousel.contains(event.target)) {
            closeDropdown();
        }

        if (categorySwitcher && !categorySwitcher.contains(event.target)) {
            closeRegexCategoryDropdown();
        }
    }

    function handleKeydown(event) {
        const screen = byId('preset-app');
        if (!screen || screen.classList.contains('hidden')) {
            return;
        }

        if (event.key === 'Escape') {
            const confirmSheet = byId('preset-confirm-sheet');
            const sheet = byId('preset-editor-sheet');
            const regexDrawer = byId('preset-regex-drawer');
            const regexCategorySheet = byId('preset-regex-category-sheet');
            const regexCategorySwitcher = byId('preset-regex-category-switcher');
            const carousel = byId('preset-carousel');

            if (confirmSheet && confirmSheet.classList.contains('active')) {
                closeConfirmDialog();
                return;
            }

            if (sheet && sheet.classList.contains('active')) {
                closeEditor();
                return;
            }

            if (regexDrawer && regexDrawer.classList.contains('active')) {
                closeRegexDrawer();
                return;
            }

            if (regexCategorySheet && regexCategorySheet.classList.contains('active')) {
                closeRegexCategorySheet();
                return;
            }

            if (regexCategorySwitcher && regexCategorySwitcher.classList.contains('open')) {
                closeRegexCategoryDropdown();
                return;
            }

            if (carousel && carousel.classList.contains('open')) {
                closeDropdown();
                return;
            }

            closeApp();
        }
    }

    function bindImport(buttonId, inputId) {
        const button = byId(buttonId);
        const input = byId(inputId);

        if (button && input) {
            button.addEventListener('click', function () {
                input.click();
            });
            input.addEventListener('change', importData);
        }
    }

    function init() {
        if (presetState.initialized) {
            return presetReadyPromise || Promise.resolve();
        }

        const screen = byId('preset-app');
        if (!screen) {
            return;
        }

        presetState.initialized = true;

        document.querySelectorAll('#preset-app .preset-exit-btn').forEach(function (button) {
            button.addEventListener('click', closeApp);
        });

        bindImport('close-preset-app', 'preset-import-input');

        const backdrop = byId('preset-sheet-backdrop');
        const addPresetButton = byId('preset-add-preset-btn');
        const addItemButton = byId('preset-add-item-btn');
        const deletePresetButton = byId('preset-delete-preset-btn');
        const discardButton = byId('preset-discard-btn');
        const commitButton = byId('preset-commit-btn');
        const confirmOverlay = byId('preset-confirm-overlay');
        const confirmCancelButton = byId('preset-confirm-cancel');
        const confirmCommitButton = byId('preset-confirm-commit');
        const regexOpenButton = byId('preset-regex-open-drawer');
        const regexOpenCategoryButton = byId('preset-regex-open-category');
        const regexHomeButton = byId('preset-regex-home');
        const regexCloseButton = byId('preset-regex-close-drawer');
        const regexOverlay = byId('preset-regex-overlay');
        const regexAddButton = byId('preset-regex-add-entry');
        const regexCategoryCloseButton = byId('preset-regex-category-close');
        const regexCategoryOverlay = byId('preset-regex-category-overlay');
        const regexCategorySaveButton = byId('preset-regex-category-save');

        if (backdrop) {
            backdrop.addEventListener('click', closeEditor);
        }
        if (addPresetButton) {
            addPresetButton.addEventListener('click', openPresetCreator);
        }
        if (addItemButton) {
            addItemButton.addEventListener('click', openItemCreator);
        }
        if (deletePresetButton) {
            deletePresetButton.addEventListener('click', requestDeleteCurrentPreset);
        }
        if (discardButton) {
            discardButton.addEventListener('click', closeEditor);
        }
        if (commitButton) {
            commitButton.addEventListener('click', saveEditor);
        }
        if (confirmOverlay) {
            confirmOverlay.addEventListener('click', closeConfirmDialog);
        }
        if (confirmCancelButton) {
            confirmCancelButton.addEventListener('click', closeConfirmDialog);
        }
        if (confirmCommitButton) {
            confirmCommitButton.addEventListener('click', commitConfirmDialog);
        }
        if (regexOpenButton) {
            regexOpenButton.addEventListener('click', function () {
                openRegexDrawer();
            });
        }
        if (regexOpenCategoryButton) {
            regexOpenCategoryButton.addEventListener('click', openRegexCategorySheet);
        }
        if (regexHomeButton) {
            regexHomeButton.addEventListener('click', closeApp);
        }
        if (regexCloseButton) {
            regexCloseButton.addEventListener('click', closeRegexDrawer);
        }
        if (regexOverlay) {
            regexOverlay.addEventListener('click', closeRegexDrawer);
        }
        if (regexAddButton) {
            regexAddButton.addEventListener('click', addRegexEntry);
        }
        if (regexCategoryCloseButton) {
            regexCategoryCloseButton.addEventListener('click', closeRegexCategorySheet);
        }
        if (regexCategoryOverlay) {
            regexCategoryOverlay.addEventListener('click', closeRegexCategorySheet);
        }
        if (regexCategorySaveButton) {
            regexCategorySaveButton.addEventListener('click', saveRegexCategory);
        }

        document.querySelectorAll('#preset-app .preset-tab-item').forEach(function (button) {
            button.addEventListener('click', function () {
                setActiveTab(button.dataset.tab);
            });
        });

        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('keydown', handleKeydown);

        presetReadyPromise = restoreState().finally(function () {
            renderPresetHeader();
            renderPresetList(presetState.currentIndex);
            renderRegexGrid();
            setActiveTab(presetState.activeTab);
        });

        return presetReadyPromise;
    }

    function getActivePresetPrompts() {
        const currentPreset = getCurrentPreset();
        if (!currentPreset || !Array.isArray(currentPreset.items)) {
            return [];
        }

        return currentPreset.items
            .filter(function (item) { return item.active; })
            .map(function (item) { return getItemContent(item); })
            .filter(function (content) { return Boolean(String(content).trim()); });
    }

    function getPresetContextString() {
        const activeItems = getActivePresetPrompts();
        if (activeItems.length === 0) {
            return '';
        }

        const currentPreset = getCurrentPreset();
        return `【当前启用的高级预设 (${currentPreset.title})】\n` + activeItems.map(function (content) {
            return `- ${content}`;
        }).join('\n');
    }

    function getPresets() {
        return clonePresetData(presetState.data);
    }

    function getPresetById(presetId) {
        if (!presetId) {
            return null;
        }

        const matchedByUid = presetState.data.find(function (preset) {
            return String(preset?.uid || '') === String(presetId);
        });

        const matchedPreset = matchedByUid || presetState.data.find(function (preset) {
            return String(preset?.id || '') === String(presetId);
        });

        if (!matchedPreset) {
            return null;
        }

        return clonePresetData([matchedPreset])[0] || null;
    }

    function getActivePresetItemsById(presetId) {
        const preset = getPresetById(presetId);
        if (!preset || !Array.isArray(preset.items)) {
            return [];
        }

        return preset.items.filter(function (item) {
            return item && item.active;
        }).map(function (item) {
            return Object.assign({}, item, {
                content: getItemContent(item),
                summary: getItemSubtitle(item)
            });
        });
    }

    function getRegexEntriesByPresetId(presetId) {
        const preset = getPresetById(presetId);
        return preset && Array.isArray(preset.regexEntries) ? cloneRegexEntries(preset.regexEntries) : [];
    }

    function getRegexCategoriesByPresetId(presetId) {
        const preset = getPresetById(presetId);
        return preset && Array.isArray(preset.regexCategories)
            ? cloneRegexCategories(preset.regexCategories, (preset.regexEntries || []).map(function (entry) {
                return entry.id;
            }))
            : [];
    }

    function upsertImportedRegexBundle(bundle) {
        const payload = bundle || {};
        const presetTitle = String(payload.presetTitle || payload.categoryName || 'Imported Preset').trim() || 'Imported Preset';
        const categoryName = String(payload.categoryName || presetTitle).trim() || presetTitle;
        const replaceExisting = payload.replaceExisting !== false;

        return Promise.resolve(presetReadyPromise || Promise.resolve()).then(function () {
            const sourceEntries = Array.isArray(payload.regexEntries) ? payload.regexEntries : [];
            const normalizedEntries = cloneRegexEntries(sourceEntries).map(function (entry) {
                return Object.assign({}, entry, {
                    id: createEntityId('regex')
                });
            });

            if (!normalizedEntries.length) {
                return {
                    presetId: null,
                    presetTitle: presetTitle,
                    categoryId: null,
                    categoryName: categoryName,
                    entryCount: 0
                };
            }

            let presetIndex = presetState.data.findIndex(function (preset) {
                return String(preset?.title || '').trim() === presetTitle;
            });

            if (presetIndex < 0) {
                presetState.data.push({
                    uid: createEntityId('preset'),
                    id: getNextPresetId(),
                    title: presetTitle,
                    items: [],
                    regexEntries: [],
                    regexCategories: [],
                    activeRegexCategoryId: null
                });
                presetIndex = presetState.data.length - 1;
            }

            const preset = presetState.data[presetIndex];
            preset.items = Array.isArray(preset.items) ? preset.items : [];
            preset.regexEntries = cloneRegexEntries(preset.regexEntries);
            preset.regexCategories = cloneRegexCategories(preset.regexCategories, preset.regexEntries.map(function (entry) {
                return entry.id;
            }));

            if (replaceExisting) {
                const existingCategory = preset.regexCategories.find(function (category) {
                    return String(category?.name || '').trim() === categoryName;
                });
                if (existingCategory) {
                    const removeIds = new Set(uniqueStringList(existingCategory.regexEntryIds));
                    preset.regexEntries = preset.regexEntries.filter(function (entry) {
                        return !removeIds.has(String(entry?.id || ''));
                    });
                    preset.regexCategories = preset.regexCategories
                        .filter(function (category) {
                            return category.id !== existingCategory.id;
                        })
                        .map(function (category) {
                            return Object.assign({}, category, {
                                regexEntryIds: uniqueStringList(category.regexEntryIds).filter(function (entryId) {
                                    return !removeIds.has(entryId);
                                })
                            });
                        });
                }
            }

            let category = null;
            if (normalizedEntries.length) {
                category = {
                    id: createEntityId('regex-category'),
                    name: categoryName,
                    regexEntryIds: normalizedEntries.map(function (entry) {
                        return entry.id;
                    })
                };
                preset.regexEntries = preset.regexEntries.concat(normalizedEntries);
                preset.regexCategories.push(category);
                preset.activeRegexCategoryId = category.id;
            }

            presetState.currentIndex = presetIndex;
            persistState();
            renderPresetHeader();
            renderPresetList(presetState.currentIndex);
            renderRegexGrid();
            setActiveTab(presetState.activeTab);

            return {
                presetId: preset.uid || preset.id,
                presetTitle: preset.title,
                categoryId: category ? category.id : null,
                categoryName: category ? category.name : categoryName,
                entryCount: normalizedEntries.length
            };
        });
    }

    window.PresetApp = {
        init: init,
        openApp: openApp,
        closeApp: closeApp,
        whenReady: function () {
            return presetReadyPromise || Promise.resolve();
        },
        isReady: function () {
            return !presetState.restoring;
        },
        getPresets: getPresets,
        getPresetById: getPresetById,
        getActivePresetItemsById: getActivePresetItemsById,
        getRegexEntriesByPresetId: getRegexEntriesByPresetId,
        getRegexCategoriesByPresetId: getRegexCategoriesByPresetId,
        upsertImportedRegexBundle: upsertImportedRegexBundle,
        getActivePresetPrompts: getActivePresetPrompts,
        getPresetContextString: getPresetContextString
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
