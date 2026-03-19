function createDefaultMemorySettingsV2() {
    return {
        extractMode: 'hybrid',
        injectQuota: {
            short_term: 2,
            long_term: 2,
            state: 2,
            refined: 1,
            maxTotal: 7
        },
        injectRecentDays: {
            short_term: 3,
            long_term: 30,
            state: 14,
            refined: 30
        },
        injectImportanceMin: {
            short_term: 0.5,
            long_term: 0.5,
            state: 0.5,
            refined: 0.5
        },
        stateTtlDays: {
            health: 7,
            exam: 14,
            travel: 10,
            emotion: 3,
            other: 7
        },
        dedupeThreshold: 0.75,
        stateExtractV2: {
            enabled: true,
            strategy: 'rule_plus_ai',
            debugConsole: true,
            thresholds: {
                accept: 0.78,
                borderline: 0.60,
                resolve: 0.72
            },
            ai: {
                timeoutMs: 4500,
                maxTokens: 180,
                temperature: 0.1
            }
        }
    };
}

function normalizeMemorySettingsV2(raw) {
    const defaults = createDefaultMemorySettingsV2();
    const src = raw && typeof raw === 'object' ? raw : {};
    const inject = src.injectQuota && typeof src.injectQuota === 'object' ? src.injectQuota : {};
    const recentDays = src.injectRecentDays && typeof src.injectRecentDays === 'object' ? src.injectRecentDays : {};
    const importanceMin = src.injectImportanceMin && typeof src.injectImportanceMin === 'object' ? src.injectImportanceMin : {};
    const ttl = src.stateTtlDays && typeof src.stateTtlDays === 'object' ? src.stateTtlDays : {};
    const stateExtract = src.stateExtractV2 && typeof src.stateExtractV2 === 'object' ? src.stateExtractV2 : {};
    const stateThresholds = stateExtract.thresholds && typeof stateExtract.thresholds === 'object'
        ? stateExtract.thresholds
        : {};
    const stateAi = stateExtract.ai && typeof stateExtract.ai === 'object' ? stateExtract.ai : {};

    const toInt = (value, fallback, min = 0, max = 100) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(min, Math.min(max, Math.floor(parsed)));
    };
    const toFloat = (value, fallback, min = 0, max = 1) => {
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return fallback;
        return Math.max(min, Math.min(max, parsed));
    };

    const normalized = {
        extractMode: ['hybrid', 'auto', 'manual'].includes(src.extractMode) ? src.extractMode : defaults.extractMode,
        injectQuota: {
            short_term: toInt(inject.short_term, defaults.injectQuota.short_term),
            long_term: toInt(inject.long_term, defaults.injectQuota.long_term),
            state: toInt(inject.state, defaults.injectQuota.state),
            refined: toInt(inject.refined, defaults.injectQuota.refined),
            maxTotal: toInt(inject.maxTotal, defaults.injectQuota.maxTotal, 1, 100)
        },
        injectRecentDays: {
            short_term: toInt(recentDays.short_term, defaults.injectRecentDays.short_term, 0, 3650),
            long_term: toInt(recentDays.long_term, defaults.injectRecentDays.long_term, 0, 3650),
            state: toInt(recentDays.state, defaults.injectRecentDays.state, 0, 3650),
            refined: toInt(recentDays.refined, defaults.injectRecentDays.refined, 0, 3650)
        },
        injectImportanceMin: {
            short_term: toFloat(importanceMin.short_term, defaults.injectImportanceMin.short_term, 0.1, 1),
            long_term: toFloat(importanceMin.long_term, defaults.injectImportanceMin.long_term, 0.1, 1),
            state: toFloat(importanceMin.state, defaults.injectImportanceMin.state, 0.1, 1),
            refined: toFloat(importanceMin.refined, defaults.injectImportanceMin.refined, 0.1, 1)
        },
        stateTtlDays: {
            health: toInt(ttl.health, defaults.stateTtlDays.health, 1, 365),
            exam: toInt(ttl.exam, defaults.stateTtlDays.exam, 1, 365),
            travel: toInt(ttl.travel, defaults.stateTtlDays.travel, 1, 365),
            emotion: toInt(ttl.emotion, defaults.stateTtlDays.emotion, 1, 365),
            other: toInt(ttl.other, defaults.stateTtlDays.other, 1, 365)
        },
        dedupeThreshold: toFloat(src.dedupeThreshold, defaults.dedupeThreshold, 0.3, 0.99),
        stateExtractV2: {
            enabled: stateExtract.enabled === undefined ? true : !!stateExtract.enabled,
            strategy: ['rule_plus_ai', 'rule_only'].includes(stateExtract.strategy)
                ? stateExtract.strategy
                : defaults.stateExtractV2.strategy,
            debugConsole: stateExtract.debugConsole === undefined ? defaults.stateExtractV2.debugConsole : !!stateExtract.debugConsole,
            thresholds: {
                accept: toFloat(stateThresholds.accept, defaults.stateExtractV2.thresholds.accept, 0.3, 0.99),
                borderline: toFloat(stateThresholds.borderline, defaults.stateExtractV2.thresholds.borderline, 0.3, 0.99),
                resolve: toFloat(stateThresholds.resolve, defaults.stateExtractV2.thresholds.resolve, 0.3, 0.99)
            },
            ai: {
                timeoutMs: toInt(stateAi.timeoutMs, defaults.stateExtractV2.ai.timeoutMs, 500, 15000),
                maxTokens: toInt(stateAi.maxTokens, defaults.stateExtractV2.ai.maxTokens, 60, 800),
                temperature: toFloat(stateAi.temperature, defaults.stateExtractV2.ai.temperature, 0, 1)
            }
        }
    };
    if (normalized.stateExtractV2.thresholds.borderline > normalized.stateExtractV2.thresholds.accept) {
        normalized.stateExtractV2.thresholds.borderline = normalized.stateExtractV2.thresholds.accept;
    }
    return normalized;
}

function inferStateReasonTypeFromText(text) {
    const normalized = String(text || '').toLowerCase();
    const raw = String(text || '');
    if (/(period|sick|ill|hospital|fever|health)/.test(normalized) || /[\u751f\u75c5\u53d1\u70e7\u611f\u5192\u7ecf\u671f\u751f\u7406\u671f\u4e0d\u9002\u533b\u9662\u8eab\u4f53]/.test(raw)) return 'health';
    if (/(exam|test|quiz|final|deadline|ddl)/.test(normalized) || /[\u8003\u8bd5\u671f\u672b\u590d\u4e60\u4f5c\u4e1a\u7b54\u8fa9]/.test(raw)) return 'exam';
    if (/(travel|trip|flight|train|away|business)/.test(normalized) || /[\u51fa\u5dee\u65c5\u884c\u65c5\u6e38\u5916\u5730\u822a\u73ed\u9ad8\u94c1]/.test(raw)) return 'travel';
    if (/(emo|anxious|sad|stress|panic|mood|emotion|happy)/.test(normalized) || /[\u96be\u8fc7\u7126\u8651\u5931\u843d\u538b\u529b\u5d29\u6e83\u5f00\u5fc3\u5174\u594b\u60c5\u7eea]/.test(raw)) return 'emotion';
    return 'other';
}

function normalizeStateOwnerValue(owner, fallback = 'user') {
    return owner === 'contact' ? 'contact' : fallback;
}

function inferStateOwnerFromText(text, fallback = 'user') {
    const value = String(text || '').trim();
    if (!value) return normalizeStateOwnerValue(fallback, 'user');
    if (/^(\u8054\u7cfb\u4eba|\u5bf9\u65b9)\u5f53\u524d\u72b6\u6001[:\uff1a]/.test(value)) return 'contact';
    if (/^(\u7528\u6237|\u6211)\u5f53\u524d\u72b6\u6001[:\uff1a]/.test(value)) return 'user';
    if (/^(\u4ed6|\u5979|\u5bf9\u65b9|\u8054\u7cfb\u4eba)(\u6700\u8fd1|\u8fd9\u51e0\u5929|\u76ee\u524d|\u672c\u5468|\u6b63\u5728|\u5728|\u521a)/.test(value)) return 'contact';
    if (/^(\u6211|\u6211\u8fd9\u8fb9|\u672c\u4eba|\u6700\u8fd1\u6211|\u8fd9\u51e0\u5929\u6211|\u76ee\u524d\u6211|\u672c\u5468\u6211)(\u6b63\u5728|\u5728|\u6700\u8fd1|\u8fd9\u51e0\u5929|\u76ee\u524d|\u672c\u5468|\u521a)?/.test(value)) return 'user';
    return normalizeStateOwnerValue(fallback, 'user');
}

function inferLegacyMemoryTags(memory) {
    if (!memory || typeof memory !== 'object') return ['long_term'];
    if (Array.isArray(memory.memoryTags) && memory.memoryTags.length > 0) return memory.memoryTags;
    const content = String(memory.content || '');
    if (content.indexOf('\u3010\u901a\u8bdd\u56de\u5fc6\u3011') === 0) return ['short_term'];
    return ['long_term'];
}

const DEFAULT_MEMORY_IMPORTANCE_BY_TAG = {
    short_term: 0.65,
    long_term: 0.7,
    state: 0.8,
    refined: 0.78
};

function normalizeMemoryImportanceValueCore(value, fallback = 0.7) {
    const parsed = Number(value);
    const safe = Number.isFinite(parsed) ? parsed : fallback;
    const clamped = Math.max(0.1, Math.min(1, safe));
    return Math.round(clamped * 100) / 100;
}

function getImportanceFallbackByTagsCore(tags) {
    const list = Array.isArray(tags) ? tags : [];
    if (list.includes('state')) return DEFAULT_MEMORY_IMPORTANCE_BY_TAG.state;
    if (list.includes('refined')) return DEFAULT_MEMORY_IMPORTANCE_BY_TAG.refined;
    if (list.includes('short_term')) return DEFAULT_MEMORY_IMPORTANCE_BY_TAG.short_term;
    return DEFAULT_MEMORY_IMPORTANCE_BY_TAG.long_term;
}

function normalizeMemoryTagsCore(tags, fallback = 'long_term') {
    const validTags = ['refined', 'short_term', 'long_term', 'state'];
    const safeFallback = validTags.includes(String(fallback || '').trim().toLowerCase())
        ? String(fallback || '').trim().toLowerCase()
        : 'long_term';
    const next = Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',') : []);
    const normalized = Array.from(new Set(
        next
            .map(tag => String(tag || '').trim().toLowerCase())
            .map(tag => tag === 'fact' ? 'long_term' : tag)
            .filter(tag => validTags.includes(tag))
    ));
    if (normalized.length === 0) normalized.push(safeFallback);
    return normalized;
}

function normalizeStateMeta(memory, settings) {
    const now = Date.now();
    const tags = Array.isArray(memory.memoryTags) ? memory.memoryTags : [];
    if (!tags.includes('state')) return false;

    const prevMeta = memory.stateMeta && typeof memory.stateMeta === 'object' ? memory.stateMeta : {};
    const stateOwner = normalizeStateOwnerValue(
        prevMeta.owner || memory.stateOwner || inferStateOwnerFromText(memory.content, 'user'),
        'user'
    );
    const reasonType = ['health', 'exam', 'travel', 'emotion', 'other'].includes(prevMeta.reasonType)
        ? prevMeta.reasonType
        : inferStateReasonTypeFromText(memory.content);
    const startAt = Number.isFinite(Number(prevMeta.startAt))
        ? Number(prevMeta.startAt)
        : (Number.isFinite(Number(memory.time)) ? Number(memory.time) : now);
    const resolvedAt = Number.isFinite(Number(prevMeta.resolvedAt)) ? Number(prevMeta.resolvedAt) : null;

    let phase = prevMeta.phase;
    if (!['active', 'resolved'].includes(phase)) {
        phase = 'active';
    }

    const nextMeta = {
        phase: phase,
        startAt: startAt,
        expiresAt: null,
        resolvedAt: resolvedAt,
        reasonType: reasonType,
        owner: stateOwner
    };

    const changed = JSON.stringify(prevMeta) !== JSON.stringify(nextMeta);
    memory.stateMeta = nextMeta;
    memory.stateOwner = stateOwner;
    return changed;
}

function migrateMemorySchemaV2() {
    let changed = false;
    if (!Array.isArray(state.memories)) {
        state.memories = [];
        changed = true;
    }
    if (!Array.isArray(state.memoryCandidates)) {
        state.memoryCandidates = [];
        changed = true;
    }

    const prevSettingsJson = JSON.stringify(state.memorySettingsV2 || {});
    state.memorySettingsV2 = normalizeMemorySettingsV2(state.memorySettingsV2);
    const settings = state.memorySettingsV2;
    if (JSON.stringify(settings) !== prevSettingsJson) changed = true;

    state.memories.forEach(memory => {
        if (!memory || typeof memory !== 'object') return;
        const nextTags = inferLegacyMemoryTags(memory);
        const normalizedTags = normalizeMemoryTagsCore(
            Array.isArray(memory.memoryTags) && memory.memoryTags.length > 0 ? memory.memoryTags : nextTags,
            nextTags.includes('short_term') ? 'short_term' : 'long_term'
        );
        if (
            !Array.isArray(memory.memoryTags) ||
            memory.memoryTags.length !== normalizedTags.length ||
            memory.memoryTags.some((tag, index) => tag !== normalizedTags[index])
        ) {
            memory.memoryTags = normalizedTags;
            changed = true;
        }
        const memoryImportanceFallback = getImportanceFallbackByTagsCore(memory.memoryTags);
        const normalizedImportance = normalizeMemoryImportanceValueCore(memory.importance, memoryImportanceFallback);
        if (!Number.isFinite(Number(memory.importance)) || Number(memory.importance) !== normalizedImportance) {
            memory.importance = normalizedImportance;
            changed = true;
        }
        if (memory.reviewStatus !== 'approved') {
            memory.reviewStatus = 'approved';
            changed = true;
        }
        if (!memory.source) {
            memory.source = 'auto_summary';
            changed = true;
        }
        if (!Number.isFinite(Number(memory.confidence))) {
            memory.confidence = 0.7;
            changed = true;
        }
        if (memory.factMeta) {
            delete memory.factMeta;
            changed = true;
        }
        if (normalizeStateMeta(memory, settings)) changed = true;
    });

    const existingByContact = {};
    state.memories.forEach(memory => {
        if (!memory || typeof memory !== 'object') return;
        const contactId = memory.contactId;
        if (!existingByContact[contactId]) existingByContact[contactId] = new Set();
        existingByContact[contactId].add(String(memory.content || '').trim());
    });

    const now = Date.now();
    (state.contacts || []).forEach(contact => {
        if (!contact || typeof contact !== 'object') return;
        const cid = contact.id;
        if (!existingByContact[cid]) existingByContact[cid] = new Set();

        if (Array.isArray(contact.importantStates)) {
            contact.importantStates.forEach(info => {
                const text = String(info || '').trim();
                if (!text || existingByContact[cid].has(text)) return;
                const stateMemory = {
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    contactId: cid,
                    content: text,
                    time: now,
                    memoryTags: ['state'],
                    source: 'ai_action',
                    confidence: 0.8,
                    importance: DEFAULT_MEMORY_IMPORTANCE_BY_TAG.state,
                    reviewStatus: 'approved',
                    stateMeta: {
                        phase: 'active',
                        startAt: now,
                        expiresAt: null,
                        resolvedAt: null,
                        reasonType: 'other',
                        owner: 'user'
                    },
                    stateOwner: 'user'
                };
                state.memories.push(stateMemory);
                existingByContact[cid].add(text);
                changed = true;
            });
        }

        if (Array.isArray(contact.userPerception)) {
            contact.userPerception.forEach(info => {
                const text = String(info || '').trim();
                if (!text || existingByContact[cid].has(text)) return;
                state.memories.push({
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    contactId: cid,
                    content: text,
                    time: now,
                    memoryTags: ['long_term'],
                    source: 'ai_action',
                    confidence: 0.8,
                    importance: DEFAULT_MEMORY_IMPORTANCE_BY_TAG.long_term,
                    reviewStatus: 'approved'
                });
                existingByContact[cid].add(text);
                changed = true;
            });
        }
    });

    state.memoryCandidates.forEach(candidate => {
        if (!candidate || typeof candidate !== 'object') return;
        const normalizedTags = normalizeMemoryTagsCore(candidate.suggestedTags, 'long_term');
        if (
            !Array.isArray(candidate.suggestedTags) ||
            candidate.suggestedTags.length !== normalizedTags.length ||
            candidate.suggestedTags.some((tag, index) => tag !== normalizedTags[index])
        ) {
            candidate.suggestedTags = normalizedTags;
            changed = true;
        }
        const candidateImportanceFallback = getImportanceFallbackByTagsCore(candidate.suggestedTags);
        const normalizedCandidateImportance = normalizeMemoryImportanceValueCore(candidate.importance, candidateImportanceFallback);
        if (!Number.isFinite(Number(candidate.importance)) || Number(candidate.importance) !== normalizedCandidateImportance) {
            candidate.importance = normalizedCandidateImportance;
            changed = true;
        }
        if (!['pending', 'approved', 'rejected'].includes(candidate.status)) {
            candidate.status = 'pending';
            changed = true;
        }
        if (!Number.isFinite(Number(candidate.confidence))) {
            candidate.confidence = 0.7;
            changed = true;
        }
        if (candidate.factMeta) {
            delete candidate.factMeta;
            changed = true;
        }
        const tags = Array.isArray(candidate.suggestedTags) ? candidate.suggestedTags : [];
        if (tags.includes('state')) {
            const owner = normalizeStateOwnerValue(
                (candidate.stateMeta && candidate.stateMeta.owner) || candidate.stateOwner || inferStateOwnerFromText(candidate.content, 'user'),
                'user'
            );
            if (candidate.stateOwner !== owner) {
                candidate.stateOwner = owner;
                changed = true;
            }
            if (!candidate.stateMeta || typeof candidate.stateMeta !== 'object') {
                candidate.stateMeta = {
                    phase: 'active',
                    startAt: now,
                    expiresAt: null,
                    resolvedAt: null,
                    reasonType: inferStateReasonTypeFromText(candidate.content),
                    owner
                };
                changed = true;
            } else if (candidate.stateMeta.owner !== owner) {
                candidate.stateMeta.owner = owner;
                changed = true;
            }
        }
    });

    return changed;
}

window.createDefaultMemorySettingsV2 = createDefaultMemorySettingsV2;
window.migrateMemorySchemaV2 = migrateMemorySchemaV2;

const state = {
    amapSettings: {
        key: '',
        securityCode: ''
    },
    amapRuntime: {
        myLocation: null,
        lastWeather: {},
        lastResolvedContacts: {},
        lastRoutes: {}
    },
    fonts: [],
    wallpapers: [],
    icons: {},
    iconColors: {}, // { appId: '#ffffff' }
    appNames: {}, // { appId: 'Custom Name' }
    iconPresets: [], // { name, icons, iconColors, appNames }
    showStatusBar: true,
    css: '',
    currentFont: 'default',
    currentMeetingFont: 'default',
    currentWallpaper: null,
    fontPresets: [],
    cssPresets: [],
    meetingCss: '',
    meetingCssPresets: [],
    meetingIcons: {
        edit: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTk5OTk5IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTExIDRINFYyMmgxNFYxMSIvPjxwYXRoIGQ9Ik0xOC41IDIuNWEyLjEyMSAyLjEyMSAwIDAgMSAzIDNMMTIgMTVIOHYtNGw5LjUtOS41eiIvPjwvc3ZnPg==',
        delete: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBvbHlsaW5lIHBvaW50cz0iMyA2IDUgNiAyMSA2Ii8+PHBhdGggZD0iTTE5IDZ2MTRhMiAyIDAgMCAxLTIgMkg3YTIgMiAwIDAgMS0yLTJWNm0zIDBUNGEyIDIgMCAwIDEgMi0yaDRhMiAyIDAgMCAxIDIgMnYyIi8+PGxpbmUgeDE9IjEwIiB5MT0iMTEiIHgyPSIxMCIgeTI9IjE3Ii8+PGxpbmUgeDE9IjE0IiB5MT0iMTEiIHgyPSIxNCIgeTI9IjE3Ii8+PC9zdmc+',
        end: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkYzQjMwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTkgMjFIMWMtMS4xIDAtMi0uOS0yLTJWMWMwLTEuMS45LTIgMi0yaDhNMjEgMTJsLTUtNW01IDVsLTUgNW01LTVoLTEzIi8+PC9zdmc+',
        continue: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE1IDRWMiIvPjxwYXRoIGQ9Ik0xNSAxNnYtMiIvPjxwYXRoIGQ9Ik04IDloMiIvPjxwYXRoIGQ9Ik0yMCA5aDIiLz48cGF0aCBkPSJNMTcuOCAxMS44TDE5IDEzIi8+PHBhdGggZD0iTTEwLjYgNi42TDEyIDgiLz48cGF0aCBkPSJNNC44IDExLjhMNiAxMyIvPjxwYXRoIGQ9Ik0xMiA0LjhMMTAuNiA2Ii8+PHBhdGggZD0iTTE5IDQuOEwxNy44IDYiLz48cGF0aCBkPSJNMTIgMTMuMkw0LjggMjAuNGEyLjggMi44IDAgMCAwIDQgNEwxNiAxNy4yIi8+PC9zdmc+'
    },
    aiSettings: {
        url: '',
        key: '',
        model: '',
        temperature: 0.7
    },
    aiPresets: [],
    aiSettings2: {
        url: '',
        key: '',
        model: '',
        temperature: 0.7
        
    },
    aiPresets2: [],
    whisperSettings: {
        url: '',
        key: '',
        model: 'whisper-1'
    },
    minimaxSettings: {
        url: 'https://api.minimax.chat/v1/t2a_v2',
        key: '',
        groupId: '',
        model: 'speech-01-turbo'
    },
    novelaiSettings: {
        url: 'https://api.novelai.net',
        key: '',
        model: 'nai-diffusion-3',
        size: '832x1216',
        steps: 28,
        cfg: 5,
        sampler: 'k_euler_ancestral',
        seed: -1,
        ucPreset: 0,
        addQualityTags: true,
        smea: false,
        smeaDyn: false,
        defaultPrompt: '((full body shot:1.6)), (solo character:1.5), dynamic pose, 1boy, ((manly))',
        negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
        corsProxy: 'corsproxy.io'
    },
    chatWallpapers: [], // { id, data }
    tempSelectedChatBg: null,
    tempSelectedGroup: null,
    contacts: [], // { id, name, remark, avatar, persona, style, myAvatar, chatBg, group }
    contactGroups: [],
    currentChatContactId: null,
    chatHistory: {}, // { contactId: [{ role: 'user'|'assistant', content: '...' }] }
    itineraries: {}, // { contactId: { generatedDate: 'YYYY-MM-DD', events: [] } }
    meetings: {}, // { contactId: [{ id, time, title, content: [{role, text}], style, linkedWorldbooks }] }
    currentMeetingId: null,
    worldbook: [], // { id, categoryId, keys: [], content: '', enabled: true, remark: '' }
    wbCategories: [], // { id, name, desc }
    currentWbCategoryId: null,
    userPersonas: [], // { id, title, aiPrompt, name }
    currentUserPersonaId: null,
    userProfile: {
        name: 'User Name',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        bgImage: '',
        momentsBgImage: '',
        desc: 'Click to edit signature',
        wxid: 'wxid_123456'
    },
    moments: [], // { id, contactId, content, images: [], time, likes: [], comments: [] }
    memories: [], // { id, contactId, content, time, memoryTags, stateMeta, ... }
    memoryCandidates: [], // { id, contactId, content, suggestedTags, status, ... }
    memorySettingsV2: createDefaultMemorySettingsV2(),
    defaultVirtualImageUrl: '',
    defaultMomentVirtualImageUrl: '',
    wallet: {
        balance: 0.00,
        transactions: [] // { id, type: 'income'|'expense', amount, title, time, relatedId }
    },
    bankApp: {
        initialized: false,
        cashBalance: 0.00,
        transactions: [],
        familyCardUsage: {},
        familyCardUsageMonthKey: '',
        unboundFamilyCards: []
    },
    calendarApp: {
        selectedDate: '',
        visibleMonth: '',
        events: [],
        schedule: {
            termName: '',
            termStartDate: '',
            courses: []
        }
    },
    music: {
        playing: false,
        cover: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
        backButtonImage: '',
        src: '',
        title: 'Happy Together',
        artist: 'Maximillian',
        lyricsData: [
            { time: 0, text: "So fast, I almost missed it" },
            { time: 3, text: "I spill another glass of wine" },
            { time: 6, text: "Kill the lights to pass the time" }
        ],
        lyricsFile: '',
        widgetBg: '',
        playlist: [], // { id, title, artist, src, lyricsData, lyricsFile }
        currentSongId: null
    },
    polaroid: {
        img1: 'https://placehold.co/300x300/eee/999?text=Photo',
        text1: 'Rainy day mood',
        img2: 'https://placehold.co/300x300/eee/999?text=Photo',
        text2: 'Good memory'
    },
    icityProfile: {
        avatar: '',
        bgImage: ''
    },
    icityDiaries: [], // { id, content, visibility, time, likes, comments }
    icityFriendsPosts: [], // { id, contactId, content, time, visibility, likes, comments }
    stickerCategories: [], // { id, name, list: [{ url, desc }] }
    currentStickerCategoryId: 'all',
    isStickerManageMode: false,
    selectedStickers: new Set(),
    replyingToMsg: null,
    wechatFriendRequests: [], // { id, name, avatar, reason, status: 'pending'|'accepted'|'rejected', icityContext: {} }
    isMultiSelectMode: false,
    selectedMessages: new Set(),
    enableSystemNotifications: false,
    enableBackgroundAudio: false,
    shoppingProducts: [],
    albumData: null
};

window.iphoneSimState = state;

function normalizeAutoPostTextValue(text) {
    return String(text || '')
        .replace(/\r\n/g, '\n')
        .replace(/\u00A0/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\s*\n\s*/g, '\n')
        .trim();
}

function normalizeMomentImagesForFingerprint(images) {
    if (!Array.isArray(images) || images.length === 0) return '';
    return images.map(img => {
        if (typeof img === 'string') return img.trim();
        if (img && typeof img === 'object') {
            return String(img.src || img.url || img.description || img.desc || '').trim();
        }
        return '';
    }).filter(Boolean).join('|');
}

function cleanMomentImageDescription(text) {
    return String(text || '')
        .replace(/^\[图片描述\]\s*[:：]?\s*/i, '')
        .replace(/^图片描述\s*[:：]\s*/i, '')
        .trim();
}

function createVirtualMomentImage(desc) {
    const cleanDesc = cleanMomentImageDescription(desc);
    if (!cleanDesc) return null;
    const bg = 'eee';
    const fg = '333';
    const text = encodeURIComponent(cleanDesc.substring(0, 6));
    return {
        src: `https://placehold.co/600x600/${bg}/${fg}?text=${text}`,
        desc: cleanDesc,
        isVirtual: true
    };
}

function normalizeMomentImageEntry(image) {
    if (!image) return null;
    if (typeof image === 'string') {
        const trimmed = image.trim();
        if (!trimmed) return null;
        if (/^(data:image|https?:\/\/)/i.test(trimmed)) {
            return trimmed;
        }
        return createVirtualMomentImage(trimmed);
    }
    if (typeof image !== 'object') return null;

    const src = String(image.src || image.url || '').trim();
    const desc = cleanMomentImageDescription(image.desc || image.description || '');
    const isVirtual = image.isVirtual === true || (!src && !!desc);

    if (isVirtual) {
        const virtualImage = createVirtualMomentImage(desc);
        if (!virtualImage) return null;
        if (src) virtualImage.src = src;
        return virtualImage;
    }

    if (src) {
        return {
            ...image,
            src,
            desc,
            isVirtual: false
        };
    }

    if (desc) {
        return createVirtualMomentImage(desc);
    }

    return null;
}

function parseMomentPayload(payload) {
    let content = '';
    let images = [];

    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
        content = String(payload.content || payload.text || '').trim();
        if (Array.isArray(payload.images)) {
            images = payload.images
                .map(normalizeMomentImageEntry)
                .filter(Boolean)
                .slice(0, 9);
        }
        return { content, images };
    }

    const raw = String(payload || '').trim();
    if (!raw) return { content: '', images: [] };

    const descRegex = /\[图片描述\s*[:：]\s*([^[\]]+?)\]/g;
    let remainingText = raw;
    let match;
    while ((match = descRegex.exec(raw)) !== null) {
        const virtualImage = createVirtualMomentImage(match[1]);
        if (virtualImage) images.push(virtualImage);
    }
    remainingText = remainingText.replace(descRegex, ' ');
    content = normalizeAutoPostTextValue(remainingText).trim();

    return {
        content,
        images: images.slice(0, 9)
    };
}

function formatMomentSummary(moment) {
    if (!moment) return '';
    const content = normalizeAutoPostTextValue(moment.content || '');
    const imageTags = Array.isArray(moment.images)
        ? moment.images.map(img => {
            if (typeof img === 'string') return '';
            if (!img || typeof img !== 'object') return '';
            const cleanDesc = cleanMomentImageDescription(img.desc || img.description || '');
            return cleanDesc ? `[图片描述: ${cleanDesc}]` : '';
        }).filter(Boolean)
        : [];

    return [content, imageTags.join(' ')].filter(Boolean).join(' ').trim();
}

function getMomentFingerprint(moment) {
    if (!moment || String(moment.contactId || '') === 'me') return '';
    const contactId = String(moment.contactId || '').trim();
    const contentKey = normalizeAutoPostTextValue(moment.content);
    const imageKey = normalizeMomentImagesForFingerprint(moment.images);
    if (!contactId || (!contentKey && !imageKey)) return '';
    return `moment::${contactId}::${contentKey}::${imageKey}`;
}

function getIcityFriendPostFingerprint(post) {
    if (!post) return '';
    const ownerKey = String(post.contactId || post.handle || post.name || '').trim();
    const contentKey = normalizeAutoPostTextValue(post.content);
    if (!ownerKey || !contentKey) return '';
    return `icity::${ownerKey}::${contentKey}`;
}

function dedupeCollectionByFingerprint(items, getFingerprint) {
    if (!Array.isArray(items) || typeof getFingerprint !== 'function') {
        return { changed: false, items: Array.isArray(items) ? items.slice() : [] };
    }

    const seen = new Set();
    const deduped = [];
    let changed = false;

    // Walk from old to new so we keep the earliest/original post and drop later duplicates.
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const fingerprint = getFingerprint(item);
        if (fingerprint && seen.has(fingerprint)) {
            changed = true;
            continue;
        }
        if (fingerprint) seen.add(fingerprint);
        deduped.unshift(item);
    }

    if (deduped.length !== items.length) changed = true;
    return { changed, items: deduped };
}

function sanitizeAutoGeneratedSocialContent() {
    let changed = false;

    if (Array.isArray(state.moments)) {
        const dedupedMoments = dedupeCollectionByFingerprint(state.moments, getMomentFingerprint);
        if (dedupedMoments.changed) {
            state.moments = dedupedMoments.items;
            changed = true;
        }
    }

    if (Array.isArray(state.icityFriendsPosts)) {
        const dedupedIcityPosts = dedupeCollectionByFingerprint(state.icityFriendsPosts, getIcityFriendPostFingerprint);
        if (dedupedIcityPosts.changed) {
            state.icityFriendsPosts = dedupedIcityPosts.items;
            changed = true;
        }
    }

    return changed;
}

window.normalizeAutoPostTextValue = normalizeAutoPostTextValue;
window.cleanMomentImageDescription = cleanMomentImageDescription;
window.createVirtualMomentImage = createVirtualMomentImage;
window.parseMomentPayload = parseMomentPayload;
window.formatMomentSummary = formatMomentSummary;
window.getMomentFingerprint = getMomentFingerprint;
window.getIcityFriendPostFingerprint = getIcityFriendPostFingerprint;
window.sanitizeAutoGeneratedSocialContent = sanitizeAutoGeneratedSocialContent;

window.appInitFunctions = [];

let currentEditingChatMsgId = null;

const knownApps = {
    'wechat-app': { name: 'WeChat', icon: 'fab fa-weixin', color: '#07C160' },
    'worldbook-app': { name: 'Worldbook', icon: 'fas fa-globe', color: '#007AFF' },
    'settings-app': { name: 'Settings', icon: 'fas fa-cog', color: '#8E8E93' },
    'theme-app': { name: 'Theme', icon: 'fas fa-paint-brush', color: '#5856D6' },
    'calendar-app': { name: '鏃ュ巻', icon: 'fas fa-calendar-alt', color: '#FF3B30' },
    'shopping-app': { name: 'Shop', icon: 'fas fa-shopping-bag', color: '#FF9500' },
    'forum-app': { name: 'Forum', icon: 'fas fa-comments', color: '#30B0C7' },
    'album-app': { name: 'Album', icon: 'fas fa-images', color: '#5AC8FA' },
    'phone-app': { name: 'Phone', icon: 'fas fa-mobile-alt', color: '#34C759' },
    'bank-app': { name: 'Bank', icon: 'fas fa-building-columns', color: '#1E66F5' },
    'icity-app': { name: 'iCity', icon: 'fas fa-city', color: '#000000' },
    'lookus-app': { name: 'LookUS', icon: 'fas fa-eye', color: '#FF2D55' },
    'music-app': { name: 'Music', icon: 'fas fa-music', color: '#FF2D55' }
};

function compressImage(file, maxWidth = 1024, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

function compressBase64(base64, maxWidth = 1024, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
                height = Math.round(height * (maxWidth / width));
                width = maxWidth;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedDataUrl);
        };
        img.onerror = (err) => resolve(base64);
    });
}

window.optimizeStorage = async function() {
    if (!confirm('Are you sure?')) return;

    showNotification('', 0);

    try {
        const tasks = [];

        if (state.contacts) {
            for (const c of state.contacts) {
                if (c.avatar && c.avatar.startsWith('data:image')) tasks.push(compressBase64(c.avatar, 300, 0.7).then(d => c.avatar = d));
                if (c.profileBg && c.profileBg.startsWith('data:image')) tasks.push(compressBase64(c.profileBg, 800, 0.7).then(d => c.profileBg = d));
                if (c.chatBg && c.chatBg.startsWith('data:image')) tasks.push(compressBase64(c.chatBg, 800, 0.7).then(d => c.chatBg = d));
                if (c.aiSettingBg && c.aiSettingBg.startsWith('data:image')) tasks.push(compressBase64(c.aiSettingBg, 800, 0.7).then(d => c.aiSettingBg = d));
                if (c.userSettingBg && c.userSettingBg.startsWith('data:image')) tasks.push(compressBase64(c.userSettingBg, 800, 0.7).then(d => c.userSettingBg = d));
                if (c.myAvatar && c.myAvatar.startsWith('data:image')) tasks.push(compressBase64(c.myAvatar, 300, 0.7).then(d => c.myAvatar = d));
                if (c.voiceCallBg && c.voiceCallBg.startsWith('data:image')) tasks.push(compressBase64(c.voiceCallBg, 800, 0.7).then(d => c.voiceCallBg = d));
                if (c.videoCallBgImage && c.videoCallBgImage.startsWith('data:image')) tasks.push(compressBase64(c.videoCallBgImage, 800, 0.7).then(d => c.videoCallBgImage = d));
            }
        }

        if (state.moments) {
            for (const m of state.moments) {
                if (!m.images) continue;
                for (let i = 0; i < m.images.length; i++) {
                    const img = m.images[i];
                    if (typeof img === 'string' && img.startsWith('data:image')) {
                        tasks.push(compressBase64(img, 800, 0.7).then(d => m.images[i] = d));
                    } else if (img && typeof img === 'object' && img.src && img.src.startsWith('data:image')) {
                        tasks.push(compressBase64(img.src, 800, 0.7).then(d => img.src = d));
                    }
                }
            }
        }

        if (state.chatHistory) {
            for (const contactId in state.chatHistory) {
                const msgs = state.chatHistory[contactId] || [];
                for (const msg of msgs) {
                    if ((msg.type === 'image' || msg.type === 'sticker') && msg.content && msg.content.startsWith('data:image')) {
                        tasks.push(compressBase64(msg.content, 800, 0.7).then(d => msg.content = d));
                    }
                }
            }
        }

        if (state.userProfile) {
            if (state.userProfile.avatar && state.userProfile.avatar.startsWith('data:image')) tasks.push(compressBase64(state.userProfile.avatar, 300, 0.7).then(d => state.userProfile.avatar = d));
            if (state.userProfile.bgImage && state.userProfile.bgImage.startsWith('data:image')) tasks.push(compressBase64(state.userProfile.bgImage, 800, 0.7).then(d => state.userProfile.bgImage = d));
            if (state.userProfile.momentsBgImage && state.userProfile.momentsBgImage.startsWith('data:image')) tasks.push(compressBase64(state.userProfile.momentsBgImage, 800, 0.7).then(d => state.userProfile.momentsBgImage = d));
        }

        if (state.music) {
            if (state.music.cover && state.music.cover.startsWith('data:image')) tasks.push(compressBase64(state.music.cover, 300, 0.7).then(d => state.music.cover = d));
            if (state.music.widgetBg && state.music.widgetBg.startsWith('data:image')) tasks.push(compressBase64(state.music.widgetBg, 800, 0.7).then(d => state.music.widgetBg = d));
        }

        if (state.polaroid) {
            if (state.polaroid.img1 && state.polaroid.img1.startsWith('data:image')) tasks.push(compressBase64(state.polaroid.img1, 600, 0.7).then(d => state.polaroid.img1 = d));
            if (state.polaroid.img2 && state.polaroid.img2.startsWith('data:image')) tasks.push(compressBase64(state.polaroid.img2, 600, 0.7).then(d => state.polaroid.img2 = d));
        }

        if (state.icons) {
            for (const appId in state.icons) {
                const icon = state.icons[appId];
                if (icon && icon.startsWith('data:image')) tasks.push(compressBase64(icon, 100, 0.7).then(d => state.icons[appId] = d));
            }
        }

        await Promise.all(tasks);
        await saveConfig();

        showNotification('', 'success');
        alert('Operation completed.');
    } catch (e) {
        console.error('Compression failed:', e);
        showNotification('', 'error');
        alert('Operation completed.');
    }
};

function handleAppClick(appId, appName) {
    console.log('Config migration completed.');

    if (appId === 'whisper-challenge-app') {
        if (window.GardenApp && typeof window.GardenApp.openWhisperChallengeFromActivities === 'function') {
            window.GardenApp.openWhisperChallengeFromActivities();
            return;
        }
        if (window.GardenApp && typeof window.GardenApp.openActivitiesView === 'function') {
            window.GardenApp.openActivitiesView();
            if (window.WhisperChallenge && typeof window.WhisperChallenge.openApp === 'function') {
                window.WhisperChallenge.openApp({ returnTarget: 'garden-activities' });
            }
            return;
        }
    }

    if (appId === 'garden-app') {
        if (window.GardenApp && typeof window.GardenApp.openApp === 'function') {
            window.GardenApp.openApp();
            return;
        }
    }

    const screen = document.getElementById(appId);
    if (screen) {
        screen.classList.remove('hidden');
        if (appId === 'wechat-app') {
            const chatScreen = document.getElementById('chat-screen');
            if (chatScreen) chatScreen.classList.add('hidden');

            const tabItems = screen.querySelectorAll('.wechat-tab-item');
            tabItems.forEach(item => item.classList.remove('active'));
            const contactsTab = screen.querySelector('.wechat-tab-item[data-tab="contacts"]');
            if (contactsTab) contactsTab.classList.add('active');

            const tabContents = screen.querySelectorAll('.wechat-tab-content');
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.classList.remove('fade-out');
                content.style.opacity = '';
            });
            const contactsContent = document.getElementById('wechat-tab-contacts');
            if (contactsContent) contactsContent.classList.add('active');

            if (window.updateWechatHeader) {
                window.updateWechatHeader('contacts');
            }
            if (window.renderContactList && window.iphoneSimState) {
                window.renderContactList(window.iphoneSimState.currentContactGroup || 'all');
            }
        }
        if (appId === 'calendar-app' && window.initCalendarAppView) {
            window.initCalendarAppView();
        }
        if (appId === 'bank-app' && window.initBankAppView) {
            window.initBankAppView();
        }
    } else {
        alert((appName || 'App') + ' is under development...');
    }
}
function showChatToast(message, duration = 2000) {
    const toast = document.getElementById('chat-toast');
    const text = document.getElementById('chat-toast-text');
    if (!toast || !text) return;

    text.textContent = message;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

function showNotification(message, duration = 0, type = 'info') {
    const notification = document.getElementById('summary-notification');
    const textEl = document.getElementById('summary-notification-text');
    const iconEl = notification.querySelector('i');

    if (!notification || !textEl) return;

    textEl.textContent = message;
    notification.classList.remove('hidden');
    
    notification.classList.remove('success');
    iconEl.className = 'fas fa-spinner fa-spin';

    if (type === 'success') {
        notification.classList.add('success');
        iconEl.className = 'fas fa-check-circle';
    }

    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('hidden');
        }, duration);
    }
}

let itineraryNotificationTimeout;
function showItineraryNotification(message, duration = 0, type = 'info') {
    const notification = document.getElementById('itinerary-notification');
    const textEl = document.getElementById('itinerary-notification-text');
    const iconEl = notification.querySelector('i');

    if (!notification || !textEl) return;

    if (itineraryNotificationTimeout) {
        clearTimeout(itineraryNotificationTimeout);
        itineraryNotificationTimeout = null;
    }

    textEl.textContent = message;
    notification.classList.remove('hidden');
    
    notification.classList.remove('success');
    notification.classList.remove('error');
    iconEl.className = 'fas fa-spinner fa-spin';

    if (type === 'success') {
        notification.classList.add('success');
        iconEl.className = 'fas fa-check-circle';
    } else if (type === 'error') {
        notification.classList.add('error');
        iconEl.className = 'fas fa-exclamation-circle';
    }

    if (duration > 0) {
        itineraryNotificationTimeout = setTimeout(() => {
            notification.classList.add('hidden');
        }, duration);
    }
}

function setupIOSFullScreen() {
    function isInStandaloneMode() {
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone ||
            document.referrer.includes('android-app://')
        );
    }

    function isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    if (isIOS() && isInStandaloneMode()) {
        document.body.classList.add('ios-standalone');
        if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
            const meta = document.createElement('meta');
            meta.name = 'apple-mobile-web-app-capable';
            meta.content = 'yes';
            document.head.appendChild(meta);
        }
    }

    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });

    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
}

window.analyzeStorageUsage = function() {
    if (!state) return;

    let totalSize = 0;
    const breakdown = [];

    for (const key in state) {
        if (!Object.prototype.hasOwnProperty.call(state, key)) continue;
        try {
            const jsonStr = JSON.stringify(state[key]);
            const size = jsonStr ? jsonStr.length : 0;
            totalSize += size;
            breakdown.push({ key, size });
        } catch (e) {
            console.error(`Error calculating size for ${key}:`, e);
        }
    }

    breakdown.sort((a, b) => b.size - a.size);

    let msg = "[Storage Usage]\n\n";
    msg += `Total (estimated): ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`;
    msg += "----------------\n";

    breakdown.slice(0, 15).forEach(item => {
        const sizeMB = (item.size / 1024 / 1024).toFixed(2);
        const percent = totalSize > 0 ? ((item.size / totalSize) * 100).toFixed(1) : "0.0";
        msg += `${item.key}: ${sizeMB} MB (${percent}%)\n`;
    });

    alert(msg);
    console.table(breakdown);
};

function saveConfig() {
    try {
        const persistState = Object.assign({}, state);
        try { delete persistState.selectedMessages; } catch (e) {}
        try { delete persistState.isMultiSelectMode; } catch (e) {}
        try { delete persistState.selectedStickers; } catch (e) {}
        
        return localforage.setItem('iphoneSimConfig', persistState).catch(err => {
            console.error('Operation failed. See details below.', err);
            if (err.name === 'QuotaExceededError') {
                alert('Operation completed.');
            }
        });
    } catch (e) {
        console.error('Operation failed. See details below.', e);
        return Promise.reject(e);
    }
}

async function loadConfig() {
    try {
        let loadedState = await localforage.getItem('iphoneSimConfig');
        
        if (!loadedState) {
            const localSaved = localStorage.getItem('iphoneSimConfig');
            if (localSaved) {
                try {
                    loadedState = JSON.parse(localSaved);
                    console.log('Config migration completed.');
                    await localforage.setItem('iphoneSimConfig', loadedState);
                    localStorage.removeItem('iphoneSimConfig');
                    console.log('Config migration completed.');
                } catch (e) {
                    console.error('Operation failed. See details below.', e);
                }
            }
        }

        if (loadedState) {
            Object.assign(state, loadedState);
            
            if (!state.fontPresets) state.fontPresets = [];
            if (!state.cssPresets) state.cssPresets = [];
            if (!state.aiSettings) state.aiSettings = { url: '', key: '', model: '', temperature: 0.7 };
            if (!state.aiPresets) state.aiPresets = [];
            if (!state.aiSettings2) state.aiSettings2 = { url: '', key: '', model: '', temperature: 0.7 };
            if (!state.aiPresets2) state.aiPresets2 = [];
            if (!state.whisperSettings) state.whisperSettings = { url: '', key: '', model: 'whisper-1' };
            if (!state.minimaxSettings) state.minimaxSettings = { url: 'https://api.minimax.chat/v1/t2a_v2', key: '', groupId: '', model: 'speech-01-turbo' };
            if (!state.novelaiSettings) state.novelaiSettings = { 
                url: 'https://api.novelai.net', 
                key: '', 
                model: 'nai-diffusion-3', 
                size: '832x1216',
                steps: 28,
                cfg: 5,
                sampler: 'k_euler_ancestral',
                seed: -1,
                ucPreset: 0,
                addQualityTags: true,
                smea: false,
                smeaDyn: false,
                defaultPrompt: '((full body shot:1.6)), (solo character:1.5), dynamic pose, 1boy, ((manly))',
                negativePrompt: 'lowres, bad anatomy, bad hands, text, error, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, normal quality, jpeg artifacts, signature, watermark, username, blurry',
                corsProxy: 'corsproxy.io'
            };
            if (!state.amapSettings) state.amapSettings = { key: '', securityCode: '' };
            if (!state.amapRuntime || typeof state.amapRuntime !== 'object') {
                state.amapRuntime = {
                    myLocation: null,
                    lastWeather: {},
                    lastResolvedContacts: {},
                    lastRoutes: {}
                };
            } else {
                if (!state.amapRuntime.myLocation || typeof state.amapRuntime.myLocation !== 'object') state.amapRuntime.myLocation = null;
                if (!state.amapRuntime.lastWeather || typeof state.amapRuntime.lastWeather !== 'object') state.amapRuntime.lastWeather = {};
                if (!state.amapRuntime.lastResolvedContacts || typeof state.amapRuntime.lastResolvedContacts !== 'object') state.amapRuntime.lastResolvedContacts = {};
                if (!state.amapRuntime.lastRoutes || typeof state.amapRuntime.lastRoutes !== 'object') state.amapRuntime.lastRoutes = {};
            }
            if (!state.chatWallpapers) state.chatWallpapers = [];
            if (!state.contacts) state.contacts = [];
            if (!state.chatHistory) state.chatHistory = {};
            if (!state.worldbook) state.worldbook = [];
            if (!state.userPersonas) state.userPersonas = [];
            if (!state.moments) state.moments = [];
            if (!state.icityFriendsPosts) state.icityFriendsPosts = [];
            if (!state.memories) state.memories = [];
            if (!state.memoryCandidates) state.memoryCandidates = [];
            state.memorySettingsV2 = normalizeMemorySettingsV2(state.memorySettingsV2);
            if (!state.defaultVirtualImageUrl) state.defaultVirtualImageUrl = '';
            if (!state.defaultMomentVirtualImageUrl) state.defaultMomentVirtualImageUrl = '';
            if (state.showStatusBar === undefined) state.showStatusBar = true;
            if (!state.iconColors) state.iconColors = {};
            if (!state.appNames) state.appNames = {};
            if (!state.iconPresets) state.iconPresets = [];
            if (!state.stickerCategories) state.stickerCategories = [];
            if (!state.contactGroups) state.contactGroups = [];
            if (!state.itineraries) state.itineraries = {};
            if (!state.music) state.music = {
                playing: false,
                cover: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
                src: '',
                title: 'Happy Together',
                artist: 'Maximillian',
                lyricsData: [
                    { time: 0, text: "So fast, I almost missed it" },
                    { time: 3, text: "I spill another glass of wine" },
                    { time: 6, text: "Kill the lights to pass the time" }
                ],
                lyricsFile: ''
            };
            if (!state.albumData || typeof state.albumData !== 'object') {
                state.albumData = null;
            } else {
                if (!Array.isArray(state.albumData.recentSections)) state.albumData.recentSections = [];
                if (!Array.isArray(state.albumData.albums)) state.albumData.albums = [];
            }
            if (!state.bankApp) state.bankApp = {
                initialized: false,
                cashBalance: 0.00,
                transactions: [],
                familyCardUsage: {},
                familyCardUsageMonthKey: '',
                unboundFamilyCards: []
            };
            if (!state.calendarApp || typeof state.calendarApp !== 'object') {
                state.calendarApp = {
                    selectedDate: '',
                    visibleMonth: '',
                    events: [],
                    schedule: {
                        termName: '',
                        termStartDate: '',
                        courses: []
                    }
                };
            }
            if (typeof state.calendarApp.selectedDate !== 'string') state.calendarApp.selectedDate = '';
            if (typeof state.calendarApp.visibleMonth !== 'string') state.calendarApp.visibleMonth = '';
            if (!Array.isArray(state.calendarApp.events)) state.calendarApp.events = [];
            if (!state.calendarApp.schedule || typeof state.calendarApp.schedule !== 'object') {
                state.calendarApp.schedule = {
                    termName: '',
                    termStartDate: '',
                    courses: []
                };
            }
            if (typeof state.calendarApp.schedule.termName !== 'string') state.calendarApp.schedule.termName = '';
            if (typeof state.calendarApp.schedule.termStartDate !== 'string') state.calendarApp.schedule.termStartDate = '';
            if (!Array.isArray(state.calendarApp.schedule.courses)) state.calendarApp.schedule.courses = [];
            const bankApp = state.bankApp;
            const migratedCash = Number.isFinite(Number(bankApp.cashBalance))
                ? Number(bankApp.cashBalance)
                : (Number.isFinite(Number(bankApp.balance))
                    ? Number(bankApp.balance)
                    : (Number.isFinite(Number(bankApp.totalBalance)) ? Number(bankApp.totalBalance) : 0));
            bankApp.cashBalance = migratedCash;
            if (!Array.isArray(bankApp.transactions)) bankApp.transactions = [];
            if (!bankApp.familyCardUsage || typeof bankApp.familyCardUsage !== 'object') bankApp.familyCardUsage = {};
            if (typeof bankApp.familyCardUsageMonthKey !== 'string') bankApp.familyCardUsageMonthKey = '';
            const unboundOld = Array.isArray(bankApp.unboundFamilyCardIds) ? bankApp.unboundFamilyCardIds : [];
            const unboundNew = Array.isArray(bankApp.unboundFamilyCards) ? bankApp.unboundFamilyCards : [];
            bankApp.unboundFamilyCards = Array.from(new Set([...unboundOld, ...unboundNew].map(String)));
            if (!state.polaroid) state.polaroid = {
                img1: 'https://placehold.co/300x300/eee/999?text=Photo',
                text1: 'Rainy day mood',
                img2: 'https://placehold.co/300x300/eee/999?text=Photo',
                text2: 'Good memory'
            };
            
            if (typeof state.music.lyrics === 'string') {
                state.music.lyricsData = [
                    { time: 0, text: state.music.lyrics.split('\n')[0] || 'No lyrics' }
                ];
                delete state.music.lyrics;
            }

            state.isMultiSelectMode = false;
            state.selectedMessages = new Set();
            state.selectedStickers = new Set();
            
            if (state.currentStickerCategoryId !== 'all' && !state.stickerCategories.find(c => c.id === state.currentStickerCategoryId)) {
                state.currentStickerCategoryId = 'all';
            }

            const memoryMigrationChanged = migrateMemorySchemaV2();
            const socialContentSanitized = sanitizeAutoGeneratedSocialContent();
            if (memoryMigrationChanged || socialContentSanitized) {
                saveConfig();
            }
        }
    } catch (e) {
        console.error('Operation failed. See details below.', e);
    }
}

window.updateAudioSession = function() {
    try {
        if (window.iphoneSimState.enableBackgroundAudio) {
            if (navigator.audioSession) {
                navigator.audioSession.type = 'play-and-record';
            }
            
            if ('mediaSession' in navigator) {
                navigator.mediaSession.playbackState = 'playing';
                if (!navigator.mediaSession.metadata && window.iphoneSimState.music) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: window.iphoneSimState.music.title || 'Background Audio',
                        artist: window.iphoneSimState.music.artist || 'iPhone Simulator',
                        artwork: [
                            { src: window.iphoneSimState.music.cover || 'https://placehold.co/512x512', sizes: '512x512', type: 'image/png' }
                        ]
                    });
                }
            }
        } else {
            if (navigator.audioSession) {
                navigator.audioSession.type = 'auto';
            }
        }
    } catch (e) {
        console.warn('Audio Session configuration failed:', e);
    }
};

function handleClearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localforage.clear().then(() => {
            localStorage.removeItem('iphoneSimConfig');
            alert('Operation completed.');
            location.reload();
        }).catch(err => {
            console.error('Operation failed. See details below.', err);
            alert('Operation completed.');
        });
    }
}

function exportJSON() {
    const exportAsZip = document.getElementById('export-as-zip');
    if (exportAsZip && exportAsZip.checked) {
        exportZIP();
    } else {
        const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'iphone-sim-config.json';
        a.click();
        URL.revokeObjectURL(url);
    }
}

function exportZIP() {
    if (typeof JSZip === 'undefined') {
        alert('Operation completed.');
        const exportAsZip = document.getElementById('export-as-zip');
        if (exportAsZip) exportAsZip.checked = false;
        exportJSON();
        return;
    }

    const zip = new JSZip();
    zip.file("iphone-sim-config.json", JSON.stringify(state));

    zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
            level: 9
        }
    })
        .then(function(content) {
            const url = URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'iphone-sim-config.zip';
            a.click();
            URL.revokeObjectURL(url);
        })
        .catch(function(err) {
            console.error('Operation failed. See details below.', err);
            alert('Operation completed.');
        });
}

function importJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const loadedState = JSON.parse(event.target.result);
            Object.assign(state, loadedState);
            
            saveConfig().then(() => {
                alert('Operation completed.');
                location.reload();
            });
        } catch (err) {
            alert('Operation completed.');
            console.error(err);
        }
    };
    reader.readAsText(file);
}

function applyConfig() {
    if (window.applyFont) applyFont(state.currentFont);
    if (window.applyMeetingFont && state.currentMeetingFont) {
        applyMeetingFont(state.currentMeetingFont);
    }
    if (window.applyWallpaper) applyWallpaper(state.currentWallpaper);
    if (window.applyIcons) applyIcons();
    if (window.applyCSS) applyCSS(state.css);
    if (window.applyMeetingCss) applyMeetingCss(state.meetingCss);
    if (window.toggleStatusBar) toggleStatusBar(state.showStatusBar);
}

function checkScheduledDiaries() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const todayStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;

    if (!window.iphoneSimState.contacts) return;

    window.iphoneSimState.contacts.forEach(contact => {
        if (contact.icityData && contact.icityData.autoDiaryEnabled && contact.icityData.autoDiaryTime) {
            if (contact.icityData.autoDiaryTime === currentTimeStr) {
                if (contact.icityData.lastAutoDiaryDate !== todayStr) {
                    console.log(`Triggering scheduled diary for ${contact.name} at ${currentTimeStr}`);
                    contact.icityData.lastAutoDiaryDate = todayStr;
                    saveConfig();
                    
                    if (window.generateScheduledContactDiary) {
                        window.generateScheduledContactDiary(contact);
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Config migration completed.');
    init();
    
    setInterval(checkScheduledDiaries, 60000);
    setTimeout(checkScheduledDiaries, 5000);
});

async function init() {
    setupIOSFullScreen();
    
    document.querySelectorAll('.dock-item').forEach(item => {
        item.addEventListener('click', () => {
            const appId = item.dataset.appId;
            const appName = item.querySelector('.app-label')?.textContent;
            handleAppClick(appId, appName);
        });
    });

    const closeBtn = document.getElementById('close-theme-app');
    const appScreen = document.getElementById('theme-app');
    if (closeBtn) closeBtn.addEventListener('click', () => appScreen.classList.add('hidden'));
    
    const closeSettingsBtn = document.getElementById('close-settings-app');
    const settingsAppScreen = document.getElementById('settings-app');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsAppScreen.classList.add('hidden'));

    const exportJsonBtn = document.getElementById('export-json');
    if (exportJsonBtn) exportJsonBtn.addEventListener('click', exportJSON);
    
    const importJsonInput = document.getElementById('import-json');
    if (importJsonInput) importJsonInput.addEventListener('change', importJSON);

    const clearAllDataBtn = document.getElementById('clear-all-data');
    if (clearAllDataBtn) clearAllDataBtn.addEventListener('click', handleClearAllData);

    const optimizeStorageBtn = document.getElementById('optimize-storage');
    if (optimizeStorageBtn) optimizeStorageBtn.addEventListener('click', window.optimizeStorage);

    const analyzeStorageBtn = document.getElementById('analyze-storage');
    if (analyzeStorageBtn) analyzeStorageBtn.addEventListener('click', window.analyzeStorageUsage);

    window.appInitFunctions.forEach(func => {
        if (typeof func === 'function') func();
    });

    try {
        await loadConfig();
    } catch (e) {
        console.error('Operation failed. See details below.', e);
    }

    if (window.reloadAlbumAppState) window.reloadAlbumAppState();

    if (window.updateLookusUi) window.updateLookusUi();

    if (window.initShoppingUI) window.initShoppingUI();

    if (window.renderIcityProfile) window.renderIcityProfile();
    if (window.renderIcityDiaryList) window.renderIcityDiaryList();
    if (window.renderIcityWorld) window.renderIcityWorld(); // Initialize world view content

    if (window.updateThemeUi) window.updateThemeUi();

    try {
        if (window.renderWallpaperGallery) renderWallpaperGallery();
    } catch (e) { console.error('Operation failed. See details below.', e); }

    try {
        if (window.renderChatWallpaperGallery) renderChatWallpaperGallery();
    } catch (e) { console.error('Operation failed. See details below.', e); }

    try {
        if (window.renderIconSettings) renderIconSettings();
    } catch (e) { console.error('Operation failed. See details below.', e); }

    try {
        applyConfig();
    } catch (e) { console.error('Operation failed. See details below.', e); }
    
    if (window.initMusicWidget) initMusicWidget();
    if (window.initPolaroidWidget) initPolaroidWidget();
    if (window.initMeetingTheme) initMeetingTheme();

    if (window.renderIconPresets) renderIconPresets();
    if (window.renderFontPresets) renderFontPresets();
    if (window.renderCssPresets) renderCssPresets();
    if (window.renderMeetingCssPresets) renderMeetingCssPresets();
    if (window.renderAiPresets) {
        renderAiPresets();
        renderAiPresets(true);
    }
    if (window.updateAiUi) {
        updateAiUi();
        updateAiUi(true);
    }
    if (window.updateWhisperUi) updateWhisperUi();
    if (window.updateMinimaxUi) updateMinimaxUi();
    if (window.updateNovelAiUi) window.updateNovelAiUi();
    if (window.updateSystemSettingsUi) updateSystemSettingsUi();
    if (window.updateAudioSession) window.updateAudioSession();
    if (window.renderContactList) renderContactList();
    if (window.migrateWorldbookData) migrateWorldbookData();
    if (window.renderWorldbookCategoryList) renderWorldbookCategoryList();
    if (window.renderMeTab) renderMeTab();
    if (window.renderMoments) renderMoments();
    if (window.applyChatMultiSelectClass) applyChatMultiSelectClass();
    
    if (window.initGrid) window.initGrid();
    
    const refreshButtons = ['close-theme-app', 'close-theme-icons', 'close-theme-wallpaper', 'reset-icons'];
    refreshButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => {
                setTimeout(() => {
                    if (window.renderItems) window.renderItems(); 
                }, 50);
            });
        }
    });
}

